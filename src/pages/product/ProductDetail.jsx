// src/pages/ProductDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProductDetail } from "../../utils/ProductApi";

const DUMMY_IMG = "/assets/img/gallery/bts_product_image.jpg";
const DUMMY_LONG_IMG = "/assets/img/gallery/bts_long_image.jpg";

export default function ProductDetail() {
  const { productId } = useParams(); 
  const [detail, setDetail] = useState(null);
  const [currentImg, setCurrentImg] = useState(DUMMY_IMG);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeTab, setActiveTab] = useState("detail"); // 'detail' | 'notice'

  const toKRW = (n) =>
    typeof n === "number" ? `₩${n.toLocaleString("ko-KR")}` : n ?? "";

  const maxQty = useMemo(() => {
    if (!detail) return 1;
    const a = Number(detail.initialStock ?? 0);
    const b = Number(detail.purchaseLimit ?? 0); // 0/음수면 제한 없음
    const byLimit = b > 0 ? b : a > 0 ? a : 99;
    return Math.max(1, byLimit);
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

  const handleAddCart = async () => {
    if (!detail) return;
    try {
      alert("장바구니에 담았습니다. (데모)");
    } catch (e) {
      alert("장바구니 담기 실패");
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
    productStatus,
    mainImageUrl,
    detailImages = [],
  } = detail;

  const images = [mainImageUrl, ...detailImages.map((d) => d.url)].filter(Boolean);

  return (
    <main>
      {/* breadcrumb */}
      <div className="page-notification">
        <div className="container" style={{ maxWidth: 1140 }}>
          <div className="row">
            <div className="col-lg-12">
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb justify-content-center">
                  <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                  <li className="breadcrumb-item"><Link to="#">Shop</Link></li>
                  <li className="breadcrumb-item active" aria-current="page">{artistName}</li>
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
              style={{ background: "#f3f3f3", borderRadius: 12, minHeight: 520 }}
            >
              <img
                src={currentImg || DUMMY_IMG}
                alt={productName}
                onError={(e) => (e.currentTarget.src = DUMMY_IMG)}
                style={{ width: "88%", height: "auto", objectFit: "contain" }}
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
            <div className="mb-2" style={{ color: "#666" }}>{artistName}</div>
            <h3 className="mb-2" style={{ lineHeight: 1.3 }}>{productName}</h3>

            {fanLimited && (
              <div className="mb-2" style={{ color: "#7e5bef", fontSize: 13 }}>
                소득공제 · 팬클럽 한정
              </div>
            )}

            <div className="mb-3" style={{ fontSize: 28, fontWeight: 800 }}>
              {toKRW(price)}
            </div>

            {salesOpenAt && (
              <div className="mb-3" style={{ color: "#6a6a6a", fontSize: 14 }}>
                최대 캐시 | {salesOpenAt}
              </div>
            )}

            {/* 옵션(단일 상품용) */}
            <div className="card mb-3" style={{ borderRadius: 12 }}>
              <div className="card-body">
                <div className="mb-2" style={{ color: "#6a6a6a", fontSize: 14 }}>
                  {productName}
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <input
                    type="number"
                    min={1}
                    max={maxQty}
                    value={qty}
                    onChange={(e) => {
                      const n = Number(e.target.value || 1);
                      setQty(Math.min(Math.max(isNaN(n) ? 1 : n, 1), maxQty));
                    }}
                    className="form-control"
                    style={{ maxWidth: 120 }}
                  />
                  <div style={{ fontWeight: 700 }}>{toKRW(price)}</div>
                </div>
              </div>
            </div>

            {/* 구매 제한/상태 */}
            <div className="mb-3" style={{ color: "#6a6a6a", fontSize: 14 }}>
              1개 선택 · 최대 {maxQty}개까지 구매할 수 있습니다
              {productStatus && <> · 상태: <b>{String(productStatus)}</b></>}
            </div>

            {/* 합계 */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div style={{ color: "#6a6a6a" }}>합계</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>
                {toKRW((price || 0) * qty)}
              </div>
            </div>

            {/* 버튼 */}
            <div className="d-flex gap-3">
              <button className="border-btn flex-grow-1" onClick={handleAddCart}>
                장바구니 추가
              </button>
              <button
                className="btn flex-grow-1"
                style={{ background: "#b084db", color: "#fff" }}
                onClick={() => alert("구매하기 (데모)")}
              >
                구매하기
              </button>
            </div>

           {/* 간단 설명 */}
            {description && (
            <div className="mt-4">
                <div className="mb-2" style={{ fontWeight: 700, fontSize: 16, color: "#222" }}>
                상품 설명
                </div>
                <div style={{ color: "#444", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                {description}
                </div>
            </div>
            )}
            {/* 프로모션 카드 (샘플) */}
            <div className="mt-4">
            <div
                className="card shadow-sm"
                style={{ border: "none", borderRadius: 12, overflow: "hidden" }}
            >
                <div className="row g-0 align-items-center">
                <div className="col-md-4">
                    <img
                    src="/assets/img/gallery/promo_dummy.jpg"  // 더미 이미지 경로
                    alt="프로모션"
                    onError={(e) => (e.currentTarget.src = "/assets/img/gallery/arrival8.png")}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                </div>
                <div className="col-md-8">
                    <div className="card-body">
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <span
                        className="badge"
                        style={{ background: "#00c6cf", color: "#fff", fontWeight: 700 }}
                        >
                        PROMO
                        </span>
                        <span style={{ color: "#666", fontSize: 13 }}>한정 기간</span>
                    </div>
                    <h5 className="card-title mb-2" style={{ fontWeight: 800 }}>
                        시즌 굿즈 세트 구매 시 10% OFF
                    </h5>
                    <p className="card-text mb-3" style={{ color: "#555" }}>
                        오늘 주문하면 즉시 적용! 일부 품목 제외 / 재고 소진 시 종료됩니다.
                    </p>
                    <div className="d-flex gap-2">
                        <a href="#" className="btn btn-sm" style={{ background: "#111", color: "#fff" }}>
                        자세히 보기
                        </a>
                        <a href="#" className="border-btn btn-sm">
                        지금 쇼핑하기
                        </a>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </div>

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
                }}
              />
            </div>
          ) : (
            // 유의사항(샘플)
            <div className="mx-auto" style={{ maxWidth: 900 }}>
              <ul style={{ lineHeight: 1.9, color: "#555" }}>
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
