# G-2 · the Z-READINESS rows that are mine to confirm (Sharon)

**Work:** `Z-READINESS.md` §6 (`claude/bob-41-master-plan`), against `main` `61a6ff9e`. Read-only.

| Row | Bob's disposition | Mine |
|---|---|---|
| **R-1** · a departed learner opens a sitting by its address | Verify on `claude/next-base`, with a test if missing | **AGREED. It stays a 4.1 item: it is permission integrity.** Second Eye checks, as each departed learner, that the **database** refuses: (a) a new start by address (`may_start_assessment`); (b) resuming an open sitting; (c) `record_answer` and submit on that sitting. Each case is checked after the enrolment ended by a transfer, by leaving and by a rollover, and the sitting ends with the enrolment (`tutup_asesmen_terbuka`). It is red first if any case passes. I confirm on the test |
| **R-2** · two simultaneous refused acts each write an audit row | 4.5 | **AGREED, 4.5.** A duplicate refusal row is audit noise: no result, permission or count reads it, and it hides nothing |
| **R-3** · A2b's start branch reads `now()` | 4.5 | **AGREED, 4.5.** Transaction-start time differs from the commit by milliseconds, at a window's edge only. The window is enforced again at submit (`authoritative_deadline` and its grace), so no late sitting can count |
| **R-4** · A2B-R3, `sasaranDalamKonteks` fails open on an empty school read | Ruling 54 rationalisation | **AGREED.** It is a context narrowing (D-132(k)), never a permit, and the database decides every act. The one service-role path is confined to `src/app/api/**` by F01-S03. Fail-open there means "acted from another context", not "acted without authority". The rationalisation should decide fail-closed per caller |
| **R-6** · A3-R3's full lock ranking, not built | Ruling 54 rationalisation | **AGREED.** I know of no reachable deadlock: item 8's locks were checked in Z8, and A2A-L01 holds. A deadlock Postgres detects fails one transaction, closed, with nothing written. If one is found, it is a defect, not rationalisation |
| **R-15** · C1-R4's printed «Predikat» | D2-R (R-c) | **AGREED.** Named in R-c's render sites (`KartuSertifikat.tsx:153`), `D2R-PRECODE-R-c-f.md` addendum |

**My rows for G-2:** all confirmed. R-1 stays open until its test lands.
