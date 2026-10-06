#!/usr/bin/env node
// #150 G6 (owner, 6 Oct): NO MIGRATION REACHES PRODUCTION WITHOUT A RESTORE POINT, AND THE POINT IS RECORDED.
//
// Supabase offers named restore points only to select partners, and production has no point-in-time recovery (D-103:
// 24-hour RPO, deliberately). So the restore point a production apply can rely on is the platform's own daily physical
// backup: if a migration damages production, that backup is what it is restored to. This check refuses the apply unless
// Supabase reports a COMPLETED backup taken within the last 26 hours (the daily schedule plus slack), and writes down
// which one it was, so the run's record says exactly what a rollback would return to and how much would be lost.
//
//   node restore-point.mjs check <record.json>     reads SUPABASE_ACCESS_TOKEN and PRODUCTION_SUPABASE_PROJECT_REF
//
// GET only. It prints the backup's time, status and age and the project's recovery settings; never the token.
//
// #150 WP-A (D-106(a), B3): THE TOKEN THAT READS THE BACKUPS CAN DO NOTHING ELSE.
// SUPABASE_ACCESS_TOKEN here is C1, PRODUCTION_SUPABASE_BACKUPS_READ_TOKEN: a scoped Supabase token for
// pintar-production holding only Database > Backups: Read. The isolation command proves, with GET only, that it reads
// the backup list and is refused everything a broader token would reach: the API keys, the Auth configuration, the
// project's settings, the Edge Function secrets, another project's backups, and the account's projects and
// organisations. A probe's answer is never read or printed (a token that is too broad would be handed keys); only its
// HTTP status is kept.
//
//   node restore-point.mjs isolation <record.json>  also reads OTHER_SUPABASE_PROJECT_REF (staging's ref)
//
// Whether the one permission it holds is Read and not Read-write cannot be seen without a write; the owner's
// screenshot of the token's permission list is that evidence (CLOSURE-PLAN-150.md, O2).
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const MAX_AGE_HOURS = 26;

/**
 * The decision, from Supabase's answer to GET /v1/projects/{ref}/database/backups.
 *   status   the HTTP status
 *   body     the parsed JSON (or null)
 *   now      milliseconds since the epoch
 */
export function decide(status, body, now, maxAgeHours = MAX_AGE_HOURS) {
  if (status !== 200) {
    return { verdict: "REFUSE", reasons: [`Supabase did not list production's backups (HTTP ${status}); ` +
      (status === 401 || status === 403
        ? "the access token needs permission to read the project's backups"
        : "no restore point can be established")] };
  }
  if (!body || !Array.isArray(body.backups)) return { verdict: "REFUSE", reasons: ["Supabase's answer carries no list of backups"] };
  const done = body.backups
    .filter((b) => b && b.status === "COMPLETED" && Number.isFinite(Date.parse(b.inserted_at)))
    .sort((a, b) => Date.parse(b.inserted_at) - Date.parse(a.inserted_at));
  const settings = { pitr_enabled: body.pitr_enabled === true, walg_enabled: body.walg_enabled === true, held: body.backups.length };
  if (done.length === 0) {
    return { verdict: "REFUSE", settings, reasons: [`no COMPLETED backup among the ${body.backups.length} Supabase holds`] };
  }
  const latest = done[0];
  const ageHours = (now - Date.parse(latest.inserted_at)) / 3_600_000;
  if (ageHours < -0.25) {
    return { verdict: "REFUSE", settings, reasons: [`the latest backup is dated in the future (${latest.inserted_at}); the clock or the answer is wrong`] };
  }
  const backup = { id: latest.id ?? null, inserted_at: latest.inserted_at, status: latest.status, is_physical_backup: latest.is_physical_backup ?? null };
  if (ageHours > maxAgeHours) {
    return { verdict: "REFUSE", settings, backup, ageHours, reasons: [`the latest completed backup (${latest.inserted_at}) is ${ageHours.toFixed(1)} hours old, ` +
      `older than ${maxAgeHours}: a rollback would lose more than the agreed 24 hours`] };
  }
  return { verdict: "OK", settings, backup, ageHours, reasons: [`restore point: the completed backup of ${latest.inserted_at}, ${ageHours.toFixed(1)} hours old; ` +
    `a rollback to it would lose what was written since`] };
}

/** What C1 must be refused, each needing a permission other than Backups: Read (Supabase's scoped-token table). */
export const PROBES = [
  { name: "API keys", needs: "API Keys", path: (ref) => `/v1/projects/${ref}/api-keys` },
  { name: "Auth configuration", needs: "Auth Config", path: (ref) => `/v1/projects/${ref}/config/auth` },
  { name: "project settings", needs: "Project Settings", path: (ref) => `/v1/projects/${ref}` },
  { name: "Edge Function secrets", needs: "Edge Function Secrets", path: (ref) => `/v1/projects/${ref}/secrets` },
  { name: "another project's backups", needs: "access to another project", path: (_ref, other) => `/v1/projects/${other}/database/backups` },
  { name: "account's project list", needs: "Projects (account-wide)", path: () => "/v1/projects" },
  { name: "account's organisations", needs: "Organizations", path: () => "/v1/organizations" },
];

const REFUSED = new Set([401, 403, 404]);

/**
 * The isolation verdict. Fail closed: only a 200 for the backups and a 401, 403 or 404 for every probe is ISOLATED;
 * any probe answered 2xx is TOO BROAD; anything else (the backups unreadable, a probe answering 5xx, 429 or nothing)
 * leaves it UNPROVEN.
 *   backups  the HTTP status of GET /v1/projects/{ref}/database/backups
 *   probes   [{ name, needs, status }] in PROBES' order
 */
export function isolation(backups, probes) {
  const broad = probes.filter((p) => p.status >= 200 && p.status < 300);
  if (broad.length > 0) {
    return { verdict: "TOO BROAD", reasons: broad.map((p) => `it reads the ${p.name} (HTTP ${p.status}), which needs ${p.needs}`) };
  }
  const reasons = [];
  if (backups !== 200) reasons.push(`it cannot read production's backups (HTTP ${backups}); it must hold Database > Backups: Read`);
  for (const p of probes) if (!REFUSED.has(p.status)) reasons.push(`the ${p.name} probe gave no refusal (HTTP ${p.status}), so it is not shown to be refused`);
  if (probes.length !== PROBES.length) reasons.push(`${probes.length} of ${PROBES.length} probes were asked`);
  if (reasons.length > 0) return { verdict: "UNPROVEN", reasons };
  return { verdict: "ISOLATED", reasons: [`it reads production's backups and is refused all ${probes.length} probes: ` +
    probes.map((p) => `${p.name} ${p.status}`).join(", ")] };
}

async function status(api, path, token) {
  try {
    const r = await fetch(`${api}${path}`, { method: "GET", headers: { Authorization: `Bearer ${token}`, "User-Agent": "pintar-restore-point" } });
    await r.body?.cancel(); // never read: a token that is too broad would be handed keys here
    return r.status;
  } catch {
    return 0;
  }
}

async function isolationCheck(recordPath) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref = process.env.PRODUCTION_SUPABASE_PROJECT_REF;
  const other = process.env.OTHER_SUPABASE_PROJECT_REF;
  if (!token || !ref || !other || other === ref) {
    console.log("::error::SUPABASE_ACCESS_TOKEN, PRODUCTION_SUPABASE_PROJECT_REF and a different OTHER_SUPABASE_PROJECT_REF are required");
    return 1;
  }
  const api = process.env.SUPABASE_API || "https://api.supabase.com";
  const backups = await status(api, `/v1/projects/${encodeURIComponent(ref)}/database/backups`, token);
  console.log(`GET production's backups: HTTP ${backups}`);
  const probes = [];
  for (const p of PROBES) {
    const s = await status(api, p.path(encodeURIComponent(ref), encodeURIComponent(other)), token);
    probes.push({ name: p.name, needs: p.needs, status: s });
    console.log(`GET the ${p.name} (needs ${p.needs}): HTTP ${s}${REFUSED.has(s) ? ", refused" : ""}`);
  }
  const v = isolation(backups, probes);
  writeFileSync(recordPath, JSON.stringify({
    what: "#150 WP-A: the backups-read token (C1) reads the backups and nothing else",
    project: ref, other_project: other, checked_at: new Date().toISOString(), verdict: v.verdict, reasons: v.reasons,
    backups_status: backups, probes, run: process.env.GITHUB_RUN_ID ?? null,
  }, null, 2) + "\n");
  console.log(`${v.verdict}: ${v.reasons.join("; ")}`);
  if (v.verdict !== "ISOLATED") { console.log(`::error::the backups-read token is ${v.verdict}: ${v.reasons.join("; ")}`); return 1; }
  return 0;
}

async function check(recordPath) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref = process.env.PRODUCTION_SUPABASE_PROJECT_REF;
  if (!token || !ref) { console.log("::error::SUPABASE_ACCESS_TOKEN and PRODUCTION_SUPABASE_PROJECT_REF are required; the apply is refused"); return 1; }
  const api = process.env.SUPABASE_API || "https://api.supabase.com";
  let status = 0, body = null;
  try {
    const r = await fetch(`${api}/v1/projects/${encodeURIComponent(ref)}/database/backups`, {
      method: "GET", headers: { Authorization: `Bearer ${token}`, "User-Agent": "pintar-restore-point" },
    });
    status = r.status;
    try { body = await r.json(); } catch { body = null; }
  } catch (e) {
    console.log(`::error::Supabase could not be asked for production's backups (${e.message}); the apply is refused`);
    return 1;
  }
  const now = Date.now();
  const v = decide(status, body, now);
  const record = {
    what: "#150 G6: the restore point a production migration apply relies on",
    project: ref, checked_at: new Date(now).toISOString(), verdict: v.verdict, reasons: v.reasons,
    backup: v.backup ?? null, age_hours: v.ageHours === undefined ? null : Number(v.ageHours.toFixed(2)), settings: v.settings ?? null,
    release_sha: process.env.RELEASE_SHA ?? null, run: process.env.GITHUB_RUN_ID ?? null,
  };
  writeFileSync(recordPath, JSON.stringify(record, null, 2) + "\n");
  if (v.settings) {
    console.log(`backups held ${v.settings.held}; point-in-time recovery ${v.settings.pitr_enabled ? "on" : "off"}; WAL-G ${v.settings.walg_enabled ? "on" : "off"}`);
  }
  console.log(`${v.verdict}: ${v.reasons.join("; ")}`);
  if (v.verdict !== "OK") { console.log(`::error::${v.reasons.join("; ")}. No migration was applied.`); return 1; }
  return 0;
}

async function main(argv) {
  if (argv[0] === "check" && argv.length === 2) return check(argv[1]);
  if (argv[0] === "isolation" && argv.length === 2) return isolationCheck(argv[1]);
  console.error("usage: restore-point.mjs check|isolation <record.json>");
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (e) => { console.log(`::error::${e.message}`); process.exit(1); });
}
