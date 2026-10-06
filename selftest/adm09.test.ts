/**
 * J3.6 (ADM-07; ADM-J09) -- A STUDENT RECORDED IN A TINGKAT IS PLACED IN ITS KELAS.
 *
 * The intake places a learner in an active Kelas or a Tingkat. One recorded in
 * a Tingkat only could not be put into a Kelas afterwards: re-intake is
 * refused, and «Pindah kelas» moved Kelas to Kelas only. move_learner_to_class
 * (supabase/migrations/20261029100000) now also places a Tingkat learner into a
 * Kelas of that same Tingkat, and Konfigurasi offers the Tingkat as a place to
 * start from while it holds learners not yet in a Kelas.
 *
 *   ADM09-S01  db: in one rolled-back transaction, Gita is recorded in the
 *              bootstrap Tingkat only; the class's teacher is refused; the
 *              school's administrator meets each refusal, then places her in
 *              5C; the snapshots are read here
 *   ADM09-K01  static: where a Tingkat learner may go (tujuanPindah), which
 *              places «Pindah kelas» starts from (asalPindah), the new
 *              refusal's code and sentence, and the page's two groups
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
create temp table adm09_snap (k text, v jsonb) on commit drop;
grant all on adm09_snap to authenticated;
do $adm09$
declare f record; v_period uuid; v_coh uuid; v_5b uuid; v_5c uuid; v_coh2 uuid; v_4a uuid; v_siswa uuid;
        v_gita uuid; v_enr uuid; v_pen uuid; v_baru uuid; v_pen_siswa uuid;
        v_state text; v_detail text; v_coba jsonb := '{}'::jsonb; v_hasil uuid;
begin
  perform selftest.as_owner();
  select * into f from selftest.boot_fixture();
  select p.id into v_siswa from public.persons p join public.accounts a on a.person_id = p.id
    join auth.users u on u.id = a.auth_user_id where u.email = 'boot-siswa@bootstrap.pintar.test';
  select n.id, n.academic_period_id, n.parent_id into v_5b, v_period, v_coh
    from public.org_nodes n join public.memberships m on m.node_id = n.id join public.enrollments e on e.id = m.enrollment_id
   where e.person_id = v_siswa and n.kind = 'CLASS' and m.valid_to is null and n.institution_id = f.inst limit 1;
  -- the bootstrap learner's own Tingkat placement (the old seeds hold a Tingkat and its Kelas both)
  select m.id into v_pen_siswa from public.memberships m join public.enrollments e on e.id = m.enrollment_id
   where e.person_id = v_siswa and m.node_id = v_coh and m.valid_to is null;

  -- Kelas 5C in the same Tingkat; another Tingkat of the same year with its Kelas 4A
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (f.inst, v_coh, 'CLASS', '5C', v_period) returning id into v_5c;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (f.inst, (select parent_id from public.org_nodes where id = v_coh), 'COHORT', 'Angkatan 4', v_period) returning id into v_coh2;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (f.inst, v_coh2, 'CLASS', '4A', v_period) returning id into v_4a;

  -- Gita: recorded in the Tingkat only, as the intake records a learner placed there (no card yet: PENDING)
  insert into public.persons (display_name) values ('Gita Murid ADM09') returning id into v_gita;
  insert into public.enrollments (person_id, institution_id, academic_period_id, status)
  values (v_gita, f.inst, v_period, 'PENDING') returning id into v_enr;
  insert into public.memberships (enrollment_id, node_id, academic_period_id)
  values (v_enr, v_coh, v_period) returning id into v_pen;

  -- 1. the class's teacher may not place her
  perform selftest.as_user('boot-guru@bootstrap.pintar.test');
  begin
    perform public.move_learner_to_class(v_pen, v_5c);
    v_coba := v_coba || jsonb_build_object('guru', 'moved');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
    v_coba := v_coba || jsonb_build_object('guru', v_state || ':' || coalesce(v_detail, ''));
  end;

  -- 2. the school's administrator: another Tingkat's Kelas, and a Tingkat, are not hers to go to
  perform selftest.as_user('boot-admin@bootstrap.pintar.test');
  -- what the administrator's Struktur sekolah counts in the Tingkat before
  insert into adm09_snap values ('AWAL', jsonb_build_object('tingkat', v_coh, 'kelas_5c', v_5c, 'kelas_5b', v_5b,
    'tingkat_murid', (select s.active_members from public.school_structure(f.inst) s where s.node_id = v_coh)));
  foreach v_hasil in array array[v_4a, v_coh2, v_coh] loop
    begin
      perform public.move_learner_to_class(v_pen, v_hasil);
      v_coba := v_coba || jsonb_build_object(v_hasil::text, 'moved');
    exception when others then
      get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
      v_coba := v_coba || jsonb_build_object(
        case v_hasil when v_4a then 'tingkat_lain' when v_coh2 then 'ke_tingkat_lain' else 'ke_tingkatnya' end,
        v_state || ':' || coalesce(v_detail, ''));
    end;
  end loop;
  -- a learner already in a Kelas of the Tingkat is moved from that Kelas, not from the Tingkat
  begin
    perform public.move_learner_to_class(v_pen_siswa, v_5c);
    v_coba := v_coba || jsonb_build_object('sudah_berkelas', 'moved');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
    v_coba := v_coba || jsonb_build_object('sudah_berkelas', v_state || ':' || coalesce(v_detail, ''));
  end;

  -- 3. the placement
  v_baru := public.move_learner_to_class(v_pen, v_5c);
  begin
    perform public.move_learner_to_class(v_pen, v_5c);
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
    v_coba := v_coba || jsonb_build_object('kedua', v_state || ':' || coalesce(v_detail, ''));
  end;

  -- 4. what the administrator's Struktur sekolah now counts in the Tingkat and in 5C
  insert into adm09_snap values ('ADMIN', jsonb_build_object(
    'tingkat_murid', (select s.active_members from public.school_structure(f.inst) s where s.node_id = v_coh),
    'kelas_murid', (select s.active_members from public.school_structure(f.inst) s where s.node_id = v_5c)));

  perform selftest.as_owner();
  insert into adm09_snap values ('AKHIR', jsonb_build_object(
    'coba', v_coba,
    'penempatan', (select jsonb_agg(jsonb_build_object('tempat', m.node_id, 'jenis', n.kind, 'tutup', m.valid_to is not null, 'alasan', m.close_reason,
                                                      'sama_detik', m.valid_to = (select valid_from from public.memberships where id = v_baru),
                                                      'enrolmen', m.enrollment_id = v_enr, 'tahun', m.academic_period_id = v_period)
                                    order by m.valid_from, m.valid_to nulls last)
                     from public.memberships m join public.org_nodes n on n.id = m.node_id
                    where m.enrollment_id in (select e.id from public.enrollments e where e.person_id = v_gita)),
    'di_bawah_tingkat', (select n.jalur @> array[v_coh] from public.org_nodes n where n.id = v_5c),
    'enrolmen', (select jsonb_agg(e.status) from public.enrollments e where e.person_id = v_gita),
    'siswa_tetap', (select string_agg(n.name, ',' order by n.name) from public.memberships m join public.enrollments e on e.id = m.enrollment_id
                     join public.org_nodes n on n.id = m.node_id where e.person_id = v_siswa and m.valid_to is null),
    'audit', (select coalesce(jsonb_agg(jsonb_build_object('aksi', a.action, 'alasan', a.summary ->> 'close_reason') order by a.at, a.action), '[]')
                from public.audit_log a where a.target_table = 'memberships' and a.target_id in (v_pen::text, v_baru::text))));
end $adm09$;
select k || chr(9) || v::text from adm09_snap order by k;
rollback;
`;

export const adm09Tests: SelfTest[] = [
  {
    id: "ADM09-S01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      for (const f of ["fable01", "fable02", "fable03", "fable04"]) {
        spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", `${f}.sql`), db], { encoding: "utf8" });
      }
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", SKRIP, db], { encoding: "utf8" });
      const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
      if (!c.expect(r.status === 0, `the placement could not run: ${pesan}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const snap: Record<string, any> = {};
      for (const l of r.stdout.split("\n")) {
        const [k, v] = l.split("\t");
        if (k && v) snap[k] = JSON.parse(v);
      }
      const { AWAL: awal, AKHIR: akhir, ADMIN: admin } = snap;
      if (!c.expect(!!awal && !!akhir && !!admin, "the database half returned no snapshot")) return c.verdict("");
      const coba = akhir.coba as Record<string, string>;

      // who may: the school's administrator, not the class's teacher
      c.expect(coba.guru === "42501:", `the class's teacher placing a Tingkat learner was answered ${coba.guru}, not refused (42501)`);
      // each refusal, named: another Tingkat's Kelas, a Tingkat as the destination, a learner already in a Kelas there, a second press
      const harap: Record<string, string> = {
        tingkat_lain: "PR070:MOVE_NOT_A_KELAS", ke_tingkat_lain: "PR070:MOVE_NOT_A_KELAS", ke_tingkatnya: "PR070:MOVE_NOT_A_KELAS",
        sudah_berkelas: "PR070:MOVE_ALREADY_IN_KELAS", kedua: "PR070:MOVE_NOT_CURRENT",
      };
      for (const [k, v] of Object.entries(harap)) c.expect(coba[k] === v, `${k}: answered ${coba[k]}, expected ${v}`);

      // the placement: the Tingkat membership closed with MOVED at the instant 5C opens; one enrolment, one year
      const p = akhir.penempatan as Array<{ tempat: string; jenis: string; tutup: boolean; alasan: string | null; sama_detik: boolean | null; enrolmen: boolean; tahun: boolean }>;
      c.expect(p.length === 2 && p[0].tempat === awal.tingkat && p[0].jenis === "COHORT" && p[0].tutup && p[0].alasan === "MOVED" && p[0].sama_detik === true
        && p[1].tempat === awal.kelas_5c && p[1].jenis === "CLASS" && !p[1].tutup && p.every((x) => x.enrolmen && x.tahun),
        `Gita's placements after «Pindahkan»: ${JSON.stringify(p)}; expected the Tingkat closed with MOVED at the instant 5C opens, one enrolment, one year`);
      c.expect(JSON.stringify(akhir.enrolmen) === JSON.stringify(["PENDING"]),
        `Gita's enrolments after the placement: ${JSON.stringify(akhir.enrolmen)}; expected her one enrolment, still waiting for her first sign-in`);
      // still under the Tingkat: the Kelas's path holds it
      c.expect(akhir.di_bawah_tingkat === true, "5C's path does not hold the Tingkat; the learner left it");
      // the bootstrap learner, refused, keeps both placements
      c.expect(akhir.siswa_tetap === "5B,Angkatan 5", `the learner already in 5B now holds ${akhir.siswa_tetap}; the refusal changed something`);
      // what the administrator's Struktur sekolah counts: the Tingkat one fewer, 5C one
      c.expect(awal.tingkat_murid === 2 && admin.tingkat_murid === 1 && admin.kelas_murid === 1,
        `Struktur sekolah counted ${awal.tingkat_murid} → ${admin.tingkat_murid} in the Tingkat and ${admin.kelas_murid} in 5C; expected 2 → 1 and 1`);
      const audit = (akhir.audit as Array<{ aksi: string; alasan: string | null }>).map((a) => `${a.aksi}:${a.alasan ?? ""}`);
      c.expect(audit.includes("membership.closed:MOVED") && audit.filter((a) => a === "membership.created:").length === 2,
        `the audit log reads ${JSON.stringify(audit)}; expected the Tingkat placement's creation and closing (MOVED), and 5C's creation`);

      return c.verdict(
        "executed in the database as the school's administrator, rolled back: move_learner_to_class places Gita, recorded " +
          "in the bootstrap Tingkat only (PENDING), into its Kelas 5C: the Tingkat membership closes with MOVED at the instant " +
          "5C opens, same enrolment and year, still PENDING; 5C's path holds the Tingkat; Struktur sekolah counts the Tingkat " +
          "2 → 1 and 5C 1; the audit log has the closing and the creation. Refused: 5B's teacher (42501); another Tingkat's " +
          "Kelas, another Tingkat and her own Tingkat as destinations (MOVE_NOT_A_KELAS); the learner already in 5B, from the " +
          "Tingkat (MOVE_ALREADY_IN_KELAS, both placements kept); a second press (MOVE_NOT_CURRENT)",
      );
    },
  },
  {
    id: "ADM09-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const { tujuanPindah, asalPindah } = await import("../src/lib/pindah-kelas");
      type Lv = "BAGIAN" | "TINGKAT" | "KELAS";
      const n = (node_id: string, level: Lv, name: string, parent_id: string | null, academic_year: string | null, active_members = 0, is_active = true) =>
        ({ node_id, level, name, parent_id, academic_year, active_members, is_active });
      const rows = [
        n("b", "BAGIAN", "Kelas Rendah", null, null),
        n("t1", "TINGKAT", "Kelas 1", "b", "2026/2027", 1),
        n("t2", "TINGKAT", "Kelas 2", "b", "2026/2027", 0),
        n("t3", "TINGKAT", "Kelas 3", "b", "2026/2027", 2, false),
        n("1b", "KELAS", "Kelas 1B", "t1", "2026/2027", 0),
        n("1a", "KELAS", "Kelas 1A", "t1", "2026/2027", 4),
        n("1c", "KELAS", "Kelas 1C", "t1", "2026/2027", 0, false),
        n("2a", "KELAS", "Kelas 2A", "t2", "2026/2027", 3),
      ];
      const dariTingkat = tujuanPindah(rows, "t1").map((x) => x.node_id);
      c.expect(JSON.stringify(dariTingkat) === JSON.stringify(["1a", "1b"]),
        `from Tingkat «Kelas 1» a learner may be placed in ${JSON.stringify(dariTingkat)}; expected its own active Kelas, by name`);
      const dariKelas = tujuanPindah(rows, "1a").map((x) => x.node_id);
      c.expect(JSON.stringify(dariKelas) === JSON.stringify(["1b", "2a"]),
        `from Kelas 1A a move may go to ${JSON.stringify(dariKelas)}; expected every other active Kelas of the year, as before`);
      c.expect(tujuanPindah(rows, "b").length === 0, "a Bagian is offered somewhere to move its learners to");
      const asal = asalPindah(rows);
      c.expect(JSON.stringify(asal.kelas.map((x) => x.node_id)) === JSON.stringify(["1b", "1a", "2a"]),
        `«Pindah kelas» starts from the Kelas ${JSON.stringify(asal.kelas.map((x) => x.node_id))}; expected every active Kelas`);
      c.expect(JSON.stringify(asal.tingkat.map((x) => x.node_id)) === JSON.stringify(["t1"]),
        `«Pindah kelas» starts from the Tingkat ${JSON.stringify(asal.tingkat.map((x) => x.node_id))}; expected only the active Tingkat holding learners not yet in a Kelas`);

      const g = await import("../src/lib/galat-kontrak");
      c.expect(g.kodeGalat({ code: "PR070", details: "MOVE_ALREADY_IN_KELAS" }) === "MOVE_ALREADY_IN_KELAS",
        `PR070 MOVE_ALREADY_IN_KELAS is answered ${g.kodeGalat({ code: "PR070", details: "MOVE_ALREADY_IN_KELAS" })}`);
      for (const locale of ["id", "en"] as const) {
        const kunci = g.kunciKode("MOVE_ALREADY_IN_KELAS");
        const kal = t(kunci, "staff", { locale });
        c.expect(kunci !== "galat.action_failed" && kal.length > 10 && kal !== kunci, `(${locale}) MOVE_ALREADY_IN_KELAS has no sentence of its own: «${kal}»`);
        c.expect(/Tingkat/.test(t("galat.move_not_a_kelas", "staff", { locale })) && /Tingkat/.test(t("config.pindah.arti", "staff", { locale })),
          `(${locale}) the section or its refusal still says only a Kelas learner is moved`);
        for (const k of ["config.pindah.grup_kelas", "config.pindah.grup_tingkat"] as const) {
          const s = t(k, "staff", { locale });
          c.expect(s.length > 3 && s !== k, `(${locale}) ${k} has no text`);
        }
      }

      const hal = buang(readFileSync(join(repoRoot, "src", "app", "konfigurasi", "page.tsx"), "utf8"));
      c.expect(/const asal = asalPindah\(/.test(hal) && /\[\.\.\.asal\.kelas, \.\.\.asal\.tingkat\]\.find\(\(k\) => k\.node_id === sp\.dari\)/.test(hal),
        "Konfigurasi does not let «Pindah kelas» start from a Tingkat holding learners");
      c.expect(/<optgroup label=\{sl\("config\.pindah\.grup_kelas"\)\}>[\s\S]{0,200}asal\.kelas\.map[\s\S]{0,400}<optgroup label=\{sl\("config\.pindah\.grup_tingkat"\)\}>[\s\S]{0,200}asal\.tingkat\.map/.test(hal),
        "the place to start from is not offered in two groups, Kelas and the Tingkat not yet in a Kelas");
      c.expect(/tujuanPindah\(struktur\.rows, kelasDari\.node_id\)/.test(hal), "the destinations are not read from the whole structure (a Tingkat's Kelas)");

      return c.verdict(
        "executes tujuanPindah (src/lib/pindah-kelas.ts): from a Tingkat only its own active Kelas, from a Kelas every other " +
          "active Kelas of the year as before, from a Bagian nothing; executes asalPindah: every active Kelas, and only the " +
          "active Tingkat holding learners not yet in a Kelas. kodeGalat (src/lib/galat-kontrak.ts) answers MOVE_ALREADY_IN_KELAS " +
          "as itself, with a sentence in id and en; the section's text and its refusal name the Tingkat. The source of " +
          "Konfigurasi offers the place to start from in two groups and reads the destinations from the whole structure",
      );
    },
  },
];
