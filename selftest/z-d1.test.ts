/**
 * Z · D-1 (R-16): THE GUARD ON EVERY READER OF A RESPONSE'S `pilihan` (Sharon, RULING55-D1-D8-D6-7ba18b03.md, D-1).
 *
 * A multi-answer response is stored as `{"pilihan": ["A","C"]}`, a single answer as `{"pilihan": "A"}`. A reader that
 * takes `value ->> 'pilihan'` as one label matches no option for the array, so the learner's review, Peta Bacaan, the
 * teacher's evidence and three statistical views lose the answer, or show raw JSON as «chosen».
 *
 *   Z-D1-02  every function and view body in a non-system schema that reads `->> 'pilihan'` is on one of two lists,
 *            named here for Sharon (Bob's condition 3 of Z-PLAN-APPROVAL.md):
 *              ALLOWED: array-aware by Sharon's ruling (grade_response, grade_kunci, session_answers). Each must still
 *                       branch on jsonb_typeof(... 'pilihan'); a body that stops doing so leaves the list.
 *              PENDING: the seven readers D-1 repairs in Z1 (migration 20270123100000). Each must still be found as it
 *                       is: once a reader is repaired, it leaves this list in the same commit, or the guard fails.
 *            A reader on neither list fails the guard. So a new scalar reader cannot land, and the pending list
 *            empties only by repair. Containment stays in force until Sharon passes the repaired readers.
 *            The harness's own schema (selftest, loaded by the runner, never migrated) is not product and is left out.
 */
import { Checks, type SelfTest } from "./lib";
import { psql } from "./bob26.test";

/** Array-aware by Sharon's ruling (D-1 table, «No»): each branches on jsonb_typeof before it reads a scalar. */
export const PILIHAN_DIIZINKAN = ["fn:grade_kunci", "fn:grade_response", "fn:session_answers"] as const;
/** D-1's seven, repaired in Z1. Learner-facing, teacher-facing, statistical (Sharon's classes). */
export const PILIHAN_MENUNGGU_D1 = [
  "fn:reading_map", "fn:session_misconceptions", "fn:session_review",
  "fn:teacher_question_evidence",
  "view:service_cohort_misconceptions", "view:service_distractor_uptake", "view:service_item_statistics",
] as const;

const SKALAR = `->>\\s*''pilihan''`;
const CABANG = `jsonb_typeof\\s*\\([^)]*->\\s*''pilihan''`;

export const zD1Tests: SelfTest[] = [
  {
    id: "Z-D1-02",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const baris = psql(`
select k || '|' || bercabang from (
  select 'fn:' || case when n.nspname = 'public' then '' else n.nspname || '.' end || p.proname as k,
         (p.prosrc ~ '${CABANG}')::text as bercabang
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname not in ('pg_catalog', 'information_schema', 'selftest') and n.nspname !~ '^pg_(toast|temp)'
     and p.prosrc ~ '${SKALAR}'
  union
  select 'view:' || case when v.schemaname = 'public' then '' else v.schemaname || '.' end || v.viewname,
         (v.definition ~ '${CABANG}')::text
    from pg_views v
   where v.schemaname not in ('pg_catalog', 'information_schema', 'selftest') and v.definition ~ '${SKALAR}'
  union
  select 'view:' || case when m.schemaname = 'public' then '' else m.schemaname || '.' end || m.matviewname,
         (m.definition ~ '${CABANG}')::text
    from pg_matviews m
   where m.schemaname <> 'selftest' and m.definition ~ '${SKALAR}'
) x order by 1;`).split("\n").filter(Boolean);
      const ditemukan = new Map(baris.map((b) => { const [k, v] = b.split("|"); return [k, v === "true"] as const; }));
      const izin = new Set<string>(PILIHAN_DIIZINKAN);
      const tunggu = new Set<string>(PILIHAN_MENUNGGU_D1);

      const asing = [...ditemukan.keys()].filter((k) => !izin.has(k) && !tunggu.has(k));
      c.expect(asing.length === 0, `a reader of ->> 'pilihan' on neither list: ${asing.join(", ")} (a new scalar reader; make it array-aware, or put it to Sharon)`);
      const tanpaCabang = [...izin].filter((k) => ditemukan.has(k) && !ditemukan.get(k));
      c.expect(tanpaCabang.length === 0, `on the allowed list but no longer branching on jsonb_typeof(... 'pilihan'): ${tanpaCabang.join(", ")}`);
      const hilang = [...tunggu].filter((k) => !ditemukan.has(k));
      c.expect(hilang.length === 0, `pending D-1 but no longer reading ->> 'pilihan': ${hilang.join(", ")} (repaired? remove it from PILIHAN_MENUNGGU_D1 in the same commit)`);
      const menunggu = [...tunggu].filter((k) => ditemukan.has(k));
      return c.verdict(`reads every function, view and materialised view body outside the system schemas and the harness's selftest schema (pg_proc, pg_views, pg_matviews): ${ditemukan.size} read ->> 'pilihan'; `
        + `allowed and array-aware: ${[...izin].filter((k) => ditemukan.has(k)).join(", ") || "none"}; `
        + `pending D-1 (Z1): ${menunggu.length} (${menunggu.join(", ") || "none"}); on neither list: none`);
    },
  },
];
