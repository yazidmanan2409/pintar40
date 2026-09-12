/**
 * Static runner — F01-S01…S05 (FABLE-01 acceptance checklist; doc 16 §5
 * "schema-lint, route-inventory, bundle-scan and import-graph checks").
 * Reads the repository and the production build output; no database, no
 * network. Exported as a list; selftest/run.ts executes it.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, basename } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { renderAll, INTERNAL_WORDS } from "../src/lib/hle";

const IGNORED_DIRS = new Set(["node_modules", ".next", ".git", "coverage", "out", "build", ".vercel"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function walkDirs(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      out.push(p);
      walkDirs(p, out);
    }
  }
  return out;
}

/** SQL with `--` comments and single-quoted string literals removed. */
function sqlCode(sql: string): string {
  return sql.replace(/--[^\n]*/g, " ").replace(/'(?:[^']|'')*'/g, "''");
}

export const staticTests: SelfTest[] = [
  {
    id: "F01-S01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const migrationDirs = walkDirs(repoRoot).filter((d) => /migration/i.test(basename(d)));
      c.expect(
        migrationDirs.length === 1 && relative(repoRoot, migrationDirs[0]) === join("supabase", "migrations"),
        `expected exactly one migrations directory (supabase/migrations), found: ${migrationDirs.map((d) => relative(repoRoot, d)).join(", ") || "none"}`,
      );
      const dir = join(repoRoot, "supabase", "migrations");
      const files = existsSync(dir) ? readdirSync(dir).sort() : [];
      c.expect(files.length > 0, "no migration files");
      let prev = "";
      for (const f of files) {
        const m = /^(\d{14})_[a-z0-9_]+\.sql$/.exec(f);
        if (!c.expect(m, `migration file name not canonical: ${f}`)) continue;
        c.expect(m![1] > prev, `migration versions not strictly increasing at ${f}`);
        prev = m![1];
        const sql = readFileSync(join(dir, f), "utf8");
        const lastDo = sql.lastIndexOf("\ndo $$");
        const tail = lastDo >= 0 ? sql.slice(lastDo) : "";
        c.expect(
          lastDo >= 0 && /raise exception/i.test(tail),
          `${f} has no terminal verification block (do $$ … raise exception …)`,
        );
      }
      c.note(`${files.length} migrations`);
      return c.verdict("one migrations directory; every migration ends in a verification block");
    },
  },
  {
    id: "F01-S02",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const files = walk(join(repoRoot, "supabase")).filter((f) => f.endsWith(".sql"));
      const permissive = /\b(using|with\s+check)\s*\(\s*true\s*\)/i;
      for (const f of files) {
        const code = sqlCode(readFileSync(f, "utf8"));
        const m = permissive.exec(code);
        c.expect(!m, `${relative(repoRoot, f)} contains a permissive policy clause: ${m?.[0]}`);
      }
      c.note(`${files.length} sql files scanned`);
      return c.verdict("no USING/WITH CHECK (true) in any migration or seed");
    },
  },
  {
    id: "F01-S03",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // (a) client bundle scan
      const staticDir = join(repoRoot, ".next", "static");
      if (!c.expect(existsSync(staticDir), ".next/static missing — production build required before the static runner")) {
        return c.verdict("");
      }
      const forbidden = ["SUPABASE_SERVICE_ROLE_KEY", "service_role", "CARD_PEPPER", "supabaseService", "deriveCardSecret"];
      const jwtLike = /eyJ[A-Za-z0-9_-]{10,}\.(eyJ[A-Za-z0-9_-]{10,})\./g;
      let scanned = 0;
      for (const f of walk(staticDir).filter((f) => /\.(js|mjs|json|txt)$/.test(f))) {
        const text = readFileSync(f, "utf8");
        scanned++;
        for (const w of forbidden) c.expect(!text.includes(w), `client bundle ${relative(repoRoot, f)} contains "${w}"`);
        for (const m of text.matchAll(jwtLike)) {
          let role = "";
          try {
            role = String(JSON.parse(Buffer.from(m[1], "base64url").toString("utf8")).role ?? "");
          } catch {
            /* not a JWT payload */
          }
          c.expect(role !== "service_role", `client bundle ${relative(repoRoot, f)} embeds a service_role JWT`);
        }
      }
      // (b) import graph: client components never import server-only modules
      const serverOnly = [/@\/lib\/supabase\/service/, /@\/lib\/card/, /["']server-only["']/, /next\/headers/];
      let clientFiles = 0;
      for (const f of walk(join(repoRoot, "src")).filter((f) => /\.(ts|tsx)$/.test(f))) {
        const text = readFileSync(f, "utf8");
        if (!/^\s*["']use client["']/m.test(text)) continue;
        clientFiles++;
        for (const re of serverOnly) c.expect(!re.test(text), `client component ${relative(repoRoot, f)} imports a server-only module (${re.source})`);
      }
      // (c) service-role and pepper reads live only in server-only modules
      for (const f of walk(join(repoRoot, "src")).filter((f) => /\.(ts|tsx)$/.test(f))) {
        const text = readFileSync(f, "utf8");
        const rel = relative(repoRoot, f);
        if (/process\.env\.SUPABASE_SERVICE_ROLE_KEY|process\.env\.CARD_PEPPER/.test(text)) {
          c.expect(rel === join("src", "lib", "env.ts"), `${rel} reads a server secret directly; only src/lib/env.ts may`);
        }
        if (/from\s+["']@\/lib\/supabase\/service["']/.test(text)) {
          c.expect(/^src[\\/]app[\\/]api[\\/]/.test(rel), `${rel} imports the service-role client outside src/app/api/`);
        }
      }
      c.note(`${scanned} bundle files, ${clientFiles} client components`);
      return c.verdict("no service-role or pepper reference reaches the client");
    },
  },
  {
    id: "F01-S04",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // (a) HLE renders every key for every persona; the guard throws on an internal word
      let rows: ReturnType<typeof renderAll> = [];
      try {
        rows = renderAll();
      } catch (e) {
        c.expect(false, `HLE render failed: ${(e as Error).message}`);
      }
      c.expect(rows.length > 0, "HLE table is empty");
      for (const r of rows) c.expect(r.text.trim().length > 0, `HLE ${r.event}/${r.persona} is empty`);
      // (b) copy/route inventory over every user-facing source file
      const appFiles = walk(join(repoRoot, "src", "app")).filter((f) => /\.(ts|tsx)$/.test(f));
      const words = INTERNAL_WORDS.filter((w) => w !== "PINTAR 4.0");
      for (const f of appFiles) {
        const text = readFileSync(f, "utf8");
        const rel = relative(repoRoot, f);
        c.expect(!/PINTAR\s*4\.0/i.test(text), `${rel} mentions the internal version string`);
        // JSX text nodes and title/placeholder attributes only — enum comparisons in code are not user copy
        for (const m of text.matchAll(/>([^<>{}]*)</g)) {
          const node = m[1];
          for (const w of words) c.expect(!new RegExp(`\\b${w}\\b`).test(node), `${rel} renders internal word "${w}" in JSX text`);
        }
      }
      c.note(`${rows.length} HLE renders, ${appFiles.length} route files`);
      return c.verdict("no internal word or version string on a user-facing surface");
    },
  },
  {
    id: "F02-S01",
    run: async ({ repoRoot }) => {
      // INV-20: analytics, psychometrics, reporting and certification read
      // evidence through official_* and nowhere else. The database side is a
      // privilege (the analytics role holds no grant on a raw table); this is
      // the code side, because a server route running as service_role would
      // bypass that privilege entirely and nothing in the schema could stop it.
      const c = new Checks();
      const RAW = /\b(assessment_sessions|presented_items|responses|assessment_results)\b/;
      const CONSUMER = /(analytic|psychometric|report|certificat|question-health|questionhealth)/i;
      const roots = ["src", "supabase/functions"].map((d) => join(repoRoot, d)).filter(existsSync);
      const files = roots
        .flatMap((r) => walk(r))
        .filter((f) => /\.(ts|tsx|sql)$/.test(f))
        .filter((f) => CONSUMER.test(relative(repoRoot, f)));
      for (const f of files) {
        const code = f.endsWith(".sql") ? sqlCode(readFileSync(f, "utf8")) : readFileSync(f, "utf8");
        // official_responses contains "responses"; strip the official views
        // first so the check is about RAW reads, not about the word.
        const stripped = code.replace(/\bofficial_(sessions|responses|results)\b/g, "OFFICIAL_VIEW");
        const m = RAW.exec(stripped);
        c.expect(
          !m,
          `${relative(repoRoot, f)} is an evidence consumer and reads the raw table ${m?.[0]}; use official_* (INV-20)`,
        );
      }
      c.note(`${files.length} evidence-consumer file(s) scanned`);
      return c.verdict("no analytics, psychometric, reporting or certification path reads a raw evidence table");
    },
  },
  {
    id: "F01-S05",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const p = join(repoRoot, "docs", "adr", "0001-foundation.md");
      if (!c.expect(existsSync(p), "docs/adr/0001-foundation.md missing")) return c.verdict("");
      const md = readFileSync(p, "utf8");
      const required = [
        "Problem", "Considered options", "Decision", "Reason", "Calm-surface check", "Consequences", "Traces to",
        "Affected components", "Affected database objects", "Security implications", "Future constraints",
        "Tests proving the decision",
      ];
      const sections = new Map<string, string>();
      const parts = md.split(/^## /m).slice(1);
      for (const part of parts) {
        const nl = part.indexOf("\n");
        sections.set(part.slice(0, nl).trim(), part.slice(nl + 1).trim());
      }
      for (const s of required) {
        const body = sections.get(s);
        c.expect(body !== undefined, `ADR-0001 lacks section "## ${s}" (doc 13)`);
        if (body !== undefined) c.expect(body.length > 0, `ADR-0001 section "${s}" is empty`);
      }
      for (const label of ["Requirement", "Architecture", "Implementation", "Test", "Audit evidence", "Patent/innovation register entry"]) {
        c.expect(new RegExp(`^- ${label.replace("/", "\\/")}:`, "m").test(sections.get("Traces to") ?? ""), `Traces to lacks "${label}"`);
      }
      c.expect(/^\*\*Status:\*\* (Proposed|Accepted|Superseded by ADR-\d{4})/m.test(md), "ADR-0001 status line missing or malformed");
      c.expect(!/\bTBD\b|\bTODO\b/.test(md), "ADR-0001 still contains TBD/TODO");
      return c.verdict("ADR-0001 present with every doc 13 section and traceability");
    },
  },
];
