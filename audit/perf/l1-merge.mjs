// STAGING ONLY. L1 (D-031, D-035): every shard's calls and read-back, and the database's figures, judged against
// D-031's pass criteria: no answer lost or duplicated; server errors under 0.1% (deliberate refusals, which are
// 4xx with a PINTAR code, excluded); answer save p95 under 1 s and p99 under 3 s; no connection-pool exhaustion
// (no 5xx/timeouts from PostgREST under load); the database back at its baseline within 10 minutes of the wave.
// Reads IN_DIR/**/calls-*.json, summary-*.json, metrics.json. Writes the verdict to the step summary and exits 1
// when L1 is not met. Staging is not production's compute tier (CAP-08): the result says so.
import { readdirSync, readFileSync, statSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const IN = process.env.IN_DIR ?? "in";
// the answer save D-031 times: record_answer for the RPC wave (perf/l1.mjs), the press-to-«Tersimpan» for the
// real app's (perf/l1-browser.mjs, L1_MODE=browser)
const BROWSER = process.env.L1_MODE === "browser";
const SAVE = BROWSER ? "simpan" : "record_answer";
const files = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? files(p) : [p]; });
const all = files(IN);
const calls = all.filter((f) => /calls-\d+\.json$/.test(f)).flatMap((f) => JSON.parse(readFileSync(f, "utf8")));
const sums = all.filter((f) => /summary-\d+\.json$/.test(f)).map((f) => JSON.parse(readFileSync(f, "utf8")));
const mf = all.find((f) => /metrics\.json$/.test(f));
const metrics = mf ? JSON.parse(readFileSync(mf, "utf8")) : [];

const q = (xs, p) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const by = new Map();
for (const c of calls) { const a = by.get(c.name) ?? []; a.push(c); by.set(c.name, a); }
const isServerError = (c) => c.err || c.status === 0 || c.status >= 500;
const isRefusal = (c) => c.status >= 400 && c.status < 500;

const lines = [];
const say = (s) => { console.log(s); lines.push(s); };
const tot = (k) => sums.reduce((n, s) => n + (Number(s[k]) || 0), 0);
say(`### L1 on staging: ${tot("learners")} learner(s) over ${sums.length} shard(s)`);
say("");
say(`Sessions made ahead (SETUP): ${tot("minted")} (failed ${tot("mintFail")}). Sittings started ${tot("started")}, finished ${tot("finished")}; ` +
  `answers acknowledged ${tot("answers_acknowledged")}; lost ${tot("answers_lost")}; duplicated ${tot("answers_duplicated")}; ` +
  `finished without a result ${tot("finished_without_result")}. Longest shard wave ${Math.max(0, ...sums.map((s) => s.wave_s ?? 0))} s.`);
say("");
say("| Call | n | p50 ms | p95 ms | p99 ms | max ms | server errors | refusals |");
say("|---|---:|---:|---:|---:|---:|---:|---:|");
for (const [name, cs] of [...by].sort((a, b) => b[1].length - a[1].length)) {
  const ms = cs.map((c) => c.ms);
  say(`| ${name} | ${cs.length} | ${q(ms, 0.5)} | ${q(ms, 0.95)} | ${q(ms, 0.99)} | ${Math.max(...ms)} | ${cs.filter(isServerError).length} | ${cs.filter(isRefusal).length} |`);
}
const refusalCodes = new Map();
for (const c of calls.filter(isRefusal)) { const k = `${c.name} ${c.status} ${c.code ?? "-"}`; refusalCodes.set(k, (refusalCodes.get(k) ?? 0) + 1); }
if (refusalCodes.size) { say(""); say(`Refusals by call and code: ${[...refusalCodes].map(([k, n]) => `${k} ×${n}`).join("; ")}`); }

// requests per 10 s through the wave (load shape)
const bucket = new Map();
for (const c of calls) { const b = Math.floor(c.at / 10000); bucket.set(b, (bucket.get(b) ?? 0) + 1); }
const peak = Math.max(0, ...bucket.values()) / 10;
const waveEnd = Math.max(0, ...calls.map((c) => c.at + c.ms));
say(""); say(`Peak load ${peak.toFixed(1)} requests/s; the wave ended ${Math.round(waveEnd / 1000)} s after T0.`);
if (BROWSER) {
  const sum = (k) => { const m = new Map(); for (const x of sums) for (const [r, n] of Object.entries(x[k] ?? {})) m.set(r, (m.get(r) ?? 0) + n); return [...m]; };
  const batal = sum("cancelled_by_browser"), gagal = sum("failed_requests");
  say(`Requests the browser itself cancelled (not server answers, not counted as errors): ${batal.length ? batal.map(([r, n]) => `${r} ×${n}`).join("; ") : "none"}.`);
  say(`Requests that failed otherwise (counted as server errors): ${gagal.length ? gagal.map(([r, n]) => `${r} ×${n}`).join("; ") : "none"}.`);
}

// the database's figures: CPU busy share and backends, baseline (before T0) vs peak vs after the wave
function cpuBusy(a, b) {
  let idle = 0, total = 0;
  for (const [k, v] of Object.entries(b.series)) {
    if (!k.startsWith("node_cpu_seconds_total")) continue;
    const d = v - (a.series[k] ?? v);
    total += d; if (/mode="idle"/.test(k)) idle += d;
  }
  return total > 0 ? 1 - idle / total : null;
}
const backends = (s) => { let n = null; for (const [k, v] of Object.entries(s.series)) if (/^pg_stat_database_num_?backends/.test(k) || /^pg_stat_activity_count/.test(k)) n = (n ?? 0) + v; return n; };
const pts = [];
for (let i = 1; i < metrics.length; i++) pts.push({ at: metrics[i].at, cpu: cpuBusy(metrics[i - 1], metrics[i]), be: backends(metrics[i]) });
const base = pts.filter((p) => p.at < 0 && p.cpu != null);
const avg = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
const baseCpu = avg(base.map((p) => p.cpu)), baseBe = avg(base.map((p) => p.be).filter((x) => x != null));
const during = pts.filter((p) => p.at >= 0 && p.at <= waveEnd && p.cpu != null);
const peakCpu = Math.max(0, ...during.map((p) => p.cpu)), peakBe = Math.max(0, ...during.map((p) => p.be ?? 0));
const after = pts.filter((p) => p.at > waveEnd && p.cpu != null);
const backAt = after.find((p) => baseCpu != null && p.cpu <= Math.max(baseCpu * 1.5, baseCpu + 0.05) && (baseBe == null || p.be == null || p.be <= baseBe * 1.2 + 2));
const recoveryS = backAt ? Math.round((backAt.at - waveEnd) / 1000) : null;
say("");
if (!metrics.length || baseCpu == null) say("The database's figures: not read (the metrics endpoint gave nothing); CAP-07 is not judged.");
else say(`The database: CPU busy ${(baseCpu * 100).toFixed(0)}% before, peak ${(peakCpu * 100).toFixed(0)}% during; backends ${baseBe?.toFixed(0) ?? "-"} before, ` +
  `peak ${peakBe.toFixed(0)}; back at its baseline ${recoveryS == null ? "NOT within the sampled window" : `${recoveryS} s after the wave`}.`);

// verdict (D-031)
// failed saves stay in, as in every run; the browser's save through a planned network loss (simpan_luring) is not a
// save's latency and is reported in the call table only
const saves = (by.get(SAVE) ?? []).map((c) => c.ms);
const p95 = q(saves, 0.95), p99 = q(saves, 0.99);
const serverErr = calls.filter(isServerError).length;
const errRate = calls.length ? serverErr / calls.length : 1;
const checks = [
  ["every learner sat and finished", tot("started") === tot("learners") && tot("finished") === tot("started") && tot("learners") > 0],
  ["no answer lost", tot("answers_lost") === 0],
  ["no answer duplicated", tot("answers_duplicated") === 0],
  ["every finished sitting has its result", tot("finished_without_result") === 0],
  [`server errors under 0.1% (${serverErr} of ${calls.length}, ${(errRate * 100).toFixed(3)}%)`, errRate < 0.001],
  [`answer save p95 under 1 s (${p95} ms)`, p95 != null && p95 < 1000],
  [`answer save p99 under 3 s (${p99} ms)`, p99 != null && p99 < 3000],
  [`back at baseline within 10 minutes (CAP-07: ${recoveryS == null ? "not seen" : `${recoveryS} s`})`, recoveryS != null && recoveryS <= 600],
];
say(""); say("| D-031 criterion | Met |"); say("|---|---|");
for (const [k, ok] of checks) say(`| ${k} | ${ok ? "yes" : "**no**"} |`);
const met = checks.every(([, ok]) => ok);
// the run's own validity, apart from D-031: this scenario expects no refusal at all (one start per learner, valid
// answers, a complete manifest), so any refusal is a defect of the harness or of PINTAR and the run is not a measure
const refused = calls.filter(isRefusal).length + sums.reduce((n, s) => n + (s.refusals?.length ?? 0), 0);
say(""); say(refused ? `**RUN INVALID as a measure:** ${refused} refusal(s) in a scenario that expects none (above); diagnose before reading the figures.`
  : "Run valid: no refusal in a scenario that expects none.");
say(""); say(`**${tot("learners")} learners ${met ? "MET" : "NOT MET"} D-031 on staging.** Staging is not yet on production's compute tier (CAP-08): this measures staging. ` +
  "Sessions were made ahead by Auth's admin link (SETUP); the card sign-in wave is CAP-01, run after the forwarding key (D-062(c)). " +
  (BROWSER
    ? "Learners used the real app in Chromium (pages, server actions, the player's own timer and outbox); an answer save is timed " +
      "from the press to «Tersimpan», including the Next.js server; each Pemetaan Awal was sat beforehand (SETUP)."
    : "Learners called PINTAR's learner RPCs with their own tokens, plus Auth's /user check per request as the app's proxy does; the " +
      "Next.js server's own time is not in these figures."));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
if (!met || refused) process.exit(1);
