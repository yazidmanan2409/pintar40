// GitHub Actions spend, by workflow, for one UTC day (D-090: cost is not the enemy, waste is; whole-system
// efficiency audit, 2 Oct). READ ONLY: lists the repository's workflow runs created that day and their jobs, and
// counts billed minutes as GitHub bills them, each job rounded UP to the whole minute (skipped jobs cost nothing).
//
// RED when the day's billed minutes exceed BUDGET, so a rise in spend is seen the next morning instead of on the
// bill: between 18 Sep and 2 Oct the bill went from about $10 to about $100 a fortnight and nothing in the
// repository said so. It changes nothing; what to do about a red day is a decision, not this script's.
//
//   GH_TOKEN  the workflow's token (actions: read)          REPO    owner/name
//   DAY       YYYY-MM-DD, UTC (default: yesterday)          BUDGET  billed minutes a day (default 600)
import { appendFileSync } from "node:fs";

const { GH_TOKEN, REPO, GITHUB_STEP_SUMMARY } = process.env;
if (!GH_TOKEN || !/^[\w.-]+\/[\w.-]+$/.test(REPO ?? "")) throw new Error("GH_TOKEN and REPO=owner/name are required");
const BUDGET = Number(process.env.BUDGET || 600);
const DAY = process.env.DAY || new Date(Date.now() - 86400000).toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(DAY) || !(BUDGET > 0)) throw new Error(`bad DAY ${DAY} or BUDGET ${BUDGET}`);

async function api(path) {
  const r = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    headers: { authorization: `Bearer ${GH_TOKEN}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" },
  });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
}

const runs = [];
for (let page = 1; ; page++) {
  const d = await api(`/actions/runs?created=${DAY}&per_page=100&page=${page}`);
  runs.push(...d.workflow_runs);
  if (d.workflow_runs.length < 100) break;
}

const perWorkflow = new Map();
let total = 0;
for (const run of runs) {
  let billed = 0;
  for (let page = 1; ; page++) {
    const d = await api(`/actions/runs/${run.id}/jobs?filter=all&per_page=100&page=${page}`);
    for (const j of d.jobs) {
      if (!j.started_at || !j.completed_at || j.conclusion === "skipped") continue;
      const s = (Date.parse(j.completed_at) - Date.parse(j.started_at)) / 1000;
      if (s > 0) billed += Math.ceil(s / 60);
    }
    if (d.jobs.length < 100) break;
  }
  const w = perWorkflow.get(run.name) ?? { runs: 0, billed: 0, cancelled: 0, failed: 0 };
  w.runs++; w.billed += billed;
  if (run.conclusion === "cancelled") w.cancelled++;
  if (run.conclusion === "failure") w.failed++;
  perWorkflow.set(run.name, w);
  total += billed;
}

const rows = [...perWorkflow.entries()].sort((a, b) => b[1].billed - a[1].billed);
const lines = [
  `### Actions spend on ${DAY} (UTC): ${total} billed minutes, budget ${BUDGET}`,
  "",
  "| Workflow | Runs | Billed min | Cancelled | Failed |",
  "|---|---:|---:|---:|---:|",
  ...rows.map(([n, w]) => `| ${n} | ${w.runs} | ${w.billed} | ${w.cancelled} | ${w.failed} |`),
  "",
  total > BUDGET
    ? `**Over budget by ${total - BUDGET} minutes.** The biggest line is «${rows[0]?.[0]}». Read it before the next dispatch (D-091).`
    : "Within budget.",
];
console.log(lines.join("\n"));
if (GITHUB_STEP_SUMMARY) appendFileSync(GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`);
if (total > BUDGET) process.exit(1);
