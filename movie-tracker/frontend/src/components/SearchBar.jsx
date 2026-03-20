import React, { useState, useEffect, useRef } from 'react';
import { searchTMDB } from '../api';
import { useMovies } from '../context/MovieContext';
import { getCached, setCached } from '../lib/searchCache';
import SearchPreviewModal from './SearchPreviewModal';

const LANG_LABEL = {
  en: 'English', ja: 'Japanese', ko: 'Korean', hi: 'Hindi',
  fr: 'French', es: 'Spanish', de: 'German', zh: 'Chinese',
  ta: 'Tamil', te: 'Telugu', ml: 'Malayalam', it: 'Italian',
  pt: 'Portuguese', ru: 'Russian', tr: 'Turkish', th: 'Thai'
};

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const { fetchMovies } = useMovies();
  const timer = useRef(null);
  const ref = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    setError('');
    if (query.length < 3) { setResults([]); setOpen(false); return; }

    const cached = getCached(query);
    if (cached) { setResults(cached); setOpen(true); return; }

    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchTMDB(query);
        setCached(query, data);
        setResults(data);
        setOpen(true);
      } catch {
        setError('Search failed. Check your connection.');
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer.current);
  }, [query]);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (movie) => {
    setOpen(false);
    setPreview(movie);
  };

  const handleAdded = () => {
    setQuery('');
    setResults([]);
    fetchMovies({ status: 'watchlist' });
  };

  const titleCounts = results.reduce((acc, m) => {
    acc[m.title] = (acc[m.title] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <div ref={ref} style={{ position: 'relative', marginBottom: 32, maxWidth: 600 }}>
        <div style={{ position: 'relative' }}>
          {/* Search icon */}
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(229,9,20,0.15)'; results.length && setOpen(true); }}
            onBlur={e => { e.target.style.borderColor = error ? 'var(--accent)' : 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            placeholder="Search movies & TV shows..."
            style={{
              width: '100%', padding: '13px 44px 13px 42px',
              background: 'var(--bg2)',
              border: `1px solid ${error ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 10, color: 'var(--text)', fontSize: 15, outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxShadow: 'none'
            }}
          />
          {loading ? (
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text2)', fontSize: 12 }}>searching...</span>
          ) : query.length > 0 && (
            <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)',
                fontSize: 18, lineHeight: 1, padding: '0 2px' }}>
              ×
            </button>
          )}
        </div>

        {error && <div style={{ color: 'var(--accent)', fontSize: 12, marginTop: 4 }}>{error}</div>}

        {open && results.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 10, zIndex: 200, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}>
            {results.map(m => (
              <div key={`${m.media_type}-${m.movie_id}`} onClick={() => handleSelect(m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {m.poster_url
                  ? <img src={m.poster_url} alt={m.title} loading="lazy"
                      style={{ width: 36, height: 54, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                  : <div style={{ width: 36, height: 54, background: 'var(--bg3)', borderRadius: 4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      color: 'var(--text2)', fontSize: 11 }}>?</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.title}
                    </span>
                    {titleCounts[m.title] > 1 && m.original_language && (
                      <span style={{ fontSize: 10, background: 'var(--bg3)', color: 'var(--text2)',
                        padding: '1px 5px', borderRadius: 3, flexShrink: 0 }}>
                        {LANG_LABEL[m.original_language] || m.original_language.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                    {m.release_year}{m.genres?.length ? ` · ${m.genres.slice(0, 2).join(', ')}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3,
                    background: m.media_type === 'tv' ? '#1a3a5c' : '#3a1a1a',
                    color: m.media_type === 'tv' ? '#4fc3f7' : 'var(--accent)'
                  }}>
                    {m.media_type === 'tv' ? 'TV' : 'FILM'}
                  </span>
                  {m.providers?.length > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--green)' }}>{m.providers.join(', ')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {open && !loading && results.length === 0 && query.length >= 3 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 10, zIndex: 200, padding: '20px', textAlign: 'center',
            color: 'var(--text2)', fontSize: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}>
            No results found for "{query}"
          </div>
        )}
      </div>

      {preview && (
        <SearchPreviewModal
          movie={preview}
          onClose={() => setPreview(null)}
          onAdded={handleAdded}
        />
      )}
    </>
  );
}
