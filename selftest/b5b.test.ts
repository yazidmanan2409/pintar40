/**
 * BATCH 5 · AGENT B · LEARNER WORKFLOWS (owner, 3 Nov: «BATCH 5 DEVELOPMENT GO — Reports, Learner Workflows and
 * Assessment Integrity»). Each guard is RED on the code Batch 4 closed with (31e456d) and GREEN after.
 *
 *  B5B-LEBAR-K01     W3.10 · the learner's bar is never wider than its window: it wraps when, and only when, its parts
 *                    do not fit (the session strip takes its own row), and under 640 px the tabs take their own row
 *                    (LearnerShell). Batch 0 measured the learner screens at 674-699 px in a 640 px window.
 *  B5B-NAMA-K01      W3.10 · accessible names on the learner screens: the tabs are named «Belajar» (J4Murid), the
 *                    assessment's progress dots are an image with a name, the lesson's page dots are hidden (the words
 *                    beside them say it), and the trail's step names stay in the accessibility tree on a phone.
 *  B5B-DIJAWAB-K01   W3.10 · the Uji Penguasaan says how many are answered, in words, as a status line: «Sudah dijawab:
 *                    7 dari 10.» (J4Murid), from the copy table's own words.
 *  B5B-PEMETAAN-K01  W2.12 RV-7 · a chapter with no Pemetaan Awal is never offered «Mulai Pemetaan Awal»: its status line
 *                    says it is not ready and whom to ask, it leads the home only when nothing else waits, the home and
 *                    the chapter page offer no button for it, and the refusal reached by its address wears the shell.
 *  B5B-MEDIA-K01     W2.12 RV-8 · a lesson recording whose file cannot be played says so in words, with its transcript
 *                    in its place, instead of a player stuck at «0:00 / 0:00» (the seeded file is genuinely absent).
 *  B5B-HASIL-K01     UX-40 · a new (unopened) result is the next action on Belajar's home: it leads every rank but a
 *                    session left open, is cleared by opening the result, and an opened one never leads; the database
 *                    keeps the person's own «seen» and nothing else (20261227100000).
 *  B5B-SERTIFIKAT-K01 UX-46 · a certificate that cannot be shown sends the reader back to «Sertifikat».
 *  B5B-TUR-K01       W3.15 RV-19, UX-38 · the tour no longer holds the landing (not modal, no inert page, no Tab trap,
 *                    neither veil catches a click), its headline draws no field-like box, its ring stands clear of its
 *                    target, and a new window size moves the target back above the sheet.
 *  B5B-PERAGAAN-K01  W3.13 · MODE PERAGAAN is Daisy's deep-ink context band (J6Peragaan): a region named «MODE PERAGAAN»,
 *                    full width, its two ways out the first stops after the skip link, the page title prefixed inside
 *                    the room (F9), and «Anda sudah keluar dari peragaan.» after «Keluar dari peragaan».
 *  B5B-AJAR-K01      W2.16 (DAISY-35 / CR-57) · a Guru who also holds a senior role gets the adult learning shell and no
 *                    child tour (item 3); every refusal under /belajar speaks to the reader's own context (item 2); the
 *                    hint button carries no emoji (item 4, «No emoji in the interface chrome»).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, type HleEvent } from "../src/lib/hle";

const baca = (root: string, p: string) => { try { return readFileSync(join(root, p), "utf8"); } catch { return ""; } };
/** Source without its comments, so a comment cannot satisfy a guard. */
const kode = (x: string) => x.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
/** CSS without its comments. */
const css = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "");
/** A module's exports, read without assuming any exists (so the guard is red, not a crash, on the base). */
const modul = async (p: string) => (await import(p).catch(() => ({}))) as Record<string, unknown>;
const fungsi = <T>(m: Record<string, unknown>, nama: string) => (typeof m[nama] === "function" ? (m[nama] as T) : null);
/** The learner's own bar: the last `return (` of CangkangPengalaman itself, before the staff shell's function. */
const barMurid = (cangkang: string) => {
  const inti = cangkang.slice(0, cangkang.indexOf("function shellStaf("));
  return inti.slice(inti.lastIndexOf("return ("));
};
/** The body of the first `@media (max-width: <w>)` block in a stylesheet. */
function blokMedia(sumber: string, lebar: string, mulaiDari = 0): string {
  const i = sumber.indexOf(`@media (max-width: ${lebar})`, mulaiDari);
  if (i < 0) return "";
  let d = 0;
  for (let j = sumber.indexOf("{", i); j < sumber.length; j++) {
    if (sumber[j] === "{") d++;
    else if (sumber[j] === "}" && --d === 0) return sumber.slice(i, j + 1);
  }
  return "";
}
function jelajah(dir: string): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...jelajah(p));
    else out.push(p);
  }
  return out;
}

type Posisi = { langkah: string; indeks: number; pelajaranSelesai: number; pelajaranTotal: number; selesai: boolean; pemetaanAda?: boolean };
type Kandidat = { tugas: { learning_assignment_id: string; title: string }; posisi: Posisi; berjalan: boolean; hasilBaru?: boolean };
const KEADAAN = (o: Record<string, string | null> = {}) => ({
  pre_assignment: "pre", pre_session: null, pre_status: null, post_assignment: "post", post_session: null, post_status: null, ...o,
});
const PELAJARAN = (dibaca: number, total: number) => Array.from({ length: total }, (_, i) => ({
  lesson_id: `l${i}`, modul: "m", urutan: i, judul: "t", ringkasan: null, isi: null, contoh: [], media: [], halaman: null,
  furthest_position: i < dibaca ? 10 : 0, total_positions: 10,
}));

export const b5bTests: SelfTest[] = [
  {
    id: "B5B-LEBAR-K01",
    run: async (ctx) => {
      const c = new Checks();
      const cangkang = kode(baca(ctx.repoRoot, "src/components/CangkangPengalaman.tsx"));
      const kepala = [...cangkang.matchAll(/<header className="([^"]*)"/g)].map((m) => m[1]);
      // the learner's own bar and the focus bar (assessment) are the two learner bars that are not the staff shell
      const murid = kepala.filter((k) => /\bpin-murid\b/.test(k));
      c.expect(murid.length >= 2, `${murid.length} learner bar(s) carry pin-murid; the learner and focus bars both must`);
      c.expect(/<header className="[^"]*\bpin-murid\b/.test(barMurid(cangkang)), "the learner's own bar does not wrap");
      const gaya = css(baca(ctx.repoRoot, "src/app/experience.css"));
      const dasar = /\.pin-murid \{([^}]*)\}/.exec(gaya)?.[1] ?? "";
      c.expect(/flex-wrap:\s*wrap/.test(dasar) && /height:\s*auto/.test(dasar) && /min-height:\s*var\(--shell-bar\)/.test(dasar),
        "the learner's bar keeps one fixed 56 px row at every width, so its parts are pushed past the window's edge");
      c.expect(/\.pin-murid \.pin-tabs \{\s*height:\s*var\(--shell-bar\)/.test(gaya), "the tabs lose their row height when the bar may wrap");
      const bawah640 = blokMedia(gaya, "639px", gaya.indexOf(".pin-murid {"));
      c.expect(/\.pin-murid \.pin-tabs \{[^}]*order:\s*10;[^}]*width:\s*100%/.test(bawah640),
        "under 640 px the learner's tabs do not take their own row (LearnerShell)");
      c.expect(/\.pin-murid \.pin-sesi \{[^}]*width:\s*100%/.test(bawah640), "under 640 px the session strip does not take its own row");
      return c.verdict("the learner and focus bars (src/components/CangkangPengalaman.tsx) carry pin-murid; in src/app/experience.css "
        + "the bar wraps (flex-wrap, height auto, min-height the shell bar) so «Keluar» is never past the window's edge, the tabs keep "
        + "the bar's height, and under 640 px the session strip and the tabs each take their own row (LearnerShell)");
    },
  },
  {
    id: "B5B-NAMA-K01",
    run: async (ctx) => {
      const c = new Checks();
      const cangkang = kode(baca(ctx.repoRoot, "src/components/CangkangPengalaman.tsx"));
      const akhir = barMurid(cangkang);
      c.expect(/<nav className="pin-tabs" aria-label=\{t\("nav\.belajar", "learner", \{ locale \}\)\}>/.test(akhir),
        "the learner's tabs are not named «Belajar» (J4Murid)");
      c.expect(!/aria-label=\{t\("app\.name", "learner"/.test(akhir), "the learner's tabs are named «PINTAR», which says nothing about them");
      const pemain = kode(baca(ctx.repoRoot, "src/app/belajar/_components/ItemPlayer.tsx"));
      c.expect(/<span className="pin-dots" role="img" aria-label=\{/.test(pemain), "the assessment's progress dots carry a name no role exposes");
      const pelajaran = kode(baca(ctx.repoRoot, "src/app/belajar/_components/LessonPlayer.tsx"));
      c.expect(/<span className="pin-dots" aria-hidden="true">/.test(pelajaran), "the lesson's page dots are read out as well as the words beside them");
      const gaya = css(baca(ctx.repoRoot, "src/app/experience.css"));
      const telepon = [...gaya.matchAll(/\.pin-jstep \.pin-jname \{([^}]*)\}/g)].map((m) => m[1]);
      c.expect(telepon.length >= 2 && telepon.every((b) => !/display:\s*none/.test(b)),
        "on a phone the trail's step names are display:none, so a screen reader meets five unnamed steps");
      c.expect(telepon.some((b) => /clip-path:\s*inset\(50%\)/.test(b)), "the trail's step names are not kept for a screen reader on a phone");
      return c.verdict("the learner's tabs are named «Belajar», the Uji Penguasaan's progress dots are role=img with their name, the "
        + "lesson's page dots are hidden beside their words, and on a phone the trail's step names are hidden from the eye only");
    },
  },
  {
    id: "B5B-DIJAWAB-K01",
    run: async (ctx) => {
      const c = new Checks();
      const pemain = kode(baca(ctx.repoRoot, "src/app/belajar/_components/ItemPlayer.tsx"));
      c.expect(/const jumlahDijawab = paper\.filter\(\(p\) => accepted\[p\.presentedItemId\]\)\.length;/.test(pemain),
        "the player does not count the answers the server accepted");
      c.expect(/\{formal && \(\s*<p className="pin-meta" role="status"[^>]*>\s*\{jumlahDijawab > 0\s*\?\s*`\$\{kata\("posttest\.answered"\)\}: \$\{format\.number\(jumlahDijawab, props\.locale\)\} \$\{kata\("siklus\.dari"\)\} \$\{format\.number\(paper\.length, props\.locale\)\}\.`/.test(pemain),
        "the Uji Penguasaan does not say «Sudah dijawab: n dari N.» in a status line");
      c.expect(`${t("posttest.answered", "learner")}: 7 ${t("siklus.dari", "learner")} 10.` === "Sudah dijawab: 7 dari 10.",
        "the line is not J4Murid's «Sudah dijawab: 7 dari 10.»");
      c.expect(`${t("posttest.answered", "learner", { locale: "en" })}: 7 ${t("siklus.dari", "learner", { locale: "en" })} 10.` === "Answered: 7 of 10.",
        "the line has no English telling");
      return c.verdict("in formal mode the player (ItemPlayer.tsx) keeps a status line «Sudah dijawab: n dari N.» (J4Murid), counted from "
        + "the answers the server accepted and built from the copy table's own posttest.answered and siklus.dari, in both languages");
    },
  },
  {
    id: "B5B-PEMETAAN-K01",
    run: async (ctx) => {
      const c = new Checks();
      const m = await modul("../src/lib/siklus");
      const posisi = fungsi<(s: unknown, l: unknown) => Posisi>(m, "posisi");
      const tanpa = fungsi<(p: Posisi) => boolean>(m, "tanpaPemetaan");
      const statusKey = fungsi<(p: Posisi) => string>(m, "statusKey");
      const peringkat = fungsi<(k: Kandidat[]) => { utama: Kandidat | null; sisa: Kandidat[] }>(m, "peringkat");
      c.expect(tanpa !== null, "src/lib/siklus.ts cannot tell a chapter with no Pemetaan Awal (tanpaPemetaan)");
      if (posisi && tanpa && statusKey && peringkat) {
        const tidakAda = posisi(KEADAAN({ pre_assignment: null }), PELAJARAN(0, 3));
        const ada = posisi(KEADAAN(), PELAJARAN(0, 3));
        c.expect(tanpa(tidakAda) && !tanpa(ada), "a chapter with no Pemetaan Awal is not told apart from one that has one");
        c.expect(statusKey(tidakAda) === "cycle.pemetaan.belum_ada" && statusKey(ada) === "siklus.di.pemetaan",
          "the status line of a chapter with no Pemetaan Awal does not say it is not ready yet");
        const K = (title: string, p: Posisi): Kandidat => ({ tugas: { learning_assignment_id: title, title }, posisi: p, berjalan: false });
        const r = peringkat([K("a tanpa", tidakAda), K("b peta", ada)]);
        c.expect(r.utama?.tugas.title === "b peta", `the home leads with «${r.utama?.tugas.title}», a chapter with nothing to start`);
        const sendiri = peringkat([K("a tanpa", tidakAda)]);
        c.expect(sendiri.utama?.tugas.title === "a tanpa", "a learner whose only chapter waits on its Pemetaan Awal is told nothing");
      }
      const beranda = kode(baca(ctx.repoRoot, "src/app/belajar/page.tsx"));
      c.expect(/case "PEMETAAN": return tanpaPemetaan\(k\.posisi\) \? null :/.test(beranda), "the home still offers «Mulai Pemetaan Awal» for a chapter with none");
      const tugas = kode(baca(ctx.repoRoot, "src/app/belajar/[tugas]/page.tsx"));
      c.expect(/case "PEMETAAN":\s*return tanpaPemetaan\(p\) \? null :/.test(tugas), "the chapter page still offers «Mulai Pemetaan Awal» for a chapter with none");
      const halaman = kode(baca(ctx.repoRoot, "src/app/belajar/[tugas]/pemetaan/page.tsx"));
      c.expect(/<CangkangPengalaman locale=\{locale\} current="belajar" \/>\s*<HalamanPenolakan[^>]*messageKey="cycle\.pemetaan\.belum_ada"/.test(halaman),
        "the «not ready» refusal is still a page without the learner's shell");
      return c.verdict("src/lib/siklus.ts tells a chapter with no Pemetaan Awal apart (tanpaPemetaan), its status line is "
        + "cycle.pemetaan.belum_ada, it leads the home only when nothing else waits; the home and the chapter page offer no "
        + "button for it; and the refusal at its address wears the learner's shell");
    },
  },
  {
    id: "B5B-MEDIA-K01",
    run: async (ctx) => {
      const c = new Checks();
      const p = kode(baca(ctx.repoRoot, "src/app/belajar/_components/LessonPlayer.tsx"));
      c.expect(/const \[tidakAda, setTidakAda\] = useState\(!entry\.url\);/.test(p), "a recording with no address still draws a player");
      c.expect(/el\.error !== null \|\| el\.networkState === HTMLMediaElement\.NETWORK_NO_SOURCE/.test(p) && /if \(gagal\(el\)\) \{ setTidakAda\(true\); return; \}/.test(p),
        "an error that came before the page's script ran is never read from the element");
      c.expect((p.match(/onError=\{\(\) => setTidakAda\(true\)\}/g) ?? []).length === 2, "the audio and video players do not report a file that fails");
      c.expect(/if \(tidakAda && \(entry\.jenis === "audio" \|\| entry\.jenis === "video"\)\) \{[\s\S]{0,200}role="status"[\s\S]{0,200}lesson\.media\.tidak_ada[\s\S]{0,200}pin-ltrans/.test(p),
        "a recording that cannot be played is not said in words with its transcript in its place");
      for (const locale of ["id", "en"] as const) {
        for (const k of ["lesson.media.tidak_ada", "lesson.media.tidak_ada_teks"] as HleEvent[]) {
          const kata = t(k, "learner", { locale });
          c.expect(kata && !kata.startsWith("lesson."), `${k} has no ${locale} telling`);
        }
      }
      c.expect(t("lesson.media.tidak_ada", "learner").startsWith("Rekaman ini tidak tersedia."), "the line does not say plainly that the recording is not available");
      // the seeded file is genuinely absent: the seed names it and nothing in the repository supplies it
      const benih = baca(ctx.repoRoot, "supabase/seed/learning_cycle.sql");
      c.expect(benih.includes("pelajaran/pecahan-senilai.mp3"), "the seed no longer names the recording this guards");
      return c.verdict("LessonPlayer.tsx says «Rekaman ini tidak tersedia.» in a status line with the transcript in its place when a "
        + "recording has no address, fails to load, or failed before the script ran (read from the element), instead of a player at "
        + "«0:00 / 0:00»; both languages; the seeded pecahan-senilai.mp3 is named by the seed and supplied by nothing");
    },
  },
  {
    id: "B5B-HASIL-K01",
    run: async (ctx) => {
      const c = new Checks();
      const m = await modul("../src/lib/siklus");
      const posisi = fungsi<(s: unknown, l: unknown) => Posisi>(m, "posisi");
      const peringkat = fungsi<(k: Kandidat[]) => { utama: Kandidat | null; sisa: Kandidat[] }>(m, "peringkat");
      if (posisi && peringkat) {
        const selesai = posisi(KEADAAN({ pre_status: "FINALIZED", post_session: "p", post_status: "FINALIZED" }), PELAJARAN(3, 3));
        const membaca = posisi(KEADAAN({ pre_status: "FINALIZED" }), PELAJARAN(1, 3));
        const ujian = posisi(KEADAAN({ pre_status: "FINALIZED", post_session: "q", post_status: "IN_PROGRESS" }), PELAJARAN(3, 3));
        const K = (title: string, p: Posisi, o: Partial<Kandidat> = {}): Kandidat => ({ tugas: { learning_assignment_id: title, title }, posisi: p, berjalan: false, ...o });
        const r1 = peringkat([K("membaca", membaca), K("hasil baru", selesai, { hasilBaru: true })]);
        c.expect(r1.utama?.tugas.title === "hasil baru", `a new result is not the next action (the home leads with «${r1.utama?.tugas.title}»)`);
        const r2 = peringkat([K("hasil baru", selesai, { hasilBaru: true }), K("ujian", ujian, { berjalan: true })]);
        c.expect(r2.utama?.tugas.title === "ujian", "a new result displaced a session left open");
        const r3 = peringkat([K("membaca", membaca), K("hasil lama", selesai)]);
        c.expect(r3.utama?.tugas.title === "membaca", "a result already opened leads again");
        c.expect(peringkat([K("hasil lama", selesai)]).utama === null, "a result already opened is offered as the next action");
        c.expect(peringkat([K("hasil baru", selesai, { hasilBaru: true })]).utama?.tugas.title === "hasil baru",
          "a learner whose only news is a new result is told nothing");
      } else c.expect(false, "src/lib/siklus.ts could not be read");
      const beranda = kode(baca(ctx.repoRoot, "src/app/belajar/page.tsx"));
      c.expect(/const baru = await engine\.newResults\(db\)\.catch\(/.test(beranda) && /k\.hasilBaru = k\.posisi\.selesai && baru\.has\(k\.tugas\.learning_assignment_id\)/.test(beranda)
        && beranda.indexOf("k.hasilBaru =") < beranda.indexOf("peringkat(kandidat)"), "the home does not ask which results are new before ranking");
      c.expect(/siklus\.habis\.judul/.test(beranda), "the home lost its «all done» state");
      const hasil = kode(baca(ctx.repoRoot, "src/app/belajar/[tugas]/hasil/page.tsx"));
      c.expect(/await engine\.noteResultSeen\(db, state\.post_session\)/.test(hasil), "opening a result does not clear it from the next action");
      const mesin = kode(baca(ctx.repoRoot, "src/lib/assessment-engine/index.ts"));
      c.expect(/call\(db, "my_new_results"\)/.test(mesin) && /call\(db, "note_result_seen", \{ p_session: sessionId \}\)/.test(mesin),
        "the engine does not reach the two result-view functions");
      const mig = baca(ctx.repoRoot, "supabase/migrations/20261227100000_a_new_result_is_the_next_step.sql");
      c.expect(/alter table public\.result_views enable row level security;/.test(mig) && /revoke all on table public\.result_views from public, anon, authenticated;/.test(mig),
        "the result-view table is open to clients");
      c.expect((mig.match(/current_person_id\(\)/g) ?? []).length >= 3, "the result-view functions are not scoped to the caller");
      c.expect(/'note_result_seen', 'LEARNER'/.test(mig) && /'my_new_results', 'LEARNER'/.test(mig), "the result-view functions are not in client_rpc_registry");
      c.expect(/where s\.mode = 'POST_TEST' and s\.status = 'FINALIZED'\s*on conflict \(session_id\) do nothing;/.test(mig),
        "results that existed before the migration come back as new");
      return c.verdict("peringkat (src/lib/siklus.ts) leads with a new result after a session left open and before any other work, "
        + "never with an opened one; the home asks my_new_results before ranking and keeps its «all done» state; opening the result "
        + "calls note_result_seen; 20261227100000 keeps the person's own «seen» in a table no client reaches, scoped to "
        + "current_person_id(), registered LEARNER, with every earlier result recorded as seen");
    },
  },
  {
    id: "B5B-SERTIFIKAT-K01",
    run: async (ctx) => {
      const c = new Checks();
      const p = kode(baca(ctx.repoRoot, "src/app/belajar/[tugas]/sertifikat/page.tsx"));
      const tolak = p.slice(p.indexOf("function Refusal"));
      c.expect(/<HalamanPenolakan[^>]*backHref="\/belajar\/sertifikat"[^>]*backKey="tolak\.kembali_sertifikat"/.test(tolak),
        "the certificate refusal's way back is not labelled for the certificates list");
      c.expect(t("tolak.kembali_sertifikat" as HleEvent, "learner") === "Kembali ke Sertifikat"
        && t("tolak.kembali_sertifikat" as HleEvent, "learner", { locale: "en" }) === "Back to Certificates",
        "the way back does not say «Kembali ke Sertifikat»");
      return c.verdict("a certificate that cannot be shown sends the reader to /belajar/sertifikat with «Kembali ke Sertifikat» "
        + "(«Back to Certificates»), not «Kembali ke Belajar»");
    },
  },
  {
    id: "B5B-TUR-K01",
    run: async (ctx) => {
      const c = new Checks();
      const tur = kode(baca(ctx.repoRoot, "src/components/tur/Tur.tsx"));
      c.expect(!/aria-modal/.test(tur), "the tour still declares itself modal");
      c.expect(!/setAttribute\("inert"/.test(tur) && !/setAttribute\("aria-hidden"/.test(tur), "the tour still takes the page away while it is open");
      c.expect(!/e\.key !== "Tab"|e\.key === "Tab"/.test(tur), "the tour still holds Tab inside its card");
      c.expect(/role="dialog"/.test(tur) && /aria-labelledby="pin-tur-judul"/.test(tur), "the tour card lost its role or its name");
      c.expect(/const ulang = \(\) => ukur\(true\);\s*window\.addEventListener\("resize", ulang\);\s*window\.addEventListener\("orientationchange", ulang\);/.test(tur),
        "a new window size leaves the target under the sheet");
      c.expect(/const k: Petak = kotakCincin\(\{/.test(tur), "the ring is still drawn on its target's own edge");
      const m = await modul("../src/lib/tur");
      const kotak = fungsi<(r: { top: number; left: number; width: number; height: number }) => { top: number; left: number; width: number; height: number }>(m, "kotakCincin");
      const k = kotak?.({ top: 100, left: 50, width: 200, height: 40 });
      c.expect(k?.top === 92 && k.left === 42 && k.width === 216 && k.height === 56, "the ring does not stand 8 px clear of its target on every side");
      const gaya = css(baca(ctx.repoRoot, "src/app/experience.css"));
      c.expect(/\.pin-tur-judul:focus \{ outline: none; \}/.test(gaya), "the headline still draws a field-like box when the tour opens by itself");
      c.expect(/pointer-events:\s*none/.test(/\.pin-tur-tirai \{([^}]*)\}/.exec(gaya)?.[1] ?? ""), "the veil without a target catches the page's clicks");
      return c.verdict("Tur.tsx is a non-modal dialog (no aria-modal, no inert or aria-hidden page, no Tab trap; role and name kept), "
        + "the ring is the target grown 8 px on every side (kotakCincin), a resize or a turned phone moves the target back above the "
        + "sheet, the headline draws no box, and neither veil catches a click");
    },
  },
  {
    id: "B5B-PERAGAAN-K01",
    run: async (ctx) => {
      const c = new Checks();
      const pita = kode(baca(ctx.repoRoot, "src/app/_evaluation-banner.tsx"));
      c.expect(/<div className="pin-konteks pin-noprint" role="region" aria-label=\{e\("evaluasi\.mode"\)\}/.test(pita),
        "the band is not a region named «MODE PERAGAAN»");
      const ganti = pita.indexOf('<Link href="/evaluasi">{e("evaluasi.ganti")}</Link>');
      const keluar = pita.indexOf('{e("evaluasi.keluar")}');
      c.expect(ganti > 0 && keluar > ganti && !/<(a|button|Link|input)\b/.test(pita.slice(pita.indexOf("pin-konteks"), ganti)),
        "the band's two ways out are not its first focusable parts, in order");
      c.expect(!/\bfixed\b/.test(pita), "the band is fixed; the tour measures its ceiling from it in the flow");
      const gaya = css(baca(ctx.repoRoot, "src/app/experience.css"));
      const band = /\.pin-konteks \{([^}]*)\}/.exec(gaya)?.[1] ?? "";
      c.expect(/background:\s*var\(--context\)/.test(band) && /color:\s*var\(--context-ink\)/.test(band)
        && /margin-inline:\s*calc\(var\(--gutter\) \* -1\)/.test(band), "the band is not the full-width deep-ink context band");
      c.expect(/\.pin-konteks a, \.pin-konteks \.pin-konteks-tombol \{[^}]*text-decoration:\s*underline/.test(gaya), "the band's ways out are told by colour alone");
      const tata = kode(baca(ctx.repoRoot, "src/app/layout.tsx"));
      const lompat = tata.indexOf('<a href="#isi"');
      const bandDi = tata.indexOf("<EvaluationBanner />");
      c.expect(lompat > 0 && bandDi > lompat && tata.slice(lompat, bandDi).replace(/<a href="#isi"[^]*?<\/a>/, "").trim() === "",
        "the band is not drawn directly after the skip link");
      const j = await modul("../src/lib/judul-halaman");
      const dalam = fungsi<(a: unknown, b: string | null) => unknown>(j, "judulDalamPeragaan");
      c.expect(dalam !== null && dalam("Belajar", "MODE PERAGAAN") === "MODE PERAGAAN · Belajar"
        && JSON.stringify(dalam({ absolute: "PINTAR ID" }, "MODE PERAGAAN")) === JSON.stringify({ absolute: "MODE PERAGAAN · PINTAR ID" })
        && dalam("Belajar", null) === "Belajar", "the page title inside the room does not say where you are (F9)");
      const judul = kode(baca(ctx.repoRoot, "src/lib/judul-halaman.ts"));
      c.expect(/evaluationState\(\)/.test(judul) && /judulDalamPeragaan\(judulDari\(rute, locale\), mode\)/.test(judul), "page titles do not ask whether the room is open");
      const aksi = kode(baca(ctx.repoRoot, "src/app/evaluasi/actions.ts"));
      c.expect(/redirect\("\/masuk\?sesi=peragaan&lanjut=%2Fevaluasi"\)/.test(aksi), "leaving the room does not carry its result");
      const masuk = kode(baca(ctx.repoRoot, "src/app/masuk/page.tsx"));
      c.expect(/sp\.sesi === "peragaan" \? <p className="pin-msg pin-msg-note" role="status"[^>]*>\{s\("evaluasi\.keluar_selesai"\)\}/.test(masuk),
        "nothing says «Anda sudah keluar dari peragaan.» after leaving");
      c.expect(t("evaluasi.keluar_selesai" as HleEvent, "public") === "Anda sudah keluar dari peragaan.", "the leaving line is not Daisy's words");
      return c.verdict("_evaluation-banner.tsx is a region named «MODE PERAGAAN» in pin-konteks (context / context-ink, full width, "
        + "underlined ways out, not fixed), drawn by layout.tsx directly after the skip link with «Ganti sudut pandang» then «Keluar "
        + "dari peragaan» as its first focusable parts; every page title is prefixed «MODE PERAGAAN · » while a persona is held "
        + "(judulDalamPeragaan, F9); leaving lands on sign-in with «Anda sudah keluar dari peragaan.» and returns to the room");
    },
  },
  {
    id: "B5B-AJAR-K01",
    run: async (ctx) => {
      const c = new Checks();
      const m = await modul("../src/lib/pembelajaran");
      const konteks = fungsi<(p: string[] | null) => { mengajar: boolean; turBelajar: boolean }>(m, "konteksPembelajaran");
      const persona = fungsi<(p: string[] | null) => string>(m, "personaPembelajaran");
      if (konteks) {
        for (const senior of ["HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN"]) {
          const k = konteks(["EDUCATOR", senior]);
          c.expect(k.mengajar && !k.turBelajar, `a Guru who is also ${senior} gets the child's learner shell or tour`);
          c.expect(!konteks([senior]).mengajar && konteks([senior]).turBelajar, `${senior} alone lost the learner shell and its tour (§H-3)`);
        }
        c.expect(!konteks([]).mengajar && !konteks(null).mengajar, "a learner is given the educator's shell");
      }
      c.expect(persona !== null && persona(["EDUCATOR", "DEAN"]) === "educator" && persona([]) === "learner",
        "a refusal on /belajar cannot tell whom it speaks to (personaPembelajaran)");
      const belajar = join(ctx.repoRoot, "src", "app", "belajar");
      let n = 0;
      for (const f of jelajah(belajar).filter((x) => /\.tsx$/.test(x))) {
        const src = kode(readFileSync(f, "utf8"));
        for (const tag of src.matchAll(/<HalamanPenolakan\b[^>]*\/>/g)) {
          n++;
          c.expect(/persona=\{(persona|personaPembelajaran\(await peranSaya\(\)\))\}/.test(tag[0]),
            `${relative(ctx.repoRoot, f)}: a refusal speaks to a learner whoever reads it: ${tag[0].slice(0, 80)}`);
        }
      }
      c.expect(n >= 6, `only ${n} refusal(s) found under src/app/belajar`);
      const tanpaEmoji = /^[^\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]*$/u;
      for (const k of ["assist.SD", "assist.SMP", "assist.SMA", "assist.UNIVERSITAS"] as HleEvent[]) {
        for (const locale of ["id", "en"] as const) {
          c.expect(tanpaEmoji.test(t(k, "learner", { locale })), `${k} (${locale}) carries an emoji in the interface chrome`);
        }
      }
      c.expect(!tanpaEmoji.test("🧭 Perlu arah?"), "the emoji check does not catch a planted emoji");
      return c.verdict(`konteksPembelajaran gives a Guru who also holds a senior role the adult learning shell and no child tour while a `
        + `senior reader who does not teach keeps the learner shell and tour (§H-3); all ${n} refusals under src/app/belajar pass the `
        + "reader's own persona (personaPembelajaran); the hint button's four labels carry no emoji in either language (plant caught)");
    },
  },
];
