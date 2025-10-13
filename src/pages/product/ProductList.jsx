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
      {/* New Header Banner */}
      <div style={{
        padding: '4rem 2rem',
        marginBottom: '2rem',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center',
        boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontWeight: 600, fontSize: '3rem', margin: 0 }}>{artist ? artist.name : "Artist"}</h1>
      </div>

      {/* Main Content Area */}
      <div className="category-area">
        <div className="container">
          <div className="row">
            {/* Left Sidebar: Redesigned Categories */}
            <div className="col-xl-3 col-lg-3 col-md-4">
              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px' }}>
                <h4 style={{ fontWeight: 400, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #eee'}}>Categories</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li key="all">
                    <button 
                      onClick={() => { setSelectedCategoryId(""); setPageInfo(p => ({ ...p, page: 0 })); }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 15px', marginBottom: '5px', borderRadius: '8px', border: 'none',
                        background: selectedCategoryId === "" ? '#764ba2' : 'transparent',
                        color: selectedCategoryId === "" ? 'white' : '#333',
                        fontWeight: selectedCategoryId === "" ? 'bold' : 'normal',
                        cursor: 'pointer', transition: 'background 0.2s ease'
                      }}
                    >
                      All Categories
                    </button>
                  </li>
                  {categories.map((c) => (
                    <li key={c.id}>
                      <button 
                        onClick={() => { setSelectedCategoryId(c.id); setPageInfo(p => ({ ...p, page: 0 })); }}
                        style={{
                          width: '100%', textAlign: 'left', padding: '10px 15px', marginBottom: '5px', borderRadius: '8px', border: 'none',
                          background: selectedCategoryId === c.id ? '#764ba2' : 'transparent',
                          color: selectedCategoryId === c.id ? 'white' : '#333',
                          fontWeight: selectedCategoryId === c.id ? 'bold' : 'normal',
                          cursor: 'pointer', transition: 'background 0.2s ease'
                        }}
                      >
                        {c.categoryName}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Product List */}
            <div className="col-xl-9 col-lg-9 col-md-8">
              {loading ? (
                <div className="text-center py-5">Loading...</div>
              ) : (
                <>
                  <div className="row">
                    {products.length === 0 ? (
                      <div className="col-12 text-center py-5"><h3>상품이 없습니다.</h3></div>
                    ) : (
                      products.map((p) => (
                        <div key={p.id} className="col-xl-4 col-lg-4 col-md-6 col-sm-6">
                          <div style={{
                            border: '1px solid #eee',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            marginBottom: '30px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', height: '97%'
                          }}
                           onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; }}
                           onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)'; }}
                           onClick={() => navigate(`/shop/product/${p.id}`)}
                          >
                            <div style={{ position: 'relative' }}>
                              <img
                                src={p.mainImageUrl || DUMMY_IMG}
                                alt={p.productName}
                                style={{ width: "100%", height: 280, objectFit: "cover" }}
                                onError={(e) => (e.currentTarget.src = DUMMY_IMG)}
                              />
                              <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
                                {p.stockQty === 0 && (
                                  <span style={{ background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                                    SOLD OUT
                                  </span>
                                )}
                                {p.fanLimited && (
                                  <span style={{ background: '#7e5bef', color: 'white', padding: '4px 8px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                                    MEMBERSHIP
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                              {/* 왼쪽: 상품명 + Release를 한 줄로 직렬 나열 */}
                              <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px' }}>
                                <span style={{ fontSize: 18, fontWeight: 600 }}>
                                  {p.productName}
                                </span>
                                <span style={{ fontSize: 12, color: '#667eea', fontWeight: 600 }}>
                                  Release:&nbsp;
                                  {new Date(p.openDate).toLocaleString('ko-KR', {
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>

                              {/* 오른쪽: 가격(오른쪽 정렬) */}
                              <div style={{ marginLeft: 'auto', fontSize: 18, fontWeight: 700, color: '#333', whiteSpace: 'nowrap' }}>
                                ₩ {toKRW(p.price)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Redesigned Pagination */}
                  {pageInfo.totalPages > 1 && (
                    <nav aria-label="Page navigation" style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', gap: '0.5rem' }}>
                        {Array.from({ length: pageInfo.totalPages }, (_, i) => (
                          <li key={i} className="page-item">
                            <button
                              onClick={() => setPageInfo((p) => ({ ...p, page: i }))}
                              style={{
                                border: '1px solid #ddd',
                                background: i === pageInfo.page ? '#764ba2' : 'white',
                                color: i === pageInfo.page ? 'white' : '#555',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                transition: 'background-color 0.2s ease, color 0.2s ease'
                              }}
                            >
                              {i + 1}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
