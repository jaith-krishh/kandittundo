const express = require('express');
const axios = require('axios');
const { resolveGenres } = require('../lib/genreCache');

const router = express.Router();
const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;
const posterUrl = (p) => p ? `https://image.tmdb.org/t/p/w500${p}` : null;

// Genre ID map for discover (movies)
const MOVIE_GENRE_IDS = {
  'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35,
  'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
  'Fantasy': 14, 'History': 36, 'Horror': 27, 'Music': 10402,
  'Mystery': 9648, 'Romance': 10749, 'Sci-Fi': 878, 'Thriller': 53,
  'War': 10752, 'Western': 37
};

// Genre ID map for discover (tv shows)
const TV_GENRE_IDS = {
  'Action': 10759, 'Adventure': 10759, 'Animation': 16, 'Comedy': 35,
  'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
  'Fantasy': 10765, 'History': null, 'Horror': null, 'Music': null,
  'Mystery': 9648, 'Romance': null, 'Sci-Fi': 10765, 'Thriller': null,
  'War': 10768, 'Western': 37
};

/**
 * GET /api/random?genres=Action,Comedy&language=en&minRating=6&maxRating=10&mediaType=movie
 * Returns a single random movie/show matching the filters
 */
router.get('/', async (req, res) => {
  const { genres, language, minRating, maxRating, mediaType = 'movie' } = req.query;

  const isTV = mediaType === 'tv';
  const type = isTV ? 'tv' : 'movie';

  const params = {
    api_key: API_KEY,
    sort_by: 'popularity.desc',
    'vote_count.gte': 50,
    page: 1
  };

  if (language) params.with_original_language = language;
  if (minRating) params['vote_average.gte'] = Number(minRating);
  if (maxRating) params['vote_average.lte'] = Number(maxRating);

  if (genres) {
    const map = isTV ? TV_GENRE_IDS : MOVIE_GENRE_IDS;
    const ids = genres.split(',')
      .map(g => map[g.trim()])
      .filter(Boolean)
      .join(',');
    if (ids) params.with_genres = ids;
  }

  try {
    // First call to get total pages
    const { data: first } = await axios.get(`${TMDB_BASE}/discover/${type}`, {
      params, timeout: 8000
    });

    if (!first.results?.length) {
      return res.status(404).json({ error: 'No movies found with these filters. Try broadening your search.' });
    }

    // Pick a random page (capped at 10 to stay relevant)
    const totalPages = Math.min(first.total_pages, 10);
    const randomPage = Math.floor(Math.random() * totalPages) + 1;

    let pool = first.results;
    if (randomPage > 1) {
      const { data: pageData } = await axios.get(`${TMDB_BASE}/discover/${type}`, {
        params: { ...params, page: randomPage }, timeout: 8000
      });
      pool = pageData.results;
    }

    const pick = pool[Math.floor(Math.random() * pool.length)];

    res.json({
      movie_id: pick.id,
      media_type: type,
      title: isTV ? (pick.name || pick.original_name) : pick.title,
      original_language: pick.original_language || null,
      poster_url: posterUrl(pick.poster_path),
      backdrop_url: pick.backdrop_path ? `https://image.tmdb.org/t/p/w1280${pick.backdrop_path}` : null,
      genres: resolveGenres(pick.genre_ids || []),
      release_year: isTV
        ? (pick.first_air_date ? pick.first_air_date.split('-')[0] : 'N/A')
        : (pick.release_date ? pick.release_date.split('-')[0] : 'N/A'),
      overview: pick.overview || '',
      tmdb_rating: pick.vote_average ? Math.round(pick.vote_average * 10) / 10 : null,
    });
  } catch (err) {
    console.error('Random route error:', err.message);
    res.status(500).json({ error: 'Failed to fetch random movie.' });
  }
});

module.exports = router;
