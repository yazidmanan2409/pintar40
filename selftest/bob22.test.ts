/**
 * BOB-22 -- A LESSON READ TO ITS LAST PAGE COUNTS AS READ. The player showed
 * pages counted from 0 and saved that index, while lessonRead asked for
 * furthest_position >= total_positions: the last page of N saved N-1, so no
 * lesson was ever read, the home never left "Peta bacaan sudah siap", and the
 * Uji Penguasaan was never offered (staging journey run 7, J09/J10). The old
 * unit case used 10 of 10, a state the player could never produce.
 *
 * One meaning now: a saved position is the number of pages reached, 1 to N.
 * This walks a learner through the player's own save and resume rules (the two
 * helpers LessonPlayer uses) and judges the result with the rule every reader
 * uses, with the database's own "never regresses" and "never beyond the total".
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

export const bob22Tests: SelfTest[] = [
  {
    id: "BOB22-K01",
    run: async (ctx) => {
      const c = new Checks();
      const siklus = (await import("../src/lib/siklus")) as Record<string, unknown>;
      const dibaca = siklus.lessonRead as (l: { furthest_position: number; total_positions: number | null }) => boolean;
      const posisi = siklus.posisi as (s: unknown, l: unknown[]) => { langkah: string; pelajaranSelesai: number };
      c.expect(typeof siklus.posisiTersimpan === "function" && typeof siklus.halamanMulai === "function",
        "there is no one meaning for a saved position: src/lib/siklus.ts has no posisiTersimpan and halamanMulai");
      // Without them, the player's own rule before BOB-22: it saved the page
      // index and resumed at what was saved. Judged below all the same, so the
      // red says what a learner met, not only that a name is missing.
      const simpan = (siklus.posisiTersimpan as ((halaman: number) => number) | undefined) ?? ((h: number) => h);
      const mulai = (siklus.halamanMulai as ((posisi: number, jumlah: number) => number) | undefined)
        ?? ((pos: number, jumlah: number) => Math.min(jumlah - 1, Math.max(0, Number.isFinite(pos) ? pos : 0)));

      // 1. a learner reads each lesson page by page, as the player saves it; the
      //    server keeps the furthest (greatest), never beyond the total
      for (let n = 1; n <= 8; n++) {
        let tersimpan = 0;
        for (let halaman = 0; halaman < n; halaman++) {
          tersimpan = Math.max(tersimpan, simpan(halaman));
          c.expect(tersimpan <= n, `a ${n}-page lesson saved ${tersimpan} on page ${halaman + 1}, beyond its total`);
          const terakhir = halaman === n - 1;
          c.expect(dibaca({ furthest_position: tersimpan, total_positions: n }) === terakhir,
            `a ${n}-page lesson on page ${halaman + 1} saved ${tersimpan} and reads as ${terakhir ? "unread" : "read"}`);
          // 2. coming back, the learner lands on the page they were on
          c.expect(mulai(tersimpan, n) === halaman,
            `a ${n}-page lesson saved ${tersimpan} on page ${halaman + 1} resumes on page ${mulai(tersimpan, n) + 1}`);
        }
      }
      c.expect(mulai(0, 5) === 0, "a lesson never opened does not start on its first page");
      c.expect(mulai(99, 5) === 4 && mulai(Number.NaN, 5) === 0, "a resume point outside the lesson is not kept inside it");

      // 3. the cycle: every lesson read to its last page by the player puts the
      //    Uji Penguasaan in front of the learner
      const n = 4;
      const pelajaran = Array.from({ length: 3 }, (_, i) => ({
        lesson_id: `l${i}`, modul: "m", urutan: i, judul: "t", ringkasan: null, isi: null, contoh: [], media: [], halaman: null,
        furthest_position: simpan(n - 1), total_positions: n,
      }));
      const keadaan = { pre_assignment: "pre", pre_session: null, pre_status: "FINALIZED",
        post_assignment: "post", post_session: null, post_status: null };
      const p = posisi(keadaan, pelajaran);
      c.expect(p.langkah === "PENGUASAAN" && p.pelajaranSelesai === 3,
        `three lessons read to their last page leave the learner at ${p.langkah} with ${p.pelajaranSelesai} read`);

      // 4. the player saves and resumes through these two, and nothing else
      const pemutar = readFileSync(join(ctx.repoRoot, "src", "app", "belajar", "_components", "LessonPlayer.tsx"), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      // RESTATED FOR BOB-23 (a changed requirement): the player no longer calls
      // saveProgress with posisiTersimpan(p) itself; it saves what perluDisimpan
      // decides, which must be that same count whenever it saves.
      const putuskan = siklus.perluDisimpan as ((h: number, t: number) => number | null) | undefined;
      c.expect((/props\.saveProgress\([^;]*posisiTersimpan\(p\)\s*,\s*pages\.length\)/.test(pemutar)
          || (/perluDisimpan\(page, tersimpan\.current\)/.test(pemutar) && typeof putuskan === "function"
              && [0, 1, 4, 9].every((h) => putuskan(h, 0) === simpan(h) && putuskan(h, simpan(h)) === null))),
        "LessonPlayer does not save the page as posisiTersimpan(page)");
      c.expect(/halamanMulai\(props\.startAt,\s*pages\.length\)/.test(pemutar) && !/Math\.max\(props\.startAt\b/.test(pemutar),
        "LessonPlayer resumes from startAt without halamanMulai");

      return c.verdict(
        "a learner stepping through lessons of 1 to 8 pages, saving exactly what LessonPlayer saves (posisiTersimpan: the " +
          "page's index + 1) and keeping the furthest, is read only once on the last page, never saves beyond the total, " +
          "and resumes (halamanMulai) on the page they were on; three lessons read to their last page put the learner at " +
          "the Uji Penguasaan; LessonPlayer saves and resumes through those two helpers",
      );
    },
  },
];
