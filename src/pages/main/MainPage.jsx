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
        // API 형태 다양성 대비
        const list =
          res?.data?.data?.content ??
          res?.data?.content ??
          res?.data ??
          [];
        if (mounted) setArtists(list);
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

    // cleanup
    return () => {
      mounted = false;
      const $inited = $(".slider-active.slick-initialized");
      if ($inited.length) {
        try {
          $inited.slick("unslick");
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  return (
    <main>
      {/* Hero Area */}
      <div className="container" style={{ minWidth: "90%", margin: "0 auto" }}>
        <div className="slider-area">
          <div className="slider-active dot-style">
            {/* Slide 1 */}
            <div className="single-slider slider-bg1 hero-overly slider-height d-flex align-items-center">
              <div
                className="container"
                style={{ minWidth: "95%", margin: "0 auto" }}
              >
                <div className="row justify-content-center">
                  <div className="col-xl-8 col-lg-9">
                    <div className="hero__caption">
                      <h1 style={{marginBottom: 50, textShadow: "0 0 3px rgba(0, 0, 0, 0.7), 0 0 6px rgba(0, 0, 0, 0.7), 0 0 9px rgba(0, 0, 0, 0.7)"}}>
                        25.11.01<br/>
                        BTS Special Live
                      </h1>
                      <Link to="/shop/products" className="btn">
                        View Special MD
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 2 */}
            <div className="single-slider slider-bg2 hero-overly slider-height d-flex align-items-center">
              <div
                className="container"
                style={{ minWidth: "95%", margin: "0 auto" }}
              >
                <div className="row justify-content-center">
                  <div className="col-xl-8 col-lg-9">
                    <div className="hero__caption">
                      <h1 style={{marginBottom: 50}}>
                        Universe X Netflix<br/>
                        <h1 style={{color: "#430759ff", textShadow: "0 0 3px rgba(255, 255, 255, 0.9), 0 0 6px rgba(255, 255, 255, 0.9), 0 0 9px rgba(255, 255, 255, 0.9)"}}>KPop Demon Hunters</h1>
                      </h1>
                      <Link to="/shop/products" className="btn">
                        View Products
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* // slides end */}
          </div>
        </div>
      </div>

      {/* Popular Items */}
      <div className="popular-items pt-50">
        <div
          className="container"
          style={{ minWidth: "90%", margin: "0 auto" }}
        >
          <div className="section-tittle medium">
            <h2>좋아하는 아티스트를 만나보세요!</h2>
          </div>
          <div className="row">
            {artists.map((a) => (
              <div className="col-lg-3 col-md-6 col-sm-6" key={a.id}>
                <div
                  className="single-popular-items mb-50 text-center wow fadeInUp"
                  data-wow-duration="1s"
                  data-wow-delay=".4s"
                >
                  <div className="popular-img">
                    <img
                      src={a.logoImg}
                      alt={a.name ?? "artist"}
                      style={{
                        width: "100%",
                        height: "350px",
                        objectFit: "cover",
                      }}
                    />
                    <div className="img-cap">
                      <span>{a.name}</span>
                    </div>
                    <div className="favorit-items">
                      <Link to={`/artists/${a.id}/intro`} className="btn">
                        View Artist
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {artists.length === 0 && (
              <div className="col-12 text-center" style={{ opacity: 0.7 }}>
                아티스트가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Arrival */}
      <div className="new-arrival">
        <div
          className="container"
          style={{ minWidth: "95%", margin: "0 auto" }}
        >
          <div className="row justify-content-center">
            <div className="col-xl-7 col-lg-8 col-md-10">
              <div
                className="section-tittle mb-60 text-center wow fadeInUp"
                data-wow-duration="2s"
                data-wow-delay=".2s"
              >
                <h2>New MD</h2>
              </div>
            </div>
          </div>

          <div className="row">
            {!loading &&
              newProducts.map((p) => (
                <div
                  key={p.id}
                  className="col-xl-3 col-lg-3 col-md-6 col-sm-6"
                >
                  <div
                    className="single-new-arrival mb-50 text-center wow fadeInUp"
                    data-wow-duration="1s"
                    data-wow-delay=".1s"
                  >
                    <div
                      className="popular-img"
                      style={{ position: "relative" }}
                    >
                      <Link to={`/shop/product/${p.id}`}>
                        <img
                          src={
                            p.mainImageUrl || "assets/img/gallery/arrival8.png"
                          }
                          alt={p.productName}
                          style={{
                            width: "100%",
                            height: 260,
                            objectFit: "cover",
                            cursor: "pointer",
                          }}
                          onError={(e) => {
                            e.currentTarget.src =
                              "assets/img/gallery/arrival8.png";
                          }}
                        />
                      </Link>
                    </div>

                    <div className="popular-caption">
                      <h3 style={{ marginBottom: 8 }}>
                        <Link to={`/shop/product/${p.id}`}>
                          {p.productName}
                        </Link>
                      </h3>
                      <span>₩ {toKRW(p.price)}</span>
                    </div>
                  </div>
                </div>
              ))}

            {!loading && newProducts.length === 0 && (
              <div className="col-12 text-center" style={{ opacity: 0.7 }}>
                신상품이 없습니다.
              </div>
            )}
          </div>

          {/* 더보기 버튼 */}
          <div className="row justify-content-center">
            <div className="room-btn">
              <Link to="/shop/products" className="border-btn">
                더 둘러보기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
