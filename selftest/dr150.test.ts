/**
 * #150 G5 (owner, 6 Oct): THE DURABLE SECRETS ARE NEVER REPLACED SILENTLY.
 *
 * CARD_PEPPER derives every classroom card's sign-in secret and CERT_SECRET_KEY_V1 seals every certificate; both live
 * only in Vercel. The production deploy used to mint either one whenever Vercel did not list it, so an emptied or
 * rebuilt Vercel project would have broken every card and every certificate without a word (#150 hazard H1).
 *
 *  DR-S01  the decision (scripts/release/durable-secrets.mjs): KEEP only a readable value of at least 32 characters
 *          that matches its recorded fingerprint and, for the certificate key, opens an issued certificate's seal;
 *          MINT only an absent, never-recorded secret into a production holding no card, no sealed certificate, no
 *          school and nobody beyond the first administrator; REFUSE everything else, an unknown count included; the
 *          seal is made byte for byte as src/lib/certificates/sign.ts makes it; a fingerprint says nothing of the value
 *  DR-S02  the deploy (.github/workflows/deploy-vercel-production.yml): the guard runs, from the workflow's own commit,
 *          after the service-role key is proven and before any variable is written; a durable secret is minted only on
 *          the guard's MINT, a missing verdict stops the deploy, and nothing mints unconditionally any more; the record
 *          (docs/recovery/durable-secrets.json) names both secrets and holds only well-formed fingerprints
 *  DR-S03  the guard end to end, against a local stand-in for Vercel and PostgREST: an empty production is minted
 *          into; a production holding classroom cards, or a count it cannot read, is refused with no verdict written;
 *          held secrets that match are kept; a certificate key that does not open the issued seal is refused; no value
 *          ever appears in what it prints
 *
 * #150 G6 (owner, 6 Oct): NO PRODUCTION MIGRATION WITHOUT A RECORDED RESTORE POINT.
 *
 *  DR-S04  the check (scripts/release/restore-point.mjs): OK only when Supabase lists a COMPLETED backup no older than
 *          26 hours, and it names that backup and its age; REFUSE when the backups cannot be read (a 403 says the token
 *          needs permission to read them), when none is completed, when the latest completed one is older, or dated in
 *          the future; end to end against a stand-in for the Management API it writes the record, asks with GET only and
 *          never prints the token
 *  DR-S05  the wiring: the production apply runs the check, from the workflow's own commit, after the state before and
 *          before any migration, records the WAL archiver and the facts before the apply, and keeps the record 90 days;
 *          the restore rehearsal counts readiness FAIL rows by the verdict a line begins with (it counted '| FAIL',
 *          which no line contains, and so read 0 whatever happened)
 *
 * #150 G10 (owner, 6 Oct): A FAILURE OF PRODUCTION IS NOTICED WITHOUT A NEW SERVICE OR A NEW PERSON.
 *
 *  DR-S06  .github/workflows/production-watch.yml: runs only from main, and on its schedule only when the owner turns it
 *          on (PINTAR_PRODUCTION_WATCH = on; skipped, at no cost, until then); looks at production from outside with GET
 *          only (the sign-in page, strictly, without following a redirect; Supabase Auth's health; the TLS certificate's
 *          remaining days; the restore point through restore-point.mjs, where an unreadable backup list is reported and
 *          not failed); opens one issue on a failure, comments on it while it lasts, and closes it when green again
 *
 * #150 G7 (owner, 6 Oct): THE READINESS CHECK SEES WHAT A RESTORE BREAKS.
 *
 *  DR-D01  docs/audit/launch-readiness.sql against CI's database: every row PASS (the five rows about live content are
 *          reported, not required, because other suites write content), the two rows restated for G7 among them; then,
 *          in one transaction rolled back, what the 5 Oct rehearsal's restore did (every right granted to anon and
 *          authenticated through default privileges, the password-write guard gone from auth.users, the pre-request
 *          lost) and two more drifts (the assets bucket made public, a function given to another owner): each G7 row
 *          FAILs and names what differs, and the untouched rows stay PASS
 */
import { spawn, spawnSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { Checks, type SelfTest } from "./lib";
import { canonicalBytes, signWithKey } from "../src/lib/certificates/sign";

const GUARD = "scripts/release/durable-secrets.mjs";
const RECORD = "docs/recovery/durable-secrets.json";
const DEPLOY = ".github/workflows/deploy-vercel-production.yml";
const READINESS = "docs/audit/launch-readiness.sql";
const TITIK = "scripts/release/restore-point.mjs";
const APPLY = ".github/workflows/deploy-supabase-production.yml";
const REHEARSAL = ".github/workflows/restore-rehearsal.yml";
const WATCH = ".github/workflows/production-watch.yml";
type Titik = { verdict: "OK" | "REFUSE"; reasons: string[]; backup?: { inserted_at: string }; ageHours?: number };
type TitikModul = { MAX_AGE_HOURS: number; decide: (status: number, body: unknown, now: number) => Titik };

// the readiness rows about live content: other suites write content into CI's database, so these are reported, not required
const ISI = ["every option carries a rationale (live data)", "scoring reproducibility versions recorded on every result",
  "certificate keys are versioned", "empirical psychometric fields are honestly NULL", "audit trail is append-only AND populated"];
const G7 = {
  anon: "G7 anon holds no right on any public table, view or sequence",
  tabel: "G7 authenticated holds exactly the release's table rights",
  fungsi: "G7 authenticated executes exactly the registered functions",
  pemilik: "G7 every public table, view, sequence and function is owned by postgres",
  pemicu: "G7 PINTAR's three auth.users triggers present and enabled",
  praminta: "G7 PostgREST pre-request set on authenticator",
  wadah: "G7 the assets bucket exists and is private",
};
// what the restore of 5 Oct did (H4, H5, the role setting), and two drifts it could have done
const TANAM = `
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;
do $t$ begin
  begin
    drop trigger pintar_password_write_guard on auth.users;
  exception when insufficient_privilege then
    execute 'set local role supabase_auth_admin';
    drop trigger pintar_password_write_guard on auth.users;
    execute 'reset role';
  end;
end $t$;
alter role authenticator reset pgrst.db_pre_request;
update storage.buckets set public = true where id = 'assets';
create role dr150_pemilik_lain nologin;
grant dr150_pemilik_lain to current_user;
grant create on schema public to dr150_pemilik_lain;
alter function public.engine_version() owner to dr150_pemilik_lain;
`;

function kesiapan(repoRoot: string, tanam: string): { ok: boolean; rows: Map<string, { v: string; m: string }>; n: number; err: string } {
  const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-At", "-F", " | ", "-f", "-", process.env.SUPABASE_DB_URL!], {
    cwd: repoRoot, encoding: "utf8", maxBuffer: 1 << 24,
    input: `begin;\n${tanam}\n\\i ${READINESS}\nrollback;\n`,
  });
  const rows = new Map<string, { v: string; m: string }>();
  let n = 0;
  for (const l of (r.stdout || "").split("\n")) {
    const m = /^(PASS|FAIL) \| (.*?) \| (.*)$/.exec(l);
    if (m) { n++; rows.set(m[2], { v: m[1], m: m[3] }); }
  }
  return { ok: r.status === 0, rows, n, err: (r.stderr || "").trim().split("\n").slice(-3).join(" | ") };
}

type Facts = { cards: number | null; sealed: number | null; schools: number | null; persons: number | null };
type State = { present: boolean; value: string | null; recorded: string | null; sealCheck?: string };
type Decision = { verdict: "KEEP" | "MINT" | "REFUSE"; reasons: string[]; fingerprint?: string; record?: string | null };
type Guard = {
  DURABLE: string[];
  fingerprint: (name: string, value: string) => string;
  canonicalBytes: (p: unknown) => string;
  seal: (p: unknown, key: string) => string;
  decide: (name: string, s: State, facts: Facts) => Decision;
};

async function laden(repoRoot: string): Promise<Guard | null> {
  try { return (await import(pathToFileURL(join(repoRoot, GUARD)).href)) as Guard; } catch { return null; }
}

const KOSONG: Facts = { cards: 0, sealed: 0, schools: 0, persons: 1 };
const LADA = "a".repeat(64);
const KUNCI = "b".repeat(64);

// ═══════════════════════════════════════════════ a local stand-in for Vercel's env API and PostgREST
type Dunia = {
  vercel: Record<string, string>;             // name -> value held in Vercel production
  counts: Record<string, number | "404">;    // table -> count
  cert?: { canonical_payload: unknown; signature: string };
};

function berdiri(d: Dunia): Promise<{ url: string; tutup: () => void }> {
  const srv = createServer((req: IncomingMessage, res: ServerResponse) => {
    const u = new URL(req.url ?? "/", "http://x");
    const json = (code: number, body: unknown, h: Record<string, string> = {}) => {
      res.writeHead(code, { "content-type": "application/json", ...h }); res.end(JSON.stringify(body));
    };
    if (u.pathname === "/v9/projects/pintar40/env") {
      return json(200, { envs: Object.keys(d.vercel).map((k, i) => ({ id: `e${i}`, key: k, type: "encrypted", target: ["production"] })) });
    }
    const one = /^\/v1\/projects\/pintar40\/env\/e(\d+)$/.exec(u.pathname);
    if (one) { const k = Object.keys(d.vercel)[Number(one[1])]; return json(200, { key: k, value: d.vercel[k] }); }
    const rest = /^\/rest\/v1\/([a-z_]+)$/.exec(u.pathname);
    if (rest) {
      const t = rest[1];
      if (t === "certificates" && (u.searchParams.get("select") ?? "").includes("canonical_payload")) return json(200, d.cert ? [d.cert] : []);
      const n = d.counts[t];
      if (n === undefined || n === "404") return json(404, { code: "PGRST205" });
      return json(n === 0 ? 200 : 206, [], { "content-range": n === 0 ? "*/0" : `0-0/${n}` });
    }
    json(404, {});
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => {
    ok({ url: `http://127.0.0.1:${(srv.address() as AddressInfo).port}`, tutup: () => srv.close() });
  }));
}

async function jalankan(repoRoot: string, d: Dunia, recorded: Record<string, string | null>) {
  const dir = mkdtempSync(join(tmpdir(), "dr150-"));
  const reg = join(dir, "record.json"); const key = join(dir, "srk"); const verdict = join(dir, "verdict");
  writeFileSync(reg, JSON.stringify({ production: Object.fromEntries(Object.entries(recorded).map(([k, v]) => [k, { fingerprint: v }])) }));
  writeFileSync(key, "service-role-stand-in");
  const s = await berdiri(d);
  try {
    const out = await new Promise<{ code: number; text: string }>((ok) => {
      const p = spawn(process.execPath, [join(repoRoot, GUARD), "guard", reg, verdict], {
        env: { PATH: process.env.PATH ?? "", VERCEL_TOKEN: "t", PRODUCTION_VERCEL_PROJECT_NAME: "pintar40", VERCEL_API: s.url,
               SUPABASE_URL: s.url, SERVICE_ROLE_KEY_FILE: key, NODE_ENV: "production" },
      });
      let text = "";
      p.stdout.on("data", (b) => (text += b)); p.stderr.on("data", (b) => (text += b));
      p.on("close", (code) => ok({ code: code ?? -1, text }));
    });
    return { ...out, verdict: existsSync(verdict) ? readFileSync(verdict, "utf8") : null };
  } finally { s.tutup(); }
}

export const dr150Tests: SelfTest[] = [
  {
    id: "DR-S01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const g = await laden(repoRoot);
      if (!c.expect(g, `${GUARD} is missing or does not load: nothing decides whether a durable secret may be minted`)) return c.verdict("");
      const ds = g!;
      c.expect(JSON.stringify(ds.DURABLE) === JSON.stringify(["CARD_PEPPER", "CERT_SECRET_KEY_V1"]), `the guard covers ${JSON.stringify(ds.DURABLE)}`);
      // the seal, byte for byte as the application makes it
      const muatan = [{ b: 2, a: [3, { z: "Ä€", y: null }], c: true }, { key_version: 1, nama: "Ayu Lestari", skor: 87.5, n: 0 }, { "10": 1, "9": 2, b: { d: [] } }];
      for (const p of muatan) {
        c.expect(ds.canonicalBytes(p) === canonicalBytes(p) && ds.seal(p, KUNCI) === signWithKey(p, KUNCI),
          `the guard's seal differs from src/lib/certificates/sign.ts on ${JSON.stringify(p)}`);
      }
      // the fingerprint: short, per name, per value, and not the value
      const fp = ds.fingerprint("CARD_PEPPER", LADA);
      c.expect(/^[0-9a-f]{16}$/.test(fp) && fp !== ds.fingerprint("CERT_SECRET_KEY_V1", LADA) && fp !== ds.fingerprint("CARD_PEPPER", LADA + "x")
        && fp === createHmac("sha256", LADA).update("pintar durable secret fingerprint|CARD_PEPPER").digest("hex").slice(0, 16)
        && !LADA.includes(fp), `the fingerprint is not the documented one (${fp})`);
      const d = (n: string, s: Partial<State>, f: Partial<Facts> = {}) => ds.decide(n, { present: false, value: null, recorded: null, ...s }, { ...KOSONG, ...f });
      const tolak = (x: Decision, kata: RegExp) => x.verdict === "REFUSE" && kata.test(x.reasons.join(" "));
      // MINT, and only there
      c.expect(d("CARD_PEPPER", {}).verdict === "MINT" && d("CERT_SECRET_KEY_V1", {}).verdict === "MINT"
        && d("CARD_PEPPER", {}, { persons: 0 }).verdict === "MINT", "an absent secret is not minted into an empty production");
      c.expect(tolak(d("CARD_PEPPER", {}, { cards: 1 }), /1 classroom cards/), "an absent pepper is minted although classroom cards exist");
      c.expect(tolak(d("CERT_SECRET_KEY_V1", {}, { sealed: 2 }), /2 sealed certificates/), "an absent certificate key is minted although certificates are sealed");
      c.expect(tolak(d("CARD_PEPPER", {}, { schools: 1 }), /1 schools/) && tolak(d("CERT_SECRET_KEY_V1", {}, { schools: 1 }), /1 schools/),
        "an absent secret is minted although a school exists");
      c.expect(tolak(d("CARD_PEPPER", {}, { persons: 2 }), /1 people beyond the first administrator/), "an absent secret is minted although people beyond the first administrator exist");
      for (const k of ["cards", "sealed", "schools", "persons"] as const) {
        const n = k === "cards" ? "CARD_PEPPER" : "CERT_SECRET_KEY_V1";
        c.expect(tolak(d(n, {}, { [k]: null }), /could not be established/), `an unknown count of ${k} is taken as zero and ${n} is minted`);
      }
      c.expect(tolak(d("CARD_PEPPER", { recorded: fp }), /must be recovered, never replaced/), "an absent secret that was recorded is minted again");
      c.expect(tolak(d("CARD_PEPPER", { recorded: "not-a-fingerprint" }), /malformed/), "a malformed record is ignored");
      // KEEP, and only there
      const k1 = d("CARD_PEPPER", { present: true, value: LADA });
      c.expect(k1.verdict === "KEEP" && k1.record === fp, `a held, unrecorded pepper is not kept with its fingerprint to record: ${JSON.stringify(k1)}`);
      const k2 = d("CARD_PEPPER", { present: true, value: LADA, recorded: fp }, { cards: 5 });
      c.expect(k2.verdict === "KEEP" && !k2.record, "a held pepper matching its record is not kept");
      c.expect(tolak(d("CARD_PEPPER", { present: true, value: LADA + "x", recorded: fp }), /is not the recorded one/), "a held pepper that differs from its record is kept");
      c.expect(tolak(d("CARD_PEPPER", { present: true, value: null }), /cannot be verified/), "a held value Vercel did not return is kept unverified");
      c.expect(tolak(d("CARD_PEPPER", { present: true, value: "short" }), /shorter than 32/), "a short pepper is kept");
      c.expect(d("CERT_SECRET_KEY_V1", { present: true, value: KUNCI, sealCheck: "opens" }).verdict === "KEEP"
        && d("CERT_SECRET_KEY_V1", { present: true, value: KUNCI, sealCheck: "none" }).verdict === "KEEP", "a certificate key that opens the seal (or with no seal yet) is not kept");
      c.expect(tolak(d("CERT_SECRET_KEY_V1", { present: true, value: KUNCI, sealCheck: "does-not-open" }), /does not open/), "a certificate key that does not open the issued seal is kept");
      c.expect(tolak(d("CERT_SECRET_KEY_V1", { present: true, value: KUNCI, sealCheck: "unknown" }), /could not be established/)
        && tolak(d("CERT_SECRET_KEY_V1", { present: true, value: KUNCI }), /could not be established/), "a certificate key is kept when its seal check could not run");
      c.expect(tolak(ds.decide("CERT_SECRET_KEY_V2", { present: false, value: null, recorded: null }, KOSONG), /not a durable secret/), "an unknown name is decided");
      return c.verdict("the guard keeps only a verified value (readable, at least 32 characters, matching its record, and the certificate key opening the " +
        "issued seal), mints only an absent and never-recorded secret into a production with no card, no sealed certificate, no school and nobody beyond " +
        "the first administrator, and refuses everything else, an unknown count included; its seal is the application's, byte for byte");
    },
  },
  {
    id: "DR-S02",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const wf = readFileSync(join(repoRoot, DEPLOY), "utf8");
      const body = wf.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");
      const at = (s: string) => body.indexOf(s);
      const guardStep = at("name: Decide the durable secrets");
      c.expect(guardStep > at("name: Take the service-role key from Supabase and prove it works") && at("name: Take the service-role key") > 0
        && guardStep < at("name: Set the production environment"), "the guard does not run after the service-role key is proven and before any variable is written");
      const step = guardStep < 0 ? "" : body.slice(guardStep, body.indexOf("- name:", guardStep + 10));
      c.expect(/git fetch --no-tags --depth=1 origin "\$GITHUB_SHA"/.test(step) && /git show FETCH_HEAD:scripts\/release\/durable-secrets\.mjs/.test(step)
        && /git show FETCH_HEAD:docs\/recovery\/durable-secrets\.json/.test(step) && /durable-secrets\.mjs" guard /.test(step),
        "the guard and its record are not taken from the workflow's own commit, or the guard is not run");
      c.expect(!/\bkeep (CARD_PEPPER|CERT_SECRET_KEY_V1)\b/.test(body) && /\bdurable CARD_PEPPER\b/.test(body) && /\bdurable CERT_SECRET_KEY_V1\b/.test(body),
        "a durable secret is still written by the unconditional keep()");
      const rand = body.match(/openssl rand/g) ?? [];
      const mint = /MINT\)([\s\S]*?);;/.exec(body)?.[1] ?? "";
      c.expect(rand.length === 1 && /openssl rand/.test(mint) && /write_env "\$1"/.test(mint), "a durable secret can be minted outside the guard's MINT verdict");
      c.expect(/\*\)\s+echo "::error::the durable-secret guard gave no verdict for \$1; nothing is minted"; exit 1;;/.test(body),
        "a missing verdict does not stop the deploy");
      let rec: { production?: Record<string, { fingerprint?: unknown }> } = {};
      try { rec = JSON.parse(readFileSync(join(repoRoot, RECORD), "utf8")); } catch { /* the check below says so */ }
      const ok = ["CARD_PEPPER", "CERT_SECRET_KEY_V1"].every((n) => {
        const f = rec.production?.[n]?.fingerprint;
        return rec.production && n in rec.production && (f === null || (typeof f === "string" && /^[0-9a-f]{16}$/.test(f)));
      });
      c.expect(ok, `${RECORD} does not name both secrets with a well-formed fingerprint (or null, not recorded yet)`);
      return c.verdict("the production deploy runs the guard from its own commit after the service-role key is proven and before any variable is " +
        "written, mints a durable secret only on the guard's MINT and stops on a missing verdict; the record names both secrets");
    },
  },
  {
    id: "DR-S03",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      if (!c.expect(existsSync(join(repoRoot, GUARD)), `${GUARD} is missing`)) return c.verdict("");
      const g = (await laden(repoRoot))!;
      const nol = { accounts: 0, certificates: 0, institutions: 0, persons: 1 };
      const tiada = { CARD_PEPPER: null, CERT_SECRET_KEY_V1: null };
      // an empty production: both minted
      const a = await jalankan(repoRoot, { vercel: {}, counts: nol }, tiada);
      c.expect(a.code === 0 && a.verdict === "CARD_PEPPER MINT\nCERT_SECRET_KEY_V1 MINT\n", `an empty production: exit ${a.code}, verdict ${JSON.stringify(a.verdict)}; ${a.text.trim()}`);
      // classroom cards exist and Vercel lost both: refused, no verdict
      const b = await jalankan(repoRoot, { vercel: {}, counts: { ...nol, accounts: 3 } }, tiada);
      c.expect(b.code !== 0 && b.verdict === null && /CARD_PEPPER: REFUSE/.test(b.text) && /3 classroom cards/.test(b.text),
        `Vercel emptied with 3 classroom cards in production: exit ${b.code}, verdict ${JSON.stringify(b.verdict)}; ${b.text.trim()}`);
      // a count it cannot read (the table answers 404): refused
      const e = await jalankan(repoRoot, { vercel: {}, counts: { ...nol, institutions: "404" } }, tiada);
      c.expect(e.code !== 0 && e.verdict === null && /could not be established/.test(e.text), `an unreadable count: exit ${e.code}; ${e.text.trim()}`);
      // both held, recorded, and the key opens the issued seal: kept, nothing printed but fingerprints
      const p = { key_version: 1, nama: "Peserta Uji", skor: 90 };
      const rec = { CARD_PEPPER: g.fingerprint("CARD_PEPPER", LADA), CERT_SECRET_KEY_V1: g.fingerprint("CERT_SECRET_KEY_V1", KUNCI) };
      const k = await jalankan(repoRoot, { vercel: { CARD_PEPPER: LADA, CERT_SECRET_KEY_V1: KUNCI }, counts: { ...nol, accounts: 3, certificates: 1 },
        cert: { canonical_payload: p, signature: signWithKey(p, KUNCI) } }, rec);
      c.expect(k.code === 0 && k.verdict === "CARD_PEPPER KEEP\nCERT_SECRET_KEY_V1 KEEP\n" && /opens an issued certificate's seal/.test(k.text),
        `held and recorded: exit ${k.code}, verdict ${JSON.stringify(k.verdict)}; ${k.text.trim()}`);
      // a certificate key that is not the one the certificates were sealed with
      const x = await jalankan(repoRoot, { vercel: { CARD_PEPPER: LADA, CERT_SECRET_KEY_V1: KUNCI }, counts: { ...nol, certificates: 1 },
        cert: { canonical_payload: p, signature: signWithKey(p, "c".repeat(64)) } }, tiada);
      c.expect(x.code !== 0 && x.verdict === null && /CERT_SECRET_KEY_V1: REFUSE/.test(x.text) && /does not open/.test(x.text),
        `a certificate key that does not open the seal: exit ${x.code}; ${x.text.trim()}`);
      for (const r of [a, b, e, k, x]) c.expect(!r.text.includes(LADA) && !r.text.includes(KUNCI), "the guard printed a secret value");
      return c.verdict("end to end against a stand-in for Vercel and PostgREST: an empty production is minted into; Vercel emptied with classroom " +
        "cards in production is refused with no verdict; an unreadable count is refused; held and recorded secrets whose key opens the issued seal " +
        "are kept; a certificate key that does not open the seal is refused; no value is ever printed");
    },
  },
  {
    id: "DR-D01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const bersih = kesiapan(repoRoot, "");
      if (!c.expect(bersih.ok && bersih.n > 0, `the readiness check could not run: ${bersih.err}`)) return c.verdict("");
      c.expect(bersih.n === 24, `the readiness check has ${bersih.n} rows, expected 24`);
      for (const nama of Object.values(G7)) c.expect(bersih.rows.has(nama), `the readiness check has no row "${nama}"`);
      const gagal = [...bersih.rows].filter(([, x]) => x.v === "FAIL");
      for (const [k, x] of gagal) {
        if (ISI.includes(k)) c.note(`live-content row FAIL on CI's database (other suites' content): ${k}: ${x.m}`);
        else c.expect(false, `on CI's database, unplanted: FAIL ${k}: ${x.m}`);
      }
      const t = kesiapan(repoRoot, TANAM);
      if (!c.expect(t.ok && t.n === bersih.n, `the planted drift could not be measured: ${t.err}`)) return c.verdict("");
      const gagalKah = (nama: string, kata?: RegExp) => {
        const x = t.rows.get(nama);
        return x?.v === "FAIL" && (!kata || kata.test(x.m));
      };
      c.expect(gagalKah(G7.anon, /^\d{2,} relation/), `anon given every right: ${JSON.stringify(t.rows.get(G7.anon))}`);
      c.expect(gagalKah(G7.tabel, /differ: \+/), `authenticated given every right: ${JSON.stringify(t.rows.get(G7.tabel))}`);
      c.expect(gagalKah(G7.fungsi, /differ: \+/), `authenticated given every function: ${JSON.stringify(t.rows.get(G7.fungsi))}`);
      c.expect(gagalKah("anonymous surface unchanged (10 / 19 / 0)", /[1-9]\d* anon function/), `anon given every function: ${JSON.stringify(t.rows.get("anonymous surface unchanged (10 / 19 / 0)"))}`);
      c.expect(gagalKah(G7.pemicu, /2 of 3 .*pintar_password_write_guard/), `the password-write guard dropped: ${JSON.stringify(t.rows.get(G7.pemicu))}`);
      c.expect(gagalKah(G7.praminta, /no role setting|function/), `the pre-request lost: ${JSON.stringify(t.rows.get(G7.praminta))}`);
      c.expect(gagalKah(G7.wadah, /assets \(PUBLIC\)/) && gagalKah("storage buckets private"), `the assets bucket made public: ${JSON.stringify(t.rows.get(G7.wadah))}`);
      c.expect(gagalKah(G7.pemilik, /1 function\(s\) owned by another role/), `a function given to another owner: ${JSON.stringify(t.rows.get(G7.pemilik))}`);
      for (const nama of ["RLS closed by default", "no policy grants unconditionally", "exactly one public verification path", "every function pins its search_path"]) {
        c.expect(t.rows.get(nama)?.v === "PASS", `an untouched row moved with the drift: ${nama}: ${JSON.stringify(t.rows.get(nama))}`);
      }
      return c.verdict("the readiness check reads 24 rows on CI's database with no unplanted FAIL; with the 5 Oct restore's drift planted and rolled " +
        "back (every right to anon and authenticated, the password-write guard dropped, the pre-request lost) and two more (a public assets " +
        "bucket, a function under another owner), each G7 row and the anonymous-surface row FAIL and name what differs, and untouched rows stay PASS");
    },
  },
  {
    id: "DR-S04",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      let m: TitikModul | null = null;
      try { m = (await import(pathToFileURL(join(repoRoot, TITIK)).href)) as TitikModul; } catch { /* the check below says so */ }
      if (!c.expect(m, `${TITIK} is missing or does not load: nothing establishes a restore point before a production apply`)) return c.verdict("");
      const t = m!;
      const now = Date.parse("2026-10-06T12:00:00Z");
      const jam = (h: number) => new Date(now - h * 3_600_000).toISOString();
      const daftar = (...b: { inserted_at: string; status: string }[]) => ({ backups: b, pitr_enabled: false, walg_enabled: true });
      c.expect(t.MAX_AGE_HOURS === 26, `the age limit is ${t.MAX_AGE_HOURS} hours, not 26 (the 24-hour RPO of D-103 plus slack)`);
      const ok = t.decide(200, daftar({ inserted_at: jam(30), status: "COMPLETED" }, { inserted_at: jam(5), status: "COMPLETED" }), now);
      c.expect(ok.verdict === "OK" && ok.backup?.inserted_at === jam(5) && Math.abs((ok.ageHours ?? 0) - 5) < 0.01 && /5\.0 hours old/.test(ok.reasons.join(" ")),
        `a completed backup 5 hours old is not the restore point: ${JSON.stringify(ok)}`);
      const lewat = t.decide(200, daftar({ inserted_at: jam(2), status: "FAILED" }, { inserted_at: jam(20), status: "COMPLETED" }), now);
      c.expect(lewat.verdict === "OK" && lewat.backup?.inserted_at === jam(20), `a failed newer backup is taken, or the completed one is not: ${JSON.stringify(lewat)}`);
      const tolak = (x: Titik, kata: RegExp) => x.verdict === "REFUSE" && kata.test(x.reasons.join(" "));
      c.expect(tolak(t.decide(200, daftar({ inserted_at: jam(27), status: "COMPLETED" }), now), /27\.0 hours old, older than 26/), "a backup 27 hours old is accepted");
      c.expect(tolak(t.decide(200, daftar(), now), /no COMPLETED backup/) && tolak(t.decide(200, daftar({ inserted_at: jam(1), status: "PENDING" }), now), /no COMPLETED backup/),
        "no completed backup is accepted");
      c.expect(tolak(t.decide(403, { message: "forbidden" }, now), /HTTP 403.*permission to read the project's backups/), "an unreadable list (403) is accepted, or does not say what is needed");
      c.expect(tolak(t.decide(500, null, now), /HTTP 500/) && tolak(t.decide(200, { nothing: true }, now), /no list of backups/), "a failed or malformed answer is accepted");
      c.expect(tolak(t.decide(200, daftar({ inserted_at: new Date(now + 3_600_000).toISOString(), status: "COMPLETED" }), now), /future/), "a backup dated in the future is accepted");
      // end to end against a stand-in for the Management API
      const TOKEN = "sbp_standin_token_never_printed_0123456789";
      const jalan = async (status: number, body: unknown) => {
        let metode = ""; let jalur = "";
        const srv = createServer((req, res) => { metode = req.method ?? ""; jalur = req.url ?? ""; res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); });
        await new Promise<void>((ok2) => srv.listen(0, "127.0.0.1", () => ok2()));
        const dir = mkdtempSync(join(tmpdir(), "dr150-titik-")); const rec = join(dir, "backup.json");
        try {
          const out = await new Promise<{ code: number; text: string }>((ok2) => {
            const p = spawn(process.execPath, [join(repoRoot, TITIK), "check", rec], { env: { PATH: process.env.PATH ?? "",
              SUPABASE_ACCESS_TOKEN: TOKEN, PRODUCTION_SUPABASE_PROJECT_REF: "refstandin", RELEASE_SHA: "abc",
              SUPABASE_API: `http://127.0.0.1:${(srv.address() as AddressInfo).port}`, NODE_ENV: "production" } });
            let text = ""; p.stdout.on("data", (b) => (text += b)); p.stderr.on("data", (b) => (text += b));
            p.on("close", (code) => ok2({ code: code ?? -1, text }));
          });
          return { ...out, metode, jalur, rec: existsSync(rec) ? JSON.parse(readFileSync(rec, "utf8")) : null };
        } finally { srv.close(); }
      };
      const baru = new Date(Date.now() - 3 * 3_600_000).toISOString();
      const a = await jalan(200, { backups: [{ inserted_at: baru, status: "COMPLETED", is_physical_backup: true }], pitr_enabled: false, walg_enabled: true });
      c.expect(a.code === 0 && a.metode === "GET" && a.jalur === "/v1/projects/refstandin/database/backups" && a.rec?.verdict === "OK"
        && a.rec?.backup?.inserted_at === baru && a.rec?.release_sha === "abc" && /point-in-time recovery off/.test(a.text),
        `a fresh backup, end to end: exit ${a.code}, ${a.metode} ${a.jalur}, record ${JSON.stringify(a.rec)}; ${a.text.trim()}`);
      const b = await jalan(403, { message: "Forbidden resource" });
      c.expect(b.code !== 0 && b.rec?.verdict === "REFUSE" && /No migration was applied/.test(b.text), `an unreadable list, end to end: exit ${b.code}; ${b.text.trim()}`);
      c.expect(!a.text.includes(TOKEN) && !b.text.includes(TOKEN) && !JSON.stringify(a.rec).includes(TOKEN), "the check printed or recorded the token");
      return c.verdict("the restore-point check accepts only a COMPLETED backup no older than 26 hours and names it and its age; it refuses an " +
        "unreadable list (a 403 names the permission needed), no completed backup, an older one, a future date and a malformed answer; end to end " +
        "it asks with GET only, writes the record and never prints the token");
    },
  },
  {
    id: "DR-S05",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const wf = readFileSync(join(repoRoot, APPLY), "utf8");
      const body = wf.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");
      const at = (x: string) => body.indexOf(x);
      const langkah = at("name: Restore point");
      c.expect(langkah > at("name: State before") && at("name: State before") > 0 && langkah < at("name: Apply pending migrations"),
        "the restore-point check does not run after the state before and before any migration");
      const isi = langkah < 0 ? "" : body.slice(langkah, at("name: Apply pending migrations"));
      c.expect(/git fetch --no-tags --depth=1 origin "\$GITHUB_SHA"/.test(isi) && /git show FETCH_HEAD:scripts\/release\/restore-point\.mjs/.test(isi)
        && /restore-point\.mjs" check /.test(isi) && /SUPABASE_ACCESS_TOKEN: \$\{\{ secrets\.PRODUCTION_SUPABASE_ACCESS_TOKEN \}\}/.test(isi),
        "the check is not taken from the workflow's own commit, or is not run with production's token");
      c.expect(/pg_stat_archiver/.test(isi) && /fakta\.sql/.test(isi) && /default_transaction_read_only=on/.test(isi),
        "the WAL archiver and the facts before the apply are not recorded, or not read only");
      c.expect(/uses: actions\/upload-artifact@v4/.test(isi) && /retention-days: 90/.test(isi) && /if-no-files-found: error/.test(isi),
        "the restore point's record is not kept as an artifact for 90 days");
      const r = readFileSync(join(repoRoot, REHEARSAL), "utf8");
      c.expect(!/grep -c '\| FAIL'/.test(r) && /grep -c '\^FAIL'/.test(r), "the restore rehearsal still counts readiness FAIL rows by a pattern no line contains");
      return c.verdict("the production apply runs the restore-point check from its own commit, after the state before and before any " +
        "migration, records the WAL archiver and the facts before the apply read only, and keeps the record 90 days; the rehearsal counts " +
        "readiness FAIL rows by the verdict each line begins with");
    },
  },
  {
    id: "DR-S06",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      let wf = "";
      try { wf = readFileSync(join(repoRoot, WATCH), "utf8"); } catch { /* the check below says so */ }
      if (!c.expect(wf, `${WATCH} is missing: nobody is told when production fails`)) return c.verdict("");
      const body = wf.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");
      c.expect(/if: github\.ref == 'refs\/heads\/main' && \(github\.event_name == 'workflow_dispatch' \|\| vars\.PINTAR_PRODUCTION_WATCH == 'on'\)/.test(body)
        && /schedule:\s*\n\s*- cron:/.test(body), "the scheduled watch is not off until the owner turns it on, or runs off main");
      c.expect(/permissions:\s*\n\s*contents: read\s*\n\s*issues: write\s*\n/.test(body), "the watch holds more than reading the code and writing an issue");
      const look = body.slice(body.indexOf("name: Look at production"), body.indexOf("name: Open, update or close"));
      c.expect(/curl -sS -o \/tmp\/masuk\.html -w '%\{http_code\}' --max-time 20 "\$APP_ORIGIN\/masuk"/.test(look) && !/curl[^\n]*(-L|--location)\b/.test(look),
        "the sign-in page is not asked strictly (a redirect would be followed)");
      c.expect(/\/auth\/v1\/health/.test(look) && /openssl x509 -noout -enddate/.test(look) && /-ge 14/.test(look),
        "Supabase Auth's health or the certificate's remaining days are not checked");
      c.expect(/node scripts\/release\/restore-point\.mjs check/.test(look) && /HTTP \(401\|403\)/.test(look),
        "the restore point is not checked through restore-point.mjs, or an unreadable backup list fails the watch");
      c.expect(!/-X (POST|PUT|PATCH|DELETE)/.test(look) && !/SUPABASE_DB|PGPASSWORD|SERVICE_ROLE|VERCEL_TOKEN/.test(body),
        "the look at production writes, or holds a database, service-role or Vercel credential");
      const issue = body.slice(body.indexOf("name: Open, update or close"));
      c.expect(/select\(\.title == \$t/.test(issue) && /\/issues\/\$open\/comments/.test(issue) && /"state":"closed","state_reason":"completed"/.test(issue)
        && /exit 1/.test(issue), "a failure does not open (or update) the one issue and fail the run, or green does not close it");
      return c.verdict("the production watch runs from main, on its schedule only once the owner turns it on, looks at production from outside " +
        "with GET only (sign-in page strictly, Auth health, the certificate's days, the restore point; an unreadable backup list reported, not " +
        "failed), opens or updates one issue on a failure and closes it when green");
    },
  },
];
