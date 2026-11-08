const OUTV = "../verif";
const browser = await chromium.launch();
for (const w of [390, 320]) {
  const { page: G } = await masuk(browser, ORANG.guru, { width: w, height: 900 });
  await buka(G, "/studio/paket/264ed74e-5f14-401d-b2d1-9af027349496");
  const href = await G.locator('a[href*="/studio/pratinjau/"]').first().getAttribute("href");
  await buka(G, href);
  const reg = G.locator(".pin-ttabel");
  console.log(w, "scroll-behavior:", await reg.first().evaluate((e) => getComputedStyle(e).scrollBehavior + " / html " + getComputedStyle(document.documentElement).scrollBehavior)); console.log(w, "tables:", await reg.count(), await reg.first().evaluate((e) => ({ role: e.getAttribute("role"), tab: e.getAttribute("tabindex"), name: e.getAttribute("aria-label"), sw: e.scrollWidth, cw: e.clientWidth })).catch((e) => String(e)));
  // tab until the region has focus
  let n = 0; for (; n < 60; n++) { await G.keyboard.press("Tab"); if (await reg.first().evaluate((e) => e === document.activeElement)) break; }
  const f = await reg.first().evaluate((e) => { const s = getComputedStyle(e); return { focused: e === document.activeElement, outline: s.outlineStyle + " " + s.outlineWidth + " " + s.outlineColor, shadow: s.boxShadow }; });
  console.log(w, "tabs to reach:", n + 1, f);
  await reg.first().scrollIntoViewIfNeeded(); const box = await reg.first().boundingBox();
  await G.screenshot({ path: `${OUTV}/a3-fokus-${w}.png`, clip: { x: 0, y: Math.max(0, box.y - 40), width: w, height: Math.min(500, box.height + 80) } });
  const s0 = await reg.first().evaluate((e) => e.scrollLeft);
  for (let i = 0; i < 15; i++) { await G.keyboard.press("ArrowRight"); await G.waitForTimeout(120); } await G.waitForTimeout(800);
  const s1 = await reg.first().evaluate((e) => e.scrollLeft);
  await G.keyboard.press("End"); await G.waitForTimeout(1200); const s2 = await reg.first().evaluate((e) => [e.scrollLeft, e.scrollWidth - e.clientWidth]);
  console.log(w, "scrollLeft", s0, "→ArrowRight×15", s1, "→End", s2, "page width", await lebar(G));
  await G.screenshot({ path: `${OUTV}/a3-geser-${w}.png`, clip: { x: 0, y: Math.max(0, box.y - 40), width: w, height: Math.min(500, box.height + 80) } });
  await G.context().close();
}
await browser.close();
