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
 *          sentence maps to steps; what is not built yet is marked PENDING WP-C.2 and counted
 */
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
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
      return c.verdict(`the runbook's nine steps each name an owner action or existing workflows and scripts, a check naming existing tests and a stop ` +
        `condition; the ${named.size} workflows it names use production credentials from main only; each clause of B8's sentence maps to steps; ` +
        `${pending} item(s) PENDING WP-C.2 (WP-C is not done while any remain)`);
    },
  },
];
