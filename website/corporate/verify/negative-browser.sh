#!/usr/bin/env bash
# PINTAR corporate website — negative plants for what only a browser sees.
#
# Each defect below is built to slip past the source checks (audit.mjs and
# canonical.mjs stay green on it, or could) and to be caught only by
# view.mjs, because it only exists once the page is rendered: a storage call
# spelled so no scanner finds it, a style that overrides a token from
# somewhere else, a font that does not load, a link that drops the language.
#
# Run: bash verify/negative-browser.sh   (~10 minutes)

set -uo pipefail
APP="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BAK="$(mktemp -d)"
cp -r "$APP"/. "$BAK"/
restore() { cp -r "$BAK"/. "$APP"/; }
trap 'restore; rm -rf "$BAK"' EXIT

pass=0; fail=0

try() { # name file 'anchor||replacement' expected-failure-substring
  local name="$1" file="$2" expr="$3" expect="$4"
  restore
  if ! ( cd "$APP" && python3 - "$file" "$expr" <<'PY'
import sys, pathlib
f, expr = sys.argv[1], sys.argv[2]
p = pathlib.Path(f); s = p.read_text(encoding="utf-8")
for part in expr.split("@@"):
    old, new = part.split("||")
    assert s.count(old) >= 1, f"injection anchor not found in {f}: {old[:60]}"
    s = s.replace(old, new, 1)
p.write_text(s, encoding="utf-8")
PY
  ); then
    printf '  SETUP-FAIL  %s\n' "$name"; fail=$((fail+1)); return
  fi
  local out
  out="$( cd "$APP" && node verify/view.mjs 2>&1 )"
  if grep -qF -- "$expect" <<<"$out"; then
    printf '  caught      %s\n' "$name"; pass=$((pass+1))
  elif grep -q "view OK" <<<"$out"; then
    printf '  NOT CAUGHT  %s  (view stayed green)\n' "$name"; fail=$((fail+1))
  else
    printf '  WRONG FAIL  %s  (red, but not for the planted reason)\n' "$name"
    grep -E "^  " <<<"$out" | head -3; fail=$((fail+1))
  fi
}

echo "view.mjs — things only a browser can see:"
try "storage written by a name no scanner reads" shared/lang.js \
  'export function getLang() {||export function getLang() {
  window["local" + "Storage"].setItem("pintar-site-lang", "id");' \
  "localStorage is empty after the whole site"
try "a page drops a cookie by another route" laporan/app.js \
  'const lang = mountChrome("laporan");||const lang = mountChrome("laporan"); document["coo" + "kie"] = "seen=1; path=/";' \
  "no cookie after the whole site"
try "the logo drawn at another height" shared/style.css \
  '/* ------------------------------------------------------------------ form */||.site-header .brand__logo { height: 48px; }
/* ------------------------------------------------------------------ form */' \
  "the header logo is drawn at the product's 36px"
try "a report bar repainted in the brand" shared/style.css \
  '/* ------------------------------------------------------------------ form */||.report .rrow i { background: #245F55; }
/* ------------------------------------------------------------------ form */' \
  "every readiness and topic bar is the one neutral ink"
try "the typeface fails to load" shared/style.css \
  'src: url("fonts/plus-jakarta-sans-latin.woff2") format("woff2");||src: url("fonts/missing.woff2") format("woff2");' \
  "the product's typeface is loaded and in use"
try "a link that forgets the language" laporan/app.js \
  'el("a", { class: "btn btn--outline", href: withLang("/kontak/", lang), text: t(CLOSING.ctaSecondary) }),||el("a", { class: "btn btn--outline", href: "/kontak/", text: t(CLOSING.ctaSecondary) }),' \
  "every internal link carries the language"
try "quiet text nudged pale" shared/style.css \
  '--ink-faint:   #6E6852;||--ink-faint:   #B9B2A4;' \
  "text contrast"
try "a figure drawn in the wrong state" laporan/app.js \
  'const attrs = { class: "fig", "data-metric": f.metric, "data-state": f.state };||const attrs = { class: "fig", "data-metric": f.metric, "data-state": "cukup" };' \
  "is drawn in its declared state"

echo
echo "browser negative tests: $pass caught, $fail not caught"
[ "$fail" -eq 0 ] || exit 1
