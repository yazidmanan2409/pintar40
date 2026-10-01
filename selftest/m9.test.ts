/**
 * M9 (D-085; J3.12, ADM-J13) -- A STUDENT MOVES CLASS. THEIR HISTORY DOES NOT.
 *
 * A school administrator could not move a learner already recorded: re-intake
 * is refused, the rollover moves whole classes into the next year, and a
 * transfer is to another school. `move_learner_to_class`
 * (supabase/migrations/20261027100000) closes the learner's Kelas membership
 * with MOVED and opens one in another Kelas of the same school and year, in one
 * transaction, as the caller.
 *
 *   M9-S01  db: in one rolled-back transaction, the bootstrap learner sits a
 *           post-test in 5B; 5B's teacher is refused; the school's
 *           administrator meets each refusal, then moves the learner to 5C;
 *           the snapshots are read here
 *   M9-K01  static: the page's halves -- who «Lihat bukti» counts after a
 *           move (pilihBerjalan with the roster), where a move may go
 *           (tujuanPindah), the refusals' codes and sentences, and the
 *           Konfigurasi section and action that call the move
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
create temp table m9_snap (k text, v jsonb) on commit drop;
grant all on m9_snap to authenticated;
do $m9$
declare f record; v_period uuid; v_coh uuid; v_5b uuid; v_5c uuid; v_5d uuid; v_lain uuid; v_luar uuid;
        v_p2 uuid; v_tahun_lain uuid; v_enr uuid; v_pen uuid; v_baru uuid; v_sesi uuid; v_siswa uuid;
        v_state text; v_detail text; v_coba jsonb := '{}'::jsonb; v_hasil uuid;
begin
  perform selftest.as_owner();
  select * into f from selftest.boot_fixture();
  select p.id into v_siswa from public.persons p join public.accounts a on a.person_id = p.id
    join auth.users u on u.id = a.auth_user_id where u.email = 'boot-siswa@bootstrap.pintar.test';
  select n.id, n.academic_period_id, n.parent_id into v_5b, v_period, v_coh
    from public.org_nodes n join public.memberships m on m.node_id = n.id join public.enrollments e on e.id = m.enrollment_id
   where e.person_id = v_siswa and n.kind = 'CLASS' and m.valid_to is null and n.institution_id = f.inst limit 1;
  select m.id, m.enrollment_id into v_pen, v_enr from public.memberships m
   where m.node_id = v_5b and m.valid_to is null
     and m.enrollment_id in (select e.id from public.enrollments e where e.person_id = v_siswa);

  -- the learner sits a post-test in 5B: their session records 5B
  v_sesi := selftest.boot_attempt(true);

  -- the destinations: 5C (same Tingkat, same year), 5D (deactivated), a Kelas of next year, another school's Kelas
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (f.inst, v_coh, 'CLASS', '5C', v_period) returning id into v_5c;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (f.inst, v_coh, 'CLASS', '5D', v_period) returning id into v_5d;
  update public.org_nodes set is_active = false where id = v_5d;
  insert into public.academic_periods (institution_id, name, starts_on, ends_on)
  values (f.inst, '2027/28', date '2027-07-01', date '2028-06-30') returning id into v_p2;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (f.inst, (select parent_id from public.org_nodes where id = v_coh), 'COHORT', 'Angkatan 6', v_p2) returning id into v_lain;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (f.inst, v_lain, 'CLASS', '6A', v_p2) returning id into v_tahun_lain;
  select n.id into v_luar from public.org_nodes n where n.kind = 'CLASS' and n.institution_id <> f.inst and n.is_active limit 1;

  insert into m9_snap values ('AWAL', jsonb_build_object(
    'sesi_kelas', (select s.class_node_id from public.assessment_sessions s where s.id = v_sesi),
    'kelas_5b', v_5b, 'kelas_5c', v_5c, 'orang', (select count(*) from public.persons p where p.display_name = (select display_name from public.persons where id = v_siswa)),
    'enrolmen', (select count(*) from public.enrollments e where e.person_id = v_siswa)));

  -- 1. the class's teacher may not move a learner
  perform selftest.as_user('boot-guru@bootstrap.pintar.test');
  begin
    perform public.move_learner_to_class(v_pen, v_5c);
    v_coba := v_coba || jsonb_build_object('guru', 'moved');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
    v_coba := v_coba || jsonb_build_object('guru', v_state || ':' || coalesce(v_detail, ''));
  end;

  -- 2. the school's administrator: refusals first, each with its own answer
  perform selftest.as_user('boot-admin@bootstrap.pintar.test');
  foreach v_hasil in array array[v_5b, v_coh, v_5d, v_tahun_lain, coalesce(v_luar, gen_random_uuid())] loop
    begin
      perform public.move_learner_to_class(v_pen, v_hasil);
      v_coba := v_coba || jsonb_build_object(v_hasil::text, 'moved');
    exception when others then
      get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
      v_coba := v_coba || jsonb_build_object(
        case v_hasil when v_5b then 'sama' when v_coh then 'tingkat' when v_5d then 'nonaktif'
                     when v_tahun_lain then 'tahun_lain' else 'sekolah_lain' end,
        v_state || ':' || coalesce(v_detail, ''));
    end;
  end loop;
  -- an id that is not a placement
  begin
    perform public.move_learner_to_class(gen_random_uuid(), v_5c);
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
    v_coba := v_coba || jsonb_build_object('tak_dikenal', v_state || ':' || coalesce(v_detail, ''));
  end;

  -- 3. the move
  v_baru := public.move_learner_to_class(v_pen, v_5c);
  -- a second press on the same (now ended) placement
  begin
    perform public.move_learner_to_class(v_pen, v_5c);
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
    v_coba := v_coba || jsonb_build_object('kedua', v_state || ':' || coalesce(v_detail, ''));
  end;
  -- and moving the new placement to where it already is
  begin
    perform public.move_learner_to_class(v_baru, v_5c);
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
    v_coba := v_coba || jsonb_build_object('sudah_di_sana', v_state || ':' || coalesce(v_detail, ''));
  end;

  -- 4. what the teacher of 5B now reads: the roster without the learner
  perform selftest.as_user('boot-guru@bootstrap.pintar.test');
  insert into m9_snap values ('GURU', jsonb_build_object(
    'roster_5b', (select coalesce(jsonb_agg(e.person_id), '[]') from public.memberships m join public.enrollments e on e.id = m.enrollment_id
                   where m.node_id = v_5b and m.valid_to is null)));

  perform selftest.as_owner();
  insert into m9_snap values ('AKHIR', jsonb_build_object(
    'coba', v_coba,
    'baru', v_baru,
    'penempatan', (select jsonb_agg(jsonb_build_object('kelas', m.node_id, 'tutup', m.valid_to is not null, 'alasan', m.close_reason,
                                                      'sama_detik', m.valid_to = (select valid_from from public.memberships where id = v_baru),
                                                      'enrolmen', m.enrollment_id = v_enr, 'tahun', m.academic_period_id = v_period)
                                    order by m.valid_from, m.valid_to nulls last)
                     from public.memberships m join public.org_nodes n on n.id = m.node_id
                    where m.enrollment_id = v_enr and n.kind = 'CLASS'),
    'sesi_kelas', (select s.class_node_id from public.assessment_sessions s where s.id = v_sesi),
    'orang', (select count(*) from public.persons p where p.display_name = (select display_name from public.persons where id = v_siswa)),
    'enrolmen', (select count(*) from public.enrollments e where e.person_id = v_siswa),
    'audit', (select coalesce(jsonb_agg(jsonb_build_object('aksi', a.action, 'alasan', a.summary ->> 'close_reason') order by a.at, a.action), '[]')
                from public.audit_log a where a.target_table = 'memberships' and a.target_id in (v_pen::text, v_baru::text)),
    'siswa', v_siswa));
end $m9$;
select k || chr(9) || v::text from m9_snap order by k;
rollback;
`;

export const m9Tests: SelfTest[] = [
  {
    id: "M9-S01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      for (const f of ["fable01", "fable02", "fable03", "fable04"]) {
        spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", `${f}.sql`), db], { encoding: "utf8" });
      }
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", SKRIP, db], { encoding: "utf8" });
      const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
      if (!c.expect(r.status === 0, `the move could not run: ${pesan}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const snap: Record<string, any> = {};
      for (const l of r.stdout.split("\n")) {
        const [k, v] = l.split("\t");
        if (k && v) snap[k] = JSON.parse(v);
      }
      const { AWAL: awal, AKHIR: akhir, GURU: guru } = snap;
      if (!c.expect(!!awal && !!akhir && !!guru, "the database half returned no snapshot")) return c.verdict("");
      const coba = akhir.coba as Record<string, string>;

      // who may: the school's administrator, not the class's teacher; nothing elsewhere answers differently
      c.expect(coba.guru === "42501:", `the class's teacher moving a learner was answered ${coba.guru}, not refused (42501)`);
      c.expect(coba.sekolah_lain === "42501:" && coba.tak_dikenal === "42501:",
        `another school's Kelas and an unknown placement were answered ${coba.sekolah_lain} and ${coba.tak_dikenal}, not alike (42501)`);
      // each other refusal, named
      const harap: Record<string, string> = {
        sama: "PR070:MOVE_SAME_KELAS", tingkat: "PR070:MOVE_NOT_A_KELAS", tahun_lain: "PR070:MOVE_OTHER_YEAR",
        nonaktif: "PR020:STRUCTURE_PLACE_INACTIVE", kedua: "PR070:MOVE_NOT_CURRENT", sudah_di_sana: "PR070:MOVE_SAME_KELAS",
      };
      for (const [k, v] of Object.entries(harap)) c.expect(coba[k] === v, `${k}: answered ${coba[k]}, expected ${v}`);

      // the move: one placement closed with MOVED, one opened, the same instant, enrolment and year
      const p = akhir.penempatan as Array<{ kelas: string; tutup: boolean; alasan: string | null; sama_detik: boolean | null; enrolmen: boolean; tahun: boolean }>;
      c.expect(p.length === 2 && p[0].kelas === awal.kelas_5b && p[0].tutup && p[0].alasan === "MOVED" && p[0].sama_detik === true
        && p[1].kelas === awal.kelas_5c && !p[1].tutup && p.every((x) => x.enrolmen && x.tahun),
        `the learner's Kelas placements after the move: ${JSON.stringify(p)}; expected 5B closed with MOVED at the instant 5C opens, one enrolment, one year`);
      // the same person: no duplicate, no second enrolment
      c.expect(akhir.orang === awal.orang && akhir.orang === 1 && akhir.enrolmen === awal.enrolmen,
        `persons ${awal.orang} → ${akhir.orang}, enrolments ${awal.enrolmen} → ${akhir.enrolmen}: the move made a second student`);
      // history keeps its context
      c.expect(awal.sesi_kelas === awal.kelas_5b && akhir.sesi_kelas === awal.kelas_5b,
        `the post-test sat in 5B now records ${akhir.sesi_kelas}; history was rewritten`);
      // the old class no longer has them, as its teacher reads it
      c.expect(Array.isArray(guru.roster_5b) && !guru.roster_5b.includes(akhir.siswa),
        `5B's teacher still reads the learner on 5B's roster: ${JSON.stringify(guru.roster_5b)}`);
      // the audit trail says what happened
      const audit = (akhir.audit as Array<{ aksi: string; alasan: string | null }>).map((a) => `${a.aksi}:${a.alasan ?? ""}`);
      c.expect(audit.includes("membership.closed:MOVED") && audit.filter((a) => a === "membership.created:").length === 2,
        `the audit log reads ${JSON.stringify(audit)}; expected the placement's closing with MOVED and the new one's creation`);

      return c.verdict(
        "executed in the database as the school's administrator, rolled back: move_learner_to_class closes the bootstrap " +
          "learner's 5B membership with MOVED and opens 5C at the same instant, for the same enrolment and year; one person " +
          "and one enrolment before and after; the post-test sat in 5B still records 5B; 5B's teacher no longer reads the " +
          "learner on its roster; the audit log has the closing (MOVED) and the creation. Refused: 5B's teacher, another " +
          "school's Kelas and an unknown placement alike (42501); the same Kelas, a Tingkat, another year's Kelas, a " +
          "deactivated Kelas and a second press each with its own code",
      );
    },
  },
  {
    id: "M9-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const ajar = (await import("../src/lib/pengajar")) as Record<string, unknown> as {
        pilihBerjalan: (b: unknown[], s: unknown[], k: string[], now: number, anggota?: Map<string, Set<string>>) => Array<{ id: string; mengumpulkan: number; mulai: number }>;
      };
      const baris = [{ id: "a1", node_id: "k1", status: "OPEN", opens_at: null, closes_at: null, definition: { title: "Cek", mode: "POST_TEST", item_count: 8, is_ad_hoc: false } }];
      const sesi = [
        { assessment_assignment_id: "a1", person_id: "ani", status: "SUBMITTED" },
        { assessment_assignment_id: "a1", person_id: "budi", status: "SUBMITTED" },   // handed in, then moved to 1B
        { assessment_assignment_id: "a1", person_id: "citra", status: "IN_PROGRESS" },
      ];
      const kini = new Map([["k1", new Set(["ani", "citra", "dodi"])]]);
      const tanpa = ajar.pilihBerjalan(baris, sesi, ["OPEN"], Date.now())[0];
      const dengan = ajar.pilihBerjalan(baris, sesi, ["OPEN"], Date.now(), kini)[0];
      c.expect(tanpa?.mengumpulkan === 2 && tanpa?.mulai === 3, `without a roster every session counts: ${JSON.stringify(tanpa)}`);
      c.expect(dengan?.mengumpulkan === 1 && dengan?.mulai === 2,
        `with Kelas 1A's roster now (Ani, Citra, Dodi), Budi who moved away is still counted: ${JSON.stringify(dengan)}; expected 1 handed in, 2 started`);
      const lib = buang(readFileSync(join(repoRoot, "src", "lib", "pengajar.ts"), "utf8"));
      const badan = lib.slice(lib.indexOf("export async function berjalan("), lib.indexOf("export function pisahSiapa("));
      c.expect(/from\("memberships"\)[\s\S]{0,200}\.is\("valid_to", null\)/.test(badan) && /Date\.now\(\), anggota\)/.test(badan),
        "berjalan does not hand pilihBerjalan the classes' rosters now");

      const { tujuanPindah, namaKelas } = await import("../src/lib/pindah-kelas");
      const k = (node_id: string, name: string, academic_year: string, is_active = true) =>
        ({ node_id, name, academic_year, is_active, level: "KELAS" as const, parent_id: "t", active_members: 0 });
      const kelas = [k("1a", "Kelas 1A", "2026/2027"), k("1b", "Kelas 1B", "2026/2027"), k("1c", "Kelas 1C", "2026/2027", false),
        k("2a", "Kelas 2A", "2027/2028"), k("1d", "Kelas 1D", "2026/2027")];
      const ke = tujuanPindah(kelas, "1a").map((x) => x.node_id);
      c.expect(JSON.stringify(ke) === JSON.stringify(["1b", "1d"]),
        `from Kelas 1A a move may go to ${JSON.stringify(ke)}; expected the other active Kelas of the same year, by name`);
      c.expect(tujuanPindah(kelas, "x").length === 0, "a Kelas that is not on offer has somewhere to move to");
      c.expect(namaKelas(kelas[0]) === "Kelas 1A (2026/2027)", `a Kelas is named «${namaKelas(kelas[0])}»`);

      const g = await import("../src/lib/galat-kontrak");
      for (const kode of ["MOVE_NOT_CURRENT", "MOVE_NOT_A_KELAS", "MOVE_SAME_KELAS", "MOVE_OTHER_YEAR"]) {
        c.expect(g.kodeGalat({ code: "PR070", details: kode }) === kode, `PR070 ${kode} is answered ${g.kodeGalat({ code: "PR070", details: kode })}`);
      }
      c.expect(g.kodeGalat({ code: "PR070", details: "SOMETHING_ELSE" }) === "ACTION_FAILED", "an unnamed PR070 is not ACTION_FAILED");
      c.expect(g.kodeGalat({ code: "42501" }) === "ACTION_NOT_ALLOWED" && g.kodeGalat({ code: "PR020", details: "STRUCTURE_PLACE_INACTIVE" }) === "ACTION_PLACE_INACTIVE",
        "a refused caller or a deactivated Kelas is not answered as every action answers it");
      for (const locale of ["id", "en"] as const) {
        for (const kode of ["MOVE_NOT_CURRENT", "MOVE_NOT_A_KELAS", "MOVE_SAME_KELAS", "MOVE_OTHER_YEAR", "MOVE_INPUT_INCOMPLETE", "LEARNER_MOVED"]) {
          const kunci = g.kunciKode(kode);
          const kal = t(kunci, "staff", { locale });
          c.expect(kunci !== "galat.action_failed" && kal.length > 10 && kal !== kunci, `(${locale}) ${kode} has no sentence of its own: «${kal}»`);
        }
        c.expect(/kelas/i.test(t("galat.learner_moved", "staff", { locale })) || /class/i.test(t("galat.learner_moved", "staff", { locale })),
          `(${locale}) the success does not say the work stays with the old class`);
      }

      const aksi = buang(readFileSync(join(repoRoot, "src", "app", "konfigurasi", "actions.ts"), "utf8"));
      c.expect(/export async function pindahKelasAction[\s\S]{0,900}rpc\("move_learner_to_class", \{ p_membership: penempatan, p_kelas: kelas \}\)/.test(aksi),
        "no Konfigurasi action calls move_learner_to_class with the placement and the destination");
      const hal = buang(readFileSync(join(repoRoot, "src", "app", "konfigurasi", "page.tsx"), "utf8"));
      c.expect(/<section id="pindah"/.test(hal) && /\["pindah", s\("config\.section\.pindah"\)\]/.test(hal),
        "Konfigurasi has no «Pindah kelas» section in its menu");
      c.expect(/<form action=\{pindahKelasAction\}[\s\S]{0,500}name="penempatan" value=\{m\.penempatan\}[\s\S]{0,800}tujuan\.map/.test(hal),
        "the section does not offer each student of the chosen Kelas a move to the Kelas tujuanPindah gives");
      c.expect(/await muridDiKelas\(supabase, kelasDari\.node_id\)/.test(hal), "the section does not list the chosen Kelas's students under the reader's own access");

      return c.verdict(
        "executes pilihBerjalan (src/lib/pengajar.ts): with a class's roster now, a learner who handed in and then moved " +
          "away is not counted against the class they left (1 of 3, not 2), and without one every session counts; " +
          "berjalan's source reads the open memberships and hands them over. tujuanPindah (src/lib/pindah-kelas.ts) " +
          "offers only the other active Kelas of the same year. kodeGalat answers PR070's four codes as themselves and " +
          "anything else as ACTION_FAILED; each code, the incomplete form and the success have a sentence in id and en. " +
          "The source of Konfigurasi lists the chosen Kelas's students and gives each a move through pindahKelasAction, " +
          "which calls move_learner_to_class",
      );
    },
  },
];
