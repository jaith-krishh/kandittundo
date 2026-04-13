import React, { useState, useEffect } from 'react';
import { useMovies } from '../context/MovieContext';
import { addMovie, getTVDetails } from '../api';

export default function SearchPreviewModal({ movie, onClose, onAdded }) {
  const { movies, allMovies, addToWatchlist } = useMovies();
  const [mode, setMode] = useState(null);
  const [rating, setRating] = useState('');
  const [remarks, setRemarks] = useState('');
  const [rewatch, setRewatch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isTV = movie.media_type === 'tv';
  const [totalSeasons, setTotalSeasons] = useState(null);
  const [seasonRatings, setSeasonRatings] = useState([]);

  const existing = allMovies.find(m => m.movie_id === movie.movie_id);
  const alreadyWatched = existing?.status === 'watched';
  const alreadyWatchlist = existing?.status === 'watchlist';

  // Fetch season count when entering watched mode for TV
  useEffect(() => {
    if (mode === 'watched' && isTV && !totalSeasons) {
      getTVDetails(movie.movie_id).then(d => {
        if (d.total_seasons) {
          setTotalSeasons(d.total_seasons);
          setSeasonRatings(
            Array.from({ length: d.total_seasons }, (_, i) => ({
              season: i + 1, rating: '', remarks: ''
            }))
          );
        }
      }).catch(() => {});
    }
  }, [mode]);

  const updateSeasonRating = (idx, field, val) =>
    setSeasonRatings(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));

  const handleWatchlist = async () => {
    setLoading(true);
    try {
      await addToWatchlist(movie);
      onAdded();
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || 'Already in your list');
    } finally {
      setLoading(false);
    }
  };

  const handleWatched = async () => {
    setLoading(true);
    try {
      const payload = {
        ...movie, status: 'watched',
        rating: rating ? Number(rating) : null,
        remarks, rewatch_value: rewatch || null,
        date_watched: new Date().toISOString()
      };

      if (isTV && seasonRatings.length) {
        const cleaned = seasonRatings
          .filter(s => s.rating !== '' && s.rating != null)
          .map(s => ({ season: s.season, rating: Number(s.rating), remarks: s.remarks || '' }));
        payload.season_ratings = cleaned;
        if (!payload.rating && cleaned.length) {
          payload.rating = Math.round(cleaned.reduce((s, r) => s + r.rating, 0) / cleaned.length * 10) / 10;
        }
      }

      await addMovie(payload);
      onAdded();
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || 'Already in your list');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: 20, padding: 24 }}>
          {movie.poster_url
            ? <img src={movie.poster_url} alt={movie.title}
                style={{ width: 120, height: 180, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
            : <div style={{ width: 120, height: 180, background: 'var(--bg3)', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                color: 'var(--text2)', fontSize: 13 }}>No poster</div>
          }

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title row with status badge */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{movie.title}</h2>
              {(alreadyWatched || alreadyWatchlist) && (
                <span style={{
                  flexShrink: 0, fontSize: 11, fontWeight: 600, padding: '3px 8px',
                  borderRadius: 20, marginTop: 2,
                  background: alreadyWatched ? '#1a3a1a' : '#1a2a3a',
                  border: `1px solid ${alreadyWatched ? '#4caf50' : '#4fc3f7'}`,
                  color: alreadyWatched ? '#4caf50' : '#4fc3f7',
                }}>
                  {alreadyWatched ? 'Watched' : 'On Watchlist'}
                </span>
              )}
            </div>

            <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 8 }}>
              {movie.release_year}
              {movie.original_language && movie.original_language !== 'en' && (
                <span style={{ marginLeft: 8, fontSize: 11, background: 'var(--bg3)',
                  padding: '1px 6px', borderRadius: 3 }}>
                  {movie.original_language.toUpperCase()}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
              {movie.genres?.slice(0, 3).map(g => (
                <span key={g} className="badge">{g}</span>
              ))}
            </div>

            {movie.tmdb_rating && (
              <div style={{ fontSize: 13, color: 'var(--gold)', marginBottom: 8, fontWeight: 600 }}>
                IMDb {movie.tmdb_rating} / 10
              </div>
            )}

            {movie.overview && (
              <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6,
                marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {movie.overview}
              </p>
            )}

            {error && <div style={{ color: 'var(--accent)', fontSize: 12, marginBottom: 8 }}>{error}</div>}

            {mode === null ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Watchlist button — hidden if already watched */}
                {!alreadyWatched && (
                  <button
                    onClick={alreadyWatchlist ? undefined : handleWatchlist}
                    disabled={loading || alreadyWatchlist}
                    className="btn btn-ghost"
                    style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 8,
                      opacity: alreadyWatchlist ? 0.6 : 1,
                      cursor: alreadyWatchlist ? 'default' : 'pointer' }}>
                    {alreadyWatchlist ? 'Already on Watchlist' : '+ Add to Watchlist'}
                  </button>
                )}
                {/* Watched button */}
                <button
                  onClick={alreadyWatched ? undefined : () => setMode('watched')}
                  disabled={loading || alreadyWatched}
                  className="btn btn-primary"
                  style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 8,
                    opacity: alreadyWatched ? 0.6 : 1,
                    cursor: alreadyWatched ? 'default' : 'pointer' }}>
                  {alreadyWatched ? 'Watched' : 'Mark as Watched'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* TV season ratings */}
                {isTV && seasonRatings.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      Season Ratings
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6,
                      maxHeight: 200, overflowY: 'auto', paddingRight: 2 }}>
                      {seasonRatings.map((s, i) => (
                        <div key={s.season} style={{
                          display: 'flex', gap: 8, alignItems: 'center',
                          background: 'var(--bg3)', borderRadius: 6, padding: '6px 10px'
                        }}>
                          <span style={{ fontSize: 12, color: 'var(--text2)', minWidth: 56, fontWeight: 600 }}>
                            S{s.season}
                          </span>
                          <input type="number" min="0" max="10" step="0.1"
                            placeholder="Rating"
                            value={s.rating}
                            onChange={e => updateSeasonRating(i, 'rating', e.target.value)}
                            style={{ width: 66, padding: '4px 7px',
                              background: 'var(--bg2)', border: '1px solid var(--border)',
                              borderRadius: 5, color: 'var(--text)', fontSize: 12 }} />
                          <input type="text" placeholder="Notes"
                            value={s.remarks}
                            onChange={e => updateSeasonRating(i, 'remarks', e.target.value)}
                            style={{ flex: 1, padding: '4px 7px',
                              background: 'var(--bg2)', border: '1px solid var(--border)',
                              borderRadius: 5, color: 'var(--text)', fontSize: 12 }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
                      Overall rating auto-calculated if left blank below.
                    </div>
                  </div>
                )}
                {isTV && mode === 'watched' && !seasonRatings.length && (
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>Loading seasons...</div>
                )}

                <label style={{ fontSize: 13, color: 'var(--text2)' }}>
                  {isTV ? 'Overall Rating (optional)' : 'Rating (0–10)'}
                  <input type="number" min="0" max="10" step="0.1" value={rating}
                    onChange={e => setRating(e.target.value)}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px',
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      borderRadius: 6, color: 'var(--text)' }} />
                </label>
                <label style={{ fontSize: 13, color: 'var(--text2)' }}>
                  Remarks
                  <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px',
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      borderRadius: 6, color: 'var(--text)', resize: 'vertical' }} />
                </label>
                <label style={{ fontSize: 13, color: 'var(--text2)' }}>
                  Rewatch Value
                  <select value={rewatch} onChange={e => setRewatch(e.target.value)}
                    style={{ display: 'block', width: '100%', marginTop: 4, padding: '7px 10px',
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      borderRadius: 6, color: 'var(--text)' }}>
                    <option value="">-- Select --</option>
                    <option>Yes</option><option>Maybe</option><option>No</option>
                  </select>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleWatched} disabled={loading} className="btn btn-primary">
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setMode(null)} className="btn btn-ghost">Back</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 16, background: 'none',
          border: 'none', color: 'var(--text2)', fontSize: 22, cursor: 'pointer'
        }}>×</button>
      </div>
    </div>
  );
}
