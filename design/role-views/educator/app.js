// Educator role view — a rendered design sample.
//
// No storage, no network, no analytics: it is a sample page, and there is
// nothing here worth keeping about whoever reviews it. The decision buttons
// are inert on purpose — this view proposes a grammar, and wiring it to
// `record_integrity_review` would make a design sample look like a working
// surface, which is exactly what the brief says not to do.

import { FRAME, SAMPLE, CHAIN, CARDS, QUIET, UI } from "./content.js";

let lang = new URLSearchParams(location.search).get("lang") === "en" ? "en" : "id";
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

/** One labelled part of the doctrine chain. */
const part = (label, text, key = false) =>
  el("div", {}, [
    el("dt", { text: label }),
    el("dd", { class: key ? "is-key" : null, text }),
  ]);

function card(c) {
  return el("li", { class: `card card--${c.tone}` }, [
    el("div", { class: "card__head" }, [
      // The tone lives on the kind and on the rule. Both name a kind of
      // decision; neither is ever attached to a person.
      el("span", { class: "card__kind", text: t(c.kind) }),
      el("span", { class: "card__subject", text: t(c.subject) }),
      el("span", { class: "card__since", text: t(c.since) }),
    ]),
    el("p", { class: "card__happened", text: t(c.happened) }),
    el("dl", { class: "chain" }, [
      part(t(CHAIN.supports), t(c.supports), true),
      part(t(CHAIN.unknown), t(c.unknown), true),
      part(t(CHAIN.step), t(c.step)),
    ]),
    el("div", { class: "decide" }, [
      el("span", { class: "decide__label", text: t(CHAIN.decision) }),
      el("div", { class: "decide__row" }, c.actions.map((a) =>
        el("button", { type: "button", text: t(a) }))),
    ]),
  ]);
}

function render() {
  document.documentElement.lang = lang;
  document.title = `${t(FRAME.role)} — ${t(FRAME.question)}`;
  document.getElementById("sample-label").textContent = t(SAMPLE.label);
  document.getElementById("sample-body").textContent = t(SAMPLE.body);

  const crumb = document.getElementById("crumb");
  crumb.replaceChildren(
    el("b", { text: t(FRAME.role) }), " · ", t(FRAME.surface));

  const langBox = document.getElementById("lang");
  langBox.setAttribute("aria-label", t(UI.langLabel));
  langBox.replaceChildren(
    el("button", { type: "button", text: "ID", "aria-pressed": lang === "id",
      onclick: () => { lang = "id"; render(); } }),
    el("button", { type: "button", class: "lang__second", text: "EN",
      "aria-pressed": lang === "en", onclick: () => { lang = "en"; render(); } }),
  );

  document.getElementById("view").replaceChildren(
    el("h1", { text: t(FRAME.question) }),
    el("p", { class: "head__count", text: t(UI.cardCount(CARDS.length)) }),

    // The standing sentences: what this page does, how it is ordered, and
    // who decides. They are the contract, so they sit above the work.
    el("div", { class: "standing" }, [
      el("p", { style: "margin:0", text: t(FRAME.suppression) }),
      el("p", { style: "margin:0", text: t(FRAME.order) }),
      el("p", { style: "margin:0" }, [el("b", { text: t(FRAME.decides) })]),
    ]),

    el("ul", { class: "cards" }, CARDS.map(card)),

    el("section", { class: "quiet" }, [
      el("h2", { class: "quiet__label", text: t(QUIET.label) }),
      el("ul", {}, QUIET.lines.map((l) => el("li", { text: t(l) }))),
    ]),
  );
}

render();
