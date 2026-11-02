# Batch 0 · Deliverable 5 · Phase 0 corrections (2 Nov 2026)

The six corrections the owner required on 2 Nov. Documents A–G are amended **in place**; no second register is created.

This file records each correction:
- what changed;
- where it changed;
- for correction 2, the full F-4 plan, which is new content.

| # | Correction | Where it now lives | Status |
|---|---|---|---|
| 1 | Repository visibility | A §2 and §5, C W0.1, D graph, E batch 0 «Needs first», F F-1 | Done |
| 2 | F-4 answer-key remediation plan | §2 below; F F-4 points here | Done (plan); **owner decision required** |
| 3 | Critical path validated | E (rewritten §§ Schedule, Resources, Assumptions) | Done |
| 4 | Migration 162 brief | `07-MIGRATION-162-BRIEF.md`; F F-5 points there | Done (brief); **owner authorisation required later** |
| 5 | Internal acceptance before production authorisation | E batches 10–11 reordered; G §4 gates 5 and 6 swapped; D graph | Done |
| 6 | Terminology reconciliation | `08-TERMINOLOGY-BRIEF.md`; F F-13 points there | Done (brief); **Dr Gladys's written answer required** |

**Also corrected, found in Batch 0:**
- **«No CI since 19 Oct; the runner change broke it» was wrong.**
  - The last CI before Batch 0 ran on **9 Oct** and was **green**: run 37930520507, branch, 001a357.
  - Nothing ran after that. Nothing had failed.
  - The image change (`ubuntu-latest` = Ubuntu 26.04, Docker 29, psql 18, Node 24 for actions) was a **risk**, not an observed failure.
  - Batch 0 measured it (deliverable 2). Wording corrected in A, D, E and G.
- **The CI cost premise.** «224 minutes remain» was a governance figure. GitHub bills **0 ms** for this public repository (D-143), so the allowance is a governance limit only.

---

## 1. Repository visibility (D-143)

**Removed:**
- the «make the repository private» prerequisite from D (node Y0) and E (batch 0 «Needs first»);
- the recommendation «making the repository private again» from A §5.

D-143 stands: the repository is public by the owner's choice.

**Added:**
- **Branch protection on `main` is an owner action required before the next merge to `main`**, whichever batch that is. It replaces Y0 in D.
- The settings are proposed in deliverable 4 §6 R-1.
- Claude cannot set or verify branch protection from this session.
- The Batch 1 entry conditions (deliverable 9) carry it as a precondition for that batch's merge, not for its start.

## 2. F-4 · Answer keys and content sources: remediation plan

**Starting point (fact, deliverable 4 §4.2):**
- **43 tracked files hold real assessment items with their keys:**
  - 20 chapters × (`.paket.json` + `.xlsx`) in `docs/onboarding/konten/`;
  - the sample workbook in `docs/onboarding/contoh/`;
  - **two full copies of SD5 Bab 1–2 in `audit/fixtures/`**.
- **4 more** exist only on branch `claude/adoring-feynman-njmjll`: the internal *Strategi Pembelajaran* demo.
- The repository has been **public since 2 Nov (D-143)**.

### 2.1 The principle

> **Removing the files does not make the answers confidential again.**

Anything public may already have been cloned, forked, cached or indexed. Neither git-history deletion nor a later return to private visibility can recall a copy.

So for every item that was public, the only sound assumption is: **the item and its key are known.** The remedy for assessment integrity is **new items**, not hiding old ones.

### 2.2 Which items matter: real assessment versus practice

| Use of an item | Does public exposure matter? | Action |
|---|---|---|
| **Pemetaan Awal** (diagnostic) and **Uji Penguasaan** (mastery; certificates follow from it) | **Yes.** Results are evidence about a learner and lead to certificates (J8). A learner who has seen the key invalidates the evidence | **Regenerate before any real learner uses that chapter** (§2.4) |
| **Uji Cepat** (teacher's quick check) | Moderate. It informs teaching, not certification | Regenerate with the chapter if convenient; otherwise accept and note it |
| Practice and worked examples inside lessons (Bacaan, Contoh) | No. They are meant to be seen | None |
| Synthetic fixtures (10 files, 0 real items) | No | None; they stay as test data |
| The internal demo (Strategi Pembelajaran; educators as learners, J9) | Low. An internal educator demo, not school assessment | Regenerate only if it is ever used for real professional-development credit |

**Per chapter, before real use:**
- the owner (or the content lead) marks each of the 20 chapters as **«used for real assessment»** or **«demo only»**;
- only the first group needs regeneration, with its Pemetaan Awal and Uji Penguasaan items (Uji Cepat optional).

### 2.3 Where content lives from now on: private store and access control

| Step | Owner of the step | When |
|---|---|---|
| (a) Create a **separate private store** for content sources and keyed builds. Options: a private GitHub repository `pintar-konten` (simplest; same tools), or a restricted Drive/SharePoint folder. **Recommendation:** a private repository with branch protection | Owner | Before Batch 1 starts |
| (b) **Named access list:** the content lead (Lana), the content reviewer, the owner. Nobody else; no CI token except a read-only deploy key used by the import workflow | Owner | Same |
| (c) Move the **new** (regenerated) items there only. **Do not move** the exposed ones as if they were still secret: mark them «terpapar 2 Nov 2026 (D-143)» | Content lead | When regenerating |
| (d) **Change the repository's dependence on keyed files** (Batch 1, W5.2): the guard L4-C01 and the journeys that import a real chapter instead use the synthetic `pd-uji-*` fixtures or a keyed build fetched at CI time from the private store with a read-only key. `audit/fixtures/sd5-matematika-bab{1,2}.paket.json` are replaced by synthetic equivalents | Claude (Batch 1) | Batch 1 |
| (e) **Stop new exposure:** the B0-C guard already refuses any new undeclared `.paket.json` or `.xlsx` anywhere (SEC-G02, pre-commit). After (d), the `nyata-F4` entries are removed from the allow list as the files leave the tree, so the guard then refuses any real key | Claude | Done (guard); Batch 1 (removal) |

**Whether to remove the exposed files from the tree at all:**
- Removing them reduces **convenience** of access: fewer casual readers, no search-engine snippet from the current tree.
- It does not reduce **knowledge**.
- **Recommendation:** remove them from the tree in Batch 1, once (d) means nothing needs them, and say why in the commit.
- Removing source material needs the owner's authorisation (2 Nov boundaries), so it is asked as part of F-4.

### 2.4 Regeneration before real use

- **Scope:** Pemetaan Awal and Uji Penguasaan for every chapter marked «used for real assessment».
  - Measured in the 20 exposed packages (619 items): **80 Pemetaan Awal** (`PRE_TEST`, 4 per chapter) and **160 «Cek penguasaan»** (`POST_TEST`, 8 per chapter). The other 379 are practice (no `use`).
  - For all 20 chapters: **240 new items with keys, rationales and misconception codes**. Practice items need no regeneration.
- **Who:** the content lead, through Studio's own path (upload → review → approve → publish), on staging first.
  - This is also the W6.5 Studio proof's natural material.
- **When:** before the first real school uses the chapter. It is **not** on the engineering critical path, because Gate 6 uses synthetic or demo schools. It **is** on the path to real schools (PRODUCTION READY).
- **Check:** a regenerated chapter has **no item stem identical to an exposed one**. A one-off comparison against the exposed set is listed under Batch 9.

### 2.5 Git-history exposure

- Every exposed version stays in history and on the branch above.
- **A history rewrite is not authorised and is not recommended.**
  - It would break every clone and reference.
  - It would not recall copies already taken.
- **Recommendation:** no rewrite.
- **Optional (owner):** delete the branch `claude/adoring-feynman-njmjll` if the internal demo is not needed. Same caveat: this reduces convenience, not knowledge.

### 2.6 Credentials

**None found** in the tree or in any reachable commit (deliverable 4 §3), so **no rotation is required by this finding**.

Recommendations R-2 (secret scanning and push protection) and R-5 (review issues, PR comments and logs) remain with the owner.

### 2.7 What the owner decides (F-4, restated)

| # | Decision | Recommendation |
|---|---|---|
| F-4a | Private content store, and who has access | A private repository `pintar-konten`; access: content lead, reviewer, owner |
| F-4b | Authorise Claude in Batch 1 to replace the two real-chapter fixtures with synthetic ones, and to remove the exposed keyed files from the tree | Yes |
| F-4c | Which chapters are «used for real assessment» | Owner or content lead marks the 20 |
| F-4d | Regenerate those chapters' Pemetaan Awal and Uji Penguasaan before real use | Yes; content lead, via Studio |
| F-4e | History rewrite | **No** |
| F-4f | Keep or delete branch `claude/adoring-feynman-njmjll` | Owner's choice; no security effect on what is already public |

The content-source migration is outside Batch 0 except for the preventive guard, which is in place.

## 3. Critical path

See E, rewritten:
- schedule with lanes and real parallelism;
- the assumptions behind every duration;
- the measured CI cost.

Testing is not shortened.

## 4. Migration 162

See `07-MIGRATION-162-BRIEF.md`.

## 5. Internal acceptance before production authorisation

**The order (E batches 10–11, G §4):**
1. Gates 1–4.
2. **Release candidate frozen and verified on staging.**
3. **Gate 5: internal human acceptance on that staging candidate** (scenarios S-1 … S-16, unaided, observed).
4. **Owner GO for production.**
5. **Batch 11: the rehearsed production release.**
6. **Gate 6: production verified.** The production-applicable checks are repeated after the deploy:
   - critical journeys on production;
   - Auth and mail by received headers;
   - facts: production equals the candidate;
   - a short owner-observed re-run of the scenarios that touch production-only paths (sign-in, mail, certificate verification by QR).
7. **Owner approval.**
8. **Dr Gladys** is invited.

**Why:**
- People find defects that automated checks miss. Finding them after production has been changed costs a second production release.
- The production re-check proves the release did not change what was accepted.

## 6. Terminology

See `08-TERMINOLOGY-BRIEF.md`. No wording changed.
