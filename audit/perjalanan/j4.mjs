// J4 · An interrupted sitting (Daisy's script, J4; on main 429b7dcc). World: W9, Galih Pratama (w9.murid), 8A at SMP
// Sintetis Cendekia: the Pemetaan Awal done, the Uji Penguasaan begun with 2 answered and left open (in another
// session than his browser's). His teacher: 8A's (smp.guru8a). A harness: it records, it does not judge.
//
//   node audit/perjalanan/j4.mjs      (the app on APP_URL; it LOADS THE WORLD ITSELF before each walk: it changes it)
//
// Two people on one browser in turn, keyboard only.
//   L1 Galih returns: the open test needs his teacher's permission (he signs in here, not where it began)
//   L2 the teacher allows it («Siapa» → «Atur» → «Izinkan», with a reason)
//   L3 Galih resumes (his answers kept), then the network is lost while he answers one more, and returns
//   L4 the teacher ends it, scored («Akhiri dan nilai»); then what Galih and the teacher see
// Branches (AUDIT_CABANG=1, 1280; each on a fresh world):
//   «tidak-dihitung»  the teacher ends it not counted («Akhiri tanpa menghitung»); the two views after
//   «waktu-habis»     the time runs out while he is away (fixture w9-tenggat, labelled); the two views after
//   «pemeliharaan»    a platform maintenance planned in 10 minutes (fixture w9-pemeliharaan: the T−15 staff line), then
//                     started now (w9-pemeliharaan-mulai: stage 0); the two views at each moment
import { APP, dunia, jalan, lewatiTur, kerjakan, kunciBab, pilihBahasa, ringkas, masukEmail, muatUlang, keluar, BAHASA, LEBAR } from "./lib.mjs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CABANG = process.env.AUDIT_CABANG === "1";
const RAPI = (t) => (t ?? "").replace(/\s+/g, " ").trim();
const fiksasi = (f) => execFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "dunia", "muat.sh"), ["--fiksasi", f], { stdio: "ignore" });

function orang(j, D) {
  const { page } = j;
  const galih = D["w9.murid"], guru = D["smp.guru8a"], T = D["w3.bab"].tugas, UP = D["w3.bab"].up, K = D["smp.kelas8a"];
  const sesi = () => j.baca(`select coalesce(string_agg(s.status::text || ' answered ' || (select count(distinct r.presented_item_id) from public.responses r where r.session_id = s.id)
      || coalesce(' result ' || res.mastery, ''), '; ' order by s.created_at), 'none')
    from public.assessment_sessions s join public.assessment_definitions d on d.id = s.assessment_definition_id
    left join public.assessment_results res on res.session_id = s.id and res.supersedes_result_id is null
    where s.person_id = '${galih.person}' and d.mode = 'POST_TEST'`);
  return {
    galih, guru, T, UP, K, sesi,
    /** Galih's view: /belajar, then the test's page (and the result page) */
    async lihatGalih(foto, data, awalan) {
      await masukEmail(j, galih);
      if (!new URL(page.url()).pathname.startsWith("/belajar")) await page.goto(`${APP}/belajar`);
      await foto(`${awalan}galih-belajar`);
      await lewatiTur(j);
      data(`${awalan}learner_home`, RAPI(await page.locator("main").innerText().catch(() => "")).slice(0, 400));
      await page.goto(`${APP}/belajar/${T}/penguasaan`);
      await page.waitForLoadState("networkidle").catch(() => {});
      await foto(`${awalan}galih-uji`);
      data(`${awalan}learner_test_page`, RAPI(await page.locator("main").innerText().catch(() => "")).slice(0, 600));
      await page.goto(`${APP}/belajar/${T}/hasil`);
      await page.waitForLoadState("networkidle").catch(() => {});
      await foto(`${awalan}galih-hasil`);
      data(`${awalan}learner_result_page`, RAPI(await page.locator("main").innerText().catch(() => "")).slice(0, 500));
      await keluar(j);
    },
    /** the teacher's view: «Siapa» for the test, and Galih's «Atur» */
    async lihatGuru(rec, foto, data, awalan, tutup = true) {
      await masukEmail(j, guru);
      await page.goto(`${APP}/mengajar`);
      await foto(`${awalan}guru-mengajar`);
      await lewatiTur(j);
      data(`${awalan}teacher_home`, RAPI(await page.locator("main").innerText().catch(() => "")).slice(0, 500));
      await page.goto(`${APP}/mengajar/${K}/siapa?penugasan=${UP}`);
      await page.waitForLoadState("networkidle").catch(() => {});
      await foto(`${awalan}guru-siapa`);
      const baris = page.locator("li, tr").filter({ hasText: galih.nama }).first();
      data(`${awalan}teacher_row`, RAPI(await baris.innerText().catch(() => "(no row)")).slice(0, 300));
      const atur = page.getByRole("link", { name: new RegExp(`^(Atur|Manage)\\s*·\\s*${galih.nama}`) }).first();
      if (await atur.count()) {
        rec.tab += await j.tekan(atur, 200);
        await page.waitForTimeout(1200);
        await foto(`${awalan}guru-atur`);
        data(`${awalan}teacher_atur`, RAPI(await page.locator("main").innerText().catch(() => "")).slice(0, 900));
      }
      if (tutup) await keluar(j);
    },
    /** the teacher ends the sitting from «Atur»: the kind chosen (`jenis`: the radio's label), a reason, then `tombol`
     *  and its confirmation */
    async akhiri(rec, foto, data, jenis, tombol, alasan) {
      await masukEmail(j, guru);
      await page.goto(`${APP}/mengajar/${K}/siapa?penugasan=${UP}`);
      rec.tab += await j.tekan(page.getByRole("link", { name: new RegExp(`^(Atur|Manage)\\s*·\\s*${galih.nama}`) }).first(), 200);
      const pilihan = page.getByRole("radio", { name: jenis }).first();
      await pilihan.waitFor({ timeout: 30000 });
      const bentuk = page.locator("form").filter({ has: pilihan }).first();
      // a radio group is one Tab stop: reach the group, then the arrows choose
      rec.tab += await j.tabKe(bentuk.getByRole("radio").first(), 200);
      for (let i = 0; i < 4 && !(await pilihan.isChecked()); i++) await page.keyboard.press("ArrowDown");
      if (!(await pilihan.isChecked())) await page.keyboard.press("Space");
      rec.tab += await j.ketik(bentuk.getByRole("textbox").first(), alasan, 60);
      await foto("guru-akhiri-pilih");
      const t = bentuk.getByRole("button", { name: tombol }).first();
      await t.waitFor({ timeout: 15000 });
      rec.tab += await j.tekan(t, 60);
      await page.waitForTimeout(800);
      await foto("guru-akhiri-tanya");
      data("end_question", RAPI(await page.locator('[role="dialog"], [role="alertdialog"]').first().innerText().catch(() => "(no dialog)")).slice(0, 400));
      rec.tab += await j.tekan(page.getByRole("button", { name: tombol }).last(), 60);
      await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(1200);
      await foto("guru-diakhiri");
      data("end_words", RAPI((await page.locator('[role="status"]').allInnerTexts()).join(" | ")));
      data("sittings_after_end", this.sesi());
      await keluar(j);
    },
    /** the teacher allows the open test to continue after Galih signed in again */
    async izinkan(rec, foto, data) {
      await masukEmail(j, guru);
      await page.goto(`${APP}/mengajar/${K}/siapa?penugasan=${UP}`);
      await foto("guru-siapa-permintaan");
      rec.tab += await j.tekan(page.getByRole("link", { name: new RegExp(`^(Atur|Manage)\\s*·\\s*${galih.nama}`) }).first(), 200);
      const izin = page.locator("form", { has: page.locator("#atur-izinkan-alasan") }).first();
      await izin.waitFor({ timeout: 30000 });
      data("teacher_allow_question", RAPI(await page.locator('[id^="atur-izinkan-tanya-"]').first().innerText().catch(() => "")).slice(0, 400));
      rec.tab += await j.ketik(izin.locator("#atur-izinkan-alasan"), "Galih pindah komputer karena baterai habis; boleh dilanjutkan.", 150);
      rec.tab += await j.tekan(izin.getByRole("button", { name: /^(Izinkan|Allow)$/i }), 60);
      await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(1000);
      await foto("guru-diizinkan");
      data("teacher_allow_words", RAPI((await page.locator('[role="status"]').allInnerTexts()).join(" | ")));
      await keluar(j);
    },
  };
}

const hasil = [];
if (CABANG) process.exit(await cabang());

for (const lebar of LEBAR) {
  muatUlang();
  const D = dunia();
  const j = await jalan({ perjalanan: "j4", lebar, zona: "WIB", nama: "Galih · guru 8A" });
  const { page } = j;
  const O = orang(j, D);
  const kunci = kunciBab(D["w3.bab"].kursus);

  await j.langkah("L1", "Galih returns: the open test needs his teacher's permission", async ({ foto, data }) => {
    await page.goto(`${APP}/masuk`);
    await pilihBahasa(j);
    await masukEmail(j, O.galih);
    await page.goto(`${APP}/belajar/${O.T}/penguasaan`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await foto("galih-perlu-izin");
    const t = RAPI(await page.locator("main").innerText());
    data("words", t.slice(0, 700));
    data("permission_needed", /perlu diizinkan guru|teacher's permission|needs your teacher/i.test(t));
    data("sittings", O.sesi());
    await keluar(j);
    if (!rec_true(t)) throw new Error("the open test did not ask for the teacher's permission");
  });

  await j.langkah("L2", "the teacher allows it", async ({ rec, foto, data }) => {
    await O.izinkan(rec, foto, data);
  });

  await j.langkah("L3", "Galih resumes; the network is lost while he answers one more, then returns", async ({ rec, foto, data, amati }) => {
    await masukEmail(j, O.galih);
    await page.goto(`${APP}/belajar/${O.T}/penguasaan`);
    await page.waitForLoadState("networkidle").catch(() => {});
    const coba = page.getByRole("button", { name: /^(Coba lagi|Try again|Lanjutkan|Continue)$/i }).first();
    if (await coba.isVisible().catch(() => false)) { rec.tab += await j.tekan(coba, 150); await page.waitForLoadState("networkidle").catch(() => {}); }
    await foto("galih-dilanjutkan");
    data("resumed_words", RAPI(await page.locator("main").innerText()).slice(0, 400));
    // one more question, answered offline
    const daftarAwal = O.sesi();
    const lanjut = page.getByRole("button", { name: /^(Berikutnya|Next)$/i }).first();
    for (let i = 0; i < 6; i++) {   // to the first question not yet answered
      const t = RAPI(await page.locator("main").innerText());
      if (!/Tersimpan|Saved/.test(t) || i === 5) break;
      if (await lanjut.isEnabled().catch(() => false)) { await j.tekan(lanjut, 60); await page.waitForTimeout(500); } else break;
    }
    await page.context().setOffline(true);
    data("answered_offline", await kerjakan(j, kunci, rec, foto, "luring", /^(Kumpulkan|Submit)/i, {}, 1));
    await page.waitForTimeout(1500);
    await foto("galih-luring");
    data("offline_words", RAPI((await page.locator('[role="status"], [aria-live]').allInnerTexts()).join(" | ")).slice(0, 400));
    data("sittings_while_offline", O.sesi());
    await page.context().setOffline(false);
    await page.waitForTimeout(6000);
    await foto("galih-tersambung");
    data("online_words", RAPI((await page.locator('[role="status"], [aria-live]').allInnerTexts()).join(" | ")).slice(0, 400));
    data("sittings_after_online", O.sesi());
    amati(`before ${daftarAwal} · offline ${rec.data.sittings_while_offline} · back online ${rec.data.sittings_after_online}`);
    await keluar(j);
  });

  await j.langkah("L4", "the teacher ends it, scored; then both views", async (c) => {
    await O.akhiri(c.rec, c.foto, c.data, /^(Dinilai|Scored)/i, /^(Akhiri dan nilai|End and score)$/i, "Waktu pelajaran habis; jawaban yang ada dinilai.");
    await O.lihatGalih(c.foto, c.data, "akhir-");
    await O.lihatGuru(c.rec, c.foto, c.data, "akhir-");
  });

  hasil.push(await j.selesai());
}
process.exit(ringkas("j4", hasil));

function rec_true(t) { return /perlu diizinkan guru|teacher's permission|needs your teacher/i.test(t); }

async function cabang() {
  const hasilC = [];
  // «tidak-dihitung»
  {
    muatUlang();
    const D = dunia();
    const j = await jalan({ perjalanan: "j4-cabang-tidak-dihitung", lebar: 1280, zona: "WIB", nama: "Galih · guru 8A" });
    const O = orang(j, D);
    await j.langkah("C1", "the teacher ends it not counted; then both views", async (c) => {
      await j.page.goto(`${APP}/masuk`);
      await O.akhiri(c.rec, c.foto, c.data, /^(Tidak dihitung|Not counted)/i, /^(Akhiri tanpa menghitung|End without counting)$/i, "Gangguan teknis di komputer lab; tidak dihitung.");
      await O.lihatGalih(c.foto, c.data, "");
      await O.lihatGuru(c.rec, c.foto, c.data, "");
    });
    hasilC.push(await j.selesai());
  }
  // «waktu-habis»
  {
    muatUlang("w9-tenggat");
    const D = dunia();
    const j = await jalan({ perjalanan: "j4-cabang-waktu-habis", lebar: 1280, zona: "WIB", nama: "Galih · guru 8A",
      label: ["keadaan fiksasi: tenggat satu pengerjaan dimajukan (dibuat melewati penjaga hari ini)"] });
    const O = orang(j, D);
    await j.langkah("C1", "the time runs out while he is away; then both views", async (c) => {
      c.data("deadline", D["w9.tenggat"]);
      const tunggu = Math.max(0, Date.parse(D["w9.tenggat"]) - Date.now()) + 15000;
      c.amati(`waited ${Math.round(tunggu / 1000)} s for the deadline to pass`);
      await j.page.waitForTimeout(tunggu);
      await j.page.goto(`${APP}/masuk`);
      await O.lihatGalih(c.foto, c.data, "");
      c.data("sittings", O.sesi());
      await O.lihatGuru(c.rec, c.foto, c.data, "");
    });
    hasilC.push(await j.selesai());
  }
  // «pemeliharaan»
  {
    muatUlang("w9-pemeliharaan");
    const D = dunia();
    const j = await jalan({ perjalanan: "j4-cabang-pemeliharaan", lebar: 1280, zona: "WIB", nama: "Galih · guru 8A" });
    const O = orang(j, D);
    await j.langkah("C1", "maintenance planned in 10 minutes (the T−15 staff line): both views", async (c) => {
      await j.page.goto(`${APP}/masuk`);
      await O.lihatGuru(c.rec, c.foto, c.data, "t15-");
      await O.lihatGalih(c.foto, c.data, "t15-");
    });
    await j.langkah("C2", "the maintenance started (stage 0): both views", async (c) => {
      fiksasi("w9-pemeliharaan-mulai");
      await O.lihatGalih(c.foto, c.data, "mulai-");
      await O.lihatGuru(c.rec, c.foto, c.data, "mulai-");
    });
    hasilC.push(await j.selesai());
  }
  return ringkas("j4-cabang", hasilC);
}
