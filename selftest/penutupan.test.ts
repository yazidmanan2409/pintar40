/**
 * The closure's batch 3 behaviour (D-118 §2, D-120, D-121): what a screen must draw, rendered from the real component
 * before any script runs, or read from the page's own source where it is a server page with a fetch.
 *
 * PENUTUPAN-Q10 — D-121(a): a certificate whose learner passed a school mark below 70% carries no PINTAR descriptor,
 * and its line is absent from the certificate and from the public check, rather than a dash.
 * PENUTUPAN-S01 — CR-02 (D-078(c), D-077(d)): the learner's certificate page draws the school, the course and the
 * certificate's language from the certificate's own seal (my_certificate), never from today's school or assignment.
 * PENUTUPAN-M04 — CR-50 (D-063 M5, D-120 Q9): every PINTAR chapter in docs/onboarding/konten is what the upload page
 * makes of its workbook, and each wrong option names a misconception the same file defines on its «Miskonsepsi» sheet.
 * PENUTUPAN-E03 — CR-13 (D-120 QN1): the correction route asks the caller's authority before Auth is touched, maps
 * every refusal to its own code, and tells the old and the new address only after activation.
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
import { bukuKerjaKePaket } from "../src/lib/unggah-kontrak";
import { lokasiMasalah } from "../src/components/unggah/lokasi";
import { KODE_DARI_DB, STATUS_KOREKSI_EMAIL } from "../src/lib/koreksi-email-kontrak";
import { aktifkan } from "./bob28.test";
import { daftar, ipUji, kodeDari, lit, Peramban, psql, sinkTunggu } from "./bob26.test";

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
      const dir = join(ctx.repoRoot, "docs", "onboarding", "konten");
      const bab = readdirSync(dir).filter((f) => f.endsWith(".xlsx")).sort();
      c.expect(bab.length >= 20, `only ${bab.length} chapter workbooks were found in docs/onboarding/konten`);
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
      return c.verdict(`each of the ${bab.length} PINTAR chapter workbooks in docs/onboarding/konten converts, with the upload page's own ` +
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
        diputuskanPada: null, olehSaya: false, pemutusLain: null };
      const kasus = [
        { keputusan: { ...dasar, olehSaya: true, pemutusLain: true }, denganAksi: true },
        { keputusan: { ...dasar, olehSaya: true, pemutusLain: false }, denganAksi: true },
        { keputusan: { ...dasar, keadaan: "UNDER_REVIEW", olehSaya: true, pemutusLain: true }, denganAksi: true },
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
