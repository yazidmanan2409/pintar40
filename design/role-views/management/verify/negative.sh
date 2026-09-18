#!/usr/bin/env bash
# Management role view — negative plants, one per rule the design claims.
#
# A green verifier must be capable of going red. Every rule below is broken
# on purpose, and the run fails if the verifier does not notice.
#
# Run: bash verify/negative.sh    (~12 minutes; the browser cases dominate)

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
try "ranking leakage"           audit.mjs content.js '"Dua dari lima paket sudah punya bukti yang memenuhi syarat.||"Rumpun ini ada di peringkat empat dari dua belas. Dua dari lima paket sudah punya bukti yang memenuhi syarat.' \
  "ranking leakage"
try "scoring the educator"      audit.mjs content.js '"Pada satu pertanyaan — proses asesmen dan administrasi — tanggapannya terbagi.||"Skor pendidik untuk rumpun ini 3,8 dari 5. Pada satu pertanyaan — proses asesmen dan administrasi — tanggapannya terbagi.' \
  "scoring or classifying an educator"
try "scoring management"        audit.mjs content.js '"Umpan Balik Pendidik untuk Rumpun Matematika dan Sains sudah ditutup.||"Indeks kepemimpinan rumpun ini turun. Umpan Balik Pendidik untuk Rumpun Matematika dan Sains sudah ditutup.' \
  "scoring or classifying management"
try "an unsupported cause"      audit.mjs content.js '"Mengapa terbagi, apa yang menjelaskannya, dan apakah ini berlaku di luar rumpun ini.||"Karena itu pendidik perlu ditinjau. Mengapa terbagi, apa yang menjelaskannya, dan apakah ini berlaku di luar rumpun ini.' \
  "an unsupported causal conclusion"
try "urgency"                   audit.mjs content.js '"Menentukan siapa yang menanganinya||"Segera menentukan siapa yang menanganinya' \
  "urgency"
try "a threshold invented"      audit.mjs content.js '"Berapa jumlah minimumnya belum ditetapkan.||"Minimum 10 tanggapan diperlukan.' \
  "threshold number"
try "a threshold elsewhere"     audit.mjs content.js '"Jika tanggapannya terlalu sedikit, hasilnya tidak ditampilkan.",||"Hasil ditampilkan jika ada minimal 8 tanggapan.",' \
  "threshold number was invented"
try "a live result"             audit.mjs content.js 'L("Hasil baru muncul setelah masa menjawab ditutup.",
        "Results appear only after the answering period closes."),||L("Hasil bisa dipantau langsung selama masa menjawab.",
        "Results can be watched live while the period is open."),' \
  "a live result"
try "answering order kept"      audit.mjs content.js 'L("Waktu menjawab tidak dicatat sehalus itu, dan urutan menjawab tidak disimpan.",
        "The time of answering is not recorded finely, and the order in which people answered is not kept."),||L("Waktu setiap tanggapan dicatat.", "The time of each response is recorded."),' \
  "answering times and order"
try "an administrator exception" audit.mjs content.js 'bukan untuk atasan mana pun, bukan untuk administrator.||bukan untuk atasan mana pun, kecuali administrator.' \
  "administrator exception"
try "anonymity term dropped"    audit.mjs content.js 'L("PINTAR mencatat bahwa seorang pendidik sudah menjawab. Catatan itu terpisah dari apa yang dijawab.",
        "PINTAR records that an educator has answered. That record is separate from what was answered."),||L("PINTAR mencatat setiap tanggapan.", "PINTAR records every response."),' \
  "recorded separately from content"
try "individual sheets softened" audit.mjs content.js 'Lembar jawaban satu per satu tidak tersedia untuk siapa pun||Anda tidak akan melihat lembar jawaban satu per satu, tetapi' \
  "nobody receives an individual sheet"
try "respondents cut out of the result" audit.mjs content.js 'Pendidik yang menjawab melihat ringkasan yang sama, dan tetap tidak tahu siapa yang menjawab.||Ringkasan ini hanya untuk pimpinan.' \
  "educators who answered see the same summary"

echo "audit.mjs — the relationship (R2/R3/R4/R5/R12):"
try "students back as respondents" audit.mjs content.js 'L("Dua puluh satu dari dua puluh enam pendidik menjawab.",
                "Twenty-one of twenty-six educators answered."),||L("Dua puluh satu dari dua puluh enam siswa menjawab.",
                "Twenty-one of twenty-six students answered."),' \
  "students as respondents again"
try "the result stops naming educators" audit.mjs content.js 'headline: L("Dua puluh satu dari dua puluh enam pendidik menjawab.",
                "Twenty-one of twenty-six educators answered."),||headline: L("Dua puluh satu dari dua puluh enam tanggapan masuk.",
                "Twenty-one of twenty-six responses are in."),' \
  "does not name educators as the respondents"
try "rating the manager asked"  audit.mjs content.js 'L("Ketentuan dan prosedur institusi jelas bagi saya.",
        "Institutional expectations and procedures are clear to me."),||L("Seberapa baik pimpinan di rumpun ini?", "How good is management in this department?"),' \
  "a rating of management"
try "an HR judgment asked"      audit.mjs content.js 'L("Ketentuan dan prosedur institusi jelas bagi saya.",
        "Institutional expectations and procedures are clear to me."),||L("Seberapa kompeten guru ini?", "How competent is this teacher?"),' \
  "an HR judgment"
try "a question about someone else" audit.mjs content.js 'L("Dukungan institusi membantu saya menjalankan tanggung jawab saya.",
        "Institutional support helps me carry out my responsibilities."),||L("Pendidik di rumpun ini merasa didukung.",
        "Educators in this department feel supported."),' \
  "not in the first person"
try "rating management allowed" audit.mjs content.js '"Pertanyaan yang meminta pendidik menilai pimpinannya tidak ada di kumpulan ini, dan tidak bisa ditambahkan.",||"Pertanyaan tambahan bisa diusulkan ke pengelola kumpulan.",' \
  "rule out asking educators to rate management"
try "free text allowed"         audit.mjs content.js '"Tidak ada isian bebas. Komentar terbuka menimbulkan persoalan anonimitas yang belum terjawab.",||"Pendidik juga bisa menulis komentar bebas.",' \
  "rule out free text"
try "feedback feeds evidence"   audit.mjs content.js 'Ini laporan pengalaman kerja pendidik, bukan penilaian tentang pimpinan.||Tanggapan ini menambah bukti belajar di rumpun ini.' \
  "feeding evidence-derived work"
try "feedback becomes performance evidence" audit.mjs content.js 'Ini laporan pengalaman kerja pendidik; ia tidak menetapkan bahwa prosesnya keliru atau bahwa seseorang lalai.||Tanggapan ini menjadi bukti kinerja untuk rumpun ini.' \
  "feeding evidence-derived work"
try "the record class is dropped" audit.mjs content.js 'Tanggapan ini catatan tersendiri, bukan bukti belajar||Tanggapan ini melengkapi gambaran belajar' \
  "record-class boundary is not stated"
try "a student to management feed" audit.mjs content.js 'Tanggapan siswa tidak mengalir ke halaman ini.||Tanggapan siswa juga sampai ke halaman ini.' \
  "direction of feedback is not stated"
try "escalation designed instead of left open" audit.mjs content.js 'Jika sesuatu yang dilaporkan siswa perlu sampai ke tingkat institusi, itu melewati proses tersendiri yang belum ditetapkan — bukan jalur otomatis di dalam PINTAR.||Persoalan yang berulang diteruskan otomatis ke pimpinan institusi.' \
  "escalation path is not left unresolved"
try "the result becomes a diagnosis" audit.mjs content.js '"Pada satu pertanyaan — proses asesmen dan administrasi — tanggapannya terbagi.||"Karena beban administrasi bertambah, pada satu pertanyaan tanggapannya terbagi.' \
  "explains the responses instead of reporting them"
try "why moves out of the unknown" audit.mjs content.js '"Mengapa terbagi, dan apa yang menjelaskannya. Ini laporan pengalaman kerja pendidik||"Ini laporan pengalaman kerja pendidik' \
  "does not leave why under what is not yet known"

echo "audit.mjs — the frame:"
try "a composite score"         audit.mjs content.js '{ q: 2, text: L("9 sering atau hampir selalu · 4 kadang · 8 jarang atau hampir tidak pernah",||{ q: 2, text: L("rata-rata 3,4",' \
  "single figure"
try "a percentage"              audit.mjs content.js '{ q: 4, text: L("13 sering atau hampir selalu · 6 kadang · 2 jarang",||{ q: 4, text: L("88% positif · 12% lainnya",' \
  "percentage"
try "banner greenlights build"  audit.mjs content.js 'sudah diterima sebagai gagasan, tetapi belum boleh dibangun: perlu ADR sebelum ada skema atau kode.||sudah diterima dan siap dibangun.' \
  "not authorized to build"
try "management becomes educator" audit.mjs content.js 'headline: L("Dua keputusan menunggu Anda.", "Two decisions are waiting for you."),||headline: L("Yang perlu perhatian Anda hari ini.", "What needs your attention today."),' \
  "Educator"
try "no reason to reach management" audit.mjs content.js 'Yang muncul di sini memerlukan wewenang, koordinasi, atau penafsiran tingkat institusi. Selebihnya tidak muncul.||Yang tidak perlu Anda lihat tidak muncul.' \
  "why an item reaches management"
try "doctrine sentence drifts"  audit.mjs content.js 'decides: L("PINTAR mengusulkan, manusia memutuskan.",||decides: L("PINTAR memutuskan bersama Anda.",' \
  "doctrine sentence"
try "worth-knowing grows a task" audit.mjs content.js '    actions: [],||    actions: [L("Tindak lanjuti", "Follow up"), L("Tidak ada tindakan sekarang", "No action now")],' \
  "worth-knowing item carries decision controls"
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
try "a count tile"              view.mjs app.js 'el("p", { class: "lede", text: t(HOME.bounding) }),||el("p", { class: "lede", text: t(HOME.bounding) }), el("p", { text: "21" }),' \
  "bare number"
try "a chart on the home"       view.mjs app.js 'el("p", { class: "lede", text: t(HOME.bounding) }),||el("p", { class: "lede", text: t(HOME.bounding) }), el("progress", { value: "21", max: "26" }),' \
  "no chart"
try "a route to one answer"     view.mjs app.js 'el("h2", { text: t(UMPAN.result.rowsLabel) }),||el("h2", { text: t(UMPAN.result.rowsLabel) }), el("button", { type: "button", class: "opens", text: "Buka jawaban per pendidik" }),' \
  "individual answer sheet"
try "students on the result screen" view.mjs app.js 'el("p", { class: "lede", text: t(UMPAN.result.bounding) }),||el("p", { class: "lede", text: t(UMPAN.result.bounding) }), el("p", { text: "Tanggapan siswa untuk rumpun ini juga ditampilkan di sini." }),' \
  "students back in as respondents"
try "the direction goes unsaid" view.mjs app.js 'el("p", { class: "boundary", id: "relationship", text: t(UMPAN.start.relationship) }),||' \
  "states the direction of feedback"
try "contract after publish"    view.mjs app.js 'el("ul", { class: "terms" }, UMPAN.publish.terms.map((x) => el("li", { text: t(x) }))),
  el("div", { class: "buttons" }, [||el("div", { class: "buttons" }, [' \
  "before the publish control"
try "a tone on the prose"       view.mjs style.css '.card--blocked .card__kind { color: var(--blocked); }||.card--blocked .card__kind { color: var(--blocked); }
.card--blocked .card__happened { color: var(--blocked); }' \
  "same colour on every card"

echo
echo "negative tests: $pass caught, $fail not caught"
[ "$fail" -eq 0 ] || exit 1
