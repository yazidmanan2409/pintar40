// Decode the QR from a raster of the printed PDF (300 dpi), cropped to the QR's place on the sheet.
const sharp = require("/home/user/pintar40/node_modules/sharp");
const jsQR = require("/home/user/pintar40/node_modules/jsqr");
(async () => {
  const [png, harap] = process.argv.slice(2);
  const dpmm = 300 / 25.4;
  const left = Math.round((144 - 6) * dpmm), top = Math.round((236 - 6) * dpmm), side = Math.round(38 * dpmm);
  const { data, info } = await sharp(png).extract({ left, top, width: side, height: side }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const r = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  const full = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const r2 = jsQR(new Uint8ClampedArray(full.data), full.info.width, full.info.height);
  console.log(JSON.stringify({ crop: r && r.data, wholePage: r2 && r2.data, version: r && r.version, matchesExpected: r && r.data === harap }));
})();
