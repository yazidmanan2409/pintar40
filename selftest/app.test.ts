/**
 * App runner — F01-R01…R04. Black-box HTTP against the production-mode app
 * (`next start`) and, where the network facility exists, against the
 * Supabase project's REST/Auth/Storage endpoints with real persona JWTs —
 * never a superuser connection (FABLE-01 §6). R01 needs no network. R04 is
 * evidence forwarded from the CI workflow's own jobs.
 */
import { createServerClient } from "@supabase/ssr";
import { Checks, visibleText, type SelfTest, type Context } from "./lib";
import { INTERNAL_WORDS, t } from "../src/lib/hle";

/** Synthetic personas (supabase/seed/synthetic.sql). Passwords are seed constants, not secrets. */
const PERSONA = {
  dean: { email: "alpha-dean@synthetic.pintar.test", password: "Sintetis-AlphaDean-33!" },
  alphaAdmin: { email: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" },
  alphaStudent: { email: "alpha-siswa-1@synthetic.pintar.test", password: "Sintetis-AlphaSiswa1-76!" },
} as const;

type Session = { cookie: string; accessToken: string };

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
  return { cookie: [...jar].map(([n, v]) => `${n}=${v}`).join("; "), accessToken: data.session.access_token };
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
];
