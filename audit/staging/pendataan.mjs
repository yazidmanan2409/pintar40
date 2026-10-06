// STAGING ONLY. Pendataan as a school admin uses it: paste the names, choose the place and the role, check the list,
// confirm, and press on until «Selesai». Shared by golden-school-admin.mjs (GS-06, GS-07) and golden-school-laporan.mjs
// (GS-22, a learner added after the chapter is given). The page is already at /pendataan; it returns there.
import { SLOW } from "../perf/lib.mjs";

const rapikan = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

export async function catat(page, nama, { kelas = null, peran = null } = {}, { shot = async () => {} } = {}) {
  const jejak = [];
  await page.locator("#pin-tempel").fill(["nama", ...nama].join("\n"));
  await page.locator("#pin-medan-node_id").waitFor({ timeout: SLOW });
  if (kelas) {
    const tempat = await page.locator("#pin-medan-node_id option").evaluateAll((os) => os.map((o) => ({ v: o.value, t: (o.textContent ?? "").trim() })));
    const k = tempat.find((o) => o.v.startsWith("t:") && o.t.includes(kelas));
    if (!k) throw new Error(`«${kelas}» is not offered as a place: ${JSON.stringify(tempat.map((o) => o.t))}`);
    await page.locator("#pin-medan-node_id").selectOption(k.v);
    jejak.push(`Tempat «${k.t}»`);
  }
  if (peran) await page.locator("#pin-medan-role").selectOption(`t:${peran}`);
  await page.getByRole("button", { name: "Lanjut ke pemeriksaan", exact: true }).click();
  await page.waitForURL((u) => /^\/pendataan\/[^/]+$/.test(u.pathname), { timeout: SLOW });
  await page.getByRole("button", { name: "Periksa daftar ini", exact: true }).click();
  await page.getByRole("button", { name: "Ya, catat orang-orang ini", exact: true }).waitFor({ timeout: SLOW });
  await shot(page, "pendataan-pratinjau");
  await page.getByRole("button", { name: "Ya, catat orang-orang ini", exact: true }).click();
  for (let i = 0; i < 60; i++) {
    await page.waitForLoadState("networkidle");
    if (/· Selesai\b/.test(rapikan(await page.locator("main").innerText().catch(() => "")))) { jejak.push("«Selesai»"); break; }
    for (const tombol of ["Sudah saya periksa, lanjutkan sisanya", "Mulai mencatat", "Lanjutkan"]) {
      const b = page.getByRole("button", { name: tombol, exact: true });
      if (await b.count() && await b.first().isEnabled()) { await b.first().click(); jejak.push(`«${tombol}»`); break; }
    }
    await page.waitForTimeout(1000);
    if (i % 5 === 4) await page.reload({ waitUntil: "networkidle" });
  }
  await shot(page, "pendataan-selesai");
  // back to the list by the page's own link
  await page.locator('a.pin-back[href="/pendataan"]').first().click();
  await page.waitForURL((u) => u.pathname === "/pendataan", { timeout: SLOW });
  await page.waitForLoadState("networkidle");
  return `${nama.length} name(s) pasted; ${jejak.join(" → ")}`;
}
