/**
 * BOB-03 — THE RELEASE PATH, read from its sources. The behaviour is proved in
 * the database by selftest/db/fable12.sql (F12-*); what this file proves is
 * that the contract Daisy builds on, the copy table, the Studio actions and
 * the teacher's release list agree with the migration.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, LOCALES } from "../src/lib/hle";
import { KODE_TERBITAN_DB, LANGKAH_TERBITAN, kunciKodeTerbitan, type KodeTerbitan } from "../src/lib/terbitan-kontrak";

const MIGRASI = "20261009100000_a_course_is_released.sql";

export const terbitanTests: SelfTest[] = [
  {
    // =======================================================================
    // BOB03-K01 — ONE CONTRACT, FROM THE DATABASE TO THE BUTTON.
    // =======================================================================
    id: "BOB03-K01",
    run: async (ctx) => {
      const c = new Checks();
      const sql = readFileSync(join(ctx.repoRoot, "supabase", "migrations", MIGRASI), "utf8").replace(/--[^\n]*/g, "");

      // the codes release_refuse raises are exactly the contract's
      const tolak = /create function public\.release_refuse[\s\S]*?\$\$;/.exec(sql)?.[0] ?? "";
      const dariDb = [...tolak.matchAll(/when '([A-Z_]+)'/g)].map((m) => m[1]).sort();
      c.expect(JSON.stringify(dariDb) === JSON.stringify([...KODE_TERBITAN_DB].sort()),
        `release_refuse raises ${dariDb.join(",")} and the contract names ${KODE_TERBITAN_DB.join(",")}`);
      const dipakai = new Set([...sql.matchAll(/release_refuse\('([A-Z_]+)'\)|detail\s*=\s*'([A-Z_]+)'/g)].map((m) => m[1] ?? m[2]));
      c.expect(/errcode = 'PR040',\s*detail\s*=\s*'RELEASE_NOT_READY'/.test(
        /function public\.enforce_release_publish_readiness[\s\S]*?\$\$;/.exec(sql)?.[0] ?? ""),
        "the readiness trigger no longer refuses as PR040 RELEASE_NOT_READY");
      for (const k of KODE_TERBITAN_DB) c.expect(dipakai.has(k), `the contract names ${k} and no release function raises it`);
      c.expect(/'code', 'RELEASE_NOT_READY'/.test(sql), "freeze_release no longer returns RELEASE_NOT_READY as a result");

      // every code has a sentence in both languages, and never the machinery
      const MESIN = /RELEASE_|PR0\d\d|jsonb|uuid|plp_|SQLSTATE|FROZEN|PUBLISHED|APPROVED|CAN_/;
      const semua: KodeTerbitan[] = [...KODE_TERBITAN_DB, "RELEASE_INPUT_INVALID", "RELEASE_FAILED"];
      for (const k of semua) {
        for (const l of LOCALES) {
          let s = "";
          try { s = t(kunciKodeTerbitan(k), "staff", { locale: l }); } catch { s = ""; }
          c.expect(s.trim() !== "" && s !== kunciKodeTerbitan(k), `${k} has no ${l} telling`);
          c.expect(!MESIN.test(s), `${k} names the machinery in ${l}: ${s.slice(0, 60)}`);
        }
      }

      // each step's typed action calls its function with the declared argument
      const aksi = readFileSync(join(ctx.repoRoot, "src", "app", "studio", "actions.ts"), "utf8");
      const argumen: Record<string, string> = {
        create_release: "p_course", freeze_release: "p_release", publish_release: "p_release", withdraw_release: "p_release",
      };
      for (const l of LANGKAH_TERBITAN) {
        c.expect(new RegExp(`export async function ${l.aksi}\\(`).test(aksi), `the typed action ${l.aksi} is missing`);
        c.expect(new RegExp(`rpc\\("${l.fungsi}", \\{ ${argumen[l.fungsi]}:`).test(aksi),
          `no action calls ${l.fungsi} with ${argumen[l.fungsi]}`);
        c.expect(new RegExp(`create (?:or replace )?function public\\.${l.fungsi}\\(${argumen[l.fungsi]} uuid`).test(sql),
          `${l.fungsi} does not take ${argumen[l.fungsi]} as the migration declares it`);
        const at = sql.indexOf(`function public.${l.fungsi}(`);
        const body = at < 0 ? "" : sql.slice(at, sql.indexOf("end $$;", at));
        c.expect(body.includes(`can_in_institution('${l.kemampuan}'`),
          `${l.fungsi} does not check ${l.kemampuan}, which the contract says it needs`);
      }
      // and nothing in the Studio writes a release row itself
      c.expect(!/from\("plp_releases"\)\s*\.(?:insert|update|upsert|delete)\(/.test(aksi),
        "a Studio action writes plp_releases directly instead of through the release functions");

      // the teacher's list offers PUBLISHED releases only, never a withdrawn one
      const pengajar = readFileSync(join(ctx.repoRoot, "src", "lib", "pengajar.ts"), "utf8");
      const terbitan = /export async function terbitan\([\s\S]*?\n\}/.exec(pengajar)?.[0] ?? "";
      c.expect(/\.eq\("status", "PUBLISHED"\)/.test(terbitan), "the teacher's release list does not filter to PUBLISHED");

      return c.verdict(
        `the ${KODE_TERBITAN_DB.length} codes release_refuse raises are the contract's and each is raised; all ` +
        `${semua.length} codes have a sentence in both languages without machinery words; the ${LANGKAH_TERBITAN.length} ` +
        "steps' typed actions in the source file src/app/studio/actions.ts call create_release, freeze_release, " +
        "publish_release and withdraw_release with their declared argument, each function checks the capability the " +
        "contract names, no Studio action writes plp_releases itself, and the teacher's list in src/lib/pengajar.ts " +
        "reads PUBLISHED releases only");
    },
  },
];
