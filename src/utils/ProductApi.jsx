import axios from "axios";

axios.defaults.baseURL = "/api"; // 프록시

export const getProductDetail = (id) => axios.get(`/ent/products/${id}`);
export const getNewProducts = (params={}) => axios.get(`/products/new`, { params });
export const getProductList = (id, params={}) => axios.get(`/products/${id}`, { params });