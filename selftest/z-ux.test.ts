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
      // perluPenguatan reads it per learner: a failed read there lists nothing to study again, as before, never a crash
      c.expect(/ulang: \(ulang\[i\] \?\? \[\]\)\.map\(/.test(ajar), "perluPenguatan does not handle a failed tujuanBelum read");
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
      c.expect(fn.indexOf('if (!kodeSekolahSah(kode)) redirect("/pendataan?galat=kode_bentuk");') >= 0
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
];

