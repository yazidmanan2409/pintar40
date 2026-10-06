/**
 * W2 (T1, D-085) -- ON A SHARED COMPUTER, NO LEARNER INHERITS ANOTHER'S PLACE.
 *
 * The lesson player kept the page reached, and the media player the second
 * reached, under keys made of the lesson or the file alone; «Keluar» never
 * cleared them. The next student on the same classroom computer opened the
 * lesson at the previous student's page and saved it as their own progress
 * (journey cross-check W2). This drives the device memory the player uses with
 * two learners on one browser and judges what each one gets back.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

class Peramban {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
  setItem(k: string, v: string) { this.data.set(k, String(v)); }
  removeItem(k: string) { this.data.delete(k); }
}

export const w2Tests: SelfTest[] = [
  {
    id: "W2-K01",
    run: async (ctx) => {
      const c = new Checks();
      const m = (await import("../src/lib/posisi-perangkat")) as typeof import("../src/lib/posisi-perangkat");
      const A = "11111111-1111-4111-8111-111111111111";
      const B = "22222222-2222-4222-8222-222222222222";
      const L = "lesson-1";
      const V = "school/media/bab1.mp4";

      // 1. Ani reads to page 4, signs out; Budi signs in on the same browser and opens the lesson
      const p = new Peramban();
      m.simpanHalaman(p, A, L, 4);
      c.expect(m.bacaHalaman(p, B, L) === 0, `Budi opens the lesson at Ani's page ${m.bacaHalaman(p, B, L) + 1}`);
      c.expect(m.bacaHalaman(p, A, L) === 4, "Ani, back on the same browser, does not return to her own page");
      m.simpanHalaman(p, B, L, 1);
      c.expect(m.bacaHalaman(p, A, L) === 4 && m.bacaHalaman(p, B, L) === 1, "one learner's save moved the other's place");
      m.simpanHalaman(p, A, L, 2);
      c.expect(m.bacaHalaman(p, A, L) === 4, "a learner going back a page lost the furthest page reached");

      // 2. the old person-less key, left by the player before W2: nobody may inherit it, and it is removed unread
      const lama = new Peramban();
      lama.setItem(`pintar.lesson.${L}`, "3");
      lama.setItem(`pintar.media.${V}`, "95");
      c.expect(m.bacaHalaman(lama, B, L) === 0, "the next learner inherits the old device-wide lesson page");
      c.expect(m.bacaDetik(lama, B, V) === 0, "the next learner inherits the old device-wide media position");
      c.expect(lama.getItem(`pintar.lesson.${L}`) === null && lama.getItem(`pintar.media.${V}`) === null,
        "the old device-wide entries stay on the shared computer");

      // 3. no person, nothing kept: nothing read, nothing written
      const kosong = new Peramban();
      m.simpanHalaman(kosong, null, L, 3);
      m.simpanDetik(kosong, null, V, 40);
      c.expect(kosong.data.size === 0, `with no signed-in person the device kept ${[...kosong.data.keys()].join(", ")}`);
      c.expect(m.bacaHalaman(null, A, L) === 0 && m.bacaDetik(null, A, V) === 0, "a browser without storage gives a place");

      // 4. the recording: the same rule
      m.simpanDetik(p, A, V, 61.7);
      c.expect(m.bacaDetik(p, B, V) === 0 && m.bacaDetik(p, A, V) === 61, "the media position is not the person's own");

      // 5. the wiring: the player keeps nothing on the device except through these, and the page passes the person
      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      const pemutar = buang(readFileSync(join(ctx.repoRoot, "src", "app", "belajar", "_components", "LessonPlayer.tsx"), "utf8"));
      c.expect(!/localStorage|sessionStorage|indexedDB/.test(pemutar), "the lesson player still touches device storage directly");
      c.expect(/bacaHalaman\(penyimpananPerangkat\(\), props\.personId, props\.lessonId\)/.test(pemutar)
          && /simpanHalaman\(penyimpananPerangkat\(\), orang, pelajaran, page\)/.test(pemutar)
          && /bacaDetik\(penyimpananPerangkat\(\), personId, entry\.path\)/.test(pemutar)
          && /simpanDetik\(penyimpananPerangkat\(\), personId, entry\.path, el\.currentTime\)/.test(pemutar),
        "the lesson player does not read and save its page and media position through the person's own keys");
      const halaman = buang(readFileSync(join(ctx.repoRoot, "src", "app", "belajar", "[tugas]", "pelajaran", "[pelajaran]", "page.tsx"), "utf8"));
      c.expect(/rpc\("current_person_id"\)/.test(halaman) && /personId=\{typeof orang === "string" \? orang : null\}/.test(halaman),
        "the lesson page does not hand the player the signed-in person");

      return c.verdict(
        "two learners on one browser: each reopens a lesson at their own page and a recording at their own second, never " +
          "the other's; a save by one never moves the other; the furthest page never moves back; the old device-wide " +
          "entries are removed unread and inherited by nobody; with no person nothing is read or written; the lesson " +
          "player keeps nothing on the device except through these person-keyed helpers, and the lesson page passes it " +
          "the signed-in person from current_person_id",
      );
    },
  },
];
