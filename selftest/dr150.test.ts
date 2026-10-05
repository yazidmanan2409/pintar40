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
 */
import { spawn } from "node:child_process";
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
               SUPABASE_URL: s.url, SERVICE_ROLE_KEY_FILE: key },
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
];
