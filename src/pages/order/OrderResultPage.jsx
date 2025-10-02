import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOrderDetail } from "../../utils/OrderApi";

export default function OrderResultPage() {
  const { orderId } = useParams(); // 라우터에서 전달받은 주문번호
  const [order, setOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const res = await getOrderDetail(orderId);
      setOrder(res.data.data);
    } catch (err) {
      console.error("주문 상세 조회 실패:", err);
    }
  };

  // ===== 주문 상태 → badge 색상 + 텍스트 매핑 =====
  const getStatus = (status) => {
    if (status === 'PAID') { return "주문 완료"; }
    else if (status === 'SHIPPED') { return "배송 완료"; }
    else if (status === 'CANCELED') { return "주문 취소"; }
    else if (status === 'SHIPPING') { return "배송 중"; }
  }

  if (!order) {
    return <main className="custom-background orderlist">Loading...</main>;
  }

  return (
    <main className="custom-background orderlist">
      <div className="orderlistBox">
        <div className="orderlistHeader">
          <div className="orderlistIcon">✔</div>
          <h2 className="orderlistTitle">Thank You!</h2>
          <div className="orderlistDesc">주문이 정상적으로 완료되었습니다.</div>
          <div className="orderlistStatus">
            주문 상태: <span className="text1">{getStatus(order.status)}</span>
          </div>
          <div className="orderlistId">
            주문 번호: <span className="text2">{order.no}</span>
          </div>
        </div>

        <div className="orderlistContent">
          {/* 총 주문 수량 표시 */}
          <h3 className="orderlistSubtitle">
            주문 상품
          </h3>
          <div>
            {order.orderProducts.map((item, idx) => (
              <div key={idx} className="orderlistItem">
                <div className="orderlistItemImg">
                  {item.mainImageUrl ? (
                    <img
                      src={item.mainImageUrl}
                      alt={item.name}
                      className="orderlistImg"
                    />
                  ) : (
                    <span className="orderlistImgIcon">🛒</span>
                  )}
                </div>
                <div className="orderlistItemInfo">
                  <div className="orderlistItemName">{item.name}</div>

                  {/* 멤버십일 경우 서버에서 내려준 기간 표시 */}
                  {item.category === "멤버십" &&
                    item.membershipStartDate &&
                    item.membershipEndDate && (
                      <div className="orderlistItemPeriod">
                        멤버십 유효기간:{" "}
                        {new Date(item.membershipStartDate).toLocaleDateString("ko-KR")} ~{" "}
                        {new Date(item.membershipEndDate).toLocaleDateString("ko-KR")}
                      </div>
                    )}

                  <div className="orderlistItemPrice">
                    ₩ {item.price.toLocaleString()} ({item.qty}개)
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="orderlistBtn"
            onClick={() => navigate("/order/list")}
          >
            주문내역 확인하기
          </button>
        </div>

      </div>
    </main>
  );
}
