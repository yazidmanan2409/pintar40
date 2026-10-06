/**
 * D-085 T2 -- UJI CEPAT: CHOOSE, TICK, REVIEW, LAUNCH; THE CLASS GETS EXACTLY THOSE QUESTIONS.
 *
 * "Teacher opens Uji Cepat → chooses the relevant question bank/topic → sees
 * available authorised questions → tick, tick, tick, tick, tick → reviews the
 * selected questions → Publish/Launch → students answer → teacher immediately
 * understands the result. The teacher controls which questions are selected."
 * Until now the teacher chose a chapter and a count and every learner drew a
 * random subset nobody had seen. Migration 20261104100000: the chapter's
 * questions for the class (quick_assessment_choices), a launch with the chosen
 * questions (launch_selected_quick_assessment) and one line in the draw that
 * admits only them.
 *
 *   T2-S01  db, rolled back: the bootstrap teacher reads the chapter's questions
 *           (stem, options, topic; no key) and they are exactly what an Uji
 *           Cepat on it may draw; three ticked are launched and the learner's
 *           paper is exactly those three; the instrument's eligible set is the
 *           three; refusals: two questions, one twice, another chapter's
 *           question, two versions of one question (PR050 with their codes),
 *           each leaving nothing behind; the learner and another school's
 *           teacher cannot read the choices; the selection never changes and is
 *           audited once; an Uji Cepat launched the old way still draws from the
 *           whole chapter
 *   T2-K01  static: the page goes chapter → questions to tick (GET) → review of
 *           the ticked questions → one POST; the action calls the chosen
 *           launch with the ticked ids; a refusal carries them back; the three
 *           new codes have their own sentences in id and en; the running and
 *           the last Uji Cepat link to «Lihat per soal» (M5)
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { t, type HleEvent } from "../src/lib/hle";
import { Checks, type SelfTest } from "./lib";

const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

/** The database half, rolled back. One `T2<TAB>json` line. */
const SKRIP = `
begin;
create temp table t2_snap (k text, v jsonb) on commit drop;
grant all on t2_snap to authenticated;
do $t2$
declare f record; v_node uuid; v jsonb := '{}'::jsonb; v_pick uuid[]; v_def uuid; v_aa uuid; v_s uuid; v_state text; v_det text;
        v_q record; v_other uuid; v_sib uuid[]; v_plain record; v_before int; v_after int; v_who text;
begin
  perform selftest.as_owner();
  select * into f from selftest.boot_fixture();
  select la.node_id into v_node from public.learning_assignments la where la.id = f.la;
  perform selftest.pass_mark(f.inst, f.course);

  -- 1. what the teacher ticks from, against what an Uji Cepat on this chapter may draw
  perform selftest.as_user('boot-guru@bootstrap.pintar.test');
  create temp table t2_pilihan on commit drop as select * from public.quick_assessment_choices(v_node, f.modul);
  select * into v_plain from public.launch_quick_assessment(v_node, f.modul, 3, 20);   -- the old way, for comparison
  perform selftest.as_owner();
  v := v || jsonb_build_object(
    'pilihan', (select count(*) from t2_pilihan),
    'kunci_di_opsi', (select count(*) from t2_pilihan p, jsonb_array_elements(p.options) o where o ? 'is_correct' or o ? 'rationale'),
    'tanpa_isi', (select count(*) from t2_pilihan p where coalesce(p.stem, '') = '' or jsonb_array_length(p.options) < 2),
    'boleh', (select count(*) from public.eligible_items_for_definition(v_plain.assessment_definition_id) e
               join public.items i on i.id = e.item_id join public.item_type_learner_support s on s.item_type = i.item_type),
    'sama', not exists (
      (select p.item_id from t2_pilihan p
        except select e.item_id from public.eligible_items_for_definition(v_plain.assessment_definition_id) e)
      union all
      (select e.item_id from public.eligible_items_for_definition(v_plain.assessment_definition_id) e
         join public.items i on i.id = e.item_id join public.item_type_learner_support s on s.item_type = i.item_type
        except select p.item_id from t2_pilihan p)));

  -- 2. three ticked, launched; the learner's paper is exactly those
  select array_agg(item_id order by lesson_ordinal, item_id) into v_pick
    from (select p.item_id, p.lesson_ordinal from t2_pilihan p order by p.lesson_ordinal, p.item_id limit 3) x;
  perform selftest.as_user('boot-guru@bootstrap.pintar.test');
  select * into v_q from public.launch_selected_quick_assessment(v_node, f.modul, v_pick, 20);
  v_def := v_q.assessment_definition_id; v_aa := v_q.assessment_assignment_id;
  perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
  v_s := public.start_learning_session(v_aa);
  perform selftest.as_owner();
  v := v || jsonb_build_object(
    'kertas_sama', (select array_agg(pi.item_id order by pi.item_id) from public.presented_items pi where pi.session_id = v_s)
                     = (select array_agg(x order by x) from unnest(v_pick) x),
    'kertas_n', (select count(*) from public.presented_items pi where pi.session_id = v_s),
    'boleh_kini', (select count(*) from public.eligible_items_for_definition(v_def)),
    'mix', (select difficulty_mix from public.assessment_definitions where id = v_def),
    'n_def', (select item_count from public.assessment_definitions where id = v_def),
    'audit', (select count(*) from public.audit_log l where l.action = 'quick_assessment.selected' and l.target_id = v_def::text),
    'segel', (select pass_mark from public.assessment_assignments where id = v_aa),
    'kertas_lama', (select count(*) from public.eligible_items_for_definition(v_plain.assessment_definition_id)));

  -- 3. refusals, each leaving nothing behind
  select count(*) into v_before from public.assessment_definitions where is_ad_hoc;
  select i.id into v_other from public.items i join public.lessons l on l.id = i.lesson_id
   where i.institution_id = f.inst and l.module_id <> f.modul limit 1;
  if v_other is null then
    -- the bootstrap school has one chapter: another is made here, as F04-T04d does, and undone with the rest
    insert into public.courses (institution_id, subject, stage, grade_label, title)
    values (f.inst, 'Matematika', 'SD', '5', 'T2 bab lain') returning id into v_other;
    insert into public.modules (course_id, institution_id, ordinal, title)
    values (v_other, f.inst, 1, 'T2 bab lain') returning id into v_other;
    insert into public.lessons (module_id, institution_id, ordinal, title, body_markdown)
    values (v_other, f.inst, 1, 'T2 pelajaran lain', 'isi') returning id into v_other;
    insert into public.items (lesson_id, institution_id, item_type, bank_type, stem)
    values (v_other, f.inst, 'MCQ_SINGLE', 'PRACTICE', 'T2: soal bab lain') returning id into v_other;
  end if;
  -- two versions of one question: the first two choices put in one parallel group, as hand-authored content could
  -- carry; the chapter is frozen (INV-04), so this setup write goes around the triggers, inside the rollback
  v_sib := v_pick[1:2] || (select array_agg(p.item_id) from (select item_id from t2_pilihan where not item_id = any(v_pick) limit 1) p);
  set local session_replication_role = replica;
  update public.items set parallel_group = gen_random_uuid() where id = v_pick[1];
  update public.items set parallel_group = (select parallel_group from public.items where id = v_pick[1]) where id = v_pick[2];
  set local session_replication_role = origin;
  foreach v_who in array array['dua', 'kembar', 'bab_lain', 'versi'] loop
    perform selftest.as_user('boot-guru@bootstrap.pintar.test');
    begin
      perform public.launch_selected_quick_assessment(v_node, f.modul,
        case v_who when 'dua' then v_pick[1:2]
                   when 'kembar' then array[v_pick[1], v_pick[1], v_pick[2]]
                   when 'bab_lain' then array[v_pick[1], v_pick[3], v_other]
                   else v_sib end, 20);
      v := v || jsonb_build_object(v_who, 'launched');
    exception when others then
      get stacked diagnostics v_state = returned_sqlstate, v_det = pg_exception_detail;
      v := v || jsonb_build_object(v_who, v_state || ' ' || coalesce(v_det, ''));
    end;
  end loop;
  perform selftest.as_owner();
  select count(*) into v_after from public.assessment_definitions where is_ad_hoc;
  v := v || jsonb_build_object('sisa_tolak', v_after - v_before);

  -- 4. who may read the choices
  foreach v_who in array array['boot-siswa@bootstrap.pintar.test', 'siklus-guru@synthetic.pintar.test'] loop
    perform selftest.as_user(v_who);
    begin
      perform count(*) from public.quick_assessment_choices(v_node, f.modul);
      v := v || jsonb_build_object(split_part(v_who, '@', 1), 'read');
    exception when others then
      get stacked diagnostics v_state = returned_sqlstate;
      v := v || jsonb_build_object(split_part(v_who, '@', 1), v_state);
    end;
  end loop;

  -- 5. the selection never changes
  perform selftest.as_owner();
  foreach v_who in array array['ubah', 'hapus', 'tambah'] loop
    begin
      if v_who = 'ubah' then update public.quick_assessment_selections set ordinal = 9 where definition_id = v_def and ordinal = 1;
      elsif v_who = 'hapus' then delete from public.quick_assessment_selections where definition_id = v_def;
      else insert into public.quick_assessment_selections (definition_id, item_id, institution_id, ordinal)
           select v_def, p.item_id, f.inst, 4 from t2_pilihan p where not p.item_id = any(v_pick) limit 1; end if;
      v := v || jsonb_build_object('pilih_' || v_who, 'changed');
    exception when others then
      get stacked diagnostics v_state = returned_sqlstate;
      v := v || jsonb_build_object('pilih_' || v_who, v_state);
    end;
  end loop;
  insert into t2_snap values ('T2', v);
end $t2$;
select k || chr(9) || v::text from t2_snap;
rollback;
`;

export const t2Tests: SelfTest[] = [
  {
    id: "T2-S01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      for (const f of ["fable01", "fable02", "fable03", "fable04", "fable05"]) {
        spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", `${f}.sql`), db], { encoding: "utf8" });
      }
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", SKRIP, db], { encoding: "utf8" });
      const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
      if (!c.expect(r.status === 0, `the scenario could not run: ${pesan}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      let m: Record<string, any> | null = null;
      for (const l of r.stdout.split("\n")) {
        const [k, v] = l.split("\t");
        if (k === "T2" && v) m = JSON.parse(v);
      }
      if (!c.expect(!!m, "the database half returned no snapshot") || !m) return c.verdict("");

      // what the teacher ticks from
      c.expect(Number(m.pilihan) >= 6 && m.sama === true && Number(m.pilihan) === Number(m.boleh),
        `the teacher is shown ${m.pilihan} questions; an Uji Cepat on the chapter may draw ${m.boleh} (same set: ${m.sama})`);
      c.expect(Number(m.kunci_di_opsi) === 0, `${m.kunci_di_opsi} options carry a key or a reason; the choices show the question only`);
      c.expect(Number(m.tanpa_isi) === 0, `${m.tanpa_isi} questions are shown without a stem or options`);
      // the paper is exactly the ticked questions
      c.expect(m.kertas_sama === true && Number(m.kertas_n) === 3 && Number(m.boleh_kini) === 3 && Number(m.n_def) === 3,
        `the learner's paper holds ${m.kertas_n} questions (the ticked three: ${m.kertas_sama}); the instrument may draw ${m.boleh_kini}`);
      c.expect(JSON.stringify(m.mix) === "{}", `the chosen Uji Cepat still asks the draw for bands ${JSON.stringify(m.mix)}`);
      c.expect(Number(m.audit) === 1, `the choice is audited ${m.audit} times; expected once`);
      c.expect(m.segel !== null && m.segel !== undefined, "the chosen Uji Cepat carries no sealed pass mark (D-088(b))");
      c.expect(Number(m.kertas_lama) === Number(m.boleh), `an Uji Cepat launched the old way may draw ${m.kertas_lama}, not the whole chapter (${m.boleh})`);
      // refusals
      c.expect(m.dua === "PR050 QUICK_SELECTION_COUNT" && m.kembar === "PR050 QUICK_SELECTION_COUNT",
        `two questions, and one question twice, were answered ${m.dua} / ${m.kembar}; expected PR050 QUICK_SELECTION_COUNT`);
      c.expect(m.bab_lain === "PR050 QUICK_SELECTION_NOT_OFFERED", `another chapter's question was answered ${m.bab_lain}`);
      c.expect(m.versi === "PR050 QUICK_SELECTION_SIBLINGS", `two versions of one question were answered ${m.versi}`);
      c.expect(Number(m.sisa_tolak) === 0, `${m.sisa_tolak} instrument(s) were left behind by refused launches`);
      // who may read
      c.expect(m["boot-siswa"] === "42501" && m["siklus-guru"] === "42501",
        `the learner and another school's teacher reading the choices were answered ${m["boot-siswa"]} / ${m["siklus-guru"]}; expected 42501`);
      // fixed
      for (const k of ["pilih_ubah", "pilih_hapus", "pilih_tambah"]) c.expect(m[k] === "PR080", `${k} was answered ${m[k]}; expected PR080`);
      return c.verdict(
        "executed in the database, rolled back (supabase/migrations/20261104100000): the bootstrap teacher is shown the " +
          "chapter's questions with stem, options and topic and no key, exactly the set an Uji Cepat on it may draw; three " +
          "ticked are launched and the learner's paper is exactly those three, the instrument may draw only them, asks no " +
          "difficulty band, carries the school's sealed mark, and the choice is audited once; two questions, one twice, " +
          "another chapter's question and two versions of one question are refused with PR050 and their codes, leaving no " +
          "instrument behind; the learner and another school's teacher cannot read the choices; the selection is never " +
          "changed, removed or added to; an Uji Cepat launched the old way still draws from the whole chapter",
      );
    },
  },
  {
    id: "T2-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const hal = buang(readFileSync(join(repoRoot, "src", "app", "mengajar", "[kelas]", "uji-cepat", "page.tsx"), "utf8"));
      c.expect(/ajar\.soalUjiCepat\(id, pilihBab\)/.test(hal) && /name="butir"/.test(hal) && /type="checkbox"/.test(hal),
        "the Uji Cepat page does not show the chapter's questions to tick");
      c.expect(/tahap === "tinjau"/.test(hal) && /dipilih\.map\(/.test(hal) && /type="hidden" name="butir" value=\{butir\.join\(","\)\}/.test(hal),
        "the review does not list the ticked questions, or does not send them");
      c.expect(/href=\{`\/mengajar\/\$\{id\}\/soal\?penugasan=\$\{hidup\.id\}`\}/.test(hal) && /mengajar\.bukti\.per_soal/.test(hal),
        "the running Uji Cepat does not lead to the questions the class found hard (M5)");
      const aksi = buang(readFileSync(join(repoRoot, "src", "app", "mengajar", "actions.ts"), "utf8"));
      const fn = /export async function sediakanUjiCepat[\s\S]*?\n\}/.exec(aksi)?.[0] ?? "";
      c.expect(/rpc\("launch_selected_quick_assessment"/.test(fn) && /p_items: butir/.test(fn) && !/rpc\("launch_quick_assessment"/.test(fn),
        "sediakanUjiCepat does not launch with the ticked questions");
      c.expect(/const pilihan = \{ bab, butir: bersih\(formData\.get\("butir"\)\), menit: bersih\(formData\.get\("menit"\)\) \}/.test(fn),
        "a refusal does not carry the ticked questions back");
      const { kodeUjiCepat, alamatTolakUjiCepat } = await import("../src/lib/ujicepat-kontrak");
      for (const kode of ["QUICK_SELECTION_COUNT", "QUICK_SELECTION_NOT_OFFERED", "QUICK_SELECTION_SIBLINGS"]) {
        const k = kodeUjiCepat({ code: "PR050", message: "x", details: kode } as never);
        c.expect(k === kode, `PR050 ${kode} is read as ${k}`);
      }
      const ke = Object.fromEntries(new URLSearchParams(alamatTolakUjiCepat("QUICK_SELECTION_COUNT", { bab: "b", butir: "x,y", menit: "15" }).split("?")[1] ?? ""));
      c.expect(ke.butir === "x,y" && ke.bab === "b" && ke.menit === "15", `the refusal carries back ${JSON.stringify(ke)}`);
      for (const locale of ["id", "en"] as const) {
        const kal = ["mengajar.cepat.tolak.pilih_jumlah", "mengajar.cepat.tolak.pilih_bukan", "mengajar.cepat.tolak.pilih_versi",
          "mengajar.cepat.pilih", "mengajar.cepat.pilih.arti", "mengajar.cepat.dipilih"]
          .map((k) => t(k as HleEvent, "educator", { locale }));
        c.expect(kal.every((x, i, a) => x.length > 3 && !x.startsWith("mengajar.") && a.indexOf(x) === i), `(${locale}) the T2 copy is missing or repeated`);
      }
      return c.verdict(
        "reads the source: the Uji Cepat page shows the chosen chapter's questions to tick in a GET form, the review lists " +
          "the ticked questions and sends their ids in the one POST, the running Uji Cepat links to «Lihat per soal» (M5); " +
          "sediakanUjiCepat launches with the ticked ids and a refusal carries them back; the three PR050 codes are read and " +
          "said in id and en",
      );
    },
  },
];
