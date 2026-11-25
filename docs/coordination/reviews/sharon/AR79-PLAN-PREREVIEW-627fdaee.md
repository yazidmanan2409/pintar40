# AR-79 plan pre-review (Sharon, read-only, 2026-11-25)

**Work:** `docs/post-4.1/AUDIT-79-AR79-PLAN.md` at `627fdaee` (claude/bob-41-master-plan). Nothing is built. I compared the plan with my own records and with my messages to Bob.

**Verdict: FIT TO PROCEED after amendment.**
- One entry contradicts a ruling already applied (A1).
- One set of conditions is placed nowhere (A2).
- Several boundaries are shortened past what I set (B1–B9). Each batch's verification will be held to the full text, so carry it now or cite the record.

## A · Must change before any batch request

**A1. L-75 contradicts CI-2.**
- AR-B's C-9 row says to say more once a password is proven.
- Under CI-2 (merged, 311 on staging), a locked account's password is rotated. A correct old password reads as any wrong one (L-78, «undetectable»), so no password can be proven for a closed account.
- I withdrew L-75's disclosure in favour of the neutral line once rotation was chosen.
- **The fix:** carry L-75 as **withdrawn: the neutral line only**. Keep C-9's principle for L-147 and any future path, and L-76's line as set (B9).
- Any AR-79 change that tells a closed account apart from a wrong password would reopen L-78.

**A2. My C-3 transfer conditions are carried nowhere.** L-38 sits in AR-E. Carry both conditions there, from `AUDIT79-C1-C3-C5-VIEW.md` §C-3:
1. **One helper** for the closed-source rule, used by both the transfer row's read and `transfer_execute`.
2. **A boolean only** to the receiving school («tidak dapat dilaksanakan: pendaftaran asal sudah ditutup»), **never why** the source closed. The reason belongs to the sending school's record.

## B · Carried, but not as set (state these in full, or cite the record)

**B1. L-112** (from `AUDIT79-L112.md`). The plan omits:
- (2) the warning and the lock screen never count as activity. Only «Masih di sini», a pointerdown or key, counts;
- the media rule: no looping or autoplay keeps a session alive, or media counts only while a person interacted within the window;
- `pointermove` only with movementX or movementY ≠ 0;
- `scroll` dropped, or counted only within about 1 s of a wheel, touch or key event;
- red-first tests in a real browser:
  - the tour open with no input locks at about 300 s;
  - `scrollBy`, `scrollIntoView`, `focus` and each layout change count as nothing;
  - a real wheel or key counts;
- the gate: fixed before any shared-computer use, and **before the pilot if the pilot uses shared machines**.

**B2. L-131 / L-142.** The plan omits:
- a PIN is never in a URL, never stored in plaintext, and never re-shown on reload or Back. It stays out of history state, and the server can't return it a second time;
- if a reload does re-show PINs, that is a separate, higher finding;
- the test covers **every** `/api` response carrying a PIN, code, token or secret;
- the static guard is specific: no route on the secret-bearing list calls `NextResponse.json` directly.

**B3. L-134.** Add:
- the test covers the teacher's reads (**screen and RPC**) for an overridden sitting, which carry no reason, reviewer or override record. Only the counts and the «not countable» state;
- who may know why: the integrity reviewer and those the referral process names. The learner is told by that process, never through the teacher's screen.

**B4. L-126.** Add:
- the code is written in the same transaction as the refusal;
- it is a closed list (e.g. ALLOWANCE_EXHAUSTED, PLATFORM_CEILING, NOT_ENTITLED, REFUSED_PERSONAL_DATA), with no free text and no request content;
- a CHECK means a terminal row can't have an empty `hasil`;
- the test: each refusal path leaves exactly its code.

**B5. L-127.** The plan's line is a summary. Carry the rule:
1. **The same NIS in the same school** is the same person, refused as a duplicate. A different NIS means different people, never «kembar».
2. **No NIS:**
   - the same name and birth date is a *possible* duplicate;
   - the same name with neither NIS nor birth date is a possible duplicate too, with a per-pair admin choice («Dua orang berbeda»), audited, and «Catat» held until every pair is chosen;
   - the same name with different birth dates means different people.
3. **NIS is a per-school attribute:**
   - unique within the institution;
   - shown only to that school's intake and admin staff;
   - **never** on the certificate, the public check, other learners' views or exports outside the school;
   - **never** a sign-in, and never matched across schools.
4. Never auto-merge, never auto-split. «Hapus baris» removes only the import row, and a merge is a separate, audited admin act.

**B6. L-151** (from `J8-L151-L149-ACCESS.md`). The plan carries only point 3 and the output-encoding principle. Add:
- (2) **refuse control, bidi and zero-width characters at storage:** a `display_name` CHECK plus an intake row error, with a step 0 count first. This is the security-relevant part, against a printed name being spoofed;
- (4) any future CSV or spreadsheet export neutralises leading `= + - @`, TAB and CR, and quotes per RFC 4180;
- a new non-React renderer states its encoding and is tested with the row.

**B7. L-154 / L-155** (from `J12-L155-STAFF-CARD.md`). Add:
- the only exception is an **audited reclassification** to learner, with a reason;
- the DB trigger `accounts_card_is_learners` is the boundary and keeps CARD_FOR_STAFF;
- the counts («murid tanpa kelas» and the rest) read the same helper;
- the reverse direction (`role_assignments_card_holds_no_role`) is unchanged;
- a lapsed role keeps email sign-in with no capability and never makes a person card-eligible;
- the tests, including a PLANT that reverts to `not memegang_peran_staf`;
- the production step 0 through the readiness process, with any hit going to the owner.

**B8. AR-E, L-124 / L-143.** The plan carries the binding in one line. Add:
- the mark stores the **check run id and the revision or content hash**;
- the DB refuses the mark when there is no completed check for the current revision or an open mandatory finding;
- the approval screen and RPC never treat VALIDATED as "checked": approval runs or reads a check of the current revision;
- **the HIGH test:** the approve and publish paths each re-run the check and refuse with an open ERROR, whatever the mark says;
- the red-first set:
  - a mark before any check is refused;
  - a mark after a clean check is accepted;
  - an edit after the mark leaves it stale and refuses approval;
  - a mark with a pending draft is refused, and is accepted once the draft is decided;
  - a draft added after the mark makes it stale;
- the severity contingency: HIGH if any approve or publish path skips the re-check.

**B9. L-76** (in C-9's row). The line is shown on **every** PIN-recovery refusal, never conditioned on whether a reset happened, with the response and its timing otherwise unchanged.

## C · Checked and carried as set
- **AR-C, C-1:**
  - id not values;
  - own assignment;
  - drop and create, with the grant and registry asserted;
  - red-first per consumer, with the pinned case;
  - never call outcome, map or review with the open id;
  - the previous attempt labelled.

  Add for completeness:
  - `my_cycle_state` **calls** the helper rather than restating it;
  - every page reads the id through `session_outcome`/`reading_map` under `session_is_mine`, so R-h counts-only is inherited;
  - only `session_answers` reads an open sitting.
- **AR-C, C-5:** carried. Two clarifications:
  - KUAT is dropped **in that view only**, a presentation choice with no new analytics;
  - neither block is computed from the other's answers.
- **AR-E, L-152:** carried as I set it (the dynamic plant removing the lock; the true refusal).
- **§3 exclusions:**
  - L-26–L-30 phase-bound: no objection.
  - L-08, L-11 and L-12 walked with fixtures, a finding opening a row: no objection.
  - **L-35 to 4.5: correct**, but carry my two 4.5 fixes so they aren't lost:
    - (a) acceptance refuses a closed source by the same name, before AUTHORIZED;
    - (b) a transfer whose source closed becomes EXPIRED or CANCELLED with its cause, not left dangling;
    - plus the UX note: show the receiving admin the sender's latest period and outcome.

    PR-3 rides with it.

## D · Attribution
- **L-99 (C-11)** is listed under "Sharon's binding condition", but I have no record of setting a condition on L-99. Either point me to it, or attribute it to its author. I'll review it in AR-B's pre-build either way.

Could reasonably have been anticipated: yes, for A1 especially. The plan was drafted from the findings list, not from the rulings that later changed them.

---

## Addendum: amendments checked at 88ee3db8 (2026-11-25 ~01:08Z)

I spot-checked every amendment in the plan text. A1, A2, B1–B9, C and D are carried, and the status block makes my records the binding text wherever the plan differs (line 4). The §5 lesson is added: every batch request re-reads the rulings since its finding was recorded.

**Verdict: the AR-79 plan is FIT TO PROCEED.** Each batch still needs the owner's own request, and gets my own pre-build review wherever it touches a DB rule, an RPC contract or a confidentiality boundary.
