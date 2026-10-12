import React, { useState, useRef, useEffect, useMemo } from 'react';
import { lookupImport, addMoviesBulk, searchTMDB } from '../api';
import { useMovies } from '../context/MovieContext';
import { mediaKey } from '../lib/media';

const LOOKUP_CHUNK = 10;
const SAVE_CHUNK = 100;

// Minimal RFC 4180 CSV parser: handles quoted fields containing commas, "" quotes and newlines
function parseCSVRows(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.map(r => r.map(f => f.trim())).filter(r => r.some(Boolean));
}

// Header names used by Letterboxd, IMDb and hand-made CSVs, most specific first
const TITLE_COLS = ['name', 'title', 'film', 'movie'];
const YEAR_COLS = ['year', 'release year'];
const RATING_COLS = ['rating', 'your rating', 'my rating', 'myrating', 'score'];
const DATE_COLS = ['watched date', 'date watched', 'date rated', 'date'];

function parseCSV(text) {
  const rows = parseCSVRows(text.replace(/^\uFEFF/, ''));
  if (rows.length === 0) return [];
  const header = rows[0].map(c => c.toLowerCase());
  const hasHeader = header.some(c => TITLE_COLS.includes(c) || RATING_COLS.includes(c));
  const col = (names) => {
    if (!hasHeader) return -1;
    for (const name of names) {
      const idx = header.indexOf(name);
      if (idx >= 0) return idx;
    }
    return -1;
  };
  const titleCol = Math.max(col(TITLE_COLS), 0);
  const yearCol = col(YEAR_COLS);
  const ratingCol = col(RATING_COLS);
  const dateCol = col(DATE_COLS);

  const parsed = (hasHeader ? rows.slice(1) : rows).map(parts => {
    const title = parts[titleCol];
    if (!title) return null;
    const year = /^\d{4}$/.test(parts[yearCol] || '') ? parts[yearCol] : null;
    const rawRating = ratingCol >= 0 ? parseFloat(parts[ratingCol]) : NaN;
    const date = dateCol >= 0 && parts[dateCol] ? new Date(parts[dateCol]) : null;
    return {
      title, year,
      rawRating: Number.isFinite(rawRating) ? rawRating : null,
      date: date && !isNaN(date) ? date.toISOString() : null
    };
  }).filter(Boolean);

  // Decide the rating scale for the whole file: Letterboxd uses 0.5-5 stars, IMDb uses 1-10
  const ratings = parsed.map(p => p.rawRating).filter(r => r != null);
  const fivePointScale = ratings.length > 0 && Math.max(...ratings) <= 5;
  return parsed.map(({ rawRating, ...p }) => ({
    ...p,
    rating: rawRating == null ? null
      : Math.min(Math.max(fivePointScale ? Math.round(rawRating * 20) / 10 : rawRating, 0), 10)
  }));
}

// Inline search for unmatched items
function UnmatchedSearch({ onSelect }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef();

  useEffect(() => {
    clearTimeout(timer.current);
    if (q.length < 3) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchTMDB(q);
        setResults(data.slice(0, 5));
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 400);
  }, [q]);

  return (
    <div style={{ marginTop: 8 }}>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search to find the correct movie..."
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'rgb(28,28,30)', border: 'none', borderRadius: 6,
          color: '#fff', padding: '7px 10px', fontSize: 12, outline: 'none',
          boxShadow: '0 0 0 1px var(--border)'
        }}
        onFocus={e => e.target.style.boxShadow = '0 0 0 2px skyblue'}
        onBlur={e => e.target.style.boxShadow = '0 0 0 1px var(--border)'}
      />
      {searching && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>Searching...</div>}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
          {results.map(m => (
            <div key={mediaKey(m)} onClick={() => { onSelect(m); setQ(''); setResults([]); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                background: 'var(--bg3, #1a1a1a)', borderRadius: 6, cursor: 'pointer',
                border: '1px solid var(--border)'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {m.poster_url
                ? <img src={m.poster_url} alt="" style={{ width: 24, height: 36, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                : <div style={{ width: 24, height: 36, background: 'var(--bg2)', borderRadius: 3, flexShrink: 0 }} />
              }
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{m.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{m.release_year}{m.genres?.length ? ` · ${m.genres[0]}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ImportPage() {
  const [step, setStep] = useState('upload');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState('');
  const [summary, setSummary] = useState(null);
  const { allMovies, refreshAll } = useMovies();
  const fileRef = useRef();

  // Titles already in the user's list, to detect duplicates
  const existingKeys = useMemo(() => new Set(allMovies.map(mediaKey)), [allMovies]);
  const isDupeOf = (item) => item.selected && existingKeys.has(mediaKey(item.selected));

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // allow picking the same file again
    if (!file) return;
    const parsed = parseCSV(await file.text());
    if (parsed.length === 0) return alert('No movie titles found in file.');
    setLoading(true);
    let failedLookups = 0;
    const results = [];
    for (let i = 0; i < parsed.length; i += LOOKUP_CHUNK) {
      const chunk = parsed.slice(i, i + LOOKUP_CHUNK);
      setProgress(`Looking up titles ${i + 1}-${i + chunk.length} of ${parsed.length}...`);
      try {
        results.push(...await lookupImport(chunk.map(({ title, year }) => ({ title, year }))));
      } catch {
        // Keep going; these rows can still be matched by hand on the review screen
        failedLookups += chunk.length;
        results.push(...chunk.map(p => ({ rawTitle: p.title, status: 'unmatched', candidates: [] })));
      }
    }
    setItems(results.map((r, i) => ({
      ...r,
      addAs: parsed[i].rating != null ? 'watched' : 'watchlist',
      csvRating: parsed[i].rating,
      csvDate: parsed[i].date
    })));
    setLoading(false);
    setProgress('');
    setStep('reviewing');
    if (failedLookups) alert(`${failedLookups} titles could not be looked up (connection problem). You can search for them manually below.`);
  };

  const setSelected = (idx, movie) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, selected: movie, status: 'resolved' } : item));

  const setAddAs = (idx, val) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, addAs: val } : item));

  const removeItem = (idx) =>
    setItems(prev => prev.filter((_, i) => i !== idx));

  const setAllAddAs = (val) => setItems(prev => prev.map(item => ({ ...item, addAs: val })));

  const handleImport = async () => {
    // The same title can appear twice in a CSV; only send it once
    const seen = new Set();
    const toImport = items.filter(i => {
      if (!i.selected || isDupeOf(i) || seen.has(mediaKey(i.selected))) return false;
      seen.add(mediaKey(i.selected));
      return true;
    });
    if (toImport.length === 0) return alert('No new movies to import (all may already be in your list).');
    setSaving(true);
    const totals = { added: 0, duplicates: 0, failed: 0 };
    for (let i = 0; i < toImport.length; i += SAVE_CHUNK) {
      const chunk = toImport.slice(i, i + SAVE_CHUNK);
      setProgress(`Importing ${i + 1}-${i + chunk.length} of ${toImport.length}...`);
      try {
        const res = await addMoviesBulk(chunk.map(item => ({
          ...item.selected,
          status: item.addAs,
          rating: item.addAs === 'watched' && item.csvRating != null ? item.csvRating : null,
          date_watched: item.addAs === 'watched' ? (item.csvDate || new Date().toISOString()) : null
        })));
        totals.added += res.added;
        totals.duplicates += res.duplicates;
        totals.failed += res.failed;
      } catch {
        totals.failed += chunk.length;
      }
    }
    await refreshAll();
    setSummary(totals);
    setSaving(false);
    setProgress('');
    setStep('done');
  };

  const resolved = items.filter(i => i.selected).length;
  const duplicates = items.filter(isDupeOf).length;
  const unmatched = items.filter(i => i.status === 'unmatched' && !i.selected).length;
  const ambiguous = items.filter(i => i.status === 'ambiguous' && !i.selected).length;
  const toImportCount = resolved - duplicates;

  if (step === 'done') return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
      <div style={{ fontSize: 40, marginBottom: 16, color: summary?.failed ? 'var(--gold)' : 'var(--green)' }}>
        {summary?.failed ? 'Partly done' : 'Done'}
      </div>
      <p style={{ marginBottom: 8 }}>
        Imported {summary?.added ?? 0} title{summary?.added === 1 ? '' : 's'}.
        {summary?.duplicates > 0 && ` ${summary.duplicates} were already in your list.`}
      </p>
      {summary?.failed > 0 && (
        <p style={{ marginBottom: 8, color: 'var(--accent)' }}>
          {summary.failed} could not be saved. Try importing the file again; titles already added will be skipped.
        </p>
      )}
      <p style={{ marginBottom: 20 }}>Check your Watchlist and Watched pages.</p>
      <button onClick={() => { setStep('upload'); setItems([]); setSummary(null); }} className="btn btn-ghost">Import Another</button>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Import from CSV</h1>
      <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 24 }}>
        Upload a CSV with movie names (Letterboxd and IMDb exports work directly).
      </p>

      {step === 'upload' && (
        <div style={{ maxWidth: 480 }}>
          <div onClick={() => fileRef.current.click()}
            style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '40px 24px',
              textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>+</div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Click to upload CSV</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Letterboxd export or any CSV with movie names</div>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleFile} />
          {loading && <p style={{ color: 'var(--text2)', marginTop: 16, fontSize: 13 }}>{progress}</p>}
        </div>
      )}

      {step === 'reviewing' && (
        <div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>
              {resolved} matched · {ambiguous} need pick · {unmatched} unmatched
              {duplicates > 0 && <span style={{ color: 'var(--gold)' }}> · {duplicates} already in list</span>}
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setAllAddAs('watchlist')} className="btn btn-ghost btn-sm">All to Watchlist</button>
              <button onClick={() => setAllAddAs('watched')} className="btn btn-ghost btn-sm">All to Watched</button>
              <button onClick={() => { setStep('upload'); setItems([]); }} className="btn btn-ghost btn-sm">Cancel</button>
              <button onClick={handleImport} disabled={saving || toImportCount === 0} className="btn btn-primary">
                {saving ? progress : `Import ${toImportCount} movies`}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item, idx) => {
              const isDupe = isDupeOf(item);
              return (
                <div key={idx} style={{
                  background: 'var(--bg2)', border: `1px solid ${isDupe ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: 8, padding: '12px 16px', opacity: isDupe ? 0.6 : 1
                }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {item.selected?.poster_url
                      ? <img src={item.selected.poster_url} alt="" loading="lazy"
                          style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                      : <div style={{ width: 40, height: 60, background: 'var(--bg3)', borderRadius: 4,
                          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, color: 'var(--text2)' }}>?</div>
                    }

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{item.selected ? item.selected.title : item.rawTitle}</span>
                        {item.selected && <span style={{ fontSize: 11, color: 'var(--text2)' }}>{item.selected.release_year}</span>}
                        <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 3, fontWeight: 600,
                          background: isDupe ? '#3a3000' : item.selected ? '#1a3a1a' : item.status === 'unmatched' ? '#3a1a1a' : '#3a2a00',
                          color: isDupe ? 'var(--gold)' : item.selected ? 'var(--green)' : item.status === 'unmatched' ? 'var(--accent)' : 'var(--gold)'
                        }}>
                          {isDupe ? 'already added' : item.selected ? 'matched' : item.status}
                        </span>
                      </div>

                      {/* Ambiguous candidates */}
                      {(item.status === 'ambiguous' || (item.status === 'resolved' && item.candidates?.length > 1)) && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                          {item.candidates.map(c => (
                            <button key={mediaKey(c)} onClick={() => setSelected(idx, c)}
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: 11,
                                borderColor: item.selected && mediaKey(item.selected) === mediaKey(c) ? 'var(--accent)' : 'var(--border)',
                                color: item.selected && mediaKey(item.selected) === mediaKey(c) ? 'var(--accent)' : 'var(--text2)'
                              }}>
                              {c.title} ({c.release_year}{c.media_type === 'tv' ? ', TV' : ''})
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Unmatched: manual search */}
                      {item.status === 'unmatched' && !item.selected && (
                        <UnmatchedSearch onSelect={(movie) => setSelected(idx, movie)} />
                      )}

                      {/* Add as toggle */}
                      {item.selected && !isDupe && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
                          {['watchlist', 'watched'].map(opt => (
                            <button key={opt} onClick={() => setAddAs(idx, opt)}
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: 11,
                                background: item.addAs === opt ? 'var(--accent)' : 'transparent',
                                color: item.addAs === opt ? '#fff' : 'var(--text2)',
                                borderColor: item.addAs === opt ? 'var(--accent)' : 'var(--border)'
                              }}>
                              {opt === 'watchlist' ? 'Watchlist' : 'Watched'}
                            </button>
                          ))}
                          {item.csvRating != null && (
                            <span style={{ fontSize: 11, color: 'var(--gold)', marginLeft: 4 }}>
                              rating: {item.csvRating}/10
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button onClick={() => removeItem(idx)} className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--text2)', flexShrink: 0 }}>×</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
