const { chromium } = require("playwright");
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 900 } });
  await p.goto("file://" + process.argv[2]); await p.evaluate(() => document.fonts.ready);
  console.log(await p.evaluate(() => { const w = innerWidth; const out = [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > w + 1 && !e.closest(".pin-lk-kisi-wadah > table")).slice(0, 5).map((e) => `${e.tagName}.${e.className} right=${Math.round(e.getBoundingClientRect().right)} pos=${getComputedStyle(e).position}`); return out.join("\n"); }));
  await p.addStyleTag({ content: ".pin-lk-kisi-wadah{position:relative}" });
  console.log("with position:relative on the region →", await p.evaluate(() => document.documentElement.scrollWidth));
  await b.close(); })();
