import React, { useState, useMemo } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useLanguage } from '../../context/LanguageContext';
import InventoryNavbar from './InventoryNavbar';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Helper: precio de una skin con fallbacks hardcodeados
  const getPriceForSkin = (baseName) => {
    if (baseName === 'VCT LOCK//IN Misericórdia') return 5440;
    if (baseName === 'VCT 2026 Sigil') return 5350;
    if (baseName === 'XERØFANG Vandal') return 1775;
    if (baseName === 'Arcane Vandal') return 2175;
    if (baseName === 'Arcane Gauntlets') return 4350;
    if (['Champions 2021 Karambit','Champions 2022 Butterfly Knife','Champions 2023 Kunai','Champions 2024 Blade','Champions 2025 Butterfly Knife'].includes(baseName)) return 5350;
    if (baseName.startsWith('Champions 202')) return 2675;
    if (/vct\d*\s+x\b/i.test(baseName)) return 2340;
    const skinBaseWeapon = weaponSkins.find(s => s.name === baseName);
    if (skinBaseWeapon?.price) {
      const price = Object.values(skinBaseWeapon.price)[0];
      if (price) return parseInt(price, 10);
    }
    return null;
  };

  const isGoldenSkin = (baseName) =>
    baseName.startsWith('Champions 202') ||
    /vct\d*\s+x\b/i.test(baseName) ||
    baseName === 'VCT LOCK//IN Misericórdia' ||
    baseName === 'VCT 2026 Sigil' ||
    baseName === 'Arcane Vandal' || baseName === 'Arcane Gauntlets';

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
        <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 60% 40%, #1a2636 60%, #0f1923 100%)', color: '#fff', padding: '40px', paddingTop: 90 }}>
          {/* Skeleton para el botón de volver */}
          <div style={{ 
            width: 200, 
            height: 40, 
            background: '#444a5a', 
            borderRadius: 8, 
            marginBottom: 24,
            animation: 'skeletonPulse 1.5s infinite ease-in-out'
          }} />
          
          {/* Skeleton para el resumen */}
          <div style={{ display: 'flex', gap: 32, alignItems: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
            <div style={{ 
              width: 180, 
              height: 28, 
              background: '#444a5a', 
              borderRadius: 6,
              animation: 'skeletonPulse 1.5s infinite ease-in-out'
            }} />
            <div style={{ 
              width: 200, 
              height: 28, 
              background: '#444a5a', 
              borderRadius: 6,
              animation: 'skeletonPulse 1.5s infinite ease-in-out'
            }} />
            <div style={{ 
              width: 220, 
              height: 40, 
              background: '#444a5a', 
              borderRadius: 8,
              animation: 'skeletonPulse 1.5s infinite ease-in-out'
            }} />
            <div style={{ 
              width: 200, 
              height: 40, 
              background: '#444a5a', 
              borderRadius: 8,
              animation: 'skeletonPulse 1.5s infinite ease-in-out'
            }} />
          </div>
          
          {/* Skeleton para el título */}
          <div style={{ 
            width: 300, 
            height: 40, 
            background: '#444a5a', 
            borderRadius: 8, 
            margin: '0 auto 24px auto',
            animation: 'skeletonPulse 1.5s infinite ease-in-out'
          }} />
          
          {/* Grid de skeleton cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            columnGap: 12,
            rowGap: 20,
            justifyItems: 'stretch',
            alignItems: 'stretch',
            width: '100%',
          }}>
            {skeletons.map((_, idx) => (
              <div key={idx} style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                padding: 12,
                width: '100%',
                height: 220,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Parte superior: swatches a la izquierda, precio a la derecha */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  {/* Swatchers skeleton */}
                  <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                    {Array.from({ length: Math.floor(Math.random() * 3) + 2 }).map((_, i) => (
                      <div key={i} style={{
                        width: 26, 
                        height: 26, 
                        borderRadius: 4, 
                        background: '#444a5a',
                        animation: 'skeletonPulse 1.5s infinite ease-in-out',
                        animationDelay: `${i * 0.1}s`
                      }} />
                    ))}
                  </div>
                  {/* Precio skeleton */}
                  <div style={{
                    width: Math.floor(Math.random() * 30) + 50,
                    height: 26,
                    background: '#444a5a',
                    borderRadius: 6,
                    animation: 'skeletonPulse 1.5s infinite ease-in-out',
                    animationDelay: '0.3s'
                  }} />
                </div>
                
                {/* Imagen skeleton */}
                <div style={{
                  width: '100%',
                  height: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 6
                }}>
                  <div style={{
                    width: Math.floor(Math.random() * 40) + 60,
                    height: Math.floor(Math.random() * 20) + 60,
                    background: '#444a5a',
                    borderRadius: 8,
                    animation: 'skeletonPulse 1.5s infinite ease-in-out',
                    animationDelay: '0.2s'
                  }} />
                </div>
                
                {/* Nombre skeleton */}
                <div style={{
                  width: Math.floor(Math.random() * 40) + 60,
                  height: 20,
                  background: '#444a5a',
                  borderRadius: 4,
                  marginBottom: 8,
                  animation: 'skeletonPulse 1.5s infinite ease-in-out',
                  animationDelay: '0.4s'
                }} />
              </div>
            ))}
          </div>
          
          {/* Animación pulse mejorada para skeleton */}
          <style>
            {`@keyframes skeletonPulse {
              0% { 
                opacity: 0.6; 
                transform: scale(1);
              }
              50% { 
                opacity: 1; 
                transform: scale(1.02);
              }
              100% { 
                opacity: 0.6; 
                transform: scale(1);
              }
            }`}
          </style>
        </div>
      </>
    );
  }
  if (error) return <div style={{ color: '#ff4655', padding: 40 }}>{error}</div>;

  return (
    <>
      <InventoryNavbar />
      {/* Modal para mostrar el streamedVideo */}
      <AnimatePresence>
        {modalOpen && modalVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.7)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30 
              }}
              style={{ 
                background: '#181e27', 
                borderRadius: 16, 
                padding: 0, 
                boxShadow: '0 4px 24px #000a', 
                maxWidth: 900, 
                width: '98vw', 
                position: 'relative',
                overflow: 'hidden'
              }} 
              onClick={e => e.stopPropagation()}
            >
              {/* Botón de cerrar fuera del video */}
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setModalOpen(false)} 
                style={{ 
                  position: 'absolute', 
                  top: 16, 
                  right: 16, 
                  background: 'rgba(0, 0, 0, 0.8)', 
                  border: '2px solid #ff4655',
                  borderRadius: '50%',
                  color: '#fff', 
                  fontSize: 24, 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                }}
              >
                ×
              </motion.button>
              <video 
                src={modalVideo} 
                controls 
                autoPlay 
                style={{ 
                  width: '100%', 
                  borderRadius: 12, 
                  background: '#000', 
                  maxHeight: '80vh',
                  display: 'block'
                }} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 60% 40%, #1a2636 60%, #0f1923 100%)', color: '#fff', padding: '40px', paddingTop: 90 }}>
        <motion.button 
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          onClick={() => navigate('/inventory')} 
          style={{ marginBottom: 24, background: '#222b3a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #0005' }}
        >
          ← {t.backToDashboard}
        </motion.button>
        {/* Stats + Filtros */}
        <div style={{ marginBottom: 28 }}>
          {/* Fila de stats y búsqueda */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <span style={{ fontSize: 20, fontWeight: 'bold', color: '#ff4655' }}>
                {totalSkins} {t.totalSkins || 'Total de skins'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 20, fontWeight: 'bold', color: '#ffb347' }}>
                <img
                  src="/assets/icons/20px-White_Valorant_Points_VALORANT.png"
                  alt="VP"
                  style={{ width: 18, height: 18 }}
                />
                {totalVP.toLocaleString()} VP
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="text"
                placeholder={t.searchSkinPlaceholder || 'Buscar skin por nombre...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: '1.5px solid #333',
                  fontSize: 14,
                  outline: 'none',
                  minWidth: 260,
                  background: '#222b3a',
                  color: '#fff',
                }}
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
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: '1.5px solid #333',
                  background: '#222b3a',
                  color: '#fff',
                  fontSize: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#ff4655'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#333'}
              >
                ↓ Descargar
              </button>
            </div>
          </div>

          {/* Chips de filtro */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => { setWeaponType(''); setExclusiveOnly(false); }}
              style={{
                padding: '6px 18px',
                borderRadius: 20,
                border: `1.5px solid ${!weaponType && !exclusiveOnly ? '#ff4655' : '#333'}`,
                background: !weaponType && !exclusiveOnly ? 'rgba(255,70,85,0.15)' : 'transparent',
                color: !weaponType && !exclusiveOnly ? '#ff4655' : '#888',
                fontWeight: 'bold', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              Todas
            </button>
            <button
              onClick={() => setExclusiveOnly(v => !v)}
              style={{
                padding: '6px 18px',
                borderRadius: 20,
                border: `1.5px solid ${exclusiveOnly ? '#a07820' : '#333'}`,
                background: exclusiveOnly ? 'linear-gradient(135deg, #2a1e00 0%, #4a3200 100%)' : 'transparent',
                color: exclusiveOnly ? '#ffd700' : '#888',
                fontWeight: 'bold', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              ⭐ Exclusivas
            </button>
            {availableWeapons.map(w => (
              <button
                key={w.uuid}
                onClick={() => setWeaponType(prev => prev === w.uuid ? '' : w.uuid)}
                style={{
                  padding: '6px 18px',
                  borderRadius: 20,
                  border: `1.5px solid ${weaponType === w.uuid ? '#ff4655' : '#333'}`,
                  background: weaponType === w.uuid ? 'rgba(255,70,85,0.15)' : 'transparent',
                  color: weaponType === w.uuid ? '#ff4655' : '#888',
                  fontWeight: 'bold', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
        {/* Grid de 6 columnas, cards más grandes y uniformes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          columnGap: 12,
          rowGap: 20,
          justifyItems: 'stretch',
          alignItems: 'stretch',
          width: '100%',
          overflow: 'visible',
          position: 'relative',
        }}>
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
            const nombreBase = baseName;
            const nivelesDesbloqueados = skins.map(s => s.displayName);
            let nivelMasAlto = nombreBase;
            let maxLevel = 0;
            nivelesDesbloqueados.forEach(n => {
              const match = n.match(/Level (\d+)/);
              if (match) {
                const lvl = parseInt(match[1], 10);
                if (lvl > maxLevel) {
                  maxLevel = lvl;
                  nivelMasAlto = n.replace(/\s*\(.*\)/, '');
                }
              }
            });
            const isInteractive = !!(skinBaseWeapon && skinBaseWeapon.price);
            const vct = isGoldenSkin(baseName);
            const skinPrice = getPriceForSkin(baseName);
            return (
              <motion.div
                key={skinBaseWeapon?.id || skins[0].uuid || idx}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.05,
                  type: "spring",
                  stiffness: 100
                }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: vct
                    ? 'linear-gradient(135deg, #2a1e00 0%, #4a3200 50%, #2a1e00 100%)'
                    : '#1a1a1a',
                  border: vct ? '1px solid #a07820' : '1px solid #333',
                  padding: 12,
                  width: '100%',
                  height: 220,
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                {/* Parte superior: swatches a la izquierda, precio a la derecha */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                    {chromasBase.map((chroma, chromaIdx) => {
                      // chromaFromSkinBase: chroma de catalog.skins (no tiene streamedVideo)
                      const chromaFromSkinBase = skinBaseObj?.chromas?.[chromaIdx];
                      // Buscar en catalog.chromas (de /v1/weapons/skinchromas) que SÍ tiene streamedVideo
                      const chromaUuid = chromaFromSkinBase?.uuid || chroma.uuid;
                      const chromaFull = chromaUuid ? catalog.chromas.find(c => c.uuid === chromaUuid) : null;
                      const hasStreamedVideo = !!(chromaFull?.streamedVideo || (chromaIdx === 0 && skins.some(s => s.streamedVideo)));
                      const isInteractive = !!(skinBaseWeapon && skinBaseWeapon.price && hasStreamedVideo);
                      const streamedVideo = chromaFull?.streamedVideo;
                      return chroma.swatch ? (
                        <div
                          key={chroma.id}
                          style={{ position: 'relative' }}
                          onMouseEnter={e => {
                            if (!isInteractive && skinBaseWeapon && skinBaseWeapon.price) {
                              const tooltip = e.currentTarget.querySelector('.no-preview-tooltip');
                              if (tooltip) {
                                tooltip.style.opacity = '1';
                              }
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isInteractive && skinBaseWeapon && skinBaseWeapon.price) {
                              const tooltip = e.currentTarget.querySelector('.no-preview-tooltip');
                              if (tooltip) {
                                tooltip.style.opacity = '0';
                              }
                            }
                          }}
                        >
                          <img
                        src={chroma.swatch}
                        alt={chroma.name}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 4,
                              border: '1px solid #222',
                              cursor: isInteractive ? 'pointer' : 'default',
                              transition: 'filter 0.2s',
                              filter: 'brightness(1)',
                            }}
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
                          onMouseEnter={e => {
                            if (isInteractive) {
                              e.currentTarget.style.filter = 'brightness(0.7)';
                            } else {
                              e.currentTarget.style.filter = 'brightness(1)';
                            }
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.filter = 'brightness(1)';
                          }}
                        />
                        {!isInteractive && skinBaseWeapon && skinBaseWeapon.price && (
                          <div style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#ff4655',
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 'bold',
                            padding: '4px 8px',
                            borderRadius: 4,
                            whiteSpace: 'nowrap',
                            zIndex: 9999,
                            marginBottom: 4,
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            pointerEvents: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                          }}
                          className="no-preview-tooltip">
                            No preview available
                          </div>
                        )}
                      </div>
                    ) : null;
                    })}
                  </div>
                  {skinPrice && (
                    <div style={{
                      background: '#ff4655',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: 16,
                      borderRadius: 6,
                      padding: '2px 12px',
                      height: 26,
                      display: 'flex',
                      alignItems: 'center',
                      zIndex: 2
                    }}>
                      {skinPrice.toLocaleString()}
                    </div>
                  )}
                </div>
                {/* Imagen centrada y tamaño uniforme */}
                <div style={{ width: '100%', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                  {imgSrc && (
                    <>
                      {baseName === 'Oni Phantom' && console.log('[DEBUG][Oni Phantom] Imagen a mostrar:', imgSrc)}
                    <img src={imgSrc} alt={baseName} style={{ maxWidth: '100%', maxHeight: 80, objectFit: 'contain', margin: '0 auto' }} />
                    </>
                  )}
                </div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + (idx * 0.05), duration: 0.4 }}
                  style={{ color: '#fff', fontWeight: '600', fontSize: 18, marginBottom: 12, marginTop: 8 }}
                >
                  {baseName}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
} 