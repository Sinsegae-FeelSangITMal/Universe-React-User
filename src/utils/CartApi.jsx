import axios from "axios";

const URL = "http://localhost:7777/api/carts";

// 로그인한 유저의 장바구니 목록 요청
export const getCart = (userId) => axios.get(`${URL}/${userId}`);

// 장바구니 추가 요청
export const addCart = (userId, productId, qty) => axios.post(`${URL}`, { userId, productId, qty });

// 장바구니 수정 요청
export const updateCart = (cartId, qty) => axios.put(`${URL}/${cartId}`, { qty });

// 장바구니 삭제 요청
export const delCart = (cartId) => axios.delete(`${URL}/${cartId}`);