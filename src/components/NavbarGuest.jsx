export default function NavbarGuest(){
    return (
        <header>
        {/* <!-- Header Start --> */}
        <div className="header-area " style={{ marginLeft: "40px", marginRight: "40px"}}>
            <div className="main-header header-sticky" >
                <div className="container-fluid" >
                    <div className="menu-wrapper d-flex align-items-center justify-content-between">
                        <div className="header-left d-flex align-items-center">
                            {/* <!-- Logo --> */}
                            <div className="logo">
                                <a href="index.html"><img src="assets/img/logo/mainLogo.png" alt=""/></a>
                            </div>
                            {/* <!-- Main-menu --> */}
                            <div className="main-menu  d-none d-lg-block">
                                <nav>
                                    <ul id="navigation">
                                        <li><a href="index.html">Home</a></li> 
                                        <li><a href="shop.html">shop</a></li>
                                        <li><a href="about.html">Live</a></li>
                                        <li><a href="blog.html">Contact</a></li>
                                    </ul>
                                </nav>
                            </div>   
                        </div>
                        <div className="header-right1 d-flex align-items-center">
                    
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

                            <div className="card-stor mint">Login</div>
                            <div className="card-stor purple">Regist</div>
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