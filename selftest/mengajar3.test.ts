/**
 * BATCH 3 · Mengajar (Studio and teaching): the teacher's side of the open-work register, each held by a guard that is
 * RED on the code before it.
 *
 *  MENGAJAR3-HASIL-01  W2.4 (CR-27, J5.6; D-120 Q8). THE UJI CEPAT SCORE, THE CLASS FIRST, THE LEARNERS ONE STEP
 *                      BELOW. Driven: susunHasilUjiCepat makes the class figure the mean of only the scores the
 *                      evaluator gave (a withheld or unrecorded one is «no score», not a number, and not in the mean),
 *                      always with its base (scored of the class now), counts no one outside the class, and gives no
 *                      figure at all, never a zero, when there is no score. Source: /mengajar/[kelas]/uji-cepat/hasil
 *                      reads each score through the catalogue's `learner.result` (no new read path), only for this
 *                      class's own Uji Cepat; the class figure stands in `t-stat` above the learners' Table (Koleksi);
 *                      nothing is ordered by score; the Uji Cepat page leads there once something is handed in.
 *  MENGAJAR3-JENDELA-01 W3.11 (Daisy, J5Jendela). Siapkan's «Sampai» is marked «(opsional)» and its empty echo says
 *                      «Tanpa batas akhir»; a refusal about the window comes back with the dates sent and is told under
 *                      «Sampai» (the field invalid, described by the sentence, focused on arrival, cleared when the
 *                      date changes), not at the button; every other refusal still answers at the button.
 *  MENGAJAR3-SEDIA-01  W3.11 (Daisy, J1Terbit part two). A Sediakan the database took returns to the review; only
 *                      when the class's assignments hold it does the button say «✓ Disediakan», the line say what was
 *                      made available with the window in words, and the way on name the class.
 *  MENGAJAR3-KIRIM-01  W3.17 (08 Actions; RV-20). «Minta membaca lagi» says «Mengirim…», then «✓ Terkirim» once the
 *                      database took the request; every TombolKirim under /mengajar either gives its result word or
 *                      is the one named exception; a list row's badge is no longer hidden at 320 px.
 *  MENGAJAR3-KOSONG-01 W3.18 (08 Feedback, `.pin-empty` → Empty state). The Mengajar pages this batch touches say
 *                      their emptiness through Kosong.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { render } from "./ux2.test";

const baca = (root: string, ...p: string[]) => readFileSync(join(root, ...p), "utf8");
/** Source without comments, so a guard reads what runs. */
const kode = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");

const HASIL = ["src", "app", "mengajar", "[kelas]", "uji-cepat", "hasil", "page.tsx"];
const CEPAT = ["src", "app", "mengajar", "[kelas]", "uji-cepat", "page.tsx"];
const SIAPKAN = ["src", "app", "mengajar", "[kelas]", "siapkan", "page.tsx"];
const ULANG = ["src", "app", "mengajar", "[kelas]", "ulang", "page.tsx"];
const KELAS = ["src", "app", "mengajar", "[kelas]", "page.tsx"];
const AKSI = ["src", "app", "mengajar", "actions.ts"];

export const mengajar3Tests: SelfTest[] = [
  {
    id: "MENGAJAR3-HASIL-01",
    run: async (ctx) => {
      const c = new Checks();
      const root = ctx.repoRoot;
      const ada = (...p: string[]) => { try { return baca(root, ...p); } catch { return ""; } };

      // 1. the figures, driven
      let susun: typeof import("../src/lib/hasil-ujicepat").susunHasilUjiCepat | undefined;
      try { ({ susunHasilUjiCepat: susun } = await import("../src/lib/hasil-ujicepat")); } catch { /* absent before W2.4 */ }
      if (c.expect(typeof susun === "function", "there is no susunHasilUjiCepat (src/lib/hasil-ujicepat.ts)") && susun) {
        const roster = ["Ani", "Budi", "Citra", "Dewi", "Eka"].map((nama, i) => ({ id: `m${i}`, nama }));
        const sesi = [
          { id: "s0", person_id: "m0", status: "FINALIZED" },
          { id: "s1", person_id: "m1", status: "FINALIZED" },
          { id: "s2", person_id: "m2", status: "FINALIZED" }, // the evaluator gives nothing for it
          { id: "s3", person_id: "m3", status: "EXPIRED" },   // started, not handed in
          { id: "sx", person_id: "lain", status: "FINALIZED" }, // moved away: not in the class now
        ];
        const nilai = new Map<string, number | null>([["s0", 0.8], ["s1", 0.6], ["s3", 0.9], ["sx", 0.1]]);
        const h = susun(roster, sesi, nilai);
        // D-176 (O3 (a)): two scores are below the threshold of five: no figure, the base still counted
        c.expect(h.kelas.dinilai === 2 && h.kelas.terdaftar === 5 && h.kelas.nilai === null,
          `below the threshold the class figure is computed, or its base is wrong: ${JSON.stringify(h.kelas)}`);
        // at the threshold, the mean of exactly the scores given
        const lima = ["A", "B", "C", "D", "E", "F"].map((nama, i) => ({ id: `t${i}`, nama }));
        const sesiLima = lima.map((m, i) => ({ id: `u${i}`, person_id: m.id, status: "FINALIZED" }));
        const nilaiLima = new Map<string, number | null>([["u0", 0.5], ["u1", 0.6], ["u2", 0.7], ["u3", 0.8], ["u4", 0.9]]);
        const h5 = susun(lima, sesiLima, nilaiLima);
        c.expect(h5.kelas.dinilai === 5 && h5.kelas.terdaftar === 6 && Math.abs((h5.kelas.nilai ?? -1) - 0.7) < 1e-9,
          `at five scores the class figure is not the mean of the five given, on its base 5 of 6: ${JSON.stringify(h5.kelas)}`);
        const empat = susun(lima, sesiLima.slice(0, 4), nilaiLima);
        c.expect(empat.kelas.nilai === null && empat.kelas.dinilai === 4, "at four scores a class figure is shown (D-176: five needed)");
        const { AMBANG_NILAI_KELAS } = await import("../src/lib/hasil-ujicepat");
        c.expect(AMBANG_NILAI_KELAS === 5, `the threshold is ${AMBANG_NILAI_KELAS}, not the ruled 5`);
        const per = Object.fromEntries(h.murid.map((m) => [m.nama, m]));
        c.expect(per.Ani.keadaan === "sudah" && per.Ani.nilai === 0.8 && per.Budi.nilai === 0.6,
          "a learner's score is not the one the evaluator gave for their sitting");
        c.expect(per.Citra.keadaan === "sudah" && per.Citra.nilai === null,
          "a handed-in sitting the evaluator gave no score for shows a number");
        c.expect(per.Dewi.keadaan === "sedang" && per.Dewi.nilai === null, "a sitting not handed in shows a score");
        c.expect(per.Eka.keadaan === "belum" && per.Eka.nilai === null, "a learner who did not start shows a score or a state");
        c.expect(h.murid.length === 5 && !h.murid.some((m) => m.id === "lain"), "someone outside the class now is counted");
        c.expect(h.murid.map((m) => m.nama).join() === "Ani,Budi,Citra,Dewi,Eka", "the learners are reordered (a ranking)");
        const kosong = susun(roster, sesi.slice(3), new Map([["s3", 0.9]]));
        c.expect(kosong.kelas.nilai === null && kosong.kelas.dinilai === 0, "with no score there is a class figure (a zero standing in)");
      }

      // 2. the read: what exists, through the catalogue
      const ajar = kode(ada("src", "lib", "pengajar.ts"));
      const fn = ajar.split("export async function hasilUjiCepat(")[1]?.split("\nexport ")[0] ?? "";
      c.expect(fn.length > 0, "src/lib/pengajar.ts has no hasilUjiCepat");
      c.expect(/b\.id === penugasan && b\.adHoc && b\.mode === "QUICK"/.test(fn), "the score is read for something that is not this class's Uji Cepat");
      c.expect(/c\.rpc\("metric_evaluate", \{ p_metric_id: "learner\.result"/.test(fn) && /\(amplop as Amplop\)\.status === "ok"/.test(fn),
        "a learner's score is not the catalogue's learner.result, or is read when the evaluator did not answer ok");
      c.expect(/susunHasilUjiCepat\(fakta\.murid, sesi, nilai\)/.test(fn), "the class now is not the base of the figure");
      c.expect(!/service|admin/i.test(fn.replace(/assessment_sessions/g, "")), "the score's read reaches past the teacher's own session");

      // 3. the page: the class first, then the learners
      const hasil = kode(ada(...HASIL));
      c.expect(/export const generateMetadata = judulHalaman\("\/mengajar\/\[kelas\]\/uji-cepat\/hasil"\);/.test(hasil),
        "/mengajar/[kelas]/uji-cepat/hasil does not exist or does not name itself");
      c.expect(/ajar\.hasilUjiCepat\(id, ctx\.ini\.institusi, sp\.penugasan\)/.test(hasil) && /<HalamanPenolakan/.test(hasil),
        "the result page does not read through hasilUjiCepat, or has no refusal");
      const iKelas = hasil.indexOf('className="pin-metric pin-cepat-kelas"');
      const iTabel = hasil.indexOf("<Koleksi");
      c.expect(iKelas > 0 && iTabel > iKelas, "the class figure does not stand above the learners' Table");
      c.expect(/<span className="pin-mv pin-num">\{format\.percent\(hasil\.kelas\.nilai, locale\)\}<\/span>/.test(hasil)
        && /"mengajar\.cepat\.hasil\.dasar", \{ n: n\(hasil\.kelas\.dinilai\), total: n\(hasil\.kelas\.terdaftar\), benda \}/.test(hasil),
        "the class figure is not in t-stat with its base («n dari N»)");
      c.expect(/hasil\.kelas\.dinilai === 0 \? \(\s*<Kosong jenis="belum" kalimat=\{s\("mengajar\.cepat\.hasil\.belum"\)\} \/>/.test(hasil),
        "with no score the page does not say so in an Empty state");
      // D-176: below the threshold, the not-yet pattern: how far (the shared sentence, by the place's kind), what makes it appear, the base
      c.expect(/kalimatJumlahOrang\(hasil\.kelas\.dinilai, AMBANG_NILAI_KELAS, ctx\.ini\.jenis, locale\)/.test(hasil)
        && /"mengajar\.cepat\.hasil\.belum_cukup"/.test(hasil) && /"mengajar\.cepat\.hasil\.muncul"/.test(hasil),
        "below the threshold the page does not show the not-yet pattern with the shared count sentence");
      c.expect(!/\b5\b/.test(hasil.replace(/[a-f0-9-]{36}/g, "")), "the page writes the threshold's number itself (it must read AMBANG_NILAI_KELAS)");
      c.expect(/m\.nilai === null/.test(hasil) && /"mengajar\.cepat\.hasil\.nilai_belum"/.test(hasil), "a learner with no score is not said to have none");
      c.expect(!/\.sort\(|nilai\s*-\s*|toFixed/.test(hasil), "the learners are ordered by score, or a score is rounded by hand");
      c.expect(/sudah: \{ kunci: "mengajar\.siapa\.sudah", badge: "pin-pill pin-ok" \}/.test(hasil), "the learners' states are not badges with their words");

      // 4. the way there
      const cepat = kode(ada(...CEPAT));
      const ke = (cepat.match(/\/uji-cepat\/hasil\?penugasan=\$\{(hidup|terakhir)\.id\}/g) ?? []).length;
      c.expect(ke === 2, `the Uji Cepat page does not lead to the score from the running and the last Uji Cepat (${ke})`);
      const judul = ada("src", "lib", "judul-halaman.ts");
      c.expect(/"\/mengajar\/\[kelas\]\/uji-cepat\/hasil": \{ kunci: "mengajar\.cepat\.hasil\.judul", untuk: "educator" \},/.test(judul),
        "the result page has no title in the one map");

      // 5. the words, both languages
      const { t, TANPA_SALINAN } = await import("../src/lib/hle");
      const KUNCI = ["mengajar.cepat.hasil.judul", "mengajar.cepat.hasil.lihat", "mengajar.cepat.hasil.kelas", "mengajar.cepat.hasil.dasar",
        "mengajar.cepat.hasil.arti", "mengajar.cepat.hasil.belum", "mengajar.cepat.hasil.rincian", "mengajar.cepat.hasil.rincian.arti",
        "mengajar.cepat.hasil.kolom.nama", "mengajar.cepat.hasil.kolom.keadaan", "mengajar.cepat.hasil.kolom.nilai",
        "mengajar.cepat.hasil.nilai_belum", "mengajar.cepat.hasil.kembali"];
      for (const k of KUNCI) for (const locale of ["id", "en"] as const) {
        const v = t(k as never, "educator", { locale });
        c.expect(v !== TANPA_SALINAN && v !== k, `(${locale}) ${k} has no words`);
      }
      c.expect(t("mengajar.cepat.hasil.dasar" as never, "educator", { locale: "id" }) === "{n} dari {total} {benda} sudah dinilai",
        "the base does not read «18 dari 31 murid sudah dinilai»");
      return c.verdict("the Uji Cepat score: the class figure (the mean of only the scores the catalogue gives this teacher, on its base) in t-stat above the learners' Table; no score is never a zero; reached from the running and the last Uji Cepat");
    },
  },
  {
    id: "MENGAJAR3-JENDELA-01",
    run: async (ctx) => {
      const c = new Checks();
      const root = ctx.repoRoot;
      const siapkan = kode(baca(root, ...SIAPKAN));
      c.expect(/<label htmlFor="pin-sampai">\s*\{s\("mengajar\.siap\.sampai"\)\} <span className="pin-opsional">\{s\("bentuk\.opsional"\)\}<\/span>\s*<\/label>/.test(siapkan),
        "«Sampai» is not marked «(opsional)»");
      c.expect(/<TanggalDenganGema id="pin-sampai" name="sampai"[^>]*kosong=\{s\("mengajar\.siap\.sampai\.kosong"\)\}[^>]*galat=\{galatJendela\}/.test(siapkan),
        "«Sampai» does not say «Tanpa batas akhir» when empty, or takes no window refusal");
      c.expect(/const galatJendela = galat === "ASSIGN_WINDOW_INVALID" \? s\(kunciKodePenugasan\(galat\)\) : undefined;/.test(siapkan)
        && /const tolakan = galat && !galatJendela \?/.test(siapkan),
        "a window refusal is not told under its field (or is told twice), or another refusal left the button");
      c.expect(/HARI\.test\(sampaiTadi \?\? ""\) \? sampaiTadi/.test(siapkan) && /HARI\.test\(mulaiTadi \?\? ""\) \? mulaiTadi/.test(siapkan),
        "the form does not reopen with the dates that were sent");
      const aksi = kode(baca(root, ...AKSI));
      c.expect(/if \(mulai\) q\.set\("mulai", mulai\);/.test(aksi) && /if \(sampai\) q\.set\("sampai", sampai\);/.test(aksi)
        && /const q = new URLSearchParams\(\{ terbitan, kode \}\);/.test(aksi),
        "a refused Sediakan does not carry the dates back");

      const { t } = await import("../src/lib/hle");
      c.expect(t("bentuk.opsional" as never, "educator", { locale: "id" }) === "(opsional)" && t("bentuk.opsional" as never, "educator", { locale: "en" }) === "(optional)",
        "«(opsional)» is not in the copy table");
      const kalimat = t("mengajar.sedia.kode.assign_window_invalid", "educator", { locale: "id" });
      const r = render(root, "src/components/bentuk/TanggalDenganGema.tsx",
        { id: "pin-sampai", name: "sampai", defaultValue: "2026-10-01", galat: kalimat, kosong: "Tanpa batas akhir", locale: "id" });
      if (c.expect(r.ok, `TanggalDenganGema with a refusal could not be rendered: ${r.galat}`)) {
        const input = /<input\b[^>]*>/.exec(r.html)?.[0] ?? "";
        c.expect(/aria-invalid="true"/.test(input) && /aria-describedby="pin-sampai-gema pin-sampai-galat"/.test(input),
          `the field is not marked invalid and described by its refusal after its echo: ${input}`);
        c.expect(new RegExp(`<p class="pin-galat-bidang" id="pin-sampai-galat"><svg[^>]*>.*</svg><span>${kalimat}</span></p>`).test(r.html)
          && r.html.indexOf("pin-galat-bidang") > r.html.indexOf("pin-gema"),
          "the refusal is not under the field, after the echo, with the alert icon and the server's sentence");
      }
      const k = render(root, "src/components/bentuk/TanggalDenganGema.tsx", { id: "pin-sampai", name: "sampai", kosong: "Tanpa batas akhir", locale: "id" });
      c.expect(k.ok && /<span id="pin-sampai-gema" class="is-kosong">Tanpa batas akhir<\/span>/.test(k.html) && !/aria-invalid/.test(k.html) && !/pin-galat-bidang/.test(k.html),
        "an empty «Sampai» does not say «Tanpa batas akhir», or a field with no refusal is marked invalid");
      const komp = kode(baca(root, "src", "components", "bentuk", "TanggalDenganGema.tsx"));
      c.expect(/if \(galat\) kolom\.current\?\.focus\(\);/.test(komp) && /if \(galat\) setDiubah\(true\);/.test(komp) && /const salah = Boolean\(galat\) && !diubah;/.test(komp),
        "focus does not go to the refused field on arrival, or correcting the date does not clear the refusal");
      const css = baca(root, "src", "app", "experience.css");
      c.expect(/\n\.pin-opsional \{ font-weight: var\(--weight-normal\); color: var\(--ink-3\); \}/.test(css)
        && /\n\.pin-galat-bidang \{[^}]*color: var\(--status-blocked\);/.test(css),
        "«(opsional)» or the field's refusal is not drawn as Daisy's (quiet label; blocked colour)");
      return c.verdict("Siapkan's window (J5): «Sampai (opsional)», «Tanpa batas akhir» when empty; a window refusal comes back with the dates sent and is told under «Sampai», which is invalid, described by it, focused, and cleared by a new date");
    },
  },
  {
    id: "MENGAJAR3-SEDIA-01",
    run: async (ctx) => {
      const c = new Checks();
      const root = ctx.repoRoot;
      const aksi = kode(baca(root, ...AKSI));
      c.expect(/ke\(kelasId, `\/siapkan\?disediakan=\$\{encodeURIComponent\(terbitan\)\}`\);/.test(aksi), "a Sediakan the database took does not return to its review");
      const siapkan = kode(baca(root, ...SIAPKAN));
      c.expect(/const sudah = disediakan \? tugas\.find\(\(x\) => x\.releaseId === disediakan && x\.status === "ACTIVE"\) \?\? null : null;/.test(siapkan),
        "«Disediakan» is said on the address's word, not on the class's assignments");
      c.expect(/selesai=\{sudah \? s\("mengajar\.sedia\.selesai"\) : undefined\}/.test(siapkan), "the button does not end in «✓ Disediakan»");
      c.expect(/\{sudah \? <BarisHasil nada="ok">\{s\("mengajar\.sedia\.ok"\)\} \{jendelaKata\}\.<\/BarisHasil> : null\}/.test(siapkan)
        // RESTATED (owner, 10 Nov: school-context dates on the school's clock): the window's words carry the school's zone (a day: unshifted)
        && /const jendelaKata = `\$\{s\("mengajar\.siap\.mulai"\)\} \$\{tanggal\(mulaiAwal, "hari", locale, zona\)\}/.test(siapkan),
        "the result line does not say what was made available and its window in words");
      c.expect(/sudah \? \(\s*<Link className="pin-btn" href=\{`\/mengajar\/\$\{id\}`\}>\{ctx\.ini\.nama\}<\/Link>/.test(siapkan), "there is no way on to the class");
      c.expect(/defaultValue=\{mulaiAwal\} disabled=\{Boolean\(sudah\)\}/.test(siapkan), "the window made available can still be edited as if nothing was sent");
      const { t } = await import("../src/lib/hle");
      c.expect(t("mengajar.sedia.selesai" as never, "educator", { locale: "id" }) === "Disediakan", "the result word is not «Disediakan»");
      const r = render(root, "src/components/TombolKirim.tsx", { className: "pin-btn pin-primary", sibuk: "Menyediakan…", selesai: "Disediakan", children: "Sediakan" });
      c.expect(r.ok && /data-keadaan="selesai"/.test(r.html) && /<span aria-hidden="true">✓<\/span> Disediakan/.test(r.html),
        `TombolKirim does not show «✓ Disediakan»: ${r.galat || r.html.slice(0, 200)}`);
      return c.verdict("J1 part two: «Menyediakan…», then, only once the class's assignments hold it, «✓ Disediakan», «Materi disediakan untuk kelas ini.» with the window in words, and the way on to the class");
    },
  },
  {
    id: "MENGAJAR3-KIRIM-01",
    run: async (ctx) => {
      const c = new Checks();
      const root = ctx.repoRoot;
      const ulang = kode(baca(root, ...ULANG));
      c.expect(/<TombolKirim className="pin-btn pin-primary" sibuk=\{s\("tombol\.mengirim"\)\}\s*selesai=\{sp\.ulang === "ok" \? s\("mengajar\.ulang\.selesai"\) : undefined\}>/.test(ulang),
        "«Minta membaca lagi» does not say «Mengirim…», then «✓ Terkirim» once the request was taken");
      const { t } = await import("../src/lib/hle");
      c.expect(t("mengajar.ulang.selesai" as never, "educator", { locale: "id" }) === "Terkirim", "the request's result word is not «Terkirim»");
      // every submit under /mengajar that changes state ends in its result word, or is the named exception
      const KECUALI: Record<string, string> = {
        // the launch lands on the running stage, where the form is gone; its result line says it (BarisHasil, ✓)
        "uji-cepat": 'sibuk={s("tombol.menyediakan")}>{s("mengajar.cepat.komit")}',
      };
      for (const [nama, p] of [["siapkan", SIAPKAN], ["ulang", ULANG], ["uji-cepat", CEPAT]] as const) {
        const isi = kode(baca(root, ...p));
        for (const m of isi.matchAll(/<TombolKirim\b[^>]*>/g)) {
          c.expect(/\bselesai=\{/.test(m[0]) || (KECUALI[nama] !== undefined && isi.includes(KECUALI[nama])),
            `${nama}: ${m[0].slice(0, 90)} gives no result word`);
        }
      }
      // RV-20: the badge of a list row stays at 320 px, moved under the row's words
      const css = baca(root, "src", "app", "experience.css");
      const lama = css.indexOf(".pin-row > .pin-pill { display: none; }");
      // restated (R3-LENCANA-01): the block may also hide the original of a row that carries a marked narrow copy, so
      // the badge is shown once; the original is still shown under the words for every other row
      const baru = css.search(/@media \(max-width: 560px\) \{\s*\.pin-row > \.pin-pill \{ display: inline-flex; grid-column: 1; grid-row: auto; justify-self: start; \}\s*(?:\.pin-row:has\(\.pin-rowmeta \.pin-pill\[data-salinan-sempit\]\) > \.pin-pill \{ display: none; \}\s*)?\}/);
      c.expect(baru > 0 && baru > lama, "a list row's badge is still hidden below 560 px (RV-20)");
      return c.verdict("«Minta membaca lagi» ends in «✓ Terkirim»; every Mengajar submit gives its result word but the Uji Cepat launch, which lands on the running stage; a row's badge stays at 320 px");
    },
  },
  {
    id: "MENGAJAR3-KOSONG-01",
    run: async (ctx) => {
      const c = new Checks();
      let n = 0;
      // EXTENDED (Batch 3 integration): every Mengajar page, the home, «Lihat per soal», a learner's page and the
      // feedback page included, so no bare «pin-empty» line is left under src/app/mengajar
      const LAIN = [["src", "app", "mengajar", "page.tsx"], ["src", "app", "mengajar", "[kelas]", "soal", "page.tsx"],
        ["src", "app", "mengajar", "[kelas]", "murid", "[orang]", "page.tsx"], ["src", "app", "mengajar", "[kelas]", "umpan-balik", "page.tsx"]];
      for (const p of [SIAPKAN, CEPAT, HASIL, ULANG, KELAS, ...LAIN]) {
        const isi = kode(baca(ctx.repoRoot, ...p));
        c.expect(!/className="pin-empty"/.test(isi), `${p.slice(3).join("/")} still writes a bare «pin-empty» line`);
        n += (isi.match(/<Kosong jenis="belum"/g) ?? []).length;
      }
      c.expect(n >= 16, `only ${n} Empty states on the Mengajar pages`);
      return c.verdict(`every Mengajar page says its emptiness through Kosong (${n}), none with a bare «pin-empty» line`);
    },
  },
];
