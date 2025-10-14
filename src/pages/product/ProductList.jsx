// src/pages/ProductList.jsx
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProductList } from "../../utils/ProductApi";
import { getCategories } from "../../utils/CategoryApi";
import { getArtist } from "../../utils/ArtistApi";
import { useNavigate } from "react-router-dom";

const DUMMY_IMG = "/assets/img/gallery/arrival1.png";

export default function ProductList() {
  const { artistId } = useParams();
  const [artist, setArtist] = useState();

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [products, setProducts] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    page: 0,
    size: 24,
    totalElements: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const toKRW = (n) =>
    typeof n === "number" ? n.toLocaleString("ko-KR") : n ?? "";

  // 아티스트 정보 불러오기
  useEffect(() => {
    (async () => {
      try {
        const res = await getArtist(artistId);
        setArtist(res.data);
      } catch (e) {
        console.error("아티스트 정보 불러오기 실패:", e);
      }
    })();
  }, [artistId]);

  // 카테고리 불러오기
  useEffect(() => {
    (async () => {
      try {
        const res = await getCategories();
        const list = res?.data?.data ?? res?.data ?? [];
        setCategories(list);
      } catch (e) {
        console.error("카테고리 불러오기 실패:", e);
      }
    })();
  }, []);

  // 상품 불러오기
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = { page: pageInfo.page, size: pageInfo.size };
        if (selectedCategoryId) params.categoryId = selectedCategoryId;

        const res = await getProductList(artistId, params);
        const page = res?.data?.data ?? res?.data ?? {};
        const items = page.content ?? [];

        setProducts(items);
        setPageInfo((prev) => ({
          ...prev,
          totalElements: page.totalElements ?? 0,
          totalPages: page.totalPages ?? 0,
        }));
      } catch (e) {
        console.error("상품 불러오기 실패:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [artistId, selectedCategoryId, pageInfo.page, pageInfo.size]);

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
                   {artist ? `${artist.name}` : ""}
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>
      {/* listing Area */}
      <div className="category-area">
        <div className="container">
          <div className="row">
            <div className="col-xl-7 col-lg-8 col-md-10">
              <div className="section-tittle mb-50">
                <h2 style={{ minWidth: "1200px" }}>Shop with {artist ? `${artist.name}` : ""}</h2>
                <p>{pageInfo.totalElements.toLocaleString()} items found</p>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Left content */}
              <div className="col-xl-3 col-lg-3 col-md-4">
                <div className="category-listing mb-50">
                  <div className="single-listing">
                    <div
                      style={{
                        marginBottom: 30,
                        padding: "14px 0",
                        background: "linear-gradient(180deg, #f7f2ff 0%, #fbf9ff 100%)",
                        border: "1px solid #ece4ff",
                        borderRadius: 16,
                        boxShadow: "0 8px 24px rgba(115,74,222,0.08)",
                      }}
                    >
                      <div className="category-list" style={{ padding: "0 16px" }}>
                        {/* All Categories */}
                        <div
                          onClick={() => {
                            setSelectedCategoryId("");
                            setPageInfo((p) => ({ ...p, page: 0 }));
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.05)")}
                          onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1.0)")}
                          style={{
                            cursor: "pointer",
                            padding: "10px 14px",
                            borderRadius: "12px",
                            marginBottom: "8px",
                            background:
                              selectedCategoryId === ""
                                ? "linear-gradient(180deg, #734ade 0%, #8c5bff 100%)"
                                : "transparent",
                            color: selectedCategoryId === "" ? "#fff" : "#4b3f72",
                            fontWeight: selectedCategoryId === "" ? "600" : "500",
                            boxShadow:
                              selectedCategoryId === ""
                                ? "0 4px 12px rgba(115,74,222,0.25)"
                                : "none",
                            transition: "all 0.2s ease-in-out",
                          }}
                        >
                          All Categories
                        </div>

                        {/* Category Items */}
                        {categories.map((c) => {
                          const selected = selectedCategoryId === c.id;
                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                setSelectedCategoryId(c.id);
                                setPageInfo((p) => ({ ...p, page: 0 }));
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.05)")}
                              onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1.0)")}
                              style={{
                                cursor: "pointer",
                                padding: "10px 14px",
                                borderRadius: "12px",
                                marginBottom: "8px",
                                background: selected
                                  ? "linear-gradient(180deg, #734ade 0%, #8c5bff 100%)"
                                  : "transparent",
                                color: selected ? "#fff" : "#4b3f72",
                                fontWeight: selected ? "600" : "500",
                                boxShadow: selected
                                  ? "0 4px 12px rgba(115,74,222,0.25)"
                                  : "none",
                                transition: "all 0.2s ease-in-out",
                              }}
                            >
                              {c.categoryName}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>



            {/* Right content */}
            <div className="col-xl-9 col-lg-9 col-md-8">
              <div className="new-arrival new-arrival2">
                {loading ? (
                  <div className="text-center py-5">Loading...</div>
                ) : (
                  <div className="row">
                    {products.length === 0 ? (
                      <div className="col-12 text-center py-5">상품이 없습니다.</div>
                    ) : (
                      products.map((p) => (
                        <div key={p.id} className="col-xl-4 col-lg-4 col-md-6 col-sm-6">
                          <div
                            className="single-new-arrival mb-50 text-center">
                            <div className="popular-img">
                              <Link to={`/shop/product/${p.id}`}>
                                <img
                                  src={p.mainImageUrl || DUMMY_IMG}
                                  alt={p.productName}
                                  style={{ width: "100%", height: 260, objectFit: "cover", cursor: "pointer" }}
                                  onError={(e) => (e.currentTarget.src = DUMMY_IMG)}
                                />
                              </Link>
                            </div>
                            <div className="popular-caption">
                              <Link to={`/shop/product/${p.id}`}>
                                <h3
                                  style={{ cursor: "pointer" }}>
                                  {p.productName}
                                </h3>
                              </Link>
                              <span>₩ {toKRW(p.price)}</span>
                              <div className="mt-2" style={{ fontSize: 12, color: "#B084DC" }}>
                                {/* 발매 예정인 상품만 발매 시작 시간 띄우기 */}
                                {p.openDate && new Date(p.openDate) > new Date() && (
                                  <div>발매 시작 시간 : {p.openDate ? p.openDate.replace("T", " ") : ""}</div>
                                )}
                              </div>
                              {p.fanOnly && (
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#B084DC",
                                    marginTop: "5px",
                                    fontWeight: 600,
                                  }}
                                >
                                  [ 멤버십 전용 상품 ]
                                </div>
                              )}
                              {/* ✅ 품절 배지 */}
                              {p.stockQty === 0 && (
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#cb0000ff",
                                    marginTop: "5px",
                                    fontWeight: 600,
                                  }}
                                >
                                  Sold Out
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Pagination */}
                {pageInfo.totalPages > 1 && (
                  <div className="row justify-content-center">
                    <div className="room-btn mt-20">
                      {Array.from({ length: pageInfo.totalPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setPageInfo((p) => ({ ...p, page: i }))}
                          className={`border-btn mx-1 ${i === pageInfo.page ? "bg-dark text-white" : ""}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Right content End */}
          </div>
        </div>
      </div>
    </main>
  );
}
