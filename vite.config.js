// vite.config.js (유저페이지)
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
  // .env 파일 로드
  const env = loadEnv(mode, process.cwd(), '');

  const mediasoupTarget =
    (env.VITE_MEDIASOUP_HOST || '').toLowerCase() === 'same-origin'
      ? env.VITE_API_URL
      : env.VITE_MEDIASOUP_HOST;

  return defineConfig({
    plugins: [react()],
    server: {
      port: 4444,
      open: true,
      proxy: {
        '/api/live/subtitle': {
          target: env.VITE_LIVE_URL,
          changeOrigin: true,
          proxyTimeout: 120000,
          timeout: 120000,
        },
        '/api': { target: env.VITE_API_URL, changeOrigin: true, proxyTimeout: 120000, timeout: 120000 },
        '/images': { target: env.VITE_API_URL, changeOrigin: true, proxyTimeout: 120000, timeout: 120000 },

        '/ws': { target: env.VITE_CHAT_URL, changeOrigin: true, ws: true, secure: false, proxyTimeout: 120000, timeout: 120000 },
        '/chatapi': { target: env.VITE_CHAT_URL, changeOrigin: true, proxyTimeout: 120000, timeout: 120000 },

        // ★ 자막 WS (WebSocket)
        '/ws-subtitle': {
          target: env.VITE_LIVE_URL,
          changeOrigin: true,
          ws: true,              // ← 추가! WebSocket 업그레이드용
          secure: false,
          proxyTimeout: 120000,
          timeout: 120000,
        },

        // mediasoup
        '/socket.io': {
          target: mediasoupTarget,
          changeOrigin: true,
          ws: true,
          secure: false,
          proxyTimeout: 120000,
          timeout: 120000,
        },

        '/recording': { target: env.VITE_API_URL, changeOrigin: true, proxyTimeout: 120000, timeout: 120000 },
        '/Recording': { target: env.VITE_API_URL, changeOrigin: true, proxyTimeout: 120000, timeout: 120000 },
      },
    },
    define: { global: 'window' },
  });
};
