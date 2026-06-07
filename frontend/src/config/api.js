const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (import.meta.env.MODE === 'production') {
    return `${window.location.origin}/api`;
  }

  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiUrl();
export default API_BASE_URL;
