import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './InventoryNavbar.module.css';

export default function InventoryNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const navs = [
    { label: 'Home', path: '/' },
    { label: 'Loadout', path: '/mis-skins' },
    { label: 'Inventory', path: '/inventory' },
    { label: 'Details', path: '/details' },
  ];

  return (
    <div className={styles.nav}>
      <div className={styles.inner}>
        <div className={styles.brand} onClick={() => navigate('/')}>
          VALO<span className={styles.brandAccent}>INVENTORY</span>
        </div>
        <div className={styles.links}>
          {navs.map((nav) => {
            const isActive = nav.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(nav.path);
            return (
              <button
                key={nav.path}
                onClick={() => navigate(nav.path)}
                className={`${styles.link} ${isActive ? styles.linkActive : ''}`}
              >
                {nav.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
