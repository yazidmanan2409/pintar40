/**
 * The closure's batch 3 behaviour (D-118 §2, D-120, D-121): what a screen must draw, rendered from the real component
 * before any script runs, or read from the page's own source where it is a server page with a fetch.
 *
 * PENUTUPAN-Q10 — D-121(a): a certificate whose learner passed a school mark below 70% carries no PINTAR descriptor,
 * and its line is absent from the certificate and from the public check, rather than a dash.
 * PENUTUPAN-S01 — CR-02 (D-078(c), D-077(d)): the learner's certificate page draws the school, the course and the
 * certificate's language from the certificate's own seal (my_certificate), never from today's school or assignment.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t } from "../src/lib/hle";

function gambarKartu(repoRoot: string, kasus: { predikat: string | null; variant: "screen" | "sheet" }[]): { html: string[]; galat: string } {
  const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
    "(async () => {" +
    '  const { createElement: h } = await import("react");' +
    '  const { renderToStaticMarkup } = await import("react-dom/server");' +
    '  const m = await import("file://" + process.cwd() + "/src/components/sertifikat/KartuSertifikat.tsx");' +
    "  const K = m.default?.default ?? m.default;" +
    '  const { readFileSync } = await import("node:fs");' +
    '  const out = JSON.parse(readFileSync(0, "utf8")).map((k) => renderToStaticMarkup(h(K, { locale: "id", variant: k.variant, cred: {' +
    '    institution: "Sekolah Contoh", nameAsIssued: "Bunga Lestari", course: "Matematika · Bab 1", predikat: k.predikat,' +
    '    issuedAtIso: "2026-10-06T00:00:00Z", certificateNumber: "A14CD7ST/00001", verificationUrl: null } })));' +
    "  process.stdout.write(JSON.stringify(out));" +
    "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
    cwd: repoRoot, encoding: "utf8", maxBuffer: 1 << 24, input: JSON.stringify(kasus),
  });
  let html: string[] = [];
  try { html = JSON.parse(anak.stdout); } catch { /* reported by the caller */ }
  return { html, galat: anak.status === 0 && html.length === kasus.length ? "" : (anak.stderr || "no output").split("\n").slice(0, 4).join(" ") };
}

export const penutupanTests: SelfTest[] = [
  {
    id: "PENUTUPAN-Q10",
    run: async (ctx) => {
      const c = new Checks();
      const label = t("sertifikat.predikat", "learner", { locale: "id" });
      const kasus = [
        { predikat: null, variant: "screen" as const },
        { predikat: null, variant: "sheet" as const },
        { predikat: "Baik", variant: "screen" as const },
        { predikat: "Cukup", variant: "sheet" as const },
      ];
      const { html, galat } = gambarKartu(ctx.repoRoot, kasus);
      c.expect(galat === "", `the certificate could not be rendered: ${galat}`);
      const teks = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (galat === "") {
        kasus.forEach((k, i) => {
          const v = teks(html[i] ?? "");
          const nama = `the ${k.variant} with ${k.predikat ? `«${k.predikat}»` : "no descriptor"}`;
          if (k.predikat) {
            c.expect(v.includes(`${label} ${k.predikat}`), `${nama} does not read «${label} ${k.predikat}»: "${v.slice(0, 200)}"`);
          } else {
            c.expect(!v.includes(label) && !/—/.test(v), `${nama} still draws a descriptor line: "${v.slice(0, 200)}"`);
          }
          c.expect(v.includes("A14CD7ST/00001") && v.includes("Bunga Lestari"), `${nama} lost the rest of the certificate`);
        });
      }
      // the public check is a server page with a fetch: its source draws the descriptor only when there is one
      const cek = readFileSync(join(ctx.repoRoot, "src", "app", "verifikasi", "[token]", "page.tsx"), "utf8");
      c.expect(/\{row!\.predikat \? \(\s*<div>\s*<dt>\{s\("verifikasi\.predikat"\)\}<\/dt>\s*<dd>\{row!\.predikat\}<\/dd>/.test(cek)
        && !/row!\.predikat \?\? "—"/.test(cek), "the public check still draws a descriptor line (or a dash) when there is no descriptor");
      return c.verdict(
        `rendered from the real KartuSertifikat on screen and on the sheet, a certificate with no descriptor has no «${label}» line ` +
        "and no dash, and one with «Baik» or «Cukup» reads it; the public check draws the descriptor only when there is one (D-121(a))");
    },
  },
  {
    id: "PENUTUPAN-S01",
    run: async (ctx) => {
      const c = new Checks();
      const hal = readFileSync(join(ctx.repoRoot, "src", "app", "belajar", "[tugas]", "sertifikat", "page.tsx"), "utf8");
      const tanpaKomentar = hal.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
      c.expect(/const institution = detail\?\.institution_as_issued\s*\?\?/.test(tanpaKomentar),
        "the certificate page does not read the school's name from the certificate's seal first");
      c.expect(/detail\?\.course_title_as_issued/.test(tanpaKomentar) && /const course = sealedCourse \?\?/.test(tanpaKomentar),
        "the certificate page does not read the course from the certificate's seal first");
      c.expect((tanpaKomentar.match(/<KartuSertifikat cred=\{cred\} locale=\{bahasaSertifikat\}/g) ?? []).length === 2
        && /detail\?\.language_as_issued/.test(tanpaKomentar),
        "the certificate (screen and sheet) is not drawn in the language it was issued in");
      const kontrak = readFileSync(join(ctx.repoRoot, "src", "lib", "sertifikat-kontrak.ts"), "utf8");
      c.expect(["institution_as_issued", "course_subject_as_issued", "course_title_as_issued", "language_as_issued"].every((k) => kontrak.includes(`${k}: string | null;`)),
        "CertificateDetail does not carry the four sealed fields");
      return c.verdict("the learner's certificate page reads the school, the course and the language from the certificate's own seal " +
        "(my_certificate), on screen and on the A4 sheet; today's school and assignment are read only where the certificate predates the seal");
    },
  },
];
