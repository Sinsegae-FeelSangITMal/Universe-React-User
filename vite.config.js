// Universe_React_User/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4444,
    open: true,
    proxy: {
      // Spring REST
      '/api': { target: 'http://localhost:7777', changeOrigin: true },
      '/images': { target: 'http://localhost:7777', changeOrigin: true },

      // STOMP/SockJS (실제 뜬 포트로 맞추세요: 7777 예시)
      '/ws': { target: 'http://localhost:7777', changeOrigin: true, ws: true },

      // mediasoup socket.io
      '/socket.io': { target: 'http://172.20.10.10:4000', changeOrigin: true, ws: true },
    },
  },
  define: { global: 'window' },
});
