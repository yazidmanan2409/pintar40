# L1-F4 · interim review: historical against new live attachments · `ea3c4b6f1d10a2a01281f16e8cce893235bfbef2`

Sharon, 12 Nov 2026. Read-only. Brief: `ANONYMISED-PERSON-IS-TERMINAL.md` §0 item 8 and §3a.3 on
`claude/bob-41-master-plan`. Migration `20270117130000_an_anonymised_person_is_given_nothing_new.sql`, step (5).

## What holds now

- **Not a verdict on L1-F4.** It stays unaccepted until its two-connection race test exists and passes in both
  orders (owner, §0 item 8). It arrives with L1-F2.
- **Where the line is drawn: right.** Anything held when the closure began is history, and the deletion handles it as
  it did before. Anything gained after the closure began is a live attachment, and it refuses the deletion. This
  follows because closure ends no school role, and `minta_akun` already refuses a closure while an enrolment is live,
  under the person's lock.
- **How the line is measured: REQUIRED change before acceptance** (below). It uses `created_at > started_at`, and both
  are `now()`, the **start time of their transactions**. That misplaces an attachment made after the closure in some
  orders.

## The finding (required, fold into the commit that brings the race test)

**Case.** Connection A begins a transaction that will insert an enrolment or a role: an import, `daftarkan_kembali` or
a role grant. Connection B (`minta_akun`, CLOSE) begins after A and takes the person `FOR UPDATE`. B finds no live
enrolment, writes the closure (`started_at` = B's start) and commits. A's guard trigger then takes `FOR SHARE`, sees no
anonymisation and inserts. Its `created_at` is A's start time, which is **earlier than** `started_at`. At deletion that
attachment counts as history: the deletion proceeds and ends a live enrolment or role the school added after the
person closed. §3a.3 asks for the opposite: refuse, and keep the evidence.

The window is how long A runs before its insert. For a single call that is milliseconds; for a batch import in one
transaction it can be long. No data is disclosed either way, but the decision the platform admin should see is lost.

**The fix, exact by construction** (both sides already serialise on the person's row):
1. **Enrolments and placements: no timestamp.** At deletion, under its lock, refuse if the person has any `PENDING`
   or `ACTIVE` enrolment, or a live placement of one. Closure guarantees none existed when it began (the same lock),
   so every live enrolment at deletion was gained after it.
2. **Roles, open transfers, evaluator grants: a snapshot at closure.** `minta_akun` records, while it holds the person
   `FOR UPDATE`, the ids of the person's live role assignments, open transfers and evaluator grants on the closure row
   (for example `person_suspensions.dipegang_saat_tutup jsonb`, written once, under the existing guard). The deletion
   refuses on any live row of those kinds whose id is not in the snapshot. A closure that predates the column (none on
   staging or production; staging has 0 suspensions) is backfilled with what is live at migration time, and the page
   states that.
3. **Tests, red first.**
   - The order above on two real connections, the attachment's transaction having begun before the closure: the
     deletion is refused with `ACCOUNT_LIVE_ATTACHMENT`, and nothing is anonymised. Red on this commit.
   - A role held at closure: the deletion completes, as now (F38-A05 unchanged).
   - Plants: restoring the timestamp comparison turns the first test red; removing the snapshot write turns a
     role-after-closure test red.

This is a third order for the shared two-connection harness (L1-F2's), beside the two §3a.3 already names, so it adds
no infrastructure.

## Also checked (no change needed)

- In `hapus_data_pribadi` the new refusal sits **after** the person's `FOR UPDATE`, so it reads under the lock. The
  earlier `ACCOUNT_NOT_CLOSED` check comes before the lock; it is pre-existing and does not affect this line.
- `orang_dianonimkan` takes `FOR SHARE` against the deletion's `FOR UPDATE`. The guard is INSERT-only, as required.
- The registry check (`L1F4-E01`, plant `l1f4-1`) fails on an unclassified foreign key to `persons`.

## The four questions (for this line only)

- **And then what?** A refused deletion stays open, and the platform admin sees why.
- **What else did that change?** Nothing outside the deletion.
- **What happens when things go wrong?** Today, an attachment that races the closure is ended silently. After the fix
  it refuses the deletion.
- **Can it be reversed, and what survives?** A refusal changes nothing, so the person and the school can correct
  whichever side is the mistake.

**For Second Eye:** the snapshot is the only new column. If you see a simpler exact measure, write it at the top of
your page and I'll review it there.
