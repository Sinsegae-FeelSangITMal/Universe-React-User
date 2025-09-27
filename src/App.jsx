import NavbarGuest from "./components/NavbarGuest";
import NavbarUser from "./components/NavbarUser";
import Footer from "./components/Footer";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./pages/main/MainPage"; 
import OrderPage from "./pages/order/OrderPage";
import CartPage from "./pages/order/CartPage";
import LoginPage from "./pages/auth/LoginPage";
import CallbackPage from "./pages/auth/CallbackPage";
import WithoutLayout from "./layouts/WithoutLayout";
import WithLayout from "./layouts/WithLayout";

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
          <Route path="/order" element={<OrderPage />} />
          <Route path="/cart" element={<CartPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
