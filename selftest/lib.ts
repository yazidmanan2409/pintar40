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

export type Facility = "db" | "app" | "network" | "ci";

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
};

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
