// Merge.jsx
/* eslint-disable no-empty */
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth';

import { getStream } from '../../utils/StreamApi';
import { getStreamProductsByStream } from '../../utils/StreamProductApi';
import { getPromotion } from '../../utils/PromotionApi';
import SubtitleDisplay from '../../components/subtitle/SubtitleDisplay';

/* =========================
   Endpoints (게이트웨이 기준)
   ========================= */
const SERVER_URL = '';              // same-origin (vite proxy → gateway)
const SOCKET_PATH = '/socket.io';
const CHAT_API_BASE_URL = '/chatapi';
const CHAT_WS_URL = '/ws';
const toGatewayUrl = (path) => (path && /^https?:\/\//i.test(path) ? path : path);

/* =========================
   STOMP Topics
   ========================= */
const TOPIC_SUBSCRIBE = (id) => `/topic/public/${id ?? 'global'}`;
const APP_SEND = (id) => `/app/live/${id ?? 'global'}`;

export default function Merge() {
  const { artistId, liveId } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useAuthStore();

  /* ========== Refs ========== */
  const remoteVideoRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const composingRef = useRef(false);
  const stompRef = useRef(null);
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const recvTransportRef = useRef(null);
  const subtitleTimerRef = useRef(null);
  const initOnceRef = useRef(false);
  const msRef = useRef(null);              // <video>.srcObject 에 꽂아둘 MediaStream

  /* ========== States ========== */
  const [chatList, setChatList] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [muteSecondsLeft, setMuteSecondsLeft] = useState(0);
  const [isBanned, setIsBanned] = useState(false);

  const [streamStatus, setStreamStatus] = useState('loading'); // loading | waiting | streaming | ended | vod
  const [serverEnded, setServerEnded] = useState(false);
  const [isVodPlaying, setIsVodPlaying] = useState(false);
  const [isStreamAvailable, setIsStreamAvailable] = useState(false);

  const [subtitle, setSubtitle] = useState(null);
  const [selectedLang, setSelectedLang] = useState('ko');
  const [viewerCount, setViewerCount] = useState(0);

  const [streamInfo, setStreamInfo] = useState(null);
  const [promotion, setPromotion] = useState(null);
  const [productDetails, setProductDetails] = useState([]);

  /* 최신 streamStatus 접근용 ref */
  const statusRef = useRef(streamStatus);
  useEffect(() => { statusRef.current = streamStatus; }, [streamStatus]);

  const isVodMode = streamStatus === 'vod';
  const showViewerBadge = streamStatus === 'streaming' && isStreamAvailable;

  const myUserId = user?.userId || 0;
  const sender = user?.nickname || '나';

  /* =========================
     VOD 전환 & 재생 컨트롤
     ========================= */
  const setVideoToVod = (recordPath) => {
    const videoEl = remoteVideoRef.current;
    if (!videoEl) return;

    if (videoEl.srcObject) {
      try { videoEl.srcObject.getTracks?.().forEach((t) => t.stop?.()); } catch { }
      videoEl.srcObject = null;
    }

    videoEl.crossOrigin = 'anonymous';
    videoEl.src = toGatewayUrl(recordPath || '');
    videoEl.controls = false;      // 커스텀 버튼 사용
    videoEl.muted = false;
    videoEl.playsInline = true;

    try { videoEl.load(); } catch { }
    try { videoEl.pause(); } catch { }

    setIsVodPlaying(false);
    setIsStreamAvailable(true);
    setStreamStatus('vod');
  };

  const handleVodPlay = async () => {
    const v = remoteVideoRef.current;
    if (!v) return;
    try {
      v.muted = false;
      await v.play();
      setIsVodPlaying(true);
    } catch (e) {
      console.error('[VOD] play 실패:', e);
      toast.error('재생할 수 없습니다.');
    }
  };

  const handleVodPause = () => {
    const v = remoteVideoRef.current;
    if (!v) return;
    try { v.pause(); } finally { setIsVodPlaying(false); }
  };

  /* =========================
     초기 비디오 MediaStream 장착
     ========================= */
  useEffect(() => {
    const v = remoteVideoRef.current;
    if (!v) return;

    if (!(msRef.current instanceof MediaStream)) {
      msRef.current = new MediaStream();
    }
    if (v.srcObject !== msRef.current) {
      v.srcObject = msRef.current;
    }
    v.muted = true;
    v.playsInline = true;

    const p = v.play?.();
    if (p && p.catch) p.catch(() => { });
  }, []);

  /* =========================
     Video/Aidio 트랙 부착 헬퍼
     ========================= */
  const tryPlay = (video) => {
    if (!video) return;
    video.muted = true;
    video.playsInline = true;
    const p = video.play?.();
    if (p && p.catch) p.catch(() => { });
  };

  const attachTrack = (track, kind) => {
    if (kind === 'video') attachVideoTrack(track);
    else if (kind === 'audio') attachAudioTrack(track);
  };

  const attachVideoTrack = (track) => {
    const video = remoteVideoRef.current;
    if (!video) return;

    const ms = (msRef.current instanceof MediaStream) ? msRef.current : new MediaStream();
    ms.getVideoTracks().forEach((t) => { try { ms.removeTrack(t); } catch { } });
    track.enabled = true;
    ms.addTrack(track);
    msRef.current = ms;

    const kick = () => {
      const p = video.play?.();
      if (p && p.catch) p.catch(() => { });
    };

    if (track.muted) {
      try { track.addEventListener('unmute', kick, { once: true }); } catch { }
    } else {
      kick();
    }

    video.addEventListener('loadeddata', kick, { once: true });
    video.addEventListener('canplay', kick, { once: true });
    if ('requestVideoFrameCallback' in video) {
      // @ts-ignore
      video.requestVideoFrameCallback(() => kick());
    }
  };

  const attachAudioTrack = (track) => {
    const video = remoteVideoRef.current;
    if (!video) return;

    const ms = (msRef.current instanceof MediaStream) ? msRef.current : new MediaStream();
    if (!ms.getAudioTracks().some((t) => t.id === track.id)) {
      track.enabled = true;
      ms.addTrack(track);
    }
    msRef.current = ms;

    const p = video.play?.();
    if (p && p.catch) p.catch(() => { });
  };

  /* =========================
     UI: 채팅 자동 스크롤
     ========================= */
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatList]);

  /* =========================
     데이터 로딩 (스트림/프로모션/상품)
     ========================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const streamResp = await getStream(liveId);
        const s = streamResp?.data?.data || streamResp?.data || {};

        const normalized = {
          id: s.id,
          title: s.title,
          artistName: s.artistName,
          time: s.time,
          endTime: s.endTime,
          status: (s?.srStatus || s?.status || '').toString().toUpperCase(),
          record: s?.record || s?.srRecord,
        };
        setStreamInfo(normalized);

        const raw = normalized.status;
        setServerEnded(raw === 'ENDED');

        if (raw === 'ENDED' || raw === 'END' || raw === 'COMPLETED') {
          if (normalized.record) setVideoToVod(normalized.record);
          else { setIsStreamAvailable(false); setStreamStatus('ended'); }
        } else if (raw === 'LIVE' || raw === 'WAITING') {
          setIsStreamAvailable(false);
          setStreamStatus('waiting');
        } else {
          setIsStreamAvailable(false);
          setStreamStatus('ended');
        }

        const promoId = s?.promotionId ?? s?.promotion_id ?? s?.PR_ID;
        if (promoId) {
          const pr = await getPromotion(promoId);
          const d = pr?.data?.data || pr?.data || {};
          setPromotion({ ...d });
        } else {
          setPromotion(null);
        }

        const spResp = await getStreamProductsByStream(liveId);
        const spList = Array.isArray(spResp?.data?.data) ? spResp.data.data : [];
        setProductDetails(spList.map((sp) => ({ ...(sp.product || {}) })));
      } catch (err) {
        console.error('[Live] 데이터 로딩 실패:', err);
        setStreamInfo((prev) => prev ?? { title: '', artistName: '' });
        setStreamStatus('ended');
      }
    };
    if (liveId) fetchData();
  }, [liveId]);

  /* =========================
     STOMP 채팅 (SockJS)
     ========================= */
  useEffect(() => {
    if (!accessToken) return;

    const client = new StompClient({
      webSocketFactory: () => new SockJS(CHAT_WS_URL),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 4000,
      onConnect: () => {
        client.subscribe(TOPIC_SUBSCRIBE(artistId), (f) => {
          try {
            const body = JSON.parse(f.body);
            setChatList((prev) => ([
              ...prev,
              {
                id: `${body.createdAt ?? Date.now()}-${Math.random()}`,
                senderId: body.senderId ?? 0,
                nickname: body.nickname ?? '익명',
                text: body.content ?? '',
                type: body.contentType === 'SYSTEM' ? 'admin' : 'user',
                createdAt: body.createdAt,
              },
            ]));
          } catch {
            setChatList((prev) => ([
              ...prev,
              { id: `${Date.now()}-${Math.random()}`, senderId: -1, nickname: '시스템', text: f.body, type: 'admin' },
            ]));
          }
        });

        client.subscribe(`/queue/system-${myUserId}`, (message) => {
          try {
            const payload = JSON.parse(message.body);
            if (payload.code === 'BANNED') setIsBanned(true);
            else if (payload.code === 'MUTED') {
              toast(payload.message, { icon: '🤫' });
              setIsMuted(true);
              setMuteSecondsLeft(30);
            }
          } catch (e) {
            toast.error(message.body);
          }
        });
      },
      onStompError: (frame) => console.error('[Chat] Broker error:', frame.headers['message'], frame.body),
      onWebSocketError: (evt) => console.error('[Chat] WebSocket error:', evt),
      onWebSocketClose: (evt) => console.warn('[Chat] WebSocket closed:', evt?.code, evt?.reason),
    });

    client.activate();
    stompRef.current = client;

    return () => {
      try { client.deactivate(); } catch { }
      stompRef.current = null;
    };
  }, [artistId, accessToken, myUserId]);

  /* =========================
     자막 STOMP (Spring Boot)
     ========================= */
  useEffect(() => {
    if (!liveId) return;

    const sock = new SockJS('/ws-subtitle');
    const subtitleClient = new StompClient({
      webSocketFactory: () => sock,
      reconnectDelay: 4000,
      debug: (str) => console.log('[Subtitle DEBUG]', str),
      onConnect: () => {
        subtitleClient.subscribe(`/topic/subtitles/${liveId}`, (frame) => {
          try {
            const payload = JSON.parse(frame.body);
            setSubtitle(payload);
            if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
            subtitleTimerRef.current = setTimeout(() => setSubtitle(null), 6000);
          } catch (err) {
            console.error('자막 파싱 실패', err);
          }
        });
      },
      onStompError: (frame) => console.error('[Subtitle] Broker error:', frame.headers['message'], frame.body),
      onWebSocketError: (evt) => console.error('[Subtitle] WebSocket error:', evt),
      onWebSocketClose: (evt) => console.warn('[Subtitle] WebSocket closed:', evt?.code, evt?.reason),
    });

    subtitleClient.activate();
    return () => { try { subtitleClient.deactivate(); } catch { }; };
  }, [liveId]);

  /* =========================
     Mediasoup 시청자 연결
     ========================= */
  useEffect(() => {
    if (!liveId) return;
    if (serverEnded || streamStatus === 'vod' || streamStatus === 'ended') return;
    if (initOnceRef.current) return;
    initOnceRef.current = true;

    const socket = io(SERVER_URL, {
      path: SOCKET_PATH,
      transports: ['websocket'],
      query: { role: 'viewer', streamId: String(liveId) },
      forceNew: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-live', { liveId: String(liveId) });
    });

    socket.on('disconnect', (reason) => console.warn('viewer disconnect:', reason));
    socket.on('connect_error', (e) => console.error('[Live] connect_error:', e?.message || e));
    socket.on('viewer-count', (count) => setViewerCount(count));

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
        console.error('자막 처리 오류', err);
      }
    };
    socket.on('subtitle', handleSubtitleEvent);
    socket.on('subtitle-update', handleSubtitleEvent);

    const setupMediasoup = async () => {
      try {
        const routerRtpCapabilities = await new Promise((r) => socket.emit('getRouterRtpCapabilities', r));
        const device = new mediasoupClient.Device();
        await device.load({ routerRtpCapabilities });
        deviceRef.current = device;

        const transportParams = await new Promise((r) => socket.emit('createWebRtcTransport', { sending: false }, r));
        const transport = device.createRecvTransport(transportParams);
        recvTransportRef.current = transport;

        transport.on('connect', ({ dtlsParameters }, callback, errback) => {
          socket.emit('connectTransport', { dtlsParameters }, (error) => {
            if (error) errback(new Error(error));
            else callback();
          });
        });

        const consumeKind = async (kind) => {
          try {
            const { rtpCapabilities } = deviceRef.current;
            const params = await new Promise((r) => socket.emit('consume', { rtpCapabilities, kind, liveId }, r));

            if (!params || params?.error) {
              if (!serverEnded && statusRef.current !== 'ended' && statusRef.current !== 'vod') {
                setIsStreamAvailable(false);
                setStreamStatus('waiting');
              }
              return false;
            }

            const consumer = await recvTransportRef.current.consume(params);
            const track = consumer.track;

            const attachNow = async () => {
              attachTrack(track, kind);
              try { await consumer.resume(); } catch { }
              try { await consumer.requestKeyFrame?.(); } catch { }
              socket.emit('resume-consumer', { consumerId: consumer.id });
            };

            if (track.muted) {
              try { track.addEventListener?.('unmute', () => { void attachNow(); }, { once: true }); } catch { }
            } else {
              void attachNow();
            }
            return true;
          } catch (err) {
            console.error(`[MS] consumeKind(${kind}) error:`, err);
            return false;
          }
        };

        const okV = await consumeKind('video');
        const okA = await consumeKind('audio');

        if (!okV && !okA) {
          setIsStreamAvailable(false);
          setStreamStatus('waiting');
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

    socket.on('producer-closed', async () => {
      setStreamStatus('ended');
      setIsStreamAvailable(false);

      const v = remoteVideoRef.current;
      if (v?.srcObject) {
        v.srcObject.getTracks().forEach((t) => t.stop());
        v.srcObject = null;
      }
      msRef.current = null;
      setSubtitle(null);

      try {
        const streamResp = await getStream(liveId);
        const s = streamResp?.data?.data || streamResp?.data || {};
        const record = s?.record || s?.srRecord;
        const raw = (s?.srStatus || s?.status || '').toString().toUpperCase();

        setServerEnded(raw === 'ENDED');

        if (raw === 'ENDED') {
          if (record) setVideoToVod(record);
          else { setIsStreamAvailable(false); setStreamStatus('ended'); }
        } else if (raw === 'LIVE' || raw === 'WAITING') {
          setIsStreamAvailable(false);
          setStreamStatus('waiting');
        } else {
          setIsStreamAvailable(false);
          setStreamStatus('waiting');
        }
      } catch (e) {
        console.warn('종료 후 VOD 전환 재조회 실패:', e);
      }
    });

    return () => {
      try { socket.disconnect(); } catch { }
      try { recvTransportRef.current?.close(); } catch { }

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
  }, [liveId, serverEnded, streamStatus]);

  /* =========================
     Mute 카운트다운
     ========================= */
  useEffect(() => {
    if (!isMuted || muteSecondsLeft <= 0) {
      if (isMuted) setIsMuted(false);
      return;
    }
    const timerId = setInterval(() => setMuteSecondsLeft((p) => p - 1), 1000);
    return () => clearInterval(timerId);
  }, [isMuted, muteSecondsLeft]);

  /* =========================
     최근 메시지 로드
     ========================= */
  useEffect(() => {
    if (!artistId) return;
    const fetchRecent = async () => {
      try {
        const res = await fetch(`${CHAT_API_BASE_URL}/rooms/${artistId}/messages`);
        if (res.ok) {
          const history = await res.json();
          setChatList(history.map((m) => ({
            id: `${m.createdAt ?? Date.now()}-${Math.random()}`,
            senderId: m.senderId ?? 0,
            nickname: m.nickname ?? '익명',
            text: m.content ?? '',
            type: m.contentType === 'SYSTEM' ? 'admin' : 'user',
            createdAt: m.createdAt,
          })));
        }
      } catch (e) {
        console.error('[Chat] 최근 메시지 로딩 실패:', e);
      }
    };
    fetchRecent();
  }, [artistId]);

  /* =========================
     Ban 상태 체크
     ========================= */
  useEffect(() => {
    if (myUserId && artistId) {
      const checkBanStatus = async () => {
        const url = `/chatapi/moderation/status?userId=${myUserId}&roomId=${artistId}`;
        try {
          const response = await fetch(url);
          if (!response.ok) return;
          const data = await response.json();
          if (data.isBanned) setIsBanned(true);
        } catch (error) {
          console.error('Ban status check error:', error);
        }
      };
      checkBanStatus();
    }
  }, [myUserId, artistId]);

  /* =========================
     유틸 & 핸들러
     ========================= */
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const formattedHours = hours % 12 || 12;
    return `${ampm} ${formattedHours}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleChatInput = (e) => setChatInput(e.target.value);

  const handleChatKeyDown = (e) => {
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
    stompRef.current.publish({
      destination: APP_SEND(artistId),
      body: JSON.stringify({ content: text }),
    });
    setChatInput('');
  };

  /* =========================
     스타일 (프로모션/상품 통일)
     ========================= */
  const styles = {
    section: { background: '#fff', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: 20, marginTop: 30 },
    title: { fontSize: 20, fontWeight: 800, color: '#222', margin: 0, paddingBottom: 12, borderBottom: '2px solid #eee', display: 'flex', alignItems: 'center', gap: 8 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18, paddingTop: 16 },
    card: { border: '1px solid #eee', borderRadius: 12, background: 'linear-gradient(180deg, #fafafa 0%, #fff 100%)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 0.18s ease, box-shadow 0.18s ease' },
    cardHover: { transform: 'translateY(-4px)', boxShadow: '0 6px 16px rgba(0,0,0,0.10)' },
    imgWrap: { width: '100%', height: 180, background: '#f2f2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    img: { width: '100%', height: '100%', objectFit: 'cover' },
    body: { padding: 14, display: 'flex', flexDirection: 'column', gap: 8 },
    name: { fontSize: 16, fontWeight: 700, color: '#222', lineHeight: 1.35 },
    desc: { fontSize: 13, color: '#666', lineHeight: 1.5, height: 38, overflow: 'hidden', textOverflow: 'ellipsis' },
    metaRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    price: { fontSize: 16, fontWeight: 800, color: '#111' },
    badge: { fontSize: 12, padding: '3px 8px', borderRadius: 999, background: '#eef2ff', color: '#4f46e5', fontWeight: 700 },
    actions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 14px 14px 14px' },
    btnOutline: { border: '1px solid #734ADE', background: 'transparent', color: '#734ADE', borderRadius: 10, fontWeight: 700, padding: '10px 12px', cursor: 'pointer' },
    btnFilled: { border: 'none', background: '#734ADE', color: '#fff', borderRadius: 10, fontWeight: 800, padding: '10px 12px', cursor: 'pointer' },
    promoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, paddingTop: 16 },
    promoImgWrap: { width: '100%', height: 220, background: '#f2f2ff' },
    vodRow: { marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
    btnBase: { border: 'none', borderRadius: 10, fontWeight: 800, padding: '10px 16px', cursor: 'pointer', transition: 'transform 0.12s ease, box-shadow 0.12s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    btnPrimary: { background: '#734ADE', color: '#fff' },
    btnGhost: { background: '#fff', color: '#734ADE', border: '1px solid #734ADE' },
    btnHover: { transform: 'translateY(-1px)', boxShadow: '0 6px 16px rgba(0,0,0,0.10)' },
  };

  /* =========================
     Render
     ========================= */
  if (isBanned) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f8f9fa' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚫 접근이 차단되었습니다 🚫</h2>
        <p style={{ fontSize: '1.2rem', color: '#6c757d', marginBottom: '2rem' }}>이 라이브에 대한 접근 권한이 없습니다.</p>
        <button
          onClick={() => navigate('/main')}
          style={{ padding: '10px 20px', fontSize: '1rem', color: '#fff', backgroundColor: '#007bff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          메인으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="live-page-container">
      {/* 헤더 */}
      <div className="live-page-header">
        <h2 className="live-page-artist">
          {streamInfo?.artistName || '아티스트'} <span style={{ color: '#7c4dff' }}>LIVE</span>
        </h2>
        <p className="live-page-desc">{streamInfo?.title || '방송 정보 로딩 중...'}</p>
      </div>

      {/* 영상 + 채팅 */}
      <div className="live-page-stream-section">
        <div className="live-page-video-wrapper" style={{ position: 'relative' }}>
          {showViewerBadge && (
            <div className="viewer-count-badge">👀 {viewerCount}명 접속 중</div>
          )}

          <video
            ref={remoteVideoRef}
            autoPlay={streamStatus !== 'vod'}
            muted={streamStatus !== 'vod'}
            controls={streamStatus === 'vod' ? false : undefined}
            playsInline
            className="live-page-video"
            onResize={(e) => console.log('[Video] resize', e.currentTarget.videoWidth, e.currentTarget.videoHeight)}
            onLoadedMetadata={(e) => { if (streamStatus !== 'vod') e.currentTarget.play?.().catch(() => { }); }}
            onLoadedData={(e) => { if (streamStatus !== 'vod') e.currentTarget.play?.().catch(() => { }); }}
            onCanPlay={(e) => { if (streamStatus !== 'vod') e.currentTarget.play?.().catch(() => { }); }}
            onPlay={() => setIsVodPlaying(true)}
            onPause={() => setIsVodPlaying(false)}
            onClick={(e) => {
              if (streamStatus !== 'vod') {
                const v = e.currentTarget;
                v.muted = true;
                v.play?.().catch(() => { });
              }
            }}
            style={{ cursor: 'pointer', width: '100%', minHeight: 320, background: '#000', objectFit: 'cover', borderRadius: 8 }}
          />

          {streamStatus === 'vod' && (
            <div style={{ ...styles.vodRow, marginTop: 10, borderTop: '1px solid #eee', paddingTop: 10 }}>
              <button
                onClick={isVodPlaying ? handleVodPause : handleVodPlay}
                onMouseEnter={(e) => { e.currentTarget.style.transform = styles.btnHover.transform; e.currentTarget.style.boxShadow = styles.btnHover.boxShadow; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                style={{ ...styles.btnBase, ...(isVodPlaying ? styles.btnGhost : styles.btnPrimary) }}
              >
                {isVodPlaying ? '⏸ 일시정지' : '▶ 재생'}
              </button>
            </div>
          )}

          {!isStreamAvailable && streamStatus === 'waiting' && !isVodMode && !serverEnded && (
            <p className="live-page-waiting">방송 시작을 기다리는 중...</p>
          )}
          {serverEnded && !isVodMode && (
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

        {/* 채팅 */}
        <div className="live-page-chat-section" style={{ height: '100%' }}>
          <div className="live-page-chat-title">실시간 채팅</div>
          <div className="live-page-chat-messages" ref={chatMessagesRef}>
            {chatList.map((msg) => {
              const isMine = myUserId && msg.senderId === myUserId && msg.type !== 'admin';
              const name =
                msg.type === 'admin'
                  ? '시스템'
                  : isMine
                    ? (msg.nickname || sender)
                    : (msg.nickname || '익명');
              const time = formatTime(msg.createdAt);

              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', margin: '5px 0' }}>
                  {isMine && (
                    <span style={{ alignSelf: 'flex-end', fontSize: '0.75rem', color: '#999', marginRight: 8 }}>
                      {time}
                    </span>
                  )}

                  <div className={msg.type === 'admin' ? 'live-page-chat-admin' : 'live-page-chat-user'} style={{ maxWidth: '70%' }}>
                    <span className="live-page-chat-sender" style={{ color: msg.type === 'admin' ? '#3b4fff' : '#222', fontWeight: 600 }}>
                      {name}:
                    </span>{' '}
                    <span className="live-page-chat-text">{msg.text}</span>
                  </div>

                  {!isMine && (
                    <span style={{ alignSelf: 'flex-end', fontSize: '0.75rem', color: '#999', marginLeft: 8 }}>
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
              placeholder={isMuted ? `${muteSecondsLeft}초 동안 채팅이 금지되었습니다.` : '메시지 보내기..'}
              value={chatInput}
              onChange={handleChatInput}
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={() => { composingRef.current = false; }}
              onKeyDown={handleChatKeyDown}
              disabled={isMuted}
            />
          </div>
        </div>
      </div>

      {/* 프로모션 */}
      <div style={styles.section}>
        <h3 style={styles.title}>🎁 프로모션 상품</h3>
        <div style={styles.promoGrid}>
          {promotion ? (
            <div
              style={styles.card}
              onMouseEnter={(e) => { e.currentTarget.style.transform = styles.cardHover.transform; e.currentTarget.style.boxShadow = styles.cardHover.boxShadow; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
            >
              <div style={{ ...styles.imgWrap, ...styles.promoImgWrap }}>
                <img src={promotion.img ? toGatewayUrl(promotion.img) : '/assets/img/placeholder/240.png'} alt={promotion.name} style={styles.img} />
              </div>
              <div style={styles.body}>
                <div style={styles.name}>{promotion.name}</div>
                <div style={styles.desc}>{promotion.description || '등록된 설명이 없습니다.'}</div>
                <div style={styles.metaRow}>
                  <span style={styles.badge}>재고 {promotion.stockQty ?? 0}개</span>
                  {promotion.fanOnly && <span style={styles.badge}>팬클럽 전용</span>}
                </div>
                {promotion.coupon && (
                  <div style={{ ...styles.metaRow, marginTop: 6 }}>
                    <span style={{ fontSize: 13, color: '#444' }}>쿠폰 코드</span>
                    <strong style={{ fontSize: 14, color: '#111' }}>{promotion.coupon}</strong>
                  </div>
                )}
              </div>
              <div style={styles.actions}>
                <button style={styles.btnOutline}>자세히 보기</button>
                <button style={styles.btnFilled}>구매하기</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 30, textAlign: 'center', color: '#777' }}>
              등록된 프로모션이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 라이브 상품 목록 */}
      <div style={styles.section}>
        <h3 style={styles.title}>🛒 라이브 상품 목록</h3>
        <div className="live-page-product-list" style={styles.grid}>
          {productDetails.length > 0 ? (
            productDetails.map((p) => (
              <div
                key={p.id}
                className="live-page-product-card live-page-product-card-wide"
                style={styles.card}
                onMouseEnter={(e) => { e.currentTarget.style.transform = styles.cardHover.transform; e.currentTarget.style.boxShadow = styles.cardHover.boxShadow; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
              >
                <div style={styles.imgWrap}>
                  <img src={p.img ? toGatewayUrl(p.img) : '/assets/img/placeholder/240.png'} alt={p.name} className="live-page-product-img" style={styles.img} />
                </div>

                <div className="live-page-product-info" style={styles.body}>
                  <div className="live-page-product-name" style={styles.name}>{p.name}</div>
                  {p.description && <div style={styles.desc}>{p.description}</div>}
                  <div style={styles.metaRow}>
                    <span style={styles.badge}>재고 {p.stockQty ?? 0}개</span>
                    {p.fanOnly && <span style={styles.badge}>팬클럽 전용</span>}
                  </div>
                </div>

                <div style={{ ...styles.metaRow, padding: '0 14px 10px 14px' }}>
                  <span className="live-page-product-price" style={styles.price}>₩{Number(p.price || 0).toLocaleString()}</span>
                </div>

                <div className="live-page-product-buttons-col" style={styles.actions}>
                  <button className="live-page-btn-cart live-page-btn-outline" style={styles.btnOutline}>장바구니</button>
                  <button className="live-page-btn-buy live-page-btn-filled" style={styles.btnFilled}>주문하기</button>
                </div>
              </div>
            ))
          ) : (
            <div className="live-page-product-empty" style={{ padding: 30, textAlign: 'center', color: '#777' }}>
              등록된 상품이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
