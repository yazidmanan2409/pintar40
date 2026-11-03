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
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, type HleEvent } from "../src/lib/hle";
import { KODE_CABUT, KEADAAN_SERTIFIKAT } from "../src/lib/sertifikat-cabut-kontrak";
import { JUDUL_HALAMAN } from "../src/lib/judul-halaman";

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
];
