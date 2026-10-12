const axios = require('axios');

// In-memory genre map, populated once at server startup
let genreMap = {};
let initialized = false;

// Fallback hardcoded map in case TMDB call fails (same names TMDB returns)
const FALLBACK = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
  // TV-specific
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News',
  10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics'
};

// TMDB names that differ from the names the app filters on. Combined TV genres are split
// so a show tagged "Action & Adventure" matches both the Action and Adventure filters.
const NAME_MAP = {
  'Science Fiction': ['Sci-Fi'],
  'Action & Adventure': ['Action', 'Adventure'],
  'Sci-Fi & Fantasy': ['Sci-Fi', 'Fantasy'],
  'War & Politics': ['War', 'Politics']
};
const LEGACY_GENRE_NAMES = Object.keys(NAME_MAP);

function normalizeGenreNames(names = []) {
  const out = [];
  for (const name of names) {
    for (const mapped of NAME_MAP[name] || [name]) {
      if (!out.includes(mapped)) out.push(mapped);
    }
  }
  return out;
}

async function initGenreCache() {
  if (initialized) return;
  let attempts = 0;
  while (attempts < 3) {
    try {
      // Fetch both movie and TV genres and merge
      const [movieRes, tvRes] = await Promise.all([
        axios.get('https://api.themoviedb.org/3/genre/movie/list', {
          params: { api_key: process.env.TMDB_API_KEY }, timeout: 5000
        }),
        axios.get('https://api.themoviedb.org/3/genre/tv/list', {
          params: { api_key: process.env.TMDB_API_KEY }, timeout: 5000
        })
      ]);
      [...movieRes.data.genres, ...tvRes.data.genres].forEach(g => { genreMap[g.id] = g.name; });
      initialized = true;
      console.log(`Genre cache loaded: ${Object.keys(genreMap).length} genres`);
      return;
    } catch (err) {
      attempts++;
      if (attempts < 3) await new Promise(r => setTimeout(r, 2000));
    }
  }
  console.log('Genre cache: using fallback map');
  genreMap = { ...FALLBACK };
  initialized = true;
}

function resolveGenres(ids = []) {
  // Until the TMDB fetch finishes, use the fallback so early requests still get genres
  const map = initialized ? genreMap : FALLBACK;
  return normalizeGenreNames(ids.map(id => map[id]).filter(Boolean));
}

module.exports = { initGenreCache, resolveGenres, normalizeGenreNames, LEGACY_GENRE_NAMES };
