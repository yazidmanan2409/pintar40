/**
 * N-17 (Daisy, Z4 review; R-26 item 4's sibling): a server-action button keeps its width from the captured submit until
 * its VERB returns, through «✓ {selesai}» too. Measured as r26-tekan.ts measures, keyboard only, at 1280 px.
 *
 * The button is «Minta membaca lagi» (the teacher's request to read again), whose result word «✓ Terkirim» is shorter.
 * The world: the bootstrap school's learner with an official Uji Penguasaan below target (selftest.boot_attempt(false)),
 * read by the bootstrap school's teacher. Run against `next start` on port 3999 (or N17_ASAL), with the selftest's env:
 *   PINTAR_SELFTEST_RSC=1 npx tsx --conditions=react-server docs/completion-4.1/batches/z/layar/n17-lebar.ts <label>
 */
import { join } from "node:path";
import { createRequire } from "node:module";
import { lit, psql } from "../../../../../selftest/bob26.test";
import { BOOT_GURU, masuk } from "../../../../../selftest/c1w-layar.test";

const { chromium } = createRequire(__filename)("playwright");
const ASAL = process.env.N17_ASAL ?? "http://127.0.0.1:3999";
const AKAR = join(__dirname, "..", "..", "..", "..", "..");
const hasil: string[] = [];
let gagal = 0;
const periksa = (ok: boolean, teks: string) => { hasil.push(`${ok ? "PASS" : "FAIL"}  ${teks}`); if (!ok) gagal++; };
const jeda = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  for (const f of ["fable01.sql", "fable03.sql", "fable04.sql"]) psql(`\\i ${join(AKAR, "selftest", "db", f)}`);
  psql(`begin; set local session_replication_role = replica;
    delete from public.certificate_reviews where institution_id in (select id from public.institutions where official_evidence_purpose = 'D1_ENGINEERING_BOOTSTRAP');
    commit; select selftest.purge_certificates();`);
  const sesi = psql("select selftest.boot_attempt(false)").split("\n").pop()!.trim();
  const [kelas, orang, sekolah] = psql(`select concat_ws('|', aa.node_id, s.person_id, s.institution_id) from public.assessment_sessions s
    join public.assessment_assignments aa on aa.id = s.assessment_assignment_id where s.id = ${lit(sesi)}`).split("|");
  const guru = await masuk(ASAL, BOOT_GURU, `MENGAJAR:${sekolah}`);
  if (typeof guru === "string") throw new Error(guru);
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addCookies([...(guru as unknown as { kue: Map<string, string> }).kue].map(([name, value]) => ({ name, value, url: ASAL })));
    const p = await ctx.newPage();
    await p.goto(`${ASAL}/mengajar/${kelas}/murid/${orang}`, { waitUntil: "networkidle" });
    const ke = await p.locator("a.pin-ulang-tautan").first().getAttribute("href");
    if (!ke) throw new Error("the teacher's page offers no «Minta membaca lagi» for the below-target learner");
    await p.goto(`${ASAL}${ke}`, { waitUntil: "networkidle" });
    const b = p.locator("form button[type=submit]").last();
    const diam = await b.boundingBox();
    const teksDiam = (await b.textContent())?.trim();
    await b.focus();
    await p.keyboard.press("Enter");
    await p.waitForURL(/ulang=ok/, { timeout: 20000 });
    await p.waitForFunction(() => /Terkirim|Sent/.test(document.querySelector("form button[type=submit]:last-of-type")?.textContent ?? "") || true);
    await jeda(500);
    const sesudah = { kotak: await b.boundingBox(), teks: (await b.textContent())?.trim(), keadaan: await b.getAttribute("data-keadaan") };
    periksa(sesudah.keadaan === "selesai" && /Terkirim/.test(sesudah.teks ?? ""), `N-17 the button shows its result «${sesudah.teks}» (data-keadaan=${sesudah.keadaan})`);
    periksa(diam !== null && sesudah.kotak !== null && sesudah.kotak.width >= diam.width - 0.5,
      `N-17 «${teksDiam}» does not narrow when it shows «${sesudah.teks}» (rest ${diam?.width.toFixed(1)} px, after ${sesudah.kotak?.width.toFixed(1)} px)`);
    // the verb returns once a tick changes, and with it the width is the button's own again
    await p.locator("form input[type=checkbox]").first().focus();
    await p.keyboard.press("Space");
    await jeda(300);
    const kembali = { kotak: await b.boundingBox(), teks: (await b.textContent())?.trim() };
    periksa(kembali.teks === teksDiam && kembali.kotak !== null && diam !== null && Math.abs(kembali.kotak.width - diam.width) < 0.5,
      `N-17 after a change the verb «${kembali.teks}» returns at its own width (${kembali.kotak?.width.toFixed(1)} px)`);
  } catch (e) {
    periksa(false, `the walk stopped: ${(e as Error).message.split("\n")[0]}`);
  } finally {
    await browser.close();
    console.log(`# ${process.argv[2] ?? ""}\n${hasil.join("\n")}`);
    process.exit(gagal ? 1 : 0);
  }
})().catch((e) => { console.error(e); process.exit(1); });
