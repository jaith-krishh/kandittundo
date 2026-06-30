const express = require('express');
const Movie = require('../models/Movie');
const requireAuth = require('../middleware/auth');
const router = express.Router();

// All movie routes require auth
router.use(requireAuth);

// Stats must be defined BEFORE /:id to avoid route conflict
router.get('/stats/summary', async (req, res) => {
  try {
    const uid = req.user._id;
    const watched = await Movie.find({ userId: uid, status: 'watched' }, 'rating genres date_watched poster_url title');
    const total = watched.length;
    const avgRating = total
      ? (watched.reduce((s, m) => s + (m.rating || 0), 0) / total).toFixed(1)
      : 0;

    const genreCount = {};
    watched.forEach(m => m.genres.forEach(g => { genreCount[g] = (genreCount[g] || 0) + 1; }));
    const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const recent = await Movie.find({ userId: uid, status: 'watched' })
      .sort({ date_watched: -1 })
      .limit(5)
      .select('title poster_url rating date_watched genres');

    res.json({ total, avgRating, topGenres, recent });
  } catch (err) {
    console.error('stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk rank update
router.put('/rank/bulk', async (req, res) => {
  try {
    const { rankings } = req.body;
    if (!Array.isArray(rankings) || rankings.length === 0) {
      return res.status(400).json({ error: 'Invalid rankings payload' });
    }
    await Promise.all(rankings.map(r => Movie.findOneAndUpdate(
      { _id: r._id, userId: req.user._id },
      { rank: r.rank }
    )));
    res.json({ message: 'Rankings updated' });
  } catch (err) {
    console.error('rank error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all movies with filters
router.get('/', async (req, res) => {
  try {
    const { status, genre, minRating, maxRating, sortBy, sortOrder, rewatch } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;
    if (genre) filter.genres = { $in: Array.isArray(genre) ? genre : [genre] };
    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) filter.rating.$gte = Number(minRating);
      if (maxRating) filter.rating.$lte = Number(maxRating);
    }
    if (rewatch) filter.rewatch_value = rewatch;

    const sortOptions = {};
    if (sortBy === 'rating') sortOptions.rating = sortOrder === 'asc' ? 1 : -1;
    else if (sortBy === 'date_watched') sortOptions.date_watched = sortOrder === 'asc' ? 1 : -1;
    else if (sortBy === 'rank') sortOptions.rank = 1;
    else sortOptions.date_added = -1;

    const movies = await Movie.find(filter).sort(sortOptions);
    res.json(movies);
  } catch (err) {
    console.error('get movies error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add movie
router.post('/', async (req, res) => {
  try {
    // Fix race condition: use atomic findOneAndUpdate with upsert
    const movie = await Movie.findOneAndUpdate(
      { userId: req.user._id, movie_id: req.body.movie_id },
      { $setOnInsert: { ...req.body, userId: req.user._id, cached_at: new Date() } },
      { upsert: true, new: true, rawResult: true }
    );
    if (!movie.lastErrorObject.updatedExisting) {
      res.status(201).json(movie.value);
    } else {
      res.status(409).json({ error: 'Movie already in your list' });
    }
  } catch (err) {
    console.error('add movie error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update movie
router.put('/:id', async (req, res) => {
  try {
    const ALLOWED_FIELDS = ['rating', 'remarks', 'rewatch_value', 'status',
      'date_watched', 'rank', 'season_ratings', 'watch_status', 'total_seasons'];
    const update = {};
    for (const key of ALLOWED_FIELDS) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const movie = await Movie.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      update,
      { new: true }
    );
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    console.error('update movie error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete movie
router.delete('/:id', async (req, res) => {
  try {
    await Movie.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('delete movie error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
