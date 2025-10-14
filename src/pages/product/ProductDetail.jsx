// src/pages/ProductDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProductDetail } from "../../utils/ProductApi";
import { getMembership } from "../../utils/MembershipApi";
import { useAuthStore } from "../../store/auth";
import { addCart } from "../../utils/CartApi";
import { getCart } from "../../utils/CartApi";
import toast from "react-hot-toast";

const DUMMY_IMG = "/assets/img/dummyImg/bts_product1-1.jpg";
const DUMMY_LONG_IMG = "/assets/img/dummyImg/bts_product1-detail.jpg";

export default function ProductDetail() {
  const { productId } = useParams();
  const [detail, setDetail] = useState(null);
  const [currentImg, setCurrentImg] = useState(DUMMY_IMG);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeTab, setActiveTab] = useState("detail"); // 'detail' | 'notice'
  const [membership, setMembership] = useState();
  const { user } = useAuthStore();
  const [cart, setCart] = useState(null);

  const [myMembership, setMyMembership] = useState(null);

  // 유저의 장바구니 정보 불러오기
  useEffect(() => {
    if (user?.userId) {
      getCart(user.userId)
        .then(res => setCart(res.data?.data || []))
        .catch(e => console.error("장바구니 정보 불러오기 실패:", e));
    }
  }, [user?.userId]);

  const toKRW = (n) =>
    typeof n === "number" ? `₩${n.toLocaleString("ko-KR")}` : n ?? "";

  // 최대 구매 수량 계산
  const maxQty = useMemo(() => {
    if (!detail) return 1;

    const limit = Number(detail.purchaseLimit ?? 0);

    // 음수 또는 0 → 제한 없음 (기본 99)
    if (limit <= 0) return 99;

    // 양수면 그 limit까지만 허용
    return Math.max(1, limit);
  }, [detail]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        if (!productId) {
          setErr("잘못된 상품 주소입니다.");
          setLoading(false);
          return;
        }

        const res = await getProductDetail(productId);
        const data = res?.data?.data ?? res?.data ?? null;
        console.log(res.data.data);
        setDetail(data);

        // 메인 이미지 기본값 설정
        const main = data?.mainImageUrl || DUMMY_IMG;
        setCurrentImg(main);
      } catch (e) {
        console.error("상품 상세 API 실패:", e);
        setErr("상품 정보를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  // 유저의 멤버십 정보 불러오기
  useEffect(() => {
    (async () => {
      try {
        const res = await getMembership(user.userId);

        setMembership(res.data.data);
        console.log(res.data.data);
      } catch (e) {
        console.error("멤버십 정보 불러오기 실패:", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!membership || !detail) return;
  
    const today = new Date();
    const found = membership.find((m) => {
      if (m.artistName !== detail.artistName) return false;
      const start = new Date(m.startDate);
      const end = new Date(m.endDate);
      return today >= start && today <= end;
    });
  
    setMyMembership(found);

    console.log("mymembership" + found);

  }, [membership, detail]);

  // 발매일 검증 함수
  const isNotReleasedYet = (detail) => {
    if (!detail?.salesOpenAt) return false;
    const openDate = new Date(detail.salesOpenAt);
    const now = new Date();
    return openDate > now; // 발매일이 미래면 true
  };


  // 멤버십 검증 함수
  const isFanLimitedBlocked = (detail) => {
    if (!detail) return false;

    // 팬전용 상품인지 검사
    if (detail.fanLimited) {
      const today = new Date();

      // 유저가 해당 아티스트 멤버십을 가지고 있는지 검사
     const hasValidMembership = membership.some((m) => {
        if (m.artistName !== detail.artistName) return false;
        const start = new Date(m.startDate);
        const end = new Date(m.endDate);
        return today >= start && today <= end;
      });

      return !hasValidMembership; // 차단되면 true
    }
    return false; // 일반 상품은 항상 통과
  };

  // 장바구니 담기
  const handleAddCart = async () => {
    /*if (!detail || !cart) {
      toast.error("상품 또는 장바구니 정보를 불러오는 중입니다.");
      return;
    }*/

    // 기존 유효성 검사 (발매일, 멤버십)
    if (isNotReleasedYet(detail)) {
      toast.error("아직 발매되지 않은 상품입니다. 발매일 이후에 구매 가능합니다.");
      return;
    }
    if (isFanLimitedBlocked(detail)) {
      toast.error(`${detail.artistName} 멤버십에 가입한 회원만 이용할 수 있습니다.`);
      return;
    }

    // 장바구니 수량 기반 구매 제한 검사
    const itemInCart = cart.find(item => item.productId === detail.id);
    const currentQtyInCart = itemInCart ? itemInCart.qty : 0;
    const allowedToAdd = maxQty - currentQtyInCart;

    if (qty > allowedToAdd) {
      if (allowedToAdd <= 0) {
        toast.error(`이 상품은 최대 ${maxQty}개까지 구매 가능하며, 이미 장바구니에 최대 수량이 담겨있습니다.`);
      } else {
        toast.error(`이 상품은 최대 ${maxQty}개까지 구매 가능합니다. ${allowedToAdd}개 더 담을 수 있습니다.`);
      }
      return;
    }
    
    try {
      const res = await addCart(user.userId, detail.id, qty);
      if (res.data.success) {
        toast.success("장바구니에 담았습니다!");
        // 장바구니 상태 최신화
        getCart(user.userId).then(res => setCart(res.data?.data || []));
      } else {
        toast.error(res.data.message || "장바구니 담기 실패");
      }
    } catch (e) {
      console.error("장바구니 추가 실패:", e.response);
      toast.error(e.response?.data?.message || "오류가 발생했습니다.");
    }
  };


  // 구매하기
  const handlePurchase = async () => {
    if (!detail) return;

    // 발매일 전이면 차단
    if (isNotReleasedYet(detail)) {
      toast.error("아직 발매되지 않은 상품입니다. 발매일 이후에 구매 가능합니다.");
      return;
    }

    // 멤버십 전용 상품인데 멤버십이 없으면 차단
    if (isFanLimitedBlocked(detail)) {
      toast.error(`${detail.artistName} 멤버십에 가입한 회원만 이용할 수 있습니다.`);
      return;
    }

    try {
      // 실제 구매 로직은 미구현
      toast.success("구매하기 기능은 데모입니다.");
    } catch (e) {
      toast.error("구매 실패");
    }
  };

  if (loading) return <main className="container py-5 text-center">Loading...</main>;
  if (err || !detail)
    return (
      <main className="container py-5 text-center text-danger">
        {err || "상품을 찾을 수 없습니다."}
      </main>
    );

  const {
    artistName,
    productName,
    price,
    detail: description,
    salesOpenAt,
    fanLimited,
    mainImageUrl,
    detailImages = [],
  } = detail;

  const images = [mainImageUrl, ...detailImages.map((d) => d.url)].filter(Boolean);

  return (
    <main>
      {/* breadcrumb (inline styles only) */}
      <div
        style={{
          marginBottom: 30,
          padding: '14px 0',
          background: 'linear-gradient(180deg, #f7f2ff 0%, #fbf9ff 100%)',
          border: '1px solid #ece4ff',
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(115,74,222,0.08)',
        }}
      >
        <div className="container" style={{ maxWidth: 1140 }}>
          <div className="row">
            <div className="col-lg-12">
              <nav aria-label="breadcrumb">
                <ol
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 10,
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    color: '#3b2b6d',
                    fontWeight: 700,
                  }}
                >
                  <li>
                    <Link
                      to="/"
                      style={{
                        color: '#734ade',
                        textDecoration: 'none',
                        fontWeight: 700,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      Home
                    </Link>
                  </li>

                  <li aria-hidden="true" style={{ color: '#9a86ff', fontWeight: 700 }}>›</li>

                  <li>
                    <Link
                      to="#"
                      style={{
                        color: '#734ade',
                        textDecoration: 'none',
                        fontWeight: 700,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      Shop
                    </Link>
                  </li>

                  <li aria-hidden="true" style={{ color: '#9a86ff', fontWeight: 700 }}>›</li>

                  <li
                    aria-current="page"
                    style={{
                      color: '#3b2b6d',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {artistName}
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 영역 */}
      <div className="container" style={{ maxWidth: 1140 }}>
        <div className="row">
          {/* Left: 이미지 갤러리 */}
          <div className="col-lg-6 mb-4">
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ border: "#edededff solid 2px", borderRadius: 12, minHeight: 520 }}
            >
              <img
                src={currentImg || DUMMY_IMG}
                alt={productName}
                onError={(e) => (e.currentTarget.src = DUMMY_IMG)}
                style={{ width: "100%", height: "auto", objectFit: "contain" }}
              />
            </div>

            {/* 썸네일 리스트 (클릭 시 메인 변경) */}
            {images.length > 0 && (
              <div className="row mt-3">
                {images.map((url, idx) => (
                  <div key={idx} className="col-3 mb-3">
                    <button
                      className="p-0 w-100"
                      style={{ background: "transparent", border: "none" }}
                      onClick={() => setCurrentImg(url)}
                    >
                      <div style={{ background: "#f7f7f7", borderRadius: 8, padding: 6 }}>
                        <img
                          src={url || DUMMY_IMG}
                          alt={`thumb-${idx}`}
                          onError={(e) => (e.currentTarget.src = DUMMY_IMG)}
                          style={{
                            width: "100%",
                            height: 90,
                            objectFit: "cover",
                            borderRadius: 6,
                            outline: currentImg === url ? "2px solid #00c6cf" : "none",
                          }}
                        />
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: 정보/구매 */}
          <div className="col-lg-6">
            <div className="mb-2" style={{ color: "#666", fontSize: "20px" }}>{artistName}</div>
            <h3 className="mb-2" style={{ lineHeight: 1.3, fontSize: "25px" }}>{productName}</h3>

            {fanLimited && (
              <div className="mb-2" style={{ color: "#7e5bef", fontSize: 15 }}>
                멤버십 전용 상품입니다
              </div>
            )}

            <div className="mb-3" style={{ fontSize: "25px", fontWeight: 800 }}>
              {toKRW(price)}
            </div>

            {isNotReleasedYet(detail) && (
              <div className="mb-3" style={{ color: "#7e5bef", fontSize: 15 }}>
                발매 시작일 :　{salesOpenAt}
              </div>
            )}

            {/* 구매 제한 */}
            <div className="mb-3" style={{ color: "#6a6a6a", fontSize: 15, marginTop: 20 }}>
              최대 {maxQty}개까지 구매 가능
            </div>

            {/* 옵션(단일 상품용) */}<div
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid #ddd",
                borderRadius: 4,
                overflow: "hidden",
                userSelect: "none",
                marginBottom: 20,
              }}
            >
              {/* - 버튼 */}
              <button
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                style={{
                  width: "100%",
                  height: 36,
                  padding: "0 16px",
                  border: "none",
                  background: "#f6f6f6",
                  fontSize: 18,
                  color: "#555",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                −
              </button>

              {/* 입력창 */}
              <input
                type="number"
                value={qty}
                min={1}
                max={maxQty}
                onChange={(e) => {
                  let n = Number(e.target.value);
                  if (isNaN(n) || n < 1) n = 1;
                  if (n > maxQty) n = maxQty;
                  setQty(n);
                }}
                style={{
                  width: 60,
                  height: 36,
                  textAlign: "center",
                  border: "none",
                  borderLeft: "1px solid #ddd",
                  borderRight: "1px solid #ddd",
                  outline: "none",
                  fontSize: 16,
                  fontWeight: 600,
                  background: "#fff",
                  color: "#333",
                }}
                onWheel={(e) => e.target.blur()} // 스크롤로 값 바뀌는 것 방지
              />


              {/* + 버튼 */}
              <button
                onClick={() => setQty((prev) => Math.min(maxQty, prev + 1))}
                style={{
                  width: "100%",
                  height: 36,
                  padding: "0 12px",
                  border: "none",
                  background: "#f6f6f6",
                  fontSize: 18,
                  color: "#555",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                ＋
              </button>
            </div>

            {/* 합계 */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div style={{ color: "#6a6a6a" }}>합계</div>
              <div style={{ fontSize: "33px", fontWeight: 800 }}>
                {toKRW((price || 0) * qty)}
              </div>
            </div>

            {/* 버튼 */}
            <div className="d-flex gap-3">
              { (detail.categoryName === "Membership" && myMembership?.startDate) ? (
                 <div
                      className="border-btn flex-grow-1 "
                      style={{ 
                        width: "100px", margin: "10px 5px 10px 0px", cursor: "text",
                        display: "flex",             // 🔹 플렉스 컨테이너
                        justifyContent: "center",    // 🔹 가로 중앙
                        alignItems: "center",
                        color: "#848484ff",
                        background: "#f3f3f3",  
                      }}
                    >

                      
                      유효기간  
                      { myMembership?.startDate 
                      ? ` ${new Date(myMembership.startDate).toLocaleDateString("ko-KR",{
                         year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )} ~ ${new Date(myMembership.endDate).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}`
                      : "정보 없음"}
                            
                    </div>
                )

                : !detail.initialStock ? (
                   <div
                      className="border-btn flex-grow-1 "
                      style={{ 
                        width: "100px", margin: "10px 5px 10px 0px", cursor: "text",
                        display: "flex",             // 🔹 플렉스 컨테이너
                        justifyContent: "center",    // 🔹 가로 중앙
                        alignItems: "center",
                        color: "#848484ff",
                        background: "#f3f3f3",  
                      }}
                    >
                      SOLD OUT
                    </div>
              ) : (
                  <>
                
              <button
                className="border-btn flex-grow-1"
                style={{ width: "100px", margin: "10px 5px 10px 0px", }}
                onClick={handleAddCart}>
                장바구니 추가
              </button>
              <button
                className="btn flex-grow-1"
                style={{ width: "100px", margin: "10px 0px 10px 0px", background: "#b084db", color: "#fff" }}
                onClick={handlePurchase}
              >
                구매하기
              </button>
              </>
            )}                 
            </div>

            {/* 간단 설명 */}
            {description && (
              <div className="mt-4">
                <div className="mb-2" style={{ fontWeight: 700, fontSize: 17, color: "#222", marginTop: 30 }}>
                  상품 설명
                </div>
                <div style={{ color: "#444", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                  {description}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ====== 하단 탭 영역 ====== */}
        <div className="mt-5">
          {/* 탭 헤드 */}
          <div className="d-flex justify-content-center align-items-center" style={{ gap: 80 }}>
            {["detail", "notice"].map((key) => {
              const isActive = activeTab === key;
              const label = key === "detail" ? "상세정보" : "유의사항";
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: 20,
                    fontWeight: isActive ? 800 : 700,
                    color: isActive ? "#111" : "#777",
                    paddingBottom: 10,
                    position: "relative",
                  }}
                >
                  {label}
                  {isActive && (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 3,
                        background: "#111",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <hr className="mt-0" />

          {/* 탭 콘텐츠 */}
          {activeTab === "detail" ? (
            // 상세 이미지 롱폼 (가운데 정렬)
            <div className="d-flex justify-content-center">
              <img
                src={DUMMY_LONG_IMG}
                onError={(e) => (e.currentTarget.src = DUMMY_LONG_IMG)}
                alt="상세"
                style={{
                  maxWidth: 900,          // 롱 이미지 자체 폭 제한
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                  marginBottom: 60
                }}
              />
            </div>
          ) : (
            // 유의사항(샘플)
            <div className="mx-auto" style={{ maxWidth: 900 }}>
              <ul style={{ lineHeight: 1.9, color: "#555", marginBottom: 60 }}>
                <li>본 상품의 색상과 구성은 모니터 해상도 및 촬영 환경에 따라 차이가 있을 수 있습니다.</li>
                <li>구매 제한 수량을 초과한 주문은 사전 통보 없이 취소될 수 있습니다.</li>
                <li>개봉 후 단순 변심에 의한 교환/환불은 불가합니다. (불량은 수령 후 7일 이내 문의)</li>
                <li>배송 관련 문의는 고객센터로 연락해 주세요.</li>
              </ul>
            </div>
          )}
        </div>
        {/* ====== 하단 탭 영역 끝 ====== */}
      </div>
    </main>
  );
}
