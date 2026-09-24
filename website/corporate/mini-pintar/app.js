// Mini-PINTAR — the experience.
//
// ZERO-WRITE, MEMORY-ONLY. Ruled 2026-09-18 (M1 §6.3): no localStorage, no
// sessionStorage, no IndexedDB, no cookie for answers, progress, adaptation
// or outcome. Reload restarts the experience, and the threshold says so in
// advance. The corporate site around it keeps nothing either: its language
// travels in ?lang= alone, and Mini-PINTAR hands it back the same way.
//
// The only network activity this page causes is the browser fetching
// index.html, style.css, content.js, adapt.js and this file, plus the site's
// own logo and typeface from the same origin. There is no fetch, no XHR, no
// sendBeacon, no WebSocket, no image ping, no analytics.
// verify/isolation.mjs asserts that by scanning the source, so the claim
// fails a build rather than surviving as a comment.

import {
  MAP_ITEMS, MAP_REASONS, TIER_REASONS, TIER_LABELS,
  LESSONS, DOMAIN, ASSISTANCE,
  OUTCOMES, EVIDENCE_LIMIT, NO_DELTA, REVEAL, SCHOOL, UI,
} from "./content.js";
import { SKIP, mapVerdicts, buildPeta, checkItemsFor, outcomeFor } from "./adapt.js";

// ---------------------------------------------------------------- state
//
// One module-level object for the tab's lifetime. Closing the tab ends it.
// This is the whole of Mini-PINTAR's memory.

const FRESH = () => ({
  step: "threshold",
  mapIndex: 0,
  mapChoices: [null, null, null],
  checkIndex: 0,
  checkChoices: [null, null],
  // Committing a check answer reveals its reasoning, so it also fixes it:
  // you cannot show a visitor why an answer falls short and then let them
  // change it. Pemetaan Awal answers stay changeable (M1 §5) -- nothing is
  // revealed there.
  checkCommitted: [false, false],
  workedShown: 0,
  assistLevel: 0,
  assistOffered: false,
  // The visitor's choice on the educator's side. Memory only, like the rest.
  decision: null,
  visited: ["threshold"],
});

/**
 * The map is DERIVED, never stored. Storing it meant a stale map could be
 * shown after a back-then-forward, and -- worse -- that a changed Pemetaan
 * Awal answer could change which lesson is served while check answers
 * already given kept their positions, so two answers given to one lesson's
 * questions would be scored against another's. Deriving it makes both
 * impossible rather than handled.
 */
const peta = () => buildPeta(mapVerdicts(s.mapChoices));

/**
 * A changed Pemetaan Awal answer invalidates everything downstream of it.
 * Answers are not locked -- going back and changing one is explicitly
 * permitted -- so the invalidation has to be explicit too.
 */
function setMapChoice(i, label) {
  if (s.mapChoices[i] === label) return;
  s.mapChoices[i] = label;
  s.checkChoices = [null, null];
  s.checkCommitted = [false, false];
  s.checkIndex = 0;
  s.workedShown = 0;
  s.assistLevel = 0;
  s.assistOffered = false;
  // The Peta Bacaan and the Pelajaran are derived, so they stay reachable
  // and simply re-derive. Only the steps that hold ANSWERS stop being
  // meaningful, and only those are forgotten.
  s.visited = s.visited.filter(
    (k) => !k.startsWith("#check") && !["#hasil", "#reveal", "#pendidik", "#pimpinan"].includes(k));
  s.decision = null;
}

let lang = initialLang();
let s = FRESH();
let hesitationTimer = null;
let tick = null;
let questionOpenedAt = 0;

/**
 * The starting language is a functional preference, never educational
 * state: it comes from the document the corporate site served, or from an
 * explicit ?lang= for review. Nothing is read from or written to storage.
 */
function initialLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (q === "en" || q === "id") return q;
  return document.documentElement.lang === "en" ? "en" : "id";
}

const t = (pair) => pair[lang];
const num = (n) => new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-GB").format(n);
const pct = (v) => new Intl.NumberFormat(lang === "id" ? "id-ID" : "en-GB",
  { style: "percent", maximumFractionDigits: 0 }).format(v);

/**
 * A route of the surrounding site ("/laporan/"), in the language the visitor
 * is using. RELATIVE: Mini-PINTAR sits one folder below the site's root, so a
 * route is reached through "..", and the site works from any folder it is
 * served from ("/" becomes "../", "/laporan/" becomes "../laporan/").
 */
const siteHref = (path) => `..${path}?lang=${lang}`;

// ------------------------------------------------------------- DOM helpers

const main = document.getElementById("main");
const live = document.getElementById("live");

/**
 * Attributes that are present-or-absent in HTML. Everything else takes a
 * STRING value, `false` included -- which matters most for ARIA: a radio
 * that is not selected must say `aria-checked="false"`, not drop the
 * attribute, and the selected one must say `"true"`, not `""`.
 *
 * This was wrong in the first version: every attribute was treated as
 * boolean, so the chosen option carried `aria-checked=""` and the rest
 * carried nothing. A screen reader could not tell which option was
 * selected, and `.opt[aria-checked="true"]` never matched, so sighted
 * visitors had no selected state either. Caught by verify/journey.mjs.
 */
const BOOL_ATTRS = new Set(["disabled", "hidden", "required", "readonly", "open"]);

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else if (BOOL_ATTRS.has(k)) { if (v) node.setAttribute(k, ""); }
    else if (v === false && (k === "class" || k === "text")) continue;
    else node.setAttribute(k, String(v));
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    node.append(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

/** Paragraphs from an array of already-resolved strings. */
const paras = (arr, cls) => arr.map((x) => el("p", { class: cls, text: x }));

/**
 * The evidence limit. ADR-0021 makes this the condition on which the whole
 * demonstration is permitted, so it is ONE function called from the Hasil
 * rather than markup that a later edit could quietly shorten. Removing the
 * call is what verify/audit.mjs looks for; that the sentence actually
 * reaches the screen in all twelve terminal states is asserted in the
 * browser by verify/journey.mjs.
 */
function evidenceLimitBlock() {
  const text = t(EVIDENCE_LIMIT);
  const cut = text.indexOf(". ") + 1;
  return el("div", { class: "limit" }, [
    // The mark draws what the sentence says: a line that runs, and then
    // stops. It is not a chart and implies no quantity.
    svg("limit__mark", 22, 12,
      '<path d="M1 6h13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M17 1v10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
    el("div", { class: "limit__text" }, [
      el("strong", { text: text.slice(0, cut) }),
      el("span", { text: text.slice(cut).trim() }),
    ]),
  ]);
}

/**
 * An inline decorative mark. Inline because the bundle has no external
 * origin -- no icon font, no sprite sheet, nothing fetched from anywhere.
 * Always aria-hidden: every one of these sits beside text that says the
 * same thing.
 */
function svg(cls, w, h, inner) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  node.setAttribute("class", cls);
  node.setAttribute("viewBox", `0 0 ${w} ${h}`);
  node.setAttribute("width", String(w));
  node.setAttribute("height", String(h));
  node.setAttribute("fill", "none");
  node.setAttribute("aria-hidden", "true");
  node.setAttribute("focusable", "false");
  node.innerHTML = inner;
  return node;
}

function announce(message) {
  // Cleared first so an identical consecutive message is still spoken.
  live.textContent = "";
  window.setTimeout(() => { live.textContent = message; }, 40);
}

// ------------------------------------------------------------- navigation

const STEP_NAMES = {
  threshold: UI.brand,
  map: UI.stepMap,
  peta: UI.stepPeta,
  lesson: UI.stepLesson,
  check: UI.stepCheck,
  hasil: UI.stepHasil,
  reveal: UI.stepReveal,
  pendidik: SCHOOL.stepEducator,
  pimpinan: SCHOOL.stepManagement,
};

const JOURNEY = ["map", "peta", "lesson", "check", "hasil"];

function hashFor(step, index) {
  if (step === "map" || step === "check") return `#${step}-${index + 1}`;
  return `#${step}`;
}

function go(step, { index = 0, push = true } = {}) {
  s.step = step;
  if (step === "map") s.mapIndex = index;
  if (step === "check") s.checkIndex = index;
  const key = hashFor(step, index);
  if (!s.visited.includes(key)) s.visited.push(key);
  if (push) history.pushState({ key }, "", key);
  render();
}

/**
 * Back and forward are real. A step the visitor has not been through --
 * someone else's deep link, or a reload that left the hash behind -- is not
 * reachable: there is no result to show someone who has not been through
 * it, and the state that would have produced one is gone by design.
 */
window.addEventListener("popstate", (e) => {
  const key = (e.state && e.state.key) || location.hash || "#threshold";
  if (key === "#threshold" || key === "#" || key === "") {
    s.step = "threshold";
    render();
    return;
  }
  if (!s.visited.includes(key)) {
    history.replaceState({ key: "#threshold" }, "", location.pathname + location.search);
    s.step = "threshold";
    render();
    return;
  }
  const [step, n] = key.slice(1).split("-");
  s.step = step;
  if (step === "map") s.mapIndex = Number(n) - 1;
  if (step === "check") s.checkIndex = Number(n) - 1;
  render();
});

function restart() {
  s = FRESH();
  history.replaceState({ key: "#threshold" }, "", location.pathname + location.search);
  render();
  announce(t(UI.thresholdLede));
}

// ------------------------------------------------------------ the chrome

function renderChrome() {
  // The PINTAR SELALU mark leads Home, as it does on every page of the site;
  // the demonstration's own name sits beside it, outside the link.
  document.getElementById("brand").setAttribute("href", siteHref("/"));
  document.getElementById("brand-demo").textContent = t(UI.brand);
  const exit = document.getElementById("exit");
  exit.textContent = t(UI.exit);
  exit.onclick = () => {
    // Keluar returns to the site's homepage, in the visitor's language.
    // Nothing of the journey goes with it.
    window.location.href = siteHref("/");
  };

  const langBox = document.getElementById("lang");
  langBox.setAttribute("aria-label", t(UI.langLabel));
  langBox.replaceChildren(
    el("button", {
      type: "button", text: "ID", "aria-pressed": lang === "id",
      onclick: () => setLang("id"),
    }),
    el("button", {
      type: "button", class: "lang__second", text: "EN", "aria-pressed": lang === "en",
      onclick: () => setLang("en"),
    }),
  );

  const prog = document.getElementById("progress");
  const pos = JOURNEY.indexOf(s.step);
  if (pos < 0) { prog.replaceChildren(); return; }
  // Five segments for the five steps of the cycle, filled as far as the
  // visitor has come, with the current one widened. Purely graphic, so it
  // is aria-hidden and the sentence beside it is what is read aloud.
  const rail = el("div", { class: "rail", "aria-hidden": "true" },
    JOURNEY.map((_, i) => el("i", {
      class: [i <= pos ? "on" : "", i === pos ? "now" : ""].filter(Boolean).join(" "),
    })));
  prog.replaceChildren(
    rail,
    el("span", { class: "sr", text: t(UI.progressText(pos + 1, JOURNEY.length)) }),
  );
}

/** Position and answers are preserved; only the content swaps. */
function setLang(next) {
  if (next === lang) return;
  lang = next;
  document.documentElement.lang = next;
  render();
}

// ------------------------------------------------------------- the steps

function viewThreshold() {
  return el("section", { class: "threshold settle" }, [
    el("h1", { id: "h", tabindex: "-1", text: t(UI.thresholdLede) }),
    el("p", { class: "lede", text: t(UI.thresholdSub) }),
    el("button", { type: "button", class: "btn", text: t(UI.start),
      onclick: () => go("map", { index: 0 }) }),
    el("p", { class: "fine", text: t(UI.thresholdReload) }),
  ]);
}

function viewMap() {
  const i = s.mapIndex;
  const item = MAP_ITEMS[i];
  const chosen = s.mapChoices[i];

  const node = el("section", { class: "settle" }, [
    el("p", { class: "meta", text: t(UI.mapIntro) }),
    el("h1", { id: "h", tabindex: "-1", text: t(item.stem) }),
    optionGroup(item, chosen, t(UI.stepMap), (label) => {
      setMapChoice(i, label);
      render();
    }),
    el("div", { class: chosen === null ? "sticky" : "sticky sticky--on" }, [
      el("button", {
        type: "button", class: "btn", text: t(UI.next),
        // No right/wrong feedback at any point in this stage. Choosing does
        // not auto-advance; the visitor confirms.
        disabled: chosen === null,
        onclick: () => advanceMap(),
      }),
      el("button", { type: "button", class: "btn btn--text", text: t(UI.skip),
        // Skipping is evidence too -- an honest "I don't know" -- and §4.1
        // treats it as such rather than as a blank.
        onclick: () => { setMapChoice(i, SKIP); advanceMap(); } }),
      i > 0 && el("button", { type: "button", class: "btn btn--text", text: t(UI.back),
        onclick: () => history.back() }),
    ]),
  ]);
  return node;
}

function advanceMap() {
  if (s.mapIndex < MAP_ITEMS.length - 1) go("map", { index: s.mapIndex + 1 });
  else go("peta");
}

function optionGroup(item, chosen, groupLabel, onPick) {
  const buttons = item.options.map((o) =>
    el("button", {
      type: "button",
      class: "opt",
      role: "radio",
      "aria-checked": chosen === o.label,
      tabindex: chosen === o.label || (chosen === null && o === item.options[0]) ? "0" : "-1",
      "data-label": o.label,
      onclick: () => onPick(o.label),
      onkeydown: (e) => arrowKeys(e, item, chosen, onPick),
    }, [
      el("span", { class: "opt__label", "aria-hidden": "true", text: o.label }),
      el("span", { text: t(o.text) }),
    ]));
  return el("div", {
    class: "options", role: "radiogroup", "aria-label": groupLabel,
  }, buttons);
}

/** Arrow keys move within the group; a mis-keyed arrow never loses a place. */
function arrowKeys(e, item, chosen, onPick) {
  const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
  if (!(e.key in keys)) return;
  e.preventDefault();
  const labels = item.options.map((o) => o.label);
  const delta = keys[e.key];
  const from = chosen === null ? null : labels.indexOf(chosen);
  const next = from === null
    ? (delta > 0 ? labels[0] : labels[labels.length - 1])
    : labels[(from + delta + labels.length) % labels.length];
  onPick(next);
  window.requestAnimationFrame(() => {
    const target = document.querySelector(`.opt[data-label="${next}"]`);
    if (target) target.focus();
  });
}

function viewPeta() {
  const cards = peta().cards.map((c) => {
    const d = DOMAIN[c.domain];
    const reason =
      c.reasonKind === "MISCONCEPTION" ? MAP_REASONS[c.misconception]
      : c.reasonKind === "SKIPPED" ? TIER_REASONS.SKIPPED
      : c.reasonKind === "DISARANKAN" ? TIER_REASONS.DISARANKAN
      : TIER_REASONS.SUDAH_TEPAT;
    return el("li", { class: `card card--${c.tier}` }, [
      el("div", { class: "card__tier", text: t(TIER_LABELS[c.tier]) }),
      el("div", { class: "card__name", text: t(d.name) }),
      el("div", { class: "card__reason", text: t(reason) }),
    ]);
  });

  return el("section", { class: "settle" }, [
    el("h1", { id: "h", tabindex: "-1", text: t(UI.stepPeta) }),
    el("p", { class: "lede", text: t(UI.petaIntro) }),
    el("ol", { class: "cards" }, cards),
    el("div", { class: "sticky sticky--on" }, [
      el("button", { type: "button", class: "btn", text: t(UI.openLesson),
        onclick: () => go("lesson") }),
      el("button", { type: "button", class: "btn btn--text", text: t(UI.back),
        onclick: () => history.back() }),
    ]),
  ]);
}

function viewLesson() {
  const lesson = LESSONS[peta().lessonKey];
  const shown = s.workedShown;
  const steps = lesson.workedExample.steps;

  return el("section", { class: "lesson settle" }, [
    el("h1", { id: "h", tabindex: "-1", text: t(lesson.title) }),
    ...paras(lesson.body[lang]),
    el("div", { class: "worked" }, [
      el("div", { class: "worked__title", text: t(UI.workedExample) }),
      el("h2", { text: t(lesson.workedExample.title) }),
      el("ol", {}, steps.slice(0, Math.max(shown, 1)).map((x) => el("li", { text: t(x) }))),
      shown < steps.length && el("button", {
        type: "button", class: "btn btn--quiet", text: t(UI.showStep),
        onclick: () => {
          s.workedShown = Math.max(shown, 1) + 1;
          render();
          announce(t(steps[Math.min(s.workedShown, steps.length) - 1]));
        },
      }),
    ]),
    el("div", { class: "sticky sticky--on" }, [
      el("button", { type: "button", class: "btn", text: t(UI.toCheck),
        onclick: () => { s.assistLevel = 0; s.assistOffered = false; go("check", { index: 0 }); } }),
      el("button", { type: "button", class: "btn btn--text", text: t(UI.back),
        onclick: () => history.back() }),
    ]),
  ]);
}

function viewCheck() {
  const i = s.checkIndex;
  const items = checkItemsFor(peta().lessonKey);
  const item = items[i];
  const chosen = s.checkChoices[i];
  const committed = s.checkCommitted[i];
  const domainKey = LESSONS[peta().lessonKey].domain;
  const help = ASSISTANCE[domainKey];

  const assistBlock = el("div", { class: "assist" },
    committed || s.assistLevel === 0 ? [] : [
      el("div", { class: "assist__pill", role: "note" }, [
        el("div", { class: "assist__kind",
          text: t(s.assistLevel === 1 ? UI.assistArah : UI.assistPetunjuk) }),
        el("div", { text: t(s.assistLevel === 1 ? help.arah : help.petunjuk) }),
        s.assistLevel === 1 && el("button", {
          type: "button", class: "btn btn--quiet", text: t(UI.assistMore),
          onclick: () => { s.assistLevel = 2; render(); announce(t(help.petunjuk)); },
        }),
        el("div", { class: "assist__note", text: t(UI.assistNote) }),
      ]),
    ]);

  return el("section", { class: "settle" }, [
    !committed && el("div", { class: "checkbar" }, [
      // Decorative, aria-hidden, imposes no limit. Announcing it every
      // second would be intolerable and would imply a limit that does not
      // exist.
      el("span", { id: "clock", "aria-hidden": "true", text: "0:00" }),
      // Not gated behind a timer: available from the moment the question
      // appears, which also removes WCAG 2.2.1 from consideration.
      el("button", { type: "button", class: "btn btn--quiet", text: t(UI.needDirection),
        onclick: () => {
          s.assistLevel = Math.max(s.assistLevel, 1);
          render();
          announce(t(help.arah));
        } }),
    ]),
    el("p", { class: "meta", text: t(UI.questionOf(i + 1, items.length)) }),
    el("h1", { id: "h", tabindex: "-1", text: t(item.stem) }),

    committed ? committedOptions(item, chosen) :
      optionGroup(item, chosen, t(UI.stepCheck), (label) => {
        s.checkChoices[i] = label;
        render();
      }),

    committed ? reasoningBlock(item, chosen) : assistBlock,

    el("div", { class: committed || chosen !== null ? "sticky sticky--on" : "sticky" }, [
      committed
        ? el("button", { type: "button", class: "btn",
            text: t(i < items.length - 1 ? UI.next : UI.seeResult),
            onclick: () => advanceCheck() })
        : el("button", { type: "button", class: "btn", text: t(UI.seeReasoning),
            disabled: chosen === null,
            onclick: () => commitCheck() }),
      !committed && el("button", { type: "button", class: "btn btn--text", text: t(UI.skip),
        onclick: () => { s.checkChoices[i] = SKIP; commitCheck(); } }),
      el("button", { type: "button", class: "btn btn--text", text: t(UI.back),
        onclick: () => history.back() }),
    ]),
  ]);
}

/**
 * The options after the answer is fixed: a plain list, not a radio group.
 * Leaving four radios on screen that no longer accept input is the kind of
 * half-interactive control a screen reader describes as usable and is not.
 */
function committedOptions(item, chosen) {
  return el("ul", { class: "options options--fixed" }, item.options.map((o) => {
    const isChoice = o.label === chosen;
    // The marks are WORDS, not glyphs. A filled dot against a hollow one
    // against a diamond is a legend the visitor was never given, and the
    // three states here are worth two short labels instead. Being visible
    // text, they are also what a screen reader reads -- no parallel
    // visually-hidden copy to drift out of step with them.
    const marks = [];
    if (isChoice) marks.push([t(UI.markYourChoice), true]);
    if (o.correct) marks.push([t(UI.markMostAccurate), false]);
    return el("li", {
      class: "opt opt--fixed" + (isChoice ? " opt--chosen" : "") + (o.correct ? " opt--key" : ""),
    }, [
      el("span", { class: "opt__label", "aria-hidden": "true", text: o.label }),
      el("span", { class: "opt__text", text: t(o.text) }),
      marks.length
        ? el("span", { class: "opt__mark" }, marks.map(([m, you]) =>
            el("span", { class: "opt__chip" + (you ? " opt__chip--you" : ""), text: m })))
        : null,
    ]);
  }));
}

/**
 * The reasoning, revealed only once the answer is committed (R1). It says
 * why the reasoning holds or does not, rather than restating which letter
 * was keyed -- a rationale that only names the answer teaches nothing.
 *
 * The Hasil stays an evidence-interpretation surface and never becomes a
 * correction sheet: the explaining happens here, at the question.
 */
function reasoningBlock(item, chosen) {
  const picked = item.options.find((o) => o.label === chosen);
  const key = item.options.find((o) => o.correct);
  const skipped = chosen === SKIP || !picked;

  const blocks = [];
  if (skipped) {
    blocks.push(el("p", { class: "meta", text: t(UI.skippedHere) }));
  } else {
    blocks.push(el("div", { class: "reason" }, [
      el("div", { class: "reason__kind", text: t(UI.yourChoice) }),
      el("p", { text: t(picked.rationale) }),
    ]));
  }
  // The keyed option's reasoning is added only when it is not already the
  // one above, so nobody reads the same paragraph twice.
  if (skipped || !picked.correct) {
    blocks.push(el("div", { class: "reason reason--key" }, [
      el("div", { class: "reason__kind", text: t(UI.mostAccurate) }),
      el("p", { text: t(key.rationale) }),
    ]));
  }
  blocks.push(el("p", { class: "meta", text: t(UI.lockedNote) }));
  return el("div", { class: "reasoning" }, blocks);
}

function advanceCheck() {
  const items = checkItemsFor(peta().lessonKey);
  if (s.checkIndex < items.length - 1) {
    s.assistLevel = 0;
    s.assistOffered = false;
    go("check", { index: s.checkIndex + 1 });
  } else {
    go("hasil");
  }
}

function commitCheck() {
  const i = s.checkIndex;
  s.checkCommitted[i] = true;
  s.assistLevel = 0;
  render();
  const item = checkItemsFor(peta().lessonKey)[i];
  const picked = item.options.find((o) => o.label === s.checkChoices[i]);
  announce(t(picked ? picked.rationale : item.options.find((o) => o.correct).rationale));
}

function viewHasil() {
  const { outcome } = outcomeFor(peta().lessonKey, s.checkChoices);
  const copy = OUTCOMES[outcome];
  const lesson = LESSONS[peta().lessonKey];

  return el("section", { class: "settle" }, [
    el("h1", { id: "h", tabindex: "-1", class: "hasil__headline", text: t(copy.headline) }),
    t(copy.body) ? el("p", { text: t(copy.body) }) : null,
    // Naming the reading is required by the copy itself: PERLU_PERHATIAN
    // says "that shows you which part".
    el("p", { class: "reading" }, [
      el("span", { class: "reading__label", text: t(UI.yourReading) }),
      el("span", { class: "reading__name", text: t(lesson.title) }),
    ]),
    // It appears under EVERY outcome, KONSISTEN included.
    evidenceLimitBlock(),
    el("p", { class: "nodelta", text: t(NO_DELTA) }),
    el("div", { class: "sticky sticky--on" }, [
      el("button", { type: "button", class: "btn", text: t(UI.whatHappened),
        onclick: () => go("reveal") }),
      el("button", { type: "button", class: "btn btn--text", text: t(UI.restart),
        onclick: () => restart() }),
    ]),
  ]);
}

function viewReveal() {
  return el("section", { class: "settle" }, [
    el("h1", { id: "h", tabindex: "-1", text: t(REVEAL.headline) }),
    el("ol", { class: "path" }, REVEAL.steps.map((x) => el("li", {}, [
      el("div", { class: "path__step", text: t(x.step) }),
      el("div", { class: "path__note", text: t(x.note) }),
    ]))),
    el("p", { class: "closing", text: t(REVEAL.closing) }),
    el("div", { class: "limit" }, [el("span", { text: t(REVEAL.honesty) })]),
    // Three doors rather than one CTA: a single CTA after a three-minute
    // experience wastes the one moment the visitor is most willing to go
    // further, by guessing which direction they want.
    el("div", { class: "school-offer" }, [
      el("button", { type: "button", class: "btn btn--quiet", id: "to-school", text: t(REVEAL.school),
        onclick: () => go("pendidik") }),
      el("p", { class: "meta", text: t(REVEAL.schoolNote) }),
    ]),
    doors(),
    el("button", { type: "button", class: "btn btn--text", text: t(UI.restart),
      onclick: () => restart() }),
  ]);
}

function doors() {
  return el("nav", { class: "doors", "aria-label": t(REVEAL.headline) },
    REVEAL.doors.map((d) => el("a", { href: siteHref(d.href), text: t(d.label) })));
}

// ------------------------------------------------ Lihat dari sisi sekolah

/** A figure below MC-1's minimum, in the product's own sentence. */
function absentFigure(f) {
  const sentence = f.state === "belum_ada"
    ? t(SCHOOL.absent.belum_ada)
    : `${t(SCHOOL.absent.belum_cukup)} (${num(f.have)}/${num(f.needed)})`;
  return el("div", { class: "fig", "data-metric": f.metric, "data-state": f.state }, [
    el("span", { class: "fig__label", text: t(f.label) }),
    el("span", { class: "fig__absent", text: sentence }),
  ]);
}

function viewPendidik() {
  const e = SCHOOL.educator;
  const pickDecision = (label) => {
    s.decision = label;
    render();
    announce(t(e.ack));
    window.requestAnimationFrame(() => {
      const target = document.querySelector(`.opt[data-label="${label}"]`);
      if (target) target.focus();
    });
  };
  return el("section", { class: "settle" }, [
    el("p", { class: "eyebrow", text: t(e.eyebrow) }),
    el("h1", { id: "h", tabindex: "-1", text: t(e.headline) }),
    // What the educator's screen would say, with this class of one.
    el("div", { class: "panel", "data-view": "educator" }, [
      el("p", { class: "panel__title", text: t(e.title) }),
      el("p", { class: "panel__intro", text: t(e.intro) }),
      el("p", { class: "panel__h", text: t(e.where) }),
      el("p", { class: "facts" }, [
        el("span", { text: t(e.submitted) }),
        el("strong", { class: "num", text: `${num(1)} / ${num(1)}` }),
      ]),
      el("p", { class: "panel__h", text: t(e.conclusions) }),
      ...e.figures.map(absentFigure),
      el("p", { class: "nodelta", text: t(NO_DELTA) }),
      el("p", { class: "panel__foot", text: t(e.foot) }),
    ]),
    el("h2", { text: t(e.decide) }),
    optionGroup(e, s.decision, t(e.decide), pickDecision),
    s.decision ? el("p", { class: "ack", text: t(e.ack) }) : null,
    el("div", { class: "sticky sticky--on" }, [
      el("button", { type: "button", class: "btn", text: t(e.next), onclick: () => go("pimpinan") }),
      el("button", { type: "button", class: "btn btn--text", text: t(UI.back), onclick: () => history.back() }),
    ]),
  ]);
}

function viewPimpinan() {
  const m = SCHOOL.management;
  const figure = (f) => {
    if (f.state !== "cukup") return absentFigure(f);
    if (f.kind === "tiers") {
      const total = Object.values(f.tiers).reduce((a, b) => a + b, 0);
      return el("div", { class: "fig", "data-metric": f.metric, "data-state": f.state }, [
        el("span", { class: "fig__label", text: t(f.label) }),
        el("span", { class: "fig__meaning", text: t(f.meaning) }),
        // Neutral rows, as the product draws readiness: one ink for every
        // tier, because a tier is where a child stands, not a verdict.
        el("div", { class: "rrows" }, Object.entries(f.tiers).map(([k, n]) =>
          el("div", { class: "rrow" }, [
            el("span", { text: t(m.tiers[k].name) }),
            el("span", { class: "num", text: num(n) }),
            el("div", { class: "rbar", "aria-hidden": "true" }, [
              el("i", { style: `width:${((n / total) * 100).toFixed(1)}%` })]),
          ]))),
        el("dl", { class: "rules" }, Object.values(m.tiers).flatMap((x) => [
          el("dt", { text: t(x.name) }), el("dd", { text: t(x.rule) })])),
      ]);
    }
    return el("div", { class: "fig", "data-metric": f.metric, "data-state": f.state }, [
      el("span", { class: "fig__label", text: t(f.label) }),
      el("span", { class: "fig__value num", text: f.kind === "percent" ? pct(f.value) : num(f.value) }),
      el("span", { class: "fig__meaning", text: t(f.meaning) }),
      el("span", { class: "meta", text: `${t(m.from)} ${num(f.have)}` }),
    ]);
  };
  // Counted from the figures, never typed beside them; an empty state is
  // not drawn (RingkasKesiapan).
  const counts = { cukup: 0, belum_cukup: 0, belum_ada: 0 };
  for (const f of m.figures) counts[f.state] += 1;

  return el("section", { class: "settle" }, [
    el("p", { class: "badge", text: t(m.badge) }),
    el("p", { class: "eyebrow", text: t(m.eyebrow) }),
    el("h1", { id: "h", tabindex: "-1", text: t(m.headline) }),
    el("p", { class: "lede", text: t(m.sub) }),
    el("div", { class: "panel", "data-view": "management" }, [
      el("p", { class: "panel__title", text: t(m.title) }),
      ...m.figures.map(figure),
      el("p", { class: "panel__h", text: t(m.readiness.title) }),
      el("ul", { class: "kesiapan" }, Object.entries(counts).filter(([, n]) => n > 0).map(([k, n]) =>
        el("li", { "data-state": k }, [el("strong", { class: "num", text: num(n) }), el("span", { text: t(m.readiness[k]) })]))),
      el("p", { class: "panel__foot", text: t(m.readiness.note) }),
    ]),
    doors(),
    el("div", { class: "sticky" }, [
      el("button", { type: "button", class: "btn btn--text", text: t(UI.back), onclick: () => history.back() }),
      el("button", { type: "button", class: "btn btn--text", text: t(UI.restart), onclick: () => restart() }),
    ]),
  ]);
}

// ---------------------------------------------------------------- render

const VIEWS = {
  threshold: viewThreshold,
  map: viewMap,
  peta: viewPeta,
  lesson: viewLesson,
  check: viewCheck,
  hasil: viewHasil,
  reveal: viewReveal,
  pendidik: viewPendidik,
  pimpinan: viewPimpinan,
};

let lastKey = null;

function render() {
  window.clearTimeout(hesitationTimer);
  window.clearInterval(tick);

  renderChrome();
  main.replaceChildren(VIEWS[s.step]());

  const key = hashFor(s.step, s.step === "map" ? s.mapIndex : s.checkIndex);
  const stepChanged = key !== lastKey;
  lastKey = key;

  if (stepChanged) {
    // Focus moves deliberately to the step's h1, which is tabindex="-1".
    // Never trapped, never left on a removed element.
    const h = document.getElementById("h");
    if (h) h.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    announceStep();
  }

  if (s.step === "check") startCheckAids();
}

function announceStep() {
  if (s.step === "map") {
    announce(t(UI.stepAnnounce(UI.stepMap, s.mapIndex + 1, MAP_ITEMS.length)));
  } else if (s.step === "check") {
    const n = checkItemsFor(peta().lessonKey).length;
    announce(t(UI.stepAnnounce(UI.stepCheck, s.checkIndex + 1, n)));
  } else {
    announce(t(STEP_NAMES[s.step]));
  }
}

function startCheckAids() {
  // Once the answer is committed there is no checkbar, so there is no
  // clock to count and no help left to offer: the reasoning is already on
  // screen.
  if (s.checkCommitted[s.checkIndex]) return;

  questionOpenedAt = Date.now();
  const clock = document.getElementById("clock");
  if (clock) {
    tick = window.setInterval(() => {
      if (!clock.isConnected) { window.clearInterval(tick); return; }
      const sec = Math.floor((Date.now() - questionOpenedAt) / 1000);
      clock.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
    }, 1000);
  }

  // The hesitation window offers the same help the persistent button
  // already offers. When the pill appears on its own it is announced
  // politely and does NOT take focus.
  if (s.assistLevel === 0 && !s.assistOffered) {
    hesitationTimer = window.setTimeout(() => {
      if (s.step !== "check" || s.assistLevel !== 0) return;
      if (s.checkCommitted[s.checkIndex]) return;
      s.assistOffered = true;
      s.assistLevel = 1;
      const help = ASSISTANCE[LESSONS[peta().lessonKey].domain];
      render();
      announce(t(help.arah));
    }, 20000);
  }
}

// -------------------------------------------------------------- start up
//
// Any inbound hash naming an internal step is discarded: there is no result
// to show someone who has not been through the journey, and after a reload
// the state that produced one is gone by design.

history.replaceState({ key: "#threshold" }, "", location.pathname + location.search);
document.documentElement.lang = lang;
render();
