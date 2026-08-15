import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { motion } from 'framer-motion';
import { SkeletonBlock, Modal, SearchInput, Pagination } from '../ui/kit';
import { getSkinPrice, isGoldenSkin } from '../../utils/pricing';
import usePagination from '../../hooks/usePagination';
import { PAGE_SIZES } from '../../config/pagination';
import InventoryCategoryHeader from './InventoryCategoryHeader';
import styles from './InventorySkins.module.css';
import categoryStyles from './InventoryList.module.css';

export default function InventorySkins() {
  const { riotAccount, loading, error, catalog, weaponSkins } = useInventory();

  // Search and filter state
  const [search, setSearch] = useState('');
  const [weaponType, setWeaponType] = useState('');
  const [exclusiveOnly, setExclusiveOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVideo, setModalVideo] = useState(null);

  // Ensure all required data has loaded
  const catalogReady = catalog && catalog.skins && catalog.skinlevels && catalog.chromas && catalog.weapons && catalog.skins.length > 0 && catalog.skinlevels.length > 0;
  const allSkins = riotAccount?.skins || [];

  const getPriceForSkin = (baseName) => getSkinPrice(baseName, weaponSkins);

  // Group owned skins by base name using the skin-level catalog
  const skinlevels = catalog?.skinlevels || [];
  const skinsByBaseName = {};
  allSkins.forEach(skin => {
    const skinLevelObj = skinlevels.find(s => s.uuid === skin.ItemID);
    if (!skinLevelObj) return;
    const baseName = skinLevelObj.displayName.split(' Level ')[0].trim();
    if (!skinsByBaseName[baseName]) skinsByBaseName[baseName] = [];
    skinsByBaseName[baseName].push(skinLevelObj);
  });

  // Sort skins by descending price, leaving skins without a price at the end
  const sortedSkins = Object.entries(skinsByBaseName).sort((a, b) => {
    const priceA = getPriceForSkin(a[0]);
    const priceB = getPriceForSkin(b[0]);
    if (priceA && priceB) return priceB - priceA;
    if (priceA) return -1;
    if (priceB) return 1;
    return 0;
  });

  // Calculate the total number of skins and spent VP
  const totalSkins = Object.keys(skinsByBaseName).length;
  const totalVP = useMemo(() => {
    return Object.keys(skinsByBaseName).reduce((acc, baseName) => {
      const price = getPriceForSkin(baseName);
      return price ? acc + price : acc;
    }, 0);
  }, [skinsByBaseName, weaponSkins]);

  // Weapon types found in the user's skins, with a keyword fallback
  const availableWeapons = useMemo(() => {
    if (!catalog?.weapons || !Object.keys(skinsByBaseName).length) return [];
    const meleeKeywords = ['knife', 'karambit', 'axe', 'sword', 'dagger', 'blade', 'melee'];
    const seen = new Map();
    Object.keys(skinsByBaseName).forEach(baseName => {
      // Prefer the skin catalog because it also covers knives without keywords
      const skinCatalog = catalog.skins?.find(s => s.displayName === baseName);
      if (skinCatalog?.weapon?.uuid) {
        const w = catalog.weapons.find(ww => ww.uuid === skinCatalog.weapon.uuid);
        if (w && !seen.has(w.uuid)) seen.set(w.uuid, w.displayName);
        return;
      }
      // Fall back to keywords for melee and names for other weapons
      const lowerBase = baseName.toLowerCase();
      if (meleeKeywords.some(k => lowerBase.includes(k))) {
        const melee = catalog.weapons.find(w => w.displayName.toLowerCase() === 'melee');
        if (melee && !seen.has(melee.uuid)) seen.set(melee.uuid, melee.displayName);
        return;
      }
      const matched = catalog.weapons.find(w =>
        w.displayName.toLowerCase() !== 'melee' &&
        lowerBase.includes(w.displayName.toLowerCase())
      );
      if (matched && !seen.has(matched.uuid)) seen.set(matched.uuid, matched.displayName);
    });
    return Array.from(seen.entries())
      .map(([uuid, label]) => ({ uuid, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [skinsByBaseName, catalog?.weapons, catalog?.skins]);

  // Apply search and filters
  const filteredSkins = useMemo(() => {
    return sortedSkins.filter(([baseName]) => {
      if (search && !baseName.toLowerCase().includes(search.toLowerCase())) return false;
      if (exclusiveOnly && !isGoldenSkin(baseName)) return false;
      if (weaponType) {
        const selectedWeapon = catalog?.weapons?.find(w => w.uuid === weaponType);
        if (!selectedWeapon) return false;
        // Prefer an exact catalog match
        const skinCatalog = catalog?.skins?.find(s => s.displayName === baseName);
        if (skinCatalog?.weapon?.uuid) return skinCatalog.weapon.uuid === weaponType;
        // Fall back to keywords for melee and names for other weapons
        const weaponName = selectedWeapon.displayName.toLowerCase();
        const skinName = baseName.toLowerCase();
        const meleeKeywords = ['knife', 'karambit', 'axe', 'sword', 'dagger', 'blade', 'melee'];
        if (weaponName === 'melee' || meleeKeywords.some(k => weaponName.includes(k))) {
          return meleeKeywords.some(k => skinName.includes(k));
        }
        return skinName.includes(weaponName);
      }
      return true;
    });
  }, [sortedSkins, search, weaponType, exclusiveOnly, catalog?.weapons]);

  const skinsPagination = usePagination(filteredSkins, {
    pageSize: PAGE_SIZES.skins,
    resetKey: `${search}|${weaponType}|${exclusiveOnly}`,
  });

  const skeletons = Array.from({ length: 18 }); // Three rows of six

  const downloadSkinList = () => {
    const text = sortedSkins.map(([baseName]) => baseName).join(', ');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'skins.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const categoryHeader = (
    <InventoryCategoryHeader
      title="Weapon Skins"
      description="Browse owned weapon skins, variants, upgrades, and estimated VP value."
      count={totalSkins}
      countLabel="skins"
      visibleCount={(search || weaponType || exclusiveOnly) ? filteredSkins.length : undefined}
      metric={(
        <div className={categoryStyles.categoryMetric}>
          <span className={categoryStyles.categoryMetricLabel}>Estimated value</span>
          <strong className={categoryStyles.categoryMetricValue}>
            {totalVP.toLocaleString()}
            <img src="/assets/icons/20px-White_Valorant_Points_VALORANT.png" alt="VP" />
          </strong>
        </div>
      )}
      actions={(
        <>
          <div className={categoryStyles.searchWrap}>
            <SearchInput
              placeholder="Search weapon skins..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={downloadSkinList}
            title="Download skin list"
            className={styles.downloadBtn}
          >
            ↓ Download list
          </button>
        </>
      )}
    />
  );

  if (error) {
    return (
      <div className={categoryStyles.page}>
        {categoryHeader}
        <div className={categoryStyles.errorState}>{error}</div>
      </div>
    );
  }

  if (loading || !riotAccount || !catalogReady || !weaponSkins.length) {
    return (
        <div className={categoryStyles.page}>
          {categoryHeader}
          <SkeletonBlock width={300} height={40} radius={2} style={{ margin: '0 auto 24px' }} />

          <div className={styles.grid}>
            {skeletons.map((_, idx) => (
              <div key={idx} className={styles.skeletonCard}>
                <div className={styles.skeletonTopRow}>
                  <div className={styles.skeletonSwatches}>
                    {Array.from({ length: Math.floor(Math.random() * 3) + 2 }).map((_, i) => (
                      <SkeletonBlock key={i} width={26} height={26} radius={2} />
                    ))}
                  </div>
                  <SkeletonBlock width={Math.floor(Math.random() * 30) + 50} height={26} radius={2} />
                </div>
                <SkeletonBlock width={Math.floor(Math.random() * 40) + 60} height={Math.floor(Math.random() * 20) + 60} radius={2} />
                <SkeletonBlock width={Math.floor(Math.random() * 40) + 60} height={20} radius={2} />
              </div>
            ))}
          </div>
        </div>
    );
  }
  return (
    <>
      {/* Streamed video modal */}
      <Modal open={modalOpen && !!modalVideo} onClose={() => setModalOpen(false)} maxWidth={900}>
        <div className={styles.videoModalBody}>
          <button className={styles.videoClose} onClick={() => setModalOpen(false)}>×</button>
          <video src={modalVideo} controls autoPlay className={styles.video} />
        </div>
      </Modal>

      <div className={categoryStyles.page}>
        {categoryHeader}

        <div>
          {/* Filter chips */}
          <div className={styles.chipsRow}>
            <button
              onClick={() => { setWeaponType(''); setExclusiveOnly(false); }}
              className={`${styles.chip} ${!weaponType && !exclusiveOnly ? styles.chipActive : ''}`}
            >
              All
            </button>
            <button
              onClick={() => setExclusiveOnly(v => !v)}
              className={`${styles.chip} ${styles.chipGold} ${exclusiveOnly ? styles.chipGoldActive : ''}`}
            >
              ⭐ Exclusive
            </button>
            {availableWeapons.map(w => (
              <button
                key={w.uuid}
                onClick={() => setWeaponType(prev => prev === w.uuid ? '' : w.uuid)}
                className={`${styles.chip} ${weaponType === w.uuid ? styles.chipActive : ''}`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Six-column grid with consistently sized cards */}
        <div id="inventory-skins-grid" className={styles.grid}>
          {skinsPagination.items.map(([baseName, skins], idx) => {
            let skinBaseObj = catalog.skins.find(s => s.displayName === baseName);
            if (!skinBaseObj) {
              skinBaseObj = catalog.skins.find(s => s.displayName.toLowerCase().includes(baseName.toLowerCase()));
            }
            // Find the first level with a valid display icon
            const levelWithIcon = skins.find(s => s.displayIcon);
            // Prefer the base chroma render, then fall back to the level icon
            let imgSrc = '';
            if (skinBaseObj && skinBaseObj.chromas && skinBaseObj.chromas[0] && skinBaseObj.chromas[0].fullRender) {
              imgSrc = skinBaseObj.chromas[0].fullRender;
            } else {
              imgSrc = levelWithIcon?.displayIcon || '';
            }
            // Use chromas from the base object when available
            const skinBaseWeapon = weaponSkins.find(s => s.name === baseName);
            const chromasBase = skinBaseWeapon?.chromas || (skinBaseObj ? catalog.chromas.filter(c => c.skinUuid === skinBaseObj.uuid) : []);
            const vct = isGoldenSkin(baseName);
            const skinPrice = getPriceForSkin(baseName);
            return (
              <motion.div
                key={skinBaseWeapon?.id || skins[0].uuid || idx}
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.6), ease: [0.16, 1, 0.3, 1] }}
                whileTap={{ scale: 0.98 }}
                className={`${styles.card} ${vct ? styles.cardGolden : ''}`}
              >
                {/* Top row: swatches on the left and price on the right */}
                <div className={styles.cardTopRow}>
                  <div className={styles.swatchGroup}>
                    {chromasBase.map((chroma, chromaIdx) => {
                      // The base catalog chroma does not include streamedVideo
                      const chromaFromSkinBase = skinBaseObj?.chromas?.[chromaIdx];
                      // catalog.chromas comes from /v1/weapons/skinchromas and includes streamedVideo
                      const chromaUuid = chromaFromSkinBase?.uuid || chroma.uuid;
                      const chromaFull = chromaUuid ? catalog.chromas.find(c => c.uuid === chromaUuid) : null;
                      const hasStreamedVideo = !!(chromaFull?.streamedVideo || (chromaIdx === 0 && skins.some(s => s.streamedVideo)));
                      const isInteractive = !!(skinBaseWeapon && skinBaseWeapon.price && hasStreamedVideo);
                      const streamedVideo = chromaFull?.streamedVideo;
                      const showNoPreviewTip = !isInteractive && skinBaseWeapon && skinBaseWeapon.price;
                      return chroma.swatch ? (
                        <div key={chroma.id} className={styles.swatchWrap}>
                          <img
                            src={chroma.swatch}
                            alt={chroma.name}
                            loading="lazy"
                            decoding="async"
                            className={`${styles.swatch} ${isInteractive ? styles.swatchInteractive : ''}`}
                            onClick={async () => {
                              if (!isInteractive) return;

                              if (streamedVideo) {
                                setModalVideo(streamedVideo);
                                setModalOpen(true);
                              } else if (chromaUuid) {
                                try {
                                  const res = await fetch(`https://valorant-api.com/v1/weapons/skinchromas/${chromaUuid}`);
                                  const data = await res.json();
                                  if (data?.data?.streamedVideo) {
                                    setModalVideo(data.data.streamedVideo);
                                    setModalOpen(true);
                                  }
                                } catch (e) {
                                  console.error('[Swatcher] Failed to fetch chroma video:', e);
                                }
                              }
                            }}
                          />
                          {showNoPreviewTip && (
                            <div className={styles.swatchTooltip}>No preview available</div>
                          )}
                        </div>
                      ) : null;
                    })}
                  </div>
                  {skinPrice && <div className={styles.priceTag}>{skinPrice.toLocaleString()}</div>}
                </div>
                {/* Centered image with a consistent size */}
                <div className={styles.cardImageWrap}>
                  {imgSrc && <img src={imgSrc} alt={baseName} loading="lazy" decoding="async" className={styles.cardImage} />}
                </div>
                <div className={styles.cardName}>{baseName}</div>
              </motion.div>
            );
          })}
        </div>

        <Pagination
          {...skinsPagination}
          onPageChange={skinsPagination.setPage}
          itemLabel="skins"
          scrollTargetId="inventory-skins-grid"
        />
      </div>
    </>
  );
}
