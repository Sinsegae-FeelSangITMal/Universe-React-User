import { useEffect, useState } from "react";
import { publicApi } from "../../api/api";
import { useLocation, useParams } from "react-router-dom";


// 아티스트 스트리밍 다시보기 페이지
export default function ArtistVODPage(){

    const { artistId } = useParams();
    const [vods, setVods] = useState([]);

    useEffect(() => {
        async function fetchVods(){
            const res = await publicApi.get(`/ent/streams/artists/${artistId}/streams/ended`);
            setVods(res.data);
        }   
        fetchVods();
    }, [artistId]);


    return (
        <div style={{  maxWidth: 1100, margin: "0 auto", padding: "40px 0" }}>
        { vods.length > 0 ?
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30}}>
                <div style={{ fontWeight: 700, fontSize: 22, color: "#0c0c0cff" }}>다시보기</div>
                </div>
                <div style={{ display: "flex", gap: 24 }}>
                {vods.map((vod) => (
                    <div key={vod.id} style={{ 
                        position: "relative", 
                        overflow: "hidden", 
                        }}>

                    <img src="/assets/img/test/jin.png"/*{vod.thumb}*/ alt={vod.title} style={{ 
                        width: "350px", 
                        height: "230px", 
                        objectFit: "cover",
                        borderRadius: 20, 
                        }} />

                    <div style={{ padding: 12 }}>
                        <div style={{ color: "#000000ff", fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{vod.title}</div>
                        <div style={{ color: "#aaa", fontSize: 13 }}>{vod.time}</div>
                    </div>
                    </div>
                ))}
                </div>
            </div>
            </>
            : 
            <div style={{ marginTop: 200, marginBottom: 200, textAlign: "center"}}>
                다시보기 영상이 존재하지 않습니다.
            </div>
            }
      </div>
    );
}