import { el, ph } from "./shared/dom.js";
import { mountChrome } from "./shared/chrome.js";
import { withLang } from "./shared/lang.js";
import { HERO, TRUST, SYSTEM, AUDIENCES, REPORTS_TEASER, CLOSING } from "./content.js";

const lang = mountChrome("beranda");
const t = (pair) => pair[lang];
document.title = lang === "id"
  ? "PINTAR — Lebih banyak waktu untuk mendidik"
  : "PINTAR — More time to educate";

const hero = el("section", { class: "section--tight" }, [
  el("div", { class: "wrap grid-asym" }, [
    el("div", {}, [
      el("span", { class: "label label--brand", text: t(HERO.eyebrow) }),
      el("h1", { class: "mt-3", style: "font-size:var(--fs-hero); line-height:1.02", text: t(HERO.headline) }),
      el("p", { class: "lede mt-5", text: t(HERO.lede) }),
      el("div", { class: "mt-6", style: "display:flex; gap:16px; flex-wrap:wrap" }, [
        el("a", { class: "btn btn--primary", href: withLang("/mini-pintar/", lang), text: t(HERO.ctaPrimary) }),
        el("a", { class: "btn btn--outline", href: withLang("/apa-yang-dilakukan/", lang), text: t(HERO.ctaSecondary) }),
      ]),
    ]),
    ph({
      type: "Pendidik Indonesia bekerja secara alami di kelas, fotografi dokumenter, bukan foto stok yang dipose",
      size: "1400 × 1700", ratio: "14:17",
      note: "Hero — asimetris, sisi kanan.",
    }),
  ]),
]);

const trust = el("section", { class: "section--tight" }, [
  el("div", { class: "wrap" }, [
    el("hr", { class: "rule" }),
    el("div", { class: "mt-6", style: "display:flex; justify-content:space-between; flex-wrap:wrap; gap:24px; align-items:baseline" }, [
      el("span", { class: "label", text: t(TRUST.label) }),
      el("div", { style: "display:flex; flex-wrap:wrap; gap:32px" },
        TRUST.items.map((it) => el("span", { style: "font-weight:600; font-size:1.05rem", text: t(it) }))),
    ]),
  ]),
]);

const system = el("section", {}, [
  el("div", { class: "wrap" }, [
    el("span", { class: "label label--brand", text: t(SYSTEM.label) }),
    el("h2", { class: "mt-3", style: "max-width:20em", text: t(SYSTEM.headline) }),
    el("p", { class: "lede mt-4", text: t(SYSTEM.lede) }),
    el("div", { class: "chain-mini" },
      SYSTEM.nodes.flatMap((n, i) => [
        el("span", { class: "chain-mini__node", text: t(n) }),
        i < SYSTEM.nodes.length - 1 ? el("span", { class: "chain-mini__arrow", "aria-hidden": "true", text: "→" }) : null,
      ]).filter(Boolean)),
    el("a", { class: "btn btn--text mt-6", href: withLang("/apa-yang-dilakukan/", lang), text: t(SYSTEM.cta) }),
  ]),
]);

function audienceCard(a, ratio, size) {
  return el("div", {}, [
    ph({ type: "Contoh tampilan PINTAR untuk peran ini, ilustrasi antarmuka, bukan foto",
      size, ratio }),
    el("span", { class: "label label--brand mt-5", text: t(a.label) }),
    el("h3", { class: "mt-2", style: "font-size:var(--fs-h2)", text: t(a.headline) }),
    el("p", { class: "lede mt-3", text: t(a.body) }),
    el("a", { class: "btn btn--text mt-5", href: withLang(a.href, lang), text: t(a.cta) }),
  ]);
}

const audiences = el("section", { class: "section--sunken" }, [
  el("div", { class: "wrap grid-2" }, [
    audienceCard(AUDIENCES.educators, "8:7", "1120 × 980"),
    audienceCard(AUDIENCES.management, "8:7", "1120 × 980"),
  ]),
]);

const reports = el("section", {}, [
  el("div", { class: "wrap grid-asym--rev" }, [
    ph({ type: "Contoh laporan PINTAR di layar laptop/tablet, ditampilkan miring ringan (mockup produk)",
      size: "1500 × 1100", ratio: "15:11" }),
    el("div", {}, [
      el("span", { class: "label label--brand", text: t(REPORTS_TEASER.label) }),
      el("h2", { class: "mt-3", text: t(REPORTS_TEASER.headline) }),
      el("p", { class: "lede mt-4", text: t(REPORTS_TEASER.body) }),
      el("a", { class: "btn btn--outline mt-6", href: withLang("/laporan/", lang), text: t(REPORTS_TEASER.cta) }),
    ]),
  ]),
]);

const closing = el("section", { class: "section--ink" }, [
  el("div", { class: "wrap center", style: "max-width:44em" }, [
    el("span", { class: "label", text: t(CLOSING.label) }),
    el("h2", { class: "mt-3", style: "font-size:var(--fs-h1)", text: t(CLOSING.headline) }),
    el("p", { class: "lede mt-4", style: "color:#D9D4C4; margin-left:auto; margin-right:auto", text: t(CLOSING.body) }),
    el("div", { class: "mt-7", style: "display:flex; gap:16px; justify-content:center; flex-wrap:wrap" }, [
      el("a", { class: "btn btn--brand", href: withLang("/mini-pintar/", lang), text: t(CLOSING.ctaPrimary) }),
      el("a", { class: "btn btn--outline", style: "border-color:#8A8677; color:var(--bg)",
        href: withLang("/kontak/", lang), text: t(CLOSING.ctaSecondary) }),
    ]),
  ]),
]);

document.getElementById("view").replaceChildren(hero, trust, system, audiences, reports, closing);
