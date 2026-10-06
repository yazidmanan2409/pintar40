// J2.18 (CR-18): THE RESEND COUNTDOWN, SHOWN ONLY ON CODE SCREENS, THE SAME WHETHER OR NOT THE IDENTITY EXISTS.
//
// A code screen («Lupa password» → «Periksa email Anda», «Aktifkan akun» → «Masukkan kode aktivasi») holds «Kirim ulang
// kode» while the route's kirimUlangDalam runs and says how long is left («Kode bisa dikirim ulang dalam …»); the count
// goes down; at zero the button is free and the line is gone; a resend answers «… PINTAR sedang mengirim kode baru» and
// the count starts again. The route answers alike for every name (BOB26-K01, BOB27-K01), so two screens, one for a
// real account and one for a name nobody holds, must read alike at every step, side by side. The sign-in screen
// shows no countdown at all.
//
// Every step is a press of PINTAR's buttons in a browser; nothing is written to the database. A real account's step
// sends real codes to its own mailbox (two: the request and the resend).

const KIRIM_ULANG = /^Kirim ulang kode$/;
const DALAM = /Kode bisa dikirim ulang dalam\s+(\d+)\s+(detik|menit)/;
const ULANG_OK = /PINTAR sedang mengirim kode baru/;

/** Seconds left as the line says it: «1 menit» is an upper bound of 60, «59 detik» exactly 59; null without a line. */
export function detikTersisa(teks) {
  const m = DALAM.exec(teks ?? "");
  return m ? Number(m[1]) * (m[2] === "menit" ? 60 : 1) : null;
}

/** What a code screen shows of its resend, read in one go. */
export async function bacaKirimUlang(page) {
  const tombol = page.getByRole("button", { name: KIRIM_ULANG });
  const garis = page.locator(".pin-akt-hitung");
  const ada = (await garis.count()) > 0;
  const teks = ada ? (await garis.first().innerText()).replace(/\s+/g, " ").trim() : "";
  return {
    judul: (await page.locator("h1").first().innerText().catch(() => "")).trim(),
    tombol: await tombol.count(),
    tertahan: (await tombol.count()) > 0 ? await tombol.first().isDisabled() : null,
    teks,
    detik: detikTersisa(teks),
    ulangOk: ULANG_OK.test(await page.locator("[role=status]").allInnerTexts().then((x) => x.join(" ")).catch(() => "")),
  };
}

/**
 * Opens «Lupa password» on `page` and asks for a code for `nama`, as a person types it. Returns the code screen's
 * first reading.
 */
export async function mintaKodePemulihan(page, asal, nama) {
  await page.goto(`${asal}/masuk/lupa`, { waitUntil: "networkidle" });
  await page.locator("#nama").fill(nama);
  await page.getByRole("button", { name: "Kirim kode" }).click();
  await page.getByRole("button", { name: KIRIM_ULANG }).waitFor({ timeout: 30_000 });
  return bacaKirimUlang(page);
}

/** The same, on «Aktifkan akun» with an address. */
export async function mintaKodeAktivasi(page, asal, email) {
  await page.goto(`${asal}/aktifkan`, { waitUntil: "networkidle" });
  await page.locator("#email").fill(email);
  await page.getByRole("button", { name: "Kirim kode" }).click();
  await page.getByRole("button", { name: KIRIM_ULANG }).waitFor({ timeout: 30_000 });
  return bacaKirimUlang(page);
}

/**
 * The countdown on several code screens at once, side by side: each held with a line at the start, the count going
 * down, free at zero with the line gone, and a resend answered and counted again. Every screen must read the same as
 * the first at each step (the title, held or free, the seconds within `selisih`). Returns { ok, jejak, masalah }.
 */
export async function periksaHitungMundur(halaman, { selisih = 3, batasMs = 90_000 } = {}) {
  const masalah = [];
  const jejak = [];
  const semua = async () => Promise.all(halaman.map(({ page }) => bacaKirimUlang(page)));
  const sama = (langkah, baca, pilih) => {
    const a = pilih(baca[0]);
    baca.forEach((b, i) => {
      if (i > 0 && pilih(b) !== a) masalah.push(`${langkah}: «${halaman[i].nama}» reads ${JSON.stringify(pilih(b))}, «${halaman[0].nama}» ${JSON.stringify(a)}`);
    });
  };
  // what a line can mean: «N detik» is N exactly; «N menit» is anything from (N-1)·60+1 to N·60 seconds
  const rentang = (b) => (b.detik == null ? null : / menit/.test(b.teks) ? [b.detik - 59, b.detik] : [b.detik, b.detik]);
  const detikSama = (langkah, baca) => {
    const r = baca.map(rentang);
    if (r.some((x) => x == null)) return;
    const atas = Math.min(...r.map((x) => x[1])), bawah = Math.max(...r.map((x) => x[0]));
    if (bawah - atas > selisih) masalah.push(`${langkah}: the counts differ (${baca.map((b) => `«${b.teks}»`).join(", ")})`);
  };

  // 1. at the start: held, with a line, on every screen alike
  const awal = await semua();
  jejak.push(`start: ${awal.map((b, i) => `«${halaman[i].nama}» ${b.tertahan ? "held" : "FREE"} «${b.teks}»`).join("; ")}`);
  awal.forEach((b, i) => {
    if (b.tombol !== 1) masalah.push(`«${halaman[i].nama}»: ${b.tombol} «Kirim ulang kode» button(s)`);
    if (b.tertahan !== true) masalah.push(`«${halaman[i].nama}»: «Kirim ulang kode» is free at the start`);
    if (b.detik == null || b.detik < 5) masalah.push(`«${halaman[i].nama}»: no countdown at the start («${b.teks}»)`);
  });
  sama("start", awal, (b) => b.judul);
  sama("start", awal, (b) => b.tertahan);
  detikSama("start", awal);

  // 2. the count goes down: read until each screen's seconds have fallen (a minute reads «1 menit», then «59 detik»)
  const mulai = Date.now();
  let turun = null;
  while (Date.now() - mulai < 8_000) {
    await halaman[0].page.waitForTimeout(1_000);
    const b = await semua();
    if (b.every((x, i) => x.detik != null && awal[i].detik != null && x.detik < awal[i].detik)) { turun = b; break; }
  }
  if (!turun) masalah.push("the count did not go down within 8 s on every screen");
  else {
    jejak.push(`after ${Math.round((Date.now() - mulai) / 1000)} s: ${turun.map((b) => `${b.detik} s ${b.tertahan ? "held" : "FREE"}`).join("; ")}`);
    turun.forEach((b, i) => { if (b.tertahan !== true) masalah.push(`«${halaman[i].nama}»: free while the count runs`); });
    sama("running", turun, (b) => b.tertahan);
    detikSama("running", turun);
  }

  // 3. at zero: free, and the line gone, on every screen at the same moment (a screen freed later was given a longer
  //    wait than the others)
  const bebasPada = halaman.map(() => null);
  let bebas = null;
  while (Date.now() - mulai < batasMs) {
    await halaman[0].page.waitForTimeout(1_000);
    const b = await semua();
    b.forEach((x, i) => { if (x.tertahan === false && bebasPada[i] == null) bebasPada[i] = Date.now() - mulai; });
    if (b.every((x) => x.tertahan === false)) { bebas = b; break; }
  }
  if (!bebas) masalah.push(`«Kirim ulang kode» was not free on every screen within ${batasMs / 1000} s (freed at ${bebasPada.map((t) => (t == null ? "never" : `${Math.round(t / 1000)} s`)).join(", ")})`);
  else {
    const t = bebasPada.map((x) => Math.round(x / 1000));
    jejak.push(`free after ${t.join(", ")} s; lines: ${bebas.map((b) => JSON.stringify(b.teks)).join(", ")}`);
    if (Math.max(...t) - Math.min(...t) > selisih + 2) masalah.push(`the screens came free at different moments (${t.join(", ")} s)`);
    bebas.forEach((b, i) => { if (b.teks) masalah.push(`«${halaman[i].nama}»: the countdown line stays at zero («${b.teks}»)`); });
  }

  // 4. a resend: answered, and the count starts again, alike
  if (bebas) {
    await Promise.all(halaman.map(({ page }) => page.getByRole("button", { name: KIRIM_ULANG }).click()));
    let lagi = null;
    const m2 = Date.now();
    while (Date.now() - m2 < 20_000) {
      await halaman[0].page.waitForTimeout(1_000);
      const b = await semua();
      if (b.every((x) => x.ulangOk && x.tertahan === true && x.detik != null)) { lagi = b; break; }
    }
    if (!lagi) masalah.push("a resend was not answered with «PINTAR sedang mengirim kode baru» and a new count on every screen");
    else {
      jejak.push(`resent: ${lagi.map((b) => `${b.detik} s held, answered`).join("; ")}`);
      sama("resent", lagi, (b) => b.tertahan);
      detikSama("resent", lagi);
    }
  }
  return { ok: masalah.length === 0, jejak, masalah };
}

/** The sign-in screen, after a failed password: no resend countdown anywhere on it. */
export async function tanpaHitungDiMasuk(page, asal, nama) {
  await page.goto(`${asal}/masuk`, { waitUntil: "networkidle" });
  await page.locator("#identitas").fill(nama);
  await page.locator("#password").fill("bukan-password-siapa-pun-9");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.locator("#pw-err").waitFor({ timeout: 30_000 }).catch(() => {});
  const teks = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  return {
    ok: (await page.locator("#pw-err").count()) === 1 && (await page.locator(".pin-akt-hitung").count()) === 0 && !/dikirim ulang dalam/i.test(teks),
    teks: (await page.locator("#pw-err").innerText().catch(() => "")).trim(),
  };
}
