/**
 * `npm run selftest` — runs exactly the manifest (selftest/manifest.json),
 * nothing more and nothing less (doc 16 §4; FABLE-01 §1).
 *
 * Exit code is non-zero when any test FAILS, when any manifest id is not
 * reported by its runner, when a runner reports an id the manifest does not
 * list, or when a test is SKIPPED for a missing facility — unless the
 * manifest carries a `skip_justification` for that id AND the caller passed
 * `--accept-justified-skips` (`npm run selftest:local`). CI never passes
 * that flag: there every facility is present, so a skip is a failure.
 *
 * Runners:
 *   db     selftest/db/fable01.sql via psql against $SUPABASE_DB_URL
 *   static selftest/static.test.ts (repository + production build)
 *   app    selftest/app.test.ts (production-mode `next start`, plus the
 *          Supabase project's HTTP surface when reachable)
 */
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { staticTests } from "./static.test";
import { appTests } from "./app.test";
import type { Context, Facility, SelfTest, Verdict } from "./lib";

type ManifestTest = { id: string; runner: "db" | "static" | "app"; proves: string; skip_justification?: string };
type Manifest = { contract: string; version: number; phase: string; tests: ManifestTest[] };
type Outcome = { id: string; runner: string; status: "PASS" | "FAIL" | "SKIP"; detail: string };

const repoRoot = resolve(__dirname, "..");
const NEXT_BIN = join(repoRoot, "node_modules", "next", "dist", "bin", "next");
const args = new Set(process.argv.slice(2));
const acceptJustifiedSkips = args.has("--accept-justified-skips");
const only = [...args].find((a) => a.startsWith("--only="))?.slice(7).split(",");

const manifest: Manifest = JSON.parse(readFileSync(join(repoRoot, "selftest", "manifest.json"), "utf8"));
const byId = new Map(manifest.tests.map((t) => [t.id, t]));

function log(line = "") {
  process.stdout.write(line + "\n");
}

function loadDotEnvLocal() {
  const p = join(repoRoot, ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
}

// ---------------------------------------------------------------- facilities
async function probeNetwork(url: string | undefined, anon: string | undefined): Promise<boolean> {
  if (!url || !anon) return false;
  try {
    const r = await fetch(`${url}/auth/v1/health`, { headers: { apikey: anon }, signal: AbortSignal.timeout(6000) });
    return r.ok;
  } catch {
    return false;
  }
}

function hasPsql(): boolean {
  return spawnSync("psql", ["--version"], { stdio: "ignore" }).status === 0;
}

// ---------------------------------------------------------------- db runner
function runDb(dbUrl: string): Outcome[] {
  const define = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", "fable01.sql"), dbUrl], { encoding: "utf8" });
  if (define.status !== 0) {
    return manifest.tests.filter((t) => t.runner === "db").map((t) => ({ id: t.id, runner: "db", status: "FAIL", detail: `runner definition failed: ${define.stderr.trim().split("\n").pop()}` }));
  }
  const q = "select coalesce(json_agg(json_build_object('id', r.test_id, 'ok', r.ok, 'detail', r.detail)), '[]'::json) from selftest.run_fable01() r";
  const run = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", q, dbUrl], { encoding: "utf8" });
  if (run.status !== 0) {
    return manifest.tests.filter((t) => t.runner === "db").map((t) => ({ id: t.id, runner: "db", status: "FAIL", detail: `runner aborted: ${run.stderr.trim().split("\n").pop()}` }));
  }
  const rows = JSON.parse(run.stdout.trim()) as Array<{ id: string; ok: boolean; detail: string }>;
  const done = rows.find((r) => r.id === "F01-DONE");
  const out: Outcome[] = rows.filter((r) => r.id !== "F01-DONE").map((r) => ({ id: r.id, runner: "db", status: r.ok ? "PASS" : "FAIL", detail: r.detail }));
  if (!done?.ok) out.push({ id: "F01-DONE", runner: "db", status: "FAIL", detail: "db runner did not reach its end" });
  return out;
}

// ---------------------------------------------------------------- app process
async function startApp(port: number): Promise<{ child: ChildProcess; url: string }> {
  if (!existsSync(join(repoRoot, ".next", "BUILD_ID"))) {
    log("  building production bundle (.next/BUILD_ID missing)…");
    const b = spawnSync(process.execPath, [NEXT_BIN, "build"], { cwd: repoRoot, stdio: "inherit", env: process.env });
    if (b.status !== 0) throw new Error("next build failed");
  }
  const child = spawn(process.execPath, [NEXT_BIN, "start", "-p", String(port)], { cwd: repoRoot, env: { ...process.env, NODE_ENV: "production" }, stdio: ["ignore", "pipe", "pipe"] });
  let logs = "";
  child.stdout?.on("data", (d) => (logs += d));
  child.stderr?.on("data", (d) => (logs += d));
  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${url}/masuk`, { redirect: "manual", signal: AbortSignal.timeout(2000) });
      if (r.status > 0) return { child, url };
    } catch {
      /* not up yet */
    }
    if (child.exitCode !== null) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  child.kill("SIGTERM");
  throw new Error(`app did not start on ${url}\n${logs.slice(-2000)}`);
}

// ---------------------------------------------------------------- ts runners
async function runTests(tests: SelfTest[], runner: string, ctx: Context, facilities: Set<Facility>): Promise<Outcome[]> {
  const out: Outcome[] = [];
  for (const test of tests) {
    if (only && !only.includes(test.id)) continue;
    const missing = (test.requires ?? []).filter((f) => !facilities.has(f));
    if (missing.length) {
      out.push({ id: test.id, runner, status: "SKIP", detail: `facility missing: ${missing.join(", ")}` });
      continue;
    }
    let v: Verdict;
    try {
      v = await test.run(ctx);
    } catch (e) {
      v = { ok: false, detail: `threw: ${(e as Error).message}` };
    }
    out.push({ id: test.id, runner, status: v.ok ? "PASS" : "FAIL", detail: v.detail });
  }
  return out;
}

// ---------------------------------------------------------------- main
async function main() {
  loadDotEnvLocal();
  log(`PINTAR selftest — ${manifest.contract} v${manifest.version} (${manifest.phase}); ${manifest.tests.length} manifest ids`);

  const facilities = new Set<Facility>();
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (dbUrl && hasPsql()) facilities.add("db");
  facilities.add("app");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (await probeNetwork(supabaseUrl, anon)) facilities.add("network");
  let ciUpstream: Record<string, string> | null = null;
  if (process.env.GITHUB_ACTIONS === "true") {
    facilities.add("ci");
    try {
      ciUpstream = JSON.parse(process.env.SELFTEST_CI_UPSTREAM ?? "{}");
    } catch {
      ciUpstream = {};
    }
  }
  log(`facilities: ${[...facilities].join(", ") || "none"}${dbUrl && !facilities.has("db") ? " (SUPABASE_DB_URL set but psql not found)" : ""}`);

  const outcomes: Outcome[] = [];

  // db
  if (facilities.has("db")) {
    log("\n[db] selftest/db/fable01.sql");
    outcomes.push(...runDb(dbUrl!));
  } else {
    for (const t of manifest.tests.filter((t) => t.runner === "db" && (!only || only.includes(t.id)))) {
      outcomes.push({ id: t.id, runner: "db", status: "SKIP", detail: "facility missing: db" });
    }
  }

  // static + app
  const port = Number(process.env.SELFTEST_APP_PORT ?? 3999);
  let app: { child: ChildProcess; url: string } | null = null;
  try {
    log("\n[app] starting production-mode app");
    app = await startApp(port);
  } catch (e) {
    log(`  ${(e as Error).message}`);
    facilities.delete("app");
  }
  const ctx: Context = {
    repoRoot,
    appUrl: app?.url ?? null,
    supabaseUrl: facilities.has("network") ? supabaseUrl! : null,
    supabaseAnonKey: facilities.has("network") ? anon! : null,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? null,
    ciUpstream,
  };
  try {
    log("\n[static] selftest/static.test.ts");
    outcomes.push(...(await runTests(staticTests, "static", ctx, facilities)));
    log("\n[app] selftest/app.test.ts");
    outcomes.push(...(await runTests(appTests, "app", ctx, facilities)));
  } finally {
    app?.child.kill("SIGTERM");
  }

  // ---------------------------------------------------------- reconcile
  const problems: string[] = [];
  const reported = new Map<string, Outcome>();
  for (const o of outcomes) {
    if (o.id === "F01-DONE") {
      problems.push(o.detail);
      continue;
    }
    if (reported.has(o.id)) problems.push(`${o.id} reported twice`);
    reported.set(o.id, o);
    if (!byId.has(o.id)) problems.push(`${o.id} reported by the ${o.runner} runner but absent from the manifest`);
  }
  for (const t of manifest.tests) {
    if (only && !only.includes(t.id)) continue;
    if (!reported.has(t.id)) problems.push(`${t.id} listed in the manifest but not reported by the ${t.runner} runner`);
  }

  log("\nid          status  detail");
  let failed = 0, skipped = 0, passed = 0, justified = 0;
  for (const t of manifest.tests) {
    const o = reported.get(t.id);
    if (!o) continue;
    let status: string = o.status;
    if (o.status === "SKIP") {
      const ok = acceptJustifiedSkips && Boolean(t.skip_justification);
      if (ok) { justified++; status = "SKIP*"; } else skipped++;
    } else if (o.status === "PASS") passed++;
    else failed++;
    log(`${t.id.padEnd(11)} ${status.padEnd(7)} ${o.detail}${o.status === "SKIP" && t.skip_justification ? ` — justification: ${t.skip_justification}` : ""}`);
  }
  for (const p of problems) log(`CONTRACT    FAIL    ${p}`);

  const ok = failed === 0 && skipped === 0 && problems.length === 0;
  log(`\n${passed} passed, ${failed} failed, ${skipped} skipped${justified ? `, ${justified} justified skips accepted (local only)` : ""}, ${problems.length} contract problem(s) → ${ok ? "GREEN" : "RED"}`);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  log(`selftest runner crashed: ${(e as Error).stack ?? e}`);
  process.exit(2);
});
