# Z8 · R-15's Sharon items: verify-closed and classed (stream A)

> **Source:** Sharon's `R15-SHARON-ITEMS-7ba18b03.md`, re-read on `claude/z` `36299159` with the live database, 23 Nov.
> Read-only.
> **Classes:** Bob's rulings (13:13Z), confirmed by Sharon (`Z8-R15-CLASSES-36299159.md`, `d2721e9b`).
> **Stream B's rows** (A1-R1, R2, R4; C1-R2, R4, R5) are in stream B's Z8 document (`04c78339`).

## Verify-closed (for Sharon to confirm)

| Item | Closed by | Citation |
|---|---|---|
| **3 · A1: which result reports use when attempts are granted** | The rule is now explicit, in three parts. The learner's summary takes the latest FINALIZED sitting of each Uji Penguasaan, never a later sitting still open (Z V2). Every STAFF reader takes the result in force for a sitting, the one nothing supersedes (D11, `hasil_terkini_id`); since Z this includes the retake queue's figure and gate. The learner's own reads take `hasil_murid_id` instead (D14): the sealed original, or a governed correction, while an ordinary recalculation is only marked. The teacher reads every result, each beside its own sealed mark (Sharon's wording fix, record f42dc36e) | `20270123110000:22,57` (`hasil_belajar_sesi_orang`, `x.status = 'FINALIZED'`); `20270115110000:484` (`hasil_terkini_id`); `20270123130000:214,219` (`percobaan_antrean` reads `hasil_terkini_id(s.id)`); `src/lib/pengajar.ts` `susunCatatan` (`learner.result`, one row per sitting). Tests: Z-V2-01, Z-K01-01 (the queue beside a recalculation stamped before its original) |
| **7 · C1w: who can see «Riwayat soal»** | `riwayat_soal` refuses unless the caller holds CAN_DRAFT or CAN_REVIEW in the item's school, and gives every refusal the same answer (QUESTION_NOT_VISIBLE). `riwayat_soal_koreksi` is not client-callable | `20270115100000:1044` (the check), `:1082` (its grant); `:1019` (`riwayat_soal_koreksi` revoked from public, anon and authenticated) |
| **B0 · `tangguhkan_akun`** (an account suspended by a platform admin) | Recoverable, not a lockout. Only a PINTAR Administrator may call it, and the same role can appoint a new school admin. The self-service route this item did not name, `minta_akun('CLOSE')`, is item 8 below | `20270114100000:674,679` (`is_system_admin()` or ACCOUNT_NOT_ALLOWED) |

## Classed elsewhere (recorded, not changed in Z)

| Item | Class | Evidence |
|---|---|---|
| **1 · The run guard's order in `audit_write`** | **4.2, rationalisation audit; mitigated.** The school guard sits inside `not (v_summary ? 'run_id')`, so a summary that already carries a run id would skip it. That cannot happen today: `audit_write` is executable by postgres and service_role only, no function passes a `run_id` in its summary (0 found), and the deferred `audit_run_parent_check` refuses a run row of another school (fable37 K08) | `20270112210000:120` (the guard), `:402–419` (`audit_run_parent_check` and its trigger) |
| **2 · A1: re-check the conditions at approval** | **4.2.** `putuskan_percobaan` checks PENDING, authority and the reason. Mitigated: starting re-checks through `may_start_assessment`, so an approval never starts a sitting the rules refuse. The gap is an approval that cannot be used, which needs saying, not a safety fix | `20270114100000` (`putuskan_percobaan`) |
| **4 · C1w: statistics after a one-question revision** | **4.5**, with RD-4 and Question Intelligence (Sharon's record) | — |
| **5 · C1w: prefer a confirmer who did not write the faulty revision** | **4.2:** show `confirmer_wrote_faulty` to the confirmer and in the record. Mitigated: the flag is recorded on every confirmed correction, and the proposer never confirms | `20270115110000:933` |
| **6 · C1w: a one-step confirm when a certificate review's outcome is unchanged** | **4.2,** a convenience. Every decision in `putuskan_tinjauan_sertifikat` takes a reason of 10 to 300 characters. The review itself opens on every result change (closed) | the live `putuskan_tinjauan_sertifikat` (CERT_REVIEW_REASON_REQUIRED) |

## Fixed in Z

| Item | Where |
|---|---|
| **8 · The last school admin can close their own account** (`minta_akun('CLOSE')`, found on 23 Nov); and **`revoke_role`**, by which a school admin can revoke the last INSTITUTION_ADMIN assignment, their own included (Sharon's (d)) | Z8 item 8: migration `20270123170000` (308), built red first to Sharon's specification (b)–(e); handed to Sharon separately |
