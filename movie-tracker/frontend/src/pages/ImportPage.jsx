import React, { useState, useRef, useEffect } from 'react';
import { lookupImport, addMovie, searchTMDB, getMovies } from '../api';

function parseCSV(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].toLowerCase();
  const hasHeader = header.includes('name') || header.includes('title') || header.includes('film') || header.includes('rating');
  const cols = hasHeader ? lines[0].split(',').map(c => c.replace(/"/g, '').trim().toLowerCase()) : [];
  const titleCol = (() => {
    if (!hasHeader) return 0;
    const idx = cols.findIndex(c => c === 'name' || c === 'title' || c === 'film');
    return idx >= 0 ? idx : 0;
  })();
  const ratingCol = (() => {
    if (!hasHeader) return -1;
    return cols.findIndex(c => c === 'rating' || c === 'score' || c === 'my rating' || c === 'myrating');
  })();
  const dataLines = hasHeader ? lines.slice(1) : lines;
  return dataLines.map(line => {
    const parts = line.split(',').map(c => c.replace(/"/g, '').trim());
    const title = parts[titleCol] || parts[0];
    if (!title) return null;
    let rating = null;
    if (ratingCol >= 0 && parts[ratingCol]) {
      const raw = parseFloat(parts[ratingCol]);
      if (!isNaN(raw)) rating = raw <= 5 ? Math.round(raw * 2 * 10) / 10 : Math.min(raw, 10);
    }
    return { title, rating };
  }).filter(Boolean);
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
            <div key={m.movie_id} onClick={() => { onSelect(m); setQ(''); setResults([]); }}
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
  const [existingIds, setExistingIds] = useState(new Set());
  const fileRef = useRef();

  // Load existing movie_ids to detect duplicates
  useEffect(() => {
    getMovies().then(movies => {
      setExistingIds(new Set(movies.map(m => m.movie_id)));
    }).catch(() => {});
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseCSV(text);
    if (parsed.length === 0) return alert('No movie titles found in file.');
    const titles = parsed.map(p => p.title);
    setLoading(true);
    setProgress(`Looking up ${titles.length} titles...`);
    try {
      const results = await lookupImport(titles);
      setItems(results.map((r, i) => {
        const csvRating = parsed[i]?.rating ?? null;
        return { ...r, addAs: csvRating != null ? 'watched' : 'watchlist', csvRating };
      }));
      setStep('reviewing');
    } catch {
      alert('Lookup failed. Check your connection.');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const setSelected = (idx, movie) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, selected: movie, status: 'resolved' } : item));

  const setAddAs = (idx, val) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, addAs: val } : item));

  const removeItem = (idx) =>
    setItems(prev => prev.filter((_, i) => i !== idx));

  const handleImport = async () => {
    const toImport = items.filter(i => i.selected && !existingIds.has(i.selected.movie_id));
    if (toImport.length === 0) return alert('No new movies to import (all may already be in your list).');
    setSaving(true);
    let done = 0;
    for (const item of toImport) {
      try {
        await addMovie({
          ...item.selected,
          status: item.addAs,
          rating: item.addAs === 'watched' && item.csvRating != null ? item.csvRating : null,
          date_watched: item.addAs === 'watched' ? new Date().toISOString() : null
        });
      } catch { /* skip */ }
      done++;
      setProgress(`Importing ${done}/${toImport.length}...`);
    }
    setSaving(false);
    setProgress('');
    setStep('done');
  };

  const resolved = items.filter(i => i.selected).length;
  const duplicates = items.filter(i => i.selected && existingIds.has(i.selected.movie_id)).length;
  const unmatched = items.filter(i => i.status === 'unmatched' && !i.selected).length;
  const ambiguous = items.filter(i => i.status === 'ambiguous' && !i.selected).length;
  const toImportCount = resolved - duplicates;

  if (step === 'done') return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
      <div style={{ fontSize: 40, marginBottom: 16, color: 'var(--green)' }}>Done</div>
      <p style={{ marginBottom: 20 }}>Import complete. Check your Watchlist and Watched pages.</p>
      <button onClick={() => { setStep('upload'); setItems([]); }} className="btn btn-ghost">Import Another</button>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Import from CSV</h1>
      <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 24 }}>
        Upload a CSV with movie names (Letterboxd export works directly).
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
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={() => { setStep('upload'); setItems([]); }} className="btn btn-ghost btn-sm">Cancel</button>
              <button onClick={handleImport} disabled={saving || toImportCount === 0} className="btn btn-primary">
                {saving ? progress : `Import ${toImportCount} movies`}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item, idx) => {
              const isDupe = item.selected && existingIds.has(item.selected.movie_id);
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
                            <button key={c.movie_id} onClick={() => setSelected(idx, c)}
                              className="btn btn-ghost btn-sm"
                              style={{ fontSize: 11,
                                borderColor: item.selected?.movie_id === c.movie_id ? 'var(--accent)' : 'var(--border)',
                                color: item.selected?.movie_id === c.movie_id ? 'var(--accent)' : 'var(--text2)'
                              }}>
                              {c.title} ({c.release_year})
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
