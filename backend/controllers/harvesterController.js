// backend/controllers/harvesterController.js
//
// Status and bootstrap for the shared harvester session (see
// services/riotHarvester.js). It's a GLOBAL resource — one Riot account
// whose session serves live rank/match data for every linked account of
// every user. That's why these routes are admin-only (see adminOnly in
// routes/auth.js): if any user could redo the bootstrap with their own
// cookies, they'd overwrite the shared session for everyone else.
const riotHarvester = require('../services/riotHarvester');

class HarvesterController {
  static async getStatus(req, res) {
    try {
      const status = await riotHarvester.getHarvesterStatus();
      res.json({ success: true, ...status });
    } catch (err) {
      console.error('Error getting harvester status:', err);
      res.status(500).json({ success: false, message: 'Error getting the harvester status' });
    }
  }

  // Manual bootstrap — see the runbook: log into a normal browser already
  // signed into the harvester account, copy the final redirect URL (carries
  // the access_token) and, so it lasts weeks instead of ~1h, the
  // auth.riotgames.com cookies (ssid/asid/clid/tdid) from DevTools.
  static async bootstrap(req, res) {
    try {
      const { url, cookies } = req.body;
      if (!url) {
        return res.status(400).json({ success: false, message: 'Missing URL' });
      }
      await riotHarvester.bootstrapHarvesterFromUrl(url, cookies);
      res.json({ success: true, state: 'ready' });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = HarvesterController;
