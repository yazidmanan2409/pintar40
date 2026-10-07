/**
 * BOB-32 (UX-03's server half, D-011) -- UJI CEPAT SAYS WHY A LAUNCH WAS REFUSED.
 *
 * `sediakanUjiCepat` sent every refusal of `launch_quick_assessment` to the
 * same `?cepat=gagal`, and the page could only say one sentence for all of
 * them. This reads every refusal the function can raise out of the migration
 * that defines it, drives each one through the mapper to its published code,
 * and holds the action to passing that code, with a logged reference for any
 * refusal nobody named.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

type Mod = Record<string, unknown>;

async function muat(path: string): Promise<Mod | null> {
  try {
    return (await import(path)) as Mod;
  } catch {
    return null;
  }
}

/** Every `raise exception '…'` sentence in the latest definition of launch_quick_assessment. */
function penolakan(repoRoot: string): { berkas: string; kalimat: string[] } {
  const dir = join(repoRoot, "supabase", "migrations");
  const berkas = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
    .filter((f) => /create (?:or replace )?function public\.launch_quick_assessment\(/i.test(readFileSync(join(dir, f), "utf8")))
    .pop() ?? "";
  const src = berkas ? readFileSync(join(dir, berkas), "utf8") : "";
  const i = src.search(/create (?:or replace )?function public\.launch_quick_assessment\(/i);
  const badan = i < 0 ? "" : src.slice(i, src.indexOf("end $function$;", i));
  const kalimat = [...badan.matchAll(/raise exception '((?:[^']|'')*)'/g)].map((m) => m[1].replace(/''/g, "'"));
  return { berkas, kalimat };
}

/** A refusal as the database words it: each % filled the way the function fills it. */
function isi(kalimat: string): string {
  let k = kalimat;
  for (const [ikuti, nilai] of [[" drawable", "2"], [" tier", "PRACTICE"], [" question quick", "5"]] as const) {
    k = k.replace(new RegExp(`%(?=${ikuti})`), nilai);
  }
  return k.replace(/%/g, "7");
}

// The ticket's causes, and what each refusal of the function must be read as.
const HARAP: ReadonlyArray<readonly [RegExp, string]> = [
  [/^this module has % drawable question/, "QUICK_BANK_TOO_SMALL"],
  [/^a quick assessment carries between 3 and 20 questions/, "QUICK_COUNT_OUT_OF_RANGE"],
  [/^a quick assessment runs between 5 and 60 minutes/, "QUICK_MINUTES_OUT_OF_RANGE"],
  [/^launching a quick assessment requires CAN_QUICK_ASSESSMENT/, "QUICK_NOT_ALLOWED"],
  [/^that module belongs to another institution/, "QUICK_NOT_ALLOWED"],
  [/^unknown class/, "QUICK_NOT_FOUND"],
  [/^unknown module/, "QUICK_NOT_FOUND"],
  [/^a quick assessment is launched for a class or cohort/, "QUICK_NOT_FOUND"],
  [/^no person in this session/, "QUICK_FAILED"],
  [/^QUICK has no mode policy row/, "QUICK_FAILED"],
  [/^the QUICK mode policy reaches the EXAM tier/, "QUICK_FAILED"],
  [/^too many quick assessments launched in this minute/, "QUICK_FAILED"],
];

/**
 * CR-84 (D-127, D-128 L2): every refusal of every database function a Studio form reaches through `ditolak`, from the
 * latest migration that defines it (and, for record_integrity_review, the referral it raises in the same transaction).
 */
function penolakanFungsi(repoRoot: string, fn: string): { berkas: string; tolak: Array<{ code: string; message: string; details: string | null }> } {
  const dir = join(repoRoot, "supabase", "migrations");
  const pola = new RegExp(`create (?:or replace )?function public\\.${fn}\\(`, "i");
  const berkas = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
    .filter((f) => pola.test(readFileSync(join(dir, f), "utf8"))).pop() ?? "";
  const src = berkas ? readFileSync(join(dir, berkas), "utf8") : "";
  const i = src.search(pola);
  const sisa = i < 0 ? "" : src.slice(i);
  const akhir = sisa.search(/\n\$(?:function)?\$;|\nend \$\$;|\nend;\s*\$\$;/);
  const badan = akhir < 0 ? sisa : sisa.slice(0, akhir);
  const tolak: Array<{ code: string; message: string; details: string | null }> = [];
  for (const m of badan.matchAll(/raise exception\s+(?:'((?:[^']|'')*)'|using\s+([^;]*))/gi)) {
    let message = m[1] ?? ""; let code = "P0001"; let details: string | null = null;
    if (m[2]) {
      code = /errcode\s*=\s*'([^']+)'/i.exec(m[2])?.[1] ?? code;
      message = /message\s*=\s*'((?:[^']|'')*)'/i.exec(m[2])?.[1] ?? message;
      details = /detail\s*=\s*'((?:[^']|'')*)'/i.exec(m[2])?.[1] ?? null;
    }
    tolak.push({ code, message: message.replace(/''/g, "'").replace(/%/g, "7"), details });
  }
  for (const m of badan.matchAll(/professional_refuse\('([A-Z_]+)'\)/g)) tolak.push({ code: "PR090", message: "", details: m[1] });
  return { berkas, tolak };
}

/** Refusals that stay the catch-all, with a reference: a state of the platform no reader can act on (D-011). */
const TETAP_RUJUKAN: ReadonlyArray<readonly [string, RegExp, string]> = [
  ["save_assessment_definition", /^no scoring policy is in force/, "no scoring policy is in force: the platform's state, not the reader's to act on"],
];

export const bob32Tests: SelfTest[] = [
  {
    id: "BOB32-K01",
    run: async (ctx) => {
      const c = new Checks();
      const mod = await muat("../src/lib/ujicepat-kontrak");
      c.expect(mod !== null && typeof mod.kodeUjiCepat === "function",
        "there are no Uji Cepat refusal codes: src/lib/ujicepat-kontrak.ts has no kodeUjiCepat");
      const kodeUjiCepat = (mod?.kodeUjiCepat as ((e: { code?: string; message?: string }) => string) | undefined) ?? (() => "QUICK_FAILED");

      // 1. every refusal the function can raise, read from its own migration, reaches its code
      const { berkas, kalimat } = penolakan(ctx.repoRoot);
      c.expect(kalimat.length >= 10, `only ${kalimat.length} refusal(s) found in ${berkas || "no migration"}`);
      const dilihat = new Set<string>();
      for (const k of kalimat) {
        const harap = HARAP.find(([pola]) => pola.test(k));
        c.expect(harap !== undefined, `launch_quick_assessment raises a refusal this test does not know: "${k.slice(0, 80)}"`);
        if (!harap) continue;
        dilihat.add(harap[0].source);
        const dapat = kodeUjiCepat({ code: "P0001", message: isi(k) });
        c.expect(dapat === harap[1], `"${isi(k).slice(0, 70)}…" is read as ${dapat}, expected ${harap[1]}`);
      }
      for (const [pola, kode] of HARAP) {
        c.expect(dilihat.has(pola.source), `the function no longer raises the refusal ${kode} was matched to (${pola.source}): reworded?`);
      }
      // the ticket's causes are each their own code, and none of them is the catch-all
      const kodeSemua = new Set(kalimat.map((k) => kodeUjiCepat({ code: "P0001", message: isi(k) })));
      for (const k of ["QUICK_BANK_TOO_SMALL", "QUICK_COUNT_OUT_OF_RANGE", "QUICK_NOT_ALLOWED"]) {
        c.expect(kodeSemua.has(k), `no refusal of the function is read as ${k}`);
      }
      c.expect(kodeUjiCepat({ code: "42501", message: "permission denied for function launch_quick_assessment" }) === "QUICK_NOT_ALLOWED",
        "a 42501 refusal is not read as QUICK_NOT_ALLOWED");
      c.expect(kodeUjiCepat({ code: "XX000", message: "something nobody named" }) === "QUICK_FAILED",
        "an unnamed refusal is not the catch-all QUICK_FAILED");

      // 2. the address read back trusts nothing
      const baca = mod?.bacaGagalUjiCepat as ((q: Record<string, string>) => { kode: string | null; ref: string | null } | null) | undefined;
      if (c.expect(typeof baca === "function", "src/lib/ujicepat-kontrak.ts has no bacaGagalUjiCepat for the page")) {
        c.expect(JSON.stringify(baca!({ cepat: "gagal", kode: "QUICK_BANK_TOO_SMALL" })) === JSON.stringify({ kode: "QUICK_BANK_TOO_SMALL", ref: null }),
          "a known code is not read back");
        c.expect(JSON.stringify(baca!({ cepat: "gagal", kode: "<b>anything</b>", ref: "abc" })) === JSON.stringify({ kode: null, ref: null }),
          "a forged code or a malformed reference reaches the page");
        c.expect(baca!({ cepat: "ok", kode: "QUICK_FAILED" }) === null, "a success is read as a refusal");
      }

      // 3. the action passes the code, and a reference, logged, for a refusal nobody named
      const aksi = readFileSync(join(ctx.repoRoot, "src", "app", "mengajar", "actions.ts"), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
      const fn = /export async function sediakanUjiCepat[\s\S]*?\n\}/.exec(aksi)?.[0] ?? "";
      c.expect(/const kode = kodeUjiCepat\(error\)/.test(fn), "sediakanUjiCepat does not read the refusal's code");
      c.expect(!/cepat=gagal["'`]/.test(fn), "sediakanUjiCepat still sends a refusal to ?cepat=gagal with no code");
      // RESTATED FOR BOB-34 (a changed requirement): the address is built by
      // alamatTolakUjiCepat (it also carries the teacher's choices), which
      // BOB34-K01 drives; the same two calls are asked for, with and without ref.
      c.expect((/cepat=gagal&kode=\$\{kode\}`/.test(fn) && /cepat=gagal&kode=\$\{kode\}&ref=\$\{ref\}`/.test(fn))
          || (/alamatTolakUjiCepat\(kode, pilihan\)/.test(fn) && /alamatTolakUjiCepat\(kode, pilihan, ref\)/.test(fn)),
        "sediakanUjiCepat does not pass the code, and the reference with the catch-all");
      c.expect(/if \(kode !== "QUICK_FAILED"\)/.test(fn) && /const ref = rujukan\(\);\s*console\.error\(/.test(fn),
        "an unnamed refusal is not logged under a reference, or a named one is given a reference it does not need");

      return c.verdict(
        `every one of the ${kalimat.length} refusals launch_quick_assessment raises in ${berkas} is read to its code: too few ` +
          "questions QUICK_BANK_TOO_SMALL, a count outside 3-20 QUICK_COUNT_OUT_OF_RANGE, a time outside 5-60 minutes " +
          "QUICK_MINUTES_OUT_OF_RANGE, no capability or another school's chapter QUICK_NOT_ALLOWED (and any 42501), an unknown " +
          "class or chapter QUICK_NOT_FOUND, and the rest QUICK_FAILED; a reworded refusal fails this test; the page's reader drops a " +
          "forged code or reference; and sediakanUjiCepat passes ?cepat=gagal&kode=, adding a reference, logged, only for QUICK_FAILED",
      );
    },
  },
  {
    id: "BOB32-K02",
    run: async (ctx) => {
      const c = new Checks();
      const mod = await muat("../src/lib/galat-kontrak");
      type Pemeta = (e: { code?: string; message?: string; details?: string | null }) => string;
      const kodeGalat = (mod?.kodeGalat as Pemeta | undefined) ?? (() => "ACTION_FAILED");
      const kodeGalatKonten = (mod?.kodeGalatKonten as Pemeta | undefined) ?? (() => "ACTION_FAILED");
      // 1. the Studio actions some page or component submits to, and the database functions each answers through ditolak
      const aksi = readFileSync(join(ctx.repoRoot, "src", "app", "studio", "actions.ts"), "utf8");
      const sumber: string[] = [];
      const jalan = (d: string) => {
        for (const e of readdirSync(join(ctx.repoRoot, d), { withFileTypes: true })) {
          const p = `${d}/${e.name}`;
          if (e.isDirectory()) jalan(p);
          else if (/\.tsx?$/.test(e.name) && p !== "src/app/studio/actions.ts") sumber.push(readFileSync(join(ctx.repoRoot, p), "utf8"));
        }
      };
      jalan("src");
      // each function with the mapper its action reads it through: kodeGalat by default, kodeGalatKonten where named
      const fungsi = new Map<string, Pemeta>();
      const dipakai: string[] = [];
      for (const m of aksi.matchAll(/export async function (\w+)\([\s\S]*?(?=\nexport async function |$)/g)) {
        if (!sumber.some((x) => new RegExp(`\\b${m[1]}\\b`).test(x))) continue;
        dipakai.push(m[1]);
        for (const d of m[0].matchAll(/ditolak\("(\w+)", [\w.]+(?:, (kodeGalatKonten)\([\w.]+\))?\)/g)) {
          fungsi.set(d[1], d[2] === "kodeGalatKonten" ? kodeGalatKonten : kodeGalat);
        }
      }
      c.expect(fungsi.size >= 8 && fungsi.has("save_assessment_definition"),
        `only ${fungsi.size} database function(s) found behind Studio's forms (${[...fungsi.keys()].join(", ")})`);
      // the integrity review raises its referral in the same transaction, so its refusals reach the same form
      if (fungsi.has("record_integrity_review")) fungsi.set("refer_integrity_signal", fungsi.get("record_integrity_review")!);
      // 2. every refusal with a known cause is named: never the catch-all with a reference
      let n = 0;
      const dilihat = new Set<string>();
      for (const [fn, pemeta] of [...fungsi].sort(([a], [b]) => a.localeCompare(b))) {
        const { berkas, tolak } = penolakanFungsi(ctx.repoRoot, fn);
        c.expect(berkas !== "" && tolak.length > 0, `${fn}: no definition or no refusal found in the migrations`);
        for (const t of tolak) {
          n++;
          const tetap = TETAP_RUJUKAN.find(([f, pola]) => f === fn && pola.test(t.message));
          if (tetap) { dilihat.add(tetap[2]); continue; }
          const kode = pemeta(t);
          c.expect(kode !== "ACTION_FAILED", `${fn} (${berkas}) refuses «${(t.message || t.details || "").slice(0, 90)}», which reaches the screen `
            + "as «Ada kendala» and a reference");
        }
      }
      for (const [, , alasan] of TETAP_RUJUKAN) c.expect(dilihat.has(alasan), `a refusal kept on the reference line is no longer raised: ${alasan}`);
      // 3. a refusal nobody named still gets the catch-all and its logged reference
      c.expect(kodeGalat({ code: "XX000", message: "something nobody named" }) === "ACTION_FAILED", "an unnamed refusal is not the catch-all");
      return c.verdict(`every one of the ${n} refusals of the ${fungsi.size} database functions behind the Studio forms in use `
        + `(${dipakai.length} actions), read from their latest migrations, reaches the screen as a named sentence, never «Ada kendala» `
        + `and a reference, except ${TETAP_RUJUKAN.length} the platform's own state raises (CR-84, D-127; releases and packages keep `
        + "their own named contracts: BOB03-K01, BOB02-K02)");
    },
  },
];
