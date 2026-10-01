/**
 * W9 (the part on the class's figures) -- ONE FIGURE, ONE READING, ON EVERY SCREEN.
 *
 * «Lihat bukti» shows a class's net gain as «+35 poin»; /pimpinan showed the
 * same figure as «35%», because it guessed a unit from the value. The guess also
 * printed a perfect comprehension as «1» and a negative gain as a raw decimal
 * (journey cross-check W9; HOD-J03, HOD-J09). This executes the one rule the
 * three screens now read and checks each is wired to it. How the report pages
 * show structured figures (cohorts, competencies) is not part of this.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

export const w9Tests: SelfTest[] = [
  {
    id: "W9-K01",
    run: async (ctx) => {
      const c = new Checks();
      let m: { nilaiMetrik?: (id: string | null, v: unknown, l: "id" | "en") => string } = {};
      try { m = await import("../src/lib/nilai-metrik"); } catch { /* reported below */ }
      if (!c.expect(typeof m.nilaiMetrik === "function", "there is no one rule for a figure: src/lib/nilai-metrik.ts has no nilaiMetrik")) {
        return c.verdict("");
      }
      const n = m.nilaiMetrik!;
      const { format } = await import("../src/lib/hle");
      const sp = (x: string) => x.replace(/\s/g, " ");

      for (const l of ["id", "en"] as const) {
        const poin = l === "id" ? "poin" : "points";
        // the net gain reads as «Lihat bukti» reads it, at class and at school
        c.expect(sp(n("class.net_gain", 0.35, l)) === `+35 ${poin}` && sp(n("institution.net_gain", 0.35, l)) === `+35 ${poin}`,
          `(${l}) a net gain of 0.35 reads «${n("class.net_gain", 0.35, l)}» / «${n("institution.net_gain", 0.35, l)}»; «Lihat bukti» says +35 ${poin}`);
        c.expect(sp(n("class.net_gain", -0.13, l)).endsWith(`13 ${poin}`) && !/0[.,]1/.test(n("class.net_gain", -0.13, l)) && !n("class.net_gain", -0.13, l).startsWith("+"),
          `(${l}) a negative net gain reads «${n("class.net_gain", -0.13, l)}»`);
        c.expect(sp(n("class.net_gain", 0, l)) === `0 ${poin}`, `(${l}) no gain reads «${n("class.net_gain", 0, l)}»`);
        // a share is a percentage at its ends too
        c.expect(n("class.comprehension", 1, l) === format.percent(1, l) && n("class.comprehension", 0, l) === format.percent(0, l)
            && n("institution.safety_gate_pass_rate", 1, l) === format.percent(1, l),
          `(${l}) a perfect or empty share reads «${n("class.comprehension", 1, l)}» / «${n("class.comprehension", 0, l)}»`);
        c.expect(n("class.comprehension", 0.75, l) === format.percent(0.75, l), `(${l}) 0.75 comprehension reads «${n("class.comprehension", 0.75, l)}»`);
        // a count is a count
        c.expect(n("class.participants", 5, l) === format.number(5, l), `(${l}) five participants read «${n("class.participants", 5, l)}»`);
        // an unnamed metric keeps the old reading
        c.expect(n("class.unknown_ratio", 0.5, l) === format.percent(0.5, l) && n(null, 7, l) === format.number(7, l) && n("x", null, l) === "—",
          `(${l}) a metric this rule does not name reads differently from before`);
      }

      // the wiring: «Lihat bukti», /pimpinan and its class pages read the one rule, and keep no guess of their own
      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "").replace(/\{\s*\}/g, "");
      const baca = (...p: string[]) => buang(readFileSync(join(ctx.repoRoot, ...p), "utf8"));
      for (const p of [["src", "app", "pimpinan", "page.tsx"], ["src", "app", "pimpinan", "[simpul]", "page.tsx"]]) {
        const src = baca(...p);
        c.expect(/value=\{nilaiMetrik\(e\.metric_id, e\.value, locale\)\}/.test(src) && !/function nilai\(/.test(src) && !/value=\{nilai\(/.test(src),
          `${p.join("/")} still guesses a unit from the value`);
      }
      const bukti = baca("src", "app", "mengajar", "[kelas]", "bukti", "page.tsx");
      c.expect(/nilaiMetrik\("class\.comprehension", v, locale\)/.test(bukti) && /nilaiMetrik\("class\.net_gain", v, locale\)/.test(bukti)
          && !/mengajar\.bukti\.poin/.test(bukti),
        "«Lihat bukti» formats its two figures by itself rather than through the one rule");

      return c.verdict(
        "executed in both languages: a net gain reads as «Lihat bukti» reads it (+35 poin; a negative one signed, no raw " +
          "decimal; none as 0 poin) at class and school; a share reads as a percentage at 0 and 1 as well as between; a " +
          "count as a count; a metric the rule does not name reads as before; the source of /pimpinan, of its class pages " +
          "and of «Lihat bukti» reads nilaiMetrik and keeps no guess of its own",
      );
    },
  },
];
