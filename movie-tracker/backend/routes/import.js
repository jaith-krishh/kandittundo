const express = require('express');
const axios = require('axios');
const requireAuth = require('../middleware/auth');
const { sendError } = require('../lib/http');
const { TMDB_BASE, toEntry } = require('../lib/tmdb');

const router = express.Router();
router.use(requireAuth);
const API_KEY = process.env.TMDB_API_KEY;
const MAX_ITEMS = 50;

async function search(type, title, year) {
  const params = { api_key: API_KEY, query: title, page: 1 };
  if (year) params[type === 'tv' ? 'first_air_date_year' : 'year'] = year;
  const { data } = await axios.get(`${TMDB_BASE}/search/${type}`, { params, timeout: 8000 });
  return data.results.slice(0, 5).map(m => toEntry(m, type));
}

// Movies first (most CSVs are film logs); if nothing matches, try TV. A year narrows the
// search, but if the CSV year is off by one we still want to find the title.
async function findCandidates(title, year) {
  for (const type of ['movie', 'tv']) {
    let hits = year ? await search(type, title, year) : [];
    if (!hits.length) hits = await search(type, title);
    if (hits.length) return hits;
  }
  return [];
}

// Accepts ["Title", ...] or [{ title, year }, ...]
function parseItem(raw) {
  const item = typeof raw === 'string' ? { title: raw } : raw;
  if (!item || typeof item.title !== 'string') return null;
  const title = item.title.trim().slice(0, 200);
  if (!title) return null;
  const year = /^\d{4}$/.test(String(item.year ?? '')) ? String(item.year) : null;
  return { title, year };
}

/**
 * POST /api/import/lookup
 * Body: { items: [{ title, year? }, ...] }  (or the older { titles: ["Movie Name", ...] })
 * For each title, search TMDB and return top candidates.
 * If the top hit's title (and year, when given) matches exactly → auto-resolve. Otherwise return options for user to pick.
 * Results are returned in the same order and count as the input.
 */
router.post('/lookup', async (req, res) => {
  try {
    const input = req.body.items ?? req.body.titles;
    if (!Array.isArray(input) || input.length === 0)
      return res.status(400).json({ error: 'No titles provided' });
    if (input.length > MAX_ITEMS)
      return res.status(400).json({ error: `Too many titles in one request (max ${MAX_ITEMS})` });

    const results = [];

    // Sequential to avoid TMDB rate limiting
    for (const raw of input) {
      const item = parseItem(raw);
      if (!item) {
        results.push({ rawTitle: String(raw?.title ?? raw ?? ''), status: 'unmatched', candidates: [] });
        continue;
      }
      try {
        const hits = await findCandidates(item.title, item.year);
        if (hits.length === 0) {
          results.push({ rawTitle: item.title, status: 'unmatched', candidates: [] });
        } else {
          const top = hits[0];
          const exact = top.title.toLowerCase() === item.title.toLowerCase()
            && (!item.year || top.release_year === item.year);
          results.push({
            rawTitle: item.title,
            status: exact ? 'resolved' : 'ambiguous',
            selected: exact ? top : null,
            candidates: hits
          });
        }
      } catch {
        results.push({ rawTitle: item.title, status: 'unmatched', candidates: [] });
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 150));
    }

    res.json(results);
  } catch (err) {
    sendError(res, err, 'import lookup');
  }
});

module.exports = router;
