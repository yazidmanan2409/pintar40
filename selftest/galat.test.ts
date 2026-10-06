/**
 * BOB-07 (D-011) — NOTHING RAW LEAVES THE SERVER.
 *
 * Every server action and route handler answers with a stable code; the
 * database's or Auth's own words go to the server log, next to a short
 * reference the reader is shown instead. BOB07-K01 walks the source for any
 * way those words could still leave; BOB07-K02 drives the catalogue, the
 * content-step mapping and the banner that shows the result.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, relative } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { TANPA_SALINAN, t, type HleEvent } from "../src/lib/hle";
import {
  KODE_GALAT, KODE_ISIAN, KODE_KONTEN, KODE_SUKSES, bacaHasil, kalimatHasil, kodeGalat, kodeGalatKonten, kunciKode, queryHasil,
} from "../src/lib/galat-kontrak";

function semua(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? semua(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
}

/** Source without comments, line numbers kept. */
function tanpaKomentar(s: string): string {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:"'`])\/\/[^\n]*/g, (m, a: string) => a + " ".repeat(m.length - a.length));
}

/**
 * Where an error's own words may appear: in the server log, or handed to a
 * classifier that answers with a code (a regex test, or a `sebab…` mapper).
 */
const BOLEH = /(?:console\.(?:error|warn|log)\([^\n]*|(?:\bsebab\w*|\.test)\(\s*)$/;

/**
 * THE LEARNER'S ACTIONS keep the engine's refusal in their results (R1): the
 * player reads only `code` and, for PR001, `detail`, which is a sequence
 * number. They are left as they are (coordinator, BOB-07) and held here by what
 * the learner's components read instead.
 */
const HASIL_PEMAIN = "src/app/belajar/actions.ts";

export function bocoran(root: string): string[] {
  const out: string[] = [];
  const app = join(root, "src", "app");
  for (const f of semua(app)) {
    const rel = relative(root, f).replace(/\\/g, "/");
    const mentah = readFileSync(f, "utf8");
    const kode = tanpaKomentar(mentah);
    const baris = kode.split("\n");
    const pelayan = /^\s*["']use server["']/m.test(mentah) || /\/route\.ts$/.test(rel);
    // a parameter nobody sends any more, and one that must never be sent
    baris.forEach((l, i) => {
      if (/\.set\(\s*["']detail["']|[?&]detail=|\bsp\.detail\b|searchParams\.detail\b/.test(l)) out.push(`${rel}:${i + 1} carries a detail parameter`);
    });
    if (!pelayan || rel === HASIL_PEMAIN) continue;
    baris.forEach((l, i) => {
      for (const m of l.matchAll(/\??\.(message|details|hint)\b/g)) {
        const sebelum = l.slice(0, m.index);
        if (!/[\w)\]]$/.test(sebelum)) continue;
        // what came before the receiver (`error`, `a.error`, `(e as Error)`)
        if (BOLEH.test(sebelum.replace(/(?:\(\s*\w+\s+as\s+\w+\s*\)|[\w?.]+)$/, ""))) continue;
        out.push(`${rel}:${i + 1} lets .${m[1]} leave the server: ${l.trim().slice(0, 120)}`);
      }
    });
  }
  // the learner's results: whatever they carry, no learner component reads `message`
  for (const f of semua(join(app, "belajar"))) {
    const rel = relative(root, f).replace(/\\/g, "/");
    if (rel === HASIL_PEMAIN || !/\.tsx$/.test(rel)) continue;
    tanpaKomentar(readFileSync(f, "utf8")).split("\n").forEach((l, i) => {
      if (/\.message\b/.test(l)) out.push(`${rel}:${i + 1} reads a learner action's message: ${l.trim().slice(0, 120)}`);
    });
  }
  return out;
}

/**
 * J10.2 (CR-45): PINTAR's two failure pages as Next draws them before any script runs, rendered from the real
 * src/app/error.tsx and src/app/global-error.tsx in a child process. The root-error page imports the stylesheet,
 * which a server render has no use for, so any .css loads as an empty module (an ESM hook, and the CommonJS table tsx uses).
 */
function gambarGalat(repoRoot: string, kasus: { halaman: "error" | "global-error" | "panel"; pesan?: string; digest?: string; locale?: string }[]):
  { html: string[]; galat: string } {
  const kait = "export async function load(url, ctx, next) { return url.endsWith('.css') ? { format: 'module', source: '', shortCircuit: true } : next(url, ctx); }";
  const anak = spawnSync(process.execPath, ["--import", "tsx", "-e",
    "(async () => {" +
    '  const mod = await import("node:module");' +
    `  mod.register("data:text/javascript," + encodeURIComponent(${JSON.stringify(kait)}));` +
    '  mod.default._extensions[".css"] = () => {};' +
    '  const { createElement: h } = await import("react");' +
    '  const { renderToStaticMarkup } = await import("react-dom/server");' +
    '  const dari = async (f) => { const m = await import("file://" + process.cwd() + f); return m.default?.default ?? m.default; };' +
    '  const hal = { error: await dari("/src/app/error.tsx"), "global-error": await dari("/src/app/global-error.tsx"),' +
    '                panel: await dari("/src/components/HalamanGalat.tsx") };' +
    '  const { readFileSync } = await import("node:fs");' +
    '  const out = JSON.parse(readFileSync(0, "utf8")).map((k) => {' +
    "    const e = Object.assign(new Error(k.pesan ?? \"\"), k.digest ? { digest: k.digest } : {});" +
    "    const ulang = () => {};" +
    '    return k.halaman === "panel" ? renderToStaticMarkup(h(hal.panel, { locale: k.locale, rujukan: k.digest, ulang }))' +
    "                                 : renderToStaticMarkup(h(hal[k.halaman], { error: e, reset: ulang }));" +
    "  });" +
    "  process.stdout.write(JSON.stringify(out));" +
    "})().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });"], {
    cwd: repoRoot, encoding: "utf8", maxBuffer: 1 << 24, input: JSON.stringify(kasus),
  });
  let html: string[] = [];
  try { html = JSON.parse(anak.stdout); } catch { /* reported by the caller */ }
  return { html, galat: anak.status === 0 && html.length === kasus.length ? "" : (anak.stderr || "no output").split("\n").slice(0, 4).join(" ") };
}

export const galatTests: SelfTest[] = [
  {
    // =======================================================================
    // BOB07-K01 — NO SERVER ACTION OR ROUTE LETS THE DATABASE'S WORDS OUT.
    // =======================================================================
    id: "BOB07-K01",
    run: async (ctx) => {
      const c = new Checks();
      const bocor = bocoran(ctx.repoRoot);
      c.expect(bocor.length === 0, `${bocor.length} way(s) out: ${bocor.slice(0, 12).join("; ")}`);

      // the walk is watched: each planted leak is found, in an action and in a route
      const bibit = [
        ["a redirect's detail", `"use server";\nexport async function a() { const { error } = await x(); back("s", { ok: false, detail: error.message }); }`],
        ["a JSON body", `export async function POST() { return NextResponse.json({ ok: false, detail: created?.message }); }`],
        ["a refusal's details", `"use server";\nexport async function b() { return { ok: false, why: err.details }; }`],
        ["a caught error", `"use server";\nexport async function c() { try { await y(); } catch (e) { return { ok: false, m: (e as Error).message }; } }`],
      ] as const;
      const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import("node:fs");
      const { tmpdir } = await import("node:os");
      for (const [nama, isi] of bibit) {
        const root = mkdtempSync(join(tmpdir(), "bob07-"));
        try {
          mkdirSync(join(root, "src", "app", "api", "x"), { recursive: true });
          mkdirSync(join(root, "src", "app", "belajar"), { recursive: true });
          writeFileSync(join(root, "src", "app", nama === "a JSON body" ? "api/x/route.ts" : "actions.ts"), isi);
          c.expect(bocoran(root).length === 1, `the walk does not find ${nama}: ${JSON.stringify(bocoran(root))}`);
        } finally { rmSync(root, { recursive: true, force: true }); }
      }
      // and it lets the log and the classifiers be
      const root = mkdtempSync(join(tmpdir(), "bob07-"));
      try {
        mkdirSync(join(root, "src", "app", "belajar"), { recursive: true });
        writeFileSync(join(root, "src", "app", "actions.ts"), `"use server";\nexport async function d() {\n` +
          `  console.error("[x ABC123] failed", error?.code, error?.message);\n  const s = sebabTutup(error.message);\n` +
          `  if (/nope/i.test(error.message ?? "")) return 1;\n}`);
        c.expect(bocoran(root).length === 0, `the walk flags the server log or a classifier: ${JSON.stringify(bocoran(root))}`);
      } finally { rmSync(root, { recursive: true, force: true }); }

      return c.verdict("a walk over every server action file and route handler in src/app finds no error's .message, " +
        ".details or .hint outside the server log or a classifier that answers with a code, no detail parameter set or " +
        "read anywhere, and no learner component reading a learner action's message (those results carry the engine's " +
        "refusal, and the player reads only its code); the walk is watched: it finds a planted redirect detail, JSON body, " +
        "refusal details and caught error, and lets the log and the classifiers be");
    },
  },
  {
    // =======================================================================
    // BOB07-K02 — THE CATALOGUE, THE CONTENT STEP'S CODES, AND THE BANNER THAT
    // SHOWS THEM.
    // =======================================================================
    id: "BOB07-K02",
    run: async (ctx) => {
      const c = new Checks();

      // 1. every refusal enforce_content_status can raise has its own code: read
      //    from the migration that defines it last, each format filled as the
      //    database fills it, and a message that only quotes one is not it
      const dir = join(ctx.repoRoot, "supabase", "migrations");
      const terakhir = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
        .filter((f) => /create (?:or replace )?function public\.enforce_content_status\(/.test(readFileSync(join(dir, f), "utf8"))).pop();
      c.expect(!!terakhir, "no migration defines enforce_content_status");
      const sql = terakhir ? readFileSync(join(dir, terakhir), "utf8") : "";
      const tubuh = sql.slice(sql.search(/create (?:or replace )?function public\.enforce_content_status\(/));
      // the body is between the function's own dollar-quote tag and its next use
      const tag = /\bas\s+(\$\w*\$)/i.exec(tubuh);
      const mulai = tag ? tubuh.indexOf(tag[1], tag.index) + tag[1].length : -1;
      const fungsi = tag && mulai > 0 ? tubuh.slice(mulai, tubuh.indexOf(tag[1], mulai)) : "";
      const pesan = [...fungsi.matchAll(/raise exception '((?:[^']|'')+)'/g)].map((m) => m[1].replace(/''/g, "'"));
      c.expect(pesan.length >= 10, `only ${pesan.length} refusal(s) read from ${terakhir}`);
      const dipakai = new Set<string>();
      for (const p of pesan) {
        const contoh = p.replace(/%\.%/, "public.courses").replace(/%/g, "IN_REVIEW");
        const kode = kodeGalatKonten({ code: "P0001", message: contoh });
        c.expect(kode.startsWith("CONTENT_"), `"${contoh}" has no content code (it became ${kode})`);
        dipakai.add(kode);
      }
      c.expect(dipakai.size === pesan.length, `${pesan.length} refusals share ${dipakai.size} codes`);
      c.expect(!kodeGalatKonten({ code: "P0001", message: "a note that says: the reviewer may not be the author" }).startsWith("CONTENT_"),
        "a message that only quotes a refusal was taken for it");

      // 2. any action's refusal, by its SQLSTATE and the shapes the database words them in
      for (const [e, want] of [
        [{ code: "42501", message: "permission denied for table x" }, "ACTION_NOT_ALLOWED"],
        [{ code: "P0001", message: "assembling a report template requires CAN_MANAGE_REPORT_TEMPLATES in that institution" }, "ACTION_NOT_ALLOWED"],
        [{ code: "23505", message: "duplicate key value violates unique constraint" }, "ACTION_ALREADY_EXISTS"],
        [{ code: "P0002", message: "query returned no rows" }, "ACTION_NOT_FOUND"],
        [{ code: "P0001", message: "no such report template" }, "ACTION_NOT_FOUND"],
        [{ code: "22P02", message: "invalid input syntax for type uuid" }, "ACTION_INPUT_INVALID"],
        [{ code: "P0001", message: "something nobody named" }, "ACTION_FAILED"],
        [null, "ACTION_FAILED"],
      ] as const) {
        c.expect(kodeGalat(e) === want, `${JSON.stringify(e)} became ${kodeGalat(e)}, not ${want}`);
      }

      // 3. every code has its sentence in both languages, and none names the machinery
      const MESIN = /ACTION_|CONTENT_|PR0\d\d|CAN_|INGESTED|APPROVED|FROZEN|PUBLISHED|[Ss][Qq][Ll][Ss][Tt][Aa][Tt][Ee]|[Jj][Ss][Oo][Nn][Bb]|\b[Uu][Uu][Ii][Dd]\b/;
      for (const kode of [...KODE_GALAT, ...KODE_KONTEN, ...KODE_ISIAN, ...KODE_SUKSES]) {
        for (const locale of ["id", "en"] as const) {
          const kalimat = t(kunciKode(kode), "staff", { locale });
          c.expect(kalimat !== TANPA_SALINAN && kalimat.trim() !== "", `${kode} has no ${locale} sentence`);
          c.expect(!MESIN.test(kalimat), `${kode} names the machinery in ${locale}: ${kalimat.slice(0, 60)}`);
        }
      }
      c.expect(kunciKode("the reviewer may not be the author") === "galat.action_failed", "an unknown code has a sentence of its own");

      // 4. THE BANNER. A code becomes the copy table's sentence; a reference, a
      //    count and a package problem at its place follow; and nothing typed into
      //    the address reaches it -- not a legacy detail, an unknown code, a
      //    reference or sheet of the wrong shape
      const s = (k: HleEvent) => t(k, "staff");
      const awal = { ok: "studio.hasil.ok", gagal: "studio.hasil.gagal" } as const;
      const kalimat = kalimatHasil({ hasil: "gagal", kode: "CONTENT_REVIEWER_IS_AUTHOR" }, s, awal);
      c.expect(kalimat === `${s("studio.hasil.gagal")} ${s("studio.konten.kode.content_reviewer_is_author")}`,
        `the content refusal reads: ${kalimat}`);
      const ditanam = { hasil: "gagal", kode: "the reviewer may not be the author", detail: "the reviewer may not be the author",
        ref: "<b>x</b>", masalah: "BUKAN_KODE:Soal:3" } as Record<string, string>;
      const bocor = kalimatHasil(ditanam, s, awal) ?? "";
      c.expect(bocor === s("studio.hasil.gagal"), `a planted address reached the banner: ${bocor}`);
      const gagal = kalimatHasil({ hasil: "gagal", kode: "ACTION_FAILED", ref: "AB12CD" }, s, awal) ?? "";
      c.expect(gagal.endsWith(`${s("galat.rujukan")}: AB12CD.`), `a failure's reference is not shown: ${gagal}`);
      const q = queryHasil("rollover", { ok: true, kode: "ROLLOVER_DONE", n: 12 });
      c.expect(!q.has("detail") && q.get("n") === "12" && (kalimatHasil(Object.fromEntries(q), s, awal) ?? "").endsWith(" 12."),
        `a count does not travel as a count: ${q.toString()}`);
      const qp = queryHasil("mudah", { ok: false, kode: "PACKAGE_HAS_PROBLEMS", ref: "ZZ99ZZ",
        masalah: [{ code: "WORKBOOK_VALUE_REQUIRED", sheet: "Soal", row: 4 }] });
      const hp = bacaHasil(Object.fromEntries(qp));
      c.expect(hp?.kode === "PACKAGE_HAS_PROBLEMS" && hp.ref === "ZZ99ZZ" && hp.masalah.length === 1 && hp.masalah[0].row === 4,
        `a package problem does not travel as a code at its place: ${qp.toString()}`);

      // 5. the two surfaces read only the code: Studio's shared line and Konfigurasi's
      const lib = readFileSync(join(ctx.repoRoot, "src", "app", "studio", "_lib.ts"), "utf8");
      c.expect(/export function outcomeLine\(q: QueryHasil\)[\s\S]*?kalimatHasil\(q, s,/.test(lib), "Studio's outcome line does not read the code");
      const konf = readFileSync(join(ctx.repoRoot, "src", "app", "konfigurasi", "page.tsx"), "utf8");
      c.expect(/kalimatHasil\(sp, s, \{ ok: "config\.result\.ok", gagal: "config\.result\.failed" \}\)/.test(konf),
        "Konfigurasi's result line does not read the code");

      return c.verdict(`each of the ${pesan.length} refusals enforce_content_status raises in ${terakhir} has its own ` +
        "CONTENT_ code, and a message that only quotes one is not taken for it; any action's refusal becomes its code by " +
        "SQLSTATE and wording, else ACTION_FAILED; every code of the catalogue in the source file src/lib/galat-kontrak.ts " +
        "has a sentence in both languages naming no machinery; the banner shows the code's sentence, a count, a package " +
        "problem at its place and a failure's reference, and a planted legacy detail, unknown code, bad reference and " +
        "unknown sheet never reach it; Studio's shared outcome line and Konfigurasi's result line read only the code");
    },
  },
  {
    // =======================================================================
    // BOB07-K03 — J10.2 (CR-45): A FAILED PAGE SHOWS PINTAR'S PAGE AND A
    // REFERENCE, NEVER THE ERROR'S OWN WORDS. Executed, not read: the real
    // error and root-error pages are rendered with a failure that carries a
    // database sentence and a stack, and with one that carries no digest.
    // =======================================================================
    id: "BOB07-K03",
    run: async (ctx) => {
      const c = new Checks();
      const PESAN = 'permission denied for table person_pins: relation "public.person_pins" at src/lib/rahasia.ts:42';
      const DIGEST = "3141592653";
      const kasus = [
        { halaman: "error", pesan: PESAN, digest: DIGEST },
        { halaman: "global-error", pesan: PESAN, digest: DIGEST },
        { halaman: "error", pesan: PESAN },
        { halaman: "global-error", pesan: PESAN },
        { halaman: "panel", digest: DIGEST, locale: "en" },
      ] as const;
      const { html, galat } = gambarGalat(ctx.repoRoot, [...kasus]);
      c.expect(galat === "", `the failure pages could not be rendered: ${galat}`);
      const teks = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&")
        .replace(/\s+/g, " ").trim();
      const RAW = /permission denied|person_pins|relation "|src\/lib|rahasia\.ts|\bat [\w.]+ \(|Error:/;
      if (galat === "") {
        kasus.forEach((k, i) => {
          const locale = k.halaman === "panel" ? k.locale : "id";
          const s = (key: HleEvent) => t(key, "public", { locale });
          const nama = `${k.halaman}${k.halaman === "panel" ? ` (${locale})` : ""}, ${k.digest ? "with" : "without"} a digest`;
          const h = html[i] ?? "", v = teks(h);
          c.expect(v.includes(s("galat.judul")) && v.includes(s("galat.arti")), `${nama}: not PINTAR's sentence: "${v.slice(0, 120)}"`);
          c.expect(v.includes(s("galat.ulang")) && /href="\/"/.test(h) && v.includes(s("galat.beranda")), `${nama}: no way to try again or back to the start`);
          c.expect(/role="alert"/.test(h), `${nama}: the failure is not announced`);
          c.expect(!RAW.test(v) && !h.includes("person_pins"), `${nama}: the error's own words reached the reader: "${v.slice(0, 160)}"`);
          c.expect(!/Application error|client-side exception|This page could not be found/i.test(v), `${nama}: Next's default text`);
          if (k.digest) {
            c.expect(v.includes(`${s("galat.rujukan")} ${DIGEST}`), `${nama}: the reference is not shown as «${s("galat.rujukan")} ${DIGEST}»: "${v.slice(0, 160)}"`);
          } else {
            c.expect(!v.includes(s("galat.rujukan")), `${nama}: a reference is shown with no digest to show`);
          }
        });
        c.expect(/^<html lang="id">[\s\S]*<body>/.test(html[1] ?? "") && /^<html lang="id">[\s\S]*<body>/.test(html[3] ?? ""),
          "the root-error page does not bring its own <html> in the reader's language");
      }
      return c.verdict(
        "rendered from the real src/app/error.tsx and src/app/global-error.tsx, a failure whose own words are a database " +
        "sentence, a table name and a source path shows PINTAR's sentence, «Coba lagi», a way back to the start, an alert " +
        `role and «${t("galat.rujukan", "public", { locale: "id" })} ${DIGEST}», and none of its words; with no digest, no reference ` +
        "is made up; the root-error page brings its own <html lang>; the shared panel says the same in English");
    },
  },
];
