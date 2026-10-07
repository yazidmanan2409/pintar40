// STAGING ONLY. The Golden School's students (docs/recovery/GOLDEN-SCHOOL-CONTRACT.md §5), after the school admin,
// the head of department and the teacher have done their part (golden-school-admin.mjs, GS-04 to GS-11):
//
//   M0  read only: the school GS_SLUG, «Kelas 5A» with its five students, the published chapter given to the class
//       (GS-11), its post-test sealed at the school's mark.
//   M1  GS-07, its second half (J3.7, M7): the school admin signs in with their password (masuk.mjs) and, on Aktivasi, makes
//       the class's cards in one press as a printable class set; the walk reads the five cards from that set.
//   M2  GS-12 (J2.19): the primary student signs in with their class card and lands on /belajar with the chapter.
//   M3  GS-13 (J6.2, J6.5–J6.9): by clicking, the chapter → its Pemetaan Awal → the explicit «Mulai Pemetaan Awal» →
//       answers → «Selesaikan pemetaan». No sitting exists before that press (J6.2: opening is not starting).
//   M4  GS-14 (J6.3): every lesson read to its last page by clicking «Halaman berikutnya», each lesson reached by the
//       previous one's link; after the last, the page offers the post-test.
//   M5  GS-15 (J6.10, J6.11, J6.15): the post-test by that link; «Mulai Uji Penguasaan»; each answer saved
//       («Simpan jawaban ini» → «Tersimpan»); «Kumpulkan» asks first; the result says how many were right and that
//       the school's target was met (M3). No sitting before «Mulai Uji Penguasaan»; the result shows her own growth
//       (the Pemetaan Awal's mastery → the Uji Penguasaan's) and no rank, class average or other learner (J6.11).
//   M6  GS-16: the four other students sign in with their cards and, every page by clicking as the primary student,
//       sit the Pemetaan Awal, read the lessons and sit the Uji Penguasaan, to a plan that puts the class's figures
//       above the five-learner floor and its results on both sides of the school's mark.
//   M7  read back, read only: every sitting FINALIZED; the post-tests OFFICIAL, sealed at the school's mark; each
//       student's mastery and pass/fail as planned.
//
// ONE RUN. A card's PIN is shown once, so the cards are made and used in this run and never kept: after M1, a student
// signs in again only with a card the school admin re-issues (GS-21; golden-school-laporan.mjs R1 does so for the two
// it needs), or on a new Golden School (C1). Every page is reached by clicking: the four other students too, since 6 Oct
// (CR-61; until then they opened their two tests by typed address, a declared bypass). NEVER: production; a direct write (the database is read in read-only
// transactions; every write is a press of PINTAR's buttons); a server-made session as a person's act.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { APP, SLOW, closeTour } from "../perf/lib.mjs";
import { keadaanDari, masukStaf } from "./masuk.mjs";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const DB = env("STAGING_SUPABASE_DB_URL");
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const SLUG = env("GS_SLUG");
const OUT = process.env.OUT_DIR ?? "out";
const SUMMARY = process.env.GITHUB_STEP_SUMMARY;
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF) || !APP.includes("staging")) throw new Error("not staging");
if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(SLUG)) throw new Error("GS_SLUG is not a school slug");
mkdirSync(join(OUT, "shots"), { recursive: true });

// the recipe (§4), as golden-school-admin.mjs made it
const ADMIN_EMAIL = `goldenschool+${SLUG}-admin@pintarselalu.com`;
const KELAS = "Kelas 5A";
const BAB = "Matematika Kelas 5 · Bab 1: Bilangan Cacah sampai 100.000";
const MURID = ["Utama", "Bunga", "Citra", "Dimas", "Eka"].map((n) => `${n} Murid ${SLUG.toUpperCase()}`);
// the share each student answers right, pre-test then post-test: the primary student passes; with the school's 70%
// three pass and two do not (0.625 and 0.5), so the result page is read on both sides of the mark
const RENCANA = [[0.5, 1], [0.25, 0.75], [0, 0.625], [0.75, 1], [0.5, 0.5]];

const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8" }).trim();
const lit = (s) => { if (String(s).includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const log = (s) => { console.log(s); if (SUMMARY) appendFileSync(SUMMARY, `${s}\n`); };
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

const results = [];
let shotN = 0;
async function shot(page, name) {
  const f = join(OUT, "shots", `${String(++shotN).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: f, fullPage: true }).catch(() => {});
  return f;
}
async function step(id, title, fn) {
  const rec = { verdict: "PASS" };
  let detail;
  try { detail = await fn(rec); } catch (e) { rec.verdict = "FAIL"; detail = String(e.message ?? e).split("\n")[0].slice(0, 300); }
  results.push({ id, verdict: rec.verdict });
  log(`${rec.verdict.padEnd(5)} ${id}  ${title} :: ${detail}`);
  return rec.verdict;
}
async function klikTautan(page, href) {
  const a = page.locator(`a[href="${href}"]`).first();
  await a.waitFor({ state: "visible", timeout: SLOW });
  await a.click();
  await page.waitForURL((u) => u.pathname + u.search === href || u.pathname === href, { timeout: SLOW });
  await page.waitForLoadState("networkidle");
  await closeTour(page);
}
// a person signs in as Gate 3 has it (masuk.mjs): activation the first time, the password after; where it lands
const jalanMasuk = new Map();
async function masukSurel(page, email) {
  const r = await masukStaf(page, email, keadaanDari(sql, lit));
  jalanMasuk.set(email, `${r.jalan}${r.lewat.length ? ` (${r.lewat.join(" → ")})` : ""}`);
  return r.di;
}
async function masukKartu(page, k) {
  await page.goto(`${APP}/masuk`, { timeout: SLOW, waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Gunakan kartu kelas" }).click();
  await page.locator("#kartu").fill(k.number);
  await page.locator("#pin").fill(k.pin);
  await page.getByRole("button", { name: "Masuk dengan kartu" }).click();
  await page.waitForURL((u) => u.pathname !== "/masuk" && u.pathname !== "/masuk/kartu", { timeout: SLOW });
  await page.waitForLoadState("networkidle");
  await closeTour(page);
  return new URL(page.url()).pathname;
}

// ── read-only facts
let S = null;
const ctx = () => browser.newContext({ viewport: { width: 820, height: 1180 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
// the answer key, from the chapter in the school: each question's stem → its right and wrong option texts
const KUNCI = new Map();
const SOAL = { pre: 0, post: 0 };

const browser = await chromium.launch();

await step("M0", `read only: «${SLUG}», «${KELAS}» with its five students, «${BAB}» published and given to the class (GS-11), its post-test sealed at the school's mark`, async (rec) => {
  const r = sql(`select i.id || '|' || i.name || '|' || k.id || '|' || c.id || '|' || la.id || '|' ||
      coalesce((select string_agg(d.mode::text || ':' || coalesce(aa.pass_mark::text, '-'), ',' order by d.mode::text)
        from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
       where aa.learning_assignment_id = la.id), '-') || '|' ||
      (select count(distinct e.person_id) from public.memberships m join public.enrollments e on e.id = m.enrollment_id
        join public.persons p on p.id = e.person_id where m.node_id = k.id and m.valid_to is null and p.display_name in (${MURID.map(lit).join(",")})) || '|' ||
      (select count(*) from public.accounts a join public.persons p on p.id = a.person_id where p.display_name in (${MURID.map(lit).join(",")}))
    from public.institutions i
    join public.org_nodes k on k.institution_id = i.id and k.kind = 'CLASS' and k.name = ${lit(KELAS)} and k.is_active
    join public.courses c on c.institution_id = i.id and c.title = ${lit(BAB)}
    join public.learning_assignments la on la.course_id = c.id and la.node_id = k.id
   where i.slug = ${lit(SLUG)} order by la.created_at desc limit 1`);
  if (!r) { rec.verdict = "FAIL"; return `no published chapter given to «${KELAS}» in «${SLUG}» (GS-04 to GS-11)`; }
  const [id, nama, kelas, kursus, tugas, segel, murid, akun] = r.split("|");
  S = { id, nama, kelas, kursus, tugas, segel, akun: Number(akun) };
  for (const row of sql(`select replace(replace(i.stem, chr(13), ' '), chr(10), ' ') || chr(31) || coalesce(i.cycle_role::text, '-') || chr(31) ||
        string_agg(replace(replace(o.body, chr(13), ' '), chr(10), ' ') || chr(30) || o.is_correct::text, chr(29) order by o.label)
      from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
      join public.item_options o on o.item_id = i.id where m.course_id = '${kursus}' group by i.id, i.stem, i.cycle_role`).split("\n").filter(Boolean)) {
    const [stem, peran, opsi] = row.split("\x1f");
    const pasang = opsi.split("\x1d").map((x) => x.split("\x1e"));
    KUNCI.set(norm(stem), { right: new Set(pasang.filter(([, b]) => b === "true").map(([t]) => norm(t))),
                            wrong: new Set(pasang.filter(([, b]) => b !== "true").map(([t]) => norm(t))) });
    if (peran === "PRE_TEST") SOAL.pre++;
    if (peran === "POST_TEST") SOAL.post++;
  }
  if (murid !== "5" || !/POST_TEST:0\.70/.test(segel) || !SOAL.pre || !SOAL.post) rec.verdict = "FAIL";
  return `«${nama}»: «${KELAS}» has ${murid}/5 students, ${akun} of them with an account already; tests sealed ${segel}; the key read for ${KUNCI.size} questions (pre-test ${SOAL.pre}, post-test ${SOAL.post})`;
});
if (!S || results.at(-1).verdict === "FAIL") { await browser.close(); log("RED: M0"); process.exit(1); }

// ── M1: the class set of cards, made and read in this run
const kartu = [];
await step("M1", `GS-07, second half (J3.7, M7): the school admin signs in with their password and, on Aktivasi, makes «${KELAS}»'s cards in one press as a printable class set; the five are read from the set`, async (rec) => {
  if (S.akun > 0) { rec.verdict = "FAIL"; return `${S.akun} of the five already have an account: their cards were made in an earlier run and cannot be shown again: walk the students on a new Golden School (C1)`; }
  const A = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" })).newPage();
  const di = await masukSurel(A, ADMIN_EMAIL);
  if (di !== "/konfigurasi") { rec.verdict = "FAIL"; return `the admin landed on ${di}`; }
  await klikTautan(A, "/aktivasi");
  const pilih = A.locator("section.pin-akt-kelas select");
  await pilih.waitFor({ timeout: SLOW });
  const opsi = await pilih.locator("option").evaluateAll((os) => os.map((o) => ({ v: o.value, t: o.textContent ?? "" })));
  const k = opsi.find((o) => o.t.includes(KELAS));
  if (!k) { rec.verdict = "FAIL"; return `«${KELAS}» is not offered: ${JSON.stringify(opsi.map((o) => o.t))}`; }
  await pilih.selectOption(k.v);
  await A.getByRole("button", { name: "Buat kartu untuk kelas ini", exact: true }).click();
  await A.locator("section.pin-akt-lembar").waitFor({ timeout: 120000 });
  const set = await A.locator("li.pin-akt-kartu").evaluateAll((ls) => ls.map((l) => ({
    nama: l.querySelector("strong")?.textContent ?? "",
    nilai: [...l.querySelectorAll("dd.pin-num")].map((d) => (d.textContent ?? "").trim()),
  })));
  await shot(A, "m1-kartu-kelas");
  await A.emulateMedia({ media: "print" });
  const dicetak = { kartu: await A.locator("li.pin-akt-kartu").first().isVisible(), judul: await A.locator("h1").first().isVisible() };
  await shot(A, "m1-kartu-kelas-cetak");
  await A.context().close();
  for (const c of set) kartu.push({ nama: norm(c.nama), number: c.nilai[0], pin: c.nilai[1] });
  kartu.sort((x, y) => MURID.indexOf(x.nama) - MURID.indexOf(y.nama));
  const bentuk = kartu.every((c) => /^\d{10}$/.test(c.number ?? "") && /^\d{6}$/.test(c.pin ?? ""));
  const nama = kartu.map((c) => c.nama);
  if (JSON.stringify(nama) !== JSON.stringify(MURID) || !bentuk || !dicetak.kartu || dicetak.judul) rec.verdict = "FAIL";
  return `one press made ${kartu.length} card(s) for ${JSON.stringify(nama)}; every card a 10-digit number and a 6-digit PIN: ${bentuk}; printed: the cards ${dicetak.kartu}, the page title ${dicetak.judul} (numbers and PINs not recorded)`;
});
if (kartu.length !== MURID.length) { await browser.close(); log("RED: M1"); process.exit(1); }

// ── answering, as the staging journey answers (audit/journey.mjs `jawab`)
const teksPilihan = (b) => b.locator("span").nth(1).innerText().then(norm);
async function jawabTanya(page) {
  const tanya = page.locator('[aria-labelledby="kumpulkan-tanya"]');
  const sampai = await Promise.race([
    tanya.waitFor({ state: "visible", timeout: SLOW }).then(() => "tanya", () => null),
    page.waitForURL((u) => u.pathname.endsWith("/hasil"), { timeout: SLOW }).then(() => "hasil", () => null),
  ]);
  if (sampai !== "tanya") return false;
  await tanya.getByRole("button", { name: "Kumpulkan", exact: true }).click();
  return true;
}
async function jawab(page, mode, right) {
  const formal = mode === "post";
  const done = [];
  let ditanya = null;
  for (let i = 0; i < 40; i++) {
    const stemEl = page.locator("h2.pin-stem").first();
    await stemEl.waitFor({ state: "visible", timeout: SLOW });
    const raw = await stemEl.innerText();
    const k = KUNCI.get(norm(raw));
    const opts = page.locator("ul.pin-opsi button.pin-op");
    const texts = [];
    for (let j = 0; j < await opts.count(); j++) texts.push(await teksPilihan(opts.nth(j)));
    const wantRight = done.filter((d) => d.right).length < right;
    let idx = k ? texts.findIndex((t) => (wantRight ? k.right : k.wrong).has(t)) : -1;
    if (idx < 0) idx = 0;
    await opts.nth(idx).click();
    await page.waitForFunction(([n]) => document.querySelectorAll("ul.pin-opsi button.pin-op")[n]?.getAttribute("aria-pressed") === "true", [idx], { timeout: SLOW });
    const next = page.getByRole("button", { name: "Berikutnya", exact: true });
    const terakhir = (await next.count()) === 0;
    if (formal) {
      await page.getByRole("button", { name: /^(Kunci|Simpan) jawaban ini$/ }).click();
      await page.getByRole("button", { name: "Tersimpan", exact: true }).waitFor({ timeout: SLOW });
    } else {
      await page.waitForTimeout(400);
    }
    done.push({ known: Boolean(k), right: Boolean(k) && wantRight && k.right.has(texts[idx]) });
    if (!terakhir) {
      await next.click();
      await page.waitForFunction((prev) => document.querySelector("h2.pin-stem")?.innerText !== prev, raw, { timeout: SLOW });
      continue;
    }
    await page.getByRole("button", { name: formal ? "Kumpulkan" : "Selesaikan pemetaan", exact: true }).click();
    if (formal) ditanya = await jawabTanya(page);
    await page.waitForURL((u) => u.pathname.endsWith(formal ? "/hasil" : "/peta") || u.pathname === "/belajar", { timeout: 60000 });
    break;
  }
  await page.waitForLoadState("networkidle");
  return { answered: done.length, right: done.filter((d) => d.right).length, unknown: done.filter((d) => !d.known).length, ditanya };
}
const target = (n, dari) => Math.round(n * dari);
// what the result page says: "Terjawab tepat X dari Y soal" and whether the school's target was met (M3)
async function bacaHasil(page) {
  await page.locator("h1").first().waitFor({ timeout: SLOW });
  const t = norm(await page.locator("main").innerText().catch(() => ""));
  const m = t.match(/Terjawab tepat (\d+) dari (\d+) soal/);
  return { tepat: m ? Number(m[1]) : null, dari: m ? Number(m[2]) : null, tercapai: t.includes("Target tercapai."), belum: t.includes("Belum mencapai target.") };
}

// the sittings one student has in this chapter, by mode: J6.2 (opening a test's page starts nothing) is read here
const sittings = (nama, mode) => Number(sql(`select count(*) from public.assessment_sessions s join public.persons p on p.id = s.person_id
   where s.learning_assignment_id = '${S.tugas}' and s.mode = '${mode}' and p.display_name = ${lit(nama)}`));

// GS-14's reading, by clicking: from the reading map's own button, every lesson to its last page by «Halaman berikutnya»,
// each reached by the previous one's link, until the last offers the post-test; `p` is on the reading map
async function bacaSemua(p, pelajaran, foto = false) {
  const jejak = [];
  await klikTautan(p, `/belajar/${S.tugas}/pelajaran/${pelajaran[0]}`);
  for (let i = 0; i < pelajaran.length; i++) {
    if (new URL(p.url()).pathname !== `/belajar/${S.tugas}/pelajaran/${pelajaran[i]}`) { jejak.push(`expected lesson ${i + 1}, at ${new URL(p.url()).pathname}`); return { ok: false, jejak }; }
    const maju = p.getByRole("button", { name: "Halaman berikutnya", exact: true });
    await maju.waitFor({ timeout: SLOW });
    let halaman = 1;
    for (let q = 0; q < 60 && await maju.isEnabled(); q++) { await maju.click(); halaman++; await p.waitForTimeout(250); }
    const posisi = norm(await p.locator(".pin-lpos").innerText().catch(() => ""));
    // the save that makes the lesson read refreshes the page once; then its onward link is there
    const lanjut = i + 1 < pelajaran.length ? `/belajar/${S.tugas}/pelajaran/${pelajaran[i + 1]}` : `/belajar/${S.tugas}/penguasaan`;
    const tautan = p.locator(`a[href="${lanjut}"]`).first();
    const ada = await tautan.waitFor({ state: "visible", timeout: SLOW }).then(() => true, () => false);
    jejak.push(`lesson ${i + 1}: ${halaman} page(s), "${posisi}"`);
    if (foto && i === pelajaran.length - 1) await shot(p, "m4-terakhir");
    if (!ada) { jejak.push(`no link onward to ${lanjut}`); return { ok: false, jejak }; }
    await tautan.click();
    await p.waitForURL((u) => u.pathname === lanjut, { timeout: SLOW });
    await p.waitForLoadState("networkidle");
    await closeTour(p);
  }
  return { ok: true, jejak };
}
// J6.11 on a result page: the learner's own growth, Pemetaan Awal → Uji Penguasaan, as the plan makes it; and no rank,
// class average or other learner anywhere on it
async function tumbuh(p, nama, pre, post) {
  const t = norm(await p.locator("main").innerText().catch(() => ""));
  const m = t.match(/(\d+)\s?%\s*→\s*(\d+)\s?%/);
  const awal = Math.round((100 * pre.right) / SOAL.pre), akhir = Math.round((100 * post.right) / SOAL.post);
  const tumbuhOk = Boolean(m) && Math.abs(Number(m[1]) - awal) <= 1 && Math.abs(Number(m[2]) - akhir) <= 1;
  const lain = MURID.filter((n) => n !== nama && t.includes(n));
  const peringkat = /peringkat|ranking|rata-rata|rerata|urutan ke|juara/i.test(t);
  return { ok: tumbuhOk && !lain.length && !peringkat,
    kata: `growth ${m ? `${m[1]}% → ${m[2]}%` : "not shown"} (planned ${awal}% → ${akhir}%); ${lain.length ? `names ${lain.join(", ")}` : "no other learner"}; ${peringkat ? "a rank or average shown" : "no rank or average"}` };
}

// ── M2–M5: the primary student, every step by clicking
const U = await (await ctx()).newPage();
let utamaMasuk = false;
await step("M2", `GS-12 (J2.19): the primary student «${MURID[0]}» signs in with their class card and lands on /belajar, where the chapter is`, async (rec) => {
  const di = await masukKartu(U, kartu[0]);
  const teks = norm(await U.locator("main").innerText().catch(() => ""));
  await shot(U, "m2-belajar");
  utamaMasuk = di === "/belajar" && (await U.locator(`a[href^="/belajar/${S.tugas}"]`).count()) > 0;
  if (!utamaMasuk) rec.verdict = "FAIL";
  return `signed in with the card, landed on ${di}; the chapter named ${/Bilangan Cacah|Matematika Kelas 5/.test(teks)}, linked ${utamaMasuk}`;
});

let pre0 = null;
await step("M3", "GS-13 (J6.2, J6.5–J6.9): /belajar's card → the Pemetaan Awal (orientation; no sitting yet) → «Mulai Pemetaan Awal» → every question answered → «Selesaikan pemetaan» → the reading map", async (rec) => {
  if (!utamaMasuk) { rec.verdict = "FAIL"; return "not signed in (M2)"; }
  // /belajar's card says the step it opens (DAISY-26): for a new learner, the Pemetaan Awal; else via the chapter's page
  if (await U.locator(`a[href="/belajar/${S.tugas}/pemetaan"]`).count()) await klikTautan(U, `/belajar/${S.tugas}/pemetaan`);
  else { await klikTautan(U, `/belajar/${S.tugas}`); await klikTautan(U, `/belajar/${S.tugas}/pemetaan`); }
  const orientasi = norm(await U.locator("main").innerText().catch(() => "")).slice(0, 200);
  await shot(U, "m3-orientasi");
  const sebelum = sittings(MURID[0], "PRE_TEST");
  await U.getByRole("button", { name: "Mulai Pemetaan Awal", exact: true }).click();
  pre0 = await jawab(U, "pre", target(SOAL.pre, RENCANA[0][0]));
  await shot(U, "m3-peta");
  const di = new URL(U.url()).pathname;
  if (sebelum !== 0 || pre0.unknown || pre0.answered !== SOAL.pre || !di.endsWith("/peta")) rec.verdict = "FAIL";
  return `orientation: "${orientasi}"; sittings before «Mulai Pemetaan Awal»: ${sebelum} (J6.2); answered ${pre0.answered}/${SOAL.pre}, ${pre0.right} right as planned, ${pre0.unknown} not in the key; then ${di}`;
});

let bacaSemua_ = false;
const daftarPelajaran = () => sql(`select string_agg(l.id::text, ',' order by m.ordinal, l.ordinal) from public.lessons l join public.modules m on m.id = l.module_id where m.course_id = '${S.kursus}'`).split(",");
await step("M4", "GS-14 (J6.3): every lesson read to its last page by clicking «Halaman berikutnya», each reached by the previous one's link; after the last, the page offers the post-test", async (rec) => {
  if (!pre0) { rec.verdict = "FAIL"; return "no pre-test (M3)"; }
  const pelajaran = daftarPelajaran();
  const baca = await bacaSemua(U, pelajaran, true);
  bacaSemua_ = baca.ok;
  const jejak = baca.jejak;
  if (!baca.ok) rec.verdict = "FAIL";
  const dibaca = sql(`select count(*) filter (where lp.furthest_position >= lp.total_positions) || '/' || count(*)
    from public.lesson_progress lp join public.persons p on p.id = lp.person_id
   where p.display_name = ${lit(MURID[0])} and lp.lesson_id in (${pelajaran.map((x) => `'${x}'`).join(",")})`);
  jejak.push(`read in the database: ${dibaca} of ${pelajaran.length}`);
  if (!bacaSemua_ || dibaca !== `${pelajaran.length}/${pelajaran.length}`) rec.verdict = "FAIL";
  return jejak.join("; ");
});

await step("M5", `GS-15 (J6.2, J6.10, J6.11, J6.15): the post-test by that link; no sitting before «Mulai Uji Penguasaan»; each answer saved; «Kumpulkan» asks first; the result says how many were right, that the school's target (70%) was met, her own growth, and no rank or other learner`, async (rec) => {
  if (!bacaSemua_ || new URL(U.url()).pathname !== `/belajar/${S.tugas}/penguasaan`) { rec.verdict = "FAIL"; return `not on the post-test (M4); at ${new URL(U.url()).pathname}`; }
  await shot(U, "m5-orientasi");
  const sebelum = sittings(MURID[0], "POST_TEST");
  await U.getByRole("button", { name: "Mulai Uji Penguasaan", exact: true }).click();
  const post = await jawab(U, "post", target(SOAL.post, RENCANA[0][1]));
  const h = await bacaHasil(U);
  const g = await tumbuh(U, MURID[0], pre0, post);
  await shot(U, "m5-hasil");
  if (sebelum !== 0 || post.unknown || h.tepat !== post.right || h.dari !== SOAL.post || !h.tercapai || !post.ditanya || !g.ok) rec.verdict = "FAIL";
  return `sittings before «Mulai Uji Penguasaan»: ${sebelum} (J6.2); answered ${post.answered}/${SOAL.post}, ${post.right} right as planned; «Kumpulkan» asked first ${post.ditanya}; ` +
    `the page says "Terjawab tepat ${h.tepat} dari ${h.dari} soal", «Target tercapai.» ${h.tercapai}; J6.11: ${g.kata}`;
});
await U.context().close();

// ── M6: the four others sit both tests
await step("M6", "GS-16: the four other students, each by clicking as the primary student: card → /belajar → the Pemetaan Awal → the reading map → every lesson → the Uji Penguasaan → the result, which says whether the school's target was met", async (rec) => {
  const out = [];
  const pelajaran = daftarPelajaran();
  for (let i = 1; i < MURID.length; i++) {
    const s = await (await ctx()).newPage();
    try {
      const di = await masukKartu(s, kartu[i]);
      // /belajar's card says the step it opens: for a new learner, the Pemetaan Awal
      if (await s.locator(`a[href="/belajar/${S.tugas}/pemetaan"]`).count()) await klikTautan(s, `/belajar/${S.tugas}/pemetaan`);
      else { await klikTautan(s, `/belajar/${S.tugas}`); await klikTautan(s, `/belajar/${S.tugas}/pemetaan`); }
      await s.getByRole("button", { name: "Mulai Pemetaan Awal", exact: true }).click();
      const pre = await jawab(s, "pre", target(SOAL.pre, RENCANA[i][0]));
      const baca = new URL(s.url()).pathname.endsWith("/peta") ? await bacaSemua(s, pelajaran) : { ok: false, jejak: [`after the Pemetaan Awal at ${new URL(s.url()).pathname}`] };
      if (!baca.ok) throw new Error(`reading: ${baca.jejak.at(-1)}`);
      await s.getByRole("button", { name: "Mulai Uji Penguasaan", exact: true }).click();
      const post = await jawab(s, "post", target(SOAL.post, RENCANA[i][1]));
      const h = await bacaHasil(s);
      const lulus = RENCANA[i][1] >= 0.7;
      const ok = !pre.unknown && !post.unknown && h.tepat === post.right && (lulus ? h.tercapai : h.belum);
      if (!ok) rec.verdict = "FAIL";
      out.push(`${MURID[i]} (landed ${di}): pre ${pre.right}/${pre.answered}; read ${pelajaran.length} lesson(s) by clicking; post ${post.right}/${post.answered}; the page: ${lulus ? "«Target tercapai.»" : "«Belum mencapai target.»"} ${lulus ? h.tercapai : h.belum}${ok ? "" : " MISMATCH"}`);
    } catch (e) {
      rec.verdict = "FAIL";
      await shot(s, `m6-murid${i + 1}-berhenti`);
      out.push(`${MURID[i]}: stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 160)}`);
    }
    await s.context().close();
  }
  return out.join("; ");
});

await step("M7", "read back, read only: every sitting FINALIZED; the post-tests OFFICIAL and sealed at the school's mark; each student's mastery and pass/fail as planned", async (rec) => {
  const baris = sql(`select p.display_name || '|' || s.mode::text || '|' || s.status::text || '|' || public.effective_evidence_class(s.id)::text || '|' ||
      coalesce(s.pass_mark::text, '-') || '|' || coalesce(round(r.mastery, 3)::text, '-') || '|' ||
      coalesce((r.safety_gate_passed and r.mastery >= s.pass_mark)::text, '-')
    from public.assessment_sessions s join public.persons p on p.id = s.person_id
    left join public.assessment_results r on r.session_id = s.id and r.supersedes_result_id is null
   where s.learning_assignment_id = '${S.tugas}' order by p.display_name, s.mode`).split("\n").filter(Boolean).map((l) => l.split("|"));
  const out = [];
  for (let i = 0; i < MURID.length; i++) {
    const milik = baris.filter((b) => b[0] === MURID[i]);
    const pre = milik.find((b) => b[1] === "PRE_TEST");
    const post = milik.find((b) => b[1] === "POST_TEST");
    const lulus = RENCANA[i][1] >= 0.7;
    const ok = pre?.[2] === "FINALIZED" && post?.[2] === "FINALIZED" && post?.[3] === "OFFICIAL" && post?.[4] === "0.70" && post?.[6] === String(lulus);
    if (!ok) rec.verdict = "FAIL";
    out.push(`${MURID[i]}: pre ${pre?.[2] ?? "-"} mastery ${pre?.[5] ?? "-"}; post ${post?.[2] ?? "-"} ${post?.[3] ?? "-"} sealed ${post?.[4] ?? "-"} mastery ${post?.[5] ?? "-"} passed ${post?.[6] ?? "-"}${ok ? "" : " MISMATCH"}`);
  }
  return out.join("; ");
});

await browser.close();
const red = results.filter((r) => r.verdict === "FAIL");
log(`TALLY ${JSON.stringify(results.reduce((t, r) => ({ ...t, [r.verdict]: (t[r.verdict] ?? 0) + 1 }), {}))}`);
if (red.length) { log(`RED: ${red.map((r) => r.id).join(", ")}`); process.exit(1); }
