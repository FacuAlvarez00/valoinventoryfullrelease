import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import { BackButton } from '../ui/kit';
import styles from './Auth.module.css';

export default function AuthPage({ initialIsLogin = true, onBack }) {
  const [isLogin, setIsLogin] = useState(initialIsLogin);

  const switchToRegister = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  return (
    <div style={{ position: 'relative' }}>
      {onBack && (
        <div className={styles.backWrap}>
          <BackButton onClick={onBack}>Back</BackButton>
        </div>
      )}
      {isLogin ? (
        <Login onSwitchToRegister={switchToRegister} />
      ) : (
        <Register onSwitchToLogin={switchToLogin} />
      )}
    </div>
  );
} 