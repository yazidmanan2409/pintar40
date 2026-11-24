/**
 * Z8 (stream B) · the verify-closed rows' rendered looks, keyboard only, at 1280, 390 and 320 px; notes to CATATAN-Z8.txt.
 *
 *   A1-R4  the approver's queue: the school admin's «Yang menunggu» line on Konfigurasi and the queue it opens; a head of
 *          department's line on their own home (Daisy, TINJAUAN-A1-C1W §A1·N1; R15-DAISY-7ba18b03: «one look»)
 *   A1-R2  where the teacher acts: the class page's «Ubah jadwal» (the «Siapa» page itself is Z6's z6-01 to z6-04)
 *   C1-R4  printing while a certificate is under review: the learner's certificate page on screen and as printed (print
 *          media), with its QR; K-05, the public check of the same certificate, in the same session (plan note 12)
 *
 *   PINTAR_SELFTEST_RSC=1 npx tsx --conditions=react-server docs/completion-4.1/batches/z/layar/tangkap-z8.ts
 *
 * Against `next start` of this branch on port 3999 and a local stack. The world: A1's screen fixture with two finished
 * sittings and one request for another attempt from each of the head of department and the teacher (as A1-A02 makes
 * them); the bootstrap learner's sealed certificate placed under review by a confirmed key correction (as Z3's K-05
 * captures make it). Both are removed after the run.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";
import { lit, psql } from "../../../../../selftest/bob26.test";
import { bersihkan as bersihkanA1, dunia as duniaA1, muat as muatA1, mulai, sebagai, sebagaiEmail } from "../../../../../selftest/a1-layar.test";
import { ADMIN, BOOT_SISWA, GURU, KADEP, masuk } from "../../../../../selftest/c1w-layar.test";

const { chromium } = createRequire(__filename)("playwright");
type Browser = Awaited<ReturnType<typeof chromium.launch>>;
type Page = Awaited<ReturnType<Awaited<ReturnType<Browser["newContext"]>>["newPage"]>>;
const ASAL = "http://127.0.0.1:3999";
const AKAR = join(__dirname, "..", "..", "..", "..", "..");
const KE = __dirname;
const LEBAR = [1280, 390, 320] as const;
const catatan: string[] = [];
const jeda = (ms: number) => new Promise((r) => setTimeout(r, ms));
const teksDi = async (p: Page, sel: string) => ((await p.locator(sel).allInnerTexts().catch(() => [])) as string[]).join(" / ").replace(/\s+/g, " ").slice(0, 300);

async function rekam(p: Page, nama: string, w: number, lain = "", penuh = false) {
  const info = await p.evaluate(`(() => { const el = document.activeElement;
    return { lebih: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      fokus: el ? el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + " «" + (el.textContent || "").trim().slice(0, 60) + "»" : "none" }; })()`) as { lebih: number; fokus: string };
  catatan.push(`${nama}-${w}\toverflow ${info.lebih}px\tfocus ${info.fokus}${lain ? "\t" + lain : ""}`);
  await p.screenshot({ path: join(KE, `z8-${nama}-${w}.png`), fullPage: penuh });
}
const bersihSertifikat = () => psql(`begin; set local session_replication_role = replica;
  delete from public.certificate_reviews where institution_id in (select id from public.institutions where official_evidence_purpose = 'D1_ENGINEERING_BOOTSTRAP');
  delete from public.key_corrections where reason = 'Z8 layar kunci tertukar saat diketik';
  commit; select selftest.purge_certificates();`);

(async () => {
  muatA1(AKAR);
  for (const f of ["fable01.sql", "fable03.sql", "fable04.sql"]) psql(`\\i ${join(AKAR, "selftest", "db", f)}`);
  const tag = `z8${Date.now().toString(36)}`;
  const d = duniaA1(tag);
  if (typeof d === "string") throw new Error(d);
  const m = d.murid;
  // A1-R4's world, as A1-A02 makes it: two finished sittings, one request from the head of department, one from the teacher
  const s1 = mulai(m.lagi.uid, d.pre, 5), s2 = mulai(m.serah.uid, d.pre, 5);
  sebagai(m.lagi.uid, `select public.finish_my_session(${lit(s1)}, null)`);
  sebagai(m.serah.uid, `select public.finish_my_session(${lit(s2)}, null)`);
  sebagaiEmail(KADEP.identitas, `select public.minta_percobaan(${lit(s1)}, 'Z8: diminta kepala departemen')`);
  sebagaiEmail(GURU.identitas, `select public.minta_percobaan(${lit(s2)}, 'Z8: listrik padam saat mengerjakan')`);
  // C1-R4's world, as Z3's K-05 captures make it: a sealed certificate, placed under review by a confirmed key correction
  bersihSertifikat();
  const pra = JSON.parse(psql(`select row_to_json(t) from (select x.certificate_id, x.canonical_payload, s.sesi from (select selftest.boot_attempt(true) as sesi) s,
      lateral public.certificate_prepare(s.sesi, 1::smallint) x) t`)) as { certificate_id: string; canonical_payload: Record<string, unknown>; sesi: string };
  const { signWithKey } = await import("../../../../../src/lib/certificates/sign");
  const tanda = signWithKey(pra.canonical_payload as never, process.env.CERT_SECRET_KEY_V1 ?? "");
  const token = (psql(`do $$ declare v_s uuid := ${lit(pra.sesi)}; v_c uuid := ${lit(pra.certificate_id)}; v_r uuid; v_k uuid; v_i uuid; v_item uuid; begin
      perform public.certificate_seal(v_c, 1::smallint, ${lit(tanda)});
      select institution_id into v_i from public.certificates where id = v_c;
      select id into v_r from public.assessment_results where session_id = v_s and supersedes_result_id is null;
      select p.item_id into v_item from public.presented_items p where p.session_id = v_s order by p.position limit 1;
      set local session_replication_role = replica;
      insert into public.key_corrections (institution_id, line_root_course_id, asked_item_id, item_id, course_id, release_id, question_digest, key_before, key_after,
                                          reason, proposed_by_person_id, status, decided_at, decided_by_person_id)
      select v_i, r.course_id, v_item, v_item, r.course_id, r.id, 'x', '{A}', '{B}', 'Z8 layar kunci tertukar saat diketik',
             (select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'boot-admin@bootstrap.pintar.test'),
             'CONFIRMED', now(),
             (select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'boot-kaprodi@bootstrap.pintar.test')
        from public.assessment_sessions s join public.plp_releases r on r.id = s.plp_release_id where s.id = v_s returning id into v_k;
      insert into public.certificate_reviews (certificate_id, institution_id, session_id, opened_by_result_id, previous_result_id, key_correction_id)
      values (v_c, v_i, v_s, v_r, v_r, v_k);
      set local session_replication_role = origin;
      perform set_config('z8.token', (select verification_token from public.certificates where id = v_c), false);
    end $$; select current_setting('z8.token');`).split("\n").pop() ?? "").trim();
  const tugas = psql(`select aa.learning_assignment_id from public.assessment_sessions s join public.assessment_assignments aa on aa.id = s.assessment_assignment_id where s.id = ${lit(pra.sesi)}`);

  const admin = await masuk(ASAL, ADMIN, `MENGELOLA:${d.inst}`);
  const kadep = await masuk(ASAL, KADEP, `MENGELOLA:${d.inst}`);
  const guru = await masuk(ASAL, GURU, `MENGAJAR:${d.inst}`);
  const siswa = await masuk(ASAL, BOOT_SISWA, "BELAJAR");
  for (const x of [admin, kadep, guru, siswa]) if (typeof x === "string") throw new Error(x);
  const browser = await chromium.launch();
  const halaman = async (k: unknown, w: number) => {
    const ctx = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: w, height: 900 } });
    await ctx.addCookies([...(k as { kue: Map<string, string> }).kue].map(([name, value]) => ({ name, value, url: ASAL })));
    return ctx.newPage();
  };
  try {
    for (const w of LEBAR) {
      // ---- A1-R4: the school admin's «Yang menunggu», then the queue it opens (Enter on the line's link)
      const a = await halaman(admin, w);
      await a.goto(`${ASAL}/konfigurasi`, { waitUntil: "networkidle" });
      const garis = a.locator('[data-menunggu-jenis="kesempatan"] a').first();
      await garis.focus();
      await garis.scrollIntoViewIfNeeded();
      await rekam(a, "01-admin-yang-menunggu", w, `line: ${await teksDi(a, '[data-menunggu-jenis="kesempatan"]')}`);
      await a.keyboard.press("Enter");
      await a.waitForURL(/\/konfigurasi\/kesempatan/, { timeout: 15000 });
      // a client navigation: the URL changes before the page arrives; the queue's own rows are what is waited for
      await a.waitForSelector("[data-permintaan]", { timeout: 20000 }).catch(() => undefined);
      await a.waitForLoadState("networkidle");
      await rekam(a, "02-admin-antrean", w, `rows: ${await a.locator("[data-permintaan]").count()}\tfirst: ${await teksDi(a, "[data-permintaan] >> nth=0")}`);
      // ---- A1-R4: the head of department's line on their own home
      const k = await halaman(kadep, w);
      await k.goto(`${ASAL}/pimpinan`, { waitUntil: "networkidle" });
      const gk = k.locator('[data-menunggu-jenis="kesempatan"] a').first();
      await gk.focus();
      await gk.scrollIntoViewIfNeeded();
      await rekam(k, "03-kadep-beranda", w, `line: ${await teksDi(k, '[data-menunggu-jenis="kesempatan"]')}`);
      // ---- A1-R2: the class page's «Ubah jadwal», by keyboard
      const g = await halaman(guru, w);
      await g.goto(`${ASAL}/mengajar/${d.kelas}`, { waitUntil: "networkidle" });
      const ubah = g.getByRole("link", { name: /Ubah jadwal/ }).first();
      if ((await ubah.count()) > 0) { await ubah.focus(); await ubah.scrollIntoViewIfNeeded(); }
      await rekam(g, "04-guru-kelas-ubah-jadwal", w, `«Ubah jadwal»: ${await ubah.count()} link(s)`);
      // ---- C1-R4: the learner's certificate under review, on screen and as printed
      const sp = await halaman(siswa, w);
      await sp.goto(`${ASAL}/belajar/${tugas}/sertifikat`, { waitUntil: "networkidle" });
      const cetak = sp.getByRole("button", { name: /Cetak/ }).first();
      if ((await cetak.count()) > 0) await cetak.focus();
      await rekam(sp, "05-sertifikat-ditinjau", w, `banner: ${await teksDi(sp, "[data-ditinjau]")}\t«Cetak»: ${await cetak.count()}`, true);
      await sp.emulateMedia({ media: "print" });
      await jeda(200);
      const cetakan = await sp.evaluate(`(() => { const t = document.body.innerText.replace(/\\s+/g, " ");
        const qr = [...document.querySelectorAll("svg, img, canvas")].filter((x) => { const r = x.getBoundingClientRect(); return r.width > 40 && r.height > 40 && /qr/i.test((x.getAttribute("aria-label") || "") + (x.getAttribute("alt") || "") + (x.getAttribute("class") || "") + (x.closest("[class*=qr], [data-qr]") ? "qr" : "")); }).length;
        const banner = document.querySelector("[data-ditinjau]"); return { qr, bannerTampak: !!banner && getComputedStyle(banner).display !== "none",
          klaim: (t.match(/Berlaku|BERLAKU|Valid|VALID|Sedang ditinjau|Under review/g) || []).join(", "), panjang: t.length }; })()`) as { qr: number; bannerTampak: boolean; klaim: string; panjang: number };
      // (print media at a phone's width: the card keeps its paper layout, which a window this narrow does not model; the
      // printed page is the PDF)
      await rekam(sp, "06-sertifikat-cetak", w, `print: QR images ${cetakan.qr}; the review banner printed: ${cetakan.bannerTampak}; status words on paper: «${cetakan.klaim || "none"}»`, true);
      await sp.emulateMedia({ media: "screen" });
      if (w === 1280) await sp.pdf({ path: join(KE, "z8-06-sertifikat-cetak.pdf"), printBackground: true }).catch(() => undefined);
      // ---- K-05 in the same session: the public check of the same certificate
      const u = await (await browser.newContext({ deviceScaleFactor: 2, viewport: { width: w, height: 900 } })).newPage();
      await u.goto(`${ASAL}/verifikasi/${encodeURIComponent(token)}`, { waitUntil: "networkidle" });
      await u.keyboard.press("Tab");
      await rekam(u, "07-verifikasi-ditinjau", w, `page: ${(await teksDi(u, "main")).slice(0, 220)}`, true);
      for (const p of [a, k, g, sp, u]) await p.context().close();
    }
  } finally {
    await browser.close();
    bersihkanA1();
    bersihSertifikat();
    writeFileSync(join(KE, "CATATAN-Z8.txt"), catatan.join("\n") + "\n");
  }
})().catch((e) => { console.error(e); process.exit(1); });
