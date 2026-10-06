// GitHub Actions spend and waste, by workflow, for one UTC day (D-090: cost is not the enemy, waste is; whole-system
// efficiency audit, 2 Oct; the CI efficiency gate, 6 Oct). READ ONLY: lists the repository's workflow runs created
// that day and every job of every attempt, and changes nothing.
//
// THREE NUMBERS, never one (6 Oct). Until then this script counted each job from `started_at` to `completed_at`
// as billed. A job that never gets a runner has those times too (GitHub stamps `started_at` when it queues), so on
// 5 Oct 77 jobs that waited about 26 minutes for a runner and were then cancelled, with no step run, were reported
// as about 1,680 billed minutes. Now:
//   compute    the minutes jobs actually ran on a runner (a runner assigned and at least one step)
//   queue      the minutes jobs waited: before their runner for those that ran; their whole life for those that never
//              got one
//   estimate   the billable estimate: each job that ran, rounded UP to the whole minute, as GitHub bills hosted
//              runners. It is an estimate: GitHub's per-run timing API reports 0 for this repository, so the bill
//              itself is on the owner's billing page
// and the jobs by outcome: completed, cancelled after they started, never started (no runner), skipped.
//
// TWO ALARMS, either one RED:
//   cost   the day's estimate exceeds BUDGET
//   waste  work that could not influence a decision:
//            - WASTE_UNSTARTED or more jobs that never got a runner after waiting longer than WASTE_STARVED_MINUTES
//              (defaults 10 and 5). A job a newer run superseded before it got a runner ends within a minute or two, costs
//              nothing and is the supersede working (6 Oct: 31 such jobs made the alarm red with no starvation at all), so
//              those are listed apart and are not waste;
//            - any job that waited longer than WASTE_WAIT_MINUTES for its runner (default 15);
//            - any run attempted more than twice;
//            - one commit run more than once by the same workflow to a conclusion that ran jobs.
//          It is red even when it cost nothing: a queue of work that cannot run is noise, delayed feedback, and a
//          sign that something spawns more than can execute.
// What to do about a red day is a decision, not this script's.
//
//   GH_TOKEN  the workflow's token (actions: read)   REPO  owner/name
//   DAY       YYYY-MM-DD, UTC (default: yesterday)   BUDGET  estimated billable minutes a day (default 600)
//   WASTE_UNSTARTED, WASTE_STARVED_MINUTES, WASTE_WAIT_MINUTES   the waste thresholds (defaults 10, 5 and 15)
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const min = (a, b) => (Date.parse(b) - Date.parse(a)) / 60000;

/** One job, of any attempt: did it run on a runner, and what did it cost and wait. */
export function classify(j) {
  if (j.conclusion === "skipped") return { kind: "skipped", compute: 0, estimate: 0, queue: 0 };
  const ran = Boolean(j.runner_name) && Array.isArray(j.steps) && j.steps.length > 0 && j.started_at && j.completed_at;
  if (ran) {
    // the first step's start is when the runner took it; `started_at` alone can be the queue time
    const first = j.steps.map((s) => s.started_at).filter(Boolean).sort()[0] ?? j.started_at;
    const compute = Math.max(0, min(first, j.completed_at));
    const queue = j.created_at ? Math.max(0, min(j.created_at, first)) : 0;
    const kind = j.conclusion === "cancelled" ? "cancelledAfterStart" : "completed";
    return { kind, compute, estimate: compute > 0 ? Math.ceil(compute) : 0, queue };
  }
  // never got a runner: nothing ran and nothing is billed, but the time it sat in the queue is waste
  const end = j.completed_at ?? j.started_at ?? j.created_at;
  const queue = j.created_at && end ? Math.max(0, min(j.created_at, end)) : 0;
  return { kind: "neverStarted", compute: 0, estimate: 0, queue };
}

const blank = () => ({ runs: 0, compute: 0, estimate: 0, queue: 0, completed: 0, cancelledAfterStart: 0, neverStarted: 0, skipped: 0, longestWait: 0, starved: 0, cancelledEarly: 0 });

/** The day: per workflow and in total, with the waste findings. `runs` carry their `jobs` (every attempt). */
export function judge(runs, { budget = 600, unstarted = 10, waitMinutes = 15, starvedMinutes = 5 } = {}) {
  const per = new Map();
  const total = blank();
  const findings = [];
  const ranByCommit = new Map();
  for (const run of runs) {
    const w = per.get(run.name) ?? blank();
    w.runs++; total.runs++;
    let ranJobs = 0;
    for (const j of run.jobs) {
      const c = classify(j);
      for (const t of [w, total]) {
        t[c.kind]++;
        t.compute += c.compute; t.estimate += c.estimate; t.queue += c.queue;
      }
      if (c.kind === "completed" || c.kind === "cancelledAfterStart") ranJobs++;
      if (c.kind !== "skipped" && c.kind !== "neverStarted" && c.queue > waitMinutes) {
        findings.push(`«${run.name}» run ${run.id}: «${j.name}» waited ${Math.round(c.queue)} minutes for a runner`);
      }
      if (c.kind === "neverStarted") {
        const k = c.queue > starvedMinutes ? "starved" : "cancelledEarly";
        w[k]++; total[k]++;
        if (k === "starved" && c.queue > w.longestWait) w.longestWait = c.queue;
      }
    }
    if ((run.run_attempt ?? 1) > 2) findings.push(`«${run.name}» run ${run.id} was attempted ${run.run_attempt} times`);
    if (ranJobs > 0 && run.conclusion && run.conclusion !== "cancelled") {
      const k = `${run.name}|${run.head_sha}`;
      const seen = ranByCommit.get(k);
      if (seen) findings.push(`«${run.name}» ran commit ${String(run.head_sha).slice(0, 7)} more than once (runs ${seen}, ${run.id})`);
      else ranByCommit.set(k, run.id);
    }
    per.set(run.name, w);
  }
  if (total.starved >= unstarted) {
    findings.unshift(`${total.starved} jobs never got a runner after waiting more than ${starvedMinutes} minutes (threshold ${unstarted}); they waited ${Math.round(per.size ? [...per.values()].reduce((m, w) => Math.max(m, w.longestWait), 0) : 0)} minutes at the longest before they ended`);
  }
  return { per, total, findings, costRed: total.estimate > budget, wasteRed: findings.length > 0 };
}

export function report(day, budget, j) {
  const r = (x) => Math.round(x);
  const rows = [...j.per.entries()].sort((a, b) => b[1].estimate - a[1].estimate);
  return [
    `### Actions on ${day} (UTC): compute ${r(j.total.compute)} min · queue ${r(j.total.queue)} min · estimated billable ${j.total.estimate} min (budget ${budget})`,
    "",
    "| Workflow | Runs | Compute min | Queue min | Estimate min | Completed | Cancelled after start | Never started | Skipped |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
    ...rows.map(([n, w]) => `| ${n} | ${w.runs} | ${r(w.compute)} | ${r(w.queue)} | ${w.estimate} | ${w.completed} | ${w.cancelledAfterStart} | ${w.neverStarted} | ${w.skipped} |`),
    "",
    "The estimate rounds each job that ran up to the whole minute; jobs that never got a runner are not billed. The bill itself is on the owner's billing page.",
    `Never started: ${j.total.starved} waited more than the starvation threshold for a runner; ${j.total.cancelledEarly} were superseded or cancelled before a runner within it (no cost, not waste).`,
    "",
    j.costRed ? `**COST: over budget by ${j.total.estimate - budget} minutes.** The biggest line is «${rows[0]?.[0]}» (D-091).` : "Cost: within budget.",
    j.wasteRed ? `**WASTE:**\n${j.findings.map((f) => `- ${f}`).join("\n")}` : "Waste: none found.",
  ];
}

async function main() {
  const { GH_TOKEN, REPO, GITHUB_STEP_SUMMARY } = process.env;
  if (!GH_TOKEN || !/^[\w.-]+\/[\w.-]+$/.test(REPO ?? "")) throw new Error("GH_TOKEN and REPO=owner/name are required");
  const budget = Number(process.env.BUDGET || 600);
  const day = process.env.DAY || new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !(budget > 0)) throw new Error(`bad DAY ${day} or BUDGET ${budget}`);
  const unstarted = Number(process.env.WASTE_UNSTARTED || 10);
  const waitMinutes = Number(process.env.WASTE_WAIT_MINUTES || 15);
  const starvedMinutes = Number(process.env.WASTE_STARVED_MINUTES || 5);

  // GitHub's API answers 502 now and then (6 Oct): retry before giving up, so the monitor itself does not go red
  async function api(path) {
    for (let attempt = 1; ; attempt++) {
      let r;
      try {
        r = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
          headers: { authorization: `Bearer ${GH_TOKEN}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" },
        });
      } catch (e) {
        if (attempt >= 4) throw e;
      }
      if (r?.ok) return r.json();
      if (r && r.status < 500) throw new Error(`${path}: HTTP ${r.status}`);
      if (attempt >= 4) throw new Error(`${path}: HTTP ${r?.status ?? "network"} after ${attempt} attempts`);
      await new Promise((ok) => setTimeout(ok, 2000 * 2 ** (attempt - 1)));
    }
  }

  const runs = [];
  for (let page = 1; ; page++) {
    const d = await api(`/actions/runs?created=${day}&per_page=100&page=${page}`);
    runs.push(...d.workflow_runs);
    if (d.workflow_runs.length < 100) break;
  }
  for (const run of runs) {
    run.jobs = [];
    for (let page = 1; ; page++) {
      const d = await api(`/actions/runs/${run.id}/jobs?filter=all&per_page=100&page=${page}`);
      run.jobs.push(...d.jobs);
      if (d.jobs.length < 100) break;
    }
  }
  const j = judge(runs, { budget, unstarted, waitMinutes, starvedMinutes });
  const lines = report(day, budget, j);
  console.log(lines.join("\n"));
  if (GITHUB_STEP_SUMMARY) appendFileSync(GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`);
  if (j.costRed || j.wasteRed) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
