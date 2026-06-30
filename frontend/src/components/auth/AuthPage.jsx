import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
export default function AuthPage({ initialIsLogin = true, onBack }) {
  const [isLogin, setIsLogin] = useState(initialIsLogin);

  const switchToRegister = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  return (
    <div style={{ position: 'relative' }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            zIndex: 10,
            background: 'rgba(255,255,255,0.06)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ← Volver
        </button>
      )}
      {isLogin ? (
        <Login onSwitchToRegister={switchToRegister} />
      ) : (
        <Register onSwitchToLogin={switchToLogin} />
      )}
    </div>
  );
} 