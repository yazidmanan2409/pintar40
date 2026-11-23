/**
 * Z3-A (stream A) captures for Daisy: K-01's screens (one verdict; the gate-unknown state; C2), V2's retake line and
 * D14 on the summary, N-14 and N-15, at 1280, 390 and 320 px, keyboard only, with the recovery walks at 390.
 *
 * Run against a FRESH local stack and `next start` of this branch on port 3999 (tangkap-z3a.sh does all of it):
 *   PINTAR_SELFTEST_RSC=1 npx tsx --conditions=react-server docs/completion-4.1/batches/z/layar/tangkap-z3a.ts
 *
 * The world is the seeded human-evaluation school (supabase/seed/human_evaluation.sql): peraga-siswa's one official
 * Uji Penguasaan, her teacher, the head of department. Persona accounts have no password by design (the seed's 0070
 * rule), so each is entered as the seed intends: the evaluator signs in and assumes the persona (/api/evaluation/assume).
 * Every state below is written for the shots with triggers off, and the stack is reset after the run (tangkap-z3a.sh),
 * so nothing outlives it. Each shot's horizontal overflow, focused element,
 * live-region text and the text of the section it shows go to CATATAN-Z3A.txt.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { createRequire } from "node:module";
import { ipUji, lit, psql } from "../../../../../selftest/bob26.test";
import { Komputer } from "../../../../../selftest/bob29.test";
import { pilihKonteksPeramban } from "../../../../../selftest/konteks-uji";

const { chromium } = createRequire(__filename)("playwright");
type Browser = Awaited<ReturnType<typeof chromium.launch>>;
type BrowserContext = Awaited<ReturnType<Browser["newContext"]>>;
type Page = Awaited<ReturnType<BrowserContext["newPage"]>>;

const ASAL = "http://127.0.0.1:3999";
const KE = __dirname;
const AKAR = join(__dirname, "..", "..", "..", "..", "..");
const LEBAR = [1280, 390, 320] as const;
const catatan: string[] = [];
const PENILAI = { identitas: "penilai@evaluasi.pintar.test", password: "Penilai-Evaluasi-4417!" };
const SISWA = { identitas: "peraga-siswa@evaluasi.pintar.test" };
const GURU = { identitas: "peraga-guru@evaluasi.pintar.test" };
const KAPRODI = { identitas: "peraga-kaprodi@evaluasi.pintar.test" };

/** The evaluator signs in and assumes one persona, then chooses the persona's working context (as masuk() does). */
async function sebagaiPeraga(email: string, konteks: string): Promise<Komputer | string> {
  const k = new Komputer(ASAL, ipUji());
  const m = await k.jsonDari("/masuk/password", { form: PENILAI });
  if (m.status !== 200) return `the evaluator could not sign in (${m.status})`;
  await k.halaman("/");
  const persona = psql(`select e.id from public.evaluation_personas e join public.accounts a on a.person_id = e.person_id
    join auth.users u on u.id = a.auth_user_id where u.email = ${lit(email)} limit 1`).split("\n").pop()!.trim();
  if (!persona) return `no evaluation persona for ${email}`;
  const r = await k.kirim("/api/evaluation/assume", { form: { persona_id: persona } });
  if (r.status !== 303 || /galat=1/.test(r.headers.get("location") ?? "")) return `assuming ${email} was refused (${r.status} ${r.headers.get("location")})`;
  await k.halaman("/");
  await k.jsonDari("/api/sesi/perangkat", { form: { mode: "PERSONAL" } });
  try { await pilihKonteksPeramban(k, konteks); } catch (e) { return `${email} could not choose ${konteks}: ${(e as Error).message.slice(0, 200)}`; }
  return k;
}

async function kontekDari(browser: Browser, k: unknown): Promise<BrowserContext> {
  const ctx = await browser.newContext({ deviceScaleFactor: 2 });
  const kue = (k as { kue: Map<string, string> }).kue;
  await ctx.addCookies([...kue].map(([name, value]) => ({ name, value, url: ASAL })));
  return ctx;
}

/** Open the page, Tab `tab` times from the top (keyboard only), record and shoot at each width (or only `lebar`). */
async function tangkap(p: Page, nama: string, alamat: string, opsi: { tab?: number; bagian?: string; lebar?: readonly number[] } = {}) {
  for (const w of opsi.lebar ?? LEBAR) {
    await p.setViewportSize({ width: w, height: 900 });
    await p.goto(ASAL + alamat, { waitUntil: "networkidle" });
    for (let i = 0; i < (opsi.tab ?? 1); i++) await p.keyboard.press("Tab");
    if (opsi.bagian) await p.locator(opsi.bagian).first().scrollIntoViewIfNeeded().catch(() => undefined);
    const info = await p.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      const live = [...document.querySelectorAll('[role="status"],[role="alert"],[aria-live]')].map((x) => (x.textContent ?? "").trim()).filter(Boolean).join(" | ");
      return {
        lebih: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        fokus: el ? `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} «${(el.textContent ?? "").trim().slice(0, 60)}»` : "none",
        live: live.slice(0, 400),
      };
    });
    const teks = opsi.bagian ? (await p.locator(opsi.bagian).allInnerTexts().catch(() => [])).join(" / ").replace(/\s+/g, " ").slice(0, 700) : "";
    catatan.push(`${nama}-${w}\toverflow ${info.lebih}px\tfocus ${info.fokus}\tlive «${info.live}»${teks ? `\tsection «${teks}»` : ""}`);
    await p.screenshot({ path: join(KE, `z3a-${nama}-${w}.png`) });
  }
}

/** The same record and shot, for markup drawn from a component with the app's built stylesheet (no route can show it). */
async function tangkapIsi(p: Page, nama: string, isi: string, css: string, opsi: { tab?: number; bagian?: string; lebar?: readonly number[] } = {}) {
  for (const w of opsi.lebar ?? LEBAR) {
    await p.setViewportSize({ width: w, height: 900 });
    await p.setContent(`<!doctype html><html lang="id"><head><meta name="viewport" content="width=device-width"><style>${css}</style></head>
      <body><a href="#isi">Langsung ke isi</a><main id="isi" class="pin-col">${isi}</main></body></html>`);
    for (let i = 0; i < (opsi.tab ?? 1); i++) await p.keyboard.press("Tab");
    if (opsi.bagian) await p.locator(opsi.bagian).first().scrollIntoViewIfNeeded().catch(() => undefined);
    const lebih = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const teks = opsi.bagian ? (await p.locator(opsi.bagian).allInnerTexts().catch(() => [])).join(" / ").replace(/\s+/g, " ").slice(0, 700) : "";
    catatan.push(`${nama}-${w}\toverflow ${lebih}px\tdrawn from the component with the built stylesheet${teks ? `\tsection «${teks}»` : ""}`);
    await p.screenshot({ path: join(KE, `z3a-${nama}-${w}.png`) });
  }
}

const sql = (s: string) => psql(s).split("\n").pop()!.trim();

(async () => {
  // ---------------------------------------------------------------- the world: peraga-siswa's official sitting
  const [sesi, la, aa, kelas, inst, pid] = sql(`select concat_ws('|', s.id, s.learning_assignment_id, s.assessment_assignment_id, s.class_node_id, s.institution_id, s.person_id)
    from public.assessment_sessions s join public.accounts a on a.person_id = s.person_id join auth.users u on u.id = a.auth_user_id
   where u.email = ${lit(SISWA.identitas)} and s.status = 'FINALIZED' and s.mode = 'POST_TEST'`).split("|");
  if (!sesi) throw new Error("no peraga sitting");
  const [item, salah, kode] = sql(`select concat_ws('|', f.item_id, (select o.label from public.item_options o where o.item_id = f.item_id and not o.is_correct order by o.label limit 1),
      (select lo.code from public.learning_objectives lo where lo.id = (select i.objective_ids[1] from public.items i where i.id = f.item_id)))
    from public.session_final_responses(${lit(sesi)}) f where f.is_safety_critical order by f.item_id limit 1`).split("|");
  // a retake request the head of department decides, so the queue shows the last result
  psql(`begin; set local session_replication_role = replica;
    insert into public.attempt_requests (id, person_id, session_id, assessment_assignment_id, institution_id, requested_by_person_id, requested_at, reason, status)
    select gen_random_uuid(), s.person_id, s.id, s.assessment_assignment_id, s.institution_id,
           (select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(GURU.identitas)}), now(),
           'Tangkap Z3-A: satu kesempatan lagi untuk murid ini', 'PENDING' from public.assessment_sessions s where s.id = ${lit(sesi)}; commit;`);
  // STATE 1, the gate-only failure: her must-be-right answer moved to a wrong option, and her result as the engine would
  // record it (one fewer right, the gate false), the mastery still at or above the mark
  psql(`begin; set local session_replication_role = replica;
    update public.responses r set value = jsonb_build_object('pilihan', ${lit(salah)}) from public.presented_items p
     where p.id = r.presented_item_id and r.is_final and p.session_id = ${lit(sesi)} and p.item_id = ${lit(item)};
    update public.assessment_results r set safety_gate_passed = false,
           mastery = round(((r.delta_inputs ->> 'correct')::numeric - 1) / (r.delta_inputs ->> 'item_total')::numeric, 4),
           delta_inputs = r.delta_inputs || jsonb_build_object('correct', (r.delta_inputs ->> 'correct')::int - 1, 'safety_correct', (r.delta_inputs ->> 'safety_correct')::int - 1),
           per_domain = jsonb_set(r.per_domain, array[${lit(kode)}], (r.per_domain -> ${lit(kode)}) || jsonb_build_object(
             'benar', (r.per_domain -> ${lit(kode)} ->> 'benar')::int - 1,
             'penguasaan', round(((r.per_domain -> ${lit(kode)} ->> 'benar')::numeric - 1) / (r.per_domain -> ${lit(kode)} ->> 'total')::numeric, 4)))
     where r.session_id = ${lit(sesi)}; commit;`);
  catatan.push(`world: sitting ${sesi}, class ${kelas}, school ${inst}; the must-be-right item's objective ${kode}; result: ${sql(`select concat_ws(' ', mastery, safety_gate_passed, per_domain::text) from public.assessment_results where session_id = ${lit(sesi)}`)}; mark ${sql(`select pass_mark from public.assessment_assignments where id = ${lit(aa)}`)}`);

  const browser = await chromium.launch();
  // one persona session per evaluator at a time (assume_persona): each phase is one persona; between phases the
  // evaluator's persona session is ended (this capture's own, on a disposable stack)
  const akhiriSesi = () => psql("begin; update public.evaluation_sessions set ended_at = now(), ended_reason = 'capture phase ended' where ended_at is null; commit;");
  const halamanSebagai = async (email: string, konteks: string) => {
    akhiriSesi();
    const k = await sebagaiPeraga(email, konteks);
    if (typeof k === "string") throw new Error(k);
    return (await kontekDari(browser, k)).newPage();
  };
  const muridSatu = `/mengajar/${kelas}/murid/${pid}`;
  const ulang = `/mengajar/${kelas}/ulang?penugasan=${aa}`;
  const tulis = (q: string) => psql(`begin; set local session_replication_role = replica; ${q}; commit;`);
  const baru = sql("select gen_random_uuid()");
  const retakeBuka = () => tulis(`insert into public.assessment_sessions select (jsonb_populate_record(s, jsonb_build_object('id', ${lit(baru)}, 'status', 'IN_PROGRESS',
      'created_at', now(), 'started_at', now(), 'submitted_at', null, 'finalized_at', null))).* from public.assessment_sessions s where s.id = ${lit(sesi)}`);
  const retakeTutup = () => tulis(`delete from public.assessment_sessions where id = ${lit(baru)}`);
  try {
    // ================================================================ the learner
    const mp = await halamanSebagai(SISWA.identitas, "BELAJAR");
    // STATE 1, the gate-only failure
    await tangkap(mp, "01-murid-hasil-gerbang", `/belajar/${la}/hasil`, { tab: 3, bagian: "[data-target]" });
    await tangkap(mp, "02-murid-ringkasan-gerbang", "/belajar/hasil", { tab: 3, bagian: "[data-lk]" });
    // C2: the missed must-be-right question has no objective
    const tujuanAsli = sql(`select coalesce(objective_ids::text, '{}') from public.items where id = ${lit(item)}`);
    // (its objective's own figure put back at the mark or above, so the missed question is the only reason, as C2 is)
    const domainAsli = sql(`select per_domain::text from public.assessment_results where session_id = ${lit(sesi)}`);
    tulis(`update public.items set objective_ids = '{}' where id = ${lit(item)}`);
    tulis(`update public.assessment_results r set per_domain = jsonb_set(r.per_domain, array[${lit(kode)}], (r.per_domain -> ${lit(kode)}) || jsonb_build_object(
        'benar', (r.per_domain -> ${lit(kode)} ->> 'total')::int, 'penguasaan', 1.0)) where r.session_id = ${lit(sesi)}`);
    await tangkap(mp, "12-murid-hasil-c2", `/belajar/${la}/hasil`, { tab: 3, bagian: "[data-target]" });
    tulis(`update public.items set objective_ids = ${lit(tujuanAsli)}::uuid[] where id = ${lit(item)}`);
    tulis(`update public.assessment_results set per_domain = ${lit(domainAsli)}::jsonb where session_id = ${lit(sesi)}`);
    // V2: a retake under way (the result shown stays the finished one)
    retakeBuka();
    await tangkap(mp, "13-murid-ringkasan-v2", "/belajar/hasil", { tab: 3, bagian: "[data-lk]" });
    retakeTutup();
    // D14: the result in force recalculated after it was sealed (removed again after the shot)
    tulis(`insert into public.assessment_results select (jsonb_populate_record(r, jsonb_build_object('id', gen_random_uuid(), 'supersedes_result_id', r.id,
        'recomputation_reason', 'Tangkap Z3-A: penghitungan ulang yang diaudit', 'computed_at', now()))).*
        from public.assessment_results r where r.session_id = ${lit(sesi)} and r.supersedes_result_id is null`);
    await tangkap(mp, "15-murid-ringkasan-d14", "/belajar/hasil", { tab: 3, bagian: "[data-lk]" });
    tulis(`delete from public.assessment_results where session_id = ${lit(sesi)} and recomputation_reason = 'Tangkap Z3-A: penghitungan ulang yang diaudit'`);

    // ================================================================ the teacher
    const gp = await halamanSebagai(GURU.identitas, `MENGAJAR:${inst}`);
    await tangkap(gp, "03-guru-murid-gerbang", muridSatu, { tab: 3, bagian: "section[aria-labelledby=pin-murid-hasil]" });
    await tangkap(gp, "04-guru-tujuan-n14", muridSatu, { tab: 3, bagian: "section[aria-labelledby=pin-murid-tujuan]" });
    await tangkap(gp, "05-guru-ulang-gerbang", ulang, { tab: 3, bagian: "fieldset" });
    // N-15: «Murid yang perlu penguatan» is drawn only past the readiness minimum (five assessed learners); this school has
    // one, so the section is drawn from KomposisiKelas with the app's built stylesheet: one learner unread, then read
    const css = readdirSync(join(AKAR, ".next", "static", "chunks")).filter((f) => f.endsWith(".css")).map((f) => readFileSync(join(AKAR, ".next", "static", "chunks", f), "utf8")).join("\n");
    const gambar = spawnSync(process.execPath, ["--import", "tsx", "-e", `(async () => {
      const { createElement: h } = await import("react"); const { renderToStaticMarkup: r } = await import("react-dom/server");
      const m = await import("file://" + process.cwd() + "/src/components/laporan/KomposisiKelas.tsx"); const K = (m.default.default ?? m.default);
      const pita = { status: "ok", readiness: "SUFFICIENT_EVIDENCE", metric_id: "class.readiness_distribution", label_key: "metrik.kesiapan.label",
        meaning_key: "metrik.kesiapan.arti", value: { "kesiapan.butuh_pendampingan": 3, "kesiapan.siap_sertifikasi": 4 }, population: { placed: 7, assessed: 7, not_yet: 0 } };
      const o = (ayu) => [{ id: "o1", nama: "Aisyah (peraga)", ulang: ayu, benar: 5, total: 6, soalWajibTepat: false },
        { id: "o2", nama: "Budi Santoso", ulang: ["Membandingkan pecahan"], benar: 3, total: 6, soalWajibTepat: true },
        { id: "o3", nama: "Hana Siregar", ulang: [], benar: 3, total: 6, soalWajibTepat: true }];
      const p = { locale: "id", persona: "educator", jenis: "LEARNER", namaKelas: "5A", buktiHref: "/mengajar/k/bukti", target: 0.6, entries: [pita], muridHref: "/mengajar/k/murid" };
      process.stdout.write(JSON.stringify({ gagal: r(h(K, { ...p, penguatan: o(null) })), pulih: r(h(K, { ...p, penguatan: o(["Menentukan pecahan senilai dengan mengali"]) })) }));
    })()`], { cwd: AKAR, encoding: "utf8" });
    if (gambar.status !== 0) throw new Error(`KomposisiKelas could not be drawn: ${gambar.stderr}`);
    const lk = JSON.parse(gambar.stdout) as { gagal: string; pulih: string };
    const dp = await (await browser.newContext({ deviceScaleFactor: 2 })).newPage();
    await tangkapIsi(dp, "08-laporan-kelas-tujuan-gagal", lk.gagal, css, { tab: 1, bagian: "[data-lk=penguatan]" });
    await tangkapIsi(dp, "08-laporan-kelas-tujuan-pulih", lk.pulih, css, { tab: 1, bagian: "[data-lk=penguatan]", lebar: [390] });
    // STATE 2: the gate cannot be read (the result row's gate null), then is (recovery)
    tulis(`update public.assessment_results set safety_gate_passed = null where session_id = ${lit(sesi)}`);
    await tangkap(gp, "09-guru-murid-tak-diketahui", muridSatu, { tab: 3, bagian: "section[aria-labelledby=pin-murid-hasil]" });
    await tangkap(gp, "10-guru-ulang-tak-diketahui", ulang, { tab: 3, bagian: "fieldset" });
    tulis(`update public.assessment_results set safety_gate_passed = false where session_id = ${lit(sesi)}`);
    await tangkap(gp, "09-guru-murid-tak-diketahui-pulih", muridSatu, { tab: 3, bagian: "section[aria-labelledby=pin-murid-hasil]", lebar: [390] });
    // C2 for the teacher (Sharon's nit): the gate failed on a question with no objective; its objective's own figure back
    // at the mark, so nothing is below it and the section says why the list is empty
    const tujuanAsliG = sql(`select coalesce(objective_ids::text, '{}') from public.items where id = ${lit(item)}`);
    const domainAsliG = sql(`select per_domain::text from public.assessment_results where session_id = ${lit(sesi)}`);
    tulis(`update public.items set objective_ids = '{}' where id = ${lit(item)}`);
    tulis(`update public.assessment_results r set per_domain = jsonb_set(r.per_domain, array[${lit(kode)}], (r.per_domain -> ${lit(kode)}) || jsonb_build_object(
        'benar', (r.per_domain -> ${lit(kode)} ->> 'total')::int, 'penguasaan', 1.0)) where r.session_id = ${lit(sesi)}`);
    await tangkap(gp, "16-guru-tujuan-c2", muridSatu, { tab: 3, bagian: "section[aria-labelledby=pin-murid-tujuan]" });
    tulis(`update public.items set objective_ids = ${lit(tujuanAsliG)}::uuid[] where id = ${lit(item)}`);
    tulis(`update public.assessment_results set per_domain = ${lit(domainAsliG)}::jsonb where session_id = ${lit(sesi)}`);
    // V2 for the teacher
    retakeBuka();
    await tangkap(gp, "14-guru-murid-v2", muridSatu, { tab: 3, bagian: "section[aria-labelledby=pin-murid-hasil]" });
    retakeTutup();

    // ================================================================ the head of department (the retake queue)
    const kp = await halamanSebagai(KAPRODI.identitas, `MENGELOLA:${inst}`);
    await tangkap(kp, "06-antrean-gerbang", "/pimpinan?kesempatan=buka", { tab: 3, bagian: "#kesempatan" });
    tulis(`update public.assessment_results set safety_gate_passed = null where session_id = ${lit(sesi)}`);
    await tangkap(kp, "11-antrean-tak-diketahui", "/pimpinan?kesempatan=buka", { tab: 3, bagian: "#kesempatan" });
    tulis(`update public.assessment_results set safety_gate_passed = false where session_id = ${lit(sesi)}`);
    await tangkap(kp, "11-antrean-tak-diketahui-pulih", "/pimpinan?kesempatan=buka", { tab: 3, bagian: "#kesempatan", lebar: [390] });
  } finally {
    await browser.close();
    writeFileSync(join(KE, "CATATAN-Z3A.txt"), catatan.join("\n") + "\n");
  }
})().catch((e) => { console.error(e); process.exit(1); });
