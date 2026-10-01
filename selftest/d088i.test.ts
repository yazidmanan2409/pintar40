/**
 * D-088(i) (Yazid, 2 Oct) -- LEARNER-LEVEL ACCESS FOLLOWS THE CURRENT PLACEMENT.
 *
 * `audience_scope_over_learner` decides whether a reader stands over a learner
 * for the teacher's view of one learner (M4, `learner.result`), the head of
 * department's learner record and every learner-subject metric. It read every
 * placement the learner ever had, so after a class move the old class's teacher
 * and head of department still stood over them. Migration 20261030100000 counts
 * only open placements of a current enrolment, and the learner record keeps the
 * places left as `placement_history`, never as current.
 *
 *   D088I-S01  db: in one rolled-back transaction, Hana (5B only) is read by
 *              5B's teacher and Matematika's head of department, moved by the
 *              admin to 5X in another department, then refused to both; the
 *              head of department of her new department reads 5X now and 5B
 *              as history (MOVED)
 *   D088I-K01  static: the learner record renders the history apart from the
 *              current placement, with year, end date and reason in id and en
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { t } from "../src/lib/hle";
import { Checks, type SelfTest } from "./lib";

const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

/** The database half, rolled back. Each snapshot is one `KEY<TAB>json` line. */
const SKRIP = `
begin;
create temp table d088i_snap (k text, v jsonb) on commit drop;
grant all on d088i_snap to authenticated;
do $d088i$
declare f record; v_period uuid; v_coh uuid; v_5b uuid; v_fak uuid; v_dept uuid; v_prog uuid; v_coh2 uuid; v_5x uuid;
        v_hana uuid; v_enr uuid; v_pen uuid; v_kaprodi uuid; v_r jsonb; v_state text; v_detail text; v_coba jsonb := '{}'::jsonb;
begin
  perform selftest.as_owner();
  select * into f from selftest.boot_fixture();
  select n.id, n.academic_period_id, n.parent_id into v_5b, v_period, v_coh
    from public.org_nodes n where n.institution_id = f.inst and n.kind = 'CLASS' and n.name = '5B';
  select id into v_fak from public.org_nodes where institution_id = f.inst and kind = 'FACULTY' and name = 'Sekolah Dasar';
  -- another department of the same school and year: Bahasa > SD Bahasa > Angkatan 5 Bahasa > 5X
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (f.inst, v_fak, 'DEPARTMENT', 'Bahasa') returning id into v_dept;
  insert into public.org_nodes (institution_id, parent_id, kind, name) values (f.inst, v_dept, 'PROGRAMME', 'SD Bahasa') returning id into v_prog;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (f.inst, v_prog, 'COHORT', 'Angkatan 5 Bahasa', v_period) returning id into v_coh2;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (f.inst, v_coh2, 'CLASS', '5X', v_period) returning id into v_5x;
  -- Hana: an active learner placed in 5B only
  insert into public.persons (display_name) values ('Hana Murid D088I') returning id into v_hana;
  insert into public.enrollments (person_id, institution_id, academic_period_id, status) values (v_hana, f.inst, v_period, 'ACTIVE') returning id into v_enr;
  insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_enr, v_5b, v_period) returning id into v_pen;
  select p.id into v_kaprodi from public.persons p join public.accounts a on a.person_id = p.id join auth.users u on u.id = a.auth_user_id
   where u.email = 'boot-kaprodi@bootstrap.pintar.test';

  -- BEFORE: 5B's teacher (M4: learner.result) and Matematika's head of department (the learner record)
  perform selftest.as_user('boot-guru@bootstrap.pintar.test');
  v_r := public.metric_evaluate('learner.result', v_hana, f.inst);
  v_coba := v_coba || jsonb_build_object('guru_sebelum', coalesce(v_r ->> 'status', 'ok'));
  perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
  begin
    v_r := public.management_learner_detail(v_hana, f.inst);
    v_coba := v_coba || jsonb_build_object('kaprodi_sebelum', 'opened', 'penempatan_sebelum', v_r -> 'placement');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate;
    v_coba := v_coba || jsonb_build_object('kaprodi_sebelum', 'refused:' || v_state);
  end;

  -- the school's administrator moves Hana to 5X (Bahasa), and makes the Matematika head of department head of Bahasa too
  perform selftest.as_user('boot-admin@bootstrap.pintar.test');
  perform public.move_learner_to_class(v_pen, v_5x);

  -- AFTER: the former teacher and the former department's head no longer stand over her
  perform selftest.as_user('boot-guru@bootstrap.pintar.test');
  v_r := public.metric_evaluate('learner.result', v_hana, f.inst);
  v_coba := v_coba || jsonb_build_object('guru_sesudah', coalesce(v_r ->> 'status', 'ok'));
  perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
  begin
    v_r := public.management_learner_detail(v_hana, f.inst);
    v_coba := v_coba || jsonb_build_object('kaprodi_sesudah', 'opened');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate;
    v_coba := v_coba || jsonb_build_object('kaprodi_sesudah', 'refused');
  end;

  -- the head of department of where she is now reads her record: 5X now, 5B as history
  perform selftest.as_user('boot-admin@bootstrap.pintar.test');
  perform public.grant_role(v_kaprodi, 'HEAD_OF_DEPARTMENT', v_dept, now() + interval '30 days');
  perform selftest.as_user('boot-kaprodi@bootstrap.pintar.test');
  v_r := public.management_learner_detail(v_hana, f.inst);
  insert into d088i_snap values ('BARU', jsonb_build_object('penempatan', v_r -> 'placement', 'riwayat', v_r -> 'placement_history'));

  perform selftest.as_owner();
  insert into d088i_snap values ('AKHIR', jsonb_build_object('coba', v_coba, 'kelas_5b', v_5b, 'kelas_5x', v_5x,
    'sesi_tetap', true));
end $d088i$;
select k || chr(9) || v::text from d088i_snap order by k;
rollback;
`;

export const d088iTests: SelfTest[] = [
  {
    id: "D088I-S01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      for (const f of ["fable01", "fable02", "fable03", "fable04"]) {
        spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", `${f}.sql`), db], { encoding: "utf8" });
      }
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", SKRIP, db], { encoding: "utf8" });
      const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
      if (!c.expect(r.status === 0, `the move and the reads could not run: ${pesan}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const snap: Record<string, any> = {};
      for (const l of r.stdout.split("\n")) {
        const [k, v] = l.split("\t");
        if (k && v) snap[k] = JSON.parse(v);
      }
      const { AKHIR: akhir, BARU: baru } = snap;
      if (!c.expect(!!akhir && !!baru, "the database half returned no snapshot")) return c.verdict("");
      const coba = akhir.coba as Record<string, unknown>;

      // before the move both stood over her (the teacher's read is permitted: too little evidence is not a refusal)
      c.expect(coba.guru_sebelum !== "not_permitted", `before the move, 5B's teacher was answered ${coba.guru_sebelum}`);
      c.expect(coba.kaprodi_sebelum === "opened", `before the move, Matematika's head of department was ${coba.kaprodi_sebelum}`);
      // after it, neither does: authority follows current responsibility
      c.expect(coba.guru_sesudah === "not_permitted",
        `after the move to 5X, 5B's former teacher still reads her learner result: ${coba.guru_sesudah}`);
      c.expect(coba.kaprodi_sesudah === "refused",
        `after the move to another department, Matematika's head of department still opens her record: ${coba.kaprodi_sesudah}`);
      // the head of department where she is now: 5X now, 5B as history, never as current
      const kini = ((baru.penempatan ?? []) as Array<{ node_id: string }>).map((p) => p.node_id);
      const riwayat = (baru.riwayat ?? []) as Array<{ node_id: string; reason: string | null; until: string | null; academic_year: string | null }>;
      c.expect(JSON.stringify(kini) === JSON.stringify([akhir.kelas_5x]),
        `her record's current placement is ${JSON.stringify(kini)}; expected 5X only`);
      c.expect(riwayat.length === 1 && riwayat[0].node_id === akhir.kelas_5b && riwayat[0].reason === "MOVED" && !!riwayat[0].until && !!riwayat[0].academic_year,
        `her record's history is ${JSON.stringify(riwayat)}; expected 5B, ended, MOVED, with its year`);

      return c.verdict(
        "executed in the database, rolled back (supabase/migrations/20261030100000): before Hana's move 5B's teacher " +
          "reads her learner result (metric_evaluate learner.result) and Matematika's head of department opens her " +
          "record (management_learner_detail); after the admin moves her to 5X in another department, the teacher is " +
          "answered not_permitted and the head of department is refused; the head of department of Bahasa reads 5X as " +
          "her placement now and 5B under placement_history with its year, end and MOVED",
      );
    },
  },
  {
    id: "D088I-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const hal = buang(readFileSync(join(repoRoot, "src", "app", "pimpinan", "[simpul]", "murid", "[orang]", "page.tsx"), "utf8"));
      c.expect(/rincian\.placement\.map\(\(p\) => p\.name\)/.test(hal) && /s\("pimpinan\.rincian\.penempatan"\)/.test(hal),
        "the learner record no longer names the current placement");
      c.expect(/rincian\.placement_history[\s\S]{0,200}s\("pimpinan\.rincian\.riwayat"\)[\s\S]{0,900}format\.date\(h\.until, locale\)[\s\S]{0,300}pimpinan\.rincian\.alasan\./.test(hal),
        "the learner record does not show the places left apart, with the day each ended and why");
      for (const locale of ["id", "en"] as const) {
        for (const k of ["pimpinan.rincian.penempatan", "pimpinan.rincian.riwayat", "pimpinan.rincian.sampai",
          "pimpinan.rincian.alasan.MOVED", "pimpinan.rincian.alasan.PERIOD_ROLLOVER", "pimpinan.rincian.alasan.ENROLLMENT_ENDED"] as const) {
          const kal = t(k, "staff", { locale });
          c.expect(kal.length > 3 && kal !== k, `(${locale}) ${k} has no text`);
        }
        const kini = t("pimpinan.rincian.penempatan", "staff", { locale });
        c.expect(/sekarang|now/i.test(kini), `(${locale}) the current placement is labelled «${kini}», not as now`);
      }
      const mig = readFileSync(join(repoRoot, "supabase", "migrations", "20261030100000_learner_access_follows_the_current_placement.sql"), "utf8");
      c.expect(/m\.valid_to is null\s*\n\s*and e\.status in \('PENDING', 'ACTIVE'\)/.test(mig) && /placement_history/.test(mig),
        "the migration does not limit the reader to open placements, or has no history");
      return c.verdict(
        "reads the source of the learner record (src/app/pimpinan/[simpul]/murid/[orang]/page.tsx): the placement now " +
          "under «Penempatan sekarang», and apart from it «Penempatan sebelumnya» with each place's year, the day it " +
          "ended (format.date) and why (moved class, new school year, no longer at the school); reads the copy table in " +
          "id and en, and supabase/migrations/20261030100000 (open placements of a current enrolment; placement_history)",
      );
    },
  },
];
