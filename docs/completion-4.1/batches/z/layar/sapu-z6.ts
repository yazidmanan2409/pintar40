/**
 * Z6 · THE FRAMED-OVERFLOW SWEEP (R-11; Daisy, Z-SIAP-DAISY-7ba18b03 §2; Bob, Z6's assignment). ONE COMMAND:
 *
 *   PINTAR_SELFTEST_RSC=1 npx tsx --conditions=react-server docs/completion-4.1/batches/z/layar/sapu-z6.ts <label> [out.txt]
 *
 * Against `next start` on port 3999 (or SAPU_ASAL) and a local stack, with the selftest's environment. Every page that
 * draws a `pin-tabel-bingkai` or a `pin-seg` (found from the source, listed below with the file that draws it) is opened
 * at 390 and 320 px by the person who reaches it, and measured with the rendered-check helper's own BINGKAI
 * (audit/a11y.mjs): a box inside `main` that scrolls sideways holding more than its width, or a part wider than the
 * window. Each line says PASS or FAIL; a page that could not be reached says so, with why. The pages covered and not
 * covered are listed at the end, so a re-run (after Second Eye's second integration merge) shows what it saw.
 *
 * N-8 (Daisy, C2w notes review): on Studio's package page at 320 every nested disclosure is opened and the width left
 * to its content is recorded with the paddings around it.
 *
 * The world: A1's screen fixture (a Kelas with Pemetaan Awal and Uji Penguasaan, eight learners; three sittings started
 * here) and C1w's draft package, both in the seeded learning-cycle school; removed after the run. SAPU_DIAM=<prefix>
 * also saves each page at each width.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { createRequire } from "node:module";
import { psql } from "../../../../../selftest/bob26.test";
import { bersihkan as bersihkanA1, dunia as duniaA1, muat as muatA1, mulai } from "../../../../../selftest/a1-layar.test";
import { ADMIN, GURU, KADEP, bersihkan as bersihkanC1w, dunia as duniaC1w, masuk, muat as muatC1w, sebagai, soalDi, terbitkan } from "../../../../../selftest/c1w-layar.test";

const { chromium } = createRequire(__filename)("playwright");
const ASAL = process.env.SAPU_ASAL ?? "http://127.0.0.1:3999";
const AKAR = join(__dirname, "..", "..", "..", "..", "..");
// Daisy's Z6 ruling: 1280 too (a segmented control scrolled there as well)
const LEBAR = [1280, 390, 320] as const;
const hasil: string[] = [];
const tercakup: string[] = [];
const tidak: string[] = [];
let gagal = 0;
const periksa = (ok: boolean, teks: string) => { hasil.push(`${ok ? "PASS" : "FAIL"}  ${teks}`); if (!ok) gagal++; };

/** The files that draw a framed table or a segmented control, read from the source (so a new one is not missed). */
function penggambar(): string[] {
  const semua: string[] = [];
  const jalan = (d: string) => { for (const n of readdirSync(d)) { const f = join(d, n); if (statSync(f).isDirectory()) jalan(f); else if (/\.tsx$/.test(n)) semua.push(f); } };
  jalan(join(AKAR, "src"));
  return semua.filter((f) => /pin-tabel-bingkai|pin-seg\b/.test(readFileSync(f, "utf8"))).map((f) => relative(AKAR, f)).sort();
}

(async () => {
  type Bingkai = { lebar: number; sebab: string[] } | null;
  const { BINGKAI, bingkaiBaru } = await import(join(AKAR, "audit", "a11y.mjs")) as { BINGKAI: () => Bingkai; bingkaiBaru: (p: string, b: Bingkai) => Bingkai };
  hasil.push(`# the files that draw pin-tabel-bingkai or pin-seg: ${penggambar().join(", ")}`);
  muatA1(AKAR);
  muatC1w(AKAR);
  const tag = `z6${Date.now().toString(36)}`;
  const a1 = duniaA1(tag);
  if (typeof a1 === "string") throw new Error(`A1's world: ${a1}`);
  // three open sittings on the Pemetaan Awal, as A1's own walks start them, so «Siapa» has rows with their lines and «Atur»
  for (const nama of ["buka", "serah", "dinilai"]) mulai(a1.murid[nama].uid, a1.pre, 2);
  // Daisy's Z6 ruling (6): «Siapa» pages at 50; 45 more learners (no account) so «Berikutnya» exists and can be walked.
  // Named «Murid A1 …», so A1's own cleanup ends their places; the people themselves are removed after the run.
  psql(`do $$ declare m record; v_p uuid; v_e uuid; begin
      perform set_config('app.seed_intent', 'synthetic', true);
      select e.institution_id, e.academic_period_id, e.programme_id into m from public.memberships mm join public.enrollments e on e.id = mm.enrollment_id
        where mm.node_id = '${a1.kelas}' and mm.valid_to is null limit 1;
      for i in 1..45 loop
        insert into public.persons (display_name) values ('Murid A1 Tambah ' || lpad(i::text, 2, '0') || ' ${tag}') returning id into v_p;
        insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status) values (v_p, m.institution_id, m.academic_period_id, m.programme_id, 'ACTIVE') returning id into v_e;
        insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, '${a1.kelas}', m.academic_period_id);
      end loop; end $$`);
  const c1 = duniaC1w(tag, `C1W layar Z6 ${tag}`);
  if (typeof c1 === "string") throw new Error(`C1w's world: ${c1}`);
  const guru = await masuk(ASAL, GURU, `MENGAJAR:${a1.inst}`);
  const admin = await masuk(ASAL, ADMIN, `MENGELOLA:${a1.inst}`);
  // Studio, N-8: the package published, a reviewer's note on option B replaced once (so «Catatan sebelumnya» nests inside
  // «Catatan peninjau», beside «Riwayat soal»), read by the head of department as C2W-B3 reads it
  terbitkan(c1.course);
  const soal = soalDi(c1.course, "Pertanyaan awal nomor 1");
  const tulis = (ganti: string) => /([0-9a-f-]{36})/.exec(sebagai(KADEP.identitas,
    `select public.catatan_peninjau_tulis(${"'" + soal + "'"}, 'B', 'Pilihan ini sering dipilih karena murid menyamakan pembilang dengan penyebut; ingatkan bahwa bagian yang sama besar menentukan nilainya.', ${ganti}) ->> 'id'`))?.[1] ?? "";
  const n1 = tulis("null");
  tulis(`'${n1}'`);
  const peninjau = await masuk(ASAL, KADEP, `MENGELOLA:${c1.inst}`);
  if (typeof guru === "string" || typeof admin === "string" || typeof peninjau === "string") throw new Error(`${guru} / ${admin} / ${peninjau}`);
  void GURU;
  const koreksi = psql(`select coalesce((select id::text from public.key_corrections where status = 'PENDING' limit 1), '')`);
  // [address, who, drawn by]
  const halaman: Array<[string, unknown, string]> = [
    [`/mengajar/${a1.kelas}`, guru, "Koleksi (the class's learners)"],
    [`/mengajar/${a1.kelas}/siapa?penugasan=${a1.pre}`, guru, "Koleksi + pin-seg pin-seg-tautan (Pemetaan Awal)"],
    [`/mengajar/${a1.kelas}/siapa?penugasan=${a1.post}`, guru, "Koleksi + pin-seg pin-seg-tautan (Uji Penguasaan)"],
    [`/mengajar/${a1.kelas}/uji-cepat`, guru, "pin-seg (the window's minutes)"],
    [`/mengajar/${a1.kelas}/uji-cepat/hasil`, guru, "Koleksi (a Quick Assessment's results)"],
    ["/aktivasi/orang", admin, "Koleksi (people)"],
    ["/konfigurasi/catatan-masuk", admin, "pin-tabel-bingkai (the sign-in record)"],
    ["/konfigurasi/sertifikat", admin, "Koleksi (certificates)"],
    ["/konfigurasi/audit", admin, "pin-tabel-bingkai (Jejak audit)"],
    [`/studio/paket/${c1.course}`, peninjau, "SoalKerja (a lesson's questions); N-8's nested disclosures"],
    ...(koreksi ? [[`/studio/tinjau/kunci/${koreksi}`, admin, "SoalKerja (a key correction)"] as [string, unknown, string]] : []),
  ];
  if (!koreksi) tidak.push("/studio/tinjau/kunci/[koreksi] (SoalKerja): not reached, no pending key correction in this database");
  const browser = await chromium.launch();
  try {
    for (const [alamat, siapa, apa] of halaman) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 900 } });
      await ctx.addCookies([...(siapa as { kue: Map<string, string> }).kue].map(([name, value]) => ({ name, value, url: ASAL })));
      const p = await ctx.newPage();
      const r = await p.goto(`${ASAL}${alamat}`, { waitUntil: "networkidle" });
      const ada = await p.evaluate(`document.querySelectorAll("main .pin-tabel-bingkai, main .pin-seg").length`) as number;
      const label = alamat.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/g, ":id");
      const n8 = alamat.startsWith("/studio/paket/");
      if (!r || r.status() >= 400 || (ada === 0 && !n8)) {
        tidak.push(`${label} (${apa}): not reached as drawn (HTTP ${r?.status()}, ${ada} frame(s) or segmented control(s) in main: nothing to list here)`);
        await ctx.close();
        continue;
      }
      if (ada === 0) tidak.push(`${label} (${apa}): no frame drawn on this package (HTTP ${r.status()}); measured for N-8 only`);
      else tercakup.push(`${label} (${apa}): ${ada} frame(s) or segmented control(s)`);
      for (const w of ada === 0 ? [] : LEBAR) {
        await p.setViewportSize({ width: w, height: 900 });
        await p.waitForTimeout(250);
        const b = await p.evaluate(BINGKAI);
        // the parts on the ruling 79 audit list (audit/a11y.mjs BINGKAI_DIKETAHUI) are reported as AUDIT, as the crawl does
        const baru = bingkaiBaru(alamat, b);
        const dikenal = b ? b.sebab.filter((x: string) => !(baru?.sebab ?? []).includes(x)) : [];
        if (dikenal.length) hasil.push(`AUDIT ${label} at ${w}: ${dikenal.join("; ")} (on the ruling 79 audit list)`);
        periksa(baru === null, `${label} at ${w}: ${baru ? baru.sebab.join("; ") : dikenal.length ? "nothing else inside main scrolls sideways or is wider than the window" : "nothing inside main scrolls sideways or is wider than the window"}`);
        // Daisy's Z6 ruling: every option of a segmented control lies inside it, and its focus ring is cut by nothing around it
        const seg = await p.evaluate(`(() => {
          const out = [];
          for (const s of document.querySelectorAll("main .pin-seg")) {
            const k = s.getBoundingClientRect();
            if (k.width === 0 || k.height === 0) continue;
            for (const o of s.querySelectorAll(":scope > label, :scope > a")) {
              const r = o.getBoundingClientRect();
              if (r.left < k.left - 1 || r.right > k.right + 1 || r.top < k.top - 1 || r.bottom > k.bottom + 1) out.push("«" + o.textContent.trim() + "» lies outside its control");
              const f = o.querySelector("input") ?? o; f.focus({ preventScroll: true });
              const g = (o.querySelector("span") ?? o).getBoundingClientRect(); const w = 3;
              for (let a = o.parentElement; a && a.tagName !== "BODY"; a = a.parentElement) {
                const c = getComputedStyle(a); if (c.overflowX === "visible" && c.overflowY === "visible") continue;
                const b = a.getBoundingClientRect();
                if (g.left - w < b.left - 0.5 || g.right + w > b.right + 0.5 || g.top - w < b.top - 0.5 || g.bottom + w > b.bottom + 0.5) { out.push("«" + o.textContent.trim() + "»'s focus ring is cut by " + a.tagName.toLowerCase() + "." + [...a.classList].join(".")); break; }
              }
            }
          }
          document.activeElement?.blur?.();
          return out;
        })()`) as string[];
        if (await p.evaluate(`document.querySelectorAll("main .pin-seg").length`) as number > 0) {
          periksa(seg.length === 0, `${label} at ${w}: ${seg.length ? seg.join("; ") : "every option of its segmented controls lies inside the control, its focus ring uncut"}`);
        }
        // Daisy's Z6 ruling: no link mark (TandaTautan) draws a box of its own
        const tanda = await p.evaluate(`[...document.querySelectorAll(".pin-tanda-tautan")].filter((t) => { const r = t.getBoundingClientRect(); return r.width > 2 && r.height > 2; }).length`) as number;
        periksa(tanda === 0, `${label} at ${w}: ${tanda} link mark(s) drawn as a box of their own`);
        // Daisy's Z6 ruling (6): below 640 px, after «Berikutnya» (by keyboard), the reader lands at the collection
        if (w < 640 && /siapa/.test(alamat)) {
          const tujuan = await p.evaluate(`(() => { const k = document.querySelector(".pin-koleksi[id]"); return k ? k.id : ""; })()`) as string;
          const lanjut = p.locator("a[rel=next]:visible").first();
          if ((await lanjut.count()) === 0) { periksa(false, `${label} at ${w}: no «Berikutnya» to walk`); continue; }
          await lanjut.focus();
          await p.keyboard.press("Enter");
          await p.waitForURL(/hal=2/, { timeout: 15000 });
          await p.waitForLoadState("networkidle");
          await p.waitForTimeout(400);
          const di = await p.evaluate(`(() => { const k = document.getElementById(${JSON.stringify(tujuan)}); if (!k) return null; const r = k.getBoundingClientRect();
            const blok = k.querySelector(".pin-koleksi-tumpuk"); const d = document.documentElement;
            const bar = document.querySelector("header.pin-staf"); const bawahBar = bar && getComputedStyle(bar).position === "sticky" ? Math.round(bar.getBoundingClientRect().bottom) : 0;
            return { atas: Math.round(r.top), bawahBar, tampak: r.height > 0, blok: blok ? getComputedStyle(blok).display : "none",
              ujung: Math.ceil(window.scrollY + window.innerHeight) >= d.scrollHeight - 1, layar: window.innerHeight }; })()`) as { atas: number; bawahBar: number; tampak: boolean; blok: string; ujung: boolean; layar: number } | null;
          // it is scrolled to the top of the view, or, where the page ends before that, the page is at its end with it in view
          // and it is not under the phone's sticky bar
          periksa(di !== null && di.tampak && di.atas >= di.bawahBar && (di.atas < di.bawahBar + 200 || (di.ujung && di.atas < di.layar - 100)) && di.blok !== "none",
            `${label} at ${w}: the pager's target #${tujuan} is the collection the reader lands on (${JSON.stringify(di)})`);
          await p.goto(`${ASAL}${alamat}`, { waitUntil: "networkidle" });
        }
        if (process.env.SAPU_DIAM) await p.screenshot({ path: `${process.env.SAPU_DIAM}${label.replace(/[^a-z0-9]+/gi, "_")}-${w}.png`, fullPage: true });
      }
      if (n8) {
        // N-8: every disclosure opened, at 320, the width its content is left, and the paddings that take it
        await p.setViewportSize({ width: 320, height: 900 });
        const n8 = await p.evaluate(`(() => {
          for (const d of document.querySelectorAll("main details")) d.open = true;
          return [...document.querySelectorAll("main details")].map((d) => {
            const r = d.getBoundingClientRect();
            const rantai = [];
            for (let a = d; a && a.tagName !== "MAIN"; a = a.parentElement) {
              const c = getComputedStyle(a); const pl = parseFloat(c.paddingLeft) + parseFloat(c.paddingRight) + parseFloat(c.borderLeftWidth) + parseFloat(c.borderRightWidth);
              if (pl > 0) rantai.push((a.className.split(" ")[0] || a.tagName.toLowerCase()) + ":" + Math.round(pl));
            }
            return { kelas: d.className, lebar: Math.round(r.width), rantai };
          });
        })()`) as Array<{ kelas: string; lebar: number; rantai: string[] }>;
        if (process.env.SAPU_DIAM) await p.screenshot({ path: `${process.env.SAPU_DIAM}n8-320.png`, fullPage: true });
        if (n8.length === 0) hasil.push(`N-8   ${label} at 320: no nested disclosure on this package`);
        for (const x of n8) hasil.push(`N-8   ${label} at 320: details.${x.kelas.replace(/ /g, ".")} is ${x.lebar} px wide; paddings and borders around it (inner first): ${x.rantai.join(", ")}`);
      }
      await ctx.close();
    }
  } catch (e) {
    periksa(false, `the sweep stopped: ${(e as Error).message.split("\n")[0]}`);
  } finally {
    await browser.close();
    bersihkanA1();
    psql(`begin; set local session_replication_role = replica; delete from public.persons where display_name like 'Murid A1 Tambah % ${tag}'; commit;`);
    bersihkanC1w();
    const teks = [`# ${process.argv[2] ?? ""}`, ...hasil, "", `## covered (${tercakup.length})`, ...tercakup.map((x) => `- ${x}`),
      "", `## not covered (${tidak.length})`, ...tidak.map((x) => `- ${x}`), "", gagal ? `RED: ${gagal} framed overflow(s)` : "GREEN"].join("\n");
    console.log(teks);
    if (process.argv[3]) writeFileSync(process.argv[3], teks + "\n");
    process.exit(gagal ? 1 : 0);
  }
})().catch((e) => { console.error(e); process.exit(1); });
