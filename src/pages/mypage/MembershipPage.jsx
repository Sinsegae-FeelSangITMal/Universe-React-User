import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/auth";
import { getMembership } from "../../utils/MembershipApi";

export default function MembershipPage() {
    const { user } = useAuthStore(); 
    const userId = user?.userId;


    const [memberships, setMemberships] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const res = await getMembership(userId);
            setMemberships(res.data.data || []);
        } catch (err) {
            setMemberships([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="custom-background">
            <div className="container">
                <div className="section-top-border">
                    <div className="row">
                        <div className="col-lg-12 col-md-12">
                            <h2 className="mb-40" style={{ fontWeight: 700 }}>멤버십 관리</h2>
                            <div className="custom-box" style={{ padding: 32, background: '#fff', borderRadius: 12, minHeight: 200 }}>
                                {loading ? (
                                    <div>로딩 중...</div>
                                ) : memberships.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#888', fontSize: 18, padding: 40 }}>
                                        구매한 멤버십이 없습니다
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                                <th style={{ padding: 12 }}>아티스트</th>
                                                <th style={{ padding: 12 }}>시작일</th>
                                                <th style={{ padding: 12 }}>종료일</th>
                                                <th style={{ padding: 12 }}>상태</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {memberships.map((m, idx) => {
                                                const now = new Date();
                                                const end = new Date(m.endDate);
                                                const status = end >= now ? '구독중' : '구독 기한 만료';
                                                const format = d => d.slice(0, 10).replace(/-/g, '. ');
                                                return (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                                        <td style={{ padding: 12 }}>{m.artistName}</td>
                                                        <td style={{ padding: 12 }}>{format(m.startDate)}</td>
                                                        <td style={{ padding: 12 }}>{format(m.endDate)}</td>
                                                        <td style={{ padding: 12 }}>{status}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}