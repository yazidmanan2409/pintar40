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
];