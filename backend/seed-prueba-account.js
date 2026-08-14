// Script puntual: crea una cuenta Riot "prueba" (prueba#test) con TODOS los
// items de cada catálogo (skins, gunbuddies, cards, sprays, titles, agents,
// battlepasses) para usar como cuenta de demo/QA visual.
//
// No pasa por el login real de Riot (imposible fabricar eso) - construye el
// mismo shape que guarda RiotController.addRiotAccount, pero marcando como
// "owned" absolutamente todo lo que devuelve valorant-api.com.
//
// Uso: docker exec valoinventory-backend node seed-prueba-account.js

const mongoose = require('mongoose');
const User = require('./models/User');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo:27017/valoinventory';
const TARGET_USERNAME = process.argv[2] || 'prueba';

async function fetchData(url) {
  const res = await fetch(url);
  const json = await res.json();
  return json.data;
}

async function main() {
  console.log('Conectando a Mongo:', MONGODB_URI.replace(/(\/\/[^:]+:)[^@]+@/, '$1***@'));
  await mongoose.connect(MONGODB_URI);

  const user = await User.findOne({ username: TARGET_USERNAME });
  if (!user) {
    throw new Error(`No existe el usuario "${TARGET_USERNAME}". Registralo primero.`);
  }

  console.log('Descargando catálogos completos de valorant-api.com...');
  const [weaponSkins, buddies, cards, sprays, titles, agents, contracts, flexItems] = await Promise.all([
    fetchData('https://valorant-api.com/v1/weapons/skins'),
    fetchData('https://valorant-api.com/v1/buddies'),
    fetchData('https://valorant-api.com/v1/playercards'),
    fetchData('https://valorant-api.com/v1/sprays'),
    fetchData('https://valorant-api.com/v1/playertitles'),
    fetchData('https://valorant-api.com/v1/agents?isPlayableCharacter=true'),
    fetchData('https://valorant-api.com/v1/contracts'),
    fetchData('https://valorant-api.com/v1/flex'),
  ]);

  // ---- SKINS: una entitlement por skin (uuid del primer nivel = "lo poseés") ----
  const skinsEntitlements = weaponSkins
    .map(skin => skin.levels?.[0]?.uuid)
    .filter(Boolean)
    .map(ItemID => ({ ItemID }));

  // ---- GUNBUDDIES: shape enriquecido igual a RiotService.getBuddyDetails ----
  // Riot entrega cada gunbuddy de a 2 (una entitlement por cada "mitad" del par),
  // así que replicamos esa realidad en vez de guardar una sola copia por buddy.
  const buddiesWithDetails = buddies
    .filter(b => b.levels?.[0]?.uuid)
    .flatMap(b => {
      const entry = {
        ItemID: b.levels[0].uuid,
        displayName: b.displayName,
        displayIcon: b.displayIcon,
        uuid: b.uuid,
        themeUuid: b.themeUuid,
        isHiddenIfNotOwned: b.isHiddenIfNotOwned,
        levels: b.levels,
        ownedLevel: b.levels[0],
      };
      return [{ ...entry }, { ...entry }];
    });

  // ---- CARDS ----
  const cardsWithDetails = cards.map(c => ({
    ItemID: c.uuid,
    displayName: c.displayName,
    largeArt: c.largeArt || null,
    smallArt: c.smallArt || null,
    wideArt: c.wideArt || null,
  }));

  // ---- SPRAYS ----
  const spraysWithDetails = sprays.map(s => ({
    ItemID: s.uuid,
    displayName: s.displayName,
    displayIcon: s.displayIcon || null,
    fullTransparentIcon: s.fullTransparentIcon || null,
    category: s.category || null,
  }));

  // ---- TITLES ----
  const titlesWithDetails = titles.map(t => ({
    ItemID: t.uuid,
    displayName: t.displayName,
    titleText: t.titleText || null,
    category: t.category || null,
  }));

  // ---- AGENTS (solo jugables) ----
  const agentsWithDetails = agents.map(a => ({
    ItemID: a.uuid,
    displayName: a.displayName,
    displayIcon: a.displayIcon || null,
    fullPortrait: a.fullPortraitV2 || a.fullPortrait || null,
    role: a.role?.displayName || null,
    description: a.description || null,
  }));

  // ---- BATTLEPASSES: contratos reales de temporada (excluye "Gear"/"Event") ----
  const battlePassesEntitlements = contracts
    .filter(c => c.content?.relationType === 'Season')
    .map(c => ({ ItemID: c.uuid }));

  // ---- FLEX: todos los flex, excluyendo el "default" (STAT-COM) que la app
  // ya suma aparte como "+1" en totalFlex = 1 + Entitlements.length ----
  const DEFAULT_FLEX_UUID = 'af52b5a0-4a4c-03b2-c9d7-8187a08a2675';
  const flexEntitlements = flexItems
    .filter(f => f.uuid !== DEFAULT_FLEX_UUID)
    .map(f => ({ ItemID: f.uuid }));

  console.log('Totales a guardar:', {
    skins: skinsEntitlements.length,
    buddies: buddiesWithDetails.length,
    cards: cardsWithDetails.length,
    sprays: spraysWithDetails.length,
    titles: titlesWithDetails.length,
    agents: agentsWithDetails.length,
    battlepasses: battlePassesEntitlements.length,
    flex: flexEntitlements.length + 1,
  });

  const puuid = 'prueba-demo-' + Date.now();

  const newAccount = {
    name: 'prueba',
    puuid,
    nickname: 'prueba#test',
    loadout: {
      Guns: [],
      Melee: null,
      Identity: {
        PlayerCardID: cardsWithDetails[0]?.ItemID || null,
        PlayerTitleID: titlesWithDetails[0]?.ItemID || null,
      },
    },
    skins: skinsEntitlements,
    buddies: buddiesWithDetails,
    battlePasses: battlePassesEntitlements,
    cards: cardsWithDetails,
    sprays: spraysWithDetails,
    titles: titlesWithDetails,
    agents: agentsWithDetails,
    wallet: {
      Balances: {
        '85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741': 999999, // VP
        'e59aa87c-4cbf-517a-5983-6e81511be9b7': 99999,  // Radianite
        '85ca954a-41f2-ce94-9b45-8ca3dd39a00d': 999999, // Kingdom Credits
      },
    },
    currencyDetails: [],
    flex: { Entitlements: flexEntitlements },
    userInfo: {
      sub: puuid,
      acct: { game_name: 'prueba', tag_line: 'test', created_at: Date.now() },
      country: 'ar',
      age: 21,
      email_verified: true,
      phone_number_verified: true,
      preferred_username: 'prueba',
    },
    regionInfo: { token: 'fake-demo-token', affinities: { live: 'na', pbe: 'na' } },
    lastUpdated: new Date(),
  };

  // Idempotente: si ya existe una cuenta "prueba", la reemplaza
  user.riotAccounts = user.riotAccounts.filter(acc => acc.name !== 'prueba');
  user.riotAccounts.push(newAccount);
  await user.save();

  console.log('✅ Cuenta "prueba" (prueba#test) creada con inventario completo.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Error en el seed:', err);
  process.exit(1);
});
