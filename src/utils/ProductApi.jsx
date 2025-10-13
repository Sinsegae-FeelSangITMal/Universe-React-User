// 굳이 BASE_URL 만들지 말고, vite 프록시/NGINX가 /api를 게이트웨이로 보내게만 하면 됨.
import axios from "axios";

// Vite dev에선 proxy가 /api를 8000으로 전달, 운영에선 Nginx가 /api를 게이트웨이로 전달
axios.defaults.baseURL = "/api"; // ✅ 프록시 경로 고정

export const getProductDetail = (id) => axios.get(`/ent/products/${id}`);
export const getNewProducts   = (params = {}) => axios.get(`/products/new`, { params });
export const getProductList   = (id, params = {}) => axios.get(`/products/${id}`, { params });

// 하나의 상품 조회
export const getProduct  = (id) => axios.get(`/ent/products/${id}`);
// 전체 상품 조회
export const getProducts = (params = {}) => axios.get(`/ent/products`, { params });

// 상품 등록/수정/삭제
export const registProduct = (fd) =>
  axios.post(`/ent/products`, fd, { headers: { "Content-Type": "multipart/form-data" } });

export const updateProduct = (id, fd) =>
  axios.put(`/ent/products/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });

export const deleteProduct = (id) => axios.delete(`/ent/products/${id}`);

// 아티스트별 상품 조회 (✅ BASE_URL 제거, 상대경로로 통일)
export const getProductsByArtist = (artistId, params = {}) =>
  axios.get(`/ent/artists/${artistId}/products`, { params });
