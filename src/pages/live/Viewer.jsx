import { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';

const SERVER_URL = 'http://192.168.60.30:4000';

const DUMMY_CHAT = [
  { id: 1, sender: '덕후', text: '와 언니 개예뻐요 존예 여신 ㅠㅠ 엉엉', type: 'user' },
  { id: 2, sender: '민지', text: '티셔츠 사이즈 궁금해여', type: 'user' },
  { id: 3, sender: '유니버스봇', text: '티셔츠 사이즈 <b>(S, M, L)</b>', type: 'admin', link: true },
  { id: 4, sender: '덕후', text: '악악악', type: 'user' },
  { id: 5, sender: '덕후', text: '깐으앙강 ㅋㅋ악악악악', type: 'user' },
  { id: 6, sender: '덕후', text: '** ** 예뻐', type: 'user' },
];

const Viewer = () => {
  const remoteVideoRef = useRef(null);
  const [isStreamAvailable, setIsStreamAvailable] = useState(false);
  const [chatList, setChatList] = useState(DUMMY_CHAT);
  const [chatInput, setChatInput] = useState("");

  const [products] = useState([
    {
      id: 1,
      name: "The 1st Mini Album [From JOY, with Love] (To You Ver.)",
      price: 39300,
      img: "/assets/img/hero/product1.png",
      option: ["옵션 선택", "S", "M", "L"]
    },
    {
      id: 2,
      name: "The 1st Mini Album [From JOY, with Love] (To You Ver.)",
      price: 39300,
      img: "/assets/img/hero/product1.png",
      option: ["옵션 선택", "S", "M", "L"]
    },
    {
      id: 3,
      name: "The 1st Mini Album [From JOY, with Love] (To You Ver.)",
      price: 39300,
      img: "/assets/img/hero/product1.png",
      option: ["옵션 선택", "S", "M", "L"]
    },
    {
      id: 4,
      name: "The 1st Mini Album [From JOY, with Love] (To You Ver.)",
      price: 39300,
      img: "/assets/img/hero/product1.png",
      option: ["옵션 선택", "S", "M", "L"]
    },
  ]);
  // 채팅 메시지 영역 자동 스크롤
  const chatMessagesRef = useRef(null);
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatList]);

  useEffect(() => {
    const socketInstance = io(SERVER_URL);
    socketInstance.on('connect', () => consumeStream(socketInstance));
    return () => socketInstance.disconnect();
  }, []);

  const consumeStream = async (socketInstance) => {
    try {
      const routerRtpCapabilities = await new Promise((resolve) => {
        socketInstance.emit('getRouterRtpCapabilities', resolve);
      });
      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities });

      const transportParams = await new Promise((resolve) => {
        socketInstance.emit('createWebRtcTransport', { sending: false }, resolve);
      });
      const recvTransport = device.createRecvTransport(transportParams);

      recvTransport.on('connect', ({ dtlsParameters }, callback) => {
        socketInstance.emit('connectTransport', { dtlsParameters }, callback);
      });

      const consumerParams = await new Promise((resolve) => {
        socketInstance.emit('consume', { rtpCapabilities: device.rtpCapabilities }, resolve);
      });

      if (consumerParams.error) {
        setIsStreamAvailable(false);
        socketInstance.once('new-producer', () => consumeStream(socketInstance));
        return;
      }

      const consumer = await recvTransport.consume(consumerParams);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = new MediaStream([consumer.track]);
      }
      setIsStreamAvailable(true);
      await new Promise(resolve => socketInstance.emit('resume-consumer', resolve));
    } catch (error) {
      setIsStreamAvailable(false);
    }
  };

  // 채팅 입력 핸들러
  const handleChatInput = (e) => setChatInput(e.target.value);
  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    setChatList([
      ...chatList,
      { id: Date.now(), sender: '나', text: chatInput, type: 'user' },
    ]);
    setChatInput("");
  };
  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter') handleChatSend();
  };

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
            {chatList.map((msg) => (
              <div key={msg.id} className={msg.type === 'admin' ? 'live-page-chat-admin' : 'live-page-chat-user'}>
                <span className="live-page-chat-sender" style={{ color: msg.type === 'admin' ? '#3b4fff' : '#222', fontWeight: 600 }}>
                  {msg.sender}
                  {msg.type === 'admin' ? ':' : ':'}
                </span>{' '}
                <span
                  className="live-page-chat-text"
                  dangerouslySetInnerHTML={msg.link ? { __html: `<a href=\"#\" style='color:#3b4fff;text-decoration:underline;font-weight:700;'>${msg.text}</a>` } : { __html: msg.text }}
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
          {products.map((p, idx) => (
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
