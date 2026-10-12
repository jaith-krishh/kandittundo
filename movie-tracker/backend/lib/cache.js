// Small in-memory cache with a TTL and a size cap (oldest entries are evicted first)
function createCache({ ttlMs, maxEntries }) {
  const store = new Map();
  return {
    get(key) {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (Date.now() - entry.ts > ttlMs) { store.delete(key); return undefined; }
      return entry.value;
    },
    set(key, value) {
      store.delete(key);
      store.set(key, { value, ts: Date.now() });
      while (store.size > maxEntries) store.delete(store.keys().next().value);
    }
  };
}

module.exports = { createCache };
