import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  withCredentials: true
});

export const getMe = () => API.get('/auth/me').then(r => r.data);
export const logoutUser = () => API.post('/auth/logout').then(r => r.data);
export const setupProfile = (data) => API.post('/auth/setup', data).then(r => r.data);
export const updateProfile = (data) => API.post('/auth/profile', data).then(r => r.data);
export const checkUsername = (username) => API.get(`/auth/check-username/${username}`).then(r => r.data);

export const searchTMDB = (q) => API.get(`/tmdb/search?q=${encodeURIComponent(q)}`).then(r => r.data);
export const getTrailer = (id, type = 'movie') => API.get(`/tmdb/trailer/${type}/${id}`).then(r => r.data);

export const getMovies = (params) => API.get('/movies', { params }).then(r => r.data);
export const addMovie = (data) => API.post('/movies', data).then(r => r.data);
export const updateMovie = (id, data) => API.put(`/movies/${id}`, data).then(r => r.data);
export const deleteMovie = (id) => API.delete(`/movies/${id}`).then(r => r.data);
export const bulkRank = (rankings) => API.put('/movies/rank/bulk', { rankings }).then(r => r.data);
export const getStats = () => API.get('/movies/stats/summary').then(r => r.data);
export const lookupImport = (titles) => API.post('/import/lookup', { titles }).then(r => r.data);
