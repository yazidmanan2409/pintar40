const { chromium } = require("playwright"); const fs = require("fs");
const U = "http://127.0.0.1:8765/index.html"; const OUT = __dirname + "/uji-pres/foto";
const axe = fs.readFileSync("/home/user/pintar40/node_modules/axe-core/axe.min.js", "utf8");
const ID = ["mulai","alur","materi","menilai","laporan","pimpinan","memulai","akses","rencana","penutup"], EN = ["en-start","en-journey","en-materials","en-assessment","en-report","en-leaders","en-setup","en-access","en-roadmap","en-closing"];
const masalah = [];
(async () => { const b = await chromium.launch();
  for (const vw of [1280, 390, 320]) for (const [L, list] of [["id", ID], ["en", EN]]) {
    const p = await b.newPage({ viewport: { width: vw, height: vw > 600 ? 860 : 780 } });
    const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
    for (const s of list) {
      await p.goto(`${U}#${s}`, { waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready);
      // open every tab of the screen so each image loads
      for (const t of await p.locator("[data-pilih] button").all()) { await t.click(); await p.waitForTimeout(120); }
      await p.locator("details").evaluateAll((ds) => ds.forEach((d) => (d.open = true)));
      await p.waitForTimeout(400);
      const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: innerWidth, lang: document.documentElement.lang, h1: document.querySelector("main h1")?.innerText.slice(0, 60), rusak: [...document.querySelectorAll("img")].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src.split("/").pop()) }));
      if (r.sw > r.w) masalah.push(`${vw} ${s}: sideways ${r.sw}`); if (r.rusak.length) masalah.push(`${vw} ${s}: broken ${r.rusak}`); if (r.lang !== L) masalah.push(`${vw} ${s}: lang ${r.lang}`);
      if (vw !== 320) { await p.addScriptTag({ content: axe }); const v = await p.evaluate(() => axe.run(document, { runOnly: { type: "tag", values: ["wcag2a","wcag2aa","wcag21aa","wcag22aa"] } }).then((x) => x.violations.map((v) => `${v.id}:${v.nodes.length}`)));
        if (v.length) masalah.push(`${vw} ${s} axe ${v.join(" ")}`); }
      await p.screenshot({ path: `${OUT}/${vw}-${s}.png`, fullPage: true });
    }
    if (errs.length) masalah.push(`${vw} ${L} console: ${[...new Set(errs)].join(" | ").slice(0, 300)}`);
    await p.close();
  }
  console.log(masalah.length ? masalah.join("\n") : "no problems"); await b.close(); })();
