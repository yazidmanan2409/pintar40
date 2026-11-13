# Part 2 · ruling on the smaller-evidence approach (Addendum 1 §5b, six items)

Sharon, 13 Nov 2026. Read-only. Bob's request of 08:01 UTC. Published on the owner's authorisation of 13 Nov, which
accepts this approach as the basis for completing Part 2, subject to these conditions and to verification of the
actual results.

**Already established at Part 1** (`CHECKPOINT-PART1-40ca971f….md`):
- migrations at 244;
- `pg_cron` 1.6.4, with both jobs present once each and a clean health read;
- the closer's first run, which ended exactly the five predicted sittings;
- the five triggers on `auth.users` and the link lock, with the repository's digests;
- privileges on the six `auth` tables;
- the role timeouts;
- the hook's time;
- preservation equal on every line.

**Part 2 is not accepted until the evidence below is complete.**

| # | Proof | Ruling |
|---|---|---|
| 1 | Restore (item 5): the existing `restore-rehearsal.yml`, which reads staging only and restores into a scratch copy | **ACCEPT WITH** every line it prints passing my five conditions (`CHECKPOINT-ITEM5-152ecea9….md`), and the known limit (what a hosted restore brings back by itself) written into the report |
| 2 | One existing staging walk at a `sekolah-uji-` school: the app serves the promoted build; Auth works with the five triggers; the network origin is recorded (parts of items 3 and 6) | **ACCEPT WITH** four conditions:<br>• the walk is dispatched from `main`;<br>• the audit rows it writes carry `build_sha` `40ca971f`;<br>• it uses no password recovery (if it does, preservation lines 42, 44 and 45 take my exclusion list);<br>• a preservation pair is taken around it.<br>Never the demonstration school. |
| 3 | Writes to the `auth` schema at runtime (item 4) | **ACCEPT WITH** one more read-only check: no other trigger and no row-level security on `auth.identities`, `auth.audit_log_entries`, `auth.sessions`, `auth.refresh_tokens` and `auth.one_time_tokens` |
| 4 | A scheduled job `CALL`ing a procedure that commits between batches (item 1) | **Needed.** A2a's accepted design (D6.6) makes the closer exactly such a procedure. **ACCEPT** the five-statement probe in a scratch schema, through Bob's database tool, with three conditions:<br>• the job is scheduled for one run, not every minute;<br>• it is unscheduled and dropped straight after;<br>• the catalogue then reads `0 0 0 0`.<br>The probe must show the run `succeeded` and both rows committed in order. |
| 5 | A transaction-level advisory lock under pooling (item 2) | **ACCEPT by construction**, if A2a's page confirms the fence is taken only inside database functions reached through PostgREST or `pg_cron`, never through the transaction pooler. Otherwise, one two-connection probe through port 6543 |
| 6 | Hosted Auth refuses a locked account, and a suspended person's new account is locked from its first read (item 3) | **NOT ENOUGH with (a) alone:** a matching GoTrue version is not proof of hosted behaviour.<br>**The minimum is (b), on one synthetic `sekolah-uji-` learner:**<br>• suspended before having an account;<br>• given a class card through the app, and locked at the first read;<br>• one sign-in with the correct PIN refused with the ordinary mismatch;<br>• reinstatement releases the account;<br>• clean-up through the product, with a preservation pair around it.<br>The refresh check is not needed, because the lock deletes the tokens. |

**Access:** I do not dispatch workflows or run SQL on staging. Items 1, 2, 4 and 6 are for Bob or Second Eye to run. I
then verify the recorded results against this ruling.
