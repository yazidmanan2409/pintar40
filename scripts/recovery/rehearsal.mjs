#!/usr/bin/env node
// #150 WP-C (B8, D-106(f)): THE REHEARSAL'S GUARDS AND READ-ONLY FACTS (RUNBOOK-NATIVE-RESTORE.md, "The rehearsal (O8)").
//
// The rehearsal proves the runbook on a copy of staging that the owner restored to a new project named …-DELETE-ME
// (O8), through recovery-rehearsal.yml. Nothing here writes; each command answers one question before anything does:
//   guard <copy-ref>     the copy is none of the recorded projects (staging's, production's, a retired one); the
//                        Management API shows it exists, named …-DELETE-ME, in staging's region, ACTIVE_HEALTHY; the
//                        rehearsal's token (C10) is refused by staging's and production's projects; the copy's database
//                        address names the copy and no recorded project
//   keys <copy-ref>      the copy's public (anon) and service keys, read with C10 (API keys: read); each must have been
//                        issued for the copy. Into $GITHUB_ENV, masked; never printed
//   vercel               staging's Vercel project, read only: whether preview deployments are behind Vercel's protection
//                        (then the owner's temporary bypass is needed), and whether staging's durable
//                        secrets and card domain reach a preview (names and targets only, never a value)
//   facts <a> <b>        two outputs of audit/restore/fakta.sql (staging, the copy): every line equal, or each differing
//                        table and fact named
//
// Environment: SUPABASE_ACCESS_TOKEN (C10), REHEARSAL_DB_URL (guard), VERCEL_TOKEN and STAGING_VERCEL_PROJECT_NAME
// (vercel); MGMT_API, VERCEL_API (tests only).
import { appendFileSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { record, rehearsalTarget } from "./auth-state.mjs";

const REF = /^[a-z]{20}$/;
// what a preview of staging's project must already carry for the copy's data to work: the cards' PIN derivation and
// address domain, and the certificates' seal (the rehearsal supplies the Supabase address and keys itself)
export const FROM_STAGING = ["CARD_PEPPER", "CERT_SECRET_KEY_V1", "CARD_EMAIL_DOMAIN"];

async function get(url, token) {
  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "User-Agent": "pintar-rehearsal" }, signal: AbortSignal.timeout(30000) });
    let body = null;
    try { body = await r.json(); } catch { /* not JSON */ }
    return { status: r.status, body };
  } catch (e) {
    return { status: 0, body: null, error: e.message };
  }
}

/** Every reason the copy may not be written to; [] when it is the rehearsal's own. */
export async function guard(rec, { ref, dbUrl, api, token }) {
  const problems = rehearsalTarget(rec, ref);
  if (problems.length) return problems;
  if (!token) return ["the rehearsal's token (C10) is not set"];
  const p = await get(`${api}/v1/projects/${ref}`, token);
  if (p.status !== 200 || !p.body) problems.push(`the copy ${ref} could not be read with C10 (HTTP ${p.status})`);
  else {
    if (!/-delete-me$/i.test(p.body.name ?? "")) problems.push(`the project ${ref} is named "${p.body.name}", not …-DELETE-ME: it is not a rehearsal copy`);
    if (p.body.region !== rec.staging.region) problems.push(`the copy is in ${p.body.region}, staging in ${rec.staging.region}`);
    if (p.body.status !== "ACTIVE_HEALTHY") problems.push(`the copy is ${p.body.status}, not ACTIVE_HEALTHY`);
  }
  for (const env of ["staging", "production"]) {
    const o = await get(`${api}/v1/projects/${rec[env].ref}`, token);
    if (o.status === 200) problems.push(`C10 reads ${env}'s project: TOO BROAD (it must reach the copy only)`);
  }
  let u = null;
  try { u = new URL(dbUrl ?? ""); } catch { /* below */ }
  if (!u || !/^postgres(ql)?:$/.test(u.protocol)) problems.push("the copy's database address is not set or not a postgres URL");
  else {
    const who = `${decodeURIComponent(u.username)}@${u.hostname}`;
    const known = [rec.production.ref, rec.staging.ref, ...(rec.history ?? []).map((h) => h.from)];
    if (!who.includes(ref)) problems.push("the copy's database address does not name the copy");
    if (known.some((k) => who.includes(k))) problems.push("the copy's database address names a recorded project");
  }
  return problems;
}

const claims = (t) => { try { return JSON.parse(Buffer.from(String(t).split(".")[1], "base64url").toString("utf8")); } catch { return {}; } };

/** The copy's anon and service keys, each checked to have been issued for the copy. */
export async function keys({ ref, api, token }) {
  const r = await get(`${api}/v1/projects/${ref}/api-keys`, token);
  if (r.status !== 200 || !Array.isArray(r.body)) return { problems: [`the copy's API keys could not be read with C10 (HTTP ${r.status})`] };
  const pick = (role) => r.body.map((k) => k.api_key).find((k) => claims(k).role === role && claims(k).ref === ref);
  const anon = pick("anon"), service = pick("service_role");
  const problems = [];
  // the application signs requests with the JWT keys; a copy offering only the newer key format is a stop point
  if (!anon) problems.push("the copy has no anon (JWT) key issued for it");
  if (!service) problems.push("the copy has no service_role (JWT) key issued for it");
  return { problems, anon, service };
}

/** Staging's Vercel project, read only: are previews protected, and does a preview carry staging's own values? */
export async function vercel({ api, token, project }) {
  const p = await get(`${api}/v9/projects/${encodeURIComponent(project)}`, token);
  if (p.status !== 200 || !p.body) return { problems: [`staging's Vercel project ${project} could not be read (HTTP ${p.status})`] };
  if (p.body.name !== project) return { problems: [`Vercel answered for "${p.body.name}", not ${project}`] };
  const gate = [p.body.ssoProtection && `Vercel Authentication (${p.body.ssoProtection.deploymentType ?? "on"})`,
    p.body.passwordProtection && `password protection (${p.body.passwordProtection.deploymentType ?? "on"})`].filter(Boolean);
  const e = await get(`${api}/v9/projects/${encodeURIComponent(project)}/env?decrypt=false`, token);
  if (e.status !== 200 || !Array.isArray(e.body?.envs)) return { problems: [`staging's Vercel variables could not be listed (HTTP ${e.status})`] };
  const targets = (k) => e.body.envs.filter((v) => v.key === k).flatMap((v) => (Array.isArray(v.target) ? v.target : [v.target]).filter(Boolean));
  const notInPreview = FROM_STAGING.filter((k) => !targets(k).includes("preview"));
  const problems = notInPreview.map((k) => `staging's ${k} does not reach a preview deployment (targets: ${targets(k).join(", ") || "none"}); `
    + "giving it the preview target is a Vercel setting change: the owner decides");
  return { problems, gate, notInPreview };
}

/** fakta.sql's lines, T|table|rows|hash and F|fact|value, compared. */
export function factsDiff(a, b) {
  const read = (s) => {
    const m = new Map();
    for (const l of String(s).split("\n").filter(Boolean)) {
      const [kind, name, ...rest] = l.split("|");
      m.set(`${kind}|${name}`, rest.join("|"));
    }
    return m;
  };
  const A = read(a), B = read(b);
  const keys = [...new Set([...A.keys(), ...B.keys()])].sort();
  const differ = keys.filter((k) => A.get(k) !== B.get(k)).map((k) => {
    const [kind, name] = k.split("|");
    const why = !A.has(k) ? "only on the copy" : !B.has(k) ? "missing on the copy" : kind === "T" ? "rows or content differ" : "differs";
    return `${kind === "T" ? "table" : "fact"} ${name}: ${why}`;
  });
  return { tables: [...A.keys()].filter((k) => k.startsWith("T|")).length, facts: [...A.keys()].filter((k) => k.startsWith("F|")).length, differ };
}

async function main([cmd, ...rest]) {
  const rec = record();
  const api = process.env.MGMT_API || "https://api.supabase.com";
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const fail = (ps) => { for (const p of ps) console.log(`::error::${p}`); return ps.length ? 1 : 0; };
  if (cmd === "guard") {
    const ref = rest[0];
    const ps = await guard(rec, { ref, dbUrl: process.env.REHEARSAL_DB_URL, api, token });
    if (!ps.length) console.log(`THE COPY IS THE REHEARSAL'S OWN: ${ref}, named …-DELETE-ME, ${rec.staging.region}, ACTIVE_HEALTHY; C10 refused by staging and production; the database address names the copy`);
    return fail(ps);
  }
  if (cmd === "keys") {
    const ref = rest[0];
    if (!REF.test(ref ?? "")) return fail([`"${ref}" is not a Supabase project reference`]);
    const k = await keys({ ref, api, token });
    if (k.problems.length) return fail(k.problems);
    console.log(`::add-mask::${k.anon}`);
    console.log(`::add-mask::${k.service}`);
    if (!process.env.GITHUB_ENV) return fail(["GITHUB_ENV is not set: the keys are never printed"]);
    appendFileSync(process.env.GITHUB_ENV, `REHEARSAL_ANON_KEY=${k.anon}\nREHEARSAL_SERVICE_KEY=${k.service}\n`);
    console.log(`the copy's anon and service keys, each issued for ${ref}, are in this job's environment (masked)`);
    return 0;
  }
  if (cmd === "vercel") {
    const v = await vercel({ api: process.env.VERCEL_API || "https://api.vercel.com", token: process.env.VERCEL_TOKEN, project: process.env.STAGING_VERCEL_PROJECT_NAME });
    const ps = [...v.problems];
    if (v.gate?.length) {
      if (rest.includes("--bypass-present")) console.log(`preview deployments are behind ${v.gate.join(" and ")}: the owner's temporary bypass is set for this rehearsal`);
      else ps.push(`preview deployments are behind ${v.gate.join(" and ")}: reaching the rehearsal's preview needs the owner's temporary bypass (REHEARSAL_VERCEL_BYPASS), created for the rehearsal and removed after it`);
    } else if (v.gate) console.log("preview deployments are not behind Vercel's protection");
    if (!v.problems.length) console.log(`staging's ${FROM_STAGING.join(", ")} reach a preview deployment (names and targets only)`);
    return fail(ps);
  }
  if (cmd === "facts") {
    const [a, b] = rest;
    const d = factsDiff(readFileSync(a, "utf8"), readFileSync(b, "utf8"));
    for (const x of d.differ.slice(0, 40)) console.log(`  ${x}`);
    if (!d.differ.length && d.tables > 0) { console.log(`THE COPY'S FACTS EQUAL STAGING'S: ${d.tables} tables and ${d.facts} facts, line for line`); return 0; }
    return fail([d.tables ? `${d.differ.length} difference(s) between staging and the copy: logical drift, or staging written after its backup; nothing is repaired by hand` : "no facts were read"]);
  }
  console.error("usage: rehearsal.mjs guard <copy-ref> | keys <copy-ref> | vercel [--bypass-present] | facts <staging-facts> <copy-facts>");
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((c) => process.exit(c), (e) => { console.log(`::error::${e.message}`); process.exit(1); });
}
