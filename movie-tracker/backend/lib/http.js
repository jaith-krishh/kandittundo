// Helpers shared by route handlers

// Query params can arrive as arrays or objects (?q[a]=1); only accept plain strings
const str = (v) => (typeof v === 'string' ? v : '');

// Bad input (wrong types, failed schema validation, malformed ids) is the client's fault → 400
function sendError(res, err, label) {
  if (err && (err.name === 'ValidationError' || err.name === 'CastError')) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  console.error(`${label} error:`, err);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { str, sendError };
