// src/pages/live/Viewer.jsx
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import SubtitleDisplay from '../../components/subtitle/SubtitleDisplay';
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';

// 🔽 API 유틸
import { getStream } from "../../utils/StreamApi";
import { getStreamProductsByStream } from "../../utils/StreamProductApi";
import { getProduct } from "../../utils/ProductApi";
import { getPromotion } from "../../utils/PromotionApi";

const SUBTITLE_API_URL = import.meta.env.VITE_LIVE_URL;
const SERVER_URL = import.meta.env.VITE_MEDIASOUP_HOST;
const CHAT_WS_URL = import.meta.env.VITE_CHAT_WS_URL || '/ws';
const STOMP_BROKER_URL = import.meta.env.VITE_STOMP_BROKER_URL || `${import.meta.env.VITE_WS_URL}/ws`;
const TOPIC_SUBSCRIBE = (id) => `/topic/public/${id ?? 'global'}`;
const APP_SEND = (id) => `/app/live/${id ?? 'global'}`;

const Viewer = () => {
  const { artistId, liveId } = useParams();

  // ===== Refs =====
  const remoteVideoRef = useRef(null);
  const composingRef = useRef(false);
  const chatMessagesRef = useRef(null);
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const recvTransportRef = useRef(null);
  const subtitleTimerRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const stompRef = useRef(null);

  // ===== States =====
  const [streamStatus, setStreamStatus] = useState('waiting');
  const [isStreamAvailable, setIsStreamAvailable] = useState(false);
  const [chatList, setChatList] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [subtitle, setSubtitle] = useState(null);
  const [selectedLang, setSelectedLang] = useState("ko");
  const [viewerCount, setViewerCount] = useState(0);
  const [streamInfo, setStreamInfo] = useState(null);

  // 🔽 프로모션/상품
  const [promotion, setPromotion] = useState(null);
  const [productDetails, setProductDetails] = useState([]);

  // 브라우저 닉네임
  const [sender] = useState(() => {
    const saved = localStorage.getItem('chatSender');
    if (saved) return saved;
    const nick = '유저' + Math.floor(Math.random() * 1000);
    localStorage.setItem('chatSender', nick);
    return nick;
  });

  // 사용자 ID
  const myUserId = useRef(Number(localStorage.getItem('userId') || 0));

  // 채팅 자동 스크롤
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatList]);

  // ===== 프로모션/상품 불러오기 =====
  const pick = (...cands) => cands.find(v => v !== undefined && v !== null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) 스트림
        const streamResp = await getStream(liveId);
        const s = streamResp?.data?.data || streamResp?.data || {};

        setStreamInfo({
          id: s.id,
          title: s.title,
          artistName: s.artistName,
          time: s.time,
          endTime: s.endTime,
          status: s.status,
        });

        const promoId = s?.promotionId ?? s?.promotion_id ?? s?.PR_ID;
        console.log("liveId :", liveId, "promoId :", promoId);

        // 2) 프로모션
        if (promoId) {
          const pr = await getPromotion(promoId);
          const d = pr?.data?.data || pr?.data || {};
          setPromotion({
            id: d.pmId ?? d.id,
            name: d.pmName ?? d.name,
            description: d.pmDesc ?? d.description,
            img: d.pmImg ?? d.img ?? d.imagePath,
            price: d.pmPrice ?? d.price,
            fanOnly: d.pmFanOnly ?? d.fanOnly,
            stockQty: d.pmStockQty ?? d.stockQty,
            limitPerUser: d.pmLimitPerUser ?? d.limitPerUser,
            coupon: d.pmCoupon ?? d.coupon,
          });
        } else {
          setPromotion(null);
        }

        // 3) 스트림-상품 매핑 (★ 여기만 핵심 수정)
        const spResp = await getStreamProductsByStream(liveId);
        const spList = Array.isArray(spResp?.data?.data)
          ? spResp.data.data
          : [];

        // 4) productResponse 그대로 매핑
        const products = spList.map(sp => {
          const p = sp.product || {};
          return {
            id: p.id,
            name: p.name,
            img: p.img ?? p.imagePath ?? p.thumb ?? null,
            price: p.price ?? 0,
            description: p.description ?? "",
            fanOnly: p.fanOnly ?? false,
            stockQty: p.stockQty ?? 0,
            limitPerUser: p.limitPerUser ?? 1,
            artistName: p.artistName ?? "",
            option: ["수량 선택", "1개", "2개", "3개"],
          };
        });

        setProductDetails(products);
        console.log("products :", products);
      } catch (err) {
        console.error("프로모션/상품 불러오기 실패:", err);
        setPromotion(null);
        setProductDetails([]);
      }
    };

    fetchData();
  }, [liveId]);



  // ===== STOMP / SockJS =====
  useEffect(() => {
    console.log('[chat] connect →', CHAT_WS_URL, 'topic:', TOPIC_SUBSCRIBE(artistId));

    let client;

    const onStompConnected = (frame) => {
      console.log('[chat] STOMP connected:', frame?.headers);
      client.subscribe(TOPIC_SUBSCRIBE(artistId), (f) => {
        try {
          const body = JSON.parse(f.body);
          setChatList((prev) => [
            ...prev,
            {
              id: `${body.createdAt ?? Date.now()}-${Math.random()}`,
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
    };

    const onStompError = (f) => {
      console.error('[chat] STOMP error:', f?.headers, f?.body);
    };

    const tryFallbackToBroker = () => {
      if (!STOMP_BROKER_URL) return;
      try {
        console.log('[chat] fallback → brokerURL', STOMP_BROKER_URL);
        client?.deactivate?.();
        client = new StompClient({
          brokerURL: STOMP_BROKER_URL,
          reconnectDelay: 4000,
          onConnect: onStompConnected,
          onStompError,
          debug: () => { },
        });
        client.activate();
      } catch (e) {
        console.error('[chat] fallback failed:', e);
      }
    };

    client = new StompClient({
      webSocketFactory: () => new SockJS(CHAT_WS_URL),
      reconnectDelay: 4000,
      onConnect: onStompConnected,
      onStompError,
      onWebSocketClose: (e) => {
        console.warn('[chat] WS closed:', e?.code, e?.reason);
        tryFallbackToBroker();
      },
      debug: () => { },
    });

    client.activate();
    stompRef.current = client;

    return () => {
      try {
        client.deactivate();
      } catch (e) {
        console.warn("STOMP 클라이언트 종료 오류:", e);
      }
      stompRef.current = null;
      console.log('[chat] STOMP deactivated');
    };
  }, [artistId]);

  // ===== 채팅 입력 =====
  const handleChatInput = (e) => setChatInput(e.target.value);
  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (composingRef.current || e.nativeEvent.isComposing) return;
      handleChatSend();
    }
  };
  const handleChatSend = () => {
    const text = chatInput.trim();
    if (!text) return;
    if (!stompRef.current?.connected) return alert('채팅 서버와 연결되지 않았습니다.');
    const payload = {
      roomId: Number(artistId) || 0,
      senderId: myUserId.current,
      content: text,
      contentType: 'TEXT',
      createdAt: new Date().toISOString(),
    };
    stompRef.current.publish({
      destination: APP_SEND(artistId),
      body: JSON.stringify(payload),
    });
    setChatInput('');
  };

  // ===== 소켓/스트림 =====
  useEffect(() => {
    const socket = io(SERVER_URL, { query: { role: "viewer" } });
    socketRef.current = socket;
    socket.emit("join-live", { liveId });
    socket.on("viewer-count", (count) => setViewerCount(count));

    const handleSubtitleEvent = (data) => {
      try {
        let payload = data;
        if (typeof data === "string") payload = { original: data };
        if (payload.liveId && String(payload.liveId) !== String(liveId)) return;
        const incoming = payload.subtitle || payload;
        const normalized = typeof incoming === "string" ? { original: incoming } : incoming;
        if (normalized?.original) {
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

    const consume = async () => {
      if (!deviceRef.current || !recvTransportRef.current) return;
      try {
        const { rtpCapabilities } = deviceRef.current;
        const consumerParams = await new Promise((r) => socket.emit("consume", { rtpCapabilities }, r));
        if (consumerParams?.error) {
          setIsStreamAvailable(false);
          setStreamStatus("waiting");
          socket.once("new-producer", consume);
          return;
        }
        const consumer = await recvTransportRef.current.consume(consumerParams);
        if (remoteVideoRef.current)
          remoteVideoRef.current.srcObject = new MediaStream([consumer.track]);
        setIsStreamAvailable(true);
        setStreamStatus("streaming");
        socket.emit("resume-consumer");
      } catch (error) {
        console.error("Consume 실패:", error);
      }
    };

    const setupMediasoup = async () => {
      try {
        const routerRtpCapabilities = await new Promise((r) => socket.emit("getRouterRtpCapabilities", r));
        const device = new mediasoupClient.Device();
        await device.load({ routerRtpCapabilities });
        deviceRef.current = device;

        const transportParams = await new Promise((r) => socket.emit("createWebRtcTransport", { sending: false }, r));
        const transport = device.createRecvTransport(transportParams);
        recvTransportRef.current = transport;

        transport.on("connect", ({ dtlsParameters }, callback, errback) => {
          socket.emit("connectTransport", { dtlsParameters }, (error) => {
            if (error) errback(new Error(error));
            else callback();
          });
        });
        consume();
      } catch (error) {
        console.error("Mediasoup 설정 실패:", error);
      }
    };


    socket.on("connect", setupMediasoup);
    socket.on("producer-closed", () => {
      setStreamStatus("ended");
      setIsStreamAvailable(false);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      setSubtitle(null);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    });

    return () => {
      socket.disconnect();
      recvTransportRef.current?.close();
    };
  }, [liveId]);

  // ===== UI =====
  return (
    <div className="live-page-container">
      {/* 상단 타이틀 */}
      <div className="live-page-header">
        <h2 className="live-page-artist">
          {streamInfo?.artistName || '아티스트명'}{" "}
          <span style={{ color: '#7c4dff' }}>LIVE</span>
        </h2>
        <hr className="live-page-hr" />
        <p className="live-page-desc">
          {streamInfo?.title
            ? `♡ ${streamInfo.title} ♡`
            : '방송 정보가 없습니다.'}
        </p>
      </div>

      {/* 영상 + 채팅 */}
      <div className="live-page-stream-section">
        <div className="live-page-video-wrapper" style={{ position: "relative" }}>
          <div className="viewer-count-badge">👀 {viewerCount}명 시청중</div>
          <video ref={remoteVideoRef} autoPlay muted className="live-page-video" />
          {!isStreamAvailable && streamStatus === 'waiting' && (
            <p className="live-page-waiting">방송 시작을 기다리는 중...</p>
          )}
          {!isStreamAvailable && streamStatus === 'ended' && (
            <p className="live-page-waiting">방송이 종료되었습니다.</p>
          )}

          {streamStatus === "streaming" && (
            <>
              <SubtitleDisplay subtitle={subtitle} selectedLang={selectedLang} />
              <div className="subtitle-select-wrapper">
                <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)}>
                  <option value="none">자막 없음</option>
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* 채팅 */}
        <div className="live-page-chat-section" style={{ height: '100%' }}>
          <div className="live-page-chat-title">실시간 채팅</div>
          <div className="live-page-chat-messages" ref={chatMessagesRef}>
            {chatList.map((msg) => {
              const isMine = msg.senderId === myUserId.current && msg.type !== 'admin';
              const name = isMine ? '나' : (msg.type === 'admin' ? '시스템' : '익명');
              return (
                <div key={msg.id} className={msg.type === 'admin' ? 'live-page-chat-admin' : 'live-page-chat-user'}>
                  <span className="live-page-chat-sender"
                    style={{ color: msg.type === 'admin' ? '#3b4fff' : '#222', fontWeight: 600 }}>
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
              onCompositionStart={() => (composingRef.current = true)}
              onCompositionEnd={() => (composingRef.current = false)}
              onKeyDown={handleChatKeyDown}
            />
          </div>
        </div>
      </div>

      {/* 프로모션 / 상품 */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        padding: '20px',
        marginTop: '30px'
      }}>
        <h3 style={{
          borderBottom: '2px solid #eee',
          paddingBottom: '10px',
          marginBottom: '20px',
          color: '#333'
        }}>🎁 등록된 프로모션</h3>
        {promotion ? (
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: '20px',
            marginBottom: '20px',
            padding: '20px',
            border: '1px solid #eee',
            borderRadius: '12px',
            background: 'linear-gradient(180deg, #fafafa 0%, #fff 100%)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <div style={{ flex: '0 0 200px' }}>
              <img
                src={promotion.img ? `${import.meta.env.VITE_API_URL}${promotion.img}` : 'https://via.placeholder.com/200x200?text=No+Image'}
                alt={promotion.name}
                style={{
                  width: '100%', height: '200px', borderRadius: '10px', objectFit: 'cover',
                  border: '1px solid #ddd', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'
              }}>
                <h4 style={{ margin: 0, color: '#222', fontSize: '20px', fontWeight: 'bold' }}>{promotion.name}</h4>
                {promotion.fanOnly && (
                  <span style={{
                    fontSize: '13px', padding: '4px 10px', borderRadius: '8px',
                    background: 'linear-gradient(90deg, #8b5cf6, #6d28d9)', color: '#fff', fontWeight: '600'
                  }}>💜 팬클럽 전용</span>
                )}
              </div>
              <p style={{ fontSize: '14px', color: '#555', marginBottom: '16px' }}>
                {promotion.description || '등록된 설명이 없습니다.'}
              </p>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '16px', background: '#f9f9ff',
                borderRadius: '8px', padding: '12px 16px'
              }}>
                <span>📦 재고 수량: <strong>{promotion.stockQty ?? 0}개</strong></span>
                <span>👤 1인당 구매 제한: <strong>{promotion.limitPerUser ?? 1}개</strong></span>
                {promotion.coupon && (
                  <span>🎟 쿠폰 코드: <strong>{promotion.coupon}</strong></span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '16px', color: '#777' }}>
            해당 스트리밍은 프로모션 상품이 등록되어 있지 않습니다.
          </div>
        )}
      </div>

      {/* 상품 목록 */}
      <div className="live-page-products-section">
        <h3 className="live-page-products-title">라이브 상품 목록</h3>
        <div className="live-page-product-list">
          {productDetails.length > 0 ? productDetails.map((p) => (
            <div key={p.id} className="live-page-product-card live-page-product-card-wide">
              <img
                src={p.img ? `${import.meta.env.VITE_API_URL}${p.img}` : '/assets/img/placeholder/240.png'}
                alt={p.name}
                className="live-page-product-img"
              />
              <div className="live-page-product-info">
                <div className="live-page-product-name">{p.name}</div>
                <div className="live-page-product-option-row">
                  <span className="live-page-product-option-label">To You Ver.</span>
                  <select className="live-page-product-option-select">
                    {(p.option ?? ["수량 선택", "1개", "2개", "3개"]).map((opt, i) => (
                      <option key={i} value={opt} disabled={i === 0}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="live-page-product-price-col">
                <span className="live-page-product-price">
                  KRW ₩{Number(p.price || 0).toLocaleString()}
                </span>
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

export default Viewer;