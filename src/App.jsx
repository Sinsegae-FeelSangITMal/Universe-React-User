import NavbarGuest from "./components/NavbarGuest";
import NavbarUser from "./components/NavbarUser";
import Footer from "./components/Footer";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import MainPage from "./pages/main/MainPage"; 
import CartPage from "./pages/mypage/CartPage";
import OrderListPage from "./pages/mypage/OrderListPage";
import OrderDetailPage from "./pages/mypage/OrderDetailPage";
import MembershipPage from "./pages/mypage/MembershipPage";
import OrderFormPage from "./pages/order/OrderFormPage";
import OrderResultPage from "./pages/order/OrderResultPage";

function App() {
  // 로그인 여부 (예시: 실제로는 context, recoil, redux, localStorage, cookie 등으로 관리)
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <BrowserRouter>
      {isLoggedIn ? <NavbarUser /> : <NavbarGuest />}

      <Routes>
        {/* 메인 페이지 */}
        <Route path="/" element={<MainPage />} />
        <Route path="/main" element={<MainPage />} />

        {/* 마이 페이지 */}
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/order/list" element={<OrderListPage />} />
        <Route path="/order/detail/:orderId" element={<OrderDetailPage />} />

        {/* shop 페이지 */}

        {/* 주문 및 결제 페이지 */}
        <Route path="/order" element={<OrderFormPage />} />
        {/* <Route path="/order/pay" element={<OrderFormPage />} /> */}
        <Route path="/order/paid/:orderId" element={<OrderResultPage />} />

        {/* 장바구니 페이지 */}
        <Route path="/cart" element={<CartPage />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
