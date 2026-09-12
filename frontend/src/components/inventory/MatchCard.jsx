import React from 'react';
import { formatMatchDate, formatMatchDuration } from '../../utils/ranks';
import styles from './InventoryDetails.module.css';

// One competitive match — extracted from InventoryDetails so the same card
// can be reused in the "Show more" matches modal (see MatchesModal.jsx).
export default function MatchCard({ match: m }) {
  const duration = formatMatchDuration(m.durationSecs);
  return (
    <div className={styles.matchCard}>
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
        {m.queueLabel && <span className={styles.matchQueue}>{m.queueLabel}</span>}
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
}
