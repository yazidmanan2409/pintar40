// Educator role view — checked in a real browser.
//
// The audit checks the words. This checks the things only a rendered page
// can answer: whether the surface is readable, whether the doctrine chain
// survives being laid out, and whether any tone ever lands on a person.
//
// Run: node verify/view.mjs [--shots]

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, rm } from "node:fs/promises";
import { serve, launch, Page } from "../../../../website/mini-pintar/app/verify/driver.mjs";
import { CONTRAST_EXPR, nonTextExpr } from "../../../../website/mini-pintar/app/verify/probes.mjs";
import { FRAME, SAMPLE, CHAIN, CARDS, QUIET } from "../content.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const SHOTS = process.argv.includes("--shots");
const SHOT_DIR = join(APP, "screens");

const fails = [];
const fail = (what, detail = "") => fails.push(`${what}${detail ? " — " + detail : ""}`);
let checks = 0;
const assert = (cond, what, detail) => { if (cond) checks += 1; else fail(what, detail); };
const phase = (n) => process.stderr.write(`  .. ${n}\n`);

const norm = (x) => (x || "").replace(/\s+/g, " ").trim().toLowerCase();
const shows = (hay, needle) => norm(hay).includes(norm(needle));

// What carries meaning on THIS surface. The card rules are the only
// non-text elements that say anything: they name a kind of decision.
const NON_TEXT = nonTextExpr([
  ["held card rule", ".card--blocked", "borderLeftColor"],
  ["waiting card rule", ".card--attention", "borderLeftColor"],
  ["worth-knowing card rule", ".card--info", "borderLeftColor"],
]);

const site = await serve(APP);
const browser = await launch();
const BASE = `http://127.0.0.1:${site.port}/`;
let p;

try {
  p = await Page.open(browser.pageUrl);
  await p.viewport(1280, 1000);
  await p.goto(BASE);

  const body = () => p.eval("document.body.innerText");

  // ------------------------------------------------- it says what it is
  phase("says what it is");
  const first = await body();
  assert(shows(first, SAMPLE.label.id), "the sample banner is on the page");
  assert(shows(first, "belum dibangun"), "the banner says the view is not built");
  assert(shows(first, "bukan data sekolah"), "the banner says the data is not a school's");
  const bannerFirst = await p.eval(
    `document.querySelector('.sample') === document.body.firstElementChild`);
  assert(bannerFirst, "the banner is the first thing in the document, not a corner badge");
  const dismissable = await p.eval(
    `!!document.querySelector('.sample button, .sample [role="button"], .sample a')`);
  assert(!dismissable, "the banner cannot be dismissed");

  // --------------------------------------------- the chain, on every card
  phase("the doctrine chain");
  const cards = await p.eval("document.querySelectorAll('.card').length");
  assert(cards === CARDS.length, "every card rendered", String(cards));

  const chain = await p.eval(
    `[...document.querySelectorAll('.card')].map(c => ({
       kind: c.querySelector('.card__kind')?.textContent.trim(),
       happened: c.querySelector('.card__happened')?.textContent.trim(),
       labels: [...c.querySelectorAll('.chain dt')].map(d => d.textContent.trim()),
       values: [...c.querySelectorAll('.chain dd')].map(d => d.textContent.trim()),
       decideLabel: c.querySelector('.decide__label')?.textContent.trim(),
       buttons: [...c.querySelectorAll('.decide__row button')].map(b => b.textContent.trim()),
     }))`);

  for (const [i, c] of chain.entries()) {
    const src = CARDS[i];
    assert(shows(c.happened, src.happened.id), `what happened is on card ${i + 1}`, c.happened);
    // The order of the chain is the doctrine. A card that renders them in
    // another order is making a different argument.
    assert(c.labels.length === 3 && shows(c.labels[0], CHAIN.supports.id)
      && shows(c.labels[1], CHAIN.unknown.id) && shows(c.labels[2], CHAIN.step.id),
      `the chain is in order on card ${i + 1}`, JSON.stringify(c.labels));
    assert(c.values.length === 3 && c.values.every((v) => v.length > 0),
      `every part of the chain has content on card ${i + 1}`);
    assert(shows(c.decideLabel, CHAIN.decision.id), `the decision is named on card ${i + 1}`);
    assert(c.buttons.length >= 2, `card ${i + 1} offers more than one next step`,
      String(c.buttons.length));
  }

  // The uncertainty is set no smaller and no lighter than the support above
  // it. Small print here would be the overclaim the chain exists to stop.
  const weights = await p.eval(
    `[...document.querySelectorAll('.card')].map(c => {
       const dd = c.querySelectorAll('.chain dd');
       const s = getComputedStyle(dd[0]), u = getComputedStyle(dd[1]);
       return { sPx: parseFloat(s.fontSize), uPx: parseFloat(u.fontSize),
                sCol: s.color, uCol: u.color };
     })`);
  for (const [i, w] of weights.entries()) {
    assert(w.uPx >= w.sPx, `the uncertainty is not set smaller than the support (card ${i + 1})`,
      `${w.uPx} vs ${w.sPx}`);
    assert(w.uCol === w.sCol, `the uncertainty is not set lighter than the support (card ${i + 1})`,
      `${w.uCol} vs ${w.sCol}`);
  }

  // ------------------------------------------- no tone ever lands on a person
  phase("tones are on work, never on people");
  const prose = await p.eval(
    `[...document.querySelectorAll('.card__happened')].map(e => getComputedStyle(e).color)`);
  assert(new Set(prose).size === 1,
    "the sentence naming a person is the same colour on every card, whatever the card's tone",
    JSON.stringify(prose));

  // The tone reaches exactly two things: the card's left rule and its kind
  // label. Nothing else on a card may take its colour from the tone.
  const toned = await p.eval(
    `[...document.querySelectorAll('.card')].flatMap(c => {
       const rule = getComputedStyle(c).borderLeftColor;
       return [...c.querySelectorAll('*')]
         .filter(e => !e.classList.contains('card__kind'))
         .filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
         .filter(e => getComputedStyle(e).color === rule)
         .map(e => e.className || e.tagName.toLowerCase());
     })`);
  assert(toned.length === 0, "no text other than the kind label takes the card's tone",
    JSON.stringify(toned));

  // ----------------------------------------- suppression is accounted for
  phase("suppression says what it looked at");
  const quiet = await body();
  for (const line of QUIET.lines) {
    assert(shows(quiet, line.id), "the quiet list says what was checked", line.id.slice(0, 40));
  }

  // ------------------------------------------------------ contrast, measured
  phase("contrast, measured");
  for (const [w, h, label] of [[1280, 1000, "desktop"], [390, 844, "mobile"]]) {
    await p.viewport(w, h);
    for (const lang of ["id", "en"]) {
      await p.goto(BASE + `?lang=${lang}`);
      const text = await p.eval(CONTRAST_EXPR);
      assert(text.measured > 0, `contrast probe measured something (${label}/${lang})`,
        JSON.stringify(text));
      assert(text.bad.length === 0, `contrast (${label}/${lang})`, JSON.stringify(text.bad));
      const ui = await p.eval(NON_TEXT);
      assert(ui.measured > 0, `non-text probe measured something (${label}/${lang})`,
        JSON.stringify(ui));
      assert(ui.bad.length === 0, `non-text contrast (${label}/${lang})`, JSON.stringify(ui.bad));
    }
  }

  // ------------------------------------------------------- readable surface
  phase("type, targets and reflow");
  await p.viewport(1280, 1000);
  await p.goto(BASE);
  const small = await p.eval(`[...document.querySelectorAll('body *')]
    .filter(e => e.offsetParent && !e.closest('.sr')
      && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
    .map(e => ({ el: e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className
        ? '.' + e.className.trim().split(/\\s+/).join('.') : ''),
        px: parseFloat(getComputedStyle(e).fontSize) }))
    .filter(x => x.px > 0 && x.px < 14)`);
  assert(small.length === 0, "no text under 14px", JSON.stringify(small));

  const targets = await p.eval(`[...document.querySelectorAll('button, a')]
    .map(e => ({ el: e.textContent.trim().slice(0, 24),
                 w: Math.round(e.getBoundingClientRect().width),
                 h: Math.round(e.getBoundingClientRect().height) }))
    .filter(x => x.h > 0 && (x.h < 44 || x.w < 44))`);
  assert(targets.length === 0, "every target is at least 44px", JSON.stringify(targets));

  const h1 = await p.eval("document.querySelectorAll('h1').length");
  assert(h1 === 1, "exactly one h1", String(h1));

  for (const [w, label] of [[320, "320px"], [390, "390px"], [768, "768px"], [1440, "1440px"]]) {
    await p.viewport(w, 900);
    await p.goto(BASE);
    const over = await p.eval(
      "document.documentElement.scrollWidth - document.documentElement.clientWidth");
    assert(over <= 0, `no horizontal overflow at ${label}`, String(over));
  }

  // ------------------------------------------------------ both languages
  phase("both languages");
  await p.viewport(1280, 1000);
  await p.goto(BASE + "?lang=en");
  const en = await body();
  assert(shows(en, FRAME.question.en), "the English edition renders", en.slice(0, 80));
  assert((await p.eval("document.documentElement.lang")) === "en",
    "html lang follows the content so a screen reader changes voice");
  await p.eval(`[...document.querySelectorAll('#lang button')].find(b => b.textContent === 'ID').click()`);
  await p.settle();
  assert(shows(await body(), FRAME.question.id), "the switch returns to Indonesian");
  assert((await p.eval("document.documentElement.lang")) === "id", "and html lang follows back");

  // ------------------------------------------- nothing is kept, nothing sent
  phase("keeps nothing, sends nothing");
  const storage = await p.eval(`(async () => ({
    local: localStorage.length, session: sessionStorage.length,
    cookie: document.cookie,
    dbs: (indexedDB.databases ? (await indexedDB.databases()).length : 0),
  }))()`, true);
  assert(storage.local === 0 && storage.session === 0 && storage.cookie === "" && storage.dbs === 0,
    "a sample page keeps nothing about whoever reviews it", JSON.stringify(storage));
  const external = p.requests.filter((u) => !u.startsWith(BASE) && !u.startsWith("data:"));
  assert(external.length === 0, "no request left the page", external.join(", "));

  assert(p.consoleErrors.length === 0, "no uncaught error in the run",
    p.consoleErrors.join(" | "));

  if (SHOTS) {
    phase("screens");
    await rm(SHOT_DIR, { recursive: true, force: true });
    await mkdir(SHOT_DIR, { recursive: true });
    for (const [w, h, tag, lang] of [
      [1280, 1500, "desktop-id", "id"], [1280, 1500, "desktop-en", "en"],
      [390, 2000, "mobile-id", "id"],
    ]) {
      await p.viewport(w, h);
      await p.goto(BASE + `?lang=${lang}`);
      await p.screenshot(join(SHOT_DIR, `${tag}.png`));
    }
  }
} catch (e) {
  fail("the run threw", e.message);
} finally {
  browser.kill();
  await site.close();
}

if (fails.length) {
  console.error(`\nview FAILED — ${fails.length} problem(s), ${checks} checks passed\n`);
  for (const f of fails) console.error("  " + f);
  process.exit(1);
}
console.log(`view OK — ${checks} checks in a real browser: chain complete and in order on every ` +
  `card, no tone on a person, contrast measured at two widths in both languages`);
