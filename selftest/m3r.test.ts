/**
 * D-085 M3 (J5.12) -- A TEACHER ASKS THE LEARNERS WHO NEED IT TO READ AGAIN.
 *
 * "The teacher may reassign existing learning material to selected learners
 * who need additional support. Automatic adaptive remediation is NOT required."
 * Migration 20261107100000: a request per learner for lessons of a chapter the
 * class was given, by the class's teacher, for learners placed in the class
 * now; the learner reads them again; the teacher sees it. Nothing about a
 * result, an attempt or a mastery changes.
 *
 *   M3R-S01  db, rolled back: the cycle school's chapter given to class 5S; its
 *            teacher asks two of its learners to read two lessons again; each
 *            refusal by its code (no learner, no lesson, a lesson of another
 *            chapter, a person not placed in the class, another school's
 *            teacher); the learner finds the request, marks each lesson read on
 *            reaching it, and the request closes; another learner neither sees
 *            nor marks it; the teacher reads who read what; a request is
 *            history; no client writes one
 *   M3R-K01  reads the source: the teacher's screen lists the class's learners
 *            under the target first and sends the chosen learners and lessons
 *            to request_lesson_review; the learner's home shows «Diminta
 *            gurumu» from my_lesson_reviews, after the next-step panel; a
 *            lesson opened from a request marks it read on its last page
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, type HleEvent } from "../src/lib/hle";

const SKRIP = `
begin;
create temp table m3r_snap (k text, v jsonb) on commit drop;
grant all on m3r_snap to authenticated;
do $m3r$
declare v_inst uuid; r record; v jsonb := '{}'::jsonb; v_node uuid; v_la uuid; v_l1 uuid; v_l2 uuid; v_lain uuid;
        v_a uuid; v_b uuid; v_luar uuid; v_req uuid; v_state text; v_detail text; x record; v_n int;
begin
  perform selftest.as_owner();
  select ra.institution_id into v_inst from public.role_assignments ra join public.accounts ac on ac.person_id = ra.person_id
    join auth.users u on u.id = ac.auth_user_id
   where u.email = 'siklus-admin@synthetic.pintar.test' and ra.role = 'INSTITUTION_ADMIN' and ra.revoked_at is null limit 1;
  -- the fixture chapter with a second lesson, so a request can name two
  v := selftest.f13_paket('M3R ' || substr(md5(random()::text), 1, 6), 3, 2, false);
  v := jsonb_set(v, '{courses,0,modules,0,lessons}', (v #> '{courses,0,modules,0,lessons}')
         || jsonb_build_array(jsonb_build_object('title', 'Pelajaran dua', 'body_markdown', 'Isi pelajaran kedua untuk murid kelas lima.')));
  select * into r from selftest.f13_release(v_inst, v);
  v := '{}'::jsonb;
  perform selftest.pass_mark(v_inst, r.course);
  select n.id into v_node from public.org_nodes n
   where n.institution_id = v_inst and n.kind = 'CLASS' and n.is_active and n.academic_period_id is not null
   order by n.created_at limit 1;
  perform selftest.as_user('siklus-guru@synthetic.pintar.test');
  perform public.assign_release(r.release, v_node, now(), null);
  perform selftest.as_owner();
  select id into v_la from public.learning_assignments where plp_release_id = r.release and node_id = v_node;
  select l.id into v_l1 from public.lessons l join public.modules mo on mo.id = l.module_id where mo.course_id = r.course order by mo.ordinal, l.ordinal limit 1;
  select l.id into v_l2 from public.lessons l join public.modules mo on mo.id = l.module_id where mo.course_id = r.course order by mo.ordinal, l.ordinal offset 1 limit 1;
  select l.id into v_lain from public.lessons l join public.modules mo on mo.id = l.module_id
   where mo.course_id <> r.course and l.institution_id = v_inst limit 1;
  select ac.person_id into v_a from public.accounts ac join auth.users u on u.id = ac.auth_user_id where u.email = 'siklus-email@synthetic.pintar.test';
  select ac.person_id into v_b from public.accounts ac join auth.users u on u.id = ac.auth_user_id where u.email = 'card-7002@cards.synthetic.pintar.test';
  select ac.person_id into v_luar from public.accounts ac join auth.users u on u.id = ac.auth_user_id where u.email = 'siklus-kaprodi@synthetic.pintar.test';
  v := v || jsonb_build_object('siap', jsonb_build_object('la', v_la is not null, 'l2', v_l2 is not null, 'lain', v_lain is not null,
                                                          'a', v_a is not null, 'b', v_b is not null));

  -- 1. the class's teacher asks two learners to read two lessons again
  perform selftest.as_user('siklus-guru@synthetic.pintar.test');
  v_n := public.request_lesson_review(v_la, array[v_a, v_b, v_a], array[v_l1, v_l2]);
  perform selftest.as_owner();
  v := v || jsonb_build_object('minta', v_n,
    'baris', (select count(*) from public.lesson_review_requests where learning_assignment_id = v_la),
    'butir', (select count(*) from public.lesson_review_items i join public.lesson_review_requests q on q.id = i.request_id where q.learning_assignment_id = v_la),
    'audit', (select count(*) from public.audit_log where action = 'lesson_review.requested' and target_id = v_la::text));
  select id into v_req from public.lesson_review_requests where learning_assignment_id = v_la and person_id = v_a;

  -- 2. each refusal says why
  for x in select * from (values
      ('tanpa_murid', 'siklus-guru@synthetic.pintar.test', '{}'::uuid[], array[v_l1]),
      ('tanpa_pelajaran', 'siklus-guru@synthetic.pintar.test', array[v_a], '{}'::uuid[]),
      ('bab_lain', 'siklus-guru@synthetic.pintar.test', array[v_a], array[v_lain]),
      ('bukan_kelasnya', 'siklus-guru@synthetic.pintar.test', array[v_luar], array[v_l1]),
      ('sekolah_lain', 'boot-admin@bootstrap.pintar.test', array[v_a], array[v_l1])) t(who, email, orang, pelajaran) loop
    perform selftest.as_user(x.email);
    begin
      perform public.request_lesson_review(v_la, x.orang, x.pelajaran);
      v := v || jsonb_build_object(x.who, 'accepted');
    exception when others then
      get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
      v := v || jsonb_build_object(x.who, v_state || ':' || coalesce(nullif(v_detail, ''), '-'));
    end;
  end loop;

  -- 3. the learner finds it, reads one lesson, then the other
  perform selftest.as_user('siklus-email@synthetic.pintar.test');
  v := v || jsonb_build_object('lihat', (select jsonb_build_object('n', count(*), 'pelajaran', max(jsonb_array_length(lessons)), 'oleh', max(requested_by))
                                           from public.my_lesson_reviews()));
  v := v || jsonb_build_object('baca1', public.record_lesson_review_read(v_req, v_l1), 'baca1_lagi', public.record_lesson_review_read(v_req, v_l1));
  v := v || jsonb_build_object('masih_terbuka', (select count(*) from public.my_lesson_reviews()));
  v := v || jsonb_build_object('baca2', public.record_lesson_review_read(v_req, v_l2));
  v := v || jsonb_build_object('tertutup', (select count(*) from public.my_lesson_reviews()));

  -- 4. another learner neither sees nor marks it
  perform selftest.as_user('card-7002@cards.synthetic.pintar.test');
  v := v || jsonb_build_object('lain_lihat', (select count(*) from public.lesson_review_requests where id = v_req),
                               'lain_sendiri', (select count(*) from public.my_lesson_reviews()));
  begin
    perform public.record_lesson_review_read(v_req, v_l2);
    v := v || jsonb_build_object('lain_tandai', 'marked');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate;
    v := v || jsonb_build_object('lain_tandai', v_state);
  end;

  -- 5. the teacher reads who read what
  perform selftest.as_user('siklus-guru@synthetic.pintar.test');
  v := v || jsonb_build_object('guru_lihat', (select jsonb_object_agg(case when q.person_id = v_a then 'a' else 'b' end,
                                                  (select count(*) filter (where i.read_at is not null) from public.lesson_review_items i where i.request_id = q.id))
                                                from public.lesson_review_requests q where q.learning_assignment_id = v_la));
  begin
    insert into public.lesson_review_requests (learning_assignment_id, person_id, node_id, institution_id, requested_by_person_id)
    values (v_la, v_a, v_node, v_inst, v_a);
    v := v || jsonb_build_object('tulis_sendiri', 'written');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate;
    v := v || jsonb_build_object('tulis_sendiri', v_state);
  end;

  -- 6. a request is history
  perform selftest.as_owner();
  begin
    update public.lesson_review_items set read_at = null where request_id = v_req;
    v := v || jsonb_build_object('ubah', 'changed');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate;
    v := v || jsonb_build_object('ubah', v_state);
  end;
  begin
    delete from public.lesson_review_requests where id = v_req;
    v := v || jsonb_build_object('hapus', 'deleted');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate;
    v := v || jsonb_build_object('hapus', v_state);
  end;
  -- 7. Daisy (1fad2861, B2; owner: follow it through to the learner): once the teacher ends the chapter, a request
  --    is refused with its own code, and the learner's still-open request leaves her home (my_lesson_reviews reads a
  --    chapter the class is given now); nothing is reopened to make the offer work
  perform selftest.as_user('siklus-guru@synthetic.pintar.test');
  v := v || jsonb_build_object('akhiri', (public.akhiri_penugasan(v_la, 'ENDED', 'Bab selesai untuk kelas ini.', true)) is not null);
  -- read in its own statement: one statement sees one snapshot, taken before the function above ended the chapter
  v := v || jsonb_build_object('status_akhir', (select status::text from public.learning_assignments where id = v_la));
  begin
    perform public.request_lesson_review(v_la, array[v_b], array[v_l1]);
    v := v || jsonb_build_object('setelah_akhir', 'accepted');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
    v := v || jsonb_build_object('setelah_akhir', v_state || ':' || coalesce(nullif(v_detail, ''), '-'));
  end;
  perform selftest.as_user('card-7002@cards.synthetic.pintar.test');
  v := v || jsonb_build_object('lain_setelah_akhir', (select count(*) from public.my_lesson_reviews() q where q.learning_assignment_id = v_la),
                               'lain_sebelum_akhir_bab', (select count(*) from public.lesson_review_requests q where q.learning_assignment_id = v_la));
  perform selftest.as_owner();
  insert into m3r_snap values ('M3R', v);
end $m3r$;
select k || chr(9) || v::text from m3r_snap;
rollback;
`;

export const m3rTests: SelfTest[] = [
  {
    id: "M3R-S01",
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
        if (k === "M3R" && v) m = JSON.parse(v);
      }
      if (!c.expect(!!m, "the database half returned no snapshot") || !m) return c.verdict("");
      c.expect(Object.values(m.siap ?? {}).every((x) => x === true), `the scenario's fixtures read ${JSON.stringify(m.siap)}`);
      c.expect(m.minta === 2 && Number(m.baris) === 2 && Number(m.butir) === 4 && Number(m.audit) === 1,
        `asking two learners (one named twice) for two lessons made ${m.minta} request(s), ${m.baris} row(s), ${m.butir} lesson row(s), audited ${m.audit}; expected 2, 2, 4, 1`);
      const tolak: Record<string, string> = {
        tanpa_murid: "PR050:REVIEW_NO_LEARNER", tanpa_pelajaran: "PR050:REVIEW_NO_LESSON", bab_lain: "PR050:REVIEW_LESSON_NOT_IN_CHAPTER",
        bukan_kelasnya: "PR050:REVIEW_NOT_IN_CLASS", sekolah_lain: "42501:-",
      };
      for (const [k, harap] of Object.entries(tolak)) c.expect(m[k] === harap, `${k} was answered ${m[k]}; expected ${harap}`);
      c.expect(Number(m.lihat?.n) === 1 && Number(m.lihat?.pelajaran) === 2 && !!m.lihat?.oleh,
        `the learner's home finds ${JSON.stringify(m.lihat)}; expected one request of two lessons, saying who asked`);
      c.expect(m.baca1 === true && m.baca1_lagi === false && Number(m.masih_terbuka) === 1 && m.baca2 === true && Number(m.tertutup) === 0,
        `reading read ${JSON.stringify([m.baca1, m.baca1_lagi, m.masih_terbuka, m.baca2, m.tertutup])}; expected marked once, still open after one, closed after both`);
      c.expect(Number(m.lain_lihat) === 0 && Number(m.lain_sendiri) === 1 && m.lain_tandai === "42501",
        `another learner saw ${m.lain_lihat} of it, has ${m.lain_sendiri} of their own, and marking it was answered ${m.lain_tandai}; expected 0, 1, 42501`);
      c.expect(Number(m.guru_lihat?.a) === 2 && Number(m.guru_lihat?.b) === 0 && m.tulis_sendiri === "42501",
        `the teacher reads ${JSON.stringify(m.guru_lihat)} and writing a row directly was answered ${m.tulis_sendiri}; expected a: 2 read, b: 0, and 42501`);
      c.expect(m.ubah === "PR080" && m.hapus === "PR080", `changing a request was answered ${m.ubah}, removing it ${m.hapus}; expected PR080`);
      // Daisy (1fad2861, B2): an ended chapter takes no request, and the open one no longer reaches the learner's home
      c.expect(m.akhiri === true && m.status_akhir === "ENDED" && m.setelah_akhir === "PR050:REVIEW_ASSIGNMENT_CLOSED"
        && Number(m.lain_setelah_akhir) === 0 && Number(m.lain_sebelum_akhir_bab) >= 1,
        `after the teacher ended the chapter (${m.status_akhir}) a request was answered ${m.setelah_akhir} and the learner's home lists ${m.lain_setelah_akhir} of its ${m.lain_sebelum_akhir_bab} kept request(s); expected PR050:REVIEW_ASSIGNMENT_CLOSED and 0`);
      return c.verdict(
        "executed in the database, rolled back (supabase/migrations/20261107100000): the cycle school's chapter given to class " +
          "5S; its teacher asks two of its learners (one named twice) to read two lessons again: two requests, four lessons, " +
          "audited once; no learner, no lesson, another chapter's lesson and a person not placed in the class are refused by " +
          "their codes, another school's teacher by 42501; the learner finds the request with who asked, each lesson is marked " +
          "read once, and the request closes after both; another learner neither sees nor marks it; the teacher reads who read " +
          "what; a request never changes or goes; no client writes one; once the teacher ends the chapter a request is " +
          "refused (REVIEW_ASSIGNMENT_CLOSED) and the learner's still-open request leaves her home, the requests kept",
      );
    },
  },
  {
    id: "M3R-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => readFileSync(join(repoRoot, ...p), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
      const aksi = baca("src", "app", "mengajar", "actions.ts");
      c.expect(/rpc\("request_lesson_review", \{ p_learning_assignment: tugas, p_people: murid, p_lessons: pelajaran \}\)/.test(aksi),
        "the teacher's action does not send the chosen learners and lessons to request_lesson_review");
      const halaman = baca("src", "app", "mengajar", "[kelas]", "ulang", "page.tsx");
      c.expect(/name="murid"/.test(halaman) && /name="pelajaran"/.test(halaman)
        && /defaultChecked=\{dariMurid \? m\.id === dariMurid : m\.status === "bawah"\}/.test(halaman),
        "the teacher's screen does not let the teacher choose learners and lessons, or does not mark who is under the target");
      const ajar = baca("src", "lib", "pengajar.ts");
      c.expect(/export function urutUlang\(/.test(ajar), "the screen's order (under the target first) is not one pure function");
      // Daisy (1fad2861, B2): a chapter the class is no longer given offers no request: the learner's page leaves the link
      // out, and the request screen says so in place of its form (the database refuses it: M3R-S01)
      const murid1 = baca("src", "app", "mengajar", "[kelas]", "murid", "[orang]", "page.tsx");
      c.expect(/tertutup: la\.status !== "ACTIVE"/.test(ajar) && /learning_assignments\(status\)/.test(ajar)
        && /&& !catatan\.tugasTertutup\[catatan\.tugasSesi\[h\.sesi\]\] \?/.test(murid1)
        && /\{bahan\.tertutup \? \([\s\S]*?mengajar\.ulang\.tolak\.review_assignment_closed[\s\S]*?\) : \([\s\S]*?<form action=\{mintaBacaUlang\}/.test(halaman),
        "an ended or withdrawn chapter still offers «Minta membaca lagi» on the learner's page, or the request screen still offers its form");
      const rumah = baca("src", "app", "belajar", "page.tsx");
      const panel = rumah.indexOf("<PanelLanjut");
      const diminta = rumah.indexOf('id="pin-diminta"');
      c.expect(/engine\.lessonReviews\(db\)|rpc\("my_lesson_reviews"\)|myLessonReviews/.test(rumah) && panel >= 0 && diminta > panel,
        "the learner's home does not show the teacher's request, or shows it before the next-step panel (W18 stays first)");
      const pemutar = baca("src", "app", "belajar", "_components", "LessonPlayer.tsx");
      const halPelajaran = baca("src", "app", "belajar", "[tugas]", "pelajaran", "[pelajaran]", "page.tsx");
      const aksiBelajar = baca("src", "app", "belajar", "actions.ts");
      c.expect(/void tandaiUlang\(ulang, lessonId\)/.test(pemutar) && /if \(props\.ulang\) return 0;/.test(pemutar)
        && /tandaiUlang=\{ulang \? tandaiBacaUlang : null\}/.test(halPelajaran) && /rpc\("record_lesson_review_read"/.test(aksiBelajar),
        "a lesson opened from a request does not start at its first page, or does not mark it read on its last");
      const { kodeUlang, KODE_ULANG } = await import("../src/lib/ulang-kontrak");
      for (const k of KODE_ULANG) {
        const v = t(`mengajar.ulang.tolak.${k.toLowerCase()}` as HleEvent, "educator", { locale: "id" });
        c.expect(!!v && !v.includes(k) && !v.startsWith("mengajar."), `${k} has no sentence of its own`);
      }
      c.expect(kodeUlang({ code: "PR050", details: "REVIEW_NOT_IN_CLASS" }) === "REVIEW_NOT_IN_CLASS"
        && kodeUlang({ code: "PR050", details: "the database's own words" }) === "REVIEW_FAILED"
        && kodeUlang({ code: "42501", details: null }) === "REVIEW_NOT_ALLOWED",
        "a refusal's code is not read from the fixed list, or the database's words could pass as one");
      return c.verdict(
        "reads the source: the teacher's screen lists the class's learners with those under the target marked, lets the " +
          "teacher choose learners and lessons, and sends them to request_lesson_review; the order is one pure function; the " +
          "learner's home shows the request after the next-step panel; a lesson opened from a request marks it read; a chapter " +
          "the class is no longer given offers no request, on the learner's page or the request screen",
      );
    },
  },
];
