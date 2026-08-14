import React, { useState, useEffect } from 'react';
const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://valoinventory-1.onrender.com";

export default function AllSkins() {
  const [detailedSkins, setDetailedSkins] = useState([]);
  const [skinsLoading, setSkinsLoading] = useState(false);
  const [skinsError, setSkinsError] = useState('');

  const fetchSkins = async () => {
    setSkinsLoading(true);
    setSkinsError('');
    setDetailedSkins([]);
    const token = localStorage.getItem('riot_token');
    if (!token) {
      setSkinsError('The Riot token is missing.');
      setSkinsLoading(false);
      return;
    }
    try {
      // Fetch skins from the backend
      const res = await fetch(`${API_BASE}/api/auth/riot/skins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riotToken: token })
      });
      const data = await res.json();
      if (!data.success) {
        setSkinsError('Skins could not be loaded.');
        setSkinsLoading(false);
        return;
      }
      // Fetch skin details
      const itemIDs = (data.skins.Entitlements || []).map(s => s.ItemID);
      if (itemIDs.length === 0) {
        setSkinsLoading(false);
        return;
      }
      const detailsRes = await fetch(`${API_BASE}/api/auth/riot/skins/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIDs })
      });
      const detailsData = await detailsRes.json();
      if (detailsData.success) {
        console.log('🔍 [AllSkins] Skin data received:', detailsData.skinLevels);
        // Check the custom price for the VCT LOCK//IN skin
        const vctSkin = detailsData.skinLevels.find(skin => skin && skin.displayName === 'VCT LOCK//IN Misericórdia');
        if (vctSkin) {
          console.log('🎯 [AllSkins] VCT skin found:', vctSkin);
          console.log('💰 [AllSkins] Custom price:', vctSkin.customPrice);
        }
        setDetailedSkins(detailsData.skinLevels);
      }
    } catch (e) {
      setSkinsError('Failed to load skins.');
      console.error(e);
    }
    setSkinsLoading(false);
  };

  // Fetch skins when the component mounts
  useEffect(() => {
    fetchSkins();
    // eslint-disable-next-line
  }, []);

  return (
    <div>
      {skinsLoading && <div style={{ color: '#fff', textAlign: 'center' }}>Loading...</div>}
      {skinsError && <div style={{ color: '#ff4655', textAlign: 'center' }}>{skinsError}</div>}
      {detailedSkins.length > 0 && (
        <div style={{ margin: '40px auto', maxWidth: 900 }}>
          <h2 style={{ color: '#ff4655', textAlign: 'center', marginBottom: 24 }}>All your skins</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center' }}>
            {/* Group by base skin and show the first level with an image */}
            {Object.values(
              detailedSkins.reduce((acc, skin) => {
                const baseName = skin.displayName.replace(/ Level \d+$/, '').trim();
                // Initialize the level array when needed
                if (!acc[baseName] && skin.displayIcon) {
                  acc[baseName] = { ...skin, _levels: [1] };
                }
                // Add each additional level once
                if (skin.displayName.match(/ Level (\d+)$/)) {
                  const lvl = parseInt(skin.displayName.match(/ Level (\d+)$/)[1], 10);
                  if (acc[baseName] && !acc[baseName]._levels.includes(lvl)) {
                    acc[baseName]._levels.push(lvl);
                  }
                }
                // Preserve a custom price found at any level
                if (skin.customPrice && acc[baseName]) {
                  acc[baseName].customPrice = skin.customPrice;
                  acc[baseName].priceDisplayName = skin.priceDisplayName;
                }
                return acc;
              }, {})
            ).map(skin => (
              <div key={skin.uuid} style={{ background: '#222b3a', borderRadius: 12, padding: 16, minWidth: 200, maxWidth: 220, textAlign: 'center', boxShadow: '0 2px 12px #0007' }}>
                <img src={skin.displayIcon} alt={skin.displayName} style={{ width: '100%', height: 80, objectFit: 'contain', marginBottom: 12 }} />
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{skin.displayName.replace(/ Level \d+$/, '').trim()}</div>
                <div style={{ color: '#ffb347', fontWeight: 'bold', fontSize: 13, marginTop: 4 }}>
                  Upgrades: {skin._levels.sort((a,b)=>a-b).join(', ')}
                </div>
                {/* Custom price */}
                {skin.customPrice && (
                  <div style={{ color: '#ff4655', fontWeight: 'bold', fontSize: 14, marginTop: 8, padding: '4px 8px', background: '#1a1a1a', borderRadius: 6 }}>
                    {skin.priceDisplayName || `${skin.customPrice} VP`}
                  </div>
                )}
                {/* Temporary VCT pricing diagnostic */}
                {skin.displayName && skin.displayName.includes('VCT LOCK//IN') && (
                  <div style={{ color: '#00ff00', fontSize: 10, marginTop: 4 }}>
                    DEBUG: customPrice={skin.customPrice ? skin.customPrice : 'NO'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
