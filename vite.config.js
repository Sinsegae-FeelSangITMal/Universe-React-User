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
        '/socket.io': { target: 'http://localhost:8000', ws: true, changeOrigin: true },
        '/ws': { target: 'http://localhost:8000', ws: true, changeOrigin: true },
        '/ws-subtitle': { target: 'http://localhost:8000', ws: true, changeOrigin: true },
        '/chatapi': { target: 'http://localhost:8000', changeOrigin: true },
        '/api': { target: 'http://localhost:8000', changeOrigin: true },
        '/images': { target: 'http://localhost:8000', changeOrigin: true },
        '/recording': { target: 'http://localhost:8000', changeOrigin: true },
      },
    },
    define: { global: 'window' },
  });
};
