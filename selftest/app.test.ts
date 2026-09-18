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
];
