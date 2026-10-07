# PINTAR 4.0 · Q10: the «not yet» state and the certificate's grade labels

**6 October 2026.** For Yazid and the Second Eye, who held Q10. **Analysis only; nothing is implemented.** The owner asked for:
- D-095(g), D-081 and Alternatives 1–3 in their original context;
- each alternative demonstrated at school pass marks of 60%, 70% and 80%;
- whether certificate eligibility (mastery) should be **separated** from qualitative performance labels, rather than redefining «Cukup» by each school's mark.

**In one paragraph.** The school's mark decides one thing: whether the learner passed, and so whether a certificate is issued (D-081, Dr Gladys's ruling). The grade label is a second, separate statement. The contradiction comes only from its lowest band, «Perlu Pendampingan» («needs assistance»), which can appear on a certificate whenever a school's mark is below 70%. Redefining «Cukup» by each school's mark (Alternative 1b, which I recommended on 30 Sep) removes the contradiction but turns the label into a second statement of «passed», and makes the same word mean different scores in different schools. **The separation the Second Eye asks about is the better answer** (Alternative 4 below):
- mastery stays the school's, binary;
- the label stays one fixed PINTAR scale, the same in every school;
- a certificate simply never carries a label that describes a need.

It is also the smallest change: one scoring-policy version without the lowest band.

## 1. The original context

**The four scales PINTAR had on 30 Sep** (semantic review, `design/PASS-MARK-AND-GRADE-SEMANTICS-REVIEW.md` §1). None of their numbers had ever been approved:

| Scale | Values | Who sees it |
|---|---|---|
| The pass mark | 0.60 everywhere, a code default | The learner («Target untuk bab ini») |
| The certificate grade (predikat) | Sangat Baik ≥ 90% · Baik ≥ 80% · Cukup ≥ 70% · **Perlu Pendampingan below 70%** | **Only the certificate and the public verification page**, sealed in the signed record |
| The teacher's readiness tiers | below 60% · 60–79% · 80% and above («Siap sertifikasi») | Teachers, deans, reports |
| The voice-guide words | Mantap · Berkembang · Perlu penguatan | Copy guidance |

**What happened since, in order:**

- **D-078 (30 Sep), first:** «"Perlu Pendampingan" is not certificate-eligible», implemented «never [as] a certificate-specific threshold … two definitions of mastery must not quietly emerge».
- **The HOLD (30 Sep):** «Do not change the pass mark to 70%, and do not treat 60–69% as failure to reconcile them.» That HOLD produced the semantic review and its Alternatives 1–3.
- **D-081 (30 Sep, Dr Gladys's ruling, relayed by Yazid):** «PINTAR does not choose between a universal 60% and 70% pass mark … [a school] can configure the minimum passing mark for that lesson … without a second definition of passing». Follow-up: per school, per lesson, a whole-number percentage, 0–100, set by the school admin. «The chain: school policy → assignment snapshot → attempt snapshot → one pass determination → result, report, certificate.»
- **D-078 amended with D-081 (30 Sep):** «"Perlu Pendampingan" is a descriptive predikat and does not itself determine pass or fail or certificate eligibility. … The predikat stays a separate descriptive classification, and its bands are not changed as part of D-081.»
- **D-095 (3 Oct)** fixed the teacher's scale as «an independent instructional performance distribution … not the school's mastery or pass threshold». Its working words: ≥ 80% «Mantap», 60–79% «Berkembang», below 60% «Perlu penguatan», and «no Uji Penguasaan, a distinct not-yet state». **D-095(g)** kept two questions apart, which are Q10:
  1. «the missing no-final-test calculation (the not-yet band is never emitted, review F5 / T4)»;
  2. «the certificate grade labels (the predikat bands, semantic review Alternatives 1–3)».

**What is built today** (`main`, `20261102100000`): eligibility is the sealed school mark plus the safety gate and OFFICIAL evidence. That is D-081 exactly, one determination. The predikat is still the fixed 70 / 80 / 90 scale with «Perlu Pendampingan» below 70%. The not-yet state is declared in the metric catalogue and worded («Belum mengerjakan Uji Penguasaan»), but nothing produces it (review F5; D-095(g)).

**Alternatives 1–3 as written on 30 Sep**, when every mark was 60%, under the constraints «don't move 60% to 70%; don't call 60–69% failure; one definition of mastery; no certificate-specific threshold»:

| | As written | Status after D-081 |
|---|---|---|
| **1a** | Move «Cukup»'s floor from 70% to 60% | **Dead:** it only matched while every mark was 60% |
| **1b** | «Cukup» starts at *the assessment's own* pass mark; «Perlu Pendampingan» means «below the pass mark», so it never reaches a certificate. A new scoring-policy version for new sessions | Compatible with D-081 |
| **2** | Keep 60% as a target; a certificate only from «Cukup» (70%) | **Ruled out by D-081 and D-078 as amended:** it is a certificate-specific threshold, a second definition of mastery |
| **3** | No grade on the certificate or the verification page | Compatible; it removes an element of the closed design (D-080) |

**Alternative 4, the separation the Second Eye asks about** (new here):
- **Mastery:** binary, the school's sealed mark, unchanged. A certificate means «passed this school's standard».
- **The label:** one fixed PINTAR scale, the same in every school, describing the score only: Cukup ≥ 70%, Baik ≥ 80%, Sangat Baik ≥ 90%.
- **The change:** the scale **has no band below 70%**, so «Perlu Pendampingan» leaves the certificate vocabulary. A learner who passes a school's mark below 70% receives the certificate with no label line.
- **No contradiction remains:** a certificate is issued only for mastery, and a label that describes a need has no place on it.

## 2. Each alternative at school marks of 60%, 70% and 80%

A Uji Penguasaan, the safety gate passed, scores in whole per cent. «—» means no certificate. «(no label)» means a certificate with no grade line. ⚠ marks a contradiction or a rule broken.

**School mark 60%:**

| Score | Passes? | Today (as built) | 1b · Cukup from the mark | 2 · certificate from 70% | 3 · no grades | 4 · separation |
|---|---|---|---|---|---|---|
| 55% | no | — | — | — | — | — |
| 60% | yes | certificate «Perlu Pendampingan» ⚠ | «Cukup» | — ⚠ passed, no certificate | certificate | certificate (no label) |
| 65% | yes | certificate «Perlu Pendampingan» ⚠ | «Cukup» | — ⚠ | certificate | certificate (no label) |
| 70% | yes | «Cukup» | «Cukup» | «Cukup» | certificate | «Cukup» |
| 75% | yes | «Cukup» | «Cukup» | «Cukup» | certificate | «Cukup» |
| 80% | yes | «Baik» | «Baik» | «Baik» | certificate | «Baik» |
| 95% | yes | «Sangat Baik» | «Sangat Baik» | «Sangat Baik» | certificate | «Sangat Baik» |

**School mark 70%:** every alternative agrees except 3. Below 70% nobody passes, so «Perlu Pendampingan» never reaches a certificate even today.

| Score | Passes? | Today | 1b | 2 | 3 | 4 |
|---|---|---|---|---|---|---|
| 65% | no | — | — | — | — | — |
| 70% | yes | «Cukup» | «Cukup» | «Cukup» | certificate | «Cukup» |
| 80% | yes | «Baik» | «Baik» | «Baik» | certificate | «Baik» |
| 90% | yes | «Sangat Baik» | «Sangat Baik» | «Sangat Baik» | certificate | «Sangat Baik» |

**School mark 80%:** every alternative agrees except 3. The lowest certificate reads «Baik», and «Cukup» never appears, because nobody below 80% passes.

| Score | Passes? | Today | 1b | 2 | 3 | 4 |
|---|---|---|---|---|---|---|
| 75% | no | — | — | — | — | — |
| 80% | yes | «Baik» | «Baik» (1b's Cukup band, 80–79%, is empty) | «Baik» | certificate | «Baik» |
| 90% | yes | «Sangat Baik» | «Sangat Baik» | «Sangat Baik» | certificate | «Sangat Baik» |

**Where they differ: only when a school's mark is below 70%.** D-081 allows any mark from 0 to 100, so that is a real case, not an edge one. At a 50% mark the same pattern runs from 50% to 69%:
- today: «Perlu Pendampingan» on a certificate;
- 1b: «Cukup»;
- 4: no label.

## 3. Separation versus redefining «Cukup»

| Test | Today | 1b | 2 | 3 | **4** |
|---|---|---|---|---|---|
| One mastery definition<br>(D-081, D-086(b)) | ✓ | ✓ formally, but the label's lowest boundary *is* the pass mark, so the label repeats «passed» | ✗ a second, certificate-only threshold | ✓ | ✓ |
| No self-contradicting<br>certificate (D-078) | ✗ below a 70% mark | ✓ | ✓ | ✓ | ✓ |
| Same label, same score,<br>every school | ✓ | ✗ «Cukup» is 50% at one school and 75% at another; two identical-looking certificates mean different things to a verifier | ✓ | — | ✓ |
| Passed → certificate<br>(D-081) | ✓ | ✓ | ✗ at marks below 70% | ✓ | ✓ |
| PINTAR's bands fixed,<br>apart from the school's<br>mark (D-095) | ✓ | ✗ the certificate's bands move with each school | ✓ | — | ✓ |
| Closed design (D-080) | as is | as is | as is | ✗ removes the grade element | the grade line is simply absent for a passer below 70% (DAISY-36 handles the empty slot) |
| Size of change | none | a scoring-policy version with bands relative to each mark, and a calculation per attempt | ruled out | the certificate, the verification page and the design | **a scoring-policy version that drops the lowest band** |

**Why 1b is weaker than it looked on 30 Sep.** It was written when one 60% mark applied everywhere, and «Cukup from the mark» then simply meant «Cukup from 60%». Under D-081 it ties the label to each school's mark, so:
- the bottom of the label scale is a disguised «passed»;
- «Cukup» stops meaning a level of performance;
- a verifier reading two certificates cannot compare them.

The separation keeps each statement to one job:
- **the school says whether the learner mastered the lesson;**
- **PINTAR says how strong the score was, on one scale for everyone.**

**One consequence to accept knowingly.** Under 4, at a school whose mark is below 60%, a learner can hold a certificate while the teacher's D-095 band reads «Perlu penguatan» (below 60%). D-095 chose this on purpose: its bands are «not the school's mastery threshold and do not determine certificate eligibility», and the teacher's page says so («Pita tetap PINTAR … Bukan batas ketuntasan sekolah dan tidak menentukan sertifikat»). It is a teacher's instructional view, not a statement on the learner's certificate.

## 4. The «not yet» state (D-095(g), first half)

| | |
|---|---|
| Canonical | D-095(c): «no Uji Penguasaan, a distinct not-yet state» |
| Today | Declared in the catalogue (`kesiapan.belum_post_test`) and worded («Belum mengerjakan Uji Penguasaan»), but never produced. A learner who has not taken the final test does not appear in that state (review F5) |
| Consequence | The teacher's distribution cannot show who has not yet been tested, which is the first thing a teacher acts on |
| Recommendation | **Build it:** a learner with no Uji Penguasaan result counts in the not-yet state, never in a performance band |
| Implementation | The readiness calculation emits the state (the next metric-catalogue version is published); a red-then-green test; GS-17 walked again |

## 5. What you would rule

1. **The certificate's grade: Alternative 4 (recommended), 1b or 3.** Under 4:
   - a new scoring-policy version for new sessions, whose bands are Cukup ≥ 70%, Baik ≥ 80% and Sangat Baik ≥ 90%, with **no band below 70%**;
   - `engine_version` bumped (D-060);
   - issued certificates keep their sealed predikat (INV-30, D-076(e));
   - the certificate and verification page show the grade line only when there is one;
   - the learner's result page is unchanged.
2. **Whether the certificate should also print the school's mark** («Standar ketuntasan sekolah: 60%»). Not needed for coherence. It would reopen the frozen design (D-080), so it is a separate question for you and Daisy.
3. **The not-yet state: build it** (§4).

Nothing is built until you rule.
