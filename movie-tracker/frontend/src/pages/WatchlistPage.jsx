import React, { useEffect, useState } from 'react';
import { useMovies } from '../context/MovieContext';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';

export default function WatchlistPage() {
  const { movies, fetchMovies, loading, removeMovie } = useMovies();
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchMovies({ status: 'watchlist' }); }, []);

  const watchlist = movies.filter(m => m.status === 'watchlist');

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        Watchlist <span style={{ color: 'var(--text2)', fontSize: 16 }}>({watchlist.length})</span>
      </h1>

      {loading && <p style={{ color: 'var(--text2)' }}>Loading...</p>}

      {!loading && watchlist.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
          <p>Your watchlist is empty. Search for movies above to add them.</p>
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
              <button onClick={() => setSelected(m)} className="btn btn-primary btn-sm">
                Mark Watched
              </button>
            }
          />
        ))}
      </div>

      {selected && <MovieModal movie={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
