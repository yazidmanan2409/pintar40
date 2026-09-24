// Mini-PINTAR — the journey, in a real browser.
//
// audit.mjs checks the content, paths.mjs checks the adaptation and
// isolation.mjs checks the source. None of them proves a visitor can finish,
// that the evidence limit reaches the screen, or that nothing is written to
// the device. This does, by driving Chromium.
//
// Run: node verify/journey.mjs [--shots]

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, rm } from "node:fs/promises";
// The browser tooling is shared with the role views and the corporate site,
// so it stays at website/mini-pintar/app/verify/ rather than moving here.
import { serve, launch, Page } from "../../../mini-pintar/app/verify/driver.mjs";
import { CONTRAST_EXPR, nonTextExpr } from "../../../mini-pintar/app/verify/probes.mjs";
import {
  DOMAINS, MAP_ITEMS, CHECK_ITEMS, CHECK_ONLY_MISCONCEPTIONS, MAP_REASONS,
  LESSONS, OUTCOMES, EVIDENCE_LIMIT, UI, REVEAL, TIER_LABELS,
} from "../content.js";
import { SKIP, mapVerdicts, buildPeta, outcomeFor } from "../adapt.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const SHOTS = process.argv.includes("--shots");
/**
 * A reduced run, for the negative plants only. Every rule still runs; the
 * exhaustive sweeps shrink. Never use it as the verification of record —
 * the full run is what the report quotes.
 */
const FAST = process.env.MINI_PINTAR_FAST === "1";
const SHOT_DIR = join(APP, "screens");
// Mini-PINTAR is served as part of the corporate site, from its root, so the
// shared logo and typeface resolve exactly as they do for a visitor.
const SITE = join(APP, "..");

const fails = [];
const fail = (what, detail = "") => fails.push(`${what}${detail ? " — " + detail : ""}`);
let checks = 0;
const assert = (cond, what, detail) => { if (cond) checks += 1; else fail(what, detail); };

// Progress goes to stderr as it happens. A browser run that dies without
// saying where it was is a run nobody can debug.
const phase = (name) => process.stderr.write(`  .. ${name}\n`);

// ------------------------------------------------------------ page helpers
//
// Driving is by DOM only: the app exposes nothing for tests, so a path the
// test can walk is a path a visitor can walk.

const PRIMARY = "main button.btn:not(.btn--quiet):not(.btn--text)";

// Reported as the offending elements, not as a count: "1" tells you a rule
// is broken and nothing about where.
const SMALL_TEXT = `[...document.querySelectorAll('main *')]
  .filter(e => e.offsetParent !== null && e.textContent.trim())
  .map(e => ({ el: e.tagName.toLowerCase() + (e.className ? "." + e.className : ""),
               px: parseFloat(getComputedStyle(e).fontSize) }))
  .filter(x => x.px > 0 && x.px < 14)`;

const CONTRAST = CONTRAST_EXPR;
const NON_TEXT = nonTextExpr([
  ["selected option border", '.opt[aria-checked="true"]', "borderLeftColor"],
  ["lead card rule", ".card--PERLU_SEGERA", "borderLeftColor"],
  ["needs-reading card rule", ".card--WAJIB", "borderLeftColor"],
  ["step rail, reached", ".rail i.on", "backgroundColor"],
  ["primary action", "main button.btn:not(.btn--quiet):not(.btn--text)", "backgroundColor"],
  ["evidence limit rule", ".limit", "borderLeftColor"],
]);

const SMALL_TARGETS = `[...document.querySelectorAll('main button, main a')]
  .map(e => ({ el: e.tagName.toLowerCase() + (e.className ? "." + e.className : ""),
               w: Math.round(e.getBoundingClientRect().width),
               h: Math.round(e.getBoundingClientRect().height) }))
  .filter(x => x.h > 0 && (x.h < 44 || x.w < 44))`;

const clickPrimary = (p) => p.eval(`
  (() => { const b = document.querySelector(${JSON.stringify(PRIMARY)});
    const at = " at " + (location.hash || "#threshold");
    if (!b) throw new Error("no primary button" + at);
    if (b.disabled) throw new Error("primary button disabled" + at + ": " + b.textContent);
    b.click(); return true; })()`).then(() => p.settle());

const clickTextBtn = (p, text) => p.eval(`
  (() => { const b = [...document.querySelectorAll("main button.btn--text")]
      .find(x => x.textContent.trim() === ${JSON.stringify(text)});
    if (!b) throw new Error("no text button: " + ${JSON.stringify(text)});
    b.click(); return true; })()`).then(() => p.settle());

const pick = (p, label) => p.eval(`
  (() => { const o = document.querySelector('.opt[data-label="' + ${JSON.stringify(label)} + '"]');
    if (!o) throw new Error("no option " + ${JSON.stringify(label)}
      + " at " + (location.hash || "#threshold")
      + " (options here: " + [...document.querySelectorAll('.opt')]
          .map(x => x.dataset.label || "fixed").join("") + ")"
      + " h1: " + (document.querySelector('main h1')?.textContent?.slice(0, 40) || "-"));
    o.click(); return true; })()`).then(() => p.settle());

const bodyText = (p) => p.eval("document.getElementById('main').innerText");

/**
 * innerText is what the visitor SEES, which is the right thing to assert
 * on and the wrong thing to compare raw: `text-transform: uppercase`
 * uppercases the tier labels, and a block-level element inside a sentence
 * introduces a newline. Normalising keeps the assertion about the words.
 */
const norm = (x) => (x || "").replace(/\s+/g, " ").trim().toLowerCase();
const shows = (haystack, needle) => norm(haystack).includes(norm(needle));
const hash = (p) => p.eval("location.hash");
const primaryDisabled = (p) =>
  p.eval(`!!document.querySelector(${JSON.stringify(PRIMARY)})?.disabled`);

/** Enough context to diagnose a navigation assertion that fails. */
const where = (p) => p.eval(
  `JSON.stringify({ href: location.href.replace(/^https?:\\/\\/[^/]+/, ""),` +
  ` state: history.state, len: history.length,` +
  ` h1: document.querySelector("main h1")?.textContent?.slice(0, 40) })`);

const DOMAIN_NAME = Object.fromEntries(DOMAINS.map((d) => [d.key, d.name.id]));

/** Threshold through Pemetaan Awal, stopping ON the Peta Bacaan. */
async function walkMapOnly(p, mapChoices) {
  await clickPrimary(p);
  for (let i = 0; i < mapChoices.length; i += 1) {
    if (mapChoices[i] === SKIP) await clickTextBtn(p, UI.skip.id);
    else { await pick(p, mapChoices[i]); await clickPrimary(p); }
  }
}

/** One full journey, driven by the choices given. */
async function walk(p, mapChoices, checkChoices) {
  await clickPrimary(p); // threshold -> map
  for (let i = 0; i < mapChoices.length; i += 1) {
    if (mapChoices[i] === SKIP) await clickTextBtn(p, UI.skip.id);
    else { await pick(p, mapChoices[i]); await clickPrimary(p); }
  }
  const petaText = await bodyText(p); // Peta Bacaan
  await clickPrimary(p);              // -> lesson
  const lessonText = await bodyText(p);
  await clickPrimary(p);              // -> check 1
  const reasonings = [];
  for (let i = 0; i < checkChoices.length; i += 1) {
    // Commit: skipping commits too, and both reveal the reasoning (R1).
    if (checkChoices[i] === SKIP) await clickTextBtn(p, UI.skip.id);
    else { await pick(p, checkChoices[i]); await clickPrimary(p); }
    reasonings.push(await bodyText(p));
    await clickPrimary(p);           // continue past the reasoning
  }
  const hasilText = await bodyText(p);
  return { petaText, lessonText, hasilText, reasonings };
}

// --------------------------------------------------------------------- run

const site = await serve(SITE);
const browser = await launch();
const ORIGIN = `http://127.0.0.1:${site.port}`;
const BASE = `${ORIGIN}/mini-pintar/`;
let p;

try {
  p = await Page.open(browser.pageUrl);
  await p.viewport(1280, 900);
  await p.goto(BASE);

  // -------------------------------------------------- the threshold, honestly
  phase('threshold');
  const first = await bodyText(p);
  assert(shows(first, UI.thresholdLede.id), "threshold shows the ruled duration", first.slice(0, 60));
  assert(!/dua menit/i.test(first), "threshold does not promise two minutes");
  assert(shows(first, UI.thresholdSub.id), "threshold carries honesty statement 1");
  assert(shows(first, "dimuat ulang"), "threshold discloses that a reload restarts");

  // The primary action is not available until the visitor has chosen.
  await clickPrimary(p);
  assert(await primaryDisabled(p), "Pemetaan Awal cannot be advanced without an answer");
  const q1 = await bodyText(p);
  assert(shows(q1, MAP_ITEMS[0].stem.id.slice(0, 40)), "first question is P1");
  assert(!/benar|salah/i.test(q1), "no right/wrong feedback in Pemetaan Awal", q1.slice(0, 80));
  await p.goto(BASE);

  // ---------------------------------------- all 8 map shapes, all 12 terminals
  const ALL_SHAPES = [
    ["A", "C", "C"], ["A", "C", "A"], ["A", "A", "C"], ["A", "A", "A"],
    ["B", "C", "C"], ["B", "C", "A"], ["B", "A", "C"], [SKIP, SKIP, SKIP],
  ];
  const SHAPES = FAST ? [ALL_SHAPES[0], ALL_SHAPES[7]] : ALL_SHAPES;
  const CHECKS = { KONSISTEN: ["A", "A"], BELUM_CUKUP: ["A", "B"], PERLU_PERHATIAN: ["B", "B"] };

  phase('all 8 map shapes x 12 terminal states');
  const terminals = new Set();
  const shapesSeen = new Set();

  for (const m of SHAPES) {
    const peta = buildPeta(mapVerdicts(m));
    shapesSeen.add(peta.cards.map((c) => c.domain + ":" + c.tier).join(" "));

    for (const [wanted, cc] of Object.entries(CHECKS)) {
      await p.goto(BASE);
      const seen = await walk(p, m, cc);

      // The map the browser rendered is the map the pure function computed.
      for (const c of peta.cards) {
        assert(shows(seen.petaText, TIER_LABELS[c.tier].id),
          `map card tier rendered (${m.join("")}/${c.domain})`, TIER_LABELS[c.tier].id);
      }

      // The lesson served is the one the first card names.
      assert(shows(seen.lessonText, LESSONS[peta.lessonKey].title.id),
        `lesson served matches the map (${m.join("")})`, peta.lessonKey);

      // The outcome on screen is the outcome the table gives.
      const { outcome } = outcomeFor(peta.lessonKey, cc);
      assert(outcome === wanted, `outcome table (${m.join("")}/${cc.join("")})`, outcome);
      assert(shows(seen.hasilText, OUTCOMES[outcome].headline.id),
        `outcome headline on screen (${outcome})`, seen.hasilText.slice(0, 80));

      // THE condition ADR-0021 makes binding: every outcome states the
      // limit of its own evidence, the best one included.
      assert(shows(seen.hasilText, EVIDENCE_LIMIT.id),
        `evidence limit present on ${outcome}`, seen.hasilText.slice(0, 120));

      // No score, no percentage, no pass/fail anywhere on the result.
      assert(!/%|\bskor\b|\bnilai Anda\b|lulus|gagal/i.test(seen.hasilText),
        `no score language on ${outcome}`, seen.hasilText.slice(0, 120));
      assert(shows(seen.hasilText, "tidak dibandingkan"),
        "Hasil refuses the delta rather than computing one");

      terminals.add(`${peta.lessonKey}/${peta.presentation}/${outcome}`);
    }
  }
  phase("card order on screen");
  for (const m of SHAPES) {
    await p.goto(BASE);
    await walkMapOnly(p, m);
    const names = await p.eval(
      `[...document.querySelectorAll('.card .card__name')].map(n => n.textContent.trim())`);
    const expected = buildPeta(mapVerdicts(m)).cards.map((c) => DOMAIN_NAME[c.domain]);
    assert(JSON.stringify(names) === JSON.stringify(expected),
      `cards are in the computed order (${m.join("")})`, names.join(" | "));
  }

  if (!FAST) {
    assert(shapesSeen.size === 8, "eight map shapes walked in the browser", String(shapesSeen.size));
    assert(terminals.size === 12, "twelve terminal states reached in the browser", String(terminals.size));
  }

  // ------------------------------------------------------------- the reveal
  await p.goto(BASE);
  phase('the reveal');
  await walk(p, ["A", "C", "C"], ["A", "A"]);
  await clickPrimary(p);
  const reveal = await bodyText(p);
  assert(shows(reveal, REVEAL.headline.id), "reveal reached");
  for (const step of REVEAL.steps) {
    assert(shows(reveal, step.note.id), "reveal names what happened", step.step.id);
  }
  assert(shows(reveal, REVEAL.honesty.id), "reveal carries honesty statement 2");
  assert(shows(reveal, "membantu Anda memilih"), "R9: the human holds the deciding verb");
  const doors = await p.eval("[...document.querySelectorAll('.doors a')].map(a => a.textContent.trim())");
  assert(doors.length === 3, "three doors, not one CTA", String(doors.length));

  // ------------------------------------ nothing is written to the device
  phase('device storage');
  const storage = await p.eval(`(async () => ({
    local: localStorage.length,
    session: sessionStorage.length,
    cookie: document.cookie,
    dbs: (indexedDB.databases ? (await indexedDB.databases()).length : 0),
  }))()`, true);
  assert(storage.local === 0, "localStorage untouched", String(storage.local));
  assert(storage.session === 0, "sessionStorage untouched", String(storage.session));
  assert(storage.cookie === "", "no cookie set", storage.cookie);
  assert(storage.dbs === 0, "no IndexedDB database created", String(storage.dbs));

  // ------------------------------------------ nothing leaves the bundle
  phase('network');
  const external = p.requests.filter((u) => !u.startsWith(ORIGIN + "/") && !u.startsWith("data:"));
  assert(external.length === 0, "no request left the bundle", external.join(", "));
  const paths = new Set(site.requested);
  // The bundle's own five files, plus exactly the shared static assets the
  // site's identity needs: the supplied logo and the self-hosted typeface.
  // Nothing else, and no code from outside the bundle.
  const allowed = new Set([
    "/mini-pintar/", "/mini-pintar/index.html", "/mini-pintar/style.css",
    "/mini-pintar/content.js", "/mini-pintar/adapt.js", "/mini-pintar/app.js",
    "/favicon.ico", "/shared/brand/pintar-selalu-logo.png",
    "/shared/fonts/plus-jakarta-sans-latin.woff2", "/shared/fonts/plus-jakarta-sans-latin-ext.woff2",
  ]);
  const unexpected = [...paths].filter((x) => !allowed.has(x));
  assert(unexpected.length === 0, "only the bundle's own files were fetched", unexpected.join(", "));
  const withAnswer = p.requests.filter((u) => /[?&#].*(choice|answer|option|outcome|opt=)/i.test(u));
  assert(withAnswer.length === 0, "no request carried an answer", withAnswer.join(", "));

  // -------------------------------------------------- reload restarts, as told
  await p.goto(BASE);
  phase('reload restarts');
  await clickPrimary(p);
  await pick(p, "A");
  await clickPrimary(p);
  assert((await hash(p)) === "#map-2", "history tracks the step", await hash(p));
  await p.reload();
  const afterReload = await bodyText(p);
  assert(shows(afterReload, UI.thresholdLede.id), "reload restarts the experience",
    afterReload.slice(0, 60));

  // --------------------------------------- a deep link shows nobody's result
  phase('deep link');
  await p.goto(BASE + "#hasil");
  const deep = await bodyText(p);
  assert(shows(deep, UI.thresholdLede.id), "deep link to a result redirects to the threshold");
  assert((await hash(p)) === "", "the stale hash is cleared", await hash(p));

  // ------------------------------------- back keeps the answer, and it changes
  await p.goto(BASE);
  await clickPrimary(p);
  phase('back keeps the answer');
  await pick(p, "B");
  await clickPrimary(p);
  await p.eval("history.back()");
  await p.settle();
  const checkedAfterBack = await p.eval(`document.querySelector('.opt[aria-checked="true"]')?.dataset.label`);
  assert(checkedAfterBack === "B", "back shows the previous answer", String(checkedAfterBack));
  await pick(p, "A");
  const changed = await p.eval(`document.querySelector('.opt[aria-checked="true"]')?.dataset.label`);
  assert(changed === "A", "the answer is changeable — nothing was submitted", String(changed));

  // --------------------------- regressions, found by reading app.js back
  //
  // Both were real and both were silent. They are cases here now because a
  // defect found by rereading is a defect the next edit can reintroduce.

  // With nothing chosen, ArrowDown selected the SECOND option.
  await p.goto(BASE);
  phase('regressions');
  await clickPrimary(p);
  await p.eval("document.querySelector('.opt').focus()");
  await p.key("ArrowDown", "ArrowDown", 40);
  const firstArrow = await p.eval(`document.querySelector('.opt[aria-checked="true"]')?.dataset.label`);
  assert(firstArrow === "A", "ArrowDown from nothing chosen selects the first option",
    String(firstArrow));
  await p.key("ArrowUp", "ArrowUp", 38);
  const wrapped = await p.eval(`document.querySelector('.opt[aria-checked="true"]')?.dataset.label`);
  assert(wrapped === "D", "ArrowUp wraps to the last option", String(wrapped));

  // Back, then FORWARD without pressing Next, used to show a stale map.
  await p.goto(BASE);
  await walkMapOnly(p, ["B", "A", "A"]);        // all three missed -> D2 leads
  const staleBefore = await bodyText(p);
  assert(shows(staleBefore, TIER_LABELS.PERLU_SEGERA.id), "map shows a lead card",
    staleBefore.slice(0, 120));
  assert(!shows(staleBefore, TIER_LABELS.SUDAH_TEPAT.id),
    "nothing is marked already-right when all three were missed");
  await p.eval("history.back()");  await p.settle();   // back to map-3
  assert((await hash(p)) === "#map-3", "back reaches the third question", await where(p));
  await pick(p, "C");                                   // D3 now correct
  await p.eval("history.forward()"); await p.settle();  // forward to the map
  assert((await hash(p)) === "#peta", "forward reaches the map", await where(p));
  const afterForward = await bodyText(p);
  assert(shows(afterForward, TIER_LABELS.SUDAH_TEPAT.id),
    "the map re-derives from the changed answer rather than showing a stale one",
    afterForward.slice(0, 200));

  // A changed map answer used to leave the check answers in place while the
  // lesson served changed underneath them -- two answers given to one
  // lesson's questions, scored against another's.
  await p.goto(BASE);
  const baseline = await walk(p, ["B", "A", "A"], ["A", "A"]);  // L-D2 -> KONSISTEN
  assert(shows(baseline.hasilText, OUTCOMES.KONSISTEN.headline.id),
    "baseline outcome is KONSISTEN", baseline.hasilText.slice(0, 80));

  await p.goto(BASE);
  await walkMapOnly(p, ["B", "A", "A"]);        // on the Peta Bacaan, D2 leads
  await clickPrimary(p);                        // lesson
  const lessonWas = await bodyText(p);
  assert(shows(lessonWas, LESSONS["L-D2"].title.id), "the D2 lesson is served first");
  await clickPrimary(p);                        // check 1
  await pick(p, "A"); await clickPrimary(p);    // commit question 1
  await clickPrimary(p);                        // -> check 2
  await pick(p, "A"); await clickPrimary(p);    // commit question 2

  // Back to the third Pemetaan Awal question and make D3 correct. D2 still
  // needs a reading, so the lesson stays L-D2 -- but the two check answers
  // must not survive a changed map answer regardless.
  // Back to the third question one step at a time, through the app's own
  // control. Counting history entries is the test being clever; pressing
  // Back until you are there is what a visitor does.
  let steps = 0;
  while ((await hash(p)) !== "#map-3" && steps < 8) {
    await clickTextBtn(p, UI.back.id);
    steps += 1;
  }
  assert((await hash(p)) === "#map-3", "Back reaches the third question", await where(p));
  await pick(p, "C");
  const shownChoice = await p.eval(`document.querySelector('.opt[aria-checked="true"]')?.dataset.label`);
  assert(shownChoice === "C", "the changed answer is shown as chosen", String(shownChoice));

  await clickPrimary(p);                        // peta
  await clickPrimary(p);                        // lesson
  await clickPrimary(p);                        // check 1
  assert((await hash(p)) === "#check-1", "forward lands on the first check question", await hash(p));
  const checkFresh = await p.eval(`!document.querySelector('.opt[aria-checked="true"]')`);
  assert(checkFresh, "changing a Pemetaan Awal answer discards the check answers");
  assert(await primaryDisabled(p), "and the check cannot be advanced without answering again");

  // ------------------------------------------ R1: the reasoning, revealed
  phase("reasoning revealed after commit");
  {
    const items = CHECK_ITEMS.D2;
    // A choice that is not the keyed one: both its reasoning and the keyed
    // reasoning are shown, and neither is the other.
    await p.goto(BASE);
    await walkMapOnly(p, ["B", "A", "A"]);
    await clickPrimary(p); await clickPrimary(p);          // lesson -> check 1
    const beforeCommit = await bodyText(p);
    const wrong = items[0].options.find((o) => o.label === "B");
    const key = items[0].options.find((o) => o.correct);
    assert(!shows(beforeCommit, wrong.rationale.id),
      "no reasoning is shown before the answer is committed");
    assert(!shows(beforeCommit, key.rationale.id),
      "the keyed reasoning is not shown before commit");

    await pick(p, "B");
    await clickPrimary(p);                                  // commit
    const after = await bodyText(p);
    assert(shows(after, wrong.rationale.id), "the chosen option's reasoning is revealed",
      after.slice(0, 120));
    assert(shows(after, key.rationale.id), "the keyed option's reasoning is revealed too");
    const kindsWrong = await p.eval(
      `[...document.querySelectorAll('.reason__kind')].map(n => n.textContent.trim())`);
    assert(kindsWrong.length === 2, "two reasoning blocks when the choice was not the keyed one",
      JSON.stringify(kindsWrong));
    assert(shows(kindsWrong.join(" "), UI.yourChoice.id)
        && shows(kindsWrong.join(" "), UI.mostAccurate.id),
      "both blocks are labelled", JSON.stringify(kindsWrong));
    assert(!/salah|keliru|wrong|incorrect/i.test(after),
      "the reasoning judges the answer, never the person", after.slice(0, 160));

    // Committing fixes the answer. Revealing why an answer falls short and
    // then letting it be changed would make the reveal pointless.
    const stillRadio = await p.eval(`!!document.querySelector('.opt[role="radio"]')`);
    assert(!stillRadio, "the options stop being a radio group once committed");
    await p.eval(`document.querySelector('.opt--key')?.click()`);
    await p.settle();
    const changed = await p.eval(`!!document.querySelector('.opt--chosen.opt--key')`);
    assert(!changed, "clicking after commit does not change the answer");

    // The keyed answer alone: one block, not the same paragraph twice.
    await p.goto(BASE);
    await walkMapOnly(p, ["B", "A", "A"]);
    await clickPrimary(p); await clickPrimary(p);
    await pick(p, "A"); await clickPrimary(p);
    const rightText = await bodyText(p);
    assert(shows(rightText, key.rationale.id), "the keyed reasoning is shown when it was chosen");
    const kindsRight = await p.eval(
      `[...document.querySelectorAll('.reason__kind')].map(n => n.textContent.trim())`);
    assert(kindsRight.length === 1,
      "the keyed block is not repeated when the visitor chose it", JSON.stringify(kindsRight));

    // A skip reveals the reasoning without being called a misconception.
    await p.goto(BASE);
    await walkMapOnly(p, ["B", "A", "A"]);
    await clickPrimary(p); await clickPrimary(p);
    await clickTextBtn(p, UI.skip.id);
    const skipText = await bodyText(p);
    assert(shows(skipText, UI.skippedHere.id), "a skip is named as a skip", skipText.slice(0, 120));
    assert(shows(skipText, key.rationale.id), "a skip still gets the reasoning");
    const kindsSkip = await p.eval(
      `[...document.querySelectorAll('.reason__kind')].map(n => n.textContent.trim())`);
    assert(kindsSkip.length === 1 && shows(kindsSkip[0], UI.mostAccurate.id),
      "a skip is not described as a choice", JSON.stringify(kindsSkip));
  }

  // The Hasil stays an evidence-interpretation surface (R1).
  {
    await p.goto(BASE);
    const r = await walk(p, ["B", "A", "A"], ["B", "B"]);
    const anyRationale = CHECK_ITEMS.D2.flatMap((i) => i.options)
      .filter((o) => shows(r.hasilText, o.rationale.id));
    assert(anyRationale.length === 0,
      "the Hasil is not a correction sheet — no option rationale on it",
      anyRationale.map((o) => o.label).join(", "));
    assert(shows(r.hasilText, EVIDENCE_LIMIT.id), "and it still carries the evidence limit");
  }

  // ------------------------------- R2: the taxonomy never reaches a screen
  phase("misconception taxonomy stays internal");
  {
    const codes = [...new Set([
      ...Object.keys(MAP_REASONS), ...Object.keys(CHECK_ONLY_MISCONCEPTIONS),
    ])];
    await p.goto(BASE);
    const seen = [];
    const sweep = async (where) => {
      const html = await p.eval("document.documentElement.outerHTML");
      for (const c of codes) if (html.includes(c)) seen.push(`${c} at ${where}`);
    };
    await sweep("threshold");
    await walkMapOnly(p, ["B", "A", "A"]);  await sweep("peta");
    await clickPrimary(p);                  await sweep("lesson");
    await clickPrimary(p);                  await sweep("check");
    await pick(p, "B"); await clickPrimary(p); await sweep("check committed");
    await clickPrimary(p); await pick(p, "B"); await clickPrimary(p);
    await clickPrimary(p);                  await sweep("hasil");
    await clickPrimary(p);                  await sweep("reveal");
    assert(seen.length === 0, "no misconception code appears in the document", seen.join("; "));
  }

  // ------------------------------------------------- contrast, measured
  phase("contrast, measured");
  for (const [w, h, label] of (FAST ? [[1280, 900, "desktop"]]
                                     : [[1280, 900, "desktop"], [390, 844, "mobile"]])) {
    await p.viewport(w, h);
    await p.goto(BASE);
    const measure = async (name) => {
      const text = await p.eval(CONTRAST);
      assert(text.measured > 0, `contrast probe measured something at ${label}/${name}`,
        JSON.stringify(text));
      assert(text.bad.length === 0, `contrast at ${label}/${name}`, JSON.stringify(text.bad));
      const ui = await p.eval(NON_TEXT);
      assert(ui.measured > 0, `non-text probe measured something at ${label}/${name}`,
        JSON.stringify(ui));
      assert(ui.bad.length === 0, `non-text contrast at ${label}/${name}`, JSON.stringify(ui.bad));
    };
    await measure("threshold");
    await clickPrimary(p); await pick(p, "B"); await measure("pemetaan awal");
    await clickPrimary(p); await pick(p, "A"); await clickPrimary(p);
    await pick(p, "A"); await clickPrimary(p); await measure("peta bacaan");
    await clickPrimary(p); await measure("pelajaran");
    await clickPrimary(p);
    await p.eval("document.querySelector('.checkbar button').click()"); await p.settle();
    await measure("uji penguasaan");
    await pick(p, "B"); await clickPrimary(p); await measure("reasoning");
    await clickPrimary(p); await pick(p, "B"); await clickPrimary(p);
    await clickPrimary(p); await measure("hasil");
    await clickPrimary(p); await measure("reveal");
  }
  await p.viewport(1280, 900);

  // ------------------------------- language switch keeps position and answers
  await p.goto(BASE);
  await clickPrimary(p);
  await pick(p, "C");
  await p.eval(`[...document.querySelectorAll('#lang button')].find(b => b.textContent === 'EN').click()`);
  await p.settle();
  phase('language switch');
  const en = await bodyText(p);
  assert(shows(en, MAP_ITEMS[0].stem.en.slice(0, 40)), "content swapped to English", en.slice(0, 80));
  assert((await hash(p)) === "#map-1", "position preserved across the switch", await hash(p));
  const keptChoice = await p.eval(`document.querySelector('.opt[aria-checked="true"]')?.dataset.label`);
  assert(keptChoice === "C", "answer preserved across the switch", String(keptChoice));
  assert((await p.eval("document.documentElement.lang")) === "en",
    "html lang follows the content so a screen reader changes voice");

  // ------------------------------------------- keyboard completes the journey
  await p.goto(BASE + "?lang=id");
  phase('keyboard only');
  const kb = await keyboardJourney(p);
  assert(kb.finished, "keyboard alone completes the whole journey", kb.detail);

  // ----------------------------------------------- accessibility structure
  await p.goto(BASE);
  await clickPrimary(p);
  phase('accessibility structure');
  const a11y = await p.eval(`({
    h1: document.querySelectorAll('main h1').length,
    focused: document.activeElement === document.getElementById('h'),
    group: document.querySelector('.options')?.getAttribute('role'),
    radios: [...document.querySelectorAll('.opt')].every(o => o.getAttribute('role') === 'radio'),
    live: document.getElementById('live')?.getAttribute('aria-live'),
    liveText: document.getElementById('live')?.textContent,
    clockHidden: document.getElementById('clock') === null,
    smallText: SMALL_TEXT,
    targets: SMALL_TARGETS,
  })`.replace("SMALL_TEXT", SMALL_TEXT).replace("SMALL_TARGETS", SMALL_TARGETS));
  assert(a11y.h1 === 1, "exactly one h1 per step", String(a11y.h1));
  assert(a11y.focused, "focus moves to the step heading");
  assert(a11y.group === "radiogroup", "options are a real radio group", String(a11y.group));
  assert(a11y.radios, "every option is role=radio");
  assert(a11y.live === "polite", "the step is announced politely");
  assert(a11y.liveText.includes("pertanyaan 1 dari 3"), "the announcement names the position", a11y.liveText);
  assert(a11y.smallText.length === 0, "no text under 14px", JSON.stringify(a11y.smallText));
  assert(a11y.targets.length === 0, "every touch target is at least 44px",
    JSON.stringify(a11y.targets));

  // The type floor and the target size hold on EVERY step, not just the
  // one the structural check happened to stand on.
  for (const [m, cc, label] of [
    [["B", "A", "A"], [], "check"], [["A", "C", "C"], ["A", "A"], "hasil"],
  ]) {
    await p.goto(BASE);
    await walk(p, m, cc);
    for (const stop of ["here", "next"]) {
      const small = await p.eval(SMALL_TEXT);
      const tgt = await p.eval(SMALL_TARGETS);
      assert(small.length === 0, `no text under 14px (${label}/${stop})`, JSON.stringify(small));
      assert(tgt.length === 0, `targets at least 44px (${label}/${stop})`, JSON.stringify(tgt));
      if (stop === "here") await clickPrimary(p).catch(() => {});
    }
  }

  // The persistent help is there from the moment the question appears --
  // the reason WCAG 2.2.1 does not apply.
  await p.goto(BASE);
  await walk(p, ["B", "A", "A"], []);
  const helpNow = await p.eval(
    `!!document.querySelector('.checkbar button') && document.querySelector('.assist').children.length === 0`);
  assert(helpNow, "help is offered without waiting, and is not open by default");
  await p.eval("document.querySelector('.checkbar button').click()");
  await p.settle();
  const pill = await bodyText(p);
  const helpText = await p.eval("document.querySelector('.assist__pill').innerText");
  assert(shows(pill, UI.assistNote.id), "the pill says help never names the answer");
  const answers = await p.eval(`[...document.querySelectorAll('.opt')]
    .map(o => o.textContent.replace(/^[A-D]\\s*/, '').trim())`);
  assert(!answers.some((a) => helpText.includes(a.slice(0, 25))),
    "assistance does not quote an option", helpText);

  // ------------------------------------------------- narrow, and zoomed
  phase('narrow widths and zoom');
  for (const [w, label] of [[320, "320px"], [390, "390px"], [768, "768px"]]) {
    await p.viewport(w, 780);
    await p.goto(BASE);
    await walk(p, ["B", "A", "C"], ["A", "B"]);
    await clickPrimary(p);
    const overflow = await p.eval(
      "document.documentElement.scrollWidth - document.documentElement.clientWidth");
    assert(overflow <= 0, `no horizontal overflow at ${label}`, String(overflow));
  }
  // A sticky action bar that covers an option is a trap that no width
  // measurement can see: hit-test the centre of every option, at the
  // narrowest width, with the assistance pill open so the page is at its
  // tallest.
  await p.viewport(320, 640);
  await p.goto(BASE);
  await walk(p, ["B", "A", "A"], []);
  await p.eval("document.querySelector('.checkbar button').click()");
  await p.settle();
  const occluded = await p.eval(`(() => {
    const out = [];
    for (const o of document.querySelectorAll('.opt')) {
      o.scrollIntoView({ block: 'center' });
      const r = o.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!(hit === o || o.contains(hit))) out.push(o.dataset.label);
    }
    return out;
  })()`);
  assert(occluded.length === 0, "no option is covered by the sticky action bar at 320px",
    occluded.join(", "));

  // And the primary action itself is reachable and not covering itself.
  const primaryHit = await p.eval(`(() => {
    const b = document.querySelector(${JSON.stringify(PRIMARY)});
    b.scrollIntoView({ block: 'center' });
    const r = b.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return hit === b || b.contains(hit);
  })()`);
  assert(primaryHit, "the primary action is hit-testable at 320px");

  // 200 % zoom is the same thing as half the width at twice the scale.
  await p.viewport(640, 512, 2);
  await p.goto(BASE);
  await walk(p, ["A", "C", "C"], ["A", "A"]);
  const zoomOverflow = await p.eval(
    "document.documentElement.scrollWidth - document.documentElement.clientWidth");
  assert(zoomOverflow <= 0, "no horizontal overflow at 200% zoom", String(zoomOverflow));

  // ----------------------------------------------------- reduced motion
  await p.viewport(1280, 900);
  phase('reduced motion');
  await p.cdp.send("Emulation.setEmulatedMedia",
    { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await p.goto(BASE);
  const noAnim = await p.eval(
    `getComputedStyle(document.querySelector('main section')).animationName`);
  assert(noAnim === "none", "the settle animation is removed under reduced motion", noAnim);
  const reduced = await walk(p, ["A", "C", "C"], ["A", "A"]);
  assert(shows(reduced.hasilText, EVIDENCE_LIMIT.id),
    "the journey still completes with motion removed");
  await p.cdp.send("Emulation.setEmulatedMedia", { features: [] });

  // -------------------------------------------------------- no page errors
  assert(p.consoleErrors.length === 0, "no uncaught error in the whole run",
    p.consoleErrors.join(" | "));

  // ------------------------------------------------------------ screenshots
  phase('screenshots');
  if (SHOTS) {
    // Written fresh, so a renamed step cannot leave a stale screen behind
    // for someone to review.
    await rm(SHOT_DIR, { recursive: true, force: true });
    await mkdir(SHOT_DIR, { recursive: true });
    // Tall viewports on purpose. `captureBeyondViewport` stitches a
    // full-page image, and a `position: sticky` element is painted at its
    // STUCK position in it -- which renders the action bar on top of the
    // options and looks exactly like a layout bug. Giving the viewport
    // room for the whole page means nothing is stuck and the capture shows
    // the real layout. (The occlusion check above is what actually proves
    // the bar covers nothing; a screenshot never could.)
    for (const [w, h, tag] of [[1280, 1200, "desktop"], [390, 1500, "mobile"]]) {
      await p.viewport(w, h);
      await p.goto(BASE);
      const shot = (n) => p.screenshot(join(SHOT_DIR, `${tag}-${n}.png`));
      await shot("0-threshold");
      await clickPrimary(p); await pick(p, "B"); await shot("1-pemetaan-awal");
      await clickPrimary(p); await pick(p, "A"); await clickPrimary(p);
      await pick(p, "A"); await clickPrimary(p);
      await shot("2-peta-bacaan");
      await clickPrimary(p); await shot("3-pelajaran");
      await clickPrimary(p);
      await p.eval("document.querySelector('.checkbar button').click()"); await p.settle();
      await shot("4-uji-penguasaan");
      // One keyed answer and one not, so the captured Hasil is
      // BELUM_CUKUP and the captured reasoning shows both blocks.
      await pick(p, "A"); await clickPrimary(p);   // commit question 1
      await clickPrimary(p);                        // -> question 2
      await pick(p, "B"); await clickPrimary(p);    // commit question 2
      await shot("5-penjelasan");
      await clickPrimary(p);                        // -> hasil
      await shot("6-hasil-belum-cukup");
      await clickPrimary(p); await shot("7-reveal");
    }
    console.log(`screens written to ${SHOT_DIR}`);
  }
} catch (e) {
  fail("the run threw", e.message);
} finally {
  await browser.kill();
  await site.close();
}

/**
 * Tab and the space bar only. A pointer-only path anywhere would make the
 * experience unusable for a keyboard or switch user, and the failure would
 * be invisible to every test that clicks.
 */
async function keyboardJourney(page) {
  const TAB = () => page.key("Tab", "Tab", 9);
  const SPACE = () => page.key(" ", "Space", 32);
  const ENTER = () => page.key("Enter", "Enter", 13);
  const DOWN = () => page.key("ArrowDown", "ArrowDown", 40);

  for (let guard = 0; guard < 80; guard += 1) {
    const step = await page.eval("location.hash || '#threshold'");
    if (step === "#reveal") return { finished: true, detail: `reached in ${guard} steps` };

    // Once a check answer is committed the options are a plain list, not
    // controls: there is nothing to choose and the only action is to
    // continue.
    const fixed = await page.eval("!!document.querySelector('.options--fixed')");

    if (!fixed && (step.startsWith("#map") || step.startsWith("#check"))) {
      // Reach the radio group, choose with the arrow keys, then the
      // primary action. Nothing here uses a pointer.
      const reached = await page.eval(`(() => {
        const o = document.querySelector('.opt'); if (!o) return false;
        o.focus(); return document.activeElement === o; })()`);
      if (!reached) return { finished: false, detail: "could not focus an option at " + step };
      await DOWN();
      await SPACE();
      const chosen = await page.eval(`!!document.querySelector('.opt[aria-checked="true"]')`);
      if (!chosen) return { finished: false, detail: "space did not choose at " + step };
    }

    // Tab forward until the primary action has focus, then press it.
    let pressed = false;
    for (let i = 0; i < 14; i += 1) {
      await TAB();
      const onPrimary = await page.eval(
        `document.activeElement === document.querySelector(${JSON.stringify(PRIMARY)})`);
      if (onPrimary) {
        await ENTER();
        pressed = true;
        break;
      }
    }
    if (!pressed) return { finished: false, detail: "primary action unreachable by Tab at " + step };
  }
  return { finished: false, detail: "did not reach the reveal within the guard" };
}

// --------------------------------------------------------------- report

if (fails.length) {
  console.error(`\njourney FAILED — ${fails.length} problem(s), ${checks} checks passed\n`);
  for (const f of fails) console.error("  " + f);
  process.exit(1);
}
console.log(FAST
  ? `journey OK (REDUCED, MINI_PINTAR_FAST=1) — ${checks} checks: ${FAST ? 2 : 8} of 8 map ` +
    `shapes, one viewport, no screenshots. Not the verification of record.`
  : `journey OK — ${checks} checks in a real browser: 8 map shapes, 12 terminal ` +
    `states, keyboard-only completion, zero storage writes, zero external requests`);
