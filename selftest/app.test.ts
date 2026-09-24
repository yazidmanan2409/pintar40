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
  // DAISY-05 (audit S7b). The platform administrator, who reads every tenant --
  // the national library among them -- and so is the reader a school picker
  // can put in the wrong place.
  sysadmin: { email: "sysadmin@synthetic.pintar.test", password: "Sintetis-Sys-91!" },
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
  // F-01. Account activation — the step after the intake — is a static route
  // like the intake's own entry, so its rendered output is swept too.
  "/aktivasi",
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
    /**
     * INV-38, AGAINST THE MIDDLEWARE RATHER THAN THE DECLARATION.
     *
     * `assert_public_surface()` asserts `public_surface_registry`, which is a
     * statement of intent held in the database. Nothing asserted `src/proxy.ts`,
     * so the two drifted: the registry declared `/api/verifikasi/[token]`
     * "anonymously reachable, and declared as such" while the middleware
     * refused it with 401. Both halves reported success and the public
     * verification surface was dead in production — a QR scan rendered "not
     * found" for any certificate, because the page's own server-side fetch of
     * that endpoint carries no session and was turned away.
     *
     * So this test asks the RUNNING APPLICATION over HTTP, and it asks in both
     * directions. Reachable is not enough on its own: a prefix wide enough to
     * admit the endpoint could also admit its neighbours, so the refusals
     * matter as much as the admission.
     *
     * An unknown token is the whole probe. It reaches the handler, proves
     * routing, and creates nothing: `verify_certificate` refuses it and the
     * route answers its closed `{"found": false}`, deliberately offering no
     * existence oracle. No certificate, person or institution is involved.
     */
    id: "F01-R07",
    requires: ["app"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      const token = `selftest-unknown-${Date.now()}`;

      // POSITIVE — the one declared public endpoint answers anonymously, and
      // answers as ITSELF. A 401 here is the regression; any other refusal
      // shaped by the middleware would be too, so the body is checked.
      const api = await get(`${base}/api/verifikasi/${token}`);
      c.expect(
        api.status !== 401,
        `anonymous GET /api/verifikasi/<token> → 401: the declared public verification endpoint is refused by the middleware`,
      );
      c.expect(
        api.status === 404,
        `anonymous GET /api/verifikasi/<unknown token> → ${api.status}, expected 404 from the handler`,
      );
      const body = await api.text();
      c.expect(
        /"found"\s*:\s*false/.test(body),
        `/api/verifikasi/<unknown token> did not return the route's closed body: ${body.slice(0, 120)}`,
      );

      // and the page above it renders rather than redirecting to sign-in
      const page = await get(`${base}/verifikasi/${token}`);
      c.expect(page.status === 200, `anonymous GET /verifikasi/<token> → ${page.status}, expected 200`);

      // NEGATIVE — the exemption is exactly that surface and no wider. The
      // trailing slash is what makes these refusals hold.
      for (const path of [
        "/api/verifikasi",
        "/api/verifikasi-admin/x",
        "/api/verifikasix/y",
        "/api/certificates/issue",
        "/api/evaluation/assume",
      ]) {
        const r = await get(`${base}${path}`);
        c.expect(
          r.status === 401 || r.status === 404,
          `anonymous GET ${path} → ${r.status}; expected the middleware to refuse it`,
        );
        c.expect(
          r.status !== 200,
          `anonymous GET ${path} → 200: the public exemption is wider than the declared surface`,
        );
      }

      return c.verdict(
        "the declared public verification endpoint is anonymously reachable and answers its own closed body; " +
          "its neighbours under /api remain refused",
      );
    },
  },
  {
    // The sign-in and verification pages are anonymous, and so is everything
    // they load. The middleware gated public/brand and public/fonts behind
    // sign-in, so production answered a stranger's logo and font requests with
    // a redirect to /masuk: a broken mark and fallback type on the front door,
    // invisible to every signed-in test. Asked over HTTP, as a stranger.
    id: "F01-R08",
    requires: ["app"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      const html = await (await get(`${base}/masuk`)).text();
      c.expect(html.includes("/brand/pintar-selalu-logo.png"),
        "/masuk no longer references /brand/pintar-selalu-logo.png, so this test would prove nothing");
      const assets: Array<[string, RegExp]> = [
        ["/brand/pintar-selalu-logo.png", /^image\/png/],
        ["/fonts/plus-jakarta-sans-latin.woff2", /font\/woff2|octet-stream/],
        ["/fonts/plus-jakarta-sans-latin-ext.woff2", /font\/woff2|octet-stream/],
        ["/fonts/ibm-plex-mono-500-latin.woff2", /font\/woff2|octet-stream/],
        ["/fonts/ibm-plex-mono-500-latin-ext.woff2", /font\/woff2|octet-stream/],
      ];
      for (const [path, type] of assets) {
        const r = await get(`${base}${path}`);
        const ct = r.headers.get("content-type") ?? "";
        c.expect(r.status === 200,
          `anonymous GET ${path} → ${r.status} ${r.headers.get("location") ?? ""}; expected the file itself`);
        c.expect(type.test(ct), `anonymous GET ${path} served ${ct || "no content-type"}`);
      }
      // the exemption is those two folders and nothing that merely starts with their names
      for (const path of ["/brandx", "/fontsx/a", "/konfigurasi", "/studio"]) {
        const r = await get(`${base}${path}`);
        const loc = r.headers.get("location") ?? "";
        c.expect([302, 303, 307, 308].includes(r.status) && /\/masuk(\?|$)/.test(loc),
          `anonymous ${path} → ${r.status} ${loc || "(no redirect)"}; expected a redirect to /masuk`);
      }
      return c.verdict(
        "an anonymous visitor receives the logo and all four fonts the sign-in page loads, and the exemption " +
          "stops at public/brand/ and public/fonts/: neighbouring paths and protected routes still redirect to /masuk",
      );
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
  {
    id: "UX1-UB-BUKA-ALUR-01",
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
      const orangku = async (sesi: Session) => {
        const r = await fetch(`${ctx.supabaseUrl}/rest/v1/my_profile?select=person_id`, {
          headers: { apikey: anon, authorization: `Bearer ${sesi.accessToken}` },
        });
        return ((await r.json()) as Array<{ person_id: string }>)[0]?.person_id ?? "";
      };

      const MULAI = t("umpanbalik.buka.aksi", "staff");
      const TANPA = t("umpanbalik.buka.tanpa_wewenang", "staff");
      const TOLAK = t("umpanbalik.ditolak", "staff");
      const KELAS = t("umpanbalik.kelas.judul", "staff");

      // ── 0. THE CLASS, ITS TEACHER, AND THE BRANCH MANAGEMENT STANDS IN.
      const guru = await signIn(ctx, PERSONA.alphaGuru);
      const guruId = await orangku(guru);
      const kelasId = /\/mengajar\/([0-9a-f-]{36})/.exec(
        await (await get(`${base}/mengajar`, { headers: { cookie: guru.cookie } })).text(),
      )?.[1];
      const hod = await signIn(ctx, PERSONA.alphaHod);
      const hodId = await orangku(hod);
      const simpulId = /\/pimpinan\/([0-9a-f-]{36})/.exec(
        await (await get(`${base}/pimpinan`, { headers: { cookie: hod.cookie } })).text(),
      )?.[1];
      if (!c.expect(Boolean(kelasId && guruId && simpulId),
        "the Alpha class, its educator or the Management branch could not be found")) {
        return c.verdict("no class, educator or branch to operate on");
      }

      // ── 1. DISCOVERY NAMES THE TEACHER — the capability WP7D was blocked on.
      const cari = await rpc(hod, "feedback_subjects_for_class", { p_node: kelasId });
      c.expect(cari.ok, `Management could not discover subjects: ${String(cari.body).slice(0, 140)}`);
      const subjek = (cari.ok ? cari.body : []) as Array<{ person_id: string; display_name: string }>;
      c.expect(subjek.length > 0, "the class that has an educator offers no subject");
      const ini = subjek.find((x) => x.person_id === guruId);
      c.expect(Boolean(ini), "the educator who teaches this class is not among its subjects");
      c.expect(Boolean(ini?.display_name && ini.display_name.trim().length > 0),
        "the governed contract supplies no display name, so the em dash cannot be retired");
      //    TWO COLUMNS AND NOTHING ELSE. A staff directory would have carried
      //    more, and the whole point of a feedback-domain read is that it does
      //    not.
      for (const row of subjek) {
        c.expect(Object.keys(row).sort().join(",") === "display_name,person_id",
          `a subject row carries more than a person and a name: ${Object.keys(row).join(",")}`);
      }
      //    THE CALLER IS NOT THEIR OWN CANDIDATE.
      c.expect(!subjek.some((x) => x.person_id === hodId),
        "Management is offered itself as the subject of its own round");

      // ── 2. DISCOVERY IS REFUSED TO EVERYONE THE OPERATION IS REFUSED TO.
      //    Learning which colleagues may be reported on is part of operating
      //    the round, so it is gated exactly as the round is.
      for (const [nama, persona] of [
        ["INSTITUTION_ADMIN", PERSONA.alphaAdmin],
        ["EDUCATOR", PERSONA.alphaGuru],
        ["STUDENT", PERSONA.alphaStudent],
        ["out-of-scope HEAD_OF_DEPARTMENT", PERSONA.cycleHod],
      ] as const) {
        const sesi = await signIn(ctx, persona);
        const coba = await rpc(sesi, "feedback_subjects_for_class", { p_node: kelasId });
        c.expect(!coba.ok, `${nama} discovered which colleagues may be reported on`);
        //    …and being refused discovery does not make them able to open.
        const buka = await rpc(sesi, "open_feedback_cycle", {
          p_node: kelasId, p_subject_person_id: guruId,
        });
        c.expect(!buka.ok, `${nama} opened a feedback round`);
      }

      // ── 3. THE ORDINARY PATH: the branch offers the class, the class offers
      //    the teacher, and neither offers a figure.
      const cabang = await lihat(PERSONA.alphaHod, `/pimpinan/${simpulId}/umpan-balik`);
      c.expect(cabang.res.status === 200, `the branch page → ${cabang.res.status}`);
      c.expect(cabang.html.includes(KELAS), "the branch page offers no way to start a round");
      c.expect(new RegExp(`/umpan-balik/kelas/${kelasId}`).test(cabang.raw),
        "the branch page does not offer this class");

      const jalanKelas = `/pimpinan/${simpulId}/umpan-balik/kelas/${kelasId}`;
      const halaman = await lihat(PERSONA.alphaHod, jalanKelas);
      c.expect(halaman.res.status === 200, `the class page → ${halaman.res.status}`);
      c.expect(halaman.html.includes(ini!.display_name),
        "the class page does not name the educator the governed contract supplied");
      c.expect(halaman.html.includes(MULAI), "the class page offers no way to start a round");
      c.expect(!ANGKA_TANGGAPAN.test(halaman.html),
        `the class page shows a figure: "${ANGKA_TANGGAPAN.exec(halaman.html)?.[0]}"`);
      noInternalWords(c, halaman.html, "the class operating page");

      //    EXCLUDED ROLES GET NO USABLE OPERATION on the ordinary path either.
      for (const [nama, persona] of [
        ["INSTITUTION_ADMIN", PERSONA.alphaAdmin],
        ["EDUCATOR", PERSONA.alphaGuru],
        ["STUDENT", PERSONA.alphaStudent],
      ] as const) {
        const hal = await lihat(persona, jalanKelas);
        c.expect(!hal.html.includes(MULAI), `${nama} is offered a control to start a round`);
        c.expect(hal.html.includes(TOLAK) || hal.html.includes(TANPA),
          `${nama} is neither refused the page nor told the class is not theirs`);
        c.expect(!ANGKA_TANGGAPAN.test(hal.html), `${nama} sees a figure on the class page`);
      }

      // ── 4. OPENING, THROUGH THE SAME ENDPOINT THE PAGE'S ACTION CALLS. A
      //    round for this class and this educator exists afterwards, whether
      //    this press made it or found it — both are correct outcomes and the
      //    note records which happened.
      const buka = await rpc(hod, "open_feedback_cycle", {
        p_node: kelasId, p_subject_person_id: guruId,
      });
      const pesan = String(buka.body);
      const adaSekarang = buka.ok || /already has a feedback cycle/.test(pesan);
      c.expect(adaSekarang, `opening was refused for a reason this test did not expect: ${pesan.slice(0, 160)}`);

      // ── 5. AND THE EM DASH IS RETIRED where the contract supplies a name.
      //    This is the whole product point of the unblocker: Management can
      //    now see which educator a round is about.
      const sesudah = await lihat(PERSONA.alphaHod, `/pimpinan/${simpulId}/umpan-balik`);
      c.expect(sesudah.html.includes(ini!.display_name),
        "the Management round list still shows no educator name");
      c.expect(!ANGKA_TANGGAPAN.test(sesudah.html), "the Management round list shows a figure");
      //    …and the class page now lists the round it holds.
      const kelasLagi = await lihat(PERSONA.alphaHod, jalanKelas);
      c.expect(kelasLagi.html.includes(ini!.display_name),
        "the class page does not name the educator of the round it holds");
      c.expect(!ANGKA_TANGGAPAN.test(kelasLagi.html), "the class page shows a figure after opening");
      noInternalWords(c, kelasLagi.html, "the class page after opening");

      c.note(`${subjek.length} subject(s) discovered; open ${buka.ok ? "created a round" : "found one already there"}`);
      return c.verdict(
        "Management names the teacher a class will be asked about, and then asks. DISCOVERY WORKS AND " +
        "IS BOUNDED: an authorized head of department is given the educator who teaches the class, " +
        "with a real display name, and every returned row carries EXACTLY a person id and a display " +
        "name -- asserted key by key, because a staff directory would have carried more. The caller is " +
        "not offered as the subject of their own round. DISCOVERY IS GATED EXACTLY AS THE OPERATION " +
        "IS: an institution administrator, the educator themselves, a learner and a head of department " +
        "from another school are each refused the list AND each refused the open, so being able to " +
        "name somebody and being able to ask about them are the same authority and neither is the " +
        "other's key. ON THE ORDINARY PATH the branch offers the class, the class page names the " +
        "educator and offers the act, excluded roles are offered no control and meet either the " +
        "refusal page or the not-yours sentence, and no page in this flow carries a response figure. " +
        "OPENING then leaves a round for this class and this educator, and the Management list -- " +
        "which showed an em dash where a teacher's name belongs before the unblocker -- NAMES THE " +
        "EDUCATOR, which is the product point of the whole change",
      );
    },
  },
  {
    id: "UX1-UB-KELOLA-01",
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
      const orangku = async (sesi: Session) => {
        const r = await fetch(`${ctx.supabaseUrl}/rest/v1/my_profile?select=person_id`, {
          headers: { apikey: anon, authorization: `Bearer ${sesi.accessToken}` },
        });
        return ((await r.json()) as Array<{ person_id: string }>)[0]?.person_id ?? "";
      };

      const TUTUP = t("umpanbalik.tutup.aksi", "staff");
      const YA = t("umpanbalik.tutup.ya", "staff");
      const SELESAI = t("umpanbalik.tutup.selesai", "staff");
      const DITAHAN = t("umpanbalik.hasil.belum_cukup_tanggapan", "staff");
      const TERKUMPUL = t("umpanbalik.hasil.belum_ditutup", "staff");
      const TOLAK = t("umpanbalik.ditolak", "staff");

      // ── 0. A ROUND OF ITS OWN, at Alpha rather than at the learning-cycle
      //    tenant: UX1-UB-ALUR-01 already owns the one round that class may
      //    hold, and a second there is refused by the unique index that exists
      //    to prevent two overlapping populations being differenced.
      const guru = await signIn(ctx, PERSONA.alphaGuru);
      const guruId = await orangku(guru);
      const kelasId = /\/mengajar\/([0-9a-f-]{36})/.exec(
        await (await get(`${base}/mengajar`, { headers: { cookie: guru.cookie } })).text(),
      )?.[1];
      if (!c.expect(Boolean(kelasId) && Boolean(guruId), "the Alpha educator has no class or no person")) {
        return c.verdict("no class to open a round over");
      }

      const hod = await signIn(ctx, PERSONA.alphaHod);
      const buka = await rpc(hod, "open_feedback_cycle", { p_node: kelasId, p_subject_person_id: guruId });
      let siklusId = buka.ok ? String(buka.body) : "";
      if (!buka.ok) {
        c.expect(/already has a feedback cycle/.test(String(buka.body)),
          `Management could not open a round: ${String(buka.body).slice(0, 140)}`);
        const ada = await fetch(
          `${ctx.supabaseUrl}/rest/v1/feedback_cycles?select=id&scope_node_id=eq.${kelasId}`,
          { headers: { apikey: anon, authorization: `Bearer ${hod.accessToken}` } },
        );
        siklusId = ((await ada.json()) as Array<{ id: string }>)[0]?.id ?? "";
      }
      if (!c.expect(Boolean(siklusId), "no round exists to operate")) {
        return c.verdict("no round to operate");
      }

      const simpulId = /\/pimpinan\/([0-9a-f-]{36})/.exec(
        await (await get(`${base}/pimpinan`, { headers: { cookie: hod.cookie } })).text(),
      )?.[1];
      if (!c.expect(Boolean(simpulId), "Management is offered no part of the school")) {
        return c.verdict("no Management branch to operate from");
      }
      const jalan = `/pimpinan/${simpulId}/umpan-balik/${siklusId}`;

      // ── 1. THE AUTHORIZED OPERATOR IS OFFERED THE ACT, and the round is
      //    still collecting, and nothing on the page is a figure.
      const sebelum = await lihat(PERSONA.alphaHod, jalan);
      c.expect(sebelum.res.status === 200, `Management's round page → ${sebelum.res.status}`);
      c.expect(sebelum.html.includes(TUTUP), "an open round offers its operator no way to close it");
      c.expect(sebelum.html.includes(TERKUMPUL), "an open round does not say it is still collecting");
      c.expect(!sebelum.html.includes(DITAHAN), "an open round already carries the withheld statement");
      c.expect(!ANGKA_TANGGAPAN.test(sebelum.html),
        `the operating page shows a figure while the round is open: "${ANGKA_TANGGAPAN.exec(sebelum.html)?.[0]}"`);
      //    …nor does the confirmation the operator is about to read.
      c.expect(sebelum.html.includes(t("umpanbalik.tutup.judul", "staff")),
        "the operating section is not on the page");
      c.expect(!/\b(ambang|threshold|minimum)\b/i.test(sebelum.html),
        "the operating page names a threshold");
      c.expect(!SELESAI.length || !sebelum.html.includes(SELESAI),
        "an open round is described as finished");
      noInternalWords(c, sebelum.html, "Management's open round");

      // ── 2. EVERY EXCLUDED READER, REFUSED BY THE BACKEND RATHER THAN BY A
      //    HIDDEN BUTTON. Each one is asked to close the round directly, so
      //    what is measured is the endpoint's answer and not the page's.
      const ditolak: Array<[string, { email: string; password: string }]> = [
        ["INSTITUTION_ADMIN", PERSONA.alphaAdmin],
        ["EDUCATOR (the subject)", PERSONA.alphaGuru],
        ["STUDENT", PERSONA.alphaStudent],
        ["out-of-scope HEAD_OF_DEPARTMENT", PERSONA.cycleHod],
      ];
      for (const [nama, persona] of ditolak) {
        const sesi = await signIn(ctx, persona);
        const coba = await rpc(sesi, "close_feedback_cycle", { p_cycle: siklusId });
        c.expect(!coba.ok, `${nama} closed a round they do not operate`);
        //    …and the ordinary path offers them nothing either.
        const hal = await lihat(persona, jalan);
        c.expect(!hal.html.includes(TUTUP) && !hal.html.includes(YA),
          `${nama} is offered a close control`);
        c.expect(!ANGKA_TANGGAPAN.test(hal.html), `${nama} sees a response figure`);
      }
      //    The administrator specifically meets the refusal page, not a
      //    disabled control: WP7B gives them nothing here at all.
      const adm = await lihat(PERSONA.alphaAdmin, jalan);
      c.expect(adm.html.includes(TOLAK), "an administrator reached the operating page");
      //    And the round is STILL OPEN after all four attempts: the refusals
      //    refused, rather than merely being reported.
      const masihBuka = await rpc(hod, "feedback_result", { p_cycle: siklusId });
      c.expect(masihBuka.ok && (masihBuka.body as { state?: string }).state === "OPEN",
        "an excluded reader's attempt moved the round");

      // ── 3. THE AUTHORIZED OPERATOR CLOSES IT, through the same endpoint the
      //    page's action calls.
      const tutup = await rpc(hod, "close_feedback_cycle", { p_cycle: siklusId });
      c.expect(tutup.ok, `Management could not close the round: ${String(tutup.body).slice(0, 140)}`);
      //    A SECOND CLOSE IS REFUSED. Terminal means terminal, and the surface
      //    reads that refusal as "already closed" rather than as a failure.
      const lagi = await rpc(hod, "close_feedback_cycle", { p_cycle: siklusId });
      c.expect(!lagi.ok && /already/.test(String(lagi.body)), "a closed round was closed again");

      // ── 4. WHAT IT BECAME IS THE BACKEND'S ANSWER, AND THE PAGE RE-READ IT.
      //    Alpha 5A holds fewer learners than the anonymity threshold and none
      //    answered, so this round cannot publish — which makes it exactly the
      //    state the canonical statement exists for.
      const keadaan = tutup.ok ? (tutup.body as { state?: string }).state : "";
      c.expect(keadaan === "WITHHELD", `the round closed ${keadaan}; this case measures the withheld surface`);

      const sesudah = await lihat(PERSONA.alphaHod, jalan);
      c.expect(sesudah.res.status === 200, `the closed round's page → ${sesudah.res.status}`);
      c.expect(sesudah.html.includes(DITAHAN),
        "a round that closed below the threshold does not carry the canonical statement");
      c.expect(!sesudah.html.includes(TERKUMPUL), "a closed round still says it is collecting");
      c.expect(!ANGKA_TANGGAPAN.test(sesudah.html),
        `the withheld surface carries a figure: "${ANGKA_TANGGAPAN.exec(sesudah.html)?.[0]}"`);
      //    NOTHING FOLLOWS THE STATEMENT.
      const sekitar = sesudah.html.slice(sesudah.html.indexOf(DITAHAN) + DITAHAN.length).trim().slice(0, 24);
      c.expect(!/^\(?\d/.test(sekitar), `something follows the canonical statement: "${sekitar}"`);

      // ── 5. TERMINAL. No control, and no second transition offered anywhere.
      c.expect(!sesudah.html.includes(TUTUP), "a closed round is still offered a close control");
      c.expect(!sesudah.html.includes(YA), "a closed round still carries a confirmation");
      c.expect(sesudah.html.includes(SELESAI), "a closed round does not say collection has ended");
      c.expect(!/(buka kembali|dibuka lagi|reopen|atur ulang|reset|terbitkan|publish)/i.test(sesudah.html),
        "a closed round is offered a second transition");
      noInternalWords(c, sesudah.html, "Management's withheld round");

      // ── 6. THE SUBJECT'S OWN VIEW AGREES, and is likewise offered nothing:
      //    operating a round is Management's, reading its result is the
      //    subject's, and neither becomes the other.
      const guruHal = await lihat(PERSONA.alphaGuru, `/mengajar/${kelasId}/umpan-balik`);
      c.expect(guruHal.res.status === 200, `the subject's page → ${guruHal.res.status}`);
      c.expect(guruHal.html.includes(DITAHAN), "the subject gets a different withheld statement");
      c.expect(!guruHal.html.includes(TUTUP), "the subject is offered a control over their own round");
      c.expect(!ANGKA_TANGGAPAN.test(guruHal.html), "the subject sees a figure on a withheld round");

      c.note(`round ${siklusId.slice(0, 8)} at Alpha closed ${keadaan}; ${ditolak.length} excluded reader(s)`);
      return c.verdict(
        "an authorized Management user ends collection for a real round through ordinary PINTAR, and " +
        "the backend decides what the round became. Measured on the RENDERED html of a round opened " +
        "for this case at Alpha -- its own class, so the learning-cycle tenant's round is untouched. " +
        "WHILE IT IS OPEN the operator is offered the act and the page carries no response figure, no " +
        "threshold and no word of one, and the confirmation they are about to read carries none " +
        "either. EVERY EXCLUDED READER IS REFUSED BY THE ENDPOINT, not by a hidden button: an " +
        "institution administrator, the subject educator, a learner and a head of department from " +
        "another school are each asked to close the round DIRECTLY and each refused, none is offered a " +
        "control on the ordinary path, none sees a figure, the administrator meets the refusal page " +
        "rather than a disabled control, and the round is asserted to be STILL OPEN after all four " +
        "attempts -- so the refusals refused rather than merely being reported. THE AUTHORIZED " +
        "OPERATOR THEN CLOSES IT, a second close is refused because terminal means terminal, and the " +
        "page re-read: the canonical statement with nothing after it, no figure, no claim that it is " +
        "still collecting, no close control, no confirmation and no reopen, reset or publish offered " +
        "anywhere on it. The subject's own view of the same round agrees and is offered no control " +
        "either, because operating a round and reading its result are different things",
      );
    },
  },
  {
    /**
     * F09-C02 — ACCOUNT ACTIVATION THROUGH THE REAL ROUTE AND THE REAL AUTH
     * SERVICE (NEW-2).
     *
     * The database suite proved activation by inserting auth.users itself, in
     * a shape GoTrue never produces, and it passed while the product could not
     * activate anyone: GoTrue's admin createUser INSERTs the user first and
     * writes the caller's app_metadata in a later update, so the trigger never
     * saw the link. This test therefore asks the running application, as a
     * signed-in institution administrator, through `/api/akun/aktivasi`, and
     * lets the real GoTrue create the identity; then signs in AS THE ACTIVATED
     * LEARNER with the card and PIN the route returned.
     *
     * A DECLARED EXCEPTION to this runner's black-box rule: the world is built,
     * and the outcome read back, through the database owner (facility `db`),
     * because a provisioned person with no account is exactly the state no
     * seed holds. The act under test is black-box end to end. The fixtures
     * marker is held OFF for the duration, as on a real installation, and
     * restored afterwards.
     */
    id: "F09-C02",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      const db = process.env.SUPABASE_DB_URL!;
      // one session, one statement per -c, so every statement's rows print;
      // the synthetic seed intent is set only inside the transaction that
      // builds the world, never around the act under test
      const psql = (...sql: string[]) => {
        const r = spawnSync("psql", ["-q", "-v", "ON_ERROR_STOP=1", "-At", ...sql.flatMap((q) => ["-c", q]), db], { encoding: "utf8" });
        if (r.status !== 0) throw new Error(`psql: ${(r.stderr || "").trim().split("\n").pop()}`);
        return r.stdout.trim();
      };
      const seeding = (q: string) =>
        psql("begin", "select set_config('app.seed_intent', 'synthetic', true)", q, "commit")
          .split("\n").filter((l) => l !== "synthetic").join("\n");
      const tag = Date.now().toString(36).slice(-6);
      const learnerName = `Siswa Aktivasi ${tag}`;
      const teacherName = `Guru Aktivasi ${tag}`;

      // the world: a school with a namespace, the Alpha administrator as its
      // administrator, a provisioned learner (PENDING) and teacher, no accounts
      const inst = seeding(
        `insert into public.institutions (name, slug, is_synthetic, is_active) values ('Sekolah Aktivasi ${tag}', 'aktivasi-${tag}', true, true) returning id`,
      );
      psql(
        "update public.institutions set namespace = (select x from generate_series(1, 500) g, " +
          `lateral (select upper(substr(md5('${tag}' || g), 1, 3)) x) q ` +
          "where not exists (select 1 from public.institutions t where upper(t.namespace) = q.x) limit 1) " +
          `where id = '${inst}'`,
      );
      const period = psql(
        `insert into public.academic_periods (institution_id, name, starts_on, ends_on) values ('${inst}', '2026/2027', current_date - 30, current_date + 300) returning id`,
      );
      seeding(
        "insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until) " +
          `select a.person_id, 'INSTITUTION_ADMIN', '${inst}', now() - interval '1 day', now() + interval '30 days' ` +
          `from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = '${PERSONA.alphaAdmin.email}'`,
      );
      const person = (name: string) =>
        psql(`insert into public.persons (display_name) values ('${name}') returning id`);
      const learner = person(learnerName);
      const teacher = person(teacherName);
      psql(`select public.issue_institutional_id('${learner}', '${inst}'), public.issue_institutional_id('${teacher}', '${inst}')`);
      const enrolment = psql(
        `insert into public.enrollments (person_id, institution_id, academic_period_id, status) values ('${learner}', '${inst}', '${period}', 'PENDING') returning id`,
      );

      const marker = psql("select local_fixtures_enabled from public.platform_environment");
      psql("update public.platform_environment set local_fixtures_enabled = false");
      try {
        const admin = await signIn(ctx, PERSONA.alphaAdmin);
        const post = (body: object, cookie?: string) =>
          get(`${base}/api/akun/aktivasi`, {
            method: "POST",
            headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
            body: JSON.stringify(body),
          });

        // the list the screen reads offers both
        const page = await get(`${base}/aktivasi`, { headers: { cookie: admin.cookie } });
        const html = await page.text();
        c.expect(page.status === 200, `GET /aktivasi as the administrator → ${page.status}`);
        c.expect(html.includes(learnerName) && html.includes(teacherName), "/aktivasi does not offer the provisioned people");

        // an anonymous caller is refused before anything is created
        const anon = await post({ mode: "CLASSROOM_CARD", person_id: learner });
        c.expect(anon.status === 401, `anonymous POST /api/akun/aktivasi → ${anon.status}, expected 401`);

        // the learner, by classroom card
        const r1 = await post({ mode: "CLASSROOM_CARD", person_id: learner }, admin.cookie);
        const b1 = (await r1.json().catch(() => ({}))) as { ok?: boolean; card?: string; pin?: string; detail?: string };
        c.expect(r1.status === 200 && b1.ok === true && /^\d{10}$/.test(b1.card ?? "") && /^\d{6}$/.test(b1.pin ?? ""),
          `card activation → ${r1.status} ${JSON.stringify(b1).slice(0, 160)}`);
        if (b1.ok && b1.card && b1.pin) {
          const linked = psql(
            `select count(*) from public.accounts where person_id = '${learner}' and kind = 'CLASSROOM_CARD' and card_number = '${b1.card}'`,
          );
          c.expect(linked === "1", `the card identity Auth created is not linked to the provisioned learner (${linked})`);
          c.expect(psql(`select count(*) from public.persons where display_name = '${learnerName}'`) === "1",
            "activation created a second person for the learner");
          c.expect(psql(`select status from public.enrollments where id = '${enrolment}'`) === "ACTIVE",
            "activation left the learner's enrolment PENDING");
          c.expect(psql(`select count(*) from public.account_activation_grants where person_id = '${learner}' and consumed_at is not null`) === "1",
            "the activation grant was not consumed exactly once");

          // and the learner signs in with what they were given, as themselves
          const email = `card-${b1.card}@${process.env.CARD_EMAIL_DOMAIN ?? "cards.pintar.internal"}`;
          let session: Session | null = null;
          try {
            session = await signIn(ctx, { email, password: productionDerivation(b1.card, b1.pin) });
          } catch (e) {
            c.expect(false, `the activated learner cannot sign in with the issued card and PIN: ${(e as Error).message}`);
          }
          if (session) {
            const home = await get(`${base}/belajar`, { headers: { cookie: session.cookie } });
            c.expect(home.status === 200, `the activated learner's /belajar → ${home.status} ${home.headers.get("location") ?? ""}`);
            const me = psql(
              `select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where lower(u.email) = lower('${email}')`,
            );
            c.expect(me === learner, "the card signs in as someone other than the provisioned learner");
          }
          // a second activation is refused by the database
          const again = await post({ mode: "CLASSROOM_CARD", person_id: learner }, admin.cookie);
          c.expect(again.status === 403, `a second activation of the same learner → ${again.status}, expected 403`);
        }

        // the teacher, by email
        const temail = `guru-aktivasi-${tag}@contoh.invalid`;
        const r2 = await post({ mode: "EMAIL", person_id: teacher, email: temail }, admin.cookie);
        c.expect(r2.status === 200, `email activation → ${r2.status} ${(await r2.text()).slice(0, 160)}`);
        c.expect(
          psql(`select count(*) from public.accounts a join auth.users u on u.id = a.auth_user_id where a.person_id = '${teacher}' and a.kind = 'EMAIL' and lower(u.email) = lower('${temail}')`) === "1",
          "the email identity Auth created is not linked to the provisioned teacher",
        );
      } finally {
        psql(`update public.platform_environment set local_fixtures_enabled = ${marker === "t"}`);
        // the Alpha administrator leaves this school again, so no later reader
        // of their scope sees a second institution
        seeding(
          "update public.role_assignments set revoked_at = now() where role = 'INSTITUTION_ADMIN' " +
            `and scope_node_id = '${inst}' and revoked_at is null`,
        );
      }
      return c.verdict(
        "an institution administrator activated a provisioned learner by classroom card and a provisioned teacher " +
          "by email through /api/akun/aktivasi, with the real Auth service creating both identities and the fixtures " +
          "marker off: each identity is the provisioned person (no second person), the learner's enrolment is ACTIVE, " +
          "each grant was consumed once, the learner signs in with the issued card and PIN and reaches /belajar as " +
          "themselves, a second activation and an anonymous caller are refused",
      );
    },
  },
  {
    id: "DAISY-04-TIDAK-ADA-01",
    requires: ["app"],
    run: async (ctx) => {
      const c = new Checks();
      /**
       * DAISY-04 (D-011): AN ADDRESS THAT LEADS NOWHERE GETS PINTAR'S PAGE, not
       * Next's English "404: This page could not be found". Asked over HTTP, as
       * an anonymous visitor, on two public paths that lead nowhere -- one of
       * them /masuk/kartu, which the proxy lists as public and which has no page
       * (audit N12) -- in both languages.
       */
      const base = ctx.appUrl!;
      let dilihat = 0;
      for (const path of ["/masuk/kartu", "/verifikasi/tidak/ada"]) {
        for (const locale of ["id", "en"] as const) {
          const res = await get(`${base}${path}`, { headers: { cookie: `pintar-lang=${locale}` } });
          const raw = await res.text();
          const teks = visibleText(raw);
          dilihat++;
          c.expect(res.status === 404, `${path} (${locale}) → ${res.status}, expected 404`);
          c.expect(teks.includes(t("tidak_ada.judul", "public", { locale })),
            `${path} (${locale}) is not PINTAR's not-found page: "${teks.slice(0, 90)}"`);
          c.expect(!/This page could not be found|404: /i.test(teks), `${path} (${locale}) shows Next's English default`);
          c.expect(new RegExp(`<html lang="${locale}"`).test(raw), `${path} (${locale}) does not declare the reader's language`);
          c.expect(/href="\/"/.test(raw), `${path} (${locale}) offers no way back`);
        }
      }
      return c.verdict(
        `an anonymous visitor to an address that leads nowhere gets a 404 carrying PINTAR's own page in the language ` +
        `they chose, never Next's English default, with a way back (${dilihat} requests: /masuk/kartu and a path ` +
        `under /verifikasi/, in Indonesian and English)`,
      );
    },
  },
  // ────────────────────────────────────────────────────────── DAISY-05 (lane: Daisy)
  {
    id: "DAISY-05-STRUKTUR-02",
    requires: ["app", "network"],
    run: async (ctx) => {
      // DAISY-05 over real HTTP, as the school administrator Alpha's seed
      // names, against the seeded database: Konfigurasi opens on the school's
      // own structure, read through school_structure, with the way to add each
      // level -- and the seed's hidden Jenjang ("Sekolah Dasar") and Reguler
      // ("SD Reguler") nowhere in it (D-006, D-027). Read only: this test
      // changes nothing in the shared fixture.
      const c = new Checks();
      const base = ctx.appUrl!;
      const admin = await signIn(ctx, PERSONA.alphaAdmin);
      const res = await get(`${base}/konfigurasi`, { headers: { cookie: admin.cookie } });
      c.expect(res.status === 200, `INSTITUTION_ADMIN /konfigurasi → ${res.status}`);
      const raw = await res.text();
      const i = raw.indexOf('id="struktur"');
      const j = raw.indexOf('id="system"', i);
      const bagian = i >= 0 && j > i ? raw.slice(i, j) : "";
      if (!c.expect(bagian.length > 0, "Konfigurasi has no Struktur sekolah section")) return c.verdict("");
      const teks = visibleText(bagian);
      c.expect(teks.includes(t("config.section.struktur", "staff")), "the section is not headed Struktur sekolah");
      c.expect(!/role="alert"/.test(bagian), `the school's structure could not be read: ${teks.slice(0, 200)}`);
      // the seeded Bagian, Tingkat and Kelas, each drawn as a place
      for (const nama of ["Matematika", "Kelas 5 — 2026/27", "5A", "Kelas 6 — 2027/28", "6B"]) {
        c.expect(bagian.includes(`<strong class="pin-str-nama">${nama}</strong>`), `the seeded place "${nama}" is not in the structure`);
      }
      c.expect(/2026\/2027/.test(teks) && /2027\/2028/.test(teks), "a Tingkat or Kelas is shown without its school year");
      for (const k of ["config.struktur.tambah.BAGIAN", "config.struktur.tambah.TINGKAT", "config.struktur.tambah.KELAS"] as const) {
        c.expect(teks.includes(t(k, "staff")), `the section does not offer "${t(k, "staff")}"`);
      }
      c.expect(!teks.includes("Sekolah Dasar") && !teks.includes("SD Reguler"), "the seed's hidden Jenjang or Reguler is on the screen");
      c.expect(!teks.includes(t("config.struktur.konfirmasi.ya", "staff")), "a deactivation can be sent without being asked for first");

      // THE PLATFORM ADMINISTRATOR (audit S7b). They read every tenant, and
      // the national library's name sorts first, so the section used to open
      // inside "PINTAR Kurikulum Nasional". It must open on a real school and
      // never offer the library, whatever the address asks for.
      const kanon = "PINTAR Kurikulum Nasional";
      const sys = await signIn(ctx, PERSONA.sysadmin);
      for (const alamat of ["/konfigurasi", "/konfigurasi?sekolah=00000000-0000-0000-0000-000000000000"]) {
        const r = await get(`${base}${alamat}`, { headers: { cookie: sys.cookie } });
        c.expect(r.status === 200, `SYSTEM_ADMIN ${alamat} → ${r.status}`);
        const html = await r.text();
        const a = html.indexOf('id="struktur"');
        const b = html.indexOf('id="system"', a);
        const sec = a >= 0 && b > a ? html.slice(a, b) : "";
        c.expect(sec.length > 0 && !/role="alert"/.test(sec), `SYSTEM_ADMIN ${alamat}: the structure section is missing or could not be read`);
        c.expect(!visibleText(sec).includes(kanon), `SYSTEM_ADMIN ${alamat}: the school picker offers or opens the national library`);
      }
      // and the library's own id, asked for by address, is not opened either
      const idKanon = await fetch(`${ctx.supabaseUrl}/rest/v1/institutions?select=id&tenant_kind=eq.PLATFORM_CANONICAL`, {
        headers: { apikey: ctx.supabaseAnonKey!, authorization: `Bearer ${sys.accessToken}` },
      }).then((x) => x.json() as Promise<Array<{ id: string }>>).catch(() => [] as Array<{ id: string }>);
      if (c.expect(Array.isArray(idKanon) && idKanon.length > 0, "the national library's tenant could not be read, so the check below proves nothing")) {
        const r = await get(`${base}/konfigurasi?sekolah=${idKanon[0].id}`, { headers: { cookie: sys.cookie } });
        const html = await r.text();
        const a = html.indexOf('id="struktur"');
        const sec = a >= 0 ? html.slice(a, html.indexOf('id="system"', a)) : "";
        c.expect(sec.length > 0 && !visibleText(sec).includes(kanon), "asking for the national library by address opens it in the structure section");
      }
      return c.verdict(
        "the school administrator's Konfigurasi opens on their school's structure, read from the database: the seeded Bagian, " +
        "Tingkat and Kelas are drawn with their school years and the way to add each level, the hidden Jenjang and Reguler are not, " +
        "and nothing can be deactivated without the question. The platform administrator's opens on a real school and never offers " +
        "or opens the national library, even when its id is asked for by address",
      );
    },
  },
  {
    id: "DAISY-06-UNGGAH-02",
    requires: ["app", "network"],
    run: async (ctx) => {
      // DAISY-06 over real HTTP against the seeded database (audit S14). A
      // teacher's way into Studio's upload is the workbook: the template to
      // download, a school to put it in, and one file input that takes an
      // .xlsx, in three steps with the first one current. The school is a real
      // one the reader may draft in: for Alpha's school administrator that is
      // Alpha, and for the platform administrator, who reads every tenant and
      // for whom "PINTAR Kurikulum Nasional" sorts first, it is never the
      // national library, in the workbook panel or in the JSON forms below it
      // (sekolah.ts). Read only: nothing is uploaded.
      const c = new Checks();
      const base = ctx.appUrl!;
      const kanon = "PINTAR Kurikulum Nasional";
      const opsi = (html: string) =>
        [...html.matchAll(/<option([^>]*)>([^<]*)<\/option>/g)].map((m) => ({
          nama: m[2].replace(/&amp;/g, "&").trim(),
          dipilih: /\sselected(=""|\s|$)/.test(m[1]),
        }));
      for (const [peran, orang, harap] of [
        ["INSTITUTION_ADMIN", PERSONA.alphaAdmin, "Sekolah Sintetis Alpha"],
        ["SYSTEM_ADMIN", PERSONA.sysadmin, null],
      ] as const) {
        const sesi = await signIn(ctx, orang);
        const res = await get(`${base}/studio/unggah`, { headers: { cookie: sesi.cookie } });
        if (!c.expect(res.status === 200, `${peran} /studio/unggah → ${res.status}`)) continue;
        const html = await res.text();
        const a = html.indexOf('id="buku-kerja"');
        const b = html.indexOf('id="mudah"', a);
        const panel = a >= 0 && b > a ? html.slice(a, b) : "";
        if (!c.expect(panel.length > 0, `${peran}: the page has no workbook section before the JSON forms`)) continue;
        const teks = visibleText(panel);
        c.expect(!/role="alert"/.test(panel), `${peran}: the workbook section opens on a refusal: ${teks.slice(0, 200)}`);
        c.expect(teks.includes(t("studio.unggah.templat", "staff")), `${peran}: the template download is not offered`);
        for (const k of ["studio.unggah.langkah.periksa", "studio.unggah.langkah.media", "studio.unggah.langkah.simpan"] as const) {
          c.expect(teks.includes(t(k, "staff")), `${peran}: the step "${t(k, "staff")}" is missing`);
        }
        c.expect((panel.match(/aria-current="step"/g) ?? []).length === 1, `${peran}: not exactly one step is marked current`);
        const berkas = [...panel.matchAll(/<input[^>]*type="file"[^>]*>/g)].map((m) => m[0]);
        c.expect(berkas.length === 1, `${peran}: the first step has ${berkas.length} file input(s), expected 1`);
        c.expect(berkas.some((x) => /accept="[^"]*\.xlsx/.test(x)), `${peran}: the file input does not take an .xlsx workbook`);
        const sel = panel.match(/<select[^>]*id="ung-sekolah"[^>]*>([\s\S]*?)<\/select>/);
        if (!c.expect(sel !== null, `${peran}: the workbook panel has no Sekolah picker`)) continue;
        const pilihan = opsi(sel![1]);
        const awal = pilihan.find((o) => o.dipilih) ?? pilihan[0];
        c.expect(pilihan.length > 0, `${peran}: the Sekolah picker offers no school`);
        c.expect(awal !== undefined && awal.nama !== kanon, `${peran}: the Sekolah picker starts on "${awal?.nama ?? "(nothing)"}"`);
        if (harap) c.expect(awal?.nama === harap, `${peran}: the Sekolah picker starts on "${awal?.nama ?? "(nothing)"}", expected "${harap}"`);
        c.expect(!opsi(html).some((o) => o.nama === kanon), `${peran}: a school picker on the page offers the national library`);
        c.note(`${peran}: ${pilihan.length} school(s) offered, starting on "${awal?.nama ?? ""}"`);
      }
      return c.verdict(
        "Studio's upload opens, for Alpha's school administrator and for the platform administrator, on the workbook: the template " +
        "to download, three steps with the first current, and one file input that takes an .xlsx. Its Sekolah picker starts on a " +
        "real school (Alpha for Alpha's administrator), and no picker on the page offers the national library (audit S14)",
      );
    },
  },
];
