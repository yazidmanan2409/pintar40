// Parent role view — checked in a real browser.
//
// Two of these checks exist only because this is a parent's page: that
// nothing on it changes colour with the news about their child, and that
// the sentence telling them whether they need to do anything is on screen
// without scrolling on a phone.
//
// Run: node verify/view.mjs [--shots]

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, rm } from "node:fs/promises";
import { serve, launch, Page } from "../../../../website/mini-pintar/app/verify/driver.mjs";
import { CONTRAST_EXPR } from "../../../../website/mini-pintar/app/verify/probes.mjs";
import { SAMPLE, UI, SECTIONS, RANKING, NOTE, STATES } from "../content.js";

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

const site = await serve(APP);
const browser = await launch();
const BASE = `http://127.0.0.1:${site.port}/`;
const at = (state, lang = "id") => `${BASE}?lang=${lang}&state=${state}`;
let p;

try {
  p = await Page.open(browser.pageUrl);
  const body = () => p.eval("document.body.innerText");

  // ------------------------------------------------------- says what it is
  phase("says what it is");
  await p.viewport(1280, 1000);
  await p.goto(BASE);
  const first = await body();
  assert(shows(first, SAMPLE.label.id), "the sample banner is on the page");
  assert(shows(first, "belum dibangun"), "the banner says the view is not built");
  assert(shows(first, "bukan data sekolah"), "the banner says the data is not a school's");
  assert(await p.eval(`document.querySelector('.sample') === document.body.firstElementChild`),
    "the banner is the first thing in the document");
  // The state switcher is a review affordance. It has to live inside the
  // sample banner so it cannot be read as something a parent would see.
  assert(await p.eval(`!!document.querySelector('.sample .states')`),
    "the state switcher is inside the sample banner, not in the page chrome");

  // ------------------------------------------- nothing is coloured by the news
  //
  // The decisive check for "no traffic-light classification of the child".
  // Render every state and compare the complete set of computed colours in
  // the page body. If any of them differs, something on this page changes
  // appearance according to how a child is doing, whatever it is called.
  phase("nothing changes colour with the news");
  const palettes = [];
  for (const s of STATES) {
    await p.goto(at(s.id));
    palettes.push(await p.eval(`(() => {
      const seen = new Set();
      for (const el of document.querySelectorAll('main *')) {
        const cs = getComputedStyle(el);
        seen.add(cs.color);
        if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') seen.add('bg:' + cs.backgroundColor);
        for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
          if (parseFloat(cs['border' + side + 'Width']) > 0)
            seen.add('border:' + cs['border' + side + 'Color']);
        }
      }
      return [...seen].sort();
    })()`));
  }
  const [a, ...rest] = palettes.map((x) => JSON.stringify(x));
  assert(rest.every((x) => x === a),
    "every state uses exactly the same colours — nothing on the page is a status light",
    palettes.map((x, i) => `${STATES[i].id}:${x.length}`).join(" "));

  // And the headline is the same ink whatever it says.
  const headlineColours = [];
  for (const s of STATES) {
    await p.goto(at(s.id));
    headlineColours.push(await p.eval("getComputedStyle(document.querySelector('h1')).color"));
  }
  assert(new Set(headlineColours).size === 1,
    "the headline is the same colour in every state", JSON.stringify(headlineColours));

  // A parent never sees a state NAME. Three named states would be a
  // three-band classification however carefully the sentences were
  // written; what makes them not one is that the names exist only in this
  // review switcher, and the parent gets a sentence instead.
  phase("the parent never sees a state name");
  for (const s of STATES) {
    for (const lang of ["id", "en"]) {
      await p.goto(at(s.id, lang));
      const badges = await p.eval(`(() => {
        const names = ${JSON.stringify(STATES.map((x) => x.tab[lang]))}
          .map(n => n.trim().toLowerCase());
        return [...document.querySelectorAll('#view *')]
          .map(e => e.textContent.trim().toLowerCase())
          .filter(t => names.includes(t));
      })()`);
      assert(badges.length === 0,
        `no state is shown to the parent as a label (${s.id}/${lang})`, badges.join(", "));
    }
  }

  // ------------------------------------------ the five-second rule, physically
  //
  // A parent on a phone must be able to read the heading, the sentence
  // under it, and the line saying whether they need to do anything, without
  // scrolling. If the signpost is below the fold the skim rule is a
  // sentence in a document rather than a property of the page.
  phase("the skim fits on a phone");
  await p.viewport(390, 844);
  for (const s of STATES) {
    for (const lang of ["id", "en"]) {
      await p.goto(at(s.id, lang));
      const bottom = await p.eval(
        "document.querySelector('.answer__signpost').getBoundingClientRect().bottom");
      assert(bottom <= 844, `the signpost is above the fold at 390x844 (${s.id}/${lang})`,
        `bottom at ${Math.round(bottom)}px`);
    }
  }

  // ------------------------------------------------- the limit is not hidden
  phase("the limit is not small print");
  await p.viewport(1280, 1000);
  for (const s of STATES) {
    await p.goto(at(s.id));
    const m = await p.eval(`(() => {
      const ps = document.querySelectorAll('.section p');
      const find = [...document.querySelectorAll('.section')]
        .find(x => x.querySelector('.limit'));
      const finding = find.querySelector('p:not(.limit)');
      const limit = find.querySelector('.limit');
      const g = (e) => { const c = getComputedStyle(e);
        return { px: parseFloat(c.fontSize), w: parseInt(c.fontWeight, 10) }; };
      return { finding: g(finding), limit: g(limit), n: ps.length };
    })()`);
    assert(m.limit.px >= m.finding.px,
      `the limit is not set smaller than the finding (${s.id})`,
      `${m.limit.px} vs ${m.finding.px}`);
    assert(m.limit.w >= m.finding.w - 100,
      `the limit is not set much lighter than the finding (${s.id})`,
      `${m.limit.w} vs ${m.finding.w}`);
  }

  // ------------------------------------------ the four questions, in order
  phase("the four questions, in order");
  await p.goto(at("berjalan"));
  const order = await p.eval(
    `[...document.querySelectorAll('#view h1, #view h2')].map(h => h.textContent.trim())`);
  assert(shows(order[0], STATES[0].headline.id), "the answer comes first", order[0]);
  assert(shows(order[1], SECTIONS.supported.id), "then what can be seen", order[1]);
  assert(shows(order[2], SECTIONS.attention.id), "then what needs attention", order[2]);
  assert(shows(order[3], SECTIONS.action.id), "then what you can do", order[3]);
  assert(order.length === 4, "the four questions are the only headings", JSON.stringify(order));
  assert(await p.eval("document.querySelectorAll('h1').length") === 1, "exactly one h1");

  // R3: the ranking answer is on demand, and still there.
  phase("the ranking answer is secondary, and preserved");
  for (const lang of ["id", "en"]) {
    await p.goto(at("berjalan", lang));
    const closed = await p.eval(
      "document.querySelector('.ranking')?.open === false");
    assert(closed, `the ranking answer is closed by default (${lang})`);
    const summary = await p.eval(
      "document.querySelector('.ranking summary')?.textContent.trim()");
    assert(shows(summary, RANKING.heading[lang]),
      `the question a parent would ask is the visible part (${lang})`, String(summary));
    const before = await p.eval("document.getElementById('view').innerText");
    assert(!shows(before, RANKING.body[lang]),
      `the explanation is not on screen until asked for (${lang})`);
    await p.eval("document.querySelector('.ranking summary').click()");
    await p.settle();
    const after = await p.eval("document.getElementById('view').innerText");
    assert(shows(after, RANKING.body[lang]),
      `the explanation is one click away, unchanged (${lang})`, after.slice(-160));
  }

  // R5: the page states no update cadence.
  await p.goto(at("berjalan"));
  const chrome = await p.eval("document.querySelector('.chrome').innerText");
  for (const w of ["diperbarui", "updated", "hari ini", "today"]) {
    assert(!chrome.toLowerCase().includes(w), "the page states no update cadence", w);
  }

  // ---------------------------------------- no identifier, anywhere, ever
  phase("no identifier");
  for (const s of STATES) {
    await p.goto(at(s.id));
    const text = `${await body()} ${await p.eval("location.href")}`;
    for (const re of [/\bNIS\b/, /student\s*id/i, /[0-9a-f]{8}-[0-9a-f]{4}/i, /\b\d{6,}\b/]) {
      assert(!re.test(text), `no identifier on the page or in its url (${s.id})`, String(re));
    }
  }

  // ------------------------------------------------------ contrast, measured
  phase("contrast, measured");
  for (const [w, h, label] of [[1280, 1000, "desktop"], [390, 844, "mobile"]]) {
    await p.viewport(w, h);
    for (const s of STATES) {
      for (const lang of ["id", "en"]) {
        await p.goto(at(s.id, lang));
        const t = await p.eval(CONTRAST_EXPR);
        assert(t.measured > 0, `contrast probe measured something (${label}/${s.id}/${lang})`);
        assert(t.bad.length === 0, `contrast (${label}/${s.id}/${lang})`, JSON.stringify(t.bad));
      }
    }
  }

  // ------------------------------------------------------ readable surface
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
  const targets = await p.eval(`[...document.querySelectorAll('button, a, summary')]
    .map(e => ({ el: e.textContent.trim().slice(0, 20),
                 w: Math.round(e.getBoundingClientRect().width),
                 h: Math.round(e.getBoundingClientRect().height) }))
    .filter(x => x.h > 0 && (x.h < 44 || x.w < 44))`);
  assert(targets.length === 0, "every target is at least 44px", JSON.stringify(targets));

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
  await p.goto(at("berjalan", "en"));
  assert(shows(await body(), STATES[0].headline.en), "the English edition renders");
  assert((await p.eval("document.documentElement.lang")) === "en", "html lang follows the content");
  assert(shows(await body(), NOTE.scope.en), "the scope note renders in English");

  // ------------------------------------------- keeps nothing, sends nothing
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
  assert(p.consoleErrors.length === 0, "no uncaught error", p.consoleErrors.join(" | "));

  if (SHOTS) {
    phase("screens");
    await rm(SHOT_DIR, { recursive: true, force: true });
    await mkdir(SHOT_DIR, { recursive: true });
    for (const s of STATES) {
      for (const [w, h, tag] of [[1280, 1200, "desktop"], [390, 1500, "mobile"]]) {
        await p.viewport(w, h);
        await p.goto(at(s.id));
        await p.screenshot(join(SHOT_DIR, `${tag}-${s.id}.png`));
      }
    }
    await p.viewport(1280, 1200);
    await p.goto(at("berjalan", "en"));
    await p.screenshot(join(SHOT_DIR, "desktop-en-berjalan.png"));
    // The phone fold, with a rule drawn where 844px falls: the five-second
    // rule as a picture rather than a claim.
    await p.viewport(390, 844);
    await p.goto(at("perlu-perhatian"));
    await p.screenshot(join(SHOT_DIR, "fold-390-perlu-perhatian.png"));
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
console.log(`view OK — ${checks} checks in a real browser: identical colours in every state, ` +
  `the skim above the fold at 390px, contrast measured in three states and two languages`);
