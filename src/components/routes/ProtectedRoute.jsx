import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";


function ProtectedRoute({ children }){
    const isLogin = useAuthStore((state) => state.isLogin);

    if(!isLogin){
        return <Navigate to="/login" replace />;   //로그인 안했으면 로그인 페이지로
    }

    return children;   //로그인 했으면 원래 페이지로 
}

export default ProtectedRoute;