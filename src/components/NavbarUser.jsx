import { Link, useNavigate } from "react-router-dom"

import { useAuthStore } from "../store/auth"
import { publicApi } from "../api/api";
import { useState } from "react";

export default function NavbarUser(){
    const navigate = useNavigate();
    const logoutAction = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const [open, setOpen] = useState(false);

    const logout = async () => {
        try{
            const res = await publicApi.post("/auth/logout");  
            
            logoutAction();
            alert("로그아웃 되었습니다.");
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


                        <div
                            className="user-dropdown"
                            style={{ position: "relative", display: "inline-block" }}
                            >
                            <button
                                className="user-btn"
                                style={{
                                backgroundColor: "#ac5affff",
                                color: "#fff",
                                border: "none",
                                borderRadius: "20px",
                                padding: "8px 14px",
                                cursor: "pointer",
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                }}
                                onClick={() => setOpen(!open)}
                                
                            >
                                {user.nickname} 님
                                <span style={{ fontSize: "12px", marginLeft: "4px" }}>▼</span>
                            </button>

                            {/* ▼ 드롭다운 메뉴 */}
                            <ul
                                className="user-menu"
                                style={{
                                position: "absolute",
                                right: 0,
                                top: "40px",
                                listStyle: "none",
                                background: "white",
                                borderRadius: "10px",
                                boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
                                padding: "6px 0",
                                width: "140px",
                                margin: 0,
                                display: open ? "block" : "none",
                                zIndex: 10,
                                    
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.display = "block")}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.display = "none"
                                    setOpen(false);
                                }}
                            >
                                <li
                                style={{
                                    padding: "8px 14px",
                                    cursor: "pointer",
                                    transition: "background 0.2s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                                onClick={() => {navigate("/cart")}}
                                >
                                    Cart
                                </li>

                                <li
                                style={{
                                    padding: "8px 14px",
                                    cursor: "pointer",
                                    transition: "background 0.2s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                                onClick={()=> navigate("/membership")}
                                >
                                    Membership
                                </li>


                                <li
                                style={{
                                    padding: "8px 14px",
                                    cursor: "pointer",
                                    transition: "background 0.2s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                                onClick={()=>navigate("/order/list")}
                                >
                                    Order
                                </li>

                                <li
                                style={{
                                    padding: "8px 14px",
                                    cursor: "pointer",
                                    transition: "background 0.2s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                                onClick={logout}
                                >
                                    Logout
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {/* <!-- Header End --> */}
    </header>
    )
}