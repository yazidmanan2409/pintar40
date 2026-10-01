/**
 * EDU-J23, EDU-J24 -- WHO HAS NOT STARTED, AND WHO STARTED AND DID NOT HAND IN, BY NAME.
 *
 * «Lihat bukti» counts three states (W8), but the page with the names, /siapa,
 * had two lists: a learner halfway through and one who never opened the test
 * were both «Belum mengumpulkan», and the counts on «Lihat bukti» led nowhere
 * (journey cross-check EDU-J23: PARTIAL). This executes the split the page now
 * reads, renders «Keadaan hari ini» with its way to the names, and reads the
 * page's source for the three lists.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { t } from "../src/lib/hle";
import { Checks, type SelfTest } from "./lib";

const ROSTER = [
  { id: "ani", nama: "Ani" }, { id: "budi", nama: "Budi" }, { id: "citra", nama: "Citra" },
  { id: "dodi", nama: "Dodi" }, { id: "eka", nama: "Eka" }, { id: "fajar", nama: "Fajar" },
];
const SESI = [
  { person_id: "ani", status: "FINALIZED" },
  { person_id: "budi", status: "IN_PROGRESS" },
  { person_id: "citra", status: "EXPIRED" },     // ran out before handing in: started, not handed in
  { person_id: "citra", status: "SUBMITTED" },   // ... then handed in a second session: handed in, once
  { person_id: "dodi", status: "PAUSED" },
  { person_id: "eka", status: "CREATED" },        // opened, nothing answered: started
  { person_id: "luar", status: "SUBMITTED" },     // not in this class's roster: named nowhere
];

export const edu23Tests: SelfTest[] = [
  {
    id: "EDU23-K01",
    run: async (ctx) => {
      const c = new Checks();
      const ajar = (await import("../src/lib/pengajar")) as Record<string, unknown> as {
        pisahSiapa?: (r: typeof ROSTER, s: typeof SESI) => { sudah: typeof ROSTER; sedang: typeof ROSTER; belum: typeof ROSTER };
      };
      const pisah = ajar.pisahSiapa;
      if (!c.expect(typeof pisah === "function", "there is no three-way split of a class for one test (pisahSiapa)") || !pisah) return c.verdict("");
      const p = pisah(ROSTER, SESI);
      const nama = (x: typeof ROSTER) => x.map((m) => m.nama);
      c.expect(JSON.stringify(nama(p.sudah)) === JSON.stringify(["Ani", "Citra"]), `handed in: ${JSON.stringify(nama(p.sudah))}; expected Ani, Citra`);
      c.expect(JSON.stringify(nama(p.sedang)) === JSON.stringify(["Budi", "Dodi", "Eka"]),
        `started, not handed in: ${JSON.stringify(nama(p.sedang))}; expected Budi, Dodi, Eka (in progress, paused, opened)`);
      c.expect(JSON.stringify(nama(p.belum)) === JSON.stringify(["Fajar"]), `not started: ${JSON.stringify(nama(p.belum))}; expected Fajar alone`);
      c.expect(p.sudah.length + p.sedang.length + p.belum.length === ROSTER.length, "a learner is in no list, or in two");
      const kosong = pisah(ROSTER, []);
      c.expect(kosong.belum.length === ROSTER.length && kosong.sedang.length === 0, "with no session at all, not everyone reads as not started");

      // «Keadaan hari ini», rendered: each test's counts lead to that test's names
      const asesmen = [
        { id: "pre-1", judul: "Pemetaan awal", keadaan: "OPEN", mode: "PRE_TEST", ditutup: null, mengumpulkan: 2, mulai: 5 },
        { id: "post-1", judul: "Cek penguasaan", keadaan: "OPEN", mode: "POST_TEST", ditutup: null, mengumpulkan: 0, mulai: 1 },
      ];
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
        "(async () => {" +
        '  const { createElement: h } = await import("react");' +
        '  const { renderToStaticMarkup } = await import("react-dom/server");' +
        '  const m = await import("file://" + process.cwd() + "/src/components/bukti/KeadaanHariIni.tsx");' +
        "  const K = m.default?.default ?? m.default;" +
        "  const k = JSON.parse(process.env.EDU23_KASUS);" +
        "  process.stdout.write(JSON.stringify(['id', 'en'].map((locale) => renderToStaticMarkup(h(K, { ...k, locale, kelas: 'k1a' })))));" +
        "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
        cwd: ctx.repoRoot, encoding: "utf8", env: { ...process.env, EDU23_KASUS: JSON.stringify({ asesmen, murid: 6 }) },
      });
      let html: string[] = [];
      try { html = JSON.parse(anak.stdout); } catch { /* reported below */ }
      if (c.expect(anak.status === 0 && html.length === 2, `«Keadaan hari ini» could not be rendered: ${(anak.stderr || "").split("\n").slice(0, 3).join(" ")}`)) {
        for (const [i, locale] of (["id", "en"] as const).entries()) {
          const tautan = [...html[i].matchAll(/<a href="([^"]+)">([^<]*)<\/a>/g)].map((m) => [m[1].replace(/&amp;/g, "&"), m[2].replace(/&#x27;/g, "'")]);
          c.expect(JSON.stringify(tautan) === JSON.stringify([
            ["/mengajar/k1a/siapa?penugasan=pre-1", t("mengajar.bukti.siapa", "educator", { locale })],
            ["/mengajar/k1a/siapa?penugasan=post-1", t("mengajar.bukti.siapa", "educator", { locale })],
          ]), `(${locale}) the tests' counts lead to ${JSON.stringify(tautan)}; expected each test to its own names on /siapa`);
        }
      }

      // the names under the labels the counts had
      for (const locale of ["id", "en"] as const) {
        const k = (x: Parameters<typeof t>[0]) => t(x, "educator", { locale });
        c.expect(k("mengajar.siapa.sedang") === k("mengajar.bukti.mulai") && k("mengajar.siapa.belum") === k("mengajar.bukti.belum"),
          `(${locale}) /siapa's headings are not the words «Lihat bukti» counts under`);
      }

      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      const page = buang(readFileSync(join(ctx.repoRoot, "src", "app", "mengajar", "[kelas]", "siapa", "page.tsx"), "utf8"));
      const urut = ["sudah", "sedang", "belum"].map((x) => page.indexOf(`<DaftarMurid murid={${x}} locale={locale} kelas={id} />`));
      c.expect(/const \{ sudah, sedang, belum \} = await ajar\.siapa\(tugasId, fakta\.murid\);/.test(page) && urut.every((x, i) => x > 0 && (i === 0 || x > urut[i - 1])),
        "/siapa does not draw the three lists, handed in, started, not started, in that order");
      const lib = buang(readFileSync(join(ctx.repoRoot, "src", "lib", "pengajar.ts"), "utf8"));
      c.expect(/return pisahSiapa\(roster, rows</.test(lib), "ajar.siapa does not split by pisahSiapa");
      c.expect(/<KeadaanHariIni asesmen=\{asesmen\} murid=\{fakta\.murid\.length\} locale=\{locale\} kelas=\{id\} \/>/
        .test(buang(readFileSync(join(ctx.repoRoot, "src", "app", "mengajar", "[kelas]", "bukti", "page.tsx"), "utf8"))),
        "«Lihat bukti» does not give its counts the way to the names");

      return c.verdict(
        "executed: pisahSiapa (src/lib/pengajar.ts) puts each learner of the roster in exactly one list -- handed in (a " +
          "SUBMITTED or FINALIZED session, even after one that ran out), started and not handed in (in progress, paused, " +
          "opened, ran out), not started (no session) -- in the roster's order, and names nobody outside it. Rendered, id " +
          "and en: «Keadaan hari ini» gives each test a link to that test's names on /siapa. The copy table gives /siapa's " +
          "lists the labels «Lihat bukti» counts under. The source of /siapa draws the three lists in order from ajar.siapa",
      );
    },
  },
];
