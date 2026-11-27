import axios from 'axios';
import { STORAGE_KEYS } from '../../config/constants';
import { normalizeApiError } from './apiError';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const lang = localStorage.getItem(STORAGE_KEYS.LANG) || 'vi';

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Accept-Language'] = lang;

    return config;
  },
  (error) => Promise.reject(normalizeApiError(error))
);

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const normalized = normalizeApiError(error);

    if (normalized.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.dispatchEvent(new Event('rpg:unauthorized'));
    }

    return Promise.reject(normalized);
  }
);

export default axiosClient;