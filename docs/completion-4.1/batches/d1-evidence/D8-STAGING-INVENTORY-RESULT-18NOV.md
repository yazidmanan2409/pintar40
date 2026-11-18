# D-8 · Staging inventory of multi-answer questions: the result

Bob, 18 Nov 2026, about 12:58 UTC. Under ruling 55, D-8 (owner-authorised, narrowly scoped and transaction-read-only).
- **Executed by Bob:** Sharon's standing rule keeps staging actions out of her hands.
- **The query:** Sharon's `D8-STAGING-INVENTORY-QUERY.sql`, with one count of all items added for context.
- **How it ran:** `set transaction read only`; counts only; no learner rows read.

**The project, verified first:** `keijhmdtsgrfvnvocfvk`, named `pintar-staging`, ap-southeast-1, ACTIVE_HEALTHY, Postgres
17.6.1.166.

| What | State | n |
|---|---|---|
| `MCQ_MULTI` items, in any state | — | **0** (no rows) |
| Final responses to `MCQ_MULTI` items | — | **0** (no rows) |
| Items of any type (context) | all | 1,388 |

## What follows

**Staging holds no multi-answer content.** Production holds no items at all (counts of 17 Nov), so no real learner can
reach a multi-answer question before the Z repair.

**The one source found is local:** `supabase/seed/learning_cycle.sql`, which has three approved multi-answer items in
«Pecahan» on a published release (Sharon). It reaches only synthetic learners in local runs and CI.

**Ruling 56's condition, applied:**
1. **No entry-path code now:** no content that could reach a learner exists outside synthetic local and CI data.
2. **The walkthrough's fixtures (Daisy's F-1 to F-5) must contain no multi-answer item** until the repair is accepted.
   They are written after Z in any case.
3. **Any content import to staging before the repair is accepted is checked for `MCQ_MULTI` first.** Every staging
   write already needs the owner's authorisation; this check is added to the request.
4. **The repair's regression cases use `learning_cycle.sql`'s «Pecahan» items.** They are the natural fixture.

## Sharon's condition (18 Nov, 13:03): checks, not promises

Sharon agrees that ruling 56 is not triggered, on one condition: points 2 and 3 above are enforced by checks.

1. **Before any staging write that adds content** (a walkthrough fixture, an import, a golden-school run): this
   read-only query runs first, and its result goes in the authorisation request. **A non-zero count stops the write**
   until the repair is accepted. The count must be **0 after the write as well.**

   ```sql
   set transaction read only;
   select count(*) as mcq_multi_items from public.items where item_type = 'MCQ_MULTI';
   ```

2. **The C-2(b) guard is extended** (Second Eye, in the Z window, with the repair's red cases). It fails if any
   walkthrough or pilot fixture, or any content file staged for import, holds `MCQ_MULTI` or «Pilihan ganda banyak
   jawaban». It is lifted with the containment, once the repair is accepted (ruling 56, C-1).
