import React, { useEffect, useState } from 'react';
import { getPublicProfile } from '../api';

export default function PublicProfilePage({ username }) {
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <span className="loader"></span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <h2 style={{ marginBottom: 16 }}>Oops!</h2>
        <p style={{ color: 'var(--text2)' }}>{error}</p>
        <a href="/" className="btn btn-primary" style={{ marginTop: 24, textDecoration: 'none' }}>Go Home</a>
      </div>
    );
  }

  const { profile, stats, topMovies, recentMovies } = data;

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

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Logo */}
      <div style={{ marginBottom: 40 }}>
        <a href="/" style={{ textDecoration: 'none', color: 'white', fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>
          kandittundo<span style={{ color: 'var(--accent)' }}>?</span>
        </a>
      </div>

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
          <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
            <div style={{ background: 'var(--bg3)', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
              <span style={{ color: 'var(--accent)' }}>{stats.totalWatched}</span> Watched
            </div>
          </div>
        </div>
      </div>

      {/* Top Movies */}
      {topMovies.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>Top Ranked</h2>
          {renderMovieGrid(topMovies, true)}
        </div>
      )}

      {/* Recent Watches */}
      {recentMovies.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>Recently Watched</h2>
          {renderMovieGrid(recentMovies)}
        </div>
      )}

      {/* Footer CTA */}
      <div style={{ marginTop: 'auto', paddingTop: 60, paddingBottom: 20, textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '32px 20px', background: 'rgba(229, 9, 20, 0.05)', borderColor: 'rgba(229, 9, 20, 0.2)' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 20 }}>Create your own movie list</h3>
          <p style={{ color: 'var(--text2)', margin: '0 0 20px 0', fontSize: 14 }}>Track, rate, and rank everything you watch.</p>
          <a href="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>Get Started Free</a>
        </div>
      </div>

    </div>
  );
}
