const express = require('express');
const axios = require('axios');
const { resolveGenres } = require('../lib/genreCache');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);
const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;
const posterUrl = (p) => p ? `https://image.tmdb.org/t/p/w500${p}` : null;

/**
 * POST /api/import/lookup
 * Body: { titles: ["Movie Name", ...] }
 * For each title, search TMDB and return top candidates.
 * If only 1 strong match → auto-resolve. Otherwise return options for user to pick.
 */
router.post('/lookup', async (req, res) => {
  const { titles } = req.body;
  if (!Array.isArray(titles) || titles.length === 0)
    return res.status(400).json({ error: 'No titles provided' });

  const results = [];

  // Sequential to avoid TMDB rate limiting
  for (const rawTitle of titles) {
    const title = rawTitle.trim();
    if (!title) continue;
    try {
      const { data } = await axios.get(`${TMDB_BASE}/search/movie`, {
        params: { api_key: API_KEY, query: title, page: 1 },
        timeout: 8000
      });

      const hits = data.results.slice(0, 5).map(m => ({
        movie_id: m.id,
        media_type: 'movie',
        title: m.title,
        original_language: m.original_language,
        poster_url: posterUrl(m.poster_path),
        genres: resolveGenres(m.genre_ids || []),
        release_year: m.release_date ? m.release_date.split('-')[0] : 'N/A',
        overview: m.overview || '',
        tmdb_rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
        providers: []
      }));

      if (hits.length === 0) {
        results.push({ rawTitle: title, status: 'unmatched', candidates: [] });
        continue;
      }

      const exact = hits[0].title.toLowerCase() === title.toLowerCase();
      results.push({
        rawTitle: title,
        status: exact ? 'resolved' : 'ambiguous',
        selected: exact ? hits[0] : null,
        candidates: hits
      });

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 150));
    } catch {
      results.push({ rawTitle: title, status: 'unmatched', candidates: [] });
    }
  }

  res.json(results);
});

module.exports = router;
