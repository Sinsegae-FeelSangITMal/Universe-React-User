import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import SubtitleDisplay from '../../components/subtitle/SubtitleDisplay';
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';

const SUBTITLE_API_URL = 'http://localhost:8080'; // 자막 처리 서버
const SERVER_URL = 'http://192.168.56.1:4000';
const CHAT_WS_URL = '/ws';                       // Vite proxy → chat-server:8888

// artistId 기반 토픽
const TOPIC_SUBSCRIBE = (id) => `/topic/public/${id ?? 'global'}`;
const APP_SEND = (id) => `/app/live/${id ?? 'global'}`;

const Viewer = () => {
  const { artistId, liveId } = useParams();
  const remoteVideoRef = useRef(null);
  const composingRef = useRef(false); // ← IME 조합 상태
  const [streamStatus, setStreamStatus] = useState('waiting');
  const [isStreamAvailable, setIsStreamAvailable] = useState(false);
  const [chatList, setChatList] = useState([]); // 서버 브로드캐스트만 표시
  const [chatInput, setChatInput] = useState('');
  const [subtitle, setSubtitle] = useState(null);
  const [selectedLang, setSelectedLang] = useState("ko");
  const [viewerCount, setViewerCount] = useState(0);

  const chatMessagesRef = useRef(null);
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const recvTransportRef = useRef(null);
  const subtitleTimerRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const [products] = useState([
    {
      id: 1,
      name: "The 1st Mini Album [From JOY, with Love] (To You Ver.)",
      price: 39300,
      img: "/assets/img/hero/product1.png",
      option: ["수량 선택", "1개", "2개", "3개"]
    },
    {
      id: 2,
      name: "The 2nd Mini Album [From WINTER, Always Yours]",
      price: 40200,
      img: "/assets/img/hero/product2.png",
      option: ["수량 선택", "1개", "2개", "3개"]
    },
    {
      id: 3,
      name: "Official Lightstick (에스파 응원봉)",
      price: 55000,
      img: "/assets/img/hero/product3.png",
      option: ["수량 선택", "1개", "2개"]
    },
    {
      id: 4,
      name: "Photocard Set (랜덤 5종)",
      price: 18000,
      img: "/assets/img/hero/product4.png",
      option: ["수량 선택", "1세트", "2세트", "3세트"]
    },
  ]);


  // 브라우저 고정 닉네임(표시용)
  const [sender] = useState(() => {
    const saved = localStorage.getItem('chatSender');
    if (saved) return saved;
    const nick = '유저' + Math.floor(Math.random() * 1000);
    localStorage.setItem('chatSender', nick);
    return nick;
  });

  // 숫자 사용자 ID(서버와 통신용)
  const myUserId = useRef(
    Number(localStorage.getItem('userId') || 0)
  );

  // ===== 채팅 자동 스크롤 =====
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatList]);


  const consumeStream = async (socket) => {
    try {
      console.log('[mediasoup] getRouterRtpCapabilities');
      const routerRtpCapabilities = await new Promise((resolve) =>
        socket.emit('getRouterRtpCapabilities', resolve)
      );
      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities });
      console.log('[mediasoup] device loaded');

      const transportParams = await new Promise((resolve) =>
        socket.emit('createWebRtcTransport', { sending: false }, resolve)
      );
      const recvTransport = device.createRecvTransport(transportParams);
      recvTransport.on('connect', ({ dtlsParameters }, cb) => {
        socket.emit('connectTransport', { dtlsParameters }, cb);
      });

      const consumerParams = await new Promise((resolve) =>
        socket.emit('consume', { rtpCapabilities: device.rtpCapabilities }, resolve)
      );
      if (consumerParams?.error) {
        console.warn('[mediasoup] no producer, wait…');
        setIsStreamAvailable(false);
        socket.once('new-producer', () => consumeStream(socket));
        return;
      }

      const consumer = await recvTransport.consume(consumerParams);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = new MediaStream([consumer.track]);
      }
      setIsStreamAvailable(true);
      console.log('[mediasoup] stream started');

      await new Promise((resolve) => socket.emit('resume-consumer', resolve));
    } catch (e) {
      console.error('[mediasoup] consume error:', e);
      setIsStreamAvailable(false);
    }
  };

  // ===== STOMP/SockJS (채팅) - broadcast만 렌더 =====
  const stompRef = useRef(null);
  useEffect(() => {
    console.log('[chat] connect →', CHAT_WS_URL, 'topic:', TOPIC_SUBSCRIBE(artistId));
    const sock = new SockJS(CHAT_WS_URL);
    const client = new StompClient({
      webSocketFactory: () => sock,
      reconnectDelay: 4000,
      onConnect: (frame) => {
        console.log('[chat] STOMP connected:', frame?.headers);
        // artistId 방 구독
        client.subscribe(TOPIC_SUBSCRIBE(artistId), (f) => {
          console.log('[chat] message:', f.body);
          try {
            const body = JSON.parse(f.body);
            // 서버: { roomId, senderId, content, contentType, createdAt }
            setChatList((prev) => [
              ...prev,
              {
                id: `${body.createdAt ?? Date.now()}-${Math.random()}`, // key 충돌 방지
                senderId: body.senderId ?? 0,
                text: body.content ?? '',
                type: body.contentType === 'SYSTEM' ? 'admin' : 'user',
              },
            ]);
          } catch {
            setChatList((prev) => [
              ...prev,
              { id: `${Date.now()}-${Math.random()}`, senderId: -1, text: f.body, type: 'admin' },
            ]);
          }
        });
      },
      onStompError: (f) => console.error('[chat] STOMP error:', f?.headers, f?.body),
      onWebSocketClose: (e) => console.warn('[chat] WS closed:', e?.code, e?.reason),
      debug: () => { },
    });
    client.activate();
    stompRef.current = client;

    return () => {
      try { client.deactivate(); } catch { }
      stompRef.current = null;
      console.log('[chat] STOMP deactivated');
    };
  }, [artistId]);

  // ===== 채팅 입력 =====
  const handleChatInput = (e) => setChatInput(e.target.value);

  const handleChatKeyDown = (e) => {
    // IME(한글) 조합 중이면 엔터 무시
    if (e.key === 'Enter') {
      if (composingRef.current || e.nativeEvent.isComposing) return;
      handleChatSend();
    }
  };

  const handleChatSend = () => {
    const text = chatInput.trim();
    if (!text) return;

    if (!stompRef.current?.connected) {
      alert('채팅 서버와 연결되지 않았습니다.');
      return;
    }

    // ChatMessageRequest DTO에 맞춘 payload
    const payload = {
      roomId: Number(artistId) || 0,
      senderId: myUserId.current,     // 숫자 ID
      content: text,                  // 본문
      contentType: 'TEXT',
      createdAt: new Date().toISOString(), // 서버에서 now 찍어도 OK
    };
    console.log('[chat] publish →', APP_SEND(artistId), payload);

    stompRef.current.publish({
      destination: APP_SEND(artistId),
      body: JSON.stringify(payload),
    });

    // 서버 broadcast 수신 시에만 chatList 추가
      setChatInput('');
    };
  
    // ===== 소켓/스트림/자막 useEffect (컴포넌트 최상위에 위치) =====
    useEffect(() => {
      const socket = io(SERVER_URL, {
        query: { role: "viewer" } // 역할 구분 (방송자는 broadcaster)
      });
      socketRef.current = socket;
  
      // 여기에서 방 참여 요청!
      socket.emit("join-live", { liveId });
  
      // 시청자 수
      socket.on("viewer-count", (count) => {
        console.log("📊 현재 시청자 수:", count);
        setViewerCount(count);
      });
  
      // 자막 이벤트
      const handleSubtitleEvent = (data) => {
        try {
          let payload = data;
          if (typeof data === "string") payload = { original: data };
          if (payload.liveId && payload.liveId !== liveId) return;
  
          const incoming = payload.subtitle || payload;
          const normalized = typeof incoming === "string" ? { original: incoming } : incoming;
  
          if (normalized && normalized.original) {
            setSubtitle(normalized);
            if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
            subtitleTimerRef.current = setTimeout(() => setSubtitle(null), 6000);
          }
        } catch (err) {
          console.error("자막 처리 중 오류", err);
        }
      };
      socket.on("subtitle", handleSubtitleEvent);
      socket.on("subtitle-update", handleSubtitleEvent);
  
      // 🎥 Mediasoup 설정
      const consume = async () => {
        if (!deviceRef.current || !recvTransportRef.current) return;
        try {
          const { rtpCapabilities } = deviceRef.current;
          const consumerParams = await new Promise((r) => socket.emit("consume", { rtpCapabilities }, r));
  
          if (consumerParams.error) {
            setStreamStatus("waiting");
            socket.once("new-producer", consume);
            return;
          }
  
          const consumer = await recvTransportRef.current.consume(consumerParams);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = new MediaStream([consumer.track]);
          }
          setStreamStatus("streaming");
          socket.emit("resume-consumer");
        } catch (error) {
          console.error("Consume 실패:", error);
          setStreamStatus("waiting");
        }
      };
  
      const setupMediasoup = async () => {
        try {
          const routerRtpCapabilities = await new Promise((r) => socket.emit("getRouterRtpCapabilities", r));
          const device = new mediasoupClient.Device();
          await device.load({ routerRtpCapabilities });
          deviceRef.current = device;
  
          const transportParams = await new Promise((r) =>
            socket.emit("createWebRtcTransport", { sending: false }, r)
          );
          const transport = device.createRecvTransport(transportParams);
          recvTransportRef.current = transport;
  
          transport.on("connect", ({ dtlsParameters }, callback, errback) => {
            socket.emit("connectTransport", { dtlsParameters }, (error) => {
              if (error) {
                errback(new Error(error));
                return;
              }
              callback();
            });
          });
  
          consume();
        } catch (error) {
          console.error("Mediasoup 설정 실패:", error);
          setStreamStatus("waiting");
        }
      };
  
      socket.on("connect", setupMediasoup);
  
      socket.on("producer-closed", () => {
        setStreamStatus("ended");
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  
        // 방송 종료 시 자막 및 폴링도 정리
        setSubtitle(null);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      });
  
      return () => {
        socket.off("connect", setupMediasoup);
        socket.off("producer-closed");
        socket.off("new-producer", consume);
        socket.off("subtitle", handleSubtitleEvent);
        socket.off("subtitle-update", handleSubtitleEvent);
  
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        if (subtitleTimerRef.current) {
          clearTimeout(subtitleTimerRef.current);
          subtitleTimerRef.current = null;
        }
        recvTransportRef.current?.close();
        socket.disconnect();
      };
    }, [liveId, streamStatus]);
  
    return (
      <div className="live-page-container">
        {/* 상단 타이틀 */}
        <div className="live-page-header">
          <h2 className="live-page-artist">에스파 <span style={{ color: '#7c4dff' }}>LIVE</span></h2>
          <hr className="live-page-hr" />
          <p className="live-page-desc">
            ♡에스파 공식 25FW MD REVIEW♡ 2025.01.15 8PM OPEN!<br />
          </p>
        </div>

        {/* 영상 + 채팅 */}
        <div className="live-page-stream-section">
          <div className="live-page-video-wrapper" style={{ position: "relative" }}>
            <div className="viewer-count-badge">
              👀 {viewerCount}명 시청중
            </div>
            <video ref={remoteVideoRef} autoPlay muted className="live-page-video" />
            {!isStreamAvailable && streamStatus === 'waiting' && <p className="live-page-waiting">방송 시작을 기다리는 중...</p>}
            {!isStreamAvailable && streamStatus === 'ended' && <p className="live-page-waiting">방송이 종료되었습니다.</p>}
            {/* 🔥 자막 표시 */}
            {streamStatus === "streaming" && (
              <>
                <SubtitleDisplay subtitle={subtitle} selectedLang={selectedLang} />

                {/* 자막 언어 선택 드롭다운 */}
                <div className="subtitle-select-wrapper">
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                  >
                    <option value="none">자막 없음</option>
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="live-page-chat-section" style={{ height: '100%' }}>
            <div className="live-page-chat-title">실시간 채팅</div>
            <div className="live-page-chat-messages" ref={chatMessagesRef}>
              {chatList.map((msg) => {
                const isMine = msg.senderId === myUserId.current && msg.type !== 'admin';
                const name = isMine ? '나' : (msg.type === 'admin' ? '시스템' : '익명');
                return (
                  <div key={msg.id} className={msg.type === 'admin' ? 'live-page-chat-admin' : 'live-page-chat-user'}>
                    <span className="live-page-chat-sender" style={{ color: msg.type === 'admin' ? '#3b4fff' : '#222', fontWeight: 600 }}>
                      {name}:
                    </span>{' '}
                    <span className="live-page-chat-text">{msg.text}</span>
                  </div>
                );
              })}
            </div>
            <div className="live-page-chat-input-wrap">
              <input
                type="text"
                className="live-page-chat-input"
                placeholder="메시지 보내기.."
                value={chatInput}
                onChange={handleChatInput}
                onCompositionStart={() => { composingRef.current = true; }}   // ← IME 시작
                onCompositionEnd={() => { composingRef.current = false; }}    // ← IME 종료
                onKeyDown={handleChatKeyDown}
              />
            </div>
          </div>
        </div>





        {/* 상품 목록 */}
        <div className="live-page-products-section">
          <h3 className="live-page-products-title">라이브 상품 목록</h3>
          <div className="live-page-product-list">
            {products.map((p) => (
              <div key={p.id} className="live-page-product-card live-page-product-card-wide">
                <img src={p.img} alt={p.name} className="live-page-product-img" />
                <div className="live-page-product-info">
                  <div className="live-page-product-name">{p.name}</div>
                  <div className="live-page-product-option-row">
                    <span className="live-page-product-option-label">To You Ver.</span>
                    <select className="live-page-product-option-select">
                      {p.option.map((opt, i) => (
                        <option key={i} value={opt} disabled={i === 0}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="live-page-product-price-col">
                  <span className="live-page-product-price">KRW<span style={{ marginLeft: 2 }}>
                    ₩{p.price.toLocaleString()}</span></span>
                </div>
                <div className="live-page-product-buttons-col">
                  <button className="live-page-btn-cart live-page-btn-outline">장바구니</button>
                  <button className="live-page-btn-buy live-page-btn-filled">주문하기</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  export default Viewer;
