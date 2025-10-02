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
import ProductDetail from "./pages/product/ProductDetail";
import ProductList from "./pages/product/ProductList";
import LivePage from "./pages/live/LivePage";
import OauthInfoPage from "./pages/auth/OauthInfoPage";
import ArtistIntroPage from "./pages/artist/ArtistIntroPage";
import Viewer from "./pages/live/Viewer";
import ArtistVODPage from "./pages/artist/ArtistVODPage";

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
          <Route path="/artists/:artistId/intro" element={<ArtistIntroPage />} />
          <Route path="/artists/:artistId/vods" element={<ArtistVODPage />} />



          {/* --- GEMINI-GENERATED CODE START --- */}
          {/* This route displays the live stream viewing page. */}
          <Route path="/view" element={<Viewer />} />
          {/* --- GEMINI-GENERATED CODE END --- */}
          

          <Route path="/shop/products/:artistId" element={<ProductList />} />
          <Route path="/shop/product/:productId" element={<ProductDetail />} />

          {/* 로그인 필요한 페이지 */}
          <Route path="/order" element={  //결제 전 주문 정보
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
          <Route path="/membership" element={
            <ProtectedRoute>
              <MembershipPage />
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
