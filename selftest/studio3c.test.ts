/**
 * BATCH 3 · FINAL CLOSURE (owner, 2 Nov: «Batch 3 final closure — CONDITIONAL GO, Batch 3 only»; the defects found in
 * the staging verification, docs/completion-4.0/batch-3/04-STAGING-VERIFICATION-REPORT.md §6; owner ruling F-7). Each
 * guard is RED on the code the staging verification ran (a5e2935) and GREEN after the closure.
 *
 *  STUDIO3C-BERANDA-02   Defect 1 · W1.7. A version a correction replaced is history, not a package: Studio's home
 *                        leaves out every course another course supersedes, and the latest studio_home counts only the
 *                        newest version of each line in its three package buckets. The database half is F23-W06.
 *  STUDIO3C-SIAPKAN-01   Defect 2 · W3.11, and J1Terbit step 7 (Daisy). On Siapkan after «Sediakan», the card's badge
 *                        is the class's own state of the material (statusMateri), never «Belum disediakan» beside
 *                        «✓ Disediakan»; «Tersedia» is the done Badge (✓) there and in the class page's «Materi untuk
 *                        kelas ini», whose rows give their window in words.
 *  STUDIO3C-BANK-01      F-7 · W1.11, J4.8 (owner ruling, 2 Nov). Bank Soal is offered to a reader with CAN_DRAFT as
 *                        well as to the Question Health reviewer; the page lists only the schools whose bank the reader
 *                        browses, and Question Health inside it (the health state, the evidence figures, the review
 *                        form) only where the reader holds CAN_REVIEW_QUESTION_HEALTH. The database half is F23-W07.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const baca = (root: string, p: string) => readFileSync(join(root, p), "utf8");
/** Source without its comments, so a comment cannot satisfy a guard. */
const kode = (x: string) => x.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");

export const studio3cTests: SelfTest[] = [
  {
    id: "STUDIO3C-BERANDA-02",
    run: async (ctx) => {
      const c = new Checks();
      const beranda = kode(baca(ctx.repoRoot, "src/app/studio/page.tsx"));
      // RESTATED (owner decision 3, 8 Nov): a narrowed list reads its own scope; RELEASE_STEP's is every school of the
      // context (a publisher may hold no CAN_DRAFT), the others' CAN_DRAFT's, and superseded versions stay out of each
      c.expect(/from\("courses"\)\.select\("supersedes_course_id"\)\s*\.in\("institution_id", daftar \? lingkupDaftar : ids\)\.not\("supersedes_course_id", "is", null\)/.test(beranda)
        && /const lingkupDaftar = daftar === "RELEASE_STEP" \? ids : menyusun;/.test(beranda),
        "Studio's home does not read which versions a correction replaced");
      c.expect(/if \(lama\.length > 0\) kursusQ = kursusQ\.not\("id", "in", `\(\$\{lama\.join\(","\)\}\)`\);/.test(beranda),
        "Studio's home still lists a replaced version as a package of its own");
      const dir = join(ctx.repoRoot, "supabase", "migrations");
      const mig = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
        .filter((f) => /create (?:or replace )?function public\.studio_home\(/.test(baca(ctx.repoRoot, `supabase/migrations/${f}`))).pop() ?? "";
      const sql = mig ? baca(ctx.repoRoot, `supabase/migrations/${mig}`) : "";
      const badan = sql.slice(sql.indexOf("function public.studio_home(")).split("$$;")[0];
      const ember = (b: string) => badan.slice(badan.indexOf(`select '${b}'`)).split("union all")[0];
      for (const [b, kolom] of [["ACTION_REQUIRED", "c.id"], ["AWAITING_MY_REVIEW", "c.id"], ["BLOCKED", "f.course_id"]] as const) {
        c.expect(ember(b).includes(`not exists (select 1 from public.courses n where n.supersedes_course_id = ${kolom})`),
          `studio_home (${mig}) still counts a replaced version in ${b}`);
      }
      return c.verdict(`the source of src/app/studio/page.tsx leaves every course another course supersedes out of the package list, ` +
        `and studio_home (${mig}) counts only the newest version of each line in «Menunggu tindakan Anda», the review queue and «Tertahan»`);
    },
  },
  {
    id: "STUDIO3C-SIAPKAN-01",
    run: async (ctx) => {
      const c = new Checks();
      const ajar = (await import("../src/lib/pengajar")) as unknown as {
        statusMateri: (x: { status: string; berakhir: boolean; belumMulai: boolean }) => string;
        nadaMateri: (k: string) => string;
      };
      c.expect(typeof ajar.nadaMateri === "function", "src/lib/pengajar.ts has no nadaMateri");
      if (typeof ajar.nadaMateri === "function") {
        const kasus: Array<[{ status: string; berakhir: boolean; belumMulai: boolean }, string, string]> = [
          [{ status: "ACTIVE", berakhir: false, belumMulai: false }, "mengajar.status.tersedia", "pin-ok"],
          [{ status: "ACTIVE", berakhir: false, belumMulai: true }, "mengajar.status.dijadwalkan", "pin-neutral"],
          [{ status: "ACTIVE", berakhir: true, belumMulai: false }, "mengajar.status.selesai", "pin-neutral"],
          [{ status: "REVOKED", berakhir: false, belumMulai: false }, "mengajar.status.belum", "pin-neutral"],
        ];
        for (const [x, k, nada] of kasus) {
          const dapat = ajar.statusMateri(x);
          c.expect(dapat === k && ajar.nadaMateri(dapat) === nada, `${JSON.stringify(x)} reads ${dapat} as ${ajar.nadaMateri(dapat)}; expected ${k} as ${nada}`);
        }
      }
      const siap = kode(baca(ctx.repoRoot, "src/app/mengajar/[kelas]/siapkan/page.tsx"));
      c.expect(/\{sudah \? \(\s*<span className=\{`pin-pill \$\{ajar\.nadaMateri\(ajar\.statusMateri\(sudah\)\)\}`\}>\{s\(ajar\.statusMateri\(sudah\)\)\}<\/span>\s*\) : \(\s*<span className="pin-pill pin-neutral">\{s\("mengajar\.status\.belum"\)\}<\/span>\s*\)\}/.test(siap),
        "Siapkan's card still says «Belum disediakan» after «Sediakan»");
      c.expect((siap.match(/"mengajar\.status\.belum"/g) ?? []).length === 1, "Siapkan says «Belum disediakan» somewhere other than before «Sediakan»");
      // J5Jendela: who it is for is read in the review before the act, not as a third column of the window
      c.expect(/<div className="pin-commit">\s*<p className="pin-untuk" data-untuk="kelas">\s*\{s\("mengajar\.siap\.disediakan"\)\} <b>\{ctx\.ini\.nama\}<\/b>\s*\{" · "\}\{format\.number\(fakta\.murid\.length, locale\)\} \{s\("mengajar\.siap\.terdaftar"\)\}\s*<\/p>/.test(siap)
        && !/<dt>\{s\("mengajar\.siap\.disediakan"\)\}<\/dt>/.test(siap),
        "Siapkan does not say who it is for in the review before «Sediakan» (J5Jendela), or still says it beside the window");
      const kelas = kode(baca(ctx.repoRoot, "src/app/mengajar/[kelas]/page.tsx"));
      c.expect(/<span className=\{`pin-pill \$\{ajar\.nadaMateri\(ajar\.statusMateri\(x\)\)\}`\}>\{s\(ajar\.statusMateri\(x\)\)\}<\/span>/.test(kelas)
        && !/<span className="pin-pill pin-neutral">\{s\(ajar\.statusMateri\(x\)\)\}<\/span>/.test(kelas),
        "the class page's material rows do not draw «Tersedia» as the done Badge");
      // RESTATED (owner, 10 Nov: school-context dates on the school's clock): the window is written on the class's school's clock (zona),
      // so a WITA or WIT school's «Mulai» is no longer a day early
      c.expect(/\{x\.mulai \? <span>\{s\("mengajar\.siap\.mulai"\)\} \{tanggal\(x\.mulai, "hari", locale, zona\)\}<\/span> : null\}/.test(kelas)
        && /<span>\{x\.sampai \? `\$\{s\("mengajar\.siap\.sampai"\)\} \$\{tanggal\(x\.sampai, "hari", locale, zona\)\}` : s\("mengajar\.siap\.sampai\.kosong"\)\}<\/span>/.test(kelas),
        "the class page's material rows do not give their window in words («Mulai … · Sampai …» or «Tanpa batas akhir»)");
      const css = baca(ctx.repoRoot, "src/app/experience.css");
      c.expect(/\.pin-pill\.pin-ok::before \{ content: "✓";/.test(css), "the ok Badge no longer draws its ✓");
      return c.verdict("executes statusMateri and nadaMateri (src/lib/pengajar.ts): «Tersedia» is the ok Badge, «Dijadwalkan», «Selesai» " +
        "and «Belum disediakan» neutral; the source of src/app/mengajar/[kelas]/siapkan/page.tsx gives the card, once «Sediakan» is " +
        "taken, the class's own state of the material and «Belum disediakan» only before, and says who it is for («Disediakan untuk … · " +
        "n murid terdaftar hari ini») in the review before the act (J5Jendela), not beside the window; src/app/mengajar/[kelas]/page.tsx draws " +
        "each material's state with nadaMateri and its window in words; src/app/experience.css draws the ok Badge's ✓");
    },
  },
  {
    id: "STUDIO3C-BANK-01",
    run: async (ctx) => {
      const c = new Checks();
      const { tabStudio } = (await import("../src/lib/studio-tab")) as unknown as {
        tabStudio: (k: ReadonlySet<string>, p: readonly string[]) => string[];
      };
      const kasus: Array<[string[], string[], boolean, string]> = [
        [["CAN_DRAFT"], ["EDUCATOR"], true, "a Guru who authors"],
        [["CAN_REVIEW_QUESTION_HEALTH"], ["HEAD_OF_DEPARTMENT"], true, "a Question Health reviewer who does not author"],
        [["CAN_ASSIGN_LEARNING"], ["EDUCATOR"], false, "a teacher who only gives material"],
        [["CAN_REVIEW_INTEGRITY"], ["HEAD_OF_DEPARTMENT"], false, "an integrity reviewer alone"],
      ];
      for (const [k, p, mau, siapa] of kasus) {
        c.expect(tabStudio(new Set(k), p).includes("bank") === mau, `${siapa} is ${mau ? "not " : ""}offered Bank Soal`);
      }
      const bank = kode(baca(ctx.repoRoot, "src/app/studio/bank/page.tsx"));
      c.expect(/if \(!\(await tabSaya\(\)\)\.includes\("bank"\)\) redirect\("\/studio"\);/.test(bank), "Bank Soal no longer sends a reader it is not for to Studio's home");
      c.expect(/const bisaBank = institutions\.filter\(\(i\) => i\.capabilities\.includes\("CAN_DRAFT"\) \|\| i\.capabilities\.includes\("CAN_REVIEW_QUESTION_HEALTH"\)\);/.test(bank)
        && /from\("items"\)\.select\(kolom\)\.in\("institution_id", bisaBank\.map\(\(i\) => i\.id\)\)/.test(bank),
        "the bank lists a school whose bank the reader does not browse");
      c.expect(/const sehatDi = new Set\(mayReview\.map\(\(m\) => m\.id\)\);/.test(bank)
        && /const sehatIds = items\.filter\(\(i\) => sehatDi\.has\(i\.institution_id\)\)\.map\(\(i\) => i\.id\);/.test(bank)
        && /from\("question_health"\)\.select\("item_id, state, evidence_count, note"\)\.in\("item_id", sehatIds\)/.test(bank),
        "the bank reads Question Health for a school where the reader does not review it");
      c.expect(/const hasEmpirical = sehatDi\.has\(i\.institution_id\) && /.test(bank), "the evidence figures are shown to a reader who does not review Question Health");
      c.expect((bank.match(/pilihan\.length > 0 && sehatDi\.has\(i\.institution_id\)/g) ?? []).length === 2 && !/mayReview\.some/.test(bank),
        "the Question Health review form is offered outside a school the reader reviews it in");
      c.expect(/const bolehKunci = new Set\(institutions\.filter\(\(i\) => i\.capabilities\.includes\("CAN_DRAFT"\)\)/.test(bank),
        "the keys and reasons are no longer read for the schools where the reader holds CAN_DRAFT");
      return c.verdict("executes tabStudio (src/lib/studio-tab.ts): Bank Soal is offered to a Guru who authors (CAN_DRAFT) and to a Question " +
        "Health reviewer, not to a teacher who only gives material or to an integrity reviewer alone; the source of " +
        "src/app/studio/bank/page.tsx lists only the schools whose bank the reader browses, reads keys and reasons where the reader " +
        "holds CAN_DRAFT, and reads Question Health, shows the evidence figures and offers the review form only where the reader " +
        "holds CAN_REVIEW_QUESTION_HEALTH");
    },
  },
];
