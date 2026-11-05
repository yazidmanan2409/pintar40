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
 *
 * X.3 (EMAILJUJUR, D-098(c)): SUCCESS ONLY AFTER A REAL CHANGE. (a) Every call, anywhere under src, of a database function
 * whose JSON answer can carry ok other than true (read from the live schema) reads that ok before saying anything; a
 * function that only ever answers ok: true refuses by raising, which the caller's error check catches. (b) Every success
 * a server action states ({ ok: true …}) is conditional on the error of the call before it: a ternary on error, an
 * earlier if (error …) / if (!… .ok) exit, or a try whose engine throws on every database error
 * (src/lib/assessment-engine/index.ts). A planted unguarded success and an unread ok are caught.
 *
 * X.8 (P1, BOB26-A02): NO INTERNALS REACH THE PERSON. No server action and no API route answers the browser with an
 * error's own text (.message): a database or platform message can name tables, constraints or functions. What crosses
 * is a stable code (and its detail where the code defines one); the words come from the copy table. Logged text is not
 * an answer. A planted answer carrying .message is caught.
 *
 * X.1 (CR-78): EVERY SCREEN BY CLICKING. Every page under src/app is linked from another file, in an href, a navigation
 * table or a named constant used in an href, not only reached by a redirect; or it is one of the declared entrances that
 * are not a click by design (the email sign-in callback, the card's QR page, the maintenance and locked screens, which
 * PINTAR sends the person to), each checked at the place that sends the person there. A planted page with no link is
 * caught.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
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

function semuaSumber(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? semuaSumber(p) : /\.(ts|tsx)$/.test(p) ? [p] : [];
  });
}

/** The success literals of one server-action source that no visible guard conditions. */
export function suksesTanpaJaga(teks: string): number[] {
  const baris = teks.split("\n");
  const tanpa: number[] = [];
  baris.forEach((l, i) => {
    if (!/\bok:\s*true\b/.test(l) || /^\s*(\*|\/\/)/.test(l) || /\|\s*\{\s*ok:\s*false/.test(l)) return;
    const jendela = baris.slice(Math.max(0, i - 12), i + 1).join("\n");
    const dijaga = /\berror\b[^\n]*\?/.test(jendela) || /if\s*\(\s*!?\s*\(?\s*[\w.]*error/.test(jendela)
      || /if\s*\(\s*!?[\w.]*\bok\b/.test(jendela) || /\btry\s*\{/.test(jendela);
    if (!dijaga) tanpa.push(i + 1);
  });
  return tanpa;
}

/** Whether the code after a call reads the answer's ok. */
export function bacaOk(potongan: string): boolean {
  return /[.]ok[^\w]|\bok\s*[!=]==|[{ ,]ok[,} ]/.test(potongan);
}

aturanTests.push({
  id: "X03-BERHASIL-01",
  requires: ["db"],
  run: async (ctx) => {
    const c = new Checks();
    const root = ctx.repoRoot;
    const sql = "select string_agg(distinct p.proname, ' ') from pg_proc p join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public' "
      + "where p.prokind = 'f' and p.prorettype = 'jsonb'::regtype and exists (select 1 from regexp_matches(p.prosrc, '''ok''\\s*,\\s*([a-z_.0-9]+)', 'gi') m where lower(m[1]) <> 'true')";
    const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", sql, process.env.SUPABASE_DB_URL!], { encoding: "utf8" });
    if (!c.expect(r.status === 0, `the live schema could not be read: ${(r.stderr || "").trim().split("\n").pop()}`)) return c.verdict("");
    const bolehGagal = new Set(r.stdout.trim().split(/\s+/).filter(Boolean));
    c.expect(bolehGagal.size >= 3, `only ${bolehGagal.size} functions read as able to answer ok other than true: the reading is broken`);
    // engine's single helper throws on every database error, which makes a try's catch the refusal path
    const mesin = readFileSync(join(root, "src", "lib", "assessment-engine", "index.ts"), "utf8");
    c.expect(/if \(error\) throw new EngineError/.test(mesin), "the engine's database helper no longer throws on an error: its callers' try is no guard");

    let nPanggil = 0, nSukses = 0, nAksi = 0;
    for (const f of semuaSumber(join(root, "src"))) {
      const rel = f.slice(root.length + 1).replace(/\\/g, "/");
      const teks = readFileSync(f, "utf8");
      for (const m of teks.matchAll(/\.rpc\(\s*"([a-z_0-9]+)"/g)) {
        if (!bolehGagal.has(m[1])) continue;
        nPanggil++;
        c.expect(bacaOk(teks.slice(m.index!, m.index! + 1500)), `${rel}:${teks.slice(0, m.index!).split("\n").length} calls ${m[1]}, which can answer ok: false, and never reads ok (X.3)`);
      }
      if (/^\s*["']use server["']/m.test(teks.slice(0, 400))) {
        nAksi++;
        nSukses += (teks.match(/\bok:\s*true\b/g) ?? []).length;
        for (const n of suksesTanpaJaga(teks)) c.expect(false, `${rel}:${n} states success with no guard on the call before it (X.3)`);
      }
    }
    // positive controls
    c.expect(suksesTanpaJaga('const { error } = await s.rpc("x");\nreturn { ok: true };').length === 1, "a planted unguarded success is not caught");
    c.expect(suksesTanpaJaga('const { error } = await s.rpc("x");\nreturn error ? { ok: false } : { ok: true };').length === 0, "a guarded success is refused");
    c.expect(!bacaOk('const { data } = await s.rpc("confirm_ingest_batch", {});\nredirect("/selesai");'), "a call that ignores ok is not caught");
    return c.verdict(
      `read the live schema (${bolehGagal.size} functions can answer ok other than true) and the source of every file under src: all ` +
      `${nPanggil} calls of those functions read ok; in the ${nAksi} server-action files every one of the ${nSukses} success literals ` +
      `is conditional on the call's error (a ternary, an earlier exit, or the engine's throwing helper); planted controls are caught`);
  },
});

/** The lines of one server source that hand an error's own text to the browser. */
export function teksGalatKeluar(teks: string): number[] {
  const baris = teks.split("\n");
  const keluar: number[] = [];
  baris.forEach((l, i) => {
    if (/^\s*(\*|\/\/)/.test(l) || /console\.|catatGalat|\blog\w*\(/.test(l)) return;
    // an answer object or JSON body carrying an error's .message
    // (an object handed to a function inside the server, galatPemeliharaan({ … message … }), is not an answer)
    if ((/\breturn\b[^\n]*\bmessage:\s*[^,}]*\.message\b/.test(l) && !/\w\(\{[^}]*message:/.test(l))
        || /\b(?:NextResponse\.json|Response\.json)\([^)]*\.message\b/.test(l)) keluar.push(i + 1);
  });
  return keluar;
}

aturanTests.push({
  id: "X08-DALAM-01",
  run: async (ctx) => {
    const c = new Checks();
    const root = ctx.repoRoot;
    let nAksi = 0, nRute = 0;
    for (const f of semuaSumber(join(root, "src", "app"))) {
      const rel = f.slice(root.length + 1).replace(/\\/g, "/");
      const teks = readFileSync(f, "utf8");
      const aksi = /^\s*["']use server["']/m.test(teks.slice(0, 400));
      const rute = /\/route\.ts$/.test(rel);
      if (!aksi && !rute) continue;
      if (aksi) nAksi++; else nRute++;
      for (const n of teksGalatKeluar(teks)) c.expect(false, `${rel}:${n} answers the browser with an error's own text (X.8)`);
    }
    c.expect(teksGalatKeluar('} catch (e) {\n  return { ok: false as const, message: (e as Error).message };\n}').length === 1, "a planted answer carrying .message is not caught");
    c.expect(teksGalatKeluar('console.error("x", e.message);\nreturn { ok: false, code: "X" };').length === 0, "a logged message is taken for an answer");
    c.expect(teksGalatKeluar('if (galatPemeliharaan({ code: err.code, message: (e as Error).message })) redirect("/x");').length === 0, "a message handed to a server-side check is taken for an answer");
    return c.verdict(
      `read the source of the ${nAksi} server-action files and ${nRute} API routes under src/app: none answers the browser with an ` +
      `error's own text; what crosses is a stable code and its defined detail, and logged text is not an answer; a planted ` +
      `answer carrying .message is caught`);
  },
});

/** The declared entrances that are not a click, each with the file and pattern that sends the person there. */
export const PINTU_BUKAN_KLIK: Record<string, { alasan: string; berkas: string; pola: RegExp }> = {
  "/auth/callback": { alasan: "the sign-in email's link", berkas: "src/app/masuk/actions.ts", pola: /emailRedirectTo:[^\n]*\/auth\/callback/ },
  "/id/[pintarId]": { alasan: "a PINTAR card's QR and the identity email's link", berkas: "src/app/api/_email/identitas.ts", pola: /\/id\/\$\{/ },
  "/pemeliharaan": { alasan: "PINTAR sends everyone there when maintenance starts", berkas: "src/components/pemeliharaan/PengingatPemeliharaan.tsx", pola: /location\.replace\(HALAMAN_PEMELIHARAAN\)/ },
  "/terkunci": { alasan: "the idle guard locks the session there", berkas: "src/components/PenjagaSesi.tsx", pola: /location\.replace\(`\$\{HALAMAN_TERKUNCI\}/ },
};

function ruteDari(rel: string): string {
  const r = rel.replace(/^src\/app/, "").replace(/\/page\.tsx$/, "").replace(/\/\([^)]+\)/g, "");
  return r === "" ? "/" : r;
}

/** Whether some other file links route r by clicking: a literal not inside a redirect, or a constant used in an href. */
export function adaTautan(r: string, sumber: Array<{ rel: string; teks: string }>, kecuali: string): boolean {
  const bagian = r.split("/").filter(Boolean).map((b) => (b.startsWith("[") ? "[^/?#`\"']+" : b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  const pola = new RegExp(`["'\`]/${bagian.join("/")}(?:[/?#"'\`]|$)`);
  const konstanta: string[] = [];
  for (const { rel, teks } of sumber) {
    if (rel === kecuali) continue;
    for (const baris of teks.split("\n")) {
      const b = baris.replace(/\$\{[^}]*\}/g, "X");
      if (!pola.test(b)) continue;
      const k = /export const (\w+)\s*=/.exec(baris);
      if (k) { konstanta.push(k[1]); continue; }
      // a link is an href, a <Link>, or a navigation table's entry (["/…", label]); a list of paths a filter reads is not
      if (!/\b(redirect|replace|push|back)\(/.test(baris) && /\bhref\b|<Link\b|\[\s*["'`]\//.test(baris)) return true;
    }
  }
  return konstanta.some((k) => sumber.some(({ rel, teks }) => rel !== kecuali
    && new RegExp(`href=\\{[^}]*\\b${k}\\b|href:\\s*\`?\\$?\\{?${k}\\b`).test(teks)));
}

aturanTests.push({
  id: "X01-KLIK-01",
  run: async (ctx) => {
    const c = new Checks();
    const root = ctx.repoRoot;
    const sumber = semuaSumber(join(root, "src")).map((f) => ({ rel: f.slice(root.length + 1).replace(/\\/g, "/"), teks: readFileSync(f, "utf8") }));
    const halaman = sumber.filter((x) => /^src\/app\/.*page\.tsx$|^src\/app\/page\.tsx$/.test(x.rel));
    let nKlik = 0;
    const dipakai = new Set<string>();
    for (const h of halaman) {
      const r = ruteDari(h.rel);
      if (r === "/") continue;
      if (adaTautan(r, sumber, h.rel)) { nKlik++; continue; }
      const pintu = PINTU_BUKAN_KLIK[r];
      if (pintu) {
        const asal = sumber.find((x) => x.rel === pintu.berkas);
        c.expect(Boolean(asal && pintu.pola.test(asal.teks)), `${r} is declared as reached by ${pintu.alasan}, but ${pintu.berkas} no longer sends anyone there`);
        dipakai.add(r);
        continue;
      }
      c.expect(false, `${r} (${h.rel}) is linked from nowhere: no href, navigation table or constant reaches it by clicking (X.1)`);
    }
    for (const r of Object.keys(PINTU_BUKAN_KLIK)) c.expect(dipakai.has(r), `${r} is declared as an entrance that is not a click, but is linked or gone: remove its line`);
    c.expect(!adaTautan("/f27-tidak-ada", sumber, ""), "a planted page with no link is taken as linked");
    c.expect(adaTautan("/studio/bank", sumber, "src/app/studio/bank/page.tsx"), "a page linked from a navigation table is not found");
    return c.verdict(
      `read the source of every file under src: of ${halaman.length - 1} pages besides «/», ${nKlik} are linked from another file by ` +
      `an href, a navigation table or a constant used in an href, and ${dipakai.size} are the declared entrances that are not a ` +
      `click (the sign-in email's callback, the card's QR page, the maintenance and locked screens), each checked where PINTAR ` +
      `sends the person; a planted page with no link is caught`);
  },
});


/**
 * W2.14 (UX-19, D-135(d), D-191 K1): ONE VERB FOR GIVING A PACKAGE TO A CLASS. The teacher «menyediakan» it (Siapkan →
 * Sediakan; studio.langkah.terbitkan.arti), and the learner meets what is «disediakan untuk Anda». «Tugaskan» stays only
 * where the school places STAFF (a teacher placed in a Kelas, the school assigning a teacher to a scope): a different act.
 */
export const PENEMPATAN_STAF = new Set(["config.struktur.galat.masih_ada_staf", "config.struktur.intro", "tur.pg.2.kosong", "mengajar.kelas.intro"]);
export function kataTugaskan(hle: string): string[] {
  const out: string[] = [];
  for (const m of hle.matchAll(/^\s*"([a-z0-9_.]+)": \{ default: "([^"]*)"/gm)) {
    // the verb in its forms: tugaskan, ditugaskan, menugaskan(nya) (Indonesian drops the t after «me-»)
    if (/\b(?:di)?tugaskan\b|\bmenugaskan(?:nya)?\b/i.test(m[2]) && !PENEMPATAN_STAF.has(m[1])) out.push(m[1]);
  }
  for (const m of hle.matchAll(/\b[A-Z]+: \{ id: "([^"]*)"/g)) if (/\bditugaskan\b/i.test(m[1])) out.push(`(stage variant) ${m[1].slice(0, 40)}`);
  return out;
}
aturanTests.push({
  id: "W214-KATA-01",
  run: async (ctx) => {
    const c = new Checks();
    const hle = readFileSync(join(ctx.repoRoot, "src", "lib", "hle.ts"), "utf8");
    const salah = kataTugaskan(hle);
    c.expect(salah.length === 0, `«ditugaskan / menugaskan» names giving a package to a class in: ${salah.join(", ")}`);
    for (const k of PENEMPATAN_STAF) c.expect(new RegExp(`"${k.replace(/\./g, "\\.")}": \\{ default: "[^"]*(?:tugaskan|menugaskan)`).test(hle), `${k} is declared as staff placement but no longer says it: remove its line`);
    c.expect(kataTugaskan(`  "x.ditanam": { default: "Belum ada materi yang ditugaskan untuk Anda.", en: "x" },`).length === 1
      && kataTugaskan(`  "x.ditanam": { default: "Guru dapat menugaskannya ke kelas.", en: "x" },`).length === 1, "a planted «ditugaskan» or «menugaskannya» is not caught");
    return c.verdict("in src/lib/hle.ts no Indonesian string uses «ditugaskan / menugaskan» for giving a package to a class (the verb is «menyediakan» / «disediakan»); it stays only in the four staff-placement strings, each still saying it; a planted one is caught");
  },
});

// W6.2 (U-PERF, staging 5 Nov): Konfigurasi reads the audit trail only on «Jejak audit»'s own page, and names one school
// with eq. Read on every render with `in`, it was the slowest request of every Konfigurasi page (2,271 ms; the generic
// plan PostgREST's prepared statement gets for `= any($1)` read the school's whole trail through the row policy)
export function jejakBoros(src: string): string[] {
  const salah: string[] = [];
  const i = src.indexOf('supabase.from("audit_log")');
  const baca = src.slice(src.indexOf("const [", i), src.indexOf("]);", src.indexOf("const [", i)));
  if (!/bagianIni !== "audit"\s*\?\s*tanpaBaris/.test(baca)) salah.push("the trail is read on a page that does not draw it");
  if (!/satuSekolah \? jejak\.eq\("institution_id", satuSekolah\)/.test(baca)) salah.push("one school's trail is not named with eq");
  return salah;
}
aturanTests.push({
  id: "W62-JEJAK-01",
  run: async (ctx) => {
    const c = new Checks();
    const konf = readFileSync(join(ctx.repoRoot, "src", "app", "konfigurasi", "page.tsx"), "utf8");
    const salah = jejakBoros(konf);
    c.expect(salah.length === 0, `Konfigurasi's audit read: ${salah.join("; ")}`);
    const lama = konf.replace('bagianIni !== "audit"', "false").replace('jejak.eq("institution_id", satuSekolah)', 'jejak.in("institution_id", sekolahIni)');
    c.expect(jejakBoros(lama).length === 2, "the read as it was (every render, `in`) is not caught");
    return c.verdict("src/app/konfigurasi/page.tsx reads the audit trail only when the page drawn is «Jejak audit» (every other Konfigurasi page reads none), and a school's context names its one school with eq, which keeps (institution_id, at desc)'s order under PostgREST's prepared statement; the read as it was is caught");
  },
});
