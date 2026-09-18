// Parent role view — a rendered design sample.
//
// No storage, no network, no analytics. The state switcher belongs to the
// review, not to the design: a parent sees one state, whichever one their
// child's evidence puts them in.

import { SAMPLE, UI, SECTIONS, RANKING, NOTE, STATES } from "./content.js";

const qs = new URLSearchParams(location.search);
let lang = qs.get("lang") === "en" ? "en" : "id";
let stateId = STATES.some((s) => s.id === qs.get("state")) ? qs.get("state") : STATES[0].id;
const t = (pair) => pair[lang];
const current = () => STATES.find((s) => s.id === stateId);

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

const section = (heading, ...paras) =>
  el("section", { class: "section" }, [el("h2", { text: heading }), ...paras]);

function render() {
  const s = current();
  document.documentElement.lang = lang;
  document.title = lang === "id" ? `Bagaimana ${t(UI.child)}?` : `How is ${t(UI.child)}?`;

  document.getElementById("sample-label").textContent = t(SAMPLE.label);
  document.getElementById("sample-body").textContent = t(SAMPLE.body);
  document.getElementById("who").textContent = t(UI.child);

  const states = document.getElementById("states");
  states.setAttribute("aria-label", t(UI.stateLabel));
  states.replaceChildren(
    el("span", { class: "states__label", text: t(UI.stateLabel) + ":" }),
    ...STATES.map((x) => el("button", {
      type: "button", text: t(x.tab), "aria-pressed": x.id === stateId,
      onclick: () => { stateId = x.id; render(); },
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

  document.getElementById("view").replaceChildren(
    // The answer. Heading plus one sentence carries it; the signpost says
    // whether anything needs attention and whether the parent must act, so
    // that all three questions the design test asks are answered here.
    el("div", { class: "answer" }, [
      el("h1", { text: t(s.headline) }),
      el("p", { class: "answer__bounding", text: t(s.bounding) }),
      el("p", { class: "answer__signpost", text: t(s.signpost) }),
    ]),

    section(t(SECTIONS.supported),
      el("p", { text: t(s.supported) })),

    // The limit sits directly under the finding, at the same size and the
    // same colour. A parent should not be able to read the finding without
    // reading what it does not establish.
    section(t(SECTIONS.attention),
      el("p", { text: t(s.attention) }),
      el("p", { class: "limit", text: t(s.attentionLimit) })),

    el("section", { class: "section action" }, [
      el("h2", { text: t(SECTIONS.action) }),
      el("p", { text: t(s.action) }),
      el("p", { class: "note", text: `${t(NOTE.suggestion)} ${t(s.actionNote)}` }),
      // Inert: this is a design sample, and wiring it would make it look
      // like a working surface.
      el("button", { type: "button", class: "talk", text: t(UI.talk) }),
    ]),

    el("section", { class: "notes" }, [
      // On demand, not permanently prominent: a parent who is not asking
      // about rank should not have to read about it every visit, and a
      // parent who is asking should find it without hunting.
      el("details", { class: "ranking" }, [
        el("summary", { text: t(RANKING.heading) }),
        el("p", { text: t(RANKING.body) }),
      ]),
      // The scope note stays visible. It is an evidence boundary, not an
      // aside: what this page cannot see is part of what it is saying.
      el("p", { class: "scope", text: t(NOTE.scope) }),
    ]),
  );
}

render();
