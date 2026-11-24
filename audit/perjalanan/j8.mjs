// J8 · A school year set up (Daisy's script, J8; her notes AUDIT-79-TEMUAN-J8.md). World: W15, SD Sintetis Anggrek,
// empty, its one Admin sekolah Wahyu Nugroho; one draft package of its own (fixture w15-paket: a pass mark is set per
// lesson line, and an empty school has none). Daisy walked the structure and the code; the builder's run adds what she
// left: pass marks, roles with «Berlaku sampai», the list with planted errors, printed cards, a renamed rule, the last
// admin's refusals, and the passes. A harness: it records, it does not judge.
//
//   node audit/perjalanan/j8.mjs      (the app on APP_URL; it LOADS THE WORLD ITSELF before each walk)
//
// Keyboard only, one person (the school's only admin):
//   L1  the structure: a Bagian for learners, a Tingkat with a wrongly shaped year then a right one, classes 1A and 1B;
//       a Bagian for staff
//   L2  the school code: a wrong shape (the field kept), then «AGR»
//   L3  a pass mark for «Bilangan sampai 20»: out of range (the field's own rule), then 70 with its reason
//   L4  the learners' list with planted errors (a blank row, a duplicate, a name too long): the check names each row;
//       then the clean list for 1A, checked and recorded
//   L5  the staff list (two teachers), recorded; then roles: Guru for 1A «Berlaku sampai» today, and one without a date
//   L6  1A's class cards made and printed (print media, saved as PDF)
//   L7  an assessment rule made for the package, then renamed: its settings kept
//   L8  the last admin: revoking their own admin role, and closing their own account: both refused
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { APP, dunia, jalan, lewatiTur, pilihBahasa, masukEmail, muatUlang, keluar, ringkas, LEBAR } from "./lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
function fiksasi(nama) {
  try { execFileSync(join(HERE, "..", "dunia", "muat.sh"), ["--fiksasi", nama], { stdio: "pipe", encoding: "utf8" }); }
  catch (e) { throw new Error(`fixture ${nama} failed: ${String(e.stderr ?? e.message).split("\n").filter((l) => /ERROR|REFUSED/.test(l)).join(" | ").slice(0, 400)}`); }
}
const RAPI = (t) => (t ?? "").replace(/\s+/g, " ").trim();
const LABEL = ["keadaan fiksasi: satu paket draf di Anggrek (batas ketuntasan ditetapkan per paket)",
  "keadaan fiksasi di L5: dua staf didata (jalur staf pendataan belum ada)"];
const hasil = [];

for (const lebar of LEBAR) {
  muatUlang("w15-paket");
  const D = dunia();
  const admin = D["w15.admin"];
  const j = await jalan({ perjalanan: "j8", lebar, zona: "WIB", nama: "Wahyu Nugroho (Admin sekolah Anggrek)", label: LABEL });
  const { page } = j;
  const isi = async () => RAPI(await page.locator("main").first().innerText().catch(() => ""));
  const pesan = async () => RAPI((await page.locator('[role="alert"], [role="status"]').allInnerTexts().catch(() => [])).filter((x) => x.trim()).join(" | "));
  const tunggu = async () => { await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(800); };
  const ke = async (u) => { await page.goto(`${APP}${u}`).catch(() => {}); await tunggu(); };
  /** a select chosen by keyboard focus and the option whose text matches */
  const pilihOpsi = async (rec, sel, re) => {
    const loc = typeof sel === "string" ? page.locator(sel).first() : sel;
    const v = await loc.evaluate((x, r) => [...x.options].find((o) => new RegExp(r).test(o.text))?.value ?? null, re.source);
    rec.tab += await j.tabKe(loc, 200);
    if (v !== null) await loc.selectOption(v);
    return v;
  };
  /** a list pasted on Pendataan, mapped, and taken to its check; returns the check's words */
  async function daftar(rec, foto, awalan, baris, tempat, peran, program) {
    await ke("/pendataan");
    rec.tab += await j.ketik(page.locator("main textarea").first(), baris, 300);
    await page.waitForTimeout(1200);
    await foto(`${awalan}terbaca`);
    await pilihOpsi(rec, "#pin-medan-display_name", /^nama$/);
    await pilihOpsi(rec, "#pin-medan-node_id", tempat ?? /^(Tidak dipakai|Not used)$/);
    await pilihOpsi(rec, "#pin-medan-role", peran ?? /^(Tidak dipakai|Not used)$/);
    if (program) await pilihOpsi(rec, "#pin-medan-programme_id", program);
    await foto(`${awalan}kolom`);
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Lanjut ke pemeriksaan|Continue to the check)/ }).first(), 100);
    await page.waitForURL((u) => /^\/pendataan\/[0-9a-f-]{36}/.test(u.pathname), { timeout: 30000 });
    await tunggu();
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Periksa daftar ini|Check this list)/ }).first(), 60);
    await page.waitForFunction(() => !/Baru disusun|Just put together/.test(document.body.innerText), null, { timeout: 60000 }).catch(() => {});
    await tunggu();
    await foto(`${awalan}periksa`);
    return (await isi()).slice(0, 1500);
  }

  /** «Ya, catat orang-orang ini», then the recording waited for */
  async function setuju(rec) {
    const ya = page.getByRole("button", { name: /^(Ya, catat orang-orang ini|Yes, record these people)/ }).first();
    if (!(await ya.count())) return false;
    rec.tab += await j.tekan(ya, 200);
    await page.waitForFunction(() => !/Menunggu persetujuan Anda|Waiting for your approval/.test(document.body.innerText), null, { timeout: 60000 }).catch(() => {});
    await tunggu();
    return true;
  }

  await j.langkah("L1", "the structure: a Bagian, a Tingkat (a wrong year, then a right one), 1A and 1B; a Bagian for staff", async ({ rec, foto, data }) => {
    await page.goto(`${APP}/masuk`);
    await pilihBahasa(j);
    await masukEmail(j, admin);
    await lewatiTur(j);
    await ke("/konfigurasi");
    await foto("konfigurasi");
    data("readiness", (await isi()).slice(0, 600));
    await ke("/konfigurasi/struktur");
    await foto("struktur-kosong");
    rec.tab += await j.ketik(page.locator("input[id^=str-nama-BAGIAN]").first(), "Kelas Rendah", 200);
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Tambah Bagian|Add Bagian)/ }).first(), 20);
    await tunggu();
    data("bagian", await pesan());
    rec.tab += await j.ketik(page.locator("input[id^=str-nama-TINGKAT]").first(), "Kelas 1", 200);
    rec.tab += await j.ketik(page.locator("input[name=tahun_ajaran]").first(), "2026-27", 20);
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Tambah Tingkat|Add Tingkat)/ }).first(), 20);
    await tunggu();
    await foto("tingkat-tahun-salah");
    data("year_wrong", { words: ((await isi()).match(/Tulis tahun ajaran[^.]*\.|Write the school year[^.]*\./) ?? ["(no refusal line)"])[0], kept: await page.locator("input[name=tahun_ajaran]").first().inputValue().catch(() => "") });
    await page.locator("input[name=tahun_ajaran]").first().fill("");
    if (!(await page.locator("input[id^=str-nama-TINGKAT]").first().inputValue())) rec.tab += await j.ketik(page.locator("input[id^=str-nama-TINGKAT]").first(), "Kelas 1", 200);
    rec.tab += await j.ketik(page.locator("input[name=tahun_ajaran]").first(), "2026/2027", 20);
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Tambah Tingkat|Add Tingkat)/ }).first(), 20);
    await tunggu();
    data("tingkat", await pesan());
    for (const k of ["1A", "1B"]) {
      rec.tab += await j.ketik(page.locator("input[id^=str-nama-KELAS]").first(), k, 200);
      rec.tab += await j.tekan(page.getByRole("button", { name: /^(Tambah Kelas|Add Kelas)/ }).first(), 20);
      await tunggu();
      data(`kelas_${k}`, await pesan());
    }
    // a Bagian for staff (professional learning), where the staff list is recorded
    rec.tab += await j.ketik(page.locator("input[id^=str-nama-BAGIAN]").last(), "Guru dan Staf", 200);
    const staf = page.locator("input[type=radio][name=untuk]").nth(1);
    rec.tab += await j.tabKe(page.locator("input[type=radio][name=untuk]:checked").last(), 30);
    for (let i = 0; i < 3 && !(await staf.isChecked()); i++) await page.keyboard.press("ArrowDown");
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Tambah Bagian|Add Bagian)/ }).last(), 20);
    await tunggu();
    await foto("struktur");
    data("bagian_staf", await pesan());
    data("structure", j.baca(`select string_agg(kind || ' ' || name, ', ' order by kind, name) from public.org_nodes where institution_id = '${D["w15.sekolah"]}' and id <> institution_id`));
  });

  await j.langkah("L2", "the school code: a wrong shape (the field kept), then «AGR»", async ({ rec, foto, data }) => {
    await ke("/pendataan");
    rec.tab += await j.ketik(page.locator("#pin-kode-isi"), "A-1", 200);
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Simpan kode|Save the code|Save code)/ }).first(), 20);
    await tunggu();
    await foto("kode-salah");
    data("code_wrong", { words: ((await isi()).match(/[^.]*(huruf atau angka|letters or numbers)[^.]*\./) ?? [await pesan()])[0], kept: await page.locator("#pin-kode-isi").inputValue().catch(() => "") });
    await page.locator("#pin-kode-isi").fill("");
    rec.tab += await j.ketik(page.locator("#pin-kode-isi"), "AGR", 20);
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Simpan kode|Save the code|Save code)/ }).first(), 20);
    await tunggu();
    await foto("kode");
    data("code", await pesan());
  });

  await j.langkah("L3", "a pass mark: out of range, then 70 with its reason", async ({ rec, foto, data }) => {
    await ke("/konfigurasi/ketuntasan");
    await foto("ketuntasan");
    rec.tab += await j.tekan(page.getByRole("link", { name: /^(Tetapkan|Set)\b/ }).first(), 200);
    await tunggu();
    const persen = page.locator("input[name=persen]").first();
    rec.tab += await j.ketik(persen, "150", 100);
    rec.tab += await j.ketik(page.locator("input[name=alasan]").first(), "Batas ketuntasan SD Anggrek tahun ini.", 20);
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Tetapkan|Set)/ }).last(), 20);
    await page.waitForTimeout(800);
    await foto("ketuntasan-di-luar");
    data("out_of_range", { browser: await persen.evaluate((e) => e.validationMessage).catch(() => ""), page: await pesan() });
    await persen.fill("");
    rec.tab += await j.ketik(persen, "70", 100);
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Tetapkan|Set)/ }).last(), 20);
    await tunggu();
    await foto("ketuntasan-ditetapkan");
    data("set", await pesan());
    data("mark", j.baca(`select coalesce(string_agg(percent::text, ','), 'none') from public.school_pass_marks where institution_id = '${D["w15.sekolah"]}'`));
  });

  await j.langkah("L4", "the learners' list with planted errors (blank, duplicate, too long); then the clean list for 1A", async ({ rec, foto, data }) => {
    const salah = ["nama", "Laras Kinanti", "", "Yoga Prasetya", "Yoga Prasetya", "X".repeat(250), "Dewi Anjani"].join("\n");
    data("planted_check", await daftar(rec, foto, "salah-", salah, /1A/, /Murid|Student/, /Kelas Rendah/));
    const bersih = ["nama", "Laras Kinanti", "Yoga Prasetya", "Dewi Anjani", "Bagas Saputra", "Citra Ayu"].join("\n");
    data("clean_check", await daftar(rec, foto, "bersih-", bersih, /1A/, /Murid|Student/, /Kelas Rendah/));
    await setuju(rec);
    await foto("bersih-dicatat");
    data("recorded", (await isi()).slice(0, 600));
    data("learners_in_1a", j.baca(`select count(*)::text from public.memberships m join public.org_nodes n on n.id = m.node_id where n.institution_id = '${D["w15.sekolah"]}' and n.name = '1A'`));
  });

  await j.langkah("L5", "the staff list (refused: intake records learners only); roles: Guru 1A until today, Guru 1B without a date (staff by fixture)", async ({ rec, foto, data }) => {
    data("staff_check", await daftar(rec, foto, "staf-", ["nama", "Siti Rahma", "Dodi Firmansyah"].join("\n"), /Guru dan Staf/, null, /Guru dan Staf/));
    await setuju(rec);
    data("staff_recorded", (await isi()).slice(0, 300));
    data("people_before", "(searched below)");
    // the roles page finds only ACTIVE enrolments; the admin has none at the school and staff cannot be recorded by
    // intake yet: first what a search for the admin finds, then two staff recorded by fixture (w15-staf, labelled)
    await ke("/konfigurasi/roles");
    await foto("peran");
    {
      const kotakCari = page.locator("input[name=cari_orang]").first();
      rec.tab += await j.ketik(kotakCari, "Wahyu", 200);
      rec.tab += await j.tekan(page.getByRole("button", { name: /^(Cari orang|Find the person)/ }).first(), 10);
      await tunggu();
      await foto("peran-cari-admin");
      data("search_admin_finds", RAPI((await page.locator("select[name=person] option").allInnerTexts()).join(" / ")).slice(0, 200));
    }
    fiksasi("w15-staf");
    await ke("/konfigurasi/roles");
    data("people_offered", RAPI((await page.locator("select[name=person] option").allInnerTexts()).join(" / ")).slice(0, 400));
    data("scopes_offered", RAPI((await page.locator("select[name=scope] option").allInnerTexts()).join(" / ")).slice(0, 300));
    const beri = async (cari, scope, sampai, awalan) => {
      const kotakCari = page.locator("input[name=cari_orang]").first();
      await kotakCari.fill("");
      rec.tab += await j.ketik(kotakCari, cari, 200);
      rec.tab += await j.tekan(page.getByRole("button", { name: /^(Cari orang|Find the person)/ }).first(), 10);
      await tunggu();
      data(`${awalan}people_found`, RAPI((await page.locator("select[name=person] option").allInnerTexts()).join(" / ")).slice(0, 300));
      await pilihOpsi(rec, "select[name=person]", new RegExp(cari));
      await pilihOpsi(rec, "select[name=role]", /^Guru$|^Educator$|^Teacher$/);
      await pilihOpsi(rec, "select[name=scope]", scope);
      if (sampai) { const t = page.locator("#cfg-peran-sampai"); rec.tab += await j.tabKe(t, 30); await t.fill(sampai); }
      rec.tab += await j.tekan(page.getByRole("button", { name: /^(Berikan peran|Grant the role|Give the role)/ }).first(), 30);
      await tunggu();
      await foto(`${awalan}peran-diberikan`);
      data(`${awalan}granted`, await pesan());
      if (!sampai) data(`${awalan}date_field`, { browser: await page.locator("#cfg-peran-sampai").evaluate((e) => e.validationMessage).catch(() => ""),
        page_line: ((await isi()).match(/[^.]*(Berlaku sampai|Valid until)[^.]*(wajib|diisi|required|harus)[^.]*\./i) ?? ["(no page line)"])[0] });
    };
    const hariIni = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);   // the school's day (WIB)
    await beri("Siti Rahma", /· 1A$/, hariIni, "sampai-");
    await beri("Dodi Firmansyah", /· 1B$/, null, "tanpa-tanggal-");
    data("roles", j.baca(`select coalesce(string_agg(p.display_name || ' ' || r.role::text || ' until ' || coalesce(r.valid_until::text, '—'), '; '), 'none')
      from public.role_assignments r join public.persons p on p.id = r.person_id where r.institution_id = '${D["w15.sekolah"]}'`));
  });

  await j.langkah("L6", "1A's class cards made and printed", async ({ rec, foto, data }) => {
    await ke("/aktivasi");
    await foto("aktivasi");
    const pilih = page.getByLabel(/^Kelas$|^Class$/).first();
    if (await pilih.count() && (await pilih.evaluate((e) => e.tagName)) === "SELECT") await pilihOpsi(rec, pilih, /1A/);
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Buat kartu untuk kelas ini|Make cards for this class)/ }).first(), 300);
    // the cards are made one by one («Membuat kartu… 3/5»): the sheet is captured once all are made and it offers printing
    await page.waitForFunction(() => !/Membuat kartu…|Making cards…/.test(document.body.innerText), null, { timeout: 120000 }).catch(() => {});
    await page.getByRole("button", { name: /^(Cetak kartu kelas|Print the class cards)/ }).first().waitFor({ timeout: 60000 });
    await foto("kartu");
    data("cards", (await isi()).slice(0, 400));
    await page.emulateMedia({ media: "print" });
    await foto("kartu-cetak");
    await page.pdf({ path: join(j.out, "kartu-cetak.pdf"), printBackground: true }).catch((e) => data("pdf", `(no PDF: ${e.message})`));
    await page.emulateMedia({ media: "screen" });
  });

  await j.langkah("L7", "an assessment rule made for the package, then renamed: its settings kept", async ({ rec, foto, data }) => {
    await ke("/studio/definisi");
    await foto("aturan");
    await pilihOpsi(rec, "select[name=course]", /Bilangan sampai 20/);
    rec.tab += await j.ketik(page.locator("input[name=judul]").first(), "Uji Penguasaan Bilangan", 30);
    rec.tab += await j.ketik(page.locator("#definisi-jumlah"), "5", 60);
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Buat aturan|Create rule)/ }).first(), 100);
    await tunggu();
    await foto("aturan-dibuat");
    data("made", await pesan());
    rec.tab += await j.tekan(page.getByRole("link", { name: /^(Ubah|Change|Edit)/ }).first(), 200);
    await tunggu();
    const nama = page.locator("form input[name=judul]").last();
    await nama.fill("");
    rec.tab += await j.ketik(nama, "Uji Penguasaan Bilangan sampai 20", 30);
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Simpan perubahan|Save changes)/ }).first(), 100);
    await tunggu();
    await foto("aturan-diganti-nama");
    data("renamed", await pesan());
    data("rules", j.baca(`select coalesce(string_agg(d.title || ' v' || coalesce(d.version::text, '?'), '; '), 'none') from public.assessment_definitions d join public.courses c on c.id = d.course_id where c.institution_id = '${D["w15.sekolah"]}'`));
  });

  await j.langkah("L8", "the last admin: revoking their own admin role; closing their own account", async ({ rec, foto, data }) => {
    await ke(`/konfigurasi/staf?orang=${admin.person}`);
    await foto("staf-saya");
    data("own_staff_page", (await isi()).slice(0, 500));
    const kotak = page.locator("input[type=checkbox][name=cabut]").first();
    if (await kotak.count()) {
      rec.tab += await j.tabKe(kotak, 200); await page.keyboard.press("Space");
      rec.tab += await j.ketik(page.locator("#staf-ubah-alasan"), "Uji: admin terakhir melepas perannya sendiri.", 30);
      rec.tab += await j.tekan(page.getByRole("button", { name: /^(Tinjau perubahan|Review the change|Tinjau)/ }).first(), 30);
      await tunggu();
      const simpan = page.locator("form").filter({ hasText: /Tinjau|Review/ }).getByRole("button", { name: /^(Simpan|Terapkan|Apply|Save)/ }).first();
      if (await simpan.count()) { rec.tab += await j.tekan(simpan, 60); await tunggu(); }
    }
    await foto("cabut-admin-terakhir");
    data("revoke_own_admin", await pesan() || (await isi()).slice(0, 400));
    await ke("/akun");
    await foto("akun");
    const tutup = page.getByRole("button", { name: /^(Tutup akun saya|Close my account)$/ }).first();
    data("close_offered", await tutup.count() > 0);
    if (await tutup.count()) {
      // the form asks for its statement ticked first («Saya memahami bahwa akun saya ditutup sekarang.»)
      const paham = page.getByRole("checkbox", { name: /Saya memahami bahwa akun saya ditutup|I understand my account closes/ }).first();
      if (await paham.count()) { rec.tab += await j.tabKe(paham, 300); if (!(await paham.isChecked())) await page.keyboard.press("Space"); }
      rec.tab += await j.tekan(tutup, 300);
      await page.waitForTimeout(800);
      const tanya = page.locator("[data-bahaya-tanya]").first();
      if (await tanya.count()) { data("close_question", RAPI(await tanya.innerText())); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Enter"); }
      await tunggu();
    }
    await foto("tutup-admin-terakhir");
    data("close_own_account", await pesan() || (await isi()).slice(0, 400));
    data("admins", j.baca(`select count(*)::text from public.role_assignments where institution_id = '${D["w15.sekolah"]}' and role::text = 'INSTITUTION_ADMIN' and revoked_at is null`));
    await keluar(j);
  });

  hasil.push(await j.selesai());
}
process.exit(ringkas("j8", hasil));
