const mongoose = require('mongoose');

// Subscription tiers, lowest to highest. Kept as an ordered array (not just
// the enum) so tier comparisons ("does this user have at least X") can use
// the index instead of hardcoding an order elsewhere.
const SUBSCRIPTION_TIERS = ['free', 'immortal', 'radiant'];

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Subscription tier — gates features once those are defined per tier.
  // Separate from isAdmin: admin is a role/permission, tier is what they're
  // paying for; today's admin account happens to carry both.
  subscriptionTier: { type: String, enum: SUBSCRIPTION_TIERS, default: 'free' },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  riotAccounts: [
    {
      name: { type: String, required: true },
      puuid: { type: String, required: true },
      nickname: { type: String },
      loadout: { type: Object },
      accountLevel: { type: Number, default: null },
      rank: { type: Object, default: null },
      penalties: { type: Array, default: [] },
      skins: { type: Array },
      buddies: { type: Array, default: [] },
      battlePasses: { type: Array, default: [] },
      cards: { type: Array, default: [] },
      sprays: { type: Array, default: [] },
      titles: { type: Array, default: [] },
      agents: { type: Array, default: [] },
      wallet: { type: Object, default: {} },
      currencyDetails: { type: Array, default: [] },
      flex: { type: Object, default: {} },
      userInfo: { type: Object, default: {} },
      regionInfo: { type: Object, default: {} },
      lastUpdated: { type: Date, default: Date.now },
      shareToken: { type: String, default: null },
      isShared: { type: Boolean, default: false },
      sharedAt: { type: Date, default: null }
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
module.exports.SUBSCRIPTION_TIERS = SUBSCRIPTION_TIERS;
