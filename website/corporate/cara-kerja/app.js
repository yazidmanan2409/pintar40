import { el } from "../shared/dom.js";
import { mountChrome } from "../shared/chrome.js";
import { withLang } from "../shared/lang.js";
import { HEADER, SEQUENCE, CROSSLINK, CLOSING } from "./content.js";

const lang = mountChrome("cara-kerja");
const t = (pair) => pair[lang];
document.title = lang === "id" ? "Cara Kerja PINTAR" : "How PINTAR Works";

const header = el("section", { class: "section--tight" }, [
  el("div", { class: "wrap", style: "max-width:44em" }, [
    el("span", { class: "label label--brand", text: t(HEADER.eyebrow) }),
    el("h1", { class: "mt-3", style: "font-size:var(--fs-h1)", text: t(HEADER.headline) }),
    el("p", { class: "lede mt-4", text: t(HEADER.lede) }),
  ]),
]);

const seq = el("section", {}, [
  el("div", { class: "wrap", style: "max-width:50em" }, [
    el("div", { class: "seq" },
      SEQUENCE.map((s, i) => el("div", { class: "seq__item" }, [
        el("div", { class: "seq__num", text: String(i + 1).padStart(2, "0") }),
        el("div", { class: "seq__body" }, [
          el("h3", { text: t(s.title) }),
          el("p", { text: t(s.body) }),
        ]),
      ]))),
  ]),
]);

const crosslink = el("section", { class: "section--tight section--sunken" }, [
  el("div", { class: "wrap", style: "display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px" }, [
    el("p", { style: "font-size:var(--fs-h3); max-width:26em", text: t(CROSSLINK.body) }),
    el("a", { class: "btn btn--outline", href: withLang("/apa-yang-dilakukan/", lang), text: t(CROSSLINK.cta) }),
  ]),
]);

const closing = el("section", { class: "center" }, [
  el("div", { class: "wrap" }, [
    el("h2", { style: "font-size:var(--fs-h1); max-width:20em; margin:0 auto", text: t(CLOSING.headline) }),
    el("div", { class: "mt-6" }, [
      el("a", { class: "btn btn--primary", href: withLang("/mini-pintar/", lang), text: t(CLOSING.cta) }),
    ]),
  ]),
]);

document.getElementById("view").replaceChildren(header, seq, crosslink, closing);
