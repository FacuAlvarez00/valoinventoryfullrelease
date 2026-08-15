import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonAccountCard } from './LoadingScreen';
import { TacticalButton, TextField, SearchInput, Modal, ModalHeader, ModalBody, Pagination } from './kit';
import { calcAccountStats } from '../../utils/pricing';
import usePagination from '../../hooks/usePagination';
import { PAGE_SIZES } from '../../config/pagination';
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

  // Extract the Riot token from the URL so the input only displays the token
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

  // Keep the complete URL for the ID token and region metadata
  const [riotUrl, setRiotUrl] = useState('');

  const handleTokenChange = (e) => {
    const value = e.target.value;
    // Store complete URLs while displaying only the access token
    if (value.includes('playvalorant.com')) {
      setRiotUrl(value);
      const extractedToken = extractTokenFromUrl(value);
      setRiotToken(extractedToken);
    } else {
      // If it is only a token, keep both values in sync
      setRiotToken(value);
      setRiotUrl(value);
    }
  };

  const handleTokenPaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    // Store complete URLs while displaying only the access token
    if (pastedText.includes('playvalorant.com')) {
      setRiotUrl(pastedText);
      const extractedToken = extractTokenFromUrl(pastedText);
      setRiotToken(extractedToken);
    } else {
      // If it is only a token, keep both values in sync
      setRiotToken(pastedText);
      setRiotUrl(pastedText);
    }
    e.preventDefault();
  };

  // Save a Riot account
  const handleSaveToken = async () => {
    if (addLoading) return;
    setAddStatus('');
    if (!riotToken) {
      setAddStatus('Enter a Riot token to continue.');
      return;
    }

    if (!riotUrl || !riotUrl.includes('playvalorant.com')) {
      setAddStatus('Paste the complete URL containing the ID token.');
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
        setAddStatus(data.message || 'Failed to add the account.');
      }
    } catch (e) {
      setAddStatus('A network error occurred while adding the account.');
    }
    setAddLoading(false);
  };

  // Delete a Riot account
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
        alert(data.message || 'Failed to delete the account.');
      }
    } catch (e) {
      setDeleteLoading(false);
      alert('A network error occurred while deleting the account.');
    }
  };

  // Update a Riot account by replacing its stored credentials
  const handleUpdateAccount = async () => {
    if (!accountToUpdate || !updateToken) return;
    setUpdateStatus('');

    // A complete URL is required to obtain the region metadata
    if (!updateUrl || !updateUrl.includes('playvalorant.com')) {
      setUpdateStatus('Paste the complete URL containing the ID token.');
      return;
    }

    try {
      // Remove the existing account
      await makeAuthenticatedRequest(`${API_BASE}/api/auth/riot/account/${accountToUpdate.puuid}`, {
        method: 'DELETE',
      });
      // Add it again under the same name
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
        setUpdateStatus(data.message || 'Failed to update the account.');
      }
    } catch (e) {
      setUpdateStatus('A network error occurred while updating the account.');
    }
  };

  // Format the last-updated timestamp
  const formatLastUpdated = (acc) => {
    if (!acc.lastUpdated) {
      // Use the current timestamp as a fallback
      return dayjs().format('DD/MM/YYYY HH:mm');
    }
    const last = dayjs(acc.lastUpdated);
    return last.format('DD/MM/YYYY HH:mm');
  };

  // Fetch the current user's Riot accounts
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
        // Update only the affected account optimistically
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
        // Revoke locally without reloading the entire list
        setRiotAccounts(prev => prev.map(a =>
          a.puuid === puuid ? { ...a, isShared: false, sharedAt: null } : a
        ));
      } else alert(data.message);
    } catch { alert('Network error'); }
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

    // Default to most recently updated first
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

  const sharedAccounts = riotAccounts.filter(account => account.isShared);
  const accountsPagination = usePagination(displayedAccounts, {
    pageSize: PAGE_SIZES.accounts,
    resetKey: `${searchQuery}|${sortBy}|${sortDir}|${groupByUser}`,
  });
  const sharedLinksPagination = usePagination(sharedAccounts, {
    pageSize: PAGE_SIZES.sharedLinks,
  });

  return (
    <div className={styles.page}>
      {/* Account name and token modal */}
      <Modal open={showPopup} onClose={handleClosePopup} maxWidth={480}>
        <ModalHeader title="Add Riot account" />
        <ModalBody>
          <div className={styles.fieldGap}>
            <TextField
              label="Account name"
              type="text"
              placeholder="For example: main, smurf, haakuro..."
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
            />
            <div className={styles.helperText}>
              Optional — leave it blank to use the Riot account name
            </div>
          </div>

          <div className={styles.fieldGap}>
            <TextField
              label="Riot Token"
              type="text"
              placeholder="Paste the complete Riot authentication URL"
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
              🔐 Sign in to Riot Games
            </TacticalButton>
            <div className={styles.helperText} style={{ maxWidth: 300, margin: '12px auto 0' }}>
              Sign in, then copy the complete URL from the browser and paste it above.
            </div>
          </div>

          {addStatus && (
            <div className={`${styles.statusMessage} ${addStatus.includes('successfully') ? styles.statusOk : styles.statusError}`}>
              {addStatus}
            </div>
          )}

          <div className={styles.modalActions}>
            <TacticalButton variant="ghost" onClick={handleClosePopup}>Cancel</TacticalButton>
            <TacticalButton onClick={handleSaveToken} disabled={addLoading}>
              {addLoading && <span className={styles.spinnerSm} />}
              {addLoading ? 'Adding account...' : 'Save'}
            </TacticalButton>
          </div>
        </ModalBody>
      </Modal>

      {/* Linked Riot accounts */}
      <div>
        <div className={styles.accountsHeader}>
          <h1 className={styles.accountsTitle}>Your accounts</h1>
          <TacticalButton onClick={handleOpenPopup}>+ Add account</TacticalButton>
        </div>

        {/* Filters */}
        {!loadingAccounts && riotAccounts.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div className={styles.topBar}>
              <div className={styles.searchWrap}>
                <SearchInput
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                onClick={() => setFiltersOpen(o => !o)}
                className={`${styles.filtersToggle} ${(filtersOpen || sortBy || groupByUser) ? styles.filtersToggleActive : ''}`}
              >
                ⚙ Filters
                <span className={`${styles.filtersToggleCaret} ${filtersOpen ? styles.filtersToggleCaretOpen : ''}`}>▼</span>
              </button>
            </div>

            {/* Expandable filter panel */}
            {filtersOpen && (
              <div className={styles.filtersPanel}>
                <div className={styles.filterRow}>
                  <span className={styles.filterRowLabel}>Grouping</span>
                  <button
                    onClick={() => setGroupByUser(g => !g)}
                    className={`${styles.chip} ${groupByUser ? styles.chipActive : ''}`}
                  >
                    ⇅ Group matching accounts
                  </button>
                </div>

                <div className={styles.filterDivider} />

                <div className={styles.filterRow}>
                  <span className={styles.filterRowLabel}>Sort by</span>
                  {[
                    { key: 'radBuddies', label: 'Rad Buddies' },
                    { key: 'vp',         label: 'VP spent' },
                    { key: 'lastUpdate', label: 'Last updated' },
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

        {/* Shared links panel */}
        {!loadingAccounts && riotAccounts.length > 0 && (() => {
          const LIMIT = 30;
          return (
            <div className={styles.sharesSection}>
              <button className={styles.sharesToggle} onClick={() => setShowSharesPanel(o => !o)}>
                <span className={styles.sharesToggleLabel}>🔗 Shared links</span>
                <span className={`${styles.sharesCount} ${sharedAccounts.length >= LIMIT ? styles.sharesCountFull : ''}`}>
                  {sharedAccounts.length}/{LIMIT}
                </span>
                <span className={styles.sharesCaret}>{showSharesPanel ? '▲' : '▼'}</span>
              </button>

              {showSharesPanel && (
                <div id="shared-links-panel" className={styles.sharesPanel}>
                  {sharedAccounts.length === 0 ? (
                    <div className={styles.sharesEmpty}>
                      You do not have any active links. Select "Share" on an account to create one.
                    </div>
                  ) : (
                    <>
                      {sharedLinksPagination.items.map((acc) => {
                        const riotId = acc.userInfo?.acct?.game_name
                          ? `${acc.userInfo.acct.game_name}#${acc.userInfo.acct.tag_line}`
                          : null;
                        const shareUrl = `${window.location.origin}/share/${acc.puuid}`;
                        const sharedDate = acc.sharedAt
                          ? new Date(acc.sharedAt).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
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
                              {justCopied ? '✓ Copied' : '⎘ Copy'}
                            </span>
                          </button>

                          <div className={styles.shareDate}>{sharedDate}</div>

                          <button className={styles.shareRevoke} onClick={() => handleRevokeShare(acc.puuid)}>
                            Revoke
                          </button>
                          </div>
                        );
                      })}
                      <Pagination
                        {...sharedLinksPagination}
                        onPageChange={sharedLinksPagination.setPage}
                        itemLabel="shared links"
                        scrollTargetId="shared-links-panel"
                      />
                    </>
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
                {riotAccounts.length === 0 ? 'No Riot accounts linked yet.' : 'No results'}
              </div>
              {riotAccounts.length === 0 && (
                <TacticalButton onClick={handleOpenPopup}>Add account</TacticalButton>
              )}
            </div>
          ) : (
            <div className={styles.accountsContainer}>
              <div id="accounts-grid" className={styles.grid}>
                {accountsPagination.items.map((acc, idx) => {
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
                        aria-label={`Open account ${acc.name}`}
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
                          Last updated: {formatLastUpdated(acc)}
                        </div>

                        <div className={styles.cardStats}>
                          <div className={styles.statBox}>
                            <div className={styles.statLabel}>VP spent</div>
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
                              ? '✓ Link copied'
                              : sharingIdx === idx
                                ? '⏳ Generating...'
                                : 'Share'}
                          </button>
                          <button
                            className={styles.cardActionBtn}
                            onClick={e => { e.stopPropagation(); setAccountToUpdate(acc); setShowUpdateModal(true); setUpdateToken(''); setUpdateStatus(''); }}
                          >
                            Update
                          </button>
                          <button
                            className={`${styles.cardActionBtn} ${styles.cardActionDanger}`}
                            onClick={e => { e.stopPropagation(); setAccountToDelete(acc); setDeleteStep(1); setDeleteLoading(false); setShowDeleteModal(true); }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
              <Pagination
                {...accountsPagination}
                onPageChange={accountsPagination.setPage}
                itemLabel="accounts"
                scrollTargetId="accounts-grid"
              />
            </div>
          )
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal open={showDeleteModal && !!accountToDelete} onClose={() => !deleteLoading && setShowDeleteModal(false)} maxWidth={420}>
        {deleteLoading ? (
          <div className={styles.deleteLoadingWrap}>
            <div className={styles.spinnerOuter}>
              <div className={styles.spinnerRing} />
              <div className={styles.spinnerRingInner} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--vi-white)', marginBottom: 6 }}>Deleting account...</div>
              <div style={{ fontSize: 13, color: 'rgba(236,232,225,0.5)' }}>This may take a few seconds</div>
            </div>
          </div>
        ) : deleteStep === 1 ? (
          <>
            <ModalHeader title="Delete account" subtitle="This action cannot be undone" danger />
            <ModalBody>
              <div className={styles.deleteAccountBox}>
                <div className={styles.deleteAccountLabel}>Account to delete</div>
                <div className={styles.deleteAccountName}>{accountToDelete?.name}</div>
                {accountToDelete?.userInfo?.acct?.game_name && (
                  <div style={{ fontSize: 13, color: 'rgba(236,232,225,0.6)', marginTop: 2 }}>
                    {accountToDelete.userInfo.acct.game_name}#{accountToDelete.userInfo.acct.tag_line}
                  </div>
                )}
              </div>
              <div className={styles.modalActions}>
                <TacticalButton variant="ghost" fullWidth onClick={() => setShowDeleteModal(false)}>Cancel</TacticalButton>
                <TacticalButton variant="danger" fullWidth onClick={() => setDeleteStep(2)}>Delete →</TacticalButton>
              </div>
            </ModalBody>
          </>
        ) : (
          <>
            <ModalHeader title="⚠️ Are you sure?" subtitle={<>The account <b>{accountToDelete?.name}</b> and all of its data will be permanently deleted.</>} danger />
            <ModalBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <TacticalButton variant="danger" fullWidth onClick={handleDeleteAccount}>
                  Yes, delete permanently
                </TacticalButton>
                <TacticalButton variant="ghost" fullWidth onClick={() => setDeleteStep(1)}>
                  ← Back
                </TacticalButton>
              </div>
            </ModalBody>
          </>
        )}
      </Modal>

      {/* Account update modal */}
      <Modal open={showUpdateModal && !!accountToUpdate} onClose={() => setShowUpdateModal(false)} maxWidth={480}>
        <ModalHeader title="Update Riot account" />
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
              placeholder="Paste the new complete Riot authentication URL"
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
              🔐 Get Riot token
            </TacticalButton>
            <div className={styles.helperText} style={{ maxWidth: 300, margin: '12px auto 0' }}>
              Sign in, then copy the complete URL from the browser and paste it above.
            </div>
          </div>

          {updateStatus && <div className={`${styles.statusMessage} ${styles.statusError}`}>{updateStatus}</div>}

          <div className={styles.modalActions}>
            <TacticalButton variant="ghost" onClick={() => setShowUpdateModal(false)}>Cancel</TacticalButton>
            <TacticalButton onClick={handleUpdateAccount}>Update account</TacticalButton>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
