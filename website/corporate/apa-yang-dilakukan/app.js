import { el, ph } from "../shared/dom.js";
import { mountChrome } from "../shared/chrome.js";
import { withLang } from "../shared/lang.js";
import { HEADER, FLOW, PULLQUOTE, EXPLAIN, CROSSLINK, CLOSING } from "./content.js";

const lang = mountChrome("apa-yang-dilakukan");
const t = (pair) => pair[lang];
document.title = lang === "id" ? "Apa yang Dilakukan PINTAR" : "What PINTAR Does";

const header = el("section", { class: "section--tight" }, [
  el("div", { class: "wrap", style: "max-width:44em" }, [
    el("span", { class: "label label--accent", text: t(HEADER.eyebrow) }),
    el("h1", { class: "mt-3", style: "font-size:var(--fs-h1)", text: t(HEADER.headline) }),
    el("p", { class: "lede mt-4", text: t(HEADER.lede) }),
  ]),
]);

const flow = el("section", { class: "section--tight" }, [
  el("div", { class: "wrap" }, [
    el("div", { class: "flow" },
      FLOW.flatMap((f, i) => [
        el("div", { class: "flow__node" }, [
          el("b", { text: t(f.node) }),
          el("span", { text: t(f.desc) }),
        ]),
        i < FLOW.length - 1 ? el("div", { class: "flow__arrow", "aria-hidden": "true", text: "→" }) : null,
      ]).filter(Boolean)),
  ]),
]);

const pull = el("section", { class: "section--ink center" }, [
  el("div", { class: "wrap" }, [
    el("span", { class: "label", text: t(PULLQUOTE.label) }),
    el("p", { class: "mt-4", style: "font-size:var(--fs-h1); font-weight:600; letter-spacing:-0.01em; max-width:22em; margin:0 auto", text: t(PULLQUOTE.line) }),
  ]),
]);

function explainBlock(x) {
  return el("div", {}, [
    el("span", { class: "label label--accent", text: t(x.label) }),
    el("h2", { class: "mt-3", style: "font-size:var(--fs-h2)", text: t(x.headline) }),
    el("p", { class: "lede mt-4", text: t(x.body) }),
  ]);
}

const explain = el("section", {}, [
  el("div", { class: "wrap grid-2" }, [
    explainBlock(EXPLAIN.coherence),
    explainBlock(EXPLAIN.human),
  ]),
]);

const crosslink = el("section", { class: "section--tight section--sunken" }, [
  el("div", { class: "wrap", style: "display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px" }, [
    el("p", { style: "font-size:var(--fs-h3); max-width:26em", text: t(CROSSLINK.body) }),
    el("a", { class: "btn btn--outline", href: withLang("/cara-kerja/", lang), text: t(CROSSLINK.cta) }),
  ]),
]);

const closing = el("section", { class: "center" }, [
  el("div", { class: "wrap" }, [
    el("h2", { style: "font-size:var(--fs-h1); max-width:20em; margin:0 auto", text: t(CLOSING.headline) }),
    el("div", { class: "mt-6", style: "display:flex; gap:16px; justify-content:center; flex-wrap:wrap" }, [
      el("a", { class: "btn btn--primary", href: withLang("/mini-pintar/", lang), text: t(CLOSING.ctaPrimary) }),
      el("a", { class: "btn btn--outline", href: withLang("/untuk-pendidik/", lang), text: t(CLOSING.ctaSecondary) }),
    ]),
  ]),
]);

document.getElementById("view").replaceChildren(header, flow, pull, explain, crosslink, closing);
