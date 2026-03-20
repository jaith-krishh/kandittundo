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

  useEffect(() => {
    const type = movie.media_type || 'movie';
    getTrailer(movie.movie_id, type).then(d => setTrailer(d.key)).catch(() => {});

    // Fetch overview/rating live if not stored
    if (!movie.overview && movie.movie_id) {
      axios.get(`${API_URL}/tmdb/details/${type}/${movie.movie_id}`)
        .then(r => {
          if (r.data.overview) setOverview(r.data.overview);
          if (r.data.tmdb_rating) setTmdbRating(r.data.tmdb_rating);
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

  const handleSave = async () => {
    if (movie.status === 'watchlist') {
      await markWatched(movie._id, { rating: Number(rating), remarks, rewatch_value: rewatch || null });
    } else {
      await editMovie(movie._id, { rating: Number(rating), remarks, rewatch_value: rewatch || null });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (confirm('Remove this movie?')) { await removeMovie(movie._id); onClose(); }
  };

  const fadeStyle = {
    transition: 'opacity 0.2s ease',
    opacity: transitioning ? 0 : 1
  };

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
        <button onClick={handleSave} className="btn btn-primary">Save</button>
        <button onClick={goBack} className="btn btn-ghost">Back</button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: 20, padding: 24 }}>
          {/* Poster */}
          {movie.poster_url
            ? <img src={movie.poster_url} alt={movie.title}
                style={{ width: 140, height: 210, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
            : <div style={{ width: 140, height: 210, background: 'var(--bg3)', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                color: 'var(--text2)', fontSize: 13 }}>No poster</div>
          }

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{movie.title}</h2>
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

                {/* Watchlist: show Watched + Remove */}
                {movie.status === 'watchlist' && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={goToRate} className="btn btn-primary">Watched</button>
                    {trailer && (
                      <a href={`https://www.youtube.com/watch?v=${trailer}`} target="_blank" rel="noreferrer"
                        className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', alignSelf: 'center' }}>Trailer</a>
                    )}
                    <button onClick={handleDelete} className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--accent)' }}>Remove</button>
                  </div>
                )}

                {/* Watched: show rating/remarks summary + Edit */}
                {movie.status === 'watched' && (
                  <div>
                    {movie.rating != null && (
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', marginBottom: 6 }}>
                        {movie.rating} / 10
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
            {view === 'rate' && ratingForm}
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
