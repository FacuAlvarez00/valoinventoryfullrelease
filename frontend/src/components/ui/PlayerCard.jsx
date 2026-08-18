import React, { useEffect, useState } from 'react';
import styles from './PlayerCard.module.css';

// `accountLevel` comes resolved from the caller (backend-provided, straight
// from Riot's account-xp endpoint — see RiotService.getAccountXP). This used
// to be fetched live from a HenrikDev proxy via a relative fetch that never
// even reached the backend (confirmed bug).
export default function PlayerCard({ identity, name, puuid, nickname, accountLevel }) {
  const [card, setCard] = useState(null);
  const [title, setTitle] = useState(null);

  useEffect(() => {
    if (!identity || !identity.PlayerCardID || !identity.PlayerTitleID) return;
    fetch('https://valorant-api.com/v1/playercards/' + identity.PlayerCardID)
      .then(res => res.json())
      .then(data => setCard(data.data))
      .catch(() => setCard(null));
    fetch('https://valorant-api.com/v1/playertitles/' + identity.PlayerTitleID)
      .then(res => res.json())
      .then(data => setTitle(data.data))
      .catch(() => setTitle(null));
  }, [identity]);

  if (!identity || !identity.PlayerCardID || !identity.PlayerTitleID) {
    return <div className={styles.empty}>No identity data is available.</div>;
  }

  return (
    <div className={styles.card}>
      {/* Account level badge */}
      {accountLevel != null && (
        <div className={styles.levelBadge}>◆ {accountLevel}</div>
      )}
      {/* Card art - tall portrait */}
      <div className={styles.artWrap}>
        {card ? (
          <img src={card.tallArt || card.largeArt} alt={card.displayName} className={styles.art} />
        ) : (
          <div className={styles.artPlaceholder} />
        )}
      </div>
      {/* Player name bar */}
      <div className={styles.nameBar}>
        <div className={styles.name}>{nickname || name}</div>
        {title?.titleText && <div className={styles.title}>{title.titleText}</div>}
      </div>
    </div>
  );
}
