import axios from 'axios';

// Vite Proxy handles the routing from /api to http://localhost:5000
const API_URL = '/api';

export const api = axios.create({
  baseURL: API_URL,
});

export const getItems = () => api.get('/items');
export const searchItems = (query) => api.get(`/items/search?q=${query}`);
export const getSuggestions = (query) => api.get(`/items/suggestions?q=${query}`);
export const getTrendingTags = () => api.get('/items/trending-tags');
export const getRecentActivity = () => api.get('/items/recent-activity');
export const createItem = (data) => api.post('/items', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const getItemById = (id) => api.get(`/items/${id}`);
export const createClaim = (data) => api.post('/claims', data);

export default api;
