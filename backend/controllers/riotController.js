const RiotService = require('../services/riotService');
const User = require('../models/User');

class RiotController {
  static async getSkins(req, res) {
    const { riotToken } = req.body;

    if (!riotToken) {
      return res.status(400).json({
        success: false,
        message: 'The Riot token is missing'
      });
    }

    try {
      const userinfo = await RiotService.getUserInfo(riotToken);
      const puuid = userinfo.sub;

      if (!puuid) {
        return res.status(400).json({
          success: false,
          message: 'The PUUID could not be resolved'
        });
      }

      const entitlementData = await RiotService.getEntitlementToken(riotToken);
      const entitlementToken = entitlementData.entitlements_token;

      if (!entitlementToken) {
        return res.status(400).json({
          success: false,
          message: 'The entitlement token could not be obtained'
        });
      }

      const skinsData = await RiotService.getSkins(puuid, entitlementToken, riotToken);

      return res.json({
        success: true,
        puuid,
        entitlementToken,
        skins: skinsData
      });
    } catch (err) {
      console.error('Riot authentication flow failed:', err);
      return res.status(500).json({
        success: false,
        message: 'The Riot authentication flow failed'
      });
    }
  }

  static async getSkinDetails(req, res) {
    const { itemIDs } = req.body;

    if (!itemIDs || !Array.isArray(itemIDs)) {
      return res.status(400).json({
        success: false,
        message: 'itemIDs are required'
      });
    }

    try {
      const skinLevels = await RiotService.getSkinDetails(itemIDs);
      res.json({ success: true, skinLevels });
    } catch (err) {
      console.error('Failed to load skin-level details:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to load skin-level details'
      });
    }
  }

  static async getLoadout(req, res) {
    const { riotToken, puuid, entitlementToken } = req.body;

    if (!riotToken || !puuid || !entitlementToken) {
      return res.status(400).json({
        success: false,
        message: 'Required data is missing'
      });
    }

    try {
      const loadoutData = await RiotService.getLoadout(puuid, entitlementToken, riotToken);
      res.json({ success: true, loadout: loadoutData });
    } catch (err) {
      console.error('Failed to load the loadout:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to load the loadout'
      });
    }
  }

  static async addRiotAccount(req, res) {
    const { name, riotToken, url } = req.body;

    if (!riotToken) {
      return res.status(400).json({
        success: false,
        message: 'The Riot token is missing'
      });
    }

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'The URL containing the ID token is missing'
      });
    }

    try {
      const userinfo = await RiotService.getUserInfo(riotToken);
      const puuid = userinfo.sub;
      const nickname = userinfo.acct && userinfo.acct.game_name && userinfo.acct.tag_line
        ? `${userinfo.acct.game_name}#${userinfo.acct.tag_line}`
        : undefined;
      const accountName = (name && name.trim()) ? name.trim() : (userinfo.preferred_username || userinfo.acct?.game_name || nickname);

      if (!puuid) {
        return res.status(400).json({
          success: false,
          message: 'The PUUID could not be resolved'
        });
      }

      const entitlementData = await RiotService.getEntitlementToken(riotToken);
      const entitlementToken = entitlementData.entitlements_token;

      if (!entitlementToken) {
        return res.status(400).json({
          success: false,
          message: 'The entitlement token could not be obtained'
        });
      }

      // Extract the ID token from the URL
      console.log('\n🚀 LOADING REGION INFORMATION...');
      const idToken = RiotService.extractIdTokenFromUrl(url);

      if (!idToken) {
        return res.status(400).json({
          success: false,
          message: 'The ID token could not be extracted from the URL'
        });
      }

      // Load initial account data, including region information
      const [skinsData, loadoutData, buddiesData, battlePassesData, cardsData, spraysData, titlesData, agentsData, walletData, flexData, userInfoData, regionInfo, accountXPData] = await Promise.all([
        RiotService.getSkins(puuid, entitlementToken, riotToken),
        RiotService.getLoadout(puuid, entitlementToken, riotToken),
        RiotService.getBuddies(puuid, entitlementToken, riotToken),
        RiotService.getBattlePasses(puuid, entitlementToken, riotToken),
        RiotService.getCards(puuid, entitlementToken, riotToken),
        RiotService.getSprays(puuid, entitlementToken, riotToken),
        RiotService.getTitles(puuid, entitlementToken, riotToken),
        RiotService.getAgents(puuid, entitlementToken, riotToken),
        RiotService.getWallet(puuid, entitlementToken, riotToken),
        RiotService.getFlex(puuid, entitlementToken, riotToken),
        RiotService.getUserInfoDetailed(riotToken),
        RiotService.getRegionInfo(idToken, riotToken),
        RiotService.getAccountXP(puuid, entitlementToken, riotToken)
      ]);
      const accountLevel = accountXPData?.Progress?.Level ?? null;

      // Rank/MMR needs the account's real shard (region-sensitive, unlike the
      // other endpoints), so it has to wait for regionInfo above to resolve.
      // getRankHistory tries the richer aggregate endpoint first and falls
      // back to the match-update feed if Riot's side 500s on it — see
      // riotService.js for why that fallback exists. The per-match scoreboard
      // (getRecentMatchSummaries) is straight Riot too — no third party.
      const shard = regionInfo?.affinities?.live || 'na';
      const [rank, recentMatches, penalties] = await Promise.all([
        RiotService.getRankHistory(puuid, entitlementToken, riotToken, shard),
        RiotService.getRecentMatchSummaries(puuid, entitlementToken, riotToken, shard),
        RiotService.getPenalties(entitlementToken, riotToken, shard)
      ]);
      rank.matches = recentMatches;

      // Log the region endpoint response for diagnostics
      console.log('\n' + '='.repeat(80));
      console.log('🌍🌍🌍 RIOT GEO RESPONSE WHILE ADDING ACCOUNT 🌍🌍🌍');
      console.log('='.repeat(80));
      console.log('📊 COMPLETE RESPONSE:', JSON.stringify(regionInfo, null, 2));
      console.log('📋 TOKEN:', regionInfo.token || 'UNAVAILABLE');
      console.log('🌎 PBE REGION:', regionInfo.affinities?.pbe || 'UNAVAILABLE');
      console.log('🌎 LIVE REGION:', regionInfo.affinities?.live || 'UNAVAILABLE');
      console.log('='.repeat(80) + '\n');

      // DEBUG WALLET - Similar a como debuggeamos battlepass y buddies
      console.log('💰 [RiotController] ===== DEBUG WALLET =====');
      console.log('💰 [RiotController] Wallet data completo:', JSON.stringify(walletData, null, 2));
      console.log('💰 [RiotController] Has balances:', 'Balances' in walletData);

      // Flex diagnostics
      console.log('🏆 [RiotController] ===== DEBUG FLEX =====');
      console.log('🏆 [RiotController] Flex data completo:', JSON.stringify(flexData, null, 2));
      console.log('🏆 [RiotController] Has entitlements:', 'Entitlements' in flexData);

      // User information diagnostics
      console.log('👤 [RiotController] ===== DEBUG USERINFO =====');
      console.log('👤 [RiotController] UserInfo data completo:', JSON.stringify(userInfoData, null, 2));
      console.log('👤 [RiotController] PUUID:', userInfoData?.sub);
      console.log('👤 [RiotController] Game Name:', userInfoData?.acct?.game_name);
      console.log('👤 [RiotController] Tag Line:', userInfoData?.acct?.tag_line);
      console.log('💰 [RiotController] Balances es objeto:', typeof walletData.Balances === 'object');
      if (walletData.Balances && typeof walletData.Balances === 'object') {
        console.log('💰 [RiotController] Balances encontrados:', walletData.Balances);
        Object.entries(walletData.Balances).forEach(([currencyId, amount], idx) => {
          console.log(`💰 [RiotController] Balance ${idx + 1}:`, {
            CurrencyTypeID: currencyId,
            Amount: amount
          });
        });
      } else {
        console.log('💰 [RiotController] No balances found or the value is not an object');
      }
      console.log('💰 [RiotController] ===== FIN DEBUG WALLET =====');

      // Load currency details
      let currencyDetails = [];
      if (walletData.Balances && typeof walletData.Balances === 'object') {
        const currencyIds = Object.keys(walletData.Balances);
        console.log('💰 [RiotController] Loading currency details for IDs:', currencyIds);
        currencyDetails = await RiotService.getCurrencyDetails(currencyIds);
        console.log('💰 [RiotController] Currency details loaded:', currencyDetails.length);
      }


      // Load card, spray, title, agent, and buddy details
      let cardsWithDetails = [];
      let spraysWithDetails = [];
      let titlesWithDetails = [];
      let agentsWithDetails = [];
      let buddiesWithDetails = [];

      if (cardsData.Entitlements && cardsData.Entitlements.length > 0) {
        const cardIDs = cardsData.Entitlements.map(card => card.ItemID);
        cardsWithDetails = await RiotService.getCardDetails(cardIDs);
      }

      if (spraysData.Entitlements && spraysData.Entitlements.length > 0) {
        const sprayIDs = spraysData.Entitlements.map(spray => spray.ItemID);
        spraysWithDetails = await RiotService.getSprayDetails(sprayIDs);
      }

      if (titlesData.Entitlements && titlesData.Entitlements.length > 0) {
        const titleIDs = titlesData.Entitlements.map(title => title.ItemID);
        titlesWithDetails = await RiotService.getTitleDetails(titleIDs);
      }

      if (buddiesData.Entitlements && buddiesData.Entitlements.length > 0) {
        const buddyIDs = buddiesData.Entitlements.map(buddy => buddy.ItemID);
        buddiesWithDetails = await RiotService.getBuddyDetails(buddyIDs);
      }

      if (agentsData.Entitlements && agentsData.Entitlements.length > 0) {
        const agentIDs = agentsData.Entitlements.map(agent => agent.ItemID);
        agentsWithDetails = await RiotService.getAgentDetails(agentIDs);
      }

      // Prevent duplicate linked accounts
      const alreadyExists = req.user.riotAccounts.some(acc => acc.puuid === puuid);
      if (alreadyExists) {
        return res.status(400).json({
          success: false,
          message: 'This Riot account is already linked.'
        });
      }

      // Link the account to the user
      const newAccount = {
        name: accountName,
        puuid,
        nickname,
        loadout: loadoutData,
        accountLevel,
        rank,
        penalties,
        skins: skinsData.Entitlements || [],
        buddies: buddiesWithDetails,
        battlePasses: battlePassesData.Entitlements || [],
        cards: cardsWithDetails,
        sprays: spraysWithDetails,
        titles: titlesWithDetails,
        agents: agentsWithDetails,
        wallet: walletData,
        currencyDetails: currencyDetails,
        flex: flexData,
        userInfo: userInfoData,
        regionInfo: regionInfo,
        lastUpdated: new Date()
      };

      req.user.riotAccounts.push(newAccount);
      await req.user.save();

      // Confirm that region information was persisted
      console.log('\n' + '='.repeat(60));
      console.log('💾 REGION INFORMATION SAVED TO THE DATABASE 💾');
      console.log('='.repeat(60));
      console.log('📊 RegionInfo guardado:', JSON.stringify(regionInfo, null, 2));
      console.log('🌎 Live region:', regionInfo?.affinities?.live);
      console.log('🌎 PBE region:', regionInfo?.affinities?.pbe);
      console.log('='.repeat(60) + '\n');

      res.json({
        success: true,
        message: 'Riot account added successfully',
        account: newAccount
      });
    } catch (err) {
      console.error('Failed to add Riot account:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to add the Riot account'
      });
    }
  }

  static async refreshAccount(req, res) {
    const { puuid, riotToken, url } = req.body;

    if (!puuid || !riotToken) {
      return res.status(400).json({
        success: false,
        message: 'Required data is missing (puuid and riotToken)'
      });
    }

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'The URL containing the ID token is missing'
      });
    }

    try {
      const account = req.user.riotAccounts.find(acc => acc.puuid === puuid);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Riot account not found'
        });
      }

      const userinfo = await RiotService.getUserInfo(riotToken);
      const tokenPuuid = userinfo.sub;
      const nickname = userinfo.acct && userinfo.acct.game_name && userinfo.acct.tag_line
        ? `${userinfo.acct.game_name}#${userinfo.acct.tag_line}`
        : undefined;

      if (tokenPuuid !== account.puuid) {
        return res.status(400).json({
          success: false,
          message: 'The token does not belong to this account'
        });
      }

      const entitlementData = await RiotService.getEntitlementToken(riotToken);
      const entitlementToken = entitlementData.entitlements_token;

      // Extract the ID token from the URL to obtain region information
      console.log('\n🚀 LOADING REGION INFORMATION (REFRESH)...');
      const idToken = RiotService.extractIdTokenFromUrl(url);

      if (!idToken) {
        return res.status(400).json({
          success: false,
          message: 'The ID token could not be extracted from the URL'
        });
      }

      // Load refreshed account data, including region information
      const [skinsData, loadoutData, buddiesData, battlePassesData, cardsData, spraysData, titlesData, agentsData, walletData, flexData, userInfoData, regionInfo, accountXPData] = await Promise.all([
        RiotService.getSkins(tokenPuuid, entitlementToken, riotToken),
        RiotService.getLoadout(tokenPuuid, entitlementToken, riotToken),
        RiotService.getBuddies(tokenPuuid, entitlementToken, riotToken),
        RiotService.getBattlePasses(tokenPuuid, entitlementToken, riotToken),
        RiotService.getCards(tokenPuuid, entitlementToken, riotToken),
        RiotService.getSprays(tokenPuuid, entitlementToken, riotToken),
        RiotService.getTitles(tokenPuuid, entitlementToken, riotToken),
        RiotService.getAgents(tokenPuuid, entitlementToken, riotToken),
        RiotService.getWallet(tokenPuuid, entitlementToken, riotToken),
        RiotService.getFlex(tokenPuuid, entitlementToken, riotToken),
        RiotService.getUserInfoDetailed(riotToken),
        RiotService.getRegionInfo(idToken, riotToken),
        RiotService.getAccountXP(tokenPuuid, entitlementToken, riotToken)
      ]);
      const accountLevel = accountXPData?.Progress?.Level ?? null;

      // Rank/MMR needs the account's real shard (region-sensitive, unlike the
      // other endpoints), so it has to wait for regionInfo above to resolve.
      // getRankHistory tries the richer aggregate endpoint first and falls
      // back to the match-update feed if Riot's side 500s on it — see
      // riotService.js for why that fallback exists. The per-match scoreboard
      // (getRecentMatchSummaries) is straight Riot too — no third party.
      const shard = regionInfo?.affinities?.live || 'na';
      const [rank, recentMatches, penalties] = await Promise.all([
        RiotService.getRankHistory(tokenPuuid, entitlementToken, riotToken, shard),
        RiotService.getRecentMatchSummaries(tokenPuuid, entitlementToken, riotToken, shard),
        RiotService.getPenalties(entitlementToken, riotToken, shard)
      ]);
      rank.matches = recentMatches;

      // Log the region endpoint response for diagnostics
      console.log('\n' + '='.repeat(80));
      console.log('🌍🌍🌍 RIOT GEO RESPONSE WHILE UPDATING ACCOUNT 🌍🌍🌍');
      console.log('='.repeat(80));
      console.log('📊 COMPLETE RESPONSE:', JSON.stringify(regionInfo, null, 2));
      console.log('📋 TOKEN:', regionInfo.token || 'UNAVAILABLE');
      console.log('🌎 PBE REGION:', regionInfo.affinities?.pbe || 'UNAVAILABLE');
      console.log('🌎 LIVE REGION:', regionInfo.affinities?.live || 'UNAVAILABLE');
      console.log('='.repeat(80) + '\n');

      // DEBUG WALLET - Similar a como debuggeamos battlepass y buddies
      console.log('💰 [RiotController] ===== DEBUG WALLET (REFRESH) =====');
      console.log('💰 [RiotController] Wallet data completo:', JSON.stringify(walletData, null, 2));
      console.log('💰 [RiotController] Has balances:', 'Balances' in walletData);

      // Flex diagnostics during refresh
      console.log('🏆 [RiotController] ===== DEBUG FLEX (REFRESH) =====');
      console.log('🏆 [RiotController] Flex data completo:', JSON.stringify(flexData, null, 2));
      console.log('🏆 [RiotController] Has entitlements:', 'Entitlements' in flexData);

      // User information diagnostics during refresh
      console.log('👤 [RiotController] ===== DEBUG USERINFO (REFRESH) =====');
      console.log('👤 [RiotController] UserInfo data completo:', JSON.stringify(userInfoData, null, 2));
      console.log('👤 [RiotController] PUUID:', userInfoData?.sub);
      console.log('👤 [RiotController] Game Name:', userInfoData?.acct?.game_name);
      console.log('👤 [RiotController] Tag Line:', userInfoData?.acct?.tag_line);
      console.log('💰 [RiotController] Balances es objeto:', typeof walletData.Balances === 'object');
      if (walletData.Balances && typeof walletData.Balances === 'object') {
        console.log('💰 [RiotController] Balances encontrados:', walletData.Balances);
        Object.entries(walletData.Balances).forEach(([currencyId, amount], idx) => {
          console.log(`💰 [RiotController] Balance ${idx + 1}:`, {
            CurrencyTypeID: currencyId,
            Amount: amount
          });
        });
      } else {
        console.log('💰 [RiotController] No balances found or the value is not an object');
      }
      console.log('💰 [RiotController] ===== FIN DEBUG WALLET (REFRESH) =====');

      // Load currency details
      let currencyDetails = [];
      if (walletData.Balances && typeof walletData.Balances === 'object') {
        const currencyIds = Object.keys(walletData.Balances);
        console.log('💰 [RiotController] Loading currency details for IDs:', currencyIds);
        currencyDetails = await RiotService.getCurrencyDetails(currencyIds);
        console.log('💰 [RiotController] Currency details loaded:', currencyDetails.length);
      }

      // Load card, spray, title, agent, and buddy details
      let cardsWithDetails = [];
      let spraysWithDetails = [];
      let titlesWithDetails = [];
      let agentsWithDetails = [];
      let buddiesWithDetails = [];

      if (cardsData.Entitlements && cardsData.Entitlements.length > 0) {
        const cardIDs = cardsData.Entitlements.map(card => card.ItemID);
        cardsWithDetails = await RiotService.getCardDetails(cardIDs);
      }

      if (spraysData.Entitlements && spraysData.Entitlements.length > 0) {
        const sprayIDs = spraysData.Entitlements.map(spray => spray.ItemID);
        spraysWithDetails = await RiotService.getSprayDetails(sprayIDs);
      }

      if (titlesData.Entitlements && titlesData.Entitlements.length > 0) {
        const titleIDs = titlesData.Entitlements.map(title => title.ItemID);
        titlesWithDetails = await RiotService.getTitleDetails(titleIDs);
      }

      if (buddiesData.Entitlements && buddiesData.Entitlements.length > 0) {
        const buddyIDs = buddiesData.Entitlements.map(buddy => buddy.ItemID);
        buddiesWithDetails = await RiotService.getBuddyDetails(buddyIDs);
      }

      if (agentsData.Entitlements && agentsData.Entitlements.length > 0) {
        const agentIDs = agentsData.Entitlements.map(agent => agent.ItemID);
        agentsWithDetails = await RiotService.getAgentDetails(agentIDs);
      }

      // Update the linked account
      account.name = userinfo.preferred_username || userinfo.acct?.game_name || nickname;
      account.nickname = nickname;
      account.loadout = loadoutData;
      account.accountLevel = accountLevel;
      account.rank = rank;
      account.penalties = penalties;
      account.skins = skinsData.Entitlements || [];
      account.buddies = buddiesWithDetails;
      account.battlePasses = battlePassesData.Entitlements || [];
      account.cards = cardsWithDetails;
      account.sprays = spraysWithDetails;
      account.titles = titlesWithDetails;
      account.agents = agentsWithDetails;
      account.wallet = walletData;
      account.currencyDetails = currencyDetails;
      account.flex = flexData;
      account.userInfo = userInfoData;
      account.regionInfo = regionInfo;
      account.lastUpdated = new Date();

      await req.user.save();

      // Confirm that region information was updated in the database
      console.log('\n' + '='.repeat(60));
      console.log('💾 REGION INFORMATION UPDATED IN THE DATABASE 💾');
      console.log('='.repeat(60));
      console.log('📊 RegionInfo actualizado:', JSON.stringify(regionInfo, null, 2));
      console.log('🌎 Live region:', regionInfo?.affinities?.live);
      console.log('🌎 PBE region:', regionInfo?.affinities?.pbe);
      console.log('='.repeat(60) + '\n');

      res.json({
        success: true,
        message: 'Riot account updated successfully',
        account
      });
    } catch (err) {
      console.error('Failed to update Riot account:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to update the Riot account'
      });
    }
  }

  static async removeRiotAccount(req, res) {
    const { puuid } = req.params;

    try {
      // Find the account by PUUID
      const accountIndex = req.user.riotAccounts.findIndex(acc => acc.puuid === puuid);

      if (accountIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Riot account not found'
        });
      }

      // Remove the account by index
      req.user.riotAccounts.splice(accountIndex, 1);
      await req.user.save();

      res.json({
        success: true,
        message: 'Riot account deleted successfully'
      });
    } catch (err) {
      console.error('Failed to delete Riot account:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to delete the Riot account'
      });
    }
  }

  static async getSprayDetails(req, res) {
    const { itemIDs } = req.body;

    if (!itemIDs || !Array.isArray(itemIDs)) {
      return res.status(400).json({
        success: false,
        message: 'itemIDs are required'
      });
    }

    try {
      const sprayDetails = await RiotService.getSprayDetails(itemIDs);
      res.json({ success: true, sprayDetails });
    } catch (err) {
      console.error('Failed to load spray details:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to load spray details'
      });
    }
  }

  static async getTitleDetails(req, res) {
    const { itemIDs } = req.body;

    if (!itemIDs || !Array.isArray(itemIDs)) {
      return res.status(400).json({
        success: false,
        message: 'itemIDs are required'
      });
    }

    try {
      const titleDetails = await RiotService.getTitleDetails(itemIDs);
      res.json({ success: true, titleDetails });
    } catch (err) {
      console.error('Failed to load title details:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to load title details'
      });
    }
  }

  // Diagnostic endpoint for spray entitlements
  static async testSprays(req, res) {
    const { riotToken } = req.body;

    if (!riotToken) {
      return res.status(400).json({
        success: false,
        message: 'The Riot token is missing'
      });
    }

    try {
      const userinfo = await RiotService.getUserInfo(riotToken);
      const puuid = userinfo.sub;

      if (!puuid) {
        return res.status(400).json({
          success: false,
          message: 'The PUUID could not be resolved'
        });
      }

      const entitlementData = await RiotService.getEntitlementToken(riotToken);
      const entitlementToken = entitlementData.entitlements_token;

      if (!entitlementToken) {
        return res.status(400).json({
          success: false,
          message: 'The entitlement token could not be obtained'
        });
      }

      // Test several entitlement IDs for spray data
      const sprayEntitlementIDs = [
        '4e60e748-bce6-4faa-9327-ebbe6089d5fe', // ID actual
        'd5f120f8-ff8c-4aac-8ea3-4e9b8f2b3c4d', // ID anterior
        'f85cb6f7-33e5-4dc8-b609-ec7212301948', // Battle pass ID used for comparison
      ];

      const results = {};

      for (const entitlementID of sprayEntitlementIDs) {
        try {
          console.log(`🎨 [TestSprays] Probando entitlement ID: ${entitlementID}`);
          const response = await fetch(`${RIOT_ENDPOINTS.SPRAYS}/${puuid}/${entitlementID}`, {
            headers: {
              ...RIOT_HEADERS,
              'X-Riot-Entitlements-JWT': entitlementToken,
              Authorization: `Bearer ${riotToken}`
            }
          });

          const data = await response.json();
          results[entitlementID] = {
            status: response.status,
            data: data,
            entitlementsCount: data.Entitlements ? data.Entitlements.length : 0
          };
          console.log(`🎨 [TestSprays] Result for ${entitlementID}:`, results[entitlementID]);
        } catch (error) {
          results[entitlementID] = {
            error: error.message
          };
        }
      }

      // Use the entitlement ID with the best result
      const bestResult = Object.entries(results).find(([id, result]) =>
        result.entitlementsCount > 0
      );

      let spraysData = results['4e60e748-bce6-4faa-9327-ebbe6089d5fe'].data;
      if (bestResult) {
        spraysData = bestResult[1].data;
        console.log(`🎨 [TestSprays] Using best result: ${bestResult[0]} with ${bestResult[1].entitlementsCount} sprays`);
      }

      // Load spray details when results exist
      let spraysWithDetails = [];
      if (spraysData.Entitlements && spraysData.Entitlements.length > 0) {
        console.log('🎨 [TestSprays] Sprays encontrados:', spraysData.Entitlements.length);
        console.log('🎨 [TestSprays] Primer spray:', spraysData.Entitlements[0]);
        const sprayIDs = spraysData.Entitlements.map(spray => spray.ItemID);
        console.log('🎨 [TestSprays] IDs de sprays:', sprayIDs);
        spraysWithDetails = await RiotService.getSprayDetails(sprayIDs);
        console.log('🎨 [TestSprays] Sprays with details:', spraysWithDetails);
      } else {
        console.log('🎨 [TestSprays] No sprays found');
      }

      return res.json({
        success: true,
        puuid,
        entitlementToken,
        sprays: spraysData,
        spraysWithDetails: spraysWithDetails,
        testResults: results
      });
    } catch (err) {
      console.error('Spray test failed:', err);
      return res.status(500).json({
        success: false,
        message: 'The spray test failed',
        error: err.message
      });
    }
  }

    // Diagnostic endpoint for direct Valorant API calls
  static async testValorantAPI(req, res) {
    const { itemID } = req.body;

    if (!itemID) {
      return res.status(400).json({
        success: false,
        message: 'itemID is required'
      });
    }

    try {
      console.log(`🎨 [TestValorantAPI] ===== PRUEBA API VALORANT =====`);
      console.log(`🎨 [TestValorantAPI] Probando itemID: ${itemID}`);
      const url = `https://valorant-api.com/v1/sprays/${itemID}`;
      console.log(`🎨 [TestValorantAPI] URL: ${url}`);

      const response = await fetch(url);
      console.log(`🎨 [TestValorantAPI] Status: ${response.status}`);
      console.log(`🎨 [TestValorantAPI] Headers:`, Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log(`🎨 [TestValorantAPI] Complete response:`, JSON.stringify(data, null, 2));

      // Validate the expected response shape
      if (data.data) {
        console.log(`🎨 [TestValorantAPI] ✅ Valid response with data`);
        console.log(`🎨 [TestValorantAPI] displayName: ${data.data.displayName}`);
        console.log(`🎨 [TestValorantAPI] fullTransparentIcon: ${data.data.fullTransparentIcon ? 'PRESENTE' : 'AUSENTE'}`);
      } else {
        console.log(`🎨 [TestValorantAPI] ❌ Response contains no data`);
      }

      console.log(`🎨 [TestValorantAPI] ===== FIN PRUEBA API VALORANT =====`);

      return res.json({
        success: true,
        itemID,
        status: response.status,
        data: data,
        hasData: !!data.data,
        displayName: data.data?.displayName,
        hasFullTransparentIcon: !!data.data?.fullTransparentIcon
      });
    } catch (err) {
      console.error('🎨 [TestValorantAPI] Error probando API de Valorant:', err);
      return res.status(500).json({
        success: false,
        message: 'The Valorant API test failed',
        error: err.message
      });
    }
  }

  // Resolve player names through Riot Name Service
  static async getNameService(req, res) {
    const { puuids, riotToken } = req.body;

    if (!puuids || !Array.isArray(puuids)) {
      return res.status(400).json({
        success: false,
        message: 'PUUIDs are required and must be an array'
      });
    }

    if (!riotToken) {
      return res.status(400).json({
        success: false,
        message: 'The Riot token is missing'
      });
    }

    try {
      // Obtain the entitlement token
      const entitlementData = await RiotService.getEntitlementToken(riotToken);
      const entitlementToken = entitlementData.entitlements_token;

      if (!entitlementToken) {
        return res.status(400).json({
          success: false,
          message: 'The entitlement token could not be obtained'
        });
      }

      // Llamar al Name Service
      const nameServiceData = await RiotService.getNameService(puuids, entitlementToken, riotToken);

      return res.json({
        success: true,
        names: nameServiceData
      });
    } catch (err) {
      console.error('Failed to load player names:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to load player names',
        error: err.message
      });
    }
  }

  static async getUserInfoDetailed(req, res) {
    const { riotToken } = req.body;

    if (!riotToken) {
      return res.status(400).json({
        success: false,
        message: 'The Riot token is missing'
      });
    }

    try {
      console.log('👤 [RiotController] ===== LOADING DETAILED USER INFORMATION =====');
      console.log('👤 [RiotController] Token received:', riotToken ? riotToken.substring(0, 20) + '...' : 'Unavailable');

      const userInfoData = await RiotService.getUserInfoDetailed(riotToken);

      console.log('👤 [RiotController] User information loaded successfully');
      console.log('👤 [RiotController] ===== END DETAILED USER INFORMATION LOOKUP =====');

      return res.json({
        success: true,
        userInfo: userInfoData
      });
    } catch (err) {
      console.error('👤 [RiotController] Failed to load detailed user information:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to load user information',
        error: err.message
      });
    }
  }

  // Test ID-token extraction and region lookup
  static async testRegionInfo(req, res) {
    const { url, riotToken } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'The URL containing the ID token is missing'
      });
    }

    if (!riotToken) {
      return res.status(400).json({
        success: false,
        message: 'The Riot authentication token is missing'
      });
    }

    try {
      console.log('\n🚀 STARTING REGION INFORMATION TEST');

      // Extract the ID token from the URL
      const idToken = RiotService.extractIdTokenFromUrl(url);

      if (!idToken) {
        return res.status(400).json({
          success: false,
          message: 'The ID token could not be extracted from the URL'
        });
      }

      // Fetch region information with the ID token and authentication token
      const regionInfo = await RiotService.getRegionInfo(idToken, riotToken);

      console.log('✅ REGION INFORMATION TEST COMPLETED SUCCESSFULLY\n');

      return res.json({
        success: true,
        message: 'Region information loaded successfully',
        data: {
          extractedIdToken: idToken.substring(0, 20) + '...', // Expose only the first 20 characters for safety
          regionInfo: regionInfo,
          summary: {
            hasToken: !!regionInfo.token,
            hasAffinities: !!regionInfo.affinities,
            pbeRegion: regionInfo.affinities?.pbe,
            liveRegion: regionInfo.affinities?.live
          }
        }
      });
    } catch (err) {
      console.log('❌ REGION INFORMATION TEST FAILED:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to load region information',
        error: err.message
      });
    }
  }


}

module.exports = RiotController;
