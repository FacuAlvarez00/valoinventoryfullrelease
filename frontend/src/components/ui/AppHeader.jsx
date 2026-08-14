import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { TacticalButton } from './kit';
import styles from './AppHeader.module.css';

const NAV_ITEMS = [
  { labelKey: 'home', path: '/' },
  { label: 'Details', path: '/details' },
  { labelKey: 'loadout', path: '/mis-skins' },
  { labelKey: 'inventory', path: '/inventory' },
];

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <div className={styles.headerMain}>
          <button type="button" className={styles.titleButton} onClick={() => navigate('/')}>
            VALO<span className={styles.titleAccent}>INVENTORY</span>
          </button>

          <nav className={styles.nav} aria-label="Primary">
            {NAV_ITEMS.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

              return (
                <button
                  key={item.path}
                  type="button"
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                  onClick={() => navigate(item.path)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.labelKey ? t[item.labelKey] : item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className={styles.headerUser}>
          {user?.username && (
            <span className={styles.headerWelcome}>{t.welcome}, {user.username}!</span>
          )}
          <TacticalButton variant="ghost" size="sm" onClick={logout} aria-label={t.logout}>
            {t.logout}
          </TacticalButton>
        </div>
      </div>
    </header>
  );
}
