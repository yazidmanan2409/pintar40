/**
 * BOB-23 (D-031, hot path) -- THE LESSON PLAYER SAVES ONCE PER PAGE NEWLY
 * REACHED. Its save ran in an effect that depended on the whole props object;
 * every save wrote the session cookie back unchanged, Next re-rendered the page
 * for it (x-action-revalidated), the player got new props, and the effect saved
 * again: about 20 saves and 180 Supabase calls a second while a learner read
 * one page (measured before and after BOB-22; the hand-off has the numbers).
 *
 * The decision is now a pure function (perluDisimpan in src/lib/siklus.ts) that
 * this drives through every render a lesson sees; the effect is keyed on the
 * page alone; and the save action writes a session cookie only when it changed
 * (cookieYangBerubah in src/lib/sesi.ts), so a save no longer re-renders.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

type Kejadian = { jenis: "buka" | "render" | "maju" | "mundur" };

export const bob23Tests: SelfTest[] = [
  {
    id: "BOB23-K01",
    run: async (ctx) => {
      const c = new Checks();
      const siklus = (await import("../src/lib/siklus")) as Record<string, unknown>;
      const sesi = (await import("../src/lib/sesi")) as Record<string, unknown>;
      const simpanSeperti = siklus.posisiTersimpan as (h: number) => number;
      const mulai = siklus.halamanMulai as (p: number, n: number) => number;
      c.expect(typeof siklus.perluDisimpan === "function", "there is no save decision: src/lib/siklus.ts has no perluDisimpan");
      // Without it, the player's own rule before BOB-23: every render ran the
      // save, whatever was already saved.
      const putuskan = (siklus.perluDisimpan as ((h: number, t: number) => number | null) | undefined)
        ?? ((h: number) => simpanSeperti(h));

      /** A lesson of `n` pages, the server's startAt, and what happens on screen; every render asks. */
      const jalankan = (n: number, startAt: number, kejadian: Kejadian[]) => {
        let halaman = mulai(startAt, n), tersimpan = startAt;
        const disimpan: number[] = [];
        const render = () => {
          const p = putuskan(halaman, tersimpan);
          if (p !== null) { tersimpan = Math.max(tersimpan, p); disimpan.push(p); }
        };
        for (const k of kejadian) {
          if (k.jenis === "maju") halaman = Math.min(n - 1, halaman + 1);
          if (k.jenis === "mundur") halaman = Math.max(0, halaman - 1);
          render();
        }
        return { disimpan, tersimpan };
      };
      const ulang = (jenis: Kejadian["jenis"], kali: number) => Array.from({ length: kali }, () => ({ jenis }));

      // 1. a new lesson of 5 pages: the first view, twenty re-renders idle
      //    (each save re-rendered the page), then the other four pages, each
      //    followed by re-renders, then back twice, idle again
      const a = jalankan(5, 0, [{ jenis: "buka" }, ...ulang("render", 20),
        ...[1, 2, 3, 4].flatMap(() => [{ jenis: "maju" as const }, ...ulang("render", 5)]),
        ...ulang("mundur", 2), ...ulang("render", 20)]);
      c.expect(JSON.stringify(a.disimpan) === "[1,2,3,4,5]",
        `reading a 5-page lesson with re-renders, idling and going back saved ${a.disimpan.length} time(s): ${JSON.stringify(a.disimpan.slice(0, 12))}${a.disimpan.length > 12 ? "…" : ""}; expected 1, 2, 3, 4, 5`);
      c.expect(a.tersimpan === 5 && (siklus.lessonRead as (l: object) => boolean)({ furthest_position: a.tersimpan, total_positions: 5 }),
        "the lesson read to its last page is not read (BOB-22)");

      // 2. idle on a lesson already saved: nothing after the first view
      const b = jalankan(5, 3, [{ jenis: "buka" }, ...ulang("render", 50)]);
      c.expect(b.disimpan.length === 0, `resuming a lesson saved at 3 of 5 and idling saved ${b.disimpan.length} time(s)`);

      // 3. going back and forward over pages already reached saves nothing new
      const d = jalankan(6, 6, [{ jenis: "buka" }, ...ulang("mundur", 3), ...ulang("maju", 3), ...ulang("render", 10)]);
      c.expect(d.disimpan.length === 0, `paging over a lesson already read saved ${d.disimpan.length} time(s)`);

      // 4. the save no longer re-renders: only a session cookie that changed is written
      const berubah = sesi.cookieYangBerubah as (<T extends { name: string; value: string; options?: { maxAge?: number } }>(k: T[], s: (n: string) => string | undefined) => T[]) | undefined;
      if (c.expect(typeof berubah === "function", "there is no cookie filter: src/lib/sesi.ts has no cookieYangBerubah")) {
        const kini = new Map([["sb-x-auth-token", "base64-sama"], ["sb-x-auth-token.1", "lama"]]);
        const keluar = berubah!([
          { name: "sb-x-auth-token", value: "base64-sama", options: { maxAge: 3600 } },
          { name: "sb-x-auth-token.1", value: "baru", options: { maxAge: 3600 } },
          { name: "sb-y-auth-token", value: "", options: { maxAge: 0 } },
        ], (n) => kini.get(n)).map((k) => k.name);
        c.expect(JSON.stringify(keluar) === JSON.stringify(["sb-x-auth-token.1", "sb-y-auth-token"]),
          `the filter keeps ${JSON.stringify(keluar)}; expected the changed chunk and the deletion, not the unchanged session`);
      }

      // 5. the wiring: the player's save effect is keyed on the page alone, and
      //    the save action writes only what changed
      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      const pemutar = buang(readFileSync(join(ctx.repoRoot, "src", "app", "belajar", "_components", "LessonPlayer.tsx"), "utf8"));
      const efek = /useEffect\(\(\) => \{([\s\S]*?)\n  \}, \[([^\]]*)\]\);/g;
      const simpanEfek = [...pemutar.matchAll(efek)].filter((m) => /\bsave\(|saveProgress\(/.test(m[1]));
      c.expect(simpanEfek.length === 1 && simpanEfek[0][2].trim() === "page" && /perluDisimpan\(page, tersimpan\.current\)/.test(simpanEfek[0][1]),
        `the player's save effect is not keyed on the page alone through perluDisimpan (${simpanEfek.map((m) => `[${m[2]}]`).join(", ") || "none found"})`);
      c.expect(!/useCallback\([\s\S]*?saveProgress[\s\S]*?\[[^\]]*\bprops\b[^\]]*\]\)/.test(pemutar),
        "the player still builds its save from the whole props object");
      const aksi = buang(readFileSync(join(ctx.repoRoot, "src", "app", "belajar", "actions.ts"), "utf8"));
      const simpanAksi = /export async function saveLessonProgress[\s\S]*?\n\}/.exec(aksi)?.[0] ?? "";
      c.expect(/supabaseServer\(\{ tulisJikaBerubah: true \}\)/.test(simpanAksi),
        "saveLessonProgress writes the session cookie back unchanged, so each save re-renders the lesson page");

      return c.verdict(
        "driven through every render a lesson sees, perluDisimpan saves a new 5-page lesson exactly 1, 2, 3, 4, 5 -- " +
          "none for 20 idle re-renders, none per re-render after each page turn, none going back -- and the last page " +
          "reads as read; idle on a lesson already saved, and paging over pages already reached, save nothing; " +
          "cookieYangBerubah keeps a changed session chunk and a deletion and drops an unchanged session; the player's " +
          "save effect is keyed on [page] alone through perluDisimpan, and saveLessonProgress writes only a changed session",
      );
    },
  },
];
