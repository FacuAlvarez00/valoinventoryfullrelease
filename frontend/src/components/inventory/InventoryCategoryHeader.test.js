const fs = require('fs');
const path = require('path');

test('defines the shared inventory category hierarchy', () => {
  const source = fs.readFileSync(path.join(__dirname, 'InventoryCategoryHeader.jsx'), 'utf8');

  expect(source).not.toContain('Back to inventory');
  expect(source).not.toContain('BackButton');
  expect(source).toContain('categoryEyebrow}>Inventory');
  expect(source).toContain('<h1 className={styles.categoryTitle}>{title}</h1>');
  expect(source).toContain('categoryDescription');
  expect(source).toContain('categoryHeaderAside');
  expect(source).toContain('categoryActions');
  expect(source).toContain('shown');
});

test('all inventory collection routes use the shared header', () => {
  const categoryComponents = [
    'InventoryAgents.jsx',
    'InventoryBattlepass.jsx',
    'InventoryBuddies.jsx',
    'InventoryCards.jsx',
    'InventoryFlex.jsx',
    'InventorySkins.jsx',
    'InventorySprays.jsx',
    'InventoryTitles.jsx',
  ];

  categoryComponents.forEach((fileName) => {
    const source = fs.readFileSync(path.join(__dirname, fileName), 'utf8');
    expect(source).toContain('<InventoryCategoryHeader');
  });
});
