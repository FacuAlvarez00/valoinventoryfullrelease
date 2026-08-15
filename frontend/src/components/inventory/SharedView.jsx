import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSkinPrice, isGoldenSkin } from '../../utils/pricing';
import { getDefaultBattlePassImage } from '../../data/battlePassImages';
import { Pagination } from '../ui/kit';
import usePagination from '../../hooks/usePagination';
import { PAGE_SIZES } from '../../config/pagination';
import styles from './SharedView.module.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://valoinventory-1.onrender.com';

const CATEGORY_ART = {
  skins: '/assets/dashboard/SKINS.webp',
  buddies: '/assets/dashboard/GUNBUDDIES.jpg',
  cards: '/assets/dashboard/CARDS.webp',
  sprays: '/assets/dashboard/SPRAYS.jpg',
  flex: '/assets/dashboard/FLEX.jpg',
  titles: '/assets/dashboard/TITLES.webp',
};

function SharedViewSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-label="Loading shared inventory">
      <header className={styles.publicHeader}>
        <div className={styles.brand}>VALO<span>INVENTORY</span></div>
        <div className={styles.skeletonBadge} />
      </header>
      <main className={styles.main}>
        <div className={styles.skeletonHero}>
          <div className={styles.skeletonIdentity}>
            <div className={styles.skeletonLineShort} />
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonLine} />
          </div>
          <div className={styles.skeletonValue} />
        </div>
        <div className={styles.skeletonExplorer}>
          <div className={styles.skeletonCategories}>
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className={styles.skeletonCategory} />
            ))}
          </div>
          <div className={styles.skeletonItems}>
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className={styles.skeletonItem} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SharedView() {
  const { token } = useParams();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState({ skins: [], skinlevels: [], chromas: [] });
  const [weaponSkins, setWeaponSkins] = useState([]);
  const [activeSection, setActiveSection] = useState('skins');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const accRes = await fetch(`${API_BASE}/api/auth/public/account/${token}`);
        const accData = await accRes.json();
        if (!accData.success) {
          setError(accData.message || 'Invalid link');
          setLoading(false);
          return;
        }
        setAccount(accData.account);

        const [skinsRes, skinlevelsRes, chromasRes, wsRes] = await Promise.all([
          fetch('https://valorant-api.com/v1/weapons/skins'),
          fetch('https://valorant-api.com/v1/weapons/skinlevels'),
          fetch('https://valorant-api.com/v1/weapons/skinchromas'),
          fetch('https://vinfo-api.com/json/weaponSkins'),
        ]);
        const [skinsData, skinlevelsData, chromasData] = await Promise.all([
          skinsRes.json(), skinlevelsRes.json(), chromasRes.json(),
        ]);
        setCatalog({
          skins: skinsData.data || [],
          skinlevels: skinlevelsData.data || [],
          chromas: chromasData.data || [],
        });
        const wsData = await wsRes.json().catch(() => []);
        setWeaponSkins(Array.isArray(wsData) ? wsData : []);
      } catch {
        setError('Failed to load the inventory.');
      }
      setLoading(false);
    };
    fetchAll();
  }, [token]);

  const skinsByBaseName = useMemo(() => {
    if (!account || !catalog.skinlevels.length) return {};
    const map = {};
    (account.skins || []).forEach(skin => {
      const level = catalog.skinlevels.find(item => item.uuid === skin.ItemID);
      if (!level) return;
      const base = level.displayName.split(' Level ')[0].trim();
      if (!map[base]) map[base] = [];
      map[base].push(level);
    });
    return map;
  }, [account, catalog.skinlevels]);

  const sortedSkins = useMemo(() => (
    Object.entries(skinsByBaseName).sort((a, b) => {
      const priceA = getSkinPrice(a[0], weaponSkins);
      const priceB = getSkinPrice(b[0], weaponSkins);
      if (priceA && priceB) return priceB - priceA;
      if (priceA) return -1;
      if (priceB) return 1;
      return 0;
    })
  ), [skinsByBaseName, weaponSkins]);

  const totalVPSkins = useMemo(() => (
    Object.keys(skinsByBaseName).reduce(
      (sum, name) => sum + (getSkinPrice(name, weaponSkins) || 0),
      0
    )
  ), [skinsByBaseName, weaponSkins]);

  const totalVPBattlePasses = (account?.battlePasses?.length || 0) * 1000;
  const totalVP = totalVPSkins + totalVPBattlePasses;
  const totalFlex = 1 + (account?.flex?.Entitlements?.length || 0);

  const sections = useMemo(() => [
    { key: 'skins', label: 'Skins', count: Object.keys(skinsByBaseName).length, vpSpent: totalVPSkins, img: CATEGORY_ART.skins },
    { key: 'battlepass', label: 'Battlepasses', count: account?.battlePasses?.length || 0, vpSpent: totalVPBattlePasses, img: account?.battlePasses?.length ? getDefaultBattlePassImage() : null },
    { key: 'buddies', label: 'Gunbuddies', count: account?.buddies?.length || 0, img: CATEGORY_ART.buddies },
    { key: 'cards', label: 'Cards', count: account?.cards?.length || 0, img: CATEGORY_ART.cards },
    { key: 'sprays', label: 'Sprays', count: account?.sprays?.length || 0, img: CATEGORY_ART.sprays },
    { key: 'flex', label: 'Flex', count: totalFlex, img: CATEGORY_ART.flex },
    { key: 'titles', label: 'Titles', count: account?.titles?.length || 0, img: CATEGORY_ART.titles },
    { key: 'agents', label: 'Agents', count: account?.agents?.length || 0, img: account?.agents?.[0]?.fullPortrait || account?.agents?.[0]?.displayIcon },
  ], [account, skinsByBaseName, totalVPSkins, totalVPBattlePasses, totalFlex]);

  const activeCategory = sections.find(section => section.key === activeSection) || sections[0];
  const totalItems = sections.reduce((sum, section) => sum + section.count, 0);
  const riotId = account?.nickname || account?.name || 'Shared account';
  const accountLabel = account?.name && account.name !== riotId ? account.name : null;
  const activeItems = useMemo(() => {
    if (!account) return [];
    if (activeSection === 'skins') return sortedSkins;
    if (activeSection === 'battlepass') return account.battlePasses || [];
    if (activeSection === 'buddies') return account.buddies || [];
    if (activeSection === 'cards') return account.cards || [];
    if (activeSection === 'sprays') return account.sprays || [];
    if (activeSection === 'flex') {
      return [
        { ItemID: 'standard-flex', displayName: 'Standard flex' },
        ...(account.flex?.Entitlements || []),
      ];
    }
    if (activeSection === 'titles') return account.titles || [];
    if (activeSection === 'agents') return account.agents || [];
    return [];
  }, [account, activeSection, sortedSkins]);
  const collectionPagination = usePagination(activeItems, {
    pageSize: PAGE_SIZES[activeSection] || PAGE_SIZES.skins,
    resetKey: activeSection,
  });

  const copyShareLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement('textarea');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <SharedViewSkeleton />;

  if (error) return (
    <div className={styles.errorPage}>
      <div className={styles.brand}>VALO<span>INVENTORY</span></div>
      <div className={styles.errorPanel}>
        <span className={styles.headerEyebrow}>Public inventory</span>
        <h1>This inventory is unavailable</h1>
        <p>{error}. Its owner may have disabled the link.</p>
        <a href="/">Go to ValoInventory</a>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <header className={styles.publicHeader}>
        <a href="/" className={styles.brand}>VALO<span>INVENTORY</span></a>
        <span className={styles.publicBadge}><i aria-hidden="true" /> Public inventory</span>
      </header>

      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="shared-account-name">
          <div className={styles.heroIdentity}>
            <span className={styles.headerEyebrow}>Shared account</span>
            <h1 id="shared-account-name" className={styles.accountTitle}>{riotId}</h1>
            <div className={styles.accountMeta}>
              {accountLabel && <span>{accountLabel}</span>}
              <span>
                Updated {account.lastUpdated
                  ? new Date(account.lastUpdated).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                  : 'N/A'}
              </span>
            </div>
          </div>

          <div className={styles.heroActions}>
            <div className={styles.valueBlock}>
              <span className={styles.valueLabel}>Estimated value</span>
              <strong className={styles.valueAmount}>
                {totalVP.toLocaleString()}
                <img src="/assets/icons/20px-White_Valorant_Points_VALORANT.png" alt="VP" />
              </strong>
            </div>
            <button type="button" className={styles.copyButton} onClick={copyShareLink}>
              {copied ? 'Link copied' : 'Copy link'}
            </button>
          </div>
        </section>

        <section className={styles.summaryStrip} aria-label="Inventory summary">
          <div><strong>{Object.keys(skinsByBaseName).length.toLocaleString()}</strong><span>Skins</span></div>
          <div><strong>{totalItems.toLocaleString()}</strong><span>Total items</span></div>
          <div><strong>{sections.filter(section => section.count > 0).length}</strong><span>Categories</span></div>
        </section>

        <section className={styles.collection} aria-labelledby="collection-title">
          <aside className={styles.collectionSidebar} aria-label="Inventory categories">
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.headerEyebrow}>Collection</span>
                <h2 id="collection-title">Inventory</h2>
              </div>
              <span className={styles.sectionHint}>Choose a category</span>
            </div>

            <div className={styles.categoryGrid} role="tablist" aria-label="Inventory categories">
              {sections.map(section => (
                <button
                  key={section.key}
                  id={`shared-category-${section.key}`}
                  type="button"
                  role="tab"
                  className={`${styles.categoryCard} ${activeSection === section.key ? styles.categoryCardActive : ''}`}
                  onClick={() => setActiveSection(section.key)}
                  aria-selected={activeSection === section.key}
                  aria-controls="shared-inventory-items"
                >
                  {section.img && <img src={section.img} alt="" className={styles.categoryArt} />}
                  <span className={styles.categoryOverlay} />
                  <span className={styles.categoryContent}>
                    <strong>{section.label}</strong>
                    <span><b>{section.count.toLocaleString()}</b> items</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <div
            id="shared-inventory-items"
            className={styles.detailSection}
            aria-live="polite"
          >
            <div className={styles.detailHeader}>
              <div>
                <span className={styles.detailEyebrow}>Showing</span>
                <h2>{activeCategory.label}</h2>
              </div>
              <span className={styles.detailCount}>{activeCategory.count.toLocaleString()} items</span>
            </div>

            {activeSection === 'skins' && (
              <div className={`${styles.detailGrid} ${styles.skinGrid}`}>
                {collectionPagination.items.map(([baseName, ownedLevels]) => {
                  let skinBase = catalog.skins.find(skin => skin.displayName === baseName);
                  if (!skinBase) skinBase = catalog.skins.find(skin => skin.displayName.toLowerCase().includes(baseName.toLowerCase()));
                  const image = skinBase?.chromas?.[0]?.fullRender || ownedLevels.find(level => level.displayIcon)?.displayIcon || '';
                  const price = getSkinPrice(baseName, weaponSkins);
                  return (
                    <article key={baseName} className={`${styles.skinCard} ${isGoldenSkin(baseName) ? styles.skinCardGolden : ''}`}>
                      {price > 0 && <span className={styles.skinPrice}>{price.toLocaleString()} VP</span>}
                      <div className={styles.skinImageWrap}>
                        {image && <img src={image} alt="" className={styles.skinImage} loading="lazy" />}
                      </div>
                      <h3>{baseName}</h3>
                    </article>
                  );
                })}
                {!sortedSkins.length && <div className={styles.emptyState}>No skins in this collection.</div>}
              </div>
            )}

            {activeSection === 'battlepass' && (
              <div className={styles.textItems}>
                {collectionPagination.items.map((item, index) => <span key={item.ItemID || index}>{item.displayName || item.ItemID || `Battle Pass ${index + 1}`}</span>)}
                {!account.battlePasses?.length && <div className={styles.emptyState}>No battlepasses in this collection.</div>}
              </div>
            )}

            {activeSection === 'buddies' && (
              <div className={styles.detailGrid}>
                {collectionPagination.items.map((item, index) => (
                  <article key={item.ItemID || index} className={styles.itemCard}>
                    {item.displayIcon && <img src={item.displayIcon} alt="" loading="lazy" />}
                    <h3>{item.displayName || 'Gunbuddy'}</h3>
                  </article>
                ))}
                {!account.buddies?.length && <div className={styles.emptyState}>No gunbuddies in this collection.</div>}
              </div>
            )}

            {activeSection === 'cards' && (
              <div className={styles.detailGrid}>
                {collectionPagination.items.map((item, index) => (
                  <article key={item.ItemID || index} className={`${styles.itemCard} ${styles.playerCard}`}>
                    {(item.smallArt || item.displayIcon) && <img src={item.smallArt || item.displayIcon} alt="" loading="lazy" />}
                    <h3>{item.displayName || 'Player card'}</h3>
                  </article>
                ))}
                {!account.cards?.length && <div className={styles.emptyState}>No player cards in this collection.</div>}
              </div>
            )}

            {activeSection === 'sprays' && (
              <div className={styles.detailGrid}>
                {collectionPagination.items.map((item, index) => (
                  <article key={item.ItemID || index} className={styles.itemCard}>
                    {item.displayIcon && <img src={item.displayIcon} alt="" loading="lazy" />}
                    <h3>{item.displayName || 'Spray'}</h3>
                  </article>
                ))}
                {!account.sprays?.length && <div className={styles.emptyState}>No sprays in this collection.</div>}
              </div>
            )}

            {activeSection === 'flex' && (
              <div className={styles.textItems}>
                {collectionPagination.items.map((item, index) => (
                  <span key={item.ItemID || index}>{item.displayName || `Flex ${index + 1}`}</span>
                ))}
              </div>
            )}

            {activeSection === 'titles' && (
              <div className={styles.textItems}>
                {collectionPagination.items.map((item, index) => <span key={item.ItemID || index}>{item.titleText || item.displayName || 'Title'}</span>)}
                {!account.titles?.length && <div className={styles.emptyState}>No titles in this collection.</div>}
              </div>
            )}

            {activeSection === 'agents' && (
              <div className={styles.detailGrid}>
                {collectionPagination.items.map((item, index) => (
                  <article key={item.ItemID || item.uuid || index} className={styles.itemCard}>
                    {(item.displayIconSmall || item.displayIcon || item.fullPortrait) && (
                      <img src={item.displayIconSmall || item.displayIcon || item.fullPortrait} alt="" loading="lazy" />
                    )}
                    <h3>{item.displayName || 'Agent'}</h3>
                  </article>
                ))}
                {!account.agents?.length && <div className={styles.emptyState}>No agents in this collection.</div>}
              </div>
            )}

            <Pagination
              {...collectionPagination}
              onPageChange={collectionPagination.setPage}
              itemLabel={activeCategory.label.toLowerCase()}
              scrollTargetId="shared-inventory-items"
            />
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>Inventory shared with ValoInventory</span>
      </footer>
    </div>
  );
}
