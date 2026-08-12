import axios from "axios";

// Backend URL is configurable per environment via VITE_API_BASE_URL.
// Set it in Vercel (e.g. https://lpg-backend-001-production.up.railway.app/api).
// Falls back to local backend for development.
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api",
});



axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosInstance;