#!/usr/bin/env node
/**
 * RPC ARGUMENT-REACHABILITY PREFLIGHT
 *
 *      authorized actor → RPC → arguments it requires → where that actor
 *      obtains each one through ordinary PINTAR
 *
 * WP7D was this question going unasked. Management was authorized to open a
 * feedback cycle, `open_feedback_cycle(p_node, p_subject_person_id)` refused
 * nobody who should have been allowed — and there was no authorized ordinary
 * read anywhere in the product from which that Management actor could learn
 * the subject's `person_id`. The frontend was built, and only then did the
 * missing half become visible, as a dash where a teacher's name belonged.
 *
 * An argument with no governed source is a design problem, and it is cheapest
 * to see BEFORE the surface is built.
 *
 * THIS IS NOT AN AUTHORIZATION SYSTEM AND NOTHING READS IT AT RUNTIME.
 * Authorization lives in the database, in the predicates each function calls.
 * This is a development-time cross-check between two things that already
 * exist — the function catalogue and `client_rpc_registry` — and one thing
 * that cannot be derived from either: which governed read a human is expected
 * to have used to obtain an identifier. That last part is declared, by hand,
 * in selftest/reachability.json.
 *
 *   node scripts/dev/reachability.mjs [--db-url=URL] [--exposure=STAFF]
 *                                     [--rpc=name,name] [--strict]
 *
 * Exit code:
 *   1  a declaration contradicts the catalogue (wrong argument name, a source
 *      that is not client-callable, a source in a different exposure class),
 *      or --strict and something identity-bearing has no declared source
 *   0  otherwise. Undeclared arguments are REPORTED, not fatal: the seed
 *      covers the feedback domain, and the file grows as work packages touch
 *      surfaces. A finding of "undeclared" is information, not a gate.
 *
 * A source is spelled:
 *   rpc:<name>     another client-callable RPC this actor may call
 *   rls:<relation> a relation the actor may select under its own RLS policy
 *   self           the caller's own identity (current_person_id / auth.uid)
 *   arg:<name>     derived from another argument of the same call
 *   caller_choice  a value the caller invents (a new uuid, an idempotency key)
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const declPath = join(repoRoot, "selftest", "reachability.json");

const argv = process.argv.slice(2);
const flag = (n) => argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const strict = argv.includes("--strict");
const wantExposure = flag("exposure");
const wantRpcs = flag("rpc")?.split(",").map((s) => s.trim()).filter(Boolean);
const dbUrl = flag("db-url") ?? process.env.PINTAR_PLANT_DB_URL ?? process.env.DB_URL ?? process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  process.stderr.write("reachability: no database url (--db-url, $DB_URL or $SUPABASE_DB_URL)\n");
  process.exit(1);
}

const psql = (sql) => {
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-Atq", "-c", sql, dbUrl], { encoding: "utf8" });
  if ((r.status ?? 1) !== 0) {
    process.stderr.write(`reachability: ${(r.stderr ?? "").trim().split("\n").pop()}\n`);
    process.exit(1);
  }
  return JSON.parse((r.stdout ?? "[]").trim() || "[]");
};

/**
 * The client surface as the DATABASE sees it: every function an ordinary
 * signed-in session may execute, with the exposure and authorization the
 * registry already declares, and the arguments the signature already names.
 * Nothing here is new metadata.
 */
const surface = psql(`
select coalesce(json_agg(json_build_object(
         'name', proname, 'exposure', exposure, 'kind', kind, 'requirement', requirement,
         'args', args, 'anon', anon) order by proname), '[]'::json)
from (
  select p.proname,
         coalesce(r.exposure::text, '(undeclared)')        as exposure,
         coalesce(r.authorization_kind::text, '')          as kind,
         coalesce(r.authorization_requirement, '')         as requirement,
         has_function_privilege('anon', p.oid, 'execute')   as anon,
         coalesce((
           select json_agg(json_build_object('name', a.argname, 'type', a.argtype) order by a.ord)
             from unnest(coalesce(p.proargnames, '{}'), string_to_array(oidvectortypes(p.proargtypes), ', '))
                  with ordinality as a(argname, argtype, ord)
         ), '[]'::json) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
    left join public.client_rpc_registry r on r.function_name = p.proname
   where has_function_privilege('authenticated', p.oid, 'execute')
     and p.prokind = 'f'
) s`);

const relations = new Set(
  psql(`
    select coalesce(json_agg(c.relname), '[]'::json)
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
       and has_table_privilege('authenticated', c.oid, 'select')`),
);

const byName = new Map(surface.map((f) => [f.name, f]));
const decls = existsSync(declPath) ? JSON.parse(readFileSync(declPath, "utf8")) : { rpcs: {} };

/**
 * An argument is IDENTITY-BEARING when its value names a specific row
 * somewhere — which is exactly the kind of value a human cannot invent and
 * must therefore have been given by a governed read. A count, a page size or
 * a free-text title is not.
 */
const identityBearing = (a) => a.type === "uuid" || a.type === "uuid[]";

const problems = [];
const undeclared = [];
const rows = [];

for (const fn of surface) {
  if (wantExposure && fn.exposure !== wantExposure) continue;
  if (wantRpcs && !wantRpcs.includes(fn.name)) continue;
  const decl = decls.rpcs?.[fn.name];
  if (decl) {
    for (const argName of Object.keys(decl.args ?? {})) {
      if (!fn.args.some((a) => a.name === argName)) {
        problems.push(`${fn.name}: declares a source for "${argName}", which is not an argument of the live signature`);
      }
    }
  }
  for (const a of fn.args.filter(identityBearing)) {
    const source = decl?.args?.[a.name];
    if (!source) {
      undeclared.push(`${fn.name}(${a.name})`);
      rows.push([fn.exposure, fn.name, a.name, "— UNDECLARED —"]);
      continue;
    }
    rows.push([fn.exposure, fn.name, a.name, source]);

    if (source.startsWith("rpc:")) {
      const src = byName.get(source.slice(4));
      if (!src) {
        problems.push(`${fn.name}(${a.name}): the declared source ${source} is not a client-callable function`);
      } else if (src.exposure !== fn.exposure) {
        // The WP7D shape: an actor authorized for one surface being told to
        // get its argument from a surface built for a different actor.
        problems.push(
          `${fn.name}(${a.name}): ${fn.exposure} is told to obtain this from ${source}, which is ${src.exposure}`,
        );
      } else if (src.requirement !== fn.requirement || src.kind !== fn.kind) {
        // Advisory only. Comparing two authorization requirements for
        // "narrower than" would be re-implementing authorization here, which
        // is the one thing this file must not do.
        rows[rows.length - 1][3] = `${source}  ⚠ declares ${src.kind || "—"} ${src.requirement || "—"} vs ${fn.kind || "—"} ${fn.requirement || "—"}`;
      }
    } else if (source.startsWith("rls:")) {
      if (!relations.has(source.slice(4))) {
        problems.push(`${fn.name}(${a.name}): the declared source ${source} is not a readable RLS-protected relation`);
      }
    } else if (source.startsWith("arg:")) {
      if (!fn.args.some((x) => x.name === source.slice(4))) {
        problems.push(`${fn.name}(${a.name}): the declared source ${source} is not another argument of this call`);
      }
    } else if (!["self", "caller_choice"].includes(source)) {
      problems.push(`${fn.name}(${a.name}): "${source}" is not a source this preflight understands`);
    }
  }
}

const w = rows.reduce((m, r) => [0, 1, 2].map((i) => Math.max(m[i], r[i].length)), [0, 0, 0]);
process.stdout.write("actor      rpc                                 argument                  governed source\n");
for (const r of rows) {
  process.stdout.write(`${r[0].padEnd(Math.max(10, w[0]))} ${r[1].padEnd(Math.max(35, w[1]))} ${r[2].padEnd(Math.max(25, w[2]))} ${r[3]}\n`);
}
process.stdout.write(
  `\n${rows.length} identity-bearing argument(s); ${rows.length - undeclared.length} declared, ${undeclared.length} undeclared\n`,
);
for (const p of problems) process.stderr.write(`reachability: ${p}\n`);
if (strict && undeclared.length) {
  process.stderr.write(`reachability: --strict — ${undeclared.length} argument(s) have no governed source: ${undeclared.join(", ")}\n`);
}
process.exit(problems.length || (strict && undeclared.length) ? 1 : 0);
