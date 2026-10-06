/**
 * W5 -- «POSISI BACAAN TERSIMPAN.» IS TRUE OR ABSENT.
 *
 * The lesson page printed «Posisi bacaan tersimpan.» under every lesson,
 * whatever happened to the save (journey cross-check W5). And the player marked
 * a page saved before the server answered, so a lost save of the last page left
 * the lesson unread -- no Uji Penguasaan link -- with nothing to try it again.
 * This drives the player's save rule through a reading where saves are lost and
 * judges what the learner is told and what the server ends up holding.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

type Hasil = { ok: boolean; furthest?: number } | null;

export const w5Tests: SelfTest[] = [
  {
    id: "W5-K01",
    run: async (ctx) => {
      const c = new Checks();
      const m = (await import("../src/lib/siklus")) as typeof import("../src/lib/siklus");

      /**
       * The player's loop: each page shown asks perluDisimpan; a save is sent and
       * answered by `jawab` (the server's answer, or null when the request is lost).
       * Returns the server's count and, per step, whether the note was shown.
       */
      const baca = (n: number, startAt: number, langkah: number[], jawab: (posisi: number, server: number) => Hasil) => {
        let server = startAt, diServer = startAt, tersimpan = startAt;
        const catatan: boolean[] = [];
        let halaman = m.halamanMulai(startAt, n);
        const tampil = () => {
          const posisi = m.perluDisimpan(halaman, tersimpan);
          if (posisi !== null) {
            tersimpan = posisi;
            const h = jawab(posisi, server);
            if (h?.ok) server = Math.max(server, posisi);
            const s = m.setelahSimpan(h, posisi, { diServer, tersimpan });
            diServer = s.diServer; tersimpan = s.tersimpan;
          }
          catatan.push(m.posisiDiServer(halaman, diServer));
        };
        tampil();
        for (const ke of langkah) { halaman = Math.max(0, Math.min(n - 1, ke)); tampil(); }
        return { server, diServer, catatan, read: m.lessonRead({ furthest_position: server, total_positions: n }) };
      };
      const ok = (posisi: number, server: number): Hasil => ({ ok: true, furthest: Math.max(posisi, server) });

      // 1. every save answered: the note on every page, the lesson read
      const a = baca(4, 0, [1, 2, 3], ok);
      c.expect(a.catatan.every(Boolean) && a.read, `a lesson saved page by page: note ${JSON.stringify(a.catatan)}, read ${a.read}`);

      // 2. the last page's save is lost: no note there; back a page, forward again: tried again, saved, read
      let hilang = true;
      const b = baca(4, 0, [1, 2, 3, 2, 3], (p, s) => (p === 4 && hilang ? ((hilang = false), null) : ok(p, s)));
      c.expect(b.catatan[3] === false, "«Posisi bacaan tersimpan.» is shown on the page whose save was lost");
      c.expect(b.catatan[4] === true, "a page the server does hold is not said to be saved");
      c.expect(b.server === 4 && b.read && b.catatan[5] === true,
        `after a lost save of the last page, turning back to it does not save it again: the server holds ${b.server} of 4, read ${b.read}`);

      // 3. the server refuses (ok: false): the same as lost
      const d = baca(3, 0, [1, 2], (p, s) => (p === 3 ? { ok: false } : ok(p, s)));
      c.expect(d.catatan[2] === false && !d.read, "a refused save is told as saved");

      // 4. answers out of order and a later lost save never move what the server is known to hold back
      let s = m.setelahSimpan({ ok: true, furthest: 4 }, 4, { diServer: 2, tersimpan: 4 });
      s = m.setelahSimpan({ ok: true, furthest: 3 }, 3, s);
      c.expect(s.diServer === 4 && s.tersimpan === 4, `an older answer arriving last moved the count back: ${JSON.stringify(s)}`);
      s = m.setelahSimpan(null, 5, { diServer: 4, tersimpan: 5 });
      c.expect(s.diServer === 4 && s.tersimpan === 4, `a lost save is still believed: ${JSON.stringify(s)}`);
      s = m.setelahSimpan({ ok: true, furthest: 6 }, 3, { diServer: 2, tersimpan: 3 });
      c.expect(s.diServer === 6, "the server's own furthest count (read further on another device) is not taken");
      c.expect(!m.posisiDiServer(0, 0) && m.posisiDiServer(0, 1) && !m.posisiDiServer(2, 2) && m.posisiDiServer(1, 5),
        "the note is not decided by whether the server holds the page on screen");

      // 5. the wiring
      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      const halaman = buang(readFileSync(join(ctx.repoRoot, "src", "app", "belajar", "[tugas]", "pelajaran", "[pelajaran]", "page.tsx"), "utf8"));
      c.expect(!/<p className="pin-meta">\{s\("lesson\.saved"\)\}<\/p>/.test(halaman), "the lesson page still prints the note whatever happened");
      c.expect(/savedNote=\{s\("lesson\.saved"\)\}/.test(halaman), "the lesson page does not hand the player the note in the reader's language");
      const pemutar = buang(readFileSync(join(ctx.repoRoot, "src", "app", "belajar", "_components", "LessonPlayer.tsx"), "utf8"));
      c.expect(/\{posisiDiServer\(page, diServer\) && <p className="pin-meta">\{props\.savedNote\}<\/p>\}/.test(pemutar),
        "the player does not show the note only while the server holds the page on screen");
      c.expect(/setelahSimpan\(hasil, posisi, \{ diServer: server\.current, tersimpan: tersimpan\.current \}\)/.test(pemutar)
          && /void save\(tugas, pelajaran, posisi, total\)\.then\(selesai, \(\) => selesai\(null\)\);/.test(pemutar),
        "the player does not settle both a save's answer and its loss through setelahSimpan");
      c.expect((pemutar.match(/props\.savedNote/g) ?? []).length === 1, "the note is shown from somewhere else in the player too");

      return c.verdict(
        "driven through the player's save rule: a lesson saved page by page shows «Posisi bacaan tersimpan.» on every page " +
          "and ends read; a lost or refused save shows no note on its page, a page the server holds still shows it, and " +
          "turning back to the lost page saves it again so the lesson ends read; an older answer arriving last, or a lost " +
          "save, never moves what the server is known to hold back, and the server's own furthest count is taken; the " +
          "lesson page no longer prints the note itself but hands it to the player, which shows it only while the server " +
          "holds the page on screen and settles every save's answer and loss through setelahSimpan",
      );
    },
  },
];
