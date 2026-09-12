// backend/models/RiotHarvesterSession.js
//
// Stores the session cookies of ONE "harvester" Riot account — not its
// credentials, just the cookies (ssid/asid/clid/tdid) Riot lets you use to
// silently reauthenticate for ~2-3 weeks. With that session you can request
// match-history/match-details/player-mmr for ANY puuid (those endpoints
// aren't self-only, unlike account-xp) — a single document here serves every
// linked account of every user, letting rank/matches refresh on demand
// instead of needing that specific account's owner to log in again.
// See backend/services/riotHarvester.js.
//
// Ported from D:\valoinventory's identical pattern (itself ported from
// D:\valomanager, where it lives in a generic Prisma Settings table). A
// fixed-_id document works fine here too — only one can ever exist.
const mongoose = require('mongoose');

const riotHarvesterSessionSchema = new mongoose.Schema({
  _id: { type: String, default: 'harvester' },
  cookies: { type: String, required: true },
  savedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('RiotHarvesterSession', riotHarvesterSessionSchema);
