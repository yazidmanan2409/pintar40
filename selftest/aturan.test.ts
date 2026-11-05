/**
 * W6.1 (CR-59; D-186): THE UNIVERSAL RULES AS RULE-LEVEL TESTS, read from the source over every instance.
 *
 * J7.8 (D-060): A VERSION LABEL CHANGES WHEN ITS MEANING CHANGES. Every migration from D-060's date (29 Sep) that
 * changes a metric's meaning (a calc_* body, an official_ / academic_ / scoped_ / service_ metric source view, or
 * evidence_readiness) publishes a new catalogue version, or states in its header that the catalogue is unchanged and
 * why (D-060(c), (d)). Every one that changes the engine's meaning (grade_response, record_answer, assemble_session,
 * evaluate_session, finalize_session, option_display_order, or the draw, eligible_items_for_definition) bumps
 * pintar-engine/N, or states that the engine is unchanged and why. The catalogue labels a migration publishes rise
 * strictly in migration order. Recorded exceptions are named with their reason; a stale one fails.
 *
 * X.11 (DAISY-17, D-046(e)): IDLE → WORKING → SUCCESS / ERROR, NEVER TWICE. Forms are held by DAISY-17-KIRIM-01 (every
 * <form action> submits through TombolKirim). This holds the rest: every client component that calls the server itself
 * (fetch or .rpc) disables its trigger while the call is pending (a disabled={…} bound to its own state), or is declared
 * with its reason. A stale declaration fails; a planted component with neither is caught.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const DARI = "20260929";
const METRIK = /create\s+(?:or\s+replace\s+)?(?:function\s+public\.(calc_\w+|evidence_readiness)\b|view\s+public\.((?:official|academic|scoped|service)_\w+))/gi;
const MESIN = /create\s+(?:or\s+replace\s+)?function\s+public\.(grade_response|record_answer|assemble_session|evaluate_session|finalize_session|option_display_order|eligible_items_for_definition)\b/gi;
// A publication is a top-level statement (column 0); the probes inside a migration's self-checking DO block, rolled back,
// are indented and do not count
const TERBIT = /^(?:insert\s+into\s+public\.metric_catalogue\s*\(version,\s*note\)\s*(?:select|values\s*\()\s*'MC-(\d+)'|select\s+public\.publish_metric_catalogue\(\s*'MC-(\d+)')/gim;
const KATALOG_TETAP = /CATALOGUE:\s*unchanged|metric catalogue:\s*unchanged|catalogue (?:version )?is unchanged/i;
const MESIN_NAIK = /pintar-engine\/\d+\s*(?:→|->)\s*pintar-engine\/\d+/i;
const MESIN_TETAP = /ENGINE:\s*unchanged|engine_version is unchanged|engine (?:version )?is unchanged/i;

/** Applied before this rule was a test, so they are not edited (an applied migration is history); each says what it kept. */
export const PENGECUALIAN_J78: Record<string, string> = {
  "20261005100000_an_answer_is_never_lost_to_a_finish.sql":
    "ENGINE: record_answer and finalize_session keep answers still in transit inside the grace window; its header says scoring does not change, not in D-060(d)'s form",
  "20261010100000_a_lesson_is_assigned_whole.sql":
    "ENGINE: the cycle's draw follows the questions' marks; its header says content without marks draws as it always has, not in D-060(d)'s form",
  "20261104100000_a_teacher_chooses_the_uji_cepat_questions.sql":
    "ENGINE: an Uji Cepat may draw the teacher's chosen questions; its header says every other instrument draws as before, not in D-060(d)'s form",
};

/** One migration's verdict under J7.8: what it touches and what it is missing. */
export function periksaJ78(teks: string): { metrik: string[]; mesin: string[]; kurang: string[]; label: string[] } {
  const kode = teks.replace(/--[^\n]*/g, "");
  const metrik = [...new Set([...kode.matchAll(METRIK)].map((m) => m[1] ?? m[2]))];
  const mesin = [...new Set([...kode.matchAll(MESIN)].map((m) => m[1]))];
  const kurang: string[] = [];
  const label = [...new Set([...kode.matchAll(TERBIT)].map((m) => m[1] ?? m[2]))];
  if (metrik.length > 0 && label.length === 0 && !KATALOG_TETAP.test(teks)) kurang.push("CATALOGUE");
  if (mesin.length > 0 && !MESIN_NAIK.test(teks) && !MESIN_TETAP.test(teks)) kurang.push("ENGINE");
  return { metrik, mesin, kurang, label };
}

export const aturanTests: SelfTest[] = [
  {
    id: "D060-J78-01",
    run: async (ctx) => {
      const c = new Checks();
      const dir = join(ctx.repoRoot, "supabase", "migrations");
      const berkas = readdirSync(dir).filter((f) => f.endsWith(".sql") && f >= DARI).sort();
      let nMetrik = 0, nMesin = 0, nTerbit = 0, puncak = 0;
      const dipakai = new Set<string>();
      for (const f of berkas) {
        const v = periksaJ78(readFileSync(join(dir, f), "utf8"));
        if (v.metrik.length) nMetrik++;
        if (v.mesin.length) nMesin++;
        if (v.kurang.length) {
          const alasan = PENGECUALIAN_J78[f];
          if (alasan && v.kurang.every((k) => alasan.startsWith(k))) dipakai.add(f);
          else c.expect(false, `${f} changes ${[...v.metrik, ...v.mesin].join(", ")} and neither bumps nor states it unchanged (${v.kurang.join(", ")}; D-060)`);
        }
        if (v.label.length) {
          nTerbit++;
          const tertinggi = Math.max(...v.label.map(Number));
          c.expect(tertinggi > puncak, `${f} publishes MC-${tertinggi}, not after MC-${puncak}: catalogue labels must rise`);
          puncak = Math.max(puncak, tertinggi);
        }
      }
      for (const f of Object.keys(PENGECUALIAN_J78)) {
        c.expect(dipakai.has(f), `${f} is a recorded J7.8 exception that no longer needs one: remove its line`);
      }
      // positive control: a calculator changed with no new catalogue and no statement is caught, as is an engine change
      const tanam = periksaJ78("create or replace function public.calc_class_planted() returns int language sql as $$ select 1 $$;\n"
        + "create or replace function public.grade_response(p uuid) returns int language sql as $$ select 1 $$;");
      c.expect(tanam.kurang.join(",") === "CATALOGUE,ENGINE", `a planted calculator and engine change was answered ${tanam.kurang.join(",") || "clean"}`);
      c.expect(periksaJ78("-- CATALOGUE: unchanged (D-060(c)): same results.\ncreate or replace function public.calc_x() returns int language sql as $$ select 1 $$;").kurang.length === 0,
        "a stated «CATALOGUE: unchanged» is not accepted");
      return c.verdict(
        `read the ${berkas.length} migrations under supabase/migrations from ${DARI} (D-060): ${nMetrik} change a metric's meaning and ` +
        `${nMesin} the engine's; every one publishes a new catalogue (${nTerbit}, labels rising to MC-${puncak}), bumps the engine, or ` +
        `states it unchanged, but the ${Object.keys(PENGECUALIAN_J78).length} recorded exceptions applied before this test, each with its ` +
        `reason; a planted calculator and engine change with neither is caught`);
    },
  },
];

/** Client components that call the server and need no disabled trigger, each with its reason. */
export const KLIEN_TANPA_TOMBOL: Record<string, string> = {
  "src/components/PenjagaSesi.tsx": "the idle warning's heartbeat and expiry: no person presses anything",
  "src/components/pelajaran/TautanBerkas.tsx": "a read-only check that a lesson file exists before it opens; it changes nothing",
  "src/components/lapor/TangkapanLayar.tsx": "the screenshot upload: the file field is invalid while it uploads, so the report's own TombolKirim cannot send (X.11, audit/e1-navigasi.mjs N8), and only the latest pick may finish",
};

/** Whether a client component's source calls the server and guards its trigger. */
export function periksaX11(teks: string): { klien: boolean; panggil: boolean; jaga: boolean } {
  const klien = /^\s*["']use client["']/m.test(teks);
  const panggil = /\bfetch\(|\.rpc\(/.test(teks);
  const jaga = /disabled=\{[^}]*\b(sibuk|pending|isPending|keadaan|langkah|committed|finishing|memuat|kirim)\b/.test(teks);
  return { klien, panggil, jaga };
}

function semuaTsx(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? semuaTsx(p) : p.endsWith(".tsx") ? [p] : [];
  });
}

aturanTests.push({
  id: "X11-KLIEN-01",
  run: async (ctx) => {
    const c = new Checks();
    const root = ctx.repoRoot;
    const berkas = [...semuaTsx(join(root, "src", "app")), ...semuaTsx(join(root, "src", "components"))];
    let n = 0, nJaga = 0;
    const dipakai = new Set<string>();
    for (const f of berkas) {
      const rel = f.slice(root.length + 1).replace(/\\/g, "/");
      const v = periksaX11(readFileSync(f, "utf8"));
      if (!v.klien || !v.panggil) continue;
      n++;
      if (v.jaga) { nJaga++; continue; }
      if (KLIEN_TANPA_TOMBOL[rel]) { dipakai.add(rel); continue; }
      c.expect(false, `${rel} calls the server from the client and disables no trigger while the call is pending (X.11)`);
    }
    for (const f of Object.keys(KLIEN_TANPA_TOMBOL)) c.expect(dipakai.has(f), `${f} is declared for X.11 but no longer needs it: remove its line`);
    const tanam = periksaX11('"use client";\nexport default function X() { return <button onClick={() => fetch("/api/x", { method: "POST" })}>Kirim</button>; }');
    c.expect(tanam.klien && tanam.panggil && !tanam.jaga, "a planted client component that posts from an unguarded button is not caught");
    return c.verdict(
      `read every .tsx under src/app and src/components: ${n} client components call the server themselves (fetch or .rpc); ${nJaga} ` +
      `disable their trigger while the call is pending, and ${dipakai.size} are declared with their reason (a heartbeat, a read-only ` +
      `check, the screenshot upload that holds the report's own send); forms are DAISY-17-KIRIM-01's; a planted unguarded one is caught`);
  },
});

