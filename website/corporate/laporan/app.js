import { el } from "../shared/dom.js";
import { mountChrome } from "../shared/chrome.js";
import { withLang } from "../shared/lang.js";
import { HEADER, PRINCIPLE, STATES, WORDS, TIERS, REPORT_A, REPORT_B, CLOSING } from "./content.js";

const lang = mountChrome("laporan");
const t = (pair) => pair[lang];
document.title = lang === "id" ? "Laporan PINTAR" : "PINTAR Reports";

const TAG = lang === "id" ? "id-ID" : "en-GB";
const num = (n) => new Intl.NumberFormat(TAG).format(n);
const pct = (v) => new Intl.NumberFormat(TAG, { style: "percent", maximumFractionDigits: 0 }).format(v);

// A readiness or topic row, as the product draws it (BarisKesiapan): a word, a
// number, and one neutral bar. NO STATUS COLOUR. A tier is where a child is
// standing today, not a verdict, and the bar is the same ink for every row.
function row(label, shown, share) {
  return el("div", { class: "rrow" }, [
    el("span", { text: label }),
    el("span", { class: "num", text: shown }),
    el("div", { class: "rbar", "aria-hidden": "true" }, [el("i", { style: `width:${(share * 100).toFixed(1)}%` })]),
  ]);
}

/** One figure, in whichever of the three evidence states its data declares. */
function figure(f, persona) {
  const head = el("span", { class: "fig__label", text: t(f.label) });
  const attrs = { class: "fig", "data-metric": f.metric, "data-state": f.state };

  if (f.state === "belum_cukup") {
    return el("div", attrs, [head,
      el("span", { class: "fig__absent", text: `${t(STATES.belum_cukup.shows)} (${num(f.have)}/${num(f.needed)})` })]);
  }
  if (f.state === "belum_ada") {
    return el("div", attrs, [head, el("span", { class: "fig__absent", text: t(STATES.belum_ada.shows) })]);
  }

  const sample = persona === "educator"
    ? `${t(WORDS.from)} ${num(f.have)} ${t(WORDS.students)} · ${t(WORDS.minimum)} ${num(f.needed)}`
    : `${t(WORDS.fromStaff)} ${num(f.have)}`;

  if (f.kind === "topics") {
    return el("div", attrs, [head,
      el("div", { class: "rrows" }, f.rows.map((r) => row(t(r.name), pct(r.value), r.value))),
      el("span", { class: "fig__action", text: t(f.meaning) })]);
  }
  if (f.kind === "misconceptions") {
    return el("div", attrs, [head,
      el("ul", { class: "keliru" }, f.items.map((k) => el("li", {}, [
        el("span", { class: "keliru__name", text: t(k.name) }),
        el("span", { class: "fig__sample", text: `${num(k.occurrences)} ${t(WORDS.times)}` }),
        el("span", { class: "keliru__remedy", text: t(k.remedy) }),
      ])))]);
  }
  if (f.kind === "tiers") {
    const total = Object.values(f.tiers).reduce((a, b) => a + b, 0);
    return el("div", attrs, [head,
      el("span", { class: "fig__meaning", text: t(f.meaning) }),
      el("div", { class: "rrows" }, Object.entries(f.tiers).map(([k, n]) => row(t(TIERS[k].name), num(n), n / total))),
      f.action ? el("span", { class: "fig__action", text: t(f.action) }) : null]);
  }

  const shown = f.kind === "percent" ? pct(f.value)
    : f.kind === "points" ? `${f.value > 0 ? "+" : ""}${num(Math.round(f.value * 100))} ${t(WORDS.points)}`
    : num(f.value);
  return el("div", attrs, [head,
    el("span", { class: "fig__value num", text: shown }),
    el("span", { class: "fig__meaning", text: t(f.meaning) }),
    el("span", { class: "fig__sample", text: sample }),
    f.action ? el("span", { class: "fig__action", text: t(f.action) }) : null]);
}

function reportHead(r) {
  return el("div", { class: "report__head" }, [
    el("h3", { text: t(r.title) }),
    el("span", { class: "label", style: "color:var(--ink-faint)", text: t(r.meta) }),
  ]);
}

const reportA = el("div", {}, [
  el("span", { class: "label label--brand", text: t(REPORT_A.label) }),
  el("div", { class: "report mt-3", "data-report": "educator" }, [
    reportHead(REPORT_A),
    el("p", { class: "report__intro", text: t(REPORT_A.intro) }),
    el("h4", { class: "report__h", text: t(WORDS.where) }),
    el("dl", { class: "report__facts" }, [
      el("dt", { text: t(WORDS.submitted) }),
      el("dd", { class: "num", text: `${num(REPORT_A.submitted)} / ${num(REPORT_A.classSize)}` }),
    ]),
    el("h4", { class: "report__h", text: t(WORDS.conclusions) }),
    ...REPORT_A.figures.map((f) => figure(f, "educator")),
    el("p", { class: "report__foot", text: t(REPORT_A.foot) }),
  ]),
]);

// Evidence readiness is COUNTED from the figures, never typed in beside them,
// so the summary cannot disagree with the cards above it. A state with no
// figure in it is not drawn, as in the product (RingkasKesiapan).
const counts = { cukup: 0, belum_cukup: 0, belum_ada: 0 };
for (const f of REPORT_B.figures) counts[f.state] += 1;

const reportB = el("div", {}, [
  el("span", { class: "label label--brand", text: t(REPORT_B.label) }),
  el("div", { class: "report mt-3", "data-report": "management" }, [
    reportHead(REPORT_B),
    ...REPORT_B.figures.map((f) => figure(f, "staff")),
    el("h4", { class: "report__h", text: t(STATES.title) }),
    el("ul", { class: "kesiapan" }, Object.entries(counts).filter(([, n]) => n > 0).map(([k, n]) =>
      el("li", {}, [el("span", { class: "num kesiapan__n", text: num(n) }), el("span", { text: t(STATES[k].name) })]))),
    el("p", { class: "report__foot", text: t(PRINCIPLE.body) }),
  ]),
]);

const header = el("section", { class: "section--tight" }, [
  el("div", { class: "wrap", style: "max-width:44em" }, [
    el("span", { class: "label label--brand", text: t(HEADER.eyebrow) }),
    el("h1", { class: "mt-3", style: "font-size:var(--fs-h1)", text: t(HEADER.headline) }),
    el("p", { class: "lede mt-4", text: t(HEADER.lede) }),
  ]),
]);

const principle = el("section", { class: "section--sunken center" }, [
  el("div", { class: "wrap", style: "max-width:38em" }, [
    el("span", { class: "label", text: t(PRINCIPLE.label) }),
    el("p", { class: "mt-3", style: "font-size:var(--fs-h2); font-weight:600", text: t(PRINCIPLE.line) }),
    el("p", { class: "lede mt-4", style: "margin-left:auto; margin-right:auto", text: t(PRINCIPLE.body) }),
    el("p", { class: "mt-3", style: "font-size:var(--fs-small); color:var(--ink-soft)", text: t(PRINCIPLE.source) }),
  ]),
]);

const reports = el("section", {}, [
  el("div", { class: "wrap grid-2", style: "align-items:start" }, [reportA, reportB]),
]);

const key = el("section", { class: "section--tight section--sunken" }, [
  el("div", { class: "wrap grid-2", style: "align-items:start" }, [
    el("div", {}, [
      el("h2", { style: "font-size:var(--fs-h3)", text: t(STATES.title) }),
      el("p", { class: "mt-3", text: t(STATES.intro) }),
      el("dl", { class: "key mt-4" }, ["cukup", "belum_cukup", "belum_ada"].flatMap((k) => [
        el("dt", { text: t(STATES[k].name) }),
        el("dd", { text: t(STATES[k].shows) }),
      ])),
    ]),
    el("div", {}, [
      el("h2", { style: "font-size:var(--fs-h3)", text: t(REPORT_A.figures.find((f) => f.kind === "tiers").label) }),
      el("dl", { class: "key mt-4" }, Object.values(TIERS).flatMap((x) => [
        el("dt", { text: t(x.name) }),
        el("dd", { text: t(x.rule) }),
      ])),
    ]),
  ]),
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

document.getElementById("view").replaceChildren(header, principle, reports, key, closing);
