/**
 * CI-1 (ruling 97; docs/post-4.1/ci-1/CI-1-SPEC.md @d152e9ef, with Sharon's binding §6). Closes L-67: after an answer-key
 * correction recalculates a certified result to a fail, the school could press «Konfirmasi berlaku» and the public check
 * then read «Berlaku · Lulus» although the result in force contradicts it.
 *
 *   CI1-S01  S-1: a CONFIRMED decision on a review whose result in force (hasil_murid_id) no longer passes is refused
 *            PR190 CERT_REVIEW_RESULT_NO_LONGER_PASSES and nothing is written; REVOKED stays available (DICABUT).
 *            Plants: P1 (no S-1 check) and P2 (an over-strict check) are caught.
 *   CI1-S02  S-1 reads the whole rule and the result in force: a gate-only failure is refused (P3, a mastery-only check,
 *            is caught); the result in force is hasil_murid_id, not the newest row (P4, hasil_terkini_id, is caught both
 *            ways round).
 *   CI1-V01  S-2: one helper, sertifikat_dipersoalkan (an open review OR a result in force that fails), states validity
 *            for the public verify_certificate, the learner's sertifikat_saya_ditinjau and the staff Konfigurasi reads.
 *            A row wrongly CONFIRMED on a failing result (planted past S-1) reads DITINJAU, never BERLAKU (P5) and
 *            never DICABUT without a revocation (P6); the learner's card and print read it under review (P7); a clean
 *            confirmed row reads BERLAKU everywhere. The OUT signatures are unchanged and assert_public_surface passes.
 *   CI1-K01  reads the source: the migration writes no rows; the new code is the contract's, mapped to its own words in
 *            ID and EN, so the refusal shows on Konfigurasi as a named refusal; the page's pill, the selected
 *            certificate's state and the «dikonfirmasi» note read the helper.
 *
 * The harness's hand (paksa) puts the result in force below the mark by raising the sitting's pass mark, or clears its
 * gate, or plants a decision past S-1: never a product path. Every scenario runs in one rolled-back transaction.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t } from "../src/lib/hle";
import { KODE_KOREKSI_DB, kodeKoreksiDariGalat, kunciKodeKoreksi } from "../src/lib/soal-kontrak";
import { G, S, jalankan, lakukan, langkah, paksa } from "./c1w.test";

const KODE = "CERT_REVIEW_RESULT_NO_LONGER_PASSES";
const ALASAN_K = "uji CI-1: kunci jawaban soal ini keliru";
const KONFIRMASI = "Hasilnya tetap di atas batas lulus.";
const CABUT = "Hasil yang dikoreksi di bawah batas lulus.";
export const MIGRASI_CI1 = "supabase/migrations/20270125100000_a_now_failing_result_is_never_confirmed_or_read_valid.sql";

const sertifikat = `(select x.id from public.certificates x where x.session_id = ${G("bs")} order by x.issued_at desc limit 1)`;
const presented = (n: number) => `(select p.item_id from public.presented_items p where p.session_id = ${G("bs")} order by p.position offset ${n} limit 1)`;
const kunciLain = (it: string) => `(select o.label from public.item_options o where o.item_id = ${it} and not o.is_correct order by o.label limit 1)`;
const verifikasi = `select v.validity || '|' || coalesce(v.pass::text, '-') from public.verify_certificate((select x.verification_token from public.certificates x where x.id = ${G("cert")})) v`;
const layak = `select public.sertifikat_layak_dengan(${G("bs")}, r.mastery, r.safety_gate_passed)::text from public.assessment_results r where r.id = public.hasil_murid_id(${G("bs")})`;
const putus = (k: string, keputusan: "CONFIRMED" | "REVOKED") =>
  langkah(k, "badmin", `select public.putuskan_tinjauan_sertifikat(${G("rv")}, '${keputusan}', '${keputusan === "CONFIRMED" ? KONFIRMASI : CABUT}') ->> 'status'`);
const tertulis = `select coalesce((select v.decision from public.certificate_reviews v where v.id = ${G("rv")}), '-') || '|'
  || (select count(*) from public.audit_log l where l.action = 'certificate.review_decided' and l.target_id = ${S("cert")}) || '|'
  || (select c.status::text from public.certificates c where c.id = ${G("cert")})`;

/** C1W-S06's world: the bootstrap learner's sealed certificate under review through one governed key correction. */
const dunia = (): string[] => [
  `if ${S("boot")} = '' then raise exception 'the bootstrap school is absent'; end if;`,
  `perform selftest.purge_certificates();`,
  `perform set_config('c1.bs', selftest.boot_attempt(true)::text, true);`,
  `perform selftest.as_owner(); perform public.certificate_prepare(${G("bs")}, 1::smallint);`,
  `perform set_config('c1.cert', ${sertifikat}::text, true); perform public.certificate_seal(${G("cert")}, 1::smallint, repeat('a', 64));`,
  `perform selftest.as_owner();
   perform set_config('c1.it_k1', (${presented(0)})::text, true);
   perform set_config('c1.kunci_k1', ${kunciLain(G("it_k1"))}, true);
   perform selftest.as_user_uid(${G("u_badmin")});
   perform set_config('c1.k1', public.ajukan_koreksi_kunci(${G("it_k1")}, array[${S("kunci_k1")}], '${ALASAN_K}') ->> 'koreksi', true);
   perform selftest.as_owner();`,
  lakukan("bkadep", `select public.tegaskan_koreksi_kunci(${G("k1")})`),
  `perform set_config('c1.rv', (select v.id::text from public.certificate_reviews v where v.certificate_id = ${G("cert")} and v.decision is null), true);`,
  `perform set_config('c1.rm', public.hasil_murid_id(${G("bs")})::text, true);`,
];
/** The harness's hand: the result in force below the mark (the sitting's mark raised above it). */
const diBawahBatas = paksa(`update public.assessment_sessions set pass_mark = 0.99 where id = current_setting('c1.bs')::uuid`);
/** The harness's hand: the result in force keeps its mastery, its gate fails. */
const gerbangGagal = paksa(`update public.assessment_results set safety_gate_passed = false where id = current_setting('c1.rm')::uuid`);
/** The harness's hand: a newer row on the sitting that is not the result in force, passing or failing as asked. */
const barisLebihBaru = (lulus: boolean) => paksa(`insert into public.assessment_results (session_id, institution_id, person_id, evidence_class,
    engine_version, scoring_policy_version, mastery, per_domain, safety_gate_passed, delta_inputs, supersedes_result_id, recomputation_reason, computed_at)
  select r.session_id, r.institution_id, r.person_id, r.evidence_class, r.engine_version, r.scoring_policy_version, r.mastery, r.per_domain,
         ${lulus}, r.delta_inputs, r.id, r.recomputation_reason, r.computed_at + interval '1 minute'
    from public.assessment_results r where r.id = current_setting('c1.rm')::uuid`);
/** The harness's hand: a decision written past S-1 (the row L-67 describes). */
const dikonfirmasiKeliru = paksa(`update public.certificate_reviews set decision = 'CONFIRMED', decided_at = now(),
    decided_by_person_id = (select a.person_id from public.accounts a where a.auth_user_id = current_setting('c1.u_badmin')::uuid), reason = 'tanaman uji CI-1'
  where id = current_setting('c1.rv')::uuid`);

/** A plant: replace `dari` with `ke` in the function `fn`'s current definition (refused when it does not reach). */
export const tanam = (fn: string, dari: string, ke: string) => `perform selftest.as_owner();
   if position(${sql(dari)} in pg_get_functiondef('${fn}'::regprocedure)) = 0 then raise exception 'the plant did not reach ${fn}'; end if;
   execute replace(pg_get_functiondef('${fn}'::regprocedure), ${sql(dari)}, ${sql(ke)});`;
function sql(s: string): string {
  return `$t$${s}$t$`;
}
const PUTUS = "public.putuskan_tinjauan_sertifikat(uuid,text,text)";
const HELPER = "public.sertifikat_dipersoalkan(uuid)";
/** The S-1 check as the migration writes it (the plants replace it). */
const CEK_S1 = "if not public.sertifikat_hasil_lulus(v.session_id) then perform public.koreksi_tolak('CERT_REVIEW_RESULT_NO_LONGER_PASSES'); end if;";

export const ci1Tests: SelfTest[] = [
  {
    id: "CI1-S01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const gagal = (tanaman: string[] = []): string[] => [
        ...dunia(), diBawahBatas, ...tanaman,
        langkah("layak", null, layak),
        putus("konfirmasi", "CONFIRMED"),
        langkah("tertulis", null, tertulis),
        langkah("ditinjau", null, verifikasi),
        putus("cabut", "REVOKED"),
        langkah("dicabut", null, verifikasi),
      ];
      const m = jalankan(c, repoRoot, gagal());
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      harap("layak", "ok:false", "the result in force no longer passes (the fixture's mark above it)");
      harap("konfirmasi", `PR190:${KODE}`, "the school confirming a certificate whose result in force fails");
      harap("tertulis", "ok:-|0|ISSUED", "after the refusal (the review still open, no decision audited, the certificate as issued)");
      harap("ditinjau", "ok:DITINJAU|true", "the public check after the refusal (still under review)");
      harap("cabut", "ok:REVOKED", "the school revoking it instead (REVOKED stays available)");
      harap("dicabut", "ok:DICABUT|true", "the public check after the revocation");
      // a still-passing review confirms exactly as today
      const lulus = (tanaman: string[] = []): string[] => [
        ...dunia(), ...tanaman,
        langkah("layak", null, layak),
        putus("konfirmasi", "CONFIRMED"),
        langkah("tertulis", null, tertulis),
        langkah("berlaku", null, verifikasi),
      ];
      const n = jalankan(c, repoRoot, lulus());
      if (!n) return c.verdict("");
      c.expect(n.layak === "ok:true", `the corrected result still passes: ${n.layak}`);
      c.expect(n.konfirmasi === "ok:ISSUED", `the school confirming a still-passing certificate: ${n.konfirmasi}; expected ok:ISSUED`);
      c.expect(n.tertulis === "ok:CONFIRMED|1|ISSUED", `after confirming (decided, audited once, as issued): ${n.tertulis}`);
      c.expect(n.berlaku === "ok:BERLAKU|true", `the public check of a confirmed, still-passing certificate: ${n.berlaku}`);
      // P1: no S-1 check — the failing confirmation goes through
      const p1 = jalankan(new Checks(), repoRoot, gagal([tanam(PUTUS, CEK_S1, "")]));
      c.expect(p1 !== null && p1.konfirmasi !== `PR190:${KODE}`, `P1 (no S-1 check) must be caught: the failing confirmation answered ${p1?.konfirmasi}`);
      // P2: an over-strict check — a passing review can no longer confirm
      const p2 = jalankan(new Checks(), repoRoot, lulus([tanam(PUTUS, CEK_S1, "perform public.koreksi_tolak('CERT_REVIEW_RESULT_NO_LONGER_PASSES');")]));
      c.expect(p2 !== null && p2.konfirmasi !== "ok:ISSUED", `P2 (an over-strict S-1) must be caught: the passing confirmation answered ${p2?.konfirmasi}`);
      return c.verdict("S-1: a CONFIRMED decision on a certificate whose result in force no longer passes is refused PR190 "
        + "CERT_REVIEW_RESULT_NO_LONGER_PASSES with nothing written (the review open, no decision audited, the certificate as issued, DITINJAU); "
        + "REVOKED stays available (DICABUT); a still-passing review confirms exactly as before (audited once, BERLAKU); "
        + "the plants P1 (no check) and P2 (an over-strict check) are caught");
    },
  },
  {
    id: "CI1-S02",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // a gate-only failure: the mastery still clears the mark, the gate fails
      const gerbang = (tanaman: string[] = []): string[] => [
        ...dunia(), gerbangGagal, ...tanaman,
        langkah("penguasaan", null, `select (r.mastery >= s.pass_mark)::text || '|' || r.safety_gate_passed::text from public.assessment_results r
          join public.assessment_sessions s on s.id = r.session_id where r.id = public.hasil_murid_id(${G("bs")})`),
        putus("konfirmasi", "CONFIRMED"),
      ];
      const m = jalankan(c, repoRoot, gerbang());
      if (!m) return c.verdict("");
      c.expect(m.penguasaan === "ok:true|false", `the fixture: mastery at or above the mark, the gate failed (${m.penguasaan})`);
      c.expect(m.konfirmasi === `PR190:${KODE}`, `a gate-only failure confirmed: ${m.konfirmasi}; expected PR190:${KODE}`);
      // the result in force is hasil_murid_id, not the newest row on the sitting
      const terbaru = (lulusTerbaru: boolean, tanaman: string[] = []): string[] => [
        ...dunia(), ...(lulusTerbaru ? [gerbangGagal] : []), barisLebihBaru(lulusTerbaru), ...tanaman,
        langkah("beda", null, `select (public.hasil_terkini_id(${G("bs")}) <> public.hasil_murid_id(${G("bs")}))::text || '|' || (public.hasil_murid_id(${G("bs")}) = ${G("rm")})::text`),
        putus("konfirmasi", "CONFIRMED"),
      ];
      const a = jalankan(c, repoRoot, terbaru(true));
      const b = jalankan(c, repoRoot, terbaru(false));
      if (!a || !b) return c.verdict("");
      c.expect(a.beda === "ok:true|true" && b.beda === "ok:true|true", `the fixture: a newer row that is not the result in force (${a.beda}, ${b.beda})`);
      c.expect(a.konfirmasi === `PR190:${KODE}`, `the result in force fails, a newer row passes: ${a.konfirmasi}; expected the refusal`);
      c.expect(b.konfirmasi === "ok:ISSUED", `the result in force passes, a newer row fails: ${b.konfirmasi}; expected ok:ISSUED`);
      // P3: a mastery-only check — the gate-only failure is confirmed
      const p3 = jalankan(new Checks(), repoRoot, gerbang([tanam("public.sertifikat_hasil_lulus(uuid)",
        "public.sertifikat_layak_dengan(p_session, r.mastery, r.safety_gate_passed)", "public.sertifikat_layak_dengan(p_session, r.mastery, true)")]));
      c.expect(p3 !== null && p3.konfirmasi !== `PR190:${KODE}`, `P3 (a mastery-only check) must be caught: the gate-only failure answered ${p3?.konfirmasi}`);
      // P4: hasil_terkini_id for hasil_murid_id — the wrong row is read, and both ways round the answer flips
      const p4tanam = tanam("public.sertifikat_hasil_lulus(uuid)", "public.hasil_murid_id(p_session)", "public.hasil_terkini_id(p_session)");
      const p4a = jalankan(new Checks(), repoRoot, terbaru(true, [p4tanam]));
      const p4b = jalankan(new Checks(), repoRoot, terbaru(false, [p4tanam]));
      c.expect(p4a !== null && p4b !== null && (p4a.konfirmasi !== `PR190:${KODE}` || p4b.konfirmasi !== "ok:ISSUED"),
        `P4 (hasil_terkini_id) must be caught: ${p4a?.konfirmasi}, ${p4b?.konfirmasi}`);
      return c.verdict("S-1 reads the whole certifying rule on the result in force: a gate-only failure (mastery at or above the mark) is "
        + "refused; the result in force is hasil_murid_id, so a newer row that is not it changes nothing either way (refused while the result "
        + "in force fails, confirmed while it passes); the plants P3 (mastery only) and P4 (hasil_terkini_id) are caught");
    },
  },
  {
    id: "CI1-V01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = [
        langkah("publik", null, verifikasi),
        `perform selftest.as_user('boot-siswa@bootstrap.pintar.test');
         v := v || jsonb_build_object('murid', public.sertifikat_saya_ditinjau(${G("bs")})::text);
         perform selftest.as_owner();`,
        langkah("dikonfirmasi", "badmin", `select (exists (select 1 from jsonb_array_elements(public.tinjauan_sertifikat_dikonfirmasi(${G("boot")})) x where x ->> 'sertifikat' = ${S("cert")}))::text`),
        langkah("dipersoalkan", "badmin", `select (${G("cert")} in (select x from public.sertifikat_dipersoalkan_sekolah(${G("boot")}) x))::text`),
      ];
      // the row L-67 describes: decided CONFIRMED (past S-1) on a result in force that fails
      const keliru = (tanaman: string[] = []): string[] => [
        ...dunia(), diBawahBatas, dikonfirmasiKeliru, ...tanaman, ...baca,
        langkah("guru", "guru", `select count(*)::text from public.sertifikat_dipersoalkan_sekolah(${G("boot")})`),
        langkah("cabut_langsung", "badmin", `select public.revoke_certificate(${G("cert")}, 'Dicabut oleh sekolah penerbit setelah dihitung ulang.')::text`),
        langkah("sesudah_cabut", null, verifikasi),
      ];
      const m = jalankan(c, repoRoot, keliru());
      if (!m) return c.verdict("");
      const harap = (k: string, h: string, apa: string) => c.expect(m[k] === h, `${apa}: answered ${m[k]}; expected ${h}`);
      harap("publik", "ok:DITINJAU|true", "the public check of a certificate wrongly confirmed on a failing result (DITINJAU, as issued)");
      harap("murid", "true", "the learner's own read (card, print, certificate page) of that certificate");
      harap("dikonfirmasi", "ok:false", "the staff «dikonfirmasi» note for that certificate");
      harap("dipersoalkan", "ok:true", "the staff list's read of that certificate");
      c.expect(/^PR\d+:|^42501/.test(m.guru ?? ""), `a teacher reading the school's questioned certificates: ${m.guru}; expected a refusal`);
      harap("cabut_langsung", "ok:REVOKED", "the school revoking it");
      harap("sesudah_cabut", "ok:DICABUT|true", "the public check once revoked (DICABUT only from a revocation)");
      // a clean row: confirmed by the product on a still-passing result
      const bersih = (): string[] => [...dunia(), putus("konfirmasi", "CONFIRMED"), ...baca];
      const n = jalankan(c, repoRoot, bersih());
      if (!n) return c.verdict("");
      c.expect(n.konfirmasi === "ok:ISSUED" && n.publik === "ok:BERLAKU|true" && n.murid === "false" && n.dikonfirmasi === "ok:true" && n.dipersoalkan === "ok:false",
        `a clean confirmed certificate: ${[n.konfirmasi, n.publik, n.murid, n.dikonfirmasi, n.dipersoalkan].join(", ")}; expected BERLAKU everywhere`);
      // one helper, the contract unchanged
      const k = jalankan(c, repoRoot, [
        langkah("hasil", null, `select pg_get_function_result('public.verify_certificate(text)'::regprocedure) || ' / '
          || pg_get_function_result('public.sertifikat_saya_ditinjau(uuid)'::regprocedure) || ' / '
          || pg_get_function_result('public.putuskan_tinjauan_sertifikat(uuid,text,text)'::regprocedure) || ' / '
          || pg_get_function_result('public.tinjauan_sertifikat_dikonfirmasi(uuid)'::regprocedure)`),
        langkah("satu", null, `select string_agg(f || ':' || (position('sertifikat_dipersoalkan(' in d) > 0)::text || (position('sertifikat_ditinjau(' in d) > 0)::text, ',' order by f)
          from (select p.proname::text f, pg_get_functiondef(p.oid) d from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname in ('verify_certificate', 'sertifikat_saya_ditinjau', 'tinjauan_sertifikat_dikonfirmasi', 'sertifikat_dipersoalkan_sekolah')) x`),
        langkah("hak", null, `select has_function_privilege('anon', '${HELPER}', 'execute')::text || '|' || has_function_privilege('authenticated', '${HELPER}', 'execute')::text
          || '|' || has_function_privilege('anon', 'public.sertifikat_dipersoalkan_sekolah(uuid)', 'execute')::text
          || '|' || has_function_privilege('authenticated', 'public.sertifikat_dipersoalkan_sekolah(uuid)', 'execute')::text`),
        langkah("permukaan", null, `select a.ok::text || coalesce('|' || a.detail, '') from public.assert_public_surface() a`),
      ]);
      if (!k) return c.verdict("");
      c.expect(k.hasil === "ok:TABLE(pass boolean, predikat text, institution text, date text, validity text) / boolean / jsonb / jsonb",
        `the OUT signatures: ${k.hasil}`);
      c.expect(k.satu === "ok:sertifikat_dipersoalkan_sekolah:truefalse,sertifikat_saya_ditinjau:truefalse,tinjauan_sertifikat_dikonfirmasi:truefalse,verify_certificate:truefalse",
        `every reader that states validity reads the one helper, none the open-review rule alone: ${k.satu}`);
      c.expect(k.hak === "ok:false|false|false|true", `the helper is internal, the staff list's read is the signed-in caller's only: ${k.hak}`);
      c.expect(/^ok:true/.test(k.permukaan ?? ""), `assert_public_surface: ${k.permukaan}`);
      // P5: the old verify logic (the open review only) — the wrongly confirmed row reads BERLAKU
      const p5 = jalankan(new Checks(), repoRoot, keliru([tanam("public.verify_certificate(text)", "public.sertifikat_dipersoalkan(v_c.id)", "public.sertifikat_ditinjau(v_c.id)")]));
      c.expect(p5 !== null && p5.publik !== "ok:DITINJAU|true", `P5 (the old verify logic) must be caught: answered ${p5?.publik}`);
      // P6: DICABUT without a revocation — the failing result read as revoked
      const p6 = jalankan(new Checks(), repoRoot, keliru([tanam("public.verify_certificate(text)", "then 'DITINJAU' else 'BERLAKU' end", "then 'DICABUT' else 'BERLAKU' end")]));
      c.expect(p6 !== null && p6.publik !== "ok:DITINJAU|true", `P6 (DICABUT without a revocation) must be caught: answered ${p6?.publik}`);
      // P7: the learner's card and print — the open-review rule alone, a clean credential
      const p7 = jalankan(new Checks(), repoRoot, keliru([tanam("public.sertifikat_saya_ditinjau(uuid)", "public.sertifikat_dipersoalkan(", "public.sertifikat_ditinjau(")]));
      c.expect(p7 !== null && p7.murid !== "true", `P7 (the learner's card and print) must be caught: answered ${p7?.murid}`);
      return c.verdict("S-2: one helper (an open review or a result in force that fails) states validity for the public check, the learner's "
        + "own read (certificate page, card, print) and the staff list and «dikonfirmasi» note: a certificate wrongly CONFIRMED on a failing "
        + "result reads DITINJAU (as issued) everywhere and DICABUT only once revoked; a clean confirmed certificate reads BERLAKU everywhere; "
        + "the OUT signatures are unchanged, the helper is internal, assert_public_surface passes; the plants P5, P6 and P7 are caught");
    },
  },
  {
    id: "CI1-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      let mig = "";
      try { mig = readFileSync(join(repoRoot, MIGRASI_CI1), "utf8"); } catch { /* checked below */ }
      c.expect(mig.length > 0, `${MIGRASI_CI1} is the migration`);
      // the migration writes no rows: outside the function bodies and the assertion blocks, no insert, update or delete
      const luar = mig.replace(/--[^\n]*/g, "").replace(/\$([a-z_]*)\$[\s\S]*?\$\1\$/g, "");
      c.expect(!/\b(insert\s+into|update\s+[a-z_.]+\s+set|delete\s+from|truncate)\b/i.test(luar), "the migration writes rows outside a function body");
      c.expect(/koreksi_tolak\('CERT_REVIEW_RESULT_NO_LONGER_PASSES'\)/.test(mig) && mig.includes(`when '${KODE}'`), "the S-1 refusal and its message in koreksi_tolak");
      // the code is the contract's and has its own words, so Konfigurasi shows it by name
      c.expect((KODE_KOREKSI_DB as readonly string[]).includes(KODE), `${KODE} is in KODE_KOREKSI_DB`);
      c.expect(kodeKoreksiDariGalat({ code: "PR190", details: KODE }) === KODE, "kodeKoreksiDariGalat names the new refusal");
      const kunci = kunciKodeKoreksi(KODE);
      const id = t(kunci, "staff", { locale: "id" }), en = t(kunci, "staff", { locale: "en" });
      c.expect(kunci === "studio.koreksi.galat.cert_review_result_no_longer_passes" && id !== kunci && en !== kunci && id !== en && id.length > 20,
        `the refusal's own words in ID and EN: «${id}» / «${en}»`);
      const halaman = readFileSync(join(repoRoot, "src/app/konfigurasi/sertifikat/page.tsx"), "utf8");
      c.expect(/s\(kunciKodeKoreksi\(kodeTinjau\)\)/.test(halaman) && /KODE_KOREKSI\.includes\(sp\.kode/.test(halaman), "Konfigurasi shows a refused decision by its code's words");
      c.expect(/rpc\("sertifikat_dipersoalkan_sekolah"/.test(halaman), "Konfigurasi reads the staff list's validity from sertifikat_dipersoalkan_sekolah");
      c.expect((halaman.match(/dipersoalkan\.has\(/g) ?? []).length >= 2, "both the list's pill and the selected certificate's state read the helper's set");
      return c.verdict(`the migration writes no rows; S-1's refusal is ${KODE}, the contract's, with its own words in ID («${id}») and EN, `
        + "so Konfigurasi shows it by name; the list's pill and the selected certificate's state read sertifikat_dipersoalkan_sekolah");
    },
  },
];
