# Defects found in my 4.1 result reviews: could they reasonably have been anticipated? (Daisy, 13 Nov 2026)

> **What holds now:**
> - Every defect found in my result reviews since B1's corrected candidate is marked here, with which of the five questions would have caught it (`TEAM-INSTRUCTIONS.md`, «Before any correction is built», at `57161d585dc4bf9d09e04dbb8c3e3d03cabc339d`).
> - **From now on, each of my reviews carries this marking in its own table.** This page is the running record across batches, for Bob's count at each close.
> - **Defects that predate the batch under review are listed, not counted** against it.
> - **Three of the counted defects were in my own wording**, and are marked as mine. I hold my lines to the same five questions.

**The five questions:**
1. What else reads or writes this state?
2. What is the opposite act, and the neighbouring one?
3. Which locks, in what order, and who else takes them?
4. How is "before" told from "after"?
5. Who runs each check, with what access, and where does it render?

## B2 (reviewed at `bfe949b11935763a8c8ed7b91f4adcdbcea93645`; closed on `546d9eb75abb53d41523750e7134cc83889d1089`)

| # | Defect | Whose | Anticipable? | Question | Why |
|---|---|---|---|---|---|
| B2-D1 | The completeness notice overflowed at 320 px, and its link was squeezed to zero width (`TINJAUAN-B2-bfe949b1.md` §3) | build | **Yes** | **5**, and 1 | It renders inside `.pin-banner`, whose grid places element children only. That is an existing component's contract (1), and a render at 320 with the notice present (5) shows it at once. The page checked it in source, not on screen |
| B2-D2 | B2-R-A1: a refusal for the working context said «… dari akun Anda» (raised by Bob) | build (engineer's draft) | **Yes** | **2** | The neighbouring acts tied to a working context all offer the chooser. Asking what they say would have given the right line |

**B2: 2 defects, both anticipable.**

## F1-R1b (reviewed at `97a40ebb0e52a2f0ba558418426f9fc5d71aca4b`) and L1-F4's wording (`ea3c4b6f1d10a2a01281f16e8cce893235bfbef2`)

| # | Defect | Whose | Anticipable? | Question | Why |
|---|---|---|---|---|---|
| R1B-D1 | English said «misconception» where every screen already says «misunderstanding» | **mine** (my I-6 lines) | **Yes** | **1** | What else names this concept on screen: a search of `hle.ts` for the existing English. I searched only after the engineer raised it |
| R1B-D2 | The teacher's marker showed on questions every learner answered correctly, where its sentence about answers said nothing | **mine** (I specified "any wrong option" for both places) | **Yes** | **5** | Where it renders: the teacher's view holds answers, Studio does not. The same rule did not fit both |
| R1B-D3 | The held step's message said «penjelasan» where Studio's field and line say «Alasan» | build (engineer's draft) | **Yes** | **1** | What else names this field: Studio's own label |
| L1F4-D1 | «Earned but not issued» was a full sentence for a narrow table cell | **mine** (my draft; I had asked to see the screen first) | **Yes** | **5** | Where it renders. I named the uncertainty but wrote the long form anyway |
| L1F4-D2 | The refused replacement said deletion was «atas permintaannya» | build (engineer's draft) | **Yes** | **2** | The neighbouring act: a learner's deletion is requested by the school with the family |
| L1F4-D3 | The summary «{n} sertifikat baru dapat diterbitkan» counted a certificate the row said would not be issued | build | **Yes** | **1** | What else reads this state: the summary above the table reads the same count |

**F1-R1b and L1-F4's wording: 6 defects, all anticipable; 3 of them mine.**

## My own verification error, recorded with the defects

| # | Error | Anticipable? | Question | Correction |
|---|---|---|---|---|
| V-1 | My F-1 review (`TINJAUAN-F1-4131d7a2.md` §3) said no learner screen tied to a sitting shows a rationale. The Uji Penguasaan result does | **Yes** | **1** | I listed screens from memory and the player's comment, not from a search of every reader of `session_review` and `rationale`. Corrected in place; Bob's brief had it right |

## Found during these reviews but older than the batch (listed, not counted)

| # | Finding | Would have been caught by |
|---|---|---|
| L-1 | Suspended sign-in answered 503 (4.0; found at B1) | 2 (the opposite act: a suspended account signing in) and 5 |
| S-1 | The open drawer was 8 px wider than the screen (4.0 shell) | 5 |
| X-1 | Two `<main id="isi">` on a refusal inside Studio | 1 (what else provides `<main>`: the layout) |
| X-2 | An old link to a moved assignment shows the generic error page | 2 (the neighbouring act: the assignment's move) |
| X-3 | An unknown correction id shows a refusal, not «not found» | 2 |
| N-1 | Konfigurasi's sub-pages show a shorter navigation than the index | 1 |

## How I apply it from here

- **Before I give a line:**
  - I search the existing strings for the concept and the field it names (1);
  - I ask where it renders and at what width (5);
  - I ask what the neighbouring act says (2).
- **At each result review:** a table like the ones above, in the review itself.
