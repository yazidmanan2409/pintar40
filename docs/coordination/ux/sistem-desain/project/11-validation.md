# Validation

**State: READY TO VALIDATE (5 Oct).** The design system is approved in principle, and every question is ruled («Proposal and rulings»). Before the authorised UI/UX stage applies anything to PINTAR, two things are checked:
- **the composed journeys:** the approved grammar is checked working together in composed PINTAR journeys, not one component at a time;
- **the table stripe:** checked on real school displays.

Nothing here changes PINTAR, and nothing is propagated to the application.

## Settled: not validated again

| | State |
|---|---|
| The brand: the PINTAR wordmark, its specification and the 4.0 tab icon | Approved. Only the outlined master is pending (production, below). |
| The ID card and the certificate | Frozen. The only change is the 5 Oct brand correction: the PINTAR wordmark in place of «PINTAR SELALU». |
| Tokens, type, colour, corners, elevation, motion, icons, the accessibility standard, dates | Approved (questions 3 to 10, 12, 13 and 15). |
| The shells and the staff navigation | Approved (question 1). The order and grouping are kept for the application pass (question 11) and validated below before they change further. |
| The table stripe | A, provisionally (question 14). Validated below. |

## 1. Composed journeys

**Why.** The components pass one at a time (52 previews, axe, 24 and 44 px targets, 390 px, reduced motion). A journey shows what single components cannot:
- whether one action stays obvious per screen;
- whether the navigation says where you are;
- whether every click is answered;
- whether the grammar holds together at school scale.

**How they are made.**
- Each journey is a short clickable sequence of screens, composed only from the design system's components and tokens. No product code, no data, nothing in `src/`.
- The words come from the copy table (`src/lib/hle.ts`, D-014). Where a word does not exist yet, it is marked as new.
- People, schools and classes are invented.
- Each journey is drawn at 1280, 1024 and 390 px, and is walked by keyboard alone and with reduced motion on.

| | Journey | Who | What it validates |
|---|---|---|---|
| J1 | Publish a chapter to a class: Kelas → the chapter → «Terbitkan» → «Menerbitkan…» → «✓ Diterbitkan» and the result line («Bab 3 tersedia untuk 31 murid Kelas 5A mulai sekarang.») | Teacher | The staff shell and its places (1, 11); the publishing words (2); the type ladder (4); motion on the result (8) |
| J2 | Look at a whole class and act on one learner: the long table, search, the status filter, the stripe, a row's menu, and a consequential action asked in a dialog | Teacher | Floating layers and their shadow (5); the one dialog pattern, started from a menu (6); 4 px small controls (7); entering layers (8); the stripe in context (14) |
| J3 | Move between teaching and learning: «Mengajar» → «Belajar» → back | Educator who also learns | The distinct contexts (11); which shell each context wears (1); that the navigation never suggests a role the person does not hold |
| J4 | A lesson, a question and its result: on a 1366 × 768 shared computer and on a phone | Learner | The learner's top bar at every width (1); the question stem outside the ladder; one obvious next action; WCAG 2.2 AA with the skip link (10) |
| J5 | Set when an Uji Cepat opens: the native date and time field with «Jumat, 9 Okt 2026, 07.30 WIB» beneath it, a mistake, then the save | Teacher or school admin | Date fields (15); 3:1 field outlines and the error under the field (3); hover and press at 120 ms (8) |
| J6 | See what a learner sees: MODE PERAGAAN, and back | Teacher | The deep-ink context band, and no new hue (12) |
| J7 | Step away from a shared computer: the idle warning, the lock, the PIN | Any staff member | The identity screens together; entering layers and reduced motion (8); keyboard and screen reader (10) |

**What each journey records**, as pass or finding:
- one obvious next action on every screen;
- where am I: the navigation and the title agree;
- every action answered at once, then its result in words;
- nothing by colour alone;
- every target at least 44 px (24 px the floor), and no sideways scroll at 390 px;
- keyboard order and focus, a screen-reader pass, and reduced motion;
- anything that fights the content.

**The decision.** Yazid walks the journeys and rules on each finding. A finding that changes a ruled item (for example, the staff navigation's grouping) goes back to Yazid as a question; it is not decided here.

## 2. The table stripe on real displays (question 14)

**What is checked.** Option A (`table-row-alt` = `surface-0`, 1.04:1 against white) must let a reader follow a long row on the displays schools really use. A+ (#F7F6F2) is not a token; it is shown only so this check can compare.

**Where.** The «Table rows» page, opened full screen: the design-system HTML file («Open alone in a new tab») or the Design System page. It holds the long class table in A, and three eight-row samples (A, A+ and B).

**On three displays**, each at its usual brightness and in its usual room light:
1. an ordinary school computer or laptop (for example 1366 × 768);
2. a poor display: an older or cheaper panel, or a laptop seen from an angle;
3. a classroom projector, from the back row.

**The test.** On each display:
- follow row 17 of the long table, from the name to the last column, without a finger or the pointer;
- then check that the row under the pointer and a selected row still read differently from the stripe.

Record the device, the brightness, the room light and the result.

**The rule.**
- **A stands** if a reader can follow the row on all three. It then becomes final.
- **A moves to A+** only if A demonstrably fails on one or more displays, and A+ passes there.
- Moving to A+ is then a token change: `table-row-alt` takes #F7F6F2, the contrast table is re-run, and every state is checked again.

## 3. Pending outside design

- **The wordmark master** (production). The steps, in order:
  1. Verify the font licence.
  2. Make the outlined master from licensed Helvetica Neue 65 Medium.
  3. Verify it optically: kerning and exact width.
  4. Measure the card's and the certificate's wordmark again (`merek-pintar.mts`; each at least 15 mm wide).
  5. Re-make the print proofs.
- **The physical proof** of the card and the certificate. Yazid's notes on the 0.75 mm gold line and the QR scans close it (D-074(12), D-080).

## The validation record

| Check | State | Evidence |
|---|---|---|
| J1 to J7, composed | Not started: the next design work | Each journey's screens and its record, here |
| J1 to J7, walked by Yazid | Waits on the composed journeys | Findings and rulings |
| The stripe on three displays | Ready to run | The record above, one row per display |
| The wordmark master | Pending: licence verification | Production |
| The physical proof | Waiting for Yazid's notes | The card and certificate round 2 READMEs |

## The gate to the application pass

The application pass («Proposal and rulings», «The application pass») starts only when all of these hold:
- the authorised UI/UX stage has begun, after Engineering Complete;
- the journeys have been walked and their findings ruled;
- the stripe is decided.

Until then, nothing is propagated to PINTAR's application, its sidebar included.
