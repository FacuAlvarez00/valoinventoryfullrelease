import React, { useEffect, useState } from 'react';
import styles from './PlayerCard.module.css';

export default function PlayerCard({ identity, name, puuid, nickname }) {
  const [card, setCard] = useState(null);
  const [title, setTitle] = useState(null);
  const [accountLevel, setAccountLevel] = useState(null);

  let playerName = '';
  let playerTag = '';
  if (nickname && nickname.includes('#')) {
    [playerName, playerTag] = nickname.split('#');
  }

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
    if (playerName && playerTag) {
      fetch(`/api/account-level/${playerName}#${playerTag}`)
        .then(res => res.json())
        .then(data => setAccountLevel(data.account_level || null))
        .catch(() => setAccountLevel(null));
    }
  }, [identity, playerName, playerTag]);

  if (!identity || !identity.PlayerCardID || !identity.PlayerTitleID) {
    return <div className={styles.empty}>No hay datos de identidad</div>;
  }

  return (
    <div className={styles.card}>
      {/* Account level badge */}
      {accountLevel !== null && (
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
