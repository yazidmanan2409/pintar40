# PINTAR 3.0 — Beyond Features, Towards an Educational Experience

Status: **binding product philosophy**, synchronised 2026-08-02. Sits above the
2.0 Design Language (`PINTAR-DESIGN-LANGUAGE.md`) and alongside the Learning
Safety Doctrine in `CLAUDE.md`. Where a feature request conflicts with this
document, this document wins.

> The question is no longer "what features should PINTAR have?" but
> **"what should every interaction inside PINTAR feel like?"**

## The objective

Not the platform with the most features — the platform with the **least friction
between knowledge and learning**. Every screen answers one question:
*What is the next thing this person needs to accomplish?*

## The 14 principles

1. **Knowledge is the centre.** Not files, not databases, not AI. Admins do not
   "Upload File" — they *Tambahkan Sumber Pengetahuan*.
   `Knowledge → Distillation → Learning Package → Learning Experience`
2. **Knowledge Distillation is the heart.** A book becomes a structured
   educational object:
   `Learning Objectives → Lessons → Worked Examples → Media Assets →
   Question Bank → Misconceptions → Assessment Blueprint → PLP`.
   The **PINTAR Learning Package (PLP)** is the canonical educational language;
   NotebookLM / Gemini / Claude / ChatGPT are interchangeable *producers* feeding it.
3. **Replace configuration with creation.** Never expose Import / Parse /
   Validate. Offer outcomes: Create Learning Package, Assessment, Lesson, Video,
   Audio, Flashcards.
4. **One screen, one question.**
   Distillation → *What can we create from this knowledge?* ·
   Editorial Review → *Is this educationally ready?* ·
   Student → *What should I learn next?* ·
   Educator → *Which students need my attention?* ·
   Dean → *How is my institution performing?* ·
   Platform Admin → *Is the platform healthy?*
   The workflow discovers the user, not the reverse.
5. **Progressive disclosure.** No JSON, no PLP jargon, no parser status for
   administrative staff. Say "3 learning objectives need attention." The
   engineering stays invisible.
6. **Validation is coaching, not error reporting.** Never
   `misconception_taxonomy[0].remediation`. Instead: **Lokasi · Masalah ·
   Mengapa penting · Cara memperbaiki**. The system teaches the administrator.
7. **Every object has a lifecycle.**
   `INGESTED → STRUCTURED → VALIDATED → IN REVIEW → APPROVED → FROZEN →
   PUBLISHED → SUPERSEDED`. Nothing is static.
8. **Human authority is preserved.** AI generates → educators review →
   institutions approve → PINTAR measures → evidence improves.
9. **Learning assets are first-class.** Video, audio, slides, mind maps,
   flashcards, worked examples, assessments belong *inside* the package — never
   "attachments".
10. **Evidence closes the loop.** NotebookLM creates; PINTAR learns.
    `Knowledge → Learning → Assessment → Evidence → Improvement → Knowledge v2`.
    Every learner improves the next learner's material.
11. **Principles over technologies.** No dependency on any one model. Depend on
    knowledge, learning, evidence, educational integrity.
12. **The entry experience.** The homepage "disappears" *as a homepage* — it does
    not stop existing. Everyone enters through purpose: the first screen
    introduces the user's next step rather than introducing PINTAR itself.
13. **One workspace, one journey.**
    `Knowledge → Distillation → Review → Publish → Assign → Learn → Measure →
    Improve` — never disconnected modules.
14. **Protect simplicity.** Every new feature must answer: *does this reduce
    friction for educators or learners?* Complexity moves inward; simplicity
    faces the user.

## The mantra

Knowledge is the beginning. Learning is the purpose. Evidence is the compass.
Humans remain responsible. AI accelerates creation.

**PINTAR transforms knowledge into measurable learning, and uses evidence to
continuously improve that knowledge.**

## Five years ahead

Not "an AI education platform" — *the operating system that quietly helps
institutions turn knowledge into learning, learning into evidence, and evidence
back into better knowledge.*
