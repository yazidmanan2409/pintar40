/**
 * BATCH 6 · B6K — W3.20 (card part) / CR-21 / J2.16: THE PINTAR DIGITAL CARD, FINAL (DAISY-24; frozen by D-120 Q16,
 * D-074 and its addendum, D-085 T4, D-086(e), D-160(a)). The design is Daisy's kartu-pintar ronde-2 (§K, §1, §5–§8,
 * §L). Each guard is RED on the base commit (3412075: the card was a plain data panel) and GREEN after.
 *
 *  B6K-GEOMETRI-01  the frozen geometry, read from the card's CSS: one millimetre unit (--kp-mm = the face's width over
 *                   85.6, exactly 1 mm in print, where each face is 85.6 mm wide); CR80 proportions (85.6 × 53.98, corners
 *                   3.18); the ochre line centred at 32 mm and 0.75 mm thick, one rule drawn on BOTH faces; the 6 mm text
 *                   margin for the name group, the chapter and the back's text; the name group 4.4 mm above the line and
 *                   the chapter 4.0 mm below it; the URL on the bottom margin; the type (name 12 pt/600, ID 9 pt Plex Mono
 *                   500, role 8 pt/600, school 8 pt/400, instruction 8 pt, URL 6.5 pt); everything inside the 3 mm safe
 *                   margin.
 *  B6K-WARNA-01     the palette by role family (D-074(1)): the six colours exactly, each family's colour reached only
 *                   through the front's data-keluarga; the ochre #C09C4F declared on the card alone; paper, ink, green and
 *                   tile are the app's tokens; a rendered card takes the colour of its FIRST role in the card's order.
 *  B6K-URUTAN-01    the order and the capacity (D-074(5), (6), (10), (11) and addendum (4)): alphabetical by the
 *                   Terminology v1 names whatever order the data came in, the colour the first role's; one school puts
 *                   the roles on one line and the school beneath; two schools put one role with its school per line; a
 *                   role with no school is never set under another role's school; more than two pairs draws every line
 *                   (no role left out, no type shrunk) and marks the unresolved exception.
 *  B6K-URUTAN-02    the card EMAIL uses the card's order (D-074(5); owner ruling of 4 Nov, D-164): templatKartu, given the
 *                   contexts in the database's seniority order (Dekan, Kepala departemen, Guru), lists its «Peran» rows
 *                   alphabetically — Dekan, Guru, Kepala departemen — at one school and at two; the email's order is the
 *                   Digital Card's (susunKartu) for every permutation; identitas.ts takes it from kartu-pintar.ts's one
 *                   ordering function and sorts nothing itself; every other row of the card email is unchanged.
 *  B6K-QR-01        the back: the PINTAR tile on --pintar-primary-soft (#E3EFEC) with modules in PINTAR green (#245F55),
 *                   the full 4-module quiet zone in the viewBox, the ID beneath it; the QR is exactly today's encoding of
 *                   tautanId; the instruction is Daisy's «Pindai untuk membuka halaman masuk PINTAR.» and the address
 *                   «pintarselalu.com» (the instruction from the copy table; the address, a proper noun, a constant).
 *  B6K-MEREK-01     the wordmark through one replaceable component: KartuPintar draws <MerekKartu />, which alone mounts
 *                   today's approved logo (MerekPintar) in the slot (6 mm, cap top 5.57 mm, cap height 2.9 mm, 18.0 mm
 *                   wide), sized by height only; the wordmark is never live text on the card.
 *  B6K-FOTO-01      no photograph (D-085 T4, D-086(e), D-159(d)): no card file names photo_path, a photo or an avatar; the
 *                   card takes only locale and the card's data; rendered, its only image is the wordmark slot's logo and
 *                   its only drawing the QR.
 *  B6K-STAF-01      staff only: the Digital Card is drawn only through IdentitasSaya, which only Akun saya and the
 *                   activation welcome draw; the learners' class-card sheet and the replacement card do not use it; the
 *                   card's database read still refuses anyone who is not staff.
 *  B6K-DATA-01      the data is unchanged: DataKartu is the same four fields, read by the same route from the same
 *                   function into the same shape; «Akun saya» and the welcome both draw the Digital Card, which shows the
 *                   name, the ID 4 + 4 as one text node, every context's role and school, and the QR of tautanId.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { Checks, type SelfTest } from "./lib";
import { t, type HleEvent } from "../src/lib/hle";

const baca = (root: string, p: string) => { try { return readFileSync(join(root, p), "utf8"); } catch { return ""; } };
/** Source without its comments, so a comment cannot satisfy a guard. */
const kode = (x: string) => x.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
const bersih = (x: string) => x.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const teks = (html: string) => bersih(html.replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
/** The declarations of the first rule whose selector is exactly `sel` (outside any @media unless `dalam` is given). */
function aturan(css: string, sel: string, dalam?: string): string {
  const sumber = dalam
    ? [...css.matchAll(new RegExp(`@media ${dalam.replace(/[()]/g, "\\$&")}\\s*\\{([\\s\\S]*?)\\n\\}`, "g"))].map((m) => m[1]).join("\n")
    : css;
  const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\n|\\})\\s*${esc}\\s*\\{([^}]*)\\}`).exec(sumber)?.[1]?.replace(/\s+/g, " ") ?? "";
}
const ada = (decl: string, re: RegExp) => re.test(decl);
const CSS = (root: string) => kode(baca(root, "src/app/experience.css"));
const KARTU_FILES = ["src/components/kartu/KartuPintar.tsx", "src/components/kartu/MerekKartu.tsx", "src/lib/kartu-pintar.ts", "src/components/aktifkan/IdentitasSaya.tsx"];

type Kartu = { nama: string; pintarId: string; tautanId: string; konteks: { peran: string; institusi: string | null }[] };
const KARTU: Kartu = {
  nama: "Ratna Dewi Kusumawardani", pintarId: "A14CD7ST", tautanId: "https://app.contoh.sch.id/id/A14CD7ST",
  konteks: [{ peran: "HEAD_OF_DEPARTMENT", institusi: "SMA Bukit Asri Kaliandra" }, { peran: "EDUCATOR", institusi: "SMP Cahaya Kaliandra" }],
};

/** Renders `KartuPintar` (and the two panels that draw it) in a child process, as the page draws them before any script. */
function gambar(root: string, kasus: { komponen: "KartuPintar" | "IdentitasSaya" | "Selamat"; props: Record<string, unknown> }[]): { html: string[]; galat: string } {
  const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
    "(async () => {" +
    '  const { createElement: h } = await import("react");' +
    '  const { renderToStaticMarkup } = await import("react-dom/server");' +
    '  const dari = async (f) => { const m = await import("file://" + process.cwd() + f); return m; };' +
    '  const K = await dari("/src/components/kartu/KartuPintar.tsx");' +
    '  const I = await dari("/src/components/aktifkan/IdentitasSaya.tsx");' +
    '  const L = await dari("/src/components/aktifkan/Langkah.tsx");' +
    "  const mod = { KartuPintar: K.default?.default ?? K.default, IdentitasSaya: I.default?.default ?? I.default, Selamat: L.Selamat ?? L.default?.Selamat };" +
    '  const { readFileSync } = await import("node:fs");' +
    '  const out = JSON.parse(readFileSync(0, "utf8")).map((k) => renderToStaticMarkup(h(mod[k.komponen], k.props)));' +
    "  process.stdout.write(JSON.stringify(out));" +
    "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
    cwd: root, encoding: "utf8", maxBuffer: 1 << 26, input: JSON.stringify(kasus),
    env: { ...process.env, NEXT_PUBLIC_APP_URL: "https://app.contoh.sch.id" },
  });
  let html: string[] = [];
  try { html = JSON.parse(anak.stdout); } catch { /* reported by the caller */ }
  return { html, galat: anak.status === 0 && html.length === kasus.length ? "" : (anak.stderr || "no output").split("\n").slice(0, 4).join(" ") };
}
function jalan(dir: string): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...jalan(p)); else out.push(p);
  }
  return out;
}

export const b6kTests: SelfTest[] = [
  {
    id: "B6K-GEOMETRI-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const css = CSS(repoRoot);
      const muka = aturan(css, ".pin-kd-muka");
      if (!c.expect(muka.length > 0, "there is no Digital Card face (.pin-kd-muka) in experience.css")) return c.verdict("");
      // one unit: the face's width over 85.6, exactly 1 mm when the face is printed 85.6 mm wide
      c.expect(ada(muka, /--kp-mm: calc\(100cqi \/ 85\.6\)/), "the card's millimetre is not the face's width over 85.6");
      c.expect(ada(aturan(css, ".pin-kd-wadah"), /container-type: inline-size/), "a face is not its own container, so --kp-mm cannot follow its width");
      c.expect(ada(aturan(css, ".pin-kd-wadah", "print"), /width: 85\.6mm/), "printed, a face is not 85.6 mm wide (CR80 at actual size)");
      // CR80
      c.expect(ada(muka, /aspect-ratio: 85\.6 \/ 53\.98/) && ada(muka, /border-radius: calc\(var\(--kp-mm\) \* 3\.18\)/),
        "the face is not CR80 (85.6 × 53.98 mm, corners 3.18 mm)");
      // the line at 32 mm, 0.75 mm, one rule on both faces
      const garis = aturan(css, ".pin-kd-garis");
      c.expect(ada(garis, /top: calc\(var\(--kp-mm\) \* \(32 - 0\.75 \/ 2\)\)/) && ada(garis, /height: calc\(var\(--kp-mm\) \* 0\.75\)/)
        && ada(garis, /left: 0; right: 0/), "the ochre line is not centred at 32 mm, 0.75 mm thick and full width");
      c.expect(!/\.pin-kd-(?:depan|belakang) \.pin-kd-garis/.test(css), "one face moves the line: it must be the same rule on both faces");
      c.expect(ada(aturan(css, ".pin-kd-bidang"), /top: calc\(var\(--kp-mm\) \* 32\)/), "the family colour does not start at the line (32 mm)");
      // margins and the rhythm round the line
      const tepi = /left: calc\(var\(--kp-mm\) \* 6\); width: calc\(var\(--kp-mm\) \* \(85\.6 - 2 \* 6\)\)/;
      for (const s of [".pin-kd-orang", ".pin-kd-bab", ".pin-kd-petunjuk", ".pin-kd-situs"]) {
        c.expect(ada(aturan(css, s), tepi), `${s} is not set on the 6 mm text margin`);
      }
      c.expect(ada(aturan(css, ".pin-kd-orang"), /bottom: calc\(var\(--kp-mm\) \* \(53\.98 - 32 \+ 0\.75 \/ 2 \+ 4\.4\)\)/),
        "the name and the ID do not stand 4.4 mm above the line");
      for (const s of [".pin-kd-bab", ".pin-kd-petunjuk"]) {
        c.expect(ada(aturan(css, s), /top: calc\(var\(--kp-mm\) \* \(32 \+ 0\.75 \/ 2 \+ 4\)\)/), `${s} does not hang 4.0 mm below the line`);
      }
      c.expect(ada(aturan(css, ".pin-kd-situs"), /bottom: calc\(var\(--kp-mm\) \* \(6 - 0\.4\)\)/), "the URL is not on the bottom text margin");
      // the type (§8)
      const pt = (n: number) => new RegExp(`font-size: calc\\(var\\(--kp-mm\\) \\* ${String(n).replace(".", "\\.")} \\* var\\(--kp-pt\\)\\)`);
      c.expect(/--kp-pt: 0\.352778;/.test(aturan(css, ".pin-kd")), "the card's point is not 0.352778 mm");
      const nama = aturan(css, ".pin-kd-nama"), id = aturan(css, ".pin-kd-id"), bab = aturan(css, ".pin-kd-bab-baris");
      // §8's leading and tracking are the card's tokens in globals.css, each with its frozen value
      const glob = kode(baca(repoRoot, "src/app/globals.css"));
      const TOKEN: Record<string, string> = {
        "--kartu-nama-lh": "1.15", "--kartu-nama-ls": "-0.01em", "--kartu-id-lh": "1.2", "--kartu-id-ls": "0.06em",
        "--kartu-bab-lh": "1.3", "--kartu-bab-ls": "0.005em", "--kartu-petunjuk-lh": "1.35", "--kartu-situs-lh": "1.3",
        "--kartu-situs-ls": "0.02em", "--kartu-kata": "0.06em",
      };
      for (const [k, v] of Object.entries(TOKEN)) c.expect(glob.includes(`${k}: ${v};`), `${k} is not ${v} (ronde-2 §8)`);
      c.expect(ada(nama, pt(12)) && ada(nama, /font-weight: 600/) && ada(nama, /line-height: var\(--kartu-nama-lh\)/) && ada(nama, /letter-spacing: var\(--kartu-nama-ls\)/), "the name is not 12 pt / 600 / 1.15 / −0.01 em");
      c.expect(ada(id, pt(9)) && ada(id, /font-family: var\(--font-mono\)/) && ada(id, /font-weight: 500/) && ada(id, /line-height: var\(--kartu-id-lh\)/) && ada(id, /letter-spacing: var\(--kartu-id-ls\)/) && ada(id, /white-space: nowrap/),
        "the PINTAR ID is not 9 pt IBM Plex Mono 500, tracked 0.06 em, unbroken");
      c.expect(ada(bab, pt(8)) && ada(bab, /font-weight: 400/) && ada(bab, /line-height: var\(--kartu-bab-lh\)/) && ada(bab, /word-spacing: var\(--kartu-kata\)/) && ada(aturan(css, ".pin-kd-peran"), /font-weight: 600/),
        "the role and school are not 8 pt (role 600, school 400)");
      c.expect(ada(aturan(css, ".pin-kd-petunjuk"), pt(8)) && ada(aturan(css, ".pin-kd-petunjuk"), /line-height: var\(--kartu-petunjuk-lh\)/), "the QR instruction is not 8 pt / 1.35");
      c.expect(ada(aturan(css, ".pin-kd-situs"), pt(6.5)) && ada(aturan(css, ".pin-kd-situs"), /line-height: var\(--kartu-situs-lh\); letter-spacing: var\(--kartu-situs-ls\)/), "the URL is not 6.5 pt / 1.3 / 0.02 em");
      // inside the 3 mm safe margin: the highest element is the tile at 3.6 mm, the lowest the URL on the 5.6 mm line
      c.expect(ada(aturan(css, ".pin-kd-ubin"), /top: calc\(var\(--kp-mm\) \* 3\.6\)/), "the tile's top is not 3.6 mm (inside the 3 mm safe margin)");
      c.note("geometry read from src/app/experience.css");
      return c.verdict("the card is CR80 in one millimetre unit (exactly 1 mm in print), the ochre line is centred at 32 mm on both faces at 0.75 mm, the text sits on the 6 mm margin with the name group 4.4 mm above and the chapter 4.0 mm below the line, and the type is §8's");
    },
  },
  {
    id: "B6K-WARNA-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const css = CSS(repoRoot);
      const akar = aturan(css, ".pin-kd");
      const PALET: Record<string, string> = { murid: "#725471", guru: "#446A4B", kadep: "#2E6973", dekan: "#515E83", "admin-sekolah": "#7A5648", "admin-platform": "#5E6062" };
      const glob = kode(baca(repoRoot, "src/app/globals.css"));
      for (const [k, w] of Object.entries(PALET)) {
        c.expect(glob.includes(`--kartu-${k}: ${w};`) && akar.includes(`--kp-${k}: var(--kartu-${k});`), `the ${k} family is not ${w} (D-074(1))`);
        c.expect(ada(aturan(css, `.pin-kd-depan[data-keluarga="${k}"]`), new RegExp(`--kp-warna: var\\(--kp-${k}\\)`)), `the front does not take the ${k} colour from its data-keluarga`);
      }
      c.expect(ada(aturan(css, ".pin-kd-bidang"), /background: var\(--kp-warna, transparent\)/), "the lower field does not take the family colour");
      c.expect(glob.includes("--kartu-emas: #C09C4F;") && akar.includes("--kp-emas: var(--kartu-emas);") && ada(aturan(css, ".pin-kd-garis"), /background: var\(--kp-emas\)/), "the line is not the ochre #C09C4F");
      // the card's values are read by the card alone: the ochre is not a UI accent (D-074(2))
      const lain = jalan(join(repoRoot, "src")).filter((f) => /\.(css|tsx?)$/.test(f) && /--kartu-|#C09C4F/i.test(kode(readFileSync(f, "utf8"))))
        .map((f) => relative(repoRoot, f).replace(/\\/g, "/")).sort();
      // RESTATED, D1 step 2 (DAISY-37 (3)(4), accepted 4 Nov): the identity emails are the card's language too, the card
      // block in the card email and the gold line on every identity email's card; an email reads no stylesheet, so the
      // frame writes the values, and they must be the tokens' own. Nowhere else.
      c.expect(JSON.stringify(lain) === JSON.stringify(["src/app/experience.css", "src/app/globals.css", "src/components/email/bingkai.ts"]), `the card's colours are read in ${lain.join(", ")}`);
      const bingkai = await import("../src/components/email/bingkai");
      for (const [k, w] of Object.entries(PALET).filter(([k]) => k !== "murid")) {
        c.expect(bingkai.WARNA_KELUARGA[k]?.toUpperCase() === w.toUpperCase(), `the card email's ${k} band is ${bingkai.WARNA_KELUARGA[k]}, not the family's ${w}`);
      }
      c.expect((bingkai.WARNA.terang as Record<string, string>).emas === "#C09C4F", "the email's gold line is not the card's ochre");
      c.expect([...css.matchAll(/var\(--kartu-(?:emas|murid|guru|kadep|dekan|admin-sekolah|admin-platform)\)/g)].length === 7
        && (glob.match(/#C09C4F/gi) ?? []).length === 1 && !/#C09C4F/i.test(css), "the ochre or a family colour is used outside the card's own rule");
      c.expect(akar.includes("--kp-kertas: var(--surface-0);") && akar.includes("--kp-tinta: var(--ink-1);") && akar.includes("--kp-hijau: var(--pintar-primary);") && akar.includes("--kp-ubin: var(--pintar-primary-soft);"),
        "the paper, ink, green and tile are not the app's own tokens");
      // the colour of the FIRST role in the card's order, rendered: Kepala departemen + Guru → Guru; Dekan + Guru → Dekan; Admin platform alone
      const kasus = [
        { komponen: "KartuPintar" as const, props: { locale: "id", kartu: KARTU } },
        { komponen: "KartuPintar" as const, props: { locale: "en", kartu: { ...KARTU, konteks: [{ peran: "EDUCATOR", institusi: "Sekolah Cendekia" }, { peran: "DEAN", institusi: "Sekolah Cendekia" }] } } },
        { komponen: "KartuPintar" as const, props: { locale: "id", kartu: { ...KARTU, konteks: [{ peran: "SYSTEM_ADMIN", institusi: null }] } } },
        { komponen: "KartuPintar" as const, props: { locale: "id", kartu: { ...KARTU, konteks: [{ peran: "INSTITUTION_ADMIN", institusi: "SMA Contoh" }] } } },
      ];
      const { html, galat } = gambar(repoRoot, kasus);
      if (!c.expect(galat === "", `the card could not be rendered: ${galat}`)) return c.verdict("");
      const keluarga = (x: string) => /class="pin-kd-muka pin-kd-depan"[^>]*data-keluarga="([^"]+)"/.exec(x)?.[1];
      c.expect(keluarga(html[0]) === "guru", `Kepala departemen + Guru took ${keluarga(html[0])}, not Guru (first alphabetically)`);
      c.expect(keluarga(html[1]) === "dekan", `Dekan + Guru took ${keluarga(html[1])}, not Dekan`);
      c.expect(keluarga(html[2]) === "admin-platform" && keluarga(html[3]) === "admin-sekolah", "the platform and the school administrator do not take their own families");
      return c.verdict("the six family colours are D-074(1)'s, reached through the front's data-keluarga; the ochre line is #C09C4F and declared on the card alone; the paper, ink, green and tile are the app's tokens; a card takes the colour of its first role alphabetically");
    },
  },
  {
    id: "B6K-URUTAN-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      let m: typeof import("../src/lib/kartu-pintar") | null = null;
      try { m = await import("../src/lib/kartu-pintar"); } catch { /* reported */ }
      if (!c.expect(m !== null, "there is no card presentation module (src/lib/kartu-pintar.ts)") || !m) return c.verdict("");
      const N = (p: string) => t(`role.${p}` as HleEvent, "staff", { locale: "id" });
      // alphabetical by the Terminology v1 names, whatever the data's order (the database lists by seniority)
      const semua = ["SYSTEM_ADMIN", "INSTITUTION_ADMIN", "DEAN", "HEAD_OF_DEPARTMENT", "EDUCATOR"].map((p) => ({ peran: p as never, institusi: "SMA Satu" }));
      const urut = m.susunKartu(semua).urut.map((k) => N(k.peran));
      c.expect(JSON.stringify(urut) === JSON.stringify(["Admin platform", "Admin sekolah", "Dekan", "Guru", "Kepala departemen"]), `the roles are in the order ${urut.join(", ")}`);
      const balik = m.susunKartu([...semua].reverse()).urut.map((k) => N(k.peran));
      c.expect(JSON.stringify(balik) === JSON.stringify(urut), "the card's order follows the data's order");
      // the colour: the first role's family
      const s1 = m.susunKartu([{ peran: "HEAD_OF_DEPARTMENT", institusi: "SMA Satu" }, { peran: "EDUCATOR", institusi: "SMA Satu" }]);
      c.expect(s1.keluarga === "guru", `«Guru · Kepala departemen» takes ${s1.keluarga}`);
      // one school: the roles on one line, the school beneath
      c.expect(JSON.stringify(s1.baris) === JSON.stringify([{ peran: "Guru · Kepala departemen", sekolah: null }, { peran: null, sekolah: "SMA Satu" }]),
        `one school is not «roles» / «school»: ${JSON.stringify(s1.baris)}`);
      // two schools: one role with its school per line
      const s2 = m.susunKartu([{ peran: "HEAD_OF_DEPARTMENT", institusi: "SMA Bukit Asri Kaliandra" }, { peran: "EDUCATOR", institusi: "SMP Cahaya Kaliandra" }]);
      c.expect(JSON.stringify(s2.baris) === JSON.stringify([{ peran: "Guru", sekolah: "SMP Cahaya Kaliandra" }, { peran: "Kepala departemen", sekolah: "SMA Bukit Asri Kaliandra" }]) && !s2.lebihDariDua,
        `two schools are not one role with its school per line: ${JSON.stringify(s2.baris)}`);
      // a role with no school beside a role at a school: never under that school
      const s3 = m.susunKartu([{ peran: "EDUCATOR", institusi: "SMA Satu" }, { peran: "SYSTEM_ADMIN", institusi: null }]);
      c.expect(JSON.stringify(s3.baris) === JSON.stringify([{ peran: "Admin platform", sekolah: null }, { peran: "Guru", sekolah: "SMA Satu" }]) && s3.keluarga === "admin-platform",
        `the platform role is set under a school: ${JSON.stringify(s3.baris)}`);
      const s4 = m.susunKartu([{ peran: "SYSTEM_ADMIN", institusi: null }]);
      c.expect(JSON.stringify(s4.baris) === JSON.stringify([{ peran: "Admin platform", sekolah: null }]), "Admin platform has a second line");
      // capacity: two pairs proven; a third is the unresolved exception, every line still drawn
      c.expect(m.KAPASITAS_PASANGAN === 2, "the proven capacity is not two pairs");
      c.expect(!/overflow/.test(aturan(CSS(repoRoot), ".pin-kd-muka")), "the face clips what outgrows it, so a line could be silently cut");
      const tiga = [{ peran: "EDUCATOR", institusi: "A" }, { peran: "INSTITUTION_ADMIN", institusi: "B" }, { peran: "DEAN", institusi: "C" }];
      const s5 = m.susunKartu(tiga as never);
      c.expect(s5.lebihDariDua && s5.baris.length === 3 && s5.pasangan === 3, "three pairs are not all drawn and marked as the exception");
      const { html, galat } = gambar(repoRoot, [{ komponen: "KartuPintar", props: { locale: "id", kartu: { ...KARTU, konteks: tiga } } }, { komponen: "KartuPintar", props: { locale: "id", kartu: KARTU } }]);
      if (c.expect(galat === "", `the card could not be rendered: ${galat}`)) {
        const x = teks(html[0]);
        c.expect(x.includes("Admin sekolah · B") && x.includes("Dekan · C") && x.includes("Guru · A"), `a role is left out of three pairs: ${x}`);
        c.expect(/data-pengecualian="lebih-dari-dua"/.test(html[0]) && !/data-pengecualian/.test(html[1]), "the exception is not marked on three pairs only");
        const baris = [...html[1].matchAll(/<li class="pin-kd-bab-baris">([\s\S]*?)<\/li>/g)].map((b) => teks(b[1]));
        c.expect(JSON.stringify(baris) === JSON.stringify(["Guru · SMP Cahaya Kaliandra", "Kepala departemen · SMA Bukit Asri Kaliandra"]), `the rendered lines are ${JSON.stringify(baris)}`);
      }
      return c.verdict("the roles are alphabetical by the Terminology v1 names whatever the data's order, the colour is the first role's, one school sets the roles on one line with the school beneath, two schools one role with its school per line, a role with no school is never under another's school, and more than two pairs draws every line and marks the unresolved exception");
    },
  },
  {
    id: "B6K-QR-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const css = CSS(repoRoot);
      const glob = kode(baca(repoRoot, "src/app/globals.css"));
      c.expect(/--pintar-primary-soft: #E3EFEC;/.test(glob) && /--pintar-primary: #245F55;/.test(glob), "the tile and module tokens are not #E3EFEC and #245F55");
      const ubin = aturan(css, ".pin-kd-ubin");
      c.expect(ada(ubin, /background: var\(--kp-ubin\)/) && ada(ubin, /color: var\(--kp-hijau\)/), "the tile is not the soft green with green modules");
      c.expect(ada(ubin, /left: calc\(var\(--kp-mm\) \* \(85\.6 - 22\.125\) \/ 2\)/) && ada(ubin, /width: calc\(var\(--kp-mm\) \* 22\.125\)/) && ada(ubin, /height: calc\(var\(--kp-mm\) \* 26\.025\)/)
        && ada(ubin, /border-radius: calc\(var\(--kp-mm\) \* 1\.6\)/), "the tile is not 22.13 × 26.02 mm, centred, corners 1.6 mm");
      c.expect(ada(aturan(css, ".pin-kd-id-ubin"), /top: calc\(var\(--kp-mm\) \* \(22\.125 \+ 0\.15\)\)/), "the tile's ID is not beneath the quiet zone");
      let qr: typeof import("../src/lib/qr") | null = null;
      try { qr = await import("../src/lib/qr"); } catch { /* reported */ }
      const { html, galat } = gambar(repoRoot, [{ komponen: "KartuPintar", props: { locale: "en", kartu: KARTU } }]);
      if (!c.expect(galat === "" && qr !== null, `the card could not be rendered: ${galat}`) || !qr) return c.verdict("");
      const x = html[0];
      const { path, size } = qr.qrSvgPath(qr.qrMatrix(KARTU.tautanId));
      const svg = /<svg viewBox="([^"]+)" role="img" aria-label="([^"]+)"[^>]*><path d="([^"]+)" fill="currentColor"(?:\/>|><\/path>)<\/svg>/.exec(x);
      c.expect(svg !== null, "the back has no labelled QR drawing in the module colour");
      if (svg) {
        c.expect(svg[1] === `-4 -4 ${size + 8} ${size + 8}`, `the QR's viewBox ${svg[1]} is not the symbol with its 4-module quiet zone`);
        c.expect(svg[3] === path, "the QR does not encode tautanId exactly as today");
        c.expect(bersih(svg[2]) === t("akun.qr", "staff", { locale: "en" }), "the QR is not named in the page's language");
      }
      c.expect(/<div class="pin-kd-ubin">[\s\S]*<p class="pin-kd-id pin-kd-id-ubin" aria-hidden="true">A14C D7ST<\/p><\/div>/.test(x), "the tile does not carry the ID 4 + 4 beneath the symbol");
      c.expect(t("akun.kartu.petunjuk", "staff", { locale: "id" }) === "Pindai untuk membuka halaman masuk PINTAR." && x.includes(">Pindai untuk membuka halaman masuk PINTAR.<"),
        "the back does not say Daisy's «Pindai untuk membuka halaman masuk PINTAR.»");
      c.expect(x.includes('<p class="pin-kd-situs">pintarselalu.com</p>'), "the back does not carry the address «pintarselalu.com»");
      const src = kode(baca(repoRoot, "src/components/kartu/KartuPintar.tsx"));
      c.expect(/muka\("akun\.kartu\.petunjuk"\)/.test(src) && /const RANAH = "pintarselalu\.com";/.test(src) && !baca(repoRoot, "src/lib/hle.ts").includes("pintarselalu.com"),
        "the instruction is not from the copy table, or the address (a proper noun) passes through it");
      return c.verdict("the back is the PINTAR tile (#E3EFEC, green #245F55 modules, 22.13 × 26.02 mm, the full quiet zone, the ID beneath), the QR is today's encoding of tautanId, the instruction is Daisy's, from the copy table, and the address a constant that never passes through it");
    },
  },
  {
    id: "B6K-MEREK-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const kartu = kode(baca(repoRoot, "src/components/kartu/KartuPintar.tsx"));
      const merek = kode(baca(repoRoot, "src/components/kartu/MerekKartu.tsx"));
      if (!c.expect(kartu.length > 0 && merek.length > 0, "there is no Digital Card component or wordmark slot (src/components/kartu/)")) return c.verdict("");
      c.expect((kartu.match(/<MerekKartu \/>/g) ?? []).length === 1 && /import MerekKartu from "\.\/MerekKartu";/.test(kartu), "the card does not draw the wordmark through MerekKartu, once");
      c.expect(!/MerekPintar|<img|brand\//.test(kartu), "the card names the logo itself instead of the slot component");
      c.expect(/<span className="pin-kd-merek">\s*<MerekPintar \/>\s*<\/span>/.test(merek), "the slot does not hold the wordmark (MerekPintar)");
      const mounts = jalan(join(repoRoot, "src")).filter((f) => /\.tsx$/.test(f) && /<MerekKartu/.test(kode(readFileSync(f, "utf8")))).map((f) => relative(repoRoot, f));
      c.expect(mounts.length === 1, `the wordmark slot is mounted in ${mounts.join(", ")}`);
      const css = CSS(repoRoot);
      const slot = aturan(css, ".pin-kd-merek");
      c.expect(ada(slot, /left: calc\(var\(--kp-mm\) \* 6\); top: calc\(var\(--kp-mm\) \* 5\.57\)/) && ada(slot, /width: calc\(var\(--kp-mm\) \* 18\); height: calc\(var\(--kp-mm\) \* 2\.9\)/)
        && 3.99 * (0.6479 + 0.2808 + 0.7622 + 0.6675 + 0.7466 + 0.6567 + 5 * 0.14) <= 18,
        "the slot is not the wordmark's (6 mm, cap top 5.57 mm, 18.0 × 2.9 mm; RESTATED FOR Daisy's H28, 6 Nov: the Inter word, 17.1 mm of ink, did not fit 16.4 mm)");
      // RESTATED FOR D-192 (owner, 5 Nov: a text-only PINTAR wordmark replaces the supplied logo on every surface, the
      // Digital Card named): the slot holds the text «PINTAR» at the slot's cap height (2.9 mm / Arial's 0.716 = 4.05 mm),
      // its cap top drawn to the slot's top, never given a width; no image.
      // RESTATED FOR D-193 (owner, 7 Nov: Inter): the same cap height from Inter's 0.7275 (2.9 / 0.7275 = 3.99 mm),
      // its cap top 0.14 of the size below the line's top at line-height 1
      const mk = aturan(css, ".pin-kd-merek .pin-merek");
      c.expect(ada(mk, /font-size: calc\(var\(--kp-mm\) \* 3\.99\)/) && ada(mk, /margin-top: -0\.14em/) && !/width/.test(mk),
        `the wordmark in the slot is not set at the slot's cap height: ${mk}`);
      const { html, galat } = gambar(repoRoot, [{ komponen: "KartuPintar", props: { locale: "id", kartu: KARTU } }]);
      if (c.expect(galat === "", `the card could not be rendered: ${galat}`)) {
        c.expect(/<span class="pin-kd-merek"><span class="pin-merek">PINTAR<\/span><\/span>/.test(html[0]), "the rendered slot does not hold the text wordmark «PINTAR»");
        c.expect(!/<img\b|\/brand\//.test(html[0]), "the card still draws the retired logo image");
      }
      return c.verdict("the card's wordmark is one replaceable component (MerekKartu), mounted once, holding the text wordmark «PINTAR» (D-192) in the wordmark's exact slot (6 mm, cap top 5.57 mm, 18.0 × 2.9 mm) at its cap height, never given a width; no image");
    },
  },
  {
    id: "B6K-FOTO-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      for (const f of [...KARTU_FILES, "src/app/api/akun/kartu/route.ts"]) {
        const x = baca(repoRoot, f);
        if (!c.expect(x.length > 0, `${f} is missing`)) continue;
        c.expect(!/photo|foto|avatar|read-url|signedUrl|<Image\b/i.test(kode(x)), `${f} reaches a photograph`);
      }
      const db = kode(baca(repoRoot, "src/app/api/_email/identitas.ts"));
      const fn = /export function kartuDariDb[\s\S]*?\n\}/.exec(db)?.[0] ?? "";
      c.expect(fn.length > 0 && !/photo|foto/i.test(fn), "the card's data reader reaches a photograph");
      const src = kode(baca(repoRoot, "src/components/kartu/KartuPintar.tsx"));
      c.expect(/export default function KartuPintar\(\{ locale, kartu \}: \{ locale: Locale; kartu: DataKartu \}\)/.test(src), "the card takes more than the page's language and the card's data");
      const { html, galat } = gambar(repoRoot, [{ komponen: "KartuPintar", props: { locale: "id", kartu: { ...KARTU, photo_path: "profile/x/foto.jpg", urlFoto: "/api/assets/read-url?x" } } }]);
      if (c.expect(galat === "", `the card could not be rendered: ${galat}`)) {
        const x = html[0];
        const img = [...x.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
        // RESTATED FOR D-192: the wordmark is text, so the card draws no image at all
        c.expect(img.length === 0, `the card draws an image: ${img.join(" ")}`);
        c.expect((x.match(/<svg\b/g) ?? []).length === 1 && !/<image\b|<picture\b|background-image|url\(/.test(x), "the card draws something other than the QR");
        c.expect(!/foto|profile\//.test(x), "a photograph planted in the data reaches the card");
      }
      return c.verdict("no card file reaches a photograph, the card takes only the page's language and the card's data, and rendered (even with a photograph planted in its data) it draws no image (its wordmark is text, D-192) and its only drawing is the QR");
    },
  },
  {
    id: "B6K-STAF-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const src = jalan(join(repoRoot, "src")).filter((f) => /\.(tsx?|mts)$/.test(f));
      const pakai = (re: RegExp) => src.filter((f) => re.test(kode(readFileSync(f, "utf8")))).map((f) => relative(repoRoot, f).replace(/\\/g, "/")).sort();
      const kartu = pakai(/from "@\/components\/kartu\/KartuPintar"|from "\.\/KartuPintar"/);
      c.expect(JSON.stringify(kartu) === JSON.stringify(["src/components/aktifkan/IdentitasSaya.tsx"]), `the Digital Card is drawn from ${kartu.join(", ") || "nowhere"}`);
      const panel = pakai(/import IdentitasSaya from/);
      c.expect(JSON.stringify(panel) === JSON.stringify(["src/components/aktifkan/AkunSaya.tsx", "src/components/aktifkan/Langkah.tsx"]), `IdentitasSaya is drawn from ${panel.join(", ")}`);
      for (const f of ["src/components/aktivasi/LembarKartu.tsx", "src/components/aktivasi/KartuUlang.tsx"]) {
        c.expect(!/KartuPintar|pin-kd-|IdentitasSaya/.test(kode(baca(repoRoot, f))), `${f} (a learner's class card) uses the staff Digital Card`);
      }
      const mig = baca(repoRoot, "supabase/migrations/20261112100000_a_person_activates_their_own_account.sql");
      c.expect(/create or replace function public\.my_identity_card\(\)[\s\S]*?if not public\.adalah_staf\(v_person\) then\s*raise exception using errcode = 'PR040', detail = 'IDENTITY_NOT_ELIGIBLE'/.test(mig),
        "the card's read does not refuse someone who is not staff");
      const langkah = kode(baca(repoRoot, "src/components/aktifkan/Langkah.tsx"));
      c.expect(/\{kartu \? <IdentitasSaya locale=\{locale\} kartu=\{kartu\} \/> : null\}/.test(langkah), "the welcome draws the card without the staff card's data");
      return c.verdict("the Digital Card is drawn only through IdentitasSaya, which only Akun saya and the activation welcome draw; the learners' class-card sheet and the replacement card do not use it; my_identity_card refuses anyone who is not staff");
    },
  },
  {
    id: "B6K-DATA-01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const kontrak = kode(baca(repoRoot, "src/lib/aktivasi-kontrak.ts"));
      c.expect(/export type DataKartu = \{\s*nama: string;\s*pintarId: string;\s*tautanId: string;\s*konteks: \{ peran: PeranKartu; institusi: string \| null \}\[\];\s*\};/.test(kontrak),
        "DataKartu is not the card's four fields");
      const rute = kode(baca(repoRoot, "src/app/api/akun/kartu/route.ts"));
      c.expect(/w\.supabase\.rpc\("my_identity_card"\)/.test(rute) && /kartuDariDb\(data, appUrl\(\)\)/.test(rute), "the card's data is not read from my_identity_card as before");
      const db = kode(baca(repoRoot, "src/app/api/_email/identitas.ts"));
      c.expect(/return \{ nama: o\.name, pintarId: o\.pintar_id, tautanId: `\$\{asal\}\/id\/\$\{o\.pintar_id\}`, konteks \};/.test(db), "the card's data is not shaped as before (the QR target changed?)");
      const panel = kode(baca(repoRoot, "src/components/aktifkan/IdentitasSaya.tsx"));
      c.expect(/<KartuPintar locale=\{locale\} kartu=\{kartu\} \/>/.test(panel), "Akun saya and the welcome do not draw the Digital Card");
      const { html, galat } = gambar(repoRoot, [
        { komponen: "IdentitasSaya", props: { locale: "id", kartu: KARTU } },
        { komponen: "Selamat", props: { locale: "en", kartu: KARTU, status: "TERKIRIM", tujuan: "/mengajar" } },
      ]);
      if (c.expect(galat === "", `the panels could not be rendered: ${galat}`)) {
        for (const [i, n] of [[0, "Akun saya's panel"], [1, "the welcome"]] as const) {
          const x = html[i], kata = teks(x);
          c.expect(/class="pin-kd"/.test(x) && /pin-kd-depan/.test(x) && /pin-kd-belakang/.test(x), `${n} does not draw both faces of the Digital Card`);
          c.expect(x.includes('<p class="pin-kd-nama">Ratna Dewi Kusumawardani</p>') && x.includes('<p class="pin-kd-id pin-idn-id">A14C D7ST</p>'), `${n} does not show the name and the ID 4 + 4 as one text node`);
          c.expect(kata.includes("Guru · SMP Cahaya Kaliandra") && kata.includes("Kepala departemen · SMA Bukit Asri Kaliandra"), `${n} does not show every role with its school: ${kata}`);
          c.expect(/lang="id"/.test(x), `${n}: the face is not marked as Bahasa Indonesia`);
        }
        c.expect(teks(html[0]).includes(t("akun.id_arti", "staff", { locale: "id" })), "the panel lost the line of what the PINTAR ID means");
      }
      return c.verdict("DataKartu is the same four fields, read by the same route from my_identity_card into the same shape (the QR target unchanged); Akun saya and the welcome both draw the two faces with the name, the ID 4 + 4 as one text node and every role with its school");
    },
  },
  {
    id: "B6K-URUTAN-02",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const kp = await import("../src/lib/kartu-pintar");
      const { templatKartu } = await import("../src/components/email/identitas");
      const K = { asal: "https://app.pintarselalu.com", staging: false };
      // RESTATED, D1 step 2 (DAISY-37 (4); D-164, P1): the card email draws the PINTAR Card as live text from the Digital
      // Card's own lines (susunKartu → baris), in its block's rows, no longer as label rows of its own; the order rule
      // is unchanged and now holds the email to the card's lines as well as its order
      const teksBaris = (x: string) => x.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
      const peranEmail = (konteks: { peran: string; institusi: string | null }[]) => {
        const e = templatKartu({ nama: "Nadia Putri", pintarId: "A14CD7ST", tautanId: "https://app.pintarselalu.com/id/A14CD7ST", konteks: konteks as never, tautanAkun: "https://app.pintarselalu.com/akun" }, K);
        return { e, baris: [...e.html.matchAll(/<p class="pin-kartu-baris"[^>]*>([\s\S]*?)<\/p>/g)].map((m) => teksBaris(m[1])) };
      };
      const N = (p: string) => t(`role.${p}` as HleEvent, "staff", { locale: "id" });
      // the database's order (my_identity_card: seniority), one school: the roles on one line, alphabetical, the school beneath
      const satu = [{ peran: "DEAN", institusi: "SMA Satu" }, { peran: "HEAD_OF_DEPARTMENT", institusi: "SMA Satu" }, { peran: "EDUCATOR", institusi: "SMA Satu" }];
      const r1 = peranEmail(satu).baris;
      c.expect(JSON.stringify(r1) === JSON.stringify([`${N("DEAN")} · ${N("EDUCATOR")} · ${N("HEAD_OF_DEPARTMENT")}`, "SMA Satu"]),
        `one school: the card email lists ${r1.join(" | ") || "no role rows"}; want Dekan · Guru · Kepala departemen, then the school (D-074(5)(6))`);
      // two schools, the same roles: one line per role and school, alphabetical by role
      const dua = [{ peran: "DEAN", institusi: "SMA Dua" }, { peran: "HEAD_OF_DEPARTMENT", institusi: "SMA Satu" }, { peran: "EDUCATOR", institusi: "SMA Satu" }];
      const r2 = peranEmail(dua).baris;
      c.expect(JSON.stringify(r2) === JSON.stringify(["Dekan · SMA Dua", "Guru · SMA Satu", "Kepala departemen · SMA Satu"]),
        `two schools: the card email lists ${r2.join(" | ") || "no role rows"}`);
      // the platform role (no school) beside school roles keeps its own line, in the card's order
      const campur = [{ peran: "SYSTEM_ADMIN", institusi: null }, { peran: "EDUCATOR", institusi: "SMA Satu" }, { peran: "DEAN", institusi: "SMA Satu" }];
      // every permutation: the email's lines are the Digital Card's, in its order
      const perm = <T,>(xs: T[]): T[][] => xs.length <= 1 ? [xs] : xs.flatMap((x, i) => perm([...xs.slice(0, i), ...xs.slice(i + 1)]).map((r) => [x, ...r]));
      for (const set of [satu, dua, campur]) for (const p of perm(set)) {
        const kartu = kp.susunKartu(p as never).baris.map((b) => [b.peran, b.sekolah].filter(Boolean).join(" · "));
        const email = peranEmail(p).baris;
        c.expect(JSON.stringify(email) === JSON.stringify(kartu), `from ${p.map((k) => k.peran).join(",")}: the email lists ${email.join(" | ")}, the card ${kartu.join(" | ")}`);
      }
      // one ordering function: identitas.ts takes the card's (susunKartu, through urutKonteksKartu), and sorts nothing itself
      const src = kode(baca(repoRoot, "src/components/email/identitas.ts"));
      c.expect(/from "@\/lib\/kartu-pintar"/.test(src) && /susunKartu\(data\.konteks\)/.test(src), "the card email does not take its lines and order from kartu-pintar.ts's susunKartu");
      c.expect(!/\.sort\(|Intl\.Collator|localeCompare/.test(src), "identitas.ts sorts on its own (a second ordering algorithm)");
      const kpSrc = kode(baca(repoRoot, "src/lib/kartu-pintar.ts"));
      c.expect((kpSrc.match(/\.sort\(/g) ?? []).length === 1 && /urutKonteksKartu\(konteks\)/.test(kpSrc), "kartu-pintar.ts does not keep exactly one ordering, used by susunKartu");
      // the rest of the card email is unchanged: name, the ID 4 + 4, the way to Akun saya, the number of role lines
      const { e } = peranEmail(satu);
      c.expect(e.teks.includes("Nadia Putri") && e.teks.includes("A14C D7ST") && e.teks.includes("https://app.pintarselalu.com/akun"), "the card email's name, ID or Akun saya link changed");
      c.expect(peranEmail(campur).baris.length === kp.susunKartu(campur as never).baris.length, "a role line was dropped or added");
      return c.verdict("the card email lists the roles in the Digital Card's alphabetical order, from one ordering function");
    },
  },
];
