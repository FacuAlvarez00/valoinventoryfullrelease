import React, { useMemo, useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../ui/LoadingScreen';
import { Modal, ModalHeader, ModalBody, TextField, TacticalButton } from '../ui/kit';
import { calcAccountStats } from '../../utils/pricing';
import { buildRankHistory, buildMatchList, formatMatchDate, formatMatchDuration } from '../../utils/ranks';
import { parseRiotAuthInput } from '../../utils/riotAuth';
import styles from './InventoryDetails.module.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://valoinventory-1.onrender.com';
const DEFAULT_CARD_ART = 'https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png';
const NO_TITLE_UUID = '00000000-0000-0000-0000-000000000000';

// Riot's own docs type the penalties array as `unknown[]` — no documented
// per-entry schema — so instead of guessing field names, each entry is
// rendered generically: humanize whatever keys actually show up.
function humanizePenaltyKey(key) {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
}

function formatPenaltyValue(key, value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  // Heuristic: a number in a time/date/expiry-ish field that's in
  // epoch-millis range is almost certainly a timestamp.
  if (typeof value === 'number' && /time|date|expir/i.test(key) && value > 1e12) {
    return new Date(value).toLocaleString();
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function InventoryDetails() {
  const { riotAccount, loading, error, catalog, weaponSkins, refreshAccount } = useInventory();
  const { makeAuthenticatedRequest } = useAuth();
  const [copiedUuid, setCopiedUuid] = useState(false);

  // Re-fetch this account from Riot in place (rank/matches included) —
  // needs a fresh login since Riot's web token is short-lived and there's
  // no refresh_token in this flow, same paste-the-URL step as adding an
  // account on Home.
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [refreshInput, setRefreshInput] = useState({ riotToken: '', riotUrl: '' });
  const [refreshStatus, setRefreshStatus] = useState('');
  const [refreshLoading, setRefreshLoading] = useState(false);

  const handleRefreshAccount = async () => {
    if (!riotAccount?.puuid || !refreshInput.riotToken) return;
    if (!refreshInput.riotUrl || !refreshInput.riotUrl.includes('playvalorant.com')) {
      setRefreshStatus('Paste the complete URL containing the ID token.');
      return;
    }
    setRefreshLoading(true);
    setRefreshStatus('');
    try {
      const res = await makeAuthenticatedRequest(`${API_BASE}/api/auth/riot/account/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puuid: riotAccount.puuid, riotToken: refreshInput.riotToken, url: refreshInput.riotUrl })
      });
      const data = await res.json();
      if (data.success) {
        setShowRefreshModal(false);
        setRefreshInput({ riotToken: '', riotUrl: '' });
        await refreshAccount(riotAccount.puuid);
      } else {
        setRefreshStatus(data.message || 'Failed to refresh the account.');
      }
    } catch (e) {
      setRefreshStatus('A network error occurred while refreshing the account.');
    }
    setRefreshLoading(false);
  };

  const handleCopyUuid = () => {
    if (!riotAccount?.puuid) return;
    navigator.clipboard.writeText(riotAccount.puuid);
    setCopiedUuid(true);
    setTimeout(() => setCopiedUuid(false), 2000);
  };

  // Calculate total VP spent with the shared pricing helper
  const totalVPSpent = useMemo(() => {
    if (!riotAccount) return 0;
    return calcAccountStats(riotAccount, weaponSkins, catalog).totalVP;
  }, [riotAccount, catalog, weaponSkins]);

  // Current rank (most recent act) + recent competitive match list
  const rankHistory = useMemo(
    () => buildRankHistory(riotAccount?.rank, catalog),
    [riotAccount?.rank, catalog]
  );
  const currentRank = rankHistory[0] || null;
  const matchList = useMemo(
    () => buildMatchList(riotAccount?.rank, catalog),
    [riotAccount?.rank, catalog]
  );

  // Count Radiant and Immortal buddies
  const radiantBuddies = useMemo(() => {
    if (!riotAccount?.buddies || riotAccount.buddies.length === 0) return 0;
    return riotAccount.buddies.filter(buddy =>
      buddy.displayName && buddy.displayName.toLowerCase().includes('radiant buddy')
    ).length;
  }, [riotAccount?.buddies]);

  const immortalBuddies = useMemo(() => {
    if (!riotAccount?.buddies || riotAccount.buddies.length === 0) return 0;
    return riotAccount.buddies.filter(buddy =>
      buddy.displayName &&
      buddy.displayName.toLowerCase().includes('immortal buddy') &&
      !buddy.displayName.toLowerCase().includes('immortal rose buddy')
    ).length;
  }, [riotAccount?.buddies]);

  // Resolve the equipped player card, title, and level from the Riot loadout
  const identity = riotAccount?.loadout?.Identity;

  const equippedCard = useMemo(() => {
    const cardId = identity?.PlayerCardID;
    if (!cardId || !riotAccount?.cards?.length) return null;
    return riotAccount.cards.find(c => c.ItemID === cardId) || null;
  }, [identity, riotAccount?.cards]);

  const bannerArt = equippedCard?.wideArt || equippedCard?.largeArt || DEFAULT_CARD_ART;

  const equippedTitle = useMemo(() => {
    const titleId = identity?.PlayerTitleID;
    if (!titleId || titleId === NO_TITLE_UUID || !riotAccount?.titles?.length) return null;
    return riotAccount.titles.find(t => t.ItemID === titleId) || null;
  }, [identity, riotAccount?.titles]);

  const accountLevel = identity && !identity.HideAccountLevel && identity.AccountLevel > 0
    ? identity.AccountLevel
    : null;

  const riotId = riotAccount?.userInfo?.acct
    ? `${riotAccount.userInfo.acct.game_name}#${riotAccount.userInfo.acct.tag_line}`
    : riotAccount?.nickname || null;

  // Format timestamps for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Resolve the display name for a Riot region
  const getRegionName = (affinity) => {
    const regions = {
      'am': 'North America',
      'ap': 'Asia Pacific',
      'br': 'Brazil',
      'eu': 'Europe',
      'kr': 'Korea',
      'latam': 'Latin America',
      'na': 'North America'
    };
    return regions[affinity] || affinity?.toUpperCase() || 'Unknown';
  };

  // Resolve the display name for a country code
  const getCountryName = (countryCode) => {
    const countries = {
      'arg': 'Argentina',
      'us': 'United States',
      'br': 'Brazil',
      'mx': 'Mexico',
      'cl': 'Chile',
      'co': 'Colombia',
      'pe': 'Peru',
      'uy': 'Uruguay',
      'py': 'Paraguay',
      'bo': 'Bolivia',
      'ec': 'Ecuador',
      've': 'Venezuela',
      'ca': 'Canada'
    };
    return countries[countryCode] || countryCode?.toUpperCase() || 'N/A';
  };

  return (
    <>
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <div>
            <div className={styles.headerEyebrow}>Account</div>
            <h2 className={styles.pageTitle}>Inventory Details</h2>
          </div>
        </div>

        {loading && <LoadingScreen fullscreen={false} text="Loading account data..." />}

        {error && (
          <div className={styles.alertBox}>
            <h3 className={styles.alertTitle}>❌ Error</h3>
            <p className={styles.alertText}>{error}</p>
          </div>
        )}

        {!loading && !error && !riotAccount && (
          <div className={styles.alertBox}>
            <h3 className={styles.alertTitle}>⚠️ No Riot account</h3>
            <p className={styles.alertText}>
              No linked Riot account was found. Add an account from your profile to view its details.
            </p>
          </div>
        )}

        {riotAccount && riotAccount.userInfo && Object.keys(riotAccount.userInfo).length > 0 && (
          <div className={styles.detailsGrid}>
          <div className={styles.leftCol}>
            <div className={styles.banner}>
              <img src={bannerArt} alt="" className={styles.bannerImg} />
              <div className={styles.bannerOverlay} />
              <div className={styles.bannerName}>
                {riotAccount.name}
                {riotId && <span className={styles.bannerRiotId}>{riotId}</span>}
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardHeaderTitle}>ACCOUNT INFO</h3>
                <div className={styles.cardHeaderRight}>
                  <div className={styles.cardHeaderMeta}>Last updated: {formatDate(riotAccount.lastUpdated)}</div>
                  <button type="button" className={styles.refreshBtn} onClick={() => setShowRefreshModal(true)}>
                    ↻ Refresh
                  </button>
                </div>
              </div>

              <div className={styles.grid}>
                {/* Left Column */}
                <div className={styles.col}>
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>IGN:</span>
                    <span className={styles.rowValue}>{riotId || 'N/A'}</span>
                  </div>

                  <div className={styles.row}>
                    <span className={styles.rowLabel}>Title:</span>
                    <span className={styles.rowValue}>{equippedTitle?.displayName || 'N/A'}</span>
                  </div>

                  <div className={styles.row}>
                    <span className={styles.rowLabel}>Region:</span>
                    <span className={styles.rowValue}>
                      {riotAccount.regionInfo?.affinities?.live ? getRegionName(riotAccount.regionInfo.affinities.live) : getRegionName(riotAccount.userInfo.affinity?.pp)}
                    </span>
                  </div>

                  <div className={styles.row}>
                    <span className={styles.rowLabel}>Country:</span>
                    <span className={styles.rowValue}>{getCountryName(riotAccount.userInfo.country)}</span>
                  </div>
                </div>

                {/* Right Column */}
                <div className={styles.col}>
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>Level:</span>
                    <span className={styles.rowValue}>{accountLevel ?? 'N/A'}</span>
                  </div>

                  <div className={styles.row}>
                    <span className={styles.rowLabel}>Email Verified:</span>
                    <span className={riotAccount.userInfo.email_verified ? styles.rowValueOk : styles.rowValueBad}>
                      {riotAccount.userInfo.email_verified ? 'YES' : 'NO'}
                    </span>
                  </div>

                  <div className={styles.row}>
                    <span className={styles.rowLabel}>Phone Verified:</span>
                    <span className={riotAccount.userInfo.phone_number_verified ? styles.rowValueOk : styles.rowValueBad}>
                      {riotAccount.userInfo.phone_number_verified ? 'YES' : 'NO'}
                    </span>
                  </div>

                  <div className={styles.row}>
                    <span className={styles.rowLabel}>Registration Date:</span>
                    <span className={styles.rowValue}>{formatDate(riotAccount.userInfo.acct?.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className={styles.footerRow}>
                <div className={styles.row} style={{ border: 'none', padding: 0, flex: 1 }}>
                  <span className={styles.rowLabel}>Total Spent:</span>
                  <span className={styles.vpValue}>
                    {totalVPSpent.toLocaleString()}
                    <img src="/assets/icons/20px-White_Valorant_Points_VALORANT.png" alt="VP" style={{ width: 12, height: 12 }} />
                  </span>
                </div>
                <div className={styles.row} style={{ border: 'none', padding: 0, flex: 1 }}>
                  <span className={styles.rowLabel}>Radiant Buddies:</span>
                  <span className={styles.rowValueGold}>{radiantBuddies}</span>
                </div>
                <div className={styles.row} style={{ border: 'none', padding: 0, flex: 1 }}>
                  <span className={styles.rowLabel}>Immortal Buddies:</span>
                  <span className={styles.rowValueRed}>{immortalBuddies}</span>
                </div>
              </div>

              <div className={styles.footerRow}>
                <span className={styles.rowLabel}>UUID:</span>
                <div className={styles.uuidGroup}>
                  <span className={styles.uuidText}>{riotAccount.puuid}</span>
                  <button
                    onClick={handleCopyUuid}
                    className={`${styles.copyBtn} ${copiedUuid ? styles.copyBtnDone : ''}`}
                  >
                    {copiedUuid ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.rightCol}>
            <div className={`${styles.sidePanel} ${styles.sidePanelHistory}`}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>COMPETITIVE HISTORY</h3>
              </div>

              {!currentRank && matchList.length === 0 ? (
                <p className={styles.panelEmpty}>No competitive history found for this account.</p>
              ) : (
                <>
                  {currentRank && (
                    <div className={`${styles.rankRow} ${styles.rankRowCurrent}`}>
                      {currentRank.tierIcon ? (
                        <img src={currentRank.tierIcon} alt={currentRank.tierName} className={styles.rankIcon} />
                      ) : (
                        <div className={styles.rankIconPlaceholder} />
                      )}
                      <div className={styles.rankInfo}>
                        <div className={styles.rankSeason}>{currentRank.seasonLabel}</div>
                        <div className={styles.rankTier}>{currentRank.tierName} · {currentRank.rr} RR</div>
                      </div>
                      <div className={styles.rankStats}>
                        {currentRank.games != null && <span>{currentRank.wins}W / {currentRank.games}G</span>}
                        {currentRank.leaderboardRank > 0 && <span className={styles.rankLeaderboard}>#{currentRank.leaderboardRank}</span>}
                      </div>
                    </div>
                  )}

                  {matchList.length === 0 ? (
                    <p className={styles.panelEmpty}>No recent match data found for this account.</p>
                  ) : (
                    <div className={styles.matchList}>
                      <div className={styles.matchListHeader}>Recent matches ({matchList.length})</div>
                      {matchList.map(m => {
                        const duration = formatMatchDuration(m.durationSecs);
                        return (
                          <div key={m.matchId} className={styles.matchCard}>
                            <div className={styles.matchCardHeader}>
                              {m.won !== null && (
                                <span className={m.won ? styles.matchResultWin : styles.matchResultLoss}>
                                  {m.won ? 'WIN' : 'LOSS'}
                                </span>
                              )}
                              <span className={styles.matchMap}>{m.mapName}</span>
                              <span className={styles.matchScore}>
                                {m.teamRed?.roundsWon ?? '?'}<span className={styles.matchScoreSep}>-</span>{m.teamBlue?.roundsWon ?? '?'}
                              </span>
                            </div>
                            <div className={styles.matchCardMeta}>
                              <span>{formatMatchDate(m.date)}</span>
                              {duration && <span>{duration}</span>}
                            </div>
                            <div className={styles.matchCardStats}>
                              {m.agentIcon ? (
                                <img src={m.agentIcon} alt={m.agentName || ''} className={styles.matchAgentIcon} />
                              ) : (
                                <div className={styles.matchAgentPlaceholder} />
                              )}
                              <span className={styles.matchKda}>{m.kills}/{m.deaths}/{m.assists}</span>
                              <span className={styles.matchStat}>ACS <b>{m.acs}</b></span>
                              <span className={styles.matchStat}>ADR <b>{m.adr}</b></span>
                              <span className={styles.matchStat}>HS <b>{m.hsPercent}%</b></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className={styles.sidePanel}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>PENALTIES</h3>
              </div>
              {!riotAccount.penalties || riotAccount.penalties.length === 0 ? (
                <p className={styles.panelEmpty}>No active penalties or restrictions on this account.</p>
              ) : (
                <div className={styles.penaltyList}>
                  {riotAccount.penalties.map((p, idx) => (
                    <div key={idx} className={styles.penaltyCard}>
                      {Object.entries(p).map(([key, value]) => (
                        <div key={key} className={styles.penaltyRow}>
                          <span className={styles.penaltyKey}>{humanizePenaltyKey(key)}</span>
                          <span className={styles.penaltyValue}>{formatPenaltyValue(key, value)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </div>
        )}

        {riotAccount && (!riotAccount.userInfo || Object.keys(riotAccount.userInfo).length === 0) && (
          <div className={`${styles.alertBox} ${styles.alertBoxWarn}`}>
            <h3 className={`${styles.alertTitle} ${styles.alertTitleWarn}`}>⚠️ Missing user information</h3>
            <p className={styles.alertText}>
              The Riot account is linked, but its user information is unavailable.
              Refresh the account to retrieve the latest data.
            </p>
          </div>
        )}

        <Modal open={showRefreshModal} onClose={() => !refreshLoading && setShowRefreshModal(false)}>
          <ModalHeader
            title="Refresh account"
            subtitle="Riot's login token expires quickly, so this needs a fresh one each time."
          />
          <ModalBody>
            <TacticalButton
              as="a"
              variant="ghost"
              fullWidth
              href="https://auth.riotgames.com/authorize?redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1&scope=account%20openid"
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginBottom: 16 }}
            >
              1. Log in with Riot
            </TacticalButton>
            <TextField
              label="2. Paste the resulting URL here"
              type="text"
              placeholder="https://playvalorant.com/opt_in#access_token=..."
              value={refreshInput.riotUrl}
              onChange={e => setRefreshInput(parseRiotAuthInput(e.target.value))}
              onPaste={e => {
                setRefreshInput(parseRiotAuthInput(e.clipboardData.getData('text')));
                e.preventDefault();
              }}
            />
            {refreshStatus && <p className={styles.refreshStatus}>{refreshStatus}</p>}
            <TacticalButton
              fullWidth
              style={{ marginTop: 16 }}
              disabled={refreshLoading || !refreshInput.riotToken}
              onClick={handleRefreshAccount}
            >
              {refreshLoading ? 'Refreshing…' : 'Refresh account'}
            </TacticalButton>
          </ModalBody>
        </Modal>
      </div>
    </>
  );
}
