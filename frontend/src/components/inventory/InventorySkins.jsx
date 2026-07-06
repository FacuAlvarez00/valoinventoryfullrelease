import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useLanguage } from '../../context/LanguageContext';
import InventoryNavbar from './InventoryNavbar';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BackButton, SkeletonBlock, Modal } from '../ui/kit';
import { getSkinPrice, isGoldenSkin } from '../../utils/pricing';
import styles from './InventorySkins.module.css';

export default function InventorySkins() {
  const { riotAccount, loading, error, catalog, weaponSkins } = useInventory();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Estados para búsqueda y filtro
  const [search, setSearch] = useState('');
  const [weaponType, setWeaponType] = useState('');
  const [exclusiveOnly, setExclusiveOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVideo, setModalVideo] = useState(null);

  // Verificar que los datos estén completamente cargados
  const catalogReady = catalog && catalog.skins && catalog.skinlevels && catalog.chromas && catalog.weapons && catalog.skins.length > 0 && catalog.skinlevels.length > 0;
  const allSkins = riotAccount?.skins || [];

  const getPriceForSkin = (baseName) => getSkinPrice(baseName, weaponSkins);

  // Agrupar allSkins por nombre base usando el catálogo de skinlevels
  const skinlevels = catalog?.skinlevels || [];
  const skinsPorBase = {};
  allSkins.forEach(skin => {
    const skinLevelObj = skinlevels.find(s => s.uuid === skin.ItemID);
    if (!skinLevelObj) return;
    const baseName = skinLevelObj.displayName.split(' Level ')[0].trim();
    if (!skinsPorBase[baseName]) skinsPorBase[baseName] = [];
    skinsPorBase[baseName].push(skinLevelObj);
  });

  // Ordenar las skins por precio descendente, las que no tienen precio al final
  const skinsOrdenadas = Object.entries(skinsPorBase).sort((a, b) => {
    const precioA = getPriceForSkin(a[0]);
    const precioB = getPriceForSkin(b[0]);
    if (precioA && precioB) return precioB - precioA;
    if (precioA) return -1;
    if (precioB) return 1;
    return 0;
  });

  // Calcular recuento total de skins y VP gastados
  const totalSkins = Object.keys(skinsPorBase).length;
  const totalVP = useMemo(() => {
    return Object.keys(skinsPorBase).reduce((acc, baseName) => {
      const price = getPriceForSkin(baseName);
      return price ? acc + price : acc;
    }, 0);
  }, [skinsPorBase, weaponSkins]);

  // Tipos de arma presentes en las skins del usuario (via catálogo, con fallback por keywords)
  const availableWeapons = useMemo(() => {
    if (!catalog?.weapons || !Object.keys(skinsPorBase).length) return [];
    const meleeKeywords = ['knife', 'karambit', 'axe', 'sword', 'dagger', 'blade', 'melee'];
    const seen = new Map();
    Object.keys(skinsPorBase).forEach(baseName => {
      // 1. Buscar por catálogo de skins (más preciso, cubre knives sin keywords)
      const skinCatalog = catalog.skins?.find(s => s.displayName === baseName);
      if (skinCatalog?.weapon?.uuid) {
        const w = catalog.weapons.find(ww => ww.uuid === skinCatalog.weapon.uuid);
        if (w && !seen.has(w.uuid)) seen.set(w.uuid, w.displayName);
        return;
      }
      // 2. Fallback: keywords para melee, nombre para el resto
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
  }, [skinsPorBase, catalog?.weapons, catalog?.skins]);

  // Filtrar y buscar
  const filteredSkins = useMemo(() => {
    return skinsOrdenadas.filter(([baseName]) => {
      if (search && !baseName.toLowerCase().includes(search.toLowerCase())) return false;
      if (exclusiveOnly && !isGoldenSkin(baseName)) return false;
      if (weaponType) {
        const selectedWeapon = catalog?.weapons?.find(w => w.uuid === weaponType);
        if (!selectedWeapon) return false;
        // 1. Buscar por catálogo (más preciso)
        const skinCatalog = catalog?.skins?.find(s => s.displayName === baseName);
        if (skinCatalog?.weapon?.uuid) return skinCatalog.weapon.uuid === weaponType;
        // 2. Fallback: keywords para melee, nombre para el resto
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
  }, [skinsOrdenadas, search, weaponType, exclusiveOnly, catalog?.weapons]);

  const skeletons = Array.from({ length: 18 }); // 3 filas de 6

  if (loading || !riotAccount || !catalogReady || !weaponSkins.length) {
    return (
      <>
        <InventoryNavbar />
        <div className={styles.page}>
          <SkeletonBlock width={200} height={40} radius={2} style={{ marginBottom: 24 }} />

          <div className={styles.skeletonRow}>
            <SkeletonBlock width={180} height={28} radius={2} />
            <SkeletonBlock width={200} height={28} radius={2} />
            <SkeletonBlock width={220} height={40} radius={2} />
            <SkeletonBlock width={200} height={40} radius={2} />
          </div>

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
      </>
    );
  }
  if (error) return <div className={styles.page} style={{ color: 'var(--vi-red)' }}>{error}</div>;

  return (
    <>
      <InventoryNavbar />
      {/* Modal para mostrar el streamedVideo */}
      <Modal open={modalOpen && !!modalVideo} onClose={() => setModalOpen(false)} maxWidth={900}>
        <div className={styles.videoModalBody}>
          <button className={styles.videoClose} onClick={() => setModalOpen(false)}>×</button>
          <video src={modalVideo} controls autoPlay className={styles.video} />
        </div>
      </Modal>

      <div className={styles.page}>
        <BackButton onClick={() => navigate('/inventory')} style={{ marginBottom: 24 }}>
          {t.backToDashboard}
        </BackButton>

        {/* Stats + Filtros */}
        <div>
          <div className={styles.summaryRow}>
            <div className={styles.statsGroup}>
              <span className={styles.statTotal}>{totalSkins} {t.totalSkins || 'Total de skins'}</span>
              <div className={styles.statVp}>
                <img src="/assets/icons/20px-White_Valorant_Points_VALORANT.png" alt="VP" style={{ width: 18, height: 18 }} />
                {totalVP.toLocaleString()} VP
              </div>
            </div>
            <div className={styles.actionsGroup}>
              <input
                type="text"
                placeholder={t.searchSkinPlaceholder || 'Buscar skin por nombre...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={styles.searchInput}
              />
              <button
                onClick={() => {
                  const text = skinsOrdenadas.map(([baseName]) => baseName).join(', ');
                  const blob = new Blob([text], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'skins.txt';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                title="Descargar lista de skins"
                className={styles.downloadBtn}
              >
                ↓ Descargar
              </button>
            </div>
          </div>

          {/* Chips de filtro */}
          <div className={styles.chipsRow}>
            <button
              onClick={() => { setWeaponType(''); setExclusiveOnly(false); }}
              className={`${styles.chip} ${!weaponType && !exclusiveOnly ? styles.chipActive : ''}`}
            >
              Todas
            </button>
            <button
              onClick={() => setExclusiveOnly(v => !v)}
              className={`${styles.chip} ${styles.chipGold} ${exclusiveOnly ? styles.chipGoldActive : ''}`}
            >
              ⭐ Exclusivas
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

        {/* Grid de 6 columnas, cards más grandes y uniformes */}
        <div className={styles.grid}>
          {filteredSkins.map(([baseName, skins], idx) => {
            let skinBaseObj = catalog.skins.find(s => s.displayName === baseName);
            if (!skinBaseObj) {
              skinBaseObj = catalog.skins.find(s => s.displayName.toLowerCase().includes(baseName.toLowerCase()));
            }
            // Buscar el primer nivel que tenga displayIcon válido
            const nivelConIcono = skins.find(s => s.displayIcon);
            // Usar fullRender del chroma base (índice 0) si existe, sino usar displayIcon del nivel
            let imgSrc = '';
            if (skinBaseObj && skinBaseObj.chromas && skinBaseObj.chromas[0] && skinBaseObj.chromas[0].fullRender) {
              imgSrc = skinBaseObj.chromas[0].fullRender;
            } else {
              imgSrc = nivelConIcono?.displayIcon || '';
            }
            // Tomar chromas del objeto base si existe
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
                {/* Parte superior: swatches a la izquierda, precio a la derecha */}
                <div className={styles.cardTopRow}>
                  <div className={styles.swatchGroup}>
                    {chromasBase.map((chroma, chromaIdx) => {
                      // chromaFromSkinBase: chroma de catalog.skins (no tiene streamedVideo)
                      const chromaFromSkinBase = skinBaseObj?.chromas?.[chromaIdx];
                      // Buscar en catalog.chromas (de /v1/weapons/skinchromas) que SÍ tiene streamedVideo
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
                                  console.error('[Swatcher] Error al obtener video del chroma:', e);
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
                {/* Imagen centrada y tamaño uniforme */}
                <div className={styles.cardImageWrap}>
                  {imgSrc && <img src={imgSrc} alt={baseName} loading="lazy" decoding="async" className={styles.cardImage} />}
                </div>
                <div className={styles.cardName}>{baseName}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
}
