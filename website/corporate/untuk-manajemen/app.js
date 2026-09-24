import { el, ph } from "../shared/dom.js";
import { mountChrome } from "../shared/chrome.js";
import { withLang } from "../shared/lang.js";
import { HEADER, BOUNDARY, EXAMPLES, CLOSING } from "./content.js";

const lang = mountChrome("untuk-manajemen");
const t = (pair) => pair[lang];
document.title = lang === "id" ? "PINTAR untuk Manajemen Sekolah" : "PINTAR for School Management";

const header = el("section", { class: "section--tight" }, [
  el("div", { class: "wrap", style: "max-width:44em" }, [
    el("span", { class: "label label--brand", text: t(HEADER.eyebrow) }),
    el("h1", { class: "mt-3", style: "font-size:var(--fs-h1)", text: t(HEADER.headline) }),
    el("p", { class: "lede mt-4", text: t(HEADER.lede) }),
  ]),
]);

const boundary = el("section", { class: "section--tight section--sunken" }, [
  el("div", { class: "wrap" }, [
    el("span", { class: "label label--brand", text: t(BOUNDARY.label) }),
    el("h2", { class: "mt-3", style: "font-size:var(--fs-h2); max-width:22em", text: t(BOUNDARY.headline) }),
    el("p", { class: "lede mt-4", text: t(BOUNDARY.body) }),
  ]),
]);

function example(x) {
  return el("figure", { style: "margin:0" }, [
    ph({ type: x.type, size: x.size, ratio: x.ratio }),
    el("figcaption", { class: "mt-3", style: "font-size:var(--fs-small); color:var(--ink-soft)", text: t(x.caption) }),
  ]);
}

const featured = el("section", {}, [
  el("div", { class: "wrap" }, [
    example(EXAMPLES[0]),
    el("div", { class: "grid-2 mt-7" }, [example(EXAMPLES[1]), example(EXAMPLES[2])]),
  ]),
]);

const closing = el("section", { class: "center" }, [
  el("div", { class: "wrap" }, [
    el("h2", { style: "font-size:var(--fs-h1); max-width:20em; margin:0 auto", text: t(CLOSING.headline) }),
    el("div", { class: "mt-6", style: "display:flex; gap:16px; justify-content:center; flex-wrap:wrap" }, [
      el("a", { class: "btn btn--primary", href: withLang("/laporan/", lang), text: t(CLOSING.ctaPrimary) }),
      el("a", { class: "btn btn--outline", href: withLang("/mini-pintar/", lang), text: t(CLOSING.ctaSecondary) }),
    ]),
  ]),
]);

document.getElementById("view").replaceChildren(header, boundary, featured, closing);
