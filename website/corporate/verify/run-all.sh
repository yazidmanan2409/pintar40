#!/usr/bin/env bash
# PINTAR corporate website — the complete local verification, in one run.
#
# Runs every check on the corporate site and on Mini-PINTAR, in order, and
# prints each summary line. Stops at nothing: every suite runs, and the exit
# status is non-zero if any of them failed. Local only; no CI is involved.
#
# Run: bash verify/run-all.sh          (~45 minutes, mostly the browser plants)
#      bash verify/run-all.sh --quick  (skips the two browser-plant harnesses)

set -uo pipefail
SITE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
QUICK=0; [ "${1:-}" = "--quick" ] && QUICK=1
status=0

run() { # label dir command...
  local label="$1" dir="$2"; shift 2
  local out rc
  out="$( cd "$dir" && "$@" 2>&1 )"; rc=$?
  printf '%-44s %s\n' "$label" "$(grep -E "OK —|FAILED|negative tests:|canonical product changed|not found" <<<"$out" | tail -1)"
  if [ $rc -ne 0 ]; then status=1; grep -E "^  " <<<"$out" | grep -v "^  \.\." | head -8; fi
}

echo "corporate site ($(git -C "$SITE" rev-parse --short HEAD 2>/dev/null || echo 'no git'))"
run "canonical.mjs (this repository)"     "$SITE" node verify/canonical.mjs
run "canonical.mjs --at 2ac7ab6"          "$SITE" node verify/canonical.mjs --at 2ac7ab6
run "audit.mjs"                           "$SITE" node verify/audit.mjs
run "view.mjs"                            "$SITE" node verify/view.mjs
run "negative.sh"                         "$SITE" bash verify/negative.sh
[ $QUICK -eq 0 ] && run "negative-browser.sh"      "$SITE" bash verify/negative-browser.sh
echo "Mini-PINTAR"
run "mini-pintar audit.mjs"               "$SITE/mini-pintar" node verify/audit.mjs
run "mini-pintar paths.mjs"               "$SITE/mini-pintar" node verify/paths.mjs
run "mini-pintar isolation.mjs"           "$SITE/mini-pintar" node verify/isolation.mjs
run "mini-pintar journey.mjs"             "$SITE/mini-pintar" node verify/journey.mjs
run "mini-pintar negative.sh"             "$SITE/mini-pintar" bash verify/negative.sh
[ $QUICK -eq 0 ] && run "mini-pintar negative-browser.sh" "$SITE/mini-pintar" bash verify/negative-browser.sh

echo
[ $status -eq 0 ] && echo "ALL GREEN" || echo "SOMETHING FAILED — see above"
exit $status
