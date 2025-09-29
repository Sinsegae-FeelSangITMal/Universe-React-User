import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { publicApi } from "../../api/api";
import { useAuthStore } from "../../store/auth";

export default function OauthInfoPage() {

    
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const provider = params.get("provider");
    const oauthId = params.get("oauthId");

    const [nickname, setNickname] = useState("");
  

    const handleSubmit = async (e) => {
    
        try{
            const res = await publicApi.post("/auth/oauth2/join", {
                provider, 
                oauthId,
                nickname
            });

            const accessToken = res.data.data.accessToken;

            login(accessToken);
            navigate("/main");
            

        } catch(err){
            console.log(err);
        }
    };

  return (
    <div style={{ width: 380, maxWidth: "90vw", margin: "80px auto", padding: 32, border: "1px solid #eee", borderRadius: 8, boxShadow: "0 2px 8px #eee" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <img src="/assets/img/logo/mainLogo.png" alt="main logo" style={{ width: 120, height: 60, objectFit: "contain" }} />
        </div>
      <h3 style={{ textAlign: "center", marginBottom: 24 }}>추가정보 입력</h3>
      <form onSubmit={handleSubmit}>
        <label htmlFor="nickname" style={{ fontWeight: 500, fontSize: 14, color: "#424242ff"}}>
          다른 유저와 겹치지 않는 닉네임을 입력해주세요
        </label>
        <input
          id="nickname"
          type="text"
          placeholder="닉네임 (2~20자)"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          style={{ width: "100%", padding: 10, fontSize: 16, borderRadius: 4, border: '1px solid #ccc', marginBottom: 24 }}
          autoComplete="off"
        />
        <button type="button" onClick={handleSubmit} style={{ width: "100%", padding: 12, fontSize: 16, background: "#6e1ea0ff", color: "#fff", border: "none", borderRadius: 4, fontWeight: 500, marginTop: 12 }}>
          동의하고 가입하기
        </button>
      </form>
    </div>
  );
}