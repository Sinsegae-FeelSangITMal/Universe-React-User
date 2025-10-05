import { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import * as mediasoupClient from 'mediasoup-client';
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';

const SERVER_URL  = 'http://192.168.60.30:4000'; // mediasoup signaling
const CHAT_WS_URL = '/ws';                       // Vite proxy → chat-server:8888

// artistId 기반 토픽
const TOPIC_SUBSCRIBE = (id) => `/topic/public/${id ?? 'global'}`;
const APP_SEND        = (id) => `/app/live/${id ?? 'global'}`;

const LivePage = () => {
  const { artistId } = useParams();

  const [products] = useState([
    { id: 1, name: "The 1st Mini Album [From JOY, with Love] (To You Ver.)", price: 39300, img: "/assets/img/hero/product1.png", option: ["옵션 선택", "S", "M", "L"] },
    { id: 2, name: "The 1st Mini Album [From JOY, with Love] (To You Ver.)", price: 39300, img: "/assets/img/hero/product1.png", option: ["옵션 선택", "S", "M", "L"] },
    { id: 3, name: "The 1st Mini Album [From JOY, with Love] (To You Ver.)", price: 39300, img: "/assets/img/hero/product1.png", option: ["옵션 선택", "S", "M", "L"] },
    { id: 4, name: "The 1st Mini Album [From JOY, with Love] (To You Ver.)", price: 39300, img: "/assets/img/hero/product1.png", option: ["옵션 선택", "S", "M", "L"] },
  ]);

  const remoteVideoRef   = useRef(null);
  const chatMessagesRef  = useRef(null);
  const composingRef     = useRef(false); // ← IME 조합 상태

  const [isStreamAvailable, setIsStreamAvailable] = useState(false);
  const [chatList, setChatList] = useState([]); // 서버 브로드캐스트만 표시
  const [chatInput, setChatInput] = useState('');

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

  // ===== mediasoup (viewer) =====
  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket'] });
    socket.on('connect', () => {
      console.log('[mediasoup] socket connected:', socket.id);
      consumeStream(socket);
    });
    socket.on('disconnect', (r) => console.warn('[mediasoup] socket disconnected:', r));
    socket.on('connect_error', (e) => console.error('[mediasoup] connect_error:', e?.message || e));
    return () => socket.disconnect();
  }, []);

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
      debug: () => {},
    });
    client.activate();
    stompRef.current = client;

    return () => {
      try { client.deactivate(); } catch {}
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

  // ===== 디자인 그대로 렌더 =====
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
        <div className="live-page-video-wrapper">
          <video ref={remoteVideoRef} autoPlay className="live-page-video" />
          {!isStreamAvailable && <p className="live-page-waiting">방송 시작을 기다리는 중...</p>}
        </div>

        <div className="live-page-chat-section" style={{height: '100%'}}>
          <div className="live-page-chat-title">실시간 채팅</div>

          <div className="live-page-chat-messages" ref={chatMessagesRef}>
            {chatList.map((msg) => {
              const isMine = msg.senderId === myUserId.current && msg.type !== 'admin';
              const name   = isMine ? '나' : (msg.type === 'admin' ? '시스템' : '익명');
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

export default LivePage;