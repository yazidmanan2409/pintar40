// J6 · Authoring with AI drafts (Daisy's script, J6; her notes AUDIT-79-TEMUAN-J6.md at 6a50d36f). World: W12, the
// 8A teacher Dimas with the draft package «Perbandingan dan Skala» at Cendekia (AI entitled; the LOCAL STAND-IN,
// «penyedia lokal (stand-in), bukan penyedia AI nyata», answering only under PINTAR_AI_STUB_HARNESS=1; its allowance
// set for one 2-question lesson-text request), the school admin Yohana... (Cendekia's: smp.admin) as the second person,
// and W13 (Melati's 4A teacher, not entitled). No real provider is called, ever. A harness: it records, it does not judge.
//
//   node audit/perjalanan/j6.mjs      (the app on APP_URL with PINTAR_AI_STUB_HARNESS=1; it LOADS THE WORLD ITSELF)
//
// Keyboard only:
//   L1  the AI form: target lesson, «Teks pelajaran tujuan», 2 questions, the rights statement → the drafts (admitted)
//   L2  one draft accepted (is anything said?), one deleted (its confirmation)
//   L3  a pasted source naming a learner: refused before anything leaves PINTAR; what is kept (the text, the tick)
//   L4  a stale form: the form open, an objective moved by another author (fixture w12-tujuan-lain), then sent:
//       AI_TUJUAN_LAIN
//   L5  the provider ceiling: the platform stop set (fixture w12-plafon, the local world only), a request refused
//       AI_PLAFON, the stop reset (w12-plafon-lepas)
//   L6  the allowance used up: the same request as L1, refused AI_JATAH_HABIS
//   L7  «Tandai sudah tersusun» held while an AI draft waits; the last draft decided; then marked
//   L8  L-124: «Tandai lolos pemeriksaan» pressed before any content check has run; then «Periksa isi sekarang»
//   L9  «already passed the check»: an AI request on the package now marked as passed: refused
//   L10 «Ajukan untuk ditinjau»: the author's view; the second person's Studio count, the package, «Setujui isi»
//   L11 W13: Melati's 4A teacher sees no AI button or word
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { APP, dunia, jalan, lewatiTur, pilihBahasa, masukEmail, muatUlang, keluar, ringkas, LEBAR } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const LABEL = ["penyedia AI: penyedia lokal (stand-in), bukan penyedia AI nyata",
  "keadaan fiksasi di L4 (tujuan pembelajaran dipindah saat formulir terbuka) dan L5 (plafon platform dihentikan, lalu dilepas; dunia lokal)"];
const RAPI = (t) => (t ?? "").replace(/\s+/g, " ").trim();

function fiksasi(nama) {
  try { execFileSync(join(HERE, "..", "dunia", "muat.sh"), ["--fiksasi", nama], { stdio: "pipe", encoding: "utf8" }); }
  catch (e) { throw new Error(`fixture ${nama} failed: ${String(e.stderr ?? e.message).split("\n").filter((l) => /ERROR|REFUSED/.test(l)).join(" | ").slice(0, 400)}`); }
}

const hasil = [];
for (const lebar of LEBAR) {
  muatUlang();
  const D = dunia();
  const dimas = D["smp.guru8a"], kedua = D["smp.admin"], guru4a = D["sd.guru4a"];
  const kursus = D["w12.paket"].kursus, kursus13 = D["w13.paket"].kursus;
  const j = await jalan({ perjalanan: "j6", lebar, zona: "WIB", nama: "Dimas · Admin sekolah Cendekia · Guru 4A Melati", label: LABEL });
  const { page } = j;
  const isi = async () => RAPI(await page.locator("main").first().innerText().catch(() => ""));
  const pesan = async () => RAPI((await page.locator('[role="alert"], [role="status"]').allInnerTexts().catch(() => [])).join(" | "));
  const tunggu = async () => { await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(800); };
  const paket = async (p = 1) => { await page.goto(`${APP}/studio/paket/${encodeURIComponent(kursus)}?pelajaran=${p}`).catch(() => {}); await tunggu(); };
  const permintaan = () => j.baca(`select coalesce(string_agg(coalesce(hasil, '(none)') || ' len ' || coalesce(panjang_karakter::text, '-'), '; ' order by created_at), 'none') from public.ai_permintaan`);
  // an AI draft is an item with an AI origin (ai_asal_soal) and, once decided, an acceptance (ai_penerimaan); a deleted
  // draft's item is gone
  const draf = () => j.baca(`select count(*) filter (where p.id is null)::text || ' waiting, ' || count(*) filter (where p.id is not null)::text || ' accepted, ' || count(*)::text || ' from AI in the package'
    from public.ai_asal_soal a join public.items i on i.id = a.item_id join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
    left join public.ai_penerimaan p on p.item_id = a.item_id where m.course_id = '${kursus}'`);
  const keadaanPaket = () => j.baca(`select status::text from public.courses where id = '${kursus}'`);

  /** the AI form opened, the source chosen, the count set, the rights ticked; returns without sending */
  async function bukaForm(rec, sumber, teks) {
    const buka = page.locator("button[data-draf-ai]").first();
    if (await buka.count()) rec.tab += await j.tekan(buka, 300);
    await page.getByRole("button", { name: /^(Buat draf|Create drafts)$/ }).first().waitFor({ timeout: 20000 });
    const r = page.getByRole("radio", { name: sumber === "tempel" ? /Teks yang saya tempel|Text I paste/ : /Teks pelajaran tujuan|The target lesson's text/ }).first();
    rec.tab += await j.tabKe(page.locator("input[type=radio][name=sumber]:checked").first(), 200);
    for (let i = 0; i < 3 && !(await r.isChecked()); i++) await page.keyboard.press("ArrowDown");
    if (teks) rec.tab += await j.ketik(page.locator("textarea").first(), teks, 40);
    const jumlah = page.locator("input[type=number]").first();
    rec.tab += await j.tabKe(jumlah, 60);
    await page.keyboard.press("ControlOrMeta+a"); await page.keyboard.type("2");
    const hak = page.locator("input[type=checkbox][aria-describedby=draf-ai-hak-arti]").first();
    if (!(await hak.isChecked())) { rec.tab += await j.tabKe(hak, 60); await page.keyboard.press("Space"); }
  }
  async function kirim(rec) {
    const tunggal = page.waitForResponse((r) => r.url().includes("/api/draf-ai"), { timeout: 60000 }).catch(() => null);
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Buat draf|Create drafts)$/ }).first(), 40);
    const r = await tunggal;
    await page.waitForTimeout(1200);
    return `${r ? r.status() : "(no response)"} ${r ? JSON.stringify(await r.json().catch(() => null)).replace(/"items":\[[^\]]*\]/, '"items":[…]').slice(0, 120) : ""}`;
  }

  await j.langkah("L1", "the AI form → the drafts (a lesson-text request of 2, admitted)", async ({ rec, foto, data }) => {
    await page.goto(`${APP}/masuk`);
    await pilihBahasa(j);
    await masukEmail(j, dimas);
    await lewatiTur(j);
    await paket(1);
    await foto("paket");
    data("package_head", (await isi()).slice(0, 500));
    await bukaForm(rec, "pelajaran");
    await foto("formulir");
    data("form", RAPI(await page.locator("form", { has: page.getByRole("button", { name: /^(Buat draf|Create drafts)$/ }) }).first().innerText()).slice(0, 700));
    data("response", await kirim(rec));
    await tunggu();
    await foto("draf");
    data("result_line", await pesan());
    data("requests", permintaan());
    data("drafts", draf());
    if (!/DRAFTED/.test(rec.data.requests)) throw new Error(`the first request was not drafted (${rec.data.requests})`);
  });

  await j.langkah("L2", "one draft accepted, one deleted (its confirmation)", async ({ rec, foto, data }) => {
    const terima = page.getByRole("button", { name: /^(Terima|Accept)\b/ }).first();
    rec.tab += await j.tekan(terima, 400);
    await tunggu();
    await foto("diterima");
    data("after_accept", await pesan() || "(no status line)");
    const hapus = page.locator("button[data-bahaya-buka]", { hasText: /^(Hapus|Delete)/ }).first();
    rec.tab += await j.tekan(hapus, 400);
    const tanya = page.locator("[data-bahaya-tanya]").first();
    await tanya.waitFor({ timeout: 10000 });
    await foto("hapus-tanya");
    data("delete_question", RAPI(await tanya.innerText()));
    await page.keyboard.press("Shift+Tab");   // the focus opens on «Batal»; the red button is before it
    await page.keyboard.press("Enter");
    await tunggu();
    await foto("dihapus");
    data("after_delete", await pesan());
    data("drafts", draf());
  });

  await j.langkah("L3", "a pasted source naming a learner: refused before anything leaves PINTAR", async ({ rec, foto, data }) => {
    await paket(1);
    await bukaForm(rec, "tempel", "Rizky Ramadhan membeli 3 buku seharga Rp24.000. Berapa harga 5 buku dengan perbandingan senilai?");
    data("response", await kirim(rec));
    await foto("data-murid");
    data("refusal", await pesan());
    data("text_kept", (await page.locator("textarea").first().inputValue().catch(() => "")).length > 0);
    data("rights_tick_kept", await page.locator("input[type=checkbox][aria-describedby=draf-ai-hak-arti]").first().isChecked().catch(() => false));
    data("requests", permintaan());
  });

  await j.langkah("L4", "a stale form: an objective moved while the form is open (fixture), then sent", async ({ rec, foto, data }) => {
    await paket(1);
    await bukaForm(rec, "pelajaran");
    await foto("formulir-terbuka");
    fiksasi("w12-tujuan-lain");
    data("response", await kirim(rec));
    await foto("tujuan-lain");
    data("refusal", await pesan());
    data("requests", permintaan());
  });

  await j.langkah("L5", "the provider ceiling (fixture: the platform stop set, then reset, in the local world)", async ({ rec, foto, data }) => {
    fiksasi("w12-plafon");
    try {
      await paket(2);
      await bukaForm(rec, "pelajaran");
      data("response", await kirim(rec));
      await foto("plafon");
      data("refusal", await pesan());
      data("requests", permintaan());
    } finally { fiksasi("w12-plafon-lepas"); }
  });

  await j.langkah("L6", "the allowance used up: the same request as L1", async ({ rec, foto, data }) => {
    await paket(1);
    await bukaForm(rec, "pelajaran");
    data("response", await kirim(rec));
    await foto("jatah-habis");
    data("refusal", await pesan());
    data("requests", permintaan());
  });

  await j.langkah("L7", "«Tandai sudah tersusun» held while an AI draft waits; the last decided; then marked", async ({ rec, foto, data }) => {
    await paket(1);
    const ditahan = page.locator("button[aria-describedby=lt-ai-belum]").first();
    data("held", await ditahan.count() ? `${RAPI(await ditahan.innerText())} (disabled) · ${RAPI(await page.locator("#lt-ai-belum").innerText().catch(() => ""))}` : "(not held)");
    await ditahan.scrollIntoViewIfNeeded().catch(() => {});
    await foto("tersusun-ditahan");
    for (let n = 0; n < 6; n++) {
      const terima = page.getByRole("button", { name: /^(Terima|Accept)\b/ }).first();
      if (!(await terima.count())) break;
      rec.tab += await j.tekan(terima, 400);
      await tunggu();
    }
    data("drafts", draf());
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Tandai sudah tersusun|Mark as put together)$/ }).first(), 600);
    await tunggu();
    await foto("tersusun");
    data("marked", await pesan());
    data("package", keadaanPaket());
  });

  await j.langkah("L8", "L-124: «Tandai lolos pemeriksaan» before any check has run; then «Periksa isi sekarang»", async ({ rec, foto, data }) => {
    await paket(1);
    data("findings_before", RAPI(await page.locator("h2", { hasText: /Temuan|Findings/ }).locator("xpath=..").innerText().catch(() => "")).slice(0, 300));
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Tandai lolos pemeriksaan|Mark the check as passed)$/ }).first(), 600);
    await tunggu();
    await foto("lolos-tanpa-periksa");
    data("marked_passed", await pesan());
    data("package_after_mark", keadaanPaket());
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Periksa isi sekarang|Check the content now)$/ }).first(), 600);
    await tunggu();
    await foto("periksa-sesudahnya");
    data("check_after", RAPI(await page.locator("h2", { hasText: /Temuan|Findings/ }).locator("xpath=..").innerText().catch(() => "")).slice(0, 600));
    data("package_after_check", keadaanPaket());
  });

  await j.langkah("L9", "«already passed the check»: an AI request on the package marked as passed", async ({ rec, foto, data }) => {
    await paket(1);
    const buka = page.locator("button[data-draf-ai]").first();
    data("ai_button_offered", await buka.count() > 0);
    if (await buka.count()) {
      await bukaForm(rec, "pelajaran");
      data("response", await kirim(rec));
      await foto("sudah-lolos");
      data("refusal", await pesan());
    } else await foto("sudah-lolos-tanpa-tombol");
    data("requests", permintaan());
  });

  await j.langkah("L10", "«Ajukan untuk ditinjau»; the second person's count, the package, «Setujui isi»", async ({ rec, foto, data }) => {
    await paket(1);
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Ajukan untuk ditinjau|Send for review)$/ }).first(), 600);
    await tunggu();
    await foto("diajukan");
    data("submitted", await pesan());
    data("author_after", RAPI(await page.getByText(/bukan wewenang Anda|not yours to take/).first().locator("xpath=..").innerText().catch(() => "(no line)")).slice(0, 300));
    await keluar(j);
    await masukEmail(j, kedua);
    const pintu = page.locator("button, a", { hasText: /Studio|Saya mengelola sekolah|I run the school/ }).first();
    if (/Mau ke mana hari ini|Where would you like to go today/.test(await isi()) && await pintu.count()) { rec.tab += await j.tekan(pintu, 100); await page.waitForURL((u) => u.pathname !== "/", { timeout: 20000 }).catch(() => {}); }
    await lewatiTur(j);
    await page.goto(`${APP}/studio`).catch(() => {}); await tunggu();
    await foto("kedua-studio");
    data("second_studio", (await isi()).slice(0, 500));
    await paket(1);
    await foto("kedua-paket");
    data("second_package_head", (await isi()).slice(0, 500));
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Setujui isi|Approve the content)$/ }).first(), 600);
    await tunggu();
    await foto("disetujui");
    data("approved", await pesan());
    data("package", keadaanPaket());
    await keluar(j);
  });

  await j.langkah("L11", "W13: Melati's 4A teacher sees no AI button or word", async ({ foto, data }) => {
    await masukEmail(j, guru4a);
    await lewatiTur(j);
    await page.goto(`${APP}/studio/paket/${encodeURIComponent(kursus13)}`).catch(() => {}); await tunggu();
    await foto("w13");
    const t = await isi();
    data("ai_button", await page.locator("button[data-draf-ai]").count());
    data("ai_words", (t.match(/[^.]{0,60}\b(AI)\b[^.]{0,60}/g) ?? []).slice(0, 3));
    await keluar(j);
  });

  hasil.push(await j.selesai());
}
process.exit(ringkas("j6", hasil));
