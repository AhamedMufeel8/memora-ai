import axios from 'axios';
import Cookies from 'js-cookie';
import API_BASE_URL from '../config/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000, // 30 seconds default
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Optimize timeouts for heavy AI-generation tasks
    const isAiRequest = 
      config.url.includes('/ai/') || 
      config.url.includes('/flashcards/generate') || 
      config.url.includes('/quiz/generate') || 
      config.url.includes('/tutor/');
      
    if (isAiRequest) {
      config.timeout = 180000; // 3 minutes timeout for AI tasks (Gemini can take time)
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Retry on standard network drops, socket timeouts, or server cold starts
    const isNetworkError = error.code === 'ECONNABORTED' || !error.response || error.response.status >= 502;
    const isGetOrIdempotent = originalRequest && (originalRequest.method === 'get' || originalRequest.method === 'put' || originalRequest.method === 'delete');
    
    if (isNetworkError && isGetOrIdempotent && originalRequest) {
      originalRequest._retryCount = originalRequest._retryCount || 0;
      if (originalRequest._retryCount < 3) {
        originalRequest._retryCount += 1;
        console.warn(`[apiClient] Retrying request due to network drop or Render cold start (${originalRequest._retryCount}/3):`, originalRequest.url);
        
        // Exponential backoff
        const delay = Math.pow(2, originalRequest._retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return apiClient(originalRequest);
      }
    }

    // Trigger JWT Token refresh if session expires (401 Unauthorized)
    if (
      error.response?.status === 401 && 
      originalRequest &&
      !originalRequest._retry && 
      !originalRequest.url.includes('/auth/refresh') && 
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/register')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken') || Cookies.get('refreshToken');
        if (!refreshToken) {
          throw new Error('Session expired: No refresh token is available.');
        }

        // Request new access token using raw axios instance to prevent routing interceptors
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, { withCredentials: true });
        
        if (refreshResponse.data?.success && refreshResponse.data?.token) {
          const newToken = refreshResponse.data.token;
          const newRefreshToken = refreshResponse.data.refreshToken || refreshToken;

          // Save refreshed tokens
          localStorage.setItem('token', newToken);
          Cookies.set('token', newToken, { expires: 1 });
          localStorage.setItem('refreshToken', newRefreshToken);
          Cookies.set('refreshToken', newRefreshToken, { expires: 7 });

          apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh failed: invalid server response.');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Clear expired auth session
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('ai_study_user');
        Cookies.remove('token');
        Cookies.remove('refreshToken');

        if (window.location.pathname !== '/auth') {
          window.location.href = '/auth?mode=login&expired=true';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Format error response consistently
    const formattedError = error.response?.data || {
      success: false,
      message: error.message || 'A network error occurred. Please check your internet connection.',
      statusCode: error.response?.status || 500,
    };

    return Promise.reject(formattedError);
  }
);

export default apiClient;
