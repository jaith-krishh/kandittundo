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

        <a
          href={`${API_URL}/auth/google`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            background: '#fff', color: '#1f1f1f',
            borderRadius: 8, padding: '12px 28px', fontSize: 15,
            fontWeight: 600, cursor: 'pointer', textDecoration: 'none',
            fontFamily: 'Inter, sans-serif', width: '100%', boxSizing: 'border-box'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </a>
      </div>
    </div>
  );
}
