/**
 * EFFICIENCY AUDIT (2 Oct, after the L1 run on staging, run 36964437916) -- ONE ASSISTANCE CHECK AT A TIME.
 *
 * The question player asks the server every 5 s whether help is due on the question in front of the learner. Its
 * checks are server actions, and Next runs one tab's server actions one after another. In the L1 run the check
 * took a median 5.6 s: a bare 5 s timer then only queues checks behind each other, and the learner's saves wait
 * behind the queue. The player now asks through tanyaBerkala: a tick that finds the last check still waiting is
 * skipped. When the server answers within 5 s nothing changes (one check per tick).
 *
 *   EFF-K01  tanyaBerkala (src/lib/tanya-berkala.ts) with a slow ask never has two in flight and asks fewer times
 *            than a bare timer would; with a fast ask it asks once per tick, as a bare timer does; stopped, it asks
 *            no more. The question player's assistance check goes through it, and no bare timer is left there.
 *
 * WHOLE-SYSTEM AUDIT (2 Oct) -- A SCHOOL ADMINISTRATOR'S LISTS NAME THEIR SCHOOLS.
 *
 *   EFF-K02  Konfigurasi (src/app/konfigurasi/page.tsx) reads the enrolments and the audit trail of the schools the
 *            viewer administers, named, unless the viewer is the platform administrator; neither is read unnamed for a
 *            school administrator. (The policies return the same rows either way; unnamed, every row of every school
 *            is checked: 1,979 ms against 15 ms for the audit trail as gs-001's administrator on staging.)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tanyaBerkala } from "../src/lib/tanya-berkala";
import { Checks, type SelfTest } from "./lib";

const tidur = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// asks with the given latency for `lama` ms, through tanyaBerkala or through a bare timer (the old player)
async function ukur(latensi: number, tiap: number, lama: number, berkala: boolean) {
  let jalan = 0, puncak = 0, tanya = 0;
  const ask = async () => {
    tanya++;
    jalan++;
    puncak = Math.max(puncak, jalan);
    await tidur(latensi);
    jalan--;
  };
  let stop: () => void;
  if (berkala) stop = tanyaBerkala(ask, tiap);
  else { void ask(); const t = setInterval(() => { void ask(); }, tiap); stop = () => clearInterval(t); }
  await tidur(lama);
  stop();
  const sebelum = tanya;
  await tidur(latensi + tiap * 2);
  return { tanya: sebelum, puncak, setelahBerhenti: tanya - sebelum };
}

export const effTests: SelfTest[] = [
  {
    id: "EFF-K01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // 1. slow answers: never two in flight, fewer asks than a bare timer
      const lambat = await ukur(130, 40, 700, true);
      const lambatLama = await ukur(130, 40, 700, false);
      c.expect(lambat.puncak === 1, `with a slow answer ${lambat.puncak} checks were in flight at once`);
      c.expect(lambatLama.puncak > 1, `the bare timer was expected to overlap (in flight ${lambatLama.puncak}): the measure is not measuring`);
      c.expect(lambat.tanya <= 8 && lambat.tanya < lambatLama.tanya,
        `with a slow answer it asked ${lambat.tanya} times in 700 ms (a bare timer ${lambatLama.tanya})`);
      c.expect(lambat.setelahBerhenti === 0, `it asked ${lambat.setelahBerhenti} time(s) after being stopped`);

      // 2. fast answers: one ask per tick, as before
      const cepat = await ukur(2, 40, 420, true);
      const cepatLama = await ukur(2, 40, 420, false);
      c.expect(Math.abs(cepat.tanya - cepatLama.tanya) <= 1 && cepat.tanya >= 8,
        `with a fast answer it asked ${cepat.tanya} times in 420 ms against a bare timer's ${cepatLama.tanya}`);

      // 3. the question player asks through it
      const pemain = readFileSync(join(repoRoot, "src", "app", "belajar", "_components", "ItemPlayer.tsx"), "utf8");
      c.expect(/tanyaBerkala\(async \(\) => \{\s*const r = await actions\.assistance\(itemId\);[\s\S]*?\}, 5000\)/.test(pemain),
        "the question player's assistance check does not go through tanyaBerkala every 5 s");
      c.expect(!/setInterval\(ask/.test(pemain), "a bare timer still drives the question player's assistance check");

      return c.verdict(
        `executes tanyaBerkala (src/lib/tanya-berkala.ts): with a slow ask (130 ms against a 40 ms tick) it had at most ${lambat.puncak} check in flight and asked ` +
          `${lambat.tanya} times in 700 ms where a bare timer asked ${lambatLama.tanya} with ${lambatLama.puncak} in flight; ` +
          `with a fast ask it asked ${cepat.tanya} times against ${cepatLama.tanya}; stopped, it asked no more; reads the question ` +
          "player (src/app/belajar/_components/ItemPlayer.tsx): its assistance check goes through it every 5 s",
      );
    },
  },
  {
    id: "EFF-K02",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const halaman = readFileSync(join(repoRoot, "src", "app", "konfigurasi", "page.tsx"), "utf8");
      for (const [nama, tabel] of [["enrolmen", "enrollments"], ["jejak", "audit_log"]] as const) {
        c.expect(new RegExp(`const ${nama} = supabase\\.from\\("${tabel}"\\)`).test(halaman),
          `Konfigurasi does not read ${tabel} through «${nama}»`);
        c.expect(new RegExp(`\\(isSys === true \\? ${nama} : ${nama}\\.in\\("institution_id", adminInstitutionIds\\)\\)`).test(halaman),
          `Konfigurasi reads ${tabel} without naming the administrator's schools`);
        c.expect((halaman.match(new RegExp(`from\\("${tabel}"\\)`, "g")) ?? []).length === 1,
          `Konfigurasi reads ${tabel} more than once`);
      }
      return c.verdict(
        "reads Konfigurasi (src/app/konfigurasi/page.tsx): a school administrator's enrolments and audit trail are read " +
          "for the schools they administer, named (the platform administrator's unchanged), each read once",
      );
    },
  },
];
