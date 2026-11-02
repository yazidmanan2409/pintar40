/**
 * The closure's batch 3 behaviour (D-118 §2, D-120, D-121): what a screen must draw, rendered from the real component
 * before any script runs, or read from the page's own source where it is a server page with a fetch.
 *
 * PENUTUPAN-Q10 — D-121(a): a certificate whose learner passed a school mark below 70% carries no PINTAR descriptor,
 * and its line is absent from the certificate and from the public check, rather than a dash.
 * PENUTUPAN-S01 — CR-02 (D-078(c), D-077(d)): the learner's certificate page draws the school, the course and the
 * certificate's language from the certificate's own seal (my_certificate), never from today's school or assignment.
 * PENUTUPAN-M04 — CR-50 (D-063 M5, D-120 Q9): every chapter of the synthetic corpus in docs/onboarding/konten-sintetis
 * is what the upload page makes of its workbook, and each wrong option names a misconception the same file defines on
 * its «Miskonsepsi» sheet. RESTATED FOR F-4 (D-145(b)): the real chapters, with their keys, left the public tree; the same
 * rules now run on the synthetic corpus, whose size is its own exact count (2 chapters; once at least 20 real ones).
 * PENUTUPAN-E03 — CR-13 (D-120 QN1): the correction route asks the caller's authority before Auth is touched, maps
 * every refusal to its own code, and tells the old and the new address only after activation.
 * PENUTUPAN-D01 — FD-5 (D-129(c)), the half of the round trip outside the database: the workbook's «Mudah», «Sedang» and
 * «Sulit» become 0.3, 0.5 and 0.7 in the package; the band reads them back as their words, and its migration writes no row;
 * the teacher's Uji Cepat choice is labelled with the copy table's word for its band (F21-D01 is the database's half).
 * PENUTUPAN-B01 — CR-90 (D-129(f)): the back-forward reload runs on every computer, whatever its mode. An instrument pin of
 * the invariant L1 landed; its evidence class stays D-129(d)'s («preventive hardening; no pre-change browser reproduction»).
 * PENUTUPAN-T01 — CR-87 (D-127 Q4, Q8; D-129(g)): Studio's tabs by role, from canon; the Uji Cepat launcher and the
 * certificate layout gone (CR-84); a page not the person's sends them to Studio's home.
 * PENUTUPAN-J01 — CR-87 (D-127 Q7): the JSON package import is the platform operator's alone, on the page and in the action.
 * PENUTUPAN-P01 — CR-87 (4), FD-8: Pustaka PINTAR's grant and withdrawal are the operator's alone, chosen by names.
 * PENUTUPAN-I01 — FD-7 (DG-32): Tinjauan Integritas lists what still waits, and offers no referral the server refuses.
 * PENUTUPAN-F01 — FD-9 (D-127 Q8): Aturan Penilaian sets a rule on a chapter still being drafted, in a mode the cycle
 * reads, with the school the chapter's own; the rules move with their chapter; a late rule is refused by name.
 * PENUTUPAN-V01 — CR-84 (3): a refused Studio form reopens with what the person sent.
 * PENUTUPAN-L01 — CR-93, CR-94 (the owner's ruling of 8 Oct): two layouts no longer exceed a 320 px window. A source pin;
 * the browser's proof is the seeded crawl's X.6 (audit/crawl.mjs), which measures every page at 320 px.
 * PENUTUPAN-A01 — CR-13 (D-120 QN1), against the running app, Auth and the mail sink: a wrong email corrected before
 * and after activation, as the platform admin does it, without SQL.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, LOCALES, type HleEvent } from "../src/lib/hle";
import { bacaBukuKerja } from "../src/lib/xlsx";
import { KOLOM, LEMBAR, bukuKerjaKePaket } from "../src/lib/unggah-kontrak";
import { tulisBukuKerja } from "../src/components/unggah/templat";
import { tabStudio, operatorPintar, TAB_STUDIO } from "../src/lib/studio-tab";
import { isianDari, pulihkanIsian, bacaIsian, type Bidang } from "../src/lib/isian";
import { kodeGalatKonten, kunciKode } from "../src/lib/galat-kontrak";
import { lokasiMasalah } from "../src/components/unggah/lokasi";
import { KODE_DARI_DB, STATUS_KOREKSI_EMAIL } from "../src/lib/koreksi-email-kontrak";
import { aktifkan } from "./bob28.test";
import { daftar, ipUji, kodeDari, lit, Peramban, psql, sinkTunggu } from "./bob26.test";
import { pilihKonteksPeramban } from "./konteks-uji";

function gambarKartu(repoRoot: string, kasus: { predikat: string | null; variant: "screen" | "sheet" }[]): { html: string[]; galat: string } {
  const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
    "(async () => {" +
    '  const { createElement: h } = await import("react");' +
    '  const { renderToStaticMarkup } = await import("react-dom/server");' +
    '  const m = await import("file://" + process.cwd() + "/src/components/sertifikat/KartuSertifikat.tsx");' +
    "  const K = m.default?.default ?? m.default;" +
    '  const { readFileSync } = await import("node:fs");' +
    '  const out = JSON.parse(readFileSync(0, "utf8")).map((k) => renderToStaticMarkup(h(K, { locale: "id", variant: k.variant, cred: {' +
    '    institution: "Sekolah Contoh", nameAsIssued: "Bunga Lestari", course: "Matematika · Bab 1", predikat: k.predikat,' +
    '    issuedAtIso: "2026-10-06T00:00:00Z", certificateNumber: "A14CD7ST/00001", verificationUrl: null } })));' +
    "  process.stdout.write(JSON.stringify(out));" +
    "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
    cwd: repoRoot, encoding: "utf8", maxBuffer: 1 << 24, input: JSON.stringify(kasus),
  });
  let html: string[] = [];
  try { html = JSON.parse(anak.stdout); } catch { /* reported by the caller */ }
  return { html, galat: anak.status === 0 && html.length === kasus.length ? "" : (anak.stderr || "no output").split("\n").slice(0, 4).join(" ") };
}

/** Renders a component module's default export once per case (props as JSON; `denganAksi` adds a no-op action). */
function gambar(repoRoot: string, modul: string, kasus: Record<string, unknown>[]): { html: string[]; galat: string } {
  const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
    "(async () => {" +
    '  const { createElement: h } = await import("react");' +
    '  const { renderToStaticMarkup } = await import("react-dom/server");' +
    `  const m = await import("file://" + process.cwd() + ${JSON.stringify("/" + modul)});` +
    "  const K = m.default?.default ?? m.default;" +
    '  const { readFileSync } = await import("node:fs");' +
    '  const out = JSON.parse(readFileSync(0, "utf8")).map((p) => { const { denganAksi, ...q } = p;' +
    "    return renderToStaticMarkup(h(K, denganAksi ? { ...q, aksi: async () => {} } : q)); });" +
    "  process.stdout.write(JSON.stringify(out));" +
    "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
    cwd: repoRoot, encoding: "utf8", maxBuffer: 1 << 24, input: JSON.stringify(kasus),
  });
  let html: string[] = [];
  try { html = JSON.parse(anak.stdout); } catch { /* reported by the caller */ }
  return { html, galat: anak.status === 0 && html.length === kasus.length ? "" : (anak.stderr || "no output").split("\n").slice(0, 4).join(" ") };
}

export const penutupanTests: SelfTest[] = [
  {
    id: "PENUTUPAN-Q10",
    run: async (ctx) => {
      const c = new Checks();
      const label = t("sertifikat.predikat", "learner", { locale: "id" });
      const kasus = [
        { predikat: null, variant: "screen" as const },
        { predikat: null, variant: "sheet" as const },
        { predikat: "Baik", variant: "screen" as const },
        { predikat: "Cukup", variant: "sheet" as const },
      ];
      const { html, galat } = gambarKartu(ctx.repoRoot, kasus);
      c.expect(galat === "", `the certificate could not be rendered: ${galat}`);
      const teks = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (galat === "") {
        kasus.forEach((k, i) => {
          const v = teks(html[i] ?? "");
          const nama = `the ${k.variant} with ${k.predikat ? `«${k.predikat}»` : "no descriptor"}`;
          if (k.predikat) {
            c.expect(v.includes(`${label} ${k.predikat}`), `${nama} does not read «${label} ${k.predikat}»: "${v.slice(0, 200)}"`);
          } else {
            c.expect(!v.includes(label) && !/—/.test(v), `${nama} still draws a descriptor line: "${v.slice(0, 200)}"`);
          }
          c.expect(v.includes("A14CD7ST/00001") && v.includes("Bunga Lestari"), `${nama} lost the rest of the certificate`);
        });
      }
      // the public check is a server page with a fetch: its source draws the descriptor only when there is one
      const cek = readFileSync(join(ctx.repoRoot, "src", "app", "verifikasi", "[token]", "page.tsx"), "utf8");
      c.expect(/\{row!\.predikat \? \(\s*<div>\s*<dt>\{s\("verifikasi\.predikat"\)\}<\/dt>\s*<dd>\{row!\.predikat\}<\/dd>/.test(cek)
        && !/row!\.predikat \?\? "—"/.test(cek), "the public check still draws a descriptor line (or a dash) when there is no descriptor");
      return c.verdict(
        `rendered from the real KartuSertifikat on screen and on the sheet, a certificate with no descriptor has no «${label}» line ` +
        "and no dash, and one with «Baik» or «Cukup» reads it; the public check draws the descriptor only when there is one (D-121(a))");
    },
  },
  {
    id: "PENUTUPAN-S01",
    run: async (ctx) => {
      const c = new Checks();
      const hal = readFileSync(join(ctx.repoRoot, "src", "app", "belajar", "[tugas]", "sertifikat", "page.tsx"), "utf8");
      const tanpaKomentar = hal.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
      c.expect(/const institution = detail\?\.institution_as_issued\s*\?\?/.test(tanpaKomentar),
        "the certificate page does not read the school's name from the certificate's seal first");
      c.expect(/detail\?\.course_title_as_issued/.test(tanpaKomentar) && /const course = sealedCourse \?\?/.test(tanpaKomentar),
        "the certificate page does not read the course from the certificate's seal first");
      c.expect((tanpaKomentar.match(/<KartuSertifikat cred=\{cred\} locale=\{bahasaSertifikat\}/g) ?? []).length === 2
        && /detail\?\.language_as_issued/.test(tanpaKomentar),
        "the certificate (screen and sheet) is not drawn in the language it was issued in");
      const kontrak = readFileSync(join(ctx.repoRoot, "src", "lib", "sertifikat-kontrak.ts"), "utf8");
      c.expect(["institution_as_issued", "course_subject_as_issued", "course_title_as_issued", "language_as_issued"].every((k) => kontrak.includes(`${k}: string | null;`)),
        "CertificateDetail does not carry the four sealed fields");
      return c.verdict("the learner's certificate page reads the school, the course and the language from the certificate's own seal " +
        "(my_certificate), on screen and on the A4 sheet; today's school and assignment are read only where the certificate predates the seal");
    },
  },
  {
    id: "PENUTUPAN-M04",
    run: async (ctx) => {
      const c = new Checks();
      const dir = join(ctx.repoRoot, "docs", "onboarding", "konten-sintetis");
      const bab = readdirSync(dir).filter((f) => f.endsWith(".xlsx")).sort();
      // F-4: the synthetic corpus's own exact count, each workbook with its package (the real corpus was held to >= 20)
      c.expect(bab.length === 2 && bab.every((f) => readdirSync(dir).includes(f.replace(/\.xlsx$/, ".paket.json"))),
        `${bab.length} chapter workbooks were found in docs/onboarding/konten-sintetis (expected 2, each with its .paket.json)`);
      let salah = 0, definisi = 0;
      for (const f of bab) {
        const nama = f.replace(/\.xlsx$/, "");
        const baca = bacaBukuKerja(new Uint8Array(readFileSync(join(dir, f))));
        const hasil = baca.ok ? bukuKerjaKePaket(baca.lembar) : null;
        if (!c.expect(hasil?.ok === true, `${f} does not convert: ${hasil && !hasil.ok ? JSON.stringify(hasil.problems.slice(0, 3)) : "unreadable"}`)) continue;
        const paket = (hasil as { paket: { misconceptions?: { code: string }[] } }).paket;
        const json = readFileSync(join(dir, `${nama}.paket.json`), "utf8");
        c.expect(JSON.stringify(paket, null, 1) + "\n" === json, `${nama}.paket.json is not what the upload page makes of ${f}`);
        const kode = new Set((paket.misconceptions ?? []).map((m) => m.code));
        definisi += kode.size;
        const dipakai = new Set<string>();
        const opsi: { is_correct: boolean; misconception_code?: string | null; label?: string }[] = [];
        const jalan = (x: unknown): void => {
          if (Array.isArray(x)) { x.forEach(jalan); return; }
          if (x && typeof x === "object") {
            if ("is_correct" in x) opsi.push(x as (typeof opsi)[number]);
            Object.values(x).forEach(jalan);
          }
        };
        jalan((paket as { courses: unknown }).courses);
        for (const o of opsi.filter((o) => !o.is_correct)) {
          salah++;
          c.expect(!!o.misconception_code && kode.has(o.misconception_code),
            `${nama}: a wrong option names ${o.misconception_code ? `«${o.misconception_code}», which its «Miskonsepsi» sheet does not define` : "no misconception"}`);
          if (o.misconception_code) dipakai.add(o.misconception_code);
        }
        for (const k of kode) c.expect(dipakai.has(k), `${nama}: «${k}» is defined but no wrong option names it`);
      }
      // a problem on the «Miskonsepsi» sheet is placed by the column's own header, as on every other sheet (DAISY-06)
      const tempat = lokasiMasalah({ code: "MISCONCEPTION_TEXT_MISSING", sheet: "Miskonsepsi", row: 3, field: "remediation" }, "id");
      c.expect(tempat === "Lembar Miskonsepsi, baris 3, kolom Cara membantu", `a «Miskonsepsi» problem's place reads "${tempat}"`);
      return c.verdict(`each of the ${bab.length} synthetic chapter workbooks in docs/onboarding/konten-sintetis converts, with the upload page's own ` +
        `reader and converter, to its committed .paket.json, and all ${salah} wrong options name one of the ${definisi} misconceptions ` +
        "their own «Miskonsepsi» sheet defines, each of which is used; a problem on that sheet is placed by its column's header (D-063 M5, D-120 Q9)");
    },
  },
  {
    id: "PENUTUPAN-E03",
    run: async (ctx) => {
      const c = new Checks();
      const rute = readFileSync(join(ctx.repoRoot, "src", "app", "api", "akun", "email", "route.ts"), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
      const tanya = rute.indexOf('caller.rpc("authorize_email_correction"');
      c.expect(tanya > 0 && tanya < rute.indexOf("updateUserById") && !/createUser|supabaseService\(\)\.rpc|password/.test(rute),
        "the route touches Auth before the caller's authority is asked, asks the database as the service, or writes a password");
      c.expect(/updateUserById\(r\.auth_user_id, \{ email, email_confirm: true \}\)/.test(rute),
        "Auth is not asked to move exactly the granted address");
      c.expect(/if \(r\.activated === true && r\.pintar_id\)/.test(rute)
        && /after\(\(\) => kirimPemberitahuanKeamanan\("EMAIL_DIKOREKSI", pintarId, pemilik, lama \?\? null\)/.test(rute),
        "the notices are not sent after activation only, after the answer, to the new address (the owner) and the old one");
      c.expect(/if \(!asalSendiri\(/.test(rute) && /if \(!user\) return gagal\("BELUM_MASUK"\)/.test(rute), "the route does not refuse another origin or a signed-out caller");
      // every refusal the database names has the route's own code
      const mig = readFileSync(join(ctx.repoRoot, "supabase", "migrations", "20261203100000_a_wrong_email_is_corrected_by_whom_the_owner_ruled.sql"), "utf8");
      const fn = /create function public\.authorize_email_correction[\s\S]*?\$\$;/.exec(mig)?.[0] ?? "";
      const db = [...new Set([...fn.matchAll(/detail = '([A-Z_]+)'/g)].map((m) => m[1]))].sort();
      c.expect(db.length >= 5 && JSON.stringify(db) === JSON.stringify(Object.keys(KODE_DARI_DB).sort()),
        `the database refuses with ${JSON.stringify(db)}; the route maps ${JSON.stringify(Object.keys(KODE_DARI_DB).sort())}`);
      c.expect(Object.values(KODE_DARI_DB).every((k) => k in STATUS_KOREKSI_EMAIL), "a mapped code has no status");
      // the notice reads in both languages
      for (const akhir of ["subjek", "judul", "isi", "bukan_anda", "subjek_admin", "isi_admin"]) {
        for (const locale of LOCALES) {
          const v = t(`email.aman.email_dikoreksi.${akhir}` as HleEvent, "public", { locale });
          c.expect(v.length > 10 && !v.startsWith("email.") && !/@/.test(v), `email.aman.email_dikoreksi.${akhir} (${locale}) reads «${v}»`);
        }
      }
      return c.verdict("read from the source file src/app/api/akun/email/route.ts: the route refuses another origin and a signed-out caller, asks "
        + "authorize_email_correction with the caller's own client before Auth is touched, moves exactly the granted address and no password, "
        + `maps each of the ${db.length} refusals the database names to its own code, and tells the old and the new address only after `
        + "activation, after the answer; the notice's six texts read in both languages and carry no address");
    },
  },
  {
    id: "PENUTUPAN-W01",
    run: async (ctx) => {
      const c = new Checks();
      const tunggu = t("pimpinan.menunggu_pemutus_lain", "staff", { locale: "id" });
      const tiada = t("pimpinan.belum_ada_pemutus_lain", "staff", { locale: "id" });
      const dasar = { id: "d1", keluarga: "INTEGRITY_REFERRAL", keadaan: "AWAITING_REVIEW", hasil: null, simpul: "n", simpulNama: "Kelas 1A",
        institusi: "i", subjek: null, sumberTabel: "integrity_signals", diangkatPada: "2026-10-07T00:00:00Z", catatan: "catatan perujuk",
        diputuskanPada: null, olehSaya: false, adaPemutus: null };
      const kasus = [
        { keputusan: { ...dasar, olehSaya: true, adaPemutus: true }, denganAksi: true },
        { keputusan: { ...dasar, olehSaya: true, adaPemutus: false }, denganAksi: true },
        { keputusan: { ...dasar, keadaan: "UNDER_REVIEW", olehSaya: true, adaPemutus: true }, denganAksi: true },
        { keputusan: { ...dasar }, denganAksi: true },
        { keputusan: { ...dasar, keadaan: "DECIDED", hasil: "NO_FURTHER_ACTION", diputuskanPada: "2026-10-07T01:00:00Z", olehSaya: true }, denganAksi: true },
      ];
      const { html, galat } = gambar(ctx.repoRoot, "src/components/pimpinan/KartuKeputusan.tsx", kasus);
      if (!c.expect(galat === "", `the card did not render: ${galat}`)) return c.verdict("");
      const [milikAda, milikTiada, milikDitinjau, oranglain, diputus] = html;
      c.expect(!/<form/.test(milikAda) && milikAda.includes(tunggu) && !milikAda.includes(tiada),
        "the referrer's own open referral offers a move, or does not say it waits for another person");
      c.expect(!/<form/.test(milikTiada) && milikTiada.includes(tunggu) && milikTiada.includes(tiada),
        "with nobody else able to decide, the referrer's card does not say so");
      c.expect(!/<form/.test(milikDitinjau) && milikDitinjau.includes(tunggu), "the referrer is offered «Catat keputusan» on their referral under review");
      c.expect((oranglain.match(/<form/g) ?? []).length === 2 && !oranglain.includes(tunggu),
        "another decider is not offered «Saya yang menangani» and «Catat keputusan», or is told to wait");
      c.expect(!diputus.includes(tunggu), "a decided referral still says it waits");
      // the loader asks the database only for the reader's own open integrity referrals
      const muat = readFileSync(join(ctx.repoRoot, "src", "lib", "pimpinan.ts"), "utf8");
      c.expect(/r\.family === "INTEGRITY_REFERRAL" && r\.state !== "DECIDED"/.test(muat)
        && /c\.rpc\("management_decision_independent_decider", \{ p_decision: r\.id \}\)/.test(muat),
        "the loader does not ask management_decision_independent_decider for the reader's own open referrals");
      for (const k of ["pimpinan.menunggu_pemutus_lain", "pimpinan.belum_ada_pemutus_lain"] as const) {
        for (const locale of LOCALES) {
          const v = t(k, "staff", { locale });
          c.expect(v.length > 20 && !v.startsWith("pimpinan."), `${k} (${locale}) reads «${v}»`);
        }
      }
      return c.verdict("the rendered component KartuKeputusan (src/components/pimpinan/KartuKeputusan.tsx): the referrer's own open integrity referral, "
        + "awaiting or under review, carries no form and says another leader decides it; with nobody else able to decide it also says so and "
        + "who can change that; another decider's card offers both moves and no waiting line; a decided referral says nothing of waiting; "
        + "read from the source file src/lib/pimpinan.ts, the loader asks management_decision_independent_decider for the reader's own open "
        + "integrity referrals only; both texts read in both languages (CR-76, D-123(4))");
    },
  },
  {
    id: "PENUTUPAN-K01",
    run: async (ctx) => {
      const c = new Checks();
      const pop = { placed: 30, assessed: 6, not_yet: 24 };
      const baris = `30 ${t("kesiapan.populasi.murid", "educator", { locale: "id" })} · 6 ${t("kesiapan.populasi.sudah", "educator", { locale: "id" })} · 24 ${t("kesiapan.populasi.belum", "educator", { locale: "id" })}`;
      const lp = gambar(ctx.repoRoot, "src/components/bukti/PopulasiKelas.tsx", [{ populasi: pop }, { populasi: null }]);
      if (!c.expect(lp.galat === "", `the population line did not render: ${lp.galat}`)) return c.verdict("");
      const teks = (h: string) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      c.expect(teks(lp.html[0]) === baris, `the population reads «${teks(lp.html[0])}», expected «${baris}»`);
      c.expect(lp.html[1] === "", "a figure with no population draws a line");
      // a report entry: the bands, then the population, and «Belum mengerjakan» is no band row
      const entri = { status: "ok", metric_id: "class.readiness_distribution",
        value: { "kesiapan.siap_sertifikasi": 3, "kesiapan.perlu_review": 2, "kesiapan.butuh_pendampingan": 1 }, sample: 6, population: pop };
      const lap = gambar(ctx.repoRoot, "src/components/bukti/NilaiLaporan.tsx", [{ entry: entri, locale: "id" }]);
      if (!c.expect(lap.galat === "", `the report entry did not render: ${lap.galat}`)) return c.verdict("");
      const dt = [...lap.html[0].matchAll(/<dt>([^<]*)<\/dt>/g)].map((m) => m[1]);
      c.expect(dt.length === 3 && !dt.includes(t("kesiapan.belum_post_test", "educator", { locale: "id" })) && teks(lap.html[0]).includes(baris),
        `the report entry's band rows are ${JSON.stringify(dt)} and its population line is ${teks(lap.html[0]).includes(baris)}`);
      // the bars are drawn over the assessed: 3 of 6 is half
      const bar = gambar(ctx.repoRoot, "src/components/bukti/BarisKesiapan.tsx", [{ tierKey: "kesiapan.siap_sertifikasi", count: 3, total: 6 }]);
      c.expect(bar.galat === "" && /width:50\.0%/.test(bar.html[0] ?? ""), `a band of 3 among 6 assessed is drawn as ${(/width:[^;"]*/.exec(bar.html[0] ?? "") ?? ["nothing"])[0]}`);
      // the class's evidence page sums the bands alone and says the population with the figure and without it
      const hal = readFileSync(join(ctx.repoRoot, "src", "app", "mengajar", "[kelas]", "bukti", "page.tsx"), "utf8");
      c.expect((hal.match(/<PopulasiKelas populasi=\{siap\.population\}/g) ?? []).length === 2
        && /const totalSiap = sebaran\.reduce/.test(hal),
        "the class's evidence page does not say the population both with the bands and while they are withheld");
      return c.verdict("the rendered component PopulasiKelas says «30 murid di kelas ini · 6 sudah mengerjakan Uji Penguasaan · 24 belum "
        + "mengerjakan Uji Penguasaan» and nothing for a figure with no population; the rendered report entry NilaiLaporan lists three "
        + "band rows, none of them «Belum mengerjakan», then the population; the rendered BarisKesiapan draws 3 of 6 assessed as half; read from "
        + "the source file src/app/mengajar/[kelas]/bukti/page.tsx, the class's evidence page sums the bands alone and says the population "
        + "with the bands and while they are withheld (CR-81, D-123(3))");
    },
  },
  {
    id: "PENUTUPAN-R01",
    run: async (ctx) => {
      const c = new Checks();
      const KOMPONEN = "src/components/KolomRahasia.tsx";
      const semua: string[] = [];
      const jalan = (d: string) => {
        for (const e of readdirSync(join(ctx.repoRoot, d), { withFileTypes: true })) {
          const p = `${d}/${e.name}`;
          if (e.isDirectory()) jalan(p);
          else if (/\.tsx$/.test(e.name)) semua.push(p);
        }
      };
      jalan("src");
      // 1. NO SECRET IS TYPED OUTSIDE THE ONE FIELD: no input anywhere in src/ is a password-type input of its own
      const masked = /type=(?:"password"|'password'|\{[^}]*["']password["'][^}]*\})/;
      const di = semua.filter((f) => f !== KOMPONEN && masked.test(readFileSync(join(ctx.repoRoot, f), "utf8")));
      c.expect(di.length === 0, `a secret is typed outside KolomRahasia: ${di.join(", ")}`);
      // 2. every place that asks for a password or a PIN asks through it, each secret with its own field
      const pakai: Record<string, number> = {
        "src/components/masuk/LayarMasuk.tsx": 2,      // the card's PIN; the password
        "src/components/aktifkan/Langkah.tsx": 4,      // the new password and its confirmation; the new PIN and its confirmation
        "src/components/aktifkan/LupaPassword.tsx": 1, // the PIN of the PINTAR ID + PIN way back (its new password is Langkah's)
        "src/components/aktifkan/PinBaru.tsx": 2,      // Akun saya's new PIN and its confirmation
        "src/components/sesi/LayarTerkunci.tsx": 1,    // the lock's PIN
      };
      for (const [f, n] of Object.entries(pakai)) {
        const x = (readFileSync(join(ctx.repoRoot, f), "utf8").match(/<KolomRahasia\b/g) ?? []).length;
        c.expect(x === n, `${f} asks for ${n} secret(s) through KolomRahasia, but ${x} do`);
      }
      // 3. emailed one-time codes stay readable (D-127 Q10): never a secret field
      for (const f of semua) {
        const src = readFileSync(join(ctx.repoRoot, f), "utf8");
        for (const m of src.matchAll(/<(\w+)\b[^>]*autoComplete="one-time-code"/g)) {
          c.expect(m[1] === "input", `${f}: a one-time code is typed in <${m[1]}>, not a plain readable field`);
        }
      }
      // 4. the field itself: masked by default, its own labelled toggle naming the field it controls, re-masked by the
      //    person's own submit, and no timer
      const k = readFileSync(join(ctx.repoRoot, KOMPONEN), "utf8");
      c.expect(/useState\(false\)/.test(k) && /type=\{tampil \? "text" : "password"\}/.test(k), "the secret is not masked by default");
      c.expect(/aria-pressed=\{tampil\}/.test(k) && /aria-label=\{tampil \? sembunyikan : tampilkan\}/.test(k) && /aria-controls=\{input\.id\}/.test(k),
        "the reveal is not a labelled pressed-state toggle naming its own field");
      c.expect(/form\.addEventListener\("submit", tutup\)/.test(k), "a submit does not re-mask the secret");
      c.expect(!/setTimeout|setInterval/.test(k), "the secret field runs a timer");
      // 5. rendered: two secrets in one form are two fields with two toggles, each naming its own field, both masked
      const r = gambar(ctx.repoRoot, KOMPONEN, [
        { id: "password", name: "password", bungkus: "pin-inp", tampilkan: "Tampilkan password", sembunyikan: "Sembunyikan password" },
        { id: "ulang", name: "ulang", bungkus: "pin-inp", tampilkan: "Tampilkan password", sembunyikan: "Sembunyikan password" },
      ]);
      c.expect(r.galat === "", `KolomRahasia does not render: ${r.galat}`);
      for (const [i, id] of [[0, "password"], [1, "ulang"]] as const) {
        const html = r.html[i] ?? "";
        c.expect(/<input[^>]*type="password"/.test(html) && (html.match(/aria-pressed="false"/g) ?? []).length === 1
          && new RegExp(`aria-controls="${id}"`).test(html) && /aria-label="Tampilkan password"/.test(html),
          `the rendered field #${id} is not masked with one toggle of its own: ${html.slice(0, 200)}`);
      }
      return c.verdict("no input in src/ is a password-type input outside src/components/KolomRahasia.tsx; the sign-in password and "
        + "card PIN, activation's password, PIN and both confirmations, the PIN way back, Akun saya's new PIN and its confirmation, "
        + "and the lock's PIN each ask through it (2, 4, 1, 2, 1); emailed one-time codes stay plain fields; the field is masked by "
        + "default, its reveal a labelled pressed-state toggle naming its own field, re-masked by the person's submit, with no timer; "
        + "rendered twice in one form it is two masked fields with a toggle each (CR-86, D-127 Q6, Q10)");
    },
  },
  {
    id: "PENUTUPAN-D01",
    run: async (ctx) => {
      const c = new Checks();
      // 1. THE AUTHOR'S WORD, AS THE WORKBOOK WRITES IT: three questions marked Mudah, Sedang and Sulit
      const ISI: Record<string, Array<Record<string, string>>> = {
        Kursus: [{ title: "Satuan Panjang", subject: "Matematika", stage: "SD", grade_label: "Kelas 5", konteks: "Akademik" }],
        Bab: [{ ordinal: "1", title: "Satuan panjang" }],
        Pelajaran: [{ module: "1", ordinal: "1", title: "Tangga satuan", body_markdown: "Turun satu anak tangga: dikali sepuluh.",
          objective: "Murid mengubah satuan panjang", bloom: "Menerapkan" }],
        Soal: (["Mudah", "Sedang", "Sulit"] as const).map((kata, i) => ({ ref: `S${i + 1}`, module: "1", lesson: "1",
          item_type: "Pilihan ganda", stem: `Berapa cm dalam ${i + 3} m?`, use: "Cek penguasaan", difficulty: kata })),
        Pilihan: [1, 2, 3].flatMap((i) => [
          { ref: `S${i}`, label: "A", body: `${(i + 2) * 100} cm`, is_correct: "Ya", rationale: "Dua anak tangga: dikali seratus." },
          { ref: `S${i}`, label: "B", body: `${(i + 2) * 10} cm`, is_correct: "Tidak", rationale: "Baru satu anak tangga." },
        ]),
      };
      const berkas = tulisBukuKerja(LEMBAR.map((l) => ({ nama: l, baris: [KOLOM[l].map((k) => k.judul),
        ...(ISI[l] ?? []).map((r) => KOLOM[l].map((k) => r[k.kunci] ?? ""))] })));
      const baca = bacaBukuKerja(berkas);
      const paket = baca.ok ? bukuKerjaKePaket(baca.lembar) : null;
      if (c.expect(paket?.ok === true, `the workbook does not convert: ${JSON.stringify(paket && !paket.ok ? paket.problems : baca)}`) && paket?.ok) {
        const soal = (((paket.paket.courses as Array<Record<string, unknown>>)[0].modules as Array<Record<string, unknown>>)[0]
          .lessons as Array<Record<string, unknown>>)[0].items as Array<Record<string, unknown>>;
        c.expect(JSON.stringify(soal.map((x) => x.difficulty)) === JSON.stringify(["0.3", "0.5", "0.7"]),
          `the author's Mudah, Sedang and Sulit reach the package as ${JSON.stringify(soal.map((x) => x.difficulty))}, not 0.3, 0.5 and 0.7`);
      }
      // 2. THE BAND reads the stored value as its author wrote it: the last migration that defines it, and that migration
      //    writes no row (D-129(c): no sealed hash changes, nothing is resealed)
      const dir = join(ctx.repoRoot, "supabase", "migrations");
      const terakhir = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
        .filter((f) => /create (?:or replace )?function public\.difficulty_band\(/i.test(readFileSync(join(dir, f), "utf8"))).pop() ?? "";
      const sql = terakhir ? readFileSync(join(dir, terakhir), "utf8") : "";
      const fungsi = /create (?:or replace )?function public\.difficulty_band\([\s\S]*?\$\$;/i.exec(sql)?.[0] ?? "";
      c.expect(/when p <= 0\.4 then 'MUDAH'/.test(fungsi) && /when p >= 0\.7 then 'SULIT'/.test(fungsi),
        `${terakhir || "no migration"} does not read at most 0.4 as MUDAH and at least 0.7 as SULIT`);
      const tanpaKomentar = sql.replace(/--[^\n]*/g, "").replace(/\$\$[\s\S]*?\$\$/g, "");
      c.expect(!/\b(?:insert\s+into|update\s+\w|delete\s+from|truncate|alter\s+table|drop\s+table)\b/i.test(tanpaKomentar),
        `${terakhir} writes a row or changes a table: the reading is corrected, never the sealed data (D-129(c))`);
      // 3. THE TEACHER'S SCREEN: each choice is labelled with the copy table's word for its band, and the words are the author's
      const halaman = readFileSync(join(ctx.repoRoot, "src", "app", "mengajar", "[kelas]", "uji-cepat", "page.tsx"), "utf8");
      const pengajar = readFileSync(join(ctx.repoRoot, "src", "lib", "pengajar.ts"), "utf8");
      c.expect(/s\(`mengajar\.cepat\.tingkat\.\$\{x\.tingkat\}`/.test(halaman) && /tingkat: b\.band\b/.test(pengajar),
        "the teacher's Uji Cepat choice is not labelled with its band's word (mengajar.cepat.tingkat.<band>)");
      for (const [band, kata] of [["MUDAH", "Mudah"], ["SEDANG", "Sedang"], ["SULIT", "Sulit"]] as const) {
        c.expect(t(`mengajar.cepat.tingkat.${band}` as HleEvent, "staff", { locale: "id" }) === kata,
          `the teacher reads ${band} as «${t(`mengajar.cepat.tingkat.${band}` as HleEvent, "staff", { locale: "id" })}», not «${kata}»`);
      }
      return c.verdict(`a workbook whose author marked three questions Mudah, Sedang and Sulit becomes a package carrying 0.3, 0.5 and `
        + `0.7; ${terakhir} reads at most 0.4 as MUDAH and at least 0.7 as SULIT and writes no row; the teacher's Uji Cepat choice `
        + "is labelled with the copy table's word for its band, Mudah, Sedang or Sulit (FD-5, D-129(c); the database's half is F21-D01)");
    },
  },
  {
    id: "PENUTUPAN-B01",
    run: async (ctx) => {
      const c = new Checks();
      const jaga = readFileSync(join(ctx.repoRoot, "src", "components", "PenjagaSesi.tsx"), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
      const pasang = [...jaga.matchAll(/addEventListener\("pageshow"/g)];
      c.expect(pasang.length === 1, `PenjagaSesi listens for a restored page ${pasang.length} time(s), not once`);
      const di = pasang[0]?.index ?? -1;
      const awal = di < 0 ? -1 : jaga.lastIndexOf("useEffect(() => {", di);
      const sebelum = awal < 0 ? "" : jaga.slice(awal, di);
      const akhir = di < 0 ? -1 : jaga.indexOf("useEffect(", di);
      const sesudah = di < 0 ? "" : jaga.slice(di, akhir < 0 ? undefined : akhir);
      c.expect(awal >= 0 && !/modeLayar\(|\breturn\b/.test(sebelum),
        "the restored-page reload is reached only on some computers: its effect asks the mode, or returns, before it listens");
      c.expect(/\(e: PageTransitionEvent\) => \{ if \(e\.persisted\) window\.location\.reload\(\); \}/.test(sebelum + sesudah)
        && /\}, \[\]\);/.test(sesudah), "the listener does not reload a page restored from the back-forward cache, once per page");
      return c.verdict("PenjagaSesi listens for a restored page once, in an effect of its own that asks no mode and returns before "
        + "nothing, and reloads a page restored from the back-forward cache: on every computer, personal, shared or card (CR-90; "
        + "evidence class D-129(d): preventive hardening, no pre-change browser reproduction)");
    },
  },
  {
    id: "PENUTUPAN-T01",
    run: async (ctx) => {
      const c = new Checks();
      const baca = (f: string) => { try { return readFileSync(join(ctx.repoRoot, f), "utf8"); } catch { return ""; } };
      // 1. each role's Studio capabilities, from the latest role_capabilities
      const dir = join(ctx.repoRoot, "supabase", "migrations");
      const berkas = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
        .filter((f) => /function public\.role_capabilities\(/i.test(readFileSync(join(dir, f), "utf8"))).pop() ?? "";
      const sql = berkas ? readFileSync(join(dir, berkas), "utf8") : "";
      const badan = sql.slice(sql.search(/function public\.role_capabilities\(/i));
      const STUDIO = ["CAN_DRAFT", "CAN_REVIEW", "CAN_FREEZE_RELEASE", "CAN_PUBLISH", "CAN_ASSIGN_LEARNING",
        "CAN_REVIEW_QUESTION_HEALTH", "CAN_REVIEW_INTEGRITY", "CAN_QUICK_ASSESSMENT"];
      const kemampuan = (peran: string) => {
        const m = new RegExp(`when '${peran}' then array\\[([^\\]]*)\\]`).exec(badan);
        return new Set([...(m?.[1] ?? "").matchAll(/'([A-Z_]+)'/g)].map((x) => x[1]).filter((k) => STUDIO.includes(k)));
      };
      // 2. the canon's table (src/lib/studio-tab.ts cites each row)
      const HARAP: Record<string, string[]> = {
        SYSTEM_ADMIN: [...TAB_STUDIO],
        INSTITUTION_ADMIN: [...TAB_STUDIO],
        HEAD_OF_DEPARTMENT: ["beranda", "unggah", "tinjau", "kanonik", "bank", "integritas"],
        EDUCATOR: ["beranda", "unggah", "kanonik"],
        DEAN: [],
        STUDENT: [],
      };
      for (const [peran, tab] of Object.entries(HARAP)) {
        const dapat = tabStudio(kemampuan(peran), [peran]);
        c.expect(JSON.stringify(dapat) === JSON.stringify(tab), `${peran} is shown ${JSON.stringify(dapat)}, not ${JSON.stringify(tab)}`);
      }
      c.expect(operatorPintar(["SYSTEM_ADMIN"]) && !operatorPintar(["INSTITUTION_ADMIN", "HEAD_OF_DEPARTMENT"]) && !operatorPintar(null),
        "the operator's parts are not Admin platform's alone");
      // 3. the layout draws the tabs from the table, and Studio's own launcher and certificate layout are gone
      const layout = baca("src/app/studio/layout.tsx");
      // RESTATED FOR L3 (D-132 C8): the table is read through tabSaya over the working context's own grants there
      // (peranStudio: the pair's roles; studioInstitutions: its place's capabilities), the same answer the pages read
      const lib = baca("src/app/studio/_lib.ts");
      c.expect(/const nav = \(await tabSaya\(\)\)\.map\(\(t\) => TAB\[t\]\);/.test(layout)
        && /const \[institutions, peran\] = await Promise\.all\(\[studioInstitutions\(\), peranStudio\(\)\]\);\s*return tabStudio\(new Set\(institutions\.flatMap\(\(i\) => i\.capabilities\)\), peran\);/.test(lib),
        "Studio's layout does not draw its tabs from the role table");
      c.expect(!/\/studio\/(?:kuis|sertifikat)\b/.test(layout), "Studio still offers its own Uji Cepat launcher or the certificate layout");
      for (const hilang of ["src/app/studio/kuis/page.tsx", "src/app/studio/sertifikat/page.tsx"]) {
        c.expect(baca(hilang) === "", `${hilang} still exists (D-127 Q4, CR-06)`);
      }
      const aksi = baca("src/app/studio/actions.ts");
      c.expect(!/rpc\("launch_quick_assessment"|rpc\("save_certificate_template"/.test(aksi),
        "a Studio action still launches an Uji Cepat or saves a certificate layout");
      // 4. a tab's page sends a person it is not for to Studio's home
      for (const t of TAB_STUDIO.filter((x) => x !== "beranda")) {
        const halaman = baca(`src/app/studio/${t}/page.tsx`);
        c.expect(new RegExp(`if \\(!\\(await tabSaya\\(\\)\\)\\.includes\\("${t}"\\)\\) redirect\\("/studio"\\);`).test(halaman),
          `/studio/${t} does not send a person it is not for to Studio's home`);
      }
      return c.verdict(`from ${berkas}: Admin platform and Admin sekolah see all seven Studio tabs, the Kepala departemen all but `
        + "Aturan Penilaian, the Guru Beranda, Buat Paket and Pustaka PINTAR, the Dekan and the student none; the operator's parts "
        + "are Admin platform's alone; the layout draws the tabs from that table; Studio's own Uji Cepat launcher and certificate "
        + "layout are gone, page, tab and action; each tab's page sends a person it is not for to Studio's home (CR-87, CR-84)");
    },
  },
  {
    id: "PENUTUPAN-J01",
    run: async (ctx) => {
      const c = new Checks();
      const halaman = readFileSync(join(ctx.repoRoot, "src", "app", "studio", "unggah", "page.tsx"), "utf8");
      const aksi = readFileSync(join(ctx.repoRoot, "src", "app", "studio", "actions.ts"), "utf8");
      // L3 (D-132 C8): the operator is Admin platform whose grant is part of the working context
      const i = /const operator = adminPlatform === true && peran\.includes\("SYSTEM_ADMIN"\);/.test(halaman) ? halaman.indexOf("{operator ? (") : -1;
      // RESTATED FOR W3.3 (Batch 2): the disclosure gains Daisy's class (pin-disclosure, its chevron); the rule is unchanged
      // RESTATED FOR W1.14 (Batch 3): the disclosure's Tailwind grid became pin-studio-lipat (08-migration); the rule is unchanged
      const j = halaman.indexOf('<details className="pin-disclosure pin-studio-lipat" id="sistem-lain"');
      const k = halaman.indexOf(") : null}", j);
      c.expect(i >= 0 && j > i && k > halaman.indexOf("</details>", j) && halaman.indexOf("</details>", j) > j,
        "the JSON forms are not drawn for the platform operator alone");
      c.expect(/if \(paket\.asal === "JSON" && !\(await isSystemAdmin\(\)\)\) return \{ ok: false, code: "PACKAGE_NOT_ALLOWED" \};/.test(aksi)
        && aksi.indexOf('paket.asal === "JSON"') < aksi.indexOf('.from("ingest_batches")'),
        "a JSON package from someone other than the platform operator still reaches the database");
      return c.verdict("Buat Paket draws the two JSON forms for Admin platform alone, and a JSON package from anyone else is refused "
        + "PACKAGE_NOT_ALLOWED before any batch is written; the workbook stays every drafter's (CR-87, D-127 Q7)");
    },
  },
  {
    id: "PENUTUPAN-P01",
    run: async (ctx) => {
      const c = new Checks();
      const h = readFileSync(join(ctx.repoRoot, "src", "app", "studio", "kanonik", "page.tsx"), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
      // L3 (D-132 C7, C8): Admin platform in Pustaka PINTAR's own context (its grant part of the context, the place the library)
      c.expect(/const mayGrant = isSys === true && peran\.includes\("SYSTEM_ADMIN"\) && pustakaIni\.length > 0;/.test(h),
        "the grant form is not Admin platform's alone");
      c.expect(!/placeholder="id|id sekolah|id izin|\.slice\(0, 8\)/.test(h), "the grant form still asks for an id or shows an id fragment");
      c.expect(/<select className=\{field\} name="release"[\s\S]*?paketPustaka\.map/.test(h)
        && /<select className=\{field\} name="institution"[\s\S]*?sekolahTujuan\.map/.test(h)
        && /<select className=\{field\} name="distribusi"[\s\S]*?izinBerlaku\.map/.test(h),
        "the package, the school and the grant to withdraw are not chosen by name");
      c.expect(/from\("release_distributions"\)\.select\("id, plp_release_id, institution_id"\)\.eq\("status", "ACTIVE"\)/.test(h)
        && /tenant_kind === "PLATFORM_CANONICAL"/.test(h) && /tenant_kind === "INSTITUTION"/.test(h),
        "the choices are not the library's published packages, the schools and the open grants");
      return c.verdict("Pustaka PINTAR's grant and withdrawal are drawn for Admin platform alone; the library's published package, "
        + "the school and the open grant to withdraw are each chosen by name from a read made for the form, and no field asks "
        + "for an id (CR-87 (4), FD-8)");
    },
  },
  {
    id: "PENUTUPAN-I01",
    run: async (ctx) => {
      const c = new Checks();
      const h = readFileSync(join(ctx.repoRoot, "src", "app", "studio", "integritas", "page.tsx"), "utf8");
      c.expect(/rpc\("integrity_signals_awaiting_review"\)/.test(h) && !/from\("integrity_signals"\)/.test(h),
        "Tinjauan Integritas does not read the waiting list");
      c.expect(/\.\.\.\(group\[0\]\.may_refer \? \["REFERRED_TO_INSTITUTION"\] : \[\]\)/.test(h),
        "«Diteruskan ke pihak sekolah» is offered where the server refuses it");
      // RESTATED FOR W1.14 (Batch 3): the empty sentence is drawn as Daisy's Empty state (Kosong, W3.2), not a bare card;
      // it is still drawn exactly when the waiting list is empty
      c.expect(/bySession\.size === 0 \? \([^<]{0,200}<Kosong jenis="belum" kalimat=\{s\("studio\.integritas\.kosong"\)\} \/>/.test(h),
        "the empty sentence is not drawn from the waiting list");
      return c.verdict("Tinjauan Integritas lists integrity_signals_awaiting_review (a reviewed sitting leaves it), says «Tidak ada "
        + "catatan yang menunggu tinjauan» exactly when it is empty, and offers «Diteruskan ke pihak sekolah» only where the read "
        + "says the server accepts it (FD-7; the database's half is F21-I01)");
    },
  },
  {
    id: "PENUTUPAN-F01",
    run: async (ctx) => {
      const c = new Checks();
      const h = readFileSync(join(ctx.repoRoot, "src", "app", "studio", "definisi", "page.tsx"), "utf8");
      const aksi = readFileSync(join(ctx.repoRoot, "src", "app", "studio", "actions.ts"), "utf8");
      c.expect(/const draf = \(courses \?\? \[\]\)\.filter\(\(c\) => c\.status === "INGESTED"\);/.test(h) && /\{draf\.map\(\(c\) =>/.test(h),
        "Aturan Penilaian offers chapters that are no longer being drafted");
      c.expect(!/name="institution"/.test(h), "Aturan Penilaian still asks for a school apart from the chapter");
      c.expect(!/name="kelulusan"/.test(h), "Aturan Penilaian still asks for a passing rule no verdict reads");
      c.expect(/const MODE_SIKLUS = \["PRE_TEST", "POST_TEST"\];/.test(h) && /filter\(\(b\) => MODE_SIKLUS\.includes\(b\.mode\)\)/.test(h),
        "Aturan Penilaian offers modes the learning cycle never reads");
      // RESTATED FOR L4 (CR-88): the row's form opens by «Ubah» (bukaUbah), and still only while the chapter is a draft
      c.expect(/\{bab\?\.status === "INGESTED" && bukaUbah\(d\.id\) \? \(\s*<form action=\{saveDefinitionAction\}/.test(h)
        && !/\{bab\?\.status === "INGESTED" \? \(\s*<form action=\{saveDefinitionAction\}/.test(h),
        "a saved rule can be changed after its chapter has moved on");
      c.expect(/const \{ data: bab \} = await supabase\.from\("courses"\)\.select\("institution_id"\)\.eq\("id", course\)\.maybeSingle\(\);/.test(aksi)
        && /put\("institution_id", bab\.institution_id\);/.test(aksi), "the rule's school is not the chapter's own");
      // RESTATED FOR BATCH 1 (W1.13, D-145(c)): the step is one transaction in the database (langkah_konten, its latest
      // migration); the rule is the same: the chapter's rules and its modules' rules move with it, only those standing
      // where the chapter stands, never an ad-hoc one; and Studio's step is that call
      const langkah = readdirSync(join(ctx.repoRoot, "supabase", "migrations")).sort()
        .filter((f) => /create or replace function public\.langkah_konten\(/.test(readFileSync(join(ctx.repoRoot, "supabase", "migrations", f), "utf8")))
        .map((f) => readFileSync(join(ctx.repoRoot, "supabase", "migrations", f), "utf8")).pop() ?? "";
      c.expect(/update public\.assessment_definitions set status = v_ke,[\s\S]{0,200}?where \(course_id = p_course or module_id = any\(v_mods\)\) and not is_ad_hoc and status = v_status;/.test(langkah)
        && /select c\.institution_id, c\.status into v_inst, v_status from public\.courses c where c\.id = p_course;/.test(langkah)
        && /supabase\.rpc\("langkah_konten", \{ p_course: course, p_ke: to \}\)/.test(aksi),
        "Studio's step does not move the chapter's rules, its modules' among them, standing where the chapter stands");
      c.expect(/ditolak\("save_assessment_definition", error, kodeGalatKonten\(error\)\)/.test(aksi)
        && kodeGalatKonten({ code: "P0001", message: "a rule is set while its chapter is still being drafted; this chapter is APPROVED" }) === "CONTENT_CREATED_NOT_INGESTED",
        "a late rule's refusal is not named");
      c.expect(/unggah|Unggah/.test(t(kunciKode("CONTENT_CREATED_NOT_INGESTED"), "staff", { locale: "id" })),
        "the late rule's sentence does not name the next action, an upload");
      return c.verdict("Aturan Penilaian offers only chapters still being drafted, with the school the chapter's own, in the two "
        + "modes the learning cycle reads, and no passing rule; a saved rule is changed only while its chapter is a draft; "
        + "Studio's step moves the chapter's rules, its modules' among them, standing where the chapter stands; a late rule's "
        + "refusal is named, its sentence the upload that starts the chapter's correction (FD-9, D-127 Q8; the database's half "
        + "is F21-R01)");
    },
  },
  {
    id: "PENUTUPAN-V01",
    run: async (ctx) => {
      const c = new Checks();
      // 1. the rule, driven: kept for one press, put back for the same person into the same form, never a file or a secret
      const bentuk = (sinyal: string): Bidang[] => [
        { name: "sinyal", type: "hidden", value: sinyal },
        { name: "keputusan", type: "select-one", value: "NO_CONCERN" },
        { name: "catatan", type: "text", value: "" },
        { name: "jeda", type: "checkbox", value: "on", checked: false },
        { name: "berkas", type: "file", value: "C:\\fakepath\\a.xlsx" },
        { name: "sandi", type: "password", value: "rahasia" },
      ];
      const kirim = bentuk("S1");
      kirim[1].value = "DISCUSSED_WITH_LEARNER"; kirim[2].value = "Sudah dibicarakan."; kirim[3].checked = true;
      const isian = bacaIsian(JSON.stringify(isianDari(kirim, "P1")));
      c.expect(isian !== null && !("berkas" in isian.nilai) && !("sandi" in isian.nilai), "a file or a secret is kept");
      const baru = bentuk("S1");
      c.expect(pulihkanIsian(baru, isian, "P1") === 3 && baru[1].value === "DISCUSSED_WITH_LEARNER" && baru[2].value === "Sudah dibicarakan."
        && baru[3].checked === true && baru[0].value === "S1", "what was sent is not put back into the same form");
      const lain = bentuk("S1");
      c.expect(pulihkanIsian(lain, isian, "P2") === 0 && lain[2].value === "", "another person is given what was sent");
      const itemLain = bentuk("S2");
      c.expect(pulihkanIsian(itemLain, isian, "P1") === 0 && itemLain[2].value === "", "another item's form is given what was sent");
      c.expect(bacaIsian("{\"pemilik\":1}") === null && bacaIsian("bukan json") === null, "a malformed stored value is read");
      // 2. every Studio form a person types into or chooses in keeps it, bound to its own result line
      const semua: string[] = [];
      const jalan = (d: string) => {
        for (const e of readdirSync(join(ctx.repoRoot, d), { withFileTypes: true })) {
          const p = `${d}/${e.name}`;
          if (e.isDirectory()) jalan(p); else if (e.name === "page.tsx") semua.push(p);
        }
      };
      jalan("src/app/studio");
      let n = 0;
      for (const f of semua) {
        const src = readFileSync(join(ctx.repoRoot, f), "utf8");
        for (const m of src.matchAll(/<form action=\{(\w+)\}([^>]*)>([\s\S]*?)<\/form>/g)) {
          const isi = m[3].replace(/<input[^>]*type="hidden"[^>]*\/>/g, "");
          if (!/<(?:input|select|textarea)\b/.test(isi)) continue;
          n++;
          const id = /\bid=(\{`[^`]+`\}|"[^"]+")/.exec(m[2])?.[1];
          c.expect(!!id, `${f}: the ${m[1]} form has no id to keep what was sent`);
          if (!id) continue;
          const nama = id.startsWith('"') ? id : id;
          c.expect(src.includes(`<SimpanIsian form=${nama} ditolak={`), `${f}: the ${m[1]} form ${nama} does not keep what was sent`);
        }
      }
      c.expect(n >= 9, `only ${n} Studio form(s) with a field found`);
      const komponen = readFileSync(join(ctx.repoRoot, "src", "components", "SimpanIsian.tsx"), "utf8");
      c.expect(/window\.sessionStorage\.removeItem\(kunci\)/.test(komponen) && /if \(ditolak\) pulihkanIsian\(/.test(komponen)
        && !/localStorage|document\.cookie|fetch\(/.test(komponen), "what was sent is not kept for one press in the tab alone");
      return c.verdict(`each of the ${n} Studio forms a person types into or chooses in keeps what was sent for one press in the tab's `
        + "own session storage (never the address, a cookie or the server) and, when its page says that submission was refused, puts "
        + "it back for the same person into the same form; a file or a secret is never kept, another person or another item's form "
        + "is given nothing, and a malformed stored value is ignored (CR-84 (3))");
    },
  },
  {
    id: "PENUTUPAN-L01",
    run: async (ctx) => {
      const c = new Checks();
      const baca = (...p: string[]) => readFileSync(join(ctx.repoRoot, ...p), "utf8");
      const css = baca("src", "app", "experience.css").replace(/\/\*[\s\S]*?\*\//g, "");
      // CR-93: «Laporkan masalah» — its picture field is the form's only file field, and it may shrink to the column
      c.expect(/className="pin-lapor"/.test(baca("src", "app", "lapor", "page.tsx")) && /<TangkapanLayar\b/.test(baca("src", "app", "lapor", "page.tsx")),
        "the report form no longer draws the picture field inside .pin-lapor");
      // RESTATED FOR W3.3 (Batch 2, Daisy's FileField, RV-5): the picture field is a file field through BidangBerkas, whose
      // native input lies inside its button (absolute, inset 0), so it cannot set the form wider than its column either
      c.expect(/<BidangBerkas\b/.test(baca("src", "components", "lapor", "TangkapanLayar.tsx"))
        && /type="file"/.test(baca("src", "components", "bentuk", "BidangBerkas.tsx")), "the picture field is not a file field");
      const aturan = /\.pin-lapor input\[type="file"\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? "";
      c.expect(/max-width:\s*100%/.test(aturan) && /min-width:\s*0/.test(aturan),
        "the report form's file field may still set the form wider than its column (CR-93: 440 px at a 320 px window)");
      c.expect(!/(^|[^-])width:/.test(aturan), "the file field's width is set, changing it where the window is wide enough");
      // CR-94: Konfigurasi's roles list — a row may wrap, so the revoke form goes below the name, not past the window
      const konf = baca("src", "app", "konfigurasi", "page.tsx");
      const peran = konf.slice(konf.indexOf('<section id="roles"'), konf.indexOf("</section>", konf.indexOf('<section id="roles"')));
      const baris = /<li key=\{a\.id\} className="([^"]*)"/.exec(peran)?.[1] ?? "";
      const kelas = baris.split(/\s+/);
      c.expect(kelas.includes("flex") && kelas.includes("flex-wrap"),
        `a role's row cannot wrap («${baris}»): its revoke form runs past a 320 px window (CR-94: 374 px)`);
      c.expect(kelas.includes("sm:flex-nowrap"), `a role's row also wraps from 640 px up («${baris}»), where it did not before`);
      c.expect(/<form action=\{revokeRoleAction\} className="flex flex-wrap items-center gap-2">/.test(peran),
        "the revoke form itself changed");
      return c.verdict("the report form's file field may shrink to its column and keeps its own width where it fits (CR-93); a role's "
        + "row in Konfigurasi wraps below 640 px, so its revoke form goes below the name, and from 640 px up stays as it was (CR-94). The seeded crawl measures both "
        + "at 320 px (X.6, D-046)");
    },
  },
];

export const penutupanAppTests: SelfTest[] = [
  {
    id: "PENUTUPAN-A01",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      const [e1, e2, e3] = ["salah", "benar", "baru"].map((x) => `cr13-${x}-${tag}@local.invalid`);
      const pid = await daftar(asal, "Rini Kusuma", e1);
      const sys = new Peramban(asal, ipUji());
      c.expect((await sys.jsonDari("/masuk/password", { form: { identitas: "uji.sysadmin", password: "Sintetis-Sys-91!" } })).status === 200,
        "the platform admin could not sign in");
      // L3 (D-132 C7): the platform admin's acts across schools are «Seluruh platform»'s, chosen on the chooser
      await pilihKonteksPeramban(sys, "MENGELOLA:PLATFORM");

      // BEFORE ACTIVATION: whoever holds the wrong inbox has a code and an open set-up when the address is corrected
      const asing = new Peramban(asal, ipUji());
      await asing.jsonDari("/aktifkan/kode", { form: { email: e1 } });
      const kode1 = kodeDari((await sinkTunggu(e1, 1))[0]);
      const periksa = await asing.jsonDari("/aktifkan/periksa", { form: { email: e1, kode: kode1 } });
      c.expect(kode1.length > 0 && periksa.status === 200, `the wrong inbox could not open the set-up first (${periksa.status})`);
      const tanpaAlasan = await sys.jsonDari("/api/akun/email", { json: { person_id: pid, email: e2, alasan: " " } });
      const koreksi1 = await sys.jsonDari("/api/akun/email", { json: { person_id: pid, email: e2.toUpperCase(), alasan: "salah ketik saat menambah staf" } });
      c.expect(tanpaAlasan.status === 400 && tanpaAlasan.body?.code === "ALASAN_WAJIB" && koreksi1.status === 200
        && koreksi1.body?.ok === true && koreksi1.body?.sudahAktif === false,
        `the correction before activation: no reason ${tanpaAlasan.status} ${tanpaAlasan.body?.code}, with one ${koreksi1.status} ${JSON.stringify(koreksi1.body)}`);
      const lanjut = await asing.jsonDari("/api/aktifkan/username", { form: { username: `asing.${tag}` } });
      c.expect(lanjut.status !== 200, `the wrong inbox's set-up went on after the correction (${lanjut.status})`);
      // a second person's code, sent to the wrong address and not yet used, dies with the correction
      const [e4, e5] = ["salah2", "benar2"].map((x) => `cr13-${x}-${tag}@local.invalid`);
      const pid2 = await daftar(asal, "Sari Wulandari", e4);
      await new Peramban(asal, ipUji()).jsonDari("/aktifkan/kode", { form: { email: e4 } });
      const kode4 = kodeDari((await sinkTunggu(e4, 1))[0]);
      const koreksi4 = await sys.jsonDari("/api/akun/email", { json: { person_id: pid2, email: e5, alasan: "salah ketik saat menambah staf" } });
      const diBaru = await new Peramban(asal, ipUji()).jsonDari("/aktifkan/periksa", { form: { email: e5, kode: kode4 } });
      const diLama = await new Peramban(asal, ipUji()).jsonDari("/aktifkan/periksa", { form: { email: e4, kode: kode4 } });
      c.expect(kode4.length > 0 && koreksi4.status === 200 && diBaru.status !== 200 && diLama.status !== 200,
        `a code sent to the wrong address, unused, after the correction (${koreksi4.status}): at the new address ${diBaru.status}, at the old ${diLama.status}`);
      const sandi = await aktifkan(c, asal, e2, `rini.${tag}`, "4826");
      c.expect(sandi !== null, "the person could not activate at the corrected address");

      // AFTER ACTIVATION: the platform admin only; the old and the new address are told
      const guru = new Peramban(asal, ipUji());
      c.expect((await guru.jsonDari("/masuk/password", { form: { identitas: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!" } })).status === 200,
        "the teacher could not sign in");
      const olehGuru = await guru.jsonDari("/api/akun/email", { json: { person_id: pid, email: e3, alasan: "pindah alamat" } });
      c.expect(olehGuru.status === 403 && olehGuru.body?.code === "DITOLAK", `a teacher corrected an email (${olehGuru.status})`);
      const dulu = (await sinkTunggu(e2, 2)).length;
      const koreksi2 = await sys.jsonDari("/api/akun/email", { json: { person_id: pid, email: e3, alasan: "alamat lama tidak dipakai lagi" } });
      c.expect(koreksi2.status === 200 && koreksi2.body?.sudahAktif === true, `the correction after activation answered ${koreksi2.status} ${JSON.stringify(koreksi2.body)}`);
      if (sandi) {
        const lama = await new Peramban(asal, ipUji()).jsonDari("/masuk/password", { form: { identitas: e2, password: sandi } });
        const baru = await new Peramban(asal, ipUji()).jsonDari("/masuk/password", { form: { identitas: e3, password: sandi } });
        c.expect(lama.status !== 200 && baru.status === 200, `with the same password the old address answered ${lama.status} and the new one ${baru.status}`);
      }
      const subjek = t("email.aman.email_dikoreksi.subjek", "public", { locale: "id" });
      // the sink lists messages in its own order (Mailpit: newest first), so the notice is found by its subject, and the
      // old address has received exactly one message more than before the correction
      const semuaLama = await sinkTunggu(e2, dulu + 1);
      const keLama = semuaLama.filter((m) => m.Subject === subjek);
      const keBaru = (await sinkTunggu(e3, 1)).filter((m) => m.Subject === subjek);
      c.expect(semuaLama.length === dulu + 1 && keLama.length === 1 && keBaru.length === 1,
        `the notices: the old address received ${semuaLama.length - dulu} message(s) (${semuaLama.map((m) => m.Subject).join(" | ")}), ` +
        `${keLama.length} of them the correction's; the new address ${keBaru.length}`);
      c.expect([...keLama, ...keBaru].every((m) => !m.Text.includes(e2) && !m.Text.includes(e3) && !m.Text.includes(e1)),
        "a notice carries an address");
      const audit = psql(`select string_agg((summary ->> 'activated') || '/' || (summary #>> '{from,email}') || '/' || (summary #>> '{to,email}'), ' ' order by id)
                            from public.audit_log where action = 'identity.email_corrected' and target_id = ${lit(pid)}`);
      c.expect(audit === `false/${e1}/${e2} true/${e2}/${e3}`, `the corrections are audited as «${audit}»`);
      return c.verdict("a wrong address corrected by the platform admin before activation, while its inbox had opened the set-up with a code: "
        + "the set-up stopped and the person activated at the right address; a second person's unused code, sent to the wrong address, opens "
        + "the account neither at the old address nor at the new one; after activation a teacher is "
        + "refused, the correction moves the sign-in so the same password works only at the new address, the old and the new address each "
        + "get one notice carrying no address, and both corrections are audited with their branch and addresses");
    },
  },
];
