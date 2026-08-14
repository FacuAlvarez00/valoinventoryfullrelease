import React, { useMemo, useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import LoadingScreen from '../ui/LoadingScreen';
import { calcAccountStats } from '../../utils/pricing';
import styles from './InventoryDetails.module.css';

const DEFAULT_CARD_ART = 'https://media.valorant-api.com/playercards/9fb348bc-41a0-91ad-8a3e-818035c4e561/wideart.png';
const NO_TITLE_UUID = '00000000-0000-0000-0000-000000000000';

export default function InventoryDetails() {
  const { riotAccount, loading, error, catalog, weaponSkins } = useInventory();
  const [copiedUuid, setCopiedUuid] = useState(false);

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
                <div className={styles.cardHeaderMeta}>Last updated: {formatDate(riotAccount.lastUpdated)}</div>
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

          <div className={styles.sidePanel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>PENALTIES</h3>
            </div>
            <p className={styles.panelEmpty}>Penalty tracking isn't available yet.</p>
          </div>

          <div className={styles.sidePanel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>RANKS</h3>
            </div>
            <p className={styles.panelEmpty}>Rank tracking isn't available yet.</p>
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
      </div>
    </>
  );
}
