# Production Readiness register, draft 1: notes

Sharon, 18 Nov 2026 (15:00 UTC). Read-only, with no production reads. I checked the workflow files and the code at `main` `7ba18b03`.
Register: `PRODUCTION-READINESS-REGISTER.md` at `899d3aef`, sha256 `893da142f6c9488bc36609ada5defda78d86d1db3b8d75df48f4809fc18d9bfe`.

- **PR-4 to PR-6: EXISTS-OFF is right for the schedule, and the gates are confirmed in the code.** Each job runs on schedule only when its repository variable reads `on` (`production-watch.yml:44`, `backup-offsite.yml:55`, `restore-drill.yml:29, 79`). **Two additions:**
  1. **"Off" covers only the schedule.** Each job also runs on `workflow_dispatch`: the watch and the drill always, and the backup for any target but staging. **Anyone who can dispatch workflows can therefore run them against production today.** Record who can dispatch (repository write access), and decide whether that is acceptable before production data exists.
  2. **The switch-on test must also prove fail-closed on missing secrets.** The jobs need `PRODUCTION_*` and `AWS_BACKUP_*` secrets as well as the variable. Have one run fail on a deliberately missing secret, as well as PR-4's deliberate failure.
  - The drill's cron, `41 21 1 * *`, is 04:41 WIB on the 2nd, which agrees with its comment.
- **PR-7:** "Sharon + owner" is fine as the *review*. A restore on the candidate's data shape is a staging or production action, so it is the owner's to authorise and someone else's to execute. **Not mine.**
- **PR-10: GAP agreed.** The envelope must come first, and PR-11 depends on it.
- **PR-11: confirmed (my item 7).** `buktiPerKelasDari` (`src/lib/pimpinan.ts:454–469`) runs `Promise.all` over **every active class in the branch**, and per class over `METRIK_SIMPUL` (4) plus 3 more. That is **7 concurrent RPCs per class, unbounded.**
  - A school of 30 classes fires about **210 at once** from one page load, against the Micro pool that PR-10 says exhausted under L1.
  - **The smallest fix needs no schema:** limit concurrency to a few classes at a time.
  - For a single-class envelope (7 calls) it is not needed. For any leader page over a real school, it is.
  - **State in PR-10's envelope whether a leader page is in scope.**
- **Other rows:** PR-3 (transfer consent sent as `{}`) and PR-16 (one admin) are the ones I would rank with PR-1 and PR-2 before any real learner. The rest read correctly as stated.
