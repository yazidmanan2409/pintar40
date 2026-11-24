/**
 * Z · D-1 (R-16): THE GUARD ON EVERY READER OF A RESPONSE'S `pilihan` (Sharon, RULING55-D1-D8-D6-7ba18b03.md, D-1).
 *
 * A multi-answer response is stored as `{"pilihan": ["A","C"]}`, a single answer as `{"pilihan": "A"}`. A reader that
 * takes `value ->> 'pilihan'` as one label matches no option for the array, so the learner's review, Peta Bacaan, the
 * teacher's evidence and three statistical views lose the answer, or show raw JSON as «chosen».
 *
 *   Z-D1-02  every function and view body in a non-system schema that reads `->> 'pilihan'` is on one of two lists,
 *            named here for Sharon (Bob's condition 3 of Z-PLAN-APPROVAL.md):
 *              ALLOWED: array-aware by Sharon's ruling (grade_response, grade_kunci, session_answers). Each must still
 *                       branch on jsonb_typeof(... 'pilihan'); a body that stops doing so leaves the list.
 *              PENDING: the seven readers D-1 repairs in Z1 (migration 20270123100000). Each must still be found as it
 *                       is: once a reader is repaired, it leaves this list in the same commit, or the guard fails.
 *            A reader on neither list fails the guard. So a new scalar reader cannot land, and the pending list
 *            empties only by repair. Containment stays in force until Sharon passes the repaired readers.
 *            Since 20270123100000 the pending list is empty; the two choice helpers joined the allowed list.
 *            The harness's own schema (selftest, loaded by the runner, never migrated) is not product and is left out.
 */
import { Checks, type SelfTest } from "./lib";
import { lit, psql } from "./bob26.test";

/** Array-aware by Sharon's ruling (D-1 table, «No»): each branches on jsonb_typeof before it reads a scalar. */
export const PILIHAN_DIIZINKAN = ["fn:grade_kunci", "fn:grade_response", "fn:pilihan_dipilih", "fn:pilihan_tunggal", "fn:session_answers"] as const;
/** D-1's seven, repaired by 20270123100000 (Z1) and so off this list. A reader is added here only by Sharon's ruling. */
export const PILIHAN_MENUNGGU_D1: readonly string[] = [];

// Sharon (Z-D1-GUARD-CHOSEN-f9530db0.md, fc9f07ed): every scalar reading of a response's pilihan, as written and as
// Postgres prints it back (a BEGIN ATOMIC body is stored parsed, so `'pilihan'::text`): ->> 'pilihan', #>> '{pilihan}',
// jsonb_extract_path_text(…, 'pilihan') and (… -> 'pilihan')::text.
const SKALAR = String.raw`->>\s*''pilihan''|#>>\s*''\{pilihan\}''|jsonb_extract_path_text\s*\([^;]*?''pilihan''|->\s*''pilihan''(::text)?\s*\)+\s*::\s*text`;
const CABANG = String.raw`jsonb_typeof\s*\([^)]*->\s*''pilihan''`;

/** The guard's read: every body that reads pilihan as one label, by its definition as printed (Sharon (a): never prosrc,
 *  which is empty for BEGIN ATOMIC), and whether it branches on jsonb_typeof. `tanam` runs first, in the same rolled-back
 *  transaction, so a planted reader is read as a real one would be. */
export function pembacaPilihan(tanam = ""): Map<string, boolean> {
  const baris = psql(`begin;
${tanam}
select k || '|' || bercabang from (
  select 'fn:' || case when n.nspname = 'public' then '' else n.nspname || '.' end || p.proname as k,
         (pg_get_functiondef(p.oid) ~ '${CABANG}')::text as bercabang
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname not in ('pg_catalog', 'information_schema', 'selftest') and n.nspname !~ '^pg_(toast|temp)'
     and p.prokind in ('f', 'p') and pg_get_functiondef(p.oid) ~ '${SKALAR}'
  union
  select 'view:' || case when v.schemaname = 'public' then '' else v.schemaname || '.' end || v.viewname,
         (v.definition ~ '${CABANG}')::text
    from pg_views v
   where v.schemaname not in ('pg_catalog', 'information_schema', 'selftest') and v.definition ~ '${SKALAR}'
  union
  select 'view:' || case when m.schemaname = 'public' then '' else m.schemaname || '.' end || m.matviewname,
         (m.definition ~ '${CABANG}')::text
    from pg_matviews m
   where m.schemaname <> 'selftest' and m.definition ~ '${SKALAR}'
) x order by 1;
rollback;`).split("\n").filter((b) => /^(fn|view):/.test(b));
  return new Map(baris.map((b) => { const [k, v] = b.split("|"); return [k, v === "true"] as const; }));
}

/** Sharon's planted red cases: each a new scalar reader the guard must name. */
export const PILIHAN_TANAMAN: Array<[string, string]> = [
  ["fn:z_tanam_atomic", "create function public.z_tanam_atomic(v jsonb) returns text language sql begin atomic select v ->> 'pilihan'; end;"],
  ["fn:z_tanam_path", "create function public.z_tanam_path(v jsonb) returns text language sql as $$ select v #>> '{pilihan}' $$;"],
  ["fn:z_tanam_extract", "create function public.z_tanam_extract(v jsonb) returns text language plpgsql as $$ begin return jsonb_extract_path_text(v, 'pilihan'); end $$;"],
  ["fn:z_tanam_cast", "create function public.z_tanam_cast(v jsonb) returns text language sql as $$ select (v -> 'pilihan')::text $$;"],
  ["view:z_tanam_view", "create view public.z_tanam_view as select (r.value -> 'pilihan')::text as x from public.responses r;"],
];

export const zD1Tests: SelfTest[] = [
  {
    id: "Z-D1-02",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const ditemukan = pembacaPilihan();
      const izin = new Set<string>(PILIHAN_DIIZINKAN);
      const tunggu = new Set<string>(PILIHAN_MENUNGGU_D1);

      const asing = [...ditemukan.keys()].filter((k) => !izin.has(k) && !tunggu.has(k));
      c.expect(asing.length === 0, `a reader of pilihan as one label on neither list: ${asing.join(", ")} (a new scalar reader; make it array-aware, or put it to Sharon)`);
      const tanpaCabang = [...izin].filter((k) => ditemukan.has(k) && !ditemukan.get(k));
      c.expect(tanpaCabang.length === 0, `on the allowed list but no longer branching on jsonb_typeof(... 'pilihan'): ${tanpaCabang.join(", ")}`);
      const hilang = [...tunggu].filter((k) => !ditemukan.has(k));
      c.expect(hilang.length === 0, `pending D-1 but no longer reading pilihan as one label: ${hilang.join(", ")} (repaired? remove it from PILIHAN_MENUNGGU_D1 in the same commit)`);
      // Sharon (a) and (b): each planted form, a BEGIN ATOMIC body among them, is named by the guard
      const terlewat: string[] = [];
      for (const [k, ddl] of PILIHAN_TANAMAN) {
        const dgn = pembacaPilihan(ddl);
        if (!dgn.has(k) || dgn.get(k)) terlewat.push(k);
      }
      c.expect(terlewat.length === 0, `planted scalar readers the guard does not name: ${terlewat.join(", ")}`);
      const menunggu = [...tunggu].filter((k) => ditemukan.has(k));
      return c.verdict(`reads every function and procedure by pg_get_functiondef (BEGIN ATOMIC included), every view and materialised view, outside the system schemas and the harness's selftest schema, for ->> 'pilihan', #>> '{pilihan}', jsonb_extract_path_text(…, 'pilihan') and (… -> 'pilihan')::text: ${ditemukan.size} found; `
        + `allowed and array-aware: ${[...izin].filter((k) => ditemukan.has(k)).join(", ") || "none"}; `
        + `pending D-1: ${menunggu.length}; on neither list: none; each of ${PILIHAN_TANAMAN.length} planted readers (${PILIHAN_TANAMAN.map(([k]) => k).join(", ")}) is named`);
    },
  },
];

// ── Z-D1-01: the seven readers on a multi-answer response, and a single answer unchanged ────────────────────────────
// The seeded human-evaluation sitting (the only finalised Uji Penguasaan of peraga-siswa, read by her and by her class's
// teacher). The seed draws its content afresh on every build, so nothing here is a constant: question 1 (position 1)
// has its key K; W is a wrong option with a misconception; X is a third option. Inside a transaction that is rolled back,
// question 1 becomes multi-answer with K and X right, and the learner's final answer is {X, W} (wrong, W's misconception)
// or {X, K} (right). A single answer is compared on the same world: the readers as they were on 300
// (selftest/fixtures/z/d1-pembaca-300.sql) against the repaired ones, inside one rolled-back transaction.
const SISWA = "peraga-siswa@evaluasi.pintar.test";
const GURU = "peraga-guru@evaluasi.pintar.test";
type Dunia = { sesi: string; tugas: string; kelas: string; soal: string; K: string; W: string; X: string; kodeW: string; obat: string; badan: Record<string, string> };

function dunia(): Dunia | string {
  const baris = psql(`
select s.id || '|' || s.assessment_assignment_id || '|' || s.class_node_id || '|' || p.item_id
  from public.assessment_sessions s join public.accounts a on a.person_id = s.person_id join auth.users u on u.id = a.auth_user_id
  join public.presented_items p on p.session_id = s.id
 where u.email = ${lit(SISWA)} and s.status = 'FINALIZED' and s.mode = 'POST_TEST'
 order by p.position limit 1`);
  if (!baris) return "the seeded human-evaluation sitting of peraga-siswa was not found";
  const [sesi, tugas, kelas, soal] = baris.split("|");
  const opsi = psql(`select string_agg(o.label || '|' || o.is_correct || '|' || coalesce(o.misconception_code, '') || '|' || o.body, E'\\n' order by o.label collate "C")
                       from public.item_options o where o.item_id = ${lit(soal)}`).split("\n").map((x) => x.split("|"));
  const K = opsi.find((o) => o[1] === "true")?.[0];
  const W = opsi.find((o) => o[1] === "false" && o[2] !== "")?.[0];
  const X = opsi.find((o) => o[0] !== K && o[0] !== W)?.[0];
  if (!K || !W || !X) return `question 1 lacks a key, a wrong option with a misconception, or a third option: ${JSON.stringify(opsi)}`;
  const kodeW = opsi.find((o) => o[0] === W)![2];
  const obat = psql(`select mt.remediation from public.misconception_taxonomy mt join public.item_options o on o.misconception_code = mt.code and o.institution_id = mt.institution_id where o.item_id = ${lit(soal)} and o.label = ${lit(W)}`);
  return { sesi, tugas, kelas, soal, K, W, X, kodeW, obat, badan: Object.fromEntries(opsi.map((o) => [o[0], o.slice(3).join("|")])) };
}

function bacaan(d: Dunia, mode: { jawab?: string; pembaca300?: string }) {
  const { sesi, soal, kelas } = d;
  const satu = mode.jawab !== undefined;
  const ubah = !satu ? "" : `
set local session_replication_role = replica;
update public.items set item_type = 'MCQ_MULTI' where id = '${soal}';
update public.item_options set is_correct = true where item_id = '${soal}' and label = ${lit(d.X)};
update public.responses r set value = ${lit(mode.jawab!)}::jsonb from public.presented_items p
 where p.id = r.presented_item_id and r.is_final and p.session_id = '${sesi}' and p.item_id = '${soal}';
set local session_replication_role = origin;`;
  const tqe = `public.teacher_question_evidence('${d.tugas}', '${kelas}')`;
  const m = (x: string) => `md5(coalesce(${x}, ''))`;
  // RESTATED (D2-R, ruling 74): a certifying sitting's learner reads no review and no reasons. D-1's readers still serve
  // every sitting that is not certifying, so in this rolled-back world the seeded sitting is one (its capture, set past
  // the seal as only the harness can), and the learner's two readers are read as D-1 left them
  const tangkap = `
set local session_replication_role = replica;
update public.assessment_sessions set bersertifikasi = false,
  assistance_policy = jsonb_set(assistance_policy, '{reveals_rationale_on_review}', 'true') where id = '${sesi}';
set local session_replication_role = origin;`;
  return psql(`begin;${mode.pembaca300 ?? ""}${ubah}${tangkap}
select 'stat|' || ${satu ? `(select evidence_count || ':' || correct_count from public.service_item_statistics where item_id = '${soal}')` : `(select ${m("string_agg(x::text, '|' order by x.item_id)")} from public.service_item_statistics x)`};
select 'uptake|' || ${satu ? `coalesce((select string_agg(label || ':' || chosen_count, ',' order by label) from public.service_distractor_uptake where item_id = '${soal}'), '-')` : `(select ${m("string_agg(x::text, '|' order by x.item_id, x.label)")} from public.service_distractor_uptake x)`};
select 'cohort|' || ${satu ? `coalesce((select string_agg(distinct misconception_code, ',') from public.service_cohort_misconceptions where class_node_id = '${kelas}'), '-')` : `(select ${m("string_agg(x::text, '|' order by x::text)")} from public.service_cohort_misconceptions x)`};
select 'miskon|' || ${satu ? `coalesce((select string_agg(misconception_code, ',' order by misconception_code) from public.session_misconceptions('${sesi}') where item_id = '${soal}'), '-')` : `(select ${m("string_agg(x::text, '|' order by x::text)")} from public.session_misconceptions('${sesi}') x)`};
select selftest.as_user(${lit(SISWA)});
select 'review|' || ${satu ? `(select coalesce(jawaban_teks, 'NULL') || '#' || coalesce(benar::text, 'NULL') || '#' || coalesce(alasan, 'NULL') from public.session_review('${sesi}') where posisi = 1)` : `(select ${m("string_agg(x::text, '|' order by x.posisi)")} from public.session_review('${sesi}') x)`};
select 'peta|' || ${satu ? `coalesce((select string_agg(x.alasan, ' ~ ' order by x.peringkat) from public.reading_map('${sesi}') x), '-')` : `(select ${m("string_agg(x::text, '|' order by x.peringkat)")} from public.reading_map('${sesi}') x)`};
select selftest.as_user(${lit(GURU)});
select 'guru|' || ${satu
    ? `(select a::text from jsonb_array_elements(${tqe} -> 'learners') l, jsonb_array_elements(l -> 'answers') a where a ->> 'item_id' = '${soal}')`
    : `md5((select jsonb_set(e, '{learners}', coalesce((select jsonb_agg(jsonb_set(l, '{answers}', coalesce((select jsonb_agg(a - 'chosen_all' order by n) from jsonb_array_elements(l -> 'answers') with ordinality t(a, n)), '[]'::jsonb)) order by m) from jsonb_array_elements(e -> 'learners') with ordinality u(l, m)), '[]'::jsonb))::text from (select ${tqe} as e) q))`};
rollback;`).split("\n").filter((b) => /^(stat|uptake|cohort|miskon|review|peta|guru)\|/.test(b))
    .reduce<Record<string, string>>((o, b) => { const i = b.indexOf("|"); o[b.slice(0, i)] = b.slice(i + 1); return o; }, {});
}

export const zD1Tests_01: SelfTest[] = [
  {
    id: "Z-D1-01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const d = dunia();
      if (typeof d === "string") { c.expect(false, d); return c.verdict(""); }
      const { readFileSync } = await import("node:fs");
      const { join } = await import("node:path");
      // a single answer, untouched: every reader reads as the 300 readers do on the same world
      const pembaca300 = "\n" + readFileSync(join(repoRoot, "selftest", "fixtures", "z", "d1-pembaca-300.sql"), "utf8")
        .split("\n").filter((x) => !x.startsWith("--")).join("\n") + "\n";
      const kini = bacaan(d, {});
      const dulu = bacaan(d, { pembaca300 });
      for (const k of ["stat", "uptake", "cohort", "miskon", "review", "peta", "guru"]) {
        c.expect(kini[k] !== undefined && kini[k] === dulu[k], `a single answer no longer reads as the 300 readers read it: ${k} ${kini[k]} (300: ${dulu[k]})`);
      }
      const { X, W, K, kodeW, badan, obat } = d;
      const urut = (a: string, b: string) => [a, b].sort();
      const salah = bacaan(d, { jawab: JSON.stringify({ pilihan: urut(X, W) }) });
      const benar = bacaan(d, { jawab: JSON.stringify({ pilihan: urut(X, K) }) });
      const [s1, s2] = urut(X, W), [b1, b2] = urut(X, K);
      // and the same multi-answer is lost by the 300 readers (the defect this repairs, on this world)
      const lama = bacaan(d, { pembaca300, jawab: JSON.stringify({ pilihan: urut(X, W) }) });
      c.expect((lama.review ?? "").startsWith("NULL#"), `the 300 readers no longer lose a multi-answer, so this case proves nothing: ${lama.review}`);
      // the learner's review: every chosen option's text in label order, one row, wrong or right
      c.expect((salah.review ?? "").startsWith(`${badan[s1]} · ${badan[s2]}#false#`) && !(salah.review ?? "").endsWith("#NULL"),
        `the learner's review of {${s1}, ${s2}}: ${salah.review} (both options' texts in label order, wrong, with a reason)`);
      c.expect((benar.review ?? "").startsWith(`${badan[b1]} · ${badan[b2]}#true#`), `the learner's review of {${b1}, ${b2}}: ${benar.review} (both options, right)`);
      // misconceptions, Peta Bacaan, the class: W's misconception is found
      c.expect(salah.miskon === kodeW, `session_misconceptions on {${s1}, ${s2}}: ${salah.miskon} (${W}'s ${kodeW})`);
      c.expect(benar.miskon === "-", `session_misconceptions on {${b1}, ${b2}}: ${benar.miskon} (none: both right)`);
      c.expect(obat !== "" && (salah.peta ?? "").includes(obat), `Peta Bacaan on {${s1}, ${s2}} does not carry ${kodeW}'s remediation «${obat}»: ${salah.peta}`);
      c.expect(salah.cohort === kodeW, `the class's misconceptions on {${s1}, ${s2}}: ${salah.cohort}`);
      // statistics: one response, right by the scorer; each chosen option counted as chosen
      c.expect(salah.stat === "1:0" && benar.stat === "1:1", `item statistics: wrong ${salah.stat}, right ${benar.stat} (1:0 and 1:1, one response each, right by grade_kunci)`);
      c.expect(salah.uptake === `${s1}:1,${s2}:1` && benar.uptake === `${b1}:1,${b2}:1`, `option uptake: wrong ${salah.uptake}, right ${benar.uptake}`);
      // the teacher: never the JSON text; every label in chosen_all
      const g = (x?: string) => { try { return JSON.parse(x ?? "null") as { chosen: unknown; chosen_all: unknown; right: unknown } | null; } catch { return null; } };
      const gs = g(salah.guru), gb = g(benar.guru);
      c.expect(gs !== null && gs.chosen === null && JSON.stringify(gs.chosen_all) === JSON.stringify([s1, s2]) && gs.right === false,
        `the teacher's evidence of the wrong answer: ${salah.guru} (chosen null, never JSON text; chosen_all [${s1}, ${s2}])`);
      c.expect(gb !== null && gb.chosen === null && JSON.stringify(gb.chosen_all) === JSON.stringify([b1, b2]) && gb.right === true,
        `the teacher's evidence of the right answer: ${benar.guru}`);
      // Sharon's rule 1: in the teacher's whole evidence, no chosen is JSON text, and every answer carries chosen_all
      const semuaJawab = psql(`begin; select selftest.as_user(${lit(GURU)});
select coalesce(string_agg(case when (a ->> 'chosen') like '[%' then 'JSON' when jsonb_typeof(a -> 'chosen_all') <> 'array' then 'TANPA' else 'ok' end, ',' order by 1), '')
  from jsonb_array_elements(public.teacher_question_evidence('${d.tugas}', '${d.kelas}') -> 'learners') l, jsonb_array_elements(l -> 'answers') a; rollback;`)
        .split("\n").find((b) => /^(ok|JSON|TANPA)/.test(b)) ?? "";
      c.expect(semuaJawab !== "" && semuaJawab.split(",").every((x) => x === "ok"), `the teacher's answers: ${semuaJawab} (no chosen starting with «[», chosen_all on every answer)`);
      // the teacher's class view (soal-kelas.ts) counts a multi-answer once on each option chosen, and names it by them all
      const { susunBuktiSoal } = await import("../src/lib/soal-kelas");
      const kelas = susunBuktiSoal({ sittings: 2, questions: [{ item_id: "q", stem: "", options: [], presented: 2, answered: 2, right: 0 } as never],
        learners: [{ person_id: "1", name: "Ani", answers: [{ item_id: "q", chosen: null, chosen_all: ["A", "B"], right: false }] },
                   { person_id: "2", name: "Budi", answers: [{ item_id: "q", chosen: "B", chosen_all: ["B"], right: false }] }] });
      c.expect(JSON.stringify(kelas[0]?.pilihan) === '{"A":1,"B":2}' && kelas[0]?.perluBantuan.map((x) => x.pilihan).join("|") === "A, B|B",
        `the class view of {A, B} and B: ${JSON.stringify(kelas[0])} (A:1, B:2; Ani named by «A, B»)`);
      return c.verdict(`executes the seven readers of a response's choice against the migrations, rolled back, on the seeded sitting with question 1 made multi-answer (key ${K} and ${X} right): {${s1}, ${s2}} reads both options' texts, wrong, with a reason; ${kodeW} in session_misconceptions, Peta Bacaan's remediation and the class's misconceptions; statistics 1:0 and uptake ${salah.uptake}; the teacher's chosen null with chosen_all [${s1}, ${s2}]; {${b1}, ${b2}} reads both, right, 1:1; the 300 readers lose the same answer. The untouched single answer reads identically through the 300 readers and the repaired ones on the same world (the teacher's chosen_all aside); and the teacher's class view counts a multi-answer once on each option chosen`);
    },
  },
];

// ── Z-D1-03: the before-import report (Sharon's ruling-56 condition: a check, not a promise) ───────────────────────────
export const zD1Tests_03: SelfTest[] = [
  {
    id: "Z-D1-03",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const { readFileSync } = await import("node:fs");
      const { join } = await import("node:path");
      const { spawnSync } = await import("node:child_process");
      const berkas = join(repoRoot, "scripts", "release", "before-import", "d1-multi-answer.sql");
      const sql = readFileSync(berkas, "utf8");
      const kode = sql.replace(/--[^\n]*/g, "");
      c.expect(/begin transaction read only;/i.test(kode) && /rollback;\s*$/i.test(kode.trim() + "\n"), "the report is not one read-only transaction, rolled back");
      c.expect(!/\b(insert|update|delete|truncate|alter|drop|create|grant|revoke)\b/i.test(kode), "the report writes or changes something");
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-f", berkas, process.env.SUPABASE_DB_URL!], { encoding: "utf8" });
      const baris = Object.fromEntries(r.stdout.split("\n").filter((b) => b.includes("|")).map((b) => [b.slice(0, b.indexOf("|")), b.slice(b.indexOf("|") + 1)]));
      // the seeded world holds «Pecahan»'s three APPROVED multi-answer items and no final response (Sharon, 18 Nov)
      const n = Number(psql("select count(*) from public.items where item_type = 'MCQ_MULTI'"));
      c.expect(r.status === 0, `the report failed to run: ${(r.stderr || "").trim().split("\n").pop()}`);
      c.expect(n > 0 ? (baris.verdict ?? "").startsWith("REPORT") : baris.verdict === "NONE", `the verdict ${baris.verdict} for ${n} multi-answer item(s)`);
      c.expect(baris.items === `APPROVED:${psql("select count(*) from public.items where item_type = 'MCQ_MULTI' and status = 'APPROVED'")}` || n === 0,
        `the item counts by status: ${baris.items}`);
      c.expect(baris.final_responses === psql("select count(*) from public.responses r join public.presented_items p on p.id = r.presented_item_id join public.items i on i.id = p.item_id where i.item_type = 'MCQ_MULTI' and r.is_final"),
        `the final-response count: ${baris.final_responses}`);
      return c.verdict(`reads and runs scripts/release/before-import/d1-multi-answer.sql against the seeded world: one read-only transaction, rolled back, that writes nothing and names no person; it reports ${baris.items} multi-answer item(s) in ${baris.courses}, ${baris.final_responses} final response(s), and the verdict «${baris.verdict}»`);
    },
  },
];
