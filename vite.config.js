import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default ({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  return defineConfig({
    plugins: [react()],
    server: {
      port: 4444,
      open: true,
      proxy: {

        '/api': { target: env.VITE_API_URL, changeOrigin: true },
        '/images': { target: env.VITE_API_URL, changeOrigin: true },

        '/ws': { target: env.VITE_CHAT_URL, changeOrigin: true, ws: true },
        '/chatapi': { target: env.VITE_CHAT_URL, changeOrigin: true },
        '/ws-subtitle': { target: env.VITE_LIVE_URL, changeOrigin: true, ws: true, secure: false },
        '/socket.io': { target: env.VITE_MEDIASOUP_HOST, changeOrigin: true, ws: true },

        // 🔹 자막 WebSocket (Spring Live 서비스, 8080)
        // '/ws-subtitle'로 시작하는 모든 요청을 target으로 전달
        '/ws-subtitle': {
          target: env.VITE_LIVE_URL,
          changeOrigin: true,
          ws: true,
          secure: false,
        },

        // --- mediasoup (4000)
        '/socket.io': {
          target: env.VITE_MEDIASOUP_HOST,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    define: { global: 'window' },
  });
};
