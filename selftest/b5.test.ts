/**
 * BATCH 5 · REPORTS, LEARNER WORKFLOWS AND ASSESSMENT INTEGRITY (owner, 3 Nov: «Batch 5 development GO»). The lead's
 * items; the parallel streams' guards are in b5a/b5b/b5c.test.ts. Each guard is RED on the code Batch 4 closed with
 * (807c427) and GREEN after Batch 5.
 *
 *  B5-CABUT-K01  W2.5 (CR-05, ADM-18, J8.5) · the source: «Sertifikat sekolah» (/konfigurasi/sertifikat) lists the
 *                database's own read (sertifikat_sekolah) as the Collection; «Cabut» opens the certificate's panel; the
 *                revocation is Daisy's form page with the in-page destructive Confirmation (GQ5: never the Dialog) —
 *                the reason first, «Lanjutkan» commits nothing, the act's button is the solid red and names the
 *                certificate, focus starts on «Batal», and the panel says what stays safe; the action checks the
 *                certificate's school against the working context, then asks revoke_certificate with the caller's
 *                own client (no service key); every refusal code has its sentence in both languages; Konfigurasi
 *                links the page; the page has its title.
 *  B5-INTEGRITAS-K01  W2.7 (CR-75, CR-76, CR-77; J7.6) · the source: Tinjauan Integritas gives each waiting observation
 *                its own form (one decision per observation, never the sitting's newest only), with a labelled note;
 *                a sitting is named by its learner first and the PINTAR ID beneath, with its state as a badge in
 *                words; «Sudah ditinjau» lists integrity_reviews_recorded (decision, who, when, note), paged; a
 *                referred observation carries the case's named steps and, once decided, its outcome, time and note,
 *                only where the database shows the case; the next-step sentence follows the case (another leader,
 *                nobody yet (CR-76), a leader handling it, the outcome); every word in both languages.
 *  B5-TUNGGU-K01 W2.10 (CR-49, D-153) · the source: Aktivasi reads the people waiting for an account a page of 20 from the
 *                database (persons_awaiting_account_page), narrowed to the context's school, searched by the words in
 *                the address, with the total and the pager keeping the words; never persons_awaiting_account whole; the
 *                search resets to the first page; every word in both languages.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, type HleEvent } from "../src/lib/hle";
import { KODE_CABUT, KEADAAN_SERTIFIKAT, KODE_GANTI, KODE_GANTI_DB, kodeGantiDariGalat } from "../src/lib/sertifikat-cabut-kontrak";
import { KODE_AKUN, KODE_AKUN_DB, KATEGORI_TANGGUH, JENIS_PERMINTAAN, KEADAAN_PERMINTAAN, kodeAkunDariGalat } from "../src/lib/akun-kontrak";
import { KODE_STAF, KODE_STAF_DB, KATEGORI_AKHIR, TANGGUNG_JAWAB, kodeStafDariGalat, kunciTanggungJawab } from "../src/lib/staf-kontrak";
import { JUDUL_HALAMAN } from "../src/lib/judul-halaman";
import { langkahRujukan } from "../src/lib/integritas-kontrak";

const baca = (root: string, p: string) => { try { return readFileSync(join(root, p), "utf8"); } catch { return ""; } };
/** Source without its comments, so a comment cannot satisfy a guard. */
const kode = (x: string) => x.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
/** A key has its own words in both languages (never the dash for a missing row, never the same English as Indonesian by accident). */
const duaBahasa = (k: string) => {
  const id = t(k as HleEvent, "staff", { locale: "id" }), en = t(k as HleEvent, "staff", { locale: "en" });
  return id.length > 1 && en.length > 1 && id !== "—" && en !== "—";
};

export const b5Tests: SelfTest[] = [
  {
    id: "B5-CABUT-K01",
    run: async (ctx) => {
      const c = new Checks();
      const halaman = kode(baca(ctx.repoRoot, "src/app/konfigurasi/sertifikat/page.tsx"));
      if (!c.expect(halaman.length > 0, "there is no «Sertifikat sekolah» page (src/app/konfigurasi/sertifikat/page.tsx)")) {
        return c.verdict("");
      }
      c.expect(/rpc\("sertifikat_sekolah", \{ p_sekolah: lingkup, p_cari: cari \|\| null, p_hal: hal, p_id: null \}\)/.test(halaman),
        "the page does not list the database's own read of the school's certificates, searched and paged");
      c.expect(/<Koleksi\b[\s\S]*jalan="\/konfigurasi\/sertifikat"/.test(halaman), "the certificates are not Daisy's Collection");
      c.expect(/c\.status === "ISSUED"\s*\?\s*<Link[^>]*href=\{tautanPilih\(c\.id\)\}/.test(halaman),
        "«Cabut» is not offered on an issued certificate only");
      c.expect(/rpc\("sertifikat_sekolah", \{ p_sekolah: lingkup, p_cari: null, p_hal: 1, p_id: pilih \}\)/.test(halaman),
        "the chosen certificate is not read again by id under the same rule");
      // RESTATED for W2.22 (owner, 9 Nov): an issued certificate's panel now holds «Cabut» and «Terbitkan ulang» together
      // (a fragment); the property is the same: the revocation form is offered for an issued certificate
      c.expect(/dipilih\.status === "ISSUED" \? \(\s*(?:<>\s*)?<FormCabut /.test(halaman), "the panel does not offer the revocation form for an issued certificate");
      c.expect(/messageKey="sertifikat\.kelola\.ditolak"/.test(halaman), "a reader the database refuses does not get the one refusal page");
      c.expect(!/service_role|SERVICE_ROLE|supabaseAdmin|createClient\(/.test(halaman), "the page reaches for the service key");

      const form = kode(baca(ctx.repoRoot, "src/components/sertifikat/FormCabut.tsx"));
      c.expect(/action=\{cabutSertifikatAksi\}/.test(form), "the form does not post to cabutSertifikatAksi");
      c.expect(/<textarea id="cabut-alasan" name="alasan"[^>]*required/.test(form), "the reason is not a required field of the form");
      c.expect(/onClick=\{\(\) => \{ if \(form\.current\?\.reportValidity\(\)\) setYakin\(true\); \}\}/.test(form) && /type="button"[^>]*className="pin-btn pin-bahaya"/.test(form), // restated for Daisy F2 (8 Nov): the opener of a destructive act is red words, «red twice»
        "«Lanjutkan» is not a plain button that only shows the confirmation once the reason is written");
      c.expect(/className="pin-konfirmasi pin-konfirmasi-bahaya" role="group" aria-labelledby="cabut-tanya"/.test(form),
        "the confirmation is not the destructive in-page Confirmation, named by its question");
      c.expect(/<TombolKirim className="pin-btn pin-bahaya-pasti"[^>]*>\s*\{s\("sertifikat\.cabut\.tombol"\)\.replace\("\{nomor\}", nomor\)\}/.test(form),
        "the act's button is not the solid red naming the certificate");
      c.expect(/if \(yakin\) batal\.current\?\.focus\(\)/.test(form), "focus does not start on «Batal»");
      c.expect(/sertifikat\.cabut\.aman/.test(form) && /sertifikat\.cabut\.akibat/.test(form), "the confirmation does not say what happens and what stays safe");
      c.expect(!/<Dialog\b|showModal/.test(form), "the revocation uses the Dialog, which holds no form (GQ5)");

      const aksi = kode(baca(ctx.repoRoot, "src/app/konfigurasi/sertifikat/actions.ts"));
      // RESTATED FOR E-K4: the context check also keeps the certificate (`pilih`) for the page it returns to
      const posKonteks = aksi.indexOf("await wajibDalamKonteks({ sekolah: await sekolahSertifikat(id), atauPlatform: true }, \"cabut\", { pilih: id })");
      const posCabut = aksi.indexOf("rpc(\"revoke_certificate\", { p_certificate: id, p_reason: alasan })");
      c.expect(posKonteks > 0 && posCabut > posKonteks, "the action does not check the certificate's school against the working context before revoke_certificate");
      c.expect(/const supabase = await supabaseServer\(\);/.test(aksi) && !/service_role|SERVICE_ROLE|supabaseAdmin/.test(aksi),
        "the revocation is not asked with the caller's own client");

      for (const k of KODE_CABUT) c.expect(duaBahasa(`sertifikat.cabut.gagal.${k}`), `the refusal ${k} has no sentence in both languages`);
      for (const k of KEADAAN_SERTIFIKAT) c.expect(duaBahasa(`sertifikat.kelola.keadaan.${k}`), `the state ${k} has no word in both languages`);
      for (const k of ["sertifikat.cabut.tanya", "sertifikat.cabut.akibat", "sertifikat.cabut.aman", "sertifikat.cabut.tombol", "sertifikat.cabut.ok", "sertifikat.cabut.batal"]) {
        c.expect(duaBahasa(k), `${k} has no words in both languages`);
      }
      c.expect(t("sertifikat.cabut.tombol", "staff", { locale: "id" }).includes("{nomor}"), "the act's button does not name the certificate");

      const konfigurasi = kode(baca(ctx.repoRoot, "src/app/konfigurasi/page.tsx"));
      c.expect(/<ItemNav href="\/konfigurasi\/sertifikat" label=\{s\("sertifikat\.kelola\.judul"\)\} \/>/.test(konfigurasi), "Konfigurasi does not link «Sertifikat sekolah»");
      c.expect(JUDUL_HALAMAN["/konfigurasi/sertifikat"]?.kunci === "sertifikat.kelola.judul", "the page has no title of its own");
      return c.verdict("«Sertifikat sekolah» lists sertifikat_sekolah as the Collection; «Cabut» on issued certificates opens the panel; the form page "
        + "asks the reason, «Lanjutkan» commits nothing, the destructive in-page confirmation names the certificate, starts on «Batal» "
        + "and says what stays safe; the action checks the context, then revoke_certificate with the caller's client; every code and "
        + "state has words in both languages; Konfigurasi links it and it has its title");
    },
  },
  {
    id: "B5-INTEGRITAS-K01",
    run: async (ctx) => {
      const c = new Checks();
      const p = kode(baca(ctx.repoRoot, "src/app/studio/integritas/page.tsx"));
      c.expect(/\{group\.map\(\(g\) => \([\s\S]*?<form action=\{recordIntegrityReviewAction\} id=\{`integritas-sinyal-\$\{g\.id\}`\}[\s\S]*?<input type="hidden" name="sinyal" value=\{g\.id\} \/>/.test(p),
        "each waiting observation does not have its own form posting its own id");
      c.expect(!/value=\{group\[0\]\.id\}/.test(p), "a sitting's form still posts its newest observation only");
      c.expect(/<BidangTeks id=\{`integritas-catatan-\$\{g\.id\}`\} name="catatan"[^>]*label=\{s\("studio\.paket\.catatan"\)\}/.test(p), "the note is not a labelled field");
      c.expect(/persons!assessment_sessions_person_id_fkey\(display_name, pintar_id\)/.test(p) && /<p className="pin-judul-baris">\{n\?\.nama \|\| "(?:—|\\u2014)"\}<\/p>\s*\{n\?\.pintarId \? <p className="pin-meta pin-num">\{n\.pintarId\}<\/p> : null\}/.test(p),
        "a sitting is not named by its learner first with the PINTAR ID beneath");
      c.expect(/studio\.integritas\.keadaan\.menunggu/.test(p) && /studio\.integritas\.keadaan\.ditinjau/.test(p) && /className=\{keadaan === "menunggu" \? "pin-pill pin-attention" : "pin-pill pin-ok"\}/.test(p),
        "a sitting's state is not a badge in words");
      c.expect(/rpc\("integrity_reviews_recorded", \{ p_hal: halTinjau \}\)/.test(p) && /<Penomoran locale=\{locale\} halaman=\{halTinjau\} lagi=\{lagiTinjau\}/.test(p),
        "the reviewed observations are not listed from integrity_reviews_recorded, a page at a time");
      c.expect(/studio\.integritas\.oleh/.test(p) && /studio\.integritas\.catatan_tercatat/.test(p), "a reviewed observation does not say who, when and its note");
      c.expect(/\{g\.case_id \? <Rujukan /.test(p) && /if \(!g\.case_visible\) return <p className="pin-meta" data-rujukan="tersembunyi">/.test(p)
        && /<ol className="pin-tahap" aria-label=\{s\("studio\.integritas\.rujukan\.judul"\)\}>/.test(p) && /aria-current=\{i === kini && g\.case_state !== "DECIDED" \? "step" : undefined\}/.test(p),
        "a referred observation does not carry the case's named steps, or shows a case the database does not show");
      c.expect(/g\.case_state === "DECIDED" && g\.case_outcome \?/.test(p) && /studio\.integritas\.rujukan\.catatan/.test(p), "a decided case does not show its outcome and note");
      // the next step follows the case
      const k = (x: Parameters<typeof langkahRujukan>[0]) => langkahRujukan(x).kalimat;
      c.expect(k({ case_state: "AWAITING_REVIEW", case_outcome: null, case_raised_by_me: true, case_other_decider: true }) === "pimpinan.menunggu_pemutus_lain"
        && k({ case_state: "AWAITING_REVIEW", case_outcome: null, case_raised_by_me: true, case_other_decider: false }) === "pimpinan.belum_ada_pemutus_lain"
        && k({ case_state: "AWAITING_REVIEW", case_outcome: null, case_raised_by_me: false, case_other_decider: null }) === "studio.integritas.rujukan.di_pimpinan"
        && k({ case_state: "UNDER_REVIEW", case_outcome: null, case_raised_by_me: true, case_other_decider: true }) === "studio.integritas.rujukan.sedang"
        && k({ case_state: "DECIDED", case_outcome: "LEARNER_SUPPORT_ARRANGED", case_raised_by_me: true, case_other_decider: true }) === "studio.integritas.rujukan.lanjut.LEARNER_SUPPORT_ARRANGED",
        "the case's next-step sentence does not follow its state (another leader, nobody yet, handling, decided)");
      const kunci = ["studio.integritas.menunggu.judul", "studio.integritas.ditinjau.judul", "studio.integritas.ditinjau.kosong", "studio.integritas.keadaan.menunggu",
        "studio.integritas.keadaan.ditinjau", "studio.integritas.oleh", "studio.integritas.rujukan.tak_terlihat", "studio.integritas.rujukan.sedang", "studio.integritas.rujukan.di_pimpinan",
        ...["diteruskan", "ditinjau", "diputuskan"].map((l) => `studio.integritas.rujukan.langkah.${l}`),
        ...["NO_FURTHER_ACTION", "LEARNER_SUPPORT_ARRANGED", "ESCALATED_TO_INSTITUTION"].flatMap((o) => [`studio.integritas.rujukan.hasil.${o}`, `studio.integritas.rujukan.lanjut.${o}`]),
        ...["NO_CONCERN", "DISCUSSED_WITH_LEARNER", "REFERRED_TO_INSTITUTION"].map((d) => `studio.integritas.${d}`)];
      for (const x of kunci) c.expect(duaBahasa(x), `${x} has no words in both languages`);
      return c.verdict("each waiting observation has its own form and labelled note; a sitting is named by its learner with the PINTAR ID beneath "
        + "and its state as a badge; «Sudah ditinjau» lists integrity_reviews_recorded a page at a time with who, when and the note; a referral "
        + "carries the case's named steps, its outcome and note once decided, only where the database shows the case, and the next step "
        + "follows the case; every word in both languages");
    },
  },
  {
    id: "B5-TUNGGU-K01",
    run: async (ctx) => {
      const c = new Checks();
      const p = kode(baca(ctx.repoRoot, "src/app/aktivasi/page.tsx"));
      c.expect(/rpc\("persons_awaiting_account_page", \{\s*p_sekolah: lingkupTunggu, p_cari: cariTunggu \|\| null, p_hal: halTunggu,\s*\}\)/.test(p),
        "Aktivasi does not read the waiting list a page at a time from the database, narrowed and searched");
      c.expect(!/rpc\("persons_awaiting_account"\)/.test(p), "Aktivasi still reads every waiting person at once");
      c.expect(/const lingkupTunggu = lama \|\| platformIni \? null : sekolahIni \?\? "00000000-0000-0000-0000-000000000000";/.test(p),
        "the waiting list is not narrowed to the working context's school");
      c.expect(/<CariTunggu locale=\{locale\} total=\{totalTunggu\} dicari=\{cariTunggu\} \/>/.test(p) && /<Penomoran locale=\{locale\} halaman=\{halTunggu\} lagi=\{halTunggu \* 20 < totalTunggu\}/.test(p)
        && /if \(cari\) q\.set\("cari_tunggu", cari\);/.test(p), "the waiting list has no total, or its pager drops the search");
      const f = kode(baca(ctx.repoRoot, "src/components/aktivasi/CariTunggu.tsx"));
      c.expect(/useCariDiAlamat\("cari_tunggu", \["hal_tunggu"\]\)/.test(f), "the waiting list's search is not the server's, from the first page");
      const h = kode(baca(ctx.repoRoot, "src/components/aktivasi/cari-pemegang.ts"));
      c.expect(/for \(const x of juga\) q\.delete\(x\);/.test(h), "new search words keep an old page");
      for (const k of ["aktivasi.tunggu.cari", "aktivasi.tunggu.jumlah", "aktivasi.tunggu.cocok", "aktivasi.tunggu.tidak_cocok"]) c.expect(duaBahasa(k), `${k} has no words in both languages`);
      return c.verdict("Aktivasi reads persons_awaiting_account_page a page of 20, narrowed to the context's school and searched by the address's words, "
        + "with the total and a pager that keeps the words; never every waiting person; new words start at page 1; words in both languages");
    },
  },
  {
    // W222-K01 — «TERBITKAN ULANG»: ONE CONTRACT FROM THE MIGRATION TO THE CERTIFICATE PANEL (owner, 9 Nov).
    id: "W222-K01",
    run: async (ctx) => {
      const c = new Checks();
      const sql = baca(ctx.repoRoot, "supabase/migrations/20270113110000_a_certificate_is_corrected_by_its_replacement.sql").replace(/--[^\n]*/g, "");
      const tolak = /create or replace function public\.sertifikat_koreksi_tolak[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
      const dariDb = [...tolak.matchAll(/when '([A-Z_]+)'/g)].map((m) => m[1]).sort();
      c.expect(JSON.stringify(dariDb) === JSON.stringify([...KODE_GANTI_DB].sort()),
        `sertifikat_koreksi_tolak knows ${dariDb.join(",")} and the contract names ${KODE_GANTI_DB.join(",")}`);
      for (const k of KODE_GANTI_DB) {
        c.expect(new RegExp(`sertifikat_koreksi_tolak\\('${k}'\\)`).test(sql.replace(/create or replace function public\.sertifikat_koreksi_tolak[\s\S]*?\$\$;/, "")),
          `no function raises ${k}`);
        c.expect(kodeGantiDariGalat({ code: "PR120", details: k }) === k, `${k} is not read back as itself`);
      }
      c.expect(kodeGantiDariGalat({ code: "PR120", details: "CERT_PLANTED" }) === "LAYANAN_TIDAK_TERSEDIA", "an unknown DETAIL is read as a known code");
      c.expect(kodeGantiDariGalat({ code: "PR110", details: "MAINTENANCE_NO_NEW_START" }) === "LAYANAN_TIDAK_TERSEDIA", "another state's refusal is read as a correction code");
      const MESIN = /CERT_|PR\d{3}|jsonb|uuid|CAN_|INV-|ELIGIBLE|SUPERSEDED/;
      for (const k of KODE_GANTI) {
        for (const l of ["id", "en"] as const) {
          const kunci = `sertifikat.ganti.gagal.${k.toLowerCase()}` as HleEvent;
          let x = ""; try { x = t(kunci, "staff", { locale: l }); } catch { x = ""; }
          c.expect(x.trim() !== "" && x !== kunci, `${kunci} has no ${l} telling`);
          c.expect(!MESIN.test(x), `${kunci} names the machinery in ${l}`);
        }
      }
      // the seal is the server's alone: the route checks the context, prepares with the admin's own client, signs, then seals
      // with the service client (the service client lives under src/app/api only, F01-S03)
      const fungsi = baca(ctx.repoRoot, "src/app/api/sertifikat/ganti/route.ts");
      const i1 = fungsi.indexOf("sasaranDalamKonteks("), i2 = fungsi.indexOf('caller.rpc("sertifikat_koreksi_siapkan"'),
            i3 = fungsi.indexOf("signPayload("), i4 = fungsi.indexOf('supabaseService().rpc("sertifikat_koreksi_segel"');
      c.expect(i1 >= 0 && i2 > i1 && i4 > i2 && i3 > i2,
        "/api/sertifikat/ganti does not check the context, prepare with the admin's own client, sign, then seal with the service client, in that order");
      c.expect(/has_function_privilege\('authenticated', 'public\.sertifikat_koreksi_segel/.test(sql) && /grant execute on function public\.sertifikat_koreksi_segel\(uuid, smallint, text\) to service_role;/.test(sql),
        "the seal is not service-only");
      // the panel: the form only where something differs, the reason 10–300, «Digantikan oleh» on a replaced certificate
      const panel = baca(ctx.repoRoot, "src/components/sertifikat/FormTerbitUlang.tsx");
      c.expect(/pratinjau\.berubah \? \(\s*<form method="post" action="\/api\/sertifikat\/ganti"/.test(panel), "the form is not offered only where something differs");
      c.expect(/name="alasan"[^>]*minLength=\{10\} maxLength=\{300\}/.test(panel), "the reason is not 10–300 characters");
      const halaman = kode(baca(ctx.repoRoot, "src/app/konfigurasi/sertifikat/page.tsx"));
      c.expect(/rpc\("sertifikat_koreksi_pratinjau", \{ p_certificate: dipilih\.id \}\)/.test(halaman), "the panel does not read the database's preview");
      c.expect(/<FormTerbitUlang /.test(halaman) && /sertifikat\.ganti\.digantikan_oleh/.test(halaman), "the panel does not offer «Terbitkan ulang» or say what replaced a certificate");
      return c.verdict("sertifikat_koreksi_tolak's six codes are the contract's, each raised and read back by its PR120 DETAIL (an unknown one and another state's are not), and every screen code has a sentence in both languages naming no machinery; the route /api/sertifikat/ganti checks the context, prepares with the admin's own client, signs, then seals with the service client, and the seal is service-only; the panel reads the database's preview, offers the form only where something differs with a 10–300 reason, and says what replaced a certificate");
    },
  },
  {
    // STAF-K01 — E5 AND §11: ONE CONTRACT FROM THE MIGRATION TO THE PERSON'S PAGE (owner, 9 Nov).
    id: "STAF-K01",
    run: async (ctx) => {
      const c = new Checks();
      const sql = baca(ctx.repoRoot, "supabase/migrations/20270113120000_an_educator_changes_roles_or_leaves_on_the_record.sql").replace(/--[^\n]*/g, "");
      const tolak = /create or replace function public\.staf_tolak[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
      const dariDb = [...tolak.matchAll(/when '([A-Z_]+)'/g)].map((m) => m[1]).sort();
      c.expect(JSON.stringify(dariDb) === JSON.stringify([...KODE_STAF_DB].sort()), `staf_tolak knows ${dariDb.join(",")} and the contract names ${KODE_STAF_DB.join(",")}`);
      const badan = sql.replace(/create or replace function public\.staf_tolak[\s\S]*?\$\$;/, "");
      for (const k of KODE_STAF_DB) {
        c.expect(badan.includes(`staf_tolak('${k}')`), `no function raises ${k}`);
        c.expect(kodeStafDariGalat({ code: "PR130", details: k }) === k, `${k} is not read back as itself`);
      }
      c.expect(kodeStafDariGalat({ code: "PR130", details: "STAFF_PLANTED" }) === "STAFF_FAILED", "an unknown DETAIL is read as a known code");
      // the categories are the function's own list, in its order
      const kat = /p_kategori not in \(([^)]*)\)/.exec(sql)?.[1] ?? "";
      c.expect(JSON.stringify([...kat.matchAll(/'([A-Z_]+)'/g)].map((m) => m[1])) === JSON.stringify([...KATEGORI_AKHIR]), `the categories are ${kat}`);
      const MESIN = /STAFF_|ROLE_|PR\d{3}|jsonb|uuid|CAN_|INV-/;
      const kunci: string[] = [...KODE_STAF.map((k) => `staf.galat.${k.toLowerCase()}`), ...KATEGORI_AKHIR.map((k) => `staf.kategori.${k.toLowerCase()}`), ...TANGGUNG_JAWAB.map(kunciTanggungJawab)];
      for (const k of kunci) {
        for (const l of ["id", "en"] as const) {
          let x = ""; try { x = t(k as HleEvent, "staff", { locale: l }); } catch { x = ""; }
          c.expect(x.trim() !== "" && x !== k, `${k} has no ${l} telling`);
          c.expect(!MESIN.test(x), `${k} names the machinery in ${l}`);
        }
      }
      // every responsibility the registry can name has words: role_capabilities' own codes, read from the migrations
      const semuaSql = readFileSync(join(ctx.repoRoot, "supabase", "migrations", "20260926100000_a_school_gives_a_person_a_number.sql"), "utf8");
      const fungsiCap = /function public\.role_capabilities\([\s\S]*?\$\$;/.exec(semuaSql)?.[0] ?? "";
      c.expect(fungsiCap.length > 0, "the registry's role_capabilities definition was not found");
      for (const cap of new Set([...fungsiCap.matchAll(/'(CAN_[A-Z_]+)'/g)].map((m) => m[1]))) {
        c.expect((TANGGUNG_JAWAB as readonly string[]).includes(cap), `the registry names ${cap} and the page has no words for it`);
      }
      // the page: a GET review answered by ubah_peran with apply false, one POST commitment carrying the fingerprint, and E5
      const aksi = baca(ctx.repoRoot, "src/app/konfigurasi/staf/actions.ts");
      for (const nama of ["akhiriTugasAksi", "ubahPeranAksi"]) {
        const f = new RegExp(`export async function ${nama}[\\s\\S]*?\\n\\}`).exec(aksi)?.[0] ?? "";
        c.expect(f.indexOf("wajibDalamKonteks(") >= 0 && f.indexOf("wajibDalamKonteks(") < f.indexOf("supabase.rpc("), `${nama} does not ask the working context before it acts`);
      }
      c.expect(/p_terapkan: true/.test(aksi) && /p_sidik: teks\(fd, "sidik"\)/.test(aksi), "the commitment does not apply with the review's fingerprint");
      const halaman = kode(baca(ctx.repoRoot, "src/app/konfigurasi/staf/page.tsx"));
      c.expect(/<form method="get" action="\/konfigurasi\/staf"/.test(halaman) && /p_terapkan: false/.test(halaman), "the review is not a GET render answered with apply false");
      c.expect(/<form action=\{ubahPeranAksi\}/.test(halaman) && /name="sidik" value=\{orang\.sidik\}/.test(halaman), "the confirmation does not post the fingerprint to ubahPeranAksi");
      c.expect(/<form action=\{akhiriTugasAksi\}/.test(halaman) && /name="kategori"/.test(halaman) && /id="staf-akhiri-tanggal"[^>]*max=\{hariIni\}/.test(halaman),
        "«Akhiri tugas» has no category or no date bounded by today");
      return c.verdict("staf_tolak's 13 codes are the contract's, each raised and read back by its PR130 DETAIL; the categories are akhiri_tugas_staf's own list and order; every code, category and responsibility (including every capability the registry migration names) has words in both languages naming no machinery; both actions ask the working context before acting; the review is a GET render answered by ubah_peran with apply false, the confirmation posts the fingerprint, and «Akhiri tugas» asks a category and a date no later than today");
    },
  },
  {
    // AKUN-K01 — §5b AND L1–L4: ONE CONTRACT FROM THE MIGRATION TO AKUN SAYA AND KEAMANAN AKUN (owner, 9 Nov).
    id: "AKUN-K01",
    run: async (ctx) => {
      const c = new Checks();
      const sql = baca(ctx.repoRoot, "supabase/migrations/20270113130000_an_account_is_suspended_closed_or_anonymised_on_the_record.sql").replace(/--[^\n]*/g, "");
      const tolak = /create or replace function public\.akun_tolak[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
      const dariDb = [...tolak.matchAll(/when '([A-Z_]+)'/g)].map((m) => m[1]).sort();
      c.expect(JSON.stringify(dariDb) === JSON.stringify([...KODE_AKUN_DB].sort()), `akun_tolak knows ${dariDb.join(",")} and the contract names ${KODE_AKUN_DB.join(",")}`);
      const badan = sql.replace(/create or replace function public\.akun_tolak[\s\S]*?\$\$;/, "");
      for (const k of KODE_AKUN_DB) {
        c.expect(badan.includes(`akun_tolak('${k}')`), `no function raises ${k}`);
        c.expect(kodeAkunDariGalat({ code: "PR140", details: k }) === k, `${k} is not read back as itself`);
      }
      const kat = /p_kategori not in \(([^)]*)\)/.exec(sql)?.[1] ?? "";
      c.expect(JSON.stringify([...kat.matchAll(/'([A-Z_]+)'/g)].map((m) => m[1])) === JSON.stringify([...KATEGORI_TANGGUH]), `the categories are ${kat}`);
      // the per-request check refuses a suspended person's token, whatever the path, and the status read still passes
      c.expect(/coalesce\(v_jalur, ''\) not in \('\/rpc\/pintar_status_saya', '\/rpc\/sesi_akhiri_saya'\)[\s\S]*?orang_ditangguhkan\(v_orang\)[\s\S]*?'AKUN_DITANGGUHKAN'/.test(sql),
        "the per-request check does not refuse a suspended person's token");
      const MESIN = /ACCOUNT_|PR\d{3}|jsonb|uuid|CAN_|INV-|CLOSED_AT_REQUEST/;
      const kunci: string[] = [...KODE_AKUN.map((k) => `akun.tinggal.galat.${k.toLowerCase()}`), ...KATEGORI_TANGGUH.map((k) => `keamanan.akun.kategori.${k.toLowerCase()}`),
        ...JENIS_PERMINTAAN.map((k) => `akun.tinggal.jenis.${k.toLowerCase()}`), ...KEADAAN_PERMINTAAN.map((k) => `akun.tinggal.status.${k.toLowerCase()}`),
        ...["akses", "data", "akademik", "sertifikat", "audit", "cadangan"].map((k) => `akun.tinggal.fakta.${k}`)];
      for (const k of kunci) {
        for (const l of ["id", "en"] as const) {
          let x = ""; try { x = t(k as HleEvent, "staff", { locale: l }); } catch { x = ""; }
          c.expect(x.trim() !== "" && x !== k, `${k} has no ${l} telling`);
          c.expect(!MESIN.test(x), `${k} names the machinery in ${l}`);
        }
      }
      // Akun saya is for everyone; a learner is offered no request form; the closure leaves by signing out
      const akun = kode(baca(ctx.repoRoot, "src/app/akun/page.tsx"));
      c.expect(/if \(!staf\) \{\s*const sl/.test(akun) && /tinggal\("learner"\)/.test(akun), "a learner's Akun saya is not drawn");
      const komponen = baca(ctx.repoRoot, "src/components/akun/MeninggalkanPintar.tsx");
      c.expect(/bisaMinta \? \(/.test(komponen) && /data-tinggal-lewat-sekolah/.test(komponen) && /name="konfirmasi" value="ya" required/.test(komponen),
        "the requests are not one confirmation each, or a learner is offered a form");
      c.expect(/if \(jenis === "CLOSE"\) redirect\("\/keluar/.test(baca(ctx.repoRoot, "src/app/akun/actions.ts")), "a closure does not sign the person out");
      return c.verdict("akun_tolak's 12 codes are the contract's, each raised and read back by its PR140 DETAIL; the suspension's categories are tangguhkan_akun's own; the per-request check refuses a suspended or closed person's token whatever the path while the status read passes; every code, category, request kind and status and the six facts of leaving have words in the copy table in both languages naming no machinery; Akun saya is drawn for a learner, who is offered no form; each request is one confirmation; a closure signs the person out");
    },
  },
];
