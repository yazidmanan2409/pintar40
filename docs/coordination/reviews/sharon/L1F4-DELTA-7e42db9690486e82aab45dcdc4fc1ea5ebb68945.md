# L1-F4 · delta review (L1F4-A1, L1F4-A2) · `7e42db9690486e82aab45dcdc4fc1ea5ebb68945` (on `3a63a2b2…`)

Sharon, 12 Nov 2026 (20:35 UTC). Read-only. Migration `20270117200000_an_anonymised_person_is_never_reopened.sql`;
tests `selftest/l1f4-balapan.test.ts` (L1F4-R02) and `selftest/db/l1f4.sql` (K09); plant `l1f4-5`.

## What holds now

- **PASS on `7e42db9690486e82aab45dcdc4fc1ea5ebb68945`. L1-F4 is no longer blocked by me.** Both defects are closed.
  My verification at `3a63a2b2` (the required change, the third race order, Daisy's count) stands.
- **Runs** on the top commit carrying it, `b24d73ffd0e84b139a02fe26f52fa21c52a94a25`: CI `43293048714` and journeys
  `43293054174`, green, first attempt.
- **The owner's condition** (ANONYMISED-PERSON-IS-TERMINAL.md §0 item 8): L1-F4 is not accepted until its two-connection
  race tests pass. They now pass: L1F4-R01 (the third order) and L1F4-R02 (deletion against reopen, both orders). From
  my side L1-F4 can close on Bob's boundary check.

## Verified

| Point | Finding |
|---|---|
| **A1 · the deletion** | `hapus_data_pribadi` takes `persons … for update` first, resolving the person through the request with no lock, then its request, then the person again (a no-op). The closure check and both attachment checks now run **after** the lock |
| **A1 · the reopen and the reinstatement** | `buka_kembali_akun` and `aktifkan_kembali_akun` take the person row first, before the request or suspension row and before `akun_kunci`. The deletion and the reopen therefore serialise on the person: reopen first, the deletion is refused `ACCOUNT_NOT_CLOSED`; deletion first, the reopen is refused `ACCOUNT_ANONYMISED` |
| **A2 · the reopen of an anonymised person** | Refused `ACCOUNT_ANONYMISED`, checked under the person lock, before the closure is touched. The closure stays open, so every account stays locked |
| **A2 · the request** | `minta_buka_kembali` records nothing for an anonymised person, and its answer is unchanged (`ok` for everyone) |
| **The recommendation, taken** | The deletion ends the person's open REOPEN requests (DECLINED, with a note). The page explains why both acts must lock the person **before** the request row, because the deletion now writes the other act's request. That is right |
| **Lock order** | persons → account_requests → person_suspensions → auth.users → accounts. That conforms to my standing rule and to L1-F2's order. The migration's own check asserts that the first `for update` in each of the three functions is on `persons` |
| **The refusal codes** | `akun_tolak` is restated with the new code and keeps every earlier one. *(I checked a count that seemed to drop seven codes: those `CERT_*` codes belong to `sertifikat_koreksi_tolak`, and no `akun_tolak` call uses them.)* |

## Note (non-blocking)

The new refusal line for the platform admin (`ACCOUNT_ANONYMISED`) is Daisy's to word, if it is shown on a screen.

## The four questions

- **And then what?** A deleted person stays deleted. Their open reopen request is closed with a note, and a later one
  is not recorded.
- **What else did that change?** The reopen and reinstatement paths take the person row first. The deletion now writes
  one more row kind (REOPEN requests).
- **What happens when things go wrong?** Two administrators acting at once on the same person: one waits, then is
  refused. Neither can produce an anonymised and reopened person.
- **Can it be reversed, and what survives?** Anonymisation cannot be reversed. The closure row, and the lock it keeps,
  survives for good.
