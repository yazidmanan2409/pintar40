// Parent role view — content audit.
//
// Run: node verify/audit.mjs

import { SAMPLE, UI, SECTIONS, RANKING, NOTE, STATES } from "../content.js";

const fails = [];
const fail = (what, detail = "") => fails.push(`${what}${detail ? " — " + detail : ""}`);
let checks = 0;
const ok = () => { checks += 1; };

const isPair = (v) => v && typeof v === "object"
  && typeof v.id === "string" && typeof v.en === "string";

function pairs(value, path, out = []) {
  if (isPair(value)) { out.push([path, value]); return out; }
  if (Array.isArray(value)) { value.forEach((v, i) => pairs(v, `${path}[${i}]`, out)); return out; }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === "function") continue;
      pairs(v, `${path}.${k}`, out);
    }
  }
  return out;
}

const ALL = pairs({ SAMPLE, UI, SECTIONS, RANKING, NOTE, STATES }, "parent");
for (const [path, p] of ALL) {
  if (!p.id.trim()) fail("empty ID side", path);
  else if (!p.en.trim()) fail("empty EN side", path);
  else ok();
}

const FIELDS = ["headline", "bounding", "signpost", "supported",
  "attention", "attentionLimit", "action", "actionNote"];
for (const s of STATES) {
  for (const f of FIELDS) {
    if (!isPair(s[f]) || !s[f].id.trim()) fail(`state without ${f}`, s.id);
    else ok();
  }
}

// ------------------------------------------------------ the five-second skim
//
// "The parent must understand the essential message from the heading + first
// sentence alone." Measured in Indonesian first, as instructed; English is
// reported and held to a looser bar because Indonesian is the language the
// design is being judged in.

const WPM = 200;
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const secs = (n) => (n / WPM) * 60;
const report = {};

for (const s of STATES) {
  for (const side of ["id", "en"]) {
    const skim = words(s.headline[side]) + words(s.bounding[side]);
    const top = skim + words(s.signpost[side]);
    const answer = FIELDS.reduce((a, f) => a + words(s[f][side]), 0)
      + Object.values(SECTIONS).reduce((a, p) => a + words(p[side]), 0)
      + words(NOTE.suggestion[side]);
    const full = answer + words(RANKING.heading[side]) + words(RANKING.body[side])
      + words(NOTE.scope[side]) + words(UI.talk[side]);
    report[`${s.id}.${side}`] = {
      skim: +secs(skim).toFixed(1), top: +secs(top).toFixed(1),
      answer: Math.round(secs(answer)), full: Math.round(secs(full)),
    };

    const skimBar = side === "id" ? 18 : 22;
    if (skim > skimBar)
      fail(`the five-second skim is ${secs(skim).toFixed(1)}s (${skim} words)`,
        `${s.id}.${side} — over the ${skimBar}-word bar`);
    else ok();

    // "Well under 60 seconds" for the answer: the top block and the three
    // sections. The standing notes at the foot are reported, not budgeted.
    if (secs(answer) > (side === "id" ? 40 : 46))
      fail(`the answer reads in ${Math.round(secs(answer))}s`,
        `${s.id}.${side} — not well under sixty`);
    else ok();
  }

  // A heading that needs a second line to land is not a heading.
  if (words(s.headline.id) > 12) fail("the headline is too long to skim", s.id);
  else ok();
}

// -------------------------------------- the design test, enforced structurally
//
// Show the screen for half a minute, take it away, ask three questions. All
// three answers have to be inside the top block, because that is all a
// parent is guaranteed to have read.

const ATTENTION_SIGNAL = [
  "perlu perhatian", "belum cukup", "tidak ada yang perlu perhatian",
  "needs attention", "not yet enough", "nothing needs attention",
];
const ACTION_SIGNAL = [
  "anda lakukan", "bisa anda", "tidak ada yang perlu anda lakukan", "membicarakannya",
  "you can do", "nothing for you to do", "talk it over", "you can",
];
for (const s of STATES) {
  for (const side of ["id", "en"]) {
    const top = `${s.headline[side]} ${s.bounding[side]} ${s.signpost[side]}`.toLowerCase();
    if (!ATTENTION_SIGNAL.some((x) => top.includes(x)))
      fail("the skim does not say whether anything needs attention", `${s.id}.${side}`);
    else ok();
    if (!ACTION_SIGNAL.some((x) => top.includes(x)))
      fail("the skim does not say whether the parent must do anything", `${s.id}.${side}`);
    else ok();
  }
}

// ---------------------------------------------------------- what may not appear

// Allowed because they REFUSE the thing they name. The ranking note has to
// be able to say the word "peringkat" in order to say PINTAR does not give
// one.
const NEGATIONS = [
  "tidak memberi peringkat", "does not rank", "tidak membandingkan rani dengan anak lain",
  "does not compare rani with other children", "bukan karena semuanya baik",
  "not because everything is fine", "belum cukup", "not yet enough", "not enough",
  "tidak ada yang perlu perhatian", "nothing needs attention",
  // The heading over the refusal has to be able to name the question the
  // parent is actually asking in order to answer it.
  "kalau anda ingin tahu peringkat", "if you are wondering about rank",
];

// A ranking, in any of its disguises — including the friendly ones.
const RANKING_WORDS = [
  "peringkat", "ranking", "rangking", "juara", "persentil", "percentile",
  "di atas rata-rata", "di bawah rata-rata", "above average", "below average",
  "urutan ke", "terbaik di kelas", "top of the class", "papan peringkat",
  "10% teratas", "top 10", "lebih baik dari", "better than most",
];

// Permanent labels, and the softer words that are those labels in a
// cardigan.
const LABELS = [
  "sangat baik", "baik sekali", "cukup baik", "kurang baik", "predikat", "kategori",
  "excellent", "satisfactory", "needs improvement", "poor", "grade a", "level b",
];

// Describing the child where the evidence describes a pattern.
const ABOUT_THE_CHILD = [
  "lemah", "malas", "bodoh", "tidak mampu", "kurang cerdas", "sulit belajar",
  "is weak", "struggles with", "lazy", "not capable", "poor at", "bad at",
];

// Keeping-up language. "Mengikuti" and "keeping up" name a race even when
// the sentence does not say who else is in it; the relationship this view
// describes is between the child's work and the MATERIAL, which needs no
// second party. Ruled 2026-09-18.
const COMPARATIVE = [
  "mengikuti materi", "mengikuti pelajaran", "mengikuti kelas", "tidak tertinggal",
  "keeping up", "keeps up", "keep up", "on track", "behind the class", "ahead of",
  "sesuai target", "memenuhi standar",
];

// Update cadence. A page that says when it was last updated has designed a
// rhythm, and an anxious parent will check a rhythm. The cadence is
// unresolved, so the page states none. Ruled 2026-09-18.
const CADENCE = [
  "diperbarui hari ini", "updated today", "setiap hari", "every day",
  "harian", "daily", "diperbarui setiap", "updated every", "terakhir diperbarui",
];

// PINTAR's own vocabulary. A parent should not have to learn the product's
// words to find out how their child is.
const JARGON = [
  "pemetaan awal", "uji penguasaan", "peta bacaan", "penguasaan", "butir penting",
  "evidence class", "kelas bukti", "misconception", "miskonsepsi", "domain",
  "mastery", "initial mapping", "mastery check", "reading map",
];

// No identifiers of any kind.
const IDENTIFIERS = [/\bnis\b/i, /\bnisn\b/i, /student\s*id/i, /\bid siswa\b/i,
  /[0-9a-f]{8}-[0-9a-f]{4}/i, /\b\d{6,}\b/];

for (const [path, p] of ALL) {
  for (const side of ["id", "en"]) {
    let text = p[side].toLowerCase();
    for (const n of NEGATIONS) text = text.split(n).join(" ");

    for (const [label, list] of [
      ["a ranking", RANKING_WORDS], ["a permanent label", LABELS],
      ["a description of the child rather than the evidence", ABOUT_THE_CHILD],
      ["PINTAR vocabulary a parent should not need", JARGON],
      ["keeping-up language, which implies a race", COMPARATIVE],
      ["an update cadence this design does not set", CADENCE],
    ]) {
      for (const w of list) {
        if (text.includes(w)) fail(`${label} ("${w}")`, `${path}.${side}`);
        else ok();
      }
    }
    for (const re of IDENTIFIERS) {
      if (re.test(p[side])) fail("an identifier appears on a parent's page", `${path}.${side}`);
      else ok();
    }
    if (p[side].includes("!")) fail("an exclamation mark manufactures urgency", `${path}.${side}`);
    else ok();
  }
}

// ------------------------------------------------- the things that must appear

for (const side of ["id", "en"]) {
  const banner = `${SAMPLE.label[side]} ${SAMPLE.body[side]}`.toLowerCase();
  if (!["belum dibangun", "not built"].some((x) => banner.includes(x)))
    fail("the banner does not say the view is not built", side);
  else ok();
  if (!["bukan data sekolah", "from no school"].some((x) => banner.includes(x)))
    fail("the banner does not say the data is not a school's", side);
  else ok();

  // The ranking question is answered before it is asked, and the answer
  // redirects to the comparison PINTAR will make instead.
  const r = RANKING.body[side].toLowerCase();
  if (!["tidak memberi peringkat", "does not rank"].some((x) => r.includes(x)))
    fail("the ranking note does not say PINTAR gives no rank", side);
  else ok();
  if (!["materi yang sedang dipelajari", "material the class is currently learning"]
      .some((x) => r.includes(x)))
    fail("the ranking note does not name what IS compared instead", side);
  else ok();

  // What the page cannot see, said on the page.
  if (!["tidak terlihat dari sini", "not visible from here"].some((x) =>
      NOTE.scope[side].toLowerCase().includes(x)))
    fail("the page does not say what it cannot see", side);
  else ok();

  // The action is an offer, not homework.
  if (!["saran, bukan tugas", "suggestion, not homework"].some((x) =>
      NOTE.suggestion[side].toLowerCase().includes(x)))
    fail("the action is not framed as a suggestion", side);
  else ok();
}

// "Belum cukup bukti" must stay reachable as a parent-facing answer.
if (!STATES.some((s) => s.headline.id.toLowerCase().includes("belum cukup")))
  fail("no state answers with 'belum cukup bukti'", "it is a legitimate answer and must exist");
else ok();

// --------------------------------------------------------------- report

if (fails.length) {
  console.error(`\naudit FAILED — ${fails.length} problem(s), ${checks} checks passed\n`);
  for (const f of fails) console.error("  " + f);
  process.exit(1);
}
console.log(`audit OK — ${checks} checks, ${ALL.length} string pairs, ${STATES.length} states`);
for (const s of STATES) {
  const i = report[`${s.id}.id`], e = report[`${s.id}.en`];
  console.log(`  ${s.id.padEnd(16)} ID skim ${i.skim}s · answer ${i.answer}s · with notes ${i.full}s` +
    `   |   EN ${e.skim}s · ${e.answer}s · ${e.full}s`);
}
