import apiClient from './apiClient';

const URL = "/api/carts";

// 로그인한 유저의 장바구니 목록 요청
export const getCart = (userId) => apiClient.get(`${URL}/${userId}`);

// 장바구니 추가 요청
export const addCart = (userId, productId, qty) => apiClient.post(`${URL}`, { userId, productId, qty });

// 장바구니 수정 요청
export const updateCart = (cartId, qty) => apiClient.put(`${URL}/${cartId}`, { qty });

// 장바구니 삭제 요청
export const delCart = (cartId) => apiClient.delete(`${URL}/${cartId}`);