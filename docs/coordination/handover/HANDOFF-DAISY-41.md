READY FOR REVIEW: J1–J7 composed, ready for owner validation on 7c6aefe2f99372e15fccccbdc47bb7a874f5d5b6

# Daisy · batch 4: the composed journeys, ready for Yazid's walk (7 Oct)

**From:** Daisy (UX-1). **To:** Yazid, through the coordinator. **Brief:** `docs/coordination/briefs/DAISY-BATCH-4-2026-10-07.md`.

**The number.** Batch 4 has no ticket number, so this hand-off takes the next free one: DAISY-40 is the highest on main.

**The scope.** Design only, all `[skip ci]`:
- nothing in `src/`;
- no CI dispatched (the allowance is unchanged at 621 of 1,900);
- no production, Supabase, Vercel or secrets;
- the card and the certificate untouched;
- invented people only.

**The lane.** The batch starts from main `53058f5`, merged into the lane (`0e2a191`, a merge, not a rebase).

## Where to walk them

- **The offline HTML** (`docs/coordination/ux/sistem-desain/situs/PINTAR-design-system.html`, rebuilt from this commit): the new category «Composed journeys» in the left column, one page per journey. Each page has three width buttons:
  - «Card · 1280 px»;
  - «Laptop · 1024 px»;
  - «Phone · 390 px».

  «Open alone in a new tab» gives a journey the whole window.
- **The Design System page:** https://claude.ai/artifact/153KwNRJkTETDKAZSoorS1 (private), republished with the same cards.

**How to walk one.**
- Click the screens themselves: every button and link that belongs to the journey moves it on.
- A place outside the journey says so in the grey review bar and changes nothing.
- The numbered steps in the review bar jump between screens.
- «Mark new words» outlines every word that is not in the copy table yet.
- The review bar and the dashed «review step» buttons are in English and are not PINTAR.

## The seven journeys

| | Card | Who | Screens | As defined? |
|---|---|---|---|---|
| J1 | J1 · Publish, then make available | Maya Kusuma (Admin sekolah), then Rina Kartika (Guru) | 7 | No: publishing and making available are two acts by two people. **JQ1** |
| J2 | J2 · A whole class, one learner | Rina Kartika | 2, the menu and the dialog | No: a teacher has no consequential act on one learner. **JQ2** |
| J3 | J3 · Teaching and learning | Rina Kartika, also enrolled in a course | 3 | Yes. **JQ3** asks about the shell. |
| J4 | J4 · A lesson, a question, a result | Bagas, a learner | 4 | Yes. |
| J5 | J5 · The window's dates | Rina Kartika | 1 | No: an Uji Cepat has no opening date; «Siapkan»'s window instead. **JQ5** |
| J6 | J6 · MODE PERAGAAN | An evaluator | 3 | No: the room is the evaluator's, not a teacher's. **JQ6** |
| J7 | J7 · Stepping away | Rina Kartika | 4 | Yes, in Gate 6's words. |

## The records

Each journey's README holds its full record: the check, its result at 1280, 1024 and 390 px, and a note. `11-validation.md` §1 has the summary and the evidence.

| Check | J1 | J2 | J3 | J4 | J5 | J6 | J7 |
|---|---|---|---|---|---|---|---|
| One obvious next action | pass | pass | pass | pass | pass | pass | pass |
| Where am I | pass | pass | F8 at 1024 | pass | pass | F9 | pass |
| Every action answered, then its result in words | pass | pass | pass | pass | pass | pass | pass |
| Nothing by colour alone | pass | pass | pass | pass | pass | pass | pass |
| Targets 44 px (24 px floor) | pass | pass | pass | pass | pass | pass | pass |
| No sideways scroll at 390 px | pass | F7 | pass | pass | pass | pass | pass |
| Keyboard order and focus | pass | pass | pass | pass | pass | pass | pass |
| Screen reader (the tree) | pass | pass | pass | pass | pass | pass | pass |
| Reduced motion | pass | pass | pass | pass | pass | pass | pass |
| Anything that fights the content | F10 at 390 | C1 | pass | pass | pass | pass | pass |

**What was run.**
- **The harness** (`alat/pratinjau.mts --sempit`): every screen of every journey at 1280, 1024 and 390 px, alongside every component. It checks axe (WCAG 2.2 AA), targets and sideways scroll.
- **The keyboard walk** (`alat/jalani.mts`, new): each journey walked by Tab, arrows, Enter and Esc alone, at three widths, with motion on and then reduced: 42 runs, 0 findings. It lists every screen's Tab stops and checks:
  - the focus ring on every stop;
  - nothing under the sticky bar;
  - the skip link: first, visible on focus, landing on main;
  - focus on each new screen's heading;
  - the page title following the screen.

  It also records every animation and transition. There were none under reduced motion; with motion on, only 120, 160 and 240 ms were used, with 8 px of travel at most.
- **The accessibility tree** of every screen at 1280 and 390 px is in `render/jalan/`. The screen-reader check is my review of that tree. **It is not a screen reader.** An NVDA or TalkBack pass is still owed: in your walk if you can, or in the application pass.
- **A rule audit:** every journey screen was checked against the rules of every component it uses. Its 18 points are corrected in the journeys, or listed below where the rule and the product disagree.

## Findings (for your ruling)

Each has a proposed correction in `11-validation.md` §1. Nothing is corrected until you rule.
- **F2** · The Table and Table rows specimens offer «Kirim pengingat», «Pindahkan ke kelas lain» and «Keluarkan dari kelas». A teacher can do neither of the last two, and PINTAR promises no notifications.
- **F3** · «Uji Cepat dibuka» with a date, in the Date and time, Dates and Panel specimens.
- **F4** · The Lock screen and Idle warning specimens predate Gate 6. Their rule says «No name on the lock»; Gate 6 names the staff member.
- **F5** · A teacher publishing to a class, in the App shell, Confirmation, Specimen and Action feedback specimens, the README's examples and J1's definition.
- **F7** · J2 at 390 px: each state is cut at the table frame's edge.
- **F8** · J3 at 1024 px: the rail merges «Mengajar» and «Belajar». Question JQ7.
- **F9** · J6: the page title inside the room does not say MODE PERAGAAN.
- **F10** · J1 at 390 px: Studio's tabs hide the last two with no sign that more follow.
- **F11** · The Confirmation rule vs the product's review steps before an act.
- **F12** · The shell documents say a learner is «never named»; D-020 greets by first name on Belajar and the home page.
- **F13** · The App shell's 36 px «Keluar» in the top bar vs the Button rule.
- **F14** · The Button rule «a verb and its object» vs the copy table's bare verbs.
- **F15** · The Table specimen's count is not announced.
- **C1** · «Ya, keluar dari semua» on the dialog's confirm.
- **C2** · «Siswa» and «menugaskan» in the publishing copy.

**Corrected at source while composing.** These are defects against a component's own rule or question 10:
- the breadcrumb's «/» was read aloud;
- the App shell's main column grew past 390 px under a long place name;
- the dialog's actions did not stack under 640 px;
- the new skip link showed above the screen while hidden.

## Questions for Yazid

Numbered, each with my recommendation:

1. **JQ1:** confirm J1 as composed: the school publishes, then a teacher makes the chapter available. *Recommendation: confirm; correct J1's definition and F5.*
2. **JQ2:** J2's dialog. (a) As composed: «Keluar dari semua perangkat» moves into the account menu and asks in the dialog. (b) Keep it in-page on «Akun saya», as today, and validate the dialog on the school admin's «Kartu hilang atau rusak», which needs a J2b. Also: keep one table with a state filter in place of the product's three lists? *Recommendation: (a), and the table.*
3. **JQ3:** an educator's own learning stays in the staff shell. *Recommendation: confirm.*
4. **JQ5:** J5 on «Siapkan»'s window, dates only. *Recommendation: confirm; correct F3.*
5. **JQ6:** J6 with an evaluator. *Recommendation: confirm. Studio's «Lihat seperti siswa» wearing the band is a later question.*
6. **JQ7:** a hairline between the two groups in the rail (touches question 11). *Recommendation: yes, no labels, order unchanged.*
7. **GQ1:** CR-81, the class population beside its bands. *Recommendation: one line of three counts above the bands, the bands headed by their own base; «Belum mengerjakan» never a band; a «Population» kind in Progress.*
8. **GQ2:** CR-77, where a school admin who referred reads the outcome. *Recommendation: on the page they referred from (Studio's integrity review), with named steps.*
9. **GQ3:** CR-22, an email reference card in the design system. *Recommendation: yes, reference only; D-079 stays the standard.*
10. **GQ4:** CR-07, a file field component. *Recommendation: yes, one small component.*
11. **GQ5:** CR-05 and CR-13, a consequential act that needs a reason: a form page or the dialog? *Recommendation: a form page; the dialog stays a short question.*

## The grammar gaps (brief §B)

The full table is in `11-validation.md` §3. In short:
- **The ruled grammar has the pattern for:**
  - CR-52 (S23q stays red until S7);
  - CR-76, CR-75, CR-78, CR-79, CR-41 with W-7, CR-80;
  - CR-13, CR-51, CR-37, CR-46, CR-27, CR-21;
  - CR-03, CR-04, CR-06, CR-14, CR-05, CR-54, CR-57.
- **The gaps** are CR-81 (GQ1), CR-77's place (GQ2), CR-22 (GQ3) and CR-07 (GQ4). CR-05 and CR-13 need a clarification (GQ5).

**The copy owed** (`11-validation.md` §4) is proposed in final words for the slices to apply:
- CR-50: five problem sentences, and the template's «Miskonsepsi» sheet with its line in «Cara mengisi»;
- CR-13: the six texts of the correction notice;
- CR-76: the two waiting texts and the card's state word;
- CR-81: the three population labels and the bands' heading.

## The stripe (brief §C)

The «Table rows» page is ready to open full screen. In the HTML: «Components» → «Data» → «Table rows» → «Open alone in a new tab» → F11. `11-validation.md` §2 has the test and an unfilled record table, one row per display. The check is yours.

## Checks before this commit

- `npx tsx docs/coordination/ux/sistem-desain/alat/pratinjau.mts --sempit`: «59 previews, 0 with a failure».
- `python3 docs/coordination/ux/sistem-desain/alat/kontras.py`: «61 pairs, 0 under the floor».
- `npx tsx docs/coordination/ux/sistem-desain/alat/jalani.mts`: «7 journeys, 0 runs with a finding».

## Stop

I stop here and wait for your walk. After your rulings (brief §3):
1. I correct each finding at source and re-run the checks.
2. With the stripe decided, I freeze APPLICATION READY in a new hand-off.

Nothing moves to PINTAR's application before the authorised UI/UX stage.
