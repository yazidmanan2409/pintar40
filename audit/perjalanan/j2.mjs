// J2 · One chapter, start to certificate (Daisy's script, J2; on main 429b7dcc with D2-R). World: J2's own copy of W3's
// chapter in the dev/CI bootstrap tenant (audit/dunia/13-j2-j3.sql): Hana Wirawan (j2.murid_resmi), class 8J, nothing
// sat. A harness: it records, it does not judge. Captures labelled «bukti OFFICIAL di tenant bootstrap dev/CI (sintetis)».
//
//   node audit/perjalanan/j2.mjs      (the app on APP_URL; it LOADS THE WORLD ITSELF before each walk: it changes it)
//
// Keyboard only. Hana answers as a learner who has studied: every question right, by the chapter's own key (read from
// the database by the question's text, since the order is shuffled per sitting).
//   L1 Pemetaan Awal · L2 the Peta Bacaan · L3 a lesson, with its stepwise help · L4 the Uji Penguasaan offered (D2-R's
//   advisory line) · L5 the test (no help: posttest.tanpa_bantuan) · L6 the result («Lulus.», counts secondary, nothing
//   per question) · L7 the certificate («Sertifikat», no predicate) · L8 the public check (signed out)
// The branches (AUDIT_CABANG=1; 1280, ID; each on a fresh world):
//   «pelajaran-dan-pilihan» Hana: a lesson left halfway (signed out on its second page), then resumed from /belajar;
//                           then the Uji Penguasaan with ONE multi-answer question partly chosen (one of its two)
//   «w4»   Hana at Cendekia (j2.murid): W4's result with no verdict, the chapter given before a pass mark (labelled
//          «keadaan warisan (dibuat melewati penjaga hari ini)»)
//   «w5»   Rizky (w5.murid): W3's result with the thin-evidence objective below («Baca lagi juga:» and its note)
import { APP, baca, dunia, jalan, pilihBahasa, ringkas, masukEmail, muatUlang, BAHASA, LEBAR } from "./lib.mjs";


/** Answer every question of the sitting on screen by the key (or `ganti`, stem → the options chosen instead), by keyboard;
 *  then finish it. Returns the counts. */
async function kerjakan(j, kunci, rec, foto, awalan, selesai, ganti = {}) {
  const { page } = j;
  const artikel = page.locator("main article").first();
  let n = 0, bantuan = [];
  for (; n < 20; n++) {
    await artikel.getByRole("heading").first().waitFor({ timeout: 30000 });
    const stem = (await artikel.getByRole("heading").first().innerText()).trim();
    const benar = ganti[stem] ?? kunci[stem];
    if (!benar) throw new Error(`no key for the question «${stem.slice(0, 60)}»`);
    if (n === 0) await foto(`${awalan}-soal-1`);
    if (await page.getByRole("button", { name: /Perlu petunjuk|Need a hint/i }).count()) bantuan.push(n + 1);
    for (const body of benar) {
      const opsi = artikel.getByRole("button", { name: new RegExp(`^[A-F]\\s+${body.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) }).first();
      rec.tab += await j.tekan(opsi, 60);
      await page.waitForFunction((el) => el.getAttribute("aria-pressed") === "true", await opsi.elementHandle(), { timeout: 15000 });
    }
    // the Uji Penguasaan keeps an answer only by «Simpan jawaban ini» (the Pemetaan Awal saves on choosing)
    const simpan = page.getByRole("button", { name: /^(Simpan jawaban ini|Save this answer)$/i }).first();
    if (await simpan.isVisible().catch(() => false)) { rec.tab += await j.tekan(simpan, 60); await page.waitForLoadState("networkidle").catch(() => {}); }
    await page.waitForTimeout(600);   // the answer's save (the page says when one is not yet saved)
    const lanjut = page.getByRole("button", { name: /^(Berikutnya|Next)$/i }).first();
    if (await lanjut.isEnabled().catch(() => false)) { rec.tab += await j.tekan(lanjut, 60); continue; }
    break;
  }
  await foto(`${awalan}-soal-terakhir`);
  rec.tab += await j.tekan(page.getByRole("button", { name: selesai }).first(), 60);
  await page.waitForTimeout(1500);
  // a confirmation asked inline («Kumpulkan sekarang? …») or in a dialog: its words recorded, then confirmed
  const tanya = page.locator("main div, [role=dialog], [role=alertdialog]").filter({ hasText: /sekarang\?|now\?/i })
    .filter({ has: page.getByRole("button", { name: selesai }) }).last();
  if (await tanya.isVisible().catch(() => false)) {
    await foto(`${awalan}-konfirmasi`);
    rec.data[`${awalan}_confirm_words`] = (await tanya.innerText()).replace(/\s+/g, " ").slice(0, 300);
    rec.tab += await j.tekan(tanya.getByRole("button", { name: selesai }).first(), 60);
  }
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
  return { soal: n + 1, bantuan_ditawarkan_di: bantuan };
}


const CABANG = process.env.AUDIT_CABANG === "1";
const LABEL = ["bukti OFFICIAL di tenant bootstrap dev/CI (sintetis)"];
const hasil = [];
if (CABANG) process.exit(await cabang());

for (const lebar of LEBAR) {
  muatUlang();
  const D = dunia();
  const hana = D["j2.murid_resmi"];
  const bab = D["j2.bab"];
  const T = bab.tugas;
  // the chapter's key: question text → the correct options' text
  const kunci = JSON.parse(baca(`select coalesce(json_object_agg(i.stem, (select json_agg(o.body) from public.item_options o where o.item_id = i.id and o.is_correct)), '{}')
    from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id = '${bab.kursus}'`));
  const j = await jalan({ perjalanan: "j2", lebar, zona: "WIB", nama: hana.nama, label: LABEL });
  const { page } = j;
  const teks = async () => (await page.locator("main").innerText().catch(() => "")).replace(/\s+/g, " ").trim();
  const sesi = (mode) => j.baca(`select coalesce(string_agg(s.status::text, ','), 'none') from public.assessment_sessions s
    join public.assessment_definitions d on d.id = s.assessment_definition_id where s.person_id = '${hana.person}' and d.mode = '${mode}'`);

  await j.langkah("L1", "the Pemetaan Awal", async ({ rec, foto, data }) => {
    await page.goto(`${APP}/masuk`);
    await pilihBahasa(j);
    data("signed_in", await masukEmail(j, hana));
    if (!new URL(page.url()).pathname.startsWith("/belajar")) await page.goto(`${APP}/belajar`);
    await foto("belajar");
    rec.tab += await j.tekan(page.getByRole("link", { name: /Mulai Pemetaan Awal|Start the/i }).first());
    await page.getByRole("button", { name: /Mulai Pemetaan Awal|Start/i }).first().waitFor({ timeout: 30000 });
    await foto("pemetaan-awal");
    rec.tab += await j.tekan(page.getByRole("button", { name: /Mulai Pemetaan Awal|Start/i }).first());
    data("answered", await kerjakan(j, kunci, rec, foto, "pa", /^(Selesaikan pemetaan|Finish)/i));
    await foto("pa-selesai");
    data("sitting", sesi("PRE_TEST"));
    data("landed", new URL(page.url()).pathname);
    if (!/SUBMITTED|FINALIZED/.test(rec.data.sitting)) throw new Error(`the Pemetaan Awal did not finish (${rec.data.sitting})`);
  });

  await j.langkah("L2", "the Peta Bacaan", async ({ foto, data }) => {
    await page.goto(`${APP}/belajar/${T}/peta`);
    await foto("peta-bacaan");
    const t = await teks();
    data("has_sudah_kuat", /Sudah kuat|Already strong/i.test(t));
    data("text", t.slice(0, 700));
  });

  await j.langkah("L3", "a lesson, with its stepwise help", async ({ rec, foto, data }) => {
    // from the Peta Bacaan: «Buka pelajarannya» opens the first card's lesson
    rec.tab += await j.tekan(page.getByRole("link", { name: /Buka pelajarannya|Open the lesson/i }).first(), 120);
    await page.waitForURL((u) => /\/pelajaran\//.test(u.pathname), { timeout: 30000 });
    await foto("pelajaran");
    data("lesson_url", new URL(page.url()).pathname.replace(/[0-9a-f-]{36}/g, "<id>"));
    const kontrol = (await page.locator("main").getByRole("button").allInnerTexts()).map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean);
    data("lesson_buttons", kontrol.slice(0, 12));
    const bantu = page.locator("main").getByRole("button", { name: /petunjuk|langkah|bantuan|contoh|hint|step|example/i }).first();
    if (await bantu.count()) {
      rec.tab += await j.tekan(bantu, 150); await page.waitForTimeout(800); await foto("pelajaran-bantuan");
      data("help_opened", (await bantu.innerText()).trim());
    } else data("help_opened", "(no help control on the lesson page)");
  });

  await j.langkah("L4", "the Uji Penguasaan offered (D2-R's advisory line)", async ({ foto, data }) => {
    await page.goto(`${APP}/belajar/${T}/penguasaan`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await foto("uji-penguasaan");
    data("text", (await teks()).slice(0, 900));
  });

  await j.langkah("L5", "the test (no help)", async ({ rec, foto, data }) => {
    const mulai = page.getByRole("button", { name: /^(Mulai|Start)/i }).first();
    rec.tab += await j.tekan(mulai, 120);
    const r = await kerjakan(j, kunci, rec, foto, "up", /^(Selesaikan|Kumpulkan|Finish|Submit)/i);
    data("answered", r);
    data("help_offered_on", r.bantuan_ditawarkan_di);
    data("sitting", sesi("POST_TEST"));
    if (!/SUBMITTED|FINALIZED/.test(rec.data.sitting)) throw new Error(`the Uji Penguasaan did not finish (${rec.data.sitting})`);
  });

  await j.langkah("L6", "the result", async ({ foto, data }) => {
    if (!new URL(page.url()).pathname.endsWith("/hasil")) await page.goto(`${APP}/belajar/${T}/hasil`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await foto("hasil");
    const t = await teks();
    data("verdict", (t.match(/Belum lulus\.|Lulus\.|Not passed yet\.|Passed\./) ?? ["(none)"])[0]);
    data("text", t.slice(0, 900));
    data("result_row", j.baca(`select r.mastery || ' gate ' || coalesce(r.safety_gate_passed::text, 'null') from public.assessment_results r
      join public.assessment_sessions s on s.id = r.session_id join public.assessment_definitions d on d.id = s.assessment_definition_id
      where s.person_id = '${hana.person}' and d.mode = 'POST_TEST' and r.supersedes_result_id is null`));
  });

  let tautanPublik = null;
  await j.langkah("L7", "the certificate", async ({ rec, foto, data }) => {
    await page.goto(`${APP}/belajar/${T}/sertifikat`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);
    await foto("sertifikat");
    const t = await teks();
    data("text", t.slice(0, 900));
    data("certificate", j.baca(`select coalesce(string_agg(c.status::text, ','), 'none') from public.certificates c
      join public.assessment_sessions s on s.id = c.session_id where s.person_id = '${hana.person}'`));
    const pub = page.locator('a[href*="/verifikasi"], a[href*="/v/"]').first();
    if (await pub.count()) tautanPublik = await pub.getAttribute("href");
    data("public_link", tautanPublik);
  });

  await j.langkah("L8", "the public check (signed out)", async ({ data, amati }) => {
    if (!tautanPublik) {
      const tok = j.baca(`select c.verification_token from public.certificates c join public.assessment_sessions s on s.id = c.session_id
        where s.person_id = '${hana.person}' order by c.issued_at desc limit 1`);
      if (!tok) throw new Error("no certificate to check");
      tautanPublik = `/verifikasi/${tok}`;
      amati("the certificate page offered no public link; the check is opened by the certificate's own token");
    }
    const browser = page.context().browser();
    const ctx = await browser.newContext({ viewport: { width: lebar, height: 900 }, locale: BAHASA === "en" ? "en-GB" : "id-ID" });
    const p = await ctx.newPage();
    await p.goto(new URL(tautanPublik, APP).toString());
    await p.waitForLoadState("networkidle").catch(() => {});
    await p.screenshot({ path: `${j.out}/periksa-publik.png`, fullPage: true });
    const t = ((await p.locator("body").innerText()) ?? "").replace(/\s+/g, " ");
    data("public_text", t.slice(0, 700));
    data("public_says_lulus", /\bLulus\b|\bPassed\b/.test(t));
    data("public_shows_name", t.includes(hana.nama));
    await ctx.close();
    amati("last screen: the public check (/verifikasi/<token>)");
  });

  hasil.push(await j.selesai());
}
process.exit(ringkas("j2", hasil));

async function cabang() {
  const hasilC = [];
  // «pelajaran-dan-pilihan»
  {
    muatUlang();
    const D = dunia();
    const hana = D["j2.murid_resmi"], bab = D["j2.bab"], T = bab.tugas;
    const kunci = JSON.parse(baca(`select coalesce(json_object_agg(i.stem, (select json_agg(o.body) from public.item_options o where o.item_id = i.id and o.is_correct)), '{}')
      from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id = '${bab.kursus}'`));
    const multi = "Pilih SEMUA yang merupakan persamaan linear satu variabel.";
    const j = await jalan({ perjalanan: "j2-cabang-pelajaran-dan-pilihan", lebar: 1280, zona: "WIB", nama: hana.nama, label: LABEL });
    const { page } = j;
    await j.langkah("C1.1", "the Pemetaan Awal, then a lesson left halfway (its second page), signed out", async ({ rec, foto, data }) => {
      await page.goto(`${APP}/masuk`);
      await masukEmail(j, hana);
      await page.goto(`${APP}/belajar/${T}/pemetaan`);
      rec.tab += await j.tekan(page.getByRole("button", { name: /Mulai Pemetaan Awal|Start/i }).first());
      await kerjakan(j, kunci, rec, foto, "pa", /^(Selesaikan pemetaan|Finish)/i);
      await page.goto(`${APP}/belajar/${T}/peta`);
      rec.tab += await j.tekan(page.getByRole("link", { name: /Buka pelajarannya|Open the lesson/i }).first(), 120);
      await page.waitForURL((u) => /\/pelajaran\//.test(u.pathname), { timeout: 30000 });
      const lanjut = page.getByRole("button", { name: /Halaman berikutnya|Next page/i }).first();
      if (await lanjut.isEnabled().catch(() => false)) { rec.tab += await j.tekan(lanjut, 120); await page.waitForTimeout(800); }
      await foto("pelajaran-separuh");
      data("left_at", (await page.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 200));
      await keluarSaja(j);
    });
    await j.langkah("C1.2", "signed in again: where /belajar resumes it", async ({ rec, foto, data }) => {
      await masukEmail(j, hana);
      if (!new URL(page.url()).pathname.startsWith("/belajar")) await page.goto(`${APP}/belajar`);
      await foto("belajar-lagi");
      const lanjut = page.locator(`main a[href*="/belajar/${T}"]`).first();
      data("resume_link", ((await lanjut.innerText().catch(() => "")) || "").trim() + " → " + ((await lanjut.getAttribute("href").catch(() => "")) || "").replace(/[0-9a-f-]{36}/g, "<id>"));
      rec.tab += await j.tekan(lanjut, 120);
      await page.waitForURL((u) => /\/pelajaran\//.test(u.pathname), { timeout: 30000 }).catch(() => {});
      // how long the resumed lesson shows its loading screen («Memuat halaman…»), measured (up to 60 s)
      const t0 = Date.now();
      const dimuat = await page.waitForFunction(() => !/Memuat halaman|Loading the page/i.test(document.body.innerText)
        && document.querySelector("main h1, main h2"), null, { timeout: 60000 }).then(() => true, () => false);
      data("loading_seconds", dimuat ? Math.round((Date.now() - t0) / 100) / 10 : ">60 (still «Memuat halaman…»)");
      await foto("dilanjutkan");
      data("resumed_at", new URL(page.url()).pathname.replace(/[0-9a-f-]{36}/g, "<id>"));
      data("resumed_text", (await page.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 200));
    });
    await j.langkah("C2", "the Uji Penguasaan with one multi-answer question partly chosen", async ({ rec, foto, data }) => {
      await page.goto(`${APP}/belajar/${T}/penguasaan`);
      rec.tab += await j.tekan(page.getByRole("button", { name: /^(Mulai|Start)/i }).first(), 120);
      const satu = [kunci[multi][0]];
      data("partly_chosen", { question: multi, chosen: satu, correct: kunci[multi] });
      data("answered", await kerjakan(j, kunci, rec, foto, "up", /^(Selesaikan|Kumpulkan|Finish|Submit)/i, { [multi]: satu }));
      if (!new URL(page.url()).pathname.endsWith("/hasil")) await page.goto(`${APP}/belajar/${T}/hasil`);
      await foto("hasil-sebagian");
      const t = (await page.locator("main").innerText()).replace(/\s+/g, " ");
      data("verdict", (t.match(/Belum lulus\.|Lulus\.|Not passed yet\.|Passed\./) ?? ["(none)"])[0]);
      data("text", t.slice(0, 600));
      data("result_row", j.baca(`select r.mastery || ' gate ' || coalesce(r.safety_gate_passed::text, 'null') from public.assessment_results r
        join public.assessment_sessions s on s.id = r.session_id join public.assessment_definitions d on d.id = s.assessment_definition_id
        where s.person_id = '${hana.person}' and d.mode = 'POST_TEST' and r.supersedes_result_id is null`));
    });
    hasilC.push(await j.selesai());
  }
  // «w4» and «w5»: results that already exist, opened by their learners
  for (const [nama, kMurid, kBab, label] of [
    ["w4", "j2.murid", "w4.bab", ["keadaan warisan (dibuat melewati penjaga hari ini)"]],
    ["w5", "w5.murid", "w3.bab", []]]) {
    muatUlang();
    const D = dunia();
    const m = D[kMurid], T = D[kBab].tugas;
    const j = await jalan({ perjalanan: `j2-cabang-${nama}`, lebar: 1280, zona: "WIB", nama: m.nama, label });
    const { page } = j;
    await j.langkah("C1", nama === "w4" ? "the result before a pass mark exists (no verdict)" : "thin evidence on one objective («Baca lagi juga:»)", async ({ foto, data, amati }) => {
      await page.goto(`${APP}/masuk`);
      await masukEmail(j, m);
      await page.goto(`${APP}/belajar/${T}/hasil`);
      await page.waitForLoadState("networkidle").catch(() => {});
      await foto("hasil");
      const t = (await page.locator("main").innerText()).replace(/\s+/g, " ");
      data("verdict", (t.match(/Belum lulus\.|Lulus\.|Not passed yet\.|Passed\./) ?? ["(none)"])[0]);
      data("baca_lagi", (t.match(/Baca lagi( juga)?:[^.]*\.[^.]*\.[^.]*\./) ?? ["(not shown)"])[0]);
      data("text", t.slice(0, 900));
      amati(`last screen: ${new URL(page.url()).pathname.replace(/[0-9a-f-]{36}/g, "<id>")}`);
    });
    hasilC.push(await j.selesai());
  }
  return ringkas("j2-cabang", hasilC);
}

/** Sign out by the session strip's «Keluar». */
async function keluarSaja(j) {
  await j.tekan(j.page.locator("button.pin-sesi-keluar").first(), 150);
  await j.page.waitForURL((u) => !u.pathname.startsWith("/belajar"), { timeout: 30000 });
}
