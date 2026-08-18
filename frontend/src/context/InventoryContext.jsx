import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSkinPrice as getSkinPriceUtil, sortSkinsByPriceAsc as sortSkinsByPriceAscUtil } from '../utils/pricing';
const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://valoinventory-1.onrender.com";

const EMPTY_CATALOG = { weapons: [], skins: [], chromas: [], skinlevels: [], seasons: [], competitiveTiers: [], maps: [], agents: [] };
const InventoryContext = createContext();

export function InventoryProvider({ children }) {
  const [riotAccount, setRiotAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState(EMPTY_CATALOG);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [weaponSkins, setWeaponSkins] = useState([]);

  // Read the JWT from local storage
  const getJWT = () => localStorage.getItem('authToken');

  // Data loading
  const fetchAccount = async (requestedPuuid) => {
    const queryPuuid = new URLSearchParams(window.location.search).get('puuid');
    const puuid = requestedPuuid || queryPuuid || localStorage.getItem('selected_riot_puuid');
    setLoading(true);
    setError('');
    if (!puuid) {
      setRiotAccount(null);
      setError('No Riot account is selected.');
      setLoading(false);
      return;
    }
    if (riotAccount?.puuid !== puuid) setRiotAccount(null);
    localStorage.setItem('selected_riot_puuid', puuid);
    try {
      const jwt = getJWT();
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      const data = await res.json();
      if (data.success && data.user && data.user.riotAccounts) {
        const acc = data.user.riotAccounts.find(a => a.puuid === puuid);
        if (acc) {
          setRiotAccount({
            ...acc,
            identity: acc.loadout?.Identity || acc.identity || null
          });
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

  const fetchCatalog = async () => {
    setCatalogLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/catalog`);
      const data = await res.json();
      if (data.success) {
        setCatalog({
          weapons: data.weapons || [],
          skins: data.skins || [],
          chromas: data.chromas || [],
          skinlevels: data.skinlevels || [],
          seasons: data.seasons || [],
          competitiveTiers: data.competitiveTiers || [],
          maps: data.maps || [],
          agents: data.agents || [],
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

  // Initial loading effects
  useEffect(() => {
    fetchAccount();
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Automatically retry when account data is empty
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
      setCatalog(EMPTY_CATALOG); // Preserve a stable catalog shape
      fetchCatalog();
    }
  }, [catalog, catalogLoading]);

  // Catalog lookup helpers
  const getWeaponById = (id) => catalog.weapons.find(w => w.uuid === id);
  const getSkinById = (id) => catalog.skins.find(s => s.uuid === id);
  const getChromaById = (id) => catalog.chromas.find(c => c.uuid === id);

  // Delegate base skin pricing to the shared helper
  const getSkinPrice = (baseName) => getSkinPriceUtil(baseName, weaponSkins);

  // Sort skins by ascending price and place unpriced skins at the end
  const sortSkinsByPriceAsc = (skinsByBaseName) => sortSkinsByPriceAscUtil(skinsByBaseName, weaponSkins);

  // Refresh the selected account manually
  const refreshAccount = async (puuid) => {
    await fetchAccount(puuid);
  };

  return (
    <InventoryContext.Provider value={{
      riotAccount, setRiotAccount, loading, setLoading, error, setError,
      catalog, setCatalog, catalogLoading, setCatalogLoading,
      weaponSkins, setWeaponSkins,
      getWeaponById, getSkinById, getChromaById,
      getSkinPrice, sortSkinsByPriceAsc,
      refreshAccount,
      // Expose commonly used entitlement groups directly
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
