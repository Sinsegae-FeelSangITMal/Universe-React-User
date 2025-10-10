import axios from "axios";

const URL = `${import.meta.env.VITE_API_URL}/api/memberships`;

// 멤버십 목록 조회
export const getMembership = (userId) => axios.get(`${URL}/${userId}`);