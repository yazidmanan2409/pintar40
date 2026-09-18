#!/usr/bin/env bash
# Educator role view — negative plants.
#
# A green verifier that cannot go red is theatre. Each case injects one
# specific defect and fails if the verifier it targets stays green.
#
# Run: bash verify/negative.sh    (~6 minutes; the browser cases dominate)

set -uo pipefail
APP="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BAK="$(mktemp -d)"
cp -r "$APP"/. "$BAK"/
restore() { cp -r "$BAK"/. "$APP"/; }
trap 'restore; rm -rf "$BAK"' EXIT

pass=0; fail=0

try() { # name verifier file 'anchor||replacement' [expected-substring]
  local name="$1" verifier="$2" file="$3" expr="$4" expect="${5:-}"
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
  out="$( cd "$APP" && node "verify/$verifier" 2>&1 )"
  if grep -q "OK —" <<<"$out"; then
    printf '  NOT CAUGHT  %s  (%s stayed green)\n' "$name" "$verifier"; fail=$((fail+1))
  elif [ -n "$expect" ] && ! grep -q "$expect" <<<"$out"; then
    printf '  WRONG FAIL  %s  (red, but not for the planted reason)\n' "$name"
    grep -E "^  " <<<"$out" | head -2; fail=$((fail+1))
  else
    printf '  caught      %s\n' "$name"; pass=$((pass+1))
  fi
}

echo "audit.mjs — the words:"
try "empty EN side"              audit.mjs content.js 'L("Tertahan", "Held")||L("Tertahan", "")'
try "uncertainty hedged away"    audit.mjs content.js '"Mengapa. Catatan ini bahan pertimbangan manusia, bukan kesimpulan tentang siswa.",||"Belum jelas.",@@"Why. This note is material for a human to weigh, not a conclusion about the student."),||"Unclear."),' \
  "uncertainty line is too short"
try "no way to decline"          audit.mjs content.js 'L("Tidak perlu ditindaklanjuti", "Nothing to follow up"),||L("Kerjakan sekarang", "Do it now"),' \
  "decide it needed nothing"
try "an exclamation mark"        audit.mjs content.js '"Yang perlu perhatian Anda hari ini",||"Yang perlu perhatian Anda hari ini!",' \
  "exclamation mark"
try "urgency word"               audit.mjs content.js '"Satu sesi praktik terbimbing||"Segera jadwalkan satu sesi praktik terbimbing' \
  "urgency"
try "a ranking"                  audit.mjs content.js '"Lima dari dua puluh delapan peta bacaan||"Lima siswa dengan peringkat terburuk di 7B, dari dua puluh delapan peta bacaan' \
  "ranking"
try "a traffic light on people"  audit.mjs content.js '"Apakah kelimanya mengalami kesulitan yang sama.||"Kelimanya berisiko tertinggal. Apakah kelimanya mengalami kesulitan yang sama.' \
  "traffic light"
try "an overclaim"               audit.mjs content.js '"Bahwa lima peta menempatkan bacaan itu lebih dulu.||"Ini terbukti menjadi kesulitan bersama.' \
  "overclaim"
try "a borrowed string drifts"   audit.mjs content.js 'L("Sudah dibicarakan dengan siswa", "Discussed with the student"),||L("Sudah dibahas dengan siswa", "Discussed with the student"),' \
  "verbatim"
try "product term abandoned"     audit.mjs content.js 'jumlah minimum butir penting yang harus tepat belum terpenuhi||jumlah minimum soal wajib yang harus tepat belum terpenuhi' \
  "butir penting"
try "orientation too long"       audit.mjs content.js 'suppression: L(
    "Yang tidak perlu dikerjakan tidak muncul di halaman ini.",||suppression: L(
    "Yang tidak perlu dikerjakan tidak muncul di halaman ini, dan yang muncul sudah disaring terhadap seluruh kelas dalam lingkup mengajar Anda, seluruh paket yang sedang berjalan, seluruh sertifikat yang menunggu, seluruh catatan integritas yang belum ditinjau, serta seluruh sinyal mutu soal yang sudah dihitung sampai hari ini, sehingga apa pun yang tersisa di halaman ini benar-benar sudah melewati setiap saringan yang tersedia dan tidak ada satu pun bagian yang dilewati begitu saja tanpa diperiksa lebih dulu.",' \
  "first pass is too long"

echo "view.mjs — the rendered page:"
try "chain out of order"         view.mjs app.js 'part(t(CHAIN.supports), t(c.supports), true),
      part(t(CHAIN.unknown), t(c.unknown), true),||part(t(CHAIN.unknown), t(c.unknown), true),
      part(t(CHAIN.supports), t(c.supports), true),' \
  "chain is in order"
try "uncertainty as small print" view.mjs style.css '.chain dd { margin: 0; color: var(--ink-2); font-size: var(--t-small); line-height: 1.55; }||.chain dd { margin: 0; color: var(--ink-2); font-size: var(--t-small); line-height: 1.55; }
.chain > div:nth-child(2) dd { font-size: 0.8rem; color: var(--edge); }' \
  "uncertainty is not set"
try "a tone lands on a person"   view.mjs style.css '.card--blocked { border-left-color: var(--blocked); }||.card--blocked { border-left-color: var(--blocked); }
.card--blocked .card__happened { color: var(--blocked); }' \
  "colour on every card"
try "contrast broken"            view.mjs style.css '--ink-2: #4e5a64;||--ink-2: #b9b2a4;' \
  "contrast"
try "the banner is dismissible"  view.mjs index.html '<span class="sample__body" id="sample-body">||<button type="button">Tutup</button><span class="sample__body" id="sample-body">' \
  "cannot be dismissed"

echo
echo "negative tests: $pass caught, $fail not caught"
[ "$fail" -eq 0 ] || exit 1
