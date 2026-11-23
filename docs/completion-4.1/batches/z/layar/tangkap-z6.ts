/**
 * Z6 (stream B) captures for Daisy: R-11 («Siapa» as blocks below 640 px; the instrument switch wrapping below 360 px)
 * and N-8 (Studio's nested disclosures at 320 px), keyboard only. Widths 1280, 390 and 320, and 360 and 359 for the
 * switch's boundary. Each shot's overflow (the window's and BINGKAI's, inside main), focus, live text and the changed
 * part go to CATATAN-Z6.txt.
 *
 *   PINTAR_SELFTEST_RSC=1 npx tsx --conditions=react-server docs/completion-4.1/batches/z/layar/tangkap-z6.ts
 *
 * Against `next start` of this branch on port 3999 and a local stack, with the selftest's environment. The world is the
 * sweep's (sapu-z6.ts): A1's Kelas with three open sittings on its Pemetaan Awal, and C1w's package, published, with a
 * reviewer's note on option B replaced once; removed after the run.
 */
import { writeFileSync } from "node:fs";
import { psql } from "../../../../../selftest/bob26.test";
import { join } from "node:path";
import { createRequire } from "node:module";
import { bersihkan as bersihkanA1, dunia as duniaA1, muat as muatA1, mulai } from "../../../../../selftest/a1-layar.test";
import { GURU, KADEP, bersihkan as bersihkanC1w, dunia as duniaC1w, masuk, muat as muatC1w, sebagai, soalDi, terbitkan } from "../../../../../selftest/c1w-layar.test";

const { chromium } = createRequire(__filename)("playwright");
type Browser = Awaited<ReturnType<typeof chromium.launch>>;
type Page = Awaited<ReturnType<Awaited<ReturnType<Browser["newContext"]>>["newPage"]>>;
const ASAL = "http://127.0.0.1:3999";
const AKAR = join(__dirname, "..", "..", "..", "..", "..");
const KE = __dirname;
const catatan: string[] = [];
const jeda = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const { BINGKAI } = await import(join(AKAR, "audit", "a11y.mjs")) as { BINGKAI: () => { sebab: string[] } | null };
  async function rekam(p: Page, nama: string, w: number, lain = "") {
    const info = await p.evaluate(`(() => {
      const el = document.activeElement;
      const live = [...document.querySelectorAll('[role="status"],[role="alert"],[aria-live]')].map((x) => (x.textContent || "").trim()).filter(Boolean).join(" | ");
      return { lebih: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        fokus: el ? el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + " «" + (el.textContent || el.value || "").trim().slice(0, 60) + "»" : "none",
        live: live.slice(0, 200) }; })()`) as { lebih: number; fokus: string; live: string };
    const b = await p.evaluate(BINGKAI);
    catatan.push(`${nama}-${w}\toverflow ${info.lebih}px\tinside main: ${b ? b.sebab.join("; ") : "none"}\tfocus ${info.fokus}\tlive «${info.live}»${lain ? "\t" + lain : ""}`);
    await p.screenshot({ path: join(KE, `z6-${nama}-${w}.png`) });
  }
  // fable04 before A1's fixtures: fable06 asks for it, and a freshly reset database has not seen it
  for (const f of ["fable01.sql", "fable03.sql", "fable04.sql"]) psql(`\\i ${join(AKAR, "selftest", "db", f)}`);
  muatA1(AKAR);
  muatC1w(AKAR);
  const tag = `z6c${Date.now().toString(36)}`;
  const a1 = duniaA1(tag);
  if (typeof a1 === "string") throw new Error(a1);
  for (const nama of ["buka", "serah", "dinilai"]) mulai(a1.murid[nama].uid, a1.pre, 2);
  // Daisy's Z6 ruling (6): 45 more learners (no account), so «Siapa» has a second page to walk to; removed after the run
  psql(`do $$ declare m record; v_p uuid; v_e uuid; begin
      perform set_config('app.seed_intent', 'synthetic', true);
      select e.institution_id, e.academic_period_id, e.programme_id into m from public.memberships mm join public.enrollments e on e.id = mm.enrollment_id
        where mm.node_id = '${a1.kelas}' and mm.valid_to is null limit 1;
      for i in 1..45 loop
        insert into public.persons (display_name) values ('Murid A1 Tambah ' || lpad(i::text, 2, '0') || ' ${tag}') returning id into v_p;
        insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status) values (v_p, m.institution_id, m.academic_period_id, m.programme_id, 'ACTIVE') returning id into v_e;
        insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, '${a1.kelas}', m.academic_period_id);
      end loop; end $$`);
  const c1 = duniaC1w(tag, `C1W layar Z6c ${tag}`);
  if (typeof c1 === "string") throw new Error(c1);
  terbitkan(c1.course);
  const soal = soalDi(c1.course, "Pertanyaan awal nomor 1");
  const tulis = (ganti: string) => /([0-9a-f-]{36})/.exec(sebagai(KADEP.identitas,
    `select public.catatan_peninjau_tulis('${soal}', 'B', 'Pilihan ini sering dipilih karena murid menyamakan pembilang dengan penyebut; ingatkan bahwa bagian yang sama besar menentukan nilainya.', ${ganti}) ->> 'id'`))?.[1] ?? "";
  tulis(`'${tulis("null")}'`);
  const guru = await masuk(ASAL, GURU, `MENGAJAR:${a1.inst}`);
  const kadep = await masuk(ASAL, KADEP, `MENGELOLA:${c1.inst}`);
  if (typeof guru === "string" || typeof kadep === "string") throw new Error(`${guru} / ${kadep}`);
  const browser = await chromium.launch();
  const halaman = async (k: unknown, w: number) => {
    const ctx = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: w, height: 900 } });
    await ctx.addCookies([...(k as { kue: Map<string, string> }).kue].map(([name, value]) => ({ name, value, url: ASAL })));
    return ctx.newPage();
  };
  const siapa = (aa: string) => `${ASAL}/mengajar/${a1.kelas}/siapa?penugasan=${aa}`;
  try {
    for (const w of [1280, 390, 360, 359, 320]) {
      const p = await halaman(guru, w);
      await p.goto(siapa(a1.pre), { waitUntil: "networkidle" });
      // the switch, by keyboard: the other instrument's option takes focus
      const pilihan = p.locator("nav[data-instrumen] a");
      await pilihan.nth(1).focus();
      const tata = await p.evaluate(`(() => { const a = [...document.querySelectorAll("nav[data-instrumen] a")].map((x) => x.getBoundingClientRect());
        return a.length === 2 ? (Math.abs(a[0].top - a[1].top) < 2 ? "one row" : "one option a line") : a.length + " options"; })()`) as string;
      await p.locator("nav[data-instrumen]").scrollIntoViewIfNeeded();
      await rekam(p, "01-siapa-pemetaan", w, `switch: ${tata}\tcurrent: ${await p.locator("nav[data-instrumen] a[aria-current=page]").innerText()}`
        + `\tlearners as: ${await p.evaluate(`getComputedStyle(document.querySelector(".pin-koleksi-tumpuk")).display === "none" ? "the table" : "blocks"`)}`);
      await p.keyboard.press("Enter");
      await p.waitForURL(new RegExp(a1.post), { timeout: 15000 });
      await p.waitForLoadState("networkidle");
      await p.locator("nav[data-instrumen] a[aria-current=page]").focus();
      await rekam(p, "02-siapa-uji", w, `current: ${await p.locator("nav[data-instrumen] a[aria-current=page]").innerText()}`);
      if (w === 360 || w === 359) continue;
      // the way into a learner's sitting: «Atur» on its row or block, by keyboard, opens the panel under the list
      await p.goto(siapa(a1.pre), { waitUntil: "networkidle" });
      const atur = p.locator("[data-atur-buka]:visible").first();
      await atur.focus();
      await atur.scrollIntoViewIfNeeded();
      await rekam(p, "03-siapa-blok", w, `blocks: ${await p.locator(".pin-koleksi-tumpuk > li:visible").count()}\tfirst block: «${(await p.locator(".pin-koleksi-tumpuk > li").first().innerText()).replace(/\s+/g, " ").slice(0, 160)}»`);
      await p.keyboard.press("Enter");
      await p.waitForURL(/sesi=/, { timeout: 15000 });
      await p.waitForLoadState("networkidle");
      await jeda(300);
      await p.locator("#atur").scrollIntoViewIfNeeded().catch(() => undefined);
      await rekam(p, "04-siapa-atur", w, `panel: ${(await p.locator("#atur").count()) > 0}`);
      await p.context().close();
    }
    // Daisy's Z6 ruling: a segmented control wraps between whole options and never scrolls. Uji Cepat's minutes (focus on
    // the last option) at 1280, 390 and 320; «Siapa»'s state filter at 1280 (focus on its last option)
    for (const w of [1280, 390, 320]) {
      const p = await halaman(guru, w);
      await p.goto(`${ASAL}/mengajar/${a1.kelas}/uji-cepat`, { waitUntil: "networkidle" });
      const menit = p.locator("main .pin-seg:not(.pin-seg-tautan):not(.pin-lebar-saja) input").last();
      if ((await menit.count()) > 0) {
        await menit.focus();
        await p.locator("main .pin-seg:not(.pin-seg-tautan):not(.pin-lebar-saja)").first().scrollIntoViewIfNeeded();
        await rekam(p, "06-uji-cepat-menit", w, `options: ${(await p.locator("main .pin-seg:not(.pin-seg-tautan):not(.pin-lebar-saja) label").allInnerTexts()).join(" | ")}`);
      } else catatan.push(`06-uji-cepat-menit-${w}\tthe minutes control was not on the page`);
      if (w === 1280) {
        await p.goto(siapa(a1.pre), { waitUntil: "networkidle" });
        const saring = p.locator("main .pin-seg.pin-lebar-saja input").last();
        await saring.focus();
        await p.locator("main .pin-seg.pin-lebar-saja").scrollIntoViewIfNeeded();
        await rekam(p, "07-siapa-saring", w, `options: ${(await p.locator("main .pin-seg.pin-lebar-saja label").allInnerTexts()).join(" | ")}`);
      } else {
        // (6): below 640 px, «Berikutnya» by keyboard lands the reader at the collection, its blocks in view
        await p.goto(siapa(a1.pre), { waitUntil: "networkidle" });
        const lanjut = p.locator("a[rel=next]:visible").first();
        await lanjut.focus();
        await p.keyboard.press("Enter");
        await p.waitForURL(/hal=2/, { timeout: 15000 });
        await p.waitForLoadState("networkidle");
        await jeda(400);
        const di = await p.evaluate(`(() => { const k = document.querySelector(".pin-koleksi[id]"); return k ? k.id + " at " + Math.round(k.getBoundingClientRect().top) + " px" : "none"; })()`);
        await rekam(p, "08-siapa-berikutnya", w, `the collection: ${di}`);
      }
      await p.context().close();
    }
    // N-8: the notes in Studio, opened by keyboard
    for (const w of [1280, 390, 320]) {
      const p = await halaman(kadep, w);
      await p.goto(`${ASAL}/studio/paket/${c1.course}`, { waitUntil: "networkidle" });
      const ringkas = p.locator("details.pin-catatan-peninjau > summary").first();
      await ringkas.focus();
      await p.keyboard.press("Enter");
      await jeda(300);
      await ringkas.scrollIntoViewIfNeeded();
      const lebar = await p.locator("details.pin-catatan-peninjau").first().evaluate((d: HTMLElement) => Math.round(d.getBoundingClientRect().width));
      await rekam(p, "05-paket-catatan", w, `«Catatan peninjau» is ${lebar} px wide`);
      await p.context().close();
    }
  } finally {
    await browser.close();
    bersihkanA1();
    psql(`begin; set local session_replication_role = replica; delete from public.persons where display_name like 'Murid A1 Tambah % ${tag}'; commit;`);
    bersihkanC1w();
    writeFileSync(join(KE, "CATATAN-Z6.txt"), catatan.join("\n") + "\n");
  }
})().catch((e) => { console.error(e); process.exit(1); });
