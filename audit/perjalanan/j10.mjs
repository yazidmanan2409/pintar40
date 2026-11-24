// J10 · Locked out (Daisy's script, J10; AUDIT-79-SKRIP-PERJALANAN.md). World: W2 (activated email learners: Intan with
// a personal PIN, Joko whose PIN the school reset, Wulan whose set-up is not done; the 8A teacher's PIN), W1's class
// cards, W17 (Puspa, closed at her own request). Mail goes to the local sink (Mailpit, as in CI): the email path is the
// real one, the code read from the sink. A harness: it records, it does not judge.
//
//   node audit/perjalanan/j10.mjs      (the app on APP_URL; it LOADS THE WORLD ITSELF before each walk: it changes it)
//
// Keyboard only, signed out unless a step signs in:
//   L1  account set-up (moved from J1): Wulan's four steps (username, password, a personal PIN with each weak-PIN rule
//       refused, her name), «Komputer siapa ini?», then the choice changed in «Akun saya»
//   L2  forgot password by email: an address with no account (no oracle: the same screen), then Intan's; the code
//       from the sink; a new password
//   L3  forgot password by username (Wulan's new username): the code goes to her email
//   L4  by PINTAR ID + PIN: an unknown ID, a wrong PIN, Joko's reset PIN; then Intan's, and the time runs out before
//       the new password is saved (fixture w10-pemulihan-berakhir); then again, to the end
//   L5  the session lock, waited for in real time on a shared computer (the 4-minute warning, the lock), a wrong PIN,
//       then the right one
//   L6  three wrong PINs: the session ends (fixture w10-kunci: idle time moved forward)
//   L7  a class card's session lock: the card PIN (fixture w10-kunci)
//   L8  a reset PIN on the lock: «belum punya PIN yang bisa dipakai» (fixture w10-kunci)
//   L9  locked past 60 minutes: the session has ended (fixture w10-kunci-ujung)
//   L10 a closed account (Puspa): signing in with her right password; then the reopening request (a short message,
//       a double press, Back)
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { APP, dunia, jalan, lewatiTur, lupakanSesi, pilihBahasa, masukEmail, muatUlang, keluar, ringkas, LEBAR } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SINK = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const LABEL = ["keadaan fiksasi di L4 (izin pemulihan diakhiri), L6–L8 (waktu diam dimajukan) dan L9 (kunci 61 menit)"];
const RAPI = (t) => (t ?? "").replace(/\s+/g, " ").trim();

/** a fixture on the world already loaded */
function fiksasi(nama) {
  try { execFileSync(join(HERE, "..", "dunia", "muat.sh"), ["--fiksasi", nama], { stdio: "pipe", encoding: "utf8" }); }
  catch (e) { throw new Error(`fixture ${nama} failed: ${String(e.stderr ?? e.message).split("\n").filter((l) => /ERROR|REFUSED/.test(l)).join(" | ").slice(0, 400)}`); }
}

/** the newest message to `kepada` in the sink after `sejak`; its code is read, never recorded */
async function kodeDariSurel(kepada, sejak, batasMs = 60000) {
  const akhir = Date.now() + batasMs;
  while (Date.now() < akhir) {
    const r = await fetch(`${SINK}/api/v1/search?query=${encodeURIComponent(`to:"${kepada}"`)}&limit=5`).then((x) => x.json()).catch(() => null);
    const m = (r?.messages ?? []).find((x) => new Date(x.Created).getTime() >= sejak - 2000);
    if (m) {
      const isi = await fetch(`${SINK}/api/v1/message/${m.ID}`).then((x) => x.json());
      // the code is written in groups («123 456»), under «Kode:»
      const kode = ((String(isi.Text ?? "").match(/Kode:\s*([\d ]{6,12})|Code:\s*([\d ]{6,12})/) ?? []).slice(1).find(Boolean) ?? "").replace(/\s/g, "") || null;
      return { kode, subjek: m.Subject, kepada: (m.To ?? []).map((t) => t.Address).join(",") };
    }
    await new Promise((s) => setTimeout(s, 1500));
  }
  return { kode: null, subjek: "(no message reached the sink)", kepada: "" };
}

/** the sign-in page by class card (as J1) */
async function masukKartu(j, kartu, pin) {
  const { page } = j;
  if (!(await page.locator("#kartu").isVisible().catch(() => false))) {
    await j.tekan(page.getByRole("button", { name: /kartu kelas|class card/i }).first());
    await page.locator("#kartu").waitFor({ timeout: 15000 });
  }
  await j.ketik(page.locator("#kartu"), kartu);
  await j.ketik(page.locator("#pin"), pin);
  await page.keyboard.press("Enter");
}

const hasil = [];
if (process.env.AUDIT_CABANG === "1") process.exit(await cabang());
for (const lebar of LEBAR) {
  muatUlang();
  const D = dunia();
  const intan = { ...D["w2.murid_pin"] }, joko = D["w2.murid_reset"], wulan = { ...D["w2.murid_baru"] }, guru = D["smp.guru8a"];
  const kartu = D["w1.murid1"], puspa = D["w17.akun"];
  const PIN_INTAN = D["w2.murid_pin.pin"], PIN_GURU = D["w2.guru_pin.pin"];
  const j = await jalan({ perjalanan: "j10", lebar, zona: "WIB", nama: "Wulan · Intan · Joko · Bima · Dimas · Puspa", label: LABEL });
  const { page } = j;
  const isi = async () => RAPI(await page.locator("main").first().innerText().catch(() => ""));
  const pesan = async () => RAPI((await page.locator('[role="alert"], [role="status"], .pin-msg').allInnerTexts().catch(() => [])).join(" | "));
  const tunggu = async () => { await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(800); };
  const sesi = (o) => j.baca(`select coalesce(string_agg(mode || ' ' || public.sesi_keadaan(ds, now()) || coalesce(' ended ' || ended_reason, ''), '; ' order by created_at), 'none')
    from public.device_sessions ds where auth_user_id = '${o.auth}'`);
  const keMasuk = async () => {
    await lupakanSesi(page);   // the session forgotten, the language choice kept
    await page.goto(`${APP}/masuk`).catch(() => {});   // a redirect in flight may abort this navigation
    await tunggu();
    if (!new URL(page.url()).pathname.startsWith("/masuk")) { await page.goto(`${APP}/masuk`).catch(() => {}); await tunggu(); }
  };

  await j.langkah("L1", "account set-up: Wulan's four steps, «Komputer siapa ini?», then «Akun saya»", async ({ rec, foto, data, amati }) => {
    await page.goto(`${APP}/masuk`);
    await pilihBahasa(j);
    rec.tab += await j.ketik(page.locator("#identitas"), wulan.email);
    rec.tab += await j.ketik(page.locator("#password"), wulan.password);
    await page.keyboard.press("Enter");
    await page.waitForURL((u) => u.pathname.startsWith("/aktifkan"), { timeout: 30000 });
    await tunggu();
    await foto("siapkan-1-username");
    rec.tab += await j.ketik(page.locator("#username"), "wulan.sari");
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Simpan username|Save the username|Save username)/ }).first());
    await page.locator("#ulang").waitFor({ timeout: 20000 });
    await foto("siapkan-2-password");
    wulan.password = "Sintetis-WulanBaru-64!";
    rec.tab += await j.ketik(page.locator("#password"), wulan.password);
    rec.tab += await j.ketik(page.locator("#ulang"), wulan.password);
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Simpan password|Save the password|Save password)/ }).first());
    await page.locator("#pin-ulang").waitFor({ timeout: 20000 });
    await foto("siapkan-3-pin");
    // a weak PIN under each rule, then a mismatch, then a good one
    for (const [n, a, b] of [["sama", "1111", "1111"], ["urut", "1234", "1234"], ["pola", "1212", "1212"], ["garis", "2580", "2580"], ["tahun", "1990", "1990"], ["beda", "5862", "5863"]]) {
      await page.locator("#pin").fill(""); await page.locator("#pin-ulang").fill("");
      rec.tab += await j.ketik(page.locator("#pin"), a);
      rec.tab += await j.ketik(page.locator("#pin-ulang"), b);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1200);
      if (n === "sama" || n === "beda") await foto(`siapkan-3-pin-${n}`);
      data(`pin_${n}`, await pesan());
    }
    await page.locator("#pin").fill(""); await page.locator("#pin-ulang").fill("");
    rec.tab += await j.ketik(page.locator("#pin"), "5862");
    rec.tab += await j.ketik(page.locator("#pin-ulang"), "5862");
    await page.keyboard.press("Enter");
    const benar = page.getByRole("button", { name: /^(Sudah benar|That's right|It's right|Correct)/ }).first();
    await benar.waitFor({ timeout: 20000 });
    await foto("siapkan-4-nama");
    rec.tab += await j.tekan(benar);
    await page.getByRole("link", { name: /Masuk ke PINTAR|Go to PINTAR|Sign in to PINTAR/ }).first().waitFor({ timeout: 20000 });
    await foto("siapkan-selesai");
    data("welcome", await isi());
    rec.tab += await j.tekan(page.getByRole("link", { name: /Masuk ke PINTAR|Go to PINTAR|Sign in to PINTAR/ }).first());
    await page.waitForURL((u) => !u.pathname.startsWith("/aktifkan"), { timeout: 20000 });
    await tunggu();
    data("welcome_leads_to", new URL(page.url()).pathname);
    if (new URL(page.url()).pathname.startsWith("/masuk")) await masukEmail(j, wulan, "pribadi");
    if (new URL(page.url()).pathname.startsWith("/perangkat")) {
      // «Komputer siapa ini?» on her first arrival: her own computer (a radio group is one Tab stop; the arrows choose)
      await foto("perangkat-pertama");
      const pribadi = page.getByRole("radio", { name: /^Komputer pribadi saya|^My personal computer/ }).first();
      rec.tab += await j.tabKe(page.getByRole("radio", { checked: true }).first());
      for (let i = 0; i < 3 && !(await pribadi.isChecked()); i++) await page.keyboard.press("ArrowDown");
      rec.tab += await j.tekan(page.getByRole("button", { name: /^(Simpan pilihan|Save my choice)$/ }).first());
      await page.waitForURL((u) => !u.pathname.startsWith("/perangkat"), { timeout: 20000 });
      data("computer_question", "asked; «Komputer pribadi saya» chosen");
    } else data("computer_question", "(not asked)");
    await lewatiTur(j);
    await page.goto(`${APP}/akun`);
    await tunggu();
    await foto("akun-saya");
    data("account_computer", (await isi()).match(/(Komputer ini|This computer).{0,140}/)?.[0] ?? "(no «Komputer ini»)");
    const ubah = page.getByRole("link", { name: /^(Ubah|Change)$/ }).first();
    data("account_offers_change", await ubah.count() > 0);
    if (await ubah.count()) rec.tab += await j.tekan(ubah, 200);
    else {
      // «Komputer siapa ini?» says the choice can be changed «nanti di Akun saya»; a learner's Akun saya has no such
      // section, so the walk opens the choice by its address (recorded, not judged)
      amati("«Akun saya» offers no «Komputer ini · Ubah» to this learner; /perangkat opened by its address");
      await page.goto(`${APP}/perangkat?lanjut=%2Fakun`);
    }
    await page.waitForURL((u) => u.pathname.startsWith("/perangkat"), { timeout: 20000 });
    await foto("akun-ubah-perangkat");
    rec.tab += await j.tabKe(page.getByRole("radio", { checked: true }).first());
    for (let i = 0; i < 3 && !(await page.getByRole("radio", { name: /^Komputer bersama|^A shared computer/ }).first().isChecked()); i++) await page.keyboard.press("ArrowUp");
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Simpan pilihan|Save my choice)$/ }).first());
    await page.waitForURL((u) => u.pathname.startsWith("/akun"), { timeout: 20000 }).catch(() => {});
    await tunggu();
    await foto("akun-sesudah");
    data("account_computer_after", (await isi()).match(/(Komputer ini|This computer).{0,140}/)?.[0] ?? "(no «Komputer ini»)");
    data("sessions", sesi(wulan));
    await keluar(j);
  });

  await j.langkah("L2", "forgot password by email: an address with no account, then Intan's; the code from the sink", async ({ rec, foto, data }) => {
    await keMasuk();
    rec.tab += await j.tekan(page.getByRole("link", { name: /Lupa password\?|Forgot your password\?/ }).first());
    await page.locator("#nama").waitFor({ timeout: 20000 });
    await foto("lupa");
    rec.tab += await j.ketik(page.locator("#nama"), "tidak.ada.akun@dunia.pintar.test");
    await page.keyboard.press("Enter");
    await page.locator("#kode").waitFor({ timeout: 20000 });
    await foto("lupa-kode-tanpa-akun");
    const tanpa = await isi();
    data("no_account_screen", tanpa.slice(0, 400));
    rec.tab += await j.tekan(page.getByRole("button", { name: /Gunakan email atau username lain|Use a different email or username/ }).first());
    await page.locator("#nama").waitFor({ timeout: 20000 });
    const sejak = Date.now();
    await page.locator("#nama").fill("");
    rec.tab += await j.ketik(page.locator("#nama"), intan.email);
    await page.keyboard.press("Enter");
    await page.locator("#kode").waitFor({ timeout: 20000 });
    await foto("lupa-kode");
    data("same_screen_as_no_account", RAPI(await isi()).replace(/\d+ detik|\d+ seconds?/g, "") === tanpa.replace(/\d+ detik|\d+ seconds?/g, ""));
    const surel = await kodeDariSurel(intan.email, sejak);
    data("mail", `${surel.subjek} → ${surel.kepada}`);
    if (!surel.kode) throw new Error("no code reached the sink for Intan");
    rec.tab += await j.ketik(page.locator("#kode"), surel.kode);
    await page.keyboard.press("Enter");
    await page.locator("#ulang").waitFor({ timeout: 20000 });
    await foto("lupa-password");
    intan.password = "Sintetis-IntanBaru-65!";
    rec.tab += await j.ketik(page.locator("#password"), intan.password);
    rec.tab += await j.ketik(page.locator("#ulang"), intan.password);
    await page.keyboard.press("Enter");
    await page.getByRole("link", { name: /Lanjut|Continue/ }).first().waitFor({ timeout: 20000 });
    await foto("lupa-selesai");
    data("done", await isi());
  });

  await j.langkah("L3", "forgot password by username: the code goes to the account's email", async ({ rec, foto, data }) => {
    await keMasuk();
    await page.goto(`${APP}/masuk/lupa`);
    await page.locator("#nama").waitFor({ timeout: 20000 });
    const sejak = Date.now();
    rec.tab += await j.ketik(page.locator("#nama"), "wulan.sari");
    await page.keyboard.press("Enter");
    await page.locator("#kode").waitFor({ timeout: 20000 });
    await foto("lupa-username-kode");
    const surel = await kodeDariSurel(wulan.email, sejak);
    data("mail", `${surel.subjek} → ${surel.kepada}`);
    if (!surel.kode) throw new Error("no code reached Wulan's email for her username");
  });

  await j.langkah("L4", "by PINTAR ID + PIN: an unknown ID, a wrong PIN, a reset PIN; then the time runs out; then to the end", async ({ rec, foto, data }) => {
    const kePin = async () => {
      await keMasuk();
      await page.goto(`${APP}/masuk/lupa`);
      rec.tab += await j.tekan(page.getByRole("button", { name: /PINTAR ID/ }).first());
      await page.locator("#id").waitFor({ timeout: 20000 });
    };
    const coba = async (id, pin, nm) => {
      await page.locator("#id").fill(""); await page.locator("#pin").fill("");
      rec.tab += await j.ketik(page.locator("#id"), id);
      rec.tab += await j.ketik(page.locator("#pin"), pin);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1500);
      if (nm) { await foto(`pin-${nm}`); data(`pin_${nm}`, await pesan()); }
    };
    await kePin();
    await foto("pin");
    await coba("ZZ9ZZ9ZZ", "4829", "id-tidak-dikenal");
    await coba(intan.pintar_id, "1357", "pin-salah");
    await coba(joko.pintar_id, "7392", "pin-diatur-ulang");
    await coba(intan.pintar_id, PIN_INTAN, null);
    await page.locator("#ulang").waitFor({ timeout: 20000 });
    await foto("pin-password");
    fiksasi("w10-pemulihan-berakhir");
    rec.tab += await j.ketik(page.locator("#password"), "Sintetis-IntanLagi-66!");
    rec.tab += await j.ketik(page.locator("#ulang"), "Sintetis-IntanLagi-66!");
    await page.keyboard.press("Enter");
    await page.locator("#id").waitFor({ timeout: 20000 });
    await foto("pin-berakhir");
    data("time_ran_out", await pesan());
    await coba(intan.pintar_id, PIN_INTAN, null);
    await page.locator("#ulang").waitFor({ timeout: 20000 });
    intan.password = "Sintetis-IntanLagi-66!";
    rec.tab += await j.ketik(page.locator("#password"), intan.password);
    rec.tab += await j.ketik(page.locator("#ulang"), intan.password);
    await page.keyboard.press("Enter");
    await page.getByRole("link", { name: /Lanjut|Continue/ }).first().waitFor({ timeout: 20000 });
    await foto("pin-selesai");
    data("done", await isi());
  });

  await j.langkah("L5", "the session lock in real time on a shared computer: the warning, the lock, a wrong PIN, the right one", async ({ rec, foto, data, amati }) => {
    await keMasuk();
    await masukEmail(j, intan, "bersama");
    await lewatiTur(j);
    await page.goto(`${APP}/belajar`);
    await tunggu();
    // the welcome tour opens on /belajar too: skipped, as a person leaving the computer would have (an open tour is
    // the branch «tur-terbuka», AUDIT_CABANG=1)
    data("tour_skipped", await lewatiTur(j));
    const t0 = Date.now();
    await foto("bersama-belajar");
    data("sessions_start", sesi(intan));
    // nothing is touched: the screen warns at 4 minutes and locks at 5
    await page.getByText(/belum dipakai selama 4 menit|hasn't been used for 4 minutes/).first().waitFor({ timeout: 5 * 60000 }).catch(() => {});
    amati(`the warning at ${Math.round((Date.now() - t0) / 1000)} s`);
    await foto("bersama-peringatan");
    data("warning", await pesan());
    await page.waitForURL((u) => u.pathname.startsWith("/terkunci"), { timeout: 3 * 60000 }).catch(() => {});
    if (!new URL(page.url()).pathname.startsWith("/terkunci")) { await page.reload(); await tunggu(); }
    amati(`the lock at ${Math.round((Date.now() - t0) / 1000)} s, at ${new URL(page.url()).pathname}`);
    await page.locator("#pin").waitFor({ timeout: 20000 });
    await foto("terkunci");
    data("lock", await isi());
    data("sessions_locked", sesi(intan));
    rec.tab += await j.ketik(page.locator("#pin"), "1357");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500);
    await foto("terkunci-pin-salah");
    data("wrong_pin", await pesan());
    await page.locator("#pin").fill("");
    rec.tab += await j.ketik(page.locator("#pin"), PIN_INTAN);
    await page.keyboard.press("Enter");
    await page.waitForURL((u) => !u.pathname.startsWith("/terkunci"), { timeout: 20000 });
    await tunggu();
    await foto("terbuka");
    data("unlocked_at", new URL(page.url()).pathname);
    data("sessions_after", sesi(intan));
  });

  await j.langkah("L6", "three wrong PINs: the session ends", async ({ rec, foto, data }) => {
    fiksasi("w10-kunci");
    await page.goto(`${APP}/belajar`);
    await page.waitForURL((u) => u.pathname.startsWith("/terkunci"), { timeout: 20000 });
    await page.locator("#pin").waitFor({ timeout: 20000 });
    for (const n of [1, 2, 3]) {
      if (!(await page.locator("#pin").isVisible().catch(() => false))) break;
      await page.locator("#pin").fill("");
      rec.tab += await j.ketik(page.locator("#pin"), "1357");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1500);
      await foto(`tiga-${n}`);
      data(`try_${n}`, await pesan() || (await isi()).slice(0, 200));
    }
    data("sessions", sesi(intan));
    await keMasuk();
  });

  await j.langkah("L7", "a class card's session lock: the card PIN", async ({ rec, foto, data }) => {
    await masukKartu(j, kartu.kartu, kartu.pin);
    await page.waitForURL((u) => !u.pathname.startsWith("/masuk"), { timeout: 30000 });
    await tunggu();
    await lewatiTur(j);
    fiksasi("w10-kunci");
    await page.goto(`${APP}/belajar`);
    await page.waitForURL((u) => u.pathname.startsWith("/terkunci"), { timeout: 20000 });
    await page.locator("#pin").waitFor({ timeout: 20000 });
    await foto("kartu-terkunci");
    data("card_lock", await isi());
    rec.tab += await j.ketik(page.locator("#pin"), kartu.pin);
    await page.keyboard.press("Enter");
    await page.waitForURL((u) => !u.pathname.startsWith("/terkunci"), { timeout: 20000 });
    await tunggu();
    await foto("kartu-terbuka");
    data("unlocked_at", new URL(page.url()).pathname);
    await keMasuk();
  });

  await j.langkah("L8", "a reset PIN on the lock", async ({ foto, data }) => {
    await masukEmail(j, joko, "bersama");
    await lewatiTur(j);
    fiksasi("w10-kunci");
    await page.goto(`${APP}/belajar`);
    await page.waitForURL((u) => u.pathname.startsWith("/terkunci"), { timeout: 20000 });
    await tunggu();
    await foto("reset-terkunci");
    data("reset_lock", await isi());
    await keMasuk();
  });

  await j.langkah("L9", "locked past 60 minutes: the session has ended", async ({ foto, data }) => {
    await masukEmail(j, guru, "bersama");
    await lewatiTur(j);
    fiksasi("w10-kunci-ujung");
    await page.goto(`${APP}/mengajar`);
    await page.waitForURL((u) => u.pathname.startsWith("/terkunci") || u.pathname.startsWith("/masuk"), { timeout: 20000 }).catch(() => {});
    await tunggu();
    await foto("kunci-berakhir");
    data("ended", (await isi()).slice(0, 300));
    data("at", new URL(page.url()).pathname);
    await keMasuk();
  });

  await j.langkah("L10", "a closed account: signing in with the right password; then the reopening request", async ({ rec, foto, data }) => {
    rec.tab += await j.ketik(page.locator("#identitas"), puspa.email);
    rec.tab += await j.ketik(page.locator("#password"), puspa.password);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2000);
    await foto("tutup-masuk");
    data("closed_sign_in", await pesan());
    rec.tab += await j.tekan(page.getByRole("link", { name: /Minta dibuka kembali|Ask for it to be reopened|reopened/ }).first(), 80);
    await page.locator("#bk-pesan").waitFor({ timeout: 20000 });
    await foto("buka-kembali");
    rec.tab += await j.ketik(page.locator("#bk-identitas"), puspa.email);
    rec.tab += await j.ketik(page.locator("#bk-pesan"), "Mohon.");
    await page.keyboard.press("Tab");
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Kirim permintaan|Send the request)$/ }).first());
    await page.waitForTimeout(800);
    await foto("buka-kembali-pendek");
    data("short_message", { url: new URL(page.url()).pathname, validity: await page.locator("#bk-pesan").evaluate((el) => el.validationMessage).catch(() => ""), page_line: await pesan() });
    await page.locator("#bk-pesan").fill("");
    rec.tab += await j.ketik(page.locator("#bk-pesan"), "Saya ingin kembali belajar. Hubungi saya lewat email ini, terima kasih.");
    const kirim = page.getByRole("button", { name: /^(Kirim permintaan|Send the request)$/ }).first();
    rec.tab += await j.tabKe(kirim);
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter").catch(() => {});   // the double press
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(1200);
    await foto("buka-kembali-terkirim");
    data("sent", await isi());
    data("requests", j.baca(`select count(*)::text || ' reopening request(s) after the double press' from public.account_requests r where r.person_id = '${puspa.person}' and r.kind = 'REOPEN'`));
    await page.goBack().catch(() => {});
    await tunggu();
    await foto("buka-kembali-kembali");
    data("after_back", (await isi()).slice(0, 300));
  });

  hasil.push(await j.selesai());
}
process.exit(ringkas("j10", hasil));

/** AUDIT_CABANG=1, 1280: «tur-terbuka»: the same shared-computer wait with the welcome tour left open on /belajar;
 *  the screen's activity reports and the session's state are sampled every 30 s for up to 9 minutes. Recorded, not judged. */
async function cabang() {
  muatUlang();
  const D = dunia();
  const intan = D["w2.murid_pin"];
  const j = await jalan({ perjalanan: "j10-cabang-tur-terbuka", lebar: 1280, zona: "WIB", nama: "Intan", label: [] });
  const { page } = j;
  let t0 = Date.now();
  const detak = [];
  page.on("request", (r) => { if (r.url().includes("/api/sesi/detak")) detak.push(Math.round((Date.now() - t0) / 1000)); });
  await j.langkah("C1", "a shared computer left with the welcome tour open: does it lock?", async ({ foto, data, amati }) => {
    await masukEmail(j, intan, "bersama");
    await lewatiTur(j);
    await page.goto(`${APP}/belajar`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);
    t0 = Date.now();
    data("tour_open", await page.locator('.pin-tur-kartu[role="dialog"]').isVisible().catch(() => false));
    await foto("tur-terbuka");
    const sampel = [];
    let kunci = null;
    for (let i = 1; i <= 18; i++) {
      await page.waitForTimeout(30000);
      const v = j.baca(`select public.sesi_keadaan(ds, now()) || ' last ' || to_char(last_activity_at, 'HH24:MI:SS') from public.device_sessions ds where auth_user_id = '${intan.auth}' and ended_at is null`);
      sampel.push(`${i * 30}s ${v} ${new URL(page.url()).pathname}`);
      if (i === 9) await foto("tur-terbuka-4.5-menit");
      if (/TERKUNCI/.test(v) || new URL(page.url()).pathname.startsWith("/terkunci")) { kunci = i * 30; break; }
    }
    await foto("tur-terbuka-akhir");
    data("samples", sampel);
    data("heartbeats_s", detak);
    data("locked_after_s", kunci ?? "not within 9 minutes");
    amati(kunci ? `locked after about ${kunci} s` : "not locked within 9 minutes with the tour open");
  });
  return ringkas("j10-cabang", [await j.selesai()]);
}
