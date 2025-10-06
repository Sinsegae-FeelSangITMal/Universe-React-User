import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import $ from "jquery";
import "slick-carousel";
import { getNewProducts } from "../../utils/ProductApi";
import { getArtists } from "../../utils/ArtistApi";

export default function Main() {
  const [newProducts, setNewProducts] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  const toKRW = (n) =>
    typeof n === "number" ? n.toLocaleString("ko-KR") : n ?? "";

  useEffect(() => {
    let mounted = true;

    // 1) 아티스트 불러오기
    (async () => {
      try {
        const res = await getArtists();
        setArtists(res.data);
        console.log(res.data);
      } catch (e) {
        console.error("아티스트 로드 실패:", e);
      }
    })();

    // 2) 신상품 8개 불러오기
    (async () => {
      try {
        const res = await getNewProducts({ page: 0, size: 8 });
        const items = res?.data?.data?.content ?? res?.data?.content ?? [];
        if (mounted) setNewProducts(items);
      } catch (e) {
        console.error("신규 상품 로드 실패:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // 3) slick 초기화
    const $slider = $(".slider-active");
    if ($slider.length > 0 && !$slider.hasClass("slick-initialized")) {
      $slider.slick({
        autoplay: true,
        autoplaySpeed: 4000,
        dots: true,
        fade: true,
        arrows: false,
      });
    }
  }, []);

  return (
    <main>
      {/* Hero Area */}
      <div className="container" style={{ minWidth: "90%", margin: "0 auto" }}>
        <div className="slider-area">
          {/* 생략: 기존 헤더/검색/소셜 */}
          <div className="slider-active dot-style">
            {/* 기존 슬라이드들 유지 */}
            <div className="single-slider slider-bg1 hero-overly slider-height d-flex align-items-center">
              <div className="container" style={{ minWidth: "95%", margin: "0 auto" }}>
                <div className="row justify-content-center">
                  <div className="col-xl-8 col-lg-9">
                    <div className="hero__caption">
                      <h1>
                        에스파 유니버스 라이브<br />Aespa Universe Live<br />25.10.13
                      </h1>
                      <a href="shop.html" className="btn">Shop Now</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="single-slider slider-bg2 hero-overly slider-height d-flex align-items-center">
              <div className="container" style={{ minWidth: "95%", margin: "0 auto" }}>
                <div className="row justify-content-center">
                  <div className="col-xl-8 col-lg-9">
                    <div className="hero__caption">
                      <h1>
                        에스파 유니버스 라이브<br />Aespa Universe Live<br />25.10.13
                      </h1>
                      <a href="shop.html" className="btn">Shop Now</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Popular Items (기존 섹션 유지) */}
      <div className="popular-items pt-50">
        <div className="container" style={{ minWidth: "90%", margin: "0 auto" }}>
          <div className="section-tittle medium">
            <h2>좋아하는 아티스트를 만나보세요!</h2>
          </div>
          <div className="row">
            {/* 예시 카드 1개 유지 (필요시 이 영역도 API 연결로 교체 가능) */}
                {artists.map((a) => (
            <div className="col-lg-3 col-md-6 col-sm-6" key={a.id}>
              <div className="single-popular-items mb-50 text-center wow fadeInUp" data-wow-duration="1s" data-wow-delay=".4s">
                  <div className="popular-img">
                    <img src={a.logoImg} alt="" style={{width: "100%", height: "350px", objectFit: "cover"}}/>
                    <div className="img-cap">
                      <span>{a.name}</span>
                    </div>
                    <div className="favorit-items">
                      <a href={`/artists/${a.id}/intro`} className="btn">View Artist</a>

                    </div>
                  </div>
              </div>
            </div>
                ))}
          </div>
        </div>
      </div>

      {/* New Arrival = 신상품 8개 */}
      <div className="new-arrival">
        <div className="container" style={{ minWidth: "95%", margin: "0 auto" }}>
          <div className="row justify-content-center">
            <div className="col-xl-7 col-lg-8 col-md-10">
              <div className="section-tittle mb-60 text-center wow fadeInUp" data-wow-duration="2s" data-wow-delay=".2s">
                <h2>new<br />md<br /></h2>
              </div>
            </div>
          </div>

          <div className="row">
            {!loading && newProducts.map((p) => (
              <div key={p.id} className="col-xl-3 col-lg-3 col-md-6 col-sm-6">
                <div className="single-new-arrival mb-50 text-center wow fadeInUp" data-wow-duration="1s" data-wow-delay=".1s">
                  <div className="popular-img" style={{ position: "relative" }}>
                    <Link to={`/shop/product/${p.id}`}>
                    <img
                      src={p.mainImageUrl || "assets/img/gallery/arrival8.png"}
                      alt={p.productName}
                      style={{ width: "100%", height: 260, objectFit: "cover", cursor: "pointer" }}
                      onError={(e) => { e.currentTarget.src = "assets/img/gallery/arrival8.png"; }}
                    /></Link>
                  </div>

                  <div className="popular-caption">
                    <h3>
                      <Link to={`/shop/product/${p.id}`}>{p.productName}</Link>
                    </h3>
                    <span>₩ {toKRW(p.price)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>


          {/* 더보기 버튼 */}
          <div className="row justify-content-center">
            <div className="room-btn">
              <Link to="/shop/products" className="border-btn">더 둘러보기</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
