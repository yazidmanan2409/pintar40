// J12 · Operating PINTAR (Daisy's script, 53c1af77, J12). World: W19, an Admin PINTAR (Hendra Kusuma, pintar.admin1) on
// a quiet day, with W3 running at SMP Sintetis Cendekia. A harness: it records, it does not judge.
//
//   node audit/perjalanan/j12.mjs      (the app on APP_URL; it LOADS THE WORLD ITSELF before each walk: it changes it)
//
// The Admin PINTAR walks by keyboard, in «Seluruh platform». At each moment an OBSERVER snapshot records what a learner
// (Rizky, W5, Cendekia 8A) and a teacher (8A's teacher) see: each signs in in a separate browser and opens their home
// (an observation beside the walk, not part of it; not by keyboard).
//   L1 plan a platform maintenance starting in 30 minutes (inside the 60-minute warning, before T−15)
//   L2 extend it by 30 minutes
//   L3 start it now («Mulai sekarang»), then end it early («Akhiri sekarang»), each with its recorded reason
//   L4 an emergency stop («Hentikan PINTAR sekarang», typed confirmation), then its end («Akhiri sekarang»)
//   L5 a test email (to the world's own synthetic address; Mailpit is the sink)
//   L6 a platform role renewed (Ratna's), then toward the last-admin refusal: Ratna's and the seed's «Admin Platform
//      (sintetis)» roles released (the seed's own platform admin, released by the journey; the world is reloaded before
//      every walk), leaving Hendra the last; then what his own row offers is recorded (ROLE_LAST_PLATFORM_ADMIN guards
//      the release of the last usable one, and the screen offers no release of one's own role)
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { APP, dunia, jalan, pilihBahasa, ringkas, masukEmail, muatUlang, BAHASA, LEBAR } from "./lib.mjs";

const jam = (menit) => {
  // a WIB wall-clock time, as the form's datetime-local takes it (the server's clock is the machine's; WIB is UTC+7)
  const d = new Date(Date.now() + menit * 60000 + 7 * 3600000);
  return d.toISOString().slice(0, 16);
};

const hasil = [];
for (const lebar of LEBAR) {
  muatUlang();
  const D = dunia();
  const admin = D["pintar.admin1"];
  const pengamat = [["murid", D["w5.murid"], "/belajar"], ["guru", D["smp.guru8a"], "/mengajar"]];
  const j = await jalan({ perjalanan: "j12", lebar, zona: "WIB", nama: admin.nama });
  const { page } = j;
  const teks = async () => (await page.locator('[role="status"], [role="alert"]').allInnerTexts().catch(() => []))
    .map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean).join(" | ");
  const sql = {
    jendela: `select coalesce(string_agg(w.kind::text || ' ' || to_char(w.starts_at at time zone 'Asia/Jakarta', 'HH24:MI') || '→'
               || coalesce(to_char(w.ends_at at time zone 'Asia/Jakarta', 'HH24:MI'), '…') || coalesce(' ended ' || to_char(w.ended_at at time zone 'Asia/Jakarta', 'HH24:MI'), ''), '; ' order by w.created_at), 'none')
               from public.maintenance_windows w`,
    admin: `select string_agg(p.display_name || coalesce(' until ' || ra.valid_until::date::text, ''), ', ' order by p.display_name)
              from public.admin_dapat_dipakai('SYSTEM_ADMIN', null) a join public.role_assignments ra on ra.id = a.id join public.persons p on p.id = ra.person_id`,
  };

  // what a learner and a teacher see now (a separate browser each; recorded beside the step)
  let nPengamat = 0;
  const amatiOrang = async (rec, saat) => {
    const browser = page.context().browser();
    for (const [peran, o, rumah] of pengamat) {
      const ctx = await browser.newContext({ viewport: { width: lebar, height: 900 }, locale: BAHASA === "en" ? "en-GB" : "id-ID", timezoneId: "Asia/Jakarta" });
      const p = await ctx.newPage();
      try {
        await p.goto(`${APP}/masuk`);
        await p.locator("#identitas").fill(o.email);
        await p.locator("#password").fill(o.password);
        await p.locator("#password").press("Enter");
        await p.waitForURL((u) => !u.pathname.startsWith("/masuk"), { timeout: 20000 }).catch(() => {});
        if (new URL(p.url()).pathname === "/perangkat") {
          await p.getByRole("radio", { name: /pribadi|personal/i }).first().check().catch(() => {});
          await p.getByRole("button", { name: /Simpan pilihan|Save my choice/i }).first().click().catch(() => {});
          await p.waitForURL((u) => u.pathname !== "/perangkat", { timeout: 20000 }).catch(() => {});
        }
        if (!new URL(p.url()).pathname.startsWith(rumah)) await p.goto(`${APP}${rumah}`).catch(() => {});
        await p.waitForLoadState("networkidle").catch(() => {});
        const f = `pengamat-${String(++nPengamat).padStart(2, "0")}-${saat}-${peran}.png`;
        await p.screenshot({ path: join(j.out, f), fullPage: false });
        rec.layar.push(f.replace(/\.png$/, ""));
        rec.data[`seen_by_${peran}_${saat}`] = `${new URL(p.url()).pathname}: ` + ((await p.locator("body").innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").slice(0, 260);
      } catch (e) {
        rec.data[`seen_by_${peran}_${saat}`] = `(observer could not look: ${String(e.message).slice(0, 120)})`;
      }
      await ctx.close();
    }
  };
  const halaman = async (path) => {
    await page.goto(`${APP}${path}`);
    const ruang = page.getByRole("button", { name: /Seluruh platform|The whole platform/i }).first();
    if (await ruang.isVisible().catch(() => false)) { await j.tekan(ruang); await page.waitForLoadState("networkidle").catch(() => {}); }
    if (!new URL(page.url()).pathname.startsWith(path.split("?")[0])) await page.goto(`${APP}${path}`);
  };
  const formDengan = (tombol) => page.locator("form", { has: page.getByRole("button", { name: tombol }) }).first();
  const harus = (benar, pesan) => { if (!benar) throw new Error(pesan); };
  const isiWaktu = async (rec, nama, nilai) => {
    const f = page.getByRole("textbox", { name: nama }).first();
    rec.tab += await j.tabKe(f, 120);
    await f.fill(nilai);   // a datetime-local field: its value set where the keyboard put the focus
  };

  await j.langkah("L1", "plan a platform maintenance in 30 minutes", async (c) => {
    await page.goto(`${APP}/masuk`);
    await pilihBahasa(j);
    c.data("signed_in", await masukEmail(j, admin));
    await halaman("/konfigurasi/pemeliharaan");
    await c.foto("pemeliharaan");
    const bentuk = page.locator("form", { has: page.getByRole("button", { name: /Periksa waktu ini|Check this time/i }) }).first();
    c.rec.tab += await j.tabKe(bentuk.getByRole("checkbox").first(), 120); await page.keyboard.press("Space");
    await isiWaktu(c.rec, /^Mulai|^Start/i, jam(30));
    await isiWaktu(c.rec, /Perkiraan selesai|Expected end/i, jam(90));
    c.rec.tab += await j.tekan(bentuk.getByRole("button", { name: /Periksa waktu ini|Check this time/i }), 120);
    await page.getByRole("button", { name: /Jadwalkan pemeliharaan|Schedule/i }).first().waitFor({ timeout: 30000 });
    await c.foto("periksa-waktu");
    const r = page.getByRole("radio").first();
    c.rec.tab += await j.tabKe(r, 120); await page.keyboard.press("Space");
    c.rec.tab += await j.tekan(page.getByRole("button", { name: /Jadwalkan pemeliharaan|Schedule/i }).first(), 120);
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(800);
    await c.foto("dijadwalkan");
    c.data("words", await teks());
    c.data("windows", j.baca(sql.jendela));
    harus(c.rec.data.windows !== "none", "no maintenance was planned");
    await amatiOrang(c.rec, "direncanakan");
  });

  await j.langkah("L2", "extend it by 30 minutes", async (c) => {
    await halaman("/konfigurasi/pemeliharaan");
    const sebelum = j.baca(sql.jendela);
    c.rec.tab += await j.tekan(page.getByRole("link", { name: /^(Perpanjang|Extend)/i }).first(), 150);
    await page.getByRole("textbox", { name: /Selesai baru|New end/i }).first().waitFor({ timeout: 30000 });
    await isiWaktu(c.rec, /Selesai baru|New end/i, jam(120));
    const simpan = /Simpan perpanjangan|Save the extension/i;
    const f = page.locator("form", { has: page.getByRole("textbox", { name: /Selesai baru|New end/i }) }).first();
    c.rec.tab += await j.tekan(f.getByRole("button", { name: /Periksa waktu ini|Check this time/i }), 60);
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(800);
    await c.foto("perpanjang-periksa");
    c.data("check_words", await teks());
    // after the check, the reason and «Simpan perpanjangan» are their own form
    const g = formDengan(simpan);
    c.rec.tab += await j.ketik(g.getByRole("textbox", { name: /Alasan|Reason/i }), "Pembaruan butuh waktu lebih lama (dunia audit J12).", 60);
    c.rec.tab += await j.tekan(g.getByRole("button", { name: simpan }), 60);
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(800);
    await c.foto("diperpanjang");
    c.data("words", await teks());
    const sesudah = j.baca(sql.jendela);
    c.data("windows_before_after", `${sebelum}  ⟶  ${sesudah}`);
    harus(sesudah !== sebelum, "the maintenance's end did not change");
  });

  await j.langkah("L3", "start it now, then end it early", async (c) => {
    await halaman("/konfigurasi/pemeliharaan");
    c.rec.tab += await j.tekan(page.getByRole("link", { name: /^(Batalkan|Cancel it)/i }).first(), 150);   // the row's actions open here
    const mulai = /^(Mulai sekarang|Start now)/i;
    await formDengan(mulai).waitFor({ timeout: 30000 });
    c.rec.tab += await j.ketik(formDengan(mulai).getByRole("textbox", { name: /Alasan|Reason/i }), "Sekolah sudah libur; dimulai lebih awal (dunia audit J12).", 60);
    await c.foto("mulai-sekarang");
    c.rec.tab += await j.tekan(formDengan(mulai).getByRole("button", { name: mulai }), 60);
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(800);
    await c.foto("dimulai");
    c.data("start_words", await teks());
    c.data("windows_started", j.baca(sql.jendela));
    await amatiOrang(c.rec, "berjalan");
    await halaman("/konfigurasi/pemeliharaan");
    c.rec.tab += await j.tekan(page.getByRole("link", { name: /^(Akhiri sekarang|End now)/i }).first(), 150);
    const akhiri = /^(Akhiri sekarang|End now)/i;
    await formDengan(akhiri).waitFor({ timeout: 30000 });
    c.rec.tab += await j.ketik(formDengan(akhiri).getByRole("textbox", { name: /Alasan|Reason/i }), "Selesai lebih cepat dari perkiraan (dunia audit J12).", 60);
    c.rec.tab += await j.tekan(formDengan(akhiri).getByRole("button", { name: akhiri }), 60);
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(800);
    await c.foto("diakhiri-lebih-awal");
    c.data("end_words", await teks());
    const w = j.baca(sql.jendela);
    c.data("windows_ended", w);
    harus(/ended/.test(w), "the maintenance was not ended");
    await amatiOrang(c.rec, "setelah-diakhiri");
  });

  await j.langkah("L4", "an emergency stop, then its end", async (c) => {
    await halaman("/konfigurasi/pemeliharaan");
    const bentuk = page.locator("form", { has: page.getByRole("button", { name: /Hentikan PINTAR sekarang|Stop PINTAR now/i }) }).first();
    c.rec.tab += await j.tabKe(bentuk.getByRole("checkbox").first(), 200); await page.keyboard.press("Space");
    c.rec.tab += await j.ketik(bentuk.getByRole("textbox").first(), "Uji henti darurat (dunia audit J12): gangguan basis data disimulasikan.");
    c.rec.tab += await j.ketik(bentuk.getByRole("textbox").nth(1), "HENTIKAN SEKARANG"   /* the screen asks for these words in both languages */);
    await c.foto("henti-siap");
    c.rec.tab += await j.tekan(bentuk.getByRole("button", { name: /Hentikan PINTAR sekarang|Stop PINTAR now/i }));
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(1000);
    await c.foto("dihentikan");
    c.data("stop_words", await teks());
    c.data("windows_stopped", j.baca(sql.jendela));
    harus(/EMERGENCY/.test(c.rec.data.windows_stopped), "no emergency stop was recorded");
    await amatiOrang(c.rec, "dihentikan");
    await halaman("/konfigurasi/pemeliharaan");
    c.rec.tab += await j.tekan(page.getByRole("link", { name: /^(Akhiri sekarang|End now)/i }).first(), 150);
    const akhiri = /^(Akhiri sekarang|End now)/i;
    await formDengan(akhiri).waitFor({ timeout: 30000 });
    c.rec.tab += await j.ketik(formDengan(akhiri).getByRole("textbox", { name: /Alasan|Reason/i }), "Sudah aman: basis data pulih (dunia audit J12).", 60);
    c.rec.tab += await j.tekan(formDengan(akhiri).getByRole("button", { name: akhiri }), 60);
    await page.waitForTimeout(600);
    // ending a stop asks once more («Akhiri jendela pemeliharaan ini sekarang?»): its words recorded, then confirmed
    const tanya = page.getByText(/Akhiri jendela pemeliharaan ini sekarang\?|End this maintenance window now\?/i).first();
    if (await tanya.isVisible().catch(() => false)) {
      await c.foto("henti-konfirmasi");
      c.data("confirm_question", (await tanya.innerText()).trim());
      c.rec.tab += await j.tekan(page.getByRole("button", { name: akhiri }).last(), 150);
    }
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(1000);
    await c.foto("henti-diakhiri");
    c.data("end_words", await teks());
    const w = j.baca(sql.jendela);
    c.data("windows_after", w);
    harus(/EMERGENCY[^;]* ended/.test(w), "the emergency stop was not ended");
    await amatiOrang(c.rec, "setelah-henti");
  });

  await j.langkah("L5", "a test email (Mailpit is the sink)", async (c) => {
    const kirim = async () => {
      c.rec.tab += await j.ketik(page.getByRole("textbox", { name: /Alamat email tujuan|Send to this email address/i }).first(), admin.email);
      c.rec.tab += await j.tekan(page.getByRole("button", { name: /^(Kirim email uji|Send test email)$/i }).first());
      await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(2500);
      return teks();
    };
    await halaman("/konfigurasi/email-uji");
    c.data("words", await kirim());
    await c.foto("email-uji");
    // THE HARNESS'S ADDRESS: the route's same-origin check compares the browser's Origin with request.nextUrl.origin,
    // which Next reports as http://localhost:<port> for a server bound to 127.0.0.1. At 127.0.0.1 every send is refused
    // as «tidak datang dari halaman PINTAR di alamat ini» (BUKAN_ASAL_SAMA); a deployment's one hostname has no such
    // split. So when that refusal is the answer, it is recorded, and the send is walked again from localhost.
    if (/tidak datang dari halaman PINTAR|did not come from a PINTAR page/i.test(c.rec.data.words) && new URL(APP).hostname === "127.0.0.1") {
      const lokal = APP.replace("127.0.0.1", "localhost");
      c.amati("refused at 127.0.0.1 as cross-origin (the harness's address: Next reports the origin as localhost); walked again from localhost");
      await page.goto(`${lokal}/masuk`);
      await masukEmail(j, admin);
      await page.goto(`${lokal}/konfigurasi/email-uji`);
      const ruang = page.getByRole("button", { name: /Seluruh platform|The whole platform/i }).first();
      if (await ruang.isVisible().catch(() => false)) {
        await j.tekan(ruang);
        await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(1500);
        if (!new URL(page.url()).pathname.startsWith("/konfigurasi/email-uji")) await page.goto(`${lokal}/konfigurasi/email-uji`);
      }
      c.data("words_from_localhost", await kirim());
      await c.foto("email-uji-localhost");
    }
    try {
      const m = JSON.parse(execFileSync("curl", ["-fsS", "http://127.0.0.1:54324/api/v1/messages?limit=10"], { encoding: "utf8" }));
      c.data("sink_latest", (m.messages ?? []).filter((x) => (x.To ?? []).some((t) => t.Address === admin.email)).map((x) => x.Subject).slice(0, 2));
    } catch { c.data("sink_latest", "(the sink could not be read)"); }
    harus(Array.isArray(c.rec.data.sink_latest) && c.rec.data.sink_latest.length > 0, "no test email reached the sink");
  });

  await j.langkah("L6", "a platform role renewed, then the last-admin refusal", async (c) => {
    const sampaiRatna = () => j.baca(`select max(ra.valid_until)::date from public.role_assignments ra where ra.person_id = '${D["pintar.admin2"].person}' and ra.role = 'SYSTEM_ADMIN' and ra.revoked_at is null`);
    await halaman("/konfigurasi/roles");
    c.data("usable_admins_before", j.baca(sql.admin));
    const sebelum = sampaiRatna();
    // renew Ratna's (the other world admin) by a year from today
    c.rec.tab += await j.tekan(page.getByRole("link", { name: new RegExp(`^(Perpanjang|Renew)\\s*·\\s*${D["pintar.admin2"].nama}`) }).first(), 200);
    const sampai = page.getByRole("textbox", { name: /Berlaku sampai yang baru|New valid-until date/i }).first();
    await sampai.waitFor({ timeout: 30000 });
    const f = page.locator("form", { has: sampai }).first();
    c.rec.tab += await j.tabKe(sampai, 200);
    // a renewal ends after the current end: a year after it
    await sampai.fill(new Date(Date.parse(sebelum) + 365 * 86400000).toISOString().slice(0, 10));
    const alasan = f.getByRole("textbox", { name: /Alasan|Reason/i });
    if (await alasan.count()) c.rec.tab += await j.ketik(alasan.first(), "Masa tugas diperpanjang (dunia audit J12).", 60);
    await c.foto("perpanjang-peran");
    c.rec.tab += await j.tekan(f.getByRole("button", { name: /^(Perpanjang peran|Renew role)$/i }), 60);
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(800);
    await c.foto("peran-diperpanjang");
    c.data("renew_words", await teks());
    const sesudah = sampaiRatna();
    c.data("ratna_valid_until_before_after", `${sebelum} ⟶ ${sesudah}`);
    harus(sesudah !== sebelum, "Ratna's role was not renewed");
    // release the two others; then what his own row offers
    const lepaskan = async (nama, n) => {
      await halaman("/konfigurasi/roles");
      c.rec.tab += await j.tekan(page.getByRole("link", { name: new RegExp(`^(Lepaskan|Release)\\s*·\\s*${nama.replace(/[()]/g, "\\$&")}`) }).first(), 200);
      const tombol = page.getByRole("button", { name: /^(Lepaskan|Release|Cabut|Revoke)/i }).first();
      await tombol.waitFor({ timeout: 30000 });
      const g = page.locator("form", { has: tombol }).first();
      const al = g.getByRole("textbox", { name: /Alasan|Reason/i });
      if (await al.count()) c.rec.tab += await j.ketik(al.first(), "Uji pelepasan peran (dunia audit J12).", 60);
      c.rec.tab += await j.tekan(tombol, 60);
      await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(800);
      await c.foto(`lepas-${n}`);
      return teks();
    };
    c.data("release_ratna", await lepaskan(D["pintar.admin2"].nama, 1));
    c.data("release_seed_admin", await lepaskan("Admin Platform (sintetis)", 2));
    c.data("usable_admins_after", j.baca(sql.admin));
    harus(c.rec.data.usable_admins_after === admin.nama + c.rec.data.usable_admins_after.slice(admin.nama.length) && !/Ratna|Admin Platform/.test(c.rec.data.usable_admins_after), "the other platform admins were not released");
    await halaman("/konfigurasi/roles");
    await c.foto("satu-admin-tersisa");
    const tawaran = (await page.getByRole("link").allInnerTexts()).map((x) => x.replace(/\s+/g, " ").trim()).filter((x) => x.includes(admin.nama));
    c.data("own_row_offers", tawaran);
    c.amati(tawaran.some((x) => /^(Lepaskan|Release)/i.test(x))
      ? "his own role offers «Lepaskan» (walk it for the refusal)"
      : "the last-admin refusal is NOT REACHABLE by the screens: his own row offers no «Lepaskan» (ROLE_LAST_PLATFORM_ADMIN guards a path the screen does not offer); recorded");
  });

  hasil.push(await j.selesai());
}
process.exit(ringkas("j12", hasil));
