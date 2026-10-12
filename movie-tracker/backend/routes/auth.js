const express = require('express');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Movie = require('../models/Movie');
const { sendError } = require('../lib/http');
const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const MAX_DISPLAY_NAME = 40;
// Avatars are resized in the browser before upload; this is a generous ceiling
const MAX_AVATAR_CHARS = 200 * 1024;
const AVATAR_RE = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/;

// Only the login kick-off is limited; the OAuth callback is not counted against it
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again after 15 minutes' }
});

const cleanDisplayName = (v) => typeof v === 'string' ? v.trim() : '';
const validDisplayName = (v) => v.length > 0 && v.length <= MAX_DISPLAY_NAME;
const validAvatar = (v) => v === null || (typeof v === 'string' && v.length <= MAX_AVATAR_CHARS && AVATAR_RE.test(v));

// Usernames are unique regardless of case ("Alice" and "alice" are the same user).
// Safe to build a RegExp from: the value has already passed USERNAME_RE.
const findByUsername = (username, excludeId) => User.findOne({
  username: new RegExp(`^${username}$`, 'i'),
  ...(excludeId && { _id: { $ne: excludeId } })
});

// GET /api/auth/google — kick off OAuth
router.get('/google', loginLimiter, passport.authenticate('google', { scope: ['profile', 'email'], state: true }));

// GET /api/auth/google/callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/` }),
  (req, res) => {
    // Regenerate session to prevent session fixation
    const tempPassport = req.session.passport;
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: 'Failed to regenerate session' });
      req.session.passport = tempPassport;

      if (!req.user.profileComplete) {
        return res.redirect(`${FRONTEND_URL}/?setup=1`);
      }
      res.redirect(FRONTEND_URL);
    });
  }
);

// GET /api/auth/me — returns current user (or 401)
router.get('/me', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    // req.user is loaded without the avatar (it can be large), so fetch it here
    const { avatar } = await User.findById(req.user._id).select('avatar').lean() || {};
    const { _id, username, displayName, profileComplete, email, isPrivate } = req.user;
    res.json({ _id, username, displayName, avatar: avatar || null, profileComplete, email, isPrivate });
  } catch (err) {
    sendError(res, err, 'me');
  }
});

// POST /api/auth/setup — complete profile after first login
router.post('/setup', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { username, avatar = null } = req.body;
  const displayName = cleanDisplayName(req.body.displayName);

  if (typeof username !== 'string' || !username || !displayName) {
    return res.status(400).json({ error: 'Username and display name are required' });
  }
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-20 chars, letters/numbers/underscore only' });
  }
  if (!validDisplayName(displayName)) {
    return res.status(400).json({ error: `Display name must be at most ${MAX_DISPLAY_NAME} characters` });
  }
  if (!validAvatar(avatar)) {
    return res.status(400).json({ error: 'Profile picture must be a PNG, JPEG, WebP or GIF image under 150 KB' });
  }

  try {
    if (await findByUsername(username, req.user._id)) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username, displayName, avatar, profileComplete: true },
      { new: true, runValidators: true }
    );
    res.json({ _id: user._id, username: user.username, displayName: user.displayName, avatar: user.avatar, profileComplete: user.profileComplete });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Username already taken' });
    sendError(res, err, 'setup');
  }
});

// POST /api/auth/profile — update profile (display name / avatar / privacy)
router.post('/profile', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const update = {};

  if (req.body.displayName !== undefined) {
    const displayName = cleanDisplayName(req.body.displayName);
    if (!validDisplayName(displayName)) {
      return res.status(400).json({ error: `Display name must be 1-${MAX_DISPLAY_NAME} characters` });
    }
    update.displayName = displayName;
  }
  if (req.body.avatar !== undefined) {
    if (!validAvatar(req.body.avatar)) {
      return res.status(400).json({ error: 'Profile picture must be a PNG, JPEG, WebP or GIF image under 150 KB' });
    }
    update.avatar = req.body.avatar;
  }
  if (req.body.isPrivate !== undefined) {
    if (typeof req.body.isPrivate !== 'boolean') return res.status(400).json({ error: 'isPrivate must be true or false' });
    update.isPrivate = req.body.isPrivate;
  }

  try {
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
    res.json({ _id: user._id, username: user.username, displayName: user.displayName, avatar: user.avatar, isPrivate: user.isPrivate });
  } catch (err) {
    sendError(res, err, 'profile update');
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.logout(() => res.json({ message: 'Logged out' }));
});

// DELETE /api/auth/account - delete user account and all data
router.delete('/account', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  try {
    await Movie.deleteMany({ userId: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ message: 'Account deleted successfully' });
      });
    });
  } catch (err) {
    sendError(res, err, 'account delete');
  }
});

// Check username availability
router.get('/check-username/:username', async (req, res) => {
  const { username } = req.params;
  if (!USERNAME_RE.test(username)) {
    return res.json({ available: false, error: 'Invalid format' });
  }
  try {
    const existing = await findByUsername(username, req.user?._id);
    res.json({ available: !existing });
  } catch (err) {
    sendError(res, err, 'check username');
  }
});

module.exports = router;
