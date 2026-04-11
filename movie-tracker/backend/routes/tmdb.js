const express = require('express');
const axios = require('axios');
const { resolveGenres } = require('../lib/genreCache');

const router = express.Router();
const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

// Simple in-memory cache
const cache = {};

const posterUrl = (path) => path ? `https://image.tmdb.org/t/p/w500${path}` : null;

// GET /api/tmdb/details/:type/:id — fetch overview + rating for existing movies
router.get('/details/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const key = `details:${type}:${id}`;
  if (cache[key]) return res.json(cache[key]);
  try {
    const { data } = await axios.get(`${TMDB_BASE}/${type}/${id}`, {
      params: { api_key: API_KEY }, timeout: 8000
    });
    const result = {
      overview: data.overview || '',
      tmdb_rating: data.vote_average ? Math.round(data.vote_average * 10) / 10 : null
    };
    cache[key] = result;
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch details' });
  }
});

// GET /api/tmdb/search?q=query
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 3) return res.json([]);

  if (cache[q]) return res.json(cache[q]);

  try {
    // Use multi-search to get both movies and TV shows
    const { data } = await axios.get(`${TMDB_BASE}/search/multi`, {
      params: { api_key: API_KEY, query: q, page: 1 },
      timeout: 8000
    });

    const results = data.results
      .filter(m => m.media_type === 'movie' || m.media_type === 'tv')
      .slice(0, 10)
      .map(m => {
        const isTV = m.media_type === 'tv';
        return {
          movie_id: m.id,
          media_type: m.media_type,
          title: isTV ? (m.name || m.original_name) : m.title,
          original_language: m.original_language || null,
          poster_url: posterUrl(m.poster_path),
          genres: resolveGenres(m.genre_ids || []),
          release_year: isTV
            ? (m.first_air_date ? m.first_air_date.split('-')[0] : 'N/A')
            : (m.release_date ? m.release_date.split('-')[0] : 'N/A'),
          overview: m.overview || '',
          tmdb_rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
          providers: []
        };
      });

    cache[q] = results;
    res.json(results);
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search failed. Please try again.' });
  }
});

// GET /api/tmdb/trailer/:type/:id
router.get('/trailer/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  try {
    const { data } = await axios.get(`${TMDB_BASE}/${type}/${id}/videos`, {
      params: { api_key: API_KEY }, timeout: 8000
    });
    const trailer = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    res.json({ key: trailer ? trailer.key : null });
  } catch {
    res.status(500).json({ error: 'Failed to fetch trailer' });
  }
});

module.exports = router;
