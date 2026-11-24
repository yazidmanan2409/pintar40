// J11 · Reading the school (Daisy's script, f19d202c, J11). World: W18 in the dev/CI bootstrap tenant
// (audit/dunia/12-w18.sql, 12b-w18-pindah.sql). The leader: Kepala sekolah Retno Wulandari (w18.dekan, DEAN at the
// school's root). A harness: it records, it does not judge. Read-only, so one world serves every walk.
//
//   audit/dunia/muat.sh && node audit/perjalanan/j11.mjs
//
// Captures labelled «bukti OFFICIAL di tenant bootstrap dev/CI (sintetis)». The same report also shows W14's 9A, the
// J2/J3 classes and the seed's own class (one school); W18's own figures are IPA.
//   L1 Pimpinan's page · L2 the readiness bands (a class with figures, opened) · L3 «Belum cukup bukti» (8R, opened;
//   «Kesiapan bukti») · L4 the school summary: the scope line laporan.cakupan.sekolah, and whether the withheld domains are named on the
//   same page (f19d202c, L-37); every «semua»/«all» sentence recorded ·
//   L5 the printed summary (the print view, and a PDF of it)
import { join } from "node:path";
import { APP, dunia, jalan, pilihBahasa, ringkas, masukEmail, BAHASA, LEBAR } from "./lib.mjs";

const D = dunia();
const kepala = D["w18.dekan"];
const sekolah = D["boot.sekolah"];
const LABEL = ["bukti OFFICIAL di tenant bootstrap dev/CI (sintetis)"];
const kalimatSemua = (t) => t.split(/(?<=[.!?])\s+/).filter((k) => /\b(semua|seluruh|all|every)\b/i.test(k)).slice(0, 20);

const hasil = [];
for (const lebar of LEBAR) {
  const j = await jalan({ perjalanan: "j11", lebar, zona: "WIB", nama: kepala.nama, label: LABEL });
  const { page } = j;
  const buka = async (nama, rec) => {
    const ringkasan = page.locator("summary", { hasText: nama }).first();
    rec.tab += await j.tekan(ringkasan, 150);
    await page.waitForTimeout(400);
  };

  await j.langkah("L1", "Pimpinan's page", async ({ foto, data }) => {
    await page.goto(`${APP}/masuk`);
    await pilihBahasa(j);
    data("signed_in", await masukEmail(j, kepala));
    if (!new URL(page.url()).pathname.startsWith("/pimpinan")) await page.goto(`${APP}/pimpinan`);
    await foto("pimpinan");
    // the calculator, read AS the leader (dunia.sebagai sets the claims inside the read-only transaction)
    data("domains_by_the_calculator", j.baca(`select dunia.sebagai('w18.dekan');
      select string_agg(x ->> 'code' || '=' || coalesce(x ->> 'mean_score', 'withheld:' || (x ->> 'withheld')), ', ' order by x ->> 'code')
        from jsonb_array_elements((select public.metric_evaluate('institution.competency_outcomes', '${sekolah}', '${sekolah}')) -> 'value') x`).split("\n").pop());
  });

  await j.langkah("L2", "the readiness bands: a class with figures (8P), opened", async ({ rec, foto, data }) => {
    await buka("8P (dunia)", rec);
    await foto("kelas-8p");
    data("class_text", (await page.locator("details[open]", { hasText: "8P (dunia)" }).first().innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 600));
  });

  await j.langkah("L3", "«Belum cukup bukti»: 8R opened, and «Kesiapan bukti»", async ({ rec, foto, data }) => {
    await buka("8R (dunia)", rec);
    await foto("kelas-8r");
    data("class_text", (await page.locator("details[open]", { hasText: "8R (dunia)" }).first().innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 600));
    const e = page.getByRole("heading", { name: /Kesiapan bukti|Evidence readiness/i }).first();
    await e.scrollIntoViewIfNeeded().catch(() => {});
    await foto("kesiapan-bukti");
  });

  await j.langkah("L4", "the school summary: the scope line, and the withheld domains named on the page", async ({ rec, foto, data }) => {
    rec.tab += await j.tekan(page.getByRole("link", { name: /Buka ringkasan sekolah|Open the school summary/i }).first(), 200);
    await page.waitForURL((u) => u.pathname.startsWith("/dekan/ringkasan"), { timeout: 30000 });
    await foto("ringkasan-sekolah");
    const t = (await page.locator("main").innerText()).replace(/\s+/g, " ");
    data("sentences_with_all", kalimatSemua(t));
    // f19d202c step 4 (L-37): the scope line laporan.cakupan.sekolah; WATCH: the withheld domains named on the same page
    data("scope_line", (t.match(/Angka dihitung .{0,40}? dari semua bukti sekolah ini, di setiap tahun ajaran, sampai saat itu\.|Figures calculated .{0,40}? from all of this school's evidence, in every school year, up to then\./) ?? ["(not found)"])[0]);
    data("withheld_named_on_page", t.split(/(?<=[.!?])\s+/).filter((k) => /belum ditampilkan|not shown yet|withheld|ditahan/i.test(k)).slice(0, 8));
    data("url", new URL(page.url()).pathname + new URL(page.url()).search);
  });

  await j.langkah("L5", "the printed summary", async ({ rec, foto, data, amati }) => {
    const cetak = page.getByRole("button", { name: /Cetak laporan|Print report/i }).first();
    const [popup] = await Promise.all([
      page.context().waitForEvent("page", { timeout: 8000 }).catch(() => null),
      (async () => { rec.tab += await j.tekan(cetak, 200); })(),
    ]);
    const p = popup ?? page;
    await p.waitForLoadState("networkidle").catch(() => {});
    await p.waitForTimeout(1500);
    data("print_url", new URL(p.url()).pathname);
    await p.emulateMedia({ media: "print" });
    await p.screenshot({ path: join(j.out, "cetak-tampilan.png"), fullPage: true });
    rec.layar.push("cetak-tampilan");
    if (lebar === 1280) {
      await p.pdf({ path: join(j.out, "cetak.pdf"), format: "A4", printBackground: true }).catch((e) => amati(`no PDF: ${e.message}`));
      rec.layar.push("cetak.pdf");
    }
    data("print_sentences_with_all", kalimatSemua((await p.locator("body").innerText()).replace(/\s+/g, " ")));
    await p.emulateMedia({ media: "screen" });
    amati(`last screen: the print view (${new URL(p.url()).pathname})`);
  });

  hasil.push(await j.selesai());
}
process.exit(ringkas("j11", hasil));
