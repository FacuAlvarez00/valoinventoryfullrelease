const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

const REFRESH_MS = 24 * 60 * 60 * 1000; // 24 horas

let cache = {
  weapons: [],
  skins: [],
  chromas: [],
  skinlevels: [],
  weaponSkins: [],
  lastUpdated: null,
};

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { timeout: 30000 });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 3000 * (i + 1)));
    }
  }
}

async function refresh() {
  console.log('🔄 [CatalogCache] Updating catalog...');
  try {
    const [weaponsData, skinsData, chromasData, skinlevelsData, weaponSkinsData] = await Promise.all([
      fetchWithRetry('https://valorant-api.com/v1/weapons'),
      fetchWithRetry('https://valorant-api.com/v1/weapons/skins'),
      fetchWithRetry('https://valorant-api.com/v1/weapons/skinchromas'),
      fetchWithRetry('https://valorant-api.com/v1/weapons/skinlevels'),
      fetchWithRetry('https://vinfo-api.com/json/weaponSkins'),
    ]);

    const weapons = (weaponsData.data || []).map(w => ({
      uuid: w.uuid,
      displayName: w.displayName,
      skins: (w.skins || []).map(s => ({
        uuid: s.uuid,
        displayName: s.displayName,
        contentTierUuid: s.contentTierUuid,
        displayIcon: s.displayIcon,
        chromas: (s.chromas || []).map(c => ({
          uuid: c.uuid,
          displayName: c.displayName,
          displayIcon: c.displayIcon,
          fullRender: c.fullRender,
          swatch: c.swatch,
          streamedVideo: c.streamedVideo || null,
        })),
        levels: (s.levels || []).map(lvl => ({
          uuid: lvl.uuid,
          displayName: lvl.displayName,
          displayIcon: lvl.displayIcon,
          streamedVideo: lvl.streamedVideo || null,
        })),
      })),
    }));

    const skins = (skinsData.data || []).map(s => ({
      uuid: s.uuid,
      displayName: s.displayName,
      weapon: s.weapon ? { uuid: s.weapon.uuid } : null,
      chromas: (s.chromas || []).map(c => ({
        uuid: c.uuid,
        displayName: c.displayName,
        fullRender: c.fullRender,
        swatch: c.swatch,
        streamedVideo: c.streamedVideo || null,
      })),
    }));

    const chromas = (chromasData.data || []).map(c => ({
      uuid: c.uuid,
      displayName: c.displayName,
      fullRender: c.fullRender,
      swatch: c.swatch,
      skinUuid: c.skinUuid,
      streamedVideo: c.streamedVideo || null,
    }));

    const skinlevels = (skinlevelsData.data || []).map(sl => ({
      uuid: sl.uuid,
      displayName: sl.displayName,
      displayIcon: sl.displayIcon,
    }));

    cache = {
      weapons,
      skins,
      chromas,
      skinlevels,
      weaponSkins: Array.isArray(weaponSkinsData) ? weaponSkinsData : [],
      lastUpdated: new Date().toISOString(),
    };

    console.log(`✅ [CatalogCache] ${cache.skins.length} skins, ${cache.skinlevels.length} skinlevels, ${cache.weaponSkins.length} precios — ${cache.lastUpdated}`);
  } catch (e) {
    console.error('❌ [CatalogCache] Update failed:', e.message);
  }
}

function get() { return cache; }
function isReady() { return cache.skins.length > 0; }

async function init() {
  await refresh();
  setInterval(refresh, REFRESH_MS);
}

module.exports = { init, get, isReady };
