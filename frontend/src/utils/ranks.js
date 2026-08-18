// frontend/src/utils/ranks.js
//
// Turns the raw `riotAccount.rank` slice (backend, straight from Riot's MMR
// endpoints — see RiotService.getRankHistory) plus the public season/
// competitive tier catalog into a display-ready rank history, most recent
// act first.
//
// `rank.seasons` is already normalized server-side to one entry per act:
// { seasonId, tier, rr, wins?, games?, leaderboardRank? }. wins/games/
// leaderboardRank are only present when `rank.source === 'aggregate'` —
// Riot's richer endpoint 500s for some accounts, and the fallback source
// (match-by-match update feed) doesn't carry those fields, only tier/RR.

export function buildRankHistory(rank, catalog) {
  const seasons = rank?.seasons;
  if (!Array.isArray(seasons) || seasons.length === 0) return [];

  const seasonsByUuid = new Map((catalog?.seasons || []).map(s => [s.uuid, s]));
  const tiersByNumber = new Map((catalog?.competitiveTiers || []).map(t => [t.tier, t]));

  return seasons
    .map(entry => {
      const season = seasonsByUuid.get(entry.seasonId);
      const tierInfo = tiersByNumber.get(entry.tier);
      return {
        seasonId: entry.seasonId,
        seasonLabel: season?.label || 'Unknown act',
        startTime: season?.startTime || null,
        tier: entry.tier,
        tierName: tierInfo?.name || 'Unranked',
        tierIcon: tierInfo?.icon || null,
        rr: entry.rr ?? 0,
        wins: entry.wins ?? null,
        games: entry.games ?? null,
        leaderboardRank: entry.leaderboardRank || 0,
      };
    })
    // Newest act first. Acts without a catalog match (startTime missing)
    // sort last rather than to the top.
    .sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));
}

// Recent competitive matches — straight from Riot's own match-details, no
// third party (see RiotService.getRecentMatchSummaries /
// summarizeMatchForPlayer, which already reduces the raw per-round data down
// to ACS/ADR/HS% and picks out just this account's own line). Already
// newest-first from the backend. `mapUrl` and `characterId` are resolved
// here against the public catalog, same pattern as buildRankHistory above.
export function buildMatchList(rank, catalog) {
  const matches = rank?.matches;
  if (!Array.isArray(matches) || matches.length === 0) return [];

  const mapsByUrl = new Map((catalog?.maps || []).map(m => [m.mapUrl, m]));
  const agentsByUuid = new Map((catalog?.agents || []).map(a => [a.uuid, a]));

  return matches
    // Defensive: an account refreshed before this shape existed (or a
    // partial fetch failure) can leave incomplete entries — skip rather
    // than render a broken-looking card.
    .filter(m => m.matchId && m.date)
    .map(m => {
      const map = mapsByUrl.get(m.mapUrl);
      const agent = agentsByUuid.get(m.player?.characterId);
      const myTeamData = m.player?.team === 'Red' ? m.teamRed : m.teamBlue;
      return {
        matchId: m.matchId,
        date: m.date,
        durationSecs: m.durationSecs,
        mapName: map?.displayName || 'Unknown map',
        teamRed: m.teamRed,
        teamBlue: m.teamBlue,
        won: myTeamData?.won ?? null,
        agentName: agent?.displayName || null,
        agentIcon: agent?.icon || null,
        kills: m.player?.kills ?? 0,
        deaths: m.player?.deaths ?? 0,
        assists: m.player?.assists ?? 0,
        acs: m.player?.acs ?? 0,
        adr: m.player?.adr ?? 0,
        hsPercent: m.player?.hsPercent ?? 0,
      };
    });
}

export function formatMatchDate(dateValue) {
  if (!dateValue) return 'Unknown date';
  return new Date(dateValue).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatMatchDuration(secs) {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}
