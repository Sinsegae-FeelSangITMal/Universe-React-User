import { Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import NavbarUser from "../components/NavbarUser";
import NavbarGuest from "../components/NavbarGuest";
import Footer from "../components/Footer";

export default function WithLayout(){
    const { isLogin } = useAuthStore();
    console.log("main페이지 진입! 로그인 여부=" + isLogin);

    return (
        <>
            {isLogin ? <NavbarUser /> : <NavbarGuest />}
            <Outlet />
            <Footer />
        </>
    );
}