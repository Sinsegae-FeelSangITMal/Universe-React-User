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
      '/ws':     { target: 'http://localhost:8888', changeOrigin: true, ws: true }, // Chat 서버
      '/chatapi':     { target: 'http://localhost:8888', changeOrigin: true}, // Chat 서버 API

      // mediasoup socket.io
      '/socket.io': { target: 'http://172.20.10.10:4000', changeOrigin: true, ws: true },
    },
  },
  define: { global: 'window' },
});
