/**
 * PINTAR'S FIXED PERFORMANCE BANDS ARE NOT THE SCHOOL'S MASTERY THRESHOLD (owner ruling, 3 Oct; D-095).
 *
 * GS-17 on gs-001 (run 37090112107): a student at 75% met the school's 70% target and holds a certificate, while
 * every staff page counted her «Perlu review» and the same report read «Siap sertifikasi» 2 beside «Sertifikat terbit»
 * 3. The 60% / 80% bands are an independent instructional performance distribution
 * (design/READINESS-TIERS-TERMINOLOGY.md §6): the thresholds and the calculation stay; «Siap sertifikasi» is retired;
 * the bands read «Mantap» · «Berkembang» · «Perlu penguatan», with a distinct not-yet state; wherever the bands are
 * drawn, one short line says they are PINTAR's fixed bands, not the school's mastery threshold, and decide no
 * certificate; they are drawn in band order; the misplaced «Nama diurutkan abjad» line is gone. Text and presentation
 * only: no key, threshold, catalogue, migration or calculation changes.
 *
 *   PITA-K01  executes urutkanPita (src/lib/nilai-metrik.ts) and reads the copy (t()) and the three places the bands are
 *             drawn: the teacher's «Lihat bukti», the report value (NilaiLaporan: the class and school summaries and
 *             /pimpinan's class panel) and the action sentence (_intel.ts).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { t, type HleEvent } from "../src/lib/hle";
import * as nilaiMetrik from "../src/lib/nilai-metrik";
import { Checks, type SelfTest } from "./lib";

// strips comments, so a sentence about the old wiring cannot satisfy or fail a check
const kode = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
const PITA = ["kesiapan.siap_sertifikasi", "kesiapan.perlu_review", "kesiapan.butuh_pendampingan", "kesiapan.belum_post_test"] as const;
// words that would claim a pass, a target, readiness or a certificate (design note R1)
const KLAIM = /sertifikat|siap|lulus|tuntas|memenuhi|target|review/i;

export const pitaTests: SelfTest[] = [
  {
    id: "PITA-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const id = (k: string, persona: "educator" | "staff" = "educator") => t(k as HleEvent, persona, { locale: "id" });

      // 1. the band words: the owner's working direction, claiming nothing, for every staff reader
      const harap: Record<string, RegExp> = {
        "kesiapan.siap_sertifikasi": /^Mantap$/,
        "kesiapan.perlu_review": /^Berkembang$/,
        "kesiapan.butuh_pendampingan": /^Perlu penguatan$/,
        "kesiapan.belum_post_test": /^Belum mengerjakan Uji Penguasaan$/,
      };
      for (const k of PITA) {
        for (const persona of ["educator", "staff"] as const) {
          const kata = id(k, persona);
          c.expect(harap[k].test(kata), `${k} reads «${kata}» for ${persona}`);
          if (k !== "kesiapan.belum_post_test") c.expect(!KLAIM.test(kata), `${k} claims a pass, a target or a certificate: «${kata}»`);
        }
        c.expect(t(k as HleEvent, "educator", { locale: "en" }) !== "—", `${k} has no English copy`);
      }
      const label = id("metrik.kesiapan.label");
      c.expect(!/kesiapan|siap|sertifikat/i.test(label) && label !== "—", `the figure is still named for readiness: «${label}»`);

      // 2. one short line, wherever the bands are drawn: PINTAR's fixed bands, not the school's threshold, no certificate
      const catatan = id("kesiapan.catatan");
      c.expect(/PINTAR/.test(catatan) && /tetap/i.test(catatan), `the line does not say the bands are PINTAR's fixed bands: «${catatan}»`);
      c.expect(/bukan batas ketuntasan sekolah/i.test(catatan), `the line does not say they are not the school's mastery threshold: «${catatan}»`);
      c.expect(/tidak menentukan sertifikat/i.test(catatan), `the line does not say they decide no certificate: «${catatan}»`);
      c.expect(/80%/.test(catatan) && /60/.test(catatan), `the line does not name the fixed bands: «${catatan}»`);
      c.expect(catatan.length <= 200, `the line is not concise (${catatan.length} characters)`);

      // 3. the action sentence names the bands it means; the safety-gate figure keeps its own sentence
      const aksi = id("tindakan.fokus_pita");
      c.expect(aksi.includes(id("kesiapan.perlu_review")) && aksi.includes(id("kesiapan.butuh_pendampingan")),
        `the action sentence does not name the two bands: «${aksi}»`);
      const intel = kode(readFileSync(join(repoRoot, "src/app/_intel.ts"), "utf8"));
      c.expect(/case "metrik\.kesiapan\.label":\s*return s\("tindakan\.fokus_pita"/.test(intel), "the bands' action sentence is not tindakan.fokus_pita");
      c.expect(/case "metrik\.gerbang_keselamatan\.label":[\s\S]{0,160}tindakan\.fokus"/.test(intel), "the safety-gate figure lost its own sentence");

      // 4. band order: Mantap, Berkembang, Perlu penguatan, then not yet; anything else after, as given
      const urut = (nilaiMetrik as Record<string, unknown>).urutkanPita as ((x: [string, unknown][]) => [string, unknown][]) | undefined;
      c.expect(typeof urut === "function", "urutkanPita is missing from src/lib/nilai-metrik.ts");
      if (typeof urut === "function") {
        // the order staging returned on 3 Oct (GS-17): jsonb key order
        const dari: [string, unknown][] = [["kesiapan.perlu_review", 2], ["kesiapan.siap_sertifikasi", 2], ["lain", 9], ["kesiapan.belum_post_test", 1], ["kesiapan.butuh_pendampingan", 1]];
        const jadi = urut(dari).map(([k]) => k);
        c.expect(JSON.stringify(jadi) === JSON.stringify([...PITA, "lain"]), `bands drawn as ${jadi.join(", ")}`);
        c.expect(dari[0][0] === "kesiapan.perlu_review", "urutkanPita reorders its argument in place");
      }

      // 5. the surfaces: the teacher's «Lihat bukti» and the report value draw the bands in order with the line;
      //    the alphabetical-names sentence is gone from the bands
      const bukti = kode(readFileSync(join(repoRoot, "src/app/mengajar/[kelas]/bukti/page.tsx"), "utf8"));
      c.expect(/urutkanPita\(/.test(bukti), "«Lihat bukti» draws the bands in key order");
      c.expect(/kesiapan\.catatan/.test(bukti), "«Lihat bukti» does not say the bands are PINTAR's fixed bands");
      c.expect(!/mengajar\.murid\.sub/.test(bukti), "«Lihat bukti» still shows «Nama diurutkan abjad» under the bands");
      const laporan = kode(readFileSync(join(repoRoot, "src/components/bukti/NilaiLaporan.tsx"), "utf8"));
      c.expect(/urutkanPita\(/.test(laporan), "the report value draws the bands in key order");
      c.expect(/kesiapan\.catatan/.test(laporan), "the report value does not say the bands are PINTAR's fixed bands");

      // 6. nothing that decides changed: no threshold or band key is written outside the catalogue's first version
      const pakai = readFileSync(join(repoRoot, "src/lib/nilai-metrik.ts"), "utf8");
      c.expect(!/0\.8|0\.6/.test(kode(pakai)), "a band threshold appears in the presentation code");
      return c.verdict("the bands read Mantap · Berkembang · Perlu penguatan, in order, with PINTAR's fixed-band line; no certificate word");
    },
  },
];
