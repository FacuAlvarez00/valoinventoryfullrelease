const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const backendRoot = path.resolve(__dirname, '..');
const officialCatalogName = 'Misericórdia';

function collectJavaScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === 'test') return [];
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectJavaScriptFiles(fullPath);
    return entry.isFile() && entry.name.endsWith('.js') ? [fullPath] : [];
  });
}

test('backend source remains English-only', () => {
  const files = collectJavaScriptFiles(backendRoot);
  const accentedSpanishCharacters = /[áéíóúñÁÉÍÓÚÑ¿¡]/;
  const legacyMessages = /\b(?:Falta|Faltan|No se pudo|No hay|Cuenta Riot|Usuario no|Error obteniendo|exitosamente)\b/;

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8').replaceAll(officialCatalogName, 'OfficialCatalogName');
    assert.doesNotMatch(source, accentedSpanishCharacters, `${path.relative(backendRoot, file)} contains Spanish characters`);
    assert.doesNotMatch(source, legacyMessages, `${path.relative(backendRoot, file)} contains a legacy Spanish message`);
  }
});

test('demo seed uses an English filename', () => {
  assert.equal(fs.existsSync(path.join(backendRoot, 'seed-demo-account.js')), true);
});
