import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

let _isRedirecting = false;

// Handle 401 (expired session) and 403 (no permission) separately
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401 && !_isRedirecting) {
      _isRedirecting = true;
      localStorage.removeItem('access_token');
      window.dispatchEvent(new CustomEvent('auth:expired'));
      setTimeout(() => { _isRedirecting = false; }, 3000);
    } else if (status === 403) {
      // Authenticated but no permission — do NOT logout
      window.dispatchEvent(new CustomEvent('auth:forbidden'));
    }

    return Promise.reject(error);
  }
);
