# PINTAR 4.0 · Batch 4: your walk of J1–J7, and what to rule (7 Oct)

**Daisy is READY FOR REVIEW on `7c6aefe`.** Her hand-off is `docs/coordination/handover/HANDOFF-DAISY-41.md`, on lane `ux-1/daisy-experience` at `d226fef`. Engineering stays held (D-124). **Nothing here is decided. Every ruling below is yours.**

## 1. What the coordinator checked (read and re-run, not walked)

**Scope: clean.**
- Batch 4's two commits touch only the design system and the hand-offs: nothing in `src/`, `supabase/`, `selftest/`, `audit/` or `.github/`.
- The card and the certificate are untouched in this batch.
- No CI was dispatched. The allowance stays at 621 of 1,900.
- The people are invented: Maya Kusuma, Rina Kartika and Bagas appear nowhere in the code or the records.

**Her three checks, re-run on `7c6aefe`, gave the same results she reported:**
- `pratinjau.mts --sempit`: «59 previews, 0 with a failure»;
- `kontras.py`: «61 pairs, 0 under the floor»;
- `jalani.mts`: «7 journeys, 0 runs with a finding».

The Design System page was republished on 7 Oct. The offline HTML is a build output, uncommitted by design, so the file she attached is the one to open.

**The product facts behind her four mismatches are true.** Read in the code on main `578a1e9`:

| Her claim | What the code says |
|---|---|
| J1: a teacher cannot publish | `CAN_PUBLISH` is held by the school admin and the platform admin only (`role_capabilities`); an educator has no such right. A teacher has exactly three acts: `sediakanMateri`, `sediakanUjiCepat` and `mintaBacaUlang` |
| J2: a teacher has no consequential act on one learner | The only act a teacher takes on one learner is «Minta membaca lagi». «Keluar dari semua perangkat» is on «Akun saya» today, with in-page confirmation (`KeluarSemua.tsx`) |
| J5: an Uji Cepat has no opening date | The Uji Cepat takes minutes («Berhitung sejak disediakan»). «Siapkan» takes «Mulai» and «Sampai» as date fields, with no time |
| J6: MODE PERAGAAN is the evaluator's | Only the evaluation banner shows it (ADR-0020). Studio's «Lihat seperti siswa» wears no band |
| GQ2: /pimpinan refuses a school admin | It admits a head of department or a dean only; a school admin meets the refusal page |
| C1 and C2 | `akun.semua.ya` reads «Ya, keluar dari semua». The two publishing keys say «Siswa» and «menugaskan» |

**Two things the coordinator found for your ruling:**

1. **CR-13 copy.** Daisy asked engineering to confirm when the notice is sent.
   - **The answer:** only after activation. The route sends it only for an activated account, and after activation only the platform admin may correct an email (migration 20261203100000).
   - So today's wording is true: «Admin PINTAR …» and «oleh admin platform setelah aktivasi». Two of her three reasons for changing it rest on a correction before activation, which never sends this notice.
   - Her proposed wording is still true («oleh admin»), only less specific. The tone is your choice.
   - **One correction either way.** Staff sign in with their email **or a username** (`idpage.lede`). Her «masuklah lagi dengan alamat yang baru» tells a username user the wrong way in. Use «masuklah lagi», or name both.
2. **GQ1 (CR-81) keeps the temporary line's shape.**
   - She recommends one line of three counts, with one label shortened and a heading over the bands.
   - Your brief to her said that line is «functional, not final UX. Do not let it become the design because the numbers exist» (the Second Eye's S6 caution).
   - She gives reasons: not a chart, and «Belum mengerjakan» never a band. So she may be right, but rule it as a choice, not a default.
   - **One option:** rule that she draws it as Progress «Population» in the correction round, so you see it before APPLICATION READY.

**Also worth knowing before you rule JQ2:**
- **(a)** moves a built act, «Keluar dari semua perangkat», into the account menu. That is screen work in a slice.
- **(b)** needs a new journey, J2b, which she may not add without your word.

## 2. How to walk

- **Where:**
  - the Design System page, https://claude.ai/artifact/153KwNRJkTETDKAZSoorS1;
  - or the offline HTML she attached.
  
  Open «Composed journeys». Each journey has three width buttons (1280, 1024 and 390 px), and «Open alone in a new tab». «Mark new words» outlines every word not yet in the copy table. The grey review bar is English and is not PINTAR.
- **The question for this walk:** «Is this the design grammar we want multiplied throughout PINTAR?»
  - It is not batch 7's question, «Can a normal human use PINTAR without me?».
- **Still owed: a real screen-reader pass.** Her check was a review of the accessibility tree.
  - Use NVDA on Windows, or TalkBack on Android, in your walk if you can.
  - Otherwise rule that it moves to the application pass.

## 3. Your rulings

Fill in the last column. The «Daisy recommends» column is hers, condensed; her full wording is in `11-validation.md` §1, §3 and §4.

**The journeys**

| | Question | Daisy recommends | Your ruling |
|---|---|---|---|
| JQ1 | J1: the school publishes, then a teacher makes the chapter available («Siapkan» → «Sediakan») | Confirm. Correct J1's definition and F5 | |
| JQ2 | J2's dialog: (a) on «Keluar dari semua perangkat», moved into the account menu; or (b) kept in-page, with the dialog validated on the school admin's «Kartu hilang atau rusak» (needs a J2b). Also: one table with a state filter in place of the three lists? | (a), and the table | |
| JQ3 | An educator's own learning stays in the staff shell | Confirm | |
| JQ5 | J5 on «Siapkan»'s window, dates only | Confirm. Correct F3 | |
| JQ6 | J6 with an evaluator | Confirm. Studio's preview wearing the band is a later question | |
| JQ7 | A hairline between «Mengajar» and «Belajar» in the rail, at 1024–1279 px (touches question 11) | Yes, with no labels and the order unchanged | |

**The grammar gaps**

| | Question | Daisy recommends | Your ruling |
|---|---|---|---|
| GQ1 | CR-81: the class's population beside its bands | One line of three counts above the bands, the bands headed by their base, a «Population» kind in Progress (see §1, point 2) | |
| GQ2 | CR-77: where a school admin who referred a case reads its outcome | On Studio's integrity review, with named steps; no new navigation | |
| GQ3 | CR-22: an email reference card in the design system | Yes, reference only; D-079 stays the standard | |
| GQ4 | CR-07: a file field component | Yes, one small component | |
| GQ5 | CR-05 and CR-13: an act that needs a reason. A form page, or the dialog? | A form page; the dialog stays a short question | |

**The findings** (her proposed corrections are in `11-validation.md` §1)

| | Finding | Proposed correction | Your ruling |
|---|---|---|---|
| F2 | The Table specimens offer «Pindahkan ke kelas lain», «Keluarkan dari kelas» and «Kirim pengingat» | «Lihat bukti» and «Minta membaca lagi» only | |
| F3 | «Uji Cepat dibuka» with a date, in three specimens | The «Siapkan» window for dates; minutes for an Uji Cepat | |
| F4 | The Lock and Idle specimens predate Gate 6 | The built words; a staff lock names its owner, a class card's names no one | |
| F5 | A teacher publishing, in four specimens, the README and J1's definition | Publishing stays the school's; a teacher's act is «Siapkan materi» → «Sediakan» | |
| F7 | J2 at 390 px: each state is cut at the table's edge | Under 640 px a badge may wrap to two lines | |
| F8 | J3 at 1024 px: «Mengajar» and «Belajar» merge in the rail | JQ7 | |
| F9 | J6: the page title inside the room does not say MODE PERAGAAN | The title starts «MODE PERAGAAN ·» | |
| F10 | J1 at 390 px: Studio's last two tabs are hidden, with no sign that more follow | The next tab shows cut at the edge, and the current tab stays in view | |
| F11 | The Confirmation rule vs the product's review steps | Confirmation is a step after the act; a review before the act is a Panel | |
| F12 | «A learner is never named» vs D-020's first-name greeting | Never named in the bar; greeted by first name on Belajar and the home page only | |
| F13 | The top bar's «Keluar» is 36 px | 44 px | |
| F14 | «A verb and its object» vs the copy table's bare verbs | A bare verb only where the heading names the object | |
| F15 | The Table specimen's count is not announced | `aria-live="polite"` on the count | |
| C1 | «Ya, keluar dari semua» | «Keluar dari semua» | |
| C2 | «Siswa» and «menugaskan» in the publishing copy | «murid» and «menyediakan» (two sentences) | |

**The copy owed** (her proposed final words are in `11-validation.md` §4; the slices apply them)

| | Proposal | Your ruling |
|---|---|---|
| CR-50 | Five problem sentences, and a «Miskonsepsi» sheet in the template with its line in «Cara mengisi» | |
| CR-13 | Three of the six texts reworded (see §1, point 1) | |
| CR-76 | The two waiting texts, and the state word «Menunggu keputusan» | |
| CR-81 | «belum mengerjakan» shortened; the bands' heading «Hasil {n} murid yang sudah mengerjakan» | |

**Already corrected at source while she composed** (check them as you walk; no ruling needed unless you disagree):
- the breadcrumb's «/» is no longer read aloud;
- the main column holds 390 px;
- the dialog's actions stack under 640 px;
- the skip link stays hidden until focused.

## 4. The stripe (`11-validation.md` §2)

**Where:** «Components» → «Data» → «Table rows» → «Open alone in a new tab» → F11.

**On each of three displays:**
- an ordinary school computer;
- a poor display;
- a projector, seen from the back row.

**The test:** follow row 17 from the name to the last column without a finger. Then check that the hovered and the selected row still read apart from the stripe.

**The rule:**
- **A stands** if row 17 can be followed on all three displays.
- **A moves to A+** only if A demonstrably fails and A+ passes on that display.

The record table is in §2, empty, for you.

## 5. Then

1. Daisy corrects each ruled finding at source, re-runs her checks and republishes.
2. With the stripe decided, she freezes **APPLICATION READY**.
3. The coordinator re-forecasts CI from the slices then known (D-122(8)), before S1.
