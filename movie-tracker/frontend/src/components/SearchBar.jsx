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

// Top 4 pinned, rest alphabetical
const LANG_OPTIONS = [
  { code: '', label: 'All Languages' },
  { code: 'en', label: 'English' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'te', label: 'Telugu' },
  { code: 'zh', label: 'Chinese' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'es', label: 'Spanish' },
  { code: 'th', label: 'Thai' },
  { code: 'tr', label: 'Turkish' },
];

// Pinned languages shown at top always
const PINNED = ['en', 'ml', 'hi', 'ta'];

function LangPicker({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropRef = useRef();
  const searchRef = useRef();

  useEffect(() => {
    const handler = (e) => { if (!dropRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
    else setSearch('');
  }, [open]);

  const selected = LANG_OPTIONS.find(l => l.code === lang) || LANG_OPTIONS[0];

  const pinned = LANG_OPTIONS.filter(l => PINNED.includes(l.code));
  const rest = LANG_OPTIONS.filter(l => l.code !== '' && !PINNED.includes(l.code));

  const filtered = search.trim()
    ? LANG_OPTIONS.filter(l => l.label.toLowerCase().includes(search.toLowerCase()))
    : null;

  const pick = (code) => { setLang(code); setOpen(false); setSearch(''); };

  return (
    <div ref={dropRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '13px 12px',
          background: 'var(--bg2)',
          border: `1px solid ${lang ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 10, color: lang ? 'var(--text)' : 'var(--text2)',
          fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
          transition: 'border-color 0.2s'
        }}
      >
        {selected.label}
        <svg width="10" height="10" viewBox="0 0 10 10" style={{ opacity: 0.5, flexShrink: 0 }}>
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 10, zIndex: 300, width: 200,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden'
        }}>
          {/* Search input */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search language..."
              style={{
                width: '100%', padding: '6px 8px', boxSizing: 'border-box',
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 6, color: 'var(--text)', fontSize: 12, outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {filtered ? (
              // Search results
              filtered.length === 0
                ? <div style={{ padding: '12px', fontSize: 12, color: 'var(--text2)', textAlign: 'center' }}>No match</div>
                : filtered.map(l => (
                  <LangOption key={l.code} l={l} active={lang === l.code} onClick={() => pick(l.code)} />
                ))
            ) : (
              <>
                {/* All Languages */}
                <LangOption l={LANG_OPTIONS[0]} active={lang === ''} onClick={() => pick('')} />
                {/* Pinned divider */}
                <div style={{ padding: '4px 12px', fontSize: 10, color: 'var(--text2)',
                  textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--bg3)' }}>
                  Popular
                </div>
                {pinned.map(l => (
                  <LangOption key={l.code} l={l} active={lang === l.code} onClick={() => pick(l.code)} />
                ))}
                {/* Rest */}
                <div style={{ padding: '4px 12px', fontSize: 10, color: 'var(--text2)',
                  textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--bg3)' }}>
                  More
                </div>
                {rest.map(l => (
                  <LangOption key={l.code} l={l} active={lang === l.code} onClick={() => pick(l.code)} />
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LangOption({ l, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '9px 14px', fontSize: 13, cursor: 'pointer',
        color: active ? 'var(--accent)' : 'var(--text)',
        background: active ? 'rgba(229,9,20,0.08)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'background 0.1s'
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg3)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {l.label}
      {active && <span style={{ fontSize: 10 }}>✓</span>}
    </div>
  );
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [lang, setLang] = useState('');
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

    const cacheKey = lang ? `${query}::${lang}` : query;
    const cached = getCached(cacheKey);
    if (cached) { setResults(cached); setOpen(true); return; }

    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchTMDB(query, lang);
        setCached(cacheKey, data);
        setResults(data);
        setOpen(true);
      } catch {
        setError('Search failed. Check your connection.');
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer.current);
  }, [query, lang]);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (movie) => { setOpen(false); setPreview(movie); };

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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Search input */}
          <div style={{ position: 'relative', flex: 1 }}>
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
                boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
            />
            {loading ? (
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text2)', fontSize: 12 }}>searching...</span>
            ) : query.length > 0 && (
              <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)',
                  fontSize: 18, lineHeight: 1, padding: '0 2px' }}>×</button>
            )}
          </div>

          {/* Searchable language picker */}
          <LangPicker lang={lang} setLang={(val) => { setLang(val); setResults([]); setOpen(false); }} />
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
