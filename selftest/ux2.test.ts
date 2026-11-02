/**
 * BATCH 2 · Shared design foundations (owner authorisation, 2 Nov; plan E §Batch 2; Daisy's design system,
 * origin/ux-1/daisy-experience docs/coordination/ux/sistem-desain). Each component is held by a guard that is RED on
 * the code before it (the exit gate).
 *
 *  UX2-JUDUL-01   W3.1 · EVERY PAGE NAMES ITSELF (WCAG 2.4.2). The root layout holds «%s · PINTAR»; every page.tsx
 *                 exports generateMetadata from the one map (src/lib/judul-halaman.ts) under its own route; every map
 *                 entry is a page; each title resolves in both languages to words that are not the bare name, not the
 *                 calm dash; a page whose heading is data is titled by its place, never a person's or a class's name.
 *  UX2-LEWATI-01  W3.1 · THE SKIP LINK (WCAG 2.4.1). «Langsung ke isi» is the first thing in <body>, a link to #isi;
 *                 every <main> in src is #isi; the link waits out of sight and comes into place with focus.
 *  UX2-BERKAS-01  W3.3 · FILEFIELD (RV-5; the /lapor axe `label` finding). No bare file input outside BidangBerkas;
 *                 rendered, its input is named by the field's label, lies transparent over «Pilih berkas», and the
 *                 choice is named beneath in words («Belum dipilih» before).
 */
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { Checks, type SelfTest } from "./lib";

/** Every file under `dir` whose name matches. */
function berkas(dir: string, cocok: RegExp): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...berkas(p, cocok));
    else if (cocok.test(n)) out.push(p);
  }
  return out;
}

/** Render a client or server component to static HTML in a child process (as CR91-K02). */
export function render(repoRoot: string, modul: string, props: unknown, ekspor = "default"): { ok: boolean; html: string; galat: string } {
  const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
    "(async () => {" +
    '  const { createElement: h } = await import("react");' +
    '  const { renderToStaticMarkup } = await import("react-dom/server");' +
    '  const m = await import("file://" + process.cwd() + "/" + process.env.UX2_MODUL);' +
    "  const k = process.env.UX2_EKSPOR;" +
    "  const F = k === 'default' ? (m.default?.default ?? m.default) : (m[k] ?? m.default?.[k]);" +
    "  process.stdout.write(renderToStaticMarkup(h(F, JSON.parse(process.env.UX2_PROPS))));" +
    "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
    cwd: repoRoot, encoding: "utf8", env: { ...process.env, UX2_MODUL: modul, UX2_PROPS: JSON.stringify(props), UX2_EKSPOR: ekspor },
  });
  return { ok: anak.status === 0 && anak.stdout.length > 0, html: anak.stdout, galat: (anak.stderr || "").split("\n").slice(0, 3).join(" ") };
}

function rute(app: string, f: string): string {
  const r = relative(app, f).split(sep).slice(0, -1).join("/");
  return r ? `/${r}` : "/";
}

export const ux2Tests: SelfTest[] = [
  {
    id: "UX2-JUDUL-01",
    run: async (ctx) => {
      const c = new Checks();
      const app = join(ctx.repoRoot, "src/app");
      const tata = readFileSync(join(app, "layout.tsx"), "utf8");
      c.expect(/title:\s*\{\s*template:\s*`%s · \$\{t\("app\.name"/.test(tata), "the root layout holds no «%s · PINTAR» title template");
      const { JUDUL_HALAMAN, judulDari } = await import("../src/lib/judul-halaman");
      const { TANPA_SALINAN } = await import("../src/lib/hle");
      const halaman = berkas(app, /^page\.tsx$/);
      const dilihat = new Set<string>();
      for (const f of halaman) {
        const r = rute(app, f);
        dilihat.add(r);
        const isi = readFileSync(f, "utf8");
        const m = isi.match(/export const generateMetadata = judulHalaman\("([^"]+)"\);/);
        c.expect(Boolean(m) && m![1] === r, `${r}: page.tsx does not export generateMetadata = judulHalaman("${r}")`);
        c.expect(r in JUDUL_HALAMAN, `${r}: no title in src/lib/judul-halaman.ts`);
      }
      for (const r of Object.keys(JUDUL_HALAMAN)) c.expect(dilihat.has(r), `${r}: a title for a page that does not exist`);
      for (const r of Object.keys(JUDUL_HALAMAN)) {
        for (const locale of ["id", "en"] as const) {
          const j = judulDari(r, locale);
          const kata = typeof j === "string" ? j : (j as { absolute: string }).absolute;
          c.expect(Boolean(kata) && kata !== TANPA_SALINAN && !/^\s*PINTAR\s*$/.test(kata) && !/[a-z]+\.[a-z_]+/.test(kata),
            `${r} (${locale}): the title is «${kata}»`);
        }
      }
      // a page whose heading is data is titled by its place: no title map entry reads a name from the page
      const peta = readFileSync(join(ctx.repoRoot, "src/lib/judul-halaman.ts"), "utf8").split("export const JUDUL_HALAMAN")[1].split("\n};")[0];
      const baris = peta.split("\n").filter((l) => l.trim().startsWith('"'));
      c.expect(baris.length === Object.keys(JUDUL_HALAMAN).length && baris.every((l) => /^\s*"[^"]+": \{ kunci: "[a-z_.]+", untuk: "(learner|educator|staff|public)" \},$/.test(l)),
        "a page title is not one fixed copy key (it may be built from data)");
      return c.verdict(`${halaman.length} pages each name themselves through the one map, «<page> · PINTAR», in both languages; a page headed by a name is titled by its place`);
    },
  },
  {
    id: "UX2-LEWATI-01",
    run: async (ctx) => {
      const c = new Checks();
      const tata = readFileSync(join(ctx.repoRoot, "src/app/layout.tsx"), "utf8");
      const tubuh = tata.split(/<body[^>]*>/)[1] ?? "";
      const pertama = tubuh.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").trim();
      c.expect(/^<a href="#isi" className="pin-lewati pin-noprint">\{t\("aksesibilitas\.lewati"/.test(pertama),
        "«Langsung ke isi» is not the first thing in <body>, a link to #isi");
      const { t } = await import("../src/lib/hle");
      c.expect(t("aksesibilitas.lewati", "public", { locale: "id" }) === "Langsung ke isi", "the skip link does not say «Langsung ke isi»");
      let n = 0;
      for (const f of berkas(join(ctx.repoRoot, "src"), /\.tsx$/)) {
        const isi = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
        for (const m of isi.matchAll(/<main\b[^>]*>/g)) {
          n++;
          c.expect(/\bid="isi"/.test(m[0]), `${relative(ctx.repoRoot, f)}: ${m[0]} is not #isi`);
        }
      }
      const css = readFileSync(join(ctx.repoRoot, "src/app/experience.css"), "utf8");
      const aturan = (sel: string) => css.match(new RegExp(`(?:^|\\n)${sel.replace(/[.:]/g, (x) => `\\${x}`)}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
      const diam = aturan(".pin-lewati"), fokus = aturan(".pin-lewati:focus");
      c.expect(/position:\s*absolute/.test(diam) && /transform:\s*translateY\(calc\(-100%/.test(diam) && /min-height:\s*var\(--control-md\)/.test(diam),
        "the skip link does not wait out of sight above the page at a 44 px height");
      c.expect(/transform:\s*none/.test(fokus) && /outline:/.test(fokus), "the skip link does not come into place, ringed, with focus");
      c.expect(n >= 50, `only ${n} <main> found`);
      return c.verdict(`«Langsung ke isi» opens <body> and leads to #isi; all ${n} <main> elements are #isi; it shows only with focus`);
    },
  },
  {
    id: "UX2-BERKAS-01",
    run: async (ctx) => {
      const c = new Checks();
      for (const f of berkas(join(ctx.repoRoot, "src"), /\.tsx$/)) {
        if (f.endsWith(join("bentuk", "BidangBerkas.tsx"))) continue;
        c.expect(!/type="file"/.test(readFileSync(f, "utf8")), `${relative(ctx.repoRoot, f)}: a bare file input (RV-5: the browser's own words)`);
      }
      const { t } = await import("../src/lib/hle");
      for (const locale of ["id", "en"] as const) {
        const r = render(ctx.repoRoot, "src/components/bentuk/BidangBerkas.tsx", { id: "uji", label: "Tangkapan layar", batas: "Paling besar 5 MB", locale });
        if (!c.expect(r.ok, `BidangBerkas could not be rendered: ${r.galat}`)) continue;
        const x = r.html;
        c.expect(/<span class="pin-berkas-judul" id="uji-label">Tangkapan layar<\/span>/.test(x) && /<input id="uji" type="file"[^>]*aria-labelledby="uji-label"/.test(x),
          `(${locale}) the input is not named by the field's label`);
        c.expect(/aria-describedby="uji-nama uji-batas"/.test(x), `(${locale}) the input is not described by the choice and the limit`);
        c.expect(x.includes(`<label for="uji" class="pin-btn" aria-hidden="true">`) && x.includes(t("berkas.pilih", "staff", { locale })),
          `(${locale}) there is no «${t("berkas.pilih", "staff", { locale })}» button over the input`);
        c.expect(new RegExp(`<p class="pin-berkas-nama" id="uji-nama" aria-live="polite">.*${t("berkas.belum", "staff", { locale })}`).test(x),
          `(${locale}) the empty choice is not said in words, politely`);
      }
      const css = readFileSync(join(ctx.repoRoot, "src/app/experience.css"), "utf8");
      c.expect(/\.pin-berkas-tombol input\[type="file"\]\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*opacity:\s*0/.test(css),
        "the native input does not lie transparent over its button");
      c.expect(/\.pin-berkas input\[type="file"\]:focus-visible \+ label\s*\{[^}]*outline:/.test(css), "the button shows no focus ring for its input");
      const lapor = readFileSync(join(ctx.repoRoot, "src/components/lapor/TangkapanLayar.tsx"), "utf8");
      c.expect(/<BidangBerkas[^>]*label=\{s\("lapor\.tangkapan"\)\}/.test(lapor), "/lapor's screenshot field is not a labelled FileField");
      return c.verdict("no bare file input; FileField names its input by the field's label, hides the browser's words under «Pilih berkas» and names the choice in words; /lapor's screenshot is labelled");
    },
  },
];
