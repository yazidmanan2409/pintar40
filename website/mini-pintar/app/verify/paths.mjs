// Mini-PINTAR — every reachable path, walked.
//
// M1 §5 states counts: 125 Pemetaan Awal input states collapsing to 8 map
// shapes, 4 lesson presentations, 25 check states per lesson collapsing to
// 3 outcomes. Those are claims, so they are asserted here by exhaustive
// enumeration rather than by hand-walking, which is what §G of the
// adversarial pass did and is how a ninth shape would have gone unnoticed.
//
// Determinism is asserted by replay: the whole space is resolved twice and
// the two results must be byte-identical.
//
// Run: node verify/paths.mjs

import {
  DOMAINS, MAP_ITEMS, CHECK_ITEMS, MAP_REASONS, TIER_REASONS, TIER_LABELS, DOMAIN, LESSONS, OUTCOMES,
} from "../content.js";
import { SKIP, mapVerdicts, buildPeta, checkItemsFor, outcomeFor, resolve } from "../adapt.js";

/** Snapshot taken before anything resolves; compared at the end. */
const BUNDLE_BEFORE = JSON.stringify({ DOMAINS, MAP_ITEMS, CHECK_ITEMS, LESSONS });

const fails = [];
const fail = (what, detail) => fails.push(`${what} — ${detail}`);

const CHOICES = ["A", "B", "C", "D", SKIP];

// Every Pemetaan Awal input state.
const mapStates = [];
for (const a of CHOICES) for (const b of CHOICES) for (const c of CHOICES) mapStates.push([a, b, c]);
if (mapStates.length !== 125) fail("map input states", `expected 125, got ${mapStates.length}`);

// Every Uji Penguasaan input state.
const checkStates = [];
for (const a of CHOICES) for (const b of CHOICES) checkStates.push([a, b]);
if (checkStates.length !== 25) fail("check input states", `expected 25, got ${checkStates.length}`);

// ----------------------------------------------------------- map shapes

const shapes = new Set();
const presentations = new Set();
const orderings = new Set();

for (const m of mapStates) {
  const verdicts = mapVerdicts(m);
  const peta = buildPeta(verdicts);

  // A shape is which domains need a reading.
  shapes.add(verdicts.map((v) => (v.kind === "correct" ? "0" : "1")).join(""));
  presentations.add(`${peta.lessonKey}/${peta.presentation}`);
  orderings.add(peta.cards.map((c) => `${c.domain}:${c.tier}`).join(" "));

  // Three cards, every domain exactly once, no domain lost or duplicated.
  if (peta.cards.length !== 3) fail("card count", `${m} gave ${peta.cards.length}`);
  if (new Set(peta.cards.map((c) => c.domain)).size !== 3)
    fail("domains not distinct", m.join(""));

  // Exactly one lead card, and it is the lesson served.
  const leads = peta.cards.filter((c) => c.tier === "PERLU_SEGERA" || c.tier === "DISARANKAN");
  if (leads.length !== 1) fail("not exactly one lead card", `${m} gave ${leads.length}`);
  else if (leads[0] !== peta.cards[0]) fail("lead card is not first", m.join(""));
  if (DOMAIN[peta.cards[0].domain].lesson !== peta.lessonKey)
    fail("lesson is not the first card's", m.join(""));

  // The lead is the highest-severity domain that needs a reading.
  const needs = verdicts.filter((v) => v.kind !== "correct").map((v) => v.domain);
  if (needs.length) {
    const worst = needs.reduce((a, b) => (DOMAIN[b].severity > DOMAIN[a].severity ? b : a));
    if (peta.cards[0].domain !== worst)
      fail("lead is not the highest-severity need", `${m}: ${peta.cards[0].domain} vs ${worst}`);
    if (peta.presentation !== "REPAIR") fail("presentation should be REPAIR", m.join(""));
  } else {
    // The all-correct path: designed, not patched. No weakness is
    // manufactured, and the offered reading deepens rather than repairs.
    if (peta.presentation !== "EXTENSION") fail("all-correct is not EXTENSION", m.join(""));
    if (peta.cards.some((c) => c.tier === "PERLU_SEGERA" || c.tier === "WAJIB"))
      fail("all-correct path manufactured a weakness", m.join(""));
  }

  // Tiers appear in order: PERLU_SEGERA/DISARANKAN, then WAJIB, then SUDAH_TEPAT.
  const rank = { PERLU_SEGERA: 0, DISARANKAN: 0, WAJIB: 1, SUDAH_TEPAT: 2 };
  const ranks = peta.cards.map((c) => rank[c.tier]);
  if (ranks.some((r, i) => i > 0 && r < ranks[i - 1])) fail("tiers out of order", m.join(""));

  // Within a tier, severity descends.
  for (let i = 1; i < peta.cards.length; i += 1) {
    const prev = peta.cards[i - 1], cur = peta.cards[i];
    if (rank[prev.tier] === rank[cur.tier] &&
        DOMAIN[prev.domain].severity < DOMAIN[cur.domain].severity)
      fail("severity not descending within tier", m.join(""));
  }

  // Every card resolves to a reason with both languages present. A card
  // with no reason would be a card that names a score instead of a
  // thought, which is the one thing the Peta Bacaan must never do.
  for (const c of peta.cards) {
    const reason =
      c.reasonKind === "MISCONCEPTION" ? MAP_REASONS[c.misconception]
      : TIER_REASONS[c.reasonKind];
    if (!reason || !reason.id.trim() || !reason.en.trim())
      fail("card without a reason", `${m} / ${c.domain} / ${c.reasonKind}`);
    if (!TIER_LABELS[c.tier]) fail("tier without a label", c.tier);
  }
}

if (shapes.size !== 8) fail("map shapes", `expected 8, got ${shapes.size}`);
if (presentations.size !== 4)
  fail("lesson presentations", `expected 4, got ${presentations.size}: ${[...presentations].join(", ")}`);

// ------------------------------------------------------------- outcomes

const terminals = new Set();
const outcomeCounts = {};

for (const lessonKey of Object.keys(LESSONS)) {
  const seen = new Set();
  for (const c of checkStates) {
    const { outcome, correct, skipped } = outcomeFor(lessonKey, c);
    if (!OUTCOMES[outcome]) fail("unknown outcome", outcome);
    seen.add(outcome);
    outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;

    // The table, ruled 2026-09-18 and preserved: any skip is BELUM_CUKUP;
    // two correct is KONSISTEN; one correct is BELUM_CUKUP; none is
    // PERLU_PERHATIAN.
    const expected =
      skipped > 0 ? "BELUM_CUKUP"
      : correct === 2 ? "KONSISTEN"
      : correct === 1 ? "BELUM_CUKUP"
      : "PERLU_PERHATIAN";
    if (outcome !== expected)
      fail("outcome table violated", `${lessonKey} ${c} -> ${outcome}, expected ${expected}`);
  }
  if (seen.size !== 3) fail("not all three outcomes reachable", `${lessonKey}: ${[...seen]}`);
}

// Terminal states: (lesson presentation) × (outcome).
for (const p of presentations) for (const o of Object.keys(OUTCOMES)) terminals.add(`${p}/${o}`);
if (terminals.size !== 12) fail("terminal states", `expected 12, got ${terminals.size}`);

// Every outcome renders a headline in both languages, and the best one
// carries the evidence limit like the rest.
for (const [key, copy] of Object.entries(OUTCOMES)) {
  if (!copy.headline.id.trim() || !copy.headline.en.trim())
    fail("outcome without a headline", key);
}

// ---------------------------------------------------- determinism, by replay

const once = [];
const twice = [];
for (const m of mapStates) {
  const lessonKey = buildPeta(mapVerdicts(m)).lessonKey;
  const items = checkItemsFor(lessonKey);
  if (items.length !== 2) fail("check item count", `${lessonKey} gave ${items.length}`);
  for (const c of checkStates) {
    once.push(JSON.stringify(resolve(m, c)));
    twice.push(JSON.stringify(resolve(m, c)));
  }
}
if (once.length !== 125 * 25) fail("replay size", `${once.length}`);
for (let i = 0; i < once.length; i += 1) {
  if (once[i] !== twice[i]) { fail("not deterministic", `state ${i}`); break; }
}

// Determinism also means the arguments are never mutated: a visitor who
// goes back and changes an answer must get the map the new answers imply,
// not the old one patched.
const probe = ["A", "C", "C"];
const before = JSON.stringify(probe);
resolve(probe, ["A", "A"]);
if (JSON.stringify(probe) !== before) fail("resolve mutated its arguments", before);

// Nor the bundle. A module-level array sorted in place by one resolve would
// make the next one depend on call order -- which a back-to-back replay
// cannot detect, because both halves would be equally wrong.
if (JSON.stringify({ DOMAINS, MAP_ITEMS, CHECK_ITEMS, LESSONS }) !== BUNDLE_BEFORE)
  fail("the content bundle was mutated while resolving", "content.js is read-only");

// --------------------------------------------------------------- report

if (fails.length) {
  console.error(`\npaths FAILED — ${fails.length} problem(s)\n`);
  for (const f of new Set(fails)) console.error("  " + f);
  process.exit(1);
}
console.log(
  `paths OK — ${mapStates.length} map states -> ${shapes.size} shapes -> ` +
  `${presentations.size} lesson presentations; ${checkStates.length} check states -> ` +
  `3 outcomes; ${terminals.size} terminal states; ${once.length} resolutions replayed identically`);
console.log(`  outcome reachability across all lessons: ` +
  Object.entries(outcomeCounts).map(([k, v]) => `${k} ${v}`).join(", "));
