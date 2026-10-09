/**
 * «LAPORKAN MASALAH» (BOB-15 + DAISY-12; D-037 step 2; D-100(d) item 2; D-101(f)) — a member of staff reports a
 * problem from the page it happened on; it is received at once, and its status and next step are theirs to follow.
 *
 *  K01  the contract, run: PR100's codes read by DETAIL only, each with its sentence; the page and reference kept to
 *       their shape; a report only moves forward; a screenshot named by a fresh id and its kind; every new sentence
 *       in both languages, none promising more than PINTAR does.
 *  S01  the source: one database call to send and one to move; the form attaches the page, the reference and the
 *       device and asks three questions; a student is told to tell their teacher; «Laporan saya» and the triage list
 *       read under row security; the link sits on every staff shell; the screenshot's folder is the server's choice.
 *  D01  migration 20261119100000 against the database, rolled back: who may send, what is attached, who reads, who
 *       moves and how, and the audit.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, LOCALES, type HleEvent } from "../src/lib/hle";
import {
  alamatLapor, halamanLaporan, KODE_LAPORAN_DB, kodeGalatLaporan, kunciKodeLaporan, kunciStatusLaporan, langkahBerikut,
  namaTangkapan, rujukanLaporan, STATUS_LAPORAN,
} from "../src/lib/lapor-masalah-kontrak";

const DB_SKRIP = `
begin;
create function pg_temp.kode(p_sql text) returns text language plpgsql as $f$
declare v_state text; v_detail text;
begin
  execute p_sql; return 'OK';
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
  return v_state || coalesce(':' || nullif(v_detail, ''), '');
end $f$;
create function pg_temp.lihat(p_uid uuid, p_id uuid) returns int language plpgsql as $f$
declare n int;
begin
  perform selftest.as_user_uid(p_uid);
  execute 'select count(*) from public.support_reports where id = $1' into n using p_id;
  perform selftest.as_owner();
  return n;
exception when others then perform selftest.as_owner(); return -1;
end $f$;
do $b15$
declare v jsonb := '{}'::jsonb; c record; j jsonb; lap uuid; lap2 uuid; lain_u uuid; lain uuid; sys_u uuid; sys uuid;
        adm2_u uuid; adm2 uuid; inst2 uuid; v_dulu bigint; t text; r public.support_reports; g1 boolean; g2 boolean; g3 boolean;
begin
  perform selftest.as_owner();
  v := v || jsonb_build_object('ada', to_regprocedure('public.submit_support_report(text,text,text,text,text,boolean,text,text)') is not null);
  select * into c from selftest.wp2_school();
  lain_u := selftest.f06p10_person('b15-guru-lain'); sys_u := selftest.f06p10_person('b15-sysadmin');
  adm2_u := selftest.f06p10_person('b15-admin-lain');
  select a.person_id into lain from public.accounts a where a.auth_user_id = lain_u;
  select a.person_id into sys from public.accounts a where a.auth_user_id = sys_u;
  select a.person_id into adm2 from public.accounts a where a.auth_user_id = adm2_u;
  select i.id into inst2 from public.institutions i where i.id <> c.inst and i.tenant_kind = 'INSTITUTION' order by i.name limit 1;
  perform set_config('app.seed_intent', 'synthetic', true);
  insert into public.role_assignments (person_id, role, scope_node_id, valid_until) values
    (lain, 'EDUCATOR', c.cls_b, now() + interval '1 year'),
    (sys, 'SYSTEM_ADMIN', c.root, now() + interval '1 year'),
    (adm2, 'INSTITUTION_ADMIN', inst2, now() + interval '1 year');
  perform set_config('app.seed_intent', '', true);
  select coalesce(max(id), 0) into v_dulu from public.audit_log;

  -- (1) the Guru sends one from their class page; PINTAR attaches the role, the school and the request's build
  perform selftest.as_user_uid(c.edu_u);
  perform set_config('request.headers', '{"x-pintar-build":"abc1234def"}', true);
  begin
    j := public.submit_support_report('/mengajar/' || c.cls_a, 'AB12CD', 'Membuka Lihat bukti', 'Melihat angka kelas',
                                      'Halaman berhenti memuat', true, 'Mozilla/5.0 (uji)', null);
    lap := (j ->> 'report')::uuid;
    v := v || jsonb_build_object('kirim', j ->> 'status');
  exception when others then v := v || jsonb_build_object('kirim', sqlstate || ':' || sqlerrm);
  end;
  v := v || jsonb_build_object(
    'murid', null,
    'kosong', pg_temp.kode('select public.submit_support_report(''/mengajar'', null, '''', ''b'', ''c'', false, null, null)'),
    'halaman_asing', pg_temp.kode('select public.submit_support_report(''https://contoh.test'', null, ''a'', ''b'', ''c'', false, null, null)'),
    'tangkapan_orang_lain', pg_temp.kode(format('select public.submit_support_report(''/mengajar'', null, ''a'', ''b'', ''c'', false, null, %L)',
      'laporan/' || c.la || '/' || gen_random_uuid() || '.png')),
    'tulis_langsung', pg_temp.kode(format('insert into public.support_reports (reporter_person_id, reporter_role, page, did, expected, happened) values (%L, ''EDUCATOR'', ''/'', ''a'', ''b'', ''c'')', c.edu)));
  perform selftest.as_owner();
  perform set_config('request.headers', '', true);
  -- a student is told to tell their teacher
  perform selftest.as_user_uid(c.la_u);
  v := v || jsonb_build_object('murid', pg_temp.kode('select public.submit_support_report(''/belajar'', null, ''a'', ''b'', ''c'', false, null, null)'));
  perform selftest.as_owner();
  select * into r from public.support_reports where id = lap;
  v := v || jsonb_build_object('lampiran', jsonb_build_object('peran', r.reporter_role, 'sekolah', r.institution_id = c.inst,
    'build', r.build_sha, 'perangkat', r.device, 'rujukan', r.error_ref, 'kelas', r.stops_class, 'status', r.status));

  -- (2) who reads it
  v := v || jsonb_build_object('baca', jsonb_build_object(
    'pelapor', pg_temp.lihat(c.edu_u, lap), 'guru_lain', pg_temp.lihat(lain_u, lap), 'admin', pg_temp.lihat(c.adm_u, lap),
    'admin_lain', pg_temp.lihat(adm2_u, lap), 'platform', pg_temp.lihat(sys_u, lap), 'murid', pg_temp.lihat(c.la_u, lap),
    'kaprodi', pg_temp.lihat(c.hod_u, lap)));

  -- (3) who moves it, and how: forward only, always with the next step
  perform selftest.as_user_uid(c.edu_u);
  v := v || jsonb_build_object('pindah_pelapor', pg_temp.kode(format('select public.move_support_report(%L, ''DITANGANI'', ''x'')', lap)),
    'ubah_langsung', pg_temp.kode(format('update public.support_reports set status = ''SELESAI'' where id = %L', lap)));
  perform selftest.as_user_uid(adm2_u);
  v := v || jsonb_build_object('pindah_admin_lain', pg_temp.kode(format('select public.move_support_report(%L, ''DITANGANI'', ''x'')', lap)));
  perform selftest.as_user_uid(c.adm_u);
  v := v || jsonb_build_object(
    'tanpa_langkah', pg_temp.kode(format('select public.move_support_report(%L, ''DITANGANI'', ''  '')', lap)),
    'status_asing', pg_temp.kode(format('select public.move_support_report(%L, ''DITERIMA'', ''x'')', lap)),
    'ditangani', pg_temp.kode(format('select public.move_support_report(%L, ''DITANGANI'', ''Kami periksa halaman Lihat bukti hari ini.'')', lap)),
    'ditangani_lagi', pg_temp.kode(format('select public.move_support_report(%L, ''DITANGANI'', ''x'')', lap)),
    'selesai', pg_temp.kode(format('select public.move_support_report(%L, ''SELESAI'', ''Sudah diperbaiki; muat ulang halaman.'')', lap)),
    'setelah_selesai', pg_temp.kode(format('select public.move_support_report(%L, ''SELESAI'', ''x'')', lap)));
  perform selftest.as_owner();
  select * into r from public.support_reports where id = lap;
  v := v || jsonb_build_object('akhir', r.status, 'langkah', r.next_step, 'penangan', r.handled_by_person_id = c.adm);
  -- Admin platform moves any school's report
  perform selftest.as_user_uid(lain_u);
  j := public.submit_support_report('/mengajar', null, 'a', 'b', 'c', false, null, null);
  lap2 := (j ->> 'report')::uuid;
  perform selftest.as_user_uid(sys_u);
  v := v || jsonb_build_object('platform_pindah', pg_temp.kode(format('select public.move_support_report(%L, ''SELESAI'', ''Ditangani tim PINTAR.'')', lap2)));
  perform selftest.as_owner();

  -- (4) the screenshot: read by whoever reads its report, written only in the reporter's own folder
  perform selftest.as_user_uid(c.edu_u);
  t := 'laporan/' || c.edu || '/' || gen_random_uuid() || '.png';
  j := public.submit_support_report('/mengajar', null, 'a', 'b', 'c', false, null, t);
  perform selftest.as_owner();
  perform selftest.as_user_uid(c.edu_u);
  g1 := public.may_read_support_screenshot(t);
  perform selftest.as_user_uid(c.adm_u);
  g2 := public.may_read_support_screenshot(t);
  perform selftest.as_user_uid(lain_u);
  g3 := public.may_read_support_screenshot(t);
  perform selftest.as_owner();
  v := v || jsonb_build_object('gambar', jsonb_build_object('pelapor', g1, 'admin', g2, 'guru_lain', g3));

  -- (5) the audit
  select jsonb_object_agg(action, n) into j from (select action, count(*) n from public.audit_log
    where id > v_dulu and action like 'support_report.%' group by action) x;
  v := v || jsonb_build_object('audit', j);
  raise notice 'B15 %', v;
end $b15$;
rollback;
`;

export const bob15Tests: SelfTest[] = [
  {
    id: "BOB15-K01",
    run: async () => {
      const c = new Checks();
      for (const k of KODE_LAPORAN_DB) c.expect(kodeGalatLaporan({ code: "PR100", details: k }) === k, `PR100 ${k} is not read as itself`);
      c.expect(kodeGalatLaporan({ code: "PR100", details: "REPORT_X" }) === "REPORT_FAILED" && kodeGalatLaporan({ code: "42501" }) === "REPORT_FAILED"
        && kodeGalatLaporan(null) === "REPORT_FAILED", "an unknown refusal is trusted");
      for (const k of [...KODE_LAPORAN_DB, "REPORT_FAILED" as const]) {
        for (const locale of LOCALES) {
          const kal = t(kunciKodeLaporan(k), "staff", { locale });
          c.expect(kal.length > 10 && !/REPORT_|PR100/.test(kal), `(${locale}) ${k} has no sentence of its own`);
        }
      }
      for (const st of STATUS_LAPORAN) for (const locale of LOCALES) c.expect(t(kunciStatusLaporan(st), "staff", { locale }).length > 3, `${st} (${locale}) has no word`);
      c.expect(JSON.stringify(langkahBerikut("DITERIMA")) === '["DITANGANI","SELESAI"]' && JSON.stringify(langkahBerikut("DITANGANI")) === '["SELESAI"]'
        && langkahBerikut("SELESAI").length === 0, "a report does not only move forward");
      c.expect(halamanLaporan("/mengajar/abc") === "/mengajar/abc" && halamanLaporan("https://x.test") === "/" && halamanLaporan("//x.test") === "/"
        && halamanLaporan("/lapor") === "/" && halamanLaporan("/a b") === "/" && halamanLaporan(undefined) === "/", "the page is not kept to its shape");
      c.expect(rujukanLaporan("AB12CD") === "AB12CD" && rujukanLaporan("<x>") === null && rujukanLaporan("") === null, "the reference is not kept to its shape");
      c.expect(alamatLapor("/mengajar/k1", "AB12CD") === "/lapor?dari=%2Fmengajar%2Fk1&ref=AB12CD" && alamatLapor("https://x") === "/lapor?dari=%2F",
        `«Laporkan masalah» goes to ${alamatLapor("/mengajar/k1", "AB12CD")}`);
      const id = "0b6a8f3e-1c2d-4e5f-8a9b-0c1d2e3f4a5b";
      c.expect(namaTangkapan(id, "image/png") === `laporan/${id}.png` && namaTangkapan(id, "image/gif") === null && namaTangkapan("../x", "image/png") === null,
        "a screenshot is named by more than a fresh id and its kind");
      // every new sentence in both languages; none promises what PINTAR does not do
      const hle = readFileSync(join(process.cwd(), "src", "lib", "hle.ts"), "utf8");
      const kunci = [...hle.matchAll(/^ {2}"((?:lapor\.|nav\.lapor|config\.section\.laporan_masalah)[a-zA-Z0-9_.]*)": \{/gm)].map((m) => m[1]);
      c.expect(kunci.length >= 40, `${kunci.length} copy keys found`);
      for (const k of kunci) for (const locale of LOCALES) {
        const kal = t(k as HleEvent, "staff", { locale });
        c.expect(kal.trim().length > 0 && !/terkirim|email|notifikasi|pemberitahuan/i.test(kal), `${k} (${locale}): «${kal}»`);
      }
      return c.verdict("the contract executes: PR100's five codes are read by DETAIL only and each, with REPORT_FAILED, has its own sentence in " +
        "both languages; the three statuses have words and a report only moves forward; the page and reference are kept to their shape and " +
        "«Laporkan masalah» carries them; a screenshot is named by a fresh id and its kind only; every new line of the copy table is in both " +
        "languages and promises no email or notification");
    },
  },
  {
    id: "BOB15-S01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...p: string[]) => readFileSync(join(repoRoot, ...p), "utf8");
      const aksi = baca("src", "app", "lapor", "actions.ts");
      c.expect(/rpc\("submit_support_report", \{\s*p_page: halaman, p_error_ref: ref, p_did: lakukan, p_expected: harapan, p_happened: terjadi,\s*p_stops_class: fd\.get\("hentikan"\) === "ya", p_device: perangkat, p_screenshot: tangkapan,\s*\}\)/.test(aksi)
        && /\(await headers\(\)\)\.get\("user-agent"\)/.test(aksi) && /redirect\("\/lapor\/saya\?hasil=diterima"\)/.test(aksi),
        "sending is not one database call with the page, reference, device and screenshot attached, or does not land on «Laporan saya»");
      c.expect(/rpc\("move_support_report", \{ p_report: laporan, p_status: status, p_next_step: langkah \}\)/.test(aksi), "moving is not one database call");
      const form = baca("src", "app", "lapor", "page.tsx");
      c.expect(/name="lakukan"[\s\S]*name="harapan"[\s\S]*name="terjadi"[\s\S]*name="hentikan"[\s\S]*<TangkapanLayar/.test(form)
        && /<input type="hidden" name="dari" value=\{halaman\} \/>/.test(form) && /staf \? "lapor\.arti" : "lapor\.murid"/.test(form)
        && /<TombolKirim/.test(form), "the form does not ask its three questions, attach the page, send once, or tell a student to tell their teacher");
      const lib = baca("src", "lib", "lapor-masalah.ts");
      c.expect(/from\("support_reports"\)/.test(lib) && !/\.rpc\("(?!current_person_id")/.test(lib) && !/supabaseService/.test(lib), "the reports are not read under row security");
      const cangkang = baca("src", "components", "CangkangPengalaman.tsx");
      // D-138 step 3: the staff shells draw one staff layout (shellStaf), which carries the link once; the four staff
      // branches (teaching, management, intake, an educator's own learning) and Studio and Konfigurasi (CangkangStaf) all
      // return through it, and the learner's own shell carries none (a student tells their teacher)
      const iStaf = cangkang.indexOf("\nfunction shellStaf(");
      const inti = iStaf > 0 ? cangkang.slice(0, iStaf) : "";
      const tata = iStaf > 0 ? cangkang.slice(iStaf, cangkang.indexOf("\nexport async function CangkangStaf(")) : "";
      const stafSendiri = cangkang.slice(cangkang.indexOf("\nexport async function CangkangStaf("));
      c.expect((tata.match(/<TautanLapor /g) ?? []).length === 1 && (inti.match(/return shellStaf\(/g) ?? []).length === 4
        && !/<TautanLapor /.test(inti) && /return shellStaf\(/.test(stafSendiri)
        && /<CangkangStaf\b/.test(baca("src", "app", "studio", "layout.tsx")) && /<CangkangStaf\b/.test(baca("src", "app", "konfigurasi", "page.tsx")),
        "«Laporkan masalah» is not on every staff shell, Studio and Konfigurasi");
      const naik = baca("src", "app", "api", "assets", "upload-url", "route.ts");
      c.expect(/jalur = `laporan\/\$\{personId\}\/\$\{tangkapan\[1\]\}`/.test(naik) && /createSignedUploadUrl\(jalur\)/.test(naik),
        "the screenshot's folder is not the server's choice");
      c.expect(/rpc\("may_read_support_screenshot", \{ p_path: path \}\)/.test(baca("src", "app", "api", "assets", "read-url", "route.ts")),
        "a screenshot is read without asking whether its report may be read");
      const konf = baca("src", "app", "konfigurasi", "page.tsx");
      c.expect(/<section id="laporan-masalah"/.test(konf) && /laporanTriase\(platformIni \? null : sekolahIni\)/.test(konf)
        && /action=\{pindahkanLaporanAksi\}/.test(konf), "Konfigurasi has no triage list for the school's and the platform's admins");
      return c.verdict("the source: sending is one database call (submit_support_report) with the page, reference, the request's device and the " +
        "screenshot path, landing on «Laporan saya»; moving is one (move_support_report); the form asks three questions and whether a class " +
        "is stopped, attaches the page, sends once and tells a student to tell their teacher; the reports are read under row security; the " +
        "link is on all four staff shells, Studio and Konfigurasi; the upload route chooses the screenshot's folder and the read route asks " +
        "may_read_support_screenshot; Konfigurasi carries the triage list");
    },
  },
  {
    id: "BOB15-D01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      for (const f of ["fable01.sql", "fable06.sql"]) {
        spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", f), db], { encoding: "utf8" });
      }
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", DB_SKRIP, db], { encoding: "utf8", maxBuffer: 1 << 24 });
      const baris = (r.stderr || "").split("\n");
      const catat = baris.find((l) => l.includes("NOTICE:  B15 "));
      if (!c.expect(!!catat, `the database half could not run: ${baris.find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop()}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const v: Record<string, any> = JSON.parse(catat!.slice(catat!.indexOf("B15 ") + 4));
      c.expect(v.ada === true && v.kirim === "DITERIMA", `the Guru's report: ${v.kirim} (functions ${v.ada})`);
      const l = v.lampiran ?? {};
      c.expect(l.peran === "EDUCATOR" && l.sekolah === true && l.build === "abc1234def" && l.perangkat === "Mozilla/5.0 (uji)" && l.rujukan === "AB12CD"
        && l.kelas === true && l.status === "DITERIMA", `what PINTAR attached: ${JSON.stringify(l)}`);
      c.expect(v.murid === "PR100:REPORT_NOT_STAFF" && v.kosong === "PR100:REPORT_INPUT_INVALID" && v.halaman_asing === "PR100:REPORT_INPUT_INVALID"
        && v.tangkapan_orang_lain === "PR100:REPORT_INPUT_INVALID" && v.tulis_langsung === "42501",
        `refusals: ${JSON.stringify([v.murid, v.kosong, v.halaman_asing, v.tangkapan_orang_lain, v.tulis_langsung])}`);
      const b = v.baca ?? {};
      c.expect(b.pelapor === 1 && b.admin === 1 && b.platform === 1 && b.guru_lain === 0 && b.admin_lain === 0 && b.murid === 0 && b.kaprodi === 0,
        `who reads the report: ${JSON.stringify(b)}`);
      c.expect(v.pindah_pelapor === "PR100:REPORT_NOT_ALLOWED" && v.pindah_admin_lain === "PR100:REPORT_NOT_ALLOWED" && v.ubah_langsung === "42501"
        && v.tanpa_langkah === "PR100:REPORT_NEXT_STEP_REQUIRED" && v.status_asing === "PR100:REPORT_STATUS_INVALID" && v.ditangani === "OK"
        && v.ditangani_lagi === "PR100:REPORT_STATUS_INVALID" && v.selesai === "OK" && v.setelah_selesai === "PR100:REPORT_STATUS_INVALID"
        && v.platform_pindah === "OK", `moving: ${JSON.stringify([v.pindah_pelapor, v.pindah_admin_lain, v.ubah_langsung, v.tanpa_langkah, v.status_asing,
          v.ditangani, v.ditangani_lagi, v.selesai, v.setelah_selesai, v.platform_pindah])}`);
      c.expect(v.akhir === "SELESAI" && v.langkah === "Sudah diperbaiki; muat ulang halaman." && v.penangan === true, `the report ends ${v.akhir}, «${v.langkah}»`);
      c.expect(v.gambar?.pelapor === true && v.gambar?.admin === true && v.gambar?.guru_lain === false, `the screenshot: ${JSON.stringify(v.gambar)}`);
      c.expect(v.audit?.["support_report.received"] === 3 && v.audit?.["support_report.moved"] === 3, `the audit: ${JSON.stringify(v.audit)}`);
      return c.verdict("migration 20261119100000 against the database, rolled back: a Guru's report is DITERIMA with their role (EDUCATOR), " +
        "school, the request's build, the device, the reference and «stops a class» attached; a student is refused REPORT_NOT_STAFF, an " +
        "empty answer, a page outside PINTAR and another person's screenshot REPORT_INPUT_INVALID, and no client writes the table; the " +
        "reporter, the school's admin and Admin platform read it, another Guru, another school's admin, the head of department and a student " +
        "do not; the reporter and another school's admin cannot move it; the school's admin moves it DITANGANI then SELESAI, each with the " +
        "next step, and never back, twice or without one; Admin platform moves another; a screenshot is readable by whoever reads its report; " +
        "audit_log holds three receipts and three moves");
    },
  },
];
