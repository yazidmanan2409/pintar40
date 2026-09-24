// Mini-PINTAR — deterministic adaptation.
//
// No randomness anywhere. Same answers -> same map -> same lesson -> same
// check questions -> same outcome. No shuffling, no sampling, no
// time-dependent behaviour, no A/B branch. The property is testable by
// replay (verify/paths.mjs does exactly that), and it is what lets someone
// walk an institution through the same journey twice.
//
// Every function here is PURE: no Date, no Math.random, no I/O, no storage,
// no mutation of its arguments. verify/isolation.mjs enforces that by
// scanning this file for the forbidden identifiers rather than trusting the
// comment.
//
// This is NOT a second assessment engine. It produces no session, no
// response row, no evidence, no result anyone may rely on. ADR-0021 (R3)
// records the interpretation: INV-26 governs authoritative,
// evidence-producing execution, and a zero-write public simulation has no
// authority to diverge from.

import { DOMAINS, DOMAIN, MAP_ITEMS, CHECK_ITEMS, LESSONS } from "./content.js";

export const SKIP = "SKIP";

/** Highest severity first, then domain key, so ordering is total. */
const bySeverityDesc = (a, b) =>
  b.severity - a.severity || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);

// ------------------------------------------------- Pemetaan Awal -> verdicts

/**
 * One verdict per MAP item, in item order.
 * @param {(string|SKIP|null)[]} choices option labels, SKIP, or null
 * @returns {{domain:string, kind:"correct"|"misconception"|"skipped", misconception?:string}[]}
 */
export function mapVerdicts(choices) {
  return MAP_ITEMS.map((item, i) => {
    const choice = choices[i];
    if (choice === SKIP || choice === null || choice === undefined) {
      return { domain: item.domain, kind: "skipped" };
    }
    const option = item.options.find((o) => o.label === choice);
    if (!option) return { domain: item.domain, kind: "skipped" };
    if (option.correct) return { domain: item.domain, kind: "correct" };
    return {
      domain: item.domain,
      kind: "misconception",
      misconception: option.misconception,
    };
  });
}

// -------------------------------------------------------- Peta Bacaan

/**
 * The Reading Map: three cards, ordered, each naming its reason.
 *
 * Tiers. PERLU_SEGERA is the single highest-severity domain that needs a
 * reading; WAJIB is the rest of those; SUDAH_TEPAT describes an observed
 * right answer and never inferred mastery; DISARANKAN appears only on the
 * all-correct path, where D2 is promoted to an extension reading.
 *
 * The all-correct path is designed, not patched: no weakness is
 * manufactured to keep the journey symmetrical.
 */
export function buildPeta(verdicts) {
  const byDomain = Object.fromEntries(verdicts.map((v) => [v.domain, v]));
  const needs = DOMAINS.filter((d) => byDomain[d.key].kind !== "correct");
  const right = DOMAINS.filter((d) => byDomain[d.key].kind === "correct");

  const card = (d, tier) => ({
    domain: d.key,
    tier,
    reasonKind:
      tier === "DISARANKAN"
        ? "DISARANKAN"
        : tier === "SUDAH_TEPAT"
          ? "SUDAH_TEPAT"
          : byDomain[d.key].kind === "skipped"
            ? "SKIPPED"
            : "MISCONCEPTION",
    misconception: byDomain[d.key].misconception,
  });

  let cards;
  if (needs.length === 0) {
    const ordered = [...DOMAINS].sort(bySeverityDesc);
    cards = ordered.map((d, i) => card(d, i === 0 ? "DISARANKAN" : "SUDAH_TEPAT"));
  } else {
    const ordered = [...needs].sort(bySeverityDesc);
    cards = [
      card(ordered[0], "PERLU_SEGERA"),
      ...ordered.slice(1).map((d) => card(d, "WAJIB")),
      ...[...right].sort(bySeverityDesc).map((d) => card(d, "SUDAH_TEPAT")),
    ];
  }

  // The lesson served is the one attached to the FIRST card.
  const lead = DOMAIN[cards[0].domain];
  return {
    cards,
    lessonKey: lead.lesson,
    lessonDomain: lead.key,
    // Four distinct lesson presentations: three repairs plus the D2
    // extension. The framing differs; the lesson body does not.
    presentation: needs.length === 0 ? "EXTENSION" : "REPAIR",
  };
}

/** The two CHECK items belonging to the lesson the visitor read. */
export function checkItemsFor(lessonKey) {
  return CHECK_ITEMS[LESSONS[lessonKey].domain];
}

// ------------------------------------------------- Uji Penguasaan -> Hasil

/**
 * @param {(string|SKIP|null)[]} choices two option labels, SKIP, or null
 * @returns {{outcome:"KONSISTEN"|"BELUM_CUKUP"|"PERLU_PERHATIAN", correct:number, skipped:number}}
 */
export function outcomeFor(lessonKey, choices) {
  const items = checkItemsFor(lessonKey);
  let correct = 0;
  let skipped = 0;
  items.forEach((item, i) => {
    const choice = choices[i];
    if (choice === SKIP || choice === null || choice === undefined) {
      skipped += 1;
      return;
    }
    const option = item.options.find((o) => o.label === choice);
    if (option && option.correct) correct += 1;
  });

  // A skip is the visitor's own honest signal that they do not know, and
  // the demonstration does not overrule it. Ruled 2026-09-18: this table is
  // preserved as written. BELUM_CUKUP is not to be made artificially modal
  // and the check is not to be made harder to manufacture the refusal --
  // the doctrine is carried by the evidence limit under every outcome,
  // KONSISTEN included.
  let outcome;
  if (skipped > 0) outcome = "BELUM_CUKUP";
  else if (correct === 2) outcome = "KONSISTEN";
  else if (correct === 1) outcome = "BELUM_CUKUP";
  else outcome = "PERLU_PERHATIAN";

  return { outcome, correct, skipped };
}

/**
 * The whole journey in one pure call. Used by the app to render and by
 * verify/paths.mjs to enumerate; one implementation, so a path the
 * verifier walks is the path a visitor walks.
 */
export function resolve(mapChoices, checkChoices) {
  const verdicts = mapVerdicts(mapChoices);
  const peta = buildPeta(verdicts);
  const result = outcomeFor(peta.lessonKey, checkChoices);
  return { verdicts, peta, result };
}
