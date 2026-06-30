const RiotService = require('../services/riotService');
const User = require('../models/User');

class RiotController {
  static async getSkins(req, res) {
    const { riotToken } = req.body;
    
    if (!riotToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Falta el token de Riot' 
      });
    }

    try {
      const userinfo = await RiotService.getUserInfo(riotToken);
      const puuid = userinfo.sub;
      
      if (!puuid) {
        return res.status(400).json({ 
          success: false, 
          message: 'No se pudo obtener el PUUID' 
        });
      }

      const entitlementData = await RiotService.getEntitlementToken(riotToken);
      const entitlementToken = entitlementData.entitlements_token;
      
      if (!entitlementToken) {
        return res.status(400).json({ 
          success: false, 
          message: 'No se pudo obtener el entitlement token' 
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
      console.error('Error en el flujo de Riot:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error en el flujo de Riot' 
      });
    }
  }

  static async getSkinDetails(req, res) {
    const { itemIDs } = req.body;
    
    if (!itemIDs || !Array.isArray(itemIDs)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan los itemIDs' 
      });
    }

    try {
      const skinLevels = await RiotService.getSkinDetails(itemIDs);
      res.json({ success: true, skinLevels });
    } catch (err) {
      console.error('Error obteniendo detalles de skinlevels:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Error obteniendo detalles de skinlevels' 
      });
    }
  }

  static async getLoadout(req, res) {
    const { riotToken, puuid, entitlementToken } = req.body;
    
    if (!riotToken || !puuid || !entitlementToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan datos requeridos' 
      });
    }

    try {
      const loadoutData = await RiotService.getLoadout(puuid, entitlementToken, riotToken);
      res.json({ success: true, loadout: loadoutData });
    } catch (err) {
      console.error('Error obteniendo loadout:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Error obteniendo loadout' 
      });
    }
  }

  static async addRiotAccount(req, res) {
    const { name, riotToken, url } = req.body;
    
    if (!riotToken) {
      return res.status(400).json({
        success: false,
        message: 'Falta el token de Riot'
      });
    }

    if (!url) {
      return res.status(400).json({ 
        success: false, 
        message: 'Falta la URL con el ID Token' 
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
          message: 'No se pudo obtener el PUUID' 
        });
      }

      const entitlementData = await RiotService.getEntitlementToken(riotToken);
      const entitlementToken = entitlementData.entitlements_token;
      
      if (!entitlementToken) {
        return res.status(400).json({ 
          success: false, 
          message: 'No se pudo obtener el entitlement token' 
        });
      }

      // Extraer ID Token de la URL
      console.log('\n🚀 OBTENIENDO INFORMACIÓN DE REGIÓN...');
      const idToken = RiotService.extractIdTokenFromUrl(url);
      
      if (!idToken) {
        return res.status(400).json({ 
          success: false, 
          message: 'No se pudo extraer el ID Token de la URL' 
        });
      }

      // Obtener datos iniciales incluyendo información de región
      const [skinsData, loadoutData, buddiesData, battlePassesData, cardsData, spraysData, titlesData, agentsData, walletData, flexData, userInfoData, regionInfo] = await Promise.all([
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
        RiotService.getRegionInfo(idToken, riotToken)
      ]);

      // Console.log destacado para mostrar la respuesta del endpoint de región
      console.log('\n' + '='.repeat(80));
      console.log('🌍🌍🌍 RESPUESTA DEL ENDPOINT RIOT GEO AL AGREGAR CUENTA 🌍🌍🌍');
      console.log('='.repeat(80));
      console.log('📊 RESPUESTA COMPLETA:', JSON.stringify(regionInfo, null, 2));
      console.log('📋 TOKEN:', regionInfo.token || 'NO DISPONIBLE');
      console.log('🌎 REGIÓN PBE:', regionInfo.affinities?.pbe || 'NO DISPONIBLE');
      console.log('🌎 REGIÓN LIVE:', regionInfo.affinities?.live || 'NO DISPONIBLE');
      console.log('='.repeat(80) + '\n');

      // DEBUG WALLET - Similar a como debuggeamos battlepass y buddies
      console.log('💰 [RiotController] ===== DEBUG WALLET =====');
      console.log('💰 [RiotController] Wallet data completo:', JSON.stringify(walletData, null, 2));
      console.log('💰 [RiotController] ¿Tiene Balances?', 'Balances' in walletData);

      // DEBUG FLEX - Mostrar datos de flex en consola
      console.log('🏆 [RiotController] ===== DEBUG FLEX =====');
      console.log('🏆 [RiotController] Flex data completo:', JSON.stringify(flexData, null, 2));
      console.log('🏆 [RiotController] ¿Tiene Entitlements?', 'Entitlements' in flexData);

      // DEBUG USERINFO - Mostrar datos de userinfo en consola
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
        console.log('💰 [RiotController] No hay balances o no es un objeto');
      }
      console.log('💰 [RiotController] ===== FIN DEBUG WALLET =====');

      // Obtener detalles de las monedas
      let currencyDetails = [];
      if (walletData.Balances && typeof walletData.Balances === 'object') {
        const currencyIds = Object.keys(walletData.Balances);
        console.log('💰 [RiotController] Obteniendo detalles de monedas para IDs:', currencyIds);
        currencyDetails = await RiotService.getCurrencyDetails(currencyIds);
        console.log('💰 [RiotController] Detalles de monedas obtenidos:', currencyDetails.length);
      }


      // Obtener detalles de las cards, sprays, titles, agents y buddies
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

      // Verificar que la cuenta no esté ya agregada
      const alreadyExists = req.user.riotAccounts.some(acc => acc.puuid === puuid);
      if (alreadyExists) {
        return res.status(400).json({
          success: false,
          message: 'Esta cuenta de Riot ya fue agregada anteriormente.'
        });
      }

      // Agregar la cuenta al usuario
      const newAccount = {
        name: accountName,
        puuid,
        nickname,
        loadout: loadoutData,
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

      // Console.log para confirmar que regionInfo se guardó en la DB
      console.log('\n' + '='.repeat(60));
      console.log('💾 REGION INFO GUARDADA EN LA BASE DE DATOS 💾');
      console.log('='.repeat(60));
      console.log('📊 RegionInfo guardado:', JSON.stringify(regionInfo, null, 2));
      console.log('🌎 Región Live:', regionInfo?.affinities?.live);
      console.log('🌎 Región PBE:', regionInfo?.affinities?.pbe);
      console.log('='.repeat(60) + '\n');

      res.json({ 
        success: true, 
        message: 'Cuenta Riot agregada exitosamente',
        account: newAccount
      });
    } catch (err) {
      console.error('Error agregando cuenta Riot:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Error agregando cuenta Riot' 
      });
    }
  }

  static async refreshAccount(req, res) {
    const { puuid, riotToken, url } = req.body;
    
    if (!puuid || !riotToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan datos requeridos (puuid y riotToken)' 
      });
    }

    if (!url) {
      return res.status(400).json({ 
        success: false, 
        message: 'Falta la URL con el ID Token' 
      });
    }

    try {
      const account = req.user.riotAccounts.find(acc => acc.puuid === puuid);
      if (!account) {
        return res.status(404).json({ 
          success: false, 
          message: 'Cuenta Riot no encontrada' 
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
          message: 'El token no corresponde a esta cuenta' 
        });
      }

      const entitlementData = await RiotService.getEntitlementToken(riotToken);
      const entitlementToken = entitlementData.entitlements_token;

      // Extraer ID Token de la URL para obtener información de región
      console.log('\n🚀 OBTENIENDO INFORMACIÓN DE REGIÓN (REFRESH)...');
      const idToken = RiotService.extractIdTokenFromUrl(url);
      
      if (!idToken) {
        return res.status(400).json({ 
          success: false, 
          message: 'No se pudo extraer el ID Token de la URL' 
        });
      }

      // Obtener datos actualizados incluyendo información de región
      const [skinsData, loadoutData, buddiesData, battlePassesData, cardsData, spraysData, titlesData, agentsData, walletData, flexData, userInfoData, regionInfo] = await Promise.all([
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
        RiotService.getRegionInfo(idToken, riotToken)
      ]);

      // Console.log destacado para mostrar la respuesta del endpoint de región
      console.log('\n' + '='.repeat(80));
      console.log('🌍🌍🌍 RESPUESTA DEL ENDPOINT RIOT GEO AL ACTUALIZAR CUENTA 🌍🌍🌍');
      console.log('='.repeat(80));
      console.log('📊 RESPUESTA COMPLETA:', JSON.stringify(regionInfo, null, 2));
      console.log('📋 TOKEN:', regionInfo.token || 'NO DISPONIBLE');
      console.log('🌎 REGIÓN PBE:', regionInfo.affinities?.pbe || 'NO DISPONIBLE');
      console.log('🌎 REGIÓN LIVE:', regionInfo.affinities?.live || 'NO DISPONIBLE');
      console.log('='.repeat(80) + '\n');

      // DEBUG WALLET - Similar a como debuggeamos battlepass y buddies
      console.log('💰 [RiotController] ===== DEBUG WALLET (REFRESH) =====');
      console.log('💰 [RiotController] Wallet data completo:', JSON.stringify(walletData, null, 2));
      console.log('💰 [RiotController] ¿Tiene Balances?', 'Balances' in walletData);

      // DEBUG FLEX - Mostrar datos de flex en consola (REFRESH)
      console.log('🏆 [RiotController] ===== DEBUG FLEX (REFRESH) =====');
      console.log('🏆 [RiotController] Flex data completo:', JSON.stringify(flexData, null, 2));
      console.log('🏆 [RiotController] ¿Tiene Entitlements?', 'Entitlements' in flexData);

      // DEBUG USERINFO - Mostrar datos de userinfo en consola (REFRESH)
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
        console.log('💰 [RiotController] No hay balances o no es un objeto');
      }
      console.log('💰 [RiotController] ===== FIN DEBUG WALLET (REFRESH) =====');

      // Obtener detalles de las monedas
      let currencyDetails = [];
      if (walletData.Balances && typeof walletData.Balances === 'object') {
        const currencyIds = Object.keys(walletData.Balances);
        console.log('💰 [RiotController] Obteniendo detalles de monedas para IDs:', currencyIds);
        currencyDetails = await RiotService.getCurrencyDetails(currencyIds);
        console.log('💰 [RiotController] Detalles de monedas obtenidos:', currencyDetails.length);
      }

      // Obtener detalles de las cards, sprays, titles, agents y buddies
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

      // Actualizar la cuenta
      account.name = userinfo.preferred_username || userinfo.acct?.game_name || nickname;
      account.nickname = nickname;
      account.loadout = loadoutData;
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

      // Console.log para confirmar que regionInfo se actualizó en la DB
      console.log('\n' + '='.repeat(60));
      console.log('💾 REGION INFO ACTUALIZADA EN LA BASE DE DATOS 💾');
      console.log('='.repeat(60));
      console.log('📊 RegionInfo actualizado:', JSON.stringify(regionInfo, null, 2));
      console.log('🌎 Región Live:', regionInfo?.affinities?.live);
      console.log('🌎 Región PBE:', regionInfo?.affinities?.pbe);
      console.log('='.repeat(60) + '\n');

      res.json({ 
        success: true, 
        message: 'Cuenta Riot actualizada exitosamente',
        account
      });
    } catch (err) {
      console.error('Error actualizando cuenta Riot:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Error actualizando cuenta Riot' 
      });
    }
  }

  static async removeRiotAccount(req, res) {
    const { puuid } = req.params;
    
    try {
      // Buscar la cuenta por puuid en lugar de accountId
      const accountIndex = req.user.riotAccounts.findIndex(acc => acc.puuid === puuid);
      
      if (accountIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          message: 'Cuenta Riot no encontrada' 
        });
      }

      // Eliminar la cuenta usando el índice
      req.user.riotAccounts.splice(accountIndex, 1);
      await req.user.save();

      res.json({ 
        success: true, 
        message: 'Cuenta Riot eliminada exitosamente' 
      });
    } catch (err) {
      console.error('Error eliminando cuenta Riot:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Error eliminando cuenta Riot' 
      });
    }
  }

  static async getSprayDetails(req, res) {
    const { itemIDs } = req.body;
    
    if (!itemIDs || !Array.isArray(itemIDs)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan los itemIDs' 
      });
    }

    try {
      const sprayDetails = await RiotService.getSprayDetails(itemIDs);
      res.json({ success: true, sprayDetails });
    } catch (err) {
      console.error('Error obteniendo detalles de sprays:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Error obteniendo detalles de sprays' 
      });
    }
  }

  static async getTitleDetails(req, res) {
    const { itemIDs } = req.body;
    
    if (!itemIDs || !Array.isArray(itemIDs)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan los itemIDs' 
      });
    }

    try {
      const titleDetails = await RiotService.getTitleDetails(itemIDs);
      res.json({ success: true, titleDetails });
    } catch (err) {
      console.error('Error obteniendo detalles de titles:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Error obteniendo detalles de titles' 
      });
    }
  }

  // Endpoint de prueba para verificar sprays
  static async testSprays(req, res) {
    const { riotToken } = req.body;
    
    if (!riotToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Falta el token de Riot' 
      });
    }

    try {
      const userinfo = await RiotService.getUserInfo(riotToken);
      const puuid = userinfo.sub;
      
      if (!puuid) {
        return res.status(400).json({ 
          success: false, 
          message: 'No se pudo obtener el PUUID' 
        });
      }

      const entitlementData = await RiotService.getEntitlementToken(riotToken);
      const entitlementToken = entitlementData.entitlements_token;
      
      if (!entitlementToken) {
        return res.status(400).json({ 
          success: false, 
          message: 'No se pudo obtener el entitlement token' 
        });
      }

      // Probar con diferentes IDs de entitlement para sprays
      const sprayEntitlementIDs = [
        '4e60e748-bce6-4faa-9327-ebbe6089d5fe', // ID actual
        'd5f120f8-ff8c-4aac-8ea3-4e9b8f2b3c4d', // ID anterior
        'f85cb6f7-33e5-4dc8-b609-ec7212301948', // ID de battle passes (para comparar)
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
          console.log(`🎨 [TestSprays] Resultado para ${entitlementID}:`, results[entitlementID]);
        } catch (error) {
          results[entitlementID] = {
            error: error.message
          };
        }
      }

      // Usar el ID que funcione mejor
      const bestResult = Object.entries(results).find(([id, result]) => 
        result.entitlementsCount > 0
      );
      
      let spraysData = results['4e60e748-bce6-4faa-9327-ebbe6089d5fe'].data;
      if (bestResult) {
        spraysData = bestResult[1].data;
        console.log(`🎨 [TestSprays] Usando mejor resultado: ${bestResult[0]} con ${bestResult[1].entitlementsCount} sprays`);
      }
      
      // Obtener detalles de los sprays si hay alguno
      let spraysWithDetails = [];
      if (spraysData.Entitlements && spraysData.Entitlements.length > 0) {
        console.log('🎨 [TestSprays] Sprays encontrados:', spraysData.Entitlements.length);
        console.log('🎨 [TestSprays] Primer spray:', spraysData.Entitlements[0]);
        const sprayIDs = spraysData.Entitlements.map(spray => spray.ItemID);
        console.log('🎨 [TestSprays] IDs de sprays:', sprayIDs);
        spraysWithDetails = await RiotService.getSprayDetails(sprayIDs);
        console.log('🎨 [TestSprays] Sprays con detalles:', spraysWithDetails);
      } else {
        console.log('🎨 [TestSprays] No se encontraron sprays');
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
      console.error('Error en el test de sprays:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error en el test de sprays',
        error: err.message 
      });
    }
  }

    // Endpoint para probar la API de Valorant directamente
  static async testValorantAPI(req, res) {
    const { itemID } = req.body;
    
    if (!itemID) {
      return res.status(400).json({ 
        success: false, 
        message: 'Falta el itemID' 
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
      console.log(`🎨 [TestValorantAPI] Respuesta completa:`, JSON.stringify(data, null, 2));
      
      // Verificar si la respuesta tiene la estructura esperada
      if (data.data) {
        console.log(`🎨 [TestValorantAPI] ✅ Respuesta válida con data`);
        console.log(`🎨 [TestValorantAPI] displayName: ${data.data.displayName}`);
        console.log(`🎨 [TestValorantAPI] fullTransparentIcon: ${data.data.fullTransparentIcon ? 'PRESENTE' : 'AUSENTE'}`);
      } else {
        console.log(`🎨 [TestValorantAPI] ❌ Respuesta sin data`);
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
        message: 'Error probando API de Valorant',
        error: err.message 
      });
    }
  }

  // Endpoint para obtener nombres de jugadores usando Name Service
  static async getNameService(req, res) {
    const { puuids, riotToken } = req.body;
    
    if (!puuids || !Array.isArray(puuids)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan los PUUIDs (debe ser un array)' 
      });
    }

    if (!riotToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Falta el token de Riot' 
      });
    }

    try {
      // Obtener entitlement token
      const entitlementData = await RiotService.getEntitlementToken(riotToken);
      const entitlementToken = entitlementData.entitlements_token;
      
      if (!entitlementToken) {
        return res.status(400).json({ 
          success: false, 
          message: 'No se pudo obtener el entitlement token' 
        });
      }

      // Llamar al Name Service
      const nameServiceData = await RiotService.getNameService(puuids, entitlementToken, riotToken);
      
      return res.json({ 
        success: true, 
        names: nameServiceData
      });
    } catch (err) {
      console.error('Error obteniendo nombres de jugadores:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error obteniendo nombres de jugadores',
        error: err.message
      });
    }
  }

  static async getUserInfoDetailed(req, res) {
    const { riotToken } = req.body;
    
    if (!riotToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Falta el token de Riot' 
      });
    }

    try {
      console.log('👤 [RiotController] ===== OBTENIENDO USERINFO DETALLADO =====');
      console.log('👤 [RiotController] Token recibido:', riotToken ? riotToken.substring(0, 20) + '...' : 'No disponible');
      
      const userInfoData = await RiotService.getUserInfoDetailed(riotToken);
      
      console.log('👤 [RiotController] UserInfo obtenido exitosamente');
      console.log('👤 [RiotController] ===== FIN OBTENIENDO USERINFO DETALLADO =====');
      
      return res.json({ 
        success: true, 
        userInfo: userInfoData
      });
    } catch (err) {
      console.error('👤 [RiotController] Error obteniendo userinfo detallado:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error obteniendo información del usuario',
        error: err.message
      });
    }
  }

  // Endpoint para probar la extracción de ID Token y obtener información de región
  static async testRegionInfo(req, res) {
    const { url, riotToken } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        success: false, 
        message: 'Falta la URL con el ID Token' 
      });
    }

    if (!riotToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Falta el token de Riot (auth token)' 
      });
    }

    try {
      console.log('\n🚀 INICIANDO TEST DE REGIÓN INFO');
      
      // 1. Extraer ID Token de la URL
      const idToken = RiotService.extractIdTokenFromUrl(url);
      
      if (!idToken) {
        return res.status(400).json({ 
          success: false, 
          message: 'No se pudo extraer el ID Token de la URL' 
        });
      }
      
      // 2. Obtener información de región usando el ID Token y auth token
      const regionInfo = await RiotService.getRegionInfo(idToken, riotToken);
      
      console.log('✅ TEST DE REGIÓN INFO COMPLETADO EXITOSAMENTE\n');
      
      return res.json({ 
        success: true,
        message: 'Información de región obtenida exitosamente',
        data: {
          extractedIdToken: idToken.substring(0, 20) + '...', // Mostrar solo los primeros 20 caracteres por seguridad
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
      console.log('❌ ERROR EN TEST DE REGIÓN INFO:', err.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Error obteniendo información de región',
        error: err.message
      });
    }
  }


}

module.exports = RiotController; 