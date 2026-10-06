/**
 * THE CI EFFICIENCY GATE (owner, 6 Oct): less waste, never less assurance.
 *
 *  CI-W01  audit/ci/actions-spend.mjs, executed on jobs shaped as GitHub's API returns them. A job that never got a
 *          runner (no runner, no step), like the 77 of 5 Oct, counts as queue time and costs nothing, where the old
 *          measure counted its 26 minutes of waiting as 26 billed minutes. A job that ran counts its runner minutes,
 *          rounded up per job for the estimate, and its wait before the runner as queue. A cancelled job that had
 *          started counts as cancelled after start. Skipped jobs count for nothing. The waste alarm is red, whatever
 *          the cost:
 *          - at 10 jobs that never started (not at 9);
 *          - at a wait over 15 minutes;
 *          - at a third attempt;
 *          - at one commit run twice.
 *          The cost alarm is red over the budget only.
 *  CI-W02  audit/ci/proof-reuse.mjs and .github/workflows/ci.yml (D-119), that neither guard can make CI falsely green or
 *          falsely proven:
 *          - "the same code" is only inert documents in the unread folders (or the staging request files); a code file is never
 *            unread, wherever it lies (tsconfig compiles **\/*.mts, lint reads every script), and a rename counts as both paths;
 *          - reuse needs a recent, successful run on a branch whose strict selftest ran, never main, a failed, cancelled or
 *            skipped-proof run, an old one, or a commit outside the history;
 *          - starvation is a queued job of another run over 10 minutes old;
 *          - DEFERRED (starved) and ALREADY PROVEN both cancel the run, and a cancellation that fails ends in failure, so
 *            neither is ever success;
 *          - nothing CI executes reads the unread paths;
 *          - ci.yml runs the guard first and the cheap gate before the expensive jobs, caps the red cases at 15, supersedes per
 *            branch, filters exactly the inert unread documents, and ends in a verdict that fails unless every job succeeded.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { Checks, type SelfTest } from "./lib";

type Job = Record<string, unknown>;
const at = (hhmmss: string) => `2026-10-05T${hhmmss}Z`;
const ran = (name: string, created: string, start: string, end: string, conclusion = "success"): Job => ({
  name, created_at: at(created), started_at: at(start), completed_at: at(end), conclusion,
  runner_name: "GitHub Actions 1000007516", steps: [{ name: "Set up job", started_at: at(start) }],
});
const neverRan = (name: string, created: string, end: string): Job => ({
  name, created_at: at(created), started_at: at(created), completed_at: at(end), conclusion: "cancelled", runner_name: "", steps: [],
});

export const ciwasteTests: SelfTest[] = [
  {
    id: "CI-W01",
    run: async (ctx) => {
      const c = new Checks();
      const m = await import(pathToFileURL(join(ctx.repoRoot, "audit/ci/actions-spend.mjs")).href);
      c.expect(typeof m.classify === "function" && typeof m.judge === "function",
        "actions-spend.mjs exports no classify/judge: it still counts every job's start-to-end time as billed");
      if (typeof m.classify !== "function") return c.verdict("");

      // the 5 Oct shape: queued at 19:30:23, no runner, cancelled at its timeout 26 minutes later
      const starved = m.classify(neverRan("red case · db-wp7-gates", "19:30:23", "19:56:23"));
      c.expect(starved.kind === "neverStarted" && starved.estimate === 0 && starved.compute === 0 && Math.round(starved.queue) === 26,
        `a job that never got a runner: ${JSON.stringify(starved)} (the old measure called it 26 billed minutes)`);
      const done = m.classify(ran("check", "10:00:00", "10:02:00", "10:05:30"));
      c.expect(done.kind === "completed" && done.compute === 3.5 && done.estimate === 4 && done.queue === 2,
        `a job that ran 3.5 minutes after 2 waiting: ${JSON.stringify(done)}`);
      const stopped = m.classify(ran("red case", "10:00:00", "10:00:10", "10:01:10", "cancelled"));
      c.expect(stopped.kind === "cancelledAfterStart" && stopped.estimate === 1, `a job cancelled after it started: ${JSON.stringify(stopped)}`);
      const skipped = m.classify({ name: "selftest", conclusion: "skipped", started_at: at("10:00:00"), completed_at: at("10:00:00"), steps: [] });
      c.expect(skipped.kind === "skipped" && skipped.estimate === 0 && skipped.queue === 0, `a skipped job: ${JSON.stringify(skipped)}`);

      const run = (id: number, jobs: Job[], extra: Record<string, unknown> = {}) =>
        ({ id, name: "ci", head_sha: `sha${id}`, conclusion: "success", run_attempt: 1, jobs, ...extra });
      const nineIdle = Array.from({ length: 9 }, (_, i) => neverRan(`q${i}`, "11:00:00", "11:05:00"));
      const calm = m.judge([run(1, [ran("check", "11:00:00", "11:01:00", "11:04:00"), ...nineIdle])], { budget: 600 });
      c.expect(!calm.wasteRed && !calm.costRed, `9 unstarted jobs and a short wait: ${JSON.stringify(calm.findings)}`);
      const tenIdle = [...nineIdle, neverRan("q9", "11:00:00", "11:05:00")];
      const burst = m.judge([run(2, tenIdle)], { budget: 600 });
      c.expect(burst.wasteRed && !burst.costRed && burst.total.estimate === 0 && burst.findings.some((f: string) => /10 jobs never got a runner/.test(f)),
        `10 unstarted jobs costing nothing must still be waste: ${JSON.stringify(burst.findings)}`);
      const longWait = m.judge([run(3, [ran("red", "12:00:00", "12:16:00", "12:20:00")])], { budget: 600 });
      c.expect(longWait.wasteRed && longWait.findings.some((f: string) => /waited 16 minutes/.test(f)), `a 16-minute wait: ${JSON.stringify(longWait.findings)}`);
      const third = m.judge([run(4, [ran("check", "13:00:00", "13:00:05", "13:03:00")], { run_attempt: 3 })], { budget: 600 });
      c.expect(third.wasteRed && third.findings.some((f: string) => /attempted 3 times/.test(f)), `a third attempt: ${JSON.stringify(third.findings)}`);
      const twice = m.judge([run(5, [ran("a", "14:00:00", "14:00:05", "14:01:00")], { head_sha: "same" }),
        run(6, [ran("a", "15:00:00", "15:00:05", "15:01:00")], { head_sha: "same" })], { budget: 600 });
      c.expect(twice.wasteRed && twice.findings.some((f: string) => /more than once/.test(f)), `one commit run twice: ${JSON.stringify(twice.findings)}`);
      const superseded = m.judge([run(7, [ran("a", "14:00:00", "14:00:05", "14:01:00")], { head_sha: "same2", conclusion: "cancelled" }),
        run(8, [ran("a", "15:00:00", "15:00:05", "15:01:00")], { head_sha: "same2" })], { budget: 600 });
      c.expect(!superseded.findings.some((f: string) => /more than once/.test(f)), `a superseded (cancelled) run is not a duplicate: ${JSON.stringify(superseded.findings)}`);
      const dear = m.judge([run(9, [ran("big", "16:00:00", "16:00:00", "16:11:00")])], { budget: 10 });
      c.expect(dear.costRed && !dear.wasteRed, `11 minutes against a budget of 10: cost ${dear.costRed}, waste ${dear.wasteRed}`);
      const text = m.report("2026-10-05", 600, burst).join("\n");
      c.expect(/compute 0 min · queue 50 min · estimated billable 0 min/.test(text) && /Never started/.test(text),
        `the report does not give the three numbers apart: ${text.split("\n")[0]}`);
      return c.verdict("never-started jobs are queue, not cost; runner minutes and the per-job estimate are counted apart; " +
        "the waste alarm fires at 10 unstarted, a 16-minute wait, a third attempt and a duplicate commit, even at no cost");
    },
  },
  {
    id: "CI-W02",
    run: async (ctx) => {
      const c = new Checks();
      const m = await import(pathToFileURL(join(ctx.repoRoot, "audit/ci/proof-reuse.mjs")).href);

      // 1. what counts as the same code: only inert documents in the unread folders, and the staging request files
      c.expect(m.sameCode([]) && m.sameCode(["docs/coordination/DECISIONS.md", "docs/reports/X.pdf", ".github/staging-golden-school-request.txt"]),
        "only inert unread documents changed must count as the same code");
      for (const p of ["src/app/page.tsx", "selftest/manifest.json", "supabase/migrations/1_x.sql", ".github/workflows/ci.yml",
        "audit/ci/proof-reuse.mjs", "docs/audit/launch-readiness.sql", "docs/onboarding/PINTAR-Isian-Data-Sekolah.xlsx",
        "docs/recovery/projects.json", "package-lock.json",
        // code inside the unread folders is still code: tsconfig compiles **/*.mts and lint reads every script
        "docs/coordination/ux/sertifikat/kini.mts", "docs/coordination/checklist/render_docx.mjs", "docs/reports/x.ts", "docs/coordination/a.json"]) {
        c.expect(!m.sameCode(["docs/coordination/A.md", p]), `a change to ${p} was treated as the same code`);
      }
      // a rename is both of its paths, so moving code into an unread folder is never "the same code"
      c.expect(m.DIFF_ARGS("a", "b").includes("--no-renames"), "changed paths are listed without --no-renames: a rename would hide its old path");
      c.expect(!m.sameCode(["src/lib/x.ts", "docs/coordination/x.md"]), "a rename out of src/ was treated as the same code");

      // 2. reuse only from an authoritative run: on a branch, a successful run whose strict selftest ran, recent, same code
      const now = Date.parse("2026-10-06T12:00:00Z");
      const ok = { onMain: false, run: { conclusion: "success", created_at: "2026-10-06T10:00:00Z" }, selftestConclusion: "success", changed: ["docs/reports/a.md"], now };
      c.expect(m.reusable(ok).ok, `an authoritative recent run with only an unread change is not reusable: ${m.reusable(ok).why}`);
      for (const [label, over] of [
        ["on main", { onMain: true }],
        ["a failed run", { run: { conclusion: "failure", created_at: "2026-10-06T10:00:00Z" } }],
        ["a cancelled run (DEFERRED or ALREADY PROVEN)", { run: { conclusion: "cancelled", created_at: "2026-10-06T10:00:00Z" } }],
        ["a run whose selftest was skipped", { selftestConclusion: "skipped" }],
        ["a run with no selftest", { selftestConclusion: "missing" }],
        ["a run older than 72 hours", { run: { conclusion: "success", created_at: "2026-10-03T11:59:00Z" } }],
        ["a commit outside this history", { changed: null }],
        ["a code change", { changed: ["docs/reports/a.md", "src/x.ts"] }],
      ] as const) {
        c.expect(!m.reusable({ ...ok, ...over }).ok, `${label} was accepted as evidence`);
      }

      // 3. starvation: a queued job of another run over 10 minutes old; never a younger or a running one
      const at = Date.parse("2026-10-05T19:45:00Z");
      const q = (id: string, created: string, status = "queued") => ({ name: id, status, created_at: `2026-10-05T${created}Z` });
      const hit = m.starved([q("old", "19:30:00"), q("young", "19:40:00"), q("running", "19:00:00", "in_progress")], at, 10);
      c.expect(hit.length === 1 && hit[0].name === "old", `starvation: ${JSON.stringify(hit.map((j: { name: string }) => j.name))}`);

      // 4. the guard never succeeds on DEFERRED or ALREADY PROVEN: both cancel the run, and a cancellation that does not take
      //    hold ends in exit(1). Read in the module's source, where each outcome calls cancelSelf before anything else.
      const src = readFileSync(join(ctx.repoRoot, "audit/ci/proof-reuse.mjs"), "utf8");
      const cancelSelf = src.slice(src.indexOf("async function cancelSelf"), src.indexOf("out(\"proven\", \"false\")"));
      c.expect(/\/cancel`, "POST"\)[\s\S]*process\.exit\(1\)/.test(cancelSelf), "cancelSelf does not end in a failure when the cancellation does not take hold");
      c.expect(/DEFERRED · NOT PROVEN[\s\S]{0,400}await cancelSelf\(\)/.test(src), "the starved outcome does not cancel the run");
      c.expect(/ALREADY PROVEN[\s\S]{0,500}await cancelSelf\(\)/.test(src), "the proven outcome does not cancel the run");

      // 5. nothing CI executes reads the unread paths (comments may name them)
      const unread = /docs\/(coordination|reports|deployment)|\.github\/staging-[a-z-]+-request\.txt/;
      const roots = ["src", "selftest", "scripts", "supabase", ".github/actions", "audit/ci"];
      const skip = new Set(["audit/ci/proof-reuse.mjs", "audit/ci/actions-spend.mjs", "selftest/ciwaste.test.ts"]);
      const readers: string[] = [];
      const walk = (d: string) => {
        for (const n of readdirSync(d)) {
          const f = join(d, n);
          if (statSync(f).isDirectory()) { if (n !== "node_modules") walk(f); continue; }
          const rel = relative(ctx.repoRoot, f);
          if (skip.has(rel) || !/\.(ts|tsx|mts|mjs|js|sql|sh|py|ya?ml)$/.test(n)) continue;
          readFileSync(f, "utf8").split("\n").forEach((line, i) => {
            const t = line.trim();
            if (unread.test(line) && !/^(\*|\/\/|\/\*|#|--)/.test(t)) readers.push(`${rel}:${i + 1}`);
          });
        }
      };
      for (const r of roots) walk(join(ctx.repoRoot, r));
      c.expect(readers.length === 0, `code that CI runs reads an "unread" path, so reuse would be unsafe: ${readers.slice(0, 5).join(", ")}`);

      // 6. ci.yml: the guard first; the cheap gate before the expensive jobs; 15 red cases at a time; supersede per branch;
      //    the push filter skips exactly the inert unread documents; and the verdict makes success mean every job succeeded
      const ci = readFileSync(join(ctx.repoRoot, ".github/workflows/ci.yml"), "utf8");
      const redCase = ci.slice(ci.indexOf("\n  red-case:\n"), ci.indexOf("\n  baseline-parity:\n"));
      c.expect(/\n {2}reuse:\n[\s\S]*?actions: write[\s\S]*?run: node audit\/ci\/proof-reuse\.mjs/.test(ci), "ci.yml has no guard job able to cancel its run");
      c.expect(/\n {2}check:\n[\s\S]{0,120}needs: \[reuse\]\n\s+if: needs\.reuse\.outputs\.proven != 'true'/.test(ci), "check does not wait for the guard");
      for (const j of ["migrations-clean", "migrations-upgrade-path", "red-case"]) {
        c.expect(new RegExp(`\\n  ${j}:\\n[^\\n]*\\n    needs: \\[check\\]`).test(ci), `${j} does not wait for lint, typecheck and build`);
      }
      c.expect(/max-parallel: 15\b/.test(redCase), "the red cases are not capped at 15 at a time");
      c.expect(/concurrency:\n {2}group: ci-\$\{\{ github\.head_ref \|\| github\.ref_name \}\}\n {2}cancel-in-progress: true/.test(ci),
        "an older CI run on the same branch is not superseded");
      const filter = ci.slice(ci.indexOf("paths:"), ci.indexOf("pull_request:"));
      const excluded = [...filter.matchAll(/"!([^"]+)"/g)].map((x) => x[1]).sort();
      const expected = ["coordination", "reports", "deployment"].flatMap((d) =>
        ["md", "pdf", "png", "jpg", "jpeg", "docx", "xlsx", "csv", "txt", "html"].map((e) => `docs/${d}/**/*.${e}`)).sort();
      c.expect(JSON.stringify(excluded) === JSON.stringify(expected), `the push filter skips ${excluded.length} patterns, not exactly the inert unread documents`);
      for (const e of ["md", "pdf", "docx", "csv", "txt", "html"]) c.expect(m.INERT.test(`x.${e}`), `.${e} is skipped by the filter but not inert to the guard`);
      const jobs = [...ci.matchAll(/\n {2}([a-z-]+):\n {4}name:/g)].map((x) => x[1]).filter((j) => j !== "verdict").sort();
      const verdict = ci.slice(ci.indexOf("\n  verdict:\n"));
      const needs = (verdict.match(/needs: \[([^\]]+)\]/)?.[1] ?? "").split(",").map((x) => x.trim()).sort();
      c.expect(JSON.stringify(needs) === JSON.stringify(jobs), `verdict needs ${JSON.stringify(needs)}, not every job ${JSON.stringify(jobs)}`);
      c.expect(/if: \$\{\{ !cancelled\(\) \}\}/.test(verdict) && /v\.result !== "success"/.test(verdict) && /process\.exit\(1\)/.test(verdict),
        "verdict does not fail on a skipped, failed or cancelled job");
      return c.verdict("same code only for inert unread documents (code files never; renames as both paths); reuse only from a recent " +
        "authoritative run on a branch; starvation and reuse cancel the run or fail it, never succeed; nothing CI runs reads the unread " +
        "paths; ci.yml: guard first, cheap gate before the expensive jobs, 15 red cases at a time, superseded by branch, exact filter, " +
        "and a verdict that fails unless every job succeeded");
    },
  },
];
