import React from 'react';

const REWATCH_COLOR = { Yes: 'var(--green)', Maybe: 'var(--gold)', No: 'var(--accent2)' };

export default function MovieCard({ movie, onClick, onDelete, actions }) {
  return (
    <div className="card" style={{ cursor: 'pointer' }} onClick={onClick}>
      <div style={{ position: 'relative' }}>
        {movie.poster_url
          ? <img src={movie.poster_url} alt={movie.title}
              style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }}
              loading="lazy" />
          : <div style={{ width: '100%', aspectRatio: '2/3', background: 'var(--bg3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>?</div>
        }
        {movie.rank && (
          <span style={{
            position: 'absolute', top: 8, left: 8, background: 'var(--accent)',
            color: '#fff', borderRadius: 4, padding: '2px 7px', fontSize: 12, fontWeight: 700
          }}>#{movie.rank}</span>
        )}
        {movie.rating != null && (
          <span style={{
            position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.8)',
            color: 'var(--gold)', borderRadius: 4, padding: '2px 7px', fontSize: 12, fontWeight: 700
          }}>{movie.rating}</span>
        )}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {movie.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>
          {movie.release_year}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {movie.genres.slice(0, 2).map(g => (
            <span key={g} className="badge">{g}</span>
          ))}
        </div>
        {movie.rewatch_value && (
          <div style={{ fontSize: 11, color: REWATCH_COLOR[movie.rewatch_value] }}>
            Rewatch: {movie.rewatch_value}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }} onClick={e => e.stopPropagation()}>
          {movie.media_type === 'tv' && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3,
              background: '#1a3a5c', color: '#4fc3f7', alignSelf: 'center' }}>TV</span>
          )}
          {actions}
          {onDelete && (
            <button onClick={onDelete} className="btn btn-ghost btn-sm"
              style={{ color: 'var(--accent)', marginLeft: 'auto' }}>Remove</button>
          )}
        </div>
      </div>
    </div>
  );
}
