// backend/middleware/adminOnly.js
//
// Gates routes that touch GLOBAL/shared resources across every user (for
// now: the harvester session used for live rank/match data, see
// controllers/harvesterController.js). Must run AFTER authMiddleware (needs
// req.user already resolved). Uses the isAdmin flag on User — unlike the
// sibling ValoInventory project (which hardcodes the admin's username since
// it has no role field), this one already has isAdmin on the schema.
module.exports = function adminOnly(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ success: false, message: 'Only an admin can do this' });
  }
  next();
};
