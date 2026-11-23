/**
 * Z · D-6 (R-17; ruling 55; Bob 23 Nov, all nine dark): THE ANONYMOUS FEEDBACK ROUND IS DARK, AND NOTHING IS DELETED.
 *
 *   Z-D6-01  On the migrated world: none of the nine feedback RPCs is executable by authenticated or anon, all nine
 *            still exist with their registry rows, and service_role keeps its grant. The migration
 *            (20270123140000) only revokes and checks: no insert, update, delete, truncate, drop or alter, so no row is
 *            touched (and the feedback tables' counts are read and reported). In the app, UMPAN_BALIK_TERBUKA is false;
 *            the three entry points (Belajar's section and its read, the class page's link, Pimpinan's section) are
 *            drawn only when it is true, and the five round pages answer notFound() when it is false. The dormant
 *            logic stays proven by FABLE-07, which grants the nine for its own statement only. Red on 300.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { psql } from "./bob26.test";

export const UMPAN_BALIK_RPC = ["open_feedback_cycle", "submit_feedback", "close_feedback_cycle", "publish_feedback_question_set",
  "publish_feedback_threshold", "feedback_questionnaire", "my_feedback_cycles", "feedback_subjects_for_class", "feedback_result"] as const;

export const zD6Tests: SelfTest[] = [
  {
    id: "Z-D6-01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const daftar = UMPAN_BALIK_RPC.map((f) => `'${f}'`).join(", ");
      const hak = psql(`select coalesce(string_agg(p.proname || ':' || has_function_privilege('authenticated', p.oid, 'execute') || ':' || has_function_privilege('anon', p.oid, 'execute')
                 || ':' || has_function_privilege('service_role', p.oid, 'execute'), ',' order by p.proname), '')
                  from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in (${daftar})`).split(",").filter(Boolean);
      c.expect(hak.length === 9, `${hak.length} of the nine feedback functions exist (nothing is to be dropped)`);
      const terbuka = hak.filter((x) => /:true:|^[a-z_]+:true/.test(x.replace(/:(true|false)$/, "")));
      c.expect(terbuka.length === 0, `still executable by a client: ${terbuka.join(", ")}`);
      const layanan = hak.filter((x) => !x.endsWith(":true"));
      c.expect(layanan.length === 0, `service_role lost its grant on: ${layanan.join(", ")}`);
      const reg = Number(psql(`select count(*) from public.client_rpc_registry where function_name in (${daftar})`));
      c.expect(reg === 9, `${reg} of the nine registry rows remain (unchanged)`);
      const hitung = psql(`select string_agg(c.relname || ':' || (xpath('/row/n/text()', query_to_xml('select count(*) as n from public.' || quote_ident(c.relname), false, true, '')))[1]::text, ',' order by c.relname)
                             from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and c.relname like 'feedback%'`);
      // the migration only revokes and checks
      const mig = readFileSync(join(repoRoot, "supabase", "migrations", "20270123140000_the_anonymous_feedback_round_is_dark.sql"), "utf8")
        .split("\n").filter((x) => !x.trimStart().startsWith("--")).join("\n");
      c.expect(!/\b(insert|update|delete|truncate|drop|alter|create)\b/i.test(mig), "the D-6 migration writes or changes something other than grants");
      c.expect((mig.match(/revoke execute on function public\./g) ?? []).length === 9, "the D-6 migration does not revoke all nine");
      // the app: dark by one flag; links drawn only when it is true, the round pages answer notFound()
      const baca = (...p: string[]) => readFileSync(join(repoRoot, ...p), "utf8");
      c.expect(/export const UMPAN_BALIK_TERBUKA = false;/.test(baca("src", "lib", "umpanbalik-kontrak.ts")), "UMPAN_BALIK_TERBUKA is not false");
      const belajar = baca("src", "app", "belajar", "page.tsx");
      c.expect(/const umpanBalik = UMPAN_BALIK_TERBUKA \? \(\(await ub\.siklusSaya\(\)\) \?\? \[\]\) : \[\];/.test(belajar), "Belajar still reads the learner's rounds while dark");
      c.expect(/\{UMPAN_BALIK_TERBUKA \? \(\s*<Link className="pin-btn" href=\{`\/mengajar\/\$\{id\}\/umpan-balik`\}>/.test(baca("src", "app", "mengajar", "[kelas]", "page.tsx")),
        "the class page's link is not held by UMPAN_BALIK_TERBUKA");
      c.expect(/\{UMPAN_BALIK_TERBUKA \? \(\s*<section className="pin-sec" aria-labelledby="pin-ub">/.test(baca("src", "app", "pimpinan", "[simpul]", "page.tsx")),
        "Pimpinan's section is not held by UMPAN_BALIK_TERBUKA");
      const halaman = [["belajar", "umpan-balik", "[siklus]"], ["mengajar", "[kelas]", "umpan-balik"], ["pimpinan", "[simpul]", "umpan-balik"],
        ["pimpinan", "[simpul]", "umpan-balik", "[siklus]"], ["pimpinan", "[simpul]", "umpan-balik", "kelas", "[kelas]"]];
      const tanpa = halaman.filter((h) => !/export default async function \w+\([\s\S]*?\) \{\n {2}\/\/ Z D-6[^\n]*\n {2}if \(!UMPAN_BALIK_TERBUKA\) notFound\(\);/.test(baca("src", "app", ...h, "page.tsx")));
      c.expect(tanpa.length === 0, `round pages that do not answer notFound() while dark: ${tanpa.map((h) => h.join("/")).join(", ")}`);
      return c.verdict(`the nine (${UMPAN_BALIK_RPC.join(", ")}) exist, with their registry rows, executable by service_role only; the migration only revokes and checks, so no row is touched (feedback tables: ${hitung}); UMPAN_BALIK_TERBUKA is false, Belajar reads nothing, the class page's link and Pimpinan's section are held by it, and the five round pages answer notFound()`);
    },
  },
];
