/**
 * ADM-J19 -- A NEW YEAR CARRIES THE WHOLE CLASS, AND SAYS HOW MANY IT CARRIED.
 *
 * Konfigurasi's «Pergantian tahun ajaran» (period_rollover) had never been run
 * outside a seeded test. Run on the bootstrap school, it left a learner
 * recorded and not yet signed in (PENDING) in last year's Kelas with no Kelas
 * in the new year, and it reported the last class's count as the total
 * (supabase/migrations/20261028100000 corrects both).
 *
 *   ADM19-S01  db: in one rolled-back transaction, two classes of the
 *              bootstrap school, one with an ACTIVE and a PENDING learner and
 *              one with an ACTIVE learner, are rolled into next year's two
 *              classes by the school's administrator
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const SKRIP = `
begin;
create temp table adm19_snap (k text, v jsonb) on commit drop;
grant all on adm19_snap to authenticated;
do $a19$
declare f record; v_5b uuid; v_coh uuid; v_prog uuid; v_p1 uuid; v_p2 uuid; v_coh2 uuid; v_6a uuid; v_5x uuid; v_6b uuid;
        v_pend uuid; v_enr uuid; v_n int; v_guru int;
begin
  perform selftest.as_owner();
  select * into f from selftest.boot_fixture();
  select n.id, n.parent_id, n.academic_period_id into v_5b, v_coh, v_p1
    from public.org_nodes n where n.institution_id = f.inst and n.kind = 'CLASS' and n.name = '5B';
  select parent_id into v_prog from public.org_nodes where id = v_coh;
  insert into public.academic_periods (institution_id, name, starts_on, ends_on)
  values (f.inst, 'ADM19 berikut', date '2090-07-01', date '2091-06-30') returning id into v_p2;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (f.inst, v_prog, 'COHORT', 'ADM19 Angkatan berikut', v_p2) returning id into v_coh2;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (f.inst, v_coh2, 'CLASS', 'ADM19 6A', v_p2) returning id into v_6a;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (f.inst, v_coh, 'CLASS', 'ADM19 5X', v_p1) returning id into v_5x;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (f.inst, v_coh2, 'CLASS', 'ADM19 6B', v_p2) returning id into v_6b;
  -- 5B: the bootstrap learner (ACTIVE) and one recorded, not yet signed in (PENDING); 5X: one ACTIVE
  insert into public.persons (display_name) values ('ADM19 Belum Masuk') returning id into v_pend;
  insert into public.enrollments (person_id, institution_id, academic_period_id, status)
  values (v_pend, f.inst, v_p1, 'PENDING') returning id into v_enr;
  insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_enr, v_5b, v_p1);
  insert into public.persons (display_name) values ('ADM19 Kelas Lain') returning id into v_pend;
  insert into public.enrollments (person_id, institution_id, academic_period_id, status)
  values (v_pend, f.inst, v_p1, 'ACTIVE') returning id into v_enr;
  insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_enr, v_5x, v_p1);
  insert into adm19_snap values ('AWAL', jsonb_build_object(
    '5b', (select count(*) from public.memberships m where m.node_id = v_5b and m.valid_to is null),
    '5x', (select count(*) from public.memberships m where m.node_id = v_5x and m.valid_to is null)));

  -- a teacher may not run it
  perform selftest.as_user('boot-guru@bootstrap.pintar.test');
  begin
    perform public.period_rollover(f.inst, v_p1, v_p2, jsonb_build_array(jsonb_build_object('from_node', v_5b, 'to_node', v_6a)));
    v_guru := 1;
  exception when others then v_guru := 0;
  end;

  perform selftest.as_user('boot-admin@bootstrap.pintar.test');
  -- RESTATED (Sharon F6, ruling 3; 20270112190000): no longer a client endpoint; the administrator's run is driven as
  -- the database's owner carrying the administrator's claims, and its authority check still decides. The teacher above
  -- stays refused (now by the privilege as well).
  reset role;
  v_n := public.period_rollover(f.inst, v_p1, v_p2, jsonb_build_array(
           jsonb_build_object('from_node', v_5b, 'to_node', v_6a), jsonb_build_object('from_node', v_5x, 'to_node', v_6b)));
  perform selftest.as_owner();
  insert into adm19_snap values ('AKHIR', jsonb_build_object(
    'guru', v_guru,
    'n', v_n,
    'tinggal_5b', (select coalesce(jsonb_agg(p.display_name order by p.display_name), '[]') from public.memberships m
                     join public.enrollments e on e.id = m.enrollment_id join public.persons p on p.id = e.person_id
                    where m.node_id = v_5b and m.valid_to is null),
    '6a', (select coalesce(jsonb_agg(e.status::text order by e.status::text), '[]') from public.memberships m
             join public.enrollments e on e.id = m.enrollment_id where m.node_id = v_6a and m.valid_to is null),
    '6b', (select count(*) from public.memberships m where m.node_id = v_6b and m.valid_to is null),
    'ditutup', (select count(*) from public.memberships m where m.node_id in (v_5b, v_5x) and m.close_reason = 'PERIOD_ROLLOVER'),
    'audit', (select count(*) from public.audit_log a where a.action = 'period.rollover' and a.target_id = v_p2::text)));
end $a19$;
select k || chr(9) || v::text from adm19_snap order by k;
rollback;
`;

export const adm19Tests: SelfTest[] = [
  {
    id: "ADM19-S01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      for (const f of ["fable01", "fable02", "fable03", "fable04"]) {
        spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", `${f}.sql`), db], { encoding: "utf8" });
      }
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", SKRIP, db], { encoding: "utf8" });
      const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
      if (!c.expect(r.status === 0, `the rollover could not run: ${pesan}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const snap: Record<string, any> = {};
      for (const l of r.stdout.split("\n")) {
        const [k, v] = l.split("\t");
        if (k && v) snap[k] = JSON.parse(v);
      }
      const { AWAL: awal, AKHIR: akhir } = snap;
      if (!c.expect(!!awal && !!akhir, "the database half returned no snapshot")) return c.verdict("");
      c.expect(akhir.guru === 0, "the class's teacher ran a rollover");
      c.expect(Array.isArray(akhir.tinggal_5b) && akhir.tinggal_5b.length === 0,
        `after the rollover 5B still holds ${JSON.stringify(akhir.tinggal_5b)}: a learner not yet signed in stayed in last year's class`);
      c.expect(JSON.stringify(akhir["6a"]) === JSON.stringify(["ACTIVE", "PENDING"]),
        `next year's 6A holds ${JSON.stringify(akhir["6a"])}; expected the ACTIVE and the PENDING learner of 5B`);
      c.expect(akhir["6b"] === 1, `next year's 6B holds ${akhir["6b"]}; expected 5X's learner`);
      const semua = awal["5b"] + awal["5x"];
      c.expect(akhir.n === semua && akhir.ditutup === semua,
        `the rollover reported ${akhir.n} and closed ${akhir.ditutup} memberships; ${semua} moved (the screen reads the report)`);
      c.expect(akhir.audit >= 1, "the rollover left no audit row");
      return c.verdict(
        "executed in the database as the school's administrator, rolled back: period_rollover " +
          "(supabase/migrations/20261028100000) carries both learners of 5B into next year's 6A, the one who has " +
          "signed in (ACTIVE) and the one recorded and not yet signed in (PENDING), and 5X's into 6B; nobody stays in " +
          "last year's class; it reports every class's count (the total the screen shows), closes the same number " +
          "with PERIOD_ROLLOVER and writes its audit row; the class's teacher is refused",
      );
    },
  },
];
