import React, { useState, useEffect } from 'react';

const KEYFRAMES = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes spin-reverse { to { transform: rotate(-360deg); } }
  @keyframes pulse-dot {
    0%, 80%, 100% { transform: scale(0.4); opacity: 0.3; }
    40% { transform: scale(1); opacity: 1; }
  }
  @keyframes shimmer {
    0%   { background-position: 150% 0; }
    100% { background-position: -150% 0; }
  }
`;

const SHIMMER = {
  background: 'linear-gradient(90deg, #192333 0%, #192333 35%, #2a4060 50%, #192333 65%, #192333 100%)',
  backgroundSize: '300% 100%',
  animation: 'shimmer 1.8s ease-in-out infinite',
  borderRadius: 8,
};

function SkeletonBlock({ width = '100%', height = 16, style = {}, delay = '0s' }) {
  return (
    <div style={{
      ...SHIMMER,
      width,
      height,
      animationDelay: delay,
      ...style,
    }} />
  );
}

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
    <div style={{
      borderRadius: 3,
      background: '#0f1923',
      overflow: 'hidden',
      border: '2px solid #1a2636',
    }}>
      <style>{KEYFRAMES}</style>

      {/* Banner image area */}
      <div style={{ ...SHIMMER, height: 160, borderRadius: 0, animationDelay: '0s' }} />

      {/* Body */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Last updated line */}
        <SkeletonBlock width="45%" height={10} delay="0.1s" />

        {/* Stats */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ ...SHIMMER, flex: 1, height: 48, borderRadius: 8, animationDelay: '0.15s' }} />
          <div style={{ ...SHIMMER, flex: 1, height: 48, borderRadius: 8, animationDelay: '0.3s' }} />
        </div>

        {/* UUID */}
        <SkeletonBlock height={28} delay="0.2s" style={{ borderRadius: 8 }} />

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ ...SHIMMER, flex: 1, height: 34, borderRadius: 8, animationDelay: '0.1s' }} />
          <div style={{ ...SHIMMER, flex: 1, height: 34, borderRadius: 8, animationDelay: '0.2s' }} />
          <div style={{ ...SHIMMER, flex: 1, height: 34, borderRadius: 8, animationDelay: '0.3s' }} />
        </div>
      </div>
    </div>
  );
}

export default function LoadingScreen({ fullscreen = true, text = 'Cargando' }) {
  const label = text.replace(/\.+$/, '');
  return (
    <div style={{
      ...(fullscreen
        ? { minHeight: '100vh', background: 'radial-gradient(ellipse at 60% 40%, #1a2636 60%, #0f1923 100%)' }
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
          border: '4px solid rgba(255,70,85,0.15)',
          borderTopColor: '#ff4655',
          animation: 'spin 0.9s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 13,
          borderRadius: '50%',
          border: '3px solid rgba(255,70,85,0.08)',
          borderTopColor: 'rgba(255,70,85,0.5)',
          animation: 'spin-reverse 1.3s linear infinite',
        }} />
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 10, height: 10,
          borderRadius: '50%',
          background: '#ff4655',
        }} />
      </div>

      {/* Bouncing dots */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 10, height: 10,
            borderRadius: '50%',
            background: '#ff4655',
            animation: `pulse-dot 1.4s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>

      <span style={{ color: '#6b7a8d', fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 'bold' }}>
        {label}<AnimatedDots />
      </span>
    </div>
  );
}
