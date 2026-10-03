# D-093 — Operational switch inventory

**3 Oct. Investigation only.** Nothing was changed: no product behaviour, no migration, no staging data. Production was not read. Read: `main` at `b8f2590`, covering migrations, server actions, Konfigurasi, Studio, /mengajar, /pimpinan and /aktivasi. The held Gate 3 branches were not read.

**The rule (D-093, owner principle 3 Oct).** Every administrative ON/OFF or equivalent operational change keeps an immutable, chronological audit history. Reversing a change never erases or replaces the earlier event.

Minimum fields:
- actor
- actor role
- scope or entity
- authoritative server time
- previous state
- new state
- reason
- scheduled start and end (where applicable)
- outcome

*"The switch controls the present. The log explains how the present came to be."*

---

## 1. The audit mechanism, measured against the minimum fields

There is one writer, `public.audit_write`, into one table, `public.audit_log`.
- The table is defined at `20260912004158_foundation_base.sql:73-99`.
- The current writer is at `20260917120000_dual_identity_audit.sql:57-95`.
- The table is append-only by trigger. UPDATE, DELETE and TRUNCATE are refused, including for `service_role` (INV-18; `20260912051935`).

| D-093 field | `audit_log` today | Representable without a schema change? |
|---|---|---|
| Actor | `actor_auth_uid` and `actor_person_id` are taken from the session. `evaluation_actor_person_id` is filled under Evaluation Mode. Service-role and workflow writers leave the actor null; school founding names its operator in `summary.operator_ref`. | Yes |
| Actor role | **Not recorded anywhere.** It can only be derived by replaying `role_assignments` at time `at`. | Yes: a `summary.actor_role` key, filled by the writer from the authority check it has just passed |
| Scope / entity | `target_table`, `target_id`, `institution_id` | Yes. A change across several schools writes one row per school (as `transfers_audit` already does) or lists them in the summary. |
| Server time | `at = now()`: the database clock at transaction start. Rows inside one transaction share `at`, so order by `id`. | Yes |
| Previous → new state | Only if the writer puts them in `summary`. Triggers have `OLD`, but none uses it. | Yes |
| Reason | Only if the writer puts it in `summary` | Yes in `audit_log`. A reason cannot reach a trigger on a plain table `UPDATE` (feature flags, platform config): those switches need an RPC with a reason parameter. That is a function, grant and server-action change, not an `audit_log` change. |
| Scheduled start / end | Only if the writer puts them in `summary` (`LEARNING_ASSIGNED` already does) | Yes |
| Outcome | A row exists only if the change committed, so success is implied. | Yes for changes that happen, including automatic ones: `summary.outcome`, e.g. SCHEDULED, ACTIVATED, NO_CHANGE. **A refused attempt cannot be recorded in the refused transaction**, because the exception rolls its audit row back. Recording refusals needs a writer outside that transaction. That is not a schema change, but it is a decision (O2). |
| History preserved on reversal | Append-only, as above | Yes, already |

**Conclusion.** The audit architecture is sufficient for D-093. **No `audit_log` schema change is needed.**

The gaps lie elsewhere:
- **Writers:** what they put in `summary`.
- **Paths that bypass every writer:** direct table grants.
- **The reader:** Konfigurasi «Jejak audit» (`src/app/konfigurasi/page.tsx:731-751`) shows time, action, target and build. It does not show the actor or the summary, so the screen cannot answer *who, from what, to what, why*. An INSTITUTION_ADMIN also cannot read rows whose `institution_id` is null. D-093 asks for the record, not a screen, so this is noted, not counted as a gap.

`summary` is free-form, so completeness should be asserted, not hoped for. The pattern exists: dual-identity audit asserts its property over the whole trail (`20260917120000`). A self-test over a registry of switch actions would do the same here. A column for actor role is optional, and only worth adding if the owner wants it enforced by a constraint.

---

## 2. Inventory

**Scope.** Genuine switches, plus every item D-093(e) names: the pass mark, assessment windows, role grants, card issue and revocation, and release freeze and publish. Ordinary workflow transitions are excluded and listed in §3.

**G1: the actor's role is missing from every row.** It is listed once here and not repeated per row.

**Classes:**
- **A** satisfies D-093.
- **B** audited, but incomplete.
- **C** the state can change without an adequate chronological audit.
- **D** ambiguous, needs an owner ruling.

| # | Control | Scope | Authoritative state | Mutation path | Audit mechanism | Fields actually recorded | History preserved? | Gap | Class |
|---|---|---|---|---|---|---|---|---|---|
| S1 | **School pass mark**, Konfigurasi «Batas ketuntasan» | School × lesson | `school_pass_marks`, append-only, with a `supersedes_id` chain. Sealed onto assignments and sessions. | `tetapkanBatasAction` → `set_school_pass_mark` (definer, `20261102100000:203-242`) | `school_pass_mark.set` | Actor, school, course, time, `previous_percent` → `percent`, `supersedes_id`, **reason (required)**. An unchanged value writes nothing. | Yes: both the rows and the audit | G1 only | **A** |
| S2 | **Role grant / revoke**, Konfigurasi «Peran & akses» | Person × role × node | `role_assignments`. A grant is a new row. A revoke stamps `revoked_at`/`revoked_by` on that row. Rows are never deleted (guard). | `grantRoleAction` / `revokeRoleAction` → `grant_role` / `revoke_role` | Trigger `role_assignments_audit`: `role.granted` / `role.revoked` | Actor, person, role, node, school, time, `valid_until` (scheduled end), `revoked_at` | Yes | **No reason on revoke** (not asked; the RPC has no parameter). The start is always "now". Expiry passes with no event; the end was recorded at grant time. | **B** |
| S3 | **Account activation and class-card issue**, /aktivasi | Person / card | `account_activation_grants` (`consumed_at`/`by`), then `accounts`. **No reversal exists on main**: no disable, ban or card revoke. | Route → `authorize_account_activation` → `auth.admin.createUser` → trigger `handle_new_auth_user` | `account.activation_authorized` `{person_id, kind, actor}`. Account creation itself is not audited. `enrollment.active` follows with a null actor. | Actor, person, kind, time | Yes (grants kept) | **Outcome.** The row says "authorized" before the account exists. If `createUser` fails, only the unconsumed grant shows it. The card number and the class of a batch are not in the summary. | **B** |
| S3b | **Card revocation / re-issue** | Card | Not on main. Held with Gate 3; D-088(e) already says re-issue revokes the old credential "with reason". | — | — | — | — | Requirement only (§5) | n/a |
| S4 | **PIN-recovery reset (unlock)**. No UI. | Person | `recovery_ladder`, overwritten in place. Old PINs go to `person_pins_retired`. | `admin_reset_recovery` (SYSTEM_ADMIN only) | `identity.recovery_restored` `{via, reason}`, after earlier `identity.recovery_locked` / `_suspended` rows | Actor, person, time, **reason (required)**. The previous state is in the earlier rows. The role is fixed by the gate (SYSTEM_ADMIN). | Yes (audit chain) | — | **A** |
| S5 | **Maintenance mode / registration lock**, Konfigurasi «Fitur & saklar» | Platform | `platform_config.value`, overwritten in place | `setPlatformConfigAction` → direct `UPDATE` (RLS: SYSTEM_ADMIN) | Trigger: `platform_config.updated` `{value}` | Actor, key, time, new value. An unchanged save is also logged. | Audit rows are kept, but each holds only the new value | No previous value, no reason. **Nothing in `src/` or SQL reads either key: the switch changes nothing.** The log could say "maintenance ON" while PINTAR stays open. | **B + D** |
| S6 | **Feature flags**, same section | School × key | `feature_flags.enabled`, overwritten in place | `setFlagAction` → direct upsert (RLS: the school's admin, or SYSTEM_ADMIN) | Trigger: `feature_flag.INSERT` / `.UPDATE` `{enabled}` | Actor, key, school, time, new value | As S5 | No previous value, no reason. **`flag_enabled()` has no caller**, so no flag does anything. | **B + D** |
| S7 | **Structure deactivation**, «Nonaktifkan» on a Bagian, Tingkat or Kelas | Node subtree | `org_nodes.is_active = false`, cascading to descendants. No reactivation path exists anywhere. Direct writes are revoked. | `nonaktifkanStrukturAksi` → `deactivate_school_node` (definer) | `structure.deactivated` `{kind, name}` | Actor, node, time. One-way, so from → to is implied. | Yes | **No reason** (not asked). The descendants deactivated with it are not listed. | **B** |
| S8 | **Release freeze / publish / withdraw**, Studio | Course release | `plp_releases.status` plus `frozen_at`, `published_at`. Withdraw → SUPERSEDED, terminal. Direct writes are revoked. | Studio actions → `create/freeze/publish/withdraw_release` (definer) | `RELEASE_CREATED` / `_FROZEN` / `_PUBLISHED` / `_WITHDRAWN` (withdraw carries `{reason, evidence_untouched}`) | Actor, release, time, step (one-way sequence), **reason on withdraw (required)** | Yes. The row has no `withdrawn_by`/`_at`, but the audit row does. | G1 only | **A** |
| S9 | **Canonical distribution grant / withdraw**, /studio/kanonik | Release × consuming school | `release_distributions`. A re-grant is a new row. A withdraw stamps `withdrawn_at`/`_by` and overwrites the row's reason. | → `grant_` / `withdraw_release_distribution` | `RELEASE_DISTRIBUTION_GRANTED` `{reason}` / `_WITHDRAWN` `{reason, started_sessions_untouched}` | Actor, release, school, time, both reasons | Yes, in the audit. The row loses the grant reason; the audit keeps it. | G1 only | **A** |
| S10 | **Assessment windows**: «Sediakan» (`Mulai`/`Sampai`) and Uji Cepat (closes after its minutes) | Class × assignment | `learning_assignments` (`available_from`/`_until`, status); `assessment_assignments` (`opens_at`/`closes_at`, status) | **Opening:** `assign_release` / `launch_quick_assessment` (definer RPCs). **Closing, ending, extending or reopening:** no product path. **But both tables still grant `UPDATE` to any holder of CAN_ASSIGN_LEARNING or CAN_DRAFT in the school** (`20260912201500:401-414`, never revoked). | Opening: `LEARNING_ASSIGNED` (with the dates) / `quick_assessment.launched` (with minutes). **No audit trigger on either table.** | Opening: actor, class, time, schedule | Opening yes. **A direct write no.** | With their own session, a teacher can move `closes_at`, `opens_at` or `available_until`, or set OPEN → CLOSED or ACTIVE → ENDED/WITHDRAWN, through PostgREST with no audit row. The status guard checks only the transition. No app code writes these tables directly; they are read only. | **C** |
| S11 | **Per-sitting extend / terminate**. No UI. | One sitting | `assessment_sessions.authoritative_deadline`, overwritten (count + 1, at most 3). Terminate is one-way. | `extend_session_deadline` / `terminate_session` | `assessment_session.deadline_extended` `{old_deadline, new_deadline, minutes, reason, actor}` / `.terminated` `{cause, reason, actor, responses_retained}` | All, reason required | Yes | G1 only | **A** |
| S12 | **Feedback round open / close**, /pimpinan «Umpan balik» | Class × subject × period | `feedback_cycles.state`, `opened_by`/`at`, `closed_by`/`at`. No reopen. | `open_` / `close_feedback_cycle` | `feedback_cycle.opened` / `.closed` `{from_state, to_state, …}` | Actor, scope, time, from → to | Yes (one-way) | No reason. Under O1 as recommended this is a routine window, so it is satisfied. | **A** under O1 (else B) |
| S13 | **Governed versions**: scoring policy, metric catalogue, feedback threshold and question set. SYSTEM_ADMIN or migration only. | Platform | A new immutable row with `supersedes` | `publish_*` | `*.published` `{version, supersedes, note, …}` | All. `note` serves as the reason. | Yes | — | **A** |
| S14 | **Evidence reclassification** (can only weaken a session's class) | Session | `evidence_class_overrides`, append-only | → RPC | `EVIDENCE_RECLASSIFIED` `{from_class, to_class, reason}` | All | Yes | — | **A** |
| S15 | **Certificate revoke**. No UI. Needs CAN_PUBLISH. | Certificate | `certificates.status` ISSUED → REVOKED with `revoked_at`/`_reason`; no `revoked_by`. **The guard allows REVOKED → REVOKED**, so a second revoke overwrites the date and reason on the row (`20260914103000:137-141, 342-358`). | `revoke_certificate` | `certificate.revoked` `{certificate_id, reason}`, one row per call | Actor, time, reason (required) | Yes in the audit. The row is overwritten. | No from-state: a second revoke reads like the first. | **B (minor)** |
| S16 | **A school's own `is_active` / `is_synthetic`**. No UI. | School | `institutions` row, overwritten | **Direct `UPDATE` is granted to `authenticated`.** RLS lets the school's INSTITUTION_ADMIN (and SYSTEM_ADMIN) update the row (`20260912004431:274-281`). The guards do not cover these two columns in production (`20260917100000:92-130`). No app code writes `institutions`. | **None.** No UPDATE audit trigger exists; only `institution.created` is written, on insert. | — | **No** | **`is_synthetic` caps the evidence class of every new sitting** (`derive_evidence_class`, `20260912135314:61-68`). In production, a school's own admin could make a demo school's evidence OFFICIAL, or a real school's SYNTHETIC, with no record. `is_active` decides which schools are offered (`src/components/sekolah.ts:34`). | **C + D** |
| S17 | **Production posture**: `platform_environment.environment`, `local_fixtures_enabled` | Installation | Singleton row, overwritten | Database-owner `psql` in a workflow (`staging.yml`, input `initialise`) | None in the database; the Actions run log only | — | Actions log only | Operator-only and rare, but it decides what may exist in an installation | **C** |
| S18 | `classes.status` (SCHEDULED / ACTIVE / ENDED / CANCELLED). No UI. | Class | `classes` row; the transition guard is `classes_transition` | Direct `UPDATE` granted to HoD and above (`20260912004431:299-305`) | None | — | No | Latent: no screen writes it; `pengajar.ts:171` reads it | **C (latent)** |
| S19 | Evaluator grant/revoke; Evaluation Mode assume/exit (outside production) | Person | `evaluation_evaluators`, `evaluation_sessions`; both append-only | SYSTEM_ADMIN RPCs (`revoke_evaluator` has no executable client grant) | `evaluator.grant` / `.revoke` `{reason, sessions_ended}`; `evaluation.assume` / `.exit` | All | Yes | — | **A** |
| — | Supabase Auth settings (`configure-supabase-auth.yml`) | Project | Outside PINTAR | Management API | The Actions log prints BEFORE and AFTER | — | — | Already ruled in D-093(e): outside PINTAR, so the decisions and journey log are their record | not a gap |

**Totals.**
- **A (9):** S1, S4, S8, S9, S11, S12 (under O1), S13, S14 and S19.
- **B (6):** S2, S3, S5, S6, S7 and S15.
- **C (4):** S10, S16, S17 and S18.
- **D:** S5, S6 and S16 also carry an owner question.

---

## 3. Excluded as workflow, with three history losses seen in passing

These are not switches: class move, year rollover, transfer, enrolment status, Studio content status steps, «Minta membaca lagi», management decisions, integrity and Question Health reviews, school founding, the first-administrator bootstrap, assessment definitions, certificate and report templates, and moving an assignment to a corrected release.

D-093 does not reach them. Three of them keep only the present state, against the owner principle:
- **A rejected transfer loses its request reason.** `transfer_reject` overwrites `reason` (`coalesce(p_reason, reason)`, `20260912004527:168`), and `transfers_audit` records no reason at all.
- **Re-saving a report template deletes the earlier metric selection.** The audit row records only a count (`save_report_template`, `20261002120000`). Which figures a past report showed cannot be reconstructed.
- **Studio content status steps write no audit row.** They are direct `UPDATE`s, stamped only with `reviewed_by`/`reviewed_at`.

Two authority observations, not D-093 and not acted on:
- In SQL, `revoke_role` lets an INSTITUTION_ADMIN revoke a peer INSTITUTION_ADMIN, whom they could not have granted.
- Nothing stops the last SYSTEM_ADMIN being revoked, and the bootstrap never reopens.

---

## 4. Gaps

1. **G1: actor role is never recorded.** This applies to every row.
2. **G2: unaudited paths.** A state can change with no record:
   - S10: assignment windows and status, writable by any teacher holding CAN_ASSIGN_LEARNING.
   - S16: a school's own `is_synthetic`, which decides its evidence class, and `is_active`.
   - S17: production posture.
   - S18: `classes.status`.

   Each is a direct-table grant left in place after the product moved to definer RPCs.
3. **G3: previous state is missing** where a trigger audits a plain update (S5, S6), and on a repeated certificate revoke (S15).
4. **G4: reason is missing** on role revoke (S2), structure deactivation (S7), and the two «Fitur & saklar» switches (S5, S6).
5. **G5: outcome.** The activation audit is written before the account exists (S3). Refused attempts are never recorded anywhere (see O2).
6. **G6: switches that do nothing.**
   - S5 (maintenance mode, registration lock) and S6 (every feature flag) are stored and audited, but no code reads them.
   - A Platform Admin can switch maintenance ON, see «Tersimpan», and PINTAR stays open.
   - Under D-093 the log would then record an operational state that never existed.

## 5. What D-093 will require of work not yet built

- **#148, maintenance and broadcast (D-094).**
  - Maintenance becomes a stream of append-only events, not a boolean overwritten in `platform_config`.
  - Each schedule, change, cancellation, automatic activation and automatic deactivation is its own row, with:
    - actor and actor role, or SYSTEM plus the schedule's id for automatic transitions;
    - the school or schools affected;
    - previous and new state;
    - the reason;
    - the scheduled start and end;
    - the outcome.
  - «Hentikan sekarang» (D-094(h)) is a separate action with its own required reason.
  - The design itself remains #148's.
- **Gate 3, card re-issue / revoke and the inactivity lock (D-088(e)).** Each re-issue or revoke records the actor and actor role, the old card and the new card, the reason, and the outcome. The old credential's row is kept, not overwritten.

## 6. Owner decisions

- **O1: Reason scope.** D-093(b) lists reason among the minimum fields.
  - **Recommendation:** require a reason when a switch turns something OFF, overrides something, or reverses an earlier change:
    - revoke;
    - deactivate;
    - withdraw;
    - close early or extend;
    - maintenance on or off;
    - a flag change;
    - a pass-mark change.
  - A routine ON that is the action's own purpose records its parameters and asks for no free-text reason: grant, activation, card issue, «Sediakan», opening or closing a feedback round.
- **O2: Refused attempts.** Does "outcome" include refusals?
  - **Recommendation: no, for 4.0.** A refusal is not a state change.
  - Recording one would need a second writer outside the failing transaction.
  - Server logs already carry unclassified failures with a reference.
- **O3: The dormant switches S5 and S6.**
  - **Recommendation:** take «Mode pemeliharaan», «Kunci pendaftaran» and the free-key flag form off Konfigurasi now. They promise an effect that does not happen.
  - #148 then builds the real maintenance control under D-093.
  - The alternative is to leave them until #148 replaces them.
  - Either is a change to a visible screen, so it is the owner's call.
- **O4: Close the unaudited direct-write paths (S10, S16, S17, S18).**
  - This tightens a security boundary, so it waits for approval.
  - **Recommendation:** revoke client `UPDATE` (and `INSERT` where unused) on `learning_assignments`, `assessment_assignments`, `institutions` and `classes`. Product writes already go through definer RPCs, and app code only reads these tables.
  - Any future need, such as closing a window early or changing a school's state, becomes an audited RPC under O1.
  - `platform_environment` gets an UPDATE audit trigger.

## 7. Smallest bounded next ticket (not started)

**D093-T1: no operational state changes without a record.** This is S10, S16, S17 and S18; it depends on O4.
- One migration:
  - revoke the direct grants named in O4;
  - add an UPDATE audit trigger on `platform_environment` that records `{from, to}`;
  - first confirm that no self-test or harness writes those tables directly.
- One self-test, red on today's grants:
  - no client role may `UPDATE` a table carrying an operational state unless an audit writer covers it.
  - It also executes the refusal of a direct `closes_at` write and a direct `is_synthetic` write.

It changes nothing a screen does.

**Next, in order:**
- **T2: writers.**
  - Previous state, reason under O1, and `actor_role` in `summary` for S2 revoke, S5, S6, S7 and S15. S5 and S6 move to an RPC with a reason.
  - "No change, no row".
  - A trail assertion over a registry of switch actions.
  - If O3 removes S5 and S6 from the screen, T2 shrinks to S2, S7 and S15.
- **T3: activation outcome (S3).** Write the audit row when the account exists, not when it is authorized. Put the card number and the class of a batch in the summary.

---

## 8. Ruled and done (3 Oct): D-097, T1 and O3

**Ruling.** D-097: O1 (reasons only for consequential negative or reversal actions), O2 (no refused attempts in D-093 for 4.0), O3 (remove the inert controls, keep the schema), O4 (close the direct-write paths after a dependency trace; `platform_environment` checked first).

**Dependency trace**, before any permission changed (static, `main` `327ce90`):

| Where | Writes to the four tables (or the posture) | Effect of the change |
|---|---|---|
| Application code (`src/`) | none; every `.from()` on these tables is a read | none |
| Functions | `assign_release`, `launch_quick_assessment`, `move_learning_assignment_release`, `operator_found_school`, `reserve_institution_namespace`: all SECURITY DEFINER | none; they write as the owner |
| Migrations | earlier verification blocks, applied before this one | none |
| Seeds | run as the owner | none |
| DB self-tests | **fable02 F02-T20, fable05 (two fixtures), fable06 (two fixtures)** activated assignments as the signed-in teacher. F02-T20 even asserted that the direct write works. fable01 F01-T06 attempts are refusals and stay refused. | fixtures moved to the D-041 writer pattern (`as_release_writer`: the person's claims stay, the client role goes), so the capability triggers still decide on the person; F02-T20 now also asserts the teacher's direct write is refused |
| TS self-tests, plants | owner `psql`, or rewrites of definer bodies | none |
| Harnesses (journey, diagnostics, staging walks, Golden School) | owner `psql` or the screens | none |
| Admin and platform paths | `staging.yml` `initialise` (owner `psql`), `found-school.yml` (service-role RPC) | none |
| Held Gate 3 branches | no writes to these tables; they carry the old flag controls only as unchanged lines from their base | none |

**`platform_environment`.** It is deployment configuration, not a runtime switch. Its table comment says "Set to 'production' only by the deployment system" (`foundation_base`). Staging sets it once, in the `initialise` step of `staging.yml`, as the database owner (D-038). The local seed pipeline sets the fixtures marker. No screen or function changes it. Signed-in clients hold SELECT only. `service_role` held INSERT, UPDATE, DELETE and TRUNCATE through Supabase's default privileges (as `audit_log` did, `20260912051935`), and nothing used them. **So no setter was made.** `service_role`'s writes were withdrawn, leaving only the deployment system able to change the posture, and an UPDATE trigger records each change it makes (`platform_environment.changed` `{from, to, database_role}`; nothing when nothing changed). No owner ruling is needed: this enforces the table's own stated intent.

**What changed** (`43f9b07`, `13d2df1`):
- Migration `20261110100000_an_operational_state_has_one_path.sql`:
  - revokes client INSERT and UPDATE on `learning_assignments`, `assessment_assignments`, `institutions` and `classes`;
  - revokes every non-owner write on `platform_environment`;
  - adds the posture trigger;
  - its verification block asserts the grants, the trigger, and that a no-op change writes nothing.
  - Reads are unchanged.
- Konfigurasi:
  - the «Fitur & saklar» section, its tab, `setFlagAction`, `setPlatformConfigAction`, the three result codes and their copy are removed;
  - `feature_flags`, `platform_config`, their RLS and audit triggers stay;
  - `flag_enabled()` stays.
- **F08-P09** (new). Seven direct writes, each refused by privilege (42501), not filtered to zero rows:
  - window move, close and lesson end, plus an insert, by a teacher who may assign;
  - `is_synthetic`, `is_active` and `classes.status` by a school administrator.

  It also checks:
  - the grants and that reads are kept;
  - that the governed functions are still definers a teacher may call;
  - that `service_role` cannot change the posture;
  - that the posture's change is recorded once, from and to.

**Evidence.**
- **Local** (Postgres 16 with the repository's shim):
  - **Red on the old schema:** F08-P09 13 of 13 problems, with `service_role` given Supabase's default grant to make that check bite. F02-T20 red too.
  - **Green after:**
    - the migration applied on that same database;
    - a clean replay of all 147 migrations plus seeds;
    - the full manifest: 457 passed.
    - The 7 failing rows are app-route tests that need a running Next.js server (all `→ 500`), the same as the baseline before the change.
    - The 2 migration-count baselines were moved 146 → 147.
  - `tsc` clean; eslint clean.
- **CI:**
  - Run `37100337054` on `43f9b07` was red on one job, `red case · db-wp8-gates`: the gate's control still expected 8 green rows, and F08-P09 made 9 (it was green on the real Supabase stack, the `service_role` check included).
  - Fixed in `13d2df1`: control 8 → 9, plus four plants that turn F08-P09 red (wp8-11 a teacher's window write, wp8-12 a school admin's `is_synthetic` write, wp8-13 `service_role`'s posture write, wp8-14 a posture trigger that records nothing).
  - **Run `37100797372` on `13d2df1`: green, 33/33**, including the strict self-test contract on the real stack, the upgrade path from the previous schema, and 14/14 WP8 plants.
- **Landed:** `main` `ac56678`. Staging migrated by run `37101563285` (147 migrations, equal to the repository). The migration's verification block ran on the hosted stack, where Supabase's real default grants apply. Vercel deployed. The Konfigurasi removal was verified by the build and the static tests, not walked in a browser.

**Still open, as planned and not started:**
- **T2, the writers.** Under O1: reasons for role revoke and structure deactivation, a from-state for certificate revoke, actor role in `summary`.
- **T3, activation outcome.**
- The three follow-ups in §3 are recorded separately (JOURNEY-LOG items 19–21).

---

## 9. T2 + T3 done (3 Oct): the closure

**Migration `20261111100000_an_operational_change_says_what_it_was.sql`** (commits `37b2105`, `dc838fa`, `dda0cdd`). No `audit_log` change: the summary holds everything below.

| # | Before | Now |
|---|---|---|
| S2 role revoke | no reason; new state only | `revoke_role(p_assignment, p_reason)`: reason required (D-097(a)), kept on the row (`role_assignments.revoked_reason`, written once with the revocation, guarded) and in the audit with from/to state (ACTIVE or EXPIRED → REVOKED). A revoked role is not revoked twice. Grants record the actor's role too (no reason: routine positive). |
| S7 structure deactivation | no reason; descendants not named | `deactivate_school_node(p_node, p_reason)`: reason required (`STRUCTURE_REASON_REQUIRED`). The audit records from/to and names every place closed (a Bagian and its hidden Reguler). |
| S15 certificate revoke | a second revoke overwrote date and reason | A second revocation is refused (`CERTIFICATE_ALREADY_REVOKED`). The certificate guard keeps a revocation's time and reason as first recorded, whatever the path. The audit records from/to status, reason and actor role. |
| S5/S6 inert switches | new value only; no-op saves logged | From/to recorded; a save that changes nothing writes nothing. No reason: nothing in PINTAR writes them any more (D-097(c)). |
| S3 activation (T3) | `account.activation_authorized` written at authorization, before any account existed | Authorization writes only the grant, with `authorized_role`. `handle_new_auth_user` writes `account.activated` in Auth's own transaction once the account exists, so a failed creation leaves no row. The row names the person (also for a new person), the kind, the card number, the authorizer, their role, when they authorized it, and outcome `ACCOUNT_CREATED`. |
| G1 actor role | recorded nowhere | `audit_write` adds `actor_role` to any summary that does not name it, whenever a person acts. This covers every writer, including those classed A, without rewriting them. Helper `audit_actor_role(institution)`: SYSTEM_ADMIN, else the highest active role in that institution. It is revoked from every client role. |
| S16/S18 after T1 | owner-only changes unrecorded | A school's `is_synthetic` / `is_active` and a class's `status`, which only the database owner (or an unused service key) can now change, are recorded from/to with the database role, like the posture in T1. |

**UI.** Konfigurasi «Cabut» and the «Nonaktifkan» question both ask for «Alasan». New codes `ROLE_REASON_REQUIRED` and `STRUCTURE_REASON_REQUIRED` have their own sentences. The journey harness fills the reason in S24, S26 and S26b.

**Gate 3.** The held branch redefines none of these functions, and no Gate 3 functionality was brought onto main.

**Evidence.**
- **Red on the pre-T2 writers** (local, the 147-migration database):
  - **F04-T10:** a second revocation was accepted and overwrote the first; an in-place rewrite was accepted; the record had no from/to.
  - **F09-A02:** an `account.*` row existed before any account; no `account.activated` row, for either path.
  - **F08-P10:** no revoke path took a reason.
- **Green after:** a clean replay of 148 migrations plus seeds; the full manifest, 460 passed. The 7 failing rows are app-route tests that need a running Next.js server, unchanged from the baseline.
- **Plants:**
  - WP8 19/19, including:
    - wp8-15: a revocation without its reason;
    - wp8-16: a deactivation without a reason;
    - wp8-17: a flag no-op recorded;
    - wp8-18: no actor role;
    - wp8-19: an unrecorded owner change.
  - R1 8/8 (r1-4: an intention audited; r1-5: a creation unrecorded).
  - BOB-01 24/24.
  - CI plant `rc5`, re-revocation, proved locally.

## 10. D-093 status

**Every row of §2 now satisfies D-093.**
- **G1:** closed in `audit_write`.
- **G2:** closed by T1.
- **G3:** from/to recorded everywhere.
- **G4:** reasons where D-097(a) requires them.
- **G5:** activation outcome closed by T3; refused attempts are out of scope by O2.
- **G6:** inert controls removed by O3.

**Carried forward (requirements, not D-093 blockers on main):**
- **Gate 3 (held):** card re-issue and revoke must meet D-093 when it lands (§5): actor and role, old and new card, reason (D-088(e)), outcome, old credential row kept.
- **#148:** builds maintenance as append-only events under D-093 (§5).

**Observations, not D-093 gaps:**
- The Konfigurasi audit reader shows neither actor nor summary.
- The class of a card batch is not in the activation row; the learner's placement holds it.
- Items 19–21 (transfer rejection reason, report-template history, Studio content steps) are separate follow-ups.
