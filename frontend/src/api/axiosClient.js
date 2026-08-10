import axios from "axios";

const API_BASE = "https://trailhead-rlls.onrender.com/api/v1";

const axiosClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT from localStorage
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("trailhead_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle 401
axiosClient.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("trailhead_token");
      localStorage.removeItem("trailhead_user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
