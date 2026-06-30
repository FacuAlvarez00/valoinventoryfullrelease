import React, { createContext, useContext, useState, useEffect } from 'react';
const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://valoinventory-1.onrender.com";

const EMPTY_CATALOG = { weapons: [], skins: [], chromas: [], skinlevels: [] };
const InventoryContext = createContext();

export function InventoryProvider({ children }) {
  const [riotAccount, setRiotAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState(EMPTY_CATALOG);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [weaponSkins, setWeaponSkins] = useState([]);

  // Obtener el JWT del localStorage
  const getJWT = () => localStorage.getItem('authToken');

  // --- FUNCIONES DE CARGA ---
  const fetchAccount = async () => {
    setLoading(true);
    setError('');
    setRiotAccount(null);
    const puuid = localStorage.getItem('selected_riot_puuid');
    if (!puuid) {
      setError('No hay cuenta Riot seleccionada.');
      setLoading(false);
      return;
    }
    try {
      const jwt = getJWT();
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      const data = await res.json();
      if (data.success && data.user && data.user.riotAccounts) {
        const acc = data.user.riotAccounts.find(a => a.puuid === puuid);
        if (acc) {
          console.log('🃏 [InventoryContext] Cuenta Riot encontrada:', acc);
          console.log('🃏 [InventoryContext] Propiedades de la cuenta:', Object.keys(acc));
          console.log('🃏 [InventoryContext] ¿Tiene cards?', 'cards' in acc);
          console.log('🃏 [InventoryContext] Valor de cards:', acc.cards);
          console.log('🃏 [InventoryContext] Tipo de cards:', typeof acc.cards);
          console.log('🃏 [InventoryContext] ¿Es array?', Array.isArray(acc.cards));
          console.log('🃏 [InventoryContext] ¿Tiene sprays?', 'sprays' in acc);
          console.log('🃏 [InventoryContext] Valor de sprays:', acc.sprays);
          console.log('🃏 [InventoryContext] Tipo de sprays:', typeof acc.sprays);
          console.log('🃏 [InventoryContext] ¿Es array?', Array.isArray(acc.sprays));
          console.log('🃏 [InventoryContext] ¿Tiene titles?', 'titles' in acc);
          console.log('🃏 [InventoryContext] Valor de titles:', acc.titles);
          console.log('🃏 [InventoryContext] Tipo de titles:', typeof acc.titles);
          console.log('🃏 [InventoryContext] ¿Es array?', Array.isArray(acc.titles));
          
          setRiotAccount({
            ...acc,
            identity: acc.loadout?.Identity || acc.identity || null
          });
        } else {
          setError('No se encontró la cuenta Riot seleccionada.');
        }
      } else {
        setError('No se pudo obtener el perfil del usuario.');
      }
    } catch (e) {
      setError('Error de red al obtener la cuenta Riot.');
    }
    setLoading(false);
  };

  const fetchCatalog = async () => {
    setCatalogLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/catalog`);
      const data = await res.json();
      if (data.success) {
        setCatalog({
          weapons:    data.weapons    || [],
          skins:      data.skins      || [],
          chromas:    data.chromas    || [],
          skinlevels: data.skinlevels || [],
        });
        if (Array.isArray(data.weaponSkins) && data.weaponSkins.length > 0) {
          setWeaponSkins(data.weaponSkins);
        }
      } else {
        setCatalog(EMPTY_CATALOG);
      }
    } catch (e) {
      setCatalog(EMPTY_CATALOG);
    }
    setCatalogLoading(false);
  };

  // --- EFECTOS DE CARGA INICIAL ---
  useEffect(() => {
    fetchAccount();
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, []);

  // --- RECARGA AUTOMÁTICA SI LOS DATOS ESTÁN VACÍOS ---
  useEffect(() => {
    if (!loading && !riotAccount && !error) {
      fetchAccount();
    }
  }, [riotAccount, loading, error]);

  useEffect(() => {
    if (
      !catalogLoading && (
        !Array.isArray(catalog.skins) ||
        !Array.isArray(catalog.skinlevels) ||
        !Array.isArray(catalog.weapons) ||
        !Array.isArray(catalog.chromas) ||
        !catalog.skins.length ||
        !catalog.skinlevels.length ||
        !catalog.weapons.length ||
        !catalog.chromas.length
      )
    ) {
      setCatalog(EMPTY_CATALOG); // Siempre shape correcto
      fetchCatalog();
    }
  }, [catalog, catalogLoading]);

  // Funciones de mapeo
  const getWeaponById = (id) => catalog.weapons.find(w => w.uuid === id);
  const getSkinById = (id) => catalog.skins.find(s => s.uuid === id);
  const getChromaById = (id) => catalog.chromas.find(c => c.uuid === id);

  // Función para obtener el precio de una skin base
  const getSkinPrice = (baseName) => {
    if (baseName === 'VCT LOCK//IN Misericórdia') return 5440;
    if (baseName === 'VCT 2026 Sigil') return 5350;
    if (baseName === 'VCT 2025 Karambit') return 5350;
    if (baseName === 'XERØFANG Vandal') return 1775;
    if (baseName === 'Arcane Vandal') return 2175;
    if (baseName === 'Arcane Sheriff') return 2380;
    if (baseName === 'Arcane Gauntlets') return 4350;
    if (baseName === 'Ignite Fan') return 4350;
    if (baseName === '5 Years // Beta Remastered Knife') return 4350;
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

  // Función para ordenar skins por precio ascendente (las que no tienen precio al final)
  const sortSkinsByPriceAsc = (skinsPorBase) => {
    return Object.entries(skinsPorBase).sort((a, b) => {
      const precioA = getSkinPrice(a[0]);
      const precioB = getSkinPrice(b[0]);
      if (precioA && precioB) return precioA - precioB;
      if (precioA) return -1;
      if (precioB) return 1;
      return 0;
    });
  };

  // Función para refrescar la cuenta seleccionada manualmente
  const refreshAccount = async (puuid) => {
    if (puuid) localStorage.setItem('selected_riot_puuid', puuid);
    await fetchAccount();
  };

  return (
    <InventoryContext.Provider value={{
      riotAccount, setRiotAccount, loading, setLoading, error, setError,
      catalog, setCatalog, catalogLoading, setCatalogLoading,
      weaponSkins, setWeaponSkins,
      getWeaponById, getSkinById, getChromaById,
      getSkinPrice, sortSkinsByPriceAsc,
      refreshAccount,
      // Agregar acceso directo a sprays, titles y agents
      sprays: riotAccount?.sprays || [],
      titles: riotAccount?.titles || [],
      agents: riotAccount?.agents || []
    }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  return useContext(InventoryContext);
} 