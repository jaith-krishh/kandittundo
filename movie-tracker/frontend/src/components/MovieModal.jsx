import React, { useState, useEffect } from 'react';
import { useMovies } from '../context/MovieContext';
import { getTrailer } from '../api';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function MovieModal({ movie, onClose }) {
  const { markWatched, editMovie, removeMovie } = useMovies();
  const [view, setView] = useState('info');
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(movie.rating ?? '');
  const [remarks, setRemarks] = useState(movie.remarks || '');
  const [rewatch, setRewatch] = useState(movie.rewatch_value || '');
  const [trailer, setTrailer] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [overview, setOverview] = useState(movie.overview || '');
  const [tmdbRating, setTmdbRating] = useState(movie.tmdb_rating || null);

  const isTV = movie.media_type === 'tv';
  const [totalSeasons, setTotalSeasons] = useState(movie.total_seasons || null);

  // Season rows: { season, watched: bool, rating: string, remarks: string }
  const [seasonRows, setSeasonRows] = useState(() => {
    if (movie.season_ratings?.length && movie.total_seasons) {
      return Array.from({ length: movie.total_seasons }, (_, i) => {
        const existing = movie.season_ratings.find(s => s.season === i + 1);
        return {
          season: i + 1,
          watched: !!existing,
          rating: existing?.rating ?? '',
          remarks: existing?.remarks ?? ''
        };
      });
    }
    return [];
  });

  // isMultiSeason is true once totalSeasons is known and > 1
  const isMultiSeason = isTV && (totalSeasons > 1 || (movie.total_seasons || 0) > 1);

  useEffect(() => {
    const type = movie.media_type || 'movie';
    getTrailer(movie.movie_id, type).then(d => setTrailer(d.key)).catch(() => {});

    if (movie.movie_id) {
      axios.get(`${API_URL}/tmdb/details/${type}/${movie.movie_id}`)
        .then(r => {
          if (r.data.overview) setOverview(r.data.overview);
          if (r.data.tmdb_rating) setTmdbRating(r.data.tmdb_rating);
          if (r.data.total_seasons && isTV) {
            const ts = r.data.total_seasons;
            setTotalSeasons(ts);
            // Always rebuild rows from TMDB total, merging saved season_ratings
            setSeasonRows(Array.from({ length: ts }, (_, i) => {
              const existing = movie.season_ratings?.find(s => s.season === i + 1);
              return {
                season: i + 1,
                watched: !!existing,
                rating: existing?.rating ?? '',
                remarks: existing?.remarks ?? ''
              };
            }));
          }
        }).catch(() => {});
    }
  }, [movie.movie_id]);

  const goToRate = () => {
    setTransitioning(true);
    setTimeout(() => { setView('rate'); setTransitioning(false); }, 200);
  };

  const goBack = () => {
    setTransitioning(true);
    setTimeout(() => { setView('info'); setEditing(false); setTransitioning(false); }, 200);
  };

  const updateRow = (idx, field, val) =>
    setSeasonRows(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));

  const buildPayload = (watch_status) => {
    const cleaned = seasonRows
      .filter(s => s.watched && s.rating !== '' && s.rating != null)
      .map(s => ({ season: s.season, rating: Number(s.rating), remarks: s.remarks || '' }));

    const payload = {
      remarks,
      rewatch_value: rewatch || null,
      season_ratings: cleaned,
      total_seasons: totalSeasons || seasonRows.length,
      watch_status
    };

    // Overall rating: manual override or avg of rated seasons
    if (rating !== '' && rating != null) {
      payload.rating = Number(rating);
    } else if (cleaned.length) {
      payload.rating = Math.round(cleaned.reduce((s, r) => s + r.rating, 0) / cleaned.length * 10) / 10;
    } else {
      payload.rating = null;
    }

    return payload;
  };

  // For multi-season TV on watchlist: save progress without moving to watched
  const handleSaveProgress = async () => {
    const cleaned = seasonRows
      .filter(s => s.watched && s.rating !== '' && s.rating != null)
      .map(s => ({ season: s.season, rating: Number(s.rating), remarks: s.remarks || '' }));
    await editMovie(movie._id, {
      season_ratings: cleaned,
      total_seasons: totalSeasons || seasonRows.length,
      watch_status: 'ongoing'
    });
    onClose();
  };

  // Completed all seasons → move to watched
  const handleCompleted = async () => {
    await markWatched(movie._id, buildPayload('completed'));
    onClose();
  };

  // Dropped mid-way → move to watched with drop status
  const handleDropped = async () => {
    if (!confirm('Mark as dropped? This will move it to your Watched list.')) return;
    await markWatched(movie._id, buildPayload('dropped'));
    onClose();
  };

  // Non-TV or single-season save
  const handleSave = async () => {
    const payload = {
      rating: rating !== '' ? Number(rating) : null,
      remarks,
      rewatch_value: rewatch || null
    };
    if (movie.status === 'watchlist') {
      await markWatched(movie._id, payload);
    } else {
      await editMovie(movie._id, payload);
    }
    onClose();
  };

  // Edit save for multi-season watched show
  const handleEditSave = async () => {
    const cleaned = seasonRows
      .filter(s => s.watched && s.rating !== '' && s.rating != null)
      .map(s => ({ season: s.season, rating: Number(s.rating), remarks: s.remarks || '' }));
    let overallRating = rating !== '' ? Number(rating) : null;
    if (!overallRating && cleaned.length) {
      overallRating = Math.round(cleaned.reduce((s, r) => s + r.rating, 0) / cleaned.length * 10) / 10;
    }
    await editMovie(movie._id, {
      rating: overallRating, remarks, rewatch_value: rewatch || null,
      season_ratings: cleaned, total_seasons: totalSeasons || seasonRows.length,
      watch_status: movie.watch_status
    });
    onClose();
  };

  const handleDelete = async () => {
    if (confirm('Remove this?')) { await removeMovie(movie._id); onClose(); }
  };

  const fadeStyle = { transition: 'opacity 0.2s ease', opacity: transitioning ? 0 : 1 };

  const watchedSeasons = seasonRows.filter(s => s.watched).length;

  // ── Season tracker form (multi-season TV on watchlist) ──
  const seasonTracker = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, ...fadeStyle }}>
      <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        Season Progress
        <span style={{ color: 'var(--text2)', fontWeight: 400, marginLeft: 8 }}>
          {watchedSeasons}/{totalSeasons || seasonRows.length} watched
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6,
        maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
        {seasonRows.map((s, i) => (
          <div key={s.season} style={{
            display: 'flex', gap: 8, alignItems: 'center',
            background: s.watched ? 'rgba(70,211,105,0.06)' : 'var(--bg3)',
            border: `1px solid ${s.watched ? 'rgba(70,211,105,0.2)' : 'var(--border)'}`,
            borderRadius: 7, padding: '8px 10px',
            transition: 'all 0.15s'
          }}>
            {/* Watched checkbox */}
            <input type="checkbox" checked={s.watched}
              onChange={e => updateRow(i, 'watched', e.target.checked)}
              style={{ width: 15, height: 15, accentColor: 'var(--green)', flexShrink: 0, cursor: 'pointer' }} />
            <span style={{ fontSize: 12, fontWeight: 600, minWidth: 28,
              color: s.watched ? 'var(--text)' : 'var(--text2)' }}>
              S{s.season}
            </span>
            <input type="number" min="0" max="10" step="0.1"
              placeholder="Rating"
              value={s.rating}
              disabled={!s.watched}
              onChange={e => updateRow(i, 'rating', e.target.value)}
              style={{
                width: 70, padding: '5px 8px',
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 5, color: 'var(--text)', fontSize: 12,
                opacity: s.watched ? 1 : 0.4
              }} />
            <input type="text" placeholder="Notes"
              value={s.remarks}
              disabled={!s.watched}
              onChange={e => updateRow(i, 'remarks', e.target.value)}
              style={{
                flex: 1, padding: '5px 8px',
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 5, color: 'var(--text)', fontSize: 12,
                opacity: s.watched ? 1 : 0.4
              }} />
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
        Overall rating auto-calculated from rated seasons.
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
        {/* Save progress — stays in watchlist */}
        <button onClick={handleSaveProgress} className="btn btn-ghost btn-sm">
          Save Progress
        </button>
        {/* Completed all seasons */}
        <button onClick={handleCompleted} className="btn btn-primary btn-sm">
          Completed
        </button>
        {/* Dropped */}
        <button onClick={handleDropped} className="btn btn-ghost btn-sm"
          style={{ color: 'var(--accent)', borderColor: 'var(--accent)', marginLeft: 'auto' }}>
          End Watch
        </button>
      </div>
      <button onClick={goBack} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>Back</button>
    </div>
  );

  // ── Standard rating form (movies + single-season TV) ──
  const ratingForm = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...fadeStyle }}>
      <label style={{ fontSize: 13, color: 'var(--text2)' }}>
        Rating (0–10)
        <input type="number" min="0" max="10" step="0.1" value={rating}
          onChange={e => setRating(e.target.value)}
          style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 10px',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 6, color: 'var(--text)' }} />
      </label>
      <label style={{ fontSize: 13, color: 'var(--text2)' }}>
        Remarks
        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
          style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 10px',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 6, color: 'var(--text)', resize: 'vertical' }} />
      </label>
      <label style={{ fontSize: 13, color: 'var(--text2)' }}>
        Rewatch Value
        <select value={rewatch} onChange={e => setRewatch(e.target.value)}
          style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 10px',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 6, color: 'var(--text)' }}>
          <option value="">-- Select --</option>
          <option>Yes</option><option>Maybe</option><option>No</option>
        </select>
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={editing ? handleEditSave : handleSave} className="btn btn-primary">Save</button>
        <button onClick={goBack} className="btn btn-ghost">Back</button>
      </div>
    </div>
  );

  // ── Edit form for multi-season watched show ──
  const editSeasonForm = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, ...fadeStyle }}>
      <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        Edit Season Ratings
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6,
        maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
        {seasonRows.map((s, i) => (
          <div key={s.season} style={{
            display: 'flex', gap: 8, alignItems: 'center',
            background: s.watched ? 'rgba(70,211,105,0.06)' : 'var(--bg3)',
            border: `1px solid ${s.watched ? 'rgba(70,211,105,0.2)' : 'var(--border)'}`,
            borderRadius: 7, padding: '8px 10px'
          }}>
            <input type="checkbox" checked={s.watched}
              onChange={e => updateRow(i, 'watched', e.target.checked)}
              style={{ width: 15, height: 15, accentColor: 'var(--green)', flexShrink: 0, cursor: 'pointer' }} />
            <span style={{ fontSize: 12, fontWeight: 600, minWidth: 28,
              color: s.watched ? 'var(--text)' : 'var(--text2)' }}>S{s.season}</span>
            <input type="number" min="0" max="10" step="0.1" placeholder="Rating"
              value={s.rating} disabled={!s.watched}
              onChange={e => updateRow(i, 'rating', e.target.value)}
              style={{ width: 70, padding: '5px 8px', background: 'var(--bg2)',
                border: '1px solid var(--border)', borderRadius: 5,
                color: 'var(--text)', fontSize: 12, opacity: s.watched ? 1 : 0.4 }} />
            <input type="text" placeholder="Notes" value={s.remarks} disabled={!s.watched}
              onChange={e => updateRow(i, 'remarks', e.target.value)}
              style={{ flex: 1, padding: '5px 8px', background: 'var(--bg2)',
                border: '1px solid var(--border)', borderRadius: 5,
                color: 'var(--text)', fontSize: 12, opacity: s.watched ? 1 : 0.4 }} />
          </div>
        ))}
      </div>
      <label style={{ fontSize: 13, color: 'var(--text2)' }}>
        Overall Rating (optional)
        <input type="number" min="0" max="10" step="0.1" value={rating}
          onChange={e => setRating(e.target.value)}
          style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 10px',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 6, color: 'var(--text)' }} />
      </label>
      <label style={{ fontSize: 13, color: 'var(--text2)' }}>
        Remarks
        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2}
          style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 10px',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 6, color: 'var(--text)', resize: 'vertical' }} />
      </label>
      <label style={{ fontSize: 13, color: 'var(--text2)' }}>
        Rewatch Value
        <select value={rewatch} onChange={e => setRewatch(e.target.value)}
          style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 10px',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 6, color: 'var(--text)' }}>
          <option value="">-- Select --</option>
          <option>Yes</option><option>Maybe</option><option>No</option>
        </select>
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleEditSave} className="btn btn-primary">Save</button>
        <button onClick={goBack} className="btn btn-ghost">Back</button>
      </div>
    </div>
  );

  const STATUS_BADGE = {
    dropped: { label: 'Dropped', bg: '#3a1a1a', border: 'var(--accent)', color: 'var(--accent)' },
    completed: { label: 'Completed', bg: '#1a3a1a', border: '#4caf50', color: '#4caf50' },
    ongoing: { label: 'Ongoing', bg: '#1a2a3a', border: '#4fc3f7', color: '#4fc3f7' },
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: 20, padding: 24 }}>
          {movie.poster_url
            ? <img src={movie.poster_url} alt={movie.title}
                style={{ width: 140, height: 210, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
            : <div style={{ width: 140, height: 210, background: 'var(--bg3)', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                color: 'var(--text2)', fontSize: 13 }}>No poster</div>
          }

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{movie.title}</h2>
              {movie.watch_status && STATUS_BADGE[movie.watch_status] && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, marginTop: 3,
                  background: STATUS_BADGE[movie.watch_status].bg,
                  border: `1px solid ${STATUS_BADGE[movie.watch_status].border}`,
                  color: STATUS_BADGE[movie.watch_status].color, flexShrink: 0
                }}>
                  {STATUS_BADGE[movie.watch_status].label}
                </span>
              )}
            </div>

            <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 8 }}>{movie.release_year}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {movie.genres.map(g => <span key={g} className="badge">{g}</span>)}
            </div>
            {tmdbRating && (
              <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600, marginBottom: 8 }}>
                IMDb {tmdbRating} / 10
              </div>
            )}

            {/* Info view */}
            {(view === 'info' && !editing) && (
              <div style={fadeStyle}>
                {overview && (
                  <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 14,
                    display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {overview}
                  </p>
                )}

                {movie.status === 'watchlist' && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={goToRate} className="btn btn-primary">
                      {isMultiSeason ? 'Track Seasons' : 'Watched'}
                    </button>
                    {trailer && (
                      <a href={`https://www.youtube.com/watch?v=${trailer}`} target="_blank" rel="noreferrer"
                        className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', alignSelf: 'center' }}>Trailer</a>
                    )}
                    <button onClick={handleDelete} className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--accent)' }}>Remove</button>
                  </div>
                )}

                {movie.status === 'watched' && (
                  <div>
                    {movie.rating != null && (
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', marginBottom: 6 }}>
                        {movie.rating} / 10
                      </div>
                    )}

                    {/* Season ratings display */}
                    {isTV && movie.season_ratings?.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                          Seasons
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {movie.season_ratings.map(s => (
                            <div key={s.season} style={{
                              background: 'var(--bg3)', borderRadius: 6, padding: '4px 10px', fontSize: 12
                            }}>
                              <span style={{ color: 'var(--text2)' }}>S{s.season} </span>
                              <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{s.rating}</span>
                              {s.remarks && <span style={{ color: 'var(--text2)', marginLeft: 4 }}>· {s.remarks}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {movie.remarks && (
                      <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 8 }}>{movie.remarks}</p>
                    )}
                    {movie.rewatch_value && (
                      <div style={{ fontSize: 13, marginBottom: 8 }}>Rewatch: <strong>{movie.rewatch_value}</strong></div>
                    )}
                    {movie.date_watched && (
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>
                        Watched: {new Date(movie.date_watched).toLocaleDateString()}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => { setEditing(true); goToRate(); }} className="btn btn-ghost btn-sm">Edit</button>
                      {trailer && (
                        <a href={`https://www.youtube.com/watch?v=${trailer}`} target="_blank" rel="noreferrer"
                          className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>Trailer</a>
                      )}
                      <button onClick={handleDelete} className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--accent)' }}>Remove</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Rate view */}
            {view === 'rate' && (
              isMultiSeason
                ? (editing ? editSeasonForm : seasonTracker)
                : ratingForm
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
