// src/pages/ProductList.jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProductList } from "../../utils/ProductApi";
import { getCategories } from "../../utils/CategoryApi";

const DUMMY_IMG = "/assets/img/gallery/arrival1.png";

export default function ProductList() {
  const { artistId } = useParams();

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

  const toKRW = (n) =>
    typeof n === "number" ? n.toLocaleString("ko-KR") : n ?? "";

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
      {/* breadcrumb */}
      <div className="page-notification">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb justify-content-center">
                  <li className="breadcrumb-item"><a href="/">Home</a></li>
                  <li className="breadcrumb-item"><a href="#">Shop</a></li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Artist #{artistId}
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
                <h2>Shop with us</h2>
                <p>{pageInfo.totalElements.toLocaleString()} items found</p>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Left content */}
            <div className="col-xl-3 col-lg-3 col-md-4">
              <div className="category-listing mb-50">
                <div className="single-listing">
                  {/* Category Select */}
                  <div className="select-job-items2">
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => {
                        setSelectedCategoryId(e.target.value || "");
                        setPageInfo((p) => ({ ...p, page: 0 }));
                      }}
                    >
                      <option value="">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.categoryName}
                        </option>
                      ))}
                    </select>
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
                          <div className="single-new-arrival mb-50 text-center">
                            <div className="popular-img">
                              <img
                                src={p.mainImageUrl || DUMMY_IMG}
                                alt={p.productName}
                                style={{ width: "100%", height: 260, objectFit: "cover" }}
                                onError={(e) => (e.currentTarget.src = DUMMY_IMG)}
                              />
                              <div className="favorit-items">
                                <img src="/assets/img/gallery/favorit-card.png" alt="" />
                              </div>
                            </div>
                            <div className="popular-caption">
                              <h3><a href={`/shop/product/${p.id}`}>{p.productName}</a></h3>
                              
                              <span>₩ {toKRW(p.price)}</span>
                              <div className="mt-2" style={{ fontSize: 12, color: "#666" }}>
                                <div>등록일 : {p.registDate}</div>
                                <div>시작 발매시간 : {p.openDate ? p.openDate.replace("T", " ") : ""}</div>
                            </div>
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
