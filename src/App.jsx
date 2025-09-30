import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./pages/main/MainPage"; 
import OrderPage from "./pages/order/OrderPage";
import CartPage from "./pages/order/CartPage";
import LoginPage from "./pages/auth/LoginPage";
import CallbackPage from "./pages/auth/CallbackPage";
import WithoutLayout from "./layouts/WithoutLayout";
import WithLayout from "./layouts/WithLayout";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import ProductDetail from "./pages/product/ProductDetail";
import ProductList from "./pages/product/ProductList";
import LivePage from "./pages/live/LivePage";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        {/* Navbar 없는 그룹 */}
        <Route element={<WithoutLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<CallbackPage />} />
        </Route>

        {/* Navbar 있는 그룹 */}
        <Route element={<WithLayout />}>
          <Route path="/main" element={<MainPage />} />

          <Route path="/shop/products/:artistId" element={<ProductList />} />
          <Route path="/shop/product/:productId" element={<ProductDetail />} />

          {/* 로그인 필요한 페이지 */}
          <Route path="/order" element={
            <ProtectedRoute>
              <OrderPage />
            </ProtectedRoute>
            } 
          />
          <Route path="/cart" element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/live/:artistId" element={
            // <ProtectedRoute>
              <LivePage />
            // </ProtectedRoute>
            } 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
