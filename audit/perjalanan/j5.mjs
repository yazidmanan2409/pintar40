// J5 · A teacher's week (Daisy's script, J5). World: W10 Ayu Lestari, new to PINTAR, teacher of 8A (W3, with results:
// Rizky's W5, Galih's open W9 sitting) and of 8C (W11, nothing given); 8A's email learners from W2 (Intan, Joko) take
// the Uji Cepat. Daisy walked the pages, «Siapkan» and «Bukti»; the builder's run adds what she left: running an Uji
// Cepat (a late joiner, one held by a stop), «Minta membaca lagi» sent, «Ubah jadwal», «Tambah waktu», and the
// passes. A harness: it records, it does not judge.
//
//   node audit/perjalanan/j5.mjs      (the app on APP_URL; it LOADS THE WORLD ITSELF before each walk: it changes it)
//
// Keyboard only:
//   L1  Ayu's first look: /mengajar, 8C (empty), then «Siapkan» W3's chapter for 8C to its end («Sampai» left empty)
//   L2  an Uji Cepat for 8A: the chapter, its questions (three ticked), the window, the review, «Sediakan Uji Cepat sekarang»
//   L3  Rizky takes it and submits; Ayu's running view
//   L4  a stop: Intan starts and answers one; Admin PINTAR stops PINTAR (the emergency stop, as J12); Intan's, Ayu's
//       and the result page's views while stopped; the stop ended; Intan's view after
//   L5  the late joiner: Joko starts after the stop, with the time left; Ayu's running view and the result page
//   L6  «Minta membaca lagi» sent to Rizky (his only wrong objective)
//   L7  «Ubah jadwal» on 8C's chapter: an end date set
//   L8  «Atur» → «Tambah waktu» on Galih's open Uji Penguasaan
import { APP, dunia, jalan, kerjakan, kunciBab, lewatiTur, pilihBahasa, masukEmail, muatUlang, keluar, ringkas, LEBAR } from "./lib.mjs";

const RAPI = (t) => (t ?? "").replace(/\s+/g, " ").trim();
const hasil = [];

for (const lebar of LEBAR) {
  muatUlang();
  const D = dunia();
  const ayu = D["w10.guru"], rizky = D["w5.murid"], galih = D["w9.murid"], intan = D["w2.murid_pin"], joko = D["w2.murid_reset"];
  const admin = D["pintar.admin1"];
  const K8A = D["smp.kelas8a"], K8C = D["smp.kelas8c"], W3 = D["w3.bab"];
  const kunci = kunciBab(W3.kursus);
  const j = await jalan({ perjalanan: "j5", lebar, zona: "WIB", nama: "Ayu · Rizky · Intan · Joko · Admin PINTAR · (L6) Bambang · Sinta", label: ["L6: bukti OFFICIAL di tenant bootstrap dev/CI (sintetis)"] });
  const { page } = j;
  const isi = async () => RAPI(await page.locator("main").first().innerText().catch(() => ""));
  const pesan = async () => RAPI((await page.locator('[role="alert"], [role="status"]').allInnerTexts().catch(() => [])).join(" | "));
  const tunggu = async () => { await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(800); };
  const ke = async (url) => { await page.goto(`${APP}${url}`).catch(() => {}); await tunggu(); };
  const cepat = () => j.baca(`select coalesce(string_agg(s.status::text || ' ' || p.display_name, '; ' order by p.display_name), 'none')
    from public.assessment_sessions s join public.persons p on p.id = s.person_id
    join public.assessment_definitions d on d.id = s.assessment_definition_id where d.mode = 'QUICK'`);
  let penugasan = null;   // the Uji Cepat's assessment assignment
  const ayuMasuk = async () => { await masukEmail(j, ayu); await lewatiTur(j); };

  /** a learner opens the Uji Cepat from /belajar (or by its assignment), starts it, answers `berapa` (all if null) */
  async function murid(o, rec, foto, data, awalan, berapa, kumpul) {
    await masukEmail(j, o);
    await lewatiTur(j);
    await ke("/belajar");
    await foto(`${awalan}belajar`);
    data(`${awalan}learner_home`, (await isi()).slice(0, 500));
    const t = page.getByRole("link", { name: /Uji Cepat|Quick Assessment/ }).first();
    if (await t.count()) rec.tab += await j.tekan(t, 200);
    else { if (!penugasan) throw new Error("no Uji Cepat on /belajar and no assignment recorded"); await ke(`/belajar/asesmen/${penugasan}`); }
    await tunggu();
    await foto(`${awalan}uji-cepat`);
    data(`${awalan}test_page`, (await isi()).slice(0, 500));
    const mulai = page.getByRole("button", { name: /^(Mulai|Start|Lanjutkan|Continue)/ }).first();
    if (await mulai.count()) { rec.tab += await j.tekan(mulai, 150); await tunggu(); }
    data(`${awalan}answered`, await kerjakan(j, kunci, rec, foto, `${awalan}soal`, /^(Kumpulkan|Submit)/i, {}, kumpul ? null : berapa));
    await foto(`${awalan}akhir`);
    data(`${awalan}end`, (await isi()).slice(0, 400));
    await keluar(j);
  }
  /** Ayu's running view of the Uji Cepat, and its result page */
  async function guruCepat(foto, data, awalan) {
    await ayuMasuk();
    await ke(`/mengajar/${K8A}/uji-cepat`);
    await foto(`${awalan}guru-uji-cepat`);
    data(`${awalan}teacher_running`, (await isi()).slice(0, 600));
    await ke(`/mengajar/${K8A}/uji-cepat/hasil?penugasan=${penugasan}`);
    await foto(`${awalan}guru-hasil`);
    data(`${awalan}teacher_result`, (await isi()).slice(0, 700));
    await keluar(j);
  }

  await j.langkah("L1", "Ayu's first look, then «Siapkan» W3's chapter for 8C («Sampai» left empty)", async ({ rec, foto, data }) => {
    await page.goto(`${APP}/masuk`);
    await pilihBahasa(j);
    await masukEmail(j, ayu);
    await foto("mengajar");
    await lewatiTur(j);
    data("teacher_home", (await isi()).slice(0, 700));
    await ke(`/mengajar/${K8C}`);
    await foto("kelas-8c");
    data("class_8c", (await isi()).slice(0, 700));
    const siap = page.getByRole("link", { name: /^Siapkan|^Prepare/ }).first();
    rec.tab += await j.tekan(siap, 200);
    await tunggu();
    await foto("siapkan-pilih");
    // the chapter: W3's «Persamaan Linear Satu Variabel» (a radio or a link per chapter)
    const bab = page.getByRole("radio", { name: /Persamaan Linear Satu Variabel/ }).first();
    if (await bab.count()) { rec.tab += await j.tabKe(bab, 200); await page.keyboard.press("Space"); }
    else rec.tab += await j.tekan(page.getByRole("link", { name: /Persamaan Linear Satu Variabel/ }).first(), 200);
    const lanjut = page.getByRole("button", { name: /Lanjut|Continue|Tinjau|Review/ }).first();
    if (await lanjut.count()) { rec.tab += await j.tekan(lanjut, 200); await tunggu(); }
    await foto("siapkan-tinjau");
    data("prepare_review", (await isi()).slice(0, 900));
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Sediakan|Make available)/ }).first(), 300);
    await tunggu();
    await foto("siapkan-selesai");
    data("prepared", await pesan());
    data("given_to_8c", j.baca(`select count(*)::text from public.learning_assignments where node_id = '${K8C}' and course_id = '${W3.kursus}'`));
    if (rec.data.given_to_8c === "0") throw new Error("W3's chapter was not given to 8C");
    await keluar(j);
  });

  await j.langkah("L2", "an Uji Cepat for 8A: the chapter, three questions, the window, the review, «Sediakan»", async ({ rec, foto, data }) => {
    await ayuMasuk();
    await ke(`/mengajar/${K8A}/uji-cepat`);
    await foto("cepat-awal");
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Tampilkan soal bab ini|Show this chapter's questions)/ }).first(), 200);
    await tunggu();
    await foto("cepat-pilih");
    const centang = page.locator("input[type=checkbox][name=butir]");
    data("questions_offered", await centang.count());
    for (let i = 0; i < 3 && i < (await centang.count()); i++) { rec.tab += await j.tabKe(centang.nth(i), 200); if (!(await centang.nth(i).isChecked())) await page.keyboard.press("Space"); }
    const menit = page.locator("input[type=radio][name=menit]");
    data("windows_offered", RAPI((await page.locator("input[type=radio][name=menit]").evaluateAll((xs) => xs.map((x) => x.value))).join(",")));
    rec.tab += await j.tabKe(page.locator("input[type=radio][name=menit]:checked").first(), 200);   // a radio group: the checked one is its Tab stop
    for (let i = 0; i < 6 && (await menit.last().isChecked()) === false; i++) await page.keyboard.press("ArrowDown");   // the longest window
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Lanjut ke tinjauan|Continue to review)/ }).first(), 200);
    await tunggu();
    await foto("cepat-tinjau");
    data("review", (await isi()).slice(0, 900));
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Sediakan Uji Cepat sekarang|Make the Quick Assessment available now)/ }).first(), 300);
    await tunggu();
    await foto("cepat-berjalan");
    data("made_available", await pesan());
    penugasan = j.baca(`select aa.id from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
      where d.mode = 'QUICK' and aa.node_id = '${K8A}' order by aa.assigned_at desc limit 1`);
    data("assignment", penugasan ? "recorded" : "(none)");
    if (!penugasan) throw new Error("no Uji Cepat assignment was made");
    await keluar(j);
  });

  await j.langkah("L3", "Rizky takes it and submits; Ayu's running view", async ({ rec, foto, data }) => {
    await murid(rizky, rec, foto, data, "rizky-", null, true);
    data("sittings", cepat());
    await guruCepat(foto, data, "sesudah-rizky-");
  });

  await j.langkah("L4", "a stop while Intan is answering: her, Ayu's and the result page's views; then the stop ended", async ({ rec, foto, data }) => {
    await murid(intan, rec, foto, data, "intan-", 1, false);
    // Admin PINTAR stops PINTAR (the emergency stop, as J12's L4)
    await masukEmail(j, admin);
    const pintu = page.locator("button", { hasText: /Seluruh platform|The whole platform/ }).first();
    if (await pintu.count()) { rec.tab += await j.tekan(pintu, 100); await page.waitForURL((u) => u.pathname !== "/", { timeout: 20000 }).catch(() => {}); }
    await ke("/konfigurasi/pemeliharaan");
    const bentuk = page.locator("form", { has: page.getByRole("button", { name: /Hentikan PINTAR sekarang|Stop PINTAR now/i }) }).first();
    rec.tab += await j.tabKe(bentuk.getByRole("checkbox").first(), 200); await page.keyboard.press("Space");
    rec.tab += await j.ketik(bentuk.getByRole("textbox").first(), "Uji henti darurat (dunia audit J5): gangguan basis data disimulasikan.");
    rec.tab += await j.ketik(bentuk.getByRole("textbox").nth(1), "HENTIKAN SEKARANG");
    rec.tab += await j.tekan(bentuk.getByRole("button", { name: /Hentikan PINTAR sekarang|Stop PINTAR now/i }));
    await tunggu();
    await foto("henti");
    data("stopped", await pesan());
    await keluar(j);
    // while stopped: Intan, Ayu (the running view and the result page)
    await masukEmail(j, intan).catch(() => {});
    await ke(`/belajar/asesmen/${penugasan}`);
    await foto("henti-intan");
    data("stopped_learner", (await isi()).slice(0, 500));
    await keluar(j);
    await guruCepat(foto, data, "henti-");
    data("sittings_stopped", cepat());
    // the stop ended
    await masukEmail(j, admin);
    if (await pintu.count()) { rec.tab += await j.tekan(pintu, 100); await page.waitForURL((u) => u.pathname !== "/", { timeout: 20000 }).catch(() => {}); }
    await ke("/konfigurasi/pemeliharaan");
    const akhiri = /^(Akhiri sekarang|End now)/i;
    rec.tab += await j.tekan(page.getByRole("link", { name: akhiri }).first(), 150);
    const f = page.locator("form", { has: page.getByRole("button", { name: akhiri }) }).first();
    await f.waitFor({ timeout: 30000 });
    rec.tab += await j.ketik(f.getByRole("textbox", { name: /Alasan|Reason/i }), "Sudah aman: basis data pulih (dunia audit J5).", 60);
    rec.tab += await j.tekan(f.getByRole("button", { name: akhiri }), 60);
    await page.waitForTimeout(600);
    if (await page.getByText(/Akhiri jendela pemeliharaan ini sekarang\?|End this maintenance window now\?/i).first().isVisible().catch(() => false)) {
      rec.tab += await j.tekan(page.getByRole("button", { name: akhiri }).last(), 150);
    }
    await tunggu();
    await foto("henti-diakhiri");
    await keluar(j);
    await masukEmail(j, intan);
    await ke(`/belajar/asesmen/${penugasan}`);
    await foto("sesudah-henti-intan");
    data("after_stop_learner", (await isi()).slice(0, 500));
    // signed in again: «Lanjutkan di sini?», then the rest answered and submitted
    const sini = page.getByRole("button", { name: /^(Lanjutkan di sini|Continue here)/ }).first();
    if (await sini.count()) { rec.tab += await j.tekan(sini, 100); await tunggu(); }
    const mulai = page.getByRole("button", { name: /^(Mulai|Start|Lanjutkan|Continue)/ }).first();
    if (await mulai.count()) { rec.tab += await j.tekan(mulai, 150); await tunggu(); }
    data("after_stop_answered", await kerjakan(j, kunci, rec, foto, "intan-lanjut", /^(Kumpulkan|Submit)/i, {}, null));
    await foto("intan-selesai");
    data("sittings_after_stop", cepat());
    await keluar(j);
  });

  await j.langkah("L5", "the late joiner: Joko starts after the stop; Ayu's running view and the result page", async ({ rec, foto, data }) => {
    data("late_join_at", j.baca(`select to_char(now() - aa.opens_at, 'MI:SS') || ' after it opened; closes in ' || to_char(aa.closes_at - now(), 'MI:SS')
      from public.assessment_assignments aa where aa.id = '${penugasan}'`));
    await murid(joko, rec, foto, data, "joko-", null, true);
    data("sittings", cepat());
    await guruCepat(foto, data, "akhir-");
  });

  // L6 needs OFFICIAL evidence (Daisy, dde3c077): on a synthetic school's evidence the product offers no «Minta membaca
  // lagi». So it is walked at the dev/CI bootstrap (OFFICIAL), by J3's 8K teacher Bambang for Sinta (her gate failed),
  // entered from her own page as a teacher would.
  await j.langkah("L6", "«Minta membaca lagi» sent (OFFICIAL evidence: the bootstrap's 8K, Bambang for Sinta)", async ({ rec, foto, data, amati }) => {
    amati("bukti OFFICIAL di tenant bootstrap dev/CI (sintetis): Bambang Sutrisno · Sinta Maharani, 8K");
    const guru8k = D["j3.guru"], sinta = D["j3.murid_resmi"], K8K = D["j3.kelas"];
    await masukEmail(j, guru8k);
    await lewatiTur(j);
    await ke(`/mengajar/${K8K}/murid/${sinta.person}`);
    await foto("sinta");
    const tautan = page.getByRole("link", { name: /Minta membaca lagi|Ask to read again/ }).first();
    data("student_page_offers_it", await tautan.count() > 0);
    rec.tab += await j.tekan(tautan, 200);
    await page.waitForURL((u) => u.pathname.endsWith("/ulang"), { timeout: 30000 });
    await tunggu();
    await foto("minta-membaca");
    data("request_page", (await isi()).slice(0, 900));
    const kotak = page.locator(`input[type=checkbox][name=murid][value="${sinta.person}"]`).first();
    data("sinta_preticked", await kotak.isChecked().catch(() => false));
    if (await kotak.count() && !(await kotak.isChecked())) { rec.tab += await j.tabKe(kotak, 200); await page.keyboard.press("Space"); }
    rec.tab += await j.tekan(page.locator("form.pin-ulang button[type=submit]").first(), 300);
    await tunggu();
    await foto("minta-membaca-terkirim");
    data("sent", await pesan());
    await keluar(j);
    await masukEmail(j, sinta);
    await lewatiTur(j);
    await ke("/belajar");
    await foto("sinta-belajar");
    data("learner_sees", (await isi()).slice(0, 500));
    await keluar(j);
  });

  await j.langkah("L7", "«Ubah jadwal» on 8C's chapter: an end date set", async ({ rec, foto, data }) => {
    await ayuMasuk();
    await ke(`/mengajar/${K8C}`);
    rec.tab += await j.tekan(page.locator("a[data-jadwal-buka]").first(), 200);
    await tunggu();
    await foto("jadwal");
    // «Sampai» (a date-and-time field): its typed segments follow the browser's language (Daisy saw «03/11/22026»), so
    // the value is set in its own ISO form, the same in every language; the field is still reached by Tab
    const sampai = page.locator("#jadwal-sampai");
    rec.tab += await j.tabKe(sampai, 100);
    await sampai.fill("2026-12-31T15:00");
    data("end_date_value", await sampai.inputValue().catch(() => ""));
    rec.tab += await j.ketik(page.locator("#jadwal-alasan"), "Diberi batas akhir sebelum libur semester (dunia audit J5).", 30);
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Simpan jadwal|Save schedule)$/ }).first(), 60);
    await tunggu();
    await foto("jadwal-disimpan");
    data("saved", await pesan());
    data("until", j.baca(`select coalesce(string_agg(coalesce(to_char(la.available_until at time zone 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI'), 'none'), ','), 'none')
      from public.learning_assignments la where la.node_id = '${K8C}' and la.course_id = '${W3.kursus}'`));
    await keluar(j);
  });

  await j.langkah("L8", "«Atur» → «Tambah waktu» on Galih's open Uji Penguasaan", async ({ rec, foto, data }) => {
    await ayuMasuk();
    await ke(`/mengajar/${K8A}/siapa?penugasan=${W3.up}`);
    rec.tab += await j.tekan(page.getByRole("link", { name: new RegExp(`^(Atur|Manage)\\s*·\\s*${galih.nama}`) }).first(), 200);
    await tunggu();
    await foto("atur");
    const waktu = page.locator("form[data-atur-tindakan=waktu]").first();
    await waktu.waitFor({ timeout: 20000 });
    data("add_time_panel", RAPI(await waktu.innerText().catch(() => "(no «Tambah waktu»)")).slice(0, 400));
    rec.tab += await j.tabKe(waktu.locator("select[name=menit]"), 200);
    await page.keyboard.press("ArrowDown");   // 10 minutes
    rec.tab += await j.ketik(waktu.locator("textarea").first(), "Galih terlambat karena gangguan jaringan (dunia audit J5).", 30);
    const buka = waktu.locator("button[data-bahaya-buka]:visible").first();
    rec.tab += await j.tekan(buka, 30);
    const tanya = waktu.locator("[data-bahaya-tanya]:visible").first();
    await tanya.waitFor({ timeout: 10000 });
    await foto("atur-tanya");
    data("question", RAPI(await tanya.innerText()));
    // the focus opens on «Batal»; the confirming button is before it
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Enter");
    await tunggu();
    await foto("atur-waktu-ditambah");
    data("added", await pesan());
    data("deadline", j.baca(`select to_char(authoritative_deadline at time zone 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI') from public.assessment_sessions where id = '${D["w9.sesi"]}'`));
    await keluar(j);
  });

  hasil.push(await j.selesai());
}
process.exit(ringkas("j5", hasil));
