/**
 * D-084 J6.14 (STU-20) -- EVERY LEARNER SCREEN SWITCHES BETWEEN ID AND EN.
 *
 * The first walk of J6.14 (S21g) found the lesson in English still reading
 * «Halaman 1/3» and «Halaman berikutnya»: the lesson player and the question
 * player are client components and asked for their words with no language, so
 * they were Indonesian whatever the reader chose. They now take the reader's
 * language from the page that renders them. The lesson's text, the questions
 * and the options are never translated (they are the school's content).
 *
 *   J614-K01  renders the lesson player (src/app/belajar/_components/LessonPlayer.tsx)
 *             in English and in Indonesian: its page counter and its next-page
 *             button read in the reader's language and the lesson's text is the
 *             same in both; reads every client component under src/: no call of
 *             t() leaves out the reader's language; the lesson page and the
 *             assessment surface hand the players the page's locale
 */
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { Checks, type SelfTest } from "./lib";

// every file under dir, recursively
function semua(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? semua(p) : [p];
  });
}

// the argument lists of each call of t( in a source, to their matching parenthesis
function panggilanT(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(/(?<![\w.])t\(/g)) {
    let i = m.index! + 2;
    let dalam = 1;
    for (; i < src.length && dalam > 0; i++) {
      if (src[i] === "(") dalam++;
      else if (src[i] === ")") dalam--;
    }
    out.push(src.slice(m.index! + 2, i - 1));
  }
  return out;
}

// the top-level arguments of an argument list
function argumen(daftar: string): string[] {
  const out: string[] = [];
  let dalam = 0;
  let awal = 0;
  for (let i = 0; i < daftar.length; i++) {
    const ch = daftar[i];
    if ("([{".includes(ch)) dalam++;
    else if (")]}".includes(ch)) dalam--;
    else if (ch === "," && dalam === 0) { out.push(daftar.slice(awal, i)); awal = i + 1; }
  }
  if (daftar.slice(awal).trim()) out.push(daftar.slice(awal));
  return out.map((a) => a.trim());
}

const RENDER =
  "(async () => {" +
  '  const { createElement: h } = await import("react");' +
  '  const { renderToStaticMarkup } = await import("react-dom/server");' +
  '  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime.js");' +
  '  const lp = await import("file://" + process.cwd() + "/src/app/belajar/_components/LessonPlayer.tsx");' +
  "  const LessonPlayer = lp.default?.default ?? lp.default;" +
  "  const r = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };" +
  "  const pemain = (locale) => renderToStaticMarkup(h(AppRouterContext.Provider, { value: r }, h(LessonPlayer, {" +
  '    learningAssignmentId: "t", lessonId: "l", title: "x", bodyMarkdown: "## Satu\\nTeks sekolah satu.\\n## Dua\\nTeks sekolah dua.",' +
  "    workedExamples: [], media: [], startAt: 1, personId: null, savedNote: \"\", locale," +
  "    saveProgress: async () => ({ ok: true }) })));" +
  '  process.stdout.write(JSON.stringify({ en: pemain("en"), id: pemain("id") }));' +
  "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });";

export const j614Tests: SelfTest[] = [
  {
    id: "J614-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // 1. the lesson player, rendered in both languages
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e", RENDER], { cwd: repoRoot, encoding: "utf8" });
      let html: { en?: string; id?: string } = {};
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (c.expect(anak.status === 0 && !!html.en && !!html.id, `the lesson player could not be rendered: ${(anak.stderr || "").split("\n")[0]}`)) {
        const teks = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
        const en = teks(html.en!);
        const id = teks(html.id!);
        c.expect(/\bPage 1\/2\b/.test(en) && !/Halaman 1\/2/.test(en), `in English the lesson's page counter reads: ${en.slice(0, 160)}`);
        c.expect(/\bNext page\b/.test(en) && !/Halaman berikutnya/.test(en), "in English the lesson's next-page button is not in English");
        c.expect(/Halaman 1\/2/.test(id) && /Halaman berikutnya/.test(id), `in Indonesian the lesson's page counter reads: ${id.slice(0, 160)}`);
        c.expect(en.includes("Teks sekolah satu.") && id.includes("Teks sekolah satu."), "the lesson's own text changes with the language");
      }

      // 2. no client component asks for its words without the reader's language
      const tanpa: string[] = [];
      let dibaca = 0;
      for (const f of semua(join(repoRoot, "src")).filter((p) => p.endsWith(".tsx"))) {
        const src = readFileSync(f, "utf8");
        if (!/^\s*["']use client["']/.test(src)) continue;
        if (!/import \{[^}]*\bt\b[^}]*\} from "@\/lib\/hle"/.test(src)) continue;
        dibaca++;
        for (const daftar of panggilanT(src)) {
          const a = argumen(daftar);
          if (a.length < 3 || !/\blocale\b/.test(a[2])) tanpa.push(`${relative(repoRoot, f)}: t(${daftar.slice(0, 60)})`);
        }
      }
      c.expect(tanpa.length === 0, `client components ask for words without the reader's language: ${tanpa.slice(0, 6).join(" | ")}`);

      // 3. the pages hand the players the page's language
      const pelajaran = readFileSync(join(repoRoot, "src", "app", "belajar", "[tugas]", "pelajaran", "[pelajaran]", "page.tsx"), "utf8");
      c.expect(/<LessonPlayer[\s\S]*?\blocale=\{locale\}[\s\S]*?\/>/.test(pelajaran), "the lesson page does not hand the lesson player the page's language");
      const permukaan = readFileSync(join(repoRoot, "src", "app", "belajar", "_components", "PermukaanAsesmen.tsx"), "utf8");
      c.expect(/<ItemPlayer[\s\S]*?\blocale=\{locale\}[\s\S]*?\/>/.test(permukaan), "the assessment surface does not hand the question player the page's language");

      return c.verdict(
        "renders the lesson player (src/app/belajar/_components/LessonPlayer.tsx) in English and in Indonesian: its page " +
          "counter and next-page button follow the reader's language and the lesson's text is the same in both; reads the " +
          `${dibaca} client component(s) under src/ that use the copy table: every call of t() passes the reader's language; ` +
          "the lesson page and the assessment surface hand the players the page's locale",
      );
    },
  },
];
