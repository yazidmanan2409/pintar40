/**
 * `npm run selftest:build-identity` — regression tests for the bundle the
 * selftest runs against (selftest/build-identity.ts) and for how a test reaches
 * it (selftest/lib.ts compiledBundle). Each case runs in a throwaway git
 * repository with a fake `next build` that, like the real one, empties `.next`
 * and writes a new BUILD_ID; nothing here touches this checkout's `.next`.
 *
 * Not a manifest id: this proves the harness, not the product, and needs no
 * facility. CI runs it in the `check` job.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { ensureFreshBuild, FINGERPRINT_FILE } from "./build-identity";
import { compiledBundle, contextFor, selectionNeedsBuild, type Context, type SelfTest } from "./lib";

function git(root: string, ...args: string[]) {
  const r = spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...args], { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "pintar-build-identity-"));
  const put = (rel: string, text: string) => {
    mkdirSync(join(root, rel, ".."), { recursive: true });
    writeFileSync(join(root, rel), text);
  };
  put("src/app/page.tsx", 'export default () => process.env.NEXT_PUBLIC_APP_URL + (process.env["CARD_EMAIL_DOMAIN"] ?? "");\n');
  put("src/app/globals.css", "body { margin: 0 }\n");
  put("public/logo.svg", "<svg/>\n");
  put("next.config.ts", "export default {};\n");
  put("package.json", '{ "name": "f" }\n');
  put("package-lock.json", '{ "lockfileVersion": 3 }\n');
  put("README.md", "fixture\n");
  git(root, "init", "-q");
  git(root, "add", "-A");
  git(root, "commit", "-qm", "A");

  let builds = 0;
  const lines: string[] = [];
  const env: NodeJS.ProcessEnv = { NODE_ENV: "production", NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3999" };
  const build = () => {
    builds++;
    rmSync(join(root, ".next"), { recursive: true, force: true });
    mkdirSync(join(root, ".next", "static"), { recursive: true });
    writeFileSync(join(root, ".next", "BUILD_ID"), `build-${builds}`);
    return true;
  };
  const run = () => {
    lines.length = 0;
    const before = builds;
    const out = ensureFreshBuild({ root, env, log: (l) => lines.push(l), build });
    return { ...out, built: builds - before, log: lines.join("\n") };
  };
  const edit = (rel: string, text: string) => put(rel, readFileSync(join(root, rel), "utf8") + text);
  return { root, put, edit, env, run, done: () => rmSync(root, { recursive: true, force: true }) };
}

test("missing build: builds, records the fingerprint, logs why", () => {
  const f = fixture();
  try {
    const r = f.run();
    assert.equal(r.action, "built");
    assert.equal(r.built, 1);
    assert.match(r.log, /building production bundle \(\.next\/BUILD_ID missing\)/);
    assert.match(r.log, /built and recorded: fingerprint [0-9a-f]{12}/);
    const rec = JSON.parse(readFileSync(join(f.root, ".next", FINGERPRINT_FILE), "utf8"));
    assert.equal(rec.buildId, "build-1");
    assert.equal(JSON.stringify(rec).includes("127.0.0.1:3999"), false, "an env value was written into the fingerprint file");
  } finally {
    f.done();
  }
});

test("unchanged inputs: reuses without building, even after a touch", () => {
  const f = fixture();
  try {
    f.run();
    f.put("src/app/page.tsx", readFileSync(join(f.root, "src/app/page.tsx"), "utf8")); // same content, new mtime
    const r = f.run();
    assert.equal(r.action, "reused");
    assert.equal(r.built, 0);
    assert.match(r.log, /reusing production bundle: fingerprint [0-9a-f]{12} matches \(revision [0-9a-f]{12}, build build-1\)/);
  } finally {
    f.done();
  }
});

test("changed source: a file edited, added or deleted under src/ or public/ rebuilds", () => {
  const f = fixture();
  try {
    f.run();
    for (const change of [
      () => f.edit("src/app/page.tsx", "// edited\n"),
      () => f.put("src/lib/new.ts", "export const x = 1;\n"),
      () => rmSync(join(f.root, "src/lib/new.ts")),
      () => f.put("src/app/globals.css", "body { margin: 1px }\n"),
      () => f.put("public/logo.svg", "<svg></svg>\n"),
    ]) {
      change();
      const r = f.run();
      assert.equal(r.action, "built", r.log);
      assert.match(r.log, /stale build: source changed since it was built/);
      assert.equal(f.run().action, "reused");
    }
  } finally {
    f.done();
  }
});

test("changed build configuration, lockfile, installed tree or build env rebuilds, naming what changed", () => {
  const f = fixture();
  try {
    f.run();
    const cases: [string, () => void][] = [
      ["config", () => f.put("next.config.ts", "export default { reactStrictMode: true };\n")],
      ["config", () => f.put("tsconfig.json", "{}\n")],
      ["config", () => f.put("package.json", '{ "name": "f", "version": "2" }\n')],
      ["lockfile", () => f.put("package-lock.json", '{ "lockfileVersion": 3, "x": 1 }\n')],
      ["installed", () => f.put("node_modules/.package-lock.json", '{ "next": "16" }\n')],
      ["env", () => f.put(".env.local", "NEXT_PUBLIC_SUPABASE_URL=http://elsewhere\n")],
      ["env", () => (f.env.NEXT_PUBLIC_APP_URL = "https://staging.example")],
      ["env", () => (f.env.CARD_EMAIL_DOMAIN = "cards.example")], // read by src/, not NEXT_PUBLIC_
    ];
    for (const [part, change] of cases) {
      change();
      const r = f.run();
      assert.equal(r.action, "built", `${part}: ${r.log}`);
      assert.match(r.log, new RegExp(`stale build: ${part} changed since it was built`));
      assert.equal(f.run().action, "reused");
    }
    // an env var nothing reads does not invalidate the bundle
    f.env.UNRELATED = "x";
    assert.equal(f.run().action, "reused");
    // nor does a file outside the build's inputs
    f.put("docs/note.md", "x\n");
    assert.equal(f.run().action, "reused");
  } finally {
    f.done();
  }
});

test("switched git revision: a bundle from another revision is never reused", () => {
  const f = fixture();
  try {
    f.run(); // built at A
    const a = git(f.root, "rev-parse", "HEAD");
    f.edit("src/app/page.tsx", "// B\n");
    git(f.root, "commit", "-qam", "B");
    let r = f.run();
    assert.equal(r.action, "built");
    assert.match(r.log, new RegExp(`stale build: source, revision ${a.slice(0, 12)} → [0-9a-f]{12} changed`));

    // back to A: same tree as the first build, but the bundle on disk is B's
    git(f.root, "checkout", "-q", a);
    r = f.run();
    assert.equal(r.action, "built", r.log);
    assert.match(r.log, /source, revision [0-9a-f]{12} → [0-9a-f]{12}/);

    // a commit that changes no build input still changes the revision
    git(f.root, "checkout", "-q", "-");
    f.run();
    f.put("README.md", "only docs\n");
    git(f.root, "commit", "-qam", "C");
    r = f.run();
    assert.equal(r.action, "built", r.log);
    assert.match(r.log, /stale build: revision [0-9a-f]{12} → [0-9a-f]{12} changed/);
  } finally {
    f.done();
  }
});

test("a build made outside the selftest, or replaced under the fingerprint, is not trusted", () => {
  const f = fixture();
  try {
    f.run();
    writeFileSync(join(f.root, ".next", "BUILD_ID"), "by-hand"); // `npm run build` after a selftest build
    let r = f.run();
    assert.equal(r.action, "built");
    assert.match(r.log, /\.next\/BUILD_ID by-hand is not the build the fingerprint describes/);
    rmSync(join(f.root, ".next", FINGERPRINT_FILE));
    r = f.run();
    assert.equal(r.action, "built");
    assert.match(r.log, /no fingerprint recorded for this \.next/);
  } finally {
    f.done();
  }
});

test("explicit stale-build override: SELFTEST_REUSE_BUILD=1 reuses, loudly, and never stands in for a missing build", () => {
  const f = fixture();
  try {
    f.env.SELFTEST_REUSE_BUILD = "1";
    let r = f.run();
    assert.equal(r.action, "built", "the override must not skip a build that does not exist");
    f.edit("src/app/page.tsx", "// edited\n");
    r = f.run();
    assert.equal(r.action, "reused-stale");
    assert.equal(r.built, 0);
    assert.match(r.log, /!!! STALE BUILD REUSED \(SELFTEST_REUSE_BUILD=1\): stale build: source changed since it was built\./);
    assert.match(r.log, /!!! The app-level results below describe that older bundle, not the working tree\./);
    delete f.env.SELFTEST_REUSE_BUILD;
    assert.equal(f.run().action, "built");
  } finally {
    f.done();
  }
});

test("a build whose inputs change while it runs is built again, then refused", () => {
  const f = fixture();
  try {
    let n = 0;
    const flaky = () => {
      n++;
      mkdirSync(join(f.root, ".next"), { recursive: true });
      writeFileSync(join(f.root, ".next", "BUILD_ID"), `b${n}`);
      writeFileSync(join(f.root, "src/app/page.tsx"), `export default () => ${n};\n`);
      return true;
    };
    assert.throws(() => ensureFreshBuild({ root: f.root, env: f.env, log: () => {}, build: flaky }), /build inputs changed during the build \(source\)/);
    assert.equal(n, 2);
  } finally {
    f.done();
  }
});

// ------------------------------------------------- tests that read the bundle
const ctx: Context = {
  repoRoot: "/r", appUrl: null, supabaseUrl: null, supabaseAnonKey: null, supabaseServiceRoleKey: null, ciUpstream: null,
  bundleDir: "/r/.next",
};
const reads: SelfTest = { id: "X-READS", requires: ["build"], run: async (c) => ({ ok: true, detail: compiledBundle(c, "static") }) };
const forgets: SelfTest = { id: "X-FORGETS", requires: [], run: async (c) => ({ ok: true, detail: compiledBundle(c, "static") }) };
const plain: SelfTest = { id: "X-PLAIN", run: async () => ({ ok: true, detail: "" }) };

test("static test requiring a compiled bundle: selecting it makes the runner verify the build first", () => {
  assert.equal(selectionNeedsBuild([reads, plain], (t) => t.id === "X-READS"), true);
  assert.equal(selectionNeedsBuild([reads, plain], (t) => t.id === "X-PLAIN"), false);
  assert.equal(selectionNeedsBuild([reads, plain], () => true), true);
});

test("only a test that declares the build reaches it; one that forgets fails instead of reading an unchecked bundle", async () => {
  assert.equal((await reads.run(contextFor(reads, ctx))).detail, join("/r/.next", "static"));
  await assert.rejects(forgets.run(contextFor(forgets, ctx)), /does not declare requires: \["build"\]/);
  // and with no verified build at all (build facility missing), even a declaring test gets nothing
  await assert.rejects(reads.run(contextFor(reads, { ...ctx, bundleDir: null })), /does not declare/);
});

test("no selftest file reaches .next except through compiledBundle()", () => {
  const dir = resolve(__dirname);
  const allowed = new Set(["build-identity.ts", "build-identity.check.ts", "lib.ts"]);
  const direct = /["'`]\.next["'`/]|[/\\]\.next\b/;
  const walkSkip = /new Set\(\[|e\.name === "\.next"|IGNORED/; // directory walkers skipping .next
  const offenders: string[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(m?[jt]s|cjs)$/.test(e.name) && !allowed.has(relative(dir, p))) {
        readFileSync(p, "utf8").split("\n").forEach((line, i) => {
          const code = line.replace(/^\s*(\/\/|\*|\/\*).*$/, "");
          if (direct.test(code) && !walkSkip.test(code)) offenders.push(`selftest/${relative(dir, p)}:${i + 1}: ${line.trim()}`);
        });
      }
    }
  };
  walk(dir);
  assert.deepEqual(offenders, [], `read the bundle with compiledBundle(ctx, ...) and declare requires: ["build"]:\n${offenders.join("\n")}`);
});
