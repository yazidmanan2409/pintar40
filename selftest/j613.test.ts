/**
 * D-084 J6.13 (STU-18) -- THE HOME SAYS HONESTLY WHEN NOTHING IS WAITING.
 *
 * "Say honestly 'nothing more to do', or give the next expectation." With every
 * chapter finished the home had no next step and still said «Ini yang sedang
 * berjalan hari ini.». Now it says that only while something is waiting (a
 * chapter not finished, an open assessment, a lesson a teacher asked to be read
 * again, feedback still owed); otherwise it shows «Tidak ada lagi yang
 * menunggu» where the next step would stand, in the words «Apa berikutnya»
 * already uses, which say where new work will appear.
 *
 *   J613-K01  reads src/app/belajar/page.tsx: the line «Ini yang sedang berjalan
 *             hari ini.» is gated on something waiting, and what waits is the
 *             next step, an open assessment, a review request and owed
 *             feedback; with assignments and nothing waiting the honest end
 *             stands in the next step's place, with its heading and its line
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

export const j613Tests: SelfTest[] = [
  {
    id: "J613-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const src = readFileSync(join(repoRoot, "src", "app", "belajar", "page.tsx"), "utf8");
      const menunggu = /const menunggu = ([^;]+);/.exec(src)?.[1] ?? "";
      c.expect(!!menunggu, "the home does not decide whether anything is waiting (const menunggu)");
      for (const [apa, re] of [
        ["the next step", /\butama\b/], ["an open assessment", /\bterbuka\.length\b/],
        ["a lesson asked to be read again", /\bdiminta\.length\b/], ["feedback still owed", /umpanBalik\.some\(\(\w+\) => !\w+\.sudahDijawab\)/],
      ] as const) {
        c.expect(re.test(menunggu), `what is waiting on the home leaves out ${apa}: ${menunggu}`);
      }
      c.expect(/tugas\.length > 0 && menunggu \? \(\s*<p className="pin-intro">\{s\("siklus\.hari_ini"\)\}<\/p>/.test(src),
        "the home says «Ini yang sedang berjalan hari ini.» whether or not anything is waiting");
      const habis = /\) : tugas\.length > 0 && !menunggu \? \(([\s\S]*?)\) : null\}/.exec(src)?.[1] ?? "";
      c.expect(/id="pin-habis"/.test(habis) && /s\("siklus\.habis\.judul"\)/.test(habis) && /s\("siklus\.habis\.isi"\)/.test(habis),
        "with every chapter finished and nothing waiting, the home does not say «Tidak ada lagi yang menunggu» where the next step would stand");
      c.expect(src.indexOf('id="pin-habis"') > src.indexOf("<PanelLanjut") && src.indexOf('id="pin-habis"') < src.indexOf('id="pin-diminta"'),
        "the honest end does not stand in the next step's place");
      return c.verdict(
        "reads src/app/belajar/page.tsx: «Ini yang sedang berjalan hari ini.» is said only while something waits (the next " +
          "step, an open assessment, a lesson asked to be read again, feedback still owed); with assignments and nothing " +
          "waiting, «Tidak ada lagi yang menunggu» and where new work will appear stand in the next step's place",
      );
    },
  },
];
