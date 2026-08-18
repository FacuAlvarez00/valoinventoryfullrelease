// frontend/src/utils/catalogImage.js
//
// Builds "image catalogs" (6-column x 5-row grids, same visual style as the
// on-screen card) for download as photos, packaged into a .zip. Ported from
// the working implementation in the sibling ValoInventory project
// (D:\valoinventory\frontend\src\utils\catalogImage.js).
import { getSkinPrice, isGoldenSkin } from './pricing';

const FONT = 'Segoe UI, Arial, sans-serif'; // same typeface the on-screen card uses (see index.css)
const COLS = 6;
const ROWS = 5;
const ITEMS_PER_PAGE = COLS * ROWS; // 6 skins per row, 5 rows per photo
const CELL_W = 260;
const CELL_H = 250;
const HEADER_H = 24; // top margin only — no title/username/page number
const PAD = 24;
const SWATCH = 26;
const SWATCH_GAP = 4;

// Loads one image (skin art or chroma swatch) to draw onto the canvas.
// Resolves null on failure so one dead image doesn't break the whole page.
export function loadCatalogImage(src) {
  return new Promise(resolve => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Wraps text into up to 2 lines that fit maxWidth, vertically centered on y
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const shown = lines.slice(0, 2);
  if (lines.length > 2) shown[1] = shown[1].replace(/.{0,3}$/, '...');
  const startY = y - ((shown.length - 1) * lineHeight) / 2;
  shown.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Adds one or more PNG pages (6x5 grid) to the zip for the given items.
 * item: { baseName, imgSrc, price?, golden?, swatches? } — price/golden/
 * swatches are optional (kept for parity with other categories, unused here
 * since this file only wires up skins for now).
 * Returns how many pages were added (0 if items was empty).
 */
export async function addCatalogPagesToZip(zip, items, filePrefix) {
  if (!items || items.length === 0) return 0;
  await document.fonts.ready;

  const canvasW = PAD * 2 + COLS * CELL_W;

  const pages = [];
  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
    pages.push(items.slice(i, i + ITEMS_PER_PAGE));
  }

  for (let p = 0; p < pages.length; p++) {
    const pageItems = pages[p];
    const loadedItems = await Promise.all(pageItems.map(async item => {
      const [img, swatchImgs] = await Promise.all([
        loadCatalogImage(item.imgSrc),
        Promise.all((item.swatches || []).map(loadCatalogImage)),
      ]);
      return { ...item, img, swatchImgs };
    }));

    // Each photo is only as tall as this particular page needs — the last
    // page (or a small category) doesn't reserve empty extra rows.
    const rowsThisPage = Math.ceil(pageItems.length / COLS);
    const canvasH = HEADER_H + rowsThisPage * CELL_H + PAD;

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0F1923';
    ctx.fillRect(0, 0, canvasW, canvasH);

    loadedItems.forEach((item, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const x = PAD + col * CELL_W;
      const y = HEADER_H + row * CELL_H;
      const cardX = x + 6;
      const cardY = y;
      const cardW = CELL_W - 12;
      const cardH = CELL_H - 12;

      // Card background: gold gradient for exclusives, dark gray otherwise
      // (matches the on-screen card).
      if (item.golden) {
        const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
        grad.addColorStop(0, '#2a1e00');
        grad.addColorStop(0.5, '#4a3200');
        grad.addColorStop(1, '#2a1e00');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = '#1a1a1a';
      }
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 4);
      ctx.fill();
      ctx.strokeStyle = item.golden ? '#a07820' : '#333333';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 4);
      ctx.stroke();

      // Top row: swatches on the left, price on the right — only takes up
      // space if the item actually has something to show there.
      const hasTopRow = !!(item.price || (item.swatchImgs && item.swatchImgs.length > 0));
      const topRowY = cardY + 16;
      let swatchX = cardX + 16;
      (item.swatchImgs || []).forEach(simg => {
        if (simg) {
          ctx.save();
          drawRoundedRect(ctx, swatchX, topRowY, SWATCH, SWATCH, 3);
          ctx.clip();
          ctx.drawImage(simg, swatchX, topRowY, SWATCH, SWATCH);
          ctx.restore();
          ctx.strokeStyle = '#222222';
          ctx.lineWidth = 1;
          drawRoundedRect(ctx, swatchX, topRowY, SWATCH, SWATCH, 3);
          ctx.stroke();
        }
        swatchX += SWATCH + SWATCH_GAP;
      });

      if (item.price) {
        ctx.font = `700 14px ${FONT}`;
        const label = item.price.toLocaleString();
        const badgeW = ctx.measureText(label).width + 20;
        const badgeH = 24;
        const badgeX = cardX + cardW - 16 - badgeW;
        const badgeY = topRowY + (SWATCH - badgeH) / 2;
        ctx.fillStyle = '#ff4655';
        drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 5);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(label, badgeX + badgeW / 2, badgeY + badgeH / 2 + 5);
        ctx.textAlign = 'left';
      }

      // Image: scaled to the max size that fits and centered on both axes
      // within its reserved area (same as the real card's flexbox center).
      if (item.img) {
        const imageAreaY = hasTopRow ? topRowY + SWATCH + 14 : cardY + 14;
        const imageAreaH = hasTopRow ? cardH - 130 : cardH - 60;
        const maxW = cardW - 40;
        const maxUpscale = hasTopRow ? 1 : 2;
        const scale = Math.min(maxW / item.img.width, imageAreaH / item.img.height, maxUpscale);
        const w = item.img.width * scale;
        const h = item.img.height * scale;
        const drawX = cardX + (cardW - w) / 2;
        const drawY = imageAreaY + (imageAreaH - h) / 2;
        ctx.drawImage(item.img, drawX, drawY, w, h);
      }

      // Name, centered at the bottom (up to 2 lines)
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ECE8E1';
      ctx.font = `600 14px ${FONT}`;
      drawWrappedText(ctx, item.baseName.toUpperCase(), cardX + cardW / 2, cardY + cardH - 20, cardW - 24, 16);
      ctx.textAlign = 'left';
    });

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    zip.file(`${filePrefix}_${String(p + 1).padStart(2, '0')}.jpg`, blob);
  }

  return pages.length;
}

// Triggers the download of an already-built JSZip.
export async function triggerZipDownload(zip, filename) {
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Skins: groups by base name (same as InventorySkins.jsx), with image,
// price, chroma swatches, and whether it's exclusive (golden background).
export function buildSkinsCatalogItems(account, catalog, weaponSkins) {
  if (!account?.skins?.length || !catalog?.skinlevels?.length || !catalog?.skins?.length) return [];

  const skinlevels = catalog.skinlevels || [];
  const skinsByBaseName = {};
  account.skins.forEach(skin => {
    const skinLevelObj = skinlevels.find(s => s.uuid === skin.ItemID);
    if (!skinLevelObj) return;
    const baseName = skinLevelObj.displayName.split(' Level ')[0].trim();
    if (!skinsByBaseName[baseName]) skinsByBaseName[baseName] = [];
    skinsByBaseName[baseName].push(skinLevelObj);
  });

  const items = Object.entries(skinsByBaseName).map(([baseName, skins]) => {
    let skinBaseObj = catalog.skins.find(s => s.displayName === baseName)
      || catalog.skins.find(s => s.displayName.toLowerCase().includes(baseName.toLowerCase()));
    const levelWithIcon = skins.find(s => s.displayIcon);
    const imgSrc = skinBaseObj?.chromas?.[0]?.fullRender || levelWithIcon?.displayIcon || '';
    const skinBaseWeapon = (weaponSkins || []).find(s => s.name === baseName);
    const chromasBase = skinBaseWeapon?.chromas || (skinBaseObj ? (catalog.chromas || []).filter(c => c.skinUuid === skinBaseObj.uuid) : []);
    const swatches = chromasBase.map(c => c.swatch).filter(Boolean);
    return {
      baseName,
      imgSrc,
      price: getSkinPrice(baseName, weaponSkins),
      golden: isGoldenSkin(baseName),
      swatches,
    };
  });

  // Same order as the on-screen grid: price descending, unpriced
  // (battlepass) skins last.
  return items.sort((a, b) => {
    if (a.price && b.price) return b.price - a.price;
    if (a.price) return -1;
    if (b.price) return 1;
    return 0;
  });
}
