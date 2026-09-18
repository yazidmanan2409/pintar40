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
// R10 is a claim about the DIFFERENCE between two surfaces, so it is checked
// against the other surface rather than against a description of it.
import { FRAME as EDUCATOR_FRAME } from "../../educator/content.js";

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
  "bukan penilaian tentang pimpinan", "not a judgement about management",
  "bukan seberapa baik pimpinannya", "not how good their management is",
  "menilai pimpinannya tidak ada", "asking educators to rate their management are not",
  "bukan bukti belajar", "not learning evidence",
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

// R5, the other direction. Educator feedback is not evidence of management
// quality any more than student feedback is evidence of educator quality.
const MANAGEMENT_SCORING = [
  "skor pimpinan", "nilai pimpinan", "peringkat pimpinan", "penilaian pimpinan",
  "kinerja pimpinan", "kinerja kepala", "rapor pimpinan", "indeks kepemimpinan",
  "management score", "manager score", "leadership score", "management rating",
  "rate management", "management performance", "leadership index",
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
      ["scoring or classifying management", MANAGEMENT_SCORING],
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
    // no individual sheets, to ANYONE — R4 names educator, management,
    // institution administrator and super-admin
    [["lembar jawaban satu per satu", "individual answer sheets"], "no individual answer sheets"],
    [["untuk siapa pun", "available to nobody"], "that nobody receives an individual sheet"],
    // R6: no administrator exception, named as such
    [["bukan untuk administrator", "not to an administrator"],
     "that an administrator is not an exception"],
    // The people who answered read what their manager reads. A surface that
    // reports on people upwards and not back to them is a surveillance tool.
    [["pendidik yang menjawab melihat ringkasan yang sama",
      "educators who answered see the same summary"],
     "that the educators who answered see the same summary"],
    // no participation exposure to the person who asked
    [["siapa yang menjawab", "who answered"], "that who answered is not shown"],
    // R8: results only after close — otherwise the first responder is
    // identifiable by elimination, and the order of answering re-links them
    [["setelah masa menjawab ditutup", "after the answering period closes"],
     "results only after the period closes"],
    [["urutan menjawab tidak disimpan", "order in which people answered is not kept"],
     "that answering times and order are not kept"],
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

// R7 — and no threshold smuggled in anywhere else on the surface either.
for (const [path, p2] of ALL) {
  for (const side of ["id", "en"]) {
    if (/\b(minimal|minimum|sekurang-kurangnya|at least)\s+\d+/i.test(p2[side]))
      fail("a minimum-response threshold number was invented", `${path}.${side}`);
    else ok();
  }
}

// R8 — no live results. Early responses are identifiable by elimination, so
// nothing about a result may be described as arriving while the period runs.
const LIVE = [
  "hasil sementara", "hasil langsung", "hasil berjalan", "pantau langsung",
  "sedang berjalan", "sejauh ini", "secara langsung", "waktu nyata",
  "live result", "live results", "real-time", "realtime", "so far",
  "as responses arrive", "running total", "watch responses",
];
for (const [path, p2] of ALL) {
  for (const side of ["id", "en"]) {
    for (const w of LIVE) {
      if (p2[side].toLowerCase().includes(w))
        fail(`a live result ("${w}")`, `${path}.${side}`);
      else ok();
    }
  }
}

// R6 — and no exception carved out for anybody, however senior.
const EXCEPTION = [
  "kecuali administrator", "kecuali admin", "kecuali pimpinan", "kecuali atasan",
  "administrator dapat melihat", "administrator bisa melihat", "hanya administrator",
  "except an administrator", "except administrators", "unless an administrator",
  "an administrator may", "super-admin", "superadmin", "admins can see",
];
for (const [path, p2] of ALL) {
  for (const side of ["id", "en"]) {
    for (const w of EXCEPTION) {
      if (p2[side].toLowerCase().includes(w))
        fail(`an administrator exception to the privacy rule ("${w}")`, `${path}.${side}`);
      else ok();
    }
  }
}

// ------------------------------------------------- the question pool is governed
//
// Educators are asked about what they themselves can observe in their own
// working week. Nobody is asked to grade anybody, in either direction, and
// nothing is authored here.

const HR_JUDGMENT = [
  "guru yang baik", "good teacher", "seberapa kompeten", "how competent",
  "beri nilai untuk guru", "rate your teacher", "rate the teacher", "nilai gurunya",
];
// R2/R5 — the mirror image, and the one this instrument is actually exposed
// to: an educator asked to rate the person who asked the question.
const MANAGER_JUDGMENT = [
  "pimpinan yang baik", "kepala yang baik", "seberapa baik pimpinan",
  "beri nilai untuk pimpinan", "nilai pimpinan anda", "menilai pimpinan",
  "puas dengan pimpinan", "kepercayaan pada pimpinan",
  "good manager", "good leadership", "how good is management", "rate your manager",
  "rate your head", "rate leadership", "satisfied with management",
  "confidence in management", "confidence in leadership",
];
for (const q of UMPAN.questions.pool) {
  for (const side of ["id", "en"]) {
    for (const [label, list] of [["an HR judgment", HR_JUDGMENT],
                                 ["a rating of management", MANAGER_JUDGMENT]]) {
      for (const w of list) {
        if (q[side].toLowerCase().includes(w))
          fail(`the pool asks for ${label} ("${w}")`, q[side]);
        else ok();
      }
    }
  }
  // Every question is about the respondent's own experience, in the first
  // person. A question that is not about the asker is a question about
  // somebody else — which is how a feedback instrument becomes an appraisal.
  if (!/\bsaya\b/i.test(q.id))
    fail("a pool question is not in the first person", q.id);
  else ok();
  if (!/\bi\b|\bme\b|\bmy\b/i.test(q.en))
    fail("a pool question is not in the first person", q.en);
  else ok();
}
if (UMPAN.questions.pool.length < 3) fail("the pool is too small to be a pool", "");
else ok();
for (const side of ["id", "en"]) {
  if (!["tidak bisa ditambahkan", "cannot be added"].some((x) =>
      UMPAN.questions.excluded[side].toLowerCase().includes(x)))
    fail("the pool does not say rating questions cannot be added", side);
  else ok();
  // And it says WHICH rating question, which on this surface is the one
  // pointing back up at whoever requested the feedback.
  if (!["menilai pimpinannya", "rate their management"].some((x) =>
      UMPAN.questions.excluded[side].toLowerCase().includes(x)))
    fail("the pool does not rule out asking educators to rate management", side);
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

// ------------------------------------ feedback follows the relationship
//
// R2/R3. The Management instrument is EDUCATOR feedback about educators'
// own working and teaching experience. Student feedback goes to the
// educator responsible for that learning, which is a different surface and
// is not designed here. These checks exist so that the day somebody quietly
// points the Management home back at student responses, the design fails
// rather than drifts.

const FEEDBACK_ITEM = ITEMS.findIndex((it) => it.opens === "umpan-hasil");
if (FEEDBACK_ITEM < 0) fail("the home has no feedback item at all", "");
else ok();

for (const side of ["id", "en"]) {
  const wanted = side === "id" ? "pendidik" : "educator";
  if (!UMPAN.name[side].toLowerCase().includes(wanted))
    fail("the Management instrument is not named as educator feedback",
      `${side}: "${UMPAN.name[side]}"`);
  else ok();
  for (const [what, pair] of [["result headline", UMPAN.result.headline],
                              ["scope", UMPAN.start.scope],
                              ["item subject", ITEMS[FEEDBACK_ITEM].subject]]) {
    if (!pair[side].toLowerCase().includes(wanted))
      fail(`the ${what} does not name educators as the respondents`, `${side}: "${pair[side]}"`);
    else ok();
  }
}

// Two lines, and only two, may speak about students at all: the one that
// says where student feedback goes, and the one that says the escalation
// path is undecided. Anywhere else in the feedback experience, a student is
// the wrong respondent.
const STUDENTS_ALLOWED = ["mgmt.UMPAN.start.relationship", "mgmt.UMPAN.start.escalation"];
const STUDENT_WORDS = { id: /\bsiswa\b|\bpeserta didik\b/i, en: /\bstudents?\b|\blearners?\b/i };
for (const [path, p2] of ALL) {
  const inFeedback = path.startsWith("mgmt.UMPAN")
    || path.startsWith(`mgmt.ITEMS[${FEEDBACK_ITEM}]`);
  if (!inFeedback || STUDENTS_ALLOWED.includes(path)) { ok(); continue; }
  for (const side of ["id", "en"]) {
    if (STUDENT_WORDS[side].test(p2[side]))
      fail("the Management feedback experience has students as respondents again",
        `${path}.${side}: "${p2[side].slice(0, 60)}"`);
    else ok();
  }
}

// And the direction is stated on the page, in both halves, with the
// Management end of it spelled out: student responses do not arrive here.
for (const side of ["id", "en"]) {
  const rel = UMPAN.start.relationship[side].toLowerCase();
  const needles = side === "id"
    ? ["siswa kepada pendidik", "pendidik kepada pimpinan", "tidak mengalir ke halaman ini"]
    : ["students to the educator", "educators to the management", "do not flow to this page"];
  for (const n of needles) {
    if (!rel.includes(n)) fail(`the direction of feedback is not stated ("${n}")`, side);
    else ok();
  }

  // R4 — escalation is recorded as undecided, never designed and never
  // assumed. A page that says nothing here is a page that has assumed it.
  const esc = UMPAN.start.escalation[side].toLowerCase();
  const escNeedles = side === "id"
    ? ["belum ditetapkan", "bukan jalur otomatis"]
    : ["has not been decided", "not an automatic path"];
  for (const n of escNeedles) {
    if (!esc.includes(n)) fail(`the escalation path is not left unresolved ("${n}")`, side);
    else ok();
  }

  // R5 — the record class, said on the surface rather than only in the
  // design document.
  const sep = UMPAN.start.separate[side].toLowerCase();
  const sepNeedles = side === "id"
    ? ["catatan tersendiri", "bukan bukti belajar"]
    : ["separate record", "not learning evidence"];
  for (const n of sepNeedles) {
    if (!sep.includes(n)) fail(`the record-class boundary is not stated ("${n}")`, side);
    else ok();
  }
}

// R12 — the result is not a diagnosis. What the aggregate supports is what
// people reported; why, and who or what accounts for it, sits under what is
// not yet known.
const DIAGNOSIS = ["karena", "sebab", "akibat", "because", "therefore", "due to", "caused by"];
for (const [what, chain] of [["the feedback card", ITEMS[FEEDBACK_ITEM]],
                             ["the feedback result", UMPAN.result]]) {
  for (const side of ["id", "en"]) {
    for (const w of DIAGNOSIS) {
      if (chain.supports[side].toLowerCase().includes(w))
        fail(`${what} explains the responses instead of reporting them ("${w}")`, side);
      else ok();
    }
    const unknown = chain.unknown[side].toLowerCase();
    const why = side === "id" ? "mengapa" : "why";
    if (!unknown.includes(why))
      fail(`${what} does not leave why under what is not yet known`, side);
    else ok();
    const accounts = side === "id" ? "apa yang menjelaskannya" : "what accounts for it";
    if (!unknown.includes(accounts))
      fail(`${what} does not leave who or what accounts for it unknown`, side);
    else ok();
  }
}

// ------------------------------------------- it says what does not exist yet

// R1: adopted as a concept, NOT authorized to build. Both halves have to
// be on the page — "adopted" alone reads as a green light, and "not built"
// alone is now the wrong half of the truth.
for (const side of ["id", "en"]) {
  const banner = `${SAMPLE.label[side]} ${SAMPLE.body[side]}`.toLowerCase();
  for (const [needles, what] of [
    [["diterima sebagai gagasan", "adopted as a concept"], "that the concept is adopted"],
    [["belum boleh dibangun", "not authorized to build"], "that it is not authorized to build"],
    [["perlu adr", "needs an adr"], "that it needs an ADR first"],
  ]) {
    if (!needles.some((n) => banner.includes(n)))
      fail(`the banner does not say ${what}`, side);
    else ok();
  }
}

// R5 — the record-class boundary, in the words. Feedback answers a
// different question from assessment and must never be described as
// feeding anything evidence-derived — including, in this direction, the
// appraisal of the people who answered or of the people who asked.
const FEEDS_EVIDENCE = [
  "memengaruhi nilai", "mempengaruhi nilai", "memengaruhi penguasaan",
  "menjadi bukti", "masuk ke penguasaan", "masuk ke sertifikat",
  "memengaruhi mutu soal", "menambah bukti belajar",
  "bukti kinerja", "masuk ke penilaian kinerja", "dipakai untuk menilai kinerja",
  "bahan penilaian kinerja", "menjadi dasar penilaian",
  "affects mastery", "affects scoring", "counts toward", "becomes evidence",
  "feeds question health", "part of the learner\u2019s evidence", "informs certification",
  "performance evidence", "evidence of educator quality", "evidence of management quality",
  "used to assess performance", "feeds an appraisal", "counts toward an appraisal",
];
for (const [path, p] of ALL) {
  for (const side of ["id", "en"]) {
    for (const w of FEEDS_EVIDENCE) {
      if (p[side].toLowerCase().includes(w))
        fail(`feedback described as feeding evidence-derived work ("${w}")`, `${path}.${side}`);
      else ok();
    }
  }
}

// R10 — Management is not Educator higher up.
//
// Checked across the two surfaces, because the ruling is about the
// difference between them. The Educator home asks what needs attention; the
// Management home asks what decisions are waiting. If either drifts into
// the other's question, this fails.
for (const side of ["id", "en"]) {
  const mgmt = HOME.headline[side].toLowerCase();
  const edu = EDUCATOR_FRAME.question[side].toLowerCase();

  const decisionWord = side === "id" ? "keputusan" : "decision";
  if (!mgmt.includes(decisionWord))
    fail("the Management home does not lead with a decision", `${side}: "${HOME.headline[side]}"`);
  else ok();

  // The distinguishing word, not a whole phrase: the Educator's English is
  // "what needs YOUR attention today", and pinning the phrase made this
  // check fail on a surface that had not moved at all.
  const attention = side === "id" ? "perhatian" : "attention";
  if (mgmt.includes(attention))
    fail("the Management home has become the Educator's question", `${side}: "${HOME.headline[side]}"`);
  else ok();

  if (!edu.includes(attention))
    fail("the Educator home no longer asks what needs attention — R10's distinction has moved",
      `${side}: "${EDUCATOR_FRAME.question[side]}"`);
  else ok();

  if (mgmt === edu) fail("the two role views ask the same question", side);
  else ok();
}

// And the reason an item reaches a manager is stated: authority,
// coordination, escalation or institution-level interpretation — never
// "PINTAR has more aggregated information".
for (const side of ["id", "en"]) {
  const rule = HOME.suppression[side].toLowerCase();
  const names = side === "id"
    ? ["wewenang", "koordinasi", "institusi"]
    : ["authority", "coordination", "institution-level"];
  if (!names.every((n) => rule.includes(n)))
    fail("the home does not say why an item reaches management", `${side}: "${HOME.suppression[side]}"`);
  else ok();
}

// R11 — the doctrine sentence, pinned.
if (HOME.decides.id !== "PINTAR mengusulkan, manusia memutuskan.")
  fail("the doctrine sentence has drifted", HOME.decides.id);
else ok();

// Perlu diketahui carries no decision controls. Checked here as well as in
// the browser: a "worth knowing" item that grows buttons has manufactured a
// task, which is exactly what R10 forbids.
for (const it of ITEMS) {
  const worthKnowing = /perlu diketahui|worth knowing/i.test(it.kind.id + it.kind.en);
  if (worthKnowing && it.actions.length)
    fail("a worth-knowing item carries decision controls", it.id);
  else ok();
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
