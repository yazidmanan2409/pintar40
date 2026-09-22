// Language state, shared across every page of the corporate site.
//
// A ?lang= query parameter always wins and is remembered; otherwise the
// visitor's last choice (if any) is used; otherwise Bahasa Indonesia,
// which is the default language of the product, not a fallback.

const KEY = "pintar-site-lang";

export function getLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (q === "id" || q === "en") {
    try { localStorage.setItem(KEY, q); } catch { /* private mode: ignore */ }
    return q;
  }
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "id" || saved === "en") return saved;
  } catch { /* private mode: ignore */ }
  return "id";
}

export function setLang(lang) {
  try { localStorage.setItem(KEY, lang); } catch { /* private mode: ignore */ }
  const url = new URL(location.href);
  url.searchParams.set("lang", lang);
  location.href = url.toString();
}

/** Rewrite an internal href to carry the current language across navigation. */
export function withLang(href, lang) {
  const url = new URL(href, location.href);
  url.searchParams.set("lang", lang);
  return url.pathname + url.search;
}
