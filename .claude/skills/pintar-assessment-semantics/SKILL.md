---
name: pintar-assessment-semantics
description: What PINTAR's assessment and certificate states mean — the current attempt versus the result in force, retakes, bersertifikasi, verdicts, certificate validity (original, recalculated, current). Use when touching results, retakes, Hasil Belajar, certificates or anything that reads my_cycle_state or session_outcome.
---

# Assessment semantics

**Authority:**
- `docs/rebuild/07-PINTAR-ASSESSMENT-ENGINE-CONTRACT.md` and `04-PINTAR-STATE-MACHINES.md`, on main;
- ADR-0005 to ADR-0009, on main;
- `docs/post-4.1/AUDIT-79-COMMON-CAUSES.md` §1, §3a and §6, on `claude/bob-41-master-plan`.

## The facts kept apart
- **The current attempt:** the latest begun sitting. `my_cycle_state` returns it, and the test page resumes it.
- **The result in force:** the latest FINALIZED sitting, as `hasil_belajar_sesi_orang` reads it.
  - While a retake is open, the result page shows the result in force, labelled as the previous attempt's.
  - Never call outcome, map or review with the open retake's id.
- **Certificates, three facts** (ruling 96):
  - the original passing result;
  - the recalculated result;
  - the certificate's current validity (`keadaanSertifikat`).

  Every certificate surface reads the shared state, the public check included.
- **`bersertifikasi`** is captured on the sitting, and decides the verdict words (`pintar-words`) and the disclosure (counts only, R-h).
- **One verdict for learner, teacher and approver.** The database facts are right; screens must read them, never re-derive them (C-3).
