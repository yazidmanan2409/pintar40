/**
 * Static runner — F01-S01…S05 (FABLE-01 acceptance checklist; doc 16 §5
 * "schema-lint, route-inventory, bundle-scan and import-graph checks").
 * Reads the repository and the production build output; no database, no
 * network. Exported as a list; selftest/run.ts executes it.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, relative, basename } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { renderAll, INTERNAL_WORDS } from "../src/lib/hle";

const IGNORED_DIRS = new Set(["node_modules", ".next", ".git", "coverage", "out", "build", ".vercel"]);

/**
 * Source with comments removed. A rule about what a module may READ has to be
 * tested against code, not prose: sign.ts explains in a comment why it never
 * touches a signing key, and a raw substring scan would fail it for saying so.
 */
function code(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

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
        // Two secret classes, two named readers, and neither may read the
        // other's. FABLE-01 put the platform secrets behind src/lib/env.ts.
        // FABLE-04's certificate keys are NOT there on purpose: env.ts is
        // imported by client components, so it is not a `server-only` module,
        // and a signing key belongs behind that guard.
        if (/process\.env\.SUPABASE_SERVICE_ROLE_KEY|process\.env\.CARD_PEPPER/.test(code(text))) {
          c.expect(rel === join("src", "lib", "env.ts"), `${rel} reads a platform secret directly; only src/lib/env.ts may`);
        }
        if (/CERT_SECRET_KEY/.test(code(text))) {
          c.expect(
            rel === join("src", "lib", "certificates", "keyring.ts"),
            `${rel} names a certificate signing key; only src/lib/certificates/keyring.ts may`,
          );
          c.expect(
            /^\s*import\s+["']server-only["']/m.test(text),
            `${rel} reads a certificate signing key without the server-only guard`,
          );
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
    id: "F03-S01",
    run: async ({ repoRoot }) => {
      // INV-26: one engine. The database side is asserted by each migration's
      // verification block (exactly one assemble_session, one session_paper,
      // one grade_response, one evaluate_session, one finalize_session). This
      // is the code side, and it is the one the prompt asks for by name: "a
      // second implementation of assembly, the sanitizer, scoring or the
      // safety gate fails the build".
      //
      // It is expressed as a call-site rule rather than a similarity check,
      // because "looks like a second scorer" is not decidable and "calls the
      // engine's RPCs from outside the engine" is. Every route reaches the
      // cycle through src/lib/assessment-engine/; a file that names one of
      // those RPCs anywhere else has begun to be a second engine.
      const c = new Checks();
      const ENGINE_RPCS = [
        "assemble_session", "session_paper", "sanitized_item", "record_answer",
        "grade_response", "evaluate_session", "finalize_session", "start_learning_session",
        "open_assistance", "assistance_state", "reading_map", "session_review",
      ];
      const ENGINE_DIR = join("src", "lib", "assessment-engine");
      const src = join(repoRoot, "src");
      if (!c.expect(existsSync(src), "src/ missing")) return c.verdict("");
      let scanned = 0, engineFiles = 0;
      for (const f of walk(src).filter((x) => /\.(ts|tsx)$/.test(x))) {
        const rel = relative(repoRoot, f);
        const text = readFileSync(f, "utf8");
        if (rel.startsWith(ENGINE_DIR)) { engineFiles++; continue; }
        scanned++;
        for (const rpc of ENGINE_RPCS) {
          c.expect(
            !new RegExp(`["'\`]${rpc}["'\`]`).test(text),
            `${rel} calls the engine RPC "${rpc}" directly; every route goes through src/lib/assessment-engine/ (INV-26)`,
          );
        }
        // and nothing outside the engine re-implements the sanitizer's own job
        c.expect(
          !/ANSWER_KEY_FIELDS\s*=/.test(text) && !/LEARNER_ITEM_KEYS\s*=/.test(text),
          `${rel} declares its own learner-item key list; the allow-list lives in the engine (INV-26)`,
        );
      }
      c.expect(engineFiles > 0, "src/lib/assessment-engine/ is empty: there is no engine to be the only one");
      // the engine holds no privilege of its own
      for (const f of walk(join(repoRoot, ENGINE_DIR)).filter((x) => /\.ts$/.test(x))) {
        const text = readFileSync(f, "utf8");
        // an import, not the words: the module's own header explains why it
        // does not import this, and a prose mention is not a dependency
        c.expect(
          !/from\s+["']@\/lib\/supabase\/service["']/.test(text),
          `${relative(repoRoot, f)} imports the service-role client; the engine takes the caller's client`,
        );
      }
      c.note(`${scanned} file(s) outside the engine, ${engineFiles} inside`);
      return c.verdict("exactly one module calls the engine's RPCs, and it holds no privilege of its own");
    },
  },
  {
    id: "F03-S02",
    run: async ({ repoRoot }) => {
      // INV-01 as a contract test: the authoring shape and the learner shape
      // are diffed, and every authoring field must be either allow-listed or
      // absent. The authoring field list is read from the migration that
      // creates the tables, not written out here — so a column added to
      // `items` or `item_options` later is picked up by this test without
      // anyone remembering to update it (doc 12's "new authoring fields
      // default to excluded", checked rather than hoped for).
      const c = new Checks();
      const mig = join(repoRoot, "supabase", "migrations");
      if (!c.expect(existsSync(mig), "supabase/migrations missing")) return c.verdict("");
      const files = readdirSync(mig).sort();
      const hierarchy = files.find((f) => f.endsWith("_content_hierarchy.sql"));
      if (!c.expect(Boolean(hierarchy), "the content hierarchy migration is missing")) return c.verdict("");
      const sql = readFileSync(join(mig, hierarchy as string), "utf8");

      const columnsOf = (table: string): string[] => {
        const m = new RegExp(`create table public\\.${table} \\(([\\s\\S]*?)\\n\\);`).exec(sql);
        if (!m) return [];
        return m[1]
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => /^[a-z_]+\s+/.test(l) && !/^(constraint|unique|check|primary|foreign)\b/.test(l))
          .map((l) => l.split(/\s+/)[0]);
      };
      const authoring = [...columnsOf("items"), ...columnsOf("item_options")];
      c.expect(authoring.length > 5, `only ${authoring.length} authoring column(s) parsed; the diff would be vacuous`);

      // the allow-list, as the delivery migration writes it
      const delivery = files.find((f) => f.endsWith("_learning_cycle_delivery.sql"));
      if (!c.expect(Boolean(delivery), "the delivery migration is missing")) return c.verdict("");
      const deliverySql = readFileSync(join(mig, delivery as string), "utf8");
      const allowed = new Set(
        [...deliverySql.matchAll(/'\[([^\]]*)\]'::jsonb/g)]
          .flatMap((m) => m[1].split(",").map((x) => x.trim().replace(/^"|"$/g, "")))
          .filter(Boolean),
      );
      c.expect(allowed.size > 0, "no sanitizer allow-list was found in the delivery migration");

      const LEAKY = ["is_correct", "rationale", "misconception_code", "petunjuk", "arah_berpikir",
                     "predicted_difficulty", "empirical_difficulty", "empirical_discrimination",
                     "objective_ids", "label", "parallel_group", "bank_type"];
      for (const col of authoring) {
        if (LEAKY.includes(col)) {
          c.expect(!allowed.has(col), `the sanitizer allow-list names the authoring field "${col}" (INV-01)`);
        }
      }
      // the TypeScript mirror agrees with the SQL, so neither can drift alone
      const types = readFileSync(join(repoRoot, "src", "lib", "assessment-engine", "types.ts"), "utf8");
      for (const key of allowed) {
        c.expect(types.includes(`"${key}"`), `the engine's learner type does not carry the allow-listed key "${key}"`);
      }
      for (const col of LEAKY) {
        c.expect(
          !new RegExp(`^\\s*${col}[?]?:`, "m").test(types),
          `the engine's learner type declares the authoring field "${col}" (INV-01)`,
        );
      }
      c.note(`${authoring.length} authoring column(s) against ${allowed.size} allow-listed key(s)`);
      return c.verdict("no authoring field is allow-listed, and the SQL allow-list and the TypeScript type agree");
    },
  },
  {
    id: "F03-S03",
    run: async ({ repoRoot }) => {
      // INV-31: the Learner Assistance Intelligence Context is the sanitized
      // shape, and building one from an authoring row is refused. Behavioural,
      // because a type check proves nothing at run time: the real module is
      // imported and fed an authoring row.
      const c = new Checks();
      const gateway = join(repoRoot, "src", "ai-gateway", "contexts.ts");
      if (!c.expect(existsSync(gateway), "src/ai-gateway/contexts.ts missing")) return c.verdict("");

      const mod = await import("../src/ai-gateway/contexts");
      const item = {
        item_type: "MCQ_SINGLE",
        stem: "Manakah yang bernilai sama dengan 1/2?",
        stimulus: null,
        opsi: [{ posisi: 1, teks: "2/4" }, { posisi: 2, teks: "1/4" }],
      };
      const ctx = mod.buildLearnerAssistanceContext(item as never, "SD", 1);
      c.expect(ctx.kind === "LEARNER_ASSISTANCE", "the context does not declare its kind");
      c.expect(ctx.stage === "SD", `stage mapped to ${ctx.stage} instead of SD`);
      c.expect(
        JSON.stringify(ctx.item) === JSON.stringify(item),
        "the context's item is not the sanitized item it was given",
      );

      // an authoring row must be refused, not quietly narrowed
      for (const field of ["is_correct", "rationale", "misconception_code", "petunjuk", "arah_berpikir"]) {
        let refused = false;
        try {
          mod.buildLearnerAssistanceContext({ ...item, [field]: "x" } as never, "SD", 1);
        } catch {
          refused = true;
        }
        c.expect(refused, `the assistance context accepted an item carrying "${field}" (INV-31)`);
      }

      // and the boundary is still contracts only: no provider anywhere in it
      for (const f of walk(join(repoRoot, "src", "ai-gateway")).filter((x) => /\.(ts|tsx)$/.test(x))) {
        const text = readFileSync(f, "utf8");
        c.expect(
          !/\b(openai|anthropic|gemini|vertex|bedrock|api[_-]?key|fetch\()/i.test(text),
          `${relative(repoRoot, f)} names a provider or makes a call; the boundary is contracts only (INV-32)`,
        );
      }
      return c.verdict("the assistance context equals the sanitized item and refuses an authoring row; no provider in the boundary");
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
  // ------------------------------------------------------------ FABLE-04
  {
    id: "F04-S01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      // INV-38: exactly one canonical verification route SHAPE in the app.
      const routes: string[] = [];
      const walk = (dir: string) => {
        for (const e of readdirSync(dir, { withFileTypes: true })) {
          const p = join(dir, e.name);
          if (e.isDirectory()) walk(p);
          else if (/^(page|route)\.tsx?$/.test(e.name)) routes.push(p);
        }
      };
      walk(join(repoRoot, "src", "app"));
      const verification = routes.filter((r) => /verif/i.test(r));
      c.expect(
        verification.length === 1,
        `INV-38 requires exactly one verification route shape; found ${verification.length}: ${verification
          .map((r) => r.replace(repoRoot, ""))
          .join(", ")}`,
      );
      // and no internal designation on it
      if (verification.length === 1) {
        const src = readFileSync(verification[0], "utf8");
        for (const word of ["PINTAR 4.0", "SYNTHETIC", "OFFICIAL", "PREVIEW", "evidence_class", "engine_version", "scoring_policy"]) {
          c.expect(!src.includes(word), `the verification route names the internal term "${word}"`);
        }
        c.expect(
          !/name_as_issued|photo_path|display_name/.test(src),
          "the verification route reads an identity field; D3b excludes it",
        );
      }
      return c.verdict(
        `exactly one verification route shape, carrying no internal designation and no identity field (${routes.length} route file(s) scanned)`,
      );
    },
  },
  {
    id: "F04-S02",
    requires: [],
    run: async () => {
      const c = new Checks();
      const KEY = "selftest-certificate-key-v1-at-least-32-chars";
      const { signWithKey, verifyWithKey, canonicalBytes } = await import("../src/lib/certificates/sign");
      const signPayload = (p: Record<string, unknown>) => signWithKey(p, KEY);
      const verifySignature = (p: Record<string, unknown>, sg: string) => verifyWithKey(p, KEY, sg);
      const base = {
        certificate_number: "PINTAR/X/2026/00001",
        identity_snapshot_hash: "a".repeat(64),
        result: { score: 0.9, predikat: "Baik", passed: true, safety_gate: true },
        issued_at: "2026-09-14T00:00:00Z",
        plp_release_id: "11111111-1111-1111-1111-111111111111",
        release_content_sha256: "b".repeat(64),
        assessment_definition_id: "22222222-2222-2222-2222-222222222222",
        assessment_definition_version: 1,
        scoring_policy_version: "pintar-scoring/1",
        key_version: 1,
      } as Record<string, unknown>;
      const sig = signPayload(base);
      c.expect(verifySignature(base, sig), "a freshly signed payload does not verify");

      // INV-05: tampering with EACH protected field must break verification
      for (const field of Object.keys(base)) {
        const tampered = { ...base };
        tampered[field] =
          field === "result"
            ? { score: 1, predikat: "Sangat Baik", passed: true, safety_gate: true }
            : typeof base[field] === "number"
              ? (base[field] as number) + 1
              : `${base[field]}-tampered`;
        c.expect(!verifySignature(tampered, sig), `tampering with "${field}" still verified (INV-05)`);
      }
      // key order must not matter; value order must
      const reordered = Object.fromEntries(Object.entries(base).reverse());
      c.expect(canonicalBytes(reordered) === canonicalBytes(base), "canonicalisation depends on key order");
      c.expect(verifySignature(reordered, sig), "a key-reordered payload does not verify");

      // the comparison is timing-safe: assert the function, not only a false
      const src = readFileSync(new URL("../src/lib/certificates/sign.ts", import.meta.url), "utf8");
      c.expect(src.includes("timingSafeEqual"), "verification does not use crypto.timingSafeEqual (INV-05)");
      c.expect(
        !/\bexpected\s*===\s*signature\b|\bsignature\s*===\s*expected\b/.test(src),
        "verification compares signatures with ===",
      );
      return c.verdict(
        `a signed payload verifies; tampering with each of the ${Object.keys(base).length} protected fields breaks it; the compare is timing-safe`,
      );
    },
  },
  {
    id: "F04-S03",
    requires: [],
    run: async () => {
      const c = new Checks();
      // Rotation semantics are exercised over the pure layer with two literal
      // keys: `keyring.ts` is server-only and resolving a version to a secret is
      // the one thing this test does not need to do.
      const { signWithKey, verifyWithKey } = await import("../src/lib/certificates/sign");
      const V1 = "selftest-certificate-key-v1-at-least-32-chars";
      const V2 = "selftest-certificate-key-v2-at-least-32-chars";
      const payload = { certificate_number: "X", key_version: 1 } as Record<string, unknown>;
      const sigV1 = signWithKey(payload, V1);

      // INV-07: after rotation the V1 certificate still verifies under V1 ...
      c.expect(verifyWithKey(payload, V1, sigV1), "a V1 certificate stopped verifying after rotation (INV-07)");
      // ... and is not accepted under V2
      c.expect(!verifyWithKey(payload, V2, sigV1), "a V1 signature verified under the V2 key");

      // and the keyring keeps every version rather than replacing one
      const src = readFileSync(new URL("../src/lib/certificates/keyring.ts", import.meta.url), "utf8");
      c.expect(/availableKeyVersions/.test(src), "the keyring exposes no version list");
      c.expect(!/delete process\.env|CERT_SECRET_KEY_V1 =/.test(src), "the keyring mutates or drops a key version");
      c.expect(/versions\[versions\.length - 1\]/.test(src), "the signing key is not the highest available version");
      return c.verdict("rotation advances the signing key, keeps V1 verifiable, and refuses a cross-version signature");
    },
  },
  {
    id: "F04-S04",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      // THE LOOP THIS CLOSES. Before it, SQL built canonical payloads and the
      // TypeScript crypto was exercised only over payloads TypeScript had also
      // built. The db suite sealed with `repeat('a', 64)` and the real HMAC was
      // produced exclusively by the issuance route, which needs the network
      // facility and is skipped locally — so no test anywhere proved that a
      // payload BUILT IN SQL, SIGNED IN NODE and STORED IN POSTGRES verifies
      // when a different process reads it back. That is the acceptance item
      // "issued, then verified after a full process restart", and it was the
      // finding of the first-certificate-issuance boundary audit.
      const KEY = "selftest-certificate-key-v1-at-least-32-chars";
      const { signWithKey, verifyWithKey } = await import("../src/lib/certificates/sign");
      const dbUrl = process.env.SUPABASE_DB_URL!;
      // each call is its own psql process: the bytes cross a process boundary
      // in both directions, which is the point of the test
      const psql = (sql: string): string => {
        const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, dbUrl], { encoding: "utf8" });
        if (r.status !== 0) throw new Error(`psql failed: ${(r.stderr || "").slice(0, 300)}`);
        return r.stdout.trim();
      };

      let certificateId = "";
      try {
        const prepared = JSON.parse(
          psql("select row_to_json(t) from (select * from selftest.issue_material()) t"),
        ) as { certificate_id: string; canonical_payload: Record<string, unknown>; key_version: number };
        certificateId = prepared.certificate_id;
        c.expect(prepared.key_version === 1, `the prepared payload names key version ${prepared.key_version}`);

        const signature = signWithKey(prepared.canonical_payload, KEY);
        psql(`select public.certificate_seal('${certificateId}'::uuid, 1::smallint, '${signature}')`);

        // a FRESH process reads back what Postgres stored, and recomputes
        const stored = JSON.parse(
          psql(
            `select row_to_json(t) from (select canonical_payload, signature, key_version, status
               from public.certificates where id = '${certificateId}'::uuid) t`,
          ),
        ) as {
          canonical_payload: Record<string, unknown>;
          signature: string;
          key_version: number;
          status: string;
        };
        c.expect(stored.status === "ISSUED", `the certificate is ${stored.status}, not ISSUED`);
        c.expect(stored.signature === signature, "Postgres stored a different signature than the one submitted");
        c.expect(
          verifyWithKey(stored.canonical_payload, KEY, stored.signature),
          "a certificate built in SQL and signed in Node did not verify when read back from Postgres (INV-05)",
        );

        // and the stored bytes are what is protected: change one of them and it fails
        const tampered = { ...stored.canonical_payload, certificate_number: "PINTAR/X/2026/99999" };
        c.expect(
          !verifyWithKey(tampered, KEY, stored.signature),
          "a tampered stored payload still verified (INV-05)",
        );
        // a wrong key fails too, so the pass above is not a vacuous true
        c.expect(
          !verifyWithKey(stored.canonical_payload, KEY.replace("v1", "v9"), stored.signature),
          "the stored payload verified under a key it was never signed with",
        );
      } finally {
        if (certificateId) {
          try {
            psql("select selftest.purge_certificates()");
          } catch {
            /* the suite's own purge runs again in run_fable04 */
          }
        }
      }
      return c.verdict(
        "a canonical payload built in SQL, signed in Node with the real keyring crypto and stored in Postgres " +
          "verifies when a separate process reads it back, fails when a stored byte changes, and fails under another key",
      );
    },
  },
];
