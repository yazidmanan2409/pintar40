// J7 · A key correction after results exist (Daisy's script, J7). World: W14 in the dev/CI bootstrap tenant (11-w14.sql),
// «Berapakah 7 × 8?» keyed 54 (A), truly 56 (B). Ratih (100 → 83 %, still passes), Bayu (83 → 100 %), Citra (67 → 50 %,
// below the 60 mark). Ratih's and Citra's certificates are issued THROUGH THE PRODUCT (audit/dunia/terbitkan.mjs) after
// each load. A harness: it records, it does not judge.
//
//   CERT_SECRET_KEY_V1=<CI's synthetic key> node audit/perjalanan/j7.mjs   (the app on APP_URL, started with that key;
//                                                                         it LOADS THE WORLD ITSELF before each walk)
//
// People on one browser in turn (each signs out before the next), keyboard only:
//   L1 the school admin Yohana proposes the correction: «Kunci jawaban keliru?» → the three steps → «Kirim untuk konfirmasi»
//   L2 the head of department Made: Studio's home, /pimpinan, the queue, then the correction page → «Konfirmasi perbaikan»
//   L3 the three learners after the recalculation: the result page, the certificate page (Ratih, Citra) and its printed
//      copy (print media, saved as PDF), and the public check
//   L4 the admin's «Sedang ditinjau»: Ratih «Konfirmasi berlaku» (still passes); Citra «Cabut» through its confirmation
//   L5 after the decisions: Citra's certificate page, her printed copy and the public check («dicabut»)
//   L6 the reissue: Admin PINTAR corrects Ratih's name (the only way a certificate's data changes: «nama orang dikoreksi
//      oleh Admin PINTAR»), then the school admin opens her certificate and issues the replacement; then Ratih's
//      certificate page, the printed copy and both public checks (the old one «digantikan», the new one)
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { APP, dunia, jalan, lewatiTur, pilihBahasa, masukEmail, muatUlang, keluar, ringkas, LEBAR } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const LABEL = ["bukti OFFICIAL di tenant bootstrap dev/CI (sintetis)"];
const RAPI = (t) => (t ?? "").replace(/\s+/g, " ").trim();
const NAMA_BENAR = "Ratih Kusumawati";

/** the certificates, issued by the product after the load (Bob's condition 3); dunia.json is rewritten by it */
function terbitkan() {
  if (!process.env.CERT_SECRET_KEY_V1) throw new Error("CERT_SECRET_KEY_V1 (CI's synthetic key) is needed: the certificates are issued and checked with it");
  try { execFileSync("node", [join(HERE, "..", "dunia", "terbitkan.mjs")], { stdio: "pipe", encoding: "utf8", env: process.env }); }
  catch (e) { throw new Error(`terbitkan.mjs failed: ${String(e.stdout ?? "").slice(-400)} ${String(e.stderr ?? e.message).slice(-400)}`); }
}

const hasil = [];
for (const lebar of LEBAR) {
  muatUlang();
  terbitkan();
  const D = dunia();
  const admin = D["w14.admin"], kaprodi = D["w14.kaprodi"], platform = D["pintar.admin1"];
  const ratih = D["w14.murid_terbit"], bayu = D["w14.murid_benar"], citra = D["w14.murid_cabut"];
  const kursus = D["w14.bab"].kursus, T = D["w14.bab"].tugas, soal = D["w14.soal_salah_kunci"];
  const j = await jalan({ perjalanan: "j7", lebar, zona: "WIB", nama: "Yohana · Made · Ratih · Bayu · Citra · Admin PINTAR", label: LABEL });
  const { page } = j;
  const isi = async () => RAPI(await page.locator("main").first().innerText().catch(() => ""));
  const status = (s) => RAPI(s).slice(0, 400);
  const koreksi = () => j.baca(`select coalesce(string_agg(status || ' ' || array_to_string(key_before, ',') || '→' || array_to_string(key_after, ','), '; '), 'none')
    from public.key_corrections where asked_item_id = '${soal}' or item_id = '${soal}'`);
  const sertifikat = (orang) => j.baca(`select coalesce(string_agg(c.certificate_number || ' ' || c.status::text
      || coalesce(' review ' || coalesce(r.decision, 'OPEN'), ''), '; ' order by c.created_at), 'none')
    from public.certificates c left join public.certificate_reviews r on r.certificate_id = c.id
    where c.person_id = '${orang.person}'`);
  const hasilnya = (orang) => j.baca(`select coalesce(string_agg(round(r.mastery * 100)::text || '%' || case when r.supersedes_result_id is null then ' (asli)' else ' (dihitung ulang)' end, ' → ' order by r.created_at), 'none')
    from public.assessment_results r join public.assessment_sessions s on s.id = r.session_id
    join public.assessment_definitions d on d.id = s.assessment_definition_id
    where s.person_id = '${orang.person}' and d.mode = 'POST_TEST'`);
  const token = (orang, kini = true) => j.baca(`select verification_token from public.certificates where person_id = '${orang.person}'
    order by created_at ${kini ? "desc" : "asc"} limit 1`);

  /** the learner's own surfaces: the result, the certificate page, its printed copy (print media, PDF), the public check */
  async function murid(orang, foto, data, awalan, adaSertifikat = true) {
    await masukEmail(j, orang);
    await lewatiTur(j);
    await page.goto(`${APP}/belajar/${T}/hasil`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await foto(`${awalan}hasil`);
    data(`${awalan}result_page`, (await isi()).slice(0, 700));
    if (adaSertifikat) {
      await page.goto(`${APP}/belajar/${T}/sertifikat`);
      await page.waitForLoadState("networkidle").catch(() => {});
      await foto(`${awalan}sertifikat`);
      data(`${awalan}certificate_page`, (await isi()).slice(0, 900));
      // the printed copy: what «Cetak atau simpan PDF» gives, read in print media and kept as a PDF beside the screens
      await page.emulateMedia({ media: "print" });
      await foto(`${awalan}sertifikat-cetak`);
      data(`${awalan}printed_copy`, RAPI(await page.locator("body").innerText().catch(() => "")).slice(0, 700));
      await page.pdf({ path: join(j.out, `${awalan}sertifikat-cetak.pdf`), printBackground: true }).catch((e) => data(`${awalan}printed_pdf`, `(no PDF: ${e.message})`));
      await page.emulateMedia({ media: "screen" });
    }
    await keluar(j);
  }
  /** the outside verifier: the public check, signed out */
  async function periksa(tok, foto, data, nm) {
    await page.goto(`${APP}/verifikasi/${encodeURIComponent(tok)}`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await foto(`publik-${nm}`);
    data(`public_${nm}`, (await isi()).slice(0, 600));
  }

  await j.langkah("L1", "the school admin proposes the correction: «Kunci jawaban keliru?», the three steps, «Kirim untuk konfirmasi»", async ({ rec, foto, data }) => {
    await page.goto(`${APP}/masuk`);
    await pilihBahasa(j);
    await masukEmail(j, admin);
    await lewatiTur(j);
    // the question's lesson: the package page lists one lesson at a time; the link is on the one holding the question
    let tautan = null;
    for (let p = 1; p <= 8 && !tautan; p++) {
      await page.goto(`${APP}/studio/paket/${encodeURIComponent(kursus)}?pelajaran=${p}`);
      await page.waitForLoadState("networkidle").catch(() => {});
      const l = page.locator(`a[data-kunci-keliru="${soal}"]`).first();
      if (await l.count()) tautan = l;
    }
    if (!tautan) throw new Error("no «Kunci jawaban keliru?» link for the wrong-keyed question on any lesson of the package");
    await foto("studio-paket");
    rec.tab += await j.tekan(tautan, 400);
    await page.waitForURL((u) => u.searchParams.get("langkah") === "1", { timeout: 30000 });
    await page.waitForLoadState("networkidle").catch(() => {});
    await foto("langkah-1");
    // step 1: the correct key (a radio group: one Tab stop, the arrows move the choice), and the reason
    const benar = page.locator(`input[type=radio][name=baru][value=B]`).first();
    rec.tab += await j.tabKe(page.locator(`input[type=radio][name=baru]:not([disabled])`).first(), 400);
    for (let i = 0; i < 4 && !(await benar.isChecked()); i++) await page.keyboard.press(await page.evaluate(() => document.activeElement?.value) === "B" ? "Space" : "ArrowDown");
    if (!(await benar.isChecked())) await page.keyboard.press("Space");
    if (!(await benar.isChecked())) throw new Error("option B could not be chosen by keyboard");
    rec.tab += await j.ketik(page.getByRole("textbox", { name: /^(Alasan|Reason)$/ }).first(), "7 × 8 = 56; kuncinya tertulis 54 (pilihan A).", 60);
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Lanjut|Continue)$/ }).first(), 60);
    await page.waitForURL((u) => u.searchParams.get("langkah") === "2", { timeout: 30000 });
    await page.waitForLoadState("networkidle").catch(() => {});
    await foto("langkah-2");
    data("step2_impact", (await isi()).slice(0, 1200));
    rec.tab += await j.tekan(page.getByRole("link", { name: /^(Lanjut|Continue)$/ }).first(), 200);
    await page.waitForURL((u) => u.searchParams.get("langkah") === "3", { timeout: 30000 });
    await page.waitForLoadState("networkidle").catch(() => {});
    await foto("langkah-3");
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Kirim untuk konfirmasi|Send for confirmation)$/ }).first(), 200);
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(800);
    await foto("terkirim");
    data("words", status((await page.locator('[role="status"]').allInnerTexts().catch(() => [])).join(" | ")));
    data("correction", koreksi());
    if (!/PENDING/.test(rec.data.correction)) throw new Error(`no pending correction (${rec.data.correction})`);
    await keluar(j);
  });

  await j.langkah("L2", "the head of department: what tells him a correction waits, then «Konfirmasi perbaikan»", async ({ rec, foto, data }) => {
    await masukEmail(j, kaprodi);
    await foto("kaprodi-masuk");
    await lewatiTur(j);
    for (const [nm, url] of [["studio", "/studio"], ["pimpinan", "/pimpinan"], ["antrean", "/studio/tinjau"]]) {
      await page.goto(`${APP}${url}`);
      await page.waitForLoadState("networkidle").catch(() => {});
      await lewatiTur(j);
      await foto(`kaprodi-${nm}`);
      data(`approver_${nm}`, (await isi()).slice(0, 700));
    }
    const buka = page.getByRole("link", { name: /^(Perbaikan kunci jawaban|Answer-key correction)/ }).first();
    if (await buka.count()) rec.tab += await j.tekan(buka, 300);
    else {
      const id = j.baca(`select id from public.key_corrections where (asked_item_id = '${soal}' or item_id = '${soal}') and status = 'PENDING' limit 1`);
      data("opened_by", "(no link to the correction on the queue: opened by its address)");
      await page.goto(`${APP}/studio/tinjau/kunci/${id}`);
    }
    await page.waitForURL((u) => u.pathname.startsWith("/studio/tinjau/kunci/"), { timeout: 30000 });
    await page.waitForLoadState("networkidle").catch(() => {});
    await foto("kaprodi-koreksi");
    data("correction_page", (await isi()).slice(0, 1000));
    rec.tab += await j.tekan(page.locator("button[data-konfirmasi-buka]").first(), 200);
    const dialog = page.locator("dialog[open]").first();
    await dialog.waitFor({ timeout: 10000 });
    await foto("kaprodi-konfirmasi-dialog");
    data("dialog", RAPI(await dialog.innerText()));
    rec.tab += await j.tekan(dialog.getByRole("button", { name: /^(Konfirmasi perbaikan|Confirm the correction)$/ }).first(), 20);
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(1000);
    await foto("kaprodi-selesai");
    data("done", (await isi()).slice(0, 500));
    data("correction", koreksi());
    if (!/CONFIRMED|APPLIED|DONE/i.test(rec.data.correction)) throw new Error(`the correction was not confirmed (${rec.data.correction})`);
    for (const o of [ratih, bayu, citra]) data(`result_${o.nama.split(" ")[0]}`, hasilnya(o));
    await keluar(j);
  });

  await j.langkah("L3", "after the recalculation: the three learners, the printed copies, the public checks", async ({ foto, data }) => {
    await murid(ratih, foto, data, "ratih-");
    await murid(bayu, foto, data, "bayu-", false);
    await murid(citra, foto, data, "citra-");
    await periksa(token(ratih), foto, data, "ratih");
    await periksa(token(citra), foto, data, "citra");
    for (const o of [ratih, citra]) data(`certificate_${o.nama.split(" ")[0]}`, sertifikat(o));
  });

  await j.langkah("L4", "the admin's «Sedang ditinjau»: Ratih «Konfirmasi berlaku»; Citra «Cabut» through its confirmation", async ({ rec, foto, data }) => {
    await masukEmail(j, admin);
    await lewatiTur(j);
    await page.goto(`${APP}/konfigurasi/sertifikat`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await foto("admin-ditinjau");
    data("review_section", RAPI(await page.locator("#pin-ditinjau-judul").locator("xpath=ancestor::section[1]").innerText().catch(() => "(no «Sedang ditinjau»)")).slice(0, 900));
    const formulir = (o) => page.locator(`form[id^="tinjau-"]`).filter({ has: page.locator(`input[name=sertifikat][value="${j.baca(`select id from public.certificates where person_id = '${o.person}' order by created_at desc limit 1`)}"]`) }).first();
    // Ratih: still passes, so her certificate is confirmed valid
    let f = formulir(ratih);
    rec.tab += await j.ketik(f.locator("textarea[name=alasan]"), "Hasil dihitung ulang 83%, tetap di atas target 60%.", 300);
    rec.tab += await j.tekan(f.getByRole("button", { name: /^(Konfirmasi berlaku|Confirm valid)/ }).first(), 20);
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(800);
    await foto("admin-ratih-dikonfirmasi");
    data("after_confirm", status((await page.locator('[role="status"]').allInnerTexts().catch(() => [])).join(" | ")));
    // Citra: below the mark now, so hers is revoked; «Cabut» asks first (the named effect), then the red button
    f = formulir(citra);
    rec.tab += await j.ketik(f.locator("textarea[name=alasan]"), "Hasil dihitung ulang 50%, di bawah target 60%.", 300);
    rec.tab += await j.tekan(f.locator("button[data-bahaya-buka]").first(), 20);
    const tanya = f.locator("[data-bahaya-tanya]").first();
    await tanya.waitFor({ timeout: 10000 });
    await foto("admin-citra-cabut-tanya");
    data("revoke_question", RAPI(await tanya.innerText()));
    rec.tab += await j.tekan(tanya.getByRole("button", { name: /^(Cabut|Revoke)$/ }).first(), 20);
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(800);
    await foto("admin-citra-dicabut");
    data("after_revoke", status((await page.locator('[role="status"]').allInnerTexts().catch(() => [])).join(" | ")));
    for (const o of [ratih, citra]) data(`certificate_${o.nama.split(" ")[0]}`, sertifikat(o));
    if (!/REVOKED/.test(rec.data.certificate_Citra)) throw new Error(`Citra's certificate was not revoked (${rec.data.certificate_Citra})`);
    if (!/CONFIRMED/.test(rec.data.certificate_Ratih)) throw new Error(`Ratih's review was not confirmed (${rec.data.certificate_Ratih})`);
    await keluar(j);
  });

  await j.langkah("L5", "«Cabut» completed: Citra's certificate page, her printed copy, the public check", async ({ foto, data }) => {
    await murid(citra, foto, data, "citra-dicabut-");
    await periksa(token(citra), foto, data, "citra-dicabut");
  });

  await j.langkah("L6", "the reissue: Admin PINTAR corrects Ratih's name; the school admin issues the replacement; what Ratih and the verifier see", async ({ rec, foto, data }) => {
    const lama = token(ratih);
    await masukEmail(j, platform);
    await lewatiTur(j);
    await page.goto(`${APP}/aktivasi/orang?cari=${encodeURIComponent(ratih.nama)}&pilih=${ratih.person}`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await foto("platform-orang");
    const nama = page.locator("form[data-koreksi=nama]").first();
    const bidang = nama.locator("#koreksi-nama");
    await j.tabKe(bidang, 300);
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type(NAMA_BENAR);
    rec.tab += await j.ketik(nama.locator("#koreksi-nama-alasan"), "Ejaan nama sesuai akta kelahiran.", 20);
    rec.tab += await j.tekan(nama.getByRole("button", { name: /^(Koreksi nama|Correct the name)$/ }).first(), 20);
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(800);
    await foto("platform-nama-dikoreksi");
    data("name_now", j.baca(`select display_name from public.persons where id = '${ratih.person}'`));
    if (rec.data.name_now !== NAMA_BENAR) throw new Error(`the name was not corrected (${rec.data.name_now})`);
    await keluar(j);

    await masukEmail(j, admin);
    await lewatiTur(j);
    await page.goto(`${APP}/konfigurasi/sertifikat?cari=${encodeURIComponent("Ratih")}`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await foto("admin-daftar");
    const id = j.baca(`select id from public.certificates where person_id = '${ratih.person}' order by created_at desc limit 1`);
    rec.tab += await j.tekan(page.locator(`a[data-cabut-sertifikat="${id}"]`).first(), 300);
    await page.waitForURL((u) => u.search.includes(id) || u.hash === "#cabut", { timeout: 30000 }).catch(() => {});
    await page.locator("[data-ganti]").first().waitFor({ timeout: 30000 });
    await foto("admin-terbit-ulang");
    data("reissue_panel", RAPI(await page.locator("[data-ganti]").first().innerText()).slice(0, 900));
    rec.tab += await j.ketik(page.locator("#ganti-alasan"), "Nama pemegang dikoreksi Admin PINTAR.", 300);
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Terbitkan sertifikat pengganti|Issue the replacement)$/ }).first(), 20);
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(1000);
    await foto("admin-terbit-ulang-selesai");
    data("after_reissue", (await isi()).slice(0, 500));
    data("certificate_Ratih", sertifikat(ratih));
    if (!/SUPERSEDED/.test(rec.data.certificate_Ratih)) throw new Error(`no replacement was issued (${rec.data.certificate_Ratih})`);
    await keluar(j);

    await murid({ ...ratih }, foto, data, "ratih-pengganti-");
    await periksa(lama, foto, data, "ratih-lama");
    await periksa(token(ratih), foto, data, "ratih-pengganti");
  });

  hasil.push(await j.selesai());
}
process.exit(ringkas("j7", hasil));
