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
 *   db     selftest/db/fable0N.sql, one file per phase, applied in order via
 *          psql against $SUPABASE_DB_URL
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

/**
 * Next.js server modules — anything importing `server-only`, which is every
 * module that may touch a secret — resolve to a throwing stub unless the
 * `react-server` export condition is on. A static test that drives a real route
 * handler therefore cannot import it at all under plain Node, which is how
 * F04-S05 first failed. Re-exec once with the condition rather than asking
 * every entry point (npm script, CI red case, a developer's `npx tsx`) to
 * remember the flag. `PINTAR_SELFTEST_RSC` makes the re-exec idempotent.
 */
if (!process.env.PINTAR_SELFTEST_RSC) {
  const r = spawnSync(
    process.execPath,
    [...process.execArgv, "--conditions=react-server", __filename, ...process.argv.slice(2)],
    { stdio: "inherit", env: { ...process.env, PINTAR_SELFTEST_RSC: "1" } },
  );
  process.exit(r.status ?? 1);
}

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
/**
 * One SQL file per phase, applied in order. Every file after the first assumes
 * fable01's role-switch helpers, and each asserts that dependency itself rather
 * than trusting this list.
 */
const DB_RUNNERS = [
  { file: "fable01.sql", fn: "selftest.run_fable01()", done: "F01-DONE" },
  { file: "fable02.sql", fn: "selftest.run_fable02()", done: "F02-DONE" },
  { file: "fable03.sql", fn: "selftest.run_fable03()", done: "F03-DONE" },
  { file: "fable04.sql", fn: "selftest.run_fable04()", done: "F04-DONE" },
  { file: "fable05.sql", fn: "selftest.run_fable05()", done: "F05-DONE" },
] as const;

async function runDb(dbUrl: string): Promise<Outcome[]> {
  const allFailed = (why: string): Outcome[] =>
    manifest.tests.filter((t) => t.runner === "db").map((t) => ({ id: t.id, runner: "db", status: "FAIL", detail: why }));

  for (const r of DB_RUNNERS) {
    const define = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", r.file), dbUrl], { encoding: "utf8" });
    if (define.status !== 0) {
      return allFailed(`${r.file} definition failed: ${define.stderr.trim().split("\n").pop()}`);
    }
  }

  const union = DB_RUNNERS.map((r) => `select * from ${r.fn}`).join(" union all ");
  const q = `select coalesce(json_agg(json_build_object('id', r.test_id, 'ok', r.ok, 'detail', r.detail)), '[]'::json) from (${union}) r`;
  const run = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", q, dbUrl], { encoding: "utf8" });
  if (run.status !== 0) {
    return allFailed(`runner aborted: ${run.stderr.trim().split("\n").pop()}`);
  }

  const rows = JSON.parse(run.stdout.trim()) as Array<{ id: string; ok: boolean; detail: string }>;
  const sentinels = DB_RUNNERS.map((r) => r.done as string);
  const out: Outcome[] = rows
    .filter((r) => !sentinels.includes(r.id))
    .map((r) => ({ id: r.id, runner: "db", status: r.ok ? "PASS" : "FAIL", detail: r.detail }));
  for (const r of DB_RUNNERS) {
    const done = rows.find((x) => x.id === r.done);
    if (!done?.ok) out.push({ id: r.done, runner: "db", status: "FAIL", detail: `${r.file} did not reach its end` });
  }
  out.push(await runDbConcurrency(dbUrl));
  return out;
}

/**
 * F02-C01 — INV-28 under real concurrency.
 *
 * A single connection cannot prove this: `ON CONFLICT DO NOTHING` then re-read,
 * and `SELECT` then `INSERT`, behave identically when nothing else is running.
 * The property only has meaning when two callers hold the same receipt at once,
 * so this drives two real psql connections. Connection A takes the receipt and
 * holds its transaction open; B arrives mid-flight with a DIFFERENT answer.
 * Correct behaviour is that the unique index arbitrates: A wins, B is refused
 * as a conflict rather than overwriting, and exactly one row with one digest
 * survives. A shape that read before it wrote would let both observe "nothing
 * there" and produce two rows or a silent overwrite.
 */
async function runDbConcurrency(dbUrl: string): Promise<Outcome> {
  const id = "F02-C01";
  const psql = (sql: string) =>
    spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, dbUrl], { encoding: "utf8" });
  const fail = (detail: string): Outcome => {
    psql("select selftest.concurrency_teardown()");
    return { id, runner: "db", status: "FAIL", detail };
  };

  const fixture = psql("select selftest.concurrency_fixture()");
  if (fixture.status !== 0) return fail(`fixture failed: ${fixture.stderr.trim().split("\n").pop()}`);
  const receipt = fixture.stdout.trim();

  const race = (sql: string) =>
    new Promise<{ code: number; out: string }>((done) => {
      const p = spawn("psql", ["-At", "-c", sql, dbUrl], { stdio: ["ignore", "pipe", "pipe"] });
      let buf = "";
      p.stdout.setEncoding("utf8");
      p.stderr.setEncoding("utf8");
      p.stdout.on("data", (d: string) => (buf += d));
      p.stderr.on("data", (d: string) => (buf += d));
      p.on("close", (code: number | null) => done({ code: code ?? 1, out: buf.trim() }));
    });

  const holder = race(
    `begin; select outcome from public.submit_response('${receipt}'::uuid,1,'{"pilihan":"A"}'::jsonb);` +
      ` select pg_sleep(1); commit;`,
  );
  await new Promise((r) => setTimeout(r, 300));
  const [a, b] = await Promise.all([
    holder,
    race(`select outcome from public.submit_response('${receipt}'::uuid,1,'{"pilihan":"B"}'::jsonb);`),
  ]);

  const verdict = psql(`select ok::text || '|' || detail from selftest.concurrency_verdict('${receipt}'::uuid, 1)`);
  const surviving = psql(
    `select value::text from public.responses where presented_item_id='${receipt}'::uuid and client_seq=1`,
  ).stdout.trim();
  psql("select selftest.concurrency_teardown()");

  const problems: string[] = [];
  if (!a.out.includes("RECORDED")) problems.push(`the holder did not record the receipt (${a.out.slice(0, 80)})`);
  if (b.code === 0) problems.push("the conflicting writer was not refused");
  if (!b.out.includes("already carries a different answer")) {
    problems.push(`the conflicting writer failed for the wrong reason (${b.out.slice(0, 80)})`);
  }
  if (!verdict.stdout.trim().startsWith("true|")) problems.push(`row check: ${verdict.stdout.trim()}`);
  if (!surviving.includes('"A"')) problems.push(`the winner's answer did not survive (${surviving})`);

  return problems.length
    ? { id, runner: "db", status: "FAIL", detail: problems.join("; ") }
    : {
        id,
        runner: "db",
        status: "PASS",
        detail: `two connections contested one receipt: holder RECORDED, concurrent conflicting writer refused, ${verdict.stdout.trim().split("|")[1]}`,
      };
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
    log(`\n[db] ${DB_RUNNERS.map((r) => "selftest/db/" + r.file).join(", ")}`);
    outcomes.push(...(await runDb(dbUrl!)));
  } else {
    for (const t of manifest.tests.filter((t) => t.runner === "db" && (!only || only.includes(t.id)))) {
      outcomes.push({ id: t.id, runner: "db", status: "SKIP", detail: "facility missing: db" });
    }
  }

  // static + app
  const port = Number(process.env.SELFTEST_APP_PORT ?? 3999);
  let app: { child: ChildProcess; url: string } | null = null;
  const needsApp = !only || appTests.some((t) => only.includes(t.id) && (t.requires ?? []).includes("app"));
  if (needsApp) {
    try {
      log("\n[app] starting production-mode app");
      app = await startApp(port);
    } catch (e) {
      log(`  ${(e as Error).message}`);
      facilities.delete("app");
    }
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
    if (o.id.endsWith("-DONE")) {
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
