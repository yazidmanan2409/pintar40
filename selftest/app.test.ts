/**
 * App runner — F01-R01…R06 and F03-R01…R02. Black-box HTTP against the production-mode app
 * (`next start`) and, where the network facility exists, against the
 * Supabase project's REST/Auth/Storage endpoints with real persona JWTs —
 * never a superuser connection (FABLE-01 §6). R01 needs no network. R04 is
 * evidence forwarded from the CI workflow's own jobs.
 */
import { spawnSync } from "node:child_process";
import { createServerClient } from "@supabase/ssr";
import { Checks, visibleText, type SelfTest, type Context } from "./lib";
import { INTERNAL_WORDS, t } from "../src/lib/hle";

/** Synthetic personas (supabase/seed/synthetic.sql). Passwords are seed constants, not secrets. */
const PERSONA = {
  dean: { email: "alpha-dean@synthetic.pintar.test", password: "Sintetis-AlphaDean-33!" },
  alphaAdmin: { email: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" },
  alphaStudent: { email: "alpha-siswa-1@synthetic.pintar.test", password: "Sintetis-AlphaSiswa1-76!" },
  // FABLE-03's own learner (supabase/seed/learning_cycle.sql). Deliberately
  // not alphaStudent: FABLE-01's rollover and transfer tests move that persona
  // out of the fixture's class, which would make these tests fail for a reason
  // that has nothing to do with the learning cycle.
  cycleLearner: { email: "siklus-email@synthetic.pintar.test", password: "Sintetis-SiklusEmail-84!" },
  // WP4. The two Management roles and the educator who must NOT be one. The
  // dean is scoped at Alpha's institution node and the head of department at
  // Alpha's department node, so the two of them also exercise the difference
  // between a wide Management scope and a narrow one.
  alphaHod: { email: "alpha-hod@synthetic.pintar.test", password: "Sintetis-AlphaHod-48!" },
  alphaGuru: { email: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!" },
  // WP6B. The educator who ALSO LEARNS: the learning-cycle fixture's own
  // teacher, who authored that course, teaches that class, and is enrolled in
  // it. Paired with `alphaGuru` -- the same role, no enrolment -- they are the
  // whole invariant: what a person may learn is their enrolment and never their
  // role, so two educators must see two different pages.
  cycleEducator: { email: "siklus-guru@synthetic.pintar.test", password: "Sintetis-SiklusGuru-11!" },
  // WP7C. The learning-cycle tenant's own Management and administrator. The
  // head of department stands over the fixture class and can therefore open and
  // close a real feedback round about the educator who teaches it; the
  // administrator stands over the whole school and WP7B gives them nothing
  // here, which is the case worth measuring.
  cycleHod: { email: "siklus-kaprodi@synthetic.pintar.test", password: "Sintetis-SiklusKaprodi-22!" },
  cycleAdmin: { email: "siklus-admin@synthetic.pintar.test", password: "Sintetis-SiklusAdmin-33!" },
} as const;

/** Every learner route FABLE-03 adds, for the copy inventory (§9). */
const LEARNER_ROUTES = ["/belajar"] as const;

/**
 * THE COPY/ROUTE INVENTORY (§7), and the fetch list for the output-level
 * INTERNAL_WORDS scan. These are the same list on purpose.
 *
 * F06-S02 derives the routes the application actually serves from `src/app` and
 * fails if any of them is missing here. So this cannot quietly fall behind the
 * application: adding a page without adding it here is a red test, not an
 * omission nobody notices.
 *
 * WHY AN OUTPUT LIST AT ALL. The source scan (F01-S03) matches JSX text nodes
 * and deliberately ignores `{...}` expressions -- correct for what it does, and
 * blind to `{item.state}` rendering an enum. Only fetched HTML can catch that,
 * and only for routes that are fetched.
 *
 * A route that redirects an unauthenticated caller is still covered: the
 * redirect body is scanned too, and a 3xx with no body trivially carries no
 * internal word -- which is the honest result for a page a stranger cannot see.
 */
const ROUTE_INVENTORY = [
  "/",
  "/masuk",
  // UX-1 login. The magic-link callback stopped being a bare redirect and
  // became a surface people read (S13/S14), so its rendered output joins the
  // internal-word sweep like every other page.
  "/auth/callback",
  "/belajar",
  // UX-1 Slice 1. THE ONLY LINE THIS SESSION CHANGED IN AN EXISTING SELFTEST
  // FILE, and it is a coverage list rather than a predicate: F06-S02 fails
  // until a served static route is in it, and its failure message says to add
  // it here. Leaving it out would have meant a route nobody scans for internal
  // words, which is the opposite of the rule's intent.
  "/belajar/sertifikat",
  "/konfigurasi",
  "/evaluasi",
  "/edukator/ringkasan",
  "/dekan/ringkasan",
  "/studio",
  "/studio/bank",
  "/studio/definisi",
  "/studio/integritas",
  "/studio/kanonik",
  "/studio/kuis",
  "/studio/sertifikat",
  "/studio/tinjau",
  "/studio/unggah",
  // UX-1 Slice 3. The educator's home is the one static route the teaching
  // surface serves; A-F below it are all class-scoped and therefore dynamic,
  // and F06-R01 scans this one's rendered output for internal words like any
  // other. UX1-S3-KATA-01 covers the copy of every screen including those.
  "/mengajar",
  // WP4. The Management home is the one static route the Management surface
  // serves; the node, roster and learner routes below it are all scoped and
  // therefore dynamic. It renders four database enums — a decision family, a
  // state, an outcome and a readiness state — every one of them through the
  // copy table, so it is exactly the kind of page this sweep exists for.
  "/pimpinan",
  // WP5B. The intake entry is the one static route the institutional intake
  // serves; the job route beneath it is per-job and therefore dynamic. It
  // renders a job's state and a validation problem, both of which arrive from
  // the database as developer phrases, so it is exactly the kind of page this
  // sweep exists for.
  "/pendataan",
] as const;

type Session = { cookie: string; accessToken: string; refreshToken: string };

/**
 * Signs in through the same @supabase/ssr client the app uses, capturing the
 * exact cookies it would set — so the app receives a real session, in its
 * own cookie format, without the test knowing that format.
 */
async function signIn(ctx: Context, persona: { email: string; password: string }): Promise<Session> {
  const jar = new Map<string, string>();
  const client = createServerClient(ctx.supabaseUrl!, ctx.supabaseAnonKey!, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const { data, error } = await client.auth.signInWithPassword(persona);
  if (error || !data.session) throw new Error(`sign-in failed for ${persona.email}: ${error?.message ?? "no session"}`);
  return {
    cookie: [...jar].map(([n, v]) => `${n}=${v}`).join("; "),
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

/**
 * Trades a refresh token with GoTrue. A refresh token is the server-side
 * handle on a session: it is stored in `auth.refresh_tokens` and dies with
 * the session row, so a rejected refresh proves the session was invalidated
 * on the server — unlike a cleared cookie, which proves only that the
 * browser forgot it.
 */
async function refresh(ctx: Context, refreshToken: string): Promise<Response> {
  return fetch(`${ctx.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: ctx.supabaseAnonKey!, "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

/**
 * Runs the production derivation — `src/lib/card.ts`, the exact module the
 * card sign-in server action calls — and returns its output. It is loaded in
 * a child process because the module is marked `server-only`, which throws
 * outside a React server condition; the child sets that condition so nothing
 * about the shared runner has to change. Deriving here rather than
 * reimplementing the formula is the point: a second implementation in the
 * test would agree with itself and prove nothing.
 */
function productionDerivation(card: string, pin: string): string {
  const script =
    'import("file://" + process.cwd() + "/src/lib/card.ts").then((m) => {' +
    "  const f = m.deriveCardSecret ?? m.default?.deriveCardSecret;" +
    `  process.stdout.write(f(${JSON.stringify(card)}, ${JSON.stringify(pin)}));` +
    "})";
  const r = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "-e", script], {
    encoding: "utf8",
    env: process.env,
  });
  if (r.status !== 0) throw new Error(`production derivation failed: ${(r.stderr || "").trim().split("\n").pop()}`);
  return r.stdout.trim();
}

async function get(url: string, init: RequestInit = {}) {
  return fetch(url, { redirect: "manual", ...init });
}

/**
 * WP7C. ANY RESPONSE-DERIVED FIGURE, in either language.
 *
 * Not a search for "(3/5)": a surface that leaked the count would more likely
 * do it as "3 tanggapan", "60%", "3 dari 5" or "3 of 5". This matches a figure
 * standing next to any of the words this product would use for one, plus the
 * bare shortfall forms, and it is used where the correct number of such figures
 * is exactly zero.
 */
const ANGKA_TANGGAPAN =
  /\(?\s*\d+\s*(?:\/|dari|of|out of)\s*\d+\s*\)?|\d+\s*%|\d+\s*(?:tanggapan|jawaban|responses?|replies|answers|murid|siswa|students?)|(?:tanggapan|jawaban|responses?|answers?)\s*:?\s*\d+/i;

/**
 * The feedback section of a learner's home, and nothing else on it.
 *
 * THE WHOLE PAGE IS THE WRONG SCOPE and a measured CI failure said so: the
 * learner's home legitimately renders their own lesson progress as "3 dari 5
 * selesai", which the sweep above reads as a response figure. That figure is
 * about this learner's own reading and has nothing to do with anybody's
 * answers. What must carry no figure is the feedback section, so that is what
 * is sliced out and swept.
 */
function bagianUmpanBalik(raw: string): string {
  const mulai = raw.indexOf('aria-labelledby="pin-ub-saya"');
  if (mulai < 0) return "";
  const awal = raw.lastIndexOf("<section", mulai);
  const akhir = raw.indexOf("</section>", mulai);
  return awal >= 0 && akhir > awal ? visibleText(raw.slice(awal, akhir)) : "";
}

function noInternalWords(c: Checks, html: string, where: string) {
  const text = visibleText(html);
  c.expect(!/PINTAR\s*4\.0/i.test(text), `${where} shows the internal version string`);
  for (const w of INTERNAL_WORDS) {
    if (w === "PINTAR 4.0") continue;
    c.expect(!new RegExp(`\\b${w}\\b`).test(text), `${where} shows internal word "${w}"`);
  }
}

export const appTests: SelfTest[] = [
  {
    id: "F01-R01",
    requires: ["app"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;

      const home = await get(`${base}/`);
      c.expect(home.status === 200, `GET / → ${home.status}`);
      noInternalWords(c, await home.text(), "/");

      const masuk = await get(`${base}/masuk`);
      c.expect(masuk.status === 200, `GET /masuk → ${masuk.status}`);
      noInternalWords(c, await masuk.text(), "/masuk");

      const konf = await get(`${base}/konfigurasi`);
      const loc = konf.headers.get("location") ?? "";
      c.expect(
        [302, 303, 307, 308].includes(konf.status) && /\/masuk(\?|$)/.test(loc),
        `unauthenticated /konfigurasi → ${konf.status} ${loc || "(no redirect)"}; expected redirect to /masuk`,
      );

      const up = await get(`${base}/api/assets/upload-url`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
      c.expect(up.status === 401, `unauthenticated POST /api/assets/upload-url → ${up.status}, expected 401`);
      const rd = await get(`${base}/api/assets/read-url?path=profile/x/y.jpg`);
      c.expect(rd.status === 401, `unauthenticated GET /api/assets/read-url → ${rd.status}, expected 401`);

      for (const path of ["/api/dev/ping", "/api/dev", "/api/dev/seed-session", "/api/dev/quick-login"]) {
        const r = await get(`${base}${path}`);
        c.expect(r.status === 404, `production build: GET ${path} → ${r.status}, expected 404`);
        const p = await get(`${base}${path}`, { method: "POST" });
        c.expect(p.status === 404, `production build: POST ${path} → ${p.status}, expected 404`);
      }
      return c.verdict("anonymous access refused; dev tooling absent in the production build; public copy clean");
    },
  },
  {
    id: "F01-R02",
    requires: ["app", "network"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      const refused = t("config.refused", "staff");
      const healthCard = t("config.card.health", "staff");

      const dean = await signIn(ctx, PERSONA.dean);
      const asDean = await get(`${base}/konfigurasi`, { headers: { cookie: dean.cookie } });
      const deanHtml = visibleText(await asDean.text());
      c.expect(asDean.status === 200, `DEAN /konfigurasi → ${asDean.status}, expected a rendered refusal`);
      c.expect(deanHtml.includes(refused), "DEAN did not receive the calm refusal text");
      c.expect(!deanHtml.includes(healthCard) && !deanHtml.includes("Sekolah Sintetis"), "DEAN saw Config Studio content");

      const student = await signIn(ctx, PERSONA.alphaStudent);
      const asStudent = await get(`${base}/konfigurasi`, { headers: { cookie: student.cookie } });
      const studentHtml = visibleText(await asStudent.text());
      c.expect(asStudent.status === 200 && studentHtml.includes(refused), `STUDENT /konfigurasi → ${asStudent.status}, refusal shown=${studentHtml.includes(refused)}`);
      noInternalWords(c, studentHtml, "/konfigurasi as student");

      const admin = await signIn(ctx, PERSONA.alphaAdmin);
      const asAdmin = await get(`${base}/konfigurasi`, { headers: { cookie: admin.cookie } });
      const adminHtml = visibleText(await asAdmin.text());
      c.expect(asAdmin.status === 200, `INSTITUTION_ADMIN /konfigurasi → ${asAdmin.status}`);
      c.expect(adminHtml.includes(t("config.title", "staff")) && adminHtml.includes(healthCard), "INSTITUTION_ADMIN did not get the Config Studio");
      c.expect(adminHtml.includes("Sekolah Sintetis Alpha"), "Alpha admin does not see Alpha");
      c.expect(!adminHtml.includes("Sekolah Sintetis Beta"), "Alpha admin sees Beta (INV-13 at the app layer)");
      return c.verdict("DEAN and STUDENT refused cleanly; INSTITUTION_ADMIN sees own institution only");
    },
  },
  {
    id: "F01-R03",
    requires: ["network"],
    run: async (ctx) => {
      const c = new Checks();
      const s = `${ctx.supabaseUrl}/storage/v1`;
      const anon = { apikey: ctx.supabaseAnonKey!, authorization: `Bearer ${ctx.supabaseAnonKey!}` };
      const knownPath = `selftest/known-${Date.now()}.txt`;

      // A real object to guess at, placed by the server-side (service_role) path only when that key is available to the runner.
      let seeded = false;
      if (ctx.supabaseServiceRoleKey) {
        const put = await fetch(`${s}/object/assets/${knownPath}`, {
          method: "POST",
          headers: { apikey: ctx.supabaseServiceRoleKey, authorization: `Bearer ${ctx.supabaseServiceRoleKey}`, "content-type": "text/plain" },
          body: "selftest object",
        });
        seeded = put.ok;
        c.expect(seeded, `service-role seeding of a known object failed (${put.status})`);
      }
      const target = seeded ? knownPath : "profile/00000000-0000-0000-0000-000000000000/photo.jpg";

      // anonymous: public URL, direct object URL, listing
      const pub = await fetch(`${s}/object/public/assets/${target}`);
      c.expect(pub.status !== 200, `anonymous public-URL fetch returned ${pub.status}`);
      const direct = await fetch(`${s}/object/assets/${target}`, { headers: anon });
      c.expect(direct.status !== 200, `anonymous authenticated-URL fetch returned ${direct.status}`);
      const list = await fetch(`${s}/object/list/assets`, { method: "POST", headers: { ...anon, "content-type": "application/json" }, body: JSON.stringify({ prefix: "", limit: 100 }) });
      const listed = list.ok ? ((await list.json()) as unknown[]) : [];
      c.expect(!list.ok || listed.length === 0, `anonymous listing returned ${listed.length} object(s)`);

      // a real student JWT: cannot fetch by guessing, cannot list, cannot create or overwrite outside the server route
      const student = await signIn(ctx, PERSONA.alphaStudent);
      const auth = { apikey: ctx.supabaseAnonKey!, authorization: `Bearer ${student.accessToken}` };
      const sFetch = await fetch(`${s}/object/assets/${target}`, { headers: auth });
      c.expect(sFetch.status !== 200, `student fetch by path returned ${sFetch.status}`);
      const sList = await fetch(`${s}/object/list/assets`, { method: "POST", headers: { ...auth, "content-type": "application/json" }, body: JSON.stringify({ prefix: "", limit: 100 }) });
      const sListed = sList.ok ? ((await sList.json()) as unknown[]) : [];
      c.expect(!sList.ok || sListed.length === 0, `student listing returned ${sListed.length} object(s)`);
      const sCreate = await fetch(`${s}/object/assets/selftest/student-${Date.now()}.txt`, { method: "POST", headers: { ...auth, "content-type": "text/plain" }, body: "x" });
      c.expect(!sCreate.ok, `student direct upload succeeded (${sCreate.status})`);
      const sOverwrite = await fetch(`${s}/object/assets/${target}`, { method: "PUT", headers: { ...auth, "content-type": "text/plain", "x-upsert": "true" }, body: "overwritten" });
      c.expect(!sOverwrite.ok, `student overwrite outside the server route succeeded (${sOverwrite.status})`);

      if (seeded) {
        await fetch(`${s}/object/assets`, {
          method: "DELETE",
          headers: { apikey: ctx.supabaseServiceRoleKey!, authorization: `Bearer ${ctx.supabaseServiceRoleKey!}`, "content-type": "application/json" },
          body: JSON.stringify({ prefixes: [knownPath] }),
        });
      }
      c.note(seeded ? "known object seeded via service_role" : "no service_role key: guessed path only");
      return c.verdict("bucket closed to anon and to a real student JWT: no fetch, list, create or overwrite");
    },
  },
  {
    id: "F01-R04",
    requires: ["ci"],
    run: async (ctx) => {
      const c = new Checks();
      const up = ctx.ciUpstream ?? {};
      for (const job of ["migrations-clean", "migrations-upgrade-path", "red-case"]) {
        c.expect(up[job] === "success", `upstream CI job "${job}" result: ${up[job] ?? "missing"}`);
      }
      return c.verdict("clean-install and upgrade-path migration jobs green; deliberately broken build went red");
    },
  },
  {
    id: "F01-R05",
    requires: ["app", "network"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      const healthCard = t("config.card.health", "staff");

      // Control: an unrelated live session, so a later refusal is attributable
      // to the sign-out and not to a broken endpoint or bad credentials.
      // A different persona, because signOut() is global for the user it signs out.
      const control = await signIn(ctx, PERSONA.alphaStudent);
      const controlRefresh = await refresh(ctx, control.refreshToken);
      c.expect(controlRefresh.ok, `control refresh failed (${controlRefresh.status}); the rest of this test would prove nothing`);

      // 1. signed in, the protected route answers
      const admin = await signIn(ctx, PERSONA.alphaAdmin);
      const before = await get(`${base}/konfigurasi`, { headers: { cookie: admin.cookie } });
      const beforeHtml = visibleText(await before.text());
      c.expect(before.status === 200, `signed-in /konfigurasi → ${before.status}, expected 200`);
      c.expect(beforeHtml.includes(healthCard), "signed-in /konfigurasi did not render the Config Studio");

      // 2. sign out through the route the UI posts to
      const out = await get(`${base}/keluar`, { method: "POST", headers: { cookie: admin.cookie } });
      c.expect([302, 303, 307, 308].includes(out.status), `POST /keluar → ${out.status}, expected a redirect`);
      const cleared = out.headers.getSetCookie().filter((sc) => /^sb-/.test(sc));
      c.expect(cleared.length > 0, "sign-out set no auth cookie headers, so the browser was never told to forget the session");

      // 3. server-side invalidation: the session handle is dead, not merely forgotten
      const after = await refresh(ctx, admin.refreshToken);
      c.expect(!after.ok, `the signed-out refresh token still bought a session (${after.status}) — sign-out did not invalidate it server-side`);

      // 4. the previously authenticated browser cannot reach the protected route
      const replay = await get(`${base}/konfigurasi`, { headers: { cookie: admin.cookie } });
      const loc = replay.headers.get("location") ?? "";
      const refused = [302, 303, 307, 308].includes(replay.status) && /\/masuk(\?|$)/.test(loc);
      c.expect(refused, `replaying the pre-sign-out cookie → ${replay.status} ${loc || "(no redirect)"}; expected a redirect to /masuk`);

      // the control session is untouched: sign-out was scoped to the user who signed out
      const controlStill = await get(`${base}/konfigurasi`, { headers: { cookie: control.cookie } });
      c.expect(controlStill.status === 200, `an unrelated session was collaterally signed out (${controlStill.status})`);

      c.note(`${cleared.length} auth cookie(s) cleared`);
      return c.verdict("sign-out revokes the session server-side; the previously authenticated browser is refused; other sessions survive");
    },
  },
  {
    id: "F01-R06",
    requires: ["app", "network"],
    run: async (ctx) => {
      const c = new Checks();

      // 1. the configured pepper satisfies the production contract. src/lib/env.ts
      //    rejects anything under 32 characters outside development, and the
      //    selftest app runs under NODE_ENV=production — so a short pepper makes
      //    every card sign-in throw rather than fail closed.
      const pepper = process.env.CARD_PEPPER ?? "";
      c.expect(
        pepper.length >= 32,
        `CARD_PEPPER is ${pepper.length} characters; src/lib/env.ts requires >= 32 outside development`,
      );

      // 2. the production TypeScript derivation runs and returns a well-formed secret.
      let secret = "";
      try {
        secret = productionDerivation("7001", "2468");
      } catch (e) {
        c.expect(false, (e as Error).message);
      }
      c.expect(/^[0-9a-f]{64}$/.test(secret), `production derivation returned ${JSON.stringify(secret.slice(0, 16))}…`);

      // 3. that secret authenticates the seeded card identity through real GoTrue.
      //    The stored hash was produced by the SQL formula in supabase/seed/synthetic.sql,
      //    so a successful sign-in *is* the proof that the two derivations agree — no
      //    separate comparison is needed, and none would be trustworthy.
      const host = process.env.CARD_EMAIL_DOMAIN ?? "cards.pintar.internal";
      let signedIn = false;
      if (secret) {
        try {
          await signIn(ctx, { email: `card-7001@${host}`, password: secret });
          signedIn = true;
        } catch (e) {
          c.expect(false, `card 7001 / PIN 2468 did not authenticate: ${(e as Error).message}`);
        }
      }
      c.expect(signedIn, "no session established for the seeded classroom card");

      c.note(`pepper ${pepper.length} chars; domain ${host}`);
      return c.verdict("configured pepper meets the production contract; the production derivation authenticates the seeded card through real GoTrue");
    },
  },
  {
    id: "F03-R01",
    requires: ["app", "network"],
    run: async (ctx) => {
      // §8: onboarding reaches the cycle. Over real HTTP, with a real session
      // cookie, through the same middleware a browser meets — an anonymous
      // request is sent to sign in and never sees a learner surface.
      const c = new Checks();
      const base = ctx.appUrl!;

      const anon = await get(`${base}/belajar`);
      const loc = anon.headers.get("location") ?? "";
      c.expect(
        [302, 303, 307, 308].includes(anon.status) && /\/masuk(\?|$)/.test(loc),
        `anonymous /belajar → ${anon.status} ${loc || "(no redirect)"}; expected a redirect to sign in`,
      );
      c.expect(/lanjut=%2Fbelajar|lanjut=\/belajar/.test(loc), `the redirect lost where the learner was going: ${loc}`);

      const learner = await signIn(ctx, PERSONA.cycleLearner);
      const mine = await get(`${base}/belajar`, { headers: { cookie: learner.cookie } });
      c.expect(mine.status === 200, `signed-in /belajar → ${mine.status}`);
      const html = await mine.text();
      const text = visibleText(html);
      noInternalWords(c, html, "/belajar");

      // the seeded course reaches the learner, and the link into the cycle works
      c.expect(text.includes("Pecahan"), "the assigned course does not appear on the learner's own page");
      const href = /\/belajar\/([0-9a-f-]{36})/.exec(html)?.[0];
      if (c.expect(Boolean(href), "no link into a cycle was rendered")) {
        const cycle = await get(`${base}${href}`, { headers: { cookie: learner.cookie } });
        c.expect(cycle.status === 200, `signed-in ${href} → ${cycle.status}`);
        noInternalWords(c, await cycle.text(), href!);
      }

      // a learner surface is never reachable without the session
      const stolen = await get(`${base}${href ?? "/belajar"}`);
      c.expect(
        [302, 303, 307, 308].includes(stolen.status),
        `anonymous ${href} → ${stolen.status}; expected a redirect`,
      );
      return c.verdict("an anonymous request is sent to sign in and keeps its destination; a signed-in learner reaches their assigned cycle");
    },
  },
  {
    id: "F03-R02",
    requires: ["app", "network"],
    run: async (ctx) => {
      // §9, the calm surface, checked as a route inventory rather than by
      // reading screens: every learner route is fetched as a real learner and
      // scanned for the words that must never reach one — lifecycle enums,
      // evidence classes, engine and scoring-policy versions, release hashes.
      const c = new Checks();
      const base = ctx.appUrl!;
      const learner = await signIn(ctx, PERSONA.cycleLearner);
      const headers = { cookie: learner.cookie };

      const routes: string[] = [...LEARNER_ROUTES];
      const index = await get(`${base}/belajar`, { headers });
      const indexHtml = await index.text();
      const tugas = /\/belajar\/([0-9a-f-]{36})/.exec(indexHtml)?.[1];
      if (c.expect(Boolean(tugas), "no assignment was rendered, so there is nothing to inventory")) {
        routes.push(`/belajar/${tugas}`, `/belajar/${tugas}/pemetaan`, `/belajar/${tugas}/peta`,
                    `/belajar/${tugas}/penguasaan`, `/belajar/${tugas}/hasil`);
        const cycle = await get(`${base}/belajar/${tugas}`, { headers });
        const lesson = /\/belajar\/[0-9a-f-]{36}\/pelajaran\/[0-9a-f-]{36}/.exec(await cycle.text())?.[0];
        if (lesson) routes.push(lesson);
      }

      let scanned = 0;
      for (const route of routes) {
        const r = await get(`${base}${route}`, { headers, redirect: "follow" });
        // 404 is a legitimate answer for a step the learner has not reached
        if (r.status === 404) continue;
        c.expect(r.status === 200, `${route} → ${r.status}`);
        const body = await r.text();
        scanned++;
        noInternalWords(c, body, route);
        const visible = visibleText(body);
        // the engine and scoring-policy versions are real strings with a real
        // shape; neither belongs in front of a learner
        c.expect(!/pintar-engine\//.test(visible), `${route} shows the engine version`);
        c.expect(!/pintar-scoring\//.test(visible), `${route} shows the scoring policy version`);
        c.expect(!/\b[0-9a-f]{64}\b/.test(visible), `${route} shows what looks like a release hash`);
        c.expect(!/\b(PRE_TEST|POST_TEST|IN_PROGRESS|FINALIZED|SUBMITTED|CREATED|EXPIRED|TERMINATED)\b/.test(visible),
          `${route} shows a lifecycle enum`);
      }
      c.expect(scanned >= 3, `only ${scanned} learner route(s) rendered; the inventory would be thin`);
      c.note(`${scanned} learner route(s) scanned`);
      return c.verdict("no learner route shows a lifecycle enum, an evidence class, a version string or a release hash");
    },
  },
  {
    id: "F05-R01",
    requires: ["app"],
    run: async (ctx) => {
      // INV-37 at the HTTP layer for the routes this phase added. The proxy is
      // deny-by-default, but "deny-by-default" is a claim about a matcher until
      // something actually knocks on the door. Every Studio route is knocked on
      // anonymously here, including the dynamic ones, which a static route
      // inventory cannot do.
      const c = new Checks();
      const base = ctx.appUrl!;
      const routes = [
        "/studio",
        "/studio/unggah",
        "/studio/tinjau",
        "/studio/kanonik",
        "/studio/definisi",
        "/studio/bank",
        "/studio/integritas",
        "/studio/sertifikat",
        "/studio/kuis",
        "/studio/paket/00000000-0000-0000-0000-000000000000",
        "/studio/kanonik/00000000-0000-0000-0000-000000000000",
        "/studio/pratinjau/00000000-0000-0000-0000-000000000000",
      ];
      for (const path of routes) {
        const r = await get(`${base}${path}`);
        const loc = r.headers.get("location") ?? "";
        c.expect(
          [302, 303, 307, 308].includes(r.status) && /\/masuk(\?|$)/.test(loc),
          `anonymous ${path} → ${r.status} ${loc || "(no redirect)"}; expected a redirect to /masuk`,
        );
        c.expect(!/\bstudio\b/i.test(await r.text()), `${path} leaked Studio content to an anonymous visitor`);
      }
      c.note(`${routes.length} Studio routes knocked on anonymously`);
      return c.verdict("every Studio route, dynamic segments included, refuses an anonymous visitor at the server boundary");
    },
  },
  {
    // S-1 at the OUTPUT level, over every route the application serves.
    //
    // Unauthenticated on purpose: a stranger's view of every page is the widest
    // audience any of them has, and an internal word that reaches it has
    // reached the worst possible reader. Authenticated staff views are covered
    // by the role-specific tests; this is the floor, and it is the one that
    // scales automatically as routes are added.
    id: "F06-R01",
    requires: ["app"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      let scanned = 0;
      for (const route of ROUTE_INVENTORY) {
        const res = await get(`${base}${route}`);
        c.expect(res.status < 500, `GET ${route} → ${res.status}`);
        const body = await res.text();
        noInternalWords(c, body, route);
        scanned += 1;
      }
      return c.verdict(
        `${scanned} served route(s) fetched and scanned for internal words in rendered output; the ` +
          `inventory is the fetch list, and F06-S02 fails if the application serves a route absent from it`,
      );
    },
  },

  // ═══════════════════════════════════════════ WP4 · THE MANAGEMENT SURFACE
  {
    id: "UX1-PIMPINAN-AKSES-01",
    requires: ["app", "network"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      // The two sentences that tell the Management home from the refusal. Both
      // come from the copy table, so this test cannot drift from the product by
      // quoting a string the product stopped using.
      const rumah = t("pimpinan.judul", "staff");
      const ditolak = t("pimpinan.ditolak", "staff");

      const lihat = async (persona: { email: string; password: string }, path = "/pimpinan") => {
        const sesi = await signIn(ctx, persona);
        const res = await get(`${base}${path}`, { headers: { cookie: sesi.cookie } });
        return { res, html: visibleText(await res.text()), sesi };
      };

      // 1. BOTH MANAGEMENT ROLES GET THE MANAGEMENT EXPERIENCE, over the scope
      //    the school assigned them. A dean stands at the institution node and a
      //    head of department at one department, and both are Management.
      const dean = await lihat(PERSONA.dean);
      c.expect(dean.res.status === 200, `DEAN /pimpinan → ${dean.res.status}`);
      c.expect(dean.html.includes(rumah), "DEAN did not receive the Management home");
      c.expect(!dean.html.includes(ditolak), "DEAN was refused the Management home");
      noInternalWords(c, dean.html, "/pimpinan as DEAN");

      const hod = await lihat(PERSONA.alphaHod);
      c.expect(hod.res.status === 200, `HEAD_OF_DEPARTMENT /pimpinan → ${hod.res.status}`);
      c.expect(hod.html.includes(rumah), "HEAD_OF_DEPARTMENT did not receive the Management home");
      c.expect(!hod.html.includes(ditolak), "HEAD_OF_DEPARTMENT was refused the Management home");

      // 2. AN ADMINISTRATOR IS NOT MANAGEMENT, AND THIS IS THE CASE THAT MATTERS
      //    MOST. INSTITUTION_ADMIN outranks both Management roles and sits in
      //    `allowed_audiences` for almost the whole metric catalogue, so a
      //    surface that had gated on "may this reader see these figures" would
      //    have admitted them. `management_scope_over_node` refuses them by
      //    name, and this proves the surface asks that question and not the
      //    other one.
      const admin = await lihat(PERSONA.alphaAdmin);
      c.expect(admin.res.status === 200, `INSTITUTION_ADMIN /pimpinan → ${admin.res.status}`);
      c.expect(admin.html.includes(ditolak),
        "INSTITUTION_ADMIN was given the academic Management experience for being an administrator");
      c.expect(!admin.html.includes(rumah), "INSTITUTION_ADMIN saw Management home content");

      // 3. NEITHER IS AN EDUCATOR, NOR A LEARNER.
      for (const [nama, persona] of [["EDUCATOR", PERSONA.alphaGuru], ["STUDENT", PERSONA.alphaStudent]] as const) {
        const r = await lihat(persona);
        c.expect(r.res.status === 200 && r.html.includes(ditolak),
          `${nama} /pimpinan → ${r.res.status}, refusal shown=${r.html.includes(ditolak)}`);
        c.expect(!r.html.includes(rumah), `${nama} saw Management home content`);
        noInternalWords(c, r.html, `/pimpinan as ${nama}`);
      }

      // 4. THE JOURNEY EXISTS AND IS SCOPED. The home offers a way into one part
      //    of the school; that node is taken from the dean's own page rather
      //    than invented, so this follows the product's own link.
      const simpul = /\/pimpinan\/([0-9a-f-]{36})/.exec(
        await (await get(`${base}/pimpinan`, { headers: { cookie: dean.sesi.cookie } })).text(),
      )?.[1];
      if (c.expect(Boolean(simpul), "the Management home offers no way into a part of the school")) {
        const dalam = await get(`${base}/pimpinan/${simpul}`, { headers: { cookie: dean.sesi.cookie } });
        const dalamHtml = visibleText(await dalam.text());
        c.expect(dalam.status === 200 && !dalamHtml.includes(ditolak),
          `DEAN was refused their own node → ${dalam.status}`);
        const daftar = await get(`${base}/pimpinan/${simpul}/murid`, { headers: { cookie: dean.sesi.cookie } });
        const daftarHtml = visibleText(await daftar.text());
        c.expect(daftar.status === 200 && !daftarHtml.includes(ditolak),
          `DEAN was refused the roster in their own scope → ${daftar.status}`);
        noInternalWords(c, daftarHtml, "the Management roster");

        // 5. AND THE SAME NODE IS REFUSED TO SOMEBODY WHO DOES NOT STAND OVER
        //    IT. A real node id, a real session, and no Management authority
        //    over it: this is the out-of-scope case rather than a made-up uuid,
        //    which would only prove that a stranger's id is refused.
        for (const [nama, persona] of [["EDUCATOR", PERSONA.alphaGuru],
                                       ["INSTITUTION_ADMIN", PERSONA.alphaAdmin]] as const) {
          const sesi = await signIn(ctx, persona);
          for (const path of [`/pimpinan/${simpul}`, `/pimpinan/${simpul}/murid`]) {
            const res = await get(`${base}${path}`, { headers: { cookie: sesi.cookie } });
            const html = visibleText(await res.text());
            c.expect(html.includes(ditolak), `${nama} reached ${path} without Management authority over it`);
          }
        }
      }

      // 6. A STRANGER GETS NOWHERE. The proxy refuses an anonymous caller before
      //    the page decides anything.
      const anon = await get(`${base}/pimpinan`, { redirect: "manual" });
      c.expect(anon.status >= 300 && anon.status < 400,
        `an anonymous caller reached /pimpinan with ${anon.status}`);

      return c.verdict(
        "the Management experience reaches exactly the two roles the WP1 ruling names: a DEAN standing " +
        "at the institution and a HEAD_OF_DEPARTMENT standing at one department both receive it, while " +
        "an INSTITUTION_ADMIN -- who outranks both and whom the metric catalogue's own audiences would " +
        "have admitted -- is refused by name, as are an EDUCATOR and a STUDENT, each through the same " +
        "one refusal page. The journey from the home into a part of the school and on to its roster " +
        "works for the dean and is refused on the SAME REAL NODE to two readers without Management " +
        "authority over it, and an anonymous caller never reaches the page at all",
      );
    },
  },
  {
    id: "UX1-AJAR-BELAJAR-01",
    requires: ["app", "network"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;

      // Every sentence this test looks for is READ FROM THE COPY TABLE rather
      // than quoted, so a test that still passes is a test about the product
      // and not about a string somebody once wrote here.
      const pembelajaran = t("nav.pembelajaran", "educator");
      const milik = t("pembelajaran.milik", "educator");
      const kosong = t("pembelajaran.kosong", "educator");
      const kelas = t("nav.kelas", "educator");
      const tabBelajar = t("nav.belajar", "learner");
      const tabSertifikat = t("nav.sertifikat", "learner");
      const turBelajar = t("tur.nama.belajar", "learner");
      const murid = t("role.STUDENT", "learner");

      const lihat = async (persona: { email: string; password: string }, path: string) => {
        const sesi = await signIn(ctx, persona);
        const res = await get(`${base}${path}`, { headers: { cookie: sesi.cookie } });
        const raw = await res.text();
        return { res, raw, html: visibleText(raw), sesi };
      };

      // 1. THE DOOR, AND IT IS ONE DOOR. The educator's header gains exactly one
      //    neighbour and keeps the tab it had: this is a second context, not a
      //    redesigned navigation and not a switch between identities.
      const ajar = await lihat(PERSONA.cycleEducator, "/mengajar");
      c.expect(ajar.res.status === 200, `EDUCATOR /mengajar → ${ajar.res.status}`);
      c.expect(ajar.html.includes(pembelajaran), "the teaching header offers no way to the educator's own learning");
      c.expect(ajar.html.includes(kelas), "the teaching tab is gone from the teaching header");
      c.expect(/href="\/belajar"/.test(ajar.raw), "the entry names Pembelajaran Saya but leads nowhere");

      // 2. WHAT IS ON THE PAGE IS WHAT THE DATABASE SAID, ASKED SEPARATELY.
      //    `my_learning_assignments` is called directly with each persona's own
      //    JWT, so the expected answer comes from the contract rather than from
      //    this file's idea of the fixture — and a page that rendered one row
      //    too many or one too few is caught by comparison rather than by a
      //    quoted title.
      const tugasDari = async (sesi: Session): Promise<Array<{ title: string }>> => {
        const r = await fetch(`${ctx.supabaseUrl}/rest/v1/rpc/my_learning_assignments`, {
          method: "POST",
          headers: {
            apikey: ctx.supabaseAnonKey!,
            authorization: `Bearer ${sesi.accessToken}`,
            "content-type": "application/json",
          },
          body: "{}",
        });
        if (!r.ok) return [];
        const j = (await r.json()) as unknown;
        return Array.isArray(j) ? (j as Array<{ title: string }>) : [];
      };

      const belajarMurid = await lihat(PERSONA.cycleLearner, "/belajar");
      c.expect(belajarMurid.res.status === 200, `learner /belajar → ${belajarMurid.res.status}`);
      const tugasMurid = await tugasDari(belajarMurid.sesi);

      const punya = await lihat(PERSONA.cycleEducator, "/belajar");
      const tugasPunya = await tugasDari(punya.sesi);
      c.expect(punya.res.status === 200, `EDUCATOR-who-learns /belajar → ${punya.res.status}`);
      c.expect(punya.html.includes(pembelajaran), "the educator's own learning is not named Pembelajaran Saya");
      c.expect(punya.html.includes(milik), "nothing tells the educator this learning is theirs and not their teaching");

      //    THE FIXTURE MUST BE CAPABLE OF FAILING. An educator offered nothing
      //    would make every assertion below vacuously true, so the entitlement
      //    is asserted to exist before it is asserted to be rendered.
      c.expect(tugasPunya.length > 0,
        "the enrolled educator holds no learning entitlement, so this test could prove nothing");
      for (const a of tugasPunya) {
        c.expect(punya.html.includes(a.title), `the educator's own learning "${a.title}" is not on their page`);
      }
      //    …and it is the same course their class's learner is doing, through
      //    the same engine — not a second, educator-shaped one.
      c.expect(tugasPunya.every((a) => tugasMurid.some((b) => b.title === a.title)),
        "the educator's learning is not the learning their own class is doing");
      c.expect(!punya.html.includes(kosong), "an educator WITH learning was told they have none");
      //    …and they never left their teaching context to read it.
      c.expect(/href="\/mengajar"/.test(punya.raw), "the educator's learning page strands them away from their classes");
      c.expect(punya.html.includes(kelas), "the educator's learning page drops the teaching tab");

      // 3. THE SAME ROLE WITHOUT AN ENROLMENT IS OFFERED NOTHING. This is the
      //    one that would catch entitlement being manufactured here: both
      //    personas hold EDUCATOR, and only one holds a learning enrolment, so
      //    a surface that inferred "educator, therefore learner" would hand
      //    this one somebody else's course.
      const tanpa = await lihat(PERSONA.alphaGuru, "/belajar");
      const tugasTanpa = await tugasDari(tanpa.sesi);
      c.expect(tanpa.res.status === 200, `EDUCATOR-without-learning /belajar → ${tanpa.res.status}`);
      c.expect(tugasTanpa.length === 0,
        `the unenrolled educator holds ${tugasTanpa.length} entitlement(s), so the pairing proves nothing`);
      c.expect(tanpa.html.includes(kosong), "an educator with no learning is not told so in the agreed sentence");
      for (const a of tugasPunya) {
        c.expect(!tanpa.html.includes(a.title),
          `an educator with no enrolment was offered "${a.title}", which belongs to a different educator`);
      }
      //    AND THE EMPTY PAGE IS NOT AN ERROR. It carries the surface's own
      //    name and its own reassurance, which a refusal page does not have.
      c.expect(tanpa.html.includes(pembelajaran) && tanpa.html.includes(milik),
        "the empty state is not the Pembelajaran Saya surface at all");
      c.expect(!/\b(ditolak|tidak diizinkan|tidak berhak|galat|not permitted|refused|error)\b/i.test(tanpa.html),
        "the empty state reads as a refusal, a permission problem or a fault");

      // 4. NOBODY BECAME A STUDENT. No learner onboarding is mounted for either
      //    educator — the tour's root element is absent, so it cannot be opened
      //    by any means — and nothing addresses them as a learner.
      for (const [nama, r] of [["enrolled", punya], ["unenrolled", tanpa]] as const) {
        c.expect(!/pin-tur-akar/.test(r.raw), `the learner first-login tour is mounted for the ${nama} educator`);
        c.expect(!r.html.includes(turBelajar), `the ${nama} educator is offered the learner's tour by name`);
        c.expect(!/data-tur="bantuan"/.test(r.raw), `the ${nama} educator's learning page offers Help that leads to the wrong map`);
        c.expect(!new RegExp(`\\b${murid}\\b`).test(r.html), `the ${nama} educator is addressed as "${murid}"`);
        noInternalWords(c, r.html, `/belajar as an ${nama} educator`);
      }

      // 5. A LEARNER IS UNTOUCHED. Their two tabs, their tour, and no door into
      //    a teaching context that is not theirs.
      c.expect(belajarMurid.html.includes(tabBelajar) && belajarMurid.html.includes(tabSertifikat),
        "the learner lost their own shell");
      c.expect(!/href="\/mengajar"/.test(belajarMurid.raw), "a learner was offered a way into teaching");
      c.expect(!belajarMurid.html.includes(pembelajaran), "a learner's own home was renamed for them");
      c.expect(/data-tur="bantuan"/.test(belajarMurid.raw), "the learner lost the Help entry their tour points at");

      // 6. THEIR CERTIFICATES ARE THE ONE CERTIFICATE SURFACE, and reaching it
      //    does not put an educator back into a learner's shell.
      const sert = await lihat(PERSONA.cycleEducator, "/belajar/sertifikat");
      c.expect(sert.res.status === 200, `EDUCATOR /belajar/sertifikat → ${sert.res.status}`);
      c.expect(sert.html.includes(pembelajaran) && sert.html.includes(kelas),
        "an educator reading their own certificates is put into the learner's shell");
      c.expect(!sert.html.includes(tabBelajar) || sert.html.includes(pembelajaran),
        "the educator's certificate page shows the learner navigation");
      noInternalWords(c, sert.html, "/belajar/sertifikat as an educator");

      c.note(`${tugasPunya.length} entitlement(s) for the enrolled educator, ${tugasTanpa.length} for the unenrolled one`);
      return c.verdict(
        "an educator's own learning is a second context and never a second identity: the teaching header " +
        "gains exactly one neighbour, Pembelajaran Saya, and keeps Kelas -- so the way in is one press " +
        "and the way back is always on screen. WHAT THEY ARE OFFERED IS THEIR ENROLMENT AND NEVER THEIR " +
        "ROLE, proved on two educators rather than argued: `my_learning_assignments` is asked directly " +
        "with each persona's own token and its answer is compared with the page, so the expectation " +
        "comes from the contract and not from this file's idea of the fixture. The enrolled educator " +
        "holds at least one entitlement -- asserted, because nothing offered would make the rest " +
        "vacuous -- every row of it is on their page, and it is the SAME course their own class's " +
        "learner is doing rather than a second educator-shaped one; the educator holding the same role " +
        "with no enrolment holds nothing by the database's own answer and is told so in the agreed " +
        "sentence, and is offered none of the other educator's rows, on a page that carries the " +
        "surface's own name and its own reassurance and reads as neither a refusal, a permission " +
        "problem nor a fault. NOBODY BECAME A STUDENT: the learner first-login tour is not mounted for " +
        "either educator, so it cannot be opened by any means; neither is offered it by name; neither " +
        "is addressed as a learner; and no Help entry leads them to a map that is not theirs. A learner " +
        "keeps their own two tabs, their own tour and their own Help, and is offered no way into a " +
        "teaching context. And an educator reading their own certificates stays in their own shell, on " +
        "the one certificate surface that already existed",
      );
    },
  },
  {
    id: "UX1-UB-ALUR-01",
    requires: ["app", "network"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      const anon = ctx.supabaseAnonKey!;

      const lihat = async (p: { email: string; password: string }, path: string) => {
        const sesi = await signIn(ctx, p);
        const res = await get(`${base}${path}`, { headers: { cookie: sesi.cookie } });
        const raw = await res.text();
        return { res, raw, html: visibleText(raw), sesi };
      };
      const rpc = async (sesi: Session, fn: string, body: unknown) => {
        const r = await fetch(`${ctx.supabaseUrl}/rest/v1/rpc/${fn}`, {
          method: "POST",
          headers: { apikey: anon, authorization: `Bearer ${sesi.accessToken}`, "content-type": "application/json" },
          body: JSON.stringify(body ?? {}),
        });
        return { ok: r.ok, body: r.ok ? await r.json() : await r.text() };
      };

      // Copy read from the table, never quoted, so this test cannot pass by
      // agreeing with a string somebody stopped using.
      const DITAHAN = t("umpanbalik.hasil.belum_cukup_tanggapan", "educator");
      const TERKUMPUL = t("umpanbalik.hasil.belum_ditutup", "educator");
      const BERI = t("umpanbalik.murid.beri", "learner");
      const SUDAH = t("umpanbalik.murid.sudah", "learner");
      const KOSONG_GURU = t("umpanbalik.guru.kosong", "educator");
      const TOLAK = t("umpanbalik.ditolak", "staff");

      // ── 0. BUILD A REAL ROUND, THROUGH THE PRODUCT'S OWN ENDPOINTS. No seed
      //    and no service role: the head of department opens it exactly as they
      //    would in a school, which also measures that they may.
      const guru = await signIn(ctx, PERSONA.cycleEducator);
      const kelasHal = await get(`${base}/mengajar`, { headers: { cookie: guru.cookie } });
      const kelasId = /\/mengajar\/([0-9a-f-]{36})/.exec(await kelasHal.text())?.[1];
      if (!c.expect(Boolean(kelasId), "the fixture educator teaches no class, so no round can be opened")) {
        return c.verdict("no class to open a feedback round over");
      }
      const aku = await fetch(`${ctx.supabaseUrl}/rest/v1/my_profile?select=person_id`, {
        headers: { apikey: anon, authorization: `Bearer ${guru.accessToken}` },
      });
      const guruId = ((await aku.json()) as Array<{ person_id: string }>)[0]?.person_id;
      c.expect(Boolean(guruId), "the fixture educator has no person id");

      const hod = await signIn(ctx, PERSONA.cycleHod);
      const buka = await rpc(hod, "open_feedback_cycle", { p_node: kelasId, p_subject_person_id: guruId });
      // A re-run against a database that already carries the round is not a
      // failure: the unique index is WP7B refusing a second overlapping
      // population, which is the differencing attack.
      let siklusId = buka.ok ? String(buka.body) : "";
      if (!buka.ok) {
        c.expect(/already has a feedback cycle/.test(String(buka.body)),
          `Management could not open a feedback round: ${String(buka.body).slice(0, 120)}`);
        const ada = await fetch(
          `${ctx.supabaseUrl}/rest/v1/feedback_cycles?select=id&scope_node_id=eq.${kelasId}`,
          { headers: { apikey: anon, authorization: `Bearer ${hod.accessToken}` } },
        );
        siklusId = ((await ada.json()) as Array<{ id: string }>)[0]?.id ?? "";
      }
      if (!c.expect(Boolean(siklusId), "no feedback round exists to measure")) {
        return c.verdict("no feedback round to measure");
      }

      // ── 1. THE STUDENT IS ASKED, AND KNOWS THE FOUR THINGS §5 NAMES.
      const murid = await lihat(PERSONA.cycleLearner, "/belajar");
      c.expect(murid.res.status === 200, `learner /belajar → ${murid.res.status}`);
      c.expect(murid.html.includes(t("umpanbalik.murid.judul", "learner")),
        "an eligible learner is not told feedback is waiting for them");
      c.expect(new RegExp(`/belajar/umpan-balik/${siklusId}`).test(murid.raw),
        "the eligible learner is offered no way into the round they were asked for");
      c.expect(murid.html.includes(BERI), "the eligible learner is offered no action");
      const bagianMurid = bagianUmpanBalik(murid.raw);
      c.expect(bagianMurid.includes(BERI), "the feedback section could not be isolated from the page");
      c.expect(!ANGKA_TANGGAPAN.test(bagianMurid),
        `the feedback section carries a figure: "${ANGKA_TANGGAPAN.exec(bagianMurid)?.[0]}"`);
      noInternalWords(c, murid.html, "/belajar with a feedback round open");

      // ── 2. AND A LEARNER WHO WAS NOT ASKED SEES NOTHING. A different school
      //    entirely: `my_feedback_cycles` returns their own rows, so there is
      //    nothing to filter out here — there is nothing to filter.
      const asing = await lihat(PERSONA.alphaStudent, "/belajar");
      c.expect(asing.res.status === 200, `uninvolved learner /belajar → ${asing.res.status}`);
      c.expect(!asing.raw.includes(siklusId), "a learner who was not asked can see the round exists");
      c.expect(!asing.html.includes(BERI), "a learner who was not asked is offered the action anyway");
      //    …and the address bar tells them nothing either: the refusal for a
      //    round that is not theirs is the same page as for one that does not
      //    exist.
      const curi = await lihat(PERSONA.alphaStudent, `/belajar/umpan-balik/${siklusId}`);
      const hantu = await lihat(PERSONA.alphaStudent, "/belajar/umpan-balik/00000000-0000-0000-0000-000000000000");
      c.expect(curi.html === hantu.html,
        "a round that is not yours reads differently from one that does not exist");

      // ── 3. THE SHEET: five closed questions, and nowhere to type.
      const lembar = await lihat(PERSONA.cycleLearner, `/belajar/umpan-balik/${siklusId}`);
      c.expect(lembar.res.status === 200, `the sheet → ${lembar.res.status}`);
      const fieldsets = (lembar.raw.match(/<fieldset/g) ?? []).length;
      c.expect(fieldsets === 5, `${fieldsets} question group(s) on the sheet; FQ-1 has five`);
      const radios = (lembar.raw.match(/type="radio"/g) ?? []).length;
      c.expect(radios === 20, `${radios} option(s) on the sheet; five questions of four is twenty`);
      for (const bidang of ["<textarea", 'type="text"', 'type="search"', "contenteditable"]) {
        c.expect(!lembar.raw.toLowerCase().includes(bidang), `the sheet carries a free-text field: ${bidang}`);
      }
      c.expect(!ANGKA_TANGGAPAN.test(lembar.html),
        `the sheet shows a response figure: "${ANGKA_TANGGAPAN.exec(lembar.html)?.[0]}"`);
      noInternalWords(c, lembar.html, "the feedback sheet");

      // ── 4. WHILE THE ROUND IS OPEN, NEITHER READER GETS A NUMBER. This is
      //    the measurement §25 exists for, taken on a real open cycle.
      const guruBuka = await lihat(PERSONA.cycleEducator, `/mengajar/${kelasId}/umpan-balik`);
      c.expect(guruBuka.res.status === 200, `the subject's own page → ${guruBuka.res.status}`);
      c.expect(guruBuka.html.includes(TERKUMPUL), "an open round does not say it is still collecting");
      c.expect(!guruBuka.html.includes(DITAHAN), "an open round claims it closed below the threshold");
      c.expect(!ANGKA_TANGGAPAN.test(guruBuka.html),
        `the subject sees a response figure while the round is open: "${ANGKA_TANGGAPAN.exec(guruBuka.html)?.[0]}"`);
      noInternalWords(c, guruBuka.html, "the subject's open round");

      const simpulHal = await get(`${base}/pimpinan`, { headers: { cookie: hod.cookie } });
      const simpulId = /\/pimpinan\/([0-9a-f-]{36})/.exec(await simpulHal.text())?.[1];
      if (c.expect(Boolean(simpulId), "Management is offered no part of the school")) {
        const daftar = await lihat(PERSONA.cycleHod, `/pimpinan/${simpulId}/umpan-balik`);
        c.expect(daftar.res.status === 200, `Management's feedback list → ${daftar.res.status}`);
        c.expect(daftar.raw.includes(siklusId), "Management cannot see the round over a class in their scope");
        c.expect(!ANGKA_TANGGAPAN.test(daftar.html), "Management's list shows a response figure");
        const satu = await lihat(PERSONA.cycleHod, `/pimpinan/${simpulId}/umpan-balik/${siklusId}`);
        c.expect(satu.html.includes(TERKUMPUL), "Management's view of an open round says something else");
        c.expect(!ANGKA_TANGGAPAN.test(satu.html),
          `Management sees a response figure while the round is open: "${ANGKA_TANGGAPAN.exec(satu.html)?.[0]}"`);
        //    NO RESPONDENT, ANYWHERE. Management authority is authority over a
        //    part of a school, never authority to identify a child.
        c.expect(!/respondent|who answered|siapa yang menjawab|daftar penjawab/i.test(satu.html),
          "Management's view names respondents");
        noInternalWords(c, satu.html, "Management's open round");

        // ── 5. AN ADMINISTRATOR IS NOT MANAGEMENT, AND IS OFFERED NOTHING.
        const adm = await lihat(PERSONA.cycleAdmin, `/pimpinan/${simpulId}/umpan-balik`);
        c.expect(adm.res.status === 200 && adm.html.includes(TOLAK),
          `INSTITUTION_ADMIN reached Management's feedback list → ${adm.res.status}`);
        c.expect(!adm.raw.includes(siklusId), "an administrator can see the round exists");
        const admSatu = await lihat(PERSONA.cycleAdmin, `/pimpinan/${simpulId}/umpan-balik/${siklusId}`);
        c.expect(admSatu.html.includes(TOLAK), "an administrator reached one round's results");
        const konf = await lihat(PERSONA.cycleAdmin, "/konfigurasi");
        c.expect(!/umpan-balik/.test(konf.raw), "the administrator's own surface offers a way in");
      }

      // ── 6. THE SUBJECT DOES NOT READ A COLLEAGUE'S ROUND. A different
      //    school's educator meets the refusal, not the results.
      const lain = await lihat(PERSONA.alphaGuru, `/mengajar/${kelasId}/umpan-balik`);
      c.expect(!lain.raw.includes(TERKUMPUL) || lain.html.includes(TOLAK),
        "another educator read this round");
      c.expect(!ANGKA_TANGGAPAN.test(lain.html), "another educator sees a response figure");

      // ── 7. SENDING ONCE, AND SENDING TWICE. The second press is WP7B's row
      //    lock answering, and the product reads it as "already recorded"
      //    rather than as a failure.
      const belajar = await signIn(ctx, PERSONA.cycleLearner);
      const soal = await rpc(belajar, "feedback_questionnaire", { p_cycle: siklusId });
      const pertanyaan = (soal.body as { questions?: Array<{ question_key: string; options: Array<{ option_key: string }> }> })
        ?.questions ?? [];
      c.expect(pertanyaan.length === 5, `${pertanyaan.length} question(s) from the endpoint; FQ-1 has five`);
      const lembarJawab = Object.fromEntries(pertanyaan.map((q) => [q.question_key, q.options[0].option_key]));
      const kirim1 = await rpc(belajar, "submit_feedback", { p_cycle: siklusId, p_answers: lembarJawab });
      const kirim2 = await rpc(belajar, "submit_feedback", { p_cycle: siklusId, p_answers: lembarJawab });
      c.expect(kirim1.ok || /already answered/.test(String(kirim1.body)),
        `the first submission failed: ${String(kirim1.body).slice(0, 120)}`);
      c.expect(!kirim2.ok && /already answered/.test(String(kirim2.body)),
        "a second submission was accepted");
      //    …and the learner's own home now says so, and still shows no figure.
      const sesudah = await lihat(PERSONA.cycleLearner, "/belajar");
      const bagianSesudah = bagianUmpanBalik(sesudah.raw);
      c.expect(bagianSesudah.length > 0, "the feedback section is gone from the learner's home");
      c.expect(bagianSesudah.includes(SUDAH), "a learner who has answered is not told so");
      c.expect(!bagianSesudah.includes(BERI), "a learner who has answered is offered the action again");
      c.expect(!ANGKA_TANGGAPAN.test(bagianSesudah),
        `the feedback section of the learner's home shows a figure: "${ANGKA_TANGGAPAN.exec(bagianSesudah)?.[0]}"`);

      // ── 8. CLOSED BELOW THE THRESHOLD: THE CANONICAL SENTENCE, AND NOTHING
      //    ELSE. The fixture class is small, so this round cannot publish —
      //    which makes it exactly the state §11 is about.
      const tutup = await rpc(hod, "close_feedback_cycle", { p_cycle: siklusId });
      c.expect(tutup.ok || /already/.test(String(tutup.body)),
        `Management could not close the round: ${String(tutup.body).slice(0, 120)}`);
      const keadaan = tutup.ok ? (tutup.body as { state?: string }).state : "WITHHELD";
      c.expect(keadaan === "WITHHELD",
        `the fixture round closed ${keadaan}; this case measures the withheld surface`);

      const guruTutup = await lihat(PERSONA.cycleEducator, `/mengajar/${kelasId}/umpan-balik`);
      c.expect(guruTutup.html.includes(DITAHAN),
        "a round that closed below the threshold does not carry the canonical statement");
      c.expect(!ANGKA_TANGGAPAN.test(guruTutup.html),
        `the withheld surface carries a response figure: "${ANGKA_TANGGAPAN.exec(guruTutup.html)?.[0]}"`);
      //    NOTHING IS APPENDED TO THE SENTENCE. Measured on the sentence's own
      //    neighbourhood rather than on the whole page, so a class name
      //    elsewhere cannot mask an appended shortfall.
      const sekitar = guruTutup.html.slice(guruTutup.html.indexOf(DITAHAN) + DITAHAN.length).trim().slice(0, 24);
      c.expect(!/^\(?\d/.test(sekitar), `something follows the canonical statement: "${sekitar}"`);
      noInternalWords(c, guruTutup.html, "the subject's withheld round");

      if (simpulId) {
        const pimTutup = await lihat(PERSONA.cycleHod, `/pimpinan/${simpulId}/umpan-balik/${siklusId}`);
        c.expect(pimTutup.html.includes(DITAHAN), "Management gets a different withheld statement");
        c.expect(!ANGKA_TANGGAPAN.test(pimTutup.html), "Management's withheld surface carries a figure");
      }
      //    And the learner is not shown the outcome of the round at all.
      const muridTutup = await lihat(PERSONA.cycleLearner, "/belajar");
      c.expect(!muridTutup.html.includes(DITAHAN) && !muridTutup.html.includes(TERKUMPUL),
        "a learner is shown the round's result state");

      // ── 9. A CLASS WITH NO ROUND SAYS SO, PLAINLY.
      const tanpa = await lihat(PERSONA.alphaGuru, "/mengajar");
      const kelasAlpha = /\/mengajar\/([0-9a-f-]{36})/.exec(tanpa.raw)?.[1];
      if (c.expect(Boolean(kelasAlpha), "the other educator teaches no class")) {
        const sepi = await lihat(PERSONA.alphaGuru, `/mengajar/${kelasAlpha}/umpan-balik`);
        c.expect(sepi.res.status === 200 && sepi.html.includes(KOSONG_GURU),
          "a class with no round does not say so");
        c.expect(!ANGKA_TANGGAPAN.test(sepi.html), "a class with no round shows a figure");
      }

      c.note(`round ${siklusId.slice(0, 8)} closed ${keadaan}; ${fieldsets} question group(s), ${radios} option(s)`);
      return c.verdict(
        "one real feedback round, opened and closed through the product's own endpoints by the head of " +
        "department who may — no seed and no service role — and measured at every surface it touches. " +
        "THE STUDENT is told feedback is waiting, which class and educator it concerns, whether they " +
        "have sent theirs and the one thing to do; a learner who was not asked sees nothing, and the " +
        "address bar tells them nothing either, because a round that is not theirs renders the SAME " +
        "page as one that does not exist. The sheet is five question groups of four closed options " +
        "with no textarea, text input, search field or contenteditable anywhere on it. WHILE THE ROUND " +
        "IS OPEN NEITHER THE SUBJECT NOR MANAGEMENT RECEIVES A FIGURE — measured with a sweep for any " +
        "count, proportion or shortfall — and Management's view names no respondent. An INSTITUTION " +
        "ADMIN standing over the whole school is refused both the list and one round's results, sees " +
        "no round id at all, and is offered no entry point on their own surface; another school's " +
        "educator is refused the round. Sending twice is accepted once: the second press is refused by " +
        "the row lock, and the learner's home then says they have sent theirs and offers the action no " +
        "more. CLOSED BELOW THE THRESHOLD, both readers receive the canonical statement with NOTHING " +
        "after it — checked on the sentence's own neighbourhood, not on the page — and no figure " +
        "anywhere; the learner is shown no outcome at all; and a class with no round says so plainly",
      );
    },
  },
];
