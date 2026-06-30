import React from 'react';
import { motion } from 'framer-motion';

const ACCENT = '#ff4655';

function MiniSkinCard({ hue, idx }) {
  return (
    <div style={{
      background: '#181c24',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 6,
      padding: 8,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{
        height: 34,
        borderRadius: 4,
        background: `linear-gradient(135deg, hsla(${hue},70%,55%,0.35) 0%, hsla(${hue},70%,30%,0.15) 100%)`,
      }} />
      <div style={{ height: 6, width: `${55 + (idx % 3) * 12}%`, borderRadius: 3, background: 'rgba(255,255,255,0.18)' }} />
      <div style={{ height: 6, width: 28, borderRadius: 3, background: 'rgba(255,70,85,0.45)' }} />
    </div>
  );
}

function DeviceMock({ width, height, compact = false }) {
  const hues = [355, 200, 35, 280, 160, 10];
  return (
    <div style={{
      width,
      height,
      background: 'linear-gradient(180deg, #11161d 0%, #0c0f14 100%)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: compact ? 14 : 12,
      boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Title bar */}
      <div style={{
        height: compact ? 26 : 30,
        background: '#161b22',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 12px',
        flexShrink: 0,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f56' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#27c93f' }} />
        {!compact && (
          <span style={{ marginLeft: 'auto', marginRight: 'auto', fontSize: 10, color: '#666', letterSpacing: '0.5px' }}>
            valoinventory.app
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: compact ? 10 : 16, flex: 1, display: 'flex', flexDirection: 'column', gap: compact ? 8 : 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 4, height: compact ? 12 : 14, background: ACCENT, borderRadius: 2 }} />
            <span style={{ fontSize: compact ? 9 : 11, fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>MIS SKINS</span>
          </div>
          <span style={{ fontSize: compact ? 8 : 10, color: ACCENT, fontWeight: 700 }}>128</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: compact ? 6 : 8,
        }}>
          {Array.from({ length: compact ? 4 : 6 }).map((_, i) => (
            <MiniSkinCard key={i} hue={hues[i % hues.length]} idx={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

const navBtnBase = {
  padding: '9px 22px',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  letterSpacing: '0.3px',
  transition: 'all 0.2s ease',
};

export default function LandingPage({ onLogin, onRegister }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse 60% 45% at 82% 8%, rgba(255,70,85,0.14) 0%, transparent 60%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Navbar */}
      <nav style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '22px 48px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '1px' }}>
          <span style={{ color: '#fff' }}>VALO</span><span style={{ color: ACCENT }}>INVENTORY</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onLogin}
            style={{ ...navBtnBase, background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.25)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
          >
            Login
          </button>
          <button
            onClick={onRegister}
            style={{ ...navBtnBase, background: ACCENT, color: '#fff', border: '1.5px solid ' + ACCENT }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e63946'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ACCENT; }}
          >
            Register
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 1280,
        margin: '0 auto',
        padding: '110px 48px 80px',
        gap: 60,
        flexWrap: 'wrap',
      }}>
        {/* Mockup visual */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          style={{ flex: '1 1 460px', position: 'relative', minHeight: 380, maxWidth: 560 }}
        >
          <DeviceMock width="100%" height={340} />
          <div style={{ position: 'absolute', bottom: -36, right: -16 }}>
            <DeviceMock width={170} height={230} compact />
          </div>
        </motion.div>

        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ flex: '1 1 380px', maxWidth: 480 }}
        >
          <h1 style={{
            fontSize: 44,
            fontWeight: 900,
            color: ACCENT,
            lineHeight: 1.1,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            margin: '0 0 20px 0',
          }}>
            Discover<br />ValoInventory
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 32 }}>
            Explorá y compartí tus cuentas de Valorant con ValoInventory. La plataforma ideal
            para revisar estadísticas, gestionar tu inventario de skins y compartirlo con tus amigos.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRegister}
            style={{
              background: 'transparent',
              color: '#fff',
              border: '2px solid #fff',
              borderRadius: 30,
              padding: '14px 32px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            Comenzar &gt;
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
