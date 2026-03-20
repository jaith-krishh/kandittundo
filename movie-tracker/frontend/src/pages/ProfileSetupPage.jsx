import React, { useState, useRef, useCallback } from 'react';
import { setupProfile, checkUsername } from '../api';
import { useAuth } from '../context/AuthContext';
import VantaBackground from '../components/VantaBackground';

const inputStyle = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  fontWeight: 500,
  fontSize: 14,
  color: '#fff',
  backgroundColor: 'rgb(28,28,30)',
  boxShadow: '0 0 6px rgba(0,0,0,0.5), 0 0 0 2px transparent',
  borderRadius: 6,
  border: 'none',
  outline: 'none',
  padding: '10px 12px',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'box-shadow 0.4s',
};

export default function ProfileSetupPage() {
  const { setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();
  const checkTimer = useRef();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target.result);
      setAvatarPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUsernameChange = useCallback((val) => {
    setUsername(val);
    clearTimeout(checkTimer.current);
    if (!val) { setUsernameStatus(null); return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(val)) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    checkTimer.current = setTimeout(async () => {
      const { available } = await checkUsername(val);
      setUsernameStatus(available ? 'available' : 'taken');
    }, 500);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !displayName) return setError('Both fields are required');
    if (usernameStatus !== 'available') return setError('Please choose a valid, available username');
    setSaving(true);
    setError('');
    try {
      const user = await setupProfile({ username, displayName, avatar });
      setUser(user);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const statusColor = { available: '#4caf50', taken: 'var(--accent)', invalid: '#ff9800', checking: 'var(--text2)' };
  const statusMsg = { available: 'Username available', taken: 'Username taken', invalid: '3-20 chars, letters/numbers/underscore only', checking: 'Checking...' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <VantaBackground />
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'rgba(10,10,10,0.85)',
        border: '1px solid var(--border)',
        borderRadius: 16, padding: '40px 48px',
        width: '100%', maxWidth: 400,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0
      }}>
        {/* Logo */}
        <img src="/favicon.svg" alt="kandittundo?" style={{ width: 56, height: 56, marginBottom: 20 }} />

        <h2 style={{ margin: '0 0 6px', fontSize: 20, color: 'var(--text)', textAlign: 'center' }}>Set up your profile</h2>
        <p style={{ margin: '0 0 28px', color: 'var(--text2)', fontSize: 14, textAlign: 'center' }}>Just once - you're good after this</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
          {/* Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div
              onClick={() => fileRef.current.click()}
              style={{
                width: 88, height: 88, borderRadius: '50%',
                background: 'var(--bg3, #1a1a1a)', border: '2px dashed var(--border)',
                cursor: 'pointer', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: 'var(--text2)', fontSize: 12, textAlign: 'center', padding: 8 }}>Upload photo</span>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            <span style={{ color: 'var(--text2)', fontSize: 12 }}>Profile Picture</span>
          </div>

          {/* Username */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: 'var(--text2)', fontSize: 13 }}>Username</label>
            <input
              style={inputStyle}
              value={username}
              onChange={e => handleUsernameChange(e.target.value)}
              onMouseEnter={e => e.target.style.boxShadow = '0 0 0 2px rgba(135,207,235,0.186)'}
              onMouseLeave={e => e.target.style.boxShadow = document.activeElement === e.target ? '0 0 0 2px skyblue' : '0 0 6px rgba(0,0,0,0.5), 0 0 0 2px transparent'}
              onFocus={e => e.target.style.boxShadow = '0 0 0 2px skyblue'}
              onBlur={e => e.target.style.boxShadow = '0 0 6px rgba(0,0,0,0.5), 0 0 0 2px transparent'}
              placeholder="e.g. alex13"
              maxLength={20}
            />
            {usernameStatus && (
              <span style={{ fontSize: 12, color: statusColor[usernameStatus] }}>{statusMsg[usernameStatus]}</span>
            )}
          </div>

          {/* Display name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: 'var(--text2)', fontSize: 13 }}>Display name</label>
            <input
              style={inputStyle}
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onMouseEnter={e => e.target.style.boxShadow = '0 0 0 2px rgba(135,207,235,0.186)'}
              onMouseLeave={e => e.target.style.boxShadow = document.activeElement === e.target ? '0 0 0 2px skyblue' : '0 0 6px rgba(0,0,0,0.5), 0 0 0 2px transparent'}
              onFocus={e => e.target.style.boxShadow = '0 0 0 2px skyblue'}
              onBlur={e => e.target.style.boxShadow = '0 0 6px rgba(0,0,0,0.5), 0 0 0 2px transparent'}
              placeholder="e.g. Alex"
              maxLength={40}
            />
          </div>

          {error && <p style={{ color: 'var(--accent)', fontSize: 13, margin: 0 }}>{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginTop: 4 }}>
            {saving ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
