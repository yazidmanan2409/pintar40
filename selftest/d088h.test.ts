/**
 * D-088(h) (Yazid, 2 Oct) -- A REVIEWER SEES WHAT THEY APPROVE.
 *
 * Studio's package page never showed a question, and the preview is by design
 * the learner's sanitised view, so the person who approved a chapter never saw
 * its questions (EDU-J12). The package page now carries «Soal dalam paket ini»
 * for Studio staff: each question with its options, the key and every option's
 * reason, before the publish steps. Read under the reader's own row security
 * (CAN_DRAFT in the school, which every reviewer holds); nothing is granted.
 *
 *   D088H-S01  db: who reads the bootstrap course's questions, options, keys and
 *              reasons: its head of department, admin and teacher, all of them;
 *              a learner and another school's teacher, none
 *   D088H-K01  static: susunSoal orders lessons, questions and options and marks
 *              the key; the package page shows the section to CAN_DRAFT staff
 *              before the steps; the learner preview still reads no question
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
create temp table d088h_snap (k text, v jsonb) on commit drop;
grant all on d088h_snap to authenticated;
do $d088h$
declare f record; v_course uuid; v_items int; v_opts int; v_keys int; v_r jsonb := '{}'::jsonb; v_who text;
begin
  perform selftest.as_owner();
  select * into f from selftest.boot_fixture();
  select co.id into v_course from public.courses co where co.id = f.course;
  select count(*) into v_items from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id = v_course;
  select count(*), count(*) filter (where o.is_correct) into v_opts, v_keys
    from public.item_options o join public.items i on i.id = o.item_id join public.lessons l on l.id = i.lesson_id
    join public.modules m on m.id = l.module_id where m.course_id = v_course;
  insert into d088h_snap values ('BANK', jsonb_build_object('soal', v_items, 'opsi', v_opts, 'kunci', v_keys));
  -- who reads the bootstrap course's questions, options, keys and reasons under their own row security
  foreach v_who in array array['boot-kaprodi@bootstrap.pintar.test', 'boot-admin@bootstrap.pintar.test',
                               'boot-guru@bootstrap.pintar.test', 'boot-siswa@bootstrap.pintar.test', 'qac-guru-b@synthetic.pintar.test'] loop
    perform selftest.as_user(v_who);
    v_r := v_r || jsonb_build_object(split_part(v_who, '@', 1), jsonb_build_object(
      'soal', (select count(*) from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id = v_course),
      'opsi', (select count(*) from public.item_options o join public.items i on i.id = o.item_id join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id = v_course),
      'kunci', (select count(*) from public.item_options o join public.items i on i.id = o.item_id join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id = v_course and o.is_correct),
      'alasan', (select count(*) from public.item_options o join public.items i on i.id = o.item_id join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id = v_course and btrim(o.rationale) <> ''),
      'item_langsung', (select count(*) from public.items i where i.institution_id = f.inst)));
  end loop;
  perform selftest.as_owner();
  insert into d088h_snap values ('BACA', v_r);
end $d088h$;
select k || chr(9) || v::text from d088h_snap order by k;
rollback;
`;

export const d088hTests: SelfTest[] = [
  {
    id: "D088H-S01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      for (const f of ["fable01", "fable02", "fable03", "fable04"]) {
        spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", `${f}.sql`), db], { encoding: "utf8" });
      }
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", SKRIP, db], { encoding: "utf8" });
      const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
      if (!c.expect(r.status === 0, `the reads could not run: ${pesan}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const snap: Record<string, any> = {};
      for (const l of r.stdout.split("\n")) {
        const [k, v] = l.split("\t");
        if (k && v) snap[k] = JSON.parse(v);
      }
      const { BANK: bank, BACA: baca } = snap;
      if (!c.expect(!!bank && !!baca, "the database half returned no snapshot")) return c.verdict("");
      c.expect(bank.soal > 0 && bank.kunci > 0, `the bootstrap course has ${bank.soal} question(s) and ${bank.kunci} key(s); nothing to review`);
      for (const siapa of ["boot-kaprodi", "boot-admin", "boot-guru"]) {
        const b = baca[siapa];
        c.expect(b && b.soal === bank.soal && b.opsi === bank.opsi && b.kunci === bank.kunci && b.alasan === bank.opsi,
          `${siapa} reads ${JSON.stringify(b)}; expected every question, option, key and reason (${JSON.stringify(bank)})`);
      }
      for (const siapa of ["boot-siswa", "qac-guru-b"]) {
        const b = baca[siapa];
        c.expect(b && b.soal === 0 && b.opsi === 0 && b.kunci === 0 && b.item_langsung === 0,
          `${siapa} reads ${JSON.stringify(b)}; a learner and another school's staff must read no question or key`);
      }
      return c.verdict(
        "executed in the database, rolled back, under each reader's own row security (items_select, item_options_select: " +
          "CAN_DRAFT in the school): the bootstrap course's head of department, administrator and teacher each read every " +
          "question, option, key and reason the package page shows; its learner and another school's teacher read none",
      );
    },
  },
  {
    id: "D088H-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const { susunSoal } = await import("../src/lib/soal-tinjauan");
      const tgl = (n: number) => `2026-10-0${n}T00:00:00Z`;
      const hasil = susunSoal(
        [{ id: "m2", ordinal: 2 }, { id: "m1", ordinal: 1 }],
        [{ id: "l3", module_id: "m2", ordinal: 1, title: "Pelajaran 3" }, { id: "l2", module_id: "m1", ordinal: 2, title: "Pelajaran 2" },
          { id: "l1", module_id: "m1", ordinal: 1, title: "Pelajaran 1" }, { id: "l4", module_id: "m2", ordinal: 2, title: "Tanpa soal" }],
        [{ id: "a", lesson_id: "l1", cycle_role: null, bank_type: "PRACTICE", stimulus: null, stem: "latihan", created_at: tgl(1) },
          { id: "b", lesson_id: "l1", cycle_role: "POST_TEST", bank_type: "TEST", stimulus: null, stem: "uji", created_at: tgl(2) },
          { id: "c", lesson_id: "l1", cycle_role: "PRE_TEST", bank_type: "TEST", stimulus: "bacaan", stem: "awal", created_at: tgl(3) },
          { id: "d", lesson_id: "l3", cycle_role: null, bank_type: "PRACTICE", stimulus: null, stem: "l3", created_at: tgl(1) },
          { id: "e", lesson_id: "l2", cycle_role: null, bank_type: "PRACTICE", stimulus: null, stem: "l2", created_at: tgl(1) }],
        [{ item_id: "c", label: "B", body: "dua", is_correct: true, rationale: "karena dua" },
          { item_id: "c", label: "A", body: "satu", is_correct: false, rationale: "keliru hitung" }],
      );
      c.expect(JSON.stringify(hasil.map((l) => l.id)) === JSON.stringify(["l1", "l2", "l3"]),
        `lessons come as ${JSON.stringify(hasil.map((l) => l.id))}; expected the package's order (module, then lesson), a lesson without questions left out`);
      c.expect(JSON.stringify(hasil[0].soal.map((q) => q.id)) === JSON.stringify(["c", "b", "a"]),
        `Pelajaran 1's questions come as ${JSON.stringify(hasil[0].soal.map((q) => q.id))}; expected Pemetaan Awal, then Uji Penguasaan, then practice`);
      const opsi = hasil[0].soal[0].opsi;
      c.expect(JSON.stringify(opsi) === JSON.stringify([{ label: "A", isi: "satu", kunci: false, alasan: "keliru hitung" }, { label: "B", isi: "dua", kunci: true, alasan: "karena dua" }]),
        `the options read ${JSON.stringify(opsi)}; expected A–E in order, the key marked, every reason kept`);
      c.expect(hasil[0].soal[0].stimulus === "bacaan", "a question's stimulus is lost");

      const hal = buang(readFileSync(join(repoRoot, "src", "app", "studio", "paket", "[course]", "page.tsx"), "utf8"));
      c.expect(/const soal = can\(inst, "CAN_DRAFT"\) \? await soalPaket\(supabase, courseId\) : \[\]/.test(hal),
        "the package page does not read the package's questions for its Studio staff");
      const iSoal = hal.indexOf('id="soal"'), iLangkah = hal.indexOf("<LangkahTerbit");
      c.expect(iSoal > 0 && iLangkah > iSoal, "the questions are not in front of the reviewer before the publish steps");
      c.expect(/o\.kunci \?[\s\S]{0,200}studio\.soal\.kunci/.test(hal) && /studio\.soal\.alasan[\s\S]{0,60}o\.alasan/.test(hal),
        "the section does not mark the key or show each option's reason");
      const pratinjau = buang(readFileSync(join(repoRoot, "src", "app", "studio", "pratinjau", "[pelajaran]", "page.tsx"), "utf8"));
      c.expect(!/from\("items"\)|from\("item_options"\)|soalPaket/.test(pratinjau), "the learner preview now reads questions; it must stay the sanitised learner view");
      for (const locale of ["id", "en"] as const) {
        for (const k of ["studio.soal.judul", "studio.soal.arti", "studio.soal.jumlah", "studio.soal.kunci", "studio.soal.alasan", "studio.soal.kosong"] as const) {
          const kal = t(k, "staff", { locale });
          c.expect(kal.length > 2 && kal !== k, `(${locale}) ${k} has no text`);
        }
      }
      return c.verdict(
        "executes susunSoal (src/lib/soal-tinjauan.ts): lessons in the package's order without the empty ones, each " +
          "lesson's Pemetaan Awal questions, then Uji Penguasaan, then practice; options A–E with the key marked and each " +
          "reason and stimulus kept. Reads the source of the package page: the questions read for CAN_DRAFT staff and " +
          "shown before the publish steps with the key and reasons; the learner preview still reads no question; the copy " +
          "in id and en",
      );
    },
  },
];
