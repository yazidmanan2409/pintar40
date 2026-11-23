// Z9 ruling 84: a diagnostic-only patch for the throwaway branches claude/z9-diag-cand and claude/z9-diag-main.
import { readFileSync, writeFileSync } from "node:fs";
const must = (s, a, b, f) => { if (!s.includes(a)) throw new Error(`${f}: anchor not found: ${a.slice(0, 60)}`); return s.replace(a, b); };

// 1. c1w.test.ts: the C3W world (its body names 'c3-satu') prints each step's name and result, and the c1.* settings by
//    name, empty or set, both when it finishes and when it fails (the failing error's message too). Names and codes only.
let c = readFileSync("selftest/c1w.test.ts", "utf8");
c = must(c, `function skenario(badan: string[]): string {
  return \``, `const DIAG_C3W = (b: string[]) => b.join("\\n").includes("c3-satu");
const diagCetak = (tahap: string) => \`raise notice 'C1DIAG %', '\${tahap} steps=' || coalesce((select string_agg(k || '=' || left(coalesce(x, '<null>'), 300), ' ; ') from jsonb_each_text(v) t(k, x)), '<none>')
    || ' | settings(after-rollback-if-FAILED)=' || coalesce((select string_agg(name || ':' || case when coalesce(current_setting(name, true), '') = '' then 'EMPTY' else 'set' end, ',' order by name) from pg_settings where name like 'c1.%'), '<none>');\`;
function skenario(badan: string[]): string {
  const diag = DIAG_C3W(badan);
  return \``, "c1w.test.ts head");
c = must(c, `  perform pg_temp.c1_dunia();
  \${badan.join("\\n  ")}
  perform selftest.as_owner();
  insert into c1_snap values (v);`, `  perform pg_temp.c1_dunia();
  \${diag ? "begin" : ""}
  \${badan.join("\\n  ")}
  \${diag ? diagCetak("END") + " exception when others then perform selftest.as_owner(); " + diagCetak("FAILED") + " raise notice 'C1DIAG error sqlstate=% message=%', sqlstate, sqlerrm; raise; end;" : ""}
  perform selftest.as_owner();
  insert into c1_snap values (v);`, "c1w.test.ts body");
c = must(c, `  const pesan = (r.stderr || "").trim().split("\\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\\n").pop();`,
`  const pesan = (r.stderr || "").trim().split("\\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\\n").pop();
  for (const l of (r.stderr || "").split("\\n").filter((x) => x.includes("C1DIAG"))) console.log(\`[C1DIAG] \${l.replace(/^.*C1DIAG /, "")}\`);`, "c1w.test.ts jalankan");
writeFileSync("selftest/c1w.test.ts", c);

// 2. c3w-c3.test.ts: t_minta keeps ai_minta_draf's whole answer (the same single call) under c1.diag_minta
let t = readFileSync("selftest/c3w-c3.test.ts", "utf8");
t = must(t, `  langkah("t_minta", "guru", \`select set_config('c1.t_minta', (public.ai_minta_draf(\${G("d1")}, \${PELAJARAN}, 'Budi membeli lima apel di pasar.',
      'Membandingkan pecahan', 2, 'c3-satu', true) ->> 'permintaan'), true)\`),`,
`  langkah("diag_minta", "guru", \`select set_config('c1.diag_minta', (public.ai_minta_draf(\${G("d1")}, \${PELAJARAN}, 'Budi membeli lima apel di pasar.',
      'Membandingkan pecahan', 2, 'c3-satu', true))::text, true)\`),
  langkah("t_minta", null, \`select set_config('c1.t_minta', current_setting('c1.diag_minta', true)::jsonb ->> 'permintaan', true)\`),`, "c3w-c3.test.ts");
writeFileSync("selftest/c3w-c3.test.ts", t);
console.log("patched");
