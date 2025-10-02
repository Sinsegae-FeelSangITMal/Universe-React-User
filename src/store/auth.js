//전역 상태 관리 - 로그인 관련
import { create } from "zustand";
import { persist } from "zustand/middleware";

// const { user } = useAuthStore();
/**
  {
       userId: 40,
       nickname: 'import해라제발', 
       roleName: 'USER', 
       email: 'o1357dd@gmail.com'
   }
 */


export const useAuthStore = create(
    persist(
        (set) => ({
            accessToken: null,
            isLogin: false,
            user: null,
            login: (token) => set({ accessToken: token, isLogin: true}),
            logout: () => set({ accessToken: null, isLogin: false, user: null }),
            setUser: (user) => set({ user }), 
        }),
        {
            name: "auth-storage"
        }
    )
);