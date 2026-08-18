const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
const { RIOT_HEADERS, RIOT_ENDPOINTS, RIOT_ENTITLEMENT_IDS } = require('../config/constants');

class RiotService {
  static async getValorantVersion() {
    console.log('🔄 [RiotService] ===== LOADING VALORANT API VERSION =====');
    try {
      const response = await fetch('https://valorant-api.com/v1/version');
      const data = await response.json();
      console.log('🔄 [RiotService] Complete valorant-api.com response:', JSON.stringify(data, null, 2));

      if (data.status === 200 && data.data) {
        const version = data.data.riotClientVersion;
        console.log('🔄 [RiotService] Version resolved:', version);
        console.log('🔄 [RiotService] ===== END VALORANT API VERSION LOOKUP =====');
        return version;
      } else {
        console.log('🔄 [RiotService] Invalid valorant-api.com response');
        return 'B312378013F36E38'; // Fall back to the known client version
      }
    } catch (error) {
      console.error('🔄 [RiotService] Failed to load Valorant version:', error);
      return 'B312378013F36E38'; // Fall back to the known client version
    }
  }

  static async getUserInfo(riotToken) {
    const response = await fetch(RIOT_ENDPOINTS.USER_INFO, {
      headers: { Authorization: `Bearer ${riotToken}` }
    });
    return response.json();
  }

  static async getUserInfoDetailed(riotToken) {
    console.log('👤 [RiotService] ===== LOADING DETAILED USER INFORMATION =====');
    console.log('👤 [RiotService] Token:', riotToken ? riotToken.substring(0, 20) + '...' : 'Unavailable');
    console.log('👤 [RiotService] URL:', RIOT_ENDPOINTS.USER_INFO);

    try {
      const response = await fetch(RIOT_ENDPOINTS.USER_INFO, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${riotToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('👤 [RiotService] Response status:', response.status);
      console.log('👤 [RiotService] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('👤 [RiotService] Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('👤 [RiotService] Complete user information response:', JSON.stringify(data, null, 2));
      console.log('👤 [RiotService] ===== END DETAILED USER INFORMATION LOOKUP =====');

      return data;
    } catch (error) {
      console.error('👤 [RiotService] Failed to load detailed user information:', error);
      throw error;
    }
  }

  static async getEntitlementToken(riotToken) {
    const response = await fetch(RIOT_ENDPOINTS.ENTITLEMENTS, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${riotToken}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  static async getSkins(puuid, entitlementToken, riotToken) {
    const response = await fetch(`${RIOT_ENDPOINTS.SKINS}/${puuid}/${RIOT_ENTITLEMENT_IDS.SKINS}`, {
      headers: {
        ...RIOT_HEADERS,
        'X-Riot-Entitlements-JWT': entitlementToken,
        Authorization: `Bearer ${riotToken}`
      }
    });
    return response.json();
  }

  static async getLoadout(puuid, entitlementToken, riotToken) {
    const response = await fetch(`${RIOT_ENDPOINTS.LOADOUT}/${puuid}/playerloadout`, {
      headers: {
        ...RIOT_HEADERS,
        'X-Riot-Entitlements-JWT': entitlementToken,
        Authorization: `Bearer ${riotToken}`
      }
    });
    return response.json();
  }

  // Account level (XP), straight from Riot — replaces the old HenrikDev proxy
  // the app used before (see https://valapidocs.techchrism.me/endpoint/account-xp/).
  static async getAccountXP(puuid, entitlementToken, riotToken) {
    try {
      const response = await fetch(`${RIOT_ENDPOINTS.ACCOUNT_XP}/${puuid}`, {
        headers: {
          ...RIOT_HEADERS,
          'X-Riot-Entitlements-JWT': entitlementToken,
          Authorization: `Bearer ${riotToken}`
        }
      });

      if (!response.ok) {
        console.error(`⭐ [RiotService] Error fetching account-xp: HTTP ${response.status}`);
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('⭐ [RiotService] Error fetching account-xp:', error);
      return null;
    }
  }

  // Aggregate rank/MMR (all seasons in one call — the richer source: wins,
  // games and leaderboard placement per season). `shard` must match the
  // account's own region (na/eu/ap/kr/...) — unlike most other endpoints
  // this one actually cares. NOTE: confirmed live (2026-08-17) that Riot's
  // own server 500s (INTERNAL_UNHANDLED_SERVER_ERROR) on this endpoint for
  // at least some accounts — headers/auth/shard all check out, its sibling
  // /competitiveupdates works fine, so this is Riot-side, not us. Callers
  // should treat a null return as "fall back to getCompetitiveUpdates", see
  // getRankHistory below.
  static async getPlayerMMR(puuid, entitlementToken, riotToken, shard = 'na') {
    try {
      const url = `${RIOT_ENDPOINTS.MMR.replace('{shard}', shard)}/${puuid}`;
      const response = await fetch(url, {
        headers: {
          ...RIOT_HEADERS,
          'X-Riot-Entitlements-JWT': entitlementToken,
          Authorization: `Bearer ${riotToken}`
        }
      });

      if (!response.ok) {
        console.error(`🏆 [RiotService] Error fetching player MMR: HTTP ${response.status}`);
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('🏆 [RiotService] Error fetching player MMR:', error);
      return null;
    }
  }

  // Match-by-match rank updates (competitive + deathmatch mixed). Riot caps
  // the page window at 20 (endIndex - startIndex <= 20) and 400s past the
  // account's true total, confirmed live — getRankHistory below pages this
  // and stops on either signal.
  static async getCompetitiveUpdates(puuid, entitlementToken, riotToken, shard, startIndex, endIndex) {
    try {
      const url = `${RIOT_ENDPOINTS.MMR.replace('{shard}', shard)}/${puuid}/competitiveupdates?startIndex=${startIndex}&endIndex=${endIndex}`;
      const response = await fetch(url, {
        headers: {
          ...RIOT_HEADERS,
          'X-Riot-Entitlements-JWT': entitlementToken,
          Authorization: `Bearer ${riotToken}`
        }
      });

      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('🏆 [RiotService] Error fetching competitive updates:', error);
      return null;
    }
  }

  // Normalizes the aggregate endpoint's per-season map into a flat list.
  // Returns null (not []) when the endpoint gave nothing usable, so callers
  // can tell "no ranked history" apart from "this source didn't work".
  static summarizeRankFromAggregate(mmrData) {
    const bySeasonId = mmrData?.QueueSkills?.competitive?.SeasonalInfoBySeasonID;
    if (!bySeasonId) return null;
    return Object.values(bySeasonId)
      .filter(s => s.NumberOfGames > 0)
      .map(s => ({
        seasonId: s.SeasonID,
        tier: s.CompetitiveTier,
        rr: s.RankedRating,
        wins: s.NumberOfWins,
        games: s.NumberOfGames,
        leaderboardRank: s.LeaderboardRank || 0,
      }));
  }

  // Reduces a raw competitiveupdates match list to one entry per season —
  // whichever match has the latest MatchStartTime for that season, i.e. the
  // account's final standing that act. No wins/games/leaderboard: that match
  // feed doesn't carry them, only per-match tier/RR after the update.
  static summarizeRankFromUpdates(matches) {
    const bySeason = new Map();
    for (const m of matches) {
      if (m.QueueID !== 'competitive') continue;
      const prev = bySeason.get(m.SeasonID);
      if (!prev || m.MatchStartTime > prev.matchStartTime) {
        bySeason.set(m.SeasonID, {
          seasonId: m.SeasonID,
          tier: m.TierAfterUpdate,
          rr: m.RankedRatingAfterUpdate,
          matchStartTime: m.MatchStartTime,
        });
      }
    }
    return Array.from(bySeason.values());
  }

  // Rank history for one account, most-complete-source-first: tries the
  // aggregate endpoint (richer, but known to fail for some accounts — see
  // getPlayerMMR above); on failure, derives the same per-season shape from
  // up to MAX_PAGES pages of the match-update feed instead (tier/RR only).
  // The per-match scoreboard shown alongside this is a separate set of
  // calls — see getRecentMatchSummaries below.
  static async getRankHistory(puuid, entitlementToken, riotToken, shard) {
    const aggregate = await this.getPlayerMMR(puuid, entitlementToken, riotToken, shard);
    const fromAggregate = this.summarizeRankFromAggregate(aggregate);
    if (fromAggregate) return { source: 'aggregate', seasons: fromAggregate };

    const PAGE_SIZE = 20;
    const MAX_PAGES = 10; // ~200 matches back — plenty of acts for most accounts
    let allUpdates = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const start = page * PAGE_SIZE;
      const data = await this.getCompetitiveUpdates(puuid, entitlementToken, riotToken, shard, start, start + PAGE_SIZE);
      const updates = data?.Matches || [];
      if (updates.length === 0) break;
      allUpdates = allUpdates.concat(updates);
      if (updates.length < PAGE_SIZE) break; // short page = reached the account's true history start
    }
    return { source: 'match-history', seasons: this.summarizeRankFromUpdates(allUpdates) };
  }

  // Match id list (no result/score — that's a separate match-details call
  // per id, see getMatchDetails below). Same sliding-window pagination cap
  // as competitiveupdates. https://valapidocs.techchrism.me/endpoint/match-history
  static async getMatchHistory(puuid, entitlementToken, riotToken, shard, startIndex, endIndex, queue = 'competitive') {
    try {
      const url = `https://pd.${shard}.a.pvp.net/match-history/v1/history/${puuid}?startIndex=${startIndex}&endIndex=${endIndex}&queue=${queue}`;
      const response = await fetch(url, {
        headers: {
          ...RIOT_HEADERS,
          'X-Riot-Entitlements-JWT': entitlementToken,
          Authorization: `Bearer ${riotToken}`
        }
      });
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('🏆 [RiotService] Error fetching match history:', error);
      return null;
    }
  }

  // The N most recent competitive match ids, newest first (Riot already
  // returns it in that order).
  static async getRecentMatchIds(puuid, entitlementToken, riotToken, shard, limit = 10) {
    const data = await this.getMatchHistory(puuid, entitlementToken, riotToken, shard, 0, limit, 'competitive');
    return (data?.History || []).map(h => h.MatchID);
  }

  // Full match detail blob for one match — raw, unprocessed. Straight from
  // Riot, no third party. https://valapidocs.techchrism.me/endpoint/match-details
  static async getMatchDetails(matchId, entitlementToken, riotToken, shard) {
    try {
      const url = `https://pd.${shard}.a.pvp.net/match-details/v1/matches/${matchId}`;
      const response = await fetch(url, {
        headers: {
          ...RIOT_HEADERS,
          'X-Riot-Entitlements-JWT': entitlementToken,
          Authorization: `Bearer ${riotToken}`
        }
      });
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('🏆 [RiotService] Error fetching match details:', error);
      return null;
    }
  }

  // Riot's raw match-details doesn't hand back ACS/ADR/HS% — those get
  // reduced from per-round data ourselves:
  //  - ACS  = player.stats.score / roundsPlayed
  //  - ADR  = sum(player.roundDamage[].damage) / roundsPlayed (damage this
  //           player dealt, not received — roundDamage is nested under the
  //           player, so every entry in it is outgoing)
  //  - HS%  = headshots / (headshots+bodyshots+legshots), summed from
  //           roundResults[*].playerStats[*].damage[*] for this player's
  //           subject across every round (roundDamage has no shot-location
  //           breakdown, only roundResults does)
  static summarizeMatchForPlayer(matchDetails, puuid) {
    if (!matchDetails?.matchInfo || !Array.isArray(matchDetails.players)) return null;

    const me = matchDetails.players.find(p => p.subject === puuid);
    if (!me) return null;

    const rounds = me.stats?.roundsPlayed || 0;
    const acs = rounds > 0 ? Math.round((me.stats?.score || 0) / rounds) : 0;

    const totalDamage = (me.roundDamage || []).reduce((sum, d) => sum + (d.damage || 0), 0);
    const adr = rounds > 0 ? Math.round(totalDamage / rounds) : 0;

    let headshots = 0, bodyshots = 0, legshots = 0;
    for (const round of matchDetails.roundResults || []) {
      const myRoundStats = (round.playerStats || []).find(s => s.subject === puuid);
      for (const d of myRoundStats?.damage || []) {
        headshots += d.headshots || 0;
        bodyshots += d.bodyshots || 0;
        legshots += d.legshots || 0;
      }
    }
    const totalShots = headshots + bodyshots + legshots;
    const hsPercent = totalShots > 0 ? Math.round((headshots / totalShots) * 100) : 0;

    const teams = matchDetails.teams || [];
    const teamRed = teams.find(t => t.teamId === 'Red');
    const teamBlue = teams.find(t => t.teamId === 'Blue');

    return {
      matchId: matchDetails.matchInfo.matchId,
      date: new Date(matchDetails.matchInfo.gameStartMillis).toISOString(),
      mapUrl: matchDetails.matchInfo.mapId,
      durationSecs: matchDetails.matchInfo.gameLengthMillis
        ? Math.round(matchDetails.matchInfo.gameLengthMillis / 1000)
        : null,
      teamRed: teamRed ? { won: teamRed.won, roundsWon: teamRed.roundsWon } : null,
      teamBlue: teamBlue ? { won: teamBlue.won, roundsWon: teamBlue.roundsWon } : null,
      player: {
        team: me.teamId,
        characterId: me.characterId,
        kills: me.stats?.kills || 0,
        deaths: me.stats?.deaths || 0,
        assists: me.stats?.assists || 0,
        acs,
        adr,
        hsPercent
      }
    };
  }

  // Recent competitive matches, fully summarized for this account — id list
  // first, then match-details in parallel for each (capped at `limit`, kept
  // small since it's an N+1: one Riot call per match on top of the id list).
  static async getRecentMatchSummaries(puuid, entitlementToken, riotToken, shard, limit = 10) {
    const matchIds = await this.getRecentMatchIds(puuid, entitlementToken, riotToken, shard, limit);
    const details = await Promise.all(
      matchIds.map(id => this.getMatchDetails(id, entitlementToken, riotToken, shard))
    );
    return details
      .map(d => d ? this.summarizeMatchForPlayer(d, puuid) : null)
      .filter(Boolean);
  }

  // Active penalties/restrictions (queue bans, comms restrictions, etc.) for
  // whichever account the token belongs to — the URL doesn't take a puuid,
  // Riot resolves it from the bearer token. Riot's own docs type the array
  // itself as `unknown[]` — no documented per-entry schema — so this hands
  // back whatever's in it as-is instead of guessing field names; the
  // frontend renders it defensively too.
  // https://valapidocs.techchrism.me/endpoint/penalties
  static async getPenalties(entitlementToken, riotToken, shard) {
    try {
      const url = `https://pd.${shard}.a.pvp.net/restrictions/v3/penalties`;
      const response = await fetch(url, {
        headers: {
          ...RIOT_HEADERS,
          'X-Riot-Entitlements-JWT': entitlementToken,
          Authorization: `Bearer ${riotToken}`
        }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data?.Penalties || [];
    } catch (error) {
      console.error('🚫 [RiotService] Error fetching penalties:', error);
      return [];
    }
  }

  static async getBuddies(puuid, entitlementToken, riotToken) {
    const response = await fetch(`${RIOT_ENDPOINTS.BUDDIES}/${puuid}/${RIOT_ENTITLEMENT_IDS.BUDDIES}`, {
      headers: {
        ...RIOT_HEADERS,
        'X-Riot-Entitlements-JWT': entitlementToken,
        Authorization: `Bearer ${riotToken}`
      }
    });
    return response.json();
  }

  static async getBuddyDetails(itemIDs) {
    // Load all available gun buddies from the public API first
    const allBuddiesResponse = await fetch('https://valorant-api.com/v1/buddies');
    const allBuddiesData = await allBuddiesResponse.json();
    const allBuddies = allBuddiesData.data || [];

    const promises = itemIDs.map(async (itemID) => {
      try {
        // Find the parent buddy containing this level
        const parentBuddy = allBuddies.find(buddy =>
          buddy.levels && buddy.levels.some(level => level.uuid === itemID)
        );

        if (parentBuddy) {
          return {
            ItemID: itemID,
            displayName: parentBuddy.displayName,
            displayIcon: parentBuddy.displayIcon,
            uuid: parentBuddy.uuid,
            themeUuid: parentBuddy.themeUuid,
            isHiddenIfNotOwned: parentBuddy.isHiddenIfNotOwned,
            levels: parentBuddy.levels,
            // Information for the specific level owned by the user
            ownedLevel: parentBuddy.levels.find(level => level.uuid === itemID)
          };
        } else {
          // Fetch the level directly when its parent cannot be resolved
          const response = await fetch(`https://valorant-api.com/v1/buddylevels/${itemID}`);
          const data = await response.json();

          if (data.data) {
            return {
              ItemID: itemID,
              displayName: data.data.displayName || 'Unknown gun buddy',
              displayIcon: data.data.displayIcon || null,
              uuid: data.data.uuid,
              charmLevel: data.data.charmLevel,
              hideIfNotOwned: data.data.hideIfNotOwned
            };
          } else {
            return { ItemID: itemID, displayName: 'Unknown gun buddy' };
          }
        }
      } catch (error) {
        console.error(`Failed to load gun buddy details for ${itemID}:`, error);
        return { ItemID: itemID, displayName: 'Unknown gun buddy' };
      }
    });

    const results = await Promise.all(promises);
    return results;
  }



  static async getBattlePasses(puuid, entitlementToken, riotToken) {
    const response = await fetch(`${RIOT_ENDPOINTS.BATTLE_PASSES}/${puuid}/${RIOT_ENTITLEMENT_IDS.BATTLE_PASSES}`, {
      headers: {
        ...RIOT_HEADERS,
        'X-Riot-Entitlements-JWT': entitlementToken,
        Authorization: `Bearer ${riotToken}`
      }
    });
    return response.json();
  }

  static async getCards(puuid, entitlementToken, riotToken) {
    const response = await fetch(`${RIOT_ENDPOINTS.CARDS}/${puuid}/${RIOT_ENTITLEMENT_IDS.CARDS}`, {
      headers: {
        ...RIOT_HEADERS,
        'X-Riot-Entitlements-JWT': entitlementToken,
        Authorization: `Bearer ${riotToken}`
      }
    });
    return response.json();
  }

  static async getSprays(puuid, entitlementToken, riotToken) {
    try {
      const response = await fetch(`${RIOT_ENDPOINTS.SPRAYS}/${puuid}/${RIOT_ENTITLEMENT_IDS.SPRAYS}`, {
        headers: {
          ...RIOT_HEADERS,
          'X-Riot-Entitlements-JWT': entitlementToken,
          Authorization: `Bearer ${riotToken}`
        }
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to load sprays:', error);
      throw error;
    }
  }

  static async getTitles(puuid, entitlementToken, riotToken) {
    const response = await fetch(`${RIOT_ENDPOINTS.TITLES}/${puuid}/${RIOT_ENTITLEMENT_IDS.TITLES}`, {
      headers: {
        ...RIOT_HEADERS,
        'X-Riot-Entitlements-JWT': entitlementToken,
        Authorization: `Bearer ${riotToken}`
      }
    });

    const data = await response.json();
    return data;
  }

  static async getAgents(puuid, entitlementToken, riotToken) {
    const response = await fetch(`${RIOT_ENDPOINTS.AGENTS}/${puuid}/${RIOT_ENTITLEMENT_IDS.AGENTS}`, {
      headers: {
        ...RIOT_HEADERS,
        'X-Riot-Entitlements-JWT': entitlementToken,
        Authorization: `Bearer ${riotToken}`
      }
    });

    const data = await response.json();
    return data;
  }

  static async getFlex(puuid, entitlementToken, riotToken) {
    console.log('🏆 [RiotService] ===== LOADING USER FLEX ITEMS =====');
    console.log('🏆 [RiotService] PUUID:', puuid);
    console.log('🏆 [RiotService] Complete URL:', `${RIOT_ENDPOINTS.FLEX}/${puuid}/${RIOT_ENTITLEMENT_IDS.FLEX}`);

    try {
      const response = await fetch(`${RIOT_ENDPOINTS.FLEX}/${puuid}/${RIOT_ENTITLEMENT_IDS.FLEX}`, {
        headers: {
          ...RIOT_HEADERS,
          'X-Riot-Entitlements-JWT': entitlementToken,
          Authorization: `Bearer ${riotToken}`
        }
      });

      console.log('🏆 [RiotService] Response status:', response.status);
      console.log('🏆 [RiotService] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('🏆 [RiotService] Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('🏆 [RiotService] Complete flex response:', JSON.stringify(data, null, 2));
      console.log('🏆 [RiotService] ===== END USER FLEX LOOKUP =====');

      return data;
    } catch (error) {
      console.error('🏆 [RiotService] Failed to load flex items:', error);
      throw error;
    }
  }

  static async getCardDetails(itemIDs) {
    const promises = itemIDs.map(async (id) => {
      try {
        const response = await fetch(`https://valorant-api.com/v1/playercards/${id}`);
        const data = await response.json();
        return {
          ItemID: id,
          displayName: data.data?.displayName || 'Unknown card',
          largeArt: data.data?.largeArt || null,
          smallArt: data.data?.smallArt || null,
          wideArt: data.data?.wideArt || null
        };
      } catch (error) {
        console.error(`Failed to load card details for ${id}:`, error);
        return { ItemID: id };
      }
    });
    return Promise.all(promises);
  }

  static async getSkinDetails(itemIDs) {
    const promises = itemIDs.map(async (id) => {
      try {
        const response = await fetch(`https://valorant-api.com/v1/weapons/skinlevels/${id}`);
        const data = await response.json();

        if (data.data) {
          console.log(`🔍 [RiotService] Processing skin: ${data.data.displayName}`);
          // Custom price for the VCT LOCK//IN skin
          if (data.data.displayName === 'VCT LOCK//IN Misericórdia') {
            console.log('🎯 [RiotService] Applying custom VCT LOCK//IN price: 5440');
            // Assign the custom 5,440 VP price
            data.data.customPrice = 5440;
            data.data.priceDisplayName = '5440 VP';
            console.log('✅ [RiotService] Price assigned:', data.data.customPrice, data.data.priceDisplayName);
          }
        }

        return data.data;
      } catch (error) {
        console.error(`Failed to load skin details for ${id}:`, error);
        return null;
      }
    });
    return Promise.all(promises);
  }

  static async getSprayDetails(itemIDs) {
    const promises = itemIDs.map(async (itemID) => {
      try {
        const url = `https://valorant-api.com/v1/sprays/${itemID}`;
        const response = await fetch(url);
        const data = await response.json();

        return {
          ItemID: itemID,
          displayName: data.data?.displayName || 'Unknown spray',
          displayIcon: data.data?.displayIcon || null,
          fullTransparentIcon: data.data?.fullTransparentIcon || null,
          category: data.data?.category || null
        };
      } catch (error) {
        console.error(`Failed to load spray details for ${itemID}:`, error);
        return { ItemID: itemID };
      }
    });

    return Promise.all(promises);
  }

  static async getTitleDetails(itemIDs) {
    const promises = itemIDs.map(async (itemID) => {
      try {
        const url = `https://valorant-api.com/v1/playertitles/${itemID}`;
        const response = await fetch(url);
        const data = await response.json();

        return {
          ItemID: itemID,
          displayName: data.data?.displayName || 'Unknown title',
          titleText: data.data?.titleText || null,
          category: data.data?.category || null
        };
      } catch (error) {
        console.error(`Failed to load title details for ${itemID}:`, error);
        return { ItemID: itemID };
      }
    });

    return Promise.all(promises);
  }

  static async getAgentDetails(itemIDs) {
    const promises = itemIDs.map(async (itemID) => {
      try {
        const url = `https://valorant-api.com/v1/agents/${itemID}`;
        const response = await fetch(url);
        const data = await response.json();

        const result = {
          ItemID: itemID,
          displayName: data.data?.displayName || 'Unknown agent',
          displayIcon: data.data?.displayIcon || null,
          fullPortrait: data.data?.fullPortraitV2 || null,
          role: data.data?.role?.displayName || null,
          description: data.data?.description || null
        };

        return result;
      } catch (error) {
        console.error(`Failed to load agent details for ${itemID}:`, error);
        return { ItemID: itemID };
      }
    });

    const results = await Promise.all(promises);
    return results;
  }

  static async getNameService(puuids, entitlementToken, riotToken) {
    console.log('📝 [RiotService] ===== LOADING PLAYER NAMES =====');
    console.log('📝 [RiotService] PUUIDs received:', puuids);

    try {
      const response = await fetch(RIOT_ENDPOINTS.NAME_SERVICE, {
        method: 'PUT',
        headers: {
          ...RIOT_HEADERS,
          'X-Riot-Entitlements-JWT': entitlementToken,
          'Authorization': `Bearer ${riotToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(puuids)
      });

      console.log('📝 [RiotService] Response status:', response.status);
      console.log('📝 [RiotService] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📝 [RiotService] Complete response:', JSON.stringify(data, null, 2));
      console.log('📝 [RiotService] ===== END PLAYER NAME LOOKUP =====');

      return data;
    } catch (error) {
      console.error('📝 [RiotService] Failed to load player names:', error);
      throw error;
    }
  }

  static async getWallet(puuid, entitlementToken, riotToken) {
    console.log('💰 [RiotService] ===== LOADING USER WALLET =====');
    console.log('💰 [RiotService] PUUID:', puuid);
    console.log('💰 [RiotService] Complete URL:', `${RIOT_ENDPOINTS.WALLET}/${puuid}`);

    // Resolve the current Valorant client version
    const dynamicVersion = await this.getValorantVersion();
    console.log('💰 [RiotService] Using current client version:', dynamicVersion);

    // Build headers with the current client version
    const dynamicHeaders = {
      ...RIOT_HEADERS,
      'X-Riot-ClientVersion': dynamicVersion,
      'X-Riot-Entitlements-JWT': entitlementToken,
      'Authorization': `Bearer ${riotToken}`
    };

    console.log('💰 [RiotService] Request headers:', {
      'X-Riot-ClientPlatform': dynamicHeaders['X-Riot-ClientPlatform'] ? 'PRESENT' : 'MISSING',
      'X-Riot-ClientVersion': dynamicHeaders['X-Riot-ClientVersion'],
      'X-Riot-Entitlements-JWT': entitlementToken ? 'PRESENT' : 'MISSING',
      'Authorization': riotToken ? 'PRESENT' : 'MISSING'
    });

    try {
      console.log('💰 [RiotService] Sending GET request to:', `${RIOT_ENDPOINTS.WALLET}/${puuid}`);
      console.log('💰 [RiotService] Complete headers:', JSON.stringify(dynamicHeaders, null, 2));

      const response = await fetch(`${RIOT_ENDPOINTS.WALLET}/${puuid}`, {
        method: 'GET',
        headers: dynamicHeaders
      });

      console.log('💰 [RiotService] Response status:', response.status);
      console.log('💰 [RiotService] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('💰 [RiotService] Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('💰 [RiotService] Complete wallet response:', JSON.stringify(data, null, 2));
      console.log('💰 [RiotService] Parsed wallet data:', {
        Balances: data.Balances ? `${data.Balances.length} balances found` : 'No balances',
        WalletData: data
      });
      console.log('💰 [RiotService] ===== END USER WALLET LOOKUP =====');

      return data;
    } catch (error) {
      console.error('💰 [RiotService] Failed to load wallet:', error);
      throw error;
    }
  }

  static async getCurrencyDetails(currencyIds) {
    try {
      console.log('💰 [RiotService] ===== LOADING CURRENCY DETAILS =====');
      console.log('💰 [RiotService] Currency IDs:', currencyIds);

      const currencyPromises = currencyIds.map(async (currencyId) => {
        try {
          const response = await fetch(`https://valorant-api.com/v1/currencies/${currencyId}`);
          const data = await response.json();

          if (data && data.status === 200 && data.data) {
            console.log(`💰 [RiotService] Currency loaded:`, {
              uuid: data.data.uuid,
              displayName: data.data.displayName,
              displayIcon: data.data.displayIcon
            });
            return {
              uuid: data.data.uuid,
              displayName: data.data.displayName,
              displayNameSingular: data.data.displayNameSingular,
              displayIcon: data.data.displayIcon,
              largeIcon: data.data.largeIcon
            };
          } else {
            console.log(`⚠️ [RiotService] Failed to load currency ${currencyId}:`, data);
            return null;
          }
        } catch (error) {
          console.log(`❌ [RiotService] Failed to load currency ${currencyId}:`, error.message);
          return null;
        }
      });

      const currencyDetails = await Promise.all(currencyPromises);
      const validCurrencies = currencyDetails.filter(currency => currency !== null);

      console.log('💰 [RiotService] Currencies loaded successfully:', validCurrencies.length);
      console.log('💰 [RiotService] ===== END CURRENCY DETAIL LOOKUP =====');

      return validCurrencies;
    } catch (error) {
      console.error('❌ [RiotService] Failed to load currency details:', error);
      throw error;
    }
  }

  static extractIdTokenFromUrl(url) {
    try {
      // Match id_token through the token_type delimiter
      const idTokenMatch = url.match(/id_token=([^&]+)&token_type=/);

      if (idTokenMatch && idTokenMatch[1]) {
        const idToken = idTokenMatch[1];
        return idToken;
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to extract the ID token from the URL:', error);
      return null;
    }
  }

  static async getRegionInfo(idToken, authToken) {
    try {
      const response = await fetch(RIOT_ENDPOINTS.GEO, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id_token: idToken
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();

      // Highlight the Riot GEO response in diagnostic output
      console.log('\n' + '='.repeat(80));
      console.log('🌍🌍🌍 RIOT GEO ENDPOINT RESPONSE 🌍🌍🌍');
      console.log('='.repeat(80));
      console.log('📊 COMPLETE RESPONSE:', JSON.stringify(data, null, 2));
      console.log('📋 TOKEN:', data.token || 'UNAVAILABLE');
      console.log('🌎 PBE REGION:', data.affinities?.pbe || 'UNAVAILABLE');
      console.log('🌎 LIVE REGION:', data.affinities?.live || 'UNAVAILABLE');
      console.log('='.repeat(80) + '\n');

      return data;
    } catch (error) {
      console.log('\n' + '='.repeat(80));
      console.log('❌❌❌ RIOT GEO ENDPOINT ERROR ❌❌❌');
      console.log('='.repeat(80));
      console.log('ERROR:', error.message);
      console.log('='.repeat(80) + '\n');
      throw error;
    }
  }
}

module.exports = RiotService;
