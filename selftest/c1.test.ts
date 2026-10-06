/**
 * D-084 C1, D-085 M1 (J1.1) -- A SCHOOL IS FOUNDED BY ONE VERSIONED, AUDITED STEP.
 *
 * Migration 20261108100000: operator_found_school, executable by the
 * operator's connection only, makes the minimum foundation (the school, its
 * root place, its current school year) and audits it with the operator run
 * that made it. .github/workflows/found-school.yml is the only caller.
 *
 *   C1-S01  db, rolled back, in production posture (as staging runs): the step
 *           founds a real school with its root place and school year, audited
 *           twice (institution.created by the trigger, school.founded with the
 *           operator reference); a taken slug, a slug of the wrong shape, a year
 *           that ends before it starts and a founding without its operator
 *           reference are refused by code; a signed-in session cannot run it;
 *           in development posture the existing evidence rule (INV-21) still
 *           refuses a real school
 *   C1-K01  reads the workflow: dispatch only, staging's database only (its
 *           project ref named, production's refused), the inputs passed as psql
 *           variables and never spliced into the SQL, and nothing else written
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const SKRIP = `
begin;
create temp table c1_snap (k text, v jsonb) on commit drop;
grant all on c1_snap to service_role, authenticated;
do $c1$
declare v jsonb := '{}'::jsonb; v_id uuid; v_state text; v_detail text; v_msg text; x record;
        v_slug text := 'c1-' || substr(md5(random()::text), 1, 8);
begin
  update public.platform_environment set environment = 'production', local_fixtures_enabled = false;

  -- 1. the operator's connection founds the school
  set local role service_role;
  v_id := public.operator_found_school('SD Contoh C1', v_slug, '2026/2027', date '2026-07-13', date '2027-06-30',
                                       'found-school.yml run 1 by the selftest');
  reset role;
  v := v || jsonb_build_object(
    'sekolah', (select jsonb_build_object('sintetis', i.is_synthetic, 'nama', i.name, 'resmi', i.official_evidence_purpose is null)
                  from public.institutions i where i.id = v_id),
    'akar', (select count(*) from public.org_nodes n where n.id = v_id and n.kind = 'INSTITUTION' and n.parent_id is null),
    'tahun', (select count(*) from public.academic_periods p where p.institution_id = v_id and p.name = '2026/2027'),
    'di_bawah_akar', (select count(*) from public.org_nodes n where n.institution_id = v_id and n.id <> v_id),
    'orang', (select count(*) from public.role_assignments r where r.institution_id = v_id),
    'audit', (select jsonb_object_agg(l.action, l.summary ->> 'operator_ref') from public.audit_log l
               where l.target_id = v_id::text and l.action in ('institution.created', 'school.founded')));

  -- 2. what it refuses, by code
  for x in select * from (values
      ('slug_dipakai', 'SD Kedua', v_slug, '2026/2027', date '2026-07-13', date '2027-06-30', 'found-school.yml run 2'),
      ('slug_salah', 'SD Ketiga', 'Bukan Slug!', '2026/2027', date '2026-07-13', date '2027-06-30', 'found-school.yml run 3'),
      ('tahun_salah', 'SD Keempat', v_slug || '-b', '2026/2027', date '2027-06-30', date '2026-07-13', 'found-school.yml run 4'),
      ('tanpa_operator', 'SD Kelima', v_slug || '-c', '2026/2027', date '2026-07-13', date '2027-06-30', '')) t(k, n, s, y, a, b, r) loop
    begin
      set local role service_role;
      perform public.operator_found_school(x.n, x.s, x.y, x.a, x.b, x.r);
      reset role;
      v := v || jsonb_build_object(x.k, 'founded');
    exception when others then
      reset role;
      get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
      v := v || jsonb_build_object(x.k, v_state || ':' || coalesce(nullif(v_detail, ''), '-'));
    end;
  end loop;

  -- 3. a signed-in session cannot found a school
  perform selftest.as_user('siklus-admin@synthetic.pintar.test');
  begin
    perform public.operator_found_school('SD Sesi', v_slug || '-d', '2026/2027', date '2026-07-13', date '2027-06-30', 'a session, not an operator');
    v := v || jsonb_build_object('sesi', 'founded');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate;
    v := v || jsonb_build_object('sesi', v_state);
  end;
  perform selftest.as_owner();

  -- 4. in development posture the evidence rule still refuses a real school
  update public.platform_environment set environment = 'development';
  begin
    set local role service_role;
    perform public.operator_found_school('SD Pengembangan', v_slug || '-e', '2026/2027', date '2026-07-13', date '2027-06-30', 'found-school.yml run 5');
    reset role;
    v := v || jsonb_build_object('pengembangan', 'founded');
  exception when others then
    reset role;
    get stacked diagnostics v_msg = message_text;
    v := v || jsonb_build_object('pengembangan', v_msg);
  end;
  insert into c1_snap values ('C1', v);
end $c1$;
select k || chr(9) || v::text from c1_snap;
rollback;
`;

export const c1Tests: SelfTest[] = [
  {
    id: "C1-S01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      for (const f of ["fable01", "fable02", "fable03", "fable04", "fable05", "fable11", "fable12", "fable13"]) {
        spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", `${f}.sql`), db], { encoding: "utf8" });
      }
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", SKRIP, db], { encoding: "utf8" });
      const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
      if (!c.expect(r.status === 0, `the scenario could not run: ${pesan}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      let m: Record<string, any> | null = null;
      for (const l of r.stdout.split("\n")) {
        const [k, v] = l.split("\t");
        if (k === "C1" && v) m = JSON.parse(v);
      }
      if (!c.expect(!!m, "the database half returned no snapshot") || !m) return c.verdict("");
      c.expect(m.sekolah?.sintetis === false && m.sekolah?.resmi === true && Number(m.akar) === 1 && Number(m.tahun) === 1,
        `the founded school reads ${JSON.stringify(m.sekolah)}, root ${m.akar}, school year ${m.tahun}; expected a real school with its root place and one year`);
      c.expect(Number(m.di_bawah_akar) === 0 && Number(m.orang) === 0,
        `the founding made ${m.di_bawah_akar} place(s) below the root and ${m.orang} role(s); the foundation holds neither`);
      c.expect(m.audit?.["school.founded"] === "found-school.yml run 1 by the selftest" && "institution.created" in (m.audit ?? {}),
        `the founding's audit reads ${JSON.stringify(m.audit)}; expected institution.created and school.founded with the operator run`);
      const tolak: Record<string, string> = {
        slug_dipakai: "PR050:FOUND_SLUG_TAKEN", slug_salah: "PR050:FOUND_SLUG", tahun_salah: "PR050:FOUND_YEAR", tanpa_operator: "PR050:FOUND_OPERATOR",
      };
      for (const [k, harap] of Object.entries(tolak)) c.expect(m[k] === harap, `${k} was answered ${m[k]}; expected ${harap}`);
      c.expect(m.sesi === "42501", `a signed-in session founding a school was answered ${m.sesi}; expected 42501`);
      c.expect(/OFFICIAL bootstrap/.test(String(m.pengembangan ?? "")),
        `in development posture a real school was answered ${m.pengembangan}; expected the evidence rule's refusal (INV-21)`);
      return c.verdict(
        "executed in the database, rolled back (supabase/migrations/20261108100000), in production posture as staging runs: the " +
          "operator's step founds a real school with its root place and one school year and nothing more (no place below the " +
          "root, no role), audited as institution.created and school.founded with the operator run; a taken slug, a slug of the " +
          "wrong shape, a year that ends before it starts and a founding without its operator run are refused by code; a " +
          "signed-in session cannot run it (42501); in development posture the evidence rule (INV-21) still refuses a real school",
      );
    },
  },
  {
    id: "C1-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const wf = readFileSync(join(repoRoot, ".github", "workflows", "found-school.yml"), "utf8");
      const pemicu = /^on:\s*\n((?:[ \t]+.*\n)+)/m.exec(wf)?.[1] ?? "";
      c.expect(/workflow_dispatch:/.test(pemicu) && !/\b(push|pull_request|schedule|workflow_run):/.test(pemicu),
        "the founding workflow runs on something other than a dispatch");
      c.expect(/STAGING_SUPABASE_PROJECT_REF: keijhmdtsgrfvnvocfvk/.test(wf) && /PRODUCTION_SUPABASE_PROJECT_REF/.test(wf)
        && /the database URL names production/.test(wf), "the founding workflow does not pin staging's database and refuse production's");
      c.expect(/-v nama=/.test(wf) && /:'nama'/.test(wf) && !/\$\{\{\s*(github\.event\.)?inputs\.[a-z_]+\s*\}\}[^\n]*operator_found_school/.test(wf),
        "the founding workflow splices an input into its SQL instead of passing it as a psql variable");
      const sqlBaris = wf.split("\n").filter((l) => /\b(insert|update|delete)\b/i.test(l) && !/^\s*#/.test(l));
      c.expect(sqlBaris.length === 0, `the founding workflow writes outside operator_found_school: ${sqlBaris.join(" | ")}`);
      return c.verdict(
        "reads .github/workflows/found-school.yml: a dispatch only, staging's database only (its project ref pinned, a URL " +
          "naming production refused), the inputs passed to operator_found_school as psql variables and never spliced into " +
          "the SQL, and no other write",
      );
    },
  },
];
