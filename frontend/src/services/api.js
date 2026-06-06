import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle global errors here
    if (error.response?.status === 401 && window.location.pathname !== '/auth') {
      // e.g., token expired
      Cookies.remove('token');
      localStorage.removeItem('token');
      window.location.href = '/auth'; // Redirect to login
    }
    return Promise.reject(error.response?.data || { message: error.message || 'An unexpected error occurred' });
  }
);

export default api;
