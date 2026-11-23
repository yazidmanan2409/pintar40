/**
 * Z · V6 (R-25; Sharon VERIFY-58): THE PER-REQUEST SUSPENSION LAYER IS CHECKED AFTER EVERY PROMOTION.
 *
 *   Z-V6-01  Reads and runs scripts/release/after-promotion/v6-pre-request.sql: one read-only statement, no write. On
 *            the migrated world it prints OK (authenticator carries pgrst.db_pre_request = pintar_permintaan.periksa,
 *            and the function exists). On two plants, each inside a rolled-back transaction (ALTER ROLE is
 *            transactional), it names the difference: the setting removed, and the setting pointing elsewhere.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { psql } from "./bob26.test";

export const zV6Tests: SelfTest[] = [
  {
    id: "Z-V6-01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const sql = readFileSync(join(repoRoot, "scripts", "release", "after-promotion", "v6-pre-request.sql"), "utf8");
      const kode = sql.replace(/--[^\n]*/g, "");
      c.expect(!/\b(insert|update|delete|truncate|alter|drop|create|grant|revoke|set\s)\b/i.test(kode), "the check writes or changes something");
      const jalan = (tanam: string) => psql(`begin; ${tanam} ${kode.trim().replace(/;\s*$/, "")}; rollback;`).split("\n").filter((b) => b && !/^(BEGIN|ROLLBACK|ALTER ROLE)$/.test(b)).pop() ?? "";
      const asli = jalan("");
      c.expect(asli === "OK", `on the migrated world: ${asli} (expected OK)`);
      const hapus = jalan("alter role authenticator reset pgrst.db_pre_request;");
      c.expect(/authenticator has no pgrst\.db_pre_request/.test(hapus), `with the setting removed: ${hapus}`);
      const lain = jalan("alter role authenticator set pgrst.db_pre_request = 'public.lain';");
      c.expect(/is public\.lain, not pintar_permintaan\.periksa/.test(lain), `with the setting pointing elsewhere: ${lain}`);
      const sesudah = jalan("");
      c.expect(sesudah === "OK", `after the plants rolled back: ${sesudah}`);
      return c.verdict(`runs scripts/release/after-promotion/v6-pre-request.sql (read only): «${asli}» on the migrated world; «${hapus}» with the setting removed; «${lain}» with it pointing elsewhere; «${sesudah}» once both plants rolled back`);
    },
  },
];
