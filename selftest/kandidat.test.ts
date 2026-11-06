/**
 * THE JOURNEYS AUDIT THE EXACT CANDIDATE, AND THE PROMOTION MATCHES IT (6 Nov).
 *
 * audit-journeys.yml audited its `ref` input, which defaulted to `main`. Two runs dispatched without it (42179347500,
 * 42198619759) audited an older main while they were read as the candidate's, so W9.19 reached staging without its
 * journeys ever running on it.
 *
 *   KANDIDAT-SHA-01  .github/workflows/audit-journeys.yml: `ref` is required with no default; RELEASE_SHA comes from it
 *                    alone; both jobs' «Check out the candidate» refuse anything but a full 40-character SHA, refuse a
 *                    checkout that is not that commit, and record it (audit-out/AUDITED_SHA, the job summary); a planted
 *                    default and a planted branch fallback are each caught.
 *   KANDIDAT-SHA-02  scripts/release/kandidat-sama.sh, executed on a scratch repository: the same commit, and a merge
 *                    commit carrying the audited tree, are SAME (exit 0); a commit with other content is DIFFERENT
 *                    (exit 1); a short SHA or a branch name is refused (exit 2).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

function periksaAlur(src: string) {
  const masukan = src.match(/workflow_dispatch:\s*\n\s*inputs:\s*\n\s*ref:\s*\n([\s\S]*?)\n\s{6}\w+:/)?.[1] ?? "";
  const langkah = src.split("- name: Check out the candidate").slice(1).map((b) => b.split("\n      - ")[0]);
  return {
    wajib: /required:\s*true/.test(masukan) && !/^\s*default:/m.test(masukan),
    env: /\n\s+RELEASE_SHA: \$\{\{ inputs\.ref \}\}\n/.test(src),
    duaLangkah: langkah.length === 2,
    tiapLangkah: langkah.length === 2 && langkah.every((b) =>
      b.includes("^[0-9a-f]{40}$") && /\[ "\$AUDITED" = "\$RELEASE_SHA" \]/.test(b) && b.includes("audit-out/AUDITED_SHA")
      && b.includes("GITHUB_STEP_SUMMARY") && !b.includes("origin/$RELEASE_SHA")),
  };
}

export const kandidatTests: SelfTest[] = [
  {
    id: "KANDIDAT-SHA-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const src = readFileSync(join(repoRoot, ".github", "workflows", "audit-journeys.yml"), "utf8");
      const r = periksaAlur(src);
      c.expect(r.wajib, "audit-journeys.yml's `ref` is not required, or still has a default");
      c.expect(r.env, "RELEASE_SHA is not taken from inputs.ref alone (a fallback revision remains)");
      c.expect(r.duaLangkah, "audit-journeys.yml does not have exactly two «Check out the candidate» steps");
      c.expect(r.tiapLangkah, "a «Check out the candidate» step does not refuse a non-SHA, verify the checkout, and record the audited commit");
      const tanamDefault = periksaAlur(src.replace("        required: true", "        required: false\n        default: \"main\""));
      c.expect(!tanamDefault.wajib, "a planted default `main` is not caught");
      const tanamCabang = periksaAlur(src.replace('git -C app checkout --quiet --detach "$RELEASE_SHA"',
        'git -C app checkout --quiet --detach "$RELEASE_SHA" 2>/dev/null || git -C app checkout --quiet --detach "origin/$RELEASE_SHA"'));
      c.expect(!tanamCabang.tiapLangkah, "a planted branch fallback in the checkout is not caught");
      return c.verdict("audit-journeys.yml takes the candidate as a required full SHA with no default; both jobs refuse anything else, verify the checkout is that commit and record it (audit-out/AUDITED_SHA, the job summary); a planted default and a planted branch fallback are caught");
    },
  },
  {
    id: "KANDIDAT-SHA-02",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const skrip = join(repoRoot, "scripts", "release", "kandidat-sama.sh");
      const d = mkdtempSync(join(tmpdir(), "kandidat-"));
      const git = (...a: string[]) => execFileSync("git", ["-C", d, ...a], { encoding: "utf8",
        env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@contoh.test", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@contoh.test" } }).trim();
      git("init", "-q");
      writeFileSync(join(d, "a.txt"), "dasar\n"); git("add", "."); git("commit", "-qm", "dasar");
      const dasar = git("rev-parse", "HEAD");
      writeFileSync(join(d, "a.txt"), "kandidat\n"); git("commit", "-qam", "kandidat");
      const kandidat = git("rev-parse", "HEAD");
      // a merge commit onto the base that carries the candidate's tree exactly, as a merge of a PR whose head contains its base does
      const gabung = git("commit-tree", `${kandidat}^{tree}`, "-p", dasar, "-p", kandidat, "-m", "gabung");
      const jalan = (a: string, b: string) => spawnSync("bash", [skrip, a, b], { cwd: d, encoding: "utf8" }).status;
      c.expect(jalan(kandidat, kandidat) === 0, "the same commit is not SAME");
      c.expect(jalan(kandidat, gabung) === 0, "a merge commit carrying the audited tree is not SAME");
      c.expect(jalan(kandidat, dasar) === 1, "a commit with other content is not DIFFERENT");
      c.expect(jalan(kandidat.slice(0, 8), gabung) === 2, "a short SHA is not refused");
      c.expect(jalan("main", gabung) === 2, "a branch name is not refused");
      return c.verdict("kandidat-sama.sh on a scratch repository: the same commit and a merge commit carrying the audited tree are SAME; other content is DIFFERENT; a short SHA and a branch name are refused");
    },
  },
];
