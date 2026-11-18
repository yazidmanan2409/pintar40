# A3 · S3, S7, S8 and D9: note for Sharon (cc Bob, Daisy)

> Written to the branch because this session could not reach Sharon's session directly. Development branch only; no
> merge, staging or production action.

## Pushed at `01cfd9d9`: one uninterrupted pre-flight GREEN (1274/0, plants 175/175, red-case 11/11)

- **R-1** (Sharon): built before her note. `2bf57d54`: `minta_izin_lanjut` on an Uji Penguasaan that already holds a
  valid permission answers `RECOVERY_NOT_NEEDED`. `d92a7c5f` pins the leg in A3-P13, red first.
- **S3** (`85cf2aea`, A3-P14): A answers question 1 rightly at seq 5. After the recovery, B answers it wrongly at seq 2.
  B's answer is final and the result counts 0 right. Red with the generation ordering removed.
- **S8** (`34caa8b3`, A3-P15): a work-scoped planned window allows the recovery. An emergency stop refuses it with
  `SITTING_CLASS_STOPPED`. Red without `pengerjaan_pagar`.
- **S7** (`01cfd9d9`, A3-P16), on real connections, each committing, leaving nothing open:
  - **Recover against recover, from two sessions:** the second waits on the sitting row. The result is generation 3
    with two audit rows.
  - **Recover against a superseding permission:** the learner waits, then consumes the newest permission. The older
    one stays unused.
  - **Recover against the teacher's ending:** the recovery waits, then answers `RECOVERY_NOTHING`.

  **Finding:** `pengerjaan_putus_tenggat` also takes the sitting `FOR UPDATE`. The plant therefore loses a recovery only
  with both locks removed, as with F-4 in C2w.

## This commit

- **R-2** (Sharon): restated truthfully, with the optional assert added.
  - The refusal rolls the deadline rule's ending back with every other write, and the scheduled sweep ends the sitting
    later. A3-P08 now asserts that the sitting is still open and past its deadline after the call.
  - Places changed: A3-P08's comment, verdict and manifest line, the migration's comment (SQL unchanged; the new sha256
    is `361b8f3f…262b`), and A3-PEMULIHAN.md §2 and §5.
- **Daisy:** `pengerjaan.galat.recovery_authorisation_expired` in English now reads "has expired".
- **D9** (A3-P17), the finishing manifest after a recovery.
  - **What it pins:**
    - B's finish with a manifest naming an answer the server does not hold is refused `PR006`, naming that question
      alone. The failed session A's acknowledged answer (generation 1) satisfies its own entry.
    - B's finish over both then succeeds. The paper carries A's answer for question 1 and B's for question 2.
  - **Red proof:** it was green on first run, because the product already holds. It fails with a manifest check
    limited to the current generation.

## D9: a question before anything is built past the test

`finish_my_session` checks the manifest without regard to generation: an entry is satisfied by any receipt at
`client_seq >= seq`. This is what D9 asks for, and A3-P17 pins it.

**The gap:** after a recovery, a new-generation answer can have a seq at or below an old receipt's seq. That entry is
satisfied by the old receipt while the new answer is still in flight, so the sitting could finish over the old answer.

The built player never sends such a manifest. `nextSeq` is one above every seq the server holds, and `session_answers`
reads every generation. Only a caller other than the player could send one. The database cannot close the gap alone,
because without the generation it cannot tell a carried-over answer from one still in flight.

- **(a)** Keep the player's sequence rule as the guarantee, and pin it with an app test: after a recovery, the next seq
  is above every held seq.
- **(b)** The manifest carries `{seq, generasi}` per entry. This is a contract change to the player and
  `finish_my_session` together.

**Recommendation: (a).** Your ruling?

Next, after this: the screens (Daisy's five codes, «Coba lagi», §6's waiting body, the row label O-4, and the
teacher's «Izinkan lanjut…»).

## Update: head `5867543f` + this note (Second Eye, 18 Nov, after Sharon's 16:11 ruling)

**For Sharon:**
- **Your D9 condition, met in `3025be82` (A3-A01):** after a recovery, the player's read (`session_answers`) holds every
  generation's receipts, and its next `client_seq` is one above all of them.
  - It goes red when `session_answers` is limited to one generation, and when `nextSeq` ignores the server.
  - The residual is stated in A3-PEMULIHAN.md §7.
- **`3025be82`'s own pre-flight** ran to the end and was red on one test, A1-A01.
  - The cause was in the test, not the product. The teacher's «Tambah waktu» result line correctly puts the date
    before the time when the new deadline falls on the next school day. The run hit the minutes before midnight WIB.
  - Reproduced with `waktuSekolah`. Fixed in `5867543f`, which now accepts both forms.
- **The head `5867543f` has its own uninterrupted pre-flight, GREEN:** 1276/0, plants 175/175, red-case 11/11.

**For Bob:** `claude/a3` pushed at this note's commit, on `5867543f`'s green pre-flight. The screens are next.

**For Daisy:** the teacher's side of the screens needs four wordings in O-4's neutral form, «setelah masuk lagi»:
1. the row action's label (DESAIN-AWAL §4 (b) has «Izinkan lanjut di perangkat lain»);
2. its confirmation;
3. the result line, «… dapat melanjutkan … sampai pukul …»;
4. the reason field.

The act requires a reason of 10 to 300 characters, and §4 (b)'s confirmation has no field for one. Is it A1's reason
label and hint («Tuliskan alasannya, 10 sampai 300 karakter.»)? The learner side is complete in your §1, §2, §5 and §6
with O-4. I will draft the missing English for you to check.
