/**
 * COLGRANT-S01 -- WHAT THE APP SELECTS, THE SIGNED-IN USER MAY READ.
 *
 * Some tables give `authenticated` a grant per column, not on the table
 * (assessment_sessions among them). A column added later is not in that grant,
 * and a select that names it fails as a whole under the user's own session:
 * the teacher's learner record lost every result that way when M3 read
 * assessment_sessions.pass_mark (walk S22, audit run 36942147694). Nothing
 * static caught it, because the column exists and the types allow it.
 *
 *   COLGRANT-S01  db: for every table where `authenticated` holds column grants
 *                 but no table grant, every plain column a `.from("<table>")
 *                 .select("…")` in src/ names is one it may select
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { Checks, type SelfTest } from "./lib";

function berkas(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? berkas(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
}

/** The plain columns of a PostgREST select list: no embedded relation, no `*`, alias and cast removed. */
export function kolomPilihan(daftar: string): string[] {
  const out: string[] = [];
  let depth = 0, cur = "";
  for (const ch of daftar) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter((x) => x && !x.includes("(") && x !== "*")
    .map((x) => x.split(":").pop()!.split("::")[0].trim()).filter((x) => /^[a-z_][a-z0-9_]*$/.test(x));
}

export const kolomTests: SelfTest[] = [
  {
    id: "COLGRANT-S01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      const r = spawnSync("psql", ["-At", "-F", "\t", "-c", `
        select cp.table_name, string_agg(cp.column_name, ',')
          from information_schema.column_privileges cp
         where cp.table_schema = 'public' and cp.grantee = 'authenticated' and cp.privilege_type = 'SELECT'
           and not has_table_privilege('authenticated', format('%I.%I', cp.table_schema, cp.table_name), 'select')
         group by cp.table_name`, db], { encoding: "utf8" });
      if (!c.expect(r.status === 0, `the grants could not be read: ${(r.stderr || "").slice(0, 200)}`)) return c.verdict("");
      const boleh = new Map<string, Set<string>>();
      for (const l of r.stdout.trim().split("\n").filter(Boolean)) {
        const [t, cols] = l.split("\t");
        boleh.set(t, new Set(cols.split(",")));
      }
      c.expect(boleh.has("assessment_sessions"), "assessment_sessions no longer has a per-column grant; this test reads nothing then");

      let dibaca = 0;
      const salah: string[] = [];
      for (const f of berkas(join(repoRoot, "src"))) {
        const src = readFileSync(f, "utf8");
        for (const m of src.matchAll(/\.from\(\s*"([a-z_]+)"\s*\)\s*\.select\(\s*(["`])([\s\S]*?)\2/g)) {
          const tabel = m[1];
          const izin = boleh.get(tabel);
          if (!izin) continue;
          dibaca += 1;
          for (const k of kolomPilihan(m[3])) {
            if (!izin.has(k)) salah.push(`${relative(repoRoot, f)}: ${tabel}.${k}`);
          }
        }
      }
      c.expect(dibaca > 0, "no select of a per-column-granted table was found in src; the scan reads nothing");
      c.expect(salah.length === 0, `the app selects columns a signed-in user may not read, so the whole read fails: ${salah.join("; ")}`);
      return c.verdict(
        `read the live grants: ${[...boleh.keys()].sort().join(", ")} grant authenticated per column; every plain column of ` +
          `the ${dibaca} select(s) of those tables in src/ is one it may select`,
      );
    },
  },
];
