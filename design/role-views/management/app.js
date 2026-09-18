// Management role view — a rendered design sample.
//
// No storage, no network, no analytics. Every control is inert: wiring any
// of it would make a sample look like a working surface, and Umpan Balik
// is not a feature, it is a proposal.

import { SAMPLE, UI, CHAIN, HOME, ITEMS, UMPAN } from "./content.js";

const SCREENS = [
  ["beranda", L2("Beranda", "Home")],
  ["umpan-mulai", L2("Umpan Balik Pendidik · mulai", "Educator Feedback · start")],
  ["umpan-pertanyaan", L2("Umpan Balik Pendidik · pertanyaan", "Educator Feedback · questions")],
  ["umpan-terbit", L2("Umpan Balik Pendidik · terbitkan", "Educator Feedback · publish")],
  ["umpan-hasil", L2("Umpan Balik Pendidik · hasil", "Educator Feedback · result")],
  ["umpan-tipis", L2("Umpan Balik Pendidik · tanggapan sedikit", "Educator Feedback · few responses")],
];
function L2(id, en) { return { id, en }; }

const qs = new URLSearchParams(location.search);
let lang = qs.get("lang") === "en" ? "en" : "id";
let screen = SCREENS.some(([k]) => k === qs.get("screen")) ? qs.get("screen") : "beranda";
const t = (pair) => pair[lang];

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, String(v));
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    node.append(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

const part = (label, text) => el("div", {}, [el("dt", { text: label }), el("dd", { text })]);

const chainOf = (x) => el("dl", { class: "chain" }, [
  part(t(CHAIN.supports), t(x.supports)),
  part(t(CHAIN.unknown), t(x.unknown)),
  part(t(CHAIN.step), t(x.step)),
]);

/** The decision row. Every option at the same weight, "no action" among them. */
const decideRow = (actions) => el("div", { class: "decide" }, [
  el("span", { class: "decide__label", text: t(CHAIN.decision) }),
  el("div", { class: "decide__row" }, actions.map((a) =>
    el("button", { type: "button", text: t(a) }))),
]);

const back = () => el("button", {
  type: "button", class: "backlink", text: t(UI.back),
  onclick: () => { screen = "beranda"; render(); },
});

// ---------------------------------------------------------------- beranda

function itemCard(it) {
  return el("li", { class: `card card--${it.tone}` }, [
    el("div", { class: "card__head" }, [
      el("span", { class: "card__kind", text: t(it.kind) }),
      el("span", { class: "card__subject", text: t(it.subject) }),
      el("span", { class: "card__since", text: t(it.since) }),
    ]),
    el("p", { class: "card__happened", text: t(it.happened) }),
    chainOf(it),
    // Not every item carries a decision. An item that waits on nobody gets
    // no buttons, which is how the page answers "is anything waiting for
    // me" without a separate count.
    it.actions.length ? decideRow(it.actions) : null,
    it.opens ? el("button", {
      type: "button", class: "opens", text: t(it.opensLabel),
      onclick: () => { screen = it.opens; render(); },
    }) : null,
  ]);
}

const beranda = () => [
  el("h1", { text: t(HOME.headline) }),
  el("p", { class: "lede", text: t(HOME.bounding) }),
  el("div", { class: "standing" }, [
    el("p", { style: "margin:0", text: t(HOME.suppression) }),
    el("p", { style: "margin:0", text: t(HOME.order) }),
    el("p", { style: "margin:0" }, [el("b", { text: t(HOME.decides) })]),
  ]),
  el("ul", { class: "items" }, ITEMS.map(itemCard)),
];

// ------------------------------------------------------------ Umpan Balik

const umpanMulai = () => [
  back(),
  el("h1", { text: t(UMPAN.start.title) }),
  el("p", { class: "lede", text: t(UMPAN.start.lede) }),
  el("p", { class: "boundary", text: t(UMPAN.start.boundary) }),
  // The direction, the unresolved escalation path, and the record-class
  // boundary — on the page, not only in the design document.
  el("p", { class: "boundary", id: "relationship", text: t(UMPAN.start.relationship) }),
  el("p", { class: "boundary", id: "escalation", text: t(UMPAN.start.escalation) }),
  el("p", { class: "boundary", id: "separate", text: t(UMPAN.start.separate) }),
  el("div", { class: "step", style: "margin-top:1.5rem" }, [
    el("div", { class: "scope" }, [
      el("b", { text: t(UMPAN.start.scopeLabel) }),
      el("span", { text: t(UMPAN.start.scope) }),
    ]),
  ]),
  el("div", { class: "buttons" }, [
    el("button", { type: "button", text: t(UMPAN.start.next),
      onclick: () => { screen = "umpan-pertanyaan"; render(); } }),
  ]),
];

const umpanPertanyaan = () => [
  back(),
  el("h1", { text: t(UMPAN.questions.title) }),
  el("p", { class: "lede", text: t(UMPAN.questions.lede) }),
  el("ul", { class: "pool" }, UMPAN.questions.pool.map((q) =>
    el("li", {}, [el("span", { class: "tick", "aria-hidden": "true", text: "✓" }),
                  el("span", { text: t(q) })]))),
  el("p", { class: "scale" }, [
    el("b", { text: t(UMPAN.questions.scaleLabel) + ": " }),
    UMPAN.questions.scale.map((s) => t(s)).join(" · "),
  ]),
  el("p", { class: "boundary", style: "margin-top:1rem",
    text: t(UMPAN.questions.excluded) }),
  el("p", { class: "boundary", style: "margin-top:0.75rem",
    text: t(UMPAN.questions.noFreeText) }),
  el("div", { class: "buttons" }, [
    el("button", { type: "button", text: t(UMPAN.questions.next),
      onclick: () => { screen = "umpan-terbit"; render(); } }),
  ]),
];

const umpanTerbit = () => [
  back(),
  el("h1", { text: t(UMPAN.publish.title) }),
  el("p", { class: "lede", text: t(UMPAN.publish.lede) }),
  // The anonymity contract, said before anything is published rather than
  // reassuringly afterwards.
  el("ul", { class: "terms" }, UMPAN.publish.terms.map((x) => el("li", { text: t(x) }))),
  el("div", { class: "buttons" }, [
    el("button", { type: "button", text: t(UMPAN.publish.confirm) }),
    el("button", { type: "button", text: t(UMPAN.publish.cancel),
      onclick: () => { screen = "beranda"; render(); } }),
  ]),
];

const umpanHasil = () => [
  back(),
  el("h1", { text: t(UMPAN.result.headline) }),
  el("p", { class: "lede", text: t(UMPAN.result.bounding) }),
  el("div", { class: "step" }, [
    el("h2", { text: t(UMPAN.result.rowsLabel) }),
    el("ul", { class: "rows" }, UMPAN.result.rows.map((r) => el("li", {}, [
      el("p", { class: "q", text: t(UMPAN.questions.pool[r.q]) }),
      el("p", { class: "d", text: t(r.text) }),
    ]))),
  ]),
  chainOf(UMPAN.result),
  decideRow(UMPAN.result.actions),
];

const umpanTipis = () => [
  back(),
  el("h1", { text: t(UMPAN.thin.headline) }),
  el("p", { class: "lede", text: t(UMPAN.thin.bounding) }),
  el("p", { class: "boundary", text: t(UMPAN.thin.unresolved) }),
  el("p", { class: "lede", style: "margin-top:1.5rem", text: t(UMPAN.thin.step) }),
];

const VIEWS = {
  beranda, "umpan-mulai": umpanMulai, "umpan-pertanyaan": umpanPertanyaan,
  "umpan-terbit": umpanTerbit, "umpan-hasil": umpanHasil, "umpan-tipis": umpanTipis,
};

function render() {
  document.documentElement.lang = lang;
  document.getElementById("sample-label").textContent = t(SAMPLE.label);
  document.getElementById("sample-body").textContent = t(SAMPLE.body);

  const crumb = document.getElementById("crumb");
  crumb.replaceChildren(el("b", { text: t(UI.role) }), " · ", t(UI.surface));

  const box = document.getElementById("screens");
  box.setAttribute("aria-label", t(UI.screenLabel));
  box.replaceChildren(
    el("span", { class: "screens__label", text: t(UI.screenLabel) + ":" }),
    ...SCREENS.map(([key, label]) => el("button", {
      type: "button", text: t(label), "aria-pressed": key === screen,
      onclick: () => { screen = key; render(); },
    })),
  );

  const langBox = document.getElementById("lang");
  langBox.setAttribute("aria-label", t(UI.langLabel));
  langBox.replaceChildren(
    el("button", { type: "button", text: "ID", "aria-pressed": lang === "id",
      onclick: () => { lang = "id"; render(); } }),
    el("button", { type: "button", class: "lang__second", text: "EN",
      "aria-pressed": lang === "en", onclick: () => { lang = "en"; render(); } }),
  );

  document.getElementById("view").replaceChildren(...VIEWS[screen]());
}

render();
