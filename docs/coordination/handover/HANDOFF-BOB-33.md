# Bob → coordinator: BOB-33 (a quick assessment is dated in Jakarta time, in numbers)

**SHA:** `646a29c`, on top of BOB-32 (`3f6cd69`, ci #227). **Manifest:** v112. **No CI run of my own.** As ruled, it goes into one integration run with DAISY-27.

## CHANGED

**The defect.** `launch_quick_assessment` titled a new Uji Cepat `'Uji Cepat — ' || to_char(now(), 'DD Mon YYYY HH24:MI')`.
- The month was an English abbreviation.
- The time was in the database session's time zone (UTC).
- So a launch at 13:29 in Jakarta read «Uji Cepat — 29 Sep 2026 06:29», and a launch before 07:00 WIB carried the previous day's date.

**Migration `20261020100000_a_quick_assessment_is_dated_in_jakarta.sql`** (the 126th):
- **The helper.** `quick_assessment_label(p_at timestamptz)` is `to_char(p_at at time zone 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI')`, using the Jakarta clock the school year already uses (`20261012100000`).
  - A launch at 13:08 WIB reads «Uji Cepat — 2026-09-29 13:08», which is the same in both languages.
  - `language sql stable`, with a pinned search path.
  - **No execute for `public`, `anon` or `authenticated`.** `launch_quick_assessment`, running as its owner, is the only caller.
- **The function.** `launch_quick_assessment` is 0090's body (`20260922100000`, lines 45–190), re-emitted **verbatim except for the one label line**, which now reads `v_label := 'Uji Cepat — ' || public.quick_assessment_label(now());`, with a comment on why.
  - `diff` of the two bodies shows only that line.
  - Every refusal sentence is carried word for word. BOB32-K01 now reads the refusals from this migration and still finds all 12.
  - The collision loop and its `(2)`, the release resolution, the INV-13 refusal, the single-owner boundary and the audit line are unchanged.
- **The grants** are restated (ADR-0021; F06-S01 passes): `launch_quick_assessment` is revoked from `public` and `anon` and granted to `authenticated`, as 0049 and 0090 left it.
- **Stored titles are not rewritten.** Instruments launched before this read «29 Sep 2026 06:08», which is 0090's rule.
- **The terminal block checks:**
  - the 23:30 UTC label;
  - the new label call in the function, with no month pattern left;
  - 11 of 0090's 12 refusal sentences (the EXAM-tier guard is not in its list; BOB32-K01 reads all 12);
  - both boundaries;
  - the helper's and the function's grants.

## PROOF

**F04-T04c (db, `selftest/db/fable04.sql`), right after F04-T04, whose two same-minute launches it reads.**
- **What it checks:**
  - the two titles, judged against Jakarta time **computed in the test**, not by the helper: `'Uji Cepat — ' || to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI')`, with the second as the same label plus ` (2)`;
  - no English month name in the title;
  - `quick_assessment_label('2026-09-29 23:30:00+00')` = `2026-09-30 06:30`, the next day in Jakarta;
  - every month of the year gives only the numeric date and time;
  - neither `anon` nor `authenticated` can call the helper.
- **Red on today's function** (a database without the migration): `a launch now is titled «Uji Cepat — 29 Sep 2026 06:29», expected «Uji Cepat — 2026-09-29 13:29» (Jakarta time, numeric date); the title carries an English month name; the second launch in the minute is not the same label with (2); no label for a given moment (quick_assessment_label): function public.quick_assessment_label(timestamp with time zone) does not exist`.
- **Green with it.** F04-T04 stays green on both.

**Restated for the changed requirement:** UX1-BRAND-02 and UX1-TUR-ORANG-01, the migration tripwires, move 125 → 126, with the reason beside them. There is no table, column or mark, and no tour RPC.

**Local, every database with an `en-US` ICU collation, on `646a29c`:**
- **Full suite, fresh database, clean build:** LOCAL_FULL
- **Plants:** LOCAL_PLANTS
- **Shared red cases:** LOCAL_SHARED

## CI
None of my own, as ruled: BOB-33 joins DAISY-27 in one integration run.

## CONTRACT
- The title of a newly launched Uji Cepat is now `Uji Cepat — YYYY-MM-DD HH24:MI`, in Jakarta time, or with ` (n)` for the n-th launch in a minute.
- There is no new client RPC.

## MIGRATIONS
`20261020100000` (additive: one internal function, one function redefined). Lane-only and unmerged.

## COPY
None. The label is data, in digits, the same in both languages.

## QUESTIONS
None.

## READY
Yes, for the integration run with DAISY-27.
