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
                                <a href="/main"><img src="/assets/img/logo/mainLogo.png" alt=""/></a>
                            </div>
                            {/* <!-- Main-menu --> */}
                            <div className="main-menu  d-none d-lg-block">
                                <nav>
                                    <ul id="navigation">
                                        <li><a href="/main">Home</a></li> 
                                        <li><a href="/shop">shop</a></li>
                                        <li><a href="/live">Live</a></li>
                                        <li><a href="blog.html">Contact</a></li>
                                    </ul>
                                </nav>
                            </div>   
                        </div>
                        <div className="header-right1 d-flex align-items-center">
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