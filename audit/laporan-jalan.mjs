// LOCAL ONLY. The Reporting Quality Gate's inspection walk (owner directive, 9 Nov): every report opened by its
// intended reader, at 1280, 390 and 320 px, in the world audit/fixtures/laporan-lokal.mjs builds. For each page:
// a full-page screenshot, the visible text (for the figures to be checked against the raw results), the HTTP status,
// the final address (a refusal or a redirect shows there) and whether the page scrolls sideways.
// Reads only; it presses nothing that changes anything. Credentials come from the fixture's OUT file (never committed).
//   APP_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_DB_URL, WORLD (the fixture's file), OUT_DIR
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const APP = process.env.APP_URL ?? "http://127.0.0.1:3999";
const SB = env("NEXT_PUBLIC_SUPABASE_URL");
const ANON = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const DB = env("SUPABASE_DB_URL");
const OUT = env("OUT_DIR");
const W = JSON.parse(readFileSync(env("WORLD"), "utf8"));
if (!/127\.0\.0\.1|localhost/.test(APP + SB + DB)) throw new Error("local stack only");
const require = createRequire(join(process.cwd(), "package.json"));
const { createServerClient } = require("@supabase/ssr");
mkdirSync(OUT, { recursive: true });
const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1", "-c", q], { encoding: "utf8" }).trim();
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

const K = W.kelas;
const I = W.sekolah;
const ROOT = sql(`select id from public.org_nodes where institution_id = '${I}' and kind = 'INSTITUTION'`);
const DEPT = sql(`select id from public.org_nodes where institution_id = '${I}' and kind = 'DEPARTMENT'`);
const POST5B = sql(`select aa.id from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
  where aa.node_id = '${K["5B"]}' and d.mode = 'POST_TEST' order by aa.created_at limit 1`);
const LEMAH = sql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id
  join public.official_sessions s on s.person_id = a.person_id join public.official_results r on r.session_id = s.id
  where u.email like 'lap-5b-%' and s.mode = 'POST_TEST' order by r.mastery asc limit 1`);
const muridLemah = sql(`select u.email from auth.users u join public.accounts a on a.auth_user_id = u.id where a.person_id = '${LEMAH}'`);
const TUGAS_MURID = (email) => sql(`select la.id from public.learning_assignments la join public.memberships m on m.node_id = la.node_id and m.valid_to is null
  join public.enrollments e on e.id = m.enrollment_id join public.accounts a on a.person_id = e.person_id join auth.users u on u.id = a.auth_user_id
  where u.email = '${email}' order by la.created_at limit 1`);

const ORANG = {
  guru: { ...W.staf.guru, tujuan: "MENGAJAR" },
  kadep: { ...W.staf.kadep, tujuan: "MENGELOLA" },
  dekan: { ...W.staf.dekan, tujuan: "MENGELOLA" },
  admin: { ...W.staf.admin, tujuan: "MENGELOLA" },
  murid: { ...W.murid.find((m) => m.email === muridLemah), tujuan: "BELAJAR" },
  murid0: { ...W.murid.find((m) => m.peran === "TIDAK" && m.kelas === "5B"), tujuan: "BELAJAR" },
};
const tugasMurid = TUGAS_MURID(ORANG.murid.email);

const HALAMAN = {
  guru: [
    ["mengajar", "/mengajar"],
    ["kelas-5B", `/mengajar/${K["5B"]}`],
    ["bukti-5B", `/mengajar/${K["5B"]}/bukti`],
    ["ringkasan-5B", `/edukator/ringkasan?kelas=${K["5B"]}&dari=kelas`],
    ["ringkasan-5C", `/edukator/ringkasan?kelas=${K["5C"]}&dari=kelas`],
    ["soal-5B", `/mengajar/${K["5B"]}/soal?penugasan=${POST5B}`],
    ["siapa-5B", `/mengajar/${K["5B"]}/siapa?penugasan=${POST5B}`],
    ["murid-lemah", `/mengajar/${K["5B"]}/murid/${LEMAH}`],
    ["tolak-5D", `/edukator/ringkasan?kelas=${K["5D"]}&dari=kelas`],
    ["tolak-sekolah", `/dekan/ringkasan?simpul=${ROOT}`],
  ],
  kadep: [
    ["pimpinan", "/pimpinan"],
    ["ringkasan-5B", `/edukator/ringkasan?kelas=${K["5B"]}&dari=pimpinan`],
    ["ringkasan-5D", `/edukator/ringkasan?kelas=${K["5D"]}&dari=pimpinan`],
    ["ringkasan-5E", `/edukator/ringkasan?kelas=${K["5E"]}&dari=pimpinan`],
    ["sekolah", `/dekan/ringkasan?simpul=${ROOT}&dari=pimpinan`],
    ["simpul-dept", `/pimpinan/${DEPT}`],
    ["murid-dept", `/pimpinan/${DEPT}/murid`],
  ],
  dekan: [
    ["pimpinan", "/pimpinan"],
    ["sekolah", `/dekan/ringkasan?simpul=${ROOT}&dari=pimpinan`],
    ["ringkasan-5B", `/edukator/ringkasan?kelas=${K["5B"]}&dari=pimpinan`],
  ],
  admin: [
    ["laporan", "/konfigurasi/laporan"],
    ["sekolah", `/dekan/ringkasan?simpul=${ROOT}&dari=konfigurasi`],
    ["ringkasan-5B", `/edukator/ringkasan?kelas=${K["5B"]}&dari=konfigurasi`],
    ["tolak-pimpinan", "/pimpinan"],
  ],
  murid: [
    ["hasil", "/belajar/hasil"],
    ["hasil-bab", `/belajar/${tugasMurid}/hasil`],
    ["tolak-ringkasan", `/edukator/ringkasan?kelas=${K["5B"]}`],
  ],
  murid0: [["hasil", "/belajar/hasil"]],
};

async function cookies(p) {
  const jar = new Map();
  const client = createServerClient(SB, ANON, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) },
  });
  const { data, error } = await client.auth.signInWithPassword({ email: p.email, password: p.password });
  if (error || !data.session) throw new Error(`sign-in failed for ${p.email}: ${error?.message ?? "no session"}`);
  const host = new URL(APP).hostname;
  return [...jar].map(([name, value]) => ({ name, value, domain: host, path: "/", httpOnly: false, secure: false, sameSite: "Lax" }));
}
async function masuk(browser, p, viewport) {
  const context = await browser.newContext({ viewport, locale: "id-ID", timezoneId: "Asia/Jakarta" });
  await context.addCookies(await cookies(p));
  const page = await context.newPage();
  await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  if (new URL(page.url()).pathname === "/perangkat") {
    await page.locator('input[type="radio"][name="mode"][value="PERSONAL"]').check();
    await page.getByRole("button", { name: "Simpan pilihan" }).click();
    await page.waitForURL((u) => u.pathname !== "/perangkat", { timeout: 30000 }).catch(() => {});
    await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  }
  const pintu = page.locator('[data-pemilih="konteks"] button[data-konteks]');
  if (await pintu.count()) {
    const kunci = await pintu.evaluateAll((bs) => bs.map((b) => b.getAttribute("data-konteks")));
    const pilih = kunci.find((k) => k.split(":")[0] === p.tujuan) ?? kunci[0];
    await page.locator(`[data-pemilih="konteks"] button[data-konteks="${pilih}"]`).click();
    await page.waitForURL((u) => u.pathname !== "/", { timeout: 30000 }).catch(() => {});
  }
  await page.waitForLoadState("networkidle");
  return { context, page };
}

const hasil = [];
const browser = await chromium.launch();
const LEBAR = (process.env.WIDTHS ?? "1280,390,320").split(",").map(Number);
for (const [siapa, daftar] of Object.entries(HALAMAN)) {
  for (const w of LEBAR) {
    const { context, page } = await masuk(browser, ORANG[siapa], { width: w, height: w > 800 ? 900 : 844 });
    for (const [nama, jalan] of daftar) {
      let r = await page.goto(`${APP}${jalan}`, { waitUntil: "networkidle" }).catch(() => null);
      // «Komputer siapa ini?» may be asked on the first protected page rather than at /: answered as the person would
      if (new URL(page.url()).pathname === "/perangkat") {
        await page.locator('input[type="radio"][name="mode"][value="PERSONAL"]').check();
        await page.getByRole("button", { name: "Simpan pilihan" }).click();
        await page.waitForURL((u) => u.pathname !== "/perangkat", { timeout: 30000 }).catch(() => {});
        r = await page.goto(`${APP}${jalan}`, { waitUntil: "networkidle" }).catch(() => null);
      }
      const tutup = page.getByRole("button", { name: /Lewati|Tutup tur/ }).first();
      if (await tutup.isVisible().catch(() => false)) { await tutup.click().catch(() => {}); await page.waitForTimeout(300); }
      const f = `${siapa}-${nama}-${w}.png`;
      await page.screenshot({ path: join(OUT, f), fullPage: true }).catch(() => null);
      const teks = norm(await page.locator("main").first().innerText().catch(() => page.locator("body").innerText()));
      const l = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, w: window.innerWidth }));
      const rec = { siapa, nama, w, jalan, status: r?.status() ?? 0, akhir: new URL(page.url()).pathname + new URL(page.url()).search,
        geser: l.s > l.w, lebar: l, shot: f, teks: w === 1280 ? teks : teks.slice(0, 300) };
      hasil.push(rec);
      console.log(`${siapa.padEnd(7)} ${nama.padEnd(15)} ${w}  ${rec.status}  ${rec.geser ? "SCROLLS " + l.s : "ok"}  → ${rec.akhir.slice(0, 70)}`);
    }
    await context.close();
  }
}
await browser.close();
writeFileSync(join(OUT, "laporan-jalan.json"), JSON.stringify(hasil, null, 2));
