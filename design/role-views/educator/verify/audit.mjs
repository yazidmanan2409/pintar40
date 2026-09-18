// Educator role view — content audit.
//
// The claims this view makes about itself are checkable, so they are
// checked: that the doctrine chain is complete on every card, that nothing
// on the page ranks a person or manufactures urgency, that the strings
// borrowed from the product are still the product's strings, and that the
// sixty seconds it promises is a measurement rather than a hope.
//
// Run: node verify/audit.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FRAME, SAMPLE, CHAIN, CARDS, QUIET, UI } from "../content.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..", "..");

const fails = [];
const fail = (what, detail = "") => fails.push(`${what}${detail ? " — " + detail : ""}`);
let checks = 0;
const ok = () => { checks += 1; };

const isPair = (v) => v && typeof v === "object"
  && typeof v.id === "string" && typeof v.en === "string";

function pairs(value, path, out = []) {
  if (isPair(value)) { out.push([path, value]); return out; }
  if (Array.isArray(value)) { value.forEach((v, i) => pairs(v, `${path}[${i}]`, out)); return out; }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === "function") continue;
      pairs(v, `${path}.${k}`, out);
    }
  }
  return out;
}

const ALL = pairs({ FRAME, SAMPLE, CHAIN, CARDS, QUIET, UI }, "view");

for (const [path, p] of ALL) {
  if (!p.id.trim()) fail("empty ID side", path);
  else if (!p.en.trim()) fail("empty EN side", path);
  else ok();
}

// ------------------------------------------------------- the chain is whole
//
// The doctrine is what happened → what the evidence supports → what remains
// uncertain → a possible next action → a human decision. A card missing any
// part is not a shorter card, it is a different claim.

for (const c of CARDS) {
  for (const field of ["kind", "subject", "since", "happened", "supports", "unknown", "step"]) {
    if (!isPair(c[field]) || !c[field].id.trim()) fail(`card without ${field}`, c.id);
    else ok();
  }
  if (!Array.isArray(c.actions) || c.actions.length < 2)
    fail("card offers fewer than two next steps — one option is an instruction", c.id);
  else ok();

  // Every card offers a way to decide it needed nothing. Without one the
  // row is a set of orders with no way to refuse, and "PINTAR proposes, the
  // educator decides" stops being true of the interface.
  //
  // PRESENCE, not position: this rule first demanded the refusal be last,
  // and the integrity card failed it because the database's own decision
  // set puts "nothing to follow up" first — which is better doctrine, not
  // worse. The rule was wrong, not the card.
  const REFUSALS = [
    "tidak ada yang perlu ditindaklanjuti", "tidak perlu ditindaklanjuti",
    "belum, nanti", "nothing to follow up", "not yet",
  ];
  for (const side of ["id", "en"]) {
    if (!c.actions.some((a) => REFUSALS.includes(a[side].toLowerCase().trim())))
      fail("no option on this card lets the educator decide it needed nothing",
        `${c.id}.${side}: ${c.actions.map((a) => a[side]).join(" / ")}`);
    else ok();
  }

  // An uncertainty line that has been hedged down to nothing is the
  // overclaim wearing the chain's clothes.
  for (const side of ["id", "en"]) {
    if (c.unknown[side].trim().split(/\s+/).length < 6)
      fail("the uncertainty line is too short to say anything", `${c.id}.${side}`);
    else ok();
  }
}

// -------------------------------------------------------- what may not appear

// Phrases that are allowed to contain a banned word because they REFUSE it.
const NEGATIONS = [
  "bukan peringkat", "not a ranking", "bukan kesimpulan tentang siswa",
  "not a conclusion about the student", "belum cukup", "not enough", "not yet enough",
  "tidak lebih dari itu", "nothing beyond that",
  // A term of art, not urgency: `is_safety_critical` and
  // `safety_critical_minimum` are columns. Stripped in its hyphenated form
  // only, so a bare "critical" still fails.
  "safety-critical",
];

// No manufactured urgency. Including the exclamation mark, which is the
// cheapest way to manufacture it.
const URGENCY = [
  "segera", "mendesak", "urgent", "immediately", "right away", "terlambat",
  "overdue", "critical", "kritis", "darurat", "act now", "sekarang juga",
];

// No rankings, and no ordering of people at all.
const RANKING = [
  "peringkat", "ranking", "rank ", "top 5", "top five", "terbaik", "terburuk",
  "paling lemah", "paling pandai", "weakest", "strongest student", "leaderboard",
];

// No people traffic lights.
const TRAFFIC = [
  "berisiko", "at risk", "at-risk", "zona merah", "red zone", "lampu kuning",
  "flagged student", "siswa bermasalah", "problem student", "amber", "green light",
];

// No conclusion stronger than the evidence.
const OVERCLAIM = [
  "terbukti", "pasti ", "sudah jelas", "membuktikan", "proves", "clearly shows",
  "demonstrates that the student", "is failing", "tidak mampu", "tidak bisa memahami",
];

for (const [path, p] of ALL) {
  for (const side of ["id", "en"]) {
    let text = p[side].toLowerCase();
    for (const n of NEGATIONS) text = text.split(n).join(" ");

    if (p[side].includes("!")) fail("an exclamation mark manufactures urgency", `${path}.${side}`);
    else ok();

    for (const [label, list] of [
      ["urgency", URGENCY], ["ranking", RANKING],
      ["a traffic light on a person", TRAFFIC], ["overclaim", OVERCLAIM],
    ]) {
      for (const w of list) {
        if (text.includes(w)) fail(`${label} ("${w}")`, `${path}.${side}`);
        else ok();
      }
    }
  }
}

// ------------------------------------------- the borrowed strings are still theirs
//
// Where this view uses PINTAR's own wording it must be PINTAR's own wording.
// Read it out of src/lib/hle.ts rather than trusting the comment that says
// so: if either side is edited, this fails, which is the only way a claim
// of "verbatim" survives contact with time.

const hle = readFileSync(join(REPO, "src", "lib", "hle.ts"), "utf8");
const VERBATIM = [
  ["studio.bucket.BLOCKED", CARDS[0].kind.id],
  ["studio.bucket.ACTION_REQUIRED", CARDS[1].kind.id],
  ["studio.integritas.NO_CONCERN", CARDS[1].actions[0].id],
  ["studio.integritas.DISCUSSED_WITH_LEARNER", CARDS[1].actions[1].id],
  ["studio.integritas.REFERRED_TO_INSTITUTION", CARDS[1].actions[2].id],
];
for (const [key, used] of VERBATIM) {
  const m = hle.match(new RegExp(`"${key.replace(/\./g, "\\.")}":\\s*\\{\\s*default:\\s*"([^"]+)"`));
  if (!m) fail("the product string this view quotes was not found", key);
  else if (m[1] !== used)
    fail(`this view no longer quotes ${key} verbatim`, `product: "${m[1]}" / view: "${used}"`);
  else ok();
}
// The safety-critical concept is named with the product's noun. hle.ts
// says "butir penting" to a learner; an educator surface that invented a
// second phrase for the same thing would be the start of two vocabularies.
if (!hle.includes("butir penting"))
  fail("the product no longer uses the term this view borrows", "butir penting");
else if (!CARDS[0].happened.id.includes("butir penting"))
  fail("the held-certificate card no longer uses the product's term", "butir penting");
else ok();

// The integrity explainer is quoted inside a longer sentence.
const expl = hle.match(/"studio\.integritas\.penjelasan":\s*\{\s*default:\s*"([^"]+)"/);
if (!expl) fail("the integrity explainer was not found in hle.ts", "studio.integritas.penjelasan");
else if (!CARDS[1].unknown.id.includes(expl[1]))
  fail("the integrity card no longer carries the product's explainer verbatim", expl[1]);
else ok();

// The three decisions this view offers are the only three the database
// accepts. `record_integrity_review` refuses anything else, and an
// interface that offered a fourth would be offering something that cannot
// be recorded.
const sql = readFileSync(
  join(REPO, "supabase", "migrations", "20260915160000_studio_surfaces.sql"), "utf8");
const allowed = sql.match(/p_decision not in \(([^)]+)\)/);
if (!allowed) fail("could not find the accepted integrity decisions in the migration", "");
else {
  const names = allowed[1].split(",").map((x) => x.trim().replace(/'/g, ""));
  if (names.length !== CARDS[1].actions.length)
    fail("the integrity card offers a different number of decisions than the database accepts",
      `${CARDS[1].actions.length} offered, ${names.length} accepted: ${names.join(", ")}`);
  else ok();
}

// ------------------------------------------------- it says what it is
//
// Representative demo data, labelled clearly as such, and no implication
// that an unbuilt surface is production.

for (const side of ["id", "en"]) {
  const banner = `${SAMPLE.label[side]} ${SAMPLE.body[side]}`.toLowerCase();
  const says = ["belum dibangun", "not built"].some((x) => banner.includes(x));
  if (!says) fail("the banner does not say the view is not built", side);
  else ok();
  const notReal = ["bukan data sekolah", "from no school"].some((x) => banner.includes(x));
  if (!notReal) fail("the banner does not say the data is not a school's", side);
  else ok();
}

// ------------------------------------------------------ the sixty seconds
//
// Measured, not asserted — the same discipline as M1 §3.7, where the
// asserted figure turned out to be wrong by half. 200 wpm is a fluent adult
// reading structured prose on a work surface.
//
// The claim being tested is the brief's: within about sixty seconds the
// person knows what deserves their attention and what to do next. That is
// NOT reading every word of every card. It is the frame, plus every card's
// one-line "what happened", plus reading one card in full — because a card
// you are not going to act on is one line, and the one you are is five.

const WPM = 200;
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const secs = (n) => (n / WPM) * 60;

const report = {};
for (const side of ["id", "en"]) {
  const frame = [FRAME.question, FRAME.suppression, FRAME.order, FRAME.decides]
    .reduce((a, p) => a + words(p[side]), 0);
  const headlines = CARDS.reduce((a, c) => a + words(c.kind[side]) + words(c.happened[side]), 0);
  const quiet = QUIET.lines.reduce((a, l) => a + words(l[side]), 0) + words(QUIET.label[side]);

  const perCard = CARDS.map((c) => [c.supports, c.unknown, c.step]
    .reduce((a, p) => a + words(p[side]), 0)
    + c.actions.reduce((a, p) => a + words(p[side]), 0) + words(CHAIN.decision[side]));
  const worstCard = Math.max(...perCard);

  const orient = frame + headlines;
  const toAct = orient + worstCard;
  const everything = orient + quiet + perCard.reduce((a, b) => a + b, 0);

  report[side] = {
    orientation: Math.round(secs(orient)),
    toDecideOnOne: Math.round(secs(toAct)),
    readEverything: Math.round(secs(everything)),
  };

  if (secs(orient) > 35)
    fail(`orientation takes ${Math.round(secs(orient))}s — the first pass is too long`, side);
  else ok();
  if (secs(toAct) > 60)
    fail(`knowing what deserves attention and reading one card takes ${Math.round(secs(toAct))}s`,
      `${side} — over the sixty seconds this view promises`);
  else ok();
}

// --------------------------------------------------------------- report

if (fails.length) {
  console.error(`\naudit FAILED — ${fails.length} problem(s), ${checks} checks passed\n`);
  for (const f of fails) console.error("  " + f);
  process.exit(1);
}
console.log(`audit OK — ${checks} checks, ${ALL.length} string pairs, ${CARDS.length} cards`);
for (const side of ["id", "en"]) {
  const r = report[side];
  console.log(`  ${side.toUpperCase()} at ${WPM} wpm: orientation ${r.orientation}s · ` +
    `orientation + one card in full ${r.toDecideOnOne}s · every word on the page ${r.readEverything}s`);
}
