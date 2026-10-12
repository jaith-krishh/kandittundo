// Frontend search cache with localStorage persistence
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 200;
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
  const now = Date.now();
  // Drop expired entries and keep only the newest ones so the cache can't grow forever
  const kept = Object.entries(load())
    .filter(([, e]) => now - e.ts <= TTL_MS)
    .sort((a, b) => b[1].ts - a[1].ts)
    .slice(0, MAX_ENTRIES - 1);
  save({ ...Object.fromEntries(kept), [query.toLowerCase()]: { data, ts: now } });
}
