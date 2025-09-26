import axios from "axios";

axios.defaults.baseURL = "/api"; // 프록시

export const getNewProducts = (params={}) => axios.get(`/products/new`, { params });