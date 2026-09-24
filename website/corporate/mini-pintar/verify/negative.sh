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
p = pathlib.Path(f); s = p.read_text(encoding="utf-8")
# Several edits per plant, separated by @@ — some rules only trip when two
# places change together.
for part in expr.split("@@"):
    old, new = part.split("||")
    assert s.count(old) >= 1, f"injection anchor not found in {f}: {old[:60]}"
    s = s.replace(old, new, 1)
p.write_text(s, encoding="utf-8")
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
try "an id drawn from the product"  audit.mjs content.js 'id: "U-D2-1",||id: "class.comprehension",'
try "a stem drawn from the product" audit.mjs content.js '"Sebuah program baru dicoba di dua kelas selama satu semester, dan hasilnya membaik. Mana yang paling menambah kekuatan buktinya?"||"PINTAR hanya menyimpulkan bila bukti resminya cukup. Belum cukup bukan berarti buruk — artinya belum."'
try "a lesson step quotes the keyed answer" audit.mjs content.js 'L("Terakhir, pilih kalimat yang sanggup dipikul buktinya: sebut apa yang sudah terlihat, apa yang belum boleh dikatakan, dan apa yang masih dikumpulkan.",||L("Terakhir, tulis: “Kami belum bisa menyimpulkan, dan kami akan terus mengamati.”",'
try "a lesson loses its fourth step" audit.mjs content.js '        L("Jika sebabnya tetap belum jelas, jangan buang temuannya: tuliskan hubungannya, nyatakan batasnya, lalu rancang pemeriksaan yang bisa membuktikan dugaan itu keliru.",
          "If the cause is still unclear, do not throw the finding away: write the link down, state its limit, then design a check that could prove the hunch wrong."),
||'
try "the school view judges the visitor" audit.mjs content.js 'Tidak ada tindakan sekarang", "No action for now"||Jawaban Anda salah", "Your answer was wrong"'
try "the school view says tidak cukup" audit.mjs content.js 'belum_cukup: L("Belum cukup data untuk menampilkan angka ini.", "Not enough data to show this figure yet."),||belum_cukup: L("Tidak cukup data untuk menampilkan angka ini.", "Not enough data to show this figure yet."),'
try "MAP option loses rationale" audit.mjs content.js 'rationale: L(
          "Persentase adalah perbandingan||norationale: L(
          "Persentase adalah perbandingan'
try "item overlap MAP/CHECK"     audit.mjs content.js 'id: "U-D2-1"||id: "P1"'
try "Hasil drops the limit"      audit.mjs app.js '    evidenceLimitBlock(),||'
try "limit block gutted"         audit.mjs app.js 'const text = t(EVIDENCE_LIMIT);||const text = t(NO_DELTA);'

echo "audit.mjs — R1, the reasoning:"
try "CHECK loses a rationale"    audit.mjs content.js 'rationale: L(
            "Kelompok pembanding adalah||norationale: L(
            "Kelompok pembanding adalah'
try "rationale restates option"  audit.mjs content.js '"Populer atau tidak menggambarkan bagaimana orang memandang klub itu, bukan apakah nilainya berubah karena klub itu.",||"Apakah klub itu populer.",'
try "rationale names the key"    audit.mjs content.js '"Kelompok pembanding adalah satu-satunya tambahan||"Jawaban yang benar adalah A. Kelompok pembanding adalah satu-satunya tambahan'
try "rationale judges a person"  audit.mjs content.js '"Menambah kelas memperbesar angkanya||"Anda salah. Menambah kelas memperbesar angkanya'
try "Hasil becomes a marksheet" audit.mjs app.js 'el("p", { class: "nodelta", text: t(NO_DELTA) }),||el("p", { class: "nodelta", text: t(NO_DELTA) }), // rationale'
try "reveal not gated on commit" audit.mjs app.js 'committed ? reasoningBlock(item, chosen) : assistBlock,||reasoningBlock(item, chosen),'
try "options stay editable"      audit.mjs app.js 'committed ? committedOptions(item, chosen) :||false ? committedOptions(item, chosen) :'

echo "audit.mjs — R2, the taxonomy:"
try "correct option coded"       audit.mjs content.js '{ label: "A", correct: true,
          text: L("Membandingkan dengan kelas serupa||{ label: "A", correct: true, misconception: "M-D2-HIAS",
          text: L("Membandingkan dengan kelas serupa'
try "undeclared code used"       audit.mjs content.js 'misconception: "M-D3-PILIH"||misconception: "M-D3-TIDAKPERNAHADA"'
try "declared code unreachable"  audit.mjs content.js '"M-D3-PILIH": "seeks only what supports the hunch",||"M-D3-PILIH": "seeks only what supports the hunch",
  "M-D9-HANTU": "a code nothing reaches",'
try "symmetry forced (R2)"       audit.mjs content.js '{ label: "D",
          text: L("Apakah klub itu populer.||{ label: "D", misconception: "M-D3-UKURAN",
          text: L("Apakah klub itu populer.@@{ label: "C",
          text: L("Bagaimana cara menaikkannya.||{ label: "C", misconception: "M-D1-DASAR",
          text: L("Bagaimana cara menaikkannya.'
try "code leaks into content"    audit.mjs content.js 'seeReasoning: L("Lihat penjelasannya", "See the reasoning"),||seeReasoning: L("Lihat penjelasannya M-D2-HIAS", "See the reasoning M-D2-HIAS"),'
try "renderer reads the code"    audit.mjs app.js 'const committed = s.checkCommitted[i];||const committed = s.checkCommitted[i]; const leak = item.options[0].misconception;'

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
try "namespace URI as a href"    isolation.mjs index.html '<link rel="stylesheet" href="style.css">||<link rel="stylesheet" href="http://www.w3.org/2000/svg">'
try "a second shared image"      isolation.mjs index.html 'src="../shared/brand/pintar-selalu-logo.png"||src="../shared/brand/other.png"'
try "a font from elsewhere"       isolation.mjs style.css 'url("../shared/fonts/plus-jakarta-sans-latin.woff2")||url("../../somewhere/font.woff2")'
try "a stylesheet @import"        isolation.mjs style.css ':root {||@import "../shared/style.css";
:root {'
try "a site link carries a choice" isolation.mjs app.js 'const siteHref = (path) => `..${path}?lang=${lang}`;||const siteHref = (path) => `..${path}?lang=${lang}&d=${s.decision}`;'
try "a site link from the domain root" isolation.mjs app.js 'const siteHref = (path) => `..${path}?lang=${lang}`;||const siteHref = (path) => `${path}?lang=${lang}`;'
try "Home linked from the domain root" isolation.mjs index.html 'id="brand" href="../"||id="brand" href="/"'
try "navigation bypasses siteHref" isolation.mjs app.js 'window.location.href = siteHref("/");||window.location.href = "/?d=" + s.decision;'

echo
echo "negative tests: $pass caught, $fail not caught"
[ "$fail" -eq 0 ] || exit 1
