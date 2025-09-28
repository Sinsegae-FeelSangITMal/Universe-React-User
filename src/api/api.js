import axios from "axios";
import { useAuthStore } from "../store/auth";

/**
 * axios 인스턴스 생성 파일 
 * 모든 API 요청에 공통으로 적용되는 규칙 관리 (baseURL, 헤더, 토큰담기, 에러 처리 등)
 */

const api = axios.create({
    baseURL: "http://localhost:7777/api",   //후에 gateway 주소로 변경 
    withCredentials: true,   // axios의 기본 동작은 쿠키나 인증정보를 자동으로 안보냄. 쿠키에 들은 refreshToken을 보내기 위해 옵션 설정 
});


//요청 인터셉터 - 헤더에 토큰 담기 
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if(token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log("헤더에 담긴 토큰 = " + token);
        }
        return config;  
    },
    (error) => Promise.reject(error)  // 이걸 반환하면 이후 .catch()에서 에러를 처리 (호출한 쪽에서 에러 처리하라고 넘기는 것)
);

//응답 인터셉터 - accessToken 만료 응답 시 재발급 요청
api.interceptors.response.use(
    (response) => response,   //정상 응답은 그대로 리턴
    async (error) => {
        const originalRequest = error.config;    // 요청 설정(config - url, headers ...)

        if(error.response?.data.code == 'TOKEN_EXPIRED' && !originalRequest._retry){
            originalRequest._retry = true; //무한 루프 방지 플래그 

            try{
                const res = await api.post("/auth/accessToken" ,{}, { headers: {} });  // 재발급 요청에는 accesstoken을 보내지 않는다. 
                const newAccessToken = res.data.data.accessToken;
                console.log("accesstoken 만료돼서 새로 발급받은 newAccessToken="+newAccessToken);
                
                useAuthStore.getState().login(newAccessToken);
                return api(originalRequest);

                
            } catch(err){
                console.log("액세스토큰 재발급 실패", err);
                useAuthStore.getState().logout();  // 토큰 갱신 실패 로그아웃 처리 
            }
        }
        return Promise.reject(error);
    }
)

export default api;