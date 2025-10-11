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
        // Spring REST
        '/api': { target: env.VITE_API_URL, changeOrigin: true },
        '/images': { target: env.VITE_API_URL, changeOrigin: true },
        '/ws': { target: env.VITE_CHAT_URL, changeOrigin: true, ws: true }, // Chat 서버
        '/chatapi': { target: env.VITE_CHAT_URL, changeOrigin: true }, // Chat 서버 API

        // mediasoup socket.io
        '/socket.io': {
          target: env.VITE_MEDIASOUP_HOST,
          changeOrigin: true,
          ws: true,
          secure: false,          // 로컬 self-signed 대비
        },
      },
    },
    define: { global: 'window' },
  });
};
