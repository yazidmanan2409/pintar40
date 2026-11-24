/**
 * Z · stream B (UX and words, no SQL): the red-first cases of `claude/z-ux`.
 *
 * Each case was run on the base (`claude/z` at f258e5f4) before its fix and failed there; each passes after. The
 * sources are Z-BUILD-PLAN.md §2, Daisy's words (`SAPU-KATA-RULING-78.md`, `Z-M1-M2-SPESIFIKASI.md`,
 * `X2-CATATAN-DESAIN.md`) and Bob's SAPU-VERIFIED.md.
 *
 * Z3 (this file's first chunk):
 *   Z-K02-01  Peta Bacaan's fourth tier is «Sudah kuat»; a KUAT card says `map.kuat.arti` once, never the statement twice;
 *             the tiers are explained where the map is drawn
 *   Z-K03-01  the teacher's one-learner page says a failed read as a failure and «no Uji Penguasaan yet» as its own state,
 *             never as «no objective below target»
 *   Z-K04-01  the school report never says «every domain ≥ 60%» while a domain is withheld, nor over no domain at all
 *   Z-K05-01  the public verification page heads the facts «Seperti saat diterbitkan» under DITINJAU and DICABUT, with
 *             `verifikasi.fakta.ditinjau` under DITINJAU only; BERLAKU, DIGANTIKAN and TIDAK SAH unchanged
 *   Z-M1M2-01 the waiting screen: NOT_AUTHORISED, EXPIRED, USED and NOTHING are neutral, OFFLINE stays an error; the
 *             «Beri tahu guru» name is «Uji Penguasaan · {bab}», without the subject or grade
 *   Z-R8-01   every page under /belajar/[tugas]/ answers an id that is not the learner's through one guard, before any
 *             learning-state read (the static half)
 *   Z-R8-02   the same, in the running app: a classmate's assignment id and an assessment-assignment id answer 404 with
 *             the not-found page on all seven routes, and no reference code
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { Checks, type SelfTest } from "./lib";
import { t, type HleEvent } from "../src/lib/hle";

const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
const halamanDi = (dir: string): string[] => readdirSync(dir).flatMap((n) => {
  const f = join(dir, n);
  return statSync(f).isDirectory() ? halamanDi(f) : n === "page.tsx" ? [f] : [];
});

/** Daisy's words, word for word, ID and EN. */
export function kata(c: Checks, daftar: Array<[string, string, string]>, untuk: "learner" | "educator" | "staff" | "public" = "learner") {
  for (const [k, id, en] of daftar) {
    const a = t(k as HleEvent, untuk, { locale: "id" }), b = t(k as HleEvent, untuk, { locale: "en" });
    c.expect(a === id, `${k} (id): «${a}», not «${id}»`);
    c.expect(b === en, `${k} (en): «${b}», not «${en}»`);
  }
}

/** Renders server-safe components in a child process (react-dom/server is not loadable under react-server). */
export function render(repoRoot: string, script: string): { ok: boolean; out: Record<string, string>; galat: string } {
  const body = "(async () => {" +
    '  const { createElement: h } = await import("react");' +
    '  const { renderToStaticMarkup: r } = await import("react-dom/server");' +
    '  const imp = async (p) => { const m = await import("file://" + process.cwd() + "/" + p); return m.default && m.default.default !== undefined ? m.default : m; };' +
    "  const out = {};" + script +
    "  process.stdout.write(JSON.stringify(out));" +
    "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });";
  const anak = spawnSync(process.execPath, ["--import", "tsx", "-e", body], { cwd: repoRoot, encoding: "utf8" });
  let out: Record<string, string> = {};
  try { out = JSON.parse(anak.stdout); } catch { /* reported by ok */ }
  return { ok: anak.status === 0 && typeof out === "object", out, galat: (anak.stderr || "").split("\n").slice(0, 3).join(" ") };
}

const teks = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, "\"").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const kali = (h: string, s: string) => h.split(s).length - 1;

const K02: Array<[string, string, string]> = [
  ["map.tier.KUAT", "Sudah kuat", "Already strong"],
  ["map.kuat.arti", "Jawaban Anda di Pemetaan Awal untuk bagian ini sudah tepat. Anda boleh membacanya sekilas.",
    "Your Initial Mapping answers for this part were right. You may skim it."],
  ["map.tingkat.arti", "Tanda ini adalah saran urutan membaca dari hasil Pemetaan Awal. Tanda ini bukan nilai dan bukan pernyataan penguasaan.",
    "These marks suggest an order of reading, from the Initial Mapping. They are not a score, and not a statement of mastery."],
];

const K03: Array<[string, string, string]> = [
  ["mengajar.murid1.tujuan_belum_uji", "Belum ada Uji Penguasaan dari murid ini di kelas ini.", "This student has no Mastery Check in this class yet."],
  ["mengajar.murid1.tujuan_gagal", "Tujuan pembelajaran yang belum tercapai belum dapat dibaca. Muat ulang halaman ini.",
    "The learning objectives not yet reached could not be read. Reload this page."],
];

const K04: Array<[string, string, string]> = [
  ["laporan.sekolah.semua_cukup_sebagian", "Semua bidang kompetensi yang punya angka berada di 60% ke atas.",
    "Every competency domain with a figure is at 60% or above."],
];

const K05: Array<[string, string, string]> = [
  ["verifikasi.fakta.seperti_terbit", "Seperti saat diterbitkan", "As issued"],
  ["verifikasi.fakta.ditinjau", "Isi ini dapat berubah setelah sekolah penerbit selesai meninjau sertifikat ini.",
    "This may change once the issuing school finishes reviewing the certificate."],
];

const T03: Array<[string, string, string]> = [
  ["peran.perpanjang.sendiri", "Anda satu-satunya Admin PINTAR yang aktif, jadi Anda memperpanjang peran Anda sendiri. Alasannya dicatat.", "You are the only active Admin PINTAR, so you renew your own role. The reason is recorded."],
  ["peran.saya.berakhir_platform", "Peran Anda sebagai {peran} berakhir pada {tanggal}. Minta Admin PINTAR lain memperpanjangnya sebelum tanggal itu.", "Your role as {peran} ends on {tanggal}. Ask another Admin PINTAR to renew it before then."],
  ["peran.saya.berakhir_sendiri", "Peran Anda sebagai {peran} berakhir pada {tanggal}, dan Anda satu-satunya Admin PINTAR yang aktif. Perpanjang sendiri di Peran & akses.", "Your role as {peran} ends on {tanggal}, and you are the only active Admin PINTAR. Renew it yourself in Roles & access."],
  // Daisy's Z7 review, C-2: the two English keys name the roles too
  ["laporan.templat.tak_berwenang", "Menyusun templat laporan memerlukan wewenang Admin sekolah atau Admin PINTAR.", "Assembling a report template requires a school administrator or an Admin PINTAR."],
  ["config.kesehatan.bukan_admin", "Pemeriksaan ini dijalankan oleh Admin PINTAR.", "An Admin PINTAR runs these checks."],
  ["config.refused", "Halaman ini hanya untuk Admin sekolah atau Admin PINTAR.", "This page is only for a school administrator or an Admin PINTAR."],
  ["galat.maintenance_not_allowed", "Anda tidak berwenang mengatur pemeliharaan atau pengumuman untuk cakupan itu. Admin sekolah mengatur sekolahnya sendiri; Admin PINTAR mengatur sekolah mana pun dan seluruh platform.", "You are not authorised to set maintenance or notices for that scope. A school admin sets their own school's; an Admin PINTAR sets any school's and the whole platform's."],
  ["studio.paket.masalah.package_could_not_be_saved", "Paket ini belum bisa disimpan. Coba lagi, atau hubungi Admin PINTAR.", "This package could not be saved. Try again, or contact an Admin PINTAR."],
  ["role.SYSTEM_ADMIN", "Admin PINTAR", "Admin PINTAR"],
  ["galat.role_scope_required", "Pilih Lingkup, yaitu bagian sekolah tempat peran ini berlaku. Hanya Admin PINTAR yang tidak memerlukannya.", "Choose the Scope, the part of the school where this role applies. Only an Admin PINTAR needs none."],
  ["emailuji.r.ditolak", "Hanya Admin PINTAR yang dapat melihat riwayat email.", "Only an Admin PINTAR can see the email history."],
  ["emailuji.ditolak", "Halaman ini hanya untuk Admin PINTAR.", "This page is for an Admin PINTAR only."],
  ["emailuji.galat.ditolak", "Hanya Admin PINTAR yang dapat mengirim email uji.", "Only an Admin PINTAR can send a test email."],
  ["email.uji.alasan", "Anda menerima email ini karena Admin PINTAR sedang menguji pengiriman email.", "You are receiving this email because an Admin PINTAR is testing email delivery."],
  ["aktivasi.ditolak", "Halaman ini untuk Admin sekolah atau Admin PINTAR.", "This page is for a school administrator or an Admin PINTAR."],
  ["aktivasi.galat.baru_ditolak", "PINTAR menolak, dan tidak ada yang dibuat. Hanya Admin PINTAR yang bisa membuat orang di luar pendataan.", "PINTAR refused, and nothing was made. Only an Admin PINTAR can create a person outside the intake."],
  ["orang.intro.sekolah", "Orang di sekolah ini yang sudah punya akun email. Anda bisa mengoreksi alamat email yang salah sebelum orangnya mengaktifkan akun. Nama dan username dikoreksi oleh Admin PINTAR.", "People at this school who have an email account. You can correct a wrong email address before the person activates their account. Names and usernames are corrected by an Admin PINTAR."],
  ["orang.email.hanya_platform", "Akun ini sudah aktif: emailnya hanya bisa dikoreksi oleh Admin PINTAR.", "This account is active: its email can only be corrected by an Admin PINTAR."],
  ["orang.identitas.hanya_platform", "Nama dan username hanya bisa dikoreksi oleh Admin PINTAR.", "Names and usernames can only be corrected by an Admin PINTAR."],
  ["email.aman.ditangguhkan.isi_admin", "Pemulihan dengan PIN untuk PINTAR ID ini dihentikan setelah ditutup sementara tiga kali. Hanya pemulihan lewat email (lalu PIN baru) atau atur ulang oleh Admin PINTAR yang memulihkannya.", "Recovery with a PIN for this PINTAR ID has been stopped after being locked three times. Only an email recovery (then a new PIN) or a reset by an Admin PINTAR restores it."],
  ["email.aman.diatur_ulang.isi_admin", "Pemulihan dengan PIN untuk PINTAR ID ini diatur ulang oleh admin sekolah atau Admin PINTAR. Pemiliknya harus membuat PIN baru.", "A school administrator or an Admin PINTAR reset recovery with a PIN for this PINTAR ID. Its owner must make a new PIN."],
  ["audit.aksi.role.first_system_admin_bootstrapped", "Admin PINTAR pertama ditetapkan", "First Admin PINTAR set up"],
];

export const zUxStaticTests: SelfTest[] = [
  {
    id: "Z-K02-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      kata(c, K02);
      const pernyataan = "Menyederhanakan pecahan senilai";
      const r = render(repoRoot,
        '  const P = (await imp("src/components/siklus/PetaBacaan.tsx")).default;' +
        "  const kartu = (tingkat, kode, alasan) => ({ peringkat: 1, tingkat, kode, pernyataan: \"" + pernyataan + "\" + kode, modul: \"m\", pelajaran: \"p\", halaman: null, alasan });" +
        "  for (const locale of [\"id\", \"en\"]) {" +
        "    out[\"kuat_\" + locale] = r(h(P, { kartu: [kartu(\"KUAT\", \"A\", \"" + pernyataan + "A\")], locale }));" +
        "    out[\"campur_\" + locale] = r(h(P, { kartu: [kartu(\"WAJIB\", \"B\", \"Anda memilih 1/2.\"), kartu(\"KUAT\", \"A\", \"" + pernyataan + "A\")], locale }));" +
        "  }" +
        "  out.kosong = r(h(P, { kartu: [], locale: \"id\" }));");
      if (!c.expect(r.ok, `PetaBacaan could not be rendered: ${r.galat}`)) return c.verdict("");
      for (const locale of ["id", "en"] as const) {
        const kuat = r.out[`kuat_${locale}`], campur = r.out[`campur_${locale}`];
        const arti = t("map.kuat.arti" as HleEvent, "learner", { locale }), label = t("map.tier.KUAT" as HleEvent, "learner", { locale });
        const jelas = t("map.tingkat.arti" as HleEvent, "learner", { locale });
        c.expect(kali(teks(kuat), `${pernyataan}A`) === 1, `(${locale}) a KUAT card prints its statement ${kali(teks(kuat), `${pernyataan}A`)} time(s), not once`);
        c.expect(kali(kuat, arti) === 1 && kuat.includes(label), `(${locale}) a KUAT card does not say «${label}» and «${arti}» once`);
        // the other tiers keep the engine's own reason, which is what makes the map personal
        c.expect(campur.includes("Anda memilih 1/2.") && kali(campur, arti) === 1, `(${locale}) a WAJIB card lost its reason, or map.kuat.arti reached a card that is not KUAT`);
        // the marks are explained where they are drawn, once per map
        c.expect(kali(kuat, jelas) === 1 && kali(campur, jelas) === 1, `(${locale}) the map does not explain its marks once (map.tingkat.arti)`);
      }
      c.expect(r.out.kosong === "", "an empty map draws something");
      c.expect(!/Sudah dikuasai/.test(readFileSync(join(repoRoot, "src", "lib", "hle.ts"), "utf8").match(/"map\.tier\.KUAT":[^\n]*/)?.[0] ?? ""),
        "map.tier.KUAT still says «Sudah dikuasai»");
      return c.verdict("renders PetaBacaan with a KUAT card whose reason fell back to its statement (reading_map's KUAT case), and with a WAJIB card beside it, in ID and EN: «Sudah kuat» and map.kuat.arti once in the KUAT card's reason slot, the statement once, the WAJIB card's own reason kept, and map.tingkat.arti once under the map; Daisy's three sentences word for word");
    },
  },
  {
    id: "Z-K03-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      kata(c, K03, "educator");
      const ajar = buang(readFileSync(join(repoRoot, "src", "lib", "pengajar.ts"), "utf8"));
      const fn = /export async function tujuanBelum\([\s\S]*?\n\}/.exec(ajar)?.[0] ?? "";
      c.expect(/Promise<TujuanBelum\[\] \| null>/.test(fn) && /if \(error\) return null;/.test(fn) && !/return \[\];/.test(fn),
        "tujuanBelum still answers a failed read with [] (read as «no objective below target»), not null");
      // perluPenguatan reads it per learner: since Z N-15 (stream A) a failed read there stays null and is said
      // (Z-N15-01 renders it), never a crash and never «nothing to study again»
      c.expect(/ulang: ulang\[i\] === null \? null : ulang\[i\]\.map\(/.test(ajar), "perluPenguatan does not keep a failed tujuanBelum read as null");
      const hal = buang(readFileSync(join(repoRoot, "src", "app", "mengajar", "[kelas]", "murid", "[orang]", "page.tsx"), "utf8"));
      const bagian = /<section className="pin-sec" aria-labelledby="pin-murid-tujuan">[\s\S]*?<\/section>/.exec(hal)?.[0] ?? "";
      c.expect(bagian !== "", "the objectives section was not found");
      c.expect(/belum === null \?[\s\S]*?mengajar\.murid1\.tujuan_gagal/.test(bagian), "a failed read is not said as a failure (mengajar.murid1.tujuan_gagal)");
      c.expect(/!adaUji \?[\s\S]*?mengajar\.murid1\.tujuan_belum_uji/.test(bagian), "«no Uji Penguasaan yet» is not its own state (mengajar.murid1.tujuan_belum_uji)");
      // «no objective below target» only once the read succeeded AND the learner has a scored Uji Penguasaan here
      const urutan = ["belum === null", "!adaUji", "belum.length === 0", "mengajar.murid1.tujuan_kosong"].map((x) => bagian.indexOf(x));
      c.expect(urutan.every((x, i) => x >= 0 && (i === 0 || x > urutan[i - 1])),
        "«Tidak ada tujuan … di bawah target» is reachable before the failed read and the no-assessment state are ruled out");
      c.expect(/const adaUji = catatan\.hasil\.status === "ok" && catatan\.daftarHasil\.some\(\(h\) => h\.mode === "POST_TEST"\)/.test(hal),
        "the no-assessment state is not read from the learner's own official results (a POST_TEST among them)");
      return c.verdict("reads tujuanBelum, perluPenguatan and the teacher's one-learner page: a failed tujuan_belum_tercapai read is null, never []; the page says a failed read with mengajar.murid1.tujuan_gagal, a learner with no scored Uji Penguasaan in this class with mengajar.murid1.tujuan_belum_uji, and «no objective below target» only after both are ruled out; the words ID and EN");
    },
  },
  {
    id: "Z-K04-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      kata(c, K04, "staff");
      const semua = t("laporan.sekolah.semua_cukup", "staff", { locale: "id" });
      const sebagian = t("laporan.sekolah.semua_cukup_sebagian" as HleEvent, "staff", { locale: "id" });
      const r = render(repoRoot,
        '  const K = (await imp("src/components/laporan/KomposisiSekolah.tsx")).default;' +
        "  const d = (code, mean_score, withheld) => ({ objective_id: code, code, competency: \"Kompetensi \" + code, title: \"Bidang \" + code, mean_score, learners: 12, needed: 5, withheld: withheld ?? null });" +
        "  const e = (value) => [{ metric_id: \"institution.competency_outcomes\", label_key: \"metrik.kompetensi.label\", status: \"ok\", value }];" +
        "  out.penuh = r(h(K, { entries: e([d(\"A\", 0.72), d(\"B\", 0.65)]), locale: \"id\" }));" +
        "  out.tertahan = r(h(K, { entries: e([d(\"A\", 0.72), d(\"B\", null, \"learners\")]), locale: \"id\" }));" +
        "  out.semua_tertahan = r(h(K, { entries: e([d(\"A\", null, \"learners\"), d(\"B\", null, \"class\")]), locale: \"id\" }));");
      if (!c.expect(r.ok, `KomposisiSekolah could not be rendered: ${r.galat}`)) return c.verdict("");
      c.expect(r.out.penuh.includes(semua) && !r.out.penuh.includes(sebagian), "every domain has a figure and is ≥ 60%, but the report does not say «Semua bidang kompetensi berada di 60% ke atas.»");
      c.expect(!r.out.tertahan.includes(semua) && r.out.tertahan.includes(sebagian),
        "one domain is withheld, yet the report says «Semua bidang kompetensi berada di 60% ke atas.» (not semua_cukup_sebagian)");
      c.expect(!r.out.semua_tertahan.includes(semua) && !r.out.semua_tertahan.includes(sebagian),
        "every domain is withheld, yet the report says every domain is at 60% or above");
      return c.verdict("renders KomposisiSekolah three ways: every domain with a figure ≥ 60% says semua_cukup; one withheld says semua_cukup_sebagian; all withheld says neither; the new sentence ID and EN");
    },
  },
  {
    id: "Z-K05-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      kata(c, K05, "public");
      const hal = buang(readFileSync(join(repoRoot, "src", "app", "verifikasi", "[token]", "page.tsx"), "utf8"));
      c.expect(/const sepertiTerbit = row\?\.validity === "DITINJAU" \|\| row\?\.validity === "DICABUT";/.test(hal),
        "the «as issued» heading is not decided by DITINJAU and DICABUT alone");
      const fakta = /\{showsFacts \?[\s\S]*?<\/dl>/.exec(hal)?.[0] ?? "";
      c.expect(/\{sepertiTerbit \? <h2[^>]*>\{s\("verifikasi\.fakta\.seperti_terbit"\)\}<\/h2> : null\}/.test(fakta),
        "the facts are not headed «Seperti saat diterbitkan» under DITINJAU and DICABUT");
      c.expect(/\{row!\.validity === "DITINJAU" \? <p[^>]*>\{s\("verifikasi\.fakta\.ditinjau"\)\}<\/p> : null\}/.test(fakta),
        "verifikasi.fakta.ditinjau is not the line under the heading, for DITINJAU only");
      // the heading and the line come before Hasil, Predikat and the date
      c.expect(fakta.indexOf("verifikasi.fakta.seperti_terbit") < fakta.indexOf("verifikasi.hasil")
        && fakta.indexOf("verifikasi.fakta.ditinjau") < fakta.indexOf("verifikasi.hasil"), "the heading is not above the facts");
      // TIDAK SAH still shows no fact (unchanged)
      c.expect(/const showsFacts = row !== null && status !== undefined && row\.validity !== TAMPERED;/.test(hal), "TIDAK SAH's rule changed");
      return c.verdict("reads the public verification page: under DITINJAU and DICABUT the facts are headed «Seperti saat diterbitkan», above Hasil, Predikat and the date; DITINJAU adds verifikasi.fakta.ditinjau under the heading; BERLAKU and DIGANTIKAN show no heading; TIDAK SAH still shows no fact; Daisy's words ID and EN");
    },
  },
  {
    id: "Z-M1M2-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const l = buang(readFileSync(join(repoRoot, "src", "app", "belajar", "_components", "LanjutkanDiSini.tsx"), "utf8"));
      c.expect(/<BarisHasil nada="netral">\{kata\("pengerjaan\.pulih\.perlu_izin_isi"\)/.test(l), "M1: NOT_AUTHORISED's body is still drawn as an error (nada=\"gagal\")");
      c.expect(/<BarisHasil nada=\{kode === "OFFLINE" \|\| !TENANG\.includes\(kode\) \? "gagal" : "netral"\}>/.test(l)
        && /const TENANG(?:: [^=]+)? = \[\s*"RECOVERY_AUTHORISATION_EXPIRED", "RECOVERY_AUTHORISATION_USED", "RECOVERY_NOTHING",\s*\]/.test(l),
        "M1: EXPIRED, USED and NOTHING are not neutral, or OFFLINE and an unexpected code are not an error");
      const p = buang(readFileSync(join(repoRoot, "src", "app", "belajar", "_components", "PermukaanAsesmen.tsx"), "utf8"));
      // by the assessment's own kind (DAISY-26), never by the player treatment
      c.expect(/judul=\{judulGuru\}/.test(p) && /const kunciGuru = bab \? kunciNamaAsesmen\(bab\.jenis\) : null;/.test(p)
        && /const judulGuru = bab && kunciGuru \? `\$\{s\(kunciGuru\)\} · \$\{bab\.judul\}` : eyebrow;/.test(p),
        "M2: the «Beri tahu guru Anda juga» name is not «Uji Penguasaan · {bab}»");
      for (const [r, jenis] of [["penguasaan", "POST_TEST"], ["pemetaan", "PRE_TEST"]]) {
        const h = buang(readFileSync(join(repoRoot, "src", "app", "belajar", "[tugas]", r, "page.tsx"), "utf8"));
        c.expect(h.includes(`bab={{ jenis: "${jenis}", judul: mine.title }}`), `M2: /belajar/[tugas]/${r} does not pass its kind and the chapter's own title`);
      }
      c.expect(t("posttest.title", "learner", { locale: "id" }) === "Uji Penguasaan", "posttest.title is not «Uji Penguasaan»");
      return c.verdict("reads LanjutkanDiSini and PermukaanAsesmen: NOT_AUTHORISED, EXPIRED, USED and NOTHING are neutral (role=status), OFFLINE and any unexpected code stay an error; the teacher is told «Uji Penguasaan · {bab}» from the chapter's own title, which the cycle's two routes pass; the eyebrow above is unchanged");
    },
  },
  {
    id: "Z-R8-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const akar = join(repoRoot, "src", "app", "belajar", "[tugas]");
      const halaman = halamanDi(akar);
      c.expect(halaman.length === 8, `${halaman.length} pages under /belajar/[tugas]/ (8 expected: the main page, lanjut and the six)`);
      const penjaga = buang(readFileSync(join(repoRoot, "src", "lib", "tugas-saya.ts"), "utf8"));
      c.expect(/export async function tugasSaya\(/.test(penjaga) && /if \(!mine && [^\n]*\) notFound\(\);/.test(penjaga),
        "src/lib/tugas-saya.ts has no tugasSaya guard answering notFound()");
      for (const f of halaman) {
        const src = buang(readFileSync(f, "utf8"));
        const nama = relative(repoRoot, f);
        const jaga = src.search(/await tugasSaya\(db, tugas\b/);
        c.expect(jaga >= 0, `${nama} does not call the segment's guard (tugasSaya)`);
        // before any learning-state read: cycleState, lessons, readingMap or the result
        const baca = src.search(/engine\.(cycleState|lessons|readingMap|outcome|sessionReview)\(/);
        c.expect(jaga >= 0 && (baca < 0 || jaga < baca), `${nama} reads the learning state before the guard`);
        // never the generic refusal for «not yours»: one answer, the main page's
        c.expect(!/if \(!mine(?: \|\| !state)?\) return <HalamanPenolakan/.test(src), `${nama} still answers «not yours» with a refusal page, not the not-found page`);
      }
      return c.verdict("reads every page under /belajar/[tugas]/: each calls the one guard (src/lib/tugas-saya.ts, notFound() when the id is not one of the learner's) before any learning-state read, and none answers «not yours» with its own refusal page");
    },
  },
  {
    id: "Z-S12-02",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const route = buang(readFileSync(join(repoRoot, "src", "app", "api", "masuk", "buka-kembali", "kirim", "route.ts"), "utf8"));
      const periksa = route.indexOf("isianBukaKembaliSah(identitas, pesan)"), pace = route.indexOf('rpc("code_request_pace"');
      c.expect(periksa >= 0 && pace >= 0 && periksa < pace, "the reopening route uses the network's pace before it checks the input (S-12)");
      c.expect(/if \(!isianBukaKembaliSah\(identitas, pesan\)\) \{\s*await tunggu0\(\);\s*return kembali\(\{ kode: "ISIAN" \}\);\s*\}/.test(route),
        "a refused input is not answered as the input's own line (ISIAN), after the same fixed wait");
      // the check is minta_buka_kembali's own, so it never refuses what the database would take (spaces-only btrim, characters)
      const modul = join(repoRoot, "src", "lib", "buka-kembali.ts");
      if (!c.expect(existsSync(modul), "src/lib/buka-kembali.ts (the route's input check) does not exist")) return c.verdict("");
      const { isianBukaKembaliSah: sah } = (await import(modul)) as { isianBukaKembaliSah: (i: string, m: string) => boolean };
      const kasus: Array<[string, string, boolean]> = [
        ["a@b.id", "Saya ingin kembali.", true], ["", "Saya ingin kembali.", false], ["   ", "Saya ingin kembali.", false],
        ["a@b.id", "pendek", false], ["a@b.id", "    pendek    ", false], ["a@b.id", "x".repeat(10), true], ["a@b.id", "x".repeat(500), true],
        ["a@b.id", "x".repeat(501), false], ["a@b.id", "\n\n\n\nabcdef", true], ["a@b.id", "ééééééééé", false], ["a@b.id", "😀".repeat(10), true],
        ["x".repeat(254), "Saya ingin kembali.", true],
      ];
      for (const [i, m, mau] of kasus) c.expect(sah(i, m) === mau, `isianBukaKembaliSah(${JSON.stringify(i.slice(0, 12))}, ${JSON.stringify(m.slice(0, 16))}) is ${!mau}, not ${mau}`);
      return c.verdict("reads the reopening route's source file: the input is checked (isianBukaKembaliSah) before code_request_pace, and a refused input answers ISIAN after the same fixed wait; executes the check on twelve inputs, matching minta_buka_kembali's own rule (spaces-only btrim, characters not code units)");
    },
  },
  {
    id: "Z-R26-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const tk = buang(readFileSync(join(repoRoot, "src", "components", "TombolKirim.tsx"), "utf8"));
      // item 1: opt-in; a native post form's button sets its own busy state at the guard, and Back clears it
      c.expect(/asli\?: boolean;/.test(tk) && /return asli \? <TombolAsli \{\.\.\.sifat\} \/> : <TombolAksi \{\.\.\.sifat\} \/>;/.test(tk),
        "TombolKirim has no opt-in `asli` for a native post form, or it changes the server-action path");
      const asli = /function TombolAsli\([\s\S]*?\n\}/.exec(tk)?.[0] ?? "";
      c.expect(/if \(terkirim\.current\) \{\s*e\.preventDefault\(\);\s*e\.stopImmediatePropagation\(\);\s*return;\s*\}\s*terkirim\.current = true;/.test(asli)
        && /document\.addEventListener\("submit", jagaAsli, true\)/.test(asli) && /window\.addEventListener\("pageshow", tampilLagi\)/.test(asli)
        && /disabled=\{menunggu \|\| disabled\}/.test(asli) && /aria-busy=\{menunggu \? "true" : undefined\}/.test(asli) && /\{menunggu \? sibuk : children\}/.test(asli)
        && !/onClick/.test(asli), "the native-post button does not hold a second submit at the capture-phase guard, say its busy words, or return to its verb on pageshow");
      // item 4: the width at the captured submit is kept only while busy; at rest the style is the caller's own
      c.expect(/sibuk && lebar \? \{ \.\.\.gaya, minInlineSize: lebar \} : gaya/.test(tk)
        && /style=\{gayaSibuk\(pending(?: \|\| tuntas)?, lebar, rest\.style\)\}/.test(tk) && /style=\{gayaSibuk\(menunggu, lebar, rest\.style\)\}/.test(tk)
        && (tk.match(/setLebar\(lebarKini\(tombol\.current\)\);/g) ?? []).length === 2, "a busy button may narrow (no min-inline-size from the width at submit), or the rule applies at rest");
      const hal = buang(readFileSync(join(repoRoot, "src", "app", "masuk", "buka-kembali", "page.tsx"), "utf8"));
      c.expect(/<TombolKirim asli className="pin-btn pin-primary" sibuk=\{s\("tombol\.mengirim"\)\}>\{s\("buka_kembali\.kirim"\)\}<\/TombolKirim>/.test(hal)
        && !/<button type="submit"/.test(hal), "«Kirim permintaan» is still a plain submit button");
      return c.verdict("reads the source files of TombolKirim and the reopening page (R-26 items 1 and 4): `asli` is opt-in and selects a native-post button whose capture-phase guard holds a second submit, sets «Mengirim…», busy and disabled, and returns to its verb on pageshow; both paths keep the width taken at the captured submit as min-inline-size only while busy; «Kirim permintaan» is that button. In a browser: docs/completion-4.1/batches/z/layar/r26-tekan.ts (one POST on a double press, the thank-you answer, Back, no narrowing; red on 4bf300da)");
    },
  },
  {
    id: "Z-R27-02",
    requires: [],
    run: async () => {
      const c = new Checks();
      // R-27(a) (ruling 77): the reopening refusal names the field as it is labelled, «Email atau username»
      kata(c, [["buka_kembali.galat.isian", "Isi email atau username, dan pesan 10 sampai 500 karakter.",
        "Fill in the email or username, and a message of 10 to 500 characters."]], "public");
      const label = t("buka_kembali.identitas", "public", { locale: "id" });
      c.expect(label === "Email atau username", `the field's label is «${label}»`);
      return c.verdict("reads the copy table (R-27(a), ruling 77): buka_kembali.galat.isian names the identity as its field is labelled, «email atau username», word for word in ID and EN");
    },
  },
  {
    id: "Z-R27-03",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const lm = buang(readFileSync(join(repoRoot, "src", "components", "masuk", "LayarMasuk.tsx"), "utf8"));
      const isian = /<input\s+id="identitas"[\s\S]*?\/>/.exec(lm)?.[0] ?? "";
      c.expect(isian !== "", "the sign-in identity field was not found");
      // R-27(c) (ruling 77): an email or a username, so a text keyboard suited to both; nothing rewrites what is typed
      c.expect(!/inputMode=/.test(isian) && /type="text"/.test(isian), `the identity field still asks for an email keyboard: ${isian.replace(/\s+/g, " ").slice(0, 200)}`);
      c.expect(/autoCapitalize="none"/.test(isian) && /autoCorrect="off"/.test(isian) && /spellCheck=\{false\}/.test(isian) && /autoComplete="username"/.test(isian),
        "the identity field autocapitalises, autocorrects or spell-checks, or lost autoComplete=\"username\"");
      return c.verdict("reads the source file of the sign-in screen (R-27(c), ruling 77): the identity field is type=text with no inputMode (a keyboard suited to an email and a username), no autocapitalise, autocorrect or spell-check, and keeps autoComplete=\"username\"");
    },
  },
  {
    id: "Z-R26-02",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const css = readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8");
      const aturan = /a\.pin-konteks-pilih \{([^}]*)\}/.exec(css)?.[1] ?? "";
      // R-26 item 2 (ruling 75): the look stays control-sm; the hit area is control-md (44 px), as .pin-soalbar .pin-btn's
      c.expect(/position: relative;/.test(aturan) && /min-height: var\(--control-sm\);/.test(aturan), "a.pin-konteks-pilih is not position: relative, or its look changed");
      c.expect(/a\.pin-konteks-pilih::after \{\s*content: ""; position: absolute; left: 0; right: 0;\s*top: calc\(50% - var\(--control-md\) \/ 2\); bottom: calc\(50% - var\(--control-md\) \/ 2\);\s*\}/.test(css),
        "a.pin-konteks-pilih has no ::after extending its hit area to control-md (44 px)");
      return c.verdict("reads experience.css (R-26 item 2, ruling 75): a.pin-konteks-pilih keeps its control-sm look and gains position: relative and an ::after that extends its hit area to a 44 px (control-md) band centred on it; the browser proof is docs/completion-4.1/batches/z/layar/r26-tekan.ts");
    },
  },
  {
    id: "Z-S15-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      kata(c, [["aktivasi.galat.buat_gagal", "Akun belum bisa dibuat. Coba lagi sebentar lagi.", "The account could not be made yet. Try again in a moment."]], "staff");
      const hasil = (await import(join(repoRoot, "src", "components", "aktivasi", "hasil.ts"))) as {
        kunciGagal: (m: string, j: { ok: boolean; error?: string } | null) => string;
        galatBuat?: (e: { code?: string | null; status?: number; message?: string | null }) => string;
      };
      // only an address already registered is told «mungkin sudah dipakai»; an outage or a limit is not
      c.expect(hasil.kunciGagal("EMAIL", { ok: false, error: "email_taken" }) === "aktivasi.galat.dipakai"
        && hasil.kunciGagal("NEW_PERSON", { ok: false, error: "email_taken" }) === "aktivasi.galat.dipakai",
        "an address already registered is not told «Alamat email ini mungkin sudah dipakai akun lain»");
      c.expect(hasil.kunciGagal("EMAIL", { ok: false, error: "create_failed" }) === "aktivasi.galat.buat_gagal"
        && hasil.kunciGagal("NEW_PERSON", { ok: false, error: "create_failed" }) === "aktivasi.galat.buat_gagal",
        "an Auth failure that is not a registered address (an outage, a limit) is still told the address may be in use");
      c.expect(hasil.kunciGagal("CLASSROOM_CARD", { ok: false, error: "create_failed" }) === "aktivasi.galat.kartu", "the card's own sentence changed");
      // the route's word is decided from Auth's answer by one function, on the shapes Auth gives
      const bentuk: Array<[{ code?: string | null; status?: number; message?: string | null }, string]> = [
        [{ code: "email_exists", status: 422, message: "A user with this email address has already been registered" }, "email_taken"],
        [{ status: 422, message: "A user with this email address has already been registered" }, "email_taken"],
        [{ code: "unexpected_failure", status: 500, message: "Database error creating new user" }, "create_failed"],
        [{ code: "over_request_rate_limit", status: 429, message: "Request rate limit reached" }, "create_failed"],
        [{ status: 0, message: "fetch failed" }, "create_failed"],
      ];
      c.expect(typeof hasil.galatBuat === "function", "there is no one function (galatBuat) deciding the route's word from Auth's answer");
      if (typeof hasil.galatBuat === "function") {
        for (const [e, mau] of bentuk) c.expect(hasil.galatBuat(e) === mau, `${JSON.stringify(e)} → ${hasil.galatBuat(e)}, not ${mau}`);
      }
      const rute = buang(readFileSync(join(repoRoot, "src", "app", "api", "akun", "aktivasi", "route.ts"), "utf8"));
      c.expect(/error: galatBuat\(created\)/.test(rute), "the activation route does not answer with galatBuat's word");
      return c.verdict("executes src/components/aktivasi/hasil.ts and reads the activation route's source file and the copy table (S-15): Auth's answer is sorted by galatBuat into email_taken (an address already registered) or create_failed (an outage, a rate limit, an unreachable Auth); only email_taken is told «mungkin sudah dipakai»; create_failed reads «Akun belum bisa dibuat. Coba lagi sebentar lagi.», and the card keeps its own sentence");
    },
  },
  {
    id: "Z-S08-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      kata(c, [["lupa.pin.berakhir", "Waktu untuk membuat password baru sudah habis. Ketik lagi PINTAR ID dan PIN Anda.",
        "The time to make a new password has run out. Type your PINTAR ID and PIN again."]], "public");
      const lp = buang(readFileSync(join(repoRoot, "src", "components", "aktifkan", "LupaPassword.tsx"), "utf8"));
      const berakhir = /if \(r\.kode === "PEMULIHAN_BERAKHIR"\) \{[\s\S]*?\n {4}\}/.exec(lp)?.[0] ?? "";
      // the PIN path has no code to ask for: its expiry says to type the PINTAR ID and PIN again; the email path keeps its own
      c.expect(/teks: jalan\.current === "pin" \? s\("lupa\.pin\.berakhir"\) : kalimat\(r, s, locale\)/.test(berakhir),
        "an expiry on the PINTAR ID + PIN path still says «Minta kode baru» (lupa.berakhir), where there is no code");
      return c.verdict("reads the source file of the forgotten-password screen and the copy table (S-08): an expiry on the PINTAR ID + PIN path says lupa.pin.berakhir («Ketik lagi PINTAR ID dan PIN Anda.») on the PIN form; the email path keeps lupa.berakhir; the words ID and EN");
    },
  },
  {
    id: "Z-S13-01",
    requires: [],
    run: async () => {
      const c = new Checks();
      // S-13: the resend is promised on the same condition as the first send (activation_code_target: state REQUIRED)
      // (Daisy's correction is the first sentence; the second, which says which code to use, is kept as it is)
      kata(c, [["aktifkan.kode_ulang_ok", "Jika alamat ini terdaftar dan akunnya belum aktif, PINTAR sedang mengirim kode baru. Pakai kode dari email yang paling baru.",
        "If this address is registered and its account is not active yet, PINTAR is sending a new code. Use the code from the newest email."]], "public");
      return c.verdict("reads the copy table (S-13): the activation resend line promises a new code only «dan akunnya belum aktif», as the first send does and as activation_code_target decides; ID and EN");
    },
  },
  {
    id: "Z-S11-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // the list R-27(b)'s SQL is held to (stream A's fixture, bdcefe31), so the TypeScript and the SQL never disagree
      const daftar = JSON.parse(readFileSync(join(repoRoot, "selftest", "fixtures", "z", "pintar-id-normalisasi.json"), "utf8")) as
        { akun: string; kasus: Array<{ masukan: string; kanonik: string | null; arti: string }> };
      const { kanonikPintarId } = await import("../src/lib/aktivasi-kontrak");
      c.expect(daftar.kasus.length >= 14, `the shared list has only ${daftar.kasus.length} case(s)`);
      for (const k of daftar.kasus) {
        const hasil = kanonikPintarId(k.masukan);
        c.expect(hasil === k.kanonik, `kanonikPintarId(${JSON.stringify(k.masukan)}) is ${hasil}, not ${k.kanonik} (${k.arti})`);
      }
      // S-11: the platform account lookup takes what is pasted («A14C D7ST»), and says a malformed entry, never nothing
      const hal = buang(readFileSync(join(repoRoot, "src", "app", "konfigurasi", "keamanan", "page.tsx"), "utf8"));
      c.expect(/const pid = kanonikPintarId\(sp\.pid\) \?\? "";/.test(hal) && !/\/\^\[0-9A-HJKMNP-TV-Z\]\{8\}\$\/\.test\(\(sp\.pid/.test(hal),
        "the account lookup still accepts only 8 bare characters (a pasted «A14C D7ST» finds nothing), not kanonikPintarId");
      c.expect(/const pidSalah = \(sp\.pid \?\? ""\)\.trim\(\) !== "" && pid === "";/.test(hal), "a malformed entry is not told apart from no entry");
      const ap = buang(readFileSync(join(repoRoot, "src", "components", "keamanan", "AkunPlatform.tsx"), "utf8"));
      const isian = /<input id="akun-pid"[^>]*\/>/.exec(ap)?.[0] ?? "";
      c.expect(/maxLength=\{12\}/.test(isian) && /aria-invalid=\{pidSalah \? "true" : undefined\}/.test(isian), `the lookup field cuts a pasted ID short or does not mark a malformed one: ${isian}`);
      c.expect(/\{pidSalah \? <BarisHasil nada="gagal" id="akun-pid-salah">\{t\("lupa\.pin\.id_salah", "public", \{ locale \}\)\}<\/BarisHasil> : null\}/.test(ap),
        "a malformed PINTAR ID is not said with the existing sentence (ID_TIDAK_SAH, lupa.pin.id_salah)");
      return c.verdict("executes kanonikPintarId over the shared fixture list (selftest/fixtures/z/pintar-id-normalisasi.json, which R-27(b)'s SQL also uses) and reads the source files of the platform account lookup (S-11): a pasted «A14C D7ST» and its I/L/O, hyphen and space forms are found; the field takes 12 characters; a malformed entry is said with the existing ID_TIDAK_SAH sentence, never an empty page");
    },
  },
  {
    id: "Z-R8-03",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // Sharon (R-8 review): tugasSaya is presentation only; a genuine failure stays the error page, never «not found».
      // Executed in a child process (next/navigation does not load under react-server), with a stand-in database that
      // lists no assignment for the learner
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e", `(async () => {
        const m = await import("file://" + process.cwd() + "/src/lib/tugas-saya.ts"); const tugasSaya = (m.default && m.default.tugasSaya) || m.tugasSaya;
        const db = { rpc: async () => ({ data: [], error: null }) };
        const putus = new Error("certificate read failed");
        const coba = async (f) => { try { const v = await f(); return { ok: true, v: v === null ? "null" : typeof v }; }
          catch (e) { return { ok: false, digest: String(e && (e.digest || e.message)), sama: e === putus }; } };
        process.stdout.write(JSON.stringify({
          bukan: await coba(() => tugasSaya(db, "t")),
          tidak: await coba(() => tugasSaya(db, "t", { jugaMilik: async () => false })),
          milik: await coba(() => tugasSaya(db, "t", { jugaMilik: async () => true })),
          gagal: await coba(() => tugasSaya(db, "t", { jugaMilik: async () => { throw putus; } })),
        }));
      })()`], { cwd: repoRoot, encoding: "utf8" });
      type H = { ok: boolean; v?: string; digest?: string; sama?: boolean };
      let r: Record<string, H> = {};
      try { r = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (!c.expect(r.bukan && r.gagal, `tugasSaya could not be run: ${(anak.stderr || "").split("\n")[0]}`)) return c.verdict("");
      const tidakAda = (x: H) => !x.ok && /NEXT_HTTP_ERROR_FALLBACK;404/.test(x.digest ?? "");
      c.expect(tidakAda(r.bukan), "an id that is not the learner's is not answered «not found»");
      c.expect(tidakAda(r.tidak), "neither today's assignment nor an own certificate: not «not found»");
      c.expect(r.milik.ok && r.milik.v === "null", "the learner's own certificate of a chapter no longer assigned is not let through");
      c.expect(!r.gagal.ok && r.gagal.sama === true, `a failed certificate read becomes «${tidakAda(r.gagal) ? "not found" : JSON.stringify(r.gagal)}», not its own error for the error page (it must re-throw)`);
      return c.verdict("executes src/lib/tugas-saya.ts with a stand-in database (Sharon's R-8 review): a not-yours id and an id that is neither assigned nor an own certificate's are notFound(); an own certificate's chapter is let through; a failed certificate read re-throws its own error, so it reaches the error page and never reads as «not found»");
    },
  },
  {
    id: "Z-K07-02",
    requires: [],
    run: async () => {
      const c = new Checks();
      // K-07's floor (stream A, 94ba0632: a pass mark of 1 to 100): the two sentences that state the range (Daisy, via Bob)
      kata(c, [
        ["config.ketuntasan.arti", "Nilai minimum kelulusan setiap pelajaran di sekolah ini, dalam persen bulat dari 1 sampai 100. Guru baru bisa menyediakan sebuah pelajaran untuk kelas setelah batasnya ditetapkan. Perubahan berlaku untuk pelajaran yang disediakan sesudahnya; hasil dan sertifikat yang sudah ada tidak berubah.", "The minimum passing mark for each lesson at this school, as a whole percentage from 1 to 100. A teacher can give a lesson to a class only once its mark is set. A change applies to what is given afterwards; results and certificates that already exist do not change."],
        ["galat.pass_mark_input_incomplete", "Isi nilai bulat dari 1 sampai 100 dan alasannya.", "Enter a whole number from 1 to 100 and a reason."],
      ], "staff");
      return c.verdict("reads the copy table: config.ketuntasan.arti and galat.pass_mark_input_incomplete state K-07's range, «1 sampai 100» / «1 to 100», and nothing else in them changed; ID and EN");
    },
  },
  {
    id: "Z-N16-01",
    requires: [],
    run: async () => {
      const c = new Checks();
      // N-16 (Daisy, Z4 review; S-12's approved wording): the pace is said without claiming that something was sent
      kata(c, [["buka_kembali.galat.tunggu", "Tunggu sebentar, lalu coba lagi.", "Wait a little, then try again."]], "public");
      return c.verdict("reads the copy table (N-16, S-12's wording): buka_kembali.galat.tunggu is «Tunggu sebentar, lalu coba lagi.» / «Wait a little, then try again.», with no claim that a request was sent");
    },
  },
  {
    id: "Z-N17-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const tk = buang(readFileSync(join(repoRoot, "src", "components", "TombolKirim.tsx"), "utf8"));
      const aksi = /function TombolAksi\([\s\S]*?\nfunction TombolAsli/.exec(tk)?.[0] ?? "";
      // N-17 (Daisy, Z4 review): the width taken at the captured submit holds until the VERB returns: while pending and
      // through «✓ {selesai}»; a change to the form (diubah) ends «tuntas», and with it the hold
      c.expect(/style=\{gayaSibuk\(pending \|\| tuntas, lebar, rest\.style\)\}/.test(aksi),
        "a server-action button lets go of its width when it shows «✓ {selesai}», so a shorter result word can pull a neighbour left");
      c.expect(/const tuntas = !pending && selesai !== undefined && !diubah;/.test(aksi), "«tuntas» no longer ends when the form changes");
      return c.verdict("reads the source file of TombolKirim (N-17, R-26 item 4's sibling): a server-action button keeps the width taken at its captured submit while pending and through «✓ {selesai}», until a change to the form returns its verb; the browser check is docs/completion-4.1/batches/z/layar/n17-lebar.ts");
    },
  },
  {
    id: "Z-N9-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      kata(c, [["staf.tidak_dapat_dibuka", "Data staf ini tidak dapat dibuka. Mungkin sudah tidak ada, atau bukan untuk Anda.",
        "This staff record cannot be opened. It may no longer exist, or it is not for you."]], "staff");
      const hal = buang(readFileSync(join(repoRoot, "src", "app", "konfigurasi", "staf", "page.tsx"), "utf8"));
      // N-9 (Daisy, Z-SIAP §1): no person, an unknown one and a forbidden one get one neutral answer of the staff page's own
      c.expect(!/sertifikat\.kelola\.ditolak/.test(hal), "the staff page still refuses with the certificate page's sentence");
      c.expect(/if \(!orangId\) return tolak\("staf\.tidak_dapat_dibuka"\);/.test(hal) && /if \(error \|\| !orangData\) return tolak\("staf\.tidak_dapat_dibuka"\);/.test(hal),
        "no person, and an unknown or forbidden one, do not get the same neutral refusal (staf.tidak_dapat_dibuka)");
      return c.verdict("reads the staff page's source file and the copy table (N-9): no person, an unknown person and one the reader may not open all answer «Data staf ini tidak dapat dibuka. Mungkin sudah tidak ada, atau bukan untuk Anda.», never the certificate page's sentence; ID and EN");
    },
  },
  {
    id: "Z-S02-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // S-02 (SAPU-VERIFIED): a role chosen without a valid date is refused ROLE_UNTIL_INVALID, never dropped silently
      // (which then read «choose a role»); S-03: that refusal states the rule the form and the server apply
      kata(c, [["staf.galat.role_until_invalid", "Tanggal berlaku sampai harus hari ini atau sesudahnya.", "The valid-until date must be today or later."]], "staff");
      const kontrak = (await import(join(repoRoot, "src", "lib", "staf-kontrak.ts"))) as { tambahanPeran?: (p: string, t: string, s: string) => unknown };
      if (c.expect(typeof kontrak.tambahanPeran === "function", "there is no one rule (tambahanPeran) for the role being added")) {
        const f = kontrak.tambahanPeran!;
        const t0 = "00000000-0000-4000-8000-000000000001";
        const kasus: Array<[string, string, string, unknown]> = [
          ["", t0, "", { ada: false }], ["", t0, "2027-01-31", { ada: false }],
          ["EDUCATOR", t0, "2027-01-31", { ada: true }],
          ["EDUCATOR", t0, "", { kode: "ROLE_UNTIL_INVALID" }], ["EDUCATOR", t0, "31/01/2027", { kode: "ROLE_UNTIL_INVALID" }],
          ["EDUCATOR", "", "2027-01-31", { kode: "ROLE_SCOPE_INVALID" }],
        ];
        for (const [peran, tempat, sampai, mau] of kasus) {
          const h = f(peran, tempat, sampai);
          c.expect(JSON.stringify(h) === JSON.stringify(mau), `tambahanPeran(${JSON.stringify(peran)}, ${tempat ? "a place" : "no place"}, ${JSON.stringify(sampai)}) is ${JSON.stringify(h)}, not ${JSON.stringify(mau)}`);
        }
      }
      const aksi = buang(readFileSync(join(repoRoot, "src", "app", "konfigurasi", "staf", "actions.ts"), "utf8"));
      const hal = buang(readFileSync(join(repoRoot, "src", "app", "konfigurasi", "staf", "page.tsx"), "utf8"));
      c.expect(/const tambahan = tambahanPeran\(peran, tempat, sampai\);\s*if \("kode" in tambahan\) kembali\(orang, "ubah", "gagal", tambahan\.kode\);/.test(aksi),
        "the role-change action still drops a role without a date (no tambahanPeran refusal)");
      c.expect(/const tambahan = tambahanPeran\(tambahPeran, tambahTempat, sp\.tambah_sampai \?\? ""\);\s*if \("kode" in tambahan\) kodeTinjau = tambahan\.kode;/.test(hal),
        "the role-change review still drops a role without a date (no tambahanPeran refusal)");
      return c.verdict("executes the rule src/lib/staf-kontrak.ts tambahanPeran and reads the source files of the staff page and its action, and the copy table (S-02, S-03): a role chosen with no valid date is refused ROLE_UNTIL_INVALID in the review and in the act, a role with no place ROLE_SCOPE_INVALID, nothing chosen adds nothing; the refusal reads «Tanggal berlaku sampai harus hari ini atau sesudahnya.»");
    },
  },
  {
    id: "Z-S04-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // S-04 (SAPU-VERIFIED ⚑): a code of the wrong shape is fully knowable, so it is said as the shape, never «maybe taken»
      kata(c, [["pendataan.kode.bentuk_salah", "Kode sekolah terdiri dari tiga huruf atau angka.", "A school code is three letters or digits."]], "staff");
      const modul = join(repoRoot, "src", "lib", "kode-sekolah.ts");
      if (c.expect(existsSync(modul), "src/lib/kode-sekolah.ts (the shape check) does not exist")) {
        const { kodeSekolahSah } = (await import(modul)) as { kodeSekolahSah: (k: string) => boolean };
        // the database's own rule: upper(btrim(x)) ~ '^[A-Z0-9]{3}$' (btrim: spaces only)
        for (const [k, mau] of [["AB1", true], ["ab1", true], [" ab1 ", true], ["AB", false], ["ABCD", false], ["A-1", false], ["", false], ["\tAB1", false], ["ÄB1", false]] as const) {
          c.expect(kodeSekolahSah(k) === mau, `kodeSekolahSah(${JSON.stringify(k)}) is ${!mau}, not ${mau}`);
        }
      }
      const aksi = buang(readFileSync(join(repoRoot, "src", "app", "pendataan", "actions.ts"), "utf8"));
      const fn = /export async function simpanKodeAksi[\s\S]*?\n\}/.exec(aksi)?.[0] ?? "";
      // RESTATED (Daisy's Z5 review, C-1): the shape refusal also sends back what was typed (kenapa); the order is unchanged
      c.expect(fn.indexOf('if (!kodeSekolahSah(kode)) redirect(`/pendataan?galat=kode_bentuk&kenapa=${encodeURIComponent(kode)}`);') >= 0
        && fn.indexOf("kodeSekolahSah(kode)") < fn.indexOf('rpc("reserve_institution_namespace"'), "the code's shape is not checked in the action before the database is asked");
      const hal = buang(readFileSync(join(repoRoot, "src", "app", "pendataan", "page.tsx"), "utf8"));
      c.expect(/sp\.galat === "kode_bentuk" \? <BarisHasil nada="gagal">\{s\("pendataan\.kode\.bentuk_salah"\)\}<\/BarisHasil>/.test(hal), "the page does not say the shape's own line");
      c.expect(/pattern="\[A-Za-z0-9\]\{3\}"/.test(hal), "the code field has no pattern");
      return c.verdict("executes src/lib/kode-sekolah.ts and reads the source files of Pendataan's action and page, and the copy table (S-04): a code of the wrong shape is checked in the action, by the database's own rule, before the database is asked, and is said «Kode sekolah terdiri dari tiga huruf atau angka.»; the field carries pattern=[A-Za-z0-9]{3}; «maybe taken» is left for the rest");
    },
  },
  {
    id: "Z-S05-01",
    requires: [],
    run: async () => {
      const c = new Checks();
      // S-05 (SAPU-VERIFIED ⚑): the hint says the rule, and the database's two distinct refusals are mapped to their own
      // sentences, never the one «Ada isian yang kosong atau belum sesuai»
      kata(c, [
        ["studio.definisi.petunjuk.komposisi", "Kosongkan bila tingkat kesulitan soal tidak diatur. Jumlah ketiganya harus sama dengan Jumlah soal.",
          "Leave empty if the difficulty of the questions is not set. The three must add up to the Number of questions."],
        ["galat.definition_mix_total", "Jumlah soal per tingkat kesulitan harus sama dengan Jumlah soal. Periksa keduanya, lalu coba lagi.",
          "The questions per difficulty must add up to the Number of questions. Check both, then try again."],
        ["galat.definition_safety_over", "Minimum soal keselamatan tidak boleh lebih dari Jumlah soal.",
          "The minimum safety questions cannot be more than the Number of questions."],
      ], "staff");
      const { kodeGalatKonten, kunciKode } = await import("../src/lib/galat-kontrak");
      const salah = (m: string): string => String(kodeGalatKonten({ code: "P0001", message: m } as never));
      c.expect(salah("the difficulty mix totals 4 but the paper carries 5 questions") === "DEFINITION_MIX_TOTAL",
        `the mix refusal reads ${salah("the difficulty mix totals 4 but the paper carries 5 questions")}, not DEFINITION_MIX_TOTAL`);
      c.expect(salah("the safety-critical minimum (6) exceeds the paper size (5)") === "DEFINITION_SAFETY_OVER",
        `the safety refusal reads ${salah("the safety-critical minimum (6) exceeds the paper size (5)")}, not DEFINITION_SAFETY_OVER`);
      c.expect(salah("mode POST_TEST carries between 5 and 40 questions, not 2") === "ACTION_INPUT_INVALID", "the other bounds changed code");
      c.expect(String(kunciKode("DEFINITION_MIX_TOTAL")) === "galat.definition_mix_total" && String(kunciKode("DEFINITION_SAFETY_OVER")) === "galat.definition_safety_over",
        "the two codes do not reach their sentences");
      return c.verdict("executes src/lib/galat-kontrak.ts and reads the copy table (S-05): the database's «difficulty mix totals …» and «safety-critical minimum … exceeds the paper size» are DEFINITION_MIX_TOTAL and DEFINITION_SAFETY_OVER, each with its own sentence naming the fields at fault; the other bounds stay ACTION_INPUT_INVALID; the mix hint says the three must add up to Jumlah soal");
    },
  },
  {
    id: "Z-S06-01",
    requires: [],
    run: async () => {
      const c = new Checks();
      // S-06: a lasting refusal (the content no longer shared, among others) never suggests that a retry later may work
      kata(c, [["pengerjaan.galat.window_not_changeable", "Jadwal materi ini tidak dapat diubah.", "This material's schedule cannot be changed."]], "educator");
      return c.verdict("reads the copy table (S-06): «Jadwal materi ini tidak dapat diubah.» without «saat ini» / «right now», since WINDOW_NOT_CHANGEABLE also carries lasting causes; ID and EN");
    },
  },
  {
    id: "Z-S07-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const aksi = buang(readFileSync(join(repoRoot, "src", "app", "konfigurasi", "actions.ts"), "utf8"));
      const fn = /export async function nonaktifkanStrukturAksi[\s\S]*?\n\}/.exec(aksi)?.[0] ?? "";
      // S-07: a reason of spaces is the missing reason, said as the reason («Tuliskan alasan …»), not «Lengkapi pilihan»
      c.expect(/if \(!alasan\) return \{ ok: false, code: "STRUCTURE_REASON_REQUIRED" \};/.test(fn), "a deactivation with a reason of spaces is not answered STRUCTURE_REASON_REQUIRED");
      c.expect(t("config.struktur.galat.alasan_kosong", "staff", { locale: "id" }) === "Tuliskan alasan tempat ini dinonaktifkan.", "the reason's own sentence changed");
      return c.verdict("reads the source file of Konfigurasi's actions (S-07): deactivating a place with a reason that trims to nothing answers STRUCTURE_REASON_REQUIRED («Tuliskan alasan tempat ini dinonaktifkan.»), not the choice's «Lengkapi pilihan yang diminta.»");
    },
  },
  {
    id: "Z-S16-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const fa = buang(readFileSync(join(repoRoot, "src", "components", "aktivasi", "FormAktivasi.tsx"), "utf8"));
      const isian = /<input ref=\{namaBaruRef\}[\s\S]*?\/>/.exec(fa)?.[0] ?? "";
      // S-16 (⚑ maxLength only): authorize_new_person refuses a name over 200 characters; the field says so by its length
      c.expect(/maxLength=\{200\}/.test(isian), `the new person's name field takes more than authorize_new_person accepts: ${isian}`);
      return c.verdict("reads the source file of the activation form (S-16): the new person's name field has maxLength={200}, authorize_new_person's own limit");
    },
  },
  {
    id: "Z-R26-03",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // R-26 item 3 (ruling 75; Daisy's package): four «Simpan» say what they do, each its own key; the busy words unchanged
      kata(c, [
        ["lapor.triase.simpan", "Perbarui status", "Update status"],
        ["config.struktur.simpan", "Simpan nama", "Save name"],
        ["studio.definisi.buat", "Buat aturan", "Create rule"],
        ["studio.definisi.simpan", "Simpan perubahan", "Save changes"],
        ["studio.kanonik.beri", "Berikan izin", "Grant permission"],
      ], "staff");
      const baca = (...f: string[]) => buang(readFileSync(join(repoRoot, ...f), "utf8"));
      const def = baca("src", "app", "studio", "definisi", "page.tsx");
      const baru = /<form action=\{saveDefinitionAction\} id="definisi-baru"[\s\S]*?<\/form>/.exec(def)?.[0] ?? "";
      const baris = /<form action=\{saveDefinitionAction\} id=\{`definisi-\$\{d\.id\}`\}[\s\S]*?<\/form>/.exec(def)?.[0] ?? "";
      c.expect(/sibuk=\{s\("tombol\.menyimpan"\)\}>\{s\("studio\.definisi\.buat"\)\}<\/TombolKirim>/.test(baru), "the new rule's button is not «Buat aturan» (studio.definisi.buat)");
      c.expect(/sibuk=\{s\("tombol\.menyimpan"\)\}>\{s\("studio\.definisi\.simpan"\)\}<\/TombolKirim>/.test(baris), "a rule's edit row is not «Simpan perubahan» (studio.definisi.simpan)");
      const kan = baca("src", "app", "studio", "kanonik", "page.tsx");
      c.expect(/\{s\("studio\.kanonik\.beri"\)\}<\/TombolKirim>/.test(kan) && !/studio\.definisi\.simpan/.test(kan), "Kanonik's grant still borrows the rule's «Simpan»; it is not «Berikan izin» (studio.kanonik.beri)");
      return c.verdict("reads the copy table and the source files of the Studio rule and Kanonik pages (R-26 item 3): «Perbarui status», «Simpan nama», «Buat aturan» (the new rule, its own key), «Simpan perubahan» (a rule's edit) and «Berikan izin» (Kanonik's grant, its own key studio.kanonik.beri); ID and EN");
    },
  },
  {
    id: "Z-T03-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // T-03 (ruling 78 (d), Daisy's final words): one name for the platform's administrator, «Admin PINTAR», in its 22 keys
      kata(c, T03, "staff");
      // and the one EN key that said «PINTAR administrator»
      kata(c, [["email.aman.diatur_ulang.isi",
        "Admin PINTAR mengatur ulang pemulihan dengan PIN untuk akun Anda. PIN lama Anda tidak berlaku lagi, dan Anda sudah dikeluarkan dari semua perangkat: masuk ke PINTAR, lalu buat PIN baru di Akun saya.",
        "An Admin PINTAR reset recovery with a PIN for your account. Your old PIN no longer works, and you have been signed out of every device: sign in to PINTAR, then make a new PIN in My account."]], "staff");
      // no word of the copy table, in either language, still names the role another way (the 22 were all of them)
      const hle = readFileSync(join(repoRoot, "src", "lib", "hle.ts"), "utf8");
      const sisa = [...hle.matchAll(/^ {2}"([^"]+)": \{[^\n]*/gm)].filter((m) => /admin platform|platform admin|PINTAR administrator/i.test(m[0])).map((m) => m[1]);
      c.expect(sisa.length === 0, `the copy table still names the platform's administrator otherwise: ${sisa.join(", ")}`);
      return c.verdict("reads the copy table (T-03): the 22 keys of ruling 78 (d) say «Admin PINTAR» word for word in ID and EN («an Admin PINTAR» in running text), email.aman.diatur_ulang.isi's English too, and no key in either language still says «Admin platform», «platform admin(istrator)» or «PINTAR administrator»");
    },
  },
  {
    id: "Z-T09-T02-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // T-09: the assessment names in English are their English names
      kata(c, [
        ["mengajar.ulang.belum_uji", "belum menyelesaikan Uji Penguasaan", "has not finished the Mastery Check"],
        ["staf.tj.can_quick_assessment", "Membuat Uji Cepat", "Creating Quick Assessments"],
      ], "staff");
      kata(c, [["pengerjaan.pulih.perlu_izin_isi",
        "Karena Anda masuk lagi atau berganti perangkat, Uji Penguasaan ini hanya dapat dilanjutkan bila guru Anda mengizinkannya. Permintaan Anda tampil di daftar kelas guru Anda. Beri tahu guru Anda juga: {judul}. Setelah guru mengizinkan, pilih Coba lagi.",
        "Because you signed in again or changed device, this Mastery Check can only continue if your teacher allows it. Your request shows on your teacher's class list. Tell your teacher too: {judul}. Once your teacher allows it, choose Try again."]], "learner");
      // T-02 (⚑ delete): mengajar.langkah.f2 is shown nowhere, so it is gone from the copy table and its type
      const hle = readFileSync(join(repoRoot, "src", "lib", "hle.ts"), "utf8");
      c.expect(!/"mengajar\.langkah\.f2"/.test(hle), "mengajar.langkah.f2 is still in the copy table");
      c.expect(/"mengajar\.langkah\.f2w"/.test(hle), "mengajar.langkah.f2w, which is shown, went with it");
      return c.verdict("reads the copy table: T-09's three keys name «Mastery Check» and «Quick Assessments» in English, the Indonesian unchanged; T-02's unused mengajar.langkah.f2 is absent from the copy table and its type, and f2w is kept");
    },
  },
  {
    id: "Z-S09-S10-S14-01",
    requires: [],
    run: async () => {
      const c = new Checks();
      kata(c, [
        // S-09: the PIN path's wait is keyed by the network address, so it speaks of the network
        ["lupa.pin.sering", "Terlalu banyak percobaan dari jaringan ini.", "Too many tries from this network."],
        // S-10: a reset PIN is no PIN that can be used
        ["kunci.tanpa_pin", "Akun ini belum punya PIN yang bisa dipakai, jadi layar ini tidak bisa dibuka dengan PIN. Keluar, lalu masuk lagi.",
          "This account has no PIN that can be used, so this screen can't be opened with a PIN. Sign out, then sign in again."],
        // S-14 (Daisy's Z7 review, C-1): activation reads these too and takes an email only, so they name neither
        ["aktifkan.minta_sering", "Kode sudah terlalu sering diminta, jadi kode tidak dikirim.", "A code has been asked for too often, so no code was sent."],
        ["aktifkan.kode_sering", "Kode sudah terlalu sering dicoba.", "The code has been tried too many times."],
      ], "learner");
      return c.verdict("reads the copy table: S-09 «jaringan ini», S-10 «PIN yang bisa dipakai» and S-14's two waits naming neither an address nor a username (activation reads them too), word for word in ID and EN");
    },
  },
  {
    id: "Z-N1-N2-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // N-1 and N-2 (R-12; Daisy, Z-SIAP §3): the maintenance banner, RENDERED with a class window, at stage 0 and at T−15
      kata(c, [["pemeliharaan.pita.asesmen_baru_staf", "Murid tidak dapat memulai asesmen baru sampai pemeliharaan selesai.",
        "Students cannot start a new assessment until maintenance ends."]], "staff");
      const r = render(repoRoot, `
        const P = (await imp("src/components/pemeliharaan/PengingatPemeliharaan.tsx")).default;
        const { PathnameContext } = await import("next/dist/shared/lib/hooks-client-context.shared-runtime.js");
        const j = (keadaan, mulai) => ({ id: "w", jenis: "PLANNED", keadaan, mulai, selesai: "2026-11-23T10:00:00Z", pesan: null, menguasai: false,
          berjalan: false, terkumpul: null, kelas: ["5B"], kelasId: ["k5b"], cakupan: "TEMPAT", sekolah: "Sekolah Uji", zona: "Asia/Jakarta" });
        for (const [nama, path, keadaan, mulai, staf] of [
          ["pemain", "/belajar/asesmen/x", "AKTIF", "2026-11-23T07:00:00Z", false], ["lain", "/belajar", "AKTIF", "2026-11-23T07:00:00Z", false],
          ["t15murid", "/belajar", "MENJELANG", "2026-11-23T08:10:00Z", false], ["t15staf", "/mengajar", "MENJELANG", "2026-11-23T08:10:00Z", true]]) {
          out[nama] = r(h(PathnameContext.Provider, { value: path }, h(P, { locale: "id", staf, status: { pemeliharaan: [j(keadaan, mulai)],
            pengumuman: [], terhenti: null, sekarang: "2026-11-23T08:00:00.000Z" } })));
        }`);
      if (!c.expect(r.ok, `the banner could not be rendered: ${r.galat}`)) return c.verdict("");
      const s = (k: string, p: "learner" | "staff" = "learner") => t(k as HleEvent, p, { locale: "id" });
      const arti = s("pemeliharaan.tempat.arti").replace("{untuk}", "kelas 5B");
      const lega = s("pemeliharaan.pita.asesmen");
      const [pemain, lain, t15murid, t15staf] = [teks(r.out.pemain), teks(r.out.lain), teks(r.out.t15murid), teks(r.out.t15staf)];
      // N-1: on the player the reassurance leads, and the restriction it would follow is not said there
      c.expect(pemain.includes(lega) && !pemain.toLowerCase().includes(arti.toLowerCase()),
        `N-1: on the player the banner does not lead with «${lega}»: «${pemain}»`);
      c.expect(lain.toLowerCase().includes(arti.toLowerCase()), `N-1: off the player the banner no longer explains the class window: «${lain}»`);
      // N-2: at T−15 a learner is told they cannot start; staff are told their learners cannot
      c.expect(t15murid.includes(s("pemeliharaan.pita.asesmen_baru")) && !t15murid.includes(s("pemeliharaan.pita.asesmen_baru_staf", "staff")),
        `N-2: a learner's T−15 banner is not the learner's sentence: «${t15murid}»`);
      c.expect(t15staf.includes(s("pemeliharaan.pita.asesmen_baru_staf", "staff")) && !t15staf.includes(s("pemeliharaan.pita.asesmen_baru")),
        `N-2: a staff member's T−15 banner speaks to a learner: «${t15staf}»`);
      // the reader is staff by their own roles, read on the server once (PitaPemeliharaan)
      const pita = buang(readFileSync(join(repoRoot, "src", "components", "pemeliharaan", "PitaPemeliharaan.tsx"), "utf8"));
      c.expect(/peranSaya\(\)/.test(pita) && /staf=\{/.test(pita), "PitaPemeliharaan does not tell the banner whether its reader is staff");
      return c.verdict("renders PengingatPemeliharaan with a class window: at stage 0 on the player it leads with pemeliharaan.pita.asesmen and drops the restriction (N-1), off the player it keeps it; at T−15 a learner reads pita.asesmen_baru and a staff member the new pita.asesmen_baru_staf «Murid tidak dapat memulai asesmen baru …» (N-2), the reader's kind given by PitaPemeliharaan from peranSaya; the new sentence word for word in ID and EN");
    },
  },
  {
    id: "Z-R15-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // R-15's one-string items (Z-BUILD-PLAN, Z7)
      // 1. Kenaikan step 2's live status line joins its parts with «, » (the «·» inside a part, «6A · 2027/28», stays its own)
      const dk = buang(readFileSync(join(repoRoot, "src", "components", "kenaikan", "DaftarKeputusan.tsx"), "utf8"));
      c.expect(/const status = bagian\.join\(", "\)/.test(dk) && !/bagian\.join\(" · "\)/.test(dk), "Kenaikan step 2's status line still joins with «·»");
      // 2. the review's summary names the main group first, executed
      const { urutRingkas } = await import(join(repoRoot, "src", "lib", "kenaikan.ts")) as { urutRingkas?: (g: { utama: string | null; kelompok: Array<{ kunci: string }> }) => Array<{ kunci: string }> };
      if (c.expect(typeof urutRingkas === "function", "src/lib/kenaikan.ts has no urutRingkas")) {
        // Daisy's Z7 review (5): the main group first, then the rest in the FIXED outcome order of step 2's statuses, so two
        // reviews of the same promotion read alike whatever order the learners came in
        const k = ["KELUAR:PINDAH_SEKOLAH", "LULUS", "TINGGAL:x", "NAIK:b", "NAIK:a"];
        const urut = urutRingkas!({ utama: "LULUS", kelompok: k.map((kunci) => ({ kunci })) }).map((x) => x.kunci);
        const balik = urutRingkas!({ utama: "LULUS", kelompok: [...k].reverse().map((kunci) => ({ kunci })) }).map((x) => x.kunci);
        c.expect(JSON.stringify(urut) === JSON.stringify(["LULUS", "NAIK:a", "NAIK:b", "TINGGAL:x", "KELUAR:PINDAH_SEKOLAH"]), `the summary's order is ${urut.join(", ")}`);
        c.expect(JSON.stringify(balik) === JSON.stringify(urut), `the summary's order follows the learners' order: ${balik.join(", ")}`);
        const tanpa = urutRingkas!({ utama: null, kelompok: [{ kunci: "KELUAR:X" }, { kunci: "NAIK:a" }] }).map((x) => x.kunci);
        c.expect(tanpa.join() === "NAIK:a,KELUAR:X", `with no main group the order is not the outcomes' own: ${tanpa.join()}`);
      }
      const kk = buang(readFileSync(join(repoRoot, "src", "components", "kenaikan", "KenaikanKelas.tsx"), "utf8"));
      c.expect(/urutRingkas\(g\)\.map\(/.test(kk), "the review's summary does not use urutRingkas");
      // 3. X12: the certificate list's column names the package
      // (Daisy's Z7 review, C-3: the concept's full name, as studio.paket.judul has it)
      // RESTATED (D2-R, rev. 4's alignment, Daisy's D2R-KATA.md): the column is «Materi Pembelajaran» / «Learning Material»
      kata(c, [["sertifikat.kelola.kolom.kursus", "Materi Pembelajaran", "Learning Material"]], "staff");
      return c.verdict("R-15's one-string items: reads DaftarKeputusan.tsx (Kenaikan step 2's status joined by «, »), executes src/lib/kenaikan.ts's urutRingkas (the review summary names the main group first, then the others in step 2's fixed outcome order, whatever order the learners came in) and reads KenaikanKelas.tsx using it; the copy table's certificate column «Materi Pembelajaran» / «Learning Material» (X12, restated by D2-R)");
    },
  },
  {
    id: "Z-Z5R-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const baca = (...f: string[]) => buang(readFileSync(join(repoRoot, ...f), "utf8"));
      // Daisy's Z5 review (TINJAUAN-Z5-bc5749ff): C-2's and finding (a)'s words, word for word
      kata(c, [
        ["galat.definition_mix_total_baris", "Aturan ini membagi soalnya per tingkat kesulitan, jadi Jumlah soal tidak dapat diubah di sini. Buat aturan baru dengan jumlah yang diinginkan.",
          "This rule divides its questions by difficulty, so the Number of questions cannot be changed here. Create a new rule with the number you want."],
        ["studio.definisi.dibuat", "Aturan baru dibuat.", "The new rule has been created."],
      ], "staff");
      // C-1: the shape refusal sends back what was typed, and the field shows it
      const aksi = baca("src", "app", "pendataan", "actions.ts");
      c.expect(/redirect\(`\/pendataan\?galat=kode_bentuk&kenapa=\$\{encodeURIComponent\(kode\)\}`\)/.test(aksi), "C-1: the shape refusal does not send back what was typed");
      const hal = baca("src", "app", "pendataan", "page.tsx");
      c.expect(/defaultValue=\{ketikan \?\? dipilih\.kode \?\? ""\}/.test(hal) && /sp\.galat === "kode_bentuk"[^\n]*sp\.kenapa/.test(hal), "C-1: the code field is not refilled from kenapa after a refusal");
      // C-2 and (a): the row's refusal and the new rule's success are their own sentences, each where it is answered
      const def = baca("src", "app", "studio", "definisi", "page.tsx");
      c.expect(/<HasilDi q=\{sp\} bagian="definisi" kalimat=\{bannerBaru\} \/>/.test(def) && (def.match(/bagian="definisi-baris"[^>]*kalimat=\{banner\}/g) ?? []).length === 2
        && /const banner = [^\n]*sp\.kode === "DEFINITION_MIX_TOTAL" \? mix\(outcomeLine\(sp, locale\)\)/.test(def),
        "the new-rule form and the rows do not each answer in their own words");
      // (b): the place word in the bar never breaks inside a word and is never shortened
      const css = readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8");
      const aturanTempat = [...css.matchAll(/([^{}]*\.pin-bar-tempat[^{}]*)\{([^}]*)\}/g)].map((m) => m[2]).join(";");
      c.expect(!/overflow-wrap:\s*anywhere|word-break:\s*break|hyphens:\s*auto|text-overflow:\s*ellipsis/.test(aturanTempat) && /min-width:\s*min-content/.test(aturanTempat),
        `(b): the place word may break inside a word or be shortened: ${aturanTempat.replace(/\s+/g, " ").slice(0, 300)}`);
      const shell = baca("src", "components", "CangkangPengalaman.tsx");
      c.expect(/<div className="pin-staf-judul">\s*<div className="pin-staf-kepala">[\s\S]*?<\/div>\s*<span className="pin-bar-tempat">\{kini\}<\/span>\s*<\/div>/.test(shell),
        "(b): the brand and the place word are not one wrapping row");
      return c.verdict("Daisy's Z5 review: the copy table's two new sentences (C-2's row refusal, (a)'s creation) word for word in ID and EN; the source of Pendataan's action and page sends back and refills a refused code (C-1); the rule page's source answers the new-rule form with bannerBaru and the rows with banner, whose mix-total refusal is the row's own; the CSS file gives the bar's place word no break inside a word, no hyphenation and no ellipsis, at least its longest word wide, and the shell's source wraps it with the brand in one row (b; the browser measure is tempat-320.ts)");
    },
  },
  {
    id: "Z-BINGKAI-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // Z6 (R-11; Daisy, Z-SIAP §2): the rendered-check helper catches a FRAMED overflow. BINGKAI is executed against a
      // small page built here (the browser proof is the sweep, sapu-z6.ts), with a frame that scrolls, the tab row, a part
      // wider than the window and a hidden frame
      let m: { BINGKAI?: () => { lebar: number; sebab: string[] } | null } = {};
      try { m = await import(join(repoRoot, "audit", "a11y.mjs")); } catch (e) { c.expect(false, `audit/a11y.mjs could not be read: ${(e as Error).message}`); }
      if (!c.expect(typeof m.BINGKAI === "function", "the rendered-check helper (audit/a11y.mjs) has no framed-overflow check (BINGKAI)")) return c.verdict("");
      type El = { tagName: string; id: string; classList: string[]; parentElement: El | null; anak: El[]; gaya: Record<string, string>; attr: Record<string, string>; textContent: string;
        getAttribute(n: string): string | null;
        kotak: { width: number; height: number; right: number }; scrollWidth: number; clientWidth: number;
        querySelectorAll(s: string): El[]; closest(s: string): El | null; getBoundingClientRect(): { width: number; height: number; right: number } };
      const buat = (tagName: string, kelas: string[], o: Partial<{ id: string; gaya: Record<string, string>; lebar: number; kanan: number; isi: number; tinggi: number; attr: Record<string, string>; teks: string }> = {}, anak: El[] = []): El => {
        const el: El = {
          tagName: tagName.toUpperCase(), id: o.id ?? "", classList: Object.assign([...kelas], { contains: (k: string) => kelas.includes(k) }), parentElement: null, anak, attr: o.attr ?? {}, textContent: o.teks ?? "",
          getAttribute: (n: string) => (n in el.attr ? el.attr[n] : null),
          gaya: { overflowX: "visible", visibility: "visible", position: "static", ...(o.gaya ?? {}) },
          kotak: { width: o.lebar ?? 300, height: o.tinggi ?? 40, right: o.kanan ?? (o.lebar ?? 300) },
          scrollWidth: o.isi ?? o.lebar ?? 300, clientWidth: o.lebar ?? 300,
          querySelectorAll: () => { const out: El[] = []; const jalan = (e: El) => { for (const a of e.anak) { out.push(a); jalan(a); } }; jalan(el); return out; },
          closest: (s: string) => { const k = s.replace(/^\./, ""); for (let a: El | null = el; a; a = a.parentElement) if (a.classList.includes(k)) return a; return null; },
          getBoundingClientRect: () => el.kotak,
        };
        for (const a of anak) a.parentElement = el;
        return el;
      };
      const ukur = (main: El, lebar = 390) => {
        const g = globalThis as unknown as Record<string, unknown>;
        const lama = { document: g.document, getComputedStyle: g.getComputedStyle };
        const body = buat("body", [], {}, [main]);
        const semua = [main, ...main.querySelectorAll("*")];
        g.document = { querySelector: (s: string) => (s === "main" ? main : null), body, documentElement: { clientWidth: lebar },
          getElementById: (i: string) => semua.find((e) => e.id === i) ?? null };
        g.getComputedStyle = (e: El) => e.gaya;
        try { return m.BINGKAI!(); } finally { g.document = lama.document; g.getComputedStyle = lama.getComputedStyle; }
      };
      // Daisy's Z6 ruling: a wide data table may scroll in its frame (WCAG 1.4.10) when the frame is a .pin-tabel-bingkai with
      // role="region", tabindex="0" and a name that resolves to text; anything else that scrolls sideways is caught, once
      const bingkai = (attr: Record<string, string>, anakLain: El[] = []) => buat("main", [], {}, [buat("div", ["pin-tabel-bingkai"], { id: "pin-siapa-murid", gaya: { overflowX: "auto" }, lebar: 324, isi: 452, attr },
        [buat("table", ["pin-tabel"], { lebar: 452, kanan: 470 })]), ...anakLain]);
      const LENGKAP = { role: "region", tabindex: "0", "aria-label": "Siapa · 5A" };
      c.expect(ukur(bingkai(LENGKAP)) === null, "a named, focusable region frame holding a wide table is reported");
      c.expect(ukur(bingkai({ role: "region", tabindex: "0", "aria-labelledby": "judul" }, [buat("h2", [], { id: "judul", teks: "Jejak audit" })])) === null,
        "a frame named by aria-labelledby is reported");
      for (const [kurang, attr] of [["role", { tabindex: "0", "aria-label": "X" }], ["tabindex", { role: "region", "aria-label": "X" }], ["name", { role: "region", tabindex: "0", "aria-label": "  " }],
        ["name (an empty label)", { role: "region", tabindex: "0", "aria-labelledby": "kosong" }]] as const) {
        const a = ukur(bingkai(attr as Record<string, string>, [buat("h2", [], { id: "kosong", teks: "" })]));
        c.expect(a !== null && a.sebab.length === 1 && /^div#pin-siapa-murid\.pin-tabel-bingkai scrolls sideways \(452 px in 324 px\)/.test(a.sebab[0]),
          `a frame without its ${kurang} is not caught as itself: ${JSON.stringify(a)}`);
      }
      const lain = ukur(buat("main", [], {}, [buat("div", ["pin-kotak"], { gaya: { overflowX: "auto" }, lebar: 300, isi: 500, attr: LENGKAP })]));
      c.expect(lain !== null && /^div\.pin-kotak scrolls sideways/.test(lain.sebab[0]), "a box that is not a table's frame is excused for being a named region");
      // a segmented control never scrolls and never holds more than its width (Daisy's Z6 ruling)
      const seg1 = ukur(buat("main", [], {}, [buat("div", ["pin-seg"], { gaya: { overflowX: "auto" }, lebar: 256, isi: 286 })]));
      const seg2 = ukur(buat("main", [], {}, [buat("div", ["pin-seg"], { lebar: 256, isi: 286 })]));
      c.expect(seg1 !== null && seg2 !== null && /^div\.pin-seg holds more than its width/.test(seg2.sebab[0]), `a segmented control wider than itself is not caught: ${JSON.stringify([seg1, seg2])}`);
      // the tab row (v3 Tabs, Daisy F10) is the one designed exception
      c.expect(ukur(buat("main", [], {}, [buat("nav", ["pin-switch"], { gaya: { overflowX: "auto" }, lebar: 300, isi: 600 }, [buat("a", [], { lebar: 600, kanan: 610 })])])) === null,
        "the tab row, which scrolls by design, is reported");
      // a part wider than the window, in no scrolling box
      const c3 = ukur(buat("main", [], {}, [buat("div", ["pin-lebar"], { lebar: 420, kanan: 436 })]));
      c.expect(c3 !== null && /div\.pin-lebar is wider than the window \(420 px, to 436 in 390\)/.test(c3.sebab.join()), `a part wider than the window is not caught: ${JSON.stringify(c3)}`);
      // a hidden frame (display: none measures 0 × 0) and a frame that fits are not
      c.expect(ukur(buat("main", [], {}, [buat("div", ["pin-tabel-bingkai"], { gaya: { overflowX: "auto" }, lebar: 0, tinggi: 0, isi: 452 }),
        buat("div", ["pin-tabel-bingkai"], { gaya: { overflowX: "auto" }, lebar: 324, isi: 324 })])) === null, "a hidden frame or one that fits is reported");
      // and the crawl judges it at 320 px, less the parts on the ruling 79 audit list
      const crawl = readFileSync(join(repoRoot, "audit", "crawl.mjs"), "utf8");
      c.expect(/rec\.bingkai = await page\.evaluate\(BINGKAI\)/.test(crawl) && /rec\.bingkaiBaru = bingkaiBaru\(/.test(crawl) && /if \(x\.bingkaiBaru\) broken\.push\(/.test(crawl),
        "the crawl does not hold a page broken for a framed overflow");
      // Daisy's Z6 ruling: nothing is parked; the list of excused parts is empty
      const mk = m as { BINGKAI_DIKETAHUI?: unknown[] };
      c.expect(Array.isArray(mk.BINGKAI_DIKETAHUI) && mk.BINGKAI_DIKETAHUI.length === 0, `parts are still excused: ${JSON.stringify(mk.BINGKAI_DIKETAHUI)}`);
      return c.verdict("executes BINGKAI from the rendered-check helper audit/a11y.mjs against a page built in the test: a wide table's frame that is a named, focusable region (aria-label or aria-labelledby) passes, and one missing its role, tabindex or name is caught once, as itself; any other box that scrolls sideways is caught; a segmented control wider than itself is caught, scrolling or not; the tab row (.pin-switch, designed) is not; a part wider than the window in no scrolling box is; a hidden frame and one that fits are not; no part is excused (BINGKAI_DIKETAHUI empty); reads the source of audit/crawl.mjs, which holds such a page broken at 320 px");
    },
  },
  {
    id: "Z-R11-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // R-11 (Daisy, Z-SIAP §2) and N-8: «Siapa» below 640 px is a list of blocks, the instrument switch wraps below 360 px,
      // Studio's nested panels keep less padding at 360 px and under. Koleksi RENDERED with stacked rows and with none
      const r = render(repoRoot, `
        const K = (await imp("src/components/koleksi/Koleksi.tsx")).default;
        const p = { id: "uji", nama: "Siapa · 5A", benda: "murid", kolom: [{ judul: "Nama" }, { judul: "Keadaan" }], totalSemua: 2, locale: "id", untuk: "educator", jalan: "/x" };
        const baris = (t) => [["a", "Ani"], ["b", "Budi"]].map(([k, n]) => ({ kunci: k, nama: n, sel: [h("span", { className: "chip" }, "Belum mulai")],
          ...(t ? { tumpuk: { judul: n, bagian: [h("p", { className: "pin-meta" }, "Dikumpulkan 09.10 WIB"), h("p", null, h("span", { className: "pin-koleksi-tumpuk-label" }, "Keadaan"), " ", h("span", { className: "chip" }, "Belum mulai")), h("p", null, h("a", { href: "#atur" }, "Atur"))] } } : {}) }));
        out.tumpuk = r(h(K, { ...p, baris: baris(true), posisi: { total: 2, halaman: 1, ukuran: 50 } }));
        out.tabel = r(h(K, { ...p, baris: baris(false), posisi: { total: 2, halaman: 1, ukuran: 50 } }));
        out.kosong = r(h(K, { ...p, baris: [], cari: "zz", posisi: { total: 0, halaman: 1, ukuran: 50 } }));
        out.halaman = r(h(K, { ...p, totalSemua: 120, baris: baris(true), posisi: { total: 120, halaman: 1, ukuran: 50 } }));`);
      if (!c.expect(r.ok, `Koleksi could not be rendered: ${r.galat}`)) return c.verdict("");
      const li = [...(r.out.tumpuk ?? "").matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => x[1]);
      c.expect(/<div class="pin-koleksi" id="uji-koleksi" data-tumpuk="">/.test(r.out.tumpuk) && /<ul class="pin-koleksi-tumpuk" aria-label="Siapa · 5A">/.test(r.out.tumpuk) && li.length === 2,
        "rows carrying their block are not drawn as a named list beside the table");
      c.expect(li.every((x, i) => new RegExp(`^<h3 class="pin-koleksi-tumpuk-judul">${["Ani", "Budi"][i]}</h3>`).test(x) && x.indexOf("Dikumpulkan") < x.indexOf("Keadaan")
        && x.indexOf("Keadaan") < x.indexOf("Belum mulai") && x.indexOf("Belum mulai") < x.indexOf("Atur")),
        `a block is not the name as its heading, then the sitting's line, the labelled state and «Atur»: ${li[0]}`);
      c.expect(!/data-tumpuk|pin-koleksi-tumpuk/.test(r.out.tabel) && !/data-tumpuk|pin-koleksi-tumpuk/.test(r.out.kosong), "a table without blocks, or an empty result, is drawn as a list");
      // Daisy's Z6 ruling (6): the pager returns to the collection (.pin-koleksi), which both views show, not the frame the
      // blocks hide below 640 px
      const ke = [...(r.out.halaman ?? "").matchAll(/<a [^>]*href="([^"]*hal=2[^"]*)"/g)].map((x) => x[1]);
      c.expect(/<div class="pin-koleksi" id="uji-koleksi" data-tumpuk="">/.test(r.out.halaman) && ke.length > 0 && ke.every((x) => x.endsWith("#uji-koleksi")),
        `the pager does not return to the collection: ${ke.join(" ")}`);
      const css = readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8");
      c.expect(/@media \(max-width: 1023px\) \{ \.pin-koleksi \{ scroll-margin-top: calc\(var\(--shell-bar\) \+ var\(--space-4\)\); \} \}/.test(css)
        && /@media \(max-width: 360px\) \{ \.pin-koleksi \{ scroll-margin-top: calc\(var\(--shell-bar\) \+ var\(--shell-bar\)\); \} \}/.test(css),
        "the collection the pager returns to lands under the phone's sticky bar");
      // Daisy's Z6 ruling: a segmented control never scrolls; it wraps between whole options
      const seg = /^\.pin-seg \{([^}]*)\}/m.exec(css)?.[1] ?? "";
      c.expect(/flex-wrap: wrap;/.test(seg) && /overflow-x: visible;/.test(seg) && !/overflow-x: auto/.test(seg) && /\.pin-seg span \{[^}]*white-space: nowrap;/.test(css)
        && !/\.pin-seg \{ display: grid; grid-template-columns: repeat\(3, 1fr\); \}/.test(css), `a segmented control may still scroll or cut its options: ${seg.replace(/\s+/g, " ")}`);
      const cq = /@container \(max-width: 639px\) \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
      c.expect(/^\.pin-koleksi-tumpuk \{ display: none; \}/m.test(css) && /\.pin-koleksi\[data-tumpuk\] > \.pin-tabel-bingkai \{ display: none; \}/.test(cq) && /\.pin-koleksi-tumpuk \{ display: grid;/.test(cq),
        "below 640 px the blocks do not replace the table");
      const tautan = /@media \(max-width: 359px\) \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
      c.expect(/\.pin-seg\.pin-seg-tautan \{ display: grid; grid-template-columns: minmax\(0, 1fr\); overflow-x: visible; \}/.test(tautan) && /\.pin-seg\.pin-seg-tautan span \{ white-space: normal;/.test(tautan),
        "below 360 px the instrument switch does not wrap one option a line");
      c.expect(/\.pin-seg\.pin-seg-tautan a > span\.pin-tanda-tautan \{\s*display: inline-block; width: 0; min-height: 0; padding: 0; border: 0; background: none; outline: none;/.test(css),
        "the switch's link mark is drawn as an empty option of its own");
      c.expect(/@media \(max-width: 360px\) \{\s*#isi:has\(\.pin-studio-nav, \.pin-studio-halaman\) \.pin-panel \{ padding: var\(--space-3\); \}\s*#isi:has\(\.pin-studio-nav, \.pin-studio-halaman\) \.pin-panel :is\(article, \.pin-panel\) \{ padding: var\(--space-2\); \}/.test(css),
        "N-8: Studio's nested panels keep their full padding at 360 px and under");
      const siapa = buang(readFileSync(join(repoRoot, "src", "app", "mengajar", "[kelas]", "siapa", "page.tsx"), "utf8"));
      c.expect(/const tumpuk = \{\s*judul: baris\.nama,/.test(siapa) && /pin-koleksi-tumpuk-label">\{labelKeadaan\}<\/span> \{baris\.sel\[0\]\}/.test(siapa)
        && /a1 !== null, s\("mengajar\.cepat\.hasil\.kolom\.keadaan"\)\)/.test(siapa), "«Siapa» does not give each learner its block with the state's visible label");
      return c.verdict("renders Koleksi three ways: rows with their block are drawn as a list named as the table, each block the name as its heading, then the sitting's line, the visible «Keadaan» label with the state, then «Atur»; rows without, and an empty result, stay the table alone; the CSS file replaces the table with the blocks below 640 px (Koleksi's container), wraps the instrument switch one option a line below 360 px and every segmented control between whole options (never scrolling), returns the pager to the collection wrapper, and gives Studio's nested panels less padding at 360 px and under (N-8); the source of «Siapa» gives every learner its block");
    },
  },
];

export const zUxAppTests: SelfTest[] = [
  {
    id: "Z-R8-02",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const { psql } = await import("./bob26.test");
      const { BOOT_SISWA, masuk } = await import("./c1w-layar.test");
      const asal = ctx.appUrl!;
      // a learning assignment the bootstrap learner is not given, and an assessment assignment id (not a learning one)
      const asing = psql(`select la.id from public.learning_assignments la where not exists (
          select 1 from public.memberships mm join public.enrollments e on e.id = mm.enrollment_id join public.accounts a on a.person_id = e.person_id
            join auth.users u on u.id = a.auth_user_id where u.email = '${BOOT_SISWA.identitas}' and mm.node_id = la.node_id and mm.valid_to is null)
        order by la.id limit 1`);
      const asesmen = psql("select id from public.assessment_assignments order by id limit 1");
      if (!c.expect(/^[0-9a-f-]{36}$/.test(asing) && /^[0-9a-f-]{36}$/.test(asesmen), `fixtures: ${asing} / ${asesmen}`)) return c.verdict("");
      const murid = await masuk(asal, BOOT_SISWA, "BELAJAR");
      if (!c.expect(typeof murid !== "string", String(murid))) return c.verdict("");
      const k = murid as Exclude<typeof murid, string>;
      const lain = "00000000-0000-4000-8000-000000000000";
      // Sharon (R-8 review, condition b): «not yours» and «does not exist» answer with the same HTTP status, route by route
      const status: Record<string, number[]> = {};
      for (const id of [asing, asesmen, lain]) {
        for (const sub of ["", "/hasil", "/peta", "/pemetaan", "/penguasaan", "/sertifikat", `/pelajaran/${lain}`, "/lanjut"]) {
          const res = await k.halaman(`/belajar/${id}${sub}`);
          const h = await res.text();
          const apa = `/belajar/{${id === asing ? "a classmate's" : id === asesmen ? "an assessment" : "an unknown"}}${sub}`;
          (status[sub.replace(lain, "{pelajaran}")] ??= []).push(res.status);
          // the answer is streamed inside the shell (the status may already be 200), so it is read from what the server sent:
          // notFound() streams the not-found digest; a thrown read streams a numeric digest, which the client's error page
          // shows as its «Kode rujukan». (The not-found page's words are in every page's payload, so they prove nothing.)
          c.expect(/NEXT_HTTP_ERROR_FALLBACK;404/.test(h), `${apa}: not answered with the not-found page (status ${res.status})`);
          c.expect(!/digest\\?":\\?"\d+/.test(h) && !/Kode rujukan/i.test(h), `${apa}: answered with the error page (a reference code)`);
        }
      }
      for (const [sub, st] of Object.entries(status)) c.expect(new Set(st).size === 1, `/belajar/{id}${sub}: a classmate's, an assessment and an unknown id answer different statuses (${st.join(", ")})`);
      return c.verdict("as the bootstrap learner, the same HTTP status for all three ids on each route (Sharon's condition b); opens all eight /belajar/{id}/… routes with a learning assignment of a class they are not in, an assessment-assignment id and an unknown id: each answers with the not-found page («Halaman ini tidak ada»), and none with the error page or a reference code");
    },
  },
  {
    id: "Z-S12-01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const { Komputer } = await import("./bob29.test");
      const { ipUji } = await import("./bob26.test");
      const asal = ctx.appUrl!;
      const k = new Komputer(asal, ipUji());
      const ke = (r: Response) => r.headers.get("location") ?? "";
      const isian = t("buka_kembali.galat.isian", "public", { locale: "id" });
      const tunggu = t("buka_kembali.galat.tunggu", "public", { locale: "id" });
      // a refused input, twice from one address: each is said as the input's own line, and neither uses the pace
      for (const [apa, form] of [["a message of spaces and 6 letters", { identitas: "seseorang@local.invalid", pesan: "    pendek    " }],
        ["no identity", { identitas: "   ", pesan: "Saya ingin kembali mengajar di sekolah ini." }]] as const) {
        const r = await k.kirim("/masuk/buka-kembali/kirim", { form: { ...form } });
        c.expect(r.status === 303 && /kode=ISIAN/.test(ke(r)), `${apa}: answered ${r.status} ${ke(r)}, not the input's own line (kode=ISIAN)`);
        const h = await (await k.halaman(ke(r))).text();
        c.expect(h.includes(isian) && !h.includes(tunggu), `${apa}: the page does not say the input's own line, or says «a request was just sent»`);
      }
      // the pace still holds for requests the database takes: the first is sent, the second at once is paced
      const pesan = "Saya ingin kembali mengajar. Hubungi saya di nomor sekolah.";
      const r1 = await k.kirim("/masuk/buka-kembali/kirim", { form: { identitas: `tiada-s12-${Date.now()}@local.invalid`, pesan } });
      c.expect(/hasil=terkirim/.test(ke(r1)), `a well-formed request after two refused ones was not sent: ${ke(r1)}`);
      const r2 = await k.kirim("/masuk/buka-kembali/kirim", { form: { identitas: `tiada-s12b-${Date.now()}@local.invalid`, pesan } });
      c.expect(/kode=TUNGGU/.test(ke(r2)), `a second well-formed request at once is not paced: ${ke(r2)}`);
      return c.verdict("posts to the running app's reopening route from one address: a message of spaces and six letters, then an empty identity, each answer kode=ISIAN and the page says buka_kembali.galat.isian, never «a request was just sent»; neither used the pace, so a well-formed request then is sent (hasil=terkirim), and a second at once is still paced (kode=TUNGGU)");
    },
  },
  {
    id: "Z-N9-02",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const { psql } = await import("./bob26.test");
      const { BOOT_ADMIN, masuk } = await import("./c1w-layar.test");
      const asal = ctx.appUrl!;
      const sekolah = psql(`select ra.institution_id from public.role_assignments ra join public.accounts a on a.person_id = ra.person_id
        join auth.users u on u.id = a.auth_user_id where u.email = 'boot-admin@bootstrap.pintar.test' and ra.institution_id is not null
         and ra.revoked_at is null order by ra.id limit 1`);
      // a staff member of another school: the bootstrap administrator may not open them
      const lain = psql(`select ra.person_id from public.role_assignments ra where ra.institution_id is not null and ra.institution_id <> '${sekolah}'
        and ra.role in ('EDUCATOR', 'INSTITUTION_ADMIN') and ra.revoked_at is null order by ra.id limit 1`);
      if (!c.expect(/^[0-9a-f-]{36}$/.test(sekolah) && /^[0-9a-f-]{36}$/.test(lain), `fixtures: ${sekolah} / ${lain}`)) return c.verdict("");
      const admin = await masuk(asal, BOOT_ADMIN, `MENGELOLA:${sekolah}`);
      if (!c.expect(typeof admin !== "string", String(admin))) return c.verdict("");
      const k = admin as Exclude<typeof admin, string>;
      const kalimat = t("staf.tidak_dapat_dibuka" as HleEvent, "staff", { locale: "id" });
      const jawab: string[] = [];
      for (const [apa, q] of [["no person", ""], ["an unknown person", "?orang=00000000-0000-4000-8000-000000000000"], ["another school's staff member", `?orang=${lain}`]]) {
        const r = await k.halaman(`/konfigurasi/staf${q}`);
        const h = await r.text();
        jawab.push(`${r.status}`);
        c.expect(h.includes(kalimat) && !h.includes(t("sertifikat.kelola.ditolak", "staff", { locale: "id" })),
          `${apa}: the staff page does not answer «${kalimat}» (or still names the certificate page)`);
      }
      c.expect(new Set(jawab).size === 1, `the three answer different statuses: ${jawab.join(", ")}`);
      return c.verdict("as the bootstrap school's administrator in the running app (N-9): /konfigurasi/staf with no person, an unknown person and another school's staff member each answer «Data staf ini tidak dapat dibuka. Mungkin sudah tidak ada, atau bukan untuk Anda.» in the rendered html, with one status, never the certificate page's sentence");
    },
  },
  {
    id: "Z-S01-01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const { lit, psql } = await import("./bob26.test");
      const { ADMIN, masuk, muat, dunia, bersihkan } = await import("./c1w-layar.test");
      const { formDengan, ke } = await import("./a1-layar.test");
      const asal = ctx.appUrl!;
      // S-01 (SAPU-VERIFIED; the preserve-all-settings test before the fix): C1w's screen fixture uploads a draft package
      // in the cycle school (a row's form opens only for a draft chapter); one of its rules gets pause and offline on, as
      // its author could have set them, then its administrator renames it through the row's own form
      muat(ctx.repoRoot);
      const tag = `s01${Date.now().toString(36)}`;
      const d = dunia(tag, `C1W layar S01 ${tag}`);
      if (!c.expect(typeof d !== "string", String(d))) return c.verdict("");
      const { course, inst } = d as Exclude<typeof d, string>;
      try {
        const [id, judul, jumlah] = psql(`select d.id || '|' || d.title || '|' || d.item_count from public.assessment_definitions d
          where d.course_id = ${lit(course)} order by d.mode, d.created_at limit 1`).split("|");
        if (!c.expect(/^[0-9a-f-]{36}$/.test(id ?? ""), `the draft package has no rule: ${id}`)) return c.verdict("");
        psql(`begin; set local session_replication_role = replica;
          update public.assessment_definitions set allows_pause = true, offline_tolerant = true where id = ${lit(id)}; commit;`);
        const kolom = "allows_pause, offline_tolerant, item_count, mode, bank_type, shuffle_policy, attempt_limit, safety_critical_minimum, hesitation_window_seconds, late_sync_grace_seconds, difficulty_mix, course_id, module_id, status";
        const garis = `(select coalesce(d.lineage_root_definition_id, d.id) from public.assessment_definitions d where d.id = ${lit(id)})`;
        const sebelum = psql(`select row_to_json(t)::text from (select ${kolom} from public.assessment_definitions where id = ${lit(id)}) t`);
        const versiSebelum = psql(`select count(*) from public.assessment_definitions where coalesce(lineage_root_definition_id, id) = ${garis}`);
        const admin = await masuk(asal, ADMIN, `MENGELOLA:${inst}`);
        if (!c.expect(typeof admin !== "string", String(admin))) return c.verdict("");
        const k = admin as Exclude<typeof admin, string>;
        const namaBaru = `${judul} (S-01)`;
        let bentuk: Record<string, string> | string = "not found";
        for (let hal = 1; hal <= 8 && typeof bentuk === "string"; hal++) {
          bentuk = formDengan(await (await k.halaman(`/studio/definisi?hal=${hal}&ubah=${id}`)).text(), `id="definisi-${id}"`, { judul: namaBaru, jumlah });
        }
        if (!c.expect(typeof bentuk !== "string", `the rule's row form: ${bentuk}`)) return c.verdict("");
        const r = await k.kirim("/studio/definisi", { form: bentuk as Record<string, string> });
        c.expect(r.status === 303 || r.status === 200, `the rename answered ${r.status} ${ke(r)}`);
        const versiSesudah = psql(`select count(*) from public.assessment_definitions where coalesce(lineage_root_definition_id, id) = ${garis}`);
        const terbaru = psql(`select d.id from public.assessment_definitions d where coalesce(d.lineage_root_definition_id, d.id) = ${garis} order by d.version desc limit 1`);
        const sesudah = psql(`select row_to_json(t)::text from (select ${kolom} from public.assessment_definitions where id = ${lit(terbaru)}) t`);
        c.expect(versiSesudah === versiSebelum && terbaru === id, `renaming saved a new version (${versiSebelum} → ${versiSesudah} in the line): the rename was read as an interpretive change`);
        c.expect(sesudah === sebelum, `renaming changed other settings: before ${sebelum} · after ${sesudah}`);
        c.expect(psql(`select title from public.assessment_definitions where id = ${lit(terbaru)}`) === namaBaru, "the new name was not saved");
      } finally {
        bersihkan();
      }
      return c.verdict("in the running app as the cycle school's administrator, on C1w's draft package (S-01): a rule with pause and offline on, renamed through its own row form, keeps its one version and every other setting (pause, offline, count, mode, bank, shuffle, attempts, safety, hesitation, grace, mix, chapter, status), with the new name saved; read back from the database");
    },
  },
  {
    id: "Z-R10-01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const { lit, psql } = await import("./bob26.test");
      const { BOOT_ADMIN, masuk } = await import("./c1w-layar.test");
      const asal = ctx.appUrl!;
      // R-10 (Daisy, Z-SIAP §1, option A): «Tempat kerja Anda» is the index's on every standalone Konfigurasi page, for the
      // same reader; aria-current marks the page's own item, else «Konfigurasi»; [bagian] is the control
      const { tersusun } = await import("./konteks-uji");
      // the shell streams its later items (<template id="P:x"> filled from <div hidden id="S:x">): read as assembled
      const tempat = (h0: string) => {
        const h = tersusun(h0);
        const nav = /<nav class="pin-tabs"[^>]*>([\s\S]*?)<\/nav>/.exec(h)?.[1] ?? "";
        const a = [...nav.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
        return {
          set: a.map((x) => /href="([^"]*)"/.exec(x)?.[1] ?? "").sort().join(" "),
          kini: a.filter((x) => /aria-current="page"/.test(x)).map((x) => /href="([^"]*)"/.exec(x)?.[1] ?? ""),
        };
      };
      const sekolah = psql(`select ra.institution_id from public.role_assignments ra join public.accounts a on a.person_id = ra.person_id
        join auth.users u on u.id = a.auth_user_id where u.email = 'boot-admin@bootstrap.pintar.test' and ra.institution_id is not null
         and ra.revoked_at is null order by ra.id limit 1`);
      const diri = psql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(BOOT_ADMIN.identitas)}`);
      const pembaca: Array<[string, { identitas: string; password: string }, string, Array<[string, string]>]> = [
        ["the school's administrator", BOOT_ADMIN, `MENGELOLA:${sekolah}`, [
          ["/konfigurasi/catatan-masuk", "/konfigurasi"], ["/konfigurasi/kesempatan", "/konfigurasi"], ["/konfigurasi/keamanan", "/konfigurasi/keamanan"],
          ["/konfigurasi/sertifikat", "/konfigurasi/sertifikat"], [`/konfigurasi/staf?orang=${diri}`, "/konfigurasi"], ["/konfigurasi/audit", "/konfigurasi"]]],
        ["the platform administrator", { identitas: "sysadmin@synthetic.pintar.test", password: "Sintetis-Sys-91!" }, "MENGELOLA:PLATFORM", [
          ["/konfigurasi/catatan-masuk", "/konfigurasi"], ["/konfigurasi/keamanan", "/konfigurasi/keamanan"], ["/konfigurasi/sertifikat", "/konfigurasi/sertifikat"],
          ["/konfigurasi/email-uji", "/konfigurasi/email-uji"], ["/konfigurasi/audit", "/konfigurasi"]]],
      ];
      for (const [siapa, akun, konteks, halaman] of pembaca) {
        const k0 = await masuk(asal, akun, konteks);
        if (!c.expect(typeof k0 !== "string", `${siapa}: ${k0}`)) continue;
        const k = k0 as Exclude<typeof k0, string>;
        const induk = tempat(await (await k.halaman("/konfigurasi")).text());
        c.expect(induk.set.includes("/konfigurasi/keamanan") && JSON.stringify(induk.kini) === JSON.stringify(["/konfigurasi"]), `${siapa}: the index's own «Tempat kerja Anda» is not as expected: ${induk.set} · ${induk.kini}`);
        if (siapa.startsWith("the platform")) c.expect(induk.set.includes("/konfigurasi/email-uji"), "the platform administrator's index has no «Kirim email uji»");
        for (const [alamat, mauKini] of halaman) {
          const h = await (await k.halaman(alamat)).text();
          const ini = tempat(h);
          c.expect(ini.set === induk.set, `${siapa}, ${alamat}: «Tempat kerja Anda» is not the index's (${ini.set || "none"} · index: ${induk.set})`);
          c.expect(JSON.stringify(ini.kini) === JSON.stringify([mauKini]), `${siapa}, ${alamat}: aria-current is on ${JSON.stringify(ini.kini)}, not ${mauKini}`);
          c.expect(/class="pin-back[^"]*"[^>]*href="\/konfigurasi[^"]*"|href="\/konfigurasi[^"]*"[^>]*class="pin-back/.test(h), `${siapa}, ${alamat}: no way back to Konfigurasi (pin-back)`);
        }
      }
      return c.verdict("in the running app as the bootstrap school's administrator and as the platform administrator (R-10, option A): on catatan-masuk, kesempatan, keamanan, sertifikat, email-uji, staf and the section route (the control), the rendered html's «Tempat kerja Anda» has exactly the index's links for the same reader (with «Kirim email uji» for the platform administrator), aria-current on the page's own item or else «Konfigurasi», and a way back to Konfigurasi");
    },
  },
  {
    id: "Z-C1-01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const { psql } = await import("./bob26.test");
      const { BOOT_ADMIN, masuk } = await import("./c1w-layar.test");
      const { formDengan, ke } = await import("./a1-layar.test");
      const asal = ctx.appUrl!;
      // C-1 (Daisy, Z5 review; ruling 81 «work kept»): a code of the wrong shape is refused, and the field holds what was typed
      const sekolah = psql(`select ra.institution_id from public.role_assignments ra join public.accounts a on a.person_id = ra.person_id
        join auth.users u on u.id = a.auth_user_id where u.email = 'boot-admin@bootstrap.pintar.test' and ra.institution_id is not null
         and ra.revoked_at is null order by ra.id limit 1`);
      const k0 = await masuk(asal, BOOT_ADMIN, `MENGELOLA:${sekolah}`);
      if (!c.expect(typeof k0 !== "string", String(k0))) return c.verdict("");
      const k = k0 as Exclude<typeof k0, string>;
      const bentuk = formDengan(await (await k.halaman("/pendataan")).text(), 'name="kode"', { kode: "A-" });
      if (!c.expect(typeof bentuk !== "string", `the school-code form: ${bentuk}`)) return c.verdict("");
      const r = await k.kirim("/pendataan", { form: bentuk as Record<string, string> });
      const lokasi = ke(r);
      c.expect(/galat=kode_bentuk/.test(lokasi), `the wrong shape answered ${r.status} ${lokasi}`);
      const h = await (await k.halaman(lokasi.replace(/^https?:\/\/[^/]+/, "") || "/pendataan")).text();
      const isian = /<input\b[^>]*\bid="pin-kode-isi"[^>]*>/.exec(h)?.[0] ?? "";
      c.expect(/\bvalue="A-"/.test(isian), `after the refusal the field does not hold «A-»: ${isian}`);
      c.expect(h.includes(t("pendataan.kode.bentuk_salah", "staff", { locale: "id" })), "the shape's own sentence is not on the page");
      return c.verdict("in the running app as the bootstrap school's administrator (C-1): «A-» posted as the school code is refused galat=kode_bentuk, and the page it lands on holds «A-» in the code field beside pendataan.kode.bentuk_salah; nothing is saved");
    },
  },
  {
    id: "Z-C2A-01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const { lit, psql } = await import("./bob26.test");
      const { ADMIN, masuk, muat, dunia, bersihkan } = await import("./c1w-layar.test");
      const { formDengan, ke } = await import("./a1-layar.test");
      const asal = ctx.appUrl!;
      const s = (k: string) => t(k as HleEvent, "staff", { locale: "id" });
      // C-2 and finding (a) (Daisy, Z5 review), on C1w's draft package in the cycle school
      muat(ctx.repoRoot);
      const tag = `c2a${Date.now().toString(36)}`;
      const d = dunia(tag, `C1W layar C2A ${tag}`);
      if (!c.expect(typeof d !== "string", String(d))) return c.verdict("");
      const { course, inst } = d as Exclude<typeof d, string>;
      try {
        const [id, jumlah] = psql(`select d.id || '|' || d.item_count from public.assessment_definitions d where d.course_id = ${lit(course)} order by d.mode, d.created_at limit 1`).split("|");
        // a rule that divides its questions by difficulty, as its author could have set it
        psql(`begin; set local session_replication_role = replica;
          update public.assessment_definitions set difficulty_mix = jsonb_build_object('MUDAH', item_count) where id = ${lit(id)}; commit;`);
        const k0 = await masuk(asal, ADMIN, `MENGELOLA:${inst}`);
        if (!c.expect(typeof k0 !== "string", String(k0))) return c.verdict("");
        const k = k0 as Exclude<typeof k0, string>;
        // C-2: the row changes the count; its refusal says what the row cannot do, and the new rule is the way
        let bentuk: Record<string, string> | string = "not found";
        for (let hal = 1; hal <= 8 && typeof bentuk === "string"; hal++) {
          bentuk = formDengan(await (await k.halaman(`/studio/definisi?hal=${hal}&ubah=${id}`)).text(), `id="definisi-${id}"`, { jumlah: String(Number(jumlah) + 1) });
          if (typeof bentuk !== "string" && !bentuk.judul) bentuk.judul = psql(`select title from public.assessment_definitions where id = ${lit(id)}`);
        }
        if (!c.expect(typeof bentuk !== "string", `the rule's row form: ${bentuk}`)) return c.verdict("");
        const r = await k.kirim("/studio/definisi", { form: bentuk as Record<string, string> });
        const lokasi = ke(r).replace(/^https?:\/\/[^/]+/, "");
        c.expect(/kode=DEFINITION_MIX_TOTAL/.test(lokasi), `the row's count change answered ${r.status} ${lokasi}`);
        const h = (await (await k.halaman(lokasi || "/studio/definisi")).text()).replace(/&#x27;/g, "'");
        c.expect(h.includes(s("galat.definition_mix_total_baris")) && !h.includes(s("galat.definition_mix_total")),
          "C-2: the row's refusal points to a mix the row does not show (or says nothing)");
        // (a): a new rule through the new-rule form is said as created
        const baru = formDengan(await (await k.halaman("/studio/definisi")).text(), 'id="definisi-baru"', {
          course, judul: `Aturan ${tag}`, mode: "POST_TEST", bank: "PRACTICE", jumlah: "3", acak: "ITEMS_AND_OPTIONS",
        });
        if (!c.expect(typeof baru !== "string", `the new-rule form: ${baru}`)) return c.verdict("");
        const r2 = await k.kirim("/studio/definisi", { form: baru as Record<string, string> });
        const lokasi2 = ke(r2).replace(/^https?:\/\/[^/]+/, "");
        c.expect(/hasil=ok/.test(lokasi2), `the new rule answered ${r2.status} ${lokasi2}`);
        const h2 = await (await k.halaman(lokasi2 || "/studio/definisi")).text();
        c.expect(h2.includes(s("studio.definisi.dibuat")) && !h2.includes(s("studio.definisi.versi_baru")),
          "(a): a brand-new rule is not said as created, or is said as a new version of an old one");
      } finally {
        bersihkan();
      }
      return c.verdict("in the running app as the cycle school's administrator on C1w's draft package: a rule divided by difficulty, its count changed through its own row, is refused DEFINITION_MIX_TOTAL and the row says galat.definition_mix_total_baris, not «Periksa keduanya» (C-2); a rule made through the new-rule form is answered studio.definisi.dibuat «Aturan baru dibuat.», not versi_baru (finding a)");
    },
  },
];
