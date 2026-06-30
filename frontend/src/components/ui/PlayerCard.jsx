import React, { useEffect, useState } from 'react';

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
    return (
      <div style={{
        width: 200,
        height: 340,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
        textAlign: 'center',
        padding: 16
      }}>
        No hay datos de identidad
      </div>
    );
  }

  return (
    <div style={{
      width: 200,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      borderRadius: 4,
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      border: '1px solid rgba(255,255,255,0.12)',
    }}>
      {/* Account level badge */}
      {accountLevel !== null && (
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          textAlign: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: 1,
          padding: '4px 0',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          ◆ {accountLevel}
        </div>
      )}
      {/* Card art - tall portrait */}
      <div style={{ position: 'relative', lineHeight: 0 }}>
        {card ? (
          <img
            src={card.tallArt || card.largeArt}
            alt={card.displayName}
            style={{ width: '100%', display: 'block', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: 300, background: 'rgba(255,255,255,0.05)' }} />
        )}
      </div>
      {/* Player name bar */}
      <div style={{
        background: '#c8a84b',
        padding: '8px 12px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', letterSpacing: 0.5 }}>
          {nickname || name}
        </div>
        {title?.titleText && (
          <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.6)', marginTop: 2 }}>
            {title.titleText}
          </div>
        )}
      </div>
    </div>
  );
}
