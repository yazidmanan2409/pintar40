/**
 * D-006 -- THE ROLE SCOPES OFFERED ARE THE SCHOOL, ITS BAGIAN, TINGKAT AND KELAS.
 *
 * "Screens show only Bagian, Tingkat and Kelas. Role scopes: Admin sekolah and
 * Dekan at the school, Kepala departemen at a Bagian, Guru at a Kelas." Peran &
 * akses offered every place, the hidden «Jenjang» and «Reguler» included, in
 * alphabetical order with the school last; a dean given «Dekan» at the first
 * "SD …" entry stood at «Jenjang» (audit S23d, run 36952453693).
 *
 *   D006-K01  executes lingkupPeran (src/lib/lingkup-peran.ts) on two schools'
 *             trees, each with its hidden FACULTY and PROGRAMME: no hidden level
 *             is offered; each school comes first by its own name, then its
 *             Bagian, Tingkat and Kelas named after it; the schools are apart.
 *             Reads src/app/konfigurasi/page.tsx: the scope select is that list.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { lingkupPeran, type SimpulPeran } from "../src/lib/lingkup-peran";

export const d006Tests: SelfTest[] = [
  {
    id: "D006-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const nama = new Map([["sd", "SD Zayd Pintar Selalu"], ["sma", "SMA Zayd Pintar Selalu"]]);
      const pohon: SimpulPeran[] = [
        { id: "sd-kelas", institution_id: "sd", kind: "CLASS", name: "Kelas 1A" },
        { id: "sd-jenjang", institution_id: "sd", kind: "FACULTY", name: "Jenjang" },
        { id: "sma-akar", institution_id: "sma", kind: "INSTITUTION", name: "SMA Zayd Pintar Selalu" },
        { id: "sd-reguler", institution_id: "sd", kind: "PROGRAMME", name: "Reguler" },
        { id: "sd-tingkat", institution_id: "sd", kind: "COHORT", name: "Kelas 1" },
        { id: "sd-bagian", institution_id: "sd", kind: "DEPARTMENT", name: "Kelas Rendah" },
        { id: "sd-akar", institution_id: "sd", kind: "INSTITUTION", name: "SD Zayd Pintar Selalu" },
        { id: "sma-jenjang", institution_id: "sma", kind: "FACULTY", name: "Jenjang" },
      ];
      const daftar = lingkupPeran(pohon, nama);
      const ids = daftar.map((o) => o.id);
      c.expect(!ids.some((i) => /jenjang|reguler/.test(i)), `a hidden level is offered as a role scope: ${JSON.stringify(ids)}`);
      c.expect(JSON.stringify(ids) === JSON.stringify(["sd-akar", "sd-bagian", "sd-tingkat", "sd-kelas", "sma-akar"]),
        `the scopes are not each school first, then its Bagian, Tingkat and Kelas: ${JSON.stringify(ids)}`);
      c.expect(daftar[0]?.label === "SD Zayd Pintar Selalu" && daftar[3]?.label === "SD Zayd Pintar Selalu · Kelas 1A",
        `the school is not named by itself, or a place not after its school: ${JSON.stringify(daftar.map((o) => o.label))}`);
      // the first entry naming the school is the school itself, as a person (and the walk) would pick it
      c.expect(daftar.find((o) => o.label.includes("SD Zayd"))?.id === "sd-akar", "the first «SD Zayd…» entry is not the school");
      const halaman = readFileSync(join(repoRoot, "src", "app", "konfigurasi", "page.tsx"), "utf8");
      // L3 (D-132 C7): «Seluruh platform» grants no school-scoped role, so it is offered no school's places
      c.expect(/<select name="scope"[^>]*>[\s\S]{0,200}lingkupPeran\(platformKonteks \? \[\] : nodes \?\? \[\], institutionName\)\.map\(/.test(halaman),
        "Peran & akses does not offer its scopes through lingkupPeran");
      return c.verdict(
        "executes lingkupPeran on two schools' trees with their hidden Jenjang and Reguler: none is offered; each school comes " +
          "first by its own name, then its Bagian, Tingkat and Kelas named after it; reads Konfigurasi: Peran & akses offers " +
          "exactly that list (D-006)",
      );
    },
  },
];
