/**
 * B2 · PRINTED-REPORT IDENTIFICATION (C6), the database half (docs/completion-4.1/batches/B2-COMPLETION.md; THE PLAN §5.2;
 * B2-ARCHITECT-NOTES.md §1, the owner's content rule, and §3, Sharon's five changes; migration 20270117150000).
 * One rolled-back transaction, through the product's own paths: a chapter written, reviewed, released and assigned at a
 * school by that school's people, sat by a learner, the learner moved by the product's transfer.
 *
 *   B2-P01  a person with results at A and B prints their own results: the snapshot is {A, B}; each school's admin
 *           finds the reference and is shown only its own school
 *   B2-P02  Sharon's specification: a learner who earned results at A is moved to B (transfer_minta, transfer_terima,
 *           transfer_execute) and prints them: the snapshot is {A} although their live school is {B}; A's admin finds
 *           the reference, B's does not, the platform admin does. Plant b2-1 (the live affiliation) turns it red
 *   B2-P03  a departed learner (no live school) prints their history: the former schools find it, an unrelated school
 *           does not
 *   B2-P04  a print whose report holds no evidence: the snapshot is empty, and only the platform admin finds it
 *   B2-P05  a person-scoped print naming someone else's person: refused, no row; the one-school check holds for a
 *           class-scoped print with two schools and is relaxed for a person-scoped one
 *   B2-P06  ONE READ (Sharon's change 3): the snapshot is the set of schools of the sittings hasil_belajar_sesi_saya
 *           shows the learner, the read /belajar/hasil is built from
 *   B2-S01  static: every report page renders AksiLaporan with its scope and the footer's words; the only window.print()
 *           on a report is AksiLaporan's, after the action returned a reference, restored in a finally and on afterprint;
 *           the certificate's and the class card's prints are untouched; the default footer names no person
 *   B2-S02  static: the register B1-R1 to R5 on the reader and the index (Daisy's words; R2 in the platform's view only;
 *           R3 for its readers only; R4 from the narrow read, platform only, absent unless above zero; R5 no second
 *           «Hapus saringan»)
 *   B2-S03  the completeness notice's reader (Sharon's change 6): refused to a school admin and to a teacher; for the
 *           platform admin, sign-in and sign-out failures of the last seven WIB days, never a print's, never older
 */
import { execSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

function db(): string {
  return process.env.SUPABASE_DB_URL!;
}
function psql(sql: string): { ok: boolean; out: string; err: string } {
  const r = spawnSync("psql", ["-X", "-At", "-v", "ON_ERROR_STOP=1", db()], { encoding: "utf8", input: sql, maxBuffer: 1 << 26 });
  return { ok: r.status === 0, out: (r.stdout ?? "").trim(), err: (r.stderr ?? "").trim().split("\n").filter((l) => /ERROR|FATAL/.test(l)).slice(-3).join(" | ") };
}
function siapkan(repoRoot: string): string | null {
  for (const f of ["fable01.sql", "fable02.sql", "fable03.sql", "fable04.sql", "fable06.sql", "fable09.sql", "fable11.sql", "fable12.sql", "fable13.sql", "b2.sql"]) {
    const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", f), db()], { encoding: "utf8" });
    if (r.status !== 0) return `selftest/db/${f} could not be loaded: ${(r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? ""}`;
  }
  return null;
}

export const MIGRASI_B2 = "supabase/migrations/20270117150000_a_printed_report_is_owned_by_the_schools_whose_evidence_it_shows.sql";

/** The whole world, one transaction, rolled back; the database's own JSON for the checks. */
const DUNIA = `
begin;
create function pg_temp.b2(p_email text, p_sql text)
returns text language plpgsql as $f$
declare v_out text; v_state text; v_detail text; v_msg text; v_val text;
begin
  begin
    if p_email is not null then perform selftest.as_user(p_email); else perform selftest.as_owner(); end if;
    execute p_sql into v_val;
    v_out := 'ok:' || coalesce(v_val, '');
  exception when others then
    get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail, v_msg = message_text;
    v_out := v_state || ':' || coalesce(nullif(v_detail, ''), left(v_msg, 90));
  end;
  perform selftest.as_owner();
  return v_out;
end $f$;
-- a print of the learner's own results, by the service, as the route makes it; its reference
create function pg_temp.b2_cetak(p_uid uuid, p_person uuid)
returns text language plpgsql as $f$
begin
  perform selftest.as_owner();
  return (public.akuntabilitas_catat('PRINT_REQUEST', null, 'OK', p_uid, null, null, null,
                                     jsonb_build_object('report', 'hasil.belajar', 'person_id', p_person))) ->> 'ref';
end $f$;
-- who finds a reference, as a school's admin for that school (or the platform admin with none): the schools it is shown
create function pg_temp.b2_cari(p_email text, p_sekolah uuid, p_ref text)
returns text language sql as $f$
  select pg_temp.b2(p_email, format('select coalesce(string_agg(array_to_string(institution_ids, ''+''), '',''), ''-'') from public.akuntabilitas_baca(%L::uuid, null, %L)', p_sekolah, p_ref))
$f$;
create temp table b2_hasil (v jsonb);
do $b2$
declare v jsonb := '{}'::jsonb; v_tag text := to_char(clock_timestamp(), 'HH24MISSUS');
  v_alpha uuid; v_beta uuid; v_boot uuid; v_ka uuid; v_kb uuid; a jsonb; b jsonb; v_u uuid; v_p uuid; v_e uuid; v_tf uuid;
  v_un uuid; v_pn uuid; v_sys text; v_bguru text; v_bhod text; r1 text; r2 text; r3 text; r4 text; n int; m int;
begin
  perform selftest.as_owner();
  v_alpha := (select i.id from public.institutions i where i.is_synthetic and i.slug like 'synth-alpha-%' order by i.created_at desc limit 1);
  v_beta := (select i.id from public.institutions i where i.is_synthetic and i.slug like 'synth-beta-%' order by i.created_at desc limit 1);
  v_boot := (select i.id from public.institutions i where i.official_evidence_purpose = 'D1_ENGINEERING_BOOTSTRAP' limit 1);
  if v_alpha is null or v_beta is null or v_boot is null then raise exception 'B2: Alpha, Beta and the bootstrap school are needed'; end if;
  v_sys := 'b2-sys-' || v_tag || '@local.invalid';
  perform selftest.f11_user(v_sys, 'SYSTEM_ADMIN', null);
  -- Beta's own people to write, review and release a chapter there
  v_bguru := 'b2-beta-guru-' || v_tag || '@local.invalid'; v_bhod := 'b2-beta-hod-' || v_tag || '@local.invalid';
  perform selftest.f11_user(v_bguru, 'EDUCATOR', (select id from public.org_nodes where institution_id = v_beta and kind = 'INSTITUTION' limit 1));
  perform selftest.f11_user(v_bhod, 'HEAD_OF_DEPARTMENT', (select id from public.org_nodes where institution_id = v_beta and kind = 'INSTITUTION' limit 1));

  -- the learner earns results at A: a chapter written and given at Alpha by Alpha's people, both tests sat
  v_ka := selftest.b2_kelas_di(v_alpha, 'A' || v_tag);
  a := selftest.b2_bab_di(v_alpha, 'alpha-guru@synthetic.pintar.test', 'alpha-hod@synthetic.pintar.test', 'alpha-admin@synthetic.pintar.test', v_ka, 'A' || v_tag);
  v_u := selftest.f06p10_person('b2-murid-' || v_tag);
  select x.person_id into v_p from public.accounts x where x.auth_user_id = v_u;
  v_e := selftest.b2_masuk_kelas(v_p, v_ka);
  perform selftest.b2_duduk(v_u, (a ->> 'pre')::uuid);
  perform selftest.b2_duduk(v_u, (a ->> 'post')::uuid);

  -- B2-P04: a learner with no result prints: an empty snapshot, the platform admin's alone
  v_un := selftest.f06p10_person('b2-kosong-' || v_tag);
  select x.person_id into v_pn from public.accounts x where x.auth_user_id = v_un;
  perform selftest.b2_masuk_kelas(v_pn, v_ka);
  r4 := pg_temp.b2_cetak(v_un, v_pn);
  v := v || jsonb_build_object('p04_snap', (select institution_ids from public.accountability_events where print_ref = r4),
    'p04_A', pg_temp.b2_cari('alpha-admin@synthetic.pintar.test', v_alpha, r4), 'p04_sys', pg_temp.b2_cari(v_sys, null, r4));

  -- B2-P05: someone else's person, refused, nothing written; the constraint, both sides
  n := (select count(*) from public.accountability_events);
  v := v || jsonb_build_object('p05_lain', pg_temp.b2(null, format('select public.akuntabilitas_catat(''PRINT_REQUEST'', null, ''OK'', %L, null, null, null, jsonb_build_object(''report'', ''hasil.belajar'', ''person_id'', %L))::text', v_u, v_pn)),
    'p05_tanpa', pg_temp.b2(null, format('select public.akuntabilitas_catat(''PRINT_REQUEST'', null, ''OK'', %L, null, null, null, jsonb_build_object(''report'', ''hasil.belajar'', ''person_id'', ''x''))::text', v_u)),
    'p05_baris', (select count(*) from public.accountability_events) - n,
    'p05_kelas_dua', pg_temp.b2(null, format('insert into public.accountability_events (at, kind, person_id, institution_ids, outcome, resource, print_ref) values (now(), ''PRINT_REQUEST'', %L, array[%L, %L]::uuid[], ''OK'', jsonb_build_object(''report'', ''x'', ''node_id'', %L), ''CTK-B2B2-B2B2'') returning id::text', v_p, v_alpha, v_beta, v_ka)),
    'p05_orang_dua', pg_temp.b2(null, format('insert into public.accountability_events (at, kind, person_id, institution_ids, outcome, resource, print_ref) values (now(), ''PRINT_REQUEST'', %L, array[%L, %L]::uuid[], ''OK'', jsonb_build_object(''report'', ''hasil.belajar'', ''person_id'', %L), ''CTK-B2B2-B2B3'') returning (id > 0)::text', v_p, v_alpha, v_beta, v_p)));
  -- (the two probe rows stay until the rollback: the record is insert-only)

  -- B2-P02: moved from A to B by the product's own transfer, into a class of B's
  v_kb := selftest.b2_kelas_di(v_beta, 'B' || v_tag);
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  v_tf := public.transfer_minta(v_e, v_beta, 'uji B2 pindah sekolah');
  perform selftest.as_user('beta-admin@synthetic.pintar.test');
  perform public.transfer_terima(v_tf, (select academic_period_id from public.org_nodes where id = v_kb),
    (select id from public.org_nodes where institution_id = v_beta and kind = 'PROGRAMME' and is_active order by created_at limit 1), v_kb);
  perform public.transfer_execute(v_tf);
  perform selftest.as_owner();
  r1 := pg_temp.b2_cetak(v_u, v_p);
  v := v || jsonb_build_object('alpha', v_alpha, 'beta', v_beta,
    'p02_hidup', public.akuntabilitas_sekolah_orang(v_p, now()),
    'p02_snap', (select institution_ids from public.accountability_events where print_ref = r1),
    'p02_A', pg_temp.b2_cari('alpha-admin@synthetic.pintar.test', v_alpha, r1),
    'p02_B', pg_temp.b2_cari('beta-admin@synthetic.pintar.test', v_beta, r1),
    'p02_sys', pg_temp.b2_cari(v_sys, null, r1),
    'p02_isi', (select resource::text from public.accountability_events where print_ref = r1));

  -- B2-P01 (and P02's second report): a result earned at B too; both printed
  b := selftest.b2_bab_di(v_beta, v_bguru, v_bhod, 'beta-admin@synthetic.pintar.test', v_kb, 'B' || v_tag);
  perform selftest.b2_duduk(v_u, (b ->> 'pre')::uuid);
  perform selftest.b2_duduk(v_u, (b ->> 'post')::uuid);
  r2 := pg_temp.b2_cetak(v_u, v_p);
  v := v || jsonb_build_object(
    'p01_snap', (select institution_ids from public.accountability_events where print_ref = r2),
    'p01_A', pg_temp.b2_cari('alpha-admin@synthetic.pintar.test', v_alpha, r2),
    'p01_B', pg_temp.b2_cari('beta-admin@synthetic.pintar.test', v_beta, r2),
    'p01_lain', pg_temp.b2_cari('boot-admin@bootstrap.pintar.test', v_boot, r2),
    'p01_beda', r1 <> r2);
  -- B2-P06: the read the page is built from, as the learner
  perform selftest.as_user_uid(v_u);
  v := v || jsonb_build_object('p06_halaman', (select coalesce(array_agg(distinct s.institution_id order by s.institution_id), '{}'::uuid[])
      from public.hasil_belajar_sesi_saya() h join public.assessment_sessions s on s.id in (h.pre_session, h.post_session)),
    'p06_bab', (select count(*) from public.hasil_belajar_sesi_saya() h where h.keadaan = 'SELESAI'));
  perform selftest.as_owner();

  -- B2-P03: departed (no live school): the former schools find it, an unrelated one does not
  perform set_config('app.seed_intent', 'synthetic', true);
  update public.enrollments set status = 'ENDED', end_reason = 'WITHDRAWN' where person_id = v_p and status in ('ACTIVE', 'PENDING');
  perform set_config('app.seed_intent', '', true);
  r3 := pg_temp.b2_cetak(v_u, v_p);
  v := v || jsonb_build_object('p03_hidup', public.akuntabilitas_sekolah_orang(v_p, now()),
    'p03_snap', (select institution_ids from public.accountability_events where print_ref = r3),
    'p03_A', pg_temp.b2_cari('alpha-admin@synthetic.pintar.test', v_alpha, r3),
    'p03_B', pg_temp.b2_cari('beta-admin@synthetic.pintar.test', v_beta, r3),
    'p03_lain', pg_temp.b2_cari('boot-admin@bootstrap.pintar.test', v_boot, r3));

  -- B2-S03: the completeness notice's reader
  m := substr(pg_temp.b2(v_sys, 'select (public.akuntabilitas_gagal_ringkas() ->> ''n'')'), 4)::int;
  insert into public.accountability_write_failures as f (day, kind, n, last_at) values
    ((now() at time zone 'Asia/Jakarta')::date, 'SIGN_IN', 2, now()),
    ((now() at time zone 'Asia/Jakarta')::date, 'PRINT_REQUEST', 5, now()),
    ((now() at time zone 'Asia/Jakarta')::date - 6, 'SIGN_OUT', 1, now() - interval '6 days'),
    ((now() at time zone 'Asia/Jakarta')::date - 7, 'SIGN_OUT', 3, now() - interval '7 days')
  on conflict (day, kind) do update set n = f.n + excluded.n, last_at = greatest(f.last_at, excluded.last_at);
  v := v || jsonb_build_object('s03_sebelum', m,
    's03_sesudah', substr(pg_temp.b2(v_sys, 'select (public.akuntabilitas_gagal_ringkas() ->> ''n'')'), 4)::int,
    's03_hari', pg_temp.b2(v_sys, 'select (public.akuntabilitas_gagal_ringkas() ->> ''hari'')'),
    's03_admin', pg_temp.b2('alpha-admin@synthetic.pintar.test', 'select public.akuntabilitas_gagal_ringkas()::text'),
    's03_guru', pg_temp.b2('alpha-guru@synthetic.pintar.test', 'select public.akuntabilitas_gagal_ringkas()::text'));
  insert into b2_hasil values (v);
end $b2$;
select 'V|' || v::text from b2_hasil;
rollback;
`;

export const b2Tests: SelfTest[] = [
  {
    id: "B2-S01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (f: string) => readFileSync(join(repoRoot, f), "utf8");
      const aksi = baca("src/components/laporan/AksiLaporan.tsx");
      // the press: the action first; the official line only after its reference; the dialog; the default again in a finally
      const tekan = aksi.slice(aksi.indexOf("const tekan = async"), aksi.indexOf("return (", aksi.indexOf("const tekan = async")));
      const iAksi = tekan.indexOf("await aksi("), iGagal = tekan.indexOf("if (!h.ok)"), iResmi = tekan.indexOf("kaki.resmi"), iCetak = tekan.indexOf("window.print()"), iFinally = tekan.indexOf("finally");
      c.expect(iAksi >= 0 && iAksi < iGagal && iGagal < iResmi && iResmi < iCetak && iCetak < iFinally && /finally \{[\s\S]*pulihkan\(\)/.test(tekan),
        "«Cetak laporan» does not: call the action, stop on a refusal, set the official line, open the dialog, then restore in a finally");
      c.expect(/addEventListener\("afterprint", pulihkan\)/.test(aksi) && /addEventListener\("beforeprint", sebelum\)/.test(aksi) && /if \(!resmi\.current/.test(aksi),
        "the default line is not taken on beforeprint for any other print, or not restored on afterprint");
      c.expect(/\{css\(kaki\.pendek\)\}/.test(aksi), "the stylesheet's default footer is not the short line");
      const hle = baca("src/lib/hle.ts");
      const peramban = /"laporan\.cetak\.kaki\.peramban": \{ default: "([^"]*)", en: "([^"]*)" \}/.exec(hle);
      const pendek = /"laporan\.cetak\.kaki\.pendek": \{ default: "([^"]*)", en: "([^"]*)" \}/.exec(hle);
      c.expect(Boolean(peramban && pendek) && ![peramban![1], peramban![2], pendek![1], pendek![2]].some((x) => /\{nama\}|oleh|by /.test(x))
        && peramban![1].includes("(jam perangkat)") && peramban![2].includes("(device clock)"), "the default browser line names a person, or does not say its clock is the device's (Sharon's change 5; Daisy)");
      // every report page, its scope; the only report print is AksiLaporan's
      for (const [f, lap] of [["src/app/edukator/ringkasan/page.tsx", "ringkasan.kelas"], ["src/app/edukator/ringkasan/page.tsx", "ringkasan.pengembangan"],
        ["src/app/dekan/ringkasan/page.tsx", "ringkasan.simpul"], ["src/app/belajar/hasil/page.tsx", "hasil.belajar"]] as const) {
        c.expect(new RegExp(`cetakSebagai=\\{[^}]*\\{ laporan: "${lap.replace(".", "\\.")}"`).test(baca(f)) && /kaki=\{kataKaki\(/.test(baca(f)), `${f} does not print «${lap}» through the action`);
      }
      const semua = execSync("git ls-files src", { cwd: repoRoot, encoding: "utf8" }).split("\n").filter((f) => /\.tsx?$/.test(f));
      const pencetak = semua.filter((f) => /window\.print\(\)/.test(baca(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/^\s*\*.*$/gm, "")));
      c.expect(JSON.stringify(pencetak.sort()) === JSON.stringify(["src/components/aktivasi/LembarKartu.tsx", "src/components/laporan/AksiLaporan.tsx", "src/components/sertifikat/AksiCetak.tsx"]),
        `window.print() is called from ${JSON.stringify(pencetak)} (expected AksiLaporan, and the certificate's and class card's own, untouched)`);
      c.expect(!/data-kaki-cetak|laporan\.cetak\.kaki/.test(baca("src/components/sertifikat/AksiCetak.tsx") + baca("src/components/aktivasi/LembarKartu.tsx")), "the certificate or the class card carries a report's footer");
      return c.verdict("«Cetak laporan» calls the action, stops on a refusal, sets the official line only after its reference, opens the dialog and restores the default in a finally and on afterprint; any other print takes the device-clock line on beforeprint; the default names no person; the four report views print through the action with their scope; the only other window.print() calls are the certificate's and the class card's, which carry no report footer");
    },
  },
  {
    id: "B2-S02",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (f: string) => readFileSync(join(repoRoot, f), "utf8");
      const hal = baca("src/app/konfigurasi/catatan-masuk/page.tsx");
      const hle = baca("src/lib/hle.ts");
      c.expect(/"akuntabilitas\.ditolak": \{ default: "[^"]*dan Admin PINTAR\.", en: "[^"]*and by an Admin PINTAR\." \}/.test(hle), "B1-R1: the refusal does not name the Admin PINTAR (Daisy)");
      c.expect(/platformIni \? <><br \/><span className="pin-meta" data-akuntabilitas-sekolah="">\{sekolahBaris\(b\)\}/.test(hal) && /"akuntabilitas\.tanpa_sekolah": \{ default: "tanpa sekolah", en: "no school" \}/.test(hle)
        && /join\(", "\)/.test(hal), "B1-R2: the platform's view does not name each row's schools on a line under the name, joined with «, », «tanpa sekolah» for none");
      const idx = baca("src/app/konfigurasi/page.tsx");
      c.expect(/b === "audit" && \(isSys === true \|\| \(satuSekolah \? adminInstitutionIds\.includes\(satuSekolah\) : false\)\)/.test(idx) && /href="\/konfigurasi\/catatan-masuk"[\s\S]{0,260}akuntabilitas\.judul/.test(idx),
        "B1-R3: the index does not list the reader after «Jejak audit», for the school's admin and the Admin PINTAR only");
      c.expect(/platformIni \? await supabase\.rpc\("akuntabilitas_gagal_ringkas"\)/.test(hal) && !/pintar_periksa_kesehatan/.test(hal)
        && /gagalTulis\.n > 0/.test(hal) && /href="\/konfigurasi\?periksa=skema"/.test(hal), "B1-R4: the notice does not read the narrow count, in the platform's view only, above zero, with its link");
      c.expect(/"akuntabilitas\.tidak_lengkap": \{ default: "Daftar ini mungkin tidak lengkap\. Dalam 7 hari terakhir, PINTAR tidak dapat mencatat sebagian kejadian masuk atau keluar \(terhitung \{n\}, terakhir \{waktu\}\)\.", en: "This list may be incomplete\. In the last 7 days, PINTAR could not record some sign-in or sign-out events \(\{n\} counted, the last at \{waktu\}\)\." \}/.test(hle),
        "B1-R4: the notice's words are not Daisy's");
      // B1-R4, ADDED (Daisy's B2 visit, TINJAUAN-B2-bfe949b1.md §3): .pin-banner is a two-column grid (icon, content), so the
      // notice's sentence and its link sit in ONE child element; as bare text they fall into the icon column, the link is
      // squeezed to zero width and the page scrolls sideways at 320 px. The rendered half is journey step B2N
      const banner = /<p className="pin-banner pin-attention" role="status" data-akuntabilitas-tidak-lengkap=\{tidakLengkap\.n\}>\s*([\s\S]*?)<\/p>/.exec(hal)?.[1] ?? "";
      c.expect(/^<span>[\s\S]*akuntabilitas\.tidak_lengkap[\s\S]*<Link href="\/konfigurasi\?periksa=skema">[\s\S]*<\/Link>\s*<\/span>\s*$/.test(banner),
        "B1-R4: the notice's sentence and its link are not in one child element of the banner (Daisy: bare text falls into the icon column)");
      const kosong = hal.slice(hal.indexOf("baris.length === 0 && hal === 1"), hal.indexOf('<div className="pin-koleksi pin-akuntabilitas">'));
      c.expect(!/aksi=\{/.test(kosong), "B1-R5: an empty state still offers its own «Hapus saringan» beside the filter's");
      return c.verdict("B1-R1: the refusal names the Admin PINTAR; R2: the platform's view names each row's schools on a second line, «tanpa sekolah» for none; R3: the index lists the reader after «Jejak audit» for its readers only; R4: the notice reads akuntabilitas_gagal_ringkas in the platform's view only, shown above zero with Daisy's words and the health check's link, the sentence and the link in one child of the banner; R5: no empty state adds a second «Hapus saringan»");
    },
  },
  {
    id: "B2-P01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const e = siapkan(repoRoot);
      if (!c.expect(e === null, String(e))) return c.verdict("");
      const r = psql(DUNIA);
      const baris = r.out.split("\n").find((l) => l.startsWith("V|"));
      if (!c.expect(r.ok && Boolean(baris), `the world did not run: ${r.err}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const v = JSON.parse(baris!.slice(2)) as Record<string, any>;
      hasilB2 = v;
      const A = String(v.alpha), B = String(v.beta);
      const AB = [A, B].sort();
      c.expect(JSON.stringify(v.p01_snap) === JSON.stringify(AB), `the print of results from A and B holds ${JSON.stringify(v.p01_snap)} (expected ${JSON.stringify(AB)})`);
      c.expect(v.p01_A === `ok:${A}` && v.p01_B === `ok:${B}`, `A's admin finds ${v.p01_A}, B's ${v.p01_B} (each should find it, shown only its own school)`);
      c.expect(v.p01_lain === "ok:-", `an unrelated school finds ${v.p01_lain}`);
      c.expect(v.p01_beda === true, "two presses gave one reference");
      return c.verdict("a learner with results at Alpha and at Beta prints their own results: the snapshot is {Alpha, Beta}; each school's admin finds the reference and is shown its own school alone; an unrelated school finds nothing; every press is its own reference");
    },
  },
  {
    id: "B2-P02",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const v = await dunia(repoRoot, c);
      if (!v) return c.verdict("");
      const A = String(v.alpha), B = String(v.beta);
      c.expect(JSON.stringify(v.p02_hidup) === JSON.stringify([B]), `after the transfer the learner's live schools are ${JSON.stringify(v.p02_hidup)} (expected {B})`);
      c.expect(JSON.stringify(v.p02_snap) === JSON.stringify([A]), `the print of results earned at A, made at B, holds ${JSON.stringify(v.p02_snap)} (expected {A}: never the live affiliation)`);
      c.expect(v.p02_A === `ok:${A}` && v.p02_B === "ok:-" && /^ok:/.test(String(v.p02_sys)) && v.p02_sys !== "ok:-",
        `A's admin finds ${v.p02_A}, B's ${v.p02_B}, the platform's ${v.p02_sys} (expected A and the platform, not B)`);
      c.expect(!/"person_id"[^}]*"report"[^}]*"[^"]*(stem|value|rationale)/.test(String(v.p02_isi)) && /"report": "hasil\.belajar"/.test(String(v.p02_isi)),
        `the event's resource is ${v.p02_isi}: it names the report and the person, never the content`);
      return c.verdict("Sharon's specification: a learner who earned results at Alpha, moved to Beta through transfer_minta, transfer_terima and transfer_execute, prints them: the snapshot is {Alpha} while their live school is {Beta}; Alpha's admin finds the reference, Beta's does not, the platform admin does; the event holds the report and the person, no content");
    },
  },
  {
    id: "B2-P03",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const v = await dunia(repoRoot, c);
      if (!v) return c.verdict("");
      const A = String(v.alpha), B = String(v.beta);
      c.expect(JSON.stringify(v.p03_hidup) === "[]", `the departed learner still has a live school: ${JSON.stringify(v.p03_hidup)}`);
      c.expect(JSON.stringify(v.p03_snap) === JSON.stringify([A, B].sort()) && v.p03_A === `ok:${A}` && v.p03_B === `ok:${B}` && v.p03_lain === "ok:-",
        `a departed learner's print: ${JSON.stringify(v.p03_snap)}; A ${v.p03_A}, B ${v.p03_B}, an unrelated school ${v.p03_lain}`);
      return c.verdict("a learner with no live school prints their history: the snapshot holds the schools whose evidence it shows; each finds it; an unrelated school does not");
    },
  },
  {
    id: "B2-P04",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const v = await dunia(repoRoot, c);
      if (!v) return c.verdict("");
      c.expect(JSON.stringify(v.p04_snap) === "[]" && v.p04_A === "ok:-" && v.p04_sys === "ok:",
        `a print with no evidence: snapshot ${JSON.stringify(v.p04_snap)}; A finds ${v.p04_A}; the platform ${v.p04_sys} (expected the platform's alone)`);
      return c.verdict("a learner with no result prints: the snapshot is empty; the school finds nothing; the platform admin finds it");
    },
  },
  {
    id: "B2-P05",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const v = await dunia(repoRoot, c);
      if (!v) return c.verdict("");
      c.expect(v.p05_lain === "PR200:ACCOUNTABILITY_RESOURCE_INVALID" && v.p05_tanpa === "PR200:ACCOUNTABILITY_RESOURCE_INVALID" && v.p05_baris === 0,
        `someone else's person: ${v.p05_lain}; not a person: ${v.p05_tanpa}; rows written ${v.p05_baris}`);
      c.expect(/^23514:/.test(String(v.p05_kelas_dua)) && v.p05_orang_dua === "ok:true",
        `the one-school check: a class-scoped print with two schools ${v.p05_kelas_dua} (expected refused); a person-scoped one ${v.p05_orang_dua}`);
      // Sharon's change 1: the action takes the person from the verified session, never from the request
      const act = readFileSync(join(repoRoot, "src/app/laporan/cetak/actions.ts"), "utf8");
      const kontrak = readFileSync(join(repoRoot, "src/lib/akuntabilitas-kontrak.ts"), "utf8");
      c.expect(/supabase\.auth\.getUser\(\)/.test(act) && /authUserId: user\.id/.test(act) && /person_id: orang\.person_id/.test(act),
        "the print action does not take the requester from auth.getUser() and the person from the session's own profile");
      c.expect(/export type PermintaanCetak = \{ laporan: LaporanCetak; simpul\?: string \| null \};/.test(kontrak),
        "the print request can carry more than its report and node (a person, a user id)");
      return c.verdict("a print naming another person, or a person that is not one, is refused and writes nothing; a class-scoped print with two schools is refused by the constraint and a person-scoped one is not; the action takes the requester from auth.getUser() and the person from the session's own profile, and its request carries only the report and a node");
    },
  },
  {
    id: "B2-P06",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const v = await dunia(repoRoot, c);
      if (!v) return c.verdict("");
      c.expect(JSON.stringify(v.p06_halaman) === JSON.stringify(v.p01_snap) && v.p06_bab === 2,
        `the schools of the sittings the learner's page shows ${JSON.stringify(v.p06_halaman)} (${v.p06_bab} finished chapter(s)); the print's ${JSON.stringify(v.p01_snap)}`);
      const lib = readFileSync(join(repoRoot, "src/lib/hasil-belajar.ts"), "utf8");
      const fn = lib.slice(lib.indexOf("export async function hasilBelajar"));
      c.expect(/engine\.myResultsShown\(db\)/.test(fn) && !/cycleState\(/.test(fn), "hasilBelajar does not build the page from hasil_belajar_sesi_saya alone");
      return c.verdict("one read: the snapshot is exactly the schools of the sittings hasil_belajar_sesi_saya shows the learner, and /belajar/hasil is built from that read alone");
    },
  },
  {
    id: "B2-S03",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const v = await dunia(repoRoot, c);
      if (!v) return c.verdict("");
      c.expect(v.s03_sesudah - v.s03_sebelum === 3, `two sign-in failures today and one sign-out six days ago moved the count by ${v.s03_sesudah - v.s03_sebelum} (expected 3: a print's and one seven days ago are not counted)`);
      c.expect(v.s03_hari === "ok:7", `the window: ${v.s03_hari}`);
      c.expect(v.s03_admin === "PR200:ACCOUNTABILITY_NOT_ALLOWED" && v.s03_guru === "PR200:ACCOUNTABILITY_NOT_ALLOWED",
        `a school admin ${v.s03_admin}, a teacher ${v.s03_guru} (expected refused)`);
      return c.verdict("akuntabilitas_gagal_ringkas: the platform admin's alone; sign-in and sign-out failures of today and the six days before (WIB), never a print's or an older day's");
    },
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let hasilB2: Record<string, any> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function dunia(repoRoot: string, c: Checks): Promise<Record<string, any> | null> {
  if (hasilB2) return hasilB2;
  const e = siapkan(repoRoot);
  if (!c.expect(e === null, String(e))) return null;
  const r = psql(DUNIA);
  const baris = r.out.split("\n").find((l) => l.startsWith("V|"));
  if (!c.expect(r.ok && Boolean(baris), `the world did not run: ${r.err}`)) return null;
  hasilB2 = JSON.parse(baris!.slice(2));
  return hasilB2;
}
