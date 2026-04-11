const express = require('express');
// const passport = require('passport');
const User = require('../models/User');
const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// GET /api/auth/google — kick off OAuth
// router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// GET /api/auth/google/callback
// router.get('/google/callback',
//   passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/` }),
//   (req, res) => {
//     if (!req.user.profileComplete) {
//       return res.redirect(`${FRONTEND_URL}/?setup=1`);
//     }
//     res.redirect(FRONTEND_URL);
//   }
// );

// GET /api/auth/me — returns current user (or 401)
router.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { _id, username, displayName, avatar, profileComplete, email } = req.user;
  res.json({ _id, username, displayName, avatar, profileComplete, email });
});

// POST /api/auth/setup — complete profile after first login
router.post('/setup', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { username, displayName, avatar } = req.body;

  if (!username || !displayName) {
    return res.status(400).json({ error: 'Username and display name are required' });
  }

  // Validate username format
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 chars, letters/numbers/underscore only' });
  }

  try {
    // Check uniqueness
    const existing = await User.findOne({ username, _id: { $ne: req.user._id } });
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username, displayName, avatar: avatar || null, profileComplete: true },
      { new: true }
    );
    res.json({ _id: user._id, username: user.username, displayName: user.displayName, avatar: user.avatar, profileComplete: user.profileComplete });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/profile — update profile (display name / avatar)
router.post('/profile', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { displayName, avatar } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...(displayName && { displayName }), ...(avatar !== undefined && { avatar }) },
      { new: true }
    );
    res.json({ _id: user._id, username: user.username, displayName: user.displayName, avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // req.logout(() => res.json({ message: 'Logged out' })); // Google auth logout
  req.session.destroy(() => res.json({ message: 'Logged out' }));
});

// Check username availability
router.get('/check-username/:username', async (req, res) => {
  const { username } = req.params;
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return res.json({ available: false, error: 'Invalid format' });
  }
  const existing = await User.findOne({ username });
  res.json({ available: !existing });
});

module.exports = router;
