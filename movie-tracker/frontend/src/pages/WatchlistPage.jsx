import React, { useEffect, useState } from 'react';
import { useMovies } from '../context/MovieContext';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';

export default function WatchlistPage() {
  const { movies, fetchMovies, loading, removeMovie } = useMovies();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'ongoing'
  const [mediaType, setMediaType] = useState('all');

  useEffect(() => { fetchMovies({ status: 'watchlist' }); }, []);

  const allWatchlist = movies.filter(m => m.status === 'watchlist')
    .filter(m => mediaType === 'all' || m.media_type === mediaType);
  const ongoingCount = allWatchlist.filter(m => m.watch_status === 'ongoing').length;
  const watchlist = filter === 'ongoing'
    ? allWatchlist.filter(m => m.watch_status === 'ongoing')
    : allWatchlist;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>
          Watchlist <span style={{ color: 'var(--text2)', fontSize: 16 }}>({watchlist.length})</span>
        </h1>
        {/* Media type toggle */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[['all', 'All'], ['movie', 'Films'], ['tv', 'TV']].map(([val, label]) => (
            <button key={val} onClick={() => setMediaType(val)}
              className="btn btn-ghost btn-sm"
              style={{
                background: mediaType === val ? 'var(--accent)' : 'transparent',
                color: mediaType === val ? '#fff' : 'var(--text2)',
                borderColor: mediaType === val ? 'var(--accent)' : 'var(--border)',
              }}>
              {label}
            </button>
          ))}
        </div>
        {ongoingCount > 0 && (
          <button
            onClick={() => setFilter(f => f === 'ongoing' ? 'all' : 'ongoing')}
            className="btn btn-ghost btn-sm"
            style={{
              borderColor: filter === 'ongoing' ? '#4fc3f7' : 'var(--border)',
              color: filter === 'ongoing' ? '#4fc3f7' : 'var(--text2)',
              background: filter === 'ongoing' ? 'rgba(79,195,247,0.08)' : 'transparent',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: '#4fc3f7',
              display: 'inline-block', flexShrink: 0,
              boxShadow: filter === 'ongoing' ? '0 0 6px #4fc3f7' : 'none'
            }} />
            Ongoing ({ongoingCount})
          </button>
        )}
      </div>

      {loading && <p style={{ color: 'var(--text2)' }}>Loading...</p>}

      {!loading && watchlist.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
          <p>{filter === 'ongoing' ? 'No ongoing TV shows.' : 'Your watchlist is empty. Search for movies above to add them.'}</p>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 16
      }}>
        {watchlist.map(m => (
          <MovieCard key={m._id} movie={m} onClick={() => setSelected(m)}
            actions={
              <>
                {m.watch_status === 'ongoing' && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 3,
                    background: 'rgba(79,195,247,0.1)', color: '#4fc3f7',
                    border: '1px solid rgba(79,195,247,0.3)', alignSelf: 'center'
                  }}>Ongoing</span>
                )}
                <button onClick={() => setSelected(m)} className="btn btn-primary btn-sm">
                  {m.watch_status === 'ongoing' ? 'Continue' : 'Mark Watched'}
                </button>
              </>
            }
          />
        ))}
      </div>

      {selected && <MovieModal movie={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
