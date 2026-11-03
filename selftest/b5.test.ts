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
import { KODE_CABUT, KEADAAN_SERTIFIKAT } from "../src/lib/sertifikat-cabut-kontrak";
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
      c.expect(/dipilih\.status === "ISSUED" \? \(\s*<FormCabut /.test(halaman), "the panel does not offer the revocation form for an issued certificate");
      c.expect(/messageKey="sertifikat\.kelola\.ditolak"/.test(halaman), "a reader the database refuses does not get the one refusal page");
      c.expect(!/service_role|SERVICE_ROLE|supabaseAdmin|createClient\(/.test(halaman), "the page reaches for the service key");

      const form = kode(baca(ctx.repoRoot, "src/components/sertifikat/FormCabut.tsx"));
      c.expect(/action=\{cabutSertifikatAksi\}/.test(form), "the form does not post to cabutSertifikatAksi");
      c.expect(/<textarea id="cabut-alasan" name="alasan"[^>]*required/.test(form), "the reason is not a required field of the form");
      c.expect(/onClick=\{\(\) => \{ if \(form\.current\?\.reportValidity\(\)\) setYakin\(true\); \}\}/.test(form) && /type="button"[^>]*className="pin-btn pin-primary"/.test(form),
        "«Lanjutkan» is not a plain button that only shows the confirmation once the reason is written");
      c.expect(/className="pin-konfirmasi pin-konfirmasi-bahaya" role="group" aria-labelledby="cabut-tanya"/.test(form),
        "the confirmation is not the destructive in-page Confirmation, named by its question");
      c.expect(/<TombolKirim className="pin-btn pin-bahaya-pasti"[^>]*>\s*\{s\("sertifikat\.cabut\.tombol"\)\.replace\("\{nomor\}", nomor\)\}/.test(form),
        "the act's button is not the solid red naming the certificate");
      c.expect(/if \(yakin\) batal\.current\?\.focus\(\)/.test(form), "focus does not start on «Batal»");
      c.expect(/sertifikat\.cabut\.aman/.test(form) && /sertifikat\.cabut\.akibat/.test(form), "the confirmation does not say what happens and what stays safe");
      c.expect(!/<Dialog\b|showModal/.test(form), "the revocation uses the Dialog, which holds no form (GQ5)");

      const aksi = kode(baca(ctx.repoRoot, "src/app/konfigurasi/sertifikat/actions.ts"));
      const posKonteks = aksi.indexOf("await wajibDalamKonteks({ sekolah: await sekolahSertifikat(id), atauPlatform: true }, \"cabut\")");
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
];

