// Management role view — checked in a real browser.
//
// The adversarial axes that only a rendered page can answer: whether one
// management decision is visually preferred to the others, whether the home
// has become a dashboard, whether any route to an individual response exists
// on screen, and whether the instrument is still educator feedback.
//
// Run: node verify/view.mjs [--shots]

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, rm } from "node:fs/promises";
import { serve, launch, Page } from "../../../../website/mini-pintar/app/verify/driver.mjs";
import { CONTRAST_EXPR, nonTextExpr } from "../../../../website/mini-pintar/app/verify/probes.mjs";
import { CHAIN, HOME, ITEMS, UMPAN } from "../content.js";

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
const shows = (h, n) => norm(h).includes(norm(n));

const ALL_SCREENS = ["beranda", "umpan-mulai", "umpan-pertanyaan", "umpan-terbit",
                     "umpan-hasil", "umpan-tipis"];

const NON_TEXT = nonTextExpr([
  ["decision-waiting rule", ".card--attention", "borderLeftColor"],
  ["referred rule", ".card--blocked", "borderLeftColor"],
  ["worth-knowing rule", ".card--info", "borderLeftColor"],
]);

const site = await serve(APP);
const browser = await launch();
const BASE = `http://127.0.0.1:${site.port}/`;
const at = (s, lang = "id") => `${BASE}?screen=${s}&lang=${lang}`;
let p;

try {
  p = await Page.open(browser.pageUrl);
  const body = () => p.eval("document.body.innerText");
  await p.viewport(1280, 1100);

  // ------------------------------------------------------- says what it is
  phase("says what it is");
  await p.goto(BASE);
  const first = await body();
  // R1: adopted as a concept, not authorized to build. Both halves, on the
  // page, every screen.
  assert(shows(first, "diterima sebagai gagasan"), "the banner says the concept is adopted");
  assert(shows(first, "belum boleh dibangun"),
    "the banner says it is not authorized to build");
  assert(shows(first, "perlu ADR"), "the banner says an ADR comes first");
  assert(await p.eval(`document.querySelector('.sample') === document.body.firstElementChild`),
    "the banner is the first thing in the document");
  assert(await p.eval(`!!document.querySelector('.sample .screens')`),
    "the screen switcher is inside the sample banner, not in the page chrome");

  // ------------------------------------ no management decision is preferred
  //
  // Every option in a decision row must be visually identical. A primary
  // button here would be PINTAR choosing, and "no action now" being the
  // quiet one at the end is the same mistake wearing modesty.
  phase("no decision is visually preferred");
  for (const s of ["beranda", "umpan-hasil"]) {
    await p.goto(at(s));
    const rows = await p.eval(`[...document.querySelectorAll('.decide__row')].map(row =>
      [...row.querySelectorAll('button')].map(b => {
        const c = getComputedStyle(b);
        return { t: b.textContent.trim(),
                 style: [c.backgroundColor, c.color, c.borderTopColor, c.borderTopWidth,
                         c.fontWeight, c.fontSize, c.textDecorationLine].join('|'),
                 w: Math.round(b.getBoundingClientRect().height),
                 focus: b.hasAttribute('autofocus') || b.getAttribute('aria-pressed') === 'true' };
      }))`);
    for (const [i, row] of rows.entries()) {
      const styles = new Set(row.map((b) => b.style));
      assert(styles.size === 1,
        `every option in a decision row looks the same (${s}, row ${i + 1})`,
        JSON.stringify(row.map((b) => `${b.t}:${b.style}`)));
      assert(!row.some((b) => b.focus),
        `no option is preselected (${s}, row ${i + 1})`);
      const heights = new Set(row.map((b) => b.w));
      assert(heights.size === 1, `every option is the same height (${s}, row ${i + 1})`,
        JSON.stringify([...heights]));
    }
    assert(rows.length > 0, `a decision row was found on ${s}`);
  }

  // ----------------------------------------------------- not a dashboard
  //
  // No tiles, no counters, no element whose whole content is a number. A
  // figure that stands alone is a metric, and a page of metrics is the
  // dashboard this view exists not to be.
  phase("not a dashboard");
  await p.goto(at("beranda"));
  const bare = await p.eval(`[...document.querySelectorAll('#view *')]
    .filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
    .map(e => e.textContent.trim())
    .filter(t => /^[\\d.,%]+$/.test(t))`);
  assert(bare.length === 0, "no element on the home is a bare number", JSON.stringify(bare));
  const cards = await p.eval("document.querySelectorAll('#view .card').length");
  assert(cards <= 4, "the home does not become a list of everything", String(cards));
  const charts = await p.eval(
    `document.querySelectorAll('#view svg, #view canvas, #view progress, #view meter').length`);
  assert(charts === 0, "there is no chart on the home", String(charts));

  // Not everything carries a decision, which is how the page answers
  // "is anything waiting for me" without a counter.
  const withDecisions = await p.eval(
    "document.querySelectorAll('#view .card .decide').length");
  assert(withDecisions === ITEMS.filter((i) => i.actions.length).length,
    "only the items that wait on someone carry a decision row", String(withDecisions));

  // ------------------------------------- no route to an individual response
  phase("no individual response is reachable");
  for (const s of ALL_SCREENS) {
    for (const lang of ["id", "en"]) {
      await p.goto(at(s, lang));
      const text = await body();
      // Nothing on any screen names one person who answered.
      for (const re of [/\bsiswa ke-\d/i, /\bstudent #\d/i, /\bpendidik ke-\d/i,
                        /\beducator #\d/i, /\bresponden \d/i, /\brespondent \d/i]) {
        assert(!re.test(text), `no individual respondent is named (${s}/${lang})`, String(re));
      }
      const controls = await p.eval(
        `[...document.querySelectorAll('#view button, #view a')].map(e => e.textContent.trim())`);
      for (const c of controls) {
        assert(!/lembar jawaban|answer sheet|per siswa|per student|per pendidik|per educator|buka jawaban|open answers/i
          .test(c), `no control opens an individual answer sheet (${s}/${lang})`, c);
      }
    }
  }
  // And the result page says so in words, which is where a reader looks.
  await p.goto(at("umpan-hasil"));
  assert(shows(await body(), UMPAN.result.bounding.id),
    "the result states that individual sheets are available to nobody");

  // ------------------------------------- feedback follows the relationship
  //
  // R2/R3 on the rendered page: the Management instrument asks educators
  // about their own working experience. The only screen that may speak
  // about students is the one that says where student feedback goes
  // instead — and it must say it, in both languages.
  phase("the Management instrument is educator feedback");
  for (const lang of ["id", "en"]) {
    await p.goto(at("umpan-mulai", lang));
    const startText = await body();
    for (const [what, pair] of [["the direction of feedback", UMPAN.start.relationship],
                                ["the escalation path as undecided", UMPAN.start.escalation],
                                ["the record-class boundary", UMPAN.start.separate]]) {
      assert(shows(startText, pair[lang]), `the start screen states ${what} (${lang})`);
    }
    const student = lang === "id" ? /\bsiswa\b/i : /\bstudents?\b/i;
    for (const s2 of ["umpan-pertanyaan", "umpan-terbit", "umpan-hasil", "umpan-tipis"]) {
      await p.goto(at(s2, lang));
      const t2 = await p.eval("document.getElementById('view').innerText");
      assert(!student.test(t2),
        `the feedback experience does not put students back in as respondents (${s2}/${lang})`,
        (t2.match(student) || [""])[0]);
    }
  }

  // --------------------------------------------- the chain, on every card
  phase("the doctrine chain");
  await p.goto(at("beranda"));
  const chains = await p.eval(
    `[...document.querySelectorAll('.card')].map(c =>
       [...c.querySelectorAll('.chain dt')].map(d => d.textContent.trim()))`);
  for (const [i, labels] of chains.entries()) {
    assert(labels.length === 3 && shows(labels[0], CHAIN.supports.id)
      && shows(labels[1], CHAIN.unknown.id) && shows(labels[2], CHAIN.step.id),
      `the chain is in order on card ${i + 1}`, JSON.stringify(labels));
  }
  // The feedback result carries it too — the same grammar, not a report.
  await p.goto(at("umpan-hasil"));
  const resultChain = await p.eval(
    `[...document.querySelectorAll('.chain dt')].map(d => d.textContent.trim())`);
  assert(resultChain.length === 3, "the feedback result carries the chain",
    JSON.stringify(resultChain));

  // ------------------------------------ tones are on work, never on people
  phase("tones are on work, never on people");
  await p.goto(at("beranda"));
  const prose = await p.eval(
    `[...document.querySelectorAll('.card__happened')].map(e => getComputedStyle(e).color)`);
  assert(new Set(prose).size === 1,
    "the sentence naming a class or an educator is the same colour on every card",
    JSON.stringify(prose));
  const toned = await p.eval(`[...document.querySelectorAll('.card')].flatMap(c => {
    const rule = getComputedStyle(c).borderLeftColor;
    return [...c.querySelectorAll('*')]
      .filter(e => !e.classList.contains('card__kind'))
      .filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
      .filter(e => getComputedStyle(e).color === rule)
      .map(e => e.className || e.tagName.toLowerCase());
  })`);
  assert(toned.length === 0, "no text but the kind label takes a card's tone",
    JSON.stringify(toned));

  // ----------------------------------------- the anonymity contract, on screen
  phase("the anonymity contract");
  for (const lang of ["id", "en"]) {
    await p.goto(at("umpan-terbit", lang));
    const text = await body();
    for (const term of UMPAN.publish.terms) {
      assert(shows(text, term[lang]), `the contract is stated before publishing (${lang})`,
        term[lang].slice(0, 40));
    }
    // It is said BEFORE the publish control, not after it.
    const order = await p.eval(`(() => {
      const terms = document.querySelector('.terms');
      const btn = document.querySelector('.buttons button');
      return terms && btn
        ? (terms.compareDocumentPosition(btn) & Node.DOCUMENT_POSITION_FOLLOWING) > 0 : false;
    })()`);
    assert(order, `the contract comes before the publish control (${lang})`);
  }
  // And the thin-response state names no threshold.
  for (const lang of ["id", "en"]) {
    await p.goto(at("umpan-tipis", lang));
    const t = await p.eval("document.getElementById('view').innerText");
    assert(shows(t, UMPAN.thin.headline[lang]), `the safe-threshold sentence is shown (${lang})`);
    assert(shows(t, UMPAN.thin.unresolved[lang]),
      `the page says the threshold is unresolved (${lang})`);
  }

  // ------------------------------------------------------ contrast, measured
  phase("contrast, measured");
  for (const [w, h, label] of [[1280, 1100, "desktop"], [390, 844, "mobile"]]) {
    await p.viewport(w, h);
    for (const s of ALL_SCREENS) {
      for (const lang of ["id", "en"]) {
        await p.goto(at(s, lang));
        const t = await p.eval(CONTRAST_EXPR);
        assert(t.measured > 0, `contrast probe measured something (${label}/${s}/${lang})`);
        assert(t.bad.length === 0, `contrast (${label}/${s}/${lang})`, JSON.stringify(t.bad));
      }
    }
  }
  await p.viewport(1280, 1100);
  await p.goto(at("beranda"));
  const ui = await p.eval(NON_TEXT);
  assert(ui.bad.length === 0, "non-text contrast on the card rules", JSON.stringify(ui.bad));

  // ------------------------------------------------------ readable surface
  phase("type, targets and reflow");
  for (const s of ALL_SCREENS) {
    await p.goto(at(s));
    const small = await p.eval(`[...document.querySelectorAll('body *')]
      .filter(e => e.offsetParent && !e.closest('.sr')
        && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
      .map(e => ({ el: e.tagName.toLowerCase(), px: parseFloat(getComputedStyle(e).fontSize) }))
      .filter(x => x.px > 0 && x.px < 14)`);
    assert(small.length === 0, `no text under 14px (${s})`, JSON.stringify(small));
    const targets = await p.eval(`[...document.querySelectorAll('button, a, summary')]
      .map(e => ({ t: e.textContent.trim().slice(0, 20),
                   w: Math.round(e.getBoundingClientRect().width),
                   h: Math.round(e.getBoundingClientRect().height) }))
      .filter(x => x.h > 0 && (x.h < 44 || x.w < 44))`);
    assert(targets.length === 0, `every target is at least 44px (${s})`, JSON.stringify(targets));
  }
  for (const [w, label] of [[320, "320px"], [390, "390px"], [768, "768px"], [1440, "1440px"]]) {
    await p.viewport(w, 900);
    for (const s of ["beranda", "umpan-hasil"]) {
      await p.goto(at(s));
      const over = await p.eval(
        "document.documentElement.scrollWidth - document.documentElement.clientWidth");
      assert(over <= 0, `no horizontal overflow at ${label} (${s})`, String(over));
    }
  }

  // ------------------------------------------------------ both languages
  phase("both languages");
  await p.viewport(1280, 1100);
  await p.goto(at("beranda", "en"));
  assert(shows(await body(), HOME.headline.en), "the English edition renders");
  assert((await p.eval("document.documentElement.lang")) === "en", "html lang follows the content");

  // ------------------------------------------- keeps nothing, sends nothing
  phase("keeps nothing, sends nothing");
  const storage = await p.eval(`(async () => ({
    local: localStorage.length, session: sessionStorage.length,
    cookie: document.cookie,
    dbs: (indexedDB.databases ? (await indexedDB.databases()).length : 0),
  }))()`, true);
  assert(storage.local === 0 && storage.session === 0 && storage.cookie === "" && storage.dbs === 0,
    "a sample page keeps nothing", JSON.stringify(storage));
  const external = p.requests.filter((u) => !u.startsWith(BASE) && !u.startsWith("data:"));
  assert(external.length === 0, "no request left the page", external.join(", "));
  assert(p.consoleErrors.length === 0, "no uncaught error", p.consoleErrors.join(" | "));

  if (SHOTS) {
    phase("screens");
    await rm(SHOT_DIR, { recursive: true, force: true });
    await mkdir(SHOT_DIR, { recursive: true });
    for (const s of ALL_SCREENS) {
      await p.viewport(1280, 1500);
      await p.goto(at(s));
      await p.screenshot(join(SHOT_DIR, `desktop-${s}.png`));
    }
    await p.viewport(1280, 1500);
    await p.goto(at("beranda", "en"));
    await p.screenshot(join(SHOT_DIR, "desktop-en-beranda.png"));
    for (const s of ["beranda", "umpan-hasil"]) {
      await p.viewport(390, 1900);
      await p.goto(at(s));
      await p.screenshot(join(SHOT_DIR, `mobile-${s}.png`));
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
console.log(`view OK — ${checks} checks in a real browser: no preferred decision, no dashboard, ` +
  `no route to an individual response, contrast measured across six screens in two languages`);
