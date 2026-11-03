// BATCH 5 PROMOTION GATE (owner, 3 Nov: «BATCH 5 CONTROLLED PROMOTION — CONDITIONAL GO»): the focused browser checks the
// owner asked for before the merge. Each act is done in a real browser by keyboard or click; SQL only prepares a fixture
// (a learner who has not seen the tour) and READS what the database recorded.
//
//   F1  «revert automatic session sign-out when leaving MODE PERAGAAN … verify the exit behaviour with a focused test»:
//       the evaluator signs in and assumes a persona from the Hub; the band is shown; «Keluar dari peragaan» ends the
//       evaluation session server-side and returns them to the Hub, still signed in as themselves, with «Anda sudah
//       keluar dari peragaan.» and no band; nothing is left set aside. Then, assumed again, signing out ends both: no
//       session cookie is left and no evaluation session is open (ADR-0020 «evaluator logout terminates both»).
//   F2  «keep the guided tour non-modal, with accessible keyboard operation, dismissal and continuation»: a learner who
//       has not seen it lands on Belajar; the tour is a dialog that is not aria-modal and leaves the page usable (not
//       inert); Tab reaches its buttons and leaves it for the page (no trap); Enter on «Berikutnya» continues to the next
//       step and «Kembali» goes back; Esc dismisses it. Continuation follows the tour's approved rule (src/lib/tur.ts
//       akanMunculLagi): Esc is a skip, so under the cap of automatic presentations the tour is offered again by itself
//       on the next visit; ticking «Jangan tampilkan lagi» by keyboard (Tab, Space) and closing records the choice, and it
//       is not offered by itself again, while «Bantuan» still offers it. (A learner who has already seen it opens it from
//       «Bantuan» by keyboard: tour state is never deleted, so no fixture can make it new.)
//
// Local or CI stack with the synthetic and human-evaluation seeds: APP_URL, NEXT_PUBLIC_SUPABASE_URL,
// NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_DB_URL. Writes OUT_DIR/b5-fokus.json and screenshots; exits 1 on any FAIL.
import { chromium } from "playwright";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const APP = process.env.APP_URL ?? "http://127.0.0.1:3999";
const SB = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DB = process.env.SUPABASE_DB_URL;
const OUT = process.env.OUT_DIR ?? "audit-out/b5-fokus";
const SLOW = 30000;
const require = createRequire(join(process.env.APP_DIR ?? process.cwd(), "package.json"));
const { createServerClient } = require("@supabase/ssr");

const PENILAI = { email: "penilai@evaluasi.pintar.test", password: "Penilai-Evaluasi-4417!" };
const MURID = { email: "alpha-siswa-1@synthetic.pintar.test", password: "Sintetis-AlphaSiswa1-76!" };
const KUE = `sb-${new URL(SB).hostname.split(".")[0]}-auth-token`;

mkdirSync(OUT, { recursive: true });
const sql = (q) => execFileSync("psql", [DB, "-At", "-v", "ON_ERROR_STOP=1", "-c", q], { encoding: "utf8" }).trim();
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const langkah = [];
let gagal = false;
async function step(id, judul, fn) {
  const rec = { id, judul, verdict: "PASS", catatan: [], shots: [] };
  try { await fn(rec); } catch (e) { rec.verdict = "FAIL"; rec.catatan.push(`error: ${String(e.message ?? e).split("\n")[0].slice(0, 300)}`); }
  if (rec.verdict !== "PASS") gagal = true;
  langkah.push(rec);
  console.log(`${rec.verdict.padEnd(5)} ${id} ${judul}\n      ${rec.catatan.join("\n      ")}`);
}
const harus = (rec, ok, kata) => { rec.catatan.push(`${ok ? "ok" : "!!"} ${kata}`); if (!ok) rec.verdict = "FAIL"; return ok; };
async function shot(page, rec, nama) {
  const f = `${langkah.length + 1}-${nama}.png`;
  await page.screenshot({ path: join(OUT, f), fullPage: true }).catch(() => null);
  rec.shots.push(f);
}
async function cookies(p) {
  const jar = new Map();
  const client = createServerClient(SB, ANON, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) },
  });
  const { data, error } = await client.auth.signInWithPassword({ email: p.email, password: p.password });
  if (error || !data.session) throw new Error(`sign-in failed for ${p.email}: ${error?.message ?? "no session"}`);
  // host-only, as the app's own Set-Cookie makes them: a domain cookie of the same name would sit beside the server's
  // and be sent with it, so a session the server replaces would still be read (the persona's, at assume)
  return [...jar].map(([name, value]) => ({ name, value, url: APP, httpOnly: false, secure: false, sameSite: "Lax" }));
}
async function konteks(browser, p) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
  await context.addCookies(await cookies(p));
  const page = await context.newPage();
  await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  if (new URL(page.url()).pathname === "/perangkat") {
    await page.locator('input[type="radio"][name="mode"][value="PERSONAL"]').check();
    await page.getByRole("button", { name: "Simpan pilihan" }).click();
    await page.waitForURL((u) => u.pathname !== "/perangkat", { timeout: SLOW }).catch(() => {});
    await page.waitForLoadState("networkidle");
  }
  return { context, page };
}
const sesiKue = (daftar) => new Map(daftar.filter((c) => c.name === KUE || c.name.startsWith(`${KUE}.`)).map((c) => [c.name, c.value]));

const browser = await chromium.launch();

// ── F1 leaving MODE PERAGAAN
await step("F1", "leaving MODE PERAGAAN returns the evaluator to the Hub, signed in as themselves; signing out ends both", async (rec) => {
  // a persona free of an earlier run's open pairing, as its own exit would leave it
  sql("update public.evaluation_sessions set ended_at = now(), ended_reason = 'EXITED' where ended_at is null");
  const { context, page } = await konteks(browser, PENILAI);
  const milik = sesiKue(await context.cookies());
  harus(rec, milik.size > 0, `the evaluator holds their own session (${milik.size} cookie(s))`);
  await page.goto(`${APP}/evaluasi`, { waitUntil: "networkidle" });
  await shot(page, rec, "hub");
  const tombol = page.locator('form[action*="/api/evaluation/assume"] button, form[action="/api/evaluation/assume"] button').first();
  if (!harus(rec, (await tombol.count()) === 1, "the Hub offers a persona to view as")) return;
  await tombol.click();
  await page.waitForURL((u) => u.pathname !== "/evaluasi", { timeout: SLOW });
  await page.waitForLoadState("networkidle");
  // the assume route redirects to its own request host; the walk carries on at the address it signed in at
  await page.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
  const band = page.locator('[role="region"][aria-label="MODE PERAGAAN"]');
  harus(rec, (await band.count()) === 1, "the MODE PERAGAAN band is shown while viewing as the persona");
  const sisih = new Map((await context.cookies()).filter((c) => c.name.startsWith("pintar-penilai.")).map((c) => [c.name.slice("pintar-penilai.".length), c.value]));
  harus(rec, [...milik].every(([k, v]) => sisih.get(k) === v), "the evaluator's own session is set aside unchanged");
  const terbuka = sql("select id from public.evaluation_sessions where ended_at is null order by started_at desc limit 1");
  harus(rec, Boolean(terbuka), "an evaluation session is open");
  await shot(page, rec, "dalam-peragaan");
  await band.getByRole("button", { name: "Keluar dari peragaan" }).click();
  await page.waitForURL((u) => u.pathname === "/evaluasi" || u.pathname === "/masuk", { timeout: SLOW });
  await page.waitForLoadState("networkidle");
  const tiba = new URL(page.url());
  harus(rec, tiba.pathname === "/evaluasi" && tiba.searchParams.get("keluar") === "1", `leaving lands on ${tiba.pathname}${tiba.search} (the Hub, not the sign-in screen)`);
  const teks = norm(await page.locator("main").textContent());
  harus(rec, teks.includes("Anda sudah keluar dari peragaan."), "the Hub says «Anda sudah keluar dari peragaan.»");
  harus(rec, (await page.locator('[role="region"][aria-label="MODE PERAGAAN"]').count()) === 0, "no band after leaving");
  harus(rec, (await page.locator('form[action*="/api/evaluation/assume"] button').count()) >= 1, "the Hub offers the personas again: signed in as the evaluator");
  const sesudah = await context.cookies();
  const kini = sesiKue(sesudah);
  harus(rec, [...milik].every(([k, v]) => kini.get(k) === v), "the browser holds the evaluator's own session again");
  harus(rec, !sesudah.some((c) => c.name.startsWith("pintar-penilai.")), "nothing is left set aside");
  harus(rec, sql(`select (ended_at is not null)::text from public.evaluation_sessions where id = '${terbuka}'`) === "true", "the evaluation session was ended server-side");
  await shot(page, rec, "kembali-ke-hub");
  // assumed again, then signed out: both end
  await page.locator('form[action*="/api/evaluation/assume"] button').first().click();
  await page.waitForURL((u) => u.pathname !== "/evaluasi", { timeout: SLOW });
  await page.waitForLoadState("networkidle");
  await page.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
  const r = await page.evaluate(async () => (await fetch("/keluar", { method: "POST", redirect: "manual" })).status);
  harus(rec, r === 303 || r === 0, `signing out answered ${r}`);
  const akhir = await context.cookies();
  harus(rec, !akhir.some((c) => (c.name === KUE || c.name.startsWith(`${KUE}.`) || c.name.startsWith("pintar-penilai.")) && c.value), "signing out leaves no session cookie, the evaluator's own included");
  harus(rec, sql("select count(*) from public.evaluation_sessions where ended_at is null") === "0", "no evaluation session is left open");
  // the evaluator's own session was ended at Auth, not only its cookie dropped: its refresh token no longer renews
  const asli = milik.get(KUE) ?? [...milik.entries()].sort().map(([, v]) => v).join("");
  let segar = null, sesiAuth = null;
  try {
    const v = decodeURIComponent(asli);
    const j = JSON.parse(v.startsWith("base64-") ? Buffer.from(v.slice(7), "base64").toString("utf8") : v);
    segar = j.refresh_token;
    sesiAuth = JSON.parse(Buffer.from(j.access_token.split(".")[1], "base64url").toString("utf8")).session_id;
  } catch { /* unreadable */ }
  // decisive, unlike a refused refresh (rotation alone can refuse one): the evaluator's own Auth session row is gone
  harus(rec, Boolean(sesiAuth) && sql(`select count(*) from auth.sessions where id = '${sesiAuth}'`) === "0",
    "the evaluator's own Auth session was ended at sign-out");
  const baru = await fetch(`${SB}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST", headers: { apikey: ANON, "content-type": "application/json" }, body: JSON.stringify({ refresh_token: segar }),
  });
  harus(rec, Boolean(segar) && !baru.ok, `the evaluator's own refresh token is refused after signing out (${baru.status})`);
  await context.close();
});

// ── F2 the tour, by keyboard
await step("F2", "the guided tour is non-modal and works by keyboard: Tab in and out, Enter continues, «Kembali» goes back, Esc skips (offered again under the cap), «Jangan tampilkan lagi» stops it", async (rec) => {
  const orang = sql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = '${MURID.email}'`);
  const { context, page } = await konteks(browser, MURID);
  await page.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
  const dialog = page.locator('[role="dialog"][aria-labelledby="pin-tur-judul"]');
  // tour state is never deleted (it is what stops a tour showing again): a learner who has seen it opens it from Help
  const otomatis = (await dialog.count()) === 1;
  if (!otomatis) {
    await page.locator('[data-tur="bantuan"]').first().focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    const tur = page.getByRole("button", { name: /tur|Tur/ }).first();
    if ((await dialog.count()) === 0 && (await tur.count())) { await tur.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(400); }
  }
  rec.catatan.push(`the tour ${otomatis ? "was offered by itself on the first visit" : "was opened from «Bantuan», by keyboard"}`);
  if (!harus(rec, (await dialog.count()) === 1, "the tour is open on Belajar")) { await shot(page, rec, "tanpa-tur"); return; }
  harus(rec, (await dialog.getAttribute("aria-modal")) !== "true", "the tour is not aria-modal");
  harus(rec, await page.evaluate(() => !document.querySelector("[inert]") && !document.querySelector('main[aria-hidden="true"], #isi[aria-hidden="true"]')),
    "nothing on the page is made inert or hidden behind it");
  await shot(page, rec, "tur-1");
  // keyboard: from the top of the page, Tab reaches the tour's «Berikutnya»
  await page.evaluate(() => { document.activeElement?.blur?.(); });
  let diTur = false;
  for (let i = 0; i < 60 && !diTur; i++) {
    await page.keyboard.press("Tab");
    diTur = await page.evaluate(() => /Berikutnya|Selesai/.test(document.activeElement?.textContent ?? "") && !!document.activeElement?.closest('[role="dialog"]'));
  }
  harus(rec, diTur, "Tab reaches the tour's «Berikutnya»");
  const judul1 = norm(await page.locator("#pin-tur-judul").textContent());
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  const judul2 = norm(await page.locator("#pin-tur-judul").textContent());
  harus(rec, judul2 && judul2 !== judul1, `Enter continues to the next step («${judul1}» → «${judul2}»)`);
  const kembali = dialog.getByRole("button", { name: "Kembali" });
  if (await kembali.count()) {
    await kembali.focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    harus(rec, norm(await page.locator("#pin-tur-judul").textContent()) === judul1, "«Kembali» goes back a step");
  }
  // no trap: Tab carries on past the tour's last control into the page
  let keluarTur = false;
  for (let i = 0; i < 20 && !keluarTur; i++) {
    await page.keyboard.press("Tab");
    keluarTur = await page.evaluate(() => !!document.activeElement && document.activeElement !== document.body && !document.activeElement.closest('[role="dialog"]'));
  }
  harus(rec, keluarTur, "Tab leaves the tour for the page (focus is not trapped)");
  // dismiss: Esc from inside the tour
  await dialog.locator("button").first().focus();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  harus(rec, (await page.locator('[role="dialog"][aria-labelledby="pin-tur-judul"]').count()) === 0, "Esc dismisses the tour");
  await shot(page, rec, "tur-ditutup");
  await page.waitForTimeout(500);
  // what the learner's durable state now says (the tour's own rule, src/lib/tur.ts akanMunculLagi: finished, «Jangan
  // tampilkan lagi», or the cap of automatic presentations stops it for good; Esc and «Lewati» are a skip, which does not)
  const KEADAAN = `select coalesce((select (s.completed_at is not null)::text || '|' || (s.suppressed_at is not null)::text || '|' || s.auto_shown_count
       || '|' || r.auto_presentation_limit from public.person_tour_state s join public.tour_registry r on r.tour_key = s.tour_key
      where s.person_id = '${orang}' and s.tour_key = 'learner.first_login'), 'none')`;
  const keadaan = sql(KEADAAN);
  if (otomatis) harus(rec, /^false\|false\|[1-9]/.test(keadaan), `the automatic presentation is counted for the learner, and Esc neither finished nor suppressed it (${keadaan})`);
  const [selesai, bungkam, kali, batas] = keadaan.split("|");
  const lagi = keadaan !== "none" && selesai === "false" && bungkam === "false" && Number(kali) < Number(batas);
  // continuation: a skip under the cap is offered again by itself on the next visit; otherwise it is not
  await page.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  harus(rec, (await dialog.count()) === (lagi ? 1 : 0),
    lagi ? `skipped with Esc under the cap (${kali} of ${batas}), it is offered again by itself on the next visit`
         : "finished, suppressed or at its cap, it does not open by itself on the next visit");
  if (lagi && (await dialog.count()) === 1) {
    // dismissal for good, by keyboard: Tab to «Jangan tampilkan lagi», Space ticks it, Esc closes; recorded, never again
    const kotak = dialog.locator('input[type="checkbox"]');
    harus(rec, (await kotak.count()) === 1, "an automatic presentation offers «Jangan tampilkan lagi»");
    if (await kotak.count()) {
      let n = 0;
      await dialog.locator("button").first().focus();
      while (n++ < 12 && !(await kotak.evaluate((el) => el === document.activeElement))) await page.keyboard.press("Tab");
      harus(rec, await kotak.evaluate((el) => el === document.activeElement), "Tab reaches «Jangan tampilkan lagi»");
      await page.keyboard.press("Space");
      harus(rec, await kotak.isChecked(), "Space ticks it");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(800);
      harus(rec, (await dialog.count()) === 0, "Esc closes the tour");
      harus(rec, sql(KEADAAN).split("|")[1] === "true", "the learner's choice is recorded (suppressed)");
      await page.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      harus(rec, (await dialog.count()) === 0, "suppressed, it does not open by itself on the next visit");
      harus(rec, (await page.locator('[data-tur="bantuan"]').count()) > 0, "«Bantuan» still offers it");
    }
  }
  await context.close();
});

await browser.close();
writeFileSync(join(OUT, "b5-fokus.json"), JSON.stringify({ app: APP, langkah }, null, 2));
console.log(`\n${langkah.filter((l) => l.verdict === "PASS").length}/${langkah.length} PASS`);
process.exit(gagal ? 1 : 0);
