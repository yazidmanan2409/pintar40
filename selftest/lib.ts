/**
 * Selftest contract primitives (doc 16 §4). A test is a manifest id plus a
 * function that returns a verdict. Tests never decide for themselves to be
 * skipped: the runner (selftest/run.ts) compares each test's `requires`
 * against the facilities actually present, and a missing facility is a
 * SKIP that fails the contract unless the manifest carries a reviewed
 * justification for that id and the caller explicitly accepts justified
 * skips (`selftest:local`). In CI every facility is present, so nothing
 * skips.
 */

import { join } from "node:path";

/**
 * `build`: the production bundle in `.next` was checked against the working
 * tree's fingerprint this run (selftest/build-identity.ts). A test that reads
 * the compiled bundle declares it and reaches the bundle only through
 * compiledBundle() below.
 */
export type Facility = "db" | "app" | "network" | "ci" | "mailsink" | "build";

export type Verdict = { ok: boolean; detail: string };

export type SelfTest = {
  id: string;
  requires?: Facility[];
  run: (ctx: Context) => Promise<Verdict>;
};

export type Context = {
  repoRoot: string;
  /** Base URL of the running production-mode app (present when facility `app` is available). */
  appUrl: string | null;
  /** Supabase project URL / anon key (present when facility `network` is available). */
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  /** Service-role key, only ever read from the environment of the runner (CI local stack); never logged. */
  supabaseServiceRoleKey: string | null;
  /** Upstream CI job results forwarded by the workflow (facility `ci`). */
  ciUpstream: Record<string, string> | null;
  /** BOB-18: the running app's Supabase calls, one `METHOD /path` line each (present with facility `app`). */
  fetchLog?: string | null;
  /**
   * The verified `.next` directory, given only to a test that declares
   * `requires: ["build"]` (the runner sets it per test). Read it through
   * compiledBundle(), never by joining ".next" yourself.
   */
  bundleDir?: string | null;
};

/**
 * The one way a test reaches the compiled bundle. It throws for a test that did
 * not declare `requires: ["build"]`, because the runner then never checked that
 * `.next` was built from the tree under test.
 */
export function compiledBundle(ctx: Context, ...parts: string[]): string {
  if (!ctx.bundleDir) {
    throw new Error('this test reads the compiled bundle but does not declare requires: ["build"], so .next was never checked against the working tree');
  }
  return join(ctx.bundleDir, ...parts);
}

/** True when a selected test reads the compiled bundle (the runner then verifies or builds it first). */
export function selectionNeedsBuild(tests: SelfTest[], selected: (t: SelfTest) => boolean): boolean {
  return tests.some((t) => selected(t) && (t.requires ?? []).includes("build"));
}

/** The context one test runs with: the bundle only for a test that declared `build`. */
export function contextFor(test: SelfTest, ctx: Context): Context {
  return { ...ctx, bundleDir: (test.requires ?? []).includes("build") ? ctx.bundleDir ?? null : null };
}

export function pass(detail: string): Verdict {
  return { ok: true, detail };
}

export function fail(detail: string): Verdict {
  return { ok: false, detail };
}

/** Collects failures; `verdict()` renders them as one calm line. */
export class Checks {
  private failures: string[] = [];
  private notes: string[] = [];
  expect(cond: unknown, failureText: string): boolean {
    if (!cond) this.failures.push(failureText);
    return Boolean(cond);
  }
  note(text: string) {
    this.notes.push(text);
  }
  verdict(passText: string): Verdict {
    if (this.failures.length) return fail(this.failures.join("; "));
    return pass(this.notes.length ? `${passText} (${this.notes.join(", ")})` : passText);
  }
}

/** Visible text of an HTML document: tags, scripts and styles removed. */
export function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
