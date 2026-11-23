/**
 * After merge 2 (Bob; Second Eye, in passing): «target 60 %» on «Minta membaca lagi» (/mengajar/[kelas]/ulang) at 320,
 * captured for Daisy to judge (not changed). Keyboard only, at 1280, 390 and 320; notes to CATATAN-ULANG.txt.
 *
 *   PINTAR_SELFTEST_RSC=1 npx tsx --conditions=react-server docs/completion-4.1/batches/z/layar/tangkap-ulang.ts
 *
 * The world: the bootstrap learner's finished Uji Penguasaan below target (selftest.boot_attempt(false), or the learner's
 * latest finished sitting when there is one), read by the bootstrap teacher, as n17-lebar.ts reads it.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { psql } from "../../../../../selftest/bob26.test";
import { BOOT_GURU, masuk } from "../../../../../selftest/c1w-layar.test";

const { chromium } = createRequire(__filename)("playwright");
const ASAL = "http://127.0.0.1:3999";
const AKAR = join(__dirname, "..", "..", "..", "..", "..");
const KE = __dirname;
const catatan: string[] = [];

(async () => {
  for (const f of ["fable01.sql", "fable03.sql", "fable04.sql"]) psql(`\\i ${join(AKAR, "selftest", "db", f)}`);
  const ada = psql(`select coalesce((select s.id::text from public.assessment_sessions s join public.accounts a on a.person_id = s.person_id
    join auth.users u on u.id = a.auth_user_id where u.email = 'boot-siswa@bootstrap.pintar.test' and s.finalized_at is not null order by s.created_at desc limit 1), '')`);
  const sesi = ada || psql("select selftest.boot_attempt(false)").split("\n").pop()!.trim();
  const [kelas, orang, sekolah] = psql(`select concat_ws('|', aa.node_id, s.person_id, s.institution_id) from public.assessment_sessions s
    join public.assessment_assignments aa on aa.id = s.assessment_assignment_id where s.id = '${sesi}'`).split("|");
  const guru = await masuk(ASAL, BOOT_GURU, `MENGAJAR:${sekolah}`);
  if (typeof guru === "string") throw new Error(guru);
  const browser = await chromium.launch();
  try {
    for (const w of [1280, 390, 320]) {
      const ctx = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: w, height: 900 } });
      await ctx.addCookies([...(guru as unknown as { kue: Map<string, string> }).kue].map(([name, value]) => ({ name, value, url: ASAL })));
      const p = await ctx.newPage();
      await p.goto(`${ASAL}/mengajar/${kelas}/murid/${orang}`, { waitUntil: "networkidle" });
      // the way there, by keyboard: Enter on the teacher's own «Minta membaca lagi» link
      const ke = p.locator("a.pin-ulang-tautan").first();
      await ke.focus();
      await p.keyboard.press("Enter");
      await p.waitForURL(/\/ulang\?/, { timeout: 15000 });
      await p.waitForLoadState("networkidle");
      await p.locator("form input[type=checkbox]").first().focus();
      const tata = await p.evaluate(`(() => {
        const t = [...document.querySelectorAll("main *")].find((e) => e.children.length === 0 && /^target\\s*\\d+\\s*%$/.test((e.textContent || "").trim()));
        const m = [...document.querySelectorAll("main *")].find((e) => e.children.length === 0 && (e.textContent || "").trim() === "Murid");
        if (!t) return "no lone «target …%» line";
        const a = t.getBoundingClientRect(), b = m ? m.getBoundingClientRect() : null;
        return "«" + t.textContent.trim() + "» <" + t.tagName.toLowerCase() + "." + t.className + "> at x " + Math.round(a.left) + ", y " + Math.round(a.top)
          + (b ? "; «Murid» at x " + Math.round(b.left) + ", y " + Math.round(b.top) + (a.top < b.top ? " (the target line is above it)" : "") : "");
      })()`);
      const lebih = await p.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth");
      catatan.push(`ulang-${w}\toverflow ${lebih}px\t${tata}`);
      await p.screenshot({ path: join(KE, `ulang-target-${w}.png`) });
      await ctx.close();
    }
  } finally {
    await browser.close();
    writeFileSync(join(KE, "CATATAN-ULANG.txt"), catatan.join("\n") + "\n");
  }
})().catch((e) => { console.error(e); process.exit(1); });
