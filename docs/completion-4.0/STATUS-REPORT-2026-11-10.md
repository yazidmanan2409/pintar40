# PINTAR 4.0: status report (10 Nov 2026, 06.30 WIB)

**Where the code is:**
- **`main` and staging:** `c4944fab` (P-7), migration **200**. Nothing has been promoted since 8 Nov.
- **The development branch** `claude/system-integrity-4.0`, at `0d3830ec`: migration **222**. That is 22 migrations and
  all the work in §2 beyond staging. **None of it is merged or deployed.**
- **The last verified application candidate** named by the owner: `7a2c1751`.
- **Production:** not touched in 4.0 (migration 111).

**Verification of the branch head:**
- **`1fcb5c95`** (everything before #96): CI green ([run 42714837376](https://github.com/yazidmanan2409/pintar40/actions/runs/42714837376)) and both journey jobs green ([run 42714841824](https://github.com/yazidmanan2409/pintar40/actions/runs/42714841824)) on that exact SHA. The last full clean suite, 992 / 0, was on `6dfab9d6`, one axe fix earlier.
- **`0d3830ec`** (#96 on top): targeted runs only. Every static test passes except three that depend on database state left by earlier runs on the local database (they passed in the 992 / 0 clean run). The kenaikan journey passes, and axe is clean on every kenaikan step and on Jejak audit. **This is not a final verification:** the clean suite, CI and journeys come on the final candidate.

> **Since 8 Nov, in one line:** the account and year lifecycle and the action-and-consequence gaps went from missing to
> built. Two independent reviews were run against them, and every finding was fixed with a test that failed first. What
> 4.0 still lacks is mostly not engineering: Daisy's copy review (#97), Sharon's addendum, one clean final
> candidate, then people's acceptance and the owner's release gates.

---

## 1 · What is done (on the branch, not yet on staging)

**The lifecycle, end to end:**

| Area | Done | Tests (each red first) |
|---|---|---|
| **A learner leaves and returns** (E3, E4) | «Akhiri pendaftaran» with a reason and a date; «Daftarkan kembali» as a correction (only while that school year runs) or a return into a chosen Kelas, under the Kelas's programme; open sittings closed truthfully | F37-E*, F38-H03–H05 |
| **The year ends** («Kenaikan kelas dan kelulusan») | every learner of a class decided by name (up, repeat, graduate, leave, transfer); one review; all or nothing; teachers never carried over; outcome read back from the data; evidence survives the year | KENAIKAN-*, F38-R01 |
| **An educator's roles change or end** (§11, E5) | «Ubah peran & tanggung jawab» with a review of what is gained, kept and lost; «Akhiri tugas di sekolah ini» with a category; decisions left waiting are warned of and recorded | F38-S01–S06, STAF-A01 |
| **Accounts** (§5b, L1–L4) | platform suspension (the Admin PINTAR only; SECURITY, ADMINISTRATIVE or OTHER; «Disiplin» removed by ruling); «Tutup akun saya»; deletion of personal data, which is now true of every copy, the photo file included | F38-A01–A07, F38-O03, AKUN-A01 |
| **Daisy's «Kenaikan kelas» reconciliation** (#96) | the bulk choice fills only the Kelas's own learners; a live count; the year always written; a grouped review with every exception named; the outcome checked against the data; processed classes marked; one run reads as one entry in Jejak audit, its rows linked by a run id (Sharon's advice) | KENAIKAN-A01 (restated), KENAIKAN-K02, F37-K06 |
| **Reopening a closed account** (owner ruling 2) | a signed-out request from the sign-in screen, paced and answered alike for every address. It reopens nothing by itself: an Admin PINTAR reopens the account from the queue after verifying identity, and no former school role comes back with it | F38-O02, AKUN-A02 |

**The action-and-consequence gaps the owner included:**

| Area | Done | Tests |
|---|---|---|
| **Ending or withdrawing a lesson assignment** (W2.21) | the class's Guru ends or withdraws it with a reason; finished work kept; open sittings only with explicit confirmation; no start slips past it | F38-W01–W05, PENUGASAN-A01 |
| **Correcting an issued certificate** (W2.22) | «Terbitkan ulang»: a replacement sealed by the server; the original SUPERSEDED with its sealed history intact; at most one pending replacement | F38-C01–C05, SERTIFIKAT-A01 |
| **Attempt limits** (owner ruling 1) | reassigning the same assessment no longer resets attempts; a sitting ended by a departure is not counted | F38-O01, F38-H02 |
| **Each school's own clock** (Sharon F1) | WIB, WITA or WIT per school, set by the Admin PINTAR; every date a school records is its own | F38-H01 |

**The independent reviews:**
- **Sharon on `7a2c1751`:** F1–F6 fixed.
- **Sharon on `6faef690` (§13–§17):**
  - all five Medium findings fixed (deletion, closure, the last platform administrator);
  - all the Low findings fixed (a race, wasted certificate numbers, unrecorded queues, visibility, the second press);
  - §17 verified by her.
- **The owner's three rulings (9 Nov):** implemented, plus the owner's two checks (reopening restores sign-in only; the
  public form resists flooding).

---

## 2 · What is in progress

| # | Item | State |
|---|---|---|
| 1 | **Daisy's copy and pattern review of the five new screens** (#97) | received. Wording, the 14 responsibility names, the red confirmation pattern, the learner's leaving text |
| 2 | **Sharon's addendum** | to send after #97. It covers F1–F6, §13–§16 and the rulings, plus the owner's two checks |
| 3 | **W2.26, the integrity count line** | waiting on Sharon's ruling |

---

## 3 · What is next, in order

1. Daisy's #97 (tests first where behaviour changes). Tell Daisy that «Lainnya» is not offered in Kenaikan (a «Lainnya» departure uses «Akhiri pendaftaran»).
2. Sharon's addendum review; fix her findings.
3. **One final candidate:**
   - the clean suite, exact-SHA CI and journeys on that one commit;
   - Daisy's and Sharon's verification on it.

   *(Owner, 9 Nov: the integrated verification is repeated after Daisy's changes, not carried over from an earlier
   candidate.)*
4. A report to the owner, then **a staging promotion only if the owner authorises it**. Migrations 201–222 would go to
   staging together.
5. Then the human walkthrough, which is not scheduled until the above holds.

---

## 4 · How much more to 4.0

**Engineering for the 4.0 feature set: about 2–3 working days**, if the reviews come back promptly.

| Work | Estimate |
|---|---|
| #97 copy and patterns | ~1 day |
| Sharon's addendum findings | 0.5–1 day, depending on what she finds |
| The final candidate's runs (each clean suite about 45 min; CI; journeys) | ~0.5 day |

**After engineering, 4.0 still needs** (unchanged since 8 Nov, and none of it is engineering):
- **People's acceptance:** no journey has yet been walked by a person on staging; Daisy's design gate per batch.
- **The words:** Dr Gladys's question pack and report titles; the «paket / kursus» terminology.
- **Batch 8's last proofs:**
  - W6.2 and W6.8 measured from Indonesia;
  - NVDA and TalkBack passes on real devices.
- **The release gates:**
  - counsel (UU PDP, PSE, retention; this is the legal gate before any real school);
  - capacity (F-15);
  - recovery (F-6, F-14);
  - production email and DNS;
  - **the production upgrade rehearsal (F-5, F-18).** Production is at 111; the candidate is at 222, which makes it
    **111 migrations in one move**, never run against production's real data. It remains the largest single risk.
- **Production release:** a separate owner authorisation after all of the above.

**Critical path:** the final 4.0 candidate → staging (if authorised) → human acceptance and Dr Gladys's words → counsel
→ the upgrade rehearsal and capacity → recovery.

---

## 5 · And 4.1

Source: `docs/completion-4.1/SCOPE-REGISTER.md` (opened 9 Nov).

**Target:** one complete 4.1 educator walkthrough with Dr Gladys's team in **mid-December 2026**. That needs
capability work done by about **6 December**, then one week of integrated verification on one candidate. **The dates
are forecasts:** the walkthrough moves rather than show an AI question generator educators cannot trust.

| # | Capability | Effort (eng. days) | Risk | State today |
|---|---|---|---|---|
| C1 | Controlled cross-device assessment recovery | 10–14 | high | design reviewed by Sharon (five gaps, three high); being revised |
| C2 | Misconception annotations | 4–6 | low | approved; truth to define |
| C3 | AI-assisted question generation | 8–12 + evaluation | high | approved; last by ruling; preparation now, build after its entry gate (~26 Nov) |
| C4 | Question revision lineage | 3–5 | medium | approved; truth to define |
| C5 | Key-event accountability logging | 4–6 | medium | approved; retention ruled (12 months) |
| C6 | Discreet printed-report identification | 2–4 | low | approved; depends on C5 |
| C7 | Scheduled maintenance pause and resume | 5–7 | medium | approved |
| C8 | Emergency override (class, school, platform) | 2–3 | medium | approved; class scope to add |
| X | Platform-wide consistency | 4–6 | — | across the period |
| | **Total** | **≈ 46–69** | | four lanes in parallel; reviews and clean suites serialise |

**Also in 4.1:**
- formal educator job positions and their history, distinct from PINTAR roles;
- acting appointments;
- future-dated role starts.

**Moved to 4.5:** WhatsApp sign-in.

**How 4.1 stands against its plan:**
- **Built:** none of the eight capabilities. Every one is at «approved» or earlier, because the 4.0 lifecycle work (and
  the owner's 9 Nov rulings) took this week's capacity.
- **Behind the plan's first week (10–15 Nov):** C5's and C4's truth, C7's truth, and C1's revised design, all due this
  week. The 4.0 foundation items in that week's plan (the school time zone, SI-D01) are done.
- **The schedule leaves little margin.** C1's re-review by about 19–22 November and C3's evaluation run in the second
  half of November set the date. I'll report the 4.1 forecast again once 4.0's final candidate is out of the way.

---

## 6 · Milestones since 8 Nov

| Commit | What |
|---|---|
| `7a2c1751` | the owner-named verified candidate (E3/E4, kenaikan) |
| `6faef690` | §5b and L1–L4 (suspension, closure, deletion) |
| `1dc3d9b4` | Sharon F1–F6 |
| `a0fc0470` | Sharon §13–§16 |
| `3b234f1a` | the owner's rulings 1–3 |
| `6dfab9d6` | the suite's seven fixed; reopening without former authority; the public form paced |
| `1fcb5c95` | the «Peran & akses» axe fix; CI and journeys green on this SHA |
| `0d3830ec` | Daisy's «Kenaikan kelas» reconciliation (#96) |
