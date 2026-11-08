const OUTV = "../verif2"; import { mkdirSync as mk, writeFileSync as wf } from "node:fs"; mk(OUTV, { recursive: true });
const foto = (p, n) => p.screenshot({ path: `${OUTV}/${n}.png`, fullPage: true });
const T = async (p) => norm(await p.locator("main").innerText());
const prim = async (p) => (await p.locator("main .pin-primary").allInnerTexts()).map(norm).join(" | ");
const HOD = { key: "hod", tujuan: "MEMIMPIN", email: "alpha-hod@synthetic.pintar.test", password: "Sintetis-AlphaHod-48!" };
const browser = await chromium.launch();
// ===== ADMIN
const { page: A } = await masuk(browser, ORANG.admin);
await buka(A, "/pendataan"); console.log("P0 primaries:", await prim(A));
await A.locator('input[name="kode"]').fill("SSA"); await A.getByRole("button", { name: "Simpan kode" }).click(); await A.waitForLoadState("networkidle"); await A.waitForTimeout(800);
console.log("P1 after save:", (await T(A)).slice(0, 420)); console.log("P1 primaries:", await prim(A)); await foto(A, "p1-kode");
wf(`${OUTV}/kelas.csv`, "Nama,Kelas\nAni Lestari,5A\nBudi Santoso,5A\n");
await A.locator('input[type="file"]').first().setInputFiles(`${OUTV}/kelas.csv`); await A.waitForTimeout(1200);
console.log("P2 map primaries:", await prim(A)); await foto(A, "p2-peta");
const btnL = A.getByRole("button", { name: "Lanjut ke pemeriksaan" });
console.log("P3 disabled:", await btnL.isDisabled(), "| described-by:", await btnL.getAttribute("aria-describedby"));
console.log("P3 text near:", (await T(A)).match(/KOLOM MANA UNTUK APA.{0,900}/)?.[0]);
await A.locator("#pin-medan-node_id").scrollIntoViewIfNeeded(); await foto(A, "p3-tanpa-kelas");
for (const w of [390, 320]) { await A.setViewportSize({ width: w, height: 900 }); await foto(A, `p3-tanpa-kelas-${w}`); console.log(w, await lebar(A)); }
await A.setViewportSize({ width: 1280, height: 900 });
// keyboard: is the reason reachable? tab to the disabled button's neighbourhood
// with class chosen
await buka(A, "/pendataan"); await A.locator('input[type="file"]').first().setInputFiles(`${OUTV}/kelas.csv`); await A.waitForTimeout(1000);
const opsi = await A.locator("#pin-medan-node_id option").evaluateAll((os) => os.map((o) => o.textContent)); const lab = opsi.find((o) => / 5A /.test(o) || /· 5A ·/.test(o));
await A.locator("#pin-medan-node_id").selectOption({ label: lab });
await A.getByRole("button", { name: "Lanjut ke pemeriksaan" }).click(); await A.waitForLoadState("networkidle");
await A.getByRole("button", { name: /Periksa daftar ini/ }).click(); await A.waitForLoadState("networkidle"); await A.waitForTimeout(3000);
console.log("P5 with class:", (await T(A)).slice(0, 900)); await foto(A, "p5-dengan-kelas");
const ya = A.getByRole("button", { name: "Ya, catat orang-orang ini" });
if (await ya.count()) { console.log("ya class:", await ya.getAttribute("class")); await ya.click();
  for (let i = 0; i < 10; i++) { await A.waitForTimeout(2500); await A.reload({ waitUntil: "networkidle" }); if (/Selesai/.test(await T(A))) break; const m = A.getByRole("button", { name: /^(Mulai mencatat|Lanjutkan)/ }); if (await m.count()) await m.first().click(); }
  console.log("P6 done:", (await T(A)).slice(0, 600)); await foto(A, "p6-selesai"); }
await buka(A, "/aktivasi"); const kb = A.getByRole("button", { name: "Buat kartu kelas" }).first();
console.log("AK card class:", await kb.getAttribute("class").catch(() => "none"), "| email class:", await A.getByRole("button", { name: "Aktifkan dengan email" }).first().getAttribute("class").catch(() => "none")); await foto(A, "ak-1280");
// destructive opener (Keluar dari semua on /akun)
await buka(A, "/akun"); const ks = A.getByRole("button", { name: /Keluar dari semua perangkat/ }).first();
console.log("B4 opener class:", await ks.getAttribute("class"), "color:", await ks.evaluate((e) => getComputedStyle(e).color));
// ===== GURU studio
const { page: G } = await masuk(browser, ORANG.guru);
await buka(G, "/studio"); console.log("S0 home:", (await T(G)).slice(0, 300));
await buka(G, "/studio/unggah"); const sel = G.locator("#ung-sekolah"); if (await sel.count()) { const v = (await sel.locator("option").evaluateAll((os) => os.map((o) => o.value))).find((x) => x); if (v) await sel.selectOption(v); }
await G.locator("#ung-berkas").setInputFiles("buku-tabel.xlsx"); await G.getByRole("button", { name: "Periksa buku kerja", exact: true }).click(); await G.waitForTimeout(4000);
console.log("S1 after check primaries:", await prim(G)); console.log("S1 text:", (await T(G)).match(/.{0,80}Bab \d.{0,60}/)?.[0]); await foto(G, "s1-periksa");
await G.getByRole("button", { name: "Simpan ke Studio", exact: true }).click(); await G.waitForTimeout(5000);
const paket = await G.locator('main a[href^="/studio/paket/"]').first().getAttribute("href"); console.log("S2 saved:", (await T(G)).match(/Tersimpan.{0,120}/)?.[0], paket);
for (let n = 0; n < 8; n++) {
  await buka(G, paket); await G.waitForTimeout(600);
  const st = norm(await G.locator(".pin-studio-h2").first().innerText().catch(() => "")) + " — " + norm(await G.locator(".pin-studio-h2 + .pin-ket").first().innerText().catch(() => ""));
  const panel = norm(await G.locator(".pin-lt-panel, [data-lt-panel]").first().innerText().catch(() => ""));
  const ps = await prim(G); console.log(`S3.${n} «${st}» primaries=[${ps}]\n     panel: ${panel.slice(0, 380)}`); await foto(G, `s3-${n}`);
  if (/Menunggu orang lain/.test(st) || !ps) break;
  const before = st; await G.locator("main button.pin-primary").first().click(); await G.waitForTimeout(5000);
}
await buka(G, "/studio"); console.log("S4 author home:", (await T(G)).slice(0, 400)); await foto(G, "s4-home");
// ===== REVIEWER
const { page: H } = await masuk(browser, HOD);
await buka(H, "/studio"); console.log("R1 reviewer home:", (await T(H)).slice(0, 400)); await foto(H, "r1-home");
await buka(H, paket); console.log("R2 reviewer paket:", (await T(H)).slice(0, 600)); console.log("R2 primaries:", await prim(H)); await foto(H, "r2-paket");
wf(`${OUTV}/paket.txt`, paket);
await browser.close();
