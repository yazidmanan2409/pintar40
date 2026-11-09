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

## 6. Your review of 0b60b012: the two Low findings, and the rollover's audit

Red first at `e03dd272` and `34edd507`. The whole clean suite on the exact head named in the commit is 933 passed, 0
failed.

1. **Lock order and the issue stamp** (`20270112180000`; F37-S05):
   - `issue_institutional_id` locks the school, then the person (the import's order).
   - It stamps `issued_at = clock_timestamp()` after both locks.
   - The verification checks both.
   - Is a reverse-order path left anywhere: a function that locks a person and then the school?
2. **The rollover's audit** (`20270112190000`; F37-N01):
   - `period_rollover` writes `period.rollover` only when it moved someone, and records `moved`.
   - A refused run aborts whole and writes nothing.
   - Is an un-audited no-op acceptable, given that the admin saw «0 dipindahkan» on screen and nothing changed?
3. **The Medium finding (no path back for a withdrawn learner)** closes with E4 RETURN, next. Lifecycle completion is
   not claimed before then.

## 7. E3 and E4 (`20270112200000`): closes your Medium finding (no path back for a withdrawn learner)

Red at `68116785`, green at `3b2799e4`. On `3b2799e4`: the whole clean suite 938 passed, 0 failed; CI green; journeys green.

**Corrected in place since `3b2799e4`** (both migrations are undeployed; listed in `969a0c10`):
- the date bound is the school's WIB date, not the database's UTC date;
- «recorded at this school» means its number or an enrolment there, since both kinds already require an earlier
  enrolment here.

**E3 `akhiri_pendaftaran(enrolment, reason, explanation, effective_date)`:**
- Who may call it: INSTITUTION_ADMIN of the enrolment's school, never another school's admin, and the platform.
- How each reason ends the enrolment:

  | Reason | end_reason |
  |---|---|
  | GRADUATED | COMPLETED |
  | TRANSFER_EXTERNAL, MOVED_ABROAD | TRANSFERRED_OUT |
  | WITHDRAWN, DECEASED | WITHDRAWN |
  | OTHER | WITHDRAWN, with an explanation of 10–300 characters required |

- The date is today or earlier, and never before the enrolment's `valid_from`. It is recorded in the audit row. Access
  ends at recording, as you ruled on 89374424.
- The enrolment row is locked. Its placements close as ENROLLMENT_ENDED, and it writes one
  `enrollment.ended_with_reason` row.
- It never touches results, sittings, certificates or attribution.
- **An open sitting (CREATED / IN_PROGRESS / PAUSED):** at `3b2799e4` it refused the ending (ENROL_SITTING_OPEN). Since
  `d2b7b714` the departure closes it instead: EXPIRED if past its deadline, otherwise INSTITUTIONAL_REVOCATION. See §12.

**E4 `daftarkan_kembali(person, school, kind, reason, kelas, enrolment)`.** It never rewrites the past.
- **CORRECTION:**
  - Allowed only for the person's latest ending at this school, recorded by E3, and not yet corrected.
  - It opens a new live enrolment in the same year and programme, back in the same Kelas if that Kelas is still
    active.
  - `enrollment.reopened {kind, corrects}` links it to the ending it corrects.
  - The ended row stays as it was.
- **RETURN:**
  - For a learner who left this school (`murid_sudah_keluar`).
  - It opens a new enrolment in the chosen Kelas's year and in the programme of their latest enrolment there.
  - Same person, same registration number.
- **Both:**
  - Refused with PLACE_ELSEWHERE while the person is enrolled at another school. A learner who moved away comes back
    only by a transfer, which keeps the old record (F37-E05). **A former school cannot reclaim a learner.**
  - Further refusals: ENROL_ALREADY_LIVE, ENROL_NOT_ENDED, ENROL_NOT_CORRECTABLE and ENROL_NOT_DEPARTED.
  - The person's row is locked.
  - The new enrolment is ACTIVE once the person has activated, PENDING until then.

**Please check:**
- Is CORRECTION's «latest, by E3, not yet corrected» tight enough? An ending recorded before E3 existed (for
  example by `transfer_execute`) cannot be «corrected». It can only be a RETURN.
- Is taking the programme from the latest enrolment right for RETURN?
- Does the Medium finding close?

## 8. Immediate institutional access revocation (owner's principle B): proof, no code change (`5f373c54`, CABUT-A01)

Two sessions are open at once, through the running app, Auth and PostgREST.
1. An educator teaching at Alpha (Kelas 5A) and at Beta is working in Mengajar at Alpha.
2. Alpha's admin, in another browser, calls `revoke_role` with a reason.
3. The educator's next requests, from the same open browser and with the same token, are refused:
   - the Kelas 5A page no longer shows its learner;
   - PostgREST returns 0 Alpha nodes (8 before) and 0 placements (1 before);
   - `konteks_saya` no longer holds the Alpha context.
4. Beta's context and class still answer.
5. Nothing is lost:
   - the revoked row keeps who revoked it, when and why;
   - role.granted and role.revoked are both audited with the reason;
   - person, account and session stand, and a fresh sign-in works.

**Please check:** is there any path that reads a cached authority? For example a server component's own cache, a
`device_sessions` column, or a materialised list. Is the per-request check the whole story?

## 9. «Kenaikan kelas dan kelulusan» (`20270112210000`): Daisy's approved flow, replacing the class-to-class run

Red at `c481fa26`, green at `71da21ce`. Tests: F37-K01..K05, KENAIKAN-K01 and KENAIKAN-A01 (the whole journey through
the screen).

**`kenaikan_rencana(kelas)`** returns:
- the learners of the Kelas, plus the learners of its Tingkat who have no Kelas (the demonstration's silent omission);
- for each learner, whether a transfer is under way and whether a sitting is open;
- the teachers;
- next year's Kelas.

**`kenaikan_tetapkan(kelas, tahun, keputusan, guru_ditinjau, terapkan)`:**
- **Preview:** validates and writes nothing.
- **Apply:** one transaction, locking the population's people rows in id order. Each learner has exactly one decision:
  - **NAIK / TINGGAL:** the old enrolment becomes ENDED/**EXPIRED**, and its placements close PERIOD_ROLLOVER. A new
    enrolment opens for the new year in the same programme and with the same status, placed straight into the chosen
    Kelas. A repeat never passes through the promotion class.
  - **LULUS / KELUAR:** through E3.
  - **PINDAH:** only while a transfer is under way, and nothing changes.
- **Refusals:**
  - PROMO_UNDECIDED, naming who is missing;
  - PROMO_CHANGED: someone not in the class, or a second press;
  - PROMO_TEACHERS_UNREVIEWED;
  - PROMO_TARGET_INVALID: not an active Kelas of the new year at this school;
  - PROMO_NO_TRANSFER;
  - ENROL_SITTING_OPEN: the whole run refuses;
  - another school's admin, and a Guru.
- **Audit:** one `promotion.applied` row with every outcome. A refused run writes nothing.
- **Teachers:** never carried over (F37-K03 asserts no role on the new classes).
- **Sittings:** stay on the old enrolment and the old class.

**`kenaikan_hasil(kelas)`:** the last confirmation read back, each learner with where they are now.

**Your §10 requirement 4 (the enrolment's year), decided for your ruling.** A promoted learner gets **a new enrolment
per year**:
- the canonical Institution Enrollment is keyed by period;
- the old year's enrolment ends EXPIRED;
- `transfer_execute` already behaves this way.
- Is EXPIRED the right end reason, or do you want a distinct one?
- `period_rollover` (which kept the old year's enrolment) is unchanged in the database, but no screen offers it any
  more. Should it be revoked from clients?

## 10. E3 and E4 on the screen (`20270112220000`; `969a0c10`)

The Action & Consequence inventory found that neither function had a caller. F37-E06 was red at `8231655c`;
KEMBALI-A01 drives the whole journey through the running app.

**`murid_keluar(school)`:**
- Lists the learners who left the school and are enrolled nowhere there now.
- For each: their latest ending, whether it can be corrected (the same rule as `daftarkan_kembali`), and whether they
  are enrolled elsewhere now.
- Only the school's admin can read it.

**Konfigurasi · Pindah kelas:**
- «Akhiri pendaftaran» on each learner's row.
- «Murid yang sudah keluar», offering:
  - «Membatalkan pencatatan yang keliru», only where the database says it can be corrected;
  - «Kembali bersekolah» into a chosen Kelas.
- A learner enrolled elsewhere is told that a transfer is the way back. No form is offered for them.

**Please check:** does `murid_keluar` disclose anything beyond what the school's admin may already read?

## 11. E7, a usable audit trail: «Jejak audit» shows who acted and why

The demonstration found this gap, and the owner ruled it 4.0.
- **Two new columns:**
  - «Oleh»: the actor's name where the reader may see the person, and the role they acted in (`actor_role`). A row
    with no actor reads «Sistem».
  - «Alasan»: the reason code in words, the free reason or explanation, and «berlaku <tanggal>».
- **Only keys written for this purpose are read** (`alasanAudit` in `src/lib/jejak-audit.ts`). A summary's ids,
  mappings and counts never reach the screen (JEJAK-K01).
- **End to end:** CABUT-A01 now also shows the revoking admin by name with the reason.
- **Please check:**
  - Can an audit row's free reason ever carry something the school's admin may not see? For example, a
    platform-written reason on a row tagged with the school.
  - Is «Petugas lain», for an actor the reader cannot see, the right disclosure?

## 12. Two rule changes the human journeys forced (9 Nov afternoon), for your ruling

The journeys on `ef43d245` and `d2b7b714` each failed at S27 (Kelas 1A's year end), for two different reasons. Each fix
was red first.

**1. Open sittings no longer block a departure or a year's move.** This answers your E3 question («end it, or wait»).
- The case: a learner of Kelas 1A had left a sitting open, in S26d and S26e, as learners do.
- No screen lets anyone close another person's sitting, so ENROL_SITTING_OPEN blocked the whole class's year end.
  Waiting deadlocks.
- `tutup_asesmen_terbuka` (internal) now closes each open sitting in two steps:
  1. it holds the sitting to its deadline (`session_enforce_deadline`: EXPIRED if past it, as its next touch would);
  2. a sitting still open is ended through `terminate_session` itself, as INSTITUTIONAL_REVOCATION. Its authority
     check over the class, its audit row and the retained responses all apply.
- `akhiri_pendaftaran` records `sittings_closed`.
- The promotion's preview says per learner how many will be ended. The confirmation closes them before moving the
  learner.
- Tests:
  - red: `f5ddbb4d`;
  - green: `d2b7b714`;
  - F37-E03 and K04 are restated, each with a note.

**2. A learner recorded but not yet signed in (PENDING) can leave and move up.**
- The case: the guard (`20260912004321`) allowed PENDING only to ACTIVE or CANCELLED, so Fajar, never signed in,
  blocked the confirmation.
- `20270112230000` allows PENDING → ENDED.
- Unchanged: CANCELLED still means «never took effect», and a closed enrolment stays immutable. Both are verified.
- Tests:
  - red: `ee3b3783`;
  - green: `e0ca32d9`, with ADR-0021's revoke in `7a2c1751`;
  - F37-E07 is new;
  - the promotion fixtures now include a PENDING learner.

**Please rule on both:**
- Is ending as INSTITUTIONAL_REVOCATION the right cause for a departure's open sitting?
- Is PENDING → ENDED acceptable, or should a never-activated learner's departure be CANCELLED, which loses
  «Murid yang sudah keluar» and E4?

## The verified candidate for this request: `7a2c1751`

| Check | Result |
|---|---|
| Clean suite | 950 passed, 0 failed (suite 15) |
| CI | green (run 542) |
| Human journeys | green (run 249), including S27, «Kenaikan kelas dan kelulusan» through the screen |

This file is added after it, in a docs-only commit.
