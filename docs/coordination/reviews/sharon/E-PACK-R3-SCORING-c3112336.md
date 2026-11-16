# E · decision pack revision 3: my role in §4.2, and the threshold in §4.3a

Sharon, 16 Nov 2026 (19:50 UTC). Read-only. **What I reviewed:**
- `docs/completion-4.1/E-DECISION-PACK.md` on `claude/bob-41-master-plan` at `c3112336ccd56d0e8e9f99a55ea5ee0956fd353d`, §4.1 to §4.5;
- `c3-eval` as I last read it (`ecfbbecc`).

No calls are made, nothing is spent, and no material leaves PINTAR.

## A disclosure that matters more here than before

**I am an Anthropic model, and Anthropic is one of the two providers being judged.**
- In §4.2 I am no longer only checking facts. I check keys, and my flags send items to the third educator. A biased flagger could route one provider's items to extra scrutiny more often.
- **And blinding is weakest against me:** I may recognise output in the style of my own model family more readily than a human would.
- **The safeguards I ask for are in (a) below:** my flags are sealed before any score is seen, and flag rates are reported per provider after unblinding.
- **The owner may prefer a key checker who is not an Anthropic model.** That is the owner's decision. I will do the role as written if asked.

## (a) Is §4.2 as amended workable and auditable? Yes, with four conditions.

1. **My key check is blind and comes first.**
   - I see only the blinded items. I commit my flags, with their SHA-256 recorded in the evaluation record, **before** I see either judge's score.
   - Otherwise the check is anchored on theirs and is not independent.
2. **A flag records its reason** (for example "option C also satisfies the stem"). It goes to the third educator as advice beside the judges' reasons. The third educator's decision is final, and **a flag the educator rejects stands as rejected,** with no second flag on the same item.
3. **Flag rates are reported per provider after the map is opened:** the number flagged, and the number of flags the educators upheld. This is how my own bias, if any, becomes visible.
4. **What the process audit can and cannot show:**
   - It can show that each judge's scoresheet was committed, and its hash recorded, before the sheets were exchanged; that every disagreement and every flag reached the third educator; and that the map was opened only after every decision was final, matching its committed hash.
   - **It cannot show** that two humans did not confer outside the record. The report should say so in one line.

## (b) Does §4.3a interact with §4.1 or with the sealed map? Three points.

1. **Missing and malformed items are consistent across Q1 and Q2.**
   - A lost chapter (15 items at 0) fails Q1, since at most 15 of 30 can then be accepted.
   - **It can still pass Q2:** if the other 15 all score 2, the average is exactly 1.0. That is harmless, because Q1 already excludes the provider.
   - Say so in one line, so that no reader takes Q2 as a second guard against lost chapters.
2. **The threshold must be frozen before the first paid call, not only before the map is opened.**
   - §4 says rules are "frozen before the first call", but §4.3a is "PROPOSED … not frozen".
   - **Required:**
     - the owner approves §4.3a, and the pack's SHA at approval is recorded;
     - the runner's provenance names that SHA, which needs one field (see (c));
     - the first live call comes after it.
   - A threshold set after the drafts exist, even blind, is open to adjustment once the drafts are seen.
3. **"Accepted" in Q1 uses the resolved key, flags included.** A flagged item that the third educator rules wrong is not accepted, and it counts toward the critical-error rule.
   - The two rules count wrong keys from the same resolved table. State that, so the two counts can never disagree.

## (c) Does the runner or kit need a change? Two small ones, both offline.

1. **A scoring script, with its own self-test** (for example `kit.mjs score`).
   - Scoring by hand across 60 items, with averages, medians and two thresholds, is where an arithmetic slip would decide qualification.
   - The script reads the committed, blinded scoresheets and the resolutions, and computes:
     - per-item resolved scores (the average when 1 apart, the median of three when 2 apart);
     - the critical-key count, Q1 and Q2;
     - the §4.5 figures, later.
   - It is self-tested on synthetic sheets that cover every rule's edge: a lost chapter; Q2 at exactly 1.0; a flag upheld, and a flag rejected.
   - It is run by the operator, and its output is attached to the report.
2. **Provenance names the frozen pack's SHA.** It is one field in the run record, and the runner refuses a live run without it. That ties every paid call to the rules in force.
3. **Unchanged:** the runner's caps, gates and adapters (my `E-RUNNER-4a591fa3.md`).
   - `kit.mjs blind` must strip every field that names a provider or model (`model_version`, request ids and the like) from what judges and I see.
   - A one-line check of that belongs in the script's self-test.
