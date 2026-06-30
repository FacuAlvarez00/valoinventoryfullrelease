import React, { useMemo, useState } from 'react';
import InventoryNavbar from './InventoryNavbar';
import { useInventory } from '../../context/InventoryContext';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../ui/LoadingScreen';

export default function InventoryDetails() {
  const navigate = useNavigate();
  const { riotAccount, loading, error, catalog, weaponSkins } = useInventory();
  const [copiedUuid, setCopiedUuid] = useState(false);

  const handleCopyUuid = () => {
    if (!riotAccount?.puuid) return;
    navigator.clipboard.writeText(riotAccount.puuid);
    setCopiedUuid(true);
    setTimeout(() => setCopiedUuid(false), 2000);
  };

  // Calcular total de VP gastados (igual que en InventoryDashboard)
  const totalVPGastados = useMemo(() => {
    if (!riotAccount) return 0;
    
    // VP gastados en skins
    let totalVPSkins = 0;
    if (weaponSkins && weaponSkins.length > 0 && riotAccount.skins) {
      const skinsPorBase = {};
      riotAccount.skins.forEach(skin => {
        const skinLevelObj = catalog?.skinlevels?.find(s => s.uuid === skin.ItemID);
        if (skinLevelObj) {
          const baseName = skinLevelObj.displayName.split(' Level ')[0].trim();
          if (!skinsPorBase[baseName]) skinsPorBase[baseName] = [];
          skinsPorBase[baseName].push(skinLevelObj);
        }
      });
      
      totalVPSkins = Object.keys(skinsPorBase).reduce((acc, baseName) => {
        if (baseName === 'VCT LOCK//IN Misericórdia') return acc + 5440;
        if (baseName === 'VCT 2026 Sigil') return acc + 5350;
        if (baseName === 'XERØFANG Vandal') return acc + 1775;
        if (baseName === 'Arcane Vandal') return acc + 2175;
        if (baseName === 'Arcane Gauntlets') return acc + 4350;
        if (['Champions 2021 Karambit','Champions 2022 Butterfly Knife','Champions 2023 Kunai','Champions 2024 Blade','Champions 2025 Butterfly Knife'].includes(baseName)) return acc + 5350;
        if (baseName.startsWith('Champions 202')) return acc + 2675;
        if (/vct\d*\s+x\b/i.test(baseName)) return acc + 2340;

        const skinBaseWeapon = weaponSkins.find(s => s.name === baseName);
        if (skinBaseWeapon?.price) {
          const price = Object.values(skinBaseWeapon.price)[0];
          if (price) return acc + parseInt(price, 10);
        }
        return acc;
      }, 0);
    }
    
    // VP gastados en battle passes (1000 VP por battle pass)
    const totalVPBattlePasses = (riotAccount.battlePasses?.length || 0) * 1000;
    
    return totalVPSkins + totalVPBattlePasses;
  }, [riotAccount, catalog, weaponSkins]);

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

  // Función para formatear fechas
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para obtener el nombre de la región
  const getRegionName = (affinity) => {
    const regions = {
      'am': 'North America',
      'ap': 'Asia Pacific', 
      'br': 'Brazil',
      'eu': 'Europe',
      'kr': 'Korea',
      'latam': 'Latin America',
      'na': 'North America'
    };
    return regions[affinity] || affinity?.toUpperCase() || 'Unknown';
  };

  // Función para obtener el nombre del país
  const getCountryName = (countryCode) => {
    const countries = {
      'arg': 'Argentina',
      'us': 'United States',
      'br': 'Brazil',
      'mx': 'Mexico',
      'cl': 'Chile',
      'co': 'Colombia',
      'pe': 'Peru',
      'uy': 'Uruguay',
      'py': 'Paraguay',
      'bo': 'Bolivia',
      'ec': 'Ecuador',
      've': 'Venezuela',
      'ca': 'Canada'
    };
    return countries[countryCode] || countryCode?.toUpperCase() || 'N/A';
  };

  return (
    <>
      <InventoryNavbar />
      <div style={{ 
        padding: 32, 
        color: '#fff', 
        paddingTop: 90, 
        minHeight: '100vh', 
        background: 'radial-gradient(ellipse at 60% 40%, #1a2636 60%, #0f1923 100%)' 
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 24 
        }}>
          <button 
            onClick={() => navigate('/inventory')} 
            style={{ 
              background: '#222b3a', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 8, 
              padding: '8px 24px', 
              fontWeight: 'bold', 
              fontSize: 16, 
              cursor: 'pointer', 
              boxShadow: '0 2px 8px #0005' 
            }}
          >
            ← Volver al Dashboard
          </button>
        </div>
        
        <h2 style={{ color: '#ff4655', marginBottom: 32 }}>DETAILS - UserInfo Raw Data</h2>

        {loading && <LoadingScreen fullscreen={false} text="Cargando datos de la cuenta..." />}

        {error && (
          <div style={{
            background: '#2d1b1b',
            border: '1px solid #ff4655',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24
          }}>
            <h3 style={{ color: '#ff4655', marginBottom: 16 }}>❌ Error</h3>
            <p style={{ color: '#fff', fontSize: 14 }}>{error}</p>
          </div>
        )}

        {!loading && !error && !riotAccount && (
          <div style={{
            background: '#2d1b1b',
            border: '1px solid #ff4655',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24
          }}>
            <h3 style={{ color: '#ff4655', marginBottom: 16 }}>⚠️ Sin Cuenta Riot</h3>
            <p style={{ color: '#fff', fontSize: 14 }}>
              No se encontró una cuenta Riot vinculada. Agrega una cuenta en tu perfil para ver los detalles.
            </p>
          </div>
        )}

        {riotAccount && riotAccount.userInfo && Object.keys(riotAccount.userInfo).length > 0 && (
          <>
            {/* Account Info Card */}
            <div style={{
              background: '#1a1a1a',
              borderRadius: 12,
              padding: 32,
              marginBottom: 24,
              border: '1px solid #333'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 32
              }}>
                <h3 style={{ 
                  color: '#fff', 
                  fontSize: 24, 
                  fontWeight: 'bold',
                  margin: 0,
                  letterSpacing: 1
                }}>
                  ACCOUNT INFO
                </h3>
                <div style={{
                  color: '#fff',
                  fontSize: 14,
                  opacity: 0.7
                }}>
                  Last updated: {formatDate(riotAccount.lastUpdated)}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 40
              }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #333' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>IGN:</span>
                    <span style={{ color: '#fff' }}>
                      {riotAccount.userInfo.acct?.game_name}#{riotAccount.userInfo.acct?.tag_line}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #333', gap: 12 }}>
                    <span style={{ color: '#fff', fontWeight: 'bold', flexShrink: 0 }}>UUID:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ color: '#aaa', fontFamily: 'monospace', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {riotAccount.puuid}
                      </span>
                      <button
                        onClick={handleCopyUuid}
                        style={{
                          background: copiedUuid ? 'rgba(76,175,80,0.15)' : 'rgba(255,70,85,0.1)',
                          border: `1px solid ${copiedUuid ? '#4caf50' : '#ff4655'}`,
                          borderRadius: 6,
                          color: copiedUuid ? '#4caf50' : '#ff4655',
                          fontSize: 12,
                          padding: '3px 10px',
                          cursor: 'pointer',
                          flexShrink: 0,
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                      >
                        {copiedUuid ? '✓ Copiado' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #333' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>Username:</span>
                    <span style={{ color: '#fff' }}>{riotAccount.userInfo.username || 'N/A'}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #333' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>Region:</span>
                    <span style={{ color: '#fff' }}>
                      {riotAccount.regionInfo?.affinities?.live ? getRegionName(riotAccount.regionInfo.affinities.live) : getRegionName(riotAccount.userInfo.affinity?.pp)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #333' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>Country:</span>
                    <span style={{ color: '#fff' }}>
                      {getCountryName(riotAccount.userInfo.country)}
                    </span>
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #333' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>Age:</span>
                    <span style={{ color: '#fff' }}>
                      {riotAccount.userInfo.age ? `${riotAccount.userInfo.age} years` : 'N/A'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #333' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>Email Verified:</span>
                    <span style={{ 
                      color: riotAccount.userInfo.email_verified ? '#4CAF50' : '#ff4655',
                      fontWeight: 'bold'
                    }}>
                      {riotAccount.userInfo.email_verified ? 'YES' : 'NO'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #333' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>Phone Verified:</span>
                    <span style={{ 
                      color: riotAccount.userInfo.phone_number_verified ? '#4CAF50' : '#ff4655',
                      fontWeight: 'bold'
                    }}>
                      {riotAccount.userInfo.phone_number_verified ? 'YES' : 'NO'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #333' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>Registration Date:</span>
                    <span style={{ color: '#fff' }}>
                      {formatDate(riotAccount.userInfo.acct?.created_at)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #333' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>Total Spent:</span>
                    <span style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {totalVPGastados.toLocaleString()}
                      <img 
                        src="/assets/icons/20px-White_Valorant_Points_VALORANT.png" 
                        alt="VP" 
                        style={{ width: 12, height: 12 }}
                      />
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #333' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>Radiant Buddies:</span>
                    <span style={{ color: '#FFD700', fontWeight: 'bold' }}>
                      {radiantBuddies}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #333' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>Immortal Buddies:</span>
                    <span style={{ color: '#FF0000', fontWeight: 'bold' }}>
                      {immortalBuddies}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </>
        )}

        {riotAccount && (!riotAccount.userInfo || Object.keys(riotAccount.userInfo).length === 0) && (
          <div style={{
            background: '#2d1b1b',
            border: '1px solid #ffa726',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24
          }}>
            <h3 style={{ color: '#ffa726', marginBottom: 16 }}>⚠️ Sin UserInfo</h3>
            <p style={{ color: '#fff', fontSize: 14 }}>
              La cuenta Riot está vinculada pero no se encontró información de UserInfo. 
              Intenta refrescar la cuenta para obtener los datos más recientes.
            </p>
          </div>
        )}

      </div>
    </>
  );
}