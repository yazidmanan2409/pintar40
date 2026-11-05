// CI's first job (the CI efficiency gate, D-119). Before CI queues its jobs, two questions, read only. The answers
// never make a run green:
//
// 1. ARE RUNNERS STARVED? On 5 Oct, CI queued 35 jobs at a time while hosted runners were scarce. Most of them never
//    got a runner, waited 20 to 25 minutes (their timeouts), and were cancelled; one run was attempted four times. If
//    any job of another run in this repository has waited longer than STARVED_MINUTES (default 10) for a runner, the
//    outcome is DEFERRED · NOT PROVEN: this run cancels itself before it queues anything. Dispatch again when the
//    queue has cleared.
//
// 2. IS THIS CODE ALREADY PROVEN? On a working branch, as below. On main (E1, D-128) only for the IDENTICAL commit: a
//    fast-forward of main to a commit whose full run already succeeded proves nothing new, and the deploy gates read
//    any successful ci.yml run on that exact head_sha. A main commit that differs even in an unread document runs in
//    full, so every commit main runs keeps a successful run of its own exact head. Elsewhere the
//    outcome is ALREADY PROVEN, and the run cancels itself, naming the earlier run that is the evidence. It applies
//    when that run is authoritative and its code is identical:
//      - it ran on a push or a dispatch, so it tested its head commit itself (a pull request run tests the merge of its
//        head with the base, and that head was never proven on its own);
//      - its strict selftest job really ran and succeeded;
//      - it is at most MAX_AGE_HOURS old (default 72);
//      - its files differ from this commit's only in documents nothing reads. A path counts as unread only when it is
//        an inert document (UNREAD_DIRS × INERT, or a staging request file). A code file is never unread, wherever it
//        lies: tsconfig compiles every **/*.ts and **/*.mts, and lint reads every script, docs/ included. Renames
//        count as both of their paths (--no-renames).
//    CI-W02 keeps this true: it fails if anything CI executes starts reading these paths.
//
// THE RULE: an outcome of this job is never success with skipped proof. DEFERRED and ALREADY PROVEN both cancel the
// run, so its conclusion is `cancelled`. If the cancellation does not take hold within 90 s, this job fails, so the
// conclusion is `failure`. Either way it creates no evidence: the deploy gates and this job's own search accept only
// `success`. And ci.yml's `verdict` job independently fails any run in which a job did not succeed.
//
//   GH_TOKEN (actions: write, to cancel its own run), REPO, GITHUB_REF_NAME, GITHUB_SHA, GITHUB_RUN_ID   from CI
//   STARVED_MINUTES, MAX_AGE_HOURS                                                                    thresholds
import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const UNREAD_DIRS = /^docs\/(coordination|reports|deployment)\//;
/** Inert document types: nothing compiles, lints, imports or tests them. Code extensions are deliberately absent. */
export const INERT = /\.(md|pdf|png|jpe?g|gif|webp|docx|xlsx|pptx|csv|txt|html?)$/i;
const REQUEST = /^\.github\/staging-[a-z-]+-request\.txt$/;

/**
 * Documents a test reads are never unread (as docs/audit and docs/onboarding are not). The decision log is one since
 * D-180: R-PROSES-01 reconciles every ruling to its obligations, so a ruling recorded alone must run CI, not reuse it.
 */
export const READ_DOCS = /^docs\/coordination\/DECISIONS\.md$/;
export const unread = (p) => !READ_DOCS.test(p) && (REQUEST.test(p) || (UNREAD_DIRS.test(p) && INERT.test(p)));
/** Same code when every changed path is unread (no change at all is the same code too). */
export const sameCode = (changed) => changed.every(unread);
/** The arguments that list changed paths: a rename counts as its old and its new path. */
export const DIFF_ARGS = (from, to) => ["diff", "--no-renames", "--name-only", from, to];
export const SELFTEST_JOB = "selftest contract (strict, local stack)";
/** Events whose run tests exactly its head_sha. */
export const HEAD_EVENTS = ["push", "workflow_dispatch"];

/** Jobs of other runs waiting for a runner longer than `minutes`, at `now`. */
export function starved(jobs, now, minutes = 10) {
  return jobs.filter((j) => j.status === "queued" && j.created_at && (now - Date.parse(j.created_at)) / 60000 > minutes);
}

/**
 * May this commit cite `candidate` instead of running? Only if every condition holds; `why` says which failed.
 * candidate: { run, selftestConclusion, changed }
 */
export function reusable({ onMain, run, selftestConclusion, changed, now, maxAgeHours = 72 }) {
  // E1 (D-128): on main, only the identical commit. A commit that differs even in an unread document runs in full, so
  // every commit main runs keeps a successful run on its own exact head_sha, the one the deploy gates look for.
  if (onMain && !(Array.isArray(changed) && changed.length === 0)) return { ok: false, why: "main: only the identical commit, already proven, is not run again" };
  if (!run || run.conclusion !== "success") return { ok: false, why: "the candidate run did not succeed" };
  if (!HEAD_EVENTS.includes(run.event)) return { ok: false, why: "the candidate did not test its own head (a pull request run tests a merge)" };
  if (selftestConclusion !== "success") return { ok: false, why: "the candidate's strict selftest did not run and succeed" };
  if ((now - Date.parse(run.created_at)) / 3600000 > maxAgeHours) return { ok: false, why: `the candidate is older than ${maxAgeHours} h` };
  if (!Array.isArray(changed)) return { ok: false, why: "the candidate's commit is not in this history" };
  if (!sameCode(changed)) return { ok: false, why: "a changed path is code, or a document something reads" };
  return { ok: true, why: changed.length ? `differs only in ${changed.length} unread document(s)` : "is the same commit" };
}

async function main() {
  const { GH_TOKEN, REPO, GITHUB_REF_NAME, GITHUB_SHA, GITHUB_RUN_ID, GITHUB_OUTPUT, GITHUB_STEP_SUMMARY } = process.env;
  const minutes = Number(process.env.STARVED_MINUTES || 10);
  const maxAgeHours = Number(process.env.MAX_AGE_HOURS || 72);
  const say = (s) => { console.log(s); if (GITHUB_STEP_SUMMARY) appendFileSync(GITHUB_STEP_SUMMARY, `${s}\n`); };
  const out = (k, v) => { if (GITHUB_OUTPUT) appendFileSync(GITHUB_OUTPUT, `${k}=${v}\n`); };
  async function api(path, method = "GET") {
    for (let attempt = 1; ; attempt++) {
      const r = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
        method,
        headers: { authorization: `Bearer ${GH_TOKEN}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" },
      }).catch(() => null);
      if (r?.ok) return r.status === 202 || r.status === 204 ? {} : r.json();
      if (r && r.status < 500) throw new Error(`${method} ${path}: HTTP ${r.status}`);
      if (attempt >= 3) throw new Error(`${method} ${path}: HTTP ${r?.status ?? "network"} after ${attempt} attempts`);
      await new Promise((ok) => setTimeout(ok, 2000 * attempt));
    }
  }
  /** Cancel this run and wait for it to take hold; if it does not within 90 s, fail (never succeed). */
  async function cancelSelf() {
    await api(`/actions/runs/${GITHUB_RUN_ID}/cancel`, "POST");
    // once the cancellation takes hold, GitHub stops this job here; it never reaches the line below
    await new Promise((ok) => setTimeout(ok, 90000));
    say("The cancellation did not take hold within 90 s: this job fails, so the run is red, never green.");
    process.exit(1);
  }

  out("proven", "false");
  // 1. starvation
  const live = [];
  for (const status of ["queued", "in_progress"]) {
    const d = await api(`/actions/runs?status=${status}&per_page=50`);
    live.push(...d.workflow_runs.filter((r) => String(r.id) !== String(GITHUB_RUN_ID)));
  }
  const jobs = [];
  for (const r of live) jobs.push(...(await api(`/actions/runs/${r.id}/jobs?per_page=100`)).jobs);
  const waiting = starved(jobs, Date.now(), minutes);
  if (waiting.length) {
    say(`**DEFERRED · NOT PROVEN.** ${waiting.length} job(s) of other runs have waited more than ${minutes} minutes for a runner ` +
        `(the longest: «${waiting[0].name}»). This run cancels itself before queueing anything; nothing here is evidence. ` +
        "Dispatch again when the queue has cleared.");
    await cancelSelf();
  }

  // 2. already proven. On main (E1, D-128) only a successful run on this exact commit qualifies; elsewhere, as before.
  const onMain = GITHUB_REF_NAME === "main";
  const done = await api(onMain
    ? `/actions/workflows/ci.yml/runs?status=success&head_sha=${GITHUB_SHA}&per_page=30`
    : `/actions/workflows/ci.yml/runs?status=success&per_page=30`);
  for (const run of done.workflow_runs) {
    if (String(run.id) === String(GITHUB_RUN_ID)) continue;
    const runJobs = (await api(`/actions/runs/${run.id}/jobs?per_page=100`)).jobs;
    const selftestConclusion = runJobs.find((j) => j.name === SELFTEST_JOB)?.conclusion ?? "missing";
    let changed = null;
    try {
      changed = execFileSync("git", DIFF_ARGS(run.head_sha, GITHUB_SHA), { encoding: "utf8" }).split("\n").filter(Boolean);
    } catch { /* that commit is not in this checkout's history */ }
    const v = reusable({ onMain, run, selftestConclusion, changed, now: Date.now(), maxAgeHours });
    if (v.ok) {
      say(`**ALREADY PROVEN** by CI run ${run.id} on \`${run.head_sha.slice(0, 7)}\` (${run.html_url}), whose strict selftest ran ` +
          `and succeeded: this commit ${v.why}. This run cancels itself and is not evidence; run ${run.id} is.`);
      out("proven", "true"); out("proven_by", run.id);
      await cancelSelf();
    }
  }
  say("Not proven by an earlier authoritative run: CI runs in full.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
