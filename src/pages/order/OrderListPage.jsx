import React, { useState } from "react";

const orders = [
  {
    id: "12345678901234",
    date: "2024. 02. 19. 11:48",
    items: [
      {
        status: "배송 완료",
        title: "The 1st Mini Album [From JOY, with Love] (Jewel Case Ver.)",
        option: "Jewel Case Ver. / 1개",
        price: 13300,
        img: "/assets/img/test/jin.png",
      },
      {
        status: "결제 완료",
        title: "The 1st Mini Album [From JOY, with Love] (Jewel Case Ver.)",
        option: "Jewel Case Ver. / 1개",
        price: 39300,
        img: "/assets/img/test/jin.png",
      },
    ],
    user: {
      name: "Yang Seungyeon",
      email: "owhitekitty@gmail.com",
      phone: "+1 5879694189",
      address: "114 25 Avenue Northwest Calgary, AB(T2M 2A3) 캐나다",
    },
    payment: {
      method: "신용카드 (VISA **** 5320)",
      date: "2024. 02. 19. 11:48",
    },
    total: 39300,
  },
];

export default function OrderPage() {
  const [open, setOpen] = useState({});

  const toggle = (id) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ background: "#f7f8fa", minHeight: "100vh", padding: "40px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 32 }}>주문내역</h2>


        {orders.map((order) => {
          const firstItem = order.items[0];
          return (
            <div
              key={order.id}
              style={{
                background: "#fff",
                borderRadius: 28,
                boxShadow: "0 2px 16px #0001",
                marginBottom: 32,
                padding: "32px 32px 0 32px",
                position: "relative",
              }}
            >
              {/* 주문번호, 일자 헤더 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: "#222", fontWeight: 500, marginBottom: 4 }}>주문번호 {order.id}</div>
                  <div style={{ color: "#888", fontSize: 15, marginBottom: 12 }}>{order.date} 주문</div>
                </div>
                 {/*토글*/}
                <button
                  onClick={() => toggle(order.id)}
                  style={{
                    background: "none",
                    fontSize: 20,
                    color: "#bbb",
                    cursor: "pointer",
                    position: "absolute",
                    top: 32,
                    right: 32,
                    outline: "none", 
                    border: "none"
                  }}
                  aria-label="상세 펼치기"
                >
                   <span style={{ fontSize: 16, color: "#666" }}>상세보기</span>
                    <span
                        style={{
                        display: "inline-block",
                        transition: "transform 0.2s",
                        transform: open[order.id] ? "rotate(90deg)" : "rotate(0deg)",
                        marginLeft: 10,
                        fontWeight: 700
                        }}
                    > &gt;</span>
                  
                </button>
              </div>
              
              {/* 닫혀있을 때 첫 상품만 */}
              {!open[order.id] && (
                
                
                <div style={{ marginTop: 24 }}>
                    <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>총 N건</h2>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #a2a2a2ff", marginTop: 3, marginBottom: 12, }}/>
                    
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "20px 0",
                    }}
                  >
                    <img
                      src={firstItem.img}
                      alt={firstItem.title}
                      style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", marginRight: 24 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          color: firstItem.status === "배송 완료" ? "#222" : "#22b8cf",
                          fontWeight: 700,
                          marginBottom: 4,
                        }}
                      >
                        {firstItem.status}
                      </div>
                      <div style={{ color: "#222", fontWeight: 500, marginBottom: 2 }}>{firstItem.title}</div>
                      <div style={{ color: "#aaa", fontSize: 14 }}>{firstItem.option}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: "#111" }}>
                      ₩{firstItem.price.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* 열려있을 때 전체 상세 */}
              {open[order.id] && (
                <div style={{ marginTop: 24 }}>
                <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>주문상품</h2>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #a2a2a2ff", marginTop: 3, marginBottom: 12, }}/>
                  {/* 모든 상품 */}
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        borderBottom: idx < order.items.length - 1 ? "1px solid #eee" : "none",
                        padding: "20px 0",
                      }}
                    >
                      <img
                        src={item.img}
                        alt={item.title}
                        style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", marginRight: 24 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            color: item.status === "배송 완료" ? "#222" : "#22b8cf",
                            fontWeight: 700,
                            marginBottom: 4,
                          }}
                        >
                          {item.status}
                        </div>
                        <div style={{ color: "#222", fontWeight: 500, marginBottom: 2 }}>{item.title}</div>
                        <div style={{ color: "#aaa", fontSize: 14 }}>{item.option}</div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 18, color: "#111" }}>
                        ₩{item.price.toLocaleString()}
                      </div>
                    </div>
                  ))}

                  {/* 주문자 / 배송 / 결제 */}
                  <div style={{ padding: "20px 0", paddingTop: 40, borderTop: "1px solid rgba(238, 238, 238, 1)" }}>
                    <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>배송지</h2>

                    <div style={{ paddingBottom: 8, borderBottom: "1px solid #a2a2a2ff", marginTop: 3, marginBottom: 12, }}/>
                    <div style={{marginBottom: 8}}>{order.user.name}</div>
                    <div style={{marginBottom: 8}}>{order.user.phone}</div>
                    <div style={{marginBottom: 8}}>{order.user.address}</div>
                    <div style={{ paddingBottom: 8, borderBottom: "1px solid #a2a2a2ff", marginTop: 3, marginBottom: 12, }}/>
                    

                    
                    <h2 style={{ fontWeight: 700, fontSize: 22,  marginTop: 50, marginBottom: 8 }}>결제정보</h2>
                    <div style={{ paddingBottom: 8, borderBottom: "1px solid #a2a2a2ff", marginTop: 3, marginBottom: 12, }}/>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: 16,
                            marginBottom: 8,
                        }}
                        >
                        <div style={{ fontWeight: 800 }}>주문금액</div>
                        <div style={{fontWeight: 800}}>₩{order.total.toLocaleString()}</div>
                    </div>
                    <div style={{marginBottom: 8}}>결제 방법: {order.payment.method}</div>
                    <div style={{marginBottom: 12}}>결제 일시: {order.payment.date}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
