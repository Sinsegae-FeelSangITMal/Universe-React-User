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
import { getCart, addCart } from '../../utils/CartApi';

/* =========================
   Quiet Logger (env-toggle + throttling)
   ========================= */
const VERBOSE = (import.meta.env.VITE_LOG_VERBOSE ?? 'false') === 'true';
const VIDEO_DEBUG = false; // 비디오 이벤트/리사이즈 로그를 보고 싶을 때만 true

const makeThrottled = (fn, intervalMs = 3000) => {
  let last = 0;
  return (...args) => {
    const now = performance.now();
    if (now - last >= intervalMs) {
      last = now;
      fn(...args);
    }
  };
};
const LOG = {
  info: (...a) => { if (VERBOSE) console.log('[LIVE]', ...a); },
  warn: (...a) => { if (VERBOSE) console.warn('[LIVE]', ...a); },
  error: (...a) => { if (VERBOSE) console.error('[LIVE]', ...a); },
  infoThrottled: makeThrottled((...a) => console.log('[LIVE]', ...a), 5000),
  warnThrottled: makeThrottled((...a) => console.warn('[LIVE]', ...a), 5000),
};

/* =========================
   Endpoints (게이트웨이 기준)
   ========================= */
const _resolveBase = (v, fallback = '') => {
  if (!v) return fallback;
  if (String(v).toLowerCase() === 'same-origin') return '';
  return v;
};

const SERVER_URL = _resolveBase(import.meta.env.VITE_MEDIASOUP_HOST, '');
const SOCKET_PATH_RAW = import.meta.env.VITE_MEDIASOUP_PATH || '/socket.io';
const SOCKET_PATH = SOCKET_PATH_RAW.startsWith('/') ? SOCKET_PATH_RAW : `/${SOCKET_PATH_RAW}`;
const CHAT_API_BASE_URL = '/chatapi';
const MAIN_API_URL = '/api';
const CHAT_WS_URL = '/ws';

LOG.info('ENV', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_MEDIASOUP_HOST: import.meta.env.VITE_MEDIASOUP_HOST,
  SERVER_URL,
  SOCKET_PATH,
  CHAT_API_BASE_URL,
  CHAT_WS_URL,
});

const toGatewayUrl = (p) => {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  const base = import.meta.env.VITE_API_URL || '';
  return `${base}${p}`;
};

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
  const msRef = useRef(null);

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
  const [vodError, setVodError] = useState(false); // VOD 파일 접근 실패 시 표시

  const [streamInfo, setStreamInfo] = useState(null);
  const [promotion, setPromotion] = useState(null);
  const [productDetails, setProductDetails] = useState([]);

  const [cart, setCart] = useState(null);

  /* 최신 status ref */
  const statusRef = useRef(streamStatus);
  useEffect(() => { statusRef.current = streamStatus; }, [streamStatus]);

  const isVodMode = streamStatus === 'vod';
  const showViewerBadge = streamStatus === 'streaming' && isStreamAvailable;

  const myUserId = user?.userId || 0;
  const sender = user?.nickname || '나';


  // 장바구니 담기
  const handleAddCart = async (id) => {
    try {
      const res = await addCart(myUserId, id, 1);
      if (res.data.success) {
        toast.success("장바구니에 담았습니다!");
        // 장바구니 상태 최신화
        getCart(myUserId).then(res => setCart(res.data?.data || []));
      } else {
        toast.error(res.data.message || "장바구니 담기 실패");
      }
    } catch (e) {
      console.error("장바구니 추가 실패:", e.response);
      toast.error(e.response?.data?.message || "오류가 발생했습니다.");
    }
  };

  /* =========================
     VOD 전환 & 재생 컨트롤
     ========================= */
  const setVideoToVod = async (recordPath) => {
    LOG.info('VOD▶ setVideoToVod', { recordPath });
    const videoEl = remoteVideoRef.current;
    if (!videoEl) return;

    if (videoEl.srcObject) {
      try { videoEl.srcObject.getTracks?.().forEach((t) => t.stop?.()); } catch { }
      videoEl.srcObject = null;
    }
    // 기본값 세팅
    videoEl.crossOrigin = 'anonymous';
    videoEl.controls = false;
    videoEl.muted = false;
    videoEl.playsInline = true;

    // 1) 경로 자체가 없으면 바로 오류 표시
    const url = toGatewayUrl(recordPath || '');
    if (!recordPath) {
      setVodError(true);
      setIsVodPlaying(false);
      setIsStreamAvailable(false);
      setStreamStatus('vod');
      LOG.warn('VOD✖ no record path');
      return;
    }

    // 2) 사전 HEAD 체크 (CORS 허용 시)
    try {
      const head = await fetch(url, { method: 'HEAD' });
      if (!head.ok) throw new Error(`HEAD ${head.status}`);
    } catch (e) {
      LOG.warn('VOD✖ HEAD check failed', e);
      // HEAD 실패해도 바로 포기하지 않고, 비디오 onerror에서 한 번 더 확인
    }

    // 3) 소스 지정 + 강제 pause (절대 자동재생 금지)
    videoEl.src = url;
    try { videoEl.load(); } catch { }
    try { videoEl.pause(); } catch { }
    setVodError(false);
    setIsVodPlaying(false);
    setIsStreamAvailable(true);
    setStreamStatus('vod'); // ← 이 시점 이후로는 statusRef도 vod가 되어 자동재생 로직이 전부 무시됨
    LOG.info('STATUS vod (source set)');
    // 4) 로드 실패 시 에러 표시
    const onErr = () => {
      LOG.error('VOD✖ media error');
      setVodError(true);
      setIsVodPlaying(false);
      setIsStreamAvailable(false);
    };
    videoEl.addEventListener('error', onErr, { once: true });
  };

  const handleVodPlay = async () => {
    const v = remoteVideoRef.current;
    if (!v) return;
    try {
      v.muted = false;
      await v.play();
      setIsVodPlaying(true);
      LOG.info('VOD✔ play');
    } catch (e) {
      LOG.error('VOD✖ play', e);
      toast.error('재생할 수 없습니다.');
    }
  };

  const handleVodPause = () => {
    const v = remoteVideoRef.current;
    if (!v) return;
    try { v.pause(); LOG.info('VOD⏸ pause'); } finally { setIsVodPlaying(false); }
  };

  /* =========================
     초기 비디오 MediaStream 장착 + 이벤트 로그 (옵션)
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

    const logEv = (ev) => {
      if (VERBOSE && VIDEO_DEBUG) LOG.info(`VIDEO ${ev.type}`, { readyState: v.readyState, src: v.src });
    };

    if (VERBOSE && VIDEO_DEBUG) {
      ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'play', 'pause', 'waiting', 'stalled', 'suspend', 'emptied', 'error']
        .forEach((name) => v.addEventListener(name, logEv));
    }

    if (statusRef.current !== 'vod') {
      const p = v.play?.();
      if (p && p.catch) p.catch(() => { });
    }

    return () => {
      if (VERBOSE && VIDEO_DEBUG) {
        ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'play', 'pause', 'waiting', 'stalled', 'suspend', 'emptied', 'error']
          .forEach((name) => v.removeEventListener(name, logEv));
      }
    };
  }, []);

  /* =========================
     트랙 부착
     ========================= */
  const tryPlay = (video) => {
    if (!video) return;
    if (statusRef.current === 'vod') return; // VOD에서는 자동재생 금지
    video.muted = true;
    video.playsInline = true;
    const p = video.play?.();
    if (p && p.catch) p.catch(() => { });
  };

  const attachTrack = (track, kind) => {
    LOG.info(`TRACK▶ attach ${kind}`, { id: track?.id, muted: track?.muted });
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

    if (video.srcObject !== ms) video.srcObject = ms;

    const kick = () => {
      if (statusRef.current !== 'vod') {
        setIsStreamAvailable(true);
        setStreamStatus('streaming');
      }
      if (statusRef.current !== 'vod') {
        const p = video.play?.();
        if (p && p.catch) p.catch(() => { });
      }
    };

    if (track.muted) {
      try { track.addEventListener('unmute', kick, { once: true }); } catch { }
    } else {
      kick();
    }

    const onReady = () => {
      if (statusRef.current !== 'vod') {
        setIsStreamAvailable(true);
        setStreamStatus('streaming');
      }
      kick();
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('canplay', onReady);
    };
    video.addEventListener('loadeddata', onReady);
    video.addEventListener('canplay', onReady);

    try {
      if ('requestVideoFrameCallback' in video) {
        // @ts-ignore
        video.requestVideoFrameCallback(() => kick());
      }
    } catch { }
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
    LOG.info('AUDIO✔ attached');
  };

  /* =========================
     채팅 스크롤
     ========================= */
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatList]);

  /* =========================
     데이터 로딩
     ========================= */
  useEffect(() => {
    const fetchData = async () => {
      LOG.info('API▶ getStream', { liveId: String(liveId) });
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
        LOG.info('API✔ getStream', normalized);
        setStreamInfo(normalized);

        const raw = normalized.status;
        setServerEnded(raw === 'ENDED');

        if (raw === 'ENDED' || raw === 'END' || raw === 'COMPLETED') {
          if (normalized.record) await setVideoToVod(normalized.record);
          else { setIsStreamAvailable(false); setStreamStatus('ended'); LOG.info('STATUS ended (no record)'); }
        } else if (raw === 'LIVE' || raw === 'WAITING') {
          setIsStreamAvailable(false);
          setStreamStatus('waiting');
          LOG.info('STATUS init -> waiting');
        } else {
          setIsStreamAvailable(false);
          setStreamStatus('ended');
          LOG.warn('STATUS ended (unknown raw)');
        }

        const promoId = s?.promotionId ?? s?.promotion_id ?? s?.PR_ID;
        if (promoId) {
          const pr = await getPromotion(promoId);
          const d = pr?.data?.data || pr?.data || {};
          setPromotion({ ...d });
        } else {
          setPromotion(null);
        }

        LOG.info('API▶ getStreamProductsByStream', { liveId: String(liveId) });
        const spResp = await getStreamProductsByStream(liveId);
        const spList = Array.isArray(spResp?.data?.data) ? spResp.data.data : [];
        setProductDetails(spList.map((sp) => ({ ...(sp.product || {}) })));
        LOG.info('API✔ getStreamProductsByStream', spList);
      } catch (err) {
        LOG.error('API✖ getStream', err);
        setStreamInfo((prev) => prev ?? { title: '', artistName: '' });
        setStreamStatus('ended');
      }
    };
    if (liveId) fetchData();
  }, [liveId]);

  /* =========================
   STOMP 채팅 (토큰 자동 복구 포함)
   ========================= */
  useEffect(() => {
    if (!accessToken) return;

    const getAccessToken = () => useAuthStore.getState().accessToken;

    const client = new StompClient({
      webSocketFactory: () => new SockJS(CHAT_WS_URL, null, { withCredentials: true }),
      connectHeaders: { Authorization: `Bearer ${getAccessToken()}` },
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      reconnectDelay: 4000,
      onConnect: () => {
        LOG.info('CHAT✔ connected');

        client.subscribe(TOPIC_SUBSCRIBE(liveId), (f) => {
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
      onStompError: (frame) => {
        const msg = frame?.headers?.message || '';
        LOG.error('CHAT✖ Broker error', msg, frame?.body);
        if (msg.includes('INVALID_TOKEN')) {
          try {
            client.deactivate().then(() => {
              client.connectHeaders = { Authorization: `Bearer ${getAccessToken()}` };
              client.activate();
            });
          } catch { }
        }
      },
      onWebSocketError: (evt) => LOG.error('CHAT✖ WebSocket error', evt),
      onWebSocketClose: (evt) => LOG.warnThrottled('CHAT⚠ WebSocket closed', evt?.code, evt?.reason),
    });

    client.activate();
    stompRef.current = client;

    return () => {
      try { client.deactivate(); } catch { }
      stompRef.current = null;
    };
  }, [liveId, accessToken, myUserId]);

  /* =========================
   자막 STOMP (Authorization 포함)
   ========================= */
  useEffect(() => {
    if (!liveId) return;

    LOG.info('[Subtitle] Opening Web Socket...');
    const getAccessToken = () => useAuthStore.getState().accessToken;

    const sock = new SockJS('/ws-subtitle', null, { withCredentials: true });
    const subtitleClient = new StompClient({
      webSocketFactory: () => sock,
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: { Authorization: `Bearer ${getAccessToken()}` },
      onConnect: () => {
        subtitleClient.subscribe(`/topic/subtitles/${liveId}`, (frame) => {
          try {
            const payload = JSON.parse(frame.body);
            LOG.info('SUBTITLE rx', payload);
            setSubtitle(payload);
            if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
            subtitleTimerRef.current = setTimeout(() => setSubtitle(null), 6000);
          } catch (err) {
            LOG.error('SUBTITLE parse✖', err);
          }
        });
      },
      onStompError: (frame) => {
        const msg = frame?.headers?.message || '';
        LOG.error('[Subtitle] Broker error', msg, frame?.body);
        if (msg.includes('INVALID_TOKEN')) {
          try {
            subtitleClient.deactivate().then(() => {
              subtitleClient.connectHeaders = { Authorization: `Bearer ${getAccessToken()}` };
              subtitleClient.activate();
            });
          } catch { }
        }
      },
      onWebSocketError: (evt) => LOG.error('[Subtitle] WebSocket error', evt),
      onWebSocketClose: (evt) => LOG.warnThrottled('[Subtitle] WebSocket closed', evt?.code, evt?.reason),
    });

    subtitleClient.activate();
    return () => { try { subtitleClient.deactivate(); } catch { }; };
  }, [liveId]);

  /* =========================
     Mediasoup 시청자 연결
     ========================= */
  useEffect(() => {
    if (!liveId) return;
    if (initOnceRef.current) return;
    initOnceRef.current = true;

    LOG.info('BOOT', { liveId: String(liveId), serverEnded, streamStatus });

    const socket = io(SERVER_URL || undefined, {
      path: SOCKET_PATH,
      transports: ['websocket'],
      withCredentials: true,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 800,
      query: { role: 'viewer', streamId: String(liveId), liveId: String(liveId) },
    });

    socketRef.current = socket;

    // 모든 이벤트 로깅 (ping/pong 제외) → 스로틀 + VERBOSE 조건
    socket.onAny((event, ...args) => {
      if (!VERBOSE) return;
      if (event === 'ping' || event === 'pong') return;
      LOG.infoThrottled(`SOCK rx ${event}`, ...(args?.length ? args : []));
    });

    socket.on('connect', () => {
      LOG.info('SOCK✔ connect', { id: socket.id, url: SERVER_URL || '(same-origin)', path: SOCKET_PATH });
      const joinPayload = { streamId: String(liveId), liveId: String(liveId) };
      LOG.info('EMIT▶ join-live', joinPayload);
      socket.emit('join-live', joinPayload, (ack) => {
        LOG.info('ACK✔ join-live', ack);
      });
    });

    socket.on('disconnect', (reason) => LOG.warnThrottled('SOCK⚠ disconnect', reason));
    socket.on('connect_error', (e) => LOG.error('SOCK✖ connect_error', e?.message || e));
    socket.io.on('reconnect_attempt', (n) => LOG.info('SOCK… reconnect_attempt', n));
    socket.io.on('reconnect_error', (e) => LOG.warnThrottled('SOCK⚠ reconnect_error', e?.message || e));
    socket.io.on('reconnect_failed', () => LOG.error('SOCK✖ reconnect_failed'));
    socket.on('error', (e) => LOG.error('SOCK✖ error', e));
    socket.on('viewer-count', (count) => { LOG.info('viewer-count', count); setViewerCount(count); });

    // Subtitle proxy events over socket.io
    const handleSubtitleEvent = (data) => {
      try {
        let payload = data;
        if (typeof data === 'string') payload = { original: data };
        if (payload.liveId && String(payload.liveId) !== String(liveId)) return;
        LOG.info('SUBTITLE(socket.io) rx', payload);

        const incoming = payload.subtitle || payload;
        const normalized = typeof incoming === 'string' ? { original: incoming } : incoming;

        if (normalized?.original) {
          setSubtitle(normalized);
          if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
          subtitleTimerRef.current = setTimeout(() => setSubtitle(null), 6000);
        }
      } catch (err) {
        LOG.error('SUBTITLE(socket.io) parse✖', err);
      }
    };
    socket.on('subtitle', handleSubtitleEvent);
    socket.on('subtitle-update', handleSubtitleEvent);

    // --- mediasoup setup ---
    const setupMediasoup = async () => {
      try {
        LOG.info('MS▶ getRouterRtpCapabilities');
        const routerRtpCapabilities = await new Promise((r) =>
          socket.emit('getRouterRtpCapabilities', (resp) => { LOG.info('ACK✔ getRouterRtpCapabilities', resp); r(resp); })
        );

        const device = new mediasoupClient.Device();
        await device.load({ routerRtpCapabilities });
        deviceRef.current = device;
        LOG.info('MS✔ Device.load', { rtpCapabilities: device.rtpCapabilities });

        LOG.info('MS▶ createWebRtcTransport', { sending: false });
        const transportParams = await new Promise((r) =>
          socket.emit('createWebRtcTransport', { sending: false }, (resp) => { LOG.info('ACK✔ createWebRtcTransport', resp); r(resp); })
        );

        const transport = device.createRecvTransport(transportParams);
        recvTransportRef.current = transport;
        LOG.info('MS✔ recvTransport created', { id: transport.id });

        transport.on('connect', ({ dtlsParameters }, callback, errback) => {
          LOG.info('MS▶ connectTransport');
          socket.emit('connectTransport', { dtlsParameters }, (error) => {
            if (error) { LOG.error('ACK✖ connectTransport', error); errback(new Error(error)); }
            else { LOG.info('ACK✔ connectTransport'); callback(); }
          });
        });

        const consumeKind = async (kind) => {
          try {
            const { rtpCapabilities } = deviceRef.current || {};
            LOG.info(`MS▶ consume(${kind})`);
            const params = await new Promise((r) =>
              socket.emit('consume', { rtpCapabilities, kind, streamId: String(liveId) }, (resp) => { LOG.info(`ACK✔ consume(${kind})`, resp); r(resp); })
            );

            if (!params || params?.error) {
              LOG.warn(`MS⚠ consume(${kind}) no-params`, params);
              if (!serverEnded && statusRef.current !== 'ended' && statusRef.current !== 'vod') {
                setIsStreamAvailable(false);
                setStreamStatus('waiting');
              }
              return false;
            }

            const consumer = await recvTransportRef.current.consume(params);
            LOG.info(`MS✔ consumer(${kind})`, { id: consumer.id, trackId: consumer.track?.id });
            const track = consumer.track;

            const attachNow = async () => {
              attachTrack(track, kind);
              try { await consumer.resume(); LOG.info(`MS✔ resume(${kind})`); } catch (e) { LOG.warn(`MS⚠ resume(${kind})`, e); }
              try { await consumer.requestKeyFrame?.(); LOG.info(`MS✔ keyframe(${kind})`); } catch { }
              socket.emit('resume-consumer', { consumerId: consumer.id }, (ack) => LOG.info('ACK✔ resume-consumer', ack));
            };

            if (track.muted) {
              try { track.addEventListener?.('unmute', () => { void attachNow(); }, { once: true }); } catch { }
            } else {
              void attachNow();
            }
            return true;
          } catch (err) {
            LOG.error(`MS✖ consume(${kind})`, err);
            return false;
          }
        };

        const okV = await consumeKind('video');
        const okA = await consumeKind('audio');

        if (!okV && !okA) {
          setIsStreamAvailable(false);
          setStreamStatus('waiting');
          LOG.warn('STATUS waiting (no consumer ready)');
          socket.once('new-producer', async () => {
            LOG.info('MS evt new-producer -> retry consume');
            const vv = await consumeKind('video');
            const aa = await consumeKind('audio');
            if (vv || aa) {
              setIsStreamAvailable(true);
              setStreamStatus('streaming');
              LOG.info('STATUS streaming (after new-producer)');
              tryPlay(remoteVideoRef.current);
            }
          });
        } else {
          setIsStreamAvailable(true);
          setStreamStatus('streaming');
          LOG.info('STATUS streaming (consumer ready)');
          tryPlay(remoteVideoRef.current);
        }
      } catch (error) {
        LOG.error('MS✖ setup', error);
      }
    };

    socket.on('connect', setupMediasoup);

    socket.on('producer-closed', async () => {
      LOG.warn('MS evt producer-closed -> teardown + recheck');
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
          if (record) await setVideoToVod(record);
          else { setIsStreamAvailable(false); setStreamStatus('ended'); LOG.info('STATUS ended (producer closed, no record)'); }
        } else if (raw === 'LIVE' || raw === 'WAITING') {
          setIsStreamAvailable(false);
          setStreamStatus('waiting');
          LOG.info('STATUS waiting (producer closed, still live/waiting)');
        } else {
          setIsStreamAvailable(false);
          setStreamStatus('waiting');
          LOG.warn('STATUS waiting (producer closed, unknown raw)');
        }
      } catch (e) {
        LOG.warn('MS recheck after producer-closed✖', e);
      }
    });

    return () => {
      LOG.info('CLEANUP', 'disconnect socket & close transport');
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
  }, [liveId]);

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
    if (!liveId) return;
    const fetchRecent = async () => {
      try {
        const res = await fetch(`${CHAT_API_BASE_URL}/rooms/${liveId}/messages`);
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
          LOG.info('CHAT history✔', { count: history.length });
        } else {
          LOG.warn('CHAT history⚠ non-200', res.status);
        }
      } catch (e) {
        LOG.error('CHAT history✖', e);
      }
    };
    fetchRecent();
  }, [liveId]);

  /* =========================
     Ban 상태 체크
     ========================= */
  useEffect(() => {
    if (myUserId && liveId) {
      const checkBanStatus = async () => {
        const url = `/chatapi/moderation/status?userId=${myUserId}&roomId=${liveId}`;
        try {
          const response = await fetch(url);
          if (!response.ok) return;
          const data = await response.json();
          if (data.isBanned) setIsBanned(true);
          LOG.info('CHAT moderation status', data);
        } catch (error) {
          LOG.error('Ban status check✖', error);
        }
      };
      checkBanStatus();
    }
  }, [myUserId, liveId]);

  /* =========================
     핸들러
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
      destination: APP_SEND(liveId),
      body: JSON.stringify({ content: text }),
    });
    setChatInput('');
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

          {streamStatus === 'vod' && vodError ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 320, background: '#000', color: '#fff', borderRadius: 8 }}>
              영상을 호출할 수 없습니다.
            </div>
          ) : (
            <video
              ref={remoteVideoRef}
              autoPlay={streamStatus !== 'vod'}
              muted={streamStatus !== 'vod'}
              controls={streamStatus === 'vod' ? false : undefined}
              playsInline
              className="live-page-video"
              onLoadedMetadata={(e) => { if (statusRef.current !== 'vod') e.currentTarget.play?.().catch(() => { }); }}
              onLoadedData={(e) => { if (statusRef.current !== 'vod') e.currentTarget.play?.().catch(() => { }); }}
              onCanPlay={(e) => { if (statusRef.current !== 'vod') e.currentTarget.play?.().catch(() => { }); }}
              onPlay={() => setIsVodPlaying(true)}
              onPause={() => setIsVodPlaying(false)}
              onClick={(e) => {
                if (statusRef.current !== 'vod') {
                  const v = e.currentTarget;
                  v.muted = true;
                  v.play?.().catch(() => { });
                }
              }}
              style={{ cursor: 'pointer', width: '100%', minHeight: 320, background: '#000', objectFit: 'cover', borderRadius: 8 }}
            />
          )}

          {streamStatus === 'vod' && !vodError && (
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
                <img src="/assets/img/dummyImg/bts_promotion1.jpg" alt={promotion.name} style={styles.img} />
              </div>
              <div style={styles.body}>
                <div style={styles.name}>{promotion.name}</div>
                <div style={styles.desc}>{promotion.description || '등록된 설명이 없습니다.'}</div>
                <div style={styles.metaRow}>
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
                <button
                  style={styles.btnFilled}
                  onClick={() => handleAddCart(promotion.id)}
                >장바구니</button>
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
                    {p.fanOnly && <span style={styles.badge}>팬클럽 전용</span>}
                  </div>
                </div>

                <div style={{ ...styles.metaRow, padding: '0 14px 10px 14px' }}>
                  <span className="live-page-product-price" style={styles.price}>₩{Number(p.price || 0).toLocaleString()}</span>
                </div>

                <div className="live-page-product-buttons-col" style={styles.actions}>
                  <button
                    className="live-page-btn-cart live-page-btn-outline"
                    style={styles.btnOutline}
                    onClick={() => handleAddCart(p.id)}
                  >장바구니</button>
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
