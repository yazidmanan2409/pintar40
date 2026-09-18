#!/usr/bin/env bash
# Parent role view — negative plants.
#
# Run: bash verify/negative.sh    (~7 minutes; the browser cases dominate)

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
try "empty EN side"            audit.mjs content.js 'L("Rani", "Rani")||L("Rani", "")'
try "a ranking"                audit.mjs content.js '"Tiga minggu terakhir, itu terlihat pada sebagian besar jawabannya.",||"Tiga minggu terakhir, Rani berada di atas rata-rata kelas.",' \
  "a ranking"
try "a percentile"             audit.mjs content.js '"Empat dari enam cukup untuk diperhatikan||"Rani ada di persentil 60. Empat dari enam cukup untuk diperhatikan' \
  "a ranking"
try "a permanent label"        audit.mjs content.js '"Pekerjaan Rani sejalan dengan materi yang sedang dipelajari.",||"Perkembangan Rani: sangat baik.",' \
  "permanent label"
try "describing the child"     audit.mjs content.js '"Saat membandingkan dua pecahan dengan penyebut berbeda, jawabannya belum tepat||"Rani lemah dalam pecahan. Saat membandingkan dua pecahan dengan penyebut berbeda, jawabannya belum tepat' \
  "description of the child"
try "PINTAR jargon"            audit.mjs content.js '"Dari dua belas kegiatan bulan ini||"Dari dua belas Uji Penguasaan bulan ini' \
  "vocabulary a parent"
try "an identifier"            audit.mjs content.js 'child: L("Rani", "Rani"),||child: L("Rani (NIS 1029384756)", "Rani (NIS 1029384756)"),' \
  "identifier"
try "an exclamation mark"      audit.mjs content.js '"Satu bagian perlu perhatian.||"Satu bagian perlu perhatian!' \
  "exclamation"
try "skim too long to skim"    audit.mjs content.js '"Tiga minggu terakhir, itu terlihat pada sebagian besar jawabannya.",||"Dalam tiga minggu terakhir, sebagian besar dari dua belas kegiatan yang Rani kerjakan di kelas maupun di rumah menunjukkan hasil yang sejalan dengan materi pelajaran yang sedang berjalan di sekolahnya saat ini.",' \
  "five-second skim"
try "skim hides the action"    audit.mjs content.js '"Satu bagian perlu perhatian. Ada satu hal kecil yang bisa Anda lakukan.",||"Satu bagian perlu perhatian.",' \
  "whether the parent must do anything"
try "belum-cukup removed"      audit.mjs content.js '"Belum cukup yang bisa kami sampaikan tentang Rani.",||"Rani baru memulai.",' \
  "belum cukup bukti"
try "ranking note goes vague"  audit.mjs content.js 'Yang dibandingkan adalah pekerjaannya dengan materi yang sedang dipelajari.",||Kami menilai Rani secara menyeluruh.",' \
  "what IS compared"

try "keeping-up language back"  audit.mjs content.js '"Pekerjaan Rani sejalan dengan materi yang sedang dipelajari.",||"Rani mengikuti materi yang sedang dipelajari.",' \
  "keeping-up language"
try "an update cadence"        audit.mjs content.js 'child: L("Rani", "Rani"),||child: L("Rani", "Rani"),
  updated: L("Diperbarui hari ini", "Updated today"),' \
  "update cadence"

echo "view.mjs — the rendered page:"
# A status tone on the child, the way it would actually arrive: one state
# rendered in a different colour from the others.
try "a status tone on the child" view.mjs 'app.js' 'el("h1", { text: t(s.headline) }),||el("h1", { style: stateId === "perlu-perhatian" ? "color:#8c3b3b" : null, text: t(s.headline) }),' \
  "colour"
try "signpost below the fold"  view.mjs style.css '.answer__bounding {||.answer__bounding { padding-bottom: 900px;' \
  "above the fold"
try "the limit as small print" view.mjs style.css '.section .limit { color: var(--ink-2); margin: 0 0 var(--s2); }||.section .limit { color: var(--edge); margin: 0 0 var(--s2); font-size: 0.75rem; }' \
  "not set smaller"
try "four questions reordered" view.mjs app.js '    section(t(SECTIONS.supported),
      el("p", { text: t(s.supported) })),||' \
  "what can be seen"
try "an identifier on the page" view.mjs app.js 'document.getElementById("who").textContent = t(UI.child);||document.getElementById("who").textContent = t(UI.child) + " · NIS 1029384756";' \
  "identifier"

try "ranking made prominent"   view.mjs app.js 'el("details", { class: "ranking" }, [||el("details", { class: "ranking", open: "" }, [' \
  "closed by default"
try "ranking explanation gone" view.mjs app.js '        el("p", { text: t(RANKING.body) }),
      ]),||      ]),' \
  "one click away"
try "a cadence in the chrome"  view.mjs app.js 'document.getElementById("who").textContent = t(UI.child);||document.getElementById("who").textContent = t(UI.child) + " · Diperbarui hari ini";' \
  "no update cadence"

echo
echo "negative tests: $pass caught, $fail not caught"
[ "$fail" -eq 0 ] || exit 1
