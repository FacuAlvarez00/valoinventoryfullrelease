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
    <div className={styles.page} aria-busy="true" aria-label="Cargando loadout">
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
  // Para todos los skins
  const [skins, setSkins] = useState([]);
  const [detailedSkins, setDetailedSkins] = useState([]);
  // Para el loadout
  const [loadout, setLoadout] = useState(null);
  const [loadoutSkins, setLoadoutSkins] = useState({});
  // Estado general
  const [skinsLoading, setSkinsLoading] = useState(false);
  const [skinsError, setSkinsError] = useState('');
  const [chromaMap, setChromaMap] = useState({});
  const [chromaImages, setChromaImages] = useState({});
  // Guardar slotToSkinLevel en el estado para usarlo en el render
  const [slotToSkinLevel, setSlotToSkinLevel] = useState({});
  // Estado para las armas default
  const [defaultWeapons, setDefaultWeapons] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalWeapon, setModalWeapon] = useState(null);
  // Estado para tabs
  const [activeTab, setActiveTab] = useState('loadout');
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);
  const [updateToken, setUpdateToken] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');

  // Obtener el JWT del localStorage
  const getJWT = () => localStorage.getItem('authToken');

  // Cargar loadout automáticamente al entrar al tab
  useEffect(() => {
    if (activeTab === 'loadout') {
      fetchLoadoutAndDetails();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  // Obtener todos los skins (como antes)
  const fetchSkins = async () => {
    setSkinsLoading(true);
    setSkinsError('');
    setDetailedSkins([]);
    const token = localStorage.getItem('riot_token');
    if (!token) {
      setSkinsError('Falta el token de Riot.');
      setSkinsLoading(false);
      return;
    }
    try {
      // 1. Obtener los skins del backend
      const res = await fetch(`${API_BASE}/api/auth/riot/skins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riotToken: token })
      });
      const data = await res.json();
      if (!data.success) {
        setSkinsError('No se pudieron obtener los skins.');
        setSkinsLoading(false);
        return;
      }
      setSkins(data.skins.Entitlements || []);
      // 2. Obtener detalles de los skins
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
      setSkinsError('Error obteniendo skins.');
      console.error(e);
    }
    setSkinsLoading(false);
  };

  // Obtener todos los chromas al montar el componente
  useEffect(() => {
    const fetchChromas = async () => {
      try {
        const res = await fetch('https://valorant-api.com/v1/weapons/skinchromas');
        const data = await res.json();
        if (data.status === 200) {
          // Crear un mapa uuid -> chroma
          const map = {};
          data.data.forEach(chroma => { map[chroma.uuid] = chroma; });
          setChromaMap(map);

        }
      } catch (e) {
        console.error('Error obteniendo chromas:', e);
      }
    };
    fetchChromas();
  }, []);

  // Obtener el loadout y los detalles de los skinlevels equipados
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
      setSkinsError('Faltan datos de autenticación de Riot.');
      setSkinsLoading(false);
      return;
    }
    try {
      // 1. Obtener el loadout actual
      const res = await fetch(`${API_BASE}/api/auth/riot/loadout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riotToken, puuid, entitlementToken })
      });
      const data = await res.json();
      console.log('🔍 LOADOUT DATA:', data.loadout);
      if (!data.success) {
        setSkinsError('No se pudo obtener el loadout.');
        setSkinsLoading(false);
        return;
      }
      setLoadout(data.loadout);

      // Debug: Verificar si hay datos de loadout
      if (!data.loadout || !data.loadout.Guns) {
        console.log('⚠️ No hay datos de loadout o Guns');
        setSkinsError('No se encontraron datos de loadout.');
        setSkinsLoading(false);
        return;
      }
      // 2. Obtener los skinlevels y chromas equipados para cada arma
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
      // 3. Obtener detalles de los skinlevels
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
      // 4. Obtener la imagen fullRender de cada chroma equipado
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
      setSkinsError('Error obteniendo loadout.');
      console.error(e);
    }
    setSkinsLoading(false);
  };

  // Obtener las armas default al montar el componente
  useEffect(() => {
    const fetchDefaultWeapons = async () => {
      try {
        const res = await fetch('https://valorant-api.com/v1/weapons');
        const data = await res.json();
        if (data.status === 200) {
          setDefaultWeapons(data.data);
        }
      } catch (e) {
        console.error('Error obteniendo armas default:', e);
      }
    };
    fetchDefaultWeapons();
  }, []);

  // Completar los slots vacíos con la skin estándar sin tocar las selecciones existentes.
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


  // Crear un mapeo de slot (ID de arma) a skinlevel y chroma equipado
  // slotToSkinLevel: { slot: SkinLevelID }, loadoutSkins: { slot: skinLevelObj }, chromaImages: { slot: chromaImg }

  // Función para abrir el modal con el arma seleccionada
  const handleWeaponClick = (weapon) => {
    setModalWeapon(weapon);
    setModalOpen(true);
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setModalOpen(false);
    setModalWeapon(null);
  };

  // Función para equipar skin
  const handleEquipSkin = (skin) => {
    console.log('🎯 Equipando skin:', skin);

    if (!modalWeapon || !riotAccount) {
      showError('Error: No se puede equipar la skin');
      return;
    }

    // Encontrar el arma en el loadout
    const weaponUuid = modalWeapon.uuid;
    const isMelee = modalWeapon.displayName.toLowerCase() === 'melee';

    // Crear el objeto de skin equipada
    const equippedSkin = {
      ID: weaponUuid,
      SkinLevelID: skin.levels?.[0]?.uuid || skin.uuid,
      ChromaID: skin.chromas?.[0]?.uuid || null
    };

    // Actualizar el estado local del loadout
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

    // Actualizar el estado de la cuenta Riot
    const updatedRiotAccount = {
      ...riotAccount,
      loadout: updatedLoadout
    };

    // Actualizar el contexto
    setRiotAccount(updatedRiotAccount);

    console.log('🎯 Loadout actualizado:', updatedLoadout);
    console.log('🎯 Skin equipada:', equippedSkin);

    // Cerrar el modal
    closeModal();

    showSuccess(`Skin ${skin.displayName} equipada!`);
  };

  // Función para actualizar la cuenta Riot
  const handleUpdateAccount = async () => {
    setUpdateStatus('');
    if (!updateToken) {
      setUpdateStatus('Pega el nuevo token de Riot.');
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
        setUpdateStatus('Cuenta actualizada correctamente.');
        setShowUpdatePopup(false);
        setUpdateToken('');
        setRiotAccount(data.riotAccount);
      } else {
        setUpdateStatus(data.message || 'Error al actualizar la cuenta.');
      }
    } catch (e) {
      setUpdateStatus('Error de red al actualizar la cuenta.');
    }
  };

  // Mostrar loading/error
  if (loading) return <LoadoutPageSkeleton />;
  if (error) return <div style={{ color: 'var(--vi-red)', textAlign: 'center', marginTop: 80 }}>{error}</div>;
  if (!riotAccount) return null;

  // Utilidades para renderizar loadout y skins
  const loadoutGuns = riotAccount?.loadout?.Guns || [];
  const loadoutMelee = riotAccount?.loadout?.Melee || null;
  const allSkins = riotAccount?.skins || [];

  // Categorías de armas para el layout - 4 columnas como en Valorant
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

  // Mapeo de nombre a uuid de arma
  const weaponNameToUuid = {};
  catalog.weapons.forEach(w => { weaponNameToUuid[w.displayName] = w.uuid; });

  // Mapeo de uuid de arma a objeto de loadout
  const loadoutMap = {};
  loadoutGuns.forEach(gun => { loadoutMap[gun.ID] = gun; });
  if (loadoutMelee) loadoutMap[loadoutMelee.ID] = loadoutMelee;

  // Helper para obtener imagen de skin equipada
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

  // Render de loadout agrupado por categoría, siempre mostrando todas las armas, solo imagen y nombre del arma
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
          identity={riotAccount?.identity || {}}
          name={riotAccount?.name || ''}
          nickname={riotAccount?.nickname || ''}
        />
      </div>
      {/* Modal de skins por arma */}
      {modalOpen && modalWeapon && (() => {
        // Verificar que el catálogo esté cargado
        if (catalogLoading || !catalog.weapons || catalog.weapons.length === 0) {
          return (
            <div className={styles.catalogLoadingOverlay}>
              <div className={styles.catalogLoadingClose}>
                <TacticalButton onClick={closeModal}>Cerrar</TacticalButton>
              </div>
              <div className={styles.catalogLoadingText}>
                {catalogLoading ? 'Cargando catálogo de skins...' : 'Error cargando catálogo. Intenta recargar la página.'}
              </div>
            </div>
          );
        }

        // Todas las skins que existen para esta arma puntual, según el catálogo (no el catálogo global de skins)
        const weaponCatalogEntry = catalog.weapons.find(w => w.uuid === modalWeapon.uuid);
        const allWeaponSkins = weaponCatalogEntry?.skins || [];

        // Qué niveles de skin posee realmente la cuenta (Entitlements)
        const ownedLevelIds = new Set((riotAccount?.skins || []).map(skin => skin.ItemID));

        // Skin base/estándar del arma (siempre disponible, no es un ítem comprable) — se excluye "Random Favorite Skin"
        const defaultSkin = getDefaultSkin(weaponCatalogEntry);

        // Skins premium que la cuenta realmente posee (algún nivel de la skin está en sus Entitlements)
        const ownedSkins = allWeaponSkins.filter(s =>
          s.contentTierUuid && s.levels?.some(lvl => ownedLevelIds.has(lvl.uuid))
        );

        // Ordenar las poseídas por precio ascendente usando el contexto global
        const sortedOwnedSkins = ownedSkins.length > 0
          ? sortSkinsByPriceAsc(Object.fromEntries(ownedSkins.map(s => [s.displayName, s.levels || []])))
              .map(([name]) => ownedSkins.find(s => s.displayName === name))
          : [];

        const skinsParaModal = defaultSkin ? [defaultSkin, ...sortedOwnedSkins] : sortedOwnedSkins;

        // Determinar índice de la skin actualmente equipada para abrir el carrusel en ella
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

  // Render de todos los skins con imágenes y nombres
  const renderAllSkins = () => (
    <div className={styles.inventoryGrid}>
      {allSkins.length === 0 ? (
        <div className={styles.emptyText}>No hay skins guardados.</div>
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
              <div className={styles.unlockedLevels}>Niveles desbloqueados: {unlockedLevels}</div>
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
        {/* Renderizar la sección activa */}
        {activeTab === 'loadout' && renderLoadout()}
        {activeTab === 'inventory' && renderAllSkins()}
      </div>

      {/* Notificación animada */}
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
