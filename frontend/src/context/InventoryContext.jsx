import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSkinPrice as getSkinPriceUtil, sortSkinsByPriceAsc as sortSkinsByPriceAscUtil } from '../utils/pricing';
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

  // Función para obtener el precio de una skin base (delegada al helper compartido)
  const getSkinPrice = (baseName) => getSkinPriceUtil(baseName, weaponSkins);

  // Función para ordenar skins por precio ascendente (las que no tienen precio al final)
  const sortSkinsByPriceAsc = (skinsPorBase) => sortSkinsByPriceAscUtil(skinsPorBase, weaponSkins);

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