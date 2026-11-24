// J1 · First day (SD): a class card's first sign-in, the tour, today's task (Daisy's final scripts, a06e13e9, §2 J1).
// World: W1 (audit/dunia/01-sekolah-sd.sql) and 4A's chapter (02-bab.sql). A harness: it records, it does not judge.
//
//   audit/dunia/muat.sh && node audit/perjalanan/j1.mjs        (the app on APP_URL, built from this tree)
//
// Each width is walked by its own W1 learner, so every walk is a first sign-in (1280 → learner 1, 390 → 2, 320 → 3;
// the EN walk → 4; a pass's walk → 5). Keyboard only. The script's steps, as the screen offers them:
//   L1 the sign-in page · L2 «Gunakan kartu kelas» · L3 card number and card PIN, Enter
//   L4 «make a personal PIN» and L5 «Komputer siapa ini?»: recorded as the screen offered them (OBSERVED; see below)
//   L6 the tour, every card, by its own button · L7 today's task: the chapter's first step opened (not started)
// L4/L5 note: on next-base a class-card session is always shared (src/lib/penjaga-sesi.ts: "CARD every class-card
// session (T1, D-086(c)); a learner is never asked about the computer"), and a card's PIN is the card's. The capture
// records what the screen did at those two steps and the data behind it; whether the script or the screen is right
// is Daisy's call. For comparison: a learner who signs in BY EMAIL (W2's) is taken to /perangkat («Komputer siapa
// ini?») after the sign-in, and a personal PIN is an email account's (set_my_pin). The two steps exist; on next-base
// they belong to the email path, not the class card's.
import { APP, dunia, jalan, pilihBahasa, ringkas, BAHASA, LALUAN, LEBAR } from "./lib.mjs";

const D = dunia();
const tugas = D["sd.bab4a"].tugas;
const muridUntuk = (lebar) => LALUAN !== "standar" ? D["w1.murid5"] : BAHASA === "en" ? D["w1.murid4"]
  : D[`w1.murid${({ 1280: 1, 390: 2, 320: 3 })[lebar] ?? 6}`];

const hasil = [];
for (const lebar of LEBAR) {
  const m = muridUntuk(lebar);
  const j = await jalan({ perjalanan: "j1", lebar, zona: "WIB", nama: m.nama });
  const { page } = j;

  await j.langkah("L1", "the sign-in page", async ({ foto, data }) => {
    await page.goto(`${APP}/masuk`);
    await pilihBahasa(j);
    await foto("masuk");
    data("card_signed_in_before", j.baca(`select coalesce(u.last_sign_in_at::text, 'never') from auth.users u join public.accounts a on a.auth_user_id = u.id where a.card_number = '${m.kartu}'`));
  });

  await j.langkah("L2", "«Gunakan kartu kelas»", async ({ rec, foto }) => {
    rec.tab += await j.tekan(page.getByRole("button", { name: /kartu kelas|class card/i }).first());
    await page.locator("#kartu").waitFor({ timeout: 15000 });
    await foto("kartu");
  });

  await j.langkah("L3", "the card number and the card PIN, by keyboard; Enter", async ({ rec, foto, data }) => {
    rec.tab += await j.ketik(page.locator("#kartu"), m.kartu);
    rec.tab += await j.ketik(page.locator("#pin"), m.pin);
    await page.keyboard.press("Enter");
    await page.waitForURL((u) => !u.pathname.startsWith("/masuk"), { timeout: 30000 });
    await foto("setelah-masuk");
    data("landed_on", new URL(page.url()).pathname);
    data("card_last_sign_in", j.baca(`select coalesce(u.last_sign_in_at::text, 'never') from auth.users u join public.accounts a on a.auth_user_id = u.id where a.card_number = '${m.kartu}'`));
    data("device_session_mode", j.baca(`select string_agg(ds.mode::text, ',') from public.device_sessions ds join public.accounts a on a.auth_user_id = ds.auth_user_id where a.card_number = '${m.kartu}' and ds.ended_at is null`));
  });

  await j.langkah("L4", "«make a personal PIN» (as the screen offers it)", async ({ amati, data }) => {
    const path = new URL(page.url()).pathname;
    const pinField = await page.locator('input[name="pin"], #pin-baru, #pin_baru').count();
    data("setup_row", j.baca(`select coalesce((select s.state from public.account_setup s join public.accounts a on a.id = s.account_id where a.card_number = '${m.kartu}'), 'none')`));
    amati(path.startsWith("/aktifkan") || pinField
      ? `OFFERED: ${path} shows a PIN field`
      : `NOT OFFERED on this path: after the card sign-in the screen is ${path}, with no personal-PIN step; the card account has no setup row`);
  });

  await j.langkah("L5", "«Komputer siapa ini?» (as the screen offers it)", async ({ amati, data }) => {
    const path = new URL(page.url()).pathname;
    data("device_session_mode", j.baca(`select string_agg(ds.mode::text, ',') from public.device_sessions ds join public.accounts a on a.auth_user_id = ds.auth_user_id where a.card_number = '${m.kartu}' and ds.ended_at is null`));
    amati(path === "/perangkat" ? "ASKED: /perangkat" : `NOT ASKED: the session went to ${path}; its device session is recorded as shown in data`);
  });

  await j.langkah("L6", "the tour, every card by its own button (keyboard)", async ({ rec, foto, amati, data }) => {
    const kartuTur = page.locator('.pin-tur-kartu[role="dialog"]');
    if (!(await kartuTur.waitFor({ state: "visible", timeout: 15000 }).then(() => true, () => false))) {
      amati("NO TOUR on the first screen");
      return;
    }
    let kartu = 0;
    while (await kartuTur.isVisible().catch(() => false)) {
      kartu++;
      await foto(`tur-${kartu}`);
      const judul = (await kartuTur.innerText()).replace(/\s+/g, " ").slice(0, 160);
      amati(`card ${kartu}: ${judul}`);
      const maju = kartuTur.getByRole("button", { name: /^(Berikutnya|Selesai|Next|Done|Finish|Mulai|Start)/i }).last();
      if (!(await maju.count())) throw new Error(`tour card ${kartu}: no button to go on`);
      rec.tab += await j.tekan(maju, 40);
      await page.waitForTimeout(400);
      if (kartu > 12) throw new Error("the tour did not end after 12 cards");
    }
    data("tour_cards", kartu);
    data("tour_state", j.baca(`select string_agg(t.tour_key || ' completed=' || coalesce(t.completed_at::text, '-') || ' shown=' || t.auto_shown_count, '; ')
      from public.person_tour_state t where t.person_id = '${m.person}'`));
    await foto("setelah-tur");
  });

  await j.langkah("L7", "today's task: its first step opened (not started)", async ({ rec, foto, data, amati }) => {
    const buka = page.locator(`main a[href^="/belajar/${tugas}"]`).first();
    rec.tab += await j.tekan(buka);
    await page.waitForURL((u) => u.pathname.startsWith(`/belajar/${tugas}`), { timeout: 30000 });
    await foto("tugas-hari-ini");
    data("opened", new URL(page.url()).pathname);
    data("sittings_started", j.baca(`select count(*) from public.assessment_sessions s where s.person_id = '${m.person}'`));
    amati(`last screen: ${new URL(page.url()).pathname}`);
  });

  hasil.push(await j.selesai());
}
process.exit(ringkas("j1", hasil));
