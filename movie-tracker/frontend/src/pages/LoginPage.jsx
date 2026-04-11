import React from 'react';
import VantaBackground from '../components/VantaBackground';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <VantaBackground />
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'rgba(10,10,10,0.85)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '48px 52px',
        textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        minWidth: 340, maxWidth: 400,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)'
      }}>
        <img src="/favicon.svg" alt="kandittundo?" style={{ width: 72, height: 72 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            kandittundo?
          </h1>
          <p style={{ margin: 0, color: 'var(--text2)', fontSize: 14, lineHeight: 1.5, maxWidth: 260 }}>
            Your personal space to track, rate, and rank every movie you watch.
          </p>
        </div>

        <div style={{ width: '100%', height: 1, background: 'var(--border)', margin: '4px 0' }} />

        {/* DEV BYPASS: auto-login via /api/auth/me (session already set by middleware) */}
        <a
          href="/"
          onClick={() => window.location.reload()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            background: 'var(--accent)', color: '#fff',
            borderRadius: 8, padding: '12px 28px', fontSize: 15,
            fontWeight: 600, cursor: 'pointer', textDecoration: 'none',
            width: '100%', boxSizing: 'border-box'
          }}
        >
          Enter (Dev Mode)
        </a>
      </div>
    </div>
  );
}
