#!/usr/bin/env node
// #150 WP-C (B8, D-106(f)): WHICH SUPABASE PROJECT PINTAR'S WORKFLOWS POINT AT, KEPT IN ONE GUARDED RECORD.
//
// After a native restore to a new project (RUNBOOK-NATIVE-RESTORE.md), every workflow that names the old project must
// name the new one, at once, and nothing else may change. The record is docs/recovery/projects.json; the workflows keep
// their literals (GitHub reads them before any step runs), and this keeps the two equal:
//   check                 every workflow's project reference, address, pooler user and public key, and every literal of
//                         the recorded sign-in and email settings, equals the record; a retired reference anywhere fails
//   plan  <env> ...       what `apply` would change, file by file; nothing written
//   apply <env> --ref <new> --name <name> --region <region> [--anon-key <public key>] --decision <D-nnn>
//                         rewrites the record and every workflow together. Refused: a malformed reference, the other
//                         environment's, the current one, one already retired, production without its new public key
//                         or with a key minted for another project, and any move without the decision that authorised it.
//                         The result must pass `check`; the commit is reviewed like any other.
//   verify <env>          read only: the live project (Management API) has the recorded name and region and is
//                         ACTIVE_HEALTHY, before anything is written to it
//
// Environment (verify): SUPABASE_ACCESS_TOKEN; MGMT_API (tests only). Public values only: no secret is read or kept.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const RECORD = join(ROOT, "docs/recovery/projects.json");
export const WORKFLOWS = join(ROOT, ".github/workflows");
export const ENVS = ["production", "staging"];

/** A Supabase-issued key's project reference, read from its payload (never verified, never trusted beyond this). */
export function jwtRef(token) {
  try {
    const p = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return p && p.iss === "supabase" ? p.ref ?? null : null;
  } catch { return null; }
}

/** The top-level `env:` literal of a workflow (two-space indent), unquoted. */
export function envLiteral(text, key) {
  const m = new RegExp(`^  ${key}:[ \\t]*(.+?)[ \\t]*(#.*)?$`, "m").exec(text);
  return m ? m[1].replace(/^(['"])(.*)\1$/, "$2") : undefined;
}

/** The settings literals each recorded value must equal: [file, key, environment, path in the record]. */
export const SETTING_LITERALS = [
  ["configure-supabase-auth.yml", "APP_ORIGIN", "production", "auth.site_url"],
  ["configure-supabase-auth.yml", "REDIRECT_ALLOW", "production", "auth.uri_allow_list"],
  ["configure-supabase-auth.yml", "DISABLE_SIGNUP", "production", "auth.disable_signup"],
  ["configure-supabase-smtp.yml", "SMTP_HOST", "production", "email.smtp_host"],
  ["configure-supabase-smtp.yml", "SMTP_PORT", "production", "email.smtp_port"],
  ["configure-supabase-smtp.yml", "SMTP_SENDER", "production", "email.smtp_user"],
  ["configure-supabase-smtp.yml", "SMTP_SENDER", "production", "email.smtp_admin_email"],
  ["configure-supabase-smtp.yml", "SMTP_SENDER_NAME", "production", "email.smtp_sender_name"],
  ["staging.yml", "STAGING_ORIGIN", "staging", "auth.site_url"],
  ["staging.yml", "SMTP_HOST", "staging", "email.smtp_host"],
  ["staging.yml", "SMTP_PORT", "staging", "email.smtp_port"],
  ["staging.yml", "SMTP_SENDER", "staging", "email.smtp_user"],
  ["staging.yml", "SMTP_SENDER", "staging", "email.smtp_admin_email"],
  ["staging.yml", "SMTP_SENDER_NAME", "staging", "email.smtp_sender_name"],
];
const at = (o, path) => path.split(".").reduce((x, k) => (x == null ? x : x[k]), o);

export function readWorkflows(dir = WORKFLOWS) {
  return Object.fromEntries(readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort().map((f) => [f, readFileSync(join(dir, f), "utf8")]));
}

/** Every difference between the record and the workflows. */
export function check(record, files) {
  const problems = [];
  const refs = Object.fromEntries(ENVS.map((e) => [record[e].ref, e]));
  const retired = new Set((record.history ?? []).map((h) => h.from));
  for (const [f, text] of Object.entries(files)) {
    for (const [key, env] of [["PRODUCTION_SUPABASE_PROJECT_REF", "production"], ["STAGING_SUPABASE_PROJECT_REF", "staging"]]) {
      for (const m of text.matchAll(new RegExp(`^\\s*${key}:[ \\t]*["']?([^"'\\s#]+)`, "gm"))) {
        if (m[1] !== record[env].ref) problems.push(`${f}: ${key} is ${m[1]}, the record says ${record[env].ref}`);
      }
    }
    for (const m of text.matchAll(/https:\/\/([a-z0-9]+)\.supabase\.co\b/g)) {
      if (!refs[m[1]]) problems.push(`${f}: the address https://${m[1]}.supabase.co names no recorded project`);
    }
    for (const m of text.matchAll(/\b(?:postgres|pintar_backup)\.([a-z0-9]{20})\b/g)) {
      if (!refs[m[1]]) problems.push(`${f}: the pooler user names ${m[1]}, no recorded project`);
    }
    for (const m of text.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
      const r = jwtRef(m[0]);
      if (!r) continue;
      const env = refs[r];
      if (!env) problems.push(`${f}: a public key minted for ${r}, no recorded project`);
      else if (record[env].anon_key !== m[0]) problems.push(`${f}: a public key for ${env} that is not the recorded one`);
    }
    for (const old of retired) {
      if (new RegExp(`\\b${old}\\b`).test(text)) problems.push(`${f}: names ${old}, a retired project reference`);
    }
  }
  for (const [f, key, env, path] of SETTING_LITERALS) {
    const got = files[f] === undefined ? undefined : envLiteral(files[f], key);
    const want = at(record[env], path);
    if (got === undefined) problems.push(`${f}: ${key} is missing (the record holds ${env}.${path})`);
    else if (String(got) !== String(want)) problems.push(`${f}: ${key} is ${got}, the record's ${env}.${path} is ${want}`);
  }
  // staging.yml writes its allow list as <origin>/auth/callback*: the record must say the same
  for (const env of ENVS) {
    const a = record[env].auth;
    if (a.uri_allow_list !== `${a.site_url}/auth/callback*`) problems.push(`the record's ${env} allow list is not ${a.site_url}/auth/callback*`);
  }
  return problems;
}

/** The move of one environment to another project: the new record and files, or why it is refused. */
export function plan(record, files, env, { ref, name, region, anonKey, decision, date = new Date().toISOString().slice(0, 10) }) {
  const problems = [];
  if (!ENVS.includes(env)) problems.push(`${env} is not production or staging`);
  const cur = record[env] ?? {};
  const other = ENVS.find((e) => e !== env);
  if (!/^[a-z]{20}$/.test(ref ?? "")) problems.push(`"${ref}" is not a Supabase project reference (20 lower-case letters)`);
  if (ref && other && ref === record[other].ref) problems.push(`${ref} is ${other}'s project; ${env} may never point at it`);
  if (ref && ref === cur.ref) problems.push(`${env} already points at ${ref}`);
  if ((record.history ?? []).some((h) => h.from === ref)) problems.push(`${ref} is a retired reference; a retired project is never reused`);
  if (!/^[a-z0-9-]{3,}$/.test(name ?? "")) problems.push("the new project's name is missing");
  if (!/^[a-z]{2}-[a-z]+-\d$/.test(region ?? "")) problems.push("the new project's region is missing");
  if (!/^D-\d{3}\b/.test(decision ?? "")) problems.push("no decision (D-nnn) authorises this move");
  if (env === "production" && !anonKey) problems.push("production's new public (anon) key is missing; the deploy and the watch carry it");
  if (anonKey && jwtRef(anonKey) !== ref) problems.push(`the public key given was minted for ${jwtRef(anonKey) ?? "no Supabase project"}, not ${ref}`);
  if (problems.length) return { problems };
  const out = {};
  const changes = [];
  for (const [f, text] of Object.entries(files)) {
    let t = text.replace(new RegExp(`\\b${cur.ref}\\b`, "g"), ref);
    if (cur.anon_key && anonKey) t = t.split(cur.anon_key).join(anonKey);
    out[f] = t;
    if (t !== text) changes.push({ file: f, lines: text.split("\n").filter((l, i) => l !== t.split("\n")[i]).length });
  }
  const next = JSON.parse(JSON.stringify(record));
  next[env] = { ...cur, ref, name, region, url: `https://${ref}.supabase.co`, anon_key: env === "production" ? anonKey : cur.anon_key && anonKey ? anonKey : cur.anon_key };
  next.history = [...(record.history ?? []), { env, from: cur.ref, from_name: cur.name, to: ref, to_name: name, decision, date }];
  const after = check(next, out);
  return { problems: after.map((p) => `after the move: ${p}`), record: next, files: out, changes };
}

/** Read only: the live project is the recorded one, healthy, before anything is written to it. */
export async function verify(record, env, { api = process.env.MGMT_API || "https://api.supabase.com", token = process.env.SUPABASE_ACCESS_TOKEN } = {}) {
  const want = record[env];
  if (!want) return { problems: [`${env} is not recorded`] };
  const r = await fetch(`${api}/v1/projects/${want.ref}`, { headers: { Authorization: `Bearer ${token}`, "User-Agent": "pintar-repoint" } });
  if (r.status !== 200) return { problems: [`the project ${want.ref} could not be read (HTTP ${r.status}); nothing is written to an unverified project`] };
  const p = await r.json();
  const problems = [];
  if ((p.id ?? p.ref) !== want.ref) problems.push(`the API answered for ${p.id ?? p.ref}, not ${want.ref}`);
  if (p.name !== want.name) problems.push(`${want.ref} is named ${p.name}, the record says ${want.name}`);
  if (p.region !== want.region) problems.push(`${want.ref} is in ${p.region}, the record says ${want.region}`);
  if (p.status !== "ACTIVE_HEALTHY") problems.push(`${want.ref} is ${p.status}, not ACTIVE_HEALTHY`);
  return { problems, project: { ref: want.ref, name: p.name, region: p.region, status: p.status } };
}

function flags(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith("--")) o[argv[i].slice(2).replace(/-(.)/g, (_, c) => c.toUpperCase())] = argv[++i];
  return o;
}

async function main(argv) {
  const [cmd, env, ...rest] = argv;
  const record = JSON.parse(readFileSync(process.env.PROJECTS_RECORD || RECORD, "utf8"));
  const dir = process.env.WORKFLOWS_DIR || WORKFLOWS;
  const fail = (ps) => { for (const p of ps) console.log(`::error::${p}`); return ps.length ? 1 : 0; };
  if (cmd === "check") {
    const p = check(record, readWorkflows(dir));
    if (!p.length) console.log(`the workflows match the record: production ${record.production.ref} (${record.production.name}), staging ${record.staging.ref} (${record.staging.name})`);
    return fail(p);
  }
  if (cmd === "plan" || cmd === "apply") {
    const f = flags(rest);
    const r = plan(record, readWorkflows(dir), env, f);
    if (r.problems.length) return fail(r.problems);
    for (const c of r.changes) console.log(`${c.file}: ${c.lines} line(s)`);
    console.log(`${env}: ${record[env].ref} (${record[env].name}) → ${f.ref} (${f.name}), by ${f.decision}`);
    if (cmd === "apply") {
      for (const [file, text] of Object.entries(r.files)) writeFileSync(join(dir, file), text);
      writeFileSync(process.env.PROJECTS_RECORD || RECORD, JSON.stringify(r.record, null, 2) + "\n");
      console.log("written: the record and every workflow; commit them together, reviewed, and let CI run DR-S12");
    }
    return 0;
  }
  if (cmd === "verify") {
    const v = await verify(record, env);
    if (!v.problems.length) console.log(`VERIFIED: ${v.project.ref} is ${v.project.name} in ${v.project.region}, ${v.project.status}, as recorded for ${env}`);
    return fail(v.problems);
  }
  console.error("usage: repoint.mjs check | plan|apply <env> --ref <r> --name <n> --region <r> [--anon-key <k>] --decision <D-nnn> | verify <env>");
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((c) => process.exit(c), (e) => { console.log(`::error::${e.message}`); process.exit(1); });
}
