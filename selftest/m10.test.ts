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
 *   M10-S02  db, rolled back: the cycle school publishes a chapter, then uploads its
 *            corrected package naming the chapter it corrects, with a summary: the
 *            new course is in the chapter's line, its summary kept with who wrote
 *            it and when, audited; released as 1.1.0 superseding 1.0.0, published,
 *            given to a class under the line's own pass mark; each problem is
 *            reported before confirmation (no summary, a course already corrected,
 *            a course never released, another school's course, two courses in one
 *            correction); a summary never changes and no client writes one
 *   M10-K01  executes akarGaris and terbaruPerGaris (src/lib/pengajar.ts): a line of
 *            corrections is one chapter, and of it only the newest published
 *            release is offered for new learning; reads the source: «Siapkan
 *            materi» offers each line once and not one the class already has;
 *            the Studio package page's «Koreksi» reads the whole line, and a
 *            corrected course links forward to its correction
 *   M10-K02  executes bisaDikoreksi (src/lib/pengajar.ts): a correction is offered
 *            only for a locked course that is the newest of its line; reads the
 *            source: the five correction problems are contract codes with their
 *            own sentences, the upload sends which course and why, the action
 *            refuses a reference that is not a course, and the package page links
 *            a locked course to the upload rather than making a copy no screen
 *            edits, and lists the line's history
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

const SKRIP2 = `
begin;
create temp table m10b_snap (k text, v jsonb) on commit drop;
grant all on m10b_snap to authenticated;
do $m10b$
declare v_inst uuid; v_other uuid; r record; v jsonb := '{}'::jsonb; v_batch uuid; x jsonb; v_rev uuid; v_rel2 uuid; f record;
        v_node uuid; v_state text; v_who text; v_draft uuid; v_judul text;
begin
  perform selftest.as_owner();
  select ra.institution_id into v_inst from public.role_assignments ra join public.accounts ac on ac.person_id = ra.person_id
    join auth.users u on u.id = ac.auth_user_id
   where u.email = 'siklus-admin@synthetic.pintar.test' and ra.role = 'INSTITUTION_ADMIN' and ra.revoked_at is null limit 1;
  v_judul := 'M10 koreksi ' || substr(md5(random()::text), 1, 6);
  select * into r from selftest.f13_release(v_inst, selftest.f13_paket(v_judul, 3, 2, false));
  perform selftest.pass_mark(v_inst, r.course);

  -- 1. the corrected package, naming the chapter it corrects, with what changed and why
  perform selftest.as_user('siklus-guru@synthetic.pintar.test');
  insert into public.ingest_batches (institution_id, source_kind, raw_payload, revises_course_id, change_summary)
  values (v_inst, 'STRUCTURED_PACKAGE', selftest.f13_paket(v_judul, 3, 2, false), r.course,
          'Soal nomor 2 kuncinya keliru; kunci dan alasannya diperbaiki.')
  returning id into v_batch;
  x := public.prepare_ingest_batch(v_batch);
  v := v || jsonb_build_object('siap', x -> 'ok');
  x := public.confirm_ingest_batch(v_batch);
  v_rev := (x -> 'courses' ->> 0)::uuid;
  perform selftest.as_owner();
  v := v || jsonb_build_object('simpan', x -> 'ok',
    'garis', (select c.supersedes_course_id = r.course from public.courses c where c.id = v_rev),
    'catatan', (select jsonb_build_object('ringkasan', n.summary, 'oleh', p.display_name, 'kapan', n.written_at is not null)
                  from public.course_revision_notes n join public.persons p on p.id = n.written_by_person_id where n.course_id = v_rev),
    'audit', (select count(*) from public.audit_log l where l.action = 'COURSE_CORRECTION_UPLOADED' and l.target_id = v_rev::text));

  -- 2. reviewed, released, frozen, published; given to a class under the line's own pass mark
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
  select n.id into v_node from public.org_nodes n
   where n.institution_id = v_inst and n.kind = 'CLASS' and n.is_active and n.academic_period_id is not null
   order by n.created_at limit 1;
  perform selftest.as_user('siklus-guru@synthetic.pintar.test');
  v := v || jsonb_build_object('beri', coalesce(selftest.f13_code(format('select public.assign_release(%L, %L, now(), null)', v_rel2, v_node)), 'given'));
  perform selftest.as_owner();
  v := v || jsonb_build_object('terbitan', (select jsonb_build_object('versi', r2.version_label, 'menggantikan', r2.supersedes_release_id = r.release)
      from public.plp_releases r2 where r2.id = v_rel2),
    'segel', (select string_agg(aa.pass_mark::text, ',') from public.assessment_assignments aa
       join public.learning_assignments la on la.id = aa.learning_assignment_id where la.plp_release_id = v_rel2 and aa.pass_mark is not null));

  -- 3. what is reported before confirmation
  insert into public.courses (institution_id, subject, stage, grade_label, title) values (v_inst, 'Matematika', 'SD', '5', 'M10 draf')
  returning id into v_draft;
  select ra.institution_id into v_other from public.role_assignments ra join public.accounts ac on ac.person_id = ra.person_id
    join auth.users u on u.id = ac.auth_user_id where u.email = 'boot-admin@bootstrap.pintar.test' and ra.role = 'INSTITUTION_ADMIN' limit 1;
  for v_who, x in select * from (values
      ('tanpa_ringkasan', jsonb_build_object('c', v_rev, 's', '  ')),
      ('bukan_terbaru', jsonb_build_object('c', r.course, 's', 'Perbaikan kedua dari yang lama.')),
      ('belum_terbit', jsonb_build_object('c', v_draft, 's', 'Perbaikan untuk draf yang belum terbit.')),
      ('sekolah_lain', jsonb_build_object('c', (select co.id from public.courses co where co.institution_id = v_other limit 1), 's', 'Perbaikan untuk kursus sekolah lain.')),
      ('dua_kursus', jsonb_build_object('c', v_rev, 's', 'Dua kursus dalam satu perbaikan.', 'dua', true))) t(a, b) loop
    perform selftest.as_user('siklus-guru@synthetic.pintar.test');
    insert into public.ingest_batches (institution_id, source_kind, raw_payload, revises_course_id, change_summary)
    values (v_inst, 'STRUCTURED_PACKAGE',
            case when (x ->> 'dua') is null then selftest.f13_paket(v_judul, 3, 2, false)
                 else jsonb_build_object('courses', (selftest.f13_paket(v_judul, 3, 2, false) -> 'courses') || (selftest.f13_paket(v_judul || ' b', 3, 2, false) -> 'courses')) end,
            (x ->> 'c')::uuid, x ->> 's')
    returning id into v_batch;
    v := v || jsonb_build_object(v_who, (select coalesce(jsonb_agg(p ->> 'code') filter (where (p ->> 'code') like 'REVISION_%'), '[]'::jsonb)
                                          from jsonb_array_elements(public.prepare_ingest_batch(v_batch) -> 'problems') p));
  end loop;

  -- 4. a summary is history
  perform selftest.as_owner();
  begin
    update public.course_revision_notes set summary = 'diubah kemudian' where course_id = v_rev;
    v := v || jsonb_build_object('ubah_catatan', 'changed');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate;
    v := v || jsonb_build_object('ubah_catatan', v_state);
  end;
  perform selftest.as_user('siklus-guru@synthetic.pintar.test');
  begin
    insert into public.course_revision_notes (course_id, institution_id, supersedes_course_id, summary)
    values (v_draft, v_inst, r.course, 'ditulis sendiri oleh klien');
    v := v || jsonb_build_object('tulis_catatan', 'written');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate;
    v := v || jsonb_build_object('tulis_catatan', v_state);
  end;
  perform selftest.as_owner();
  insert into m10b_snap values ('M10B', v);
end $m10b$;
select k || chr(9) || v::text from m10b_snap;
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
    id: "M10-S02",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      for (const f of ["fable01", "fable02", "fable03", "fable04", "fable05", "fable11", "fable12", "fable13"]) {
        spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", `${f}.sql`), db], { encoding: "utf8" });
      }
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", SKRIP2, db], { encoding: "utf8" });
      const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
      if (!c.expect(r.status === 0, `the scenario could not run: ${pesan}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      let m: Record<string, any> | null = null;
      for (const l of r.stdout.split("\n")) {
        const [k, v] = l.split("\t");
        if (k === "M10B" && v) m = JSON.parse(v);
      }
      if (!c.expect(!!m, "the database half returned no snapshot") || !m) return c.verdict("");
      c.expect(m.siap === true && m.simpan === true && m.garis === true,
        `the corrected package read ${JSON.stringify([m.siap, m.simpan, m.garis])}; expected checked, saved, and in the chapter's line`);
      c.expect(/kuncinya keliru/.test(m.catatan?.ringkasan ?? "") && !!m.catatan?.oleh && m.catatan?.kapan === true && Number(m.audit) === 1,
        `the correction's history reads ${JSON.stringify(m.catatan)}, audited ${m.audit}; expected what and why, by whom, when, audited once`);
      c.expect(m.terbitan?.versi === "1.1.0" && m.terbitan?.menggantikan === true && m.beri === "given" && /0\.6/.test(m.segel ?? ""),
        `the corrected chapter reads ${JSON.stringify(m.terbitan)}, given: ${m.beri}, sealed ${m.segel}; expected 1.1.0 superseding 1.0.0, given under the line's 60%`);
      const harap: Record<string, string> = {
        tanpa_ringkasan: "REVISION_SUMMARY_MISSING", bukan_terbaru: "REVISION_NOT_LATEST", belum_terbit: "REVISION_NOT_RELEASED",
        sekolah_lain: "REVISION_COURSE_UNKNOWN", dua_kursus: "REVISION_ONE_COURSE",
      };
      for (const [k, kode] of Object.entries(harap)) {
        c.expect(Array.isArray(m[k]) && m[k].includes(kode), `${k} was reported ${JSON.stringify(m[k])}; expected ${kode}`);
      }
      c.expect(m.ubah_catatan === "PR080" && m.tulis_catatan === "42501",
        `changing a summary was answered ${m.ubah_catatan}, a client writing one ${m.tulis_catatan}; expected PR080 and 42501`);
      return c.verdict(
        "executed in the database, rolled back (supabase/migrations/20261106100000): a published chapter's corrected package, " +
          "naming the chapter and saying what changed and why, is saved as a course in the chapter's line with its summary, " +
          "who wrote it and when, audited once; released as 1.1.0 superseding 1.0.0, published and given to a class under " +
          "the line's own 60%; no summary, a course already corrected, a course never released, another school's course and " +
          "two courses in one correction are each reported before confirmation; a summary never changes and no client writes one",
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
  {
    id: "M10-K02",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const { bisaDikoreksi } = await import("../src/lib/pengajar");
      const { KODE_MASALAH_PAKET, kunciMasalahPaket } = await import("../src/lib/unggah-kontrak");
      const { t } = await import("../src/lib/hle");
      const kursus = [
        { id: "b1", supersedes_course_id: null, status: "PUBLISHED" }, { id: "b1v2", supersedes_course_id: "b1", status: "PUBLISHED" },
        { id: "b2", supersedes_course_id: null, status: "DRAFT" }, { id: "b3", supersedes_course_id: null, status: "DRAFT" },
        { id: "b4", supersedes_course_id: null, status: "FROZEN" }, { id: "b4v2", supersedes_course_id: "b4", status: "DRAFT" },
      ];
      const rilis = [{ course_id: "b3", status: "PUBLISHED" }, { course_id: "b2", status: "APPROVED" }];
      const boleh = bisaDikoreksi(kursus, rilis).map((k) => k.id);
      c.expect(JSON.stringify(boleh) === JSON.stringify(["b1v2", "b3"]),
        `a correction is offered for ${JSON.stringify(boleh)}; expected the newest locked course of each line (b1v2, b3), never a ` +
          "corrected one, a draft, or a line whose newest course is a draft");

      const kode = ["REVISION_COURSE_UNKNOWN", "REVISION_NOT_RELEASED", "REVISION_NOT_LATEST", "REVISION_ONE_COURSE", "REVISION_SUMMARY_MISSING"];
      for (const k of kode) {
        c.expect((KODE_MASALAH_PAKET as readonly string[]).includes(k), `${k} is not a package problem the page knows`);
        c.expect(kunciMasalahPaket(k) !== "studio.paket.masalah.lain" && !t(kunciMasalahPaket(k), "staff", { locale: "id" }).includes(k),
          `${k} has no sentence of its own`);
      }

      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
      const aksi = buang(readFileSync(join(repoRoot, "src", "app", "studio", "actions.ts"), "utf8"));
      c.expect(/const revisi = uuidOrNull\(str\(fd, "revisi"\)\)/.test(aksi)
        && /if \(str\(fd, "revisi"\) && !revisi\) return \{ ok: false, code: "PACKAGE_INPUT_INVALID" \}/.test(aksi)
        && /revises_course_id: revisi, change_summary: revisi \? str\(fd, "ringkasan"\)/.test(aksi),
        "the upload does not send which course it corrects and why, or turns a bad reference into a new course");
      const panel = buang(readFileSync(join(repoRoot, "src", "components", "unggah", "PanelUnggah.tsx"), "utf8"));
      c.expect(/fd\.set\("revisi", revisi\)/.test(panel) && /fd\.set\("ringkasan", ringkasan\)/.test(panel)
        && /id="ung-revisi"/.test(panel) && /id="ung-ringkasan"/.test(panel),
        "the workbook panel does not ask which course a correction corrects, or what changed");
      const unggah = buang(readFileSync(join(repoRoot, "src", "app", "studio", "unggah", "page.tsx"), "utf8"));
      c.expect(/bisaDikoreksi\(/.test(unggah) && /revisiAwal=\{sp\.revisi \?\? null\}/.test(unggah),
        "the upload page does not offer the correctable courses, or ignores the course page's ?revisi=");
      const paket = buang(readFileSync(join(repoRoot, "src", "app", "studio", "paket", "[course]", "page.tsx"), "utf8"));
      c.expect(!/createRevisionAction/.test(paket) && /href=\{`\/studio\/unggah\?revisi=\$\{courseId\}#buku-kerja`\}/.test(paket)
        && /terkunci && !penerus/.test(paket),
        "the package page still makes a copy no screen edits, or offers a correction of a course that is not the line's newest locked one");
      c.expect(/from\("course_revision_notes"\)/.test(paket) && /id="riwayat"/.test(paket),
        "the package page does not show the line's correction history");
      return c.verdict(
        "executes bisaDikoreksi: a correction is offered only for the newest locked course of a line (never a corrected " +
          "course, a draft, or a line ending in a draft); the five correction problems are contract codes with sentences of " +
          "their own. Reads the source: the workbook panel asks which course and what changed and sends both, the action " +
          "refuses a reference that is not a course, the upload page offers the correctable courses and honours ?revisi=, " +
          "and the package page links a locked course to the upload and lists the line's correction history",
      );
    },
  },
];
