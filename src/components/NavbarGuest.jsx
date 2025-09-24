export default function NavbarGuest(){
    return (
        <header>
        {/* <!-- Header Start --> */}
        <div className="header-area ">
            <div className="main-header header-sticky">
                <div className="container-fluid">
                    <div className="menu-wrapper d-flex align-items-center justify-content-between">
                        <div className="header-left d-flex align-items-center">
                            {/* <!-- Logo --> */}
                            <div className="logo">
                                <a href="index.html"><img src="assets/img/logo/logo.png" alt=""/></a>
                            </div>
                            {/* <!-- Main-menu --> */}
                            <div className="main-menu  d-none d-lg-block">
                                <nav>
                                    <ul id="navigation">
                                        <li><a href="index.html">Home</a></li> 
                                        <li><a href="shop.html">shop</a></li>
                                        <li><a href="about.html">About</a></li>
                                        <li><a href="blog.html">Blog</a>
                                            <ul className="submenu">
                                                <li><a href="blog.html">Blog</a></li>
                                                <li><a href="blog_details.html">Blog Details</a></li>
                                                <li><a href="elements.html">Elements</a></li>
                                                <li><a href="product_details.html">Product Details</a></li>
                                            </ul>
                                        </li>
                                        <li><a href="contact.html">Contact</a></li>
                                    </ul>
                                </nav>
                            </div>   
                        </div>
                        <div className="header-right1 d-flex align-items-center">
                            {/* <!-- Social --> */}
                            <div className="header-social d-none d-md-block">
                                <a href="#"><i className="fab fa-twitter"></i></a>
                                <a href="https://bit.ly/sai4ull"><i className="fab fa-facebook-f"></i></a>
                                <a href="#"><i className="fab fa-pinterest-p"></i></a>
                            </div>
                            {/* <!-- Search Box --> */}
                            <div className="search d-none d-md-block">
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
                        {/* <!-- Mobile Menu --> */}
                        <div className="col-12">
                            <div className="mobile_menu d-block d-lg-none"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {/* <!-- Header End --> */}
    </header>
    )
}