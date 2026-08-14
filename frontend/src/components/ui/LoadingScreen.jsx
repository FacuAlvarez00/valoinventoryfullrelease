import React, { useState, useEffect } from 'react';
import { SkeletonBlock } from './kit';
import homeStyles from './HomePage.module.css';

function AnimatedDots() {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setCount(c => c >= 3 ? 1 : c + 1), 500);
    return () => clearInterval(id);
  }, []);
  return <span>{'.'.repeat(count)}</span>;
}

export function SkeletonAccountCard() {
  return (
    <div className={homeStyles.card} style={{ cursor: 'default' }}>
      <SkeletonBlock height={150} radius={0} />

      <div className={homeStyles.cardBody}>
        <SkeletonBlock width="45%" height={10} />

        <div className={homeStyles.cardStats}>
          <SkeletonBlock height={48} radius={2} style={{ flex: 1 }} />
          <SkeletonBlock height={48} radius={2} style={{ flex: 1 }} />
        </div>

        <div className={homeStyles.cardActions}>
          <SkeletonBlock height={34} radius={2} style={{ flex: 1 }} />
          <SkeletonBlock height={34} radius={2} style={{ flex: 1 }} />
          <SkeletonBlock height={34} radius={2} style={{ flex: 1 }} />
        </div>
      </div>
    </div>
  );
}

const KEYFRAMES = `
  @keyframes vi-spin { to { transform: rotate(360deg); } }
  @keyframes vi-spin-reverse { to { transform: rotate(-360deg); } }
  @keyframes vi-pulse-dot {
    0%, 80%, 100% { transform: scale(0.4); opacity: 0.3; }
    40% { transform: scale(1); opacity: 1; }
  }
`;

export default function LoadingScreen({ fullscreen = true, text = 'Loading' }) {
  const label = text.replace(/\.+$/, '');
  return (
    <div style={{
      ...(fullscreen
        ? { minHeight: '100vh', background: 'var(--vi-black)' }
        : { padding: '80px 0' }),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 28,
    }}>
      <style>{KEYFRAMES}</style>

      {/* Double-ring spinner */}
      <div style={{ position: 'relative', width: 94, height: 94 }}>
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: '4px solid rgba(255,70,84,0.15)',
          borderTopColor: 'var(--vi-red)',
          animation: 'vi-spin 0.9s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 13,
          borderRadius: '50%',
          border: '3px solid rgba(255,70,84,0.08)',
          borderTopColor: 'rgba(255,70,84,0.5)',
          animation: 'vi-spin-reverse 1.3s linear infinite',
        }} />
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 10, height: 10,
          borderRadius: '50%',
          background: 'var(--vi-red)',
        }} />
      </div>

      {/* Bouncing dots */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 10, height: 10,
            borderRadius: '50%',
            background: 'var(--vi-red)',
            animation: `vi-pulse-dot 1.4s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>

      <span style={{
        color: 'rgba(236,232,225,0.5)',
        fontSize: 13,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        fontFamily: 'var(--vi-font-heading)',
        fontWeight: 700,
      }}>
        {label}<AnimatedDots />
      </span>
    </div>
  );
}
