import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonAccountCard } from './LoadingScreen';
import { TacticalButton, TextField, SearchInput, Modal, ModalHeader, ModalBody } from './kit';
import { calcAccountStats } from '../../utils/pricing';
import styles from './HomePage.module.css';

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
      if (data.success && data.user && data.user.riotAccounts) {
        setRiotAccounts(data.user.riotAccounts);
      } else {
        setRiotAccounts([]);
      }
    } catch (e) {
      setRiotAccounts([]);
    }
    setLoadingAccounts(false);
  };

  useEffect(() => {
    fetchRiotAccounts();
    // eslint-disable-next-line
  }, []);

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
          valA = calcAccountStats(a, weaponSkins, catalog).radiantBuddies;
          valB = calcAccountStats(b, weaponSkins, catalog).radiantBuddies;
        } else if (sortBy === 'vp') {
          valA = calcAccountStats(a, weaponSkins, catalog).totalVP;
          valB = calcAccountStats(b, weaponSkins, catalog).totalVP;
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
    <div className={styles.page}>
      {/* Pop-up para ingresar el nombre y token */}
      <Modal open={showPopup} onClose={handleClosePopup} maxWidth={480}>
        <ModalHeader title={t.addRiotAccount} />
        <ModalBody>
          <div className={styles.fieldGap}>
            <TextField
              label="Nombre de la cuenta"
              type="text"
              placeholder="Ej: main, smurf, haakuro..."
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
            />
            <div className={styles.helperText}>
              Opcional — si lo dejás vacío se usa el nombre de la cuenta de Riot
            </div>
          </div>

          <div className={styles.fieldGap}>
            <TextField
              label="Riot Token"
              type="text"
              placeholder={t.riotTokenPlaceholder}
              value={riotToken}
              onChange={handleTokenChange}
              onPaste={handleTokenPaste}
            />
          </div>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <TacticalButton
              as="a"
              variant="ghost"
              href="https://auth.riotgames.com/authorize?redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1&scope=account%20openid"
              target="_blank"
              rel="noopener noreferrer"
            >
              🔐 {t.loginToRiotGames}
            </TacticalButton>
            <div className={styles.helperText} style={{ maxWidth: 300, margin: '12px auto 0' }}>
              {t.riotInstructions}
            </div>
          </div>

          {addStatus && (
            <div className={`${styles.statusMessage} ${addStatus.includes('correcta') || addStatus.includes('successfully') ? styles.statusOk : styles.statusError}`}>
              {addStatus}
            </div>
          )}

          <div className={styles.modalActions}>
            <TacticalButton variant="ghost" onClick={handleClosePopup}>{t.cancel}</TacticalButton>
            <TacticalButton onClick={handleSaveToken} disabled={addLoading}>
              {addLoading && <span className={styles.spinnerSm} />}
              {addLoading ? 'Agregando cuenta...' : t.save}
            </TacticalButton>
          </div>
        </ModalBody>
      </Modal>

      {/* Lista de cuentas Riot agregadas */}
      <div>
        <div className={styles.accountsHeader}>
          <h1 className={styles.accountsTitle}>Tus cuentas</h1>
          <TacticalButton onClick={handleOpenPopup}>+ {t.addAccount}</TacticalButton>
        </div>

        {/* Filtros */}
        {!loadingAccounts && riotAccounts.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div className={styles.topBar}>
              <div className={styles.searchWrap}>
                <SearchInput
                  placeholder="Buscar por usuario..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                onClick={() => setFiltersOpen(o => !o)}
                className={`${styles.filtersToggle} ${(filtersOpen || sortBy || groupByUser) ? styles.filtersToggleActive : ''}`}
              >
                ⚙ Filtros
                <span className={`${styles.filtersToggleCaret} ${filtersOpen ? styles.filtersToggleCaretOpen : ''}`}>▼</span>
              </button>
            </div>

            {/* Panel desplegable */}
            {filtersOpen && (
              <div className={styles.filtersPanel}>
                <div className={styles.filterRow}>
                  <span className={styles.filterRowLabel}>Agrupación</span>
                  <button
                    onClick={() => setGroupByUser(g => !g)}
                    className={`${styles.chip} ${groupByUser ? styles.chipActive : ''}`}
                  >
                    ⇅ Agrupar cuentas iguales
                  </button>
                </div>

                <div className={styles.filterDivider} />

                <div className={styles.filterRow}>
                  <span className={styles.filterRowLabel}>Ordenar por</span>
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
                        className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                      >
                        {label}
                        {active && <span>{sortDir === 'desc' ? '↓' : '↑'}</span>}
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
            <div className={styles.sharesSection}>
              <button className={styles.sharesToggle} onClick={() => setShowSharesPanel(o => !o)}>
                <span className={styles.sharesToggleLabel}>🔗 Links compartidos</span>
                <span className={`${styles.sharesCount} ${sharedAccounts.length >= LIMIT ? styles.sharesCountFull : ''}`}>
                  {sharedAccounts.length}/{LIMIT}
                </span>
                <span className={styles.sharesCaret}>{showSharesPanel ? '▲' : '▼'}</span>
              </button>

              {showSharesPanel && (
                <div className={styles.sharesPanel}>
                  {sharedAccounts.length === 0 ? (
                    <div className={styles.sharesEmpty}>
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
                        <div key={acc.puuid} className={styles.shareRow}>
                          <div className={styles.shareAvatar}>{acc.name.charAt(0).toUpperCase()}</div>

                          <div className={styles.shareIdentity}>
                            <div className={styles.shareName}>{acc.name}</div>
                            {riotId && <div className={styles.shareRiotId}>{riotId}</div>}
                          </div>

                          <button
                            onClick={() => { copyToClipboard(shareUrl); setCopiedSharePuuid(acc.puuid); setTimeout(() => setCopiedSharePuuid(null), 2000); }}
                            className={`${styles.shareLinkBtn} ${justCopied ? styles.shareLinkBtnCopied : ''}`}
                          >
                            <span className={styles.shareLinkUrl}>{shareUrl}</span>
                            <span className={`${styles.shareLinkStatus} ${justCopied ? styles.shareLinkStatusCopied : ''}`}>
                              {justCopied ? '✓ Copiado' : '⎘ Copiar'}
                            </span>
                          </button>

                          <div className={styles.shareDate}>{sharedDate}</div>

                          <button className={styles.shareRevoke} onClick={() => handleRevokeShare(acc.puuid)}>
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
          <div className={styles.grid}>
            {[...Array(4)].map((_, i) => <SkeletonAccountCard key={i} />)}
          </div>
        ) : (
          displayedAccounts.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateText}>
                {riotAccounts.length === 0 ? t.noAccounts : 'Sin resultados'}
              </div>
              {riotAccounts.length === 0 && (
                <TacticalButton onClick={handleOpenPopup}>{t.addAccount}</TacticalButton>
              )}
            </div>
          ) : (
            <div className={styles.accountsContainer}>
              <div className={styles.grid}>
                {displayedAccounts.map((acc, idx) => {
                  const equippedCardId = acc.loadout?.Identity?.PlayerCardID;
                  const equippedCard = equippedCardId && acc.cards?.length
                    ? acc.cards.find(c => c.ItemID === equippedCardId)
                    : null;
                  const wideArt = equippedCard?.wideArt
                    || 'https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png';
                  const { totalVP, radiantBuddies } = calcAccountStats(acc, weaponSkins, catalog);
                  const riotId = acc.nickname
                    || (acc.userInfo?.acct?.game_name
                      ? `${acc.userInfo.acct.game_name}#${acc.userInfo.acct.tag_line}`
                      : null);

                  return (
                    <motion.article
                      key={`${acc.puuid}-${idx}`}
                      className={styles.card}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link
                        className={styles.cardHitArea}
                        to={`/details?puuid=${encodeURIComponent(acc.puuid)}`}
                        onClick={() => refreshAccount(acc.puuid)}
                        aria-label={`Abrir cuenta ${acc.name}`}
                      />

                      <div className={styles.cardBanner}>
                        <img
                          src={wideArt}
                          alt=""
                          className={styles.cardBannerImg}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        <div className={styles.cardBannerOverlay} />
                        <div className={styles.cardBannerName}>
                          {acc.name}
                          {riotId && <span className={styles.cardBannerRiotId}>({riotId})</span>}
                        </div>
                      </div>

                      <div className={styles.cardBody}>
                        <div className={styles.cardUpdated}>
                          <span style={{ color: 'var(--vi-red)', fontSize: 8, lineHeight: 1 }}>●</span>
                          {t.lastUpdated}: {formatLastUpdated(acc)}
                        </div>

                        <div className={styles.cardStats}>
                          <div className={styles.statBox}>
                            <div className={styles.statLabel}>VP Gastados</div>
                            <div className={styles.statValue}>
                              {totalVP > 0 ? totalVP.toLocaleString() : '—'}
                            </div>
                          </div>
                          <div className={styles.statBox}>
                            <div className={styles.statLabel}>Radiant Buddies</div>
                            <div className={`${styles.statValue} ${styles.statValueGold}`}>{radiantBuddies}</div>
                          </div>
                        </div>

                        <div className={styles.cardActions}>
                          <button
                            className={`${styles.cardActionBtn} ${sharedIdx === idx ? styles.cardActionShared : ''} ${sharingIdx === idx ? styles.cardActionSharing : ''}`}
                            onClick={e => handleShare(e, acc.puuid, idx)}
                          >
                            {sharedIdx === idx
                              ? '✓ Link copiado'
                              : sharingIdx === idx
                                ? '⏳ Generando...'
                                : 'Compartir'}
                          </button>
                          <button
                            className={styles.cardActionBtn}
                            onClick={e => { e.stopPropagation(); setAccountToUpdate(acc); setShowUpdateModal(true); setUpdateToken(''); setUpdateStatus(''); }}
                          >
                            {t.updateAccount}
                          </button>
                          <button
                            className={`${styles.cardActionBtn} ${styles.cardActionDanger}`}
                            onClick={e => { e.stopPropagation(); setAccountToDelete(acc); setDeleteStep(1); setDeleteLoading(false); setShowDeleteModal(true); }}
                          >
                            {t.deleteAccount}
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>

      {/* Modal de confirmación para borrar */}
      <Modal open={showDeleteModal && !!accountToDelete} onClose={() => !deleteLoading && setShowDeleteModal(false)} maxWidth={420}>
        {deleteLoading ? (
          <div className={styles.deleteLoadingWrap}>
            <div className={styles.spinnerOuter}>
              <div className={styles.spinnerRing} />
              <div className={styles.spinnerRingInner} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--vi-white)', marginBottom: 6 }}>Eliminando cuenta...</div>
              <div style={{ fontSize: 13, color: 'rgba(236,232,225,0.5)' }}>Esto puede tardar unos segundos</div>
            </div>
          </div>
        ) : deleteStep === 1 ? (
          <>
            <ModalHeader title="Eliminar cuenta" subtitle="Esta acción no se puede deshacer" danger />
            <ModalBody>
              <div className={styles.deleteAccountBox}>
                <div className={styles.deleteAccountLabel}>Cuenta a eliminar</div>
                <div className={styles.deleteAccountName}>{accountToDelete?.name}</div>
                {accountToDelete?.userInfo?.acct?.game_name && (
                  <div style={{ fontSize: 13, color: 'rgba(236,232,225,0.6)', marginTop: 2 }}>
                    {accountToDelete.userInfo.acct.game_name}#{accountToDelete.userInfo.acct.tag_line}
                  </div>
                )}
              </div>
              <div className={styles.modalActions}>
                <TacticalButton variant="ghost" fullWidth onClick={() => setShowDeleteModal(false)}>Cancelar</TacticalButton>
                <TacticalButton variant="danger" fullWidth onClick={() => setDeleteStep(2)}>Eliminar →</TacticalButton>
              </div>
            </ModalBody>
          </>
        ) : (
          <>
            <ModalHeader title="⚠️ ¿Estás seguro?" subtitle={<>Se eliminará permanentemente la cuenta <b>{accountToDelete?.name}</b> y todos sus datos. No hay vuelta atrás.</>} danger />
            <ModalBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <TacticalButton variant="danger" fullWidth onClick={handleDeleteAccount}>
                  Sí, eliminar definitivamente
                </TacticalButton>
                <TacticalButton variant="ghost" fullWidth onClick={() => setDeleteStep(1)}>
                  ← Volver
                </TacticalButton>
              </div>
            </ModalBody>
          </>
        )}
      </Modal>

      {/* Modal para actualizar cuenta (solo pide token) */}
      <Modal open={showUpdateModal && !!accountToUpdate} onClose={() => setShowUpdateModal(false)} maxWidth={480}>
        <ModalHeader title={t.updateRiotAccount} />
        <ModalBody>
          <div className={styles.accountBadgeRow}>
            <div className={styles.accountBadgeAvatar}>{accountToUpdate?.name?.charAt(0).toUpperCase()}</div>
            <div>
              <div className={styles.accountBadgeLabel}>Account Name</div>
              <div className={styles.accountBadgeName}>{accountToUpdate?.name}</div>
            </div>
          </div>

          <div className={styles.fieldGap}>
            <TextField
              label="Riot Token"
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
            />
          </div>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <TacticalButton
              as="a"
              variant="ghost"
              href="https://auth.riotgames.com/authorize?redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1&scope=account%20openid"
              target="_blank"
              rel="noopener noreferrer"
            >
              🔐 {t.getRiotToken}
            </TacticalButton>
            <div className={styles.helperText} style={{ maxWidth: 300, margin: '12px auto 0' }}>
              {t.tokenInstructions}
            </div>
          </div>

          {updateStatus && <div className={`${styles.statusMessage} ${styles.statusError}`}>{updateStatus}</div>}

          <div className={styles.modalActions}>
            <TacticalButton variant="ghost" onClick={() => setShowUpdateModal(false)}>{t.cancel}</TacticalButton>
            <TacticalButton onClick={handleUpdateAccount}>{t.updateAccount}</TacticalButton>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
