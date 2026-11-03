/**
 * App runner — F01-R01…R06 and F03-R01…R02. Black-box HTTP against the production-mode app
 * (`next start`) and, where the network facility exists, against the
 * Supabase project's REST/Auth/Storage endpoints with real persona JWTs —
 * never a superuser connection (FABLE-01 §6). R01 needs no network. R04 is
 * evidence forwarded from the CI workflow's own jobs.
 */
import { pilihKonteksCookie, pintuDi, tersusun } from "./konteks-uji";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";
import { Checks, visibleText, type SelfTest, type Context } from "./lib";
import { INTERNAL_WORDS, t, type HleEvent } from "../src/lib/hle";
import { bacaJawabanKartu } from "../src/components/masuk/kartu";
import { bob26AppTests } from "./bob26.test";
import { bob27AppTests } from "./bob27.test";
import { bob28AppTests } from "./bob28.test";
import { bob29AppTests } from "./bob29.test";
import { d101AppTests } from "./d101.test";
import { d102AppTests } from "./d102.test";
import { bob50AppTests } from "./bob50.test";
import { bob51AppTests } from "./bob51.test";
import { dr150cAppTests } from "./dr150c.test";
import { penutupanAppTests } from "./penutupan.test";
import { b4AppTests } from "./b4.test";

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
  // W2.1-W2.3 (Batch 4): «Koreksi data orang», the platform admin's and school admin's corrections
  "/aktivasi/orang",
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
  // DAISY-20 (Gate 3). «Aktifkan akun PINTAR Anda» is served signed out and
  // Akun saya signed in; both render server answers through the copy table,
  // so both are swept like every other page.
  "/aktifkan",
  "/akun",
  // BOB-27 (Gate 4). «Lupa password?» is served signed out on the same stage
  // and renders server answers through the copy table, so it is swept too.
  "/masuk/lupa",
  // BOB-28 (Gate 5). The platform admin's «Keamanan akun» renders the security record's events through the copy table.
  "/konfigurasi/keamanan",
  // BOB-51. The platform admin's «Kirim email uji», a static route under Konfigurasi.
  "/konfigurasi/email-uji",
  // BOB-29 (Gate 6). «PINTAR terkunci» and «Komputer siapa ini?» render through the copy table.
  "/terkunci",
  "/perangkat",
  // BOB-15 + DAISY-12 (D-037 step 2). «Laporkan masalah» and «Laporan saya» render through the copy table.
  "/lapor",
  "/lapor/saya",
  // #148 (D-094, D-100). Where a person the maintenance stops is sent; it renders through the copy table.
  "/pemeliharaan",
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

/**
 * BOB-12: the key the card sign-in route counts a card's attempts under, from
 * the production module in a child process for the same reason as above.
 */
function productionCooldownKey(card: string): string {
  const script =
    'import("file://" + process.cwd() + "/src/lib/card.ts").then((m) => {' +
    "  const f = m.kunciJedaKartu ?? m.default?.kunciJedaKartu;" +
    `  process.stdout.write(f(${JSON.stringify(card)}));` +
    "})";
  const r = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", "-e", script], {
    encoding: "utf8",
    env: process.env,
  });
  if (r.status !== 0) throw new Error(`production cooldown key failed: ${(r.stderr || "").trim().split("\n").pop()}`);
  return r.stdout.trim();
}

async function get(url: string, init: RequestInit = {}) {
  return fetch(url, { redirect: "manual", ...init });
}

/** Every value the rendered page gives a hidden `lanjut` field (BOB-06). */
function nilaiLanjut(html: string): string[] {
  return [...html.matchAll(/<input\b[^>]*\bname="lanjut"[^>]*>/g)]
    .map((m) => /\bvalue="([^"]*)"/.exec(m[0])?.[1] ?? "(no value)")
    .map((v) => v.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'"));
}

/**
 * The hidden fields of the signed-in sign-in screen's "Lanjutkan" form -- the
 * form holding `lanjut` and a server action -- exactly as a browser without
 * script would post them, or null when the page drew no such form.
 */
function formLanjutkan(html: string): Array<[string, string]> | null {
  for (const bagian of tersusun(html).split(/<form\b/).slice(1)) {
    const isi = bagian.split(/<\/form>/)[0];
    const masukan = [...isi.matchAll(/<input\b[^>]*\btype="hidden"[^>]*>/g)].map((m) => [
      /\bname="([^"]*)"/.exec(m[0])?.[1] ?? "",
      (/\bvalue="([^"]*)"/.exec(m[0])?.[1] ?? "").replace(/&amp;/g, "&"),
    ] as [string, string]);
    if (masukan.some(([n]) => n === "lanjut") && masukan.some(([n]) => n.startsWith("$ACTION_"))) return masukan;
  }
  return null;
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
      // A different persona. (Since BOB-05 sign-out is local; BOB05-R01 is the
      // same-person case.)
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
    // BOB-05 (D-009). "Keluar" ends THIS device only, and each account kind's
    // session carries its own idle lifetime. F01-R05's control is a different
    // person, so it passes under a global sign-out too; this one is the same
    // person twice.
    id: "BOB05-R01",
    requires: ["app", "network"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;

      // the same person, signed in on two devices
      const perangkatA = await signIn(ctx, PERSONA.alphaAdmin);
      const perangkatB = await signIn(ctx, PERSONA.alphaAdmin);
      const out = await get(`${base}/keluar`, { method: "POST", headers: { cookie: perangkatA.cookie } });
      c.expect([302, 303, 307, 308].includes(out.status), `POST /keluar → ${out.status}, expected a redirect`);
      const matiA = await refresh(ctx, perangkatA.refreshToken);
      c.expect(!matiA.ok, `the signed-out device's refresh token still bought a session (${matiA.status})`);
      const hidupB = await refresh(ctx, perangkatB.refreshToken);
      c.expect(hidupB.ok, `signing out one device ended the same person's other session (${hidupB.status}): the sign-out is not local`);

      // each account kind's lifetime, as the running proxy writes it
      const umurDari = (r: Response) => r.headers.getSetCookie().filter((sc) => /^sb-[^=]+-auth-token(\.\d+)?=/.test(sc))
        .map((sc) => Number(/Max-Age=(\d+)/i.exec(sc)?.[1] ?? NaN));
      // RESTATED FOR BOB-29 (Gate 6; IDENTITY-4.0 C4, C11): an email account's lifetime is its computer's. On a
      // browser that has not answered «Komputer siapa ini?» it is a shared computer, 60 minutes; once this browser is
      // declared the person's own, D-009's 7 days.
      const guru = await signIn(ctx, PERSONA.alphaAdmin);
      const rEmail = await get(`${base}/konfigurasi`, { headers: { cookie: guru.cookie } });
      const uEmail = umurDari(rEmail);
      c.expect(uEmail.length > 0 && uEmail.every((u) => u === 3600),
        `an email account on an undeclared computer got auth cookies with Max-Age ${JSON.stringify(uEmail)}, expected 3600 (a shared computer, 60 minutes)`);
      const alat = rEmail.headers.getSetCookie().map((sc) => /^pintar_perangkat=([^;]+)/.exec(sc)?.[1]).find(Boolean);
      c.expect(Boolean(alat), "the proxy gave a staff browser no device value for «Komputer siapa ini?»");
      const pribadi = new FormData();
      pribadi.set("mode", "PERSONAL");
      const rPilih = await get(`${base}/api/sesi/perangkat`, {
        method: "POST", body: pribadi, headers: { cookie: `${guru.cookie}; pintar_perangkat=${alat}`, origin: base } });
      const tanda = rPilih.headers.getSetCookie().map((sc) => /^pintar_pribadi=([^;]+)/.exec(sc)?.[1]).find(Boolean);
      c.expect(rPilih.status === 200, `declaring this computer personal → ${rPilih.status}, expected 200`);
      const rPribadi = await get(`${base}/konfigurasi`, {
        headers: { cookie: `${guru.cookie}; pintar_perangkat=${alat}${tanda ? `; pintar_pribadi=${tanda}` : ""}` } });
      const uPribadi = umurDari(rPribadi);
      c.expect(uPribadi.length > 0 && uPribadi.every((u) => u === 604800),
        `an email account on a computer declared personal got auth cookies with Max-Age ${JSON.stringify(uPribadi)}, expected 604800 (7 days)`);
      const host = process.env.CARD_EMAIL_DOMAIN ?? "cards.pintar.internal";
      const kartu = await signIn(ctx, { email: `card-7001@${host}`, password: productionDerivation("7001", "2468") });
      const rKartu = await get(`${base}/belajar`, { headers: { cookie: kartu.cookie } });
      const uKartu = umurDari(rKartu);
      c.expect(uKartu.length > 0 && uKartu.every((u) => u === 3600),
        `a classroom card's auth cookies came back with Max-Age ${JSON.stringify(uKartu)}, expected 3600 (60 minutes)`);

      return c.verdict("signing out one device revokes its session and leaves the same person's other session alive; " +
        "the running proxy gives an email account's auth cookies 60 minutes on a shared computer and 7 days on one declared " +
        "personal, and a classroom card's 60 minutes");
    },
  },
  {
    // BOB-06 (D-010; audit M4, S11, S13). A sign-in that was not interrupted on
    // its way somewhere carries NO destination. The screen used to narrow an
    // absent `lanjut` to "/" and post that back, and "/" then beat the role's
    // home: everybody landed on the entry page, and management looped.
    id: "BOB06-A01",
    requires: ["app"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      for (const [alamat, harap] of [
        ["/masuk", ""],
        ["/masuk?peran=guru", ""],
        ["/masuk?lanjut=%2F%2Fevil.example", ""],
        ["/masuk?lanjut=%2Fbelajar%2Fsertifikat", "/belajar/sertifikat"],
      ] as const) {
        const r = await get(`${base}${alamat}`);
        c.expect(r.status === 200, `GET ${alamat} → ${r.status}`);
        const nilai = nilaiLanjut(await r.text());
        c.expect(nilai.length > 0, `${alamat} rendered no destination field, so this test would prove nothing`);
        c.expect(nilai.every((v) => v === harap),
          `${alamat} carries the destination ${JSON.stringify(nilai)} into sign-in, expected ${JSON.stringify(harap)}`);
      }
      return c.verdict("the rendered sign-in screen carries no destination when none was asked for, whether the " +
        "parameter is absent, a presentation hint or refused, and still carries one that was");
    },
  },
  {
    // BOB-06 (D-010). Each role lands on its own home, through the running
    // app: signed in, the sign-in screen's "Lanjutkan" is posted exactly as a
    // browser without script posts it, and the redirect is read.
    id: "BOB06-R01",
    requires: ["app", "network"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      const lanjutkan = async (cookie: string, alamat: string): Promise<string> => {
        const halaman = await get(`${base}${alamat}`, { headers: { cookie } });
        const form = formLanjutkan(await halaman.text());
        if (!form) return `(no Lanjutkan form on ${alamat}: ${halaman.status})`;
        const fd = new FormData();
        for (const [n, v] of form) fd.set(n, v);
        const r = await get(`${base}${alamat}`, { method: "POST", body: fd, headers: { cookie, origin: base } });
        const loc = r.headers.get("location") ?? "";
        if (![302, 303, 307, 308].includes(r.status) || !loc) return `(${r.status}, no redirect)`;
        // RESTATED FOR L3 (D-132 C4, C9): every arrival goes through /mulai, which sets the working context and
        // sends the person on; its own redirect is the landing
        const u = new URL(loc, base);
        if (u.pathname !== "/mulai") return `(went to ${u.pathname}, not /mulai)`;
        const m = await get(`${base}${u.pathname}${u.search}`, { headers: { cookie } });
        const ke = m.headers.get("location") ?? "";
        return [302, 303, 307, 308].includes(m.status) && ke ? new URL(ke, base).pathname : `(/mulai ${m.status}, no redirect)`;
      };
      // D-010's homes for a person of one purpose · place; several, the chooser, which the ranking never replaces (D-132(i))
      const RUMAH: Array<[string, { email: string; password: string }, string]> = [
        ["learner", PERSONA.cycleLearner, "/belajar"],
        ["educator", PERSONA.alphaGuru, "/mengajar"],
        ["head of department (Mengajar and Mengelola)", PERSONA.alphaHod, "/"],
        ["dean", PERSONA.dean, "/pimpinan"],
        ["school admin", PERSONA.alphaAdmin, "/konfigurasi"],
        ["platform admin (every school and «Seluruh platform»)", PERSONA.sysadmin, "/"],
      ];
      for (const [peran, persona, rumah] of RUMAH) {
        const { cookie } = await signIn(ctx, persona);
        const ke = await lanjutkan(cookie, "/masuk");
        c.expect(ke === rumah, `the ${peran} with no destination landed on ${ke}, expected ${rumah} (D-010)`);
        // "/" is the entry page, not a page anybody asked for; an old link may carry it
        const keAkar = await lanjutkan(cookie, "/masuk?lanjut=%2F");
        c.expect(keAkar === rumah, `the ${peran} whose link carried "/" landed on ${keAkar}, expected ${rumah}`);
      }
      // a page the person did ask for still wins
      const { cookie } = await signIn(ctx, PERSONA.cycleLearner);
      const diminta = await lanjutkan(cookie, "/masuk?lanjut=%2Fbelajar%2Fsertifikat");
      c.expect(diminta === "/belajar/sertifikat", `a requested destination was replaced by ${diminta}`);
      return c.verdict("signed in, each of the six roles posts the sign-in screen's Lanjutkan with no destination and " +
        "arrives through /mulai at its D-010 home when it holds one purpose · place, and at the chooser when it holds " +
        "several (D-132(i)), also when the link carried only \"/\"; a requested page still wins");
    },
  },
  {
    // BOB-07 (D-011). The banners a Studio page and Konfigurasi draw read only
    // the result's code. Each page is asked with a code AND a planted `detail`
    // in the database's own English: the code's Indonesian sentence and the
    // reference render, and the English never does. (Before BOB-07 both pages
    // printed `detail` after "Belum tersimpan.".)
    id: "BOB07-R01",
    requires: ["app", "network"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      const bahasaDb = "the reviewer may not be the author (public.courses)";

      const admin = await signIn(ctx, PERSONA.cycleAdmin);
      const kursus = await fetch(`${ctx.supabaseUrl}/rest/v1/courses?select=id&title=eq.Pecahan&supersedes_course_id=is.null`, {
        headers: { apikey: ctx.supabaseAnonKey!, authorization: `Bearer ${admin.accessToken}` },
      }).then((r) => r.json() as Promise<Array<{ id: string }>>).catch(() => []);
      if (c.expect(Array.isArray(kursus) && kursus.length === 1, `the seeded course could not be read (${JSON.stringify(kursus).slice(0, 100)})`)) {
        const q = new URLSearchParams({ bagian: "paket", hasil: "gagal", kode: "CONTENT_REVIEWER_IS_AUTHOR", detail: bahasaDb });
        const r = await get(`${base}/studio/paket/${kursus[0].id}?${q}`, { headers: { cookie: admin.cookie } });
        const teks = visibleText(await r.text());
        c.expect(r.status === 200, `/studio/paket → ${r.status}`);
        c.expect(teks.includes(`${t("studio.hasil.gagal", "staff")} ${t("studio.konten.kode.content_reviewer_is_author", "staff")}`),
          "the package page does not show the content refusal's sentence");
        c.expect(!teks.includes("reviewer may not be"), "the package page shows the database's own words");
        const g = new URLSearchParams({ bagian: "paket", hasil: "gagal", kode: "ACTION_FAILED", ref: "AB12CD", detail: bahasaDb });
        const rg = visibleText(await (await get(`${base}/studio/paket/${kursus[0].id}?${g}`, { headers: { cookie: admin.cookie } })).text());
        c.expect(rg.includes(`${t("galat.rujukan", "staff")}: AB12CD.`) && !rg.includes("reviewer may not be"),
          "a failure nobody named does not show its reference, or shows the database's words");
      }

      const alpha = await signIn(ctx, PERSONA.alphaAdmin);
      const k = new URLSearchParams({ bagian: "roles", hasil: "gagal", kode: "ROLE_SCOPE_REQUIRED", detail: "permission denied for function grant_role" });
      const rk = await get(`${base}/konfigurasi?${k}`, { headers: { cookie: alpha.cookie } });
      const tk = visibleText(await rk.text());
      c.expect(rk.status === 200, `/konfigurasi → ${rk.status}`);
      c.expect(tk.includes(`${t("config.result.failed", "staff")} ${t("galat.role_scope_required", "staff")}`),
        "Konfigurasi does not show the code's sentence");
      c.expect(!tk.includes("permission denied"), "Konfigurasi shows the database's own words");

      return c.verdict("asked with a code and a planted detail in the database's English, the rendered package page shows " +
        "\"Belum tersimpan.\" and the content refusal's sentence, and a failure's reference, and Konfigurasi the role " +
        "refusal's sentence; neither shows the planted words");
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
        // 404 is a legitimate answer for a step the learner has not reached --
        // except the cycle's two tests, which never answer 404 (BOB-04, D-008)
        if (r.status === 404 && !/\/(pemetaan|penguasaan)$/.test(route)) continue;
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
    // F22-A01 (the Second Eye's hold 3, 8 Oct; D-132 §2.11): THE CHOOSER FAILS CLOSED WHEN THE GRANTS CANNOT BE READ.
    // The pairs a person holds come from konteks_tempat_saya, read with the person's own session. When that read is
    // refused, the app must offer no door, set no context and narrow every surface to nothing; never guess a purpose.
    // The read is made to fail for real in the running database (EXECUTE taken from authenticated, restored after).
    id: "F22-A01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      const db = process.env.SUPABASE_DB_URL!;
      const sql = (q: string) => {
        const r = spawnSync("psql", ["-q", "-v", "ON_ERROR_STOP=1", "-At", "-c", q, db], { encoding: "utf8" });
        if (r.status !== 0) throw new Error(`psql: ${(r.stderr || "").trim().split("\n").pop()}`);
        return r.stdout.trim();
      };
      const FN = "public.konteks_tempat_saya()";
      const bolehBaca = () => sql(`select has_function_privilege('authenticated', '${FN}', 'execute')`) === "t";
      const sesiId = (token: string) =>
        (JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as { session_id?: string }).session_id ?? "";
      const konteksSesi = (id: string) =>
        sql(`select coalesce(konteks_tujuan, '-') || ':' || coalesce(konteks_tempat::text, '-') from public.device_sessions where session_id = '${id}'`) || "(no row)";
      const pintuDari = async (cookie: string) => pintuDi(await (await get(`${base}/`, { headers: { cookie } })).text()).map((p) => p.kunci);
      const kelasDi = (html: string) => [...html.matchAll(/href="\/mengajar\/[0-9a-f-]{36}"/g)].length;

      // the control: with the grants readable, this teacher is offered her door and her classes
      c.expect(bolehBaca(), `${FN} is not executable by authenticated before the test (left from an earlier run?)`);
      const awal = await signIn(ctx, PERSONA.alphaGuru);
      const pintuAwal = await pintuDari(awal.cookie);
      c.expect(pintuAwal.some((k) => k.startsWith("MENGAJAR:")), `with the grants readable the teacher is offered ${JSON.stringify(pintuAwal)}, no Mengajar door`);

      let pintu: string[] = [], mulai = "", tetap = "", kelas = -1, mengajar = 0;
      const sesi = await signIn(ctx, PERSONA.alphaGuru);
      sql(`revoke execute on function ${FN} from authenticated`);
      try {
        // the chooser: no door at all, since none can be known to be held
        pintu = await pintuDari(sesi.cookie);
        // the arrival: /mulai with no door chooses nothing (C9 needs exactly one held pair)
        const r = await get(`${base}/mulai`, { headers: { cookie: sesi.cookie } });
        mulai = `${r.status} → ${r.headers.get("location") ?? "-"}`;
        // a surface asked for: C4 sets no context, and the page narrows to nothing
        const m = await get(`${base}/mengajar`, { headers: { cookie: sesi.cookie } });
        mengajar = m.status;
        kelas = m.status === 200 ? kelasDi(await m.text()) : 0;
        tetap = konteksSesi(sesiId(sesi.accessToken));
      } finally {
        sql(`grant execute on function ${FN} to authenticated`);
      }
      c.expect(bolehBaca(), `${FN} was not given back to authenticated`);
      c.expect(pintu.length === 0, `with the grants unreadable the chooser still offers ${JSON.stringify(pintu)}`);
      c.expect(!/\/(mengajar|belajar|konfigurasi|pimpinan|studio)/.test(mulai), `with the grants unreadable /mulai sends the teacher into a surface: ${mulai}`);
      c.expect(kelas === 0, `with the grants unreadable /mengajar (${mengajar}) still lists ${kelas} class link(s)`);
      c.expect(!/^(BELAJAR|MENGAJAR|MENGELOLA):/.test(tetap), `with the grants unreadable the session was given a context: ${tetap}`);
      // and the same session, once the grants read again, is offered its door: the absence was the unreadable read
      const pintuLagi = await pintuDari(sesi.cookie);
      c.expect(pintuLagi.some((k) => k.startsWith("MENGAJAR:")), `after the read is restored the teacher is offered ${JSON.stringify(pintuLagi)}`);
      return c.verdict(`with ${FN} refused to the person's own session, the chooser offers no door (${pintuAwal.length} before, `
        + `${pintuLagi.length} after), /mulai chooses nothing (${mulai}), /mengajar (${mengajar}) lists no class and the session holds `
        + `no context (${tetap}): the app fails closed when the grants cannot be read (D-132 §2.11; the Second Eye's hold 3)`);
    },
  },
  {
    // F22-A02 (BOB19-K01; the owner's ruling of 8 Oct, Option B): A SCHOOL'S FIRST ADMINISTRATOR, AND ONLY THEN THE
    // PLATFORM'S LIST. Through Konfigurasi's own forms, posted as a browser without script posts them: the first
    // appointment, the exception gone once it is made, a forged ordinary grant and a forged first appointment refused,
    // another school's administrator refused, and the exception back when the last administrator is revoked.
    id: "F22-A02",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      const db = process.env.SUPABASE_DB_URL!;
      const psql = (...sql: string[]) => {
        const r = spawnSync("psql", ["-q", "-v", "ON_ERROR_STOP=1", "-At", ...sql.flatMap((q) => ["-c", q]), db], { encoding: "utf8" });
        if (r.status !== 0) throw new Error(`psql: ${(r.stderr || "").trim().split("\n").pop()}`);
        return r.stdout.trim();
      };
      const seeding = (q: string) =>
        psql("begin", "select set_config('app.seed_intent', 'synthetic', true)", q, "commit")
          .split("\n").filter((l) => l !== "synthetic").join("\n");
      const tag = Date.now().toString(36).slice(-6);
      const SAMPAI = "2027-06-30";
      // the world: a school with no administrator, and three people (P1 recorded at no school and holding nothing,
      // P2 recorded at another school holding nothing, P3 a teacher of Alpha)
      const S = seeding(`insert into public.institutions (name, slug, is_synthetic, is_active) values ('Sekolah Pertama ${tag}', 'sekolah-pertama-${tag}', true, true) returning id`);
      const akar = psql(`select id from public.org_nodes where institution_id = '${S}' and kind = 'INSTITUTION' limit 1`);
      const alpha = psql("select id from public.institutions where slug like 'synth-alpha-%' limit 1");
      const P1 = psql(`insert into public.persons (display_name) values ('Calon Admin ${tag}') returning id`);
      // P2's school: another school with a namespace, so it can record a person (issue_institutional_id)
      const lainId = seeding(`insert into public.institutions (name, slug, is_synthetic, is_active) values ('Sekolah Lain ${tag}', 'sekolah-lain-${tag}', true, true) returning id`);
      psql("update public.institutions set namespace = (select x from generate_series(1, 500) g, " +
        `lateral (select upper(substr(md5('${tag}${lainId}' || g), 1, 3)) x) q ` +
        "where x ~ '^[A-Z]{3}$' and not exists (select 1 from public.institutions t where upper(t.namespace) = q.x) limit 1) " +
        `where id = '${lainId}'`);
      const P2 = psql(`insert into public.persons (display_name) values ('Tercatat Lain ${tag}') returning id`);
      psql(`select public.issue_institutional_id('${P2}', '${lainId}')`);
      const orangDari = (email: string) => psql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = '${email}'`);
      const P3 = orangDari(PERSONA.alphaGuru.email);
      const sys = orangDari(PERSONA.sysadmin.email);
      const adminAktif = () => psql(`select count(*) from public.role_assignments where institution_id = '${S}' and role = 'INSTITUTION_ADMIN' and revoked_at is null`);
      const peranDi = () => psql(`select count(*) from public.role_assignments where institution_id = '${S}'`);

      // a form on a rendered page, by a marker inside it: its hidden fields (the server action's own id among them)
      const formIsi = (html: string, penanda: RegExp) =>
        html.split(/<form\b/).slice(1).map((bagian) => bagian.split(/<\/form>/)[0]).find((isi) => penanda.test(isi)) ?? null;
      const formDengan = (html: string, penanda: RegExp) => {
        const isi = formIsi(html, penanda);
        if (isi === null) return null;
        return [...isi.matchAll(/<input\b[^>]*\btype="hidden"[^>]*>/g)].map((m) => [
          /\bname="([^"]*)"/.exec(m[0])?.[1] ?? "", (/\bvalue="([^"]*)"/.exec(m[0])?.[1] ?? "").replace(/&amp;/g, "&")] as [string, string]);
      };
      const kirim = async (cookie: string, isian: Array<[string, string]>, tambahan: Record<string, string>) => {
        const fd = new FormData();
        for (const [n, v] of isian) if (n.startsWith("$ACTION")) fd.set(n, v);
        for (const [n, v] of Object.entries(tambahan)) fd.set(n, v);
        const r = await fetch(`${base}/konfigurasi`, { method: "POST", body: fd, headers: { cookie, origin: base }, redirect: "manual" });
        return r.headers.get("location") ?? `(${r.status})`;
      };
      const halaman = async (cookie: string, q = "") => tersusun(await (await get(`${base}/konfigurasi${q}`, { headers: { cookie } })).text());
      // the first-appointment section: from its marker to the end of its own form
      const bagianPertama = (html: string) => /data-admin-pertama=""/.test(html) ? html.split('data-admin-pertama=""')[1].split(/<\/form>/)[0] : "";
      const pilihanDi = (html: string, nama: string) => new RegExp(`<option value="[^"]*">${nama}</option>`).test(html);
      const judul = t("config.pertama.judul", "staff"), arti = t("config.pertama.arti", "staff"), yakin = t("config.pertama.yakin", "staff");

      const op = await signIn(ctx, PERSONA.sysadmin);
      await pilihKonteksCookie(base, op.cookie, `MENGELOLA:${S}`);

      // 1. no administrator: the first-appointment path, in the owner's words, offering P1 only
      const h1 = await halaman(op.cookie);
      const b1 = bagianPertama(h1);
      c.expect(b1.includes(judul) && b1.includes(arti), "with no administrator the school's context draws no «Menunjuk admin sekolah pertama» in the approved words");
      c.expect(pilihanDi(b1, `Calon Admin ${tag}`), "the person recorded at no school is not offered for the first appointment");
      c.expect(!pilihanDi(b1, `Tercatat Lain ${tag}`), "a person recorded at another school is offered for the first appointment");
      const umum = formIsi(h1, /name="role"/) ?? "";
      c.expect(umum !== "" && !pilihanDi(umum, `Calon Admin ${tag}`), "the ordinary roles form offers a person recorded at no school (the platform's list in a school's context)");

      // 2. forged ordinary grant: P1, a teacher, through the ordinary form's own action
      const formUmum = formDengan(h1, /name="role"/);
      c.expect(formUmum !== null, "no ordinary roles form found");
      const tipuan = formUmum ? await kirim(op.cookie, formUmum, { person: P1, role: "EDUCATOR", scope: akar, valid_until: SAMPAI }) : "-";
      c.expect(/kode=ACTION_NOT_ALLOWED/.test(tipuan) && peranDi() === "0", `a forged ordinary grant of the platform's person answered ${tipuan}; roles at the school ${peranDi()}`);
      // the ordinary form cannot make the first administrator either
      const tipuanAdmin = formUmum ? await kirim(op.cookie, formUmum, { person: P1, role: "INSTITUTION_ADMIN", scope: akar, valid_until: SAMPAI }) : "-";
      c.expect(/kode=ACTION_NOT_ALLOWED/.test(tipuanAdmin) && peranDi() === "0", `the ordinary form appointing the platform's person answered ${tipuanAdmin}`);

      // 3. forged first appointments: a person recorded at another school, a person holding a role
      const formPertama = formDengan(bagianPertama(h1), /name="sekolah"/);
      c.expect(formPertama !== null, "no first-appointment form found");
      for (const [siapa, id] of [["recorded at another school", P2], ["a teacher of Alpha", P3]] as const) {
        const r = formPertama ? await kirim(op.cookie, formPertama, { person: id, sekolah: S, valid_until: SAMPAI, yakin: "ya" }) : "-";
        c.expect(/kode=ACTION_NOT_ALLOWED/.test(r) && peranDi() === "0", `a first appointment of a person ${siapa} answered ${r}`);
      }

      // 4. the first appointment: the first press asks in the approved words, the second appoints
      const tekan1 = formPertama ? await kirim(op.cookie, formPertama, { person: P1, sekolah: S, valid_until: SAMPAI }) : "-";
      c.expect(/pertama=/.test(tekan1) && peranDi() === "0", `the first press answered ${tekan1} (roles ${peranDi()})`);
      const h2 = await halaman(op.cookie, `?bagian=roles&pertama=${P1}&sampai=${SAMPAI}`);
      c.expect(bagianPertama(h2).includes(yakin), "the second step does not ask «Jadikan orang ini admin sekolah pertama di sekolah ini?»");
      const formYakin = formDengan(bagianPertama(h2), /name="yakin"/);
      const tekan2 = formYakin ? await kirim(op.cookie, formYakin, { person: P1, sekolah: S, valid_until: SAMPAI, yakin: "ya" }) : "-";
      const hibah = psql(`select role || '|' || scope_node_id || '|' || coalesce(granted_by::text, '-') || '|' || (select count(*) from public.audit_log l where l.target_table = 'role_assignments' and l.target_id = r.id::text) from public.role_assignments r where institution_id = '${S}' and person_id = '${P1}' and revoked_at is null`);
      c.expect(/hasil=ok/.test(tekan2) && hibah.startsWith(`INSTITUTION_ADMIN|${akar}|${sys}|`) && !hibah.endsWith("|0"),
        `the appointment answered ${tekan2}; the grant reads ${hibah || "(none)"} (expected Admin sekolah at the root, by the operator, audited)`);

      // 5. a duplicate: the same appointment again is refused by the action (an administrator now exists), and the
      // database's own rule refuses the duplicate grant (GRANT_ALREADY_ACTIVE)
      const lagi = formPertama ? await kirim(op.cookie, formPertama, { person: P1, sekolah: S, valid_until: SAMPAI, yakin: "ya" }) : "-";
      c.expect(/kode=ACTION_NOT_ALLOWED/.test(lagi) && adminAktif() === "1", `a second first appointment answered ${lagi}; active administrators ${adminAktif()}`);
      const ganda = await fetch(`${ctx.supabaseUrl}/rest/v1/rpc/grant_role`, {
        method: "POST", headers: { apikey: ctx.supabaseAnonKey!, authorization: `Bearer ${op.accessToken}`, "content-type": "application/json" },
        body: JSON.stringify({ p_person: P1, p_role: "INSTITUTION_ADMIN", p_scope_node: akar, p_valid_until: `${SAMPAI}T23:59:59+07:00` }),
      });
      const gandaTeks = await ganda.text();
      c.expect(ganda.status >= 400 && /GRANT_ALREADY_ACTIVE/.test(gandaTeks) && adminAktif() === "1", `the database took a duplicate active grant (${ganda.status} ${gandaTeks.slice(0, 120)})`);

      // 6. the exception is gone: no first-appointment path, and the platform's person is offered nowhere else
      const h3 = await halaman(op.cookie);
      c.expect(!/data-admin-pertama=""/.test(h3), "with an administrator the school's context still draws the first-appointment path");

      // 7. another school's administrator: refused a grant at this school, and refused the platform's list
      const lain = await signIn(ctx, PERSONA.alphaAdmin);
      await pilihKonteksCookie(base, lain.cookie, `MENGELOLA:${alpha}`);
      const formLain = formDengan(await halaman(lain.cookie), /name="role"/);
      const silang = formLain ? await kirim(lain.cookie, formLain, { person: P3, role: "EDUCATOR", scope: akar, valid_until: SAMPAI }) : "-";
      c.expect(/hasil=gagal/.test(silang) && peranDi() === "1", `Alpha's administrator granting at this school answered ${silang}; roles at the school ${peranDi()}`);
      const daftar = await fetch(`${ctx.supabaseUrl}/rest/v1/rpc/persons_awaiting_first_role`, {
        method: "POST", headers: { apikey: ctx.supabaseAnonKey!, authorization: `Bearer ${lain.accessToken}`, "content-type": "application/json" }, body: "{}" });
      c.expect(daftar.status >= 400, `the platform's list answered a school administrator ${daftar.status}`);

      // 8. recovery: the last administrator revoked, the exception is back and appoints again
      const id = psql(`select id from public.role_assignments where institution_id = '${S}' and person_id = '${P1}' and revoked_at is null`);
      const h4 = await halaman(op.cookie);
      const formCabut = formDengan(h4, new RegExp(`name="assignment" value="${id}"`));
      const cabut = formCabut ? await kirim(op.cookie, formCabut, { assignment: id, alasan: `F22-A02 ${tag}` }) : "-";
      c.expect(/hasil=ok/.test(cabut) && adminAktif() === "0", `revoking the last administrator answered ${cabut}; active ${adminAktif()}`);
      const h5 = await halaman(op.cookie);
      c.expect(pilihanDi(bagianPertama(h5), `Calon Admin ${tag}`), "after the last administrator is revoked the first-appointment path is not back with its candidate");
      const formPulih = formDengan(bagianPertama(h5), /name="sekolah"/);
      const pulih = formPulih ? await kirim(op.cookie, formPulih, { person: P1, sekolah: S, valid_until: SAMPAI, yakin: "ya" }) : "-";
      c.expect(/hasil=ok/.test(pulih) && adminAktif() === "1", `the recovered first appointment answered ${pulih}; active ${adminAktif()}`);

      return c.verdict("in a school with no Admin sekolah, Admin platform is offered «Menunjuk admin sekolah pertama» in the approved "
        + "words, with the people recorded at no school; the ordinary form never offers them and refuses them forged (as a teacher "
        + "or as Admin sekolah); a person recorded at another school or holding a role is refused; the first press asks for "
        + "confirmation and the second appoints Admin sekolah at the school's root, by the operator, audited; a second appointment "
        + "and the database's duplicate are refused; the path is gone once an administrator exists; another school's administrator "
        + "is refused a grant there and the platform's list; and after the last administrator is revoked the path is back and appoints again");
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
      const pemilih = t("entry.title", "public");
      // the shell's own navigation, where a way between contexts would be
      const navDari = (raw: string) => /<nav class="pin-tabs"[^>]*>([\s\S]*?)<\/nav>/.exec(raw)?.[1] ?? "";
      // the chooser this session is offered, by its doors' pair keys
      const pintuSesi = async (cookie: string) =>
        pintuDi(await (await get(`${base}/`, { headers: { cookie } })).text()).map((p) => p.kunci.split(":")[0]);

      const lihat = async (persona: { email: string; password: string }, path: string) => {
        const sesi = await signIn(ctx, persona);
        const res = await get(`${base}${path}`, { headers: { cookie: sesi.cookie } });
        const raw = await res.text();
        return { res, raw, html: visibleText(raw), sesi };
      };

      // 1. THE DOOR, AND IT IS ONE DOOR. RESTATED FOR L3 (D-132 C1, C3, §2.4; CR-83): the educator who also learns
      //    holds two contexts, Mengajar at their school and Belajar. The teaching header keeps the tab it had and
      //    offers the one way between contexts, the chooser, whose doors are exactly those two: a second context,
      //    not a redesigned navigation, not a switch between identities, and no tab that leads into another context.
      const ajar = await lihat(PERSONA.cycleEducator, "/mengajar");
      c.expect(ajar.res.status === 200, `EDUCATOR /mengajar → ${ajar.res.status}`);
      const navAjar = navDari(ajar.raw);
      c.expect(/href="\/"/.test(navAjar) && visibleText(navAjar).includes(pemilih),
        "the teaching header offers no way to the educator's own learning (the chooser)");
      c.expect(ajar.html.includes(kelas), "the teaching tab is gone from the teaching header");
      c.expect(!/href="\/belajar"/.test(navAjar), "the teaching header has a tab into another context");
      const pintuAjar = await pintuSesi(ajar.sesi.cookie);
      c.expect(JSON.stringify([...pintuAjar].sort()) === JSON.stringify(["BELAJAR", "MENGAJAR"]),
        `the entry names Pembelajaran Saya but leads nowhere: the chooser offers ${JSON.stringify(pintuAjar)}`);

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
      //    …and the way back to their teaching is always on screen: the chooser, never a tab into it (L3, §2.4)
      const navPunya = navDari(punya.raw);
      c.expect(/href="\/"/.test(navPunya) && visibleText(navPunya).includes(pemilih) && (await pintuSesi(punya.sesi.cookie)).includes("MENGAJAR"),
        "the educator's learning page strands them away from their classes");
      c.expect(!/href="\/mengajar"/.test(navPunya), "the educator's learning page has a tab into another context");

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
      // RESTATED FOR TERMINOLOGY v1 (D-068 F2): the educator's own-learning tab is now «Belajar», the learner's own
      // word, so the word alone no longer tells them apart; what must not reach a learner is the educator's page itself,
      // its eyebrow and the sentence that it is apart from their teaching
      c.expect(!belajarMurid.html.includes(t("pembelajaran.eyebrow", "educator")) && !belajarMurid.html.includes(milik),
        "a learner's own home was renamed for them");
      c.expect(/data-tur="bantuan"/.test(belajarMurid.raw), "the learner lost the Help entry their tour points at");

      // 6. THEIR CERTIFICATES ARE THE ONE CERTIFICATE SURFACE, and reaching it
      //    does not put an educator back into a learner's shell.
      const sert = await lihat(PERSONA.cycleEducator, "/belajar/sertifikat");
      c.expect(sert.res.status === 200, `EDUCATOR /belajar/sertifikat → ${sert.res.status}`);
      c.expect(sert.html.includes(pembelajaran) && /href="\/"/.test(navDari(sert.raw)),
        "an educator reading their own certificates is put into the learner's shell");
      c.expect(!sert.html.includes(tabBelajar) || sert.html.includes(pembelajaran),
        "the educator's certificate page shows the learner navigation");
      noInternalWords(c, sert.html, "/belajar/sertifikat as an educator");

      c.note(`${tugasPunya.length} entitlement(s) for the enrolled educator, ${tugasTanpa.length} for the unenrolled one`);
      return c.verdict(
        "an educator's own learning is a second context and never a second identity: the teaching header " +
        "keeps Kelas and offers the chooser, whose doors are exactly Mengajar and Belajar, and the learning " +
        "page offers the same chooser and no tab into teaching -- so the way in is the chooser's door and " +
        "the way back is always on screen (L3, D-132 C1, §2.4). WHAT THEY ARE OFFERED IS THEIR ENROLMENT AND NEVER THEIR " +
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
        // L3 (D-132 C3, §2.11): the administrator of two schools now works in this one, chosen on the chooser
        await pilihKonteksCookie(base, admin.cookie, `MENGELOLA:${inst}`);
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
       * an anonymous visitor, on two public paths that lead nowhere, in both
       * languages. Both are under /verifikasi/, the public prefix: /masuk/kartu,
       * which this used to ask (audit N12), is BOB-12's card route now and
       * answers a GET with a redirect to /masuk (DAISY-13).
       */
      const base = ctx.appUrl!;
      let dilihat = 0;
      for (const path of ["/verifikasi/tidak/ada", "/verifikasi/a/b/c"]) {
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
        `they chose, never Next's English default, with a way back (${dilihat} requests: two paths under ` +
        `/verifikasi/, in Indonesian and English)`,
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
      // RESTATED FOR L3 (D-132 C7): they work in one school's context at a time, chosen on the chooser; there the
      // section is that school's whatever the address asks for, and «Seluruh platform» draws no school's structure
      const kanon = "PINTAR Kurikulum Nasional";
      const sys = await signIn(ctx, PERSONA.sysadmin);
      await pilihKonteksCookie(base, sys.cookie, { tujuan: "MENGELOLA", nama: "Sekolah Sintetis Alpha" });
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
      await pilihKonteksCookie(base, sys.cookie, "MENGELOLA:PLATFORM");
      const platform = await (await get(`${base}/konfigurasi`, { headers: { cookie: sys.cookie } })).text();
      c.expect(/<section id="struktur" hidden=""/.test(platform) && !/<a [^>]*href="#struktur"/.test(platform),
        "«Seluruh platform» draws or offers a school's structure");
      return c.verdict(
        "the school administrator's Konfigurasi opens on their school's structure, read from the database: the seeded Bagian, " +
        "Tingkat and Kelas are drawn with their school years and the way to add each level, the hidden Jenjang and Reguler are not, " +
        "and nothing can be deactivated without the question. The platform administrator's, in a school's working context, opens on " +
        "that school and never offers or opens the national library, even when its id is asked for by address; in «Seluruh " +
        "platform» no school's structure is drawn or offered (L3, D-132 C7)",
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
      // RESTATED FOR CR-51 (D-120 Q7, a changed requirement): the platform administrator is also offered the national
      // library, as the picker's LAST option, so that it still starts on a real school; a school role never sees it
      // RESTATED FOR L3 (D-132 C7, C8): Studio is a working context's place; the platform administrator in a school's
      // context is offered that school alone, and the library only in Pustaka PINTAR's own context (below)
      for (const [peran, orang, harap, pustaka] of [
        ["INSTITUTION_ADMIN", PERSONA.alphaAdmin, "Sekolah Sintetis Alpha", false],
        ["SYSTEM_ADMIN", PERSONA.sysadmin, "Sekolah Sintetis Alpha", false],
      ] as const) {
        const sesi = await signIn(ctx, orang);
        if (peran === "SYSTEM_ADMIN") await pilihKonteksCookie(base, sesi.cookie, { tujuan: "MENGELOLA", nama: "Sekolah Sintetis Alpha" });
        const res = await get(`${base}/studio/unggah`, { headers: { cookie: sesi.cookie } });
        if (!c.expect(res.status === 200, `${peran} /studio/unggah → ${res.status}`)) continue;
        const html = await res.text();
        const a = html.indexOf('id="buku-kerja"');
        // RESTATED FOR CR-87 (D-127 Q7, a changed requirement): the JSON package forms are the platform operator's alone,
        // so the school administrator's page ends with the workbook; the platform administrator's has them after it
        const b0 = html.indexOf('id="mudah"', a);
        c.expect((a >= 0 && b0 > a) === (peran === "SYSTEM_ADMIN"),
          `${peran}: the JSON package forms are ${b0 > a ? "" : "not "}drawn, but they are Admin platform's alone (D-127 Q7)`);
        const b = b0 > a ? b0 : html.length;
        const panel = a >= 0 && b > a ? html.slice(a, b) : "";
        if (!c.expect(panel.length > 0, `${peran}: the page has no workbook section before the JSON forms`)) continue;
        const teks = visibleText(panel);
        c.expect(!/role="alert"|pin-hasil-gagal/.test(panel), `${peran}: the workbook section opens on a refusal: ${teks.slice(0, 200)}`);
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
        if (pustaka) {
          c.expect(pilihan.at(-1)?.nama === kanon && pilihan.filter((o) => o.nama === kanon).length === 1,
            `${peran}: the Sekolah picker does not offer the national library once, last (${pilihan.map((o) => o.nama).join(", ")})`);
        } else {
          c.expect(!opsi(html).some((o) => o.nama === kanon), `${peran}: a school picker on the page offers the national library`);
        }
        c.note(`${peran}: ${pilihan.length} school(s) offered, starting on "${awal?.nama ?? ""}"`);
      }
      // the platform administrator in Pustaka PINTAR's own context: the library, and nothing else
      const sysPustaka = await signIn(ctx, PERSONA.sysadmin);
      await pilihKonteksCookie(base, sysPustaka.cookie, { tujuan: "MENGELOLA", nama: kanon });
      const hp = await (await get(`${base}/studio/unggah`, { headers: { cookie: sysPustaka.cookie } })).text();
      const selP = hp.match(/<select[^>]*id="ung-sekolah"[^>]*>([\s\S]*?)<\/select>/);
      const pilihanP = selP ? opsi(selP[1]).map((o) => o.nama) : [];
      c.expect(JSON.stringify(pilihanP) === JSON.stringify([kanon]), `in Pustaka PINTAR the Sekolah picker offers ${JSON.stringify(pilihanP)}, not the library alone`);
      return c.verdict(
        "Studio's upload opens, for Alpha's school administrator and for the platform administrator, on the workbook, and only the " +
        "platform administrator is drawn the JSON package forms after it (D-127 Q7): the template " +
        "to download, three steps with the first current, and one file input that takes an .xlsx. Its Sekolah picker starts on a " +
        "real school (Alpha, for Alpha's administrator and for the platform administrator in Alpha's working context); no picker on " +
        "either page offers the national library (audit S14), which the platform administrator is offered alone in Pustaka " +
        "PINTAR's own context (CR-51, D-120 Q7; L3, D-132 C7)",
      );
    },
  },
  {
    id: "DAISY-10-SAPA-02",
    requires: ["app", "network"],
    run: async (ctx) => {
      // D-020 over real HTTP against the seed: a learner signed in reads only
      // their first name on /belajar and on /, and their full name nowhere on
      // either page; the educator who also learns is greeted on /belajar as
      // their name is stored, because staff screens are unchanged. The names
      // are read from my_profile as each person, not assumed. Read only.
      const c = new Checks();
      const base = ctx.appUrl!;
      const teks = (html: string, re: RegExp) => visibleText(re.exec(html)?.[1] ?? "").replace(/\s+/g, " ").trim();
      for (const [label, orang, staf] of [
        ["learner", PERSONA.cycleLearner, false],
        ["learner (Alpha)", PERSONA.alphaStudent, false],
        ["educator who learns", PERSONA.cycleEducator, true],
      ] as const) {
        const sesi = await signIn(ctx, orang);
        const profil = await fetch(`${ctx.supabaseUrl}/rest/v1/my_profile?select=display_name`, {
          headers: { apikey: ctx.supabaseAnonKey!, authorization: `Bearer ${sesi.accessToken}` },
        }).then((r) => r.json() as Promise<Array<{ display_name: string | null }>>).catch(() => []);
        const nama = (Array.isArray(profil) ? profil[0]?.display_name ?? "" : "").trim();
        if (!c.expect(/\s/.test(nama), `${label}: the seeded name "${nama}" has one word, so this proves nothing`)) continue;
        const depan = nama.split(/\s+/)[0];
        const sapa = staf ? nama : depan;

        const b = await get(`${base}/belajar`, { headers: { cookie: sesi.cookie } });
        if (c.expect(b.status === 200, `${label}: /belajar → ${b.status}`)) {
          const html = await b.text();
          const h1 = teks(html, /<h1 class="pin-h1">([\s\S]*?)<\/h1>/);
          const halo = t("siklus.halo", staf ? "educator" : "learner");
          c.expect(h1 === `${halo}, ${sapa}`, `${label}: /belajar greets "${h1}", expected "${halo}, ${sapa}"`);
          if (!staf) c.expect(!visibleText(html).includes(nama), `${label}: the full name "${nama}" is on /belajar`);
        }
        if (staf) continue;
        const r = await get(`${base}/`, { headers: { cookie: sesi.cookie } });
        if (c.expect(r.status === 200, `${label}: / → ${r.status}`)) {
          const html = await r.text();
          // React writes the greeting as three text nodes separated by empty
          // comments; the reader sees one sentence, so the markers go first.
          const kalimat = visibleText(html.replace(/<!-- -->/g, ""));
          c.expect(kalimat.includes(`${t("entry.halo", "public")}, ${depan}.`), `${label}: / does not greet by first name`);
          c.expect(!visibleText(html).includes(nama), `${label}: the full name "${nama}" is on /`);
        }
      }
      return c.verdict(
        "a learner signed in is greeted by first name only on /belajar and on /, and their full name is on neither page; the " +
        "educator who also learns is greeted on /belajar as their name is stored (D-020, names read from my_profile)",
      );
    },
  },
  {
    id: "DAISY-11-STUDIO-02",
    requires: ["app", "network"],
    run: async (ctx) => {
      // D-021 over real HTTP against the seed. The Studio tab is in the shell
      // of every role that may draft -- the teacher on Kelas, the head of
      // department on Pimpinan, the school administrator on Pendataan -- and
      // nowhere on the dean's pages; and Studio itself still refuses the dean,
      // who holds no Studio capability, with its one refusal. Read only.
      const c = new Checks();
      const base = ctx.appUrl!;
      const tabs = (html: string) => /<nav class="pin-tabs"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? "";
      for (const [peran, orang, jalan] of [
        ["EDUCATOR", PERSONA.alphaGuru, "/mengajar"],
        ["HEAD_OF_DEPARTMENT", PERSONA.alphaHod, "/pimpinan"],
        ["INSTITUTION_ADMIN", PERSONA.alphaAdmin, "/pendataan"],
      ] as const) {
        const sesi = await signIn(ctx, orang);
        const r = await get(`${base}${jalan}`, { headers: { cookie: sesi.cookie } });
        if (!c.expect(r.status === 200, `${peran} ${jalan} → ${r.status}`)) continue;
        const nav = tabs(await r.text());
        c.expect(nav.length > 0, `${peran} ${jalan}: the page has no tabs`);
        // DAISY-18: a menu link carries its working dot, an empty span at rest. D-138 step 3: in the staff navigation the
        // place is an ItemNav, its hidden icon, then its word, which is the link's name
        c.expect(new RegExp(`<a [^>]*href="/studio"[^>]*>(?:<svg [^>]*aria-hidden="true"[^>]*>[\\s\\S]*?</svg>)?(?:<span class="pin-nav-label">)?${t("nav.studio", "staff")}(?:</span>)?(?:<span aria-hidden="true" class="pin-tanda-tautan"></span>)?</a>`).test(nav),
          `${peran} ${jalan}: no Studio tab`);
      }
      const dekan = await signIn(ctx, PERSONA.dean);
      const p = await get(`${base}/pimpinan`, { headers: { cookie: dekan.cookie } });
      c.expect(p.status === 200, `DEAN /pimpinan → ${p.status}`);
      c.expect(!/href="\/studio"/.test(await p.text()), "the dean is offered Studio");
      const st = await get(`${base}/studio`, { headers: { cookie: dekan.cookie } });
      const html = await st.text();
      c.expect(st.status === 200 && visibleText(html).includes(t("studio.refused", "staff")), `DEAN /studio → ${st.status} without Studio's refusal`);
      c.expect(!visibleText(html).includes(t("studio.nav.unggah", "staff")), "the dean reaches Studio's own pages");
      return c.verdict(
        "the teacher's Kelas, the head of department's Pimpinan and the school administrator's Pendataan each carry the Studio " +
        "tab; the dean's Pimpinan offers no Studio anywhere, and Studio refuses the dean with its one refusal (D-021)",
      );
    },
  },
  {
    id: "DAISY-06-TERBIT-02",
    requires: ["app", "network"],
    run: async (ctx) => {
      // DAISY-06's Terbit step over real HTTP against the seed. The learning-
      // cycle school's own course ("Pecahan", the original, not a revision) is
      // read as its school administrator and its head of department: the
      // package page draws the seven named steps with exactly one current, and
      // where it stands agrees with the course and its latest release as each
      // reader's own token reads them. Published, the administrator (CAN_PUBLISH)
      // is offered a labelled withdrawal and the head of department is not;
      // nobody is shown a "Konfirmasi". Read only.
      const c = new Checks();
      const base = ctx.appUrl!;
      const langkah = ["susun", "periksa", "ajukan", "setujui", "buat", "kunci", "terbitkan"];
      for (const [peran, orang, bolehTarik] of [
        ["INSTITUTION_ADMIN", PERSONA.cycleAdmin, true],
        ["HEAD_OF_DEPARTMENT", PERSONA.cycleHod, false],
      ] as const) {
        const sesi = await signIn(ctx, orang);
        // L3 (D-132 C3, C8): the head of department holds Mengajar and Mengelola there, so Studio asks which; they review
        // as Mengelola (the school administrator holds one pair, set by the page itself, C4)
        if (peran === "HEAD_OF_DEPARTMENT") await pilihKonteksCookie(base, sesi.cookie, { tujuan: "MENGELOLA" });
        const rest = (q: string) => fetch(`${ctx.supabaseUrl}/rest/v1/${q}`, {
          headers: { apikey: ctx.supabaseAnonKey!, authorization: `Bearer ${sesi.accessToken}` },
        }).then((r) => r.json() as Promise<Array<Record<string, string | null>>>).catch(() => []);
        const kursus = await rest("courses?select=id,status&title=eq.Pecahan&supersedes_course_id=is.null");
        if (!c.expect(Array.isArray(kursus) && kursus.length === 1, `${peran}: the seeded course could not be read (${JSON.stringify(kursus).slice(0, 120)})`)) continue;
        const id = kursus[0].id!;
        const rilis = await rest(`plp_releases?select=status&course_id=eq.${id}&order=created_at.desc&limit=1`);
        const statusRilis = Array.isArray(rilis) && rilis.length ? rilis[0].status : null;
        const res = await get(`${base}/studio/paket/${id}`, { headers: { cookie: sesi.cookie } });
        if (!c.expect(res.status === 200, `${peran} /studio/paket → ${res.status}`)) continue;
        const html = await res.text();
        const a = html.indexOf('class="pin-lt"');
        const b = html.indexOf("</section>", a);
        const bagian = a >= 0 && b > a ? html.slice(a, b) : "";
        if (!c.expect(bagian.length > 0, `${peran}: the package page has no steps to publication`)) continue;
        const judul = [...bagian.matchAll(/<p class="pin-lt-judul">([^<]+)</g)].map((m) => m[1]);
        c.expect(judul.length === 8 && JSON.stringify(judul.slice(0, 7)) === JSON.stringify(langkah.map((k) => t(`studio.langkah.${k}.judul` as HleEvent, "staff"))),
          `${peran}: the steps read ${JSON.stringify(judul)}`);
        c.expect((bagian.match(/aria-current="step"/g) ?? []).length === 1, `${peran}: not exactly one step is current`);
        const terbit = statusRilis === "PUBLISHED";
        c.expect(terbit === /pin-lt-akhir pin-lt-selesai" aria-current="step"/.test(bagian),
          `${peran}: the release is ${statusRilis ?? "absent"} but the list ${terbit ? "does not end" : "ends"} at Terbit`);
        if (terbit) {
          const tarik = bagian.includes(`<span class="pin-meta">${t("studio.langkah.tarik.alasan", "staff")}</span>`);
          c.expect(tarik === bolehTarik, `${peran}: ${tarik ? "is" : "is not"} offered the withdrawal`);
        }
        c.expect(!visibleText(html).includes(t("studio.unggah.konfirmasi", "staff")), `${peran}: the package page still says "Konfirmasi"`);
        c.note(`${peran}: release ${statusRilis ?? "none"}`);
      }
      return c.verdict(
        "the seeded course's package page draws the seven named steps with exactly one current, standing where its course and " +
        "latest release stand for each reader; published, the school administrator is offered a labelled withdrawal and the " +
        "head of department is not, and no Konfirmasi is left on the page",
      );
    },
  },
  {
    id: "DAISY-07-LAPORAN-02",
    requires: ["app", "network"],
    run: async (ctx) => {
      // DAISY-07 over real HTTP against the seed. Alpha's school administrator
      // finds the school's reports in Konfigurasi: one school summary, linked at
      // the school's own INSTITUTION node, and one summary per active class,
      // each linked at a CLASS node of that school (read back as the same
      // reader). Both open on a report the school has (never "no figures to
      // show you"), and a report with no figure yet says what will make one
      // appear. A head of department and a dean, standing above the classes,
      // get Pimpinan's class-by-class section, and open the summaries they may
      // read from Pimpinan by clicking (DEA-03, X-12). Read only.
      const c = new Checks();
      const base = ctx.appUrl!;
      const muncul = ["penilaian", "akhir", "awal_akhir", "miskonsepsi", "sertifikat"].map((k) => t(`laporan.muncul.${k}` as HleEvent, "staff"));
      const admin = await signIn(ctx, PERSONA.alphaAdmin);
      const rest = (q: string) => fetch(`${ctx.supabaseUrl}/rest/v1/${q}`, {
        headers: { apikey: ctx.supabaseAnonKey!, authorization: `Bearer ${admin.accessToken}` },
      }).then((r) => r.json() as Promise<Array<Record<string, string | null>>>).catch(() => []);
      const k = await get(`${base}/konfigurasi`, { headers: { cookie: admin.cookie } });
      c.expect(k.status === 200, `INSTITUTION_ADMIN /konfigurasi → ${k.status}`);
      const html = await k.text();
      const a = html.indexOf('id="laporan"');
      const b = html.indexOf("</section>", a);
      const bagian = a >= 0 && b > a ? html.slice(a, b) : "";
      if (!c.expect(bagian.length > 0, "Konfigurasi has no Laporan section")) return c.verdict("");
      const sekolah = [...bagian.matchAll(/href="\/dekan\/ringkasan\?simpul=([0-9a-f-]{36})"/g)].map((m) => m[1]);
      const kelas = [...bagian.matchAll(/href="\/edukator\/ringkasan\?kelas=([0-9a-f-]{36})"/g)].map((m) => m[1]);
      c.expect(sekolah.length === 1, `the Laporan section links ${sekolah.length} school summaries, expected 1`);
      c.expect(kelas.length >= 1, "the Laporan section links no class summary, though Alpha's seed has active classes");
      const simpul = await rest(`org_nodes?select=id,kind,institution_id&id=in.(${[...sekolah, ...kelas].join(",")})`);
      const jenis = new Map((Array.isArray(simpul) ? simpul : []).map((n) => [n.id, n]));
      const inst = jenis.get(sekolah[0])?.institution_id;
      c.expect(jenis.get(sekolah[0])?.kind === "INSTITUTION", `the school summary is linked at a ${jenis.get(sekolah[0])?.kind ?? "unreadable"} node`);
      for (const id of kelas) {
        c.expect(jenis.get(id)?.kind === "CLASS" && jenis.get(id)?.institution_id === inst, `a class summary is linked at ${jenis.get(id)?.kind ?? "an unreadable node"} of another school or kind`);
      }
      for (const [jalan, judul] of [[`/dekan/ringkasan?simpul=${sekolah[0]}`, "laporan.institusi.judul"], [`/edukator/ringkasan?kelas=${kelas[0]}`, "laporan.kelas.judul"]] as const) {
        if (!sekolah[0] || !kelas[0]) break;
        const r = await get(`${base}${jalan}`, { headers: { cookie: admin.cookie } });
        const x = await r.text();
        const teks = visibleText(x);
        c.expect(r.status === 200 && teks.includes(t(judul, "staff")), `${jalan} → ${r.status} without its title`);
        c.expect(!teks.includes(t("laporan.kosong", "staff")), `${jalan} finds no report for the administrator's own school`);
        if (teks.includes(t("laporan.tak_ada_angka", "staff"))) {
          c.expect(muncul.some((m) => teks.includes(m)), `${jalan} has no figure yet and does not say what will make one appear`);
        }
      }
      for (const [peran, orang] of [["HEAD_OF_DEPARTMENT", PERSONA.alphaHod], ["DEAN", PERSONA.dean]] as const) {
        const sesi = await signIn(ctx, orang);
        const r = await get(`${base}/pimpinan`, { headers: { cookie: sesi.cookie } });
        if (!c.expect(r.status === 200, `${peran} /pimpinan → ${r.status}`)) continue;
        const x = await r.text();
        const i = x.indexOf('id="pin-perkelas"');
        if (!c.expect(i >= 0, `${peran}: Pimpinan has no class-by-class section above the classes`)) continue;
        const sec = x.slice(i, x.indexOf("</section>", i));
        // (D-138 step 4: the Disclosure's chevron icon follows the tag, hidden from readers)
        const ringkas = [...sec.matchAll(/<summary><span class="pin-kelas-nama">([^<]+)<\/span><span class="pin-kelas-tanda">([^<]+)<\/span>(?:<svg class="pin-ikon pin-chevron"[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/svg>)?<\/summary>/g)];
        const tanda = new Set(["pimpinan.kelas.ada", "pimpinan.kelas.belum", "laporan.metrik.bukan_untuk_anda"].map((k) => t(k as HleEvent, "staff")));
        c.expect(ringkas.length > 0 || visibleText(sec).includes(t("pimpinan.kelas.kosong", "staff")), `${peran}: the section neither lists a class nor says there is none`);
        c.expect(ringkas.every((m) => tanda.has(m[2].replace(/&#x27;/g, "'"))), `${peran}: a class is summarised as ${ringkas.map((m) => m[2]).join(", ")}`);

        // DEA-03 / X-12: the reports are one click from Pimpinan, for readers
        // who never see Konfigurasi. The school summary is offered exactly when
        // Pimpinan shows a school figure (a refusal never reaches the page), and
        // the Alpha dean, standing at the school, has them; each class the
        // reader may read links its own summary, and one they may not does not.
        const cC = x.indexOf('id="pin-bukti"');
        const figur = visibleText(cC >= 0 ? x.slice(cC, x.indexOf("</section>", cC)) : "");
        const labelSekolah = ["metrik.peserta_institusi.label", "metrik.kenaikan_institusi.label", "metrik.gerbang_keselamatan.label",
          "metrik.perbandingan_kohort.label", "metrik.kompetensi.label", "metrik.kredensial.label"].map((k) => t(k as HleEvent, "staff"));
        const adaSekolah = labelSekolah.some((l) => figur.includes(l));
        const lanjut = x.slice(x.indexOf('id="pin-lanjut"'));
        const keSekolah = [...lanjut.matchAll(/href="(\/dekan\/ringkasan\?simpul=[0-9a-f-]{36})"/g)].map((m) => m[1]);
        c.expect(keSekolah.length === (adaSekolah ? 1 : 0), `${peran}: ${keSekolah.length} school-summary link(s) while Pimpinan ${adaSekolah ? "shows" : "shows no"} school figure`);
        if (peran === "DEAN") c.expect(adaSekolah && keSekolah.length === 1, "DEAN at Alpha's root is not offered the school summary from Pimpinan");
        const perKelas = [...sec.matchAll(/<details[^>]*class="pin-kelas-bukti"[^>]*>([\s\S]*?)<\/details>/g)].map((m) => m[1]);
        const tandaKelas = (d: string) => (/<span class="pin-kelas-tanda">([^<]+)<\/span>/.exec(d)?.[1] ?? "").replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
        const bolehKelas = perKelas.filter((d) => tandaKelas(d) !== t("laporan.metrik.bukan_untuk_anda", "staff"));
        const keKelas = perKelas.map((d) => /href="(\/edukator\/ringkasan\?kelas=[0-9a-f-]{36})"/.exec(d)?.[1]);
        c.expect(perKelas.every((d, i) => Boolean(keKelas[i]) === bolehKelas.includes(d)),
          `${peran}: a class links its summary other than exactly when its figures are the reader's`);
        const tujuan: Array<[string, HleEvent]> = [];
        if (keSekolah[0]) tujuan.push([keSekolah[0].replace(/&amp;/g, "&"), "laporan.institusi.judul"]);
        const kelasPertama = keKelas.find(Boolean);
        if (kelasPertama) tujuan.push([kelasPertama, "laporan.kelas.judul"]);
        for (const [jalan, judul] of tujuan) {
          const r2 = await get(`${base}${jalan}`, { headers: { cookie: sesi.cookie } });
          const x2 = await r2.text();
          const teks = visibleText(x2);
          c.expect(r2.status === 200 && teks.includes(t(judul, "staff")), `${peran} ${jalan} → ${r2.status} without its title`);
          c.expect(!teks.includes(t("laporan.kosong", "staff")), `${peran} ${jalan} finds no report`);
          // a labelled figure: a refusal carries no label, so a page of refusals has none
          c.expect(/<h2 class="font-medium">[^<]+<\/h2>/.test(x2), `${peran} ${jalan} is a page of refusals`);
        }
        c.note(`${peran}: ${ringkas.length} class(es), ${bolehKelas.length} readable; school summary ${keSekolah.length ? "linked" : "not linked"}`);
      }
      return c.verdict(
        "Alpha's school administrator finds one school summary linked at the school's own INSTITUTION node and a summary for " +
        "each active class at a CLASS node of that school; both open on the school's report, and one with no figure yet says " +
        "what will make one appear. A head of department and a dean get Pimpinan's class-by-class section, each class " +
        "summarised as having figures, none yet, or not theirs; from Pimpinan the dean opens the school summary, which is " +
        "linked exactly when a school figure is theirs, and each readable class opens its own summary, never a page of refusals",
      );
    },
  },
  {
    id: "DAISY-17-KIRIM-02",
    requires: ["app", "network"],
    run: async (ctx) => {
      // DAISY-17's two same-push fixes, over real HTTP against the seed.
      // Konfigurasi offers "Menambahkan orang" exactly when /pendataan admits
      // the same reader -- asked of the platform administrator, whom it always
      // refused, and of Alpha's school administrator, whom it admits. A staff
      // reader refused a page reads the staff sentence, not "ask your teacher".
      const c = new Checks();
      const base = ctx.appUrl!;
      const ditolak = visibleText(`<p>${t("pendataan.ditolak", "staff")}</p>`);
      for (const [nama, orang] of [["SYSTEM_ADMIN", PERSONA.sysadmin], ["INSTITUTION_ADMIN", PERSONA.alphaAdmin]] as const) {
        const sesi = await signIn(ctx, orang);
        // L3 (D-132 C7): the platform administrator in «Seluruh platform», which records nobody
        if (nama === "SYSTEM_ADMIN") await pilihKonteksCookie(base, sesi.cookie, "MENGELOLA:PLATFORM");
        const k = await get(`${base}/konfigurasi`, { headers: { cookie: sesi.cookie } });
        const html = await k.text();
        c.expect(k.status === 200, `${nama} /konfigurasi → ${k.status}`);
        const ditawarkan = /href="\/pendataan"/.test(html);
        const p2 = await get(`${base}/pendataan`, { headers: { cookie: sesi.cookie } });
        const diterima = p2.status === 200 && !visibleText(await p2.text()).includes(ditolak);
        c.expect(ditawarkan === diterima, `${nama}: Konfigurasi ${ditawarkan ? "offers" : "does not offer"} Menambahkan orang, and /pendataan ${diterima ? "admits" : "refuses"} them`);
        c.note(`${nama}: ${diterima ? "admitted, offered" : "refused, not offered"}`);
      }
      const admin = await signIn(ctx, PERSONA.alphaAdmin);
      const r = await get(`${base}/pimpinan`, { headers: { cookie: admin.cookie } });
      const teks = visibleText(await r.text());
      c.expect(teks.includes(t("tolak.arti", "staff")) && !teks.includes(t("tolak.arti", "learner")),
        "a school administrator refused Pimpinan is told to ask their teacher");
      return c.verdict(
        "Konfigurasi offers Menambahkan orang exactly when /pendataan admits the same reader, for the platform " +
        "administrator and for Alpha's school administrator; a school administrator refused Pimpinan reads the staff " +
        "refusal, not \"ask your teacher\"",
      );
    },
  },
  {
    // BOB-18 (D-046; perf/2026-09-27-staging-latency.md). What one click costs,
    // counted: every call the app's server makes to Supabase while it answers
    // one page, read from the runner's count (selftest/hitung-fetch.cjs).
    // Studio asked 8 capabilities per school one after another and asked again
    // for the page (62-141 calls a click); Konfigurasi ran the schema lint on
    // every load; the sign-in check, profile and roles were read 2-10 times.
    id: "BOB18-A01",
    requires: ["app", "network"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      if (!c.expect(Boolean(ctx.fetchLog), "the runner kept no count of the app's calls, so this test would prove nothing")) {
        return c.verdict("");
      }
      const klik = async (cookie: string, jalan: string) => {
        const awal = readFileSync(ctx.fetchLog!, "utf8").length;
        const r = await get(`${base}${jalan}`, { headers: { cookie } });
        const html = await r.text();
        const baris = readFileSync(ctx.fetchLog!, "utf8").slice(awal).split("\n").filter(Boolean);
        // the evidence, pass or fail: what this click cost, by path
        const perJalan = new Map<string, number>();
        for (const b of baris) perJalan.set(b.split(" ")[1], (perJalan.get(b.split(" ")[1]) ?? 0) + 1);
        console.log(`  BOB18-A01 ${jalan} → ${r.status}: ${baris.length} Supabase calls; ` +
          [...perJalan].sort((a, b) => b[1] - a[1]).map(([p, x]) => `${p.replace(/^\/rest\/v1\//, "")} ${x}`).join(", "));
        const n = (path: string, kolom?: string) =>
          baris.filter((b) => b.split(" ")[1] === path && (kolom === undefined || b.split(" ")[2] === `select=${kolom}`)).length;
        return { status: r.status, html, total: baris.length, n };
      };
      const catatan: string[] = [];
      const sekali = (peran: string, jalan: string, k: Awaited<ReturnType<typeof klik>>) => {
        catatan.push(`${peran} ${jalan}: ${k.total} calls`);
        c.expect(k.status === 200, `${peran} ${jalan} → ${k.status}`);
        // proxy.ts checks the session for every request; the page asks once more
        c.expect(k.n("/auth/v1/user") <= 2, `${peran} ${jalan} asked Auth for the user ${k.n("/auth/v1/user")} times`);
        c.expect(k.n("/rest/v1/my_profile") <= 1, `${peran} ${jalan} read the profile ${k.n("/rest/v1/my_profile")} times`);
        c.expect(k.n("/rest/v1/rpc/is_system_admin") <= 1, `${peran} ${jalan} asked is_system_admin ${k.n("/rest/v1/rpc/is_system_admin")} times`);
        const peranku = k.n("/rest/v1/role_assignments", "role,valid_from,valid_until,revoked_at");
        c.expect(peranku <= 1, `${peran} ${jalan} read the viewer's own roles ${peranku} times`);
        // L3: the working context is read once a click (twice only on the click that sets it, C4), the pairs at most once
        c.expect(k.n("/rest/v1/rpc/konteks_saya") <= 2 && k.n("/rest/v1/rpc/konteks_tempat_saya") <= 1,
          `${peran} ${jalan} read the context ${k.n("/rest/v1/rpc/konteks_saya")} times and the pairs ${k.n("/rest/v1/rpc/konteks_tempat_saya")} times`);
      };

      const sys = await signIn(ctx, PERSONA.sysadmin);
      const admin = await signIn(ctx, PERSONA.alphaAdmin);
      const guru = await signIn(ctx, PERSONA.alphaGuru);
      // L3 (D-132 C7): the platform administrator's Studio is a school's working context's, chosen on the chooser
      await pilihKonteksCookie(base, sys.cookie, { tujuan: "MENGELOLA", nama: "Sekolah Sintetis Alpha" });

      // (c) Studio: one capability call, shared by the layout and the page
      for (const [peran, sesi, jalan] of [
        ["SYSTEM_ADMIN", sys, "/studio"], ["SYSTEM_ADMIN", sys, "/studio/tinjau"], ["INSTITUTION_ADMIN", admin, "/studio/unggah"],
      ] as const) {
        const k = await klik(sesi.cookie, jalan);
        sekali(peran, jalan, k);
        c.expect(k.n("/rest/v1/rpc/can_in_institution") === 0,
          `${peran} ${jalan} asked can_in_institution ${k.n("/rest/v1/rpc/can_in_institution")} times, one call per capability per school`);
        c.expect(k.n("/rest/v1/rpc/studio_capabilities") === 1,
          `${peran} ${jalan} asked studio_capabilities ${k.n("/rest/v1/rpc/studio_capabilities")} times; expected once for the layout and the page together`);
        // the capability read was the only other role_assignments read on a Studio page
        c.expect(k.n("/rest/v1/role_assignments") <= 1, `${peran} ${jalan} read role_assignments ${k.n("/rest/v1/role_assignments")} times`);
      }

      // (b) Konfigurasi: the lint only when asked, and the platform's checks are «Seluruh platform»'s (L3, D-132 C7)
      await pilihKonteksCookie(base, sys.cookie, "MENGELOLA:PLATFORM");
      for (const [peran, sesi] of [["SYSTEM_ADMIN", sys], ["INSTITUTION_ADMIN", admin]] as const) {
        const k = await klik(sesi.cookie, "/konfigurasi");
        sekali(peran, "/konfigurasi", k);
        c.expect(k.n("/rest/v1/rpc/platform_schema_lint") === 0, `${peran} /konfigurasi ran the schema lint on an ordinary load`);
      }
      // (e) the page "Berikan peran" returns to once the grant is saved
      const kembali = await klik(sys.cookie, "/konfigurasi?bagian=roles&hasil=ok");
      sekali("SYSTEM_ADMIN", "/konfigurasi?bagian=roles&hasil=ok", kembali);
      c.expect(kembali.n("/rest/v1/rpc/platform_schema_lint") === 0, "the page a saved grant returns to ran the schema lint");
      const diminta = await klik(sys.cookie, "/konfigurasi?periksa=skema");
      sekali("SYSTEM_ADMIN", "/konfigurasi?periksa=skema", diminta);
      c.expect(diminta.n("/rest/v1/rpc/platform_schema_lint") === 1, `asked for, the schema lint ran ${diminta.n("/rest/v1/rpc/platform_schema_lint")} times`);
      c.expect(!visibleText(diminta.html).includes(t("config.card.health.periksa", "staff")), "asked for, the health card still offers to run the checks");
      const biasa = await klik(sys.cookie, "/konfigurasi");
      c.expect(visibleText(biasa.html).includes(t("config.card.health.periksa", "staff")), "the platform admin is not offered the checks on Konfigurasi");

      // (d) an ordinary page
      for (const jalan of ["/", "/mengajar"]) sekali("EDUCATOR", jalan, await klik(guru.cookie, jalan));

      c.note(catatan.join("; "));
      return c.verdict(
        "counted through the running app, a Studio click asks studio_capabilities once and can_in_institution never; Konfigurasi, " +
        "including the page a saved grant returns to, runs the schema lint only when the platform admin asks for it; and on every click counted the user is asked of Auth at " +
        "most twice (the proxy's check and the page's), the profile read at most once, is_system_admin asked at most once and " +
        "the viewer's own roles read at most once (a Studio page reads role_assignments for nothing else); the working context is " +
        "read at most twice a click and the pairs held at most once (L3). Calls per click: " + catatan.join("; "),
      );
    },
  },
  {
    // BOB-11 (M9; checklist STU-11, ADM-10). LESSON MEDIA PLAY. The player's
    // <audio>/<video> pointed at /api/assets/read-url, which answered JSON, so
    // nothing played. Driven end to end: a real object at the seeded lesson's
    // path, the learner's own lesson page, the src it renders, and the bytes
    // that src leads to; the author's Studio preview the same way; and a
    // teacher of another school refused.
    id: "BOB11-A01",
    requires: ["app", "network"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      if (!c.expect(Boolean(ctx.supabaseServiceRoleKey), "no service-role key to place the media object, so this test would prove nothing")) {
        return c.verdict("");
      }
      const murid = await signIn(ctx, PERSONA.cycleLearner);
      const rpc = async (sesi: Session, nama: string, body: unknown) => {
        const r = await fetch(`${ctx.supabaseUrl}/rest/v1/rpc/${nama}`, {
          method: "POST",
          headers: { apikey: ctx.supabaseAnonKey!, authorization: `Bearer ${sesi.accessToken}`, "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        return r.ok ? ((await r.json()) as unknown) : null;
      };
      // the learner's own lesson with an audio, found through the contract
      let tugas = "", pelajaran = "", jalur = "";
      for (const a of ((await rpc(murid, "my_learning_assignments", {})) ?? []) as Array<{ learning_assignment_id: string }>) {
        for (const l of ((await rpc(murid, "learner_lessons", { p_learning_assignment: a.learning_assignment_id })) ?? []) as
          Array<{ lesson_id: string; media: Array<{ jenis: string; path: string }> | null }>) {
          const m = (l.media ?? []).find((x) => x.jenis === "audio");
          if (m && !jalur) { tugas = a.learning_assignment_id; pelajaran = l.lesson_id; jalur = m.path; }
        }
      }
      if (!c.expect(jalur !== "", "the seeded learner has no lesson with an audio, so this test would prove nothing")) return c.verdict("");

      // a real object at that path, placed as the server places media
      const isi = `ID3 BOB-11 ${Date.now()}`;
      const put = await fetch(`${ctx.supabaseUrl}/storage/v1/object/assets/${jalur}`, {
        method: "POST",
        headers: { apikey: ctx.supabaseServiceRoleKey!, authorization: `Bearer ${ctx.supabaseServiceRoleKey!}`,
                   "content-type": "audio/mpeg", "x-upsert": "true" },
        body: isi,
      });
      c.expect(put.ok, `placing the audio at ${jalur} failed (${put.status})`);

      const srcDari = (html: string, tag: string) =>
        (new RegExp(`<${tag}\\b[^>]*\\bsrc="([^"]+)"`).exec(html)?.[1] ?? "").replace(/&amp;/g, "&");
      const putar = async (siapa: string, cookie: string, src: string) => {
        const r = await get(`${base}${src}`, { headers: { cookie } });
        const ke = r.headers.get("location") ?? "";
        c.expect(r.status === 302 && ke.startsWith(`${ctx.supabaseUrl}/storage/v1/object/sign/assets/`),
          `${siapa}: the player's src answered ${r.status} ${ke ? "to " + ke.slice(0, 60) : "with no redirect"}, not the file`);
        if (ke) {
          const f = await fetch(ke);
          c.expect(f.status === 200 && (await f.text()) === isi, `${siapa}: the signed URL did not return the lesson's audio (${f.status})`);
        }
      };

      // 1. the learner hears it in the lesson
      const hal = await get(`${base}/belajar/${tugas}/pelajaran/${pelajaran}`, { headers: { cookie: murid.cookie } });
      const htmlMurid = await hal.text();
      c.expect(hal.status === 200, `the learner's lesson → ${hal.status}`);
      const src = srcDari(htmlMurid, "audio");
      c.expect(src.startsWith("/api/assets/read-url?") && src.includes("alih=1"), `the lesson's <audio> src is ${JSON.stringify(src)}`);
      if (src) await putar("the learner", murid.cookie, src);

      // 2. the author previews it in Studio, before and after release alike
      const guru = await signIn(ctx, PERSONA.cycleEducator);
      const pra = await get(`${base}/studio/pratinjau/${pelajaran}`, { headers: { cookie: guru.cookie } });
      const srcGuru = srcDari(await pra.text(), "audio");
      c.expect(pra.status === 200 && srcGuru.includes("alih=1"), `the author's Studio preview → ${pra.status} with <audio> src ${JSON.stringify(srcGuru)}`);
      if (srcGuru) await putar("the author in Studio", guru.cookie, srcGuru);

      // 3. a teacher of another school is refused the same src, as a stranger is
      const lain = await signIn(ctx, PERSONA.alphaGuru);
      if (src) {
        const r = await get(`${base}${src}`, { headers: { cookie: lain.cookie } });
        c.expect(r.status === 403 && !r.headers.get("location"), `another school's teacher got ${r.status} for the lesson's audio`);
      }
      // 4. the JSON answer is unchanged for whoever reads it
      if (src) {
        const r = await get(`${base}${src.replace(/&alih=1/, "")}`, { headers: { cookie: murid.cookie } });
        const j = r.status === 200 ? ((await r.json()) as { url?: string; expiresIn?: number }) : {};
        c.expect(typeof j.url === "string" && j.expiresIn === 60, `without alih the route answered ${r.status} ${JSON.stringify(j).slice(0, 80)}`);
      }
      return c.verdict(
        "through the running app, the learner's own lesson renders an <audio> whose src (read-url with alih=1) answers 302 " +
        "to a signed storage URL returning the lesson's audio; the lesson's author gets the same from the Studio preview " +
        "through may_preview_lesson_media; a teacher of another school is refused 403; and read-url without alih still " +
        "answers JSON with a 60-second URL",
      );
    },
  },
  {
    id: "DAISY-13-KARTU-02",
    requires: ["app", "network"],
    run: async (ctx) => {
      // DAISY-13 against BOB-12's running route (they are gated together).
      // The card form's own request, from PINTAR's own page, for a card number
      // nobody holds: the route answers with its one non-match code and the
      // screen reads it as the one "Belum cocok", never as a wait. The same
      // request from another site is refused, and read as a reload. A fresh
      // random number each run, so no seeded card's cooldown is touched.
      const c = new Checks();
      const base = ctx.appUrl!;
      const asal = new URL(base).origin;
      const nomor = `10${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;
      const kirim = async (origin: string) => {
        const fd = new FormData();
        fd.set("kartu", nomor); fd.set("pin", "000000"); fd.set("lanjut", "/belajar");
        const r = await get(`${base}/masuk/kartu`, { method: "POST", body: fd, headers: { origin, accept: "application/json" } });
        const body = await r.json().catch(() => null);
        return { status: r.status, body, jawaban: bacaJawabanKartu(r.status, body, r.headers.get("retry-after")) };
      };
      const sendiri = await kirim(asal);
      c.expect(sendiri.status === 401 && (sendiri.body as { code?: string } | null)?.code === "CARD_NOT_MATCHED",
        `an unknown card from PINTAR's own page → ${sendiri.status} ${JSON.stringify(sendiri.body)}, expected 401 CARD_NOT_MATCHED`);
      c.expect(sendiri.jawaban.k === "gagal" && sendiri.jawaban.kode === "CARD_NOT_MATCHED" && sendiri.jawaban.tunggu === null,
        `the screen reads that answer as ${JSON.stringify(sendiri.jawaban)}`);
      const asing = await kirim("https://contoh.example");
      c.expect(asing.status === 403 && asing.jawaban.k === "gagal" && asing.jawaban.kode === "CARD_REQUEST_REFUSED",
        `the same request from another site → ${asing.status}, read as ${JSON.stringify(asing.jawaban)}`);
      c.note(`card ${nomor.slice(0, 2)}…: ${sendiri.status}, foreign origin: ${asing.status}`);
      return c.verdict(
        "against BOB-12's running route, the card form's own request for a card nobody holds is answered 401 " +
        "CARD_NOT_MATCHED and read by the screen as the one non-match with no wait; the same request from another " +
        "site is refused 403 and read as CARD_REQUEST_REFUSED",
      );
    },
  },
  {
    // BOB-19 over real HTTP against the seeded, fully migrated local stack. The
    // platform administrator's health card, asked to check, reads healthy by
    // the one rule F01-T13 uses; before, any value but 0 read "Perlu perhatian".
    // The app's calls are read from the runner's count (selftest/hitung-fetch.cjs):
    // the lint runs only when asked (BOB-18 (b)), and persons_awaiting_first_role
    // is asked only for the platform administrator. A confirmed upload's return
    // renders "Paket dibuat." on the course page.
    id: "BOB19-A01",
    requires: ["app", "network"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      if (!c.expect(Boolean(ctx.fetchLog), "the runner kept no count of the app's calls, so this test would prove nothing")) {
        return c.verdict("");
      }
      const klik = async (cookie: string, jalan: string) => {
        const awal = readFileSync(ctx.fetchLog!, "utf8").length;
        const r = await get(`${base}${jalan}`, { headers: { cookie } });
        const html = await r.text();
        const baris = readFileSync(ctx.fetchLog!, "utf8").slice(awal).split("\n").filter(Boolean);
        return { status: r.status, html, n: (path: string) => baris.filter((b) => b.split(" ")[1] === path).length };
      };
      const s = (k: HleEvent) => t(k, "staff");
      const kartu = (html: string) => {
        const i = html.indexOf(`>${s("config.card.health")}<`);
        return i < 0 ? "" : visibleText(html.slice(i, html.indexOf("</div>", i)));
      };
      const sys = await signIn(ctx, PERSONA.sysadmin);
      const admin = await signIn(ctx, PERSONA.alphaAdmin);
      // L3 (D-132 C7): the platform's checks and its list of people holding nothing are «Seluruh platform»'s
      await pilihKonteksCookie(base, sys.cookie, "MENGELOLA:PLATFORM");

      const periksa = await klik(sys.cookie, "/konfigurasi?periksa=skema");
      const k1 = kartu(periksa.html);
      c.expect(periksa.status === 200 && periksa.n("/rest/v1/rpc/platform_schema_lint") === 1, `SYSTEM_ADMIN /konfigurasi?periksa=skema → ${periksa.status}, lint asked ${periksa.n("/rest/v1/rpc/platform_schema_lint")} times`);
      c.expect(k1.includes(s("config.kesehatan.sehat")) && !k1.includes(s("config.kesehatan.perhatian")),
        `a clean, fully migrated database does not read healthy: ${k1.slice(0, 300)}`);

      const biasa = await klik(sys.cookie, "/konfigurasi");
      c.expect(biasa.status === 200 && biasa.n("/rest/v1/rpc/platform_schema_lint") === 0 && kartu(biasa.html).includes(s("config.card.health.periksa")),
        "an ordinary Konfigurasi load runs the lint, or does not offer the check");
      c.expect(biasa.n("/rest/v1/rpc/persons_awaiting_first_role") === 1, `the platform administrator's Konfigurasi asked persons_awaiting_first_role ${biasa.n("/rest/v1/rpc/persons_awaiting_first_role")} times`);
      const sekolah = await klik(admin.cookie, "/konfigurasi");
      c.expect(sekolah.status === 200 && sekolah.n("/rest/v1/rpc/persons_awaiting_first_role") === 0,
        `the school administrator's Konfigurasi still asks persons_awaiting_first_role (${sekolah.n("/rest/v1/rpc/persons_awaiting_first_role")} times), which the database refuses`);
      c.expect(kartu(sekolah.html).includes(s("config.kesehatan.bukan_admin")) && sekolah.n("/rest/v1/rpc/platform_schema_lint") === 0,
        "the school administrator's card does not say who runs the checks");

      // and Studio is a school's: the platform administrator's, in the learning-cycle school's working context
      await pilihKonteksCookie(base, sys.cookie, { tujuan: "MENGELOLA", nama: "Sekolah Sintetis Siklus" });
      const studio = await klik(sys.cookie, "/studio");
      const kursus = /href="\/studio\/paket\/([0-9a-f-]{36})"/.exec(studio.html)?.[1];
      if (c.expect(Boolean(kursus), "the platform administrator's Studio lists no course to return to")) {
        const kembali = await klik(sys.cookie, `/studio/paket/${kursus}?bagian=paket&hasil=ok&kode=DRAFT_CREATED`);
        c.expect(kembali.status === 200 && /role="status"/.test(kembali.html) && visibleText(kembali.html).includes(`${s("studio.hasil.ok")} Paket dibuat.`),
          "a confirmed upload's return does not read \"Paket dibuat.\" on its course page");
      }
      return c.verdict(
        "the platform administrator's RENDERED health card, asked to check the seeded, fully migrated stack, reads " +
        "\"Semua pemeriksaan lolos\" and never \"Perlu perhatian\"; an ordinary Konfigurasi load runs no lint and offers the " +
        "check; persons_awaiting_first_role is asked once for the platform administrator and never for Alpha's school " +
        "administrator, whose card says who runs the checks; a confirmed upload's return reads \"Paket dibuat.\" as a status " +
        "on its course page",
      );
    },
  },
  {
    // BOB-11 gate review: the hour is lesson media's only. A profile photo keeps
    // 60 seconds with or without alih. Read from the signed URL storage issued
    // (its token's exp - iat), not from what the route says about it.
    id: "BOB11-A02",
    requires: ["app", "network"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      if (!c.expect(Boolean(ctx.supabaseServiceRoleKey), "no service-role key to place the objects, so this test would prove nothing")) {
        return c.verdict("");
      }
      const murid = await signIn(ctx, PERSONA.cycleLearner);
      const hdr = { apikey: ctx.supabaseAnonKey!, authorization: `Bearer ${murid.accessToken}` };
      const rpc = async (nama: string, body: unknown) => {
        const r = await fetch(`${ctx.supabaseUrl}/rest/v1/rpc/${nama}`, {
          method: "POST", headers: { ...hdr, "content-type": "application/json" }, body: JSON.stringify(body),
        });
        return r.ok ? ((await r.json()) as unknown) : null;
      };
      const taruh = async (jalur: string, jenis: string) => {
        const r = await fetch(`${ctx.supabaseUrl}/storage/v1/object/assets/${jalur}`, {
          method: "POST",
          headers: { apikey: ctx.supabaseServiceRoleKey!, authorization: `Bearer ${ctx.supabaseServiceRoleKey!}`,
                     "content-type": jenis, "x-upsert": "true" },
          body: `BOB11-A02 ${Date.now()}`,
        });
        c.expect(r.ok, `placing ${jalur} failed (${r.status})`);
      };
      /** How long the signed URL storage issued stays valid, from its token. */
      const umur = (url: string) => {
        try {
          const tok = new URL(url, ctx.supabaseUrl ?? undefined).searchParams.get("token") ?? "";
          const p = JSON.parse(Buffer.from(tok.split(".")[1] ?? "", "base64url").toString()) as { iat?: number; exp?: number };
          return typeof p.exp === "number" && typeof p.iat === "number" ? p.exp - p.iat : null;
        } catch { return null; }
      };
      const lewatAlih = async (jalur: string) => {
        const r = await get(`${base}/api/assets/read-url?path=${encodeURIComponent(jalur)}&alih=1`, { headers: { cookie: murid.cookie } });
        const ke = r.headers.get("location") ?? "";
        c.expect(r.status === 302 && ke !== "", `${jalur} with alih=1 answered ${r.status}, not a redirect`);
        return ke ? umur(ke) : null;
      };
      const lewatJson = async (jalur: string) => {
        const r = await get(`${base}/api/assets/read-url?path=${encodeURIComponent(jalur)}`, { headers: { cookie: murid.cookie } });
        const j = r.status === 200 ? ((await r.json()) as { url?: string }) : {};
        c.expect(typeof j.url === "string", `${jalur} without alih answered ${r.status}`);
        return j.url ? umur(j.url) : null;
      };

      // the learner's own profile photo
      const pr = await fetch(`${ctx.supabaseUrl}/rest/v1/my_profile?select=person_id`, { headers: hdr });
      const orang = pr.ok ? ((await pr.json()) as Array<{ person_id: string }>)[0]?.person_id ?? "" : "";
      if (!c.expect(orang !== "", "the seeded learner has no profile, so this test would prove nothing")) return c.verdict("");
      const foto = `profile/${orang}/bob11-a02.jpg`;
      await taruh(foto, "image/jpeg");

      // the learner's own lesson audio, found through the contract
      let media = "";
      for (const a of ((await rpc("my_learning_assignments", {})) ?? []) as Array<{ learning_assignment_id: string }>) {
        for (const l of ((await rpc("learner_lessons", { p_learning_assignment: a.learning_assignment_id })) ?? []) as
          Array<{ media: Array<{ jenis: string; path: string }> | null }>) {
          media ||= (l.media ?? []).find((x) => x.jenis === "audio")?.path ?? "";
        }
      }
      if (!c.expect(media !== "", "the seeded learner has no lesson with an audio, so this test would prove nothing")) return c.verdict("");
      await taruh(media, "audio/mpeg");

      const fotoAlih = await lewatAlih(foto), fotoJson = await lewatJson(foto);
      const mediaAlih = await lewatAlih(media), mediaJson = await lewatJson(media);
      c.expect(fotoAlih === 60, `a profile photo through alih=1 was signed for ${fotoAlih} s, not 60`);
      c.expect(fotoJson === 60, `a profile photo without alih was signed for ${fotoJson} s, not 60`);
      c.expect(mediaAlih === 3600, `lesson media through alih=1 was signed for ${mediaAlih} s, not an hour`);
      c.expect(mediaJson === 60, `lesson media without alih was signed for ${mediaJson} s, not 60`);
      return c.verdict(
        "through the running app's route /api/assets/read-url, the signed URL storage issued (its token's exp - iat) is " +
        "valid for an hour only for lesson media with alih=1; the learner's own profile photo is signed for 60 seconds with " +
        "and without alih, and lesson media without alih for 60 seconds",
      );
    },
  },
  {
    // BOB-20 (D-048). A school admin sees and names the school's own staff, and
    // finds a newly recorded teacher, through the running app; another
    // school's staff and the platform administrator stay closed, by list, by
    // direct id and by profile photo. A DECLARED EXCEPTION to the black-box
    // rule, as F09-C02's: the two schools' staff are built through the
    // database owner (facility `db`), because no seed holds a school's
    // recorded teacher with no role; everything asserted is read as the
    // Alpha administrator through the app and PostgREST.
    id: "BOB20-A01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      const db = process.env.SUPABASE_DB_URL!;
      if (!c.expect(Boolean(ctx.supabaseServiceRoleKey), "no service-role key to place the photos, so this test would prove nothing")) {
        return c.verdict("");
      }
      const psql = (...sql: string[]) => {
        const r = spawnSync("psql", ["-q", "-v", "ON_ERROR_STOP=1", "-At", ...sql.flatMap((q) => ["-c", q]), db], { encoding: "utf8" });
        if (r.status !== 0) throw new Error(`psql: ${(r.stderr || "").trim().split("\n").pop()}`);
        return r.stdout.trim();
      };
      const seeding = (q: string) =>
        psql("begin", "select set_config('app.seed_intent', 'synthetic', true)", q, "commit")
          .split("\n").filter((l) => l !== "synthetic").join("\n");
      const tag = Date.now().toString(36).slice(-6);
      const sekolah = (nama: string) => {
        const id = seeding(`insert into public.institutions (name, slug, is_synthetic, is_active) values ('${nama} ${tag}', '${nama.toLowerCase().replace(/\s+/g, "-")}-${tag}', true, true) returning id`);
        psql("update public.institutions set namespace = (select x from generate_series(1, 500) g, " +
          `lateral (select upper(substr(md5('${tag}${id}' || g), 1, 3)) x) q ` +
          "where x ~ '^[A-Z]{3}$' and not exists (select 1 from public.institutions t where upper(t.namespace) = q.x) limit 1) " +
          `where id = '${id}'`);
        return id;
      };
      const orang = (nama: string, di: string, peran?: string) => {
        const id = psql(`insert into public.persons (display_name) values ('${nama}') returning id`);
        psql(`select public.issue_institutional_id('${id}', '${di}')`);
        if (peran) {
          seeding("insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until) " +
            `values ('${id}', '${peran}', '${di}', now() - interval '1 day', now() + interval '30 days')`);
        }
        return id;
      };
      const S = sekolah("Sekolah Staf"), O = sekolah("Sekolah Lain");
      const namaGuru = `Guru Tetap ${tag}`, namaBaru = `Guru Baru ${tag}`, namaLain = `Guru Sekolah Lain ${tag}`, namaLainBaru = `Guru Baru Lain ${tag}`;
      seeding("insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until) " +
        `select a.person_id, 'INSTITUTION_ADMIN', '${S}', now() - interval '1 day', now() + interval '30 days' ` +
        `from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = '${PERSONA.alphaAdmin.email}'`);
      const guru = orang(namaGuru, S, "EDUCATOR");
      const baru = orang(namaBaru, S);
      const lain = orang(namaLain, O, "EDUCATOR");
      orang(namaLainBaru, O);
      const platform = psql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = '${PERSONA.sysadmin.email}'`);
      try {
        // the two photos, placed as the server places them
        for (const p of [guru, lain]) {
          const r = await fetch(`${ctx.supabaseUrl}/storage/v1/object/assets/profile/${p}/foto.jpg`, {
            method: "POST",
            headers: { apikey: ctx.supabaseServiceRoleKey!, authorization: `Bearer ${ctx.supabaseServiceRoleKey!}`, "content-type": "image/jpeg", "x-upsert": "true" },
            body: `BOB20-A01 ${tag}`,
          });
          c.expect(r.ok, `placing a profile photo failed (${r.status})`);
        }
        const admin = await signIn(ctx, PERSONA.alphaAdmin);
        const hdr = { apikey: ctx.supabaseAnonKey!, authorization: `Bearer ${admin.accessToken}` };
        const rpc = async (nama: string, body: unknown) => {
          const r = await fetch(`${ctx.supabaseUrl}/rest/v1/rpc/${nama}`, { method: "POST", headers: { ...hdr, "content-type": "application/json" }, body: JSON.stringify(body) });
          return { status: r.status, data: r.ok ? ((await r.json()) as unknown) : null };
        };

        // 1. Konfigurasi names the school's own teacher in the grant list and
        //    offers the newly recorded one in the person picker. The admin now
        //    holds two schools, so the page asks which (D-132 C4) and the
        //    admin chooses this one on the chooser.
        const tanya = await get(`${base}/konfigurasi?sekolah=${S}`, { headers: { cookie: admin.cookie } });
        c.expect(tanya.status === 307 && (tanya.headers.get("location") ?? "").startsWith("/?lanjut="),
          `with two schools held, /konfigurasi did not ask which (${tanya.status} ${tanya.headers.get("location")})`);
        await pilihKonteksCookie(base, admin.cookie, `MENGELOLA:${S}`);
        const hal = await get(`${base}/konfigurasi?sekolah=${S}`, { headers: { cookie: admin.cookie } });
        const html = await hal.text();
        const teks = visibleText(html);
        c.expect(hal.status === 200, `the school admin's /konfigurasi → ${hal.status}`);
        c.expect(teks.includes(`${namaGuru} · ${t("role.EDUCATOR" as HleEvent, "staff")}`),
          "the grant list does not name the school's own teacher (it shows an ID)");
        c.expect(html.includes(`>${namaGuru}</option>`), "the person picker does not offer the school's own teacher");
        c.expect(html.includes(`>${namaBaru}</option>`), "the person picker does not offer the teacher the school has just recorded");
        c.expect(!teks.includes(namaLain) && !teks.includes(namaLainBaru), "the school admin's Konfigurasi names another school's staff");

        // 2. by direct id: the school's own staff yes; another school's and the platform administrator no
        const baca = async (id: string) => {
          const r = await fetch(`${ctx.supabaseUrl}/rest/v1/persons?select=id,display_name&id=eq.${id}`, { headers: hdr });
          return r.ok ? ((await r.json()) as unknown[]).length : -1;
        };
        c.expect(await baca(guru) === 1 && await baca(baru) === 1, "the school admin cannot read the school's own staff by id from persons");
        c.expect(await baca(lain) === 0, "the school admin reads another school's teacher by id from persons");
        c.expect(await baca(platform) === 0, "the school admin reads the platform administrator by id from persons");
        const lihat = async (id: string) => (await rpc("person_visible_to_me", { p_person: id })).data;
        c.expect(await lihat(guru) === true && await lihat(baru) === true, "person_visible_to_me does not answer yes for the school's own staff");
        c.expect(await lihat(lain) === false && await lihat(platform) === false,
          "person_visible_to_me answers yes for another school's teacher or the platform administrator");

        // 3. the school's own waiting list, and not another school's
        const daftar = await rpc("persons_awaiting_first_role_at", { p_institution: S });
        const ids = ((daftar.data ?? []) as Array<{ person_id: string }>).map((x) => x.person_id);
        c.expect(daftar.status === 200 && ids.includes(baru) && !ids.includes(guru),
          `the school's waiting list → ${daftar.status}, ${ids.includes(baru) ? "with" : "without"} the new teacher`);
        const asing = await rpc("persons_awaiting_first_role_at", { p_institution: O });
        c.expect(asing.status !== 200 || ((asing.data ?? []) as unknown[]).length === 0,
          `another school's waiting list answered the school admin (${asing.status})`);

        // 4. a profile photo through read-url: the school's own teacher's, and not another school's
        const foto = async (id: string) => (await get(`${base}/api/assets/read-url?path=profile/${id}/foto.jpg`, { headers: { cookie: admin.cookie } })).status;
        const fGuru = await foto(guru), fLain = await foto(lain);
        c.expect(fGuru === 200, `the school's own teacher's photo → ${fGuru}`);
        c.expect(fLain === 403, `another school's teacher's photo → ${fLain}, expected 403`);
      } finally {
        seeding("update public.role_assignments set revoked_at = now() where role = 'INSTITUTION_ADMIN' " +
          `and scope_node_id = '${S}' and revoked_at is null`);
      }
      return c.verdict(
        "as a school's INSTITUTION_ADMIN, through the running app: Konfigurasi's grant list names the school's own " +
          "teacher with the role, the person picker offers that teacher and the teacher the school has just recorded, " +
          "and nothing on the page names another school's staff; by direct id the school admin reads the school's own " +
          "staff from persons and person_visible_to_me, and neither another school's teacher nor the platform " +
          "administrator; persons_awaiting_first_role_at names the new teacher and not the one holding a role, and " +
          "another school's list answers nothing; read-url serves the school's own teacher's profile photo and refuses " +
          "another school's teacher's with 403",
      );
    },
  },
  {
    // BOB-12 (identity Gate 1): the class card signs in through the running
    // route, POST /masuk/kartu, with live Auth -- the card's own sign-in, the
    // one non-match, the cooldown read before Auth is asked, and the GET.
    // Two Auth sign-ins only: the cooldown is primed through the database, as
    // five earlier failures would leave it, so the suite stays inside Auth's
    // own per-address limit.
    id: "BOB12-A01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const base = ctx.appUrl!;
      const db = process.env.SUPABASE_DB_URL!;
      const psql = (sql: string) => {
        const r = spawnSync("psql", ["-q", "-v", "ON_ERROR_STOP=1", "-At", "-c", sql, db], { encoding: "utf8" });
        if (r.status !== 0) throw new Error(`psql: ${(r.stderr || "").trim().split("\n").pop()}`);
        return r.stdout.trim();
      };
      const kunci = productionCooldownKey("7001");
      const tercatat = () => psql(`select coalesce((select cardinality(percobaan) from public.card_signin_cooldowns where kunci = '${kunci}'), -1)`);
      const kirim = async (pin: string, origin = new URL(base).origin) => {
        const fd = new FormData();
        fd.set("kartu", "7001"); fd.set("pin", pin); fd.set("lanjut", "");
        const r = await get(`${base}/masuk/kartu`, { method: "POST", body: fd, headers: { origin, accept: "application/json" } });
        return { r, body: (await r.json().catch(() => null)) as Record<string, unknown> | null };
      };
      psql(`delete from public.card_signin_cooldowns where kunci = '${kunci}'`);
      try {
        // a wrong PIN: the one non-match, counted against the card
        const salah = await kirim("1357");
        c.expect(salah.r.status === 401 && salah.body?.code === "CARD_NOT_MATCHED" && salah.r.headers.get("cache-control")?.includes("no-store") === true,
          `a wrong PIN → ${salah.r.status} ${JSON.stringify(salah.body)}`);
        c.expect(salah.r.headers.getSetCookie().every((k) => !/^sb-[^=]+-auth-token/.test(k)), "a wrong PIN set a session cookie");
        c.expect(tercatat() === "1", `a wrong PIN left ${tercatat()} attempt(s) counted, expected 1`);

        // the card's own PIN: signed in with a card's lifetime, sent to the learner's home, the record cleared
        const benar = await kirim("2468");
        const kue = benar.r.headers.getSetCookie().filter((k) => /^sb-[^=]+-auth-token(\.\d+)?=/.test(k));
        c.expect(benar.r.status === 200 && benar.body?.ok === true && typeof benar.body?.tujuan === "string",
          `the card's own PIN → ${benar.r.status} ${JSON.stringify(benar.body)}`);
        c.expect(kue.length > 0 && kue.every((k) => /Max-Age=3600/i.test(k)),
          `the sign-in's session cookies: ${kue.length} with Max-Age ${kue.map((k) => /Max-Age=(\d+)/i.exec(k)?.[1]).join(",")}, expected 3600`);
        c.expect(tercatat() === "-1", `a sign-in left the card's record (${tercatat()} attempt(s))`);
        if (typeof benar.body?.tujuan === "string" && kue.length) {
          const cookie = kue.map((k) => k.split(";")[0]).join("; ");
          // RESTATED FOR L3 (D-132 C6, C9): every arrival goes through /mulai, which gives a card session Belajar (its
          // one pair) and sends it to the learner's home
          const mulai = await get(`${base}${benar.body.tujuan}`, { headers: { cookie } });
          const ke = mulai.headers.get("location") ?? "";
          const rumahJalur = ke ? new URL(ke, base).pathname : "";
          const rumah = await get(`${base}${rumahJalur || "/"}`, { headers: { cookie } });
          c.expect(benar.body.tujuan === "/mulai" && [302, 303, 307, 308].includes(mulai.status) && rumahJalur === "/belajar" && rumah.status === 200,
            `the card went to ${benar.body.tujuan} (${mulai.status} → ${ke || "nowhere"}), whose page answered ${rumah.status}; expected /mulai → the learner's home /belajar`);
        }

        // five failures already in the window: the sixth waits, and Auth is not asked
        psql(`set role service_role; select public.card_signin_attempt('${kunci}') from generate_series(1, 5)`);
        const tunggu = await kirim("2468");
        const ra = Number(tunggu.r.headers.get("retry-after"));
        c.expect(tunggu.r.status === 429 && tunggu.body?.code === "CARD_COOLDOWN" && Number(tunggu.body?.tunggu) === ra && ra >= 1 && ra <= 30,
          `a card with five recent failures → ${tunggu.r.status} ${JSON.stringify(tunggu.body)} Retry-After ${tunggu.r.headers.get("retry-after")}`);
        c.expect(tunggu.r.headers.getSetCookie().every((k) => !/^sb-[^=]+-auth-token/.test(k)),
          "a card in its cooldown was signed in with its own PIN: Auth was asked");

        // another site, a cross-site POST as a browser marks it, and a browser landing here
        const asing = await kirim("2468", "https://contoh.example");
        c.expect(asing.r.status === 403 && asing.body?.code === "CARD_REQUEST_REFUSED", `another site's request → ${asing.r.status} ${JSON.stringify(asing.body)}`);
        const fdSilang = new FormData();
        fdSilang.set("kartu", "7001"); fdSilang.set("pin", "2468");
        const silang = await get(`${base}/masuk/kartu`, { method: "POST", body: fdSilang, headers: { "sec-fetch-site": "cross-site", accept: "application/json" } });
        const silangBody = (await silang.json().catch(() => null)) as Record<string, unknown> | null;
        c.expect(silang.status === 403 && silangBody?.code === "CARD_REQUEST_REFUSED" && silang.headers.getSetCookie().every((k) => !/^sb-[^=]+-auth-token/.test(k)),
          `a cross-site POST (Sec-Fetch-Site: cross-site, no Origin) → ${silang.status} ${JSON.stringify(silangBody)}`);
        const lihat = await get(`${base}/masuk/kartu`);
        c.expect(lihat.status === 303 && lihat.headers.get("location") === "/masuk", `GET /masuk/kartu → ${lihat.status} ${lihat.headers.get("location")}`);
      } finally {
        psql(`delete from public.card_signin_cooldowns where kunci = '${kunci}'`);
      }
      return c.verdict(
        "against the running route with live Auth: card 7001 with a wrong PIN → 401 CARD_NOT_MATCHED, no session, one attempt " +
          "counted; with its own PIN → 200 with the learner's home, session cookies of 3600 s and the record cleared, and the home " +
          "answers 200 with them; with five recent failures → 429 CARD_COOLDOWN and a matching Retry-After, no session (Auth not " +
          "asked); another site's request and a cross-site POST → 403 CARD_REQUEST_REFUSED with no session; GET → 303 /masuk",
      );
    },
  },
  // BOB-26 (Gate 3): activation and password sign-in, through the running app
  ...bob26AppTests,
  ...dr150cAppTests,
  ...bob27AppTests,
  ...bob28AppTests,
  ...bob29AppTests,
  ...d101AppTests,
  ...d102AppTests,
  // CR-13 (D-120 QN1): a wrong staff email corrected, through the running app, Auth and the mail sink
  ...penutupanAppTests,
  ...b4AppTests,
  // BOB-50 (D-082(d)): a single Uji Cepat issues no certificate, through the running app
  ...bob50AppTests,
  // BOB-51 (D-057, REL-08): «Kirim email uji», the platform admin's delivery proof, through the running app
  ...bob51AppTests,
];
