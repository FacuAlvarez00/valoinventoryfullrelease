const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const RiotController = require('../controllers/riotController');
const authMiddleware = require('../middleware/auth');

// Authentication routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/profile', authMiddleware, AuthController.getProfile);

// Public Riot API routes
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


// Authenticated Riot API routes
router.post('/riot/account', authMiddleware, RiotController.addRiotAccount);
router.post('/riot/account/refresh', authMiddleware, RiotController.refreshAccount);
router.delete('/riot/account/:puuid', authMiddleware, RiotController.removeRiotAccount);

// Diagnostic route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working!' });
});

// Public inventory endpoint for a shared account
router.get('/public/account/:puuid', async (req, res) => {
  try {
    const User = require('../models/User');
    const { puuid } = req.params;
    const user = await User.findOne({ 'riotAccounts.puuid': puuid });
    if (!user) return res.json({ success: false, message: 'Invalid or unavailable link' });

    const account = user.riotAccounts.find(a => a.puuid === puuid);
    if (!account || !account.isShared) {
      return res.json({ success: false, message: 'Invalid or unavailable link' });
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
    return res.status(500).json({ success: false, message: 'Failed to load account data' });
  }
});

// Enable account sharing
router.post('/share/:puuid', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const { puuid } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.json({ success: false, message: 'User not found' });

    const account = user.riotAccounts.find(a => a.puuid === puuid);
    if (!account) return res.json({ success: false, message: 'Account not found' });

    if (!account.isShared) {
      const activeShares = user.riotAccounts.filter(a => a.isShared).length;
      if (activeShares >= 30) {
        return res.json({ success: false, message: 'The limit of 30 active links has been reached. Revoke one before sharing another account.' });
      }
      account.isShared = true;
      account.sharedAt = new Date();
      await user.save();
    }

    return res.json({ success: true, sharedAt: account.sharedAt });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to enable the share link' });
  }
});

// Disable account sharing
router.delete('/share/:puuid', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const { puuid } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.json({ success: false, message: 'User not found' });

    const account = user.riotAccounts.find(a => a.puuid === puuid);
    if (!account) return res.json({ success: false, message: 'Account not found' });

    account.isShared = false;
    account.sharedAt = null;
    await user.save();

    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to revoke the share link' });
  }
});

module.exports = router;
