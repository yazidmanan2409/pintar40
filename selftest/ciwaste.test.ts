/**
 * THE CI EFFICIENCY GATE (owner, 6 Oct): less waste, never less assurance.
 *
 *  CI-W01  audit/ci/actions-spend.mjs, executed on jobs shaped as GitHub's API returns them. A job that never got a
 *          runner (no runner, no step), like the 77 of 5 Oct, counts as queue time and costs nothing, where the old
 *          measure counted its 26 minutes of waiting as 26 billed minutes. A job that ran counts its runner minutes,
 *          rounded up per job for the estimate, and its wait before the runner as queue. A cancelled job that had
 *          started counts as cancelled after start. Skipped jobs count for nothing. The waste alarm is red, whatever
 *          the cost:
 *          - at 10 jobs that never got a runner after waiting over 5 minutes (not at 9); jobs a newer run superseded
 *            before they got a runner (a minute or two, no cost) are listed apart and are not waste;
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
 *  CI-W03  S4 (D-091(e), approved 6 Oct): the database red cases share a stack per group without losing a case or its
 *          isolation. The matrix holds exactly the 30 cases there were, each in one group; every plant gate in
 *          selftest/plants/plants.json is one of them; every case has steps and every step's case is in the matrix; each
 *          case's steps are contiguous, so its plants run on the database its own reset gave it (6 Oct: wp7's plants sat at
 *          the end of the job and ran after bob26's reset and plants); a
 *          case's steps run whatever an earlier case in its group did (!cancelled()), so one red case never hides another;
 *          db-table-without-rls, which plants a migration, is alone; a shared group holds database cases only. The
 *          local-stack action reuses a stack only when one runs, resets the database on every use, and fails a use whose
 *          fresh database's fingerprint (functions, grants, policies, triggers, extensions, roles, memberships, role
 *          settings, row counts) differs from the job's first.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
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
      const nineIdle = Array.from({ length: 9 }, (_, i) => neverRan(`q${i}`, "11:00:00", "11:06:00"));
      const calm = m.judge([run(1, [ran("check", "11:00:00", "11:01:00", "11:04:00"), ...nineIdle])], { budget: 600 });
      c.expect(!calm.wasteRed && !calm.costRed, `9 unstarted jobs and a short wait: ${JSON.stringify(calm.findings)}`);
      const tenIdle = [...nineIdle, neverRan("q9", "11:00:00", "11:06:00")];
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
      // 6 Oct: a newer run superseded one whose 17 jobs were still waiting for a runner, cancelled after 0.6 minutes: no
      // cost and no starvation, so not waste (it is the supersede working); counted apart so the table still shows them
      const supersededIdle = Array.from({ length: 17 }, (_, i) => neverRan(`s${i}`, "10:30:00", "10:30:36"));
      const sup = m.judge([run(10, supersededIdle, { conclusion: "cancelled" })], { budget: 600 });
      c.expect(!sup.wasteRed && sup.total.neverStarted === 17,
        `17 jobs superseded before a runner (0.6 minutes, no cost) were called waste: ${JSON.stringify(sup.findings)}`);
      c.expect(/superseded or cancelled before a runner/.test(m.report("2026-10-06", 600, sup).join("\n")),
        "the report does not say apart the jobs cancelled before a runner within 5 minutes");
      const dear = m.judge([run(9, [ran("big", "16:00:00", "16:00:00", "16:11:00")])], { budget: 10 });
      c.expect(dear.costRed && !dear.wasteRed, `11 minutes against a budget of 10: cost ${dear.costRed}, waste ${dear.wasteRed}`);
      const text = m.report("2026-10-05", 600, burst).join("\n");
      c.expect(/compute 0 min · queue 60 min · estimated billable 0 min/.test(text) && /Never started/.test(text),
        `the report does not give the three numbers apart: ${text.split("\n")[0]}`);
      return c.verdict("never-started jobs are queue, not cost; runner minutes and the per-job estimate are counted apart; " +
        "the waste alarm fires at 10 jobs that waited over 5 minutes and never started (superseded ones apart), a 16-minute wait, a third attempt and a duplicate commit, even at no cost");
    },
  },
  {
    id: "CI-W02",
    run: async (ctx) => {
      const c = new Checks();
      const m = await import(pathToFileURL(join(ctx.repoRoot, "audit/ci/proof-reuse.mjs")).href);

      // 1. what counts as the same code: only inert documents in the unread folders, and the staging request files
      // restated (D-180): the decision log is read by R-PROSES-01, so it is no longer an unread document; the example is another
      c.expect(m.sameCode([]) && m.sameCode(["docs/coordination/RUN-LOG.md", "docs/reports/X.pdf", ".github/staging-golden-school-request.txt"]),
        "only inert unread documents changed must count as the same code");
      for (const p of ["src/app/page.tsx", "selftest/manifest.json", "supabase/migrations/1_x.sql", ".github/workflows/ci.yml",
        "audit/ci/proof-reuse.mjs", "docs/audit/launch-readiness.sql", "docs/onboarding/PINTAR-Isian-Data-Sekolah.xlsx",
        "docs/recovery/projects.json", "package-lock.json",
        // code inside the unread folders is still code: tsconfig compiles **/*.mts and lint reads every script
        "docs/coordination/ux/sertifikat/kini.mts", "docs/coordination/checklist/render_docx.mjs", "docs/reports/x.ts", "docs/coordination/a.json"]) {
        c.expect(!m.sameCode(["docs/coordination/A.md", p]), `a change to ${p} was treated as the same code`);
      }
      // D-180: a document a test reads is never the same code: the decision log, which R-PROSES-01 reconciles
      c.expect(!m.sameCode(["docs/coordination/DECISIONS.md"]) && !m.sameCode(["docs/coordination/A.md", "docs/coordination/DECISIONS.md"]),
        "a change to the decision log alone was treated as the same code, though R-PROSES-01 reads it");
      // a rename is both of its paths, so moving code into an unread folder is never "the same code"
      c.expect(m.DIFF_ARGS("a", "b").includes("--no-renames"), "changed paths are listed without --no-renames: a rename would hide its old path");
      c.expect(!m.sameCode(["src/lib/x.ts", "docs/coordination/x.md"]), "a rename out of src/ was treated as the same code");

      // 2. reuse only from an authoritative run: on a branch, a successful run whose strict selftest ran, recent, same code
      const now = Date.parse("2026-10-06T12:00:00Z");
      const ok = { onMain: false, run: { conclusion: "success", event: "workflow_dispatch", created_at: "2026-10-06T10:00:00Z" }, selftestConclusion: "success", changed: ["docs/reports/a.md"], now };
      c.expect(m.reusable(ok).ok, `an authoritative recent run with only an unread change is not reusable: ${m.reusable(ok).why}`);
      // E1 (D-128): on main, the identical commit only. Main's run of a commit already proven in full on a branch proves
      // nothing new (the deploy gates read any successful ci.yml run on that exact head_sha), so it names that run and
      // cancels. A commit that differs even in an unread document runs in full on main, so every commit main runs keeps
      // a green run of its own exact head for the deploy gates.
      const sameOnMain = { ...ok, onMain: true, changed: [] as string[] };
      c.expect(m.reusable(sameOnMain).ok, `on main, an authoritative recent run on the identical commit is not reusable: ${m.reusable(sameOnMain).why}`);
      for (const [label, over] of [
        ["on main, a commit that differs in an unread document", { onMain: true }],
        ["a failed run", { run: { conclusion: "failure", event: "workflow_dispatch", created_at: "2026-10-06T10:00:00Z" } }],
        ["a cancelled run (DEFERRED or ALREADY PROVEN)", { run: { conclusion: "cancelled", event: "workflow_dispatch", created_at: "2026-10-06T10:00:00Z" } }],
        ["a run whose selftest was skipped", { selftestConclusion: "skipped" }],
        ["a run with no selftest", { selftestConclusion: "missing" }],
        ["a run older than 72 hours", { run: { conclusion: "success", event: "workflow_dispatch", created_at: "2026-10-03T11:59:00Z" } }],
        // a pull request run tests the merge of its head with the base, so its head_sha was never itself proven
        ["a pull request run", { run: { conclusion: "success", event: "pull_request", created_at: "2026-10-06T10:00:00Z" } }],
        ["a run of unknown event", { run: { conclusion: "success", created_at: "2026-10-06T10:00:00Z" } }],
        // P-6: a pull request into main is the merge gate; main's ruleset requires its own verdict, so it never stands down
        ["a pull request run into main (the merge gate)", { mergeGate: true }],
        ["a commit outside this history", { changed: null }],
        ["a code change", { changed: ["docs/reports/a.md", "src/x.ts"] }],
      ] as const) {
        c.expect(!m.reusable({ ...ok, ...over }).ok, `${label} was accepted as evidence`);
        // E1: the identical commit on main never excuses any other condition
        if (!("onMain" in over)) c.expect(!m.reusable({ ...sameOnMain, ...over }).ok, `on main, ${label} was accepted as evidence`);
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
      // P-6: the merge gate is read from the run itself, and handed to reusable
      c.expect(/GITHUB_EVENT_NAME === "pull_request" && process\.env\.GITHUB_BASE_REF === "main"/.test(src)
        && /reusable\(\{ onMain, mergeGate,/.test(src), "a pull request into main is not recognised as the merge gate");
      c.expect(/ALREADY PROVEN[\s\S]{0,500}await cancelSelf\(\)/.test(src), "the proven outcome does not cancel the run");

      // 5. nothing CI executes reads the unread paths (comments may name them)
      const unread = /docs\/(?:coordination(?!\/DECISIONS\.md)|reports|deployment)|\.github\/staging-[a-z-]+-request\.txt/;
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
      c.expect(/"!docs\/deployment\/\*\*\/\*\.html"\n(?:\s*#[^\n]*\n)?\s*- "docs\/coordination\/DECISIONS\.md"\n/.test(filter), "the push filter skips the decision log, which a test reads (D-180)");
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
  {
    id: "CI-W03",
    run: async (ctx) => {
      const c = new Checks();
      // the 30 red cases of 6 Oct, before S4: none may be lost or duplicated by grouping
      const CASES = ["static-permissive-policy", "db-table-without-rls", "static-raw-evidence-read", "static-duplicate-engine",
        "static-second-verification-route", "db-fable04-gates", "db-fable05-gates", "db-task1-gates", "db-task2-gates", "db-fable06-gates",
        "static-fable06-gates", "db-tour-gates", "db-wp1-gates", "db-wp7-gates", "db-wp8-gates", "db-r1-gates", "db-bob01-gates",
        "db-bob02-gates", "db-bob03-gates", "db-bob04-gates", "db-bob06-gates", "db-bob12-gates", "db-bob24-gates", "db-bob35-gates",
        "db-bob36-gates", "db-bob39-gates", "db-bob37-gates", "db-bob25-gates", "db-bob26-gates", "db-bob50-gates"];
      const ci = readFileSync(join(ctx.repoRoot, ".github/workflows/ci.yml"), "utf8");
      const redCase = ci.slice(ci.indexOf("\n  red-case:\n"), ci.indexOf("\n  baseline-parity:\n"));
      const groups = [...redCase.matchAll(/- \{ group: "([^"]+)", cases: " ([a-z0-9 -]+) " \}/g)].map((x) => ({ group: x[1], cases: x[2].split(" ") }));
      c.expect(groups.length > 0, "the red cases are not grouped (S4): each still boots its own stack");
      const listed = groups.flatMap((g) => g.cases);
      c.expect(JSON.stringify([...listed].sort()) === JSON.stringify([...CASES].sort()),
        `the grouped red cases are not exactly the 30 there were: ${JSON.stringify(listed.filter((x) => !CASES.includes(x)))} added, ${JSON.stringify(CASES.filter((x) => !listed.includes(x)))} lost`);
      c.expect(new Set(listed).size === listed.length, "a red case is in more than one group");
      const plantGates = new Set((JSON.parse(readFileSync(join(ctx.repoRoot, "selftest/plants/plants.json"), "utf8")).plants ?? [])
        .map((p: { gate?: string }) => p.gate).filter(Boolean));
      for (const g of plantGates) c.expect(listed.includes(g as string), `plant gate ${g} is in no red-case group, so its plants never run`);
      const stepCases = new Set([...redCase.matchAll(/if: \$\{\{ !cancelled\(\) && contains\(matrix\.cases, ' ([a-z0-9-]+) '\) \}\}/g)].map((x) => x[1]));
      for (const k of CASES) c.expect(stepCases.has(k), `red case ${k} has no step: it is listed but nothing runs`);
      for (const k of stepCases) c.expect(CASES.includes(k), `a step runs for ${k}, which is in no group`);
      c.expect(!/if: matrix\.case\b/.test(redCase) && !/\bif: (?!\$\{\{ !cancelled\(\) && )[^\n]*matrix\.cases/.test(redCase),
        "a red-case step is skipped when an earlier case in its group failed, so one red case can hide another");
      // each case's steps are contiguous: no other case's stack (and so its reset) comes between a case's stack step and
      // its plants, so every case's plants run on the database its own reset gave it
      const order = [...redCase.matchAll(/\n {6}- name:[^\n]*\n {8}if: \$\{\{ !cancelled\(\) && contains\(matrix\.cases, ' ([a-z0-9-]+) '\) \}\}/g)].map((x) => x[1]);
      for (const k of CASES) {
        const at = order.flatMap((o, i) => (o === k ? [i] : []));
        const between = at.length ? order.slice(at[0], at[at.length - 1] + 1).filter((o) => o !== k) : [];
        c.expect(between.length === 0, `red case ${k}'s steps are split by ${[...new Set(between)].join(", ")}: its plants would run on another case's database`);
      }
      c.expect(groups.some((g) => g.cases.length === 1 && g.cases[0] === "db-table-without-rls"),
        "db-table-without-rls shares a stack, so its planted migration reaches every later case's reset");
      for (const g of groups.filter((x) => x.cases.length > 1)) {
        c.expect(g.cases.every((k) => k.startsWith("db-") && k !== "db-table-without-rls"), `group «${g.group}» shares a stack with a case that changes files`);
      }
      c.expect(/for c in \$\{\{ matrix\.cases \}\}; do\n {10}case "\$c" in/.test(redCase), "the defects are not injected for each case of the group");

      const action = readFileSync(join(ctx.repoRoot, ".github/actions/local-stack/action.yml"), "utf8");
      c.expect(/if \[ -n "\$\(docker ps -q --filter name=supabase_db_\)" \]; then[\s\S]*?else\n\s+npx --no-install supabase start/.test(action),
        "local-stack does not boot a stack when none runs, or reuses without asking");
      c.expect(/\n {6}run: npx --no-install supabase db reset --local\n/.test(action), "local-stack does not reset the database on every use");
      c.expect(/fingerprint\.sql[\s\S]*?fresh-database\.fingerprint[\s\S]*?\[ "\$fp" = "\$\(cat "\$first"\)" \] \|\| \{[^}]*exit 1; \}/.test(action),
        "local-stack does not fail a use whose fresh database differs from the job's first");
      const fpPath = join(ctx.repoRoot, ".github/actions/local-stack/fingerprint.sql");
      const fp = existsSync(fpPath) ? readFileSync(fpPath, "utf8") : "";
      c.expect(fp !== "", "local-stack has no fresh-database fingerprint");
      for (const [what, re] of [["functions", /pg_get_functiondef/], ["column grants", /attacl/], ["policies", /pg_policies/], ["relation grants", /relacl/],
        ["triggers", /pg_trigger/], ["extensions", /pg_extension/], ["roles", /pg_roles/], ["memberships", /pg_auth_members/],
        ["role settings", /pg_db_role_setting/], ["row counts", /count\(\*\)/]] as const) {
        c.expect(re.test(fp), `the fresh-database fingerprint does not cover ${what}`);
      }
      c.expect(!/\b(insert|update|delete|create|drop|alter|grant|revoke|truncate)\b/i.test(fp.replace(/--[^\n]*/g, "")), "the fingerprint writes; it must only read");
      return c.verdict(`${CASES.length} red cases in ${groups.length} groups, each once, every plant gate among them; every case has its steps and runs ` +
        "whatever an earlier case did, its steps contiguous; the migration-planting case alone; every use of a shared stack resets and is fingerprinted against the job's first fresh database");
    },
  },
];
