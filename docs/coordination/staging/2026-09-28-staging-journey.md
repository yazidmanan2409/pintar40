# Staging journey for the 5 Oct internal test (D-050), 28 Sep

**Question (Yazid, 28 Sep, scope corrected by D-050):** does the whole learning journey work on real staging, through PINTAR's own screens: school and content set-up → lesson prepared → pre-test MCQ → publish → assign to the synthetic class → a synthetic student signs in through the real student flow → opens the assigned learning → completes the pre-test → progresses through the lesson → completes the post-test → sees the result or next state → the educator sees the corresponding evidence? And, separately, do the MCQ Question Bank workflows intended for this phase work? Video, audio and presentations are out of scope.

**Where:** https://staging.pintarselalu.com, in **Sekolah Uji Kinerja (sintetis)** only (D-046(c)), as its synthetic school admin and synthetic teacher, with synthetic students the admin records and activates on the way (approved 28 Sep). Content: SD 5 Matematika Bab 1 (6 lessons, 28 questions: 4 marked for the pre-test, 8 for the post-test).

**How:** `staging · learning journey (D-050)` (`.github/workflows/staging-journey.yml`, `audit/staging/journey.mjs`), dispatch only, from `main`. Every action is a click on PINTAR's own screens. Staging's database is only read, in read-only transactions, to confirm what the screens claim. Each student answers to a plan (how many right), so the result pages are checked against numbers known in advance.

**Results:** being written up from the staging runs (draft).

## Staging accounts: what exists for the testers today (read 28 Sep)

| | State on staging |
|---|---|
| People | Gladys (the one platform admin) and the synthetic staff and students of Sekolah Uji Kinerja. **No tester account exists yet.** |
| SD Zayd Pintar Selalu, SMA Zayd Pintar Selalu | No school code, no Bagian/Tingkat/Kelas, no staff, no students. SD Zayd holds one unpublished draft (SD 5 Bab 1, imported 24 Sep). |
| Creating staff | Only the platform admin can create a staff person (Aktivasi → "Orang baru di luar pendataan"; intake records students only). A person created that way has no relationship with a school yet, so their first role there is given by the platform admin too (D-049); after it, the school admin can give further roles. One form per person, then one grant per person. |
| Creating students | The school admin records them (Pendataan, a pasted list) and makes class cards (Aktivasi). The PIN is shown once; a lost card cannot be re-issued (ADM-08 is not built). |
| Staff sign-in | By email link, valid one hour, to be opened in the same device and browser. **Staging sends at most 2 sign-in emails per hour for the whole project** (`rate_limit_email_sent = 2`, read by the workflow's `limits` mode, run 36382909677); a second email to the same address waits 60 s (`smtp_max_frequency`). Students sign in with cards and send no email. |

## Tester readiness package

| Item | State |
|---|---|
| One-page tester brief in Bahasa Indonesia | Drafted: `docs/onboarding/PINTAR-Panduan-Penguji-5-Okt.md` (the D-050 sentence, sign-in, test data only, what to try by role, one problem per report, what to do when completely blocked). |
| Report form | The Google Form exists (Yazid, 27 Sep; `TESTER-REPORT-FORM.md`); not yet sent to the testers (D-045: sent when PINTAR is ready). |
| Accounts | Not provisioned (above). |
| UX Polish Register | `docs/coordination/ux/UX-POLISH-REGISTER.md`. |

