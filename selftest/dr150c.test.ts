/**
 * #150 WP-C (B8, D-106(f), D-111(g)): RECONSTRUCTING PINTAR IN A NEW ENVIRONMENT.
 *
 *  DR-S12  the guarded repointing and the Auth read-back. docs/recovery/projects.json is the one record of which
 *          projects the workflows point at and of the sign-in and email settings each must carry: every workflow's
 *          project reference, address, pooler user and public key, and every settings literal, equals it (a planted
 *          drift is named). scripts/recovery/repoint.mjs moves an environment to a new project in one rewrite of the
 *          record and every workflow (every occurrence moved, nothing else changed, the result clean) and refuses a
 *          malformed reference, the other environment's, the current one, a retired one, a move without its decision,
 *          and production without its new public key or with a key minted for another project; `verify` refuses a
 *          live project whose name, region or health differ from the record, or that cannot be read.
 *          scripts/recovery/auth-state.mjs, executed against a stand-in for Supabase's Management API: `apply` writes a
 *          rehearsal copy only (staging's, production's and a missing --rehearsal are refused), then reads back every
 *          declared field; the sender password is written but never printed; a field that does not land is named; a
 *          plan without the leaked-password check is a warning; `verify` of production leaves Gate 3's settings out
 *          until supabase/auth-identitas.json says production carries them
 *  DR-S13  the runbook (docs/recovery/RUNBOOK-NATIVE-RESTORE.md) ties every one of its nine steps to an owner action or
 *          to workflows and scripts that exist, each with a check naming tests that exist and a stop condition; every
 *          job of a named workflow that holds a production credential runs from main only; each clause of B8's
 *          sentence maps to steps. RESTATED FOR WP-C.2: nothing is left marked PENDING (the rehearsal's preview and the
 *          functional checks are built), and the rehearsal's workflow is among those it ties to steps
 *  DR-S17  the rehearsal (O8) on a copy of staging, scripts/recovery/rehearsal.mjs executed against stand-ins for the
 *          Management API and Vercel's API: `guard` admits only a copy named …-DELETE-ME in staging's region and
 *          healthy, refuses staging's, production's, a retired and a malformed reference, a token that reads staging or
 *          production (TOO BROAD) and a database address that names a recorded project or not the copy; `keys` takes
 *          only keys issued for the copy and never prints them; `vercel` says a protected preview needs the owner's
 *          bypass and a preview without staging's card or certificate values needs the owner; `facts` names each
 *          differing table and fact. recovery-rehearsal.yml: dispatch only, from main, in staging-recovery-drill; no
 *          production credential or reference; the guard before every write; Auth and the checks only with
 *          --rehearsal; a preview of staging's Vercel project and never --prod, a project variable, domain or
 *          protection setting; teardown removes and confirms
 *  DR-D03  the four functional checks (scripts/recovery/functional.mjs), against the running app and the local stack:
 *          a staff sign-in, a class-card sign-in after a re-issue, a certificate the app sealed verified by its token
 *          (BERLAKU), and a file signed by the app and served with the bundle's SHA-256, all four PASS; without
 *          --rehearsal nothing is re-issued; each planted fault fails its own check and only that one: a wrong
 *          password (F1), a learner without a card (F2), an altered seal (F3), a file that differs from the bundle's
 *          record (F4); `pick` reads a school admin, a card learner of that school and an issued certificate
 */
import { spawn, spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ipUji, lit, Peramban, psql } from "./bob26.test";
import { Checks, type SelfTest } from "./lib";

type Record_ = { production: Env; staging: Env; history?: { from: string }[] };
type Env = { ref: string; name: string; region: string; url: string; anon_key: string | null; auth: Record<string, unknown>; email: Record<string, string> };
type Repoint = {
  check: (r: Record_, f: Record<string, string>) => string[];
  plan: (r: Record_, f: Record<string, string>, env: string, o: Record<string, string | undefined>) => { problems: string[]; record?: Record_; files?: Record<string, string> };
  readWorkflows: (d?: string) => Record<string, string>;
  jwtRef: (t: string) => string | null;
};

/** A Supabase-style public key for a project (unsigned: only its payload is read). */
const fakeAnon = (ref: string) => ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  Buffer.from(JSON.stringify({ iss: "supabase", ref, role: "anon", iat: 1, exp: 2 })).toString("base64url"), "c2lnbmF0dXJl"].join(".");

/** A stand-in for the Management API: GET /v1/projects/{ref}, GET and PATCH /v1/projects/{ref}/config/auth. */
async function standInMgmt(o: { projects?: Record<string, object>; drop?: string[]; refuseHibp?: boolean; status?: number } = {}) {
  const config = new Map<string, Record<string, unknown>>();
  const patches: { ref: string; keys: string[] }[] = [];
  const srv = createServer((q, a) => {
    let body = "";
    q.on("data", (b) => (body += b));
    q.on("end", () => {
      const m = /^\/v1\/projects\/([a-z]{20})(\/config\/auth)?$/.exec(q.url ?? "");
      if (!m || o.status) { a.writeHead(o.status ?? 404); a.end("{}"); return; }
      const [, ref, auth] = m;
      if (!auth) {
        const p = o.projects?.[ref];
        a.writeHead(p ? 200 : 404, { "content-type": "application/json" }); a.end(JSON.stringify(p ?? {})); return;
      }
      const cur = config.get(ref) ?? {};
      if (q.method === "PATCH") {
        const patch = JSON.parse(body) as Record<string, unknown>;
        patches.push({ ref, keys: Object.keys(patch) });
        if (o.refuseHibp && "password_hibp_enabled" in patch) { a.writeHead(400); a.end('{"message":"plan"}'); return; }
        for (const [k, v] of Object.entries(patch)) if (!(o.drop ?? []).includes(k)) cur[k] = v;
        config.set(ref, cur);
        a.writeHead(200, { "content-type": "application/json" }); a.end("{}"); return;
      }
      const { smtp_pass: _hidden, ...shown } = cur;   // the real API never returns it
      void _hidden;
      a.writeHead(200, { "content-type": "application/json" }); a.end(JSON.stringify(shown));
    });
  });
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", () => r()));
  return { url: `http://127.0.0.1:${(srv.address() as AddressInfo).port}`, config, patches, close: () => new Promise((r) => srv.close(r)) };
}

const node = (args: string[], env: Record<string, string>) => new Promise<{ code: number | null; text: string }>((done) => {
  const p = spawn("node", args, { env: { PATH: process.env.PATH ?? "", NODE_ENV: "production", READ_BACK_DELAY_MS: "0", ...env } });
  let text = ""; p.stdout.on("data", (b) => (text += b)); p.stderr.on("data", (b) => (text += b)); p.on("close", (code) => done({ code, text }));
});


/** A stand-in answering each GET path (query ignored) from a table: path -> [status, body]. */
async function standInJson(routes: Record<string, [number, unknown]>) {
  const seen: string[] = [];
  const srv = createServer((q, a) => {
    seen.push(`${q.method} ${q.url}`);
    const r = q.method === "GET" ? routes[(q.url ?? "").split("?")[0]] : undefined;
    a.writeHead(r?.[0] ?? (q.method === "GET" ? 404 : 405), { "content-type": "application/json" }); a.end(JSON.stringify(r?.[1] ?? {}));
  });
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", () => r()));
  return { url: `http://127.0.0.1:${(srv.address() as AddressInfo).port}`, seen, close: () => new Promise((r) => srv.close(r)) };
}

/** A Supabase-style JWT key for a project and role (unsigned: only its payload is read). */
const fakeKey = (ref: string, role: string) => ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  Buffer.from(JSON.stringify({ iss: "supabase", ref, role, iat: 1, exp: 2 })).toString("base64url"), randomBytes(8).toString("base64url")].join(".");

export const dr150cTests: SelfTest[] = [
  {
    id: "DR-S12",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const RP = join(repoRoot, "scripts/recovery/repoint.mjs"), AS = join(repoRoot, "scripts/recovery/auth-state.mjs");
      const REC = join(repoRoot, "docs/recovery/projects.json");
      if (!c.expect(existsSync(RP) && existsSync(AS) && existsSync(REC), "repoint.mjs, auth-state.mjs or docs/recovery/projects.json is missing: nothing repoints the workflows or reads Auth back")) return c.verdict("");
      const m = (await import(pathToFileURL(RP).href)) as Repoint;
      const rec = JSON.parse(readFileSync(REC, "utf8")) as Record_;
      const files = m.readWorkflows(join(repoRoot, ".github/workflows"));
      // 1. the repository: the workflows equal the record
      const now = m.check(rec, files);
      c.expect(now.length === 0, `the workflows differ from the record: ${now.slice(0, 4).join("; ")}`);
      c.expect(rec.production.ref !== rec.staging.ref && m.jwtRef(rec.production.anon_key ?? "") === rec.production.ref, "the record's production key or references are inconsistent");
      // 2. drift is named
      const drift = { ...files };
      drift["production-watch.yml"] = drift["production-watch.yml"].replace(/PRODUCTION_SUPABASE_PROJECT_REF: [a-z]{20}/, "PRODUCTION_SUPABASE_PROJECT_REF: zzzzzzzzzzzzzzzzzzzz");
      drift["configure-supabase-smtp.yml"] = drift["configure-supabase-smtp.yml"].replace(/^ {2}SMTP_SENDER_NAME: .*$/m, "  SMTP_SENDER_NAME: Someone Else");
      const dp = m.check(rec, drift).join("; ");
      c.expect(/production-watch\.yml: PRODUCTION_SUPABASE_PROJECT_REF is z{20}/.test(dp) && /SMTP_SENDER_NAME is Someone Else/.test(dp), `a planted drift is not named: ${dp.slice(0, 300)}`);
      // 3. the move of production, planned: every occurrence moved, nothing else changed, the result clean
      const NEW = "abcdefghijklmnopqrst";
      const count = (fs: Record<string, string>, s: string) => Object.values(fs).reduce((n, t) => n + t.split(s).length - 1, 0);
      const p = m.plan(rec, files, "production", { ref: NEW, name: "pintar-production-2", region: "ap-southeast-1", anonKey: fakeAnon(NEW), decision: "D-999" });
      c.expect(p.problems.length === 0 && !!p.files && count(p.files, rec.production.ref) === 0 && count(p.files, NEW) === count(files, rec.production.ref)
        && count(p.files, rec.staging.ref) === count(files, rec.staging.ref) && count(p.files, fakeAnon(NEW)) === count(files, rec.production.anon_key ?? "-"),
        `the planned move: ${p.problems.join("; ") || `old ${count(p.files ?? {}, rec.production.ref)}, new ${count(p.files ?? {}, NEW)}`}`);
      const unrelated = p.files ? Object.keys(files).filter((f) => p.files![f] !== files[f] && !files[f].includes(rec.production.ref)) : ["?"];
      c.expect(unrelated.length === 0, `the move changed files that never named production: ${unrelated.join(", ")}`);
      c.expect(p.record?.production.ref === NEW && p.record?.history?.[0]?.from === rec.production.ref && m.check(p.record!, p.files!).length === 0,
        "the moved record is not the new one, keeps no history, or is not clean");
      // refusals
      const refuse = (o: Record<string, string | undefined>, re: RegExp, why: string, r: Record_ = rec, fs = files) => {
        const x = m.plan(r, fs, "production", { name: "pintar-production-2", region: "ap-southeast-1", decision: "D-999", ...o });
        c.expect(re.test(x.problems.join("; ")), `${why} is not refused: ${x.problems.join("; ") || "planned"}`);
      };
      refuse({ ref: rec.staging.ref, anonKey: fakeAnon(rec.staging.ref) }, /staging's project; production may never point at it/, "staging's reference");
      refuse({ ref: "NOT-A-REF", anonKey: fakeAnon("NOT-A-REF") }, /is not a Supabase project reference/, "a malformed reference");
      refuse({ ref: rec.production.ref, anonKey: rec.production.anon_key ?? "" }, /already points at/, "the current reference");
      refuse({ ref: NEW, anonKey: fakeAnon(NEW), decision: undefined }, /no decision/, "a move without its decision");
      refuse({ ref: NEW, anonKey: undefined }, /new public \(anon\) key is missing/, "production without its new public key");
      refuse({ ref: NEW, anonKey: fakeAnon("qqqqqqqqqqqqqqqqqqqq") }, /minted for q{20}, not abcdefghijklmnopqrst/, "a public key minted for another project");
      if (p.record && p.files) refuse({ ref: rec.production.ref, anonKey: rec.production.anon_key ?? "" }, /retired reference/, "moving back to a retired reference", p.record, p.files);
      // 4. apply, on a copy: written together, and clean
      const dir = mkdtempSync(join(tmpdir(), "dr-s12-"));
      cpSync(join(repoRoot, ".github/workflows"), join(dir, "wf"), { recursive: true });
      writeFileSync(join(dir, "projects.json"), readFileSync(REC));
      const ap = await node([RP, "apply", "production", "--ref", NEW, "--name", "pintar-production-2", "--region", "ap-southeast-1", "--anon-key", fakeAnon(NEW), "--decision", "D-999"],
        { WORKFLOWS_DIR: join(dir, "wf"), PROJECTS_RECORD: join(dir, "projects.json") });
      const ck = await node([RP, "check"], { WORKFLOWS_DIR: join(dir, "wf"), PROJECTS_RECORD: join(dir, "projects.json") });
      const left = readdirSync(join(dir, "wf")).filter((f) => readFileSync(join(dir, "wf", f), "utf8").includes(rec.production.ref));
      c.expect(ap.code === 0 && ck.code === 0 && left.length === 0 && JSON.parse(readFileSync(join(dir, "projects.json"), "utf8")).production.ref === NEW,
        `apply on a copy: exit ${ap.code}, check ${ck.code}, old reference left in ${left.join(", ") || "nothing"}; ${(ap.text + ck.text).trim().split("\n").slice(-2).join(" | ")}`);
      // 5. verify: the live project is the recorded one, healthy
      const proj = (o: object) => ({ [rec.production.ref]: { id: rec.production.ref, name: rec.production.name, region: rec.production.region, status: "ACTIVE_HEALTHY", ...o } });
      for (const [why, api, re] of [
        ["as recorded", await standInMgmt({ projects: proj({}) }), /^VERIFIED: /m],
        ["another name", await standInMgmt({ projects: proj({ name: "pintar-g8-rehearsal-DELETE-ME" }) }), /is named pintar-g8-rehearsal-DELETE-ME, the record says pintar-production/],
        ["another region", await standInMgmt({ projects: proj({ region: "us-east-1" }) }), /is in us-east-1/],
        ["not healthy", await standInMgmt({ projects: proj({ status: "COMING_UP" }) }), /is COMING_UP, not ACTIVE_HEALTHY/],
        ["unreadable", await standInMgmt({ status: 403 }), /could not be read \(HTTP 403\); nothing is written to an unverified project/],
      ] as const) {
        try {
          const v = await node([RP, "verify", "production"], { MGMT_API: api.url, SUPABASE_ACCESS_TOKEN: "standin" });
          c.expect(re.test(v.text) && (why === "as recorded" ? v.code === 0 : v.code !== 0), `verify, ${why}: exit ${v.code}; ${v.text.trim().slice(0, 200)}`);
        } finally { await api.close(); }
      }
      // 6. the Auth read-back: a rehearsal copy written and read back; nothing recorded is ever written
      const COPY = "rehearsalcopyrefaaaa", ORIGIN = "https://rehearsal.example.test", PW = "smtp-standin-Password-0123456789";
      const ids = JSON.parse(readFileSync(join(repoRoot, "supabase/auth-identitas.json"), "utf8")) as { settings: Record<string, unknown>; production_applied: boolean };
      const a1 = await standInMgmt();
      try {
        const r = await node([AS, "apply", "staging", "--ref", COPY, "--origin", ORIGIN, "--rehearsal"], { MGMT_API: a1.url, SUPABASE_ACCESS_TOKEN: "standin", PINTAR_SMTP_PASSWORD: PW });
        const got = a1.config.get(COPY) ?? {};
        const declared = { site_url: ORIGIN, uri_allow_list: `${ORIGIN}/auth/callback*`, disable_signup: true, ...rec.staging.email, ...ids.settings };
        const wrong = Object.entries(declared).filter(([k, v]) => String(got[k]) !== String(v)).map(([k]) => k);
        c.expect(r.code === 0 && /APPLIED AND READ BACK/.test(r.text) && wrong.length === 0 && got.smtp_pass === PW && !r.text.includes(PW)
          && a1.patches.map((x) => x.keys.includes("password_hibp_enabled") ? "hibp" : x.keys.includes("smtp_host") ? "email" : x.keys.includes("site_url") ? "boundary" : "identity").join(",") === "boundary,email,identity,hibp",
          `apply to a rehearsal copy: exit ${r.code}; wrong ${wrong.join(", ") || "none"}; password printed ${r.text.includes(PW)}; ${r.text.trim().split("\n").slice(-1)}`);
      } finally { await a1.close(); }
      const a2 = await standInMgmt({ drop: ["smtp_sender_name"] });
      try {
        const r = await node([AS, "apply", "staging", "--ref", COPY, "--origin", ORIGIN, "--rehearsal"], { MGMT_API: a2.url, SUPABASE_ACCESS_TOKEN: "standin", PINTAR_SMTP_PASSWORD: PW });
        c.expect(r.code !== 0 && /smtp_sender_name is undefined, declared "PINTAR Staging"/.test(r.text) && !/APPLIED AND READ BACK/.test(r.text), `a field that does not land: exit ${r.code}; ${r.text.trim().split("\n").slice(-1)}`);
      } finally { await a2.close(); }
      const a3 = await standInMgmt({ refuseHibp: true });
      try {
        const r = await node([AS, "apply", "staging", "--ref", COPY, "--origin", ORIGIN, "--rehearsal"], { MGMT_API: a3.url, SUPABASE_ACCESS_TOKEN: "standin", PINTAR_SMTP_PASSWORD: PW });
        c.expect(r.code === 0 && /::warning::the plan did not accept the leaked-password check/.test(r.text), `a plan without the leaked-password check: exit ${r.code}; ${r.text.trim().split("\n").slice(-1)}`);
      } finally { await a3.close(); }
      for (const [why, args, re] of [
        ["staging's project", ["apply", "staging", "--ref", rec.staging.ref, "--origin", ORIGIN, "--rehearsal"], /staging's project; a rehearsal writes only to its own copy/],
        ["production's project", ["apply", "production", "--ref", rec.production.ref, "--origin", ORIGIN, "--rehearsal"], /production's project; a rehearsal writes only to its own copy/],
        ["no --rehearsal", ["apply", "staging", "--ref", COPY, "--origin", ORIGIN], /writes to a rehearsal copy only/],
        ["no address", ["apply", "staging", "--ref", COPY, "--rehearsal"], /the rehearsal's own address/],
      ] as const) {
        const a = await standInMgmt();
        try {
          const r = await node([AS, ...args], { MGMT_API: a.url, SUPABASE_ACCESS_TOKEN: "standin", PINTAR_SMTP_PASSWORD: PW });
          c.expect(r.code !== 0 && re.test(r.text) && a.patches.length === 0, `apply to ${why}: exit ${r.code}, ${a.patches.length} write(s); ${r.text.trim().split("\n").slice(-1)}`);
        } finally { await a.close(); }
      }
      // verify production: Gate 3's settings left out until auth-identitas.json says production carries them
      const a4 = await standInMgmt();
      try {
        a4.config.set(rec.production.ref, { ...rec.production.auth, ...rec.production.email });
        const r = await node([AS, "verify", "production", "--ref", rec.production.ref], { MGMT_API: a4.url, SUPABASE_ACCESS_TOKEN: "standin" });
        const wantIdentity = ids.production_applied === true;
        c.expect(wantIdentity ? r.code !== 0 : r.code === 0 && /^READ BACK: /m.test(r.text) && !/mailer_otp_length/.test(r.text),
          `verify production (Gate 3 applied: ${wantIdentity}): exit ${r.code}; ${r.text.trim().split("\n").slice(-1)}`);
      } finally { await a4.close(); }
      return c.verdict("the workflows equal docs/recovery/projects.json and a planted drift is named; repoint.mjs moves production to a new project " +
        "in one rewrite (every occurrence, nothing else, clean) and refuses staging's, a malformed, the current or a retired reference, a move " +
        "without its decision and a missing or foreign public key; verify refuses another name, region or health and an unreadable project; " +
        "auth-state.mjs writes only a rehearsal copy, reads every declared field back, never prints the sender password, names a field that did " +
        "not land, warns when the plan lacks the leaked-password check, and leaves production's Gate 3 settings out until they apply");
    },
  },
  {
    id: "DR-S13",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const RB = join(repoRoot, "docs/recovery/RUNBOOK-NATIVE-RESTORE.md");
      if (!c.expect(existsSync(RB), "docs/recovery/RUNBOOK-NATIVE-RESTORE.md is missing: there is no reconstruction runbook")) return c.verdict("");
      const text = readFileSync(RB, "utf8");
      const manifest = readFileSync(join(repoRoot, "selftest/manifest.json"), "utf8");
      const rows = text.split("\n").filter((l) => /^\| \d \| /.test(l)).map((l) => l.slice(1, -1).split(" | ").map((x) => x.trim()));
      c.expect(rows.length === 9 && rows.every((r, i) => r[0] === String(i + 1) && r.length === 6 && r.every((x) => x.length > 0)),
        `the runbook does not have nine complete steps in order: ${rows.map((r) => `${r[0]}(${r.length})`).join(" ")}`);
      const wfDir = join(repoRoot, ".github/workflows");
      const named = new Set<string>();
      let pending = 0;
      for (const [n, , who, how, check, stop] of rows) {
        const tools = [...`${how} ${check}`.matchAll(/`([^`]+)`/g)].map((m) => m[1].split(/\s+/)[0]).filter((t) => /\.(ya?ml|mjs|sql|json|md)$/.test(t));
        const missing: string[] = [];
        let exist = 0;
        for (const t of tools) {
          const path = t.includes("/") ? join(repoRoot, t) : /\.ya?ml$/.test(t) ? join(wfDir, t) : join(repoRoot, "docs/recovery", t);
          if (existsSync(path)) { exist++; if (/\.ya?ml$/.test(t) && !t.includes("/")) named.add(t); } else missing.push(t);
        }
        c.expect(missing.length === 0, `step ${n} names what does not exist: ${missing.join(", ")}`);
        c.expect(exist > 0 || /owner/.test(who), `step ${n} names no existing workflow or script and no owner action`);
        const ids = [...check.matchAll(/\b(DR-[SD]\d{2}|F\d{2}-[A-Z]\d{2})\b/g)].map((m) => m[1]);
        const unknown = ids.filter((id) => !manifest.includes(`"id": "${id}"`));
        c.expect(unknown.length === 0, `step ${n}'s check names tests that do not exist: ${unknown.join(", ")}`);
        c.expect(ids.length > 0 || /`[^`]+`/.test(check), `step ${n}'s check names no test and no command`);
        c.expect(stop.length > 3, `step ${n} has no stop condition`);
        pending += (`${how} ${check}`.match(/PENDING WP-C\.2/g) ?? []).length;
      }
      // a production credential is used from main only
      for (const f of named) {
        const wf = readFileSync(join(wfDir, f), "utf8");
        const jobs = wf.slice(wf.indexOf("\njobs:")).split(/\n(?= {2}[a-z][a-z0-9_-]*:\n)/).slice(1);
        for (const j of jobs) {
          if (/secrets\.(PRODUCTION_|VERCEL_TOKEN|RECOVERY_)/.test(j)) c.expect(/^ {4}if: github\.ref == 'refs\/heads\/main'/m.test(j), `${f}: a job holding a production credential does not run from main only`);
        }
      }
      // each clause of B8's sentence maps to steps
      for (const clause of ["reconstructed PINTAR in a new environment", "verified its data and security", "restored its files and configuration", "connected the application", "proved that it worked"]) {
        c.expect(new RegExp(`^\\| ${clause} \\| [\\d, ]+ \\| .+ \\|$`, "m").test(text), `B8's clause "${clause}" maps to no step`);
      }
      // and the rehearsal's own pending pieces (its section, after the steps)
      const reh = text.slice(text.indexOf("## The rehearsal"));
      pending += (reh.match(/PENDING WP-C\.2/g) ?? []).length;
      const stray = (text.match(/PENDING(?! WP-C\.2)/g) ?? []).length;
      c.expect(stray === 0, "a PENDING item names no work package");
      // WP-C.2: the rehearsal's preview and the functional checks are built, so nothing may still be waiting on it
      c.expect(pending === 0, `${pending} item(s) still marked PENDING WP-C.2: the rehearsal's preview or the functional checks are not built`);
      c.expect(named.has("recovery-rehearsal.yml"), "the runbook does not tie the rehearsal's workflow (recovery-rehearsal.yml) to a step");
      return c.verdict(`the runbook's nine steps each name an owner action or existing workflows and scripts, a check naming existing tests and a stop ` +
        `condition; the ${named.size} workflows it names use production credentials from main only; each clause of B8's sentence maps to steps; ` +
        `nothing is left PENDING, and the rehearsal's workflow is tied to its steps`);
    },
  },
  {
    id: "DR-S17",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const RH = join(repoRoot, "scripts/recovery/rehearsal.mjs");
      const WF = join(repoRoot, ".github/workflows/recovery-rehearsal.yml");
      if (!c.expect(existsSync(RH) && existsSync(WF), "the rehearsal's guard (scripts/recovery/rehearsal.mjs) or its workflow (recovery-rehearsal.yml) is missing")) return c.verdict("");
      const rec = JSON.parse(readFileSync(join(repoRoot, "docs/recovery/projects.json"), "utf8")) as Record_;
      const COPY = "copyrefcopyrefcopyre";
      const tmp = mkdtempSync(join(tmpdir(), "dr-s17-"));
      const proj = (o: object = {}) => ({ name: "pintar-g8-rehearsal-DELETE-ME", region: rec.staging.region, status: "ACTIVE_HEALTHY", ...o });
      const dbUrl = (ref: string) => `postgresql://postgres.${ref}:pw@aws-0-stand-in.pooler.supabase.com:5432/postgres`;
      const P = (ref: string) => `/v1/projects/${ref}`;
      const run = async (routes: Record<string, [number, unknown]>, args: string[], env: Record<string, string> = {}) => {
        const sv = await standInJson(routes);
        try { return { ...(await node([RH, ...args], { MGMT_API: sv.url, VERCEL_API: sv.url, SUPABASE_ACCESS_TOKEN: "c10-stand-in", ...env })), seen: sv.seen }; }
        finally { await sv.close(); }
      };
      const guard = (routes: Record<string, [number, unknown]>, ref = COPY, url = dbUrl(COPY), env: Record<string, string> = {}) =>
        run(routes, ["guard", ref], { REHEARSAL_DB_URL: url, ...env });

      // guard: the copy, and nothing else
      const ok = await guard({ [P(COPY)]: [200, proj()] });
      c.expect(ok.code === 0 && /THE COPY IS THE REHEARSAL'S OWN/.test(ok.text) && ok.seen.every((x) => x.startsWith("GET ")),
        `a proper copy was not admitted, or was asked with more than GET: ${ok.text.slice(-300)}`);
      const retired = join(tmp, "projects.json");
      writeFileSync(retired, JSON.stringify({ ...rec, history: [{ from: "retiredretiredretire", to: rec.production.ref }] }));
      const refusals: [string, () => ReturnType<typeof guard>, RegExp][] = [
        ["staging's reference", () => guard({ [P(rec.staging.ref)]: [200, proj()] }, rec.staging.ref, dbUrl(rec.staging.ref)), /staging's project/],
        ["production's reference", () => guard({ [P(rec.production.ref)]: [200, proj()] }, rec.production.ref, dbUrl(rec.production.ref)), /production's project/],
        ["a retired reference", () => guard({ [P("retiredretiredretire")]: [200, proj()] }, "retiredretiredretire", dbUrl("retiredretiredretire"), { PROJECTS_RECORD: retired }), /a retired project/],
        ["a malformed reference", () => guard({}, "Not-A-Ref"), /not a Supabase project reference/],
        ["a project not named …-DELETE-ME", () => guard({ [P(COPY)]: [200, proj({ name: "pintar-staging-2" })] }), /not …-DELETE-ME/],
        ["another region", () => guard({ [P(COPY)]: [200, proj({ region: "us-east-1" })] }), /is in us-east-1/],
        ["a copy not yet healthy", () => guard({ [P(COPY)]: [200, proj({ status: "COMING_UP" })] }), /not ACTIVE_HEALTHY/],
        ["a token that reads staging", () => guard({ [P(COPY)]: [200, proj()], [P(rec.staging.ref)]: [200, {}] }), /reads staging's project: TOO BROAD/],
        ["a token that reads production", () => guard({ [P(COPY)]: [200, proj()], [P(rec.production.ref)]: [200, {}] }), /reads production's project: TOO BROAD/],
        ["a database address that names staging", () => guard({ [P(COPY)]: [200, proj()] }, COPY, `postgresql://postgres.${rec.staging.ref}:pw@h.example:5432/${COPY}`), /names a recorded project/],
        ["a database address for another project", () => guard({ [P(COPY)]: [200, proj()] }, COPY, dbUrl("otherotherotherother")), /does not name the copy/],
        ["a copy C10 cannot read", () => guard({}), /could not be read with C10/],
      ];
      const missed: string[] = [];
      for (const [what, f, why] of refusals) { const r = await f(); if (r.code !== 1 || !why.test(r.text)) missed.push(`${what} (${r.code}: ${r.text.trim().split("\n").pop()?.slice(0, 120)})`); }
      c.expect(missed.length === 0, `guard admitted or misnamed: ${missed.join("; ")}`);

      // keys: only keys issued for the copy, into the job's environment, masked
      const anon = fakeKey(COPY, "anon"), service = fakeKey(COPY, "service_role");
      const ge = join(tmp, "github_env");
      writeFileSync(ge, "");
      const k = await run({ [`${P(COPY)}/api-keys`]: [200, [{ name: "anon", api_key: anon }, { name: "service_role", api_key: service }]] }, ["keys", COPY], { GITHUB_ENV: ge });
      const env = readFileSync(ge, "utf8");
      const shown = k.text.split("\n").filter((l) => !l.startsWith("::add-mask::"));
      c.expect(k.code === 0 && env.includes(`REHEARSAL_ANON_KEY=${anon}\n`) && env.includes(`REHEARSAL_SERVICE_KEY=${service}\n`)
        && k.text.includes(`::add-mask::${service}`) && !shown.some((l) => l.includes(service) || l.includes(anon)),
        `keys did not put the copy's keys into the job's environment masked and unprinted (${k.code})`);
      const foreign = await run({ [`${P(COPY)}/api-keys`]: [200, [{ name: "anon", api_key: fakeKey(rec.staging.ref, "anon") }, { name: "service_role", api_key: fakeKey(rec.staging.ref, "service_role") }]] },
        ["keys", COPY], { GITHUB_ENV: ge });
      c.expect(foreign.code === 1 && /no anon \(JWT\) key issued for it/.test(foreign.text) && !foreign.text.includes(rec.staging.ref),
        `keys issued for staging's project were taken for the copy (${foreign.code})`);

      // vercel: what a preview carries, and whether it can be reached
      const need = ["CARD_PEPPER", "CERT_SECRET_KEY_V1", "CARD_EMAIL_DOMAIN"];
      const V = (project: object, envs: object[]) => ({ "/v9/projects/pintar40-staging": [200, { name: "pintar40-staging", ssoProtection: null, passwordProtection: null, ...project }] as [number, unknown],
        "/v9/projects/pintar40-staging/env": [200, { envs }] as [number, unknown] });
      const all = need.map((key) => ({ key, target: ["production", "preview"], type: "encrypted" }));
      const venv = { VERCEL_TOKEN: "vercel-stand-in", STAGING_VERCEL_PROJECT_NAME: "pintar40-staging" };
      const open_ = await run(V({}, all), ["vercel"], venv);
      const sso = { ssoProtection: { deploymentType: "all_except_custom_domains" } };
      const gated = await run(V(sso, all), ["vercel"], venv);
      const bypass = await run(V(sso, all), ["vercel", "--bypass-present"], venv);
      const prodOnly = await run(V({}, all.map((e) => (e.key === "CARD_PEPPER" ? { ...e, target: ["production"] } : e))), ["vercel"], venv);
      c.expect(open_.code === 0 && /not behind Vercel's protection/.test(open_.text) && gated.code === 1 && /REHEARSAL_VERCEL_BYPASS/.test(gated.text)
        && bypass.code === 0 && prodOnly.code === 1 && /CARD_PEPPER does not reach a preview deployment/.test(prodOnly.text) && /the owner decides/.test(prodOnly.text)
        && [open_, gated, bypass, prodOnly].every((r) => r.seen.every((x) => x.startsWith("GET "))),
        `vercel: open ${open_.code}, protected ${gated.code}, with the bypass ${bypass.code}, the pepper in production only ${prodOnly.code} (expected 0, 1, 0, 1, GET only)`);

      // facts: line for line
      const a = "T|public.a|3|aa\nT|public.b|1|bb\nF|auth.users triggers|g1,g2\n";
      const fa = join(tmp, "a.txt"), fb = join(tmp, "b.txt"), fc = join(tmp, "c.txt");
      writeFileSync(fa, a); writeFileSync(fb, a.replace("public.b|1|bb", "public.b|2|bc")); writeFileSync(fc, a.replace("g1,g2", "g1"));
      const same = await node([RH, "facts", fa, fa], {});
      const table = await node([RH, "facts", fa, fb], {});
      const fact = await node([RH, "facts", fa, fc], {});
      c.expect(same.code === 0 && /2 tables and 1 facts/.test(same.text) && table.code === 1 && /table public\.b: rows or content differ/.test(table.text)
        && fact.code === 1 && /fact auth\.users triggers: differs/.test(fact.text), `facts: equal ${same.code}, a table ${table.code}, a fact ${fact.code}`);

      // the workflow: dispatch only, main only, staging's drill environment; nothing of production; the guard first; no Vercel setting
      const wf = readFileSync(WF, "utf8").split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");
      const steps = wf.split(/\n(?= {6}- (?:name|uses):)/).slice(1);
      const at = (re: RegExp) => steps.findIndex((x) => re.test(x));
      const reconstructOnly = (re: RegExp) => steps.filter((x) => re.test(x)).every((x) => /\n {8}if: inputs\.stage == 'reconstruct'\n/.test(x));
      const iGuard = at(/rehearsal\.mjs guard/), writes = [/auth-state\.mjs apply/, /restore-bundle\.mjs/, /vercel deploy/, /functional\.mjs check/].map(at);
      const held = [...new Set([...wf.matchAll(/secrets\.([A-Z0-9_]+)/g)].map((m) => m[1]))].sort();
      const allowed = ["AWS_BACKUP_READER_KEY_ID", "AWS_BACKUP_READER_SECRET", "GS_MAILBOX_PASSWORD", "PINTAR_SMTP_PASSWORD", "REHEARSAL_STORAGE_S3_KEY_ID",
        "REHEARSAL_STORAGE_S3_SECRET", "REHEARSAL_SUPABASE_ACCESS_TOKEN", "REHEARSAL_SUPABASE_DB_URL", "REHEARSAL_VERCEL_BYPASS", "STAGING_DRILL_PRIVATE_KEY",
        "STAGING_SUPABASE_DB_URL", "VERCEL_TOKEN"];
      const problems = [
        !/^on:\n {2}workflow_dispatch:/m.test(wf) || /^ {2}(push|schedule|pull_request|workflow_run):/m.test(wf) ? "it does not run by hand only" : "",
        !/^ {4}if: github\.ref == 'refs\/heads\/main'$/m.test(wf) ? "it does not run from main only" : "",
        !/^ {4}environment: staging-recovery-drill$/m.test(wf) ? "it does not run in staging-recovery-drill, where R3 and the reader key live" : "",
        wf.includes(rec.production.ref) || /PRODUCTION_|RECOVERY_PRIVATE_KEY|RECOVERY_KEY_PASSPHRASE/.test(wf) ? "it names production's project or a production credential" : "",
        held.some((x) => !allowed.includes(x)) ? `it holds ${held.filter((x) => !allowed.includes(x)).join(", ")}` : "",
        iGuard < 0 || !/\n {8}if: inputs\.stage != 'teardown'\n/.test(steps[iGuard]) || writes.some((i) => i < 0 || i < iGuard) ? "a write comes before the guard, or a stage writes without it" : "",
        ![/auth-state\.mjs apply/, /restore-bundle\.mjs/, /vercel deploy/, /vercel alias set/, /functional\.mjs (check|pick)/].every(reconstructOnly) ? "a write runs outside the reconstruct stage" : "",
        !/auth-state\.mjs apply staging --ref "\$COPY_REF" --origin "https:\/\/pintar-rehearsal-\$\{COPY_REF\}\.vercel\.app" --rehearsal/.test(wf) ? "Auth is not applied to the copy alone (--rehearsal) with the preview's address" : "",
        !/functional\.mjs check --rehearsal/.test(wf) ? "the checks do not run with --rehearsal" : "",
        /--prod\b|vercel (env|domains?|project|dns|certs|git)\b|api\.vercel\.com|-X (POST|PUT|PATCH|DELETE)/.test(wf) ? "it could change a Vercel setting or deploy to production" : "",
        !/^ {2}STAGING_VERCEL_PROJECT_NAME: pintar40-staging$/m.test(wf) || (wf.match(/vercel link --yes --project "\$STAGING_VERCEL_PROJECT_NAME"/g) ?? []).length !== 2 ? "it may deploy to a project other than staging's" : "",
        !/vercel alias rm "\$ALIAS"/.test(wf) || !/vercel remove "\$u"/.test(wf) || !/\[ "\$left" = 0 \]/.test(wf) ? "teardown does not remove the address and the deployments and confirm it" : "",
      ].filter(Boolean);
      c.expect(problems.length === 0, `recovery-rehearsal.yml: ${problems.join("; ")}`);
      return c.verdict(`guard admits only a healthy …-DELETE-ME copy in staging's region and refuses ${refusals.length} others (staging's, production's, a retired ` +
        "and a malformed reference, a wrong name, region or health, a token reading staging or production, a database address for a recorded or another " +
        "project, an unreadable copy); keys takes only the copy's own, masked and unprinted; vercel needs the owner's bypass for a protected preview and the " +
        "owner for a preview without staging's values; facts names each differing table and fact; the workflow runs by hand from main in " +
        "staging-recovery-drill, names nothing of production, guards before every write, writes Auth and runs the checks only with --rehearsal, deploys a " +
        "preview of staging's project with no setting changed, and teardown removes and confirms");
    },
  },
];

/** #150 WP-C.2: the four functional checks against the running app (DR-D03). */
export const dr150cAppTests: SelfTest[] = [
  {
    id: "DR-D03",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const FN = join(ctx.repoRoot, "scripts/recovery/functional.mjs");
      if (!c.expect(existsSync(FN), "scripts/recovery/functional.mjs is missing: nothing proves the reconstructed application works")) return c.verdict("");
      const tag = randomBytes(4).toString("hex");
      const tmp = mkdtempSync(join(tmpdir(), "dr-d03-"));

      // the world. A school of its own (with a namespace, as a real one reserves), its admin registered by the platform
      // admin's «Orang baru», and a learner with a class card made as the intake does
      const sys = new Peramban(asal, ipUji());
      if (!c.expect((await sys.jsonDari("/masuk/password", { form: { identitas: "uji.sysadmin", password: "Sintetis-Sys-91!" } })).status === 200,
        "the platform admin could not sign in")) return c.verdict("");
      const adminEmail = `dr-d03-${tag}-admin@synthetic.pintar.test`;
      c.expect((await sys.jsonDari("/api/akun/aktivasi", { json: { mode: "NEW_PERSON", email: adminEmail, display_name: `Admin DR-D03 ${tag}` } })).status === 200,
        "«Orang baru» refused the school's admin");
      const [murid, tanpaKartu] = psql(`
        do $$ declare v_inst uuid; v_admin uuid; v_p uuid; begin
          perform set_config('app.seed_intent', 'synthetic', true);
          insert into public.institutions (name, slug, is_synthetic, is_active) values (${lit(`Sekolah DR-D03 ${tag}`)}, ${lit(`sekolah-dr-d03-${tag}`)}, true, true)
            returning id into v_inst;
          update public.institutions set namespace = (select x from generate_series(1, 500) g, lateral (select upper(substr(md5(${lit(tag)} || g), 1, 3)) x) q
                                                      where x ~ '^[A-Z]{3}$' and not exists (select 1 from public.institutions t where upper(t.namespace) = q.x) limit 1)
           where id = v_inst;
          select a.person_id into v_admin from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(adminEmail)};
          insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_from, valid_until)
          values (v_admin, 'INSTITUTION_ADMIN', v_inst, v_inst, now() - interval '1 day', now() + interval '365 days');
          foreach v_p in array array[gen_random_uuid(), gen_random_uuid()] loop
            insert into public.persons (id, display_name) values (v_p, 'Murid DR-D03 ' || ${lit(tag)} || ' ' || v_p);
            perform public.issue_institutional_id(v_p, v_inst);
          end loop;
        end $$;
        select string_agg(p.id::text, ',' order by p.created_at, p.id) from public.persons p where p.display_name like ${lit(`Murid DR-D03 ${tag} %`)};`)
        .split("\n").pop()!.split(",");
      const kartu1 = await sys.jsonDari("/api/akun/aktivasi", { json: { mode: "CLASSROOM_CARD", person_id: murid } });
      if (!c.expect(kartu1.status === 200 && !!tanpaKartu, `the learner's first card could not be made (${kartu1.status})`)) return c.verdict("");
      const nomor = () => psql(`select card_number from public.accounts where person_id = ${lit(murid)} and kind = 'CLASSROOM_CARD'`);

      // a certificate the app sealed with its own key: the bootstrap learner's finished post-test, issued through the route
      // the fixtures, as BOB50-A01 loads them (each in one transaction; already present is fine)
      for (const f of ["fable01", "fable02", "fable03", "fable04"]) {
        spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(ctx.repoRoot, "selftest", "db", `${f}.sql`), process.env.SUPABASE_DB_URL!], { encoding: "utf8" });
      }
      // a fresh sitting: the fixture's one attempt is freed first, as selftest.issue_material does, and the evidence is
      // removed again at the end, as the F04 tests leave it
      psql("select selftest.purge_certificates()");
      const sesi = psql("select selftest.boot_attempt(true)").split("\n").pop()!;
      const siswa = new Peramban(asal, ipUji());
      c.expect((await siswa.jsonDari("/masuk/password", { form: { identitas: "uji.boot.siswa", password: "Bootstrap-Siswa-3082!" } })).status === 200, "the learner could not sign in");
      const terbit = await siswa.jsonDari("/api/certificates/issue", { json: { session_id: sesi } });
      const token = psql(`select verification_token from public.certificates where session_id = ${lit(sesi)} and status = 'ISSUED' and signature is not null`);
      if (!c.expect(terbit.status === 200 && terbit.body?.status === "issued" && /^[A-Za-z0-9_-]{20,}$/.test(token),
        `the app did not issue a certificate for a finished post-test (${terbit.status} ${JSON.stringify(terbit.body)})`)) return c.verdict("");

      // a file in Storage, as the bundle records it: the learner's photo
      const bytes = randomBytes(4096);
      const path = `profile/${murid}/foto-${tag}.png`;
      const up = await fetch(`${ctx.supabaseUrl}/storage/v1/object/assets/${path}`, { method: "POST", body: bytes,
        headers: { authorization: `Bearer ${ctx.supabaseServiceRoleKey}`, "content-type": "image/png" } });
      if (!c.expect(up.status === 200, `the photo could not be stored (${up.status})`)) return c.verdict("");
      const rekam = (sha256: string) => { const f = join(tmp, `manifest-${randomBytes(3).toString("hex")}.jsonl`);
        writeFileSync(f, JSON.stringify({ bucket: "assets", name: path, size: bytes.length, sha256, file: "x", mimetype: "image/png" }) + "\n"); return f; };
      const benar = rekam(createHash("sha256").update(bytes).digest("hex"));

      try {
        return await dr150cD03Checks(c, { asal, FN, murid, tanpaKartu, token, adminEmail, tag, benar, rekam, bytes, nomor });
      } finally {
        try { psql("select selftest.purge_certificates()"); } catch { /* the F04 suite purges again */ }
        // and the photo: a later bundle of this database (DR-D02) counts every Storage file
        await fetch(`${ctx.supabaseUrl}/storage/v1/object/assets/${path}`, { method: "DELETE",
          headers: { authorization: `Bearer ${ctx.supabaseServiceRoleKey}` } }).catch(() => undefined);
      }
    },
  },
];

/** DR-D03's runs against the world it built. */
async function dr150cD03Checks(c: Checks, w: { asal: string; FN: string; murid: string; tanpaKartu: string; token: string; adminEmail: string; tag: string;
  benar: string; rekam: (sha256: string) => string; bytes: Buffer; nomor: () => string }) {
      const { asal, FN, murid, tanpaKartu, token, adminEmail, tag, benar, rekam, bytes, nomor } = w;
      const periksa = (o: Record<string, string> = {}, args = ["check", "--rehearsal"]) => node([FN, ...args], {
        APP_ORIGIN: asal, FC_STAFF: "uji.sysadmin", FC_STAFF_PASSWORD: "Sintetis-Sys-91!", FC_LEARNER: murid, FC_CERT_TOKEN: token, FC_OBJECTS: benar, ...o });
      const hasil = (t: string) => Object.fromEntries([...t.matchAll(/^(F\d) (PASS|FAIL) /gm)].map((m) => [m[1], m[2]]));
      const hanya = (t: string, gagal: string) => { const h = hasil(t); return ["F1", "F2", "F3", "F4"].every((f) => h[f] === (f === gagal ? "FAIL" : "PASS")); };

      // all four, healthy
      const sebelum = nomor();
      const hijau = await periksa();
      const sesudah = nomor();
      c.expect(hijau.code === 0 && hanya(hijau.text, "-") && /IT WORKS/.test(hijau.text), `the four checks on a healthy app: ${hijau.text.slice(-400)}`);
      c.expect(sesudah !== sebelum && /^\d{10}$/.test(sesudah) && !hijau.text.includes(sesudah) && !hijau.text.includes("Sintetis-Sys-91!"),
        "F2 did not re-issue the card, or a card number or password reached the output");
      // never outside a rehearsal
      const tolak = await periksa({}, ["check"]);
      c.expect(tolak.code === 1 && /rehearsal copy only/.test(tolak.text) && nomor() === sesudah, `without --rehearsal: ${tolak.code}, the card ${nomor() === sesudah ? "kept" : "RE-ISSUED"}`);
      // each fault fails its own check, and only that one
      const f1 = await periksa({ FC_STAFF_PASSWORD: `Salah-${tag}-91!` });
      const h1 = hasil(f1.text);
      c.expect(f1.code === 1 && h1.F1 === "FAIL" && h1.F3 === "PASS", `a wrong password: ${JSON.stringify(h1)}`);
      const f2 = await periksa({ FC_LEARNER: tanpaKartu });
      c.expect(f2.code === 1 && hanya(f2.text, "F2"), `a learner without a card: ${JSON.stringify(hasil(f2.text))}`);
      const segel = psql(`select signature from public.certificates where verification_token = ${lit(token)}`);
      const tulisSegel = (v: string) => psql(`begin; set local session_replication_role = replica;
        update public.certificates set signature = ${lit(v)} where verification_token = ${lit(token)}; commit;`);
      let f3: Awaited<ReturnType<typeof periksa>>;
      try { tulisSegel(`${segel.slice(0, -4)}AAAA`); f3 = await periksa(); } finally { tulisSegel(segel); }
      c.expect(f3.code === 1 && hanya(f3.text, "F3") && /TIDAK SAH/.test(f3.text), `an altered seal: ${JSON.stringify(hasil(f3.text))}`);
      // F3 alone, as production's step 8 runs it (D-113): no sign-in and no write
      const sertifikat = (t: string) => node([FN, "certificate"], { APP_ORIGIN: asal, FC_CERT_TOKEN: t });
      let palsu: Awaited<ReturnType<typeof sertifikat>>;
      const asli = await sertifikat(token);
      try { tulisSegel(`${segel.slice(0, -4)}AAAA`); palsu = await sertifikat(token); } finally { tulisSegel(segel); }
      c.expect(asli.code === 0 && /^F3 PASS/m.test(asli.text) && palsu.code === 1 && /TIDAK SAH/.test(palsu.text),
        `certificate alone: the sealed one ${asli.code}, the altered one ${palsu.code}`);
      const f4 = await periksa({ FC_OBJECTS: rekam(createHash("sha256").update(Buffer.concat([bytes, Buffer.from("x")])).digest("hex")) });
      c.expect(f4.code === 1 && hanya(f4.text, "F4") && /does not hash to the bundle's SHA-256/.test(f4.text), `a file that differs from its record: ${JSON.stringify(hasil(f4.text))}`);
      const pulih = await periksa();
      c.expect(pulih.code === 0 && hanya(pulih.text, "-"), "after the seal was restored the four checks do not pass again");

      // pick: the school's admin, its card learner, an issued certificate (read only)
      const pilih = await node([FN, "pick", process.env.SUPABASE_DB_URL!, "--staff-like", `dr-d03-${tag}-admin@synthetic.pintar.test`], {});
      let p: { staff?: string; learner?: string; token?: string } = {};
      try { p = JSON.parse(pilih.text.trim().split("\n").pop() ?? "{}"); } catch { /* below */ }
      const terbitkah = p.token ? psql(`select status from public.certificates where verification_token = ${lit(p.token)}`) : "";
      c.expect(pilih.code === 0 && p.staff === adminEmail && p.learner === murid && terbitkah === "ISSUED", `pick read ${JSON.stringify({ ...p, token: p.token ? "<token>" : null })}`);
      const tiada = await node([FN, "pick", process.env.SUPABASE_DB_URL!, "--staff-like", `tiada-${tag}@synthetic.pintar.test`], {});
      c.expect(tiada.code === 1 && /holds no staff/.test(tiada.text), "pick did not refuse when no school admin matches");

      return c.verdict("all four checks passed through the running app (a staff sign-in; a card re-issued and signed in, its number and PIN unprinted; a " +
        "certificate the app sealed, BERLAKU by its token; a photo signed and served with the recorded SHA-256); without --rehearsal it refused and " +
        "re-issued nothing; F3 alone (production's form) passed and failed with the seal; a wrong password, a learner without a card, an altered seal (restored) and a file that differs from its record each failed " +
        "its own check only; pick read the school's admin, its card learner and an issued certificate, and refused when no admin matched");
}
