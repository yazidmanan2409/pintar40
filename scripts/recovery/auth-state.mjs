#!/usr/bin/env node
// #150 WP-C (B8, D-106(f)): THE SIGN-IN AND EMAIL SETTINGS A RECONSTRUCTED PROJECT MUST CARRY, APPLIED AND READ BACK.
//
// A native restore copies the database and nothing of Supabase's Auth configuration (G2, JOURNEY-LOG item 38: the copy
// had the leaked-password check off and no sender). What a PINTAR project must carry is declared in two places only:
// docs/recovery/projects.json (each environment's address, allow list, sign-up closed, sender) and
// supabase/auth-identitas.json (Gate 3's settings, D-079). This computes that state and:
//   verify <env> --ref <project> [--origin <url>] [--hibp-unavailable]
//            read only, anywhere: reads the project's Auth configuration back and compares every declared field;
//            smtp_pass is never read, compared or printed
//   apply <env> --ref <project> --origin <url> --rehearsal
//            WRITES, to a rehearsal copy only (RUNBOOK-NATIVE-RESTORE.md, O8): the copy of <env>'s data gets <env>'s
//            settings with the rehearsal's own address. A recorded project (staging's, production's, or one retired) is
//            refused: staging and production are written only by their own workflows (staging.yml,
//            configure-supabase-auth.yml, configure-supabase-smtp.yml), which read back what they write.
//            The leaked-password check is written on its own and may be refused by the plan (D-082(a)): a warning.
//
// Environment: SUPABASE_ACCESS_TOKEN (the project's), PINTAR_SMTP_PASSWORD (apply only; never printed), MGMT_API (tests)
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const json = (p) => JSON.parse(readFileSync(p, "utf8"));
export const record = () => json(process.env.PROJECTS_RECORD || join(ROOT, "docs/recovery/projects.json"));
export const identitas = () => json(join(ROOT, "supabase/auth-identitas.json"));

/** The declared state of <env>, with a rehearsal's own address in place of the environment's. */
export function desired(rec, ids, env, { origin } = {}) {
  const e = rec[env];
  if (!e) throw new Error(`${env} is not recorded`);
  const site = origin ?? e.auth.site_url;
  const boundary = { site_url: site, uri_allow_list: `${site}/auth/callback*`, disable_signup: e.auth.disable_signup };
  // Gate 3's settings go wherever the release carrying them runs: staging always; production once applied (C-11)
  const withIdentity = env === "staging" || ids.production_applied === true;
  const { password_hibp_enabled: hibp, ...identity } = ids.settings;
  return { boundary, email: { ...e.email }, identity: withIdentity ? identity : {}, hibp: withIdentity ? { password_hibp_enabled: hibp } : {} };
}

const same = (got, want) => (want === "" && got == null) || String(got) === String(want);

/** Every declared field, read back: [{key, want, got, ok}]. */
export function compare(config, want, { hibpUnavailable = false } = {}) {
  const rows = [];
  for (const part of ["boundary", "email", "identity", "hibp"]) {
    for (const [key, w] of Object.entries(want[part])) {
      const got = config[key];
      const ok = same(got, w) || (key === "password_hibp_enabled" && hibpUnavailable);
      rows.push({ key, want: w, got, ok, note: !same(got, w) && ok ? "the plan does not provide it (D-082(a))" : "" });
    }
  }
  return rows;
}

async function call(method, api, ref, token, body) {
  const r = await fetch(`${api}/v1/projects/${ref}/config/auth`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json",
    "User-Agent": "pintar-auth-state" }, ...(body ? { body: JSON.stringify(body) } : {}) });
  let d = null;
  try { d = await r.json(); } catch { /* an empty or non-JSON answer */ }
  return { status: r.status, body: d };
}

/** A copy may be written only when it is none of the recorded projects. */
export function rehearsalTarget(rec, ref) {
  const known = new Map([...["production", "staging"].map((e) => [rec[e].ref, e]), ...(rec.history ?? []).map((h) => [h.from, "retired"])]);
  if (!/^[a-z]{20}$/.test(ref ?? "")) return [`"${ref}" is not a Supabase project reference`];
  if (known.has(ref)) return [`${ref} is ${known.get(ref) === "retired" ? "a retired project" : `${known.get(ref)}'s project`}; a rehearsal writes only to its own copy`];
  return [];
}

export async function apply({ rec, ids, env, ref, origin, api, token, smtpPassword }) {
  const problems = rehearsalTarget(rec, ref);
  if (!origin || !/^https:\/\/[a-z0-9.-]+$/.test(origin)) problems.push("the rehearsal's own address (https://…, no path) is required");
  if (!smtpPassword) problems.push("PINTAR_SMTP_PASSWORD is not set; the sender cannot be written");
  if (problems.length) return { problems, steps: [] };
  const want = desired(rec, ids, env, { origin });
  const steps = [];
  for (const [part, body] of [["boundary", want.boundary], ["email", { ...want.email, smtp_pass: smtpPassword }], ["identity", want.identity]]) {
    if (!Object.keys(body).length) continue;
    const r = await call("PATCH", api, ref, token, body);
    steps.push({ part, status: r.status });
    if (r.status !== 200) return { problems: [`the ${part} write was refused (HTTP ${r.status})`], steps };
  }
  let hibpUnavailable = false;
  if (Object.keys(want.hibp).length) {
    const r = await call("PATCH", api, ref, token, want.hibp);
    steps.push({ part: "leaked-password check", status: r.status });
    hibpUnavailable = r.status !== 200;
  }
  return { problems: [], steps, hibpUnavailable };
}

export async function readBack({ rec, ids, env, ref, origin, api, token, hibpUnavailable }) {
  const r = await call("GET", api, ref, token);
  if (r.status !== 200 || !r.body) return { problems: [`the Auth configuration of ${ref} could not be read (HTTP ${r.status})`], rows: [] };
  const rows = compare(r.body, desired(rec, ids, env, { origin }), { hibpUnavailable });
  return { problems: rows.filter((x) => !x.ok).map((x) => `${x.key} is ${JSON.stringify(x.got)}, declared ${JSON.stringify(x.want)}`), rows };
}

function flags(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    const k = argv[i].slice(2).replace(/-(.)/g, (_, c) => c.toUpperCase());
    o[k] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
  }
  return o;
}

async function main(argv) {
  const [cmd, env, ...rest] = argv;
  const f = flags(rest);
  const ctx = { rec: record(), ids: identitas(), env, ref: f.ref, origin: f.origin, api: process.env.MGMT_API || "https://api.supabase.com",
    token: process.env.SUPABASE_ACCESS_TOKEN };
  const show = (rows) => { for (const x of rows) console.log(`${x.key.padEnd(52)} ${x.ok ? "ok " : "BAD"} ${JSON.stringify(x.got)}${x.note ? `  (${x.note})` : ""}`); console.log(`${"smtp_pass".padEnd(52)} (never read, never printed)`); };
  if (cmd === "verify") {
    const v = await readBack({ ...ctx, hibpUnavailable: f.hibpUnavailable === true });
    show(v.rows);
    for (const p of v.problems) console.log(`::error::${p}`);
    if (!v.problems.length) console.log(`READ BACK: ${ctx.ref} carries every declared ${env} setting${ctx.origin ? ` for ${ctx.origin}` : ""}`);
    return v.problems.length ? 1 : 0;
  }
  if (cmd === "apply") {
    if (f.rehearsal !== true) { console.log("::error::apply writes to a rehearsal copy only (--rehearsal); staging and production are written by their own workflows"); return 1; }
    const a = await apply({ ...ctx, smtpPassword: process.env.PINTAR_SMTP_PASSWORD });
    for (const s of a.steps) console.log(`PATCH (${s.part}) -> HTTP ${s.status}`);
    if (a.hibpUnavailable) console.log("::warning::the plan did not accept the leaked-password check; it stays off (D-082(a))");
    if (a.problems.length) { for (const p of a.problems) console.log(`::error::${p}`); return 1; }
    await new Promise((ok) => setTimeout(ok, Number(process.env.READ_BACK_DELAY_MS ?? 5000)));
    const v = await readBack({ ...ctx, hibpUnavailable: a.hibpUnavailable });
    show(v.rows);
    for (const p of v.problems) console.log(`::error::${p}`);
    if (!v.problems.length) console.log(`APPLIED AND READ BACK: ${ctx.ref} carries ${env}'s settings for ${ctx.origin}`);
    return v.problems.length ? 1 : 0;
  }
  console.error("usage: auth-state.mjs verify <env> --ref <r> [--origin <url>] [--hibp-unavailable] | apply <env> --ref <r> --origin <url> --rehearsal");
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((c) => process.exit(c), (e) => { console.log(`::error::${e.message}`); process.exit(1); });
}
