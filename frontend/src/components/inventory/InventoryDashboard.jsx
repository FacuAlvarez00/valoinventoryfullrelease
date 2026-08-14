import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import InventoryNavbar from './InventoryNavbar';
import { useInventory } from '../../context/InventoryContext';
import useStaticAgents from '../../hooks/useStaticAgents'; //
import { getDefaultBattlePassImage } from '../../data/battlePassImages';
import styles from './InventoryDashboard.module.css';

export default function InventoryDashboard() {
  const navigate = useNavigate();
  const { riotAccount, catalog, weaponSkins, getSkinPrice } = useInventory();
  const { staticAgents } = useStaticAgents(); // 👈 nuevo

  // ----- SKINS -----
  const allSkins = riotAccount?.skins || [];
  const skinlevels = catalog?.skinlevels || [];
  const skinsPorBase = {};
  allSkins.forEach(skin => {
    const skinLevelObj = skinlevels.find(s => s.uuid === skin.ItemID);
    if (!skinLevelObj) return;
    const baseName = skinLevelObj.displayName.split(' Level ')[0].trim();
    if (!skinsPorBase[baseName]) skinsPorBase[baseName] = [];
    skinsPorBase[baseName].push(skinLevelObj);
  });
  const totalTarjetasSkins = Object.keys(skinsPorBase).length;

  // Calcular VP gastados en skins
  const totalVPSkins = useMemo(() => {
    return Object.keys(skinsPorBase).reduce((acc, baseName) => {
      const price = getSkinPrice(baseName);
      return price ? acc + price : acc;
    }, 0);
  }, [skinsPorBase, getSkinPrice]);

  // ----- BUDDIES / PASSES / CARDS / SPRAYS / TITLES / FLEX -----
  const totalBuddies = (riotAccount?.buddies || []).length;
  const totalBattlePasses = (riotAccount?.battlePasses || []).length;
  const totalCards = (riotAccount?.cards || []).length;
  const totalSprays = (riotAccount?.sprays || []).length;
  const totalTitles = (riotAccount?.titles || []).length;
  // Flex por defecto (1) + flex del usuario
  const totalFlex = 1 + (riotAccount?.flex?.Entitlements || []).length;

  // Contar Radiant e Immortal Buddies
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

  // Calcular VP gastados en battle passes (1000 VP por battle pass)
  const totalVPBattlePasses = totalBattlePasses * 1000;

  // ----- AGENTS (merge backend + estáticos) -----
  const mergedAgents = useMemo(() => {
    const backend = Array.isArray(riotAccount?.agents) ? riotAccount.agents : [];
    const byKey = new Map();
    [...backend, ...staticAgents].forEach(a => {
      // clave robusta para evitar duplicados
      const key = (a.uuid || a.ItemID || a.id || a.displayName || '').toString().toLowerCase();
      if (!byKey.has(key)) byKey.set(key, a);
    });
    return Array.from(byKey.values());
  }, [riotAccount, staticAgents]);

  const totalAgents = mergedAgents.length; // 👈 ahora sí cuenta 7+5=12

  // Calcular total de VP gastados (skins + battle passes)
  const totalVPGastados = totalVPSkins + totalVPBattlePasses;

  // ----- FOTOS REPRESENTATIVAS POR CATEGORÍA -----
  const firstAgentImg = mergedAgents?.[0]?.fullPortrait || null;
  const battlePassImg = totalBattlePasses > 0 ? getDefaultBattlePassImage() : null;

  const sections = [
    { key: 'skins',      label: 'SKINS',       count: totalTarjetasSkins, vpSpent: totalVPSkins, img: '/assets/dashboard/SKINS.webp' },
    { key: 'battlepass', label: 'BATTLEPASSES',count: totalBattlePasses,  vpSpent: totalVPBattlePasses, img: battlePassImg },
    { key: 'buddies',    label: 'GUNBUDDIES',  count: totalBuddies, img: '/assets/dashboard/GUNBUDDIES.jpg' },
    { key: 'cards',      label: 'CARDS',       count: totalCards, img: '/assets/dashboard/CARDS.webp' },
    { key: 'sprays',     label: 'SPRAYS',      count: totalSprays, img: '/assets/dashboard/SPRAYS.jpg' },
    { key: 'flex',       label: 'FLEX',        count: totalFlex, img: '/assets/dashboard/FLEX.jpg' },
    { key: 'titles',     label: 'TITLES',      count: totalTitles, img: '/assets/dashboard/TITLES.webp' },
    { key: 'agents',     label: 'AGENTS',      count: totalAgents, img: firstAgentImg },
  ];

  return (
    <>
      <InventoryNavbar />
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <h2 className={styles.heading}>Inventory</h2>

          <div className={styles.totalValue}>
            Total Value: {totalVPGastados.toLocaleString()}
            <img
              src="/assets/icons/20px-White_Valorant_Points_VALORANT.png"
              alt="VP"
              style={{ width: 16, height: 16 }}
            />
          </div>
        </div>
        <div className={styles.grid}>
          {sections.map(section => (
            <div
              key={section.key}
              onClick={() => navigate(`/inventory/${section.key}`)}
              className={styles.tile}
            >
              {section.img && (
                <>
                  <img src={section.img} alt="" className={styles.tileImg} />
                  <div className={section.key === 'buddies' ? styles.tileOverlayLight : styles.tileOverlay} />
                </>
              )}

              {section.vpSpent !== undefined && (
                <div className={styles.tileVp}>
                  {section.vpSpent.toLocaleString()}
                  <img
                    src="/assets/icons/20px-White_Valorant_Points_VALORANT.png"
                    alt="VP"
                    style={{ width: 12, height: 12 }}
                  />
                </div>
              )}

              <div className={styles.tileLabel}>{section.label}</div>
              <div className={styles.tileCount}>{section.count}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
