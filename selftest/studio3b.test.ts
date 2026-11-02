/**
 * BATCH 3 · Studio's own pages (owner authorisation; plan E §Batch 3; register C, W1.3, W1.5, W1.9 (Studio part), W1.10,
 * W1.14, W3.18 (Studio part); matrix B J4.5, J4.6, J4.10). Daisy's frozen design system, 08-migration's rows. Each guard
 * is RED on the code before it.
 *
 *  STUDIO3B-KELAS-01   W1.14 / W3.18 · Studio's shell and its pages Buat Paket, Pustaka PINTAR (and a release's outline),
 *                      Aturan Asesmen, Bank Soal, Tinjauan Integritas and the lesson preview draw no Tailwind composition:
 *                      every class they name is a pin-* class experience.css defines, the shared strings name the v3
 *                      Panel, Text field and Button, an empty list is the Empty state, and every id and form name the
 *                      selftests and journeys select is still there.
 *  STUDIO3B-ATURAN-01  W1.3 · Aturan Asesmen (RV-14, DG-28/29): the limits in words and a time in minutes, executed; each
 *                      number with its hint under its label (rendered), the optional ones marked; the mode, bank and order
 *                      as 44 px radio rows and the two switches as checkbox rows with their explanation; the send grace
 *                      asked in minutes and kept in seconds by the action.
 *  STUDIO3B-TEMUAN-01  W1.5 · the question check's findings acknowledged as a group (UX-01): rendered, one group per kind
 *                      with its count, its why and fix once, its places in a Disclosure and ONE form carrying every
 *                      finding of the kind; an ERROR is never acknowledged; the action asks acknowledge_finding once per
 *                      finding, bounded, and says how many; the check stays runnable before the lock.
 *  STUDIO3B-KELIRU-01  W1.5 / J4.10 · the misconception feedback asserted in a browser: the journey's step S22m reads
 *                      «Pemahaman keliru yang berulang di kelas ini» on «Lihat bukti» by the selectors the page draws, and
 *                      the synthetic chapter's wrong options each name a misconception their package defines.
 *  STUDIO3B-CONTOH-01  W1.10 · the example-only workbook (DG-36) beside the blank template: built in the browser, read and
 *                      converted by the importer's own code, marked «Contoh — », sharing no question with any live
 *                      chapter or fixture, firing no F-4 rule, and offered (rendered) beside the template.
 *  STUDIO3B-KATA-01    W1.9 (Studio part) · «murid», never «siswa»; no «(D-008)» in the workbook's guidance; the reader's
 *                      language on every page (rendered: the pager in English); 320 px: the order is radios, a code keeps
 *                      together, a field and a select shrink with their column.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Checks, type SelfTest } from "./lib";
import { render } from "./ux2.test";

/** The surfaces this batch moved (W1.14); src/app/studio/page.tsx, paket and tinjau are another stream's. */
const HALAMAN = [
  "src/app/studio/layout.tsx",
  "src/app/studio/unggah/page.tsx",
  "src/app/studio/definisi/page.tsx",
  "src/app/studio/bank/page.tsx",
  "src/app/studio/integritas/page.tsx",
  "src/app/studio/kanonik/page.tsx",
  "src/app/studio/kanonik/[terbitan]/page.tsx",
  "src/app/studio/pratinjau/[pelajaran]/page.tsx",
];

function kode(teks: string): string {
  return teks.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
}
const baca = (root: string, f: string) => (existsSync(join(root, f)) ? readFileSync(join(root, f), "utf8") : "");

function berkas(dir: string, cocok: RegExp): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...berkas(p, cocok));
    else if (cocok.test(n)) out.push(p);
  }
  return out;
}

/** Every class token a source names in a className string or template (the ${…} parts left out). */
function kelasDi(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(/className="([^"]*)"/g)) out.push(...m[1].split(/\s+/));
  for (const m of src.matchAll(/className=\{`([^`]*)`\}/g)) out.push(...m[1].replace(/\$\{[^}]*\}/g, " ").split(/\s+/));
  for (const m of src.matchAll(/className=\{[^}`"]*\?\s*"([^"]*)"\s*:\s*(?:"([^"]*)"|undefined)\}/g)) out.push(...m[1].split(/\s+/), ...(m[2] ?? "").split(/\s+/));
  return out.filter(Boolean);
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

export const studio3bTests: SelfTest[] = [
  {
    id: "STUDIO3B-KELAS-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const css = readFileSync(join(repoRoot, "src/app/experience.css"), "utf8");
      const ada = (k: string) => new RegExp(`\\.${k.replace(/[-]/g, "\\-")}(?![\\w-])`).test(css);
      // the shared strings are the v3 primitives
      const lib = kode(baca(repoRoot, "src/app/studio/_lib.ts"));
      const nilai = (nama: string) => lib.match(new RegExp(`export const ${nama} = "([^"]*)"`))?.[1] ?? "";
      for (const [nama, harap] of [["card", "pin-panel"], ["label", "pin-bidang"], ["field", "pin-input"], ["button", "pin-btn"]] as const) {
        const v = nilai(nama);
        c.expect(v.split(/\s+/).includes(harap) && v.split(/\s+/).every((k) => k.startsWith("pin-") && ada(k)),
          `_lib.ts: ${nama} is «${v}», not the v3 ${harap} from experience.css`);
      }
      let n = 0;
      for (const f of HALAMAN) {
        const src = kode(baca(repoRoot, f));
        if (!c.expect(src.length > 0, `${f} is missing`)) continue;
        const kelas = kelasDi(src);
        n += kelas.length;
        const asing = kelas.filter((k) => !k.startsWith("pin-"));
        c.expect(asing.length === 0, `${f} still composes with Tailwind: ${[...new Set(asing)].slice(0, 12).join(" ")}`);
        const tanpaAturan = [...new Set(kelas.filter((k) => k.startsWith("pin-") && !ada(k)))];
        c.expect(tanpaAturan.length === 0, `${f} names pin-* classes experience.css does not define: ${tanpaAturan.join(" ")}`);
        // a list that can be empty says so as the Empty state (W3.2), never a bare card with a sentence in it
        c.expect(!/<p className=\{card\}>\{s\(/.test(src), `${f} draws an empty list as a bare card instead of the Empty state`);
      }
      // the ids and names the selftests and the journeys select are still there
      const tetap: Array<[string, RegExp[]]> = [
        ["src/app/studio/layout.tsx", [/<main id="isi"/, /<TabStudioNav tab=\{nav\}/]],
        ["src/app/studio/unggah/page.tsx", [/id="buku-kerja"/, /id="sistem-lain"/, /id="mudah"/, /id="terstruktur"/, /id="pertanyaan"/, /id="form-mudah"/, /id="form-terstruktur"/, /name="institution"/, /name="isi"/, /name="batch"/]],
        ["src/app/studio/definisi/page.tsx", [/id="definisi"/, /id="definisi-baru"/, /id=\{`definisi-\$\{d\.id\}`\}/, /name="course"/, /name="judul"/, /name="mode"/, /name="bank"/, /name="jumlah"/, /name="acak"/, /name="jeda"/, /name="luring"/, /name="definisi"/, /name="hal"/]],
        ["src/app/studio/bank/page.tsx", [/id="kesehatan"/, /data-soal=\{short\(i\.id\)\}/, /name="tingkat"/, /name="keputusan"/, /name="catatan"/, /name="soal"/]],
        ["src/app/studio/integritas/page.tsx", [/id="integritas"/, /id=\{`integritas-\$\{session\}`\}/, /name="sinyal"/, /name="keputusan"/, /name="catatan"/]],
        ["src/app/studio/kanonik/page.tsx", [/id="izin"/, /id="izin-beri"/, /id="izin-tarik"/, /name="release"/, /name="distribusi"/, /name="alasan"/]],
        ["src/app/studio/pratinjau/[pelajaran]/page.tsx", [/data-halaman=\{i \+ 1\}/, /data-contoh=""/]],
      ];
      for (const [f, pola] of tetap) {
        const src = baca(repoRoot, f);
        for (const p of pola) c.expect(p.test(src), `${f} lost ${p.source}, which a selftest or a journey selects`);
      }
      // the empty states are Daisy's (Kosong), on the pages that list something
      for (const f of ["src/app/studio/bank/page.tsx", "src/app/studio/integritas/page.tsx", "src/app/studio/kanonik/page.tsx"]) {
        c.expect(/<Kosong jenis="(?:belum|tidak_cocok)"|<Kosong jenis=\{/.test(baca(repoRoot, f)), `${f} does not draw its empty list as the Empty state (Kosong)`);
      }
      return c.verdict(`the source of ${HALAMAN.length} Studio surfaces names ${n} class token(s), every one a pin-* class experience.css defines; `
        + "the shared strings in the source of src/app/studio/_lib.ts are the v3 Panel, Text field, Field and Button; an empty list is the "
        + "Empty state; every id and form name the selftests and journeys select is kept");
    },
  },
  {
    id: "STUDIO3B-ATURAN-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      let A: typeof import("../src/lib/aturan-asesmen");
      try { A = await import("../src/lib/aturan-asesmen"); } catch (e) { c.expect(false, `src/lib/aturan-asesmen.ts cannot be read: ${String(e).slice(0, 120)}`); return c.verdict(""); }
      const { t } = await import("../src/lib/hle");
      for (const locale of ["id", "en"] as const) {
        const s = (k: Parameters<typeof t>[0]) => t(k, "staff", { locale });
        const [m, d] = [s("studio.definisi.unit.menit"), s("studio.definisi.unit.detik")];
        c.expect(A.lamaDalamKata(900, s) === `15 ${m}` && A.lamaDalamKata(60, s) === `1 ${m}` && A.lamaDalamKata(90, s) === `1 ${m} 30 ${d}`
          && A.lamaDalamKata(45, s) === `45 ${d}`, `(${locale}) a time is not said in minutes where it is minutes: ${A.lamaDalamKata(900, s)}`);
        // the platform's default bounds (studio_governance) and the quick test's narrower ones
        const biasa = { mode: "PRE_TEST", item_count_min: 3, item_count_max: 60, hesitation_window_min: 3, hesitation_window_max: 120, late_sync_grace_max: 900, attempt_limit_max: 5 };
        const garis = A.batasDalamKata(biasa, s);
        c.expect(garis.includes(`${s("studio.definisi.kata.antara")} 3 ${s("studio.definisi.kata.dan")} 60`) && garis.includes(`15 ${m}`)
          && !/\d\s*[–-]\s*\d|\d+s\b|×|\b900\b/.test(garis), `(${locale}) the limits line is not in words: «${garis}»`);
        const dua = [biasa, { ...biasa, mode: "POST_TEST" }];
        const p = A.petunjukAturan(dua, s, (x) => x);
        c.expect(!!p.jumlah && p.jumlah.startsWith(s("studio.definisi.petunjuk.jumlah")) && p.jumlah.includes("3") && p.jumlah.includes("60")
          && !!p.tenggang?.includes(`15 ${m}`) && !!p.ragu?.includes(`120 ${d}`) && !!p.percobaan?.endsWith("5.") && !p.jumlah.includes("PRE_TEST"),
          `(${locale}) a hint does not say its limit once when both modes agree: ${JSON.stringify(p)}`);
        const beda = A.petunjukAturan([biasa, { ...biasa, mode: "POST_TEST", late_sync_grace_max: 300 }], s, (x) => `«${x}»`);
        c.expect(!!beda.tenggang?.includes(`«PRE_TEST»: 15 ${m}`) && !!beda.tenggang?.includes(`«POST_TEST»: 5 ${m}`),
          `(${locale}) a hint does not name each mode where their limits differ: ${beda.tenggang}`);
      }
      c.expect(A.tenggangDetik(2.5, null) === 150 && A.tenggangDetik(null, 30) === 30 && A.tenggangDetik(null, null) === null && A.tenggangDetik(15, 7) === 900,
        "the send grace in minutes is not kept as whole seconds (or a hand-made post's seconds are lost)");
      // the page
      const hal = kode(baca(repoRoot, "src/app/studio/definisi/page.tsx"));
      for (const [nama, ket] of [["mode", "the assessment type"], ["bank", "what it is used for"], ["acak", "the order"]] as const) {
        c.expect(new RegExp(`<input type="radio" name="${nama}"`).test(hal) && !new RegExp(`<select[^>]*name="${nama}"`).test(hal),
          `${ket} is not a group of radio rows (components/Radio: two to four options)`);
      }
      c.expect((hal.match(/<label (?:key=\{[\w.]+\} )?className="pin-pilihan">/g) ?? []).length >= 5 && (hal.match(/<fieldset className="pin-fieldset"/g) ?? []).length >= 5
        && (hal.match(/<legend>/g) ?? []).length >= 5, "the choices are not 44 px rows in fieldsets with their question as the legend");
      c.expect(/<input type="checkbox" name="jeda" \/>[\s\S]{0,120}<small>\{s\("studio\.definisi\.petunjuk\.jeda"\)\}<\/small>/.test(hal)
        && /<input type="checkbox" name="luring" \/>[\s\S]{0,120}<small>\{s\("studio\.definisi\.petunjuk\.luring"\)\}<\/small>/.test(hal),
        "the two switches are not checkbox rows with their explanation under them");
      for (const [nama, kunci] of [["jumlah", "jumlah"], ["keselamatan", "keselamatan"], ["ragu", "ragu"], ["tenggang_menit", "tenggang"], ["percobaan", "percobaan"]]) {
        c.expect(new RegExp(`<BidangTeks id="definisi-[a-z]+" name="${nama}"[^>]*petunjuk=\\{petunjuk\\.${kunci}\\}`).test(hal), `«${nama}» has no hint under its label`);
      }
      c.expect((hal.match(/opsional=\{opsional\}/g) ?? []).length === 4 && /s\("studio\.definisi\.wajib"\)/.test(hal),
        "the optional numbers are not marked «(opsional)», or the form does not say once that the rest are required");
      c.expect(!/name="tenggang"/.test(hal) && /name="tenggang_menit"/.test(hal), "the send grace is still asked in seconds");
      c.expect(/batasDalamKata\(b as BatasMode, s\)/.test(hal) && !/late_sync_grace_max\} \{s\("studio\.definisi\.unit\.detik"\)\}/.test(hal),
        "the limits line still says the send grace in seconds");
      const aksi = kode(baca(repoRoot, "src/app/studio/actions.ts"));
      c.expect(/put\("late_sync_grace_seconds", tenggangDetik\(num\(fd, "tenggang_menit"\), num\(fd, "tenggang"\)\)\);/.test(aksi),
        "the rule's action does not turn the minutes into the seconds the database keeps");
      // a choice row is 44 px, its box 20 px (components/Radio, Checkbox)
      const css = readFileSync(join(repoRoot, "src/app/experience.css"), "utf8");
      c.expect(/\.pin-pilihan \{[^}]*min-height: var\(--control-md\)/.test(css) && /:where\(input\[type="checkbox"\][^)]*\), input\[type="radio"\]\) \{[^}]*width: var\(--icon-md\); height: var\(--icon-md\)/.test(css),
        "a choice row is not 44 px with a 20 px box");
      // rendered: the field draws its label above, the help under it, and the field names its help
      const r = render(repoRoot, "src/components/bentuk/BidangTeks.tsx", { id: "uji-jumlah", name: "jumlah", type: "number", label: "Jumlah soal",
        petunjuk: "Berapa soal yang dikerjakan setiap murid; boleh antara 3 dan 60 soal.", opsional: "(opsional)" });
      if (c.expect(r.ok, `BidangTeks did not render: ${r.galat}`)) {
        const iL = r.html.indexOf('<label for="uji-jumlah"'), iP = r.html.indexOf('id="uji-jumlah-petunjuk"'), iI = r.html.indexOf('<input id="uji-jumlah"');
        c.expect(iL >= 0 && iP > iL && iI > iP && /aria-describedby="uji-jumlah-petunjuk"/.test(r.html) && r.html.includes("(opsional)") && /name="jumlah"/.test(r.html),
          `the field is not label, help, field with the help named: ${r.html.slice(0, 300)}`);
      }
      return c.verdict("executed: «15 menit», «1 menit 30 detik», «45 detik»; the limits line «antara 3 dan 60 soal · tenggang kirim paling lama "
        + "15 menit · …» with no «–», «s» or «×»; each hint says its limit once, or per mode where the modes differ; minutes kept as whole seconds. "
        + "The source of src/app/studio/definisi/page.tsx: the mode, the bank and the order are radio rows and the two switches checkbox rows with "
        + "their explanation, all in fieldsets with a legend; every number has its hint; the four optional ones say «(opsional)»; the send grace "
        + "is asked in minutes and the action keeps seconds. RENDERED, the field is label, help, field, and the field names its help");
    },
  },
  {
    id: "STUDIO3B-TEMUAN-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const lemah = { severity: "WARNING", masalah: "Tidak satu pun pengecoh tertaut ke miskonsepsi.", mengapa_penting: "Tanpa tautan itu, jawaban salah tidak bisa dijelaskan.",
        cara_memperbaiki: "Tautkan setiap pengecoh ke kode miskonsepsi.", acknowledged_at: null };
      const mcq = [
        ...Array.from({ length: 28 }, (_, i) => ({ ...lemah, id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, lokasi: `Soal "S${i + 1}"` })),
        ...Array.from({ length: 4 }, (_, i) => ({ ...lemah, id: `00000000-0000-4000-9000-${String(i).padStart(12, "0")}`, lokasi: `Soal "P${i}"`,
          masalah: "Ada pengecoh yang terlalu pendek dibanding yang lain sehingga tidak meyakinkan.", cara_memperbaiki: "Tulis ulang pengecoh itu." })),
        { ...lemah, id: "00000000-0000-4000-a000-000000000001", lokasi: 'Soal "X"', severity: "ERROR", masalah: "Kata khas pada pertanyaan hanya muncul di pilihan yang benar.",
          cara_memperbaiki: "Ganti kata itu di pertanyaan." },
        { ...lemah, id: "00000000-0000-4000-a000-000000000002", lokasi: 'Soal "Y"', acknowledged_at: "2026-11-02T00:00:00Z" },
      ];
      let K: typeof import("../src/lib/temuan");
      try { K = await import("../src/lib/temuan"); } catch (e) { c.expect(false, `src/lib/temuan.ts cannot be read: ${String(e).slice(0, 120)}`); return c.verdict(""); }
      const g = K.kelompokTemuan([{ jenis: "MCQ_QUALITY", temuan: mcq }, { jenis: "COACHING", temuan: [] }]);
      c.expect(g.length === 3 && g[0].temuan.length === 28 && g[1].temuan.length === 4 && g[2].severity === "ERROR",
        `the findings are not one group per kind: ${g.map((x) => `${x.severity}:${x.temuan.length}`).join(", ")}`);
      const { t } = await import("../src/lib/hle");
      const props = { course: "c0000000-0000-4000-8000-000000000000", mcq, coaching: [], bolehAkui: true, pemilik: "p", ditolak: false, locale: "id" };
      const r = render(repoRoot, "src/components/studio/TemuanKelompok.tsx", props);
      if (c.expect(r.ok, `TemuanKelompok did not render: ${r.galat}`)) {
        const forms = r.html.split("<form").length - 1;
        const isian = (r.html.match(/name="finding"/g) ?? []).length;
        c.expect(forms === 2 && isian === 32, `a reviewer still acknowledges one finding at a time: ${forms} form(s), ${isian} finding field(s)`);
        c.expect(r.html.includes(`28 ${t("studio.temuan.kelompok.jumlah", "staff")}`) && r.html.includes(t("studio.temuan.akui_semua", "staff"))
          && (r.html.match(/Tidak satu pun pengecoh tertaut ke miskonsepsi\./g) ?? []).length === 1 && (r.html.match(/Tautkan setiap pengecoh/g) ?? []).length === 1,
          "a kind is not said once with its count, its fix once and one press for all of it");
        c.expect(/<details class="pin-disclosure pin-temuan-lokasi"><summary>/.test(r.html) && (r.html.match(/Soal &quot;S\d+&quot;/g) ?? []).length === 28,
          "the places are not listed in a Disclosure under their kind");
        c.expect(r.html.includes(t("studio.temuan.perbaiki_dulu", "staff")) && !r.html.includes('value="00000000-0000-4000-a000-000000000001"')
          && !r.html.includes("00000000-0000-4000-a000-000000000002"), "an ERROR is offered for acknowledgement, or an acknowledged finding is listed");
        c.expect(/<input type="hidden" name="kind" value="MCQ_QUALITY"\/>/.test(r.html) && /<input type="hidden" name="course" value="c0000000-0000-4000-8000-000000000000"\/>/.test(r.html),
          "a group's form does not carry its course and its kind");
      }
      const r2 = render(repoRoot, "src/components/studio/TemuanKelompok.tsx", { ...props, bolehAkui: false, locale: "en" });
      c.expect(r2.ok && !r2.html.includes("<form") && r2.html.includes(`28 ${t("studio.temuan.kelompok.jumlah", "staff", { locale: "en" })}`),
        "a reader without CAN_REVIEW is offered the acknowledgement, or the list is not in the reader's language");
      // the action: the same database function, once per finding, as the reviewer; bounded; says how many
      const aksi = kode(baca(repoRoot, "src/app/studio/actions.ts"));
      const awal = aksi.indexOf("export async function acknowledgeFindingsGroupAction");
      const fungsi = awal < 0 ? "" : aksi.slice(awal, aksi.indexOf("\nfunction ", awal) > 0 ? aksi.indexOf("\nfunction ", awal) : undefined);
      c.expect(/for \(const finding of findings\) \{\s*const \{ error \} = await supabase\.rpc\("acknowledge_finding", \{ p_kind: kind, p_finding: finding, p_note: catatan \}\);/.test(fungsi)
        && /await wajibDalamKonteks\(\{ sekolah: await sekolahDari\("kursus", course\) \}, "temuan"\);/.test(fungsi)
        && /findings\.length > TEMUAN_SEKALIGUS_MAKS/.test(fungsi) && /\{ ok: true, kode: "FINDINGS_ACKNOWLEDGED", n \}/.test(fungsi)
        && !/\.from\(|\.update\(|service|SERVICE_ROLE/.test(fungsi),
        "the group is not acknowledged through acknowledge_finding once per finding, as the reviewer, bounded and counted");
      c.expect(/export async function acknowledgeFindingAction\(fd: FormData\): Promise<void>/.test(aksi), "the one-finding action's signature changed");
      const { kunciKode, kalimatHasil } = await import("../src/lib/galat-kontrak");
      const st = (k: Parameters<typeof t>[0]) => t(k, "staff");
      const kal = kalimatHasil({ hasil: "ok", kode: "FINDINGS_ACKNOWLEDGED", n: "28" }, st, { ok: "studio.hasil.ok", gagal: "studio.hasil.gagal" });
      c.expect(kunciKode("FINDINGS_ACKNOWLEDGED") === "galat.findings_acknowledged" && !!kal && kal.endsWith(" 28."), `the group's result does not say how many: ${kal}`);
      // the check is the author's before the lock (runValidationAction on the package page, while the release is not sealed)
      const paket = kode(baca(repoRoot, "src/app/studio/paket/[course]/page.tsx"));
      c.expect(/\{can\(inst, "CAN_DRAFT"\) && !tersegel \? \(\s*<form action=\{runValidationAction\}/.test(paket)
        && /rpc\("validate_course_content"/.test(aksi) && /rpc\("run_mcq_quality"/.test(aksi), "the question check is not runnable by the author before the lock");
      return c.verdict("RENDERED (src/components/studio/TemuanKelompok.tsx), 33 waiting findings are 3 groups: 28 of one kind said once with «28 temuan», "
        + "its why and fix once, its 28 places in a Disclosure and ONE «Sudah saya tinjau semuanya» carrying all 28; an ERROR says it is fixed in the "
        + "content and offers no acknowledgement; an acknowledged finding is gone; without CAN_REVIEW no form, in the reader's language. The source of "
        + "src/app/studio/actions.ts: acknowledgeFindingsGroupAction asks acknowledge_finding once per finding as the reviewer, in the working context, "
        + "at most 500, writes no table itself, and says «… Jumlahnya: 28.»; the check (validate_course_content, run_mcq_quality) stays the author's "
        + "before the lock");
    },
  },
  {
    id: "STUDIO3B-KELIRU-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const jalan = baca(repoRoot, "audit/journey.mjs");
      const i = jalan.indexOf('await step("S22m"');
      const langkah = i >= 0 ? jalan.slice(i, jalan.indexOf("\nawait step(", i + 10)) : "";
      c.expect(i >= 0 && i > jalan.indexOf('await step("S22",') && i < jalan.indexOf('await step("S22b"'),
        "the browser journey has no step reading the misconception feedback after the students' answers (S21) and the figures (S22)");
      c.expect(/goto\(`\$\{APP\}\/mengajar\/\$\{kelas\}\/bukti`/.test(langkah) && /magicSignIn\(t, people\.guru\.email\)/.test(langkah)
        && /ul\.pin-keliru li/.test(langkah) && /\.pin-kl/.test(langkah) && /\.pin-ms/.test(langkah) && /\.pin-kr/.test(langkah)
        && /service_cohort_misconceptions/.test(langkah) && /minimum_sample/.test(langkah) && /rec\.verdict = "FAIL"/.test(langkah)
        && /definisi\.get\(b\.label\) === b\.bantu/.test(langkah) && /jumlah <= dasar/.test(langkah) && /!MURID\.some/.test(langkah),
        "S22m does not read the figure as the teacher sees it, check it against the package's definitions and the class's answers, and fail when it is wrong");
      // the selectors are what the page draws
      const bukti = kode(baca(repoRoot, "src/app/mengajar/[kelas]/bukti/page.tsx"));
      c.expect(/<ul className="pin-keliru">/.test(bukti) && /<span className="pin-kl">\{k\.label\}<\/span>/.test(bukti)
        && /<span className="pin-ms pin-num">/.test(bukti) && /<span className="pin-kr">\{k\.remediation\}<\/span>/.test(bukti)
        && /s\("mengajar\.bukti\.keliru"\)/.test(bukti), "«Lihat bukti» no longer draws the figure by the selectors S22m reads");
      const { t } = await import("../src/lib/hle");
      c.expect(langkah.includes(`judul === "${t("mengajar.bukti.keliru", "educator", { locale: "id" })}"`), "S22m expects a heading the page does not say");
      // the evidence exists: every wrong option of the synthetic Bab 1 names a misconception its own package defines
      const p = JSON.parse(baca(repoRoot, "audit/fixtures/sd5-sintetis-bab1.paket.json") || "{}") as {
        misconceptions?: Array<{ code: string }>; courses?: Array<{ modules: Array<{ lessons: Array<{ items?: Array<{ options: Array<{ is_correct: boolean; misconception_code?: string }> }> }> }> }>;
      };
      const kodeAda = new Set((p.misconceptions ?? []).map((m) => m.code));
      const salah = (p.courses ?? []).flatMap((k) => k.modules.flatMap((m) => m.lessons.flatMap((l) => (l.items ?? []).flatMap((it) => it.options.filter((o) => !o.is_correct)))));
      const tanpa = salah.filter((o) => !o.misconception_code || !kodeAda.has(o.misconception_code));
      c.expect(salah.length > 0 && tanpa.length === 0, `${tanpa.length} of ${salah.length} wrong option(s) of the synthetic Bab 1 name no misconception its package defines`);
      return c.verdict(`the journey (audit/journey.mjs, run by .github/workflows/audit-journeys.yml) has step S22m after the students' answers: the teacher `
        + "opens «Lihat bukti» and the figure «Pemahaman keliru yang berulang di kelas ini» is read by the selectors the source of "
        + "src/app/mengajar/[kelas]/bukti/page.tsx draws, each row checked against the package's own definition and remediation, most frequent "
        + `first, no more than the class's own wrong answers carrying a code, no student named, FAIL otherwise; all ${salah.length} wrong options of `
        + "the synthetic Bab 1 name a misconception the package defines, so the figure has its evidence");
    },
  },
  {
    id: "STUDIO3B-CONTOH-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      let C: typeof import("../src/components/unggah/contoh");
      try { C = await import("../src/components/unggah/contoh"); } catch (e) { c.expect(false, `src/components/unggah/contoh.ts cannot be read: ${String(e).slice(0, 120)}`); return c.verdict(""); }
      const { bacaBukuKerja } = await import("../src/lib/xlsx");
      const { bukuKerjaKePaket } = await import("../src/lib/unggah-kontrak");
      const { TANDA_CONTOH } = await import("../src/lib/contoh-buku-kerja");
      const a = C.bukuKerjaContohSaja(), b = C.bukuKerjaContohSaja();
      c.expect(Buffer.from(a).equals(Buffer.from(b)), "the example is not the same bytes from the same contract");
      const h = bacaBukuKerja(a);
      if (!c.expect(h.ok, "the importer's reader refuses the example")) return c.verdict("");
      type Opsi = { body: string; is_correct: boolean; misconception_code?: string };
      type Soal = { stem: string; use?: string; options: Opsi[] };
      const paket = bukuKerjaKePaket((h as unknown as { lembar: never[] }).lembar) as { ok: boolean; paket?: {
        courses: Array<{ title: string; modules: Array<{ lessons: Array<{ summary?: string; items?: Soal[] }> }> }>; misconceptions?: Array<{ code: string }> } };
      if (!c.expect(paket.ok && paket.paket!.courses.length === 1, "the importer's converter does not turn the example into one course")) return c.verdict("");
      const kursus = paket.paket!.courses[0];
      const soal = kursus.modules.flatMap((m) => m.lessons.flatMap((l) => l.items ?? []));
      c.expect(C.TANDA === TANDA_CONTOH && kursus.title.startsWith(TANDA_CONTOH), `the example's course is not marked «${TANDA_CONTOH.trim()}»: ${kursus.title}`);
      c.expect(/dikarang|karangan/.test(kursus.modules[0].lessons[0].summary ?? ""), "the example's first lesson does not say its content is made up");
      c.expect(soal.some((q) => q.use === "PRE_TEST") && soal.some((q) => q.use === "POST_TEST") && soal.some((q) => !q.use) && soal.every((q) => q.options.filter((o) => o.is_correct).length === 1),
        "the example does not show a Pemetaan awal, a Cek penguasaan and a practice question, each with one key");
      const kodeAda = new Set((paket.paket!.misconceptions ?? []).map((m) => m.code));
      c.expect(kodeAda.size > 0 && soal.every((q) => q.options.filter((o) => !o.is_correct).every((o) => o.misconception_code && kodeAda.has(o.misconception_code))),
        "the example's wrong options do not each name a misconception its «Miskonsepsi» sheet defines");
      // NO LIVE ITEM: none of its questions is in the synthetic corpus, an audit fixture or the withheld example
      const hidup = new Set<string>();
      const ambil = (j: { courses?: Array<{ modules: Array<{ lessons: Array<{ items?: Soal[] }> }> }> }) =>
        (j.courses ?? []).forEach((k) => k.modules.forEach((m) => m.lessons.forEach((l) => (l.items ?? []).forEach((q) => hidup.add(norm(q.stem))))));
      const paketHidup = [...berkas(join(repoRoot, "docs/onboarding/konten-sintetis"), /\.paket\.json$/), ...berkas(join(repoRoot, "audit/fixtures"), /\.paket\.json$/)];
      for (const f of paketHidup) ambil(JSON.parse(readFileSync(f, "utf8")));
      const ditahan = bacaBukuKerja(new Uint8Array(readFileSync(join(repoRoot, "docs/onboarding/contoh/contoh-buku-kerja-pintar.xlsx"))));
      if (ditahan.ok) { const pk = bukuKerjaKePaket(ditahan.lembar) as { ok: boolean; paket?: never }; if (pk.ok) ambil(pk.paket!); }
      const sama = soal.filter((q) => hidup.has(norm(q.stem)));
      c.expect(hidup.size >= 36 && sama.length === 0, `the example shares ${sama.length} question(s) with a live chapter or fixture (${hidup.size} read)`);
      // F-4: the source fires no answer-key rule, and nothing is served
      type Temuan = { aturan: string; kelas: string };
      const pindai = (await import(pathToFileURL(join(repoRoot, "scripts/guard/sensitive-scan.mjs")).href)) as {
        muatIzin: () => unknown; pindaiBerkas: (p: string, b: Buffer, izin: unknown) => Temuan[];
        putuskan: (t: Temuan[], izin: unknown) => { ditolak: Temuan[] };
      };
      const izin = pindai.muatIzin();
      const temuSumber = pindai.pindaiBerkas("src/components/unggah/contoh.ts", readFileSync(join(repoRoot, "src/components/unggah/contoh.ts")), izin);
      const temu = pindai.putuskan(temuSumber, izin);
      c.expect(temuSumber.filter((x) => x.kelas === "kunci-jawaban").length === 0 && temu.ditolak.length === 0,
        `the F-4 guard flags the example's source: ${temuSumber.map((x) => x.aturan).join(", ")}`);
      const disajikan = berkas(join(repoRoot, "public"), /\.(xlsx|xlsm|xls|csv|json)$/i);
      c.expect(disajikan.length === 0, `a workbook or data file is served from public/: ${disajikan.join(", ")}`);
      // offered beside the blank template (rendered)
      const { t } = await import("../src/lib/hle");
      for (const locale of ["id", "en"] as const) {
        const r = render(repoRoot, "src/components/unggah/PanelUnggah.tsx", { locale, sekolah: [{ id: "s1", name: "SD Contoh" }], batasMb: 5 });
        if (!c.expect(r.ok, `(${locale}) the upload panel did not render: ${r.galat}`)) continue;
        const iT = r.html.indexOf(t("studio.unggah.templat", "staff", { locale })), iC = r.html.indexOf(t("studio.unggah.contoh", "staff", { locale }));
        c.expect(iT >= 0 && iC > iT && r.html.includes(t("studio.unggah.contoh_arti", "staff", { locale })) && /data-contoh-saja=""/.test(r.html),
          `(${locale}) the example is not offered beside the blank template with what it is`);
        c.expect((locale === "id" ? /karangan/ : /made up/).test(t("studio.unggah.contoh_arti", "staff", { locale })), `(${locale}) the offer does not say the content is made up`);
      }
      const panel = kode(baca(repoRoot, "src/components/unggah/PanelUnggah.tsx"));
      c.expect(/unduh\(bukuKerjaContohSaja\(\), NAMA_UNDUHAN_CONTOH\)/.test(panel) && !/fetch\([^)]*contoh/.test(panel), "the example is not built in the browser as the template is");
      return c.verdict(`the example (src/components/unggah/contoh.ts) is built in the browser from the template's own sheets, the same bytes every time; the `
        + `importer's reader and converter make it one course «${kursus.title}» of ${soal.length} questions (a Pemetaan awal, Cek penguasaan and practice, `
        + "each with one key, every wrong option naming a misconception its sheet defines); none of its questions is among the "
        + `${hidup.size} of the synthetic corpus, the audit fixtures or the withheld example; the F-4 guard finds nothing in its source; nothing is served; `
        + "RENDERED, the upload panel offers it beside the blank template in both languages, saying its content is made up");
    },
  },
  {
    id: "STUDIO3B-KATA-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const { t } = await import("../src/lib/hle");
      const hle = readFileSync(join(repoRoot, "src/lib/hle.ts"), "utf8");
      const kunciStudio = [...hle.matchAll(/^\s*"(studio\.[a-z0-9_.A-Z]+)": \{/gm)].map((m) => m[1]);
      const siswa = kunciStudio.filter((k) => /\bsiswa\b/i.test(t(k as Parameters<typeof t>[0], "staff", { locale: "id" })));
      c.expect(kunciStudio.length > 300 && siswa.length === 0, `Studio still says «siswa» (UX-18): ${siswa.join(", ")}`);
      // UX-43: the workbook's guidance carries no decision number
      const { KOLOM } = await import("../src/lib/unggah-kontrak");
      const { templatPelajaran } = await import("../src/components/unggah/templat");
      const { bacaBukuKerja } = await import("../src/lib/xlsx");
      const h = bacaBukuKerja(templatPelajaran());
      const panduan = h.ok ? h.lembar.find((l) => l.nama === "Cara mengisi")?.baris.flat().join(" ") ?? "" : "";
      c.expect(panduan.includes("Kegunaan") && !/\(D-\d{3}\)/.test(panduan) && !Object.values(KOLOM).flat().some((k) => /\(D-\d{3}\)/.test(k.arti)),
        "the workbook's guidance still prints a decision number («(D-008)», UX-43)");
      // UX-25: every page reads its reader's language once and says every word through it
      for (const f of HALAMAN) {
        const src = kode(baca(repoRoot, f));
        c.expect(/kataStudio\((?:locale|await currentLocale\(\))\)/.test(src) && !/import \{[^}]*\bs\b[^}]*\} from "\.\.?\/(?:\.\.\/)?_lib"/.test(src),
          `${f} does not draw its words in the reader's language (kataStudio)`);
        c.expect(!/\bt\("[^"]+", "staff"\)/.test(src), `${f} still asks the copy table without the reader's language`);
        for (const m of src.matchAll(/\b(enumLabel|when|outcomeLine)\(([^()]*(?:\([^()]*\))?[^()]*)\)/g)) {
          c.expect(/,\s*locale$/.test(m[2].trim()), `${f}: ${m[1]}(${m[2].slice(0, 40)}) without the reader's language`);
        }
      }
      // the pager (its link builder is a function, so it is read as source, not rendered)
      const pager = kode(baca(repoRoot, "src/components/koleksi/Penomoran.tsx"));
      c.expect(/t\("koleksi\.kembali", "staff", \{ locale \}\)/.test(pager) && /t\("koleksi\.berikutnya", "staff", \{ locale \}\)/.test(pager)
        && /t\("lesson\.page_of", "staff", \{ locale \}\)/.test(pager), "the pager does not speak the reader's language");
      c.expect(HALAMAN.filter((f) => /<Penomoran /.test(baca(repoRoot, f))).every((f) => /<Penomoran [^>]*locale=\{locale\}/.test(baca(repoRoot, f))),
        "a Studio page's pager is not given the reader's language");
      // rendered: a list's result line and the review form speak English to an English reader
      const r = render(repoRoot, "src/components/studio/TemuanKelompok.tsx", { course: "c", mcq: [], coaching: [], bolehAkui: true, pemilik: "p", ditolak: false, locale: "en" });
      c.expect(r.ok, `a Studio component did not render in English: ${r.galat}`);
      // RV-23 at 320 px: the order is a radio group (no cut select), a code keeps together, a field and a select shrink with their column
      const css = readFileSync(join(repoRoot, "src/app/experience.css"), "utf8");
      c.expect(!/<select[^>]*name="acak"/.test(baca(repoRoot, "src/app/studio/definisi/page.tsx")), "the order is still a select that is cut at 320 px");
      c.expect(/<span className="pin-kode">\{o\.code\}<\/span>/.test(baca(repoRoot, "src/app/studio/pratinjau/[pelajaran]/page.tsx"))
        && /\.pin-kode \{[^}]*display: inline-block;[^}]*white-space: nowrap/.test(css), "a competency code still breaks inside itself at 320 px");
      c.expect(/\.pin-bidang > \.pin-input, \.pin-bidang > select \{ width: 100%; \}/.test(css) && /\.pin-bidang \{[^}]*min-width: 0/.test(css)
        && /\.pin-input \{ max-width: 100%; min-width: 0; \}/.test(css) && /\.pin-formulir-baris \{[^}]*minmax\(min\(100%,/.test(css),
        "a field or a select does not shrink with its column at 320 px");
      return c.verdict(`no Studio copy says «siswa» (${kunciStudio.length} keys read); the template's «Cara mengisi», generated, prints no decision number; `
        + `the source of each of the ${HALAMAN.length} Studio surfaces reads its reader's language once (kataStudio) and gives it to every enumLabel, `
        + "when and outcomeLine, and the pager speaks it; at 320 px the order is radios, a code keeps together and a field or select shrinks with its column");
    },
  },
];
