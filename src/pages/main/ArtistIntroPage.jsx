import React from "react";

const groupName = "The KingDom";
const intro = "Open the gate 타킹덤! 안녕하세요, 타킹덤입니다! <br/>환영해요, 다양한 콘텐츠를 즐겨보세요.";
const members = [
  { name: "단", img: "/assets/img/test/jin.png" },
  { name: "아서", img: "/assets/img/test/jin.png" },
  { name: "무진", img: "/assets/img/test/jin.png" },
  { name: "루이", img: "/assets/img/test/jin.png" },
  { name: "아이반", img: "/assets/img/test/jin.png" },
  { name: "자한", img: "/assets/img/test/jin.png" },
  { name: "자한", img: "/assets/img/test/jin.png" },
  { name: "자한", img: "/assets/img/test/jin.png" },
    { name: "자한", img: "/assets/img/test/jin.png" },
  { name: "자한", img: "/assets/img/test/jin.png" },
  { name: "자한", img: "/assets/img/test/jin.png" },
    { name: "자한", img: "/assets/img/test/jin.png" },
  { name: "자한", img: "/assets/img/test/jin.png" },
  { name: "자한", img: "/assets/img/test/jin.png" },

    { name: "자한", img: "/assets/img/test/jin.png" },
  { name: "자한", img: "/assets/img/test/jin.png" },
  { name: "자한", img: "/assets/img/test/jin.png" },

    { name: "자한", img: "/assets/img/test/jin.png" },
  { name: "자한", img: "/assets/img/test/jin.png" },
  { name: "자한", img: "/assets/img/test/jin.png" },

    { name: "자한", img: "/assets/img/test/jin.png" },
  { name: "자한", img: "/assets/img/test/jin.png" },
  { name: "자한", img: "/assets/img/test/jin.png" },

];
const lives = [
  { id: 1, title: "와!", date: "08.13 20:00", live: true, img: "/assets/img/test/jin.png" },
  { id: 2, title: "소통!", date: "08.20 20:30", live: false, img: "/assets/img/test/jin.png" },
  { id: 2, title: "소통!", date: "08.20 20:30", live: false, img: "/assets/img/test/jin.png" },
  { id: 3, title: "안녕", date: "08.12 21:19", live: false, img: "/assets/img/test/jin.png" }
];


export default function ArtistIntroPage() {
  return (
    <div style={{  maxWidth: 1100, margin: "0 auto", padding: "40px 0" }}>
      {/* 메인 단체사진 영역 */}
      <div style={{ 
        position: "relative",
        marginBottom: "10%",
        margin: "0 auto",
        borderRadius: 24, 
        }}>
        <img 
            src="/assets/img/test/jin.png" 
            alt="group" 
            style={{ 
                width: "100%",
                aspectRatio: "16 / 9",
                borderRadius: 24,
                objectFit: "cover",

                WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskSize: "100% 100%",

                maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 80%, rgba(0,0,0,0) 100%)",
                maskRepeat: "no-repeat",
                maskSize: "100% 100%",
            }} 
            />

        <div style={{  //그룹명부터 구독버튼 div 
            position: "absolute",
            bottom: 40,
            textAlign: "center",
            position: "relative", 
            zIndex: 2 
            }}>
          <h1 style={{  // 그룹명 
            fontWeight: 700, 
            fontSize: 70, 
            color: "#ffffffff", 
            marginBottom: 30, 
            textShadow: "0 2px 8px #0008" 
            }}>{groupName}</h1>
          <div style={{ 
            color: "#4c4c4cff", 
            fontSize: 16, 
            maxWidth: 360, 
            margin: "0 auto", 
            marginBottom: 10,
            wordBreak: "keep-all", 
            whiteSpace: "pre-line", 
            lineHeight: 1.5 }}>
            {intro.split("<br/>").map((line, i) => (
              <span key={i} style={{ display: "block" }}>{line}</span>
            ))}
          </div>
          <button style={{ 
            marginTop: 20, 
            padding: "8px 30px", 
            fontSize: 16, 
            fontWeight: 600, 
            background: "#fff", 
            color: "#393636ff", 
            border: "none", 
            borderRadius: 100, 
            border: "2.5px solid black",
            
            cursor: "pointer" }}>
            구독
          </button>
        </div>
      </div>

      {/* 프로필 영역 */}
      <div style={{ marginBottom: 100 }}>
        <div style={{ fontWeight: 800, fontSize: 22, color: "#060606ff", marginBottom: 16 }}>프로필</div>
        <div style={{ width: "100%", display: "flex", gap: 10, alignItems: "flex-start", justifyContent: "flex-start", flexWrap: "wrap", }}>
          {members.map((m) => (
            // 멤버 프로필 카드
            <div key={m.name} style={{ textAlign: "center" }}>
              <img src={m.img} alt={m.name} style={{ width: 100, height: 100, borderRadius: "20%", objectFit: "cover", border: "2px solid #fff" }} />
              <div style={{ marginTop: 3, display: "block", fontWeight: 700, fontSize: 15 }}>{m.name}</div>
            </div>
          ))}
        </div>
      </div>
      {/* 라이브 영역 */}
      <div style={{ marginBottom: 100 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30}}>
          <div style={{ fontWeight: 700, fontSize: 22, color: "#0c0c0cff" }}>LIVE</div>
          <button style={{ 
            background: "none", 
            border: "none", 
            color: "#000000ff", 
            fontSize: 16, 
            display: "flex", 
            alignItems: "center", 
            cursor: "pointer" 
            }}>
            모두보기 <span style={{ marginLeft: 4, fontSize: 18 }}>▼</span>
          </button>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {lives.slice(0, 3).map((live) => ( //라이브 영상 3개만 보여주기 
            // 라이브 카드 
            <div key={live.id} style={{ 
                position: "relative", 
                overflow: "hidden", 
                }}>

              <img src={live.img} alt={live.title} style={{ 
                width: "350px", 
                height: "230px", 
                objectFit: "cover",
                borderRadius: 20, 
                border: live.live ? "3px solid #e11d48" : "0px solid #222", 
                }} />
              {live.live && <div style={{ 
                position: "absolute", 
                top: 8, left: 8, 
                background: "#e11d48", 
                color: "#fff", 
                fontWeight: 700, 
                fontSize: 13, 
                borderRadius: 6, 
                padding: "2px 10px" 
                }}>LIVE</div>}
              <div style={{ padding: 12 }}>
                <div style={{ color: "#000000ff", fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{live.title}</div>
                <div style={{ color: "#aaa", fontSize: 13 }}>{live.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
