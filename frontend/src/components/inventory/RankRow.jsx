import React from 'react';
import styles from './InventoryDetails.module.css';

// One act's standing — every row in the Competitive History panel (Details)
// is the same shape, just with `current` toggling the highlighted styling
// for the most recent act.
export default function RankRow({ rank, current = false }) {
  return (
    <div className={`${styles.rankRow} ${current ? styles.rankRowCurrent : ''}`}>
      {rank.tierIcon ? (
        <img src={rank.tierIcon} alt={rank.tierName} className={styles.rankIcon} />
      ) : (
        <div className={styles.rankIconPlaceholder} />
      )}
      <div className={styles.rankInfo}>
        <div className={styles.rankSeason}>{rank.seasonLabel}</div>
        <div className={styles.rankTier}>{rank.tierName} · {rank.rr} RR</div>
      </div>
      <div className={styles.rankStats}>
        {rank.games != null && <span>{rank.wins}W / {rank.games}G</span>}
        {rank.leaderboardRank > 0 && <span className={styles.rankLeaderboard}>#{rank.leaderboardRank}</span>}
      </div>
    </div>
  );
}
