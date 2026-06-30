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
      setSkinsError('Falta el token de Riot.');
      setSkinsLoading(false);
      return;
    }
    try {
      // 1. Obtener los skins del backend
      const res = await fetch(`${API_BASE}/api/auth/riot/skins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riotToken: token })
      });
      const data = await res.json();
      if (!data.success) {
        setSkinsError('No se pudieron obtener los skins.');
        setSkinsLoading(false);
        return;
      }
      // 2. Obtener detalles de los skins
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
        console.log('🔍 [AllSkins] Datos de skins recibidos:', detailsData.skinLevels);
        // Buscar específicamente el skin VCT LOCK//IN Misericórdia
        const vctSkin = detailsData.skinLevels.find(skin => skin && skin.displayName === 'VCT LOCK//IN Misericórdia');
        if (vctSkin) {
          console.log('🎯 [AllSkins] Skin VCT encontrado:', vctSkin);
          console.log('💰 [AllSkins] Precio personalizado:', vctSkin.customPrice);
        }
        setDetailedSkins(detailsData.skinLevels);
      }
    } catch (e) {
      setSkinsError('Error obteniendo skins.');
      console.error(e);
    }
    setSkinsLoading(false);
  };

  // Ejecutar fetchSkins al montar el componente
  useEffect(() => {
    fetchSkins();
    // eslint-disable-next-line
  }, []);

  return (
    <div>
      {/* Botón eliminado */}
      {skinsLoading && <div style={{ color: '#fff', textAlign: 'center' }}>Cargando...</div>}
      {skinsError && <div style={{ color: '#ff4655', textAlign: 'center' }}>{skinsError}</div>}
      {detailedSkins.length > 0 && (
        <div style={{ margin: '40px auto', maxWidth: 900 }}>
          <h2 style={{ color: '#ff4655', textAlign: 'center', marginBottom: 24 }}>Todos tus Skins</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center' }}>
            {/* Agrupar por skin base y mostrar solo el primer nivel con imagen */}
            {Object.values(
              detailedSkins.reduce((acc, skin) => {
                const baseName = skin.displayName.replace(/ Level \d+$/, '').trim();
                // Inicializar el array de niveles si no existe
                if (!acc[baseName] && skin.displayIcon) {
                  acc[baseName] = { ...skin, _niveles: [1] };
                }
                // Agregar el nivel correspondiente si es un nivel superior
                if (skin.displayName.match(/ Level (\d+)$/)) {
                  const lvl = parseInt(skin.displayName.match(/ Level (\d+)$/)[1], 10);
                  if (acc[baseName] && !acc[baseName]._niveles.includes(lvl)) {
                    acc[baseName]._niveles.push(lvl);
                  }
                }
                // Preservar precio personalizado si existe en cualquier nivel
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
                  Mejoras: {skin._niveles.sort((a,b)=>a-b).join(', ')}
                </div>
                {/* Mostrar precio personalizado si está disponible */}
                {skin.customPrice && (
                  <div style={{ color: '#ff4655', fontWeight: 'bold', fontSize: 14, marginTop: 8, padding: '4px 8px', background: '#1a1a1a', borderRadius: 6 }}>
                    {skin.priceDisplayName || `${skin.customPrice} VP`}
                  </div>
                )}
                {/* Debug temporal - mostrar si es el skin VCT */}
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