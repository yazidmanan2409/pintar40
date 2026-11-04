// BATCH 6 (D-159; W3.22, «A4 print preview check per surface»; Daisy's 08-migration §Print): every printable surface,
// printed in a real browser at A4, carries the paper and nothing of the application around it. Each act is done in a
// real browser by a signed-in person; SQL prepares a fixture (a class whose learners wait for an account, as the intake
// would leave it) and READS results back.
//
//   P1  the staff shell in print (/konfigurasi, /aktivasi, /mengajar): no top bar, shell navigation, rail, drawer, skip
//       link, account menu, identity block or Konfigurasi's section menu reaches the paper (Daisy: «every new shell part
//       carries .pin-noprint»); the A4 PDF is saved. (The provenance footer prints on ordinary pages by design.)
//   P2  the learner shell in print (/belajar): the same.
//   P6  a Konfigurasi section page in print (B1 §2 A4): the content only; no form, record action, pager or back link
//       reaches the paper, and the audit trail's table does, its stripes kept.
//   P4  the PINTAR Digital Card on «Akun saya» (W3.20, CR-21): printed, each face is CR80 at actual size (85.6 mm wide)
//       and no shell part reaches the paper.
//   P3  the class-card sheet (Aktivasi → the class's cards in one press): in print only the set reaches the paper, two
//       cards across, no card split across pages; colours are kept; the A4 PDF is saved and its page count recorded.
//   P5  the professional-learning record (/pengembangan/[simpul], E-C1-5; Daisy C1 PIMPINAN.md: an A4 surface, Part A's
//       page rules): printed by its facilitator, no shell part and no provenance footer reaches the paper, as on the
//       report pages; the record itself does. The PD class is made by the product's own functions as Admin Alpha.
//
// Local or CI stack with the synthetic seed: APP_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
// SUPABASE_DB_URL. Writes OUT_DIR/b6-cetak.json, screenshots and PDFs; exits 1 on any FAIL.
import { chromium } from "playwright";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const APP = process.env.APP_URL ?? "http://127.0.0.1:3999";
const SB = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DB = process.env.SUPABASE_DB_URL;
const OUT = process.env.OUT_DIR ?? "audit-out/b6-cetak";
const SLOW = 30000;
const require = createRequire(join(process.env.APP_DIR ?? process.cwd(), "package.json"));
const { createServerClient } = require("@supabase/ssr");

const ORANG = {
  alpha: { key: "alpha", tujuan: "MENGELOLA", email: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" },
  guru: { key: "guru", tujuan: "MENGAJAR", email: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!" },
  siswa: { key: "siswa", tujuan: "BELAJAR", email: "alpha-siswa-1@synthetic.pintar.test", password: "Sintetis-AlphaSiswa1-76!" },
};
const TAG = randomBytes(3).toString("hex");
mkdirSync(OUT, { recursive: true });
const sql = (q) => execFileSync("psql", [DB, "-At", "-v", "ON_ERROR_STOP=1", "-c", q], { encoding: "utf8" }).trim();

const langkah = [];
let gagal = false;
async function step(id, judul, fn) {
  const rec = { id, judul, verdict: "PASS", catatan: [], berkas: [] };
  try { await fn(rec); } catch (e) {
    rec.verdict = "FAIL";
    rec.catatan.push(`error: ${String(e.message ?? e).split("\n")[0].slice(0, 300)}`);
  }
  if (rec.verdict !== "PASS") gagal = true;
  langkah.push(rec);
  console.log(`${rec.verdict.padEnd(5)} ${id} ${judul}\n      ${rec.catatan.join("\n      ")}`);
}
const harus = (rec, ok, kata) => { rec.catatan.push(`${ok ? "ok" : "!!"} ${kata}`); if (!ok) rec.verdict = "FAIL"; return ok; };

async function cookies(p) {
  const jar = new Map();
  const client = createServerClient(SB, ANON, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) },
  });
  const { data, error } = await client.auth.signInWithPassword({ email: p.email, password: p.password });
  if (error || !data.session) throw new Error(`sign-in failed for ${p.key}: ${error?.message ?? "no session"}`);
  return [...jar].map(([name, value]) => ({ name, value, url: APP }));
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
    await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  }
  const pintu = page.locator('[data-pemilih="konteks"] button[data-konteks]');
  if (await pintu.count()) {
    const kunci = await pintu.evaluateAll((bs) => bs.map((b) => b.getAttribute("data-konteks")));
    const pilih = kunci.find((k) => k === p.tujuan) ?? kunci.find((k) => k.split(":")[0] === p.tujuan) ?? kunci[0];
    await page.locator(`[data-pemilih="konteks"] button[data-konteks="${pilih}"]`).click();
    await page.waitForURL((u) => u.pathname !== "/", { timeout: SLOW }).catch(() => {});
    await page.waitForLoadState("networkidle");
  }
  return { context, page };
}
async function buka(page, jalan) {
  await page.goto(`${APP}${jalan}`, { waitUntil: "networkidle" });
  const lewati = page.getByRole("button", { name: /Lewati|Tutup tur|Selesai/ }).first();
  if (await lewati.isVisible().catch(() => false)) await lewati.click().catch(() => {});
}

/**
 * What a printed page shows of the application's own chrome: the shell's parts (Daisy, 08-migration §Print: «no
 * navigation, rail, drawer, top bar, skip link or identity block reaches the paper») that are still rendered in print.
 * The provenance footer (KakiPintar) is not one of them: it prints on ordinary pages by design and is suppressed only
 * where a credential prints (its own header). Pagers and link lists inside the page's content are content.
 */
async function cangkangTercetak(page) {
  return page.evaluate(() => {
    const kelihatan = (el) => {
      const r = el.getBoundingClientRect();
      const g = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && g.display !== "none" && g.visibility !== "hidden";
    };
    const pemilih = ["header.pin-shell", "header.pin-top", "[role=banner]", ".pin-lewati", ".pin-menu-tombol", "[data-menu-akun]",
      ".pin-konteks", "aside", "[data-menu-bagian]"];
    const nama = (p, el) => `${p}${el.className && typeof el.className === "string" ? `.${el.className.split(" ").slice(0, 2).join(".")}` : ""}`;
    const bagian = pemilih.flatMap((p) => [...document.querySelectorAll(p)].filter(kelihatan).map((el) => nama(p, el)));
    // navigation outside the page's own content: the shell's
    const navLuar = [...document.querySelectorAll("nav, [role=navigation]")].filter((el) => kelihatan(el) && !el.closest("main"))
      .map((el) => nama("nav", el));
    return [...bagian, ...navLuar];
  });
}
/** Pages in a PDF, counted from its own page objects. */
function halamanPdf(file) {
  const b = readFileSync(file).toString("latin1");
  return (b.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
}
async function cetak(page, rec, nama) {
  await page.emulateMedia({ media: "print" });
  await page.screenshot({ path: join(OUT, `${nama}-cetak.png`), fullPage: true }).catch(() => null);
  const pdf = join(OUT, `${nama}.pdf`);
  await page.pdf({ path: pdf, format: "A4", printBackground: true });
  rec.berkas.push(`${nama}-cetak.png`, `${nama}.pdf`);
  return pdf;
}

// ── the fixture: three learners an intake placed in one of alpha's classes, with no account yet (they wait for one)
const alphaId = sql("select id from public.institutions where slug like 'synth-alpha-%' limit 1");
const kelas = sql(`select n.id || '|' || n.name from public.org_nodes n join public.memberships m on m.node_id = n.id and m.valid_to is null
   join public.enrollments e on e.id = m.enrollment_id and e.status = 'ACTIVE'
  where n.institution_id = '${alphaId}' and n.kind = 'CLASS' and n.is_active order by n.created_at limit 1`);
const [kelasId, kelasNama] = kelas.split("|");
if (!sql(`select coalesce(namespace, '') from public.institutions where id = '${alphaId}'`)) {
  sql(`update public.institutions set namespace = (select x from (select chr(65 + (g % 26)) || chr(65 + ((g / 26) % 26)) || 'W' as x
     from generate_series(1, 600) g) q where not exists (select 1 from public.institutions t where upper(t.namespace) = q.x) limit 1) where id = '${alphaId}'`);
}
sql(`do $$ declare v uuid; e uuid; contoh record; begin
  perform set_config('app.seed_intent', 'synthetic', true);
  select en.academic_period_id, en.programme_id into contoh from public.enrollments en join public.memberships m on m.enrollment_id = en.id
   where m.node_id = '${kelasId}' and m.valid_to is null limit 1;
  for i in 1..3 loop
    insert into public.persons (display_name) values ('Cetak Walk ${TAG} ' || i) returning id into v;
    perform public.issue_institutional_id(v, '${alphaId}');
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
      values (v, '${alphaId}', contoh.academic_period_id, contoh.programme_id, 'PENDING') returning id into e;
    insert into public.memberships (enrollment_id, node_id, academic_period_id) values (e, '${kelasId}', contoh.academic_period_id);
    update public.enrollments set status = 'ACTIVE' where id = e;
  end loop; end $$`);

const browser = await chromium.launch();
const A = (await masuk(browser, ORANG.alpha)).page;
const G = (await masuk(browser, ORANG.guru)).page;
const M = (await masuk(browser, ORANG.siswa)).page;

await step("P1", "the staff shell in print: no part of the application reaches the paper (/konfigurasi, /aktivasi, /mengajar)", async (rec) => {
  for (const [page, jalan, nama] of [[A, "/konfigurasi", "staf-konfigurasi"], [A, "/aktivasi", "staf-aktivasi"], [G, "/mengajar", "staf-mengajar"]]) {
    await buka(page, jalan);
    harus(rec, (await cangkangTercetak(page)).length > 0, `${jalan} shows its shell on screen (the check can see it)`);
    await cetak(page, rec, nama);
    const sisa = await cangkangTercetak(page);
    harus(rec, sisa.length === 0, `${jalan} in print shows no shell part${sisa.length ? `: ${sisa.join(", ")}` : ""}`);
    await page.emulateMedia({ media: "screen" });
  }
});

await step("P2", "the learner shell in print: no part of the application reaches the paper (/belajar)", async (rec) => {
  await buka(M, "/belajar");
  harus(rec, (await cangkangTercetak(M)).length > 0, "/belajar shows its shell on screen (the check can see it)");
  await cetak(M, rec, "murid-belajar");
  const sisa = await cangkangTercetak(M);
  harus(rec, sisa.length === 0, `/belajar in print shows no shell part${sisa.length ? `: ${sisa.join(", ")}` : ""}`);
  await M.emulateMedia({ media: "screen" });
});

await step("P3", `the class-card sheet in print: only the set, two across, no card split («${kelasNama}»)`, async (rec) => {
  await buka(A, "/aktivasi");
  const pilih = A.locator("section.pin-akt-kelas select");
  if (!harus(rec, (await pilih.count()) === 1, "Aktivasi offers the class's cards")) return;
  const nilai = await pilih.locator("option").evaluateAll((os, id) => os.find((o) => o.value === id)?.value ?? null, kelasId);
  if (!harus(rec, nilai === kelasId, `«${kelasNama}» is offered`)) return;
  await pilih.selectOption(kelasId);
  await A.locator("section.pin-akt-kelas button.pin-primary").click();
  await A.locator(".pin-akt-lembar .pin-akt-kartu").first().waitFor({ timeout: SLOW * 2 });
  await A.waitForLoadState("networkidle");
  const kartu = await A.locator(".pin-akt-lembar .pin-akt-kartu").count();
  harus(rec, kartu >= 3, `the sheet holds ${kartu} cards (the three waiting learners at least)`);
  harus(rec, Number(sql(`select count(*) from public.accounts a join public.persons p on p.id = a.person_id
     where p.display_name like 'Cetak Walk ${TAG} %' and a.kind = 'CLASSROOM_CARD'`)) === 3, "the three learners now hold class cards");
  await A.screenshot({ path: join(OUT, "lembar-layar.png"), fullPage: true });
  const pdf = await cetak(A, rec, "lembar-kartu");
  const tampak = await A.evaluate(() => {
    const kelihatan = (el) => { const r = el.getBoundingClientRect(); const g = getComputedStyle(el); return r.width > 0 && r.height > 0 && g.display !== "none" && g.visibility !== "hidden"; };
    const lembar = document.querySelector(".pin-akt-lembar");
    const luar = [...document.body.querySelectorAll("body *")].filter((el) => kelihatan(el) && !el.contains(lembar) && !lembar.contains(el));
    const kartu = [...document.querySelectorAll(".pin-akt-lembar .pin-akt-kartu")];
    const kolom = new Set(kartu.map((k) => Math.round(k.getBoundingClientRect().left))).size;
    const utuh = kartu.every((k) => ["avoid", "avoid-page"].includes(getComputedStyle(k).breakInside));
    const tombol = [...document.querySelectorAll(".pin-akt-lembar button")].filter(kelihatan).length;
    const latar = getComputedStyle(kartu[0]).borderTopStyle;
    return { luar: luar.slice(0, 5).map((el) => el.tagName.toLowerCase() + (el.className ? `.${String(el.className).split(" ")[0]}` : "")), nLuar: luar.length, kolom, utuh, tombol, latar };
  });
  harus(rec, tampak.nLuar === 0, `in print nothing outside the sheet shows${tampak.nLuar ? `: ${tampak.luar.join(", ")}` : ""}`);
  harus(rec, tampak.kolom === 2, `two cards across (${tampak.kolom} column(s))`);
  harus(rec, tampak.utuh, "no card is split across pages (break-inside: avoid on every card)");
  harus(rec, tampak.tombol === 0, "the sheet's own print button does not print");
  harus(rec, tampak.latar === "dashed", `the cut line prints (${tampak.latar})`);
  const n = halamanPdf(pdf);
  harus(rec, n >= 1 && n <= Math.ceil(kartu / 2), `the A4 PDF has ${n} page(s) for ${kartu} cards`);
  await A.emulateMedia({ media: "screen" });
});

await step("P4", "the Digital Card on «Akun saya» printed: each face CR80 at actual size, no shell part", async (rec) => {
  await buka(A, "/akun");
  const muka = A.locator(".pin-kd-muka");
  if (!harus(rec, (await muka.count()) === 2, `«Akun saya» shows the card's two faces (${await muka.count()})`)) return;
  await cetak(A, rec, "kartu-pintar");
  const lebar = await muka.evaluateAll((ms) => ms.map((m) => Math.round((m.getBoundingClientRect().width * 25.4 / 96) * 10) / 10));
  harus(rec, lebar.every((w) => Math.abs(w - 85.6) <= 0.2), `printed, the faces are ${lebar.join(" and ")} mm wide (CR80 is 85.6)`);
  const sisa = await cangkangTercetak(A);
  harus(rec, sisa.length === 0, `«Akun saya» in print shows no shell part${sisa.length ? `: ${sisa.join(", ")}` : ""}`);
  await A.emulateMedia({ media: "screen" });
});

await step("P5", "the professional-learning record printed: the record, no shell part, no provenance footer (E-C1-5)", async (rec) => {
  // a PD class of alpha's, as Konfigurasi makes it: a Bagian for educators, its Tingkat and Kelas, Guru Alpha the
  // facilitator, two synthetic staff enrolled — each call the product's own function, as Admin Alpha
  sql(`do $$ declare inst uuid := '${alphaId}'; adm uuid; guru uuid; p1 uuid; p2 uuid; b uuid; t uuid; k uuid; j jsonb; th text; begin
    select a.id into adm from auth.users a where a.email = '${ORANG.alpha.email}';
    select ac.person_id into guru from public.accounts ac join auth.users a on a.id = ac.auth_user_id where a.email = '${ORANG.guru.email}';
    select ac.person_id into p1 from public.accounts ac join auth.users a on a.id = ac.auth_user_id where a.email = 'alpha-hod@synthetic.pintar.test';
    select ac.person_id into p2 from public.accounts ac join auth.users a on a.id = ac.auth_user_id where a.email = 'alpha-dean@synthetic.pintar.test';
    perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', adm::text, true);
    execute 'set local role authenticated';
    b := public.create_bagian(inst, 'Pengembangan Guru ${TAG}', true);
    -- the school year of alpha's class above, written as the structure functions read it (YYYY/YYYY+1)
    select extract(year from ap.starts_on)::int || '/' || (extract(year from ap.starts_on)::int + 1) into th
      from public.org_nodes n join public.academic_periods ap on ap.id = n.academic_period_id where n.id = '${kelasId}';
    t := public.create_tingkat(b, 'Guru ${TAG}', th);
    k := public.create_kelas(t, 'Kelas PD ${TAG}', th);
    perform public.grant_role(guru, 'EDUCATOR', k, now() + interval '1 year');
    j := public.enrol_for_professional_learning(p1, k);
    j := public.enrol_for_professional_learning(p2, k);
  end $$`);
  const pd = sql(`select id from public.org_nodes where institution_id = '${alphaId}' and kind = 'CLASS' and name = 'Kelas PD ${TAG}'`);
  if (!harus(rec, /^[0-9a-f-]{36}$/.test(pd), "the PD class was made through the product's functions")) return;
  await buka(G, `/pengembangan/${pd}`);
  harus(rec, (await G.locator("main .pin-head, main h1").count()) > 0 && (await G.locator(".pin-refusal").count()) === 0, "the facilitator reads the record");
  harus(rec, await G.locator("footer.pin-kaki").first().isVisible().catch(() => false), "the provenance footer shows on screen");
  await cetak(G, rec, "pengembangan");
  const sisa = await cangkangTercetak(G);
  harus(rec, sisa.length === 0, `the record in print shows no shell part${sisa.length ? `: ${sisa.join(", ")}` : ""}`);
  harus(rec, !(await G.locator("footer.pin-kaki").first().isVisible().catch(() => false)), "the provenance footer stays off the paper, as on the report pages");
  harus(rec, await G.locator("main h1").first().isVisible().catch(() => false), "the record itself reaches the paper");
  await G.emulateMedia({ media: "screen" });
});

await step("P6", "a Konfigurasi section page in print: its content only, no form, record action, pager or back link (B1 §2 A4)", async (rec) => {
  for (const [jalan, nama, isi] of [["/konfigurasi/audit", "konfigurasi-audit", "table.pin-tabel"], ["/konfigurasi/roles", "konfigurasi-peran", "#roles li"],
    ["/konfigurasi/pemeliharaan", "konfigurasi-pemeliharaan", "#pemeliharaan h2#pin-pm-daftar"]]) {
    await buka(A, jalan);
    const kontrol = async () => A.evaluate(() => {
      const kelihatan = (el) => { const r = el.getBoundingClientRect(); const g = getComputedStyle(el); return r.width > 0 && r.height > 0 && g.display !== "none" && g.visibility !== "hidden"; };
      return ["main form", "main [data-buka-ubah]", "main [data-penomoran]", "main .pin-back"].flatMap((p) => [...document.querySelectorAll(p)].filter(kelihatan).map(() => p));
    });
    harus(rec, (await kontrol()).length > 0, `${jalan} draws its controls on screen (the check can see them)`);
    await cetak(A, rec, nama);
    const sisa = await kontrol();
    harus(rec, sisa.length === 0, `${jalan} in print shows no control${sisa.length ? `: ${[...new Set(sisa)].join(", ")}` : ""}`);
    harus(rec, await A.locator(isi).first().isVisible(), `${jalan} in print keeps its content (${isi})`);
    if (jalan.endsWith("/audit")) {
      const latar = await A.locator("table.pin-tabel tbody tr:nth-child(2) > *").first().evaluate((el) => getComputedStyle(el).printColorAdjust ?? getComputedStyle(el).webkitPrintColorAdjust);
      harus(rec, latar === "exact", `the audit trail's stripes print (print-color-adjust: ${latar})`);
    }
    harus(rec, (await cangkangTercetak(A)).length === 0, `${jalan} in print shows no shell part`);
    await A.emulateMedia({ media: "screen" });
  }
});

await browser.close();
writeFileSync(join(OUT, "b6-cetak.json"), JSON.stringify({ app: APP, tag: TAG, langkah }, null, 2));
console.log(`\n${langkah.filter((l) => l.verdict === "PASS").length}/${langkah.length} PASS`);
process.exit(gagal ? 1 : 0);
