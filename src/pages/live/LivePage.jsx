import { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useParams, useNavigate } from 'react-router-dom';
import * as mediasoupClient from 'mediasoup-client';
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';
import { useAuthStore } from '../../store/auth';

// ===== 서버 엔드포인트 =====
const SERVER_URL  = 'http://192.168.60.30:4000'; // mediasoup signaling
const CHAT_WS_URL = '/ws';                       // Vite proxy → chat-server:8888

// artistId 기반 토픽
const TOPIC_SUBSCRIBE = (id) => `/topic/public/${id ?? 'global'}`;
const APP_SEND        = (id) => `/app/live/${id ?? 'global'}`;

const LivePage = () => {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useAuthStore(); // 전역 스토어에서 유저/토큰

  // 로그인된 사용자 정보
  const sender   = user?.nickname || `유저${Math.floor(Math.random() * 1000)}`;
  const myUserId = user?.userId || 0;

  const remoteVideoRef  = useRef(null);
  const chatMessagesRef = useRef(null);
  const composingRef    = useRef(false); // IME 조합 상태

  const [isStreamAvailable, setIsStreamAvailable] = useState(false);
  const [chatList, setChatList] = useState([]); // 서버 브로드캐스트만 표시
  const [chatInput, setChatInput] = useState('');

  const [products] = useState([
    { id: 1, name: "The 1st Mini Album [From JOY, with Love] (To You Ver.)", price: 39300, img: "/assets/img/hero/product1.png", option: ["옵션 선택", "S", "M", "L"] },
    { id: 2, name: "The 1st Mini Album [From JOY, with Love] (To You Ver.)", price: 39300, img: "/assets/img/hero/product1.png", option: ["옵션 선택", "S", "M", "L"] },
    { id: 3, name: "The 1st Mini Album [From JOY, with Love] (To You Ver.)", price: 39300, img: "/assets/img/hero/product1.png", option: ["옵션 선택", "S", "M", "L"] },
    { id: 4, name: "The 1st Mini Album [From JOY, with Love] (To You Ver.)", price: 39300, img: "/assets/img/hero/product1.png", option: ["옵션 선택", "S", "M", "L"] },
  ]);

  // ===== 채팅 자동 스크롤 =====
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatList]);

  // ===== mediasoup 뷰어 =====
  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket'] });
    socket.on('connect', () => {
      consumeStream(socket);
    });
    socket.on('disconnect', () => {});
    socket.on('connect_error', () => {});
    return () => socket.disconnect();
  }, []);

  const consumeStream = async (socket) => {
    try {
      const routerRtpCapabilities = await new Promise((resolve) =>
        socket.emit('getRouterRtpCapabilities', resolve)
      );
      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities });

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
        setIsStreamAvailable(false);
        socket.once('new-producer', () => consumeStream(socket));
        return;
      }

      const consumer = await recvTransport.consume(consumerParams);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = new MediaStream([consumer.track]);
      }
      setIsStreamAvailable(true);

      await new Promise((resolve) => socket.emit('resume-consumer', resolve));
    } catch {
      setIsStreamAvailable(false);
    }
  };

  // ===== STOMP/SockJS (채팅) =====
  const stompRef = useRef(null);
  useEffect(() => {
    if (!accessToken) {
      console.warn('[chat] No access token, STOMP connection not attempted.');
      return;
    }

    const sock = new SockJS(CHAT_WS_URL);
    const client = new StompClient({
      webSocketFactory: () => sock,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`, // 인터셉터가 여기서 토큰 읽음
      },
      reconnectDelay: 4000,
      onConnect: (frame) => {
        // 1. 공용 채팅 구독
        client.subscribe(TOPIC_SUBSCRIBE(artistId), (f) => {
          try {
            const body = JSON.parse(f.body);
            // 서버: { roomId, senderId, nickname, content, contentType, createdAt }
            setChatList((prev) => [
              ...prev,
              {
                id: `${body.createdAt ?? Date.now()}-${Math.random()}`,
                senderId: body.senderId ?? 0,
                nickname: body.nickname ?? '익명',
                text: body.content ?? '',
                type: body.contentType === 'SYSTEM' ? 'admin' : 'user',
                createdAt: body.createdAt,
              },
            ]);
          } catch {
            setChatList((prev) => [
              ...prev,
              { id: `${Date.now()}-${Math.random()}`, senderId: -1, nickname: '시스템', text: f.body, type: 'admin' },
            ]);
          }
        });

        // 2. 개인 시스템 메시지 구독 (Mute/Ban 알림용)
        client.subscribe('/user/queue/system', (message) => {
          try {
            const payload = JSON.parse(message.body);
            alert(payload.message); // Mute와 Ban 모두 일단 alert를 띄움

            // Ban인 경우에만 메인 페이지로 리다이렉트
            if (payload.code === 'BANNED') {
              navigate('/');
            }
          } catch (e) {
            // JSON 파싱 실패 시 일반 텍스트로 처리
            alert(message.body);
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
      onWebSocketClose: () => {},
      debug: () => {},
    });

    client.activate();
    stompRef.current = client;

    return () => {
      try { client.deactivate(); } catch {}
      stompRef.current = null;
    };
  }, [artistId, accessToken, navigate]);

  // ===== 유틸 =====
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const formattedHours = hours % 12 || 12;
    return `${ampm} ${formattedHours}:${minutes.toString().padStart(2, '0')}`;
  };

  // ===== 채팅 입력 =====
  const handleChatInput = (e) => setChatInput(e.target.value);

  const handleChatKeyDown = (e) => {
    // IME(한글) 조합 중이면 엔터 무시 (크롬 마지막 글자 중복 방지)
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

    // 서버가 토큰으로 사용자 식별 → 내용만 보냄
    const payload = { content: text };
    stompRef.current.publish({
      destination: APP_SEND(artistId),
      body: JSON.stringify(payload),
    });

    setChatInput('');
  };

  // ===== 디자인 그대로 렌더 =====
  return (
    <div className="live-page-container">
      {/* 상단 타이틀 */}
      <div className="live-page-header">
        <h2 className="live-page-artist">
          에스파 <span style={{ color: '#7c4dff' }}>LIVE</span>
        </h2>
        <hr className="live-page-hr" />
        <p className="live-page-desc">
          ♡에스파 공식 25FW MD REVIEW♡ 2025.01.15 8PM OPEN!<br />
        </p>
      </div>

      {/* 영상 + 채팅 */}
      <div className="live-page-stream-section">
        <div className="live-page-video-wrapper">
          <video ref={remoteVideoRef} autoPlay className="live-page-video" />
          {!isStreamAvailable && (
            <p className="live-page-waiting">방송 시작을 기다리는 중...</p>
          )}
        </div>

        <div className="live-page-chat-section" style={{ height: '100%' }}>
          <div className="live-page-chat-title">실시간 채팅</div>

          <div className="live-page-chat-messages" ref={chatMessagesRef}>
            {chatList.map((msg) => {
              const isMine = msg.senderId === myUserId && msg.type !== 'admin';

              // 서버 닉네임 우선 사용
              const name =
                msg.type === 'admin'
                  ? '시스템'
                  : isMine
                    ? (msg.nickname || sender)
                    : (msg.nickname || '익명');

              const time = formatTime(msg.createdAt);

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: isMine ? 'flex-end' : 'flex-start',
                    margin: '5px 0'
                  }}
                >
                  {isMine && (
                    <span
                      style={{
                        alignSelf: 'flex-end',
                        fontSize: '0.75rem',
                        color: '#999',
                        marginRight: 8
                      }}
                    >
                      {time}
                    </span>
                  )}

                  <div
                    className={msg.type === 'admin' ? 'live-page-chat-admin' : 'live-page-chat-user'}
                    style={{ maxWidth: '70%' }}
                  >
                    <span
                      className="live-page-chat-sender"
                      style={{ color: msg.type === 'admin' ? '#3b4fff' : '#222', fontWeight: 600 }}
                    >
                      {name}:
                    </span>{' '}
                    <span className="live-page-chat-text">{msg.text}</span>
                  </div>

                  {!isMine && (
                    <span
                      style={{
                        alignSelf: 'flex-end',
                        fontSize: '0.75rem',
                        color: '#999',
                        marginLeft: 8
                      }}
                    >
                      {time}
                    </span>
                  )}
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
              onCompositionStart={() => { composingRef.current = true; }} // IME 시작
              onCompositionEnd={() => { composingRef.current = false; }}  // IME 종료
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
                <span className="live-page-product-price">
                  KRW<span style={{ marginLeft: 2 }}>₩{p.price.toLocaleString()}</span>
                </span>
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
