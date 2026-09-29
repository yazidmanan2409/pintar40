# Bob → coordinator: BOB-32 (Uji Cepat says why a launch was refused; UX-03's server half)

**Head:** `1ecb995`, with `main` `cfd5342` (DAISY-13 GATE PASS) merged in as `6fa0162`. **Code:** `c23a07c`. **Manifest:** v111. **One run:** ci #227.
**Also on the lane:** `fc78f52`, the revert of BOB-30's `8bb741f` (ruling A: CLOSED, not needed). Before BOB-32, the lane's diff against `main` was empty.

## CHANGED

**The codes** (`src/lib/ujicepat-kontrak.ts`). `sediakanUjiCepat` (`src/app/mengajar/actions.ts`) now reads the refusal of `launch_quick_assessment` with `kodeUjiCepat` and passes it on:

| code | the function's refusal |
|---|---|
| `QUICK_BANK_TOO_SMALL` | "this module has N drawable question(s) at the T tier; a K question quick assessment cannot be filled" |
| `QUICK_COUNT_OUT_OF_RANGE` | "a quick assessment carries between 3 and 20 questions, not N" |
| `QUICK_MINUTES_OUT_OF_RANGE` | "a quick assessment runs between 5 and 60 minutes, not N" |
| `QUICK_NOT_ALLOWED` | no `CAN_QUICK_ASSESSMENT` over the class; "that module belongs to another institution (INV-13)"; any 42501 |
| `QUICK_NOT_FOUND` | an unknown class or chapter; a node that is not a class or cohort |
| `QUICK_FAILED` | anything else: no person in the session, the mode policy, the EXAM-tier guard, 200 launches in one minute, the unexpected |

**The address.**
- A refusal with a named cause goes to `?cepat=gagal&kode=<code>`.
- **Only `QUICK_FAILED`** also carries `&ref=<ABC123>` (`rujukan()`). The server logs it with the database's code and message (`[uji-cepat REF] launch_quick_assessment failed …`), as the Terbit step does.
- `bacaGagalUjiCepat(q)` reads the refusal back for the page and drops a code it doesn't know or a malformed reference.

**How the refusals are read.** The function raises sentences (SQLSTATE P0001, no detail), so each is matched by its fixed opening, anchored, the same way `galat-kontrak.ts` reads the content trigger's refusals. No migration.

**The ticket's four causes:**
- too few questions → `QUICK_BANK_TOO_SMALL`;
- count out of range → `QUICK_COUNT_OUT_OF_RANGE`, plus its twin for the time, `QUICK_MINUTES_OUT_OF_RANGE`;
- not permitted → `QUICK_NOT_ALLOWED`;
- **already running: there is no such refusal.** `launch_quick_assessment` lets several Uji Cepat run in one class, so there is nothing to map. DAISY-26 already moved «Sudah ada…» to the running stage.

## PROOF

**BOB32-K01 (static): red before, green after.**
- **How it tests.** It reads every `raise exception` sentence out of the migration that defines the function (`20260922100000_…`), 12 of them. It fills each `%` as the function does and drives each through `kodeUjiCepat` to its expected code. It also checks that the page's reader drops forged input, and that the action passes the code and gives a reference only to `QUICK_FAILED`.
- **Red on today's code:** `there are no Uji Cepat refusal codes: src/lib/ujicepat-kontrak.ts has no kodeUjiCepat; "unknown class 7…" is read as QUICK_FAILED, expected QUICK_NOT_FOUND; … "a quick assessment carries between 3 and 20 questions, not 7…" is read as QUICK_FAILED, expected QUICK_COUNT_OUT_OF_RANGE; … "this module has 2 drawable question(s) at the PRACTICE tier; a 5 quest…" is read as QUICK_FAILED, expected QUICK_BANK_TOO_SMALL; …`.
- **A reworded refusal fails it.** Changing «carries between 3 and 20» to «holds 3 to 20» in the migration (temporarily) turns it red: `launch_quick_assessment raises a refusal this test does not know …; the function no longer raises the refusal QUICK_COUNT_OUT_OF_RANGE was matched to … reworded?`.
- **The tier is filled correctly.** The live `mode_policy` tier for QUICK is `TEST` (one of `{PRACTICE,TEST,EXAM}`), which the bank-sentence pattern matches.

**BOB23-K01, text only (the BOB-30 ruling).** No assertion changed. Three texts now state the true claim:
- the header comment;
- its one failure message;
- its manifest `proves` text.

The true claim: the save writes only a changed session **as a guard**; the redraw was the proxy's re-send, which BOB23-K02's throttle fixed.

## CI
[ci #227](https://github.com/yazidmanan2409/pintar40/actions/runs/36532032234) on `1ecb995`, dispatched once and not waited on.
- **Local, before dispatch, every database with an `en-US` ICU collation, on `c23a07c`:**
  - **Full suite, fresh database, clean build:** 377 passed, 0 failed, 31 justified skips. BOB32-K01, BOB23-K01 and F01-R07 passed. One unjustified skip: UX1-PIMPINAN-AKSES-01 (network), as before this change.
  - **Plants:** 100 of 100 proved their gate on a copy taken straight after the seeds.
  - **Shared red cases:** all 16 gates exited 0 on one shared stack. The schema digest stayed the same, and every recheck was 246 of 246.

## CONTRACT
- New: `?cepat=gagal&kode=<KodeUjiCepat>[&ref=…]` from `sediakanUjiCepat`, read by `bacaGagalUjiCepat`.
- Unchanged: `?cepat=ok` and the pre-database input check (to `/uji-cepat` with no result).

## MIGRATIONS
None.

## COPY
None. **For Daisy:** the page (`src/app/mengajar/[kelas]/uji-cepat/page.tsx`) still shows its one `mengajar.cepat.gagal` for every refusal. Wiring it is her half:
- read `bacaGagalUjiCepat(q)`;
- show the code's sentence;
- for `QUICK_FAILED`, the general line with the reference.

## QUESTIONS
*(Both answered 29 Sep: the title date is **BOB-33**, next; the page wiring is Daisy's **DAISY-27**, importing `KODE_UJI_CEPAT` and `bacaGagalUjiCepat` from `src/lib/ujicepat-kontrak.ts`, which has no `server-only` import, as `kartu-kontrak.ts`.)*
1. **The optional title date (not done).** The Uji Cepat title is `'Uji Cepat — ' || to_char(now(), 'DD Mon YYYY HH24:MI')`. The month is an English abbreviation. The time is in the database session's time zone, which is UTC by default on Supabase, so a teacher in WIB who launches at 07:15 would see `00:15`. Fixing either means redefining `launch_quick_assessment` in a new migration. I kept it out of this small ticket; shall I take it as its own?
2. **The page half:** is it Daisy's, as the ticket reads?

## READY
Yes, once ci #227 on `1ecb995` is green.
