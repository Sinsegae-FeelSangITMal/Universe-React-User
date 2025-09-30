import axios from "axios";

const URL = "http://localhost:7777/api/orders";

// 주문서 보내기
export const submitOrder = (data) => axios.post(`${URL}`, data);

// 주문 상세 목록 요청
export const getOrderDetail = (orderId) => axios.get(`${URL}/${orderId}`);