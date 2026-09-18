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
 *   UX1-S2-POSISI-01       the cycle position and the home's one recommendation
 *   UX1-S2-MELIHAT-01      looking is not committing, and the four Slice-2 rulings
 *   UX1-S3-LINGKUP-01      the teaching context is derived, and never claimed
 *   UX1-S3-KOMIT-01        no educator page commits anything while rendering
 *   UX1-S3-CEPAT-01        the quick assessment's bounds and its certificate sentence
 *   UX1-S3-BUKTI-01        evidence through the catalogue, nothing item-level
 *   UX1-S3-NAMA-01         names bounded, bare, unjudged, and no honorific
 *   UX1-S3-KATA-01         the educator copy is complete, declared and clean
 *   UX1-S3-FAKTA-01        the Slice-3 compositions narrow on a phone
 *   UX1-S0-MUAT-01         a stretched box fits its container and does not clip
 *   UX1-TUR-LIHAT-01       the tour only looks, and spends only what it presents
 *   UX1-TUR-ORANG-01       the tour's memory belongs to the person, not the device
 *   UX1-TUR-TAHAP-01       PINTAR does not guess a learner's stage
 *   UX1-TUR-PERAN-01       a tour belongs to an experience; seniority inherits none
 *   UX1-TUR-TAMPIL-01      presentation, replay and the tip agree with each other
 *   UX1-TUR-KATA-01        the tour's copy is the approved copy, complete and clean
 *   UX1-TUR-AKSES-01       the tour is a dialog a keyboard and a reader can use
 *   UX1-TUR-TUNTUN-01      Guidance Mode is two states, and never a status
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";
import jsQR from "jsqr";
import { Checks, type SelfTest } from "./lib";
import { allKeys, telling, renderAll, t, LOCALES, type HleEvent } from "../src/lib/hle";
import { posisi, peringkat, LANGKAH, LANGKAH_KEY } from "../src/lib/siklus";
import { hibahAktif, nodeLingkup, dalamLingkup, kelasDalamLingkup, LingkupError } from "../src/lib/mengajar";
import {
  tur, varianBelajar, bolehTampilOtomatis, akanMunculLagi, tipSetelahTutup,
  peranAktif, turPengajarBerlaku, pitaSasaran, geserKe, ruangBawah, tempatKartu, bertumpuk,
  TEPI, JARAK, TUR_BELAJAR, TUR_PENGAJAR, type Layar, type Petak,
} from "../src/lib/tur";
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

// A word ending in -mu is the informal possessive clitic UNLESS it is one of
// these, which are ordinary words that happen to end that way. Declared rather
// than guessed, so a false positive is fixed by adding a word here and is
// visible in the diff when somebody does.
const NOT_A_CLITIC = ["ilmu", "jamu", "tamu", "semu", "temu", "ramu"];
const STANDALONE = ["kamu", "kau", "engkau", "dikau", "dirimu", "kalian"];
const WORD = /\b[a-z]+\b/gi;

/**
 * Every informal second-person form in one piece of Indonesian text.
 *
 * One pass over the words rather than two patterns, because "kamu" is both a
 * standalone pronoun and a word ending in -mu: two patterns counted it twice,
 * and a guard whose own count is wrong is a guard nobody can read a failure
 * from.
 *
 * AT MODULE SCOPE because two tests need it — the Slice-0 sweep over learner
 * and public tellings, and the tour's own sweep, which also covers the
 * educator ones. A second copy is how the two halves start to disagree about
 * what "informal" means.
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
  "src/app/belajar/page.tsx",
  "src/app/belajar/[tugas]/page.tsx",
  "src/app/belajar/[tugas]/hasil/page.tsx",
  "src/app/belajar/[tugas]/peta/page.tsx",
  "src/app/belajar/[tugas]/pemetaan/page.tsx",
  "src/app/belajar/[tugas]/penguasaan/page.tsx",
  "src/app/belajar/[tugas]/pelajaran/[pelajaran]/page.tsx",
  "src/app/belajar/_components/ItemPlayer.tsx",
  "src/app/belajar/_components/LessonPlayer.tsx",
  "src/app/belajar/[tugas]/lanjut/page.tsx",
  "src/app/belajar/asesmen/[penugasan]/page.tsx",
  "src/app/belajar/_components/PermukaanAsesmen.tsx",
  // UX-1 Slice 3 — the educator's teaching surface, A-F.
  "src/app/mengajar/page.tsx",
  "src/app/mengajar/[kelas]/page.tsx",
  "src/app/mengajar/[kelas]/siapkan/page.tsx",
  "src/app/mengajar/[kelas]/uji-cepat/page.tsx",
  "src/app/mengajar/[kelas]/bukti/page.tsx",
  "src/app/mengajar/[kelas]/langkah/page.tsx",
  "src/app/mengajar/[kelas]/siapa/page.tsx",
];

/** Not re-set yet, and the slice that will do it. UX-1 §4 forbids touching them. */
const PENDING_SURFACES: Record<string, string> = {
  "src/app/page.tsx": "Slice 2 — entry by purpose",
  "src/app/masuk/page.tsx": "Slice 2 — sign-in",
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
  { file: "src/app/experience.css", literal: "78px",
    reason: "The cycle trail's step width: what five step names need side by side before they collide." },
  { file: "src/app/experience.css", literal: "12px",
    reason: "The trail dot's diameter. A dot is drawn, not spaced." },
  { file: "src/app/experience.css", literal: "5px",
    reason: "Half the 12px dot less half the 2px connector, so the line meets the dot's centre." },
  { file: "src/app/experience.css", literal: "4px",
    reason: "Detail geometry below the spacing scale: the current step's ring and the progress bar's height." },
  { file: "src/app/experience.css", literal: "34px",
    reason: "The question-number button: a two-digit target, sized to the finger rather than to a rhythm." },
  { file: "src/app/experience.css", literal: "23px",
    reason: "24px less the pixel a 2px border eats, so a selected option's text does not shift." },
  { file: "src/app/experience.css", literal: "20px",
    reason: "The disc list's indent, which belongs to the marker rather than to the page." },
  { file: "src/app/experience.css", literal: "120px",
    reason: "The progress bar's flex basis: the width below which a bar stops reading as progress." },
  { file: "src/app/experience.css", literal: "80px",
    reason: "The same bar's floor, so it never collapses to a dash between the two labels beside it." },
  { file: "src/app/experience.css", literal: "1.4em",
    reason: "The option key's column, in em so A/B/C/D stays aligned with the type rather than the page." },
  { file: "src/app/experience.css", literal: "20ch",
    reason: "The review question's flex basis, in characters because it wraps prose." },
  { file: "src/app/experience.css", literal: "360px",
    reason: "An inline lesson illustration: wide enough to read a diagram, narrow enough to stay inside the measure." },
  { file: "src/app/experience.css", literal: "0.4",
    reason: "The disabled control's opacity: visibly unavailable without vanishing." },
  { file: "src/app/experience.css", literal: "0",
    reason: "A native radio held at zero opacity over its own label: the standard way to keep a control focusable, operable and announced while the label carries the appearance. Hiding it any other way would take it out of the tab order, which is an accessibility regression rather than a design decision." },
  // UX-1 guidance mode. The three card measures and the phone sheet's ceiling
  // ARE design decisions, so they are tokens in globals.css rather than
  // entries here. These two are not.
  { file: "src/app/experience.css", literal: "4000px",
    reason: "The spotlight's veil is one box-shadow spread larger than any viewport, so the cut-out has exactly one edge and the ring cannot drift from it. It is a shadow that must not end on screen, not a measurement." },
  { file: "src/app/experience.css", literal: "72%",
    reason: "The Guidance veil's strength. Sauron ruled it a composite of primary-soft rather than a new token (§O-2), so it is written as a mix of the token it is made of." },
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
      // BASELINE MOVED 83 -> 85 on 2026-09-17, which is this tripwire working
      // rather than being worked around. Two Core migrations landed for UX-1
      // Slice 2 -- 20260920090000 (the Q-12 learner discovery contract) and
      // 20260921090000 (pre-start orientation). Both were re-read against §3 of
      // the ruling before this number moved: neither creates a table nor adds a
      // column, so the Q-7 gap below is still a gap and the assertion that
      // matters is unchanged.
      //
      // MOVED AGAIN 85 -> 87 for the first-login tour contract. 20260922090000
      // creates two tables -- tour_registry and person_tour_state -- and so was
      // read against the mark sweep below column by column before this number
      // moved: tour_key, tour_version, auto_presentation_limit, note,
      // declared_at, person_id, auto_shown_count, first_shown_at, last_shown_at,
      // completed_at, suppressed_at, created_at, updated_at. None is a mark, a
      // logo, a crest or a theme, so the Q-7 source still does not exist and the
      // sweep below is asserting over two more files without its answer
      // changing. 20260922100000 replaces one function body and creates nothing.
      c.expect(migrations.length === 87, `${migrations.length} migrations; the frozen baseline has 87`);
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
          "the Q-7 source does not exist in the 87 frozen migrations and no public storage bucket has appeared, " +
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
      const PHONE = "@media (max-width: 560px) {";

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

      // EVERY phone block, not the first one. The stylesheet grew a second
      // one when Slice 2 landed, and a rule in the first block can be
      // overridden by a base rule written between the two.
      const phoneBlocks: string[] = [];
      for (let i = css.indexOf(PHONE); i >= 0; i = css.indexOf(PHONE, i + 1)) {
        phoneBlocks.push(block(css.slice(i), PHONE));
      }
      const phone = phoneBlocks.join("\n");
      c.expect(phone.length > 200, "the phone block was not found in src/app/experience.css");

      // AND THE STACK MUST WIN, NOT MERELY EXIST.
      //
      // This is the half the first version of this test was missing. It
      // asserted that a narrow rule with `1fr` was PRESENT, and passed while
      // the orientation was still two cramped columns on a phone: the stack
      // sat in the first phone block and the base rule for the same selector
      // is written further down the file. Same specificity, later rule wins,
      // stack never happens. A screenshot caught it; the test did not.
      //
      // Positions are compared by walking the rules rather than by building a
      // regex per selector — the first attempt at this did build regexes, got
      // the escaping wrong, matched nothing, and silently skipped all three
      // selectors while reporting success.
      type Placed = { sels: string[]; decl: string; at: number };
      function placed(body: string, offset: number): Placed[] {
        const out: Placed[] = [];
        for (const m of body.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
          out.push({
            sels: m[1].replace(/\/\*[\s\S]*?\*\//g, " ").split(",").map((x) => x.trim()).filter(Boolean),
            decl: m[2],
            at: offset + (m.index ?? 0),
          });
        }
        return out;
      }
      /** Media queries blanked out, so what is left is the unconditional CSS. */
      const baseCss = css.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, (m) => " ".repeat(m.length));
      const baseRules = placed(baseCss, 0);
      const narrowRules: Placed[] = [];
      for (let i = css.indexOf(PHONE); i >= 0; i = css.indexOf(PHONE, i + 1)) {
        narrowRules.push(...placed(block(css.slice(i), PHONE), i + PHONE.length));
      }
      const COLS = /grid-template-columns:\s*([^;]+)/;
      let ordered = 0;
      for (const sel of [".pin-facts", ".pin-commit .pin-facts", ".pin-orient .pin-facts"]) {
        const lastBase = baseRules.filter((r) => r.sels.includes(sel) && COLS.test(r.decl)).pop();
        const lastNarrow = narrowRules
          .filter((r) => r.sels.includes(sel) && /grid-template-columns:\s*1fr\b/.test(r.decl))
          .pop();
        if (!lastBase) continue;
        c.expect(lastNarrow !== undefined, `"${sel}" has a wide rule and no narrow one`);
        if (!lastNarrow) continue;
        c.expect(
          lastNarrow.at > lastBase.at,
          `"${sel}" is stacked at offset ${lastNarrow.at} but its wide rule is written at ${lastBase.at}, ` +
            `later in the file at the same specificity — so the wide rule wins and the stack never happens`,
        );
        ordered++;
      }
      c.expect(ordered === 3, `only ${ordered} of 3 fact-summary selectors were order-checked`);

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

  // -------------------------------------------------------------------------
  {
    id: "UX1-S2-POSISI-01",
    requires: [],
    run: async () => {
      const c = new Checks();

      // WHERE THE LEARNER IS, AND WHAT THE HOME LEADS WITH.
      //
      // The Slice-2 home carries ONE next action and decides it from cycle
      // state rather than from list order. That decision is the piece of the
      // slice that can be wrong invisibly: a misplaced dot on a trail is
      // obvious, a home that confidently recommends the wrong thing looks
      // exactly like one that recommends the right thing.
      //
      // So the derivation is a pure function and this drives it through every
      // state a cycle can be in — no database, which is also why it runs at
      // all in a container where the db facility is absent.
      const S = (o: Partial<Record<string, string | null>> = {}) => ({
        pre_assignment: "pre", pre_session: null, pre_status: null,
        post_assignment: "post", post_session: null, post_status: null, ...o,
      }) as Parameters<typeof posisi>[0];
      const L = (read: number, total: number) =>
        Array.from({ length: total }, (_, i) => ({
          lesson_id: `l${i}`, modul: "m", urutan: i, judul: "t", ringkasan: null,
          isi: null, contoh: [], media: [], halaman: null,
          furthest_position: i < read ? 10 : 0, total_positions: 10,
        })) as Parameters<typeof posisi>[1];

      const CASES: Array<{ what: string; state: ReturnType<typeof S>; lessons: ReturnType<typeof L>; langkah: string; indeks: number }> = [
        { what: "nothing started", state: S(), lessons: L(0, 5), langkah: "PEMETAAN", indeks: 0 },
        { what: "mapping open but unfinished", state: S({ pre_session: "s", pre_status: "IN_PROGRESS" }), lessons: L(0, 5), langkah: "PEMETAAN", indeks: 0 },
        { what: "mapping submitted, not yet scored", state: S({ pre_session: "s", pre_status: "SUBMITTED" }), lessons: L(0, 5), langkah: "PEMETAAN", indeks: 0 },
        { what: "mapping done, nothing read", state: S({ pre_status: "FINALIZED" }), lessons: L(0, 5), langkah: "PETA", indeks: 1 },
        { what: "part-way through the lessons", state: S({ pre_status: "FINALIZED" }), lessons: L(3, 5), langkah: "PELAJARAN", indeks: 2 },
        { what: "every lesson read", state: S({ pre_status: "FINALIZED" }), lessons: L(5, 5), langkah: "PENGUASAAN", indeks: 3 },
        { what: "mastery check open", state: S({ pre_status: "FINALIZED", post_session: "p", post_status: "IN_PROGRESS" }), lessons: L(2, 5), langkah: "PENGUASAAN", indeks: 3 },
        { what: "mastery check paused", state: S({ pre_status: "FINALIZED", post_session: "p", post_status: "PAUSED" }), lessons: L(5, 5), langkah: "PENGUASAAN", indeks: 3 },
        { what: "mastery check finished", state: S({ pre_status: "FINALIZED", post_session: "p", post_status: "FINALIZED" }), lessons: L(5, 5), langkah: "HASIL", indeks: 4 },
        // THE ONE THAT MATTERS: the cycle is a record of what happened, not a
        // checklist somebody has to satisfy in order. A learner who finished
        // the Mastery Check without opening a lesson is at the result.
        { what: "finished without reading a single lesson", state: S({ pre_status: "FINALIZED", post_session: "p", post_status: "FINALIZED" }), lessons: L(0, 5), langkah: "HASIL", indeks: 4 },
        { what: "a course with no lessons at all", state: S({ pre_status: "FINALIZED" }), lessons: L(0, 0), langkah: "PETA", indeks: 1 },
      ];
      for (const t of CASES) {
        const p = posisi(t.state, t.lessons);
        c.expect(p.langkah === t.langkah, `${t.what}: step is ${p.langkah}, expected ${t.langkah}`);
        c.expect(p.indeks === t.indeks, `${t.what}: index is ${p.indeks}, expected ${t.indeks}`);
      }

      // the trail draws five steps and the index always addresses one of them
      c.expect(LANGKAH.length === 5, `the trail has ${LANGKAH.length} steps, not five`);
      for (const t of CASES) {
        const p = posisi(t.state, t.lessons);
        c.expect(LANGKAH[p.indeks] === p.langkah, `${t.what}: index and step disagree`);
      }

      // every step has copy, and it is the existing cycle.step.* keys rather
      // than a second set that can drift from the ones already on screen
      for (const l of LANGKAH) {
        const k = LANGKAH_KEY[l];
        c.expect(allKeys().includes(k as HleEvent), `the step ${l} maps to ${k}, which is not in the copy table`);
        c.expect(k.startsWith("cycle.step."), `the step ${l} uses ${k} rather than the existing cycle.step.* key`);
      }
      // and the enum never reaches a reader
      for (const l of LANGKAH) {
        for (const locale of LOCALES) {
          const text = t(LANGKAH_KEY[l] as HleEvent, "learner", { locale });
          c.expect(!text.includes(l), `the step telling in ${locale} contains the raw enum ${l}: "${text}"`);
        }
      }

      // ---- THE RANKING -------------------------------------------------
      const K = (title: string, state: ReturnType<typeof S>, lessons: ReturnType<typeof L>, berjalan = false) => ({
        tugas: { learning_assignment_id: title, course_id: "c", plp_release_id: "r", subject: "s",
                 stage: "SMA", grade_label: "10", title,
                 pre_test_assignment: "pre", post_test_assignment: "post" },
        posisi: posisi(state, lessons), berjalan,
      }) as Parameters<typeof peringkat>[0][number];

      // the approved order: a running session, then an unstarted mapping, then
      // unread lessons, then an untaken Mastery Check
      const mixed = [
        K("lessons", S({ pre_status: "FINALIZED" }), L(2, 5)),
        K("untaken mastery", S({ pre_status: "FINALIZED" }), L(5, 5)),
        K("unstarted mapping", S(), L(0, 5)),
      ];
      const r1 = peringkat(mixed);
      c.expect(r1.utama?.tugas.title === "untaken mastery",
        `the home leads with "${r1.utama?.tugas.title}"; an untaken Mastery Check outranks an unstarted mapping`);

      // a session already open jumps every rank, whatever step it belongs to
      const r2 = peringkat([
        K("unstarted mapping", S(), L(0, 5)),
        K("running", S({ pre_status: "FINALIZED", post_session: "p", post_status: "IN_PROGRESS" }), L(1, 5), true),
      ]);
      c.expect(r2.utama?.tugas.title === "running",
        `the home leads with "${r2.utama?.tugas.title}"; a session left open is the one obvious next action`);

      // a finished cycle is never "the one thing": it is a result to collect,
      // not work to do
      const done = K("finished", S({ pre_status: "FINALIZED", post_session: "p", post_status: "FINALIZED" }), L(5, 5));
      c.expect(peringkat([done]).utama === null,
        "a learner with nothing but a finished cycle is told to go back to something they finished");
      const r3 = peringkat([done, K("lessons", S({ pre_status: "FINALIZED" }), L(1, 5))]);
      c.expect(r3.utama?.tugas.title === "lessons", "a finished cycle outranked real work");
      c.expect(r3.sisa.length === 1 && r3.sisa[0].tugas.title === "finished",
        "the finished cycle vanished instead of falling to the rest of the list");

      // ranking never invents or loses an assignment
      c.expect(r1.sisa.length === mixed.length - 1, `ranking returned ${r1.sisa.length + 1} of ${mixed.length} assignments`);
      c.expect(peringkat([]).utama === null, "an empty list produced a recommendation");

      // ORDERING IS TOTAL, and the case that proves it is a TIE. Reversing a
      // list whose entries all sit at different steps proves nothing: the step
      // ranking alone decides it and the tie-break never runs. So the tie is
      // built on purpose — two assignments at the same step, equally far
      // through their lessons — and reversing it must not change the answer.
      // Without a total order the sort falls back to arrival order, which is
      // list position wearing a different name.
      const tie = [
        K("Bab 2: Dinamika Litosfer", S({ pre_status: "FINALIZED" }), L(2, 5)),
        K("Bab 4: Sistem Persamaan Linear", S({ pre_status: "FINALIZED" }), L(2, 5)),
      ];
      const fwd = peringkat(tie);
      const bwd = peringkat([...tie].reverse());
      c.expect(
        fwd.utama?.tugas.title === bwd.utama?.tugas.title,
        `two assignments at the same step rank by arrival order: forwards gives "${fwd.utama?.tugas.title}", ` +
          `backwards gives "${bwd.utama?.tugas.title}" — which is list position by another name`,
      );
      c.expect(
        fwd.sisa.map((k) => k.tugas.title).join("|") === bwd.sisa.map((k) => k.tugas.title).join("|"),
        "the REST of the list is ordered by arrival too, so the home reshuffles itself between two reads",
      );
      // and the same for a list whose steps do differ
      const rev = peringkat([...mixed].reverse());
      c.expect(rev.utama?.tugas.title === r1.utama?.tugas.title,
        "the recommendation depends on the order the assignments arrived in");
      // the lesson-progress tie-break itself: further through wins
      const nearer = peringkat([
        K("barely started", S({ pre_status: "FINALIZED" }), L(1, 5)),
        K("nearly done", S({ pre_status: "FINALIZED" }), L(4, 5)),
      ]);
      c.expect(nearer.utama?.tugas.title === "nearly done",
        `the home leads with "${nearer.utama?.tugas.title}"; the assignment with least left to do is the one to finish`);

      c.note(`${CASES.length} cycle state(s) and ${LANGKAH.length} trail step(s) driven through the pure derivation`);
      return c.verdict(
        "the learner's position in a cycle is derived in src/lib/siklus.ts from cycle state and lesson " +
          "progress across every state a cycle can hold — including a Mastery Check finished without a " +
          "lesson ever being opened, which the trail must report as the result rather than as unread work — " +
          "and the home's single recommendation follows the approved ranking rather than list position: a " +
          "running session first, a finished cycle never, and the same answer whatever order the rows arrive in",
      );
    },
  },

  // -------------------------------------------------------------------------
  {
    id: "UX1-S2-MELIHAT-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // THE FOUR SLICE-2 RULINGS OF 2026-09-17, MADE MECHANICAL AGAINST THE
      // SOURCE. Each of them is the kind of thing that is obeyed on the day it
      // is written and quietly undone six weeks later by somebody fixing
      // something else, so each gets a predicate rather than a paragraph.
      const player = join(repoRoot, "src", "app", "belajar", "_components", "PermukaanAsesmen.tsx");
      const orient = join(repoRoot, "src", "components", "siklus", "OrientasiAsesmen.tsx");
      const actionsFile = join(repoRoot, "src", "app", "belajar", "actions.ts");
      for (const f of [player, orient, actionsFile]) {
        c.expect(existsSync(f), `${relative(repoRoot, f)} does not exist`);
      }
      if (!existsSync(player) || !existsSync(orient)) return c.verdict("the Slice-2 assessment surface is missing");

      // ---- 1. LOOKING IS NOT COMMITTING ---------------------------------
      //
      // Reading an orientation must create no session and spend no attempt.
      // The database half is Bob's (assessment_orientation() is `stable` and
      // inserts nothing); this is the half on this side of the wire: NO
      // LEARNER PAGE MAY START A SESSION WHILE RENDERING.
      //
      // Before Slice 2 both assessment routes called startSession() in their
      // render path, which made ARRIVING AT THE URL the act of committing —
      // and made it impossible to show the integrity disclosure before the
      // thing it discloses about. That is the defect this half prevents
      // returning.
      const pages = walk(join(repoRoot, "src", "app")).filter((f) => /page\.tsx$/.test(f));
      c.expect(pages.length > 10, `only ${pages.length} page(s) found`);
      const STARTS = /\b(startSession|start_learning_session)\b/;
      for (const f of pages) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        c.expect(
          !STARTS.test(code(readFileSync(f, "utf8"))),
          `${rel} starts a session while rendering, so visiting the URL is the commitment`,
        );
      }
      // The surface that shows the orientation must not start one either.
      c.expect(
        !STARTS.test(code(readFileSync(player, "utf8"))),
        "PermukaanAsesmen starts a session while rendering",
      );

      // The start is a FORM POST, not a link. A link is prefetched by the
      // router, pre-rendered by the browser and brushed by a thumb on a
      // scroll; any of those would silently spend the one attempt a PAPER
      // assessment allows. Exactly one place may create a session, and it is
      // reached by a verb.
      const actions = code(readFileSync(actionsFile, "utf8"));
      c.expect(/export async function mulaiAsesmen\(/.test(actions),
        "there is no server action that starts an assessment");
      c.expect(/formData/.test(actions),
        "the start action does not take form data, so it is reachable without a form submission");
      const surface = code(readFileSync(player, "utf8"));
      c.expect(/<form action=\{mulaiAsesmen\}/.test(surface),
        "the start is not a form submission");
      // and no Link anywhere in the surface points at the action
      c.expect(!/<Link[^>]*mulaiAsesmen/.test(surface), "a Link invokes the start action");

      // ---- 2. THE ORIENTATION'S AUTHORIZATION IS NOT WEAKENED -------------
      //
      // assessment_orientation() is gated by may_start_assessment() and
      // returns NO ROW when the learner may not begin. The ruling: do not
      // replace that with a disabled orientation page after eligibility is
      // gone. So a null must reach the refusal, and the surface must not
      // second-guess the gate with a check of its own.
      c.expect(/if \(!orientasi\)/.test(surface), "the surface does not branch on a missing orientation");
      const nullBranch = /if \(!orientasi\) \{\s*return <HalamanPenolakan/.test(surface);
      c.expect(nullBranch, "a missing orientation does not render the one refusal page");
      c.expect(!/disabled/.test(surface),
        "the assessment surface renders a disabled control, which is how a refused orientation comes back as a greyed-out page");
      // No second eligibility opinion in this process: may_start_assessment is
      // the database's answer and the RPCs ask it themselves.
      c.expect(!/\bmayStart\b/.test(surface),
        "the surface asks may_start_assessment itself, which is a second opinion that can drift from the gate the RPCs use");

      // ---- 3. NO ESTIMATED DURATION, AND NONE DERIVED --------------------
      //
      // Ruled out because no legitimate duration fact exists. A plausible
      // number is worse than no number: a learner arranges an afternoon around
      // "40 minutes" and the arrangement is the product's fault.
      const types = readFileSync(join(repoRoot, "src", "lib", "assessment-engine", "types.ts"), "utf8");
      const oriType = /export type Orientation = \{([^}]*)\}/.exec(types)?.[1] ?? "";
      c.expect(oriType.length > 0, "the Orientation type was not found");
      for (const field of ["duration", "durasi", "minutes", "menit", "estimated", "perkiraan", "time_limit"]) {
        c.expect(!oriType.includes(field), `the Orientation type carries a duration field (${field})`);
      }
      // and the component computes none out of what it does have
      const oriSrc = code(readFileSync(orient, "utf8"));
      for (const derived of ["item_count *", "item_count*", "* 60", "/ 60", "hesitation_window_seconds *"]) {
        c.expect(!oriSrc.includes(derived), `the orientation derives a duration (${derived})`);
      }
      // no copy key offers one either, in either language
      for (const k of allKeys()) {
        if (!k.startsWith("siklus.")) continue;
        for (const locale of LOCALES) {
          const text = t(k as HleEvent, "learner", { locale }).toLowerCase();
          const bad = ["perkiraan waktu", "estimated time", "menit", "minutes"].find((w) => text.includes(w));
          c.expect(bad === undefined, `${k} offers a duration in ${locale} ("${bad}"): "${text}"`);
        }
      }

      // ---- 4. THE FACTS THAT DO EXIST ARE STILL SHOWN --------------------
      // Removing the duration must not take the true facts with it.
      c.expect(/siklus\.jumlah_soal/.test(oriSrc), "the orientation no longer shows how many questions");
      c.expect(/siklus\.ditutup/.test(oriSrc), "the orientation no longer shows when it closes");
      c.expect(/orientasi\.item_count/.test(oriSrc), "the question count is not read from the orientation");
      c.expect(/orientasi\.closes_at/.test(oriSrc), "the closing time is not read from the orientation");
      // and they render through the shared compact fact summary, so the
      // approved responsive stack applies to them without being restated
      c.expect(/className="pin-facts"/.test(oriSrc),
        "the orientation facts do not use the shared compact fact summary, so the responsive stack does not reach them");

      // ---- 5. Q-15, VERBATIM ---------------------------------------------
      //
      // Neither telling may be edited. "dicatat", not "dipantau"; observation,
      // never judgment; no category list; no device named.
      const Q15_ID =
        "Selama asesmen, aktivitas sesi tertentu dapat dicatat untuk menjaga integritas proses. " +
        "Catatan ini merupakan observasi dan tidak menentukan hasil Anda secara otomatis.";
      const Q15_EN =
        "During the assessment, certain session activity may be recorded to support process integrity. " +
        "These records are observations and do not automatically determine your result.";
      c.expect(t("siklus.catatan.isi" as HleEvent, "learner", { locale: "id" }) === Q15_ID,
        "the Indonesian integrity disclosure is not the ruled wording");
      c.expect(t("siklus.catatan.isi" as HleEvent, "learner", { locale: "en" }) === Q15_EN,
        "the English integrity disclosure is not the ruled wording");
      // the forbidden register, checked rather than trusted
      for (const locale of LOCALES) {
        const text = t("siklus.catatan.isi" as HleEvent, "learner", { locale }).toLowerCase();
        for (const w of ["dipantau", "monitored", "webcam", "kamera", "camera", "microphone", "mikrofon",
                         "layar", "screen record", "keystroke", "rekam layar", "diawasi", "surveillance"]) {
          c.expect(!text.includes(w), `the disclosure in ${locale} uses the forbidden word "${w}"`);
        }
      }
      // it is a quiet paragraph on the well, NOT an alert: the ruling says
      // these records are observation and not judgment, and a bordered warning
      // would say the opposite of the words inside it
      c.expect(/className="pin-catatan"/.test(oriSrc), "the disclosure is not rendered on the well");
      c.expect(!/role="alert"/.test(oriSrc), "the disclosure is announced as an alert");
      const css = readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8");
      const catatan = /\.pin-catatan \{([^}]*)\}/.exec(css)?.[1] ?? "";
      c.expect(catatan.length > 0, ".pin-catatan is not styled");
      c.expect(!/border:/.test(catatan) && !/status-attention|status-blocked/.test(catatan),
        `the disclosure is drawn as a warning box: ${catatan.trim()}`);
      // and it is shown BEFORE the thing it discloses about — in the
      // orientation, which is the screen that exists before the session
      c.expect(!/siklus\.catatan\.isi/.test(code(readFileSync(
        join(repoRoot, "src", "app", "belajar", "_components", "ItemPlayer.tsx"), "utf8"))),
        "the disclosure appears inside the player, which is after the commitment it discloses about");

      c.note(`${pages.length} page(s) swept for a render-time session start; Q-15 compared verbatim in ${LOCALES.length} languages`);
      return c.verdict(
        "the four Slice-2 rulings hold against the source: no page under src/app starts a session while " +
          "rendering and the only thing that starts one is a form-submitted server action, so looking at an " +
          "assessment is not committing to it; a missing orientation reaches the one refusal page rather than " +
          "a disabled orientation, and the surface asks no second eligibility question of its own; the " +
          "Orientation type carries no duration field, the component derives none from what it does have, and " +
          "no Slice-2 copy key offers one in either language, while the two facts that are real are still read " +
          "and still rendered through the shared compact fact summary; and the integrity disclosure is the " +
          "ruled wording byte for byte in both languages, drawn as a paragraph on the well rather than an " +
          "alert, on the screen that comes before the session rather than inside it",
      );
    },
  },

  // ═══════════════════════════════════════════ UX-1 Slice 3 · the educator
  {
    id: "UX1-S3-LINGKUP-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const A = "aaaaaaaa-0000-0000-0000-000000000001";
      const B = "bbbbbbbb-0000-0000-0000-000000000002";
      const DEPT = "dddddddd-0000-0000-0000-00000000000d";
      const lama = new Date("2020-01-01T00:00:00Z").toISOString();
      const nanti = new Date("2099-01-01T00:00:00Z").toISOString();
      const now = new Date("2026-09-17T03:00:00Z");

      // 1. a grant is a teaching context only while it is live
      const hibah = [
        { scope_node_id: DEPT, institution_id: "i", valid_from: lama, valid_until: nanti },
        { scope_node_id: A, institution_id: "i", valid_from: lama, valid_until: nanti, revoked_at: lama },
        { scope_node_id: B, institution_id: "i", valid_from: lama, valid_until: lama },
        { scope_node_id: null, institution_id: null, valid_from: lama, valid_until: nanti },
      ];
      const aktif = hibahAktif(hibah, now);
      c.expect(aktif.length === 1, `${aktif.length} grants read as live; only the unrevoked, in-date, node-bearing one is`);
      c.expect(nodeLingkup(hibah, now).join() === DEPT, "the scope set is not exactly the live grant's node");

      // 2. the containment predicate mirrors `v_jalur @> array[scope]`, including
      //    that a node's own jalur contains itself
      c.expect(dalamLingkup({ jalur: ["inst", DEPT, A] }, [DEPT]), "a class beneath the granted node is not in scope");
      c.expect(dalamLingkup({ jalur: ["inst", DEPT] }, [DEPT]), "the granted node itself is not in its own scope");
      c.expect(!dalamLingkup({ jalur: ["inst", "other", B] }, [DEPT]), "a class outside the grant is in scope");
      c.expect(!dalamLingkup({ jalur: [] }, [DEPT]), "a node with no path is in scope — the predicate does not fail closed");
      c.expect(!dalamLingkup({ jalur: null }, [DEPT]), "a node with a null path is in scope — the predicate does not fail closed");

      // 3. THE ADVERSARIAL PLANT. A class from another department is planted in
      //    the rows the query returned. Dropping it quietly would let the query
      //    rot undetected, so the re-check must REFUSE rather than filter.
      const sah = { id: A, name: "Kelas 10A", kind: "CLASS", jalur: ["inst", DEPT, A], institution_id: "i", academic_period_id: "p" };
      const asing = { id: B, name: "Kelas 12B", kind: "CLASS", jalur: ["inst", "other", B], institution_id: "i", academic_period_id: "p" };
      let refused = false;
      try { kelasDalamLingkup([sah, asing], [DEPT]); } catch (e) { refused = e instanceof LingkupError; }
      c.expect(refused, "a class outside the grants survived the re-check instead of refusing it");
      let refusedKind = false;
      try { kelasDalamLingkup([{ ...sah, kind: "COHORT" }], [DEPT]); } catch (e) { refusedKind = e instanceof LingkupError; }
      c.expect(refusedKind, "a non-class node survived the re-check");
      c.expect(kelasDalamLingkup([sah], [DEPT]).length === 1, "a class inside the grants did not survive");
      c.expect(kelasDalamLingkup([{ ...sah, is_active: false }], [DEPT]).length === 0, "a closed class is still offered");

      // 4. THE NARROWING HAPPENS IN POSTGRES, not in this process. A filter run
      //    over a school-wide population in the application is exactly what the
      //    ruling forbids, so the source must carry the overlap as a query.
      const lib = readFileSync(join(repoRoot, "src", "lib", "pengajar.ts"), "utf8");
      const derivation = code(lib);
      c.expect(/\.overlaps\("jalur"/.test(derivation), "the class read does not narrow by jalur in the query");
      c.expect(/from\("role_assignments"\)/.test(derivation), "the teaching context is not derived from role_assignments");
      c.expect(/\.eq\("person_id", me\)/.test(derivation), "the grant read is not narrowed to the reader's own rows");
      // and it must not derive scope from a role NAME — the thing doc 05 forbids
      for (const peran of ["EDUCATOR", "HEAD_OF_DEPARTMENT", "INSTITUTION_ADMIN", "DEAN"]) {
        c.expect(!new RegExp(`"${peran}"`).test(derivation), `the educator data layer names the role ${peran} in code`);
      }
      const murni = code(readFileSync(join(repoRoot, "src", "lib", "mengajar.ts"), "utf8"));
      c.expect(!/role/i.test(murni.replace(/role_assignments/g, "")), "the containment module reads a role");

      // 5. AND THE COPY DOES NOT CLAIM WHAT THE DATABASE DOES NOT DO.
      const hle = readFileSync(join(repoRoot, "src", "lib", "hle.ts"), "utf8");
      const KLAIM = [/boleh Anda lihat/i, /bisa Anda lihat/i, /you may see/i, /you can see/i, /only you/i, /hanya Anda/i];
      for (const key of ["mengajar.kelas.judul", "mengajar.kelas.sub", "mengajar.kelas.intro"]) {
        const row = new RegExp(`"${key.replace(/\./g, "\\.")}":\\s*\\{([^}]*)\\}`).exec(hle);
        c.expect(row !== null, `${key} is missing from the copy table`);
        for (const bad of KLAIM) {
          c.expect(!bad.test(row?.[1] ?? ""), `${key} claims an authorization boundary: ${bad}`);
        }
      }
      const judul = /"mengajar\.kelas\.judul":\s*\{([^}]*)\}/.exec(hle)?.[1] ?? "";
      c.expect(/lingkup mengajar/i.test(judul) && /teaching scope/i.test(judul),
        "the class heading does not name the teaching scope in both languages");

      // 6. AND IT PROTECTS NOTHING: every act is still authorized server-side.
      const rute = walk(join(repoRoot, "src", "app", "mengajar")).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
      const aksi = code(readFileSync(join(repoRoot, "src", "app", "mengajar", "actions.ts"), "utf8"));
      c.expect(/launch_quick_assessment/.test(aksi), "the quick assessment is not launched through its own RPC");
      c.expect(!/@\/lib\/supabase\/service/.test(rute.map((f) => readFileSync(f, "utf8")).join("\n")),
        "an educator surface holds a privileged client");

      c.note(`${aktif.length} live grant of ${hibah.length}, 2 refusals planted and caught, ${rute.length} educator file(s)`);
      return c.verdict(
        "the educator's teaching context is derived from the reader's OWN role grants, narrowed by jalur inside Postgres " +
        "and re-checked on the way out — a class from another department is REFUSED rather than quietly dropped — no role " +
        "name decides anything, and the copy names a teaching scope rather than claiming a boundary the database does not draw",
      );
    },
  },
  {
    id: "UX1-S3-KOMIT-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const dir = join(repoRoot, "src", "app", "mengajar");
      const pages = walk(dir).filter((f) => f.endsWith("page.tsx"));
      c.expect(pages.length >= 7, `only ${pages.length} educator page(s) found`);

      // THE SCANNER, used on the real pages and then on a planted one.
      const TULIS = /\.(insert|update|upsert|delete)\s*\(|rpc\(\s*"(launch_quick_assessment|extend_session_deadline|move_learning_assignment_release)"/;
      for (const f of pages) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const m = TULIS.exec(code(readFileSync(f, "utf8")));
        c.expect(m === null, `${rel} writes while rendering: ${m?.[0]}`);
      }
      // ADVERSARIAL PLANT: the same scanner must catch a page that does write,
      // or it is a detector that has stopped detecting.
      c.expect(TULIS.test('const x = await db.from("learning_assignments").insert({ a: 1 });'),
        "the render-time write scanner does not catch an insert");
      c.expect(TULIS.test('await db.rpc("launch_quick_assessment", {});'),
        "the render-time write scanner does not catch the launcher");

      // Both stages before a commitment are GET renders carrying their choices
      // in the URL: the configure form navigates, it does not submit an action.
      const cepat = code(readFileSync(join(dir, "[kelas]", "uji-cepat", "page.tsx"), "utf8"));
      c.expect(/method="get"/.test(cepat), "the quick assessment's configure stage is not a GET form");
      c.expect(/tahap === "tinjau"/.test(cepat), "the review stage is not a render of the query string");

      // The only writes in the whole surface live in the server actions, and
      // each is reached by a form action rather than by a link.
      const aksiPath = join(dir, "actions.ts");
      const aksi = code(readFileSync(aksiPath, "utf8"));
      c.expect(/^"use server";/m.test(aksi), "the educator actions are not a server module");
      const exported = [...aksi.matchAll(/export async function (\w+)/g)].map((m) => m[1]);
      c.expect(exported.length === 2, `${exported.length} exported educator action(s); the surface commits two things`);
      for (const name of exported) {
        const used = pages.some((f) => new RegExp(`action=\\{${name}\\}`).test(readFileSync(f, "utf8")));
        c.expect(used, `the action ${name} is exported but no form submits it`);
      }
      for (const f of pages) {
        const src = code(readFileSync(f, "utf8"));
        for (const name of exported) {
          const asLink = new RegExp(`href=\\{[^}]*${name}`).test(src);
          c.expect(!asLink, `${relative(repoRoot, f)} reaches a commitment through a link`);
        }
      }

      // Making material available is born inert and becomes visible in a second,
      // separately authorized statement — which is what makes a review possible.
      c.expect(/\.insert\(\{[\s\S]*?\}\)/.test(aksi), "materialising an assignment does not insert a row");
      c.expect(!/status:\s*"ACTIVE"[\s\S]*?\.insert\(/.test(aksi), "an assignment is inserted already active");
      c.expect(/\.update\(\{ status: "ACTIVE" \}\)/.test(aksi), "the assignment is never activated in its own statement");

      // A redirect target is derived, never taken from the form: the learner
      // side's unvalidated `kembali` is a known finding and is not repeated here.
      c.expect(!/formData\.get\("kembali"\)/.test(aksi), "an educator action takes its redirect from the form");

      c.note(`${pages.length} page(s) swept, ${exported.length} action(s), 2 plants caught`);
      return c.verdict(
        "no page on the educator surface writes anything while rendering — the scanner is watched to catch a planted insert " +
        "and a planted launcher — both stages before a commitment are GET renders of the query string, the only two writes " +
        "are server actions reached by a form and never by a link, an assignment is created inert and activated in its own " +
        "separately authorized statement, and no redirect target comes from the form",
      );
    },
  },

  {
    id: "UX1-S3-CEPAT-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const mig = join(repoRoot, "supabase", "migrations");
      const hle = readFileSync(join(repoRoot, "src", "lib", "hle.ts"), "utf8");
      const cepat = code(readFileSync(
        join(repoRoot, "src", "app", "mengajar", "[kelas]", "uji-cepat", "page.tsx"), "utf8"));
      const lib = code(readFileSync(join(repoRoot, "src", "lib", "pengajar.ts"), "utf8"));

      // 1. THE BOUNDS ARE READ, NOT RESTATED. The platform owns 3-to-20 and the
      //    surface asks for it; a literal here is a second answer that drifts.
      c.expect(/from\("assessment_definition_bounds"\)/.test(lib), "the QUICK bounds are never read");
      c.expect(/\.eq\("mode", "QUICK"\)/.test(lib), "the bounds read is not scoped to QUICK");
      c.expect(/batas\?\.soalMin/.test(cepat) && /batas\?\.soalMax/.test(cepat),
        "the form does not take its item bounds from the bounds row");
      const bounds = readFileSync(join(mig, "20260915150000_studio_governance.sql"), "utf8");
      const quickBound = /update public\.assessment_definition_bounds\s+set ([\s\S]*?)where mode = 'QUICK';/.exec(bounds);
      c.expect(quickBound !== null, "the QUICK bounds row is not in the migrations");
      c.expect(/item_count_max = 20/.test(quickBound?.[1] ?? ""), "QUICK's item ceiling is no longer 20");
      c.expect(/attempt_limit_max = 1/.test(quickBound?.[1] ?? ""), "QUICK is no longer single-attempt");

      // The three minute presets must sit inside the launcher's own 5-60 range.
      const launcher = readFileSync(join(mig, "20260916110000_quick_assessment_over_canonical.sql"), "utf8");
      const rentang = /p_minutes < (\d+) or p_minutes > (\d+)/.exec(launcher);
      c.expect(rentang !== null, "the launcher no longer states a minute range");
      const [lo, hi] = [Number(rentang?.[1]), Number(rentang?.[2])];
      const preset = [...(/JENDELA_MENIT = \[([^\]]*)\]/.exec(lib)?.[1] ?? "").matchAll(/\d+/g)].map((m) => Number(m[0]));
      c.expect(preset.length === 3, `${preset.length} window preset(s); the approved design offers three`);
      for (const m of preset) c.expect(m >= lo && m <= hi, `the ${m}-minute preset is outside the launcher's ${lo}-${hi}`);

      // 2. THE CERTIFICATE SENTENCE IS CHECKED AGAINST THE CONTRACT, NOT AGAINST
      //    ITSELF. `mode_policy` decides whether a QUICK result can reach a
      //    certificate; the copy must agree with that row, so the row is parsed
      //    here. If a migration ever flips it, this test says the copy must move.
      const policy = readFileSync(join(mig, "20260914093000_mode_policy_quick_assessment_integrity.sql"), "utf8");
      const kolom = /create table public\.mode_policy \(([\s\S]*?)\n\);/.exec(policy)?.[1] ?? "";
      const urutan = [...kolom.matchAll(/^\s{2}(\w+)\s+/gm)].map((m) => m[1]);
      const iCert = urutan.indexOf("certifies");
      c.expect(iCert > 0, "mode_policy no longer has a certifies column");
      const barisQuick = /\n  \('QUICK',([^)]*)\)/.exec(policy)?.[1] ?? "";
      const nilai = barisQuick.split(",").map((x) => x.trim());
      const certifies = nilai[iCert - 1];
      c.expect(certifies === "true" || certifies === "false", `could not read QUICK.certifies (${certifies})`);

      const kunciCepat = [...hle.matchAll(/"(mengajar\.cepat\.[a-z0-9_.]+|mengajar\.langkah\.f5w)":\s*\{([^}]*)\}/g)];
      c.expect(kunciCepat.length >= 20, `only ${kunciCepat.length} quick-assessment copy strings found`);
      const semuaCepat = kunciCepat.map((m) => m[2]).join(" ");

      const MENYANGKAL = [
        /tidak masuk sertifikat/i, /bukan bagian dari sertifikat/i,
        /not part of a certificate/i, /not part of any certificate/i,
        /does not count toward/i, /tidak dihitung untuk sertifikat/i,
        /tidak menilai murid/i, /bukan sebagai nilai murid/i,
        /not a judgment of the learner/i, /not a learner grade/i,
        /hasilnya untuk Anda\b/i, /the result is for you\b/i,
      ];
      if (certifies === "true") {
        for (const bad of MENYANGKAL) {
          c.expect(!bad.test(semuaCepat),
            `QUICK certifies in mode_policy, but the copy still denies it: ${bad}`);
        }
        // and the canonical meaning must actually be told, in both languages
        c.expect(/bukti pembelajaran/i.test(semuaCepat), "the Indonesian copy never says the result is learning evidence");
        c.expect(/kelayakan sertifikat/i.test(semuaCepat), "the Indonesian copy never names certificate eligibility");
        c.expect(/learning evidence/i.test(semuaCepat), "the English copy never says the result is learning evidence");
        c.expect(/certificate eligibility/i.test(semuaCepat), "the English copy never names certificate eligibility");
        // without the opposite overclaim
        c.expect(/tidak menerbitkan sertifikat/i.test(semuaCepat) && /does not issue a certificate/i.test(semuaCepat),
          "the copy never says that one quick assessment does not issue a certificate");
        for (const bad of [/mendapat sertifikat/i, /earns a certificate/i, /gets a certificate/i]) {
          c.expect(!bad.test(semuaCepat), `the copy implies one quick assessment earns a certificate: ${bad}`);
        }
      }

      // 3. AND IT PROMISES NO PER-ITEM RESULT, because there is no read path.
      for (const bad of [/per soal/i, /per-item/i, /per item/i, /tiap soal/i, /item-level result/i]) {
        c.expect(!bad.test(semuaCepat), `the quick assessment promises a per-item result: ${bad}`);
      }
      c.expect(!/metric_evaluate/.test(cepat), "the quick assessment screen asks for a metric");

      c.note(`QUICK.certifies=${certifies}, bounds 3-20 single attempt, presets ${preset.join("/")} inside ${lo}-${hi}, ${kunciCepat.length} copy strings`);
      return c.verdict(
        "the quick assessment reads its item bounds from assessment_definition_bounds rather than restating them, offers " +
        "three windows inside the launcher's own range, and tells the truth about the result: mode_policy's QUICK row is " +
        "PARSED here and the copy is required to agree with it — it may not deny that the result can reach certificate " +
        "evidence while the contract says it can, may not claim one quick assessment earns a certificate, and may not " +
        "promise a per-item result an educator has no read path to",
      );
    },
  },
  {
    id: "UX1-S3-BUKTI-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const mig = join(repoRoot, "supabase", "migrations");
      const lib = code(readFileSync(join(repoRoot, "src", "lib", "pengajar.ts"), "utf8"));
      const files = walk(join(repoRoot, "src", "app", "mengajar")).filter((f) => /\.tsx?$/.test(f));
      const surface = files.map((f) => code(readFileSync(f, "utf8"))).join("\n") + "\n" + lib;

      // 1. NOTHING ITEM-LEVEL IS REACHED FOR, at any level. The educator holds
      //    neither CAN_REVIEW_INTEGRITY nor CAN_REVIEW_QUESTION_HEALTH, the
      //    service views are revoked from `authenticated` outright, and this
      //    surface must not be the place that discovers it at a refusal.
      const TERLARANG = [
        "responses", "presented_items", "assessment_results",
        "service_item_statistics", "service_distractor_uptake", "service_cohort_misconceptions",
        "question_health", "integrity_signals",
      ];
      for (const tbl of TERLARANG) {
        c.expect(!new RegExp(`from\\("${tbl}"`).test(surface), `the educator surface reads ${tbl} directly`);
      }
      for (const rpc of ["recompute_question_health", "record_question_health_review", "record_integrity_review", "terminate_session"]) {
        c.expect(!new RegExp(`"${rpc}"`).test(surface), `the educator surface calls ${rpc}`);
      }
      // ADVERSARIAL PLANT: the same scanner on a line that does read one.
      c.expect(/from\("responses"/.test('await db.from("responses").select("*")'),
        "the forbidden-table scanner does not catch a direct response read");

      // 2. EVERY METRIC ASKED FOR IS ONE THE CATALOGUE GRANTS AN EDUCATOR.
      //    The audience list is read from the SEED, not from this file, so a
      //    catalogue change that narrows an audience fails here.
      const cat = readFileSync(join(mig, "20260918100000_metric_catalogue.sql"), "utf8");
      const blok = /insert into public\.metric_definitions\n  \(catalogue_version, metric_id[\s\S]*?\n   allowed_visualizations, allowed_audiences, calculation_key\) values([\s\S]*?);\n/.exec(cat);
      c.expect(blok !== null, "the metric catalogue seed could not be read");
      const audiens = new Map<string, string>();
      for (const entry of (blok?.[1] ?? "").split(/\n  \('MC-1',/).slice(1)) {
        const id = /^\s*'([a-z._]+)'/.exec(entry)?.[1];
        if (id) audiens.set(id, entry);
      }
      c.expect(audiens.size >= 13, `only ${audiens.size} metric(s) parsed from the catalogue seed`);
      const diminta = [...(/METRIK_KELAS = \[([\s\S]*?)\] as const/.exec(lib)?.[1] ?? "").matchAll(/"([a-z._]+)"/g)].map((m) => m[1]);
      c.expect(diminta.length >= 4, `only ${diminta.length} metric(s) requested by the evidence screen`);
      for (const m of diminta) {
        const entry = audiens.get(m);
        c.expect(entry !== undefined, `the evidence screen asks for ${m}, which is not in the catalogue`);
        c.expect(/'EDUCATOR'/.test(entry ?? ""), `the evidence screen asks for ${m}, which the catalogue does not grant an educator`);
        c.expect(!m.startsWith("item."), `the evidence screen asks for the item-level metric ${m}`);
      }
      // ADVERSARIAL PLANT: an item metric must fail the same audience check.
      c.expect(!/'EDUCATOR'/.test(audiens.get("item.correctness_rate") ?? "'EDUCATOR'"),
        "the audience check would accept an item-level metric");

      // 3. AND THE ONE THAT REPLACED A PER-ITEM SENTENCE IS THE GRANTED ONE.
      c.expect(diminta.includes("class.misconceptions"),
        "the legitimate cohort aggregate is not asked for");
      const calc = readFileSync(join(mig, "20260918110000_metric_evaluator.sql"), "utf8");
      const misc = /create function public\.calc_class_misconceptions[\s\S]*?\nend;/.exec(calc)?.[0] ?? "";
      c.expect(/misconception_code/.test(misc) && !/person_id/.test(misc) && !/item_id/.test(misc),
        "the cohort aggregate carries a learner or an item after all");

      // 4. INSUFFICIENT EVIDENCE IS A FIRST-CLASS STATE, and no zero stands in
      //    for an unknown. A value renders only on `ok`, and only when finite.
      const bukti = code(readFileSync(
        join(repoRoot, "src", "app", "mengajar", "[kelas]", "bukti", "page.tsx"), "utf8"));
      c.expect(/KartuKetiadaan/.test(bukti), "the evidence screen has no absence card");
      c.expect(/e\.status !== "ok"/.test(bukti), "the evidence screen renders a value without checking the status");
      c.expect(/Number\.isFinite\(v\)/.test(bukti), "a non-finite value would render as a figure");
      c.expect(!/\|\|\s*0\b/.test(bukti) && !/\?\?\s*0\b/.test(bukti),
        "the evidence screen substitutes zero for a missing figure");
      c.expect(/actionText/.test(bukti), "a figure renders without the sentence the 3-lens rule requires");

      // 5. THE SCOPE LINE NAMES A CLASS AND NOT A CHAPTER: metric_evaluate takes
      //    a node, so a chapter-scoped claim would be a scope no contract carries.
      const hle = readFileSync(join(repoRoot, "src", "lib", "hle.ts"), "utf8");
      const eyebrow = /"mengajar\.bukti\.eyebrow":\s*\{([^}]*)\}/.exec(hle)?.[1] ?? "";
      c.expect(!/bab|chapter/i.test(eyebrow), "the evidence eyebrow names a chapter");
      // scoped to the evidence read itself: the quick assessment's launcher
      // takes a module, and a sweep over the whole module would read that as a
      // failure here — a scanner pointed at the wrong artefact is worse than none
      const bacaBukti = /export async function bukti\([\s\S]*?\n\}/.exec(lib)?.[0] ?? "";
      c.expect(bacaBukti.length > 0, "the evidence read could not be located in the educator data layer");
      c.expect(/p_node/.test(bacaBukti), "the evidence read does not pass a node");
      c.expect(!/p_module|p_release|p_bab|p_modul/.test(bacaBukti),
        "the evidence read passes a scope metric_evaluate does not take");

      c.note(`${diminta.length} metric(s) requested, all EDUCATOR-granted; ${TERLARANG.length} forbidden read(s) swept over ${files.length} file(s)`);
      return c.verdict(
        "every number on the evidence screen comes through metric_evaluate and every metric it asks for is one the CATALOGUE " +
        "SEED grants an EDUCATOR — checked against the migration, with an item-level metric watched to fail the same check — " +
        "no responses, presented items, assessment results or service statistics view is read anywhere on the surface, the " +
        "cohort aggregate that replaced a per-item sentence carries no learner and no item, absence renders as an absence " +
        "card rather than a zero, and the scope line names the node the evaluator actually takes",
      );
    },
  },

  {
    id: "UX1-S3-NAMA-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const mig = join(repoRoot, "supabase", "migrations");
      const hle = readFileSync(join(repoRoot, "src", "lib", "hle.ts"), "utf8");
      const lib = code(readFileSync(join(repoRoot, "src", "lib", "pengajar.ts"), "utf8"));
      const daftar = readFileSync(join(repoRoot, "src", "components", "mengajar", "DaftarMurid.tsx"), "utf8");
      const files = walk(join(repoRoot, "src", "app", "mengajar"))
        .concat(walk(join(repoRoot, "src", "components", "mengajar")))
        .filter((f) => /\.tsx?$/.test(f));

      // 1. THE ABSENCE OF AN HONORIFIC IS PROVEN FROM THE CONTRACT, not asserted.
      //    `persons` carries a display name and nothing that could authorise a
      //    Bu or a Pak, so inferring one could only be a guess about a person.
      const identity = readFileSync(join(mig, "20260912004321_identity_enrollment.sql"), "utf8");
      const kolom = /create table public\.persons \(([\s\S]*?)\n\);/.exec(identity)?.[1] ?? "";
      c.expect(/display_name/.test(kolom), "the persons table no longer carries a display name");
      for (const bad of ["honorific", "salutation", "title", "prefix", "gender", "sex", "gelar", "sapaan"]) {
        c.expect(!new RegExp(`\\b${bad}\\b`, "i").test(kolom),
          `persons now carries ${bad} — the greeting may stop being name-only, but only deliberately`);
      }
      const semuaMig = readdirSync(mig).map((f) => readFileSync(join(mig, f), "utf8")).join("\n");
      c.expect(!/alter table public\.persons\s+add column\s+(honorific|salutation|gelar)/i.test(semuaMig),
        "a migration added an honorific column");

      // 2. AND NO SURFACE INVENTS ONE. Neither in the copy nor in the code that
      //    composes the greeting.
      const s3 = [...hle.matchAll(/"(mengajar\.[a-z0-9_.]+)":\s*\{([^}]*)\}/g)];
      c.expect(s3.length >= 130, `only ${s3.length} educator copy strings found`);
      const semuaKata = s3.map((m) => m[2]).join(" ");
      for (const bad of [/\bBu\s+[A-Z]/, /\bPak\s+[A-Z]/, /\bIbu\s+[A-Z]/, /\bBapak\s+[A-Z]/, /\bMrs?\.\s/, /\bMs\.\s/]) {
        c.expect(!bad.test(semuaKata), `the educator copy carries an honorific: ${bad}`);
      }
      const beranda = code(readFileSync(join(repoRoot, "src", "app", "mengajar", "page.tsx"), "utf8"));
      c.expect(/aku\.nama/.test(beranda), "the greeting does not use the stored name");
      // EVERY literal, not just a double-quoted one. The first version of this
      // check looked for `"Bu ` and a template literal walked straight past it —
      // found by mutating the greeting rather than by reading the check again,
      // which is the only way that class of hole is ever found.
      const LITERAL = /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g;
      // An honorific is only an honorific when it PREFIXES SOMEBODY: the title
      // immediately before an interpolated value or a capitalised word. Cased,
      // so the `pin-ms` class name is a class name and not a Ms.
      const SAPAAN = /\b(Bu|Pak|Ibu|Bapak|Mr|Mrs|Ms|Sir|Madam)\b\s*(\$\{|[A-Z])/;
      for (const f of files) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        for (const lit of code(readFileSync(f, "utf8")).match(LITERAL) ?? []) {
          const m = SAPAAN.exec(lit);
          c.expect(m === null, `${rel} composes the honorific "${m?.[1]}" in front of a name: ${lit.slice(0, 40)}`);
          // and a title standing alone in its own literal, which renders in
          // front of whatever the next expression puts beside it
          const sendiri = lit.slice(1, -1).trim();
          c.expect(!/^(Bu|Pak|Ibu|Bapak|Mr\.?|Mrs\.?|Ms\.?|Sir|Madam)$/.test(sendiri),
            `${rel} carries the bare honorific ${lit} for something to be placed after`);
        }
      }

      // 3. NAMES ARE BOUNDED BY THE DATABASE, not by this application. The
      //    roster rides memberships → enrollments → persons, whose educator
      //    branch is subtree containment; nothing filters a school-wide
      //    population of people down to a class in the browser.
      c.expect(/from\("memberships"\)/.test(lib), "the roster is not read from memberships");
      c.expect(/persons\(id, display_name\)/.test(lib), "the roster does not read persons through the membership");
      c.expect(/\.eq\("node_id", nodeId\)/.test(lib), "the roster read is not narrowed to the class");
      c.expect(!/from\("persons"\)[\s\S]{0,200}\.in\(/.test(lib), "names are read in bulk and filtered afterwards");
      const auth = readFileSync(join(mig, "20260912004431_authorization.sql"), "utf8");
      c.expect(/create policy persons_select on public\.persons for select to authenticated\s+using \(public\.person_visible_to_me\(id\)\)/.test(auth),
        "persons_select no longer goes through person_visible_to_me");
      c.expect(/has_scope\('EDUCATOR', m\.node_id\)/.test(auth),
        "person_visible_to_me's educator branch is no longer subtree-bound");

      // 4. OBSERVATION IS NOT JUDGMENT. The roster component has room for a name
      //    and for nothing else: no pill, no colour, no count, no order but the
      //    alphabet. This is checked on the COMPONENT, so a screen cannot add one
      //    without the component growing a slot for it.
      const isi = code(daftar);
      for (const bad of ["pin-pill", "pin-num", "pin-status", "status", "warna", "color", "badge"]) {
        c.expect(!new RegExp(bad).test(isi), `the roster component carries ${bad}`);
      }
      c.expect(/\{m\.nama\}/.test(isi), "the roster renders something other than the name");
      c.expect(/localeCompare/.test(lib), "the roster is not alphabetical");
      c.expect(!/sort\([^)]*(mengumpulkan|sudah|belum|mastery|skor)/.test(lib),
        "the roster is ordered by something about the learners");

      // 5. AND NO WORD ON THE SURFACE JUDGES ANYBODY.
      const HAKIM = [
        /tertinggal/i, /bermasalah/i, /malas/i, /lemah/i, /bodoh/i, /gagal/i,
        /\bfailing\b/i, /\bat risk\b/i, /\bbehind\b/i, /\bstruggl/i, /\bweak\b/i,
        /\blazy\b/i, /\bproblem\b/i, /peringkat [0-9]/i,
      ];
      for (const bad of HAKIM) {
        c.expect(!bad.test(semuaKata), `the educator copy judges a learner: ${bad}`);
      }
      // the neutral framing must be present, not merely the harsh one absent
      const siapa = /"mengajar\.siapa\.catatan":\s*\{([^}]*)\}/.exec(hle)?.[1] ?? "";
      c.expect(/bukan peringkat/i.test(siapa) && /not a ranking/i.test(siapa),
        "the names page does not say it is not a ranking, in both languages");
      const hitung = /"mengajar\.cepat\.hidup\.catatan":\s*\{([^}]*)\}/.exec(hle)?.[1] ?? "";
      c.expect(/hitungan, bukan penilaian/i.test(hitung) && /counts, not judgments/i.test(hitung),
        "the live counts are not declared to be counts rather than judgments");

      c.note(`${s3.length} educator copy strings, ${HAKIM.length} judgment patterns swept, persons has ${kolom.split("\n").length - 1} column(s)`);
      return c.verdict(
        "no honorific is inferred, and the absence of any source for one is read from the persons table in the migrations " +
        "rather than asserted; learner names reach the surface only through memberships and person_visible_to_me, whose " +
        "educator branch is subtree-bound, and are never fetched in bulk and narrowed afterwards; the roster component has " +
        "no slot for a status, a colour, a number or any order but the alphabet; and the copy neither judges a learner nor " +
        "omits the sentences that say a count is not a judgment",
      );
    },
  },
  {
    id: "UX1-S3-KATA-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const hle = readFileSync(join(repoRoot, "src", "lib", "hle.ts"), "utf8");
      const files = walk(join(repoRoot, "src", "app", "mengajar"))
        .concat(walk(join(repoRoot, "src", "components", "mengajar")))
        .filter((f) => /\.tsx?$/.test(f));

      // 1. EVERY KEY A SCREEN RENDERS IS DECLARED. A missing key renders as
      //    ⟨key⟩ to a teacher, which is the failure this catches at build time.
      const dipakai = new Set<string>();
      for (const f of files) {
        const src = readFileSync(f, "utf8");
        for (const m of src.matchAll(/s\("(mengajar\.[a-zA-Z0-9_.]+)"\)/g)) dipakai.add(m[1]);
        for (const m of src.matchAll(/"(mengajar\.[a-zA-Z0-9_.]+)"/g)) dipakai.add(m[1]);
      }
      c.expect(dipakai.size >= 60, `only ${dipakai.size} educator copy key(s) rendered by the surface`);
      const dinamis = /mengajar\.instrumen\.\$\{/.test(files.map((f) => readFileSync(f, "utf8")).join("\n"));
      for (const k of dipakai) {
        if (k.includes("${")) continue;
        c.expect(hle.includes(`"${k}"`), `the educator surface renders an undeclared copy key: ${k}`);
      }
      // the one key built from a value must have a telling for every value it
      // can take, which is the whole set of non-QUICK assessment modes
      if (dinamis) {
        for (const mode of ["PRE_TEST", "POST_TEST", "STANDALONE"]) {
          c.expect(hle.includes(`"mengajar.instrumen.${mode}"`),
            `the instrument list can render ${mode} and has no telling for it`);
        }
      }

      // 2. BOTH LANGUAGES, AND NEITHER EMPTY. (UX1-S0-HLE-01 proves this over
      //    the whole table; this proves the Slice-3 block is inside that sweep
      //    and that no telling is a placeholder.)
      const s3 = [...hle.matchAll(/"(mengajar\.[a-z0-9_.]+)":\s*\{\s*default:\s*"([^"]*)",\s*en:\s*"([^"]*)"\s*\}/g)];
      c.expect(s3.length >= 130, `only ${s3.length} educator key(s) carry both languages in the expected shape`);
      for (const [, key, id, en] of s3) {
        c.expect(id.trim().length > 0, `${key} has an empty Indonesian telling`);
        c.expect(en.trim().length > 0, `${key} has an empty English telling`);
        c.expect(id !== en || /^[A-Z][a-z]*$/.test(id) || id.length < 12,
          `${key} has the same long string in both languages — one of them was not written`);
      }

      // 3. ANDA, NEVER KAMU. One pass over words, a standalone list plus the
      //    -mu clitic, with the words that merely end in those letters declared.
      const STANDALONE = new Set(["kamu", "engkau", "kau", "dikau", "mu"]);
      const NOT_A_CLITIC = new Set([
        "ilmu", "kamu", "waktu", "tentu", "temu", "satu", "ibu", "itu", "tamu", "suku",
        "perlu", "tahu", "tumbuh", "lampu", "bantu", "mampu", "semu", "palu", "bau",
      ]);
      let anda = 0;
      for (const [, key, id] of s3) {
        for (const raw of id.split(/[^A-Za-zÀ-ÿ-]+/)) {
          const w = raw.toLowerCase();
          if (!w) continue;
          if (w === "anda") anda += 1;
          c.expect(!STANDALONE.has(w), `${key} addresses the reader as "${raw}"`);
          if (w.endsWith("mu") && w.length > 2 && !NOT_A_CLITIC.has(w)) {
            c.expect(false, `${key} uses the informal clitic in "${raw}"`);
          }
        }
      }
      c.expect(anda > 0, "the educator copy never addresses the reader as Anda");
      // ADVERSARIAL PLANT: the same sweep must catch a planted informal address.
      const planted = "Selamat pagi, ini kelasmu hari ini";
      let caught = false;
      for (const raw of planted.split(/[^A-Za-zÀ-ÿ-]+/)) {
        const w = raw.toLowerCase();
        if (STANDALONE.has(w) || (w.endsWith("mu") && w.length > 2 && !NOT_A_CLITIC.has(w))) caught = true;
      }
      c.expect(caught, "the informal-address sweep does not catch a planted clitic");

      // 4. NO INTERNAL VOCABULARY. Enum labels, table names and column names are
      //    what a teacher must never meet; this is narrower than the platform
      //    word list and aimed at what THIS surface touches.
      const DALAM = [
        /\bplp_/i, /\brole_assignments\b/i, /\bscope_node_id\b/i, /\bjalur\b/i,
        /\borg_nodes\b/i, /\blearning_assignments\b/i, /\bassessment_assignments\b/i,
        /\bmetric_evaluate\b/i, /\bbelow_minimum\b/i, /\bnot_permitted\b/i,
        /\bCAN_[A-Z_]+/, /\bis_ad_hoc\b/i, /\bDRAFT\b/, /\bACTIVE\b/, /\bWITHDRAWN\b/,
        /\bSUBMITTED\b/, /\bFINALIZED\b/, /\bPOST_TEST\b/, /\bPRE_TEST\b/, /\bQUICK\b/,
      ];
      for (const [, key, id, en] of s3) {
        for (const bad of DALAM) {
          c.expect(!bad.test(id), `${key} names an internal concept in Indonesian: ${bad}`);
          c.expect(!bad.test(en), `${key} names an internal concept in English: ${bad}`);
        }
      }

      c.note(`${dipakai.size} key(s) rendered, ${s3.length} declared in both languages, ${anda} Anda, 0 informal`);
      return c.verdict(
        "every copy key the educator surface renders is declared, every declared key carries a real telling in both " +
        "languages, the mode-derived key has a telling for each mode it can take, the reader is addressed as Anda and " +
        "never informally — with a planted clitic watched to be caught — and no telling in either language names a table, " +
        "a column, a capability or a lifecycle enum",
      );
    },
  },
  {
    id: "UX1-S3-FAKTA-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const css = readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8");

      // 1. THE PHONE BLOCK THAT NARROWS SLICE 3 COMES AFTER THE RULES IT
      //    OVERRIDES. At equal specificity the later rule wins, and a stack
      //    declared before the thing it overrides is a stack that never happens
      //    — the defect UX1-S0-FAKTA-01 was rewritten to catch.
      const NARROW = [
        { sel: ".pin-roster", base: /\.pin-roster \{[^}]*grid-template-columns:\s*repeat\(2/ },
        // the track may be written `1fr` or `minmax(0, 1fr)` — UX1-S0-MUAT-01
        // requires the second wherever the auto track holds something that
        // cannot wrap, and this anchor must not care which spelling it finds
        { sel: ".pin-act", base: /\.pin-act \{[^}]*grid-template-columns:\s*(?:minmax\(0, )?1fr\)? auto/ },
        { sel: ".pin-terima li", base: /\.pin-terima li \{[^}]*grid-template-columns:\s*auto 1fr auto/ },
        { sel: ".pin-switch", base: /\.pin-switch \{[^}]*display:\s*inline-flex/ },
        { sel: ".pin-seg", base: /\.pin-seg \{[^}]*display:\s*inline-flex/ },
      ];
      for (const { sel, base } of NARROW) {
        const m = base.exec(css);
        c.expect(m !== null, `${sel} has no wide rule to narrow`);
        if (!m) continue;
        const wide = m.index;
        const narrowIdx = css.indexOf(`  ${sel} {`, wide);
        c.expect(narrowIdx > wide, `${sel} is never narrowed after its wide rule`);
        // and it must be inside a phone media block
        const before = css.slice(0, narrowIdx);
        const lastMedia = before.lastIndexOf("@media (max-width: 560px)");
        const lastClose = before.lastIndexOf("\n}\n");
        c.expect(lastMedia > lastClose, `${sel}'s narrow rule is not inside the phone block`);
      }

      // 2. THE NEW COMPACT FACT SUMMARIES REUSE `.pin-facts`, so they inherit
      //    the approved stack instead of restating it. Nothing on the educator
      //    surface declares its own fact grid.
      const files = walk(join(repoRoot, "src", "app", "mengajar")).filter((f) => f.endsWith(".tsx"));
      let facts = 0;
      for (const f of files) {
        const src = readFileSync(f, "utf8");
        facts += [...src.matchAll(/className="pin-facts"/g)].length;
      }
      c.expect(facts >= 3, `only ${facts} compact fact summar(ies) on the educator surface`);
      c.expect(!/\.pin-(isian|hidup|paket|acts)[^{]*\{[^}]*\.pin-facts/.test(css),
        "an educator container redefines the fact grid");
      // nothing added AFTER the Slice-3 phone block may re-widen a fact summary
      const s3Media = css.lastIndexOf("@media (max-width: 560px)");
      c.expect(!/\.pin-facts[^{]*\{[^}]*grid-template-columns/.test(css.slice(s3Media + 1)),
        "a fact-summary grid is declared after the last phone block and would outrank the stack");

      // 3. THE LIVE PANEL CARRIES TWO FACTS, NOT THREE. The third — per-item
      //    results — was removed because no contract grants an educator one, and
      //    a row that comes back silently is how a removed promise returns.
      // comments stripped: this file EXPLAINS why the third fact is absent, and
      // a scanner that read the explanation as the promise would fail on the
      // very note that records the decision
      const cepat = code(readFileSync(
        join(repoRoot, "src", "app", "mengajar", "[kelas]", "uji-cepat", "page.tsx"), "utf8"));
      const panel = /<dl className="pin-facts">([\s\S]*?)<\/dl>/.exec(cepat)?.[1] ?? "";
      const baris = [...panel.matchAll(/<dt>/g)].length;
      c.expect(baris === 2, `the live panel carries ${baris} fact(s); it carries the two it can prove`);
      c.expect(!/hasil per soal|per-item|per soal/i.test(cepat), "the live panel promises a per-item result again");

      c.note(`${NARROW.length} composition(s) narrowed in order, ${facts} fact summar(ies) reusing the shared grid, ${baris} live fact(s)`);
      return c.verdict(
        "every Slice-3 composition that cannot hold its shape on a phone is narrowed by a rule written AFTER the wide one " +
        "and inside the phone block, so the cascade cannot silently undo it; the educator's compact fact summaries reuse " +
        "`.pin-facts` and inherit the approved stack rather than restating it, and nothing after the last phone block " +
        "re-widens one; and the quick assessment's live panel still carries two facts rather than the three the reviewed " +
        "concept drew, because the third had no contract behind it",
      );
    },
  },

  {
    id: "UX1-S0-MUAT-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      /**
       * DOES THE BOX FIT, AND IS ANYTHING CLIPPED.
       *
       * Promoted from a one-off Playwright measurement that found a real defect:
       * four of thirty-two rendered educator pages overflowed at 390px, the
       * worst by 279px, with the document scrolling to 637px inside a 390px
       * viewport. The cause was NOT what it first looked like. The first
       * diagnosis said this stylesheet has no `box-sizing` reset and every
       * padded full-width box was therefore too wide -- and that was an
       * ARTEFACT OF THE MEASURING HARNESS, which had stripped
       * `@import "tailwindcss"` from globals.css and with it Tailwind's
       * preflight. The product has had a global border-box all along. Reverting
       * each candidate fix one at a time against the COMPILED stylesheet showed
       * a single one doing all the work, and this guard is built on that one.
       *
       * WHY IT READS THE STYLESHEET AND NOT A BROWSER. A rendered measurement
       * only covers what some fixture happens to render, and the fixtures do
       * not reach every surface: measured over 44 rendered pages, `.pin-op`,
       * `.pin-num-btn`, `.pin-drow`, `.pin-nrow`, `.pin-tugas` and the trail
       * dot matched ZERO elements. Deriving the population from the cascade
       * instead means a rule added tomorrow is in the population the day it is
       * written. It also runs under `npm ci` in CI, where Playwright is not a
       * dependency and no browser is installed. The rendered measurement
       * remains the companion evidence, and it is what validated this guard.
       *
       * The defect it found on its first strict run was on the LEARNER's home
       * (`src/app/belajar/page.tsx`), which no fixture renders at all.
       */
      const css = readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8");

      type Rule = { sel: string; decls: Record<string, string>; media: string | null; i: number };
      function parseCss(source: string): Rule[] {
        const clean = source.replace(/\/\*[\s\S]*?\*\//g, " ");
        const out: Rule[] = [];
        let n = 0, media: string | null = null, depth = 0;
        const re = /([^{}]+)\{|\}/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(clean))) {
          if (m[0] === "}") { depth--; if (depth === 0) media = null; continue; }
          const head = m[1].trim();
          if (head.startsWith("@")) { media = head; depth++; continue; }
          const close = clean.indexOf("}", re.lastIndex);
          const decls: Record<string, string> = {};
          for (const d of clean.slice(re.lastIndex, close).split(";")) {
            const k = d.indexOf(":");
            if (k < 0) continue;
            decls[d.slice(0, k).trim()] = d.slice(k + 1).trim();
          }
          for (const s of head.split(",")) out.push({ sel: s.trim(), decls, media, i: n++ });
          re.lastIndex = close + 1;
        }
        return out;
      }
      const rules = parseCss(css).filter((r) => r.media !== "@media print");
      c.expect(rules.length > 200, `only ${rules.length} rule(s) parsed from the stylesheet`);

      const classesOf = (compound: string) =>
        new Set((compound.match(/\.[a-zA-Z0-9_-]+/g) ?? []).map((x) => x.slice(1)));
      const lastCompound = (sel: string) => sel.trim().split(/\s*[>+~]\s*|\s+/).pop() ?? sel;
      const spec = (s: string) =>
        (s.match(/[.:[]/g)?.length ?? 0) * 100 + (s.match(/(^|[\s>+~])[a-z]/gi)?.length ?? 0);
      const subset = (a: Set<string>, b: Set<string>) => a.size > 0 && [...a].every((x) => b.has(x));

      const VIEWPORTS = [["wide", null], ["phone", "@media (max-width: 560px)"]] as const;

      // ── I0. The assumption everything below rests on. Tailwind's preflight
      //    supplies `box-sizing: border-box` globally; without it every box in
      //    this sheet that carries padding and a width is suddenly too wide,
      //    all at once. It is asserted against the BUILT stylesheet, because
      //    that is where the import actually resolves.
      c.expect(/@import\s+"tailwindcss"/.test(readFileSync(join(repoRoot, "src", "app", "globals.css"), "utf8")),
        "globals.css no longer imports tailwindcss, so the global border-box reset is gone");
      const chunks = join(repoRoot, ".next", "static", "chunks");
      let built = "";
      if (existsSync(chunks)) {
        built = readdirSync(chunks).filter((f) => f.endsWith(".css"))
          .map((f) => readFileSync(join(chunks, f), "utf8")).join("\n");
      }
      c.expect(built.length > 0, "no compiled stylesheet in .next/static/chunks; the build must run first");
      c.expect(/box-sizing:\s*border-box/.test(built),
        "the compiled stylesheet carries no global border-box reset");

      // ── I1. A box a rule stretches to its container's width must be allowed
      //    to fold its text. `.pin-btn` carries `white-space: nowrap`, which is
      //    right while the button is as wide as its words and wrong the moment
      //    a rule makes it as wide as a phone: the label refuses to fold, the
      //    flex column grows to fit it, and the page scrolls sideways.
      //
      //    A rule counts toward an element only when its selector is a SUFFIX
      //    of that element's own, at compound boundaries. Merging every
      //    `.pin-btn` rule into every `.pin-btn` element -- the first version of
      //    this check -- let the fix on `.pin-actions .pin-btn` mask the
      //    identical defect on `.pin-tugas .pin-tfoot .pin-btn`, and the guard
      //    reported green over a real one.
      const stretched = [...new Set(rules.filter((r) => r.decls["width"] === "100%").map((r) => r.sel))];
      c.expect(stretched.length >= 8, `only ${stretched.length} stretched selector(s) found`);
      let merged = 0;
      for (const [vp, mq] of VIEWPORTS) {
        for (const sel of stretched) {
          const chain = sel.trim().split(/\s+/);
          const applying = rules
            .filter((r) => {
              if (!(r.media === null || r.media === mq)) return false;
              const rc = r.sel.trim().split(/\s+/);
              if (rc.length > chain.length) return false;
              const tail = chain.slice(chain.length - rc.length);
              return rc.every((cc, i) => subset(classesOf(cc), classesOf(tail[i])));
            })
            .sort((a, b) => spec(a.sel) - spec(b.sel) || a.i - b.i);
          if (applying.length === 0) continue;
          merged++;
          const d: Record<string, string> = {};
          for (const r of applying) Object.assign(d, r.decls);
          c.expect(
            !(d["width"] === "100%" && d["white-space"] === "nowrap"),
            `${vp}: ${sel} is stretched to its container's width and still refuses to wrap`,
          );
        }
      }

      // ── I2. A grid whose `auto` track holds something that will not wrap must
      //    let the other track shrink. A bare `1fr` takes its content as its
      //    minimum, so a title with no break opportunity pushes the status pill
      //    or the arrow beside it out through the card's border -- and the list
      //    around it has `overflow: hidden`, so what the reader loses is the
      //    status, silently.
      // The nowrap is usually declared on the CHILD'S OWN class (`.pin-pill`),
      // while the containment shows up in a separate placement rule
      // (`.pin-row > .pin-pill { grid-column: 2 }`). So the question is not
      // "does a nowrap selector start with this grid's selector" -- the first
      // version asked exactly that and walked past `.pin-row`, because of the
      // child combinator and because `.pin-pill` names no ancestor at all.
      // It is: does this grid place a child whose own class refuses to wrap.
      const flat = (s: string) => s.trim().replace(/\s*[>+~]\s*/g, " ").replace(/\s+/g, " ");
      const nowrapClasses = new Set<string>();
      for (const r of rules) {
        if (r.decls["white-space"] !== "nowrap") continue;
        for (const cls of classesOf(lastCompound(r.sel))) nowrapClasses.add(cls);
      }
      let grids = 0;
      for (const [vp, mq] of VIEWPORTS) {
        for (const r of rules) {
          if (!(r.media === null || r.media === mq)) continue;
          const g = r.decls["grid-template-columns"];
          if (!g) continue;
          const tracks = g
            .replace(/minmax\([^)]*\)/g, "M")
            .replace(/repeat\(\s*\d+\s*,\s*([^)]*)\)/g, "$1 $1")
            .split(/\s+/).filter(Boolean);
          if (!tracks.includes("1fr") || tracks.every((x) => x === "1fr")) continue;
          const prefix = `${flat(r.sel)} `;
          const kids = rules
            .filter((k) => flat(k.sel).startsWith(prefix))
            .filter((k) => [...classesOf(lastCompound(k.sel))].some((cls) => nowrapClasses.has(cls)))
            .map((k) => k.sel);
          if (kids.length === 0) continue;
          grids++;
          c.expect(false, `${vp}: ${r.sel} lays out "${g}" while ${kids[0]} inside it refuses to wrap; the 1fr cannot shrink`);
        }
      }
      c.expect(grids === 0, "");

      c.note(`${rules.length} rules, ${stretched.length} stretched selector(s), ${merged} element/viewport merge(s)`);
      c.note("validated against 32 educator + 56 Slice-1/2 rendered measurements at 390px and 1280px, all zero-overflow");
      return c.verdict(
        "nothing in the Experience stylesheet is stretched to its container's width while refusing to fold its text, and no " +
        "grid puts a bare 1fr beside a track holding something that cannot wrap -- the two shapes that actually produced " +
        "measured horizontal overflow, one of them on a learner surface no rendered fixture reaches. The global border-box " +
        "reset every padded box depends on is asserted against the COMPILED stylesheet rather than assumed, because an " +
        "earlier harness lost it and produced a convincing 48px defect that the product never had",
      );
    },
  },

  // ═══════════════════════════════════════════════════════ UX-1 · THE TOUR
  {
    id: "UX1-TUR-LIHAT-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const files = [
        ...walk(join(repoRoot, "src", "components", "tur")),
        join(repoRoot, "src", "app", "tur", "actions.ts"),
        join(repoRoot, "src", "lib", "tur.ts"),
        join(repoRoot, "src", "lib", "tur-negara.ts"),
      ].filter((f) => /\.tsx?$/.test(f));
      c.expect(files.length >= 8, `only ${files.length} tour file(s) found; the surface is bigger than that`);

      // 1. THE TOUR ONLY LOOKS. Nothing navigates, nothing submits, and nothing
      //    on it is a piece of real product wired up. A step whose subject lives
      //    inside an assignment draws a miniature instead of going there,
      //    because mounting a real lesson records reading progress and opening
      //    a real assessment spends an attempt.
      const PERGI = /from "next\/link"|<Link\b|<a\s|href=|<form\b|router\.push\(|router\.replace\(|window\.location/;
      for (const f of files) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        // The Help control is the one exception and it is declared: from a page
        // that is not the landing it must travel back to one, because replay
        // runs on the landing (§F). It still navigates nowhere else.
        if (rel.endsWith("TombolBantuan.tsx")) continue;
        const m = PERGI.exec(code(readFileSync(f, "utf8")));
        c.expect(m === null, `${rel} navigates or submits from inside the tour: ${m?.[0]}`);
      }
      c.expect(PERGI.test('<Link href="/belajar/x">go</Link>'), "the navigation scanner does not catch a link");
      c.expect(PERGI.test("router.push(`/mengajar/${id}`);"), "the navigation scanner does not catch a push");

      const tombol = code(readFileSync(join(repoRoot, "src", "components", "tur", "TombolBantuan.tsx"), "utf8"));
      const tujuan = [...tombol.matchAll(/router\.push\(([^)]*)\)/g)].map((m) => m[1]);
      c.expect(tujuan.length === 1, `the Help control navigates to ${tujuan.length} places; it returns to one landing`);
      c.expect(/\$\{beranda\}/.test(tujuan[0] ?? ""), "the Help control's destination is not the experience's own landing");

      // 2. NOTHING OF THE PRODUCT IS TOUCHED. No engine call, no lesson, no
      //    session, no launcher, no certificate — a tour that changed the thing
      //    it is describing would not be a map of it.
      const PRODUK = /record_lesson_progress|start_session|launch_quick_assessment|assessment_orientation|submit_answer|my_certificate|assessment-engine/;
      for (const f of files) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const m = PRODUK.exec(code(readFileSync(f, "utf8")));
        c.expect(m === null, `${rel} reaches into the product it is describing: ${m?.[0]}`);
      }
      c.expect(PRODUK.test('await db.rpc("record_lesson_progress", {});'),
        "the product scanner does not catch a lesson-progress write");

      // 3. THE THREE VERBS, AND WHERE EACH ONE MAY BE CALLED FROM.
      const aksi = code(readFileSync(join(repoRoot, "src", "app", "tur", "actions.ts"), "utf8"));
      c.expect(/^"use server";/m.test(aksi), "the tour actions are not a server module");
      const verbs = [...aksi.matchAll(/export async function (\w+)/g)].map((m) => m[1]);
      c.expect(verbs.length === 3, `${verbs.length} exported tour action(s); the contract declares three verbs`);
      // Every one validates its key: a POST endpoint a signed-in person can
      // call must not hand an arbitrary string to the database.
      for (const v of verbs) {
        const body = new RegExp(`export async function ${v}\\([\\s\\S]*?\\n\\}`).exec(aksi)?.[0] ?? "";
        c.expect(/kunciSah\(/.test(body), `the tour action ${v} does not check the key it was given`);
      }
      c.expect(!/revalidatePath|redirect\(/.test(aksi),
        "a tour action re-renders or navigates; presentation state changes nothing the page shows");

      // 4. REPLAY SPENDS NOTHING. Being helped on purpose must not push somebody
      //    toward the cap, un-finish a finished tour, or undo a decision not to
      //    be interrupted.
      const turSrc = code(readFileSync(join(repoRoot, "src", "components", "tur", "Tur.tsx"), "utf8"));
      const replay = /function mulaiLagi\([\s\S]*?\n  \}/.exec(turSrc)?.[0] ?? "";
      c.expect(replay.length > 0, "the replay path cannot be found in the tour component");
      const SPEND = /catatTampilTur|selesaikanTurAksi|bungkamTurAksi/;
      c.expect(!SPEND.test(replay), "replay from Help calls one of the presentation verbs");
      // ADVERSARIAL PLANT: the same reading of the same function must catch a
      // replay that does spend a presentation.
      const ditanam = replay.replace("setBantuan(false);", "setBantuan(false); void catatTampilTur(kunci);");
      c.expect(SPEND.test(ditanam), "the replay scanner does not catch a planted presentation write");

      // 5. AN ARRIVAL THAT WAS HELD BACK IS NOT SPENT. The presentation write
      //    is guarded by the same condition that opens the card, and by a ref
      //    so a refresh or a language switch cannot spend a second one.
      c.expect(/const otomatisSekarang = tersedia && otomatis && !bantuanAwal;/.test(turSrc),
        "the automatic-presentation condition is not the one that opens the card");
      c.expect(/if \(!otomatisSekarang \|\| sudahDicatat\.current\) return;/.test(turSrc),
        "the presentation write is not guarded against being made twice");
      const kali = [...turSrc.matchAll(/catatTampilTur\(/g)].length;
      c.expect(kali === 1, `catatTampilTur is called from ${kali} places in the tour; exactly one arrival spends one`);

      c.note(`${files.length} tour file(s) swept, ${verbs.length} verb(s), 4 plants caught`);
      return c.verdict(
        "the tour only looks: no file in it navigates, submits or reaches a product RPC — the scanners are watched to " +
        "catch a planted link, a planted push and a planted lesson-progress write — the only writes are the three " +
        "declared presentation verbs, each validating the key it was handed and neither revalidating nor redirecting, " +
        "replay from Help calls none of them with a planted spend watched to be caught, and the one automatic " +
        "presentation is written from exactly one place under the same condition that opens the card",
      );
    },
  },

  {
    id: "UX1-TUR-ORANG-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const turFiles = [
        ...walk(join(repoRoot, "src", "components", "tur")),
        join(repoRoot, "src", "app", "tur", "actions.ts"),
        join(repoRoot, "src", "lib", "tur.ts"),
        join(repoRoot, "src", "lib", "tur-negara.ts"),
      ].filter((f) => /\.tsx?$/.test(f));

      // 1. THE MEMORY IS THE PERSON'S, NOT THE DEVICE'S. A shared classroom
      //    tablet is the case that decides this: the next child to sign in is a
      //    different person and must get their own first tour, so no part of
      //    the durable answer may live in storage that belongs to the machine.
      const PERANGKAT = /localStorage|sessionStorage|document\.cookie|indexedDB|window\.name/;
      for (const f of turFiles) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const m = PERANGKAT.exec(code(readFileSync(f, "utf8")));
        c.expect(m === null, `${rel} keeps tour state on the device: ${m?.[0]}`);
      }
      c.expect(PERANGKAT.test('window.localStorage.setItem("tour", "1");'),
        "the device-storage scanner does not catch a localStorage write");
      c.expect(PERANGKAT.test('document.cookie = "tour=1";'),
        "the device-storage scanner does not catch a cookie write");

      // 2. THE PERSON IS THE SESSION. None of the four RPCs takes an identity,
      //    so there is no parameter for a caller to pass somebody else through.
      const negara = code(readFileSync(join(repoRoot, "src", "lib", "tur-negara.ts"), "utf8"));
      const panggil = [...negara.matchAll(/\.rpc\(\s*"([a-z_]+)"\s*(?:,\s*\{([^}]*)\})?/g)];
      const nama = panggil.map((m) => m[1]);
      const DIHARAP = ["my_tour_state", "note_tour_presented", "complete_tour", "suppress_tour"];
      for (const n of DIHARAP) c.expect(nama.includes(n), `the state layer never calls ${n}`);
      for (const m of panggil) {
        if (m[1] === "current_person_id") continue; // the seniority read, below
        c.expect(!/person|user|actor|subject|siapa/i.test(m[2] ?? ""),
          `${m[1]} is called with an identity argument: ${m[2]}`);
      }
      // `current_tour_version` is internal to the database — revoked from
      // `authenticated` — and the version comes back inside the state row, so a
      // surface that resolved it separately could disagree with the row it is
      // about to write.
      c.expect(!nama.includes("current_tour_version"),
        "the state layer calls current_tour_version, which is not a client RPC");

      // 3. THE CONTRACT IS THE MIGRATION'S, READ RATHER THAN ASSUMED.
      const migDir = join(repoRoot, "supabase", "migrations");
      const migs = walk(migDir).filter((f) => f.endsWith(".sql"));
      c.expect(migs.length === 87, `${migs.length} migrations; this work adds none and the baseline has 87`);
      const tourMig = migs.find((f) => f.includes("tour_state_follows_the_person"));
      c.expect(Boolean(tourMig), "the tour persistence migration is not in the tree");
      const sql = tourMig ? readFileSync(tourMig, "utf8") : "";
      for (const n of DIHARAP) {
        const sig = new RegExp(`create (?:or replace )?function public\\.${n}\\(([^)]*)\\)`).exec(sql);
        c.expect(sig !== null, `${n} is not declared in the migration the client calls`);
        c.expect(!/person|user_id|uuid/i.test(sig?.[1] ?? ""),
          `${n} takes an identity parameter: ${sig?.[1]}`);
      }
      c.expect(/revoke[\s\S]*current_tour_version[\s\S]*from[^;]*authenticated/i.test(sql),
        "current_tour_version is not revoked from authenticated in the migration");
      // The cap is the database's, and the surface never restates it.
      c.expect(/auto_presentation_limit/.test(sql), "the migration declares no presentation cap");
      const model = code(readFileSync(join(repoRoot, "src", "lib", "tur.ts"), "utf8"));
      c.expect(/keadaan\.auto_presentation_limit/.test(model),
        "the cap is not read from the person's own row");
      c.expect(!/<\s*3\b|===\s*3\b|>=\s*3\b/.test(model),
        "the presentation cap is restated as a literal in the model; it belongs to the database");

      // 4. IT IS PRESENTATION STATE AND NOTHING ELSE. No tour write may reach a
      //    learning record, an audit line or an evidence table.
      const BUKTI = /responses|assessment_results|official_|integrity_|certificates|learning_assignments|audit/;
      for (const f of turFiles) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const m = BUKTI.exec(code(readFileSync(f, "utf8")));
        c.expect(m === null, `${rel} names an evidence or audit surface: ${m?.[0]}`);
      }

      c.note(`${turFiles.length} tour file(s), ${DIHARAP.length} RPC signature(s) read from the migration, ` +
        `${migs.length} migration(s), 2 plants caught`);
      return c.verdict(
        "the tour's memory belongs to the person and not to the device: nothing in it touches localStorage, " +
        "sessionStorage, a cookie or IndexedDB — with a planted write of each watched to be caught — every durable " +
        "answer goes through the four declared RPCs, whose signatures are READ from the migration and carry no " +
        "identity parameter, the internal version function is never called and is revoked from authenticated in the " +
        "migration, the presentation cap is taken from the person's own row rather than restated, and no tour file " +
        "names an evidence or audit surface",
      );
    },
  },

  {
    id: "UX1-TUR-TAHAP-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // 1. THE FUNCTION REFUSES BY SHAPE. It takes a legitimate person-scoped
      //    stage or nothing, and there is no second parameter a course, a
      //    class, an age or a heuristic could be passed through.
      c.expect(varianBelajar.length === 1,
        `varianBelajar takes ${varianBelajar.length} parameters; one is the whole of the refusal`);
      c.expect(varianBelajar(null) === "netral", "a learner with no known stage is not given the neutral variant");
      c.expect(varianBelajar(undefined) === "netral", "an absent stage is not the neutral variant");
      c.expect(varianBelajar("sd") === "sd", "a legitimate primary stage does not select the primary variant");
      c.expect(varianBelajar("menengah") === "menengah", "a legitimate secondary stage does not select its variant");

      // 2. ONE IDENTITY, THREE VARIANTS. A variant change is not a new tour: it
      //    must not reset state, duplicate a row or re-present anything, which
      //    is only true while all three hang on the same key.
      const kunciBelajar = new Set([tur("netral").kunci, tur("sd").kunci, tur("menengah").kunci]);
      c.expect(kunciBelajar.size === 1 && kunciBelajar.has(TUR_BELAJAR),
        `the learner variants hang on ${kunciBelajar.size} identities; a variant change would reset state`);
      c.expect(tur("pengajar").kunci === TUR_PENGAJAR, "the educator tour is not the educator identity");
      for (const v of ["netral", "sd", "menengah", "pengajar"] as const) {
        c.expect(tur(v).langkah.length === 7, `the ${v} tour has ${tur(v).langkah.length} steps; the design has seven`);
        const posisi = tur(v).langkah.map((l) => l.posisi);
        c.expect(posisi.join(",") === "1,2,3,4,5,6,7", `the ${v} tour's positions are ${posisi.join(",")}`);
      }

      // 3. NOTHING IN THE TOUR READS A STAGE FROM ANYWHERE ELSE. `courses.stage`
      //    is a property of a course and the session's stage is a property of a
      //    session; neither is a fact about a learner, and guessing from either
      //    would tell a fifteen-year-old that PINTAR thinks they are eight.
      const turFiles = [
        ...walk(join(repoRoot, "src", "components", "tur")),
        join(repoRoot, "src", "lib", "tur.ts"),
        join(repoRoot, "src", "lib", "tur-negara.ts"),
      ].filter((f) => /\.tsx?$/.test(f));
      const TEBAK = /courses?\.stage|\bstage\b|\bumur\b|\bage\b|birth|tanggal_lahir|\btingkat\b|\bgrade\b|jenjang/i;
      for (const f of turFiles) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const m = TEBAK.exec(code(readFileSync(f, "utf8")));
        c.expect(m === null, `${rel} reaches for something to guess a learner's stage from: ${m?.[0]}`);
      }
      c.expect(TEBAK.test('const v = varianBelajar(kursus.stage);'),
        "the stage-guess scanner does not catch a course stage");
      c.expect(TEBAK.test('if (murid.age < 12) {'), "the stage-guess scanner does not catch an age");

      // 4. THE CALL SITE PASSES NOTHING, and it is read rather than trusted.
      const belajar = code(readFileSync(join(repoRoot, "src", "app", "belajar", "page.tsx"), "utf8"));
      const panggilan = [...belajar.matchAll(/varianBelajar\(([^)]*)\)/g)].map((m) => m[1].trim());
      c.expect(panggilan.length === 1, `varianBelajar is called ${panggilan.length} times on the learner landing`);
      c.expect(panggilan[0] === "null",
        `the learner landing passes \`${panggilan[0]}\` as a stage; no legitimate person-scoped source exists`);

      // 5. THE MACHINERY IS NEVER SHOWN. Not on a tour surface, not in its copy.
      const MESIN = /\bRasch\b|\btheta\b|\blogit\b|\bIRT\b|ability|discrimination|p-?value|difficulty|calibration/i;
      for (const f of turFiles) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const m = MESIN.exec(readFileSync(f, "utf8"));
        c.expect(m === null, `${rel} names the measurement machinery: ${m?.[0]}`);
      }
      for (const k of allKeys().filter((k) => k.startsWith("tur."))) {
        for (const loc of LOCALES) {
          const text = t(k as HleEvent, "learner", { locale: loc });
          const m = MESIN.exec(text);
          c.expect(m === null, `the tour telling ${k}/${loc} names the machinery: ${m?.[0]}`);
        }
      }

      c.note(`4 variant(s) x 7 step(s), ${turFiles.length} tour file(s) swept, 1 call site read, 2 plants caught`);
      return c.verdict(
        "PINTAR does not guess a learner's stage: varianBelajar takes one legitimate person-scoped parameter and " +
        "nothing else, returns the neutral variant for absent and unknown alike, and the learner landing is READ to " +
        "be passing a literal null because no such source exists at this baseline; all three learner variants hang " +
        "on one persistence identity so a stage arriving later resets nothing; no tour file reaches for a course " +
        "stage, an age, a grade or a year — with both watched on plants — and neither a tour surface nor a tour " +
        "telling in either language names the measurement machinery",
      );
    },
  },

  {
    id: "UX1-TUR-PERAN-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();

      // 1. SENIORITY DOES NOT ACCUMULATE TOURS. A Head of Department on the
      //    Classes page gets no automatic tour rather than the educator's,
      //    which omits the review work that is most of their week.
      const TABEL: Array<[string[], boolean, string]> = [
        [["EDUCATOR"], true, "a plain educator"],
        [["EDUCATOR", "STUDENT"], true, "an educator who also learns"],
        [["EDUCATOR", "HEAD_OF_DEPARTMENT"], false, "a head of department"],
        [["EDUCATOR", "DEAN"], false, "a dean"],
        [["EDUCATOR", "INSTITUTION_ADMIN"], false, "a school administrator"],
        [["EDUCATOR", "SYSTEM_ADMIN"], false, "a system administrator"],
        [["HEAD_OF_DEPARTMENT"], false, "a head of department who teaches nothing"],
        [["STUDENT"], false, "a learner"],
        [[], false, "somebody with no active grant at all"],
      ];
      for (const [peran, harap, siapa] of TABEL) {
        c.expect(turPengajarBerlaku(peran) === harap,
          `${siapa} (${peran.join("+") || "none"}) is ${harap ? "refused" : "given"} the educator tour`);
      }
      // The enum is read rather than remembered: a seventh role appearing in
      // the schema must not silently inherit somebody else's map.
      const dasar = readFileSync(
        join(repoRoot, "supabase", "migrations", "20260912004158_foundation_base.sql"), "utf8");
      const enumRow = /create type public\.app_role as enum\s*\(([^)]*)\)/.exec(dasar);
      c.expect(enumRow !== null, "the role enum is not in the migrations");
      const roles = [...(enumRow?.[1] ?? "").matchAll(/'([A-Z_]+)'/g)].map((m) => m[1]);
      c.expect(roles.length === 6, `${roles.length} roles in the enum; the table above covers six`);
      for (const r of roles) {
        if (r === "EDUCATOR" || r === "STUDENT") continue;
        c.expect(!turPengajarBerlaku(["EDUCATOR", r]), `${r} inherits the educator tour`);
      }

      // 2. THE WINDOW IS THE GRANT'S OWN, and a grant with no scope node still
      //    counts — which is exactly where this differs from the teaching
      //    context's filter, and exactly the grant a school administrator holds.
      const kini = new Date("2026-09-18T09:00:00Z");
      const hidup = { role: "EDUCATOR", valid_from: null, valid_until: null, revoked_at: null };
      c.expect(peranAktif([hidup], kini).join() === "EDUCATOR", "an open-ended live grant is not active");
      c.expect(peranAktif([{ ...hidup, revoked_at: "2026-01-01T00:00:00Z" }], kini).length === 0,
        "a revoked grant is still counted");
      c.expect(peranAktif([{ ...hidup, valid_from: "2027-01-01T00:00:00Z" }], kini).length === 0,
        "a grant that has not begun is counted");
      c.expect(peranAktif([{ ...hidup, valid_until: "2026-01-01T00:00:00Z" }], kini).length === 0,
        "an expired grant is still counted");
      c.expect(peranAktif([hidup, hidup], kini).length === 1, "the same role twice is counted twice");
      const negara = code(readFileSync(join(repoRoot, "src", "lib", "tur-negara.ts"), "utf8"));
      c.expect(/select\("role, valid_from, valid_until, revoked_at"\)/.test(negara),
        "the seniority read asks for something other than the grant's role and window");
      c.expect(!/scope_node_id/.test(negara),
        "the seniority read drops grants by scope node; an institution-wide grant has none and must not be missed");

      // 3. THE GATE REACHES BOTH PRESENTATION AND THE OFFER. A tour that is not
      //    this person's must not be presented AND must not be offered in Help
      //    (§H-3, §H-6): a map of somebody else's page is not help.
      const mengajar = code(readFileSync(join(repoRoot, "src", "app", "mengajar", "page.tsx"), "utf8"));
      c.expect(/tersedia=\{turBerlaku\}/.test(mengajar),
        "the educator landing does not hand the seniority answer to the tour");
      const turSrc = code(readFileSync(join(repoRoot, "src", "components", "tur", "Tur.tsx"), "utf8"));
      c.expect(/const otomatisSekarang = tersedia &&/.test(turSrc),
        "automatic presentation is not gated on the tour being this person's");
      c.expect(/tur=\{tersedia \? daftar : null\}/.test(turSrc),
        "Help offers the tour to somebody it does not belong to");
      // ADVERSARIAL PLANT: a gate that is bypassed at the call site must fail.
      const ditanam = mengajar.replace("tersedia={turBerlaku}", "tersedia={true}");
      c.expect(!/tersedia=\{turBerlaku\}/.test(ditanam),
        "the call-site check does not notice a hard-coded gate");

      // 4. THE TOUR IS THE EXPERIENCE'S, AND THE EXPERIENCE IS THE DOOR'S. The
      //    learner landing carries no role gate at all, because a senior
      //    person's LEARNER experience is still the learner experience.
      const belajar = code(readFileSync(join(repoRoot, "src", "app", "belajar", "page.tsx"), "utf8"));
      c.expect(!/turPengajarBerlaku|peranSaya/.test(belajar),
        "the learner landing counts roles to decide which tour to show");

      c.note(`${TABEL.length} role combination(s), ${roles.length} enum role(s) read from the migration, ` +
        `5 window case(s), 1 plant caught`);
      return c.verdict(
        "a tour belongs to an experience and seniority does not accumulate one: turPengajarBerlaku refuses every " +
        "role above EDUCATOR in the schema's own enum, which is READ rather than remembered, so a seventh role " +
        "cannot silently inherit somebody else's map; the active-grant filter honours the grant's own window and " +
        "deliberately keeps grants with no scope node, which is the kind a school administrator holds; the gate " +
        "reaches both automatic presentation and the Help offer, with a hard-coded gate watched to be caught; and " +
        "the learner landing counts no roles at all",
      );
    },
  },

  {
    id: "UX1-TUR-TAMPIL-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const K = (o: Partial<Parameters<typeof akanMunculLagi>[0] & object>) => ({
        tour_key: TUR_BELAJAR, tour_version: 1, should_auto_present: true,
        auto_shown_count: 0, auto_presentation_limit: 3, completed: false, suppressed: false,
        ...o,
      });

      // 1. WHETHER IT OPENS BY ITSELF. The database owns the durable half and
      //    this never second-guesses it; the only thing added is two Experience
      //    exclusions, and neither of them spends a presentation — which is why
      //    the answer carries a reason rather than a bare false.
      const bebas = { tautanLangsung: false, ujiCepatBerjalan: false };
      c.expect(bolehTampilOtomatis(K({}), bebas).boleh, "a first arrival with a clean row is held back");
      const tidakBerhak = bolehTampilOtomatis(K({ should_auto_present: false }), bebas);
      c.expect(!tidakBerhak.boleh && tidakBerhak.sebab === "tidak_berhak",
        "the database's own refusal is not honoured, or is not named");
      const kosong = bolehTampilOtomatis(null, bebas);
      c.expect(!kosong.boleh && kosong.sebab === "tidak_berhak",
        "a state that could not be read opens the tour anyway");
      const dalam = bolehTampilOtomatis(K({}), { ...bebas, tautanLangsung: true });
      c.expect(!dalam.boleh && dalam.sebab === "tautan_langsung",
        "a deep-link arrival presents the tour; it waits for a landing arrival");
      const cepat = bolehTampilOtomatis(K({}), { ...bebas, ujiCepatBerjalan: true });
      c.expect(!cepat.boleh && cepat.sebab === "uji_cepat_berjalan",
        "a class waiting for a quick check is held up by onboarding");

      // 2. THE EXCLUSIONS ARE THE PAGE'S OWN INFORMATION, not a second question
      //    asked of the database — and the learner's one really is the learner's.
      const belajar = code(readFileSync(join(repoRoot, "src", "app", "belajar", "page.tsx"), "utf8"));
      c.expect(/ujiCepatBerjalan: terbuka\.some\(\(a\) => a\.mode === "QUICK"\)/.test(belajar),
        "the running-quick-assessment exclusion is not taken from what the page already shows");
      c.expect(/tautanLangsung: typeof sp\.lanjut === "string"/.test(belajar),
        "the learner landing does not recognise a deep-link arrival");
      const mengajar = code(readFileSync(join(repoRoot, "src", "app", "mengajar", "page.tsx"), "utf8"));
      c.expect(/ujiCepatBerjalan: false/.test(mengajar),
        "the educator landing borrows the learner's quick-assessment exclusion");

      // 3. THE TIP TELLS THE TRUTH, and the truth is the durable state's, not
      //    what the person just pressed. A replay closed with nothing ticked
      //    must not promise a return that a finish, a suppression or a spent
      //    cap has already ruled out.
      const bersih = { tampilOtomatis: 0, dicentang: false, selesai: false };
      c.expect(akanMunculLagi(K({}), bersih), "a skipped first presentation is said not to return");
      c.expect(!akanMunculLagi(K({ completed: true }), bersih),
        "a replay after finishing promises the tour will come back");
      c.expect(!akanMunculLagi(K({ suppressed: true }), bersih),
        "a replay after 'do not show again' promises the tour will come back");
      c.expect(!akanMunculLagi(K({ auto_shown_count: 2 }), { ...bersih, tampilOtomatis: 1 }),
        "the third automatic presentation still promises a fourth");
      c.expect(akanMunculLagi(K({ auto_shown_count: 1 }), { ...bersih, tampilOtomatis: 1 }),
        "the second of three presentations is said to be the last");
      c.expect(!akanMunculLagi(K({}), { ...bersih, dicentang: true }), "a ticked box still promises a return");
      c.expect(!akanMunculLagi(K({}), { ...bersih, selesai: true }), "finishing still promises a return");
      c.expect(!akanMunculLagi(null, bersih), "an unreadable state promises a return");
      // A limit of one is honoured as readily as three: the number is the row's.
      c.expect(!akanMunculLagi(K({ auto_presentation_limit: 1 }), { ...bersih, tampilOtomatis: 1 }),
        "a cap of one is not honoured; the cap is the database's, not the code's");

      c.expect(tipSetelahTutup({ akanMunculLagi: true, sd: false }) === "tur.tip.lagi",
        "a tour that will return does not say so");
      c.expect(tipSetelahTutup({ akanMunculLagi: true, sd: true }) === "tur.tip.lagi.sd",
        "a primary-school reader gets the adult sentence");
      c.expect(tipSetelahTutup({ akanMunculLagi: false, sd: false }) === "tur.tip.berhenti",
        "a tour that will not return promises one");
      c.expect(tipSetelahTutup({ akanMunculLagi: false, sd: true }) === "tur.tip.berhenti",
        "a primary-school reader is told the tour will return when it will not");

      // 4. CLOSING, AND WHAT EACH WAY OF CLOSING MEANS. Skip and Esc are the
      //    same act; reaching the last step and closing is finishing; the box
      //    takes effect however the card closes.
      const turSrc = code(readFileSync(join(repoRoot, "src", "components", "tur", "Tur.tsx"), "utf8"));
      c.expect(/const selesai = cara === "selesai" \|\| indeks === total - 1;/.test(turSrc),
        "closing on the last step is not treated as finishing");
      c.expect(/if \(e\.key === "Escape"\)[\s\S]{0,120}tutup\("lewati"\)/.test(turSrc),
        "Escape does not close the tour as a skip");
      c.expect(/if \(centang\) void bungkamTurAksi\(kunci\);/.test(turSrc),
        "the checkbox does not take effect when the card closes");
      // The checkbox is absent on the last step and on a replay: the first
      // because finishing already stops automatic presentation, the second
      // because a deliberate replay is not the moment to decide about being
      // interrupted.
      c.expect(/\{akhir \|\| replay \?/.test(turSrc),
        "the checkbox is offered on the last step or during a replay");
      // NO TIMEOUTS ANYWHERE. Nothing in the tour closes itself.
      const tutupSendiri = [...walk(join(repoRoot, "src", "components", "tur"))]
        .filter((f) => /\.tsx$/.test(f))
        .flatMap((f) => [...code(readFileSync(f, "utf8")).matchAll(/setTimeout\(([^;]*?)\)/g)]
          .map((m) => `${relative(repoRoot, f)}: ${m[0].slice(0, 80)}`))
        .filter((s) => /tutup|setAktif\(false\)|onTutup/.test(s));
      c.expect(tutupSendiri.length === 0, `something in the tour closes itself on a timer: ${tutupSendiri.join("; ")}`);

      // 5. THE CARD IS NEVER OVER THE THING IT IS DESCRIBING (§M).
      //
      // A rendered measurement at 1280x813 found it there, and the arithmetic
      // below is why: the scroll band asked only whether the target was VISIBLE.
      // A target can be perfectly visible and still leave no room to put the
      // card below it — and with a target too wide for the card to sit beside,
      // the placement fell through to centred, on top of its own subject.
      //
      // The geometry here is the one that was measured, not a constructed one.
      const layar: Layar = { lebar: 1280, tinggi: 813, atap: TEPI, telepon: false };
      const kartu = { lebar: 420, tinggi: 327 };
      /** The target as it was measured: visible, wide, and sitting too low. */
      const diukur: Petak = { top: 233, left: 284, width: 712, height: 298 };

      // (a) The band now subtracts the card's own height, so the scroll brings
      //     the target up far enough to leave room rather than merely on screen.
      const pita = pitaSasaran(layar, kartu.tinggi);
      c.expect(pita.bawah === 813 - 327 - JARAK - TEPI,
        `the wide-screen band is ${pita.bawah}; it must leave room for the card below the target`);
      c.expect(pitaSasaran({ ...layar, telepon: true }, kartu.tinggi).bawah === 813 - 327 - TEPI,
        "the phone band does not leave the docked sheet's height above it");
      const geser = geserKe(diukur, pita);
      c.expect(geser > 0, "the measured target is left where it was, with no room for the card below it");

      //     …and the page must HAVE that much scroll to give. A short page has
      //     none, which is how the browser measurement reproduced the overlap
      //     even after the band was fixed: the scroll was computed and then did
      //     nothing. The room is lent on both layouts, not only the phone.
      c.expect(ruangBawah(kartu.tinggi, false) === kartu.tinggi + JARAK,
        `a wide screen lends ${ruangBawah(kartu.tinggi, false)}px; the card needs its own height and its gap`);
      c.expect(ruangBawah(kartu.tinggi, true) === kartu.tinggi,
        "a phone lends more than the docked sheet's height");
      c.expect(ruangBawah(0, false) === 0 && ruangBawah(0, true) === 0,
        "the page is padded before the card has been measured");
      c.expect(ruangBawah(kartu.tinggi, false) >= geser,
        "the room lent is less than the scroll the measured target needs, so the scroll would do nothing");
      const turSrcPinjam = code(readFileSync(join(repoRoot, "src", "components", "tur", "Tur.tsx"), "utf8"));
      c.expect(/const pinjam = ruangBawah\(tinggiKartu, layar\.telepon\);/.test(turSrcPinjam),
        "the tour does not lend the page room from the one place that decides how much");
      c.expect(/document\.body\.style\.paddingBottom = ""/.test(turSrcPinjam),
        "the room the page lends is never given back");

      // (b) After that scroll the card goes BELOW the target, clear of it.
      const setelah: Petak = { ...diukur, top: diukur.top - geser };
      const tempat = tempatKartu(setelah, kartu, layar);
      const kotakKartu: Petak = { ...tempat, width: kartu.lebar, height: kartu.tinggi };
      c.expect(!bertumpuk(kotakKartu, setelah),
        `the card at ${JSON.stringify(tempat)} still covers the target at ${JSON.stringify(setelah)}`);
      c.expect(tempat.top >= setelah.top + setelah.height,
        "the card is not below the target it describes");

      // (c) THE CONTROL, which is the whole reason this is a test and not a
      //     comment: with the OLD band — the one that asked only whether the
      //     target was visible — the same placement puts the card over it.
      const pitaLama = { atas: TEPI, bawah: layar.tinggi - TEPI };
      const geserLama = geserKe(diukur, pitaLama);
      const lama: Petak = { ...diukur, top: diukur.top - geserLama };
      const tempatLama = tempatKartu(lama, kartu, layar);
      c.expect(
        bertumpuk({ ...tempatLama, width: kartu.lebar, height: kartu.tinggi }, lama),
        "the defect this check exists for no longer reproduces under the old band, so the check proves nothing",
      );

      // (d) The other three placements, each the case it is there for.
      const cukupRuang: Petak = { top: 120, left: 284, width: 712, height: 120 };
      c.expect(tempatKartu(cukupRuang, kartu, layar).top === 120 + 120 + JARAK,
        "a target with room below it does not get the card below it");
      const dibawah: Petak = { top: 420, left: 284, width: 300, height: 40 };
      const atas = tempatKartu(dibawah, kartu, layar);
      c.expect(atas.top === 420 - JARAK - kartu.tinggi, "a target with no room below does not get the card above it");
      // The tall target STRADDLES THE CENTRE on purpose: with a target off to
      // one side, a card that simply centred would clear it by accident, and
      // the check would pass while the beside branch was gone. Planting its
      // removal is what found that, so the geometry is chosen to discriminate.
      const tinggiSempit: Petak = { top: 20, left: 500, width: 300, height: 700 };
      const samping = tempatKartu(tinggiSempit, kartu, layar);
      c.expect(!bertumpuk({ ...samping, width: kartu.lebar, height: kartu.tinggi }, tinggiSempit),
        `a tall target straddling the centre gets the card on top of it: ${JSON.stringify(samping)}`);
      c.expect(samping.left >= tinggiSempit.left + tinggiSempit.width,
        "the card is not placed beside the tall target");
      // And the mirror: no room on the right, so it goes to the left.
      const kananPenuh: Petak = { top: 20, left: 480, width: 760, height: 700 };
      const kiriKartu = tempatKartu(kananPenuh, kartu, layar);
      c.expect(kiriKartu.left + kartu.lebar <= kananPenuh.left,
        `with no room on the right the card is not placed on the left: ${JSON.stringify(kiriKartu)}`);
      // No target at all: centred with the veil, which is §J-1 and not a defect.
      const tanpa = tempatKartu(null, kartu, layar);
      c.expect(tanpa.left === (1280 - 420) / 2, "a step with no target does not centre its card");
      // THE CEILING, on a viewport SHORT ENOUGH FOR IT TO BITE. On a tall one
      // the centred card already clears a banner by accident and the check
      // would pass with the ceiling gone — planting its removal is what found
      // that, so the viewport here is one where centring would breach it.
      const berbanner: Layar = { lebar: 1280, tinggi: 500, atap: 96, telepon: false };
      c.expect((berbanner.tinggi - kartu.tinggi) / 2 < berbanner.atap,
        "the ceiling fixture no longer bites, so it proves nothing");
      c.expect(tempatKartu(null, kartu, berbanner).top >= berbanner.atap,
        "the centred card ignores the ceiling Evaluation Mode's banner sets");
      c.expect(tempatKartu(tinggiSempit, kartu, berbanner).top >= berbanner.atap,
        "the card placed beside a target ignores the ceiling");

      c.note("5 presentation decision(s), 9 return predicate(s), 4 tip wording(s), 4 closing rule(s), " +
        "8 placement(s) including the measured overlap and its control");
      return c.verdict(
        "automatic presentation, replay and the after-closing tip agree with each other: the database's own refusal " +
        "is honoured and an unreadable state never opens the tour, the two Experience exclusions are named rather " +
        "than silent and are taken from what each page already shows, the tip's wording is decided from the durable " +
        "state — so a replay closed without ticking cannot promise a return that a finish, a suppression or a spent " +
        "cap has ruled out — the cap is the row's own number and a cap of one is honoured as readily as three, " +
        "skip and Escape are the same act, closing on the last step is finishing, nothing closes itself on a timer, " +
        "and the card is never over the target it describes — driven through the exact geometry a rendered " +
        "measurement found it there with, and watched to still reproduce under the band that caused it",
      );
    },
  },

  {
    id: "UX1-TUR-KATA-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const turKeys = allKeys().filter((k) => k.startsWith("tur.") || k === "nav.bantuan");
      c.expect(turKeys.length >= 89, `${turKeys.length} tour copy key(s); the design's four tours need more than that`);

      // 1. EVERY KEY THE TOUR RENDERS IS DECLARED, and every declared key has a
      //    real telling in both languages.
      const dipakai = new Set<string>();
      // WHICH ANCHORS A LANDING CAN LEGITIMATELY REPORT EMPTY — read from the
      // pages rather than listed here, so a new empty state cannot appear
      // without the step pointing at it gaining wording for it, and a step
      // cannot carry wording for an emptiness that never happens.
      const bisaKosong = new Set<string>();
      const anchorAda = new Set<string>();
      const surfaces = [
        ...walk(join(repoRoot, "src", "app")),
        ...walk(join(repoRoot, "src", "components")),
      ].filter((f) => /\.tsx$/.test(f));
      for (const f of surfaces) {
        const src = readFileSync(f, "utf8");
        for (const m of src.matchAll(/data-tur="([a-z]+)"/g)) anchorAda.add(m[1]);
        const i = src.indexOf("kosong={");
        if (i < 0) continue;
        let depth = 0, j = i + "kosong=".length;
        for (; j < src.length; j++) {
          if (src[j] === "{") depth++;
          else if (src[j] === "}" && --depth === 0) break;
        }
        for (const m of src.slice(i, j).matchAll(/"([a-z]+)"/g)) bisaKosong.add(m[1]);
      }
      c.expect(bisaKosong.size >= 4,
        `${bisaKosong.size} anchor(s) a landing can report empty; the two landings declare four between them`);

      for (const v of ["netral", "sd", "menengah", "pengajar"] as const) {
        const d = tur(v);
        dipakai.add(d.nama as string);
        for (const l of d.langkah) {
          dipakai.add(l.judul as string);
          dipakai.add(l.isi as string);
          if (l.kosong) dipakai.add(l.kosong as string);
          if (l.sasaran.jenis !== "anchor") {
            c.expect(!l.kosong, `${v} step ${l.posisi} draws a miniature and carries empty-state wording`);
            continue;
          }
          const nama = l.sasaran.nama;
          // The tour may not point at something that is not there: the anchor
          // has to exist on a real surface.
          c.expect(anchorAda.has(nama),
            `${v} step ${l.posisi} points at the anchor "${nama}", which no surface carries`);
          // The count stays seven when the thing the step describes is not
          // there yet, so a step whose target CAN be empty needs wording for it
          // — and a step whose target never is must not pretend otherwise.
          c.expect(bisaKosong.has(nama) === Boolean(l.kosong),
            bisaKosong.has(nama)
              ? `${v} step ${l.posisi} points at ${nama}, which a landing can report empty, with no wording for it`
              : `${v} step ${l.posisi} carries empty-state wording for ${nama}, which no landing ever reports empty`);
        }
      }
      for (const k of dipakai) {
        c.expect(turKeys.includes(k as HleEvent), `the tour renders ${k}, which the copy table does not declare`);
        for (const loc of LOCALES) {
          c.expect(t(k as HleEvent, "learner", { locale: loc }).trim().length > 0,
            `${k} has no telling in ${loc}`);
        }
      }
      for (const k of turKeys) {
        const both = LOCALES.map((loc) => t(k as HleEvent, "learner", { locale: loc }));
        c.expect(both.every((s) => s.trim().length > 0), `${k} is missing a telling`);
      }

      // 2. THE CANONICAL TERMS, AND THE ONES THE RULINGS RETIRED.
      const semua = turKeys.flatMap((k) =>
        LOCALES.flatMap((loc) => (["learner", "educator"] as const).map((p) => ({
          k, loc, p, text: t(k as HleEvent, p, { locale: loc }),
        }))));
      const TERLARANG: Array<[RegExp, string]> = [
        [/Kuis Cepat/, "the retired learner term for a Quick Assessment"],
        [/Mastery Test/, "the retired English name for Uji Penguasaan"],
        [/\bDRAFT\b|\bACTIVE\b|\bFINALIZED\b|\bPOST_TEST\b|\bPRE_TEST\b|\bQUICK\b/, "a lifecycle or mode enum"],
        [/can_on_node|has_scope|RLS|SECURITY DEFINER|role_assignments/, "a database word"],
      ];
      for (const r of semua) {
        for (const [re, apa] of TERLARANG) {
          c.expect(!re.test(r.text), `${r.k}/${r.loc}/${r.p} carries ${apa}: "${r.text.slice(0, 80)}"`);
        }
      }
      const gabung = semua.map((r) => r.text).join(" | ");
      for (const kata of ["Uji Cepat", "Quick Assessment", "Uji Penguasaan", "Mastery Check"]) {
        c.expect(gabung.includes(kata), `the canonical term "${kata}" appears in no tour telling`);
      }

      // 3. THE CERTIFICATE STEP DOES NOT PROMISE ONE (V-6a is still open). It
      //    may say where certificates live and that each can be checked; it may
      //    not say one is coming.
      for (const k of ["tur.nt.6.isi", "tur.sm.6.isi"] as const) {
        for (const loc of LOCALES) {
          const text = t(k, "learner", { locale: loc });
          const JANJI = /akan (menerima|mendapat|diberikan)|you will (get|receive|earn)|dapatkan sertifikat|earn a certificate/i;
          c.expect(!JANJI.test(text), `${k}/${loc} promises a certificate: "${text}"`);
        }
      }
      // And the educator's Quick Assessment step keeps the QUICK ruling's
      // sentence: the result is evidence, and one quick check is not a
      // certificate.
      const pg4 = LOCALES.map((loc) => t("tur.pg.4.isi", "educator", { locale: loc }));
      c.expect(pg4.every((s) => /bukti belajar|learning evidence/i.test(s)),
        "the educator's Quick Assessment step no longer says the result becomes evidence");
      c.expect(pg4.every((s) => /tidak menerbitkan sertifikat|does not issue a certificate/i.test(s)),
        "the educator's Quick Assessment step no longer says one quick check is not a certificate");

      // 4. THE TEACHING CONTEXT IS NAMED, AND NEITHER VISIBILITY NOR AUTHORITY
      //    IS CLAIMED (§D-1, §D-2, and the ruling that superseded the r2 text).
      const lingkup = [t("tur.pg.1.isi", "educator", { locale: "id" }), t("tur.pg.2.judul", "educator", { locale: "id" })];
      const lingkupEn = [t("tur.pg.1.isi", "educator", { locale: "en" }), t("tur.pg.2.judul", "educator", { locale: "en" })];
      c.expect(lingkup.every((s) => /lingkup mengajar/.test(s)),
        "the educator's context wording no longer names the teaching scope");
      c.expect(lingkupEn.every((s) => /teaching context/.test(s)),
        "the educator's English context wording no longer names the teaching context");
      const KLAIM = /bisa Anda lihat|you (can|may) see|boleh Anda|you are allowed|izin|permission|akses/i;
      for (const s of [...lingkup, ...lingkupEn]) {
        c.expect(!KLAIM.test(s), `the educator's context wording claims visibility or authority: "${s}"`);
      }

      // 5. THE COUNTS ARE COUNTS. The educator's "what's open now" step must
      //    keep saying so, because the numbers beside it are row counts.
      const pg3 = LOCALES.map((loc) => t("tur.pg.3.isi", "educator", { locale: loc }));
      c.expect(pg3.every((s) => /hitungan, bukan penilaian|counts, not judgments/i.test(s)),
        "the educator's running-assessments step no longer says the numbers are counts");

      // 6. NOBODY IS ADDRESSED INFORMALLY, in either persona. The Slice-0 sweep
      //    covers learner and public tellings; the educator's are only covered
      //    here, and the tour has plenty of them.
      for (const r of semua) {
        if (r.loc !== "id") continue;
        const hits = informal(r.text);
        c.expect(hits.length === 0,
          `${r.k}/${r.p} addresses the reader informally (${hits.join(", ")}): "${r.text.slice(0, 80)}"`);
      }

      // ADVERSARIAL PLANTS: both sweeps must see what they forbid.
      const palsu = "Kuis Cepat dari guru muncul di sini.";
      c.expect(TERLARANG.some(([re]) => re.test(palsu)), "the retired-term sweep does not catch Kuis Cepat");
      c.expect(informal("Jawabanmu tersimpan.").length === 1, "the informality sweep does not catch a clitic");
      c.expect(informal("Ilmu yang Anda ajarkan.").length === 0, "the informality sweep calls `ilmu` a clitic");

      c.note(`${turKeys.length} tour key(s), ${dipakai.size} rendered, ${semua.length} telling(s) swept, ` +
        `${bisaKosong.size} empty-capable anchor(s) and ${anchorAda.size} anchor(s) read from the surfaces, 3 plants`);
      return c.verdict(
        "the tour's copy is the approved copy, complete and clean: every key the four tours render is declared and " +
        "carries a real telling in both languages, every anchor a step points at exists on a real surface, and a step " +
        "carries empty-state wording exactly when the landing it points at can report that anchor empty — both read " +
        "from the pages rather than listed — no telling in either language for either persona uses a retired term, an " +
        "informal second person or a database word — every sweep watched on a plant, including one the clitic rule " +
        "must NOT fire on — the canonical Uji Cepat, Quick " +
        "Assessment, Uji Penguasaan and Mastery Check all appear, the certificate step promises nothing while V-6a " +
        "is open, the Quick Assessment step keeps the ruling's evidence sentence, the educator's context wording " +
        "names a teaching context and claims neither visibility nor authority, and the counts are still called counts",
      );
    },
  },

  {
    id: "UX1-TUR-AKSES-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const dir = join(repoRoot, "src", "components", "tur");
      const turSrc = readFileSync(join(dir, "Tur.tsx"), "utf8");
      const kartu = code(turSrc);

      // 1. IT IS A DIALOG, AND IT SAYS SO.
      for (const [re, apa] of [
        [/role="dialog"/, "role=dialog"],
        [/aria-modal="true"/, "aria-modal"],
        [/aria-labelledby="pin-tur-judul"/, "a label pointing at the headline"],
        [/aria-describedby="pin-tur-isi"/, "a description pointing at the body"],
      ] as Array<[RegExp, string]>) {
        c.expect(re.test(kartu), `the tour card has no ${apa}`);
      }

      // 2. THE PAGE BEHIND IS INERT, AND GETS ITSELF BACK. An attribute that is
      //    set and never removed is a page nobody can use again.
      c.expect(/setAttribute\("inert", ""\)/.test(kartu), "the page behind the tour is never made inert");
      c.expect(/removeAttribute\("inert"\)/.test(kartu), "the page behind the tour never gets its interactivity back");
      c.expect(/if \(saudara === simpul \|\| saudara\.hasAttribute\("inert"\)\) continue;/.test(kartu),
        "the inert sweep does not skip the tour's own root, or clobbers an element that was already inert");
      // What was there before is RESTORED, not removed: an element that carried
      // `aria-hidden` for a reason of its own gets that reason back, and only an
      // element that had none loses it.
      c.expect(/getAttribute\("aria-hidden"\)/.test(kartu),
        "the sweep never records what aria-hidden it is about to overwrite");
      c.expect(/if \(sembunyi === null\) el\.removeAttribute\("aria-hidden"\);[\s\S]{0,80}else el\.setAttribute\("aria-hidden", sembunyi\);/.test(kartu),
        "the sweep gives back no aria-hidden it overwrote, so an element that had one loses it");

      // 3. FOCUS. On open and on every step it lands on the headline, so the
      //    step is read in the order it is written.
      c.expect(/judulRef\.current\?\.focus\(\)/.test(kartu), "focus never moves to the step's headline");
      c.expect(/\}, \[aktif, indeks\]\);/.test(kartu), "focus does not follow the step");
      c.expect(/tabIndex=\{-1\}/.test(kartu), "the headline cannot receive focus");
      // A heading is not focusable by default, so `focus()` on one is a call
      // that quietly does nothing and drops the reader at the top of the
      // document. It is made focusable-by-script first.
      c.expect(/document\.querySelector\("main h1"\)/.test(kartu),
        "focus has nowhere to go after a tour that arrived uninvited");
      c.expect(/judulHalaman\.tabIndex = -1;[\s\S]{0,60}judulHalaman\.focus\(\);/.test(kartu),
        "the page heading is focused without being made focusable, so the call does nothing");

      // 4. TAB ORDER IS DOM ORDER: language, Skip, checkbox, Back, Next.
      //    Nothing is given a tabindex to force it, so the order the reader
      //    gets is the order the card is written in — which is the only kind
      //    that survives somebody editing the card.
      const urutan = ["bahasa.en", "tur.lewati", "tur.jangan", "tur.kembali", "tur.berikutnya"];
      /** Whether these markers appear in this text in this order. */
      function berurutan(teks: string, kunci: string[]): boolean {
        let sebelum = -1;
        for (const k of kunci) {
          const p = teks.indexOf(k);
          if (p <= sebelum) return false;
          sebelum = p;
        }
        return true;
      }
      c.expect(berurutan(kartu, urutan),
        `the tour card is not written in the approved tab order: ${urutan.join(" → ")}`);
      c.expect(!/tabIndex=\{[0-9]/.test(kartu), "a control is given a positive tabindex to force its place");
      // ADVERSARIAL PLANT: the same reading, on a card whose footer puts the
      // checkbox after the buttons, must refuse it.
      const benar = 'a {s("bahasa.en")} b {s("tur.lewati")} c {s("tur.jangan")} d {s("tur.kembali")} e {s("tur.berikutnya")}';
      const ditanam = 'a {s("bahasa.en")} b {s("tur.lewati")} c {s("tur.kembali")} d {s("tur.berikutnya")} e {s("tur.jangan")}';
      c.expect(berurutan(benar, urutan), "the tab-order reading refuses a card that is in order");
      c.expect(!berurutan(ditanam, urutan), "the tab-order reading accepts a checkbox moved after the buttons");

      // 5. EVERY CONTROL IS NATIVE, AND THE WAY OUT IS IN WORDS.
      const semuaTur = walk(dir).filter((f) => /\.tsx$/.test(f));
      for (const f of semuaTur) {
        const rel = relative(repoRoot, f).replace(/\\/g, "/");
        const src = code(readFileSync(f, "utf8"));
        const palsu = /<div[^>]*onClick|<span[^>]*onClick|role="button"/.exec(src);
        c.expect(palsu === null, `${rel} makes a control out of something that is not one: ${palsu?.[0]}`);
        for (const m of src.matchAll(/<button\b([^>]*)>/g)) {
          c.expect(/type="button"|type="submit"/.test(m[1]), `${rel} has a button with no explicit type`);
        }
      }
      c.expect(/\{s\("tur\.lewati"\)\}/.test(kartu), "the way out of the tour is not labelled in words");
      const panel = code(readFileSync(join(dir, "PanelBantuan.tsx"), "utf8"));
      c.expect(/\{s\("tur\.tutup"\)\}/.test(panel), "the way out of the Help panel is not labelled in words");
      // AND FOCUS COMES BACK. A panel that closes and leaves focus nowhere
      // drops a keyboard reader at the top of the document, and so does a
      // replay started from a panel row that then stops existing.
      c.expect(/return \(\) => \{[\s\S]{0,200}data-tur="bantuan"[\s\S]{0,120}\.focus\(\)/.test(panel),
        "closing the Help panel leaves focus nowhere");
      c.expect(/sebelumnya\.current = document\.querySelector\('\[data-tur="bantuan"\]'\)/.test(kartu),
        "a replay started from Help has nowhere to return focus to when the tour closes");

      // 6. PROGRESS IS ANNOUNCED IN WORDS; the dots are a picture of it.
      c.expect(/className="pin-sr"[\s\S]{0,200}tur\.langkah[\s\S]{0,120}tur\.dari/.test(kartu),
        "the step number is not announced as words");
      c.expect(/className="pin-tur-titik" aria-hidden="true"/.test(kartu), "the position dots are not hidden from a screen reader");
      c.expect(/className="pin-num pin-tur-hitung" aria-hidden="true"/.test(kartu),
        "the visible count is announced a second time");

      // 7. MINIATURES CARRY NO MEANING OF THEIR OWN, so they are hidden and
      //    carry no words that a reader could be asked to rely on.
      const mini = readFileSync(join(dir, "Miniatur.tsx"), "utf8");
      c.expect(/aria-hidden="true"/.test(mini), "the miniatures are not hidden from a screen reader");
      const kunciMini = [...code(mini).matchAll(/\bt\(\s*"([^"]+)"/g)].map((m) => m[1]);
      c.expect(kunciMini.length === 1 && kunciMini[0] === "tur.contoh",
        `the miniature frame renders ${kunciMini.length} copy key(s); it is labelled "Contoh / Example" and nothing else`);
      // A MINIATURE CARRIES NO WORDS OF ITS OWN. Everything it draws is
      // geometry, because anything it said would be either a real person's data
      // or a sentence nobody approved — the design's 132 strings do not include
      // one. Checked by classifying EVERY string literal in the file: a class
      // list, one of the declared kinds, or the three arguments the one copy
      // call takes. Anything else is copy somebody added.
      const KIND = ["spine", "peta", "soal", "pelajaran", "hasil", "cepat", "sedia", "bukti"];
      const SAH = new Set(["use client", "tur.contoh", "learner", "true", ...KIND]);
      const asing = [...code(mini).matchAll(/"([^"]*)"/g)]
        .map((m) => m[1])
        .filter((v) => !SAH.has(v) && !/^pin-[a-z-]+( pin-[a-z-]+)*$/.test(v) && !v.startsWith("@/"));
      c.expect(asing.length === 0, `a miniature carries words of its own: ${asing.join(" / ")}`);
      // ADVERSARIAL PLANT: the classifier must not wave through a sentence.
      const ditanamMini = ['"pin-mini-bar"', '"Pemetaan Awal bukan ujian."'].map((q) => q.slice(1, -1))
        .filter((v) => !SAH.has(v) && !/^pin-[a-z-]+( pin-[a-z-]+)*$/.test(v));
      c.expect(ditanamMini.length === 1, "the miniature classifier does not catch a planted sentence");

      c.note(`${semuaTur.length} tour component(s), ${urutan.length} control(s) in tab order, ` +
        `${kunciMini.length} copy key in the miniatures, 3 plants`);
      return c.verdict(
        "the tour is a dialog a keyboard and a screen reader can use: it declares role, modality, its label and its " +
        "description, the page behind it is made inert and gets both inert and aria-hidden back, focus lands on the " +
        "headline on open and follows every step and has somewhere to go on close, the DOM gives the approved tab " +
        "order of language, Skip, checkbox, Back and Next with no tabindex forcing it — the reading watched on a card " +
        "whose footer puts the checkbox last — every control is a native button with an explicit type and no div " +
        "pretending to be one, both ways out are labelled in words, the step number is announced as words while the " +
        "dots and the visible count are hidden, and the miniatures are hidden and every string literal in them is a " +
        "class list, a declared kind or the frame's own label, with a planted sentence watched to be caught",
      );
    },
  },

  {
    id: "UX1-TUR-TUNTUN-01",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const css = readFileSync(join(repoRoot, "src", "app", "experience.css"), "utf8");
      const mulai = css.indexOf("UX-1 · GUIDANCE MODE");
      c.expect(mulai > 0, "the guidance stylesheet is not in the Experience composition");
      const blok = css.slice(mulai);
      const aturan = [...blok.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));
      c.expect(aturan.length > 30, `only ${aturan.length} guidance rule(s); the surface is bigger than that`);

      // 1. GUIDANCE MODE IS EXACTLY TWO STATES, and the environment it paints
      //    is reached only through them. Sauron's ruling reserves the colour
      //    away from success, correctness, evidence and authorization, so the
      //    one rule that repaints the page must be behind the mode's own class.
      const ground = aturan.filter((r) => /background:\s*var\(--pintar-primary-soft\)/.test(r.body));
      for (const r of ground) {
        const sah = /\.pin-tuntun\b/.test(r.sel) || /\.pin-bantuan\b/.test(r.sel) || /\.pin-mini-pilih\b/.test(r.sel);
        c.expect(sah, `${r.sel} paints the guidance ground outside a tour, Help or a selection`);
      }
      c.expect(ground.some((r) => /html\.pin-tuntun body/.test(r.sel)),
        "nothing repaints the page canvas when the mode is on");
      const turSrc = code(readFileSync(join(repoRoot, "src", "components", "tur", "Tur.tsx"), "utf8"));
      c.expect(/if \(!aktif && !bantuan\) return;[\s\S]{0,200}classList\.add\("pin-tuntun"\)/.test(turSrc),
        "the guidance class is applied outside the two states that are the mode");
      c.expect(/classList\.remove\("pin-tuntun"\)/.test(turSrc), "the guidance class is never taken off again");

      // 2. THE MODE IS NEVER A STATUS. No status token appears anywhere in the
      //    guidance surface: not for a result, not for a correct answer, not
      //    for evidence being sufficient, not for permission.
      for (const r of aturan) {
        const m = /var\(--status-[a-z-]+\)/.exec(r.body);
        c.expect(m === null, `${r.sel} carries a status colour inside instruction: ${m?.[0]}`);
      }
      // ADVERSARIAL PLANT: the sweep must catch one.
      c.expect(/var\(--status-[a-z-]+\)/.test("background: var(--status-ok-soft);"),
        "the status-colour sweep does not catch a status token");

      // 3. THE TIP IS NOT THE MODE (§O-5). One white card on the page exactly
      //    as it was: no soft green, no veil, no repainted ground.
      const tip = aturan.filter((r) => /^\.pin-tip/.test(r.sel));
      c.expect(tip.length >= 2, "the tip has no rules of its own");
      for (const r of tip) {
        c.expect(!/primary-soft/.test(r.body), `${r.sel} paints the tip with the guidance colour`);
      }

      // 4. THE HIGHLIGHT IS A CUT-OUT PLUS A RING, and the ring's geometry is
      //    the approved one: 3px of white, then 2px of primary (§K-5).
      const sorot = aturan.find((r) => r.sel.includes(".pin-tur-sorot"));
      c.expect(Boolean(sorot), "the spotlight has no rule");
      const bayang = /box-shadow:([^;]*);/.exec(sorot?.body ?? "")?.[1] ?? "";
      c.expect(/0 0 0 3px var\(--surface-1\)/.test(bayang), "the spotlight has no 3px white gap");
      c.expect(/0 0 0 5px var\(--pintar-primary\)/.test(bayang),
        "the spotlight's primary ring is not 2px outside the white gap");
      c.expect(/color-mix\(in srgb, var\(--pintar-primary-soft\) 72%, transparent\)/.test(bayang),
        "the veil is not the ruled composite of primary-soft");
      c.expect(/pointer-events:\s*none/.test(sorot?.body ?? ""), "the spotlight swallows pointer events");

      // 5. THE PHONE SHEET IS CAPPED AND SCROLLS; nothing truncates and type
      //    never shrinks (§J-15, §K-8).
      const telepon = blok.slice(blok.indexOf("@media (max-width: 560px)"));
      c.expect(/max-height:\s*var\(--guide-sheet-max\)/.test(telepon), "the phone sheet has no ceiling");
      c.expect(/overflow:\s*auto/.test(telepon), "the phone sheet does not scroll its own content");
      c.expect(/\.pin-tur-kaki \{ position: sticky/.test(telepon), "the phone sheet's buttons are not pinned");
      c.expect(!/text-overflow|ellipsis/.test(blok), "something in the guidance surface truncates its text");
      // The room the sheet borrows is given back.
      c.expect(/document\.body\.style\.paddingBottom = ""/.test(turSrc),
        "the room the phone sheet borrows at the bottom of the page is never returned");

      // 6. THE CARD NEVER COVERS EVALUATION MODE'S BANNER (§J-11). The banner
      //    is a property of the session and cannot be dismissed (ADR-0020), so
      //    a card placed over it would be hiding the one thing that says who
      //    the reader is currently acting as. It is a closed surface this work
      //    may not mark, so the ceiling is found by position — and the check
      //    confirms the assumption that makes that work: the banner really is
      //    rendered above the Experience shell, in the root layout.
      c.expect(/function atap\(\)/.test(turSrc), "the tour card has no ceiling to keep clear of");
      c.expect(/header\.pin-top"\);[\s\S]{0,120}previousElementSibling/.test(turSrc),
        "the ceiling is not taken from whatever renders above the Experience shell");
      const layout = code(readFileSync(join(repoRoot, "src", "app", "layout.tsx"), "utf8"));
      const urutanLayout = layout.indexOf("<EvaluationBanner />") < layout.indexOf("{children}");
      c.expect(layout.includes("<EvaluationBanner />") && urutanLayout,
        "the evaluation banner no longer renders above the page, so the ceiling looks at the wrong element");
      const banner = code(readFileSync(join(repoRoot, "src", "app", "_evaluation-banner.tsx"), "utf8"));
      c.expect(!/position:\s*fixed|\bfixed\b/.test(banner),
        "the evaluation banner is now fixed, and a ceiling measured from the flow would be wrong");

      // 7. NOTHING ANIMATES MEANING, and the one movement there is respects the
      //    reader's own setting.
      c.expect(!/transition:|animation:/.test(blok), "something in the guidance surface animates");
      c.expect(/prefers-reduced-motion: reduce/.test(turSrc),
        "the tour's scrolling ignores a reader who asked for no motion");

      c.note(`${aturan.length} guidance rule(s), ${ground.length} ground(s), ${tip.length} tip rule(s), 1 plant caught`);
      return c.verdict(
        "Guidance Mode is exactly the two states Sauron ruled it to be: the class that repaints the page is applied " +
        "only while a tour is running or Help is open and is always taken off again, the guidance ground appears on " +
        "no other rule, no status colour appears anywhere inside instruction — the sweep watched on a plant — the " +
        "tip carries none of the mode at all, the highlight is a cut-out with the approved 3px white gap and 2px " +
        "primary ring over the ruled composite veil, the phone sheet is capped and scrolls with its buttons pinned " +
        "and gives back the room it borrows, the card keeps clear of whatever renders above the Experience shell so " +
        "it cannot cover Evaluation Mode's non-dismissible banner — with the layout and the banner both read to " +
        "confirm the assumption that makes that ceiling correct — and nothing animates",
      );
    },
  },
];
