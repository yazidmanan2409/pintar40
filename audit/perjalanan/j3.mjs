// J3 · The gate, the retake, the new result (Daisy's script, J3; on main 429b7dcc with D2-R). World: J3's own copy of
// W3's chapter in the dev/CI bootstrap tenant (13-j2-j3.sql): Sinta Maharani (j3.murid_resmi), class 8K, attempt limit 1,
// 5 of 6 (83 %) against 60 % with the must-be-right question missed. Her teacher Bambang Sutrisno (j3.guru); the head of
// department Made Wirawan (w14.kaprodi) decides retakes. A harness: it records, it does not judge.
//
//   node audit/perjalanan/j3.mjs      (the app on APP_URL; it LOADS THE WORLD ITSELF before each walk: it changes it)
//
// Three people on one browser in turn (each signs out before the next), keyboard only, comparing what they see:
//   L1 the learner: the result («Belum lulus.» and the gate's reason, «Pelajari lagi»), and her /belajar line
//   L2 the teacher: Sinta's page (the gate; «Kesempatan ke-{n}», ledger L-43, observed) and «Minta membaca lagi»
//      (whether Sinta is pre-ticked)
//   L3 the teacher requests a retake («Siapa» → «Atur» → «Minta satu kesempatan lagi»)
//   L4 the approver: the request's row (the result, the target, the gate), then «Setujui»
//   L5 while the retake is open (Sinta answers two and leaves): the learner's and the teacher's lines (hasil.ulang_berjalan)
//   L6 the retake resumed (signed in again, it needs the teacher's permission: «Atur» → «Izinkan»), then finished,
//      every question right: «Lulus.», and the certificate
// Branches (AUDIT_CABANG=1, 1280): W7 (the retake begun, then ended not counted: fiksasi w7a, w7b) and W8 (the gate
// unreadable: fiksasi w8), each seen by the learner, the teacher and the approver.
import { APP, dunia, jalan, kerjakan, kunciBab, pilihBahasa, ringkas, masukEmail, muatUlang, keluar, BAHASA, LEBAR } from "./lib.mjs";

const LABEL = ["bukti OFFICIAL di tenant bootstrap dev/CI (sintetis)"];
const CABANG = process.env.AUDIT_CABANG === "1";
const RAPI = (t) => (t ?? "").replace(/\s+/g, " ").trim();
const VONIS = /Belum lulus\.|Lulus\.|Not passed yet\.|Passed\./;

/** The three people's surfaces, each read and captured (used by the walk and the branches). */
function permukaan(j, D) {
  const { page } = j;
  const sinta = D["j3.murid_resmi"], guru = D["j3.guru"], kaprodi = D["w14.kaprodi"];
  const T = D["j3.bab"].tugas, K = D["j3.kelas"];
  return {
    sinta, guru, kaprodi, T, K,
    async murid(foto, data, awalan) {
      await masukEmail(j, sinta);
      await page.goto(`${APP}/belajar/${T}/hasil`);
      await page.waitForLoadState("networkidle").catch(() => {});
      await foto(`${awalan}murid-hasil`);
      const t = RAPI(await page.locator("main").innerText());
      data(`${awalan}learner_verdict`, (t.match(VONIS) ?? ["(none)"])[0]);
      data(`${awalan}learner_text`, t.slice(0, 700));
      await page.goto(`${APP}/belajar`);
      await foto(`${awalan}murid-belajar`);
      data(`${awalan}learner_home_line`, RAPI(await page.locator("main").innerText()).slice(0, 400));
      await keluar(j);
    },
    async guruLihat(rec, foto, data, awalan) {
      await masukEmail(j, guru);
      await page.goto(`${APP}/mengajar/${K}/murid/${sinta.person}`);
      await page.waitForLoadState("networkidle").catch(() => {});
      await foto(`${awalan}guru-murid`);
      const t = RAPI(await page.locator("main").innerText());
      data(`${awalan}teacher_text`, t.slice(0, 900));
      data(`${awalan}teacher_shows_kesempatan_ke`, /Kesempatan ke-\d|Attempt \d/i.test(t));   // ledger L-43, observed
      { const i = t.indexOf("HASIL RESMI"); data(`${awalan}teacher_official_results`, i >= 0 ? t.slice(i, i + 420) : "(no «Hasil resmi»)"); }
      const ulang = page.getByRole("link", { name: /Minta membaca lagi|Ask to read again/i }).first();
      if (await ulang.count()) {
        rec.tab += await j.tekan(ulang, 150);
        await page.waitForURL((u) => u.pathname.endsWith("/ulang"), { timeout: 30000 });
        await page.waitForLoadState("networkidle").catch(() => {});
        await foto(`${awalan}guru-minta-membaca`);
        const kotak = page.getByRole("checkbox", { name: new RegExp(sinta.nama) }).first();
        data(`${awalan}read_again_sinta_preticked`, await kotak.count() ? await kotak.isChecked() : "(no checkbox for Sinta)");   // via her page's link (&murid=)
        data(`${awalan}read_again_checked`, (await page.getByRole("checkbox", { checked: true }).allInnerTexts().catch(() => [])).length);
        data(`${awalan}read_again_text`, RAPI(await page.locator("main").innerText()).slice(0, 600));
        // the link from her page names her (&murid=), which selects her by itself; the list's OWN pre-ticking is read
        // on the same page without it (as a teacher arriving from «Bukti» sees it)
        const u = new URL(page.url()); u.searchParams.delete("murid");
        await page.goto(u.toString()); await page.waitForLoadState("networkidle").catch(() => {});
        await foto(`${awalan}guru-minta-membaca-daftar`);
        const k2 = page.getByRole("checkbox", { name: new RegExp(sinta.nama) }).first();
        data(`${awalan}read_again_list_preticks_sinta`, await k2.count() ? await k2.isChecked() : "(no checkbox for Sinta)");
      } else data(`${awalan}read_again_sinta_preticked`, "(no «Minta membaca lagi» link)");
      await keluar(j);
    },
    async kaprodiLihat(rec, foto, data, awalan, putuskan) {
      await masukEmail(j, kaprodi);
      const ruang = page.getByRole("button", { name: /Saya memimpin bagian sekolah|I lead part of the school/i }).first();
      if (await ruang.isVisible().catch(() => false)) { rec.tab += await j.tekan(ruang); await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(1000); }
      const tautan = page.getByRole("link", { name: /permintaan kesempatan tambahan|requests for an extra attempt/i }).first();
      if (await tautan.count()) { rec.tab += await j.tekan(tautan, 150); await page.waitForTimeout(1200); }
      await foto(`${awalan}kaprodi`);
      const bagian = page.locator("section, div").filter({ has: page.getByRole("heading", { name: /Permintaan kesempatan tambahan|Requests for an extra attempt/i }) }).last();
      data(`${awalan}approver_text`, RAPI(await bagian.innerText().catch(() => "(no request section)")).slice(0, 600));
      if (putuskan) {
        rec.tab += await j.tekan(page.getByRole("button", { name: new RegExp(`^(Setujui|Approve)\\s*·\\s*${sinta.nama}`) }).first(), 150);
        await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(1200);
        await foto(`${awalan}kaprodi-setuju`);
        data(`${awalan}approve_words`, RAPI((await page.locator('[role="status"]').allInnerTexts()).join(" | ")));
      }
      await keluar(j);
    },
  };
}

const hasil = [];
if (CABANG) process.exit(await cabang());

for (const lebar of LEBAR) {
  muatUlang();
  const D = dunia();
  const j = await jalan({ perjalanan: "j3", lebar, zona: "WIB", nama: "Sinta · Bambang · Made", label: LABEL });
  const { page } = j;
  const P = permukaan(j, D);
  const kunci = kunciBab(D["j3.bab"].kursus);
  const sesi = () => j.baca(`select coalesce(string_agg(s.status::text || coalesce(' ' || r.mastery || ' gate ' || coalesce(r.safety_gate_passed::text, 'null'), ''), '; ' order by s.created_at), 'none')
    from public.assessment_sessions s join public.assessment_definitions d on d.id = s.assessment_definition_id
    left join public.assessment_results r on r.session_id = s.id and r.supersedes_result_id is null
    where s.person_id = '${P.sinta.person}' and d.mode = 'POST_TEST'`);

  await j.langkah("L1", "the learner: «Belum lulus.», the gate's reason, «Pelajari lagi»", async ({ foto, data }) => {
    await page.goto(`${APP}/masuk`);
    await pilihBahasa(j);
    await P.murid(foto, data, "");
    data("sittings", sesi());
  });

  await j.langkah("L2", "the teacher: the gate on Sinta's page, and «Minta membaca lagi»", async ({ rec, foto, data }) => {
    await P.guruLihat(rec, foto, data, "");
  });

  await j.langkah("L3", "the teacher requests a retake", async ({ rec, foto, data }) => {
    await masukEmail(j, P.guru);
    await page.goto(`${APP}/mengajar/${P.K}/siapa?penugasan=${D["j3.bab"].up}`);
    rec.tab += await j.tekan(page.getByRole("link", { name: new RegExp(`^(Atur|Manage)\\s*·\\s*${P.sinta.nama}`) }).first(), 150);
    await page.getByRole("button", { name: /Kirim permintaan|Send request/i }).first().waitFor({ timeout: 30000 });
    await foto("guru-atur");
    rec.tab += await j.ketik(page.getByRole("textbox", { name: /^(Alasan|Reason)$/i }).first(), "Sinta sudah membaca lagi soal yang wajib benar.", 150);
    rec.tab += await j.tekan(page.getByRole("button", { name: /Kirim permintaan|Send request/i }).first(), 150);
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(1000);
    await foto("guru-diminta");
    data("words", RAPI((await page.locator('[role="status"]').allInnerTexts()).join(" | ")));
    data("request", j.baca(`select coalesce(string_agg(a.status::text, ','), 'none') from public.attempt_requests a where a.person_id = '${P.sinta.person}'`));
    if (!/PENDING/.test(rec.data.request)) throw new Error(`no pending request (${rec.data.request})`);
    await keluar(j);
  });

  await j.langkah("L4", "the approver: the request's row, then «Setujui»", async ({ rec, foto, data }) => {
    await P.kaprodiLihat(rec, foto, data, "", true);
    data("request", j.baca(`select coalesce(string_agg(a.status::text, ','), 'none') from public.attempt_requests a where a.person_id = '${P.sinta.person}'`));
    if (!/APPROVED/.test(rec.data.request)) throw new Error(`the request was not approved (${rec.data.request})`);
  });

  await j.langkah("L5", "while the retake is open: the learner's and the teacher's lines", async ({ rec, foto, data }) => {
    await masukEmail(j, P.sinta);
    await page.goto(`${APP}/belajar/${P.T}/penguasaan`);
    await foto("ulang-ditawarkan");
    rec.tab += await j.tekan(page.getByRole("button", { name: /^(Mulai|Start)/i }).first(), 150);
    data("answered_then_left", await kerjakan(j, kunci, rec, foto, "ulang", /^(Kumpulkan|Submit)/i, {}, 2));
    data("sittings", sesi());
    await keluar(j);
    await P.murid(foto, data, "berjalan-");
    await P.guruLihat(rec, foto, data, "berjalan-");
  });

  await j.langkah("L6", "the retake resumed: the teacher's permission (signed in again), then finished: «Lulus.», and the certificate", async ({ rec, foto, data, amati }) => {
    // signed in again, the open retake needs the teacher's permission (as the screen says), so the walk asks for it
    await masukEmail(j, P.sinta);
    await page.goto(`${APP}/belajar/${P.T}/penguasaan`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await foto("ulang-perlu-izin");
    const perluIzin = /perlu diizinkan guru|needs your teacher's permission/i.test(RAPI(await page.locator("main").innerText()));
    data("permission_needed", perluIzin);
    if (perluIzin) {
      data("permission_words", RAPI(await page.locator("main").innerText()).slice(0, 500));
      await keluar(j);
      await masukEmail(j, P.guru);
      await page.goto(`${APP}/mengajar/${P.K}/siapa?penugasan=${D["j3.bab"].up}`);
      rec.tab += await j.tekan(page.getByRole("link", { name: new RegExp(`^(Atur|Manage)\\s*·\\s*${P.sinta.nama}`) }).first(), 150);
      const izin = page.locator("form", { has: page.locator("#atur-izinkan-alasan") }).first();
      await izin.waitFor({ timeout: 30000 });
      await foto("guru-izinkan");
      data("teacher_allow_question", RAPI(await page.locator('[id^="atur-izinkan-tanya-"]').first().innerText().catch(() => "(not found)")).slice(0, 400));
      rec.tab += await j.ketik(izin.locator("#atur-izinkan-alasan"), "Sinta masuk lagi dari komputer yang sama; boleh dilanjutkan.", 150);
      rec.tab += await j.tekan(izin.getByRole("button", { name: /^(Izinkan|Allow)$/i }), 60);
      await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(1000);
      await foto("guru-diizinkan");
      data("teacher_allow_words", RAPI((await page.locator('[role="status"]').allInnerTexts()).join(" | ")));
      await keluar(j);
      await masukEmail(j, P.sinta);
      await page.goto(`${APP}/belajar/${P.T}/penguasaan`);
      await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(800);
      const coba = page.getByRole("button", { name: /^(Coba lagi|Try again)$/i }).or(page.getByRole("link", { name: /^(Coba lagi|Try again)$/i })).first();
      if (await coba.isVisible().catch(() => false)) { rec.tab += await j.tekan(coba, 150); await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(800); }
      data("resumed_words", RAPI(await page.locator("main").innerText()).slice(0, 220));
    }
    const lanjut = page.getByRole("button", { name: /^(Lanjutkan|Continue)/i }).first();
    if (await lanjut.isVisible().catch(() => false)) rec.tab += await j.tekan(lanjut, 150);
    const sini = page.getByRole("button", { name: /Lanjutkan di sini|Continue here/i }).first();
    if (await sini.isVisible().catch(() => false)) { amati("«Lanjutkan di sini?» asked"); rec.tab += await j.tekan(sini, 60); }
    await foto("ulang-dilanjutkan");
    data("answered", await kerjakan(j, kunci, rec, foto, "ulang-akhir", /^(Kumpulkan|Submit)/i));
    if (!new URL(page.url()).pathname.endsWith("/hasil")) await page.goto(`${APP}/belajar/${P.T}/hasil`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await foto("hasil-baru");
    const t = RAPI(await page.locator("main").innerText());
    data("verdict", (t.match(VONIS) ?? ["(none)"])[0]);
    data("text", t.slice(0, 700));
    data("sittings", sesi());
    await page.goto(`${APP}/belajar/${P.T}/sertifikat`);
    await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(1500);
    await foto("sertifikat");
    data("certificate", j.baca(`select coalesce(string_agg(c.status::text, ','), 'none') from public.certificates c
      join public.assessment_sessions s on s.id = c.session_id where s.person_id = '${P.sinta.person}'`));
    await keluar(j);
    await P.guruLihat(rec, foto, data, "akhir-");
    amati(`learner: ${rec.data.verdict}; certificate: ${rec.data.certificate}`);
    if (!/^(Lulus|Passed)\.$/.test(rec.data.verdict)) throw new Error(`the retake's result is «${rec.data.verdict}», not a pass (sittings: ${rec.data.sittings})`);
  });

  hasil.push(await j.selesai());
}
process.exit(ringkas("j3", hasil));

async function cabang() {
  const hasilC = [];
  for (const [nama, fiksasi, label] of [
    ["w7", ["w7a", "w7b"], [...LABEL, "keadaan fiksasi W7 (ulang dimulai lalu diakhiri tanpa dihitung)"]],
    ["w8", ["w8"], [...LABEL, "keadaan fiksasi (dibuat melewati penjaga hari ini)"]]]) {
    muatUlang(fiksasi[0]);
    const D = dunia();
    const j = await jalan({ perjalanan: `j3-cabang-${nama}`, lebar: 1280, zona: "WIB", nama: "Sinta · Bambang · Made", label });
    const P = permukaan(j, D);
    if (nama === "w7") {
      await j.langkah("C1", "W7a: the retake begun (open): the three surfaces", async ({ rec, foto, data }) => {
        await j.page.goto(`${APP}/masuk`);
        await P.murid(foto, data, "w7a-");
        await P.guruLihat(rec, foto, data, "w7a-");
        await P.kaprodiLihat(rec, foto, data, "w7a-", false);
      });
      await j.langkah("C2", "W7b: the retake ended not counted: the line goes, the earlier result stays", async ({ rec, foto, data }) => {
        muatUlangFiksasi("w7b");
        await P.murid(foto, data, "w7b-");
        await P.guruLihat(rec, foto, data, "w7b-");
        await P.kaprodiLihat(rec, foto, data, "w7b-", false);
      });
    } else {
      await j.langkah("C1", "W8: the gate unknown, on all three surfaces (nobody pre-ticked)", async ({ rec, foto, data }) => {
        await j.page.goto(`${APP}/masuk`);
        await P.murid(foto, data, "w8-");
        await P.guruLihat(rec, foto, data, "w8-");
        await P.kaprodiLihat(rec, foto, data, "w8-", false);
      });
    }
    hasilC.push(await j.selesai());
  }
  return ringkas("j3-cabang", hasilC);
}

import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
function muatUlangFiksasi(f) {
  // a fixture's later moment, applied to the world already loaded (W7b after W7a)
  execFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "dunia", "muat.sh"), ["--fiksasi", f], { stdio: "ignore" });
}
