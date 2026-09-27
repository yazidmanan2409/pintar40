// Scratch: the page each save returns to, timed server-side, with the fake's per-call latency.
// Usage: node ukur-tulis.mjs <repoDir> <port> <label>
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const [repo, port, label] = [process.argv[2], Number(process.argv[3]), process.argv[4]];
const { createServerClient } = createRequire(repo + "/package.json")("@supabase/ssr");
const LOG = `/tmp/tulis-${port}.log`; writeFileSync(LOG, "");
const SUPA = "http://127.0.0.1:54321";
const app = spawn(process.execPath, [repo + "/node_modules/next/dist/bin/next", "start", "-p", String(port)], {
  cwd: repo, env: { ...process.env, NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: SUPA, NEXT_PUBLIC_SUPABASE_ANON_KEY: "fake",
    SELFTEST_FETCH_LOG: LOG, NODE_OPTIONS: `--require ${repo}/selftest/hitung-fetch.cjs` }, stdio: "ignore" });
const base = `http://127.0.0.1:${port}`;
for (let i = 0; i < 120; i++) { try { await fetch(base + "/masuk"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
const masuk = async (email) => { const jar = new Map();
  const c = createServerClient(SUPA, "fake", { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) } });
  await c.auth.signInWithPassword({ email, password: "x" }); return [...jar].map(([n, v]) => `${n}=${v}`).join("; "); };
const sys = await masuk("sysadmin@synthetic.pintar.test"), admin = await masuk("alpha-admin@synthetic.pintar.test"), guru = await masuk("alpha-guru@synthetic.pintar.test");
const kasus = [
  ["grant (Berikan peran → Konfigurasi)", sys, "/konfigurasi?bagian=roles&hasil=ok"],
  ["structure step (→ Konfigurasi re-read)", admin, "/konfigurasi"],
  ["Studio step (→ the package page)", sys, "/studio/paket/11111111-1111-4111-8111-111111111111"],
  ["Sediakan (→ the class page)", guru, "/mengajar/33333333-3333-4333-8333-333333333333"],
];
await fetch(base + "/konfigurasi", { headers: { cookie: sys } }); // warm
for (const [nama, cookie, jalan] of kasus) {
  const ms = [], n = [];
  for (let i = 0; i < 3; i++) {
    const a = readFileSync(LOG, "utf8").split("\n").filter(Boolean).length; const t0 = Date.now();
    const r = await fetch(base + jalan, { headers: { cookie }, redirect: "manual" }); await r.text();
    ms.push(Date.now() - t0); n.push(readFileSync(LOG, "utf8").split("\n").filter(Boolean).length - a);
    if (i === 0) var status = r.status;
  }
  ms.sort((x, y) => x - y);
  console.log(`${label} | ${nama} | ${status} | ${n[1]} calls | median ${ms[1]} ms (+1 write call)`);
}
app.kill("SIGTERM");
