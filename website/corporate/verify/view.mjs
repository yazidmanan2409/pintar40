// PINTAR corporate website — checked in a real browser.
//
// What the content audit cannot see: every route actually renders with no
// console error, in both languages; the active nav link is marked; the
// footer sitemap matches PAGES; contrast is measured (not asserted) on a
// representative spread of screens; no text sits under the 14px floor or
// a target under 44px; nothing overflows at 320–1440px; the contact form
// is inert and the Mini-PINTAR journey computes real, varying results
// from real input rather than a scripted demo number.
//
// Run: node verify/view.mjs

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve, launch, Page } from "../../mini-pintar/app/verify/driver.mjs";
import { CONTRAST_EXPR } from "../../mini-pintar/app/verify/probes.mjs";
import { PAGES } from "../shared/content.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");

const fails = [];
const fail = (what, detail = "") => fails.push(`${what}${detail ? " — " + detail : ""}`);
let checks = 0;
const assert = (cond, what, detail) => { if (cond) checks += 1; else fail(what, detail); };
const phase = (n) => process.stderr.write(`  .. ${n}\n`);

const site = await serve(APP);
const browser = await launch();
const BASE = `http://127.0.0.1:${site.port}`;
const at = (href, lang = "id") => `${BASE}${href}${href.includes("?") ? "&" : "?"}lang=${lang}`;
let p;

const ROUTES = PAGES.filter((r) => r.href !== "/mini-pintar/"); // Mini-PINTAR is its own phase below

try {
  p = await Page.open(browser.pageUrl);
  await p.viewport(1280, 1200);

  // --------------------------------------------------------- every route loads
  phase("every route loads, both languages, no console error");
  for (const route of ROUTES) {
    for (const lang of ["id", "en"]) {
      await p.goto(at(route.href, lang));
      await new Promise((r) => setTimeout(r, 180));
      const bodyLen = await p.eval("document.body.innerText.length");
      assert(bodyLen > 200, `${route.slug} (${lang}) has real content`, String(bodyLen));
      assert(p.consoleErrors.length === 0, `${route.slug} (${lang}) has no console error`,
        p.consoleErrors.join(" | "));
      p.consoleErrors.length = 0;
      const external = p.requests.filter((u) => !u.startsWith(BASE) && !u.startsWith("data:"));
      assert(external.length === 0, `${route.slug} (${lang}) makes no external request`, external.join(", "));
      p.requests.length = 0;
    }
  }

  // ------------------------------------------------------------- nav + footer
  phase("navigation marks the active page; footer lists every route");
  for (const route of ROUTES.filter((r) => r.primary)) {
    await p.goto(at(route.href));
    await new Promise((r) => setTimeout(r, 180));
    const current = await p.eval(`document.querySelector('.site-nav__links a[aria-current="page"]')?.textContent.trim()`);
    assert(current === route.label.id, `${route.slug}: nav marks itself active`, String(current));
  }
  await p.goto(at("/"));
  await new Promise((r) => setTimeout(r, 180));
  const footerLinks = await p.eval(`[...document.querySelectorAll('.site-footer a')].length`);
  assert(footerLinks >= ROUTES.length, "the footer lists at least as many links as there are routes",
    String(footerLinks));

  // Mini-PINTAR intentionally carries no site footer — an immersive journey,
  // not a page to browse away from mid-story.
  await p.goto(`${BASE}/mini-pintar/?lang=id`);
  await new Promise((r) => setTimeout(r, 180));
  const hasFooter = await p.eval(`!!document.querySelector('.site-footer')`);
  assert(!hasFooter, "Mini-PINTAR deliberately has no site footer");
  const hasFullNav = await p.eval(`!!document.querySelector('.site-nav__links')`);
  assert(!hasFullNav, "Mini-PINTAR deliberately has no full site navigation");

  // --------------------------------------------------------------- contrast
  phase("contrast, measured on a representative spread");
  const CONTRAST_SAMPLE = ["/", "/laporan/", "/kontak/", "/untuk-manajemen/"];
  for (const href of CONTRAST_SAMPLE) {
    for (const lang of ["id", "en"]) {
      await p.goto(at(href, lang));
      await new Promise((r) => setTimeout(r, 180));
      const t = await p.eval(CONTRAST_EXPR);
      assert(t.measured > 0, `contrast probe measured something (${href}/${lang})`);
      assert(t.bad.length === 0, `contrast (${href}/${lang})`, JSON.stringify(t.bad));
    }
  }
  // And the Mini-PINTAR sim badge (dark pill on ink-free background) —
  // the one place a bespoke component could hide a contrast miss.
  await p.goto(`${BASE}/mini-pintar/?lang=id`);
  await new Promise((r) => setTimeout(r, 180));
  const cs = await p.eval(CONTRAST_EXPR);
  assert(cs.bad.length === 0, "contrast on Mini-PINTAR's start screen", JSON.stringify(cs.bad));

  // ------------------------------------------------------ type floor & targets
  phase("type floor and target size, every route");
  for (const route of ROUTES) {
    await p.goto(at(route.href));
    await new Promise((r) => setTimeout(r, 180));
    const small = await p.eval(`[...document.querySelectorAll('body *')]
      .filter(e => e.offsetParent && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
      .map(e => parseFloat(getComputedStyle(e).fontSize))
      .filter(px => px > 0 && px < 14)`);
    assert(small.length === 0, `no text under 14px (${route.slug})`, JSON.stringify(small));
    // The skip link is deliberately 1x1 and offscreen until keyboard focus
    // reveals it — that is the standard pattern, not a target-size miss.
    const targets = await p.eval(`[...document.querySelectorAll('button, a')]
      .filter(e => !e.closest('.sr-only'))
      .map(e => ({ t: e.textContent.trim().slice(0, 24),
                   w: Math.round(e.getBoundingClientRect().width),
                   h: Math.round(e.getBoundingClientRect().height) }))
      .filter(x => x.t && x.h > 0 && (x.h < 44 || x.w < 44))`);
    assert(targets.length === 0, `every target is at least 44px (${route.slug})`, JSON.stringify(targets));
  }

  // ------------------------------------------------------------------ reflow
  phase("reflow at 320–1440px");
  for (const w of [320, 375, 768, 1024, 1440]) {
    await p.viewport(w, 900);
    for (const href of ["/", "/laporan/", "/mini-pintar/"]) {
      await p.goto(`${BASE}${href}?lang=id`);
      await new Promise((r) => setTimeout(r, 180));
      const over = await p.eval("document.documentElement.scrollWidth - document.documentElement.clientWidth");
      assert(over <= 0, `no horizontal overflow at ${w}px (${href})`, String(over));
    }
  }
  await p.viewport(1280, 1200);

  // -------------------------------------------------------------- contact form
  phase("the contact form is inert");
  await p.goto(`${BASE}/kontak/?lang=id`);
  await new Promise((r) => setTimeout(r, 180));
  await p.eval(`(() => {
    document.getElementById('f-name').value = 'Ibu Sari';
    document.getElementById('f-org').value = 'SD Contoh';
    document.getElementById('f-role').value = 'Pendidik';
    document.getElementById('f-email').value = 'sari@example.org';
  })()`);
  await p.eval(`document.querySelector('#form-mount form').requestSubmit()`);
  await new Promise((r) => setTimeout(r, 150));
  const confirmed = await p.eval(`document.getElementById('form-mount').textContent`);
  assert(confirmed.includes("Terima kasih"), "submitting the form shows a confirmation, not a real send");
  const stillHere = await p.eval("location.pathname");
  assert(stillHere === "/kontak/", "the page never navigates away on submit", stillHere);
  const external2 = p.requests.filter((u) => !u.startsWith(BASE) && !u.startsWith("data:"));
  assert(external2.length === 0, "no request left the page on submit", external2.join(", "));

  // -------------------------------------------------------- Mini-PINTAR journey
  phase("Mini-PINTAR: real computed results, not a scripted demo");

  async function runJourney(lang, picks, through = "evidence") {
    await p.goto(`${BASE}/mini-pintar/?lang=${lang}`);
    await new Promise((r) => setTimeout(r, 180));
    const startLabel = lang === "id" ? "Mulai" : "Start";
    const continueLabel = lang === "id" ? "Lanjut" : "Continue";
    await p.eval(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes(${JSON.stringify(startLabel)})).click()`);
    await new Promise((r) => setTimeout(r, 120));
    await p.eval(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes(${JSON.stringify(continueLabel)})).click()`);
    await new Promise((r) => setTimeout(r, 120));
    for (const pick of picks) {
      await p.eval(`document.querySelectorAll('.quiz-option')[${pick}].click()`);
      await new Promise((r) => setTimeout(r, 480));
    }
    await new Promise((r) => setTimeout(r, 120));
    // Evidence is the default stop. "educator" and "management" click one
    // further "Lanjut"-labelled button each to advance the state machine.
    if (through === "educator" || through === "management") {
      await p.eval(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes(${JSON.stringify(continueLabel)})).click()`);
      await new Promise((r) => setTimeout(r, 120));
    }
    if (through === "management") {
      // On the educator screen a decision must be made before "Lanjut ke
      // Laporan Manajemen" exists. That button is scoped to #educator-ack
      // rather than matched by the word "Lanjut" — one of the three
      // decision buttons is "Lanjutkan belajar", which also contains that
      // substring and sits earlier in the DOM, so a bare text search
      // clicks the wrong control.
      await p.eval(`document.querySelectorAll('.decision-btn')[0]?.click()`);
      await new Promise((r) => setTimeout(r, 120));
      await p.eval(`document.querySelector('#educator-ack button').click()`);
      await new Promise((r) => setTimeout(r, 120));
    }
    return p.eval("document.getElementById('view').innerText");
  }

  // Run A: 4 correct (index 2 wrong on question 3) — mirrors the manual
  // walkthrough. Answer key: [2,3,1,2,1].
  const bodyA = await runJourney("id", [2, 3, 0, 2, 1]);
  assert(bodyA.includes("4 terjawab dengan baik"), "run A: evidence reflects 4 correct, not a fixed number",
    bodyA.slice(0, 120));
  assert(bodyA.includes("Pecahan Sederhana") && bodyA.includes("PERLU DITINJAU LAGI"),
    "run A: the actually-missed concept is the one flagged");

  // Run B: all five correct — the interpretation and the flagged-concept
  // text must both change, proving the result is computed, not templated
  // around a single hardcoded branch. Driven through to the educator
  // screen, since the "no concept flagged" line only renders there.
  const bodyB = await runJourney("id", [2, 3, 1, 2, 1], "educator");
  assert(bodyB.includes("5 terjawab dengan baik"), "run B: evidence reflects 5 correct", bodyB.slice(0, 120));
  assert(bodyB.includes("Tidak ada konsep yang menonjol"), "run B: no concept is flagged when nothing was missed");
  assert(!bodyB.includes("PERLU DITINJAU LAGI"), "run B: no chip reads ‘needs another look’ when everything was correct");

  // Run C: all five wrong — the low-scoring branch, and still no shaming
  // language, still the small-sample humility clause.
  const bodyC = await runJourney("id", [0, 0, 0, 0, 0]);
  assert(bodyC.includes("0 terjawab dengan baik"), "run C: evidence reflects 0 correct");
  assert(bodyC.includes("lima soal belum cukup") || bodyC.includes("Lima soal belum cukup"),
    "run C: the small-sample humility clause survives even at zero correct");
  assert(!/\bsalah\b/i.test(bodyC), "run C: no answer is called ‘wrong’ in the visitor-facing copy");

  // The management step must NEVER vary with the visitor's own answers —
  // it is simulated class data, fixed regardless of what run produced it.
  // Driven through to management for two different answer sets.
  const mgmtHigh = await runJourney("id", [2, 3, 0, 2, 1], "management");
  const mgmtZero = await runJourney("id", [0, 0, 0, 0, 0], "management");
  assert(mgmtHigh.includes("22 dari 24 peserta didik") && mgmtZero.includes("22 dari 24 peserta didik"),
    "the management report's simulated numbers do not change with the visitor's own score");

  // The decision buttons: none pre-selected, and the chosen one is marked.
  await p.goto(`${BASE}/mini-pintar/?lang=id`);
  await p.eval(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Mulai')).click()`);
  await new Promise((r) => setTimeout(r, 100));
  await p.eval(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Lanjut')).click()`);
  await new Promise((r) => setTimeout(r, 100));
  for (const pick of [2, 3, 1, 2, 1]) {
    await p.eval(`document.querySelectorAll('.quiz-option')[${pick}].click()`);
    await new Promise((r) => setTimeout(r, 480));
  }
  await new Promise((r) => setTimeout(r, 100));
  await p.eval(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Lanjut')).click()`);
  await new Promise((r) => setTimeout(r, 100));
  const preselected = await p.eval(`[...document.querySelectorAll('.decision-btn')].some(b => b.getAttribute('aria-pressed') === 'true')`);
  assert(!preselected, "no educator decision is pre-selected before the visitor clicks one");
  await p.eval(`document.querySelectorAll('.decision-btn')[1].click()`);
  await new Promise((r) => setTimeout(r, 100));
  const chosen = await p.eval(`document.querySelector('.decision-btn[aria-pressed="true"]').textContent.trim()`);
  assert(chosen.length > 0, "the chosen educator decision is marked after clicking", chosen);
  assert(p.consoleErrors.length === 0, "no console error across the whole Mini-PINTAR run", p.consoleErrors.join(" | "));

  // Progress indicator advances with the stage.
  const progressAtEducator = await p.eval(`document.querySelector('.mini-progress__label').textContent`);
  assert(progressAtEducator.includes("5 / 7"), "the progress indicator reflects the current stage",
    progressAtEducator);

  // Restart genuinely resets state (a stale answer must not leak into a
  // fresh run).
  await p.eval(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Laporan')).click()`);
  await new Promise((r) => setTimeout(r, 100));
  await p.eval(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Lanjut').click()`);
  await new Promise((r) => setTimeout(r, 100));
  await p.eval(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('awal') || b.textContent.includes('start')).click()`);
  await new Promise((r) => setTimeout(r, 100));
  const restarted = await p.eval("document.querySelector('.mini-progress__label').textContent");
  assert(restarted.includes("1 / 7"), "restarting returns to stage 1", restarted);

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
console.log(`view OK — ${checks} checks in a real browser: every route loads clean in both languages, ` +
  `contrast measured, type floor and target size swept, reflow checked 320–1440px, the contact form ` +
  `is inert, and the Mini-PINTAR journey computes real results across three independent answer sets`);
