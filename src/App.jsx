import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./pages/main/MainPage";
import CartPage from "./pages/mypage/CartPage";
import OrderListPage from "./pages/mypage/OrderListPage";
import OrderDetailPage from "./pages/mypage/OrderDetailPage";
import MembershipPage from "./pages/mypage/MembershipPage";
import OrderFormPage from "./pages/order/OrderFormPage";
import OrderResultPage from "./pages/order/OrderResultPage";
import LoginPage from "./pages/auth/LoginPage";
import CallbackPage from "./pages/auth/CallbackPage";
import WithoutLayout from "./layouts/WithoutLayout";
import WithLayout from "./layouts/WithLayout";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import OauthInfoPage from "./pages/auth/OauthInfoPage";

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
          <Route path="/order" element={
            <ProtectedRoute>
              <OrderFormPage />
            </ProtectedRoute>
            } 
          />
          <Route path="/order/list" element={
            <ProtectedRoute>
              <OrderListPage />
            </ProtectedRoute>
            } 
          />
          <Route path="/order/detail/:orderId" element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
            } 
          />
          <Route path="/order/paid/:orderId" element={
            <ProtectedRoute>
              <OrderResultPage />
            </ProtectedRoute>
            } 
          />
          <Route path="/cart" element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/membership" element={
              <ProtectedRoute>
                <MembershipPage />
              </ProtectedRoute>
            } 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
