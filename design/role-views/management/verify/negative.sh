#!/usr/bin/env bash
# Management role view — negative plants, one per adversarial axis.
#
# Run: bash verify/negative.sh    (~10 minutes; the browser cases dominate)

set -uo pipefail
APP="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BAK="$(mktemp -d)"
cp -r "$APP"/. "$BAK"/
restore() { cp -r "$BAK"/. "$APP"/; }
trap 'restore; rm -rf "$BAK"' EXIT

pass=0; fail=0

try() { # name verifier file 'anchor||replacement' [expected]
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
    printf '  WRONG FAIL  %s\n' "$name"; grep -E "^  " <<<"$out" | head -2; fail=$((fail+1))
  else
    printf '  caught      %s\n' "$name"; pass=$((pass+1))
  fi
}

echo "audit.mjs — the words:"
try "empty EN side"             audit.mjs content.js 'L("Pimpinan", "Management")||L("Pimpinan", "")'
try "ranking leakage"           audit.mjs content.js '"Dua dari lima paket sudah punya bukti yang memenuhi syarat.||"Kelas 8A ada di peringkat empat dari dua belas. Dua dari lima paket sudah punya bukti yang memenuhi syarat.' \
  "ranking leakage"
try "scoring the educator"      audit.mjs content.js '"Pada satu pertanyaan — kesempatan bertanya — tanggapannya terbagi.||"Skor pendidik untuk kelas ini 3,8 dari 5. Pada satu pertanyaan — kesempatan bertanya — tanggapannya terbagi.' \
  "scoring or classifying"
try "an unsupported cause"      audit.mjs content.js '"Mengapa terbagi, dan apakah ini berlaku di luar kelas ini.||"Karena itu pendidik perlu ditinjau. Mengapa terbagi, dan apakah ini berlaku di luar kelas ini.' \
  "causal conclusion"
try "urgency"                   audit.mjs content.js '"Menentukan siapa yang menanganinya||"Segera menentukan siapa yang menanganinya' \
  "urgency"
try "a threshold invented"      audit.mjs content.js '"Berapa jumlah minimumnya belum ditetapkan.||"Minimum 10 tanggapan diperlukan.' \
  "threshold number"
try "anonymity term dropped"    audit.mjs content.js 'L("PINTAR mencatat bahwa seorang siswa sudah menjawab. Catatan itu terpisah dari apa yang dijawab.",
        "PINTAR records that a student has answered. That record is separate from what was answered."),||L("PINTAR mencatat setiap tanggapan.", "PINTAR records every response."),' \
  "recorded separately from content"
try "individual sheets offered" audit.mjs content.js 'L("Anda tidak akan melihat lembar jawaban satu per satu.",
        "You will not see individual answer sheets."),||L("Anda bisa membuka setiap tanggapan.", "You can open each response."),' \
  "no individual answer sheets"
try "an HR judgment asked"      audit.mjs content.js 'L("Penjelasan di kelas ini membantu saya memahami materi.",
        "Explanations in this class help me understand the material."),||L("Seberapa kompeten guru ini?", "How competent is this teacher?"),' \
  "HR judgment"
try "free text allowed"         audit.mjs content.js '"Tidak ada isian bebas. Komentar terbuka menimbulkan persoalan anonimitas yang belum terjawab.",||"Siswa juga bisa menulis komentar bebas.",' \
  "rule out free text"
try "a composite score"         audit.mjs content.js '{ q: 2, text: L("13 sering atau hampir selalu · 5 kadang · 6 jarang atau hampir tidak pernah",||{ q: 2, text: L("rata-rata 3,4",' \
  "single figure"
try "a percentage"              audit.mjs content.js '{ q: 4, text: L("21 sering atau hampir selalu · 2 kadang · 1 jarang",||{ q: 4, text: L("88% positif · 12% lainnya",' \
  "percentage"
try "banner claims it exists"   audit.mjs content.js 'Umpan Balik Pembelajaran belum ada di PINTAR dan belum menjadi keputusan arsitektur.||Umpan Balik Pembelajaran tersedia sekarang.' \
  "does not exist"
try "no-action removed"         audit.mjs content.js 'L("Tidak ada tindakan sekarang", "No action now"),
    ],
    opens: "umpan-hasil",||],
    opens: "umpan-hasil",' \
  "nothing is needed"

echo "view.mjs — the rendered page:"
try "a preferred decision"      view.mjs style.css '.decide__row button:hover { background: var(--green-soft); }||.decide__row button:hover { background: var(--green-soft); }
.decide__row button:first-child { background: var(--green); color: #fff; font-weight: 700; }' \
  "looks the same"
try "a preselected decision"    view.mjs app.js 'el("button", { type: "button", text: t(a) })||el("button", { type: "button", "aria-pressed": a.id.includes("Tidak ada") ? "true" : "false", text: t(a) })' \
  "preselected"
try "a count tile"              view.mjs app.js 'el("p", { class: "lede", text: t(HOME.bounding) }),||el("p", { class: "lede", text: t(HOME.bounding) }), el("p", { text: "24" }),' \
  "bare number"
try "a chart on the home"       view.mjs app.js 'el("p", { class: "lede", text: t(HOME.bounding) }),||el("p", { class: "lede", text: t(HOME.bounding) }), el("progress", { value: "24", max: "28" }),' \
  "no chart"
try "a route to one answer"     view.mjs app.js 'el("h2", { text: t(UMPAN.result.rowsLabel) }),||el("h2", { text: t(UMPAN.result.rowsLabel) }), el("button", { type: "button", class: "opens", text: "Buka jawaban per siswa" }),' \
  "individual answer sheet"
try "contract after publish"    view.mjs app.js 'el("ul", { class: "terms" }, UMPAN.publish.terms.map((x) => el("li", { text: t(x) }))),
  el("div", { class: "buttons" }, [||el("div", { class: "buttons" }, [' \
  "before the publish control"
try "a tone on the prose"       view.mjs style.css '.card--blocked .card__kind { color: var(--blocked); }||.card--blocked .card__kind { color: var(--blocked); }
.card--blocked .card__happened { color: var(--blocked); }' \
  "same colour on every card"

echo
echo "negative tests: $pass caught, $fail not caught"
[ "$fail" -eq 0 ] || exit 1
