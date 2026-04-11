import React, { useState } from 'react';
import { getRandomMovie, addMovie } from '../api';
import { useMovies } from '../context/MovieContext';

const GENRES = [
  'Action','Adventure','Animation','Comedy','Crime','Documentary',
  'Drama','Family','Fantasy','History','Horror','Music','Mystery',
  'Romance','Sci-Fi','Thriller','War','Western'
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'hi', label: 'Hindi' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ta', label: 'Tamil' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'tr', label: 'Turkish' },
];

export default function RandomPage() {
  const { allMovies, addToWatchlist } = useMovies();

  // Filters
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [language, setLanguage] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [mediaType, setMediaType] = useState('movie');

  // Result state
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addStatus, setAddStatus] = useState(''); // 'watchlist' | 'watched' | ''

  const toggleGenre = (g) =>
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const handleSpin = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    setAddStatus('');
    try {
      const params = { mediaType };
      if (selectedGenres.length) params.genres = selectedGenres.join(',');
      if (language) params.language = language;
      if (minRating) params.minRating = minRating;
      if (maxRating) params.maxRating = maxRating;
      const data = await getRandomMovie(params);
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const existing = result ? allMovies.find(m => m.movie_id === result.movie_id) : null;

  const handleAddWatchlist = async () => {
    try {
      await addToWatchlist(result);
      setAddStatus('watchlist');
    } catch {
      setAddStatus('watchlist'); // already there
    }
  };

  const handleAddWatched = async () => {
    try {
      await addMovie({ ...result, status: 'watched', date_watched: new Date().toISOString() });
      setAddStatus('watched');
    } catch {
      setAddStatus('watched');
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Random Pick</h1>
      <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 24 }}>
        Set your filters and let fate decide what to watch.
      </p>

      {/* Filter card */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 10, padding: 20, marginBottom: 24
      }}>
        {/* Media type toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['movie', 'tv'].map(t => (
            <button key={t} onClick={() => setMediaType(t)}
              className="btn btn-ghost btn-sm"
              style={{
                background: mediaType === t ? 'var(--accent)' : 'transparent',
                color: mediaType === t ? '#fff' : 'var(--text2)',
                borderColor: mediaType === t ? 'var(--accent)' : 'var(--border)',
                fontWeight: 600, textTransform: 'capitalize'
              }}>
              {t === 'tv' ? 'TV Show' : 'Movie'}
            </button>
          ))}
        </div>

        {/* Genres */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Genre {selectedGenres.length > 0 && <span style={{ color: 'var(--accent)' }}>({selectedGenres.length})</span>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {GENRES.map(g => (
              <button key={g} onClick={() => toggleGenre(g)}
                className="btn btn-ghost btn-sm"
                style={{
                  color: selectedGenres.includes(g) ? 'var(--accent)' : 'var(--text2)',
                  borderColor: selectedGenres.includes(g) ? 'var(--accent)' : 'var(--border)',
                  background: selectedGenres.includes(g) ? 'rgba(229,9,20,0.1)' : 'transparent'
                }}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Language + Rating row */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Language
            <select value={language} onChange={e => setLanguage(e.target.value)}
              style={{
                display: 'block', marginTop: 6, padding: '7px 10px',
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 6, color: language ? 'var(--text)' : 'var(--text2)', fontSize: 13, minWidth: 140
              }}>
              <option value="">Any</option>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </label>

          <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Min Rating
            <input type="number" min="0" max="10" step="0.5" value={minRating}
              onChange={e => setMinRating(e.target.value)} placeholder="0"
              style={{
                display: 'block', marginTop: 6, width: 80, padding: '7px 10px',
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 6, color: 'var(--text)', fontSize: 13
              }} />
          </label>

          <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Max Rating
            <input type="number" min="0" max="10" step="0.5" value={maxRating}
              onChange={e => setMaxRating(e.target.value)} placeholder="10"
              style={{
                display: 'block', marginTop: 6, width: 80, padding: '7px 10px',
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 6, color: 'var(--text)', fontSize: 13
              }} />
          </label>

          {/* Clear filters */}
          {(selectedGenres.length || language || minRating || maxRating) ? (
            <button onClick={() => { setSelectedGenres([]); setLanguage(''); setMinRating(''); setMaxRating(''); }}
              className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-end' }}>
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {/* Spin button */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <button onClick={handleSpin} disabled={loading}
          className="btn btn-primary"
          style={{
            fontSize: 15, padding: '12px 40px', borderRadius: 30,
            opacity: loading ? 0.7 : 1,
            transition: 'transform 0.1s',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {loading ? 'Finding...' : 'Pick for me'}
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(229,9,20,0.1)', border: '1px solid var(--accent)',
          borderRadius: 8, padding: '14px 18px', color: 'var(--accent)', fontSize: 14, textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* Result card */}
      {result && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 12, overflow: 'hidden',
          animation: 'fadeSlideIn 0.35s ease'
        }}>
          {/* Backdrop */}
          {result.backdrop_url && (
            <div style={{
              height: 180, overflow: 'hidden', position: 'relative'
            }}>
              <img src={result.backdrop_url} alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, transparent 40%, var(--bg2) 100%)'
              }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 20, padding: '20px 24px' }}>
            {/* Poster */}
            {result.poster_url
              ? <img src={result.poster_url} alt={result.title}
                  style={{ width: 110, height: 165, objectFit: 'cover', borderRadius: 8,
                    flexShrink: 0, marginTop: result.backdrop_url ? -60 : 0,
                    border: '2px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }} />
              : <div style={{ width: 110, height: 165, background: 'var(--bg3)', borderRadius: 8,
                  flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text2)', fontSize: 12 }}>No poster</div>
            }

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{result.title}</h2>
                {result.media_type === 'tv' && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                    background: '#1a3a5c', color: '#4fc3f7', flexShrink: 0, marginTop: 3 }}>TV</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text2)', fontSize: 13 }}>{result.release_year}</span>
                {result.tmdb_rating && (
                  <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 13 }}>
                    ★ {result.tmdb_rating}
                  </span>
                )}
                {result.original_language && (
                  <span style={{ fontSize: 11, background: 'var(--bg3)', color: 'var(--text2)',
                    padding: '2px 7px', borderRadius: 4 }}>
                    {result.original_language.toUpperCase()}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                {result.genres.map(g => <span key={g} className="badge">{g}</span>)}
              </div>

              {result.overview && (
                <p style={{
                  fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 16,
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                  {result.overview}
                </p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {existing ? (
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20,
                    background: existing.status === 'watched' ? '#1a3a1a' : '#1a2a3a',
                    border: `1px solid ${existing.status === 'watched' ? '#4caf50' : '#4fc3f7'}`,
                    color: existing.status === 'watched' ? '#4caf50' : '#4fc3f7'
                  }}>
                    {existing.status === 'watched' ? '✓ Watched' : '✓ On Watchlist'}
                  </span>
                ) : addStatus ? (
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20,
                    background: addStatus === 'watched' ? '#1a3a1a' : '#1a2a3a',
                    border: `1px solid ${addStatus === 'watched' ? '#4caf50' : '#4fc3f7'}`,
                    color: addStatus === 'watched' ? '#4caf50' : '#4fc3f7'
                  }}>
                    {addStatus === 'watched' ? '✓ Added to Watched' : '✓ Added to Watchlist'}
                  </span>
                ) : (
                  <>
                    <button onClick={handleAddWatchlist} className="btn btn-ghost btn-sm">
                      + Watchlist
                    </button>
                    <button onClick={handleAddWatched} className="btn btn-primary btn-sm">
                      Mark Watched
                    </button>
                  </>
                )}

                <button onClick={handleSpin} disabled={loading}
                  className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>
                  {loading ? '...' : 'Try another'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
