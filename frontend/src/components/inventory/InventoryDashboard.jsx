import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import useStaticAgents from '../../hooks/useStaticAgents';
import { getDefaultBattlePassImage } from '../../data/battlePassImages';
import styles from './InventoryDashboard.module.css';

export default function InventoryDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { riotAccount, catalog, weaponSkins, getSkinPrice } = useInventory();
  const { staticAgents } = useStaticAgents();

  // ----- SKINS -----
  const allSkins = riotAccount?.skins || [];
  const skinlevels = catalog?.skinlevels || [];
  const skinsByBaseName = {};
  allSkins.forEach(skin => {
    const skinLevelObj = skinlevels.find(s => s.uuid === skin.ItemID);
    if (!skinLevelObj) return;
    const baseName = skinLevelObj.displayName.split(' Level ')[0].trim();
    if (!skinsByBaseName[baseName]) skinsByBaseName[baseName] = [];
    skinsByBaseName[baseName].push(skinLevelObj);
  });
  const totalSkinCards = Object.keys(skinsByBaseName).length;

  // Calculate VP spent on skins
  const totalVPSkins = useMemo(() => {
    return Object.keys(skinsByBaseName).reduce((acc, baseName) => {
      const price = getSkinPrice(baseName);
      return price ? acc + price : acc;
    }, 0);
  }, [skinsByBaseName, getSkinPrice]);

  // ----- BUDDIES / PASSES / CARDS / SPRAYS / TITLES / FLEX -----
  const totalBuddies = (riotAccount?.buddies || []).length;
  const totalBattlePasses = (riotAccount?.battlePasses || []).length;
  const totalCards = (riotAccount?.cards || []).length;
  const totalSprays = (riotAccount?.sprays || []).length;
  const totalTitles = (riotAccount?.titles || []).length;
  // One default flex item plus the user's entitlements
  const totalFlex = 1 + (riotAccount?.flex?.Entitlements || []).length;

  // Count Radiant and Immortal buddies
  const radiantBuddies = useMemo(() => {
    if (!riotAccount?.buddies || riotAccount.buddies.length === 0) return 0;
    return riotAccount.buddies.filter(buddy =>
      buddy.displayName && buddy.displayName.toLowerCase().includes('radiant buddy')
    ).length;
  }, [riotAccount?.buddies]);

  const immortalBuddies = useMemo(() => {
    if (!riotAccount?.buddies || riotAccount.buddies.length === 0) return 0;
    return riotAccount.buddies.filter(buddy =>
      buddy.displayName &&
      buddy.displayName.toLowerCase().includes('immortal buddy') &&
      !buddy.displayName.toLowerCase().includes('immortal rose buddy')
    ).length;
  }, [riotAccount?.buddies]);

  // Estimate battle passes at 1,000 VP each
  const totalVPBattlePasses = totalBattlePasses * 1000;

  // ----- AGENTS -----
  const mergedAgents = useMemo(() => {
    const backend = Array.isArray(riotAccount?.agents) ? riotAccount.agents : [];
    const byKey = new Map();
    [...backend, ...staticAgents].forEach(a => {
      // Use a stable key to avoid duplicates
      const key = (a.uuid || a.ItemID || a.id || a.displayName || '').toString().toLowerCase();
      if (!byKey.has(key)) byKey.set(key, a);
    });
    return Array.from(byKey.values());
  }, [riotAccount, staticAgents]);

  const totalAgents = mergedAgents.length;

  // Combine the estimated skin and battle pass value
  const totalVPSpent = totalVPSkins + totalVPBattlePasses;

  // Representative artwork by category
  const firstAgentImg = mergedAgents?.[0]?.fullPortrait || null;
  const battlePassImg = totalBattlePasses > 0 ? getDefaultBattlePassImage() : null;

  const sections = [
    { key: 'skins',      label: 'SKINS',       count: totalSkinCards, vpSpent: totalVPSkins, img: '/assets/dashboard/SKINS.webp' },
    { key: 'battlepass', label: 'BATTLEPASSES',count: totalBattlePasses,  vpSpent: totalVPBattlePasses, img: battlePassImg },
    { key: 'buddies',    label: 'GUNBUDDIES',  count: totalBuddies, img: '/assets/dashboard/GUNBUDDIES.jpg' },
    { key: 'cards',      label: 'CARDS',       count: totalCards, img: '/assets/dashboard/CARDS.webp' },
    { key: 'sprays',     label: 'SPRAYS',      count: totalSprays, img: '/assets/dashboard/SPRAYS.jpg' },
    { key: 'flex',       label: 'FLEX',        count: totalFlex, img: '/assets/dashboard/FLEX.jpg' },
    { key: 'titles',     label: 'TITLES',      count: totalTitles, img: '/assets/dashboard/TITLES.webp' },
    { key: 'agents',     label: 'AGENTS',      count: totalAgents, img: firstAgentImg },
  ];

  const openSection = (sectionKey) => {
    navigate({
      pathname: `/inventory/${sectionKey}`,
      search: location.search
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.headerEyebrow}>Collection</div>
          <h2 className={styles.pageTitle}>Inventory</h2>
          <p className={styles.pageDescription}>
            Explore your cosmetics and collection progress by category.
          </p>
        </div>

        <div className={styles.totalValue} aria-label={`${totalVPSpent.toLocaleString()} VP estimated value`}>
          <span className={styles.totalValueLabel}>Estimated value</span>
          <span className={styles.totalValueAmount}>
            {totalVPSpent.toLocaleString()}
            <img
              src="/assets/icons/20px-White_Valorant_Points_VALORANT.png"
              alt="VP"
              className={styles.vpIcon}
            />
          </span>
        </div>
      </div>

      <div className={styles.collectionHeader}>
        <h3 className={styles.collectionTitle}>Categories</h3>
        <span className={styles.collectionMeta}>{sections.length} collections</span>
      </div>

      <div className={styles.grid}>
        {sections.map(section => (
          <button
            key={section.key}
            type="button"
            onClick={() => openSection(section.key)}
            className={styles.tile}
            aria-label={`Open ${section.label.toLowerCase()}, ${section.count} items`}
          >
            {section.img && (
              <>
                <img src={section.img} alt="" className={styles.tileImg} />
                <span className={section.key === 'buddies' ? styles.tileOverlayLight : styles.tileOverlay} />
              </>
            )}

            {section.vpSpent !== undefined && (
              <span className={styles.tileVp}>
                <span>{section.vpSpent.toLocaleString()}</span>
                <img
                  src="/assets/icons/20px-White_Valorant_Points_VALORANT.png"
                  alt="VP"
                />
              </span>
            )}

            <span className={styles.tileContent}>
              <span className={styles.tileLabel}>{section.label}</span>
              <span className={styles.tileFooter}>
                <span className={styles.tileQuantity}>
                  <span className={styles.tileCount}>{section.count.toLocaleString()}</span>
                  <span className={styles.tileCountLabel}>items</span>
                </span>
                <span className={styles.tileArrow} aria-hidden="true">→</span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
