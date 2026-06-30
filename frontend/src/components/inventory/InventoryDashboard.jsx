import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import InventoryNavbar from './InventoryNavbar';
import { useInventory } from '../../context/InventoryContext';
import useStaticAgents from '../../hooks/useStaticAgents'; // 

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

  const sections = [
    { key: 'skins',      label: 'SKINS',       count: totalTarjetasSkins, vpSpent: totalVPSkins, bg: '#1a2636' },
    { key: 'battlepass', label: 'BATTLEPASSES',count: totalBattlePasses,  vpSpent: totalVPBattlePasses, bg: '#222b3a' },
    { key: 'buddies',    label: 'GUNBUDDIES',  count: totalBuddies,       bg: '#1a2636' },
    { key: 'cards',      label: 'CARDS',       count: totalCards,         bg: '#222b3a' },
    { key: 'sprays',     label: 'SPRAYS',      count: totalSprays,        bg: '#1a2636' },
    { key: 'flex',       label: 'FLEX',        count: totalFlex,          bg: '#222b3a' },
    { key: 'titles',     label: 'TITLES',      count: totalTitles,        bg: '#222b3a' },
    { key: 'agents',     label: 'AGENTS',      count: totalAgents,        bg: '#1a2636' },
  ];

  return (
    <>
      <InventoryNavbar />
      <div style={{ padding: 32, paddingTop: 90 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 24 
        }}>
          <h2 style={{ color: '#fff', fontWeight: 'bold', fontSize: 32, letterSpacing: 2, margin: 0 }}>
            INVENTORY
          </h2>
          
          {/* Total Value display */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <div style={{
              background: '#ff4655',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 18,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              Total Value: {totalVPGastados.toLocaleString()}
              <img 
                src="/assets/icons/20px-White_Valorant_Points_VALORANT.png" 
                alt="VP" 
                style={{ width: 16, height: 16, marginLeft: 4 }}
              />
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 24 }}>
          {sections.map(section => (
            <div
              key={section.key}
              onClick={() => navigate(`/inventory/${section.key}`)}
              style={{
                background: section.bg,
                borderRadius: 12,
                minHeight: 220,
                cursor: 'pointer',
                boxShadow: '0 2px 12px #0007',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'transform 0.15s',
              }}
            >
              {/* VP gastados en esquina superior derecha */}
              {section.vpSpent !== undefined && (
                <div style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: '#ff4655',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  {section.vpSpent.toLocaleString()}
                  <img 
                    src="/assets/icons/20px-White_Valorant_Points_VALORANT.png" 
                    alt="VP" 
                    style={{ width: 12, height: 12, marginLeft: 2 }}
                  />
                </div>
              )}
              
              <div style={{ color: '#ff4655', fontWeight: 'bold', fontSize: 28, marginBottom: 8, letterSpacing: 1 }}>
                {section.label}
              </div>
              <div style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>{section.count}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
