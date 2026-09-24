#!/usr/bin/env bash
# PINTAR corporate website — negative plants.
#
# A green verifier must be capable of going red. Each case below breaks one
# rule on purpose and fails the run if the verifier that owns the rule does
# not notice, or notices for a different reason. Every rule in audit.mjs and
# canonical.mjs has at least one plant here.
#
# Plants that CHANGE THE PRODUCT never touch the product: its sources are
# copied into a temporary directory, the copy is changed, and canonical.mjs is
# pointed at the copy with --product. Plants that change the website are made
# in the website and restored after every case, including on an early exit.
#
# Run: bash verify/negative.sh

set -uo pipefail
APP="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$APP/../.." && pwd)"
BAK="$(mktemp -d)"
PROD="$(mktemp -d)"
cp -r "$APP"/. "$BAK"/
restore() { cp -r "$BAK"/. "$APP"/; }
fresh_product() {
  rm -rf "$PROD"; mkdir -p "$PROD/src/lib" "$PROD/src/app" "$PROD/public" "$PROD/supabase"
  cp "$REPO/src/lib/hle.ts" "$REPO/src/lib/pengajar.ts" "$REPO/src/lib/pimpinan.ts" "$PROD/src/lib/"
  cp "$REPO/src/app/globals.css" "$PROD/src/app/"
  cp -r "$REPO/public/brand" "$REPO/public/fonts" "$PROD/public/"
  cp -r "$REPO/supabase/migrations" "$PROD/supabase/"
}
STRAY="$REPO/website/mini-pintar/app/index.html"
trap 'restore; rm -rf "$BAK" "$PROD"; rm -f "$STRAY"' EXIT

pass=0; fail=0

# Replace the first occurrence of each anchor. Several edits per plant are
# separated by @@; an anchor and its replacement by ||.
edit() { # root file 'anchor||replacement[@@…]'
  ( cd "$1" && python3 - "$2" "$3" <<'PY'
import sys, pathlib
f, expr = sys.argv[1], sys.argv[2]
p = pathlib.Path(f); s = p.read_text(encoding="utf-8")
for part in expr.split("@@"):
    old, new = part.split("||")
    assert s.count(old) >= 1, f"injection anchor not found in {f}: {old[:60]}"
    s = s.replace(old, new, 1)
p.write_text(s, encoding="utf-8")
PY
  )
}

judge() { # name verifier expected output
  local name="$1" verifier="$2" expect="$3" out="$4"
  if grep -q "OK —" <<<"$out"; then
    printf '  NOT CAUGHT  %s  (%s stayed green)\n' "$name" "$verifier"; fail=$((fail+1))
  elif ! grep -qF -- "$expect" <<<"$out"; then
    printf '  WRONG FAIL  %s  (red, but not for the planted reason)\n' "$name"
    grep -E "^  " <<<"$out" | head -2; fail=$((fail+1))
  else
    printf '  caught      %s\n' "$name"; pass=$((pass+1))
  fi
}

try() { # name verifier file 'anchor||replacement' expected
  local name="$1" verifier="$2" file="$3" expr="$4" expect="$5"
  restore
  if ! edit "$APP" "$file" "$expr"; then printf '  SETUP-FAIL  %s\n' "$name"; fail=$((fail+1)); return; fi
  judge "$name" "$verifier" "$expect" "$( cd "$APP" && node "verify/$verifier" 2>&1 )"
}

product() { # name file 'anchor||replacement' expected
  local name="$1" file="$2" expr="$3" expect="$4"
  restore; fresh_product
  if ! edit "$PROD" "$file" "$expr"; then printf '  SETUP-FAIL  %s\n' "$name"; fail=$((fail+1)); return; fi
  judge "$name" canonical.mjs "$expect" "$( cd "$APP" && node verify/canonical.mjs --product "$PROD" 2>&1 )"
}

CHANGED="canonical product changed — website reconciliation required"
MISREP="website misrepresents canonical PINTAR"

# The copy of the product must itself pass, or every product plant below
# would be "caught" for the wrong reason.
restore; fresh_product
if ( cd "$APP" && node verify/canonical.mjs --product "$PROD" | grep -q "OK —" ); then
  echo "  (the product copy used below passes unchanged)"
else
  echo "  SETUP-FAIL  the product copy does not pass unchanged"; exit 1
fi

echo "canonical.mjs — the product changes under the website:"
product "a product sentence changes"      src/lib/hle.ts '"Belum cukup data untuk menampilkan angka ini."||"Datanya belum cukup."' \
  "$CHANGED: copy row \"laporan.metrik.belum_cukup_data\""
product "a role is renamed"               src/lib/hle.ts '"role.DEAN": { default: "Dekan"||"role.DEAN": { default: "Pimpinan"' \
  "$CHANGED: copy row \"role.DEAN\""
product "a metric's minimum moves"        supabase/migrations/20260918100000_metric_catalogue.sql "'CLASS', 5, array['hero_stat','bar'], array['EDUCATOR','HEAD_OF_DEPARTMENT','DEAN','INSTITUTION_ADMIN']::public.app_role[], 'class_comprehension'||'CLASS', 8, array['hero_stat','bar'], array['EDUCATOR','HEAD_OF_DEPARTMENT','DEAN','INSTITUTION_ADMIN']::public.app_role[], 'class_comprehension'" \
  "$CHANGED: MC-1 metric class.comprehension"
product "a readiness threshold moves"     supabase/migrations/20260918100000_metric_catalogue.sql "'kesiapan.siap_sertifikasi',     4, 0.8000||'kesiapan.siap_sertifikasi',     4, 0.8500" \
  "$CHANGED: readiness tier kesiapan.siap_sertifikasi"
product "the management surface changes"  src/lib/pimpinan.ts '  "class.net_gain",
  "class.readiness_distribution",
] as const;||  "class.readiness_distribution",
] as const;' \
  "$CHANGED: the managementClass surface"
product "the primary colour changes"      src/app/globals.css '--pintar-primary: #245F55;||--pintar-primary: #2A6B5F;' \
  "$CHANGED: --pintar-primary is now #2A6B5F"
product "the supplied logo is replaced"   public/fonts/OFL-PlusJakartaSans.txt 'Copyright||Copyright (revised)' \
  "$CHANGED: public/fonts/OFL-PlusJakartaSans.txt has changed"

# New migrations are files, not edits: added to the copy, then checked.
for case in \
  "a migration re-publishes the catalogue|20261101000000_catalogue_two.sql|select public.publish_metric_catalogue('MC-2', 'x', '{\"class.net_gain\": 8}');|a migration that writes the metric catalogue has been added" \
  "a migration redefines who may do what|20261101000001_capabilities.sql|create or replace function public.role_capabilities(r public.app_role) returns text[] language sql as \$\$ select array[]::text[] \$\$;|a migration that defines role capabilities has been added"; do
  IFS='|' read -r name file body expect <<<"$case"
  restore; fresh_product
  printf '%s\n' "$body" > "$PROD/supabase/migrations/$file"
  judge "$name" canonical.mjs "$CHANGED: $expect" "$( cd "$APP" && node verify/canonical.mjs --product "$PROD" 2>&1 )"
done
restore; fresh_product
printf 'x' >> "$PROD/public/brand/pintar-selalu-logo.png"
judge "the product's logo file changes" canonical.mjs "$CHANGED: public/brand/pintar-selalu-logo.png has changed" \
  "$( cd "$APP" && node verify/canonical.mjs --product "$PROD" 2>&1 )"
EMPTY="$(mktemp -d)"
judge "the product cannot be found" canonical.mjs "the canonical product's sources were not found" \
  "$( cd "$APP" && node verify/canonical.mjs --product "$EMPTY" 2>&1 )"
rmdir "$EMPTY"

echo "canonical.mjs — the website drifts from the product:"
try "a metric label paraphrased"        canonical.mjs laporan/content.js 'label: L("Pemahaman", "Comprehension"),||label: L("Pemahaman kelas", "Class comprehension"),' \
  "$MISREP: laporan.REPORT_A.figures[0].label.id is not the product's \"metrik.pemahaman.label\""
try "a minimum that is not MC-1's"      canonical.mjs laporan/content.js 'value: 0.72, state: "cukup", have: 22, needed: 5,||value: 0.72, state: "cukup", have: 22, needed: 3,' \
  "minimum 3 is not MC-1's 5 for class.comprehension"
try "a state its sample does not allow" canonical.mjs laporan/content.js 'state: "belum_cukup", have: 4, needed: 5,||state: "belum_cukup", have: 6, needed: 5,' \
  "is drawn as \"belum_cukup\" but 6/5 makes it \"cukup\""
try "a figure its surface never shows"  canonical.mjs laporan/content.js '{ metric: "institution.competency_outcomes",||{ metric: "institution.cohort_comparison",' \
  "is not a figure the product's managementInstitution surface shows"
try "a report with no figure below its minimum" canonical.mjs laporan/content.js '{ metric: "class.net_gain", kind: "points", state: "belum_cukup", have: 4, needed: 5,||{ metric: "class.net_gain", kind: "points", value: 0.1, state: "cukup", have: 5, needed: 5,' \
  "laporan.REPORT_A shows no figure below its minimum"
try "an invented band for a tier"       canonical.mjs laporan/content.js 'name: L("Siap sertifikasi", "Ready for certification"),||name: L("Pemahaman kuat", "Strong understanding"),' \
  "not the product's \"kesiapan.siap_sertifikasi\""
try "a tier rule off MC-1's threshold"  canonical.mjs laporan/content.js 'rule: L("penguasaan 60–79%", "mastery of 60–79%")||rule: L("penguasaan 50–79%", "mastery of 50–79%")' \
  "rule does not state MC-1's \"60–79%\""
try "a tier count that does not add up" canonical.mjs laporan/content.js 'tiers: { siap_sertifikasi: 9,||tiers: { siap_sertifikasi: 12,' \
  "tier counts sum to 27, not the sample 24"
try "the principle paraphrased"         canonical.mjs laporan/content.js '"Bukti yang belum cukup bukan hasil yang buruk. Artinya||"Data yang sedikit bukan kegagalan. Artinya' \
  "laporan.PRINCIPLE.body.id is not the product's \"pimpinan.kesiapan.catatan\""
try "an action the product would not pick" canonical.mjs laporan/content.js 'action: L("Tidak perlu diulang — lanjutkan ke materi berikutnya.", "No need to reteach — move on to the next topic.") },||action: L("Ulangi topik ini bersama-sama sebelum lanjut.", "Go over this topic together before moving on.") },' \
  "not the product's \"tindakan.lanjut\""
try "a class of one shown as enough"    canonical.mjs mini-pintar/content.js '{ metric: "class.comprehension", state: "belum_cukup", have: 1, needed: 5,||{ metric: "class.comprehension", state: "cukup", have: 5, needed: 5,' \
  "with one learner, class.comprehension must read"
try "a product next step paraphrased"   canonical.mjs mini-pintar/content.js 'text: L("Uji Cepat untuk mengecek pemahaman hari ini", "Quick Assessment to check today'"'"'s understanding") },||text: L("Kuis kecil hari ini", "A small quiz today") },' \
  "not the product's \"mengajar.langkah.f5\""
try "management shown a figure it does not read" canonical.mjs mini-pintar/content.js '{ metric: "class.participants", kind: "count", value: 22,||{ metric: "class.misconceptions", kind: "count", value: 22,' \
  "is not a figure the product's managementClass surface shows"
try "a cycle step renamed"              canonical.mjs apa-yang-dilakukan/content.js 'L("Peta Bacaan Personal", "Personal Reading Map"),||L("Peta Bacaan", "Reading Map"),' \
  "not the product's \"cycle.step.map\""
try "Mini-PINTAR renames a cycle step"  canonical.mjs mini-pintar/content.js 'stepCheck: L("Uji Penguasaan", "Mastery Check"),||stepCheck: L("Tes Akhir", "Final Test"),' \
  "mini-pintar.UI.stepCheck"
try "an audience that is not a product role" canonical.mjs content.js 'L("Dekan", "Dean"),||L("Kepala Sekolah", "Principal"),' \
  "home.TRUST.items[2].id is not the product's \"role.DEAN\""
try "an educator publishing alone"      canonical.mjs untuk-pendidik/content.js ' Persetujuan dan penerbitan dilakukan Kepala Departemen dan sekolah.||' \
  "preparing learning no longer says, as the product does"
try "Uji Cepat renamed"                 canonical.mjs untuk-pendidik/content.js 'title: L("Jalankan Uji Cepat", "Run a Quick Assessment"),||title: L("Jalankan kuis", "Run a quiz"),' \
  "does not carry the product's \"studio.nav.kuis\""
try "the brand colour drifts"           canonical.mjs shared/style.css '--brand-primary:       #245F55;||--brand-primary:       #0A6E4B;' \
  "--brand-primary is #0A6E4B in shared/style.css"
try "Mini-PINTAR's green drifts"        canonical.mjs mini-pintar/style.css '--green: #245f55;||--green: #0a6e4b;' \
  "Mini-PINTAR's --green is #0a6e4b"
restore
printf 'x' >> "$APP/shared/brand/pintar-selalu-logo.png"
judge "the site's logo is not the product's" canonical.mjs "$MISREP: shared/brand/pintar-selalu-logo.png is not the product's" \
  "$( cd "$APP" && node verify/canonical.mjs 2>&1 )"
restore
printf 'x' >> "$APP/shared/fonts/plus-jakarta-sans-latin.woff2"
judge "the site's typeface is not the product's" canonical.mjs "$MISREP: shared/fonts/plus-jakarta-sans-latin.woff2 is not the product's" \
  "$( cd "$APP" && node verify/canonical.mjs 2>&1 )"

echo "audit.mjs — claims:"
try "AI hype creeps in"                 audit.mjs content.js '"PINTAR dirancang untuk mengubah bukti belajar||"PINTAR, didukung AI, dirancang untuk mengubah bukti belajar' "AI hype"
try "corporate jargon creeps in"        audit.mjs tentang/content.js '"Bukan untuk menambah perangkat lagi ke meja pendidik.||"Solusi holistik untuk ekosistem terpadu pendidikan.' "corporate jargon"
try "an exaggerated claim"              audit.mjs content.js '"PINTAR dirancang untuk mengubah bukti belajar||"PINTAR adalah yang terbaik di indonesia. PINTAR dirancang untuk mengubah bukti belajar' "exaggerated claim"
try "a fabricated trust claim"          audit.mjs content.js '"PENDIDIKAN · TEKNOLOGI", "EDUCATION · TECHNOLOGY"||"Dipercaya oleh ribuan sekolah", "Trusted by thousands of schools"' "fabricated trust claim"
try "PINTAR sold as deciding"           audit.mjs apa-yang-dilakukan/content.js '"PINTAR mengusulkan. Pendidik memutuskan.", "PINTAR proposes. The educator decides.")||"PINTAR memutuskan. Pendidik hanya menonton.", "PINTAR decides. The educator just watches.")' "taking the decision"
try "empty EN side"                     audit.mjs content.js 'ctaPrimary: L("Coba Mini-PINTAR", "Try Mini-PINTAR"),||ctaPrimary: L("Coba Mini-PINTAR", ""),' "empty EN side"
try "PINTAR 4.0 in the copy"            audit.mjs content.js 'eyebrow: L("PENDIDIKAN · TEKNOLOGI", "EDUCATION · TECHNOLOGY"),||eyebrow: L("PINTAR 4.0 · PENDIDIKAN", "PINTAR 4.0 · EDUCATION"),' "a version name the product does not use publicly"
try "PINTAR 4.0 in a shipped comment"   audit.mjs shared/style.css '/* ---------------------------------------------------------- report mock */||/* ---------------------------------------------------------- report mock (PINTAR 4.0) */' "\"PINTAR 4.0\" in a shipped file"
try "a foundation as an audience"       audit.mjs untuk-manajemen/content.js '"Pimpinan sekolah tidak butuh||"Yayasan dan pimpinan sekolah tidak butuh' "an audience PINTAR has no surface for (\"yayasan\")"
try "the team claim returns"            audit.mjs tentang/content.js '"Banyak pendidik menghabiskan||"PINTAR dibangun oleh orang-orang yang pernah mengajar. Banyak pendidik menghabiskan' "a claim about who builds PINTAR"
try "interaction as evidence"           audit.mjs cara-kerja/content.js 'body: L("Setiap jawaban pada penilaian resmi menjadi bukti.",||body: L("Setiap jawaban dan interaksi menjadi bukti.",' "interaction described as evidence"
try "a quantified time saving"          audit.mjs untuk-pendidik/content.js '"PINTAR dirancang untuk menyusun jawaban||"Hemat satu jam setiap hari. PINTAR dirancang untuk menyusun jawaban' "a quantified time saving"
try "an adoption claim"                 audit.mjs content.js '"Tidak ada akun, tidak ada data yang disimpan.||"Sudah digunakan di sekolah-sekolah. Tidak ada akun, tidak ada data yang disimpan.' "an adoption or availability claim"
try "an availability claim in English"  audit.mjs content.js '"No account, no data kept.||"Now available for every school. No account, no data kept.' "an adoption or availability claim (\"now available\")"
try "immediacy returns"                 audit.mjs untuk-pendidik/content.js '"Setelah cukup banyak peserta didik selesai, PINTAR||"Begitu jawaban masuk, PINTAR' "an immediacy the product does not have"
try "Uji Cepat loses its name"          audit.mjs content.js '"Siapkan pembelajaran, jalankan Uji Cepat,||"Siapkan pembelajaran, jalankan asesmen singkat,' "a non-canonical name for Uji Cepat"
try "the surveillance absolute returns" audit.mjs untuk-manajemen/content.js 'caption: L("Pola yang layak dibahas, bukan peringkat nama.",||caption: L("Pola yang layak dibahas, bukan daftar nama.",' "an absolute the product contradicts"
try "the mark used as the product name" audit.mjs tentang/content.js '"Bukan untuk menambah perangkat lagi ke meja pendidik.||"PINTAR SELALU bukan untuk menambah perangkat lagi ke meja pendidik.' "the product called by its mark"
try "five minutes"                      audit.mjs content.js 'headline: L("Sekitar tiga menit untuk memahami||headline: L("Lima menit untuk memahami' "a duration other than the ruled one"
try "a duration in a meta description"  audit.mjs mini-pintar/index.html 'content="Sekitar tiga menit.||content="Sekitar 3–5 menit.' "a duration other than the ruled one — mini-pintar/index.html"
try "capability as a live deployment"   audit.mjs content.js '"PINTAR dirancang untuk mengubah bukti belajar||"PINTAR mengubah bukti belajar' "a capability is stated as a working deployment, not as design — home.HERO.lede"
try "the footer stops separating demo from live" audit.mjs shared/content.js 'Mini-PINTAR adalah demonstrasi, bukan asesmen resmi.||Mini-PINTAR adalah pengalaman singkat.' "the footer no longer separates designed, demonstrated and live"
try "an invented legal entity"          audit.mjs shared/content.js 'Pemegang hak cipta menunggu konfirmasi.||PT PINTAR Indonesia.' "the copyright line names a legal entity"
try "simulated data unlabelled"         audit.mjs laporan/content.js 'meta: L("Satu sekolah · data simulasi", "One school · simulated data"),||meta: L("Satu sekolah", "One school"),' "simulated figures are not labelled as simulated — laporan.REPORT_B.meta"
try "Mini-PINTAR claims the class is yours" audit.mjs mini-pintar/content.js 'tidak ada yang berasal dari jawaban Anda.||semuanya berasal dari jawaban Anda.' "does not say none of it is the visitor's"
try "a report guesses a cause"          audit.mjs laporan/content.js 'meta: L("Kelas 5B · Matematika · data simulasi",||meta: L("Kelas 5B · Matematika · data simulasi, kemungkinan karena ujian baru",' "a report guesses a cause"
try "belum cukup bukti as a group of children" audit.mjs laporan/content.js 'name: L("Menganggap pecahan dengan penyebut lebih besar selalu lebih besar",||name: L("Belum cukup bukti: tujuh murid",' "\"belum cukup bukti\" used as something other than the principle"
try "learner bands return"              audit.mjs laporan/content.js '{ metric: "class.topic_mastery", kind: "topics",||{ metric: "class.topic_mastery", strong: 18, mid: 4, low: 2, kind: "topics",' "uses learner bands the product does not have"
try "the language remembered on the device" audit.mjs shared/lang.js 'export function setLang(lang) {||export function setLang(lang) {
  localStorage.setItem("pintar-site-lang", lang);' "a storage API (\"localStorage\") — shared/lang.js"
try "a page keeps something in the session" audit.mjs laporan/app.js 'const lang = mountChrome("laporan");||const lang = mountChrome("laporan"); sessionStorage.setItem("seen", "1");' "a storage API (\"sessionStorage\") — laporan/app.js"
try "a cookie"                          audit.mjs kontak/app.js 'import { el }||document.cookie = "a=1";
import { el }' "a storage API (\"document.cookie\")"
try "the language read from elsewhere"  audit.mjs shared/lang.js 'return new URLSearchParams(location.search).get("lang") === "en" ? "en" : "id";||return navigator.language.startsWith("en") ? "en" : "id";' "the language no longer comes from ?lang="
try "the logo not the supplied file"    audit.mjs shared/chrome.js 'export const LOGO_SRC = "shared/brand/pintar-selalu-logo.png";||export const LOGO_SRC = "shared/brand/mark.svg";' "the site header does not use the supplied logo"
try "the logo from the domain root"     audit.mjs shared/chrome.js 'src: siteAsset(LOGO_SRC)||src: "/" + LOGO_SRC' "a src not made relative by withLang, siteAsset or siteHref"
try "a nav link from the domain root"   audit.mjs shared/chrome.js 'href: withLang(p.href, lang),||href: p.href,' "a href not made relative by withLang, siteAsset or siteHref"
try "withLang writes from the root"     audit.mjs shared/lang.js 'const relative = upToRoot() + path.replace(/^\/+/, "");||const relative = path;' "withLang does not write a relative link"
try "siteAsset writes from the root"    audit.mjs shared/lang.js 'return upToRoot() + path.replace(/^\/+/, "");||return "/" + path.replace(/^\/+/, "");' "siteAsset does not write a relative path"
try "a stylesheet from the domain root" audit.mjs laporan/index.html 'href="../shared/style.css"||href="/shared/style.css"' "a link or asset written from the domain root — laporan/index.html"
try "Mini-PINTAR exits to the domain root" audit.mjs mini-pintar/app.js 'window.location.href = siteHref("/");||window.location.href = "/?lang=" + lang;' "a navigation that is not relative"
try "the logo's width is set"           audit.mjs shared/style.css '.brand__logo { height: 36px; width: auto;||.brand__logo { height: 36px; width: 120px;' "the logo is not rendered at the product's 36px height"
try "the footer logo stops leading Home" audit.mjs shared/chrome.js 'el("div", { class: "site-footer__brand" }, [
            el("a", { class: "brand", href: withLang("/", lang) }, [logo()]),||el("div", { class: "site-footer__brand" }, [
            el("span", { class: "brand" }, [logo()]),' "the header logo does not lead Home"
try "the header logo stops leading Home" audit.mjs shared/chrome.js 'el("a", { class: "brand", href: withLang("/", lang) }, [logo()]),||el("span", { class: "brand" }, [logo()]),' "the header logo does not lead Home"
try "an evidence colour is the brand"   audit.mjs shared/style.css '--evidence-bar:   #5F6A73;||--evidence-bar:   #245F55;' "an evidence colour is the brand colour"
try "a report bar in the brand colour"  audit.mjs shared/style.css '.rbar > i { display: block; height: 100%; background: var(--evidence-bar); }||.rbar > i { display: block; height: 100%; background: var(--brand-primary); }' "a report style paints evidence in a brand or status colour"
try "Mini-PINTAR's bars in the brand"   audit.mjs mini-pintar/style.css '.rbar i { display: block; height: 100%; background: var(--ink-3); }||.rbar i { display: block; height: 100%; background: var(--green); }' "Mini-PINTAR's readiness bars are not the neutral ink"
try "a retired token returns"           audit.mjs shared/style.css '--brand-primary:       #245F55;||--brand-primary:       #245F55;
  --accent: #0A6E4B;' "a retired token is still defined"
try "a weight the product does not use" audit.mjs shared/style.css '.cycle li { font-weight: 600; }||.cycle li { font-weight: 700; }' "a weight the product does not use — shared/style.css: 700"
try "Mini-PINTAR drops the typeface"    audit.mjs mini-pintar/style.css '--sans: "Plus Jakarta Sans",||--sans: "Inter",' "the product's typeface is not declared — mini-pintar/style.css"
try "the site loses a font face"        audit.mjs shared/style.css 'font-family: "Plus Jakarta Sans";||font-family: "Inter";' "the product's typeface is not declared — shared/style.css: 1 faces"
try "a route not in PAGES"              audit.mjs untuk-pendidik/app.js 'href: withLang("/apa-yang-dilakukan/", lang), text: t(CLOSING.ctaSecondary)||href: withLang("/harga/", lang), text: t(CLOSING.ctaSecondary)' "route not in PAGES"
try "a Mini-PINTAR door to nowhere"     audit.mjs mini-pintar/content.js 'href: "/laporan/" },||href: "/bukti" },' "a Mini-PINTAR door points to a route not in PAGES"
try "Kenali PINTAR leads to the company" audit.mjs app.js 'href: withLang("/apa-yang-dilakukan/", lang), text: t(HERO.ctaSecondary)||href: withLang("/tentang/", lang), text: t(HERO.ctaSecondary)' "Kenali PINTAR does not lead to What PINTAR Does"
try "the retired quiz returns"          audit.mjs mini-pintar/content.js 'export const NO_DELTA||export const QUIZ = { questions: [] };
export const NO_DELTA' "the retired corporate quiz is back"

# The ruled duration is a presence rule, so proving it can fail means taking
# it out of every page that states it.
restore
if edit "$APP" content.js 'headline: L("Sekitar tiga menit untuk memahami apa yang PINTAR lakukan.",
              "About three minutes to understand what PINTAR does."),||headline: L("Pahami apa yang PINTAR lakukan.", "Understand what PINTAR does."),' \
 && edit "$APP" apa-yang-dilakukan/content.js '"Coba alur ini sendiri, dalam sekitar tiga menit.", "Try this flow yourself, in about three minutes."||"Coba alur ini sendiri.", "Try this flow yourself."' \
 && edit "$APP" mini-pintar/content.js 'thresholdLede: L("Sekitar tiga menit.", "About three minutes."),||thresholdLede: L("Singkat.", "Short."),' \
 && edit "$APP" mini-pintar/index.html 'content="Sekitar tiga menit.||content="Singkat.'; then
  judge "the ruled duration disappears" audit.mjs "the ruled duration is not stated" "$( cd "$APP" && node verify/audit.mjs 2>&1 )"
else
  printf '  SETUP-FAIL  %s\n' "the ruled duration disappears"; fail=$((fail+1))
fi

# A second Mini-PINTAR at the old location is a file, not an edit.
restore
printf '<!doctype html><title>Mini-PINTAR</title>\n' > "$STRAY"
judge "a second Mini-PINTAR at the old location" audit.mjs "a second Mini-PINTAR remains at website/mini-pintar/app" \
  "$( cd "$APP" && node verify/audit.mjs 2>&1 )"
rm -f "$STRAY"

# The principle is checked corpus-wide (it must appear SOMEWHERE on the
# site), so proving the check can fail means removing every occurrence.
restore
if edit "$APP" laporan/content.js 'line: L("“Belum cukup bukti” adalah hasil yang sah.",||line: L("“Data minim” adalah hasil yang sah.",' \
 && edit "$APP" mini-pintar/content.js 'doctrine: L("Belum cukup bukti", "Not yet enough evidence"),||doctrine: L("Data minim", "Not yet enough evidence"),@@text: L("Belum cukup bukti untuk menyimpulkan.||text: L("Data minim untuk menyimpulkan.@@headline: L("Belum cukup bukti.", "Not yet enough evidence."),||headline: L("Data minim.", "Not yet enough evidence."),'; then
  judge "the principle goes unsaid everywhere" audit.mjs "never states PINTAR's principle in Indonesian" "$( cd "$APP" && node verify/audit.mjs 2>&1 )"
else
  printf '  SETUP-FAIL  %s\n' "the principle goes unsaid everywhere"; fail=$((fail+1))
fi
restore

echo
echo "negative tests: $pass caught, $fail not caught"
[ "$fail" -eq 0 ] || exit 1
