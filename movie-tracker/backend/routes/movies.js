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
    res.status(500).json({ error: err.message });
  }
});

// Bulk rank update
router.put('/rank/bulk', async (req, res) => {
  try {
    const { rankings } = req.body;
    await Promise.all(rankings.map(r => Movie.findOneAndUpdate(
      { _id: r._id, userId: req.user._id },
      { rank: r.rank }
    )));
    res.json({ message: 'Rankings updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

// Add movie
router.post('/', async (req, res) => {
  try {
    const existing = await Movie.findOne({ userId: req.user._id, movie_id: req.body.movie_id });
    if (existing) return res.status(409).json({ error: 'Movie already in your list' });

    const movie = new Movie({ ...req.body, userId: req.user._id, cached_at: new Date() });
    await movie.save();
    res.status(201).json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update movie
router.put('/:id', async (req, res) => {
  try {
    const movie = await Movie.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete movie
router.delete('/:id', async (req, res) => {
  try {
    await Movie.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
