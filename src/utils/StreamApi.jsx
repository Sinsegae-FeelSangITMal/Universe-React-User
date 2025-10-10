import axios from "axios";

// 라이브 관련 공통 URL
const URL = `${import.meta.env.VITE_API_URL}/api/ent/streams`;

// 라이브 목록
export const getStreams = () => axios.get(URL);

// 라이브 한 건 가져오기
export const getStream = (streamId) => axios.get(`${URL}/${streamId}`);

// 라이브 등록
export const registStream = (fd) => axios.post(`${URL}`, fd);

// 라이브 수정
export const updateStream = (id, fd) => axios.put(`${URL}/${id}`, fd);

// 라이브 삭제
export const deleteStream = (streamId) => axios.delete(`${URL}/${streamId}`);

// 아티스트별 라이브 조회 (params 방식)
// export const getStreamsByArtist = (artistId) => axios.get(URL, { params: { artistId } });
export const getStreamsByArtist = (artistId, page = 0, size = 10) =>
    axios.get(`${URL}/artists/${artistId}/streams`, {
        params: { page, size },
    });