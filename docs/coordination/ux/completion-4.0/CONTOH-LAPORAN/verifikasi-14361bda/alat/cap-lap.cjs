const { chromium } = require("playwright"); const fs = require("fs");
const R = __dirname + "/pres-render", A = __dirname + "/aset2"; const META = {};
const T = {
  kelas: { terlihat: [["1 dari 2 topik", "Angka berwarna jingga"]], artinya: [["32 murid di kelas ini", "Pita tetap PINTAR"]], lakukan: [["Menambah alih-alih mengali", "Saran penanganan"], ["Murid yang perlu penguatan", "Gita Lestari"]] },
  "kelas-sedikit": { lead: [["Belum cukup bukti", "28 belum mengerjakan"]] },
  kisi: {}, sekolah: {},
};
(async () => { const b = await chromium.launch();
  for (const [f, targets] of Object.entries(T)) for (const vw of [(f === "kisi" || f === "sekolah") ? 900 : 720, 390]) {
    const p = await b.newPage({ viewport: { width: vw, height: 900 }, deviceScaleFactor: 2 });
    await p.goto(`file://${R}/${f}.html`); await p.evaluate(() => document.fonts.ready);
    const hilang = await p.evaluate(() => { document.querySelectorAll(".pin-actions").forEach((e) => e.remove()); return true; });
    const H = await p.evaluate(() => { const m = document.querySelector("main"); const r = m.getBoundingClientRect(); return Math.ceil(r.bottom + scrollY + 24); });
    const box = (t) => p.evaluate((t) => { const all = [...document.querySelectorAll("main *")].filter((e) => e.offsetParent !== null && (e.innerText || "").includes(t)); const e = all.filter((e) => ![...e.children].some((c) => (c.innerText || "").includes(t)))[0]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; }, t);
    const nm = `lap-${f}-${vw < 600 ? "hp" : "lebar"}`; const out = { w: vw, h: H, sorot: {} };
    for (const [k, pairs] of Object.entries(targets)) { out.sorot[k] = [];
      for (const [s, e] of pairs) { const a = await box(s), z = await box(e); if (!a || !z) { console.log("!!", nm, k, s, !!a, e, !!z); continue; }
        const x = Math.min(a.x, z.x) - 10, y = a.y - 10, x2 = Math.max(a.x + a.w, z.x + z.w) + 10, y2 = z.y + z.h + 10;
        out.sorot[k].push({ x: +(x / vw * 100).toFixed(2), y: +(y / H * 100).toFixed(2), w: +((x2 - x) / vw * 100).toFixed(2), h: +((y2 - y) / H * 100).toFixed(2) }); } }
    await p.screenshot({ path: `${A}/${nm}.jpg`, fullPage: true, clip: { x: 0, y: 0, width: vw, height: H }, type: "jpeg", quality: 84 }); META[nm] = out; console.log("ok", nm, H, JSON.stringify(out.sorot).slice(0, 160)); await p.close(); }
  fs.writeFileSync(`${A}/meta-laporan.json`, JSON.stringify(META, null, 1)); await b.close(); })();
