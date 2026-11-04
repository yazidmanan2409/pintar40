# D1 · Implementation checklist and test plan (prepared; NOT authorised) · 4 Nov 2026

**Status:** prepared for the owner's implementation gate (brief §8, step 7). **This document authorises no code.**

**Inputs:**
- Daisy's D1 step 2 composition: `ux-1/daisy-experience` at `40384fac`, `docs/coordination/ux/completion-4.0/D1/STEP-2.md`. Design accepted by the owner, 4 Nov; its acceptance checklist is §9.
- D-164 (the step 1 ruling and the role-order fix, `9b52b51`).

**Unchanged by this plan:**
- the identity-email data contract (`DataEmailKode`, `DataEmailKartu`, `DataEmailPasswordDiubah`, the security notice's data);
- `my_identity_card`, and every migration (none is planned);
- staff-only eligibility, permissions, the send path and the send status (D-160(d)).

## 1. Before coding: what must be settled

| # | Item | Why it blocks the build | Who |
|---|---|---|---|
| P1 | **Daisy's one-line confirmation:** the card block takes its lines from `susunKartu(…).baris`, so several roles at one school read «Guru · Kepala departemen» with the school beneath, as the Digital Card does | Her drawing repeats «Peran · Sekolah» on every line; the build follows the card | Daisy |
| P2 | **The card block's own wordmark slot until F-11.** Her checklist says the card block has **no `<img>`**. Her §5 says today's logo stays in the slot until F-11 (D-160(a)), and that logo is an image. Both cannot hold. Options: (a) today's logo as an image in the card slot (the «no `<img>`» line then reads «no image but the logo»); (b) the card slot left empty until F-11; (c) the card slot omitted from the email block until the master exists | Contradiction in the accepted checklist | Daisy proposes; the owner rules only if D-160(a) is affected |
| P3 | **The header slot's size with today's logo.** The slot is 120 × 40 px; today's email logo is 104 × 58 (`BERKAS_LOGO`, pinned by DAISY-19-EMAIL-02 at 208 × 116). Sized by height, it draws at about 72 × 40. Is that the intended interim, or does the slot keep 104 × 58 until F-11? | The logo's geometry is a pinned test | Daisy |
| P4 | **The card block's border `#D9D6CE` has no token.** DAISY-19-EMAIL-01 allows exactly one colour without a token (the code box's border). The guard is **not** widened; the border takes a token (`--line` / `--line-strong`, as the frame's hairline does) or Daisy names the token | A guard would go red | Daisy |
| P5 | **The context line's wording** («Akun PINTAR Anda di …»): with Dr Gladys (a PINTAR ID is the person's own, not a school's) | Not a build blocker: the line is built under its key (`email.bingkai.konteks`) with the drawn words, and final terminology acceptance waits on her | Dr Gladys |
| P6 | **The manual protocol's send path and inboxes.** HTML email renders differently in mail clients than in a browser, so the real-client check is required, not optional. Locally, email goes only to the mail sink. Reaching a real inbox needs a configured sender (staging's Email uji, or a local SMTP to a test account), which is a staging or credentials action. **The inboxes are dedicated synthetic test accounts** (owner, 4 Nov): never Dr Gladys's account, and never a real school, person or identity | Not authorised by any current ruling | Owner, at the time of the manual run |
| P7 | **The owner's approval** of the design and of this test plan | Brief §8, step 7 | Owner |

## 2. Automated tests: written red first, then the build makes them green

All run in the **static** runner, rendering the real templates (`src/components/email/identitas.ts`, `keamanan.ts`) through the real frame (`bingkai.ts`), as DAISY-19-EMAIL-01 and DAISY-20-EMAIL-01 do. File: `selftest/d1.test.ts`. «Red today» is the expected result against the current code.

| ID | Daisy §9 line | What the test asserts | Red today because |
|---|---|---|---|
| D1E-K01 | One shell | every product email is one `bingkaiEmail` call; no template draws its own frame (source and rendered) | — (guard; green today, kept) |
| D1E-K02 | Reason under the heading | in all eight specimens, the first text after the `<h1>` is that email's own `email.*.alasan`; the footer does not repeat it | the reason is in the footer only |
| D1E-K03 | Context line present / absent | the card email (one place; two places) shows `.pin-konteks`; activation, resend, recovery, password changed and both security notices show **no** context element and **no substitute text** | no context line exists |
| D1E-K04 | Context line's form | the line names every place, alphabetically, joined by «, » and «dan»; it contains no role name | as K03 |
| D1E-K05 | Alphabetical roles and colour | Dekan + Guru + Kepala departemen renders «Dekan», «Guru», «Kepala departemen» in the card block; the band is `#515E83` (Dekan, `--kartu-dekan`); the order equals `susunKartu`'s for every permutation (extends B6K-URUTAN-02 to the block) | no card block |
| D1E-K06 | No image card, no back, no QR | the card block is a table, with no QR, no back and no `<img>` (subject to P2) | no card block |
| D1E-K07 | Slot geometry | the header slot and the card slot have the measured sizes (subject to P3); **the placeholder label never appears in any sent email** (it is design-time only) | no slots |
| D1E-K08 | Gold line, warm white | the card's top edge is 3 px `#C09C4F` (`--kartu-emas`) in light and dark; the card is `#FBFAF7` (`--surface-0`) in light | the card is `#FFFFFF`, no gold |
| D1E-K09 | 320 px | rendered at 320 px: no sideways scroll; no text under 13 px; every button at least 44 px; the reason line within the first 900 px | the reason is below the fold |
| D1E-K10 | Plain text complete | heading, reason, context line where present, every block (the card as name, ID, role lines), the action's URL, the footer; no internal word; no vague expiry | the reason's place and the card lines change |
| D1E-K11 | Real duration | the duration comes from `berlakuMenit` (planted 7 and 60) | — (guard; green today, kept) |
| D1E-K12 | AA contrast | every new text pair in light and dark: the reason, the context line, the band text on each of the five families (≥ 4.5:1) | new pairs |
| D1E-K13 | Images blocked | with images removed and both slots removed, each email still has «PINTAR» in the heading or reason, «PT ZAYD PINTAR SELALU» in the footer, a reason line, and a heading with its code or action | no reason line under the heading |

**Added by engineering** (not in Daisy's list; from the rulings):

| ID | What it asserts | Authority |
|---|---|---|
| D1E-K14 | the card block's lines are `susunKartu(…).baris`; `identitas.ts` lays out no role lines of its own | D-164, P1 |
| D1E-K15 | the data contract is unchanged: the four email data types have the same fields as at `9b52b51`; the branch's diff adds no migration | D-164(b), owner's D1 ruling (5) |
| D1E-K16 | colours: every colour the frame and the card block use is a token, except the one already allowed (the code box's border) | DAISY-19-EMAIL-01, unwidened; P4 |

## 3. Existing tests: restated, never weakened

| Test | Today | Restated as | Why it is not weaker |
|---|---|---|---|
| DAISY-19-EMAIL-01, «an email's own reason does not reach the footer» (`selftest/email.test.ts:206`) | the reason is somewhere in the HTML (it is in the footer) | the reason is **directly under the `<h1>`** and **not** in the footer | it pins the position, which today's check does not |
| DAISY-19-EMAIL-01, the token rule | one untokened colour | unchanged | — |
| DAISY-19-EMAIL-02, the logo's file and size | 104 × 58, 208 × 116 PNG | unchanged unless P3 changes the interim size; then restated to the ruled size | the file and its 2× check stay |
| DAISY-20-EMAIL-01 (4), the card email's facts | detail rows | the same facts (name, ID 4 + 4, each context, Akun saya, «not a secret»), now read from the card block | every fact is still asserted |
| B6K-URUTAN-02 | the detail rows' order | also the card block's order (K05) | adds a surface |

Every restated test is shown red against a planted regression before it is accepted (the batch's rule).

## 4. Rendered checks (browser)

- `audit/d1-email.mjs`, a new step of CI's journeys (job A). It renders the eight specimens from the real templates at 600 and 320 px, light and dark (`prefers-color-scheme`), and with images blocked.
- It checks structure, not pixels: K09 and K13 in a real browser, and the keyboard order (the action, its fallback, the footer's links), against Daisy's `jalan/<email>.txt`.
- Screenshots go to the run's artifacts and to `docs/completion-4.0/batch-6/evidence/D1/`.

## 5. The manual protocol (after the automated checks are green)

Daisy's four [manual] lines, run as the brief §8 sets out and recorded per email and per client (date, device, client, result, screenshot) in `docs/completion-4.0/batch-6/evidence/D1-manual/`:

1. **Client renders:** Gmail web, Gmail on a phone, Outlook desktop and Outlook on a phone; light and dark; once with images blocked.
2. **Images blocked:** every email fully understandable without the wordmark or the card artwork (the owner's addendum).
3. **Recognition, provisional:** who, why and what within 5 seconds at 320 px, in at least 4 of 5 attempts per email, each attempt a different reader new to that email. **It cannot establish brand recognition.**
4. **Recognition, final:** after F-11, with the approved artwork.

It needs P6 (a send path to real inboxes) and the owner's go at that time.
- **Accounts (owner, 4 Nov):** dedicated synthetic test accounts in Gmail and Outlook, created for this check. **Never Dr Gladys's account, and never a real school's or person's identity.** The emails carry synthetic people and synthetic schools only.
- **No credentials in the evidence:** the test accounts' passwords and the sender's credentials are never committed or logged; screenshots are cropped to the email.
- **Where it counts:** the results are part of **Batch 6's physical and cross-client acceptance evidence**, alongside F-11's physical print proofs (A4, CR80, the QR on two phones). D1 is not closed, and Batch 6's email item is not accepted, until this protocol has passed.

## 6. Order of work, once authorised

1. P1–P4 settled; P7 given.
2. Write K02–K10, K12–K16 and the restated tests; show each red on the current code; commit the red state.
3. Build the change as Daisy's «D1:» diff of `bingkai.ts`, plus the card block from `susunKartu`.
4. Green: the D1 tests, the restated tests, the whole static suite, typecheck and lint.
5. The rendered walk (§4) locally; then `ci` and the journeys on the branch.
6. Add the evidence to the Batch 6 report.
7. The manual protocol (§5), when P6 is authorised.

**Boundaries:** development branch only; no merge, staging migration, production change or Batch 6 promotion.
