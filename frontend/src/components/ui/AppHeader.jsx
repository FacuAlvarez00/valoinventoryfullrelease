import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { TacticalButton } from './kit';
import styles from './AppHeader.module.css';

const NAV_ITEMS = [
  { labelKey: 'home', path: '/' },
  { labelKey: 'loadout', path: '/mis-skins' },
  { labelKey: 'inventory', path: '/inventory' },
  { label: 'Account', path: '/details' },
];

const INVENTORY_ITEMS = [
  { label: 'Dashboard', path: '/inventory' },
  { label: 'Skins', path: '/inventory/skins' },
  { label: 'Battlepass', path: '/inventory/battlepass' },
  { label: 'Buddies', path: '/inventory/buddies' },
  { label: 'Cards', path: '/inventory/cards' },
  { label: 'Sprays', path: '/inventory/sprays' },
  { label: 'Flex', path: '/inventory/flex' },
  { label: 'Titles', path: '/inventory/titles' },
  { label: 'Agents', path: '/inventory/agents' },
];

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const isInventoryRoute = location.pathname.startsWith('/inventory');

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

      {isInventoryRoute && (
        <nav className={styles.subNav} aria-label="Inventory sections">
          {INVENTORY_ITEMS.map((item) => {
            const isActive = item.path === '/inventory'
              ? location.pathname === '/inventory'
              : location.pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                type="button"
                className={`${styles.subNavLink} ${isActive ? styles.subNavLinkActive : ''}`}
                onClick={() => navigate(item.path)}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
