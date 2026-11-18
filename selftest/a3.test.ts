/**
 * A3 · RECOVERY, ONE WRITER PER SITTING: the red cases, written first (THE PLAN §5.5 G2; PLAN-A3-C3W-Z.md §2.5 A3-1;
 * docs/completion-4.1/C1-D125-INVESTIGATION.md §5). The seeded learning-cycle school with a learner of this suite's
 * own; real sittings through start_learning_session and record_answer. A "device" is a verified Auth session: the
 * session id inside the claims, which sesi_saya() reads (D2). Every scenario is one transaction, rolled back.
 *
 * These cases state BEHAVIOUR only. They name no refusal code, no column and no function A3 has yet to add: the codes
 * (D12) and the lock order wait for Sharon's pre-build review. A refusal is any error raised at the boundary.
 *
 *   A3-R01  two signed-in sessions of one learner (C1-D125 §5 cases 1, 2, 3): the sitting is started and answered on
 *           session A. Session B's answer to another question is refused; B's later, higher-sequence answer to A's
 *           question is refused and the final answer stays A's; B answering while A has paused is refused; B handing
 *           in A's sitting is refused; a caller with no verified session id is refused. Session A's own answer is
 *           accepted throughout (the control). Red on ac25e9b1: every one of B's writes lands, the higher sequence
 *           wins from either session, and a caller with no session id writes.
 *   A3-L1P  Sharon's L01 ruling (b) (16 Nov 22:54, a1b66843): learning_assignments and assessment_assignments stay
 *           unranked in A2A-L01; this pairwise check, read by A2A-L01's own reader with the two tables ranked for its
 *           own run only, requires that every function that locks both takes learning_assignments first (the order of
 *           «Akhiri», both moves and the start since A3-R1), so no start can hold an assessment assignment while it waits on
 *           a learning assignment. A plant that locks them the other way round is reported.
 *   A3-LN1  ruling 46's lineage (Sharon, 478c8750; replaces A3-R1V, whose claim was false for ad-hoc definitions): every
 *           definition has a NOT NULL, immutable lineage root that is a root of its own school; a new one is its own root.
 *   A3-LN2  the line check refuses a revision with two predecessors (the backfill's strictness).
 */
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { URUTAN, bacaUrutan, type Kunci } from "./a2a-l01.test";

function db(): string {
  return process.env.SUPABASE_DB_URL!;
}

/** The helpers the scenario stands on: role switches, the cycle fixture, a learner's answers, a learner of our own. */
function siapkan(repoRoot: string): string | null {
  for (const f of ["fable01.sql", "fable03.sql", "fable06.sql", "fable09.sql", "fable11.sql"]) {
    const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", f), db()], { encoding: "utf8" });
    if (r.status !== 0) return `selftest/db/${f} could not be loaded: ${(r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? ""}`;
  }
  return null;
}

const q = (s: string) => `$q$${s}$q$`;
/** One probe, kept as «ok:<value>» or «<SQLSTATE>:<DETAIL or the message's start>»: as the learner on session `sesi`
 * (A, B, or NONE for a verified token without a session id), run `sql`. */
const langkah = (k: string, sesi: "A" | "B" | "NONE", sql: string) => `v := v || jsonb_build_object('${k}', pg_temp.a3('${sesi}', ${q(sql)}));`;
/** The presented item at position `n` (1-based) of the sitting. */
const soal = (n: number) => `(select p.id from public.presented_items p where p.session_id = current_setting('a3.s')::uuid order by p.position offset ${n - 1} limit 1)`;
const jawab = (n: number, seq: number, benar: boolean) =>
  `select x.outcome from public.record_answer(${soal(n)}, ${seq}, selftest.f09_answer(${soal(n)}, ${benar})) x`;
/** The sitting's final answer to question `n`, as scoring reads it. */
const akhir = (n: number) =>
  `(select fr.value::text from public.session_final_responses(current_setting('a3.s')::uuid) fr where fr.presented_item_id = ${soal(n)})`;

function skenario(): string {
  return `
begin;
create function pg_temp.a3(p_sesi text, p_sql text)
returns text language plpgsql as $f$
declare v_out text; v_state text; v_detail text; v_msg text; v_val text; v_u uuid := current_setting('a3.u')::uuid;
begin
  begin
    reset role;
    perform set_config('request.jwt.claims', case p_sesi
      when 'NONE' then json_build_object('sub', v_u, 'role', 'authenticated')
      else json_build_object('sub', v_u, 'role', 'authenticated', 'session_id', current_setting('a3.sesi_' || p_sesi)) end::text, true);
    perform set_config('request.jwt.claim.sub', v_u::text, true);
    set local role authenticated;
    execute p_sql into v_val;
    v_out := 'ok:' || coalesce(v_val, '');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail, v_msg = message_text;
    v_out := v_state || ':' || coalesce(nullif(v_detail, ''), left(v_msg, 70));
  end;
  perform selftest.as_owner();
  return v_out;
end $f$;
-- a probe whose effects never stay: run, then roll back to before it, keeping only its answer
create function pg_temp.a3x(p_sesi text, p_sql text)
returns text language plpgsql as $f$
declare v_out text;
begin
  begin
    v_out := pg_temp.a3(p_sesi, p_sql);
    raise exception 'a3x-rollback';
  exception when others then
    if sqlerrm <> 'a3x-rollback' then v_out := coalesce(v_out, 'probe-error:' || sqlerrm); end if;
  end;
  return v_out;
end $f$;
create temp table a3_snap (v jsonb) on commit drop;
do $a3$
declare v jsonb := '{}'::jsonb; f record; v_k uuid; v_u uuid; v_p uuid; v_e uuid; v_s uuid; v_t text;
begin
  perform selftest.as_owner();
  perform set_config('a3.tag', to_char(clock_timestamp(), 'HH24MISSUS'), true);
  perform set_config('a3.sesi_A', gen_random_uuid()::text, true);
  perform set_config('a3.sesi_B', gen_random_uuid()::text, true);
  select * into f from selftest.cycle_fixture();
  if f.aa_pre is null then raise exception 'the learning-cycle fixture is absent'; end if;
  select la.node_id into v_k from public.learning_assignments la where la.id = f.la;
  -- a learner of our own, in the cycle's Kelas, who has never sat its Pemetaan Awal
  v_u := selftest.f06p10_person('a3-murid-' || current_setting('a3.tag'));
  select a.person_id into v_p from public.accounts a where a.auth_user_id = v_u;
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  select v_p, e.institution_id, e.academic_period_id, e.programme_id, 'ACTIVE'
    from public.memberships mm join public.enrollments e on e.id = mm.enrollment_id
   where mm.node_id = v_k and mm.valid_to is null limit 1
  returning id into v_e;
  if v_e is null then raise exception 'the fixture Kelas has no learner to enrol beside'; end if;
  insert into public.memberships (enrollment_id, node_id, academic_period_id)
  select v_e, v_k, e.academic_period_id from public.enrollments e where e.id = v_e;
  perform set_config('a3.u', v_u::text, true);
  -- the harness's hand: the Pemetaan Awal allows a pause, so case 3 can be asked (rolled back with the rest)
  set local session_replication_role = replica;
  update public.assessment_definitions d set allows_pause = true
    from public.assessment_assignments aa where aa.id = f.aa_pre and d.id = aa.assessment_definition_id;
  set local session_replication_role = origin;
  -- started on session A, which answers the first question
  v := v || jsonb_build_object('mulai_A', pg_temp.a3('A', format('select public.start_learning_session(%L)::text', f.aa_pre)));
  select s.id into v_s from public.assessment_sessions s where s.person_id = v_p and s.assessment_assignment_id = f.aa_pre;
  if v_s is null then raise exception 'the sitting was not started: %', v ->> 'mulai_A'; end if;
  perform set_config('a3.s', v_s::text, true);
  ${langkah("A_jawab_1", "A", jawab(1, 1, true))}
  -- case 1: session B answers another question, then answers A's question with a higher sequence
  ${langkah("B_jawab_2", "B", jawab(2, 1, true))}
  ${langkah("B_timpa_1", "B", jawab(1, 9, false))}
  v := v || jsonb_build_object('akhir_1', (select ${akhir(1)}), 'akhir_1_A', (select r.value::text from public.responses r
          where r.presented_item_id = ${soal(1)} and r.client_seq = 1));
  -- the control: A's own next answer is accepted
  ${langkah("A_jawab_3", "A", jawab(3, 1, true))}
  -- case 3: A pauses; B answers while it is paused
  ${langkah("A_jeda", "A", "select public.pause_session(current_setting('a3.s')::uuid)::text")}
  ${langkah("B_jawab_4_jeda", "B", jawab(4, 1, true))}
  ${langkah("A_lanjut", "A", "select public.resume_session(current_setting('a3.s')::uuid)::text")}
  -- a verified token with no session id at all
  ${langkah("NONE_jawab_5", "NONE", jawab(5, 1, true))}
  -- case 2's root: B hands in A's sitting
  ${langkah("B_serahkan", "B", "select public.submit_session(current_setting('a3.s')::uuid)::text")}
  -- A3-C01 (S11): a start with no session id, tried and rolled back (the learner's sitting already exists, so the
  -- session check must come first to be the answer)
  v := v || jsonb_build_object('NONE_mulai', pg_temp.a3x('NONE', format('select public.start_learning_session(%L)::text', f.aa_pre)));
  perform selftest.as_owner();
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'assessment_sessions'
              and column_name = 'pengendali_sesi') then
    -- A3-C03 (D6; Sharon 6e6e69d6 (b)): a sitting with no controller (one open when A3 lands) is claimed by its first
    -- touch, here through assistance_state, exactly once; the other session is then refused
    execute 'update public.assessment_sessions set pengendali_sesi = null where id = $1' using v_s;
    v := v || jsonb_build_object('klaim_B', pg_temp.a3('B', 'select public.assistance_state((select p.id from public.presented_items p where p.session_id = current_setting(''a3.s'')::uuid order by p.position limit 1))::text'));
    perform selftest.as_owner();
    execute 'select (pengendali_sesi = $2)::text from public.assessment_sessions where id = $1' into v_t using v_s, current_setting('a3.sesi_B')::uuid;
    v := v || jsonb_build_object('klaim_B_pengendali', v_t);
    -- the other session's next WRITE is refused (assistance_state reaches the gate only on an item's first view, through
    -- note_item_view; after that it is a read, which the controller does not refuse: D4 is about writes)
    v := v || jsonb_build_object('klaim_A_ditolak', pg_temp.a3('A', ${q(jawab(3, 7, true))}));
    perform selftest.as_owner();
    v := v || jsonb_build_object('klaim_B_lagi', pg_temp.a3('B', 'select public.assistance_state((select p.id from public.presented_items p where p.session_id = current_setting(''a3.s'')::uuid order by p.position limit 1))::text'));
    perform selftest.as_owner();
    execute 'select (pengendali_sesi = $2)::text from public.assessment_sessions where id = $1' into v_t using v_s, current_setting('a3.sesi_B')::uuid;
    v := v || jsonb_build_object('klaim_sekali', v_t);
    -- A3-C04 (D8): after a generation bump, the newer generation's answer is final though its client_seq is lower
    v := v || jsonb_build_object('gen1_jawab', pg_temp.a3('B', ${q(jawab(2, 5, false))}));
    perform selftest.as_owner();
    execute 'update public.assessment_sessions set generasi = generasi + 1 where id = $1' using v_s;
    v := v || jsonb_build_object('gen2_jawab', pg_temp.a3('B', ${q(jawab(2, 2, true))}));
    perform selftest.as_owner();
    v := v || jsonb_build_object('gen_akhir', (select ${akhir(2)}),
      'gen_akhir_harap', (select r.value::text from public.responses r where r.presented_item_id = ${soal(2)} and r.client_seq = 2 and r.is_final order by r.received_at desc limit 1));
  else
    v := v || jsonb_build_object('klaim_B_pengendali', 'no-column', 'gen_akhir', 'no-column');
  end if;
  perform selftest.as_owner();
  insert into a3_snap values (v);
end $a3$;
select 'A3' || chr(9) || v::text from a3_snap;
rollback;
`;
}

let hasilSkenario: { v: Record<string, string> | null; galat: string[] } | undefined;
/** The scenario, run once for A3-R01 and A3-C01..C04; each test reports its own reading of it. */
function jalankan(c: Checks, repoRoot: string): Record<string, string> | null {
  if (!hasilSkenario) {
    const c0 = new Checks();
    hasilSkenario = { v: jalankanSekali(c0, repoRoot), galat: [] };
    if (!hasilSkenario.v) hasilSkenario.galat.push(c0.verdict("").detail);
  }
  for (const g of hasilSkenario.galat) c.expect(false, g);
  return hasilSkenario.v;
}

function jalankanSekali(c: Checks, repoRoot: string): Record<string, string> | null {
  const gagal = siapkan(repoRoot);
  if (!c.expect(gagal === null, gagal ?? "")) return null;
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", skenario(), db()], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
  if (!c.expect(r.status === 0, `the scenario could not run: ${pesan}`)) return null;
  const baris = r.stdout.split("\n").find((l) => l.startsWith("A3\t"));
  if (!c.expect(!!baris, "the scenario returned nothing")) return null;
  return JSON.parse(baris!.slice(3)) as Record<string, string>;
}

const diterima = (x: string | undefined) => (x ?? "").startsWith("ok:");

/** The first index of each table in one function's lock list (A2A-L01's reading), or -1. */
function pertama(l: Kunci[], t: string): number {
  return l.findIndex((k) => k.t === t);
}
/** A3-L1P: the functions that lock assessment_assignments before learning_assignments, read with both tables ranked. */
function aaSebelumLa(db: string, tanam = ""): { salah: string[]; keduanya: number } {
  const asli = { la: URUTAN.learning_assignments, aa: URUTAN.assessment_assignments };
  URUTAN.learning_assignments = 8.3;
  URUTAN.assessment_assignments = 8.6;
  try {
    const r = bacaUrutan(db, tanam);
    const salah: string[] = [];
    let keduanya = 0;
    for (const [fn, l] of r.semua) {
      const la = pertama(l, "learning_assignments"), aa = pertama(l, "assessment_assignments");
      if (la < 0 || aa < 0) continue;
      keduanya++;
      if (aa < la) salah.push(`${fn}: assessment_assignments before learning_assignments — via ${l[aa].lewat}`);
    }
    return { salah, keduanya };
  } finally {
    if (asli.la === undefined) delete URUTAN.learning_assignments; else URUTAN.learning_assignments = asli.la;
    if (asli.aa === undefined) delete URUTAN.assessment_assignments; else URUTAN.assessment_assignments = asli.aa;
  }
}
const TANAM_L1P = `create function public._a3_l1p_tanam(p uuid) returns void language plpgsql as $t$
begin perform 1 from public.assessment_assignments a where a.id = p for share;
      perform 1 from public.learning_assignments la where la.id = p for key share; end $t$;`;

/** Sharon's pin (7cd65cba): does `fn` take its persons, by a lock of its own, before its first sitting lock? */
function orangSebelumPengerjaan(db: string, fn: string, tanam = ""): { orang: number; pengerjaan: number; lewat: string } {
  const l = bacaUrutan(db, tanam).semua.get(fn) ?? [];
  const orang = l.findIndex((k) => k.t === "persons" && k.lewat === fn);
  const pengerjaan = l.findIndex((k) => k.t === "assessment_sessions");
  return { orang, pengerjaan, lewat: pengerjaan >= 0 ? l[pengerjaan].lewat : "" };
}
const TANAM_L2P = `create function public._a3_l2p_tanam(p uuid) returns void language plpgsql as $t$
begin perform 1 from public.assessment_sessions s where s.id = p for update;
      perform 1 from public.persons pr where pr.id = p for key share; end $t$;`;

/** Sharon's pin 2, restated (561bcf9d): every function that takes persons FOR UPDATE in its own body either takes the
 * person first, or holds before it only locks that no person-first function requests at a conflicting strength
 * (foreign keys included: the reader records an insert's or update's foreign key as KEY SHARE on the table it names). */
const KONFLIK = (a: number, b: number) => a === 3 || b === 3 || (a >= 1 && b >= 2) || (a >= 2 && b >= 1);
function pin2(db: string, tanam = ""): { pengambil: number; salah: string[]; dikecualikan: string[] } {
  const r = bacaUrutan(db, tanam);
  const fungsi = [...r.semua].filter(([fn]) => !/[[(]/.test(fn));
  const pertama = fungsi.filter(([, l]) => l[0]?.t === "persons");
  const salah: string[] = [];
  const dikecualikan = new Set<string>();
  let pengambil = 0;
  for (const [fn, l] of fungsi) {
    const pu = l.findIndex((k) => k.t === "persons" && k.kuat === 3 && k.lewat === fn);
    if (pu < 0) continue;
    pengambil++;
    for (const h of l.slice(0, pu)) {
      if (h.t === "persons") continue;
      const lawan = new Set<string>();
      for (const [pf, pl] of pertama) for (const k of pl) if (k.t === h.t && KONFLIK(h.kuat, k.kuat)) lawan.add(`${pf} (${k.t} at ${k.kuat}, via ${k.lewat})`);
      if (lawan.size && PIN2_PENGECUALIAN[fn]?.tabel === h.t) { dikecualikan.add(fn); continue; }
      if (lawan.size) salah.push(`${fn} holds ${h.t} at strength ${h.kuat} before its persons FOR UPDATE, and a person-first function requests it: ${[...lawan].slice(0, 3).join("; ")}${lawan.size > 3 ? ` (+${lawan.size - 3})` : ""}`);
    }
  }
  return { pengambil, salah: [...new Set(salah)], dikecualikan: [...dikecualikan].sort() };
}
/**
 * Pin 2's NAMED EXCEPTIONS (Sharon, dd03a300 and 4d5cd5f6: a flag no race turns red is a named exception, with its
 * reason and its race recorded). Each is one function holding one table, and nothing else: a new conflict in the same
 * function, or the same function holding another table, is still reported. Each names its evidence and, where the
 * exception rests on a premise, a source check that the premise still holds (run by A3-P2).
 */
const PIN2_PENGECUALIAN: Record<string, { tabel: string; alasan: string; bukti: string; premis?: string }> = {
  confirm_my_name: {
    tabel: "account_setup",
    alasan: "the person-first functions reach account_setup only through the auth.users email guards, which write it only on a governed email correction or a card conversion; both come through Auth, and the one person-first function that changes an email (hapus_data_pribadi) marks the change as an anonymisation, which the guard returns on before it writes",
    bukti: "A3-R05N",
    premis: `select (position('pintar.anonimkan_email' in (select prosrc from pg_proc where oid = 'public.hapus_data_pribadi(uuid,text)'::regprocedure)) > 0
        and position('pintar.anonimkan_email' in (select prosrc from pg_proc where oid = 'public.auth_email_correction_guard()'::regprocedure))
          < position('update public.email_corrections' in (select prosrc from pg_proc where oid = 'public.auth_email_correction_guard()'::regprocedure)))::text`,
  },
  handle_new_auth_user: {
    tabel: "account_activation_grants",
    alasan: "the cycle needs a person who is closed at their own request and has no account; the only product writer of CLOSED_AT_REQUEST is minta_akun, which needs a signed-in account, and handle_new_auth_user refuses a person who has an account (PR010) before it locks the person; only Auth deleting a user directly could make the state (the operator runbook forbids it)",
    bukti: "A3-P2 (this premise check)",
    premis: `select ((select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.prosrc ~ 'CLOSED_AT_REQUEST' and p.prosrc ~* 'insert\\s+into\\s+public\\.person_suspensions') = 1
        and position('insert into public.person_suspensions' in (select prosrc from pg_proc where oid = 'public.minta_akun(text,boolean)'::regprocedure)) > 0
        and position('public.current_person_id()' in (select prosrc from pg_proc where oid = 'public.minta_akun(text,boolean)'::regprocedure)) > 0
        and position('this person already has an account' in (select prosrc from pg_proc where oid = 'public.handle_new_auth_user()'::regprocedure))
          between 1 and position('perform 1 from public.persons where id = v_person for update' in (select prosrc from pg_proc where oid = 'public.handle_new_auth_user()'::regprocedure)))::text`,
  },
  issue_institutional_id: {
    tabel: "institutions",
    alasan: "the person-first functions take the school FOR UPDATE only in the last-administrator guard's removal branch (peran_terakhir_kode under p_kunci); raced both ways against issue_institutional_id (akhiri_tugas_staf and revoke_role), no deadlock; SI-D03 keeps the school before the person for the import",
    bukti: "A3-R04X",
  },
};

const TANAM_P2 = `create function public._a3_p2_tanam(p uuid) returns void language plpgsql as $t$
begin perform 1 from public.assessment_sessions s where s.id = p for update;
      perform 1 from public.persons pr where pr.id = p for update; end $t$;`;

/** Two real connections (Sharon's rule, 4d5cd5f6: a lock-cycle change needs a red race). The first runs `tahan` (the
 * lock its function takes first), holds it across a pause, then runs `sisa`; the second starts once the first is paused.
 * Both end with ROLLBACK. Returns whether either was aborted as a deadlock, and both outputs. */
async function balapanTahan(tahan: string, sisa: string, kedua: string): Promise<{ deadlock: boolean; menunggu: boolean; a: string; b: string; ok: boolean }> {
  const jalan = (sql: string) => new Promise<{ code: number; out: string }>((done) => {
    const p = spawn("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", sql, db()], { stdio: ["ignore", "pipe", "pipe"] });
    let buf = "";
    p.stdout.setEncoding("utf8"); p.stderr.setEncoding("utf8");
    p.stdout.on("data", (d: string) => (buf += d)); p.stderr.on("data", (d: string) => (buf += d));
    p.on("close", (code: number | null) => done({ code: code ?? 1, out: buf.trim() }));
  });
  const lihat = (sql: string) => spawnSync("psql", ["-qAt", "-c", sql, db()], { encoding: "utf8" }).stdout.trim();
  const tunggu = (ms: number) => new Promise((ok) => setTimeout(ok, ms));
  const t1 = `a3-bt-1-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, t2 = t1.replace("-1-", "-2-");
  const a = jalan(`set statement_timeout = '30s'; begin; ${tahan}; select pg_sleep(2.5) /*${t1}*/; ${sisa}; rollback;`);
  let siap = false;
  for (let i = 0; i < 100 && !siap; i++) {
    siap = lihat(`select count(*) from pg_stat_activity where query like '%${t1}%' and wait_event = 'PgSleep' and pid <> pg_backend_pid()`) === "1";
    if (!siap) await tunggu(50);
  }
  if (!siap) { const x = await a; return { deadlock: false, menunggu: false, a: `the first connection never paused: ${x.out}`, b: "", ok: false }; }
  const b = jalan(`set statement_timeout = '30s'; begin; ${kedua} /*${t2}*/; rollback;`);
  let menunggu = false;
  for (let i = 0; i < 30 && !menunggu; i++) {
    await tunggu(50);
    menunggu = lihat(`select coalesce(wait_event_type, '') from pg_stat_activity where query like '%${t2}%' and pid <> pg_backend_pid()`) === "Lock";
  }
  const [ra, rb] = await Promise.all([a, b]);
  return { deadlock: /deadlock detected/i.test(ra.out + rb.out), menunggu, a: ra.out, b: rb.out, ok: ra.code === 0 && rb.code === 0 };
}

export const a3DbTests: SelfTest[] = [
  {
    // Sharon, 8df83c47, conditions 1 and 2: the harness's per-person session (selftest.as_user, as_user_uid) is the
    // harness's only. No migration defines or calls selftest.as_user, or derives a session from 'selftest-sesi:'; and the
    // product's sesi_saya() reads the session from the verified claims and nothing else.
    id: "A3-H01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const dir = join(repoRoot, "supabase", "migrations");
      const berkas = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
      c.expect(berkas.length > 200, `only ${berkas.length} migrations read`);
      // RESTATED (Sharon, 6e6e69d6): nor the seed's own prefix, 'seed-sesi:' (supabase/seed/human_evaluation.sql)
      const kena = berkas.filter((f) => /selftest\.as_user|selftest-sesi|seed-sesi/.test(readFileSync(join(dir, f), "utf8")));
      c.expect(kena.length === 0, `a migration names the harness's identity: ${kena.join(", ")}`);
      // the latest definition of sesi_saya, wherever it is
      let tubuh = "";
      for (const f of berkas) {
        const m = /create (?:or replace )?function public\.sesi_saya\(\)[\s\S]*?\$[a-z_]*\$;/i.exec(readFileSync(join(dir, f), "utf8"));
        if (m) tubuh = m[0];
      }
      c.expect(tubuh.includes("request.jwt.claims") && tubuh.includes("session_id"), "sesi_saya() does not read session_id from the verified claims");
      c.expect(!/\bp_[a-z_]+|current_setting\('(?!request\.jwt\.claims)/.test(tubuh.replace(/^create (?:or replace )?function public\.sesi_saya\(\)/i, "")),
        "sesi_saya() takes a parameter or reads a setting other than the verified claims");
      return c.verdict(`reads all ${berkas.length} migrations (the source): none defines or calls selftest.as_user or derives a session from 'selftest-sesi:' or 'seed-sesi:'; the latest sesi_saya() reads session_id from request.jwt.claims and from nothing else`);
    },
  },
  {
    // Sharon, 8df83c47, condition 3: the harness's derived sessions are per person and fixed. Two personas get two ids;
    // one persona gets the same id each time, by as_user and as_user_uid alike; claims without a session_id give none.
    id: "A3-H02",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      for (const f of ["fable01.sql", "fable06.sql"]) spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(process.cwd(), "selftest", "db", f), db()], { encoding: "utf8" });
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", `begin;
        select selftest.as_user('alpha-siswa-1@synthetic.pintar.test'); reset role; select 'A1=' || coalesce(public.sesi_saya()::text, 'null');
        select selftest.as_user('alpha-siswa-1@synthetic.pintar.test'); reset role; select 'A2=' || coalesce(public.sesi_saya()::text, 'null');
        reset role; select selftest.as_user_uid((select id from auth.users where email = 'alpha-siswa-1@synthetic.pintar.test')); reset role; select 'AU=' || coalesce(public.sesi_saya()::text, 'null');
        select selftest.as_user('alpha-guru@synthetic.pintar.test'); reset role; select 'B=' || coalesce(public.sesi_saya()::text, 'null');
        reset role; select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email = 'alpha-siswa-1@synthetic.pintar.test'), 'role', 'authenticated')::text, true);
        select 'N=' || coalesce(public.sesi_saya()::text, 'null');
        rollback;`, db()], { encoding: "utf8" });
      if (!c.expect(r.status === 0, `the read failed: ${(r.stderr || "").trim().split("\n").pop()}`)) return c.verdict("");
      const v = Object.fromEntries(r.stdout.split("\n").filter((l) => /^[A-Z0-9]+=/.test(l)).map((l) => l.split("=") as [string, string]));
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
      c.expect(uuid.test(v.A1 ?? "") && uuid.test(v.B ?? ""), `a persona has no harness session: ${v.A1} / ${v.B}`);
      c.expect(v.A1 !== v.B, `two personas share one harness session: ${v.A1}`);
      c.expect(v.A1 === v.A2 && v.A1 === v.AU, `one persona's harness session is not fixed (as_user twice, as_user_uid): ${v.A1} / ${v.A2} / ${v.AU}`);
      c.expect(v.N === "null", `claims without a session_id still give a session: ${v.N}`);
      return c.verdict("executes selftest.as_user and as_user_uid against the migrations, rolled back: two personas get two different sessions; one persona gets the same session from as_user twice and from as_user_uid; claims with no session_id give sesi_saya() null (S11 stays expressible)");
    },
  },
  {
    id: "A3-L1P",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const nyata = aaSebelumLa(db());
      c.expect(nyata.keduanya > 0, "no function locks both learning_assignments and assessment_assignments (the reader found nothing to check)");
      c.expect(nyata.salah.length === 0, `functions that lock an assessment assignment before its learning assignment:\n  ${nyata.salah.join("\n  ")}`);
      const tanam = aaSebelumLa(db(), TANAM_L1P);
      c.expect(tanam.salah.some((x) => x.startsWith("_a3_l1p_tanam:")), "the plant (assessment_assignments, then learning_assignments) was not reported");
      c.expect(URUTAN.learning_assignments === undefined && URUTAN.assessment_assignments === undefined, "A2A-L01's ranks were not restored after the check");
      return c.verdict(`A2A-L01's reader, with the two tables ranked for this check only: all ${nyata.keduanya} functions that lock both learning_assignments and assessment_assignments take learning_assignments first; a plant locking them the other way round is reported; A2A-L01's ranks are left as they were`);
    },
  },
  {
    // Sharon's sweep acceptance (7cd65cba), pin 1: «Akhiri penugasan» takes the persons of all its open sittings before
    // its first sitting lock, so no sitting it holds waits on a person a departure holds (F37-R05's pair).
    id: "A3-L2P",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const a = orangSebelumPengerjaan(db(), "akhiri_penugasan");
      c.expect(a.orang >= 0, "akhiri_penugasan takes no person lock of its own (the reader found nothing to check)");
      c.expect(a.pengerjaan >= 0, "akhiri_penugasan takes no sitting lock (the reader found nothing to check)");
      c.expect(a.orang >= 0 && a.pengerjaan >= 0 && a.orang < a.pengerjaan, `akhiri_penugasan locks a sitting (via ${a.lewat}) before its own person lock`);
      const src = spawnSync("psql", ["-qAt", "-c", "select prosrc from pg_proc where oid = 'public.akhiri_penugasan(uuid,text,text,boolean)'::regprocedure", db()], { encoding: "utf8" }).stdout;
      const i = src.search(/from public\.persons pr where pr\.id in \(select x\.person_id from public\.penugasan_sesi\(p_la\) x\s+where x\.status in \('CREATED', 'IN_PROGRESS', 'PAUSED'\)\) order by pr\.id for key share of pr/);
      const j = src.search(/for update loop/);
      c.expect(i >= 0, "akhiri_penugasan's person lock no longer reads the persons of all its open sittings, in order (penugasan_sesi, CREATED/IN_PROGRESS/PAUSED, by id)");
      c.expect(i >= 0 && j >= 0 && i < j, "akhiri_penugasan's person lock is not before its sitting loop");
      const t = orangSebelumPengerjaan(db(), "_a3_l2p_tanam", TANAM_L2P);
      c.expect(t.pengerjaan >= 0 && !(t.orang >= 0 && t.orang < t.pengerjaan), "the plant (a sitting, then its person) was not reported");
      return c.verdict(`A2A-L01's reader: akhiri_penugasan takes its own person lock (lock ${a.orang + 1}) before its first sitting lock (lock ${a.pengerjaan + 1}), and that lock is one ordered statement over the persons of all its open sittings (penugasan_sesi, CREATED, IN_PROGRESS or PAUSED), before the sitting loop; a plant locking a sitting and then its person is reported`);
    },
  },
  {
    // Sharon's ruling (b) on pin 2 (17 Nov, 561bcf9d): issue_institutional_id takes its school FOR UPDATE and then the
    // person FOR UPDATE. A start holds the person FOR KEY SHARE (its first lock) and then inserts a sitting, whose
    // foreign key takes FOR KEY SHARE on the same school, which FOR UPDATE blocks: a deadlock on two real connections.
    // The start's transaction holds the person, as its own first lock does, across a pause, so the interleaving is
    // fixed: the issue takes the school and waits on the person; then the start reaches its insert.
    id: "A3-R02I",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const psql = (sql: string) => spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", sql, db()], { encoding: "utf8" });
      const race = (sql: string) => new Promise<{ code: number; out: string }>((done) => {
        const p = spawn("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", sql, db()], { stdio: ["ignore", "pipe", "pipe"] });
        let buf = "";
        p.stdout.setEncoding("utf8"); p.stderr.setEncoding("utf8");
        p.stdout.on("data", (d: string) => (buf += d)); p.stderr.on("data", (d: string) => (buf += d));
        p.on("close", (code: number | null) => done({ code: code ?? 1, out: buf.trim() }));
      });
      const tunggu = (ms: number) => new Promise((ok) => setTimeout(ok, ms));
      // the harness's hand, committed and removed below: a learner of our own in the cycle's Kelas, with no number at
      // its school, and a namespace on that school so the number can be issued
      const siap = psql(`do $r$
declare f record; v_k uuid; v_u uuid; v_p uuid; v_e uuid;
begin
  select * into f from selftest.cycle_fixture();
  if f.aa_pre is null then raise exception 'the learning-cycle fixture is absent'; end if;
  select la.node_id into v_k from public.learning_assignments la where la.id = f.la;
  v_u := selftest.f06p10_person('a3-r02i-murid');
  select a.person_id into v_p from public.accounts a where a.auth_user_id = v_u;
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  select v_p, e.institution_id, e.academic_period_id, e.programme_id, 'ACTIVE'
    from public.memberships mm join public.enrollments e on e.id = mm.enrollment_id
   where mm.node_id = v_k and mm.valid_to is null and e.person_id <> v_p limit 1
  returning id into v_e;
  insert into public.memberships (enrollment_id, node_id, academic_period_id)
  select v_e, v_k, e.academic_period_id from public.enrollments e where e.id = v_e;
  set local session_replication_role = replica;
  update public.institutions set namespace = 'R2I' where id = f.inst and namespace is null;
  perform set_config('a3.r2i', v_u || '|' || v_p || '|' || f.inst || '|' || f.aa_pre || '|' || v_e, false);
end $r$; select current_setting('a3.r2i');`);
      const baris = siap.stdout.trim().split("\n").pop() ?? "";
      const [uid, orang, sekolah, aa, enrol] = baris.split("|");
      const bersihkan = () => {
        if (!orang) return;
        const ids = `(select id from public.assessment_sessions where person_id = '${orang}')`;
        const r = psql(`begin; set local session_replication_role = replica;
          delete from public.presented_item_views where session_id in ${ids};
          delete from public.responses where session_id in ${ids};
          delete from public.presented_items where session_id in ${ids};
          delete from telemetry.hesitation_events where session_id in ${ids};
          delete from telemetry.assistance_events where session_id in ${ids};
          delete from public.assistance_grants where session_id in ${ids};
          delete from public.integrity_signals where session_id in ${ids};
          delete from public.assessment_results where session_id in ${ids};
          delete from public.assessment_sessions where id in ${ids};
          delete from public.institutional_identities where person_id = '${orang}';
          delete from public.memberships where enrollment_id in (select id from public.enrollments where person_id = '${orang}');
          delete from public.enrollments where person_id = '${orang}';
          update public.institutions set namespace = null where id = '${sekolah}' and namespace = 'R2I';
          commit;
          select (select count(*) from public.assessment_sessions where person_id = '${orang}') + (select count(*) from public.enrollments where person_id = '${orang}')
               + (select count(*) from public.institutions where id = '${sekolah}' and namespace = 'R2I');`);
        c.expect(r.status === 0 && r.stdout.trim().split("\n").pop() === "0", `the test's rows could not be removed afterwards: ${(r.stderr || r.stdout).trim().slice(0, 160)}`);
      };
      if (!c.expect(siap.status === 0 && !!aa && !!enrol, `the race cannot be set up: ${(siap.stderr || baris).trim().split("\n").find((l) => /ERROR/.test(l)) ?? baris}`)) { bersihkan(); return c.verdict(""); }
      try {
        const sebagai = `select set_config('request.jwt.claims', json_build_object('sub','${uid}','role','authenticated','session_id', md5('selftest-sesi:' || '${uid}')::uuid)::text, true), set_config('request.jwt.claim.sub','${uid}',true); set local role authenticated;`;
        const boleh = psql(`begin; ${sebagai} select ok::text || ':' || coalesce(reason, '') from public.may_start_assessment('${aa}'); rollback;`).stdout.trim().split("\n").pop();
        if (!c.expect(boleh === "true:OK" || boleh === "true:", `the learner cannot start the cycle's Pemetaan Awal (the race cannot be set up): ${boleh}`)) return c.verdict("");
        const tanda = `a3-r2i-s-${Date.now().toString(36)}`;
        const mulai = race(`set statement_timeout = '30s'; begin; select 1 from public.persons where id = '${orang}' for key share;
          select pg_sleep(2.5) /*${tanda}*/; ${sebagai} select public.start_learning_session('${aa}') is not null; commit;`);
        let tahan = false;
        for (let i = 0; i < 100 && !tahan; i++) {
          tahan = psql(`select count(*) from pg_stat_activity where query like '%${tanda}%' and wait_event = 'PgSleep' and pid <> pg_backend_pid()`).stdout.trim() === "1";
          if (!tahan) await tunggu(50);
        }
        if (!c.expect(tahan, "the start never held its person open")) { await mulai; return c.verdict(""); }
        const tandaI = `a3-r2i-i-${Date.now().toString(36)}`;
        const terbit = race(`set statement_timeout = '30s'; begin; select public.issue_institutional_id('${orang}', '${sekolah}') is not null /*${tandaI}*/; commit;`);
        let menunggu = false;
        for (let i = 0; i < 40 && !menunggu; i++) {
          await tunggu(50);
          menunggu = psql(`select coalesce(wait_event_type, '') from pg_stat_activity where query like '%${tandaI}%' and pid <> pg_backend_pid()`).stdout.trim() === "Lock";
        }
        const [rs, ri] = await Promise.all([mulai, terbit]);
        c.expect(menunggu, "the issue did not wait on the person the start holds (the interleaving was not reached)");
        c.expect(!/deadlock detected/i.test(rs.out + ri.out), `a start and a number issued for one learner and school deadlocked: ${[rs.out, ri.out].filter((x) => /deadlock/i.test(x)).join(" / ").split("\n").find((l) => /deadlock/i.test(l))}`);
        c.expect(rs.code === 0, `the start failed: ${rs.out.split("\n").pop()}`);
        c.expect(ri.code === 0, `the issue failed: ${ri.out.split("\n").pop()}`);
        const hasil = psql(`select (select count(*) from public.assessment_sessions where person_id = '${orang}' and assessment_assignment_id = '${aa}')
            || '|' || (select count(*) from public.institutional_identities where person_id = '${orang}' and institution_id = '${sekolah}')`).stdout.trim();
        c.expect(hasil === "1|1", `after both committed the learner must hold one sitting and one number at the school: ${hasil}`);
        return c.verdict("two real connections, one learner of our own and one school: the start's transaction holds the person FOR KEY SHARE (its own first lock) across a pause, issue_institutional_id takes the school and waits on the person, then the start inserts its sitting (its foreign key takes FOR KEY SHARE on the school). No deadlock: both commit, with one sitting and one number; the test's rows removed afterwards");
      } finally {
        bersihkan();
      }
    },
  },
  {
    // Sharon's pin 2, restated (561bcf9d; my finding that the first form did not hold, at 561bcf9d's request): read by
    // A2A-L01's own reader. A plant (a sitting FOR UPDATE, then its person FOR UPDATE: every start requests a sitting
    // after the person) must be reported.
    id: "A3-P2",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const nyata = pin2(db());
      c.expect(nyata.pengambil >= 15, `only ${nyata.pengambil} function(s) take persons FOR UPDATE in their own body (the reader found too little to check)`);
      c.expect(nyata.salah.length === 0, `functions that hold, before their persons FOR UPDATE, a lock a person-first function requests:\n  ${nyata.salah.join("\n  ")}`);
      // every named exception is still needed (a fixed function leaves the list), and each premise still holds
      const nama = Object.keys(PIN2_PENGECUALIAN).sort();
      c.expect(JSON.stringify(nyata.dikecualikan) === JSON.stringify(nama), `the named exceptions in use are ${nyata.dikecualikan.join(", ") || "none"}; the list names ${nama.join(", ")} (an exception no longer needed leaves the list)`);
      const daftar = JSON.parse(readFileSync(join(process.cwd(), "selftest", "manifest.json"), "utf8")).tests.map((x: { id: string }) => x.id) as string[];
      for (const [fn, e] of Object.entries(PIN2_PENGECUALIAN)) {
        const id = e.bukti.split(" ")[0];
        c.expect(daftar.includes(id), `${fn}'s exception names its evidence ${id}, which is not in the manifest`);
        if (e.premis) {
          const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", e.premis, db()], { encoding: "utf8" });
          c.expect(r.stdout.trim() === "true", `${fn}'s exception rests on a premise that no longer holds (${e.alasan.slice(0, 90)}...): ${r.stdout.trim() || (r.stderr || "").trim().split("\n")[0]}`);
        }
      }
      const t = pin2(db(), TANAM_P2);
      c.expect(t.salah.some((x) => x.startsWith("_a3_p2_tanam holds assessment_sessions")), "the plant (a sitting, then its person FOR UPDATE) was not reported");
      return c.verdict(`A2A-L01's reader: each of the ${nyata.pengambil} functions that take persons FOR UPDATE in their own body takes the person first, or holds before it only locks no person-first function requests at a conflicting strength, foreign keys included, but for three named exceptions, each one function and one table, each with its evidence and, where it rests on one, its premise checked: ${nama.map((f) => `${f} (${PIN2_PENGECUALIAN[f].tabel}; ${PIN2_PENGECUALIAN[f].bukti})`).join(", ")}; a plant is reported`);
    },
  },
  {
    // A3, ruling 46, Sharon's Q2 answer (17 Nov, after 561bcf9d): an approved further attempt spans the lineage, as the
    // count does. Today it is a dead end: a learner at the limit through revision 1 is at the limit on revision 2 and
    // a grant on revision 1's assignment does not lift it. Red first: used on revision 1, a grant gives exactly one
    // start through revision 2, the sitting is marked with it, and the learner is told it waits (percobaan_saya).
    id: "A3-PG1",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const gagalMuat = siapkan(ctx.repoRoot);
      if (!c.expect(gagalMuat === null, gagalMuat ?? "")) return c.verdict("");
      const sql = `begin;
create function pg_temp.murid(p_sql text)
returns text language plpgsql as $f$
declare v_out text; v_state text; v_msg text; v_val text; v_u uuid := current_setting('pg1.u')::uuid;
begin
  begin
    reset role;
    perform set_config('request.jwt.claims', json_build_object('sub', v_u, 'role', 'authenticated',
      'session_id', current_setting('pg1.sesi'))::text, true);
    perform set_config('request.jwt.claim.sub', v_u::text, true);
    set local role authenticated;
    execute p_sql into v_val;
    v_out := 'ok:' || coalesce(v_val, '');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_msg = message_text;
    v_out := v_state || ':' || left(v_msg, 90);
  end;
  perform selftest.as_owner();
  return v_out;
end $f$;
do $pg1$
declare f record; v_k uuid; v_u uuid; v_p uuid; v_e uuid; v_d1 uuid; v_d2 uuid := 'a3a1e000-0000-4000-8000-a30100000012';
        v_aa2 uuid := 'a3a1e000-0000-4000-8000-a30100000013';
begin
  perform selftest.as_owner();
  perform set_config('pg1.sesi', gen_random_uuid()::text, true);
  select * into f from selftest.cycle_fixture();
  if f.aa_pre is null then raise exception 'the learning-cycle fixture is absent'; end if;
  select la.node_id into v_k from public.learning_assignments la where la.id = f.la;
  v_u := selftest.f06p10_person('a3-pg1-' || to_char(clock_timestamp(), 'HH24MISSUS'));
  select a.person_id into v_p from public.accounts a where a.auth_user_id = v_u;
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  select v_p, e.institution_id, e.academic_period_id, e.programme_id, 'ACTIVE'
    from public.memberships mm join public.enrollments e on e.id = mm.enrollment_id
   where mm.node_id = v_k and mm.valid_to is null limit 1
  returning id into v_e;
  insert into public.memberships (enrollment_id, node_id, academic_period_id)
  select v_e, v_k, e.academic_period_id from public.enrollments e where e.id = v_e;
  select a.assessment_definition_id into v_d1 from public.assessment_assignments a where a.id = f.aa_pre;
  -- the harness's hand: a limit of one, revision 2 of the definition on its line, and an OPEN assignment of it beside
  -- revision 1's in the same learning assignment (school and year)
  set local session_replication_role = replica;
  update public.assessment_definitions set attempt_limit = 1 where id = v_d1;
  -- revision 2's paper is one question with no mix: the fixture's bank is small and a learner is not shown again what
  -- they were shown in this learning assignment (the exclusion is the product's, not this case's)
  insert into public.assessment_definitions select (jsonb_populate_record(d, jsonb_build_object('id', v_d2, 'version', d.version + 1,
      'item_count', 1, 'difficulty_mix', '{}'::jsonb, 'safety_critical_minimum', 0))).*
    from public.assessment_definitions d where d.id = v_d1;
  insert into public.assessment_assignments select (jsonb_populate_record(a, jsonb_build_object('id', v_aa2, 'assessment_definition_id', v_d2))).*
    from public.assessment_assignments a where a.id = f.aa_pre;
  set local session_replication_role = origin;
  perform set_config('pg1.u', v_u::text, true);
  perform set_config('pg1.p', v_p::text, true);
  perform set_config('pg1.aa1', f.aa_pre::text, true);
  perform set_config('pg1.aa2', v_aa2::text, true);
end $pg1$;
select 'satu|' || pg_temp.murid($s$select public.start_learning_session(current_setting('pg1.aa1')::uuid)::text$s$);
-- the harness's hand: revision 1's sitting handed in, and an approved request on revision 1's assignment
do $pg1$
declare v_s uuid; v_a uuid; v_b uuid;
begin
  perform selftest.as_owner();
  select s.id into v_s from public.assessment_sessions s where s.person_id = current_setting('pg1.p')::uuid
     and s.assessment_assignment_id = current_setting('pg1.aa1')::uuid;
  select (array_agg(x.id))[1], (array_agg(x.id))[2] into v_a, v_b from (select p.id from public.persons p
     where p.id <> current_setting('pg1.p')::uuid order by p.id limit 2) x;
  set local session_replication_role = replica;
  update public.assessment_sessions set status = 'FINALIZED', submitted_at = now(), finalized_at = now() where id = v_s;
  insert into public.attempt_requests (id, institution_id, person_id, assessment_assignment_id, session_id, requested_by_person_id,
      reason, status, decided_by_person_id, decided_at)
  select 'a3a1e000-0000-4000-8000-a30100000014', s.institution_id, s.person_id, s.assessment_assignment_id, s.id, v_a,
         'uji A3-PG1: satu percobaan lagi', 'APPROVED', v_b, now()
    from public.assessment_sessions s where s.id = v_s;
  set local session_replication_role = origin;
end $pg1$;
select 'izin|' || public.percobaan_izin_jumlah(current_setting('pg1.p')::uuid, current_setting('pg1.aa2')::uuid);
select 'saya_sebelum|' || pg_temp.murid($s$select public.percobaan_saya(current_setting('pg1.aa2')::uuid)::text$s$);
select 'dua|' || pg_temp.murid($s$select public.start_learning_session(current_setting('pg1.aa2')::uuid)::text$s$);
select 'tanda|' || coalesce((select (s.attempt_request_id = 'a3a1e000-0000-4000-8000-a30100000014')::text from public.assessment_sessions s
   where s.person_id = current_setting('pg1.p')::uuid and s.assessment_assignment_id = current_setting('pg1.aa2')::uuid), 'no sitting');
do $pg1$ begin
  perform selftest.as_owner();
  set local session_replication_role = replica;
  update public.assessment_sessions set status = 'FINALIZED', submitted_at = now(), finalized_at = now()
   where person_id = current_setting('pg1.p')::uuid and assessment_assignment_id = current_setting('pg1.aa2')::uuid;
  set local session_replication_role = origin;
end $pg1$;
select 'saya_sesudah|' || pg_temp.murid($s$select public.percobaan_saya(current_setting('pg1.aa2')::uuid)::text$s$);
select 'tiga|' || pg_temp.murid($s$select public.start_learning_session(current_setting('pg1.aa2')::uuid)::text$s$);
select 'sitting|' || count(*) from public.assessment_sessions s where s.person_id = current_setting('pg1.p')::uuid;
rollback;`;
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", sql, db()], { encoding: "utf8" });
      const v: Record<string, string> = {};
      for (const l of r.stdout.split("\n")) { const i = l.indexOf("|"); if (i > 0) v[l.slice(0, i)] = l.slice(i + 1); }
      const galat = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l));
      if (!c.expect(!!v.satu?.startsWith("ok:"), `the case cannot be set up (revision 1's start): ${v.satu ?? galat ?? "no answer"}`)) return c.verdict("");
      if (!c.expect(r.status === 0, `the scenario could not run to its end: ${galat ?? "no answer"}`)) return c.verdict("");
      c.expect(v.izin === "1", `the grant on revision 1's assignment must count on revision 2's (percobaan_izin_jumlah): ${v.izin ?? "no answer"}`);
      c.expect(v.saya_sebelum === "ok:true", `the learner must be told an approved attempt waits on revision 2 (percobaan_saya): ${v.saya_sebelum ?? "no answer"}`);
      c.expect(!!v.dua?.startsWith("ok:"), `the grant must give a start through revision 2: ${v.dua ?? "no answer"}`);
      c.expect(v.tanda === "true", `revision 2's sitting must be marked with the grant it spent (percobaan_tandai): ${v.tanda ?? "no answer"}`);
      c.expect(v.saya_sesudah === "ok:false", `once spent, no approved attempt waits: ${v.saya_sesudah ?? "no answer"}`);
      c.expect(!!v.tiga && !v.tiga.startsWith("ok:") && /ATTEMPT_LIMIT_REACHED/.test(v.tiga), `a second start through revision 2 must be refused ATTEMPT_LIMIT_REACHED (the grant gives exactly one): ${v.tiga ?? "no answer"}`);
      c.expect(v.sitting === "2", `the learner must hold exactly two sittings across the line: ${v.sitting ?? "no answer"}`);
      return c.verdict("a learner of our own at a limit of one through revision 1 (handed in), with an approved further attempt on revision 1's assignment and an OPEN assignment of revision 2 on the same line: the grant counts on revision 2 (percobaan_izin_jumlah = 1), the learner is told it waits, it gives one start through revision 2, that sitting is marked with it, then nothing waits and a further start is refused ATTEMPT_LIMIT_REACHED; two sittings in all; rolled back");
    },
  },
  {
    // Sharon's condition for keeping attempt_requests_one_pending per assignment (17 Nov, after 561bcf9d): minta_percobaan
    // is the only function that inserts a request (so its lineage-root lock is the serialiser), putuskan_percobaan the only
    // one that updates one, and no client role writes the table. Read from the function catalogue and the grants, in a
    // rolled-back transaction whose plant (a second inserting function) must be reported.
    id: "A3-PG2",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const baca = (tanam: string) => {
        const sql = `begin; ${tanam}
select 'ins|' || coalesce(string_agg(p.oid::regprocedure::text, ',' order by p.oid::regprocedure::text), '') from pg_proc p
 where p.prokind in ('f', 'p') and p.prosrc ~* '\\minsert\\s+into\\s+(public\\.)?attempt_requests\\M';
select 'upd|' || coalesce(string_agg(p.oid::regprocedure::text, ',' order by p.oid::regprocedure::text), '') from pg_proc p
 where p.prokind in ('f', 'p') and p.prosrc ~* '\\mupdate\\s+(public\\.)?attempt_requests\\M';
select 'del|' || coalesce(string_agg(p.oid::regprocedure::text, ',' order by p.oid::regprocedure::text), '') from pg_proc p
 where p.prokind in ('f', 'p') and p.prosrc ~* '\\mdelete\\s+from\\s+(public\\.)?attempt_requests\\M';
select 'dyn|' || count(*) from pg_proc p where p.prokind in ('f', 'p') and p.prosrc ~* 'attempt_requests' and p.prosrc ~* '\\mexecute\\M\\s+(format|''|\\$)';
select 'hak|' || coalesce(string_agg(r || ':' || x, ',' order by r, x), '') from unnest(array['anon', 'authenticated']) r, unnest(array['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) x
 where has_table_privilege(r, 'public.attempt_requests', x);
rollback;`;
        const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", sql, db()], { encoding: "utf8" });
        const v: Record<string, string> = {};
        for (const l of r.stdout.split("\n")) { const i = l.indexOf("|"); if (i > 0) v[l.slice(0, i)] = l.slice(i + 1); }
        return { r, v };
      };
      const { r, v } = baca("");
      if (!c.expect(r.status === 0, `the catalogue could not be read: ${(r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l))}`)) return c.verdict("");
      c.expect(v.ins === "minta_percobaan(uuid,text)", `only minta_percobaan may insert into attempt_requests: ${v.ins || "none"}`);
      c.expect(v.upd === "putuskan_percobaan(uuid,boolean,text)", `only putuskan_percobaan may update attempt_requests: ${v.upd || "none"}`);
      c.expect(v.del === "", `no function may delete from attempt_requests: ${v.del}`);
      c.expect(v.dyn === "0", `a function names attempt_requests in dynamic SQL, which this reading cannot see: ${v.dyn}`);
      c.expect(v.hak === "", `a client role may write attempt_requests directly: ${v.hak}`);
      const t = baca(`create function public._a3_pg2_tanam(p uuid) returns void language sql as $t$
  insert into public.attempt_requests (institution_id, person_id, assessment_assignment_id, session_id, requested_by_person_id, reason)
  select institution_id, person_id, assessment_assignment_id, id, person_id, 'tanaman uji' from public.assessment_sessions where id = p $t$;`);
      c.expect((t.v.ins ?? "").includes("_a3_pg2_tanam"), "the plant (a second function inserting a request) was not reported");
      return c.verdict("the function catalogue (pg_proc) and the table grants: minta_percobaan is the only function that inserts into attempt_requests and putuskan_percobaan the only one that updates it; none deletes; none names it in dynamic SQL; anon and authenticated hold no INSERT, UPDATE, DELETE or TRUNCATE on it; a plant inserting from a second function is reported; rolled back");
    },
  },
  {
    // Sharon's A3-P2 item 3 (4d5cd5f6): the pair that fits the guard's removal branch, raced in both orders. The guard
    // (peran_terakhir_kode) takes the school FOR UPDATE only under p_kunci, a removal of an administrator. A is the
    // Alpha head of department, made a second administrator by the harness (committed, removed below), with no number
    // at Alpha, and Alpha is given a namespace (restored below). Every race connection rolls back. Not red on 671175e4:
    // this records the races that make item 3 a named exception (A3-P2's list), and fails if a change makes them cycle.
    id: "A3-R04X",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const psql = (sql: string) => spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", sql, db()], { encoding: "utf8" });
      spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(process.cwd(), "selftest", "db", "fable01.sql"), db()], { encoding: "utf8" });
      const orang = (e: string) => `(select ac.person_id from public.accounts ac join auth.users u on u.id = ac.auth_user_id where u.email = '${e}')`;
      const SYS = "sysadmin@synthetic.pintar.test";
      const dunia = psql(`select ${orang("alpha-hod@synthetic.pintar.test")} || '|' || (select ra.institution_id from public.role_assignments ra
          where ra.person_id = ${orang("alpha-admin@synthetic.pintar.test")} and ra.role = 'INSTITUTION_ADMIN' and ra.revoked_at is null and ra.scope_node_id = ra.institution_id limit 1)`).stdout.trim();
      const [h, sekolah] = dunia.split("|");
      if (!c.expect(!!h && !!sekolah, `the synthetic world has no Alpha head of department or school: ${dunia}`)) return c.verdict("");
      const ada = psql(`select (select count(*) from public.institutional_identities where person_id = '${h}' and institution_id = '${sekolah}') || '|' || coalesce((select namespace from public.institutions where id = '${sekolah}'), '')`).stdout.trim();
      if (!c.expect(ada === "0|", `the race needs Alpha's head of department without a number and Alpha without a namespace: ${ada}`)) return c.verdict("");
      const ra = /ID=([0-9a-f-]{36})/.exec(psql(`begin; select selftest.as_user('${SYS}'); select 'ID=' || public.grant_role('${h}', 'INSTITUTION_ADMIN', '${sekolah}', now() + interval '30 days'); commit;`).stdout)?.[1] ?? "";
      psql(`begin; set local session_replication_role = replica; update public.institutions set namespace = 'R4X' where id = '${sekolah}' and namespace is null; commit;`);
      try {
        if (!c.expect(!!ra, "the harness could not make Alpha's head of department a second administrator")) return c.verdict("");
        const terbit = `select public.issue_institutional_id('${h}', '${sekolah}') is not null`;
        const pelaku = [
          { nama: "akhiri_tugas_staf", sql: `select selftest.as_user('${SYS}'); select public.akhiri_tugas_staf('${h}', '${sekolah}', 'RESIGNATION', 'uji A3-R04X: balapan dua koneksi', null) ->> 'ok'` },
          { nama: "revoke_role", sql: `select selftest.as_user('${SYS}'); select public.revoke_role('${ra}', 'uji A3-R04X: balapan dua koneksi') is null` },
        ];
        const ringkas: string[] = [];
        for (const p of pelaku) {
          // the removal holds the person (akhiri_tugas_staf's own first lock), then the issue takes the school
          const r1 = await balapanTahan(`select 1 from public.persons where id = '${h}' for update`, p.sql, terbit);
          // the issue holds the school (its own first lock), then the removal takes the person and reaches the guard
          const r2 = await balapanTahan(`select 1 from public.institutions where id = '${sekolah}' for no key update`, terbit, p.sql);
          for (const [urutan, r] of [["person first", r1], ["school first", r2]] as const) {
            c.expect(!r.deadlock, `${p.nama} against issue_institutional_id, ${urutan}: deadlock detected (${(r.a + " / " + r.b).split("\n").find((l) => /deadlock/i.test(l))})`);
            c.expect(r.ok, `${p.nama} against issue_institutional_id, ${urutan}: a connection failed: ${r.a.split("\n").pop()} / ${r.b.split("\n").pop()}`);
            ringkas.push(`${p.nama}, ${urutan}: ${r.menunggu ? "the second waited" : "no wait"}, no deadlock`);
          }
        }
        return c.verdict(`two real connections on the seeded Alpha school, each rolled back: ${ringkas.join("; ")}. Recorded as the reason A3-P2's item 3 (issue_institutional_id against the last-administrator guard) is a named exception`);
      } finally {
        const r = psql(`begin; set local session_replication_role = replica;
          delete from public.role_assignments where id = '${ra || "00000000-0000-0000-0000-000000000000"}';
          update public.institutions set namespace = null where id = '${sekolah}' and namespace = 'R4X';
          commit; select (select count(*) from public.role_assignments where id = '${ra || "00000000-0000-0000-0000-000000000000"}') + (select count(*) from public.institutions where namespace = 'R4X');`);
        c.expect(r.status === 0 && r.stdout.trim().split("\n").pop() === "0", `the test's rows could not be removed afterwards: ${(r.stderr || r.stdout).trim().slice(0, 160)}`);
      }
    },
  },
  {
    // Sharon's defensive change (4d5cd5f6, accepted with no race reproduced): no institutions FOR UPDATE anywhere but the
    // last-administrator guard's removal branch (peran_terakhir_kode, "if p_kunci then"). Read two ways: A2A-L01's reader
    // (which records each lock's strength and the path to it) and the function source, so a reader blind spot does not
    // hide one. A plant (a function taking a school FOR UPDATE) must be reported.
    id: "A3-I1",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const baca = (tanam: string) => {
        // institutions is unranked in A2A-L01, and the reader lists only functions that touch a ranked table: it is
        // ranked for this reading only (as A3-L1P ranks its two), and A2A-L01's ranks are restored at once
        const asli = URUTAN.institutions;
        URUTAN.institutions = 8.9;
        let r: ReturnType<typeof bacaUrutan>;
        try { r = bacaUrutan(db(), tanam); } finally { if (asli === undefined) delete URUTAN.institutions; else URUTAN.institutions = asli; }
        const lewatPembaca: string[] = [];
        for (const [fn, l] of r.semua) for (const k of l) {
          if (k.t !== "institutions" || k.kuat !== 3) continue;
          const ujung = k.lewat.split(" > ").pop() ?? "";
          if (ujung !== "peran_terakhir_kode") lewatPembaca.push(`${fn} via ${k.lewat}`);
        }
        const sql = `begin; ${tanam}
select coalesce(string_agg(p.oid::regprocedure::text, ',' order by p.oid::regprocedure::text), '') from pg_proc p
 join pg_namespace n on n.oid = p.pronamespace
 where n.nspname in ('public', 'selftest') and p.prokind in ('f', 'p')
   and regexp_replace(p.prosrc, 'if p_kunci then perform 1 from public\\.institutions i where i\\.id = r\\.institution_id for update;', '', 'g')
       ~* 'from\\s+public\\.institutions\\M[^;]*\\mfor\\s+update\\M';
rollback;`;
        const q = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", sql, db()], { encoding: "utf8" });
        return { pembaca: [...new Set(lewatPembaca)], sumber: q.stdout.trim().split("\n").filter(Boolean).pop() ?? "", ok: q.status === 0, err: q.stderr };
      };
      const nyata = baca("");
      if (!c.expect(nyata.ok, `the catalogue could not be read: ${nyata.err.trim().split("\n").find((l) => /ERROR/.test(l))}`)) return c.verdict("");
      c.expect(nyata.sumber === "", `functions whose source takes institutions FOR UPDATE outside the guard's removal branch: ${nyata.sumber}`);
      c.expect(nyata.pembaca.length === 0, `A2A-L01's reader finds institutions at FOR UPDATE outside peran_terakhir_kode:\n  ${nyata.pembaca.slice(0, 12).join("\n  ")}`);
      const t = baca(`create function public._a3_i1_tanam(p uuid) returns void language plpgsql as $t$
begin perform 1 from public.institutions i where i.id = p for update; end $t$;`);
      c.expect(t.sumber.includes("_a3_i1_tanam") && t.pembaca.some((x) => x.startsWith("_a3_i1_tanam")), "the plant (a function taking a school FOR UPDATE) was not reported by both readings");
      c.expect(URUTAN.institutions === undefined, "A2A-L01's ranks were not restored after the reading");
      return c.verdict("no function takes institutions FOR UPDATE but the last-administrator guard's removal branch (peran_terakhir_kode under p_kunci), read both by A2A-L01's reader (each lock's strength and its path) and by the function source; a plant taking a school FOR UPDATE is reported by both");
    },
  },
  {
    // Sharon's A3-P2 item 1 (4d5cd5f6): confirm_my_name (account_setup FOR UPDATE through setup_saya, then the person)
    // raced against the person-first functions the reader names, in both orders: the lock path (tangguhkan_akun) and the
    // reactivation path (aktifkan_kembali_akun, on a suspension the harness makes and the product lifts). Alpha's
    // teacher's set-up is put back to REQUIRED with the name unconfirmed (committed) and restored byte-identical. Every
    // race connection rolls back. Not red on 671175e4: this records the races that make item 1 a named exception.
    id: "A3-R05N",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const psql = (sql: string) => spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", sql, db()], { encoding: "utf8" });
      spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(process.cwd(), "selftest", "db", "fable01.sql"), db()], { encoding: "utf8" });
      const SYS = "sysadmin@synthetic.pintar.test", GURU = "alpha-guru@synthetic.pintar.test";
      const g = psql(`select ac.person_id from public.accounts ac join auth.users u on u.id = ac.auth_user_id where u.email = '${GURU}'`).stdout.trim();
      const akun = g ? psql(`select a.id from public.accounts a where a.person_id = '${g}' and a.kind = 'EMAIL'`).stdout.trim() : "";
      if (!c.expect(!!g && !!akun, "the synthetic world has no Alpha teacher with an email account")) return c.verdict("");
      // the set-up's four mutable fields, as they were, kept as text to put back exactly
      const kolom = `state || '|' || coalesce(completed_at::text, '') || '|' || coalesce(password_set_at::text, '') || '|' || coalesce(name_confirmed_at::text, '')`;
      const asli = psql(`select ${kolom} from public.account_setup where account_id = '${akun}'`).stdout.trim();
      if (!c.expect(!!asli, "Alpha's teacher has no set-up row")) return c.verdict("");
      const [st, ca, ps, nc] = asli.split("|");
      const nilai = (x: string) => (x === "" ? "null" : `'${x}'::timestamptz`);
      const terbuka = () => psql(`select count(*) from public.person_suspensions where person_id = '${g}' and ended_at is null`).stdout.trim();
      if (!c.expect(terbuka() === "0", "Alpha's teacher is already suspended (the race cannot be set up)")) return c.verdict("");
      psql(`begin; set local session_replication_role = replica;
        update public.account_setup set state = 'REQUIRED', completed_at = null, name_confirmed_at = null where account_id = '${akun}'; commit;`);
      const ringkas: string[] = [];
      try {
        const konfirmasi = `select selftest.as_user('${GURU}'); select public.confirm_my_name(null) is not null`;
        const pegangOrang = `select 1 from public.persons where id = '${g}' for update`;
        const pegangSetup = `select 1 from public.account_setup where account_id = '${akun}' for update`;
        const jalur = async (nama: string, sql: string) => {
          const satu = await balapanTahan(pegangOrang, sql, konfirmasi);
          const dua = await balapanTahan(pegangSetup, konfirmasi, sql);
          for (const [urutan, r] of [["person first", satu], ["set-up first", dua]] as const) {
            c.expect(!r.deadlock, `${nama} against confirm_my_name, ${urutan}: deadlock detected (${(r.a + " / " + r.b).split("\n").find((l) => /deadlock/i.test(l))})`);
            c.expect(r.ok, `${nama} against confirm_my_name, ${urutan}: a connection failed: ${r.a.split("\n").pop()} / ${r.b.split("\n").pop()}`);
            ringkas.push(`${nama}, ${urutan}: ${r.menunggu ? "the second waited" : "no wait"}, no deadlock`);
          }
        };
        await jalur("tangguhkan_akun", `select selftest.as_user('${SYS}'); select public.tangguhkan_akun('${g}', 'ADMINISTRATIVE', 'uji A3-R05N: balapan dua koneksi') ->> 'ok'`);
        // the reactivation path: a suspension the harness makes through the product, lifted by the product afterwards
        const t = psql(`begin; select selftest.as_user('${SYS}'); select public.tangguhkan_akun('${g}', 'ADMINISTRATIVE', 'uji A3-R05N: penyiapan balapan') ->> 'ok'; commit;`);
        if (c.expect(t.status === 0 && terbuka() === "1", `the harness could not suspend Alpha's teacher: ${(t.stderr || t.stdout).trim().split("\n").pop()}`)) {
          await jalur("aktifkan_kembali_akun", `select selftest.as_user('${SYS}'); select public.aktifkan_kembali_akun('${g}', 'uji A3-R05N: balapan dua koneksi') ->> 'ok'`);
        }
      } finally {
        if (terbuka() !== "0") psql(`begin; select selftest.as_user('${SYS}'); select public.aktifkan_kembali_akun('${g}', 'uji A3-R05N: pembersihan balapan'); commit;`);
        psql(`begin; set local session_replication_role = replica;
          update public.account_setup set state = '${st}', completed_at = ${nilai(ca)}, password_set_at = ${nilai(ps)}, name_confirmed_at = ${nilai(nc)}
           where account_id = '${akun}'; commit;`);
        const kini = psql(`select ${kolom} from public.account_setup where account_id = '${akun}'`).stdout.trim();
        c.expect(kini === asli, `Alpha's teacher's set-up was not restored exactly: ${kini} (was ${asli})`);
        c.expect(terbuka() === "0", "a suspension of Alpha's teacher is left open");
      }
      return c.verdict(`two real connections on Alpha's teacher, each rolled back: ${ringkas.join("; ")}; the set-up restored exactly and the harness's suspension lifted by aktifkan_kembali_akun. Recorded as the reason A3-P2's item 1 (confirm_my_name holding account_setup before the person) is a named exception`);
    },
  },
  {
    id: "A3-R01",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankan(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      // the controls: the start and A's own answers
      c.expect(diterima(v.mulai_A), `session A starts the sitting: ${v.mulai_A}`);
      c.expect(diterima(v.A_jawab_1), `session A's answer is accepted: ${v.A_jawab_1}`);
      c.expect(diterima(v.A_jawab_3), `session A's next answer is accepted (the control): ${v.A_jawab_3}`);
      c.expect(diterima(v.A_jeda) && diterima(v.A_lanjut), `session A pauses and resumes its own sitting: ${v.A_jeda}, ${v.A_lanjut}`);
      // case 1
      c.expect(!diterima(v.B_jawab_2), `case 1: session B's answer to another question must be refused, the sitting has one writer: ${v.B_jawab_2}`);
      c.expect(!diterima(v.B_timpa_1), `case 1: session B's later, higher-sequence answer to A's question must be refused: ${v.B_timpa_1}`);
      c.expect(v.akhir_1 === v.akhir_1_A, `case 1: the final answer to question 1 stays session A's (${v.akhir_1_A}), never the other session's: ${v.akhir_1}`);
      // case 3
      c.expect(!diterima(v.B_jawab_4_jeda), `case 3: session B answering while A has paused must be refused: ${v.B_jawab_4_jeda}`);
      // no verified session
      c.expect(!diterima(v.NONE_jawab_5), `a caller with no verified session id must be refused, never treated as any writer: ${v.NONE_jawab_5}`);
      // case 2's root
      c.expect(!diterima(v.B_serahkan), `case 2: session B handing in A's sitting must be refused: ${v.B_serahkan}`);
      return c.verdict(
        "two signed-in sessions of one learner, one sitting: started and answered on session A; session B's answers, its higher-sequence overwrite, its answer while A is paused and its hand-in are each refused, and the final answer stays A's; a caller with no verified session id is refused; A's own answers, pause and resume are accepted",
      );
    },
  },
  {
    // Sharon (A3-P, 4bfdd1cb; 6e6e69d6): S11 by its code. A verified token with no session id is refused
    // SITTING_NOT_CONTROLLER at the start and at an answer; never treated as any writer.
    id: "A3-C01",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankan(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      c.expect(v.NONE_mulai === "PR170:SITTING_NOT_CONTROLLER", `a start with no session id must be refused SITTING_NOT_CONTROLLER: ${v.NONE_mulai}`);
      c.expect(v.NONE_jawab_5 === "PR170:SITTING_NOT_CONTROLLER", `an answer with no session id must be refused SITTING_NOT_CONTROLLER: ${v.NONE_jawab_5}`);
      return c.verdict("executes start_learning_session and record_answer against the migrations, rolled back, with a verified token carrying no session id: both are refused PR170 SITTING_NOT_CONTROLLER (S11), the start before any other check");
    },
  },
  {
    // Sharon (4bfdd1cb; 6e6e69d6): a second session of one person is refused by name, at an answer and at a hand-in
    id: "A3-C02",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankan(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      for (const k of ["B_jawab_2", "B_timpa_1", "B_jawab_4_jeda", "B_serahkan"]) c.expect(v[k] === "PR170:SITTING_NOT_CONTROLLER", `${k}: session B must be refused SITTING_NOT_CONTROLLER: ${v[k]}`);
      return c.verdict("executes record_answer and submit_session against the migrations, rolled back: a second signed-in session of the sitting's own learner is refused PR170 SITTING_NOT_CONTROLLER at its answer, its higher-sequence overwrite, its answer while paused and its hand-in");
    },
  },
  {
    // Sharon 6e6e69d6 (b): the D6 claim executed, not only read. A sitting with no controller (one open when A3 lands)
    // is claimed by its first touch, here through assistance_state, exactly once; the other session is then refused.
    id: "A3-C03",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankan(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      c.expect(v.klaim_B_pengendali === "true", `the first touch (assistance_state, session B) must claim the uncontrolled sitting: ${v.klaim_B_pengendali} (${v.klaim_B})`);
      c.expect(v.klaim_A_ditolak === "PR170:SITTING_NOT_CONTROLLER", `once claimed, session A's answer must be refused SITTING_NOT_CONTROLLER: ${v.klaim_A_ditolak}`);
      c.expect(/^ok:/.test(v.klaim_B_lagi ?? "") && v.klaim_sekali === "true", `the claim must be once: B touches again and stays the controller: ${v.klaim_B_lagi} / ${v.klaim_sekali}`);
      return c.verdict("executes assistance_state against the migrations, rolled back: a sitting whose controller is null is claimed by the first session to touch it (assistance_state on an unviewed item, through note_item_view and the gate); the other session's answer is then refused PR170 SITTING_NOT_CONTROLLER; the claimer's next touch leaves it the controller (claimed once)");
    },
  },
  {
    // Sharon 6e6e69d6: D8, the final answer after a generation bump
    id: "A3-C04",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankan(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      c.expect(/^ok:/.test(v.gen1_jawab ?? "") && /^ok:/.test(v.gen2_jawab ?? ""), `the controller's two answers must be accepted: ${v.gen1_jawab} / ${v.gen2_jawab}`);
      c.expect(!!v.gen_akhir && v.gen_akhir !== "no-column" && v.gen_akhir === v.gen_akhir_harap,
        `after the generation bump, the newer generation's answer (client_seq 2) must be final over the older's (client_seq 5): ${v.gen_akhir}; expected ${v.gen_akhir_harap}`);
      return c.verdict("executes record_answer and session_final_responses against the migrations, rolled back: an answer at client_seq 5 under generation 1, then, after the generation is raised, an answer at client_seq 2: the final answer is the newer generation's, though its sequence is lower");
    },
  },
  {
    // Sharon 6e6e69d6: the insert trigger ASSIGNS the controller from the verified claims and generation 1, whatever the
    // row supplied. Executed, then a plant in the same rolled-back transaction (a variant that keeps supplied values) is
    // shown caught by the same check.
    id: "A3-C05",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const sql = `begin;
do $c5$
declare t record; v_lain uuid := gen_random_uuid(); v_sesi uuid := gen_random_uuid(); v_id uuid; r text; p text;
begin
  if to_regprocedure('public.assessment_sessions_pengendali()') is null then raise notice 'C5|no-trigger'; return; end if;
  for t in select tgname from pg_trigger where tgrelid = 'public.assessment_sessions'::regclass and not tgisinternal
             and tgname <> 'assessment_sessions_pengendali' loop
    execute format('alter table public.assessment_sessions disable trigger %I', t.tgname);
  end loop;
  perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated', 'session_id', v_sesi)::text, true);
  v_id := gen_random_uuid();
  execute 'insert into public.assessment_sessions select (jsonb_populate_record(s, jsonb_build_object(''id'', $1, ''pengendali_sesi'', $2, ''generasi'', 7))).*
             from public.assessment_sessions s limit 1' using v_id, v_lain;
  execute 'select (pengendali_sesi = $2)::text || ''/'' || generasi from public.assessment_sessions where id = $1' into r using v_id, v_sesi;
  -- the plant: a trigger that keeps what the writer supplied
  execute $p$create or replace function public.assessment_sessions_pengendali() returns trigger language plpgsql as $b$
    begin new.pengendali_sesi := coalesce(new.pengendali_sesi, public.sesi_saya()); new.generasi := coalesce(new.generasi, 1); return new; end $b$$p$;
  v_id := gen_random_uuid();
  execute 'insert into public.assessment_sessions select (jsonb_populate_record(s, jsonb_build_object(''id'', $1, ''pengendali_sesi'', $2, ''generasi'', 7))).*
             from public.assessment_sessions s limit 1' using v_id, v_lain;
  execute 'select (pengendali_sesi = $2)::text || ''/'' || generasi from public.assessment_sessions where id = $1' into p using v_id, v_sesi;
  raise notice 'C5|%|%', r, p;
end $c5$;
rollback;`;
      const o = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", sql, db()], { encoding: "utf8" });
      const baris = (o.stderr || "").split("\n").find((l) => /C5\|/.test(l)) ?? "";
      const [, nyata, tanam] = (/C5\|([^|]*)\|?(.*)$/.exec(baris) ?? []);
      if (!c.expect(o.status === 0, `the probe failed: ${(o.stderr || "").split("\n").find((l) => /ERROR/.test(l))}`)) return c.verdict("");
      c.expect(nyata === "true/1", `a sitting inserted with a supplied controller and generation 7 must get the verified session and generation 1: ${nyata || baris}`);
      c.expect(tanam === "false/7", `the plant (a trigger keeping supplied values) must be caught by the same check: ${tanam}`);
      return c.verdict("executes an insert into assessment_sessions against the migrations, rolled back, the row supplying another controller and generation 7: the trigger assigns the verified session (sesi_saya()) and generation 1; a planted trigger that keeps the supplied values, installed in the same transaction, reads false/7 and is caught");
    },
  },
  {
    // Sharon 6e6e69d6 (a): the gate is not a boundary. Its callers are exactly the eight she named, each VOLATILE (a
    // STABLE caller would fail only on the claim's path); EXECUTE is revoked from public, anon and authenticated; it has
    // no client_rpc_registry row.
    id: "A3-C06",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const satu = (q: string) => spawnSync("psql", ["-qAt", "-c", q, db()], { encoding: "utf8" }).stdout.trim();
      const HARAP = ["assistance_state", "finish_my_session", "note_item_view", "open_assistance", "pause_session", "record_answer", "resume_session", "submit_session"];
      // every public function that reaches the gate, directly or through another that does (the lock report's reach)
      const pemanggil = satu(`with recursive r(nama) as (
            select 'pengerjaan_gerbang'::text collate "C"
            union
            select p.proname::text collate "C" from pg_proc p join r on p.prosrc ~ ('\\m' || r.nama || '\\(')
             where p.pronamespace = 'public'::regnamespace)
          select string_agg(nama, ',' order by nama) from r where nama <> 'pengerjaan_gerbang'`);
      c.expect(pemanggil === HARAP.join(","), `the gate's callers must be exactly ${HARAP.join(", ")}: ${pemanggil}`);
      const tidakVolatile = satu(`select coalesce(string_agg(proname, ','), '') from pg_proc where pronamespace = 'public'::regnamespace
          and proname in (${HARAP.map((x) => `'${x}'`).join(",")}) and provolatile <> 'v'`);
      c.expect(tidakVolatile === "", `the gate's callers must all be VOLATILE: ${tidakVolatile}`);
      const hak = satu(`select has_function_privilege('anon', 'public.pengerjaan_gerbang(uuid, text)', 'execute')::text || '|'
          || has_function_privilege('authenticated', 'public.pengerjaan_gerbang(uuid, text)', 'execute')::text || '|'
          || (select count(*) from public.client_rpc_registry where function_name = 'pengerjaan_gerbang')`);
      c.expect(hak === "false|false|0", `the gate must not be a boundary (anon, authenticated, registry rows): ${hak}`);
      c.expect(/pengendali_sesi/.test(satu("select prosrc from pg_proc where proname = 'pengerjaan_gerbang'")), "the gate does not check the controller");
      return c.verdict("reads the catalogue (prosrc, provolatile, the function ACL) and client_rpc_registry: pengerjaan_gerbang checks the controller; its callers are exactly record_answer, submit_session, pause_session, resume_session, finish_my_session, note_item_view, open_assistance and assistance_state, each VOLATILE; neither anon nor authenticated may execute it; it has no registry row");
    },
  },
  {
    // Sharon's case 3 for A2A-L01's report (b94b3909, A3-DIFFS-671175e4.md): the gate's sitting appears at strength 2
    // before the gate's own FOR UPDATE (token 29, pengerjaan_keluar_terapkan's UPDATE), only inside pengerjaan_pagar's
    // branches, each of which takes the sitting FOR UPDATE before it updates it. That is the exception, pinned here: each
    // of the four functions takes `select … from public.assessment_sessions where id = p_session for update` before any
    // UPDATE of assessment_sessions in its body. A plant moving an UPDATE above the FOR UPDATE, rolled back, is reported.
    id: "A3-C07",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const FUNGSI = ["pengerjaan_lepas_darurat", "pengerjaan_kredit_darurat", "pengerjaan_keluar_terapkan", "pengerjaan_putus_tenggat"];
      const baca = (tanam: string) => {
        const sql = `begin; ${tanam}
select proname || '|' || translate(encode(convert_to(prosrc, 'UTF8'), 'base64'), E'\\n', '') from pg_proc
 where pronamespace = 'public'::regnamespace and proname in (${FUNGSI.map((f) => `'${f}'`).join(",")});
rollback;`;
        const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", sql, db()], { encoding: "utf8" });
        const v: Record<string, string> = {};
        for (const l of r.stdout.split("\n")) { const i = l.indexOf("|"); if (i > 0) v[l.slice(0, i)] = Buffer.from(l.slice(i + 1).replace(/\s/g, ""), "base64").toString("utf8"); }
        return { r, v };
      };
      // the first sitting FOR UPDATE on p_session, and the first UPDATE of assessment_sessions, in the body without comments
      const urutan = (src: string) => {
        const b = src.replace(/--[^\n]*/g, "");
        const fu = b.search(/\bselect\b[^;]*?\bfrom\s+public\.assessment_sessions\s+where\s+id\s*=\s*p_session\s+for\s+update\b/i);
        const up = b.search(/\bupdate\s+public\.assessment_sessions\b/i);
        return { fu, up, baik: fu >= 0 && (up < 0 || fu < up) };
      };
      const { r, v } = baca("");
      if (!c.expect(r.status === 0, `the catalogue could not be read: ${(r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l))}`)) return c.verdict("");
      for (const f of FUNGSI) {
        if (!c.expect(f in v, `${f} is not in the catalogue`)) continue;
        const u = urutan(v[f]);
        c.expect(u.baik, `${f} must take the sitting FOR UPDATE (where id = p_session) before any UPDATE of assessment_sessions: FOR UPDATE at ${u.fu}, first UPDATE at ${u.up}`);
        c.expect(u.up >= 0, `${f} no longer updates the sitting; the case-3 exception names it, so restate the exception`);
      }
      // the plant: pengerjaan_kredit_darurat with an UPDATE of the sitting moved above its FOR UPDATE
      const t = baca(`do $t$ declare f oid := 'public.pengerjaan_kredit_darurat(uuid)'::regprocedure; s text; begin
  select prosrc into s from pg_proc where oid = f;
  s := regexp_replace(s, '(\\mbegin\\M)', E'\\\\1\\n  update public.assessment_sessions set darurat_dikredit_sampai = darurat_dikredit_sampai where id = p_session;');
  execute format('create or replace function public.pengerjaan_kredit_darurat(%s) returns %s language plpgsql security definer set search_path = public, pg_temp as %L',
    pg_get_function_arguments(f), pg_get_function_result(f), s);
end $t$;`);
      if (!c.expect(t.r.status === 0, `the plant could not be installed: ${(t.r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l))}`)) return c.verdict("");
      const tu = urutan(t.v.pengerjaan_kredit_darurat ?? "");
      c.expect(tu.fu >= 0 && tu.up >= 0 && tu.up < tu.fu && !tu.baik, `the plant (an UPDATE of the sitting above pengerjaan_kredit_darurat's FOR UPDATE) was not reported: FOR UPDATE at ${tu.fu}, first UPDATE at ${tu.up}`);
      return c.verdict(`reads the function catalogue: each of ${FUNGSI.join(", ")} takes the sitting FOR UPDATE (select … from public.assessment_sessions where id = p_session for update) before any UPDATE of assessment_sessions in its body, so the gate's sitting at strength 2 before the gate's FOR UPDATE in A2A-L01's report (pengerjaan_pagar's branches) is always already held FOR UPDATE (Sharon's case 3, b94b3909); a plant moving an UPDATE above the FOR UPDATE is reported; rolled back`);
    },
  },
  {
    // A3, ruling 46 (Sharon's lineage design, 478c8750): REPLACES A3-R1V, whose claim was false (a sat ad-hoc definition's
    // version is NOT immutable: enforce_taught_content_immutable exempts ad-hoc definitions; the full suite on 8861ffc3
    // found one). The start's key and may_start's count use the lineage root instead, which this pins.
    id: "A3-LN1",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const sql = `begin;
create function pg_temp.coba(p_sql text) returns text language plpgsql as $f$
declare v text; s text; m text;
begin
  execute p_sql into v; return 'ok:' || coalesce(v, '');
exception when others then get stacked diagnostics s = returned_sqlstate, m = message_text; return s || ':' || left(m, 120);
end $f$;
select 'kolom|' || coalesce((select (is_nullable = 'NO')::text from information_schema.columns
  where table_schema = 'public' and table_name = 'assessment_definitions' and column_name = 'lineage_root_definition_id'), 'absent');
select 'akar_diri|' || pg_temp.coba($s$select count(*)::text from public.assessment_definitions d where d.lineage_root_definition_id is null
  or not exists (select 1 from public.assessment_definitions r where r.id = d.lineage_root_definition_id and r.lineage_root_definition_id = r.id
                  and r.institution_id = d.institution_id)$s$);
select 'periksa|' || pg_temp.coba($s$select public.garis_definisi_periksa()::text$s$);
-- a chapter of our own, still being drafted (the harness's hand): a course and a module copied at INGESTED, so the
-- definitions below go in under every guard but the frozen-content one, which protects sealed courses
set local session_replication_role = replica;
insert into public.courses select (jsonb_populate_record(c, jsonb_build_object('id', 'a3a1e000-0000-4000-8000-a30100000008', 'status', 'INGESTED'))).*
  from public.courses c where c.id = (select m.course_id from public.modules m
    where m.id = (select d.module_id from public.assessment_definitions d where d.module_id is not null order by d.id limit 1));
insert into public.modules select (jsonb_populate_record(m, jsonb_build_object('id', 'a3a1e000-0000-4000-8000-a30100000009',
    'course_id', 'a3a1e000-0000-4000-8000-a30100000008', 'status', 'INGESTED'))).*
  from public.modules m where m.id = (select d.module_id from public.assessment_definitions d where d.module_id is not null order by d.id limit 1);
set local session_replication_role = origin;
-- a definition inserted without a root is its own root
select 'baru|' || pg_temp.coba($s$with x as (insert into public.assessment_definitions
    select (jsonb_populate_record(d, jsonb_build_object('id', 'a3a1e000-0000-4000-8000-a30100000001', 'version', d.version + 100,
      'lineage_root_definition_id', null, 'status', 'INGESTED', 'module_id', 'a3a1e000-0000-4000-8000-a30100000009'))).* from public.assessment_definitions d where d.module_id is not null order by d.id limit 1
    returning id, lineage_root_definition_id) select (lineage_root_definition_id = id)::text from x$s$);
-- a revision of our own, on the original's line (root copied whole), for the update and the plant to aim at
select 'revisi|' || pg_temp.coba($s$with x as (insert into public.assessment_definitions
    select (jsonb_populate_record(d, jsonb_build_object('id', 'a3a1e000-0000-4000-8000-a30100000007', 'version', d.version + 500,
      'status', 'INGESTED', 'module_id', 'a3a1e000-0000-4000-8000-a30100000009'))).* from public.assessment_definitions d where d.module_id is not null order by d.id limit 1
    returning id, lineage_root_definition_id) select (lineage_root_definition_id <> id)::text from x$s$);
-- the root cannot change
select 'ubah|' || pg_temp.coba($s$update public.assessment_definitions set lineage_root_definition_id = id
  where id = 'a3a1e000-0000-4000-8000-a30100000007' returning 'UPDATED'$s$);
-- a root must be a root of the same school
select 'bukan_akar|' || pg_temp.coba($s$with x as (insert into public.assessment_definitions
    select (jsonb_populate_record(d, jsonb_build_object('id', 'a3a1e000-0000-4000-8000-a30100000002', 'version', d.version + 200,
      'lineage_root_definition_id', 'a3a1e000-0000-4000-8000-a30100000007', 'status', 'INGESTED', 'module_id', 'a3a1e000-0000-4000-8000-a30100000009'))).*
      from public.assessment_definitions d where d.module_id is not null order by d.id limit 1 returning 'INSERTED') select * from x$s$);
-- the plant: the root's guard trigger disabled, the same update goes through
alter table public.assessment_definitions disable trigger assessment_definitions_lineage_root;
select 'tanam|' || pg_temp.coba($s$update public.assessment_definitions set lineage_root_definition_id = id
  where id = 'a3a1e000-0000-4000-8000-a30100000007' returning 'UPDATED'$s$);
rollback;`;
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=0", "-qAt", "-c", sql, db()], { encoding: "utf8" });
      const v: Record<string, string> = {};
      for (const l of r.stdout.split("\n")) { const i = l.indexOf("|"); if (i > 0) v[l.slice(0, i)] = l.slice(i + 1); }
      c.expect(v.kolom === "true", `assessment_definitions.lineage_root_definition_id must exist and be NOT NULL: ${v.kolom ?? "no answer"}`);
      c.expect(v.akar_diri === "ok:0", `every definition's root must be a root (its own root) of the same school: ${v.akar_diri ?? "no answer"}`);
      c.expect(v.periksa === "ok:0", `the line check must find no definition with more than one predecessor: ${v.periksa ?? "no answer"}`);
      c.expect(v.baru === "ok:true", `a definition inserted without a root must be its own root: ${v.baru ?? "no answer"}`);
      c.expect(v.revisi === "ok:true", `a definition inserted with its original's root must keep it (a revision on the line): ${v.revisi ?? "no answer"}`);
      c.expect(!!v.ubah && !v.ubah.startsWith("ok:"), `a definition's root must not change: ${v.ubah ?? "no answer"}`);
      c.expect(!!v.bukan_akar && !v.bukan_akar.startsWith("ok:"), `a root that is not itself a root must be refused: ${v.bukan_akar ?? "no answer"}`);
      c.expect(v.tanam === "ok:UPDATED", `the plant (the root's guard disabled) must let the root change, or this pin proves nothing: ${v.tanam ?? "no answer"}`);
      return c.verdict("assessment_definitions.lineage_root_definition_id exists, NOT NULL, and every root is a root of its own school; the line check finds no definition with two predecessors; a new definition is its own root; a root never changes, and a root that is not a root is refused; with the guard's trigger disabled (the plant) the change goes through; rolled back");
    },
  },
  {
    // A3, ruling 46: the line check refuses an ambiguous predecessor (Sharon, 478c8750: "verifies that every non-root
    // revision found exactly one predecessor, or it refuses"). A revised course's definition is given a second same-titled,
    // same-mode definition in the course it supersedes (the harness's hand, rolled back): the check must refuse.
    id: "A3-LN2",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const sql = `begin;
create function pg_temp.coba(p_sql text) returns text language plpgsql as $f$
declare v text; s text; m text;
begin
  execute p_sql into v; return 'ok:' || coalesce(v, '');
exception when others then get stacked diagnostics s = returned_sqlstate, m = message_text; return s || ':' || left(m, 160);
end $f$;
create temp table ln2 on commit drop as
select d0.* from public.assessment_definitions d0 where d0.module_id is not null and not d0.is_ad_hoc order by d0.id limit 1;
select 'ada|' || count(*) from ln2;
set local session_replication_role = replica;
-- revision 2 of the course (supersedes it), its module's revision (supersedes the module), and revision 2 of the
-- definition in that module (version + 300): exactly one predecessor, as salin_kursus_revisi makes them
insert into public.courses select (jsonb_populate_record(c, jsonb_build_object('id', 'a3a1e000-0000-4000-8000-a30100000004', 'supersedes_course_id', c.id))).*
  from public.courses c where c.id = (select m.course_id from public.modules m where m.id = (select module_id from ln2));
insert into public.modules select (jsonb_populate_record(m, jsonb_build_object('id', 'a3a1e000-0000-4000-8000-a30100000006',
    'course_id', 'a3a1e000-0000-4000-8000-a30100000004', 'supersedes_module_id', m.id))).*
  from public.modules m where m.id = (select module_id from ln2);
insert into public.assessment_definitions select (jsonb_populate_record(d0, jsonb_build_object('id', 'a3a1e000-0000-4000-8000-a30100000005',
    'module_id', 'a3a1e000-0000-4000-8000-a30100000006', 'version', d0.version + 300))).*
  from public.assessment_definitions d0 where d0.id = (select id from ln2);
set local session_replication_role = origin;
select 'tunggal|' || pg_temp.coba($s$select public.garis_definisi_periksa()::text$s$);
-- a second same-titled, same-mode definition in the superseded module: two predecessors
set local session_replication_role = replica;
insert into public.assessment_definitions select (jsonb_populate_record(d0, jsonb_build_object('id', 'a3a1e000-0000-4000-8000-a30100000003', 'version', d0.version + 400))).*
  from public.assessment_definitions d0 where d0.id = (select id from ln2);
set local session_replication_role = origin;
select 'ganda|' || pg_temp.coba($s$select public.garis_definisi_periksa()::text$s$);
rollback;`;
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=0", "-qAt", "-c", sql, db()], { encoding: "utf8" });
      const v: Record<string, string> = {};
      for (const l of r.stdout.split("\n")) { const i = l.indexOf("|"); if (i > 0) v[l.slice(0, i)] = l.slice(i + 1); }
      if (!c.expect(v.ada === "1", `the world must hold a course's definition to revise (the case cannot be set up): ${v.ada ?? "no answer"}`)) return c.verdict("");
      c.expect(v.tunggal === "ok:0", `a revision with exactly one predecessor must pass the line check: ${v.tunggal ?? "no answer"}`);
      c.expect(!!v.ganda && !v.ganda.startsWith("ok:") && /predecessor|pendahulu/i.test(v.ganda), `a revision with two same-titled, same-mode predecessors must be refused by the line check: ${v.ganda ?? "no answer"}`);
      return c.verdict("a revision of a course (supersedes_course_id) with a revision of its definition passes garis_definisi_periksa, the check the lineage backfill runs; given a second same-titled, same-mode definition in the course it supersedes, the check refuses; rolled back");
    },
  },
  {
    // A3, ruling 46, a sibling the lineage sweep missed: percobaan_terpakai (20270114100000) is A1's count of "an attempt",
    // which its own comment says mirrors may_start_assessment's. may_start now counts across the lineage; this count
    // still matched one definition and version, so percobaan_tandai would leave a sitting on revision 2 after one on
    // revision 1 unmarked (an approved request never spent) and minta_percobaan would read the learner as within limit.
    id: "A3-PT1",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const sql = `begin;
create temp table pt1 on commit drop as
select s.person_id, s.assessment_assignment_id aa1, s.assessment_definition_id d1 from public.assessment_sessions s
  join public.assessment_definitions d on d.id = s.assessment_definition_id
 where s.assessment_assignment_id is not null and d.attempt_limit is not null
   and coalesce(s.termination_cause::text, '') not in ('INSTITUTIONAL_REVOCATION', 'ADMINISTRATIVE_TERMINATION')
 order by s.id limit 1;
select 'ada|' || count(*) from pt1;
-- revision 2 of the sitting's assessment, on its line, and an OPEN assignment of it in the same school and year
-- (the harness's hand, rolled back): the learner has no sitting under it yet
set local session_replication_role = replica;
insert into public.assessment_definitions select (jsonb_populate_record(d, jsonb_build_object('id', 'a3a1e000-0000-4000-8000-a30100000010',
    'version', d.version + 600))).* from public.assessment_definitions d where d.id = (select d1 from pt1);
insert into public.assessment_assignments select (jsonb_populate_record(aa, jsonb_build_object('id', 'a3a1e000-0000-4000-8000-a30100000011',
    'assessment_definition_id', 'a3a1e000-0000-4000-8000-a30100000010'))).* from public.assessment_assignments aa where aa.id = (select aa1 from pt1);
set local session_replication_role = origin;
select 'satu|' || public.percobaan_terpakai(person_id, aa1) from pt1;
select 'dua|' || public.percobaan_terpakai(person_id, 'a3a1e000-0000-4000-8000-a30100000011') from pt1;
rollback;`;
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=0", "-qAt", "-c", sql, db()], { encoding: "utf8" });
      const v: Record<string, string> = {};
      for (const l of r.stdout.split("\n")) { const i = l.indexOf("|"); if (i > 0) v[l.slice(0, i)] = l.slice(i + 1); }
      if (!c.expect(v.ada === "1", `the world must hold a learner's counted sitting of a limited assessment (the case cannot be set up): ${v.ada ?? "no answer"} ${(r.stderr || "").trim().split("\n")[0] ?? ""}`)) return c.verdict("");
      c.expect(Number(v.satu) >= 1, `the sitting's own assignment must count it: ${v.satu ?? "no answer"}`);
      c.expect(v.dua === v.satu, `revision 2's assignment must count the revision-1 sitting as may_start_assessment does (ruling 46): ${v.dua ?? "no answer"} against ${v.satu ?? "no answer"}`);
      return c.verdict("percobaan_terpakai, A1's count of an attempt, counts a learner's sitting on revision 1 of an assessment under an OPEN assignment of revision 2 in the same school and year (the harness's hand, rolled back), as may_start_assessment counts it across the lineage");
    },
  },
];
