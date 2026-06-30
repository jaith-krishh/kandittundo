const express = require('express');
const User = require('../models/User');
const Movie = require('../models/Movie');

const router = express.Router();

// GET /api/public/user/:username
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Validate username format to prevent Regex Injection / ReDoS
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find user (case-insensitive)
    const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Top ranked movies
    const topMovies = await Movie.find({ userId: user._id, rank: { $ne: null } })
      .sort({ rank: 1 })
      .limit(10)
      .select('title poster_url rating rank movie_id media_type release_year');

    // Recent watches
    const recentMovies = await Movie.find({ userId: user._id, status: 'watched' })
      .sort({ date_watched: -1 })
      .limit(10)
      .select('title poster_url rating date_watched movie_id media_type release_year');
      
    // Stats
    const totalWatched = await Movie.countDocuments({ userId: user._id, status: 'watched' });

    res.json({
      profile: {
        displayName: user.displayName,
        username: user.username,
        avatar: user.avatar,
        joinedAt: user.createdAt
      },
      stats: {
        totalWatched
      },
      topMovies,
      recentMovies
    });

  } catch (err) {
    console.error('public profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
