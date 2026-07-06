const CHAMPIONS_MELEE = [
  'Champions 2021 Karambit',
  'Champions 2022 Butterfly Knife',
  'Champions 2023 Kunai',
  'Champions 2024 Blade',
  'Champions 2025 Butterfly Knife',
];

const FIXED_PRICES = {
  'VCT LOCK//IN Misericórdia': 5440,
  'VCT 2026 Sigil': 5350,
  'VCT 2025 Karambit': 5350,
  'XERØFANG Vandal': 1775,
  'Arcane Vandal': 2175,
  'Arcane Sheriff': 2380,
  'Arcane Gauntlets': 4350,
  'Ignite Fan': 4350,
  '5 Years // Beta Remastered Knife': 4350,
};

export function getSkinPrice(baseName, weaponSkins = []) {
  if (baseName in FIXED_PRICES) return FIXED_PRICES[baseName];
  if (CHAMPIONS_MELEE.includes(baseName)) return 5350;
  if (baseName.startsWith('Champions 202')) return 2675;
  if (/vct\d*\s+x\b/i.test(baseName)) return 2340;

  const found = weaponSkins.find((s) => s.name === baseName);
  if (found?.price) {
    const price = Object.values(found.price)[0];
    if (price) return parseInt(price, 10);
  }
  return null;
}

export function isGoldenSkin(baseName) {
  return (
    baseName.startsWith('Champions 202') ||
    baseName.startsWith('VCT ') ||
    /vct\d*\s+x\b/i.test(baseName) ||
    baseName === 'Arcane Vandal' ||
    baseName === 'Arcane Gauntlets'
  );
}

export function sortSkinsByPriceAsc(skinsPorBase, weaponSkins = []) {
  return Object.entries(skinsPorBase).sort((a, b) => {
    const precioA = getSkinPrice(a[0], weaponSkins);
    const precioB = getSkinPrice(b[0], weaponSkins);
    if (precioA && precioB) return precioA - precioB;
    if (precioA) return -1;
    if (precioB) return 1;
    return 0;
  });
}

export function groupSkinsByBase(skins = [], skinlevels = []) {
  const grouped = {};
  (skins || []).forEach((skin) => {
    const skinLevelObj = skinlevels.find((s) => s.uuid === skin.ItemID);
    if (!skinLevelObj) return;
    const baseName = skinLevelObj.displayName.split(' Level ')[0].trim();
    if (!grouped[baseName]) grouped[baseName] = [];
    grouped[baseName].push(skinLevelObj);
  });
  return grouped;
}

export function calcAccountStats(account, weaponSkins = [], catalog = null) {
  let totalVP = 0;

  if (weaponSkins?.length && account?.skins?.length && catalog?.skinlevels?.length) {
    const grouped = groupSkinsByBase(account.skins, catalog.skinlevels);
    Object.keys(grouped).forEach((baseName) => {
      const price = getSkinPrice(baseName, weaponSkins);
      if (price) totalVP += price;
    });
  }

  totalVP += (account?.battlePasses?.length || 0) * 1000;

  const radiantBuddies = (account?.buddies || []).filter((b) =>
    b.displayName?.toLowerCase().includes('radiant buddy')
  ).length;

  return { totalVP, radiantBuddies };
}
