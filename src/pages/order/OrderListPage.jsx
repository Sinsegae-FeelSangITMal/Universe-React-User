import React, { useEffect, useState } from "react";
import { api } from "../../api/api";
import { useAuthStore } from "../../store/auth";

export default function OrderPage() {
    
    const [open, setOpen] = useState({});  // 상세 목록 펼치기/접기 토글 
    const toggle = (id) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

    const [ orders, setOrders ] = useState([]);
    const { user } = useAuthStore();

    const statusMap = {
        PAID: "결제 완료",
        CANCELED: "주문 취소",
        SHIPPING: "배송 중",
        SHIPPED: "배송 완료"
    };

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                console.log(user);
                const res = await api.get(`/orders/user/${user.userId}`);
                setOrders(res.data.data);
            }
            catch(err){
                console.log(err);
            }
        }
        fetchOrders();
    }, [user, orders]);


  return (
    <div style={{ background: "#f7f8fa", minHeight: "100vh", padding: "40px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 32 }}>주문내역</h2>


        {orders.map((order) => {
          const firstItem = order.orderProducts[0];
          return (
            <div
              key={order.no}
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
                  <div style={{ color: "#222", fontWeight: 500, marginBottom: 4 }}>주문번호 {order.no}</div>
                  <div style={{ color: "#888", fontSize: 15, marginBottom: 12 }}>{order.date} 주문</div>
                </div>
                 {/*토글*/}
                <button
                  onClick={() => toggle(order.no)}
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
                        transform: open[order.no] ? "rotate(90deg)" : "rotate(0deg)",
                        marginLeft: 10,
                        fontWeight: 700
                        }}
                    > &gt;</span>
                  
                </button>
              </div>
              
              {/* 닫혀있을 때 첫 상품만 */}
              {!open[order.no] && (
                
                
                <div style={{ marginTop: 24 }}>
                    <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>총 {order.orderProducts.length}건</h2>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #a2a2a2ff", marginTop: 3, marginBottom: 12, }}/>
                    
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "20px 0",
                    }}
                  >
                    <img
                      src={firstItem.mainImageUrl}
                      alt={firstItem.name}
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
                        { statusMap[order.status] || "알 수 없음" }
                      </div>
                      <div style={{ color: "#222", fontWeight: 500, marginBottom: 2 }}>{firstItem.name}</div>
                      <div style={{ color: "#aaa", fontSize: 14 }}>{firstItem.artistName}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: "#111" }}>
                      ₩{firstItem.price}
                    </div>
                  </div>
                </div>
              )}

              {/* 열려있을 때 전체 상세 */}
              {open[order.no] && (
                <div style={{ marginTop: 24 }}>
                <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>주문상품</h2>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "1px solid #a2a2a2ff", marginTop: 3, marginBottom: 12, }}/>
                  {/* 모든 상품 */}
                  {order.orderProducts.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        borderBottom: idx < order.orderProducts.length - 1 ? "1px solid #eee" : "none",
                        padding: "20px 0",
                      }}
                    >
                      <img
                        src={item.mainImageUrl}
                        alt={item.name}
                        style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", marginRight: 24 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            color: "#22b8cf",
                            // Todo!!! 색상 변경 
                            fontWeight: 700,
                            marginBottom: 4,
                          }}
                        >
                          {statusMap[order.status]}
                        </div>
                        <div style={{ color: "#222", fontWeight: 500, marginBottom: 2 }}>{item.name}</div>
                        {item.category === "멤버십"
                            ? (
                                <div style={{ color: "#737373ff", fontSize: 14 }}>멤버십 유효기간 {item.membershipStartDate} ~ {item.membershipEndDate}</div>
                            )
                            : null
                        }
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 18, color: "#111" }}>
                        ₩{item.price}
                      </div>
                    </div>
                  ))}

                  {/* 주문자 / 배송 / 결제 */}
                  <div style={{ padding: "20px 0", paddingTop: 40, borderTop: "1px solid rgba(238, 238, 238, 1)" }}>
                    <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>배송지</h2>

                    <div style={{ paddingBottom: 8, borderBottom: "1px solid #a2a2a2ff", marginTop: 3, marginBottom: 12, }}/>
                    <div style={{marginBottom: 8}}>{order.userName}</div>
                    <div style={{marginBottom: 8}}>{order.receiverPhone}</div>
                    <div style={{marginBottom: 8}}>{order.receiverAddr + order.receiverAddrDetail} ( {order.receiverPostal} )</div>
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
                        <div style={{fontWeight: 800}}>₩{order.totalPrice}</div>
                    </div>
                    <div style={{marginBottom: 8}}>결제 방법: {order.payment}</div>
                    <div style={{marginBottom: 12}}>결제 일시: {order.date}</div>
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
