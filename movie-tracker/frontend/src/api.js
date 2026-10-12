import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  withCredentials: true
});

// Login is a full-page redirect, so it needs the same base URL as the API calls
export const GOOGLE_LOGIN_URL = `${import.meta.env.VITE_API_URL || '/api'}/auth/google`;

// Pull the server's error message out of a failed request
export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.error || fallback;

export const getMe = () => API.get('/auth/me').then(r => r.data);
export const logoutUser = () => API.post('/auth/logout').then(r => r.data);
export const setupProfile = (data) => API.post('/auth/setup', data).then(r => r.data);
export const updateProfile = (data) => API.post('/auth/profile', data).then(r => r.data);
export const checkUsername = (username) => API.get(`/auth/check-username/${encodeURIComponent(username)}`).then(r => r.data);
export const getPublicProfile = (username) => API.get(`/public/user/${encodeURIComponent(username)}`).then(r => r.data);

export const searchTMDB = (q, lang = '') => API.get('/tmdb/search', { params: { q, ...(lang && { lang }) } }).then(r => r.data);
export const getTrailer = (id, type = 'movie') => API.get(`/tmdb/trailer/${type}/${id}`).then(r => r.data);
export const getDetails = (id, type = 'movie') => API.get(`/tmdb/details/${type}/${id}`).then(r => r.data);
export const getProviders = (id, type = 'movie') => API.get(`/tmdb/providers/${type}/${id}`).then(r => r.data);

export const getMovies = (params) => API.get('/movies', { params }).then(r => r.data);
export const addMovie = (data) => API.post('/movies', data).then(r => r.data);
export const addMoviesBulk = (movies) => API.post('/movies/bulk', { movies }, { timeout: 60000 }).then(r => r.data);
export const updateMovie = (id, data) => API.put(`/movies/${id}`, data).then(r => r.data);
export const deleteMovie = (id) => API.delete(`/movies/${id}`).then(r => r.data);
export const getStats = () => API.get('/movies/stats/summary').then(r => r.data);
export const lookupImport = (items) => API.post('/import/lookup', { items }, { timeout: 60000 }).then(r => r.data);
export const getRandomMovie = (params) => API.get('/random', { params }).then(r => r.data);
export const deleteAccount = () => API.delete('/auth/account').then(r => r.data);
