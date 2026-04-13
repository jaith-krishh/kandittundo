import React, { useEffect, useState } from 'react';
import { useMovies } from '../context/MovieContext';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';

const ALL_GENRES = ['Action','Adventure','Animation','Comedy','Crime','Documentary',
  'Drama','Family','Fantasy','History','Horror','Music','Mystery','Romance','Sci-Fi','Thriller','War','Western'];

export default function WatchedPage() {
  const { movies, fetchMovies, loading } = useMovies();
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState('date_watched');
  const [sortOrder, setSortOrder] = useState('desc');
  const [genres, setGenres] = useState([]);
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [rewatch, setRewatch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [searchQ, setSearchQ] = useState('');
  const [mediaType, setMediaType] = useState('all');

  useEffect(() => {
    fetchMovies({ status: 'watched', sortBy, sortOrder,
      genre: genres.length ? genres : undefined,
      minRating: minRating || undefined, maxRating: maxRating || undefined,
      rewatch: rewatch || undefined
    });
  }, [sortBy, sortOrder, genres, minRating, maxRating, rewatch]);

  const watched = movies.filter(m => m.status === 'watched')
    .filter(m => !searchQ || m.title.toLowerCase().includes(searchQ.toLowerCase()))
    .filter(m => mediaType === 'all' || m.media_type === mediaType);

  const toggleGenre = (g) => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>
          Watched <span style={{ color: 'var(--text2)', fontSize: 16 }}>({watched.length})</span>
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
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search watched..."
              style={{
                padding: '6px 10px 6px 28px', background: 'var(--bg2)',
                border: '1px solid var(--border)', borderRadius: 6,
                color: 'var(--text)', fontSize: 13, outline: 'none', width: 180,
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: '6px 10px', background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 6, color: 'var(--text)', fontSize: 13 }}>
            <option value="date_watched">Date Watched</option>
            <option value="rating">Rating</option>
            <option value="rank">Rank</option>
          </select>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
            style={{ padding: '6px 10px', background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 6, color: 'var(--text)', fontSize: 13 }}>
            <option value="desc">↓ Desc</option>
            <option value="asc">↑ Asc</option>
          </select>
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-ghost btn-sm">
            Filters {(genres.length || minRating || maxRating || rewatch) ? '●' : ''}
          </button>
        </div>
      </div>

      {showFilters && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>Genres</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_GENRES.map(g => (
                <button key={g} onClick={() => toggleGenre(g)} className="btn btn-ghost btn-sm"
                  style={{ color: genres.includes(g) ? 'var(--accent)' : 'var(--text2)',
                    borderColor: genres.includes(g) ? 'var(--accent)' : 'var(--border)' }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ fontSize: 13, color: 'var(--text2)' }}>
              Min Rating
              <input type="number" min="0" max="10" value={minRating} onChange={e => setMinRating(e.target.value)}
                style={{ display: 'block', width: 80, marginTop: 4, padding: '6px 8px',
                  background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)' }} />
            </label>
            <label style={{ fontSize: 13, color: 'var(--text2)' }}>
              Max Rating
              <input type="number" min="0" max="10" value={maxRating} onChange={e => setMaxRating(e.target.value)}
                style={{ display: 'block', width: 80, marginTop: 4, padding: '6px 8px',
                  background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)' }} />
            </label>
            <label style={{ fontSize: 13, color: 'var(--text2)' }}>
              Rewatch
              <select value={rewatch} onChange={e => setRewatch(e.target.value)}
                style={{ display: 'block', marginTop: 4, padding: '6px 8px',
                  background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)' }}>
                <option value="">All</option>
                <option>Yes</option><option>Maybe</option><option>No</option>
              </select>
            </label>
            <button onClick={() => { setGenres([]); setMinRating(''); setMaxRating(''); setRewatch(''); }}
              className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-end' }}>Clear</button>
          </div>
        </div>
      )}

      {loading && <p style={{ color: 'var(--text2)' }}>Loading...</p>}

      {!loading && watched.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
          <p>No watched movies yet. Mark movies from your watchlist as watched.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
        {watched.map(m => (
          <MovieCard key={m._id} movie={m} onClick={() => setSelected(m)} />
        ))}
      </div>

      {selected && <MovieModal movie={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
