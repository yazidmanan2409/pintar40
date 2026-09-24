import { el } from "../shared/dom.js";
import { mountChrome } from "../shared/chrome.js";
import { withLang } from "../shared/lang.js";
import { HEADER, ESSAY, CLOSING } from "./content.js";

const lang = mountChrome("tentang");
const t = (pair) => pair[lang];
document.title = lang === "id" ? "Tentang PINTAR" : "About PINTAR";

const header = el("section", { class: "section--tight" }, [
  el("div", { class: "wrap", style: "max-width:40em" }, [
    el("span", { class: "label label--brand", text: t(HEADER.eyebrow) }),
    el("h1", { class: "mt-3", style: "font-size:var(--fs-h1)", text: t(HEADER.headline) }),
    el("p", { class: "lede mt-4", text: t(HEADER.lede) }),
  ]),
]);

const essay = el("section", { class: "section--tight" }, [
  el("div", { class: "wrap" },
    ESSAY.map((e) => el("div", { class: "essay__item" }, [
      el("span", { class: "label label--brand", text: t(e.label) }),
      el("p", { text: t(e.body) }),
    ]))),
]);

const closing = el("section", { class: "center" }, [
  el("div", { class: "wrap" }, [
    el("h2", { style: "font-size:var(--fs-h1); max-width:20em; margin:0 auto", text: t(CLOSING.headline) }),
    el("div", { class: "mt-6", style: "display:flex; gap:16px; justify-content:center; flex-wrap:wrap" }, [
      el("a", { class: "btn btn--primary", href: withLang("/apa-yang-dilakukan/", lang), text: t(CLOSING.ctaPrimary) }),
      el("a", { class: "btn btn--outline", href: withLang("/mini-pintar/", lang), text: t(CLOSING.ctaSecondary) }),
    ]),
  ]),
]);

document.getElementById("view").replaceChildren(header, essay, closing);
