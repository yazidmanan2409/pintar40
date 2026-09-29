/**
 * BOB-39 (post-login review #2, D-061) -- what the Studio says when a referral
 * is refused. record_integrity_review now raises the referral in the same
 * transaction, so a reviewer whose role does not reach the signal's class is
 * refused the whole review with refer_integrity_signal's refusal. That refusal
 * must reach the screen as an existing code, never as the database's words.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

export const bob39Tests: SelfTest[] = [
  {
    id: "BOB39-K01",
    run: async (ctx) => {
      const c = new Checks();
      const { kodeGalat } = await import("../src/lib/galat-kontrak");
      // the refusal, read from the migration that defines it, so a rewording fails here
      const mig = readFileSync(join(ctx.repoRoot, "supabase", "migrations", "20260924110000_pintar_proposes_a_human_decides.sql"), "utf8");
      const kalimat = /raise exception '(referring an integrity signal requires CAN_REVIEW_INTEGRITY[^']*)'/.exec(mig)?.[1];
      if (c.expect(Boolean(kalimat), "refer_integrity_signal's refusal could not be read from its migration")) {
        const kode = kodeGalat({ code: "P0001", message: kalimat! });
        c.expect(kode === "ACTION_NOT_ALLOWED", `a refused referral reaches the Studio as ${kode}, not the existing ACTION_NOT_ALLOWED`);
      }
      const aksi = readFileSync(join(ctx.repoRoot, "src", "app", "studio", "actions.ts"), "utf8");
      c.expect(/rpc\("record_integrity_review"[\s\S]{0,200}ditolak\("record_integrity_review", error\)/.test(aksi),
        "the integrity review's refusal does not go through ditolak's code (the database's words could reach the page)");
      return c.verdict(
        "refer_integrity_signal's refusal, read from its migration, is mapped by kodeGalat to the existing ACTION_NOT_ALLOWED, and the " +
          "Studio's integrity review passes every refusal through ditolak, so a referral outside the reviewer's reach shows the " +
          "Studio's existing not-allowed sentence and never the database's words",
      );
    },
  },
];
