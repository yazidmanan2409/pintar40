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
  console.error("usage: restore-point.mjs check <record.json>");
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (e) => { console.log(`::error::${e.message}`); process.exit(1); });
}
