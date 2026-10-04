import axios from 'axios';

// In production (Vercel), set VITE_API_URL to your Render backend URL e.g:
// https://your-app.onrender.com/api/v1
// Locally, falls back to '/api/v1' which Vite proxies to localhost:5000
const rawBase = (import.meta.env.VITE_API_URL as string | undefined) || '/api/v1';
const trimmedBase = rawBase.replace(/\/+$/, '');
const API_BASE = trimmedBase.endsWith('/api/v1')
  ? trimmedBase
  : `${trimmedBase}/api/v1`;

const axiosClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('trailhead_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — clear auth and redirect to login
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('trailhead_token');
      localStorage.removeItem('trailhead_user');
      // Avoid circular import by checking window.location
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
