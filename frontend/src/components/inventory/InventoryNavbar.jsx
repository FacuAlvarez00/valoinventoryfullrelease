import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import styles from './InventoryNavbar.module.css';

const ACCOUNT_SECTIONS = [
  { label: 'Overview', path: '/details', matches: pathname => pathname === '/details' },
  { label: 'Loadout', path: '/loadout', matches: pathname => pathname === '/loadout' },
  { label: 'Inventory', path: '/inventory', matches: pathname => pathname.startsWith('/inventory') },
];

export default function InventoryNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { riotAccount } = useInventory();
  const puuid = riotAccount?.puuid || localStorage.getItem('selected_riot_puuid');
  const riotId = riotAccount?.nickname
    || (riotAccount?.userInfo?.acct?.game_name
      ? `${riotAccount.userInfo.acct.game_name}#${riotAccount.userInfo.acct.tag_line}`
      : null);

  const goToSection = (path) => {
    const search = puuid ? `?puuid=${encodeURIComponent(puuid)}` : '';
    navigate(`${path}${search}`);
  };

  return (
    <section className={styles.scopeBar} aria-label="Account navigation">
      <div className={styles.inner}>
        <button type="button" className={styles.backButton} onClick={() => navigate('/')}>
          <span aria-hidden="true">←</span>
          All accounts
        </button>

        <div className={styles.accountHeader}>
          {riotAccount ? (
            <>
              <div className={styles.accountName}>{riotAccount.name}</div>
              {riotId && <div className={styles.riotId}>{riotId}</div>}
            </>
          ) : (
            <div className={styles.accountNameSkeleton} aria-label="Loading account" />
          )}
        </div>

        <nav className={styles.sections} aria-label="Account sections">
          {ACCOUNT_SECTIONS.map(section => {
            const active = section.matches(location.pathname);
            return (
              <button
                key={section.path}
                type="button"
                className={`${styles.sectionLink} ${active ? styles.sectionLinkActive : ''}`}
                onClick={() => goToSection(section.path)}
                aria-current={active ? 'page' : undefined}
              >
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>
    </section>
  );
}
