import axios from 'axios';

// Vite Proxy handles the routing from /api to http://localhost:5000
const API_URL = '/api';

export const api = axios.create({
  baseURL: API_URL,
});

export const getItems = () => api.get('/items');
export const searchItems = ({ query, location, category, date, status }) => {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (location) params.append('location', location);
  if (category) params.append('category', category);
  if (date) params.append('date', date);
  if (status) params.append('status', status);
  return api.get(`/items/search?${params.toString()}`);
};
export const getSuggestions = (query) => api.get(`/items/suggestions?q=${query}`);
export const getTrendingTags = () => api.get('/items/trending-tags');
export const getRecentActivity = () => api.get('/items/recent-activity');
export const createItem = (data) => api.post('/items', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const getItemById = (id) => api.get(`/items/${id}`);
export const createClaim = (data) => api.post('/claims', data);

export default api;
