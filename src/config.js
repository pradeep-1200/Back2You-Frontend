const fallbackBackendUrl = 'https://back2you-backend.onrender.com';

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const envBackendUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '');

export const BACKEND_URL = envBackendUrl
  || (import.meta.env.DEV
    ? trimTrailingSlash(import.meta.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5000')
    : fallbackBackendUrl);

export const API_BASE_URL = import.meta.env.DEV ? '/api' : BACKEND_URL;

export const SOCKET_URL = trimTrailingSlash(import.meta.env.VITE_SOCKET_URL || '') || BACKEND_URL;
