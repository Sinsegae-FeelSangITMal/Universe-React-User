import axios from "axios";
axios.defaults.baseURL = "/api";

export const getCategories = () => axios.get(`/ent/categories`); // partnerId 추후에 직원의 소속사 id 받아오기