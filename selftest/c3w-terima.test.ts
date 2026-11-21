/**
 * C3w-1 · DECIDING ON A GENERATED DRAFT, THE SUBMIT GATE, AND WRITING THE DRAFTS: the red cases (C3W-1-DESIGN.md §2,
 * §3, §9 answer 2; C3-1; Bob's answers to Q1, Q2 and Q3, 21 Nov). C1w's harness world: the class's teacher, a draft
 * package of theirs, and generated drafts in it. One transaction, rolled back.
 *
 *   C3W-T01 (Q2)  ai_putuskan(p_item, 'TERIMA' | 'HAPUS'), the teacher's decision. Terima records EDITED when the item's
 *                 content hash differs from its provenance hash, ACCEPTED when it does not: derived, never chosen. Hapus
 *                 removes the draft through hapus_soal_draf and records DELETED, in one transaction. A decision by
 *                 someone without CAN_DRAFT is refused, and so is one on a question that is not generated. The log is
 *                 append-only (plant: its guard dropped, an update lands).
 *   C3W-T02 (Q3)  langkah_konten refuses the submit, AI_BELUM_DITERIMA, while a generated draft in the package has no
 *                 latest decision ACCEPTED or EDITED; once every one has, the submit goes through. The author cannot
 *                 approve their own generated draft. Plant: the gate's check replaced by false, the undecided submit lands.
 *   C3W-T03 (Q1, Sharon's ruling with three additions)  ai_tulis_draf(p_percobaan, p_soal, p_penggunaan), service_role only: refused
 *                 on an attempt that is not a claimed sending, and on a bad p_soal (two keys; the wrong count), each
 *                 writing nothing; on a claimed attempt it writes the count asked, authored by the requester, one
 *                 provenance row each with the content's hash, and settles the attempt.
 */
import { Checks, type SelfTest } from "./lib";
import { G, S, jalankan, langkah } from "./c1w.test";

/** The draft package's questions: Z, the one removed, is a practice question (a test's last question cannot go); X, Y and
 *  W are the others, in a fixed order. */
const SOAL_D1 = `(select i.id from public.items i join public.lessons l on l.id = i.lesson_id join public.modules md on md.id = l.module_id
   where md.course_id = ${G("d1")}`;
const soalZ = `${SOAL_D1} and i.cycle_role is null order by i.id limit 1)`;
const soalKe = (n: number) => `${SOAL_D1} and i.id <> ${G("z")} order by i.id offset ${n - 1} limit 1)`;
const PELAJARAN = `(select l.id from public.lessons l join public.modules md on md.id = l.module_id where md.course_id = ${G("d1")} order by l.ordinal limit 1)`;
const putuskan = (k: string, siapa: string, it: string, kp: string) =>
  langkah(k, siapa, `select (public.ai_putuskan(${it}, '${kp}') ->> 'keputusan')`);
const terakhir = (it: string) => `(select p.keputusan from public.ai_penerimaan p where p.item_id = ${it} order by p.pada desc, p.id desc limit 1)`;
/** A generated draft's provenance, written past the guard as a fixture would (its writer, ai_tulis_draf, is T03's). */
const asal = (it: string) => `
  insert into public.ai_asal_soal (item_id, permintaan, percobaan, model_ident, versi_prompt, excerpt_sha256, pemohon, isi_sha256)
  values (${it}, current_setting('c1.t_minta')::uuid, current_setting('c1.t_coba')::uuid, 'stub-1', 'c3w-1.1', repeat('c', 64),
          ${G("p_guru")}, public.ai_isi_soal_sha256(${it}));`;
/** The usage the route reports for the call (Sharon's closed shape). */
const PAKAI = `'{"token_masuk": 200, "token_keluar": 80, "biaya_mikro": 280}'::jsonb`;
const soalJson = (stem: string, kunci: string) => `jsonb_build_object('stem', '${stem}', 'options', jsonb_build_array(
    jsonb_build_object('label', 'A', 'body', 'Pilihan A', 'is_correct', '${kunci}' = 'A', 'rationale', 'Alasan A.'),
    jsonb_build_object('label', 'B', 'body', 'Pilihan B', 'is_correct', '${kunci}' = 'B', 'rationale', 'Alasan B.')))`;

let hasil: Record<string, string> | null | undefined;
function skenario(c: Checks, repoRoot: string): Record<string, string> | null {
  if (hasil !== undefined) return hasil;
  const L: string[] = [
    `perform pg_temp.c1_murid('m1'); perform pg_temp.c1_draf('d1');`,
    // the operator's rows, a checked request on the draft's first lesson, and a claimed attempt of it
    `insert into public.ai_opsi (kunci, nama_tampilan, model_ident, harga_dasar, status, plafon_biaya, henti_keras_terverifikasi)
       values ('t-' || ${S("tag")}, 'Uji', 'stub-1', '{"masuk": 1, "keluar": 1}', 'QUALIFIED', 100000000, true);
     insert into public.ai_plafon_platform (plafon) values (100000000) on conflict (id) do nothing;
     insert into public.ai_hak_sekolah (sekolah, opsi, aktif, jatah, mulai)
       select ${G("inst")}, o.id, true, 100000000, now() - interval '1 day' from public.ai_opsi o where o.kunci = 't-' || ${S("tag")};`,
    langkah("t_minta", "guru", `select set_config('c1.t_minta', (public.ai_minta_draf(${G("d1")}, ${PELAJARAN}, 'Budi membeli lima apel di pasar.',
        'Membandingkan pecahan', 2, 't-satu', true) ->> 'permintaan'), true)`),
    langkah("t_coba", null, `select set_config('c1.t_coba', public.ai_cadangkan(current_setting('c1.t_minta')::uuid)::text, true)`),
    langkah("t_kirim", null, `select public.ai_tandai_kirim(current_setting('c1.t_coba')::uuid)::text`),
    // three generated drafts (X kept, Y edited then kept, Z removed) and one written by hand (W)
    `perform set_config('c1.z', ${soalZ}::text, true);
     perform set_config('c1.x', ${soalKe(1)}::text, true); perform set_config('c1.y', ${soalKe(2)}::text, true);
     perform set_config('c1.w', ${soalKe(3)}::text, true);`,
    langkah("t_ada", null, `select concat_ws('|', ${S("x")} <> '', ${S("y")} <> '', ${S("z")} <> '', ${S("w")} <> '')`),
    `begin set local session_replication_role = replica; ${asal(G("x"))} ${asal(G("y"))} ${asal(G("z"))}
       set local session_replication_role = origin;
     exception when others then v := v || jsonb_build_object('t_asal', 'ERR:' || sqlerrm); end;`,
    // ---- T02 before any decision: the submit is refused
    langkah("t2_awal", "guru", `select public.langkah_konten(${G("d1")}, 'STRUCTURED')::text`),
    langkah("t2_valid", "guru", `select public.langkah_konten(${G("d1")}, 'VALIDATED')::text`),
    langkah("t2_tolak", "guru", `select public.langkah_konten(${G("d1")}, 'IN_REVIEW')::text`),
    // the gate's plant, undone at once: its check replaced by false in langkah_konten, the undecided submit lands
    `declare x text; d text; begin
       d := pg_get_functiondef('public.langkah_konten(uuid,text)'::regprocedure);
       if position('public.ai_draf_belum_diputuskan(p_course) > 0' in d) = 0 then
         v := v || jsonb_build_object('tanam_gerbang', 'ERR:langkah_konten has no gate to plant');
       else
         execute replace(d, 'public.ai_draf_belum_diputuskan(p_course) > 0', 'false');
         x := pg_temp.c1(${G("u_guru")}, $p$select public.langkah_konten(current_setting('c1.d1')::uuid, 'IN_REVIEW')::text$p$);
         v := v || jsonb_build_object('tanam_gerbang', x);
       end if;
       raise exception 'c3w-batal';
     exception when others then if sqlerrm <> 'c3w-batal' then v := v || jsonb_build_object('tanam_gerbang', 'ERR:' || sqlerrm); end if;
     end;`,
    // ---- T01: who may decide, and on what
    putuskan("t1_lain", "lain", G("x"), "TERIMA"),
    putuskan("t1_murid", "m1", G("x"), "TERIMA"),
    putuskan("t1_bukan_ai", "guru", G("w"), "TERIMA"),
    putuskan("t1_kata", "guru", G("x"), "SETUJU"),
    // X kept as generated; Y edited in the ordinary editor, then kept; Z removed
    putuskan("t1_x", "guru", G("x"), "TERIMA"),
    langkah("t1_ubah", "guru", `select (public.ubah_soal_draf(${G("y")}, (select i.revision from public.items i where i.id = ${G("y")}),
        ${soalJson("Soal yang disunting guru", "B")}) ->> 'ok')`),
    putuskan("t1_y", "guru", G("y"), "TERIMA"),
    putuskan("t1_z", "guru", G("z"), "HAPUS"),
    langkah("t1_log", null, `select concat_ws('|', ${terakhir(G("x"))}, ${terakhir(G("y"))}, ${terakhir(G("z"))},
        (select count(*) from public.items i where i.id = ${G("z")}), (select count(*) from public.ai_asal_soal a where a.item_id = ${G("z")}))`),
    // the log is append-only, for any writer
    langkah("t1_ubah_log", null, `update public.ai_penerimaan set keputusan = 'ACCEPTED' where item_id = ${G("y")} returning keputusan`),
    langkah("t1_hapus_log", null, `delete from public.ai_penerimaan where item_id = ${G("x")} returning keputusan`),
    // ---- T02 after every generated draft is decided: the submit goes through; the author cannot approve
    // the edit and the removal sent the checked package back to be checked (draf_kembali_periksa), so it is checked again
    langkah("t2_valid2", "guru", `select public.langkah_konten(${G("d1")}, 'VALIDATED')::text`),
    langkah("t2_lolos", "guru", `select public.langkah_konten(${G("d1")}, 'IN_REVIEW')::text`),
    langkah("t2_status", null, `select status::text from public.courses where id = ${G("d1")}`),
    langkah("t2_setuju_sendiri", "guru", `select public.langkah_konten(${G("d1")}, 'APPROVED')::text`),
    // ---- T03: writing the drafts (Q1, Sharon's three additions), service_role's alone, on a draft package of its own
    `perform pg_temp.c1_draf('d2');`,
    langkah("t3_minta", "guru", `select set_config('c1.t3_minta', (public.ai_minta_draf(${G("d2")}, (select l.id from public.lessons l join public.modules md on md.id = l.module_id where md.course_id = ${G("d2")} order by l.ordinal limit 1), 'Budi membeli lima apel.',
        'Membandingkan pecahan', 2, 't3-satu', true) ->> 'permintaan'), true)`),
    langkah("t3_coba", null, `select set_config('c1.t3_coba', public.ai_cadangkan(current_setting('c1.t3_minta')::uuid)::text, true)`),
    langkah("t3_kirim", null, `select public.ai_tandai_kirim(current_setting('c1.t3_coba')::uuid)::text`),
    langkah("t3_hak", null, `select has_function_privilege('authenticated', to_regprocedure('public.ai_tulis_draf(uuid,jsonb,jsonb)'), 'execute')::text
        || '|' || has_function_privilege('service_role', to_regprocedure('public.ai_tulis_draf(uuid,jsonb,jsonb)'), 'execute')::text`),
    langkah("t3_belum_kirim", null, `select public.ai_tulis_draf(public.ai_cadangkan(current_setting('c1.t3_minta')::uuid),
        jsonb_build_array(${soalJson("Belum dikirim satu", "A")}, ${soalJson("Belum dikirim dua", "B")}), ${PAKAI})::text`),
    langkah("t3_dua_kunci", null, `select public.ai_tulis_draf(current_setting('c1.t3_coba')::uuid, jsonb_build_array(
        jsonb_build_object('stem', 'Dua kunci', 'options', jsonb_build_array(
          jsonb_build_object('label', 'A', 'body', 'A', 'is_correct', true, 'rationale', 'a'),
          jsonb_build_object('label', 'B', 'body', 'B', 'is_correct', true, 'rationale', 'b'))), ${soalJson("Dua", "B")}), ${PAKAI})::text`),
    langkah("t3_jumlah", null, `select public.ai_tulis_draf(current_setting('c1.t3_coba')::uuid, jsonb_build_array(${soalJson("Hanya satu", "A")}), ${PAKAI})::text`),
    langkah("t3_penulis", null, `select public.ai_tulis_draf(current_setting('c1.t3_coba')::uuid, jsonb_build_array(
        ${soalJson("Penulis disisipkan", "A")} || jsonb_build_object('author_person_id', ${G("p_m1")}), ${soalJson("Dua", "B")}), ${PAKAI})::text`),
    langkah("t3_opsi_lebih", null, `select public.ai_tulis_draf(current_setting('c1.t3_coba')::uuid, jsonb_build_array(
        jsonb_build_object('stem', 'Opsi berkunci lebih', 'options', jsonb_build_array(
          jsonb_build_object('label', 'A', 'body', 'A', 'is_correct', true, 'rationale', 'a', 'catatan', 'x'),
          jsonb_build_object('label', 'B', 'body', 'B', 'is_correct', false, 'rationale', 'b'))), ${soalJson("Dua", "B")}), ${PAKAI})::text`),
    langkah("t3_panjang", null, `select public.ai_tulis_draf(current_setting('c1.t3_coba')::uuid, jsonb_build_array(
        ${soalJson("Panjang", "A")} || jsonb_build_object('stem', repeat('x', 2001)), ${soalJson("Dua", "B")}), ${PAKAI})::text`),
    langkah("t3_tak_tertulis", null, `select (select count(*) from public.items i join public.lessons l on l.id = i.lesson_id join public.modules md on md.id = l.module_id
        where md.course_id = ${G("d2")} and (i.stem in ('Belum dikirim satu', 'Dua kunci', 'Hanya satu', 'Penulis disisipkan', 'Opsi berkunci lebih', 'Dua')
          or length(i.stem) > 2000))::text || '|' || (select keadaan from public.ai_percobaan where id = current_setting('c1.t3_coba')::uuid)`),
    langkah("t3_tulis", null, `select public.ai_tulis_draf(current_setting('c1.t3_coba')::uuid,
        jsonb_build_array(${soalJson("Soal AI satu", "A")}, ${soalJson("Soal AI dua", "B")}), ${PAKAI})::text`),
    langkah("t3_hasil", null, `select concat_ws('|',
        (select count(*) from public.items i where i.stem in ('Soal AI satu', 'Soal AI dua') and i.author_person_id = ${G("p_guru")}),
        (select count(*) from public.ai_asal_soal a join public.items i on i.id = a.item_id
          where i.stem in ('Soal AI satu', 'Soal AI dua') and a.isi_sha256 = public.ai_isi_soal_sha256(i.id)
            and a.percobaan = current_setting('c1.t3_coba')::uuid and a.pemohon = ${G("p_guru")}),
        (select keadaan from public.ai_percobaan where id = current_setting('c1.t3_coba')::uuid))`),
    // Sharon's addition 1: the requester's CAN_DRAFT re-checked at write time (the role revoked after the claim)
    langkah("t3b_minta", "guru", `select set_config('c1.t3b_minta', (public.ai_minta_draf(${G("d2")}, (select l.id from public.lessons l join public.modules md on md.id = l.module_id where md.course_id = ${G("d2")} order by l.ordinal limit 1), 'Ani membeli dua jeruk.',
        'Membandingkan pecahan', 2, 't3-dua', true) ->> 'permintaan'), true)`),
    langkah("t3b_coba", null, `select set_config('c1.t3b_coba', public.ai_cadangkan(current_setting('c1.t3b_minta')::uuid)::text, true)`),
    langkah("t3b_kirim", null, `select public.ai_tandai_kirim(current_setting('c1.t3b_coba')::uuid)::text`),
    `update public.role_assignments set revoked_at = now() where person_id = ${G("p_guru")} and revoked_at is null;`,
    langkah("t3b_tulis", null, `select public.ai_tulis_draf(current_setting('c1.t3b_coba')::uuid,
        jsonb_build_array(${soalJson("Setelah dicabut satu", "A")}, ${soalJson("Setelah dicabut dua", "B")}), ${PAKAI})::text`),
    langkah("t3b_tak", null, `select (select count(*) from public.items i where i.stem like 'Setelah dicabut%')::text || '|'
        || (select keadaan from public.ai_percobaan where id = current_setting('c1.t3b_coba')::uuid)`),
    // ---- the plants, last: the log's guard dropped; the gate's check removed
    `begin execute 'drop trigger ai_penerimaan_tetap on public.ai_penerimaan'; exception when others then null; end;`,
    langkah("tanam_log", null, `update public.ai_penerimaan set keputusan = 'ACCEPTED' where item_id = ${G("y")} returning keputusan`),
  ];
  hasil = jalankan(c, repoRoot, L);
  return hasil;
}
const refused = (x: string | undefined) => x !== undefined && !x.startsWith("ok:");

export const c3wTerimaTests: SelfTest[] = [
  {
    id: "C3W-T01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const h = skenario(c, repoRoot);
      if (!c.expect(h !== null, "the scenario did not run")) return c.verdict("");
      c.expect(h!.t_ada === "ok:t|t|t|t", `the package's four questions (X|Y|Z|W found): ${h!.t_ada}`);
      c.expect(h!.t_asal === undefined, `the generated drafts' provenance could not be written: ${h!.t_asal}`);
      for (const [k, siapa] of [["t1_lain", "another school's administrator"], ["t1_murid", "a learner"]] as const) {
        c.expect(refused(h![k]), `a decision by ${siapa}: ${h![k]} (refused: no CAN_DRAFT over the package)`);
      }
      c.expect(refused(h!.t1_bukan_ai), `a decision on a question written by hand: ${h!.t1_bukan_ai} (refused: not generated)`);
      c.expect(refused(h!.t1_kata), `a decision that is neither TERIMA nor HAPUS: ${h!.t1_kata} (refused)`);
      c.expect(h!.t1_x === "ok:ACCEPTED", `Terima on a draft kept as generated: ${h!.t1_x} (ACCEPTED)`);
      c.expect(h!.t1_ubah === "ok:true" && h!.t1_y === "ok:EDITED", `Terima after the editor changed it: ${h!.t1_ubah} / ${h!.t1_y} (EDITED, derived from the hash)`);
      c.expect(h!.t1_z === "ok:DELETED", `Hapus: ${h!.t1_z} (DELETED)`);
      c.expect(h!.t1_log === "ok:ACCEPTED|EDITED|DELETED|0|1", `the latest decisions (X|Y|Z), Z's item, Z's provenance: ${h!.t1_log} (ACCEPTED|EDITED|DELETED|0|1: the draft gone, its record kept)`);
      c.expect(refused(h!.t1_ubah_log) && refused(h!.t1_hapus_log), `changing or deleting a decision: ${h!.t1_ubah_log} / ${h!.t1_hapus_log} (refused: append-only)`);
      c.expect(h!.tanam_log === "ok:ACCEPTED", `the plant (the log's guard dropped) was not caught: ${h!.tanam_log}`);
      return c.verdict("executes ai_putuskan against the migrations in one rolled-back transaction, as the package's teacher (Bob's Q2): another school's administrator, a learner, a hand-written question and an unknown decision are refused; Terima on a draft kept as generated records ACCEPTED, and after an edit in the ordinary editor records EDITED (derived from the content hash, never chosen); Hapus removes the draft through hapus_soal_draf and records DELETED, its provenance kept; an update or delete of a decision is refused, and with the guard dropped (the plant) an update lands");
    },
  },
  {
    id: "C3W-T02",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const h = skenario(c, repoRoot);
      if (!c.expect(h !== null, "the scenario did not run")) return c.verdict("");
      c.expect(h!.t2_valid === "ok:", `stepping the draft to VALIDATED: ${h!.t2_valid}`);
      c.expect(h!.t2_tolak === "PR220:AI_BELUM_DITERIMA", `the submit with three generated drafts undecided: ${h!.t2_tolak} (PR220:AI_BELUM_DITERIMA)`);
      c.expect(h!.t2_lolos === "ok:" && h!.t2_status === "ok:IN_REVIEW", `the submit once each is ACCEPTED, EDITED or DELETED: ${h!.t2_lolos}, status ${h!.t2_status} (IN_REVIEW)`);
      c.expect(h!.tanam_gerbang === "ok:", `the plant (the gate's check replaced by false) was not caught: ${h!.tanam_gerbang}`);
      c.expect(refused(h!.t2_setuju_sendiri), `the author approving their own generated draft: ${h!.t2_setuju_sendiri} (refused: two people)`);
      return c.verdict("executes langkah_konten against the migrations in one rolled-back transaction, as the package's teacher (C3-1, Bob's Q3): the submit to IN_REVIEW is refused PR220 AI_BELUM_DITERIMA while generated drafts have no decision, and goes through once each is ACCEPTED, EDITED or DELETED; the author cannot approve their own generated draft; the plant, the gate's check replaced by false in langkah_konten, lets the undecided submit through");
    },
  },
  {
    id: "C3W-T03",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const h = skenario(c, repoRoot);
      if (!c.expect(h !== null, "the scenario did not run")) return c.verdict("");
      c.expect(h!.t3_hak === "ok:false|true", `ai_tulis_draf executable by authenticated|service_role: ${h!.t3_hak} (false|true)`);
      c.expect(refused(h!.t3_belum_kirim), `writing for an attempt that is not a claimed sending: ${h!.t3_belum_kirim} (refused)`);
      for (const k of ["t3_dua_kunci", "t3_jumlah", "t3_penulis", "t3_opsi_lebih", "t3_panjang"]) {
        c.expect((h![k] ?? "").startsWith("PR220:"), `${k}: ${h![k]} (refused PR220: the closed shape, the single key, the count, the bounds)`);
      }
      c.expect(h!.t3_tak_tertulis === "ok:0|RESERVED", `questions written by the refused calls|the attempt after them: ${h!.t3_tak_tertulis} (0|RESERVED: nothing written, the claim left for the route to settle)`);
      c.expect((h!.t3_tulis ?? "").startsWith("ok:") && h!.t3_hasil === "ok:2|2|SETTLED",
        `writing two drafts on the claimed attempt: ${h!.t3_tulis}; authored by the requester|with provenance hashed from the stored item|the attempt: ${h!.t3_hasil} (2|2|SETTLED)`);
      c.expect(refused(h!.t3b_tulis) && h!.t3b_tak === "ok:0|RESERVED", `writing after the requester's role was revoked: ${h!.t3b_tulis}; written|attempt: ${h!.t3b_tak} (refused; 0|RESERVED)`);
      return c.verdict("executes ai_tulis_draf against the migrations in one rolled-back transaction (Bob's Q1 as Sharon accepted it, with her three additions): service_role alone may call it; an attempt that is not a claimed sending, two keys, the wrong count, an item carrying author_person_id, an option with an extra key and an over-long stem are each refused PR220 and write nothing, leaving the claim RESERVED for the route to settle; on the claimed attempt it writes the two questions asked, authored by the requester, each with provenance hashed from the stored item, and settles; after the requester's role is revoked the write is refused");
    },
  },
];
