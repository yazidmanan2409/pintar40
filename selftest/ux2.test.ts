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
 *  UX2-PRIMITIF-01 W3.3 · THE PRIMITIVES (Daisy's components and 08-migration): a select shows the chevron; a choice
 *                 row is a 44 px target with a 20 px box; a success badge says ✓; the attention alert has its icon; the
 *                 health mark is a badge (the old sehat-tanda/perhatian mix is ended); «Keluar» carries log-out; every
 *                 <details> is a Disclosure with the chevron; the tab icon is Daisy's.
 *  UX2-KOSONG-01  W3.2 · EMPTY STATE (CR-46): Kosong renders a sentence and, except for «not enough yet», its action;
 *                 the absence card never shows «(n/m)» and says «Sekarang 3 murid; perlu 5.» where students are
 *                 counted; AlasanNonaktif gives a disabled button its reason beside it.
 *  UX2-MENU-01    W3.5 · THE ACCOUNT MENU AND THE ONE DIALOG (JQ2(a)): a staff strip's name is a menu button
 *                 (aria-haspopup, aria-expanded, aria-controls) over a hidden role=menu holding Akun saya, Laporan saya
 *                 and, last, «Keluar dari semua perangkat…», which opens the native dialog (showModal) whose «Batal»
 *                 takes focus and whose «Keluar dari semua» is the one solid red; «Keluar» stays outside the menu; a
 *                 learner's strip has no menu and no name.
 *  UX2-JAGA-01    W3.14 · THE IDLE WARNING (J7): an attention alert (role=alert) with the clock and its own heading,
 *                 mounted before the page in the flow (never fixed over the work), on the attention ground, no countdown.
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
      // the unfocusable-by-Tab starting point (FokusRute) may stand before it; the skip link is the first Tab stop
      c.expect(/^(<FokusRute \/>\s*)?<a href="#isi" className="pin-lewati pin-noprint">\{t\("aksesibilitas\.lewati"/.test(pertama),
        "«Langsung ke isi» is not the first thing in <body>, a link to #isi");
      const fr = readFileSync(join(ctx.repoRoot, "src/components/FokusRute.tsx"), "utf8");
      c.expect(/tabIndex=\{-1\}/.test(fr) && /usePathname/.test(fr) && /e\.closest\("#isi"\)/.test(fr),
        "after a navigation the Tab starting point is not put back before the skip link, or it takes focus a page placed");
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
      // every page has the target: its own <main id="isi">, or every path through it reaches a shared surface that
      // renders one (the refusal page, the assessment surface), or Studio's layout holds it. The certificate pages and
      // the refusal page once drew their content in a plain <div>, with no main at all (found by the crawl, Batch 2).
      const BERSAMA: Record<string, string> = {
        HalamanPenolakan: "src/components/HalamanPenolakan.tsx",
        PermukaanAsesmen: "src/app/belajar/_components/PermukaanAsesmen.tsx",
      };
      for (const [nama, f] of Object.entries(BERSAMA)) {
        c.expect(/<main id="isi"/.test(readFileSync(join(ctx.repoRoot, f), "utf8")), `${nama} renders no <main id="isi">`);
      }
      c.expect(/<main id="isi"/.test(readFileSync(join(ctx.repoRoot, "src/app/studio/layout.tsx"), "utf8")), "Studio's layout renders no <main id=\"isi\">");
      for (const f of berkas(join(ctx.repoRoot, "src/app"), /^page\.tsx$/)) {
        const isi = readFileSync(f, "utf8");
        const rel = relative(ctx.repoRoot, f);
        if (/<main id="isi"/.test(isi) || rel.startsWith(join("src", "app", "studio"))) continue;
        c.expect(Object.keys(BERSAMA).some((k) => new RegExp(`<${k}\\b`).test(isi)), `${rel}: no <main id="isi"> and no shared surface that renders one`);
      }
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
  {
    id: "UX2-PRIMITIF-01",
    run: async (ctx) => {
      const c = new Checks();
      const baca = (p: string) => readFileSync(join(ctx.repoRoot, p), "utf8");
      const css = baca("src/app/experience.css"), glob = baca("src/app/globals.css");
      const aturan = (sel: string) => {
        const esc = sel.replace(/[.*+?^${}()|[\]\\:>"=]/g, (x) => `\\${x}`);
        return css.match(new RegExp(`(?:^|\\n)${esc}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
      };
      c.expect(/--select-chevron:\s*url\("data:image\/svg\+xml,[^"]*m6 9 6 6 6-6/.test(glob), "no chevron token (globals.css)");
      const sel = aturan("select:not([multiple]):not([size])");
      c.expect(/appearance:\s*none/.test(sel) && /background-image:\s*var\(--select-chevron\)/.test(sel), "a select shows no chevron");
      const baris = css.match(/:where\(label:has\(input\[type="checkbox"\][^)]*\)\), label:has\(input\[type="radio"\]\)\)\s*\{([^}]*)\}/)?.[1] ?? "";
      c.expect(/min-height:\s*var\(--control-md\)/.test(baris), "a choice row is not a 44 px target");
      const kotak = css.match(/:where\(input\[type="checkbox"\][^,]*, input\[type="radio"\]\)\s*\{([^}]*)\}/)?.[1] ?? "";
      c.expect(/width:\s*var\(--icon-md\)/.test(kotak) && /height:\s*var\(--icon-md\)/.test(kotak), "a choice's box is not 20 px");
      // every checkbox and radio (but the menu drawer's toggle) is inside its label, so the whole row is its target
      for (const f of berkas(join(ctx.repoRoot, "src"), /\.tsx$/)) {
        const s = readFileSync(f, "utf8");
        for (const m of s.matchAll(/<input\b[^>]*?type="(checkbox|radio)"|<input\s*\n\s*type="(checkbox|radio)"/g)) {
          const sebelum = s.slice(0, m.index);
          if (/pin-laci-saklar/.test(s.slice(m.index!, m.index! + 200))) continue;
          c.expect(sebelum.lastIndexOf("<label") > sebelum.lastIndexOf("</label>"), `${relative(ctx.repoRoot, f)}: a ${m[1] ?? m[2]} outside its label`);
        }
      }
      c.expect(/content:\s*"✓"/.test(aturan(".pin-pill.pin-ok::before")), "a success badge has the dot, not ✓");
      const kartu = baca("src/components/konfigurasi/KartuKesehatan.tsx");
      c.expect(!/pin-sehat-tanda pin-perhatian/.test(kartu) && /pin-pill pin-attention/.test(kartu) && !/\.pin-sehat-tanda\.pin-perhatian/.test(css),
        "the health mark still mixes the Alert's class into a badge");
      const belajar = baca("src/app/belajar/page.tsx");
      const alert = [...belajar.matchAll(/<div className="pin-perhatian"[^>]*>\s*(<[^>]+>)/g)].map((m) => m[1]);
      c.expect(alert.length >= 2 && alert.every((x) => /<Ikon nama="triangle-alert" kelas="pin-perhatian-ikon" \/>/.test(x)), "the attention alert has no icon");
      // (E1: in the staff rail the word is visually hidden beside the icon, pin-rail-teks; still the button's own text)
      c.expect(/<Ikon nama="log-out" \/>\s*(?:<span className="pin-rail-teks">)?\{s\("sesi\.keluar"\)\}/.test(baca("src/components/BarisSesi.tsx")), "«Keluar» has no log-out icon");
      let rinci = 0;
      for (const f of berkas(join(ctx.repoRoot, "src"), /\.tsx$/)) {
        const s = readFileSync(f, "utf8");
        for (const m of s.matchAll(/<details\b[^>]*>\s*<summary[^>]*>[\s\S]*?<\/summary>/g)) {
          rinci++;
          c.expect(/className="[^"]*(pin-disclosure|pin-kelas-bukti)/.test(m[0]) && /<Ikon nama="chevron-down" kelas="pin-chevron" \/>/.test(m[0]),
            `${relative(ctx.repoRoot, f)}: a <details> without the Disclosure chevron`);
        }
      }
      c.expect(rinci >= 6, `only ${rinci} <details> found`);
      c.expect(/\.pin-disclosure > summary::-webkit-details-marker\s*\{\s*display:\s*none/.test(css), "the browser's marker still shows");
      const sidik = spawnSync("git", ["hash-object", "src/app/favicon.ico"], { cwd: ctx.repoRoot, encoding: "utf8" }).stdout.trim();
      c.expect(sidik === "70839bbe9b197e4b7d2a45997566c2abdf7ac720", `the tab icon is not Daisy's (${sidik})`);
      return c.verdict(`select chevron, 44 px choice rows with 20 px boxes, ✓ badge, alert icon, the health badge, «Keluar» with log-out, ${rinci} Disclosures with the chevron, Daisy's tab icon`);
    },
  },
  {
    id: "UX2-KOSONG-01",
    run: async (ctx) => {
      const c = new Checks();
      const a = render(ctx.repoRoot, "src/components/Kosong.tsx", { jenis: "belum", kalimat: "Bab yang disediakan muncul di sini.", aksi: { href: "/mengajar", label: "Siapkan materi pertama" } });
      const k = render(ctx.repoRoot, "src/components/Kosong.tsx", { jenis: "kurang", kalimat: "Sekarang 2 murid; perlu 5.", aksi: { href: "/x", label: "Tidak" } });
      const n = render(ctx.repoRoot, "src/components/Kosong.tsx", { jenis: "tidak_cocok", kalimat: "Tidak ada murid yang cocok dengan «Ani».", aksi: { href: "?", label: "Hapus pencarian" } });
      if (c.expect(a.ok && k.ok && n.ok, `Kosong could not be rendered: ${a.galat || k.galat || n.galat}`)) {
        c.expect(/data-kosong="belum"/.test(a.html) && /<p class="pin-kosong-kalimat">Bab yang disediakan muncul di sini\.<\/p>/.test(a.html)
          && /<a class="pin-btn" href="\/mengajar">Siapkan materi pertama<\/a>/.test(a.html), "«not yet» is not a sentence and its first action");
        c.expect(/data-kosong="kurang"/.test(k.html) && !/<a /.test(k.html), "«not enough yet» offers an action");
        c.expect(/Hapus pencarian<\/a>/.test(n.html), "«nothing matches» has no way back");
      }
      // an empty state is drawn as one, never as a result line: BarisHasil scrolls itself into view on mount, which moved the
      // browser's Tab starting point past «Langsung ke isi» on /aktivasi (found by the crawl, Batch 2 promotion)
      const ulang = readFileSync(join(ctx.repoRoot, "src/components/aktivasi/KartuUlang.tsx"), "utf8");
      c.expect(/<Kosong jenis="belum" kalimat=\{s\("aktivasi\.ulang\.kosong"\)\} \/>/.test(ulang) && !/<BarisHasil[^>]*>\{s\("aktivasi\.ulang\.kosong"\)\}/.test(ulang),
        "Aktivasi's «no card holders yet» is drawn as a result line, not an empty state");
      const kk = readFileSync(join(ctx.repoRoot, "src/components/bukti/KartuKetiadaan.tsx"), "utf8");
      c.expect(!/\(\$\{format\.number\(entry\.have/.test(kk) && /ketiadaan\.jumlah\.murid/.test(kk), "the absence card still writes «(have/needed)»");
      const { t } = await import("../src/lib/hle");
      c.expect(t("ketiadaan.jumlah.murid", "staff").replace("{have}", "2").replace("{needed}", "5") === "Sekarang 2 murid; perlu 5.", "the count sentence is not Daisy's");
      const r = render(ctx.repoRoot, "src/components/AlasanNonaktif.tsx", { id: "periksa-alasan", children: "Pilih buku kerja dahulu." });
      c.expect(r.ok && r.html === '<p class="pin-alasan" id="periksa-alasan">Pilih buku kerja dahulu.</p>', `the reason line is ${r.html || r.galat}`);
      return c.verdict("Kosong: a sentence and its action (none for «not enough yet»); the absence card says «Sekarang 3 murid; perlu 5.», never «(3/5)»; a disabled button's reason is a line beside it");
    },
  },
  {
    id: "UX2-MENU-01",
    run: async (ctx) => {
      const c = new Checks();
      const { t } = await import("../src/lib/hle");
      for (const locale of ["id", "en"] as const) {
        const st = render(ctx.repoRoot, "src/components/BarisSesi.tsx", { locale, persona: "staff", nama: "Rina Kartika" });
        const mu = render(ctx.repoRoot, "src/components/BarisSesi.tsx", { locale, persona: "learner", nama: null });
        if (!c.expect(st.ok && mu.ok, `the strip could not be rendered: ${st.galat || mu.galat}`)) continue;
        const x = st.html, s = (k: Parameters<typeof t>[0]) => t(k, "staff", { locale });
        c.expect(/<button type="button" class="pin-menu-tombol" aria-haspopup="menu" aria-expanded="false" aria-controls="pin-menu-akun">(?:<span class="pin-avatar" aria-hidden="true">RK<\/span>)?<strong>Rina Kartika<\/strong>/.test(x),
          `(${locale}) the staff member's name is not the menu's button`);
        const menu = x.match(/<div id="pin-menu-akun" class="pin-menu" role="menu" aria-label="Rina Kartika" hidden="">([\s\S]*?)<\/div>/)?.[1] ?? "";
        const butir = [...menu.matchAll(/role="menuitem"[^>]*>([^<]+)</g)].map((m) => m[1]);
        c.expect(JSON.stringify(butir) === JSON.stringify([s("sesi.akun"), s("lapor.saya.buka"), s("sesi.menu.semua")]),
          `(${locale}) the menu holds ${JSON.stringify(butir)}`);
        c.expect(/href="\/akun"/.test(menu) && /href="\/lapor\/saya"/.test(menu) && /<button role="menuitem" type="button" class="pin-menu-butir pin-menu-bahaya"/.test(menu),
          `(${locale}) the items do not go where they say, or the destructive one is not last and a button`);
        c.expect(/<dialog class="pin-dialog" aria-labelledby="pin-dialog-semua">/.test(x) && x.includes(`<h2 id="pin-dialog-semua">${s("akun.semua.yakin")}</h2>`),
          `(${locale}) there is no dialog asking «${s("akun.semua.yakin")}»`);
        const aksi = x.match(/<div class="pin-dialog-aksi">([\s\S]*?)<\/div>/)?.[1] ?? "";
        c.expect(aksi.indexOf(s("akun.semua.batal")) > -1 && aksi.indexOf(s("akun.semua.batal")) < aksi.indexOf(s("akun.semua.ya"))
          && /class="pin-btn pin-bahaya-pasti"[^>]*>[^<]*<|class="pin-btn pin-bahaya-pasti"/.test(aksi), `(${locale}) the safe action is not first, or the act is not the solid red`);
        c.expect(/<form action="\/keluar" method="post">/.test(x) && !/role="menu"[\s\S]*\/keluar"/.test(menu), `(${locale}) «Keluar» is not outside the menu`);
        c.expect(!/pin-menu|role="menu"|<dialog/.test(mu.html), `(${locale}) a learner's strip has a menu`);
      }
      const src = readFileSync(join(ctx.repoRoot, "src/components/sesi/MenuAkun.tsx"), "utf8");
      const dlg = readFileSync(join(ctx.repoRoot, "src/components/Dialog.tsx"), "utf8");
      c.expect(/d\.showModal\(\)/.test(dlg) && /p\.focus\(\)/.test(dlg), "the dialog is not modal, or focus does not return to its opener");
      // focus starts on «Batal» because it is the dialog's first control and showModal() focuses that; React's autoFocus
      // focused it at mount, inside the closed dialog, and moved the page's Tab starting point (found on /aktivasi)
      c.expect(!/<button[^>]*\sautoFocus[\s/>]/.test(src) && /<div className="pin-dialog-aksi">\{aksi\}<\/div>/.test(dlg), "focus does not start on «Batal» through showModal, or autoFocus is back");
      for (const k of ["ArrowDown", "ArrowUp", "Home", "End", "Escape", "Tab"]) c.expect(src.includes(`e.key === "${k}"`), `the menu ignores ${k}`);
      c.expect(/butir\(\)\[0\]\?\.focus\(\)/.test(src) && /pointerdown/.test(src), "the first item does not take focus on open, or a press outside does not close it");
      const css = readFileSync(join(ctx.repoRoot, "src/app/experience.css"), "utf8");
      c.expect(/\.pin-menu-butir \{[^}]*min-height: var\(--control-md\)/.test(css) && /\.pin-dialog::backdrop \{ background: var\(--scrim\); \}/.test(css)
        && /@media \(max-width: 639px\) \{ \.pin-dialog-aksi \{ flex-direction: column-reverse;/.test(css), "menu items are not 44 px, the scrim is missing, or the actions do not stack safe-last under 640 px");
      return c.verdict("a staff member's name opens a 44 px menu (Akun saya, Laporan saya, «Keluar dari semua perangkat…» last) with arrow, Home/End, Esc and outside-press handling; the one dialog is modal, starts on «Batal» and names «Keluar dari semua» in the one solid red; «Keluar» stays outside; a learner has none");
    },
  },
  {
    id: "UX2-JAGA-01",
    run: async (ctx) => {
      const c = new Checks();
      const src = readFileSync(join(ctx.repoRoot, "src/components/PenjagaSesi.tsx"), "utf8");
      c.expect(/<div className="pin-jaga" role="alert">\s*<Ikon nama="clock" kelas="pin-jaga-ikon" \/>/.test(src), "the warning is not an alert with the clock");
      c.expect(/<h2 className="pin-jaga-judul">\{t\("jaga\.judul"/.test(src), "the warning has no heading");
      const { t } = await import("../src/lib/hle");
      c.expect(t("jaga.judul", "staff") === "PINTAR akan terkunci dalam 1 menit", "the heading is not Daisy's");
      const tata = readFileSync(join(ctx.repoRoot, "src/app/layout.tsx"), "utf8");
      c.expect(tata.indexOf("<PenjagaSesi") > -1 && tata.indexOf("<PenjagaSesi") < tata.indexOf("{children}"), "the warning is not mounted before the page (the top)");
      const css = readFileSync(join(ctx.repoRoot, "src/app/experience.css"), "utf8");
      const r = css.match(/\n\.pin-jaga \{([^}]*)\}/)?.[1] ?? "";
      // RESTATED FOR E3 #3 (Daisy): kept in view at the top (sticky, in the flow), never fixed over the work
      c.expect(/background: var\(--status-attention-soft\)/.test(r) && !/position:\s*fixed/.test(r) && /position: sticky; top: var\(--space-2\); z-index: var\(--z-sticky\);/.test(r), "the warning is not on the attention ground, does not stay in view, or floats over the work");
      c.expect(!/setInterval\([^)]*1_?000\)|detik|seconds/i.test(src.split("if (!peringatan) return null;")[1] ?? ""), "the warning counts down");
      return c.verdict("the idle warning is an alert at the top of the page, in the flow and kept in view (sticky), with the clock and «PINTAR akan terkunci dalam 1 menit», on the attention ground, without a countdown");
    },
  },
];
