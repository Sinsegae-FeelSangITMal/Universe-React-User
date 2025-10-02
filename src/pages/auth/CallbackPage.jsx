import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";
import { api } from "../../api/api";

/* 
백엔드에서 이 페이지로 강제 리다이렉트, 여기서 백엔드로부터 받은 JWT 토큰을 localStorage에 저장 
작업을 마친 후 main 페이지로 이동
 */
export default function CallbackPage(){
    const navigate = useNavigate();
    
    const { login, setUser } = useAuthStore.getState();

    useEffect(() => {
        const fetchUser = async() => {
            const params = new URLSearchParams(window.location.search);
            console.log(params);
            const token = params.get("accessToken");

            if(token){
                login(token);  //localStorage에 토큰 저장
            
                try{
                    // 인증 성공한 유저의 정보를 가져와서 전역으로 저장 
                    const res = await api.get("/user/me");
                    const user = res.data.data;
                    setUser(user);
                    console.log(user);
        
                    window.history.replaceState({}, document.title, "/callback");  //주소창 정리     
                } catch(err){
                    console.log("api(/api/user/me) 호출 실패");
                }

                navigate("/main");  // 메인 페이지로 이동
            }
        };

        fetchUser();

    }, [navigate, login, setUser]);  //함수 참조가 바뀌면 effect를 다시 실행, 훅에서 받아온 값들은 다 넣는 것을 권장 

}