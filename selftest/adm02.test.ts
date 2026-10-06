/**
 * J3.2 (ADM-02, P1; ADM-J02) -- THE SCHOOL ADMIN SEES WHAT SETUP REMAINS.
 *
 * Konfigurasi, where a school admin lands, showed a class count and a fixed
 * guide, never what was done (cross-check ADM-J02: MISSING). This executes the
 * reading (src/lib/persiapan-sekolah.ts) over the cases a school passes
 * through, and reads the copy table and the page's source.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { t } from "../src/lib/hle";
import { Checks, type SelfTest } from "./lib";

const K = (node_id: string, name: string, active_members: number, is_active = true) =>
  ({ node_id, name, level: "KELAS" as const, parent_id: "t1", academic_year: "2026/2027", is_active, active_members });
const JALUR = new Map<string, string[]>([
  ["k1a", ["root", "b", "t1", "k1a"]], ["k1b", ["root", "b", "t1", "k1b"]], ["k1c", ["root", "b", "t1", "k1c"]],
]);
const NANTI = "2027-06-30T00:00:00Z";
const SEKARANG = Date.parse("2026-10-01T00:00:00Z");

export const adm02Tests: SelfTest[] = [
  {
    id: "ADM02-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const { persiapanSekolah } = await import("../src/lib/persiapan-sekolah");
      type L = ReturnType<typeof persiapanSekolah>[number];
      const baca = (ls: L[]) => Object.fromEntries(ls.map((l) => [l.kunci, l]));

      // day one: a school with no Kelas has nothing done
      const kosong = baca(persiapanSekolah([], [], JALUR, SEKARANG));
      c.expect(!kosong.kelas.selesai && !kosong.murid.selesai && !kosong.guru.selesai,
        `a school with no Kelas reads ${JSON.stringify(kosong)}; nothing is done`);

      // two active Kelas, one with students, a Guru at 1A only; an inactive Kelas is not counted
      const kelas = [K("k1a", "Kelas 1A", 2), K("k1b", "Kelas 1B", 0), K("k1c", "Kelas 1C", 3, false)];
      const satu = baca(persiapanSekolah(kelas, [{ role: "EDUCATOR", scope_node_id: "k1a", valid_until: NANTI }], JALUR, SEKARANG));
      c.expect(satu.kelas.selesai && satu.kelas.kunci === "kelas" && satu.kelas.jumlah === 2, `active Kelas read ${JSON.stringify(satu.kelas)}; expected 2 (1C is inactive)`);
      c.expect(satu.murid.selesai && satu.murid.kunci === "murid" && satu.murid.jumlah === 2, `placed students read ${JSON.stringify(satu.murid)}; expected 2`);
      c.expect(!satu.guru.selesai && satu.guru.kunci === "guru" && JSON.stringify(satu.guru.tanpaGuru) === JSON.stringify(["Kelas 1B (2026/2027)"]),
        `with a Guru at Kelas 1A only, the teacher step reads ${JSON.stringify(satu.guru)}; expected Kelas 1B named`);

      // a Guru over the Tingkat covers every Kelas under it; a head of department, a revoked or an expired Guru do not
      const atas = baca(persiapanSekolah(kelas, [{ role: "EDUCATOR", scope_node_id: "t1", valid_until: NANTI }], JALUR, SEKARANG));
      c.expect(atas.guru.selesai, `a Guru over the Tingkat leaves ${JSON.stringify(atas.guru)}`);
      const bukan = baca(persiapanSekolah(kelas, [
        { role: "HEAD_OF_DEPARTMENT", scope_node_id: "b", valid_until: NANTI },
        { role: "EDUCATOR", scope_node_id: "k1a", valid_until: NANTI, revoked_at: "2026-09-30T00:00:00Z" },
        { role: "EDUCATOR", scope_node_id: "k1b", valid_until: "2026-09-01T00:00:00Z" },
      ], JALUR, SEKARANG));
      c.expect(!bukan.guru.selesai && bukan.guru.kunci === "guru" && bukan.guru.tanpaGuru.length === 2,
        `a head of department, a revoked and an expired Guru count as teachers: ${JSON.stringify(bukan.guru)}`);

      for (const locale of ["id", "en"] as const) {
        for (const k of ["judul", "arti", "sudah", "belum", "kelas", "kelas.cara", "murid", "murid.cara", "guru", "guru.kurang", "guru.cara"]) {
          const kalimat = t(`config.persiapan.${k}` as Parameters<typeof t>[0], "staff", { locale });
          c.expect(kalimat.length > 3 && !kalimat.startsWith("config."), `(${locale}) config.persiapan.${k} has no sentence`);
        }
      }

      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
      const hal = buang(readFileSync(join(repoRoot, "src", "app", "konfigurasi", "page.tsx"), "utf8"));
      c.expect(/persiapanSekolah\(struktur\.rows, \(assignments \?\? \[\]\)/.test(hal) && /<section id="persiapan"/.test(hal)
        && /select\("id, institution_id, kind, name, academic_period_id, is_active, jalur"\)/.test(hal),
        "Konfigurasi does not draw the setup from the structure, the roles and each node's path");
      // right after Struktur sekolah, which stays first (DAISY-05); Pendataan keeps its one link (DAISY-17)
      const iStruktur = hal.indexOf('<section id="struktur"'), iSiap = hal.indexOf('<section id="persiapan"'), iPindah = hal.indexOf('<section id="pindah"');
      c.expect(iStruktur > 0 && iSiap > iStruktur && iSiap < iPindah, "the setup is not drawn right after Struktur sekolah");
      c.expect((hal.match(/href="\/pendataan"/g) ?? []).length === 1, "the setup adds a second way to Pendataan");

      return c.verdict(
        "executes persiapanSekolah (src/lib/persiapan-sekolah.ts): a school with no Kelas has nothing done; with two active " +
          "Kelas (an inactive one not counted), two placed students and a Guru at one Kelas, the teacher step names the " +
          "other; a Guru over the Tingkat covers every Kelas under it; a head of department, a revoked and an expired Guru " +
          "do not. The copy table has every sentence in id and en; the source of Konfigurasi draws the setup right after Struktur sekolah, from the " +
          "structure, the roles and each node's path",
      );
    },
  },
];
