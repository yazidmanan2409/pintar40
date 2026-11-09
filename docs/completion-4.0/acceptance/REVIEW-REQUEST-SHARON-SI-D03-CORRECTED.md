# Sharon: the 4.0 integrity corrections, independent review on the exact candidate

Please review read-only, on the exact head named in the commit that adds this file, on `claude/system-integrity-4.0`.
Each correction went red first, then green. The whole clean suite on that head is recorded in
`SYSTEM-INTEGRITY-MATRIX.md` §5.

For each item, answer «verified», or give a finding with a reproducible case.

## 1. SI-D03: the five credential paths (owner's priority 1)

- **Migration:** `20270112140000_a_school_acts_on_whom_it_holds_now.sql`.
- **Tests:** F37-S01 (red at `6070cd60`) and F37-S02 (red at `44aec55c`), both green at `964b0e45`.

`sekolah_memegang(person, school)` is an internal predicate, revoked from every client. It holds when the school:
- **places the person now:** a role that has started, has not ended and is not revoked (your `valid_from` finding), or
  a PENDING/ACTIVE enrolment; or
- **is onboarding them:** the school issued their registration number, has never enrolled them (no enrolment of any
  status), no other school places them now, and they have never activated an account (none, or one still in its
  REQUIRED setup).

All five paths ask it, each keeping its own capability check and refusal:
- `recovery_assist_school` (and so `admin_reset_recovery`);
- `authorize_card_reissue`;
- `authorize_card_conversion`;
- `authorize_email_correction`;
- `authorize_account_activation`.

Registration numbers, enrolments and transfers are untouched.

**The deviation from your wording, deliberate, for your ruling.** You proposed «no role, past or present» for
onboarding. F23-C07, the approved CR-91 rule (D-145(a)), has a Guru who never activated, and whose role was revoked
or expired, given a learner's class card by the same school. Your wording refuses that.
- The never-activated form keeps it.
- Once a person has activated, only current placement decides, so a retired teacher's former school keeps no power
  over the account.
- **Please confirm or refute**, and say whether a time bound from `issued_at` is still wanted.

**Restated fixtures,** with no assertion changed and a note in each:
- **F24:** the card learner is enrolled at alpha.
- **BOB28-D01:** the seed's first card learner had transferred alpha → beta, and the fixture had alpha re-issue
  their card, which is the defect itself. It is now pinned to alpha, with the learner enrolled there.

Are both faithful?

## 2. SI-D01: professional-learning sittings (priority 2)

- **Migration:** `20270112150000`. **Test:** F37-D08, red at `af009738`, green at `f4442ce2`.
- The PD branch of `terminate_session` and `extend_session_deadline` is now `is_system_admin()`.
- On a fresh open PD sitting each:
  - a Kepala departemen, a Guru and the Admin sekolah are refused;
  - the platform administrator extends and ends it.

## 3. SI-D02: the stronger race test (priority 3)

- **Commit:** `2b09421d`. **Test:** F37-R01.
- A commits. B waits on the lock, then is refused ATTEMPT_LIMIT_REACHED, and the learner holds exactly
  `attempt_limit` sittings.
- The teardown removes A's own sitting with triggers suspended. Audit rows stay.
- The verification block of `20270112120000` checks that the lock call precedes the `may_start_assessment` call.

Does this now distinguish a correct fix from one that counts before locking?

## 4. The lifecycle database corrections (priority 4)

- **Migration:** `20270112160000`. **Tests:** F37-L01..L03, red at `84f0b0ed`.
- **D2:**
  - INSERT and UPDATE on `enrollments` and `memberships` are revoked from `authenticated`, and their write policies
    dropped.
  - `move_learner_to_class` («Pindah kelas», the one writer that ran with the caller's rights) becomes SECURITY
    DEFINER, keeping its own check.
  - F01-T10's self-fixture now writes as the owner.
- **One live enrolment per person, school, year and programme:** a partial unique index.
  - **A second deviation, for your ruling:** you proposed (person, institution, period).
  - The canonical model (`docs/rebuild/02`, «Institution Enrollment»: person, institution, period, *programme where
    applicable*; concurrent enrolments *where policy permits*) keeps the programme in the key. F37-D04 uses two
    programmes of one school.
  - Without the programme, the clean suite failed 14 F37 cases and F26-W01 on that fixture.
  - Is the programme-aware key right, or should 4.0 forbid concurrent programmes?
  - Found while doing this: a repeated transfer to a school the learner is already in created a second live
    enrolment there. The index now refuses it (unique_violation). A named refusal in `transfer_execute` would be
    kinder. Is that a finding you want fixed in 4.0?
- **D3:** `person_visible_to_me`'s role branch keeps a person visible to the school's administrator for a role held
  there now or ever.

**Please check:**
- Is the definer `move_learner_to_class` as tightly bounded as the RLS it replaces?
- Does anything else need the dropped policies?
- Should D3 reach other staff (reviewers in Studio), or only the administrator?

## Not changed, for later

- **The integrity count line (Daisy's revision):** owner-approved, but it waits for your check of aggregate disclosure
  safety, including the n = 0 case, which needs the RPC to say whether other departments exist.
- **The demonstration's transfer defect:** after a transfer, the sending school's «Murid yang belum punya kelas»
  still offers to place the departed learner (`tempatkan_murid`). It goes to the lifecycle and promotion design.

## 5. Your review of 2ce4ddcf: the corrections (migration `20270112170000`)

Red first at `f2c4b9f7` and `5294821d`. The whole clean suite on the exact head named in the commit is 931 passed, 0
failed.

1. **Onboarding (F37-S03, S04):** only the school whose registration number is the person's single newest, and which is
   active, onboards.
   - On a tie at the newest time, or with an inactive issuer, *nobody* does (fail closed; the platform still can, as
     the owner ruled). The older school never inherits.
   - A new number and a school's act on the person serialise on the person's row (`FOR UPDATE`, only in a read-write
     transaction: the recovery lookup is read-only).
   - Is `issued_at >=` (a tie refuses both) right?
2. **No programme-less coexistence (F37-L04):** a BEFORE trigger refuses a live enrolment with no programme beside
   another live one of the same person, school and year, serialised on the person's row.
   - Its cost on W217-SKALA-01's 13,300-row import is 9.0 s → 16.0 s, with no contention (distinct people).
3. **`transfer_execute` (F37-T01):** a learner already enrolled at the receiving school that year is refused PR040
   TRANSFER_ALREADY_ENROLLED, and nothing is written.
4. **A departed learner (F37-L05):** `murid_tanpa_kelas` no longer lists, and `tempatkan_murid` refuses (PLACE_DEPARTED,
   PLACE_ELSEWHERE), a learner who left this school or is enrolled at another. A return will be a governed
   re-enrolment (E4, next).
5. **The F26 fixture** puts its enrolled learner in the Kelas on their existing live enrolment, not a second
   programme-less one. No assertion changed.
