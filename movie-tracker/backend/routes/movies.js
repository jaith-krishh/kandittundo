const express = require('express');
const Movie = require('../models/Movie');
const requireAuth = require('../middleware/auth');
const { str, sendError } = require('../lib/http');
const router = express.Router();

// All movie routes require auth
router.use(requireAuth);

// Fields a client may set. Everything else (userId, _id, dates added, rank...) is server-controlled.
const CREATE_FIELDS = ['movie_id', 'media_type', 'title', 'original_language', 'poster_url', 'genres',
  'release_year', 'status', 'rating', 'remarks', 'rewatch_value', 'date_watched', 'overview',
  'tmdb_rating', 'season_ratings', 'total_seasons', 'watch_status'];
const UPDATE_FIELDS = ['rating', 'remarks', 'rewatch_value', 'status',
  'date_watched', 'season_ratings', 'watch_status', 'total_seasons'];
const MAX_BULK = 100;

function pick(body, fields) {
  const out = {};
  for (const key of fields) {
    if (body && body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

function buildNew(body, userId) {
  const doc = pick(body, CREATE_FIELDS);
  doc.media_type = doc.media_type === 'tv' ? 'tv' : 'movie';
  return { ...doc, userId, cached_at: new Date() };
}

// Stats must be defined BEFORE /:id to avoid route conflict
router.get('/stats/summary', async (req, res) => {
  try {
    const uid = req.user._id;
    const watched = await Movie.find({ userId: uid, status: 'watched' }, 'rating genres date_watched poster_url title');
    const total = watched.length;
    // Average only over titles that actually have a rating
    const rated = watched.filter(m => m.rating != null);
    const avgRating = rated.length
      ? (rated.reduce((s, m) => s + m.rating, 0) / rated.length).toFixed(1)
      : null;

    const genreCount = {};
    watched.forEach(m => m.genres.forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1; }));
    const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const recent = await Movie.find({ userId: uid, status: 'watched' })
      .sort({ date_watched: -1 })
      .limit(5)
      .select('title poster_url rating date_watched genres');

    res.json({ total, avgRating, topGenres, recent });
  } catch (err) {
    sendError(res, err, 'stats');
  }
});

// Get all movies with filters
router.get('/', async (req, res) => {
  try {
    const { genre, sortBy, sortOrder } = req.query;
    const status = str(req.query.status);
    const rewatch = str(req.query.rewatch);
    const minRating = Number(str(req.query.minRating) || NaN);
    const maxRating = Number(str(req.query.maxRating) || NaN);

    const filter = { userId: req.user._id };
    if (status) filter.status = status;
    const genres = (Array.isArray(genre) ? genre : [genre]).filter(g => typeof g === 'string' && g);
    if (genres.length) filter.genres = { $in: genres };
    if (Number.isFinite(minRating) || Number.isFinite(maxRating)) {
      filter.rating = {};
      if (Number.isFinite(minRating)) filter.rating.$gte = minRating;
      if (Number.isFinite(maxRating)) filter.rating.$lte = maxRating;
    }
    if (rewatch) filter.rewatch_value = rewatch;

    const sortOptions = {};
    if (sortBy === 'rating') sortOptions.rating = sortOrder === 'asc' ? 1 : -1;
    else if (sortBy === 'date_watched') sortOptions.date_watched = sortOrder === 'asc' ? 1 : -1;
    else sortOptions.date_added = -1;

    const movies = await Movie.find(filter).sort(sortOptions);
    res.json(movies);
  } catch (err) {
    sendError(res, err, 'get movies');
  }
});

// Add many movies at once (CSV import). Skips ones already in the list.
router.post('/bulk', async (req, res) => {
  try {
    const { movies } = req.body;
    if (!Array.isArray(movies) || movies.length === 0 || movies.length > MAX_BULK) {
      return res.status(400).json({ error: `Send between 1 and ${MAX_BULK} movies` });
    }
    let added = 0, duplicates = 0, failed = 0;
    for (const body of movies) {
      try {
        await Movie.create(buildNew(body, req.user._id));
        added++;
      } catch (err) {
        if (err.code === 11000) duplicates++;
        else failed++;
      }
    }
    res.json({ added, duplicates, failed });
  } catch (err) {
    sendError(res, err, 'bulk add');
  }
});

// Add movie
router.post('/', async (req, res) => {
  try {
    const movie = await Movie.create(buildNew(req.body, req.user._id));
    res.status(201).json(movie);
  } catch (err) {
    // The unique index catches duplicates, including two requests racing each other
    if (err.code === 11000) return res.status(409).json({ error: 'Already in your list' });
    sendError(res, err, 'add movie');
  }
});

// Update movie
router.put('/:id', async (req, res) => {
  try {
    const movie = await Movie.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      pick(req.body, UPDATE_FIELDS),
      { new: true, runValidators: true }
    );
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    sendError(res, err, 'update movie');
  }
});

// Delete movie
router.delete('/:id', async (req, res) => {
  try {
    await Movie.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, err, 'delete movie');
  }
});

module.exports = router;
