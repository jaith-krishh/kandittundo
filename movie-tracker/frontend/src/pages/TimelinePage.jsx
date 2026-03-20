import React, { useEffect } from 'react';
import { useMovies } from '../context/MovieContext';

export default function TimelinePage() {
  const { movies, fetchMovies, loading } = useMovies();

  useEffect(() => { fetchMovies({ status: 'watched', sortBy: 'date_watched', sortOrder: 'desc' }); }, []);

  const watched = movies.filter(m => m.status === 'watched' && m.date_watched);

  // Group by month
  const grouped = watched.reduce((acc, m) => {
    const key = new Date(m.date_watched).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  if (loading) return <p style={{ color: 'var(--text2)' }}>Loading...</p>;

  if (watched.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
      <p>No watched movies yet.</p>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Timeline</h1>
      {Object.entries(grouped).map(([month, films]) => (
        <div key={month} style={{ marginBottom: 32 }}>
          <div style={{
            fontSize: 14, fontWeight: 600, color: 'var(--accent)',
            marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)'
          }}>{month}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {films.map(m => (
              <div key={m._id} style={{
                display: 'flex', gap: 14, alignItems: 'center',
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '12px 16px'
              }}>
                <div style={{
                  width: 3, alignSelf: 'stretch', background: 'var(--accent)',
                  borderRadius: 2, flexShrink: 0
                }} />
                {m.poster_url
                  ? <img src={m.poster_url} alt={m.title} style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 4 }} />
                  : <div style={{ width: 40, height: 60, background: 'var(--bg3)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>?</div>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{m.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                    {new Date(m.date_watched).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  {m.genres.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                      {m.genres.slice(0, 3).map(g => <span key={g} className="badge">{g}</span>)}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {m.rating != null && <div style={{ color: 'var(--gold)', fontWeight: 700 }}>{m.rating}</div>}
                  {m.rewatch_value && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>Rewatch: {m.rewatch_value}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
