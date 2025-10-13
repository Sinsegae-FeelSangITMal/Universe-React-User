// src/api/ArtistApi.jsx (프록시 고정 버전)
import axios from "axios";

// ✅ Vite dev 서버 프록시를 타도록 전역 기본 경로를 /api 로 고정
axios.defaults.baseURL = "/api";

// 아티스트 목록
export const getArtists = () => axios.get("/ent/artists");

// 아티스트 단건
export const getArtist = (artistId) => axios.get(`/ent/artists/${artistId}`);
