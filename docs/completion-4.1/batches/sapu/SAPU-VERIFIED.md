# Consistency sweep · Bob's verification

**Source:** Daisy, `ux-1/daisy-experience` `39a5d254`, `docs/coordination/ux/completion-4.1/SAPU-KONSISTENSI-706fe8c5.md` (37 findings).

**Verified** read-only against `main` at `706fe8c5`, 23 Nov.
- Bob checked S-01, S-02, K-01 and K-03 directly, and spot-checked K-05 and S-15.
- The other findings were checked by a delegated reader, with file:line evidence.

**Result:** every A finding is real. Every B finding is confirmed. Six corrections are refined (marked ⚑). **Nothing is authorised:** the owner decides.

**Severity:**
- **S1:** a misleading educational conclusion, a wrong account-state or security message, or a silent data change;
- **S2:** misleads an action;
- **S3:** terminology or cosmetic.

## S1

| Id | What is wrong | Destination | Notes |
|---|---|---|---|
| S-01 | Renaming an Aturan Asesmen sends pause and offline as false (`studio/actions.ts:532-533`). The save takes them (`20270121210000:327-330`), counts them as interpretive (`:397-405`), and saves a new version with both off | Z | No SQL. Send the flags only when their fields are present. **Staging checked read-only (23 Nov): 158 rules, 58 later versions, none with both flags off, so no rule has been changed this way yet** |
| K-01 | The verdict is gate AND mastery (`20261102100000:375-376`). A learner who fails only the must-be-right gate is told their mastery is below target. Their teacher's pages judge on the percentage alone (`murid/[orang]/page.tsx:126-128`; `pengajar.ts:1157`) and show «reached», with no «Beri ulang» | Z | **This changes teacher-visible behaviour:** gate-failed learners will appear as below target. It may need a read change for `lulus`, in which case Sharon reviews it |
| K-03 | `tujuanBelum` returns `[]` on any error (`pengajar.ts:1029`). A failed read, or no assessment yet, reads as "no objectives below target", against the file's own rule (`:1040`) | Z | No SQL |
| S-02 | Ubah peran drops a chosen role silently when no date is given (`staf/actions.ts:80-82`). The person is then told to "choose a role" | Z | No SQL |

## S2

| Id | What is wrong | Destination | Notes |
|---|---|---|---|
| K-05 (**raised to S1, ruling 78**) | The public verification page shows «Memenuhi capaian» and the Predikat under «Sedang ditinjau», next to "not declared valid" (`verifikasi/[token]/page.tsx:99,125`) | Z | ⚑ «Seperti saat diterbitkan» is not on `main` yet: it is new wording, for Daisy. Arguably S1 (public trust; O41-19) |
| S-12 | Reopening paces before checking the input, so a refused try says «a request was just sent» | Z, with R-26 item 1 | A route change; no SQL |
| S-15 | Every account-creation failure, outages included, says «email maybe already used» | Z | A route change; no SQL |
| S-04 | A bad school-code shape is told «maybe already taken» | Z | ⚑ `kenapa` carries the code, not the reason. The shape check goes in the action |
| S-05 | One generic error for the mix and safety refusals; on the edit row, the field at fault isn't on the form | Z (hint, and TS mapping to the existing SQL messages) | ⚑ The hint alone doesn't reach the edit row. The SQL messages are already distinct |
| S-08 | The PIN-recovery expiry says «ask for a new code» on a path with no code | Z | — |
| S-11 | The platform account lookup cuts a pasted «A14C D7ST» to 8 characters and shows nothing | Z | Same normaliser as R-27 |
| K-04 | The school report says «all domains ≥ 60%» while some are withheld | Z | — |
| S-06 | «…tidak dapat diubah saat ini» for a lasting licence refusal | Z (drop «saat ini») + later (name the cause, SQL) | — |
| K-07 | A pass mark of 0 is allowed everywhere, so any score passes (the gate only) | **Owner** | A policy floor; SQL and Sharon |

## S3

- **Z (one string or one attribute each):**
  - S-03: today is accepted, so «hari ini atau sesudahnya»;
  - S-07: the reason-required code;
  - S-09: «jaringan ini»;
  - S-10: «PIN yang bisa dipakai»;
  - S-13: «dan akunnya belum aktif»;
  - S-14: ⚑ a neutral «yang Anda ketik», not «nama ini»;
  - S-16: ⚑ `maxLength={200}` only;
  - T-09: three EN keys, to «Mastery Check» and «Quick Assessment»;
  - T-02: ⚑ `mengajar.langkah.f2` is unused, so delete it.
- **Later:**
  - K-06 (legacy sessions only);
  - K-08 (the SD tour is dormant; ⚑ model the text on `tur.nt.5.isi`);
  - K-09 (non-official sittings only; needs the issue route's answer);
  - T-01 and T-04 to T-12 (one natural wording pass).
- **Owner:**
  - K-02 «Sudah dikuasai» (already logged);
  - T-03: one name for the platform administrator, «Admin PINTAR» or «Admin platform».

## Daisy's final words (ruling 78)

Daisy's final words are at `ux-1/daisy-experience` `81b757b8`, `SAPU-KATA-RULING-78.md`. They are accepted. Bob settled her three [B] checks:

1. **K-02, the alasan fallback: CONFIRMED.**
   - For a KUAT card there are no wrong answers, so `reading_map`'s alasan falls back to `r.statement` (`20270117100000:278-287`), and the card prints the statement twice.
   - `map.kuat.arti` replaces the alasan slot for KUAT cards. This is UI only.
2. **K-01, the gate item's objectives in the suggested lessons: NOT AVAILABLE.**
   - `tujuan_belum_tercapai` (latest `20270111100000`) returns only objectives whose per-domain mastery is below the pass mark. A must-be-right item missed inside an objective that is above the mark is not returned.
   - Including it needs an SQL change: return the `objective_ids` of the session's missed safety-critical items. The read already gives the objective only, with no item or answer.
   - **Sharon reviews it.** It is part of the K-01 consumer inventory.
3. **«tim PINTAR» in `lapor.*`: no change.**
   - The platform reader of the queue is the platform context. That is the `SYSTEM_ADMIN` role, the role Admin PINTAR names.
   - But «tim PINTAR» describes who reads a report, in privacy and next-step text. It is not a role label, and it is accurate.
   - Ruling 78's «Admin PINTAR» applies to the role name. «tim PINTAR» and «pengelola PINTAR» stay.
