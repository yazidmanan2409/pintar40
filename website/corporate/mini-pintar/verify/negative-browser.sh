#!/usr/bin/env bash
# Mini-PINTAR — negative plants for the checks that only a browser can make.
#
# negative.sh plants against the three source verifiers, which run in a
# second. These three defects are invisible to a source scan: a colour that
# fails contrast only fails once it is rendered, a committed answer that is
# still clickable looks correct in the source that guards it, and a
# misconception code can reach the DOM by a route the renderer scan does
# not cover.
#
# Runs journey.mjs in its reduced mode (MINI_PINTAR_FAST=1): every rule
# still runs, the exhaustive sweeps shrink. The verification of record is
# always the full run.
#
# Run: bash verify/negative-browser.sh   (~25 minutes)

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
  out="$( cd "$APP" && MINI_PINTAR_FAST=1 node verify/journey.mjs 2>&1 )"
  if grep -q "$expect" <<<"$out"; then
    printf '  caught      %s\n' "$name"; pass=$((pass+1))
  elif grep -q "journey OK" <<<"$out"; then
    printf '  NOT CAUGHT  %s  (journey stayed green)\n' "$name"; fail=$((fail+1))
  else
    printf '  WRONG FAIL  %s  (red, but not for the planted reason)\n' "$name"
    grep -E "^  " <<<"$out" | head -3
    fail=$((fail+1))
  fi
}

echo "journey.mjs — things only a browser can see:"

# 1. Contrast. A quiet grey nudged pale is the single most common way a
#    calm surface stops being readable, and no source scan sees it.
try "text contrast broken" style.css \
  '--ink-3: #5f6a73;||--ink-3: #b9b2a4;' \
  "contrast at"

# 2. The commit lock, defeated behaviourally rather than structurally: the
#    source still reads `committed ? committedOptions(...)`, so the audit's
#    renderer scan stays green while the answer is editable again.
try "committed answer editable" app.js \
  'return el("li", {
      class: "opt opt--fixed"||return el("button", {
      type: "button",
      onclick: () => { s.checkChoices[s.checkIndex] = o.label; render(); },
      class: "opt opt--fixed"' \
  "clicking after commit does not change the answer"

# 3. A misconception code reaching the DOM through optionGroup, which the
#    renderer scan does not cover because it is not part of the check view.
try "taxonomy reaches the DOM" app.js \
  '"data-label": o.label,||"data-label": o.label, "data-mc": (o.misconception ? o.misconception : ""),' \
  "no misconception code appears in the document"

# 4–10. The school's side. Each is a way to make it misrepresent PINTAR
#    while every source check still reads correctly.
try "a readiness bar in the brand colour" style.css \
  '.rbar i { display: block; height: 100%; background: var(--ink-3); }||.rbar i { display: block; height: 100%; background: var(--green); }' \
  "every readiness bar is one neutral ink"

try "the educator sees a number for a class of one" app.js \
  'el("span", { class: "fig__absent", text: sentence }),||el("span", { class: "fig__value", text: "100%" }), el("span", { class: "fig__absent", text: sentence }),' \
  "no figure is shown for a class of one"

try "a next step preselected" app.js \
  'optionGroup(e, s.decision, t(e.decide), pickDecision),||optionGroup(e, s.decision ?? "A", t(e.decide), pickDecision),' \
  "no next step is preselected"

try "the simulated-data badge dropped" app.js \
  'el("p", { class: "badge", text: t(m.badge) }),||null,' \
  "badged DATA SIMULASI"

try "evidence readiness typed, not counted" app.js \
  'for (const f of m.figures) counts[f.state] += 1;||counts.cukup = m.figures.length;' \
  "evidence readiness counts the figures"

try "the visitor's answer on the educator's screen" app.js \
  '...e.figures.map(absentFigure),||...e.figures.map(absentFigure), el("p", { text: t(checkItemsFor(peta().lessonKey)[0].options[0].text) }),' \
  "shows none of the visitor's answers"

try "a door drops the language" app.js \
  'REVEAL.doors.map((d) => el("a", { href: siteHref(d.href), text: t(d.label) })));||REVEAL.doors.map((d) => el("a", { href: d.href, text: t(d.label) })));' \
  "the doors lead to the site's routes"

echo
echo "browser negative tests: $pass caught, $fail not caught"
[ "$fail" -eq 0 ] || exit 1
