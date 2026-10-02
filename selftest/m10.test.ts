/**
 * D-085 M10 -- A SEALED CHAPTER KEEPS ITS TESTS' QUESTIONS, AND SO DOES ITS CORRECTION.
 *
 * "Correct forward. Never rewrite backward." Two defects stood in the way
 * (supabase/migrations/20261105100000): a teacher with CAN_DRAFT could move a
 * published chapter's question in or out of its Pemetaan Awal or Uji Penguasaan
 * (items.cycle_role was not frozen with the rest of the question), and a
 * revision of a chapter lost every such mark, so its two tests drew from one
 * pool and the corrected chapter could not be given.
 *
 *   M10-S01  db, rolled back: a published chapter of the cycle school; its
 *            teacher's change to a question's cycle_role is refused; a revision
 *            keeps every mark; reviewed, released (1.1.0, superseding 1.0.0),
 *            frozen and published by the screens' own functions, the corrected
 *            chapter is given to a class whose pre-test and post-test draw the
 *            marked questions and never the same ones
 *   M10-K01  executes akarGaris and terbaruPerGaris (src/lib/pengajar.ts): a line of
 *            corrections is one chapter, and of it only the newest published
 *            release is offered for new learning; reads the source: «Siapkan
 *            materi» offers each line once and not one the class already has;
 *            the Studio package page's «Koreksi» reads the whole line, and a
 *            corrected course links forward to its correction
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const SKRIP = `
begin;
create temp table m10_snap (k text, v jsonb) on commit drop;
grant all on m10_snap to authenticated;
do $m10$
declare v_inst uuid; r record; v_item uuid; v jsonb := '{}'::jsonb; v_state text; v_rev uuid; v_rel2 uuid; v_node uuid;
        x jsonb; v_la jsonb; f record;
begin
  perform selftest.as_owner();
  select ra.institution_id into v_inst from public.role_assignments ra join public.accounts ac on ac.person_id = ra.person_id
    join auth.users u on u.id = ac.auth_user_id
   where u.email = 'siklus-admin@synthetic.pintar.test' and ra.role = 'INSTITUTION_ADMIN' and ra.revoked_at is null limit 1;
  select * into r from selftest.f13_release(v_inst, selftest.f13_paket('M10 ' || substr(md5(random()::text), 1, 6), 3, 2, false));
  select i.id into v_item from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
   where m.course_id = r.course and i.cycle_role = 'POST_TEST' limit 1;

  -- 1. a published chapter's test questions do not move
  perform selftest.as_user('siklus-guru@synthetic.pintar.test');
  begin
    update public.items set cycle_role = null where id = v_item;
    v := v || jsonb_build_object('ubah_peran', 'changed');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate;
    v := v || jsonb_build_object('ubah_peran', v_state);
  end;

  -- 2. a revision keeps every mark
  perform selftest.as_user('siklus-guru@synthetic.pintar.test');
  v_rev := public.create_course_revision(r.course);
  perform selftest.as_owner();
  v := v || jsonb_build_object(
    'tanda_asal', (select jsonb_object_agg(k, n) from (select coalesce(i.cycle_role::text, '-') k, count(*) n from public.items i
        join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id = r.course group by 1) q),
    'tanda_revisi', (select jsonb_object_agg(k, n) from (select coalesce(i.cycle_role::text, '-') k, count(*) n from public.items i
        join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id = v_rev group by 1) q));

  -- 3. the corrected chapter through review, release, freeze and publish, as the cycle school's people
  perform selftest.as_user('siklus-guru@synthetic.pintar.test');
  perform selftest.f12_advance(v_rev, 'STRUCTURED');
  perform selftest.f12_advance(v_rev, 'VALIDATED');
  perform selftest.f12_advance(v_rev, 'IN_REVIEW');
  perform selftest.as_user('siklus-kaprodi@synthetic.pintar.test');
  perform selftest.f12_advance(v_rev, 'APPROVED');
  perform selftest.as_user('siklus-admin@synthetic.pintar.test');
  v_rel2 := (public.create_release(v_rev) ->> 'release')::uuid;
  perform selftest.as_user('siklus-kaprodi@synthetic.pintar.test');
  x := public.freeze_release(v_rel2);
  for f in select q.id from public.mcq_quality_findings q where q.course_id = v_rev and q.acknowledged_at is null loop
    perform public.acknowledge_finding('MCQ_QUALITY', f.id, 'M10');
  end loop;
  for f in select q.id from public.coaching_findings q where q.course_id = v_rev and q.acknowledged_at is null loop
    perform public.acknowledge_finding('COACHING', f.id, 'M10');
  end loop;
  perform selftest.as_user('siklus-admin@synthetic.pintar.test');
  perform public.publish_release(v_rel2);
  perform selftest.as_owner();
  perform selftest.pass_mark(v_inst, r.course);
  v := v || jsonb_build_object('terbitan', (select jsonb_build_object('versi', r2.version_label, 'status', r2.status,
      'menggantikan', r2.supersedes_release_id = r.release) from public.plp_releases r2 where r2.id = v_rel2));

  -- 4. given to a class: its two tests draw the marked questions, never the same ones
  select n.id into v_node from public.org_nodes n
   where n.institution_id = v_inst and n.kind = 'CLASS' and n.is_active and n.academic_period_id is not null
     and not exists (select 1 from public.learning_assignments la where la.node_id = n.id and la.plp_release_id = v_rel2)
   order by n.created_at limit 1;
  perform selftest.as_user('siklus-guru@synthetic.pintar.test');
  v := v || jsonb_build_object('beri', coalesce(selftest.f13_code(format('select public.assign_release(%L, %L, now(), null)', v_rel2, v_node)), 'given'));
  perform selftest.as_owner();
  v := v || jsonb_build_object('tarik', (select jsonb_object_agg(d.mode, (select count(*) from public.eligible_items_for_definition(d.id)))
      from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
      join public.learning_assignments la on la.id = aa.learning_assignment_id where la.plp_release_id = v_rel2));
  insert into m10_snap values ('M10', v);
end $m10$;
select k || chr(9) || v::text from m10_snap;
rollback;
`;

export const m10Tests: SelfTest[] = [
  {
    id: "M10-S01",
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
        if (k === "M10" && v) m = JSON.parse(v);
      }
      if (!c.expect(!!m, "the database half returned no snapshot") || !m) return c.verdict("");

      c.expect(m.ubah_peran !== "changed", `a teacher moved a published chapter's question out of its Uji Penguasaan (${m.ubah_peran})`);
      c.expect(JSON.stringify(m.tanda_asal) === JSON.stringify(m.tanda_revisi) && Number(m.tanda_asal?.PRE_TEST) > 0 && Number(m.tanda_asal?.POST_TEST) > 0,
        `the revision's marks read ${JSON.stringify(m.tanda_revisi)}; the chapter's ${JSON.stringify(m.tanda_asal)}`);
      c.expect(m.terbitan?.versi === "1.1.0" && m.terbitan?.status === "PUBLISHED" && m.terbitan?.menggantikan === true,
        `the corrected chapter's release reads ${JSON.stringify(m.terbitan)}; expected 1.1.0, published, superseding 1.0.0`);
      c.expect(m.beri === "given", `giving the corrected chapter to a class was answered ${m.beri}`);
      c.expect(Number(m.tarik?.PRE_TEST) === Number(m.tanda_revisi?.PRE_TEST) && Number(m.tarik?.POST_TEST) === Number(m.tanda_revisi?.POST_TEST),
        `the class's tests may draw ${JSON.stringify(m.tarik)}; expected each its own marked questions ${JSON.stringify(m.tanda_revisi)}`);
      return c.verdict(
        "executed in the database, rolled back (supabase/migrations/20261105100000): a published chapter of the cycle " +
          "school; its teacher's change to a question's cycle_role is refused; a revision keeps every Pemetaan Awal and Uji " +
          "Penguasaan mark; reviewed, released as 1.1.0 superseding 1.0.0, frozen and published, the corrected chapter is " +
          "given to a class and each of its tests draws exactly its own marked questions",
      );
    },
  },
  {
    id: "M10-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const { akarGaris, terbaruPerGaris } = await import("../src/lib/pengajar");
      const akar = akarGaris([
        { id: "b1", supersedes_course_id: null }, { id: "b1v2", supersedes_course_id: "b1" }, { id: "b1v3", supersedes_course_id: "b1v2" },
        { id: "b2", supersedes_course_id: null }, { id: "putus", supersedes_course_id: "hilang" },
        { id: "x", supersedes_course_id: "y" }, { id: "y", supersedes_course_id: "x" },
      ]);
      c.expect(akar.get("b1v3") === "b1" && akar.get("b1v2") === "b1" && akar.get("b1") === "b1" && akar.get("b2") === "b2",
        `a line of corrections reads ${JSON.stringify([...akar])}; expected every revision under its first course`);
      c.expect(akar.get("putus") === "hilang" && ["x", "y"].includes(akar.get("x") ?? ""), "a broken or cyclic pointer is not survived");
      const daftar = [
        { id: "r3", courseId: "b1v3", terbitPada: "2026-10-03T00:00:00Z" },
        { id: "r2b", courseId: "b2", terbitPada: "2026-10-02T00:00:00Z" },
        { id: "r1", courseId: "b1", terbitPada: "2026-09-01T00:00:00Z" },
        { id: "r2", courseId: "b1v2", terbitPada: "2026-09-15T00:00:00Z" },
      ];
      const kini = terbaruPerGaris(daftar, akar).map((x) => x.id);
      c.expect(JSON.stringify(kini) === JSON.stringify(["r3", "r2b"]),
        `the releases offered for new learning read ${JSON.stringify(kini)}; expected the newest of Bab 1's line (r3) and Bab 2 (r2b), in the list's order`);

      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
      const ajar = buang(readFileSync(join(repoRoot, "src", "lib", "pengajar.ts"), "utf8"));
      c.expect(/const out = terbaruPerGaris\(sekolah, await garisSekolah\(institusi\)\)/.test(ajar),
        "«Siapkan materi» still offers a corrected release beside its correction");
      const siap = buang(readFileSync(join(repoRoot, "src", "app", "mengajar", "[kelas]", "siapkan", "page.tsx"), "utf8"));
      c.expect(/const garisPunya = new Set\(/.test(siap) && /!garisPunya\.has\(akar\.get\(r\.courseId\) \?\? r\.courseId\)/.test(siap),
        "a class already given a chapter is offered its correction as a second chapter");
      const paket = buang(readFileSync(join(repoRoot, "src", "app", "studio", "paket", "[course]", "page.tsx"), "utf8"));
      c.expect(/\.in\("course_id", garis\.length > 0 \? garis : \[courseId\]\)\.eq\("status", "ACTIVE"\)/.test(paket)
        && /const published = \(rilisGaris \?\? \[\]\)\.filter/.test(paket) && /data-penerus=\{penerus\}/.test(paket),
        "«Koreksi» reads one course rather than its line, or a corrected course does not lead to its correction");
      return c.verdict(
        "executes akarGaris and terbaruPerGaris (src/lib/pengajar.ts): a line of corrections maps to its first course " +
          "(a broken or cyclic pointer survived), and only each line's newest published release is offered for new learning, " +
          "in the list's order. Reads the source: «Siapkan materi» offers each line once and never one the class already " +
          "has; the Studio package page's «Koreksi» reads the line's releases and classes, and a corrected course links forward",
      );
    },
  },
];
