import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth';

// API 유틸
import { getStream } from "../../utils/StreamApi";
import { getStreamProductsByStream } from "../../utils/StreamProductApi";
import { getPromotion } from "../../utils/PromotionApi";
import SubtitleDisplay from '../../components/subtitle/SubtitleDisplay';

// ===== 서버 엔드포인트 =====
const SERVER_URL = 'http://172.20.10.10:4000'; // Mediasoup signaling server
const CHAT_API_BASE_URL = 'http://localhost:7777'; // Universe API server
const CHAT_WS_URL = '/ws'; // Universe Chat WebSocket (via proxy)

// artistId 기반 STOMP 토픽
const TOPIC_SUBSCRIBE = (id) => `/topic/public/${id ?? 'global'}`;
const APP_SEND = (id) => `/app/live/${id ?? 'global'}`;

const MergedLivePage = () => {
  const { artistId, liveId } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useAuthStore();

  // ===== Refs =====
  const remoteVideoRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const composingRef = useRef(false);
  const stompRef = useRef(null);
  // Video refs from Viewer.jsx
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const recvTransportRef = useRef(null);
  const subtitleTimerRef = useRef(null);

  // ===== States =====
  // Chat states from LivePage.jsx
  const [chatList, setChatList] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [muteSecondsLeft, setMuteSecondsLeft] = useState(0);
  const [isBanned, setIsBanned] = useState(false);
  // Video/Data states from Viewer.jsx
  const [streamStatus, setStreamStatus] = useState('waiting');
  const [isStreamAvailable, setIsStreamAvailable] = useState(false);
  const [subtitle, setSubtitle] = useState(null);
  const [selectedLang, setSelectedLang] = useState("ko");
  const [viewerCount, setViewerCount] = useState(0);
  const [streamInfo, setStreamInfo] = useState(null);
  const [promotion, setPromotion] = useState(null);
  const [productDetails, setProductDetails] = useState([]);

  // Auth info from LivePage.jsx (using useAuthStore)
  const myUserId = user?.userId || 0;

  // ===== Effects =====

  // 채팅 자동 스크롤 (from LivePage)
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatList]);

  // 데이터 불러오기 (from Viewer)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const streamResp = await getStream(liveId);
        const s = streamResp?.data?.data || streamResp?.data || {};
        setStreamInfo({ title: s.title, artistName: s.artistName });

        const promoId = s?.promotionId ?? s?.promotion_id ?? s?.PR_ID;
        if (promoId) {
          const pr = await getPromotion(promoId);
          const d = pr?.data?.data || pr?.data || {};
          setPromotion({ ...d });
        }

        const spResp = await getStreamProductsByStream(liveId);
        const spList = Array.isArray(spResp?.data?.data) ? spResp.data.data : [];
        const products = spList.map(sp => ({ ...(sp.product || {}) }));
        setProductDetails(products);
      } catch (err) {
        console.error("프로모션/상품 불러오기 실패:", err);
      }
    };
    fetchData();
  }, [liveId]);

  // STOMP/SockJS 채팅 (from LivePage - a more advanced version)
  useEffect(() => {
    if (!accessToken) {
      console.warn('[chat] No access token, STOMP connection not attempted.');
      return;
    }
    const sock = new SockJS(CHAT_WS_URL);
    const client = new StompClient({
      webSocketFactory: () => sock,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 4000,
      onConnect: (frame) => {
        client.subscribe(TOPIC_SUBSCRIBE(artistId), (f) => {
          try {
            const body = JSON.parse(f.body);
            setChatList((prev) => [...prev, { id: `${body.createdAt ?? Date.now()}-${Math.random()}`, senderId: body.senderId ?? 0, nickname: body.nickname ?? '익명', text: body.content ?? '', type: body.contentType === 'SYSTEM' ? 'admin' : 'user', createdAt: body.createdAt }]);
          } catch {
            setChatList((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, senderId: -1, nickname: '시스템', text: f.body, type: 'admin' }]);
          }
        });
        client.subscribe(`/queue/system-${myUserId}`, (message) => {
          try {
            const payload = JSON.parse(message.body);
            if (payload.code === 'BANNED') {
              setIsBanned(true);
            } else if (payload.code === 'MUTED') {
              toast(payload.message, { icon: '🤫' });
              setIsMuted(true);
              setMuteSecondsLeft(30);
            }
          } catch (e) {
            toast.error(message.body);
          }
        });
      },
      onStompError: (frame) => console.error('Broker error', frame),
      onWebSocketClose: () => console.log('WS closed'),
    });
    client.activate();
    stompRef.current = client;
    return () => { client.deactivate(); };
  }, [artistId, accessToken, myUserId, navigate]);

  // Mediasoup 영상 (from Viewer - a more advanced version)
  useEffect(() => {
    const socket = io(SERVER_URL, { query: { role: "viewer" } });
    socketRef.current = socket;
    socket.emit("join-live", { liveId });
    socket.on("viewer-count", setViewerCount);

    const handleSubtitle = (data) => {
      const payload = typeof data === 'string' ? { original: data } : data;
      if (payload.liveId && String(payload.liveId) !== String(liveId)) return;
      if (payload?.original) {
        setSubtitle(payload);
        if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
        subtitleTimerRef.current = setTimeout(() => setSubtitle(null), 6000);
      }
    };
    socket.on("subtitle", handleSubtitle);
    socket.on("subtitle-update", handleSubtitle);

    const setupMediasoup = async () => {
      try {
        const routerRtpCapabilities = await new Promise(r => socket.emit("getRouterRtpCapabilities", r));
        const device = new mediasoupClient.Device();
        await device.load({ routerRtpCapabilities });
        deviceRef.current = device;

        const transportParams = await new Promise(r => socket.emit("createWebRtcTransport", { sending: false }, r));
        const transport = device.createRecvTransport(transportParams);
        recvTransportRef.current = transport;

        transport.on("connect", ({ dtlsParameters }, cb, eb) => socket.emit("connectTransport", { dtlsParameters }, e => e ? eb(e) : cb()));
        
        const consume = async () => {
          const { rtpCapabilities } = deviceRef.current;
          const params = await new Promise(r => socket.emit("consume", { rtpCapabilities }, r));
          if (params?.error) {
            setIsStreamAvailable(false);
            setStreamStatus("waiting");
            socket.once("new-producer", consume);
            return;
          }
          const consumer = await transport.consume(params);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = new MediaStream([consumer.track]);
          setIsStreamAvailable(true);
          setStreamStatus("streaming");
          socket.emit("resume-consumer");
        };
        consume();
      } catch (err) {
        console.error("Mediasoup setup failed:", err);
      }
    };

    socket.on("connect", setupMediasoup);
    socket.on("producer-closed", () => {
      setStreamStatus("ended");
      setIsStreamAvailable(false);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    });

    return () => { socket.disconnect(); recvTransportRef.current?.close(); };
  }, [liveId]);

  // Mute 타이머 (from LivePage)
  useEffect(() => {
    if (!isMuted || muteSecondsLeft <= 0) {
      if (isMuted) setIsMuted(false);
      return;
    }
    const timerId = setInterval(() => setMuteSecondsLeft(p => p - 1), 1000);
    return () => clearInterval(timerId);
  }, [isMuted, muteSecondsLeft]);

  // Ban 체크 (from LivePage)
  useEffect(() => {
    if (myUserId && artistId) {
      const checkBanStatus = async () => {
        try {
          const res = await fetch(`${CHAT_API_BASE_URL}/api/moderation/status?userId=${myUserId}&roomId=${artistId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.isBanned) setIsBanned(true);
          }
        } catch (e) {
          console.error("Ban check failed:", e);
        }
      };
      checkBanStatus();
    }
  }, [myUserId, artistId]);

  // 최근 메시지 불러오기 (from LivePage)
  useEffect(() => {
    if (artistId) {
      const fetchRecent = async () => {
        try {
          const res = await fetch(`${CHAT_API_BASE_URL}/api/rooms/${artistId}/messages`);
          if (res.ok) {
            const history = await res.json();
            const formatted = history.map(m => ({ id: `${m.createdAt ?? Date.now()}-${Math.random()}`, senderId: m.senderId ?? 0, nickname: m.nickname ?? '익명', text: m.content ?? '', type: m.contentType === 'SYSTEM' ? 'admin' : 'user', createdAt: m.createdAt }));
            setChatList(formatted);
          }
        } catch (e) {
          console.error("Failed to fetch recent messages:", e);
        }
      };
      fetchRecent();
    }
  }, [artistId]);

  // ===== 핸들러 함수 =====
  const handleChatSend = () => {
    const text = chatInput.trim();
    if (!text || !stompRef.current?.connected) return;
    stompRef.current.publish({ destination: APP_SEND(artistId), body: JSON.stringify({ content: text }) });
    setChatInput('');
  };

  // ===== 렌더링 =====
  if (isBanned) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <h2>🚫 접근이 차단되었습니다 🚫</h2>
        <p>이 라이브에 대한 접근 권한이 없습니다.</p>
        <button onClick={() => navigate('/main')}>메인으로 돌아가기</button>
      </div>
    );
  }

  return (
    <div className="live-page-container">
      <div className="live-page-header">
        <h2 className="live-page-artist">{streamInfo?.artistName || '아티스트'} <span style={{ color: '#7c4dff' }}>LIVE</span></h2>
        <p className="live-page-desc">{streamInfo?.title || '방송 정보 로딩 중...'}</p>
      </div>

      <div className="live-page-stream-section">
        <div className="live-page-video-wrapper" style={{ position: "relative" }}>
          <div className="viewer-count-badge">👀 {viewerCount}명 시청중</div>
          <video ref={remoteVideoRef} autoPlay muted className="live-page-video" />
          {!isStreamAvailable && streamStatus === 'waiting' && <p className="live-page-waiting">방송 시작을 기다리는 중...</p>}
          {!isStreamAvailable && streamStatus === 'ended' && <p className="live-page-waiting">방송이 종료되었습니다.</p>}
          {streamStatus === "streaming" && <SubtitleDisplay subtitle={subtitle} selectedLang={selectedLang} />}
        </div>

        <div className="live-page-chat-section" style={{ height: '100%' }}>
          <div className="live-page-chat-title">실시간 채팅</div>
          <div className="live-page-chat-messages" ref={chatMessagesRef}>
            {chatList.map((msg) => {
              const isMine = msg.senderId === myUserId && msg.type !== 'admin';
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', margin: '5px 0' }}>
                  <div className={msg.type === 'admin' ? 'live-page-chat-admin' : 'live-page-chat-user'} style={{ maxWidth: '70%' }}>
                    <span className="live-page-chat-sender" style={{ fontWeight: 600 }}>{isMine ? '나' : msg.nickname}:</span>{' '}
                    <span className="live-page-chat-text">{msg.text}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="live-page-chat-input-wrap">
            <input
              type="text"
              className="live-page-chat-input"
              placeholder={isMuted ? `${muteSecondsLeft}초 동안 채팅이 금지되었습니다.` : "메시지 보내기.."}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !composingRef.current && handleChatSend()}
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={() => { composingRef.current = false; }}
              disabled={isMuted}
            />
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginTop: '30px' }}>
        <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>🎁 프로모션 상품</h3>
        {promotion ? (
          <div>{promotion.name}</div>
        ) : (
          <div>등록된 프로모션이 없습니다.</div>
        )}
      </div>

      <div className="live-page-products-section">
        <h3 className="live-page-products-title">라이브 상품 목록</h3>
        <div className="live-page-product-list">
          {productDetails.length > 0 ? productDetails.map((p) => (
            <div key={p.id} className="live-page-product-card live-page-product-card-wide">
              <img src={p.img ? `${CHAT_API_BASE_URL}${p.img}` : '/assets/img/placeholder/240.png'} alt={p.name} className="live-page-product-img" />
              <div className="live-page-product-info">
                <div className="live-page-product-name">{p.name}</div>
              </div>
              <div className="live-page-product-price-col">
                <span className="live-page-product-price">₩{Number(p.price || 0).toLocaleString()}</span>
              </div>
              <div className="live-page-product-buttons-col">
                <button className="live-page-btn-cart live-page-btn-outline">장바구니</button>
                <button className="live-page-btn-buy live-page-btn-filled">주문하기</button>
              </div>
            </div>
          )) : (
            <div className="live-page-product-empty">등록된 상품이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MergedLivePage;
