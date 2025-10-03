import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import SubtitleDisplay from '../../components/subtitle/SubtitleDisplay';

const SUBTITLE_API_URL = 'http://localhost:8080'; // 자막 처리 서버
const SERVER_URL = 'http://192.168.56.1:4000';

const DUMMY_CHAT = [
  { id: 1, sender: '덕후', text: '와 언니 개예뻐요 존예 여신 ㅠㅠ 엉엉', type: 'user' },
  { id: 2, sender: '민지', text: '티셔츠 사이즈 궁금해여', type: 'user' },
  { id: 3, sender: '유니버스봇', text: '티셔츠 사이즈 <b>(S, M, L)</b>', type: 'admin', link: true },
  { id: 4, sender: '덕후', text: '악악악', type: 'user' },
  { id: 5, sender: '덕후', text: '깐으앙강 ㅋㅋ악악악악', type: 'user' },
  { id: 6, sender: '덕후', text: '** ** 예뻐', type: 'user' },
];

const Viewer = () => {
  const { liveId } = useParams();
  const remoteVideoRef = useRef(null);
  const [streamStatus, setStreamStatus] = useState('waiting');
  const [chatList, setChatList] = useState(DUMMY_CHAT);
  const [chatInput, setChatInput] = useState("");
  const [subtitle, setSubtitle] = useState(null);

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

  // 채팅 자동 스크롤
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatList]);

  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    // --- 자막 이벤트 처리 (WebSocket) ---
    const handleSubtitleEvent = (data) => {
      try {
        let payload = data;
        if (typeof data === 'string') payload = { original: data };
        if (payload.liveId && payload.liveId !== liveId) return;

        const incoming = payload.subtitle || payload;
        const normalized = (typeof incoming === 'string') ? { original: incoming } : incoming;

        if (normalized && normalized.original) {
          setSubtitle(normalized);
          if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
          subtitleTimerRef.current = setTimeout(() => setSubtitle(null), 6000);
        }
      } catch (err) {
        console.error('자막 처리 중 오류', err);
      }
    };

    socket.on('subtitle', handleSubtitleEvent);
    socket.on('subtitle-update', handleSubtitleEvent);

    // --- REST 폴링 (백업) ---
    async function fetchLatestSubtitle() {
      if (streamStatus !== 'streaming') return; // 방송 중일 때만
      try {
        const res = await fetch(`${SUBTITLE_API_URL}/api/live/subtitle/${liveId}`);
        if (res.status === 200) {
          const data = await res.json();
          setSubtitle((prev) => {
            if (!prev || prev.original !== data.original) {
              console.log("GET 자막:", data);
              if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
              subtitleTimerRef.current = setTimeout(() => setSubtitle(null), 6000);
              return data;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("GET 자막 실패:", err);
      }
    }

    if (liveId && !pollIntervalRef.current) {
      fetchLatestSubtitle();
      pollIntervalRef.current = setInterval(fetchLatestSubtitle, 2000);
    }

    // --- mediasoup 설정 ---
    const consume = async () => {
      if (!deviceRef.current || !recvTransportRef.current) return;
      try {
        const { rtpCapabilities } = deviceRef.current;
        const consumerParams = await new Promise(r => socket.emit('consume', { rtpCapabilities }, r));

        if (consumerParams.error) {
          setStreamStatus('waiting');
          socket.once('new-producer', consume);
          return;
        }

        const consumer = await recvTransportRef.current.consume(consumerParams);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = new MediaStream([consumer.track]);
        }
        setStreamStatus('streaming');
        socket.emit('resume-consumer');
      } catch (error) {
        console.error("Consume 실패:", error);
        setStreamStatus('waiting');
      }
    };

    const setupMediasoup = async () => {
      try {
        const routerRtpCapabilities = await new Promise(r => socket.emit('getRouterRtpCapabilities', r));
        const device = new mediasoupClient.Device();
        await device.load({ routerRtpCapabilities });
        deviceRef.current = device;

        const transportParams = await new Promise(r => socket.emit('createWebRtcTransport', { sending: false }, r));
        const transport = device.createRecvTransport(transportParams);
        recvTransportRef.current = transport;

        transport.on('connect', ({ dtlsParameters }, callback, errback) => {
          socket.emit('connectTransport', { dtlsParameters }, (error) => {
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
        setStreamStatus('waiting');
      }
    };

    socket.on('connect', setupMediasoup);

    socket.on('producer-closed', () => {
      setStreamStatus('ended');
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

      // 방송 종료 시 자막 및 폴링도 정리
      setSubtitle(null);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    });

    return () => {
      socket.off('connect', setupMediasoup);
      socket.off('producer-closed');
      socket.off('new-producer', consume);
      socket.off('subtitle', handleSubtitleEvent);
      socket.off('subtitle-update', handleSubtitleEvent);

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

  // --- 채팅 입력 ---
  const handleChatInput = (e) => setChatInput(e.target.value);
  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    setChatList([...chatList, { id: Date.now(), sender: '나', text: chatInput, type: 'user' }]);
    setChatInput("");
  };
  const handleChatKeyDown = (e) => { if (e.key === 'Enter') handleChatSend(); };

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
          <video ref={remoteVideoRef} autoPlay muted className="live-page-video" />
          {streamStatus === 'waiting' && <p className="live-page-waiting">방송 시작을 기다리는 중...</p>}
          {streamStatus === 'ended' && <p className="live-page-waiting">방송이 종료되었습니다.</p>}
          {/* 🔥 자막 표시 */}
          {streamStatus === 'streaming' && <SubtitleDisplay subtitle={subtitle} />}
        </div>

        <div className="live-page-chat-section" style={{ height: '100%' }}>
          <div className="live-page-chat-title">실시간 채팅</div>
          <div className="live-page-chat-messages" ref={chatMessagesRef}>
            {chatList.map((msg) => (
              <div key={msg.id} className={msg.type === 'admin' ? 'live-page-chat-admin' : 'live-page-chat-user'}>
                <span className="live-page-chat-sender" style={{ color: msg.type === 'admin' ? '#3b4fff' : '#222', fontWeight: 600 }}>
                  {msg.sender}:
                </span>{' '}
                <span
                  className="live-page-chat-text"
                  dangerouslySetInnerHTML={msg.link
                    ? { __html: `<a href="#" style='color:#3b4fff;text-decoration:underline;font-weight:700;'>${msg.text}</a>` }
                    : { __html: msg.text }}
                />
              </div>
            ))}
          </div>
          <div className="live-page-chat-input-wrap">
            <input
              type="text"
              className="live-page-chat-input"
              placeholder="메시지 보내기.."
              value={chatInput}
              onChange={handleChatInput}
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
