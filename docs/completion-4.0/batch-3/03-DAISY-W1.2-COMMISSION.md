# W1.2 · Commission for Daisy: the question-review layout (2 Nov 2026)

**Status:** blocking (owner's Batch 3 gate, item 4; already listed as F-12 (1)). Daisy's design system, frozen on 8 Oct (`origin/ux-1/daisy-experience`, last commit `cc96030`), has no composition for this screen. I checked again on 2 Nov and nothing has been added. Nothing here invents the design: this document says what the screen must carry and which decisions are hers.

## What the screen is for

Before a head of department presses «Setujui isi» on a package, they read every question, its key and the reason for every option. This is D-088(h), guarded by the journeys' S17. If something is wrong, they send the package back with a reason (W1.6) instead.

The section is **«Soal dalam paket ini»** on the package page (`src/app/studio/paket/[course]/page.tsx`). It is shown only to the school's Studio staff; learners never see a key or a reason.

## What it carries today (data that exists; nothing new)

**Per lesson (Pelajaran):**
- its name and question count;
- the questions in workbook order.

**Per question:**

| Field | Example | Always present? |
|---|---|---|
| Use | «Pemetaan Awal», «Uji Penguasaan», «Latihan» | yes |
| Stem | «Kelipatan 5 yang keempat adalah ....» | yes |
| Stimulus or hint | «Tuliskan kelipatan 5 mulai dari yang pertama.» | no |
| Difficulty | Mudah / Sedang / Sulit | yes |
| Options | 2 to 5, labelled A–E | yes |
| Key | exactly one option | yes |
| Reason | one per option («Alasan: …») | yes |
| Misconception | code and label, on a wrong option | no |

**Scale:**
- the synthetic Bab 1: about 18 questions over 4 lessons;
- the importer's ceiling: 2,000 questions and 500 lessons per package.

**Today's rendering:** a native `<details>` per lesson, with the ▶ marker, opening onto a numbered list in which every option shows its reason; the key is bold with «· Kunci». See `evidence/w65/09-buat-dan-kunci.png`: the «wall of questions» RV-21 and DG-25 name.

## The decisions only Daisy can make (blocking)

1. **Reading order and navigation for a long package:**
   - one long page, a lesson at a time, or a question at a time;
   - how the reviewer knows where they are, e.g. «Soal 7 dari 18».
2. **How the key is marked** without relying on colour alone (WCAG 1.4.1). Today: bold and «· Kunci».
3. **Where each option's reason and misconception sit:** always shown, shown on request, or shown only for the key and the wrong options that carry a misconception.
4. **What replaces the native ▶ disclosure:** your Disclosure component, or another component of yours. Also: should every lesson start open or closed?
5. **How a question's use and difficulty are shown:** Badge, eyebrow or meta line.
6. **The 320 px layout** of a question with five long options and their reasons.

## Not asked (outside 4.0, D-142)

Per-question comments or approvals: the review outcome is per package (W1.6, approve or send back).

## When it arrives

It becomes one small change to the package page, plus a guard rendered against her composition. The S17 and W6.5 walks already read the questions by their selectors (`#soal li.pin-soal`, `.pin-opsi-kunci`, `.pin-opsi`). If her layout renames them, the walks change with it, and what the walks check stays the same.
