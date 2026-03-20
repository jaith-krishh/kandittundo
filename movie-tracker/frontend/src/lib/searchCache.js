// Frontend search cache with localStorage persistence
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'cinetrack_search_cache_v2'; // bumped version clears old cache

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function save(store) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }
  catch { /* storage full — ignore */ }
}

export function getCached(query) {
  const store = load();
  const entry = store[query.toLowerCase()];
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) return null;
  return entry.data;
}

export function setCached(query, data) {
  const store = load();
  store[query.toLowerCase()] = { data, ts: Date.now() };
  save(store);
}
