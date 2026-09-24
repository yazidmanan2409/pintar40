// Language state, shared across every page of the corporate site.
//
// ZERO-WRITE. The language travels in `?lang=` and nowhere else: no
// localStorage, no sessionStorage, no cookie. Every internal link already
// carries it (withLang), so moving around the site never needs anything
// remembered on the visitor's device. Mini-PINTAR's ADR forbids persistence
// of any kind, including browser storage, and the site that contains it
// holds itself to the same rule rather than to a weaker one beside it.
//
// Bahasa Indonesia is the default language of the product, not a fallback.

export function getLang() {
  return new URLSearchParams(location.search).get("lang") === "en" ? "en" : "id";
}

export function setLang(lang) {
  const url = new URL(location.href);
  url.searchParams.set("lang", lang);
  location.href = url.toString();
}

/** Rewrite an internal href to carry the current language across navigation. */
export function withLang(href, lang) {
  const url = new URL(href, location.href);
  url.searchParams.set("lang", lang);
  return url.pathname + url.search + url.hash;
}
