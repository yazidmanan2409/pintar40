// J9 · A promotion, then a transfer across it (Daisy's script, 53c1af77, J9). World: W16 (audit/dunia/08-w16.sql):
// SMP Sintetis Flamboyan (A, WIB) with this year and next (next year's 8A), 7A of four, and Qori Ananda's open
// transfer to SMP Sintetis Kenari (B, WITA). A harness: it records, it does not judge.
//
//   node audit/perjalanan/j9.mjs        (the app on APP_URL; the stack up. It LOADS THE WORLD ITSELF before each walk:
//                                        the journey changes it, so every width starts from a fresh world)
//
// One browser per walk, two people in turn on it (each signs out before the other signs in; keyboard only):
//   L1 A's admin (Teguh Wibowo): the year-end promotion of 7A, every learner to next year's 8A, Qori included;
//      reviewed, confirmed
//   L2 B's admin (Andi Mappanyompa): «Terima perpindahan» on Qori's old request, then «Laksanakan». The script expects
//      TRANSFER_SOURCE_CLOSED at «Terima»; on next-base «Terima» authorizes and the refusal is transfer_execute's, at
//      «Laksanakan» (20270123150000: «the transfer stays AUTHORIZED and nothing is written»). Both are walked and
//      recorded, with the data before and after each (nothing changed by the refused step)
//   L3 A's admin: a new request for Qori, to Kenari (by its code)
//   L4 B's admin: «Terima perpindahan» on the new request, then «Laksanakan»: Qori at Kenari
import { APP, dunia, jalan, pilihBahasa, ringkas, masukEmail, muatUlang, pilih, keluar, BAHASA, LEBAR } from "./lib.mjs";

const hasil = [];
for (const lebar of LEBAR) {
  muatUlang();
  const D = dunia();
  const A = D["w16a.admin"], B = D["w16b.admin"], qori = D["w16.murid1"];
  const sql = {
    pindah: () => `select coalesce(string_agg(t.status::text || ' ' || coalesce(fi.name, '?') || '→' || coalesce(ti.name, '?'), '; ' order by t.created_at), 'none')
                     from public.transfers t join public.enrollments e on e.id = t.from_enrollment_id
                     left join public.institutions fi on fi.id = e.institution_id left join public.institutions ti on ti.id = t.to_institution_id
                    where e.person_id = '${qori.person}'`,
    daftar: () => `select coalesce(string_agg(i.name || ' ' || e.status::text || ' ' || coalesce(ap.name, '?'), '; ' order by e.created_at), 'none')
                     from public.enrollments e join public.institutions i on i.id = e.institution_id
                     left join public.academic_periods ap on ap.id = e.academic_period_id where e.person_id = '${qori.person}'`,
  };
  const j = await jalan({ perjalanan: "j9", lebar, zona: "WIB", nama: `${A.nama} → ${B.nama}` });
  const { page } = j;
  // «Laksanakan · <name>» on the newest AUTHORIZED row naming Qori (the list is newest first)
  const laksanakan = async (rec) => {
    const tombol = page.getByRole("button", { name: new RegExp(`^(Laksanakan|Execute)\\s*·\\s*${qori.nama}`) }).first();
    await tombol.waitFor({ timeout: 30000 });
    rec.tab += await j.tekan(tombol);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1000);
  };
  const teks = async () => (await page.locator('[role="status"], [role="alert"]').allInnerTexts().catch(() => []))
    .map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean).join(" | ");

  await j.langkah("L1", "A: the year-end promotion of 7A (Qori included), reviewed and confirmed", async ({ rec, foto, data }) => {
    await page.goto(`${APP}/masuk`);
    await pilihBahasa(j);
    data("signed_in", await masukEmail(j, A));
    data("before_transfers", j.baca(sql.pindah()));
    await page.goto(`${APP}/konfigurasi/rollover`);
    await foto("kenaikan-1");
    rec.tab += await pilih(j, page.getByRole("combobox", { name: /^Kelas$|^Class$/i }).first(), "7A");
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Lanjut|Continue|Next)$/i }).first());
    await page.getByRole("combobox", { name: /Naikkan semua ke|Move everyone up to/i }).waitFor({ timeout: 30000 });
    rec.tab += await pilih(j, page.getByRole("combobox", { name: /Naikkan semua ke|Move everyone up to/i }).first(), "8A");
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Terapkan|Apply)$/i }).first());
    await page.waitForTimeout(500);
    await foto("kenaikan-2-diterapkan");
    data("after_apply", await teks());
    rec.tab += await pilih(j, page.getByRole("combobox", { name: new RegExp(qori.nama) }).first(), BAHASA === "en" ? "Up to 8A" : "Naik ke 8A");
    await foto("kenaikan-3-qori");
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Tinjau hasil|Review the outcome)/i }).first());
    await page.getByRole("button", { name: /Konfirmasi kenaikan kelas|Confirm the promotion/i }).waitFor({ timeout: 30000 });
    await foto("kenaikan-4-tinjau");
    const centang = page.getByRole("checkbox").first();
    if (await centang.count()) { await j.tabKe(centang); await page.keyboard.press("Space"); }
    rec.tab += await j.tekan(page.getByRole("button", { name: /Konfirmasi kenaikan kelas|Confirm the promotion/i }).first());
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);
    await foto("kenaikan-5-hasil");
    data("result_words", await teks());
    data("after_enrollments", j.baca(sql.daftar()));
    data("after_transfers", j.baca(sql.pindah()));
  });

  await j.langkah("L2", "B: «Terima perpindahan», then «Laksanakan», on the old request after the promotion (where it is refused; what changed)", async ({ rec, foto, data, amati }) => {
    await keluar(j);
    data("signed_in", await masukEmail(j, B));
    await page.goto(`${APP}/konfigurasi/transfers`);
    await foto("b-masuk");
    const sebelum = [j.baca(sql.pindah()), j.baca(sql.daftar())];
    const form = page.locator("form[data-pindah-masuk]").first();
    await form.waitFor({ timeout: 30000 });
    rec.tab += await pilih(j, form.getByRole("combobox", { name: /Tahun ajaran|School year at this school/i }), "20");
    rec.tab += await pilih(j, form.getByRole("combobox", { name: /^Kelas|^Class at this school/i }), "7A");
    rec.tab += await j.tekan(form.getByRole("button", { name: /Terima perpindahan|Accept the transfer/i }));
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1000);
    await foto("b-terima-ditolak");
    data("words", await teks());
    const sesudah = [j.baca(sql.pindah()), j.baca(sql.daftar())];
    data("transfers_before_after", sebelum[0] + "  ⟶  " + sesudah[0]);
    data("enrollments_before_after", sebelum[1] + "  ⟶  " + sesudah[1]);
    data("terima_refused", sebelum[0] === sesudah[0] && sebelum[1] === sesudah[1]);
    amati(sebelum[0] === sesudah[0] ? "«Terima» was refused" : "«Terima» was ACCEPTED (the transfer is AUTHORIZED); the script expected the refusal here");
    // «Laksanakan»: where next-base refuses a transfer whose source enrolment closed
    const s2 = [j.baca(sql.pindah()), j.baca(sql.daftar())];
    await laksanakan(rec);
    await foto("b-laksanakan");
    data("laksanakan_words", await teks());
    const s3 = [j.baca(sql.pindah()), j.baca(sql.daftar())];
    data("laksanakan_transfers_before_after", s2[0] + "  ⟶  " + s3[0]);
    data("laksanakan_enrollments_before_after", s2[1] + "  ⟶  " + s3[1]);
    data("laksanakan_nothing_changed", s2[0] === s3[0] && s2[1] === s3[1]);
    amati(s2[0] === s3[0] && s2[1] === s3[1] ? "«Laksanakan» was refused; nothing changed (words in data)" : "«Laksanakan» changed the data (see data)");
  });

  await j.langkah("L3", "A: a new request for Qori, to Kenari (by its code)", async ({ rec, foto, data }) => {
    await keluar(j);
    await masukEmail(j, A);
    await page.goto(`${APP}/konfigurasi/transfers`);
    rec.tab += await j.ketik(page.getByRole("textbox", { name: /kode sekolah tujuan|full name or code/i }).first(), "KNR");
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Cari sekolah|Find the school)/i }).first());
    await page.getByRole("combobox", { name: /Murid|Students/i }).first().waitFor({ timeout: 30000 });
    await foto("a-ajukan");
    rec.tab += await pilih(j, page.getByRole("combobox", { name: /Murid|Students/i }).first(), qori.nama);
    rec.tab += await j.ketik(page.getByRole("textbox", { name: /^(Alasan|Reason)$/i }).first(), "Keluarga pindah ke Makassar (permintaan baru setelah kenaikan kelas)");
    rec.tab += await j.tekan(page.getByRole("button", { name: /Ajukan perpindahan|Request a transfer/i }).first());
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1000);
    await foto("a-diajukan");
    data("words", await teks());
    data("transfers", j.baca(sql.pindah()));
  });

  await j.langkah("L4", "B: «Terima perpindahan», then «Laksanakan», on the new request", async ({ rec, foto, data, amati }) => {
    await keluar(j);
    await masukEmail(j, B);
    await page.goto(`${APP}/konfigurasi/transfers`);
    const form = page.locator("form[data-pindah-masuk]").last();
    await form.waitFor({ timeout: 30000 });
    await foto("b-masuk-baru");
    rec.tab += await pilih(j, form.getByRole("combobox", { name: /Tahun ajaran|School year at this school/i }), "20");
    rec.tab += await pilih(j, form.getByRole("combobox", { name: /^Kelas|^Class at this school/i }), "7A");
    rec.tab += await j.tekan(form.getByRole("button", { name: /Terima perpindahan|Accept the transfer/i }));
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1000);
    await foto("b-diterima");
    data("words", await teks());
    await laksanakan(rec);
    await foto("b-dilaksanakan");
    data("laksanakan_words", await teks());
    data("transfers", j.baca(sql.pindah()));
    data("enrollments", j.baca(sql.daftar()));
    amati(`last screen: ${new URL(page.url()).pathname}`);
  });

  hasil.push(await j.selesai());
}
process.exit(ringkas("j9", hasil));
