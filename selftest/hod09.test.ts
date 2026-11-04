/**
 * HOD-J09 -- A REPORT HAS A WAY BACK AND CAN BE PRINTED.
 *
 * The class and school reports (/edukator/ringkasan, /dekan/ringkasan) are
 * reached from /pimpinan and Konfigurasi and had no way back but the browser's
 * own, and no print (journey cross-check HOD-J09: PARTIAL). This renders the
 * report's controls and reads both pages' source.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { t } from "../src/lib/hle";
import { Checks, type SelfTest } from "./lib";

export const hod09Tests: SelfTest[] = [
  {
    id: "HOD09-K01",
    run: async (ctx) => {
      const c = new Checks();
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/laporan/AksiLaporan.tsx");' +
        "  const A = m.default?.default ?? m.default;" +
        "  process.stdout.write(renderToStaticMarkup(h(A, { kembali: 'Kembali', cetak: 'Cetak laporan' })));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], { cwd: ctx.repoRoot, encoding: "utf8" });
      if (c.expect(anak.status === 0, `the report's controls could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) {
        const html = anak.stdout;
        const kontrol = [...html.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/g)].map((m) => [m[1], /href="([^"]*)"/.exec(m[2])?.[1] ?? "", m[3].replace(/<[^>]+>/g, "").trim()]);
        c.expect(JSON.stringify(kontrol) === JSON.stringify([["a", "/", "← Kembali"], ["button", "", "Cetak laporan"]]),
          `the report offers ${JSON.stringify(kontrol)}; expected a way back (a link to the reader's doors) and print`);
        c.expect(/^<div class="[^"]*\bpin-noprint\b/.test(html), "the report's controls are printed with it");
      }
      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      const aksi = buang(readFileSync(join(ctx.repoRoot, "src", "components", "laporan", "AksiLaporan.tsx"), "utf8"));
      c.expect(/if \(window\.history\.length > 1\) \{\s*e\.preventDefault\(\);\s*window\.history\.back\(\);/.test(aksi) && /window\.print\(\)/.test(aksi),
        "«Kembali» does not return where the reader came from (else their doors), or print is not the browser's print of this page");
      for (const [hal, persona] of [["edukator", "untuk"], ["dekan", "\"staff\""]] as const) { // E-C1-2: the class report's persona is the context's (`untuk`)
        const src = buang(readFileSync(join(ctx.repoRoot, "src", "app", hal, "ringkasan", "page.tsx"), "utf8"));
        // RESTATED FOR W3.8 (Batch 5, RV-11): the signed-in strip is the staff shell's now, whose header is
        // `pin-noprint` (asserted on shellStaf below), so the page draws no strip of its own to keep off the paper
        // RESTATED FOR E-K1 (D-173(d)): the way back is the history-back, named as one (KEMBALI_RIWAYAT), never a bare «Kembali»
        c.expect(new RegExp(`<AksiLaporan kembali=\\{s\\(KEMBALI_RIWAYAT, ${persona}, locale\\)\\} cetak=\\{s\\("laporan\\.cetak", ${persona}, locale\\)\\} />`).test(src)
          && /<CangkangStaf locale=\{locale\}/.test(src) && !/<SesiSaya\b/.test(src),
          `/${hal}/ringkasan offers no way back or print, or prints the signed-in strip`);
      }
      const shell = buang(readFileSync(join(ctx.repoRoot, "src", "components", "CangkangPengalaman.tsx"), "utf8"));
      c.expect(/<header className="pin-top pin-shell pin-noprint pin-staf">[\s\S]*?\{sesi\}\s*<\/header>/.test(shell.slice(shell.indexOf("function shellStaf("))),
        "the staff shell's signed-in strip is printed with the report");
      for (const locale of ["id", "en"] as const) {
        c.expect(t("laporan.cetak", "staff", { locale }) !== t("kembali.riwayat", "staff", { locale }), `(${locale}) the report's two controls read alike`);
      }
      return c.verdict(
        "AksiLaporan (rendered output): «← Kembali» and «Cetak laporan», in a row that does not print; its source returns to " +
          "the page the reader came from, else their doors (/), and prints with the browser's print. The source of both " +
          "report pages (/edukator/ringkasan, /dekan/ringkasan) draws it in the reader's language and keeps the signed-in " +
          "strip off the paper",
      );
    },
  },
];
