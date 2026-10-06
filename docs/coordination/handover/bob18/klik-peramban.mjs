// Scratch: what a real browser click costs, counted by selftest/hitung-fetch.cjs.
// Usage: node klik-peramban.mjs <repoDir> <port>
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const [repo, port] = [process.argv[2], Number(process.argv[3] ?? 3998)];
const req = createRequire(repo + "/package.json");
const { createServerClient } = req("@supabase/ssr");
const { chromium } = createRequire("/opt/node22/lib/node_modules/")("playwright");
const LOG = `/tmp/klik-${port}.log`; writeFileSync(LOG, "");
const SUPA = "http://127.0.0.1:54321";
const app = spawn(process.execPath, [repo + "/node_modules/next/dist/bin/next", "start", "-p", String(port)], {
  cwd: repo, env: { ...process.env, NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: SUPA, NEXT_PUBLIC_SUPABASE_ANON_KEY: "fake",
    SELFTEST_FETCH_LOG: LOG, NODE_OPTIONS: `--require ${repo}/selftest/hitung-fetch.cjs` }, stdio: "ignore" });
const base = `http://127.0.0.1:${port}`;
for (let i = 0; i < 60; i++) { try { await fetch(base + "/masuk"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
const jar = new Map();
const c = createServerClient(SUPA, "fake", { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) } });
await c.auth.signInWithPassword({ email: "sysadmin@synthetic.pintar.test", password: "x" });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await browser.newContext();
await ctx.addCookies([...jar].map(([name, value]) => ({ name, value, url: base })));
const page = await ctx.newPage();
const hitung = () => readFileSync(LOG, "utf8").split("\n").filter(Boolean);
const ukur = async (nama, aksi) => {
  const a = hitung().length; const t0 = Date.now();
  await aksi(); await page.waitForLoadState("networkidle"); await new Promise((r) => setTimeout(r, 1500));
  const b = hitung().slice(a); const m = new Map(); for (const x of b) { const k = x.split(" ")[1]; m.set(k, (m.get(k) ?? 0) + 1); }
  console.log(`${nama}: ${b.length} calls in ${Date.now() - t0} ms incl. 1.5 s settle; ` + [...m].sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k.replace("/rest/v1/", "")} ${v}`).join(", "));
};
await ukur("open /studio", () => page.goto(base + "/studio"));
await ukur("click Tinjau", () => page.click('a[href="/studio/tinjau"]'));
await ukur("click Bank", () => page.click('a[href="/studio/bank"]'));
await browser.close(); app.kill("SIGTERM");
