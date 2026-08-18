import React, { useState, useMemo } from 'react';
import JSZip from 'jszip';
import { useInventory } from '../../context/InventoryContext';
import { motion } from 'framer-motion';
import { SkeletonBlock, Modal, ModalHeader, ModalBody, SearchInput, Pagination } from '../ui/kit';
import { getSkinPrice, isGoldenSkin } from '../../utils/pricing';
import { addCatalogPagesToZip, triggerZipDownload, buildSkinsCatalogItems } from '../../utils/catalogImage';
import usePagination from '../../hooks/usePagination';
import { PAGE_SIZES } from '../../config/pagination';
import InventoryCategoryHeader from './InventoryCategoryHeader';
import styles from './InventorySkins.module.css';
import categoryStyles from './InventoryList.module.css';

export default function InventorySkins() {
  const { riotAccount, loading, error, catalog, weaponSkins } = useInventory();

  // Search and filter state
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVideo, setModalVideo] = useState(null);

  // Download state — image catalog (.zip of photos) and plain text list
  const [generatingCatalog, setGeneratingCatalog] = useState(false);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [catalogFilterMode, setCatalogFilterMode] = useState('all'); // 'all' | 'priceOnly' | 'exclusive'
  const [txtModalOpen, setTxtModalOpen] = useState(false);
  const [txtFilterMode, setTxtFilterMode] = useState('all'); // 'all' | 'priceOnly' | 'battlepass'

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

  // Apply search
  const filteredSkins = useMemo(() => {
    if (!search) return sortedSkins;
    return sortedSkins.filter(([baseName]) => baseName.toLowerCase().includes(search.toLowerCase()));
  }, [sortedSkins, search]);

  const skinsPagination = usePagination(filteredSkins, {
    pageSize: PAGE_SIZES.skins,
    resetKey: search,
  });

  const skeletons = Array.from({ length: 18 }); // Three rows of six

  // Items exportable to either download, already in the same price-desc,
  // unpriced-last order shown on screen — same builder used by the sibling
  // ValoInventory project, so both downloads stay consistent with that.
  const allCatalogItems = useMemo(
    () => buildSkinsCatalogItems(riotAccount, catalog, weaponSkins),
    [riotAccount, catalog, weaponSkins]
  );

  const catalogCounts = useMemo(() => ({
    all: allCatalogItems.length,
    priceOnly: allCatalogItems.filter(i => i.price).length,
    exclusive: allCatalogItems.filter(i => i.golden).length,
    // Battlepass skins: no VP price, unlocked through the pass instead.
    battlepass: allCatalogItems.filter(i => !i.price).length,
  }), [allCatalogItems]);

  const handleDownloadCatalog = async (mode) => {
    const items = mode === 'priceOnly'
      ? allCatalogItems.filter(i => i.price)
      : mode === 'exclusive'
        ? allCatalogItems.filter(i => i.golden)
        : allCatalogItems;
    if (generatingCatalog || items.length === 0) return;
    setGeneratingCatalog(true);
    try {
      const zip = new JSZip();
      await addCatalogPagesToZip(zip, items, 'skins_catalog');
      const accountSlug = (riotAccount?.name || 'account').replace(/[^a-z0-9]+/gi, '_');
      await triggerZipDownload(zip, `skins_catalog_${accountSlug}.zip`);
      setCatalogModalOpen(false);
    } catch (e) {
      console.error('Error generating the skin catalog:', e);
    } finally {
      setGeneratingCatalog(false);
    }
  };

  const handleDownloadTxt = (mode) => {
    const items = mode === 'priceOnly'
      ? allCatalogItems.filter(i => i.price)
      : mode === 'battlepass'
        ? allCatalogItems.filter(i => !i.price)
        : allCatalogItems;
    if (items.length === 0) return;
    const text = items.map(i => i.baseName).join(', ');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'skins.txt';
    anchor.click();
    URL.revokeObjectURL(url);
    setTxtModalOpen(false);
  };

  const categoryHeader = (
    <InventoryCategoryHeader
      title="Weapon Skins"
      description="Browse owned weapon skins, variants, upgrades, and estimated VP value."
      count={totalSkins}
      countLabel="skins"
      visibleCount={search ? filteredSkins.length : undefined}
      metric={(
        <div className={categoryStyles.categoryMetric}>
          <span className={categoryStyles.categoryMetricLabel}>Estimated value</span>
          <strong className={categoryStyles.categoryMetricValue}>
            {totalVP.toLocaleString()}
            <img src="/assets/icons/20px-White_Valorant_Points_VALORANT.png" alt="VP" />
          </strong>
        </div>
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

      {/* Image catalog download — pick which skins go into the .zip */}
      <Modal open={catalogModalOpen} onClose={() => setCatalogModalOpen(false)}>
        <ModalHeader title="🖼 Download image catalog" subtitle="6 skins per row, 5 rows per photo" />
        <ModalBody>
          <div className={styles.filterOptionList}>
            {[
              { mode: 'all', label: 'All', desc: 'Every owned skin', count: catalogCounts.all },
              { mode: 'priceOnly', label: 'Priced only', desc: 'Excludes battlepass skins (no VP price)', count: catalogCounts.priceOnly },
              { mode: 'exclusive', label: 'Exclusive only', desc: 'Only golden-background skins', count: catalogCounts.exclusive },
            ].map(opt => (
              <label
                key={opt.mode}
                className={`${styles.filterOption} ${catalogFilterMode === opt.mode ? styles.filterOptionActive : ''}`}
              >
                <input
                  type="radio"
                  name="catalogFilterMode"
                  checked={catalogFilterMode === opt.mode}
                  onChange={() => setCatalogFilterMode(opt.mode)}
                />
                <div className={styles.filterOptionText}>
                  <div className={styles.filterOptionLabel}>{opt.label}</div>
                  <div className={styles.filterOptionDesc}>{opt.desc}</div>
                </div>
                <div className={styles.filterOptionCount}>{opt.count}</div>
              </label>
            ))}
          </div>
          <button
            type="button"
            className={styles.filterSubmitBtn}
            onClick={() => handleDownloadCatalog(catalogFilterMode)}
            disabled={generatingCatalog || catalogCounts[catalogFilterMode] === 0}
          >
            {catalogCounts[catalogFilterMode] === 0
              ? 'No skins in this category'
              : generatingCatalog ? 'Generating…' : `Download (${catalogCounts[catalogFilterMode]})`}
          </button>
        </ModalBody>
      </Modal>

      {/* Text list download — pick which skins go into the .txt */}
      <Modal open={txtModalOpen} onClose={() => setTxtModalOpen(false)}>
        <ModalHeader title="↓ Download skin list (.txt)" subtitle="Names only, always sorted highest to lowest price" />
        <ModalBody>
          <div className={styles.filterOptionList}>
            {[
              { mode: 'all', label: 'All', desc: 'Every owned skin', count: catalogCounts.all },
              { mode: 'priceOnly', label: 'Priced only', desc: 'Excludes battlepass skins (no VP price)', count: catalogCounts.priceOnly },
              { mode: 'battlepass', label: 'Battlepass skins', desc: 'Only skins with no VP price', count: catalogCounts.battlepass },
            ].map(opt => (
              <label
                key={opt.mode}
                className={`${styles.filterOption} ${txtFilterMode === opt.mode ? styles.filterOptionActive : ''}`}
              >
                <input
                  type="radio"
                  name="txtFilterMode"
                  checked={txtFilterMode === opt.mode}
                  onChange={() => setTxtFilterMode(opt.mode)}
                />
                <div className={styles.filterOptionText}>
                  <div className={styles.filterOptionLabel}>{opt.label}</div>
                  <div className={styles.filterOptionDesc}>{opt.desc}</div>
                </div>
                <div className={styles.filterOptionCount}>{opt.count}</div>
              </label>
            ))}
          </div>
          <button
            type="button"
            className={styles.filterSubmitBtn}
            onClick={() => handleDownloadTxt(txtFilterMode)}
            disabled={catalogCounts[txtFilterMode] === 0}
          >
            {catalogCounts[txtFilterMode] === 0 ? 'No skins in this category' : `Download (${catalogCounts[txtFilterMode]})`}
          </button>
        </ModalBody>
      </Modal>

      <div className={categoryStyles.page}>
        {categoryHeader}

        <div className={styles.toolbar}>
          <div className={styles.toolbarSearch}>
            <SearchInput
              placeholder="Search weapon skins..."
              value={search}
              onChange={event => setSearch(event.target.value)}
              wrapStyle={{ display: 'flex', width: '100%' }}
            />
          </div>

          <div className={styles.toolbarActions}>
            <button
              type="button"
              onClick={() => setTxtModalOpen(true)}
              title={`Download the skin list as a .txt (${allCatalogItems.length})`}
              className={styles.downloadBtn}
            >
              Skins (txt)
            </button>
            <button
              type="button"
              onClick={() => setCatalogModalOpen(true)}
              disabled={generatingCatalog || allCatalogItems.length === 0}
              title={`Download an image catalog to share (${allCatalogItems.length})`}
              className={styles.downloadBtn}
            >
              {generatingCatalog ? 'Generating…' : 'Skins (jpg)'}
            </button>
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
