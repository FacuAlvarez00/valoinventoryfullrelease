const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwt';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // Set to true when HTTPS is enabled
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000 // One day
};

const RIOT_HEADERS = {
  'X-Riot-ClientPlatform': 'ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9',
  // Static fallback — deliberately stale. Don't use it directly for
  // match/rank fetches, see getFreshClientVersion() below: confirmed live
  // that mmr/v1/players returns 500 (INTERNAL_UNHANDLED_SERVER_ERROR) with
  // this old version while match-history/match-details tolerate it — but
  // best not to rely on that staying true forever.
  'X-Riot-ClientVersion': 'B312378013F36E38'
};

let cachedClientVersion = null; // { value, fetchedAt }
const CLIENT_VERSION_TTL_MS = 6 * 60 * 60 * 1000; // 6h

// The real, current Valorant client version, via valorant-api.com (public,
// no key, a static mirror of game content — not a stats API). Cached 6h so
// it's not fetched on every Riot call; falls back to the hardcoded string
// above if the fetch fails, instead of breaking everything.
async function getFreshClientVersion() {
  const now = Date.now();
  if (cachedClientVersion && now - cachedClientVersion.fetchedAt < CLIENT_VERSION_TTL_MS) {
    return cachedClientVersion.value;
  }
  try {
    const res = await fetch('https://valorant-api.com/v1/version');
    const data = await res.json();
    const version = data?.data?.riotClientVersion;
    if (version) {
      cachedClientVersion = { value: version, fetchedAt: now };
      return version;
    }
  } catch {
    // falls through to the hardcoded fallback below
  }
  return RIOT_HEADERS['X-Riot-ClientVersion'];
}

const RIOT_ENDPOINTS = {
  USER_INFO: 'https://auth.riotgames.com/userinfo',
  ENTITLEMENTS: 'https://entitlements.auth.riotgames.com/api/token/v1',
  GEO: 'https://riot-geo.pas.si.riotgames.com/pas/v1/product/valorant',
  SKINS: 'https://pd.na.a.pvp.net/store/v1/entitlements',
  LOADOUT: 'https://pd.na.a.pvp.net/personalization/v2/players',
  BUDDIES: 'https://pd.na.a.pvp.net/store/v1/entitlements',
  BATTLE_PASSES: 'https://pd.na.a.pvp.net/store/v1/entitlements',
  CARDS: 'https://pd.na.a.pvp.net/store/v1/entitlements',
  SPRAYS: 'https://pd.na.a.pvp.net/store/v1/entitlements',
  TITLES: 'https://pd.na.a.pvp.net/store/v1/entitlements',
  AGENTS: 'https://pd.na.a.pvp.net/store/v1/entitlements',
  FLEX: 'https://pd.na.a.pvp.net/store/v1/entitlements',
  NAME_SERVICE: 'https://pd.na.a.pvp.net/name-service/v2/players',
  WALLET: 'https://pd.na.a.pvp.net/store/v1/wallet',
  // Account level (XP), straight from Riot — replaces the old HenrikDev proxy.
  // https://valapidocs.techchrism.me/endpoint/account-xp/
  ACCOUNT_XP: 'https://pd.na.a.pvp.net/account-xp/v1/players',
  // Competitive rank/MMR history. Unlike the other endpoints this one is
  // genuinely region-sensitive, so {shard} gets substituted per account
  // (see RiotAccount.regionInfo.affinities.live) instead of hardcoding 'na'.
  // https://valapidocs.techchrism.me/endpoint/player-mmr
  MMR: 'https://pd.{shard}.a.pvp.net/mmr/v1/players'
};

const RIOT_ENTITLEMENT_IDS = {
  SKINS: 'e7c63390-eda7-46e0-bb7a-a6abdacd2433',
  BUDDIES: 'dd3bf334-87f3-40bd-b043-682a57a8dc3a',
  BATTLE_PASSES: 'f85cb6f7-33e5-4dc8-b609-ec7212301948',
  CARDS: '3f296c07-64c3-494c-923b-fe692a4fa1bd',
  SPRAYS: 'd5f120f8-ff8c-4aac-92ea-f2b5acbe9475',
  TITLES: 'de7caa6b-adf7-4588-bbd1-143831e786c6',
  AGENTS: '01bb38e1-da47-4e6a-9b3d-945fe4655707',
  FLEX: '03a572de-4234-31ed-d344-ababa488f981'
};

// The rest of RIOT_ENDPOINTS is hardcoded to the `na` shard (pre-existing
// tech debt). Maps a Riot region name ('na'/'eu'/'ap'/'kr'/'latam'/'br'/...,
// as returned in regionInfo.affinities.live and already stored per account —
// see riotController.js) to the real pd.{shard}.a.pvp.net shard. Ported from
// D:\valomanager\src\lib\riot\constants.ts (regionToShard).
function regionToShard(region) {
  switch ((region || '').toUpperCase()) {
    case 'EU':
      return 'eu';
    case 'AP':
      return 'ap';
    case 'KR':
      return 'kr';
    case 'LAS':
    case 'LATAM':
    case 'BR':
    case 'NA':
    default:
      return 'na';
  }
}

module.exports = {
  JWT_SECRET,
  COOKIE_OPTIONS,
  RIOT_HEADERS,
  RIOT_ENDPOINTS,
  RIOT_ENTITLEMENT_IDS,
  regionToShard,
  getFreshClientVersion
};
