import { useEffect, useState } from "react";
import { publicApi } from "../../api/api";
import { useNavigate, useParams } from "react-router-dom";


// 아티스트 스트리밍 다시보기 페이지
export default function ArtistVODPage() {

    const navigate = useNavigate();

    const { artistId } = useParams();
    const [artist, setArtist] = useState({});
    const [vods, setVods] = useState([]);
    const [membership, setMembership] = useState();

    useEffect(() => {
        async function fetchArtist() {
              const res = await publicApi.get(`/ent/artists/${artistId}`);
              console.log("/ent/artists-intro/aritstId 호출 성공");
              setArtist(res.data);
            }

        async function fetchVods() {
            const res = await publicApi.get(`/ent/streams/artists/${artistId}/streams/ended`);
            setVods(res.data);
        }
        fetchArtist();
        fetchVods();
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

     const handleProductClick = (live) => {
    // 팬전용 라이브인지 검사
    if (live.fanOnly) {
      const today = new Date();

    // 유저가 해당 아티스트 멤버십을 가지고 있는지 검사
    const hasValidMembership = membership?.some((m) => {
        if (m.artistName !== artist.name) return false;
        const start = new Date(m.startDate);
        const end = new Date(m.endDate);
        return today >= start && today <= end;
        }) || false;

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
            {vods.length > 0 ?

                <>
                    <h1 style={{  // 그룹명 
                        fontWeight: 800,
                        fontSize: 70,
                        color: "#0a0a0aff",
                        marginTop: 30,
                        marginBottom: 100,
                        textAlign: "center"
                    }}>{vods[0].artistName}</h1>

                    <div style={{ marginBottom: 120 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30 }}>
                            <div style={{ fontWeight: 700, fontSize: 22, color: "#0c0c0cff" }}>LIVE 다시보기</div>
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)", // 한 줄에 3개
                                gap: 24,
                                justifyItems: "center", // 가운데 정렬
                            }}
                        >
                            {vods.map((vod) => (
                                <div onClick={() => handleProductClick(vod)}
                                    key={vod.id}
                                    style={{
                                        position: "relative",
                                        overflow: "hidden",
                                        width: 350,
                                        cursor: "pointer"
                                    }}
                                    
                                >
                                    <img
                                        src={vod.thumb}
                                        alt={vod.title}
                                        style={{
                                            width: "100%",
                                            height: 230,
                                            objectFit: "cover",
                                            borderRadius: 20,
                                        }}
                                    />

                                    <div style={{ padding: 12 }}>
                                        <div
                                            style={{
                                                color: "#000",
                                                fontWeight: 600,
                                                fontSize: 16,
                                                marginBottom: 4,
                                            }}
                                        >
                                            {vod.title}
                                        </div>
                                        <div style={{ color: "#aaa", fontSize: 13 }}>{vod.time}</div>
                                        {/* 🔒 멤버십 전용 뱃지 (다시보기) */}
                                        {vod.fanOnly && (
                                            <div
                                            style={{
                                                fontSize: 13,
                                                color: "rgba(188, 0, 0, 1)",
                                                marginTop: "3px",
                                                marginBottom: "8px",
                                                fontWeight: 600,
                                            }}
                                            >
                                            🔒 멤버십 전용 라이브
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
                :
                <div style={{ marginTop: 200, marginBottom: 200, textAlign: "center" }}>
                    다시보기 영상이 존재하지 않습니다.
                </div>
            }
        </div>
    );
}