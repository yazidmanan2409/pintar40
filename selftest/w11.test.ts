/**
 * W11 -- FROM A NODE, MANAGEMENT IS OFFERED ONLY THE PARTS A SCREEN MAY SHOW.
 *
 * /pimpinan/<node> listed every node of its branch, so a head of department saw
 * the hidden «Reguler» (PROGRAMME) and «Jenjang» (FACULTY) beside their Tingkat
 * and Kelas, against D-006 and D-027 (journey cross-check W11; MGT-J05). This
 * executes the rule the page now reads, over a branch as `cabang` returns it,
 * and checks the page reads it.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const CABANG = [
  { id: "d", nama: "Kelas Rendah", kind: "DEPARTMENT" },
  { id: "p", nama: "Reguler", kind: "PROGRAMME" },
  { id: "t", nama: "Tingkat 1", kind: "COHORT" },
  { id: "k1", nama: "Kelas 1A", kind: "CLASS" },
  { id: "k2", nama: "Kelas 1B", kind: "CLASS" },
];
const SEKOLAH = [
  { id: "i", nama: "Sekolah", kind: "INSTITUTION" },
  { id: "f", nama: "Jenjang", kind: "FACULTY" },
  ...CABANG,
];

export const w11Tests: SelfTest[] = [
  {
    id: "W11-K01",
    run: async (ctx) => {
      const c = new Checks();
      const pim = (await import("../src/lib/pimpinan")) as Record<string, unknown> as {
        bagianDiBawah?: <T extends { id: string; kind: string }>(node: string, bawah: readonly T[]) => T[];
      };
      const { jenisTerlihat } = (await import("../src/lib/struktur-kontrak")) as Record<string, unknown> as {
        jenisTerlihat?: (k: string) => boolean;
      };
      if (!c.expect(typeof pim.bagianDiBawah === "function" && typeof jenisTerlihat === "function",
        "there is no one rule for where a reader can go from a node (bagianDiBawah, jenisTerlihat)")) {
        return c.verdict("");
      }
      const dari = (node: string, bawah: typeof SEKOLAH) => pim.bagianDiBawah!(node, bawah).map((n) => n.nama);
      const d = dari("d", CABANG);
      c.expect(JSON.stringify(d) === JSON.stringify(["Tingkat 1", "Kelas 1A", "Kelas 1B"]),
        `from a department the page offers ${JSON.stringify(d)}; expected its Tingkat and Kelas only, never «Reguler» or the department itself`);
      const i = dari("i", SEKOLAH);
      c.expect(!i.includes("Jenjang") && !i.includes("Reguler") && !i.includes("Sekolah") && i.includes("Kelas Rendah"),
        `from the school the page offers ${JSON.stringify(i)}; «Jenjang» or «Reguler» shown, or the school itself, or a Bagian missing`);
      c.expect(["DEPARTMENT", "COHORT", "CLASS"].every(jenisTerlihat!) && !["FACULTY", "PROGRAMME", "INSTITUTION", "constructor", ""].some(jenisTerlihat!),
        "the visible levels are not exactly Bagian, Tingkat and Kelas (D-006)");

      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      const page = buang(readFileSync(join(ctx.repoRoot, "src", "app", "pimpinan", "[simpul]", "page.tsx"), "utf8"));
      c.expect(/const lain = pim\.bagianDiBawah\(node\.id, bawah\);/.test(page) && !/bawah\.filter\(\(n\) => n\.id !== node\.id\)/.test(page),
        "the node page still lists every node of its branch");

      return c.verdict(
        "executed over a branch as cabang returns it: from a department the node page offers its Tingkat and Kelas, never " +
          "«Reguler» or itself; from the school, its Bagian and below, never «Jenjang», «Reguler» or the school; the visible " +
          "levels are exactly Bagian, Tingkat and Kelas, read from the intake's own map in src/lib/struktur-kontrak.ts; the " +
          "source of the node page reads bagianDiBawah",
      );
    },
  },
];
