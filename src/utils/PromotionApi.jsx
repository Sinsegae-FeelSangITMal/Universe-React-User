// utils/PromotionApi.jsx
import axios from "axios";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/ent`;

// 아티스트별 프로모션 조회
export const getPromotionsByArtist = (artistId) => {
    return axios.get(`${BASE_URL}/artists/${artistId}/promotions`);
};

// 단일 프로모션 조회
export const getPromotion = (promotionId) => {
    return axios.get(`${BASE_URL}/promotions/${promotionId}`);
};

// 프로모션 등록
export const registPromotion = (formData) => {
    return axios.post(`${BASE_URL}/promotions`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

// 프로모션 수정
export const updatePromotion = (promotionId, formData) => {
    return axios.put(`${BASE_URL}/promotions/${promotionId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

// 프로모션 삭제
export const deletePromotion = (promotionId) => {
    return axios.delete(`${BASE_URL}/promotions/${promotionId}`);
};
