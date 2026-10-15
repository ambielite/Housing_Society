import axios from "axios";

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json"
    },
    timeout: 15000
});

// Request Interceptor
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        const rawSocietyId = localStorage.getItem("selectedSocietyId");
        const societyId = rawSocietyId ? String(rawSocietyId).replace(/^:+/, "") : "";

        if (societyId) {
            config.headers["X-Society-Id"] = societyId;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
