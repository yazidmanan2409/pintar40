// Renders the header (brand, restrained primary nav, language switch,
// primary CTA) and footer (full sitemap) that every page shares, plus the
// design-sample banner. One place to edit navigation; every page stays
// consistent by construction instead of by copy-paste discipline.

import { el, L } from "./dom.js";
import { SAMPLE, PAGES, CTA, FOOTER, NAV_LABEL, MENU_OPEN, MENU_CLOSE, SKIP_LINK } from "./content.js";
import { getLang, setLang, withLang, siteAsset } from "./lang.js";

/**
 * The supplied PINTAR SELALU mark, from the product's own file
 * (public/brand/pintar-selalu-logo.png on main, copied byte for byte into
 * shared/brand/; website verification compares the hashes). Rendered the way
 * the product renders it: a plain <img> at the artwork's intrinsic size,
 * height set in CSS, width never set. The public product name is PINTAR; the
 * artwork reads PINTAR SELALU, and its alt text says what it shows.
 *
 * In the site header it links Home — ordinary website navigation, ruled
 * separately from the product's own "not a link" rule for its app shells.
 * The path is relative to the page (siteAsset), so the logo loads wherever
 * the site is served from.
 */
export const LOGO_SRC = "shared/brand/pintar-selalu-logo.png";
function logo() {
  return el("img", { class: "brand__logo", src: siteAsset(LOGO_SRC), alt: "PINTAR SELALU",
    width: 766, height: 429 });
}

export function renderSample(mount, lang) {
  mount.replaceChildren(
    el("div", { class: "sample" }, [
      el("div", { class: "sample__in" }, [
        el("b", { text: SAMPLE.label[lang] }),
        el("span", { text: SAMPLE.body[lang] }),
      ]),
    ]),
  );
}

export function renderHeader(mount, { lang, active }) {
  const t = (pair) => pair[lang];
  const primaryPages = PAGES.filter((p) => p.primary);
  const isActive = (p) => p.slug === active;

  const links = primaryPages.map((p) => el("a", {
    href: withLang(p.href, lang),
    "aria-current": isActive(p) ? "page" : null,
    text: t(p.label),
  }));

  const header = el("header", { class: "site-header", id: "site-header" }, [
    el("a", { class: "sr-only", href: "#main" }, [t(SKIP_LINK)]),
    el("div", { class: "wrap site-header__bar" }, [
      el("a", { class: "brand", href: withLang("/", lang) }, [logo()]),
      el("nav", { class: "site-nav", "aria-label": t(NAV_LABEL) }, [
        el("ul", { class: "site-nav__links" }, links.map((a) => el("li", {}, [a]))),
      ]),
      el("div", { class: "site-header__end" }, [
        el("div", { class: "lang-switch", role: "group", "aria-label": "Bahasa / Language" }, [
          el("button", { type: "button", "aria-pressed": lang === "id", text: "ID",
            onclick: () => setLang("id") }),
          el("button", { type: "button", "aria-pressed": lang === "en", text: "EN",
            onclick: () => setLang("en") }),
        ]),
        el("a", { class: "btn btn--primary", href: withLang("/mini-pintar/", lang),
          text: t(CTA.tryMini) }),
        el("button", { type: "button", class: "nav-toggle", "aria-expanded": "false",
          "aria-controls": "site-header", text: "☰", "aria-label": t(MENU_OPEN),
          onclick: (e) => {
            const open = header.classList.toggle("site-header--open");
            e.currentTarget.setAttribute("aria-expanded", open ? "true" : "false");
            e.currentTarget.textContent = open ? "✕" : "☰";
            e.currentTarget.setAttribute("aria-label", open ? t(MENU_CLOSE) : t(MENU_OPEN));
          } }),
      ]),
    ]),
  ]);
  mount.replaceChildren(header);
}

export function renderFooter(mount, { lang }) {
  const t = (pair) => pair[lang];
  const col = (heading, pages) => el("div", {}, [
    el("h4", { text: t(heading) }),
    el("ul", {}, pages.map((p) => el("li", {}, [
      el("a", { href: withLang(p.href, lang), text: t(p.label) }),
    ]))),
  ]);

  const explore = PAGES.filter((p) => ["beranda", "apa-yang-dilakukan", "cara-kerja", "laporan"].includes(p.slug));
  const roles = PAGES.filter((p) => ["untuk-pendidik", "untuk-manajemen", "mini-pintar"].includes(p.slug));
  const about = PAGES.filter((p) => ["tentang", "kontak"].includes(p.slug));

  mount.replaceChildren(
    el("footer", { class: "site-footer" }, [
      el("div", { class: "wrap site-footer__in" }, [
        el("div", { class: "site-footer__grid" }, [
          el("div", { class: "site-footer__brand" }, [
            el("a", { class: "brand", href: withLang("/", lang) }, [logo()]),
            el("p", { text: t(FOOTER.tagline) }),
          ]),
          col(FOOTER.navHeading, explore),
          col(FOOTER.roleHeading, roles),
          col(FOOTER.aboutHeading, about),
        ]),
        el("p", { class: "site-footer__status", text: t(FOOTER.status) }),
        el("div", { class: "site-footer__bottom" }, [
          el("span", { text: t(FOOTER.copyright) }),
          el("div", { class: "lang-switch", role: "group", "aria-label": "Bahasa / Language" }, [
            el("button", { type: "button", "aria-pressed": lang === "id", text: "ID",
              onclick: () => setLang("id") }),
            el("button", { type: "button", "aria-pressed": lang === "en", text: "EN",
              onclick: () => setLang("en") }),
          ]),
        ]),
      ]),
    ]),
  );
}

/** Call once per page: renders sample banner + header + footer into their
 *  mount points and returns the resolved language for the page's own
 *  content to use. */
export function mountChrome(active) {
  const lang = getLang();
  document.documentElement.lang = lang;
  renderSample(document.getElementById("sample-mount"), lang);
  renderHeader(document.getElementById("header-mount"), { lang, active });
  renderFooter(document.getElementById("footer-mount"), { lang });
  return lang;
}

export { L };
