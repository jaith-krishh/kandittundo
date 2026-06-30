import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SettingsModal from './SettingsModal';

const NAV = [
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'watched', label: 'Watched' },
  { id: 'ranking', label: 'Ranking' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'random', label: 'Random' },
  { id: 'import', label: 'Import' }
];

function ProfileDropdown({ user, logout, onOpenSettings }) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef();

  useEffect(() => {
    const handler = (e) => { if (!dropRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
          borderRadius: 10, padding: 8, minWidth: 200,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 200
        }}>
          {/* Avatar and Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 8px 16px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
            {user.avatar
              ? <img src={user.avatar} alt={user.displayName} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                  {user.displayName?.[0]?.toUpperCase() || '?'}
                </div>
            }
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{user.displayName}</span>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>{user.email || user.username}</span>
            </div>
          </div>

          <button onClick={() => { setOpen(false); window.open(`/u/${user.username}`, '_blank'); }}
            style={{
              width: '100%', background: 'none', border: 'none', textAlign: 'left',
              borderRadius: 6, color: 'var(--text)', padding: '10px 12px', fontSize: 13,
              cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            Public Profile
          </button>

          <button onClick={() => { setOpen(false); onOpenSettings(); }}
            style={{
              width: '100%', background: 'none', border: 'none', textAlign: 'left',
              borderRadius: 6, color: 'var(--text)', padding: '10px 12px', fontSize: 13,
              cursor: 'pointer', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            Settings
          </button>
          
          <button onClick={() => { setOpen(false); logout(); }}
            style={{
              width: '100%', background: 'none', border: 'none', textAlign: 'left',
              borderRadius: 6, color: 'var(--text)', padding: '10px 12px', fontSize: 13,
              cursor: 'pointer', transition: 'background 0.2s', marginTop: 2
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar({ page, setPage }) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
            <ProfileDropdown user={user} logout={logout} onOpenSettings={() => setSettingsOpen(true)} />
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
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <button onClick={() => { setOpen(false); window.open(`/u/${user.username}`, '_blank'); }}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                    color: 'var(--text2)', padding: '6px 12px', fontSize: 13, cursor: 'pointer', marginBottom: 8, textAlign: 'left' }}>
                  Public Profile
                </button>
                <button onClick={() => { setOpen(false); setSettingsOpen(true); }}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                    color: 'var(--text2)', padding: '6px 12px', fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>
                  Settings
                </button>
                <button onClick={() => { setOpen(false); logout(); }}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6,
                    color: 'var(--text2)', padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {settingsOpen && <SettingsModal user={user} setUser={setUser} logout={logout} onClose={() => setSettingsOpen(false)} />}

      <style>{`
        @media (max-width: 768px) {
          #hamburger { display: block !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
