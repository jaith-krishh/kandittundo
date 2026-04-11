import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api';

const NAV = [
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'watched', label: 'Watched' },
  { id: 'ranking', label: 'Ranking' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'random', label: 'Random' },
  { id: 'import', label: 'Import' }
];

function ProfileDropdown({ user, setUser, logout }) {
  const [open, setOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const fileRef = useRef();
  const dropRef = useRef();

  useEffect(() => {
    const handler = (e) => { if (!dropRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      setSaving(true);
      try {
        const updated = await updateProfile({ avatar: ev.target.result });
        setUser(prev => ({ ...prev, avatar: updated.avatar }));
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const updated = await updateProfile({ displayName: editName.trim() });
      setUser(prev => ({ ...prev, displayName: updated.displayName }));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '4px 12px 4px 4px',
          cursor: 'pointer', userSelect: 'none',
          transition: 'border-color 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        {user.avatar
          ? <img src={user.avatar} alt={user.displayName} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
          : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {user.displayName?.[0]?.toUpperCase() || '?'}
            </div>
        }
        <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{user.displayName}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" style={{ marginLeft: 2, opacity: 0.5 }}>
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 16, minWidth: 220,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 200
        }}>
          {/* Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div
              onClick={() => fileRef.current.click()}
              style={{
                width: 64, height: 64, borderRadius: '50%', cursor: 'pointer',
                overflow: 'hidden', border: '2px dashed var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative'
              }}
              onMouseEnter={e => e.currentTarget.querySelector('.overlay').style.opacity = 1}
              onMouseLeave={e => e.currentTarget.querySelector('.overlay').style.opacity = 0}
            >
              {user.avatar
                ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 700, color: '#fff' }}>
                    {user.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
              }
              <div className="overlay" style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.2s', fontSize: 11, color: '#fff', fontWeight: 600
              }}>
                Change
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>click to change photo</span>
          </div>

          {/* Display name */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>Display name</div>
            {editing ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  style={{
                    flex: 1, background: 'rgb(28,28,30)', border: 'none', borderRadius: 6,
                    color: '#fff', padding: '6px 8px', fontSize: 13, outline: 'none',
                    boxShadow: '0 0 0 2px skyblue'
                  }}
                  maxLength={40}
                />
                <button onClick={handleSaveName} disabled={saving}
                  style={{ background: 'var(--accent)', border: 'none', borderRadius: 6,
                    color: '#fff', padding: '6px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                  {saving ? '...' : 'Save'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, color: 'var(--text)' }}>{user.displayName}</span>
                <button onClick={() => { setEditName(user.displayName); setEditing(true); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
                    fontSize: 12, padding: '2px 6px', borderRadius: 4 }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}>
                  Edit
                </button>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <button onClick={logout}
              style={{
                width: '100%', background: 'none', border: '1px solid var(--border)',
                borderRadius: 6, color: 'var(--text2)', padding: '8px', fontSize: 13,
                cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar({ page, setPage }) {
  const [open, setOpen] = useState(false);
  const { user, setUser, logout } = useAuth();

  return (
    <nav style={{
      background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 20px',
        display: 'flex', alignItems: 'center', height: 56, gap: 8
      }}>
        <img src="/nav.svg" alt="kandittundo?" style={{ height: 28, marginRight: 16, flexShrink: 0 }} />

        <div style={{ display: 'flex', gap: 2, flex: 1 }} className="hide-mobile">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '0 14px', height: 56, fontSize: 13, fontWeight: 500,
                color: page === n.id ? '#fff' : 'var(--text2)',
                borderBottom: page === n.id ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'color 0.2s, border-color 0.2s', letterSpacing: '0.01em'
              }}
              onMouseEnter={e => { if (page !== n.id) e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { if (page !== n.id) e.currentTarget.style.color = 'var(--text2)'; }}
            >
              {n.label}
            </button>
          ))}
        </div>

        {user && (
          <div style={{ marginLeft: 'auto', flexShrink: 0 }} className="hide-mobile">
            <ProfileDropdown user={user} setUser={setUser} logout={logout} />
          </div>
        )}

        <button onClick={() => setOpen(!open)} id="hamburger"
          style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text)', fontSize: 20, cursor: 'pointer', marginLeft: 'auto' }}>
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div style={{ background: 'rgba(10,10,10,0.97)', borderTop: '1px solid var(--border)', padding: '8px 16px 16px' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => { setPage(n.id); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', background: 'none',
                border: 'none', padding: '12px 4px', fontSize: 15, cursor: 'pointer',
                color: page === n.id ? 'var(--accent)' : 'var(--text)',
                borderBottom: '1px solid var(--border)'
              }}>
              {n.label}
            </button>
          ))}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
              {user.avatar
                ? <img src={user.avatar} alt={user.displayName} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                    {user.displayName?.[0]?.toUpperCase() || '?'}
                  </div>
              }
              <span style={{ color: 'var(--text)', fontSize: 14, flex: 1 }}>{user.displayName}</span>
              <button onClick={logout}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                  color: 'var(--text2)', padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}>
                Logout
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          #hamburger { display: block !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
