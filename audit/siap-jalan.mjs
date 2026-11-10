// Readiness walk (Daisy, 8 Nov): the corrected screens in the real application, at 1280, 390 and A4.
// Local synthetic stack only (supabase/seed). Reads; the one act it starts (Keluar dari semua) it cancels.
import { chromium } from "playwright";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const APP = process.env.APP_URL ?? "http://127.0.0.1:3999";
const SB = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OUT = process.env.OUT_DIR ?? "audit-out/siap-jalan";
const SLOW = 30000;
const require = createRequire(join(process.cwd(), "package.json"));
const { createServerClient } = require("@supabase/ssr");

const DB = process.env.SUPABASE_DB_URL;
// SQL PREPARES A FIXTURE AND READS RESULTS BACK; every act is done in the browser by the signed-in person
const sql = (q) => execFileSync("psql", [DB, "-At", "-v", "ON_ERROR_STOP=1", "-c", q], { encoding: "utf8" }).trim();
// a step whose state the fixture could not reach says so; it is never a PASS (Daisy, 8 Nov: R5 and R6 were hollow)
const belum = (rec, kata) => { rec.catatan.push(`-- NOT EXERCISED: ${kata}`); if (rec.verdict === "PASS") rec.verdict = "NOT EXERCISED"; };
const ORANG = {
  admin: { key: "admin", tujuan: "MENGELOLA", email: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" },
  guru: { key: "guru", tujuan: "MENGAJAR", email: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!" },
  dekan: { key: "dekan", tujuan: "MEMIMPIN", email: "alpha-dean@synthetic.pintar.test", password: "Sintetis-AlphaDean-33!" },
};
mkdirSync(OUT, { recursive: true });
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();

const langkah = [];
async function step(id, judul, fn) {
  const rec = { id, judul, verdict: "PASS", catatan: [], shots: [] };
  try { await fn(rec); } catch (e) { rec.verdict = "FAIL"; rec.catatan.push(`error: ${String(e.message ?? e).split("\n")[0].slice(0, 300)}`); }
  langkah.push(rec);
  console.log(`${rec.verdict.padEnd(5)} ${id} ${judul}\n      ${rec.catatan.join("\n      ")}`);
}
const harus = (rec, ok, kata) => { rec.catatan.push(`${ok ? "ok" : "!!"} ${kata}`); if (!ok) rec.verdict = "FAIL"; return ok; };
async function shot(page, rec, nama) {
  const f = `${String(langkah.length + 1).padStart(2, "0")}-${nama}.png`;
  await page.screenshot({ path: join(OUT, f), fullPage: true }).catch(() => null);
  rec.shots.push(f);
}
async function lebar(page) {
  return page.evaluate(() => ({ s: document.documentElement.scrollWidth, w: window.innerWidth }));
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
async function masuk(browser, p, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport, locale: "id-ID", timezoneId: "Asia/Jakarta" });
  await context.addCookies(await cookies(p));
  const page = await context.newPage();
  await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  if (new URL(page.url()).pathname === "/perangkat") {
    await page.locator('input[type="radio"][name="mode"][value="PERSONAL"]').check();
    await page.getByRole("button", { name: "Simpan pilihan" }).click();
    await page.waitForURL((u) => u.pathname !== "/perangkat", { timeout: SLOW }).catch(() => {});
    await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  }
  const pintu = page.locator('[data-pemilih="konteks"] button[data-konteks]');
  if (await pintu.count()) {
    const kunci = await pintu.evaluateAll((bs) => bs.map((b) => b.getAttribute("data-konteks")));
    const pilih = kunci.find((k) => k.split(":")[0] === p.tujuan) ?? kunci[0];
    await page.locator(`[data-pemilih="konteks"] button[data-konteks="${pilih}"]`).click();
    await page.waitForURL((u) => u.pathname !== "/", { timeout: SLOW }).catch(() => {});
  }
  await page.waitForLoadState("networkidle");
  return { context, page };
}
async function buka(page, jalan) {
  const r = await page.goto(`${APP}${jalan}`, { waitUntil: "networkidle" });
  const lewati = page.getByRole("button", { name: /Lewati|Tutup tur/ }).first();
  if (await lewati.isVisible().catch(() => false)) await lewati.click().catch(() => {});
  return r;
}

const browser = await chromium.launch();

// ── A2: the Guru reaches their own Ringkasan Kelas from the class page.
await step("R1", "Guru: Kelas → Ringkasan Kelas (A2), at 1280 and 390", async (rec) => {
  for (const vp of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const { context, page } = await masuk(browser, ORANG.guru, vp);
    await buka(page, "/mengajar");
    const kelas = await page.locator('a[href^="/mengajar/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")).filter((h) => /^\/mengajar\/[0-9a-f-]{36}$/.test(h)));
    if (!harus(rec, kelas.length > 0, `${vp.width}px: the Guru has a class (${kelas.length})`)) { await context.close(); continue; }
    await buka(page, kelas[0]);
    const tautan = page.locator('a[href^="/edukator/ringkasan?kelas="]');
    harus(rec, (await tautan.count()) === 1, `${vp.width}px: the class page offers «${norm(await tautan.first().textContent().catch(() => ""))}»`);
    await shot(page, rec, `guru-kelas-${vp.width}`);
    await tautan.first().click();
    await page.waitForURL((u) => u.pathname === "/edukator/ringkasan", { timeout: SLOW }).catch(() => {});
    await page.waitForLoadState("networkidle");
    const u = new URL(page.url());
    harus(rec, u.pathname === "/edukator/ringkasan", `${vp.width}px: it opens ${u.pathname}`);
    harus(rec, (await page.locator(".pin-lk").count()) > 0, `${vp.width}px: the summary renders`);
    const kembali = norm(await page.locator(".pin-back, a.pin-kembali, [data-kembali]").first().textContent().catch(() => ""));
    rec.catatan.push(`   back link reads «${kembali}»`);
    const l = await lebar(page);
    harus(rec, l.s <= l.w, `${vp.width}px: no sideways scroll (${l.s} ≤ ${l.w})`);
    await shot(page, rec, `guru-ringkasan-${vp.width}`);
    await context.close();
  }
});

// ── A1 and B3: Pendataan's guidance, its example, the Kode sekolah prerequisite.
await step("R2", "Admin: Pendataan guidance, example and Kode sekolah (A1, B3)", async (rec) => {
  const { context, page } = await masuk(browser, ORANG.admin);
  await buka(page, "/pendataan");
  const perluKode = await page.locator("[data-perlu-kode]").count();
  const contoh = await page.locator("pre.pin-contoh-daftar").count();
  harus(rec, perluKode + contoh > 0, `the page either says the code is needed first (${perluKode}) or shows the example list (${contoh})`);
  if (contoh) rec.catatan.push(`   example: «${norm(await page.locator("pre.pin-contoh-daftar").textContent())}»`);
  if (perluKode) rec.catatan.push(`   «${norm(await page.locator("[data-perlu-kode]").textContent())}»`);
  const l = await lebar(page);
  harus(rec, l.s <= l.w, `no sideways scroll (${l.s} ≤ ${l.w})`);
  await shot(page, rec, "admin-pendataan");
  await context.close();
});

// ── B2: Peran & akses says what it is for, and the order of role then activation.
await step("R3", "Admin: Peran & akses intro, form heading, scope and date hints; Aktivasi intro (B2)", async (rec) => {
  const { context, page } = await masuk(browser, ORANG.admin);
  await buka(page, "/konfigurasi/roles");
  const teks = norm(await page.locator("main").textContent());
  harus(rec, /aktivasi/i.test(teks), "Peran & akses mentions activation");
  harus(rec, (await page.locator("main #pin-beri-peran").count()) === 1, "the grant form has a heading");
  const lingkup = page.locator('main select[name*="node"], main select[name*="lingkup"], main select[name*="scope"]');
  if (await lingkup.count()) {
    harus(rec, await lingkup.first().evaluate((e) => e.required), "the scope field is required");
    const d = await lingkup.first().getAttribute("aria-describedby");
    rec.catatan.push(`   scope hint linked: ${d ? "yes" : "no"}`);
  }
  await shot(page, rec, "admin-peran");
  await buka(page, "/aktivasi");
  rec.catatan.push(`   Aktivasi opens: «${norm(await page.locator("main p").first().textContent()).slice(0, 160)}»`);
  await shot(page, rec, "admin-aktivasi");
  await context.close();
});

// ── B4: a destructive act asks first, by keyboard. «Keluar dari semua» on /akun, cancelled.
await step("R4", "Keyboard: «Keluar dari semua» asks in place, focus on Batal, Batal returns (B4)", async (rec) => {
  const { context, page } = await masuk(browser, ORANG.admin);
  await buka(page, "/akun");
  const tombol = page.getByRole("button", { name: /Keluar dari semua/ }).first();
  if (!harus(rec, await tombol.isVisible().catch(() => false), "/akun offers «Keluar dari semua»")) { await context.close(); return; }
  await tombol.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  const fokus = await page.evaluate(() => (document.activeElement && document.activeElement !== document.body) ? `${document.activeElement.tagName}:${document.activeElement.textContent?.trim()}` : "BODY");
  harus(rec, /^BUTTON:Batal$/.test(fokus), `focus moved to the safe choice («${fokus}»)`);
  const merah = page.locator("main .pin-bahaya-pasti:visible");
  harus(rec, (await merah.count()) === 1, "the act is the one red button");
  await shot(page, rec, "akun-keluar-tanya");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  const balik = await page.evaluate(() => (document.activeElement && document.activeElement !== document.body) ? `${document.activeElement.tagName}:${document.activeElement.textContent?.trim()}` : "BODY");
  harus(rec, /^BUTTON:Keluar dari semua/.test(balik), `Batal returns focus to the first button («${balik}»)`);
  harus(rec, new URL(page.url()).pathname === "/akun", "nothing was sent: still on /akun");
  await context.close();
});

// ── B5 and B6: leadership's reports, «explain once», and the topics × classes grid on A4.
await step("R5", "Dekan: reports explain below-target once; the grid prints on A4 (B5, B6)", async (rec) => {
  const { context, page } = await masuk(browser, ORANG.dekan);
  await buka(page, "/pimpinan");
  const laporan = await page.locator('main a[href*="/pimpinan/"], main a[href*="/edukator/ringkasan"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
  rec.catatan.push(`   report links offered: ${laporan.length}`);
  let kisi = 0;
  for (const h of laporan.slice(0, 12)) {
    await buka(page, h);
    if (!(await page.locator(".pin-lk").count())) continue;
    const ket = await page.locator("[data-lk-ket-bawah]").count();
    const kataTerlihat = await page.evaluate(() => {
      const kata = /di bawah target|Perlu penguatan/;
      return [...document.querySelectorAll(".pin-lk td, .pin-lk li")].filter((e) => {
        const vis = [...e.childNodes].map((n) => (n.nodeType === 3 ? n.textContent : (n.classList?.contains("pin-sr") ? "" : n.textContent))).join("");
        return kata.test(vis);
      }).length;
    });
    rec.catatan.push(`   ${h.slice(0, 70)}: legend ${ket}, below-target words drawn in cells ${kataTerlihat}`);
    if (kataTerlihat > 0) harus(rec, false, `«explain once» broken on ${h}`);
    if (await page.locator("[data-kisi-lebar]").count()) {
      kisi++;
      await page.emulateMedia({ media: "print" });
      const pdf = join(OUT, `kisi-${kisi}.pdf`);
      await page.pdf({ path: pdf, preferCSSPageSize: true, printBackground: true });
      const { readFileSync } = await import("node:fs");
      const n = (readFileSync(pdf, "latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
      const atas = await page.evaluate(() => document.querySelector("[data-kisi-lebar]")?.getBoundingClientRect().top ?? -1);
      rec.catatan.push(`   grid printed: ${n} page(s), grid starts at ${Math.round(atas)} px from the top`);
      await page.emulateMedia({ media: "screen" });
    }
    await shot(page, rec, `dekan-laporan-${laporan.indexOf(h)}`);
  }
  rec.catatan.push(`   grids met: ${kisi}`);
  if (kisi === 0) belum(rec, "no topics × classes grid on this seed (B5 is shown by Daisy's render and LAPORAN-CETAK-01)");
  await context.close();
});

// ── B1: Studio does not imply notifications exist.
await step("R6", "Guru: Studio says who acts next and that PINTAR sends no notification (B1)", async (rec) => {
  const { context, page } = await masuk(browser, ORANG.guru);
  await buka(page, "/studio");
  const teks = norm(await page.locator("main").textContent());
  harus(rec, !/akan diberi tahu|akan menerima pemberitahuan|notifikasi telah dikirim/i.test(teks), "no promise of a notification on Studio");
  rec.catatan.push(`   rows waiting on someone else: ${await page.locator("[data-menunggu-lain]").count()}`);
  const paket = await page.locator('a[href^="/studio/paket/"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
  for (const h of paket.slice(0, 6)) {
    await buka(page, h);
    if (await page.locator("[data-menunggu]").count()) {
      const m = norm(await page.locator("[data-menunggu]").first().textContent());
      harus(rec, /tidak mengirim pemberitahuan/.test(m) || !/beri tahu/.test(m), `waiting state on ${h}: «${m.slice(0, 160)}»`);
      await shot(page, rec, "studio-menunggu");
    }
  }
  if (!(await page.locator("[data-menunggu-lain]").count())) belum(rec, "no package waiting on someone else on this seed (R10 reads the counts)");
  await shot(page, rec, "guru-studio");
  await context.close();
});

// ── The same pattern elsewhere (owner, 8 Nov): Struktur's rename and deactivation, by keyboard, both cancelled.
await step("R7", "Keyboard: Struktur «Ubah nama» and «Nonaktifkan» take focus in and give it back", async (rec) => {
  const { context, page } = await masuk(browser, ORANG.admin);
  await buka(page, "/konfigurasi/struktur");
  const fokus = () => page.evaluate(() => {
    const e = document.activeElement;
    if (!e || e === document.body) return "BODY";
    return `${e.tagName}:${e.getAttribute("name") ?? ""}:${(e.textContent ?? "").trim().slice(0, 40)}`;
  });
  for (const [kata, masukKe] of [["Ubah nama", /^INPUT:nama:/], ["Nonaktifkan", /^INPUT:alasan:/]]) {
    const tombol = page.locator(".pin-str-aksi button", { hasText: kata }).first();
    if (!harus(rec, await tombol.isVisible().catch(() => false), `a row offers «${kata}»`)) continue;
    await tombol.focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    const di = await fokus();
    harus(rec, masukKe.test(di), `«${kata}» puts focus in its field (${di})`);
    await shot(page, rec, `struktur-${kata.split(" ")[0].toLowerCase()}`);
    await page.locator(".pin-str-baris button", { hasText: "Batal" }).first().click();
    await page.waitForTimeout(300);
    const balik = await fokus();
    harus(rec, balik.startsWith(`BUTTON::${kata}`), `«Batal» returns focus to «${kata}» (${balik})`);
  }
  await context.close();
});

// ── Owner decision 1: a learner recorded without a class is counted, found and placed by the administrator.
await step("R8", "Admin: a learner without a class is counted in «Yang menunggu», placed from Pindah, and leaves the list", async (rec) => {
  const sekolah = sql("select i.id from public.institutions i join public.accounts a on true join auth.users u on u.id = a.auth_user_id "
    + "join public.role_assignments r on r.person_id = a.person_id and r.role = 'INSTITUTION_ADMIN' and r.revoked_at is null "
    + `where u.email = '${ORANG.admin.email}' and r.institution_id = i.id limit 1`);
  if (!harus(rec, Boolean(sekolah), "the administrator's school")) return;
  sql(`update public.institutions set namespace = 'ALP' where id = '${sekolah}' and namespace is null`);
  const nama = `Murid Tanpa Kelas ${Date.now() % 100000}`;
  const orang = sql(`insert into public.persons (display_name) values ('${nama}') returning id`).split("\n")[0];
  sql(`select public.issue_institutional_id('${orang}', '${sekolah}')`);
  const { context, page } = await masuk(browser, ORANG.admin);
  await buka(page, "/konfigurasi");
  harus(rec, /belum punya kelas/.test(norm(await page.locator("main").textContent())), "«Yang menunggu» counts the learner without a class");
  await buka(page, "/konfigurasi/pindah#tempatkan");
  const baris = page.locator("[data-tanpa-kelas] li", { hasText: nama });
  if (!harus(rec, (await baris.count()) === 1, "Pindah lists the learner without a class")) { await context.close(); return; }
  await shot(page, rec, "pindah-tanpa-kelas");
  const pilihan = await baris.locator("select option").evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
  if (!harus(rec, pilihan.length > 0, "a learners' Kelas is offered")) { await context.close(); return; }
  await baris.locator("select").selectOption(pilihan[0]);
  await baris.getByRole("button", { name: /Masukkan ke kelas/ }).click();
  // the server action redirects back with its result: wait for it, not for the click
  await page.waitForURL((u) => u.searchParams.has("hasil") || u.searchParams.has("kode"), { timeout: SLOW }).catch(() => {});
  await page.waitForLoadState("networkidle");
  harus(rec, /Murid sudah ditempatkan di kelas/.test(norm(await page.locator("main").textContent())), "the success line is shown");
  harus(rec, (await page.locator("[data-tanpa-kelas] li", { hasText: nama }).count()) === 0, "the learner leaves the list");
  const m = sql(`select count(*) from public.memberships m join public.enrollments e on e.id = m.enrollment_id where e.person_id = '${orang}' and m.valid_to is null and m.node_id = '${pilihan[0]}'`);
  harus(rec, m === "1", `the database holds one open placement in the chosen Kelas (${m})`);
  const a = sql(`select count(*) from public.audit_log where action = 'LEARNER_PLACED' and summary->>'person_id' = '${orang}'`);
  harus(rec, a === "1", `the placement is audited (${a})`);
  await shot(page, rec, "pindah-ditempatkan");
  await context.close();
});

// ── Owner decision 2: «Tandai lolos pemeriksaan» runs the check; an ERROR refuses the step, nothing moves, it says why.
await step("R9", "Author (Admin sekolah, an author role; Alpha's Guru is scoped to 5A): the content check refuses the mark on a real ERROR, changes nothing, and says how to correct it", async (rec) => {
  // A PACKAGE OF ITS OWN, built as fable05's f05_private_course builds one, so no seeded package another suite reads
  // is moved: the walk once took «Paket Internal Alpha» to STRUCTURED, and fable05 then failed on it (9 Nov)
  const sekolah = sql("select i.id from public.institutions i join public.role_assignments r on r.institution_id = i.id "
    + "join public.accounts a on a.person_id = r.person_id join auth.users u on u.id = a.auth_user_id "
    + `where u.email = '${ORANG.admin.email}' and r.role = 'INSTITUTION_ADMIN' and r.revoked_at is null limit 1`);
  if (!sekolah) { belum(rec, "no administrator's school on this seed"); return; }
  const judul = `Paket Uji Periksa ${Date.now() % 1000000}`;
  const course = sql(`insert into public.courses (institution_id, subject, stage, grade_label, title) values ('${sekolah}', 'Matematika', 'SD', 'Kelas 5', '${judul}') returning id`).split("\n")[0];
  const modul = sql(`insert into public.modules (course_id, institution_id, ordinal, title) values ('${course}', '${sekolah}', 1, 'modul uji') returning id`).split("\n")[0];
  const les = sql(`insert into public.lessons (module_id, institution_id, ordinal, title, body_markdown) values ('${modul}', '${sekolah}', 1, 'pelajaran uji', 'isi uji') returning id`).split("\n")[0];
  // a stem whose key word appears only in its correct option: STEM_REVEALS_ANSWER, an ERROR the check itself finds
  const item = sql(`insert into public.items (lesson_id, institution_id, item_type, bank_type, stem) values ('${les}', '${sekolah}', 'MCQ_SINGLE', 'PRACTICE', 'Berapa hasil penjumlahan ini? Jawabannya limabelas.') returning id`).split("\n")[0];
  sql(`insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale) values ('${item}', '${sekolah}', 'A', 'limabelas', true, 'Ini hasil penjumlahannya.')`);
  sql(`insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale) values ('${item}', '${sekolah}', 'B', 'tujuh', false, 'Ini bukan hasil penjumlahannya.')`);
  const { context, page } = await masuk(browser, ORANG.admin);
  await buka(page, `/studio/paket/${course}`);
  const susun = page.getByRole("button", { name: "Tandai sudah tersusun", exact: true });
  if (await susun.isVisible().catch(() => false)) {
    await susun.click();
    await page.getByRole("button", { name: "Tandai lolos pemeriksaan", exact: true }).waitFor({ timeout: SLOW }).catch(() => {});
    await page.waitForLoadState("networkidle");
  }
  const sebelum = sql(`select status from public.courses where id = '${course}'`);
  const langkahSebelum = sql(`select count(*) from public.audit_log where action = 'content.status_changed' and target_id = '${course}'`);
  const tandai = page.getByRole("button", { name: "Tandai lolos pemeriksaan", exact: true });
  if (!harus(rec, await tandai.isVisible().catch(() => false), `«Tandai lolos pemeriksaan» is offered (status ${sebelum})`)) { await context.close(); return; }
  await tandai.click();
  // the action redirects with its result (?bagian=…&kode=…); wait for that, not for any text already on the page
  await page.waitForURL((u) => u.searchParams.has("kode") || u.searchParams.has("hasil"), { timeout: SLOW }).catch(() => {});
  await page.waitForLoadState("networkidle");
  // Daisy (9 Nov): the first press runs the whole check; wait until no button still says «Memproses…» and the refusal is
  // on the page, so the walk never reads or photographs the intermediate state
  await page.waitForFunction(() => !/Memproses…/.test(document.body.innerText) && /menemukan hal yang wajib diperbaiki/.test(document.body.innerText),
    null, { timeout: SLOW }).catch(() => {});
  const teks = norm(await page.locator("main").textContent());
  harus(rec, /menemukan hal yang wajib diperbaiki/.test(teks), "the refusal says the check found what must be fixed");
  harus(rec, /Lihat Temuan di bawah/.test(teks), "the refusal names where the correction starts");
  const sesudah = sql(`select status from public.courses where id = '${course}'`);
  harus(rec, sesudah === sebelum && sesudah === "STRUCTURED", `the package did not move (${sebelum} → ${sesudah})`);
  const langkahSesudah = sql(`select count(*) from public.audit_log where action = 'content.status_changed' and target_id = '${course}'`);
  harus(rec, langkahSesudah === langkahSebelum, `no step was recorded (${langkahSebelum} → ${langkahSesudah})`);
  const err = sql(`select count(*) from public.mcq_quality_findings where course_id = '${course}' and severity = 'ERROR' and acknowledged_at is null`);
  harus(rec, Number(err) > 0, `the check itself recorded the ERROR (${err})`);
  harus(rec, /Kata khas pada pertanyaan hanya muncul di pilihan yang benar/.test(teks) || (await page.locator("#temuan").count()) > 0, "Temuan shows the finding");
  await shot(page, rec, "periksa-ditolak");
  await context.close();
});

// ── Owner decision 3: every Studio count equals the list it opens.
await step("R10", "Studio: every count opens a list of exactly that many packages (Guru, Admin)", async (rec) => {
  let dibaca = 0;
  for (const o of [ORANG.guru, ORANG.admin]) {
    const { context, page } = await masuk(browser, o);
    await buka(page, "/studio");
    const kartu = await page.locator('a.pin-kartu-tautan[href^="/studio?daftar="]').evaluateAll((as) => as.map((a) => ({
      href: a.getAttribute("href"), n: Number((a.querySelector(".pin-studio-angka")?.textContent ?? "").replace(/\D/g, "")) })));
    for (const k of kartu) {
      await buka(page, k.href);
      const n = await page.locator('#paket a[href^="/studio/paket/"]').evaluateAll((as) => new Set(as.map((a) => a.getAttribute("href"))).size);
      harus(rec, n === k.n || (k.n > 30 && n === 30), `${o.key} ${k.href}: the count ${k.n}, the list ${n}`);
      dibaca++;
    }
    await context.close();
  }
  if (dibaca === 0) belum(rec, "no Studio count with a list on this seed");
});

await browser.close();
writeFileSync(join(OUT, "ringkasan.json"), JSON.stringify(langkah, null, 2));
const lulus = langkah.filter((l) => l.verdict === "PASS").length;
const kosong = langkah.filter((l) => l.verdict === "NOT EXERCISED").length;
console.log(`${lulus}/${langkah.length} PASS, ${kosong} NOT EXERCISED, ${langkah.length - lulus - kosong} FAIL`);
process.exit(langkah.some((l) => l.verdict === "FAIL") ? 1 : 0);
