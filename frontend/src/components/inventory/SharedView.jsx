import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://valoinventory-1.onrender.com';

const CHAMPIONS_MELEE = [
  'Champions 2021 Karambit','Champions 2022 Butterfly Knife',
  'Champions 2023 Kunai','Champions 2024 Blade','Champions 2025 Butterfly Knife',
];

function getSkinPrice(baseName, weaponSkins) {
  if (baseName === 'VCT LOCK//IN Misericórdia') return 5440;
  if (baseName === 'VCT 2026 Sigil') return 5350;
  if (baseName === 'XERØFANG Vandal') return 1775;
  if (baseName === 'Arcane Vandal') return 2175;
  if (baseName === 'Arcane Gauntlets') return 4350;
  if (CHAMPIONS_MELEE.includes(baseName)) return 5350;
  if (baseName.startsWith('Champions 202')) return 2675;
  if (/vct\d*\s+x\b/i.test(baseName)) return 2340;
  const found = weaponSkins.find(s => s.name === baseName);
  if (found?.price) {
    const p = Object.values(found.price)[0];
    if (p) return parseInt(p, 10);
  }
  return null;
}

function isGoldenSkin(baseName) {
  return baseName.startsWith('Champions 202') ||
    /vct\d*\s+x\b/i.test(baseName) ||
    baseName === 'VCT LOCK//IN Misericórdia' ||
    baseName === 'VCT 2026 Sigil' ||
    baseName === 'Arcane Vandal' || baseName === 'Arcane Gauntlets';
}

const SECTIONS = [
  { key: 'skins',      label: 'SKINS',       bg: '#1a2636' },
  { key: 'battlepass', label: 'BATTLEPASSES', bg: '#222b3a' },
  { key: 'buddies',    label: 'GUNBUDDIES',  bg: '#1a2636' },
  { key: 'cards',      label: 'CARDS',       bg: '#222b3a' },
  { key: 'sprays',     label: 'SPRAYS',      bg: '#1a2636' },
  { key: 'flex',       label: 'FLEX',        bg: '#222b3a' },
  { key: 'titles',     label: 'TITLES',      bg: '#222b3a' },
  { key: 'agents',     label: 'AGENTS',      bg: '#1a2636' },
];

export default function SharedView() {
  const { token } = useParams();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState({ skins: [], skinlevels: [], chromas: [] });
  const [weaponSkins, setWeaponSkins] = useState([]);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const accRes = await fetch(`${API_BASE}/api/auth/public/account/${token}`);
        const accData = await accRes.json();
        if (!accData.success) { setError(accData.message || 'Link inválido'); setLoading(false); return; }
        setAccount(accData.account);

        const [skinsRes, skinlevelsRes, chromasRes, wsRes] = await Promise.all([
          fetch('https://valorant-api.com/v1/weapons/skins'),
          fetch('https://valorant-api.com/v1/weapons/skinlevels'),
          fetch('https://valorant-api.com/v1/weapons/skinchromas'),
          fetch('https://vinfo-api.com/json/weaponSkins'),
        ]);
        const [skinsData, skinlevelsData, chromasData] = await Promise.all([
          skinsRes.json(), skinlevelsRes.json(), chromasRes.json(),
        ]);
        setCatalog({
          skins: skinsData.data || [],
          skinlevels: skinlevelsData.data || [],
          chromas: chromasData.data || [],
        });
        const wsData = await wsRes.json().catch(() => []);
        setWeaponSkins(Array.isArray(wsData) ? wsData : []);
      } catch {
        setError('Error cargando los datos.');
      }
      setLoading(false);
    };
    fetchAll();
  }, [token]);

  const skinsPorBase = useMemo(() => {
    if (!account || !catalog.skinlevels.length) return {};
    const map = {};
    account.skins.forEach(skin => {
      const lvl = catalog.skinlevels.find(s => s.uuid === skin.ItemID);
      if (!lvl) return;
      const base = lvl.displayName.split(' Level ')[0].trim();
      if (!map[base]) map[base] = [];
      map[base].push(lvl);
    });
    return map;
  }, [account, catalog.skinlevels]);

  const skinsOrdenadas = useMemo(() => {
    return Object.entries(skinsPorBase).sort((a, b) => {
      const pa = getSkinPrice(a[0], weaponSkins);
      const pb = getSkinPrice(b[0], weaponSkins);
      if (pa && pb) return pb - pa;
      if (pa) return -1;
      if (pb) return 1;
      return 0;
    });
  }, [skinsPorBase, weaponSkins]);

  const totalVPSkins = useMemo(() => {
    return Object.keys(skinsPorBase).reduce((acc, name) => acc + (getSkinPrice(name, weaponSkins) || 0), 0);
  }, [skinsPorBase, weaponSkins]);

  const totalVPBattlePasses = (account?.battlePasses?.length || 0) * 1000;
  const totalVP = totalVPSkins + totalVPBattlePasses;
  const totalFlex = 1 + (account?.flex?.Entitlements?.length || 0);

  const sections = useMemo(() => [
    { key: 'skins',      label: 'SKINS',       count: Object.keys(skinsPorBase).length, vpSpent: totalVPSkins,        bg: '#1a2636' },
    { key: 'battlepass', label: 'BATTLEPASSES', count: account?.battlePasses?.length || 0, vpSpent: totalVPBattlePasses, bg: '#222b3a' },
    { key: 'buddies',    label: 'GUNBUDDIES',  count: account?.buddies?.length || 0,       bg: '#1a2636' },
    { key: 'cards',      label: 'CARDS',       count: account?.cards?.length || 0,         bg: '#222b3a' },
    { key: 'sprays',     label: 'SPRAYS',      count: account?.sprays?.length || 0,        bg: '#1a2636' },
    { key: 'flex',       label: 'FLEX',        count: totalFlex,                           bg: '#222b3a' },
    { key: 'titles',     label: 'TITLES',      count: account?.titles?.length || 0,        bg: '#222b3a' },
    { key: 'agents',     label: 'AGENTS',      count: account?.agents?.length || 0,        bg: '#1a2636' },
  ], [account, skinsPorBase, totalVPSkins, totalVPBattlePasses, totalFlex]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f1923', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#ff4655', fontSize: 20, fontWeight: 'bold' }}>Cargando inventario...</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#0f1923', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: '#ff4655', fontSize: 24, fontWeight: 'bold' }}>Error: {error}</div>
      <div style={{ color: '#888', fontSize: 14 }}>El link puede ser inválido o haber expirado.</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0f1923', color: '#fff' }}>
      {/* Navbar */}
      <div style={{ background: 'rgba(15,25,35,0.97)', borderBottom: '2px solid #222b3a', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#ff4655,#ff6b7a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 'bold', color: '#fff' }}>
            {(account.nickname || account.name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>{account.nickname || account.name}</div>
            <div style={{ fontSize: 11, color: '#666' }}>
              Actualizado: {account.lastUpdated ? new Date(account.lastUpdated).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#ff4655', fontWeight: 'bold', letterSpacing: 2 }}>VALOINVENTORY</div>
      </div>

      {/* Dashboard */}
      <div style={{ padding: '32px 32px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ color: '#fff', fontWeight: 'bold', fontSize: 32, letterSpacing: 2, margin: 0 }}>INVENTORY</h2>
          <div style={{ background: '#ff4655', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 18, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
            Total Value: {totalVP.toLocaleString()}
            <img src="/assets/icons/20px-White_Valorant_Points_VALORANT.png" alt="VP" style={{ width: 16, height: 16, marginLeft: 4 }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 24 }}>
          {sections.map(sec => (
            <div
              key={sec.key}
              onClick={() => setActiveSection(activeSection === sec.key ? null : sec.key)}
              style={{
                background: sec.bg,
                borderRadius: 12,
                minHeight: 220,
                cursor: 'pointer',
                boxShadow: activeSection === sec.key ? '0 0 0 2px #ff4655' : '0 2px 12px #0007',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'box-shadow 0.15s',
              }}
            >
              {sec.vpSpent !== undefined && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: '#ff4655', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 14, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {sec.vpSpent.toLocaleString()}
                  <img src="/assets/icons/20px-White_Valorant_Points_VALORANT.png" alt="VP" style={{ width: 12, height: 12, marginLeft: 2 }} />
                </div>
              )}
              <div style={{ color: '#ff4655', fontWeight: 'bold', fontSize: 22, marginBottom: 8, letterSpacing: 1, textAlign: 'center' }}>{sec.label}</div>
              <div style={{ color: '#fff', fontSize: 32, fontWeight: 'bold' }}>{sec.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {activeSection && (
        <div style={{ padding: '8px 32px 32px' }}>
          <div style={{ borderTop: '1px solid #222b3a', paddingTop: 24 }}>

            {activeSection === 'skins' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
                {skinsOrdenadas.map(([baseName, skins], idx) => {
                  let skinBaseObj = catalog.skins.find(s => s.displayName === baseName);
                  if (!skinBaseObj) skinBaseObj = catalog.skins.find(s => s.displayName.toLowerCase().includes(baseName.toLowerCase()));
                  let imgSrc = skinBaseObj?.chromas?.[0]?.fullRender || skins.find(s => s.displayIcon)?.displayIcon || '';
                  const price = getSkinPrice(baseName, weaponSkins);
                  const golden = isGoldenSkin(baseName);
                  return (
                    <div key={idx} style={{
                      background: golden ? 'linear-gradient(135deg,#2a1e00 0%,#4a3200 50%,#2a1e00 100%)' : '#1a1a1a',
                      border: golden ? '1px solid #a07820' : '1px solid #333',
                      borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'space-between', height: 200, boxSizing: 'border-box', position: 'relative',
                    }}>
                      {price ? (
                        <div style={{ alignSelf: 'flex-end', background: '#ff4655', color: '#fff', fontWeight: 'bold', fontSize: 14, borderRadius: 6, padding: '2px 10px' }}>{price.toLocaleString()}</div>
                      ) : <div style={{ height: 22 }} />}
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                        {imgSrc && <img src={imgSrc} alt={baseName} style={{ maxWidth: '100%', maxHeight: 80, objectFit: 'contain' }} />}
                      </div>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: 12, textAlign: 'center', marginTop: 8 }}>{baseName}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeSection === 'battlepass' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {(account.battlePasses || []).map((bp, idx) => (
                  <div key={idx} style={{ background: '#1a2636', border: '1px solid #333', borderRadius: 8, padding: '10px 20px', color: '#fff', fontSize: 14 }}>
                    {bp.displayName || bp.ItemID || `Battle Pass ${idx + 1}`}
                  </div>
                ))}
                {!account.battlePasses?.length && <div style={{ color: '#666' }}>Sin battle passes</div>}
              </div>
            )}

            {activeSection === 'buddies' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 12 }}>
                {(account.buddies || []).map((buddy, idx) => (
                  <div key={idx} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    {buddy.displayIcon && <img src={buddy.displayIcon} alt={buddy.displayName} style={{ width: 56, height: 56, objectFit: 'contain' }} />}
                    <div style={{ fontSize: 11, color: '#ccc', textAlign: 'center' }}>{buddy.displayName || 'Buddy'}</div>
                  </div>
                ))}
                {!account.buddies?.length && <div style={{ color: '#666' }}>Sin buddies</div>}
              </div>
            )}

            {activeSection === 'cards' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 12 }}>
                {(account.cards || []).map((card, idx) => (
                  <div key={idx} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
                    {card.smallArt && <img src={card.smallArt} alt={card.displayName} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />}
                    <div style={{ padding: '6px 8px', fontSize: 11, color: '#ccc', textAlign: 'center' }}>{card.displayName || 'Card'}</div>
                  </div>
                ))}
                {!account.cards?.length && <div style={{ color: '#666' }}>Sin cards</div>}
              </div>
            )}

            {activeSection === 'sprays' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 12 }}>
                {(account.sprays || []).map((spray, idx) => (
                  <div key={idx} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    {spray.displayIcon && <img src={spray.displayIcon} alt={spray.displayName} style={{ width: 56, height: 56, objectFit: 'contain' }} />}
                    <div style={{ fontSize: 11, color: '#ccc', textAlign: 'center' }}>{spray.displayName || 'Spray'}</div>
                  </div>
                ))}
                {!account.sprays?.length && <div style={{ color: '#666' }}>Sin sprays</div>}
              </div>
            )}

            {activeSection === 'flex' && (
              <div style={{ color: '#888', fontSize: 14 }}>
                {totalFlex} item{totalFlex !== 1 ? 's' : ''} flex
              </div>
            )}

            {activeSection === 'titles' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {(account.titles || []).map((title, idx) => (
                  <div key={idx} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '8px 16px', color: '#fff', fontSize: 13 }}>
                    {title.titleText || title.displayName || 'Title'}
                  </div>
                ))}
                {!account.titles?.length && <div style={{ color: '#666' }}>Sin títulos</div>}
              </div>
            )}

            {activeSection === 'agents' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 12 }}>
                {(account.agents || []).map((agent, idx) => (
                  <div key={idx} style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
                    {agent.displayIconSmall && <img src={agent.displayIconSmall} alt={agent.displayName} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />}
                    <div style={{ padding: '6px 8px', fontSize: 11, color: '#ccc', textAlign: 'center' }}>{agent.displayName || 'Agent'}</div>
                  </div>
                ))}
                {!account.agents?.length && <div style={{ color: '#666' }}>Sin agentes</div>}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
