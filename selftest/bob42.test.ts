/**
 * BOB-42 (D-067) -- AN UJI CEPAT ENDS WHEN ITS WINDOW ENDS.
 *
 * Nothing moves an assignment from OPEN to CLOSED when `closes_at` passes, and
 * `berjalan()` selected by status alone. So the Uji Cepat page drew «sedang
 * berjalan» for any OPEN ad-hoc assignment, with «0 menit» left and no way back
 * to Atur: after a class's first Uji Cepat its teacher could never launch
 * another, and «Keadaan hari ini» kept listing windows that had passed. The
 * window now decides, in the one reader (`pilihBerjalan`), with no job.
 *
 *   BOB42-S01  db: in the database, the teacher launches, a learner finishes,
 *              the teacher launches again in the same class (the second with a
 *              longer window), every read made as the teacher through RLS;
 *              then the decision itself, `pilihBerjalan`, executed over those
 *              rows at three clock times, and `keadaanHariIni` over its output
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const tanpaKomentar = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");

/**
 * The database half, in ONE transaction that is rolled back: two launches and
 * a sitting, read as the teacher. Each snapshot is one `KEY<TAB>json` line.
 */
const SKRIP = `
begin;
create temp table bob42_snap (k text, v jsonb) on commit drop;
do $b42$
declare f record; v_kelas uuid; q1 record; q2 record; v_s uuid; v_now timestamptz; v_rows jsonb; v_sesi jsonb; v_h1 text; v_h2 text;
begin
  perform selftest.as_owner();
  select * into f from selftest.boot_fixture();
  select n.id into v_kelas from public.org_nodes n where n.institution_id = f.inst and n.kind = 'CLASS' order by n.created_at, n.id limit 1;
  v_now := now();

  -- 1. the teacher launches; a learner sits it and finishes
  perform selftest.as_user('boot-guru@bootstrap.pintar.test');
  select * into q1 from public.launch_quick_assessment(v_kelas, f.modul, 3, 20);
  perform selftest.as_owner();
  perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
  v_s := public.start_learning_session(q1.assessment_assignment_id);
  perform selftest.answer_paper(v_s, true);
  perform public.finish_my_session(v_s);
  perform selftest.as_owner();
  select md5(coalesce(string_agg(x, '|' order by x), '')) into v_h1 from (
    select to_jsonb(ss)::text x from public.assessment_sessions ss where ss.assessment_assignment_id = q1.assessment_assignment_id
    union all select to_jsonb(ar)::text from public.assessment_results ar
      join public.assessment_sessions ss on ss.id = ar.session_id where ss.assessment_assignment_id = q1.assessment_assignment_id) q;

  -- what berjalan reads, as the teacher, before the second launch
  perform selftest.as_user('boot-guru@bootstrap.pintar.test');
  select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'node_id', a.node_id, 'status', a.status, 'opens_at', a.opens_at,
           'closes_at', a.closes_at, 'definition', jsonb_build_object('title', d.title, 'mode', d.mode, 'item_count', d.item_count,
           'is_ad_hoc', d.is_ad_hoc)) order by a.assigned_at), '[]') into v_rows
    from public.assessment_assignments a join public.assessment_definitions d on d.id = a.assessment_definition_id
   where a.node_id = v_kelas and a.status in ('OPEN', 'CLOSED') and d.is_ad_hoc;
  select coalesce(jsonb_agg(jsonb_build_object('assessment_assignment_id', s.assessment_assignment_id, 'person_id', s.person_id,
           'status', s.status)), '[]') into v_sesi
    from public.assessment_sessions s where s.assessment_assignment_id in (select (x ->> 'id')::uuid from jsonb_array_elements(v_rows) x);
  perform selftest.as_owner();
  insert into bob42_snap values ('AWAL', jsonb_build_object('rows', v_rows, 'sesi', v_sesi, 'now', v_now, 'q1', q1.assessment_assignment_id));

  -- 2. the teacher launches a second Uji Cepat in the same class, with a longer window
  perform selftest.as_user('boot-guru@bootstrap.pintar.test');
  select * into q2 from public.launch_quick_assessment(v_kelas, f.modul, 3, 40);
  select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'node_id', a.node_id, 'status', a.status, 'opens_at', a.opens_at,
           'closes_at', a.closes_at, 'definition', jsonb_build_object('title', d.title, 'mode', d.mode, 'item_count', d.item_count,
           'is_ad_hoc', d.is_ad_hoc)) order by a.assigned_at), '[]') into v_rows
    from public.assessment_assignments a join public.assessment_definitions d on d.id = a.assessment_definition_id
   where a.node_id = v_kelas and a.status in ('OPEN', 'CLOSED') and d.is_ad_hoc;
  select coalesce(jsonb_agg(jsonb_build_object('assessment_assignment_id', s.assessment_assignment_id, 'person_id', s.person_id,
           'status', s.status)), '[]') into v_sesi
    from public.assessment_sessions s where s.assessment_assignment_id in (select (x ->> 'id')::uuid from jsonb_array_elements(v_rows) x);
  perform selftest.as_owner();
  select md5(coalesce(string_agg(x, '|' order by x), '')) into v_h2 from (
    select to_jsonb(ss)::text x from public.assessment_sessions ss where ss.assessment_assignment_id = q1.assessment_assignment_id
    union all select to_jsonb(ar)::text from public.assessment_results ar
      join public.assessment_sessions ss on ss.id = ar.session_id where ss.assessment_assignment_id = q1.assessment_assignment_id) q;
  insert into bob42_snap values ('LAGI', jsonb_build_object('rows', v_rows, 'sesi', v_sesi, 'q2', q2.assessment_assignment_id,
    'hash_sebelum', v_h1, 'hash_sesudah', v_h2,
    'hasil_pertama', (select count(*) from public.assessment_results ar join public.assessment_sessions ss on ss.id = ar.session_id
                      where ss.assessment_assignment_id = q1.assessment_assignment_id)));
end $b42$;
select k || chr(9) || v::text from bob42_snap order by k;
rollback;
`;

type Kontrak = typeof import("../src/lib/pengajar");

export const bob42Tests: SelfTest[] = [
  {
    id: "BOB42-S01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      let mod: Kontrak | null = null;
      try { mod = await import("../src/lib/pengajar"); } catch { mod = null; }
      const pilihMungkin = (mod as unknown as { pilihBerjalan?: Kontrak["pilihBerjalan"] })?.pilihBerjalan;
      const { keadaanHariIni } = await import("../src/components/bukti/KeadaanHariIni");

      // the database half
      const db = process.env.SUPABASE_DB_URL!;
      for (const f of ["fable01", "fable02", "fable03", "fable04"]) {
        spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", `${f}.sql`), db], { encoding: "utf8" });
      }
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", SKRIP, db], { encoding: "utf8" });
      if (!c.expect(r.status === 0, `the launches could not run: ${(r.stderr || "").trim().split("\n").pop()}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the snapshots are the database's own JSON
      const snap: Record<string, any> = {};
      for (const l of r.stdout.split("\n")) {
        const [k, v] = l.split("\t");
        if (k && v) snap[k] = JSON.parse(v);
      }
      const awal = snap.AWAL, lagi = snap.LAGI;
      if (!c.expect(!!awal && !!lagi, "the database half returned no snapshot")) return c.verdict("");
      // only this test's two launches: another suite may have left an Uji Cepat of its own in the class
      const milik = (x: { id: string }) => x.id === awal.q1 || x.id === lagi.q2;
      const sesiMilik = (x: { assessment_assignment_id: string }) => x.assessment_assignment_id === awal.q1 || x.assessment_assignment_id === lagi.q2;
      awal.rows = awal.rows.filter(milik); awal.sesi = awal.sesi.filter(sesiMilik);
      lagi.rows = lagi.rows.filter(milik); lagi.sesi = lagi.sesi.filter(sesiMilik);
      const pertama = awal.rows.find((x: { id: string }) => x.id === awal.q1);
      c.expect(!!lagi.q2, "a second Uji Cepat could not be launched in the same class");
      c.expect(lagi.hash_sebelum === lagi.hash_sesudah && lagi.hasil_pertama >= 1,
        `the first Uji Cepat's sessions and results changed, or it had none, across the second launch (${lagi.hasil_pertama} result(s))`);

      if (!c.expect(typeof pilihMungkin === "function",
        "berjalan decides by status alone: src/lib/pengajar.ts has no pilihBerjalan, so an OPEN Uji Cepat whose window has passed is «sedang berjalan» for ever")) {
        return c.verdict("");
      }
      const pilih = pilihMungkin!;
      const t0 = Date.parse(awal.now);
      const setelah = Date.parse(pertama.closes_at) + 60_000;          // a minute after the first window
      const hidupDari = (x: ReturnType<Kontrak["pilihBerjalan"]>) => x.find((b) => b.adHoc) ?? null;   // the page's own choice

      // launch -> active: while its window is open it is running, with its counts
      const saatBuka = pilih(awal.rows, awal.sesi, ["OPEN"], t0 + 60_000);
      const h0 = hidupDari(saatBuka);
      c.expect(h0?.id === awal.q1 && h0?.keadaan === "OPEN" && (h0?.sisaMenit ?? 0) > 0 && h0?.mengumpulkan === 1,
        `while its window is open the Uji Cepat is not the running one: ${JSON.stringify(h0)}`);
      // expiry -> no longer active: the page has nothing running, so it draws Atur (the launch form)
      const saatHabis = pilih(awal.rows, awal.sesi, ["OPEN"], setelah);
      c.expect(hidupDari(saatHabis) === null,
        `a minute after its window the Uji Cepat is still «sedang berjalan»: ${JSON.stringify(hidupDari(saatHabis))}`);
      // a second launch: it, and only it, is running; the first stays closed with its hand-in intact
      const kedua = pilih(lagi.rows, lagi.sesi, ["OPEN"], setelah);
      c.expect(hidupDari(kedua)?.id === lagi.q2 && kedua.every((b) => b.id !== awal.q1),
        `after the second launch the running one is ${JSON.stringify(hidupDari(kedua)?.id)}, expected the second, alone`);
      const riwayat = pilih(lagi.rows, lagi.sesi, ["OPEN", "CLOSED"], setelah);
      const lama = riwayat.find((b) => b.id === awal.q1);
      c.expect(lama?.keadaan === "CLOSED" && lama.mengumpulkan === 1 && lama.mulai === 1,
        `the first Uji Cepat is not kept as a closed one with its hand-in: ${JSON.stringify(lama)}`);
      // «Keadaan hari ini»: a passed window is not presented as open
      const hariIni = keadaanHariIni(riwayat);
      c.expect(hariIni.length === 1 && hariIni[0].id === lagi.q2, `«Keadaan hari ini» presents ${JSON.stringify(hariIni.map((x) => [x.judul, x.keadaan]))}`);
      const hariIniLama = keadaanHariIni(pilih(awal.rows, awal.sesi, ["OPEN", "CLOSED"], setelah));
      c.expect(hariIniLama.length === 1 && hariIniLama[0].id === awal.q1 && hariIniLama[0].keadaan === "CLOSED",
        `with only the passed window, «Keadaan hari ini» presents ${JSON.stringify(hariIniLama.map((x) => [x.judul, x.keadaan]))}, not the one that closed`);
      // the boundary: the minute it closes, it is closed; a window with no end stays open
      c.expect(mod!.keadaanEfektif("OPEN", pertama.closes_at, Date.parse(pertama.closes_at)) === "CLOSED"
        && mod!.keadaanEfektif("OPEN", pertama.closes_at, Date.parse(pertama.closes_at) - 1) === "OPEN"
        && mod!.keadaanEfektif("OPEN", null, setelah) === "OPEN" && mod!.keadaanEfektif("CLOSED", null, t0) === "CLOSED",
        "keadaanEfektif does not close a window exactly when it ends, or closes one that never ends");

      // the readers use it: berjalan chooses through pilihBerjalan with the real clock, and reads OPEN rows for CLOSED
      const src = tanpaKomentar(readFileSync(join(repoRoot, "src", "lib", "pengajar.ts"), "utf8"));
      const badan = src.slice(src.indexOf("export async function berjalan("), src.indexOf("export async function siapa("));
      c.expect(/return pilihBerjalan\(buka, rows<BarisSesiAsesmen>\(sesi\), keadaan, Date\.now\(\)(?:, anggota)?\)/.test(badan)
        && /keadaan\.includes\("CLOSED"\) \? \[\.\.\.new Set\(\[\.\.\.keadaan, "OPEN"\]\)\] : keadaan/.test(badan),
        "berjalan does not choose through pilihBerjalan with the real clock, or does not read OPEN rows when CLOSED is asked for");
      const halaman = tanpaKomentar(readFileSync(join(repoRoot, "src", "app", "mengajar", "[kelas]", "uji-cepat", "page.tsx"), "utf8"));
      c.expect(/ajar\.berjalan\(\[id\]\)/.test(halaman) && /const hidup = buka\.find\(\(b\) => b\.adHoc\) \?\? null;/.test(halaman),
        "the Uji Cepat page no longer takes its running Uji Cepat from berjalan's open windows");
      return c.verdict("launched by the teacher and finished by a learner, the Uji Cepat is running while its window is open (its hand-in "
        + "counted); a minute after the window nothing is running, so the page draws Atur; a second launch in the same class succeeds and "
        + "is the only one running, while the first is kept as closed with its hand-in, its sessions and results unchanged; «Keadaan hari "
        + "ini» presents only the open one, and the one that closed when none is open; the window closes exactly at closes_at and a window "
        + "with no end stays open; berjalan chooses through it with the real clock and the page reads it");
    },
  },
];
