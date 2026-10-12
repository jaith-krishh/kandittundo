const express = require('express');
const axios = require('axios');
const requireAuth = require('../middleware/auth');
const { createCache } = require('../lib/cache');
const { str } = require('../lib/http');
const { TMDB_BASE, toEntry } = require('../lib/tmdb');

const router = express.Router();
// Only signed-in users can spend the app's TMDB quota
router.use(requireAuth);
const API_KEY = process.env.TMDB_API_KEY;

const DAY = 24 * 60 * 60 * 1000;
// Separate caches so one endpoint's keys can never collide with another's
const searchCache = createCache({ ttlMs: DAY, maxEntries: 2000 });
const detailsCache = createCache({ ttlMs: 7 * DAY, maxEntries: 5000 });
const trailerCache = createCache({ ttlMs: 7 * DAY, maxEntries: 5000 });
const providersCache = createCache({ ttlMs: DAY, maxEntries: 5000 });

// :type/:id params are put into the TMDB URL, so only allow known values
router.param('type', (req, res, next, type) => {
  if (type !== 'movie' && type !== 'tv') return res.status(400).json({ error: 'Invalid type' });
  next();
});
router.param('id', (req, res, next, id) => {
  if (!/^\d{1,10}$/.test(id)) return res.status(400).json({ error: 'Invalid id' });
  next();
});

// GET /api/tmdb/details/:type/:id — fetch overview + rating for existing movies
router.get('/details/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const key = `${type}:${id}`;
  const cached = detailsCache.get(key);
  if (cached) return res.json(cached);
  try {
    const { data } = await axios.get(`${TMDB_BASE}/${type}/${id}`, {
      params: { api_key: API_KEY }, timeout: 8000
    });
    const result = {
      overview: data.overview || '',
      tmdb_rating: data.vote_average ? Math.round(data.vote_average * 10) / 10 : null,
      total_seasons: data.number_of_seasons || null
    };
    detailsCache.set(key, result);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch details' });
  }
});

// GET /api/tmdb/search?q=query&lang=ko
router.get('/search', async (req, res) => {
  const q = str(req.query.q).trim().slice(0, 100);
  const langParam = str(req.query.lang).trim();
  const lang = /^[a-z]{2}$/.test(langParam) ? langParam : '';
  if (q.length < 3) return res.json([]);

  const cacheKey = `${lang}::${q.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const params = { api_key: API_KEY, query: q, page: 1 };
    if (lang) params.with_original_language = lang;

    const { data } = await axios.get(`${TMDB_BASE}/search/multi`, {
      params, timeout: 8000
    });

    const results = data.results
      .filter(m => m.media_type === 'movie' || m.media_type === 'tv')
      // If language filter set, enforce it (TMDB multi-search doesn't always respect with_original_language)
      .filter(m => !lang || m.original_language === lang)
      .slice(0, 10)
      .map(m => toEntry(m, m.media_type));

    searchCache.set(cacheKey, results);
    res.json(results);
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search failed. Please try again.' });
  }
});

// GET /api/tmdb/trailer/:type/:id
router.get('/trailer/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const key = `${type}:${id}`;
  const cached = trailerCache.get(key);
  if (cached) return res.json(cached);
  try {
    const { data } = await axios.get(`${TMDB_BASE}/${type}/${id}/videos`, {
      params: { api_key: API_KEY }, timeout: 8000
    });
    const trailer = data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    const result = { key: trailer ? trailer.key : null };
    trailerCache.set(key, result);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Failed to fetch trailer' });
  }
});

// GET /api/tmdb/providers/:type/:id
router.get('/providers/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const key = `${type}:${id}`;
  const cached = providersCache.get(key);
  if (cached) return res.json(cached);
  try {
    const { data } = await axios.get(`${TMDB_BASE}/${type}/${id}/watch/providers`, {
      params: { api_key: API_KEY }, timeout: 8000
    });
    const results = data.results || {};
    // Default to IN, fallback to US
    const providersData = results.IN || results.US || null;
    const flatrate = providersData ? (providersData.flatrate || []) : [];

    // Map to just id, name, logo
    const providers = flatrate.map(p => ({
      provider_id: p.provider_id,
      provider_name: p.provider_name,
      logo_path: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null
    }));

    providersCache.set(key, providers);
    res.json(providers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

module.exports = router;
