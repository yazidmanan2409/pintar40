/**
 * Static runner — F01-S01…S05 (FABLE-01 acceptance checklist; doc 16 §5
 * "schema-lint, route-inventory, bundle-scan and import-graph checks").
 * Reads the repository and the production build output; no database, no
 * network. Exported as a list; selftest/run.ts executes it.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { spawnSync } from "node:child_process";
import { join, relative, basename } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { renderAll, INTERNAL_WORDS } from "../src/lib/hle";
import { experienceTests } from "./experience.test";
import { emailTests } from "./email.test";
import { aktifkanTests } from "./aktifkan.test";
import { daisy40Tests } from "./daisy40.test";
import { loginTests } from "./login.test";
import { strukturTests } from "./struktur.test";
import { unggahTests } from "./unggah.test";
import { terbitanTests } from "./terbitan.test";
import { penugasanTests } from "./penugasan.test";
import { sesiTests } from "./sesi.test";
import { bob06Tests } from "./bob06.test";
import { galatTests } from "./galat.test";
import { bob08Tests } from "./bob08.test";
import { bob09Tests } from "./bob09.test";
import { bob18Tests } from "./bob18.test";
import { bob17Tests } from "./bob17.test";
import { bob22Tests } from "./bob22.test";
import { bob23Tests } from "./bob23.test";
import { w2Tests } from "./w2.test";
import { w3Tests } from "./w3.test";
import { w5Tests } from "./w5.test";
import { w8Tests } from "./w8.test";
import { w9Tests } from "./w9.test";
import { w10Tests } from "./w10.test";
import { w11Tests } from "./w11.test";
import { m7Tests } from "./m7.test";
import { w9bTests } from "./w9b.test";
import { edu23Tests } from "./edu23.test";
import { hod05Tests } from "./hod05.test";
import { hod09Tests } from "./hod09.test";
import { m4Tests } from "./m4.test";
import { adm06Tests } from "./adm06.test";
import { m9Tests } from "./m9.test";
import { adm19Tests } from "./adm19.test";
import { adm02Tests } from "./adm02.test";
import { adm09Tests } from "./adm09.test";
import { d088iTests } from "./d088i.test";
import { d088hTests } from "./d088h.test";
import { d088gTests } from "./d088g.test";
import { d088kTests } from "./d088k.test";
import { bob49Tests } from "./bob49.test";
import { m3Tests } from "./m3.test";
import { m6Tests } from "./m6.test";
import { t2Tests } from "./t2.test";
import { kolomTests } from "./kolom.test";
import { m10Tests } from "./m10.test";
import { m3rTests } from "./m3r.test";
import { c1Tests } from "./c1.test";
import { j613Tests } from "./j613.test";
import { j614Tests } from "./j614.test";
import { l4Tests } from "./l4.test";
import { effTests } from "./eff.test";
import { pitaTests } from "./pita.test";
import { d006Tests } from "./d006.test";
import { w16Tests } from "./w16.test";
import { bob12Tests } from "./bob12.test";
import { bob32Tests } from "./bob32.test";
import { bob34Tests } from "./bob34.test";
import { bob38Tests } from "./bob38.test";
import { bob39Tests } from "./bob39.test";
import { bob40Tests } from "./bob40.test";
import { bob41Tests } from "./bob41.test";
import { bob25Tests } from "./bob25.test";
import { bob42Tests } from "./bob42.test";
import { bob26Tests } from "./bob26.test";
import { bob50Tests } from "./bob50.test";
import { bob51Tests } from "./bob51.test";
import { emailJujurTests } from "./emailjujur.test";
import { bob27Tests } from "./bob27.test";
import { bob28Tests } from "./bob28.test";
import { bob29Tests } from "./bob29.test";
import { bob43Tests } from "./bob43.test";
import { bob15Tests } from "./bob15.test";
import { m148Tests } from "./m148.test";
import { fu1921Tests } from "./fu1921.test";
import { d101Tests } from "./d101.test";
import { d102Tests } from "./d102.test";
import { c12Tests } from "./c12.test";
import { dr150Tests } from "./dr150.test";
import { dr150bTests } from "./dr150b.test";
import { dr150cTests } from "./dr150c.test";
import { rilis40Tests } from "./rilis40.test";
import { ciwasteTests } from "./ciwaste.test";
import { penutupanTests } from "./penutupan.test";
import { fable22Tests } from "./fable22.test";

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
      const forbidden = ["SUPABASE_SERVICE_ROLE_KEY", "service_role", "CARD_PEPPER", "supabaseService", "deriveCardSecret",
        // BOB-12: the Auth forwarding key is a secret API key (service-role strength)
        "SUPABASE_AUTH_FORWARDING_KEY",
        // BOB-25: PINTAR's SMTP settings, and the mailer itself, are server-only
        "PINTAR_SMTP_HOST", "PINTAR_SMTP_PORT", "PINTAR_SMTP_USER", "PINTAR_SMTP_PASSWORD", "nodemailer"];
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
        // BOB-12 (design condition 1): the Auth forwarding key has one reader,
        // a server-only module, and it is not env.ts (client components import it).
        if (/SUPABASE_AUTH_FORWARDING_KEY/.test(code(text))) {
          c.expect(rel === join("src", "lib", "auth-forwarding.ts"),
            `${rel} names the Auth forwarding key; only src/lib/auth-forwarding.ts may`);
          c.expect(/^\s*import\s+["']server-only["']/m.test(text), `${rel} reads the Auth forwarding key without the server-only guard`);
        }
        // BOB-25 (GATE-0-FACTS §2): the four SMTP variables have one reader, a
        // server-only module under src/app/api/_email/.
        if (/PINTAR_SMTP_/.test(code(text))) {
          c.expect(rel === join("src", "app", "api", "_email", "pengaturan.ts"),
            `${rel} names a PINTAR_SMTP_ variable; only src/app/api/_email/pengaturan.ts may`);
          c.expect(/^\s*import\s+["']server-only["']/m.test(text), `${rel} reads the SMTP settings without the server-only guard`);
        }
        if (/from\s+["']nodemailer["']/.test(text)) {
          c.expect(rel === join("src", "app", "api", "_email", "kirim.ts"), `${rel} imports the mailer; only src/app/api/_email/kirim.ts may`);
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
      // INV-38 counts VERIFIER-FACING URLs. A page is one; the API endpoint
      // behind it is the same surface at a second spelling — it returns the
      // identical five fields for the identical token and is declared against
      // its route in public_surface_registry. Both are asserted at exactly one,
      // so a second page AND a second endpoint each fail. This is a narrowing
      // of what the check counts, made deliberately and stated here: before
      // 0051 it counted any route file matching /verif/i, which would have
      // reported the endpoint as an INV-38 violation.
      const apiVerification = verification.filter((r) => /[\\/]api[\\/]/.test(r));
      const pageVerification = verification.filter((r) => !/[\\/]api[\\/]/.test(r));
      c.expect(
        pageVerification.length === 1,
        `INV-38 requires exactly one verifier-facing verification route; found ${pageVerification.length}: ${pageVerification
          .map((r) => r.replace(repoRoot, ""))
          .join(", ")}`,
      );
      c.expect(
        apiVerification.length === 1,
        `exactly one verification endpoint may exist; found ${apiVerification.length}: ${apiVerification
          .map((r) => r.replace(repoRoot, ""))
          .join(", ")}`,
      );
      // the endpoint is where verification happens, and it is the only place
      if (apiVerification.length === 1) {
        const api = readFileSync(apiVerification[0], "utf8");
        c.expect(
          /verifySignature|verifyWithKey/.test(api),
          "the verification endpoint never recomputes the signature (INV-05)",
        );
        c.expect(
          /certificate_verification_material/.test(api),
          "the verification endpoint never reads the stored signature",
        );
        c.expect(
          /decideValidity/.test(api),
          "the verification endpoint decides validity inline instead of through the shared decision F04-S04 exercises",
        );
        c.expect(
          /@\/lib\/supabase\/service/.test(api),
          "the verification endpoint does not hold the privileged client it needs to read the payload",
        );
      }
      // the page renders; it must not reach the database itself, or there would
      // be two answers to "is this valid" again
      if (pageVerification.length === 1) {
        const page = readFileSync(pageVerification[0], "utf8");
        c.expect(
          !/@\/lib\/supabase\//.test(page),
          "the verification page holds a database client; verification belongs to its endpoint alone",
        );
        c.expect(
          /api\/verifikasi/.test(page),
          "the verification page does not read the endpoint that verifies",
        );
      }
      // and no internal designation on it
      if (pageVerification.length === 1) {
        const src = readFileSync(pageVerification[0], "utf8");
        for (const word of ["PINTAR 4.0", "SYNTHETIC", "OFFICIAL", "PREVIEW", "evidence_class", "engine_version", "scoring_policy"]) {
          c.expect(!src.includes(word), `the verification route names the internal term "${word}"`);
        }
        c.expect(
          !/name_as_issued|photo_path|display_name/.test(src),
          "the verification route reads an identity field; D3b excludes it",
        );
      }
      return c.verdict(
        `exactly one verifier-facing verification route and exactly one endpoint behind it; the endpoint recomputes ` +
          `the signature and holds the privileged client, the page holds neither; no internal designation and no ` +
          `identity field (${routes.length} route file(s) scanned)`,
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
      c.expect(src.includes("timingSafeEqual"), "verification does not use crypto.timingSafeEqual (INV-06)");
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

        // ... and the DECISION the public route relies on, over those same
        // stored rows. `decideValidity` is what the route calls; F04-S01
        // asserts it calls exactly this, and F04-S05 drives the whole handler
        // in CI. This is the locally-runnable half of the same path.
        const { decideValidity, TAMPERED } = await import("../src/lib/certificates/verification");
        const verify = (p: Record<string, unknown>, _v: number, sig: string) => verifyWithKey(p, KEY, sig);
        const projected = {
          pass: true,
          predikat: "Sangat Baik",
          institution: "Bootstrap",
          date: "2026-09-14",
          validity: "BERLAKU",
        };
        const genuine = decideValidity(
          projected,
          { canonical_payload: stored.canonical_payload, signature: stored.signature, key_version: 1 },
          verify,
        );
        c.expect(genuine.validity === "BERLAKU", `a genuine certificate decided "${genuine.validity}"`);
        const forged = decideValidity(
          projected,
          { canonical_payload: tampered, signature: stored.signature, key_version: 1 },
          verify,
        );
        c.expect(
          forged.validity === TAMPERED,
          `a tampered stored payload decided "${forged.validity}" (INV-05)`,
        );
        // a missing signature or key version is never a pass
        for (const broken of [
          { canonical_payload: stored.canonical_payload, signature: null, key_version: 1 },
          { canonical_payload: stored.canonical_payload, signature: stored.signature, key_version: null },
        ]) {
          c.expect(
            decideValidity(projected, broken, verify).validity === TAMPERED,
            "an unsigned certificate decided anything other than invalid",
          );
        }
        // and the decision can only downgrade: a revoked certificate stays revoked
        c.expect(
          decideValidity(
            { ...projected, validity: "DICABUT" },
            { canonical_payload: stored.canonical_payload, signature: stored.signature, key_version: 1 },
            verify,
          ).validity === "DICABUT",
          "a valid signature upgraded a revoked certificate",
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
          "verifies when a separate process reads it back, fails when a stored byte changes, and fails under another " +
          "key; the decision the public route relies on reads BERLAKU for it, TIDAK SAH for a tampered or unsigned " +
          "one, and never upgrades a revoked certificate",
      );
    },
  },
  {
    id: "F04-S05",
    requires: ["db", "network"],
    run: async () => {
      const c = new Checks();
      // THE PATH A STRANGER ACTUALLY USES. F04-S04 proves the crypto round-trips
      // through Postgres; it does not prove the PUBLIC route uses it. Until 0051
      // the public route did not: it reported `validity` from
      // `certificates.status` and never touched `signature`, so altering the
      // stored payload left the page saying BERLAKU. This test drives the real
      // route handler — the same exported GET the HTTP request reaches — against
      // a real certificate, then against a tampered one.
      const KEY = "selftest-certificate-key-v1-at-least-32-chars";
      const dbUrl = process.env.SUPABASE_DB_URL!;
      const psql = (sql: string): string => {
        const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, dbUrl], { encoding: "utf8" });
        if (r.status !== 0) throw new Error(`psql failed: ${(r.stderr || "").slice(0, 300)}`);
        return r.stdout.trim();
      };

      const previousKey = process.env.CERT_SECRET_KEY_V1;
      process.env.CERT_SECRET_KEY_V1 = KEY;
      let certificateId = "";
      try {
        const { signWithKey } = await import("../src/lib/certificates/sign");
        const { GET } = await import("../src/app/api/verifikasi/[token]/route");
        const { TAMPERED } = await import("../src/lib/certificates/verification");

        const prepared = JSON.parse(
          psql("select row_to_json(t) from (select * from selftest.issue_material()) t"),
        ) as { certificate_id: string; canonical_payload: Record<string, unknown>; key_version: number };
        certificateId = prepared.certificate_id;
        const signature = signWithKey(prepared.canonical_payload, KEY);
        psql(`select public.certificate_seal('${certificateId}'::uuid, 1::smallint, '${signature}')`);
        const token = psql(
          `select verification_token from public.certificates where id = '${certificateId}'::uuid`,
        );

        const call = async (t: string) => {
          const res = await GET(new Request(`http://127.0.0.1/api/verifikasi/${t}`), {
            params: Promise.resolve({ token: t }),
          });
          return { status: res.status, body: (await res.json()) as Record<string, unknown> };
        };

        // 1. the genuine certificate verifies through the public path
        const good = await call(token);
        c.expect(good.status === 200, `the public path returned ${good.status} for a genuine certificate`);
        c.expect(good.body.validity === "BERLAKU", `a genuine certificate reported "${good.body.validity}"`);

        // 2. D3b: the response is EXACTLY the five fields, asserted by set
        //    equality on the real response rather than on the SQL signature
        c.expect(
          JSON.stringify(Object.keys(good.body).sort()) ===
            JSON.stringify(["date", "institution", "pass", "predikat", "validity"]),
          `the public response is not the five enumerated fields: ${Object.keys(good.body).join(", ")}`,
        );

        // 3. THE FINDING. Tamper with a protected field in the STORED payload
        //    and the public path must refuse it. The immutability trigger is
        //    disabled for the write, which is the point: this simulates exactly
        //    the compromise the signature exists to detect.
        psql(
          `alter table public.certificates disable trigger certificates_write;
           update public.certificates
              set canonical_payload = jsonb_set(canonical_payload, '{result,passed}', 'true'::jsonb)
                                      || jsonb_build_object('certificate_number', 'PINTAR/FORGED/2026/99999')
            where id = '${certificateId}'::uuid;
           alter table public.certificates enable trigger certificates_write;`,
        );
        const tampered = await call(token);
        c.expect(
          tampered.body.validity === TAMPERED,
          `a tampered stored payload reported "${tampered.body.validity}" through the public path (INV-05)`,
        );
        c.expect(
          JSON.stringify(Object.keys(tampered.body).sort()) ===
            JSON.stringify(["date", "institution", "pass", "predikat", "validity"]),
          "the refusal response leaks a field the success response does not",
        );

        // 4. no existence oracle: unknown, malformed and unissued are identical
        const unknown = await call("z".repeat(43));
        const malformed = await call("short");
        c.expect(unknown.status === 404, `an unknown token returned ${unknown.status}`);
        c.expect(
          malformed.status === unknown.status &&
            JSON.stringify(malformed.body) === JSON.stringify(unknown.body),
          "a malformed token is distinguishable from an unknown one",
        );
        psql("select selftest.purge_certificates()");
        const prepared2 = JSON.parse(
          psql("select row_to_json(t) from (select * from selftest.issue_material()) t"),
        ) as { certificate_id: string };
        certificateId = prepared2.certificate_id;
        const unissuedToken = psql(
          `select verification_token from public.certificates where id = '${certificateId}'::uuid`,
        );
        const unissued = await call(unissuedToken);
        c.expect(
          unissued.status === unknown.status &&
            JSON.stringify(unissued.body) === JSON.stringify(unknown.body),
          "a prepared-but-unissued certificate is distinguishable from an unknown token",
        );
      } finally {
        if (previousKey === undefined) delete process.env.CERT_SECRET_KEY_V1;
        else process.env.CERT_SECRET_KEY_V1 = previousKey;
        try {
          psql("select selftest.purge_certificates()");
        } catch {
          /* run_fable04 purges again */
        }
      }
      return c.verdict(
        "the public verification path recomputes the HMAC: a genuine certificate reads BERLAKU, a tampered stored " +
          "payload reads TIDAK SAH, the response is exactly the five D3b fields in both cases, and unknown, " +
          "malformed and unissued tokens are indistinguishable",
      );
    },
  },
  {
    id: "F05-S01",
    requires: [],
    run: async ({ repoRoot }) => {
      // INV-37: server authorization covers every route added in Phases 3-5.
      // The proxy is deny-by-default -- its matcher is everything, and anything
      // not in the public list needs a session -- so the thing worth asserting
      // is not "is /studio listed" but "did the PUBLIC list grow". A route added
      // without touching src/proxy.ts is covered; a route added by widening the
      // public list is the regression this catches.
      const c = new Checks();
      const proxy = readFileSync(join(repoRoot, "src", "proxy.ts"), "utf8");
      const paths = [...proxy.matchAll(/PUBLIC_PATHS = new Set\(\[([^\]]*)\]/g)]
        .flatMap((m) => [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]));
      const prefixes = [...proxy.matchAll(/PUBLIC_PREFIXES = \[([^\]]*)\]/g)]
        .flatMap((m) => [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]));
      // RESTATED FOR BOB-26 (Gate 3, a changed requirement): activation starts
      // signed out, so /aktifkan and its two POST-only doors are anonymous, and
      // so is the password sign-in's door. Each door is declared in
      // public_surface_registry with its rewrite target as its child (the card
      // route's shape), which the registry check below also asks; nothing else
      // joined the list.
      // RESTATED FOR BOB-27 (Gate 4, a changed requirement): «Lupa password?» starts signed out too, at /masuk/lupa
      // and its three POST-only doors, each declared with its handler as Gate 3's are.
      // RESTATED FOR BOB-28 (Gate 5, a changed requirement): its fourth door, recovery by PINTAR ID + PIN, declared the same way.
      const expectedPaths = ["/", "/masuk", "/masuk/kartu", "/masuk/password", "/aktifkan", "/aktifkan/kode",
                             "/aktifkan/periksa", "/masuk/lupa", "/masuk/lupa/kode", "/masuk/lupa/periksa",
                             "/masuk/lupa/password", "/masuk/lupa/pin", "/auth/callback", "/keluar"];
      c.expect(
        JSON.stringify(paths.slice().sort()) === JSON.stringify(expectedPaths.slice().sort()),
        `the anonymous path list changed: ${JSON.stringify(paths)}`,
      );
      // Two prefixes, ONE surface (INV-38): the verification page and the data
      // endpoint it fetches anonymously, registered as its child in
      // public_surface_registry. The endpoint was missing, so every QR scan read
      // "not found"; F01-R07 proves both against the running middleware.
      // RESTATED FOR BOB-28 (IDENTITY-4.0 §5): "/id/", the page a PINTAR card's QR opens; it reads nothing and is its own
      // surface in public_surface_registry (identity_page).
      c.expect(
        JSON.stringify(prefixes) === JSON.stringify(["/verifikasi/", "/api/verifikasi/", "/id/"]),
        `the anonymous prefix list changed: ${JSON.stringify(prefixes)}`,
      );
      c.expect(/matcher: \["\/\(\(\?!/.test(proxy), "the proxy matcher is no longer catch-all");

      // and every Studio route really is behind it
      const appDir = join(repoRoot, "src", "app");
      const routes = walk(appDir)
        .filter((f) => /(page|route)\.tsx?$/.test(f))
        .map((f) => "/" + relative(appDir, f).replace(/[\\/](page|route)\.tsx?$/, "").replace(/\\/g, "/"))
        .map((r) => (r === "/" ? "/" : r.replace(/\/\(.*?\)/g, "")));
      const studio = routes.filter((r) => r.startsWith("/studio"));
      c.expect(studio.length >= 8, `only ${studio.length} Studio route(s) found`);
      for (const r of studio) {
        c.expect(
          !paths.includes(r) && !prefixes.some((p) => r.startsWith(p)),
          `${r} is reachable without a session`,
        );
      }
      // BOB-26: every POST door on the list is a declared surface, with the
      // handler it is rewritten to as its child, in the migrations themselves.
      const migTeks = readdirSync(join(repoRoot, "supabase", "migrations")).filter((f) => f.endsWith(".sql"))
        .map((f) => readFileSync(join(repoRoot, "supabase", "migrations", f), "utf8")).join("\n");
      for (const pintu of ["/masuk/kartu", "/masuk/password", "/aktifkan/kode", "/aktifkan/periksa",
                           "/masuk/lupa/kode", "/masuk/lupa/periksa", "/masuk/lupa/password", "/masuk/lupa/pin"]) {
        c.expect(new RegExp(`'ROUTE',\\s*'${pintu}'`).test(migTeks) && new RegExp(`'ENDPOINT',\\s*'/api${pintu}'`).test(migTeks),
          `${pintu} is anonymous but not declared in public_surface_registry with /api${pintu} as its child`);
      }
      c.note(`${routes.length} routes, ${studio.length} in Studio, ${paths.length + prefixes.length} anonymous`);
      c.expect(/'ROUTE',\s*'\/id\/\[pintarId\]'/.test(migTeks), "/id/ is anonymous but not declared in public_surface_registry");
      return c.verdict("the anonymous surface did not grow beyond its declared doors (Gate 3's three, Gate 4's three and Gate 5's one, each registered with its handler, and the declared ID page) and every Studio route sits behind the proxy");
    },
  },
  {
    id: "F05-S02",
    requires: [],
    run: async ({ repoRoot }) => {
      // The Studio-specific half of doc 16 §5's named-pattern sweep: no
      // privileged client outside the API boundary, no client-side storage
      // upload (INV-15), no provider concept in the schema or the code
      // (INV-32), and no fabricated empirical value anywhere.
      const c = new Checks();
      const studioDir = join(repoRoot, "src", "app", "studio");
      c.expect(existsSync(studioDir), "src/app/studio is missing");
      const files = walk(studioDir).filter((f) => /\.tsx?$/.test(f));
      c.expect(files.length > 0, "the Studio has no source files");
      for (const f of files) {
        const rel = relative(repoRoot, f);
        const text = readFileSync(f, "utf8");
        c.expect(!/@\/lib\/supabase\/service/.test(text), `${rel} imports the service-role client`);
        c.expect(!/SUPABASE_SERVICE_ROLE_KEY|CARD_PEPPER|CERT_SECRET_KEY/.test(code(text)),
          `${rel} names a platform secret`);
        c.expect(!/\.storage\s*\.\s*from\([^)]*\)\s*\.\s*upload\(/.test(code(text)),
          `${rel} calls a client-side storage upload (INV-15)`);
        c.expect(!/empirical_(difficulty|discrimination|evidence_count)\s*[:=]/.test(code(text)),
          `${rel} writes an empirical value`);
      }
      // INV-32: no provider's concepts in the schema or in Studio code
      // NO word boundaries. `\bopenai\b` does not match `openai_calls`, because
      // `_` is a word character -- so a provider-named TABLE, the exact thing
      // INV-32 forbids, slipped past the first version of this check. The
      // database's own INV-32 lint has always matched without boundaries; this
      // now says the same thing.
      const PROVIDERS = /(openai|anthropic|gemini|notebooklm|claude|gpt-?[0-9]|vertex|bedrock)/i;
      const sql = walk(join(repoRoot, "supabase", "migrations")).filter((f) => f.endsWith(".sql"));
      for (const f of sql) {
        const rel = relative(repoRoot, f);
        const ddl = sqlCode(readFileSync(f, "utf8"));
        const m = PROVIDERS.exec(ddl);
        c.expect(m === null, `${rel} names a provider in schema DDL: ${m?.[0]}`);
      }
      for (const f of files) {
        const m = PROVIDERS.exec(code(readFileSync(f, "utf8")));
        c.expect(m === null, `${relative(repoRoot, f)} names a provider: ${m?.[0]}`);
      }
      c.note(`${files.length} Studio files, ${sql.length} migrations scanned`);
      return c.verdict("no privileged client, no anonymous upload, no provider concept and no fabricated empirical value in Studio");
    },
  },
  {
    id: "F05-S03",
    requires: [],
    run: async ({ repoRoot }) => {
      // §12, the calm surface, and the staff-only HLE declaration.
      //
      // The declaration that `studio.*` and `config.*` keys are staff-only is
      // only honest if no learner-facing surface ever renders one. That is the
      // half renderAll() stops checking, so it is checked here instead.
      const c = new Checks();
      const appDir = join(repoRoot, "src", "app");
      const learnerDirs = ["belajar", "verifikasi", "masuk"].map((d) => join(appDir, d)).filter(existsSync);
      for (const d of learnerDirs) {
        for (const f of walk(d).filter((x) => /\.tsx?$/.test(x))) {
          const text = code(readFileSync(f, "utf8"));
          const m = /["'`](studio|config)\.[a-zA-Z0-9_.]+["'`]/.exec(text);
          c.expect(m === null, `${relative(repoRoot, f)} renders a staff-only copy key: ${m?.[0]}`);
        }
      }
      // and no lifecycle enum or version string is rendered as Studio copy
      const ENUMS = /\b(INGESTED|STRUCTURED|VALIDATED|VALIDATION_FAILED|IN_REVIEW|APPROVED|FROZEN|PUBLISHED|SUPERSEDED)\b/;
      const hle = readFileSync(join(repoRoot, "src", "lib", "hle.ts"), "utf8");
      const studioCopy = [...hle.matchAll(/"studio\.[^"]+":\s*\{[^}]*default:\s*"([^"]*)"/g)].map((m) => m[1]);
      c.expect(studioCopy.length > 40, `only ${studioCopy.length} Studio copy strings found`);
      for (const line of studioCopy) {
        c.expect(!ENUMS.test(line), `Studio copy shows a lifecycle enum: ${line}`);
        c.expect(!/[0-9]+\.[0-9]+\.[0-9]+/.test(line), `Studio copy shows a version string: ${line}`);
        c.expect(!/evidence_class|SYNTHETIC|PUBLIC_DEMO/.test(line), `Studio copy shows an evidence class: ${line}`);
      }
      c.note(`${studioCopy.length} Studio copy strings, ${learnerDirs.length} learner surfaces scanned`);
      return c.verdict("no learner surface renders a staff-only key, and no Studio copy shows a lifecycle enum, version string or evidence class");
    },
  },
  {
    id: "QAC-S01",
    requires: [],
    run: async ({ repoRoot }) => {
      // ADR-0018 §5, RESTATED FOR D-127 Q4 (CR-84, a changed requirement): there is one human Uji Cepat journey, the
      // class's own (D-085 T2: choose → select → review → launch). Studio's own launcher has left the human UI; the
      // launch function and its automated proofs stay. What ADR-0018 §5 asked of the surface now holds of that one: it
      // offers authorized canonical chapters through the named accessors, and its copy names no tenant kind or
      // distribution status AS SUCH.
      const c = new Checks();
      const baca = (...p: string[]) => { try { return readFileSync(join(repoRoot, ...p), "utf8"); } catch { return ""; } };
      c.expect(!existsSync(join(repoRoot, "src", "app", "studio", "kuis")), "Studio's own Uji Cepat launcher is still a page");
      c.expect(!/\/studio\/kuis/.test(baca("src", "app", "studio", "layout.tsx")), "Studio still offers its own Uji Cepat tab");
      c.expect(!/rpc\("launch_quick_assessment"/.test(baca("src", "app", "studio", "actions.ts")), "a Studio action still launches an Uji Cepat");

      // the launch function stays, and the class's journey reaches it
      const dir = join(repoRoot, "supabase", "migrations");
      const mig = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
      const terakhir = (pola: RegExp) => mig.filter((f) => pola.test(readFileSync(join(dir, f), "utf8"))).pop() ?? "";
      c.expect(terakhir(/create (?:or replace )?function public\.launch_quick_assessment\(/i) !== "", "launch_quick_assessment is gone");
      const pilih = terakhir(/create (?:or replace )?function public\.launch_selected_quick_assessment\(/i);
      c.expect(pilih !== "" && /public\.launch_quick_assessment\(/.test(readFileSync(join(dir, pilih), "utf8")),
        "the class's Uji Cepat does not launch through launch_quick_assessment");
      const aksiKelas = baca("src", "app", "mengajar", "actions.ts");
      c.expect(/rpc\("launch_selected_quick_assessment"/.test(aksiKelas), "the class's Uji Cepat is not launched from its own page");

      // the class's page offers the authorized chapters through the named accessors, never another tenant's tables
      const pengajar = baca("src", "lib", "pengajar.ts");
      const halaman = baca("src", "app", "mengajar", "[kelas]", "uji-cepat", "page.tsx");
      c.expect(/rpc\("distributed_releases"\)/.test(pengajar) && /rpc\("distributed_release_outline"/.test(pengajar),
        "the canonical chapters are not read through the named accessors");
      c.expect(/rpc\("quick_assessment_choices"/.test(pengajar), "the chapter's questions are not read through their own accessor");
      c.expect(!/@\/lib\/supabase\/service/.test(halaman), "the surface holds a privileged client");

      // and no internal vocabulary in the copy the class's Uji Cepat renders
      const hle = baca("src", "lib", "hle.ts");
      const salinan = [...hle.matchAll(/"mengajar\.cepat\.[^"]*":\s*\{[^}]*default:\s*"([^"]*)"/g)].map((m) => m[1]);
      c.expect(salinan.length >= 10, `only ${salinan.length} Uji Cepat copy strings found`);
      const INTERNAL = /(PLATFORM_CANONICAL|INSTITUTION\b|tenant|ACTIVE|WITHDRAWN|distribusi|distribution|is_ad_hoc|ad.hoc|release|plp_)/i;
      for (const line of salinan) {
        const m = INTERNAL.exec(line);
        c.expect(m === null, `Uji Cepat copy names an internal concept: "${line}" (${m?.[0]})`);
      }
      c.note(`${salinan.length} copy strings of the class's Uji Cepat`);
      return c.verdict("Studio's own Uji Cepat launcher has left the human UI (no page, tab or action) and launch_quick_assessment stays; "
        + "the class's Uji Cepat, the one human journey, launches through launch_selected_quick_assessment, which calls it; its page "
        + "offers authorized canonical chapters through the named accessors and names no tenant kind, distribution status or "
        + "internal flag in its copy (D-127 Q4, ADR-0018 §5)");
    },
  },
  {
    id: "EVAL-S01",
    requires: [],
    run: async ({ repoRoot }) => {
      // NEGATIVE 7's NAMED TEST (Task 2 §9, gate-blocker addendum §4).
      //
      // The expiry control lives in the persona's ACCESS TOKEN, not in the
      // database: at the token's `exp` the platform rejects the JWT before any
      // PINTAR code runs, so every authenticated path refuses -- for all five
      // personas, including the learner, whom no database-side lever could
      // bound (0069 measured every one of them).
      //
      // That makes four properties of THIS FILE load-bearing, and the failure
      // of any one of them silent: the facility keeps working and the boundary
      // is simply gone. So they are pinned here, in the source, rather than
      // trusted.
      const c = new Checks();
      const lib = join(repoRoot, "src", "lib", "evaluation.ts");
      const route = join(repoRoot, "src", "app", "api", "evaluation", "assume", "route.ts");
      c.expect(existsSync(lib), "src/lib/evaluation.ts is missing");
      c.expect(existsSync(route), "the persona assumption route is missing");
      if (!existsSync(lib) || !existsSync(route)) return c.verdict("unreachable");
      const strip = (text: string) =>
        text
          .split("\n")
          .filter((l) => !l.trim().startsWith("*") && !l.trim().startsWith("//") && !l.trim().startsWith("/*"))
          .join("\n");
      const src = strip(readFileSync(lib, "utf8"));
      // The minting half lives in the API route, because F01-S03 permits the
      // service-role client only under src/app/api/ and that rule is older than
      // this feature.
      const mint = strip(readFileSync(route, "utf8"));
      const both = `${src}\n${mint}`;

      // (1) THE COUPLING. The expiry passed to the database is read out of the
      //     token this server just minted -- not chosen, not offset, not capped.
      //     Matched as syntax rather than as intent (L4).
      c.expect(/accessTokenExpiry\s*\(/.test(mint),
        "the persona token's exp is never decoded: the recorded expiry is not the token's");
      c.expect(/p_token_expires_at:\s*expiresAt\.toISOString\(\)/.test(mint),
        "assume_persona is not passed the minted token's own expiry");
      c.expect(!/\bMath\.min\b/.test(both) && !/\bleast\b/.test(both),
        "the expiry is capped: a session shorter than its token leaves the token usable");
      c.expect(!/expiresAt\s*=\s*new Date\(Date\.now\(\)/.test(both),
        "the expiry is computed from the clock rather than read from the token");
      c.expect(/exp\b/.test(src) && /base64url/.test(src),
        "accessTokenExpiry does not decode the token's exp claim");

      // (2) NO RENEWAL. No refresh material is persisted, returned or usable.
      c.expect(/persistSession:\s*false/.test(mint) && /autoRefreshToken:\s*false/.test(mint),
        "the client that mints a persona session can persist or renew it");
      c.expect(/refresh_token:\s*""/.test(src),
        "the persona session cookie does not explicitly withhold refresh material");
      c.expect(!/refresh_token:\s*[^"]/.test(both.replace(/refresh_token:\s*""/g, "")),
        "a refresh token is written into the persona session");
      c.expect(!/\.refresh_token/.test(both),
        "the minted session's refresh token is read out; it must never leave the mint call");
      c.expect(!/refreshSession|setSession/.test(both),
        "a persona session is renewed or re-established outside the assume flow");

      // (3) NO INDEPENDENT CREDENTIAL. Nothing signs a persona in with a secret,
      //     and nothing derives one. assert_evaluation_boundary measures the
      //     database side; this is the code side.
      c.expect(!/signInWithPassword/.test(both),
        "a persona is signed in with a password: it could be used independently");
      c.expect(!/pepper|derivePersonaSecret/i.test(both),
        "a persona credential is derived here; a derived password is still a password");
      const seed = join(repoRoot, "supabase", "seed", "human_evaluation.sql");
      if (existsSync(seed)) {
        const seedLines = readFileSync(seed, "utf8").split("\n");
        c.expect(!seedLines.some((l) => /crypt\(/.test(l) && /peraga-/.test(l)),
          "the seed gives a persona account a password");
        // Comment lines stripped first. The unscoped version of this check
        // matched the seed's own paragraph explaining why the pepper was
        // REMOVED -- the same prose-matching defect L4 exists to stop, in the
        // test written to enforce it.
        const seedCode = seedLines.filter((l) => !l.trim().startsWith("--")).join("\n");
        c.expect(!/pepper/i.test(seedCode),
          "the seed still derives persona credentials from a pepper");
      }

      // (4) THE BOUNDARY. The cookie carrying the token dies with the token, so
      //     the session cannot outlive it even if the JWT were still accepted.
      c.expect(/expires:\s*expiresAt/.test(src),
        "the persona session cookie outlives the token it carries");

      // and the exit is server-side, not a cookie clear
      c.expect(/rpc\("exit_persona"\)/.test(src),
        "exiting a persona does not end the session server-side");
      const keluar = join(repoRoot, "src", "app", "keluar", "route.ts");
      c.expect(existsSync(keluar) && /exit_persona/.test(readFileSync(keluar, "utf8")),
        "signing out does not end a live evaluation session");

      // and no evaluation logic reached an authorization predicate on the app
      // side either: the Hub asks the database, it never decides
      const hub = join(repoRoot, "src", "app", "evaluasi", "page.tsx");
      if (existsSync(hub)) {
        c.expect(!/displayRole|is_system_admin/.test(readFileSync(hub, "utf8")),
          "the Hub decides access from a display role instead of asking the database");
      }

      return c.verdict(
        "the persona session's recorded expiry is bound to a value asserted by the trusted server under " +
        "the service-role trust boundary, read from the token it minted; no refresh material is persisted, " +
        "returned or usable; no persona holds an independently usable credential; and the session cookie " +
        "expires with the token",
      );
    },
  },
  {
    id: "EVAL-S02",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      // CERTIFICATE ISSUANCE ON THE DEMONSTRATION JOURNEY, end to end, through
      // the ordinary server-held key.
      //
      // The seed deliberately stops at ELIGIBLE: sealing needs a signature over
      // the payload computed with CERT_SECRET_KEY_V1, and putting an
      // application secret into seed machinery to pre-bake a certificate would
      // be exactly the special-casing the task forbids. So the seed's stopping
      // point is proved sufficient HERE, by finishing the journey the way the
      // application finishes it.
      const c = new Checks();
      const KEY = "selftest-certificate-key-v1-at-least-32-chars";
      const dbUrl = process.env.SUPABASE_DB_URL!;
      const psql = (sql: string): string => {
        const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, dbUrl], { encoding: "utf8" });
        if (r.status !== 0) throw new Error(`psql failed: ${(r.stderr || "").slice(0, 300)}`);
        return r.stdout.trim();
      };

      // (1) THE ROUTE CHECKS ITS OWN CALLER, and does so with the CALLER'S
      //     client before the service one is constructed. Asserted on ordering
      //     in the source, because "it calls session_is_mine" is satisfied by a
      //     call made after the privileged work has already happened.
      const routePath = join(repoRoot, "src", "app", "api", "certificates", "issue", "route.ts");
      c.expect(existsSync(routePath), "the certificate issuance route is missing");
      if (existsSync(routePath)) {
        const route = readFileSync(routePath, "utf8");
        const mineAt = route.indexOf("session_is_mine");
        const serviceAt = route.indexOf("supabaseService()");
        c.expect(mineAt > -1, "the issuance route does not check session_is_mine");
        c.expect(serviceAt > -1 && mineAt > -1 && mineAt < serviceAt,
          "the issuance route reaches the service client before checking the caller owns the session");
        c.expect(/supabaseServer\(\)[\s\S]{0,400}session_is_mine/.test(route),
          "session_is_mine is not asked under the caller's own client");
        // and during evaluation this is what stops any persona -- the learner
        // included -- issuing somebody else's certificate
        c.expect(/mine\s*!==\s*true/.test(route),
          "the issuance route does not refuse when the caller does not own the session");
      }

      // (2) NO CERTIFICATE SECRET IN SEED MACHINERY.
      const seedDir = join(repoRoot, "supabase", "seed");
      for (const f of readdirSync(seedDir).filter((f) => f.endsWith(".sql"))) {
        // Comment lines stripped first. The unscoped version matched the human
        // evaluation seed's own paragraph explaining why no signing secret may
        // enter seed machinery -- the sixth prose-match in this build, and the
        // second in a check written to enforce the rule against it (L4).
        const text = readFileSync(join(seedDir, f), "utf8")
          .split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
        c.expect(!/CERT_SECRET_KEY|certificate_seal|signWithKey/.test(text),
          `supabase/seed/${f} reaches for a certificate signing secret or seals a certificate`);
      }

      // (3) THE JOURNEY FINISHES. The demonstration learner's own FINALIZED,
      //     OFFICIAL, ELIGIBLE session is carried to a sealed certificate with
      //     the ordinary keyring, and that certificate verifies through the one
      //     public route a stranger uses.
      // Driven through the KEYRING rather than over HTTP. The public route
      // fetches its material through the Supabase API, which needs a running
      // stack; F04-S05 already drives that transport in CI. What is unproven
      // until here is that the DEMONSTRATION journey's own evidence reaches a
      // certificate that verifies with the ordinary server-held key -- and that
      // is a property of the payload, the key and the projection, not of HTTP.
      // Proving it this way keeps the test at `requires: ["db"]` rather than
      // adding a ninth local-only skip to carry a transport already covered.
      const previousKey = process.env.CERT_SECRET_KEY_V1;
      process.env.CERT_SECRET_KEY_V1 = KEY;
      try {
        const { signWithKey } = await import("../src/lib/certificates/sign");
        const { verifySignature } = await import("../src/lib/certificates/keyring");
        const prepared = JSON.parse(
          psql("select row_to_json(t) from (select * from selftest.eval_issue_material()) t"),
        ) as { certificate_id: string; canonical_payload: Record<string, unknown>; session_id: string };
        c.expect(Boolean(prepared.certificate_id),
          "no certificate was prepared for the demonstration journey");

        // sign with the ordinary keyring, exactly as the issuance route does
        const signature = signWithKey(prepared.canonical_payload, KEY);
        psql(`select public.certificate_seal('${prepared.certificate_id}'::uuid, 1::smallint, '${signature}')`);

        // read the SEALED material back out of Postgres and recompute, which is
        // what the public route does after it fetches
        const material = JSON.parse(
          psql(`select row_to_json(t) from (select canonical_payload, signature, key_version
                  from public.certificates where id = '${prepared.certificate_id}'::uuid) t`),
        ) as { canonical_payload: Record<string, unknown>; signature: string; key_version: number };
        c.expect(verifySignature(material.canonical_payload as never, material.key_version, material.signature),
          "the demonstration certificate does not verify with the ordinary server-held key");

        // and the public projection is unchanged by evaluation: exactly the
        // five D3b fields, naming nothing about the demonstration facility
        const projected = JSON.parse(
          psql(`select row_to_json(t) from (select * from public.verify_certificate(
                  (select verification_token from public.certificates
                    where id = '${prepared.certificate_id}'::uuid))) t`),
        ) as Record<string, unknown>;
        c.expect(
          JSON.stringify(Object.keys(projected).sort()) ===
            JSON.stringify(["date", "institution", "pass", "predikat", "validity"]),
          `the public projection is not the five enumerated fields: ${Object.keys(projected).join(", ")}`,
        );
        c.expect(projected.validity === "BERLAKU",
          `the demonstration certificate projects "${String(projected.validity)}"`);
        // INTERNAL designations only. The school's own display name says it is
        // a demonstration school, and that is correct rather than a leak: a
        // stranger verifying a demonstration certificate should be able to see
        // that is what it is. What must never appear is a lifecycle enum, the
        // evidence purpose, a persona label or an evaluation actor.
        c.expect(!/HUMAN_EVALUATION|official_evidence_purpose|evaluation_actor|evaluation_session/i
          .test(JSON.stringify(projected)),
          "the public certificate projection names an internal evaluation designation");

        // TAMPERING STILL BREAKS IT, so the verification above is not vacuous
        c.expect(!verifySignature(
          { ...(material.canonical_payload as Record<string, unknown>), issued_at: "1999-01-01T00:00:00Z" } as never,
          material.key_version, material.signature),
          "a tampered demonstration payload still verifies: the check proves nothing");

        c.note(`predikat ${String(projected.predikat)}`);
      } finally {
        if (previousKey === undefined) delete process.env.CERT_SECRET_KEY_V1;
        else process.env.CERT_SECRET_KEY_V1 = previousKey;
      }

      return c.verdict(
        "the demonstration learner's genuine OFFICIAL evidence reaches a sealed certificate through the " +
        "ordinary server-held key, verifies on recomputation and stops verifying when tampered with, and " +
        "projects exactly the five public fields naming nothing about the facility; the issuance route " +
        "checks the caller owns the session with the caller's own client BEFORE the service client is " +
        "reached; and no seed file reaches for a signing secret",
      );
    },
  },
  {
    // THE MANIFEST'S OWN METADATA, HELD TO L5.
    //
    // FABLE-05's completion report was careful: it marked the staff-only HLE
    // declaration "reading -- flagged" and pointed at F05-S03 for the rest. The
    // OVERCLAIM WAS IN THE MANIFEST -- F05-S03's `proves` read "no Studio copy
    // shows a lifecycle enum", a property of the SURFACE, asserted by a test of
    // the COPY TABLE. The prose was honest and the machine-readable record was
    // not, which is the inverse of the usual failure and worse, because the
    // manifest is what a gate reads.
    //
    // A `proves` string is unasserted prose living inside a machine-checked
    // artefact. Nothing can validate prose against a predicate, so this does
    // the cheap half: EVERY STATIC OR APP TEST NAMES THE ARTEFACT IT INSPECTS
    // -- the copy table, rendered output, the migration text, the source, the
    // live schema. F05-S03's then reads "the copy table contains no lifecycle
    // enum", which is true and VISIBLY NARROWER than the property anyone wants.
    // Scope becomes comparable by eye even where the claim cannot be checked.
    //
    // Scoped to static and app deliberately. A db test's artefact is the live
    // database and is never ambiguous; source-versus-output-versus-copy-table
    // is where the confusion actually lives, and a rule applied where it does
    // not bite is the box-ticking this was meant to avoid.
    //
    // WHAT THIS CHECK DOES NOT COVER, stated because the exemption above is an
    // unmeasured universal over 91 db strings and would otherwise be read as
    // more than it is:
    //
    //   * It covers ARTEFACT IDENTIFICATION, across static and app tests only.
    //   * It does NOT cover VERB ACCURACY, anywhere. That dimension is
    //     orthogonal and lives just as comfortably in a db test: "proves X is
    //     impossible", backed by a check that a constraint merely EXISTS, is
    //     the same overclaim wearing a different noun. Verb accuracy was found
    //     by hand on eleven strings -- F04-S02 and F04-S03 said "inspects" for
    //     something that EXECUTES -- and the db set was NOT audited for it.
    //
    // So this is a bounded pass, not "the manifest's prose has been validated".
    // Writing that sentence in the capstone would be the next instance of the
    // thing this check exists to stop.
    id: "F06-S04",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const manifest = JSON.parse(
        readFileSync(join(repoRoot, "selftest", "manifest.json"), "utf8")
      ) as { tests: Array<{ id: string; runner: string; proves?: string }> };

      const ARTEFACTS = [
        "copy table", "rendered", "output", "migration", "schema", "audit log", "source",
        "catalogue", "manifest", "route", "bundle", "html", "file", "prosrc", "registry",
        "lint", "git", "workflow", "import graph", "build", "keyring", "document",
        "environment", "executes", "document text",
      ];
      const scoped = manifest.tests.filter((t) => t.runner === "static" || t.runner === "app");
      c.expect(scoped.length > 20, `only ${scoped.length} static/app test(s) to check`);

      const silent = scoped.filter(
        (t) => !ARTEFACTS.some((a) => (t.proves ?? "").toLowerCase().includes(a))
      );
      c.expect(
        silent.length === 0,
        "static/app test(s) whose `proves` does not name the artefact it inspects. A claim about a " +
          "surface, asserted by a test of a copy table, reads true at a gate and is not:\n  " +
          silent.map((t) => `${t.id}: ${(t.proves ?? "").slice(0, 70)}`).join("\n  ")
      );
      return c.verdict(
        `${scoped.length} static/app test(s), each naming the artefact its predicate inspects, so a ` +
          `gate reading the manifest can see the scope of a claim without reading the test`
      );
    },
  },
  {
    // §7 ITEM 8, MADE MECHANICAL: "every checklist item from Phases 1-5 is in
    // the manifest. If any was verified by hand and never added, add it now
    // rather than re-verifying by hand. This is the last chance to make the
    // manifest the whole truth."
    //
    // The measurement that produced this test found two of thirty-eight
    // declared invariants that no manifest `proves` string named: INV-34, which
    // had no test at all and now has F06-N03, and INV-06, which was tested all
    // along inside F04-S02 and labelled INV-05 in both the assertion message
    // and the manifest. A gate reading the manifest would have reported INV-06
    // unverified and INV-05 verified twice -- the same class of error F06-S04
    // catches in the other direction.
    //
    // THE INVARIANT LIST IS DERIVED FROM DOC 03, not written here. A new
    // invariant added to the frozen document joins this check the day it is
    // written, and immediately fails until a test names it.
    //
    // BOUNDED, AND THE BOUND IS THE WHOLE POINT: this proves every invariant is
    // NAMED by a test, not that the test is ADEQUATE. Doc 03's own prescribed
    // test for INV-06 has two halves -- the comparison function used, and a
    // behavioural test that near-miss hashes fail identically fast -- and only
    // the first is implemented. INV-35 and INV-22 are named and carried in the
    // capstone as inadequately covered. Naming is the floor, not the ceiling.
    id: "F06-S05",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const doc = join(repoRoot, "docs", "rebuild", "03-PINTAR-INVARIANTS.md");
      c.expect(existsSync(doc), "docs/rebuild/03-PINTAR-INVARIANTS.md is missing");
      const declared = [
        ...new Set((readFileSync(doc, "utf8").match(/INV-\d+/g) ?? [])),
      ].sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)));
      c.expect(declared.length > 30, `only ${declared.length} invariant(s) derived from doc 03`);

      const manifest = JSON.parse(
        readFileSync(join(repoRoot, "selftest", "manifest.json"), "utf8")
      ) as { tests: Array<{ id: string; proves?: string }> };
      const named = new Map<string, string[]>();
      for (const t of manifest.tests) {
        // THIS TEST'S OWN ENTRY IS EXCLUDED, and the exclusion is the difference
        // between a check and a mirror. F06-S05's `proves` names INV-06, INV-22
        // and INV-35 to state what it does NOT cover -- which, counted, would
        // make it the citer that satisfies its own requirement for those three.
        // An invariant nobody tests could then be "covered" by writing its name
        // into this sentence.
        if (t.id === "F06-S05") continue;
        for (const inv of new Set((t.proves ?? "").match(/INV-\d+/g) ?? [])) {
          named.set(inv, [...(named.get(inv) ?? []), t.id]);
        }
      }
      const orphans = declared.filter((i) => !named.has(i));
      c.expect(
        orphans.length === 0,
        "invariant(s) declared in doc 03 that no manifest test names. Verified by hand is not " +
          "verified: a gate reads the manifest:\n  " + orphans.join(", ")
      );
      // and the other direction: a manifest test naming an invariant the frozen
      // document does not declare is a claim about something that is not a rule
      const invented = [...named.keys()].filter((i) => !declared.includes(i)).sort();
      c.expect(
        invented.length === 0,
        "manifest test(s) claiming invariant(s) doc 03 does not declare: " +
          invented.map((i) => `${i} (${named.get(i)!.join(", ")})`).join("; ")
      );
      const total = declared.reduce((n, i) => n + (named.get(i)?.length ?? 0), 0);
      return c.verdict(
        `all ${declared.length} invariants declared in the document docs/rebuild/03-PINTAR-INVARIANTS.md ` +
          `are named by at least one of the ${total} OTHER manifest entries that cite one -- this test's ` +
          `own entry is excluded, so naming an invariant here cannot cover it -- and no manifest ` +
          `entry cites an invariant the document does not declare. BOUNDED: this reads the manifest's ` +
          `own text and proves NAMING, not adequacy -- INV-06's behavioural half, INV-22 and INV-35 are ` +
          `named and carried as inadequately covered`
      );
    },
  },
  {
    // §7 ITEM 3: "every dev-only tool gated behind NODE_ENV==='development',
    // verified against a production build." F01-R01 does the verifying, by
    // fetching four /api/dev/* paths from a real production build and
    // requiring 404. This is the half F01-R01 cannot have: the paths it fetches
    // are WRITTEN DOWN, so a dev tool added tomorrow in a new file under the
    // namespace would be gated by nobody and fetched by nobody.
    //
    // THE FILE SET IS DERIVED from src/app/api/dev, and every exported HTTP
    // handler in each file must carry the gate in its own body -- not merely
    // somewhere in the file, which is how a second handler added below a gated
    // one escapes. A namespace with no route files at all fails rather than
    // passing vacuously.
    id: "F06-S06",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const devDir = join(repoRoot, "src", "app", "api", "dev");
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const e of readdirSync(dir, { withFileTypes: true })) {
          const p = join(dir, e.name);
          if (e.isDirectory()) walk(p);
          else if (/^route\.tsx?$/.test(e.name)) files.push(p);
        }
      };
      c.expect(existsSync(devDir), "src/app/api/dev does not exist; the dev namespace check has no subject");
      if (existsSync(devDir)) walk(devDir);
      c.expect(files.length > 0, "no route file under src/app/api/dev: this check would pass over nothing");

      const GATE = /process\.env\.NODE_ENV\s*!==\s*["']development["']/;
      const HANDLER = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g;
      const ungated: string[] = [];
      let handlers = 0;
      for (const f of files) {
        const src = readFileSync(f, "utf8");
        const cuts = [...src.matchAll(HANDLER)];
        const rel = f.slice(repoRoot.length + 1);
        if (cuts.length === 0) ungated.push(`${rel}: a route file exporting no HTTP handler`);
        cuts.forEach((m, i) => {
          handlers += 1;
          const body = src.slice(m.index!, i + 1 < cuts.length ? cuts[i + 1].index! : src.length);
          if (!GATE.test(body)) ungated.push(`${rel}:${m[1]}`);
        });
      }
      c.expect(
        ungated.length === 0,
        "dev-namespace HTTP handler(s) whose own body does not refuse outside NODE_ENV==='development' " +
          "(INV-21). A tool that exists in production is a tool, not a 404:\n  " + ungated.join("\n  ")
      );
      return c.verdict(
        `${handlers} exported HTTP handler(s) across ${files.length} route file(s) under the source ` +
          `directory src/app/api/dev, each refusing in its own body outside development. The file set is ` +
          `derived from the directory, so a new dev tool is covered the day it is added; F01-R01 proves ` +
          `the same namespace answers 404 in a real production build`
      );
    },
  },
  {
    // THE COMPLEMENT TO BOTH EXISTING SCANS, and the one that catches the leak
    // they were each built to miss.
    //
    // F01-S03 scans source and skips `{...}` expressions, saying "enum
    // comparisons in code are not user copy". That is TRUE of
    // `if (x.status === 'FROZEN')` and FALSE of `>{x.status}<`. The difference
    // is POSITION, not syntax: an interpolation in a JSX TEXT NODE is copy.
    //
    // F06-R01 scans rendered output, which would catch it -- but only for
    // routes a stranger can reach. Every Studio route redirects an
    // unauthenticated caller, so the leak lives exactly where neither scan
    // looks.
    //
    // WHAT IT FOUND ON ITS FIRST RUN: `{i.bank_type}` on the Studio bank page
    // and `{b.mode}` / `{d.mode}` on the definitions page -- PRACTICE, TEST,
    // EXAM, PRE_TEST, POST_TEST rendered raw to a staff reader. None of those
    // values is in INTERNAL_WORDS, so no word list would ever have caught them,
    // which is why this rule is about SHAPE and about where the enum came from.
    //
    // THE ENUM-BEARING COLUMN LIST IS DERIVED FROM THE MIGRATIONS, not written
    // here: every `create type ... as enum` gives a type, and every column
    // declared with one gives a name. A new enum column is covered the day it
    // is created, the same reason the route inventory is derived.
    id: "F06-S03",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const migDir = join(repoRoot, "supabase", "migrations");
      const sql = readdirSync(migDir).filter((f) => f.endsWith(".sql")).sort()
        .map((f) => readFileSync(join(migDir, f), "utf8")).join("\n");

      const enumTypes = new Set<string>();
      for (const m of sql.matchAll(/create\s+type\s+(?:public\.)?([a-z_][a-z0-9_]*)\s+as\s+enum/gi)) {
        enumTypes.add(m[1].toLowerCase());
      }
      c.expect(enumTypes.size > 5, `only ${enumTypes.size} enum type(s) found in the migrations`);

      const enumColumns = new Set<string>();
      for (const t of enumTypes) {
        const re = new RegExp(`^\\s*([a-z_][a-z0-9_]*)\\s+(?:public\\.)?${t}\\b`, "gim");
        for (const m of sql.matchAll(re)) enumColumns.add(m[1].toLowerCase());
      }
      // the column often shares its name with the type (status status, mode mode)
      for (const t of enumTypes) enumColumns.add(t);
      c.expect(enumColumns.size > 5, `only ${enumColumns.size} enum-bearing column name(s) derived`);

      const offenders: string[] = [];
      for (const f of walk(join(repoRoot, "src", "app")).filter((x) => /\.tsx$/.test(x))) {
        const text = code(readFileSync(f, "utf8"));
        const rel = relative(repoRoot, f);
        // interpolation standing alone in a TEXT position: between tags, or
        // adjacent to literal text rather than inside an attribute.
        for (const m of text.matchAll(/[>}]\s*\{([^{}]+)\}/g)) {
          const expr = m[1].trim();
          // a call is a lookup (t(`hasil.delta.${d.status}`)) and is fine --
          // the enum is a KEY there, not the rendered string
          if (/[(`]/.test(expr)) continue;
          const tail = /\.([a-z_][a-z0-9_]*)\s*$/.exec(expr);
          if (tail && enumColumns.has(tail[1].toLowerCase())) {
            offenders.push(`${rel}: {${expr}}`);
          }
        }
      }

      c.expect(
        offenders.length === 0,
        "enum-bearing value(s) interpolated into a JSX text position -- a lifecycle or classification " +
          "enum rendered raw to a human (§7). Render an HLE key instead:\n  " + offenders.join("\n  ")
      );
      return c.verdict(
        `${enumColumns.size} enum-bearing column name(s) derived from ${enumTypes.size} enum type(s) in the ` +
          `migrations; no src/app surface interpolates one into a text position`
      );
    },
  },
  {
    // L4 · CR-85 (D-127 Q5: the Human Interface Boundary is a 4.0 closure invariant, enforced systematically).
    //
    // F06-S03 catches an enum COLUMN interpolated raw. The investigation (DG-19..37, §B RC-4, §E) found what it was
    // built to miss: an id fragment as a name (`short(id)`, `.slice(0, 8)`), enum LITERALS rendered by a .map, JSON
    // rendered or asked for as an input, and raw key columns (an audit action, a metric id, a predicted difficulty)
    // drawn as text. This guard looks for all four over every page in src/app.
    //
    // THE REGISTER. What still matches and is not a defect is named here, each with its reason and whose words it
    // waits for: the kept technical exception (the build, in the operator's triage), a secondary identifier beside
    // its label, and the items waiting for Dr Gladys's words (D-128(g): no word is invented). An entry that no longer
    // matches anything fails the guard, so the register can only shrink by fixing, never by forgetting.
    id: "F06-S05",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const KOLOM_KUNCI = "action|metric_id|target_table|target_id|visualization|standard_report|predicted_difficulty|empirical_difficulty|title_key|label_key|build_sha";
      const ATURAN: Record<string, RegExp> = {
        // an id fragment where a name belongs
        id_fragment: /(?<![=\w])\{[^{}]*(?:\bshort\(|\.slice\(0,\s*[78]\))[^{}]*\}/g,
        // an UPPER_CASE literal list drawn as its own text
        enum_literals: /\[\s*"[A-Z][A-Z_]+"(?:\s*,\s*"[A-Z][A-Z_]+")+\s*\]\.map\(\(?(\w+)\)?\s*=>[^;]*?>\{\1\}</g,
        // JSON drawn as text, or asked for as an input
        json: /[>}]\s*\{[^{}]*JSON\.stringify\(|placeholder=['"][^'"]*\{"/g,
      };
      // a raw key column as text: {x.col}, {x.col ?? …} or ${x.col}, after string literals and every call's arguments
      // are set aside (a lookup like s(e.label_key) or kata(tpl.title_key) is not a render; a ternary's test is not either)
      const kolomMentah = new RegExp(`\\.(?:${KOLOM_KUNCI})\\b(?!\\s*\\(|\\s*\\.|\\s*\\?(?!\\?))`);
      const bersihkan = (e: string) => {
        let x = e.replace(/"(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'/g, '""');
        for (let i = 0; i < 20; i++) { const y = x.replace(/[\w.$]+\(([^()]*)\)/g, "CALL"); if (y === x) break; x = y; }
        return x;
      };
      const kolomDiTeks = (text: string): string[] => {
        const out: string[] = [];
        for (const m of text.matchAll(/(?<![=\w$])\{([^{}]*)\}|\$\{([^{}]*)\}/g)) {
          const e = m[1] ?? m[2] ?? "";
          if (kolomMentah.test(bersihkan(e))) out.push(m[0]);
        }
        return out;
      };
      const REGISTER: Array<{ file: string; rule: string; contains: string; why: string }> = [
        { file: "src/app/konfigurasi/page.tsx", rule: "id_fragment", contains: "l.build.slice(0, 7)",
          why: "kept exception (investigation §E item 22): the build, in the platform operator's triage only (platformIni)" },
        { file: "src/app/konfigurasi/page.tsx", rule: "raw_key_column", contains: "r.action",
          why: "Jejak audit (DG-11): 112 action codes in three styles; waits for Dr Gladys's words and Daisy's audit reader" },
        { file: "src/app/konfigurasi/page.tsx", rule: "raw_key_column", contains: "r.target_table",
          why: "Jejak audit (DG-11): what a row is about; waits for words for each audited table" },
        { file: "src/app/konfigurasi/page.tsx", rule: "id_fragment", contains: "short(r.target_id)",
          why: "Jejak audit (DG-11): the audited row's reference, secondary once the table has words" },
        { file: "src/app/konfigurasi/page.tsx", rule: "id_fragment", contains: "short(r.build_sha)",
          why: "Jejak audit (DG-11): the build of each audited act, technical, kept with the audit reader's redesign" },
        { file: "src/app/konfigurasi/page.tsx", rule: "raw_key_column", contains: "{d.metric_id}",
          why: "a secondary identifier, drawn only after the metric's own label (metrik.*.label)" },
        { file: "src/app/konfigurasi/page.tsx", rule: "raw_key_column", contains: "namaMetrik.get(d.metric_id) ?? d.metric_id",
          why: "the metric's own label (metrik.*.label); its id only if the catalogue named a label the copy table lacks" },
        { file: "src/app/konfigurasi/page.tsx", rule: "raw_key_column", contains: "namaMetrik.get(m.metric_id) ?? m.metric_id",
          why: "as above, in a template's list of metrics" },
        { file: "src/app/konfigurasi/page.tsx", rule: "raw_key_column", contains: "m.visualization",
          why: "report templates: no words yet for a visualization (investigation §E item 13)" },
        { file: "src/app/konfigurasi/page.tsx", rule: "raw_key_column", contains: "tpl.standard_report",
          why: "report templates: no words yet for a standard report (§E item 13)" },
        { file: "src/app/studio/definisi/page.tsx", rule: "enum_literals", contains: '"ITEMS_AND_OPTIONS"',
          why: "Aturan Penilaian's shuffle (§E item 2): no words for what is shuffled; Aturan Penilaian is not teacher UI (Q8)" },
        { file: "src/app/studio/bank/page.tsx", rule: "raw_key_column", contains: "i.empirical_difficulty",
          why: "Bank Soal's measured difficulty and its evidence count (§E item 17): no words yet" },
      ];
      const temuan: Array<{ file: string; rule: string; text: string }> = [];
      for (const f of walk(join(repoRoot, "src", "app")).filter((x) => /\.tsx$/.test(x))) {
        const text = code(readFileSync(f, "utf8"));
        const rel = relative(repoRoot, f);
        for (const [rule, re] of Object.entries(ATURAN)) {
          for (const m of text.matchAll(re)) temuan.push({ file: rel, rule, text: m[0].replace(/\s+/g, " ").slice(0, 140) });
        }
        for (const m of kolomDiTeks(text)) temuan.push({ file: rel, rule: "raw_key_column", text: m.replace(/\s+/g, " ").slice(0, 140) });
      }
      const dicatat = (t: { file: string; rule: string; text: string }) =>
        REGISTER.find((r) => r.file === t.file && r.rule === t.rule && t.text.includes(r.contains));
      const bocor = temuan.filter((t) => !dicatat(t));
      c.expect(bocor.length === 0, "a machine value drawn where a person reads (D-127 Q5; render a name, an HLE key or "
        + "the identifier pattern instead):\n  " + bocor.map((t) => `${t.file} [${t.rule}] ${t.text}`).join("\n  "));
      const basi = REGISTER.filter((r) => !temuan.some((t) => dicatat(t) === r));
      c.expect(basi.length === 0, `register entries that no longer match anything (remove them): ${basi.map((r) => `${r.file} ${r.contains}`).join("; ")}`);
      // the controls: each rule catches what it is for
      const tanam: Array<[string, string]> = [
        ["id_fragment", "<p>{short(session)} · 1</p>"], ["id_fragment", "<td>{x.id.slice(0, 8)}</td>"],
        ["enum_literals", '{["PRACTICE", "TEST"].map((b) => <option key={b} value={b}>{b}</option>)}'],
        ["json", "<li>{String(q.question ?? JSON.stringify(q))}</li>"], ["json", `<input placeholder='mis. {"MUDAH":3}' />`],
        ["raw_key_column", "<span>{d.metric_id}</span>"], ["raw_key_column", "<p>x: {i.predicted_difficulty ?? \"—\"}</p>"],
        ["raw_key_column", "<p>{s(\"x\")}: {i.empirical_difficulty} · {n}</p>"],
        ["raw_key_column", "{list.map((m) => `${m.metric_id} (${m.visualization})`)}"],
      ];
      const kena = (rule: string, contoh: string) => rule === "raw_key_column"
        ? kolomDiTeks(contoh).length > 0 : new RegExp(ATURAN[rule].source, ATURAN[rule].flags).test(contoh);
      for (const [rule, contoh] of tanam) c.expect(kena(rule, contoh), `the control: rule ${rule} misses ${contoh}`);
      const bukan: Array<[string, string]> = [["json", "ls.setItem(k, JSON.stringify(e));"], ["id_fragment", 'key={short(x)}'],
        ["raw_key_column", '<th>{s("config.label.action")}</th>'], ["raw_key_column", '<p>{e.label_key ? s(e.label_key) : ""}</p>'],
        ["raw_key_column", "<b>{kata(tpl.title_key)}</b>"]];
      for (const [rule, contoh] of bukan) c.expect(!kena(rule, contoh), `the control: rule ${rule} catches what is not drawn: ${contoh}`);
      return c.verdict(`no src/app page draws an id fragment as a name, an enum literal list, JSON, or a raw key column; `
        + `${temuan.length} match(es) remain, each in the register (${REGISTER.length} entries: the kept build exception, `
        + `a secondary identifier, and the items waiting for words); the rules catch ${tanam.length} planted leaks and not ${bukan.length} non-renders`);
    },
  },
  {
    // S-1, AND THE REASON IT IS A DERIVED LIST RATHER THAN A WRITTEN ONE.
    //
    // Two INTERNAL_WORDS checks already existed and they answer opposite
    // questions. F01-S03's source scan matches JSX TEXT NODES only and says so:
    // "enum comparisons in code are not user copy". That is correct about what
    // it was written to do, and it is structurally blind to the leak that
    // matters -- `{item.state}` rendering SIGNAL_RAISED never puts the literal
    // in the source. The output scan in app.test.ts reads rendered HTML and is
    // the real one -- but it only covers the routes it FETCHES, and that list
    // was maintained by hand.
    //
    // A hand-maintained fetch list is a convention doing a mechanism's job, the
    // same shape ADR-0021 was written for. It would hold for the surfaces this
    // phase adds and lapse silently for the next one someone writes, with a
    // green suite behind it. So: every route the application serves is
    // enumerated from the route table, and a route that exists without output
    // coverage is a FAILURE, not an omission.
    //
    // This is also §7's copy/route inventory, which is why the two obligations
    // are one test: the inventory IS the fetch list, so it cannot drift from it.
    id: "F06-S02",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const appDir = join(repoRoot, "src", "app");

      // The route table: every page.tsx under src/app, minus route groups and
      // private folders, mapped to the path the application serves.
      const routes: string[] = [];
      for (const f of walk(appDir)) {
        if (basename(f) !== "page.tsx") continue;
        const rel = relative(appDir, f).replace(/\\/g, "/").replace(/\/page\.tsx$/, "");
        const segs = rel === "page.tsx" ? [] : rel.split("/");
        if (segs.some((sg) => sg.startsWith("_"))) continue;
        routes.push("/" + segs.join("/"));
      }
      c.expect(routes.length > 0, "no routes found under src/app: the inventory is measuring nothing");

      // The fetch list the output scan actually drives.
      const appSrc = readFileSync(join(repoRoot, "selftest", "app.test.ts"), "utf8");
      const covered = new Set<string>();
      for (const m of appSrc.matchAll(/ROUTE_INVENTORY\s*=\s*\[([\s\S]*?)\]/g)) {
        for (const q of m[1].matchAll(/"([^"]+)"/g)) covered.add(q[1]);
      }

      const dynamic = routes.filter((r) => /\[/.test(r));
      const staticRoutes = routes.filter((r) => !/\[/.test(r));
      const missing = staticRoutes.filter((r) => !covered.has(r));

      c.expect(
        missing.length === 0,
        "route(s) served by the application with no output-level INTERNAL_WORDS coverage — add them to " +
          "ROUTE_INVENTORY in selftest/app.test.ts so a rendered enum cannot reach a human:\n  " +
          missing.join("\n  ")
      );
      if (dynamic.length) c.note(`${dynamic.length} dynamic route(s) covered by their own tests`);
      return c.verdict(
        `copy/route inventory: ${staticRoutes.length} static route(s) served, every one fetched and scanned ` +
          `for internal words at the output level; the list is derived from src/app rather than written down`
      );
    },
  },
  {
    // ADR-0021. PostgreSQL grants EXECUTE on every new function to PUBLIC, and
    // `alter default privileges` cannot revoke from PUBLIC -- so there is no
    // default-off setting to rely on. Forty-nine migrations have carried an
    // explicit revoke; the line has held because a human remembered it, and it
    // has been forgotten three times. This is the prevention half: a syntax
    // check at authoring time, paired with the privilege counter that already
    // catches it late.
    id: "F06-S01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const dir = join(repoRoot, "supabase", "migrations");
      const all = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

      // THE RULE IS FORWARD-SCOPED, AND THE CUTOFF IS RECORDED RATHER THAN
      // IMPLIED. Migrations before ADR-0021 are closed by a different and
      // legitimate mechanism: 20260912004654_function_privileges.sql sweeps
      // the functions created before it, and the live schema measures
      // `functions_executable_by_anon = 0`. That runtime fact is a stronger
      // proof than this syntax check for the history it covers.
      //
      // It is not a mechanism available going forward -- a sweep cannot close
      // a function that shipped reachable in the migrations between -- and
      // rewriting an applied migration is forbidden. So the check governs
      // everything authored from ADR-0021 onward, and the cutoff is a constant
      // here so that moving it is an edit somebody has to make on purpose.
      const ADR_0021_CUTOFF = "20260918100000";
      const files = all.filter((f) => f >= ADR_0021_CUTOFF);
      c.expect(all.length > 0, "no migrations found to check");
      // Vacuity guard. If the cutoff ever outruns the series -- a renamed
      // file, a changed convention -- this check would pass over an empty set
      // and report success having examined nothing.
      c.expect(
        files.length >= 2,
        `ADR-0021's check is examining ${files.length} migration(s): the cutoff ${ADR_0021_CUTOFF} ` +
          "no longer selects the post-ADR series, so this check is measuring nothing"
      );

      // Comments stripped FIRST, per L4. A migration header that explains why a
      // function is revoked would otherwise satisfy the rule by talking about
      // it -- which is the exact failure L4 names, and two of this project's
      // guards have already shipped with it.
      const strip = (t: string) =>
        t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*--.*$/gm, "");

      const offenders: string[] = [];
      for (const f of files) {
        const sql = strip(readFileSync(join(dir, f), "utf8"));

        // Functions created in this migration. Trigger functions and
        // calculators alike -- PUBLIC can execute anything it is not revoked
        // from, and "nobody would call it directly" is not a control.
        // Functions created in this migration, with the offset of the LAST
        // create. Trigger functions and calculators alike -- PUBLIC can execute
        // anything it is not revoked from, and "nobody would call it directly"
        // is not a control.
        const created = new Map<string, number>();
        for (const m of sql.matchAll(
          /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-z_][a-z0-9_]*)\s*\(/gi
        )) created.set(m[1].toLowerCase(), m.index ?? 0);
        if (created.size === 0) continue;

        // ORDER MATTERS, and getting this wrong was a real hole in the first
        // version of this check. A revoke only closes a function that already
        // exists: a function created AFTER the revoke ran is still open, and a
        // name-only match would have passed it. Every rule below therefore
        // compares offsets, not just names.
        const revokes: Array<{ at: number; name?: string; pattern?: RegExp }> = [];
        for (const m of sql.matchAll(
          /revoke\s+[\s\S]{0,80}?on\s+function\s+(?:public\.)?([a-z_][a-z0-9_]*)\s*\([^)]*\)\s*\n?\s*from\s+([^;]*);/gi
        )) if (/\bpublic\b/i.test(m[2])) revokes.push({ at: m.index ?? 0, name: m[1].toLowerCase() });

        // A family pattern is legitimate where functions are created together
        // under a shared prefix: the risk in a family is omitting one NAME, and
        // a loop cannot omit one. ADR-0021 requires such a migration to assert
        // the resulting count as well, which its terminal block does.
        if (/revoke\s+all\s+on\s+function[^;]*from\s+[^;]*public/i.test(sql)) {
          for (const m of sql.matchAll(/proname\s+like\s+'([a-z_\\%]+)'/gi)) {
            const lit = m[1].replace(/\\_/g, "_");
            if (lit.includes("%")) {
              revokes.push({
                at: m.index ?? 0,
                pattern: new RegExp("^" + lit.replace(/%/g, ".*") + "$", "i"),
              });
            }
          }
        }

        // A function dropped in the same migration never commits, so it was
        // never exposed -- transactional DDL means no other session can see it.
        // This is what makes a probe function inside a rolled-back verification
        // block legitimate, and it is an exemption with no loophole in it: the
        // drop has to actually be there, after the create.
        const dropped = new Map<string, number>();
        for (const m of sql.matchAll(
          /drop\s+function\s+(?:if\s+exists\s+)?(?:public\.)?([a-z_][a-z0-9_]*)\s*\(/gi
        )) dropped.set(m[1].toLowerCase(), m.index ?? 0);

        for (const [fn, createdAt] of created) {
          const droppedAt = dropped.get(fn);
          if (droppedAt !== undefined && droppedAt > createdAt) continue;
          const closed = revokes.some(
            (r) => r.at > createdAt && (r.name === fn || (r.pattern?.test(fn) ?? false))
          );
          if (!closed) offenders.push(`${f}: ${fn}`);
        }
      }

      c.expect(
        offenders.length === 0,
        "ADR-0021: function(s) created without revoking EXECUTE from PUBLIC in the same migration " +
          "(EXECUTE is granted to PUBLIC by default and `alter default privileges` cannot revoke it):\n  " +
          offenders.slice(0, 25).join("\n  ")
      );
      return c.verdict(
        `ADR-0021: every function created across the ${files.length} migration(s) authored since the ADR ` +
          `is revoked from PUBLIC in the migration that creates it, by name or by a family pattern whose ` +
          `count is asserted; the ${all.length - files.length} earlier migration(s) are covered by the ` +
          `sweep in function_privileges.sql and by functions_executable_by_anon = 0`
      );
    },
  },
  {
    id: "DOC-P01",
    requires: [],
    run: async ({ repoRoot }) => {
      // Replaces DOC-S01, which counted `Baseline amendment (...)` markers.
      // The reconciliation measurement retired that idea on evidence: doc 03
      // carried the correct marker and was still stale, and three of eighteen
      // documents carry no marker at all -- one of them the sync manifest
      // itself. Content integrity is the only property that actually holds.
      //
      // Assertions 1, 2, 3 and 6 run here (no git needed); CI's
      // `baseline-parity` job runs the same script with 4 and 5, which need
      // history. One implementation, two callers.
      const c = new Checks();
      const script = join(repoRoot, "scripts", "baseline-parity.mjs");
      c.expect(existsSync(script), "scripts/baseline-parity.mjs is missing");
      c.expect(existsSync(join(repoRoot, "docs", "rebuild", "BASELINE-MANIFEST.json")),
        "docs/rebuild/BASELINE-MANIFEST.json is missing");
      let out = "";
      let ok = true;
      try {
        out = execFileSync(process.execPath, [script, "--no-git"], {
          cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
        });
      } catch (e) {
        ok = false;
        const err = e as { stdout?: string; stderr?: string };
        out = `${err.stdout ?? ""}${err.stderr ?? ""}`;
      }
      c.expect(ok, `baseline-parity failed:\n${out.trim().slice(0, 1200)}`);
      const n = /(\d+) document\(s\) byte-identical/.exec(out);
      c.note(n ? `${n[1]} baseline documents byte-identical to the frozen set` : out.trim().slice(0, 160));
      return c.verdict(
        "every frozen baseline document is byte-identical to BASELINE-MANIFEST.json, every file in a governed directory is listed by it, each document's own amendment marker agrees with its manifest entry, and no ungoverned second copy of a governed document exists anywhere in the repository",
      );
    },
  },
  {
    // L3-F01 C.1 -- synthetic credential-bearing seed execution is LOCAL-ONLY.
    //
    // The FABLE-01 seed guard was fail-OPEN: it refused only environment=
    // 'production', and platform_environment.environment is 'development' on
    // hosted too, so synthetic.sql populated real Auth identities -- a global
    // SYSTEM_ADMIN with a tracked password -- on the hosted development project.
    // Repaired by migration 0084 (a fail-closed marker) plus the seed guards.
    //
    // Proven mechanically over the repository:
    //   (1) every seed that inserts a credential-bearing auth.users row calls
    //       synthetic_fixtures_permitted() BEFORE that insert -- derived from the
    //       seed directory, so a new credential seed is covered the day it lands;
    //   (2) the local-only enabler (00_local_fixtures.sql) runs FIRST in the
    //       config.toml pipeline, before any credential seed, and creates nothing;
    //   (3) no tracked automation applies seeds to a hosted project.
    // The hosted half is docs/audit/hosted-credential-audit.sql (C.2), not CI.
    id: "F06-S07",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const seedDir = join(repoRoot, "supabase", "seed");
      const seeds = readdirSync(seedDir).filter((f) => f.endsWith(".sql")).sort();
      c.expect(seeds.length > 0, "no seed files found");

      const CRED = /insert\s+into\s+auth\.users\b/i;
      const GUARD = /synthetic_fixtures_permitted\s*\(\s*\)/;
      const unguarded: string[] = [];
      let credSeeds = 0, credInserts = 0;
      for (const f of seeds) {
        const src = readFileSync(join(seedDir, f), "utf8");
        const inserts = [...src.matchAll(/insert\s+into\s+auth\.users\b/gi)];
        if (inserts.length === 0) continue;
        credSeeds += 1;
        for (const m of inserts) {
          credInserts += 1;
          if (!GUARD.test(src.slice(0, m.index!)))
            unguarded.push(`${f}: an insert into auth.users with no synthetic_fixtures_permitted() guard above it`);
        }
      }
      c.expect(credSeeds > 0, "no seed inserts into auth.users; the credential-seed check has no subject");
      c.expect(unguarded.length === 0,
        "credential-bearing seed insert(s) not gated by the fail-closed marker (L3-F01):\n  " + unguarded.join("\n  "));

      const cfg = readFileSync(join(repoRoot, "supabase", "config.toml"), "utf8");
      const mPaths = /sql_paths\s*=\s*\[([^\]]*)\]/.exec(cfg);
      c.expect(!!mPaths, "config.toml has no [db.seed] sql_paths");
      const order = (mPaths ? mPaths[1] : "").split(",").map((x) => x.replace(/["'\s]/g, ""));
      const enablerIdx = order.findIndex((x) => x.endsWith("00_local_fixtures.sql"));
      c.expect(enablerIdx === 0, "00_local_fixtures.sql (the local-only enabler) is not the first seed in config.toml");
      const firstCred = order.findIndex((x) => /synthetic\.sql|learning_cycle\.sql|official_bootstrap\.sql|human_evaluation\.sql/.test(x));
      c.expect(firstCred === -1 || enablerIdx < firstCred,
        "a credential seed is ordered before the local-fixtures enabler in config.toml");
      const enabler = readFileSync(join(seedDir, "00_local_fixtures.sql"), "utf8");
      c.expect(!CRED.test(enabler) && /local_fixtures_enabled\s*=\s*true/.test(enabler),
        "00_local_fixtures.sql must only set local_fixtures_enabled = true and create no identity");

      const ghDir = join(repoRoot, ".github");
      const gh: string[] = [];
      const walk = (d: string) => { for (const e of readdirSync(d, { withFileTypes: true })) { const q = join(d, e.name); if (e.isDirectory()) walk(q); else gh.push(q); } };
      if (existsSync(ghDir)) walk(ghDir);
      const hostedSeed = gh.filter((f) => { const t = readFileSync(f, "utf8"); return /--project-ref|db\s+push|--linked/.test(t) && /seed/i.test(t); });
      c.expect(hostedSeed.length === 0,
        "tracked automation appears to apply seeds to a hosted project:\n  " + hostedSeed.map((f)=>f.slice(repoRoot.length+1)).join("\n  "));

      return c.verdict(
        `${credInserts} credential-bearing insert(s) across ${credSeeds} seed(s), each gated by ` +
        `synthetic_fixtures_permitted(); the local-only enabler runs first and creates no identity; ` +
        `no tracked automation seeds a hosted project. Derived from the seed directory. Hosted half: ` +
        `docs/audit/hosted-credential-audit.sql (L3-F01 C.2), which CI cannot run.`
      );
    },
  },
  // UX-1 Slice 0 + Slice 1. ADDED, NOT EDITED: the cases live in their own
  // file so that every line this session wrote is reviewable in one place, and
  // no case that existed at the frozen baseline is touched by appending them.
  ...experienceTests,
  ...emailTests,
  ...aktifkanTests,
  ...daisy40Tests,
  // LOGIN CONTRACT — L-1 and L-2. Same rule as the Experience cases above:
  // appended in their own file, so nothing that existed at the baseline is
  // edited to make room for them.
  ...loginTests,
  // BOB-01 — the school-structure contract (D-006, D-011, M5a). Same rule:
  // appended in its own file, nothing that existed before it is edited.
  ...strukturTests,
  // BOB-02 — the lesson workbook (D-007, D-008, D-011, M8). Same rule.
  ...unggahTests,
  ...terbitanTests,
  ...penugasanTests,
  ...sesiTests,
  ...bob06Tests,
  ...galatTests,
  ...bob08Tests,
  ...bob09Tests,
  ...bob18Tests,
  ...bob17Tests,
  ...bob22Tests,
  ...w2Tests,
  ...w3Tests,
  ...w5Tests,
  ...w8Tests,
  ...w9Tests,
  ...w10Tests,
  ...w11Tests,
  ...m7Tests,
  ...w9bTests,
  ...edu23Tests,
  ...hod05Tests,
  ...hod09Tests,
  ...m4Tests,
  ...adm06Tests,
  ...m9Tests,
  ...adm19Tests,
  ...adm02Tests,
  ...adm09Tests,
  ...d088iTests,
  ...d088hTests,
  ...d088gTests,
  ...d088kTests,
  ...bob49Tests,
  ...m3Tests,
  ...m6Tests,
  ...t2Tests,
  ...kolomTests,
  ...m10Tests,
  ...m3rTests,
  ...c1Tests,
  ...j613Tests,
  ...j614Tests,
  ...l4Tests,
  ...effTests,
  ...pitaTests,
  ...d006Tests,
  ...w16Tests,
  ...bob23Tests,
  ...bob12Tests,
  ...bob32Tests,
  ...bob34Tests,
  ...bob38Tests,
  ...bob39Tests,
  ...bob40Tests,
  ...bob41Tests,
  ...bob25Tests,
  ...bob42Tests,
  ...bob26Tests,
  ...bob50Tests,
  ...bob51Tests,
  ...emailJujurTests,
  ...bob27Tests,
  ...bob28Tests,
  ...bob29Tests,
  ...bob43Tests,
  ...bob15Tests,
  ...m148Tests,
  ...fu1921Tests,
  ...d101Tests,
  ...d102Tests,
  ...c12Tests,
  ...dr150Tests,
  ...dr150bTests,
  ...dr150cTests,
  ...rilis40Tests,
  ...ciwasteTests,
  ...penutupanTests,
  ...fable22Tests,
];
