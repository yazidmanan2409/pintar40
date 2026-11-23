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
import { readFileSync, readdirSync, statSync } from "node:fs";
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
      for (const id of [asing, asesmen, lain]) {
        for (const sub of ["", "/hasil", "/peta", "/pemetaan", "/penguasaan", "/sertifikat", `/pelajaran/${lain}`, "/lanjut"]) {
          const res = await k.halaman(`/belajar/${id}${sub}`);
          const h = await res.text();
          const apa = `/belajar/{${id === asing ? "a classmate's" : id === asesmen ? "an assessment" : "an unknown"}}${sub}`;
          // the answer is streamed inside the shell (the status may already be 200), so it is read from what the server sent:
          // notFound() streams the not-found digest; a thrown read streams a numeric digest, which the client's error page
          // shows as its «Kode rujukan». (The not-found page's words are in every page's payload, so they prove nothing.)
          c.expect(/NEXT_HTTP_ERROR_FALLBACK;404/.test(h), `${apa}: not answered with the not-found page (status ${res.status})`);
          c.expect(!/digest\\?":\\?"\d+/.test(h) && !/Kode rujukan/i.test(h), `${apa}: answered with the error page (a reference code)`);
        }
      }
      return c.verdict("as the bootstrap learner, opens all eight /belajar/{id}/… routes with a learning assignment of a class they are not in, an assessment-assignment id and an unknown id: each answers with the not-found page («Halaman ini tidak ada»), and none with the error page or a reference code");
    },
  },
];
