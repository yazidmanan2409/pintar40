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

## Addendum, 16 Nov 2026 20:20 UTC: the conditions built, at `68ebe2fda37c03016ddca36d9668418865f8d587` on `claude/e-runner-prep`

**What I did:**
- ran every self-test myself, offline: no keys, the proxy pointed at a dead port, a scratch copy. The results were **runner 125/0, score 44/0, kit 33/0 and report 21/0**, with no FAIL anywhere;
- read the `--pack-sha` gate and `score.mjs`'s flag hash and critical rule.

**Verdict: PASS. My (a) to (c) are met.**
- **The pack SHA is a hard gate:** `--pack-sha` must be 40 hex characters. A live run without it is refused, and the run record carries `pack_sha`.
- **The live gate also refuses** if kit, score or report have drifted from MANIFEST.json.
- **`score.mjs`:**
  - It **checks the flags file's SHA-256 before parsing**, and refuses on a mismatch or with no hash given. A changed flags file is never scored.
  - "Critical" means any valid item whose resolved correctness is 0, and Q1 and the critical rule read the same resolved table, which is my (b)3.
  - Q1 and Q2 are marked PROPOSED until the owner freezes them.
- **`kit.mjs blind`** is built from allowlists and shows only schema-valid items, so no model or request field can reach judges or me.
- **`report.mjs`** refuses unless the map matches its committed hash and the final scores exist, and it never writes scores.
- **The pack's §4.3b interpretations are accepted:**
  - an item is accepted when its burden is at least 1 after resolution, so a 0.5 average is not accepted;
  - "upheld" means the third educator scores the item 0;
  - a malformed item is voided on its own and never shown.
- **One process note, not code:** `--flags-sha256` is typed by the operator. The report should show that it equals the hash committed **before** the judges' sheets were exchanged, with both commit times, so the check proves order and not only integrity.
- **The freeze is confirmed on this head** for E's offline preparation. No call, key or spend is authorised.

## Addendum, 17 Nov 2026 08:40 UTC: ruling 48. §4 is frozen.

**THE FROZEN PACK: `ecb0d3c48b3a1ec0623253f3a32097ea5c7b38f4`** (`docs/completion-4.1/E-DECISION-PACK.md`, revision 4, on `claude/bob-41-master-plan`).
- **This is the SHA the runner's `--pack-sha` must carry** for every paid call.
- A run carrying any other SHA is outside the frozen rules.

**What I checked, from the diff `c3112336..ecb0d3c4`, and §4 at `ecb0d3c4` (lines 149 to 261):**
- **§4.2 is exactly the owner's amendment of 16 Nov, plus my five conditions:**
  1. flags blind and committed before any score is seen;
  2. a reason with every flag, and a rejected flag stays rejected;
  3. counts per provider after unblinding;
  4. the audit's limit stated;
  5. order, not only integrity.
- **§4.3a** is approved as proposed: Q1 at least 24 of 30, and Q2 each criterion at least 1.0. It states the freeze before the first paid call, Q1 and the critical rule reading one resolved table, and the lost-chapter edge case.
- **§4.3b** matches `score.mjs` as I passed it (`68ebe2fd`).
- **Nothing else in §4 changed in substance.**

**Two wording points.** Neither changes a rule. **Do not edit §4 for them,** because any edit to §4 needs a new freeze and a new SHA.
1. §4.2's disclosure still ends "(open, §6)". At the same commit, §6 records it as **decided**: Sharon is the key checker, with the owner's safeguards. Because the runner pins the whole commit, **§6 at `ecb0d3c4` governs.** Note it in §6 or in the ruling's record, not in §4.
2. **The safeguard "the same process applies to both providers"** is in §6 and not in §4.2. It binds through the same commit, and I will apply it as written.

**My role, as I will carry it out under ruling 48:**
- **Blind:** I see only the blinded items, with no judge's score, and I am the same for both providers.
- **Each flag gives a reason.** All flags are committed, and their SHA-256 recorded, before any score is revealed.
- **My flags only route an item** to the third educator. **Every final correctness and acceptance decision is the educators'.**
- **After unblinding,** the report lists my flags per provider, with the educators' decisions.

**Still: no call, no key, no spend.** G2, Anthropic's sub-processor list, is read at the pre-run step.

## Addendum, 08:50 UTC: `03082b0528ef156a0f9438b244dca8087d01f382`. §4 is unchanged, so the frozen SHA stands.

- **I diffed §4 (from "## 4 · Scoring rules" to "## 5") at `ecb0d3c4` against `03082b05`: byte-identical.** `--pack-sha ecb0d3c48b3a1ec0623253f3a32097ea5c7b38f4` stands.
- **The §6 clarification is right:** §4.3's gate of at most 1 critical error in 30 stays in force beside Q1 and Q2. That is how I read §4.3 at `ecb0d3c4`.
- **G2 going to the owner's browser is accepted.** The pre-run step stays blocked until it is read.

**The run caps: Bob's proposal is accepted, with two notes.**
- **The runner: `--cap-provider 5`.** That is the binding cap, and the worst case of US$0.764 per provider, every retry included, sits well under it.
- **`--cap-total 12` cannot bind:** two providers at most US$5 each make US$10.
  - **Either set it to 10,** so that both gates are real,
  - **or keep 12 and state that the per-provider cap is the effective bound.**
  - I prefer 10. Both are far under the owner's US$25 ceiling.
- **Provider-side hard limits at US$5 each,** Anthropic and OpenAI, set in each console before the run, as E revision 2's backstop.
  - The runner's reservation stops calls before its own cap. The provider's limit catches a leaked key or a runner fault, which is my T2 reasoning.
  - Record each limit's screenshot, or its read-back, in the run's evidence.
- Still no call, key or spend until the owner's run authorisation.

## Addendum, 17 Nov 13:15 UTC: `nilai-juri.mjs` and the judges' guide (`9e3589ed`)

**What I compared:** `nilai-juri.mjs`'s `j3Needs` and `json` against the frozen `score.mjs` (`68ebe2fd`), its header lines 24 to 40 and `CRITERIA_02`.

**(a) The J3 routing matches `score.mjs`'s resolution exactly.**
- **Correctness** is routed when J1 and J2 differ **or** the item is flagged. That is score.mjs's "J1 ≠ J2, or flagged → J3's correctness, final".
- **A 0–2 criterion** is routed when `|J1 − J2| = 2`, over all four: `keselarasan`, `pengecoh`, `bahasa` and `beban_tinjau`, which map to score.mjs's `alignment`, `distractors`, `language` and `review_burden`. That is score.mjs's "gap 2 → the median of J1, J2 and J3".
- **A gap of 1 is not routed,** which matches "the average".
- **The self-test covers all three routes,** a differing correctness, a gap of 2, and a flag. The flag's reason reaches J3 as `catatan_pemeliharaan_kunci`, a reviewer's note, which is A5.
- **The sheet now carries `beban_tinjau` and `alasan`,** so Q1 can be scored. The frozen kit's template is left untouched, which is right.

**(b) The order: make it mechanical, not procedural.** `j3` reads the flags file and the two sheets, but does not verify them.
- **Required (J3-H):** `nilai-juri.mjs j3` takes `--flags-sha256` and `--sheets-sha256 <J1> <J2>`, and refuses on any mismatch, as `score.mjs` does for the flags. Then:
  - J3 is routed only from the sealed flags;
  - J3 is routed only from the sheets whose hashes were committed **before** it ran;
  - **the audit's order holds by construction:** the flags hash, then the J1 and J2 hashes, then J3, then the map.
- **`json` should verify the same two sheet hashes, plus J3's own,** so that what reaches `score.mjs` is exactly what was committed.

**Accepted:**
- `slot` runs on the owner's Mac from the map, so the provider block stays sealed.
- **The "PROPOSED" wording in `score.mjs`'s output** is corrected in the results document, not in frozen code. **The results document must cite ruling 48 and `ecb0d3c4`** as the approval.
- **`PANDUAN-JURI.md`'s Indonesian is Daisy's.** I check only that it states nothing beyond rubric §5 and pack §4. I will read it when she has passed it.
