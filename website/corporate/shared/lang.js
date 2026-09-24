// Language state and internal links, shared across every page of the site.
//
// ZERO-WRITE. The language travels in `?lang=` and nowhere else: no
// localStorage, no sessionStorage, no cookie. Every internal link already
// carries it (withLang), so moving around the site never needs anything
// remembered on the visitor's device. Mini-PINTAR's ADR forbids persistence
// of any kind, including browser storage, and the site that contains it
// holds itself to the same rule rather than to a weaker one beside it.
//
// RELATIVE, SO THE SITE WORKS FROM ANY FOLDER. Routes are named from the
// site's own root ("/laporan/"), but no link is ever written that way: a
// link starting with "/" would leave the site the moment it is served from
// a subfolder such as /test/corporate/. withLang() turns a route into a path
// relative to the page it is written on ("../laporan/?lang=id"), and
// siteAsset() does the same for a file of the site. The site's root is the
// folder that holds shared/, found from this module's own address, so no
// deployment path is written anywhere.
//
// Bahasa Indonesia is the default language of the product, not a fallback.

const ROOT = new URL("../", import.meta.url).pathname;

/** "../" once for every folder between this page and the site's root. */
function upToRoot() {
  const here = location.pathname.startsWith(ROOT) ? location.pathname.slice(ROOT.length) : "";
  return "../".repeat((here.match(/\//g) || []).length);
}

/** A file of the site ("shared/brand/…"), relative to this page. */
export function siteAsset(path) {
  return upToRoot() + path.replace(/^\/+/, "");
}

export function getLang() {
  return new URLSearchParams(location.search).get("lang") === "en" ? "en" : "id";
}

export function setLang(lang) {
  const url = new URL(location.href);
  url.searchParams.set("lang", lang);
  location.href = url.toString();
}

/** A route of the site ("/laporan/"), relative to this page, in this language. */
export function withLang(route, lang) {
  const [path, hash = ""] = route.split("#");
  const relative = upToRoot() + path.replace(/^\/+/, "");
  return `${relative || "./"}?lang=${lang}${hash ? `#${hash}` : ""}`;
}
