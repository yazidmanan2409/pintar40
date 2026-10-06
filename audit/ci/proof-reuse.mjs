// CI's first job (the CI efficiency gate, 6 Oct): before CI queues its jobs, two questions, each answered from the
// repository and the Actions API, read only.
//
// 1. ARE RUNNERS AVAILABLE? On 5 Oct, CI queued 35 jobs at a time while hosted runners were scarce. Most of them never
//    got a runner, waited 20 to 25 minutes (their timeouts), and were cancelled, and the whole run was attempted four
//    times. If any job of another run in this repository has been waiting longer than STARVED_MINUTES (default 10)
//    for a runner, CI does not add its own jobs to that queue: this job fails at once and says so. Dispatch again when
//    the queue has cleared. Nothing is lost by waiting; a run that cannot start proves nothing.
//
// 2. IS THIS CODE ALREADY PROVEN? On a working branch only (never on main: every release candidate runs in full), when
//    an earlier CI run succeeded on a commit whose files differ from this one only in paths no build, test or tool
//    reads, CI does not run again. It says which run proved the code, and exits green with every expensive job
//    skipped. The unread paths are UNREAD below, proven by search on 6 Oct and kept true by CI-W02, which fails if
//    any code starts reading them.
//
//   GH_TOKEN, REPO, GITHUB_REF_NAME, GITHUB_SHA, GITHUB_RUN_ID   from the workflow
//   STARVED_MINUTES                                              the starvation threshold (default 10)
// Writes `proven=true|false` and `proven_by=<run id>` to $GITHUB_OUTPUT.
import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

/** Paths nothing in the build, the tests or the tools reads (6 Oct). D-034 already treats docs/coordination as not code. */
export const UNREAD = [/^docs\/coordination\//, /^docs\/reports\//, /^docs\/deployment\//, /^\.github\/staging-[a-z-]+-request\.txt$/];

/** True when every changed path is one nothing reads, i.e. the code is the same. An empty list is the same code too. */
export const sameCode = (changed) => changed.every((p) => UNREAD.some((re) => re.test(p)));

/** Jobs of other runs waiting for a runner longer than `minutes`, at `now`. */
export function starved(jobs, now, minutes = 10) {
  return jobs.filter((j) => j.status === "queued" && j.created_at && (now - Date.parse(j.created_at)) / 60000 > minutes);
}

async function main() {
  const { GH_TOKEN, REPO, GITHUB_REF_NAME, GITHUB_SHA, GITHUB_RUN_ID, GITHUB_OUTPUT, GITHUB_STEP_SUMMARY } = process.env;
  const minutes = Number(process.env.STARVED_MINUTES || 10);
  const say = (s) => { console.log(s); if (GITHUB_STEP_SUMMARY) appendFileSync(GITHUB_STEP_SUMMARY, `${s}\n`); };
  const out = (k, v) => { if (GITHUB_OUTPUT) appendFileSync(GITHUB_OUTPUT, `${k}=${v}\n`); };
  async function api(path) {
    for (let attempt = 1; ; attempt++) {
      const r = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
        headers: { authorization: `Bearer ${GH_TOKEN}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" },
      }).catch(() => null);
      if (r?.ok) return r.json();
      if (r && r.status < 500) throw new Error(`${path}: HTTP ${r.status}`);
      if (attempt >= 3) throw new Error(`${path}: HTTP ${r?.status ?? "network"} after ${attempt} attempts`);
      await new Promise((ok) => setTimeout(ok, 2000 * attempt));
    }
  }

  // 1. starvation: the jobs of every other run that is queued or in progress
  const live = [];
  for (const status of ["queued", "in_progress"]) {
    const d = await api(`/actions/runs?status=${status}&per_page=50`);
    live.push(...d.workflow_runs.filter((r) => String(r.id) !== String(GITHUB_RUN_ID)));
  }
  const jobs = [];
  for (const r of live) jobs.push(...(await api(`/actions/runs/${r.id}/jobs?per_page=100`)).jobs);
  const waiting = starved(jobs, Date.now(), minutes);
  if (waiting.length) {
    say(`**Runners are starved:** ${waiting.length} job(s) of other runs have waited more than ${minutes} minutes for a runner ` +
        `(the longest: «${waiting[0].name}»). CI does not add its jobs to that queue. Dispatch again when it has cleared.`);
    process.exit(1);
  }

  // 2. already proven (working branches only)
  out("proven", "false");
  if (GITHUB_REF_NAME === "main") { say("On main every run is in full: no reuse."); return; }
  const done = await api(`/actions/workflows/ci.yml/runs?status=success&per_page=30`);
  for (const r of done.workflow_runs) {
    if (r.head_sha === GITHUB_SHA && String(r.id) === String(GITHUB_RUN_ID)) continue;
    let changed;
    try {
      changed = execFileSync("git", ["diff", "--name-only", r.head_sha, GITHUB_SHA], { encoding: "utf8" }).split("\n").filter(Boolean);
    } catch { continue; } // that commit is not in this checkout's history
    if (sameCode(changed)) {
      say(`**Already proven** by CI run ${r.id} on \`${r.head_sha.slice(0, 7)}\` (${r.html_url}): ` +
          (changed.length ? `this commit differs only in paths nothing reads (${changed.length} file(s)).` : "the same commit.") +
          " Every expensive job is skipped.");
      out("proven", "true"); out("proven_by", r.id);
      return;
    }
  }
  say("Not proven by an earlier run: CI runs in full.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
