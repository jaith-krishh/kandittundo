const express = require('express');
const axios = require('axios');
const requireAuth = require('../middleware/auth');
const { str } = require('../lib/http');
const { TMDB_BASE, toEntry } = require('../lib/tmdb');

const router = express.Router();
router.use(requireAuth);
const API_KEY = process.env.TMDB_API_KEY;

// Genre ID map for discover (movies)
const MOVIE_GENRE_IDS = {
  'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35,
  'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
  'Fantasy': 14, 'History': 36, 'Horror': 27, 'Music': 10402,
  'Mystery': 9648, 'Romance': 10749, 'Sci-Fi': 878, 'Thriller': 53,
  'War': 10752, 'Western': 37
};

// Genre ID map for discover (tv shows). TMDB has no TV genre for the ones mapped to null.
const TV_GENRE_IDS = {
  'Action': 10759, 'Adventure': 10759, 'Animation': 16, 'Comedy': 35,
  'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
  'Fantasy': 10765, 'History': null, 'Horror': null, 'Music': null,
  'Mystery': 9648, 'Romance': null, 'Sci-Fi': 10765, 'Thriller': null,
  'War': 10768, 'Western': 37
};

const toNumber = (v) => {
  const n = Number(str(v) || NaN);
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), 10) : null;
};

/**
 * GET /api/random?genres=Action,Comedy&language=en&minRating=6&maxRating=10&mediaType=movie
 * Returns a single random movie/show matching the filters
 */
router.get('/', async (req, res) => {
  const isTV = str(req.query.mediaType) === 'tv';
  const type = isTV ? 'tv' : 'movie';
  const noun = isTV ? 'shows' : 'movies';
  const language = str(req.query.language);
  const minRating = toNumber(req.query.minRating);
  const maxRating = toNumber(req.query.maxRating);

  const params = {
    api_key: API_KEY,
    sort_by: 'popularity.desc',
    'vote_count.gte': 50,
    page: 1
  };

  if (/^[a-z]{2}$/.test(language)) params.with_original_language = language;
  if (minRating != null) params['vote_average.gte'] = minRating;
  if (maxRating != null) params['vote_average.lte'] = maxRating;

  const genres = str(req.query.genres).split(',').map(g => g.trim()).filter(Boolean);
  if (genres.length) {
    const map = isTV ? TV_GENRE_IDS : MOVIE_GENRE_IDS;
    const unsupported = genres.filter(g => !map[g]);
    if (unsupported.length) {
      return res.status(400).json({ error: `TMDB has no ${isTV ? 'TV ' : ''}genre for: ${unsupported.join(', ')}` });
    }
    // Comma = TMDB "AND": results must match every selected genre
    params.with_genres = [...new Set(genres.map(g => map[g]))].join(',');
  }

  try {
    // First call to get total pages
    const { data: first } = await axios.get(`${TMDB_BASE}/discover/${type}`, {
      params, timeout: 8000
    });

    if (!first.results?.length) {
      return res.status(404).json({ error: `No ${noun} found with these filters. Try broadening your search.` });
    }

    // Pick a random page (capped at 10 to stay relevant)
    const totalPages = Math.min(first.total_pages, 10);
    const randomPage = Math.floor(Math.random() * totalPages) + 1;

    let pool = first.results;
    if (randomPage > 1) {
      const { data: pageData } = await axios.get(`${TMDB_BASE}/discover/${type}`, {
        params: { ...params, page: randomPage }, timeout: 8000
      });
      if (pageData.results?.length) pool = pageData.results;
    }

    const pick = pool[Math.floor(Math.random() * pool.length)];

    res.json({
      ...toEntry(pick, type),
      backdrop_url: pick.backdrop_path ? `https://image.tmdb.org/t/p/w1280${pick.backdrop_path}` : null
    });
  } catch (err) {
    console.error('Random route error:', err.message);
    res.status(500).json({ error: 'Failed to fetch a random pick.' });
  }
});

module.exports = router;
