const fs = require('fs');
const path = require('path');

test('keeps shared inventory categories and items in one explorer', () => {
  const source = fs.readFileSync(path.join(__dirname, 'SharedView.jsx'), 'utf8');
  const sidebarPosition = source.indexOf('className={styles.collectionSidebar}');
  const itemsPosition = source.indexOf('id="shared-inventory-items"');

  expect(sidebarPosition).toBeGreaterThan(-1);
  expect(itemsPosition).toBeGreaterThan(sidebarPosition);
  expect(source).toContain('role="tablist"');
  expect(source).toContain('aria-selected={activeSection === section.key}');
});

test('uses side-by-side hierarchy on desktop and compact category scrolling on mobile', () => {
  const styles = fs.readFileSync(path.join(__dirname, 'SharedView.module.css'), 'utf8');

  expect(styles).toContain('grid-template-columns: minmax(210px, 240px) minmax(0, 1fr)');
  expect(styles).toContain('overflow-x: auto');
  expect(styles).toContain('min-height: 62px');
});
