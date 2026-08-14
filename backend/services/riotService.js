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
