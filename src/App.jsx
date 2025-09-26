import NavbarGuest from "./components/NavbarGuest";
import NavbarUser from "./components/NavbarUser";
import Footer from "./components/Footer";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import MainPage from "./pages/main/MainPage"; 
import OrderPage from "./pages/order/OrderPage";
import CartPage from "./pages/order/CartPage";

function App() {
  // 로그인 여부 (예시: 실제로는 context, recoil, redux, localStorage, cookie 등으로 관리)
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <BrowserRouter>
      {isLoggedIn ? <NavbarUser /> : <NavbarGuest />}

      <Routes>
        {/* 메인 페이지 */}
        <Route path="/main" element={<MainPage />} />

        {/* shop 페이지 */}

        {/* 주문 페이지 */}
        <Route path="/order" element={<OrderPage />} />

        {/* 장바구니 페이지 */}
        <Route path="/cart" element={<CartPage />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
