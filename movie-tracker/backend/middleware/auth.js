// Middleware to protect routes — requires a logged-in session
module.exports = function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
};
