/**
 * Experience runner — UX-1 Slice 0 and Slice 1.
 *
 * Added, not edited: every case here is new, and no case that existed at the
 * frozen baseline 9b2cc5d is changed by this file. `selftest/static.test.ts`
 * appends this list to its own and the runner executes both.
 *
 * What these cases are for, in one sentence each:
 *   UX1-S0-TOKEN-01        Experience styling resolves to a design token
 *   UX1-S0-CONTRAST-01     every token pair passes WCAG 2.1 AA, computed
 *   UX1-S0-HLE-01          every copy key carries both languages
 *   UX1-S0-LANG-01         the language changes text, and changes no request
 *   UX1-S1-CERT-COLS-01    the certificate list reads exactly ten columns
 *   UX1-S1-CERT-ELIGIBLE-01 an unissued certificate shows no credential
 *   UX1-S1-QR-01           the printed QR really decodes to the link
 *   UX1-S0-SAPAAN-01       no learner is addressed informally in Indonesian
 *   UX1-S0-FAKTA-01        compact fact summaries stack on a narrow surface
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";
import jsQR from "jsqr";
import { Checks, type SelfTest } from "./lib";
import { allKeys, telling, renderAll, t, LOCALES, type HleEvent } from "../src/lib/hle";
import { qrMatrix } from "../src/lib/qr";
import { LIST_COLUMNS, rendersCredential, rendersVerification } from "../src/lib/sertifikat-kontrak";

const IGNORED = new Set(["node_modules", ".next", ".git", "coverage", "out", "build", ".vercel"]);

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (IGNORED.has(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Source with comments removed: a rule about code is tested against code. */
function code(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ").replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");
}

// ---------------------------------------------------------------------------
// THE SCOPE OF THE TOKEN LINT, DECLARED RATHER THAN GUESSED.
//
// UX-1 re-sets the Experience surfaces one slice at a time, and Slices 2-7 are
// not authorized yet. A lint over every file in src/ would therefore fail on
// surfaces this session is forbidden to touch, and a lint over "the files I
// changed" would stop covering anything the day somebody stops changing files.
//
// So the scope is two declared lists, and the test asserts that every surface
// is in exactly one of them. A NEW surface is in neither, and the test fails
// until somebody puts it in one — which is the property that matters: nothing
// can be added outside the lint by accident.
// ---------------------------------------------------------------------------
const RESET_SURFACES = [
  "src/app/layout.tsx",
  "src/app/globals.css",
  "src/app/experience.css",
  "src/app/_intel.ts",
  "src/app/belajar/sertifikat/page.tsx",
  "src/app/belajar/[tugas]/sertifikat/page.tsx",
  "src/app/verifikasi/[token]/page.tsx",
];

/** Not re-set yet, and the slice that will do it. UX-1 §4 forbids touching them. */
const PENDING_SURFACES: Record<string, string> = {
  "src/app/page.tsx": "Slice 2 — entry by purpose",
  "src/app/masuk/page.tsx": "Slice 2 — sign-in",
  "src/app/belajar/page.tsx": "Slice 3 — the learning cycle",
  "src/app/belajar/[tugas]/page.tsx": "Slice 3 — the learning cycle",
  "src/app/belajar/[tugas]/hasil/page.tsx": "Slice 3 — the result",
  "src/app/belajar/[tugas]/peta/page.tsx": "Slice 3 — the reading map",
  "src/app/belajar/[tugas]/pemetaan/page.tsx": "Slice 4 — assessment (route blocked in UX-1)",
  "src/app/belajar/[tugas]/penguasaan/page.tsx": "Slice 4 — assessment (route blocked in UX-1)",
  "src/app/belajar/[tugas]/pelajaran/[pelajaran]/page.tsx": "Slice 3 — the lesson",
  "src/app/belajar/_components/ItemPlayer.tsx": "Slice 4 — assessment",
  "src/app/belajar/_components/LessonPlayer.tsx": "Slice 3 — the lesson",
  "src/app/_evaluation-banner.tsx": "Slice 2 — the shell",
  "src/app/evaluasi/page.tsx": "Slice 2 — the demonstration room",
  "src/app/konfigurasi/page.tsx": "Slice 7 — configuration",
  "src/app/edukator/ringkasan/page.tsx": "Slice 6 — reports",
  "src/app/dekan/ringkasan/page.tsx": "Slice 6 — reports",
  "src/app/studio/layout.tsx": "Slice 5 — Studio",
  "src/app/studio/page.tsx": "Slice 5 — Studio",
  "src/app/studio/bank/page.tsx": "Slice 5 — Studio",
  "src/app/studio/definisi/page.tsx": "Slice 5 — Studio",
  "src/app/studio/integritas/page.tsx": "Slice 5 — Studio",
  "src/app/studio/kanonik/page.tsx": "Slice 5 — Studio",
  "src/app/studio/kanonik/[terbitan]/page.tsx": "Slice 5 — Studio",
  "src/app/studio/kuis/page.tsx": "Slice 5 — Studio",
  "src/app/studio/paket/[course]/page.tsx": "Slice 5 — Studio",
  "src/app/studio/pratinjau/[pelajaran]/page.tsx": "Slice 5 — Studio",
  "src/app/studio/sertifikat/page.tsx": "Slice 5 — Studio",
  "src/app/studio/tinjau/page.tsx": "Slice 5 — Studio",
  "src/app/studio/unggah/page.tsx": "Slice 5 — Studio",
};

/**
 * IMPLEMENTATION CONSTANTS, CLASSIFIED (Sauron amendment §3).
 *
 * The lint protects the design system; it does not obstruct implementation. A
 * value that is not a design decision is not tokenized to satisfy a rule — it
 * is declared here with the reason it is not a design decision. An entry is a
 * file, a literal and one line saying why.
 */
const EXEMPTIONS: Array<{ file: string; literal: string; reason: string }> = [
  { file: "src/app/experience.css", literal: "794px",
    reason: "A4 is 210mm; at 96dpi that is 794px. It is the paper, not a scale step." },
  { file: "src/app/experience.css", literal: "1123px",
    reason: "A4 is 297mm; at 96dpi that is 1123px. Same reason as the width." },
  { file: "src/app/experience.css", literal: "96px",
    reason: "The QR is square and printed at a fixed size a camera can resolve." },
  { file: "src/app/experience.css", literal: "72px",
    reason: "The printed sheet's margin, chosen for paper rather than for a screen rhythm." },
  { file: "src/app/experience.css", literal: "56px",
    reason: "The shell header's height: one control row, sized by the 40px control plus its padding." },
  { file: "src/app/experience.css", literal: "44px",
    reason: "The phone tab bar: the minimum comfortable touch target, a platform requirement." },
  { file: "src/app/experience.css", literal: "40px",
    reason: "The control height, and the certificate's accent rule. Both are the same measured value." },
  { file: "src/app/experience.css", literal: "180px",
    reason: "The definition-list label column: sized to the longest label in either language." },
  { file: "src/app/experience.css", literal: "560px",
    reason: "The phone breakpoint, which is a device fact rather than a spacing step." },
  { file: "src/app/experience.css", literal: "6px",
    reason: "Sub-4px detail geometry: the status dot, the readiness bar and the chip corner." },
  { file: "src/app/experience.css", literal: "2px",
    reason: "A hairline's emphatic sibling: the accent rule and the focus ring width." },
  { file: "src/app/experience.css", literal: "3px",
    reason: "Half of the 6px readiness bar, so its corner is a semicircle." },
  { file: "src/app/experience.css", literal: "1px",
    reason: "One device pixel: the hairline itself." },
  { file: "src/app/experience.css", literal: "18px",
    reason: "The list row's vertical padding, measured against the 17px row title." },
  { file: "src/app/experience.css", literal: "28px",
    reason: "Optical spacing inside the certificate, between rule and name." },
  { file: "src/app/experience.css", literal: "26px",
    reason: "The page title at phone width." },
  { file: "src/app/experience.css", literal: "32px",
    reason: "The evidence figure, and the certificate name at phone width." },
  { file: "src/app/experience.css", literal: "15px",
    reason: "Two places where 14 is too quiet and 16 too loud: the tab and the verification lede." },
  { file: "src/app/experience.css", literal: "14px",
    reason: "The printed sheet's rule offset, measured on paper." },
  { file: "src/app/experience.css", literal: "10px",
    reason: "The pill's horizontal padding and the readiness gap: sub-step detail." },
  { file: "src/app/experience.css", literal: "24px",
    reason: "The pill height: one line of 12px type plus its padding." },
  { file: "src/app/experience.css", literal: "50%",
    reason: "Half of a box is a circle; there is no design scale for roundness." },
  { file: "src/app/experience.css", literal: "100%",
    reason: "Fill the parent, which is a layout instruction rather than a measurement." },
  { file: "src/app/experience.css", literal: "1.3",
    reason: "Line height for a two-line title: tighter than body, looser than display." },
  { file: "src/app/experience.css", literal: "1.05",
    reason: "Line height for the display name, which is set solid." },
  { file: "src/app/experience.css", literal: "1.1",
    reason: "Line height for the verification verdict." },
  { file: "src/app/experience.css", literal: "0.04em",
    reason: "The language switch's tracking: two uppercase letters need less than the eyebrow." },
  { file: "src/app/experience.css", literal: "-0.01em",
    reason: "Half the display tracking, for the 22-24px headings between ladder and display." },
  { file: "src/app/experience.css", literal: "0.5",
    reason: "The scope separator's opacity." },
  { file: "src/app/experience.css", literal: "60ch",
    reason: "The prose measure, in characters rather than pixels — which is the point of ch." },
  { file: "src/app/experience.css", literal: "56ch",
    reason: "The same measure, one step narrower, for a secondary paragraph." },
  { file: "src/components/bukti/BarisKesiapan.tsx", literal: "%",
    reason: "A computed proportion of the readiness bar: data, not a design value." },
  { file: "src/components/bukti/BarisLingkup.tsx", literal: "20",
    reason: "The institution mark's rendered height, matched to the scope line's cap height." },
  { file: "src/components/sertifikat/LembarA4.tsx", literal: "794",
    reason: "A4 width in CSS pixels; the sheet is scaled to the container from it." },
  { file: "src/components/sertifikat/LembarA4.tsx", literal: "1123",
    reason: "A4 height in CSS pixels; the container's height follows the scale." },
];

/** Every Tailwind family that carries a design decision. */
const TAILWIND_DESIGN = new RegExp(
  "(?:^|[\\s\"'`])(?:" +
    "(?:text|bg|border|ring|fill|stroke|decoration|outline|shadow|from|via|to)-(?!\\[var\\()[a-z0-9/.\\[\\]#-]+" +
    "|(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-[xy])-(?!\\[var\\()[0-9.]+" +
    "|rounded(?:-[a-z0-9]+)?" +
    "|(?:max-w|min-w|w|h|max-h|min-h)-(?!\\[var\\()[0-9.]+" +
    "|(?:leading|tracking|font)-(?!\\[var\\()[a-z0-9.]+" +
  ")(?=[\\s\"'`]|$)",
  "g",
);

const RAW_COLOUR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\s*\(/g;
const RAW_LENGTH = /(?<![\w.-])\d+(?:\.\d+)?(?:px|rem|em|ch|%)/g;

function exemptionsFor(file: string) {
  return EXEMPTIONS.filter((e) => e.file === file).map((e) => e.literal);
}

// ---------------------------------------------------------------- contrast
function srgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255) as [number, number, number];
}
function luminance(hex: string): number {
  const [r, g, b] = srgb(hex).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
/**
 * The tokens `:root` declares. Only `:root` — `@theme inline` below it restates
 * them as Tailwind colours, and reading both would have the restatement
 * overwrite the value with the `var()` that points at it.
 */
function tokens(css: string): Record<string, string> {
  const start = css.indexOf(":root {");
  const end = css.indexOf("\n}", start);
  const block = start >= 0 ? css.slice(start, end) : "";
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

/** The Tailwind utility names `@theme inline` backs with a token. */
function themeColours(css: string): Set<string> {
  const out = new Set<string>();
  for (const m of css.matchAll(/--color-([a-z0-9-]+)\s*:\s*var\(/g)) out.add(m[1]);
  return out;
}

// ------------------------------------------------------- a recording client
type Call = { fn: string; args: unknown };
function recorder() {
  const calls: Call[] = [];
  const client = {
    rpc(fn: string, args?: Record<string, unknown>) {
      calls.push({ fn, args: args ?? {} });
      return Promise.resolve({ data: [], error: null });
    },
  };
  return { calls, client };
}

export const experienceTests: SelfTest[] = [
  {
    id: "UX1-S0-TOKEN-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // 1. every surface is declared, in exactly one list
      const surfaces = [
        ...walk(join(repoRoot, "src", "app")).filter((f) => /\.(tsx|css)$/.test(f)),
        ...walk(join(repoRoot, "src", "components")).filter((f) => /\.tsx$/.test(f)),
      ].map((f) => relative(repoRoot, f).replace(/\\/g, "/"));

      const reset = new Set(RESET_SURFACES);
      // everything under src/components is Slice 0's, so it is reset by
      // construction — a component is not a surface somebody forgot
      for (const f of surfaces) if (f.startsWith("src/components/")) reset.add(f);

      const undeclared = surfaces.filter((f) => !reset.has(f) && !(f in PENDING_SURFACES));
      c.expect(
        undeclared.length === 0,
        "Experience surface(s) in neither the re-set list nor the pending list. A surface outside " +
          "both is a surface outside the lint:\n  " + undeclared.join("\n  "),
      );
      const stale = Object.keys(PENDING_SURFACES).filter((f) => !surfaces.includes(f));
      c.expect(stale.length === 0, `pending surface(s) that no longer exist: ${stale.join(", ")}`);

      // 2. the reset surfaces carry no untokenized design value
      const globals = readFileSync(join(repoRoot, "src", "app", "globals.css"), "utf8");
      const declared = tokens(globals);
      const themed = themeColours(globals);
      c.expect(themed.size > 10, `only ${themed.size} Tailwind colour(s) are backed by a token`);
      c.expect(Object.keys(declared).length > 30, `only ${Object.keys(declared).length} tokens declared`);
      c.expect(declared["--pintar-tokens-version"] === "2", "the token set is not version 2");

      let scanned = 0;
      for (const rel of [...reset].sort()) {
        const abs = join(repoRoot, rel);
        if (!existsSync(abs)) continue;
        const raw = readFileSync(abs, "utf8");
        const text = code(raw);
        const allowed = exemptionsFor(rel);
        scanned++;

        if (rel.endsWith(".css")) {
          // globals.css DECLARES the tokens, so its own right-hand sides are
          // the values themselves; every other stylesheet must reference them.
          if (rel.endsWith("globals.css")) continue;
          for (const m of text.matchAll(RAW_COLOUR)) {
            c.expect(false, `${rel} writes a raw colour ${m[0]} instead of a token`);
          }
          for (const m of text.matchAll(RAW_LENGTH)) {
            if (allowed.includes(m[0])) continue;
            c.expect(false, `${rel} writes the untokenized length ${m[0]}`);
          }
          // unitless values a stylesheet can still smuggle a decision through
          for (const m of text.matchAll(/(?:line-height|opacity|letter-spacing):\s*([^;]+);/g)) {
            const v = m[1].trim();
            if (v.startsWith("var(") || allowed.includes(v) || v === "inherit" || v === "normal") continue;
            c.expect(false, `${rel} writes the untokenized value ${m[0].trim()}`);
          }
          continue;
        }

        for (const m of text.matchAll(RAW_COLOUR)) {
          c.expect(false, `${rel} writes a raw colour ${m[0]}`);
        }
        for (const m of text.matchAll(TAILWIND_DESIGN)) {
          const cls = m[0].trim();
          if (allowed.includes(cls)) continue;
          // A Tailwind colour utility whose name is a token `@theme inline`
          // declares IS a token reference — `bg-surface-1` compiles to
          // `var(--surface-1)`. The rule is "resolves to a token", not "avoids
          // Tailwind", and treating these as violations would push a surface
          // into an inline style, which is strictly worse.
          const colour = /^(?:text|bg|border|ring|fill|stroke|decoration|outline)-(.+)$/.exec(cls);
          if (colour && themed.has(colour[1])) continue;
          c.expect(false, `${rel} styles with the Tailwind scale class "${cls}" rather than a token`);
        }
        // inline style objects
        for (const m of text.matchAll(/style=\{\{([^}]*)\}\}/g)) {
          const body = m[1];
          for (const lit of body.matchAll(RAW_LENGTH)) {
            if (allowed.includes(lit[0]) || allowed.some((a) => lit[0].endsWith(a))) continue;
            c.expect(false, `${rel} inlines the untokenized length ${lit[0]}`);
          }
        }
      }

      // 3. every exemption is real and still needed: a stale allow-list entry
      //    is a hole nobody notices
      for (const e of EXEMPTIONS) {
        const abs = join(repoRoot, e.file);
        c.expect(existsSync(abs), `exemption names a file that does not exist: ${e.file}`);
        if (!existsSync(abs)) continue;
        c.expect(
          readFileSync(abs, "utf8").includes(e.literal),
          `exemption for ${e.literal} in ${e.file} is stale: the literal is no longer there`,
        );
        c.expect(e.reason.length > 20, `exemption for ${e.literal} in ${e.file} has no real reason`);
      }

      c.note(`${scanned} re-set surface(s), ${Object.keys(PENDING_SURFACES).length} awaiting their slice, ` +
        `${EXEMPTIONS.length} classified implementation constant(s)`);
      return c.verdict(
        "every re-set Experience surface resolves its colours, radii, type sizes and spacing to a token in " +
          "the source file src/app/globals.css; every surface is declared either re-set or pending, so a new " +
          "one cannot be added outside the lint; and every allow-listed constant still exists and carries a reason",
      );
    },
  },

  {
    id: "UX1-S0-CONTRAST-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const tk = tokens(readFileSync(join(repoRoot, "src", "app", "globals.css"), "utf8"));
      const AA = 4.5;

      const grounds: Array<[string, string]> = [
        ["white", tk["--surface-1"]],
        ["ivory", tk["--surface-0"]],
        ["well", tk["--surface-2"]],
      ];
      const text = ["--ink-1", "--ink-2", "--ink-3", "--pintar-primary"];
      const status: Array<[string, string]> = [
        ["--status-ok", "--status-ok-soft"],
        ["--status-attention", "--status-attention-soft"],
        ["--status-blocked", "--status-blocked-soft"],
        ["--status-info", "--status-info-soft"],
        ["--pintar-primary", "--pintar-primary-soft"],
      ];

      let measured = 0;
      for (const name of text) {
        const hex = tk[name];
        c.expect(/^#[0-9a-fA-F]{6}$/.test(hex ?? ""), `${name} is not a hex colour: ${hex}`);
        for (const [label, ground] of grounds) {
          const r = ratio(hex, ground);
          measured++;
          c.expect(r >= AA, `${name} on ${label} is ${r.toFixed(2)}:1, below AA ${AA}:1`);
        }
      }
      // a status colour must hold on all three grounds AND on its own soft one
      for (const [fg, soft] of status) {
        for (const [label, ground] of [...grounds, ["its own soft ground", tk[soft]] as [string, string]]) {
          const r = ratio(tk[fg], ground);
          measured++;
          c.expect(r >= AA, `${fg} on ${label} is ${r.toFixed(2)}:1, below AA ${AA}:1`);
        }
      }
      // and the ink the primary carries
      const onPrimary = ratio(tk["--pintar-primary-ink"], tk["--pintar-primary"]);
      measured++;
      c.expect(onPrimary >= AA, `--pintar-primary-ink on --pintar-primary is ${onPrimary.toFixed(2)}:1`);
      const onHover = ratio(tk["--pintar-primary-ink"], tk["--pintar-primary-hover"]);
      measured++;
      c.expect(onHover >= AA, `--pintar-primary-ink on --pintar-primary-hover is ${onHover.toFixed(2)}:1`);

      c.note(`${measured} ratio(s) computed from the token file`);
      return c.verdict(
        "WCAG 2.1 contrast is COMPUTED from src/app/globals.css for every text token against white, ivory " +
          "and the well, and for every status token against its own soft ground, and nothing is below AA — " +
          "so the token lint can never enforce a failing token",
      );
    },
  },

  {
    id: "UX1-S0-HLE-01",
    requires: [],
    run: async () => {
      const c = new Checks();
      const keys = allKeys();
      c.expect(keys.length > 300, `only ${keys.length} copy key(s) in the table`);

      for (const k of keys) {
        const row = telling(k) as Record<string, string>;
        c.expect(typeof row.default === "string" && row.default.length > 0, `${k} has no Indonesian telling`);
        c.expect(typeof row.en === "string" && row.en.length > 0, `${k} has no English telling`);
        // a persona override in one language and not the other is a key that
        // says different things to the same reader depending on the interface
        for (const p of ["learner", "educator", "staff", "public"]) {
          const hasId = typeof row[p] === "string";
          const hasEn = typeof row[`en_${p}`] === "string";
          c.expect(hasId === hasEn, `${k} overrides ${p} in one language only`);
        }
      }

      // and the guard really runs: every key, every persona, both languages,
      // every stage telling a learner can receive
      const rendered = renderAll();
      c.expect(rendered.length > keys.length * 2, `renderAll produced only ${rendered.length} rendering(s)`);
      const byLocale = new Map<string, number>();
      for (const r of rendered) byLocale.set(r.locale, (byLocale.get(r.locale) ?? 0) + 1);
      for (const l of LOCALES) c.expect((byLocale.get(l) ?? 0) > 0, `no rendering in ${l}`);
      c.expect(
        byLocale.get("id") === byLocale.get("en"),
        `the two languages render a different number of tellings: ${byLocale.get("id")} vs ${byLocale.get("en")}`,
      );

      c.note(`${keys.length} keys in the copy table src/lib/hle.ts, ${rendered.length} renderings swept`);
      return c.verdict(
        "every key in the copy table src/lib/hle.ts carries both an Indonesian and an English telling, a " +
          "persona override exists in both languages or neither, and the internal-word guard is exercised " +
          "over every persona, both languages and every stage telling",
      );
    },
  },

  {
    id: "UX1-S0-LANG-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // HALF ONE, BEHAVIOURAL. The same read paths, driven twice, once per
      // language, through a client that records what it was asked for. The
      // recorded sequence and payloads must be byte-identical: the interface
      // language is presentation, and a presentation choice that reached the
      // database would be a tenant-visible consequence of a reader's taste.
      const engine = await import("../src/lib/assessment-engine");
      const transcripts: string[] = [];
      for (const locale of LOCALES) {
        const { calls, client } = recorder();
        // the learner cycle
        await engine.myAssignments(client);
        await engine.cycleState(client, "00000000-0000-0000-0000-000000000001");
        await engine.sessionState(client, "00000000-0000-0000-0000-000000000002").catch(() => undefined);
        await engine.outcome(client, "00000000-0000-0000-0000-000000000002");
        await engine.review(client, "00000000-0000-0000-0000-000000000002");
        await engine.delta(client, "00000000-0000-0000-0000-000000000001");
        // and the certificate the slice adds
        await engine.myCertificate(client, "00000000-0000-0000-0000-000000000002");
        // the copy is rendered in this language, in the same pass, so a render
        // that reached for the database would show up in the transcript
        for (const k of ["cycle.title", "sertifikat.daftar.judul", "verifikasi.status.BERLAKU"]) {
          t(k as HleEvent, "learner", { locale });
        }
        transcripts.push(JSON.stringify(calls));
      }
      c.expect(
        transcripts[0] === transcripts[1],
        "the recorded call sequence differs between the two interface languages:\n  id: " +
          transcripts[0].slice(0, 300) + "\n  en: " + transcripts[1].slice(0, 300),
      );
      const callCount = JSON.parse(transcripts[0]).length;
      c.expect(callCount >= 5, `only ${callCount} call(s) recorded; the comparison would be thin`);

      // HALF TWO, STRUCTURAL. The behavioural half proves today's code paths
      // are identical; this one stops tomorrow's from differing. No database
      // call anywhere under src/ may carry the language, and no server action,
      // RPC or table write may name the preference cookie.
      const sources = [
        ...walk(join(repoRoot, "src")).filter((f) => /\.(ts|tsx)$/.test(f)),
      ];
      const LOCALE_WORD = /\b(locale|lang|bahasa|pintar-lang)\b/i;
      let inspected = 0;
      for (const f of sources) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        if (rel === "src/lib/locale.ts" || rel === "src/lib/locale-kontrak.ts" || rel === "src/components/PengalihBahasa.tsx") continue; // the preference itself
        const text = code(readFileSync(f, "utf8"));
        inspected++;
        for (const m of text.matchAll(/\.rpc\(\s*([^)]*)\)/g)) {
          c.expect(!LOCALE_WORD.test(m[1]), `${rel} passes the interface language into an RPC: ${m[0].slice(0, 120)}`);
        }
        for (const m of text.matchAll(/\.(insert|update|upsert|delete)\(\s*([^)]*)\)/g)) {
          c.expect(!LOCALE_WORD.test(m[2] ?? ""), `${rel} writes the interface language to the database: ${m[0].slice(0, 120)}`);
        }
        for (const m of text.matchAll(/\.(eq|in|filter|match)\(\s*([^)]*)\)/g)) {
          c.expect(!LOCALE_WORD.test(m[2] ?? ""), `${rel} filters a database read by the interface language: ${m[0].slice(0, 120)}`);
        }
      }
      // and there is exactly one mechanism: no second cookie, no column
      const localeSrc = readFileSync(join(repoRoot, "src", "lib", "locale-kontrak.ts"), "utf8");
      c.expect(/LOCALE_COOKIE = "pintar-lang"/.test(localeSrc), "the preference cookie is not pintar-lang");
      // exactly one cookie name, declared once: a second would be a second
      // mechanism, and two mechanisms is how the two halves start to disagree
      const declarations = walk(join(repoRoot, "src")).filter((f) => /\.(ts|tsx)$/.test(f))
        .filter((f) => /LOCALE_COOKIE\s*=\s*"/.test(readFileSync(f, "utf8")));
      c.expect(declarations.length === 1,
        `the preference cookie name is declared in ${declarations.length} places: ` +
        declarations.map((f) => relative(repoRoot, f)).join(", "));
      const migrations = walk(join(repoRoot, "supabase", "migrations")).filter((f) => f.endsWith(".sql"));
      for (const f of migrations) {
        c.expect(
          !/pintar-lang|interface_language|ui_locale/i.test(readFileSync(f, "utf8")),
          `${relative(repoRoot, f)} gives the interface language a home in the schema`,
        );
      }

      c.note(`${callCount} recorded call(s) per language, ${inspected} source file(s) inspected, ` +
        `${migrations.length} migration(s) checked for a language column`);
      return c.verdict(
        "the interface language changes rendered text and number formatting only: the recorded RPC call " +
          "sequence and payloads from the learner cycle and the certificate read are byte-identical in id " +
          "and en, no source file passes the language into a database call, and no migration gives it a " +
          "column. BOUNDED: this drives the application's read paths through a recording client rather " +
          "than a hosted session, so it proves what the application ASKS FOR, not what a live PostgREST " +
          "receives; the hosted half rides on the same call sites",
      );
    },
  },

  {
    id: "UX1-S1-CERT-COLS-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const EXPECTED = [
        "id", "session_id", "institution_id", "certificate_number", "verification_token",
        "status", "issued_at_iso", "revoked_at", "revoked_reason", "supersedes_certificate_id",
      ];
      const FORBIDDEN = ["signature", "key_version", "canonical_payload", "snapshot_id"];

      // 1. the list itself, as the module exports it
      const actual = LIST_COLUMNS.split(",").map((s) => s.trim());
      c.expect(
        JSON.stringify(actual) === JSON.stringify(EXPECTED),
        `the certificate list columns are not the ten Q-11 names:\n  got:      ${actual.join(", ")}\n  expected: ${EXPECTED.join(", ")}`,
      );

      // 2. and no select anywhere under src/ reads `certificates` differently.
      //    Greps the source, because the ruling is about the request that goes
      //    out, and a second select built inline would not be the export above.
      const sources = walk(join(repoRoot, "src")).filter((f) => /\.(ts|tsx)$/.test(f));
      let selects = 0;
      for (const f of sources) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const text = code(readFileSync(f, "utf8"));
        for (const m of text.matchAll(/\.from\(\s*["']certificates["']\s*\)\s*\.select\(\s*([^)]*)\)/g)) {
          selects++;
          const arg = m[1].trim();
          c.expect(
            arg === "LIST_COLUMNS",
            `${rel} selects from certificates with something other than LIST_COLUMNS: ${arg.slice(0, 120)}`,
          );
        }
        // the cryptographic fields are never named on this side of the wire at
        // all: not requested, not rendered, not retained, not logged
        if (rel.startsWith("src/app/belajar") || rel.startsWith("src/components/sertifikat") || rel === "src/lib/sertifikat.ts") {
          for (const word of FORBIDDEN) {
            const used = new RegExp(`["'\`.]${word}\\b`).test(text);
            c.expect(!used, `${rel} names the cryptographic column ${word} on a learner surface`);
          }
        }
      }
      c.expect(selects >= 1, "no direct read of the certificates table was found to check");

      // 3. and the learner pages never reach for the issuance route (V-6a)
      for (const f of sources) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        if (!rel.startsWith("src/app/belajar") && !rel.startsWith("src/components")) continue;
        c.expect(
          !/certificates\/issue/.test(code(readFileSync(f, "utf8"))),
          `${rel} reaches for the issuance route; no learner page may (V-6a)`,
        );
      }

      c.note(`${selects} direct select(s) of the certificates table in the source, all on the ten-column list`);
      return c.verdict(
        "the direct certificate-list read in the source requests exactly the ten Q-11 columns and no other; " +
          "signature, key_version, canonical_payload and snapshot_id are named nowhere on a learner surface; " +
          "and no learner page reaches for the service-role issuance route (V-6a)",
      );
    },
  },

  {
    id: "UX1-S1-CERT-ELIGIBLE-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // 1. the binding itself, as the predicates the pages branch on
      c.expect(rendersCredential("ELIGIBLE") === false, "an ELIGIBLE certificate would render as a credential");
      for (const st of ["ISSUED", "REVOKED", "SUPERSEDED"] as const) {
        c.expect(rendersCredential(st) === true, `${st} would not render its retained record`);
      }
      c.expect(rendersVerification("ISSUED") === true, "an ISSUED certificate would show no way to check it");
      for (const st of ["ELIGIBLE", "REVOKED", "SUPERSEDED"] as const) {
        c.expect(
          rendersVerification(st) === false,
          `${st} would offer a verification link; only ISSUED is a credential to present`,
        );
      }

      // 2. and the pages really branch on it before they render any of the six
      //    things the ruling suppresses
      const detail = readFileSync(
        join(repoRoot, "src", "app", "belajar", "[tugas]", "sertifikat", "page.tsx"), "utf8");
      // The import block is not the page: a component imported at the top is
      // not rendered there. What the branch order has to be measured against is
      // where each one is USED.
      const source = code(detail).replace(/^import [^;]*;$/gm, "");
      c.expect(/rendersCredential\(detail\.status\)/.test(source),
        "the detail page does not apply the ELIGIBLE binding to my_certificate's own result");
      c.expect(/rendersVerification\(detail\.status\)/.test(source),
        "the detail page does not gate the verification block on the issued state");
      const eligibleBranch = source.indexOf("!rendersCredential(detail.status)");
      const verificationUrl = source.indexOf("verificationUrl = issued");
      c.expect(eligibleBranch >= 0 && verificationUrl > eligibleBranch,
        "the ELIGIBLE branch does not return before a verification link is built");

      // the six suppressed things, each of which only exists after the branch
      for (const [thing, needle] of [
        ["the QR code", "<KodeVerifikasi"],
        ["the verification link", "verificationUrl"],
        ["the copy-link action", "<SalinTautan"],
        ["the print action", "<AksiCetak"],
        ["the certificate number", "certificate_number"],
        ["the name as issued", "name_as_issued"],
      ] as const) {
        const at = source.indexOf(needle);
        if (at < 0) continue; // the QR lives in the card component, not here
        c.expect(at > eligibleBranch, `${thing} is reachable before the ELIGIBLE branch returns`);
      }

      // 3. the pending state says the honest thing and offers no issuance
      c.expect(/sertifikat\.disiapkan\.judul/.test(source), "the pending state has no telling");
      c.expect(!/issue/i.test(source.replace(/issued/gi, "")), "the pending state reaches for issuance");

      c.note("the binding's predicates, the detail page's branch order, and the six suppressed affordances");
      return c.verdict(
        "an ELIGIBLE certificate renders no QR, no verification link, no copy-link action, no print action, " +
          "no certificate number and no name-as-issued on either page: the source of the detail page returns " +
          "from the pending branch before any of them is built, and the binding is applied to my_certificate's " +
          "own result as well as to the list's, because that RPC does not filter by status",
      );
    },
  },

  {
    id: "UX1-S1-QR-01",
    requires: [],
    run: async () => {
      const c = new Checks();
      // A QR on a printed certificate is the only part of the credential a
      // stranger uses without reading it. So it is decoded back, by an
      // implementation that is not the one that drew it.
      const links = [
        "https://pintar.example.id/verifikasi/k7QmX2vR9pLwB4tHs8NcY1eDfZ6uJ0aGqKo3iVbMnTx",
        "https://pintar.sekolah-peragaan.sch.id/verifikasi/Pq4Tz8LmN2cW6yH0vR5bK9sX1dJfG3aE7uQiOnYtBvC",
        "http://127.0.0.1:3000/verifikasi/" + "Zz9".repeat(15),
      ];
      for (const link of links) {
        const m = qrMatrix(link);
        const n = m.length;
        const scale = 4, quiet = 4 * scale, w = n * scale + quiet * 2;
        const px = new Uint8ClampedArray(w * w * 4).fill(255);
        for (let r = 0; r < n; r++) {
          for (let col = 0; col < n; col++) {
            if (!m[r][col]) continue;
            for (let dy = 0; dy < scale; dy++) {
              for (let dx = 0; dx < scale; dx++) {
                const i = ((quiet + r * scale + dy) * w + (quiet + col * scale + dx)) * 4;
                px[i] = px[i + 1] = px[i + 2] = 0;
              }
            }
          }
        }
        const decoded = jsQR(px, w, w);
        c.expect(decoded?.data === link, `a ${n}×${n} symbol decoded to ${JSON.stringify(decoded?.data ?? null)}, not the link`);
      }
      // and an over-long input is refused rather than silently truncated: half
      // a verification link in a QR code is worse than no QR code
      let refused = false;
      try { qrMatrix("A".repeat(400)); } catch { refused = true; }
      c.expect(refused, "an input past capacity was encoded anyway rather than refused");

      c.note(`${links.length} verification link(s) encoded and decoded back`);
      return c.verdict(
        "the QR symbol the certificate prints is decoded back to the exact verification link by an " +
          "independent decoder (jsQR), at three lengths and therefore three symbol versions, and an input " +
          "past capacity is refused rather than truncated",
      );
    },
  },
  {
    id: "UX1-S1-KAKI-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const rel = "src/components/KakiPintar.tsx";
      const src = readFileSync(join(repoRoot, rel), "utf8");
      const body = code(src);

      // 1. the four lines Yazid supplied, and nothing invented beside them
      const SUPPLIED = [
        "Dr. dr. Gladys DT Tubarad, M.Pd.Ked",
        "PT ZAYD PINTAR SELALU",
        "info@pintarselalu.com",
        "pintarselalu.com",
      ];
      for (const line of SUPPLIED) {
        c.expect(body.includes(line), `the footer does not carry the supplied line: ${line}`);
      }

      // 2. PROPER NOUNS DO NOT PASS THROUGH THE COPY TABLE. A person's name, a
      //    company's registered name, an email address and a domain are the
      //    same string in both languages; two keys that must never diverge are
      //    a divergence waiting to happen. So they are constants, and the copy
      //    table must not carry them either.
      const hle = readFileSync(join(repoRoot, "src", "lib", "hle.ts"), "utf8");
      for (const line of SUPPLIED) {
        c.expect(!hle.includes(line), `the copy table carries the proper noun ${line}; it cannot be translated`);
      }
      c.expect(!/\bt\(/.test(body), "the footer routes a proper noun through the copy table");

      // 3. the links: protocol in the href, out of the visible text
      c.expect(/href=\{`mailto:\$\{SUREL\}`\}/.test(body), "the email is not a mailto link");
      c.expect(/href=\{`https:\/\/\$\{RANAH\}`\}/.test(body), "the website link carries no scheme");
      c.expect(
        !/>\s*https?:\/\//.test(body),
        "a protocol appears in the footer's visible text; the reader sees the domain, the browser gets the scheme",
      );
      c.expect(/rel="noreferrer"/.test(body), "the external link leaks a referrer");

      // 4. NO PROMOTION. The footer says who stands behind PINTAR and stops.
      for (const [what, pattern] of [
        ["a copyright line", /©|copyright|\(c\)\s*20/i],
        ["a legal claim", /all rights reserved|hak cipta/i],
        ["a social link", /twitter|facebook|instagram|linkedin|x\.com|tiktok|youtube/i],
      ] as const) {
        c.expect(!pattern.test(body), `the footer grew ${what}, which Yazid did not supply`);
      }

      // 5. IT IS NOT ON THE CREDENTIAL. A printed certificate carries its
      //    ISSUING INSTITUTION's identity; the software vendor's name on the
      //    same sheet would be a second claimant to the provenance of the
      //    evidence, which is the one thing a certificate may not be ambiguous
      //    about. Every mount that can reach a printed page suppresses it, and
      //    the certificate card itself never renders it at all.
      const card = readFileSync(
        join(repoRoot, "src", "components", "sertifikat", "KartuSertifikat.tsx"), "utf8");
      c.expect(!/KakiPintar/.test(card), "the credential card renders the corporate footer");
      const detail = readFileSync(
        join(repoRoot, "src", "app", "belajar", "[tugas]", "sertifikat", "page.tsx"), "utf8");
      for (const m of code(detail).matchAll(/<KakiPintar([^/>]*)\/>/g)) {
        c.expect(
          /pin-noprint/.test(m[1]),
          `the certificate page mounts the footer without pin-noprint: <KakiPintar${m[1]}/>`,
        );
      }

      // 6. and it really is mounted where a page ends
      const mounts = walk(join(repoRoot, "src"))
        .filter((f) => /\.tsx$/.test(f))
        .filter((f) => /<KakiPintar/.test(readFileSync(f, "utf8")))
        .map((f) => relative(repoRoot, f).replace(/\\/g, "/"));
      c.expect(mounts.length >= 3, `the footer is mounted on only ${mounts.length} surface(s)`);

      c.note(`${SUPPLIED.length} supplied line(s), ${mounts.length} mount(s), none on the printed sheet`);
      return c.verdict(
        "the application footer in the source src/components/KakiPintar.tsx carries exactly the four lines " +
          "Yazid supplied and nothing beside them; the proper nouns are constants rather than copy-table keys, " +
          "so they cannot diverge between the two languages; the protocol sits in the href and not in the " +
          "visible text; and no mount that can reach a printed certificate renders it, because a credential " +
          "carries its issuing institution's identity and not its software vendor's",
      );
    },
  },
  {
    id: "UX1-BRAND-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const rel = "public/brand/pintar-selalu-logo.png";
      const file = join(repoRoot, rel);
      c.expect(existsSync(file), `the supplied logo asset is missing: ${rel}`);
      if (!existsSync(file)) return c.verdict("the mark");

      // 1. IT IS THE SUPPLIED FILE, BYTE FOR BYTE. Not redrawn, not recoloured,
      //    not cropped, not re-encoded, not "optimised". A digest is the only
      //    check that catches a well-meant recompression, which is exactly the
      //    kind of change that looks like nothing and alters artwork somebody
      //    else owns.
      const bytes = readFileSync(file);
      const SUPPLIED_SHA256 = "0e85e80fb232b299016f3d363102823686a7489e86cb957cfbe0e48128a86463";
      const sha = createHash("sha256").update(bytes).digest("hex");
      c.expect(
        sha === SUPPLIED_SHA256,
        `the logo asset is not the file Yazid supplied:\n  expected ${SUPPLIED_SHA256}\n  found    ${sha}`,
      );

      // 2. and its intrinsic geometry, read from the PNG header rather than
      //    trusted, so a resize is caught even if somebody updates the digest
      c.expect(bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
        "the logo asset is not a PNG");
      const w = bytes.readUInt32BE(16);
      const h = bytes.readUInt32BE(20);
      c.expect(w === 766 && h === 429, `the artwork is ${w}x${h}; the supplied file is 766x429`);
      const ratio = w / h;

      // 3. THE RENDERING CANNOT DISTORT IT. The rule sets a height and never a
      //    width; the intrinsic ratio supplies the rest. A rule that set both
      //    could squash the letterforms, and no amount of care in review
      //    catches a squash of a few per cent.
      const css = code(readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8"));
      const rule = /\.pin-merek\s*\{([^}]*)\}/.exec(css);
      c.expect(rule !== null, "there is no .pin-merek rule to check");
      if (rule) {
        c.expect(/height:\s*var\(--logo-height\)/.test(rule[1]), ".pin-merek does not take its height from a token");
        c.expect(/width:\s*auto/.test(rule[1]), ".pin-merek does not leave its width to the artwork");
        // Every width declaration in the rule must be `auto`. A negative
        // lookahead here reads well and is wrong: `\s*` backtracks to zero and
        // the guard passes on `width: auto` itself, so the check never fires.
        const widths = [...rule[1].matchAll(/width:\s*([^;]+)/g)].map((m) => m[1].trim());
        c.expect(
          widths.every((v) => v === "auto"),
          `.pin-merek sets a width (${widths.join(", ")}); the artwork would be distorted`,
        );
      }
      const component = code(readFileSync(join(repoRoot, "src", "components", "MerekPintar.tsx"), "utf8"));
      c.expect(!/style=\{\{/.test(component), "the mark carries an inline style; sizing belongs in the token rule");
      c.expect(/alt=\{NAMA\}/.test(component) && /NAMA = "PINTAR SELALU"/.test(component),
        "the mark does not carry its own name as alternative text");
      // the intrinsic attributes must match the file, or the reserved box is
      // the wrong shape and the header shifts as the image lands
      c.expect(new RegExp(`INTRINSIC_WIDTH = ${w}\\b`).test(component)
        && new RegExp(`INTRINSIC_HEIGHT = ${h}\\b`).test(component),
        `the component's intrinsic dimensions do not match the file's ${w}x${h}`);

      // 4. IT IS NOT ON THE CREDENTIAL. The certificate's issuer is the
      //    INSTITUTION. A software vendor's mark on the same sheet would be a
      //    second claimant to the provenance of the evidence.
      const card = readFileSync(
        join(repoRoot, "src", "components", "sertifikat", "KartuSertifikat.tsx"), "utf8");
      c.expect(!/MerekPintar|pin-merek|brand\//.test(card),
        "the credential card renders the PINTAR SELALU mark; the certificate's issuer is the institution");
      const sheet = /\.pin-sheet\b[^{]*\{([^}]*)\}/.exec(css);
      c.expect(sheet === null || !/brand\//.test(sheet[1]), "the printed sheet references the brand asset");

      // 5. and every surface that shows it is an application surface
      const mounts = walk(join(repoRoot, "src"))
        .filter((f) => /\.tsx$/.test(f))
        .filter((f) => /<MerekPintar/.test(readFileSync(f, "utf8")))
        .map((f) => relative(repoRoot, f).replace(/\\/g, "/"));
      c.expect(mounts.length >= 2, `the mark is mounted on only ${mounts.length} surface(s)`);

      c.note(`${w}x${h}, ratio ${ratio.toFixed(4)}, ${bytes.length} bytes, digest verified, ${mounts.length} mount(s)`);
      return c.verdict(
        "the mark rendered by the application is the supplied artwork in public/brand/pintar-selalu-logo.png " +
          "byte for byte -- verified by sha256, so a recompression or a resize fails -- its intrinsic geometry " +
          "is read from the PNG header rather than trusted, the style rule sets a height and never a width so " +
          "the letterforms cannot be squashed, and it appears on no surface that prints a credential",
      );
    },
  },
  {
    id: "UX1-BRAND-02",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const ruling = join(repoRoot, "claude", "UX-1-INSTITUTION-MARK-RULING.md");
      c.expect(existsSync(ruling), "the institution-mark ruling is not recorded");

      // 1. THE Q-7 GAP IS STILL A GAP, measured rather than remembered. The
      //    ruling permits implementation only if the frozen contract already
      //    exposes an institution mark safely. It does not, and this is what
      //    says so out loud the day that changes — so the gap is closed on
      //    purpose, with the delivery path solved, rather than by whoever adds
      //    the obvious column.
      const migrations = walk(join(repoRoot, "supabase", "migrations")).filter((f) => f.endsWith(".sql"));
      c.expect(migrations.length === 83, `${migrations.length} migrations; the frozen baseline has 83`);
      // BOTH SHAPES A COLUMN CAN ARRIVE IN. The first version of this matched
      // only a create-table definition, so a planted `alter table … add column
      // logo_url text` sailed past it — a guard that misses the thing it exists
      // to catch is worse than none, because it reads green while enforcing
      // nothing. Watched to fail in both shapes before being trusted.
      const MARK_NAME = "(?:logo|logo_url|brand|brand_url|mark_url|emblem|crest|wordmark|favicon|theme|theme_json)";
      const MARK_TYPE = "(?:text|uuid|jsonb|json|varchar|bytea)";
      const MARK_COLUMN = new RegExp(
        `(?:^[\\s,]*|add\\s+column\\s+(?:if\\s+not\\s+exists\\s+)?)${MARK_NAME}\\s+${MARK_TYPE}\\b`,
        "im",
      );
      const withColumn = migrations.filter((f) => MARK_COLUMN.test(readFileSync(f, "utf8")))
        .map((f) => relative(repoRoot, f));
      c.expect(
        withColumn.length === 0,
        "an institution-mark or theme column now exists in the schema. That is Q-7 being closed: re-read " +
          "claude/UX-1-INSTITUTION-MARK-RULING.md §3 before wiring it up, because a column alone is not " +
          "sufficient — the public verification page needs a delivery path a stranger can read, and every " +
          "migration asserts there are no public storage buckets:\n  " + withColumn.join("\n  "),
      );

      // and the delivery-path half, which is the one likely to be missed
      const publicBucket = migrations.filter((f) => /insert into storage\.buckets[^;]*\btrue\b/i.test(readFileSync(f, "utf8")))
        .map((f) => relative(repoRoot, f));
      c.expect(publicBucket.length === 0, `a public storage bucket appeared: ${publicBucket.join(", ")}`);

      // 2. BOUNDED BRANDING, NOT TENANT THEMING (ruling §2.3). An institution
      //    may replace the mark. The moment a second thing is configurable per
      //    tenant, the guarantee that every PINTAR screen behaves the same way
      //    for every child is gone.
      const experience = [
        ...walk(join(repoRoot, "src", "components")).filter((f) => /\.tsx?$/.test(f)),
        ...walk(join(repoRoot, "src", "app")).filter((f) => /\.(tsx?|css)$/.test(f)),
      ];
      const THEMING = /\b(tenantTheme|institutionTheme|themeFor|customTheme|brandingFor|tenant_theme|institution_theme|--tenant-|--institution-)\b/;
      for (const f of experience) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const m = THEMING.exec(code(readFileSync(f, "utf8")));
        c.expect(m === null, `${rel} introduces a per-tenant theming mechanism (${m?.[0]}); the ruling permits the mark and nothing else`);
      }

      // 3. NO INSTITUTION IS NAMED IN src/ AT ALL — and this reads the RAW
      //    source rather than stripping comments, on purpose. A comment cannot
      //    key behaviour to an institution, but the rule costs nothing to obey
      //    (a component can say "an institution") and a strict rule has no
      //    false negative to argue about later. It caught this session writing
      //    the ruling's own example into a doc comment.
      const INSTITUTIONS = /\b(UIN|Universitas Islam Negeri)\b/;
      for (const f of experience) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        c.expect(!INSTITUTIONS.test(readFileSync(f, "utf8")), `${rel} names a specific institution`);
      }

      // 4. and the default is still the default: one component renders the
      //    shell identity, so the future substitution has one place to happen
      const mark = readFileSync(join(repoRoot, "src", "components", "MerekPintar.tsx"), "utf8");
      c.expect(/pintar-selalu-logo\.png/.test(mark), "the default mark is no longer the PINTAR SELALU logo");
      const renderers = experience
        .filter((f) => /\.tsx$/.test(f))
        .filter((f) => /brand\/[a-z-]+\.png/.test(code(readFileSync(f, "utf8"))))
        .map((f) => relative(repoRoot, f).replace(/\\/g, "/"));
      c.expect(
        renderers.length === 1 && renderers[0] === "src/components/MerekPintar.tsx",
        `the brand asset is referenced from ${renderers.length} component(s); the shell identity must have ` +
          `exactly one renderer so an institution mark substitutes in one place: ${renderers.join(", ")}`,
      );

      c.note(`${migrations.length} migrations swept for a mark column, ${experience.length} Experience file(s) for theming`);
      return c.verdict(
        "the institution-mark ruling in claude/UX-1-INSTITUTION-MARK-RULING.md still holds against the tree: " +
          "the Q-7 source does not exist in the 83 frozen migrations and no public storage bucket has appeared, " +
          "so the gap cannot be closed without re-reading the delivery-path half; no per-tenant theming " +
          "mechanism has entered the Experience layer, which is the boundary between bounded branding and " +
          "tenant theming; no specific institution is named in src/; and the shell identity has exactly one " +
          "renderer, so the future substitution has exactly one place to happen",
      );
    },
  },

  // -------------------------------------------------------------------------
  {
    id: "UX1-S0-SAPAAN-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // THE FORM OF ADDRESS, RULED 2026-09-16.
      //
      // "Prefer natural Indonesian that avoids unnecessary pronouns. Where a
      // learner-facing pronoun is necessary, use Anda, not kamu."
      //
      // The rule is about the READER'S pronoun, so this tests the second
      // person only, and only in Indonesian: English has no formal and
      // informal you to choose between.
      //
      // Two halves, because the copy table is not the only place a sentence
      // can reach a learner. Half one reads what `t()` actually renders — the
      // stage overrides included, which is where the informal register lived
      // longest, since a Year 4 telling is exactly where "kamu" feels natural
      // to write. Half two reads the surfaces, where a hard-coded Indonesian
      // string bypasses the table altogether.

      // A word ending in -mu is the informal possessive clitic UNLESS it is
      // one of these, which are ordinary words that happen to end that way.
      // Declared rather than guessed, so a false positive is fixed by adding
      // a word here and is visible in the diff when somebody does.
      const NOT_A_CLITIC = ["ilmu", "jamu", "tamu", "semu", "temu", "ramu"];
      const STANDALONE = ["kamu", "kau", "engkau", "dikau", "dirimu", "kalian"];
      const WORD = /\b[a-z]+\b/gi;

      /**
       * Every informal second-person form in one piece of Indonesian text.
       *
       * One pass over the words rather than two patterns, because "kamu" is
       * both a standalone pronoun and a word ending in -mu: two patterns
       * counted it twice, and a guard whose own count is wrong is a guard
       * nobody can read a failure from.
       */
      function informal(text: string): string[] {
        const hits: string[] = [];
        for (const m of text.matchAll(WORD)) {
          const w = m[0].toLowerCase();
          if (STANDALONE.includes(w)) { hits.push(m[0]); continue; }
          if (!w.endsWith("mu") || w.length < 4) continue;
          if (NOT_A_CLITIC.some((safe) => w.endsWith(safe))) continue;
          hits.push(m[0]);
        }
        return hits;
      }

      // the guard is only worth its line if it can see the thing it forbids
      c.expect(informal("Sertifikat kamu sedang disiapkan.").length === 1, "the guard misses the standalone pronoun");
      c.expect(informal("Jawabanmu tersimpan.").length === 1, "the guard misses the possessive clitic");
      c.expect(informal("Anda bertemu guru yang berilmu.").length === 0, "the guard trips on an ordinary word ending in -mu");

      // HALF ONE: what the copy table renders to a learner or to the public.
      const rendered = renderAll().filter((r) => r.locale === "id" && (r.persona === "learner" || r.persona === "public"));
      c.expect(rendered.length > 200, `only ${rendered.length} learner/public Indonesian telling(s) swept`);
      for (const r of rendered) {
        const hits = informal(r.text);
        c.expect(
          hits.length === 0,
          `${r.event} addresses the ${r.persona} informally (${hits.join(", ")}): "${r.text}"`,
        );
      }

      // HALF TWO: what the re-set surfaces say without going through the
      // table. Pending surfaces are excluded by the same declaration the
      // token lint uses, so a surface joins this rule on the day its slice
      // re-sets it rather than on the day somebody remembers to add it.
      const surfaces = [
        ...walk(join(repoRoot, "src", "app")).filter((f) => /\.tsx$/.test(f)),
        ...walk(join(repoRoot, "src", "components")).filter((f) => /\.tsx$/.test(f)),
      ].map((f) => relative(repoRoot, f).replace(/\\/g, "/"));
      const inScope = surfaces.filter((f) => !(f in PENDING_SURFACES));
      c.expect(inScope.length > 10, `only ${inScope.length} surface(s) in scope`);
      for (const rel of inScope) {
        const hits = informal(code(readFileSync(join(repoRoot, rel), "utf8")));
        c.expect(hits.length === 0, `${rel} writes an informal second person (${hits.join(", ")})`);
      }

      c.note(
        `${rendered.length} learner/public Indonesian tellings and ${inScope.length} re-set surface(s) swept; ` +
          `${Object.keys(PENDING_SURFACES).length} surface(s) join the rule when their slice re-sets them`,
      );
      return c.verdict(
        "no Indonesian telling addressed to a learner or to the public uses an informal second person, in the " +
          "copy table src/lib/hle.ts or on any re-set surface: where the reader is addressed at all it is as " +
          "Anda, and most tellings carry no pronoun because Indonesian does not need one",
      );
    },
  },

  // -------------------------------------------------------------------------
  {
    id: "UX1-S0-FAKTA-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // THE RESPONSIVE FACT STACK, RULED 2026-09-16.
      //
      // A compact fact summary reads left to right across a wide column and
      // stacks label over value on a narrow one. The rule is site-wide for
      // this structure, which in CSS means: `.pin-facts` is the structure,
      // and every rule that touches it inside the phone block either stacks
      // it or is the sheet, which is paper and does not reflow.
      //
      // The subtle half is the MORE SPECIFIC selector. `.pin-commit
      // .pin-facts` outranks `.pin-facts` at any width, so a stack written
      // only on the plain selector silently leaves the commitment shell —
      // the screen the correction was raised against — in three columns.
      const css = readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8");

      /** The body of a block, balanced braces, from its opening line. */
      function block(source: string, open: string): string {
        const start = source.indexOf(open);
        if (start < 0) return "";
        let depth = 0;
        for (let i = start + open.length - 1; i < source.length; i++) {
          if (source[i] === "{") depth++;
          else if (source[i] === "}" && --depth === 0) return source.slice(start + open.length, i);
        }
        return "";
      }

      /** Every rule in a stylesheet body, as selector plus declarations. */
      function rules(body: string): Array<{ sel: string; decl: string }> {
        const out: Array<{ sel: string; decl: string }> = [];
        for (const m of body.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
          out.push({ sel: m[1].replace(/\/\*[\s\S]*?\*\//g, " ").trim(), decl: m[2] });
        }
        return out;
      }

      const phone = block(css, "@media (max-width: 560px) {");
      c.expect(phone.length > 200, "the phone block was not found in src/app/experience.css");

      // 1. wide is horizontal: the structure exists and has more than one column
      const wide = rules(css.slice(0, css.indexOf("@media (max-width: 560px)")))
        .filter((r) => /(^|,|\s)\.pin-facts(\s|,|$)/.test(r.sel) && /grid-template-columns/.test(r.decl));
      c.expect(wide.length > 0, "no wide rule sets the columns of .pin-facts");
      for (const r of wide) {
        const cols = /grid-template-columns:\s*([^;]+)/.exec(r.decl)?.[1].trim() ?? "";
        c.expect(/repeat\(\s*[2-9]/.test(cols), `the wide treatment of "${r.sel}" is not a horizontal row: ${cols}`);
      }

      // 2. narrow is a stack, for EVERY selector whose subject is .pin-facts,
      //    however specific — except the sheet
      const narrow = rules(phone).filter((r) => /\.pin-facts/.test(r.sel));
      c.expect(narrow.length >= 2, `only ${narrow.length} narrow rule(s) touch .pin-facts; the specific selector is unguarded`);
      let stacked = 0;
      let sheet = 0;
      for (const r of narrow) {
        const cols = /grid-template-columns:\s*([^;]+)/.exec(r.decl)?.[1].trim();
        if (/\.pin-sheet/.test(r.sel)) {
          c.expect(
            cols !== undefined && /repeat\(\s*[2-9]/.test(cols),
            `the sheet's facts reflow at phone width (${cols}); A4 is scaled whole, never reflowed`,
          );
          sheet++;
          continue;
        }
        c.expect(cols !== undefined, `"${r.sel}" is narrowed without setting its columns, so it keeps the wide row`);
        c.expect(cols === "1fr", `"${r.sel}" is not a single-column stack at phone width: ${cols}`);
        // by selector, not by rule: one comma-separated rule can narrow the
        // plain class and the specific one together, and "1" would read as a
        // gap that is not there
        stacked += r.sel.split(",").length;
      }
      c.expect(sheet === 1, `${sheet} sheet exception(s); the paper is the one thing that does not narrow`);

      // 3. every selector that narrows .pin-facts anywhere is covered above,
      //    including the ones that outrank the plain class
      const specific = narrow.filter((r) => /\S+\s+\.pin-facts/.test(r.sel) && !/\.pin-sheet/.test(r.sel));
      const plain = narrow.filter((r) => /(^|,)\s*\.pin-facts\s*(,|$)/.test(r.sel));
      c.expect(plain.length > 0, ".pin-facts itself is never stacked at phone width");
      c.expect(
        specific.length > 0,
        "no descendant selector of .pin-facts is stacked at phone width, yet the wide stylesheet has one " +
          "(.pin-commit .pin-facts) that outranks the plain class — the commitment shell would stay horizontal",
      );

      // 4. nothing was added to carry the change. The ruling said the stack
      //    is the whole change: no icons, no markers, no rules drawn between
      //    the pairs to hold them together once they are no longer columns.
      for (const r of rules(css).filter((x) => /\.pin-facts/.test(x.sel) && /::(before|after)/.test(x.sel))) {
        c.expect(false, `"${r.sel}" adds a generated marker to the fact summary`);
      }

      // 5. and the other compact label/value structure narrows the same way,
      //    which is what makes this a pattern rather than one fix
      const dl = rules(phone).find((r) => /\.pin-dl\s*>\s*div/.test(r.sel));
      c.expect(dl !== undefined, ".pin-dl does not narrow at phone width");
      c.expect(
        /grid-template-columns:\s*1fr/.test(dl?.decl ?? ""),
        "the verification page's label/value rows do not stack at phone width, so the two compact structures " +
          "in the product disagree about what narrow means",
      );

      c.note(`${stacked} fact summar(ies) stacked at phone width, ${sheet} sheet exception, ${wide.length} wide rule(s)`);
      return c.verdict(
        "the compact fact summary stacks label over value below 560px wherever it occurs — on the plain class " +
          "and on the more specific selector that outranks it — while the A4 sheet keeps its printed row " +
          "because it is scaled whole rather than reflowed; the verification page's label/value rows narrow " +
          "the same way; and nothing was added to carry the change",
      );
    },
  },
];
