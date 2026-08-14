import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../ui/LoadingScreen';
const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://valoinventory-1.onrender.com";

export default function Inventory() {
  const navigate = useNavigate();
  const {
    riotAccount, loading, setLoading, error, setError, catalog, setCatalog, catalogLoading, setCatalogLoading, weaponSkins, setWeaponSkins
  } = useInventory();
  const { makeAuthenticatedRequest } = useAuth();

  useEffect(() => {
    const fetchAccount = async () => {
      setLoading(true);
      setError('');
      // The account state is owned by InventoryContext
      const puuid = localStorage.getItem('selected_riot_puuid');
      if (!puuid) {
        setError('No Riot account is selected.');
        setLoading(false);
        return;
      }
      try {
        const res = await makeAuthenticatedRequest(`${API_BASE}/api/auth/profile`);
        const data = await res.json();
        if (data.success && data.user && data.user.riotAccounts) {
          const acc = data.user.riotAccounts.find(a => a.puuid === puuid);
          if (acc) {
            // Debug wallet
            console.log('🔍 [Inventory] Wallet data:', acc.wallet);
            console.log('🔍 [Inventory] Currency details:', acc.currencyDetails);
            console.log('🔍 [Inventory] Account properties:', Object.keys(acc));
          } else {
            setError('The selected Riot account was not found.');
          }
        } else {
          setError('The user profile could not be loaded.');
        }
      } catch (e) {
        setError('A network error occurred while loading the Riot account.');
      }
      setLoading(false);
    };
    fetchAccount();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      setCatalogLoading(true);
      try {
        const [weaponsRes, skinsRes, chromasRes, skinlevelsRes] = await Promise.all([
          fetch('https://valorant-api.com/v1/weapons'),
          fetch('https://valorant-api.com/v1/weapons/skins'),
          fetch('https://valorant-api.com/v1/weapons/skinchromas'),
          fetch('https://valorant-api.com/v1/weapons/skinlevels'),
        ]);
        const weaponsData = await weaponsRes.json();
        const skinsData = await skinsRes.json();
        const chromasData = await chromasRes.json();
        const skinlevelsData = await skinlevelsRes.json();
        setCatalog({
          weapons: weaponsData.data || [],
          skins: skinsData.data || [],
          chromas: chromasData.data || [],
          skinlevels: skinlevelsData.data || [],
        });
      } catch (e) {
        setCatalog({ weapons: [], skins: [], chromas: [], skinlevels: [] });
      }
      setCatalogLoading(false);
    };
    fetchCatalog();
  }, []);

  // Load skin pricing metadata on startup
  useEffect(() => {
    fetch('https://vinfo-api.com/json/weaponSkins')
      .then(res => res.json())
      .then(data => setWeaponSkins(data))
      .catch(err => {
        setWeaponSkins([]);
      });
  }, []);

  // Catalog lookup helpers
  const getWeaponById = (id) => catalog.weapons.find(w => w.uuid === id);
  const getSkinById = (id) => catalog.skins.find(s => s.uuid === id);
  const getChromaById = (id) => catalog.chromas.find(c => c.uuid === id);

  // Loadout and skins
  const loadoutGuns = riotAccount?.loadout?.Guns || [];
  const loadoutMelee = riotAccount?.loadout?.Melee || null;
  const allSkins = riotAccount?.skins || [];

  // Weapon categories used by the layout
  const weaponCategories = [
    { name: 'SIDEARMS', weapons: ['CLASSIC', 'SHORTY', 'FRENZY', 'GHOST', 'SHERIFF'] },
    { name: 'SMGS', weapons: ['STINGER', 'SPECTRE'] },
    { name: 'RIFLES', weapons: ['BULLDOG', 'GUARDIAN', 'PHANTOM', 'VANDAL'] },
    { name: 'SHOTGUNS', weapons: ['BUCKY', 'JUDGE'] },
    { name: 'SNIPER RIFLES', weapons: ['MARSHAL', 'OUTLAW', 'OPERATOR'] },
    { name: 'MACHINE GUNS', weapons: ['ARES', 'ODIN'] },
    { name: 'MELEE', weapons: ['MELEE'] }
  ];

  // Map weapon names to UUIDs
  const weaponNameToUuid = {};
  catalog.weapons.forEach(w => { weaponNameToUuid[w.displayName.toUpperCase()] = w.uuid; });

  // Map weapon UUIDs to loadout entries
  const loadoutMap = {};
  loadoutGuns.forEach(gun => { loadoutMap[gun.ID] = gun; });
  if (loadoutMelee) loadoutMap[loadoutMelee.ID] = loadoutMelee;

  // Render every owned skin grouped by base name
  const renderLoadout = () => (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ color: '#ff4655', textAlign: 'center', marginBottom: 24, fontSize: 32, letterSpacing: 2, fontWeight: 'bold', textTransform: 'uppercase' }}>ALL MY SKINS</h2>
      {allSkins.length === 0 ? (
        <div style={{ color: '#fff', textAlign: 'center' }}>No saved skins.</div>
      ) : (
        (() => {
          // Group skins by base name using the skin-level catalog
          const skinlevels = catalog.skinlevels || [];
          const skinsByBaseName = {};
          allSkins.forEach(skin => {
            const skinLevelObj = skinlevels.find(s => s.uuid === skin.ItemID);
            if (!skinLevelObj) return;
            const baseName = skinLevelObj.displayName.replace(/ Level \d+$/, '').trim();
            if (!skinsByBaseName[baseName]) skinsByBaseName[baseName] = [];
            skinsByBaseName[baseName].push(skinLevelObj);
          });
          // Sort skins by descending price and put unpriced skins last
          const sortedSkins = Object.entries(skinsByBaseName).sort((a, b) => {
            // Custom price for the VCT LOCK//IN skin
            const priceA = a[0] === 'VCT LOCK//IN Misericórdia' ? 5440 :
              (() => {
                const skinA = weaponSkins.find(s => s.name === a[0]);
                return skinA?.price ? Object.values(skinA.price)[0] : null;
              })();

            const priceB = b[0] === 'VCT LOCK//IN Misericórdia' ? 5440 :
              (() => {
                const skinB = weaponSkins.find(s => s.name === b[0]);
                return skinB?.price ? Object.values(skinB.price)[0] : null;
              })();

            if (priceA && priceB) return priceB - priceA;
            if (priceA) return -1;
            if (priceB) return 1;
            return 0;
          });
          return sortedSkins.map(([baseName, skins], idx) => {
            // Temporary display-name diagnostic
            if (baseName.includes('VCT') || baseName.includes('Misericórdia')) {
              console.log('🔍 [Inventory] Processing skin:', baseName, 'index:', idx);
            }

            // Find the base skin by exact or partial display name
            let skinBaseObj = catalog.skins.find(s => s.displayName === baseName);
            if (!skinBaseObj) {
              skinBaseObj = catalog.skins.find(s => s.displayName.toLowerCase().includes(baseName.toLowerCase()));
            }
            // Prefer the base level image
            const baseLevel = skins.find(
              s => !/Level \d+$/i.test(s.displayName) || s.levelItem === null
            );
            let imgSrc = baseLevel?.displayIcon || '';

            const unlockedLevels = skins.map(s => s.displayName);
            // Determine the highest unlocked level
            let highestLevelName = baseName;
            let maxLevel = 0;
            unlockedLevels.forEach(n => {
              const match = n.match(/Level (\d+)/);
              if (match) {
                const lvl = parseInt(match[1], 10);
                if (lvl > maxLevel) {
                  maxLevel = lvl;
                  highestLevelName = n.replace(/\s*\(.*\)/, '');
                }
              }
            });
            // Match the base skin against pricing metadata
            const skinBaseWeapon = weaponSkins.find(s => s.name === baseName);

            // Temporary VCT pricing diagnostic
            if (baseName === 'VCT LOCK//IN Misericórdia') {
              console.log('🔍 [Inventory] skinBaseWeapon found:', skinBaseWeapon);
              console.log('🔍 [Inventory] skinBaseWeapon?.price:', skinBaseWeapon?.price);
            }

            // Render all chroma swatches for the base skin
            return (
              <div key={skinBaseWeapon?.id || skins[0].uuid || idx} style={{ background: '#222b3a', borderRadius: 12, padding: 16, minWidth: 200, maxWidth: 220, minHeight: 260, maxHeight: 320, textAlign: 'center', boxShadow: '0 2px 12px #0007', display: 'inline-block', margin: 8, boxSizing: 'border-box', justifyContent: 'space-between', verticalAlign: 'top', position: 'relative' }}>
                {/* Floating price label */}
                {(() => {
                  // Custom price for the VCT LOCK//IN skin
                  if (baseName === 'VCT LOCK//IN Misericórdia') {
                    console.log('🎯 [Inventory] Applying custom VCT LOCK//IN price: 5440');
                    return (
                      <div style={{ position: 'absolute', top: 10, right: 10, background: '#ff4655', color: '#fff', fontWeight: 'bold', fontSize: 18, borderRadius: 6, padding: '2px 14px', zIndex: 2 }}>
                        5440
                      </div>
                    );
                  }

                  // Standard pricing for other skins
                  if (skinBaseWeapon?.price) {
                    const price = Object.values(skinBaseWeapon.price)[0];
                    if (price) {
                      return (
                        <div style={{ position: 'absolute', top: 10, right: 10, background: '#ff4655', color: '#fff', fontWeight: 'bold', fontSize: 18, borderRadius: 6, padding: '2px 14px', zIndex: 2 }}>
                          {price}
                        </div>
                      );
                    }
                  }

                  return null;
                })()}
                <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 2, marginBottom: 8, marginLeft: 8 }}>
                  {skinBaseWeapon?.chromas.map((chroma, i) =>
                    chroma.swatch ? (
                      <img
                        key={chroma.id}
                        src={chroma.swatch}
                        alt={chroma.name}
                        style={{ width: 18, height: 18, borderRadius: 3, border: '1px solid #222' }}
                      />
                    ) : null
                  )}
                </div>
                {imgSrc && (
                  <img src={imgSrc} alt={baseName} style={{ width: '100%', height: 80, objectFit: 'contain', marginBottom: 12 }} />
                )}
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{baseName}</div>
                {/* Temporary VCT pricing diagnostic */}
                {baseName === 'VCT LOCK//IN Misericórdia' && (
                  <div style={{ color: '#00ff00', fontSize: 10, marginTop: 4 }}>
                    DEBUG: Detected price = 5440
                  </div>
                )}
                {/* Base skin price */}
                {/* {skinBaseWeapon?.price && (
                  <div style={{ color: '#ffb347', fontWeight: 'bold', fontSize: 14, marginTop: 2 }}>
                    Price: {Object.values(skinBaseWeapon.price)[0]}
                  </div>
                )} */}
                <div style={{ color: '#ffb347', fontWeight: 'bold', fontSize: 13, marginTop: 4 }}>Unlocked levels: {skins.length}</div>
              </div>
            );
          });
        })()
      )}
    </div>
  );


  // Count unique base skins
  const skinlevels = catalog.skinlevels || [];
  const skinsByBaseName = {};
  allSkins.forEach(skin => {
    const skinLevelObj = skinlevels.find(s => s.uuid === skin.ItemID);
    if (!skinLevelObj) return;
    // Use the same base-name strategy as InventorySkins
    const baseName = skinLevelObj.displayName.split(' Level ')[0].trim();
    if (!skinsByBaseName[baseName]) skinsByBaseName[baseName] = [];
    skinsByBaseName[baseName].push(skinLevelObj);
  });
  const totalSkinCards = Object.keys(skinsByBaseName).length;

  // Count battle passes
  const totalBattlePasses = riotAccount?.battlePasses?.length || 0;

  // Navbar
  const Navbar = () => (
    <div style={{
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 100,
      background: 'rgba(20, 25, 35, 0.98)',
      boxShadow: '0 2px 12px #0007',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '18px 0',
      gap: 32
    }}>
      <button onClick={() => navigate('/')} style={{ background: 'none', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: 20, letterSpacing: 2, cursor: 'pointer', padding: '8px 24px', borderRadius: 8, transition: 'background 0.2s' }}>Home</button>
      <button onClick={() => navigate('/loadout')} style={{ background: 'none', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: 20, letterSpacing: 2, cursor: 'pointer', padding: '8px 24px', borderRadius: 8, transition: 'background 0.2s' }}>Loadout</button>
      <button onClick={() => navigate('/inventory')} style={{ background: '#ff4655', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: 20, letterSpacing: 2, cursor: 'pointer', padding: '8px 24px', borderRadius: 8, transition: 'background 0.2s' }}>Inventory</button>
    </div>
  );

  if (loading) return <LoadingScreen fullscreen={false} text="Loading inventory..." />;
  if (error) return <div style={{ color: '#ff4655', textAlign: 'center', marginTop: 80 }}>{error}</div>;
  if (!riotAccount) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 60% 40%, #1a2636 60%, #0f1923 100%)', color: '#fff', padding: '40px', paddingTop: 90 }}>
      <Navbar />
      <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginBottom: 48 }}>
        <div style={{ background: '#1a2233', borderRadius: 18, padding: '24px 40px', minWidth: 180, minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px #000a' }}>
          <div style={{ color: '#ff4655', fontWeight: 'bold', fontSize: 28, letterSpacing: 2, marginBottom: 8, textAlign: 'center' }}>SKINS</div>
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 38, textAlign: 'center', textShadow: '1px 2px 6px #000a' }}>{totalSkinCards}</div>
        </div>
        <div style={{ background: '#1a2233', borderRadius: 18, padding: '24px 40px', minWidth: 180, minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px #000a' }}>
          <div style={{ color: '#ff4655', fontWeight: 'bold', fontSize: 28, letterSpacing: 2, marginBottom: 8, textAlign: 'center' }}>BATTLEPASSES</div>
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 38, textAlign: 'center', textShadow: '1px 2px 6px #000a' }}>{totalBattlePasses}</div>
        </div>
        {/* Additional summary cards */}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ color: '#ff4655', letterSpacing: '2px', fontWeight: 'bold', margin: 0 }}>Riot account: {riotAccount.name} ({riotAccount.nickname || riotAccount.puuid})</h1>

        {/* Wallet information with local icons */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'right' }}>WALLET</div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            {/* VP - Valorant Points */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <img
                src="/assets/icons/20px-White_Valorant_Points_VALORANT.png"
                alt="Valorant Points"
                style={{ width: 24, height: 24, objectFit: 'contain' }}
              />
              <span style={{ color: '#ff4655', fontWeight: 'bold', fontSize: 16 }}>
                {riotAccount?.wallet?.Balances?.['85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741'] || 0}
              </span>
            </div>

            {/* KP - Kingdom Credits */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <img
                src="/assets/icons/kingdompoints.png"
                alt="Kingdom Credits"
                style={{ width: 24, height: 24, objectFit: 'contain' }}
              />
              <span style={{ color: '#00d4aa', fontWeight: 'bold', fontSize: 16 }}>
                {(riotAccount?.wallet?.Balances?.['85ca954a-41f2-ce94-9b45-8ca3dd39a00d'] || 0).toLocaleString()}
              </span>
            </div>

            {/* RP - Radianite Points */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <img
                src="/assets/icons/radianitepoints.png"
                alt="Radianite Points"
                style={{ width: 24, height: 24, objectFit: 'contain' }}
              />
              <span style={{ color: '#ff6b9d', fontWeight: 'bold', fontSize: 16 }}>
                {riotAccount?.wallet?.Balances?.['e59aa87c-4cbf-517a-5983-6e81511be9b7'] || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
      {renderLoadout()}
    </div>
  );
}
