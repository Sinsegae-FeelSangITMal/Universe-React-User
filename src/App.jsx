import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./pages/main/MainPage"; 
import OrderPage from "./pages/order/OrderPage";
import CartPage from "./pages/order/CartPage";
import LoginPage from "./pages/auth/LoginPage";
import CallbackPage from "./pages/auth/CallbackPage";
import WithoutLayout from "./layouts/WithoutLayout";
import WithLayout from "./layouts/WithLayout";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import OauthInfoPage from "./pages/auth/OauthInfoPage";
import OrderListPage from "./pages/order/OrderListPage";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        {/* Navbar 없는 그룹 */}
        <Route element={<WithoutLayout />}>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<CallbackPage />} />
          <Route path="/oauth-join" element={<OauthInfoPage />} />
        </Route>

        {/* Navbar 있는 그룹 */}
        <Route element={<WithLayout />}>
          <Route path="/main" element={<MainPage />} />

          {/* 로그인 필요한 페이지 */}
          <Route path="/order" element={  //결제 전 주문 정보
            <ProtectedRoute>
              <OrderPage />
            </ProtectedRoute>
            } 
          />
          <Route path="/order/list" element={ //주문 목록
            <ProtectedRoute>
              <OrderListPage />
            </ProtectedRoute>
            } 
          />
          <Route path="/cart" element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            } 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
