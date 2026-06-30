import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { updateProfile, deleteAccount } from '../api';

export default function SettingsModal({ user, setUser, logout, onClose }) {
  const [tab, setTab] = useState('settings');
  
  const [editName, setEditName] = useState(user.displayName);
  const [savingName, setSavingName] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [isPrivate, setIsPrivate] = useState(user.isPrivate || false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  
  const fileRef = useRef();

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      setSavingAvatar(true);
      try {
        const updated = await updateProfile({ avatar: ev.target.result });
        setUser(prev => ({ ...prev, avatar: updated.avatar }));
      } finally {
        setSavingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = async () => {
    if (!editName.trim() || editName.trim() === user.displayName) return;
    setSavingName(true);
    try {
      const updated = await updateProfile({ displayName: editName.trim() });
      setUser(prev => ({ ...prev, displayName: updated.displayName }));
    } finally {
      setSavingName(false);
    }
  };

  const handleTogglePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      const updated = await updateProfile({ isPrivate: !isPrivate });
      setIsPrivate(updated.isPrivate);
      setUser(prev => ({ ...prev, isPrivate: updated.isPrivate }));
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.username);
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE ACCOUNT') return;
    setDeleting(true);
    try {
      await deleteAccount();
      logout();
    } catch (e) {
      console.error(e);
      setDeleting(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24
    }} onClick={onClose}>
      
      <style>{`
        .settings-container { flex-direction: row; }
        .settings-sidebar { width: 220px; border-right: 1px solid var(--border); padding: 32px 0; }
        .settings-content { padding: 40px; }
        @media (max-width: 768px) {
          .settings-container { flex-direction: column !important; }
          .settings-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid var(--border) !important; padding: 16px 0 !important; }
          .settings-content { padding: 20px !important; }
        }
      `}</style>

      <div className="settings-container" style={{
        background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 16, width: '100%', maxWidth: 800, height: '600px', maxHeight: '90vh',
        display: 'flex', overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
        position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Sidebar */}
        <div className="settings-sidebar" style={{
          background: 'var(--bg2)',
          display: 'flex', flexDirection: 'column', flexShrink: 0
        }}>
          <div style={{ padding: '0 20px', marginBottom: 32, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
            Settings
          </div>
          
          <button onClick={() => setTab('settings')} style={{
            background: tab === 'settings' ? 'var(--bg3)' : 'none',
            border: 'none', borderLeft: `4px solid ${tab === 'settings' ? 'var(--accent)' : 'transparent'}`,
            color: tab === 'settings' ? 'var(--text)' : 'var(--text2)',
            padding: '14px 20px', textAlign: 'left', fontSize: 15, fontWeight: tab === 'settings' ? 600 : 500,
            cursor: 'pointer', transition: 'all 0.2s'
          }}>
            Account
          </button>
          
          <button onClick={() => setTab('contact')} style={{
            background: tab === 'contact' ? 'var(--bg3)' : 'none',
            border: 'none', borderLeft: `4px solid ${tab === 'contact' ? 'var(--accent)' : 'transparent'}`,
            color: tab === 'contact' ? 'var(--text)' : 'var(--text2)',
            padding: '14px 20px', textAlign: 'left', fontSize: 15, fontWeight: tab === 'contact' ? 600 : 500,
            cursor: 'pointer', transition: 'all 0.2s'
          }}>
            Contact Us
          </button>

          <div style={{ flex: 1 }} />
          
          <div style={{ padding: '0 20px' }}>
            <button onClick={onClose} style={{
              width: '100%', padding: '12px', borderRadius: 8, background: 'var(--bg3)',
              border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
               onMouseLeave={e => e.currentTarget.style.background = 'var(--bg3)'}>
              Close Menu
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="settings-content" style={{ flex: 1, overflowY: 'auto' }}>
          {tab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40, maxWidth: 500 }}>
              
              {/* Profile Photo */}
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Profile Picture</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div style={{
                      width: 80, height: 80, borderRadius: '50%',
                      overflow: 'hidden', border: '1px solid var(--border)',
                      background: 'var(--accent)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff',
                      position: 'relative', flexShrink: 0
                    }}>
                    {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      user.displayName?.[0]?.toUpperCase() || '?'
                    )}
                    {savingAvatar && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 12, color: '#fff' }}>...</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <button onClick={() => fileRef.current.click()} className="btn btn-ghost" disabled={savingAvatar} style={{ color: 'var(--text)' }}>
                      Change Photo
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)' }} />

              {/* Display Name */}
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Display Name</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    style={{
                      flex: 1, background: 'var(--bg)',
                      border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)',
                      padding: '12px 16px', fontSize: 15, outline: 'none'
                    }}
                  />
                  <button onClick={handleSaveName} disabled={savingName || editName.trim() === user.displayName} className="btn btn-primary" style={{ padding: '0 24px', borderRadius: 8 }}>
                    {savingName ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)' }} />

              {/* User ID & Privacy */}
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Privacy & Sharing</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Copy User ID */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg2)', padding: '16px', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Your User ID</div>
                      <div style={{ fontSize: 13, color: 'var(--text2)' }}>Share this ID so others can search for your profile.</div>
                    </div>
                    <button onClick={handleCopyId} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 90, justifyContent: 'center' }}>
                      {copySuccess ? copySuccess : 'Copy ID'}
                    </button>
                  </div>

                  {/* Private Profile Toggle */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg2)', padding: '16px', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Private Profile</div>
                      <div style={{ fontSize: 13, color: 'var(--text2)' }}>When enabled, your profile will be hidden from other users.</div>
                    </div>
                    <button onClick={handleTogglePrivacy} disabled={savingPrivacy}
                      style={{
                        width: 44, height: 24, borderRadius: 12, border: 'none',
                        background: isPrivate ? 'var(--green)' : 'var(--bg3)',
                        position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
                      }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 2, left: isPrivate ? 22 : 2,
                        transition: 'left 0.3s'
                      }} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)' }} />

              {/* Danger Zone */}
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#e50914', marginBottom: 16 }}>Danger Zone</div>
                <div style={{ background: 'rgba(229,9,20,0.08)', border: '1px solid rgba(229,9,20,0.3)', borderRadius: 12, padding: 24 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>DELETE ACCOUNT</div>
                  <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.5 }}>
                    Once you delete your account, there is no going back. All your tracked movies, ratings, and profile data will be permanently removed.
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 12 }}>
                    Type <strong>DELETE ACCOUNT</strong> to confirm.
                  </p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input
                      value={deleteConfirm}
                      onChange={e => setDeleteConfirm(e.target.value)}
                      placeholder="DELETE ACCOUNT"
                      style={{
                        flex: 1, background: 'var(--bg)',
                        border: '1px solid rgba(229,9,20,0.4)', borderRadius: 8, color: 'var(--text)',
                        padding: '12px 16px', fontSize: 14, outline: 'none'
                      }}
                    />
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirm !== 'DELETE ACCOUNT' || deleting}
                      style={{
                        background: '#e50914', color: '#fff', border: 'none', borderRadius: 8,
                        padding: '0 24px', fontSize: 14, fontWeight: 700,
                        cursor: deleteConfirm === 'DELETE ACCOUNT' ? 'pointer' : 'not-allowed',
                        opacity: deleteConfirm === 'DELETE ACCOUNT' ? 1 : 0.5
                      }}
                    >
                      {deleting ? 'DELETING...' : 'DELETE ACCOUNT'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {tab === 'contact' && (
            <div style={{ maxWidth: 500 }}>
              <h2 style={{ marginBottom: 32, fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>Contact Us</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <a href="mailto:jaithkrishh@gmail.com" style={{
                  display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px',
                  background: 'var(--bg2)', borderRadius: 16,
                  color: 'var(--text)', textDecoration: 'none', border: '1px solid var(--border)',
                  transition: 'all 0.2s ease'
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--bg3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--bg2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                  <div style={{ color: 'var(--accent)', display: 'flex' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>Email</span>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>jaithkrishh@gmail.com</span>
                  </div>
                </a>

                <a href="tel:+918547710078" style={{
                  display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px',
                  background: 'var(--bg2)', borderRadius: 16,
                  color: 'var(--text)', textDecoration: 'none', border: '1px solid var(--border)',
                  transition: 'all 0.2s ease'
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--bg3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--bg2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                  <div style={{ color: 'var(--accent)', display: 'flex' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>Phone</span>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>+91 8547710078</span>
                  </div>
                </a>

                <a href="https://www.linkedin.com/in/jaith-krishna-446a66325" target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px',
                  background: 'var(--bg2)', borderRadius: 16,
                  color: 'var(--text)', textDecoration: 'none', border: '1px solid var(--border)',
                  transition: 'all 0.2s ease'
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--bg3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--bg2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                  <div style={{ color: 'var(--accent)', display: 'flex' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>LinkedIn</span>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>View Profile</span>
                  </div>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
