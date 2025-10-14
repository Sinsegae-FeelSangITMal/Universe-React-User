import React, { useEffect, useState } from "react";
import axios from "axios";

export default function LoginPage() {
    const [id, setId] = useState("");
    const [pwd, setPwd] = useState("");
    const [error, setError] = useState("");

    // ✅ axios baseURL 설정 (Vite proxy를 타도록 /api로)
    axios.defaults.baseURL = "/api";

    const handleSubmit = async (e) => {
        e.preventDefault();

        const loginData = {
            email: id,
            password: pwd,
            remember: false
        };

        console.log("로그인 시도:", loginData);
        console.log("현재 baseURL:", import.meta.env.VITE_API_URL);

        try {
            const response = await axios.post("/ent/auth/login", loginData);

            console.log("로그인 성공:", response.data);

            // 로그인 성공 시 동작 (토큰 저장 or 이동)
            alert("로그인 성공! 🎉");
            // localStorage.setItem("accessToken", response.data.accessToken);
            // navigate("/dashboard");
        } catch (err) {
            console.error("로그인 실패:", err);

            if (err.response) {
                console.log("응답 상태:", err.response.status);
                console.log("응답 내용:", err.response.data);
                setError("아이디 또는 비밀번호가 올바르지 않습니다.");
            } else if (err.request) {
                console.log("요청은 갔지만 응답 없음:", err.request);
                setError("서버에 연결할 수 없습니다. (네트워크 문제)");
            } else {
                console.log("요청 설정 중 오류:", err.message);
                setError("로그인 중 오류가 발생했습니다.");
            }
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/oauth2/authorization/google`;
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const errorMsg = params.get("error");
        if (errorMsg) {
            setError("구글 로그인에 실패했습니다. 다시 시도해주세요.");
        } else {
            setError("");
        }
    }, [location.search]);

    return (
        <div
            style={{
                width: 380,
                maxWidth: "90vw",
                padding: 32,
                border: "1px solid #eee",
                borderRadius: 8,
                boxShadow: "0 2px 8px #eee",
            }}
        >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <a href="/main">
                    <img
                        src="/assets/img/logo/mainLogo.png"
                        alt="main logo"
                        style={{ width: 120, height: 60, objectFit: "contain" }}
                    />
                </a>
            </div>

            <h3 style={{ textAlign: "center", marginBottom: 24 }}>로그인 / 회원가입</h3>
            {error && (
                <div
                    style={{
                        color: "#d32f2f",
                        fontWeight: 500,
                        textAlign: "center",
                        marginBottom: 16,
                    }}
                >
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                    <input
                        type="text"
                        placeholder="이메일"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                        style={{ width: "100%", padding: 8, fontSize: 16 }}
                        autoComplete="username"
                    />
                </div>
                <div style={{ marginBottom: 24 }}>
                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={pwd}
                        onChange={(e) => setPwd(e.target.value)}
                        style={{ width: "100%", padding: 8, fontSize: 16 }}
                        autoComplete="current-password"
                    />
                </div>
                <button
                    type="submit"
                    style={{
                        width: "100%",
                        padding: 10,
                        fontSize: 16,
                        background: "#6e1ea0ff",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        marginBottom: 8,
                    }}
                >
                    로그인
                </button>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
                    <span style={{ fontSize: 12, color: "#888" }}>
                        아이디 찾기 | 비밀번호 찾기
                    </span>
                </div>
            </form>

            <button
                onClick={handleGoogleLogin}
                style={{
                    width: "100%",
                    padding: 10,
                    fontSize: 16,
                    background: "#fff",
                    color: "#222",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                }}
            >
                <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google logo"
                    style={{ width: 20, height: 20, verticalAlign: "middle" }}
                />
                Google 시작하기
            </button>

            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: 8,
                }}
            >
                <button
                    style={{
                        width: "auto",
                        minWidth: 100,
                        padding: "4px 10px",
                        fontSize: 13,
                        background: "#fff",
                        color: "#111",
                        border: "1px solid #bbb",
                        borderRadius: 4,
                        fontWeight: 500,
                    }}
                >
                    이메일로 회원가입
                </button>
            </div>
        </div>
    );
}
