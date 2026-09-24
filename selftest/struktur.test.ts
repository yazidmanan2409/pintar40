/**
 * BOB-01 — THE SCHOOL-STRUCTURE CONTRACT, STATICALLY (D-006, D-011, M5a).
 *
 * Added, not edited: these live in their own file so the whole ticket is
 * reviewable in one place and no case that existed before it is touched. The
 * behaviour is proved in the database by selftest/db/fable10.sql (F10-*); what
 * is proved here is the seam Daisy builds on -- that the codes the database
 * can raise, the codes the contract names and the sentences the screen shows
 * are the same set, that no database text can reach a result, and that the
 * actions call the functions by the argument names the migration declares.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, LOCALES, type HleEvent } from "../src/lib/hle";
import {
  KODE_STRUKTUR_DB,
  KUNCI_GALAT_STRUKTUR,
  kodeGalatStruktur,
  susunStruktur,
  tahunAjaranBaku,
  tahunAjaranPada,
  type KodeStruktur,
  type SimpulStruktur,
} from "../src/lib/struktur-kontrak";
import { MASALAH } from "../src/lib/pendataan-kontrak";

/** Every migration, in the order the database applies them. */
function migrations(repoRoot: string): Array<{ name: string; text: string }> {
  const dir = join(repoRoot, "supabase", "migrations");
  return readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
    .map((name) => ({ name, text: readFileSync(join(dir, name), "utf8") }));
}

/** The body of the LAST definition of a public function, as the database holds it. */
function latest(repoRoot: string, fn: string): { name: string; body: string } | null {
  let found: { name: string; body: string } | null = null;
  const head = new RegExp(`create (?:or replace )?function public\\.${fn}\\(`, "g");
  for (const m of migrations(repoRoot)) {
    for (const h of m.text.matchAll(head)) {
      const open = m.text.indexOf("$$", h.index!);
      const close = m.text.indexOf("$$", open + 2);
      if (open < 0 || close < 0) continue;
      found = { name: m.name, body: m.text.slice(h.index!, close + 2) };
    }
  }
  return found;
}

/** The parameter names of the last definition, in order. */
function params(repoRoot: string, fn: string): string[] {
  const d = latest(repoRoot, fn);
  if (!d) return [];
  const sig = /\(([^)]*)\)/.exec(d.body)?.[1] ?? "";
  return sig.split(",").map((a) => a.trim().split(/\s+/)[0]).filter(Boolean);
}

const STRUKTUR_FN = ["school_structure", "create_bagian", "create_tingkat", "create_kelas",
  "rename_school_node", "deactivate_school_node"] as const;

/** Words that belong to the database, never to a sentence on the screen. */
const MESIN = /STRUCTURE_|PR0\d\d|org_nodes|uuid|DEPARTMENT|COHORT|PROGRAMME|FACULTY|INSTITUTION_ADMIN|SYSTEM_ADMIN|jsonb|SQLSTATE|\bnode\b/;

export const strukturTests: SelfTest[] = [
  {
    // =======================================================================
    // BOB01-K01 — THE DATABASE'S CODES, THE CONTRACT'S CODES AND THE SCREEN'S
    // SENTENCES ARE ONE SET. A code the database raises and the contract does
    // not name would reach the screen as the generic failure; a code the
    // contract names that has no sentence would reach it as nothing. And the
    // six functions refuse ONLY through structure_refuse, so nothing they
    // raise can carry text the contract does not know.
    // =======================================================================
    id: "BOB01-K01",
    run: async (ctx) => {
      const c = new Checks();
      const refuse = latest(ctx.repoRoot, "structure_refuse");
      c.expect(refuse !== null, "no migration defines public.structure_refuse");
      const dbCodes = [...(refuse?.body ?? "").matchAll(/when '(STRUCTURE_[A-Z_]+)'/g)].map((m) => m[1]);
      c.expect(dbCodes.length >= 10, `${dbCodes.length} code(s) read from structure_refuse`);
      const named = new Set<string>(KODE_STRUKTUR_DB);
      for (const k of dbCodes) c.expect(named.has(k), `the database raises ${k} and the contract does not name it`);
      for (const k of named) c.expect(dbCodes.includes(k), `the contract names ${k} and the database never raises it`);
      c.expect(/errcode\s*=\s*'PR020'/.test(refuse?.body ?? "") && /detail\s*=\s*p_code/.test(refuse?.body ?? ""),
        "structure_refuse does not raise PR020 with the code in DETAIL");

      for (const fn of STRUKTUR_FN) {
        const d = latest(ctx.repoRoot, fn);
        c.expect(d !== null, `no migration defines public.${fn}`);
        const raw = (d?.body ?? "").replace(/--[^\n]*/g, "").match(/raise\s+(exception|notice|warning)/gi) ?? [];
        c.expect(raw.length === 0, `${fn} raises ${raw.length} time(s) outside structure_refuse`);
        c.expect(/security definer/i.test(d?.body ?? "") && /set search_path = public, pg_temp/.test(d?.body ?? ""),
          `${fn} is not SECURITY DEFINER with a pinned search_path`);
      }

      const all: KodeStruktur[] = [...KODE_STRUKTUR_DB, "STRUCTURE_INPUT_INVALID", "STRUCTURE_FAILED"];
      c.expect(Object.keys(KUNCI_GALAT_STRUKTUR).length === all.length,
        `${Object.keys(KUNCI_GALAT_STRUKTUR).length} copy key(s) for ${all.length} code(s)`);
      const seen = new Set<string>();
      for (const k of all) {
        const key = KUNCI_GALAT_STRUKTUR[k];
        c.expect(!!key, `${k} has no copy key`);
        if (!key) continue;
        c.expect(!seen.has(key), `${key} is the sentence for two codes`);
        seen.add(key);
        for (const l of LOCALES) {
          let s = "";
          try { s = t(key as HleEvent, "staff", { locale: l }); } catch { s = ""; }
          c.expect(s.trim().length > 0 && s !== key, `${key} has no ${l} telling`);
          const m = MESIN.exec(s);
          c.expect(m === null, `${key} names the machinery in ${l}: "${m?.[0]}"`);
        }
      }
      return c.verdict(
        `the ${dbCodes.length} codes structure_refuse raises (PR020, the code in DETAIL) are exactly the ` +
        `contract's KODE_STRUKTUR_DB; the six structure functions raise nothing else and are SECURITY DEFINER ` +
        `with a pinned search_path; all ${all.length} codes (with STRUCTURE_INPUT_INVALID and STRUCTURE_FAILED) ` +
        `have a distinct copy key that renders in both languages without naming the machinery`,
      );
    },
  },
  {
    // =======================================================================
    // BOB01-K02 — NO DATABASE TEXT REACHES A RESULT, AND THE ACTIONS CALL THE
    // FUNCTIONS BY THE NAMES THE MIGRATION DECLARES. The mapping is tried with
    // the shapes a real refusal takes and with the shapes an attacker or an
    // outage would; the action file is read for the one path database text
    // could take (error.message into a returned object or a redirect).
    // =======================================================================
    id: "BOB01-K02",
    run: async (ctx) => {
      const c = new Checks();
      const cases: Array<[Parameters<typeof kodeGalatStruktur>[0], KodeStruktur]> = [
        [{ code: "PR020", details: "STRUCTURE_NAME_TAKEN" }, "STRUCTURE_NAME_TAKEN"],
        [{ code: "PR020", details: "STRUCTURE_NOT_ALLOWED" }, "STRUCTURE_NOT_ALLOWED"],
        [{ code: "PR020", details: "STRUCTURE_HAS_STAFF" }, "STRUCTURE_HAS_STAFF"],
        [{ code: "PR020", details: "an active sibling already has this name" }, "STRUCTURE_FAILED"],
        [{ code: "PR020", details: "STRUCTURE_NAME_TAKEN; drop table x" }, "STRUCTURE_FAILED"],
        [{ code: "PR020", details: null }, "STRUCTURE_FAILED"],
        [{ code: "PR020" }, "STRUCTURE_FAILED"],
        [{ code: "P0001", details: "STRUCTURE_NAME_TAKEN" }, "STRUCTURE_FAILED"],
        [{ code: "42501", details: null }, "STRUCTURE_NOT_ALLOWED"],
        [{ code: "23505", details: "Key (name)=(1A) already exists." }, "STRUCTURE_FAILED"],
        [null, "STRUCTURE_FAILED"],
        [undefined, "STRUCTURE_FAILED"],
      ];
      for (const [e, want] of cases) {
        const got = kodeGalatStruktur(e);
        c.expect(got === want, `${JSON.stringify(e)} became ${got}, not ${want}`);
      }

      const aksi = readFileSync(join(ctx.repoRoot, "src", "app", "konfigurasi", "actions.ts"), "utf8");
      const mulai = aksi.indexOf("BOB-01: school structure");
      c.expect(mulai > 0, "the BOB-01 section of src/app/konfigurasi/actions.ts is missing");
      const bagian = aksi.slice(mulai).replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "");
      c.expect(!/redirect\(/.test(bagian), "a structure action redirects instead of returning its code");
      const bocor = [...bagian.matchAll(/error\??\.message/g)].length;
      const dicatat = [...bagian.matchAll(/console\.error\([^)]*error\??\.message/g)].length;
      c.expect(bocor === dicatat, `${bocor - dicatat} use(s) of error.message outside the server log`);
      c.expect(/return \{ ok: false, code, ref \}/.test(bagian) && /return \{ ok: false, code \}/.test(bagian),
        "the structure actions do not return { ok: false, code }");
      for (const [aksiName, fn] of [["buatBagianAksi", "create_bagian"], ["buatTingkatAksi", "create_tingkat"],
                                    ["buatKelasAksi", "create_kelas"], ["ubahNamaStrukturAksi", "rename_school_node"],
                                    ["nonaktifkanStrukturAksi", "deactivate_school_node"]] as const) {
        const m = new RegExp(`export async function ${aksiName}\\(_prev: HasilStruktur \\| null, fd: FormData\\): ` +
          `Promise<HasilStruktur> \\{([\\s\\S]*?)\\n\\}`).exec(bagian);
        c.expect(!!m, `${aksiName} is not shaped (prev, FormData) => Promise<HasilStruktur>`);
        const call = new RegExp(`struktur\\("${fn}", \\{([\\s\\S]*?)\\}\\)`).exec(m?.[1] ?? "");
        c.expect(!!call, `${aksiName} does not call ${fn}`);
        const sent = [...(call?.[1] ?? "").matchAll(/(p_[a-z_]+):/g)].map((x) => x[1]);
        const declared = params(ctx.repoRoot, fn);
        c.expect(sent.join(",") === declared.join(","),
          `${aksiName} sends {${sent.join(", ")}} and ${fn} declares (${declared.join(", ")})`);
      }
      const lib = readFileSync(join(ctx.repoRoot, "src", "lib", "struktur.ts"), "utf8");
      const read = /rpc\("school_structure", \{ (p_[a-z_]+):/.exec(lib);
      c.expect(read?.[1] === params(ctx.repoRoot, "school_structure")[0],
        "bacaStruktur does not call school_structure by its declared argument");
      c.expect(/^import "server-only";/m.test(lib), "src/lib/struktur.ts is importable from a client component");
      return c.verdict(
        `${cases.length} error shapes map to a code the contract names and never to the database's words ` +
        `(only PR020 with a known DETAIL is trusted; 42501 is not-allowed; everything else is STRUCTURE_FAILED); ` +
        `the five actions are (prev, FormData) => HasilStruktur, never redirect, keep error.message in the ` +
        `server log only, and send exactly the argument names the migration declares; bacaStruktur is server-only`,
      );
    },
  },
  {
    // =======================================================================
    // BOB01-K03 — THE TREE AND THE YEAR, AS THE SCREEN WILL USE THEM. The
    // year rule is the database's (F10-S05 asks the same cases of
    // create_tingkat), so a form that pre-checks with tahunAjaranBaku cannot
    // accept what the database refuses or refuse what it accepts.
    // =======================================================================
    id: "BOB01-K03",
    run: async () => {
      const c = new Checks();
      const row = (node_id: string, level: SimpulStruktur["level"], parent_id: string | null, name: string,
                   academic_year: string | null = null): SimpulStruktur =>
        ({ node_id, level, parent_id, name, academic_year, is_active: true, active_members: level === "BAGIAN" ? null : 0 });
      const pohon = susunStruktur([
        row("k10", "KELAS", "t1", "10A", "2026/2027"),
        row("b2", "BAGIAN", null, "Kelas Tinggi"),
        row("k2", "KELAS", "t1", "2A", "2026/2027"),
        row("t1", "TINGKAT", "b1", "Kelas 1", "2026/2027"),
        row("t10", "TINGKAT", "b1", "Kelas 10", "2026/2027"),
        row("t2", "TINGKAT", "b1", "Kelas 2", "2026/2027"),
        row("b1", "BAGIAN", null, "Kelas Rendah"),
        row("yatim", "KELAS", "hilang", "9Z", "2026/2027"),
      ]);
      c.expect(pohon.map((b) => b.node_id).join(",") === "b1,b2", `the Bagian came out ${pohon.map((b) => b.name).join(", ")}`);
      c.expect(pohon[0]?.tingkat.map((x) => x.name).join(",") === "Kelas 1,Kelas 2,Kelas 10",
        `the Tingkat are not in natural order: ${pohon[0]?.tingkat.map((x) => x.name).join(", ")}`);
      c.expect(pohon[0]?.tingkat[0]?.kelas.map((x) => x.name).join(",") === "2A,10A",
        "a Tingkat's Kelas are not under it in natural order");
      c.expect(JSON.stringify(pohon).indexOf("yatim") < 0, "a Kelas whose Tingkat is not in the list was shown");

      for (const [s, want] of [["2026/2027", "2026/2027"], [" 2026 / 2027 ", "2026/2027"], ["2026", null],
                               ["2026/2028", null], ["26/27", null], ["2026-2027", null], ["abcd/efgh", null],
                               ["", null], ["1999/2000", null], ["2098/2099", "2098/2099"], ["2099/2100", null]] as const) {
        c.expect(tahunAjaranBaku(s) === want, `"${s}" became ${tahunAjaranBaku(s)}, not ${want}`);
      }
      // 1 July starts the year, in Jakarta (UTC+7): 30 June 23:59 WIB is still the old one
      c.expect(tahunAjaranPada(new Date("2026-06-30T16:59:00Z")) === "2025/2026", "30 June 23:59 WIB is not 2025/2026");
      c.expect(tahunAjaranPada(new Date("2026-06-30T17:00:00Z")) === "2026/2027", "1 July 00:00 WIB is not 2026/2027");
      c.expect(tahunAjaranPada(new Date("2027-01-15T03:00:00Z")) === "2026/2027", "January is not the year that began in July");
      return c.verdict(
        "susunStruktur nests Kelas under Tingkat under Bagian in natural order (Kelas 2 before Kelas 10) and " +
        "drops a row whose parent is absent; tahunAjaranBaku accepts and refuses exactly the years the database " +
        "does (YYYY/YYYY+1 from 2000/2001 to 2098/2099); tahunAjaranPada starts the year on 1 July in Jakarta",
      );
    },
  },
  {
    // =======================================================================
    // BOB01-M01 — THE NEW INTAKE REFUSAL HAS A SENTENCE (M5a). The existing
    // guard reads the problem phrases of the ORIGINAL import_row_problems;
    // this one reads the definition the database now runs, so a phrase a
    // later migration adds cannot fall through to the generic sentence.
    // =======================================================================
    id: "BOB01-M01",
    run: async (ctx) => {
      const c = new Checks();
      const d = latest(ctx.repoRoot, "import_row_problems");
      c.expect(d !== null, "no migration defines public.import_row_problems");
      const frasa = [...(d?.body ?? "").matchAll(/to_jsonb\('([^']+)'::text\)/g)].map((m) => m[1]);
      c.expect(frasa.includes("a learner is placed in an active Kelas or Tingkat"),
        `the definition the database runs (${d?.name}) does not refuse a learner outside a Kelas or Tingkat`);
      for (const f of frasa) {
        const key = MASALAH[f];
        c.expect(key !== undefined, `import_row_problems can return "${f}" and the intake has no sentence for it`);
        if (!key) continue;
        for (const l of LOCALES) {
          const s = t(key as HleEvent, "staff", { locale: l });
          c.expect(s !== f && s.trim().length > 0, `${key} renders the database's own phrase in ${l}`);
        }
      }
      return c.verdict(
        `every one of the ${frasa.length} phrases the current import_row_problems (${d?.name}) can return, ` +
        `including M5a's "a learner is placed in an active Kelas or Tingkat", has its own sentence in both languages`,
      );
    },
  },
];
