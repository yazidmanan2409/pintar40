/**
 * C2w · REVIEWER NOTES ON SEALED QUESTIONS («Catatan peninjau»), the database half, written red first
 * (docs/completion-4.1/batches/C2W-COMPLETION.md; PLAN-A2B-C2W.md §3; Sharon's design acceptance with D1 to D4,
 * C2W-NOTES-DESIGN-be01b4f2.md at 3a2de775). C1w's scenario harness (selftest/c1w.test.ts): the seeded learning-cycle
 * school with people, a class and learners of this suite's own, a package published by the school's seeded people, real
 * sittings, a governed key correction, and a platform package distributed to the school. Every scenario is one
 * transaction, rolled back, except C2W-D1R, which needs two real connections and removes what it commits.
 *
 *   C2W-B1   a note changes nothing: the question's line, its options, every sitting's evidence and result, and the
 *            class misconception metric read byte-identical before and after a note and its replacement.
 *   C2W-B2   who may write: a school's CAN_REVIEW (head of department, administrator) may; a teacher with CAN_DRAFT only,
 *            a learner, another school's administrator and an unknown item are refused alike (NOTE_NOT_ALLOWED); an
 *            unsealed draft, a missing option and an empty or over-long text are refused by name; nothing updates or
 *            deletes a note; declaring the table a metric source is refused; a learner reads no note.
 *   C2W-B4   I-5 in Studio: a note calls B a common wrong answer on version 1; the key is corrected to B; read against
 *            the corrected revision, the note says it predates the correction, the key it had then (A), the key now (B)
 *            and its version (1); a note written after the correction carries no such line.
 *   C2W-B5   I-5 beside the class report: the class's teacher reads the same note through the per-question evidence's
 *            own gate, with the key then and the key in force; another class's teacher is refused as for an unknown
 *            assignment.
 *   C2W-B6   platform-library notes: a school's reviewer is refused NOTE_LIBRARY_CONTENT; the library's own admin
 *            writes; a teacher of a school that received the release reads it beside the class report; a teacher of a
 *            school without the release is refused with the same answer as an unknown assignment.
 *   C2W-D2   the trigger, not only the function: a note inserted directly (as the owner) for another owner than the
 *            item's, or on an unsealed item, is refused.
 *   C2W-D1R  two connections: two first notes on one option at once, and two replacements of one note at once; in each
 *            pair exactly one stands and the other is refused by name (NOTE_EXISTS, NOTE_NOT_CURRENT).
 *   C2W-D3   the chain walk (read from the source): a depth cap and a cycle guard; an index on items.supersedes_item_id;
 *            no row lock in either read.
 */
import { spawn, spawnSync } from "node:child_process";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { G, S, ajukan, item, jalankan, langkah, paksa, simpanKoreksi, tegaskan } from "./c1w.test";

function db(): string {
  return process.env.SUPABASE_DB_URL!;
}

const MIGRASI = "supabase/migrations/20270121110000_a_reviewer_notes_what_a_wrong_option_reveals.sql";
const ISI = "Banyak murid memilih B karena mengira pecahan yang penyebutnya lebih besar selalu lebih besar.";
const tulis = (it: string, opsi: string, isi = ISI, ganti = "null") =>
  `select public.catatan_peninjau_tulis(${it}, '${opsi}', '${isi.replace(/'/g, "''")}', ${ganti}) ->> 'id'`;
/** The note's id, kept under c1.<nama>, written as `siapa` (a step whose refusal shows in the snapshot). */
const tulisSimpan = (nama: string, it: string, opsi: string, isi = ISI, ganti = "null") =>
  `select set_config('c1.${nama}', (${tulis(it, opsi, isi, ganti)}), true) is not null`;

// the class misconception metric and every fingerprint B1 holds
const SIDIK = `select md5(concat_ws('#', pg_temp.c1_sidik_kursus(${G("p1")}), pg_temp.c1_sidik_sesi(${G("s1")}), pg_temp.c1_sidik_sesi(${G("s2")}),
    (select count(*)::text from public.assessment_results r where r.session_id in (${G("s1")}, ${G("s2")})),
    (select coalesce(string_agg(to_jsonb(o)::text, '|' order by o.item_id, o.label), '') from public.item_options o where o.item_id = ${item("p1", "Pertanyaan awal nomor 1")})))`;
/** The class misconception metric, read by the class's teacher (metric_evaluate authorises its reader). */
const METRIK = (k: string) => `perform selftest.as_user_uid(${G("u_guru")});
       perform set_config('c1.${k}', public.metric_evaluate('class.misconceptions', ${G("kelas")}, ${G("inst")})::text, true);
       perform selftest.as_owner();`;

let hasil: Promise<Record<string, string> | null> | null = null;
let galat = "";

/** One scenario for B1, B2, B4, B5, B6 and D2, run once, read by each test. */
function skenario(repoRoot: string): Promise<Record<string, string> | null> {
  if (hasil) return hasil;
  hasil = (async () => {
    const c = new Checks();
    const X = item("p1", "Pertanyaan awal nomor 1");
    const L: string[] = [
      `perform pg_temp.c1_paket('p1');`, `perform pg_temp.c1_beri('p1');`,
      `perform pg_temp.c1_murid('m1'); perform pg_temp.c1_duduk('m1', ${G("p1_pre")}, true, true, 's1');`,
      `perform pg_temp.c1_murid('m2'); perform pg_temp.c1_duduk('m2', ${G("p1_pre")}, false, true, 's2');`,
      `perform set_config('c1.x', (${X})::text, true);`,
      // ---- B1: the fingerprints before
      `perform set_config('c1.sidik_awal', (${SIDIK}), true);`, METRIK("metrik_awal"),
      // ---- B2: who may write, on version 1 of a sealed school question
      langkah("b2_guru", "guru", tulis(G("x"), "B")),
      langkah("b2_murid", "m1", tulis(G("x"), "B")),
      langkah("b2_lain", "lain", tulis(G("x"), "B")),
      langkah("b2_tak_dikenal", "kadep", tulis("gen_random_uuid()", "B")),
      langkah("b2_opsi", "kadep", tulis(G("x"), "E")),
      langkah("b2_kosong", "kadep", tulis(G("x"), "B", " ")),
      langkah("b2_panjang", "kadep", tulis(G("x"), "B", "x".repeat(1001))),
      langkah("b2_kadep", "kadep", tulisSimpan("n1", G("x"), "B")),
      langkah("b2_admin_ganti", "admin", tulisSimpan("n2", G("x"), "B", ISI + " Dicatat ulang oleh admin.", G("n1"))),
      // a draft (unsealed): the teacher's own upload, by the school's reviewer
      `perform pg_temp.c1_draf('d1');`,
      langkah("b2_draf", "kadep", tulis(item("d1", "Pertanyaan awal nomor 1"), "B")),
      // nothing updates or deletes a note, even as the owner
      langkah("b2_ubah", null, `update public.catatan_peninjau set isi = 'diubah' where id = ${G("n1")} returning 'UPDATED'`),
      langkah("b2_hapus", null, `delete from public.catatan_peninjau where id = ${G("n1")} returning 'DELETED'`),
      // declaring the table a metric source
      langkah("b2_sumber", null, `insert into public.metric_sources (catalogue_version, source_relation, why)
           select max(catalogue_version), 'catatan_peninjau', 'uji C2W-B2' from public.metric_sources returning 'INSERTED'`),
      // a learner reads no note, by either read
      langkah("b2_murid_studio", "m1", `select jsonb_array_length(public.catatan_peninjau_studio(${G("x")}))::text`),
      langkah("b2_murid_kelas", "m1", `select jsonb_array_length(public.catatan_peninjau_kelas(${G("p1_pre")}, ${G("kelas")}))::text`),
      // ---- B1: the fingerprints after the note and its replacement
      METRIK("metrik_akhir"),
      langkah("b1", null, `select ((${SIDIK}) = ${S("sidik_awal")})::text || '|' || (${S("metrik_akhir")} = ${S("metrik_awal")})::text || '|' || (length(${S("metrik_awal")}) > 20)::text`),
      // ---- B4: the key corrected to B; the note read against the corrected revision (version 2)
      langkah("b4_aju", "admin", `${ajukan(G("x"), "B")} is not null`),
      simpanKoreksi("k1", G("x"), "B"),
      langkah("b4_tegas", "kadep2", `select (x ->> 'ok') from public.tegaskan_koreksi_kunci(${G("k1")}) x`),
      `perform set_config('c1.x2', public.soal_ujung(${G("x")})::text, true);`,
      langkah("b4_sesudah", "kadep", tulisSimpan("n3", G("x2"), "A", "Catatan setelah koreksi kunci: pilihan A kini keliru.")),
      langkah("b4_studio", "kadep", `select string_agg(concat_ws(',', e ->> 'opsi', e ->> 'versi', e ->> 'sebelum_koreksi', e ->> 'kunci_saat_itu',
             e ->> 'kunci_kini', e ->> 'digantikan', (e ->> 'id' = ${S("n2")})::text, (e ->> 'id' = ${S("n3")})::text), ';' order by e ->> 'pada', e ->> 'id')
           from jsonb_array_elements(public.catatan_peninjau_studio(${G("x2")})) e`),
      langkah("b4_studio_v1", "kadep", `select string_agg(concat_ws(',', e ->> 'opsi', e ->> 'versi', e ->> 'sebelum_koreksi'), ';' order by e ->> 'pada', e ->> 'id')
           from jsonb_array_elements(public.catatan_peninjau_studio(${G("x")})) e`),
      langkah("b4_guru_studio", "guru", `select jsonb_array_length(public.catatan_peninjau_studio(${G("x2")}))::text`),
      langkah("b4_lain_studio", "lain", `select jsonb_array_length(public.catatan_peninjau_studio(${G("x2")}))::text`),
      langkah("b4_tak_dikenal_studio", "kadep", `select jsonb_array_length(public.catatan_peninjau_studio(gen_random_uuid()))::text`),
      // ---- B5: the class's teacher, beside the per-question evidence of the class's Pemetaan Awal
      langkah("b5_guru", "guru", `select string_agg(concat_ws(',', e ->> 'opsi', e ->> 'sebelum_koreksi', e ->> 'kunci_saat_itu', e ->> 'kunci_kini',
             (e ->> 'id' = ${S("n2")})::text), ';' order by e ->> 'pada', e ->> 'id')
           from jsonb_array_elements(public.catatan_peninjau_kelas(${G("p1_pre")}, ${G("kelas")})) e`),
      langkah("b5_guru_lain_kelas", "guru", `select jsonb_array_length(public.catatan_peninjau_kelas(${G("p1_pre")}, ${G("kelas_lama")}))::text`),
      langkah("b5_tak_dikenal", "guru", `select jsonb_array_length(public.catatan_peninjau_kelas(gen_random_uuid(), ${G("kelas")}))::text`),
      // ---- B6: a platform package, distributed to this school only
      `perform set_config('c1.kan', (select to_jsonb(x)::text from selftest.canonical_package('C2W kanonik ' || current_setting('c1.tag')) x), true); perform selftest.as_owner();`,
      `perform set_config('c1.u_kadmin', (select u.id::text from auth.users u where u.email = 'kanonik-admin@pintar.test'), true);`,
      `perform selftest.as_user('kanonik-admin@pintar.test');
       perform public.grant_release_distribution((current_setting('c1.kan')::jsonb ->> 'rel')::uuid, ${G("inst")}, 'C2W kanonik');
       perform selftest.as_owner();
       perform selftest.pass_mark(${G("inst")}, (current_setting('c1.kan')::jsonb ->> 'course')::uuid);`,
      `perform selftest.as_user_uid(${G("u_guru")});
       perform set_config('c1.kan_aa', (select x.assessment_assignment_id::text from public.launch_quick_assessment(${G("kelas")}, (current_setting('c1.kan')::jsonb ->> 'modul')::uuid, 3, 30) x), true);
       perform selftest.as_owner();`,
      `perform pg_temp.c1_murid('m7'); perform pg_temp.c1_duduk('m7', ${G("kan_aa")}, true, true, 's7');`,
      `perform set_config('c1.kan_x', (select p.item_id::text from public.presented_items p where p.session_id = ${G("s7")} order by p.position limit 1), true);
       perform set_config('c1.kan_salah', (select o.label from public.item_options o where o.item_id = ${G("kan_x")} and not o.is_correct order by o.label limit 1), true);`,
      langkah("b6_sekolah", "kadep", `select public.catatan_peninjau_tulis(${G("kan_x")}, ${S("kan_salah")}, '${ISI}', null) ->> 'id'`),
      langkah("b6_admin_sekolah", "admin", `select public.catatan_peninjau_tulis(${G("kan_x")}, ${S("kan_salah")}, '${ISI}', null) ->> 'id'`),
      langkah("b6_kanonik", "kadmin", `select set_config('c1.n_kan', public.catatan_peninjau_tulis(${G("kan_x")}, ${S("kan_salah")}, '${ISI}', null) ->> 'id', true) is not null`),
      langkah("b6_guru", "guru", `select count(*) filter (where e ->> 'id' = ${S("n_kan")})::text
           from jsonb_array_elements(public.catatan_peninjau_kelas(${G("kan_aa")}, ${G("kelas")})) e`),
      // a teacher of a school without the release: the other school's own class and its teacher
      `perform set_config('c1.kelas_lain', (select n.id::text from public.org_nodes n where n.institution_id = ${G("lain_inst")} and n.kind = 'CLASS' order by n.created_at limit 1), true);`,
      `perform pg_temp.c1_orang('guru_lain', 'EDUCATOR', ${G("kelas_lain")});`,
      langkah("b6_guru_tanpa", "guru_lain", `select jsonb_array_length(public.catatan_peninjau_kelas(${G("kan_aa")}, ${G("kelas_lain")}))::text`),
      langkah("b6_guru_tanpa_tak_dikenal", "guru_lain", `select jsonb_array_length(public.catatan_peninjau_kelas(gen_random_uuid(), ${G("kelas_lain")}))::text`),
      // ---- D2: the trigger refuses a direct insert for another owner, or on an unsealed item
      langkah("d2_pemilik", null, `insert into public.catatan_peninjau (item_id, opsi_label, institution_id, isi, ditulis_oleh)
           values (${G("x2")}, 'B', ${G("lain_inst")}, 'langsung', ${G("p_kadep")}) returning 'INSERTED'`),
      langkah("d2_draf", null, `insert into public.catatan_peninjau (item_id, opsi_label, institution_id, isi, ditulis_oleh)
           select i.id, 'B', i.institution_id, 'langsung', ${G("p_kadep")} from public.items i where i.id = ${item("d1", "Pertanyaan awal nomor 1")} returning 'INSERTED'`),
      // the control: a direct insert for the item's own owner, on a sealed item, stands (the trigger does not refuse all)
      langkah("d2_benar", null, `insert into public.catatan_peninjau (item_id, opsi_label, institution_id, isi, ditulis_oleh)
           select i.id, 'B', i.institution_id, 'langsung, pemilik yang benar', ${G("p_kadep")} from public.items i where i.id = ${G("x2")} returning 'INSERTED'`),
      // ---- B2's projection proof: no learner surface of the sitting carries the note's text
      // (a pre-test's review is refused outright, so the learner's own outcome and their assignment list are read)
      langkah("b2_proyeksi", "m1", `select (position('${ISI.slice(0, 40)}' in public.session_outcome(${G("s1")})::text
           || coalesce((select string_agg(to_jsonb(x)::text, '|') from public.my_learning_assignments() x), '')) = 0)::text`),
    ];
    const m = jalankan(c, repoRoot, L);
    if (!m) galat = c.verdict("").detail;
    return m;
  })();
  return hasil;
}

/** A refusal by its SQLSTATE and DETAIL (pg_temp.c1's «STATE:DETAIL»). */
const tolak = (v: string | undefined, kode: string) => !!v && !v.startsWith("ok:") && v.includes(kode);
const ditolak = (v: string | undefined) => !!v && !v.startsWith("ok:");

function uji(id: string, isi: (c: Checks, m: Record<string, string>) => string): SelfTest {
  return {
    id,
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const m = await skenario(repoRoot);
      if (!m) { c.expect(false, galat || "the scenario returned nothing"); return c.verdict(""); }
      const ringkas = isi(c, m);
      return c.verdict(ringkas);
    },
  };
}

export const c2wCatatanTests: SelfTest[] = [
  uji("C2W-B1", (c, m) => {
    c.expect(m.b2_kadep === "ok:true", `the school's head of department must write a note on a sealed question: ${m.b2_kadep}`);
    c.expect(m.b1 === "ok:true|true|true", `the question's line, its options, both sittings' evidence and results (first), and the class misconception metric as its teacher reads it (second, non-empty third), must be byte-identical after a note and its replacement: ${m.b1}`);
    return "before and after a note and its replacement: the package's fingerprint, the question's options, two sittings' evidence and current results, the result count and metric_evaluate('class.misconceptions') are byte-identical; rolled back";
  }),
  uji("C2W-B2", (c, m) => {
    for (const [k, apa] of [["b2_guru", "a teacher with CAN_DRAFT only"], ["b2_murid", "a learner"], ["b2_lain", "another school's administrator"], ["b2_tak_dikenal", "an unknown item"]] as const) {
      c.expect(tolak(m[k], "PR210:NOTE_NOT_ALLOWED"), `${apa} writing a note must be refused NOTE_NOT_ALLOWED (one answer for all four): ${m[k]}`);
    }
    c.expect(tolak(m.b2_opsi, "NOTE_OPTION_INVALID"), `an option the question does not have: ${m.b2_opsi}`);
    c.expect(tolak(m.b2_kosong, "NOTE_TEXT_INVALID") && tolak(m.b2_panjang, "NOTE_TEXT_INVALID"), `an empty and a 1001-character text: ${m.b2_kosong} / ${m.b2_panjang}`);
    c.expect(m.b2_kadep === "ok:true", `the head of department (CAN_REVIEW) writes: ${m.b2_kadep}`);
    c.expect(m.b2_admin_ganti === "ok:true", `the school's administrator replaces the current note: ${m.b2_admin_ganti}`);
    c.expect(tolak(m.b2_draf, "NOTE_NOT_SEALED"), `a note on an unsealed draft: ${m.b2_draf}`);
    c.expect(ditolak(m.b2_ubah) && ditolak(m.b2_hapus), `an UPDATE and a DELETE of a note, even as the owner, must be refused: ${m.b2_ubah} / ${m.b2_hapus}`);
    c.expect(tolak(m.b2_sumber, "NOT_A_SOURCE"), `declaring catatan_peninjau a metric source must be refused: ${m.b2_sumber}`);
    c.expect(ditolak(m.b2_murid_studio) && ditolak(m.b2_murid_kelas), `a learner reading notes by either read must be refused: ${m.b2_murid_studio} / ${m.b2_murid_kelas}`);
    c.expect(m.b2_proyeksi === "ok:true", `the learner's own outcome of the sitting and their assignment list must not carry the note's text: ${m.b2_proyeksi}`);
    return "a teacher with CAN_DRAFT only, a learner, another school's administrator and an unknown item are refused alike (PR210 NOTE_NOT_ALLOWED); a missing option, an empty and an over-long text and an unsealed draft are refused by name; the head of department writes and the administrator replaces; no UPDATE or DELETE stands, even as the owner; the metric-source declaration is refused; a learner reads no note, and neither their outcome nor their assignment list carries one; rolled back";
  }),
  uji("C2W-B4", (c, m) => {
    c.expect(m.b4_tegas === "ok:true", `the key correction must be confirmed (the case cannot be set up): ${m.b4_tegas}`);
    c.expect(m.b4_sesudah === "ok:true", `a note on the corrected revision must be written: ${m.b4_sesudah}`);
    // the two notes on B of version 1 (n1 replaced by n2) and the note after the correction (n3, option A of version 2), read against version 2
    const harap = "B,1,true,A,B,true,false,false;B,1,true,A,B,false,true,false;A,2,false,B,B,false,false,true";
    c.expect(m.b4_studio === `ok:${harap}`, `Studio, against the corrected revision: ${m.b4_studio}; expected ${harap} (option, version, before the correction, key then, key now, replaced, is n2, is n3)`);
    c.expect(m.b4_studio_v1 === "ok:B,1,false;B,1,false;A,2,false", `Studio, against version 1 (its own key): no note predates a correction of the revision read: ${m.b4_studio_v1}`);
    c.expect(m.b4_guru_studio === "ok:3", `a teacher with CAN_DRAFT reads the question's notes in Studio, as riwayat_soal's readers do: ${m.b4_guru_studio}`);
    c.expect(ditolak(m.b4_lain_studio) && m.b4_lain_studio === m.b4_tak_dikenal_studio, `another school's administrator and an unknown item must be refused alike in Studio: ${m.b4_lain_studio} / ${m.b4_tak_dikenal_studio}`);
    return "I-5 in Studio: a note on option B of version 1 (key A), replaced once, read against version 2 after the key was corrected to B: both say they predate the correction, with the key then (A), the key now (B) and version 1, the replaced one marked; a note written on version 2 carries no such line; read against version 1, nothing predates; another school and an unknown item refused alike; rolled back";
  }),
  uji("C2W-B5", (c, m) => {
    // the current note on each revision of the line (§3.3: a note is shown for every revision): n2 on version 1, n3 on version 2
    c.expect(m.b5_guru === "ok:B,true,A,B,true;A,false,B,B,false", `the class's teacher, beside the class report: the current notes only, on every revision, with the key then and the key in force: ${m.b5_guru}`);
    c.expect(ditolak(m.b5_guru_lain_kelas) && m.b5_guru_lain_kelas === m.b5_tak_dikenal, `the teacher on a class the assignment was not set for, and an unknown assignment, must be refused alike: ${m.b5_guru_lain_kelas} / ${m.b5_tak_dikenal}`);
    return "I-5 beside the class report: the class's teacher reads, through the per-question evidence's own gate, the current note on each revision of the line: on B of version 1, saying it predates the correction with the key then (A) and the key in force (B); on A of version 2, with no such line; a class the assignment was not set for and an unknown assignment are refused alike; rolled back";
  }),
  uji("C2W-B6", (c, m) => {
    c.expect(tolak(m.b6_sekolah, "NOTE_LIBRARY_CONTENT") && tolak(m.b6_admin_sekolah, "NOTE_LIBRARY_CONTENT"), `a school's reviewer and a school's administrator writing on a library question: ${m.b6_sekolah} / ${m.b6_admin_sekolah}`);
    c.expect(m.b6_kanonik === "ok:true", `the library's own administrator writes: ${m.b6_kanonik}`);
    c.expect(m.b6_guru === "ok:1", `a teacher of the school that received the release reads it beside the class report: ${m.b6_guru}`);
    c.expect(ditolak(m.b6_guru_tanpa) && m.b6_guru_tanpa === m.b6_guru_tanpa_tak_dikenal, `a teacher of a school without the release must be refused with the same answer as an unknown assignment: ${m.b6_guru_tanpa} / ${m.b6_guru_tanpa_tak_dikenal}`);
    return "platform-library notes: a school's head of department and administrator are refused NOTE_LIBRARY_CONTENT; the library's own administrator writes; a teacher of the school that received the release reads it beside the class report; a teacher of a school without it is refused exactly as for an unknown assignment; rolled back";
  }),
  uji("C2W-D2", (c, m) => {
    c.expect(tolak(m.d2_pemilik, "PR210:NOTE_OWNER_MISMATCH"), `a note inserted directly for an owner other than the item's must be refused by the trigger, NOTE_OWNER_MISMATCH: ${m.d2_pemilik}`);
    c.expect(tolak(m.d2_draf, "PR210:NOTE_NOT_SEALED"), `a note inserted directly on an unsealed item must be refused by the trigger, NOTE_NOT_SEALED: ${m.d2_draf}`);
    c.expect(m.d2_benar === "ok:INSERTED", `the control: a direct insert for the item's own owner on a sealed item must stand: ${m.d2_benar}`);
    return "the trigger refuses a note inserted directly, as the owner, for another owner than the item's (NOTE_OWNER_MISMATCH) and on an unsealed item (NOTE_NOT_SEALED), while a direct insert for the item's own owner on a sealed item stands; rolled back";
  }),
  {
    id: "C2W-D3",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const satu = (q: string) => spawnSync("psql", ["-qAt", "-c", q, db()], { encoding: "utf8" }).stdout.trim();
      const garis = satu("select coalesce((select prosrc from pg_proc where proname = 'catatan_peninjau_garis'), '')");
      const baca = satu("select coalesce((select string_agg(prosrc, ' ') from pg_proc where proname in ('catatan_peninjau_studio', 'catatan_peninjau_kelas')), '')");
      const indeks = satu(`select count(*) from pg_index x join pg_attribute a on a.attrelid = x.indrelid and a.attnum = x.indkey[0]
             where x.indrelid = 'public.items'::regclass and a.attname = 'supersedes_item_id'`);
      c.expect(!!garis, "the chain walk catatan_peninjau_garis does not exist");
      c.expect(/\bkedalaman\b[\s\S]*<\s*\d+/.test(garis ?? "") || /depth/i.test(garis ?? ""), "the chain walk has no depth cap");
      c.expect(/not\s*\([^)]*=\s*any\s*\(/i.test(garis ?? "") || /\bjalur\b[\s\S]*any/i.test(garis ?? ""), "the chain walk has no cycle guard");
      c.expect(!/\bfor\s+(update|share|no\s+key\s+update|key\s+share)\b/i.test((garis ?? "") + (baca ?? "")), "a notes read takes a row lock");
      c.expect(Number(indeks ?? 0) >= 1, `no index leads with items.supersedes_item_id: ${indeks}`);
      return c.verdict("the chain walk (catatan_peninjau_garis) has a depth cap and a cycle guard; neither read takes a row lock; an index leads with items.supersedes_item_id");
    },
  },
  {
    id: "C2W-D1R",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const psql = (sql: string) => spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", sql, db()], { encoding: "utf8" });
      const jalan = (sql: string) => new Promise<{ code: number; out: string }>((done) => {
        const p = spawn("psql", ["-v", "ON_ERROR_STOP=1", "-qAt", "-c", sql, db()], { stdio: ["ignore", "pipe", "pipe"] });
        let buf = "";
        p.stdout.setEncoding("utf8"); p.stderr.setEncoding("utf8");
        p.stdout.on("data", (d: string) => (buf += d)); p.stderr.on("data", (d: string) => (buf += d));
        p.on("close", (code: number | null) => done({ code: code ?? 1, out: buf.trim() }));
      });
      spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(process.cwd(), "selftest", "db", "fable01.sql"), db()], { encoding: "utf8" });
      // a sealed question of the seeded cycle school and its seeded head of programme (CAN_REVIEW)
      const KAPRODI = "siklus-kaprodi@synthetic.pintar.test";
      const x = psql(`select i.id from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
          join public.courses c on c.id = m.course_id join public.institutions s on s.id = c.institution_id
         where s.slug like 'synth-siklus-%' and public.content_is_sealed(c.id) and i.item_type = 'MCQ_SINGLE'
         order by i.created_at, i.id limit 1`).stdout.trim();
      if (!c.expect(!!x, "the seeded cycle school has no sealed question (the race cannot be set up)")) return c.verdict("");
      const opsi = psql(`select o.label from public.item_options o where o.item_id = '${x}' and not o.is_correct order by o.label limit 1`).stdout.trim();
      const tanda = `c2w-d1-${Date.now().toString(36)}`;
      const sebagai = `select selftest.as_user('${KAPRODI}');`;
      const satu = (isi: string, ganti: string) => `${sebagai} select public.catatan_peninjau_tulis('${x}', '${opsi}', '${isi}', ${ganti}) ->> 'id'`;
      const balap = async (isiA: string, isiB: string, ganti: string) => {
        const a = jalan(`begin; ${satu(isiA, ganti)}; select pg_sleep(2) /*${tanda}-a*/; commit;`);
        let siap = false;
        for (let i = 0; i < 100 && !siap; i++) {
          siap = psql(`select count(*) from pg_stat_activity where query like '%${tanda}-a%' and wait_event = 'PgSleep' and pid <> pg_backend_pid()`).stdout.trim() === "1";
          if (!siap) await new Promise((ok) => setTimeout(ok, 50));
        }
        const b = jalan(`begin; ${satu(isiB, ganti)}; commit;`);
        return Promise.all([a, b]);
      };
      const bersih = () => psql(`begin; set local session_replication_role = replica; delete from public.catatan_peninjau where item_id = '${x}' and isi like 'uji C2W-D1R%'; commit;
          select count(*) from public.catatan_peninjau where item_id = '${x}' and isi like 'uji C2W-D1R%';`);
      try {
        // two first notes at once
        const [a1, b1] = await balap("uji C2W-D1R pertama A", "uji C2W-D1R pertama B", "null");
        c.expect(a1.code === 0, `the first connection's first note did not commit: ${a1.out.split("\n").pop()}`);
        c.expect(b1.code !== 0 && /NOTE_EXISTS/.test(b1.out), `two first notes on one option at once: the second must be refused NOTE_EXISTS: ${b1.out.split("\n").pop()}`);
        const pertama = psql(`select id from public.catatan_peninjau where item_id = '${x}' and opsi_label = '${opsi}' and isi like 'uji C2W-D1R pertama%'`).stdout.trim().split("\n").filter(Boolean);
        c.expect(pertama.length === 1, `exactly one first note must stand: ${pertama.length}`);
        // two replacements of that one note at once
        if (pertama.length === 1) {
          const [a2, b2] = await balap("uji C2W-D1R ganti A", "uji C2W-D1R ganti B", `'${pertama[0]}'`);
          c.expect(a2.code === 0, `the first connection's replacement did not commit: ${a2.out.split("\n").pop()}`);
          c.expect(b2.code !== 0 && /NOTE_NOT_CURRENT/.test(b2.out), `two replacements of one note at once: the second must be refused NOTE_NOT_CURRENT: ${b2.out.split("\n").pop()}`);
          const ganti = psql(`select count(*) from public.catatan_peninjau where menggantikan_id = '${pertama[0]}'`).stdout.trim();
          c.expect(ganti === "1", `exactly one replacement must stand: ${ganti}`);
        }
      } finally {
        const r = bersih();
        c.expect(r.status === 0 && r.stdout.trim().split("\n").pop() === "0", `the test's notes could not be removed afterwards: ${(r.stderr || r.stdout).trim().slice(0, 160)}`);
      }
      return c.verdict("two real connections on a sealed question of the seeded cycle school, as its head of programme: two first notes on one option at once leave one, the second refused NOTE_EXISTS; two replacements of that note at once leave one, the second refused NOTE_NOT_CURRENT; the test's notes removed afterwards");
    },
  },
];

export const C2W_CATATAN_MIGRASI = MIGRASI;
