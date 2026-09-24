import { el, ph } from "../shared/dom.js";
import { mountChrome } from "../shared/chrome.js";
import { withLang } from "../shared/lang.js";
import { HEADER, SEQUENCE, QUOTE, CLOSING } from "./content.js";

const lang = mountChrome("untuk-pendidik");
const t = (pair) => pair[lang];
document.title = lang === "id" ? "PINTAR untuk Pendidik" : "PINTAR for Educators";

const header = el("section", { class: "section--tight" }, [
  el("div", { class: "wrap grid-asym" }, [
    el("div", {}, [
      el("span", { class: "label label--brand", text: t(HEADER.eyebrow) }),
      el("h1", { class: "mt-3", style: "font-size:var(--fs-h1)", text: t(HEADER.headline) }),
      el("p", { class: "lede mt-4", text: t(HEADER.lede) }),
    ]),
    ph({ type: "Pendidik memeriksa hasil singkat di tablet sambil duduk bersama satu peserta didik, dokumenter",
      size: "1300 × 1600", ratio: "13:16" }),
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

const quote = el("section", { class: "section--sunken" }, [
  el("div", { class: "wrap" }, [
    el("p", { class: "inset-quote", text: t(QUOTE) }),
  ]),
]);

const closing = el("section", { class: "center" }, [
  el("div", { class: "wrap" }, [
    el("h2", { style: "font-size:var(--fs-h1); max-width:22em; margin:0 auto", text: t(CLOSING.headline) }),
    el("div", { class: "mt-6", style: "display:flex; gap:16px; justify-content:center; flex-wrap:wrap" }, [
      el("a", { class: "btn btn--primary", href: withLang("/mini-pintar/", lang), text: t(CLOSING.ctaPrimary) }),
      el("a", { class: "btn btn--outline", href: withLang("/apa-yang-dilakukan/", lang), text: t(CLOSING.ctaSecondary) }),
    ]),
  ]),
]);

document.getElementById("view").replaceChildren(header, seq, quote, closing);
