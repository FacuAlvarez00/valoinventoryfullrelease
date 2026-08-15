const fs = require('fs');
const path = require('path');

test('all growing UI collections use the shared pagination control', () => {
  const sourceRoot = path.join(__dirname, '..', '..', '..');
  const paginatedSurfaces = [
    'components/ui/HomePage.jsx',
    'components/inventory/SharedView.jsx',
    'components/inventory/InventorySkins.jsx',
    'components/inventory/InventoryBattlepass.jsx',
    'components/inventory/InventoryBuddies.jsx',
    'components/inventory/InventoryCards.jsx',
    'components/inventory/InventorySprays.jsx',
    'components/inventory/InventoryFlex.jsx',
    'components/inventory/InventoryTitles.jsx',
    'components/inventory/InventoryAgents.jsx',
  ];

  paginatedSurfaces.forEach((fileName) => {
    const source = fs.readFileSync(path.join(sourceRoot, fileName), 'utf8');
    expect(source).toContain('<Pagination');
    expect(source).toContain('usePagination');
  });
});

test('keeps loadout and account summary outside collection pagination', () => {
  const sourceRoot = path.join(__dirname, '..', '..', '..');
  const fixedSurfaces = [
    'components/inventory/MySkins.jsx',
    'components/inventory/InventoryDetails.jsx',
    'components/inventory/InventoryDashboard.jsx',
    'components/inventory/InventoryNavbar.jsx',
  ];

  fixedSurfaces.forEach((fileName) => {
    const source = fs.readFileSync(path.join(sourceRoot, fileName), 'utf8');
    expect(source).not.toContain('<Pagination');
  });
});
