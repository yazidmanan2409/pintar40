/**
 * C2W-F4R — F-4: TWO AUTHORS SAVE ONE DRAFT AT ONCE, ON TWO REAL CONNECTIONS (THE PLAN §7.7 F-4; PLAN-A2B-C2W.md §3.2:
 * "concurrent edits of one draft, on two connections, using the shared race helper"; before C2w, and in any case
 * before C3w's build, which writes drafts through the same path).
 *
 * C1W-S01 proves DRAFT_EDIT_CONFLICT one save after the other. This proves it in a real race (selftest/balapan.ts):
 * two teachers of the draft's class read revision 1 and save it at once. The first holds the question's row
 * (ubah_soal_draf's FOR UPDATE) for 2.5 s before committing; the second starts while it holds it. In both orders:
 *   - the second is refused PR180 DRAFT_EDIT_CONFLICT, and only after waiting for the first (the race overlapped);
 *   - the question is at revision 2 with the first's words, never the second's;
 *   - item_draft_edits holds exactly one ITEM_EDITED row from 1 to 2, by the first: no edit lost, none duplicated.
 * Two locks serialise a save: draf_kunci's FOR UPDATE on the course, then ubah_soal_draf's on the question; either
 * alone is enough. The plant removes both. The second then reads revision 1 too, waits only at its UPDATE, and both
 * saves run past the revision check: the second is no longer refused DRAFT_EDIT_CONFLICT (locally it fails on
 * item_options' unique key instead, a refusal with no name), or both succeed. The test must catch it.
 * Everything it commits is removed after, and proved gone.
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { Checks, type SelfTest } from "./lib";
import { balapan, gantiFungsi } from "./balapan";

const db = () => process.env.SUPABASE_DB_URL!;
function psql(sql: string): string {
  const r = spawnSync("psql", ["-X", "-q", "-At", "-v", "ON_ERROR_STOP=1", db()], { encoding: "utf8", input: sql });
  if (r.status !== 0) throw new Error((r.stderr || "").trim().split("\n").filter((l) => /ERROR/.test(l)).slice(-2).join(" | "));
  return (r.stdout ?? "").trim().split("\n").pop() ?? "";
}
const lit = (s: string) => `'${s.replace(/'/g, "''")}'`;
function muat(repoRoot: string): string | null {
  for (const f of ["fable01.sql", "fable02.sql", "fable03.sql", "fable04.sql", "fable05.sql", "fable06.sql", "fable09.sql", "fable11.sql", "fable12.sql", "fable13.sql"]) {
    const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", f), db()], { encoding: "utf8" });
    if (r.status !== 0) return `selftest/db/${f} could not be loaded: ${(r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? ""}`;
  }
  return null;
}
/** A question as the editor sends it: two options, `kunci` correct. */
const soal = (stem: string, kunci: string) => `jsonb_build_object('stem', ${lit(stem)}, 'options', jsonb_build_array(
  jsonb_build_object('label', 'A', 'body', 'Pilihan A untuk soal ini', 'is_correct', ${lit(kunci)} = 'A', 'rationale', 'Alasan pilihan A.'),
  jsonb_build_object('label', 'B', 'body', 'Pilihan B untuk soal ini', 'is_correct', ${lit(kunci)} = 'B', 'rationale', 'Alasan pilihan B.')))`;

type Dunia = { tag: string; u1: string; u2: string; p1: string; p2: string; kursus: string; item: string };
/** Two teachers of the cycle school's class, and a draft course the first uploaded, committed (the other connection sees it). */
function dunia(tag: string): Dunia {
  const baris = psql(`begin;
select selftest.as_owner();
select set_config('f4.node', l.node_id::text, true), set_config('f4.inst', l.institution_id::text, true)
  from public.learning_assignments l where l.id = (select f.la from selftest.cycle_fixture() f);
select set_config('f4.u1', selftest.f11_user('c2wf4-guru1-${tag}@local.invalid', 'EDUCATOR', current_setting('f4.node')::uuid)::text, true);
select set_config('f4.u2', selftest.f11_user('c2wf4-guru2-${tag}@local.invalid', 'EDUCATOR', current_setting('f4.node')::uuid)::text, true);
select selftest.as_user_uid(current_setting('f4.u1')::uuid);
select set_config('f4.b', selftest.f11_batch(current_setting('f4.inst')::uuid, 'STRUCTURED_PACKAGE',
  selftest.f13_paket('C2W F4 draf ${tag}', 3, 2, false))::text, true);
select public.prepare_ingest_batch(current_setting('f4.b')::uuid);
select set_config('f4.k', public.confirm_ingest_batch(current_setting('f4.b')::uuid) -> 'courses' ->> 0, true);
select selftest.as_owner();
select current_setting('f4.u1') || ',' || current_setting('f4.u2')
  || ',' || (select a.person_id from public.accounts a where a.auth_user_id = current_setting('f4.u1')::uuid)
  || ',' || (select a.person_id from public.accounts a where a.auth_user_id = current_setting('f4.u2')::uuid)
  || ',' || current_setting('f4.k');
commit;`);
  const [u1, u2, p1, p2, kursus] = baris.split(",");
  const item = psql(`select i.id from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
    where m.course_id = ${lit(kursus)} order by i.created_at, i.id limit 1`);
  return { tag, u1, u2, p1, p2, kursus, item };
}
/** The draft's question back at revision 1, its edit trail gone (the harness's hand, between the orders). */
function ulang(d: Dunia): void {
  psql(`begin; set local session_replication_role = replica;
delete from public.item_draft_edits where item_id = ${lit(d.item)};
update public.items set revision = 1, edited_at = null, edited_by_person_id = null where id = ${lit(d.item)};
commit;`);
}
function bersihkan(tag: string): string {
  const orang = `(select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email like 'c2wf4-%-${tag}@local.invalid')`;
  psql(`begin; set local session_replication_role = replica;
create temp table k as select c.id from public.courses c where c.title like 'C2W F4 draf ${tag}%';
delete from public.item_draft_edits where item_id in (select i.id from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id in (select id from k));
delete from public.item_options where item_id in (select i.id from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id in (select id from k));
delete from public.items where lesson_id in (select l.id from public.lessons l join public.modules m on m.id = l.module_id where m.course_id in (select id from k));
delete from public.lessons where module_id in (select m.id from public.modules m where m.course_id in (select id from k));
delete from public.modules where course_id in (select id from k);
delete from public.ingest_batches where institution_id is not null and id in (select b.id from public.ingest_batches b where b.raw_payload::text like '%C2W F4 draf ${tag}%');
delete from public.courses where id in (select id from k);
delete from public.role_assignments where person_id in ${orang};
delete from auth.users where email like 'c2wf4-%-${tag}@local.invalid';
commit;`);
  return psql(`select (select count(*) from public.courses where title like 'C2W F4 draf ${tag}%') + (select count(*) from auth.users where email like 'c2wf4-%-${tag}@local.invalid')`);
}

/** One save of revision 1, as `uid`, its answer as text ("ok" or the refusal's sqlstate:detail). */
const simpan = (uid: string, item: string, stem: string, kunci: string) =>
  `select selftest.as_user_uid(${lit(uid)}); select public.ubah_soal_draf(${lit(item)}, 1, ${soal(stem, kunci)}) ->> 'ok'`;

async function balap(d: Dunia, pertama: "u1" | "u2") {
  const kedua = pertama === "u1" ? "u2" : "u1";
  const kata = { u1: "Pertanyaan yang ditulis guru pertama?", u2: "Pertanyaan yang ditulis guru kedua?" };
  const r = await balapan(simpan(d[pertama], d.item, kata[pertama], "B"), `begin; ${simpan(d[kedua], d.item, kata[kedua], "A")}; commit;`);
  const hasil = psql(`select i.revision || '|' || i.stem || '|' || (i.edited_by_person_id = ${lit(pertama === "u1" ? d.p1 : d.p2)})
    || '|' || (select count(*) from public.item_draft_edits e where e.item_id = i.id and e.action = 'ITEM_EDITED')
    || '|' || (select count(*) from public.item_draft_edits e where e.item_id = i.id and e.action = 'ITEM_EDITED' and e.revision_from = 1 and e.revision_to = 2
                 and e.by_person_id = ${lit(pertama === "u1" ? d.p1 : d.p2)})
    from public.items i where i.id = ${lit(d.item)}`);
  return { r, hasil, harap: `2|${kata[pertama]}|true|1|1` };
}

export const c2wF4Tests: SelfTest[] = [
  {
    id: "C2W-F4R",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const e = muat(repoRoot);
      if (!c.expect(e === null, String(e))) return c.verdict("");
      const tag = randomBytes(3).toString("hex");
      try {
        const d = dunia(tag);
        if (!c.expect(/^[0-9a-f-]{36}$/.test(d.item), `the draft has no question: ${JSON.stringify(d)}`)) return c.verdict("");
        for (const pertama of ["u1", "u2"] as const) {
          ulang(d);
          const { r, hasil, harap } = await balap(d, pertama);
          c.expect(r.satu.ok, `order ${pertama} first: the first save must succeed: ${r.satu.out} ${r.satu.err}`);
          c.expect(!r.dua.ok && /DRAFT_EDIT_CONFLICT/.test(r.dua.err), `order ${pertama} first: the second save must be refused DRAFT_EDIT_CONFLICT: ok=${r.dua.ok} ${r.dua.out} ${r.dua.err}`);
          c.expect(r.berlaku, `order ${pertama} first: the race did not overlap (the second took ${r.dua.ms} ms): nothing was proven`);
          c.expect(hasil === harap, `order ${pertama} first: revision, words, editor, edit rows, the 1→2 row by the first: ${hasil} (expected ${harap})`);
        }
        // the plant: without ubah_soal_draf's FOR UPDATE, the second reads revision 1 too and overwrites the first
        ulang(d);
        // two locks serialise a save: draf_kunci's on the course, then ubah_soal_draf's on the question; either alone
        // is enough, so the plant removes both
        const kembali1 = gantiFungsi("public.ubah_soal_draf(uuid,integer,jsonb)", "where id = p_item for update;", "where id = p_item;");
        let tanam: Awaited<ReturnType<typeof balap>>;
        try {
          const kembali2 = gantiFungsi("public.draf_kunci(uuid)", "where id = p_course for update;", "where id = p_course;");
          try { tanam = await balap(d, "u1"); } finally { kembali2(); }
        } finally { kembali1(); }
        // caught when the race no longer ends as designed: the second not refused DRAFT_EDIT_CONFLICT (without the locks it
        // fails on item_options' unique key, a nameless «Ada kendala», or succeeds), or the question and its trail differ
        const tertangkap = tanam.hasil !== tanam.harap || tanam.r.dua.ok || !/DRAFT_EDIT_CONFLICT/.test(tanam.r.dua.err);
        c.expect(tertangkap, `the plant (no FOR UPDATE on the course or the question) must be caught, and was not: ${tanam.hasil}; second ${tanam.r.dua.ok ? "succeeded" : tanam.r.dua.err}`);
        c.expect(psql(`select (position('where id = p_item for update;' in pg_get_functiondef('public.ubah_soal_draf(uuid,integer,jsonb)'::regprocedure)) > 0
            and position('where id = p_course for update;' in pg_get_functiondef('public.draf_kunci(uuid)'::regprocedure)) > 0)::text`) === "true",
          "ubah_soal_draf or draf_kunci was not put back as it was");
      } finally {
        c.expect(bersihkan(tag) === "0", "the race's teachers or draft are still there");
      }
      return c.verdict("F-4, on two real connections (selftest/balapan.ts), in both orders: two teachers save revision 1 of one draft question at once; the second waits for the first's row lock and is refused DRAFT_EDIT_CONFLICT; the question is at revision 2 with the first's words; item_draft_edits holds one ITEM_EDITED row, 1→2, by the first (none lost, none duplicated); the plant without either FOR UPDATE (draf_kunci's on the course, ubah_soal_draf's on the question), under which the second save is no longer refused by name, is caught");
    },
  },
];
