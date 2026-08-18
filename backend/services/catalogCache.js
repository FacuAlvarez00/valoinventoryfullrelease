const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

const REFRESH_MS = 24 * 60 * 60 * 1000; // 24 horas

let cache = {
  weapons: [],
  skins: [],
  chromas: [],
  skinlevels: [],
  weaponSkins: [],
  seasons: [],
  competitiveTiers: [],
  maps: [],
  agents: [],
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
    const [weaponsData, skinsData, chromasData, skinlevelsData, weaponSkinsData, seasonsData, tiersData, mapsData, agentsData] = await Promise.all([
      fetchWithRetry('https://valorant-api.com/v1/weapons'),
      fetchWithRetry('https://valorant-api.com/v1/weapons/skins'),
      fetchWithRetry('https://valorant-api.com/v1/weapons/skinchromas'),
      fetchWithRetry('https://valorant-api.com/v1/weapons/skinlevels'),
      fetchWithRetry('https://vinfo-api.com/json/weaponSkins'),
      fetchWithRetry('https://valorant-api.com/v1/seasons'),
      fetchWithRetry('https://valorant-api.com/v1/competitivetiers'),
      fetchWithRetry('https://valorant-api.com/v1/maps'),
      fetchWithRetry('https://valorant-api.com/v1/agents?isPlayableCharacter=true'),
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

    // Ranked acts only (each is one ladder reset; episodes are just used
    // below to build a full label for older acts whose own `title` is
    // empty). Used to resolve rank history: SeasonalInfoBySeasonID from the
    // MMR endpoint is keyed by these same act UUIDs.
    const episodeNameByUuid = {};
    (seasonsData.data || []).forEach(s => {
      if (s.type !== 'EAresSeasonType::Act') episodeNameByUuid[s.uuid] = s.displayName;
    });
    const seasons = (seasonsData.data || [])
      .filter(s => s.type === 'EAresSeasonType::Act')
      .map(s => ({
        uuid: s.uuid,
        label: s.title || `${episodeNameByUuid[s.parentUuid] || ''} ${s.displayName}`.trim(),
        startTime: s.startTime,
      }));

    // Tier number -> name/icon. Tier numbering has been stable since Ascendant
    // was added, so the latest tier set is used to render every act's
    // history instead of resolving a tier set per season.
    const latestTierSet = (tiersData.data || [])[tiersData.data?.length - 1];
    const competitiveTiers = (latestTierSet?.tiers || []).map(t => ({
      tier: t.tier,
      name: t.tierName,
      icon: t.largeIcon || t.smallIcon || null,
    }));

    // matchInfo.mapId (from match-details) is the internal asset path
    // (e.g. "/Game/Maps/Triad/Triad"), not a uuid — keyed by mapUrl to match.
    const maps = (mapsData.data || []).map(m => ({
      mapUrl: m.mapUrl,
      displayName: m.displayName,
    }));

    // characterId (from match-details) is a genuine agent uuid.
    const agents = (agentsData.data || []).map(a => ({
      uuid: a.uuid,
      displayName: a.displayName,
      icon: a.displayIconSmall || a.displayIcon || null,
    }));

    cache = {
      weapons,
      skins,
      chromas,
      skinlevels,
      weaponSkins: Array.isArray(weaponSkinsData) ? weaponSkinsData : [],
      seasons,
      competitiveTiers,
      maps,
      agents,
      lastUpdated: new Date().toISOString(),
    };

    console.log(`✅ [CatalogCache] ${cache.skins.length} skins, ${cache.skinlevels.length} skinlevels, ${cache.weaponSkins.length} precios, ${cache.seasons.length} temporadas, ${cache.competitiveTiers.length} tiers, ${cache.maps.length} mapas, ${cache.agents.length} agentes — ${cache.lastUpdated}`);
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
