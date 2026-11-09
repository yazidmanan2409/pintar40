// LOCAL ONLY. A school's worth of results for the Reporting Quality Gate (owner directive, 9 Nov): enough learners,
// classes and sittings that every report can be read as its intended reader, with the edge cases the gate names.
//
// WHERE. The demonstration school «SD Cendekia Nusantara (sekolah peragaan)» (seed human_evaluation.sql): locally the
// only school besides the bootstrap whose evidence is OFFICIAL, which is what every report reads (scoped_official_*).
// Two synthetic chapters (audit/fixtures/sd5-sintetis-bab{1,2}) are published there through Studio's operations.
//
// THE WORLD (names are synthetic; nobody here is a real person):
//   5B  24 learners: 22 sit Pemetaan Awal and Uji Penguasaan, 1 only Pemetaan Awal, 1 nothing (partial participation)
//   5C  12 learners:  7 sit both (a population above the minimum of 5, with many not yet assessed)
//   5D   4 learners:  4 sit both (a population under the minimum: «Belum cukup data»)
//   5E   9 learners:  nobody sits anything (zero records)
//   staff: a Guru of 5B and 5C, a Kepala departemen (Matematika), a Dekan (Sekolah Dasar), an Admin sekolah
// The answers are chosen per learner from an ability and per objective, so the distribution is uneven on purpose
// (no bell curve is drawn into the data, and none may be drawn out of it by a report).
//
// HOW. Structure, people and roles are written by SQL as a fixture (local stack only, like selftest/db). The chapter
// is given by assign_release with the admin's own token, and EVERY SITTING goes through PINTAR's learner RPCs with
// the learner's own token (start_learning_session, session_paper, record_answer, finish_my_session): the results,
// their mastery and their bands are PINTAR's scoring, never written here.
//
// Credentials are generated per run and written only to OUT (default: a scratch file outside the repository);
// nothing secret is printed or committed. Refuses any database or API that is not on this machine.
// Run once on a fresh `npx supabase db reset`; it refuses to build twice.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const DB = env("SUPABASE_DB_URL");
const SB = env("NEXT_PUBLIC_SUPABASE_URL");
const ANON = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const SERVICE = env("SUPABASE_SERVICE_ROLE_KEY");
const OUT = env("OUT_FILE");
const lokal = (u) => /^(postgres(ql)?:\/\/[^@]+@|https?:\/\/)(127\.0\.0\.1|localhost)[:/]/.test(u);
if (!lokal(DB) || !lokal(SB)) throw new Error("local stack only: the database and the API must be on 127.0.0.1");

const FS = "\x1f";
const sql = (q) => execFileSync("psql", [DB, "-qAt", "-F", FS, "-v", "ON_ERROR_STOP=1", "-c", q], { encoding: "utf8", maxBuffer: 64 << 20 }).trim();
const rows = (q) => { const t = sql(q); return t ? t.split("\n").map((l) => l.split(FS)) : []; };
const uuid = (s) => { if (!/^[0-9a-f-]{36}$/.test(s ?? "")) throw new Error(`not a uuid: ${s}`); return `'${s}'`; };
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

// a deterministic generator, so a rebuild gives the same world
let benih = 20261109;
const acak = () => { benih = (benih * 1103515245 + 12345) % 2147483648; return benih / 2147483648; };

const I = sql(`select id from public.institutions where slug = 'pintar-human-evaluation'`);
uuid(I);
if (sql(`select count(*) from public.org_nodes where institution_id = ${uuid(I)} and kind = 'CLASS' and name = '5B'`) !== "0") {
  throw new Error("the report world is already built here: run `npx supabase db reset` to build it again");
}
const [[KELAS_A, COHORT, PERIOD]] = rows(`select id, parent_id, academic_period_id from public.org_nodes where institution_id = ${uuid(I)} and kind = 'CLASS' and name = '5A'`);
const [[PROGRAMME]] = rows(`select e.programme_id from public.enrollments e where e.institution_id = ${uuid(I)} limit 1`);
const ROOT = sql(`select id from public.org_nodes where institution_id = ${uuid(I)} and kind = 'INSTITUTION'`);
const FAKULTAS = sql(`select id from public.org_nodes where institution_id = ${uuid(I)} and kind = 'FACULTY'`);
const DEPT = sql(`select id from public.org_nodes where institution_id = ${uuid(I)} and kind = 'DEPARTMENT'`);
[KELAS_A, COHORT, PERIOD, PROGRAMME, ROOT, FAKULTAS, DEPT].forEach(uuid);

// ── accounts: through Auth's admin API, as an operator would create them; a password each, kept only in OUT
async function akun(email, nama) {
  const password = `Lokal-${randomBytes(9).toString("base64url")}-9!`;
  const r = await fetch(`${SB}/auth/v1/admin/users`, { method: "POST",
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true }) });
  const j = await r.json();
  if (!r.ok || !j.id) throw new Error(`Auth refused ${email}: ${r.status} ${JSON.stringify(j).slice(0, 160)}`);
  const person = sql(`select person_id from public.accounts where auth_user_id = ${uuid(j.id)}`);
  uuid(person);
  sql(`update public.persons set display_name = ${lit(nama)} where id = ${uuid(person)}`);
  setelan(person);
  return { email, password, person, uid: j.id, nama };
}
// activated as supabase/seed/activated_staff.sql activates the seed's accounts: a username, a PIN, setup COMPLETE
const setelan = (person) => sql(`do $$ declare v_user text := 'lap.' || substr(md5('${person}'), 1, 10); begin
    insert into public.person_usernames (person_id, username) values ('${person}', v_user) on conflict do nothing;
    insert into public.person_pins (person_id, pin_hash) values ('${person}', extensions.crypt('2817', extensions.gen_salt('bf', 6))) on conflict do nothing;
    update public.account_setup set state = 'COMPLETE', completed_at = now(), password_set_at = now(), name_confirmed_at = now()
     where account_id in (select a.id from public.accounts a where a.person_id = '${person}');
  end $$`);
async function token(p) {
  const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, { method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" }, body: JSON.stringify({ email: p.email, password: p.password }) });
  const j = await r.json();
  if (!j.access_token) throw new Error(`no session for ${p.email}: ${r.status}`);
  return j.access_token;
}
async function rpc(tok, fn, args) {
  const r = await fetch(`${SB}/rest/v1/rpc/${fn}`, { method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: JSON.stringify(args) });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${fn}: HTTP ${r.status} ${JSON.stringify(body).slice(0, 200)}`);
  return body;
}
const peran = (person, role, node) => sql(`select set_config('app.seed_intent', 'synthetic', false);
  insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
  values (${uuid(person)}, '${role}', ${uuid(node)}, now() - interval '1 day', now() + interval '365 days')`);

// ── 1. the classes
const RENCANA = [
  { nama: "5B", murid: 24, keduanya: 22, hanyaAwal: 1, mampu: [0.35, 0.95] },
  { nama: "5C", murid: 12, keduanya: 7, hanyaAwal: 0, mampu: [0.25, 0.75] },
  { nama: "5D", murid: 4, keduanya: 4, hanyaAwal: 0, mampu: [0.4, 0.9] },
  { nama: "5E", murid: 9, keduanya: 0, hanyaAwal: 0, mampu: [0.5, 0.8] },
];
for (const k of RENCANA) {
  k.id = sql(`insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (${uuid(I)}, ${uuid(COHORT)}, 'CLASS', ${lit(k.nama)}, ${uuid(PERIOD)}) returning id`);
}

// ── 2. the staff
const STAF = {
  admin: await akun("lap-admin@laporan.local.invalid", "Bu Wulan (uji laporan)"),
  guru: await akun("lap-guru@laporan.local.invalid", "Pak Yusuf (uji laporan)"),
  kadep: await akun("lap-kadep@laporan.local.invalid", "Bu Fitri (uji laporan)"),
  dekan: await akun("lap-dekan@laporan.local.invalid", "Pak Bambang (uji laporan)"),
};
peran(STAF.admin.person, "INSTITUTION_ADMIN", ROOT);
peran(STAF.guru.person, "EDUCATOR", RENCANA[0].id);
peran(STAF.guru.person, "EDUCATOR", RENCANA[1].id);
peran(STAF.kadep.person, "HEAD_OF_DEPARTMENT", DEPT);
peran(STAF.dekan.person, "DEAN", FAKULTAS);

// ── 3. the learners, recorded in the school and placed in their class
const DEPAN = ["Adi", "Bunga", "Citra", "Dimas", "Eka", "Fajar", "Gita", "Hana", "Indra", "Joko", "Kirana", "Lestari", "Maya",
  "Nanda", "Oki", "Putri", "Rizki", "Sari", "Tono", "Umi", "Vina", "Wahyu", "Yogi", "Zahra"];
const BELAKANG = ["Pratama", "Santoso", "Wibowo", "Lestari", "Hidayat", "Saputra", "Rahayu", "Kurniawan", "Utami", "Nugroho"];
const MURID = [];
for (const k of RENCANA) {
  for (let i = 0; i < k.murid; i++) {
    const nama = `${DEPAN[(i + k.nama.charCodeAt(1)) % DEPAN.length]} ${BELAKANG[(i * 3 + k.nama.charCodeAt(1)) % BELAKANG.length]} (${k.nama})`;
    const m = await akun(`lap-${k.nama.toLowerCase()}-${String(i + 1).padStart(2, "0")}@laporan.local.invalid`, nama);
    const e = sql(`insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
      values (${uuid(m.person)}, ${uuid(I)}, ${uuid(PERIOD)}, ${uuid(PROGRAMME)}, 'ACTIVE') returning id`);
    sql(`insert into public.memberships (enrollment_id, node_id, academic_period_id) values (${uuid(e)}, ${uuid(k.id)}, ${uuid(PERIOD)})`);
    m.kelas = k.nama;
    m.peran = i < k.keduanya ? "KEDUANYA" : i < k.keduanya + k.hanyaAwal ? "AWAL" : "TIDAK";
    m.mampu = k.mampu[0] + (k.mampu[1] - k.mampu[0]) * acak();
    MURID.push(m);
  }
}

// ── 3c. owner decision 1, end to end (Daisy and the owner, 9 Nov): one learner with an account AND the school's
// registration number (issued by the admin through issue_institutional_id, as a Pendataan row with no place leaves
// them), placed in no class: the admin's Pindah lists them, and their /belajar says an administrator places them
const TANPA_KELAS = await akun("lap-tanpa-kelas@laporan.local.invalid", "Putri Tanpa Kelas (uji)");
// the school's three-character code, as Pendataan «Kode sekolah» reserves it (reserve_institution_namespace)
if (sql(`select coalesce(namespace, '') from public.institutions where id = ${uuid(I)}`) === "") {
  await rpc(await token(STAF.admin), "reserve_institution_namespace", { p_institution: I, p_namespace: "SDC" });
}
// the intake calls issue_institutional_id itself (it is not a client RPC); as a fixture it is called as fable34 calls it
sql(`select public.issue_institutional_id(${uuid(TANPA_KELAS.person)}, ${uuid(I)})`);

// ── 4. two chapters, authored and published through Studio's own operations, each with both tests
// (the demonstration chapter has no Pemetaan Awal and is frozen, so no Kenaikan could be read from it; INV-04 keeps
// it as it is). The repository's synthetic packages (audit/fixtures/sd5-sintetis-bab{1,2}.paket.json), by the
// admin as author; the Kepala departemen reviews, approves and locks; the admin makes the release and publishes it.
const tAdmin = await token(STAF.admin);
const tKadep = await token(STAF.kadep);
const BAB = [];
for (const f of ["sd5-sintetis-bab1", "sd5-sintetis-bab2"]) {
  const paket = JSON.parse(readFileSync(new URL(`./${f}.paket.json`, import.meta.url), "utf8"));
  const r = await fetch(`${SB}/rest/v1/ingest_batches`, { method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${tAdmin}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ institution_id: I, source_kind: "STRUCTURED_PACKAGE", raw_payload: paket }) });
  const [batch] = await r.json();
  if (!batch?.id) throw new Error(`the batch was refused: ${r.status}`);
  await rpc(tAdmin, "prepare_ingest_batch", { p_batch: batch.id });
  const hasil = await rpc(tAdmin, "confirm_ingest_batch", { p_batch: batch.id });
  const course = hasil?.courses?.[0];
  uuid(course);
  for (const ke of ["STRUCTURED"]) await rpc(tAdmin, "langkah_konten", { p_course: course, p_ke: ke });
  await rpc(tAdmin, "validate_course_content", { p_course: course });
  await rpc(tAdmin, "run_mcq_quality", { p_course: course });
  await rpc(tAdmin, "langkah_konten", { p_course: course, p_ke: "VALIDATED" });
  await rpc(tAdmin, "langkah_konten", { p_course: course, p_ke: "IN_REVIEW" });
  // the reviewer reads and acknowledges each advisory finding (an ERROR cannot be, and would stop here)
  for (const [kind, id] of rows(`select 'MCQ_QUALITY', id from public.mcq_quality_findings where course_id = ${uuid(course)} and acknowledged_at is null
      union all select 'COACHING', id from public.coaching_findings where course_id = ${uuid(course)} and acknowledged_at is null`)) {
    await rpc(tKadep, "acknowledge_finding", { p_kind: kind, p_finding: id, p_note: "Dibaca; tidak menghalangi." });
  }
  await rpc(tKadep, "langkah_konten", { p_course: course, p_ke: "APPROVED" });
  const rel = (await rpc(tAdmin, "create_release", { p_course: course }))?.release;
  uuid(rel);
  await rpc(tKadep, "freeze_release", { p_release: rel });
  await rpc(tAdmin, "publish_release", { p_release: rel });
  // the school's pass mark for the chapter, as Konfigurasi «Batas ketuntasan» sets it (70%)
  await rpc(tAdmin, "set_school_pass_mark", { p_institution: I, p_course: course, p_percent: 70, p_reason: "Batas sekolah untuk bab ini." });
  BAB.push({ f, course, rel });
}

// ── 5. the chapters given to the classes by the school's admin, as Konfigurasi does (5B both chapters; the others
// the first), each window open now
for (const k of RENCANA) {
  k.tugas = [];
  for (const b of k.nama === "5B" ? BAB : BAB.slice(0, 1)) {
    await rpc(tAdmin, "assign_release", { p_release: b.rel, p_node: k.id, p_from: new Date(Date.now() - 86400000).toISOString(),
      p_until: new Date(Date.now() + 30 * 86400000).toISOString() });
    const t = { course: b.course };
    for (const [mode, id] of rows(`select d.mode, aa.id from public.assessment_assignments aa
        join public.assessment_definitions d on d.id = aa.assessment_definition_id
        join public.learning_assignments la on la.id = aa.learning_assignment_id
       where aa.node_id = ${uuid(k.id)} and la.plp_release_id = ${uuid(b.rel)}`)) t[mode] = id;
    uuid(t.PRE_TEST); uuid(t.POST_TEST);
    k.tugas.push(t);
  }
}

// ── 6. the sittings, each through the learner's own RPCs
const KUNCI = new Map(); // item_id -> { right: Set(text), tujuan }
for (const b of BAB) {
  for (const [item, body, ok, tujuan] of rows(`select o.item_id, regexp_replace(o.body, '\\s+', ' ', 'g'), o.is_correct,
      coalesce((select string_agg(lo.code, ',') from public.learning_objectives lo where lo.id = any(i.objective_ids)), '')
      from public.item_options o join public.items i on i.id = o.item_id join public.lessons l on l.id = i.lesson_id
      join public.modules md on md.id = l.module_id where md.course_id = ${uuid(b.course)}`)) {
    const k = KUNCI.get(item) ?? { right: new Set(), tujuan };
    if (ok === "t") k.right.add(norm(body));
    KUNCI.set(item, k);
  }
}
// one objective of each chapter is harder for everyone: a topic to investigate, by design of the data
const TUJUAN = [...new Set([...KUNCI.values()].map((k) => k.tujuan))].sort();
const sulit = new Set(TUJUAN.filter((_, i) => i % 2 === 1));
const kesulitan = (tujuan) => (sulit.has(tujuan) ? -0.2 : 0.05);
async function duduk(m, tok, aa, tambah) {
  const sid = await rpc(tok, "start_learning_session", { p_assessment_assignment: aa });
  const paper = await rpc(tok, "session_paper", { p_session: sid });
  const r = await fetch(`${SB}/rest/v1/presented_items?session_id=eq.${sid}&select=id,item_id`, { headers: { apikey: ANON, Authorization: `Bearer ${tok}` } });
  const itemOf = new Map((await r.json()).map((p) => [p.id, p.item_id]));
  const manifest = {};
  for (const q of paper) {
    const k = KUNCI.get(itemOf.get(q.presented_item_id));
    const opsi = q.muatan?.opsi ?? [];
    const benar = opsi.filter((o) => k?.right.has(norm(o.teks))).map((o) => o.posisi);
    const salah = opsi.filter((o) => !k?.right.has(norm(o.teks))).map((o) => o.posisi);
    const p = Math.min(0.97, Math.max(0.03, m.mampu + tambah + kesulitan(k?.tujuan ?? "")));
    const posisi = (acak() < p && benar.length) || !salah.length ? benar[0] : salah[Math.floor(acak() * salah.length)];
    await rpc(tok, "record_answer", { p_presented_item: q.presented_item_id, p_client_seq: 1, p_jawaban: { posisi },
      p_client_asserted_at: null, p_receipt_mode: "LIVE" });
    manifest[q.presented_item_id] = 1;
  }
  await rpc(tok, "finish_my_session", { p_session: sid, p_manifest: manifest });
}
let sat = 0;
for (const m of MURID.filter((x) => x.peran !== "TIDAK")) {
  const k = RENCANA.find((x) => x.nama === m.kelas);
  const tok = await token(m);
  for (const [j, t] of k.tugas.entries()) {
    // the second chapter is still under way: only two thirds of 5B have reached its Uji Penguasaan
    if (j === 1 && acak() > 0.67) { await duduk(m, tok, t.PRE_TEST, -0.3); sat++; continue; }
    await duduk(m, tok, t.PRE_TEST, -0.3);
    sat++;
    if (m.peran === "KEDUANYA") { await duduk(m, tok, t.POST_TEST, 0); sat++; }
  }
}

// ── 7. what was recorded (read back, for the report's own figures to be checked against)
const ringkas = rows(`select n.name, d.mode, count(*), round(avg(r.mastery), 3), min(r.mastery), max(r.mastery)
  from public.official_sessions s join public.official_results r on r.session_id = s.id
  join public.org_nodes n on n.id = s.class_node_id join public.assessment_definitions d on d.id = s.assessment_definition_id
 where s.institution_id = ${uuid(I)} and n.name in ('5B','5C','5D','5E') group by 1, 2 order by 1, 2`);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ sekolah: I, kelas: Object.fromEntries(RENCANA.map((k) => [k.nama, k.id])), staf: STAF, tanpaKelas: TANPA_KELAS,
  murid: MURID.map((m) => ({ email: m.email, password: m.password, nama: m.nama, kelas: m.kelas, peran: m.peran })), ringkas }, null, 2));
console.log(`built: ${RENCANA.length} classes, ${MURID.length} learners, ${sat} sittings; official results by class and mode:`);
for (const r of ringkas) console.log(`  ${r.join("  ")}`);
