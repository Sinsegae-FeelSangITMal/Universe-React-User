import { useEffect } from "react";
import $ from "jquery";

import "slick-carousel"; // slick 패키지 설치되어 있어야 함 (npm install slick-carousel)


export default function Main(){

    useEffect(() => {
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
            
        {/* <!--? Hero Area Start--> */}
        <div className="container" style={{ minWidth: "95%", margin: "0 auto"}}>
            <div className="slider-area">
                {/* <!-- Mobile Device Show Menu--> */}
                <div className="header-right2 d-flex align-items-center">
                    {/* <!-- Social --> */}
                    <div className="header-social  d-block d-md-none">
                        <a href="#"><i className="fab fa-twitter"></i></a>
                        <a href="https://bit.ly/sai4ull"><i className="fab fa-facebook-f"></i></a>
                        <a href="#"><i className="fab fa-pinterest-p"></i></a>
                    </div>
                    {/* <!-- Search Box --> */}
                    <div className="search d-block d-md-none" >
                        <ul className="d-flex align-items-center">
                            <li className="mr-15">
                                <div className="nav-search search-switch">
                                    <i className="ti-search"></i>
                                </div>
                            </li>
                            <li>
                                <div className="card-stor">
                                    <img src="assets/img/gallery/card.svg" alt=""/>
                                    <span>0</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
                {/* <!-- /End mobile  Menu--> */}

                <div className="slider-active dot-style">

                    {/* <!-- Single 1 --> */}
                    <div className="single-slider slider-bg1 hero-overly slider-height d-flex align-items-center">
                        <div className="container"  style={{ minWidth: "95%", margin: "0 auto"}}>
                            <div className="row justify-content-center">
                                <div className="col-xl-8 col-lg-9">
                                    {/* <!-- Hero Caption --> */}
                                    <div className="hero__caption">
                                        <h1>에스파 유니버스 라이브<br />Aespa Universe Live<br />25.10.13</h1>
                                        <a href="shop.html" className="btn">Shop Now</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* <!-- Single 2 --> */}
                    <div className="single-slider slider-bg2 hero-overly slider-height d-flex align-items-center">
                        <div className="container"  style={{ minWidth: "95%", margin: "0 auto"}}>
                            <div className="row justify-content-center">
                                <div className="col-xl-8 col-lg-9">
                                    {/* <!-- Hero Caption --> */}
                                    <div className="hero__caption">
                                        <h1>에스파 유니버스 라이브<br />Aespa Universe Live<br />25.10.13</h1>
                                        <a href="shop.html" className="btn">Shop Now</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
        {/* <!-- End Hero --> */}
        {/* <!--? Popular Items Start --> */}
        <div className="popular-items pt-50">
            <div className="container"  style={{ minWidth: "95%", margin: "0 auto"}}>
                
                <div className="section-tittle medium">
                    <h2>새로운 아티스트를 만나보세요!</h2>
                </div>

                <div className="row">

                    {/* 한 컨텐츠 시작 */}
                    <div className="col-lg-3 col-md-6 col-sm-6">
                        <div className="single-popular-items mb-50 text-center wow fadeInUp" data-wow-duration="1s" data-wow-delay=".4s">
                            <div className="popular-img">
                                <img src="assets/img/gallery/popular3.png" alt=""/>
                                <div className="img-cap">
                                    <span>Pase A LA FAMA</span>
                                </div>
                                <div className="favorit-items">
                                <a href="shop.html" className="btn">Shop Now</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* 한 컨텐츠 끝 */}

                </div>
            </div>
        </div>
        {/* <!-- Popular Items End --> */}
        {/* <!--? New Arrival Start --> */}
        <div className="new-arrival">
            <div className="container"  style={{ minWidth: "95%", margin: "0 auto"}}>
                {/* <!-- Section tittle --> */}
                <div className="row justify-content-center">
                    <div className="col-xl-7 col-lg-8 col-md-10">
                        <div className="section-tittle mb-60 text-center wow fadeInUp" data-wow-duration="2s" data-wow-delay=".2s">
                            <h2>new<br />md<br /></h2>
                        </div>
                    </div>
                </div>
                <div className="row">
                    {/* 아티스트 1명 시작 */}
                    <div className="col-xl-3 col-lg-3 col-md-6 col-sm-6">
                        <div className="single-new-arrival mb-50 text-center wow fadeInUp" data-wow-duration="1s" data-wow-delay=".1s">
                            <div className="popular-img">
                                <img src="assets/img/gallery/arrival1.png" alt=""/>
                                <div className="favorit-items">
                                    {/* <!-- <span className="flaticon-heart"></span> --> */}
                                    <img src="assets/img/gallery/favorit-card.png" alt=""/>
                                </div>
                            </div>
                            <div className="popular-caption">
                                <h3><a href="product_details.html">Aespa 응원봉</a></h3>
                                <span>$ 30.00</span>
                            </div>
                        </div>
                    </div>
                    {/* 아티스트 1명 끝 */}
                </div>
                {/* <!-- Button --> */}
                <div className="row justify-content-center">
                    <div className="room-btn">
                        <a href="catagori.html" className="border-btn">더 둘러보기</a>
                    </div>
                </div>
            </div>
        </div>
        {/* <!--? New Arrival End --> */}
        {/* <!--? collection --> */}
        {/*
        <section className="collection section-bg2 section-padding30 section-over1 ml-15 mr-15" data-background="assets/img/gallery/section_bg01.png">
            <div className="container"></div>
            <div className="row justify-content-center">
                <div className="col-xl-7 col-lg-9">
                    <div className="single-question text-center">
                        <h2 className="wow fadeInUp" data-wow-duration="2s" data-wow-delay=".1s">collection houses our first-ever</h2>
                        <a href="about.html" className="btn className=wow fadeInUp" data-wow-duration="2s" data-wow-delay=".4s">About Us</a>
                    </div>
                </div>
            </div>
        </section>
        */}
        {/* <!-- End collection --> */}
        {/* <!--? Popular Locations Start 01--> */}
        {/*
        <div className="popular-product pt-50">
            <div className="container"  style={{ minWidth: "95%", margin: "0 auto"}}>
                <div className="row">
                    <div className="col-lg-6 col-md-6 col-sm-12">
                        <div className="single-product mb-50">
                            <div className="location-img">
                                <img src="assets/img/gallery/popular-imtes1.png" alt=""/>
                            </div>
                            <div className="location-details">
                                <p><a href="product_details.html">Established fact that by the<br /><br /> readable content</a></p>
                                <a href="product_details.html" className="btn">Read More</a>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6 col-md-6 col-sm-12">
                        <div className="single-product mb-50">
                            <div className="location-img">
                                <img src="assets/img/gallery/popular-imtes2.png" alt=""/>
                            </div>
                            <div className="location-details">
                                <p><a href="product_details.html">Established fact that by the<br /><br /> readable content</a></p>
                                <a href="product_details.html" className="btn">Read More</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        */}
        {/* <!-- Popular Locations End --> */}
        {/* <!--? Services Area Start --> */}
        {/*
        <div className="categories-area section-padding40 gray-bg">
            <div className="container"  style={{ minWidth: "95%", margin: "0 auto"}}>
                <div className="row">
                    <div className="col-lg-3 col-md-6 col-sm-6">
                        <div className="single-cat mb-50 wow fadeInUp" data-wow-duration="1s" data-wow-delay=".2s">
                            <div className="cat-icon">
                                <img src="assets/img/icon/services1.svg" alt=""/>
                            </div>
                            <div className="cat-cap">
                                <h5>Fast & Free Delivery</h5>
                                <p>Free delivery on all orders</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6 col-sm-6">
                        <div className="single-cat mb-50 wow fadeInUp" data-wow-duration="1s" data-wow-delay=".2s">
                            <div className="cat-icon">
                                <img src="assets/img/icon/services2.svg" alt=""/>
                            </div>
                            <div className="cat-cap">
                                <h5>Fast & Free Delivery</h5>
                                <p>Free delivery on all orders</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6 col-sm-6">
                        <div className="single-cat mb-30 wow fadeInUp" data-wow-duration="1s" data-wow-delay=".4s">
                            <div className="cat-icon">
                                <img src="assets/img/icon/services3.svg" alt=""/>
                            </div>
                            <div className="cat-cap">
                                <h5>Fast & Free Delivery</h5>
                                <p>Free delivery on all orders</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6 col-sm-6">
                        <div className="single-cat wow fadeInUp" data-wow-duration="1s" data-wow-delay=".5s">
                            <div className="cat-icon">
                                <img src="assets/img/icon/services4.svg" alt=""/>
                            </div>
                            <div className="cat-cap">
                                <h5>Fast & Free Delivery</h5>
                                <p>Free delivery on all orders</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        */}
        {/* <!--? Services Area End --> */}
        </main>
    )
}