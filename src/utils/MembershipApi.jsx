import axios from "axios";

const URL = "http://localhost:7777/api/memberships";

// 멤버십 목록 조회
export const getMembership = (userId) => axios.get(`${URL}/${userId}`);