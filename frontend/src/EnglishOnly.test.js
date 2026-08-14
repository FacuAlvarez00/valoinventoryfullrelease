const fs = require('fs');
const path = require('path');

const sourceRoot = path.resolve(__dirname);
const officialCatalogName = 'Misericórdia';

function collectSourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(fullPath);
    if (entry.name === 'EnglishOnly.test.js') return [];
    return entry.isFile() && /\.(?:js|jsx|css)$/.test(entry.name) ? [fullPath] : [];
  });
}

test('the application has no language-selection infrastructure', () => {
  expect(fs.existsSync(path.join(sourceRoot, 'context', 'LanguageContext.jsx'))).toBe(false);
  expect(fs.existsSync(path.join(sourceRoot, 'components', 'ui', 'LanguageSwitcher.jsx'))).toBe(false);
  expect(fs.existsSync(path.join(sourceRoot, 'components', 'ui', 'LanguageFlagButton.jsx'))).toBe(false);

  const applicationSource = collectSourceFiles(sourceRoot)
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');

  expect(applicationSource).not.toMatch(/LanguageContext|useLanguage|LanguageProvider|availableLanguages|changeLanguage/);
  expect(applicationSource).not.toMatch(/es-(?:AR|ES)/);
});

test('runtime source remains English-only', () => {
  const accentedSpanishCharacters = /[áéíóúñÁÉÍÓÚÑ¿¡]/;
  const legacyInterfaceCopy = /\b(?:Volver|Cargando|Buscar|Cuenta Riot|Tus cuentas|Ajustes|Idioma|Agregar|Eliminar|Actualizar|Compartir|Copiar|Sin resultados|No hay|No se pudo)\b/;

  for (const file of collectSourceFiles(sourceRoot)) {
    const source = fs.readFileSync(file, 'utf8').replaceAll(officialCatalogName, 'OfficialCatalogName');
    expect(source).not.toMatch(accentedSpanishCharacters);
    expect(source).not.toMatch(legacyInterfaceCopy);
  }
});

test('settings exposes account actions without a language menu', () => {
  const header = fs.readFileSync(path.join(sourceRoot, 'components', 'ui', 'AppHeader.jsx'), 'utf8');
  expect(header).toContain('Settings');
  expect(header).toContain('Manage Riot accounts');
  expect(header).toContain('Sign out');
  expect(header).not.toMatch(/language|locale/i);
});

test('application routes use English paths', () => {
  const app = fs.readFileSync(path.join(sourceRoot, 'App.js'), 'utf8');
  expect(app).toContain('path="loadout"');
});
