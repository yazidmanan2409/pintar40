// REVERSE RECONCILIATION, CLOSED IN A REAL BROWSER (D-179(e), D-180, D-181): the open coverage E-RB-1, E-RB-2, E-RB-5
// and E-RB-9 of docs/completion-4.0/retrospektif/04-REKONSILIASI-BALIK.md, read from the rendered page, never the source.
//
//   RB1  E-RB-1  every accepted surface at Daisy's widths (1280, 820, 390, 320): no sideways scroll, and a JUDGED axe run
//               (WCAG 2.0/2.1/2.2 A and AA, target size included) at each width. The crawl only records axe; this fails.
//   RB2  E-RB-2  the same surfaces at 1280 from a fresh load: the skip link is the first Tab stop, every stop shows a
//               focus indicator, and focus never sticks (a11y.mjs's keyboard walk, judged).
//   RB5  E-RB-5  B2 rendered: the explanation sits on Pendataan's «Kode sekolah» panel, and Aktivasi's search field is
//               described by exactly that explanation (aria-describedby), in the reader's language.
//   RB9  E-RB-9  the chooser «/» (a person with several contexts): every door at least 56 px high, at most one door
//               current, and the staff navigation carries no group heading of its own.
//
// The surfaces: Studio's package page (A1), every Konfigurasi section page (B1), Ringkasan Kelas and Sekolah, Pimpinan
// and a node of it (C1), a professional-learning class's «Lihat bukti» and its record (C2), and the chooser (E2).
// Local or CI stack with the synthetic seed: APP_URL, SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL, the anon key, APP_DIR,
// SUPABASE_DB_URL. Writes OUT_DIR/rb-ujung.json and screenshots; exits 1 on any FAIL.
import { chromium } from "playwright";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { AXE_PATH, periksa } from "./a11y.mjs";

const APP = process.env.APP_URL ?? "http://127.0.0.1:3999";
const SB = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DB = process.env.SUPABASE_DB_URL;
const OUT = process.env.OUT_DIR ?? "audit-out/rb-ujung";
const SLOW = 30000;
const require = createRequire(join(process.env.APP_DIR ?? process.cwd(), "package.json"));
const { createServerClient } = require("@supabase/ssr");
const sql = (q) => execFileSync("psql", [DB, "-At", "-v", "ON_ERROR_STOP=1", "-c", q], { encoding: "utf8" }).trim();
const TAG = randomBytes(3).toString("hex");

const ORANG = {
  kaprodi: { key: "kaprodi", tujuan: "MENGELOLA", email: "boot-kaprodi@bootstrap.pintar.test", password: "Bootstrap-Kaprodi-5528!" },
  admin: { key: "admin", tujuan: "MENGELOLA", email: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" },
  dekan: { key: "dekan", tujuan: "MENGELOLA", email: "alpha-dean@synthetic.pintar.test", password: "Sintetis-AlphaDean-33!" },
  guru: { key: "guru", tujuan: "MENGAJAR", email: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!" },
  guruDua: { key: "guru-dua", tujuan: "MENGAJAR", email: "siklus-guru@synthetic.pintar.test", password: "Sintetis-SiklusGuru-11!" },
};
const LEBAR = [1280, 820, 390, 320];

mkdirSync(OUT, { recursive: true });
const langkah = [];
let gagal = false;
// RB_HANYA=RB9 runs the named steps only (a development loop; CI runs every step)
const HANYA = (process.env.RB_HANYA ?? "").split(",").filter(Boolean);
async function step(id, judul, fn) {
  if (HANYA.length && !HANYA.includes(id)) return;
  const rec = { id, judul, verdict: "PASS", catatan: [], shots: [] };
  try { await fn(rec); } catch (e) { rec.verdict = "FAIL"; rec.catatan.push(`error: ${String(e.message ?? e).split("\n")[0].slice(0, 300)}`); }
  if (rec.verdict !== "PASS") gagal = true;
  langkah.push(rec);
  console.log(`${rec.verdict.padEnd(5)} ${id} ${judul}\n      ${rec.catatan.join("\n      ")}`);
}
const harus = (rec, ok, kata) => { rec.catatan.push(`${ok ? "ok" : "!!"} ${kata}`); if (!ok) rec.verdict = "FAIL"; return ok; };
async function shot(page, rec, nama) {
  const f = `${String(langkah.length + 1).padStart(2, "0")}-${nama}.png`;
  await page.screenshot({ path: join(OUT, f), fullPage: true }).catch(() => null);
  rec.shots.push(f);
}
async function cookies(p) {
  const jar = new Map();
  const client = createServerClient(SB, ANON, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) },
  });
  const { data, error } = await client.auth.signInWithPassword({ email: p.email, password: p.password });
  if (error || !data.session) throw new Error(`sign-in failed for ${p.key}: ${error?.message ?? "no session"}`);
  const host = new URL(APP).hostname;
  return [...jar].map(([name, value]) => ({ name, value, domain: host, path: "/", httpOnly: false, secure: false, sameSite: "Lax" }));
}
async function tutupTur(page) {
  const lewati = page.getByRole("button", { name: /Lewati tur|Lewati|Tutup tur/ }).first();
  if (await lewati.isVisible().catch(() => false)) await lewati.click().catch(() => {});
}
async function pilih(page, tujuan) {
  await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  const kunci = await page.locator('[data-pemilih="konteks"] button[data-konteks]').evaluateAll((bs) => bs.map((b) => b.getAttribute("data-konteks")));
  const k = kunci.find((x) => x === tujuan) ?? kunci.find((x) => x.split(":")[0] === tujuan) ?? kunci[0];
  if (!k) return;
  await page.locator(`[data-pemilih="konteks"] button[data-konteks="${k}"]`).click();
  await page.waitForURL((u) => u.pathname !== "/", { timeout: SLOW }).catch(() => {});
  await page.waitForLoadState("networkidle");
}
async function masuk(browser, p) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
  await context.addCookies(await cookies(p));
  const page = await context.newPage();
  await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  if (new URL(page.url()).pathname === "/perangkat") {
    await page.locator('input[type="radio"][name="mode"][value="PERSONAL"]').check();
    await page.getByRole("button", { name: "Simpan pilihan" }).click();
    await page.waitForURL((u) => u.pathname !== "/perangkat", { timeout: SLOW }).catch(() => {});
    await page.waitForLoadState("networkidle");
  }
  await pilih(page, p.tujuan);
  await tutupTur(page);
  return page;
}
async function buka(page, jalan) {
  await page.goto(`${APP}${jalan}`, { waitUntil: "networkidle" });
  await tutupTur(page);
  await page.waitForTimeout(150);
}
/** axe, judged, on the page as it stands (WCAG 2.0, 2.1 and 2.2 A and AA; 2.2 AA includes the 24 px target size). */
async function axe(page) {
  if (!(await page.evaluate(() => typeof window.axe === "object").catch(() => false))) await page.addScriptTag({ path: AXE_PATH });
  return page.evaluate(async () => {
    const out = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    return out.violations.map((v) => `${v.id}×${v.nodes.length} (${String(v.nodes[0]?.target?.[0] ?? "").slice(0, 60)})`);
  });
}
/** RB1 and RB2 on one surface: four widths, then the keyboard at 1280 from a fresh load. */
async function permukaan(rec, page, jalan, nama) {
  await buka(page, jalan);
  const kode = await page.evaluate(() => document.querySelector(".pin-refusal") ? "refused" : "ok");
  if (!harus(rec, kode === "ok" && new URL(page.url()).pathname === jalan.split("?")[0].split("#")[0], `${nama}: ${jalan} opens for its reader (${new URL(page.url()).pathname}, ${kode})`)) return;
  for (const w of LEBAR) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(200);
    const geser = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const v = await axe(page);
    harus(rec, geser <= 0 && v.length === 0, `${nama} at ${w} px: no sideways scroll (${geser} px), axe clean${v.length ? ` — ${v.join(", ")}` : ""}`);
    if (w === 390) await shot(page, rec, `${nama}-390`);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  const atas = new URL(page.url()); atas.hash = "";
  await page.goto(atas.href, { waitUntil: "networkidle" });
  await tutupTur(page);
  const h = await periksa(page);
  harus(rec, Boolean(h.lompat?.ada), `${nama}: the skip link is the first Tab stop (${h.lompat?.pertama})`);
  harus(rec, h.papan && h.papan.tanpaTanda === 0 && !h.papan.macet && h.papan.berhenti > 0,
    `${nama}: ${h.papan?.berhenti} Tab stops, every one shows its focus, none sticks${h.papan?.tanpaTanda ? ` — without: ${h.papan.tanpaTandaContoh.join("; ")}` : ""}`);
}

const browser = await chromium.launch();
const alphaId = sql("select id from public.institutions where slug like 'synth-alpha-%' limit 1");
const kelasAlpha = sql(`select n.id from public.org_nodes n where n.institution_id = '${alphaId}' and n.kind = 'CLASS' and n.member_kind = 'LEARNER' and n.is_active order by n.name limit 1`);
const paketBoot = sql(`select c.id from public.courses c join public.institutions i on i.id = c.institution_id
  where i.slug = 'pintar-bootstrap-official' and exists (select 1 from public.modules m join public.lessons l on l.module_id = m.id
  join public.items it on it.lesson_id = l.id where m.course_id = c.id) order by c.created_at limit 1`);

await step("RB1-A1", "A1: Studio's question review at every accepted width, axe judged, keyboard judged (E-RB-1, E-RB-2), and the pager named at 320 px (E-RB-3)", async (rec) => {
  if (!harus(rec, /^[0-9a-f-]{36}$/.test(paketBoot), "a package with questions is seeded")) return;
  const page = await masuk(browser, ORANG.kaprodi);
  await permukaan(rec, page, `/studio/paket/${paketBoot}`, "studio-paket");
  // E-RB-3: at 320 px the pager's moves show only their chevrons; each keeps its word as its accessible name (K6)
  const adaPager = await page.locator("[data-soal-pager]").count();
  if (adaPager) {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.waitForTimeout(200);
    const nama = await page.locator("[data-soal-pager] [data-pager]").evaluateAll((as) => as.map((a) => a.getAttribute("aria-label")));
    harus(rec, JSON.stringify(nama) === JSON.stringify(["Sebelumnya", "Berikutnya"]), `at 320 px the pager's moves are named ${JSON.stringify(nama)}`);
    await page.setViewportSize({ width: 1280, height: 900 });
  } else rec.catatan.push("   (one lesson: no pager to name)");
  await page.context().close();
});

await step("RB1-B1", "B1: every Konfigurasi section page at every accepted width, axe and keyboard judged (E-RB-1, E-RB-2)", async (rec) => {
  const page = await masuk(browser, ORANG.admin);
  await buka(page, "/konfigurasi");
  const bagian = [...new Set(await page.locator('main a[href^="/konfigurasi/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href").split("#")[0].split("?")[0])))];
  harus(rec, bagian.length >= 5, `the index offers ${bagian.length} section page(s): ${bagian.join(", ")}`);
  await permukaan(rec, page, "/konfigurasi", "konfigurasi");
  for (const b of bagian) await permukaan(rec, page, b, b.replace(/\//g, "-").slice(1));
  await page.context().close();
});

await step("RB1-C1", "C1: Ringkasan Kelas, Pimpinan and a node of it at every accepted width, axe and keyboard judged (E-RB-1, E-RB-2)", async (rec) => {
  const page = await masuk(browser, ORANG.dekan);
  await permukaan(rec, page, "/pimpinan", "pimpinan");
  await buka(page, "/pimpinan");
  const simpul = (await page.locator('main a[href^="/pimpinan/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href").split("#")[0])))[0];
  if (harus(rec, Boolean(simpul), `Pimpinan links a node (${simpul})`)) await permukaan(rec, page, simpul.split("?")[0] === simpul ? simpul : simpul, "pimpinan-simpul");
  const ringkasSekolah = (await page.locator('a[href^="/dekan/ringkasan"]').evaluateAll((as) => as.map((a) => a.getAttribute("href"))))[0];
  if (ringkasSekolah) {
    await buka(page, ringkasSekolah);
    harus(rec, (await page.locator(".pin-refusal").count()) === 0, `Ringkasan Sekolah opens (${ringkasSekolah})`);
    for (const w of LEBAR) {
      await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(200);
      const geser = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const v = await axe(page);
      harus(rec, geser <= 0 && v.length === 0, `Ringkasan Sekolah at ${w} px: no sideways scroll (${geser} px), axe clean${v.length ? ` — ${v.join(", ")}` : ""}`);
    }
    await page.setViewportSize({ width: 1280, height: 900 });
  } else rec.catatan.push("   (Pimpinan offers no Ringkasan Sekolah link to this reader)");
  await page.context().close();
  const guru = await masuk(browser, ORANG.guru);
  const jalan = `/edukator/ringkasan?kelas=${kelasAlpha}`;
  await buka(guru, jalan);
  // E-RB-6 rendered: no empty heading; every figure that is shown carries a sentence; a withheld one carries no label
  const kartu = await guru.locator("main article").evaluateAll((as) => as.map((a) => ({
    h: a.querySelector("h2")?.textContent?.trim() ?? null, p: [...a.querySelectorAll("p")].map((p) => p.textContent.trim()).filter(Boolean).length })));
  harus(rec, kartu.every((k) => (k.h === null || k.h.length > 0) && k.p > 0), `Ringkasan Kelas: ${kartu.length} figure(s), none with an empty heading or without its sentence`);
  for (const w of LEBAR) {
    await guru.setViewportSize({ width: w, height: 900 }); await guru.waitForTimeout(200);
    const geser = await guru.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const v = await axe(guru);
    harus(rec, geser <= 0 && v.length === 0, `Ringkasan Kelas at ${w} px: no sideways scroll (${geser} px), axe clean${v.length ? ` — ${v.join(", ")}` : ""}`);
  }
  await guru.context().close();
});

await step("RB1-C2", "C2: a professional-learning class's «Lihat bukti» and its record at every accepted width, axe and keyboard judged (E-RB-1, E-RB-2)", async (rec) => {
  // a PD class of alpha's, as Konfigurasi makes it (the print walk's fixture, P5): each call the product's own function
  sql(`do $$ declare inst uuid := '${alphaId}'; adm uuid; guru uuid; p1 uuid; p2 uuid; b uuid; t uuid; k uuid; j jsonb; th text; begin
    select a.id into adm from auth.users a where a.email = '${ORANG.admin.email}';
    select ac.person_id into guru from public.accounts ac join auth.users a on a.id = ac.auth_user_id where a.email = '${ORANG.guru.email}';
    select ac.person_id into p1 from public.accounts ac join auth.users a on a.id = ac.auth_user_id where a.email = 'alpha-hod@synthetic.pintar.test';
    select ac.person_id into p2 from public.accounts ac join auth.users a on a.id = ac.auth_user_id where a.email = 'alpha-dean@synthetic.pintar.test';
    perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', adm::text, true);
    execute 'set local role authenticated';
    b := public.create_bagian(inst, 'Pengembangan RB ${TAG}', true);
    select extract(year from ap.starts_on)::int || '/' || (extract(year from ap.starts_on)::int + 1) into th
      from public.org_nodes n join public.academic_periods ap on ap.id = n.academic_period_id where n.id = '${kelasAlpha}';
    t := public.create_tingkat(b, 'Guru RB ${TAG}', th);
    k := public.create_kelas(t, 'Kelas PD RB ${TAG}', th);
    perform public.grant_role(guru, 'EDUCATOR', k, now() + interval '1 year');
    j := public.enrol_for_professional_learning(p1, k);
    j := public.enrol_for_professional_learning(p2, k);
  end $$`);
  const pd = sql(`select id from public.org_nodes where institution_id = '${alphaId}' and kind = 'CLASS' and name = 'Kelas PD RB ${TAG}'`);
  if (!harus(rec, /^[0-9a-f-]{36}$/.test(pd), "the PD class was made through the product's functions")) return;
  const page = await masuk(browser, ORANG.guru);
  await permukaan(rec, page, `/mengajar/${pd}/bukti`, "pd-bukti");
  const teks = await page.locator("main").innerText();
  harus(rec, !/\bmurid\b/i.test(teks.replace(/Murid dan peserta[^\n]*/g, "")), "the PD «Lihat bukti» says «peserta», never «murid»");
  await permukaan(rec, page, `/pengembangan/${pd}`, "pengembangan");
  await page.context().close();
});

await step("RB5", "B2 rendered: the explanation on Pendataan's «Kode sekolah» panel and as Aktivasi's search description (E-RB-5)", async (rec) => {
  const arti = "Nomor registrasi orang ini di sekolah tersebut. Berbeda dari PINTAR ID dan NIS/NISN.";
  const page = await masuk(browser, ORANG.admin);
  await buka(page, "/pendataan");
  harus(rec, (await page.locator("main").innerText()).includes(arti), "Pendataan draws the explanation");
  await buka(page, "/aktivasi");
  const cari = page.locator('[data-cari-tunggu] input[type="search"]');
  if (await cari.count()) {
    const desk = await cari.evaluate((el) => (el.getAttribute("aria-describedby") ?? "").split(/\s+/).map((id) => document.getElementById(id)?.textContent?.trim()).filter(Boolean).join(" "));
    harus(rec, desk === arti, `Aktivasi's search is described by the explanation («${desk}»)`);
  } else rec.catatan.push("   (no one waits for an account: Aktivasi draws no search)");
  await page.context().close();
});

await step("RB9", "E2 rendered: the chooser's doors are at least 56 px, at most one is current, and the staff navigation has no group heading (E-RB-9)", async (rec) => {
  const page = await masuk(browser, ORANG.guruDua);
  await buka(page, "/mengajar");
  const nav = await page.evaluate(() => { const n = document.querySelector(".pin-staf nav.pin-tabs"); return n ? n.querySelectorAll("h1,h2,h3,h4,h5,h6,[role=heading]").length : -1; });
  harus(rec, nav === 0, `the staff navigation holds ${nav} group heading(s)`);
  await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  const pintu = await page.locator('[data-pemilih="konteks"] button[data-konteks]').evaluateAll((bs) => bs.map((b) => ({
    tinggi: Math.round(b.getBoundingClientRect().height), kini: b.getAttribute("aria-current") === "true" })));
  harus(rec, pintu.length >= 2, `the chooser offers ${pintu.length} door(s) to a person with several contexts`);
  harus(rec, pintu.every((p) => p.tinggi >= 56), `every door is at least 56 px high (${pintu.map((p) => p.tinggi).join(", ")})`);
  harus(rec, pintu.filter((p) => p.kini).length <= 1, `${pintu.filter((p) => p.kini).length} door(s) marked current`);
  for (const w of LEBAR) {
    await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(200);
    const geser = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const v = await axe(page);
    harus(rec, geser <= 0 && v.length === 0, `the chooser at ${w} px: no sideways scroll (${geser} px), axe clean${v.length ? ` — ${v.join(", ")}` : ""}`);
    if (v.length) rec.catatan.push(`   the session row's targets at ${w} px: ${(await page.locator(".pin-sesi a, .pin-sesi button").evaluateAll((es) => es.map((e) => {
      const q = e.getBoundingClientRect(); return `${e.className || e.tagName} ${Math.round(q.left)},${Math.round(q.top)} ${Math.round(q.width)}×${Math.round(q.height)}`; }))).join("; ")}`);
  }
  await page.setViewportSize({ width: 320, height: 900 });
  // the reader's name opens the account menu: at 320 px it is seen whole inside its row, never clipped away, and it
  // does not lie under «Keluar»
  const tata = await page.evaluate(() => {
    const r = (e) => e?.getBoundingClientRect();
    const tombol = r(document.querySelector(".pin-sesi .pin-menu-tombol")), ket = r(document.querySelector(".pin-sesi-ket")), keluar = r(document.querySelector(".pin-sesi-keluar"));
    return tombol && ket && keluar ? { dalam: tombol.left >= ket.left - 1 && tombol.right <= ket.right + 1 && tombol.width >= 44, pisah: tombol.right <= keluar.left + 1, lebar: Math.round(tombol.width) } : null;
  });
  harus(rec, tata !== null && tata.dalam && tata.pisah, `at 320 px the name's menu button is whole in its row and clear of «Keluar» (${JSON.stringify(tata)})`);
  await shot(page, rec, "pemilih-320");
  await page.setViewportSize({ width: 1280, height: 900 });
  // E-RB-2 on the chooser: the keyboard from a fresh load
  await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  const h = await periksa(page);
  harus(rec, Boolean(h.lompat?.ada) && h.papan && h.papan.tanpaTanda === 0 && !h.papan.macet,
    `the chooser: the skip link first (${h.lompat?.pertama}), ${h.papan?.berhenti} Tab stops, every one shows its focus${h.papan?.tanpaTanda ? ` — without: ${h.papan.tanpaTandaContoh.join("; ")}` : ""}`);
  await page.context().close();
});

await browser.close();
writeFileSync(join(OUT, "rb-ujung.json"), JSON.stringify({ app: APP, langkah }, null, 2));
const lulus = langkah.filter((l) => l.verdict === "PASS").length;
console.log(`\n${lulus}/${langkah.length} PASS`);
process.exit(gagal ? 1 : 0);
