/**
 * A2a change B · THE SCALE JOB for scenario 8 (THE PLAN §5.3 H; A2a page §7, "the scale job: its four limits").
 *
 * One run, on the runner's own local stack, on A2a's frozen product commit. It measures only what the page names, and
 * fails only where the plan sets a threshold:
 *   the owner's four measurements:
 *     1. R1's skip count: 50,000 affected sittings and one unaffected overdue sitting; the unaffected one is ended on
 *        the first scheduler run (THRESHOLD), and the skipped count is reported;
 *     2. R2: activation takes effect within 5 s at the 95th percentile, with the closer running (THRESHOLD); the queue
 *        delay on other sitting operations is recorded with it;
 *     3. the activation's and the lift's work under the fence, ≤ 0.5 s each (THRESHOLD);
 *     4. the shared takers refused while the fence waits, counted, and (Sharon's P1) the lifts refused, counted;
 *   and scenario 8's three numbers (C18-1): the lift ≤ 0.5 s with no batch run before it (the same threshold as 3);
 *   the release batch's credit throughput; D1's pending-credit read, per call.
 *
 * How each is taken:
 *   - Every act is the product's own function, called as its caller calls it (the activation and the lift as an Admin
 *     PINTAR; the closer as the job's database user, `call pengerjaan_tutup_berkala`). Nothing of the product is changed.
 *   - A statement's time is psql's own `\timing` for that statement, on a connection of its own: the fence wait, the
 *     work and the commit, without the connection's start. Uncontended, it is the work under the fence plus the little
 *     before it: an upper bound of 3.
 *   - pg_cron's own job is paused for the run, so that no batch runs where the scenario says none has; the closer is
 *     then run by this script where the scenario runs it.
 *   - The fixture is synthetic, on the local stack only. It reads no secret.
 *
 * Usage: SUPABASE_DB_URL=… npx tsx selftest/a2a-skala.ts   (A2A_SKALA_N, A2A_SKALA_SIKLUS: smaller for development)
 */
import { spawn, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tidur } from "./balapan";

const DB = process.env.SUPABASE_DB_URL ?? "";
const N = Number(process.env.A2A_SKALA_N ?? 50000);
const SIKLUS = Number(process.env.A2A_SKALA_SIKLUS ?? 20);
const PENGAMBIL = 8;   // the shared takers: protected decisions on unaffected sittings, in a loop each
const PRODUK = "c04c088ea65f7eff32c07aadf0a91b16e098e3ed";
const W_ALASAN = "A2a change B · scenario 8";

type Hasil = { ok: boolean; out: string; err: string; ms: number };

/** psql on a connection of its own; `ms` is the last statement's own time (psql's \timing). */
function psqlT(sql: string, sub?: string): Promise<Hasil> {
  const awal = sub ? `select set_config('request.jwt.claims', '{"sub":"${sub}","role":"authenticated"}', false);\n` : "";
  return new Promise((selesai) => {
    const p = spawn("psql", ["-X", "-q", "-At", "-v", "ON_ERROR_STOP=1", DB], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", (b) => { out += b; });
    p.stderr.on("data", (b) => { err += b; });
    p.on("close", (code) => {
      const kali = [...out.matchAll(/^Time: ([0-9.]+) ms/gm)].map((m) => Number(m[1]));
      const isi = out.split("\n").filter((l) => l && !/^Time: /.test(l));
      selesai({ ok: code === 0, out: isi.join("\n").trim(), err: err.trim().split("\n").filter((l) => /ERROR|DETAIL|WARNING/.test(l)).join(" | "), ms: kali.length ? kali[kali.length - 1] : NaN });
    });
    p.stdin.end(`${awal}\\timing on\n${sql}\n`);
  });
}
function psql(sql: string): string {
  const r = spawnSync("psql", ["-X", "-q", "-At", "-v", "ON_ERROR_STOP=1", DB], { encoding: "utf8", input: sql });
  if (r.status !== 0) throw new Error(`psql: ${(r.stderr ?? "").trim()}`);
  return (r.stdout ?? "").trim();
}
const p95 = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.ceil(0.95 * s.length) - 1)] : NaN; };
const p50 = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : NaN; };
const bulat = (x: number) => Math.round(x * 10) / 10;

async function main() {
  if (!DB) throw new Error("SUPABASE_DB_URL is not set");
  // the two commits the evidence names: the tooling's, and the product's, byte-identical where the product lives
  const alat = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim();
  const sama = spawnSync("git", ["diff", "--quiet", PRODUK, "HEAD", "--", "supabase", "src"]).status === 0;
  if (!sama) throw new Error(`the product (supabase/, src/) differs from the frozen commit ${PRODUK}: this would measure another product`);
  console.log(`tooling commit ${alat}\nproduct commit ${PRODUK} (supabase/ and src/ identical)\nsittings ${N}, cycles ${SIKLUS}, shared takers ${PENGAMBIL}`);

  // ── the fixture (committed; synthetic; the local stack only) ──────────────────────────────────────────────────
  const cron = psql(`select coalesce(string_agg(jobid::text, ','), '') from cron.job where command ilike '%pengerjaan_tutup_berkala%';`);
  for (const j of cron.split(",").filter(Boolean)) psql(`select cron.alter_job(${j}, active := false);`);
  const [kelas, inst] = psql(`select m.node_id || '|' || n.institution_id from public.memberships m
      join public.enrollments e on e.id = m.enrollment_id and e.status = 'ACTIVE' and e.valid_to is null
      join public.org_nodes n on n.id = m.node_id and n.kind = 'CLASS'
     where m.valid_to is null group by m.node_id, n.institution_id order by count(*) desc, m.node_id limit 1;`).split("|");
  const sys = psql(`select a.auth_user_id from public.role_assignments r join public.accounts a on a.person_id = r.person_id
     where r.role = 'SYSTEM_ADMIN' and r.revoked_at is null order by r.id limit 1;`);
  // the unaffected learner: active, in no membership of the class and with no role over it
  const luar = psql(`select e.person_id || '|' || e.id from public.enrollments e
     where e.status = 'ACTIVE' and e.valid_to is null
       and not exists (select 1 from public.memberships m where m.enrollment_id = e.id and m.node_id = '${kelas}')
       and not exists (select 1 from public.enrollments e2 join public.memberships m2 on m2.enrollment_id = e2.id
                        where e2.person_id = e.person_id and m2.node_id = '${kelas}')
       and not exists (select 1 from public.role_assignments r where r.person_id = e.person_id and r.revoked_at is null)
     order by e.id limit 1;`).split("|");
  if (!kelas || !sys || !luar[1]) throw new Error("the seed has no class with learners, no Admin PINTAR, or no learner outside the class");
  psql(`begin;
set local session_replication_role = replica;
create temp table src as select s.* from public.assessment_sessions s where s.status = 'FINALIZED' order by s.id limit 1;
create temp table murid as select row_number() over (order by e.person_id) - 1 as i, e.person_id, e.id as enr
  from public.memberships m join public.enrollments e on e.id = m.enrollment_id and e.status = 'ACTIVE' and e.valid_to is null
 where m.node_id = '${kelas}' and m.valid_to is null;
-- the 50,000 affected sittings: open, their own deadline an hour on, made before the stop
insert into public.assessment_sessions
select (jsonb_populate_record(src, jsonb_build_object('id', gen_random_uuid(), 'status', 'IN_PROGRESS',
  'person_id', mu.person_id, 'enrollment_id', mu.enr, 'institution_id', '${inst}', 'class_node_id', '${kelas}', 'cohort_node_id', null,
  'authoritative_deadline', now() + interval '60 minutes', 'created_at', now() - interval '10 minutes', 'started_at', now() - interval '10 minutes',
  'finalized_at', null, 'submitted_at', null, 'closure_kind', null, 'closure_at', null, 'closure_deadline', null,
  'frozen_at', null, 'unfrozen_at', null, 'termination_cause', null, 'darurat_sejak', null, 'darurat_jendela_id', null,
  'darurat_dikredit_sampai', null, 'darurat_keluar', null, 'attempt_request_id', null))).*
  from src, generate_series(0, ${N} - 1) g join murid mu on mu.i = g % (select count(*) from murid);
-- the unaffected learner's sittings: U0 overdue (R1), U1..U8 open (the shared takers' decisions)
insert into public.assessment_sessions
select (jsonb_populate_record(src, jsonb_build_object('id', ('a2a1b000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid, 'status', 'IN_PROGRESS',
  'person_id', '${luar[0]}', 'enrollment_id', '${luar[1]}', 'cohort_node_id', null,
  'authoritative_deadline', case when g = 0 then now() - interval '10 minutes' else now() + interval '3 hours' end,
  'created_at', now() - interval '20 minutes', 'started_at', now() - interval '20 minutes',
  'finalized_at', null, 'submitted_at', null, 'closure_kind', null, 'closure_at', null, 'closure_deadline', null,
  'frozen_at', null, 'unfrozen_at', null, 'termination_cause', null, 'darurat_sejak', null, 'darurat_jendela_id', null,
  'darurat_dikredit_sampai', null, 'darurat_keluar', null, 'attempt_request_id', null))).*
  from src, generate_series(0, ${PENGAMBIL}) g;
commit;
analyze public.assessment_sessions;`);
  const U = (g: number) => `a2a1b000-0000-4000-8000-${String(g).padStart(12, "0")}`;
  const kena = Number(psql(`select count(*) from public.assessment_sessions where class_node_id = '${kelas}' and status = 'IN_PROGRESS';`));
  console.log(`fixture: class ${kelas}, ${kena} open sittings of its learners; the unaffected learner's 1 overdue and ${PENGAMBIL} open sittings`);

  const henti = () => psqlT(`select public.stop_pintar_now(false, array['${inst}'::uuid], '${W_ALASAN}', 'HENTIKAN SEKARANG', array['${kelas}'::uuid]);`, sys);
  const angkat = (w: string) => psqlT(`select public.change_maintenance('${w}', 'AKHIRI', '${W_ALASAN}') ->> 'state';`, sys);
  const hasil: Record<string, unknown> = { tooling_commit: alat, product_commit: PRODUK, sittings: kena, cycles: SIKLUS, shared_takers: PENGAMBIL };

  // ── 3 and scenario 8: the activation and the lift, uncontended, with no batch run before the lift ──────────────
  const a1 = await henti();
  if (!a1.ok) throw new Error(`the activation failed: ${a1.err}`);
  const w1 = a1.out.split("\n").pop()!;
  const l1 = await angkat(w1);
  if (!l1.ok) throw new Error(`the lift failed: ${l1.err}`);
  const ditandai = Number(psql(`select count(*) from public.assessment_sessions where darurat_jendela_id is not null;`));
  // D1: the pending-credit read, on 1,000 affected sittings with the lifted stop pending
  const d1 = await psqlT(`select count(public.pengerjaan_tenggat_efektif(id)) from (select id from public.assessment_sessions
     where class_node_id = '${kelas}' and status = 'IN_PROGRESS' and darurat_dikredit_sampai is null order by id limit 1000) x;`);
  // the release batch: the credit of every affected sitting, in its committed batches, no fence
  const lepas = await psqlT(`call public.pengerjaan_lepas_darurat_semua(200);`);
  const dikredit = Number(psql(`select count(*) from public.assessment_sessions where class_node_id = '${kelas}' and darurat_dikredit_sampai is not null;`));
  hasil.activation_uncontended_ms = bulat(a1.ms);
  hasil.lift_no_batch_ms = bulat(l1.ms);
  hasil.marked_before_lift = ditandai;
  hasil.d1_read_ms_per_call = bulat(d1.ms / 1000 * 1000) / 1000;
  hasil.release_batch = { ms: bulat(lepas.ms), credited: dikredit, per_second: Math.round(dikredit / (lepas.ms / 1000)) };

  // ── 1. R1: a stop in force over the 50,000; the first scheduler run ───────────────────────────────────────────
  const a2 = await henti();
  if (!a2.ok) throw new Error(`the second activation failed: ${a2.err}`);
  const w2 = a2.out.split("\n").pop()!;
  const calon = psql(`select coalesce(string_agg(x::text, ','), '') from public.pengerjaan_tutup_calon(500) x;`).split(",").filter(Boolean);
  const calonKena = calon.length ? Number(psql(`select count(*) from public.assessment_sessions where id in (${calon.map((x) => `'${x}'`).join(",")}) and class_node_id = '${kelas}';`)) : 0;
  const jalan = await psqlT(`call public.pengerjaan_tutup_berkala(500, 20);`);
  const selesai = calon.length ? Number(psql(`select count(*) from public.assessment_sessions where id in (${calon.map((x) => `'${x}'`).join(",")}) and status not in ('CREATED', 'IN_PROGRESS', 'PAUSED');`)) : 0;
  const u0 = psql(`select status from public.assessment_sessions where id = '${U(0)}';`);
  const gagalR1 = (jalan.err.match(/could not be closed/) ? Number((/: (\d+) of/.exec(jalan.err) ?? [])[1] ?? 0) : 0);
  const l2 = await angkat(w2);
  hasil.r1 = { candidates: calon.length, affected_among_candidates: calonKena, ended: selesai, skipped: calon.length - selesai, failed_in_run: gagalR1,
    unaffected_overdue_status_after_first_run: u0, run_ms: bulat(jalan.ms) };
  hasil.activation_uncontended_2_ms = bulat(a2.ms);
  hasil.lift_2_ms = l2.ok ? bulat(l2.ms) : `refused: ${l2.err}`;

  // ── 2 and 4: R2 with the closer running and the shared takers' load ───────────────────────────────────────────
  let jalanTerus = true;
  type Catat = { t: number; ms: number; ok: boolean; sibuk: boolean };
  const catatan: Catat[] = [];
  const pengambil = Array.from({ length: PENGAMBIL }, (_, i) => (async () => {
    while (jalanTerus) {
      const t = Date.now();
      const r = await psqlT(`select public.pengerjaan_putus_tenggat('${U(i + 1)}', false);`);
      catatan.push({ t, ms: r.ms, ok: r.ok, sibuk: /SITTING_FENCE_BUSY/.test(r.err) });
      await tidur(50);
    }
  })());
  const penutup = (async () => { let n = 0; while (jalanTerus) { await psqlT(`call public.pengerjaan_tutup_berkala(500, 20);`); n++; await tidur(1000); } return n; })();
  await tidur(5000);   // the baseline: the shared takers and the closer, no stop
  const dasar = catatan.filter((c) => c.ok).map((c) => c.ms);
  const aktif: number[] = [], angkatMs: number[] = [];
  let aktifDitolak = 0, angkatDitolak = 0;
  const jendela: Array<[number, number]> = [];
  for (let k = 0; k < SIKLUS; k++) {
    const t0 = Date.now();
    const a = await henti();
    jendela.push([t0, Date.now()]);
    if (!a.ok) { aktifDitolak++; await tidur(1500); continue; }
    aktif.push(a.ms);
    await tidur(1500);
    const w = a.out.split("\n").pop()!;
    let l = await angkat(w);
    const t1 = Date.now();
    jendela.push([t1 - l.ms, t1]);
    // a refused lift leaves the stop in force (D6.8): the admin retries; ten refusals in a row end the run
    for (let coba = 0; !l.ok && coba < 10; coba++) { angkatDitolak++; await tidur(500); l = await angkat(w); }
    if (!l.ok) throw new Error(`a lift was refused eleven times: ${l.err}`);
    angkatMs.push(l.ms);
    await tidur(1500);
  }
  jalanTerus = false;
  await Promise.all(pengambil);
  const putaran = await penutup;
  const semasa = catatan.filter((c) => jendela.some(([a, b]) => c.t + (c.ms || 0) >= a && c.t <= b));
  hasil.r2 = { activations: aktif.length, refused_activations: aktifDitolak, p50_ms: bulat(p50(aktif)), p95_ms: bulat(p95(aktif)), max_ms: bulat(Math.max(...aktif)),
    lifts: angkatMs.length, lift_p95_ms: bulat(p95(angkatMs)), closer_runs_during: putaran };
  hasil.queue_delay = { baseline_p95_ms: bulat(p95(dasar)), during_stop_or_lift_p95_ms: bulat(p95(semasa.filter((c) => c.ok).map((c) => c.ms))),
    during_max_ms: bulat(Math.max(0, ...semasa.filter((c) => c.ok).map((c) => c.ms))) };
  hasil.refused = { shared_takers_total_calls: catatan.length, shared_takers_refused_fence_busy: catatan.filter((c) => c.sibuk).length,
    shared_takers_refused_while_fence_taken: semasa.filter((c) => c.sibuk).length, shared_takers_other_failures: catatan.filter((c) => !c.ok && !c.sibuk).length,
    lifts_refused: angkatDitolak, activations_refused: aktifDitolak };
  for (const j of cron.split(",").filter(Boolean)) psql(`select cron.alter_job(${j}, active := true);`);

  // ── the gates: only the plan's thresholds ──────────────────────────────────────────────────────────────────────
  const r1 = hasil.r1 as { unaffected_overdue_status_after_first_run: string };
  const gerbang: Array<[string, boolean]> = [
    ["3 · the activation's work under the fence ≤ 0.5 s (uncontended, both samples)", a1.ms <= 500 && a2.ms <= 500],
    ["3 · scenario 8 · the lift's work under the fence ≤ 0.5 s, no batch run before it", l1.ms <= 500 && ditandai === 0],
    ["1 · R1 · the unaffected overdue sitting ended on the first scheduler run", !["CREATED", "IN_PROGRESS", "PAUSED"].includes(r1.unaffected_overdue_status_after_first_run)],
    ["2 · R2 · activation takes effect within 5 s at p95, the closer running", aktif.length > 0 && p95(aktif) <= 5000],
  ];
  hasil.gates = Object.fromEntries(gerbang.map(([k, v]) => [k, v ? "PASS" : "FAIL"]));
  writeFileSync("a2a-skala-hasil.json", JSON.stringify(hasil, null, 2) + "\n");
  console.log(JSON.stringify(hasil, null, 2));
  const gagal = gerbang.filter(([, v]) => !v);
  if (gagal.length) { console.error(`FAILED: ${gagal.map(([k]) => k).join("; ")}`); process.exit(1); }
  console.log("all thresholds held");
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
