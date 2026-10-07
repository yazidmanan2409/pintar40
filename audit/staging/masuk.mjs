// STAGING ONLY. HOW THE GOLDEN SCHOOL'S STAFF SIGN IN, AS GATE 3 AND GATE 6 HAVE IT (GOLDEN-SCHOOL-CONTRACT C2).
//
// A person's first sign-in is their activation: «Aktifkan akun» asks for the address, PINTAR emails a code to the
// staging test mailbox (read by mailbox_link.py --kode), and the wizard sets a username, a PIN, a password and the
// name. Every later sign-in is /masuk with the password set then (D-054(b)). An account activated another way, whose
// password the walk does not know, is recovered as its owner would: «Lupa password?», a code by email, a new password.
// A staff browser is then asked «Komputer siapa ini?» and answers «Komputer pribadi saya», so the walk's long-lived
// browsers are not locked between its steps (the shared-computer rule is GS-20's own step).
//
// The username, PIN and password are derived per address from the mailbox's own secret (GS_MAILBOX_PASSWORD, which
// only CI reads): a later run signs in with what the activation set, nothing is stored, and nothing is printed (each
// is masked in the log). NEVER: a password set behind the scenes, a service-role session as a person's act, a value
// of a secret in the log, or any change to PINTAR's sign-in.
import { execFileSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { APP, SLOW, closeTour } from "../perf/lib.mjs";

const rahasia = () => {
  const v = process.env.GS_MAILBOX_PASSWORD;
  if (!v) throw new Error("GS_MAILBOX_PASSWORD is not set");
  return v;
};
const turunan = (email, untuk, n = 0) =>
  createHmac("sha256", rahasia()).update(`pintar-gs|${untuk}|${email.toLowerCase()}|${n}`).digest("hex");
/** Masks a value in the Actions log before anything could print it; returns it. */
export const tutupi = (s) => { console.log(`::add-mask::${s}`); return s; };

// IDENTITY-4.0 §3's PIN rules, as public.pin_weakness (20261021100000) states them: a derived PIN the wizard refuses
// would stop the walk, so one is drawn until it passes
const KEYPAD = new Set(["2580", "0852", "1470", "0741", "7410", "0147", "3690", "0963", "9630", "0369", "1590", "0951",
  "3570", "0753", "1478", "8741", "3698", "8963", "1236", "6321", "7896", "6987", "1379", "9731", "2468", "8642", "1357",
  "7531", "1397", "7913"]);
const UMUM = new Set(["0000", "1111", "1234", "4321", "1212", "7777", "1004", "2000", "4444", "2222", "6969", "9999", "3333",
  "5555", "6666", "1122", "1313", "8888", "2001", "1010", "0123", "1231", "1230", "1221", "2121", "0101", "0707", "0911",
  "1225", "5683", "0007", "0070", "2323", "4545", "5150", "0001", "0002", "1000", "1001", "2002", "9000", "0110", "7007",
  "0420", "2112", "1024", "3141", "1123", "8520", "2345"]);
export function pinLemah(p) {
  if (!/^\d{4}$/.test(p) || /^(\d)\1{3}$/.test(p)) return true;
  const d = [...p].map(Number);
  const naik = [1, 2, 3].every((i) => d[i] === (d[i - 1] + 1) % 10);
  const turun = [1, 2, 3].every((i) => d[i] === (d[i - 1] + 9) % 10);
  if (naik || turun || (d[0] === d[2] && d[1] === d[3]) || (d[0] === d[1] && d[2] === d[3])) return true;
  return KEYPAD.has(p) || UMUM.has(p) || (Number(p) >= 1950 && Number(p) <= 2030);
}

/** This address's username, PIN and password, derived; `versi` > 0 gives a later password (a recovery's new one). */
export function kredensial(email, versi = 0) {
  const username = `gs${turunan(email, "username").slice(0, 12)}`;
  let pin = "";
  for (let n = 0; !pin || pinLemah(pin); n++) pin = String(parseInt(turunan(email, "pin", n).slice(0, 8), 16) % 10000).padStart(4, "0");
  const password = `Gs-${turunan(email, "password", versi).slice(0, 20)}-Q7!`;
  return { username, pin: tutupi(pin), password: tutupi(password) };
}

/** The six-digit code of the newest PINTAR email to this address after `t0` (seconds), from the test mailbox. */
export function kodeDariSurel(email, t0, tunggu = 180) {
  return tutupi(execFileSync("python3", ["mailbox_link.py", email, String(Math.floor(t0)), String(tunggu), "--kode"],
    { encoding: "utf8" }).trim());
}

const tunggu = (page) => page.waitForLoadState("networkidle").then(() => page.waitForTimeout(1200));
// The wizard between two screens (a step saving, the next one loading) has nothing to answer, and a field it shows
// while saving is read-only. Staging saves slower than CI (the password passes Auth's leaked-password check), so the
// walk waits until nothing is busy and something can be answered; on staging's pace, up to 90 seconds.
const LAMBAT = 90000;
async function layarSiap(page) {
  await page.waitForFunction(() => {
    if (document.querySelector('[aria-busy="true"], .pin-putar')) return false;
    if (document.querySelector('#username, #pin, #password, .pin-msg-err[role="alert"]')) return true;
    return [...document.querySelectorAll("a, button")].some((e) => /^(Masuk ke PINTAR|Sudah benar)/.test((e.textContent ?? "").trim()));
  }, null, { timeout: LAMBAT, polling: 250 }).catch(() => {});
}
const teksHalaman = async (page) => String(await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").trim();

// The activation wizard (BOB-26, DAISY-20) and «Komputer siapa ini?» (BOB-29), answered by their own screens: «Komputer
// pribadi saya» unless the walk asks for «Komputer bersama» (perangkat: "SHARED", GS-20's staff on a shared computer).
export async function selesaikan(page, k, { perangkat = "PERSONAL" } = {}) {
  const lewat = [];
  for (let putaran = 0; putaran < 12; putaran++) {
    const jalur = new URL(page.url()).pathname;
    if (jalur === "/aktifkan") {
      await page.locator("h1").first().waitFor({ timeout: SLOW });
      await page.waitForLoadState("networkidle");
      await layarSiap(page);
      // a step the wizard refused says so in its alert; the walk stops there rather than pressing again
      const tolak = page.locator('.pin-msg-err[role="alert"]');
      if (lewat.length && await tolak.count()) throw new Error(`the activation wizard refused the ${lewat.at(-1)} step: ${(await tolak.first().innerText()).trim()}`);
      if (await page.getByRole("link", { name: "Masuk ke PINTAR" }).count()) {
        lewat.push("selesai");
        await page.getByRole("link", { name: "Masuk ke PINTAR" }).click();
        await page.waitForURL((u) => u.pathname !== "/aktifkan", { timeout: SLOW }).catch(() => {});
        await page.waitForLoadState("networkidle");
        continue;
      }
      if (await page.locator("#username").count()) {
        lewat.push("username");
        await page.locator("#username").fill(k.username);
        await page.getByRole("button", { name: "Simpan username" }).click();
      } else if (await page.locator("#pin").count()) {
        lewat.push("pin");
        await page.locator("#pin").fill(k.pin);
        await page.locator("#pin-ulang").fill(k.pin);
        await page.getByRole("button", { name: "Simpan PIN" }).click();
      } else if (await page.locator("#password").count()) {
        lewat.push("password");
        await page.locator("#password").fill(k.password);
        await page.locator("#ulang").fill(k.password);
        await page.getByRole("button", { name: "Simpan password" }).click();
      } else if (await page.getByRole("button", { name: "Sudah benar" }).count()) {
        lewat.push("nama");
        await page.getByRole("button", { name: "Sudah benar" }).click();
      } else {
        throw new Error(`the activation wizard shows nothing the walk can answer: ${(await teksHalaman(page)).slice(0, 200)}`);
      }
      await tunggu(page);
      continue;
    }
    if (jalur === "/perangkat") {
      lewat.push(perangkat === "SHARED" ? "perangkat bersama" : "perangkat");
      await page.locator(`input[type="radio"][name="mode"][value="${perangkat}"]`).check();
      await page.getByRole("button", { name: "Simpan pilihan" }).click();
      await page.waitForURL((u) => u.pathname !== "/perangkat", { timeout: SLOW }).catch(() => {});
      await page.waitForLoadState("networkidle");
      continue;
    }
    break;
  }
  await closeTour(page);
  return lewat;
}

/** «Aktifkan akun»: the address, the emailed code, then the wizard. */
export async function aktifkan(page, email, k) {
  const t0 = Date.now() / 1000 - 30;
  await page.goto(`${APP}/aktifkan`, { timeout: SLOW, waitUntil: "networkidle" });
  await page.locator("#email").fill(email);
  await page.getByRole("button", { name: "Kirim kode" }).click();
  await page.locator("#kode").waitFor({ timeout: SLOW });
  await page.locator("#kode").fill(kodeDariSurel(email, t0));
  await page.getByRole("button", { name: "Lanjut", exact: true }).click();
  // a right code leaves the code screen by a whole-page load into the wizard; a refusal stays and says why
  await Promise.race([
    page.locator("#kode").waitFor({ state: "detached", timeout: LAMBAT }),
    page.locator('#kode-err.pin-msg-err').waitFor({ timeout: LAMBAT }),
  ]).catch(() => {});
  if (await page.locator('#kode-err.pin-msg-err').count()) throw new Error(`the code was refused: ${(await page.locator("#kode-err").innerText()).trim()}`);
  await page.waitForLoadState("load");
  return selesaikan(page, k);
}

/** /masuk with the address and the password; whether it got past the sign-in page. */
export async function denganPassword(page, email, password) {
  await page.goto(`${APP}/masuk`, { timeout: SLOW, waitUntil: "networkidle" });
  await page.locator("#identitas").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.waitForURL((u) => u.pathname !== "/masuk", { timeout: SLOW }).catch(() => {});
  await page.waitForLoadState("networkidle");
  return new URL(page.url()).pathname !== "/masuk";
}

/** «Lupa password?» by email (Gate 4): the address, the emailed code, a new password; signed in after. */
export async function pulihkanDenganEmail(page, email, password) {
  const t0 = Date.now() / 1000 - 30;
  await page.goto(`${APP}/masuk/lupa`, { timeout: SLOW, waitUntil: "networkidle" });
  await page.locator("#nama").fill(email);
  await page.getByRole("button", { name: "Kirim kode" }).click();
  await page.locator("#kode").waitFor({ timeout: SLOW });
  await page.locator("#kode").fill(kodeDariSurel(email, t0));
  await page.getByRole("button", { name: "Lanjut", exact: true }).click();
  await page.locator("#password").waitFor({ timeout: SLOW });
  await page.locator("#password").fill(password);
  await page.locator("#ulang").fill(password);
  await page.getByRole("button", { name: "Simpan password" }).click();
  await page.getByRole("heading", { name: "Password Anda sudah diganti" }).waitFor({ timeout: SLOW });
  await page.getByRole("link", { name: "Lanjut" }).click();
  await page.waitForLoadState("networkidle");
}

/** «Lupa password?» with the PINTAR ID and PIN (Gate 5): the grant, then a new password; signed in after. */
export async function pulihkanDenganPin(page, pintarId, pin, password) {
  await page.goto(`${APP}/masuk/lupa`, { timeout: SLOW, waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Pakai PINTAR ID dan PIN" }).click();
  await page.locator("#id").fill(pintarId);
  await page.locator("#pin").fill(pin);
  await page.getByRole("button", { name: "Lanjut", exact: true }).click();
  await page.locator("#password").waitFor({ timeout: SLOW });
  await page.locator("#password").fill(password);
  await page.locator("#ulang").fill(password);
  await page.getByRole("button", { name: "Simpan password" }).click();
  await page.getByRole("heading", { name: "Password Anda sudah diganti" }).waitFor({ timeout: SLOW });
  await page.getByRole("link", { name: "Lanjut" }).click();
  await page.waitForLoadState("networkidle");
}

/**
 * Signs one staff person in, as they would: activation the first time, the password afterwards, and «Lupa password?»
 * for an account whose password the walk does not know. `keadaan` reads the account's set-up state from the
 * database, read only: null for no account, else its account_setup state. Returns where the person landed and how.
 */
export async function masukStaf(page, email, keadaan, { perangkat = "PERSONAL" } = {}) {
  const k = kredensial(email);
  const state = keadaan(email);
  if (state === null) throw new Error("this person has no account yet");
  let jalan = "";
  let diaktifkan = [];
  try {
    if (state === "REQUIRED") {
      jalan = "activated by the emailed code";
      // the wizard's steps, in the order the screens asked for them (6 Oct: kept, not dropped)
      diaktifkan = await aktifkan(page, email, k);
    } else if (await denganPassword(page, email, k.password)) {
      jalan = "the password";
    } else {
      jalan = "«Lupa password?» by the emailed code, then the password";
      await pulihkanDenganEmail(page, email, k.password);
    }
    const lewat = [...diaktifkan, ...await selesaikan(page, k, { perangkat })];
    return { di: new URL(page.url()).pathname, jalan, lewat };
  } catch (e) {
    throw await bukti(page, e, `signing in (${state}, ${jalan})`);
  }
}

/** A failed sign-in, with where it stopped: the page's path, what it says, and a screenshot in OUT_DIR/shots. */
export async function bukti(page, e, langkah) {
  let di = "?";
  try { di = new URL(page.url()).pathname; } catch { /* closed */ }
  const teks = (await teksHalaman(page)).slice(0, 300);
  const dir = join(process.env.OUT_DIR ?? "out", "shots");
  mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: join(dir, `masuk-berhenti-${Date.now()}.png`), fullPage: true }).catch(() => {});
  // Playwright's call log says which element and why (not visible, not editable); never a typed value
  const baris = String(e?.message ?? e).split("\n");
  const log = baris.filter((l) => /waiting for|resolved to|not visible|not editable|not enabled|detached/.test(l))
    .map((l) => l.trim().replace(/value="[^"]*"/g, 'value="…"')).slice(0, 4).join(" | ");
  return new Error(`${langkah}: ${baris[0]}${log ? ` [${log}]` : ""} — at ${di}: «${teks}»`);
}

/** The account_setup state of one address, for `masukStaf`, from a script's own read-only `sql` and `lit`. */
export const keadaanDari = (sql, lit) => (email) => {
  const r = sql(`select coalesce((select s.state::text from public.account_setup s join public.accounts a on a.id = s.account_id
      where a.auth_user_id = u.id limit 1), 'NONE') from auth.users u where lower(u.email) = lower(${lit(email)}) limit 1`);
  return r === "" ? null : r;
};

/**
 * L3 (D-132 C3): the chooser (`/`) is the one place a working context changes, and visiting it changes nothing. A
 * person picks a door, a purpose and a place as the screen names them: { tujuan, nama } or «Seluruh platform»
 * ({ tujuan, platform: true }). On a chooser the app has already sent the person to (with a page to continue to),
 * that one is used. Returns where the choice landed.
 */
export async function pilihKonteks(page, { tujuan, nama = null, platform = false }) {
  const diPemilih = new URL(page.url()).pathname === "/" && (await page.locator('[data-pemilih="konteks"]').count()) > 0;
  if (!diPemilih) await page.goto(`${APP}/`, { timeout: SLOW, waitUntil: "networkidle" });
  const pintu = page.locator('[data-pemilih="konteks"] button[data-konteks]');
  await pintu.first().waitFor({ timeout: SLOW });
  const semua = await pintu.evaluateAll((bs) => bs.map((b) => ({ k: b.getAttribute("data-konteks"), t: b.innerText })));
  const cocok = semua.filter((x) => (platform ? x.k === `${tujuan}:PLATFORM`
    : x.k.split(":")[0] === tujuan && x.k !== `${tujuan}:PLATFORM` && (!nama || x.t.includes(nama))));
  if (cocok.length !== 1) {
    throw new Error(`the chooser offers ${cocok.length} door(s) for ${tujuan}${platform ? " · Seluruh platform" : nama ? ` · ${nama}` : ""}: `
      + semua.map((x) => `«${String(x.t).replace(/\s+/g, " ").trim()}»`).join(" / "));
  }
  await page.locator(`[data-pemilih="konteks"] button[data-konteks="${cocok[0].k}"]`).click();
  await page.waitForURL((u) => u.pathname !== "/", { timeout: SLOW }).catch(() => {});
  await page.waitForLoadState("networkidle");
  await closeTour(page).catch(() => {});
  return new URL(page.url()).pathname;
}
