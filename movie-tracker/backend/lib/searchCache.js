// In-memory search result cache with TTL (7 days)
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

const store = {};

// Pending requests map for deduplication
const pending = {};

function get(key) {
  const entry = store[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) { delete store[key]; return null; }
  return entry.data;
}

function set(key, data) {
  store[key] = { data, ts: Date.now() };
}

// Deduplication: if same request is in-flight, wait for it
async function dedupe(key, fetchFn) {
  const cached = get(key);
  if (cached) return cached;

  if (pending[key]) return pending[key]; // reuse in-flight promise

  pending[key] = fetchFn().then(data => {
    set(key, data);
    delete pending[key];
    return data;
  }).catch(err => {
    delete pending[key];
    throw err;
  });

  return pending[key];
}

module.exports = { get, set, dedupe };
