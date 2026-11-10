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
import { existsSync, readFileSync, readdirSync } from "node:fs";
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

const PERAMBAN = /playwright install|chromium\.launch|node (?:crawl|journey|studio-ujung|admin-ujung|b5-ujung|b6-cetak|b5-fokus|e1-navigasi|d1-email|rb-ujung|c12)\.mjs/;

/** Every .tsx file under a directory, recursively. */
function tsx(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? tsx(join(dir, e.name)) : e.name.endsWith(".tsx") ? [join(dir, e.name)] : []);
}

// a job's runs-on pins Ubuntu 24.04: GitHub's ubuntu-24.04 image, or a self-hosted machine labelled ubuntu-24.04
function diPin2404(nilai: string): boolean {
  if (nilai === "ubuntu-24.04") return true;
  const daftar = /^\[(.*)\]$/.exec(nilai)?.[1]?.split(",").map((x) => x.trim().replace(/^["']|["']$/g, ""));
  return Boolean(daftar && daftar.includes("self-hosted") && daftar.includes("ubuntu-24.04"));
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
          const runsOn = [...j.isi.matchAll(/^\s+runs-on:\s*(.+?)\s*$/gm)].map((m) => m[1]);
          c.expect(runsOn.length === 1 && diPin2404(runsOn[0]), `${f} › ${j.nama} drives a browser on ${runsOn.join(", ") || "no runner"}, not ubuntu-24.04`);
        }
      }
      c.expect(dilihat >= 17, `only ${dilihat} browser job(s) found; Batch 0 pinned 17`);
      // the check itself catches a planted job on ubuntu-latest
      const tanam = jobsAlurKerja("on: push\njobs:\n  walk:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npx playwright install chromium\n");
      c.expect(tanam.length === 1 && PERAMBAN.test(tanam[0].isi) && /runs-on:\s*ubuntu-latest/.test(tanam[0].isi), "the check cannot see a planted browser job on ubuntu-latest");
      // W6.2/W6.8 (owner, 8 Nov: a measurement from Indonesia): a self-hosted machine counts only when it is labelled
      // ubuntu-24.04 too, i.e. registered on an Ubuntu 24.04 host; a self-hosted label list without it is refused
      c.expect(diPin2404("[self-hosted, indonesia, ubuntu-24.04]") && !diPin2404("[self-hosted, indonesia]")
        && !diPin2404("ubuntu-latest") && !diPin2404("[ubuntu-latest, ubuntu-24.04]"), "the check accepts a self-hosted job without ubuntu-24.04, or a hosted list");
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
      // restated stronger (reverse reconciliation, E2 #7 P13): the scan above read one class name, so an empty sentence
      // in any other element escaped it (the chooser's «entry.kosong», Ringkasan, Konfigurasi, the certificate list).
      // Every element that draws an empty sentence (a key with «kosong») is the Empty state, or declared here
      const SEBARIS: Record<string, string> = {
        "src/app/belajar/page.tsx#pembelajaran.kosong_arti": "the second line under a Kosong: what would fill it",
        "src/app/studio/paket/[course]/page.tsx#studio.soal.kosong": "A1: an empty lesson opened from the jump shows its title and this line (A1 §states)",
        "src/components/struktur/PanelStruktur.tsx#config.struktur.kosong": "imported outside Next by its tests (experience): no next/link",
        "src/components/bukti/KeadaanHariIni.tsx#mengajar.bukti.kosong": "imported outside Next by its tests (W8-K01)",
        "src/components/koleksi/Koleksi.tsx#koleksi.kosong.kueri": "inside the Collection's own empty state: what was searched",
        "src/components/PemilihLingkup.tsx#lingkup.kosong": "a selector's status where its options would be, not a page's empty",
      };
      let sebaris = 0;
      for (const f of [...tsx(join(repoRoot, "src", "app")), ...tsx(join(repoRoot, "src", "components"))]) {
        const rel = f.slice(repoRoot.length + 1).replace(/\\/g, "/");
        const src = readFileSync(f, "utf8");
        for (const m of src.matchAll(/<(?:p|div|span)\b[^>]*>\{(?:s|sl|t)\("([a-z0-9_.]*kosong[a-z0-9_.]*)"/g)) {
          sebaris++;
          c.expect(`${rel}#${m[1]}` in SEBARIS, `${rel}: «${m[1]}» drawn as a bare line, not the Empty state (Kosong) and not declared`);
        }
      }
      c.expect(sebaris <= Object.keys(SEBARIS).length + 1, `${sebaris} bare empty sentences found; ${Object.keys(SEBARIS).length} are declared`);
      // a package that is not there, or not the reader's, is refused, never said as empty (Kosong's rule)
      const paketHal = readFileSync(join(repoRoot, "src/app/studio/paket/[course]/page.tsx"), "utf8");
      c.expect(/if \(!course\) \{[\s\S]{0,300}?return <HalamanPenolakan locale=\{locale\} persona="staff" backHref="\/studio" backKey="studio\.nav\.beranda" \/>;/.test(paketHal),
        "a package that cannot be read is said as «Belum ada paket di sini.», an empty state standing for a refusal");
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
      // restated (reverse reconciliation, X-KONSISTENSI K6, accepted under D-173): the pager's words are P9's own,
      // «Sebelumnya» / «Berikutnya» (koleksi.*); A1's «Pelajaran sebelumnya / berikutnya» keys were withdrawn, and the
      // position line keeps the unit («Pelajaran 3 dari 4»)
      c.expect(/sl\(arah === "sebelum" \? "koleksi\.sebelumnya" : "koleksi\.berikutnya"\)/.test(bag) && /studio\.soal\.pelajaran_dari/.test(bag) && /aria-disabled="true"/.test(bag),
        "the pager does not use the one pager's words (P9, K6), keep the unit in its position line, or keep a disabled end");
      c.expect(!/"studio\.soal\.(?:sebelumnya|berikutnya)"/.test(readFileSync(join(repoRoot, "src/lib/hle.ts"), "utf8")), "the withdrawn keys studio.soal.sebelumnya / .berikutnya remain (K6)");
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
      // A2 (D-170(a)), both languages (E-RB-4)
      c.expect(k("mengajar.cepat.hasil.kelas", "id") === "Rata-rata nilai kelas", `(id) mengajar.cepat.hasil.kelas reads «${k("mengajar.cepat.hasil.kelas", "id")}»`);
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
      // A5 C6 (reverse reconciliation): a filtered Bank Soal with nothing left is the Collection's own empty state, with
      // its one way back «Hapus pencarian dan saringan» (koleksi.kosong.reset), no new key; unfiltered, «not yet»
      const bank = readFileSync(join(repoRoot, "src/app/studio/bank/page.tsx"), "utf8");
      c.expect(/<Kosong jenis="tidak_cocok" kalimat=\{s\("koleksi\.kosong\.judul"\)\.replace\("\{benda\}", s\("studio\.soal\.jumlah"\)\)\}\s*aksi=\{\{ href: "\/studio\/bank", label: s\("koleksi\.kosong\.reset"\) \}\} \/>/.test(bank),
        "a filtered empty Bank Soal offers no «Hapus pencarian dan saringan» (A5 C6)");
      // B1 (D-166(a)) «No environment row: the «Lingkungan» panel is omitted, never «—»» (reverse reconciliation)
      const konf = readFileSync(join(repoRoot, "src/app/konfigurasi/page.tsx"), "utf8");
      c.expect(!/env\?\.environment \?\? "—"/.test(konf) && /\{env\?\.environment \? \(\s*<div className=\{card\}>/.test(konf),
        "with no environment row Konfigurasi draws «Lingkungan —» instead of omitting the panel (B1)");
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
  {
    id: "R-PROSES-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      /**
       * D-178(e): THE PROCESS CORRECTION, MADE MECHANICAL. The retrospective found the gaps escaped one way: an
       * accepted design, ruling or hand-off with no engineering line, or an «[auto]» acceptance line with no test.
       * So every engineering item in the design hand-off list (06-ENGINEERING-ITEMS-FROM-DESIGN.md) must be
       *   (a) named by a test (its id in the manifest, a test file or a walk, «E-C2-1/2/3» counting for each), or
       *   (b) held by named tests or files on its own row («**Held by:**» then backticked manifest ids or paths), or
       *   (c) blocked on its row («**BLOCKED:**» then who decides).
       * An item that is none of these is a design accepted and not held: the A1 and A5 case.
       */
      const daftar = readFileSync(join(repoRoot, "docs/completion-4.0/daisy-design-completion/06-ENGINEERING-ITEMS-FROM-DESIGN.md"), "utf8");
      const manifest = readFileSync(join(repoRoot, "selftest/manifest.json"), "utf8");
      const ids = new Set((JSON.parse(manifest) as { tests: Array<{ id: string }> }).tests.map((x) => x.id));
      const uji = [manifest, ...readdirSync(join(repoRoot, "selftest")).filter((f) => f.endsWith(".ts")).map((f) => readFileSync(join(repoRoot, "selftest", f), "utf8")),
        ...readdirSync(join(repoRoot, "audit")).filter((f) => f.endsWith(".mjs")).map((f) => readFileSync(join(repoRoot, "audit", f), "utf8"))].join("\n");
      // every id a test names, with the shorthand «E-C2-1/2/3» and «E-A3-1/2» expanded
      const disebut = new Set<string>();
      for (const m of uji.matchAll(/\bE-([A-Z0-9]+)-(\d+(?:\/\d+)*)/g)) for (const n of m[2].split("/")) disebut.add(`E-${m[1]}-${n}`);
      for (const m of uji.matchAll(/\bE-([A-Z][A-Z0-9-]*[A-Z0-9])\b/g)) disebut.add(`E-${m[1]}`);
      const baris = [...daftar.matchAll(/^\| (E-[A-Z0-9]+(?:-[A-Z0-9]+)?)(?: \/ (E-[A-Z0-9]+(?:-[A-Z0-9]+)?))? \|(.*)$/gm)];
      c.expect(baris.length >= 25, `only ${baris.length} engineering items read`);
      const lepas: string[] = [];
      for (const m of baris) {
        const isi = m[3];
        const tertahan = /\*\*BLOCKED:\*\*\s*\S/.test(isi);
        const dipegang = /\*\*Held by:\*\*/.test(isi) && (() => {
          const nama = [...isi.slice(isi.indexOf("**Held by:**")).matchAll(/`([^`]+)`/g)].map((x) => x[1]);
          return nama.length > 0 && nama.every((x) => ids.has(x) || existsSync(join(repoRoot, x)));
        })();
        for (const id of [m[1], m[2]].filter(Boolean) as string[]) if (!disebut.has(id) && !dipegang && !tertahan) lepas.push(id);
      }
      c.expect(lepas.length === 0, `engineering items held by no test, no named holder and no named blocker: ${lepas.join(", ")}`);

      // D-180 (2): every obligation says where it is implemented: a path on its row, or a src/ or supabase/ path in
      // the proves of a test that names it or holds it; or it is blocked
      const uji2 = JSON.parse(manifest) as { tests: Array<{ id: string; proves?: string }> };
      const jalurAda = (t: string) => [...t.matchAll(/\b((?:src|supabase)\/[\w\[\]().@-]+(?:\/[\w\[\]().@-]+)*)/g)].some((x) => existsSync(join(repoRoot, x[1].replace(/[).,;:]+$/, ""))));
      const tanpaTempat: string[] = [];
      for (const m of baris) {
        const isi = m[3];
        if (/\*\*BLOCKED:\*\*\s*\S/.test(isi) && !/\*\*Implemented in:\*\*/.test(isi) && !/\*\*Held by:\*\*/.test(isi)) continue;
        const nama = (m[2] ? [m[1], m[2]] : [m[1]]) as string[];
        const pemegang = new Set([...isi.matchAll(/`([^`]+)`/g)].map((x) => x[1]).filter((x) => ids.has(x)));
        for (const t of uji2.tests) if (nama.some((x) => new RegExp(`\\b${x}\\b`).test(t.proves ?? ""))) pemegang.add(t.id);
        const ada = jalurAda(isi) || uji2.tests.some((t) => pemegang.has(t.id) && jalurAda(t.proves ?? ""));
        if (!ada) tanpaTempat.push(nama.join(" / "));
      }
      c.expect(tanpaTempat.length === 0, `obligations with no traceable implementation (no path on the row or in a holding test's proves): ${tanpaTempat.join(", ")}`);

      // D-179(e), the other direction: every ruling from D-166 on (design acceptance after batch closure) is
      // reconciled in the list's «Rulings reconciled» table, the day it is made, to the obligations that carry it,
      // or says why it carries none; every obligation the table names is a row of the list
      const keputusan = readFileSync(join(repoRoot, "docs/coordination/DECISIONS.md"), "utf8");
      const putusan = [...new Set([...keputusan.matchAll(/^\| \*\*D-(\d{3})\*\* \|/gm)].map((x) => Number(x[1])).filter((n) => n >= 166))];
      const tabel = new Map([...daftar.matchAll(/^\| D-(\d{3}) \| [^|]+ \| ([^|]+) \|\s*$/gm)].map((x) => [Number(x[1]), x[2]]));
      const kewajiban = new Set(baris.flatMap((m) => [m[1], m[2]].filter(Boolean) as string[]));
      c.expect(putusan.length >= 14, `only ${putusan.length} rulings from D-166 read`);
      const tanpa = putusan.filter((n) => !tabel.has(n));
      c.expect(tanpa.length === 0, `rulings not reconciled to an obligation: ${tanpa.map((n) => `D-${n}`).join(", ")}`);
      for (const [n, isi] of tabel) {
        const sebut = [...isi.matchAll(/\bE-([A-Z0-9]+)-(\d+)\b|\bE-(K-ALL|P15|P17|K\d+)\b/g)].map((x) => x[3] ? `E-${x[3]}` : `E-${x[1]}-${x[2]}`);
        c.expect(sebut.length > 0 || /\bnone\b|BLOCKED/.test(isi), `D-${n} names no obligation and no reason for none`);
        const hilang = sebut.filter((x) => !kewajiban.has(x) && !(x === "E-P15" || x === "E-P17") );
        c.expect(hilang.length === 0, `D-${n} names obligations the list does not hold: ${hilang.join(", ")}`);
      }

      // E-P17: no disclosure around required content. Each disclosure on a screen is declared with what it holds;
      // a new one must be declared here, which is the review the rule asks for
      const BOLEH: Record<string, string | string[]> = {
        "src/app/konfigurasi/page.tsx": ["a mastery mark's change history, under its current value",
          // K1 (Daisy, TINJAUAN-KENAIKAN-KELAS-DIBANGUN; Sharon «fold, don't hide»): the row states the run and its count
          "a year-end run's learners and their decisions in Jejak audit, under the run's one row that states how many",
          // Daisy (435a2856, §4.4.3; Sharon «fold, don't hide»): the run's own other rows, counted in the summary, openable
          "a year-end run's related entries (enrolments ended and opened), under the run's row that counts them"],
        // Q2 (Daisy, the same review): the exceptions are always shown and the count is in the summary line
        "src/components/kenaikan/KenaikanKelas.tsx": ["the review's main group's names, under its count; every exception is always shown",
          // Daisy (435a2856, §4.3): the outcome laid out as the review
          "the outcome's main group's names with what PINTAR recorded, under its count; every exception is always shown"],
        // Daisy (435a2856, §1.1): what has ended, below the working list; nothing in it can be acted on
        "src/app/mengajar/[kelas]/page.tsx": "the class's ended and withdrawn assignments with when and why, under the working list; none can be acted on",
        "src/app/pimpinan/page.tsx": "one class's evidence, a drill-down under the node's figures",
        "src/app/belajar/[tugas]/hasil/page.tsx": "an answered question's review; a wrong safety-critical one opens itself",
        "src/app/studio/bank/page.tsx": "a finding's locations, under the finding",
        "src/app/studio/unggah/page.tsx": "the guide for another system's export, beside the main path",
        "src/components/studio/TemuanKelompok.tsx": "a group of findings' locations, under the group",
      };
      const ada = new Map<string, number>();
      for (const f of [...tsx(join(repoRoot, "src", "app")), ...tsx(join(repoRoot, "src", "components"))]) {
        const rel = f.slice(repoRoot.length + 1).replace(/\\/g, "/");
        const n = (readFileSync(f, "utf8").match(/<details\b/g) ?? []).length;
        if (n > 0) ada.set(rel, n);
      }
      for (const [f, n] of ada) c.expect(f in BOLEH && n === [BOLEH[f]].flat().length, `${f}: ${n} disclosure(s) not declared (E-P17: no disclosure around required content)`);
      for (const f of Object.keys(BOLEH)) c.expect(ada.has(f), `${f} is declared but draws no disclosure: remove its line`);
      return c.verdict(`reads the decision log (DECISIONS.md), the design hand-off list (06-ENGINEERING-ITEMS-FROM-DESIGN.md), the manifest, every test file and every walk: each of the ${putusan.length} rulings from D-166 is reconciled to the obligations that carry it (or why none); each of the ${baris.length} engineering items is named by a test, held by named tests or files, or blocked on a named decider, and says where it is implemented (D-180); and every disclosure under src/app and src/components (${ada.size}) is declared with what it holds (E-P17)`);
    },
  },
  {
    id: "R3-LENCANA-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      /**
       * Reverse reconciliation (A5 C1 and D9, RV-20, W3.17): A ROW'S BADGE IS SHOWN ONCE, AT EVERY WIDTH. One rule hid
       * every badge in a row's meta line above 560 px, as if each were the narrow copy of the row's own badge. Only
       * Studio's home draws such a copy; every other meta-line badge is the only one its row has. So the learner's
       * lesson status (/belajar/[tugas]) and Studio's «Dikembalikan ke penyusun» were never shown on a wide screen, and
       * at 560 px and under, Studio's rows showed their badge twice (the RV-20 rule re-showed the original).
       */
      const css = readFileSync(join(repoRoot, "src/app/experience.css"), "utf8");
      c.expect(!/\.pin-row \.pin-rowmeta \.pin-pill \{ display: none; \}/.test(css), "every badge in a row's meta line is hidden on a wide screen");
      c.expect(/\.pin-row \.pin-rowmeta \.pin-pill\[data-salinan-sempit\] \{ display: none; \}/.test(css), "the narrow copy is not hidden on a wide screen");
      c.expect(/\.pin-row:has\(\.pin-rowmeta \.pin-pill\[data-salinan-sempit\]\) > \.pin-pill \{ display: none; \}/.test(css), "under 560 px a row with a narrow copy still shows its own badge too");
      const beranda = readFileSync(join(repoRoot, "src/app/studio/page.tsx"), "utf8");
      c.expect(/const lencana = \(sempit: boolean\) =>/.test(beranda) && /\{lencana\(true\)\}/.test(beranda) && /\{lencana\(false\)\}/.test(beranda) && /data-salinan-sempit=\{sempit \? "" : undefined\}/.test(beranda),
        "Studio's home does not mark its narrow copy of a row's badge");
      return c.verdict("reads the stylesheet src/app/experience.css and the source of Studio's home: only a marked narrow copy of a row's badge is hidden on a wide screen, and under 560 px a row with one hides its original, so every meta-line badge (the learner's lesson status, «Dikembalikan ke penyusun») shows at every width and no badge shows twice; walked in audit/studio-ujung.mjs U5");
    },
  },
  {
    id: "R3-PESERTA-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      /**
       * Reverse reconciliation (E-A3-1, D-168): THE «HOW FAR» LINE NAMES THE PLACE'S PEOPLE ON EVERY SURFACE. The key and
       * the helper took the place's kind (kalimatJumlah(…, jenis)), but Ringkasan Kelas never passed it, so a professional-
       * learning class read «Sekarang 2 murid; perlu 5.» on its own report. The school report covers a whole school
       * (no one kind), so it keeps the default.
       */
      const { kalimatJumlahOrang } = await import("../src/components/bukti/KartuKetiadaan");
      c.expect(/peserta/.test(kalimatJumlahOrang(2, 5, "PARTICIPANT", "id")) && /murid/.test(kalimatJumlahOrang(2, 5, "LEARNER", "id")),
        "the shared line does not name participants for a professional-learning place");
      // CONTOH LAPORAN (approved 7 Nov): the page reads the kind and hands it to its composition, which draws the line
      const kelas = readFileSync(join(repoRoot, "src/app/edukator/ringkasan/page.tsx"), "utf8") + readFileSync(join(repoRoot, "src/components/laporan/KomposisiKelas.tsx"), "utf8");
      c.expect(/from\("org_nodes"\)\.select\("institution_id, member_kind"\)\.eq\("id", kelas\)/.test(kelas) && /jenis = jenisAnggota\(/.test(kelas)
        && /kalimatJumlah\(e, locale, untuk, jenis\)/.test(kelas) && !/kalimatJumlah\(e, locale, untuk\)/.test(kelas),
        "Ringkasan Kelas does not pass its class's kind to the «how far» line");
      return c.verdict("executes the shared «how far» line (kalimatJumlahOrang) for both kinds, and reads the source of Ringkasan Kelas (src/app/edukator/ringkasan/page.tsx): it reads its class's kind under the reader's own access and passes it, so a professional-learning class says «peserta»");
    },
  },
  {
    id: "R5-CETAK-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      /**
       * Reverse reconciliation (C1 Part B A4; B1 §2; W3.22): ON PAPER, A PAGE PRINTS ITS CONTENT, NOT ITS NAVIGATION OR
       * ITS FORMS. The shell and the skip link were kept off paper, but the back link was not: 35 «← …» links printed,
       * and a Konfigurasi comment wrongly said they already did. Management's decision forms printed too.
       */
      const css = readFileSync(join(repoRoot, "src/app/experience.css"), "utf8");
      c.expect(/@media print \{\s*\.pin-back \{ display: none !important; \}/.test(css), "a back link prints (navigation is never on paper)");
      const kartu = readFileSync(join(repoRoot, "src/components/pimpinan/KartuKeputusan.tsx"), "utf8");
      const form = [...kartu.matchAll(/<form\b[^>]*>/g)].map((m) => m[0]);
      c.expect(form.length >= 2 && form.every((f) => /pin-noprint/.test(f)), `Management's decision forms print: ${form.filter((f) => !/pin-noprint/.test(f)).join(" ")}`);
      const walk = readFileSync(join(repoRoot, "audit/b6-cetak.mjs"), "utf8");
      c.expect(/"\[data-menu-bagian\]", "\.pin-back"\]/.test(walk), "the print walk does not check that the back link stays off paper");
      return c.verdict("reads the stylesheet src/app/experience.css, src/components/pimpinan/KartuKeputusan.tsx and the print walk audit/b6-cetak.mjs: every back link (.pin-back) stays off paper by one rule, Management's decision forms are pin-noprint, and the walk checks the back link on every page it prints");
    },
  },
  {
    id: "R3-A2-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      /**
       * Reverse reconciliation (A2 K4 and K6, accepted D-170(a)): THE UJI CEPAT RESULT READS AS DAISY ACCEPTED IT. The base
       * («n dari N murid sudah dinilai») sits directly under the figure at body size in ink-1, not in the shared metric
       * panel's 14 px ink-2 meta line; «Rincian nilai» is the page's h2 in t-section, not drawn as the section eyebrow.
       * Scoped to this panel: the shared .pin-metric keeps its meta line for every other figure.
       */
      const css = readFileSync(join(repoRoot, "src/app/experience.css"), "utf8");
      c.expect(/\.pin-cepat-kelas \.pin-mm \{ font-size: var\(--t-body\); line-height: var\(--t-body-lh\); color: var\(--ink-1\); \}/.test(css), "the class figure's base is not at body size in ink-1 (A2 K4)");
      c.expect(/\.pin-sec > h2\.pin-cepat-rincian-judul \{[^}]*font-size: var\(--t-section\);[^}]*text-transform: none;[^}]*color: var\(--ink-1\);/.test(css), "«Rincian nilai» is still drawn as an eyebrow (A2 K6)");
      const hal = readFileSync(join(repoRoot, "src/app/mengajar/[kelas]/uji-cepat/hasil/page.tsx"), "utf8");
      c.expect(/<h2 id="pin-cepat-rincian" className="pin-cepat-rincian-judul">\{s\("mengajar\.cepat\.hasil\.rincian"\)\}<\/h2>/.test(hal), "«Rincian nilai» is not the section heading A2 K6 names");
      const iFig = hal.indexOf('className="pin-mv pin-num"'), iBase = hal.indexOf('"mengajar.cepat.hasil.dasar"', iFig);
      c.expect(iFig > 0 && iBase > iFig && hal.slice(iFig, iBase).split("<span").length <= 3, "the base is not directly under the figure");
      return c.verdict("reads the stylesheet src/app/experience.css and the source of src/app/mengajar/[kelas]/uji-cepat/hasil/page.tsx: the class figure's base sits directly under it at body size in ink-1, and «Rincian nilai» is the section's h2 in t-section, as A2 K4 and K6 were accepted");
    },
  },
];
