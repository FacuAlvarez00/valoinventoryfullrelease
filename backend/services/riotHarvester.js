// backend/services/riotHarvester.js
//
// The "harvester" account: ONE logged-in Riot session, cached and reused to
// request match-history/match-details/player-mmr for ANY puuid (those
// endpoints aren't self-only — any authenticated session can ask about
// anyone; only account-xp requires it to be that same account's own
// session). Same trick HenrikDev uses internally with its own bot accounts.
// Ported from D:\valoinventory\backend\services\riotHarvester.js (itself
// ported from D:\valomanager\src\lib\riot\harvester.ts + auth.ts +
// session-cache.ts + harvester-store.ts).
//
// Why this doesn't log in with username/password itself: Cloudflare blocks
// ANY fresh-credential submission to auth.riotgames.com that doesn't come
// from a real human browser — confirmed in valomanager with a raw fetch,
// with browser-matched TLS ciphers, and even with a real Chrome driven by
// Puppeteer with a human typing. All three failed with the SAME account that
// logs in fine in a normal browser.
//
// What does work: logging into a normal browser (already logged in, never
// opened by this app), copying the final redirect URL + the
// auth.riotgames.com cookies, and handing them to the app ONCE. From there,
// reauthWithCookies() refreshes the session on its own, no browser, for as
// long as Riot honors them (on the order of 2-3 weeks). See
// PUT /api/auth/riot-harvester.
const RiotHarvesterSession = require('../models/RiotHarvesterSession');
const RiotService = require('./riotService');

const REAUTH_URL =
  'https://auth.riotgames.com/authorize?redirect_uri=https%3A%2F%2Fplayvalorant.com%2Fopt_in&client_id=play-valorant-web-prod&response_type=token%20id_token&nonce=1&scope=account%20openid';

// Normal-browser headers for the cookies→tokens exchange — deliberately
// WITHOUT the native-RiotClient headers (X-Riot-ClientPlatform/ClientVersion)
// the rest of this app uses for pd.*.a.pvp.net: mixing a web client_id
// (play-valorant-web-prod) with native-client headers is a fingerprint a
// real browser never produces, and this call goes through the same
// Cloudflare that blocks scripted logins (even though no credentials are
// sent here, only existing cookies).
const WEB_AUTH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
};

class HarvesterLoginRequiredError extends Error {
  constructor() {
    super('The harvester account has no active session — redo the manual bootstrap (see PUT /api/auth/riot-harvester).');
  }
}

// In-memory cache — single process (same approach as catalogCache.js), no
// need for anything fancier. Riot's access token lasts ~1h; cut it a bit
// short so nothing risks using an expired one.
const TTL_MS = 55 * 60 * 1000;
let cached = null; // { session: {accessToken, entitlementsToken, puuid}, expiresAt }

function getCachedSession() {
  if (!cached) return null;
  if (Date.now() >= cached.expiresAt) {
    cached = null;
    return null;
  }
  return cached.session;
}

function setCachedSession(session) {
  cached = { session, expiresAt: Date.now() + TTL_MS };
}

function decodeJwtSub(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return payload.sub || null;
  } catch {
    return null;
  }
}

async function exchangeCookiesForTokens(cookies) {
  const res = await fetch(REAUTH_URL, {
    method: 'GET',
    headers: { ...WEB_AUTH_HEADERS, Cookie: cookies },
    redirect: 'manual',
  });
  const location = res.headers.get('location');
  if (!location) return null;
  const accessToken = location.match(/access_token=([^&]+)/)?.[1];
  const idToken = location.match(/id_token=([^&]+)/)?.[1];
  if (!accessToken) return null;
  return { accessToken, idToken: idToken || '' };
}

// Refreshes a session from saved cookies — no credentials, no captcha
// (Cloudflare only seems to block sending fresh credentials, not
// reauthenticating with cookies that already exist).
async function reauthWithCookies(cookies) {
  const tokens = await exchangeCookiesForTokens(cookies);
  if (!tokens) return { type: 'error', message: 'The saved session is no longer valid' };
  const puuid = decodeJwtSub(tokens.accessToken);
  if (!puuid) return { type: 'error', message: 'Could not read the puuid from the token' };
  return { type: 'success', puuid, accessToken: tokens.accessToken, idToken: tokens.idToken };
}

async function loadHarvesterCookies() {
  const doc = await RiotHarvesterSession.findById('harvester').lean();
  return doc?.cookies || null;
}

async function saveHarvesterCookies(cookies) {
  await RiotHarvesterSession.findByIdAndUpdate(
    'harvester',
    { cookies, savedAt: new Date() },
    { upsert: true }
  );
}

async function establishSession(accessToken, puuid, cookies) {
  const entitlementsData = await RiotService.getEntitlementToken(accessToken);
  const entitlementsToken = entitlementsData?.entitlements_token;
  if (!entitlementsToken) throw new Error('Could not get the entitlements token for the harvester account');
  const session = { accessToken, entitlementsToken, puuid };
  setCachedSession(session);
  await saveHarvesterCookies(cookies);
  return session;
}

async function trySilentReauth() {
  const cookies = await loadHarvesterCookies();
  if (!cookies) return null;
  const result = await reauthWithCookies(cookies);
  if (result.type !== 'success') return null;
  return establishSession(result.accessToken, result.puuid, cookies);
}

// Read path — used by the live rank/match endpoints. Never opens anything
// manual — if there's no in-memory session and no saved cookies that still
// work, it throws the error above and the caller decides what to show (see
// riotController.js).
async function getHarvesterSession() {
  const inMemory = getCachedSession();
  if (inMemory) return inMemory;
  const viaCookies = await trySilentReauth();
  if (viaCookies) return viaCookies;
  throw new HarvesterLoginRequiredError();
}

// Riot doesn't publish how long session cookies actually last — "on the
// order of 2-3 weeks" per the runbook (ported from valomanager). 21 days is
// used as the estimate for the admin panel's countdown — it's only
// indicative, not a guarantee; the session can die earlier (or last a bit
// longer) without warning.
const ESTIMATED_SESSION_LIFETIME_MS = 21 * 24 * 60 * 60 * 1000;

async function getHarvesterStatus() {
  const doc = await RiotHarvesterSession.findById('harvester').lean();
  const savedAt = doc?.savedAt || null;
  const expiresAt = savedAt ? new Date(new Date(savedAt).getTime() + ESTIMATED_SESSION_LIFETIME_MS).toISOString() : null;

  if (getCachedSession()) return { state: 'ready', savedAt, expiresAt };
  if (!doc?.cookies) return { state: 'needs_login', savedAt: null, expiresAt: null };

  // This used to report "ready" just because cookies were saved, without
  // testing whether they still work — confirmed live that gives a real false
  // positive: the process restarts (nodemon, redeploy), the in-memory cache
  // is lost, and the saved cookies may no longer be enough to reauthenticate
  // (Riot can reject them anyway, redirecting to login) without the admin
  // panel knowing. This actually verifies it now — it's 1 call to Riot, but
  // getHarvesterStatus isn't called nearly as often as getMatchHistory, so
  // the accuracy is worth the cost.
  const reauthed = await trySilentReauth();
  if (reauthed) return { state: 'ready', savedAt, expiresAt };
  // Confirmed truly dead — don't show a countdown for a session that no
  // longer exists, that would contradict "Inactive".
  return { state: 'needs_login', savedAt: null, expiresAt: null };
}

// Manual bootstrap: the final redirect URL (with the access_token in the
// fragment) + optionally the auth.riotgames.com cookies so the session lasts
// weeks instead of ~1h. See the runbook in the PUT route.
async function bootstrapHarvesterFromUrl(redirectUrl, cookies) {
  const accessToken = redirectUrl.match(/access_token=([^&]+)/)?.[1];
  if (!accessToken) throw new Error('No access_token found in that URL — is it the final URL after logging in?');
  const puuid = decodeJwtSub(accessToken);
  if (!puuid) throw new Error('Could not read the puuid from the token');
  return establishSession(accessToken, puuid, cookies || '');
}

function clearCachedSession() {
  cached = null;
}

module.exports = {
  HarvesterLoginRequiredError,
  getHarvesterSession,
  getHarvesterStatus,
  bootstrapHarvesterFromUrl,
  clearCachedSession,
  decodeJwtSub,
};
