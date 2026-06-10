import React, { useEffect, useRef, useState } from 'react';
import VantaBackground from '../components/VantaBackground';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const FEATURES = [
  {
    title: 'Track Everything',
    desc: 'Movies and TV shows in one place. Move from watchlist to watched in one click.',
    accent: '#e50914'
  },
  {
    title: 'Rate & Review',
    desc: 'Score what you watch, add personal remarks, and set a rewatch value.',
    accent: '#f5c518'
  },
  {
    title: 'Stats Dashboard',
    desc: 'Genre breakdowns, average ratings, and a timeline of everything you\'ve watched.',
    accent: '#46d369'
  },
  {
    title: 'Random Pick',
    desc: 'Filter by genre, language, and rating — let the app decide what to watch next.',
    accent: '#4fc3f7'
  },
  {
    title: 'Season Ratings',
    desc: 'For TV shows, rate each season individually. Overall score auto-calculated.',
    accent: '#b39ddb'
  },
  {
    title: 'CSV Import',
    desc: 'Import your Letterboxd history or any CSV with movie names instantly.',
    accent: '#ff8a65'
  },
];

function FeatureCard({ title, desc, accent, index }) {
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    e.currentTarget.style.setProperty('--mx', `${x}%`);
    e.currentTarget.style.setProperty('--my', `${y}%`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative', overflow: 'hidden',
        background: 'rgba(20,20,20,0.7)',
        border: '1px solid var(--border)',
        borderRadius: 14, padding: '28px 24px',
        backdropFilter: 'blur(12px)',
        opacity: 0,
        transform: 'translateY(24px)',
        transition: `opacity 0.5s ease ${index * 80}ms, transform 0.5s ease ${index * 80}ms`,
        cursor: 'default'
      }}
      className="feature-card"
    >
      {/* Spotlight glow on hover */}
      <div className="card-spotlight" />

      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 24, right: 24, height: 2,
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        borderRadius: 1
      }} />

      <div style={{
        width: 36, height: 36, borderRadius: 8, marginBottom: 16,
        background: `${accent}18`,
        border: `1px solid ${accent}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent }} />
      </div>

      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: 'var(--text)' }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
        {desc}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const heroRef = useRef();
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 100);
  }, []);

  return (
    <div style={{ minHeight: '100vh', color: 'var(--text)' }}>
      <VantaBackground />

      {/* Hero */}
      <header style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '40px 24px',
        position: 'relative', zIndex: 1
      }}>
        <div
          ref={heroRef}
          style={{
            opacity: 0, transform: 'translateY(20px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}
        >
          {/* Logo with glow */}
          <div style={{ position: 'relative', marginBottom: 32 }}>
            <div style={{
              position: 'absolute', inset: -20,
              background: 'radial-gradient(circle, rgba(229,9,20,0.2) 0%, transparent 70%)',
              borderRadius: '50%'
            }} />
            <img src="/favicon.svg" alt="kandittundo?" style={{ width: 80, height: 80, position: 'relative' }} />
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 700,
            letterSpacing: '-1px', marginBottom: 20, lineHeight: 1.15,
            background: 'linear-gradient(135deg, #fff 40%, #999 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            maxWidth: 700
          }}>
            Track, rate, and rank every movie and show you watch.
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2vw, 18px)', color: 'var(--text2)',
            maxWidth: 480, lineHeight: 1.6, marginBottom: 40
          }}>
            kandittundo? is your free, ad-free personal space for everything cinema. No distractions, just your watchlist.
          </p>

          <a
            href={`${API_URL}/auth/google`}
            role="button"
            className="cta-btn"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: '#fff', color: '#1f1f1f',
              borderRadius: 12, padding: '14px 36px', fontSize: 15,
              fontWeight: 600, textDecoration: 'none',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.5)',
              transition: 'transform 0.15s, box-shadow 0.15s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.2), 0 16px 48px rgba(0,0,0,0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.5)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Continue with Google
          </a>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          color: 'var(--text2)', fontSize: 13, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 8, letterSpacing: '0.12em', textTransform: 'uppercase',
          animation: 'bounce 2s infinite'
        }}>
          <span>scroll</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </header>

      {/* Features */}
      <main style={{
        position: 'relative', zIndex: 1,
        maxWidth: 960, margin: '0 auto', padding: '40px 24px 100px'
      }}>
        {/* Section label */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text2)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            What's inside
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 14
        }}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', marginTop: 72 }}>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>
            Ready to start tracking?
          </p>
          <a
            href={`${API_URL}/auth/google`}
            role="button"
            className="cta-btn"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'var(--accent)', color: '#fff',
              borderRadius: 10, padding: '13px 36px', fontSize: 15,
              fontWeight: 600, textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(229,9,20,0.3)',
              transition: 'background 0.2s, box-shadow 0.2s, transform 0.15s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#c40812';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(229,9,20,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(229,9,20,0.3)';
            }}
          >
            Get started - it's free
          </a>
        </div>
      </main>

      {/* Footer / Trust & Compliance */}
      <footer style={{
        padding: '40px 24px', borderTop: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        fontSize: 13, color: 'var(--text2)',
        position: 'relative', zIndex: 1
      }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <button onClick={() => setActiveModal('privacy')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'none' }}>Privacy Policy</button>
          <button onClick={() => setActiveModal('terms')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'none' }}>Terms of Service</button>
          <button onClick={() => setActiveModal('contact')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'none' }}>Contact Us</button>
        </div>
        <p>© {new Date().getFullYear()} kandittundo?. All rights reserved.</p>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(7px); }
        }

        .feature-card {
          --mx: 50%;
          --my: 50%;
        }

        .card-spotlight {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.3s;
          background: radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,0.12) 0%, transparent 60%);
          pointer-events: none;
        }

        .feature-card:hover .card-spotlight {
          opacity: 1;
        }

        .feature-card:hover {
          border-color: #3a3a3a !important;
          transform: translateY(-3px) !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
        }
      `}</style>

      {/* Modals */}
      {activeModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24
        }} onClick={() => setActiveModal(null)}>
          <div style={{
            background: '#141414', border: '1px solid var(--border)',
            borderRadius: 16, padding: 32, maxWidth: 500, width: '100%',
            position: 'relative', maxHeight: '85vh', overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setActiveModal(null)} style={{
              position: 'absolute', top: 16, right: 16,
              background: 'transparent', border: 'none', color: 'var(--text2)',
              cursor: 'pointer', padding: 8, fontSize: 18
            }}>✕</button>

            {activeModal === 'privacy' && (
              <>
                <h2 style={{ marginBottom: 20, fontSize: 24, fontWeight: 600 }}>Privacy Policy</h2>
                <div style={{ color: 'var(--text2)', lineHeight: 1.6, fontSize: 14 }}>
                  <p><strong>1. Information Collection:</strong> We collect your email address and basic profile information when you sign in with Google. We also store your movie and TV show tracking data (watchlist, ratings, reviews, history).</p>
                  <p style={{ marginTop: 12 }}><strong>2. Use of Information:</strong> Your data is used solely to provide and improve the kandittundo? service. We do not sell your personal information to third parties.</p>
                  <p style={{ marginTop: 12 }}><strong>3. Data Security:</strong> We implement reasonable security measures to protect your personal information.</p>
                  <p style={{ marginTop: 12 }}><strong>4. Third-Party Services:</strong> We use Google for authentication. Their privacy policies also apply when you use their services to log in.</p>
                </div>
              </>
            )}

            {activeModal === 'terms' && (
              <>
                <h2 style={{ marginBottom: 20, fontSize: 24, fontWeight: 600 }}>Terms of Service</h2>
                <div style={{ color: 'var(--text2)', lineHeight: 1.6, fontSize: 14 }}>
                  <p><strong>1. Acceptance of Terms:</strong> By using kandittundo?, you agree to these Terms of Service. If you disagree, please do not use our service.</p>
                  <p style={{ marginTop: 12 }}><strong>2. Service Description:</strong> kandittundo? is a personal movie and TV show tracking application provided "as is" without warranties of any kind.</p>
                  <p style={{ marginTop: 12 }}><strong>3. User Conduct:</strong> You agree to use the service for personal, non-commercial purposes only. You are responsible for maintaining the security of your account.</p>
                  <p style={{ marginTop: 12 }}><strong>4. Termination:</strong> We reserve the right to terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever.</p>
                </div>
              </>
            )}

            {activeModal === 'contact' && (
              <>
                <h2 style={{ marginBottom: 20, fontSize: 24, fontWeight: 600 }}>Contact Us</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <a href="mailto:jaithkrishh@gmail.com" style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px',
                    background: 'rgba(20,20,20,0.6)', borderRadius: 14,
                    color: 'var(--text)', textDecoration: 'none', border: '1px solid var(--border)',
                    transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden'
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.borderColor = '#4a4a4a';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(20,20,20,0.6)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}>
                    <div style={{ color: 'var(--text2)', display: 'flex' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 2 }}>Email</span>
                      <span style={{ fontSize: 15, fontWeight: 500 }}>jaithkrishh@gmail.com</span>
                    </div>
                  </a>

                  <a href="tel:+918547710078" style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px',
                    background: 'rgba(20,20,20,0.6)', borderRadius: 14,
                    color: 'var(--text)', textDecoration: 'none', border: '1px solid var(--border)',
                    transition: 'all 0.2s ease'
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.borderColor = '#4a4a4a';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(20,20,20,0.6)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}>
                    <div style={{ color: 'var(--text2)', display: 'flex' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 2 }}>Phone</span>
                      <span style={{ fontSize: 15, fontWeight: 500 }}>+91 8547710078</span>
                    </div>
                  </a>

                  <a href="https://www.linkedin.com/in/jaith-krishna-446a66325" target="_blank" rel="noopener noreferrer" style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px',
                    background: 'rgba(20,20,20,0.6)', borderRadius: 14,
                    color: 'var(--text)', textDecoration: 'none', border: '1px solid var(--border)',
                    transition: 'all 0.2s ease'
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.borderColor = '#4a4a4a';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(20,20,20,0.6)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}>
                    <div style={{ color: 'var(--text2)', display: 'flex' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 2 }}>LinkedIn</span>
                      <span style={{ fontSize: 15, fontWeight: 500 }}>View Profile</span>
                    </div>
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
