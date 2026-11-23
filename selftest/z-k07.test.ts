/**
 * Z · K-07 (ruling 78; ruling 81 refinement 6): A PASS MARK HAS A FLOOR, IN EACH COLUMN'S OWN UNIT.
 *
 *   Z-K07-01  On the migrated, seeded world, each value written in its own rolled-back transaction (with triggers off,
 *             so only the column's checks decide): school_pass_marks.percent refuses 0 and 101, accepts 1 and 100;
 *             assessment_assignments.pass_mark and assessment_sessions.pass_mark (fractions) refuse 0 and 1.01, accept
 *             0.01 and 1.00, and still allow null. The school's own writer, set_school_pass_mark, as the school's
 *             admin, refuses 0 in its own words (22023, «from 1 to 100») and accepts 1. Every floor is validated and no
 *             row is below it. Red on 300: a mark of 0 is accepted everywhere.
 */
import { Checks, type SelfTest } from "./lib";
import { lit, psql } from "./bob26.test";

const ADMIN = "peraga-admin@evaluasi.pintar.test";

function tulis(sql: string): string {
  try {
    psql(`begin; set local session_replication_role = replica; ${sql}; rollback;`);
    return "diterima";
  } catch (e) {
    return /check constraint|violates|Failing row contains/i.test((e as Error).message) ? "ditolak" : `galat: ${(e as Error).message}`;
  }
}

export const zK07Tests: SelfTest[] = [
  {
    id: "Z-K07-01",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const satu = (t: string) => `(select id from public.${t} where pass_mark is not null order by id limit 1)`;
      const kasus: Array<[string, string, string]> = [
        ["percent 0", `update public.school_pass_marks set percent = 0 where id = (select id from public.school_pass_marks order by id limit 1)`, "ditolak"],
        ["percent 101", `update public.school_pass_marks set percent = 101 where id = (select id from public.school_pass_marks order by id limit 1)`, "ditolak"],
        ["percent 1", `update public.school_pass_marks set percent = 1 where id = (select id from public.school_pass_marks order by id limit 1)`, "diterima"],
        ["percent 100", `update public.school_pass_marks set percent = 100 where id = (select id from public.school_pass_marks order by id limit 1)`, "diterima"],
        ...(["assessment_assignments", "assessment_sessions"] as const).flatMap((t): Array<[string, string, string]> => [
          [`${t} 0`, `update public.${t} set pass_mark = 0 where id = ${satu(t)}`, "ditolak"],
          [`${t} 1.01`, `update public.${t} set pass_mark = 1.01 where id = ${satu(t)}`, "ditolak"],
          [`${t} 0.01`, `update public.${t} set pass_mark = 0.01 where id = ${satu(t)}`, "diterima"],
          [`${t} 1.00`, `update public.${t} set pass_mark = 1.00 where id = ${satu(t)}`, "diterima"],
        ]),
        ["assessment_sessions null", `update public.assessment_sessions set pass_mark = null, pass_mark_source = null where id = ${satu("assessment_sessions")}`, "diterima"],
      ];
      const lihat: string[] = [];
      for (const [apa, sql, mau] of kasus) {
        const dapat = tulis(sql);
        lihat.push(`${apa} ${dapat}`);
        c.expect(dapat === mau, `${apa}: ${dapat} (expected ${mau})`);
      }
      // the school's own writer, as its admin, in its own words
      const tetapkan = (p: number) => {
        try {
          return psql(`begin;
create temp table t_k on commit drop as select a.institution_id as inst from public.role_assignments a
  join public.accounts ac on ac.person_id = a.person_id join auth.users u on u.id = ac.auth_user_id
 where u.email = ${lit(ADMIN)} and a.role = 'INSTITUTION_ADMIN' and a.revoked_at is null limit 1;
grant select on t_k to authenticated;
create function pg_temp.coba(p int) returns text language plpgsql as $f$
declare v_inst uuid := (select inst from t_k);
begin
  return 'ok|' || (public.set_school_pass_mark(v_inst, (public.school_pass_mark_lessons(v_inst) -> 0 ->> 'course_id')::uuid, p, 'Z-K07-01') ->> 'percent');
exception when others then return 'ditolak|' || sqlstate || '|' || sqlerrm;
end $f$;
select selftest.as_user(${lit(ADMIN)});
select pg_temp.coba(${p});
rollback;`).split("\n").find((b) => /^(ok|ditolak)\|/.test(b)) ?? "no row";
        } catch (e) { return `galat: ${(e as Error).message}`; }
      };
      const nol = tetapkan(0), satuPersen = tetapkan(1);
      c.expect(/^ditolak\|22023\|.*from 1 to 100/.test(nol), `set_school_pass_mark(0) as the school's admin: ${nol} (refused, «… from 1 to 100»)`);
      c.expect(satuPersen === "ok|1", `set_school_pass_mark(1): ${satuPersen}`);
      const sah = psql(`select string_agg(conname || ':' || convalidated, ',' order by conname) from pg_constraint where conname in ('school_pass_marks_percent_floor', 'assessment_assignments_pass_mark_floor', 'assessment_sessions_pass_mark_floor')`);
      c.expect(sah === "assessment_assignments_pass_mark_floor:true,assessment_sessions_pass_mark_floor:true,school_pass_marks_percent_floor:true",
        `the floors, validated: ${sah || "none"}`);
      return c.verdict(`writes each value in its own rolled-back transaction, triggers off: ${lihat.join("; ")}; set_school_pass_mark as the school's admin refuses 0 («${nol}») and accepts 1; the three floors are validated (${sah})`);
    },
  },
];
