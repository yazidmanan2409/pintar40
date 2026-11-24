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
/** The sitting's first presented item that has not been viewed yet (assistance_state reaches note_item_view only then). */
const BELUM_DILIHAT = `(select p.id from public.presented_items p where p.session_id = current_setting('a3.s')::uuid
  and not exists (select 1 from public.presented_item_views w where w.presented_item_id = p.id) order by p.position limit 1)`;
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
    -- A3-V01 (Sharon V-1, 627d66d4): a HELD sitting. Before A3 the item view ran only the fence, and A1's hold refuses an
    -- answer, a hand-in and the learner's own pause or resume (20270114100000, its codes' table), never a view. Through the
    -- gate the view must still not be refused by the hold, directly or through assistance_state on an unviewed item; the
    -- controller's answer is (the control). Each probe rolls back.
    set local session_replication_role = replica;
    execute 'update public.assessment_sessions set frozen_at = now(), frozen_cause = ''ACCOUNT_SUSPENDED'', unfrozen_at = null, unfrozen_by_person_id = null where id = $1' using v_s;
    set local session_replication_role = origin;
    execute 'select public.pengerjaan_ditahan(s)::text from public.assessment_sessions s where s.id = $1' into v_t using v_s;
    v := v || jsonb_build_object('tahan', v_t, 'tahan_belum_dilihat', (select count(*)::text from public.presented_items p
          where p.session_id = v_s and not exists (select 1 from public.presented_item_views w where w.presented_item_id = p.id)));
    v := v || jsonb_build_object('tahan_lihat', pg_temp.a3x('B', ${q(`select public.note_item_view(${BELUM_DILIHAT})::text`)}));
    v := v || jsonb_build_object('tahan_bantuan', pg_temp.a3x('B', ${q(`select (public.assistance_state(${BELUM_DILIHAT})).answered::text`)}));
    v := v || jsonb_build_object('tahan_jawab', pg_temp.a3x('B', ${q(jawab(3, 11, true))}));
    -- A3-V02 (Sharon V-2, f6d3a2cb): the D6 claim is written only on an open sitting. An ENDED sitting with no controller,
    -- touched by its learner's item view, keeps no controller: nothing is written to an ended sitting.
    set local session_replication_role = replica;
    execute 'update public.assessment_sessions set frozen_at = null, frozen_cause = null, unfrozen_at = null, unfrozen_by_person_id = null,
      status = ''SUBMITTED'', pengendali_sesi = null where id = $1' using v_s;
    set local session_replication_role = origin;
    v := v || jsonb_build_object('selesai_lihat', pg_temp.a3('B', ${q(`select public.note_item_view(${BELUM_DILIHAT})::text`)}));
    perform selftest.as_owner();
    execute 'select coalesce(pengendali_sesi::text, ''null'') || ''|'' || status::text from public.assessment_sessions where id = $1' into v_t using v_s;
    v := v || jsonb_build_object('selesai_pengendali', v_t);
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

/**
 * The recovery act's scenario (A3-PEMULIHAN.md; A3-P01..P09), red first: one rolled-back transaction, a learner of the
 * seeded learning-cycle Kelas with three verified sessions (A, B, C), the cycle's teacher (T) and another school's
 * teacher (L). Each probe is kept as «ok:<value>» or «<SQLSTATE>:<DETAIL>»; the x-probes roll back.
 */
function skenarioPulih(): string {
  const S = (n: number) => `(select p.id from public.presented_items p where p.session_id = current_setting('p.s')::uuid order by p.position offset ${n - 1} limit 1)`;
  const J = (n: number, seq: number) => `select x.outcome from public.record_answer(${S(n)}, ${seq}, selftest.f09_answer(${S(n)}, true)) x`;
  const P = (k: string, siapa: string, sesi: string, sql: string, x = false) =>
    `v := v || jsonb_build_object('${k}', pg_temp.p${x ? "x" : ""}('${siapa}', '${sesi}', $q$${sql}$q$));`;
  const lanjut = (id = "current_setting('p.s')::uuid") => `select public.lanjutkan_di_sini(${id})::text`;
  const izin = (id = "current_setting('p.post')::uuid") => `select public.izinkan_lanjut(${id}, 'perangkat murid mati saat Uji Penguasaan')::text`;
  const jejak = `(select md5(coalesce(string_agg(r.id::text || r.client_seq || r.value::text || r.received_at::text, ',' order by r.id), ''))
     from public.responses r join public.presented_items p on p.id = r.presented_item_id where p.session_id = current_setting('p.s')::uuid)`;
  const keadaan = `(select coalesce(s.pengendali_sesi::text, 'null') || '|' || s.generasi || '|' || s.status || '|' || coalesce(s.authoritative_deadline::text, '-')
     from public.assessment_sessions s where s.id = current_setting('p.s')::uuid)`;
  return `
begin;
create function pg_temp.p(p_siapa text, p_sesi text, p_sql text)
returns text language plpgsql as $f$
declare v_out text; v_state text; v_detail text; v_msg text; v_val text; v_u uuid := current_setting('p.u_' || p_siapa)::uuid;
begin
  begin
    reset role;
    perform set_config('request.jwt.claims', case p_sesi
      when 'NONE' then json_build_object('sub', v_u, 'role', 'authenticated')
      else json_build_object('sub', v_u, 'role', 'authenticated', 'session_id', current_setting('p.sesi_' || p_sesi)) end::text, true);
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
create function pg_temp.px(p_siapa text, p_sesi text, p_sql text)
returns text language plpgsql as $f$
declare v_out text;
begin
  begin
    v_out := pg_temp.p(p_siapa, p_sesi, p_sql);
    raise exception 'px-rollback';
  exception when others then
    if sqlerrm <> 'px-rollback' then v_out := coalesce(v_out, 'probe-error:' || sqlerrm); end if;
  end;
  return v_out;
end $f$;
create temp table p_snap (v jsonb) on commit drop;
do $p$
declare v jsonb := '{}'::jsonb; f record; v_k uuid; v_u uuid; v_p uuid; v_e uuid; v_s uuid; v_post uuid; v_sebelum text; st text;
begin
  perform selftest.as_owner();
  perform set_config('p.tag', to_char(clock_timestamp(), 'HH24MISSUS'), true);
  perform set_config('p.sesi_A', gen_random_uuid()::text, true);
  perform set_config('p.sesi_B', gen_random_uuid()::text, true);
  perform set_config('p.sesi_C', gen_random_uuid()::text, true);
  perform set_config('p.sesi_T', gen_random_uuid()::text, true);
  perform set_config('p.sesi_L', gen_random_uuid()::text, true);
  select * into f from selftest.cycle_fixture();
  if f.aa_pre is null then raise exception 'the learning-cycle fixture is absent'; end if;
  select la.node_id into v_k from public.learning_assignments la where la.id = f.la;
  v_u := selftest.f06p10_person('p-murid-' || current_setting('p.tag'));
  select a.person_id into v_p from public.accounts a where a.auth_user_id = v_u;
  insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
  select v_p, e.institution_id, e.academic_period_id, e.programme_id, 'ACTIVE'
    from public.memberships mm join public.enrollments e on e.id = mm.enrollment_id
   where mm.node_id = v_k and mm.valid_to is null limit 1
  returning id into v_e;
  insert into public.memberships (enrollment_id, node_id, academic_period_id)
  select v_e, v_k, e.academic_period_id from public.enrollments e where e.id = v_e;
  perform set_config('p.u_M', v_u::text, true);
  perform set_config('p.kelas', v_k::text, true);
  perform set_config('p.p', v_p::text, true);
  perform set_config('p.aa_post', f.aa_post::text, true);
  perform set_config('p.u_T', (select id::text from auth.users where email = 'siklus-guru@synthetic.pintar.test'), true);
  perform set_config('p.u_L', (select id::text from auth.users where email = 'alpha-guru@synthetic.pintar.test'), true);
  set local session_replication_role = replica;
  update public.assessment_definitions d set allows_pause = true
    from public.assessment_assignments aa where aa.id = f.aa_pre and d.id = aa.assessment_definition_id;
  set local session_replication_role = origin;
  -- the low-stakes sitting (Pemetaan Awal), started and answered on session A
  v := v || jsonb_build_object('mulai', pg_temp.p('M', 'A', format('select public.start_learning_session(%L)::text', f.aa_pre)));
  select s.id into v_s from public.assessment_sessions s where s.person_id = v_p and s.assessment_assignment_id = f.aa_pre;
  if v_s is null then raise exception 'the sitting was not started: %', v ->> 'mulai'; end if;
  perform set_config('p.s', v_s::text, true);
  -- (client_seq 5, so A3-P14 can show a later generation winning at a LOWER sequence)
  ${P("A_jawab", "M", "A", J(1, 5))}
  v_sebelum := ${keadaan};
  v := v || jsonb_build_object('sebelum', v_sebelum, 'jejak_sebelum', ${jejak},
    'percobaan_sebelum', (select public.percobaan_terpakai(v_p, f.aa_pre)::text));
  -- A3-P07 (S11): no session id, refused, writing nothing
  ${P("P07_lanjut", "M", "NONE", lanjut(), true)}
  -- A3-P06 (S9): an unknown id, and a sitting that is not the caller's, answer alike
  ${P("P06_asing", "M", "B", lanjut("gen_random_uuid()"), true)}
  ${P("P06_bukan", "T", "T", lanjut(), true)}
  -- A3-P08 (D10): a held sitting is refused
  set local session_replication_role = replica;
  execute 'update public.assessment_sessions set frozen_at = now(), frozen_cause = ''ACCOUNT_SUSPENDED'' where id = $1' using v_s;
  set local session_replication_role = origin;
  ${P("P08_tahan", "M", "B", lanjut(), true)}
  set local session_replication_role = replica;
  execute 'update public.assessment_sessions set frozen_at = null, frozen_cause = null where id = $1' using v_s;
  set local session_replication_role = origin;
  -- A3-P12 (Sharon §6.2, 547b3707): the class's teacher allowing an open LOW-STAKES sitting is refused, writing nothing
  -- (a refused call writes nothing: the refusal is raised inside the act, whose writes roll back with it)
  ${P("P12_rendah", "T", "T", izin("current_setting('p.s')::uuid"), true)}
  -- A3-P15 (S8, ruling 42 decision 2): with a work-scoped planned window active over the learner's class, the recovery is
  -- ALLOWED; with an emergency stop over the learner, it is refused under the shared fence (SITTING_CLASS_STOPPED). A
  -- platform-wide window is refused before any call, at the request (D10: PT503), not here. Each rolled back.
  begin
    set local session_replication_role = replica;
    insert into public.maintenance_windows (kind, platform, institution_ids, node_ids, starts_at, ends_at, reason, created_by_person_id)
    select 'PLANNED', false, array[s.institution_id], array[v_k], now() - interval '1 minute', now() + interval '1 hour',
           'uji S8: pemeliharaan kelas', (select a.person_id from public.accounts a where a.auth_user_id = current_setting('p.u_T')::uuid)
      from public.assessment_sessions s where s.id = v_s;
    set local session_replication_role = origin;
    v := v || jsonb_build_object('P15_kelas', pg_temp.p('M', 'C', ${"$q$"}select public.lanjutkan_di_sini(current_setting('p.s')::uuid)::text${"$q$"}));
    -- A3-M01 (journey J1.6 on 5ae2d406): a NEW start in the same window. A copy of the Pemetaan Awal's assignment on its
    -- own copy of the definition (as J1.6 makes it, so no attempt is counted against it): with a verified session it is
    -- refused for the window (PR040 MAINTENANCE_PLACE); with no session it is refused first as no writer at all (S11)
    set local session_replication_role = replica;
    perform set_config('p.m01_def', gen_random_uuid()::text, true);
    perform set_config('p.m01_aa', gen_random_uuid()::text, true);
    insert into public.assessment_definitions select (jsonb_populate_record(d, jsonb_build_object('id', current_setting('p.m01_def'),
        'title', d.title || ' (A3-M01)', 'lineage_root_definition_id', current_setting('p.m01_def')))).*
      from public.assessment_definitions d join public.assessment_assignments aa on aa.assessment_definition_id = d.id where aa.id = f.aa_pre;
    insert into public.assessment_assignments select (jsonb_populate_record(aa, jsonb_build_object('id', current_setting('p.m01_aa'),
        'assessment_definition_id', current_setting('p.m01_def')))).*
      from public.assessment_assignments aa where aa.id = f.aa_pre;
    set local session_replication_role = origin;
    v := v || jsonb_build_object('M01_sesi', pg_temp.p('M', 'C', ${"$q$"}select public.start_learning_session(current_setting('p.m01_aa')::uuid)::text${"$q$"}));
    v := v || jsonb_build_object('M01_tanpa', pg_temp.p('M', 'NONE', ${"$q$"}select public.start_learning_session(current_setting('p.m01_aa')::uuid)::text${"$q$"}));
    v := v || jsonb_build_object('M01_boleh', pg_temp.p('M', 'C', ${"$q$"}select m.reason from public.may_start_assessment(current_setting('p.m01_aa')::uuid) m${"$q$"}));
    raise exception 's8-rollback';
  exception when others then
    if sqlerrm <> 's8-rollback' then v := v || jsonb_build_object('P15_kelas', 'probe-error:' || left(sqlerrm, 70)); end if;
  end;
  perform selftest.as_owner();
  begin
    set local session_replication_role = replica;
    insert into public.maintenance_windows (kind, platform, starts_at, t_stop, reason, created_by_person_id)
    -- t_stop = now(): inside one transaction now() is the sitting's created_at too, and a stop covers sittings created by it
    values ('EMERGENCY', true, now() - interval '1 minute', now(), 'uji S8: penghentian darurat',
            (select a.person_id from public.accounts a where a.auth_user_id = current_setting('p.u_T')::uuid));
    set local session_replication_role = origin;
    v := v || jsonb_build_object('P15_darurat', pg_temp.p('M', 'C', ${"$q$"}select public.lanjutkan_di_sini(current_setting('p.s')::uuid)::text${"$q$"}));
    raise exception 's8-rollback';
  exception when others then
    if sqlerrm <> 's8-rollback' then v := v || jsonb_build_object('P15_darurat', 'probe-error:' || left(sqlerrm, 70)); end if;
  end;
  perform selftest.as_owner();
  -- A3-P01 (S1, S2): session B continues here; the generation rises by one and the controller is B
  ${P("P01_lanjut", "M", "B", lanjut())}
  v := v || jsonb_build_object('sesudah', ${keadaan}, 'jejak_sesudah', ${jejak},
    'percobaan_sesudah', (select public.percobaan_terpakai(v_p, f.aa_pre)::text));
  ${P("P01_lagi", "M", "B", lanjut())}
  v := v || jsonb_build_object('sesudah_lagi', ${keadaan});
  -- A3-P09 (D7, S10): the audit row and the RECONNECT observation
  v := v || jsonb_build_object('P09_audit', (select count(*)::text from public.audit_log a
          where a.action = 'assessment_session.recovered' and a.target_id = v_s::text),
    'P09_integritas', (select count(*)::text from public.integrity_signals g where g.session_id = v_s and g.category = 'RECONNECT'));
  -- A3-P02 (S2): the superseded session A: answer, pause, resume and hand-in are each refused
  ${P("P02_jawab", "M", "A", J(2, 1), true)}
  ${P("P02_jeda", "M", "A", "select public.pause_session(current_setting('p.s')::uuid)::text", true)}
  ${P("P02_lanjut", "M", "A", "select public.resume_session(current_setting('p.s')::uuid)::text", true)}
  ${P("P02_serah", "M", "A", "select public.submit_session(current_setting('p.s')::uuid)::text", true)}
  -- A3-P14 (S3): after the recovery, session B answers question 1 wrongly (generation 2); A had answered it rightly
  -- A3-L01 (the screens' reads): after the low-stakes recovery, A is no longer the controller and B is; no permission
  ${P("L01_pre_A", "M", "A", `select concat_ws(',', x ->> 'di_sesi_ini', x ->> 'perlu_izin', x ->> 'izin_dipakai') from public.pengerjaan_saya(current_setting('p.s')::uuid) x`)}
  ${P("L01_pre_B", "M", "B", `select concat_ws(',', x ->> 'di_sesi_ini', x ->> 'perlu_izin', x ->> 'izin_dipakai') from public.pengerjaan_saya(current_setting('p.s')::uuid) x`)}
  ${P("P14_jawab_B", "M", "B", `select x.outcome from public.record_answer(${S(1)}, 2, selftest.f09_answer(${S(1)}, false)) x`)}
  -- A3-A01 (D9, Sharon's condition): what the player reads after the recovery, on session B: every receipt for question 1,
  -- whatever generation acknowledged it (A's seq 5, generation 1; B's seq 2, generation 2)
  ${P("A01_terima", "M", "B", `select string_agg(a.client_seq::text, ',' order by a.client_seq) from public.session_answers(current_setting('p.s')::uuid) a where a.presented_item_id = ${S(1)}`)}
  -- A3-P08 (D10): past its deadline: the rule ends it inside the act, the refusal rolls that ending back with every other
  -- write, and the act answers RECOVERY_NOTHING; the scheduled sweep ends the sitting later (as every refusing boundary)
  set local session_replication_role = replica;
  execute 'update public.assessment_sessions set authoritative_deadline = now() - interval ''2 days'' where id = $1' using v_s;
  set local session_replication_role = origin;
  ${P("P08_tenggat", "M", "C", lanjut(), true)}
  v := v || jsonb_build_object('P08_sesudah', (select s.status || '|' || (s.authoritative_deadline < now())::text
     from public.assessment_sessions s where s.id = v_s));
  set local session_replication_role = replica;
  execute 'update public.assessment_sessions set authoritative_deadline = $2 where id = $1'
    using v_s, nullif(split_part(v_sebelum, '|', 4), '-')::timestamptz;
  set local session_replication_role = origin;
  -- A3-P03 (S4): nothing to recover in an ended sitting
  foreach st in array array['SUBMITTED', 'FINALIZED', 'EXPIRED', 'TERMINATED'] loop
    set local session_replication_role = replica;
    execute 'update public.assessment_sessions set status = $2::public.session_status where id = $1' using v_s, st;
    set local session_replication_role = origin;
    v := v || jsonb_build_object('P03_' || st, pg_temp.px('M', 'C', ${"$q$"}select public.lanjutkan_di_sini(current_setting('p.s')::uuid)::text${"$q$"}));
  end loop;
  set local session_replication_role = replica;
  execute 'update public.assessment_sessions set status = ''IN_PROGRESS'' where id = $1' using v_s;
  set local session_replication_role = origin;
  -- the Uji Penguasaan: the Pemetaan Awal finished by its controller B, then the post-test started on A
  ${P("pre_selesai", "M", "B", "select public.finish_my_session(current_setting('p.s')::uuid, null)::text")}
  v := v || jsonb_build_object(
    'P14_benar', (select coalesce(sum((d.value ->> 'benar')::int), -1)::text from public.assessment_results r, jsonb_each(r.per_domain) d
                   where r.session_id = v_s and r.supersedes_result_id is null),
    'P14_dijawab', (select count(*)::text from public.session_final_responses(v_s) fr),
    'P14_soal1', (select (fr.value = (select r.value from public.responses r where r.presented_item_id = ${S(1)} and r.generasi = 2
                                       order by r.received_at desc limit 1))::text
                    from public.session_final_responses(v_s) fr where fr.presented_item_id = ${S(1)}));
  v := v || jsonb_build_object('mulai_post', pg_temp.p('M', 'A', format('select public.start_learning_session(%L)::text', f.aa_post)));
  select s.id into v_post from public.assessment_sessions s where s.person_id = v_p and s.assessment_assignment_id = f.aa_post;
  perform set_config('p.post', coalesce(v_post::text, gen_random_uuid()::text), true);
  -- A3-P17 (D9): session A, the post-test's first controller, answers its question 1 (client_seq 3) and is acknowledged
  ${P("P17_A_jawab", "M", "A", "select x.outcome from public.record_answer((select p.id from public.presented_items p where p.session_id = current_setting('p.post')::uuid order by p.position offset 0 limit 1), 3, selftest.f09_answer((select p.id from public.presented_items p where p.session_id = current_setting('p.post')::uuid order by p.position offset 0 limit 1), true)) x")}
  -- A3-P04 (S5): no permission; the wrong teacher and an unknown id (P06); the class's teacher allows it
  ${P("P04_tanpa", "M", "B", lanjut("current_setting('p.post')::uuid"), true)}
  ${P("P06_guru_lain", "L", "L", izin(), true)}
  ${P("P06_guru_asing", "T", "T", izin("gen_random_uuid()"), true)}
  ${P("P07_guru_tanpa_sesi", "T", "NONE", izin(), true)}
  -- A3-P13 (Sharon §6.3): the request, minta_izin_lanjut: only the learner, from a session that is not the controller, on
  -- an open Uji Penguasaan with no valid permission; it sets lanjut_diminta_pada once, idempotently, and grants nothing
  ${P("P13_pengendali", "M", "A", "select public.minta_izin_lanjut(current_setting('p.post')::uuid)::text", true)}
  ${P("P13_asing", "M", "B", "select public.minta_izin_lanjut(gen_random_uuid())::text", true)}
  ${P("P13_bukan", "T", "T", "select public.minta_izin_lanjut(current_setting('p.post')::uuid)::text", true)}
  ${P("P13_tanpa_sesi", "M", "NONE", "select public.minta_izin_lanjut(current_setting('p.post')::uuid)::text", true)}
  ${P("P13_selesai", "M", "B", "select public.minta_izin_lanjut(current_setting('p.s')::uuid)::text", true)}
  ${P("P13_minta", "M", "B", "select public.minta_izin_lanjut(current_setting('p.post')::uuid)::text")}
  v := v || jsonb_build_object('P13_tanda_1', (select coalesce(to_jsonb(s) ->> 'lanjut_diminta_pada', 'null') from public.assessment_sessions s where s.id = v_post));
  ${P("P13_lagi", "M", "B", "select public.minta_izin_lanjut(current_setting('p.post')::uuid)::text")}
  v := v || jsonb_build_object('P13_tanda_2', (select coalesce(to_jsonb(s) ->> 'lanjut_diminta_pada', 'null') from public.assessment_sessions s where s.id = v_post));
  -- A3-L01: the teacher's row shows the request; the learner's read says this session (B) is not the controller
  ${P("L01_daftar_minta", "T", "T", `select concat_ws(',', d.mode_asesmen, (d.lanjut_diminta_pada is not null)::text, (d.izin_berlaku_sampai is not null)::text) from public.daftar_pengerjaan(current_setting('p.kelas')::uuid, current_setting('p.aa_post')::uuid) d where d.person_id = current_setting('p.p')::uuid`)}
  ${P("L01_post_B_sebelum", "M", "B", `select concat_ws(',', x ->> 'di_sesi_ini', x ->> 'perlu_izin', x ->> 'izin_dipakai') from public.pengerjaan_saya(current_setting('p.post')::uuid) x`)}
  ${P("P13_masih", "M", "B", lanjut("current_setting('p.post')::uuid"), true)}
  ${P("P04_izin", "T", "T", izin())}
  -- A3-L01: the teacher's row shows the valid permission
  ${P("L01_daftar_izin", "T", "T", `select concat_ws(',', d.mode_asesmen, (d.lanjut_diminta_pada is not null)::text, (d.izin_berlaku_sampai is not null)::text) from public.daftar_pengerjaan(current_setting('p.kelas')::uuid, current_setting('p.aa_post')::uuid) d where d.person_id = current_setting('p.p')::uuid`)}
  -- (Sharon c0a5d7d6) a request on an Uji Penguasaan that already has a valid permission: it can recover directly
  ${P("P13_berizin", "M", "B", "select public.minta_izin_lanjut(current_setting('p.post')::uuid)::text", true)}
  -- A3-P10 (S5, binding): a permission for another sitting of the same learner does not recover this one
  begin
    execute 'delete from public.pengerjaan_izin_lanjut where session_id = $1' using v_post;
    execute 'insert into public.pengerjaan_izin_lanjut (session_id, person_id, diizinkan_oleh, alasan, berlaku_sampai)
             values ($1, $2, (select a.person_id from public.accounts a where a.auth_user_id = $3), ''izin untuk sesi lain'', now() + interval ''10 minutes'')'
      using v_s, v_p, current_setting('p.u_T')::uuid;
    v := v || jsonb_build_object('P10_lain', pg_temp.p('M', 'B', ${"$q$"}select public.lanjutkan_di_sini(current_setting('p.post')::uuid)::text${"$q$"}));
    raise exception 'ikat-rollback';
  exception when others then
    if sqlerrm <> 'ikat-rollback' then v := v || jsonb_build_object('P10_lain', 'probe-error:' || left(sqlerrm, 70)); end if;
  end;
  perform selftest.as_owner();
  -- A3-P11 (S5, supersession): of two permissions the newest alone counts: with the newer one used, the older unused one,
  -- still inside its 10 minutes, does not recover the sitting
  begin
    execute 'update public.pengerjaan_izin_lanjut set dibuat_pada = now() - interval ''1 minute'' where session_id = $1' using v_post;
    v := v || jsonb_build_object('P11_izin_baru', pg_temp.p('T', 'T', ${"$q$"}select public.izinkan_lanjut(current_setting('p.post')::uuid, 'izin kedua untuk sesi yang sama')::text${"$q$"}));
    perform selftest.as_owner();
    execute 'update public.pengerjaan_izin_lanjut set dipakai_pada = now(), dipakai_generasi = 2 where id = (select z.id from public.pengerjaan_izin_lanjut z
             where z.session_id = $1 order by z.dibuat_pada desc limit 1)' using v_post;
    v := v || jsonb_build_object('P11_lama', pg_temp.p('M', 'B', ${"$q$"}select public.lanjutkan_di_sini(current_setting('p.post')::uuid)::text${"$q$"}));
    raise exception 'ganti-rollback';
  exception when others then
    if sqlerrm <> 'ganti-rollback' then v := v || jsonb_build_object('P11_lama', 'probe-error:' || left(sqlerrm, 70)); end if;
  end;
  perform selftest.as_owner();
  -- a lapsed permission: backdated by the harness, probed, rolled back (the variable keeps the answer)
  begin
    execute 'update public.pengerjaan_izin_lanjut set berlaku_sampai = now() - interval ''1 minute'' where session_id = $1' using v_post;
    v := v || jsonb_build_object('P04_kedaluwarsa', pg_temp.p('M', 'B', ${"$q$"}select public.lanjutkan_di_sini(current_setting('p.post')::uuid)::text${"$q$"}));
    raise exception 'kedaluwarsa-rollback';
  exception when others then
    if sqlerrm <> 'kedaluwarsa-rollback' then v := v || jsonb_build_object('P04_kedaluwarsa', 'probe-error:' || left(sqlerrm, 70)); end if;
  end;
  perform selftest.as_owner();
  ${P("P04_sah", "M", "B", lanjut("current_setting('p.post')::uuid"))}
  -- A3-L01: after the allowed recovery, B is the controller by a teacher's permission; the row's request and permission are gone
  ${P("L01_post_B", "M", "B", `select concat_ws(',', x ->> 'di_sesi_ini', x ->> 'perlu_izin', x ->> 'izin_dipakai') from public.pengerjaan_saya(current_setting('p.post')::uuid) x`)}
  ${P("L01_post_A", "M", "A", `select concat_ws(',', x ->> 'di_sesi_ini', x ->> 'perlu_izin', x ->> 'izin_dipakai') from public.pengerjaan_saya(current_setting('p.post')::uuid) x`)}
  ${P("L01_daftar_sesudah", "T", "T", `select concat_ws(',', d.mode_asesmen, (d.lanjut_diminta_pada is not null)::text, (d.izin_berlaku_sampai is not null)::text) from public.daftar_pengerjaan(current_setting('p.kelas')::uuid, current_setting('p.aa_post')::uuid) d where d.person_id = current_setting('p.p')::uuid`)}
  v := v || jsonb_build_object('P13_sesudah_pulih', (select coalesce(to_jsonb(s) ->> 'lanjut_diminta_pada', 'null') from public.assessment_sessions s where s.id = v_post));
  ${P("P04_terpakai", "M", "C", lanjut("current_setting('p.post')::uuid"), true)}
  -- A3-P17 (D9): the new controller's manifest is judged against the answers the server holds, whatever generation
  -- acknowledged them: question 1 (A's, generation 1) satisfies its entry; question 2, not yet held, is named (PR006)
  ${P("P17_kurang", "M", "B", "select public.finish_my_session(current_setting('p.post')::uuid, jsonb_build_object((select p.id from public.presented_items p where p.session_id = current_setting('p.post')::uuid order by p.position offset 0 limit 1)::text, 3, (select p.id from public.presented_items p where p.session_id = current_setting('p.post')::uuid order by p.position offset 1 limit 1)::text, 1))::text", true)}
  v := v || jsonb_build_object('P17_soal2', (select p.id from public.presented_items p where p.session_id = current_setting('p.post')::uuid order by p.position offset 1 limit 1)::text);
  ${P("P17_B_jawab", "M", "B", "select x.outcome from public.record_answer((select p.id from public.presented_items p where p.session_id = current_setting('p.post')::uuid order by p.position offset 1 limit 1), 1, selftest.f09_answer((select p.id from public.presented_items p where p.session_id = current_setting('p.post')::uuid order by p.position offset 1 limit 1), false)) x")}
  ${P("P17_selesai", "M", "B", "select public.finish_my_session(current_setting('p.post')::uuid, jsonb_build_object((select p.id from public.presented_items p where p.session_id = current_setting('p.post')::uuid order by p.position offset 0 limit 1)::text, 3, (select p.id from public.presented_items p where p.session_id = current_setting('p.post')::uuid order by p.position offset 1 limit 1)::text, 1))::text")}
  v := v || jsonb_build_object(
    'P17_kertas_1', (select coalesce(string_agg(r.generasi::text || ':' || r.client_seq, ','), 'none') from public.session_final_responses(current_setting('p.post')::uuid) fr
                      join public.responses r on r.presented_item_id = fr.presented_item_id and r.value = fr.value
                     where fr.presented_item_id = (select p.id from public.presented_items p where p.session_id = current_setting('p.post')::uuid order by p.position offset 0 limit 1)),
    'P17_kertas_2', (select coalesce(string_agg(r.generasi::text || ':' || r.client_seq, ','), 'none') from public.session_final_responses(current_setting('p.post')::uuid) fr
                      join public.responses r on r.presented_item_id = fr.presented_item_id and r.value = fr.value
                     where fr.presented_item_id = (select p.id from public.presented_items p where p.session_id = current_setting('p.post')::uuid order by p.position offset 1 limit 1)),
    'P17_status', (select s.status from public.assessment_sessions s where s.id = current_setting('p.post')::uuid));
  perform selftest.as_owner();
  v := v || jsonb_build_object('P13_registri', (select coalesce(string_agg(r.function_name, ',' order by r.function_name), '')
          from public.client_rpc_registry r where r.function_name in ('izinkan_lanjut', 'lanjutkan_di_sini', 'minta_izin_lanjut')));
  insert into p_snap values (v);
end $p$;
select 'P' || chr(9) || v::text from p_snap;
rollback;
`;
}

let hasilPulih: { v: Record<string, string> | null; galat: string[] } | undefined;
/** The recovery scenario, run once for A3-P01..P09; each test reports its own reading of it. */
function jalankanPulih(c: Checks, repoRoot: string): Record<string, string> | null {
  if (!hasilPulih) {
    hasilPulih = { v: null, galat: [] };
    const gagal = siapkan(repoRoot);
    if (gagal !== null) hasilPulih.galat.push(gagal);
    else {
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", skenarioPulih(), db()], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
      const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
      const baris = r.stdout.split("\n").find((l) => l.startsWith("P\t"));
      if (r.status !== 0 || !baris) hasilPulih.galat.push(`the recovery scenario could not run: ${pesan}`);
      else hasilPulih.v = JSON.parse(baris.slice(2));
    }
  }
  for (const g of hasilPulih.galat) c.expect(false, g);
  return hasilPulih.v;
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
      // RESTATED, CI-2 (ruling 98, OD-1 ruling 100): the harness's real suspension rotates the teacher's secret and the lift
      // re-keys it, so the seeded password is kept here and put back exactly (past the guard), like the set-up row
      const sandiAsli = psql(`select encrypted_password from auth.users u join public.accounts a on a.auth_user_id = u.id where a.id = '${akun}'`).stdout.trim();
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
           where account_id = '${akun}';
          update auth.users u set encrypted_password = '${sandiAsli}' from public.accounts a where a.id = '${akun}' and u.id = a.auth_user_id; commit;`);
        c.expect(psql(`select encrypted_password from auth.users u join public.accounts a on a.auth_user_id = u.id where a.id = '${akun}'`).stdout.trim() === sandiAsli,
          "Alpha's teacher's seeded password was not put back exactly after the harness's suspension (CI-2 re-keys it)");
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
    // A3-3, the enumeration test (THE PLAN §5.5 D5; A3-COMPLETION.md, Sharon §3 condition 2): every function that writes
    // assessment_sessions or responses, and every trigger on them, is declared below, by class, or the test fails; a
    // learner boundary checks the controller (calls the gate); every writer that UPDATEs or DELETEs a sitting takes it
    // FOR UPDATE first (in its body, or through the gate, pengerjaan_ditahan_periksa or penugasan_sesi … for update), so
    // none interleaves with a learner write or a recovery. The response writer is inner, reached only under the gate.
    // Two plants, rolled back: an undeclared writer, and a declared one whose FOR UPDATE is removed.
    id: "A3-E01",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const PENULIS: Record<string, { kelas: "PELAJAR" | "PULIH" | "MULAI" | "LAYANAN" | "DALAM"; alasan: string }> = {
        lanjutkan_di_sini: { kelas: "PULIH", alasan: "the learner's recovery (D7): its own order, the gate's, without the controller check it replaces" },
        minta_izin_lanjut: { kelas: "PULIH", alasan: "the learner's request for a teacher's permission (Sharon §6.3): sets lanjut_diminta_pada only" },
        record_answer: { kelas: "PELAJAR", alasan: "the learner's answer" },
        pause_session: { kelas: "PELAJAR", alasan: "the learner's pause" },
        resume_session: { kelas: "PELAJAR", alasan: "the learner's resume" },
        submit_session: { kelas: "PELAJAR", alasan: "the learner's hand-in (finish_my_session reaches it)" },
        pengerjaan_gerbang: { kelas: "DALAM", alasan: "the gate itself: the controller's one-time claim (D6)" },
        open_assessment_session: { kelas: "MULAI", alasan: "the start's insert, service role, reached from start_learning_session; the controller is set by its insert trigger (D6)" },
        submit_response: { kelas: "DALAM", alasan: "record_answer's receipt, service role; reached only from record_answer, under the gate" },
        finalize_session: { kelas: "LAYANAN", alasan: "scoring at the end (D5)" },
        terminate_session: { kelas: "LAYANAN", alasan: "a staff termination (D5)" },
        extend_session_deadline: { kelas: "LAYANAN", alasan: "a staff extension (D5)" },
        percobaan_tandai: { kelas: "LAYANAN", alasan: "an attempt's marking by staff (D5)" },
        akhiri_pengerjaan: { kelas: "LAYANAN", alasan: "A1's teacher ending (D5)" },
        lanjutkan_pengerjaan: { kelas: "LAYANAN", alasan: "A1's teacher resume of a held sitting (D5)" },
        tutup_pengerjaan_ditahan: { kelas: "LAYANAN", alasan: "A1's teacher closing of a held sitting (D5)" },
        pengerjaan_tahan_orang: { kelas: "LAYANAN", alasan: "the suspension hold (D5)" },
        pengerjaan_putus_tenggat: { kelas: "LAYANAN", alasan: "the deadline rule and the scheduled closer (D5)" },
        akhiri_penugasan: { kelas: "LAYANAN", alasan: "«Akhiri penugasan», the assignment's end (D5)" },
        tutup_asesmen_terbuka: { kelas: "LAYANAN", alasan: "the assessment assignment's closing (D5)" },
        pengerjaan_tandai_darurat: { kelas: "LAYANAN", alasan: "the emergency stop's marking, a procedure (A2a, D5)" },
        pengerjaan_lepas_darurat: { kelas: "LAYANAN", alasan: "the emergency release on first touch (A2a, D5)" },
        pengerjaan_kredit_darurat: { kelas: "LAYANAN", alasan: "the emergency credit on first touch (A2a, D5)" },
        pengerjaan_keluar_terapkan: { kelas: "LAYANAN", alasan: "a departure preserved through a stop, applied (A2a, D5)" },
      };
      // the triggers on the two tables: they shape the row of the statement that fires them and write no other row
      const PEMICU = ["assessment_sessions:_l1f4_assessment_sessions_person_id", "assessment_sessions:assessment_sessions_a1_state",
        "assessment_sessions:assessment_sessions_pengendali", "assessment_sessions:assessment_sessions_provenance",
        "assessment_sessions:assessment_sessions_release_is_its_course", "assessment_sessions:assessment_sessions_status",
        "assessment_sessions:assessment_sessions_tenant_immutable", "assessment_sessions:assessment_sessions_termination_provenance",
        "assessment_sessions:assessment_sessions_the_pass_mark_is_sealed", "assessment_sessions:assessment_sessions_zz_exposed_is_not_assessed",
        // D2-R (20270124100000): the start-time seal of the sitting's help, purpose and ordinal; it reads, and shapes only its own row
        "assessment_sessions:assessment_sessions_the_policy_is_captured",
        "assessment_sessions:assessment_sessions_zz_no_new_sitting_in_maintenance", "responses:responses_generasi_isi",
        "responses:responses_tenant_immutable", "responses:responses_write"];
      const baca = (tanam: string) => {
        const sql = `begin; ${tanam}
select 'f|' || p.proname || '|' || translate(encode(convert_to(p.prosrc, 'UTF8'), 'base64'), E'\\n', '') from pg_proc p
 where p.pronamespace = 'public'::regnamespace and p.prokind in ('f', 'p')
   and p.prosrc ~* '\\m(insert\\s+into|update|delete\\s+from)\\s+(public\\.)?(assessment_sessions|responses)\\M';
select 't|' || c.relname || ':' || t.tgname from pg_trigger t join pg_class c on c.oid = t.tgrelid
 where not t.tgisinternal and c.relnamespace = 'public'::regnamespace and c.relname in ('assessment_sessions', 'responses');
select 'p|' || l.lanname || ':' || p.proretset || ':' || p.prorettype::regtype || ':' || (p.prosrc ~* '\\mfrom\\s+public\\.assessment_sessions\\M')
  from pg_proc p join pg_language l on l.oid = p.prolang where p.oid = 'public.penugasan_sesi(uuid)'::regprocedure;
select 'r|' || coalesce(string_agg(p.proname, ',' order by p.proname), '') from pg_proc p
 where p.pronamespace = 'public'::regnamespace and p.proname <> 'submit_response' and p.prosrc ~ '\\msubmit_response\\(';
select 'i|' || p.proname || '|' || translate(encode(convert_to(p.prosrc, 'UTF8'), 'base64'), E'\\n', '') from pg_proc p
 where p.pronamespace = 'public'::regnamespace and p.prokind in ('f', 'p')
   and p.prosrc ~* '\\m(insert\\s+into|update|delete\\s+from)\\s+(public\\.)?pengerjaan_izin_lanjut\\M';
rollback;`;
        const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", sql, db()], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
        const f: Record<string, string> = {}; const iz: Record<string, string> = {}; const tg: string[] = []; let pg = ""; let rc = "";
        for (const l of r.stdout.split("\n")) {
          const [k, a, b] = l.split("|");
          if (k === "f") f[a] = Buffer.from(b, "base64").toString("utf8");
          else if (k === "t") tg.push(a);
          else if (k === "p") pg = a;
          else if (k === "r") rc = a ?? "";
          else if (k === "i") iz[a] = Buffer.from(b, "base64").toString("utf8");
        }
        return { r, f, iz, tg, pg, rc };
      };
      const KUNCI = /(\bfrom\s+(public\.)?(assessment_sessions|penugasan_sesi\s*\([^)]*\))[^;]*?\bfor\s+update\b)|\bpengerjaan_gerbang\s*\(|\bpengerjaan_ditahan_periksa\s*\(/i;
      const TULIS = /\b(update|delete\s+from)\s+(public\.)?assessment_sessions\b/i;
      const periksa = (f: Record<string, string>) => {
        const salah: string[] = [];
        for (const [fn, src] of Object.entries(f)) {
          const b = src.replace(/--[^\n]*/g, "");
          const d = PENULIS[fn];
          if (!d) { salah.push(`${fn} writes a sitting or a response and is not declared`); continue; }
          if (d.kelas === "PELAJAR" && !/\bpengerjaan_gerbang\s*\(/.test(b)) salah.push(`${fn} is a learner boundary and does not call the gate`);
          const w = b.search(TULIS), k = b.search(KUNCI);
          if (w >= 0 && !(k >= 0 && k < w)) salah.push(`${fn} updates a sitting without taking it FOR UPDATE first`);
        }
        return salah;
      };
      const t0 = baca("");
      if (!c.expect(t0.r.status === 0, `the catalogue could not be read: ${(t0.r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l))}`)) return c.verdict("");
      for (const s of periksa(t0.f)) c.expect(false, s);
      const basi = Object.keys(PENULIS).filter((fn) => !(fn in t0.f));
      c.expect(basi.length === 0, `declared but no longer a writer (restate the list): ${basi.join(", ")}`);
      c.expect(JSON.stringify([...t0.tg].sort()) === JSON.stringify([...PEMICU].sort()), `the triggers on the two tables differ from the declared list: ${t0.tg.sort().join(", ")}`);
      c.expect(t0.pg === "sql:true:assessment_sessions:true", `penugasan_sesi must be a SQL set of sittings, so its FOR UPDATE locks them: ${t0.pg}`);
      c.expect(t0.rc === "record_answer", `submit_response must be reached only from record_answer: ${t0.rc}`);
      // the recovery permission (Sharon, 547b3707): written only by the two acts, each under its sitting's row lock, which
      // is what makes a permission single-use and only the newest count under concurrency
      const IZIN = ["izinkan_lanjut", "lanjutkan_di_sini"];
      c.expect(JSON.stringify(Object.keys(t0.iz).sort()) === JSON.stringify(IZIN), `the recovery permission must be written by exactly ${IZIN.join(", ")}: ${Object.keys(t0.iz).sort().join(", ") || "none"}`);
      for (const [fn, src] of Object.entries(t0.iz)) {
        const b = src.replace(/--[^\n]*/g, "");
        const w = b.search(/\b(insert\s+into|update|delete\s+from)\s+(public\.)?pengerjaan_izin_lanjut\b/i), k = b.search(KUNCI);
        c.expect(k >= 0 && k < w, `${fn} writes the recovery permission without taking the sitting FOR UPDATE first`);
      }
      // the plants: an undeclared writer, and terminate_session's sitting FOR UPDATE removed
      const t1 = baca(`create function public._a3_e01_tanam(p uuid) returns void language sql as $t$ update public.assessment_sessions set status = status where id = p $t$;
do $t$ declare f oid := 'public.pengerjaan_tahan_orang(uuid,uuid)'::regprocedure; s text; begin
  select prosrc into s from pg_proc where oid = f;
  s := regexp_replace(s, '(from\\s+public\\.assessment_sessions[^;]*?)\\s+for\\s+update', '\\1', 'gi');
  execute format('create or replace function public.pengerjaan_tahan_orang(%s) returns %s language plpgsql security definer set search_path = public, pg_temp as %L',
    pg_get_function_arguments(f), pg_get_function_result(f), s);
end $t$;`);
      if (!c.expect(t1.r.status === 0, `the plants could not be installed: ${(t1.r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l))}`)) return c.verdict("");
      const s1 = periksa(t1.f);
      c.expect(s1.some((x) => x.startsWith("_a3_e01_tanam writes")), `the plant (an undeclared writer) was not reported: ${s1.join("; ")}`);
      c.expect(s1.some((x) => x.startsWith("pengerjaan_tahan_orang updates a sitting without")), `the plant (pengerjaan_tahan_orang without its FOR UPDATE) was not reported: ${s1.join("; ")}`);
      return c.verdict(`reads the function catalogue and the triggers: the ${Object.keys(PENULIS).length} functions that write assessment_sessions or responses are each declared (learner boundaries ${Object.entries(PENULIS).filter(([, d]) => d.kelas === "PELAJAR").map(([f]) => f).join(", ")}, each calling the gate; the start's insert; ${Object.values(PENULIS).filter((d) => d.kelas === "LAYANAN").length} service and staff writers (D5); two inner), and the ${PEMICU.length} triggers on the two tables are as declared; every writer that updates a sitting takes it FOR UPDATE first; submit_response is reached only from record_answer; two plants (an undeclared writer, a lock removed) are reported; rolled back`);
    },
  },
  {
    // Sharon V-2 (f6d3a2cb): the gate's one-time claim (D6) writes only to an open sitting; an item view of an ended,
    // uncontrolled sitting writes no controller to it.
    id: "A3-V02",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankan(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      c.expect((v.selesai_pengendali ?? "").endsWith("|SUBMITTED"), `the harness could not end the sitting: ${v.selesai_pengendali}`);
      c.expect(v.selesai_pengendali === "null|SUBMITTED", `an ended sitting with no controller must keep none after its learner's item view (${v.selesai_lihat}): ${v.selesai_pengendali}`);
      return c.verdict("executes note_item_view against the migrations, in A3-R01's rolled-back transaction, on the learner's SUBMITTED sitting with no controller: the sitting keeps no controller (the D6 claim is written only to a CREATED, IN_PROGRESS or PAUSED sitting)");
    },
  },
  {
    // Sharon V-1 (627d66d4): through the gate, the item view must not be refused by A1's hold, which refuses an answer, a
    // hand-in and the learner's own pause or resume, never a view (as before A3, when the view ran only the fence).
    id: "A3-V01",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankan(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      if (!c.expect(v.tahan === "true", `the harness could not hold the sitting: ${v.tahan}`)) return c.verdict("");
      if (!c.expect(Number(v.tahan_belum_dilihat) > 0, `the sitting has no unviewed item to view: ${v.tahan_belum_dilihat}`)) return c.verdict("");
      c.expect(/^ok:/.test(v.tahan_lihat ?? ""), `a held sitting's item view (note_item_view, its controller) must not be refused: ${v.tahan_lihat}`);
      c.expect(/^ok:/.test(v.tahan_bantuan ?? ""), `a held sitting's assistance_state on an unviewed item (which views it) must not be refused: ${v.tahan_bantuan}`);
      c.expect(v.tahan_jawab === "PR170:SITTING_FROZEN", `the control: a held sitting's answer must still be refused SITTING_FROZEN: ${v.tahan_jawab}`);
      return c.verdict("executes note_item_view, assistance_state and record_answer against the migrations, in A3-R01's rolled-back transaction, as the sitting's controller, with the sitting held (frozen_at set): the item view and assistance_state on an unviewed item (which views it, through the gate) are not refused by the hold; the answer is refused PR170 SITTING_FROZEN");
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
  {
    // A3-P01 (S1, S2; THE PLAN §5.5 D7): a low-stakes recovery from a second verified session
    id: "A3-P01",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      const [ctl0, gen0] = (v.sebelum ?? "").split("|");
      const [ctl1, gen1] = (v.sesudah ?? "").split("|");
      c.expect(v.P01_lanjut === `ok:${Number(gen0) + 1}`, `session B's continue must return the next generation (${Number(gen0) + 1}): ${v.P01_lanjut}`);
      c.expect(Number(gen1) === Number(gen0) + 1, `the generation must rise by exactly one: ${v.sebelum} -> ${v.sesudah}`);
      c.expect(ctl1 !== "null" && ctl1 !== ctl0, `the controller must become the caller's verified session: ${v.sebelum} -> ${v.sesudah}`);
      c.expect(v.P01_lagi === v.P01_lanjut && v.sesudah_lagi === v.sesudah, `the controller continuing again must write nothing and return the same generation: ${v.P01_lagi} / ${v.sesudah_lagi}`);
      return c.verdict("executes lanjutkan_di_sini against the migrations, rolled back: a learner's second verified session continues a low-stakes sitting; the generation rises by one and the controller becomes that session (from the verified claims; the act takes no session parameter); continuing again from it writes nothing");
    },
  },
  {
    // A3-P02 (S2): after a recovery, every write of the superseded session is refused
    id: "A3-P02",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      c.expect(/^ok:/.test(v.P01_lanjut ?? ""), `the recovery did not happen, so nothing is superseded: ${v.P01_lanjut}`);
      for (const k of ["P02_jawab", "P02_jeda", "P02_lanjut", "P02_serah"]) c.expect(v[k] === "PR170:SITTING_NOT_CONTROLLER", `${k}: the superseded session must be refused SITTING_NOT_CONTROLLER: ${v[k]}`);
      return c.verdict("after session B's recovery, session A's answer, pause, resume and hand-in are each refused PR170 SITTING_NOT_CONTROLLER; rolled back");
    },
  },
  {
    // A3-P03 (S4): nothing to recover in an ended sitting
    id: "A3-P03",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      for (const st of ["SUBMITTED", "FINALIZED", "EXPIRED", "TERMINATED"]) c.expect(v[`P03_${st}`] === "PR170:RECOVERY_NOTHING", `a ${st} sitting must answer RECOVERY_NOTHING: ${v[`P03_${st}`]}`);
      return c.verdict("lanjutkan_di_sini on a SUBMITTED, FINALIZED, EXPIRED and TERMINATED sitting answers PR170 RECOVERY_NOTHING; rolled back");
    },
  },
  {
    // A3-P04 (S5; owner ruling D-3): an Uji Penguasaan needs the teacher's permission, single use, 10 minutes
    id: "A3-P04",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      if (!c.expect(/^ok:/.test(v.mulai_post ?? ""), `the Uji Penguasaan could not be started for the case: ${v.pre_selesai} / ${v.mulai_post}`)) return c.verdict("");
      c.expect(v.P04_tanpa === "PR170:RECOVERY_NOT_AUTHORISED", `with no permission: ${v.P04_tanpa}`);
      c.expect(/^ok:\d{4}-/.test(v.P04_izin ?? ""), `the class's teacher must be able to allow it, returning when it lapses: ${v.P04_izin}`);
      c.expect(v.P04_kedaluwarsa === "PR170:RECOVERY_AUTHORISATION_EXPIRED", `with a lapsed permission: ${v.P04_kedaluwarsa}`);
      c.expect(v.P04_sah === "ok:2", `with a valid permission the recovery succeeds once: ${v.P04_sah}`);
      c.expect(v.P04_terpakai === "PR170:RECOVERY_AUTHORISATION_USED", `a used permission does not move the sitting again: ${v.P04_terpakai}`);
      return c.verdict("an Uji Penguasaan's recovery is refused RECOVERY_NOT_AUTHORISED with no permission and RECOVERY_AUTHORISATION_EXPIRED with a lapsed one; the class's teacher allows it (izinkan_lanjut, returning when it lapses); it then succeeds once, and a third session is refused RECOVERY_AUTHORISATION_USED; rolled back");
    },
  },
  {
    // A3-P05 (S6; ruling 42 condition 2): a recovery adds no time, changes no answer, uses no attempt
    id: "A3-P05",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      const [, , st0, dl0] = (v.sebelum ?? "").split("|"); const [, , st1, dl1] = (v.sesudah ?? "").split("|");
      if (!c.expect(/^ok:/.test(v.P01_lanjut ?? ""), `the recovery did not happen: ${v.P01_lanjut}`)) return c.verdict("");
      c.expect(st0 === st1 && dl0 === dl1, `the status and the deadline must be unchanged: ${v.sebelum} -> ${v.sesudah}`);
      c.expect(v.jejak_sebelum === v.jejak_sesudah, "the earlier responses must be byte-identical (id, client_seq, value, received_at)");
      c.expect(v.percobaan_sebelum === v.percobaan_sesudah, `the attempt count must be unchanged: ${v.percobaan_sebelum} -> ${v.percobaan_sesudah}`);
      return c.verdict("a recovery leaves the sitting's status and deadline, every earlier response (id, client_seq, value, received_at) and the attempt count unchanged; rolled back");
    },
  },
  {
    // A3-P06 (S9; Sharon 7fa4de5d): no existence oracle, at the learner's act and the teacher's
    id: "A3-P06",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      for (const k of ["P06_asing", "P06_bukan", "P06_guru_lain", "P06_guru_asing"]) c.expect(v[k] === "PR170:SITTING_NOT_CONTROLLER", `${k} must answer SITTING_NOT_CONTROLLER: ${v[k]}`);
      return c.verdict("an unknown sitting id and another person's sitting answer PR170 SITTING_NOT_CONTROLLER at lanjutkan_di_sini; at izinkan_lanjut, another school's teacher and an unknown id answer the same; rolled back");
    },
  },
  {
    // A3-P07 (S11): a session with no id is refused at both acts
    id: "A3-P07",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      c.expect(v.P07_lanjut === "PR170:SITTING_NOT_CONTROLLER", `the learner with no session id: ${v.P07_lanjut}`);
      c.expect(v.P07_guru_tanpa_sesi === "PR170:SITTING_NOT_CONTROLLER", `the teacher with no session id: ${v.P07_guru_tanpa_sesi}`);
      return c.verdict("a verified token with no session id is refused PR170 SITTING_NOT_CONTROLLER at lanjutkan_di_sini and at izinkan_lanjut; rolled back");
    },
  },
  {
    // A3-P08 (D10): a held sitting is not recovered; one past its deadline answers RECOVERY_NOTHING (the rule's ending rolls
    // back with the refusal; the scheduled sweep ends it later)
    id: "A3-P08",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      c.expect(v.P08_tahan === "PR170:SITTING_FROZEN", `a held sitting: ${v.P08_tahan}`);
      c.expect(v.P08_tenggat === "PR170:RECOVERY_NOTHING", `a sitting past its deadline has nothing to recover: ${v.P08_tenggat}`);
      c.expect(/^(CREATED|IN_PROGRESS|PAUSED)\|true$/.test(v.P08_sesudah ?? ""), `the refusal writes nothing: the sitting is still open and past its deadline after the call (the sweep ends it): ${v.P08_sesudah}`);
      return c.verdict("a held sitting's recovery is refused PR170 SITTING_FROZEN; a sitting past its deadline answers RECOVERY_NOTHING and is left as it was (open, past its deadline: the rule's ending rolls back with the refusal, and the scheduled sweep ends it later); rolled back");
    },
  },
  {
    // A3-P09 (D7; S10): every recovery is recorded, once
    id: "A3-P09",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      c.expect(v.P09_audit === "1", `one assessment_session.recovered audit row for the recovery: ${v.P09_audit}`);
      c.expect(v.P09_integritas === "1", `one RECONNECT integrity signal for the recovery: ${v.P09_integritas}`);
      return c.verdict("a recovery writes one assessment_session.recovered audit row and one RECONNECT integrity signal, and the controller's repeat writes none; rolled back");
    },
  },
  {
    // A3-P10 (S5, binding; Sharon 547b3707): a permission for another sitting of the same learner recovers nothing here
    id: "A3-P10",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      c.expect(v.P10_lain === "PR170:RECOVERY_NOT_AUTHORISED", `a valid permission bound to the learner's other sitting must not recover this one: ${v.P10_lain}`);
      return c.verdict("executes lanjutkan_di_sini against the migrations, rolled back: with the only valid permission bound to the same learner's other sitting, the Uji Penguasaan's recovery is refused PR170 RECOVERY_NOT_AUTHORISED");
    },
  },
  {
    // A3-P11 (S5, supersession; Sharon 547b3707): only the newest permission counts
    id: "A3-P11",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      c.expect(/^ok:\d{4}-/.test(v.P11_izin_baru ?? ""), `the teacher's second permission: ${v.P11_izin_baru}`);
      c.expect(v.P11_lama === "PR170:RECOVERY_AUTHORISATION_USED", `with the newer permission used, the older unused one inside its 10 minutes must not recover the sitting: ${v.P11_lama}`);
      return c.verdict("executes izinkan_lanjut and lanjutkan_di_sini against the migrations, rolled back: of two permissions for one sitting the newest alone counts; with it used, the older unused one, still inside its 10 minutes, is not consulted and the recovery is refused RECOVERY_AUTHORISATION_USED");
    },
  },
  {
    // A3-P12 (Sharon §6.2, 547b3707): a teacher allowing a low-stakes sitting is refused with its own code
    id: "A3-P12",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      c.expect(v.P12_rendah === "PR170:RECOVERY_NOT_NEEDED", `the class's teacher allowing an open low-stakes sitting: ${v.P12_rendah}`);
      return c.verdict("executes izinkan_lanjut against the migrations, rolled back: the class's teacher allowing an open low-stakes (Pemetaan Awal) sitting is refused PR170 RECOVERY_NOT_NEEDED, after the authority check, writing nothing");
    },
  },
  {
    // A3-P13 (Sharon §6.3, 547b3707): the request, minta_izin_lanjut, and its conditions
    id: "A3-P13",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      for (const k of ["P13_asing", "P13_bukan", "P13_tanpa_sesi"]) c.expect(v[k] === "PR170:SITTING_NOT_CONTROLLER", `${k} (an unknown id, another person, no session id) must answer SITTING_NOT_CONTROLLER: ${v[k]}`);
      // the codes as Sharon pinned them (c0a5d7d6)
      c.expect(v.P13_pengendali === "PR170:RECOVERY_NOTHING", `the controller's own session has nothing to request: ${v.P13_pengendali}`);
      c.expect(v.P13_selesai === "PR170:RECOVERY_NOTHING", `an ended sitting has nothing to request: ${v.P13_selesai}`);
      c.expect(v.P13_berizin === "PR170:RECOVERY_NOT_NEEDED", `a sitting that already has a valid permission needs no request: ${v.P13_berizin}`);
      c.expect(/^ok:/.test(v.P13_minta ?? "") && v.P13_tanda_1 !== "null", `the learner's request from a new session sets lanjut_diminta_pada: ${v.P13_minta} / ${v.P13_tanda_1}`);
      c.expect(/^ok:/.test(v.P13_lagi ?? "") && v.P13_tanda_2 === v.P13_tanda_1, `a second request is idempotent (the mark is unchanged): ${v.P13_tanda_1} / ${v.P13_tanda_2}`);
      c.expect(v.P13_masih === "PR170:RECOVERY_NOT_AUTHORISED", `the request grants nothing: the recovery still answers RECOVERY_NOT_AUTHORISED: ${v.P13_masih}`);
      c.expect(v.P13_sesudah_pulih === "null", `a recovery clears the request: ${v.P13_sesudah_pulih}`);
      c.expect(v.P13_registri === "izinkan_lanjut,lanjutkan_di_sini,minta_izin_lanjut", `the three acts must each have a registry row: ${v.P13_registri}`);
      return c.verdict("executes minta_izin_lanjut and lanjutkan_di_sini against the migrations, rolled back: an unknown id, another person and a session with no id answer SITTING_NOT_CONTROLLER; the controller's own session and a sitting that is not an open Uji Penguasaan are refused; the learner's request from a new session sets lanjut_diminta_pada, idempotently, grants nothing (the recovery still answers RECOVERY_NOT_AUTHORISED) and is cleared by a recovery; the three acts have registry rows");
    },
  },
  {
    // A3-P14 (S3; THE PLAN §5.5 D8, H): the scored result across generations follows the newest generation's answers
    id: "A3-P14",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      c.expect(/^ok:/.test(v.P14_jawab_B ?? "") && /^ok:/.test(v.pre_selesai ?? ""), `the recovered session's answer and the hand-in: ${v.P14_jawab_B} / ${v.pre_selesai}`);
      c.expect(v.P14_soal1 === "true", `question 1's final answer must be the recovered session's (generation 2), not the earlier session's: ${v.P14_soal1}`);
      // question 1 alone was answered: rightly by session A (generation 1), then wrongly by B (generation 2) at a lower
      // client_seq (2 < 5); the hand-in writes a final row for every presented question, unanswered ones counting nothing
      c.expect(v.P14_benar === "0", `the scored result must count the generation-2 wrong answer, not the earlier right one: ${v.P14_benar} right`);
      return c.verdict("executes record_answer, finish_my_session and session_final_responses against the migrations, rolled back: question 1, answered rightly by session A and, after a recovery, wrongly by session B, has B's answer as final although its client_seq is lower, and the scored result counts it wrong (0 right, not 1)");
    },
  },
  {
    // A3-P15 (S8; ruling 42, decision 2, Sharon's conditions 1 and 3): a recovery in a work-scoped planned window is allowed;
    // under an emergency stop it is refused, read under the shared fence
    id: "A3-P15",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      c.expect(v.P15_kelas === "ok:2", `a work-scoped planned window over the class must allow the recovery (it creates no sitting and adds no time): ${v.P15_kelas}`);
      c.expect(v.P15_darurat === "PR170:SITTING_CLASS_STOPPED", `an emergency stop over the learner must refuse the recovery under the fence: ${v.P15_darurat}`);
      return c.verdict("executes lanjutkan_di_sini against the migrations, rolled back: with a work-scoped planned window active over the learner's class the recovery is allowed; with an emergency stop over the learner it is refused PR170 SITTING_CLASS_STOPPED (pengerjaan_pagar, under the shared fence); a platform-wide window is refused at the request (D10)");
    },
  },
  {
    // A3-P16 (S7, A3-2; Sharon 11:03): recoveries on real connections, each committing by design and leaving no open
    // sitting and no live permission behind (P3). (1) Two recoveries of one low-stakes sitting from two sessions: the
    // second waits on the sitting row, then sees the first's generation and moves it on (generation 3, two audit rows);
    // the plant (the act's FOR UPDATE removed) loses the first. (2) A recovery against a superseding permission: the
    // learner waits on the teacher's new permission and consumes the newest; the older stays unused. (3) A recovery
    // against the teacher's ending: it waits, then has nothing to recover.
    id: "A3-P16",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const gagal = siapkan(ctx.repoRoot);
      if (!c.expect(gagal === null, gagal ?? "")) return c.verdict("");
      const { psqlLain, tidur, gantiFungsi } = await import("./balapan");
      const sql1 = (q: string) => spawnSync("psql", ["-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-c", q, db()], { encoding: "utf8" });
      const tag = `${Date.now()}`;
      const guru = sql1("select id from auth.users where email = 'siklus-guru@synthetic.pintar.test'").stdout.trim();
      // the fixture, committed: two learners of the cycle's Kelas; L1's Pemetaan Awal open on session A; L2's Pemetaan
      // Awal finished and its Uji Penguasaan open on session A
      const buat = (nama: string, post: boolean) => sql1(`do $f$ declare f record; v_k uuid; v_u uuid; v_p uuid; v_e uuid; v_pre uuid;
        begin
          perform selftest.as_owner();
          select * into f from selftest.cycle_fixture();
          select la.node_id into v_k from public.learning_assignments la where la.id = f.la;
          v_u := selftest.f06p10_person('${nama}-${tag}');
          select a.person_id into v_p from public.accounts a where a.auth_user_id = v_u;
          insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
          select v_p, e.institution_id, e.academic_period_id, e.programme_id, 'ACTIVE' from public.memberships mm
            join public.enrollments e on e.id = mm.enrollment_id where mm.node_id = v_k and mm.valid_to is null limit 1
          returning id into v_e;
          insert into public.memberships (enrollment_id, node_id, academic_period_id)
          select v_e, v_k, e.academic_period_id from public.enrollments e where e.id = v_e;
          perform set_config('request.jwt.claims', json_build_object('sub', v_u, 'role', 'authenticated', 'session_id', md5('a3r-A:' || v_u)::uuid)::text, true);
          perform set_config('request.jwt.claim.sub', v_u::text, true);
          set local role authenticated;
          v_pre := public.start_learning_session(f.aa_pre);
          if ${post} then
            perform public.record_answer(x.id, 1, selftest.f09_answer(x.id, true)) from (select p.id from public.presented_items p where p.session_id = v_pre order by p.position limit 1) x;
            perform public.finish_my_session(v_pre, null); v_pre := public.start_learning_session(f.aa_post); end if;
          perform selftest.as_owner();
          perform set_config('r.out', v_u || '|' || v_pre, true);
        end $f$;
        select current_setting('r.out');`);
      const s1 = buat("a3r-satu", false), s2 = buat("a3r-dua", true);
      const [u1, sesi1] = s1.stdout.trim().split("\n").pop()!.split("|");
      const [u2, sesi2] = s2.stdout.trim().split("\n").pop()!.split("|");
      // P3: every sitting of this run's two learners is ended and their permissions removed, on every path
      const tutup = () => sql1(`begin; set local session_replication_role = replica;
          delete from public.pengerjaan_izin_lanjut where person_id in (select a.person_id from public.accounts a where a.auth_user_id::text in ('${u1}', '${u2}'));
          update public.assessment_sessions set status = 'TERMINATED', termination_cause = 'ADMINISTRATIVE_TERMINATION',
                 termination_reason = 'A3-P16 race fixture'
           where person_id in (select a.person_id from public.accounts a where a.auth_user_id::text in ('${u1}', '${u2}')) and status in ('CREATED', 'IN_PROGRESS', 'PAUSED');
          commit;`);
      if (!c.expect(!!sesi1 && !!sesi2 && !!guru, `the race fixture could not be made: ${s1.stderr.trim().slice(0, 200)} ${s2.stderr.trim().slice(0, 200)}`)) { tutup(); return c.verdict(""); }
      const sebagai = (uid: string, sesi: string, q: string, tahan = 0) => `begin;
        select set_config('request.jwt.claims', json_build_object('sub', '${uid}', 'role', 'authenticated', 'session_id', '${sesi}')::text, true);
        select set_config('request.jwt.claim.sub', '${uid}', true);
        set local role authenticated;
        ${q};
        ${tahan ? `select pg_sleep(${tahan});` : ""}
        commit;`;
      const keadaan = (s: string) => sql1(`select generasi || '|' || coalesce(pengendali_sesi::text, 'null') || '|' || status from public.assessment_sessions where id = '${s}'`).stdout.trim();
      const sesiB = "00000000-0000-4000-8000-00000000000b", sesiC = "00000000-0000-4000-8000-00000000000c", sesiT = "00000000-0000-4000-8000-0000000000aa";
      const pulih = (uid: string, sesi: string, s: string, tahan = 0) => psqlLain(sebagai(uid, sesi, `select public.lanjutkan_di_sini('${s}')`, tahan));
      const reset1 = () => sql1(`begin; set local session_replication_role = replica;
        update public.assessment_sessions set generasi = 1, pengendali_sesi = md5('a3r-A:' || '${u1}')::uuid where id = '${sesi1}'; commit;`);
      const rekam = (s: string) => sql1(`select count(*) from public.audit_log where action = 'assessment_session.recovered' and target_id = '${s}'`).stdout.trim();
      try {
        // (1) two recoveries from two sessions
        const a1 = rekam(sesi1);
        const x = pulih(u1, sesiB, sesi1, 1.5); await tidur(500); const y = await pulih(u1, sesiC, sesi1); const xr = await x;
        c.expect(xr.ok && y.ok, `both recoveries must succeed, one after the other: B ${xr.err} / C ${y.err}`);
        c.expect(y.ms >= 800, `the second recovery must wait for the first on the sitting row: ${y.ms} ms`);
        c.expect(keadaan(sesi1).split("|").slice(0, 2).join("|") === `3|${sesiC}`, `after both, the generation is 3 and the controller is the later session: ${keadaan(sesi1)}`);
        c.expect(Number(rekam(sesi1)) - Number(a1) === 2, `two recoveries, two audit rows: ${Number(rekam(sesi1)) - Number(a1)}`);
        // the plant: without the row lock the second reads the old generation and the first is lost
        reset1();
        // (the deadline rule takes the sitting FOR UPDATE too, so both locks go: either alone serialises the act)
        const balik = gantiFungsi("public.lanjutkan_di_sini(uuid)", "where id = p_session for update;", "where id = p_session;");
        try {
          const balik2 = gantiFungsi("public.pengerjaan_putus_tenggat(uuid,boolean)", "where id = p_session for update;", "where id = p_session;");
          try {
            const px = pulih(u1, sesiB, sesi1, 1.5); await tidur(500); await pulih(u1, sesiC, sesi1); await px;
          } finally { balik2(); }
        } finally { balik(); }
        c.expect(keadaan(sesi1).split("|")[0] !== "3", `the plant (neither FOR UPDATE) must lose a recovery, and was not caught: ${keadaan(sesi1)}`);
        // (2) a recovery against a superseding permission: the teacher's newer permission holds the sitting; the learner
        // waits, then consumes the newest; the older stays unused
        const izin = (alasan: string, tahan = 0) => psqlLain(sebagai(guru, sesiT, `select public.izinkan_lanjut('${sesi2}', '${alasan}')`, tahan));
        const p1 = await izin("izin pertama untuk balapan");
        c.expect(p1.ok, `the first permission: ${p1.err}`);
        const t = izin("izin kedua menggantikan yang pertama", 1.5); await tidur(500); const l = await pulih(u2, sesiB, sesi2); const tr = await t;
        c.expect(tr.ok && l.ok && l.ms >= 800, `the learner's recovery must wait for the new permission, then succeed: ${tr.err} / ${l.err} / ${l.ms} ms`);
        const pakai = sql1(`select string_agg(coalesce(dipakai_generasi::text, 'unused'), ',' order by dibuat_pada) from public.pengerjaan_izin_lanjut where session_id = '${sesi2}'`).stdout.trim();
        c.expect(pakai === "unused,2", `the newest permission is consumed and the older stays unused: ${pakai}`);
        // (3) a recovery against the teacher's ending
        const akhir = psqlLain(sebagai(guru, sesiT, `select public.akhiri_pengerjaan('${sesi2}', 'NOT_COUNTED', 'diakhiri guru saat balapan uji')`, 1.5));
        await tidur(500); const l3 = await pulih(u2, sesiC, sesi2); const ar = await akhir;
        c.expect(ar.ok, `the teacher's ending: ${ar.err}`);
        c.expect(!l3.ok && /RECOVERY_NOTHING/.test(l3.err) && l3.ms >= 800, `the recovery must wait for the ending, then find nothing to recover: ${l3.err} (${l3.ms} ms)`);
        return c.verdict("on real connections, each committing (P3: nothing left open): two recoveries of one sitting from two sessions serialise on the sitting row (the second waits, then moves generation 2 to 3; two audit rows), and the plant without the act's and the deadline rule's FOR UPDATE loses one; a recovery waits on the teacher's superseding permission and consumes the newest, the older staying unused; a recovery racing the teacher's ending waits and then answers RECOVERY_NOTHING");
      } finally { tutup(); }
    },
  },
  {
    // A3-P17 (D9, THE PLAN §5.5): the finishing manifest after a recovery. finish_my_session checks the finishing device's
    // own manifest (PR006); after a recovery the new controller's manifest is judged against the answers the server holds
    // for the sitting, whatever generation acknowledged them, so the failed device's acknowledged answers are on the paper.
    id: "A3-P17",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      c.expect(/^ok:/.test(v.P17_A_jawab ?? "") && /^ok:/.test(v.P04_sah ?? ""), `session A's answer before the recovery, and the recovery: ${v.P17_A_jawab} / ${v.P04_sah}`);
      c.expect((v.P17_kurang ?? "").startsWith("PR006:") && (v.P17_kurang ?? "").includes(v.P17_soal2 ?? "-")
        && !(v.P17_kurang ?? "").replace(v.P17_soal2 ?? "-", "").match(/[0-9a-f]{8}-[0-9a-f]{4}-/),
        `a manifest naming an answer the server does not hold must be refused PR006, naming that question alone (question 1 is held from generation 1): ${v.P17_kurang}`);
      c.expect(/^ok:/.test(v.P17_B_jawab ?? "") && /^ok:/.test(v.P17_selesai ?? ""), `the new controller's answer, then its finish over both: ${v.P17_B_jawab} / ${v.P17_selesai}`);
      c.expect(v.P17_kertas_1 === "1:3", `question 1's answer on the paper must be the failed device's acknowledged one (generation 1, seq 3): ${v.P17_kertas_1}`);
      c.expect(v.P17_kertas_2 === "2:1", `question 2's answer on the paper must be the new controller's (generation 2, seq 1): ${v.P17_kertas_2}`);
      c.expect(v.P17_status === "FINALIZED", `the sitting is finished: ${v.P17_status}`);
      return c.verdict("executes record_answer and finish_my_session against the migrations, rolled back (D9): after an Uji Penguasaan is recovered on session B, B's finish with a manifest naming an answer the server does not hold is refused PR006, naming that question alone, while the failed session A's acknowledged answer (generation 1) satisfies its entry; B's finish over both then succeeds and the paper carries A's answer for question 1 and B's for question 2");
    },
  },
  {
    // A3-A01 (D9, Sharon's ruling (a) and its condition): after a recovery the player's next client_seq is above every seq
    // held for the sitting, across generations. The residual (a crafted, non-player manifest) is stated in A3's notes.
    id: "A3-A01",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      // 1. the read: session_answers on the recovered session returns both generations' receipts
      c.expect(v.A01_terima === "ok:2,5", `after the recovery, the player's read must hold question 1's receipts from both generations (A's 5, B's 2): ${v.A01_terima}`);
      const diterima = (v.A01_terima ?? "").replace(/^ok:/, "").split(",").filter(Boolean).map(Number);
      // 2. the wiring: the page folds every receipt into seqs (no generation filter); the player starts serverSeqs from it,
      //    and nextSeq is one above serverSeqs, what this page issued and the outbox
      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      const pa = buang(readFileSync(join(ctx.repoRoot, "src", "app", "belajar", "_components", "PermukaanAsesmen.tsx"), "utf8"));
      const ip = buang(readFileSync(join(ctx.repoRoot, "src", "app", "belajar", "_components", "ItemPlayer.tsx"), "utf8"));
      const lipat = /for \(const row of prior\) \{\s*seqs\[row\.presented_item_id\] = Math\.max\(seqs\[row\.presented_item_id\] \?\? 0, row\.client_seq\);/.test(pa)
        && /engine\.answersSoFar\(db, sesi\)/.test(pa);
      c.expect(lipat, "the page does not fold every receipt session_answers returns into the player's seqs");
      c.expect(!/generasi/.test(/for \(const row of prior\) \{[\s\S]*?\n {2}\}/.exec(pa)?.[0] ?? "generasi"), "the page filters the receipts it folds by generation");
      c.expect(/const serverSeqs = useRef<Record<string, number>>\(\{ \.\.\.props\.seqs \}\);/.test(ip), "the player does not start serverSeqs from the page's seqs");
      const aturan = /const n = 1 \+ Math\.max\(serverSeqs\.current\[item\] \?\? 0, issued\.current\[item\] \?\? 0, outboxMax\(item\)\);/.test(ip);
      c.expect(aturan, "nextSeq is not one above the server's held seq, this page's issued seq and the outbox");
      // 3. the rule executed on what the read returned: the next seq is above every held seq, in every generation
      const lanjut = 1 + Math.max(0, ...diterima);
      c.expect(diterima.length === 2 && diterima.every((q) => lanjut > q), `the next seq ${lanjut} is not above every held seq (${diterima.join(", ")})`);
      return c.verdict("executes session_answers against the migrations, rolled back, and reads the player's wiring (D9; Sharon's ruling (a)): after a recovery the recovered session's read holds question 1's receipts from both generations (seq 5 and 2); the page folds every receipt into the player's seqs with no generation filter, the player starts serverSeqs from them, and nextSeq is one above the held seq, the issued seq and the outbox, so the next seq (6) is above every seq held for the sitting");
    },
  },
  {
    // A3-L01 (the screens' reads; Daisy A3-KODE-PEMULIHAN.md §1, §2.3, §6.2): pengerjaan_saya tells the learner's page
    // whether this session is the controller (di_sesi_ini), whether a teacher must allow a recovery (perlu_izin), and
    // whether this generation came by a teacher's permission (izin_dipakai, for §2.3's quiet line); daftar_pengerjaan
    // tells the teacher's row the mode (mode_asesmen), the learner's request and a valid permission
    id: "A3-L01",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      const lihat: [string, string, string][] = [
        ["L01_pre_A", "ok:false,false,false", "the low-stakes sitting read from the old session A after the recovery"],
        ["L01_pre_B", "ok:true,false,false", "the low-stakes sitting read from the recovering session B"],
        ["L01_post_B_sebelum", "ok:false,true,false", "the Uji Penguasaan read from session B before any permission"],
        ["L01_daftar_minta", "ok:POST_TEST,true,false", "the teacher's row after the learner's request"],
        ["L01_daftar_izin", "ok:POST_TEST,true,true", "the teacher's row with a valid permission (the request still stands until a recovery clears it)"],
        ["L01_post_B", "ok:true,true,true", "the Uji Penguasaan read from B after the allowed recovery"],
        ["L01_post_A", "ok:false,true,true", "the Uji Penguasaan read from the old session A after it"],
        ["L01_daftar_sesudah", "ok:POST_TEST,false,false", "the teacher's row after the recovery (request cleared, permission used)"],
      ];
      for (const [k, mau, apa] of lihat) c.expect(v[k] === mau, `${apa}: ${v[k]} (expected ${mau.slice(3)})`);
      return c.verdict("executes pengerjaan_saya and daftar_pengerjaan against the migrations, rolled back: the learner's read says whether this session controls the sitting, whether a teacher must allow a recovery and whether this generation came by a teacher's permission, for the old and the new session, low-stakes and Uji Penguasaan; the teacher's row carries the mode, the learner's request and a valid permission, and loses both after the recovery");
    },
  },
  {
    // A3-M01 (the audit journey J1.6, red on 5ae2d406): which refusal a NEW start meets in a work-scoped planned window.
    // With a verified session the window refuses it, PR040 MAINTENANCE_PLACE (R-1). With no session at all it is refused
    // first, PR170 SITTING_NOT_CONTROLLER (S11: a call with no session is no writer, ahead of every other rule). J1.6 asked
    // the start with hand-written claims that carried no session_id, which no signed-in request lacks; the journey's claims
    // are restated (audit/b8-jalan.mjs), not the order.
    id: "A3-M01",
    requires: ["db"],
    run: async (ctx) => {
      const c = new Checks();
      const v = jalankanPulih(c, ctx.repoRoot);
      if (!v) return c.verdict("");
      c.expect(v.M01_sesi === "PR040:MAINTENANCE_PLACE", `a new start with a verified session, in a work-scoped window over the class, must meet the window (PR040 MAINTENANCE_PLACE): ${v.M01_sesi}`);
      c.expect(v.M01_tanpa === "PR170:SITTING_NOT_CONTROLLER", `the same start with no session is no writer, refused first (S11): ${v.M01_tanpa}`);
      c.expect(v.M01_boleh === "ok:MAINTENANCE_PLACE", `may_start's own answer for it is the window: ${v.M01_boleh}`);
      return c.verdict("executes start_learning_session and may_start_assessment against the migrations, rolled back: in a work-scoped planned window over the learner's class, a new start with a verified session is refused PR040 MAINTENANCE_PLACE (may_start says MAINTENANCE_PLACE), and the same start with no session is refused first, PR170 SITTING_NOT_CONTROLLER (S11)");
    },
  },
];
