import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";

/* 
백엔드에서 이 페이지로 강제 리다이렉트, 여기서 백엔드로부터 받은 JWT 토큰을 localStorage에 저장 
작업을 마친 후 main 페이지로 이동
 */
export default function CallbackPage(){
    const navigate = useNavigate();
    
    const { login } = useAuthStore();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        console.log(params);
        const token = params.get("accessToken");

        if(token){
            login(token);  //localStorage에 토큰 저장
            window.history.replaceState({}, document.title, "/callback");  //주소창 정리     
            
            // 사용자 정보 API 호출해서 상태 갱신 가능
            // fetch("/api/me", { headers: { Authorization: `Bearer ${token}`}})
            //   .then(res => res.json())
            //   .then(data => setUser(data));

            navigate("/main");  // 메인 페이지로 이동
        }

    }, [navigate, setIsLogin]);  //함수 참조가 바뀌면 effect를 다시 실행, 훅에서 받아온 값들은 다 넣는 것을 권장 

}