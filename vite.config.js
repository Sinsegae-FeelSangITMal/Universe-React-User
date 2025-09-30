import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4444, // 기본 포트 변경
    open: true,  // 브라우저 자동 실행 옵션 (원하면)
    proxy: {
      '/api':    { target: 'http://localhost:7777', changeOrigin: true },
      '/images': { target: 'http://localhost:7777', changeOrigin: true },
    },
  },
  define: {
    global: 'window',
  },
})
