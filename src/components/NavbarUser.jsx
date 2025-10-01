import { useNavigate } from "react-router-dom"

import { useAuthStore } from "../store/auth"
import { publicApi } from "../api/api";

export default function NavbarUser(){
    const navigate = useNavigate();
    const logoutAction = useAuthStore((state) => state.logout);

    const logout = async () => {
        try{
            const res = await publicApi.post("/auth/logout");  
            
            logoutAction();
            navigate("/main");
            
        } catch(error){
            console.log("로그아웃 실패:", error);
        }
    }

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
                                        <li><a href="/contact">Contact</a>
                                            <ul className="submenu">
                                                <li><a href="blog.html">Blog</a></li>
                                                <li><a href="blog_details.html">Blog Details</a></li>
                                                <li><a href="elements.html">Elements</a></li>
                                                <li><a href="product_details.html">Product Details</a></li>
                                            </ul>
                                        </li>
                                    </ul>
                                </nav>
                            </div>   
                        </div>
                        <div className="header-right1 d-flex align-items-center">
                    
                            {/* <!-- Search Box --> */}
                            <div className="search d-none d-md-block">
                                <ul className="d-flex align-items-center">
                                    <li>
                                        <a href="/cart">
                                            <div className="card-stor">
                                                <img src="/assets/img/gallery/card.svg"/>
                                            </div>
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/membership">
                                            <div className="card-stor yellow">
                                                <span> Membership</span>
                                            </div>
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <div className="card-stor mint">MyPage</div>
                            <div className="card-stor purple" onClick={logout}>Logout</div>
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