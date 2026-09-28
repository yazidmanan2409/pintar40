/**
 * BOB-17 (D-011; audit M7) — RELEASE BLOCKERS SPEAK IN CODES, read from their
 * sources. The behaviour is proved in the database by F12-P04
 * (selftest/db/fable12.sql); this file proves that the catalogue Daisy builds
 * the Terbit step on (src/lib/terbitan-kontrak.ts) is exactly the database's,
 * that every code has its words, and that a sentence can never reach the step.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

/** The newest migration that (re)defines a function, and that definition's body. */
function definisiTerakhir(root: string, fungsi: string): { berkas: string; badan: string } | null {
  const dir = join(root, "supabase", "migrations");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort().reverse()) {
    const sql = readFileSync(join(dir, f), "utf8").replace(/--[^\n]*/g, "");
    const m = new RegExp(`create (?:or replace )?function public\\.${fungsi}\\([\\s\\S]*?\\$\\$;`).exec(sql);
    if (m) return { berkas: f, badan: m[0] };
  }
  return null;
}

export const bob17Tests: SelfTest[] = [
  {
    id: "BOB17-K01",
    run: async (ctx) => {
      const c = new Checks();
      const k = (await import("../src/lib/terbitan-kontrak")) as Record<string, unknown>;
      const { t, LOCALES } = await import("../src/lib/hle");
      const KODE = (k.KODE_HAMBATAN ?? []) as readonly string[];
      const MENAHAN = (k.HAMBATAN_MENAHAN ?? []) as readonly string[];
      const POLA = (k.POLA_MUTU_SOAL ?? []) as readonly string[];
      const kalimat = k.kalimatHambatan as ((h: unknown, s: (x: string) => string, n: (x: number) => string) => string) | undefined;
      const kesiapanDari = k.kesiapanDari as ((h: unknown[]) => string) | undefined;
      c.expect(KODE.length > 0 && typeof kalimat === "function" && typeof kesiapanDari === "function",
        "the release contract has no blocker catalogue (KODE_HAMBATAN, kalimatHambatan, kesiapanDari)");

      // 1. the codes the database can return are exactly the catalogue's
      const pr = definisiTerakhir(ctx.repoRoot, "publish_readiness");
      const ps = definisiTerakhir(ctx.repoRoot, "studio_package_state");
      const dariDb = new Set([...`${pr?.badan ?? ""}\n${ps?.badan ?? ""}`.matchAll(/'(READINESS_[A-Z_]+)'/g)].map((m) => m[1]));
      c.expect(JSON.stringify([...dariDb].sort()) === JSON.stringify([...KODE].sort()),
        `publish_readiness (${pr?.berkas}) and studio_package_state (${ps?.berkas}) return ${JSON.stringify([...dariDb].sort())}; ` +
        `the catalogue names ${JSON.stringify([...KODE].sort())}`);
      // and neither writes a sentence of its own
      for (const [nama, d] of [["publish_readiness", pr], ["studio_package_state", ps]] as const) {
        c.expect(!/temuan|belum|bagian isi|paket ini|mutu soal:/i.test(d?.badan ?? ""), `${nama} (${d?.berkas}) still writes a sentence`);
      }
      // the codes that block are the ones the database blocks on
      const menahanDb = [...(/in \(([^)]*)\)\) then 'BLOCKED'/.exec(pr?.badan ?? "")?.[1] ?? "")
        .matchAll(/'(READINESS_[A-Z_]+)'/g)].map((m) => m[1]);
      if (/'READINESS_RETURNED'[\s\S]{0,200}v_status := 'BLOCKED'/.test(ps?.badan ?? "")) menahanDb.push("READINESS_RETURNED");
      c.expect(JSON.stringify(menahanDb.sort()) === JSON.stringify([...MENAHAN].sort()),
        `the database blocks on ${JSON.stringify(menahanDb)}; the catalogue's HAMBATAN_MENAHAN is ${JSON.stringify(MENAHAN)}`);
      if (kesiapanDari) {
        c.expect(kesiapanDari([]) === "READY" && kesiapanDari([{ code: "READINESS_TEXT_WARNING" }]) === "ACTION_REQUIRED"
          && kesiapanDari([{ code: "READINESS_TEXT_WARNING" }, { code: "READINESS_ITEM_ERROR" }]) === "BLOCKED",
          "kesiapanDari does not decide as the database does");
      }

      // 2. every code and pattern has its words in both languages, and never the machinery
      const MESIN = /READINESS_|ERROR|WARNING|[A-Z]{3,}_[A-Z_]+|jsonb|uuid|lesson_id/;
      const kunci = [...KODE.map((x) => `studio.hambatan.${x.toLowerCase()}`), "studio.hambatan.lain", "studio.hambatan.pelajaran",
        ...POLA.map((x) => `studio.hambatan.pola.${x.toLowerCase()}`), "studio.hambatan.pola.lain"];
      for (const key of kunci) {
        for (const l of LOCALES) {
          let s = "";
          try { s = t(key as never, "staff", { locale: l }); } catch { s = ""; }
          c.expect(s.trim() !== "" && s !== key, `${key} has no ${l} words`);
          c.expect(!MESIN.test(s), `${key} names the machinery in ${l}: ${s.slice(0, 60)}`);
        }
      }

      // 3. a planted sentence never reaches the Terbit step: whatever arrives as a
      //    blocker, the line is the copy table's
      if (kalimat) {
        const s = (x: string) => t(x as never, "staff", { locale: "id" });
        const n = (x: number) => String(x);
        const lain = s("studio.hambatan.lain");
        for (const tanam of [
          { code: "2 temuan ERROR pada teks siswa" },
          "mutu soal: STEM_REVEALS_ANSWER (1 soal)",
          { code: "READINESS_ITEM_ERROR", count: 1, pattern: "POLA_YANG_BELUM_ADA", lesson: "Pecahan" },
        ] as unknown[]) {
          const baris = kalimat(tanam, s, n);
          c.expect(!/temuan|ERROR|mutu soal:|STEM_REVEALS_ANSWER|POLA_YANG_BELUM_ADA/.test(baris),
            `a planted blocker ${JSON.stringify(tanam)} reached the step as "${baris}"`);
        }
        c.expect(kalimat({ code: "2 temuan ERROR pada teks siswa" }, s, n) === lain, "an unknown code does not show the general line");
        c.expect(kalimat({ code: "READINESS_ITEM_WARNING", count: 3, pattern: "STEM_REVEALS_ANSWER", lesson: "Pecahan Senilai" }, s, n)
          === `3 ${s("studio.hambatan.readiness_item_warning")} (${s("studio.hambatan.pola.stem_reveals_answer")}) · ${s("studio.hambatan.pelajaran")} Pecahan Senilai`,
          "a known blocker's line is not its count, words, pattern and lesson");
      }

      // 4. the Terbit step and the package page draw every blocker through the catalogue
      const baca = (...p: string[]) => readFileSync(join(ctx.repoRoot, ...p), "utf8");
      const langkah = baca("src", "components", "studio", "LangkahTerbit.tsx");
      const paket = baca("src", "app", "studio", "paket", "[course]", "page.tsx");
      c.expect(/h\.hambatan\.map\([^)]*\)\s*=>\s*<li[^>]*>\{kalimatHambatan\(/.test(langkah) && !/\{x\}<\/li>/.test(langkah),
        "the Terbit step (src/components/studio/LangkahTerbit.tsx) shows a blocker other than through kalimatHambatan");
      c.expect(/state\.reasons\.map\([\s\S]{0,200}?kalimatHambatan\(/.test(paket) && !/\{r\}<\/li>/.test(paket),
        "the package page shows a reason other than through kalimatHambatan");

      // 5. the four release form actions no page used are gone
      const aksi = baca("src", "app", "studio", "actions.ts");
      for (const nama of ["createReleaseAction", "freezeReleaseAction", "publishReleaseAction", "withdrawReleaseAction"]) {
        c.expect(!new RegExp(`\\b${nama}\\b`).test(aksi), `src/app/studio/actions.ts still exports ${nama}`);
      }

      return c.verdict(
        `the ${KODE.length} codes publish_readiness and studio_package_state (in the source file ${pr?.berkas}) can return are ` +
        "exactly the catalogue in src/lib/terbitan-kontrak.ts, neither function writes a sentence, and the codes that block " +
        "are the ones the database blocks on; every code and pattern has its words in both languages naming no machinery; a " +
        "planted sentence, a bare string and an unknown pattern each render as the copy table's line, never themselves; the " +
        "Terbit step and the package page draw every blocker through kalimatHambatan; the four unused release form actions are gone",
      );
    },
  },
];
