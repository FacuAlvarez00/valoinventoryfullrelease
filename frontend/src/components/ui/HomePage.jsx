import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonAccountCard } from './LoadingScreen';
const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://valoinventory-1.onrender.com";

export default function HomePage() {
  const [showPopup, setShowPopup] = useState(false);
  const [riotToken, setRiotToken] = useState('');
  const [accountName, setAccountName] = useState('');
  const [addStatus, setAddStatus] = useState('');
  const [riotAccounts, setRiotAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [accountToUpdate, setAccountToUpdate] = useState(null);
  const [updateToken, setUpdateToken] = useState('');
  const [updateUrl, setUpdateUrl] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('filters_searchQuery') || '');
  const [groupByUser, setGroupByUser] = useState(() => localStorage.getItem('filters_groupByUser') === 'true');
  const [filtersOpen, setFiltersOpen] = useState(() => localStorage.getItem('filters_filtersOpen') === 'true');
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('filters_sortBy') || '');
  const [sortDir, setSortDir] = useState(() => localStorage.getItem('filters_sortDir') || 'desc');
  const [addLoading, setAddLoading] = useState(false);
  const [sharedIdx, setSharedIdx] = useState(null);
  const [sharingIdx, setSharingIdx] = useState(null);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showSharesPanel, setShowSharesPanel] = useState(false);
  const [copiedSharePuuid, setCopiedSharePuuid] = useState(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { refreshAccount, catalog, weaponSkins } = useInventory();
  const { makeAuthenticatedRequest } = useAuth();

  useEffect(() => { localStorage.setItem('filters_searchQuery', searchQuery); }, [searchQuery]);
  useEffect(() => { localStorage.setItem('filters_groupByUser', groupByUser); }, [groupByUser]);
  useEffect(() => { localStorage.setItem('filters_filtersOpen', filtersOpen); }, [filtersOpen]);
  useEffect(() => { localStorage.setItem('filters_sortBy', sortBy); }, [sortBy]);
  useEffect(() => { localStorage.setItem('filters_sortDir', sortDir); }, [sortDir]);

  const handleOpenPopup = () => {
    setShowPopup(true);
    setAddStatus('');
    setRiotToken('');
    setRiotUrl('');
    setAccountName('');
  };

  const handleClosePopup = () => setShowPopup(false);

  // Extraer token de Riot de la URL para mostrar solo el token en el input
  const extractTokenFromUrl = (url) => {
    try {
      if (url.includes('playvalorant.com') && url.includes('access_token=')) {
        const urlObj = new URL(url);
        const hash = urlObj.hash;
        if (hash) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          if (accessToken) {
            return accessToken;
          }
        }
      }
      return url;
    } catch (error) {
      return url;
    }
  };

  // Estado para guardar la URL completa
  const [riotUrl, setRiotUrl] = useState('');

  const handleTokenChange = (e) => {
    const value = e.target.value;
    // Si es una URL completa, guardarla y mostrar solo el token
    if (value.includes('playvalorant.com')) {
      setRiotUrl(value);
      const extractedToken = extractTokenFromUrl(value);
      setRiotToken(extractedToken);
    } else {
      // Si es solo un token, actualizar ambos
      setRiotToken(value);
      setRiotUrl(value);
    }
  };

  const handleTokenPaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    // Si es una URL completa, guardarla y mostrar solo el token
    if (pastedText.includes('playvalorant.com')) {
      setRiotUrl(pastedText);
      const extractedToken = extractTokenFromUrl(pastedText);
      setRiotToken(extractedToken);
    } else {
      // Si es solo un token, actualizar ambos
      setRiotToken(pastedText);
      setRiotUrl(pastedText);
    }
    e.preventDefault();
  };

  // Guardar cuenta Riot
  const handleSaveToken = async () => {
    if (addLoading) return;
    setAddStatus('');
    if (!riotToken) {
      setAddStatus(t.completeAllFields || 'Completa todos los campos.');
      return;
    }

    if (!riotUrl || !riotUrl.includes('playvalorant.com')) {
      setAddStatus('Falta la URL con el ID Token');
      return;
    }

    setAddLoading(true);
    try {
      const res = await makeAuthenticatedRequest(`${API_BASE}/api/auth/riot/account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: accountName, riotToken, url: riotUrl })
      });
      const data = await res.json();
      if (data.success) {
        setShowPopup(false);
        setRiotToken('');
        setRiotUrl('');
        setAccountName('');
        setAddStatus('');
        fetchRiotAccounts();
      } else {
        setAddStatus(data.message || t.errorAddingAccount || 'Error al agregar la cuenta.');
      }
    } catch (e) {
      setAddStatus(t.networkErrorAddingAccount || 'Error de red al agregar la cuenta.');
    }
    setAddLoading(false);
  };

  // Borrar cuenta Riot
  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await makeAuthenticatedRequest(`${API_BASE}/api/auth/riot/account/${accountToDelete.puuid}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setShowDeleteModal(false);
        setAccountToDelete(null);
        setDeleteStep(1);
        setDeleteLoading(false);
        fetchRiotAccounts();
      } else {
        setDeleteLoading(false);
        alert(data.message || 'Error al borrar la cuenta.');
      }
    } catch (e) {
      setDeleteLoading(false);
      alert('Error de red al borrar la cuenta.');
    }
  };

  // Actualizar cuenta Riot (borrar y volver a agregar con el mismo nombre)
  const handleUpdateAccount = async () => {
    if (!accountToUpdate || !updateToken) return;
    setUpdateStatus('');
    
    // Verificar si tenemos URL completa para obtener información de región
    if (!updateUrl || !updateUrl.includes('playvalorant.com')) {
      setUpdateStatus('Falta la URL con el ID Token');
      return;
    }
    
    try {
      // 1. Borrar la cuenta
      await makeAuthenticatedRequest(`${API_BASE}/api/auth/riot/account/${accountToUpdate.puuid}`, {
        method: 'DELETE',
      });
      // 2. Volver a agregar con el mismo nombre
      const res = await makeAuthenticatedRequest(`${API_BASE}/api/auth/riot/account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: accountToUpdate.name, 
          riotToken: updateToken,
          url: updateUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowUpdateModal(false);
        setAccountToUpdate(null);
        setUpdateToken('');
        setUpdateUrl('');
        setUpdateStatus('');
        fetchRiotAccounts();
      } else {
        setUpdateStatus(data.message || 'Error al actualizar la cuenta.');
      }
    } catch (e) {
      setUpdateStatus('Error de red al actualizar la cuenta.');
    }
  };

  // Función para formatear la fecha de última actualización
  const formatLastUpdated = (acc) => {
    console.log('🕒 [formatLastUpdated] Account:', acc.name, 'lastUpdated:', acc.lastUpdated);
    if (!acc.lastUpdated) {
      // Si no hay lastUpdated, usar la fecha actual como fallback
      return dayjs().format('DD/MM/YYYY HH:mm');
    }
    const last = dayjs(acc.lastUpdated);
    return last.format('DD/MM/YYYY HH:mm');
  };

  // Obtener las cuentas Riot del usuario
  const fetchRiotAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await makeAuthenticatedRequest(`${API_BASE}/api/auth/profile`);
      const data = await res.json();
      console.log('🕒 [fetchRiotAccounts] Data received:', data);
      if (data.success && data.user && data.user.riotAccounts) {
        console.log('🕒 [fetchRiotAccounts] Riot accounts:', data.user.riotAccounts);
        setRiotAccounts(data.user.riotAccounts);
      } else {
        setRiotAccounts([]);
      }
    } catch (e) {
      console.error('🕒 [fetchRiotAccounts] Error:', e);
      setRiotAccounts([]);
    }
    setLoadingAccounts(false);
  };

  useEffect(() => {
    fetchRiotAccounts();
    // eslint-disable-next-line
  }, []);

  const calcAccountStats = (acc) => {
    let totalVP = 0;
    if (weaponSkins && weaponSkins.length > 0 && acc.skins && catalog?.skinlevels?.length) {
      const skinsPorBase = {};
      acc.skins.forEach(skin => {
        const skinLevelObj = catalog.skinlevels.find(s => s.uuid === skin.ItemID);
        if (skinLevelObj) {
          const baseName = skinLevelObj.displayName.split(' Level ')[0].trim();
          if (!skinsPorBase[baseName]) skinsPorBase[baseName] = true;
        }
      });
      Object.keys(skinsPorBase).forEach(baseName => {
        if (baseName === 'VCT LOCK//IN Misericórdia') { totalVP += 5440; return; }
        if (baseName === 'VCT 2026 Sigil') { totalVP += 5350; return; }
        if (baseName === 'XERØFANG Vandal') { totalVP += 1775; return; }
        if (baseName === 'Arcane Vandal') { totalVP += 2175; return; }
        if (baseName === 'Arcane Gauntlets') { totalVP += 4350; return; }
        if (['Champions 2021 Karambit','Champions 2022 Butterfly Knife','Champions 2023 Kunai','Champions 2024 Blade','Champions 2025 Butterfly Knife'].includes(baseName)) { totalVP += 5350; return; }
        if (baseName.startsWith('Champions 202')) { totalVP += 2675; return; }
        if (/vct\d*\s+x\b/i.test(baseName)) { totalVP += 2340; return; }
        const skinBaseWeapon = weaponSkins.find(s => s.name === baseName);
        if (skinBaseWeapon?.price) {
          const price = Object.values(skinBaseWeapon.price)[0];
          if (price) { totalVP += parseInt(price, 10); return; }
        }
      });
    }
    totalVP += (acc.battlePasses?.length || 0) * 1000;

    const radiantBuddies = (acc.buddies || []).filter(b =>
      b.displayName?.toLowerCase().includes('radiant buddy')
    ).length;

    return { totalVP, radiantBuddies };
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => copyFallback(text));
    } else {
      copyFallback(text);
    }
  };

  const copyFallback = (text) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(ta);
  };

  const handleShare = async (e, puuid, idx) => {
    e.stopPropagation();
    const acc = riotAccounts.find(a => a.puuid === puuid);
    if (!acc || sharingIdx === idx) return;

    const url = `${window.location.origin}/share/${puuid}`;

    if (!acc.isShared) {
      setSharingIdx(idx);
      try {
        const res = await makeAuthenticatedRequest(`${API_BASE}/api/auth/share/${puuid}`, { method: 'POST' });
        const data = await res.json();
        if (!data.success) { setSharingIdx(null); alert(data.message); return; }
        // Actualización optimista: solo cambiamos este campo sin recargar todo
        setRiotAccounts(prev => prev.map(a =>
          a.puuid === puuid ? { ...a, isShared: true, sharedAt: data.sharedAt || new Date().toISOString() } : a
        ));
      } catch { setSharingIdx(null); return; }
      setSharingIdx(null);
    }

    copyToClipboard(url);
    setSharedIdx(idx);
    setTimeout(() => setSharedIdx(null), 2500);
  };

  const handleRevokeShare = async (puuid) => {
    try {
      const res = await makeAuthenticatedRequest(`${API_BASE}/api/auth/share/${puuid}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        // Actualización optimista: sin recargar todo
        setRiotAccounts(prev => prev.map(a =>
          a.puuid === puuid ? { ...a, isShared: false, sharedAt: null } : a
        ));
      } else alert(data.message);
    } catch { alert('Error de red'); }
  };

  const filteredAccounts = riotAccounts.filter(acc => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (acc.nickname || '').toLowerCase().includes(q) ||
      (acc.name || '').toLowerCase().includes(q)
    );
  });

  const handleSortClick = (field) => {
    if (sortBy === field) {
      if (sortDir === 'desc') setSortDir('asc');
      else { setSortBy(''); setSortDir('desc'); }
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const displayedAccounts = (() => {
    let list = [...filteredAccounts];

    // Default: más recientes primero (por fecha de última actualización)
    if (!sortBy && !groupByUser) {
      list.sort((a, b) =>
        new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime()
      );
    }

    if (groupByUser) {
      list.sort((a, b) =>
        (a.nickname || a.name || '').toLowerCase()
          .localeCompare((b.nickname || b.name || '').toLowerCase())
      );
    }

    if (sortBy) {
      list.sort((a, b) => {
        let valA, valB;
        if (sortBy === 'radBuddies') {
          valA = calcAccountStats(a).radiantBuddies;
          valB = calcAccountStats(b).radiantBuddies;
        } else if (sortBy === 'vp') {
          valA = calcAccountStats(a).totalVP;
          valB = calcAccountStats(b).totalVP;
        } else if (sortBy === 'lastUpdate') {
          valA = new Date(a.lastUpdated || 0).getTime();
          valB = new Date(b.lastUpdated || 0).getTime();
        }
        return sortDir === 'desc' ? valB - valA : valA - valB;
      });
    }

    return list;
  })();

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spin-reverse { to { transform: rotate(-360deg); } }
        .accounts-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .accounts-container {
          max-height: calc(2 * (360px + 16px));
          overflow-y: auto;
          padding-right: 8px;
        }
        .accounts-container::-webkit-scrollbar { width: 6px; }
        .accounts-container::-webkit-scrollbar-track { background: #1a1a1a; border-radius: 4px; }
        .accounts-container::-webkit-scrollbar-thumb { background: #ff4655; border-radius: 4px; }
        .accounts-container::-webkit-scrollbar-thumb:hover { background: #e63946; }
        .account-card { width: 100%; margin: 0; box-sizing: border-box; }
        @media (max-width: 1400px) { .accounts-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 900px)  { .accounts-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 550px)  { .accounts-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Pop-up para ingresar el nombre y token */}
      <AnimatePresence>
        {showPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100
            }}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                duration: 0.4 
              }}
              style={{
                background: 'linear-gradient(135deg, #1a1f2e 0%, #232b39 100%)',
                borderRadius: 20,
                padding: 0,
                minWidth: 420,
                maxWidth: 500,
                color: '#fff',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
                border: '1px solid #2a3441',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, #ff4655 0%, #c53030 100%)',
                padding: '24px 32px',
                textAlign: 'center'
              }}>
                <h2 style={{ 
                  color: '#fff', 
                  margin: 0, 
                  fontSize: '20px', 
                  fontWeight: 'bold',
                  letterSpacing: '1px'
                }}>
                  {t.addRiotAccount}
                </h2>
              </div>

              {/* Content */}
              <div style={{ padding: '32px' }}>
                {/* Account Name Input */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#fff',
                    marginBottom: '8px'
                  }}>
                    Nombre de la cuenta
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: main, smurf, haakuro..."
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: '2px solid #2a3441',
                      fontSize: '16px',
                      background: '#1a1f2e',
                      color: '#fff',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#ff4655'}
                    onBlur={e => e.target.style.borderColor = '#2a3441'}
                  />
                  <div style={{ fontSize: 11, color: '#666', marginTop: 5 }}>
                    Opcional — si lo dejás vacío se usa el nombre de la cuenta de Riot
                  </div>
                </div>

                {/* Riot Token Input */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#fff',
                    marginBottom: '8px'
                  }}>
                    Riot Token
                  </label>
                  <input
                    type="text"
                    placeholder={t.riotTokenPlaceholder}
                    value={riotToken}
                    onChange={handleTokenChange}
                    onPaste={handleTokenPaste}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: '2px solid #2a3441',
                      fontSize: '16px',
                      background: '#1a1f2e',
                      color: '#fff',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#ff4655'}
                    onBlur={e => e.target.style.borderColor = '#2a3441'}
                  />
                </div>

                {/* Get Token Button */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <a
                    href="https://auth.riotgames.com/authorize?redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1&scope=account%20openid"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#ff4655',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      padding: '12px 24px',
                      border: '2px solid #ff4655',
                      borderRadius: 12,
                      transition: 'all 0.3s ease',
                      background: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#ff4655';
                      e.target.style.color = '#fff';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 20px rgba(255, 70, 85, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#ff4655';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    🔐 {t.loginToRiotGames}
                  </a>
                  <div style={{
                    fontSize: '12px',
                    color: '#888',
                    marginTop: '12px',
                    lineHeight: '1.5',
                    maxWidth: '300px',
                    margin: '12px auto 0'
                  }}>
                    {t.riotInstructions}
                  </div>
                </div>

                {/* Status Message */}
                {addStatus && (
                  <div style={{
                    background: addStatus.includes('correcta') || addStatus.includes('successfully') 
                      ? 'rgba(76, 175, 80, 0.1)' 
                      : 'rgba(255, 70, 85, 0.1)',
                    border: addStatus.includes('correcta') || addStatus.includes('successfully')
                      ? '1px solid rgba(76, 175, 80, 0.3)'
                      : '1px solid rgba(255, 70, 85, 0.3)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    color: addStatus.includes('correcta') || addStatus.includes('successfully') ? '#4caf50' : '#ff4655',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    marginBottom: 24
                  }}>
                    {addStatus}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: 16,
                  justifyContent: 'flex-end'
                }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClosePopup}
                    style={{
                      background: 'transparent',
                      color: '#888',
                      border: '2px solid #2a3441',
                      borderRadius: 12,
                      padding: '12px 24px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={e => {
                      e.target.style.borderColor = '#444';
                      e.target.style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                      e.target.style.borderColor = '#2a3441';
                      e.target.style.color = '#888';
                    }}
                  >
                    {t.cancel}
                  </motion.button>
                  <motion.button
                    whileHover={addLoading ? {} : { scale: 1.02 }}
                    whileTap={addLoading ? {} : { scale: 0.98 }}
                    onClick={handleSaveToken}
                    disabled={addLoading}
                    style={{
                      background: addLoading
                        ? 'linear-gradient(135deg, #7a2530 0%, #5a1a1a 100%)'
                        : 'linear-gradient(135deg, #ff4655 0%, #c53030 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      padding: '12px 24px',
                      cursor: addLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxShadow: addLoading ? 'none' : '0 4px 12px rgba(255, 70, 85, 0.3)',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      opacity: addLoading ? 0.75 : 1,
                    }}
                  >
                    {addLoading && (
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        animation: 'spin 0.8s linear infinite',
                        flexShrink: 0,
                      }} />
                    )}
                    {addLoading ? 'Agregando cuenta...' : t.save}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de cuentas Riot agregadas */}
      <div style={{ marginTop: 60, padding: '0 18px' }}>
        {/* Filtros */}
        {!loadingAccounts && riotAccounts.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            {/* Barra superior */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 260, flexShrink: 0 }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#888' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por usuario..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 40px',
                    borderRadius: 10,
                    border: '2px solid #2a3441',
                    background: '#1a1f2e',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#ff4655'}
                  onBlur={e => e.target.style.borderColor = '#2a3441'}
                />
              </div>
              <button
                onClick={() => setFiltersOpen(o => !o)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: `2px solid ${filtersOpen || sortBy || groupByUser ? '#ff4655' : '#2a3441'}`,
                  background: filtersOpen || sortBy || groupByUser ? 'rgba(255,70,85,0.15)' : '#1a1f2e',
                  color: filtersOpen || sortBy || groupByUser ? '#ff4655' : '#888',
                  fontSize: 14,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s'
                }}
              >
                ⚙ Filtros
                <span style={{ fontSize: 10, transition: 'transform 0.2s', display: 'inline-block', transform: filtersOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </button>
              <div style={{ flex: 1 }} />
              <button
                style={{
                  padding: '10px 20px',
                  background: '#ff4655',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 'bold',
                  fontSize: 14,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
                onClick={handleOpenPopup}
              >
                {t.addAccount}
              </button>
            </div>

            {/* Panel desplegable */}
            {filtersOpen && (
              <div style={{
                marginTop: 8,
                background: '#131c27',
                border: '1px solid #2a3441',
                borderRadius: 12,
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}>
                {/* Agrupar iguales */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#888', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 100 }}>Agrupación</span>
                  <button
                    onClick={() => setGroupByUser(g => !g)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 8,
                      border: `2px solid ${groupByUser ? '#ff4655' : '#2a3441'}`,
                      background: groupByUser ? 'rgba(255,70,85,0.15)' : 'transparent',
                      color: groupByUser ? '#ff4655' : '#666',
                      fontSize: 13,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    ⇅ Agrupar cuentas iguales
                  </button>
                </div>

                <div style={{ borderTop: '1px solid #2a3441' }} />

                {/* Ordenar por */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: '#888', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 100 }}>Ordenar por</span>
                  {[
                    { key: 'radBuddies', label: 'Rad Buddies' },
                    { key: 'vp',         label: 'VP Gastados' },
                    { key: 'lastUpdate', label: 'Última actualización' },
                  ].map(({ key, label }) => {
                    const active = sortBy === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleSortClick(key)}
                        style={{
                          padding: '7px 16px',
                          borderRadius: 8,
                          border: `2px solid ${active ? '#ff4655' : '#2a3441'}`,
                          background: active ? 'rgba(255,70,85,0.15)' : 'transparent',
                          color: active ? '#ff4655' : '#666',
                          fontSize: 13,
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.2s'
                        }}
                      >
                        {label}
                        {active && (
                          <span style={{ fontSize: 11 }}>{sortDir === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Panel de links compartidos */}
        {!loadingAccounts && riotAccounts.length > 0 && (() => {
          const sharedAccounts = riotAccounts.filter(a => a.isShared);
          const LIMIT = 30;
          return (
            <div style={{ marginBottom: 20 }}>
              <button
                onClick={() => setShowSharesPanel(o => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px 0',
                  marginBottom: showSharesPanel ? 10 : 0,
                }}
              >
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
                  🔗 Links compartidos
                </span>
                <span style={{
                  background: sharedAccounts.length >= LIMIT ? '#ff4655' : '#1e2e40',
                  color: sharedAccounts.length >= LIMIT ? '#fff' : '#aaa',
                  borderRadius: 20,
                  padding: '2px 10px',
                  fontSize: 12,
                  fontWeight: 'bold',
                }}>
                  {sharedAccounts.length}/{LIMIT}
                </span>
                <span style={{ color: '#6b7a8d', fontSize: 11, marginLeft: 2 }}>
                  {showSharesPanel ? '▲' : '▼'}
                </span>
              </button>

              {showSharesPanel && (
                <div style={{
                  background: '#0c1520',
                  border: '1px solid #1e2e40',
                  borderRadius: 10,
                  padding: sharedAccounts.length === 0 ? 0 : 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  {sharedAccounts.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#6b7a8d', fontSize: 13 }}>
                      No tenés links activos. Tocá "Compartir" en una cuenta para generar uno.
                    </div>
                  ) : (
                    sharedAccounts.map((acc) => {
                      const riotId = acc.userInfo?.acct?.game_name
                        ? `${acc.userInfo.acct.game_name}#${acc.userInfo.acct.tag_line}`
                        : null;
                      const shareUrl = `${window.location.origin}/share/${acc.puuid}`;
                      const sharedDate = acc.sharedAt
                        ? new Date(acc.sharedAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '—';
                      const justCopied = copiedSharePuuid === acc.puuid;
                      return (
                        <div
                          key={acc.puuid}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '12px 14px',
                            borderRadius: 8,
                            background: '#0a121c',
                            border: '1px solid rgba(255,255,255,0.05)',
                          }}
                        >
                          {/* Avatar */}
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #ff4655 0%, #c53030 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: '#fff',
                            flexShrink: 0,
                          }}>
                            {acc.name.charAt(0).toUpperCase()}
                          </div>

                          {/* Nombre + riot id */}
                          <div style={{ minWidth: 0, width: 150, flexShrink: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</div>
                            {riotId && <div style={{ fontSize: 11, color: '#6b7a8d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{riotId}</div>}
                          </div>

                          {/* Link */}
                          <button
                            onClick={() => { copyToClipboard(shareUrl); setCopiedSharePuuid(acc.puuid); setTimeout(() => setCopiedSharePuuid(null), 2000); }}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              background: '#131c27',
                              border: `1px solid ${justCopied ? '#4caf50' : '#1e2e40'}`,
                              borderRadius: 8,
                              padding: '8px 12px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'border-color 0.2s',
                            }}
                          >
                            <span style={{
                              flex: 1,
                              minWidth: 0,
                              fontSize: 12,
                              color: '#8a9ab0',
                              fontFamily: 'monospace',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {shareUrl}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 'bold', color: justCopied ? '#4caf50' : '#6b7a8d', flexShrink: 0 }}>
                              {justCopied ? '✓ Copiado' : '⎘ Copiar'}
                            </span>
                          </button>

                          {/* Fecha */}
                          <div style={{ fontSize: 11, color: '#6b7a8d', width: 110, flexShrink: 0, textAlign: 'right' }}>
                            {sharedDate}
                          </div>

                          {/* Dar de baja */}
                          <button
                            onClick={() => handleRevokeShare(acc.puuid)}
                            style={{
                              flexShrink: 0,
                              background: 'rgba(255,70,85,0.08)',
                              border: '1px solid rgba(255,70,85,0.25)',
                              borderRadius: 8,
                              color: '#ff4655',
                              fontSize: 11,
                              fontWeight: 'bold',
                              padding: '8px 12px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,70,85,0.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,70,85,0.08)'; }}
                          >
                            Dar de baja
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {loadingAccounts ? (
          <div className="accounts-grid" style={{ marginTop: 0 }}>
            {[...Array(4)].map((_, i) => <SkeletonAccountCard key={i} />)}
          </div>
        ) : (
          displayedAccounts.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 24 }}>
              <div style={{ color: '#fff', marginBottom: riotAccounts.length === 0 ? 20 : 0 }}>
                {riotAccounts.length === 0 ? t.noAccounts : 'Sin resultados'}
              </div>
              {riotAccounts.length === 0 && (
                <button
                  style={{
                    padding: '10px 20px',
                    background: '#ff4655',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 'bold',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                  onClick={handleOpenPopup}
                >
                  {t.addAccount}
                </button>
              )}
            </div>
          ) : (
            <div className="accounts-container">
              <div className="accounts-grid">
                {displayedAccounts.map((acc, idx) => {
                  const equippedCardId = acc.loadout?.Identity?.PlayerCardID;
                  const equippedCard = equippedCardId && acc.cards?.length
                    ? acc.cards.find(c => c.ItemID === equippedCardId)
                    : null;
                  const wideArt = equippedCard?.wideArt
                    || 'https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png';
                  const { totalVP, radiantBuddies } = calcAccountStats(acc);
                  const riotId = acc.nickname
                    || (acc.userInfo?.acct?.game_name
                      ? `${acc.userInfo.acct.game_name}#${acc.userInfo.acct.tag_line}`
                      : null);

                  return (
                    <motion.div
                      key={`${acc.puuid}-${idx}`}
                      className="account-card"
                      initial={{ opacity: 0, y: 40, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, delay: idx * 0.08, type: 'spring', stiffness: 120 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: '2px solid transparent',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.7)',
                        cursor: 'pointer',
                        background: '#0d1520',
                        transition: 'all 0.25s ease',
                        margin: 0,
                        boxSizing: 'border-box',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.border = '2px solid #ff4655';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,70,85,0.18)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.border = '2px solid transparent';
                        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.7)';
                      }}
                      onMouseDown={e => { if (e.button === 1) e.preventDefault(); }}
                      onClick={() => {
                        localStorage.setItem('selected_riot_puuid', acc.puuid);
                        refreshAccount(acc.puuid);
                        navigate('/mis-skins?puuid=' + acc.puuid);
                      }}
                      onAuxClick={e => {
                        if (e.button === 1) {
                          e.preventDefault();
                          window.open('/mis-skins?puuid=' + acc.puuid, '_blank');
                        }
                      }}
                    >
                      {/* Banner image */}
                      <div style={{
                        position: 'relative',
                        height: 160,
                        overflow: 'hidden',
                        background: '#1a2636',
                      }}>
                        <img
                          src={wideArt}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        {/* gradient overlay */}
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.72) 100%)',
                        }} />

                        {/* Account name over image */}
                        <div style={{
                          position: 'absolute', bottom: 14, left: 16, right: 16,
                        }}>
                          <div style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: '#fff',
                            textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {acc.name}
                            {riotId && (
                              <span style={{ fontWeight: 'normal', color: '#ddd', fontSize: 14, marginLeft: 6 }}>
                                ({riotId})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card body */}
                      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, background: 'linear-gradient(to bottom, #0d1520 0%, #08111b 100%)' }}>
                        {/* Last updated */}
                        <div style={{ fontSize: 11, color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: '#ff4655', fontSize: 8, lineHeight: 1 }}>●</span>
                          {t.lastUpdated}: {formatLastUpdated(acc)}
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div style={{
                            flex: 1,
                            background: '#07101a',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 8,
                            padding: '8px 12px',
                          }}>
                            <div style={{ fontSize: 10, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>VP Gastados</div>
                            <div style={{ fontSize: 20, color: '#fff', fontWeight: 'bold' }}>
                              {totalVP > 0 ? totalVP.toLocaleString() : '—'}
                            </div>
                          </div>
                          <div style={{
                            flex: 1,
                            background: '#07101a',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 8,
                            padding: '8px 12px',
                          }}>
                            <div style={{ fontSize: 10, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Radiant Buddies</div>
                            <div style={{ fontSize: 20, color: '#FFD700', fontWeight: 'bold' }}>{radiantBuddies}</div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                          <button
                            style={{
                              flex: 1,
                              background: sharedIdx === idx
                                ? 'rgba(76,175,80,0.15)'
                                : sharingIdx === idx
                                  ? 'rgba(255,180,0,0.1)'
                                  : '#07101a',
                              color: sharedIdx === idx
                                ? '#4caf50'
                                : sharingIdx === idx
                                  ? '#ffb300'
                                  : '#8a9ab0',
                              border: `1px solid ${
                                sharedIdx === idx ? '#4caf50'
                                : sharingIdx === idx ? '#ffb300'
                                : 'rgba(255,255,255,0.07)'
                              }`,
                              borderRadius: 8,
                              padding: '9px 0',
                              fontWeight: 'bold',
                              cursor: sharingIdx === idx ? 'default' : 'pointer',
                              fontSize: 12,
                              transition: 'all 0.2s ease',
                            }}
                            onClick={e => handleShare(e, acc.puuid, idx)}
                          >
                            {sharedIdx === idx
                              ? '✓ Link copiado'
                              : sharingIdx === idx
                                ? '⏳ Generando...'
                                : '🔗 Compartir'}
                          </button>
                          <button
                            style={{
                              flex: 1,
                              background: 'rgba(255,70,85,0.12)',
                              color: '#ff4655',
                              border: '1px solid rgba(255,70,85,0.35)',
                              borderRadius: 8,
                              padding: '9px 0',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: 12,
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => { e.target.style.background = 'rgba(255,70,85,0.25)'; }}
                            onMouseLeave={e => { e.target.style.background = 'rgba(255,70,85,0.12)'; }}
                            onClick={e => { e.stopPropagation(); setAccountToUpdate(acc); setShowUpdateModal(true); setUpdateToken(''); setUpdateStatus(''); }}
                          >
                            {t.updateAccount}
                          </button>
                          <button
                            style={{
                              flex: 1,
                              background: '#07101a',
                              color: '#6b7a8d',
                              border: '1px solid rgba(255,255,255,0.07)',
                              borderRadius: 8,
                              padding: '9px 0',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: 12,
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => { e.target.style.color = '#ff4655'; e.target.style.borderColor = 'rgba(255,70,85,0.4)'; }}
                            onMouseLeave={e => { e.target.style.color = '#6b7a8d'; e.target.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                            onClick={e => { e.stopPropagation(); setAccountToDelete(acc); setDeleteStep(1); setDeleteLoading(false); setShowDeleteModal(true); }}
                          >
                            {t.deleteAccount}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>

      {/* Modal de confirmación para borrar */}
      <AnimatePresence>
        {showDeleteModal && accountToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30 
              }}
              style={{
                background: 'linear-gradient(135deg, #1a1f2e 0%, #232b39 100%)',
                borderRadius: 16,
                overflow: 'hidden',
                minWidth: 360,
                maxWidth: 420,
                color: '#fff',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                border: '1px solid #2a3441',
              }}
            >
              {/* Loading state */}
              {deleteLoading ? (
                <div style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                  <div style={{ position: 'relative', width: 56, height: 56 }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      borderRadius: '50%',
                      border: '3px solid rgba(255,70,85,0.15)',
                      borderTopColor: '#ff4655',
                      animation: 'spin 0.9s linear infinite',
                    }} />
                    <div style={{
                      position: 'absolute', inset: 8,
                      borderRadius: '50%',
                      border: '2px solid rgba(255,70,85,0.08)',
                      borderTopColor: 'rgba(255,70,85,0.5)',
                      animation: 'spin-reverse 1.3s linear infinite',
                    }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 6 }}>Eliminando cuenta...</div>
                    <div style={{ fontSize: 13, color: '#6b7a8d' }}>Esto puede tardar unos segundos</div>
                  </div>
                </div>
              ) : deleteStep === 1 ? (
                <>
                  <div style={{ background: 'linear-gradient(135deg, #2d1b1b 0%, #3d1f1f 100%)', padding: '24px 28px', borderBottom: '1px solid #3a2222' }}>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ff4655', marginBottom: 4 }}>Eliminar cuenta</div>
                    <div style={{ fontSize: 13, color: '#aaa' }}>Esta acción no se puede deshacer</div>
                  </div>
                  <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ background: '#131c27', border: '1px solid #1e2e40', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, color: '#6b7a8d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Cuenta a eliminar</div>
                      <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>{accountToDelete.name}</div>
                      {accountToDelete.userInfo?.acct?.game_name && (
                        <div style={{ fontSize: 13, color: '#aaa', marginTop: 2 }}>
                          {accountToDelete.userInfo.acct.game_name}#{accountToDelete.userInfo.acct.tag_line}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                      <button
                        onClick={() => setShowDeleteModal(false)}
                        style={{ flex: 1, background: '#1a2636', color: '#aaa', border: '1px solid #2a3441', borderRadius: 10, padding: '12px 0', fontWeight: 'bold', fontSize: 14, cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => setDeleteStep(2)}
                        style={{ flex: 1, background: 'rgba(255,70,85,0.15)', color: '#ff4655', border: '1px solid rgba(255,70,85,0.4)', borderRadius: 10, padding: '12px 0', fontWeight: 'bold', fontSize: 14, cursor: 'pointer' }}
                      >
                        Eliminar →
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ background: 'linear-gradient(135deg, #ff4655 0%, #c53030 100%)', padding: '24px 28px' }}>
                    <div style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 }}>⚠️ ¿Estás seguro?</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                      Se eliminará permanentemente la cuenta <b>{accountToDelete.name}</b> y todos sus datos. No hay vuelta atrás.
                    </div>
                  </div>
                  <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                      onClick={handleDeleteAccount}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #ff4655 0%, #c53030 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        padding: '14px 0',
                        fontWeight: 'bold',
                        fontSize: 15,
                        cursor: 'pointer',
                        letterSpacing: '0.5px',
                        boxShadow: '0 4px 16px rgba(255,70,85,0.35)',
                      }}
                    >
                      Sí, eliminar definitivamente
                    </button>
                    <button
                      onClick={() => setDeleteStep(1)}
                      style={{ width: '100%', background: 'transparent', color: '#888', border: '1px solid #2a3441', borderRadius: 10, padding: '11px 0', fontWeight: 'bold', fontSize: 14, cursor: 'pointer' }}
                    >
                      ← Volver
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal para actualizar cuenta (solo pide token) */}
      <AnimatePresence>
        {showUpdateModal && accountToUpdate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30 
              }}
              style={{ 
                background: 'linear-gradient(135deg, #1a1f2e 0%, #232b39 100%)', 
                borderRadius: 20, 
                padding: 0, 
                minWidth: 420, 
                maxWidth: 500,
                color: '#fff', 
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
                border: '1px solid #2a3441',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, #ff4655 0%, #c53030 100%)',
                padding: '24px 32px',
                textAlign: 'center'
              }}>
                <h3 style={{ 
                  color: '#fff', 
                  margin: 0, 
                  fontSize: '20px', 
                  fontWeight: 'bold',
                  letterSpacing: '1px'
                }}>
                  {t.updateRiotAccount}
                </h3>
              </div>

              {/* Content */}
              <div style={{ padding: '32px' }}>
                {/* Account Info */}
                <div style={{
                  background: 'rgba(255, 70, 85, 0.1)',
                  border: '1px solid rgba(255, 70, 85, 0.3)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ff4655 0%, #c53030 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#fff'
                  }}>
                    {accountToUpdate.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#888', marginBottom: '4px' }}>Account Name</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{accountToUpdate.name}</div>
                  </div>
                </div>

                {/* Token Input */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#fff',
                    marginBottom: '8px'
                  }}>
                    Riot Token
                  </label>
                  <input
                    type="text"
                    placeholder={t.newTokenPlaceholder}
                    value={updateToken}
                    onChange={e => {
                      const value = e.target.value;
                      if (value.includes('playvalorant.com')) {
                        setUpdateUrl(value);
                        setUpdateToken(extractTokenFromUrl(value));
                      } else {
                        setUpdateToken(value);
                        setUpdateUrl(value);
                      }
                    }}
                    onPaste={e => { 
                      const pastedText = e.clipboardData.getData('text');
                      if (pastedText.includes('playvalorant.com')) {
                        setUpdateUrl(pastedText);
                        setUpdateToken(extractTokenFromUrl(pastedText));
                      } else {
                        setUpdateToken(pastedText);
                        setUpdateUrl(pastedText);
                      }
                      e.preventDefault(); 
                    }}
                    style={{ 
                      width: '100%',
                      padding: '14px 16px', 
                      borderRadius: 12, 
                      border: '2px solid #2a3441', 
                      fontSize: '16px',
                      background: '#1a1f2e',
                      color: '#fff',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#ff4655'}
                    onBlur={e => e.target.style.borderColor = '#2a3441'}
                  />
                </div>

                {/* Get Token Button */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <a
                    href="https://auth.riotgames.com/authorize?redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1&scope=account%20openid"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#ff4655', 
                      textDecoration: 'none', 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      padding: '12px 24px', 
                      border: '2px solid #ff4655', 
                      borderRadius: 12, 
                      transition: 'all 0.3s ease',
                      background: 'transparent'
                    }}
                    onMouseEnter={e => { 
                      e.target.style.background = '#ff4655'; 
                      e.target.style.color = '#fff';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 20px rgba(255, 70, 85, 0.3)';
                    }}
                    onMouseLeave={e => { 
                      e.target.style.background = 'transparent'; 
                      e.target.style.color = '#ff4655';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    🔐 {t.getRiotToken}
                  </a>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#888', 
                    marginTop: '12px', 
                    lineHeight: '1.5',
                    maxWidth: '300px',
                    margin: '12px auto 0'
                  }}>
                    {t.tokenInstructions}
                  </div>
                </div>

                {/* Status Message */}
                {updateStatus && (
                  <div style={{ 
                    background: 'rgba(255, 70, 85, 0.1)',
                    border: '1px solid rgba(255, 70, 85, 0.3)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    color: '#ff4655', 
                    textAlign: 'center', 
                    fontWeight: '600',
                    fontSize: '14px',
                    marginBottom: 24
                  }}>
                    {updateStatus}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: 16, 
                  justifyContent: 'flex-end'
                }}>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUpdateModal(false)} 
                    style={{ 
                      background: 'transparent',
                      color: '#888', 
                      border: '2px solid #2a3441', 
                      borderRadius: 12, 
                      padding: '12px 24px', 
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={e => {
                      e.target.style.borderColor = '#444';
                      e.target.style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                      e.target.style.borderColor = '#2a3441';
                      e.target.style.color = '#888';
                    }}
                  >
                    {t.cancel}
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpdateAccount} 
                    style={{ 
                      background: 'linear-gradient(135deg, #ff4655 0%, #c53030 100%)', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 12, 
                      padding: '12px 24px', 
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(255, 70, 85, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={e => {
                      e.target.style.boxShadow = '0 8px 20px rgba(255, 70, 85, 0.4)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.target.style.boxShadow = '0 4px 12px rgba(255, 70, 85, 0.3)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    {t.updateAccount}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 