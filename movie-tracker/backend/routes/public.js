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
    
    const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.isPrivate) {
      return res.json({
        profile: {
          displayName: user.displayName,
          username: user.username,
          avatar: user.avatar,
          joinedAt: user.createdAt
        },
        isPrivate: true
      });
    }

    // Top rated movies
    const topMovies = await Movie.find({ userId: user._id, status: 'watched', rating: { $ne: null } })
      .sort({ rating: -1, date_watched: -1 })
      .limit(10)
      .select('title poster_url rating rank movie_id media_type release_year');

    // Top genre
    const genreStats = await Movie.aggregate([
      { $match: { userId: user._id, status: 'watched' } },
      { $unwind: '$genres' },
      { $group: { _id: '$genres', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const topGenre = genreStats.length > 0 ? genreStats[0]._id : null;

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
        totalWatched,
        topGenre
      },
      topMovies
    });

  } catch (err) {
    console.error('public profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
