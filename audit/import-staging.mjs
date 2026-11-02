// Import a lesson package into a STAGING school through the app's own pages, as the
// platform admin (Yazid's authorization, 24 Sep: "machine import as Gladys account").
//
// The same path a school uses: /studio/unggah receives the package, every media file the
// batch names is uploaded through /api/assets/upload-url, and the batch's own Konfirmasi
// materialises it. The session is made the app's way: a server-generated sign-in token is
// verified by @supabase/ssr (the version and defaults the app uses), which writes the same
// session cookie the app's own sign-in writes. No email is sent.
//
// Staging only: the project ref, origin and database URL are staging's, and the run stops
// if production's project answers the staging token. No key, token, cookie or address is
// printed. Idempotent: a course with the package's title already at the school is not
// imported again; it is verified instead -- unless REPLACE_UNRELEASED is set (Yazid, 24 Sep,
// for the SD 5 Bab 1 copy imported before BOB-04), and then a course that is still a draft
// and that nothing uses is removed first and the package imported afresh.
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { chromium } from "playwright";
import { readFileSync, existsSync, statSync, mkdirSync, appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { basename, extname, join } from "node:path";

const env = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`${k} is not set`);
  return v;
};
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const ORIGIN = env("STAGING_ORIGIN");
const TOKEN = env("STAGING_SUPABASE_ACCESS_TOKEN");
const DB = env("STAGING_SUPABASE_DB_URL");
const PAKET = env("PACKAGE_JSON");
const MEDIA_DIR = env("MEDIA_DIR");
const SCHOOL = env("SCHOOL_SLUG");
const ADMIN_SHA256 = env("ADMIN_SHA256");
const SHOTS = process.env.SHOTS_DIR ?? "shots";
const REPLACE = process.env.REPLACE_UNRELEASED === "true";
const SB = `https://${REF}.supabase.co`;
const SUMMARY = process.env.GITHUB_STEP_SUMMARY;

const mask = (v) => { if (v) console.log(`::add-mask::${v}`); };
const say = (s) => { console.log(s); if (SUMMARY) appendFileSync(SUMMARY, `${s}\n`); };
const sql = (q) => execFileSync("psql", [DB, "-At", "-v", "ON_ERROR_STOP=1", "-c", q], { encoding: "utf8" }).trim();
const lit = (s) => { if (s.includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const MIME = { ".mp4": "video/mp4", ".webm": "video/webm", ".m4a": "audio/mp4", ".mp3": "audio/mpeg", ".wav": "audio/wav",
  ".ogg": "audio/ogg", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".pdf": "application/pdf" };

if (!/^[a-z0-9-]+$/.test(SCHOOL)) throw new Error("SCHOOL_SLUG must be a slug");
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF)) throw new Error("the database URL is not staging's");

const bad = [];
let page;
const shot = async (name) => {
  if (!page) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true }).catch(() => {});
};

async function main() {
  // 0. the staging token must not reach production
  const prod = await fetch(`https://api.supabase.com/v1/projects/${PRODUCTION_REF}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (prod.status === 200) throw new Error("STAGING_SUPABASE_ACCESS_TOKEN can reach production; refusing to run");
  say(`- production refuses the staging token: HTTP ${prod.status}`);

  // 1. staging's own keys, masked before anything else is printed
  const kr = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!kr.ok) throw new Error(`staging's keys could not be read: HTTP ${kr.status}`);
  const keys = await kr.json();
  for (const k of keys) mask(k.api_key);
  const pick = (n) => keys.find((k) => k.name === n && (k.api_key ?? "").startsWith("eyJ"))?.api_key;
  const ANON = pick("anon"), SERVICE = pick("service_role");
  if (!ANON || !SERVICE) throw new Error("the legacy anon and service_role keys are not both offered");

  // 2. the school, the package, and whether it is already there
  const paketText = readFileSync(PAKET, "utf8");
  const paket = JSON.parse(paketText);
  const title = paket.courses?.[0]?.title;
  if (!title) throw new Error("the package has no course title");
  const [schoolId, schoolName] = sql(`select id||'|'||name from public.institutions where slug=${lit(SCHOOL)} and not is_synthetic`).split("|");
  if (!schoolId) throw new Error(`no real school with slug ${SCHOOL} on staging`);
  say(`- school: ${schoolName}; course: ${title}`);
  const media = [...new Set(paket.courses.flatMap((c) => c.modules.flatMap((m) => m.lessons.flatMap((l) => (l.media ?? []).map((x) => x.file)))))];
  for (const f of media) if (!existsSync(join(MEDIA_DIR, f))) throw new Error(`media file missing from the media branch: ${f}`);
  say(`- media named by the package: ${media.length ? media.join(", ") : "none"}`);
  let course = sql(`select id from public.courses where institution_id='${schoolId}' and title=${lit(title)} limit 1`);
  let batchId = null;

  // 2b. REPLACING A DRAFT NOTHING USES (REPLACE_UNRELEASED). One transaction, which first
  // re-checks that the course is still a draft with no release, no test definition, no
  // assignment, no certificate template, no learner progress, no presented question and no
  // question-health row, then removes it bottom-up. The foreign keys are the last guard:
  // anything else still pointing at it rolls the whole removal back. Its files stay in
  // storage, unreferenced; the new copy's files are checked by its own batch's path.
  if (course && REPLACE) {
    const had = sql(`select (select count(*) from public.modules m where m.course_id='${course}') || ' modules, ' ||
      (select count(*) from public.lessons l join public.modules m on m.id = l.module_id where m.course_id='${course}') || ' lessons, ' ||
      (select count(*) from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id='${course}') || ' questions'`);
    sql(`do $x$
declare
  c uuid := '${course}'; v_st text; v_items uuid[]; v_lessons uuid[]; v_modules uuid[];
begin
  select status::text into v_st from public.courses where id = c for update;
  if v_st not in ('INGESTED', 'STRUCTURED', 'VALIDATED', 'VALIDATION_FAILED') then
    raise exception 'not replaced: the course is %, not a draft', v_st;
  end if;
  select coalesce(array_agg(id), '{}') into v_modules from public.modules where course_id = c;
  select coalesce(array_agg(id), '{}') into v_lessons from public.lessons where module_id = any (v_modules);
  select coalesce(array_agg(id), '{}') into v_items from public.items where lesson_id = any (v_lessons);
  if exists (select 1 from public.plp_releases where course_id = c) then
    raise exception 'not replaced: the course has a release'; end if;
  if exists (select 1 from public.assessment_definitions where course_id = c or module_id = any (v_modules)) then
    raise exception 'not replaced: the course has a test definition'; end if;
  if exists (select 1 from public.learning_assignments where course_id = c) then
    raise exception 'not replaced: the course is assigned'; end if;
  if exists (select 1 from public.certificate_templates where course_id = c or module_id = any (v_modules)) then
    raise exception 'not replaced: the course has a certificate template'; end if;
  if exists (select 1 from public.lesson_progress where lesson_id = any (v_lessons)) then
    raise exception 'not replaced: a learner has progress in it'; end if;
  if exists (select 1 from public.presented_items where item_id = any (v_items)) then
    raise exception 'not replaced: a question of it was presented'; end if;
  if exists (select 1 from public.question_health where item_id = any (v_items)) then
    raise exception 'not replaced: a question of it has health evidence'; end if;
  if to_regclass('public.content_review_outcomes') is not null
     and exists (select 1 from public.content_review_outcomes where course_id = c) then
    raise exception 'not replaced: the course has review history'; end if;
  delete from public.mcq_quality_findings where course_id = c or item_id = any (v_items);
  delete from public.coaching_findings where course_id = c;
  delete from public.item_options where item_id = any (v_items);
  delete from public.items where id = any (v_items);
  delete from public.learning_objectives where lesson_id = any (v_lessons);
  delete from public.lessons where id = any (v_lessons);
  delete from public.modules where id = any (v_modules);
  delete from public.courses where id = c;
end $x$;`);
    if (sql(`select count(*) from public.courses where id='${course}'`) !== "0") throw new Error("the draft was not removed");
    say(`- replaced: the unreleased draft ${course.slice(0, 8)} (${had}) was removed; importing afresh`);
    course = "";
  }

  if (course) {
    say(`- already imported (course ${course.slice(0, 8)}); verifying only`);
  } else {
    // 3. the platform admin, by digest; the address is never printed
    const emails = sql(`select u.email from auth.users u join public.accounts a on a.auth_user_id = u.id
      join public.role_assignments r on r.person_id = a.person_id
      where r.role = 'SYSTEM_ADMIN' and r.revoked_at is null and now() < r.valid_until`).split("\n").filter(Boolean);
    emails.forEach(mask);
    if (emails.length !== 1) throw new Error(`expected exactly one platform admin, found ${emails.length}`);
    const digest = createHash("sha256").update(emails[0].trim().toLowerCase()).digest("hex");
    if (digest !== ADMIN_SHA256) throw new Error("the platform admin is not the recorded person");
    say("- acting as: the platform admin (Gladys, matched by digest)");

    // 4. a session, written as the app's own cookie
    const admin = createClient(SB, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
    const link = await admin.auth.admin.generateLink({ type: "magiclink", email: emails[0] });
    if (link.error) throw new Error(`no sign-in token: ${link.error.message}`);
    mask(link.data.properties.hashed_token);
    const jar = new Map();
    const ssr = createServerClient(SB, ANON, {
      cookies: {
        getAll: () => [...jar.entries()].map(([name, c]) => ({ name, value: c.value })),
        setAll: (list) => { for (const c of list) { if (c.value) jar.set(c.name, c); else jar.delete(c.name); } },
      },
    });
    const v = await ssr.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: "magiclink" });
    if (v.error) throw new Error(`sign-in token refused: ${v.error.message}`);
    await new Promise((r) => setTimeout(r, 300));
    for (const c of jar.values()) mask(c.value);
    if (!jar.size) throw new Error("no session cookie was produced");

    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
    const host = new URL(ORIGIN).hostname;
    await ctx.addCookies([...jar.entries()].map(([name, c]) => ({ name, value: c.value, domain: host, path: "/", secure: true, sameSite: "Lax", httpOnly: false })));
    page = await ctx.newPage();
    try {
      await page.goto(`${ORIGIN}/studio/unggah`, { waitUntil: "networkidle" });
      const at = new URL(page.url()).pathname;
      await shot("1-unggah");
      if (at !== "/studio/unggah") throw new Error(`the session was not accepted: landed on ${at}`);
      say("- signed in on staging; the upload page opened");

      // 5. the package, on the page's structured form, addressed to the school
      const form = page.locator("form").filter({ has: page.locator('textarea[name="isi"]') }).nth(1);
      const sel = form.locator("select").first();
      const opt = await sel.locator("option").filter({ hasText: schoolName.split(" ").slice(0, 2).join(" ") }).first().getAttribute("value").catch(() => null);
      if (!opt) throw new Error(`the upload page does not offer ${schoolName}`);
      await sel.selectOption(opt);
      await form.locator('textarea[name="isi"]').fill(paketText);
      await form.locator('button[type="submit"]').first().click();
      await page.waitForURL(/hasil=/, { timeout: 60000 }).catch(() => {});
      await page.waitForLoadState("networkidle");
      await shot("2-dikirim");
      const u = new URL(page.url());
      const hasil = u.searchParams.get("hasil"), detail = u.searchParams.get("detail");
      say(`- package submitted: hasil=${hasil}`);
      if (!/^[0-9a-f-]{36}$/.test(detail ?? "")) throw new Error(`the package was not accepted: hasil=${hasil} detail=${detail}`);
      const batch = detail;
      batchId = batch;

      // 6. every media file the batch names, uploaded through the app's upload route
      const mapping = JSON.parse(sql(`select coalesce(inferred_mapping, '[]'::jsonb) from public.ingest_batches where id='${batch}'`) || "[]");
      for (const m of mapping) {
        const name = basename(m.path ?? "");
        const file = join(MEDIA_DIR, name);
        if (!m.path || !existsSync(file)) throw new Error(`the batch names ${m.path}, which is not on the media branch`);
        const signed = await page.evaluate(async (path) => {
          const res = await fetch("/api/assets/upload-url", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path }) });
          return { status: res.status, body: await res.json().catch(() => null) };
        }, m.path);
        if (signed.status !== 200 || !signed.body?.token) throw new Error(`upload-url refused ${name}: HTTP ${signed.status}`);
        mask(signed.body.token);
        const put = await fetch(`${SB}/storage/v1/object/upload/sign/assets/${signed.body.path}?token=${encodeURIComponent(signed.body.token)}`, {
          method: "PUT", headers: { "content-type": MIME[extname(name).toLowerCase()] ?? "application/octet-stream" }, body: readFileSync(file),
        });
        if (!put.ok) throw new Error(`upload of ${name} failed: HTTP ${put.status} ${await put.text().catch(() => "")}`);
        say(`- uploaded ${name} (${(statSync(file).size / 1e6).toFixed(2)} MB)`);
      }

      // 7. the batch's own Konfirmasi
      await page.goto(`${ORIGIN}/studio/unggah`, { waitUntil: "networkidle" });
      const btn = page.locator(`form:has(input[name="batch"][value="${batch}"]) button[type="submit"]`).first();
      if (!(await btn.count())) throw new Error("no Konfirmasi offered for this batch");
      await btn.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
      await shot("3-kursus");
      say(`- confirmed; the page shows ${new URL(page.url()).pathname}`);
      say(`- batch status: ${sql(`select status from public.ingest_batches where id='${batch}'`)}`);
    } finally {
      await browser.close();
    }
    course = sql(`select id from public.courses where institution_id='${schoolId}' and title=${lit(title)} limit 1`);
    if (!course) throw new Error("no course was created");
  }

  // 8. verify what staging now holds against the package
  const want = paket.courses[0].modules.flatMap((m) => m.lessons);
  const lessons = sql(`select count(*) from public.lessons l join public.modules m on m.id = l.module_id where m.course_id='${course}'`);
  const items = sql(`select count(*) from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id='${course}'`);
  const uses = sql(`select coalesce(string_agg(r || ' ' || n, ', '), '-') from (select coalesce(i.cycle_role::text, 'PRACTICE') r, count(*) n
    from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id='${course}' group by 1 order by 1) x`);
  const withMedia = sql(`select coalesce(string_agg(l.ordinal || ': ' || jsonb_array_length(l.media) || ' media, ' ||
      (select count(*) from jsonb_array_elements(l.media) x where coalesce(x->>'transcript', '') <> '') || ' with transcript', '; ' order by l.ordinal), '-')
    from public.lessons l join public.modules m on m.id = l.module_id where m.course_id='${course}' and jsonb_array_length(coalesce(l.media, '[]'::jsonb)) > 0`);
  const stored = sql(`select coalesce(string_agg(split_part(name, '/', 4) || ' ' || (metadata->>'size') || ' ' || coalesce(metadata->>'mimetype', '?'), '; ' order by name), '-')
    from storage.objects where bucket_id = 'assets' and name like 'pelajaran/${schoolId}/${batchId ? `${batchId}/` : ""}%'`);
  say(`- staging holds: lessons ${lessons}, questions ${items} (${uses})`);
  say(`- lessons with media: ${withMedia}`);
  say(`- stored files${batchId ? " (this import's batch)" : ""}: ${stored}`);
  // BOB-04: a package with pre-test and post-test questions arrives with both tests
  const tests = sql(`select coalesce(string_agg(mode::text || ' ' || n, ', ' order by mode::text), '-')
    from (select mode, count(*) n from public.assessment_definitions where course_id='${course}' group by mode) x`);
  say(`- test definitions: ${tests}`);
  const marked = paket.courses[0].modules.flatMap((m) => m.lessons.flatMap((l) => l.items ?? []));
  for (const [use, mode] of [["PRE_TEST", "PRE_TEST"], ["POST_TEST", "POST_TEST"]]) {
    if (marked.some((i) => i.use === use) && !tests.includes(mode)) bad.push(`no ${mode} definition although the package marks ${use} questions`);
  }
  const wantItems = want.reduce((n, l) => n + (l.items?.length ?? 0), 0);
  if (Number(lessons) !== want.length) bad.push(`lessons ${lessons}, expected ${want.length}`);
  if (Number(items) !== wantItems) bad.push(`questions ${items}, expected ${wantItems}`);
  for (const f of media) {
    const size = statSync(join(MEDIA_DIR, f)).size;
    if (!stored.includes(`${f} ${size} `)) bad.push(`${f} is not stored at its full size (${size} bytes)`);
  }
  const need = want.filter((l) => (l.media ?? []).some((x) => /\.(mp4|webm|m4a|mp3|wav|ogg)$/i.test(x.file))).length;
  const got = (withMedia.match(/with transcript/g) ?? []).length;
  if (got < need) bad.push(`transcripts on ${got} lessons, expected ${need}`);
}

try {
  await main();
} catch (e) {
  bad.push(e.message);
  await shot("x-gagal");
}
if (bad.length) {
  say(`\n**FAILED**: ${bad.join("; ")}`);
  process.exit(1);
}
say("\n**READY**: the package is on staging, whole, with every media file at full size.");
