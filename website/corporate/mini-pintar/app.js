import { el } from "../shared/dom.js";
import { renderSample } from "../shared/chrome.js";
import { getLang, setLang, withLang } from "../shared/lang.js";
import {
  STAGES, EXIT, START, LEARN, QUIZ, EVIDENCE, EDUCATOR, MANAGEMENT, END,
} from "./content.js";

let lang = getLang();
const t = (pair) => pair[lang];
const fmt = (str, vars) => str.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

const STAGE_KEYS = ["start", "learn", "quiz", "evidence", "educator", "management", "end"];

const state = {
  stage: "start",
  quizIndex: 0,
  answers: [], // { correct: boolean }
  decision: null, // index into EDUCATOR.decisions
};

function resetJourney() {
  state.stage = "start";
  state.quizIndex = 0;
  state.answers = [];
  state.decision = null;
}

// ----------------------------------------------------------------- chrome

function renderMiniHeader() {
  const mount = document.getElementById("mini-header");
  const stageIdx = STAGE_KEYS.indexOf(state.stage);
  const pct = (stageIdx / (STAGE_KEYS.length - 1)) * 100;

  mount.replaceChildren(
    el("div", { class: "mini-header" }, [
      el("div", { class: "wrap mini-header__bar" }, [
        el("a", { class: "brand", href: withLang("/", lang) }, [
          el("span", { class: "brand__mark", "aria-hidden": "true" }),
          el("span", { class: "brand__word", text: "PINTAR" }),
        ]),
        el("div", { class: "mini-header__end" }, [
          el("div", { class: "lang-switch", role: "group", "aria-label": "Bahasa / Language" }, [
            el("button", { type: "button", "aria-pressed": lang === "id", text: "ID",
              onclick: () => { setLang("id"); } }),
            el("button", { type: "button", "aria-pressed": lang === "en", text: "EN",
              onclick: () => { setLang("en"); } }),
          ]),
          el("a", { class: "mini-header__exit", href: withLang("/", lang), text: t(EXIT) }),
        ]),
      ]),
      el("div", { class: "mini-progress" }, [
        el("div", { class: "mini-progress__bar", style: `width:${pct}%` }),
      ]),
      el("div", { class: "wrap" }, [
        el("div", { class: "mini-progress__label",
          text: `${stageIdx + 1} / ${STAGE_KEYS.length} · ${t(STAGES[stageIdx])}` }),
      ]),
    ]),
  );
}

// ------------------------------------------------------------------ start

function renderStart() {
  return el("div", { class: "mini-stage__in center" }, [
    el("span", { class: "label label--accent mini-eyebrow", text: t(START.eyebrow) }),
    el("h1", { style: "font-size:var(--fs-h1)", text: t(START.headline) }),
    el("p", { class: "lede mt-4", style: "margin:0 auto", text: t(START.body) }),
    el("p", { class: "label mt-5", text: t(START.meta) }),
    el("div", { class: "mt-7" }, [
      el("button", { type: "button", class: "btn btn--primary", text: t(START.cta),
        onclick: () => go("learn") }),
    ]),
  ]);
}

// ------------------------------------------------------------------- learn

function renderLearn() {
  return el("div", { class: "mini-stage__in" }, [
    el("span", { class: "label label--accent mini-eyebrow", text: t(LEARN.eyebrow) }),
    el("h1", { style: "font-size:var(--fs-h2)", text: t(LEARN.headline) }),
    el("div", { class: "mini-example", text: LEARN.example }),
    el("p", { class: "lede", text: t(LEARN.explain) }),
    el("p", { class: "lede mt-3", style: "color:var(--ink-faint)", text: t(LEARN.note) }),
    el("div", { class: "mini-actions" }, [
      el("button", { type: "button", class: "btn btn--primary", text: t(LEARN.cta),
        onclick: () => go("quiz") }),
    ]),
  ]);
}

// -------------------------------------------------------------------- quiz

function renderQuiz() {
  const q = QUIZ.questions[state.quizIndex];
  const progressText = fmt(t(QUIZ.progress), { n: state.quizIndex + 1 });

  let chosen = null;
  const optionButtons = q.options.map((opt, i) => el("button", {
    type: "button", class: "quiz-option", "aria-pressed": "false",
    text: String(opt),
    onclick: (e) => {
      if (chosen !== null) return;
      chosen = i;
      const buttons = e.currentTarget.parentElement.querySelectorAll(".quiz-option");
      buttons.forEach((b, bi) => {
        b.disabled = true;
        b.setAttribute("aria-pressed", bi === i ? "true" : "false");
      });
      state.answers[state.quizIndex] = { correct: i === q.answer };
      setTimeout(() => {
        if (state.quizIndex < QUIZ.questions.length - 1) {
          state.quizIndex += 1;
          render();
        } else {
          go("evidence");
        }
      }, 420);
    },
  }));

  return el("div", { class: "mini-stage__in" }, [
    el("p", { class: "quiz-progress", text: progressText }),
    el("h2", { class: "quiz-stem", text: t(q.stem) }),
    el("div", { class: "quiz-options" }, optionButtons),
  ]);
}

// ---------------------------------------------------------------- evidence

function evidenceChips() {
  return el("div", { class: "chips" }, QUIZ.questions.map((q, i) => {
    const a = state.answers[i];
    return el("div", { class: "chip-row" }, [
      el("span", { text: t(q.concept) }),
      el("span", { class: `chip ${a.correct ? "chip--good" : "chip--review"}`,
        text: a.correct ? t(EVIDENCE.chipGood) : t(EVIDENCE.chipReview) }),
    ]);
  }));
}

function correctCount() { return state.answers.filter((a) => a.correct).length; }

function interpretationFor(correct) {
  if (correct === 5) return EVIDENCE.interpret.all;
  if (correct >= 3) return EVIDENCE.interpret.most;
  return EVIDENCE.interpret.mixed;
}

function renderEvidence() {
  const correct = correctCount();
  return el("div", { class: "mini-stage__in mini-stage__in--wide" }, [
    el("span", { class: "label label--accent mini-eyebrow", text: t(EVIDENCE.eyebrow) }),
    el("h1", { style: "font-size:var(--fs-h2)", text: t(EVIDENCE.headline) }),
    el("p", { class: "lede mt-3", text: t(EVIDENCE.intro) }),
    el("p", { class: "mt-6", style: "font-weight:700; font-size:1.4rem",
      text: lang === "id" ? `5 pertanyaan dijawab · ${correct} terjawab dengan baik`
                          : `5 questions answered · ${correct} answered well` }),
    el("h3", { class: "mt-6", style: "font-size:var(--fs-small); text-transform:uppercase; letter-spacing:0.08em; color:var(--ink-faint)",
      text: t(EVIDENCE.chipsLabel) }),
    evidenceChips(),
    el("p", { class: "lede mt-6", text: t(interpretationFor(correct)) }),
    el("div", { class: "mini-actions" }, [
      el("button", { type: "button", class: "btn btn--primary", text: t(EVIDENCE.cta),
        onclick: () => go("educator") }),
    ]),
  ]);
}

// ---------------------------------------------------------------- educator

function firstMissedConcept() {
  const i = state.answers.findIndex((a) => !a.correct);
  return i === -1 ? null : QUIZ.questions[i].concept;
}

function renderEducator() {
  const correct = correctCount();
  const missed = firstMissedConcept();

  const summary = lang === "id"
    ? `5 pertanyaan dijawab · ${correct} terjawab dengan baik · ${5 - correct} perlu ditinjau lagi`
    : `5 questions answered · ${correct} answered well · ${5 - correct} need another look`;

  const stepLine = missed
    ? fmt(t(EDUCATOR.stepWith), { concept: t(missed) })
    : t(EDUCATOR.stepWithout);

  let decisionMade = false;
  const decisionButtons = EDUCATOR.decisions.map((d, i) => el("button", {
    type: "button", class: "decision-btn", "aria-pressed": "false", text: t(d),
    onclick: (e) => {
      if (decisionMade) return;
      decisionMade = true;
      state.decision = i;
      const buttons = e.currentTarget.parentElement.querySelectorAll(".decision-btn");
      buttons.forEach((b, bi) => {
        b.disabled = true;
        b.setAttribute("aria-pressed", bi === i ? "true" : "false");
      });
      document.getElementById("educator-ack").replaceChildren(
        el("div", { class: "ack-panel" }, [fmt(t(EDUCATOR.ack), { choice: t(d) })]),
        el("div", { class: "mini-actions" }, [
          el("button", { type: "button", class: "btn btn--primary", text: t(EDUCATOR.cta),
            onclick: () => go("management") }),
        ]),
      );
    },
  }));

  return el("div", { class: "mini-stage__in mini-stage__in--wide" }, [
    el("span", { class: "label label--accent mini-eyebrow", text: t(EDUCATOR.eyebrow) }),
    el("h1", { style: "font-size:var(--fs-h2)", text: t(EDUCATOR.headline) }),
    el("p", { class: "lede mt-3", text: t(EDUCATOR.intro) }),

    el("h3", { class: "mt-7", style: "font-size:var(--fs-small); text-transform:uppercase; letter-spacing:0.08em; color:var(--ink-faint)",
      text: t(EDUCATOR.summaryLabel) }),
    el("p", { class: "mt-2", style: "font-size:1.1rem; font-weight:600", text: summary }),

    el("h3", { class: "mt-6", style: "font-size:var(--fs-small); text-transform:uppercase; letter-spacing:0.08em; color:var(--ink-faint)",
      text: t(EDUCATOR.flagLabel) }),
    missed
      ? el("p", { class: "mt-2", style: "font-weight:600", text: t(missed) })
      : el("p", { class: "mt-2 lede", text: t(EDUCATOR.flagNone) }),
    evidenceChips(),

    el("h3", { class: "mt-6", style: "font-size:var(--fs-small); text-transform:uppercase; letter-spacing:0.08em; color:var(--ink-faint)",
      text: t(EDUCATOR.stepLabel) }),
    el("p", { class: "lede mt-2", text: stepLine }),

    el("h3", { class: "mt-7", style: "font-size:var(--fs-h3)", text: t(EDUCATOR.decisionLabel) }),
    el("div", { class: "decisions" }, decisionButtons),
    el("div", { id: "educator-ack" }),
  ]);
}

// ------------------------------------------------------------- management

function reportRow(row, i, unresolvedIdx) {
  const pct = (n) => `${(n / row.total) * 100}%`;
  const flagged = i === unresolvedIdx;
  const caption = lang === "id"
    ? `${row.strong} dari ${row.total} kuat · ${row.mid} sebagian · ${row.low} belum cukup bukti`
    : `${row.strong} of ${row.total} strong · ${row.mid} partial · ${row.low} not enough evidence`;
  return el("div", { class: "report__row" }, [
    el("div", { class: "report__row-head" }, [
      el("span", { style: "font-weight:600", text: t(row.concept) }),
      flagged ? el("span", { class: "label", style: "color:var(--status-mid)", text: t(MANAGEMENT.attentionLabel) }) : null,
    ]),
    el("div", { class: "report__bands", role: "img", "aria-label": caption }, [
      el("span", { class: "report__band--strong", style: `width:${pct(row.strong)}` }),
      el("span", { class: "report__band--mid", style: `width:${pct(row.mid)}` }),
      el("span", { class: "report__band--low", style: `width:${pct(row.low)}` }),
    ]),
    el("p", { class: "mt-2", style: "font-size:0.875rem; color:var(--ink-soft)", text: caption }),
  ]);
}

function renderManagement() {
  return el("div", { class: "mini-stage__in mini-stage__in--wide" }, [
    el("span", { class: "label label--accent mini-eyebrow", text: t(MANAGEMENT.eyebrow) }),
    el("h1", { style: "font-size:var(--fs-h2)", text: t(MANAGEMENT.headline) }),
    el("div", { class: "sim-banner mt-4", text: t(MANAGEMENT.simLabel) }),
    el("p", { class: "lede", text: t(MANAGEMENT.intro) }),
    el("div", { class: "report mt-6" }, [
      el("div", { class: "report__head" }, [
        el("h3", { text: t(MANAGEMENT.simLabel) }),
        el("span", { class: "label", style: "color:var(--ink-faint)", text: t(MANAGEMENT.meta) }),
      ]),
      el("p", { style: "color:var(--ink-soft); margin-bottom:var(--sp-4)", text: t(MANAGEMENT.coverage) }),
      ...MANAGEMENT.rows.map((r, i) => reportRow(r, i, MANAGEMENT.unresolvedRow)),
      el("div", { class: "report__unresolved mt-5", text: t(MANAGEMENT.unresolved) }),
    ]),
    el("div", { class: "mini-actions" }, [
      el("button", { type: "button", class: "btn btn--primary", text: t(MANAGEMENT.cta),
        onclick: () => go("end") }),
    ]),
  ]);
}

// -------------------------------------------------------------------- end

function renderEnd() {
  return el("div", { class: "mini-stage__in center" }, [
    el("span", { class: "label label--accent mini-eyebrow", text: t(END.eyebrow) }),
    el("h1", { style: "font-size:var(--fs-h1)", text: t(END.headline) }),
    el("p", { class: "lede mt-4", style: "margin:0 auto", text: t(END.body) }),
    el("div", { class: "mt-7", style: "display:flex; gap:16px; justify-content:center; flex-wrap:wrap" }, [
      el("a", { class: "btn btn--primary", href: withLang("/untuk-manajemen/", lang), text: t(END.ctaPrimary) }),
      el("a", { class: "btn btn--outline", href: withLang("/kontak/", lang), text: t(END.ctaSecondary) }),
    ]),
    el("div", { class: "mt-6" }, [
      el("button", { type: "button", class: "btn btn--text", text: t(END.restart),
        onclick: () => { resetJourney(); render(); } }),
    ]),
  ]);
}

// ------------------------------------------------------------------- core

const RENDERERS = {
  start: renderStart, learn: renderLearn, quiz: renderQuiz, evidence: renderEvidence,
  educator: renderEducator, management: renderManagement, end: renderEnd,
};

function go(stage) {
  state.stage = stage;
  render();
  window.scrollTo({ top: 0, behavior: "instant" in window.scrollTo ? "instant" : "auto" });
}

function render() {
  document.documentElement.lang = lang;
  document.title = lang === "id" ? "Mini-PINTAR" : "Mini-PINTAR";
  renderSample(document.getElementById("sample-mount"), lang);
  renderMiniHeader();
  document.getElementById("view").replaceChildren(RENDERERS[state.stage]());
}

render();
