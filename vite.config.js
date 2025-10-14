// vite.config.js (핵심만)
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
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
          // (선택) 백엔드가 정확한 Origin을 요구할 때:
          // headers: { Origin: 'http://localhost:4444' },
          proxyTimeout: 120000,  // ← HTTP 타임아웃 업
          timeout: 120000,
        },
        '/api': { target: env.VITE_API_URL, changeOrigin: true, proxyTimeout: 120000, timeout: 120000 },
        '/images': { target: env.VITE_API_URL, changeOrigin: true, proxyTimeout: 120000, timeout: 120000 },

        '/ws': { target: env.VITE_CHAT_URL, changeOrigin: true, ws: true, secure: false, proxyTimeout: 120000, timeout: 120000 },
        '/chatapi': { target: env.VITE_CHAT_URL, changeOrigin: true, proxyTimeout: 120000, timeout: 120000 },

        // ★ 자막 WS (WS 업그레이드 + 타임아웃 늘리기)
        '/ws-subtitle': {
          target: env.VITE_LIVE_URL,
          changeOrigin: true,
          secure: false,
          proxyTimeout: 120000, // ← 중요
          ws: true,
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
