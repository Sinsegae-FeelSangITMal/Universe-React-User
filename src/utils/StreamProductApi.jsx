import axios from "axios";

const URL = "http://localhost:7777/api/ent/stream-products"; // 필요 시 환경변수로 분리

// 전체 조회
export const getStreamProducts = async () => {
    return await axios.get(URL);
};

// 단일 조회
export const getStreamProduct = async (id) => {
    return await axios.get(`${URL}/${id}`);
};

// 특정 라이브에 연결된 상품 조회
export const getStreamProductsByStream = async (streamId) => {
    return await axios.get(`${URL}?streamId=${streamId}`);
};

// 등록
export const registStreamProduct = async (streamProduct) => {
    return await axios.post(URL, streamProduct);
};

// 수정
export const updateStreamProduct = async (id, streamProduct) => {
    return await axios.put(`${URL}/${id}`, streamProduct);
};

// 삭제
export const deleteStreamProduct = async (id) => {
    return await axios.delete(`${URL}/${id}`);
};

//  특정 Stream에 연결된 모든 StreamProduct 삭제
export const deleteStreamProducts = (streamId) => {
    return axios.delete(`${URL}/by-stream/${streamId}`);
};