/**
 * W3 (R1) -- WHAT THE LEARNER SEES CHOSEN IS WHAT IS HANDED IN.
 *
 * In the Uji Penguasaan a choice is taken with «Simpan jawaban ini». A choice
 * left unsaved was silently dropped at «Kumpulkan», with no confirmation, and a
 * reload opened question 1 (journey cross-check W3). This executes the rule the
 * player now follows at «Kumpulkan» and on opening, then checks the player is
 * wired to it: the unsaved choices go through the same outbox before anything
 * is sent, and «Kumpulkan» asks the question written for it first.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

export const w3Tests: SelfTest[] = [
  {
    id: "W3-K01",
    run: async (ctx) => {
      const c = new Checks();
      const m = (await import("../src/lib/kumpulkan")) as typeof import("../src/lib/kumpulkan");
      const kertas = ["q1", "q2", "q3", "q4", "q5", "q6"];

      // 1. what «Kumpulkan» takes: every choice on screen that is not the latest taken answer
      const pilihan = {
        q1: { posisi: 1 },          // saved, unchanged
        q2: { posisi: 2 },          // chosen, never saved
        q3: { posisi: 4 },          // saved 3, then changed to 4 on screen and not saved
        q4: { posisi: 1 },          // saved while offline: held in the outbox, the same choice
        q5: { posisi: [3, 1] },     // several options, saved as [1, 3]
        q6: { posisi: 2 },          // saved 1 offline (outbox), then changed to 2 and not saved
      };
      const diterima = { q1: { posisi: 1 }, q3: { posisi: 3 }, q5: { posisi: [1, 3] } };
      const tertahan = [
        { presentedItemId: "q4", clientSeq: 1, value: { posisi: 1 } },
        { presentedItemId: "q6", clientSeq: 1, value: { posisi: 1 } },
      ];
      const ambil = m.belumDisimpan(kertas, pilihan, diterima, tertahan);
      const kata = JSON.stringify(ambil);
      c.expect(ambil.some((u) => u.presentedItemId === "q2" && m.sameAnswer(u.value, { posisi: 2 })),
        `a choice never saved is dropped at «Kumpulkan» (taken: ${kata})`);
      c.expect(ambil.some((u) => u.presentedItemId === "q3" && m.sameAnswer(u.value, { posisi: 4 })),
        `a saved answer changed on screen is handed in as the old one (taken: ${kata})`);
      c.expect(ambil.some((u) => u.presentedItemId === "q6" && m.sameAnswer(u.value, { posisi: 2 })),
        `a change made after an offline save is handed in as the held one (taken: ${kata})`);
      c.expect(!ambil.some((u) => ["q1", "q4", "q5"].includes(u.presentedItemId)),
        `an answer already taken (saved, held in the outbox, or the same options in another order) is taken twice (taken: ${kata})`);
      c.expect(ambil.map((u) => u.presentedItemId).join(",") === "q2,q3,q6", `not in paper order: ${kata}`);
      c.expect(m.belumDisimpan(kertas, {}, diterima, tertahan).length === 0, "with nothing on screen something is taken");
      // the newest held entry is the one that counts
      c.expect(m.belumDisimpan(["q7"], { q7: { posisi: 2 } }, {}, [
        { presentedItemId: "q7", clientSeq: 2, value: { posisi: 2 } },
        { presentedItemId: "q7", clientSeq: 1, value: { posisi: 1 } },
      ]).length === 0, "an older outbox entry is read as the learner's latest answer");

      // 2. where an opened test starts
      c.expect(m.soalAwal(kertas, {}) === 0, "a new test does not open at question 1");
      c.expect(m.soalAwal(kertas, { q1: { posisi: 1 }, q2: { posisi: 2 } }) === 2, "a reload does not open the first question without a saved answer");
      c.expect(m.soalAwal(kertas, { q1: { posisi: 1 }, q3: { posisi: 2 } }) === 1, "a skipped question is passed over on reload");
      c.expect(m.soalAwal(kertas, Object.fromEntries(kertas.map((k) => [k, { posisi: 1 }]))) === kertas.length - 1,
        "with every question answered a reload does not open where «Kumpulkan» is");
      c.expect(m.soalAwal([], {}) === 0, "an empty paper opens out of range");

      // 3. the wiring
      const buang = (x: string) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
      const ip = buang(readFileSync(join(ctx.repoRoot, "src", "app", "belajar", "_components", "ItemPlayer.tsx"), "utf8"));
      const fin = /const finish = useCallback\(async \(\) => \{([\s\S]*?)\n {2}\}, \[/.exec(ip)?.[1] ?? "";
      c.expect(fin.length > 0, "the player's finish() was not found");
      const takeAt = fin.search(/for \(const u of belumDisimpan\(paper\.map\(\(p\) => p\.presentedItemId\), draft, accepted, readEntries\(sessionId\)\)\) \{\s*putEntry\(sessionId, \{ presentedItemId: u\.presentedItemId, clientSeq: nextSeq\(u\.presentedItemId\), value: u\.value \}\);/);
      const flushAt = fin.indexOf("await flush()");
      c.expect(takeAt >= 0 && flushAt > takeAt,
        "«Kumpulkan» does not take the unsaved choices into the outbox, with a fresh seq, before it replays and finishes");
      c.expect(/useState\(\(\) => soalAwal\(paper\.map\(\(p\) => p\.presentedItemId\), props\.accepted\)\)/.test(ip),
        "the player still opens at question 1 on a reload");
      c.expect(/t\("posttest\.submit_confirm", "learner"\)/.test(ip), "«Kumpulkan» hands the test in without asking first");
      const tanya = /\{formal && asking && \(([\s\S]*?)\n {6}\)\}/.exec(ip)?.[1] ?? "";
      c.expect(/onClick=\{\(\) => void finish\(\)\}/.test(tanya) && /t\("posttest\.submit", "learner"\)/.test(tanya),
        "the confirmation's own «Kumpulkan» is not what hands the test in");
      c.expect(/onClick=\{\(\) => \{ setNotice\(null\); setAsking\(true\); \}\}/.test(ip),
        "the post-test's «Kumpulkan» does not ask first");
      c.expect(!/function sameAnswer/.test(ip), "the player keeps its own copy of the answer comparison");

      return c.verdict(
        "at «Kumpulkan» every choice on screen that is not the learner's latest taken answer (never saved, changed after " +
          "a save, or changed after an offline save) is taken, in paper order, and nothing already taken is taken twice " +
          "(several options in any order are one answer; the newest outbox entry counts); the player puts those into the " +
          "outbox with a fresh seq before it replays and finishes, «Kumpulkan» first asks posttest.submit_confirm and only " +
          "its own «Kumpulkan» hands in; an opened test starts at the first question without a saved answer, and at the " +
          "last when all are answered",
      );
    },
  },
];
