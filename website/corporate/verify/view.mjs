// PINTAR corporate website — checked in a real browser.
//
// What the content audit and the canonical check cannot see, because it only
// exists once a browser renders it:
//
//   * the site is served from a SUBFOLDER (/test/corporate/), the way it is
//     actually deployed, and every internal link and asset is relative,
//     lands inside that folder on a real route, and carries the language;
//   * every route renders with no console error and no external request, in
//     both languages;
//   * the supplied PINTAR SELALU logo actually loads, at its own size, is
//     drawn at the product's height, and leads Home; the product's typeface
//     is the one in use;
//   * contrast is MEASURED on every route in both languages, text and the
//     marks that carry meaning; no text under 14px, no target under 44px, no
//     horizontal overflow from 320 to 1440px;
//   * the reports render the figures the content declares, each in its
//     evidence state, every readiness bar one neutral ink and never the brand;
//   * the product's cycle is named in order where the site names it;
//   * the contact form is inert;
//   * and after walking every route, including into Mini-PINTAR, NOTHING has
//     been written to the device: no localStorage, no sessionStorage, no
//     cookie, no IndexedDB.
//
// Mini-PINTAR's own journey is proved by mini-pintar/verify/journey.mjs.
//
// Run: node verify/view.mjs

import { dirname, join } from "node:path";
import { mkdtemp, mkdir, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { serve, launch, Page } from "../../mini-pintar/app/verify/driver.mjs";
import { CONTRAST_EXPR, nonTextExpr } from "../../mini-pintar/app/verify/probes.mjs";
import { PAGES } from "../shared/content.js";
import { REPORT_A, REPORT_B, STATES } from "../laporan/content.js";
import { CYCLE } from "../apa-yang-dilakukan/content.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");

const fails = [];
const fail = (what, detail = "") => fails.push(`${what}${detail ? " — " + detail : ""}`);
let checks = 0;
const assert = (cond, what, detail) => { if (cond) checks += 1; else fail(what, detail); };
const phase = (n) => process.stderr.write(`  .. ${n}\n`);
const settle = () => new Promise((r) => setTimeout(r, 200));

// Served from a subfolder, as on the host: a link or asset written from the
// domain root ("/laporan/", "/shared/…") fails here exactly as it would there.
const PREFIX = "/test/corporate";
const MOUNT = await mkdtemp(join(tmpdir(), "pintar-site-"));
await mkdir(join(MOUNT, "test"), { recursive: true });
await symlink(APP, join(MOUNT, "test", "corporate"), "dir");
const site = await serve(MOUNT);
const browser = await launch();
const ORIGIN = `http://127.0.0.1:${site.port}`;
const BASE = `${ORIGIN}${PREFIX}/`;
const at = (route, lang = "id") => `${BASE}${route.replace(/^\//, "")}?lang=${lang}`;
const ROUTE_URLS = new Set(PAGES.map((r) => `${PREFIX}${r.href}`));
let p;

const ROUTES = PAGES.filter((r) => r.href !== "/mini-pintar/");
const EVIDENCE_BAR = "rgb(95, 106, 115)";   // --evidence-bar, the product's --ink-3
const BRAND = "rgb(36, 95, 85)";            // --brand-primary, the product's #245F55

const NON_TEXT = nonTextExpr([
  ["readiness bar", ".rbar > i", "backgroundColor"],
  ["absent figure rule", ".fig__absent", "borderLeftColor"],
  ["primary action", ".btn--primary", "backgroundColor"],
]);

// Every page and file any link or asset points at, fetched at the end.
const linkTargets = new Set();

try {
  p = await Page.open(browser.pageUrl);
  await p.viewport(1280, 1200);

  // ------------------------------------------------ every route, both languages
  phase("every route: renders, logo, typeface, language carried, contrast");
  for (const route of ROUTES) {
    for (const lang of ["id", "en"]) {
      const where = `${route.slug} (${lang})`;
      await p.goto(at(route.href, lang));
      await settle();
      const bodyLen = await p.eval("document.body.innerText.length");
      assert(bodyLen > 200, `${where} has real content`, String(bodyLen));
      assert(p.consoleErrors.length === 0, `${where} has no console error`, p.consoleErrors.join(" | "));
      p.consoleErrors.length = 0;
      const external = p.requests.filter((u) => !u.startsWith(ORIGIN) && !u.startsWith("data:"));
      assert(external.length === 0, `${where} makes no external request`, external.join(", "));
      p.requests.length = 0;

      const logos = await p.eval(`[...document.querySelectorAll('img.brand__logo')].map(i => ({
        loaded: i.complete && i.naturalWidth === 766 && i.naturalHeight === 429,
        src: i.getAttribute('src'), alt: i.alt, h: Math.round(i.getBoundingClientRect().height),
        home: i.closest('a')?.href ?? null }))`);
      assert(logos.length === 2, `${where}: the logo is in the header and the footer`, JSON.stringify(logos));
      for (const l of logos) {
        assert(l.loaded, `${where}: the supplied logo loads at its own size`, JSON.stringify(l));
        assert(!l.src.startsWith("/"), `${where}: the logo's path is relative`, l.src);
        assert(l.alt === "PINTAR SELALU", `${where}: the logo says what the artwork says`, l.alt);
        assert(l.home === `${BASE}?lang=${lang}`, `${where}: the logo leads to the site's Home in the visitor's language`, String(l.home));
      }
      assert(logos[0]?.h === 36, `${where}: the header logo is drawn at the product's 36px`, String(logos[0]?.h));

      const font = await p.eval(`document.fonts.check('16px "Plus Jakarta Sans"')
        && getComputedStyle(document.body).fontFamily.startsWith('"Plus Jakarta Sans"')
        && [...document.fonts].some(f => f.family.replace(/"/g, '') === 'Plus Jakarta Sans' && f.status === 'loaded')`);
      assert(font, `${where}: the product's typeface is loaded and in use`);

      // Every link on the page (anchors and every src/href in the head) is
      // relative, lands inside the site's folder on a real route or file,
      // and, for a page link, carries the visitor's language.
      const refs = await p.eval(`[...document.querySelectorAll('[href], [src]')]
        .map(e => ({ tag: e.tagName.toLowerCase(), raw: e.getAttribute('href') ?? e.getAttribute('src'),
                     url: e.href || e.src }))
        .filter(x => x.raw && !x.raw.startsWith('#') && !x.raw.startsWith('mailto:') && !x.raw.startsWith('data:'))`);
      const rooted = refs.filter((x) => x.raw.startsWith("/") || /^https?:/.test(x.raw));
      assert(rooted.length === 0, `${where}: every internal link and asset is relative`,
        rooted.map((x) => x.raw).join(", "));
      const outside = refs.filter((x) => !x.url.startsWith(BASE));
      assert(outside.length === 0, `${where}: every link and asset stays inside the site's folder`,
        outside.map((x) => x.url).join(", "));
      const anchors = refs.filter((x) => x.tag === "a");
      const noRoute = anchors.filter((x) => !ROUTE_URLS.has(new URL(x.url).pathname));
      assert(noRoute.length === 0, `${where}: every internal link is a real route`, noRoute.map((x) => x.url).join(", "));
      const noLang = anchors.filter((x) => new URL(x.url).searchParams.get("lang") !== lang);
      assert(noLang.length === 0, `${where}: every internal link carries the language`, noLang.map((x) => x.raw).join(", "));
      for (const x of refs) linkTargets.add(new URL(x.url).pathname);

      const t = await p.eval(CONTRAST_EXPR);
      assert(t.measured > 0, `${where}: the contrast probe measured something`);
      assert(t.bad.length === 0, `${where}: text contrast`, JSON.stringify(t.bad));
      const ui = await p.eval(NON_TEXT);
      assert(ui.bad.length === 0, `${where}: contrast of the marks that carry meaning`, JSON.stringify(ui.bad));
    }
  }

  // ----------------------------------------------------------- nav + footer
  phase("navigation marks the active page; footer lists every route");
  for (const route of ROUTES.filter((r) => r.primary)) {
    await p.goto(at(route.href));
    await settle();
    const current = await p.eval(`document.querySelector('.site-nav__links a[aria-current="page"]')?.textContent.trim()`);
    assert(current === route.label.id, `${route.slug}: nav marks itself active`, String(current));
  }
  await p.goto(at("/"));
  await settle();
  const footerLinks = await p.eval(`[...document.querySelectorAll('.site-footer a')].length`);
  assert(footerLinks >= ROUTES.length, "the footer lists at least as many links as there are routes", String(footerLinks));
  const status = await p.eval(`document.querySelector('.site-footer__status')?.innerText || ''`);
  assert(status.includes("dirancang") && status.includes("demonstrasi"),
    "the footer keeps designed, demonstrated and live apart", status);

  // Mini-PINTAR is its own immersive page inside the site: the site's logo,
  // leading Home, and no site navigation or footer to leave by mid-journey.
  await p.goto(at("/mini-pintar/"));
  await settle();
  const mini = await p.eval(`({ footer: !!document.querySelector('.site-footer'),
    nav: !!document.querySelector('.site-nav__links'),
    logo: (() => { const i = document.querySelector('#brand img');
      return i && i.complete && i.naturalWidth === 766 ? i.closest('a')?.href : null; })() })`);
  assert(!mini.footer && !mini.nav, "Mini-PINTAR carries no site navigation or footer", JSON.stringify(mini));
  assert(mini.logo === `${BASE}?lang=id`, "Mini-PINTAR carries the supplied logo, leading to the site's Home", String(mini.logo));

  // --------------------------------------------------- the product's cycle
  phase("the cycle, by the product's names, in order");
  for (const lang of ["id", "en"]) {
    await p.goto(at("/apa-yang-dilakukan/", lang));
    await settle();
    const steps = await p.eval(`[...document.querySelectorAll('ol.cycle li')].map(li => li.textContent.trim())`);
    assert(JSON.stringify(steps) === JSON.stringify(CYCLE.steps.map((s) => s[lang])),
      `the cycle is named in the product's order (${lang})`, JSON.stringify(steps));
  }

  // ----------------------------------------------------- reports, rendered
  phase("the reports render MC-1 figures in their evidence states");
  for (const lang of ["id", "en"]) {
    await p.goto(at("/laporan/", lang));
    await settle();
    for (const [key, data] of [["educator", REPORT_A], ["management", REPORT_B]]) {
      const drawn = await p.eval(`[...document.querySelectorAll('[data-report=${key}] .fig')]
        .map(f => ({ metric: f.dataset.metric, state: f.dataset.state, text: f.innerText,
                     value: !!f.querySelector('.fig__value') }))`);
      assert(drawn.length === data.figures.length, `${key} report draws every figure (${lang})`, JSON.stringify(drawn));
      for (const f of data.figures) {
        const d = drawn.find((x) => x.metric === f.metric);
        assert(d && d.state === f.state, `${key}: ${f.metric} is drawn in its declared state (${lang})`, JSON.stringify(d));
        if (!d) continue;
        if (f.state === "belum_cukup")
          assert(d.text.includes(`${STATES.belum_cukup.shows[lang]} (${f.have}/${f.needed})`) && !d.value,
            `${key}: ${f.metric} below its minimum says so, with no number (${lang})`, d.text);
        if (f.state === "belum_ada")
          assert(d.text.includes(STATES.belum_ada.shows[lang]) && !d.value,
            `${key}: ${f.metric} with nothing qualifying says so, with no number (${lang})`, d.text);
      }
    }
    const counts = await p.eval(`[...document.querySelectorAll('[data-report=management] .kesiapan li')]
      .map(li => li.innerText.replace(/\\s+/g, ' ').trim())`);
    const want = { cukup: 0, belum_cukup: 0, belum_ada: 0 };
    for (const f of REPORT_B.figures) want[f.state] += 1;
    const expected = Object.entries(want).filter(([, n]) => n > 0).map(([k, n]) => `${n} ${STATES[k].name[lang]}`);
    assert(JSON.stringify(counts) === JSON.stringify(expected), `evidence readiness counts the figures (${lang})`,
      JSON.stringify(counts));
    const bars = await p.eval(`[...new Set([...document.querySelectorAll('.rbar > i')]
      .map(i => getComputedStyle(i).backgroundColor))]`);
    assert(bars.length === 1 && bars[0] === EVIDENCE_BAR, `every readiness and topic bar is the one neutral ink (${lang})`,
      JSON.stringify(bars));
    const brandInReport = await p.eval(`[...document.querySelectorAll('.report, .report *')]
      .flatMap(e => { const s = getComputedStyle(e); return [s.backgroundColor, s.borderLeftColor, s.color]; })
      .filter(c => c === ${JSON.stringify(BRAND)}).length`);
    assert(brandInReport === 0, `no report mark is painted in the brand colour (${lang})`, String(brandInReport));
  }

  // --------------------------------------------------- type floor and targets
  phase("type floor and target size, every route");
  for (const route of ROUTES) {
    await p.goto(at(route.href));
    await settle();
    const small = await p.eval(`[...document.querySelectorAll('body *')]
      .filter(e => e.offsetParent && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
      .map(e => parseFloat(getComputedStyle(e).fontSize))
      .filter(px => px > 0 && px < 14)`);
    assert(small.length === 0, `no text under 14px (${route.slug})`, JSON.stringify(small));
    // The skip link is deliberately 1x1 and offscreen until keyboard focus
    // reveals it; that is the standard pattern, not a target-size miss.
    const targets = await p.eval(`[...document.querySelectorAll('button, a')]
      .filter(e => !e.closest('.sr-only'))
      .map(e => ({ t: (e.textContent.trim() || e.querySelector('img')?.alt || '').slice(0, 24),
                   w: Math.round(e.getBoundingClientRect().width),
                   h: Math.round(e.getBoundingClientRect().height) }))
      .filter(x => x.t && x.h > 0 && (x.h < 44 || x.w < 44))`);
    assert(targets.length === 0, `every target is at least 44px (${route.slug})`, JSON.stringify(targets));
  }

  // ------------------------------------------------------------------ reflow
  phase("reflow at 320–1440px");
  for (const w of [320, 375, 768, 1024, 1440]) {
    await p.viewport(w, 900);
    for (const href of ["/", "/apa-yang-dilakukan/", "/laporan/", "/mini-pintar/"]) {
      await p.goto(at(href));
      await settle();
      const over = await p.eval("document.documentElement.scrollWidth - document.documentElement.clientWidth");
      assert(over <= 0, `no horizontal overflow at ${w}px (${href})`, String(over));
    }
    if (w <= 720) {
      await p.goto(at("/"));
      await settle();
      const h = await p.eval("Math.round(document.querySelector('.site-header img.brand__logo').getBoundingClientRect().height)");
      assert(h === 32, `the header logo is the product's 32px on a phone (${w}px)`, String(h));
    }
  }
  await p.viewport(1280, 1200);

  // -------------------------------------------------------------- contact form
  phase("the contact form is inert");
  await p.goto(at("/kontak/"));
  await settle();
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
  assert((await p.eval("location.pathname")) === `${PREFIX}/kontak/`, "the page never navigates away on submit");
  const external2 = p.requests.filter((u) => !u.startsWith(ORIGIN) && !u.startsWith("data:"));
  assert(external2.length === 0, "no request left the page on submit", external2.join(", "));

  // ---------------------------------------- the language switch writes nothing
  phase("the language switch travels in the address, not on the device");
  await p.goto(at("/laporan/"));
  await settle();
  await p.eval(`[...document.querySelectorAll('.site-header button')].find(b => b.textContent.trim() === 'EN').click()`);
  let switched = null;
  for (let i = 0; i < 30 && switched !== "en"; i += 1) {
    await settle();
    switched = await p.eval("new URLSearchParams(location.search).get('lang')").catch(() => null);
  }
  assert(switched === "en", "switching language puts it in the address", String(switched));
  await p.goto(`${BASE}laporan/`);
  await settle();
  assert((await p.eval("document.documentElement.lang")) === "id",
    "a visit without ?lang= is Bahasa Indonesia: nothing was remembered", await p.eval("document.documentElement.lang"));

  // --------------------------- after all of it, nothing was written anywhere
  phase("device storage, after every route and into Mini-PINTAR");
  await p.goto(at("/mini-pintar/"));
  await settle();
  await p.eval(`document.querySelector('main button.btn').click()`);
  await settle();
  const storage = await p.eval(`(async () => ({
    local: localStorage.length, session: sessionStorage.length, cookie: document.cookie,
    dbs: (indexedDB.databases ? (await indexedDB.databases()).length : 0),
  }))()`, true);
  assert(storage.local === 0, "localStorage is empty after the whole site", String(storage.local));
  assert(storage.session === 0, "sessionStorage is empty after the whole site", String(storage.session));
  assert(storage.cookie === "", "no cookie after the whole site", storage.cookie);
  assert(storage.dbs === 0, "no IndexedDB database after the whole site", String(storage.dbs));

  // --------------------------------- every link target is really there
  phase("every page and file a link or asset points at is served");
  assert(linkTargets.size >= PAGES.length, "the link walk found every route", String(linkTargets.size));
  for (const path of linkTargets) {
    const res = await fetch(`${ORIGIN}${path}`);
    assert(res.ok, `${path} is served`, String(res.status));
  }
} catch (e) {
  fail("the run threw", e.message);
} finally {
  browser.kill();
  await site.close();
  await rm(MOUNT, { recursive: true, force: true });
}

if (fails.length) {
  console.error(`\nview FAILED — ${fails.length} problem(s), ${checks} checks passed\n`);
  for (const f of fails) console.error("  " + f);
  process.exit(1);
}
console.log(`view OK — ${checks} checks in a real browser, served from ${PREFIX}/: ${ROUTES.length} routes in both ` +
  `languages render clean with every link and asset relative and served, ` +
  `the supplied logo and the product's typeface, contrast measured on every route, type floor and ` +
  `targets swept, reflow 320–1440px, reports drawn in their evidence states with neutral bars, the ` +
  `contact form inert, and nothing written to the device`);
