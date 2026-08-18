import React, { useState, useEffect } from 'react';
import styles from './MySkins.module.css';
import { WeaponDetail } from '../weapons';
import { useInventory } from '../../context/InventoryContext';
import { PlayerCard, Notification } from '../ui';
import { TacticalButton } from '../ui/kit';
import useNotification from '../../hooks/useNotification';
const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://valoinventory-1.onrender.com";

const SKELETON_COLUMN_COUNTS = [6, 4, 5, 5];

function getDefaultSkin(weapon) {
  return weapon?.skins?.find(skin =>
    !skin.contentTierUuid &&
    !/random favorite skin/i.test(skin.displayName || '')
  ) || null;
}

function createDefaultSelection(weapon) {
  const defaultSkin = getDefaultSkin(weapon);
  const skinLevelId = defaultSkin?.levels?.[0]?.uuid;

  if (!skinLevelId) return null;

  return {
    ID: weapon.uuid,
    SkinLevelID: skinLevelId,
    ChromaID: defaultSkin.chromas?.[0]?.uuid || null
  };
}

function WeaponGridSkeleton() {
  return (
    <div className={styles.weaponGrid} aria-hidden="true">
      {SKELETON_COLUMN_COUNTS.map((count, columnIndex) => (
        <div key={columnIndex} className={styles.skeletonColumn}>
          <div className={styles.skeletonCategoryTitle} />
          <div className={styles.weaponList}>
            {Array.from({ length: count }).map((_, cardIndex) => (
              <div key={cardIndex} className={styles.skeletonWeaponCard}>
                <div className={styles.skeletonWeaponImage} />
                <div className={styles.skeletonWeaponName} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadoutWeaponImage({ src, alt }) {
  const [loaded, setLoaded] = useState(!src);

  useEffect(() => setLoaded(!src), [src]);

  return (
    <div className={styles.weaponCardImgWrap}>
      {!loaded && <div className={styles.weaponImagePlaceholder} aria-hidden="true" />}
      {src && (
        <img
          src={src}
          alt={alt}
          className={`${styles.weaponCardImg} ${loaded ? styles.weaponCardImgLoaded : ''}`}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      )}
    </div>
  );
}

function LoadoutPageSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-label="Loading loadout">
      <div className={styles.headerRow}>
        <div>
          <div className={styles.headerEyebrow}>Loadout</div>
          <h2 className={styles.pageTitle}>Current Loadout</h2>
        </div>
        <div className={styles.walletSkeletonRow} aria-hidden="true">
          {[0, 1, 2].map(item => <div key={item} className={styles.walletSkeletonChip} />)}
        </div>
      </div>

      <div className={styles.loadoutWrap}>
        <div className={styles.weaponArea}><WeaponGridSkeleton /></div>
        <div className={styles.sidePanel} aria-hidden="true">
          <div className={styles.skeletonSideLabel} />
          <div className={styles.skeletonPlayerCard} />
        </div>
      </div>
    </div>
  );
}

export default function MySkins() {
  const {
    riotAccount, setRiotAccount, loading, error, catalog, catalogLoading, weaponSkins, sortSkinsByPriceAsc
  } = useInventory();
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  // Complete skin collection
  const [skins, setSkins] = useState([]);
  const [detailedSkins, setDetailedSkins] = useState([]);
  // Current loadout
  const [loadout, setLoadout] = useState(null);
  const [loadoutSkins, setLoadoutSkins] = useState({});
  // Shared state
  const [skinsLoading, setSkinsLoading] = useState(false);
  const [skinsError, setSkinsError] = useState('');
  const [chromaMap, setChromaMap] = useState({});
  const [chromaImages, setChromaImages] = useState({});
  // Keep the skin level for each slot available during render
  const [slotToSkinLevel, setSlotToSkinLevel] = useState({});
  // Default weapon state
  const [defaultWeapons, setDefaultWeapons] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalWeapon, setModalWeapon] = useState(null);
  // Tab state
  const [activeTab, setActiveTab] = useState('loadout');
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [updateToken, setUpdateToken] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');

  // Read the JWT from local storage
  const getJWT = () => localStorage.getItem('authToken');

  // Load the account loadout when the view opens
  useEffect(() => {
    if (activeTab === 'loadout') {
      fetchLoadoutAndDetails();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  // Fetch the complete skin collection
  const fetchSkins = async () => {
    setSkinsLoading(true);
    setSkinsError('');
    setDetailedSkins([]);
    const token = localStorage.getItem('riot_token');
    if (!token) {
      setSkinsError('The Riot token is missing.');
      setSkinsLoading(false);
      return;
    }
    try {
      // Fetch skins from the backend
      const res = await fetch(`${API_BASE}/api/auth/riot/skins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riotToken: token })
      });
      const data = await res.json();
      if (!data.success) {
        setSkinsError('Skins could not be loaded.');
        setSkinsLoading(false);
        return;
      }
      setSkins(data.skins.Entitlements || []);
      // Fetch skin details
      const itemIDs = (data.skins.Entitlements || []).map(s => s.ItemID);
      if (itemIDs.length === 0) {
        setSkinsLoading(false);
        return;
      }
      const detailsRes = await fetch(`${API_BASE}/api/auth/riot/skins/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIDs })
      });
      const detailsData = await detailsRes.json();
      if (detailsData.success) {
        setDetailedSkins(detailsData.skinLevels);
      }
    } catch (e) {
      setSkinsError('Failed to load skins.');
      console.error(e);
    }
    setSkinsLoading(false);
  };

  // Fetch chromas when the component mounts
  useEffect(() => {
    const fetchChromas = async () => {
      try {
        const res = await fetch('https://valorant-api.com/v1/weapons/skinchromas');
        const data = await res.json();
        if (data.status === 200) {
          // Build a UUID-to-chroma map
          const map = {};
          data.data.forEach(chroma => { map[chroma.uuid] = chroma; });
          setChromaMap(map);

        }
      } catch (e) {
        console.error('Failed to load chromas:', e);
      }
    };
    fetchChromas();
  }, []);

  // Fetch the loadout and equipped skin-level details
  const fetchLoadoutAndDetails = async () => {
    setSkinsLoading(true);
    setSkinsError('');
    setLoadout(null);
    setLoadoutSkins({});
    setChromaImages({});
    const riotToken = localStorage.getItem('riot_token');
    const puuid = localStorage.getItem('riot_puuid');
    const entitlementToken = localStorage.getItem('riot_entitlement_token');
    if (!riotToken || !puuid || !entitlementToken) {
      setSkinsError('Riot authentication data is missing.');
      setSkinsLoading(false);
      return;
    }
    try {
      // Fetch the current loadout
      const res = await fetch(`${API_BASE}/api/auth/riot/loadout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riotToken, puuid, entitlementToken })
      });
      const data = await res.json();
      console.log('🔍 LOADOUT DATA:', data.loadout);
      if (!data.success) {
        setSkinsError('The loadout could not be loaded.');
        setSkinsLoading(false);
        return;
      }
      setLoadout(data.loadout);

      // Ensure the API returned loadout data
      if (!data.loadout || !data.loadout.Guns) {
        console.log('⚠️ No loadout or gun data is available');
        setSkinsError('No loadout data was found.');
        setSkinsLoading(false);
        return;
      }
      // Resolve equipped skin levels and chromas for each weapon
      const equipped = data.loadout?.Guns || [];
      const slotToSkinLevel = {};
      const slotToChroma = {};
      equipped.forEach(gun => {
        slotToSkinLevel[gun.ID] = gun.SkinLevelID;
        slotToChroma[gun.ID] = gun.ChromaID;
      });
      if (data.loadout?.Melee) {
        slotToSkinLevel['MELEE'] = data.loadout.Melee.SkinLevelID;
        slotToChroma['MELEE'] = data.loadout.Melee.ChromaID;
      }
      console.log('🔍 SLOT TO SKIN LEVEL:', slotToSkinLevel);
      console.log('🔍 SLOT TO CHROMA:', slotToChroma);
      console.log('🔍 EQUIPPED GUNS:', equipped.map(g => ({ ID: g.ID, SkinLevelID: g.SkinLevelID, ChromaID: g.ChromaID })));
      // Fetch skin-level details
      const itemIDs = Object.values(slotToSkinLevel).filter(Boolean);
      if (itemIDs.length === 0) {
        setSkinsLoading(false);
        return;
      }
      const detailsRes = await fetch(`${API_BASE}/api/auth/riot/skins/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIDs })
      });
      const detailsData = await detailsRes.json();
      let skinLevelMap = {};
      if (detailsData.success) {
        detailsData.skinLevels.forEach(level => {
          const slot = Object.keys(slotToSkinLevel).find(key => slotToSkinLevel[key] === level.uuid);
          if (slot) skinLevelMap[slot] = level;
        });
      }
      setLoadoutSkins(prev => ({ ...skinLevelMap, _chromas: slotToChroma }));
      setSlotToSkinLevel(slotToSkinLevel);
      // Resolve the full render for each equipped chroma
      const chromaPromises = Object.entries(slotToChroma).map(async ([slot, chromaId]) => {
        if (!chromaId) return [slot, null];
        const chromaRes = await fetch(`https://valorant-api.com/v1/weapons/skinchromas/${chromaId}`);
        const chromaData = await chromaRes.json();
        return [slot, chromaData.data?.fullRender || chromaData.data?.displayIcon || null];
      });
      const chromaResults = await Promise.all(chromaPromises);
      const chromaImagesMap = {};
      chromaResults.forEach(([slot, img]) => { chromaImagesMap[slot] = img; });
      setChromaImages(chromaImagesMap);
    } catch (e) {
      setSkinsError('Failed to load the loadout.');
      console.error(e);
    }
    setSkinsLoading(false);
  };

  // Fetch default weapons when the component mounts
  useEffect(() => {
    const fetchDefaultWeapons = async () => {
      try {
        const res = await fetch('https://valorant-api.com/v1/weapons');
        const data = await res.json();
        if (data.status === 200) {
          setDefaultWeapons(data.data);
        }
      } catch (e) {
        console.error('Failed to load default weapons:', e);
      }
    };
    fetchDefaultWeapons();
  }, []);

  // Fill empty slots with the standard skin without changing existing selections
  useEffect(() => {
    if (!riotAccount || catalogLoading || !catalog.weapons.length) return;

    const currentLoadout = riotAccount.loadout || {};
    const currentGuns = Array.isArray(currentLoadout.Guns) ? currentLoadout.Guns : [];
    const nextGuns = [...currentGuns];
    let nextMelee = currentLoadout.Melee || null;
    let changed = false;

    catalog.weapons.forEach(weapon => {
      const isMelee = weapon.displayName?.toLowerCase() === 'melee';
      const existingGunIndex = nextGuns.findIndex(gun => gun.ID === weapon.uuid);
      const existingSelection = isMelee
        ? (nextMelee || (existingGunIndex >= 0 ? nextGuns[existingGunIndex] : null))
        : (existingGunIndex >= 0 ? nextGuns[existingGunIndex] : null);

      if (existingSelection?.SkinLevelID) return;

      const defaultSelection = createDefaultSelection(weapon);
      if (!defaultSelection) return;

      if (isMelee) {
        nextMelee = { ...(existingSelection || {}), ...defaultSelection };
      } else if (existingGunIndex >= 0) {
        nextGuns[existingGunIndex] = { ...nextGuns[existingGunIndex], ...defaultSelection };
      } else {
        nextGuns.push(defaultSelection);
      }
      changed = true;
    });

    if (!changed) return;

    setRiotAccount(currentAccount => {
      if (!currentAccount || currentAccount.puuid !== riotAccount.puuid) return currentAccount;
      return {
        ...currentAccount,
        loadout: {
          ...currentAccount.loadout,
          Guns: nextGuns,
          Melee: nextMelee
        }
      };
    });
  }, [riotAccount, catalog.weapons, catalogLoading, setRiotAccount]);

  // Funciones de mapeo
  const getWeaponById = (id) => catalog.weapons.find(w => w.uuid === id);
  const getSkinById = (id) => catalog.skins.find(s => s.uuid === id);
  const getChromaById = (id) => catalog.chromas.find(c => c.uuid === id);


  // Map each weapon slot to its equipped skin level and chroma
  // slotToSkinLevel: { slot: SkinLevelID }, loadoutSkins: { slot: skinLevelObj }, chromaImages: { slot: chromaImg }

  // Open the selector for a weapon
  const handleWeaponClick = (weapon) => {
    setModalWeapon(weapon);
    setModalOpen(true);
  };

  // Close the weapon selector
  const closeModal = () => {
    setModalOpen(false);
    setModalWeapon(null);
  };

  // Equip a skin
  const handleEquipSkin = (skin) => {
    console.log('🎯 Equipando skin:', skin);

    if (!modalWeapon || !riotAccount) {
      showError('The skin cannot be equipped.');
      return;
    }

    // Find the weapon in the current loadout
    const weaponUuid = modalWeapon.uuid;
    const isMelee = modalWeapon.displayName.toLowerCase() === 'melee';

    // Build the equipped skin object
    const equippedSkin = {
      ID: weaponUuid,
      SkinLevelID: skin.levels?.[0]?.uuid || skin.uuid,
      ChromaID: skin.chromas?.[0]?.uuid || null
    };

    // Update local loadout state
    const updatedLoadout = { ...riotAccount.loadout };

    if (isMelee) {
      updatedLoadout.Melee = equippedSkin;
    } else {
      if (!updatedLoadout.Guns) updatedLoadout.Guns = [];
      const gunIndex = updatedLoadout.Guns.findIndex(gun => gun.ID === weaponUuid);
      if (gunIndex >= 0) {
        updatedLoadout.Guns[gunIndex] = equippedSkin;
      } else {
        updatedLoadout.Guns.push(equippedSkin);
      }
    }

    // Update the Riot account state
    const updatedRiotAccount = {
      ...riotAccount,
      loadout: updatedLoadout
    };

    // Update the shared account context
    setRiotAccount(updatedRiotAccount);

    console.log('🎯 Loadout actualizado:', updatedLoadout);
    console.log('🎯 Skin equipada:', equippedSkin);

    // Close the modal
    closeModal();

    showSuccess(`Skin ${skin.displayName} equipada!`);
  };

  // Refresh the Riot account
  const handleUpdateAccount = async () => {
    setUpdateStatus('');
    if (!updateToken) {
      setUpdateStatus('Paste the new Riot token.');
      return;
    }
    try {
      const jwt = getJWT();
      const res = await fetch(`${API_BASE}/api/auth/riot/account/${riotAccount.puuid}/refresh`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify({ riotToken: updateToken })
      });
      const data = await res.json();
      if (data.success) {
        setUpdateStatus('Account updated successfully.');
        setShowUpdatePopup(false);
        setUpdateToken('');
        setRiotAccount(data.riotAccount);
      } else {
        setUpdateStatus(data.message || 'Failed to update the account.');
      }
    } catch (e) {
      setUpdateStatus('A network error occurred while updating the account.');
    }
  };

  // Loading and error states
  if (loading) return <LoadoutPageSkeleton />;
  if (error) return <div style={{ color: 'var(--vi-red)', textAlign: 'center', marginTop: 80 }}>{error}</div>;
  if (!riotAccount) return null;

  // Loadout and skin rendering helpers
  const loadoutGuns = riotAccount?.loadout?.Guns || [];
  const loadoutMelee = riotAccount?.loadout?.Melee || null;
  const allSkins = riotAccount?.skins || [];

  // Valorant weapon categories arranged in four columns
  const weaponCategories = [
    {
      name: 'SIDEARMS',
      weapons: ['CLASSIC', 'SHORTY', 'FRENZY', 'GHOST', 'BANDIT', 'SHERIFF']
    },
    {
      name: 'SMGS',
      weapons: ['STINGER', 'SPECTRE'],
      subcategory: {
        name: 'SHOTGUNS',
        weapons: ['BUCKY', 'JUDGE']
      }
    },
    {
      name: 'RIFLES',
      weapons: ['BULLDOG', 'GUARDIAN', 'PHANTOM', 'VANDAL'],
      subcategory: {
        name: 'MELEE',
        weapons: ['MELEE']
      }
    },
    {
      name: 'SNIPER RIFLES',
      weapons: ['MARSHAL', 'OUTLAW', 'OPERATOR'],
      subcategory: {
        name: 'MACHINE GUNS',
        weapons: ['ARES', 'ODIN']
      }
    }
  ];

  // Map weapon names to UUIDs
  const weaponNameToUuid = {};
  catalog.weapons.forEach(w => { weaponNameToUuid[w.displayName] = w.uuid; });

  // Mapeo de uuid de arma a objeto de loadout
  const loadoutMap = {};
  loadoutGuns.forEach(gun => { loadoutMap[gun.ID] = gun; });
  if (loadoutMelee) loadoutMap[loadoutMelee.ID] = loadoutMelee;

  // Resolve the equipped skin image
  const getWeaponImgSrc = (weaponObj, isMelee = false) => {
    let imgSrc = weaponObj.displayIcon;
    if (isMelee) {
      // Riot API can store melee in loadout.Melee OR inside loadout.Guns
      const meleeLoadout = riotAccount?.loadout?.Melee ||
        riotAccount?.loadout?.Guns?.find(g => g.ID === weaponObj.uuid);
      if (meleeLoadout) {
        const chromaObj = catalog.chromas.find(c => c.uuid === meleeLoadout.ChromaID);
        if (chromaObj?.fullRender || chromaObj?.displayIcon) return chromaObj.fullRender || chromaObj.displayIcon;
        const skinObj = catalog.skins.find(s => s.levels?.some(lvl => lvl.uuid === meleeLoadout.SkinLevelID));
        if (skinObj) return skinObj.levels[0]?.displayIcon || skinObj.displayIcon || imgSrc;
      }
      // Melee weapon has no standalone displayIcon — fall back to its Standard skin
      if (!imgSrc) {
        const meleeSkin = catalog.skins.find(s => s.weapon?.uuid === weaponObj.uuid);
        if (meleeSkin) return meleeSkin.chromas?.[0]?.fullRender || meleeSkin.levels?.[0]?.displayIcon || meleeSkin.displayIcon;
      }
    } else if (riotAccount?.loadout?.Guns) {
      const gunLoadout = riotAccount.loadout.Guns.find(g => g.ID === weaponObj.uuid);
      if (gunLoadout) {
        const chromaObj = catalog.chromas.find(c => c.uuid === gunLoadout.ChromaID);
        if (chromaObj?.fullRender || chromaObj?.displayIcon) return chromaObj.fullRender || chromaObj.displayIcon;
        const skinObj = catalog.skins.find(s => s.levels?.some(lvl => lvl.uuid === gunLoadout.SkinLevelID));
        if (skinObj) return skinObj.levels[0]?.displayIcon || skinObj.displayIcon || imgSrc;
      }
    }
    return imgSrc;
  };

  const WeaponCard = ({ weaponName, isMelee = false }) => {
    const weaponObj = catalog.weapons.find(w => w.displayName.toUpperCase() === weaponName.toUpperCase());
    if (!weaponObj) return null;
    const imgSrc = getWeaponImgSrc(weaponObj, isMelee);
    const displayName = weaponName.charAt(0) + weaponName.slice(1).toLowerCase();
    return (
      <div className={styles.weaponCard} onClick={() => handleWeaponClick(weaponObj)}>
        <LoadoutWeaponImage src={imgSrc} alt={weaponName} />
        <div className={styles.weaponCardFooter}>
          <div className={styles.weaponCardName}>{displayName}</div>
          <div className={styles.weaponCardUnderline} />
        </div>
      </div>
    );
  };

  const CategoryBlock = ({ name, weapons, isMelee = false }) => (
    <div className={styles.categoryBlock}>
      <div className={styles.categoryTitle}>{name}</div>
      <div className={styles.weaponList}>
        {weapons.map(wn => <WeaponCard key={wn} weaponName={wn} isMelee={isMelee} />)}
      </div>
    </div>
  );

  // Render every weapon slot grouped by category
  const renderLoadout = () => (
    <div className={styles.loadoutWrap}>
      {/* Main Weapon Grid */}
      <div className={styles.weaponArea}>
        {catalogLoading ? (
          <WeaponGridSkeleton />
        ) : (
          <div className={styles.weaponGrid}>
            {weaponCategories.map(category => (
              <div key={category.name} style={{ display: 'flex', flexDirection: 'column' }}>
                <CategoryBlock name={category.name} weapons={category.weapons} isMelee={false} />
                {category.subcategory && (
                  <CategoryBlock
                    name={category.subcategory.name}
                    weapons={category.subcategory.weapons}
                    isMelee={category.subcategory.name === 'MELEE'}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Side Panel */}
      <div className={styles.sidePanel}>
        <div className={styles.sidePanelLabel}>PLAYER CARDS</div>
        <PlayerCard
          identity={riotAccount?.loadout?.Identity || {}}
          name={riotAccount?.name || ''}
          nickname={riotAccount?.nickname || ''}
          accountLevel={riotAccount?.accountLevel ?? null}
        />
      </div>
      {/* Weapon skin modal */}
      {modalOpen && modalWeapon && (() => {
        // Ensure the skin catalog is available
        if (catalogLoading || !catalog.weapons || catalog.weapons.length === 0) {
          return (
            <div className={styles.catalogLoadingOverlay}>
              <div className={styles.catalogLoadingClose}>
                <TacticalButton onClick={closeModal}>Close</TacticalButton>
              </div>
              <div className={styles.catalogLoadingText}>
                {catalogLoading ? 'Loading skin catalog...' : 'The catalog could not be loaded. Refresh the page and try again.'}
              </div>
            </div>
          );
        }

        // Catalog skins for this specific weapon
        const weaponCatalogEntry = catalog.weapons.find(w => w.uuid === modalWeapon.uuid);
        const allWeaponSkins = weaponCatalogEntry?.skins || [];

        // Skin levels actually owned by the account
        const ownedLevelIds = new Set((riotAccount?.skins || []).map(skin => skin.ItemID));

        // The standard weapon skin is always available and is not a purchasable item
        const defaultSkin = getDefaultSkin(weaponCatalogEntry);

        // Premium skins with at least one owned entitlement level
        const ownedSkins = allWeaponSkins.filter(s =>
          s.contentTierUuid && s.levels?.some(lvl => ownedLevelIds.has(lvl.uuid))
        );

        // Sort owned skins by ascending price with the shared pricing context
        const sortedOwnedSkins = ownedSkins.length > 0
          ? sortSkinsByPriceAsc(Object.fromEntries(ownedSkins.map(s => [s.displayName, s.levels || []])))
              .map(([name]) => ownedSkins.find(s => s.displayName === name))
          : [];

        const skinsParaModal = defaultSkin ? [defaultSkin, ...sortedOwnedSkins] : sortedOwnedSkins;

        // Open the carousel at the currently equipped skin
        const isMeleeModal = modalWeapon.displayName.toLowerCase() === 'melee';
        const equippedSkinLevelId = isMeleeModal
          ? riotAccount?.loadout?.Melee?.SkinLevelID
          : riotAccount?.loadout?.Guns?.find(g => g.ID === modalWeapon.uuid)?.SkinLevelID;
        const initialSkinIdx = Math.max(0, skinsParaModal.findIndex(s =>
          s.levels?.some(lvl => lvl.uuid === equippedSkinLevelId) || s.uuid === equippedSkinLevelId
        ));

        return (
          <div
            className={styles.modalOverlay}
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <WeaponDetail
              weapon={modalWeapon}
              skins={skinsParaModal}
              onBack={closeModal}
              onEquip={handleEquipSkin}
              initialSkinIdx={initialSkinIdx}
            />
          </div>
        );
      })()}
    </div>
  );

  // Render every skin with its image and name
  const renderAllSkins = () => (
    <div className={styles.inventoryGrid}>
      {allSkins.length === 0 ? (
        <div className={styles.emptyText}>No saved skins.</div>
      ) : (
        allSkins.map((skin, idx) => {
          const skinObj = getSkinById(skin.ItemID);
          const imgSrc = skinObj?.displayIcon || '';
          const price = skinObj?.price;
          const swatches = skinObj?.chromas || [];
          const unlockedLevels = skinObj?.unlockedLevels || 1;
          return (
            <div key={`${skin.uuid}-${idx}`} className={styles.skinCard}>
              {price && <div className={styles.skinPrice}>{price}</div>}
              <img src={imgSrc} alt={skinObj?.displayName || skin.ItemID} className={styles.skinImage} />
              <div className={styles.swatches}>
                {swatches.map((chroma, i) => (
                  <img key={`${chroma.uuid}-${i}`} src={chroma.swatch} alt="swatch" style={{ width: 18, height: 18, borderRadius: '50%', marginRight: 2 }} />
                ))}
              </div>
              <div className={styles.skinName}>{skinObj?.displayName || skin.ItemID}</div>
              <div className={styles.unlockedLevels}>Unlocked levels: {unlockedLevels}</div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} />

      {/* Header Section */}
      <div className={styles.headerRow}>
        <div>
          <div className={styles.headerEyebrow}>Loadout</div>
          <h2 className={styles.pageTitle}>Current Loadout</h2>
        </div>

        {/* Top Right Currency Display */}
        {riotAccount?.wallet?.Balances && (
          <div className={styles.walletRow}>
            <div className={styles.walletChip}>
              <img src="/assets/icons/20px-White_Valorant_Points_VALORANT.png" alt="VP" style={{ width: 18, height: 18 }} />
              {riotAccount.wallet.Balances['85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741'] || 0}
            </div>
            <div className={styles.walletChip}>
              <img src="/assets/icons/radianitepoints.png" alt="RP" style={{ width: 18, height: 18 }} />
              {riotAccount.wallet.Balances['e59aa87c-4cbf-517a-5983-6e81511be9b7'] || 0}
            </div>
            <div className={styles.walletChip}>
              <img src="/assets/icons/kingdompoints.png" alt="KP" style={{ width: 18, height: 18 }} />
              {(riotAccount.wallet.Balances['85ca954a-41f2-ce94-9b45-8ca3dd39a00d'] || 0).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Active section */}
        {activeTab === 'loadout' && renderLoadout()}
        {activeTab === 'inventory' && renderAllSkins()}
      </div>

      {/* Animated notification */}
      <Notification
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        duration={notification.duration}
        onClose={hideNotification}
      />
    </div>
  );
}
