import axios from "axios";

// 아티스트 관련 공통 URL (판매자와 요청하는 목록이 같아서 ent로 요청)
const URL = `${import.meta.env.VITE_API_URL}/api/ent/artists`;

// 아티스트 목록 (판매자와 요청하는 목록이 같아서 ent로 요청)
export const getArtists = () => axios.get(URL);

// 아티스트 한 건 가져오기(URL{~~/artist/35}, get) (판매자와 요청하는 목록이 같아서 ent로 요청)
export const getArtist = (artistId) => axios.get(`${URL}/${artistId}`);