# PINTAR 4.0 · Closure batch 0: records and instruments (D-118 §11)

**6 October 2026.** Batch 0 of the closure register (`PINTAR-4.0-CLOSURE-REGISTER-2026-10-06.md` §2). It covers records and instruments only. **The application did not change.**

**Specimen:** «Sekolah Uji Penutupan B0» (`sekolah-uji-b0`) on staging. It was founded for this batch and walked GS-00 to GS-22. Dr Gladys's «Sekolah Demo PINTAR» was not touched.

## 1. What was closed

| CR | Item | Evidence | Result |
|---|---|---|---|
| CR-10 | The stale "the issuer copies the photo" note | JOURNEY-LOG annotated (item 47 supersedes it) | **Closed** |
| CR-26 | Activation order wording | Re-examined. The server and D-054(b) say username → password → PIN → name, and the inventory was right; the walk's "PIN first" note was wrong. G4 now asserts the observed order (run 37462648562: observed `username, password, pin, nama`) | **Closed** (records corrected) |
| CR-62 | The contract's step map; the J7 labels | `GOLDEN-SCHOOL-CONTRACT.md` §5 corrected; GS-22 row added; the laporan walk's J7 labels fixed | **Closed** |
| CR-60 | GS-00 inside every walk | Every Golden School workflow now runs GS-00 as a job of the same run, and the walk needs it. All five runs below include it, green | **Closed** |
| CR-61 | GS-16 by clicking | The four other students reach their tests by clicking (murid run 37465147297, M6) | **Closed** |
| CR-32 | GS-13 / GS-15 assertions | No sitting before the press (M3, M5); growth shown without rank or comparison (J6.11) (murid run 37465147297, 8/8) | **Closed** |
| CR-16 | A new learner after the chapter is given (GS-22) | N1 (laporan run 37466487118). Recorded on Pendataan, a card made on Aktivasi, signs in, finds the chapter, no sitting before the press, Pemetaan Awal FINALIZED, reaches the reading map | **Closed** |
| CR-17 | Staff on a shared computer | U2a and U2 (run 37466487118). The head of department answers «Komputer bersama». After 664 s idle, a fresh load goes to /terkunci (SHARED, locked in the record). Her PIN returns her to /pimpinan, unlocked | **Closed** |
| CR-20 | Security notices (J2.13) | R3 (run 37466487118). The owner's mailbox has «PINTAR ID dan PIN Anda dipakai untuk memulihkan akun», naming the PINTAR ID and never the PIN. The send log shows `admin:SENT, owner:SENT` | **Closed** |
| CR-64 | The CI efficiency gate (D-119) | S4 GREEN (D-121(e), run 37458146396) | **Closed** |

## 2. The runs

| Step | Run | Result |
|---|---|---|
| C1 found the school | 37462555196 | ✓ |
| GS-02 / GS-03 first administrator | 37462648562 | 6/6 |
| Admin setup and the chapter (first attempt) | 37463105684 | ✗ A3: the derived school code G00 was taken by another school; the walk now picks a free code (8255f5a) |
| Admin setup and the chapter | 37463817245 | ✓ |
| The students (GS-07 cards, GS-12 to GS-16) | 37465147297 | 8/8 |
| Reports, certificate, recovery, shared computer, public check, new learner (GS-17 to GS-22) | 37466487118 | **17 PASS, 1 FAIL (U1)** |

## 3. The one failure: U1, an instrument defect

**What U1 checks** (GS-20, J2.9 and J2.20, the class computer):
- the holder's lesson locks after 5 idle minutes;
- her PIN resumes it at the same page;
- «Bukan akun Anda?» signs her out;
- the next learner, Bunga, signs in on the same browser to her own session.

Every part was seen as specified (run 37466487118):
- the lock at 304 s, with no name shown and no question about the computer;
- the PIN back to page 5/5;
- locked again at 303 s;
- «Keluar»;
- Bunga's new card → /belajar, and her session recorded as her own (`CARD:KELUAR`).

**Why it failed.** The step also expected Bunga's lesson to open **at its first page**. That held only while she had never read it. Batch 0's own CR-61 change makes every student read every lesson in the murid walk (M6). So her own saved place is the last page, 5/5, which is what she saw.

**The fix (2097663).** U1 now reads her furthest page for that lesson from `lesson_progress` and expects it. It also says when the holder's page is the same, because then the page alone cannot tell the two apart, and her own session is what shows it. This does not change what is required: J2.20 is "the next learner inherits nothing", and her own place is that.

**Not re-run here.** GS-22's N1 runs once per Golden School by design, so the laporan walk cannot be repeated on this school. U1 is re-proven by batch 6's fresh Golden School.

## 4. The allowance (D-121(d): 1,900 estimated billable minutes, a ceiling)

Every Actions run since D-121, read with `audit/ci/actions-spend.mjs`'s own classify/judge:

| Run | Estimate (min) |
|---|---|
| environment facts 37462540525 | 1 |
| C1 37462555196 | 2 |
| GS-02/03 37462648562 | 5 |
| admin, failed 37463105684 | 6 |
| admin 37463817245 | 12 |
| murid 37465147297 | 11 |
| laporan 37466487118 | 23 |
| **Batch 0** | **60** |

- **Remaining: 1,840 of 1,900.** No job waited for a runner (queue 3.6 min in total) and none was starved.
- The failed admin attempt (6) is waste the walk's code-picking fix removes.
- S4's measurement runs (37455602363 at 71, 37458146396 at 68) came before D-121's allowance and were QN7's measurement.

## 5. Batch 2 so far (proof on today's code; reported in full with batch 2)

| CR | Proof | Commit |
|---|---|---|
| CR-29 | F03-T11 proves the pause rule (doc 04 §2). It is red on three plants: allows_pause ignored, may_continue ignored on pause, and on resume | 1e0415f |
| CR-19 | F16-X01: a persona given a set-up, a PIN and a username is still refused on every PIN and PINTAR ID surface. It is red on eight plants, one per persona clause | a1dd46d |
| CR-45 | BOB07-K03 renders the real failure pages: the reference shown, the failure's words never. It is red on three plants | d530711, 2097663 |
| CR-18 | `audit/staging/kode-ulang.mjs`: the resend countdown, side by side for a real account and an unknown name. Proven locally against the built app: green today; red when the recovery screen stops holding the resend, and red when the route gives unknown names a longer wait. The staging run rides the batch 2 closure walk | 2097663, 8f3c140 |

These are tests only. The CI run for them is the batch's one CI on its final head.
