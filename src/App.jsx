import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import MainPage from "./pages/main/MainPage";
import CartPage from "./pages/mypage/CartPage";
import MembershipPage from "./pages/mypage/MembershipPage";
import OrderListPage from "./pages/mypage/OrderListPage";
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
import Viewer from "./pages/live/Viewer";
import ArtistIntroPage from "./pages/artist/ArtistIntroPage";
import ArtistVODPage from "./pages/artist/ArtistVODPage";
import ScrollToTop from "./components/ScrollToTop";
import Merge from "./pages/live/Merge";

function App() {

  return (
    <BrowserRouter>
      <Toaster position="bottom-center" />
      <ScrollToTop />   {/* 페이지 전환 시 자동 스크롤 맨 위로 */}
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

          <Route path="/shop/products/:artistId" element={<ProductList />} />
          <Route path="/shop/product/:productId" element={<ProductDetail />} />

          {/* 위: 영상 완료 / 아래: 채팅 완료 (병합 및 테스트 전) */}
          {/* <Route path="/artists/:artistId/live/:liveId" element={<Viewer />} /> */}
          <Route path="/artists/:artistId/live/:liveId" element={<Merge />} />
          {/* <Route path="/live/:artistId" element={<LivePage />} /> */}

          {/* 로그인 필요한 페이지 */}
          <Route path="/order" element={  //결제 전 주문 정보
            <ProtectedRoute>
              <OrderFormPage />
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
