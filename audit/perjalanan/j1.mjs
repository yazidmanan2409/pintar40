// J1 · First day (SD): sign in by class card, land on /belajar, the tour, today's task. Daisy's corrected script
// (AUDIT-79-SKRIP-PERJALANAN.md at 53c1af77, 24 Nov): a class-card learner has no personal PIN and is never asked about
// the computer (D-086(c)); those steps moved to J10, for a W2 email learner. A harness: it records, it does not judge.
//
//   audit/dunia/muat.sh && node audit/perjalanan/j1.mjs                    the walk (AUDIT_LEBAR, AUDIT_BAHASA, AUDIT_LALUAN)
//   audit/dunia/muat.sh && node audit/perjalanan/j1.mjs && AUDIT_CABANG=1 node audit/perjalanan/j1.mjs   + the branches
//
// World: W1 only (audit/dunia/01-sekolah-sd.sql, 4A's six class cards, none signed in) and 4A's chapter (02-bab.sql).
// Keyboard only. Every walk is a first sign-in, by its own W1 learner:
//   the walk     1280 → learner 1, 390 → 2, 320 → 3; the EN walk → 4; a pass (AUDIT_LALUAN) → 5
//   the branches (AUDIT_CABANG=1, 1280, ID):
//     «pin-salah»     learner 6: a wrong card PIN three times (the script's), on to the sixth (the product's first wait
//                     comes after five), then the right one during the wait; and a mistyped card number
//     «tur-keluar»    learner 5: the tour closed early, then reopened from «Bantuan»; then signing out and back in on
//                     the same shared computer (the same browser)
// So the branches and a pass each need a world loaded afresh after the walks that used learner 5 (muat.sh).
//   The walk's steps: L1 sign in by card number and card PIN · L2 land on /belajar · L3 the tour · L4 open today's task
import { APP, dunia, jalan, pilihBahasa, ringkas, BAHASA, LALUAN, LEBAR } from "./lib.mjs";

const D = dunia();
const tugas = D["sd.bab4a"].tugas;
const CABANG = process.env.AUDIT_CABANG === "1";

const sql = {
  masukTerakhir: (m) => `select coalesce(u.last_sign_in_at::text, 'never') from auth.users u join public.accounts a on a.auth_user_id = u.id where a.card_number = '${m.kartu}'`,
  modeSesi: (m) => `select coalesce(string_agg(ds.mode::text, ','), 'none') from public.device_sessions ds join public.accounts a on a.auth_user_id = ds.auth_user_id where a.card_number = '${m.kartu}' and ds.ended_at is null`,
  tur: (m) => `select coalesce(string_agg(t.tour_key || ' completed=' || coalesce(t.completed_at::text, '-') || ' dismissed=' || coalesce(to_jsonb(t) ->> 'dismissed_at', '-') || ' shown=' || t.auto_shown_count, '; '), 'none') from public.person_tour_state t where t.person_id = '${m.person}'`,
};

/** The sign-in page, «Gunakan kartu kelas», the card number and the card PIN, Enter. Returns the Tab count. */
async function masukKartu(j, kartu, pin, foto, awalan = "") {
  const { page } = j;
  let tab = 0;
  if (!(await page.locator("#kartu").isVisible().catch(() => false))) {
    tab += await j.tekan(page.getByRole("button", { name: /kartu kelas|class card/i }).first());
    await page.locator("#kartu").waitFor({ timeout: 15000 });
  }
  if (foto) await foto(`${awalan}kartu`);
  await page.locator("#kartu").fill("");
  await page.locator("#pin").fill("");
  tab += await j.ketik(page.locator("#kartu"), kartu);
  tab += await j.ketik(page.locator("#pin"), pin);
  await page.keyboard.press("Enter");
  return tab;
}

/** The tour's cards, walked by `pilih` (the button each card is left by); returns the number of cards seen. */
async function jalanTur(j, { foto, amati, rec }, awalan, berhentiDi = null) {
  const { page } = j;
  const kartuTur = page.locator('.pin-tur-kartu[role="dialog"]');
  if (!(await kartuTur.waitFor({ state: "visible", timeout: 15000 }).then(() => true, () => false))) {
    throw new Error("no tour card opened");
  }
  let kartu = 0;
  while (await kartuTur.isVisible().catch(() => false)) {
    kartu++;
    await foto(`${awalan}${kartu}`);
    amati(`card ${kartu}: ${(await kartuTur.innerText()).replace(/\s+/g, " ").slice(0, 160)}`);
    const tutup = berhentiDi !== null && kartu >= berhentiDi;
    const tombol = tutup
      ? kartuTur.getByRole("button", { name: /^(Lewati tur|Skip tour|Tutup|Close)/i }).first()
      : kartuTur.getByRole("button", { name: /^(Berikutnya|Selesai|Next|Done|Finish|Mulai|Start)/i }).last();
    if (!(await tombol.count())) throw new Error(`tour card ${kartu}: no ${tutup ? "button to close it early" : "button to go on"}`);
    rec.tab += await j.tekan(tombol, 40);
    if (tutup) amati(`closed early at card ${kartu} by «${(await tombol.innerText().catch(() => "?")).trim()}»`);
    await page.waitForTimeout(400);
    if (kartu > 12) throw new Error("the tour did not end after 12 cards");
  }
  return kartu;
}

const hasil = [];

if (!CABANG) {
  const muridUntuk = (lebar) => LALUAN !== "standar" ? D["w1.murid5"] : BAHASA === "en" ? D["w1.murid4"]
    : D[`w1.murid${({ 1280: 1, 390: 2, 320: 3 })[lebar] ?? 6}`];
  for (const lebar of LEBAR) {
    const m = muridUntuk(lebar);
    const j = await jalan({ perjalanan: "j1", lebar, zona: "WIB", nama: m.nama });
    const { page } = j;

    await j.langkah("L1", "sign in by card number and card PIN (keyboard; Enter)", async ({ rec, foto, data }) => {
      data("card_signed_in_before", j.baca(sql.masukTerakhir(m)));
      await page.goto(`${APP}/masuk`);
      await pilihBahasa(j);
      await foto("masuk");
      rec.tab += await masukKartu(j, m.kartu, m.pin, foto);
      await page.waitForURL((u) => !u.pathname.startsWith("/masuk"), { timeout: 30000 });
      data("card_last_sign_in", j.baca(sql.masukTerakhir(m)));
    });

    await j.langkah("L2", "land on /belajar", async ({ foto, data }) => {
      const path = new URL(page.url()).pathname;
      data("landed_on", path);
      data("device_session_mode", j.baca(sql.modeSesi(m)));
      if (!path.startsWith("/belajar")) throw new Error(`landed on ${path}, not /belajar`);
      await foto("belajar");
    });

    await j.langkah("L3", "the tour, every card by its own button", async (c) => {
      c.data("tour_cards", await jalanTur(j, c, "tur-"));
      c.data("tour_state", j.baca(sql.tur(m)));
      await c.foto("setelah-tur");
    });

    await j.langkah("L4", "open today's task (its first step; nothing started)", async ({ rec, foto, data, amati }) => {
      rec.tab += await j.tekan(page.locator(`main a[href^="/belajar/${tugas}"]`).first());
      await page.waitForURL((u) => u.pathname.startsWith(`/belajar/${tugas}`), { timeout: 30000 });
      await foto("tugas-hari-ini");
      data("opened", new URL(page.url()).pathname);
      data("sittings_started", j.baca(`select count(*) from public.assessment_sessions s where s.person_id = '${m.person}'`));
      amati(`last screen: ${new URL(page.url()).pathname}`);
    });

    hasil.push(await j.selesai());
  }
  process.exit(ringkas("j1", hasil));
}

// ─────────────────────────────── the branches (1280, ID) ───────────────────────────────
{
  const m = D["w1.murid6"];
  const j = await jalan({ perjalanan: "j1-cabang-pin-salah", lebar: 1280, zona: "WIB", nama: m.nama });
  const { page } = j;
  const salah = m.pin === "000000" ? "111111" : "000000";
  const pesan = [];

  // The script says three wrong PINs, then the wait. The product's pacing (card_signin_attempt) gives 5 free tries in
  // 15 minutes, then a wait of 30 s doubling to 300 s: tries 1–3 are the script's, 4–6 go on to the first wait, and
  // are labelled as beyond the script. Recorded, not judged.
  for (let n = 1; n <= 6; n++) {
    await j.langkah(`C1.${n}`, `a wrong card PIN, try ${n}${n > 3 ? " (beyond the script's three: to the product's first wait)" : ""}`, async ({ rec, foto, data }) => {
      if (n === 1) await page.goto(`${APP}/masuk`);
      rec.tab += await masukKartu(j, m.kartu, salah, n === 1 ? foto : null);
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(800);
      await foto(`pin-salah-${n}`);
      const t = (await page.locator('[role="alert"], [aria-live] , .pin-galat, .pin-error').allInnerTexts().catch(() => [])).join(" | ").replace(/\s+/g, " ").trim();
      pesan.push(t);
      data("message", t || "(no alert or live-region text)");
      data("still_on", new URL(page.url()).pathname);
      data("pin_field_value_kept", await page.locator("#pin").inputValue().catch(() => "?"));
      data("card_field_value_kept", (await page.locator("#kartu").inputValue().catch(() => "")) === m.kartu);
    });
  }
  await j.langkah("C1.7", "then the right card PIN, during the wait", async ({ rec, foto, data, amati }) => {
    rec.tab += await masukKartu(j, m.kartu, m.pin, null);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(800);
    await foto("pin-benar-setelah-tiga");
    data("path_after", new URL(page.url()).pathname);
    data("card_last_sign_in", j.baca(sql.masukTerakhir(m)));
    const t = (await page.locator('[role="alert"], [aria-live]').allInnerTexts().catch(() => [])).join(" | ").replace(/\s+/g, " ").trim();
    data("message", t || "(no alert or live-region text)");
    amati(new URL(page.url()).pathname.startsWith("/masuk") ? "still on the sign-in page after the right PIN" : `signed in: ${new URL(page.url()).pathname}`);
  });
  await j.langkah("C2", "a mistyped card number (a number no card has)", async ({ rec, foto, data }) => {
    if (!new URL(page.url()).pathname.startsWith("/masuk")) {
      await page.context().clearCookies();
      await page.goto(`${APP}/masuk`);
    }
    const nomor = m.kartu.slice(0, -2) + "99";
    data("no_card_has_it", j.baca(`select count(*) = 0 from public.accounts where card_number = '${nomor}'`));
    rec.tab += await masukKartu(j, nomor, m.pin, null);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(800);
    await foto("nomor-salah");
    const t = (await page.locator('[role="alert"], [aria-live] , .pin-galat, .pin-error').allInnerTexts().catch(() => [])).join(" | ").replace(/\s+/g, " ").trim();
    data("message", t || "(no alert or live-region text)");
    // [S] recorded, not judged: whether the words differ from a wrong PIN's on a real card (an existence oracle)
    data("same_words_as_a_wrong_pin_on_a_real_card", t === pesan[0]);
  });
  hasil.push(await j.selesai());
}
{
  const m = D["w1.murid5"];
  const j = await jalan({ perjalanan: "j1-cabang-tur-keluar", lebar: 1280, zona: "WIB", nama: m.nama });
  const { page } = j;

  await j.langkah("C3.1", "sign in; the tour closed early (card 2)", async (c) => {
    await page.goto(`${APP}/masuk`);
    c.rec.tab += await masukKartu(j, m.kartu, m.pin, null);
    await page.waitForURL((u) => !u.pathname.startsWith("/masuk"), { timeout: 30000 });
    c.data("cards_seen", await jalanTur(j, c, "tur-awal-", 2));
    c.data("tour_state", j.baca(sql.tur(m)));
    await c.foto("tur-ditutup");
  });
  await j.langkah("C3.2", "the tour reopened from «Bantuan»", async (c) => {
    c.rec.tab += await j.tekan(page.getByRole("button", { name: /^(Bantuan|Help)$/i }).first());
    await page.waitForTimeout(500);
    await c.foto("bantuan");
    c.rec.tab += await j.tekan(page.getByRole("button", { name: /^(Mulai tur lagi|Mulai tur|Start the tour again|Start the tour)$/i }).first(), 40);
    c.data("cards_seen", await jalanTur(j, c, "tur-lagi-"));
    c.data("tour_state", j.baca(sql.tur(m)));
    await c.foto("setelah-tur-lagi");
  });
  await j.langkah("C4.1", "sign out (the same shared computer)", async ({ rec, foto, data }) => {
    rec.tab += await j.tekan(page.locator("button.pin-sesi-keluar").first());
    await page.waitForURL((u) => !u.pathname.startsWith("/belajar"), { timeout: 30000 });
    await foto("setelah-keluar");
    data("path_after", new URL(page.url()).pathname);
    data("open_device_sessions", j.baca(sql.modeSesi(m)));
  });
  await j.langkah("C4.2", "sign back in by card on the same computer", async ({ rec, foto, data, amati }) => {
    if (!new URL(page.url()).pathname.startsWith("/masuk")) await page.goto(`${APP}/masuk`);
    rec.tab += await masukKartu(j, m.kartu, m.pin, foto, "lagi-");
    await page.waitForURL((u) => !u.pathname.startsWith("/masuk"), { timeout: 30000 });
    await page.waitForTimeout(800);
    await foto("masuk-lagi");
    data("landed_on", new URL(page.url()).pathname);
    data("tour_opened_by_itself", await page.locator('.pin-tur-kartu[role="dialog"]').isVisible().catch(() => false));
    data("device_session_mode", j.baca(sql.modeSesi(m)));
    data("tour_state", j.baca(sql.tur(m)));
    amati(`last screen: ${new URL(page.url()).pathname}`);
  });
  hasil.push(await j.selesai());
}
process.exit(ringkas("j1-cabang", hasil));
