// Shared browser probes.
//
// Lives here rather than inside journey.mjs because the educator role view
// in design/role-views/ needs the same measurement, and a second copy of a
// contrast formula is a second copy that drifts.
//
// Each probe is a FUNCTION, serialised with toString() at the call site,
// never a template literal. A template literal eats unknown escapes: `\\(`
// becomes `(` and `\\s` becomes `s`, so a regex like /rgba?\\(([^)]+)\\)/
// turns into a different one that still matches, parses every colour as
// NaN, and compares NaN against the threshold — which is false, so nothing
// is ever flagged. That is exactly what happened, and the check reported
// green over text at 2.02:1.

/**
 * WCAG contrast, measured rather than asserted.
 *
 * Written as a FUNCTION and serialised with toString(), not as a template
 * literal. A template literal silently eats unknown escapes: `\(` becomes
 * `(` and `\s` becomes `s`, so a regex like /rgba?\(([^)]+)\)/ turns into
 * a different regex that still matches, parses every colour as NaN, and
 * compares NaN against the threshold — which is false, so nothing is ever
 * flagged. That is exactly what happened here, and the check reported
 * green over a colour at 2.02:1. A function is compiled by Node, so a
 * mistake in it is a syntax error rather than a quiet pass.
 *
 * Two things it does that a naive version does not. It composites
 * translucent backgrounds down the ancestor chain, because the chrome is
 * semi-transparent over the page. And where a background is a gradient it
 * takes the DARKEST stop, so a gradient cannot hide a low-contrast corner
 * behind an average — the lead Peta Bacaan card is exactly such a case.
 */
function contrastProbe() {
  const lum = ([r, g, b]) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const L1 = lum(a), L2 = lum(b);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  };
  const parse = (str) => {
    const m = String(str).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const n = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (n.slice(0, 3).some(Number.isNaN)) return null;
    return { rgb: [n[0], n[1], n[2]], a: n.length > 3 ? n[3] : 1 };
  };
  const colorsIn = (str) => (String(str).match(/rgba?\([^)]+\)/g) || []).map(parse).filter(Boolean);
  const over = (fg, bg) => fg.rgb.map((c, i) => c * fg.a + bg[i] * (1 - fg.a));

  const bgOf = (el) => {
    const stack = [];
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      const cands = colorsIn(cs.backgroundColor).concat(colorsIn(cs.backgroundImage))
        .filter((c) => c.a > 0);
      if (cands.length) {
        cands.sort((a, b) => lum(a.rgb) - lum(b.rgb));
        stack.push(cands[0]);
        if (cands[0].a === 1) break;
      }
    }
    let bg = [255, 255, 255];
    for (let i = stack.length - 1; i >= 0; i -= 1) bg = over(stack[i], bg);
    return bg;
  };

  const out = [];
  let measured = 0;
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest(".sr")) continue;
    if (!el.offsetParent) continue;
    const hasOwnText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasOwnText) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
    const fg = parse(cs.color);
    if (!fg) { out.push({ el: el.tagName.toLowerCase(), unparsed: cs.color }); continue; }
    const bg = bgOf(el);
    measured += 1;
    const size = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;
    const got = ratio(over(fg, bg), bg);
    if (!(got + 0.005 >= need)) {
      out.push({
        el: el.tagName.toLowerCase() + (typeof el.className === "string" && el.className
          ? "." + el.className.trim().split(/\s+/).join(".") : ""),
        px: size, weight, ratio: Math.round(got * 100) / 100, need,
        text: el.textContent.trim().slice(0, 32),
      });
    }
  }
  // A probe that measures nothing has to say so: an empty result must mean
  // "everything passed", never "nothing was looked at".
  return { bad: out, measured };
}

/**
 * Non-text contrast (WCAG 1.4.11) for the boundaries that carry meaning on
 * the surface under test. The caller passes [name, selector, property]
 * triples; inactive components are skipped, because 1.4.11 exempts them.
 */
function nonTextProbe(TESTS) {
  const lum = ([r, g, b]) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const rgb = (str) => {
    const m = String(str).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const n = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return n.slice(0, 3).some(Number.isNaN) ? null : [n[0], n[1], n[2]];
  };
  const ratio = (a, b) => {
    const L1 = lum(a), L2 = lum(b);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  };
  const paper = rgb(getComputedStyle(document.body).backgroundColor) || [251, 250, 247];
  const out = [];
  let measured = 0;
  const test = (name, sel, prop) => {
    const el = document.querySelector(sel);
    if (!el) return;
    // 1.4.11 exempts inactive components. The primary action is inactive
    // until the visitor has chosen, and its disabled ground is meant to
    // recede.
    if (el.disabled || el.getAttribute("aria-disabled") === "true") return;
    const c = rgb(getComputedStyle(el)[prop]);
    if (!c) { out.push({ name, unparsed: getComputedStyle(el)[prop] }); return; }
    measured += 1;
    const got = ratio(c, paper);
    if (!(got + 0.005 >= 3)) out.push({ name, ratio: Math.round(got * 100) / 100 });
  };
  // The caller supplies what carries meaning on ITS surface. Borders that
  // only decorate are not in any of these lists, because demanding 3:1 of
  // every hairline would push a calm surface louder for no gain to anyone.
  for (const [name, sel, prop] of TESTS) test(name, sel, prop);
  return { bad: out, measured };
}


export { contrastProbe, nonTextProbe };

/** The expressions to hand to Runtime.evaluate. */
export const CONTRAST_EXPR = `(${contrastProbe.toString()})()`;
export const nonTextExpr = (tests) =>
  `(${nonTextProbe.toString()})(${JSON.stringify(tests)})`;
