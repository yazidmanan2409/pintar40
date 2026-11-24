# Production Readiness register, draft 2: Sharon's second pass

**Work:** `PRODUCTION-READINESS-REGISTER.md` at `7aae24e0` (`claude/bob-41-master-plan`), sha256 `6333e6f9…`.
Read-only, with no production reads. I reviewed the delta since draft 1 (`899d3aef`) only.

**Verdict: accurate as written. Four additions.**

**What it records correctly:**
- my 18 Nov points;
- the 10-adult envelope (PR-10 met for it, PR-11 a GAP outside it);
- the counsel state ("fit to send", not sent);
- PR-17's proven after-promotion checks;
- ruling 83's run classes.

## Additions

1. **PR-4 to PR-6: the dispatch rights are still unrecorded.** This is the third draft to carry the point. Name who holds repository write access, the dispatch right, today. The owner confirms that list before production holds any data. Until then, a dispatch against production is possible for each person on it.
2. **A new row: Z's carry-overs to production** (ruling 88; my confirmation).
   - While production stays at 111, without the D-1 repair, no package containing MCQ_MULTI is published or imported there.
   - **Before Z's production promotion:**
     - `d1-multi-answer.sql` runs read-only on production as a step-0 count, expecting 0;
     - `step0-Z.sql` runs there too (K-07's floors).
   - **After the promotion, the same proofs as staging:**
     - `v6-pre-request.sql` and `c3w-r3-bahan.sql` OK;
     - line 84 `convalidated` true;
     - the `periksa` call counter rising after a request;
     - its `pg_get_functiondef` md5 equal to main's build.
3. **PR-15 and PR-16, the named support and the second production administrator,** tie to B0 and item 8.
   - With one school and one INSTITUTION_ADMIN, that administrator cannot close their account or lose their role while no one else is usable.
   - But an appointment that simply reaches `valid_until` leaves the school with no administrator, and nothing refuses it.
   - **For the pilot:**
     - give the school two INSTITUTION_ADMIN appointments, or one with an end date past the pilot;
     - name the platform administrator who can appoint a replacement.
4. **PRQ-1, the watch: one clarification.** "Still off" means the schedule. Each run up to #203 and #48 is *skipped*, which shows the gate holds. It does not show the fail-closed test (a missing secret). That test is still to run at switch-on, as PR-4 says.

**Nothing in draft 2 authorises an action, and nothing in it is sensitive.**
