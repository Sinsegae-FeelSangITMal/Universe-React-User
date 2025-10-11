// Merge.jsx
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth';

import { getStream } from "../../utils/StreamApi";
import { getStreamProductsByStream } from "../../utils/StreamProductApi";
import { getPromotion } from "../../utils/PromotionApi";
import SubtitleDisplay from '../../components/subtitle/SubtitleDisplay';

// ---- Endpoints (vite proxy 기준) ----
const SERVER_URL = '/';
const SOCKET_PATH = '/socket.io';
const CHAT_API_BASE_URL = '/chatapi';
const CHAT_WS_URL = '/ws';

// ---- STOMP Topics ----
const TOPIC_SUBSCRIBE = (id) => `/topic/public/${id ?? 'global'}`;
const APP_SEND = (id) => `/app/live/${id ?? 'global'}`;

export default function Merge() {
  const { artistId, liveId } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useAuthStore();

  // ===== Refs =====
  const remoteVideoRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const composingRef = useRef(false);
  const stompRef = useRef(null);

  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const recvTransportRef = useRef(null);
  const subtitleTimerRef = useRef(null);
  const initOnceRef = useRef(false); // StrictMode 중복 실행 가드

  // 현재 video.srcObject에 할당/관리할 MediaStream
  const msRef = useRef(null);

  // ===== States =====
  const [chatList, setChatList] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [muteSecondsLeft, setMuteSecondsLeft] = useState(0);
  const [isBanned, setIsBanned] = useState(false);

  const [streamStatus, setStreamStatus] = useState('waiting'); // waiting | streaming | ended
  const [isStreamAvailable, setIsStreamAvailable] = useState(false);
  const [subtitle, setSubtitle] = useState(null);
  const [selectedLang, setSelectedLang] = useState('ko');
  const [viewerCount, setViewerCount] = useState(0);

  const [streamInfo, setStreamInfo] = useState(null);
  const [promotion, setPromotion] = useState(null);
  const [productDetails, setProductDetails] = useState([]);

  const myUserId = user?.userId || 0;

  // Merge.jsx 상단 helpers 근처에 이미 msRef가 있으니, 아래 effect를 추가:
  useEffect(() => {
    const v = remoteVideoRef.current;
    if (!v) return;
    if (!(msRef.current instanceof MediaStream)) {
      msRef.current = new MediaStream();
    }
    if (v.srcObject !== msRef.current) {
      v.srcObject = msRef.current;
    }
    v.muted = true;         // autoplay 허용
    v.playsInline = true;
    // 초기 play 킥(프레임 들어오면 자연스럽게 흐름 이어짐)
    const p = v.play?.();
    if (p && p.catch) p.catch(()=>{});
  }, []); // ← 최초 1회


 // =========================
// Video helpers (가장 중요) — 이 블록만 교체
// =========================

// ✅ srcObject를 불필요하게 끊지 않도록 “조건부” 할당만
function ensureAssigned(video, ms) {
  if (!video) return;
  if (video.srcObject !== ms) {
    video.srcObject = ms;
  }
}

function tryPlay(video) {
  if (!video) return;
  // 자동재생 친화
  video.muted = true;
  video.playsInline = true;
  const p = video.play?.();
  if (p && p.catch) p.catch(() => {});
}

// kind 스위치
function attachTrack(track, kind) {
  if (kind === 'video') attachVideoTrack(track);
  else if (kind === 'audio') attachAudioTrack(track);
  else console.warn('[attachTrack] unknown kind:', kind);
}

// ✅ 비디오 트랙
function attachVideoTrack(track) {
  const video = remoteVideoRef.current;
  if (!video) return;

  // 1) 빈 스트림이 이미 video에 꽂혀있음 (1번 변경에서 처리)
  const ms = (msRef.current instanceof MediaStream) ? msRef.current : new MediaStream();

  // 2) 기존 비디오 트랙만 교체 (stop은 선택, "removeTrack"만 하고 stop은 생략 추천)
  ms.getVideoTracks().forEach(t => { try { ms.removeTrack(t); } catch {} });

  // 3) 새 비디오 트랙 추가
  track.enabled = true; // 혹시 모를 disable 방지
  ms.addTrack(track);
  msRef.current = ms;

  // ❗여기서 srcObject 재할당/비우기/ load() 절대 금지 (이미 1회 꽂아둔 상태)
  // ensureAssigned(video, ms)도 호출할 필요 없음

  // 4) play 킥
  const kick = () => {
    const p = video.play?.();
    if (p && p.catch) p.catch(()=>{});
  };

  if (track.muted) {
    try { track.addEventListener('unmute', kick, { once: true }); } catch {}
  } else {
    kick();
  }

  // 보강
  video.addEventListener('loadeddata', kick, { once: true });
  video.addEventListener('canplay',    kick, { once: true });
  if ('requestVideoFrameCallback' in video) {
    // @ts-ignore
    video.requestVideoFrameCallback(() => kick());
  }

  // 디버그
  const s = video.srcObject;
  console.log('[VideoState]', {
    videoTracks: s ? s.getVideoTracks().map(t => ({ id: t.id, muted: t.muted, readyState: t.readyState })) : [],
    audioTracks: s ? s.getAudioTracks().map(t => ({ id: t.id, muted: t.muted, readyState: t.readyState })) : [],
    paused: video.paused,
    readyState: video.readyState
  });
}

// ✅ 오디오 트랙
function attachAudioTrack(track) {
  const video = remoteVideoRef.current;
  if (!video) return;

  const ms = (msRef.current instanceof MediaStream) ? msRef.current : new MediaStream();

  if (!ms.getAudioTracks().some(t => t.id === track.id)) {
    track.enabled = true;
    ms.addTrack(track);
  }
  msRef.current = ms;

  // ❗여기도 srcObject 재할당 절대 금지 (이미 1회 꽂힘)
  // 필요시 플레이 킥만
  const p = video.play?.();
  if (p && p.catch) p.catch(()=>{});
}
// =========================

  // ===== 채팅 자동 스크롤 =====
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatList]);

  // ===== 데이터 불러오기 =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        const streamResp = await getStream(liveId);
        const s = streamResp?.data?.data || streamResp?.data || {};
        setStreamInfo({ title: s?.title, artistName: s?.artistName });

        const promoId = s?.promotionId ?? s?.promotion_id ?? s?.PR_ID;
        if (promoId) {
          const pr = await getPromotion(promoId);
          const d = pr?.data?.data || pr?.data || {};
          setPromotion({ ...d });
        }

        const spResp = await getStreamProductsByStream(liveId);
        const spList = Array.isArray(spResp?.data?.data) ? spResp.data.data : [];
        const products = spList.map((sp) => ({ ...(sp.product || {}) }));
        setProductDetails(products);
      } catch (err) {
        console.error('[Live] 데이터 로딩 실패:', err);
      }
    };
    if (liveId) fetchData();
  }, [liveId]);

  // ===== STOMP/SockJS 채팅 =====
  useEffect(() => {
    if (!accessToken) return;

    console.log(`[Chat] SockJS 연결 시도: ${CHAT_WS_URL}`);
    const client = new StompClient({
      webSocketFactory: () => new SockJS(CHAT_WS_URL),
      connectHeaders: { Authorization: `Bearer ${accessToken}` }, // CONNECT 프레임에서 검증
      reconnectDelay: 4000,
      onConnect: (frame) => {
        // 1. 공용 채팅 구독
        client.subscribe(TOPIC_SUBSCRIBE(artistId), (f) => {
          try {
            const body = JSON.parse(f.body);
            // 서버: { roomId, senderId, nickname, content, contentType, createdAt }
            setChatList((prev) => [
              ...prev,
              {
                id: `${body.createdAt ?? Date.now()}-${Math.random()}`,
                senderId: body.senderId ?? 0,
                nickname: body.nickname ?? '익명',
                text: body.content ?? '',
                type: body.contentType === 'SYSTEM' ? 'admin' : 'user',
                createdAt: body.createdAt,
              },
            ]);
          } catch {
            setChatList((prev) => [
              ...prev,
              { id: `${Date.now()}-${Math.random()}`, senderId: -1, nickname: '시스템', text: f.body, type: 'admin' },
            ]);
          }
        });

        // 2. 개인 시스템 메시지 구독 (Mute/Ban 알림용)
        client.subscribe(`/queue/system-${myUserId}`, (message) => {
          try {
            const payload = JSON.parse(message.body);
            
                        if (payload.code === 'BANNED') {
                          setIsBanned(true);
                        } else if (payload.code === 'MUTED') {                toast(payload.message, { icon: '🤫' });
              setIsMuted(true);
              setMuteSecondsLeft(30);
            }

          } catch (e) {
            // JSON 파싱 실패 시 일반 텍스트로 처리
            toast.error(message.body);
          }
        });
      },
      onStompError: (frame) =>
        console.error('[Chat] Broker error:', frame.headers['message'], frame.body),
      onWebSocketError: (evt) => console.error('[Chat] WebSocket error:', evt),
      onWebSocketClose: (evt) => console.warn('[Chat] WebSocket closed:', evt?.code, evt?.reason),
    });

    client.activate();
    stompRef.current = client;
    return () => {
      try { client.deactivate(); } catch {}
      stompRef.current = null;
    };
  }, [artistId, accessToken, navigate]);

  // ===== 소켓/스트림 (Mediasoup) =====
  useEffect(() => {
    if (!liveId) {
      console.warn('[Live] liveId가 없어 소켓 연결을 건너뜁니다.');
      return;
    }
    if (initOnceRef.current) return;
    initOnceRef.current = true;

    console.log('[Live] EFFECT ENTER', { liveId });

    const socket = io(SERVER_URL, {
      path: SOCKET_PATH,
      transports: ['websocket'],
      query: { role: 'viewer', liveId: String(liveId) },
      forceNew: true,
    });

    socketRef.current = socket;
    window.__viewerSocket = socket;

    socket.on('connect', () => {
      console.log(`🔗 연결됨: ${socket.id}, role=viewer, liveId=${liveId}`);
      socket.emit('join-live', { liveId: String(liveId) });
    });

    socket.on('disconnect', (reason) =>
      console.warn(`❌ 연결 끊김: ${socket.id}, reason=${reason}`)
    );
    socket.on('connect_error', (e) => console.error('[Live] connect_error:', e?.message || e));

    socket.on('viewer-count', (count) => {
      setViewerCount(count);
    });

    // 자막
    const handleSubtitleEvent = (data) => {
      try {
        let payload = data;
        if (typeof data === 'string') payload = { original: data };
        if (payload.liveId && String(payload.liveId) !== String(liveId)) return;
        const incoming = payload.subtitle || payload;
        const normalized = typeof incoming === 'string' ? { original: incoming } : incoming;
        if (normalized?.original) {
          setSubtitle(normalized);
          if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
          subtitleTimerRef.current = setTimeout(() => setSubtitle(null), 6000);
        }
      } catch (err) {
        console.error('자막 처리 중 오류', err);
      }
    };
    socket.on('subtitle', handleSubtitleEvent);
    socket.on('subtitle-update', handleSubtitleEvent);

    // ===== Mediasoup setup =====
    const setupMediasoup = async () => {
      try {
        // 라우터 Capabilities
        const routerRtpCapabilities = await new Promise((r) =>
          socket.emit('getRouterRtpCapabilities', r)
        );
        console.log('[MS] routerRtpCapabilities:', routerRtpCapabilities);

        const device = new mediasoupClient.Device();
        await device.load({ routerRtpCapabilities });
        deviceRef.current = device;

        // Recv Transport 생성
        const transportParams = await new Promise((r) =>
          socket.emit('createWebRtcTransport', { sending: false }, r)
        );
        console.log('[MS] recv transport params:', transportParams);

        const transport = device.createRecvTransport(transportParams);
        recvTransportRef.current = transport;

        // DTLS connect (서버는 { dtlsParameters }만 받음)
        transport.on('connect', ({ dtlsParameters }, callback, errback) => {
          socket.emit('connectTransport', { dtlsParameters }, (error) => {
            if (error) errback(new Error(error));
            else callback();
          });
        });

        // 비디오/오디오 각각 소비
        const consumeKind = async (kind) => {
          const { rtpCapabilities } = deviceRef.current;
          const params = await new Promise((r) =>
            socket.emit(
              'consume',
              { rtpCapabilities, kind, liveId },
              r
            )
          );

          if (!params || params?.error) {
            console.warn(`[MS] consume(${kind}) 대기/실패:`, params?.error || params);
            return false;
          }

          const consumer = await recvTransportRef.current.consume(params);
          const track = consumer.track;

          const attachNow = async () => {
            // 1) 트랙 붙이기 (비디오 먼저, 오디오는 add)
            attachTrack(track, kind);

            // 2) 소비 재개
            try { await consumer.resume(); } catch (e) { console.warn('[consume] resume error:', e); }

            // 3) (가능하면) 첫 키프레임 요청 - 비디오 품질/초기프레임 앞당김
            if (consumer.requestKeyFrame) {
              try { await consumer.requestKeyFrame(); } catch {}
            }

            // 4) 서버 ack (서버에서 뭔가 할 게 없으면 무해)
            socket.emit('resume-consumer', { consumerId: consumer.id });

            // 디버깅
            const v = remoteVideoRef.current;
            const ms = v?.srcObject;
            console.log('[VideoState]', {
              videoTracks: ms ? ms.getVideoTracks().map(t => ({ id: t.id, muted: t.muted, readyState: t.readyState })) : [],
              audioTracks: ms ? ms.getAudioTracks().map(t => ({ id: t.id, muted: t.muted, readyState: t.readyState })) : [],
              paused: v?.paused,
              readyState: v?.readyState
            });
          };

          // 트랙이 이미 unmuted면 즉시, 아니면 첫 unmute 때 실행
          if (track.muted) {
            try { track.addEventListener?.('unmute', () => { void attachNow(); }, { once: true }); } catch {}
          } else {
            void attachNow();
          }

          return true;
        };

        const okV = await consumeKind('video');
        const okA = await consumeKind('audio');

        if (!okV && !okA) {
          setIsStreamAvailable(false);
          setStreamStatus('waiting');
          console.warn('[MS] producer 없음 → new-producer 대기');
          socket.once('new-producer', async () => {
            const vv = await consumeKind('video');
            const aa = await consumeKind('audio');
            if (vv || aa) {
              setIsStreamAvailable(true);
              setStreamStatus('streaming');
              tryPlay(remoteVideoRef.current);
            }
          });
        } else {
          setIsStreamAvailable(true);
          setStreamStatus('streaming');
          tryPlay(remoteVideoRef.current);
        }
      } catch (error) {
        console.error('Mediasoup 설정 실패:', error);
      }
    };

    socket.on('connect', setupMediasoup);

    socket.on('producer-closed', () => {
      setStreamStatus('ended');
      setIsStreamAvailable(false);
      const v = remoteVideoRef.current;
      if (v?.srcObject) {
        v.srcObject.getTracks().forEach((t) => t.stop());
        v.srcObject = null;
      }
      msRef.current = null;
      setSubtitle(null);
    });

    return () => {
      console.log('[Live] cleanup: disconnect');
      try { socket.disconnect(); } catch {}
      try { recvTransportRef.current?.close(); } catch {}
      const v = remoteVideoRef.current;
      if (v?.srcObject) {
        v.srcObject.getTracks().forEach((t) => t.stop());
        v.srcObject = null;
      }
      msRef.current = null;
      if (subtitleTimerRef.current) {
        clearTimeout(subtitleTimerRef.current);
        subtitleTimerRef.current = null;
      }
    };
  }, [liveId]);

  // ===== Mute 타이머 =====
  useEffect(() => {
    if (!isMuted || muteSecondsLeft <= 0) {
      if (isMuted) setIsMuted(false);
      return;
    }
    const timerId = setInterval(() => setMuteSecondsLeft((p) => p - 1), 1000);
    return () => clearInterval(timerId);
  }, [isMuted, muteSecondsLeft]);

  // ===== 최근 메시지 =====
  useEffect(() => {
    if (!artistId) return;
    const fetchRecent = async () => {
      try {
        const res = await fetch(`${CHAT_API_BASE_URL}/rooms/${artistId}/messages`);
        if (res.ok) {
          const history = await res.json();
          const formatted = history.map((m) => ({
            id: `${m.createdAt ?? Date.now()}-${Math.random()}`,
            senderId: m.senderId ?? 0,
            nickname: m.nickname ?? '익명',
            text: m.content ?? '',
            type: m.contentType === 'SYSTEM' ? 'admin' : 'user',
            createdAt: m.createdAt,
          }));
          setChatList(formatted);
        }
      } catch (e) {
        console.error('[Chat] 최근 메시지 로딩 실패:', e);
      }
    };
    fetchRecent();
  }, [artistId]);

  // ===== Ban 체크 =====
  useEffect(() => {
    console.log(`[Ban Check] Effect triggered. myUserId: ${myUserId}, artistId: ${artistId}`);
    // 로그인된 사용자이고, artistId가 있을 때만 체크
    if (myUserId && artistId) {
      const checkBanStatus = async () => {
        const url = `/chatapi/moderation/status?userId=${myUserId}&roomId=${artistId}`;
        console.log(`[Ban Check] Fetching ban status from: ${url}`);
        try {
          const response = await fetch(url);
          console.log(`[Ban Check] Response status: ${response.status}`);

          if (!response.ok) {
            console.error(`[Ban Check] API request failed with status ${response.status}`);
            return;
          }

          const data = await response.json();
          console.log('[Ban Check] Received data:', data);

          if (data.isBanned) {
            setIsBanned(true);
          } else {
            console.log('[Ban Check] User is not banned.');
          }
        } catch (error) {
          console.error('Ban status check failed with error:', error);
        }
      };

      checkBanStatus();
    } else {
      console.log('[Ban Check] Skipping check because myUserId or artistId is missing.');
    }
  }, [myUserId, artistId, navigate]);

    // ===== 유틸 =====
    const formatTime = (isoString) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? '오후' : '오전';
      const formattedHours = hours % 12 || 12;
      return `${ampm} ${formattedHours}:${minutes.toString().padStart(2, '0')}`;
    };
  
    // ===== 채팅 입력 =====
    const handleChatInput = (e) => setChatInput(e.target.value);
  
    const handleChatKeyDown = (e) => {
      // IME(한글) 조합 중이면 엔터 무시 (크롬 마지막 글자 중복 방지)
      if (e.key === 'Enter') {
        if (composingRef.current || e.nativeEvent.isComposing) return;
        handleChatSend();
      }
    };

    const handleChatSend = () => {
      const text = chatInput.trim();
      if (!text) return;
  
      if (!stompRef.current?.connected) {
        toast.error('채팅 서버와 연결되지 않았습니다.');
        return;
      }
  
      // 서버가 토큰으로 사용자 식별 → 내용만 보냄
      const payload = { content: text };
      stompRef.current.publish({
        destination: APP_SEND(artistId),
        body: JSON.stringify(payload),
      });
  
      setChatInput('');
    };

 // ===== 디자인 그대로 렌더 =====
 if (isBanned) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8f9fa' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚫 접근이 차단되었습니다 🚫</h2>
      <p style={{ fontSize: '1.2rem', color: '#6c757d', marginBottom: '2rem' }}>이 라이브에 대한 접근 권한이 없습니다.</p>
      <button 
        onClick={() => navigate('/main')}
        style={{
          padding: '10px 20px',
          fontSize: '1rem',
          color: '#fff',
          backgroundColor: '#007bff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        메인으로 돌아가기
      </button>
    </div>
  );
}

  return (
    <div className="live-page-container">
      <div className="live-page-header">
        <h2 className="live-page-artist">
          {streamInfo?.artistName || '아티스트'} <span style={{ color: '#7c4dff' }}>LIVE</span>
        </h2>
        <p className="live-page-desc">{streamInfo?.title || '방송 정보 로딩 중...'}</p>
      </div>

      <div className="live-page-stream-section">
        <div className="live-page-video-wrapper" style={{ position: 'relative' }}>
          <div className="viewer-count-badge">👀 {viewerCount}명 접속 중</div>
          <video
            ref={remoteVideoRef}
            autoPlay
            muted
            playsInline
            className="live-page-video"
            onResize={(e) => console.log('[Video] resize', e.currentTarget.videoWidth, e.currentTarget.videoHeight)}
            onLoadedMetadata={(e) => {
              console.log('[Video] loadedmetadata, readyState=', e.currentTarget.readyState);
              e.currentTarget.play?.().catch(()=>{});
            }}
            onLoadedData={(e) => {
              console.log('[Video] loadeddata');
              e.currentTarget.play?.().catch(()=>{});
            }}
            onCanPlay={(e) => {
              console.log('[Video] canplay');
              e.currentTarget.play?.().catch(()=>{});
            }}
            onClick={(e) => {
              const v = e.currentTarget;
              v.muted = false; // 클릭으로 음소거 해제 → 정책 우회
              v.play?.().catch(err => console.error('사용자 클릭 재생 실패:', err));
            }}
            style={{
              cursor: 'pointer',
              width: '100%',
              minHeight: 320,
              background: '#000',
              objectFit: 'cover',
              borderRadius: 8
            }}
          />

          {!isStreamAvailable && streamStatus === 'waiting' && (
            <p className="live-page-waiting">방송 시작을 기다리는 중...</p>
          )}
          {!isStreamAvailable && streamStatus === 'ended' && (
            <p className="live-page-waiting">방송이 종료되었습니다.</p>
          )}
          {streamStatus === 'streaming' && (
            <>
              <SubtitleDisplay subtitle={subtitle} selectedLang={selectedLang} />
              <div className="subtitle-select-wrapper">
                <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)}>
                  <option value="none">자막 없음</option>
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="live-page-chat-section" style={{ height: '100%' }}>
          <div className="live-page-chat-title">실시간 채팅</div>
          <div className="live-page-chat-messages" ref={chatMessagesRef}>
            {chatList.map((msg) => {
              const isMine = myUserId && msg.senderId === myUserId && msg.type !== 'admin';

              // 서버 닉네임 우선 사용
              const name =
              msg.type === 'admin'
                ? '시스템'
                : isMine
                  ? (msg.nickname || sender)
                  : (msg.nickname || '익명');

              const time = formatTime(msg.createdAt);

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: isMine ? 'flex-end' : 'flex-start',
                    margin: '5px 0'
                  }}
                >
                  {isMine && (
                    <span
                      style={{
                        alignSelf: 'flex-end',
                        fontSize: '0.75rem',
                        color: '#999',
                        marginRight: 8
                      }}
                    >
                      {time}
                    </span>
                  )}

                  <div
                    className={msg.type === 'admin' ? 'live-page-chat-admin' : 'live-page-chat-user'}
                    style={{ maxWidth: '70%' }}
                  >
                    <span
                      className="live-page-chat-sender"
                      style={{ color: msg.type === 'admin' ? '#3b4fff' : '#222', fontWeight: 600 }}
                    >
                      {name}:
                    </span>{' '}
                    <span className="live-page-chat-text">{msg.text}</span>
                  </div>

                  {!isMine && (
                    <span
                      style={{
                        alignSelf: 'flex-end',
                        fontSize: '0.75rem',
                        color: '#999',
                        marginLeft: 8
                      }}
                    >
                      {time}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="live-page-chat-input-wrap">
            <input
              type="text"
              className="live-page-chat-input"
              placeholder={isMuted ? `${muteSecondsLeft}초 동안 채팅이 금지되었습니다.` : "메시지 보내기.."}
              value={chatInput}
              onChange={handleChatInput}
              onCompositionStart={() => { composingRef.current = true; }} // IME 시작
              onCompositionEnd={() => { composingRef.current = false; }}  // IME 종료
              onKeyDown={handleChatKeyDown}
              disabled={isMuted}
            />
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', marginTop: '30px' }}>
        <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
          🎁 프로모션 상품
        </h3>
        {promotion ? <div>{promotion.name}</div> : <div>등록된 프로모션이 없습니다.</div>}
      </div>

      <div className="live-page-products-section">
        <h3 className="live-page-products-title">라이브 상품 목록</h3>
        <div className="live-page-product-list">
          {productDetails.length > 0 ? (
            productDetails.map((p) => (
              <div key={p.id} className="live-page-product-card live-page-product-card-wide">
                <img
                  src={p.img ? `${CHAT_API_BASE_URL}${p.img}` : '/assets/img/placeholder/240.png'}
                  alt={p.name}
                  className="live-page-product-img"
                />
                <div className="live-page-product-info">
                  <div className="live-page-product-name">{p.name}</div>
                </div>
                <div className="live-page-product-price-col">
                  <span className="live-page-product-price">
                    ₩{Number(p.price || 0).toLocaleString()}
                  </span>
                </div>
                <div className="live-page-product-buttons-col">
                  <button className="live-page-btn-cart live-page-btn-outline">장바구니</button>
                  <button className="live-page-btn-buy live-page-btn-filled">주문하기</button>
                </div>
              </div>
            ))
          ) : (
            <div className="live-page-product-empty">등록된 상품이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
