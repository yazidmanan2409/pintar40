import { el } from "../shared/dom.js";
import { mountChrome } from "../shared/chrome.js";
import { withLang } from "../shared/lang.js";
import { HEADER, PRINCIPLE, BANDS_LEGEND, REPORT_A, REPORT_B, CLOSING } from "./content.js";

const lang = mountChrome("laporan");
const t = (pair) => pair[lang];
document.title = lang === "id" ? "Laporan PINTAR" : "PINTAR Reports";

function legend() {
  return el("div", { class: "report__legend" }, [
    el("span", {}, [el("span", { class: "report__dot report__dot--strong" }), t(BANDS_LEGEND.strong)]),
    el("span", {}, [el("span", { class: "report__dot report__dot--mid" }), t(BANDS_LEGEND.mid)]),
    el("span", {}, [el("span", { class: "report__dot report__dot--low" }), t(BANDS_LEGEND.low)]),
  ]);
}

function reportRow(row, i, data) {
  const pct = (n) => `${(n / row.total) * 100}%`;
  const isUnresolved = i === data.unresolvedRow;
  const caption = lang === "id"
    ? `${row.strong} dari ${row.total} kuat · ${row.mid} sebagian · ${row.low} belum cukup bukti`
    : `${row.strong} of ${row.total} strong · ${row.mid} partial · ${row.low} not enough evidence`;
  return el("div", { class: "report__row" }, [
    el("div", { class: "report__row-head" }, [
      el("span", { style: "font-weight:600", text: t(row.name) }),
    ]),
    el("div", { class: "report__bands", role: "img", "aria-label": caption }, [
      el("span", { class: "report__band--strong", style: `width:${pct(row.strong)}` }),
      el("span", { class: "report__band--mid", style: `width:${pct(row.mid)}` }),
      el("span", { class: "report__band--low", style: `width:${pct(row.low)}` }),
    ]),
    el("p", { class: "mt-2", style: `font-size:0.875rem; color:var(--ink-soft); ${isUnresolved ? "font-weight:600" : ""}`,
      text: caption }),
  ]);
}

function reportCard(data) {
  return el("div", {}, [
    el("span", { class: "label label--accent", text: t(data.label) }),
    el("div", { class: "report mt-3" }, [
      el("div", { class: "report__head" }, [
        el("h3", { text: t(data.title) }),
        el("span", { class: "label", style: "color:var(--ink-faint)", text: t(data.meta) }),
      ]),
      ...data.rows.map((r, i) => reportRow(r, i, data)),
      legend(),
      el("div", { class: "report__unresolved mt-5" }, [t(data.unresolved)]),
    ]),
  ]);
}

const header = el("section", { class: "section--tight" }, [
  el("div", { class: "wrap", style: "max-width:44em" }, [
    el("span", { class: "label label--accent", text: t(HEADER.eyebrow) }),
    el("h1", { class: "mt-3", style: "font-size:var(--fs-h1)", text: t(HEADER.headline) }),
    el("p", { class: "lede mt-4", text: t(HEADER.lede) }),
  ]),
]);

const principle = el("section", { class: "section--sunken center" }, [
  el("div", { class: "wrap", style: "max-width:38em" }, [
    el("span", { class: "label", text: t(PRINCIPLE.label) }),
    el("p", { class: "mt-3", style: "font-size:var(--fs-h2); font-weight:600", text: t(PRINCIPLE.line) }),
    el("p", { class: "lede mt-4", style: "margin-left:auto; margin-right:auto", text: t(PRINCIPLE.body) }),
  ]),
]);

const reports = el("section", {}, [
  el("div", { class: "wrap grid-2" }, [reportCard(REPORT_A), reportCard(REPORT_B)]),
]);

const closing = el("section", { class: "center" }, [
  el("div", { class: "wrap" }, [
    el("h2", { style: "font-size:var(--fs-h1); max-width:22em; margin:0 auto", text: t(CLOSING.headline) }),
    el("div", { class: "mt-6", style: "display:flex; gap:16px; justify-content:center; flex-wrap:wrap" }, [
      el("a", { class: "btn btn--primary", href: withLang("/mini-pintar/", lang), text: t(CLOSING.ctaPrimary) }),
      el("a", { class: "btn btn--outline", href: withLang("/kontak/", lang), text: t(CLOSING.ctaSecondary) }),
    ]),
  ]),
]);

document.getElementById("view").replaceChildren(header, principle, reports, closing);
