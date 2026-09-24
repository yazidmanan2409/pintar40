#!/usr/bin/env node
/**
 * PLANT HARNESS — one definition of a planted defect, run the same way
 * locally and in CI.
 *
 * A plant proves a gate is not decorative: install a specific defect, watch a
 * specific test go red for a specific reason, take the defect away again.
 * Until now each plant existed twice — as a heredoc inside the workflow and
 * as a hand-copied file on a developer's disk — and the two drifted for
 * reasons that had nothing to do with PINTAR: a workflow indents its heredoc,
 * so a multi-line `replace()` literal that matched locally matched nothing in
 * CI. That cost a full CI round trip to discover. One definition, read by
 * both, cannot drift.
 *
 * WHAT A PLANT MUST PROVE (all four, or it is reported as failed):
 *   1. the mutation actually happened  — the schema digest moves
 *   2. the intended gate went red      — that test id reports not-ok
 *   3. it went red for the right reason— its detail carries the declared text
 *   4. restoration succeeded           — the digest returns to what it was
 *
 * A plant that crashes the suite is not a successful plant: the harness
 * distinguishes "the suite refused to run" from "the test went red".
 *
 * CHEAPEST SUFFICIENT GATE: a plant runs only the suite that owns the id it
 * expects to turn red, never the whole manifest.
 *
 *   node scripts/dev/plants.mjs list [--gate=NAME]
 *   node scripts/dev/plants.mjs run  [--gate=NAME] [name ...] [--db-url=URL]
 *
 * The database URL comes from --db-url, $PINTAR_PLANT_DB_URL, $DB_URL or
 * $SUPABASE_DB_URL, in that order. Locally, point it at a clone:
 *
 *   npm run db:clone -- plants          # ~0.5s from the golden baseline
 *   node scripts/dev/plants.mjs run --gate=db-wp7-gates --db-url=...
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const plantsDir = join(repoRoot, "selftest", "plants");
const spec = JSON.parse(readFileSync(join(plantsDir, "plants.json"), "utf8"));

const argv = process.argv.slice(2);
const verb = argv[0] ?? "";
const flag = (name) => argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const names = argv.slice(1).filter((a) => !a.startsWith("-"));
const gate = flag("gate");
const dbUrl = flag("db-url") ?? process.env.PINTAR_PLANT_DB_URL ?? process.env.DB_URL ?? process.env.SUPABASE_DB_URL;

/**
 * A digest of everything a plant can plausibly change: function bodies,
 * columns, policies, and the grants on both tables and functions. It is the
 * harness's evidence that a mutation LANDED and, after the rollback, that it
 * is GONE — without asking each plant to describe itself, and without
 * trusting that a `replace()` found its match.
 */
const DIGEST_SQL = `
select md5(string_agg(x, '|' order by x)) from (
  select 'fn '  || p.oid::regprocedure::text || ' ' || md5(pg_get_functiondef(p.oid)) as x
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prokind = 'f'
  union all
  select 'col ' || c.table_name || '.' || c.column_name || ' ' || c.data_type
    from information_schema.columns c where c.table_schema = 'public'
  union all
  select 'pol ' || pol.tablename || '.' || pol.policyname || ' ' || coalesce(pol.qual, '') || coalesce(pol.with_check, '')
    from pg_policies pol where pol.schemaname = 'public'
  union all
  select 'acl ' || c.relname || ' ' || coalesce(array_to_string(c.relacl, ','), '')
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'v', 'm')
  union all
  select 'facl ' || p.oid::regprocedure::text || ' ' || coalesce(array_to_string(p.proacl, ','), '')
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'
) s`;

function psql(args, input) {
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", ...args, dbUrl], { encoding: "utf8", input });
  return { code: r.status ?? 1, out: (r.stdout ?? "").trim(), err: (r.stderr ?? "").trim() };
}

const q = (sql) => psql(["-Atq", "-c", sql]);
const digest = () => {
  const r = q(DIGEST_SQL);
  if (r.code !== 0) die(`could not read the schema digest: ${r.err.split("\n").pop()}`);
  return r.out;
};

function die(msg) {
  process.stderr.write(`plants: ${msg}\n`);
  process.exit(1);
}
const ci = process.env.GITHUB_ACTIONS === "true";
const problem = (msg) => process.stderr.write(`${ci ? "::error::" : "plants: FAILED — "}${msg}\n`);

const selected = spec.plants.filter(
  (p) => (!gate || p.gate === gate) && (names.length === 0 || names.includes(p.name)),
);

if (verb === "list") {
  for (const p of selected) process.stdout.write(`${p.name.padEnd(10)} ${p.gate.padEnd(14)} ${p.expect_red.padEnd(10)} ${p.expect_detail}\n`);
  process.exit(0);
}
if (verb !== "run") die("usage: plants.mjs list|run [--gate=NAME] [name ...] [--db-url=URL]");
if (!dbUrl) die("no database url (--db-url, $PINTAR_PLANT_DB_URL, $DB_URL or $SUPABASE_DB_URL)");
if (selected.length === 0) die(`no plants selected${gate ? ` for gate ${gate}` : ""}`);

// ------------------------------------------------------------------ define
// Every suite file, because each assumes the helpers the ones before it
// install. Defining is cheap; running is what a targeted plant avoids.
for (const f of ["fable01", "fable02", "fable03", "fable04", "fable05", "fable05t1_quick_canonical", "fable05t2_evaluation", "fable06", "fable07", "fable08", "fable09", "fable10"]) {
  const r = psql(["-q", "-1", "-f", join(repoRoot, "selftest", "db", `${f}.sql`)]);
  if (r.code !== 0) die(`${f}.sql did not load: ${r.err.split("\n").pop()}`);
}

const runSuite = (suite) => {
  const r = psql(["-Atq", "-F", "\u0001", "-c", `select id, case when ok then 't' else 'f' end, detail from ${suite} as t(id, area, ok, detail)`]);
  if (r.code !== 0) return { aborted: r.err.split("\n").filter(Boolean).pop() ?? "suite aborted", rows: [] };
  const rows = r.out.split("\n").filter(Boolean).map((l) => {
    const [id, ok, ...rest] = l.split("\u0001");
    return { id, ok: ok === "t", detail: rest.join("\u0001") };
  });
  return { aborted: null, rows };
};

// ----------------------------------------------------------------- control
// A plant that "works" against an already-red or half-run suite proves
// nothing, so every gate states how many green rows a complete control has.
const gates = [...new Set(selected.map((p) => p.gate))];
for (const g of gates) {
  const cfg = spec.gates[g] ?? die(`gate ${g} is not declared in plants.json`);
  const { aborted, rows } = runSuite(cfg.suite);
  if (aborted) die(`control for ${g}: the suite did not run (${aborted})`);
  const green = rows.filter((r) => r.ok && !r.id.endsWith("-DONE")).length;
  const red = rows.filter((r) => !r.ok);
  if (red.length) die(`control for ${g} is already red before any defect: ${red.map((r) => r.id).join(", ")}`);
  // Both halves matter: the suite must have REACHED ITS END (its sentinel) and
  // must have reported every row it owns. A suite that stopped early would be
  // green over nothing, and every plant below would then "work".
  if (!rows.some((r) => r.id.endsWith("-DONE") && r.ok)) die(`control for ${g}: the suite did not reach its end sentinel`);
  if (green !== cfg.control_green) {
    die(`control for ${g} reported ${green} green row(s), expected ${cfg.control_green} — a suite that stopped early would make every plant below look successful`);
  }
  process.stdout.write(`control ${g}: ${green} green row(s) over ${cfg.what}\n`);
}

// ------------------------------------------------------------------- plants
const tmp = mkdtempSync(join(tmpdir(), "pintar-plants-"));
const clean = digest();
let failed = 0;

for (const p of selected) {
  const cfg = spec.gates[p.gate];
  const body = readFileSync(join(plantsDir, `${p.name}.sql`), "utf8");
  if (/^\s*(begin|rollback|commit)\s*;/im.test(body)) {
    problem(`${p.name}: a plant file opens or ends its own transaction — the harness owns that`);
    failed++;
    continue;
  }
  // One transaction: plant, measure, run the owning suite, undo.
  const file = join(tmp, `${p.name}.run.sql`);
  writeFileSync(
    file,
    `begin;\n${body}\nselect 'PLANTED\u0001' || (${DIGEST_SQL});\n` +
      `select id, case when ok then 't' else 'f' end, detail from ${cfg.suite} as t(id, area, ok, detail);\nrollback;\n`,
  );
  const r = psql(["-Atq", "-F", "\u0001", "-f", file]);
  const lines = r.out.split("\n").filter(Boolean);
  const plantedLine = lines.find((l) => l.startsWith("PLANTED\u0001"));

  if (r.code !== 0 && !plantedLine) {
    problem(`${p.name}: the defect would not apply — ${r.err.split("\n").filter(Boolean).pop()}`);
    failed++;
    continue;
  }
  // 1. the mutation actually happened
  const planted = plantedLine.split("\u0001")[1];
  if (planted === clean) {
    problem(`${p.name}: the schema is unchanged after planting — the defect matched nothing`);
    failed++;
    continue;
  }
  // the suite must have RUN. A plant that aborts it is not a red gate.
  const rows = lines
    .filter((l) => l !== plantedLine)
    .map((l) => { const [id, ok, ...rest] = l.split("\u0001"); return { id, ok: ok === "t", detail: rest.join("\u0001") }; })
    .filter((x) => x.id && (x.ok === true || x.ok === false));
  if (!rows.some((x) => x.id === p.expect_red)) {
    problem(`${p.name}: ${p.expect_red} was never reported — the suite did not survive the defect (${r.err.split("\n").filter(Boolean).pop() ?? "no rows"})`);
    failed++;
    continue;
  }
  const hit = rows.find((x) => x.id === p.expect_red);
  // 2. the intended gate went red
  if (hit.ok) {
    problem(`${p.name}: ${p.expect_red} stayed green with the defect planted`);
    failed++;
    continue;
  }
  // 3. for the intended reason
  if (!hit.detail.includes(p.expect_detail)) {
    problem(`${p.name}: ${p.expect_red} went red, but not for "${p.expect_detail}" — it said: ${hit.detail.slice(0, 200)}`);
    failed++;
    continue;
  }
  // 4. restoration
  const after = digest();
  if (after !== clean) {
    problem(`${p.name}: the database did not come back — the rollback left the schema changed`);
    failed++;
    continue;
  }
  process.stdout.write(`${p.name.padEnd(10)} → ${p.expect_red} red for "${p.expect_detail}", schema moved and came back\n`);
}

// ------------------------------------------------------------------- after
// Nothing leaked out of any plant's transaction.
for (const g of gates) {
  const { aborted, rows } = runSuite(spec.gates[g].suite);
  const red = rows.filter((r) => !r.ok);
  if (aborted || red.length) {
    problem(`after every plant, ${g} is not clean again: ${aborted ?? red.map((r) => r.id).join(", ")}`);
    failed++;
  }
}

process.stdout.write(`\n${selected.length - failed}/${selected.length} plant(s) proved their gate\n`);
process.exit(failed === 0 ? 0 : 1);
