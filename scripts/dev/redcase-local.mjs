#!/usr/bin/env node
/**
 * RED-CASE, LOCALLY — CI's `red-case` job run on this machine before CI is dispatched (THE PLAN §4.1 P2.3).
 *
 * `scripts/dev/plants.mjs` runs the planted defects declared in `selftest/plants/plants.json`. The `red-case` job in
 * `.github/workflows/ci.yml` also carries planted defects written inline, and static defects injected into the tree;
 * until now those ran only in CI, so a batch that moved a function learned of a broken plant an hour later.
 *
 * This runner reads the job from ci.yml itself (one definition, nothing copied), and for each matrix group:
 *   - resets a private git worktree of HEAD (so injected files and scratch output never touch your tree);
 *   - runs every step whose `if` names one of the group's cases, in order;
 *   - a `./.github/actions/local-stack` step becomes `supabase db reset --local` in that worktree (after an injected
 *     migration, the reset applies it, as CI's stack does);
 *   - `${{ matrix.cases }}` / `${{ matrix.group }}` are the group's; `${{ steps.*.outputs.db-url }}` is the local DB.
 * It ends with a fresh reset so the local database is left clean.
 *
 *   node scripts/dev/redcase-local.mjs [--group=SUBSTRING] [--ref=COMMIT] [--db-url=URL]
 *
 * --ref runs the job as it stands at another commit (default HEAD), from that commit's own ci.yml and tree.
 *
 * Needs: the local Supabase stack running, `node_modules` installed in this checkout. Exit 0 only if every step of
 * every selected group succeeded.
 */
import { existsSync, symlinkSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const repo = resolve(new URL("../..", import.meta.url).pathname);
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=").slice(1).join("=");
const DB = arg("db-url") || process.env.DB_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const only = arg("group");
const { default: yaml } = await import(join(repo, "node_modules/js-yaml/index.js"));
const ref0 = arg("ref") || "HEAD";
const job = yaml.load(spawnSync("git", ["show", `${ref0}:.github/workflows/ci.yml`], { cwd: repo, encoding: "utf8", maxBuffer: 64 << 20 }).stdout).jobs["red-case"];
const groups = job.strategy.matrix.include.filter((g) => !only || g.group.includes(only));

const sh = (cmd, cwd, env = process.env) => spawnSync("bash", ["-e", "-o", "pipefail", "-c", cmd], { cwd, env, encoding: "utf8", maxBuffer: 256 << 20 });
const wt = join(tmpdir(), `pintar-redcase-${process.pid}`);
const head = sh(`git rev-parse ${arg("ref") || "HEAD"}`, repo).stdout.trim();
sh(`git worktree add --detach ${wt} ${head}`, repo);
if (!existsSync(join(wt, "node_modules"))) symlinkSync(join(repo, "node_modules"), join(wt, "node_modules"));
const reset = () => sh("npx --no-install supabase db reset --local", wt);

let failed = 0;
try {
  for (const g of groups) {
    sh("git checkout -q -- . && git clean -qfd -e node_modules", wt);
    const cases = g.cases;
    const steps = job.steps.filter((s) => {
      const m = /contains\(matrix\.cases, '( [^']+ )'\)/.exec(s.if || "");
      return m ? cases.includes(m[1]) : !s.uses && s.run && s.name === "Inject the deliberate defect";
    });
    let ok = true;
    for (const s of steps) {
      if (s.uses) {
        if (!s.uses.includes("local-stack")) continue;
        const r = reset();
        console.log(`  ${r.status === 0 ? "ok  " : "FAIL"} ${s.name} (supabase db reset --local)`);
        if (r.status !== 0) { ok = false; console.log(`  RESET FAILED (${s.name})\n${(r.stdout + r.stderr).slice(-800)}`); break; }
        continue;
      }
      const script = s.run
        .replace(/\$\{\{\s*matrix\.cases\s*\}\}/g, cases)
        .replace(/\$\{\{\s*matrix\.group\s*\}\}/g, g.group)
        .replace(/\$\{\{[^}]*db-url[^}]*\}\}/g, DB)
        .replace(/\$\{\{[^}]*\}\}/g, "");
      const env = { ...process.env, DB_URL: DB, SUPABASE_DB_URL: DB };
      for (const [k, v] of Object.entries(s.env || {})) env[k] = typeof v === "string" && v.includes("${{") ? (v.includes("db-url") ? DB : "") : String(v);
      const r = sh(script, wt, env);
      console.log(`  ${r.status === 0 ? "ok  " : "FAIL"} ${s.name}`);
      if (r.status !== 0) {
        ok = false;
        const why = (r.stdout + r.stderr).split("\n").filter((l) => /::error::|stayed green|went red but not|did not|would not apply|ERROR/.test(l)).slice(-8);
        console.log(`    ${why.join("\n    ")}`);
      }
    }
    console.log(`${ok ? "OK  " : "FAIL"} ${g.group}`);
    if (!ok) failed++;
  }
} finally {
  reset();
  sh(`git worktree remove --force ${wt}`, repo);
  rmSync(wt, { recursive: true, force: true });
}
console.log(failed ? `${failed} group(s) failed` : `all ${groups.length} red-case group(s) passed on ${head.slice(0, 8)}`);
process.exit(failed ? 1 : 0);
