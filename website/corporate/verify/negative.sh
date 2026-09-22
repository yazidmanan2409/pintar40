#!/usr/bin/env bash
# PINTAR corporate website — negative plants.
#
# A green verifier must be capable of going red. Each rule below is broken
# on purpose, and the run fails if the verifier does not notice.
#
# Run: bash verify/negative.sh

set -uo pipefail
APP="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BAK="$(mktemp -d)"
cp -r "$APP"/. "$BAK"/
restore() { cp -r "$BAK"/. "$APP"/; }
trap 'restore; rm -rf "$BAK"' EXIT

pass=0; fail=0

try() { # name file 'anchor||replacement' [expected]
  local name="$1" file="$2" expr="$3" expect="${4:-}"
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
  out="$( cd "$APP" && node verify/audit.mjs 2>&1 )"
  if grep -q "OK —" <<<"$out"; then
    printf '  NOT CAUGHT  %s  (audit.mjs stayed green)\n' "$name"; fail=$((fail+1))
  elif [ -n "$expect" ] && ! grep -q "$expect" <<<"$out"; then
    printf '  WRONG FAIL  %s\n' "$name"; grep -E "^  " <<<"$out" | head -2; fail=$((fail+1))
  else
    printf '  caught      %s\n' "$name"; pass=$((pass+1))
  fi
}

echo "audit.mjs:"
try "AI hype creeps in"         content.js '"PINTAR mengubah bukti belajar menjadi pemahaman yang jelas||"PINTAR, didukung AI, mengubah bukti belajar menjadi pemahaman yang jelas' \
  "AI hype"
try "corporate jargon creeps in" tentang/content.js '"Bukan untuk menambah perangkat lagi ke meja pendidik.||"Solusi holistik untuk ekosistem terpadu pendidikan.' \
  "corporate jargon"
try "an exaggerated claim"      content.js '"PINTAR mengubah bukti belajar menjadi pemahaman yang jelas||"PINTAR adalah yang terbaik di indonesia untuk pendidikan. PINTAR mengubah bukti belajar menjadi pemahaman yang jelas' \
  "exaggerated claim"
try "a fabricated trust claim"  content.js '"PENDIDIKAN · TEKNOLOGI", "EDUCATION · TECHNOLOGY"||"Dipercaya oleh ribuan sekolah", "Trusted by thousands of schools"' \
  "fabricated trust claim"
try "PINTAR sold as deciding"   apa-yang-dilakukan/content.js '"PINTAR mengusulkan. Pendidik memutuskan.", "PINTAR proposes. The educator decides.")||"PINTAR memutuskan. Pendidik hanya menonton.", "PINTAR decides. The educator just watches.")' \
  "taking the decision"
try "empty EN side"             content.js 'ctaPrimary: L("Coba Mini-PINTAR", "Try Mini-PINTAR"),||ctaPrimary: L("Coba Mini-PINTAR", ""),'
try "a report row's bands do not sum" laporan/content.js '{ name: L("Perkalian dasar", "Basic multiplication"), strong: 18, mid: 4, low: 2, total: 24 },||{ name: L("Perkalian dasar", "Basic multiplication"), strong: 18, mid: 4, low: 9, total: 24 },' \
  "do not sum to its total"
try "a route not in PAGES"      untuk-pendidik/app.js 'href: withLang("/apa-yang-dilakukan/", lang), text: t(CLOSING.ctaSecondary)||href: withLang("/harga/", lang), text: t(CLOSING.ctaSecondary)' \
  "route not in PAGES"
try "Mini-PINTAR forgets to say the class report isn't yours" mini-pintar/content.js 'Ini BUKAN hasil Anda — lima jawaban satu orang tidak bisa mewakili satu kelas.||Ini laporan yang mewakili seluruh sekolah.' \
  "own result"
try "the sim badge drops the word simulated" mini-pintar/content.js 'simLabel: L("KELAS CONTOH · DATA SIMULASI", "SAMPLE CLASS · SIMULATED DATA"),||simLabel: L("KELAS CONTOH", "SAMPLE CLASS"),' \
  "does not say the data is simulated"
try "a duplicate quiz concept"  mini-pintar/content.js 'concept: L("Pola Angka", "Number Patterns"),||concept: L("Perkalian", "Multiplication"),' \
  "not all distinct"

# The core principle is checked corpus-wide (it must appear SOMEWHERE on
# the site, not on every page), so proving this check can fail means
# removing every occurrence at once — one plant touching two files.
restore
if ( cd "$APP" && python3 - <<'PY'
import pathlib
for f, old, new in [
    ("laporan/content.js", "“Belum cukup bukti” adalah hasil yang sah.", "Semua hasil PINTAR selalu pasti dan lengkap."),
    ("laporan/content.js", 'low: L("Belum cukup bukti", "Not enough evidence"),', 'low: L("Data minim", "Thin data"),'),
    ("laporan/content.js", "Belum cukup bukti pada Pecahan Sederhana. Sebagian besar peserta didik belum menyelesaikan bagian ini",
     "Hasil pada Pecahan Sederhana masih rendah untuk sebagian peserta didik"),
    ("mini-pintar/content.js", "Belum cukup bukti pada Pecahan Sederhana untuk sebagian besar peserta didik.",
     "Hasil pada Pecahan Sederhana masih rendah untuk sebagian peserta didik."),
]:
    p = pathlib.Path(f); s = p.read_text(encoding="utf-8")
    assert old in s, f"anchor not found in {f}: {old[:50]}"
    p.write_text(s.replace(old, new, 1), encoding="utf-8")
PY
); then
  out="$( cd "$APP" && node verify/audit.mjs 2>&1 )"
  if grep -q "OK —" <<<"$out"; then
    printf '  NOT CAUGHT  %s  (audit.mjs stayed green)\n' "the principle goes unsaid everywhere"; fail=$((fail+1))
  elif ! grep -q "never states PINTAR" <<<"$out"; then
    printf '  WRONG FAIL  %s\n' "the principle goes unsaid everywhere"; grep -E "^  " <<<"$out" | head -2; fail=$((fail+1))
  else
    printf '  caught      %s\n' "the principle goes unsaid everywhere"; pass=$((pass+1))
  fi
else
  printf '  SETUP-FAIL  %s\n' "the principle goes unsaid everywhere"; fail=$((fail+1))
fi
restore

echo
echo "negative tests: $pass caught, $fail not caught"
[ "$fail" -eq 0 ] || exit 1
