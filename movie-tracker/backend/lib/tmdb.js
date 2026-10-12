const { resolveGenres } = require('./genreCache');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const posterUrl = (p) => p ? `https://image.tmdb.org/t/p/w500${p}` : null;
const yearOf = (date) => date ? date.split('-')[0] : 'N/A';

// Map a TMDB movie/tv result onto the shape the app stores
function toEntry(m, mediaType) {
  const isTV = mediaType === 'tv';
  return {
    movie_id: m.id,
    media_type: isTV ? 'tv' : 'movie',
    title: isTV ? (m.name || m.original_name) : m.title,
    original_language: m.original_language || null,
    poster_url: posterUrl(m.poster_path),
    genres: resolveGenres(m.genre_ids || []),
    release_year: yearOf(isTV ? m.first_air_date : m.release_date),
    overview: m.overview || '',
    tmdb_rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null
  };
}

module.exports = { TMDB_BASE, posterUrl, toEntry };
