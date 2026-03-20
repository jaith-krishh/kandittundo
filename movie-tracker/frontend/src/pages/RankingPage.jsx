import React, { useEffect, useState } from 'react';
import { useMovies } from '../context/MovieContext';

export default function RankingPage() {
  const { movies, fetchMovies } = useMovies();
  const [unratedOnly, setUnratedOnly] = useState(false);

  useEffect(() => { fetchMovies({ status: 'watched' }); }, []);

  const watched = movies.filter(m => m.status === 'watched');
  const rated = [...watched.filter(m => m.rating != null)].sort((a, b) => b.rating - a.rating);
  const unrated = watched.filter(m => m.rating == null);

  const displayList = unratedOnly ? unrated : rated;

  if (watched.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
      <p>No watched movies to rank yet.</p>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Ranking</h1>
        {unrated.length > 0 && (
          <button
            onClick={() => setUnratedOnly(o => !o)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: `1px solid ${unratedOnly ? 'var(--accent)' : 'var(--border)'}`,
              background: unratedOnly ? 'var(--accent)' : 'var(--bg2)',
              color: unratedOnly ? '#fff' : 'var(--text2)',
              fontWeight: 500, transition: 'all 0.15s'
            }}
          >
            Unrated ({unrated.length})
          </button>
        )}
      </div>

      {displayList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text2)', fontSize: 14 }}>
          {unratedOnly ? 'No unrated movies.' : 'No rated movies yet.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayList.map((m, i) => (
            <div key={m._id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 14px'
            }}>
              <span style={{
                color: unratedOnly ? 'var(--text2)' : 'var(--accent)',
                fontWeight: 700, fontSize: 18, minWidth: 28
              }}>
                {unratedOnly ? '—' : `#${i + 1}`}
              </span>
              {m.poster_url
                ? <img src={m.poster_url} alt={m.title} style={{ width: 36, height: 54, objectFit: 'cover', borderRadius: 4 }} />
                : <div style={{ width: 36, height: 54, background: 'var(--bg3)', borderRadius: 4 }} />
              }
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{m.release_year}</div>
              </div>
              {!unratedOnly && (
                <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{m.rating}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
