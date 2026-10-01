/**
 * W8 -- «LIHAT BUKTI» COUNTS THREE STATES, NEVER TWO.
 *
 * «Keadaan hari ini» showed «Mengumpulkan» and «Belum mengerjakan», the second
 * computed as everyone who had not submitted: a learner halfway through a test
 * read as one who had never started it. The started count was computed beside
 * it and never shown (journey cross-check W8; BD-08, EDU-J24). This takes the
 * rows the page reads through the page's own counting (pilihBerjalan), renders
 * the block, and reads what the teacher is told.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

export const w8Tests: SelfTest[] = [
  {
    id: "W8-K01",
    run: async (ctx) => {
      const c = new Checks();
      const { pilihBerjalan } = await import("../src/lib/pengajar");
      const { hitungKeadaan } = (await import("../src/components/bukti/KeadaanHariIni")) as Record<string, unknown> as {
        hitungKeadaan?: (a: { mengumpulkan: number; mulai: number }, murid: number) => { kumpul: number; sedang: number; belum: number };
      };
      const { t } = await import("../src/lib/hle");

      // a class of 25; the Uji Penguasaan open; 5 handed in, 3 started and not handed in (one with two sessions), 17 never started
      const now = Date.parse("2026-10-01T09:00:00+07:00");
      const baris = [{ id: "post", node_id: "k", status: "OPEN", opens_at: "2026-09-30T00:00:00+07:00", closes_at: "2026-10-02T23:59:59+07:00",
        definition: { title: "Uji Penguasaan — Bab 1", mode: "POST_TEST", item_count: 8, is_ad_hoc: false } }];
      const sesi = [
        ...["p1", "p2", "p3"].map((p) => ({ assessment_assignment_id: "post", person_id: p, status: "FINALIZED" })),
        ...["p4", "p5"].map((p) => ({ assessment_assignment_id: "post", person_id: p, status: "SUBMITTED" })),
        ...["p6", "p7", "p8", "p8"].map((p) => ({ assessment_assignment_id: "post", person_id: p, status: "IN_PROGRESS" })),
      ];
      const asesmen = pilihBerjalan(baris, sesi, ["OPEN"], now);
      c.expect(asesmen.length === 1 && asesmen[0].mengumpulkan === 5 && asesmen[0].mulai === 8,
        `the page's counting gives ${JSON.stringify(asesmen.map((a) => [a.mengumpulkan, a.mulai]))}; expected 5 handed in of 8 started`);

      // the arithmetic, and its edges
      if (c.expect(typeof hitungKeadaan === "function", "KeadaanHariIni has no hitungKeadaan: the three states are not counted apart")) {
        const h = hitungKeadaan!;
        c.expect(JSON.stringify(h({ mengumpulkan: 5, mulai: 8 }, 25)) === JSON.stringify({ kumpul: 5, sedang: 3, belum: 17 }),
          `25 learners, 5 handed in, 8 started: ${JSON.stringify(h({ mengumpulkan: 5, mulai: 8 }, 25))}`);
        c.expect(h({ mengumpulkan: 5, mulai: 3 }, 25).sedang === 0 && h({ mengumpulkan: 5, mulai: 3 }, 25).belum === 20,
          "a started count below the handed-in count makes a negative or an inflated state");
        c.expect(h({ mengumpulkan: 2, mulai: 30 }, 25).belum === 0, "more started than the class (learners who left) makes a negative «Belum mengerjakan»");
        const x = h({ mengumpulkan: 9, mulai: 14 }, 30);
        c.expect(x.kumpul + x.sedang + x.belum === 30, "the three states do not add up to the class");
      }

      // rendered, as the teacher reads it, in both languages
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/bukti/KeadaanHariIni.tsx");' +
        "  const K = m.default?.default ?? m.default;" +
        "  const k = JSON.parse(process.env.W8_KASUS);" +
        "  process.stdout.write(JSON.stringify(['id', 'en'].map((locale) => renderToStaticMarkup(h(K, { ...k, locale })))));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: ctx.repoRoot, encoding: "utf8", env: { ...process.env, W8_KASUS: JSON.stringify({ asesmen, murid: 25 }) },
      });
      let html: string[] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (c.expect(anak.status === 0 && html.length === 2, `«Keadaan hari ini» could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) {
        const fakta = (h: string) => Object.fromEntries([...h.matchAll(/<dt>([^<]*)<\/dt><dd[^>]*>([\s\S]*?)<\/dd>/g)]
          .map((m) => [m[1], m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()]));
        for (const [i, locale] of (["id", "en"] as const).entries()) {
          const f = fakta(html[i]);
          const kata = (k: Parameters<typeof t>[0]) => t(k, "educator", { locale });
          c.expect(f[kata("mengajar.bukti.kumpul")] === "5 / 25", `(${locale}) handed in reads «${f[kata("mengajar.bukti.kumpul")]}»; expected 5 / 25`);
          c.expect((f[kata("mengajar.bukti.mulai")] ?? "").startsWith("3 "),
            `(${locale}) started and not handed in reads «${f[kata("mengajar.bukti.mulai")] ?? "not shown"}»; expected 3`);
          c.expect((f[kata("mengajar.bukti.belum")] ?? "").startsWith("17 "),
            `(${locale}) «${kata("mengajar.bukti.belum")}» reads «${f[kata("mengajar.bukti.belum")]}»; expected 17: the 3 halfway through are counted as never started`);
        }
      }

      // the wiring: the page hands the block the counted assignments; the block counts nothing else
      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      const blok = buang(readFileSync(join(ctx.repoRoot, "src", "components", "bukti", "KeadaanHariIni.tsx"), "utf8"));
      c.expect(!/murid - a\.mengumpulkan/.test(blok), "the block still counts «Belum mengerjakan» as everyone who has not handed in");
      c.expect(/mulai: mulai\.get\(b\.id\)\?\.size \?\? 0/.test(buang(readFileSync(join(ctx.repoRoot, "src", "lib", "pengajar.ts"), "utf8"))),
        "pilihBerjalan no longer counts the learners who started");

      return c.verdict(
        "the rows «Lihat bukti» reads, counted by pilihBerjalan (25 learners: 5 handed in, 3 started and not handed in, one of " +
          "them twice), render in both languages as «Mengumpulkan» 5 / 25, «Sudah mulai, belum mengumpulkan» 3 and «Belum " +
          "mengerjakan» 17; hitungKeadaan's three states add up to the class and stay non-negative when the started count is " +
          "below the handed-in count or above the class; the block no longer computes «Belum mengerjakan» as everyone who has " +
          "not handed in",
      );
    },
  },
];
