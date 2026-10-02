// STAGING ONLY. L1 (D-031, CAP-07): the database's own figures before, during and after the wave, from Supabase's
// metrics endpoint (read only; HTTP basic auth as service_role). One sample every 30 s from T0 - 2 min (the
// baseline) until T0 + SAMPLE_MIN minutes. Kept as JSON for perf/l1-merge.mjs, which judges the recovery: the
// database back at its baseline within 10 minutes of the wave's end.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const SB = env("SUPABASE_URL");
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const SERVICE = env("SERVICE_KEY");
const T0 = Date.parse(env("T0"));
const UNTIL = T0 + Number(process.env.SAMPLE_MIN ?? 30) * 60000;
const OUT = process.env.OUT_DIR ?? "out";
if (!SB.includes(REF)) throw new Error("not staging");
mkdirSync(OUT, { recursive: true });

const WANT = /^(node_cpu_seconds_total|node_memory_MemAvailable_bytes|node_memory_MemTotal_bytes|node_load1|pg_stat_database_num_backends|pg_stat_database_numbackends|pg_stat_activity_count|pg_database_size_bytes|node_disk_io_time_seconds_total)\b/;
const auth = "Basic " + Buffer.from(`service_role:${SERVICE}`).toString("base64");
const pause = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

const samples = [];
await pause(T0 - 120000 - Date.now());
while (Date.now() < UNTIL) {
  const t = Date.now();
  const s = { at: t - T0, series: {} , err: null };
  try {
    const r = await fetch(`${SB}/customer/v1/privileged/metrics`, { headers: { Authorization: auth } });
    if (!r.ok) s.err = `HTTP ${r.status}`;
    else for (const line of (await r.text()).split("\n")) {
      if (!WANT.test(line)) continue;
      const m = /^([^\s{]+)(\{[^}]*\})?\s+([0-9.eE+-]+)/.exec(line);
      if (m) s.series[m[1] + (m[2] ?? "")] = Number(m[3]);
    }
  } catch (e) { s.err = String(e.message ?? e).slice(0, 120); }
  samples.push(s);
  console.log(JSON.stringify({ at_s: Math.round(s.at / 1000), series: Object.keys(s.series).length, err: s.err }));
  await pause(t + 30000 - Date.now());
}
writeFileSync(join(OUT, "metrics.json"), JSON.stringify(samples));
