import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './AppHeader.module.css';

export default function AppHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  const goToAccounts = () => {
    setMenuOpen(false);
    navigate('/');
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/');
  };

  const userInitial = user?.username?.charAt(0)?.toUpperCase() || 'U';

  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <button type="button" className={styles.titleButton} onClick={() => navigate('/')}>
          VALO<span className={styles.titleAccent}>INVENTORY</span>
        </button>

        {user && (
          <div className={styles.settings} ref={menuRef}>
            <button
              type="button"
              className={`${styles.settingsButton} ${menuOpen ? styles.settingsButtonOpen : ''}`}
              onClick={() => setMenuOpen(current => !current)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls="account-settings-menu"
            >
              <span className={styles.avatar} aria-hidden="true">{userInitial}</span>
              <span className={styles.settingsLabel}>Settings</span>
              <span className={styles.chevron} aria-hidden="true">⌄</span>
            </button>

            {menuOpen && (
              <div id="account-settings-menu" className={styles.menu} role="menu">
                <div className={styles.accountSummary}>
                  <span className={styles.accountEyebrow}>Your account</span>
                  <strong className={styles.accountName}>{user.username}</strong>
                  {user.email && <span className={styles.accountEmail}>{user.email}</span>}
                </div>

                <div className={styles.menuSection}>
                  <span className={styles.menuSectionLabel}>Account</span>
                  <button type="button" className={styles.menuItem} role="menuitem" onClick={goToAccounts}>
                    <span>
                      <strong>Manage Riot accounts</strong>
                      <small>Add, update, or delete accounts</small>
                    </span>
                    <span className={styles.menuArrow} aria-hidden="true">→</span>
                  </button>
                </div>

                <div className={styles.logoutSection}>
                  <button type="button" className={styles.logoutButton} role="menuitem" onClick={handleLogout}>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
