// Heights, not only widths: each screen's main point is visible without scrolling;
// every evidence frame fits between the top bar and the bottom navigation; a frame whose
// content is taller scrolls inside itself, says so, and can be reached by keyboard;
// nothing is clipped. Runs every screen × both languages × common window sizes, every tab.
const { chromium } = require("playwright");
const U = "http://127.0.0.1:8765/index.html";
const ID = ["mulai","alur","materi","menilai","laporan","pimpinan","memulai","akses","rencana","penutup"];
const EN = ["en-start","en-journey","en-materials","en-assessment","en-report","en-leaders","en-setup","en-access","en-roadmap","en-closing"];
const UK = [[1920,1080],[1536,864],[1440,900],[1366,768],[1280,720],[1024,768],[768,1024],[390,844],[375,667],[360,740],[320,568]];
const POKOK = { mulai: ".pernyataan", penutup: ".pernyataan", pimpinan: ".temuan-besar" };
(async () => {
  const b = await chromium.launch(); const masalah = []; const catat = [];
  for (const [w, h] of UK) {
    const c = await b.newContext({ viewport: { width: w, height: h } }); const p = await c.newPage();
    for (const [j, hash] of [...ID, ...EN].entries()) {
      const nama = ID[j % 10];
      await p.goto(U + "#" + hash, { waitUntil: "networkidle" }); await p.waitForTimeout(350);
      const r = await p.evaluate((pokok) => {
        const bawah = document.querySelector(".bawah").getBoundingClientRect().top;
        const atas = document.querySelector(".atas").getBoundingClientRect().bottom;
        const h1 = document.querySelector(".layar h1, .layar .pernyataan");
        const el = document.querySelector(pokok) || h1;
        const kotak = (x) => { const q = x.getBoundingClientRect(); return { t: Math.round(q.top), b: Math.round(q.bottom) }; };
        return { bawah: Math.round(bawah), atas: Math.round(atas), h1: kotak(h1), pokok: kotak(el) };
      }, POKOK[nama] || ".layar h1");
      if (r.h1.b > r.bawah) masalah.push(`${w}x${h} ${hash}: heading ends at ${r.h1.b}, navigation starts at ${r.bawah}`);
      if (r.pokok.b > r.bawah) masalah.push(`${w}x${h} ${hash}: main point ends at ${r.pokok.b}, navigation starts at ${r.bawah}`);
      catat.push(`${w}x${h} ${hash} point ${r.pokok.b}/${r.bawah}`);
      // every tab state
      const grup = await p.locator("[data-pilih]").count(); const kombinasi = [null];
      for (let g = 0; g < grup; g++) { const n = await p.locator("[data-pilih]").nth(g).locator("button").count(); for (let k = 0; k < n; k++) kombinasi.push([g, k]); }
      for (const kb of kombinasi) {
        if (kb) { await p.locator("[data-pilih]").nth(kb[0]).locator("button").nth(kb[1]).click(); await p.waitForTimeout(250); }
        const f = await p.evaluate(() => {
          const atas = document.querySelector(".atas").offsetHeight, bawah = document.querySelector(".bawah").offsetHeight;
          const ruang = innerHeight - atas - bawah; const out = [];
          document.querySelectorAll(".layar figure.bingkai").forEach((fig) => {
            if (fig.closest("[hidden]")) return;
            const g = fig.querySelector(".gulir-bukti, .jendela"); const tanda = fig.querySelector(".lagi");
            const lebih = g.scrollHeight > g.clientHeight + 2;
            g.scrollTop = 0; g.dispatchEvent(new Event("scroll"));
            const tampakAwal = tanda ? !tanda.hidden : null;
            g.scrollTop = g.scrollHeight; g.dispatchEvent(new Event("scroll"));
            const tampakAkhir = tanda ? !tanda.hidden : null; g.scrollTop = 0; g.dispatchEvent(new Event("scroll"));
            const img = g.querySelector("img");
            out.push({ label: fig.querySelector(".bingkai-kepala").textContent.slice(0, 60), tinggi: Math.round(fig.getBoundingClientRect().height), ruang,
              lebih, tampakAwal, tampakAkhir, fokus: g.tabIndex === 0 && !!g.getAttribute("role"), lebarTerpotong: img ? img.getBoundingClientRect().width > g.clientWidth + 1 : false });
          });
          // clipped text: overflow hidden with hidden content (excluding intended ellipsis and visually-hidden text)
          const kliping = [];
          document.querySelectorAll(".layar *").forEach((e) => { const cs = getComputedStyle(e); if (e.closest("[hidden]") || e.matches(".sr, .sr *, .gulir-bukti, .jendela, .bingkai") ) return;
            if ((cs.overflowY === "hidden" || cs.overflowY === "clip") && e.scrollHeight > e.clientHeight + 2 && e.clientHeight > 0) kliping.push(e.className || e.tagName);
            if ((cs.overflowX === "hidden" || cs.overflowX === "clip") && e.scrollWidth > e.clientWidth + 2 && e.clientWidth > 0) kliping.push(e.className || e.tagName); });
          const lebarHalaman = document.documentElement.scrollWidth > innerWidth;
          return { out, kliping, lebarHalaman };
        });
        const tag = `${w}x${h} ${hash}${kb ? ` tab ${kb[0]}.${kb[1]}` : ""}`;
        for (const x of f.out) {
          if (x.tinggi > x.ruang + 1) masalah.push(`${tag}: frame «${x.label}» is ${x.tinggi}px, the space between bars is ${x.ruang}px`);
          if (x.lebih && x.tampakAwal !== true) masalah.push(`${tag}: frame «${x.label}» scrolls but shows no cue`);
          if (x.lebih && x.tampakAkhir !== false) masalah.push(`${tag}: frame «${x.label}» keeps its cue after scrolling`);
          if (!x.lebih && x.tampakAwal === true) masalah.push(`${tag}: frame «${x.label}» shows a cue with nothing more`);
          if (x.lebih && !x.fokus) masalah.push(`${tag}: frame «${x.label}» scrolls but cannot be reached by keyboard`);
          if (x.lebarTerpotong) masalah.push(`${tag}: frame «${x.label}» cuts its image sideways`);
        }
        if (f.kliping.length) masalah.push(`${tag}: clipped content in ${[...new Set(f.kliping)].join(", ")}`);
        if (f.lebarHalaman) masalah.push(`${tag}: page scrolls sideways`);
      }
    }
    await c.close();
  }
  await b.close();
  require("fs").writeFileSync(__dirname + "/uji-tinggi.log", catat.join("\n"));
  console.log(masalah.length ? [...new Set(masalah)].join("\n") : "no problems"); console.log(`${UK.length} sizes × 20 screens`);
})();
