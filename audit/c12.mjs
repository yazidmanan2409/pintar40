// C-12 · VENUE 1: THE MACHINE PROOF (design/EDUCATOR-AS-LEARNER-TICKETS.md §3 C-12 and §7; D-069(a)-(m), D-070).
//
// In «SD Zayd», a real school on a stack in production posture, after S23i: the Kelas 1A teacher, Pak Guru Budi (an
// EDUCATOR-only Guru), learns as a participant in a professional-learning place, through the product only, and the
// walk proves the rulings around it:
//   C12a  baseline snapshot: every catalogue reading the Guru, the Kepala departemen and the Dekan take at Kelas 1A, its
//         Bagian and the school; the protected sources; rosters and «Murid» lists; the Guru's identity; the screens
//   C12b  the school admin builds «Pengembangan Guru» (for educators) → Tingkat → two Kelas, records the facilitator,
//         a responsible Kepala departemen and another Guru and gives their roles, and enrols the Guru (C1)
//   C12c  two original filler packages [UJI INTERNAL] (Konteks «Pengembangan profesi») uploaded by Gladys, reviewed by
//         the PD Kepala departemen, published; the school's pass mark set; the facilitator assigns Bab 1, then Bab 2
//   C12d  the Guru's journey from «Pembelajaran Saya»: both Bab, Pemetaan Awal → lessons → Uji Penguasaan → Hasil; one
//         integrity observation through the player (the network drops and returns in Bab 1's test); two certificates,
//         each verified by its token
//   C12e  P4 evidence · C12f P5 visibility · C12g P6 integrity · C12h P7 tenancy · C12i P8 boundary · C12j P9 marking
//   C12k  the after snapshot against the baseline: P1 identity, P2 the hard gate (byte-identical), P3 rosters
// A step never passes by a direct write: every write is a press of PINTAR's buttons or a call the person's own session
// makes; the database is read for evidence, and the boundary's refusals are asked in transactions that are rolled back.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ambilPotret, beda } from "./c12-potret.mjs";

export const PD = { bagian: "Pengembangan Guru", tingkat: "Angkatan Guru 2026", kelasA: "Kelas Pengembangan A", kelasB: "Kelas Pengembangan B" };
export const ORANG_PD = {
  fasilitator: { name: "Bu Fasilitator Wulan", email: "fasilitator.wulan@audit.pintar.test" },
  kepalaPd: { name: "Pak Kepala PD Joko", email: "kepala.pd@audit.pintar.test" },
  guruLain: { name: "Pak Guru Eko", email: "guru.eko@audit.pintar.test" },
  guruSma: { name: "Bu Guru Rini SMA", email: "guru.rini@audit.pintar.test" },
};
const PAKET = ["pd-uji-bab1.paket.json", "pd-uji-bab2.paket.json"].map((f) => JSON.parse(readFileSync(new URL(`./fixtures/${f}`, import.meta.url), "utf8")));
const JUDUL = PAKET.map((p) => p.courses[0].title);
// how many the Guru gets right: Bab 1 pre 2/4, post 4/4; Bab 2 pre 1/4, post 3/4 (both above the school's 60%)
const RENCANA_PD = [{ pre: 2, post: 4 }, { pre: 1, post: 3 }];

export async function jalankanC12(d) {
  const { step, sql, ctx, magicSignIn, apiSession, grantViaForm, catatLewatLayar, kirimPaket, terbitkanLewatLayar, keadaanBab, jawab, tutupTur,
    masukKartu, shot, bodyText, norm, people, ids, a, g, kartuKelas, KUNCI, kelasSatuA, babSatu, SLOW, APP, DB, GLADYS, newPerson, OUT } = d;
  const C = {};
  const q = (s) => sql(s).trim();
  const orangDari = (email) => q(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = '${email}'`);
  // under an ancestor, by its path: a Tingkat's parent is its Bagian's hidden Reguler (D-027), not the Bagian
  const simpul = (kind, nama, induk = null) => q(`select id from public.org_nodes where institution_id='${ids.sd}' and kind='${kind}' and name='${nama}'
    ${induk ? `and jalur @> array['${induk}']::uuid[]` : ""} and is_active limit 1`);
  const tunggu = async (page, f, n = 30) => { for (let i = 0; i < n; i++) { const v = f(); if (v) return v; await page.waitForTimeout(500); } return f(); };
  // a refused call: its code and detail as the person's own session received them
  const tolakan = (r) => (r.error ? `${r.error.code}:${r.error.details ?? r.error.message}` : `OK:${JSON.stringify(r.data)?.slice(0, 80)}`);
  // several statements as one person in one transaction that is rolled back; the last select's rows
  const sebagaiLaluBatal = (email, badan) => execFileSync("psql", [DB, "-At", "-v", "ON_ERROR_STOP=1", "-c", `begin;
create temp table c12_hasil (v text); grant all on c12_hasil to authenticated;
do $x$ declare v uuid; begin
  select id into v from auth.users where email = '${email}';
  perform set_config('request.jwt.claims', json_build_object('sub', v, 'role', 'authenticated', 'email', '${email}')::text, true);
  perform set_config('request.jwt.claim.sub', v::text, true);
end $x$;
set local role authenticated;
${badan}
reset role;
select v from c12_hasil;
rollback;`], { encoding: "utf8" }).trim().split("\n").filter((l) => l && !/^(BEGIN|CREATE|GRANT|DO|SET|RESET|ROLLBACK|INSERT)/.test(l)).join("\n");

  const kelasRendah = () => simpul("DEPARTMENT", "Kelas Rendah");
  const param = () => ({ sd: ids.sd, kelas: kelasSatuA(), bagian: kelasRendah(), pembaca: [people.guru.email, people.kaprodi.email, people.dekan.email], guru: people.guru.email });

  // the screens the hard gate also reads: the Guru's «Lihat bukti» for Kelas 1A, and the «Murid» lists at the Bagian
  // (its Kepala departemen) and at the school (the Dekan)
  async function bacaLayar(tag) {
    const out = {};
    for (const [kunci, orang, jalur] of [["bukti", people.guru, `/mengajar/${kelasSatuA()}/bukti`],
      ["murid_bagian", people.kaprodi, `/pimpinan/${kelasRendah()}/murid`], ["murid_sekolah", people.dekan, `/pimpinan/${ids.sd}/murid`]]) {
      const c = await ctx();
      const p = await c.newPage();
      try {
        await magicSignIn(p, orang.email);
        await p.goto(`${APP}${jalur}`, { waitUntil: "networkidle" });
        await tutupTur(p);
        if (kunci === "bukti") {
          await p.locator(".pin-metric").first().waitFor({ timeout: SLOW }).catch(() => {});
          out[kunci] = (await p.locator(".pin-metric").allInnerTexts()).map(norm);
        } else {
          out[kunci] = norm(await p.locator("main").innerText().catch(() => ""));
        }
        await shot(p, `c12-${tag}-${kunci}`);
      } finally {
        await c.close();
      }
    }
    return out;
  }

  // ───────────────────────────── C12a
  await step("C12a", "C-12 baseline: every catalogue reading the Guru, the Kepala departemen and the Dekan take at Kelas 1A, its Bagian and the school; the protected sources; rosters and «Murid» lists; the Guru's identity; the screens", async (rec) => {
    C.awal = ambilPotret(DB, param());
    writeFileSync(join(OUT, "c12-sebelum.json"), JSON.stringify(C.awal, null, 1));
    C.layarAwal = await bacaLayar("sebelum");
    const angka = C.layarAwal.bukti.join(" | ");
    // «Peserta» (terminology v1: those taking part in a measurement) is what each figure says it is «Dari»
    const kartu = (label) => C.layarAwal.bukti.find((x) => x.startsWith(label)) ?? "";
    const paham = kartu("Pemahaman"), naik = kartu("Kenaikan");
    const harap = /Pemahaman 75\s?%/.test(paham) && /Dari 5 murid/.test(paham) && /Kenaikan \+35 poin/.test(naik) && /Dari 5 murid/.test(naik);
    if (!harap || C.awal.jumlah_metrik !== 16 || !C.awal.metrik_ok) rec.verdict = "FAIL";
    return `catalogue ${C.awal.katalog}, ${C.awal.jumlah_metrik} metrics, ${Object.keys(C.awal.metrik).length} readings (${C.awal.metrik_ok} ok), md5 ${C.awal.metrik_md5}; ` +
      `sources ${JSON.stringify(C.awal.sumber)}; rosters ${JSON.stringify(C.awal.daftar)}; the Guru ${JSON.stringify(C.awal.orang)}; ` +
      `«Lihat bukti» Kelas 1A: ${angka.slice(0, 300)} (Pemahaman 75% from 5, Kenaikan +35 poin from 5: ${harap})`;
  });
  if (!C.awal) return;

  // ───────────────────────────── C12b
  async function stafBaru(orang, peran, lingkup, shots) {
    const jejak = [await catatLewatLayar(a, [orang.name], shots, { kelas: null, peran: null })];
    await a.goto(`${APP}/aktivasi?muat=${Date.now()}`, { waitUntil: "networkidle" });
    const baris = a.locator("li.pin-akt-orang", { hasText: orang.name }).first();
    if (!(await baris.count())) throw new Error(`${orang.name} is not on Aktivasi`);
    await baris.locator('input[type="email"]').fill(orang.email);
    await baris.getByRole("button", { name: "Aktifkan dengan email", exact: true }).click();
    await baris.locator('input[type="email"]').waitFor({ state: "detached", timeout: SLOW }).catch(() => {});
    const r = await grantViaForm(a, orang.name, peran, lingkup);
    jejak.push(`${peran} at «${lingkup}»: ${r.ok}`);
    if (r.ok !== "ok") throw new Error(jejak.join("; "));
    return jejak.join("; ");
  }
  await step("C12b", "C-12 the place: the school admin makes «Pengembangan Guru» for educators → a Tingkat → two Kelas on Struktur sekolah, records and appoints the facilitator, the responsible Kepala departemen and another Guru, and enrols the Guru as «Peserta» on Konfigurasi (C1)", async (rec) => {
    const notes = [];
    await a.goto(`${APP}/konfigurasi?muat=${Date.now()}#struktur`, { waitUntil: "networkidle" });
    await tutupTur(a);
    const fb = a.locator("div.pin-str-tambah-bagian form").first();
    await fb.locator('input[name="nama"]').fill(PD.bagian);
    await fb.locator('input[name="untuk"][value="guru"]').check();
    await fb.locator('button[type="submit"]').click();
    C.bagian = await tunggu(a, () => simpul("DEPARTMENT", PD.bagian));
    if (!C.bagian) { rec.verdict = "FAIL"; return `«${PD.bagian}» was not made: ${norm(await a.locator("#struktur").innerText().catch(() => "")).slice(0, 300)}`; }
    await a.goto(`${APP}/konfigurasi?muat=${Date.now()}#struktur`, { waitUntil: "networkidle" });
    const ft = a.locator("div.pin-str-tambah-tingkat form").filter({ has: a.locator(`input[name="bagian"][value="${C.bagian}"]`) }).first();
    await ft.locator('input[name="nama"]').fill(PD.tingkat);
    await ft.locator('button[type="submit"]').click();
    C.tingkat = await tunggu(a, () => simpul("COHORT", PD.tingkat, C.bagian));
    if (!C.tingkat) { rec.verdict = "FAIL"; return `the Tingkat «${PD.tingkat}» was not made under «${PD.bagian}»`; }
    for (const [k, nama] of [["kelasA", PD.kelasA], ["kelasB", PD.kelasB]]) {
      await a.goto(`${APP}/konfigurasi?muat=${Date.now()}#struktur`, { waitUntil: "networkidle" });
      const fk = a.locator("div.pin-str-tambah-kelas form").filter({ has: a.locator(`input[name="tingkat"][value="${C.tingkat}"]`) }).first();
      await fk.locator('input[name="nama"]').fill(nama);
      await fk.locator('button[type="submit"]').click();
      C[k] = await tunggu(a, () => simpul("CLASS", nama, C.tingkat));
    }
    if (!C.kelasA || !C.kelasB) { rec.verdict = "FAIL"; return "a professional-learning Kelas was not made"; }
    await a.goto(`${APP}/konfigurasi?muat=${Date.now()}#struktur`, { waitUntil: "networkidle" });
    rec.shots.push(await shot(a, "c12-struktur"));
    const tanda = (await a.locator("#struktur").innerText().catch(() => "")).split("Pengembangan profesi guru").length - 1;
    const konteks = q(`select string_agg(name || ':' || learning_context::text, ', ' order by kind, name) from public.org_nodes where id in ('${C.bagian}','${C.tingkat}','${C.kelasA}','${C.kelasB}')`);
    notes.push(`made on Struktur sekolah: ${konteks}; marked «Pengembangan profesi guru» ${tanda} time(s)`);
    if ((konteks.match(/PROFESSIONAL_DEVELOPMENT/g) ?? []).length !== 4 || tanda < 4) rec.verdict = "FAIL";

    // the people: recorded by the school's own tools, then appointed by the school admin
    notes.push(`facilitator: ${await stafBaru(ORANG_PD.fasilitator, "EDUCATOR", PD.kelasA, rec.shots)}`);
    notes.push(`responsible Kepala departemen: ${await stafBaru(ORANG_PD.kepalaPd, "HEAD_OF_DEPARTMENT", PD.bagian, rec.shots)}`);
    notes.push(`another Guru (facilitator of the other PD Kelas): ${await stafBaru(ORANG_PD.guruLain, "EDUCATOR", PD.kelasB, rec.shots)}`);
    // a Guru of the second school, by the platform administrator (that school has no admin of its own)
    const np = await newPerson(g, ORANG_PD.guruSma.name, ORANG_PD.guruSma.email);
    const rs = np.ok ? await grantViaForm(g, ORANG_PD.guruSma.name, "EDUCATOR", "SMA Zayd") : { ok: "no person" };
    notes.push(`a Guru of SMA Zayd: ${rs.ok}`);
    if (rs.ok !== "ok") rec.verdict = "FAIL";
    // the two who only read later activate now, as staff do (Gate 3), so what they are refused is refused to them
    for (const o of [ORANG_PD.guruLain, ORANG_PD.guruSma]) {
      const c = await ctx(); const p = await c.newPage();
      try { notes.push(`${o.name} activates and lands on ${(await magicSignIn(p, o.email)).landed}`); } finally { await c.close(); }
    }

    // C1: the Guru enrolled as a participant, on Konfigurasi «Peserta pengembangan profesi»
    C.guru = orangDari(people.guru.email);
    C.sebelumC1 = q(`select (select count(*) from public.persons) || '|' || (select count(*) from public.accounts) || '|' || (select count(*) from public.institutional_identities)`);
    await a.goto(`${APP}/konfigurasi?muat=${Date.now()}#peserta`, { waitUntil: "networkidle" });
    const fp = a.locator("form").filter({ has: a.locator('select[name="tempat"]') }).first();
    if (!(await fp.count())) { rec.verdict = "FAIL"; return `${notes.join("; ")}; no «Peserta pengembangan profesi» form: ${norm(await a.locator("#peserta").innerText().catch(() => "")).slice(0, 200)}`; }
    const vo = await fp.locator('select[name="orang"] option').filter({ hasText: people.guru.name }).first().getAttribute("value").catch(() => null);
    const vt = await fp.locator('select[name="tempat"] option').filter({ hasText: PD.kelasA }).first().getAttribute("value").catch(() => null);
    const ditawarkan = (await fp.locator('select[name="tempat"] option').allTextContents()).map(norm);
    if (!vo || !vt) { rec.verdict = "FAIL"; return `${notes.join("; ")}; the form offers person ${Boolean(vo)}, place ${Boolean(vt)} (${ditawarkan.join(" / ")})`; }
    await fp.locator('select[name="orang"]').selectOption(vo);
    await fp.locator('select[name="tempat"]').selectOption(vt);
    await fp.getByRole("button", { name: "Daftarkan sebagai peserta", exact: true }).click();
    await a.waitForURL(/hasil=/, { timeout: SLOW }).catch(() => {});
    await a.waitForLoadState("networkidle");
    rec.shots.push(await shot(a, "c12-peserta"));
    const u = new URL(a.url());
    const banner = norm(await a.locator("#peserta .pin-hasil-ok, #peserta [role=status]").first().innerText().catch(() => ""));
    const anggota = q(`select count(*) from public.memberships m join public.enrollments e on e.id = m.enrollment_id
      where m.node_id = '${C.kelasA}' and m.valid_to is null and e.person_id = '${C.guru}'`);
    const sesudahC1 = q(`select (select count(*) from public.persons) || '|' || (select count(*) from public.accounts) || '|' || (select count(*) from public.institutional_identities)`);
    notes.push(`«Daftarkan sebagai peserta» → ${u.searchParams.get("hasil")} ${u.searchParams.get("kode")}, «${banner.slice(0, 80)}»; the places offered ${JSON.stringify(ditawarkan)}; ` +
      `the Guru's membership in «${PD.kelasA}» ${anggota}; persons|accounts|numbers ${C.sebelumC1} → ${sesudahC1} (the enrolment made no person, account or number)`);
    if (u.searchParams.get("kode") !== "PD_ENROLLED" || anggota !== "1" || C.sebelumC1 !== sesudahC1 || ditawarkan.some((t) => /Kelas 1A/.test(t))) rec.verdict = "FAIL";
    return notes.join("; ");
  });
  if (!C.kelasA || !C.guru) return;

  // ───────────────────────────── C12c
  C.halaman = {};
  async function masuk(kunci, email) {
    if (C.halaman[kunci]) return C.halaman[kunci];
    const c = await ctx();
    const p = await c.newPage();
    const m = await magicSignIn(p, email);
    C.halaman[kunci] = p;
    C[`mendarat_${kunci}`] = m.landed;
    return p;
  }
  await step("C12c", "C-12 the content: Gladys uploads the two original filler packages [UJI INTERNAL] (Konteks «Pengembangan profesi»); the PD Kepala departemen reviews, makes and locks each release, Gladys publishes; the school admin sets each pass mark; the facilitator assigns Bab 1, then Bab 2", async (rec) => {
    const notes = [];
    C.kursus = [];
    const kepala = await masuk("kepalaPd", ORANG_PD.kepalaPd.email);
    for (let i = 0; i < 2; i++) {
      const r = await kirimPaket("SD Zayd", JSON.stringify(PAKET[i]));
      if (!r.batch) { rec.verdict = "FAIL"; notes.push(`Bab ${i + 1}: no batch (hasil=${r.hasil} detail=${r.detail})`); return notes.join("; "); }
      await g.goto(`${APP}/studio/unggah`, { waitUntil: "networkidle" });
      const btn = g.locator(`form:has(input[name="batch"][value="${r.batch}"]) button[type="submit"]`).first();
      if (!(await btn.count())) { rec.verdict = "FAIL"; notes.push(`Bab ${i + 1}: no Konfirmasi offered`); return notes.join("; "); }
      await btn.click();
      await g.waitForLoadState("networkidle");
      const course = await tunggu(g, () => q(`select id from public.courses where institution_id='${ids.sd}' and title='${JUDUL[i].replace(/'/g, "''")}' limit 1`));
      if (!course) { rec.verdict = "FAIL"; notes.push(`Bab ${i + 1}: no course after Konfirmasi`); return notes.join("; "); }
      C.kursus.push(course);
      notes.push(`Bab ${i + 1}: ${q(`select learning_context || ' ' || status from public.courses where id='${course}'`)}`);
      const jadi = await terbitkanLewatLayar(course, rec, notes, { bacaSoal: true, nama: `PD Bab ${i + 1}`, awalan: `c12-b${i + 1}-`, peninjau: kepala });
      if (!jadi) return notes.join("; ");
      notes.push(`Bab ${i + 1} → ${keadaanBab(course)}`);
      if (!keadaanBab(course).endsWith("|PUBLISHED")) { rec.verdict = "FAIL"; return notes.join("; "); }
    }
    // the school's pass mark, by the school admin on Konfigurasi
    for (let i = 0; i < 2; i++) {
      await a.goto(`${APP}/konfigurasi?sekolah=${ids.sd}&muat=${Date.now()}#ketuntasan`, { waitUntil: "networkidle" });
      await tutupTur(a);
      const baris = a.locator(`#ketuntasan li[data-pelajaran="${C.kursus[i]}"]`);
      if (!(await baris.count())) { rec.verdict = "FAIL"; notes.push(`Bab ${i + 1} is not listed under Batas ketuntasan`); return notes.join("; "); }
      await baris.locator('input[name="persen"]').fill("60");
      await baris.locator('input[name="alasan"]').fill("Ketentuan uji pengembangan profesi");
      await baris.getByRole("button", { name: "Tetapkan", exact: true }).click();
      await a.waitForURL((u) => u.searchParams.get("bagian") === "ketuntasan", { timeout: SLOW }).catch(() => {});
      await a.waitForLoadState("networkidle");
    }
    notes.push(`pass marks: ${q(`select string_agg(m.percent::text, ',' order by m.set_at) from public.school_pass_marks m where m.course_id in ('${C.kursus.join("','")}')`)}`);
    // the facilitator assigns them, in order, on Siapkan
    const f = await masuk("fasilitator", ORANG_PD.fasilitator.email);
    C.tugas = [];
    for (let i = 0; i < 2; i++) {
      await f.goto(`${APP}/mengajar/${C.kelasA}/siapkan`, { waitUntil: "networkidle" });
      await tutupTur(f);
      const daftar = norm(await f.locator("main").innerText().catch(() => ""));
      if (i === 0) {
        C.siapkanPd = daftar;
        notes.push(`the PD Kelas's Siapkan offers the academic Bab 1: ${/Matematika Kelas 5/.test(daftar)}`);
        if (/Matematika Kelas 5/.test(daftar)) rec.verdict = "FAIL";
      }
      const row = f.locator("a.pin-row").filter({ hasText: i === 0 ? "Bab 1: Merencanakan" : "Bab 2: Umpan Balik" }).first();
      if (!(await row.count())) { rec.verdict = "FAIL"; notes.push(`Siapkan does not offer PD Bab ${i + 1}: ${daftar.slice(0, 240)}`); return notes.join("; "); }
      await row.click();
      await f.waitForLoadState("networkidle");
      const batas = norm(await f.locator(".pin-batas").first().innerText().catch(() => ""));
      const sampai = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + 30 * 86400000));
      await f.locator("#pin-sampai").fill(sampai).catch(() => {});
      await f.locator('form:has(input[name="terbitan"]) button[type="submit"]').first().click();
      await f.waitForLoadState("networkidle");
      const la = await tunggu(f, () => q(`select id from public.learning_assignments where course_id='${C.kursus[i]}' and node_id='${C.kelasA}' order by created_at desc limit 1`));
      C.tugas.push(la);
      const segel = q(`select coalesce(string_agg(dd.mode::text || ':' || coalesce(aa.pass_mark::text, '-') || ':' || coalesce(aa.pass_mark_source, '-'), ',' order by dd.mode::text), '-')
        from public.assessment_assignments aa join public.assessment_definitions dd on dd.id = aa.assessment_definition_id where aa.learning_assignment_id='${la || "00000000-0000-0000-0000-000000000000"}'`);
      notes.push(`Bab ${i + 1}: Siapkan read «${batas}»; assigned ${Boolean(la)}; sealed ${segel}`);
      if (!la || !/POST_TEST:0\.60:SCHOOL/.test(segel)) rec.verdict = "FAIL";
    }
    rec.shots.push(await shot(f, "c12-siapkan-pd"));
    return notes.join("; ");
  });
  if (C.tugas?.length !== 2 || C.tugas.some((t) => !t)) return;

  // ───────────────────────────── C12d
  for (const p of PAKET) for (const m of p.courses[0].modules) for (const l of m.lessons) for (const it of l.items ?? []) {
    KUNCI.set(norm(it.stem), { right: new Set(it.options.filter((o) => o.is_correct).map((o) => norm(o.body))),
                               wrong: new Set(it.options.filter((o) => !o.is_correct).map((o) => norm(o.body))) });
  }
  await step("C12d", "C-12 the Guru's journey: from /mengajar, «Pembelajaran Saya»; both Bab: Pemetaan Awal → every lesson → Uji Penguasaan (the network drops and returns once in Bab 1's) → Hasil; two certificates, each verified by its token", async (rec) => {
    const notes = [];
    const b = await masuk("guru", people.guru.email);
    notes.push(`signed in, landed ${C.mendarat_guru}`);
    await b.goto(`${APP}/mengajar`, { waitUntil: "networkidle" });
    await tutupTur(b);
    await b.getByRole("link", { name: "Pembelajaran Saya" }).first().click();
    await b.waitForURL((u) => u.pathname === "/belajar", { timeout: SLOW });
    // a client-side navigation: the load state was reached by /mengajar already, so wait for the home's own list
    await b.locator('section[data-tur="daftar"]').first().waitFor({ timeout: SLOW }).catch(() => {});
    await b.getByText(JUDUL[0], { exact: true }).first().waitFor({ timeout: SLOW }).catch(() => {});
    const rumah = norm(await bodyText(b));
    rec.shots.push(await shot(b, "c12-pembelajaran-saya"));
    const keduanya = JUDUL.every((t) => rumah.includes(t));
    notes.push(`«Pembelajaran Saya» lists both Bab with their [UJI INTERNAL] titles: ${keduanya}${keduanya ? "" : ` (the page: ${rumah.slice(0, 400)})`}`);
    if (!keduanya) rec.verdict = "FAIL";
    for (let i = 0; i < 2; i++) {
      const tugas = C.tugas[i];
      const plan = RENCANA_PD[i];
      try {
        await b.goto(`${APP}/belajar/${tugas}/pemetaan`, { waitUntil: "networkidle" });
        await tutupTur(b);
        await b.getByRole("button", { name: "Mulai Pemetaan Awal", exact: true }).click();
        const pre = await jawab(b, "pre", plan.pre);
        // every lesson, read to its last page, in the reading map's order
        let dibaca = 0;
        for (let n = 0; n < 6; n++) {
          await b.goto(`${APP}/belajar/${tugas}/peta`, { waitUntil: "networkidle" });
          const buka = b.getByRole("link", { name: "Buka pelajarannya" }).first();
          if (!(await buka.count())) break;
          await buka.click();
          await b.waitForURL((u) => u.pathname.includes("/pelajaran/"), { timeout: SLOW });
          await b.locator("p.pin-lpos").first().waitFor({ timeout: SLOW });
          for (let h = 0; h < 20; h++) {
            const lanjut = b.getByRole("button", { name: "Halaman berikutnya", exact: true });
            if (!(await lanjut.isEnabled().catch(() => false))) break;
            const kini = norm(await b.locator("p.pin-lpos").first().innerText());
            await lanjut.click();
            await b.waitForFunction((prev) => document.querySelector("p.pin-lpos")?.innerText.replace(/\s+/g, " ").trim() !== prev, kini, { timeout: SLOW });
          }
          await b.waitForTimeout(1500);
          dibaca++;
        }
        await b.goto(`${APP}/belajar/${tugas}/penguasaan`, { waitUntil: "networkidle" });
        await tutupTur(b);
        await b.getByRole("button", { name: "Mulai Uji Penguasaan", exact: true }).click();
        const post = await jawab(b, "post", plan.post, { luringDi: i === 0 ? 1 : -1 });
        await b.locator("h1").first().waitFor({ timeout: SLOW });
        const hasil = norm(await bodyText(b));
        const m = hasil.match(/Terjawab tepat (\d+) dari (\d+) soal/);
        rec.shots.push(await shot(b, `c12-hasil-bab${i + 1}`));
        const ok = Number(m?.[1]) === plan.post && Number(m?.[2]) === 4 && /Target tercapai\./.test(hasil) && !pre.unknown && !post.unknown && dibaca === 2;
        if (!ok) rec.verdict = "FAIL";
        notes.push(`Bab ${i + 1}: pre ${pre.right}/${pre.answered}, lessons read ${dibaca}, post ${post.right}/${post.answered}; the page says «${m?.[0] ?? "no count"}», target met ${/Target tercapai\./.test(hasil)}` +
          (i === 0 ? `; offline at question 2: ${JSON.stringify(post.luring)}` : ""));
      } catch (e) {
        rec.verdict = "FAIL";
        rec.shots.push(await shot(b, `c12-bab${i + 1}-berhenti`));
        notes.push(`Bab ${i + 1}: stopped: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`);
      }
    }
    // the certificates: listed, opened, and each verified by its token by an anonymous visitor
    C.sertifikat = [];
    // the player asks for the certificate as the test is handed in and never waits for it (doc 04 §7): the list shows
    // what has been issued, so the walk waits until both are, and says how long that took
    const t0 = Date.now();
    const terbit = () => Number(q(`select count(*) from public.certificates c join public.assessment_sessions s on s.id = c.session_id
      join public.assessment_assignments aa on aa.id = s.assessment_assignment_id where aa.learning_assignment_id in ('${C.tugas.join("','")}')
      and s.person_id = '${C.guru}' and c.status = 'ISSUED'`));
    for (let k = 0; k < 60 && terbit() < 2; k++) await b.waitForTimeout(500);
    notes.push(`certificates issued ${terbit()} (waited ${Math.round((Date.now() - t0) / 1000)} s after the last hand-in)`);
    await b.goto(`${APP}/belajar/sertifikat`, { waitUntil: "networkidle" });
    for (let i = 0; i < 2; i++) {
      const tautan = b.locator(`a[href="/belajar/${C.tugas[i]}/sertifikat"]`).first();
      if (!(await tautan.count())) { rec.verdict = "FAIL"; notes.push(`Bab ${i + 1}'s certificate is not listed`); continue; }
      await b.goto(`${APP}/belajar/${C.tugas[i]}/sertifikat`, { waitUntil: "networkidle" });
      await b.getByText(/Cetak atau simpan PDF/).first().waitFor({ timeout: SLOW }).catch(() => {});
      const url = norm(await b.locator("code.pin-chip").first().innerText().catch(() => ""));
      const token = url.split("/verifikasi/")[1] ?? "";
      rec.shots.push(await shot(b, `c12-sertifikat-bab${i + 1}`));
      const anon = await ctx();
      const v = await anon.newPage();
      const res = await v.goto(`${APP}/verifikasi/${token}`, { waitUntil: "networkidle" });
      const teks = norm(await v.locator("main").textContent().catch(() => ""));
      const api = await anon.request.get(`${APP}/api/verifikasi/${token}`);
      await anon.close();
      const berlaku = res?.status() === 200 && /Berlaku/.test(teks) && /Sertifikat ini benar diterbitkan dan masih berlaku\./.test(teks) && api.status() === 200 && !teks.includes(people.guru.name);
      C.sertifikat.push({ token, berlaku });
      notes.push(`Bab ${i + 1}'s certificate: its page shows the verification link ${Boolean(token)}; verified by its token anonymously: page «Berlaku» ${berlaku}, API ${api.status()}, the holder's name hidden ${!teks.includes(people.guru.name)}`);
      if (!token || !berlaku) rec.verdict = "FAIL";
    }
    return notes.join("; ");
  });

  // the Guru's PD sessions, results, releases and certificates, read for evidence
  const daftarId = (s) => q(s).split("\n").filter(Boolean);
  C.sesi = daftarId(`select s.id from public.assessment_sessions s join public.learning_assignments la on la.id = s.learning_assignment_id
    where la.id in ('${(C.tugas ?? []).join("','")}') and s.person_id = '${C.guru}' order by s.created_at`);
  C.rilis = daftarId(`select distinct la.plp_release_id from public.learning_assignments la where la.id in ('${(C.tugas ?? []).join("','")}')`);

  // ───────────────────────────── C12e (P4)
  await step("C12e", "C-12 P4 evidence: four FINALIZED sessions and their results, readable by the Guru; two sealed certificates, both verified; nothing rewritten; a place's and a sealed course's context cannot be changed", async (rec) => {
    const notes = [];
    const sesi = q(`select coalesce(string_agg(s.mode::text || ':' || s.status::text || ':' || public.effective_evidence_class(s.id)::text, ',' order by s.mode::text, s.created_at), '')
      from public.assessment_sessions s where s.id in ('${C.sesi.join("','")}')`);
    const hasil = q(`select count(*) || '|' || count(*) filter (where r.supersedes_result_id is not null) from public.assessment_results r where r.session_id in ('${C.sesi.join("','")}')`);
    const sert = q(`select count(*) || '|' || count(*) filter (where c.status = 'ISSUED' and c.signature is not null and c.revoked_at is null and c.supersedes_certificate_id is null)
      || '|' || coalesce(string_agg(distinct c.person_id::text, ','), '') from public.certificates c join public.assessment_sessions s on s.id = c.session_id where s.id in ('${C.sesi.join("','")}')`);
    const [nSert, nSegel, pemilik] = sert.split("|");
    const api = await apiSession(people.guru.email);
    const bacaSesi = (await api.from("assessment_sessions").select("id", { count: "exact", head: true }).in("id", C.sesi)).count;
    const bacaHasil = (await api.from("assessment_results").select("session_id", { count: "exact", head: true }).in("session_id", C.sesi)).count;
    notes.push(`sessions ${sesi}; results ${hasil.split("|")[0]}, superseded ${hasil.split("|")[1]}; the Guru reads ${bacaSesi} sessions and ${bacaHasil} results; ` +
      `certificates ${nSert}, sealed and standing ${nSegel}, held by the Guru ${pemilik === C.guru}; verified ${(C.sertifikat ?? []).filter((x) => x.berlaku).length}/2`);
    const ok = (sesi.match(/:FINALIZED:OFFICIAL/g) ?? []).length === 4 && /PRE_TEST/.test(sesi) && /POST_TEST/.test(sesi) && hasil === "4|0"
      && bacaSesi === 4 && bacaHasil === 4 && nSert === "2" && nSegel === "2" && pemilik === C.guru && (C.sertifikat ?? []).filter((x) => x.berlaku).length === 2;
    if (!ok) rec.verdict = "FAIL";
    // the context cannot be changed: asked of the database itself, in a transaction that is rolled back
    const ubah = execFileSync("psql", [DB, "-At", "-c", `begin;
create temp table c12_ubah (v text);
do $x$ begin
  begin update public.org_nodes set learning_context = 'ACADEMIC' where id = '${C.kelasA}'; insert into c12_ubah values ('kelas:CHANGED');
  exception when others then insert into c12_ubah values ('kelas:REFUSED ' || left(sqlerrm, 90)); end;
  begin update public.org_nodes set learning_context = 'ACADEMIC' where id = '${C.bagian}'; insert into c12_ubah values ('bagian:CHANGED');
  exception when others then insert into c12_ubah values ('bagian:REFUSED ' || left(sqlerrm, 90)); end;
  begin update public.courses set learning_context = 'ACADEMIC' where id = '${C.kursus[0]}'; insert into c12_ubah values ('kursus:CHANGED');
  exception when others then insert into c12_ubah values ('kursus:REFUSED ' || left(sqlerrm, 90)); end;
end $x$;
select string_agg(v, ' | ') from c12_ubah;
rollback;`], { encoding: "utf8" }).trim().split("\n").filter((l) => /kelas:/.test(l)).join("");
    notes.push(`a change of context: ${ubah}`);
    if ((ubah.match(/REFUSED/g) ?? []).length !== 3) rec.verdict = "FAIL";
    return notes.join("; ");
  });

  // ───────────────────────────── C12f (P5)
  const PEMBACA = [
    ["the facilitator", ORANG_PD.fasilitator.email, { sesi: 4, progres: true, hasil: 4, jawaban: 0, sinyal: 0, catatan: "FULL" }],
    ["the responsible Kepala departemen", ORANG_PD.kepalaPd.email, { sesi: 4, progres: true, hasil: 4, jawaban: 0, sinyal: 0, catatan: "FULL" }],
    ["the Dekan", people.dekan.email, { sesi: 4, progres: true, hasil: null, jawaban: 0, sinyal: 0, catatan: "FULL" }],
    ["the school admin", people.sdAdmin.email, { sesi: 4, progres: false, hasil: 0, jawaban: 0, sinyal: 0, catatan: "COMPLETION" }],
    ["another Guru", ORANG_PD.guruLain.email, { sesi: 0, progres: false, hasil: 0, jawaban: 0, sinyal: 0, catatan: "REFUSED" }],
    ["another Kepala departemen", people.kaprodi.email, { sesi: 0, progres: false, hasil: 0, jawaban: 0, sinyal: 0, catatan: "REFUSED" }],
    ["a Guru of SMA Zayd", ORANG_PD.guruSma.email, { sesi: 0, progres: false, hasil: 0, jawaban: 0, sinyal: 0, catatan: "REFUSED" }],
  ];
  async function bacaSebagai(email) {
    const c = await apiSession(email);
    const n = async (t, kol, ids2, eq = null) => {
      let r = c.from(t).select(kol, { count: "exact", head: true }).in(kol, ids2);
      if (eq) r = r.eq(eq[0], eq[1]);
      return (await r).count ?? -1;
    };
    const cat = await c.rpc("professional_learning_record", { p_node: C.kelasA });
    return {
      sesi: await n("assessment_sessions", "id", C.sesi),
      progres: await n("lesson_progress", "plp_release_id", C.rilis, ["person_id", C.guru]),
      hasil: await n("assessment_results", "session_id", C.sesi),
      jawaban: (await n("responses", "session_id", C.sesi)) + (await n("presented_items", "session_id", C.sesi)),
      sinyal: await n("integrity_signals", "session_id", C.sesi),
      catatan: cat.error ? `REFUSED:${cat.error.code}:${cat.error.details ?? ""}` : String(cat.data?.columns ?? cat.data?.kolom ?? JSON.stringify(cat.data).match(/"columns":"(\w+)"/)?.[1] ?? "?"),
    };
  }
  await step("C12f", "C-12 P5 visibility per D-069(b), by each role's own login and on screen: the facilitator, the responsible Kepala departemen, the Dekan, the school admin, another Guru, another Kepala departemen, a student; the facilitator's «Lihat per soal» shows no individual answers", async (rec) => {
    const notes = [];
    for (const [siapa, email, harap] of PEMBACA) {
      const r = await bacaSebagai(email);
      const salah = [];
      if (r.sesi !== harap.sesi) salah.push(`sessions ${r.sesi}`);
      if (harap.progres ? !(r.progres > 0) : r.progres !== 0) salah.push(`progress ${r.progres}`);
      if (harap.hasil !== null && r.hasil !== harap.hasil) salah.push(`results ${r.hasil}`);
      if (r.jawaban !== 0) salah.push(`answers ${r.jawaban}`);
      if (r.sinyal !== 0) salah.push(`integrity ${r.sinyal}`);
      if (harap.catatan === "REFUSED" ? !/^REFUSED:PR090:PD_RECORD_NOT_ALLOWED/.test(r.catatan) : r.catatan !== harap.catatan) salah.push(`record ${r.catatan}`);
      if (salah.length) rec.verdict = "FAIL";
      notes.push(`${siapa}: ${JSON.stringify(r)}${salah.length ? ` MISMATCH (${salah.join(", ")})` : ""}`);
    }
    // a student of Kelas 1A, signed in with her class card, asked the same through the database (no email to sign in with)
    const ani = kartuKelas[0];
    const murid = q(`select a.auth_user_id from public.accounts a join public.persons p on p.id = a.person_id where p.display_name = '${ani?.nama ?? ""}' limit 1`);
    if (murid) {
      const r = execFileSync("psql", [DB, "-At", "-c", `begin;
select set_config('request.jwt.claims', json_build_object('sub', '${murid}', 'role', 'authenticated')::text, true), set_config('request.jwt.claim.sub', '${murid}', true);
set local role authenticated;
select (select count(*) from public.assessment_sessions where id in ('${C.sesi.join("','")}')) || '|' ||
       (select count(*) from public.assessment_results where session_id in ('${C.sesi.join("','")}')) || '|' ||
       (select count(*) from public.responses where session_id in ('${C.sesi.join("','")}')) || '|' ||
       (select count(*) from public.integrity_signals where session_id in ('${C.sesi.join("','")}'));
rollback;`], { encoding: "utf8" }).trim().split("\n").filter((l) => /^\d+\|/.test(l)).join("");
      notes.push(`a student (${ani.nama}): sessions|results|answers|integrity ${r}`);
      if (r !== "0|0|0|0") rec.verdict = "FAIL";
    }
    // the participant himself reads his own sessions, results and answers (the ordinary learner experience)
    const sendiri = await bacaSebagai(people.guru.email);
    notes.push(`the participant: sessions ${sendiri.sesi}, results ${sendiri.hasil}, answers ${sendiri.jawaban}`);
    if (sendiri.sesi !== 4 || sendiri.hasil !== 4 || !(sendiri.jawaban > 0)) rec.verdict = "FAIL";

    // on screen: each audience reaches the record by its own link, and sees exactly its columns
    const bukaCatatan = async (p, dari, tautan) => {
      await p.goto(`${APP}${dari}`, { waitUntil: "networkidle" });
      await tutupTur(p);
      const l = typeof tautan === "string" ? p.getByRole("link", { name: tautan }).first() : tautan(p);
      if (!(await l.count())) return { di: null, teks: norm(await p.locator("main").innerText().catch(() => "")).slice(0, 200) };
      await l.click();
      await p.waitForURL((u) => u.pathname === `/pengembangan/${C.kelasA}`, { timeout: SLOW }).catch(() => {});
      await p.getByRole("heading", { name: "Catatan pengembangan profesi" }).first().waitFor({ timeout: SLOW }).catch(() => {});
      return { di: new URL(p.url()).pathname, teks: norm(await p.locator("main").innerText().catch(() => "")) };
    };
    const kelasPd = (p) => p.locator(`a[href="/pengembangan/${C.kelasA}"]`).first();
    const f = await masuk("fasilitator", ORANG_PD.fasilitator.email);
    const fasil = await bukaCatatan(f, `/mengajar/${C.kelasA}`, "Catatan pengembangan profesi kelas ini");
    rec.shots.push(await shot(f, "c12-catatan-fasilitator"));
    await f.goto(`${APP}/mengajar/${C.kelasA}`, { waitUntil: "networkidle" });
    const kelasTeks = norm(await f.locator("main").innerText().catch(() => ""));
    const judulKelas = (await f.locator("main h2").allInnerTexts()).map((x) => norm(x).toLowerCase());
    const kp = await masuk("kepalaPd", ORANG_PD.kepalaPd.email);
    const kepala = await bukaCatatan(kp, "/pimpinan", kelasPd);
    rec.shots.push(await shot(kp, "c12-catatan-kepala"));
    const dc = await ctx(); const dk = await dc.newPage(); await magicSignIn(dk, people.dekan.email);
    const dekan = await bukaCatatan(dk, "/pimpinan", kelasPd);
    rec.shots.push(await shot(dk, "c12-catatan-dekan"));
    await dc.close();
    const admin = await bukaCatatan(a, `/konfigurasi?muat=${Date.now()}#peserta`, kelasPd);
    rec.shots.push(await shot(a, "c12-catatan-admin"));
    // a participant's name is a section heading, drawn in capitals (.pin-sec > h2): compared without case. FULL: per Bab,
    // «Pelajaran selesai: 2/2» and «Hasil: <n> % · Tercapai» (both Bab passed); COMPLETION: «Selesai: Ya», neither of those
    const nama = (x) => x.teks.toLowerCase().includes(people.guru.name.toLowerCase());
    const hitung = (x, re) => (x.teks.match(re) ?? []).length;
    const penuh = (x) => x.di === `/pengembangan/${C.kelasA}` && nama(x) && hitung(x, /Pelajaran selesai: 2\/2/gi) === 2
      && hitung(x, /Hasil: \d[\d.,]*\s?% · Tercapai/gi) === 2;
    const terbatas = admin.di === `/pengembangan/${C.kelasA}` && nama(admin) && hitung(admin, /Selesai: Ya/gi) === 2
      && !/Pelajaran selesai/i.test(admin.teks) && !/Hasil:/i.test(admin.teks);
    const ringkas = (x) => (x.di ? x.teks.slice(x.teks.toLowerCase().indexOf(people.guru.name.toLowerCase()), undefined).slice(0, 300) : `not reached: ${x.teks}`);
    const pesertaJudul = judulKelas.includes("peserta"), muridJudul = judulKelas.includes("murid");
    notes.push(`on screen: the facilitator ${penuh(fasil)}, the PD Kepala departemen ${penuh(kepala)}, the Dekan ${penuh(dekan)} (full columns); the school admin ${terbatas} (completion only); ` +
      `the facilitator's Kelas heads its list «Peserta» ${pesertaJudul}, «Murid» ${muridJudul}, and names the Guru ${kelasTeks.toLowerCase().includes(people.guru.name.toLowerCase())}` +
      ([fasil, kepala, dekan].every(penuh) && terbatas ? "" : `; the record as read: facilitator «${ringkas(fasil)}» | admin «${ringkas(admin)}»`));
    if (!penuh(fasil) || !penuh(kepala) || !penuh(dekan) || !terbatas || !pesertaJudul || muridJudul) rec.verdict = "FAIL";
    // the refused, at the record's address
    for (const [siapa, email, pakaiKartu] of [["another Guru", ORANG_PD.guruLain.email, false], ["another Kepala departemen", people.kaprodi.email, false],
      ["a student", null, true]]) {
      const c = await ctx(); const p = await c.newPage();
      try {
        if (pakaiKartu) await masukKartu(p, kartuKelas[0]); else await magicSignIn(p, email);
        await p.goto(`${APP}/pengembangan/${C.kelasA}`, { waitUntil: "networkidle" });
        const teks = norm(await bodyText(p));
        const ditolak = (await p.locator(".pin-refusal").count()) > 0 && !teks.includes(people.guru.name);
        notes.push(`${siapa} at the record's address: refused ${ditolak}`);
        if (!ditolak) rec.verdict = "FAIL";
      } finally { await c.close(); }
    }
    // «Lihat per soal» in the PD Kelas: the facilitator is not given individual answers (D-069(b))
    const aa = q(`select aa.id from public.assessment_assignments aa join public.assessment_definitions dd on dd.id = aa.assessment_definition_id
      where aa.learning_assignment_id = '${C.tugas[1]}' and dd.mode = 'POST_TEST' limit 1`);
    await f.goto(`${APP}/mengajar/${C.kelasA}/soal?penugasan=${aa}`, { waitUntil: "networkidle" });
    await tutupTur(f);
    const soal = norm(await f.locator("main").innerText().catch(() => ""));
    rec.shots.push(await shot(f, "c12-lihat-per-soal-pd"));
    const perOrang = soal.includes(people.guru.name);
    const perPilihan = await f.locator("main li").filter({ hasText: /·/ }).count();
    notes.push(`the facilitator's «Lihat per soal» for Bab 2's Uji Penguasaan (/mengajar/<PD Kelas>/soal): names the participant ${perOrang}, ` +
      `refused ${(await f.locator(".pin-refusal").count()) > 0}; it reads «${soal.slice(0, 220)}»`);
    if (perOrang) { rec.verdict = "FAIL"; notes.push("DEFECT: the facilitator reads the participant's individual answers (D-069(b): not individual answers)"); }
    void perPilihan;
    return notes.join("; ");
  });

  // ───────────────────────────── C12g (P6)
  await step("C12g", "C-12 P6 integrity per D-069(c): the observation is recorded; no school role sees it in Studio «Tinjauan Integritas»; referring it is refused, to the school and to the platform", async (rec) => {
    const notes = [];
    const sinyal = q(`select s.id || '|' || s.category from public.integrity_signals s where s.session_id in ('${C.sesi.join("','")}') order by s.observed_at limit 1`);
    if (!sinyal) { rec.verdict = "FAIL"; return "no integrity observation was recorded for the Guru's PD test"; }
    const [id, kategori] = sinyal.split("|");
    notes.push(`recorded: ${kategori}`);
    for (const [siapa, kunci, email] of [["the PD Kepala departemen", "kepalaPd", ORANG_PD.kepalaPd.email], ["the school admin", null, null]]) {
      const p = kunci ? await masuk(kunci, email) : a;
      await p.goto(`${APP}/studio/integritas`, { waitUntil: "networkidle" });
      await tutupTur(p);
      const teks = norm(await bodyText(p));
      const tampak = teks.includes(people.guru.name) || teks.includes(JUDUL[0]);
      notes.push(`${siapa} at Tinjauan Integritas sees it ${tampak}`);
      if (tampak) rec.verdict = "FAIL";
    }
    const sekolah = [];
    for (const email of [ORANG_PD.kepalaPd.email, people.sdAdmin.email, ORANG_PD.fasilitator.email, people.dekan.email]) {
      const c = await apiSession(email);
      sekolah.push(tolakan(await c.rpc("record_integrity_review", { p_signal: id, p_decision: "REFERRED_TO_INSTITUTION", p_note: "uji C-12" })));
    }
    const gl = await apiSession(GLADYS);
    const platform = tolakan(await gl.rpc("refer_integrity_signal", { p_signal: id, p_note: "uji C-12" }));
    const dirujuk = q(`select count(*) from public.audit_log where target_id = '${id}' and action ilike '%REFER%'`);
    notes.push(`referral asked by the PD Kepala departemen, the school admin, the facilitator and the Dekan: ${sekolah.join(" / ")}; by the platform admin: ${platform}; referral rows ${dirujuk}`);
    if (sekolah.some((x) => !/requires CAN_REVIEW_INTEGRITY/.test(x)) || !/^PR090:PD_SIGNAL_NOT_REFERRED/.test(platform) || dirujuk !== "0") rec.verdict = "FAIL";
    return notes.join("; ");
  });

  // ───────────────────────────── C12h (P7)
  await step("C12h", "C-12 P7 tenancy: every new row belongs to SD Zayd; a Guru of SMA Zayd sees nothing; nothing in the canonical tenant", async (rec) => {
    const lain = q(`select
      (select count(*) from public.org_nodes where id in ('${C.bagian}','${C.tingkat}','${C.kelasA}','${C.kelasB}') and institution_id <> '${ids.sd}') || '|' ||
      (select count(*) from public.courses where id in ('${C.kursus.join("','")}') and institution_id <> '${ids.sd}') || '|' ||
      (select count(*) from public.assessment_sessions where id in ('${C.sesi.join("','")}') and institution_id <> '${ids.sd}') || '|' ||
      (select count(*) from public.certificates c where c.session_id in ('${C.sesi.join("','")}') and c.institution_id <> '${ids.sd}') || '|' ||
      (select count(*) from public.enrollments e join public.memberships m on m.enrollment_id = e.id where m.node_id = '${C.kelasA}' and e.institution_id <> '${ids.sd}') || '|' ||
      (select count(*) from public.courses c join public.institutions i on i.id = c.institution_id where i.tenant_kind = 'PLATFORM_CANONICAL' and c.title like '[UJI INTERNAL]%')`);
    const sma = PEMBACA.find(([s]) => s === "a Guru of SMA Zayd");
    const r = await bacaSebagai(sma[1]);
    const c = await ctx(); const p = await c.newPage();
    await magicSignIn(p, ORANG_PD.guruSma.email);
    await p.goto(`${APP}/pengembangan/${C.kelasA}`, { waitUntil: "networkidle" });
    const ditolak = (await p.locator(".pin-refusal").count()) > 0;
    await c.close();
    const ok = lain === "0|0|0|0|0|0" && r.sesi === 0 && r.hasil === 0 && r.jawaban === 0 && /^REFUSED/.test(r.catatan) && ditolak;
    if (!ok) rec.verdict = "FAIL";
    return `rows outside SD Zayd (places|courses|sessions|certificates|enrolments|canonical tenant): ${lain}; SMA Zayd's Guru reads ${JSON.stringify(r)} and is refused the record on screen ${ditolak}`;
  });

  // ───────────────────────────── C12i (P8)
  await step("C12i", "C-12 P8 boundary: refused — an academic release into the PD Kelas, a PD release into Kelas 1A, C1 into Kelas 1A, the intake with the Guru's person id; Siapkan in Kelas 1A offers no PD release", async (rec) => {
    const notes = [];
    const rilisAkademik = q(`select r.id from public.plp_releases r where r.course_id = '${babSatu()}' and r.status = 'PUBLISHED' order by r.created_at desc limit 1`);
    const rilisPd = q(`select r.id from public.plp_releases r where r.course_id = '${C.kursus[0]}' and r.status = 'PUBLISHED' order by r.created_at desc limit 1`);
    const dari = new Date().toISOString(), sampai = new Date(Date.now() + 30 * 86400000).toISOString();
    const fs = await apiSession(ORANG_PD.fasilitator.email);
    const satu = tolakan(await fs.rpc("assign_release", { p_release: rilisAkademik, p_node: C.kelasA, p_from: dari, p_until: sampai }));
    const gs = await apiSession(people.guru.email);
    const dua = tolakan(await gs.rpc("assign_release", { p_release: rilisPd, p_node: kelasSatuA(), p_from: dari, p_until: sampai }));
    const ad = await apiSession(people.sdAdmin.email);
    const tiga = tolakan(await ad.rpc("enrol_for_professional_learning", { p_person: C.guru, p_node: kelasSatuA() }));
    // the intake, as the school admin's own Pendataan check, asked in a transaction that is rolled back (a refused draft
    // left behind would sit in the school's Pendataan for the steps after)
    const empat = sebagaiLaluBatal(people.sdAdmin.email, `do $y$ declare j uuid; v jsonb; begin
  j := public.import_open('${ids.sd}', jsonb_build_array(jsonb_build_object('display_name', '${people.guru.name}', 'person_id', '${C.guru}', 'node_id', '${kelasSatuA()}', 'role', 'STUDENT')));
  v := public.import_validate(j);
  insert into c12_hasil values (v::text);
end $y$;`);
    const tambahan = q(`select count(*) from public.learning_assignments where (course_id = '${babSatu()}' and node_id = '${C.kelasA}') or (course_id = '${C.kursus[0]}' and node_id = '${kelasSatuA()}')`);
    notes.push(`academic release → PD Kelas: ${satu}; PD release → Kelas 1A: ${dua}; C1 → Kelas 1A: ${tiga}; the intake with the Guru's id: ${empat.slice(0, 220)}; assignments made ${tambahan}`);
    const intakeDitolak = /"ok"\s*:\s*false/.test(empat) && /institutional identity|nomor induk/i.test(empat);
    if (!/^PR050:ASSIGN_CONTEXT_MISMATCH/.test(satu) || !/^PR050:ASSIGN_CONTEXT_MISMATCH/.test(dua) || !/^PR090:PD_PLACE_NOT_FOR_EDUCATORS/.test(tiga)
      || !intakeDitolak || tambahan !== "0") rec.verdict = "FAIL";
    // Siapkan in Kelas 1A, as its teacher
    const b = await masuk("guru", people.guru.email);
    await b.goto(`${APP}/mengajar/${kelasSatuA()}/siapkan`, { waitUntil: "networkidle" });
    await tutupTur(b);
    await b.locator("main h1").first().waitFor({ timeout: SLOW }).catch(() => {});
    const daftar = norm(await b.locator("main").innerText().catch(() => ""));
    rec.shots.push(await shot(b, "c12-siapkan-kelas1a"));
    const rilisPd2 = q(`select r.id from public.plp_releases r where r.course_id = '${C.kursus[1]}' and r.status = 'PUBLISHED' order by r.created_at desc limit 1`);
    const cocok = await gs.rpc("releases_matching_place", { p_node: kelasSatuA(), p_releases: [rilisAkademik, rilisPd, rilisPd2] });
    const boleh = cocok.error ? `error ${cocok.error.code}` : (cocok.data ?? []).map((x) => (typeof x === "string" ? x : Object.values(x)[0]))
      .map((x) => (x === rilisAkademik ? "AKADEMIK" : x === rilisPd || x === rilisPd2 ? "PD" : "?")).sort().join("/");
    notes.push(`Kelas 1A's Siapkan loaded ${daftar.length > 0} and offers a PD release ${/\[UJI INTERNAL\]/i.test(daftar)}; the releases that may be given to Kelas 1A, asked as its teacher: ${boleh || "none"}`);
    if (!daftar || /\[UJI INTERNAL\]/i.test(daftar) || boleh !== "AKADEMIK") rec.verdict = "FAIL";
    return notes.join("; ");
  });

  // ───────────────────────────── C12j (P9)
  await step("C12j", "C-12 P9 marking: [UJI INTERNAL] on every title (course, module, lesson, test); the packages are absent from Pustaka PINTAR", async (rec) => {
    const tanpa = q(`select
      (select count(*) from public.courses where id in ('${C.kursus.join("','")}') and title not like '[UJI INTERNAL]%') +
      (select count(*) from public.modules where course_id in ('${C.kursus.join("','")}') and title not like '[UJI INTERNAL]%') +
      (select count(*) from public.lessons l join public.modules m on m.id = l.module_id where m.course_id in ('${C.kursus.join("','")}') and l.title not like '[UJI INTERNAL]%') +
      (select count(*) from public.assessment_definitions where course_id in ('${C.kursus.join("','")}') and title not like '%[UJI INTERNAL]%')`);
    const semua = q(`select (select count(*) from public.courses where id in ('${C.kursus.join("','")}')) + (select count(*) from public.modules where course_id in ('${C.kursus.join("','")}'))
      + (select count(*) from public.lessons l join public.modules m on m.id = l.module_id where m.course_id in ('${C.kursus.join("','")}'))
      + (select count(*) from public.assessment_definitions where course_id in ('${C.kursus.join("','")}'))`);
    await g.goto(`${APP}/studio/kanonik`, { waitUntil: "networkidle" });
    const pustaka = norm(await g.locator("main").innerText().catch(() => ""));
    rec.shots.push(await shot(g, "c12-pustaka"));
    const diPustaka = /\[UJI INTERNAL\]/.test(pustaka) || JUDUL.some((t) => pustaka.includes(t));
    if (tanpa !== "0" || diPustaka) rec.verdict = "FAIL";
    return `titles without [UJI INTERNAL]: ${tanpa} of ${semua}; Pustaka PINTAR (/studio/kanonik) shows them ${diPustaka}`;
  });

  // ───────────────────────────── C12k (P1, P2, P3)
  await step("C12k", "C-12 the hard gate and identity: the after snapshot is byte-identical to the baseline (every reading, every protected source, every roster and «Murid» list, the screens); the Guru is one person, still EDUCATOR, home /mengajar, the Kelas tab works (P1, P2, P3)", async (rec) => {
    const notes = [];
    C.akhir = ambilPotret(DB, param());
    writeFileSync(join(OUT, "c12-sesudah.json"), JSON.stringify(C.akhir, null, 1));
    const selisih = beda(C.awal, C.akhir);
    C.layarAkhir = await bacaLayar("sesudah");
    const selisihLayar = beda(C.layarAwal, C.layarAkhir);
    notes.push(`readings ${Object.keys(C.akhir.metrik).length}, md5 ${C.awal.metrik_md5} → ${C.akhir.metrik_md5}; differences in the snapshot: ${selisih.length ? selisih.slice(0, 6).join(" ; ") : "none"}; ` +
      `on screen: ${selisihLayar.length ? selisihLayar.slice(0, 4).join(" ; ") : "identical"} (${C.layarAkhir.bukti.join(" | ").slice(0, 160)})`);
    if (selisih.length || selisihLayar.length) rec.verdict = "FAIL";
    // P1: the Guru as himself
    const api = await apiSession(people.guru.email);
    const profil = (await api.from("my_profile").select("display_role").maybeSingle()).data?.display_role;
    const b = await masuk("guru", people.guru.email);
    await b.goto(`${APP}/mengajar`, { waitUntil: "networkidle" });
    await tutupTur(b);
    // the class itself, by its exact address (the home's «Siapkan …» card also starts with it)
    const kelas = b.locator(`a[href="/mengajar/${kelasSatuA()}"]`).first();
    let tab = false;
    if (await kelas.count()) {
      await kelas.click();
      await b.waitForURL((u) => u.pathname === `/mengajar/${kelasSatuA()}`, { timeout: SLOW }).catch(() => {});
      await b.locator("main h2").first().waitFor({ timeout: SLOW }).catch(() => {});
      const judul = (await b.locator("main h2").allInnerTexts()).map((x) => norm(x).toLowerCase());
      tab = new URL(b.url()).pathname === `/mengajar/${kelasSatuA()}` && (await b.locator(".pin-refusal").count()) === 0
        && /kelas 1a/i.test(norm(await bodyText(b))) && judul.includes("murid") && !judul.includes("peserta");
    }
    const satuOrang = q(`select (select count(distinct e.person_id) from public.enrollments e join public.memberships m on m.enrollment_id = e.id where m.node_id = '${C.kelasA}' and e.person_id = '${C.guru}')
      || '|' || (select count(distinct s.person_id) from public.assessment_sessions s where s.id in ('${C.sesi.join("','")}'))
      || '|' || (select count(distinct c.person_id) from public.certificates c where c.session_id in ('${C.sesi.join("','")}'))
      || '|' || (select count(*) from public.assessment_sessions s where s.id in ('${C.sesi.join("','")}') and s.person_id <> '${C.guru}')`);
    notes.push(`the Guru: display role ${profil}; landed on ${C.mendarat_guru}; Kelas 1A opens from /mengajar ${tab}; one person on every row (membership|sessions|certificates|others): ${satuOrang}; ` +
      `persons ${C.awal.orang.persons_named} → ${C.akhir.orang.persons_named}, accounts ${C.awal.orang.accounts} → ${C.akhir.orang.accounts}, numbers ${C.awal.orang.numbers} → ${C.akhir.orang.numbers}, roles ${C.akhir.orang.roles_aktif}`);
    if (profil !== "EDUCATOR" || C.mendarat_guru !== "/mengajar" || !tab || satuOrang !== "1|1|1|0") rec.verdict = "FAIL";
    for (const p of Object.values(C.halaman)) await p.context().close().catch(() => {});
    return notes.join("; ");
  });
}
