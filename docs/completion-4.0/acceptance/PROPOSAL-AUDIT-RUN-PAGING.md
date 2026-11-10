# Proposal for Sharon: a year-end run is one entry in Jejak audit (10 Nov 2026)

**Status:** proposal. Not built. It changes how the audit trail is paged, so it waits for Sharon's review (owner, 10 Nov: «a focused engineering proposal reviewed by Sharon … reuse the current mechanism; don't launch a general audit redesign»).

## The problem (Daisy, design check at `bcecb425`, B9.1)

`Konfigurasi › Jejak audit` reads one page of raw `audit_log` rows: 50, the newest first (`konfigurasi/page.tsx`, `.range(…)` on `(institution_id, at desc)`). Then `lipatKenaikan` (`src/lib/jejak-audit.ts`) folds a run's rows under its `promotion.applied` row, **but only within that page**.

A large run defeats the fold:
- Kelas 5B, with 25 learners, wrote about 84 related rows (enrolments created and ended, memberships closed). They sit at the newest end of the trail: 34 on page 1 and 50 on page 2.
- Each of those rows reads «Termasuk kenaikan kelas 5B · 10 Nov 2026; baris utamanya ada di halaman lain.»
- The run's own row is on **page 3**.

So an administrator reads two pages of near-identical lines before reaching the event they are looking for. With 40 learners it gets worse.

**Shipped now, and independent of this proposal (B9.2):** every related row names its learner and Kelas. They can be told apart even before this lands.

## Intended behaviour

1. **One run is one entry.** It is paged as one row: the `promotion.applied` row.
   - Its related rows open beneath it in «Catatan terkait (n)», as they do today within a page.
   - n counts **all** of the run's related rows the reader may read, not only those that happened to fall on the same page.
2. **Every child stays reachable and attributable.**
   - Each child shows its time, action, record, learner and Kelas.
   - No row is altered, merged or hidden from a reader who could read it before.
3. **Authorization is unchanged.**
   - Both reads go through `audit_log_select`: the platform admin, or INSTITUTION_ADMIN of the row's institution.
   - Nothing is read with elevated rights.
4. **Paging stays stable.** It keeps the same order (`at desc, id`) and the same page size. A row that is not part of a run pages exactly as now.

## Design (reusing the current mechanism)

Two reads per page. Both are under the reader's own row security, through the same PostgREST client.

### Read A: the page of entries

The current query, adding one filter:

```
… .or("summary->>run_id.is.null,action.eq.promotion.applied")
```

- A run's related rows no longer take page slots; its own row does.
- Everything else is unchanged: the order, `range`, and the `eq` on one school (the generic-plan note in the code stays true).

### Read B: the children of the page's runs

```
audit_log where summary->>'run_id' in (<run ids of the promotion.applied rows on this page>)
                and action <> 'promotion.applied'
order by at desc, id
```

`lipatKenaikan` is then given A ∪ B and folds as it does today. Its contract is unchanged; `bagianRun` simply stops occurring for a run whose own row is readable.

### The orphan rule

**This is the boundary to review.** Read A would drop a child whose run's own row the reader cannot read; the child would then appear on no page at all. Today that cannot happen within a school:
- `kenaikan_tetapkan` writes the run's rows and its `promotion.applied` row in one transaction;
- they all carry the Kelas's `institution_id` (`audit_write`, the same `k.institution_id`);
- `audit_log_select` is decided by `institution_id` alone.

So whoever reads a child also reads its parent. To make that a guarantee, not an observation, the change includes a test, and fails closed:
- **(DB test)** every row carrying `run_id` has the same `institution_id` as that run's `promotion.applied` row;
- **(page)** a row with a `run_id` and no readable parent still pages as an ordinary row, by the existing `bagianRun` path. Read A's filter is then widened to keep it: the page reads the run ids it saw in Read B, and Sharon may prefer to drop this branch once the DB test holds.

### Index

The filter in Read A runs over the same `(institution_id, at desc)` scan, which already stops at the page boundary. Read B needs:

```
create index on audit_log ((summary->>'run_id')) where summary ? 'run_id'
```

This is a partial expression index, small: only run rows. It would be a new migration, read-only to every existing row.

## Tests (red on the current page, green after)

- **F-level DB test:**
  - a run of 30 learners (more than 50 related rows) at the newest end of one school's trail;
  - as that school's admin, page 1's Read A holds the run's row and no related row, and Read B returns every related row;
  - another school's admin reads none of either;
  - the platform admin reads both;
  - the institution-equality invariant above is checked.
- **App test (KENAIKAN-A01 extended):**
  - after the 4-learner run plus padding rows, page 1 of Jejak audit shows the run with «Catatan terkait (n)», n equal to the database count;
  - no «baris utamanya ada di halaman lain» line appears;
  - a non-run row's position is unchanged.
- **Rendered check (Daisy):**
  - the 5B run: one entry on page 1, the related rows opening under it with names;
  - keyboard and screen reader through the disclosure.

## Not changed

- Rows, their summaries and their actors are untouched.
- Retention, export and the platform's own trail are untouched.
- No new RPC and no SECURITY DEFINER.
- The paging of every other section is unchanged.

## Questions for Sharon

1. Is paging by entry acceptable for the evidence trail, given that the run's own row stands for the run in the order? Its children carry their own times.
2. The orphan branch: keep the fail-closed fallback, or rely on the institution-equality test alone?
3. Should «Catatan terkait (n)» page itself above some size (for example 200), or open in full?

---

## As built, after Sharon's ruling (10 Nov), on the working tree after `8f16b4b6`

**Accepted with three changes, all built:**

1. **The orphan rule is a database guarantee.**
   - `kenaikan_tetapkan` sets `pintar.audit_run_institution` from the Kelas, beside the run id.
   - `audit_write` refuses a run row with no school, or of another school (`AUDIT_RUN_INSTITUTION`).
   - The page fallback is dropped; `bagianRun` stays as a display fallback only.
   - Test: **F37-K08**.
     - Every run id has exactly one `promotion.applied` row, at the same school as its rows.
     - A plant writes rows inside a run from another school and from none. Both are refused, and the run's own school's row is written. The plant rolls itself back, because the trail is append-only.
2. **Children per run, exact, never truncated.**
   - One `count: exact, head: true` per run on the page, all asked together (`src/lib/jejak-run.ts`).
   - The rows are read only for the run the reader opened (`?run=`), 100 per sub-page (`hal_run`), ordered `at desc, id`.
   - A count that cannot be read still offers «Buka catatan terkait», unnumbered. Nothing is hidden.
   - Test: **JEJAK-A01**.
     - Thirteen runs with 1,310 related rows, more than `max_rows`.
     - Each run is one entry on exactly one page, with its exact n, and no page carries a related row.
     - Every related row is reachable over its sub-pages (230 over three).
     - Another school's admin reads none of them.
3. **`institution_id` in every run read, and in the index.** Every read names the run's school by `eq`.

**One change from the ruling, which Sharon should see: a stored `run_id` column.**

The index as ruled, on `(institution_id, (summary->>'run_id'))`, is not used under `audit_log_select`:
- `->>` is not leakproof, so the planner may not evaluate it before the policy;
- it scanned the school's rows and checked the policy on each;
- locally that meant **1.4 s for one count** at 10,700 rows, and 50 parallel counts all failed.

So:
- `audit_log.run_id` is now `text generated always as (summary ->> 'run_id') stored`: derived from what each row already holds, with no row's content changed;
- the index is `(institution_id, run_id) where run_id is not null`;
- Read A filters `run_id.is.null OR action.eq.promotion.applied`.

Measured locally as Alpha's admin (median of 5):

| Case | Time |
|---|---|
| One count | 1,435 ms before, **16 ms** after |
| Read A, the page | 185 ms before, **9 ms** after |
| Konfigurasi › Jejak audit, a page with no run | **217 ms** |
| The same page with **50** runs | **690 ms** (the worst case, every slot a run) |

**Rendered check** (local Playwright, at 1280 and 390 px, by keyboard):
- Tab reaches «Catatan terkait (n)», and Enter opens it.
- The page stays at the run, and the next Tab stop is inside it.
- Sub-page 2 keeps the place.
- «Tutup catatan terkait» closes it at the same place.
- Nothing scrolls sideways. A pager's absolutely placed screen-reader line had escaped the table frame; `.pin-tabel-bingkai` is now `position: relative`.

**Open, for Sharon:** the parent guarantee. `SHARON-PAGING-PARENT`: a deferred constraint trigger, or test-only.
