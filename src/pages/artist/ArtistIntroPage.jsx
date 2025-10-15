import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { publicApi } from "../../api/api";
import { FaTiktok, FaYoutube } from "react-icons/fa";
import { FaInstagram, FaXTwitter } from "react-icons/fa6";
import { getMembership } from "../../utils/MembershipApi";
import { useAuthStore } from "../../store/auth";

export default function ArtistIntroPage() {

  // 아티스트 조회 페이지
  // api 1. 아티스트명, 소개
  // api 2. 멤버들 
  // api 3. 라이브 영상 다시보기 

  const { artistId } = useParams();
  const [artist, setArtist] = useState({});
  const [members, setMembers] = useState([]);
  const [liveStreams, setLiveStreams] = useState([]);
  const [waitingStreams, setWaitingStreams] = useState([]);
  const [endedStreams, setEndedStreams] = useState([]);
  const [membership, setMembership] = useState();
  const { user } = useAuthStore();

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchArtist() {
      const res = await publicApi.get(`/ent/artists/${artistId}`);
      console.log("/ent/artists-intro/aritstId 호출 성공");
      setArtist(res.data);
    }

    async function fetchMembers() {
      const res = await publicApi.get(`/ent/members?artistId=${artistId}`);
      setMembers(res.data);
    }

    async function fetchStreams() {
      const res = await publicApi.get(`/ent/streams/artists/${artistId}/streams`);
      console.log(res.data);
      const content = res.data.content;

      setLiveStreams(content.filter((s) => s.status === "LIVE"));
      setWaitingStreams(content.filter((s) => s.status === "WAITING"));
      setEndedStreams(content.filter((s) => s.status === "ENDED"));
    }

    fetchArtist();
    fetchMembers();
    fetchStreams();
  }, [artistId]);


  // 유저의 멤버십 정보 불러오기
  useEffect(() => {
    (async () => {
      try {
        const res = await getMembership(user.userId);
        setMembership(res.data.data);
        console.log(res.data.data);
      } catch (e) {
        console.error("멤버십 정보 불러오기 실패:", e);
      }
    })();
  }, []);

  // 팬 전용 라이브 클릭 시 멤버십 확인
  const handleProductClick = (live) => {
    // 팬전용 라이브인지 검사
    if (live.fanOnly) {
      const today = new Date();

      // membership이 null/undefined/빈 배열인 경우
      if (!membership || membership.length === 0) {
        alert(`${artist.name} 멤버십 전용 라이브입니다.`);
        return; // 이동 막기
      }

      // 유저가 해당 아티스트 멤버십을 가지고 있는지 검사
      const hasValidMembership = membership.some((m) => {
        if (m.artistName !== artist.name) return false;
        const start = new Date(m.startDate);
        const end = new Date(m.endDate);
        return today >= start && today <= end;
      });

      if (!hasValidMembership) {
        alert(`${artist.name} 멤버십에 가입한 회원만 이용할 수 있습니다.`);
        return; // 이동 막기
      }
    }

    // 통과하면 이동
    navigate(`/artists/${artist.id}/live/${live.id}`);
  };



  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 0" }}>
      {/* 메인 단체사진 영역 */}
      <div style={{
        position: "relative",
        marginBottom: "10%",
        margin: "0 auto",
        borderRadius: 24,
      }}>
        <img
          src={artist.img}
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
            color: "#363636ff",
            marginBottom: 30,
            textShadow: "0 2px 8px #0008"
          }}>{artist.name}</h1>
          <div style={{  // 소개글 
            color: "#4c4c4cff",
            fontSize: 16,
            maxWidth: 360,
            margin: "0 auto",
            marginBottom: 10,
            wordBreak: "keep-all",
            whiteSpace: "pre-line",
            lineHeight: 1.5
          }}>
            {artist.description}
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

            cursor: "pointer"
          }}
            onClick={()=> navigate(`/shop/products/${artist.id}`)}
          >
            스토어 바로가기 
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

      {/* 실시간 라이브 영역 -> 실시간 시청자 수, 조회수 */}
      <div style={{ marginBottom: 120 }}>
        <div style={{ display: "flex",flexDirection: "column", justifyContent: "flex-start", marginBottom: 30 }}>
          <div style={{ fontWeight: 700, fontSize: 22, color: "#0c0c0cff" }}>ON AIR</div>
          <div style={{  // 소개글 
            color: "#4c4c4cff",
            fontSize: 16,
            marginTop: 50,
            textAlign: "center"
           
          }}>
            진행중인 생방송이 없습니다.
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, }}>
          {liveStreams.map((live) => ( //생방중인 라이브는 항상 한개라고 가정함
            // 라이브 카드 
            <div key={live.id} style={{
              position: "relative",
              overflow: "hidden",
            }}>

              <img src={live.thumb} alt={live.title}
                onClick={() => handleProductClick(live)}
                style={{
                  width: "350px",
                  height: "230px",
                  objectFit: "cover",
                  borderRadius: 20,
                  border: "5px solid #e11d48",  // 생방중인 라이브는 테두리 무조건 빨갛게 
                  cursor: "pointer"
                }} />
              {<div
                style={{ // 생방송 Live 뱃지 
                  position: "absolute",
                  top: 15, left: 15,
                  background: "#e11d48",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  borderRadius: 6,
                  padding: "2px 10px"
                }}>LIVE</div>}
              <div style={{ padding: 12 }}>
                <div style={{ color: "#000000ff", fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{live.title}</div>
              </div>
              {live.fanOnly && (
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(188, 0, 0, 1)",
                    marginLeft: "10px",
                    fontWeight: 600,
                  }}
                >🔒 멤버십 전용 라이브
                </div>
              )}
            </div>
          ))}
        </div>

      </div>

      {/* 예정된 라이브 영역 -> 이미지, 예정된 시간 어떻게 알릴지*/}
      <div style={{ marginBottom: 120 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30 }}>
          <div style={{ fontWeight: 700, fontSize: 22, color: "#0c0c0cff" }}>예정된 LIVE</div>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {waitingStreams.map((live) => (
            <div
              key={live.id}
              style={{
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
              }}
              onClick={() => {
                const date = new Date(live.time);
                const formatted = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
                alert(`📺 "${live.title}" 라이브는 ${formatted}에 시작될 예정입니다.`);
              }}
            >

          <div
              style={{
                position: "relative",
                width: "350px",
                height: "230px",
                borderRadius: 20,
                overflow: "hidden",
              }}
            >
              <img
                src={live.thumb}
                alt={live.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "brightness(65%)", // 🔥 살짝 어둡게
                  display: "block",
                }}
              />
          </div>

              {live.thumb && (
              <div
                style={{
                  position: "absolute",
                  top: "40%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 28,
                  textAlign: "center",
                  textShadow: "0 2px 4px rgba(0,0,0,0.6)",
                }}
              >
                {new Date(live.time).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}{" "}
                <br />
                {new Date(live.time).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false
                })}
              </div>
              )}

              <div style={{ padding: 12 }}>
                <div style={{ color: "#000000ff", fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                  {live.title}
                </div>
                <div style={{ color: "#aaa", fontSize: 13 }}>{live.time}</div>
              </div>

              {/* 🔒 멤버십 전용 뱃지 (예정) */}
              {live.fanOnly && (
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(188, 0, 0, 1)",
                    marginLeft: "10px",
                    marginBottom: "8px",
                    fontWeight: 600,
                  }}
                >
                  🔒 멤버십 전용 라이브
                </div>
              )}
            </div>
          ))}
        </div>
      </div>


      {/* 종료된 라이브(다시보기) 영역 */}
      <div style={{ marginBottom: 120 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30 }}>
          <div style={{ fontWeight: 700, fontSize: 22, color: "#0c0c0cff" }}>다시보기</div>
          <button
            onClick={() => navigate(`/artists/${artistId}/vods`)}
            style={{
              background: "none",
              border: "none",
              color: "#000000ff",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            더보기 <span style={{ marginLeft: 4, fontSize: 18 }}>▶</span>
          </button>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          {endedStreams.slice(0, 3).map((live) => (
            <div
              key={live.id}
              style={{
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
              }}
              // 🔁 라이브/다시보기 공통 멤버십 체크 + 이동
              onClick={() => handleProductClick(live)}
            >
              <img
                src={live.thumb}
                alt={live.title}
                style={{
                  width: "350px",
                  height: "230px",
                  objectFit: "cover",
                  borderRadius: 20,
                }}
              />
              <div style={{ padding: 12 }}>
                <div style={{ color: "#000000ff", fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                  {live.title}
                </div>
                <div style={{ color: "#aaa", fontSize: 13 }}>{live.time}</div>
              </div>

              {/* 🔒 멤버십 전용 뱃지 (다시보기) */}
              {live.fanOnly && (
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(188, 0, 0, 1)",
                    marginLeft: "10px",
                    marginBottom: "8px",
                    fontWeight: 600,
                  }}
                >
                  🔒 멤버십 전용 라이브
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SNS + 스토어 */}
      <div style={{ display: "flex", marginBottom: 50, flexDirection: "column", alignItems: "center", gap: 24 }}>
        {/* SNS */}
        <div style={{ display: "flex", gap: 24, marginBottom: 30 }}>
          <a href={artist.youtube} target="_blank" rel="noopener noreferrer">
            <FaYoutube size={28} color="#000000ff" />
          </a>
          <a href={artist.insta} target="_blank" rel="noopener noreferrer">
            <FaInstagram size={28} color="#000000ff" />
          </a>
          <a href={artist.twitter} target="_blank" rel="noopener noreferrer">
            <FaXTwitter size={28} color="#000000ff" />
          </a>
          <a href={artist.tiktok} target="_blank" rel="noopener noreferrer">
            <FaTiktok size={28} color="#000000ff" />
          </a>
        </div>ㅇ
      </div>
    </div>
  );
}
