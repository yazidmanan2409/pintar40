/**
 * The retrospective integrity audit of Batches 0–6 (docs/completion-4.0/retrospektif/): regressions for what it found
 * claimed but unguarded, or never closed. Each test names its register row.
 *
 *   R0-PIN-01  (R0-1, W0.2) every workflow job that installs or launches a browser runs on ubuntu-24.04: Playwright 1.55
 *              has no browser build for ubuntu-latest (26.04; run 41377378758). Batch 0 pinned seventeen jobs; nothing
 *              held a new job to it, so a walk added on ubuntu-latest would fail only when CI first ran it.
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
];
