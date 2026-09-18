#!/usr/bin/env bash
# Mini-PINTAR — negative tests for the verifiers.
#
# A check that cannot go red is theatre. Each case below injects one
# specific defect into the bundle, runs the verifier that is supposed to
# catch it, and fails if that verifier stays green. The bundle is backed up
# first and restored after every case, including on an early exit.
#
# This found two real weaknesses the first time it ran: audit.mjs was
# checking that the string EVIDENCE_LIMIT appeared *somewhere* in the Hasil
# rather than that it was rendered, and paths.mjs could not see a content
# bundle sorted in place. Both are fixed; both are cases here now.
#
# Run: bash verify/negative.sh

set -uo pipefail
APP="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BAK="$(mktemp -d)"
cp -r "$APP"/. "$BAK"/
restore() { cp -r "$BAK"/. "$APP"/; }
trap 'restore; rm -rf "$BAK"' EXIT

pass=0; fail=0

try() { # name verifier file 'anchor||replacement'
  local name="$1" verifier="$2" file="$3" expr="$4"
  restore
  if ! ( cd "$APP" && python3 - "$file" "$expr" <<'PY'
import sys, pathlib
f, expr = sys.argv[1], sys.argv[2]
old, new = expr.split("||")
p = pathlib.Path(f); s = p.read_text(encoding="utf-8")
assert s.count(old) >= 1, f"injection anchor not found in {f}: {old[:60]}"
p.write_text(s.replace(old, new, 1), encoding="utf-8")
PY
  ); then
    printf '  SETUP-FAIL  %s\n' "$name"; fail=$((fail+1)); return
  fi
  if ( cd "$APP" && node "verify/$verifier" >/dev/null 2>&1 ); then
    printf '  NOT CAUGHT  %s  (%s stayed green)\n' "$name" "$verifier"; fail=$((fail+1))
  else
    printf '  caught      %s\n' "$name"; pass=$((pass+1))
  fi
}

echo "audit.mjs — content:"
try "empty EN side"              audit.mjs content.js 'L("Baca ini lebih dulu", "Read this first")||L("Baca ini lebih dulu", "")'
try "two minutes in the copy"    audit.mjs content.js 'Sekitar tiga menit.||Dua menit.'
try "mastery overclaim on tier"  audit.mjs content.js 'Jawaban Anda sudah tepat di bagian ini",
                 "Your answer here was already right"||Sudah Anda kuasai", "Already yours"'
try "child register"             audit.mjs content.js 'Jawaban Anda dipakai||Jawabanmu dipakai'
try "machine voice says salah"   audit.mjs content.js 'Ada bagian yang layak dibaca ulang.||Jawaban Anda salah.'
try "tidak cukup, not belum"     audit.mjs content.js 'Belum cukup bukti.", "Not yet enough evidence.||Tidak cukup bukti.", "Not enough evidence.'
try "obsolete Kuis Cepat"        audit.mjs content.js 'Uji Penguasaan", "Mastery Check"||Kuis Cepat", "Quick Quiz"'
try "MAP option loses rationale" audit.mjs content.js 'rationale: L(
          "Persentase adalah perbandingan||norationale: L(
          "Persentase adalah perbandingan'
try "CHECK gains a rationale"    audit.mjs content.js '{ label: "B", text: L("Berapa jumlah anggota klub.", "How many members the club has.") }||{ label: "B", rationale: L("x","y"), text: L("Berapa jumlah anggota klub.", "How many members the club has.") }'
try "item overlap MAP/CHECK"     audit.mjs content.js 'id: "U-D2-1"||id: "P1"'
try "Hasil drops the limit"      audit.mjs app.js '    evidenceLimitBlock(),||'
try "limit block gutted"         audit.mjs app.js 'const text = t(EVIDENCE_LIMIT);||const text = t(NO_DELTA);'

echo "paths.mjs — adaptation:"
try "outcome table changed"      paths.mjs adapt.js 'else if (correct === 1) outcome = "BELUM_CUKUP";||else if (correct === 1) outcome = "KONSISTEN";'
try "skip no longer BELUM_CUKUP" paths.mjs adapt.js 'if (skipped > 0) outcome = "BELUM_CUKUP";||if (skipped > 0) outcome = "PERLU_PERHATIAN";'
try "manufactured weakness"      paths.mjs adapt.js 'cards = ordered.map((d, i) => card(d, i === 0 ? "DISARANKAN" : "SUDAH_TEPAT"));||cards = ordered.map((d, i) => card(d, i === 0 ? "PERLU_SEGERA" : "SUDAH_TEPAT"));'
try "wrong severity lead"        paths.mjs adapt.js 'const ordered = [...needs].sort(bySeverityDesc);||const ordered = [...needs].sort((a,b)=>a.severity-b.severity);'
try "nondeterminism"             paths.mjs adapt.js 'card(ordered[0], "PERLU_SEGERA"),||card(ordered[0], Math.random() < 0.5 ? "PERLU_SEGERA" : "WAJIB"),'
try "bundle mutated in place"    paths.mjs adapt.js 'const ordered = [...DOMAINS].sort(bySeverityDesc);||const ordered = DOMAINS.sort(bySeverityDesc);'
try "argument mutation"          paths.mjs adapt.js 'return MAP_ITEMS.map((item, i) => {||choices.reverse(); return MAP_ITEMS.map((item, i) => {'

echo "isolation.mjs — source:"
try "localStorage in app"        isolation.mjs app.js 'let s = FRESH();||let s = FRESH(); localStorage.setItem("x", "1");'
try "sessionStorage in app"      isolation.mjs app.js 'let s = FRESH();||let s = FRESH(); sessionStorage.setItem("x", "1");'
try "a cookie"                   isolation.mjs app.js 'let s = FRESH();||let s = FRESH(); document.cookie = "a=1";'
try "a fetch"                    isolation.mjs app.js 'let s = FRESH();||let s = FRESH(); fetch("/x");'
try "sendBeacon"                 isolation.mjs app.js 'let s = FRESH();||let s = FRESH(); navigator.sendBeacon("/x");'
try "an analytics global"        isolation.mjs app.js 'let s = FRESH();||let s = FRESH(); window.dataLayer = [];'
try "a webfont"                  isolation.mjs index.html '<link rel="stylesheet" href="style.css">||<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">'
try "an off-bundle reference"    isolation.mjs index.html 'src="app.js"||src="../other/app.js"'
try "Date in a pure module"      isolation.mjs adapt.js 'export const SKIP = "SKIP";||export const SKIP = "SKIP"; const now = Date.now();'
try "DOM access in adapt"        isolation.mjs adapt.js 'export const SKIP = "SKIP";||export const SKIP = "SKIP"; const q = document.title;'
try "an answer in the URL"       isolation.mjs app.js 'history.pushState({ key }, "", key);||history.pushState({ key, choice: s.mapChoices }, "", key);'
try "threshold hides the reload" isolation.mjs app.js 'text: t(UI.thresholdReload)||text: ""'

echo
echo "negative tests: $pass caught, $fail not caught"
[ "$fail" -eq 0 ] || exit 1
