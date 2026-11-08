/**
 * Which production bundle the selftest may run against.
 *
 * On 8 Nov 2026 a full local run tested a `.next` built the day before, after
 * several commits had changed `src/`, and nothing said so. A modification time
 * cannot prove a bundle's identity (a checkout, a copied tree or a restored
 * cache all break it), so the selftest records a fingerprint of everything
 * `next build` reads next to the bundle it built, and reuses `.next` only when
 * that fingerprint matches exactly:
 *
 *   source     every file under src/ and public/ (path and content)
 *   config     next.config.*, tsconfig.json, postcss.config.*, package.json
 *   lockfile   package-lock.json
 *   installed  node_modules/.package-lock.json (the tree npm actually installed)
 *   env        the .env files Next loads for a build, and the values of
 *              NODE_ENV, every NEXT_PUBLIC_* and every process.env name that
 *              src/ or next.config.* reads (hashed; no value is ever written)
 *   revision   `git rev-parse HEAD`, so a bundle from another revision is never
 *              reused even when no input differs
 *
 * A build made outside the selftest (`npm run build`) carries no fingerprint,
 * so the selftest builds again rather than trust it; in CI the selftest owns
 * the build for that reason. `SELFTEST_REUSE_BUILD=1` keeps a stale bundle for
 * someone who knows what they are doing, loudly, and is refused in CI.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const BUILD_DIR = ".next";
export const FINGERPRINT_FILE = "pintar-selftest-build.json";

const PART_NAMES = ["source", "config", "lockfile", "installed", "env"] as const;
type Part = (typeof PART_NAMES)[number];

export type BuildIdentity = {
  revision: string;
  parts: Record<Part, string>;
  digest: string;
};
type Recorded = BuildIdentity & { buildId: string; recordedAt: string };

const SOURCE_DIRS = ["src", "public"];
const CONFIG_FILE = /^(next\.config\..+|tsconfig\.json|postcss\.config\..+|package\.json)$/;
// The files Next.js loads for `next build` (NODE_ENV=production); .env.example is documentation.
const ENV_FILES = [".env", ".env.local", ".env.production", ".env.production.local"];
const ENV_NAME_READ = /process\.env(?:\.([A-Z_][A-Z0-9_]*)|\[\s*["']([A-Z_][A-Z0-9_]*)["']\s*\])/g;

const sha = (h: ReturnType<typeof createHash>) => h.digest("hex");

function filesUnder(root: string, dir: string): string[] {
  const out: string[] = [];
  const walk = (rel: string) => {
    for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
      const r = `${rel}/${e.name}`;
      if (e.isDirectory()) walk(r);
      else if (e.isFile()) out.push(r);
    }
  };
  if (existsSync(join(root, dir))) walk(dir);
  return out;
}

function hashFiles(root: string, rels: string[]): string {
  const h = createHash("sha256");
  for (const r of [...rels].sort()) {
    h.update(r).update("\0");
    h.update(existsSync(join(root, r)) ? readFileSync(join(root, r)) : "\u0000absent");
    h.update("\0");
  }
  return sha(h);
}

function gitRevision(root: string): string {
  const r = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : "no-git";
}

export function computeBuildIdentity(root: string, env: NodeJS.ProcessEnv): BuildIdentity {
  const source = SOURCE_DIRS.flatMap((d) => filesUnder(root, d));
  const config = readdirSync(root, { withFileTypes: true }).filter((e) => e.isFile() && CONFIG_FILE.test(e.name)).map((e) => e.name);

  const names = new Set<string>(["NODE_ENV", ...Object.keys(env).filter((k) => k.startsWith("NEXT_PUBLIC_"))]);
  for (const f of [...source.filter((f) => /\.(m?[jt]sx?|cjs)$/.test(f)), ...config.filter((f) => f.startsWith("next.config."))]) {
    for (const m of readFileSync(join(root, f), "utf8").matchAll(ENV_NAME_READ)) names.add(m[1] ?? m[2]);
  }
  const envHash = createHash("sha256");
  for (const n of [...names].sort()) envHash.update(`${n}${env[n] === undefined ? "\u0000unset" : `=${env[n]}`}\n`);
  envHash.update(hashFiles(root, ENV_FILES));

  const parts: Record<Part, string> = {
    source: hashFiles(root, source),
    config: hashFiles(root, config),
    lockfile: hashFiles(root, ["package-lock.json"]),
    installed: hashFiles(root, ["node_modules/.package-lock.json"]),
    env: sha(envHash),
  };
  const revision = gitRevision(root);
  const digest = sha(createHash("sha256").update(JSON.stringify({ revision, parts })));
  return { revision, parts, digest };
}

function readRecorded(root: string): Recorded | null {
  try {
    return JSON.parse(readFileSync(join(root, BUILD_DIR, FINGERPRINT_FILE), "utf8")) as Recorded;
  } catch {
    return null;
  }
}

const short = (rev: string) => (/^[0-9a-f]{40}$/.test(rev) ? rev.slice(0, 12) : rev);

function describeChange(was: BuildIdentity, now: BuildIdentity): string {
  const changed: string[] = PART_NAMES.filter((p) => was.parts?.[p] !== now.parts[p]);
  if (was.revision !== now.revision) changed.push(`revision ${short(was.revision)} → ${short(now.revision)}`);
  return changed.length ? changed.join(", ") : "fingerprint format";
}

export type FreshnessOutcome = { action: "built" | "reused" | "reused-stale"; reason: string };

/**
 * Builds unless `.next` holds the very build this fingerprint describes, and
 * logs which happened. `build` runs `next build` and reports success.
 */
export function ensureFreshBuild(opts: {
  root: string;
  env: NodeJS.ProcessEnv;
  log: (line: string) => void;
  build: () => boolean;
}): FreshnessOutcome {
  const { root, env, log, build } = opts;
  const buildIdPath = join(root, BUILD_DIR, "BUILD_ID");
  const now = computeBuildIdentity(root, env);

  let reason: string;
  if (!existsSync(buildIdPath)) {
    reason = ".next/BUILD_ID missing";
  } else {
    const buildId = readFileSync(buildIdPath, "utf8").trim();
    const was = readRecorded(root);
    if (!was) reason = "no fingerprint recorded for this .next (built outside the selftest, or by an older runner)";
    else if (was.buildId !== buildId) reason = `.next/BUILD_ID ${buildId} is not the build the fingerprint describes (${was.buildId})`;
    else if (was.digest !== now.digest) reason = `stale build: ${describeChange(was, now)} changed since it was built`;
    else {
      log(`  reusing production bundle: fingerprint ${now.digest.slice(0, 12)} matches (revision ${short(now.revision)}, build ${buildId})`);
      return { action: "reused", reason: "fingerprint matches" };
    }
    if (env.SELFTEST_REUSE_BUILD === "1") {
      if (env.CI === "true" || env.GITHUB_ACTIONS === "true") {
        throw new Error(`SELFTEST_REUSE_BUILD=1 is refused in CI: ${reason}`);
      }
      log(`  !!! STALE BUILD REUSED (SELFTEST_REUSE_BUILD=1): ${reason}.`);
      log("  !!! The app-level results below describe that older bundle, not the working tree.");
      return { action: "reused-stale", reason };
    }
  }

  log(`  building production bundle (${reason})…`);
  for (let attempt = 1; ; attempt++) {
    const before = computeBuildIdentity(root, env);
    if (!build()) throw new Error("next build failed");
    const after = computeBuildIdentity(root, env);
    if (after.digest === before.digest) {
      const buildId = readFileSync(buildIdPath, "utf8").trim();
      const rec: Recorded = { ...after, buildId, recordedAt: new Date().toISOString() };
      writeFileSync(join(root, BUILD_DIR, FINGERPRINT_FILE), JSON.stringify(rec, null, 2) + "\n");
      log(`  built and recorded: fingerprint ${after.digest.slice(0, 12)} (revision ${short(after.revision)}, build ${buildId})`);
      return { action: "built", reason };
    }
    if (attempt === 2) throw new Error(`build inputs changed during the build (${describeChange(before, after)}); not recording a bundle of mixed inputs`);
    log(`  build inputs changed during the build (${describeChange(before, after)}); building again…`);
  }
}
