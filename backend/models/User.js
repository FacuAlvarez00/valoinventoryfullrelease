const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
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