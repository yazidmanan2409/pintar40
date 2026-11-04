/**
 * The retrospective integrity audit of Batches 0–6 (docs/completion-4.0/retrospektif/): regressions for what it found
 * claimed but unguarded, or never closed. Each test names its register row.
 *
 *   R0-PIN-01  (R0-1, W0.2) every workflow job that installs or launches a browser runs on ubuntu-24.04: Playwright 1.55
 *              has no browser build for ubuntu-latest (26.04; run 41377378758). Batch 0 pinned seventeen jobs; nothing
 *              held a new job to it, so a walk added on ubuntu-latest would fail only when CI first ran it.
 *   R2-TANGGAL-01 (R2-3, E3 #15, DS/10-dates) no on-screen date takes the formal form («9 Oktober 2026»): it is for
 *              emails and printed letters, and the certificate keeps its own (frozen). Daisy answered E3 on her branch; its
 *              «[auto] no on-screen date uses the formal form» was never made a test, and a screen took the form again.
 *   R2-KOSONG-01 (R2-5, W3.2, D-172 P13) every empty state is the Empty state (`Kosong`): one sentence and, where one
 *              exists, the way on. Batch 2 left the adoption to «later batches» with no list; 22 bare lines remained, one
 *              of them a refusal («Kelas ini bukan wewenang Anda.») drawn as an empty state, which Kosong's rule forbids.
 *              A bare line is allowed only where it is not an empty, each named below with its reason.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t } from "../src/lib/hle";

/** The jobs of a workflow file, by name, each with its text (indentation-based; the files are two-space YAML). */
export function jobsAlurKerja(yml: string): Array<{ nama: string; isi: string }> {
  const awal = yml.search(/^jobs:\s*$/m);
  if (awal < 0) return [];
  const badan = yml.slice(awal).split("\n").slice(1);
  const jobs: Array<{ nama: string; isi: string }> = [];
  for (const baris of badan) {
    const m = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(baris);
    if (m) jobs.push({ nama: m[1], isi: "" });
    else if (/^\S/.test(baris)) break;
    else if (jobs.length) jobs[jobs.length - 1].isi += `${baris}\n`;
  }
  return jobs;
}

const PERAMBAN = /playwright install|chromium\.launch|node (?:crawl|journey|studio-ujung|admin-ujung|b5-ujung|b6-cetak|b5-fokus|e1-navigasi|d1-email|c12)\.mjs/;

/** Every .tsx file under a directory, recursively. */
function tsx(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? tsx(join(dir, e.name)) : e.name.endsWith(".tsx") ? [join(dir, e.name)] : []);
}

export const retroTests: SelfTest[] = [
  {
    id: "R0-PIN-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const dir = join(repoRoot, ".github", "workflows");
      let dilihat = 0;
      for (const f of readdirSync(dir).filter((x) => /\.ya?ml$/.test(x))) {
        for (const j of jobsAlurKerja(readFileSync(join(dir, f), "utf8"))) {
          if (!PERAMBAN.test(j.isi)) continue;
          dilihat++;
          const runsOn = [...j.isi.matchAll(/^\s+runs-on:\s*(\S+)/gm)].map((m) => m[1]);
          c.expect(runsOn.length === 1 && runsOn[0] === "ubuntu-24.04", `${f} › ${j.nama} drives a browser on ${runsOn.join(", ") || "no runner"}, not ubuntu-24.04`);
        }
      }
      c.expect(dilihat >= 17, `only ${dilihat} browser job(s) found; Batch 0 pinned 17`);
      // the check itself catches a planted job on ubuntu-latest
      const tanam = jobsAlurKerja("on: push\njobs:\n  walk:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npx playwright install chromium\n");
      c.expect(tanam.length === 1 && PERAMBAN.test(tanam[0].isi) && /runs-on:\s*ubuntu-latest/.test(tanam[0].isi), "the check cannot see a planted browser job on ubuntu-latest");
      return c.verdict(`every workflow job that installs or drives a browser (${dilihat}) runs on ubuntu-24.04, where Playwright 1.55 has its browser build (W0.2)`);
    },
  },
  {
    id: "R2-TANGGAL-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // the certificate keeps its own form (frozen; DS/10-dates); emails are not screens
      const BOLEH = [/src\/components\/sertifikat\//, /src\/components\/email\//, /src\/app\/sertifikat\//];
      const RESMI = /tanggal\([^)]*,\s*"resmi(?:Jam)?"|when\([^)]*,\s*"resmi(?:Jam)?"|format\.date\(/;
      let dibaca = 0;
      for (const f of [...tsx(join(repoRoot, "src", "app")), ...tsx(join(repoRoot, "src", "components"))]) {
        const rel = f.slice(repoRoot.length + 1).replace(/\\/g, "/");
        if (BOLEH.some((b) => b.test(rel))) continue;
        dibaca++;
        const src = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
        const m = RESMI.exec(src);
        c.expect(!m, `${rel} writes a date in the formal form on screen (${m?.[0]})`);
      }
      c.expect(dibaca > 100, `only ${dibaca} screen files read`);
      c.expect(RESMI.test('when(p.starts_on, "resmi")') && RESMI.test("format.date(x, locale)") && !RESMI.test('when(p.starts_on, "baca")'), "the check cannot tell the formal form from the readable one");
      return c.verdict(`no screen file (${dibaca}) writes a date in the formal form; it stays with emails, printed letters and the certificate's own frozen form (E3 #15, DS/10-dates)`);
    },
  },
  {
    id: "R2-KOSONG-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // the bare lines that are not empty states, each with its reason
      const BOLEH: Record<string, string> = {
        "src/components/Kosong.tsx": "the component itself",
        "src/components/mengajar/DaftarMurid.tsx": "a roster's empty sentence, passed in as a key and rendered where tests import the list outside Next",
        "src/components/bukti/KeadaanHariIni.tsx": "imported outside Next by its tests (W8-K01): no next/link, so not Kosong",
        "src/components/pendataan/BacaDanPetakan.tsx": "a field's status line («pin-meta» or «pin-empty» by layout), not an empty list",
        "src/app/pendataan/page.tsx#pendataan.kode.belum": "a status: «Sekolah ini belum punya kode.»",
        "src/app/pimpinan/page.tsx#pimpinan.menunggu.nihil": "«nothing waits»: honest absence, none of Kosong's three kinds",
      };
      let ditemukan = 0;
      for (const f of [...tsx(join(repoRoot, "src", "app")), ...tsx(join(repoRoot, "src", "components"))]) {
        const rel = f.slice(repoRoot.length + 1).replace(/\\/g, "/");
        const src = readFileSync(f, "utf8");
        for (const m of src.matchAll(/<p className=(?:"pin-empty"|\{[^}]*pin-empty[^}]*\})>([^\n]*)/g)) {
          ditemukan++;
          const kunci = /\("([a-z0-9_.]+)"/.exec(m[1])?.[1];
          const ok = rel in BOLEH || (kunci !== undefined && `${rel}#${kunci}` in BOLEH);
          c.expect(ok, `${rel}: a bare empty line (${kunci ?? m[1].slice(0, 40)}) that is not the Empty state (Kosong) and not declared`);
        }
      }
      // the refusal is never drawn as empty (Kosong's rule; S-2)
      const ub = readFileSync(join(repoRoot, "src/app/pimpinan/[simpul]/umpan-balik/kelas/[kelas]/page.tsx"), "utf8");
      c.expect(/<p className="pin-meta" data-tolak-bagian="">\{s\("umpanbalik\.buka\.tanpa_wewenang"\)\}<\/p>/.test(ub), "«Kelas ini bukan wewenang Anda.» is drawn as an empty state");
      c.expect(ditemukan >= 4 && ditemukan <= 8, `${ditemukan} bare empty lines found; the declared ones are five`);
      return c.verdict(`every empty state is the Empty state (Kosong) but the ${Object.keys(BOLEH).length - 1} declared bare lines, each not an empty (a status, «nothing waits», or a component tests import outside Next); the section refusal is a statement, not an empty state`);
    },
  },
  {
    id: "R3-SOAL-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      /**
       * R3 (W1.2, D-088(h), Daisy's A1 under D-166(b)): THE QUESTION REVIEW IS A1's COMPOSITION, AND ITS READ NEVER
       * SHOWS A PART AS THE WHOLE. Batch 3 closed W1.2 with closed disclosures, one per lesson; A1 was accepted and
       * not built. And the loader dropped every query's error and read the questions in one request (cut at the API's
       * row limit), so a failed or a large read showed a shorter list as if it were the package.
       */
      const { soalPaket } = await import("../src/lib/soal-tinjauan");
      // a fake client: the tables' rows, a failing table, and PostgREST's row limit (1000) on every read
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const palsu = (data: Record<string, any[]>, gagal?: string) => ({
        from: (tabel: string) => {
          let baris = [...(data[tabel] ?? [])];
          const q: any = {
            select: () => q, eq: (k: string, v: unknown) => { baris = baris.filter((r) => r[k] === v); return q; },
            in: (k: string, v: unknown[]) => { baris = baris.filter((r) => v.includes(r[k])); return q; },
            order: (k: string) => { baris.sort((a, b) => String(a[k]).localeCompare(String(b[k]))); return q; },
            range: (a: number, b: number) => { baris = baris.slice(a, b + 1); return q; },
            limit: (n: number) => { baris = baris.slice(0, n); return q; },
            then: (ok: (x: unknown) => unknown) => Promise.resolve(tabel === gagal
              ? { data: null, error: { message: "planted" } } : { data: baris.slice(0, 1000), error: null }).then(ok),
          };
          return q;
        },
      });
      const items = Array.from({ length: 2500 }, (_, i) => ({ id: `q${String(i).padStart(5, "0")}`, lesson_id: `l${i % 500}`,
        cycle_role: null, bank_type: "PRACTICE", stimulus: null, stem: `s${i}`, created_at: "2026-10-01T00:00:00Z", predicted_difficulty: null }));
      const data = {
        modules: [{ id: "m", ordinal: 1, course_id: "k" }],
        lessons: Array.from({ length: 501 }, (_, i) => ({ id: `l${i}`, module_id: "m", ordinal: i + 1, title: `P${i}` })),
        items, item_options: items.map((q) => ({ item_id: q.id, label: "A", body: "x", is_correct: true, rationale: "r", misconception_code: null })),
        misconception_taxonomy: [],
      };
      const besar = await soalPaket(palsu(data), "k");
      const n = besar.ok ? besar.pelajaran.reduce((x, l) => x + l.soal.length, 0) : -1;
      c.expect(besar.ok && n === 2500 && besar.pelajaran.length === 501 && besar.pelajaran[500].soal.length === 0,
        `2,500 questions in 500 lessons and one empty lesson read as ${besar.ok ? `${n} in ${besar.pelajaran.length}` : "a failure"}; expected all of them, the empty lesson kept`);
      for (const t of ["modules", "lessons", "items", "item_options"]) {
        const r = await soalPaket(palsu(data, t), "k");
        c.expect(!r.ok, `a failed read of ${t} is shown as a list`);
      }

      const hal = readFileSync(join(repoRoot, "src/app/studio/paket/[course]/page.tsx"), "utf8");
      const a = hal.indexOf('id="soal"'), b = hal.indexOf("<LangkahTerbit", a);
      const bag = a > 0 && b > a ? hal.slice(a, b) : "";
      c.expect(bag.length > 0, "the question section is not before the publish steps");
      c.expect(!/<details\b|TombolCiut/.test(bag), "the questions are still behind a disclosure (A1 decision 4: one whole lesson per view)");
      c.expect(/!soal\.ok \?[\s\S]{0,200}<BarisHasil nada="gagal">\{sl\("studio\.soal\.gagal"\)\}/.test(bag), "a failed read is not said (A1 «gagal»)");
      c.expect(/totalSoal === 0 \?[\s\S]{0,80}<Kosong jenis="belum" kalimat=\{sl\("studio\.soal\.kosong"\)\} \/>/.test(bag), "a package without questions is not the Empty state");
      c.expect(/const l = pelajaranSoal\[iniPelajaran - 1\]/.test(bag) && !/pelajaranSoal\.map\(\(l\b/.test(bag), "more than one lesson is drawn at once");
      c.expect(/studio\.soal\.posisi", \{ i: format\.number\(sebelumIni \+ qi \+ 1, locale\), n: format\.number\(totalSoal, locale\) \}/.test(bag), "the numbering is not package-wide («Soal i dari n»)");
      c.expect(/<form method="get" className="pin-soal-lompat">[\s\S]*?<label htmlFor="pin-soal-pilih">[\s\S]*?<select id="pin-soal-pilih" name="pelajaran"[\s\S]*?<button type="submit"[^>]*>\{sl\("studio\.soal\.buka"\)\}<\/button>/.test(bag)
        && !/onChange/.test(bag), "the jump is not a labelled Select with a button, as a plain GET (never on change)");
      c.expect(/<FokusSoal pelajaran=\{iniPelajaran\} \/>/.test(bag) && /<h3 id="pin-soal-pelajaran" tabIndex=\{-1\}/.test(bag), "after the jump or the pager, focus is not put on the lesson's heading");
      const fokus = readFileSync(join(repoRoot, "src/components/studio/FokusSoal.tsx"), "utf8");
      c.expect(/getElementById\("pin-soal-pelajaran"\)\?\.focus\(\)/.test(fokus) && /\[pelajaran\]/.test(fokus), "FokusSoal does not focus the heading on each lesson");
      c.expect(/studio\.soal\.sebelumnya[\s\S]*studio\.soal\.berikutnya/.test(bag) && /aria-disabled="true"/.test(bag), "the pager does not name the lesson or keeps no disabled end");
      c.expect(/o\.kunci \? <> <strong className="pin-pill pin-ok pin-pill-ikon pin-studio-kunci"><Ikon nama="check" \/>\{sl\("studio\.soal\.kunci"\)\}/.test(bag),
        "the key is not marked by badge, icon and word (never colour alone, WCAG 1.4.1)");
      c.expect(/\{q\.opsi\.map\(\(o\) => \([\s\S]{0,1200}<p className="pin-opsi-alasan">\{sl\("studio\.soal\.alasan"\)\}: <TeksBaris teks=\{o\.alasan\} \/><\/p>/.test(bag),
        "an option's reason is not always shown under it");
      return c.verdict("runs soalPaket over a planted client with the API's 1,000-row limit: 2,500 questions in 500 lessons are all read, an empty lesson kept, and a failed read of any table is a failure, never a list; reads the package page: one whole lesson per view with no disclosure, package-wide numbering, a labelled GET jump with a button, focus on the lesson heading after a move, a named pager with disabled ends, the key by badge, icon and word, and every option's reason shown");
    },
  },
  {
    id: "R3-A5-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      /**
       * R3 (Batch 3's own wording and layout, answered by Daisy as A4 and A5 and accepted by the owner, D-171(b) and
       * D-173(a)): WHAT WAS ACCEPTED IS WHAT IS ON SCREEN. The audit found an accepted English line not applied, three
       * markers of an optional field (one doubled: «Catatan (boleh kosong) (opsional)»), Studio's head over a package's
       * page, no sent-back badge on Studio's list, and no window in Siapkan's review before «Sediakan».
       */
      const k = (key: string, locale: "id" | "en") => t(key as never, "staff", { locale });
      // A4: the corrected English, exactly (B5, C2, C3, C5, D7); C3's hint and C9 stay Dr Gladys's and are not read here
      const EN: Record<string, string> = {
        "studio.kembali.judul": "Send this package back to its author?",
        "galat.sent_back": "This package was sent back to its author with your reason.",
        "galat.sendback_not_reviewer": "Sending a package back to its author is not yours to do in this school.",
        "galat.sendback_reviewer_is_author": "You wrote this package, so someone else sends it back.",
        "galat.findings_acknowledged": "Findings of this kind are marked reviewed together. Count:",
        "studio.definisi.f.tenggang_menit": "Late-submission grace (minutes)",
        "studio.unggah.contoh": "Download a filled-in example",
        "mengajar.cepat.hasil.kelas": "Class average score",
      };
      for (const [key, en] of Object.entries(EN)) c.expect(k(key, "en") === en, `(en) ${key} reads «${k(key, "en")}», not «${en}»`);
      c.expect(k("galat.findings_acknowledged", "id") === "Temuan sejenis sudah ditinjau sekaligus. Jumlahnya:" && k("studio.temuan.akui_semua", "id").includes("tinjau"),
        "the findings' result does not echo its button's verb («tinjau»)");
      const hle = readFileSync(join(repoRoot, "src/lib/hle.ts"), "utf8");
      const kursus = [...hle.matchAll(/^ {2}"((?:studio\.kembali|galat\.sendback|galat\.sent_back)[^"]*)": \{[^\n]*en: "([^"]*)"/gm)].filter((m) => /\bcourse/i.test(m[2]));
      c.expect(kursus.length === 0, `the send-back's English says «course» for the package: ${kursus.map((m) => m[1]).join(", ")}`);
      // A4 C3/D7: «(opsional)» is one shared key wherever an optional field is marked
      const tanda = [...hle.matchAll(/^ {2}"([^"]+)": \{ default: "([^"]*)", en: "([^"]*)"/gm)]
        .filter((m) => /\((?:opsional|tidak wajib|pilihan|boleh kosong)\)/.test(m[2]) || /\(optional\)/.test(m[3]))
        .map((m) => m[1]).filter((x) => x !== "bentuk.opsional" && x !== "studio.definisi.wajib");
      c.expect(tanda.length === 0, `an optional field marked by its own words, not the one key: ${tanda.join(", ")}`);
      c.expect(!/"studio\.definisi\.opsional"/.test(hle), "a second «(opsional)» key");
      const integritas = readFileSync(join(repoRoot, "src/app/studio/integritas/page.tsx"), "utf8");
      c.expect(/label=\{s\("studio\.paket\.catatan"\)\} opsional=\{s\("bentuk\.opsional"\)\}/.test(integritas) && k("studio.paket.catatan", "id") === "Catatan",
        "the integrity note is not «Catatan» with the one optional mark");
      // A5 B10: a package's page is headed by its title, the one h1, with Studio's head stepping aside
      const paket = readFileSync(join(repoRoot, "src/app/studio/paket/[course]/page.tsx"), "utf8");
      const tata = readFileSync(join(repoRoot, "src/app/studio/layout.tsx"), "utf8");
      const kepala = readFileSync(join(repoRoot, "src/components/studio/KepalaStudio.tsx"), "utf8");
      c.expect(/<Link className="pin-back" href="\/studio">[\s\S]{0,120}<\/p>\s*<h1 className="pin-h1">\{course\.title\}<\/h1>/.test(paket) && (paket.match(/<h1\b/g) ?? []).length === 1,
        "the package page's h1 is not its title under the back link «Studio»");
      c.expect(!/<h[5-6]\b/.test(paket) && /<h2 id="pin-soal-judul"/.test(paket), "the package page's sections are not one level under its h1");
      c.expect(/<KepalaStudio>\s*<header className="pin-head">\s*[\s\S]{0,120}<h1 className="pin-h1">\{s\("studio\.title"\)\}<\/h1>/.test(tata)
        && /startsWith\("\/studio\/paket\/"\) \? null/.test(kepala), "Studio's head is still drawn over a package's page");
      // A5 C1: a sent-back package carries «Dikembalikan ke penyusun» beside «Sekarang: …»
      const beranda = readFileSync(join(repoRoot, "src/app/studio/page.tsx"), "utf8");
      c.expect(/c\.status === "VALIDATION_FAILED" && tinjauanTerakhir\.get\(c\.id as string\) === "SENT_BACK"\s*\? <span className="pin-pill pin-attention pin-pill-ikon" data-dikembalikan=""><Ikon nama="triangle-alert" \/>\{s\("studio\.paket\.riwayat\.dikembalikan"\)\}/.test(beranda),
        "Studio's list does not mark a sent-back package");
      // A5 J5: the window being confirmed is in the review, before «Sediakan», following the fields
      const siap = readFileSync(join(repoRoot, "src/app/mengajar/[kelas]/siapkan/page.tsx"), "utf8");
      const iJ = siap.indexOf("<JendelaTinjau"), iT = siap.indexOf("<TombolKirim", iJ);
      c.expect(iJ > siap.indexOf('{s("mengajar.siap.tinjau")}') && iT > iJ && /\{sudah \? null : \(\s*<JendelaTinjau idMulai="pin-mulai" idSampai="pin-sampai"/.test(siap),
        "Siapkan's review does not carry the window before «Sediakan»");
      const jt = readFileSync(join(repoRoot, "src/components/mengajar/JendelaTinjau.tsx"), "utf8");
      c.expect(/gemaTanggal\(nilai\.mulai, locale\)/.test(jt) && /addEventListener\("input", ikut\)/.test(jt), "the review's window does not follow the fields in the date helper's words");
      return c.verdict("reads the copy table: A4's corrected English exactly, no «course» in the send-back, the findings' result echoing «tinjau», one «(opsional)» key; reads the source: the package page headed by its title (one h1, sections under it) with Studio's head aside, the sent-back badge on Studio's list, and Siapkan's review carrying the window before «Sediakan»");
    },
  },
  {
    id: "R5-PERSOAL-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      /**
       * R5 (E-C2-3, D-168; D-069(b)): «LIHAT PER SOAL» IS OFFERED ONLY WHERE THE PER-QUESTION PAGE ANSWERS. The page
       * refuses a class whose members are participants (adaBuktiSoal); Batch 5's fix gated the class page's link, but
       * the Uji Cepat's own page and its results still offered it on a PD class, so the facilitator pressed into a
       * refusal. Every link to /mengajar/[kelas]/soal must sit under the same predicate the page asks.
       */
      const halaman = readFileSync(join(repoRoot, "src/app/mengajar/[kelas]/soal/page.tsx"), "utf8");
      c.expect(/if \(!adaBuktiSoal\(ctx\.ini\.jenis\)\) \{\s*return <HalamanPenolakan/.test(halaman), "the per-question page no longer refuses by adaBuktiSoal");
      let n = 0;
      for (const f of [...tsx(join(repoRoot, "src", "app")), ...tsx(join(repoRoot, "src", "components"))]) {
        const rel = f.slice(repoRoot.length + 1).replace(/\\/g, "/");
        const src = readFileSync(f, "utf8");
        for (const m of src.matchAll(/href=\{`\/mengajar\/\$\{[a-z]+\}\/soal\?/g)) {
          n++;
          const sebelum = src.slice(Math.max(0, m.index! - 260), m.index!);
          c.expect(/adaBuktiSoal\([^)]*\)|perSoal\b/.test(sebelum) && (!/perSoal\b/.test(sebelum) || /const perSoal = adaBuktiSoal\(/.test(src)),
            `${rel}: «Lihat per soal» offered without the page's own rule (adaBuktiSoal)`);
        }
      }
      c.expect(n >= 4, `${n} link(s) to the per-question page found; expected the class page's and the Uji Cepat's`);
      return c.verdict(`reads the source of every .tsx file under src/app and src/components: each of the ${n} links to the per-question page is offered under adaBuktiSoal, the rule the page refuses by, so no class kind is offered a link into a refusal`);
    },
  },
];
