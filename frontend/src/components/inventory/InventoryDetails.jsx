import React, { useEffect, useMemo, useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../ui/LoadingScreen';
import { calcAccountStats } from '../../utils/pricing';
import { buildRankHistory, buildMatchList } from '../../utils/ranks';
import MatchCard from './MatchCard';
import MatchesModal from './MatchesModal';
import RankRow from './RankRow';
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
  const { riotAccount, loading, error, catalog, weaponSkins } = useInventory();
  const { makeAuthenticatedRequest } = useAuth();
  const [copiedUuid, setCopiedUuid] = useState(false);
  const [matchesModalOpen, setMatchesModalOpen] = useState(false);

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

  // Live rank + recent matches, via the shared harvester session (see
  // backend/services/riotHarvester.js) — no per-account re-login needed,
  // unlike the rest of this account's data (skins/loadout/etc, still only
  // refreshed through the manual flow below). Falls back to the snapshot
  // saved at the last add/refresh if the harvester session itself is down
  // (needsHarvesterLogin) or this account was never refreshed since the
  // harvester shipped.
  const [liveRank, setLiveRank] = useState(null);
  const [liveRankState, setLiveRankState] = useState('idle'); // 'idle' | 'loading' | 'live' | 'unavailable'

  useEffect(() => {
    if (!riotAccount?.puuid) return;
    let cancelled = false;
    setLiveRankState('loading');
    makeAuthenticatedRequest(`${API_BASE}/api/auth/riot/account/${riotAccount.puuid}/live`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        if (data.success) {
          setLiveRank(data.rank);
          setLiveRankState('live');
        } else {
          setLiveRankState('unavailable');
        }
      })
      .catch(() => {
        if (!cancelled) setLiveRankState('unavailable');
      });
    return () => { cancelled = true; };
  }, [riotAccount?.puuid]);

  // Current rank (most recent act) + recent competitive match list
  const effectiveRank = liveRank || riotAccount?.rank;
  const rankHistory = useMemo(
    () => buildRankHistory(effectiveRank, catalog),
    [effectiveRank, catalog]
  );
  const currentRank = rankHistory[0] || null;
  const matchList = useMemo(
    () => buildMatchList(effectiveRank, catalog),
    [effectiveRank, catalog]
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

  // The equipped title isn't always in riotAccount.titles (the account's
  // owned/purchased entitlements) — some equipped titles are Riot-granted
  // defaults with no explicit entitlement record, confirmed live on a real
  // account (title equipped, 55 unique owned titles, none matching). Falls
  // back to the public catalog for those.
  const [equippedTitle, setEquippedTitle] = useState(null);
  useEffect(() => {
    const titleId = identity?.PlayerTitleID;
    if (!titleId || titleId === NO_TITLE_UUID) {
      setEquippedTitle(null);
      return;
    }
    const owned = riotAccount?.titles?.find(t => t.ItemID === titleId);
    if (owned) {
      setEquippedTitle(owned);
      return;
    }
    let cancelled = false;
    fetch(`https://valorant-api.com/v1/playertitles/${titleId}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data?.data) {
          setEquippedTitle({ ItemID: titleId, displayName: data.data.displayName, titleText: data.data.titleText });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [identity, riotAccount?.titles]);

  // riotAccount.accountLevel comes from Riot's own account-xp/v1 (see
  // RiotService.getAccountXP) and is the reliable source — confirmed live
  // that identity.AccountLevel from the loadout is always 0 with
  // HideAccountLevel always true regardless of the account's real privacy
  // setting, so it's kept only as a defensive fallback, not the primary one.
  const accountLevel = riotAccount?.accountLevel > 0
    ? riotAccount.accountLevel
    : (identity && !identity.HideAccountLevel && identity.AccountLevel > 0 ? identity.AccountLevel : null);

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
                </div>
              </div>

              <div className={styles.grid}>
                {/* Left Column */}
                <div className={styles.col}>
                  <div className={styles.row}>
                    <span className={styles.rowLabel}>Riot ID:</span>
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

          <div className={styles.rankCol}>
            <div className={styles.sidePanel}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>COMPETITIVE HISTORY</h3>
                {liveRankState === 'live' && <span className={styles.liveBadge}>● Live</span>}
                {liveRankState === 'unavailable' && riotAccount?.rank && (
                  <span className={styles.staleBadge} title="Couldn't reach the harvester session — showing the last synced snapshot">Last synced</span>
                )}
              </div>

              {!currentRank ? (
                <p className={styles.panelEmpty}>No competitive history found for this account.</p>
              ) : (
                <div className={styles.rankHistoryList}>
                  {rankHistory.map((r, idx) => (
                    <RankRow key={r.seasonId} rank={r} current={idx === 0} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.rightCol}>
            <div className={`${styles.sidePanel} ${styles.sidePanelHistory}`}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>RECENT MATCHES</h3>
                {matchList.length > 0 && <span className={styles.cardHeaderMeta}>{matchList.length} shown</span>}
              </div>

              {matchList.length === 0 ? (
                <p className={styles.panelEmpty}>No recent match data found for this account.</p>
              ) : (
                <>
                  <div className={styles.matchList}>
                    {matchList.map(m => <MatchCard key={m.matchId} match={m} />)}
                  </div>
                  <button
                    type="button"
                    className={styles.showMoreBtn}
                    onClick={() => setMatchesModalOpen(true)}
                  >
                    Show more
                  </button>
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

        <MatchesModal
          open={matchesModalOpen}
          onClose={() => setMatchesModalOpen(false)}
          puuid={riotAccount?.puuid}
          initialMatches={matchList}
        />
      </div>
    </>
  );
}
