import axios from "axios";

const BASE_URL = "http://localhost:7777/api";
axios.defaults.baseURL = "/api"; // 프록시

export const getProductDetail = (id) => axios.get(`/ent/products/${id}`);

export const getNewProducts = (params = {}) => axios.get(`/products/new`, { params });

export const getProductList = (id, params = {}) => axios.get(`/products/${id}`, { params });

// 하나의 상품 조회
export const getProduct = (id) => axios.get(`/ent/products/${id}`);

// 전체 상품 조회
export const getProducts = (params = {}) => axios.get(`/ent/products`, { params });

// 상품 등록
export const registProduct = (fd) =>
    axios.post(`/ent/products`, fd, { headers: { "Content-Type": "multipart/form-data" } });

// 상품 수정
export const updateProduct = (id, fd) =>
    axios.put(`/ent/products/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });

// 상품 삭제
export const deleteProduct = (id) => axios.delete(`/ent/products/${id}`);

// 아티스트별 상품 조회
export const getProductsByArtist = (artistId) => {
    return axios.get(`${BASE_URL}/ent/artists/${artistId}/products`);
};