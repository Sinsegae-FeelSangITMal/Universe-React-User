// src/pages/LivePage.jsx
import { useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const DUMMY_BANNER  = "/assets/img/gallery/live_banner.jpg";
const DUMMY_PRODUCT = "/assets/img/gallery/arrival8.png";
const DUMMY_COUPON  = "/assets/img/gallery/promo_dummy.jpg";


export default function LivePage() {
    const WS_URL           = "http://localhost:7777/ws";         // Spring SockJS 엔드포인트 예: registry.addEndpoint("/ws").withSockJS();
    const TOPIC_SUBSCRIBE  = (artistId) => `/topic/public/${artistId}`; // 서버 브로드캐스트 topic
    const APP_SEND         = (artistId) => `/app/live/${artistId}`;   // 서버 수신 app prefix


  const { artistId } = useParams();
  const [chatInput, setChatInput]   = useState("");
  const [messages, setMessages]     = useState([
    "덕후: 앗 언니 기억해요! 포에 에서 ㅜㅜ 영영",
    "민지: 티셔츠 사이즈 궁금해여",
    "유니버스봇: 티셔츠 사이즈 (S, M, L)",
  ]);
  const [wsStatus, setWsStatus]     = useState("DISCONNECTED"); // CONNECTING / CONNECTED
  const clientRef                   = useRef(null);

  // 데모용 상품 데이터(나중에 API 연동으로 교체)
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
      reconnectDelay: 3000, // 자동 재접속
      debug: () => {},      // 필요시 로그
      onConnect: () => {
        setWsStatus("CONNECTED");
        client.subscribe(TOPIC_SUBSCRIBE(artistId || "global"), (frame) => {
          try {
            const body = JSON.parse(frame.body);
            const line = `${body.sender ?? "익명"}: ${body.message ?? ""}`;
            setMessages((prev) => [...prev, line]);
          } catch {
            setMessages((prev) => [...prev, frame.body]);
          }
        });
      },
      onStompError: () => setWsStatus("DISCONNECTED"),
      onWebSocketClose: () => setWsStatus("DISCONNECTED"),
    });
    client.activate();
    clientRef.current = client;
    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [artistId]);

  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    const payload = {
      artistId: Number(artistId) || null,
      sender: "나",
      message: text,
      timestamp: new Date().toISOString(),
    };
    try {
      if (clientRef.current?.connected) {
        clientRef.current.publish({
          destination: APP_SEND(artistId || "global"),
          body: JSON.stringify(payload),
        });
      }
      // 낙관적 업데이트
      setMessages((prev) => [...prev, `나: ${text}`]);
      setChatInput("");
    } catch {
      setMessages((prev) => [...prev, `나: ${text}`]);
      setChatInput("");
    }
  };

  return (
    <main>
      {/* 상단 헤더 */}
      <div className="page-notification">
        <div className="container" style={{ maxWidth: 1140 }}>
          <div className="row">
            <div className="col-lg-12 d-flex justify-content-between align-items-center">
              <h1 className="mb-0" style={{ fontSize: 28, fontWeight: 800 }}>
                에스파 LIVE
              </h1>
              <div style={{ color: "#666" }}>
                Artist #{artistId} · WS: {wsStatus === "CONNECTED" ? "연결됨" : wsStatus === "CONNECTING" ? "연결중…" : "미연결"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 상단: 배너(왼쪽) + 채팅(오른쪽) */}
      <section className="live-top py-4">
        <div className="container" style={{ maxWidth: 1140 }}>
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="position-relative" style={{ borderRadius: 16, overflow: "hidden", background: "#eee" }}>
                <img
                  src={DUMMY_BANNER}
                  alt="에스파 위버스 라이브"
                  className="img-fluid w-100"
                  style={{ objectFit: "cover", minHeight: 360, maxHeight: 480 }}
                  onError={(e) => (e.currentTarget.style.display = "none")}
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
                    background: "linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.6) 90%)",
                  }}
                >
                  <p className="mb-2" style={{ fontSize: 16 }}>
                    ♡25FW MD♡ 나왔다. 라이브 중 구매 시 포토카드 증정! 채팅창 확인!
                  </p>
                  <h2 style={{ fontWeight: 900, letterSpacing: 0.2 }}>05.13 에스파 위버스 라이브</h2>
                  <h4 className="mb-0" style={{ fontWeight: 700 }}>aespa Weverse Live</h4>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="h-100 d-flex flex-column" style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, background: "#fff", minHeight: 360 }}>
                <h5 className="mb-3" style={{ fontWeight: 700 }}>실시간 채팅</h5>
                <ul
                    style={{
                        listStyle: "none",
                        paddingLeft: 0,
                        margin: 0,
                        overflowY: "auto",
                        maxHeight: 260,
                        border: "1px solid #f3f3f3",
                        borderRadius: 8,
                        padding: 8,
                    }}
                    >
                    {messages.map((m, i) => {
                        const isMine = m.sender === "나";  // 내가 보낸 메시지인지 확인
                        return (
                        <li
                            key={i}
                            style={{
                            display: "flex",
                            justifyContent: isMine ? "flex-end" : "flex-start",
                            padding: "6px 4px",
                            }}
                        >
                            <div
                            style={{
                                background: isMine ? "#00c6cf" : "#f1f1f1",
                                color: isMine ? "#fff" : "#000",
                                padding: "8px 12px",
                                borderRadius: 12,
                                maxWidth: "70%",
                            }}
                            >
                            {!isMine && <b style={{ marginRight: 6 }}>{m.sender}:</b>}
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
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <button className="btn" style={{ background: "#111", color: "#fff" }} onClick={sendMessage}>
                    전송
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 쿠폰 바 */}
      <section className="live-coupon py-3">
        <div className="container" style={{ maxWidth: 1140 }}>
          <div className="card shadow-sm" style={{ border: "none", borderRadius: 12, overflow: "hidden" }}>
            <div className="row g-0 align-items-center">
              <div className="col-md-2 d-none d-md-block">
                <img src={DUMMY_COUPON} alt="라이브 쿠폰" className="w-100 h-100" style={{ objectFit: "cover" }} />
              </div>
              <div className="col-md-10">
                <div className="card-body d-flex flex-wrap align-items-center justify-content-between">
                  <p className="mb-2 mb-md-0" style={{ color: "#333" }}>
                    라이브 특전 무료 증정 쿠폰 (라이브 중 MD 구매 시 사용 가능, 포토카드 랜덤 1종)
                  </p>
                  <button className="btn" style={{ background: "#b084db", color: "#fff" }}>다운로드</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 하단: 가로 테이블형 상품 리스트 */}
      <section className="live-products pt-4 pb-5">
        <div className="container" style={{ maxWidth: 1140 }}>
          <div className="section-tittle medium mb-3">
            <h2>라이브 상품 목록</h2>
          </div>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>이미지</th>
                  <th>상품명</th>
                  <th style={{ width: 140 }} className="text-end">가격</th>
                  <th style={{ width: 220 }} className="text-center">액션</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <img
                        src={p.img}
                        alt={p.name}
                        width={64}
                        height={64}
                        style={{ objectFit: "cover", borderRadius: 6 }}
                        onError={(e) => (e.currentTarget.src = DUMMY_PRODUCT)}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>From LIVE MD</div>
                    </td>
                    <td className="text-end" style={{ fontWeight: 700 }}>{toKRW(p.price)}</td>
                    <td className="text-center">
                      <div className="d-inline-flex gap-2">
                        <button className="border-btn">장바구니</button>
                        <button className="btn" style={{ background: "#00c6cf", color: "#fff" }}>
                          주문하기
                        </button>
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
