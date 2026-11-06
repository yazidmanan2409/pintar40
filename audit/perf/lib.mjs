// Shared by the U-PERF runs on staging (D-046): journey.mjs (one person at a time, each step timed) and
// concurrency.mjs (30 sessions for 10 minutes). Synthetic staff only (D-046(c)).
export const APP = process.env.STAGING_ORIGIN;
const SB = process.env.SUPABASE_URL;
const SERVICE = process.env.SERVICE_KEY;
const ANON = process.env.ANON_KEY;
export const SLOW = 30000;

// PINTAR's callback completes a sign-in only with the ?code= its own /masuk started (PKCE), and the real
// form would email the synthetic addresses. So the session is made on the server (Auth's verify, as
// staging-perf-seed does) and set as PINTAR's own session cookie (@supabase/ssr: sb-<ref>-auth-token,
// "base64-" + base64url(JSON), chunked at 3180); the timed step is opening "/" until the reader's home is
// usable. The callback's one code exchange is the only part of a real sign-in not timed here.
const REF = new URL(SB).hostname.split(".")[0];
export async function session(email) {
  const g = await fetch(`${SB}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", email }),
  });
  const gj = await g.json();
  const th = gj.hashed_token || gj.properties?.hashed_token;
  if (!th) throw new Error(`no sign-in token (HTTP ${g.status})`);
  const v = await fetch(`${SB}/auth/v1/verify`, {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", token_hash: th }),
  });
  const sj = await v.json();
  if (!sj.access_token) throw new Error(`verify failed (HTTP ${v.status})`);
  return sj;
}
export function sessionCookies(sess) {
  const key = `sb-${REF}-auth-token`;
  const value = "base64-" + Buffer.from(JSON.stringify(sess)).toString("base64url");
  const host = new URL(APP).hostname;
  const base = { domain: host, path: "/", secure: true, sameSite: "Lax", httpOnly: false };
  if (value.length <= 3180) return [{ ...base, name: key, value }];
  const out = [];
  for (let i = 0, n = 0; i < value.length; i += 3180, n++) out.push({ ...base, name: `${key}.${n}`, value: value.slice(i, i + 3180) });
  return out;
}

export async function usable(page, path) {
  await page.waitForURL((u) => u.pathname === path, { timeout: SLOW, waitUntil: "commit" });
  await page.locator("h1").first().waitFor({ state: "visible", timeout: SLOW });
}

export async function clickTo(page, href, path = href.split("?")[0]) {
  const a = page.locator(`a[href="${href}"]`).first();
  await a.waitFor({ state: "visible", timeout: SLOW });
  await a.click();
  await usable(page, path);
}

// A person's first visit to a surface opens its tour, and the tour holds the page until it is closed.
// Closed once as "Lewati" (skip), which PINTAR records against the person, so later visits are those of
// a returning user. Not timed; the caller says whether it was there.
export async function closeTour(page) {
  const card = page.locator('.pin-tur-kartu[role="dialog"]');
  const there = await card.waitFor({ state: "visible", timeout: 3000 }).then(() => true, () => false);
  if (!there) return false;
  await card.locator("button.pin-tur-x").last().click();
  await card.waitFor({ state: "detached", timeout: SLOW });
  return true;
}

// A save, timed twice: from the click to the button showing its own "saving" state (TombolKirim sets
// aria-busy and disabled while the form is pending), and from the click to the result line.
export async function save(page, button, result) {
  await button.waitFor({ state: "visible", timeout: SLOW });
  const ack = button.evaluate((b) => new Promise((done) => {
    let t0 = null;
    b.addEventListener("click", () => { t0 = performance.now(); }, { capture: true, once: true });
    const obs = new MutationObserver(() => {
      if (t0 !== null && (b.disabled || b.getAttribute("aria-busy") === "true")) { obs.disconnect(); done(Math.round(performance.now() - t0)); }
    });
    obs.observe(b, { attributes: true, childList: true, subtree: true, characterData: true });
    setTimeout(() => { obs.disconnect(); done(null); }, 30000);
  }));
  const t = Date.now();
  await button.click();
  await result.waitFor({ state: "visible", timeout: SLOW });
  const resultMs = Date.now() - t;
  const ackMs = await ack;
  return `click→saving ${ackMs === null ? "never shown" : `${ackMs} ms`}; click→result ${resultMs} ms`;
}

export const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export async function rename(page, from, to) {
  const head = page.locator(".pin-str-kepala").filter({ has: page.locator("strong.pin-str-nama", { hasText: new RegExp(`^${esc(from)}$`) }) }).first();
  await head.waitFor({ state: "visible", timeout: SLOW });
  await head.getByRole("button", { name: "Ubah nama" }).click();
  const form = page.locator("form.pin-str-ubah");
  await form.locator('input[name="nama"]').fill(to);
  // the line that ENDS with the new name: renaming back, the previous line ("… Bagian Uji Kinerja (diukur).")
  // also contains it
  return save(page, form.getByRole("button", { name: "Simpan" }), page.getByRole("status").filter({ hasText: new RegExp(`${esc(to)}\\.?\\s*$`) }).first());
}

// BOB-26: a signed-in email account whose set-up is REQUIRED is held to the activation wizard. The synthetic staff were
// marked REQUIRED when the identity foundation arrived (20261021100000), so since then every timed sign-in landed on
// /aktifkan and timed out. settle() answers the wizard ONCE, by its own screens, with the same derived credentials and
// helper the Golden School walks use (../staging/masuk.mjs: username, PIN, password, the name, «Komputer siapa ini?»),
// before anything is timed. It needs GS_MAILBOX_PASSWORD (the derivation's key); nothing is printed unmasked.
// An account already settled is left alone. Returns what it did, for the log.
export async function settle(browser, email, landing) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await ctx.addCookies(sessionCookies(await session(email)));
    await page.goto(`${APP}${landing}`, { timeout: SLOW });
    await page.waitForLoadState("networkidle").catch(() => {});
    const di = new URL(page.url()).pathname;
    let catatan = `already settled (${di})`;
    if (di === "/aktifkan" || di === "/perangkat") {
      const { kredensial, selesaikan } = await import("../staging/masuk.mjs");
      const lewat = await selesaikan(page, kredensial(email));
      catatan = `answered once (${lewat.join(" → ")}), now at ${new URL(page.url()).pathname}`;
    }
    // BOB-29: «Komputer siapa ini?» is asked of a browser that has not answered it, and every timed rep is a new
    // context. The answer is this browser's cookie (a random id; the database keeps its hash per person), carried into
    // each rep as a person's own browser keeps it, so a rep times a returning person's sign-in, not the question.
    const alat = (await ctx.cookies()).find((c) => c.name === "pintar_perangkat");
    if (alat) perangkat.set(email.toLowerCase(), alat);
    return `${catatan}; this browser ${alat ? "remembered" : "NOT remembered"}`;
  } finally { await ctx.close(); }
}
const perangkat = new Map();

export async function signIn(page, email, landing) {
  const alat = perangkat.get(email.toLowerCase());
  await page.context().addCookies([...sessionCookies(await session(email)), ...(alat ? [alat] : [])]);
  const t = Date.now();
  // where the callback's own redirect (tujuanMasuk) sends this reader; "/" itself does not redirect
  await page.goto(`${APP}${landing}`, { timeout: SLOW });
  await usable(page, landing);
  return `home ${new URL(page.url()).pathname} usable ${Date.now() - t} ms after opening it`;
}
