/**
 * CI-1b · A PRINTED CERTIFICATE FOLLOWS ITS VALIDITY (L-105, HIGH, Sharon `AUDIT79-L105.md`; Daisy's words
 * `CI1B-KATA.md` @cfc65eb6; the plan of record W4b). App and print stylesheet only: no migration, no rows.
 *
 * Before CI-1b, on main `f1e35bb9`, measured from the rendered PDFs of the learner's own page:
 *   - BERLAKU prints the A4 sheet, with «Periksa keaslian», the QR and the printed link;
 *   - DITINJAU prints the same clean sheet, with nothing to say a review is open;
 *   - DICABUT and DIGANTIKAN print the on-screen card (the name as issued, «Telah dinyatakan memenuhi kriteria
 *     kelulusan …», the course, the date and the number) with no banner, no QR and no link: a revoked or replaced
 *     certificate leaves the printer as a clean, valid-looking credential.
 *
 *   CI1B-K01  the words and the stylesheet. Daisy's keys read word for word in ID and EN (the headings are the public
 *             check's own, `verifikasi.status.*`); the print stylesheet never hides the notice or the review line
 *             (a planted rule that hides one is caught); the notice's parts sit outside every `pin-noprint`; «Cetak»
 *             re-reads the certificate's state before it prints (Daisy's requirement 3).
 *   CI1B-A01  the running app, the learner's own page, as the server renders it, in all four states of one sealed
 *             bootstrap certificate (the review, the replacement and the revocation written past the guards, as
 *             C1W-A02 does, and removed afterwards):
 *               BERLAKU     the sheet, with «Periksa keaslian», the QR and the printed link; no notice, no line;
 *               DITINJAU    Daisy's line, print-only, ahead of the sheet, with the print date; the sheet keeps its QR
 *                           and link;
 *               DICABUT     the notice in place of the certificate: the heading, the statement (number, school, issue
 *                           and revocation dates), «Lembar ini bukan sertifikat.», the QR and the printed link with
 *                           «Periksa keadaannya …», «Dicetak …»; the name as issued and the pass sentence only
 *                           inside `pin-noprint`; no sheet;
 *               DIGANTIKAN  the same, with the replacement's date and never the replacement's number.
 * The rendered PDFs of each state, and the plant that hides the notice in print, are the journeys' (audit/journey.mjs
 * S21i, S21j, S27v): only a real browser lays out print media.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { lit, psql } from "./bob26.test";
import { Komputer } from "./bob29.test";
import { tersusun } from "./konteks-uji";
import { BOOT_SISWA, masuk } from "./c1w-layar.test";
import { t, format, type HleEvent, type Locale } from "../src/lib/hle";
import { tautanCetak } from "../src/lib/sertifikat-lembar";

/** Daisy's words, `CI1B-KATA.md` @cfc65eb6, word for word. */
export const KATA: Record<string, { id: string; en: string }> = {
  "cetak.DICABUT.judul": { id: "Dicabut oleh penerbit", en: "Revoked by the issuer" },
  "cetak.DICABUT.isi": {
    id: "Sertifikat {nomor} diterbitkan oleh {sekolah} pada {tanggal_terbit}, lalu dicabut pada {tanggal_cabut}. Sertifikat ini tidak lagi berlaku dan tidak dapat dipakai sebagai bukti.",
    en: "Certificate {nomor} was issued by {sekolah} on {tanggal_terbit} and revoked on {tanggal_cabut}. It is no longer valid and cannot be used as evidence.",
  },
  "cetak.DIGANTIKAN.judul": { id: "Digantikan sertifikat yang lebih baru", en: "Replaced by a newer certificate" },
  "cetak.DIGANTIKAN.isi": {
    id: "Sertifikat {nomor} diterbitkan oleh {sekolah} pada {tanggal_terbit}, lalu digantikan pada {tanggal_ganti}. Sertifikat ini tidak lagi dipakai. Mintalah sertifikat yang baru kepada pemegangnya.",
    en: "Certificate {nomor} was issued by {sekolah} on {tanggal_terbit} and replaced on {tanggal_ganti}. It is no longer in use. Ask the holder for the new certificate.",
  },
  // Daisy §2: «If the replacement date isn't stored, drop «, lalu digantikan pada {tanggal_ganti}»» (EN the same clause)
  "cetak.DIGANTIKAN.isi_tanpa_tanggal": {
    id: "Sertifikat {nomor} diterbitkan oleh {sekolah} pada {tanggal_terbit}. Sertifikat ini tidak lagi dipakai. Mintalah sertifikat yang baru kepada pemegangnya.",
    en: "Certificate {nomor} was issued by {sekolah} on {tanggal_terbit}. It is no longer in use. Ask the holder for the new certificate.",
  },
  "cetak.bukan_sertifikat": { id: "Lembar ini bukan sertifikat.", en: "This page is not a certificate." },
  "cetak.periksa": { id: "Periksa keadaannya: pindai kode ini atau buka {alamat}.", en: "Check its status: scan this code or open {alamat}." },
  "cetak.tanggal_cetak": { id: "Dicetak {tanggal_cetak}.", en: "Printed {tanggal_cetak}." },
  "cetak.DITINJAU.baris": {
    id: "Sedang ditinjau: sekolah penerbit sedang meninjau sertifikat ini. Pindai kode QR untuk keadaannya saat ini. Dicetak {tanggal_cetak}.",
    en: "Under review: the issuing school is reviewing this certificate. Scan the QR code for its current status. Printed {tanggal_cetak}.",
  },
};
const kata = (k: string, locale: Locale) => t(k as HleEvent, "learner", { locale });
const isi = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (m, k) => v[k] ?? m);

/** The text of a rendered page, entities decoded and spaces collapsed. */
const teks = (html: string) => html.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'")
  .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;| /g, " ").replace(/\s+/g, " ").trim();

/**
 * The page's main column split into what a printer is given and what it is not: every text run, with whether one
 * of its ancestors carries `pin-noprint`, and the elements marked `data-cetak*` with their own text. A tag walk,
 * because the question is about nesting: «the name is printed» means a run of it outside every `pin-noprint`.
 */
export function bagianCetak(html: string): { tercetak: string; tersembunyi: string; tanda: Map<string, string[]> } {
  const h = tersusun(html);
  const awal = h.search(/<main\b/);
  const akhir = h.lastIndexOf("</main>");
  // React's text-boundary comments carry nothing; a block element's edge is where a reader sees a space
  const badan = (awal >= 0 && akhir > awal ? h.slice(awal, akhir) : h).replace(/<!--[\s\S]*?-->/g, "");
  const BLOK = /^(?:p|div|section|article|h[1-6]|li|ul|ol|dl|dt|dd|br|hr|main|header|footer|figure|table|tr|td|th)$/i;
  const KOSONG = /^(?:area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr|path|rect|circle|line|polyline|polygon|stop|use)$/i;
  const tumpukan: Array<{ nama: string; noprint: boolean; tanda: string | null; teks: string[] }> = [];
  let tercetak = "", tersembunyi = "";
  const tanda = new Map<string, string[]>();
  for (const m of badan.matchAll(/<\/?([a-zA-Z][\w-]*)\b([^>]*?)(\/?)>|([^<]+)/g)) {
    if (m[4] !== undefined) {
      const run = m[4];
      const disembunyikan = tumpukan.some((e) => e.noprint);
      if (disembunyikan) tersembunyi += run; else tercetak += run;
      for (const e of tumpukan) if (e.tanda) e.teks.push(run);
      continue;
    }
    const [, nama, attr, tutupSendiri] = m;
    if (BLOK.test(nama)) { tercetak += " "; tersembunyi += " "; for (const e of tumpukan) if (e.tanda) e.teks.push(" "); }
    if (m[0].startsWith("</")) {
      const i = tumpukan.map((e) => e.nama).lastIndexOf(nama.toLowerCase());
      if (i < 0) continue;
      for (const e of tumpukan.splice(i)) if (e.tanda) tanda.set(e.tanda, [...(tanda.get(e.tanda) ?? []), teks(e.teks.join(""))]);
      continue;
    }
    if (tutupSendiri || KOSONG.test(nama)) {
      const t0 = /\b(data-cetak[\w-]*)(?:="([^"]*)")?/.exec(attr);
      if (t0) tanda.set(t0[2] ? `${t0[1]}=${t0[2]}` : t0[1], [...(tanda.get(t0[2] ? `${t0[1]}=${t0[2]}` : t0[1]) ?? []), ""]);
      continue;
    }
    const kelas = /\bclass="([^"]*)"/.exec(attr)?.[1] ?? "";
    const t0 = /\b(data-cetak[\w-]*)(?:="([^"]*)")?/.exec(attr);
    tumpukan.push({ nama: nama.toLowerCase(), noprint: /(?:^|\s)pin-noprint(?:\s|$)/.test(kelas), tanda: t0 ? (t0[2] ? `${t0[1]}=${t0[2]}` : t0[1]) : null, teks: [] });
  }
  return { tercetak: teks(tercetak), tersembunyi: teks(tersembunyi), tanda };
}

/** The print-media rules of a stylesheet: the bodies of its `@media print` blocks, brace-matched. */
export function aturanCetak(css: string): string {
  const tanpaKomentar = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let out = "";
  for (const m of tanpaKomentar.matchAll(/@media\s+print\s*\{/g)) {
    let d = 1, i = (m.index ?? 0) + m[0].length;
    const a = i;
    while (i < tanpaKomentar.length && d > 0) { if (tanpaKomentar[i] === "{") d++; else if (tanpaKomentar[i] === "}") d--; i++; }
    out += tanpaKomentar.slice(a, i - 1) + "\n";
  }
  return out;
}
/** A print rule that hides one of the printed state's parts: a selector naming it, with display:none or visibility:hidden. */
export function cetakDisembunyikan(css: string): string[] {
  const out: string[] = [];
  for (const m of aturanCetak(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const pilih = m[1].trim(), badan = m[2];
    if (!/display\s*:\s*none|visibility\s*:\s*hidden/.test(badan)) continue;
    if (/data-cetak|pin-cetak/.test(pilih) && !/:not\(/.test(pilih)) out.push(pilih);
  }
  return out;
}

const baca = (root: string, f: string) => { try { return readFileSync(join(root, f), "utf8"); } catch { return ""; } };

export const ci1bTests: SelfTest[] = [
  {
    id: "CI1B-K01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // 1. Daisy's words, word for word, in both languages
      for (const [k, v] of Object.entries(KATA)) {
        c.expect(kata(k, "id") === v.id, `${k} (ID) is «${kata(k, "id")}», not Daisy's «${v.id}»`);
        c.expect(kata(k, "en") === v.en, `${k} (EN) is «${kata(k, "en")}», not Daisy's «${v.en}»`);
      }
      // the headings are the public check's own terms (Daisy: «Terms are the public check's own»)
      for (const s of ["DICABUT", "DIGANTIKAN"] as const) for (const l of ["id", "en"] as const) {
        c.expect(kata(`cetak.${s}.judul`, l) === t(`verifikasi.status.${s}` as HleEvent, "public", { locale: l }),
          `cetak.${s}.judul (${l}) is not the public check's verifikasi.status.${s}`);
      }
      // 2. the print stylesheet never hides the printed state, and the check sees a planted rule that would
      const css = baca(repoRoot, "src/app/experience.css");
      c.expect(css.length > 0, "src/app/experience.css is not readable");
      c.expect(cetakDisembunyikan(css).length === 0, `the print stylesheet hides the printed state: ${cetakDisembunyikan(css).join(" | ")}`);
      const tanam = `${css}\n@media print { [data-cetak-pemberitahuan] { display: none !important; } }`;
      c.expect(cetakDisembunyikan(tanam).length === 1, "the check cannot see a planted print rule hiding the notice");
      c.expect(cetakDisembunyikan(`${css}\n@media print { .pin-cetak-ditinjau { visibility: hidden; } }`).length === 1,
        "the check cannot see a planted print rule hiding the review line");
      // the notice and the line are print-only on purpose: shown in print by a rule of their own
      const cetak = aturanCetak(css);
      c.expect(/\.pin-cetak-saja\b[^{}]*\{[^}]*display\s*:\s*(?:block|grid|flex)/.test(cetak),
        "no print rule shows the print-only parts (.pin-cetak-saja)");
      c.expect(/\.pin-cetak-saja\b[^{}]*\{[^}]*display\s*:\s*none/.test(css.replace(/@media\s+print\s*\{[\s\S]*?\n\}/g, "")),
        "the print-only parts are not hidden on screen (.pin-cetak-saja)");
      // 3. Daisy's requirement 3: the print is decided by the state at print time; «Cetak» re-reads it first
      const aksi = baca(repoRoot, "src/components/sertifikat/AksiCetak.tsx");
      c.expect(/router\.refresh\(\)/.test(aksi) && /useRouter/.test(aksi), "«Cetak» prints the state the page loaded with: it does not re-read it (router.refresh) before printing");
      const halaman = baca(repoRoot, "src/app/belajar/[tugas]/sertifikat/page.tsx");
      c.expect(/data-cetak-pemberitahuan/.test(halaman) || /PemberitahuanCetak/.test(halaman), "the certificate page renders no printed notice");
      c.expect(/data-cetak-ditinjau/.test(halaman) || /BarisDitinjauCetak/.test(halaman), "the certificate page renders no printed review line");
      return c.verdict("Daisy's CI-1b words read word for word in ID and EN, the headings the public check's own; no print rule hides the "
        + "notice or the review line (planted rules caught), and the print-only parts are hidden on screen and shown in print; «Cetak» "
        + "re-reads the certificate before it prints; the page renders the notice and the line");
    },
  },
  {
    id: "CI1B-A01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      // the fixture: one sealed bootstrap certificate (the product's own functions), its states written past the guards
      const BOOT = "(select id from public.institutions where official_evidence_purpose = 'D1_ENGINEERING_BOOTSTRAP')";
      const bersih = () => psql(`begin; set local session_replication_role = replica;
        delete from public.certificate_reviews where institution_id in ${BOOT};
        delete from public.key_corrections where institution_id in ${BOOT} and reason like 'CI1B-A01%';
        commit; select selftest.purge_certificates();`);
      try {
        bersih();
        const pre = JSON.parse(psql(`select row_to_json(t) from (select x.certificate_id, x.canonical_payload, s.sesi from (select selftest.boot_attempt(true) as sesi) s,
            lateral public.certificate_prepare(s.sesi, 1::smallint) x) t`)) as { certificate_id: string; canonical_payload: Record<string, unknown>; sesi: string };
        const { signWithKey } = await import("../src/lib/certificates/sign");
        psql(`select public.certificate_seal(${lit(pre.certificate_id)}, 1::smallint, ${lit(signWithKey(pre.canonical_payload as never, process.env.CERT_SECRET_KEY_V1 ?? ""))})`);
        const cert = pre.certificate_id;
        const fakta = JSON.parse(psql(`select row_to_json(t) from (select c.certificate_number as nomor, c.verification_token as token, c.issued_at_iso as terbit,
            c.institution_as_issued as sekolah, c.institution_id as inst, s.name_as_issued as nama, coalesce(i.zona_waktu::text, 'Asia/Jakarta') as zona
            from public.certificates c join public.certificate_identity_snapshots s on s.id = c.snapshot_id join public.institutions i on i.id = c.institution_id
           where c.id = ${lit(cert)}) t`)) as { nomor: string; token: string; terbit: string; sekolah: string; inst: string; nama: string; zona: string };
        const url = `${asal}/verifikasi/${encodeURIComponent(fakta.token)}`;
        const tgl = (iso: string) => format.date(iso, "id", fakta.zona);
        const hariIni = tgl(new Date().toISOString());
        const siswa0 = await masuk(asal, BOOT_SISWA, "BELAJAR");
        if (!c.expect(typeof siswa0 !== "string", String(siswa0))) return c.verdict("");
        const siswa = siswa0 as Komputer;
        const daftar = await (await siswa.halaman("/belajar/sertifikat")).text();
        const tugas = /href="\/belajar\/([0-9a-f-]{36})\/sertifikat"/.exec(tersusun(daftar))?.[1];
        if (!c.expect(Boolean(tugas), "the learner's list does not link the certificate")) return c.verdict("");
        const buka = async () => bagianCetak(await (await siswa.halaman(`/belajar/${tugas}/sertifikat`)).text());
        const LULUS = "Telah dinyatakan memenuhi kriteria kelulusan";
        const periksaArti = kata("sertifikat.periksa.arti", "id");

        // ---- BERLAKU: the sheet with «Periksa keaslian», its QR and its printed link; no notice, no line
        const b = await buka();
        c.expect(b.tercetak.includes(fakta.nama) && b.tercetak.includes(LULUS), "BERLAKU: the printed part does not carry the credential");
        c.expect(b.tercetak.includes(kata("sertifikat.periksa.judul", "id")) && b.tercetak.includes(periksaArti) && b.tercetak.includes(tautanCetak(url)),
          "BERLAKU: the printed part has no «Periksa keaslian» with its sentence and the printed link");
        c.expect(![...b.tanda.keys()].some((k) => k.startsWith("data-cetak-pemberitahuan") || k === "data-cetak-ditinjau"),
          `BERLAKU: a notice or a review line is rendered (${[...b.tanda.keys()].join(", ")})`);

        // ---- DITINJAU: an open review (C1W-A02's fixture)
        psql(`do $$ declare v_r uuid; v_k uuid; v_item uuid; v_s uuid := ${lit(pre.sesi)}; begin
            select id into v_r from public.assessment_results where session_id = v_s and supersedes_result_id is null;
            select p.item_id into v_item from public.presented_items p where p.session_id = v_s order by p.position limit 1;
            set local session_replication_role = replica;
            insert into public.key_corrections (institution_id, line_root_course_id, asked_item_id, item_id, course_id, release_id, question_digest, key_before, key_after,
                                                reason, proposed_by_person_id, status, decided_at, decided_by_person_id)
            select ${lit(fakta.inst)}, r.course_id, v_item, v_item, r.course_id, r.id, 'x', '{A}', '{B}', 'CI1B-A01 kunci tertukar',
                   (select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'boot-admin@bootstrap.pintar.test'),
                   'CONFIRMED', now(),
                   (select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'boot-kaprodi@bootstrap.pintar.test')
              from public.assessment_sessions s join public.plp_releases r on r.id = s.plp_release_id where s.id = v_s returning id into v_k;
            insert into public.certificate_reviews (certificate_id, institution_id, session_id, opened_by_result_id, previous_result_id, key_correction_id)
            values (${lit(cert)}, ${lit(fakta.inst)}, v_s, v_r, v_r, v_k);
          end $$`);
        const d = await buka();
        const baris = isi(kata("cetak.DITINJAU.baris", "id"), { tanggal_cetak: hariIni });
        c.expect((d.tanda.get("data-cetak-ditinjau") ?? []).some((x) => x === baris),
          `DITINJAU: no printed line «${baris}» (got ${JSON.stringify(d.tanda.get("data-cetak-ditinjau") ?? null)})`);
        c.expect(d.tercetak.includes(baris) && d.tercetak.indexOf(baris) < d.tercetak.indexOf(fakta.nama),
          "DITINJAU: the line is not printed, or not ahead of the certificate");
        c.expect(d.tercetak.includes(tautanCetak(url)) && d.tercetak.includes(periksaArti), "DITINJAU: the sheet no longer prints its QR's link and sentence");
        psql(`begin; set local session_replication_role = replica; delete from public.certificate_reviews where certificate_id = ${lit(cert)};
          delete from public.key_corrections where reason like 'CI1B-A01%'; commit`);

        // the notice, as both states print it
        const pemberitahuan = (s: "DICABUT" | "DIGANTIKAN", hal: ReturnType<typeof bagianCetak>, kalimat: string, judul: string) => {
          const n = (hal.tanda.get(`data-cetak-pemberitahuan=${s}`) ?? []).join(" ");
          c.expect(n.length > 0, `${s}: no printed notice (data-cetak-pemberitahuan="${s}")`);
          for (const [apa, k] of [["heading", judul], ["statement", kalimat], ["plain fact", kata("cetak.bukan_sertifikat", "id")],
            ["check line", isi(kata("cetak.periksa", "id"), { alamat: tautanCetak(url) })], ["print date", isi(kata("cetak.tanggal_cetak", "id"), { tanggal_cetak: hariIni })]] as const) {
            c.expect(n.includes(k), `${s}: the notice has no ${apa} «${k}» (got «${n.slice(0, 400)}»)`);
          }
          c.expect(hal.tanda.has("data-cetak-qr"), `${s}: the notice prints no QR`);
          c.expect(!hal.tercetak.includes(fakta.nama) && !hal.tercetak.includes(LULUS),
            `${s}: the name as issued or the pass sentence reaches the printer («${hal.tercetak.slice(0, 300)}»)`);
          c.expect(hal.tersembunyi.includes(fakta.nama), `${s}: the on-screen card is gone (it stays on screen, out of print)`);
          c.expect(!hal.tercetak.includes(kata("sertifikat.periksa.arti", "id")), `${s}: «… masih berlaku» reaches the printer`);
        };

        // ---- DIGANTIKAN: a replacement supersedes it; its number never printed
        const pengganti = JSON.parse(psql(`begin; set local session_replication_role = replica;
          with b as (insert into public.certificates (session_id, person_id, institution_id, snapshot_id, certificate_number, verification_token, status, issued_at, issued_at_iso,
              canonical_payload, signature, key_version, supersedes_certificate_id, institution_as_issued, course_subject_as_issued, course_title_as_issued, language_as_issued)
            select session_id, person_id, institution_id, snapshot_id, certificate_number || 'CI1B', replace(replace(rtrim(encode(gen_random_bytes(32), 'base64'), '='), '+', '-'), '/', '_'),
                   'ISSUED', now() + interval '1 day', to_char((now() + interval '1 day') at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), canonical_payload, signature, key_version, id,
                   institution_as_issued, course_subject_as_issued, course_title_as_issued, language_as_issued
              from public.certificates where id = ${lit(cert)} returning id, certificate_number, issued_at_iso)
          select row_to_json(b) from b;
          update public.certificates set status = 'SUPERSEDED' where id = ${lit(cert)}; commit;`).split("\n").find((l) => l.startsWith("{")) ?? "{}") as { id: string; certificate_number: string; issued_at_iso: string };
        const g = await buka();
        pemberitahuan("DIGANTIKAN", g, isi(kata("cetak.DIGANTIKAN.isi", "id"), { nomor: fakta.nomor, sekolah: fakta.sekolah, tanggal_terbit: tgl(fakta.terbit), tanggal_ganti: tgl(pengganti.issued_at_iso) }),
          kata("cetak.DIGANTIKAN.judul", "id"));
        c.expect(!g.tercetak.includes(pengganti.certificate_number), "DIGANTIKAN: the replacement's number reaches the printer");
        psql(`begin; set local session_replication_role = replica; delete from public.certificates where id = ${lit(pengganti.id)};
          update public.certificates set status = 'ISSUED' where id = ${lit(cert)}; commit`);

        // ---- DICABUT
        psql(`begin; set local session_replication_role = replica;
          update public.certificates set status = 'REVOKED', revoked_at = now(), revoked_reason = 'CI1B-A01 diterbitkan untuk murid yang salah' where id = ${lit(cert)}; commit`);
        const r = await buka();
        const dicabut = psql(`select to_char(revoked_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') from public.certificates where id = ${lit(cert)}`);
        pemberitahuan("DICABUT", r, isi(kata("cetak.DICABUT.isi", "id"), { nomor: fakta.nomor, sekolah: fakta.sekolah, tanggal_terbit: tgl(fakta.terbit), tanggal_cabut: tgl(dicabut) }),
          kata("cetak.DICABUT.judul", "id"));
        c.expect(!r.tercetak.includes("CI1B-A01"), "DICABUT: the revocation's reason reaches the printer");
        return c.verdict("the learner's own page, as the server renders it, in all four states of one sealed certificate: BERLAKU prints the sheet "
          + "with «Periksa keaslian», its QR and link and nothing else; DITINJAU prints Daisy's line with the print date ahead of the sheet, "
          + "which keeps its QR and link; DICABUT and DIGANTIKAN print only the notice (the public check's heading, the statement with the "
          + "number, school and dates, «Lembar ini bukan sertifikat.», the QR and the printed link, «Dicetak …»), never the name, the pass "
          + "sentence, the replacement's number or the reason; the card stays on screen");
      } finally {
        try { bersih(); } catch { /* the F04 suite purges again */ }
      }
    },
  },
];
