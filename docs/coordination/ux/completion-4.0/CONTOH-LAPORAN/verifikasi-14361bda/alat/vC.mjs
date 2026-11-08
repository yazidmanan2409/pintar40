const browser = await chromium.launch();
const { page: A } = await masuk(browser, ORANG.admin, { width: 390, height: 900 });
await buka(A, "/pendataan"); await A.locator('input[type="file"]').first().setInputFiles("../verif2/kelas.csv"); await A.waitForTimeout(1200);
const b = A.getByRole("button", { name: "Lanjut ke pemeriksaan" }); await b.scrollIntoViewIfNeeded();
const box = await b.boundingBox(); await A.screenshot({ path: "../verif2/p3-tanpa-kelas-dekat-390.png", clip: { x: 0, y: Math.max(0, box.y - 330), width: 390, height: 400 } });
console.log("staf option:", (await A.locator("main label, main input[type=checkbox]").allInnerTexts()).filter((x) => /guru atau staf/i.test(x)));
await browser.close();
