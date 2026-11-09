// LOCAL ONLY. System Integrity Gate, chain D (identity → role → working context → action → database enforcement):
// every person of the report world (audit/fixtures/laporan-lokal.mjs) calls the product's own functions and reads
// its tables directly, signed in as themselves, with no screen in between. What the database answers is recorded per
// person and call, beside what the role contract expects. A call the database allows where the contract refuses it is
// a FAIL; so is a refusal where the contract allows. Mutating calls are made only by people the contract refuses, so
// a passing run changes nothing; a failing one shows the defect in the world, which is disposable.
//   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_DB_URL, WORLD (the fixture's file, never committed)
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const SB = env("NEXT_PUBLIC_SUPABASE_URL");
const ANON = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const DB = env("SUPABASE_DB_URL");
const W = JSON.parse(readFileSync(env("WORLD"), "utf8"));
if (!/127\.0\.0\.1|localhost/.test(SB + DB)) throw new Error("local stack only");
const require = createRequire(join(process.cwd(), "package.json"));
const { createClient } = require("@supabase/supabase-js");
const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1", "-c", q], { encoding: "utf8" }).trim();

const I = W.sekolah, K = W.kelas;
const pid = (email) => sql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = '${email}'`);
const m5B = W.murid.find((m) => m.kelas === "5B"), m5D = W.murid.find((m) => m.kelas === "5D");
const LP = pid(m5B.email), LD = pid(m5D.email);
const COURSE = sql(`select c.id from public.assessment_sessions s join public.plp_releases r on r.id = s.plp_release_id
  join public.courses c on c.id = r.course_id where s.class_node_id = '${K["5B"]}' limit 1`);
const CERT = sql(`select id from public.certificates where person_id = '${LP}' limit 1`) || "00000000-0000-0000-0000-000000000000";
const MURID5D = sql(`select string_agg(distinct e.person_id::text, ',') from public.memberships m join public.enrollments e on e.id = m.enrollment_id where m.node_id = '${K["5D"]}'`).split(",").filter(Boolean);
const SES5D = sql(`select string_agg(id::text, ',') from public.assessment_sessions where class_node_id = '${K["5D"]}'`).split(",").filter(Boolean);

const SES5D_LAIN = (aku) => sql(`select coalesce(string_agg(id::text, ','), '') from public.assessment_sessions where class_node_id = '${K["5D"]}' and person_id <> '${aku}'`).split(",").filter(Boolean);
// each call: what it does, how it is made, and who the role contract lets through ("*" = the learner's own row only)
const PANGGIL = [
  { id: "R01", apa: "the class's learners needing support, own class (5B)", f: (c) => c.rpc("murid_perlu_penguatan", { p_class: K["5B"] }), boleh: ["guru", "kadep", "dekan", "admin"] },
  { id: "R02", apa: "the same, a class the Guru does not teach (5D)", f: (c) => c.rpc("murid_perlu_penguatan", { p_class: K["5D"] }), boleh: ["kadep", "dekan", "admin"] },
  { id: "R03", apa: "the class's spread (5D)", f: (c) => c.rpc("sebaran_murid_kelas", { p_class: K["5D"] }), boleh: ["kadep", "dekan", "admin"] },
  { id: "R04", apa: "a learner's unmet objectives (5B)", f: (c) => c.rpc("tujuan_belum_tercapai", { p_class: K["5B"], p_learner: LP }), boleh: ["guru", "kadep", "dekan", "admin"] },
  { id: "R05", apa: "a learner's record for leadership", f: (c) => c.rpc("management_learner_detail", { p_person: LP, p_institution: I }), boleh: ["kadep", "dekan"] },
  { id: "R06", apa: "learners without a class", f: (c) => c.rpc("murid_tanpa_kelas", { p_sekolah: I }), boleh: ["admin"] },
  { id: "R07", apa: "incoming transfers", f: (c) => c.rpc("pindah_masuk", { p_sekolah: I }), boleh: ["admin"] },
  { id: "R08", apa: "the school's people", f: (c) => c.rpc("school_people_page", { p_institutions: [I] }), boleh: ["admin"] },
  { id: "R09", apa: "integrity observations awaiting review", f: (c) => c.rpc("integrity_signals_awaiting_review"), boleh: ["kadep", "dekan", "admin"] },
  // a learner reads their own rows (person_id = themselves); the probe asks only about other people's
  { id: "T01", apa: "5D's results read from the table, other people's", f: (c, aku) => c.from("assessment_results").select("id").in("session_id", SES5D).neq("person_id", aku), boleh: ["kadep", "admin"] },
  { id: "T02", apa: "certificates read from the table", f: (c) => c.from("certificates").select("id, person_id"), boleh: ["*"], baris: true, milik: true },
  { id: "T03", apa: "5D's answers read from the table, other people's", f: (c, aku) => c.from("responses").select("id").in("session_id", SES5D_LAIN(aku)), boleh: ["kadep", "admin"] },
  { id: "T04", apa: "5D's questions as shown, other people's", f: (c, aku) => c.from("presented_items").select("id").in("session_id", SES5D_LAIN(aku)), boleh: ["kadep", "admin"] },
  { id: "T05", apa: "5D's integrity observations", f: (c, aku) => c.from("integrity_signals").select("id").in("session_id", SES5D_LAIN(aku)), boleh: ["kadep", "admin"] },
  { id: "T06", apa: "5D learners' lesson progress, other people's", f: (c, aku) => c.from("lesson_progress").select("id").in("person_id", MURID5D).neq("person_id", aku), boleh: ["kadep", "admin"] },
  // mutating: made only by those refused (a pass changes nothing)
  { id: "M01", apa: "grant a role", f: (c) => c.rpc("grant_role", { p_person: LP, p_role: "EDUCATOR", p_scope_node: K["5B"], p_valid_until: new Date(Date.now() + 864e5).toISOString() }), boleh: ["admin"], ubah: true },
  { id: "M02", apa: "correct a learner's name", f: (c) => c.rpc("correct_person_name", { p_person: LP, p_name: m5B.nama, p_reason: "probe integritas" }), boleh: ["admin"], ubah: true },
  { id: "M03", apa: "place a classless learner", f: (c) => c.rpc("tempatkan_murid", { p_person: W.tanpaKelas.person, p_kelas: K["5D"] }), boleh: ["admin"], ubah: true },
  { id: "M04", apa: "revoke a certificate", f: (c) => c.rpc("revoke_certificate", { p_certificate: CERT, p_reason: "probe integritas" }), boleh: ["admin"], ubah: true },
  { id: "M05", apa: "set the school's pass mark", f: (c) => c.rpc("set_school_pass_mark", { p_institution: I, p_course: COURSE, p_percent: 70, p_reason: "probe integritas" }), boleh: ["admin", "kadep"], ubah: true },
];

const ORANG = { murid: m5B, muridLain: m5D, guru: W.staf.guru, kadep: W.staf.kadep, kadepIpa: W.staf.kadepIpa, dekan: W.staf.dekan, admin: W.staf.admin };
let gagal = 0;
const baris = [];
for (const [siapa, o] of Object.entries(ORANG)) {
  const c = createClient(SB, ANON, { auth: { persistSession: false } });
  const { error: e } = await c.auth.signInWithPassword({ email: o.email, password: o.password });
  if (e) throw new Error(`${siapa}: ${e.message}`);
  const aku = pid(o.email);
  for (const p of PANGGIL) {
    const peran = siapa === "muridLain" ? "murid" : siapa;
    const boleh = p.boleh.includes(peran) || (peran === "kadepIpa" && false);
    if (p.ubah && boleh) continue;
    const { data, error } = await p.f(c, aku);
    const n = Array.isArray(data) ? data.length : data && typeof data === "object" ? Object.keys(data).length : data == null ? 0 : 1;
    let nyata;
    if (error) nyata = `refused ${error.code ?? ""}`.trim();
    else if (p.milik) nyata = (data ?? []).every((r) => r.person_id === aku) ? `own ${n}` : `FOREIGN ${(data ?? []).filter((r) => r.person_id !== aku).length}`;
    else nyata = n === 0 ? "empty" : `rows ${n}`;
    const dibuka = !error && !nyata.startsWith("empty") && !nyata.startsWith("own");
    // the contract: allowed → answered (an empty answer is allowed); refused → an error or nothing
    let ok;
    if (p.milik) ok = !nyata.startsWith("FOREIGN");
    else if (boleh) ok = !error;
    else ok = !dibuka;
    if (!ok) gagal++;
    baris.push([ok ? "PASS" : "FAIL", siapa, p.id, p.apa, boleh ? "allowed" : "refused", nyata]);
  }
  await c.auth.signOut();
}
for (const b of baris) console.log(b.join(" | "));
console.log(`${baris.length} calls, ${gagal} FAIL`);
process.exit(gagal ? 1 : 0);
