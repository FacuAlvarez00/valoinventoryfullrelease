import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getSkinPrice, isGoldenSkin } from '../../utils/pricing';
import styles from './SharedView.module.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://valoinventory-1.onrender.com';

const SECTIONS = [
  { key: 'skins',      label: 'SKINS' },
  { key: 'battlepass', label: 'BATTLEPASSES' },
  { key: 'buddies',    label: 'GUNBUDDIES' },
  { key: 'cards',      label: 'CARDS' },
  { key: 'sprays',     label: 'SPRAYS' },
  { key: 'flex',       label: 'FLEX' },
  { key: 'titles',     label: 'TITLES' },
  { key: 'agents',     label: 'AGENTS' },
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
    { key: 'skins',      label: 'SKINS',       count: Object.keys(skinsPorBase).length, vpSpent: totalVPSkins },
    { key: 'battlepass', label: 'BATTLEPASSES', count: account?.battlePasses?.length || 0, vpSpent: totalVPBattlePasses },
    { key: 'buddies',    label: 'GUNBUDDIES',  count: account?.buddies?.length || 0 },
    { key: 'cards',      label: 'CARDS',       count: account?.cards?.length || 0 },
    { key: 'sprays',     label: 'SPRAYS',      count: account?.sprays?.length || 0 },
    { key: 'flex',       label: 'FLEX',        count: totalFlex },
    { key: 'titles',     label: 'TITLES',      count: account?.titles?.length || 0 },
    { key: 'agents',     label: 'AGENTS',      count: account?.agents?.length || 0 },
  ], [account, skinsPorBase, totalVPSkins, totalVPBattlePasses, totalFlex]);

  if (loading) return (
    <div className={styles.center}>
      <div className={styles.loadingText}>Cargando inventario...</div>
    </div>
  );

  if (error) return (
    <div className={styles.center}>
      <div className={styles.errorText}>Error: {error}</div>
      <div className={styles.errorSub}>El link puede ser inválido o haber expirado.</div>
    </div>
  );

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <div className={styles.navbar}>
        <div className={styles.navIdentity}>
          <div className={styles.navAvatar}>
            {(account.nickname || account.name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className={styles.navName}>{account.nickname || account.name}</div>
            <div className={styles.navUpdated}>
              Actualizado: {account.lastUpdated ? new Date(account.lastUpdated).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </div>
          </div>
        </div>
        <div className={styles.navBrand}>VALO<span className={styles.navBrandAccent}>INVENTORY</span></div>
      </div>

      {/* Dashboard */}
      <div className={styles.dashboard}>
        <div className={styles.dashboardHeader}>
          <h2 className={styles.heading}>Inventory</h2>
          <div className={styles.totalValue}>
            Total Value: {totalVP.toLocaleString()}
            <img src="/assets/icons/20px-White_Valorant_Points_VALORANT.png" alt="VP" style={{ width: 16, height: 16 }} />
          </div>
        </div>

        <div className={styles.tileGrid}>
          {sections.map(sec => (
            <div
              key={sec.key}
              onClick={() => setActiveSection(activeSection === sec.key ? null : sec.key)}
              className={`${styles.tile} ${activeSection === sec.key ? styles.tileActive : ''}`}
            >
              {sec.vpSpent !== undefined && (
                <div className={styles.tileVp}>
                  {sec.vpSpent.toLocaleString()}
                  <img src="/assets/icons/20px-White_Valorant_Points_VALORANT.png" alt="VP" style={{ width: 12, height: 12 }} />
                </div>
              )}
              <div className={styles.tileLabel}>{sec.label}</div>
              <div className={styles.tileCount}>{sec.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {activeSection && (
        <div className={styles.detailWrap}>
          <div className={styles.detailInner}>

            {activeSection === 'skins' && (
              <div className={`${styles.detailGrid} ${styles.detailGridSkins}`}>
                {skinsOrdenadas.map(([baseName, skins], idx) => {
                  let skinBaseObj = catalog.skins.find(s => s.displayName === baseName);
                  if (!skinBaseObj) skinBaseObj = catalog.skins.find(s => s.displayName.toLowerCase().includes(baseName.toLowerCase()));
                  let imgSrc = skinBaseObj?.chromas?.[0]?.fullRender || skins.find(s => s.displayIcon)?.displayIcon || '';
                  const price = getSkinPrice(baseName, weaponSkins);
                  const golden = isGoldenSkin(baseName);
                  return (
                    <div key={idx} className={`${styles.skinCard} ${golden ? styles.skinCardGolden : ''}`}>
                      {price ? (
                        <div className={styles.skinPrice}>{price.toLocaleString()}</div>
                      ) : <div style={{ height: 22 }} />}
                      <div className={styles.skinImgWrap}>
                        {imgSrc && <img src={imgSrc} alt={baseName} className={styles.skinImg} />}
                      </div>
                      <div className={styles.skinName}>{baseName}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeSection === 'battlepass' && (
              <div className={styles.chip}>
                {(account.battlePasses || []).map((bp, idx) => (
                  <div key={idx} className={styles.chipItem}>
                    {bp.displayName || bp.ItemID || `Battle Pass ${idx + 1}`}
                  </div>
                ))}
                {!account.battlePasses?.length && <div className={styles.emptyNote}>Sin battle passes</div>}
              </div>
            )}

            {activeSection === 'buddies' && (
              <div className={styles.detailGrid}>
                {(account.buddies || []).map((buddy, idx) => (
                  <div key={idx} className={styles.itemCard}>
                    {buddy.displayIcon && <img src={buddy.displayIcon} alt={buddy.displayName} className={styles.itemImg} />}
                    <div className={styles.itemName}>{buddy.displayName || 'Buddy'}</div>
                  </div>
                ))}
                {!account.buddies?.length && <div className={styles.emptyNote}>Sin buddies</div>}
              </div>
            )}

            {activeSection === 'cards' && (
              <div className={styles.detailGrid}>
                {(account.cards || []).map((card, idx) => (
                  <div key={idx} className={styles.tileImgCard}>
                    {card.smallArt && <img src={card.smallArt} alt={card.displayName} className={styles.tileImg} />}
                    <div className={styles.tileImgName}>{card.displayName || 'Card'}</div>
                  </div>
                ))}
                {!account.cards?.length && <div className={styles.emptyNote}>Sin cards</div>}
              </div>
            )}

            {activeSection === 'sprays' && (
              <div className={styles.detailGrid}>
                {(account.sprays || []).map((spray, idx) => (
                  <div key={idx} className={styles.itemCard}>
                    {spray.displayIcon && <img src={spray.displayIcon} alt={spray.displayName} className={styles.itemImg} />}
                    <div className={styles.itemName}>{spray.displayName || 'Spray'}</div>
                  </div>
                ))}
                {!account.sprays?.length && <div className={styles.emptyNote}>Sin sprays</div>}
              </div>
            )}

            {activeSection === 'flex' && (
              <div className={styles.emptyNote}>
                {totalFlex} item{totalFlex !== 1 ? 's' : ''} flex
              </div>
            )}

            {activeSection === 'titles' && (
              <div className={styles.chip}>
                {(account.titles || []).map((title, idx) => (
                  <div key={idx} className={styles.chipItem}>
                    {title.titleText || title.displayName || 'Title'}
                  </div>
                ))}
                {!account.titles?.length && <div className={styles.emptyNote}>Sin títulos</div>}
              </div>
            )}

            {activeSection === 'agents' && (
              <div className={styles.detailGrid}>
                {(account.agents || []).map((agent, idx) => (
                  <div key={idx} className={styles.tileImgCard}>
                    {agent.displayIconSmall && <img src={agent.displayIconSmall} alt={agent.displayName} className={styles.tileImg} />}
                    <div className={styles.tileImgName}>{agent.displayName || 'Agent'}</div>
                  </div>
                ))}
                {!account.agents?.length && <div className={styles.emptyNote}>Sin agentes</div>}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
