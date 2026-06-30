const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const RiotController = require('../controllers/riotController');
const authMiddleware = require('../middleware/auth');

// Rutas de autenticación
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/profile', authMiddleware, AuthController.getProfile);

// Rutas de Riot API (sin autenticación)
router.post('/riot/skins', RiotController.getSkins);
router.post('/riot/skins/details', RiotController.getSkinDetails);
router.post('/riot/loadout', RiotController.getLoadout);
router.post('/riot/sprays/details', RiotController.getSprayDetails);
router.post('/riot/titles/details', RiotController.getTitleDetails);
router.post('/riot/name-service', RiotController.getNameService);
router.post('/riot/userinfo-detailed', RiotController.getUserInfoDetailed);
router.post('/riot/test-sprays', RiotController.testSprays);
router.post('/riot/test-valorant-api', RiotController.testValorantAPI);
router.post('/riot/test-region-info', RiotController.testRegionInfo);


// Rutas de Riot API (con autenticación)
router.post('/riot/account', authMiddleware, RiotController.addRiotAccount);
router.post('/riot/account/refresh', authMiddleware, RiotController.refreshAccount);
router.delete('/riot/account/:puuid', authMiddleware, RiotController.removeRiotAccount);

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route funcionando!' });
});

// Endpoint público para ver el inventario de una cuenta compartida (sin auth)
router.get('/public/account/:puuid', async (req, res) => {
  try {
    const User = require('../models/User');
    const { puuid } = req.params;
    const user = await User.findOne({ 'riotAccounts.puuid': puuid });
    if (!user) return res.json({ success: false, message: 'Link inválido o no disponible' });

    const account = user.riotAccounts.find(a => a.puuid === puuid);
    if (!account || !account.isShared) {
      return res.json({ success: false, message: 'Link inválido o no disponible' });
    }

    return res.json({
      success: true,
      account: {
        name: account.name,
        nickname: account.nickname,
        puuid: account.puuid,
        skins: account.skins || [],
        buddies: account.buddies || [],
        battlePasses: account.battlePasses || [],
        cards: account.cards || [],
        sprays: account.sprays || [],
        titles: account.titles || [],
        agents: account.agents || [],
        flex: account.flex || {},
        lastUpdated: account.lastUpdated,
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error obteniendo los datos' });
  }
});

// Activar compartir una cuenta (auth requerida)
router.post('/share/:puuid', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const { puuid } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.json({ success: false, message: 'Usuario no encontrado' });

    const account = user.riotAccounts.find(a => a.puuid === puuid);
    if (!account) return res.json({ success: false, message: 'Cuenta no encontrada' });

    if (!account.isShared) {
      const activeShares = user.riotAccounts.filter(a => a.isShared).length;
      if (activeShares >= 30) {
        return res.json({ success: false, message: 'Límite de 30 links activos alcanzado. Dá de baja alguno antes de compartir otro.' });
      }
      account.isShared = true;
      account.sharedAt = new Date();
      await user.save();
    }

    return res.json({ success: true, sharedAt: account.sharedAt });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error al activar el link' });
  }
});

// Desactivar compartir una cuenta (auth requerida)
router.delete('/share/:puuid', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const { puuid } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.json({ success: false, message: 'Usuario no encontrado' });

    const account = user.riotAccounts.find(a => a.puuid === puuid);
    if (!account) return res.json({ success: false, message: 'Cuenta no encontrada' });

    account.isShared = false;
    account.sharedAt = null;
    await user.save();

    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error al revocar el link' });
  }
});

module.exports = router; 