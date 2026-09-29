/**
 * BOB-41 (post-login review #6, D-061) -- A QUESTION-HEALTH REVIEW CAN BE
 * CONCLUDED. Bank Soal drew its form only at SIGNAL_RAISED and offered three
 * decisions there, two of which question_health_transitions refuses from
 * SIGNAL_RAISED; after UNDER_REVIEW no form was drawn, so ACKNOWLEDGED_OK and
 * ACTION_TAKEN were unreachable. And the list was the latest 40 items, so an
 * older flagged item might never be shown.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const tanpaKomentar = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
const PENINJAU = ["UNDER_REVIEW", "ACKNOWLEDGED_OK", "ACTION_TAKEN"];

export const bob41Tests: SelfTest[] = [
  {
    id: "BOB41-K01",
    run: async (ctx) => {
      const c = new Checks();
      let mod: Record<string, unknown> | null = null;
      try { mod = (await import("../src/lib/kesehatan-soal")) as Record<string, unknown>; } catch { mod = null; }
      const pilihan = mod?.pilihanTinjauan as ((s: string | null) => string[]) | undefined;

      // the transition table, read from the migration that defines it
      const mig = readFileSync(join(ctx.repoRoot, "supabase", "migrations", "20260912200213_views_aggregates_question_health.sql"), "utf8");
      const blok = /insert into public\.question_health_transitions values([\s\S]*?);/.exec(mig)?.[1] ?? "";
      const sah = new Set([...blok.matchAll(/\('([A-Z_]+)','([A-Z_]+)'/g)].map((m) => `${m[1]}>${m[2]}`));
      c.expect(sah.size === 9, `the transition table read as ${sah.size} transitions, expected 9`);

      if (c.expect(typeof pilihan === "function", "the page offers the same three decisions at every state: src/lib/kesehatan-soal.ts has no pilihanTinjauan")) {
        // 1. offered = exactly the reviewer's legal transitions from each state
        for (const st of ["INSUFFICIENT_EVIDENCE", "OBSERVING", "SIGNAL_RAISED", "UNDER_REVIEW", "ACKNOWLEDGED_OK", "ACTION_TAKEN"]) {
          const harap = PENINJAU.filter((to) => sah.has(`${st}>${to}`));
          const dapat = pilihan!(st);
          c.expect(JSON.stringify([...dapat].sort()) === JSON.stringify([...harap].sort()),
            `at ${st} the page offers ${JSON.stringify(dapat)}; the database allows the reviewer ${JSON.stringify(harap)}`);
        }
        c.expect(JSON.stringify(pilihan!("UNDER_REVIEW")) === JSON.stringify(["ACKNOWLEDGED_OK", "ACTION_TAKEN"]),
          "an item at UNDER_REVIEW cannot be concluded from the page");
        c.expect(pilihan!(null).length === 0, "an item with no health record is offered a review");
      }

      // 2. the page draws the form from those choices, and lists every waiting item whatever its age
      const hal = tanpaKomentar(readFileSync(join(ctx.repoRoot, "src", "app", "studio", "bank", "page.tsx"), "utf8"));
      c.expect(!/h\.state === "SIGNAL_RAISED"/.test(hal), "the review form is still drawn only at SIGNAL_RAISED");
      c.expect(/const pilihan = pilihanTinjauan\(h\?\.state\);/.test(hal) && /\{pilihan\.map\(\(p\) => \(/.test(hal),
        "the form's decisions are not the ones legal from the item's state");
      c.expect(/\.in\("state", \[\.\.\.SEDANG_DITINJAU\]\)\.in\("institution_id", mayReview\.map\(\(m\) => m\.id\)\)/.test(hal)
          && /const items = \[\.\.\.baru, \.\.\.\(lama \?\? \[\]\)\];/.test(hal),
        "an item waiting on a reviewer that is older than the latest 40 is not listed");
      c.expect(!/\.limit\(200\)/.test(hal) && /\.in\("item_id", items\.map\(\(i\) => i\.id\)\)/.test(hal),
        "health is read from the first 200 rows rather than for the items shown");
      // 3. preserved: the latest 40 are still listed, and the copy is the existing copy
      c.expect(/\.order\("created_at", \{ ascending: false \}\)\.limit\(40\)/.test(hal), "the latest 40 items are no longer listed");
      for (const k of ["studio.bank.kesehatan", "studio.bank.akui_ok", "studio.bank.tindakan"]) {
        c.expect(hal.includes(`"${k}"`), `the review no longer uses the existing copy ${k}`);
      }

      return c.verdict(
        "pilihanTinjauan, executed at each of six states, offers exactly the reviewer's transitions the migration's " +
          "question_health_transitions allows: taking it up at SIGNAL_RAISED, concluding it (ACKNOWLEDGED_OK or ACTION_TAKEN) at " +
          "UNDER_REVIEW, nothing elsewhere; Bank Soal draws its form from those, lists every item at SIGNAL_RAISED or UNDER_REVIEW " +
          "in the reviewer's schools whatever its age besides the latest 40, reads health for exactly the items shown, and uses " +
          "the existing copy",
      );
    },
  },
];
