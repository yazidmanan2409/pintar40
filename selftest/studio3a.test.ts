/**
 * BATCH 3 · STUDIO AND TEACHING, PART A: THE PACKAGE PAGE, THE REVIEW AND STUDIO'S HOME (owner authorisation, 2 Nov;
 * register docs/completion-4.0/C-OPEN-WORK-REGISTER-2026-11-02.md W1.1, W1.4, W1.6, W1.7, W1.8, W1.9, W1.12; matrix
 * J4.1, J4.3–J4.6, J4.12; Daisy's design system, origin/ux-1/daisy-experience components/J1Terbit, Progress, Tabs,
 * Confirmation, ActionFeedback, Badge). Each guard is RED on the code before Batch 3 and GREEN after it.
 *
 *  STUDIO3A-J1-01        W1.1 · J1TERBIT. Rendered: the seven steps are Progress's named steps (a word each, no numbered
 *                        circle; a done one read as «Selesai»), and the current step alone opens in a panel below them
 *                        («Sekarang», its name, what it does, who takes it, its one action); «Terbitkan» is
 *                        «Menerbitkan…» then «✓ Diterbitkan»; Studio's tabs fade at the edge while more follow.
 *  STUDIO3A-LANGKAH-01   W1.4 · FEWER PRESSES, AND EVERY STEP SAYS WHAT IT DID. Rendered: a reader who may create and
 *                        lock the release does both in one press (and the author, who may not lock, only creates); a
 *                        content step's result is said in the next step's panel, naming the step it completed; a
 *                        refusal is said there too.
 *  STUDIO3A-KEMBALI-01   W1.6 UI · SEND BACK TO THE AUTHOR. Rendered: the reviewer is offered «Kembalikan ke
 *                        penyusun» beside «Setujui isi», the author is not; the in-page confirmation asks for a reason
 *                        of 10–1000 characters and calls kembalikan_paket; each of its refusals, read from its
 *                        migration, is a code with a sentence in both languages; the author sees the reason, who gave
 *                        it and when, the correction upload in the line, and «Tandai sudah tersusun».
 *  STUDIO3A-RIWAYAT-01   W1.8 UI · «Riwayat perbaikan» names every review outcome of each version (who sent it back and
 *                        why, who approved it) from content_review_outcomes; the Studio object is «paket» there.
 *  STUDIO3A-AKUI-01      W1.12 · the author of a package is never offered «Sudah saya tinjau» on its findings.
 *  STUDIO3A-BERANDA-01   W1.7 · Studio's home: every count opens its list (a tab the reader holds, or the home's own
 *                        list narrowed to what it counts); every package says where it stands, «✓ Terbit» as a Badge.
 *  STUDIO3A-BAHASA-01    W1.9 (these pages) · every word of the package page, Studio's home, the review queue and the
 *                        steps is in the reader's language; none of their copy says «siswa», «kursus» for the Studio
 *                        object, or a decision number.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { render } from "./ux2.test";

const PAKET = "src/app/studio/paket/[course]/page.tsx";
const BERANDA = "src/app/studio/page.tsx";
const TINJAU = "src/app/studio/tinjau/page.tsx";
const LANGKAH = "src/components/studio/LangkahTerbit.tsx";
const MIG_KEMBALI = "supabase/migrations/20261214100000_a_content_step_is_one_transaction.sql";

const baca = (root: string, p: string) => readFileSync(join(root, p), "utf8");
/** Source without its comments, so a comment cannot satisfy a guard. */
const kode = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
const teks = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
  .replace(/\s+/g, " ").trim();

async function muat(p: string): Promise<Record<string, unknown> | null> {
  try { return (await import(p)) as Record<string, unknown>; } catch { return null; }
}

type T = (k: string, persona?: string, ctx?: { locale?: "id" | "en" }) => string;

/** The steps, rendered under an app router (useRouter), one HTML string per case. */
function gambarLangkah(repoRoot: string, kasus: unknown[]): { html: string[]; galat: string } {
  const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
    "(async () => {" +
    '  const { createElement: h } = await import("react");' +
    '  const { renderToStaticMarkup } = await import("react-dom/server");' +
    '  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime.js");' +
    '  const m = await import("file://" + process.cwd() + "/src/components/studio/LangkahTerbit.tsx");' +
    "  const L = m.default?.default ?? m.default;" +
    "  const r = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };" +
    "  process.stdout.write(JSON.stringify(JSON.parse(process.env.KASUS_3A).map((k) =>" +
    "    renderToStaticMarkup(h(AppRouterContext.Provider, { value: r }, h(L, k))))));" +
    "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
    cwd: repoRoot, encoding: "utf8", maxBuffer: 1 << 24, env: { ...process.env, KASUS_3A: JSON.stringify(kasus) },
  });
  let html: string[] = [];
  try { html = JSON.parse(anak.stdout); } catch { /* reported by the caller */ }
  return { html, galat: anak.status === 0 && html.length === kasus.length ? "" : (anak.stderr || "no output").split("\n").slice(0, 3).join(" ") };
}

const SEMUA = ["CAN_DRAFT", "CAN_REVIEW", "CAN_FREEZE_RELEASE", "CAN_PUBLISH"];
const PENYUSUN = { saya: "gladys", penyusun: "gladys", kemampuan: SEMUA };
const KAPRODI = { saya: "kaprodi", penyusun: "gladys", kemampuan: ["CAN_DRAFT", "CAN_REVIEW", "CAN_FREEZE_RELEASE"] };
const RILIS = "11111111-1111-4111-8111-111111111111";
const KURSUS = "22222222-2222-4222-8222-222222222222";
const rilis = (status: string) => ({ id: RILIS, status, terbitPada: status === "PUBLISHED" ? "2026-09-25T02:00:00Z" : null });
function props(kursus: string, r: ReturnType<typeof rilis> | null, siapa: typeof PENYUSUN, lain: Record<string, unknown> = {}, locale = "id") {
  return {
    locale, course: KURSUS, fakta: { statusKursus: kursus, terbitan: r ? { status: r.status } : null },
    terbitan: r, kemampuan: siapa.kemampuan, saya: siapa.saya, penyusun: siapa.penyusun, ...lain,
  };
}
const tombolKirim = (x: string) => [...x.matchAll(/<button\b(?=[^>]*\btype="submit")[^>]*>([^<]+)<\/button>/g)].map((m) => m[1]);
const tombolBiasa = (x: string) => [...x.matchAll(/<button\b(?=[^>]*\btype="button")[^>]*>([^<]+)<\/button>/g)].map((m) => m[1]);
/** The current step's panel, alone. */
const panel = (x: string) => {
  const a = x.indexOf('<div class="pin-lt-panel"');
  return a < 0 ? "" : x.slice(a);
};

export const studio3aTests: SelfTest[] = [
  {
    id: "STUDIO3A-J1-01",
    run: async (ctx) => {
      const c = new Checks();
      const { t } = (await import("../src/lib/hle")) as unknown as { t: T };
      const s = (k: string, locale: "id" | "en" = "id") => t(k, "staff", { locale });
      const KASUS = [
        props("IN_REVIEW", null, KAPRODI),
        props("FROZEN", rilis("FROZEN"), PENYUSUN),
        props("PUBLISHED", rilis("PUBLISHED"), PENYUSUN),
        props("IN_REVIEW", null, KAPRODI, {}, "en"),
      ];
      const { html, galat } = gambarLangkah(ctx.repoRoot, KASUS);
      if (c.expect(galat === "", `the steps could not be rendered: ${galat}`)) {
        const [tinjau, beku, terbit, en] = html;
        const JUDUL = ["susun", "periksa", "ajukan", "setujui", "buat", "kunci", "terbitkan"].map((k) => s(`studio.langkah.${k}.judul`));
        // 1. Progress's named steps: one word each, in order, no numbered circle; done ones read as «Selesai»
        const daftar = /<ol class="pin-lt-daftar"[^>]*>([\s\S]*?)<\/ol>/.exec(tinjau)?.[1] ?? "";
        const kata = [...daftar.matchAll(/<p class="pin-lt-judul">([^<]+)</g)].map((m) => m[1]);
        c.expect(JSON.stringify(kata.slice(0, 7)) === JSON.stringify(JUDUL) && kata.length === 8,
          `the steps do not read as the seven named steps and Terbit: ${JSON.stringify(kata)}`);
        c.expect(!/pin-lt-no/.test(tinjau) && !/aria-hidden="true">\d<\/span>/.test(daftar), "the steps still carry a numbered circle");
        const selesai = (daftar.match(/<span class="pin-sr"> \(([^)]+)\)<\/span>/g) ?? []);
        c.expect(selesai.length === 3 && selesai.every((x) => x.includes(s("studio.langkah.keadaan.selesai"))),
          `at review three steps are done and each is read as «${s("studio.langkah.keadaan.selesai")}»: ${selesai.length}`);
        // 2. done steps collapsed: no step's sentence in the list; only the current step's sentence, in the panel
        c.expect(!daftar.includes(s("studio.langkah.susun.arti")) && !daftar.includes(s("studio.langkah.setujui.arti")),
          "a step's sentence is drawn in the list, not only the current step's in its panel");
        const p = panel(tinjau);
        c.expect((tinjau.match(/class="pin-lt-panel"/g) ?? []).length === 1, "not exactly one panel");
        // restated at A5 B10 (retrospective R3-3): the package title is the page's h1, so the panel's heading is h3
        c.expect(new RegExp(`<p class="pin-eyebrow">${s("studio.langkah.keadaan.kini")}</p><h3 id="lt-kini" class="pin-lt-panel-judul">${JUDUL[3]}`).test(p),
          `the panel does not open with «${s("studio.langkah.keadaan.kini")}» and the current step's name`);
        c.expect(p.includes(s("studio.langkah.setujui.arti")) && p.includes(s("studio.langkah.oleh"))
          && tombolKirim(p).includes(s("studio.langkah.setujui.tombol")), "the panel does not hold the step's sentence, who takes it and its action");
        for (const k of ["susun", "periksa", "ajukan", "buat", "kunci", "terbitkan"]) {
          c.expect(!teks(p).includes(s(`studio.langkah.${k}.arti`)), `the panel at review also says another step's sentence (${k})`);
        }
        c.expect((tinjau.match(/aria-current="step"/g) ?? []).length === 1, "not exactly one step is current");
        // 3. «Terbitkan» answers «Menerbitkan…», and the panel after publishing says since when
        c.expect(tombolKirim(panel(beku)).includes(s("studio.langkah.terbitkan.tombol")), "a locked release does not offer «Terbitkan» in its panel");
        const src = kode(baca(ctx.repoRoot, LANGKAH));
        c.expect(/sibuk=\{s\("tombol\.menerbitkan"\)\}/.test(src) && /selesai=\{[^}]*s\("studio\.langkah\.selesai\.terbitkan"\)/.test(src),
          "«Terbitkan» does not answer «Menerbitkan…» and «✓ Diterbitkan»");
        c.expect(s("tombol.menerbitkan") === "Menerbitkan…" && s("studio.langkah.selesai.terbitkan") === "Diterbitkan", "the ruled publishing words changed");
        c.expect(panel(terbit).includes(s("studio.langkah.terbit.sejak")) && /pin-lt-akhir pin-lt-selesai" aria-current="step"/.test(terbit),
          "a published package's panel does not say since when, or the list does not end at Terbit");
        c.expect(panel(en).includes(s("studio.langkah.setujui.arti", "en")), "(en) the panel is not in English");
      }
      // 4. Studio's tabs fade at the right edge while more follow (Daisy F10), drawn with tokens only
      const tab = kode(baca(ctx.repoRoot, "src/components/studio/TabStudio.tsx"));
      c.expect(/classList\.toggle\("pin-switch-lebih", lebih\)/.test(tab) && /scrollWidth > el\.clientWidth/.test(tab)
        && /addEventListener\("scroll"/.test(tab), "the tab row does not mark itself while more tabs lie past its edge");
      const css = baca(ctx.repoRoot, "src/app/experience.css");
      const pudar = /\.pin-switch\.pin-switch-lebih \{([^}]*)\}/.exec(css)?.[1] ?? "";
      c.expect(/mask-image: linear-gradient\(to right, var\(--[a-z0-9-]+\) calc\(100% - var\(--space-8\)\), transparent\)/.test(pudar)
        && !/#[0-9a-f]{3,8}\b|\d+px/i.test(pudar), `the tab edge does not fade, or fades with a raw value: ${pudar.trim().slice(0, 120)}`);
      const r = render(ctx.repoRoot, "src/components/studio/TabStudio.tsx", { tab: [["/studio", "Studio"], ["/studio/tinjau", "Antrean Tinjauan"]], label: "Studio" });
      c.expect(r.ok && /<nav class="pin-switch" aria-label="Studio">/.test(r.html), `the tabs do not render as the tab row: ${r.galat}`);
      // 5. the panel and the steps are styled in tokens (UX1-S0-TOKEN-01 covers the file; the new rules exist)
      c.expect(/\.pin-lt-panel \{[^}]*border-radius: var\(--radius-lg\)/.test(css) && /\.pin-lt-langkah\[aria-current="step"\]::before \{[^}]*var\(--pintar-primary\)/.test(css),
        "the panel or the current step's ring is not styled");
      return c.verdict("rendered from src/components/studio/LangkahTerbit.tsx in id and en: the seven steps are Daisy's J1Terbit " +
        "named steps (a word each, no numbered circle, the done ones read as «Selesai», one current), no step's sentence sits in " +
        "the list, and the current step alone opens in a panel with «Sekarang», its name, its sentence, who takes it and its action; " +
        "a locked release offers «Terbitkan», which answers «Menerbitkan…» and «✓ Diterbitkan» (the source), and the published " +
        "panel says since when; the source of src/components/studio/TabStudio.tsx and src/app/experience.css fade the tab row's " +
        "edge with tokens while more tabs follow");
    },
  },
  {
    id: "STUDIO3A-LANGKAH-01",
    run: async (ctx) => {
      const c = new Checks();
      const { t } = (await import("../src/lib/hle")) as unknown as { t: T };
      const s = (k: string) => t(k, "staff", { locale: "id" });
      const KASUS = [
        props("APPROVED", null, KAPRODI),
        props("APPROVED", null, PENYUSUN),
        props("STRUCTURED", null, PENYUSUN, { hasilIsi: { ok: true, kode: "STEP_TAKEN", kalimat: "x" } }),
        props("VALIDATED", null, PENYUSUN, { hasilIsi: { ok: false, kode: "CONTENT_TRANSITION_INVALID", kalimat: "Belum tersimpan. Contoh penolakan." } }),
        props("IN_REVIEW", null, KAPRODI, { hasilIsi: { ok: true, kode: "STEP_TAKEN", kalimat: "x" } }),
      ];
      const { html, galat } = gambarLangkah(ctx.repoRoot, KASUS);
      if (c.expect(galat === "", `the steps could not be rendered: ${galat}`)) {
        const [kaprodi, penyusun, tersusun, ditolak, diajukan] = html;
        // 1. one press creates and locks, for a reader who may take both; never for the author, who may not lock
        c.expect(/<input type="hidden" name="terus" value="kunci"\/>/.test(kaprodi)
          && JSON.stringify(tombolKirim(panel(kaprodi))) === JSON.stringify([s("studio.langkah.kunci.tombol")])
          && panel(kaprodi).includes(s("studio.langkah.kunci.arti")),
          `a second person at «Buat terbitan» is not offered one press that also locks: ${JSON.stringify(tombolKirim(panel(kaprodi)))}`);
        c.expect(!/name="terus"/.test(penyusun) && JSON.stringify(tombolKirim(panel(penyusun))) === JSON.stringify([s("studio.langkah.buat.tombol")]),
          "the author is offered to lock their own release through the combined press");
        c.expect((kaprodi.match(/aria-current="step"/g) ?? []).length === 1 && /pin-lt-kini" aria-current="step"><p class="pin-lt-judul">Buat terbitan</.test(kaprodi)
          && kaprodi.includes(`<p class="pin-lt-judul">${s("studio.langkah.kunci.judul")}</p>`),
          "the combined press hides a step from the progress list");
        // 2. a content step's result, in the next step's panel, naming the step it completed
        const baris = (x: string) => /<div[^>]*class="pin-msg pin-hasil pin-hasil-(ok|gagal)"[^>]*>([\s\S]*?)<\/div>/.exec(panel(x));
        const ok = baris(tersusun);
        c.expect(ok?.[1] === "ok" && teks(ok[2]).includes(`${s("studio.langkah.susun.judul")} · ${s("studio.langkah.keadaan.selesai")}`)
          && /role="status"/.test(panel(tersusun)), `after «Tandai sudah tersusun» the next panel does not say «Susun isi · Selesai»: ${ok?.[2] ?? "no line"}`);
        const ok2 = baris(diajukan);
        c.expect(ok2?.[1] === "ok" && teks(ok2[2]).includes(`${s("studio.langkah.ajukan.judul")} · ${s("studio.langkah.keadaan.selesai")}`),
          "after «Ajukan untuk ditinjau» the review panel does not say what was done");
        const no = baris(ditolak);
        c.expect(no?.[1] === "gagal" && teks(no[2]).includes("Contoh penolakan.") && /role="alert"/.test(panel(ditolak)),
          "a content step's refusal is not said in the panel of the step that was refused");
      }
      // 3. the source: the combined press is BOB-03's two typed actions in order; the page reads the result back by code
      const src = kode(baca(ctx.repoRoot, LANGKAH));
      c.expect(/if \(langkah === "buat" && fd\.get\("terus"\) === "kunci"\)[\s\S]{0,200}await buatTerbitanAksi\(null, fd\)[\s\S]{0,200}fd\.set\("release", dibuat\.release\)[\s\S]{0,80}await kunciTerbitanAksi\(null, fd\)/.test(src),
        "the combined press is not create-then-lock through BOB-03's typed actions");
      c.expect(/selesaiKata\(kabar\.langkah\)/.test(src) && /kabar\?\.jenis === "terbit"/.test(src) && /router\.refresh\(\)/.test(src),
        "a release step's success does not say what it did in the next panel");
      const paket = kode(baca(ctx.repoRoot, PAKET));
      c.expect(/const dibaca = sp\.bagian === "paket" \? bacaHasil\(sp\) : null;/.test(paket) && /hasilIsi=\{hasilIsi\}/.test(paket)
        && !/bagian=\{\["paket", "terbitan"\]\}/.test(paket), "the package page does not pass a content step's result to the steps' panel");
      return c.verdict("rendered from src/components/studio/LangkahTerbit.tsx: a head of department at «Buat terbitan» creates and " +
        "locks the release in one press («Kunci terbitan», both steps' sentences, both still in the list), the author only " +
        "creates it; after «Tandai sudah tersusun» and «Ajukan untuk ditinjau» the next panel says «Susun isi · Selesai» / " +
        "«Ajukan untuk ditinjau · Selesai» as a status line, and a refusal is an alert in the refused step's panel; the source " +
        "runs the combined press as create-then-lock through BOB-03's typed actions, and the source of " +
        "src/app/studio/paket/[course]/page.tsx reads the content step's result by its code and passes it to the panel");
    },
  },
  {
    // W1.4, kept as two transactions by the owner (2 Nov, Batch 3 final engineering gate, item 2): a release created
    // whose lock is held back is a recoverable state, provided the page says that state, the refusal's reason and the
    // next action. A browser reaches it only when the lock's readiness check finds an error after approval, so it is
    // rendered here from the answer the combined press returns in that case.
    id: "STUDIO3A-SEPARUH-01",
    run: async (ctx) => {
      const c = new Checks();
      const { t } = (await import("../src/lib/hle")) as unknown as { t: T };
      const { kunciKodeTerbitan, kalimatHambatan } = (await import("../src/lib/terbitan-kontrak")) as unknown as {
        kunciKodeTerbitan: (k: string) => string;
        kalimatHambatan: (h: unknown, s: (k: string) => string, n: (x: number) => string) => string;
      };
      const s = (k: string) => t(k, "staff", { locale: "id" });
      const hambatan = [{ code: "READINESS_ITEM_ERROR", count: 2 }];
      const ditolak = { ok: false, code: "RELEASE_NOT_READY", release: RILIS, kesiapan: "BLOCKED", hambatan };
      // the combined press, as the head of department makes it: created («buat» done), the lock refused
      const jawaban = { langkah: "kunci", hasil: ditolak, selesai: ["buat"] };
      const KASUS = [props("APPROVED", rilis("INGESTED"), KAPRODI, { jawabanAwal: jawaban })];
      const { html, galat } = gambarLangkah(ctx.repoRoot, KASUS);
      if (c.expect(galat === "", `the steps could not be rendered: ${galat}`)) {
        const p = panel(html[0]);
        const isi = teks(p);
        // the state: the release is created («Buat terbitan · Selesai») and the current step is «Kunci terbitan»
        // restated at A5 B10 (retrospective R3-3): h3 under the package title's h1
        c.expect(new RegExp(`<h3 id="lt-kini" class="pin-lt-panel-judul">${s("studio.langkah.kunci.judul")}</h3>`).test(p),
          `the current step is not «${s("studio.langkah.kunci.judul")}»`);
        c.expect(isi.includes(`${s("studio.langkah.buat.judul")} · ${s("studio.langkah.keadaan.selesai")}`),
          "the panel does not say the release was created");
        const daftar = /<ol class="pin-lt-daftar"[^>]*>([\s\S]*?)<\/ol>/.exec(html[0])?.[1] ?? "";
        c.expect(/pin-lt-selesai[^>]*><p class="pin-lt-judul">Buat terbitan/.test(daftar), "the list does not show «Buat terbitan» done");
        // the reason: the refusal's own sentence and what holds the lock back, never the database's words
        c.expect(isi.includes(s(kunciKodeTerbitan("RELEASE_NOT_READY"))), "the panel does not say why the lock was refused");
        const kalimat = kalimatHambatan(hambatan[0], s, (n) => String(n));
        c.expect(isi.includes(kalimat), `the panel does not say what holds the lock back («${kalimat}»)`);
        c.expect(/role="alert"|pin-hasil-gagal|data-nada="gagal"/.test(p), "the refusal is not drawn as a refusal");
        // the next action: «Kunci terbitan» again, for the person who may take it
        c.expect(tombolKirim(p).includes(s("studio.langkah.kunci.tombol")), `the next action «${s("studio.langkah.kunci.tombol")}» is not offered`);
        c.expect(!tombolKirim(p).includes(s("studio.langkah.buat.tombol")), "the panel offers to create the release again");
      }
      const src = kode(baca(ctx.repoRoot, LANGKAH));
      c.expect(/const dikunci = await kunciTerbitanAksi\(null, fd\);\s*return \{ langkah: "kunci", hasil: dikunci, selesai: dikunci\.ok \? \["buat", "kunci"\] : \["buat"\] \};/.test(src),
        "the combined press does not report a created release whose lock was refused as exactly that");
      c.expect(/useActionState<Jawaban, FormData>\([\s\S]*?\}, jawabanAwal\);/.test(src) && !/jawabanAwal=/.test(baca(ctx.repoRoot, PAKET)),
        "the starting answer is not the test's alone (the package page passes it)");
      return c.verdict("rendered from src/components/studio/LangkahTerbit.tsx after the combined press created the release and " +
        "its lock was refused (RELEASE_NOT_READY with a blocker): the current step is «Kunci terbitan», the panel says «Buat " +
        "terbitan · Selesai», the refusal's sentence and what holds the lock back, and offers «Kunci terbitan» again, never " +
        "«Buat terbitan»; the source of the combined press reports exactly that state, and the package page never passes the " +
        "starting answer");
    },
  },
  {
    id: "STUDIO3A-KEMBALI-01",
    run: async (ctx) => {
      const c = new Checks();
      const { t, TANPA_SALINAN } = (await import("../src/lib/hle")) as unknown as { t: T; TANPA_SALINAN: string };
      const s = (k: string, locale: "id" | "en" = "id") => t(k, "staff", { locale });
      const galat = await muat("../src/lib/galat-kontrak");
      const kodeGalat = (galat?.kodeGalat as ((e: unknown) => string) | undefined) ?? (() => "ACTION_FAILED");
      const kunciKode = (galat?.kunciKode as ((k: string) => string) | undefined) ?? (() => "galat.action_failed");
      const KODE = (galat?.KODE_KEMBALI as readonly string[] | undefined) ?? [];
      // 1. every refusal of kembalikan_paket, read from its migration, is its own code with a sentence in both languages
      const sql = baca(ctx.repoRoot, MIG_KEMBALI);
      const badan = sql.slice(sql.indexOf("create or replace function public.kembalikan_paket("), sql.indexOf("revoke all on function public.kembalikan_paket"));
      const tolak = [...badan.matchAll(/raise exception using errcode = '([^']+)', detail = '([A-Z_]+)'/g)].map((m) => ({ code: m[1], details: m[2] }));
      c.expect(tolak.length === 5 && new Set(tolak.map((x) => x.details)).size === 4, `read ${tolak.length} refusal(s) of kembalikan_paket from ${MIG_KEMBALI}`);
      const MESIN = /SENDBACK|ACTION_|CONTENT_|PR0\d\d|CAN_|IN_REVIEW|VALIDATION_FAILED|42501/;
      for (const x of tolak) {
        const k = kodeGalat({ ...x, message: "only a package in review is sent back; this one is IN_REVIEW" });
        c.expect(k === x.details && KODE.includes(k), `${x.code}/${x.details} reaches the screen as ${k}`);
        for (const locale of ["id", "en"] as const) {
          const kalimat = t(kunciKode(k), "staff", { locale });
          c.expect(kalimat !== TANPA_SALINAN && kalimat !== t("galat.action_failed", "staff", { locale }) && !MESIN.test(kalimat),
            `(${locale}) ${x.details} has no sentence of its own: ${kalimat}`);
        }
      }
      c.expect(kunciKode("SENT_BACK") !== "galat.action_failed" && s(kunciKode("SENT_BACK")) !== TANPA_SALINAN, "a send-back has no result sentence");
      // 2. rendered: the reviewer is offered «Kembalikan ke penyusun» beside «Setujui isi», the author is not
      const kembali = { alasan: "Soal nomor 3 kuncinya keliru;\nperiksa lagi pilihan B.", oleh: "Rina Kartika", pada: "2 Nov 2026, 09.12 WIB" };
      const KASUS = [
        props("IN_REVIEW", null, KAPRODI),
        props("IN_REVIEW", null, PENYUSUN),
        props("VALIDATION_FAILED", null, PENYUSUN, { kembali, unggahPerbaikan: `/studio/unggah?revisi=${KURSUS}#buku-kerja` }),
        props("IN_REVIEW", null, KAPRODI, {}, "en"),
      ];
      const { html, galat: g } = gambarLangkah(ctx.repoRoot, KASUS);
      if (c.expect(g === "", `the steps could not be rendered: ${g}`)) {
        const [peninjau, penyusun, dikembalikan, en] = html;
        c.expect(JSON.stringify(tombolKirim(panel(peninjau))) === JSON.stringify([s("studio.langkah.setujui.tombol")])
          && tombolBiasa(panel(peninjau)).includes(s("studio.kembali.tombol")),
          `the reviewer is not offered «${s("studio.kembali.tombol")}» beside «Setujui isi» (opening it commits nothing)`);
        c.expect(tombolBiasa(en).includes(s("studio.kembali.tombol", "en")), "(en) the send-back is not offered in English");
        c.expect(!penyusun.includes(s("studio.kembali.tombol")), "the author is offered to send their own package back");
        // 3. the author sees the reason, who and when, and the two ways on
        const p = panel(dikembalikan);
        c.expect(p.includes(s("studio.langkah.dikembalikan")) && p.includes(s("studio.kembali.alasan_dari"))
          && p.includes("Soal nomor 3 kuncinya keliru;\nperiksa lagi pilihan B.") && p.includes("Rina Kartika") && p.includes("2 Nov 2026, 09.12 WIB"),
          "the author does not see the reviewer's reason, who gave it and when");
        c.expect(p.includes(`href="/studio/unggah?revisi=${KURSUS}#buku-kerja"`) && p.includes(s("studio.paket.revisi_unggah"))
          && /name="to" value="STRUCTURED"/.test(p) && tombolKirim(p).includes(s("studio.langkah.susun.tombol")),
          "the author is not offered the correction upload in the line and «Tandai sudah tersusun»");
      }
      // 4. the confirmation (in the page, never a Dialog) asks a reason of 10 to 1000 characters and calls kembalikan_paket
      const src = kode(baca(ctx.repoRoot, LANGKAH));
      c.expect(/<div className="pin-konfirmasi" role="group" aria-labelledby="lt-kembali-judul">/.test(src)
        && /s\("studio\.kembali\.judul"\)/.test(src) && /s\("studio\.kembali\.arti"\)/.test(src)
        && /<textarea[^>]*name="alasan" required minLength=\{10\} maxLength=\{1000\}/.test(src)
        && /<input type="hidden" name="langkah" value="kembali" \/>/.test(src)
        && /if \(langkah === "kembali"\) \{\s*const kembali = await kembalikanPaketAksi\(null, fd\);/.test(src)
        && /<button type="button" className="pin-btn"[^>]*\s+onClick=\{\(\) => \{ setMengembalikan\(false\);/.test(src)
        && /s\(kunciKode\(hasilKembali\.kode\)\)/.test(src) && !/<dialog|Dialog/.test(src),
        "the send-back is not an in-page confirmation with a bounded reason, a way back and its refusal's sentence");
      const aksi = kode(baca(ctx.repoRoot, "src/app/studio/actions.ts"));
      const fn = /export async function kembalikanPaketAksi\([\s\S]*?\n\}/.exec(aksi)?.[0] ?? "";
      c.expect(/await wajibDalamKonteks\(\{ sekolah: await sekolahDari\("kursus", course\) \}/.test(fn)
        && /supabase\.rpc\("kembalikan_paket", \{ p_course: course, p_alasan: str\(fd, "alasan"\) \}\)/.test(fn)
        && /if \(error\) return ditolak\("kembalikan_paket", error, kodeGalatKonten\(error\)\);/.test(fn)
        && /return \{ ok: true, kode: "SENT_BACK" \};/.test(fn), "the send-back action does not ask kembalikan_paket as the reader, in context, by code");
      // 5. the page passes the reason last given and the correction path; the upload offers a sent-back draft
      const paket = kode(baca(ctx.repoRoot, PAKET));
      c.expect(/from\("content_review_outcomes"\)/.test(paket) && /o\.outcome === "SENT_BACK"\)\.at\(-1\)/.test(paket)
        && /kembali=\{kembali\}/.test(paket) && /unggahPerbaikan=\{unggahPerbaikan\}/.test(paket)
        && /can\(inst, "CAN_DRAFT"\) && dikembalikanOleh && !penerus \? `\/studio\/unggah\?revisi=\$\{courseId\}#buku-kerja`/.test(paket),
        "the package page does not pass the reviewer's reason and the correction path to the steps");
      const { bisaDikoreksi } = (await import("../src/lib/pengajar")) as { bisaDikoreksi: (k: Array<{ id: string; supersedes_course_id: string | null; status: string }>, r: Array<{ course_id: string; status: string }>) => Array<{ id: string }> };
      const boleh = bisaDikoreksi([
        { id: "a", supersedes_course_id: null, status: "VALIDATION_FAILED" },
        { id: "b", supersedes_course_id: null, status: "VALIDATION_FAILED" }, { id: "b2", supersedes_course_id: "b", status: "INGESTED" },
        { id: "c", supersedes_course_id: null, status: "IN_REVIEW" },
      ], []).map((k) => k.id);
      c.expect(JSON.stringify(boleh) === JSON.stringify(["a"]), `the upload does not offer a sent-back draft (newest of its line) for correction: ${JSON.stringify(boleh)}`);
      return c.verdict(`each of the ${tolak.length} refusals of kembalikan_paket in ${MIG_KEMBALI} reaches the screen as its own code ` +
        "(src/lib/galat-kontrak.ts) with a sentence in both languages naming no machinery, and a send-back has its result " +
        "sentence; rendered from src/components/studio/LangkahTerbit.tsx: the reviewer is offered «Kembalikan ke penyusun» beside " +
        "«Setujui isi» and the author is not; the author sees the reason with its lines, who gave it and when, the correction " +
        "upload in the line and «Tandai sudah tersusun»; the source holds an in-page confirmation (no Dialog) asking a reason of " +
        "10-1000 characters, with «Batal», posting to kembalikanPaketAksi, whose source asks kembalikan_paket as the reader in " +
        "the working context and answers by code; the source of src/app/studio/paket/[course]/page.tsx passes the last reason " +
        "from content_review_outcomes, and executes bisaDikoreksi: a sent-back draft is offered for correction");
    },
  },
  {
    id: "STUDIO3A-RIWAYAT-01",
    run: async (ctx) => {
      const c = new Checks();
      const { t, TANPA_SALINAN } = (await import("../src/lib/hle")) as unknown as { t: T; TANPA_SALINAN: string };
      const paket = kode(baca(ctx.repoRoot, PAKET));
      c.expect(/supabase\.from\("content_review_outcomes"\)\.select\("course_id, outcome, reason, reviewer_person_id, decided_at"\)\s*\.in\("course_id", urutGaris\.length > 0 \? urutGaris : \[courseId\]\)\.order\("decided_at", \{ ascending: true \}\)/.test(paket),
        "«Riwayat perbaikan» does not read every review outcome of the line, in order");
      c.expect(/\{urutGaris\.length > 1 \|\| tinjauan\.length > 0 \? \(\s*<section className=\{card\} id="riwayat">/.test(paket),
        "«Riwayat perbaikan» is not shown for a package with review outcomes and no correction");
      // RESTATED FOR W1.8 (Batch 3 integration): the names come through nama_riwayat_paket, so the author is told who
      // sent their version back (F23-W05); the persons table under the reader's own row security did not reach them
      c.expect(/tinjauan\.map\(\(o\) => o\.reviewer_person_id\)/.test(paket) && /rpc\("nama_riwayat_paket", \{ p_courses: urutGaris\.length > 0 \? urutGaris : \[courseId\] \}\)/.test(paket),
        "the reviewers' names are not read");
      const blok = /<ul className="pin-riwayat-tinjauan">([\s\S]*?)<\/ul>/.exec(paket)?.[1] ?? "";
      // RESTATED FOR W1.14 (Batch 3 integration): the reason line is pin-ket, no longer Tailwind text-sm
      c.expect(/o\.outcome === "APPROVED" \? "studio\.paket\.riwayat\.disetujui" : "studio\.paket\.riwayat\.dikembalikan"/.test(blok)
        && /penulis\.get\(o\.reviewer_person_id\)/.test(blok) && /o\.outcome === "SENT_BACK" && o\.reason \? <p className="pin-riwayat-alasan pin-ket">\{o\.reason\}<\/p>/.test(blok)
        && /when\(o\.decided_at\)/.test(blok), "a review outcome does not say what it was, who decided it, why (sent back) and when");
      for (const locale of ["id", "en"] as const) {
        for (const k of ["studio.paket.riwayat.disetujui", "studio.paket.riwayat.dikembalikan"]) {
          c.expect(t(k, "staff", { locale }) !== TANPA_SALINAN, `(${locale}) ${k} has no words`);
        }
      }
      // Terminology v1 (D-068 ruling 2): in Studio sentences the object is «paket», never «kursus»
      for (const k of ["studio.paket.revisi", "studio.paket.revisi_terbaru", "studio.paket.revisi_penjelasan"]) {
        const v = t(k, "staff", { locale: "id" });
        c.expect(!/\bkursus\b/i.test(v) && /\bpaket\b/i.test(v), `${k} still names the Studio object «kursus»: ${v}`);
      }
      return c.verdict("the source of src/app/studio/paket/[course]/page.tsx reads every review outcome of the package's line " +
        "from content_review_outcomes in order, with the reviewers' names, and «Riwayat perbaikan» (shown whenever there is " +
        "one) says of each version who sent it back and why, and who approved it, and when; the copy table has both words in " +
        "both languages, and the correction lines on the page say «paket», not «kursus» (Terminology v1)");
    },
  },
  {
    id: "STUDIO3A-AKUI-01",
    run: async (ctx) => {
      const c = new Checks();
      const paket = kode(baca(ctx.repoRoot, PAKET));
      c.expect(/const bukanPenyusun = typeof saya === "string" && typeof course\.author_person_id === "string" && saya !== course\.author_person_id;/.test(paket),
        "the page does not know whether the reader wrote the package");
      // RESTATED FOR W1.5 (Batch 3 integration): the findings are now Daisy's grouped list (TemuanKelompok), mounted
      // once for both kinds; the rule is unchanged: the acknowledgement is offered only to a non-author reviewer, and
      // only for a WARNING (an ERROR is fixed in the content)
      const mount = [...paket.matchAll(/<TemuanKelompok [^>]*bolehAkui=\{([^}]*)\}/g)].map((m) => m[1]);
      c.expect(mount.length === 1 && mount[0] === `can(inst, "CAN_REVIEW") && bukanPenyusun`,
        `a finding offers «Sudah saya tinjau» to the package's author: ${JSON.stringify(mount)}`);
      c.expect(/<TemuanKelompok [^>]*mcq=\{findings\} coaching=\{coaching\}/.test(paket) && !/FindingCard/.test(paket),
        "the page does not give both kinds of finding to the grouped list");
      const kel = kode(baca(ctx.repoRoot, "src/components/studio/TemuanKelompok.tsx"));
      c.expect(/const akui = bolehAkui && g\.severity === "WARNING";/.test(kel),
        "the acknowledgement is not drawn only where bolehAkui allows it, and only for a WARNING");
      // the database already refuses it, which is what makes this courtesy honest
      const sql = readdirSync(join(ctx.repoRoot, "supabase", "migrations")).filter((f) => f.endsWith(".sql"))
        .map((f) => baca(ctx.repoRoot, `supabase/migrations/${f}`)).join("\n");
      c.expect(/the author of the content does not acknowledge their own finding/.test(sql), "the database no longer refuses the author's own acknowledgement");
      return c.verdict("the source of src/app/studio/paket/[course]/page.tsx and src/components/studio/TemuanKelompok.tsx offer «Sudah saya tinjau» on a finding group only to a " +
        "reviewer (CAN_REVIEW) who is known not to be the package's author, on both kinds of finding; the migrations still " +
        "refuse the author acknowledging their own finding");
    },
  },
  {
    id: "STUDIO3A-BERANDA-01",
    run: async (ctx) => {
      const c = new Checks();
      const beranda = kode(baca(ctx.repoRoot, BERANDA));
      // every bucket studio_home can return has a destination
      const mig = readdirSync(join(ctx.repoRoot, "supabase", "migrations")).filter((f) => f.endsWith(".sql")).sort()
        .filter((f) => /create (?:or replace )?function public\.studio_home\(/.test(baca(ctx.repoRoot, `supabase/migrations/${f}`))).pop() ?? "";
      const badan = mig ? baca(ctx.repoRoot, `supabase/migrations/${mig}`) : "";
      const ember = [...new Set([...badan.slice(badan.indexOf("function public.studio_home(")).split("$$;")[0].matchAll(/select '([A-Z_]+)'/g)].map((m) => m[1]))];
      c.expect(ember.length === 5, `read ${ember.length} bucket(s) of studio_home from ${mig}`);
      for (const b of ember) c.expect(new RegExp(`case "${b}": return [^;]+;`).test(beranda), `the count «${b}» opens no list`);
      c.expect(/case "AWAITING_MY_REVIEW": return lewat\("tinjau", "\/studio\/tinjau"\);/.test(beranda)
        && /case "QUESTION_HEALTH": return lewat\("bank", "\/studio\/bank#kesehatan"\);/.test(beranda)
        && /case "DISTRIBUTED_CANONICAL": return lewat\("kanonik", "\/studio\/kanonik"\);/.test(beranda)
        && /const lewat = \(t_: TabStudio, href: string\) => \(tab\.includes\(t_\) \? href : null\);/.test(beranda),
        "a count opens a tab the reader does not hold");
      c.expect(/return href \? \(\s*<Link key=\{`\$\{r\.bucket\}:\$\{r\.institution_id\}`\} href=\{href\}/.test(beranda),
        "a count with a list is not a link to it");
      // the home's own lists read exactly what their counts count
      c.expect(/if \(daftar === "ACTION_REQUIRED"\) kursusQ = kursusQ\.in\("status", \["INGESTED", "STRUCTURED", "VALIDATION_FAILED"\]\);/.test(beranda)
        && /from\("mcq_quality_findings"\)\.select\("course_id"\)\.in\("institution_id", menyusun\)\s*\.eq\("severity", "ERROR"\)\.is\("acknowledged_at", null\)/.test(beranda),
        "the narrowed lists do not read what their counts count");
      c.expect(/'INGESTED','STRUCTURED','VALIDATION_FAILED'/.test(badan) && /f\.severity = 'ERROR' and f\.acknowledged_at is null/.test(badan),
        "studio_home's own buckets changed; the narrowed lists must follow them");
      // every package says where it stands
      c.expect(/posisiPaket\(\{ statusKursus: c\.status as string, terbitan: r \? \{ status: r\.status \} : null \}\)/.test(beranda)
        && /posisi\.kini === "terbit" \? <span className="pin-pill pin-ok">\{s\("studio\.langkah\.terbit\.judul"\)\}<\/span>/.test(beranda)
        && /<span>\{s\("studio\.langkah\.keadaan\.kini"\)\}: \{s\(kunciSalinan\(posisi\.kini, "judul"\)\)\}<\/span>/.test(beranda),
        "a package in the list does not say where it stands («✓ Terbit», or «Sekarang:» and its step)");
      const r = render(ctx.repoRoot, "src/components/Kosong.tsx", { jenis: "tidak_cocok", kalimat: "Belum ada paket di sini.", aksi: { href: "/studio#paket", label: "Semua" } });
      c.expect(r.ok && /data-kosong="tidak_cocok"/.test(r.html) && /<Kosong jenis=\{daftar \? "tidak_cocok" : "belum"\}/.test(beranda),
        "an empty list is not the Empty state, with the way back when narrowed");
      return c.verdict(`the source of src/app/studio/page.tsx gives each of the ${ember.length} buckets studio_home returns (${mig}) ` +
        "a list: the review queue, Bank Soal's question health and Pustaka PINTAR when the reader holds that tab, else the count " +
        "stays a count, and the home's own package list narrowed to exactly what «Menunggu tindakan Anda» and «Tertahan» count; " +
        "each count with a list is a link; every package row says «✓ Terbit» or «Ditarik» as a Badge, otherwise «Sekarang:» and " +
        "its step (posisiPaket); an empty list is the Empty state (rendered), with its way back when narrowed");
    },
  },
  {
    id: "STUDIO3A-BAHASA-01",
    run: async (ctx) => {
      const c = new Checks();
      const { t } = (await import("../src/lib/hle")) as unknown as { t: T };
      const kunci = new Set<string>();
      for (const p of [PAKET, BERANDA, TINJAU, LANGKAH]) {
        const x = kode(baca(ctx.repoRoot, p));
        // UX-25: the reader's language, never the locale-less helper
        c.expect(!/import \{[^}]*\bs\b[^}]*\} from "\.\.?\/(?:\.\.\/)?_lib"/.test(x) && !/\boutcomeLine\(/.test(x),
          `${p} still writes with Studio's locale-less words`);
        c.expect(p === LANGKAH ? /t\(k, "staff", \{ locale \}\)/.test(x) : /currentLocale\(\)/.test(x) && /t\(k, "staff", \{ locale \}\)/.test(x),
          `${p} does not write in the reader's language`);
        for (const m of x.matchAll(/\b(?:s|sl)\("((?:studio|tombol|galat|koleksi)\.[A-Za-z0-9_.]+)"\)/g)) kunci.add(m[1]);
      }
      c.expect(kunci.size > 30, `only ${kunci.size} copy key(s) read from the four files`);
      for (const k of kunci) {
        const v = t(k, "staff", { locale: "id" });
        c.expect(!/\bsiswa\b/i.test(v), `${k} says «siswa»: ${v}`);
        c.expect(!/\(D-\d{3}\)/.test(v), `${k} prints a decision number: ${v}`);
      }
      // 320 px: a field and a select shrink with their row; the step panel never runs past the page
      const css = baca(ctx.repoRoot, "src/app/experience.css");
      c.expect(/\.pin-input \{ max-width: 100%; min-width: 0; \}/.test(css) && /\.pin-lt-panel > \* \{ max-width: 100%; \}/.test(css)
        && /\.pin-lt-panel \{[^}]*min-width: 0;/.test(css) && /\.pin-lt-alasan-teks \{[^}]*overflow-wrap: anywhere;/.test(css),
        "a field or the step panel can run past a 320 px page");
      return c.verdict(`the source of the package page, Studio's home, the review queue and src/components/studio/LangkahTerbit.tsx ` +
        `writes in the reader's language (currentLocale, never Studio's locale-less words); none of the ${kunci.size} copy keys they ` +
        "use says «siswa» or prints a decision number in Indonesian; the stylesheet keeps fields and the step panel within a " +
        "320 px page");
    },
  },
];
