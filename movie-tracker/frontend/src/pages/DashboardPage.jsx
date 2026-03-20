import React, { useEffect, useState } from 'react';
import { getStats } from '../api';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => { getStats().then(setStats).catch(() => {}); }, []);

  if (!stats) return <p style={{ color: 'var(--text2)' }}>Loading stats...</p>;

  const genreData = stats.topGenres.map(([name, count]) => ({ name, count }));

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Watched', value: stats.total },
          { label: 'Avg Rating', value: stats.avgRating },
          { label: 'Top Genre', value: stats.topGenres[0]?.[0] || 'N/A' }
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '20px 16px', textAlign: 'center'
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {genreData.length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Most Watched Genres</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={genreData} barCategoryGap="50%" barSize={28}>
              <XAxis dataKey="name" tick={{ fill: '#999', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Bar dataKey="count" fill="#e50914" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                <LabelList dataKey="count" position="insideBottom" offset={8}
                  style={{ fill: '#000', fontSize: 11, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.recent.length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recently Watched</h2>
          {stats.recent.map(m => (
            <div key={m._id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0', borderBottom: '1px solid var(--border)'
            }}>
              {m.poster_url
                ? <img src={m.poster_url} alt={m.title} style={{ width: 36, height: 54, objectFit: 'cover', borderRadius: 4 }} />
                : <div style={{ width: 36, height: 54, background: 'var(--bg3)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>?</div>
              }
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {m.date_watched ? new Date(m.date_watched).toLocaleDateString() : ''}
                </div>
              </div>
              {m.rating != null && <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{m.rating}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
