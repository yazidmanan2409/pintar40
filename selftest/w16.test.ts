/**
 * W16 -- THE TEACHER'S VIEW SAYS WHAT LEARNERS CAN SEE, AND WHAT IS WAITING.
 *
 * An assessment made available with a future «Mulai» read «Berjalan» on the
 * teacher's home and its material «Tersedia» on the class page, while learners
 * could not open it until that day (the effective state read the closing, never
 * the opening). And the home said «Tidak ada yang menunggu keputusan Anda hari
 * ini.» when a class had no material at all and the school had published some
 * (journey cross-check W16; EDU-J16, EDU-J01). This executes the rules the
 * teacher's pages read and checks the pages are wired to them.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

export const w16Tests: SelfTest[] = [
  {
    id: "W16-K01",
    run: async (ctx) => {
      const c = new Checks();
      const m = (await import("../src/lib/pengajar")) as Record<string, unknown> as typeof import("../src/lib/pengajar") & {
        statusMateri?: (x: { status: string; berakhir: boolean; belumMulai: boolean }) => string;
        pilihKelasTanpaMateri?: (k: Array<{ id: string; nama: string }>, ada: boolean, punya: ReadonlySet<string>) => { kelasId: string; kelasNama: string } | null;
      };
      const { t } = await import("../src/lib/hle");
      const now = Date.parse("2026-10-01T09:00:00+07:00");

      // 1. an assessment opening tomorrow is not running today; one opened this morning is; one past its window is closed
      const def = (mode: string) => ({ title: mode, mode, item_count: 8, is_ad_hoc: false });
      const baris = [
        { id: "besok", node_id: "k", status: "OPEN", opens_at: "2026-10-02T00:00:00+07:00", closes_at: "2026-10-09T23:59:59+07:00", definition: def("POST_TEST") },
        { id: "pagi", node_id: "k", status: "OPEN", opens_at: "2026-10-01T00:00:00+07:00", closes_at: "2026-10-09T23:59:59+07:00", definition: def("PRE_TEST") },
        { id: "lewat", node_id: "k", status: "OPEN", opens_at: "2026-09-01T00:00:00+07:00", closes_at: "2026-09-30T23:59:59+07:00", definition: def("QUICK") },
        { id: "selalu", node_id: "k", status: "OPEN", opens_at: null, closes_at: null, definition: def("STANDALONE") },
      ];
      const buka = m.pilihBerjalan(baris, [], ["OPEN"], now).map((b) => b.id);
      c.expect(!buka.includes("besok"), `an assessment opening tomorrow reads «Berjalan» today (open: ${JSON.stringify(buka)})`);
      c.expect(JSON.stringify(buka.sort()) === JSON.stringify(["pagi", "selalu"]), `the running list today is ${JSON.stringify(buka)}`);
      const hariIni = m.pilihBerjalan(baris, [], ["OPEN", "CLOSED"], now).map((b) => b.id);
      c.expect(!hariIni.includes("besok") && hariIni.includes("lewat"), `«Lihat bukti» reads ${JSON.stringify(hariIni)}: one not yet open is counted, or one closed is lost`);
      c.expect(m.keadaanEfektif("OPEN", null, now, "2026-10-01T09:00:00+07:00") === "OPEN"
          && m.keadaanEfektif("OPEN", "2026-10-09T00:00:00+07:00", now) === "OPEN"
          && m.keadaanEfektif("CLOSED", null, now, "2026-10-05T00:00:00+07:00") === "CLOSED",
        "the effective state is wrong at the opening instant, without an opening, or for one already closed");

      // 2. a class's material with a future «Mulai» is «Dijadwalkan», never «Tersedia»
      if (c.expect(typeof m.statusMateri === "function", "the class page decides its material's status by itself: src/lib/pengajar.ts has no statusMateri")) {
        const st = m.statusMateri!;
        c.expect(st({ status: "ACTIVE", berakhir: false, belumMulai: true }) === "mengajar.status.dijadwalkan",
          `material starting on a later day reads ${st({ status: "ACTIVE", berakhir: false, belumMulai: true })}`);
        c.expect(st({ status: "ACTIVE", berakhir: false, belumMulai: false }) === "mengajar.status.tersedia"
            && st({ status: "ACTIVE", berakhir: true, belumMulai: false }) === "mengajar.status.selesai"
            && st({ status: "CANCELLED", berakhir: false, belumMulai: true }) === "mengajar.status.belum",
          "material open now, finished, or not active reads the wrong status");
        for (const locale of ["id", "en"] as const) {
          const a = t("mengajar.status.dijadwalkan" as Parameters<typeof t>[0], "educator", { locale });
          c.expect(a !== t("mengajar.status.tersedia", "educator", { locale }) && a !== t("mengajar.status.berjalan", "educator", { locale }) && a.length > 2,
            `(${locale}) «${a}» does not tell a scheduled material from an available one`);
        }
      }

      // 3. the home: a class with nothing at all while the school has published something is named; no course is proposed
      if (c.expect(typeof m.pilihKelasTanpaMateri === "function", "the home cannot tell a class with no material: src/lib/pengajar.ts has no pilihKelasTanpaMateri")) {
        const p = m.pilihKelasTanpaMateri!;
        const kelas = [{ id: "5a", nama: "Kelas 5A" }, { id: "5b", nama: "Kelas 5B" }, { id: "5c", nama: "Kelas 5C" }];
        c.expect(JSON.stringify(p(kelas, true, new Set(["5a"]))) === JSON.stringify({ kelasId: "5b", kelasNama: "Kelas 5B" }),
          `with published material and 5B empty, the home names ${JSON.stringify(p(kelas, true, new Set(["5a"])))}`);
        c.expect(p(kelas, false, new Set()) === null, "with nothing published, the home sends a teacher to prepare material that does not exist");
        c.expect(p(kelas, true, new Set(["5a", "5b", "5c"])) === null, "a class that already has material is named as having none");
        c.expect(!Object.keys(p(kelas, true, new Set()) ?? {}).some((k) => /kursus|terbitan/i.test(k)), "the home proposes a course to a class with nothing to fit it by (BOB-40)");
      }

      // 4. the wiring
      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      const baca = (...p: string[]) => buang(readFileSync(join(ctx.repoRoot, ...p), "utf8"));
      const lib = baca("src", "lib", "pengajar.ts");
      c.expect(/keadaanEfektif\(b\.status, b\.closes_at, sekarang, b\.opens_at\)/.test(lib), "pilihBerjalan does not hand the effective state the opening");
      c.expect(/belumMulai: Boolean\(r\.available_from && Date\.parse\(r\.available_from\) > Date\.now\(\)\)/.test(lib), "a class's material does not know it has not started");
      const kelasPage = baca("src", "app", "mengajar", "[kelas]", "page.tsx");
      c.expect(/s\(ajar\.statusMateri\(x\)\)/.test(kelasPage) && !/"mengajar\.status\.tersedia"/.test(kelasPage),
        "the class page decides its material's status by itself");
      const beranda = baca("src", "app", "mengajar", "page.tsx");
      c.expect(/const baru = satu \? null : await ajar\.kelasTanpaMateri\(konteks\.kelas\);/.test(beranda)
          && /\) : baru \? \([\s\S]*?href=\{`\/mengajar\/\$\{baru\.kelasId\}\/siapkan`\}[\s\S]*?\) : \([\s\S]*?"mengajar\.layak\.kosong"/.test(beranda),
        "the home still says nothing is waiting before asking whether a class has no material, or does not send it to «Siapkan materi»");

      return c.verdict(
        "executed: an assessment opening tomorrow is not «Berjalan» today and is not counted on «Lihat bukti», while one " +
          "opened this morning, one without a window and one closed still read as before; material with a future «Mulai» " +
          "reads «Dijadwalkan» in both languages, never «Tersedia»; with published material, the home names the first class " +
          "that has none and proposes no course, and names none when nothing is published or every class has material; " +
          "the source of the class page reads statusMateri, and the source of the home asks kelasTanpaMateri before saying " +
          "nothing is waiting and sends that class to «Siapkan materi»",
      );
    },
  },
];
