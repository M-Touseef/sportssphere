import axios from 'axios';

// Prioritize REACT_APP_API_BASE_URL as requested, fallback to VITE_API_URL, then localhost
const baseURL = import.meta.env.REACT_APP_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token to every request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle common errors (e.g., 401)
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Optional: Handle 401 Unauthorized globally (e.g., redirect to login)
        // if (error.response && error.response.status === 401) {
        //   localStorage.removeItem('token');
        //   window.location.href = '/login';
        // }
        return Promise.reject(error);
    }
);

export default axiosInstance;
