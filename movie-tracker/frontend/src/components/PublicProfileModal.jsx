import React, { useEffect, useState } from 'react';
import { getPublicProfile } from '../api';
import { createPortal } from 'react-dom';

export default function PublicProfileModal({ username, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicProfile(username)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        setError('User not found or profile is private.');
        setLoading(false);
      });
  }, [username]);

  if (typeof document === 'undefined') return null;

  if (loading) {
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
        <span className="loader"></span>
      </div>,
      document.body
    );
  }

  if (error || !data) {
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '40px', textAlign: 'center', maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <h2 style={{ marginBottom: 16 }}>Oops!</h2>
          <p style={{ color: 'var(--text2)' }}>{error}</p>
          <button onClick={onClose} className="btn btn-ghost" style={{ marginTop: 24 }}>Close</button>
        </div>
      </div>,
      document.body
    );
  }

  const { profile, stats, topMovies } = data;

  const renderMovieGrid = (movies, isRanked = false) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: 16,
      marginTop: 16
    }}>
      {movies.map(m => (
        <div key={m.movie_id} style={{ position: 'relative' }}>
          {isRanked && (
            <div style={{
              position: 'absolute', top: -8, left: -8, background: 'var(--gold)',
              color: 'black', width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 2
            }}>
              {m.rank}
            </div>
          )}
          {m.poster_url ? (
            <img src={m.poster_url} alt={m.title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 8, background: 'var(--bg3)' }} />
          ) : (
            <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--bg3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', padding: 12, textAlign: 'center', fontSize: 12 }}>
              {m.title}
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>{m.release_year}</span>
              {m.rating && <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>{m.rating}/10</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>×</button>

        <div style={{ padding: '40px' }}>
          {/* Profile Info */}
          <div className="glass-panel" style={{ padding: 32, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            {profile.avatar ? (
              <img src={profile.avatar} alt="Avatar" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'var(--text2)' }}>
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 4px 0' }}>{profile.displayName}</h1>
              <div style={{ color: 'var(--text2)', fontSize: 16 }}>@{profile.username}</div>
              
              {!data.isPrivate && (
                <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
                  <div style={{ background: 'var(--bg3)', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                    <span style={{ color: 'var(--accent)' }}>{stats?.totalWatched || 0}</span> Watched
                  </div>
                  {stats?.topGenre && (
                    <div style={{ background: 'var(--bg3)', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                      Top Genre: <span style={{ color: 'var(--gold)' }}>{stats.topGenre}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {data.isPrivate ? (
            <div style={{ marginTop: 48, textAlign: 'center', color: 'var(--text2)', padding: '40px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>This account is private</h2>
            <>
              {/* Top Movies */}
              {topMovies && topMovies.length > 0 && (
                <div style={{ marginTop: 48 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>Top 10 Rated</h2>
                  {renderMovieGrid(topMovies, true)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );


  );
}
