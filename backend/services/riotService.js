const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
const { RIOT_HEADERS, RIOT_ENDPOINTS, RIOT_ENTITLEMENT_IDS } = require('../config/constants');

class RiotService {
  static async getValorantVersion() {
    console.log('🔄 [RiotService] ===== OBTENIENDO VERSIÓN DE VALORANT API =====');
    try {
      const response = await fetch('https://valorant-api.com/v1/version');
      const data = await response.json();
      console.log('🔄 [RiotService] Respuesta completa de valorant-api.com:', JSON.stringify(data, null, 2));
      
      if (data.status === 200 && data.data) {
        const version = data.data.riotClientVersion;
        console.log('🔄 [RiotService] Versión extraída:', version);
        console.log('🔄 [RiotService] ===== FIN OBTENIENDO VERSIÓN =====');
        return version;
      } else {
        console.log('🔄 [RiotService] Error en respuesta de valorant-api.com');
        return 'B312378013F36E38'; // Fallback al valor hardcodeado
      }
    } catch (error) {
      console.error('🔄 [RiotService] Error obteniendo versión de Valorant:', error);
      return 'B312378013F36E38'; // Fallback al valor hardcodeado
    }
  }

  static async getUserInfo(riotToken) {
    const response = await fetch(RIOT_ENDPOINTS.USER_INFO, {
      headers: { Authorization: `Bearer ${riotToken}` }
    });
    return response.json();
  }

  static async getUserInfoDetailed(riotToken) {
    console.log('👤 [RiotService] ===== OBTENIENDO USERINFO DETALLADO =====');
    console.log('👤 [RiotService] Token:', riotToken ? riotToken.substring(0, 20) + '...' : 'No disponible');
    console.log('👤 [RiotService] URL:', RIOT_ENDPOINTS.USER_INFO);
    
    try {
      const response = await fetch(RIOT_ENDPOINTS.USER_INFO, {
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${riotToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('👤 [RiotService] Status de respuesta:', response.status);
      console.log('👤 [RiotService] Headers de respuesta:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('👤 [RiotService] Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('👤 [RiotService] Respuesta completa de userinfo:', JSON.stringify(data, null, 2));
      console.log('👤 [RiotService] ===== FIN OBTENIENDO USERINFO DETALLADO =====');
      
      return data;
    } catch (error) {
      console.error('👤 [RiotService] Error obteniendo userinfo detallado:', error);
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
    // Primero obtenemos todos los gunbuddies disponibles de la API pública
    const allBuddiesResponse = await fetch('https://valorant-api.com/v1/buddies');
    const allBuddiesData = await allBuddiesResponse.json();
    const allBuddies = allBuddiesData.data || [];
    
    const promises = itemIDs.map(async (itemID) => {
      try {
        // Buscar el gunbuddy padre que contiene este nivel
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
            // Información del nivel específico que posee el usuario
            ownedLevel: parentBuddy.levels.find(level => level.uuid === itemID)
          };
        } else {
          // Si no encontramos el padre, intentamos obtener el nivel directamente
          const response = await fetch(`https://valorant-api.com/v1/buddylevels/${itemID}`);
          const data = await response.json();
          
          if (data.data) {
            return {
              ItemID: itemID,
              displayName: data.data.displayName || 'Gunbuddy Desconocido',
              displayIcon: data.data.displayIcon || null,
              uuid: data.data.uuid,
              charmLevel: data.data.charmLevel,
              hideIfNotOwned: data.data.hideIfNotOwned
            };
          } else {
            return { ItemID: itemID, displayName: 'Gunbuddy Desconocido' };
          }
        }
      } catch (error) {
        console.error(`Error obteniendo detalles de gunbuddy ${itemID}:`, error);
        return { ItemID: itemID, displayName: 'Gunbuddy Desconocido' };
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
      console.error('Error obteniendo sprays:', error);
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
    console.log('🏆 [RiotService] ===== OBTENIENDO FLEX DEL USUARIO =====');
    console.log('🏆 [RiotService] PUUID:', puuid);
    console.log('🏆 [RiotService] URL completa:', `${RIOT_ENDPOINTS.FLEX}/${puuid}/${RIOT_ENTITLEMENT_IDS.FLEX}`);
    
    try {
      const response = await fetch(`${RIOT_ENDPOINTS.FLEX}/${puuid}/${RIOT_ENTITLEMENT_IDS.FLEX}`, {
        headers: {
          ...RIOT_HEADERS,
          'X-Riot-Entitlements-JWT': entitlementToken,
          Authorization: `Bearer ${riotToken}`
        }
      });
      
      console.log('🏆 [RiotService] Status de respuesta:', response.status);
      console.log('🏆 [RiotService] Headers de respuesta:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('🏆 [RiotService] Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('🏆 [RiotService] Respuesta completa de flex:', JSON.stringify(data, null, 2));
      console.log('🏆 [RiotService] ===== FIN OBTENIENDO FLEX DEL USUARIO =====');
      
      return data;
    } catch (error) {
      console.error('🏆 [RiotService] Error obteniendo flex:', error);
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
          displayName: data.data?.displayName || 'Card Desconocida',
          largeArt: data.data?.largeArt || null,
          smallArt: data.data?.smallArt || null,
          wideArt: data.data?.wideArt || null
        };
      } catch (error) {
        console.error(`Error obteniendo detalles de card ${id}:`, error);
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
          console.log(`🔍 [RiotService] Procesando skin: ${data.data.displayName}`);
          // Excepción especial para el skin "VCT LOCK//IN Misericórdia"
          if (data.data.displayName === 'VCT LOCK//IN Misericórdia') {
            console.log('🎯 [RiotService] ¡ENCONTRADO! Aplicando excepción de precio para VCT LOCK//IN Misericórdia: 5440');
            // Asignar precio personalizado de 5440
            data.data.customPrice = 5440;
            data.data.priceDisplayName = '5440 VP';
            console.log('✅ [RiotService] Precio asignado:', data.data.customPrice, data.data.priceDisplayName);
          }
        }
        
        return data.data;
      } catch (error) {
        console.error(`Error obteniendo detalles de skin ${id}:`, error);
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
          displayName: data.data?.displayName || 'Spray Desconocido',
          displayIcon: data.data?.displayIcon || null,
          fullTransparentIcon: data.data?.fullTransparentIcon || null,
          category: data.data?.category || null
        };
      } catch (error) {
        console.error(`Error obteniendo detalles de spray ${itemID}:`, error);
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
          displayName: data.data?.displayName || 'Título Desconocido',
          titleText: data.data?.titleText || null,
          category: data.data?.category || null
        };
      } catch (error) {
        console.error(`Error obteniendo detalles de título ${itemID}:`, error);
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
          displayName: data.data?.displayName || 'Agente Desconocido',
          displayIcon: data.data?.displayIcon || null,
          fullPortrait: data.data?.fullPortraitV2 || null,
          role: data.data?.role?.displayName || null,
          description: data.data?.description || null
        };
        
        return result;
      } catch (error) {
        console.error(`Error obteniendo detalles de agente ${itemID}:`, error);
        return { ItemID: itemID };
      }
    });
    
    const results = await Promise.all(promises);
    return results;
  }

  static async getNameService(puuids, entitlementToken, riotToken) {
    console.log('📝 [RiotService] ===== OBTENIENDO NOMBRES DE JUGADORES =====');
    console.log('📝 [RiotService] PUUIDs recibidos:', puuids);
    
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
      
      console.log('📝 [RiotService] Status de respuesta:', response.status);
      console.log('📝 [RiotService] Headers de respuesta:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📝 [RiotService] Respuesta completa:', JSON.stringify(data, null, 2));
      console.log('📝 [RiotService] ===== FIN OBTENIENDO NOMBRES DE JUGADORES =====');
      
      return data;
    } catch (error) {
      console.error('📝 [RiotService] Error obteniendo nombres de jugadores:', error);
      throw error;
    }
  }

  static async getWallet(puuid, entitlementToken, riotToken) {
    console.log('💰 [RiotService] ===== OBTENIENDO WALLET DEL USUARIO =====');
    console.log('💰 [RiotService] PUUID:', puuid);
    console.log('💰 [RiotService] URL completa:', `${RIOT_ENDPOINTS.WALLET}/${puuid}`);
    
    // Obtener versión dinámica de Valorant API
    const dynamicVersion = await this.getValorantVersion();
    console.log('💰 [RiotService] Usando versión dinámica:', dynamicVersion);
    
    // Crear headers con versión dinámica
    const dynamicHeaders = {
      ...RIOT_HEADERS,
      'X-Riot-ClientVersion': dynamicVersion,
      'X-Riot-Entitlements-JWT': entitlementToken,
      'Authorization': `Bearer ${riotToken}`
    };
    
    console.log('💰 [RiotService] Headers enviados:', {
      'X-Riot-ClientPlatform': dynamicHeaders['X-Riot-ClientPlatform'] ? 'PRESENT' : 'MISSING',
      'X-Riot-ClientVersion': dynamicHeaders['X-Riot-ClientVersion'],
      'X-Riot-Entitlements-JWT': entitlementToken ? 'PRESENT' : 'MISSING',
      'Authorization': riotToken ? 'PRESENT' : 'MISSING'
    });
    
    try {
      console.log('💰 [RiotService] Haciendo petición GET a:', `${RIOT_ENDPOINTS.WALLET}/${puuid}`);
      console.log('💰 [RiotService] Headers completos:', JSON.stringify(dynamicHeaders, null, 2));
      
      const response = await fetch(`${RIOT_ENDPOINTS.WALLET}/${puuid}`, {
        method: 'GET',
        headers: dynamicHeaders
      });
      
      console.log('💰 [RiotService] Status de respuesta:', response.status);
      console.log('💰 [RiotService] Headers de respuesta:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('💰 [RiotService] Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('💰 [RiotService] Respuesta completa de wallet:', JSON.stringify(data, null, 2));
      console.log('💰 [RiotService] Datos que vamos a traer:', {
        Balances: data.Balances ? `${data.Balances.length} balances encontrados` : 'No hay balances',
        WalletData: data
      });
      console.log('💰 [RiotService] ===== FIN OBTENIENDO WALLET DEL USUARIO =====');
      
      return data;
    } catch (error) {
      console.error('💰 [RiotService] Error obteniendo wallet:', error);
      throw error;
    }
  }

  static async getCurrencyDetails(currencyIds) {
    try {
      console.log('💰 [RiotService] ===== OBTENIENDO DETALLES DE MONEDAS =====');
      console.log('💰 [RiotService] Currency IDs:', currencyIds);

      const currencyPromises = currencyIds.map(async (currencyId) => {
        try {
          const response = await fetch(`https://valorant-api.com/v1/currencies/${currencyId}`);
          const data = await response.json();
          
          if (data && data.status === 200 && data.data) {
            console.log(`💰 [RiotService] Moneda obtenida:`, {
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
            console.log(`⚠️ [RiotService] Error obteniendo moneda ${currencyId}:`, data);
            return null;
          }
        } catch (error) {
          console.log(`❌ [RiotService] Error obteniendo moneda ${currencyId}:`, error.message);
          return null;
        }
      });

      const currencyDetails = await Promise.all(currencyPromises);
      const validCurrencies = currencyDetails.filter(currency => currency !== null);
      
      console.log('💰 [RiotService] Monedas obtenidas exitosamente:', validCurrencies.length);
      console.log('💰 [RiotService] ===== FIN OBTENIENDO DETALLES DE MONEDAS =====');
      
      return validCurrencies;
    } catch (error) {
      console.error('❌ [RiotService] Error obteniendo detalles de monedas:', error);
      throw error;
    }
  }

  static extractIdTokenFromUrl(url) {
    try {
      // Buscar el patrón id_token= hasta &token_type=
      const idTokenMatch = url.match(/id_token=([^&]+)&token_type=/);
      
      if (idTokenMatch && idTokenMatch[1]) {
        const idToken = idTokenMatch[1];
        return idToken;
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Error extrayendo ID Token de URL:', error);
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
      
      // Console.log destacado para mostrar claramente la respuesta
      console.log('\n' + '='.repeat(80));
      console.log('🌍🌍🌍 RESPUESTA DEL ENDPOINT RIOT GEO 🌍🌍🌍');
      console.log('='.repeat(80));
      console.log('📊 RESPUESTA COMPLETA:', JSON.stringify(data, null, 2));
      console.log('📋 TOKEN:', data.token || 'NO DISPONIBLE');
      console.log('🌎 REGIÓN PBE:', data.affinities?.pbe || 'NO DISPONIBLE');
      console.log('🌎 REGIÓN LIVE:', data.affinities?.live || 'NO DISPONIBLE');
      console.log('='.repeat(80) + '\n');
      
      return data;
    } catch (error) {
      console.log('\n' + '='.repeat(80));
      console.log('❌❌❌ ERROR EN ENDPOINT RIOT GEO ❌❌❌');
      console.log('='.repeat(80));
      console.log('ERROR:', error.message);
      console.log('='.repeat(80) + '\n');
      throw error;
    }
  }
}

module.exports = RiotService; 