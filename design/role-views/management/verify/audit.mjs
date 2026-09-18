// Management role view — content audit.
//
// The brief lists ten ways this design could go wrong. Each one that can be
// checked in the words is checked here; the rest are in verify/view.mjs.
//
// Run: node verify/audit.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SAMPLE, UI, CHAIN, HOME, ITEMS, UMPAN } from "../content.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..", "..");

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

const ALL = pairs({ SAMPLE, UI, CHAIN, HOME, ITEMS, UMPAN }, "mgmt");
for (const [path, p] of ALL) {
  if (!p.id.trim()) fail("empty ID side", path);
  else if (!p.en.trim()) fail("empty EN side", path);
  else ok();
}

// ------------------------------------------------------- the chain is whole

for (const it of ITEMS) {
  for (const f of ["kind", "subject", "since", "happened", "supports", "unknown", "step"]) {
    if (!isPair(it[f]) || !it[f].id.trim()) fail(`item without ${f}`, it.id);
    else ok();
  }
  // An item that waits on nobody carries no decision row. An item that does
  // must offer more than one option, and one of them must be no action.
  if (it.actions.length) {
    if (it.actions.length < 2) fail("a decision with one option is an instruction", it.id);
    else ok();
    const NO_ACTION = ["tidak ada tindakan sekarang", "no action now"];
    for (const side of ["id", "en"]) {
      if (!it.actions.some((a) => NO_ACTION.includes(a[side].toLowerCase().trim())))
        fail("no way to decide that nothing is needed", `${it.id}.${side}`);
      else ok();
    }
  } else ok();
}
for (const f of ["supports", "unknown", "step"]) {
  if (!isPair(UMPAN.result[f])) fail(`the feedback result has no ${f}`, "UMPAN.result");
  else ok();
}

// -------------------------------------------------- what may never appear
//
// The ten adversarial axes, in the words.

const NEGATIONS = [
  "ini urutan, bukan peringkat", "it is an order, not a ranking",
  "bukan penilaian tentang pendidiknya", "not a judgement about the educator",
  "bukan penilaian kinerja", "not a performance assessment",
  "bukan seberapa baik pendidiknya", "not how good the educator is",
  "menilai pendidiknya tidak ada", "asking students to rate their educator are not",
  "tidak menetapkan bahwa pendidiknya kurang efektif",
  "do not establish that the educator is ineffective",
  "bukan kesimpulan tentang siswa", "not a conclusion about the student",
  "tidak akan melihat lembar jawaban", "will not see individual answer sheets",
  "lembar jawaban satu per satu tidak tersedia", "individual answer sheets are available to nobody",
  "tidak akan melihat siapa yang menjawab", "will not see who answered",
  "belum ada di pintar", "does not exist in pintar",
];

const RANKING = [
  "peringkat", "ranking", "rangking", "persentil", "percentile", "leaderboard",
  "papan peringkat", "di atas rata-rata", "di bawah rata-rata", "above average",
  "below average", "terbaik", "terburuk", "top 10", "urutan ke", "dibandingkan dengan kelas lain",
  "compared with other classes", "better than", "lebih baik dari",
];

const TEACHER_SCORING = [
  "nilai guru", "nilai pendidik", "skor guru", "skor pendidik", "skor gabungan",
  "teacher score", "teacher rating", "rating guru", "penilaian kinerja",
  "performance score", "performance grade", "predikat", "kategori pendidik",
  "guru berkinerja", "underperforming", "klasifikasi pendidik", "composite score",
];

const CAUSAL = [
  "karena itu pendidik", "therefore the educator", "membuktikan bahwa", "proves that",
  "terbukti bahwa", "menyebabkan siswa", "caused students", "jelas bahwa pendidik",
  "clearly the educator", "disebabkan oleh pendidik",
];

const URGENCY = [
  "segera", "mendesak", "urgent", "immediately", "terlambat", "overdue",
  "kritis", "critical", "act now", "sekarang juga", "darurat",
];

// Claiming the concept ships.
const SHIPPED = [
  "tersedia sekarang", "sudah aktif", "available now", "now live", "sudah tersedia di pintar",
];

for (const [path, p] of ALL) {
  for (const side of ["id", "en"]) {
    let text = p[side].toLowerCase();
    for (const n of NEGATIONS) text = text.split(n).join(" ");

    if (p[side].includes("!")) fail("an exclamation mark manufactures urgency", `${path}.${side}`);
    else ok();

    for (const [label, list] of [
      ["ranking leakage", RANKING],
      ["scoring or classifying an educator", TEACHER_SCORING],
      ["an unsupported causal conclusion", CAUSAL],
      ["urgency", URGENCY],
      ["a claim that this ships", SHIPPED],
    ]) {
      for (const w of list) {
        if (text.includes(w)) fail(`${label} ("${w}")`, `${path}.${side}`);
        else ok();
      }
    }
  }
}

// ------------------------------------------------------- the anonymity contract
//
// Not reassuring copy: the terms have to be present, and the two halves of
// the contract have to be named separately.

for (const side of ["id", "en"]) {
  const terms = UMPAN.publish.terms.map((x) => x[side].toLowerCase()).join(" | ");

  const REQUIRED = [
    // identity and content are separate things
    [["tidak terhubung dengan nama", "not linked to their names"], "answers are not linked to names"],
    [["terpisah dari apa yang dijawab", "separate from what was answered"],
     "participation is recorded separately from content"],
    // no individual sheets, to anyone
    [["lembar jawaban satu per satu", "individual answer sheets"], "no individual answer sheets"],
    // no participation exposure to the educator
    [["siapa yang menjawab", "who answered"], "the educator does not see who answered"],
    // results only after close — otherwise the first responder is identifiable
    [["setelah masa menjawab ditutup", "after the answering period closes"],
     "results only after the period closes"],
    // the threshold
    [["terlalu sedikit", "too few"], "the minimum-disclosure threshold"],
  ];
  for (const [needles, what] of REQUIRED) {
    if (!needles.some((n) => terms.includes(n)))
      fail(`the anonymity contract does not state: ${what}`, side);
    else ok();
  }
}

// The threshold sentence the brief fixes, and no number for it. Inventing a
// number would be answering a privacy question with a mockup.
for (const side of ["id", "en"]) {
  const head = UMPAN.thin.headline[side].toLowerCase();
  const wanted = side === "id"
    ? "belum cukup tanggapan untuk menampilkan hasil dengan aman"
    : "not yet enough responses";
  if (!head.includes(wanted)) fail("the thin-response state does not carry its sentence", side);
  else ok();

  const thin = Object.values(UMPAN.thin).map((x) => x[side]).join(" ");
  if (/\b\d+\b/.test(thin) && !/7C|Class/.test(thin.match(/\b\d+\b/)[0]))
    fail("a minimum-response threshold number was invented", `${side}: ${thin.match(/\b\d+\b/)[0]}`);
  else ok();
  if (!["belum ditetapkan", "has not been set"].some((x) => UMPAN.thin.unresolved[side].toLowerCase().includes(x)))
    fail("the thin state does not say the threshold is unresolved", side);
  else ok();
}

// ------------------------------------------------- the question pool is governed
//
// Students are asked about what they can observe. Nobody is asked to grade
// a teacher, and nothing is authored here.

const HR_JUDGMENT = [
  "guru yang baik", "good teacher", "seberapa kompeten", "how competent",
  "beri nilai untuk guru", "rate your teacher", "rate the teacher", "nilai gurunya",
];
for (const q of UMPAN.questions.pool) {
  for (const side of ["id", "en"]) {
    for (const w of HR_JUDGMENT) {
      if (q[side].toLowerCase().includes(w)) fail(`the pool asks for an HR judgment ("${w}")`, q[side]);
      else ok();
    }
    // Every question is about the student's own experience, in the first
    // person. A question that is not about the asker is a question about
    // somebody else.
    if (!/\bsaya\b/i.test(q.id) && !/\bi\b|\bme\b|\bmy\b/i.test(q.en))
      fail("a pool question is not about the student's own experience", q.id);
    else ok();
  }
}
if (UMPAN.questions.pool.length < 3) fail("the pool is too small to be a pool", "");
else ok();
for (const side of ["id", "en"]) {
  if (!["tidak bisa ditambahkan", "cannot be added"].some((x) =>
      UMPAN.questions.excluded[side].toLowerCase().includes(x)))
    fail("the pool does not say rating questions cannot be added", side);
  else ok();
  if (!["isian bebas", "free-text"].some((x) =>
      UMPAN.questions.noFreeText[side].toLowerCase().includes(x)))
    fail("the design does not rule out free text", side);
  else ok();
}

// ---------------------------------------------- no composite, anywhere
//
// A single figure standing for a class is a score, and a score becomes a
// rank the first time two of them sit side by side. Every row is a
// distribution across named bands.

for (const r of UMPAN.result.rows) {
  for (const side of ["id", "en"]) {
    const bands = r.text[side].split("·").length;
    if (bands < 2) fail("a result row is a single figure, not a distribution", r.text[side]);
    else ok();
    if (/\b\d+([.,]\d+)\b/.test(r.text[side]))
      fail("a decimal average appeared in a result row", r.text[side]);
    else ok();
    if (/%/.test(r.text[side])) fail("a percentage appeared in a result row", r.text[side]);
    else ok();
  }
}

// ------------------------------------------- it says what does not exist yet

for (const side of ["id", "en"]) {
  const banner = `${SAMPLE.label[side]} ${SAMPLE.body[side]}`.toLowerCase();
  for (const [needles, what] of [
    [["belum ada di pintar", "does not exist in pintar"], "that Umpan Balik does not exist"],
    [["belum menjadi keputusan arsitektur", "not a settled architecture decision"],
     "that it is not a settled architecture decision"],
  ]) {
    if (!needles.some((n) => banner.includes(n)))
      fail(`the banner does not say ${what}`, side);
    else ok();
  }
}

// And the claim that it does not exist is checked against the repository
// rather than asserted: if a feedback capability ever lands, this fails and
// somebody has to update the design's description of the world.
const sql = readFileSync(join(REPO, "supabase", "migrations",
  "20260912004158_foundation_base.sql"), "utf8");
if (/CAN_[A-Z_]*FEEDBACK|CAN_REQUEST_FEEDBACK/.test(sql))
  fail("a feedback capability now exists — this design's scope note is stale", "foundation_base");
else ok();

const hle = readFileSync(join(REPO, "src", "lib", "hle.ts"), "utf8");
if (/umpan.?balik/i.test(hle))
  fail("the product now has feedback strings — this design's scope note is stale", "hle.ts");
else ok();

// The management roles this design addresses DO exist, and the audit says
// so from the schema rather than from memory.
for (const role of ["HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN"]) {
  if (!sql.includes(role)) fail("a management role this design assumes is missing", role);
  else ok();
}

// ----------------------------------------------------------- sixty seconds
//
// Same three-number shape as the Educator view: nobody reads every card in
// full, they read the headlines and open the one they will act on.

const WPM = 200;
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const secs = (n) => (n / WPM) * 60;
const report = {};

for (const side of ["id", "en"]) {
  const frame = [HOME.headline, HOME.bounding, HOME.suppression, HOME.order, HOME.decides]
    .reduce((a, p) => a + words(p[side]), 0);
  const heads = ITEMS.reduce((a, it) => a + words(it.kind[side]) + words(it.happened[side]), 0);
  const per = ITEMS.map((it) => [it.supports, it.unknown, it.step].reduce((a, p) => a + words(p[side]), 0)
    + it.actions.reduce((a, p) => a + words(p[side]), 0));
  const orient = frame + heads;
  const toAct = orient + Math.max(...per);
  report[side] = { orient: Math.round(secs(orient)), toAct: Math.round(secs(toAct)),
                   all: Math.round(secs(orient + per.reduce((a, b) => a + b, 0))) };

  if (secs(orient) > 35) fail(`orientation takes ${Math.round(secs(orient))}s`, side);
  else ok();
  if (secs(toAct) > 60)
    fail(`orientation plus the longest item takes ${Math.round(secs(toAct))}s`, side);
  else ok();
}

// --------------------------------------------------------------- report

if (fails.length) {
  console.error(`\naudit FAILED — ${fails.length} problem(s), ${checks} checks passed\n`);
  for (const f of fails) console.error("  " + f);
  process.exit(1);
}
console.log(`audit OK — ${checks} checks, ${ALL.length} string pairs, ${ITEMS.length} items, ` +
  `${UMPAN.questions.pool.length} governed questions`);
for (const side of ["id", "en"]) {
  const r = report[side];
  console.log(`  ${side.toUpperCase()} at ${WPM} wpm: orientation ${r.orient}s · ` +
    `orientation + the longest item ${r.toAct}s · every item in full ${r.all}s`);
}
