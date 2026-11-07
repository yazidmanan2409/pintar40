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
import { createHash } from "node:crypto";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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
/**
 * TARGETED RUNS.
 *
 * Patterns come from `--only=A,B` or from bare arguments, so
 * `npm run selftest:only -- 'F07-*'` and `--only=F07-P14,F07-P15` are the same
 * request. `*` matches any run of characters; everything else is literal.
 *
 * The inner development loop is meant to run ONE suite. The full manifest is a
 * completion gate, not a way to inspect one refusal string: see
 * `pickedDbRunners` below, which is what makes a targeted run cheap rather
 * than merely quiet.
 */
const patterns = [
  ...[...args].filter((a) => a.startsWith("--only=")).flatMap((a) => a.slice(7).split(",")),
  ...[...args].filter((a) => !a.startsWith("-")).flatMap((a) => a.split(",")),
].map((p) => p.trim()).filter(Boolean);
const matches = (id: string, pattern: string) =>
  new RegExp(`^${pattern.split("*").map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`).test(id);

const manifest: Manifest = JSON.parse(readFileSync(join(repoRoot, "selftest", "manifest.json"), "utf8"));
const byId = new Map(manifest.tests.map((t) => [t.id, t]));

/** The manifest ids a targeted run asked for, or undefined for the whole manifest. */
const only = patterns.length
  ? manifest.tests.filter((t) => patterns.some((p) => matches(t.id, p))).map((t) => t.id)
  : undefined;
/** A pattern that names nothing is a typo, and a typo must not look like a green run. */
const unmatchedPatterns = patterns.filter((p) => !manifest.tests.some((t) => matches(t.id, p)));

function log(line = "") {
  process.stdout.write(line + "\n");
}

/**
 * EXIT ONLY AFTER THE RECORD IS WRITTEN. On a pipe -- which is what a CI log is --
 * process.stdout.write is asynchronous, and process.exit discards whatever is still
 * queued. CI #181 and #183 both lost the listing after 196 rows, and with it the
 * summary and the FAILED lines this file prints last so that they are the thing a
 * reader sees; only the exit status survived. The empty write's callback runs once
 * everything written before it has been handed over.
 */
function exitAfterFlush(code: number): void {
  process.exitCode = code;
  process.stdout.write("", () => process.exit(code));
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

/** BOB-25: the Mailpit sink every CI and local send goes to (SMTP 127.0.0.1:54325, API :54324). */
async function probeMailSink(): Promise<boolean> {
  try {
    const r = await fetch("http://127.0.0.1:54324/api/v1/info", { signal: AbortSignal.timeout(3000) });
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
  { file: "fable01.sql", fn: "selftest.run_fable01()", done: "F01-DONE", emits: ["F01-"] },
  { file: "fable02.sql", fn: "selftest.run_fable02()", done: "F02-DONE", emits: ["F02-"] },
  { file: "fable03.sql", fn: "selftest.run_fable03()", done: "F03-DONE", emits: ["F03-"] },
  { file: "fable04.sql", fn: "selftest.run_fable04()", done: "F04-DONE", emits: ["F04-"] },
  { file: "fable05.sql", fn: "selftest.run_fable05()", done: "F05-DONE", emits: ["F05-"] },
  { file: "fable05t1_quick_canonical.sql", fn: "selftest.run_quick_canonical()", done: "QAC-DONE", emits: ["QAC-"] },
  { file: "fable05t2_evaluation.sql", fn: "selftest.run_evaluation()", done: "EVAL-DONE", emits: ["EVAL-"] },
  { file: "fable06.sql", fn: "selftest.run_fable06()", done: "F06-DONE", emits: ["F06-", "Q12-", "TOUR-", "UX1-S2-ORIENT-"] },
  { file: "fable07.sql", fn: "selftest.run_fable07()", done: "F07-DONE", emits: ["F07-"] },
  { file: "fable08.sql", fn: "selftest.run_fable08()", done: "F08-DONE", emits: ["F08-"] },
  { file: "fable09.sql", fn: "selftest.run_fable09()", done: "F09-DONE", emits: ["F09-"] },
  { file: "fable10.sql", fn: "selftest.run_fable10()", done: "F10-DONE", emits: ["F10-"] },
  { file: "fable11.sql", fn: "selftest.run_fable11()", done: "F11-DONE", emits: ["F11-"] },
  { file: "fable12.sql", fn: "selftest.run_fable12()", done: "F12-DONE", emits: ["F12-"] },
  { file: "fable13.sql", fn: "selftest.run_fable13()", done: "F13-DONE", emits: ["F13-"] },
  { file: "fable14.sql", fn: "selftest.run_fable14()", done: "F14-DONE", emits: ["F14-"] },
  { file: "fable15.sql", fn: "selftest.run_fable15()", done: "F15-DONE", emits: ["F15-"] },
  { file: "fable16.sql", fn: "selftest.run_fable16()", done: "F16-DONE", emits: ["F16-"] },
  { file: "fable17.sql", fn: "selftest.run_fable17()", done: "F17-DONE", emits: ["F17-"] },
  { file: "fable18.sql", fn: "selftest.run_fable18()", done: "F18-DONE", emits: ["F18-"] },
  { file: "fable19.sql", fn: "selftest.run_fable19()", done: "F19-DONE", emits: ["F19-"] },
  { file: "fable20.sql", fn: "selftest.run_fable20()", done: "F20-DONE", emits: ["F20-"] },
  { file: "fable21.sql", fn: "selftest.run_fable21()", done: "F21-DONE", emits: ["F21-"] },
  { file: "fable22.sql", fn: "selftest.run_fable22()", done: "F22-DONE", emits: ["F22-"] },
  { file: "fable23.sql", fn: "selftest.run_fable23()", done: "F23-DONE", emits: ["F23-"] },
  { file: "fable24.sql", fn: "selftest.run_fable24()", done: "F24-DONE", emits: ["F24-"] },
  { file: "fable25.sql", fn: "selftest.run_fable25()", done: "F25-DONE", emits: ["F25-"] },
  { file: "fable26.sql", fn: "selftest.run_fable26()", done: "F26-DONE", emits: ["F26-"] },
  { file: "fable27.sql", fn: "selftest.run_fable27()", done: "F27-DONE", emits: ["F27-"] },
  { file: "fable28.sql", fn: "selftest.run_fable28()", done: "F28-DONE", emits: ["F28-"] },
  { file: "fable29.sql", fn: "selftest.run_fable29()", done: "F29-DONE", emits: ["F29-"] },
  { file: "fable30.sql", fn: "selftest.run_fable30()", done: "F30-DONE", emits: ["F30-"] },
  { file: "fable31.sql", fn: "selftest.run_fable31()", done: "F31-DONE", emits: ["F31-"] },
] as const;

/**
 * Which suites a targeted run actually EXECUTES.
 *
 * Every file is still DEFINED, because each one assumes the helpers the files
 * before it install, and defining is cheap. Executing is not: a suite builds
 * a world, drives it and tears it down. `--only=F07-P14` used to run all nine
 * suites and then print one line, which is how inspecting a single refusal
 * string came to cost minutes.
 *
 * `emits` is the id space each suite owns. The reconcile step below checks
 * that every db-runner manifest id falls inside exactly one suite's prefixes,
 * so a suite cannot be added without declaring what it emits and then be
 * silently skipped by every targeted run.
 */
function pickedDbRunners(): typeof DB_RUNNERS[number][] {
  if (!only) return [...DB_RUNNERS];
  return DB_RUNNERS.filter((r) => only.some((id) => r.emits.some((p) => id.startsWith(p))));
}

async function runDb(dbUrl: string): Promise<Outcome[]> {
  const allFailed = (why: string): Outcome[] =>
    manifest.tests.filter((t) => t.runner === "db").map((t) => ({ id: t.id, runner: "db", status: "FAIL", detail: why }));

  for (const r of DB_RUNNERS) {
    const define = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", r.file), dbUrl], { encoding: "utf8" });
    if (define.status !== 0) {
      return allFailed(`${r.file} definition failed: ${define.stderr.trim().split("\n").pop()}`);
    }
  }

  const picked = pickedDbRunners();
  if (picked.length === 0) return [];
  // The suites do not agree on what they call their first two columns — the
  // early ones say (test_id, invariant), the later ones (id, area) — and a
  // UNION takes its names from whichever select comes first. Naming the
  // columns here rather than reading `r.test_id` is what lets any single
  // suite be run on its own.
  const union = picked.map((r) => `select * from ${r.fn} as t(id, area, ok, detail)`).join(" union all ");
  const q = `select coalesce(json_agg(json_build_object('id', r.id, 'ok', r.ok, 'detail', r.detail)), '[]'::json) from (${union}) r`;
  const run = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", q, dbUrl], { encoding: "utf8" });
  if (run.status !== 0) {
    return allFailed(`runner aborted: ${run.stderr.trim().split("\n").pop()}`);
  }

  const rows = JSON.parse(run.stdout.trim()) as Array<{ id: string; ok: boolean; detail: string }>;
  const sentinels = picked.map((r) => r.done as string);
  const out: Outcome[] = rows
    .filter((r) => !sentinels.includes(r.id))
    .map((r) => ({ id: r.id, runner: "db", status: r.ok ? "PASS" : "FAIL", detail: r.detail }));
  for (const r of picked) {
    const done = rows.find((x) => x.id === r.done);
    if (!done?.ok) out.push({ id: r.done, runner: "db", status: "FAIL", detail: `${r.file} did not reach its end` });
  }
  // The two races drive their own connections rather than the union above, so
  // they are selected by id rather than by suite.
  if (!only || only.includes("F02-C01")) out.push(await runDbConcurrency(dbUrl));
  if (!only || only.includes("F07-C01")) out.push(await runFeedbackConcurrency(dbUrl));
  if (!only || only.includes("F09-C01")) out.push(runSignupOnAFreshConnection(dbUrl));
  if (!only || only.some((x) => /^F10-C0[1234]$/.test(x))) out.push(...(await runStructureConcurrency(dbUrl, only)));
  if (!only || only.includes("F15-C01")) out.push(await runCardConcurrency(dbUrl));
  if (!only || only.some((x) => /^F16-C0[123]$/.test(x))) out.push(...(await runIdentityConcurrency(dbUrl, only)));
  if (!only || only.includes("F17-C01")) out.push(await runEmailConcurrency(dbUrl));
  if (!only || only.includes("F05-C01")) out.push(await runMoveStartRace(dbUrl));
  return out;
}

/**
 * F15-C01 — BOB-12 (b): twenty guesses at one card at the same moment.
 *
 * A check that reads the count and then records the attempt would let every
 * parallel guess read "fewer than 5" and all twenty reach Auth. So twenty real
 * connections call card_signin_attempt for one card key at once, as the sign-in
 * route does (service_role): exactly 5 may go ahead, the other 15 are told to
 * wait about 30 s, and the card's row holds exactly 5 attempts. A sign-in then
 * clears it. The row is removed afterwards.
 */
async function runCardConcurrency(dbUrl: string): Promise<Outcome> {
  const kunci = createHash("sha256").update(`f15-c01|${Date.now()}|${Math.random()}`).digest("hex");
  const psql = (sql: string) => spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, dbUrl], { encoding: "utf8" });
  const satu = () =>
    new Promise<{ code: number; out: string }>((done) => {
      const p = spawn("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c",
        `set role service_role; select public.card_signin_attempt('${kunci}')`, dbUrl], { stdio: ["ignore", "pipe", "pipe"] });
      let buf = "";
      p.stdout.setEncoding("utf8");
      p.stderr.setEncoding("utf8");
      p.stdout.on("data", (d: string) => (buf += d));
      p.stderr.on("data", (d: string) => (buf += d));
      p.on("close", (code: number | null) => done({ code: code ?? 1, out: buf.trim() }));
    });
  const semua = await Promise.all(Array.from({ length: 20 }, satu));
  const tersimpan = psql(`select coalesce((select cardinality(percobaan) from public.card_signin_cooldowns where kunci = '${kunci}'), -1)`).stdout.trim();
  const selesai = psql(`set role service_role; select public.card_signin_settle('${kunci}', 'MASUK'); reset role; ` +
    `select count(*) from public.card_signin_cooldowns where kunci = '${kunci}'`).stdout.trim().split("\n").pop();
  psql(`delete from public.card_signin_cooldowns where kunci = '${kunci}'`);
  const problems: string[] = [];
  const gagal = semua.filter((r) => r.code !== 0 || !/^\d+$/.test(r.out.split("\n").pop() ?? ""));
  if (gagal.length) problems.push(`${gagal.length} attempt(s) failed: ${gagal[0].out.slice(0, 120)}`);
  const jawab = semua.map((r) => Number(r.out.split("\n").pop()));
  const maju = jawab.filter((v) => v === 0).length;
  const tunggu = jawab.filter((v) => v > 0);
  if (maju !== 5) problems.push(`${maju} of 20 simultaneous attempts went ahead to Auth; exactly 5 may`);
  if (tunggu.some((v) => v < 28 || v > 30)) problems.push(`the waits were ${[...new Set(tunggu)].join(", ")} s; each should be about 30`);
  if (tersimpan !== "5") problems.push(`the card's row holds ${tersimpan} attempt(s), expected 5`);
  if (selesai !== "0") problems.push("a sign-in after the race did not clear the card's record");
  return problems.length
    ? { id: "F15-C01", runner: "db", status: "FAIL", detail: problems.join("; ") }
    : { id: "F15-C01", runner: "db", status: "PASS", detail:
        `20 connections called card_signin_attempt for one card at the same moment: exactly 5 went ahead, the other 15 were told to ` +
        `wait ${Math.min(...tunggu)}-${Math.max(...tunggu)} s, the card's row holds exactly 5 attempts, and a sign-in then cleared it` };
}

/**
 * F17-C01 — BOB-25: two requests for the same email at the same moment. The
 * first reservation holds its row uncommitted (a slow send); ten more for the
 * same kind and address arrive while it does. email_send_reserve's one lock
 * makes them wait and then count it, so exactly one is allowed and ten are
 * refused by ADDRESS_KIND. Without the lock each would read "no send yet" and
 * be allowed: eleven codes for one address in the same second.
 */
async function runEmailConcurrency(dbUrl: string): Promise<Outcome> {
  const psql = (sql: string) => spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, dbUrl], { encoding: "utf8" });
  const race = (sql: string) =>
    new Promise<{ code: number; out: string }>((done) => {
      const p = spawn("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, dbUrl], { stdio: ["ignore", "pipe", "pipe"] });
      let buf = "";
      p.stdout.setEncoding("utf8");
      p.stderr.setEncoding("utf8");
      p.stdout.on("data", (d: string) => (buf += d));
      p.stderr.on("data", (d: string) => (buf += d));
      p.on("close", (code: number | null) => done({ code: code ?? 1, out: buf.trim() }));
    });
  const tag = `f17-c01-${Date.now().toString(36)}`;
  const h = createHash("sha256").update(`${tag}@local.invalid`).digest("hex");
  const problems: string[] = [];
  const first = race(`begin; select public.email_send_reserve('KODE_AKTIVASI', '${h}') ->> 'allowed'; select pg_sleep(1.5); commit;`);
  let holding = false;
  for (let i = 0; i < 100 && !holding; i++) {
    const r = psql(`select count(*) from pg_stat_activity where wait_event = 'PgSleep' and query like '%${h}%' and pid <> pg_backend_pid()`);
    holding = Number(r.stdout.trim()) >= 1;
    if (!holding) await new Promise((ok) => setTimeout(ok, 50));
  }
  if (!holding) problems.push("the first reservation never reached its held-open send");
  const rest = await Promise.all(Array.from({ length: 10 }, () =>
    race(`select public.email_send_reserve('KODE_AKTIVASI', '${h}') ->> 'allowed'`)));
  const firstOut = await first;
  const answers = [firstOut, ...rest].map((r) => (r.code === 0 ? r.out.split("\n").filter((l) => l === "true" || l === "false").pop() : `error: ${r.out.split("\n").pop()}`));
  const allowed = answers.filter((a) => a === "true").length;
  if (answers.some((a) => a?.startsWith("error"))) problems.push(`a reservation failed: ${answers.find((a) => a?.startsWith("error"))}`);
  if (allowed !== 1) problems.push(`${allowed} of 11 simultaneous reservations for one kind and address were allowed, expected 1`);
  const rows = psql(`select outcome || ':' || coalesce(limit_scope, '-') || ':' || count(*) from public.email_send_log where recipient_hash = '${h}' group by outcome, limit_scope order by outcome`).stdout.trim();
  if (rows !== "PENDING:-:1\nREFUSED_LIMIT:ADDRESS_KIND:10") problems.push(`the log holds [${rows.replace(/\n/g, ", ")}], expected one PENDING and ten ADDRESS_KIND refusals`);
  psql(`delete from public.email_send_log where recipient_hash = '${h}'`);
  return problems.length
    ? { id: "F17-C01", runner: "db", status: "FAIL", detail: problems.join("; ") }
    : { id: "F17-C01", runner: "db", status: "PASS", detail: "eleven reservations for one kind and address at the same moment, the first held open 1.5 s: exactly one was allowed, and the ten that arrived meanwhile waited on the lock and were refused by ADDRESS_KIND; the log holds one PENDING and ten refusals" };
}

/**
 * F16-C01..C03 — BOB-24, the identity foundation under real concurrency.
 *
 *   F16-C01  twenty connections each insert fifty persons inside a transaction
 *            they hold open together, then roll back: the thousand PINTAR IDs
 *            drawn side by side are all well-formed and distinct, no insert
 *            fails, and nothing is left behind.
 *   F16-C02  two staff people claim the same username at the same moment: the
 *            holder's claim is in, the other waits on it and is refused
 *            USERNAME_TAKEN, and one row holds the name.
 *   F16-C03  twenty wrong PINs for one typed ID at the same moment (as the
 *            recovery route, service_role): the ladder's row lock takes them one
 *            at a time, so exactly two are judged WRONG and one locks the ID for
 *            an hour, the rest are told it is locked, the ladder stands at level
 *            1, and the audit holds two wrongs and exactly one lock.
 */
async function runIdentityConcurrency(dbUrl: string, only: string[] | null | undefined): Promise<Outcome[]> {
  const psql = (sql: string) => spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, dbUrl], { encoding: "utf8" });
  const race = (sql: string) =>
    new Promise<{ code: number; out: string }>((done) => {
      const p = spawn("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, dbUrl], { stdio: ["ignore", "pipe", "pipe"] });
      let buf = "";
      p.stdout.setEncoding("utf8");
      p.stderr.setEncoding("utf8");
      p.stdout.on("data", (d: string) => (buf += d));
      p.stderr.on("data", (d: string) => (buf += d));
      p.on("close", (code: number | null) => done({ code: code ?? 1, out: buf.trim() }));
    });
  const asleep = async (marker: string, n = 1): Promise<boolean> => {
    for (let i = 0; i < 200; i++) {
      const r = psql(`select count(*) from pg_stat_activity where wait_event = 'PgSleep' and query like '%${marker}%' and pid <> pg_backend_pid()`);
      if (Number(r.stdout.trim()) >= n) return true;
      await new Promise((ok) => setTimeout(ok, 100));
    }
    return false;
  };
  const want = (id: string) => !only || only.includes(id);
  const out: Outcome[] = [];
  const hasil = (id: string, problems: string[], pass: string): Outcome =>
    problems.length ? { id, runner: "db", status: "FAIL", detail: problems.join("; ") } : { id, runner: "db", status: "PASS", detail: pass };

  if (want("F16-C01")) {
    const tag = `selftest f16 c01 ${Date.now().toString(36)}`;
    const semua = await Promise.all(Array.from({ length: 20 }, () =>
      race(`begin; insert into public.persons (display_name) select '${tag}' from generate_series(1, 50) returning 'ID:' || pintar_id; ` +
        `select pg_sleep(1.5); rollback;`)));
    const problems: string[] = [];
    const gagal = semua.filter((r) => r.code !== 0);
    if (gagal.length) problems.push(`${gagal.length} of 20 connections failed: ${gagal[0].out.split("\n").pop()?.slice(0, 120)}`);
    const ids = semua.flatMap((r) => r.out.split("\n").filter((l) => l.startsWith("ID:")).map((l) => l.slice(3)));
    const buruk = ids.filter((x) => !/^[0-9A-HJKMNP-TV-Z]{8}$/.test(x));
    if (ids.length !== 1000) problems.push(`${ids.length} of 1000 inserts returned a PINTAR ID`);
    if (buruk.length) problems.push(`${buruk.length} ID(s) fall outside the alphabet, e.g. ${buruk[0]}`);
    if (new Set(ids).size !== ids.length) problems.push(`${ids.length - new Set(ids).size} ID(s) were drawn twice`);
    const tinggal = psql(`select count(*) from public.persons where display_name = '${tag}'`).stdout.trim();
    if (tinggal !== "0") problems.push(`${tinggal} person(s) were left behind`);
    out.push(hasil("F16-C01", problems,
      `20 connections each inserted 50 persons in a transaction held open together, then rolled back: all ${ids.length} PINTAR IDs ` +
        "drawn side by side are well-formed and distinct, no insert failed, and nothing was left behind"));
  }

  if (want("F16-C02")) {
    const teardown = () => psql("select selftest.f16_concurrency_teardown()");
    const problems: string[] = [];
    const fixture = psql("select selftest.f16_concurrency_fixture()");
    const [a, b] = fixture.stdout.trim().split("|");
    if (fixture.status !== 0 || !a || !b) {
      problems.push(`fixture failed: ${(fixture.stderr.trim() || fixture.stdout.trim()).split("\n").pop()}`);
    } else {
      const nama = `balap.${Date.now().toString(36)}`;
      const sebagai = (uid: string) =>
        `select set_config('request.jwt.claim.sub','${uid}',true); ` +
        `select set_config('request.jwt.claims','{"sub":"${uid}","role":"authenticated"}',true); set local role authenticated;`;
      const marker = "pg_sleep(1.617)";
      const holder = race(`begin; ${sebagai(a)} select public.claim_username('${nama}'); select ${marker}; commit;`);
      if (!(await asleep(marker))) {
        await holder;
        problems.push("the holder never held its transaction open within 20 s");
      } else {
        const [h, r] = await Promise.all([holder, race(`begin; ${sebagai(b)} select public.claim_username('${nama.toUpperCase()}'); commit;`)]);
        const baris = psql(`select count(*) from public.person_usernames where username = '${nama}'`).stdout.trim();
        if (h.code !== 0 || !h.out.split("\n").includes(nama)) problems.push(`the holder's claim did not go in (${h.out.slice(0, 90)})`);
        if (r.code === 0) problems.push("the concurrent claim of the same name was accepted");
        else if (!/USERNAME_TAKEN/.test(r.out) && !/that username is taken/.test(r.out)) {
          problems.push(`the concurrent claim failed for the wrong reason (${r.out.slice(0, 120)})`);
        }
        if (baris !== "1") problems.push(`${baris} row(s) hold the name`);
      }
    }
    teardown();
    out.push(hasil("F16-C02", problems,
      "two staff people claimed the same username at once (the second in capitals); the holder's claim went in, the other " +
        "waited on its uncommitted row and was refused PR040 USERNAME_TAKEN, and one row holds the name"));
  }

  if (want("F16-C03")) {
    const problems: string[] = [];
    let id = "";
    for (let i = 0; i < 5 && !id; i++) {
      id = psql("select x from (select public.pintar_id_new() x) q where not exists (select 1 from public.persons p where p.pintar_id = x) " +
        "and not exists (select 1 from public.recovery_ladder l where l.typed_id = x) " +
        "and not exists (select 1 from public.audit_log a where a.target_id = x)").stdout.trim();
    }
    if (!id) problems.push("no fresh typed ID could be drawn");
    else {
      const semua = await Promise.all(Array.from({ length: 20 }, () =>
        race(`set role service_role; select outcome || ':' || coalesce(wait_seconds::text, '') from public.recovery_attempt('${id}', '1357')`)));
      const gagal = semua.filter((r) => r.code !== 0);
      if (gagal.length) problems.push(`${gagal.length} attempt(s) failed: ${gagal[0].out.slice(0, 120)}`);
      const jawab = semua.map((r) => r.out.split("\n").pop() ?? "");
      const salah = jawab.filter((x) => x === "WRONG:").length;
      const kunci = jawab.filter((x) => /^LOCKED:\d+$/.test(x));
      if (salah !== 2 || kunci.length !== 18) problems.push(`the answers were ${[...new Set(jawab)].map((x) => `${x} x${jawab.filter((y) => y === x).length}`).join(", ")}; expected WRONG x2 and LOCKED x18`);
      const detik = kunci.map((x) => Number(x.split(":")[1]));
      if (detik.some((s) => s < 3540 || s > 3600)) problems.push(`the locks were for ${[...new Set(detik)].join(", ")} s; each should be about an hour`);
      const tangga = psql(`select level || '|' || failures || '|' || (locked_until > now() + interval '59 minutes')::text from public.recovery_ladder where typed_id = '${id}'`).stdout.trim();
      if (tangga !== "1|0|true") problems.push(`the ladder stands at ${tangga || "nothing"} (level|failures|locked an hour), expected 1|0|true`);
      const jejak = psql(`select count(*) filter (where action = 'identity.recovery_pin_wrong') || '|' || count(*) filter (where action = 'identity.recovery_locked') ` +
        `from public.audit_log where target_id = '${id}'`).stdout.trim();
      if (jejak !== "2|1") problems.push(`the audit holds ${jejak.replace("|", " wrong(s) and ")} lock(s), expected 2 and exactly 1`);
      psql(`delete from public.recovery_ladder where typed_id = '${id}'`);
    }
    out.push(hasil("F16-C03", problems,
      "20 wrong PINs for one typed ID arrived at the same moment as the recovery route makes them: the ladder's row lock took them " +
        "one at a time, so exactly 2 were judged WRONG and one locked the ID for an hour, the other 17 were told it is locked, " +
        "the ladder stands at level 1, and the audit holds 2 wrongs and exactly 1 lock"));
  }
  return out;
}

/**
 * F05-C01 — BOB-35 (c) under real concurrency: a start racing a release move.
 *
 * start_learning_session reads its assignment with plain SELECTs, so a learner
 * who starts while a move is in flight reads the release the move is about to
 * replace. The move holds its transaction open (pg_sleep) after locking the
 * learning assignment and finding no session; the learner starts meanwhile;
 * then the move commits. The start must either be refused
 * (SESSION_RELEASE_MISMATCH, its retry starts on the new release) or cite the
 * new release, and no session on the old release may exist under the moved
 * assignment: a learner's pre-test and post-test never come from two releases.
 */
async function runMoveStartRace(dbUrl: string): Promise<Outcome> {
  const id = "F05-C01";
  const psql = (sql: string) => spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, dbUrl], { encoding: "utf8" });
  const race = (sql: string) =>
    new Promise<{ code: number; out: string }>((done) => {
      const p = spawn("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, dbUrl], { stdio: ["ignore", "pipe", "pipe"] });
      let buf = "";
      p.stdout.setEncoding("utf8");
      p.stderr.setEncoding("utf8");
      p.stdout.on("data", (d: string) => (buf += d));
      p.stderr.on("data", (d: string) => (buf += d));
      p.on("close", (code: number | null) => done({ code: code ?? 1, out: buf.trim() }));
    });
  const asleep = async (marker: string): Promise<boolean> => {
    for (let i = 0; i < 200; i++) {
      const r = psql(`select count(*) from pg_stat_activity where wait_event = 'PgSleep' and query like '%${marker}%' and pid <> pg_backend_pid()`);
      if (Number(r.stdout.trim()) >= 1) return true;
      await new Promise((ok) => setTimeout(ok, 100));
    }
    return false;
  };
  const fixture = psql("select selftest.f05_race_fixture()");
  const [la, aa, baru, admin, murid] = fixture.stdout.trim().split("|");
  if (fixture.status !== 0 || !murid) {
    return { id, runner: "db", status: "FAIL", detail: `fixture failed: ${(fixture.stderr.trim() || fixture.stdout.trim()).split("\n").pop()}` };
  }
  const sebagai = (uid: string) =>
    `select set_config('request.jwt.claim.sub','${uid}',true); ` +
    `select set_config('request.jwt.claims','{"sub":"${uid}","role":"authenticated"}',true); set local role authenticated;`;
  const marker = "pg_sleep(1.735)";
  const mover = race(`begin; ${sebagai(admin)} select public.move_learning_assignment_release('${la}', '${baru}', 'f05-c01 balapan'); ` +
    `select ${marker}; commit;`);
  const problems: string[] = [];
  if (!(await asleep(marker))) {
    await mover;
    return { id, runner: "db", status: "FAIL", detail: "the move never held its transaction open within 20 s" };
  }
  const [m, st] = await Promise.all([mover, race(`begin; ${sebagai(murid)} select public.start_learning_session('${aa}'); commit;`)]);
  if (m.code !== 0) problems.push(`the move did not commit (${m.out.slice(0, 120)})`);
  const sisa = psql(`select count(s.id) filter (where s.plp_release_id <> la.plp_release_id) || '|' || count(s.id) || '|' || ` +
    `(la.plp_release_id = '${baru}')::text from public.learning_assignments la ` +
    `left join public.assessment_sessions s on s.learning_assignment_id = la.id where la.id = '${la}' group by la.plp_release_id`).stdout.trim();
  const [lama, semua, pindah] = sisa.split("|");
  if (pindah !== "true") problems.push("the assignment did not move to the new release");
  if (lama !== "0") problems.push(`${lama} session(s) under the moved assignment cite the release it moved from (a pre-test and post-test could come from two releases)`);
  let hasil: string;
  if (st.code === 0) {
    hasil = "the racing start was admitted on the new release";
    if (semua !== "1") problems.push(`the admitted start left ${semua} session(s), expected 1`);
  } else if (/SESSION_RELEASE_MISMATCH|moved to another release while this attempt was starting/.test(st.out)) {
    hasil = "the racing start waited on the move and was refused SESSION_RELEASE_MISMATCH";
    if (semua !== "0") problems.push(`the refused start left ${semua} session(s)`);
  } else {
    hasil = "";
    problems.push(`the racing start failed for another reason (${st.out.slice(0, 140)})`);
  }
  return problems.length
    ? { id, runner: "db", status: "FAIL", detail: problems.join("; ") }
    : { id, runner: "db", status: "PASS", detail:
        `a move held its transaction open after finding no session; a learner started against the assignment meanwhile; ${hasil}; ` +
        "after the move committed no session under the assignment cites the release it moved from" };
}

/**
 * F10-C01..C03 — a school's structure under real concurrency.
 *
 * One session cannot see these. A function reads its node, checks it, and
 * writes; a second connection that read the node before the first committed
 * would pass the check on a stale row. So two real psql connections race as
 * the school's admin: A (the holder) makes a structure change and holds its
 * transaction open; B arrives mid-flight. The per-school structure lock must
 * arbitrate: B waits, reads again under the lock, and is refused.
 *
 *   F10-C01  A deactivates a Tingkat; B adds a Kelas under it
 *            → STRUCTURE_PARENT_INACTIVE, and no Kelas under it.
 *   F10-C02  BOB-08 (b): A deactivates a Tingkat; B grants a role there
 *            → STRUCTURE_PLACE_INACTIVE, and no grant there. (The same trigger
 *            guards memberships and enrolments, the intake's writes.)
 *   F10-C03  BOB-08 (e): A creates a Bagian; B creates one of the same name
 *            → STRUCTURE_NAME_TAKEN, and one Bagian of that name.
 *   F10-C04  BOB-18 (e): A grants a person a role in a Tingkat; B grants the
 *            identical role → GRANT_ALREADY_ACTIVE, and one standing grant.
 *
 * BOB-08 (e): ROBUST TO A SLOW FIRST CONNECTION. B used to start a fixed 300 ms
 * after A. If A's connection took longer to open, B ran first and the race
 * failed for the wrong reason. B now starts only once A is seen asleep in its
 * own transaction, holding the lock (pg_stat_activity: wait_event PgSleep on
 * A's own marker), with a 20-second bound.
 */
async function runStructureConcurrency(dbUrl: string, only: string[] | null | undefined): Promise<Outcome[]> {
  const psql = (sql: string) =>
    spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, dbUrl], { encoding: "utf8" });
  const race = (sql: string) =>
    new Promise<{ code: number; out: string }>((done) => {
      const p = spawn("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, dbUrl], { stdio: ["ignore", "pipe", "pipe"] });
      let buf = "";
      p.stdout.setEncoding("utf8");
      p.stderr.setEncoding("utf8");
      p.stdout.on("data", (d: string) => (buf += d));
      p.stderr.on("data", (d: string) => (buf += d));
      p.on("close", (code: number | null) => done({ code: code ?? 1, out: buf.trim() }));
    });
  const asleep = async (marker: string): Promise<boolean> => {
    for (let i = 0; i < 200; i++) {
      const n = psql(`select count(*) from pg_stat_activity where wait_event = 'PgSleep' and query like '%${marker}%' and pid <> pg_backend_pid()`);
      if (n.stdout.trim() !== "0" && n.status === 0) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  };

  const cases = [
    { id: "F10-C01", holder: (t: string) => `select public.deactivate_school_node('${t}'::uuid, 'selftest: D-093')`,
      racer: (t: string) => `select public.create_kelas('${t}'::uuid, 'Kelas Balapan')`, code: "STRUCTURE_PARENT_INACTIVE",
      went: "a Kelas was created under a Tingkat being deactivated",
      verdict: (t: string) => `select selftest.f10_concurrency_verdict('${t}'::uuid)`,
      held: (t: string, out: string) => out.includes(t),
      pass: "the holder deactivated a Tingkat and held its transaction open; the concurrent create_kelas under it waited " +
        "on the per-school structure lock, read the Tingkat again and was refused PR020 STRUCTURE_PARENT_INACTIVE" },
    { id: "F10-C02", holder: (t: string) => `select public.deactivate_school_node('${t}'::uuid, 'selftest: D-093')`,
      // to the school's own staff member: a self-grant is refused whatever the place
      // (INV-16), and since BOB-21 a person the school does not have is refused first
      racer: (t: string, _uid: string, staf: string) => `select public.grant_role('${staf}'::uuid, 'EDUCATOR', '${t}'::uuid, now() + interval '30 days')`,
      code: "STRUCTURE_PLACE_INACTIVE", went: "a role was granted in a Tingkat being deactivated",
      verdict: (t: string) => `select (count(*) = 0)::text || '|no role is scoped to the deactivated Tingkat' from public.role_assignments where scope_node_id = '${t}'::uuid`,
      held: (t: string, out: string) => out.includes(t),
      pass: "the holder deactivated a Tingkat and held its transaction open; a concurrent grant_role there waited on the " +
        "shared structure lock the place trigger takes, read the Tingkat again and was refused PR020 STRUCTURE_PLACE_INACTIVE" },
    { id: "F10-C03", holder: (t: string) => `select public.create_bagian((select institution_id from public.org_nodes where id = '${t}'::uuid), 'Kembar')`,
      racer: (t: string) => `select public.create_bagian((select institution_id from public.org_nodes where id = '${t}'::uuid), 'Kembar')`,
      code: "STRUCTURE_NAME_TAKEN", went: "a second Bagian of the same name was created",
      verdict: (t: string) => `select (count(*) = 1)::text || '|one Bagian is named Kembar' from public.org_nodes where institution_id = (select institution_id from public.org_nodes where id = '${t}'::uuid) and kind = 'DEPARTMENT' and name = 'Kembar'`,
      held: (_t: string, out: string) => /^[0-9a-f-]{36}$/m.test(out),
      pass: "two admins' connections created a Bagian of the same name at once; the second waited on the per-school " +
        "structure lock, read the names again and was refused PR020 STRUCTURE_NAME_TAKEN" },
    // BOB-18 (e): "Berikan peran" pressed twice while the first was saving
    { id: "F10-C04", holder: (t: string, _uid: string, staf: string) => `select public.grant_role('${staf}'::uuid, 'EDUCATOR', '${t}'::uuid, now() + interval '30 days')`,
      racer: (t: string, _uid: string, staf: string) => `select public.grant_role('${staf}'::uuid, 'EDUCATOR', '${t}'::uuid, now() + interval '30 days')`,
      code: "GRANT_ALREADY_ACTIVE", went: "a second identical grant was saved beside the first",
      verdict: (t: string) => `select (count(*) = 1)::text || '|one EDUCATOR grant stands in the Tingkat' from public.role_assignments where scope_node_id = '${t}'::uuid and role = 'EDUCATOR' and revoked_at is null`,
      held: (_t: string, out: string) => /^[0-9a-f-]{36}$/m.test(out),
      pass: "two connections granted the same person the same role in the same Tingkat at once; the second waited on " +
        "the grant's advisory lock, read the first's row and was refused 23505 GRANT_ALREADY_ACTIVE" },
  ].filter((k) => !only || only.includes(k.id));

  const out: Outcome[] = [];
  for (const k of cases) {
    const teardown = () => psql("select selftest.f10_concurrency_teardown()");
    const fail = (detail: string): Outcome => { teardown(); return { id: k.id, runner: "db", status: "FAIL", detail }; };
    const fixture = psql("select selftest.f10_concurrency_fixture()");
    if (fixture.status !== 0) { out.push(fail(`fixture failed: ${fixture.stderr.trim().split("\n").pop()}`)); continue; }
    const [tingkat, uid, staf] = fixture.stdout.trim().split("|");
    if (!tingkat || !uid || !staf) { out.push(fail(`fixture returned nothing usable: ${fixture.stdout.trim()}`)); continue; }
    const claim =
      `select set_config('request.jwt.claim.sub','${uid}',true);` +
      ` select set_config('request.jwt.claims','{"sub":"${uid}","role":"authenticated"}',true);`;
    const marker = `pg_sleep(1.3${k.id.slice(-1)}7)`;
    const holder = race(`begin; ${claim} ${k.holder(tingkat, uid, staf)}; select ${marker}; commit;`);
    if (!(await asleep(marker))) { await holder; out.push(fail("the holder never held its transaction open within 20 s")); continue; }
    const [a, b] = await Promise.all([holder, race(`begin; ${claim} ${k.racer(tingkat, uid, staf)}; commit;`)]);
    const verdict = psql(k.verdict(tingkat)).stdout.trim();
    teardown();
    const problems: string[] = [];
    if (a.code !== 0 || !k.held(tingkat, a.out)) problems.push(`the holder did not make its change (${a.out.slice(0, 90)})`);
    if (b.code === 0) problems.push(k.went);
    else if (!b.out.includes(k.code)) problems.push(`the concurrent call failed for the wrong reason (${b.out.slice(0, 120)})`);
    if (!verdict.startsWith("true|")) problems.push(`row check: ${verdict}`);
    out.push(problems.length
      ? { id: k.id, runner: "db", status: "FAIL", detail: problems.join("; ") }
      : { id: k.id, runner: "db", status: "PASS", detail: `${k.pass}, and ${verdict.split("|")[1]}` });
  }
  return out;
}

/**
 * F09-C01 — F-02 on a connection that never set anything (NEW-1).
 *
 * The in-suite test cannot see this defect: by the time fable09 runs, the
 * session has already set `app.seed_intent`, so `current_setting(.., true)`
 * reads '' there. GoTrue's connections never set it, and for them it reads
 * NULL -- which is what turned the refusal's condition NULL and let every real
 * sign-up through. So this opens FRESH psql connections, as GoTrue does, and
 * never touches the setting: it asserts the setting really is NULL there,
 * that a bare sign-up shaped exactly as GoTrue inserts it is refused with
 * PR010, and -- the control that proves the refusal is the rule and not a
 * broken insert -- that the same shape IS admitted when a live activation
 * grant names the address. Everything runs inside a transaction that is
 * rolled back.
 */
function runSignupOnAFreshConnection(dbUrl: string): Outcome {
  const id = "F09-C01";
  const fresh = (sql: string) =>
    spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=verbose", "-At", "-c", sql, dbUrl], { encoding: "utf8" });
  const gotrue = `'{"provider":"email","providers":["email"]}'::jsonb`;
  const tag = Date.now().toString(36);
  const problems: string[] = [];

  const pre = fresh(
    "select coalesce(current_setting('app.seed_intent', true), '<null>') || '|' || " +
      "(select count(*) from public.role_assignments where role = 'SYSTEM_ADMIN' and revoked_at is null " +
      "and now() >= valid_from and now() < valid_until)",
  );
  const [setting, admins] = pre.stdout.trim().split("|");
  if (pre.status !== 0) return { id, runner: "db", status: "FAIL", detail: `precondition read failed: ${pre.stderr.trim()}` };
  if (setting !== "<null>") problems.push(`a fresh connection reads app.seed_intent as '${setting}', not NULL: this is not GoTrue's condition`);
  if (Number(admins) < 1) problems.push("no active SYSTEM_ADMIN in this database, so the refusal clause is not the one under test");

  const bare = fresh(
    "begin; update public.platform_environment set local_fixtures_enabled = false; " +
      `insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values (gen_random_uuid(), ` +
      `'f09-c01-asing-${tag}@contoh.invalid', ${gotrue}, '{"display_name":"Kepala Sekolah (asli)"}'::jsonb); rollback;`,
  );
  if (bare.status === 0) problems.push("a bare sign-up on a fresh connection was ADMITTED (NEW-1 is open)");
  else if (!/PR010/.test(bare.stderr)) problems.push(`the sign-up failed for another reason: ${bare.stderr.trim().split("\n")[0]}`);

  const granted = fresh(
    "begin; update public.platform_environment set local_fixtures_enabled = false; " +
      "insert into public.account_activation_grants (email, display_name, kind, authorized_by) " +
      `select 'f09-c01-diberi-${tag}@contoh.invalid', 'Diberi C01', 'EMAIL', ra.person_id from public.role_assignments ra ` +
      "where ra.role = 'SYSTEM_ADMIN' and ra.revoked_at is null limit 1; " +
      `insert into auth.users (id, email, raw_app_meta_data) values (gen_random_uuid(), 'f09-c01-diberi-${tag}@contoh.invalid', ${gotrue}); ` +
      `select count(*) from public.accounts a join auth.users u on u.id = a.auth_user_id join public.persons p on p.id = a.person_id ` +
      `where u.email = 'f09-c01-diberi-${tag}@contoh.invalid' and p.display_name = 'Diberi C01'; rollback;`,
  );
  const linked = granted.stdout.trim().split("\n").filter((l) => /^\d+$/.test(l)).pop();
  if (granted.status !== 0) problems.push(`the granted control failed: ${granted.stderr.trim().split("\n")[0]}`);
  else if (linked !== "1") problems.push(`the granted control linked ${linked ?? "nothing"} account(s), expected 1`);

  return problems.length
    ? { id, runner: "db", status: "FAIL", detail: problems.join("; ") }
    : {
        id,
        runner: "db",
        status: "PASS",
        detail:
          "on fresh connections, where app.seed_intent reads NULL exactly as it does for GoTrue, with an active " +
          "SYSTEM_ADMIN and the fixtures marker off: a sign-up shaped as GoTrue inserts it is refused with PR010, " +
          "and the same shape is admitted and linked to the granted person when a live activation grant names " +
          "the address. Rolled back",
      };
}

/**
 * F07-C01 — WP7B exactly-once under real concurrency.
 *
 * The suite proves that a RETRY is refused: the same connection asking twice.
 * That is a different property from two connections asking at once, and a
 * single session cannot tell them apart — a check-then-write would pass the
 * first and fail only the second. So this drives two real psql connections as
 * ONE learner: A takes the opportunity and holds its transaction open; B
 * arrives mid-flight with the same sheet. Correct behaviour is that the row
 * lock arbitrates — B waits, re-reads `not consumed`, matches nothing and is
 * refused by name — leaving exactly one consumed opportunity and exactly one
 * sheet of answers.
 */
async function runFeedbackConcurrency(dbUrl: string): Promise<Outcome> {
  const id = "F07-C01";
  const psql = (sql: string) =>
    spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, dbUrl], { encoding: "utf8" });
  const fail = (detail: string): Outcome => {
    psql("select selftest.f07_concurrency_teardown()");
    return { id, runner: "db", status: "FAIL", detail };
  };

  const fixture = psql("select selftest.f07_concurrency_fixture()");
  if (fixture.status !== 0) return fail(`fixture failed: ${fixture.stderr.trim().split("\n").pop()}`);
  const [cycle, uid] = fixture.stdout.trim().split("|");
  if (!cycle || !uid) return fail(`fixture returned nothing usable: ${fixture.stdout.trim()}`);
  const sheet = psql("select selftest.f07_sheet('FQ-1', 3)::text").stdout.trim();
  if (!sheet.startsWith("{")) return fail(`no answer sheet to send: ${sheet}`);

  // the learner's session, set the way auth.uid() actually reads it
  const claim =
    `select set_config('request.jwt.claim.sub','${uid}',true);` +
    ` select set_config('request.jwt.claims','{"sub":"${uid}","role":"authenticated"}',true);`;
  const submit = `select public.submit_feedback('${cycle}'::uuid, '${sheet}'::jsonb);`;

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

  const holder = race(`begin; ${claim} ${submit} select pg_sleep(1); commit;`);
  await new Promise((r) => setTimeout(r, 300));
  const [a, b] = await Promise.all([holder, race(`begin; ${claim} ${submit} commit;`)]);

  const verdict = psql(`select selftest.f07_concurrency_verdict('${cycle}'::uuid)`).stdout.trim();
  psql("select selftest.f07_concurrency_teardown()");

  const problems: string[] = [];
  if (!a.out.includes("recorded")) problems.push(`the holder did not record a sheet (${a.out.slice(0, 90)})`);
  if (b.code === 0) problems.push("the concurrent submission was accepted");
  if (!b.out.includes("already answered")) {
    problems.push(`the concurrent submission failed for the wrong reason (${b.out.slice(0, 90)})`);
  }
  if (!verdict.startsWith("true|")) problems.push(`row check: ${verdict}`);

  return problems.length
    ? { id, runner: "db", status: "FAIL", detail: problems.join("; ") }
    : {
        id,
        runner: "db",
        status: "PASS",
        detail:
          "two connections submitted one learner's sheet at once: the holder recorded it, the " +
          `concurrent caller waited on the row lock and was refused by name, and ${verdict.split("|")[1]}`,
      };
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
const FETCH_LOG = join(tmpdir(), `pintar-selftest-fetch-${process.pid}.log`);
async function startApp(port: number): Promise<{ child: ChildProcess; url: string }> {
  if (!existsSync(join(repoRoot, ".next", "BUILD_ID"))) {
    log("  building production bundle (.next/BUILD_ID missing)…");
    const b = spawnSync(process.execPath, [NEXT_BIN, "build"], { cwd: repoRoot, stdio: "inherit", env: process.env });
    if (b.status !== 0) throw new Error("next build failed");
  }
  // BOB-18 (D-046): the app's calls to Supabase are counted, path only, into
  // FETCH_LOG, so a test can read what one click cost (selftest/hitung-fetch.cjs).
  writeFileSync(FETCH_LOG, "");
  const preload = `--require ${join(repoRoot, "selftest", "hitung-fetch.cjs")}`;
  const child = spawn(process.execPath, [NEXT_BIN, "start", "-p", String(port)], {
    cwd: repoRoot,
    env: {
      ...process.env,
      NODE_ENV: "production",
      SELFTEST_FETCH_LOG: FETCH_LOG,
      NODE_OPTIONS: [process.env.NODE_OPTIONS, preload].filter(Boolean).join(" "),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
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
  if (only) {
    log(
      `TARGETED RUN — ${patterns.join(", ")} → ${only.length} id(s) requested. A db suite runs as one unit, so the ` +
        "suites that own those ids report all of their rows and the tally below counts them. " +
        "This is a development loop; the completion gate is the whole manifest.",
    );
  }

  const facilities = new Set<Facility>();
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (dbUrl && hasPsql()) facilities.add("db");
  facilities.add("app");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (await probeNetwork(supabaseUrl, anon)) facilities.add("network");
  if (await probeMailSink()) facilities.add("mailsink");
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
    log(`\n[db] ${pickedDbRunners().map((r) => "selftest/db/" + r.file).join(", ") || "(no suite selected)"}`);
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
    fetchLog: app ? FETCH_LOG : null,
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
  for (const p of unmatchedPatterns) problems.push(`--only pattern "${p}" names no manifest id`);
  // Every db id must belong to exactly one suite's declared `emits`, or a
  // targeted run would silently skip the suite that owns it while still
  // claiming the id was not reported.
  for (const t of manifest.tests.filter((t) => t.runner === "db")) {
    const owners = DB_RUNNERS.filter((r) => r.emits.some((e) => t.id.startsWith(e)));
    if (owners.length !== 1 && !["F02-C01", "F07-C01", "F09-C01", "F10-C01", "F10-C02", "F10-C03", "F10-C04"].includes(t.id)) {
      problems.push(`${t.id} is claimed by ${owners.length} db suite(s) — declare it in exactly one DB_RUNNERS.emits`);
    }
  }
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

  // WHAT WENT WRONG, REPEATED AT THE VERY END AND SHORT.
  //
  // The listing above is the contract's record and each line carries a whole
  // `proves` paragraph, so a full run is hundreds of kilobytes. A reader
  // fetching a failed CI job's log gets its TAIL, and the tail of that listing
  // is whichever tests happen to sort last — not the ones that failed. Twice
  // now that has cost a round trip to find out which test went red.
  //
  // So the failures are printed again, after the summary, truncated: the last
  // thing in the log is always the thing somebody needs.
  if (!ok) {
    log("");
    for (const t of manifest.tests) {
      const o = reported.get(t.id);
      if (o && o.status === "FAIL") log(`FAILED  ${t.id}  ${o.detail.slice(0, 300)}`);
      else if (o && o.status === "SKIP" && !(acceptJustifiedSkips && t.skip_justification)) {
        log(`SKIPPED ${t.id}  ${o.detail.slice(0, 160)}`);
      }
    }
    for (const p of problems) log(`CONTRACT ${p.slice(0, 300)}`);
  }
  exitAfterFlush(ok ? 0 : 1);
}

main().catch((e) => {
  log(`selftest runner crashed: ${(e as Error).stack ?? e}`);
  exitAfterFlush(2);
});
