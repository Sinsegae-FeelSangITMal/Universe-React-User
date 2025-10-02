import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4444, // 프론트 개발 서버 포트
    open: true,
    proxy: {
      '/api':    { target: 'http://localhost:7777', changeOrigin: true }, // Universe API
      '/images': { target: 'http://localhost:7777', changeOrigin: true },
      '/ws':     { target: 'http://localhost:8888', changeOrigin: true, ws: true }, // Chat 서버
    },
  },
  define: {
    global: 'window',
  },
})
