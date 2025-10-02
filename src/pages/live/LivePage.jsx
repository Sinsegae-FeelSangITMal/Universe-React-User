// src/pages/live/LivePage.jsx
import { useParams } from "react-router-dom";
import { useEffect, useRef, useState, useMemo } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const DUMMY_BANNER  = "/assets/img/gallery/bts_product_image.jpg";
const DUMMY_PRODUCT = "/assets/img/gallery/arrival8.png";
const DUMMY_COUPON  = "/assets/img/gallery/promo_dummy.jpg";

export default function LivePage() {
  const { artistId } = useParams();
  const composingRef = useRef(false);

  // WebSocket 설정 (Vite proxy로 /ws → 8888)
  const WS_URL = "/ws";
  const TOPIC_SUBSCRIBE  = (id) => `/topic/public/${id}`;
  const APP_SEND         = (id) => `/app/live/${id}`;

  // sender: 브라우저마다 고유하게 저장
  const [sender] = useState(() => {
    const stored = localStorage.getItem("chatSender");
    if (stored) return stored;
    const nickname = "유저" + Math.floor(Math.random() * 1000);
    localStorage.setItem("chatSender", nickname);
    return nickname;
  });

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages]   = useState([
    { sender: "덕후", message: "앗 언니 기억해요! 포에 에서 ㅜㅜ 영영" },
    { sender: "민지", message: "티셔츠 사이즈 궁금해여" },
    { sender: "유니버스봇", message: "티셔츠 사이즈 (S, M, L)" },
  ]);
  const [wsStatus, setWsStatus]   = useState("DISCONNECTED");
  const clientRef                 = useRef(null);

  // 상품 더미
  const products = useMemo(
    () =>
      Array(6).fill(null).map((_, i) => ({
        id: i + 1,
        name: "The 1st Mini Album [Savage] (From LIVE MD)",
        price: 39300,
        img: DUMMY_PRODUCT,
      })),
    []
  );
  const toKRW = (n) => (typeof n === "number" ? `KRW₩${n.toLocaleString("ko-KR")}` : n ?? "");

  /** ===== WebSocket (SockJS + STOMP) ===== */
  useEffect(() => {
    setWsStatus("CONNECTING");

    const sock = new SockJS(WS_URL);
    const client = new Client({
      webSocketFactory: () => sock,
      reconnectDelay: 5000,
      debug: (str) => console.log(str),
    });

    client.onConnect = () => {
      console.log("Connected to Chat Server");
      setWsStatus("CONNECTED");

      client.subscribe(TOPIC_SUBSCRIBE(artistId || "global"), (frame) => {
        try {
          const msg = JSON.parse(frame.body);
          setMessages((prev) => [...prev, { sender: msg.sender ?? "익명", message: msg.message ?? "" }]);
        } catch {
          // 서버가 문자열만 보내는 경우 대비
          setMessages((prev) => [...prev, { sender: "서버", message: frame.body }]);
        }
      });
    };

    client.onStompError = (e) => {
      console.error("STOMP error", e);
      setWsStatus("DISCONNECTED");
    };

    client.onWebSocketClose = () => {
      console.warn("WS closed");
      setWsStatus("DISCONNECTED");
    };

    client.activate();
    clientRef.current = client;

    return () => {
      try {
        client.deactivate();
      } finally {
        clientRef.current = null;
      }
    };
  }, [artistId]);

  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;

    const payload = {
      artistId: Number(artistId) || null,
      sender: sender, // 브라우저마다 다르게
      message: text,
      timestamp: new Date().toISOString(),
    };

    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: APP_SEND(artistId || "global"),
        body: JSON.stringify(payload),
      });
      // 낙관적 업데이트를 원하면 아래 주석 해제
      // setMessages((prev) => [...prev, { sender, message: text }]);
    }
    setChatInput("");
  };

  return (
    <main style={{ background: "#f9fafc", minHeight: "100vh" }}>
      {/* 상단 헤더 */}
      <header style={{ background: "#f1f5f9", padding: "16px 0" }}>
        <div className="container" style={{ maxWidth: 1140 }}>
          <div className="d-flex justify-content-between align-items-center">
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111" }}>에스파 LIVE</h1>
            <div style={{ fontSize: 14, color: "#666" }}>
              Artist #{artistId} · WS:{" "}
              <span style={{ fontWeight: 600, color: wsStatus === "CONNECTED" ? "#16a34a" : wsStatus === "CONNECTING" ? "#f59e0b" : "#dc2626" }}>
                {wsStatus === "CONNECTED" ? "연결됨" : wsStatus === "CONNECTING" ? "연결중…" : "미연결"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 상단: 배너 + 채팅 */}
      <section className="py-4">
        <div className="container" style={{ maxWidth: 1140 }}>
          <div className="row g-4">
            {/* 배너 */}
            <div className="col-lg-8">
              <div className="position-relative" style={{ borderRadius: 16, overflow: "hidden", background: "#eee", boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}>
                <img
                  src={DUMMY_BANNER}
                  alt="에스파 위버스 라이브"
                  className="img-fluid w-100"
                  style={{ objectFit: "cover", minHeight: 360, maxHeight: 480 }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: 24,
                    color: "#fff",
                    background: "linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,.7) 100%)",
                  }}
                >
                  <p className="mb-2" style={{ fontSize: 15 }}>
                    ♡25FW MD♡ 라이브 중 구매 시 포토카드 증정! 채팅창 확인!
                  </p>
                  <h2 style={{ fontWeight: 900, fontSize: 28 }}>05.13 에스파 위버스 라이브</h2>
                  <h4 style={{ fontWeight: 700, fontSize: 20 }}>aespa Weverse Live</h4>
                </div>
              </div>
            </div>

            {/* 채팅 */}
            <div className="col-lg-4">
              <div className="d-flex flex-column h-100" style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,.05)" }}>
                <h5 className="mb-3" style={{ fontWeight: 700, fontSize: 16 }}>
                  실시간 채팅 <span style={{ fontSize: 13, color: "#6b7280" }}>(내 닉네임: {sender})</span>
                </h5>
                <ul
                  style={{
                    flexGrow: 1,
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    overflowY: "auto",
                    border: "1px solid #f3f4f6",
                    borderRadius: 8,
                    padding: 8,
                    background: "#fafafa",
                  }}
                >
                  {messages.map((m, i) => {
                    const isMine = m.sender === sender;
                    return (
                      <li key={i} className="mb-2" style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                        <div
                          style={{
                            background: isMine ? "#3b82f6" : "#e5e7eb",
                            color: isMine ? "#fff" : "#111",
                            padding: "8px 12px",
                            borderRadius: 12,
                            maxWidth: "75%",
                            fontSize: 14,
                          }}
                        >
                          {!isMine && <b style={{ marginRight: 6, fontSize: 13 }}>{m.sender}</b>}
                          {m.message}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="d-flex gap-2 mt-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="메시지 보내기…"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onCompositionStart={() => { composingRef.current = true; }}
                    onCompositionEnd={() => { composingRef.current = false; }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (composingRef.current || e.nativeEvent.isComposing) return;
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button
                    className="btn"
                    style={{ background: "#111827", color: "#fff", borderRadius: 8, padding: "6px 14px" }}
                    onClick={sendMessage}
                  >
                    전송
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 쿠폰 섹션 */}
      <section className="py-3">
        <div className="container" style={{ maxWidth: 1140 }}>
          <div className="card shadow-sm border-0" style={{ borderRadius: 12, overflow: "hidden" }}>
            <div className="row g-0 align-items-center">
              <div className="col-md-2 d-none d-md-block">
                <img src={DUMMY_COUPON} alt="라이브 쿠폰" className="w-100 h-100" style={{ objectFit: "cover" }} />
              </div>
              <div className="col-md-10">
                <div className="card-body d-flex flex-wrap align-items-center justify-content-between">
                  <p className="mb-2 mb-md-0" style={{ fontSize: 15, color: "#374151" }}>
                    라이브 특전 무료 증정 쿠폰 (라이브 중 MD 구매 시 사용 가능, 포토카드 랜덤 1종)
                  </p>
                  <div
                    className="card-stor purple"
                    style={{
                      cursor: "pointer",
                      minHeight: "42px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 8,
                      fontWeight: 600,
                      padding: "10px 20px",
                    }}
                    onClick={() => alert("쿠폰 다운로드")}
                  >
                    다운로드
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 상품 목록 */}
      <section className="pt-4 pb-5">
        <div className="container" style={{ maxWidth: 1140 }}>
          <h2 className="mb-3" style={{ fontSize: 20, fontWeight: 700 }}>라이브 상품 목록</h2>
          <div className="table-responsive">
            <table className="table align-middle">
              <thead style={{ background: "#f3f4f6" }}>
                <tr>
                  <th style={{ width: 100, textAlign: "center"}}>이미지</th>
                  <th>상품명</th>
                  <th style={{ width: 160, textAlign: "center" }} className="text-end">가격</th>
                  <th style={{ width: 220, textAlign: "center" }} className="text-center">액션</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <img src={p.img} alt={p.name} width={56} height={56} style={{ objectFit: "cover", borderRadius: 8 }} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>From LIVE MD</div>
                    </td>
                    <td className="text-end" style={{ fontWeight: 700, color: "#111" }}>{toKRW(p.price)}</td>
                    <td className="text-center">
                      <div className="d-inline-flex gap-2">
                        <div
                          className="card-stor mint"
                          style={{
                            cursor: "pointer",
                            minHeight: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid rgba(74, 0, 135, 0.38)",
                            color: "rgba(74, 0, 135, 0.38)",
                            borderRadius: 6,
                            padding: "8px 16px",
                            fontWeight: 600,
                          }}
                          onClick={() => alert("장바구니에 담기")}
                        >
                          장바구니
                        </div>
                        <div
                          className="card-stor purple"
                          style={{
                            cursor: "pointer",
                            minHeight: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#06b6d4",
                            color: "#fff",
                            borderRadius: 6,
                            padding: "8px 16px",
                            fontWeight: 600,
                          }}
                          onClick={() => alert("주문하기")}
                        >
                          주문하기
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
