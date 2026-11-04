/**
 * D-168 (cross-component integrity) and D-172 (one experience): checks that span components, kept in one place
 * inside the existing static suite.
 *
 *   D168-B1-5  Konfigurasi: every school-shaped section (BAGIAN_SEKOLAH) is drawn only where the menu lists it, so
 *              «Seluruh platform» draws none (L3; D-169(a)). Each such <section> carries the same `tampil()` rule the
 *              menu uses — the menu and the sections cannot disagree.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const kode = (x: string) => x.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");

export const d168Tests: SelfTest[] = [
  {
    id: "D168-B1-5",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const src = kode(readFileSync(join(repoRoot, "src/app/konfigurasi/page.tsx"), "utf8"));
      const m = src.match(/const BAGIAN_SEKOLAH = \[([^\]]*)\]/);
      if (!c.expect(m !== null, "BAGIAN_SEKOLAH (the school-shaped sections) is not declared in Konfigurasi") || !m) return c.verdict("");
      const bagian = [...m[1].matchAll(/"([a-z_]+)"/g)].map((x) => x[1]);
      c.expect(bagian.length >= 5, `only ${bagian.length} school-shaped sections declared`);
      c.expect(/const nav = navSemua\.filter\(\(\[bagian\]\) => tampil\(bagian\)\)/.test(src), "the menu is not filtered by tampil()");
      for (const b of bagian) {
        const tag = src.match(new RegExp(`<section id="${b}"[^>]*>`));
        if (!tag) continue; // a section drawn elsewhere (or not at all) is not this page's
        c.expect(new RegExp(`hidden=\\{!tampil\\("${b}"\\)`).test(tag[0]), `the section «${b}» is drawn without the menu's rule (tampil): it shows in «Seluruh platform» although L3 hides it`);
      }
      return c.verdict("every school-shaped Konfigurasi section carries the menu's own tampil() rule, so «Seluruh platform» draws none");
    },
  },
];
