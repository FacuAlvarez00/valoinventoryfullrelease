import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './MySkins.module.css';
import InventoryNavbar from './InventoryNavbar';
import { WeaponDetail } from '../weapons';
import { useInventory } from '../../context/InventoryContext';
import { useLanguage } from '../../context/LanguageContext';
import { PlayerCard, Notification, LoadingScreen } from '../ui';
import { TacticalButton } from '../ui/kit';
import useNotification from '../../hooks/useNotification';
const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://valoinventory-1.onrender.com";

export default function MySkins() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    riotAccount, setRiotAccount, loading, error, catalog, setCatalog, catalogLoading, setCatalogLoading, weaponSkins, sortSkinsByPriceAsc, refreshAccount
  } = useInventory();

  useEffect(() => {
    const puuid = searchParams.get('puuid');
    if (puuid) {
      refreshAccount(puuid);
    }
    // eslint-disable-next-line
  }, []);
  const { t } = useLanguage();
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

  // Obtener catálogo de la API pública al montar
  useEffect(() => {
    const fetchCatalog = async () => {
      setCatalogLoading(true);
      try {
        const [weaponsRes, skinsRes, chromasRes] = await Promise.all([
          fetch('https://valorant-api.com/v1/weapons'),
          fetch('https://valorant-api.com/v1/weapons/skins'),
          fetch('https://valorant-api.com/v1/weapons/skinchromas'),
        ]);
        const weaponsData = await weaponsRes.json();
        const skinsData = await skinsRes.json();
        const chromasData = await chromasRes.json();


        const newCatalog = {
          weapons: weaponsData.data || [],
          skins: skinsData.data || [],
          chromas: chromasData.data || [],
        };

        setCatalog(newCatalog);
      } catch (e) {
        console.error('❌ Error cargando catálogo:', e);
        setCatalog({ weapons: [], skins: [], chromas: [] });
      }
      setCatalogLoading(false);
    };
    fetchCatalog();
  }, []);

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
      SkinLevelID: skin.uuid,
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
  if (loading) return <LoadingScreen fullscreen={true} text="Cargando skins..." />;
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
        <div className={styles.weaponCardImgWrap}>
          <img src={imgSrc} alt={weaponName} className={styles.weaponCardImg} />
        </div>
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
      <div style={{ flex: 1 }}>
        {catalogLoading ? (
          <div className={styles.catalogLoadingText} style={{ paddingTop: 40 }}>Cargando catálogo de skins...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 20px', paddingTop: 24 }}>
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
        // Usar catálogo del contexto global si el local está vacío
        const catalogToUse = (catalog.skins && catalog.skins.length > 0) ? catalog :
                            (catalog && catalog.skins && catalog.skins.length > 0) ? catalog :
                            { weapons: [], skins: [], chromas: [] };

        console.log('🔍 CATÁLOGO A USAR:', {
          localCatalog: catalog,
          catalogToUse: catalogToUse,
          catalogSkinsCount: catalogToUse.skins?.length || 0,
          catalogWeaponsCount: catalogToUse.weapons?.length || 0
        });

        // Verificar que el catálogo esté cargado
        if (catalogLoading || !catalogToUse.skins || catalogToUse.skins.length === 0) {
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

        // Agrupar allSkins por nombre base usando skinlevels
        const skinlevels = catalog.skinlevels || [];
        const allSkins = riotAccount?.skins || [];

        console.log('🔍 DATOS DE SKINS DEL USUARIO:', {
          riotAccount: riotAccount,
          allSkins: allSkins,
          allSkinsCount: allSkins.length,
          skinlevels: skinlevels,
          skinlevelsCount: skinlevels.length,
          sampleSkins: allSkins.slice(0, 5).map(s => ({
            ItemID: s.ItemID,
            uuid: s.uuid
          }))
        });

        const skinsPorBase = {};
        allSkins.forEach(skin => {
          const skinLevelObj = skinlevels.find(s => s.uuid === skin.ItemID);
          if (!skinLevelObj) {
            console.log('⚠️ No se encontró skinLevel para:', skin.ItemID);
            return;
          }
          const baseName = skinLevelObj.displayName.replace(/ Level \d+$/, '').trim();
          if (!skinsPorBase[baseName]) skinsPorBase[baseName] = [];
          skinsPorBase[baseName].push(skinLevelObj);
          console.log('✅ Skin procesada:', {
            ItemID: skin.ItemID,
            baseName: baseName,
            skinLevelName: skinLevelObj.displayName
          });
        });

        console.log('🔍 SKINS POR BASE RESULTADO:', skinsPorBase);
        // Buscar en el catálogo todas las skins de esa arma
        const armaNombre = modalWeapon.displayName;
        const armaUUID = modalWeapon.uuid;

        // Buscar skins por displayName Y por UUID del weapon
        let skinsDeArma = catalogToUse.skins.filter(skinObj => {
          if (!skinObj || !skinObj.weapon) return false;
          return skinObj.weapon.displayName === armaNombre ||
                 skinObj.weapon.uuid === armaUUID ||
                 skinObj.weapon.displayName?.toLowerCase() === armaNombre.toLowerCase();
        });

        // Si no encuentra skins por weapon (porque weapon es undefined), usar filtrado por nombre
        if (skinsDeArma.length === 0) {
          console.log('🔧 Usando filtrado alternativo por nombre de skin...');

          // Buscar skins que contengan el nombre del arma en su displayName
          skinsDeArma = catalogToUse.skins.filter(skinObj => {
            if (!skinObj || !skinObj.displayName) return false;

            // Buscar skins que contengan el nombre del arma
            const skinName = skinObj.displayName.toLowerCase();
            const weaponName = armaNombre.toLowerCase();

            // Lista de palabras clave para identificar tipos de armas melee
            const meleeKeywords = ['knife', 'karambit', 'axe', 'sword', 'dagger', 'blade', 'melee'];

            // Si es una arma melee, verificar si la skin es de tipo melee
            if (weaponName === 'melee' || meleeKeywords.some(keyword => weaponName.includes(keyword))) {
              return meleeKeywords.some(keyword => skinName.includes(keyword));
            } else {
              // Para otras armas, verificar que la skin contenga el nombre del arma
              return skinName.includes(weaponName);
            }
          });

          console.log('🔧 SKINS ENCONTRADAS POR NOMBRE:', skinsDeArma.map(s => s.displayName));
        }

        console.log('🔍 DEBUG MODAL:', {
          armaNombre,
          armaUUID,
          skinsDeArma: skinsDeArma.map(s => s.displayName),
          skinsPorBase: Object.keys(skinsPorBase),
          allSkins: allSkins.map(s => s.ItemID),
          catalogSkinsCount: catalogToUse.skins?.length || 0,
          catalogWeaponsCount: catalogToUse.weapons?.length || 0
        });

        // Debug adicional: mostrar algunas skins del catálogo para verificar estructura
        if (catalogToUse.skins && catalogToUse.skins.length > 0) {
          const sampleSkins = catalogToUse.skins.slice(0, 3);
          console.log('🔍 SAMPLE CATALOG SKINS:', sampleSkins.map(s => ({
            name: s.displayName,
            weapon: s.weapon?.displayName,
            weaponUUID: s.weapon?.uuid
          })));

          // Buscar específicamente skins de Vandal en el catálogo
          const vandalSkins = catalogToUse.skins.filter(s =>
            s.weapon && s.weapon.displayName &&
            (s.weapon.displayName.toLowerCase().includes('vandal') ||
             s.weapon.displayName === 'Vandal')
          );
          console.log('🔍 VANDAL SKINS EN CATÁLOGO:', vandalSkins.map(s => ({
            name: s.displayName,
            weapon: s.weapon?.displayName,
            weaponUUID: s.weapon?.uuid
          })));
        } else {
          console.log('❌ CATÁLOGO DE SKINS VACÍO O NO DISPONIBLE');
        }

        // Mostrar solo las que el usuario tiene (por nombre base)
        let skinsParaModal = skinsDeArma.filter(skinObj => skinsPorBase[skinObj.displayName]);

        console.log('🎯 SKINS PARA MODAL:', skinsParaModal.map(s => s.displayName));

        // Si no hay skins específicas para esta arma, mostrar todas las skins de la arma que el usuario tiene
        if (skinsParaModal.length === 0) {
          console.log('🔍 Buscando skins alternativas...');

          // Buscar skins por coincidencia parcial o por weapon UUID
          skinsParaModal = skinsDeArma.filter(skinObj => {
            // Buscar si alguna skin del usuario pertenece a esta arma
            const hasUserSkin = allSkins.some(userSkin => {
              const skinLevelObj = skinlevels.find(s => s.uuid === userSkin.ItemID);
              if (!skinLevelObj) return false;
              const baseName = skinLevelObj.displayName.replace(/ Level \d+$/, '').trim();

              // Comparación más flexible
              return baseName === skinObj.displayName ||
                     baseName.toLowerCase().includes(skinObj.displayName.toLowerCase()) ||
                     skinObj.displayName.toLowerCase().includes(baseName.toLowerCase());
            });

            if (hasUserSkin) {
              console.log('✅ Encontrada skin del usuario:', skinObj.displayName);
            }
            return hasUserSkin;
          });

          // Si aún no hay skins, mostrar TODAS las skins de la arma (para debugging)
          if (skinsParaModal.length === 0 && skinsDeArma.length > 0) {
            console.log('⚠️ Mostrando TODAS las skins de la arma para debugging');
            skinsParaModal = skinsDeArma;
          }

          // Si aún no hay skins, crear skins básicas desde los datos del usuario
          if (skinsParaModal.length === 0) {
            console.log('🔧 Creando skins básicas desde datos del usuario...');

            // Buscar skins del usuario que pertenezcan a esta arma específica
            const userSkinsForWeapon = allSkins.filter(userSkin => {
              const skinLevelObj = skinlevels.find(s => s.uuid === userSkin.ItemID);
              if (!skinLevelObj) return false;

              const baseName = skinLevelObj.displayName.replace(/ Level \d+$/, '').trim().toLowerCase();
              const weaponName = armaNombre.toLowerCase();

              // Lista de palabras clave para identificar tipos de armas melee
              const meleeKeywords = ['knife', 'karambit', 'axe', 'sword', 'dagger', 'blade', 'melee'];

              // Si es una arma melee, verificar si la skin es de tipo melee
              if (weaponName === 'melee' || meleeKeywords.some(keyword => weaponName.includes(keyword))) {
                return meleeKeywords.some(keyword => baseName.includes(keyword));
              } else {
                // Para otras armas, verificar que la skin contenga el nombre del arma
                return baseName.includes(weaponName);
              }
            });

            console.log('🔧 USER SKINS FOR WEAPON:', userSkinsForWeapon);

            // Crear objetos de skin básicos
            skinsParaModal = userSkinsForWeapon.map(userSkin => {
              const skinLevelObj = skinlevels.find(s => s.uuid === userSkin.ItemID);
              const baseName = skinLevelObj?.displayName.replace(/ Level \d+$/, '').trim() || 'Unknown Skin';

              return {
                displayName: baseName,
                displayIcon: skinLevelObj?.displayIcon || '',
                weapon: {
                  displayName: armaNombre,
                  uuid: armaUUID
                },
                uuid: userSkin.ItemID,
                levels: [skinLevelObj].filter(Boolean)
              };
            });

            console.log('🔧 SKINS BÁSICAS CREADAS:', skinsParaModal.map(s => s.displayName));
          }
        }

        console.log('🎯 SKINS FINALES PARA MODAL:', skinsParaModal.map(s => s.displayName));

        // Ordenar por precio ascendente usando el contexto global
        if (skinsParaModal.length > 0) {
          skinsParaModal = sortSkinsByPriceAsc(Object.fromEntries(skinsParaModal.map(s => [s.displayName, skinsPorBase[s.displayName] || []]))).map(([name, obj]) => skinsDeArma.find(s => s.displayName === name));
        }
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

      <InventoryNavbar />

      {/* Header Section */}
      <div className={styles.headerBar}>
        <div>
          <div className={styles.headerEyebrow}>Loadout</div>
          <h1 className={styles.headerTitle}>Current Loadout</h1>
          <p className={styles.headerSub}>
            {riotAccount.name} ({riotAccount.nickname || riotAccount.puuid})
          </p>
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
      <div style={{ padding: '40px 0' }}>
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
