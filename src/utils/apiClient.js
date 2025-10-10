import axios from 'axios';
import { useAuthStore } from '../store/auth';

const apiClient = axios.create({
  baseURL: '/', // Vite proxy를 통해 게이트웨이로 요청
});

// 요청 인터셉터 (Request Interceptor)
apiClient.interceptors.request.use(
  (config) => {
    // Zustand 스토어에서 직접 토큰 상태를 가져옴
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
