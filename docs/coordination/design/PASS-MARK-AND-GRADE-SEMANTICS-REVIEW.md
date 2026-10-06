# Pass mark, grades and «Perlu Pendampingan»: semantic review

**For Yazid, 30 Sep 2026.** Requested by his HOLD on BOB-48(4) and D-078(b)'s implementation. **Read-only; nothing is implemented.**

**Sources:** two independent traces, one of the code (migrations, `src/`, `hle.ts`) and one of the documents (docs/rebuild, ADRs, the spec, DECISIONS, the terminology packages), with file and line references. The coordinator verified the key points at source.

## 1. The finding in one paragraph

PINTAR has **four overlapping scales, and no decision ever approved the numbers of any of them:**

| Scale | Values | Where it comes from | Who sees it |
|---|---|---|---|
| **The pass mark** (`passing_rules.mastery_min`) | **0.60** on every product path: the package import (`20261010100000:127`), every Uji Cepat (`20261020100000:141`), all seeds. There is no workbook field; Studio's builder takes free JSON. | A code default (BOB-04, 24 Sep), first seen in a test fixture. **No D-entry.** The scoring policy itself says "no invented pass mark" (`20260914091500:57-61`). | The learner, as «Target untuk bab ini: 60%» on the result page. DAISY-26 renamed it: "the chapter's target, not a pass mark". |
| **The grade bands** (predikat) | Sangat Baik ≥0.90 · Baik ≥0.80 · Cukup ≥0.70 · **Perlu Pendampingan ≥0.00** | The FABLE-04 migration (`20260914103000:38-43`), described as a "scoring interpretation". **No D-entry or ADR approves the values.** | Only on the certificate (card and A4) and the public verification page. Stored only in the signed payload. |
| **The readiness tiers** (metric catalogue, `class.readiness_distribution`) | «Butuh pendampingan ekstra» <0.60 · «Perlu review» 0.60–0.80 · **«Siap sertifikasi» ≥0.80** with the safety gate | The old comprehensive hand-off, carried through MC-1 to MC-3 (`20261025100000:60-66`) | Teachers (`/mengajar/…/bukti`), the educator and dean summaries, reports |
| **The voice-guide bands** | Mantap · Berkembang · Perlu penguatan, with no thresholds | `PINTAR-VOICE-GUIDE.md:241` | Copy guidance only |

There is also a **fifth, hidden threshold**: `src/app/_intel.ts:51` hard-codes 0.6 to choose the teacher's action sentence («tindakan.ulangi» or «lanjut»), and no catalogue row declares it.

## 2. What one learner sees today, at each score

An 8-question Uji Penguasaan with the 0.60 pass mark, and the safety gate passed:

| Score | Result page | Certificate | Predikat on the certificate | Public verification | The teacher's readiness tier |
|---|---|---|---|---|---|
| 4/8 = 0.50 | target not met | none | — | — | «Butuh pendampingan ekstra» |
| **5/8 = 0.625** | target met; «…sudah memenuhi syarat» | **issued** | **«Perlu Pendampingan»** | «Memenuhi capaian» + «Perlu Pendampingan» | **«Perlu review»** |
| **6/8 = 0.75** | target met | issued | «Cukup» | «Memenuhi capaian» | **«Perlu review»** |
| 7/8 = 0.875 | target met | issued | «Baik» | «Memenuhi capaian» | «Siap sertifikasi» |
| 8/8 = 1.00 | target met | issued | «Sangat Baik» | «Memenuhi capaian» | «Siap sertifikasi» |

**The contradictions:**
- At 0.625 the learner holds a Sertifikat Penguasaan that also says they need assistance.
- At 0.625 and 0.75 they hold a certificate while their teacher's page says they are not yet «Siap sertifikasi».
- «pendampingan» means below 0.60 on the teacher's scale and below 0.70 on the certificate.

## 3. What the certificate is defined to certify

- **Eligibility today:** OFFICIAL evidence, a certifying mode, the safety gate, and `mastery ≥ mastery_min` (`certificate_eligibility`, `20260914103000:166-220`). The predikat takes no part.
- **The baseline:** the certificate proves mastery on a formal stage, and "Mastery requires the overall passing rule **and** 100% on safety-critical items" (INV-10; doc 07). D-076(d) says the certificate proves "mastery at the pass mark".
- **So by the canonical texts, the pass mark is the mastery standard.** The bands were added later as an interpretation. They were never meant to redefine mastery, but their lowest label now contradicts it.

## 4. The smallest coherent alternatives

**Constraints (Yazid):**
- don't move 60% to 70%;
- don't call 60–69% failure;
- one definition of mastery;
- no certificate-specific threshold.

### Alternative 1: the pass mark is mastery, and the grades describe results above it (recommended)

- **The one definition:** mastery is meeting the assessment's own pass mark with the safety gate. That is Sertifikat Penguasaan eligibility, unchanged.
- **The grade bands are re-anchored so the lowest band means "below the pass mark":**
  - «Perlu Pendampingan» = below the pass mark;
  - «Cukup» = from the pass mark to 0.80;
  - «Baik» ≥0.80;
  - «Sangat Baik» ≥0.90.
  - **1a (simplest):** move Cukup's floor from 0.70 to 0.60. It only coincides while every pass mark is 0.60.
  - **1b (robust):** Cukup starts at *the assessment's own* pass mark, wherever an author sets it.
- **Consequences:**
  - «Perlu Pendampingan» can never reach a certificate, by construction. D-078's rule holds with no certificate code; BOB-48(4) shrinks to nothing, or to a closure test.
  - 60–69% reads «Cukup». Nothing becomes failure, and 60% stays.
  - It is a new scoring-policy version for new sessions only (`pintar-scoring/2`). Sealed certificates keep their signed predikat.
  - D-060: the predikat is a scoring interpretation, so `engine_version` is bumped.
- **Coherence with the teacher's scale** (a separate sub-decision, since readiness is a catalogue metric and a change publishes MC-4): the tiers' thresholds (0.60 / 0.80) can stay, but their names contradict the certificate. «Siap sertifikasi» at 0.80 while certificates issue at 0.60 is untrue. Rename, for example, «Belum mencapai target» · «Tuntas» · «Mantap». Daisy owns the words, under Terminology v1.

### Alternative 2: keep 60% as the chapter's *target*; the certificate starts at «Cukup» (0.70)

- Mastery for the certificate is «Cukup» or above (BOB-48's `predikat_semantics`). The 60% on the result page becomes a learning target that is not mastery.
- **Consequences:**
  - two numbers, and two concepts, are visible to learners (the target at 60%, the certificate at 70%);
  - the result, certificate and teacher copy is reworded so 60–69% is "target met, certificate from «Cukup»" (the words «sudah memenuhi syarat», «Memenuhi capaian» and «Diterbitkan sekolah bila murid memenuhi capaian» all change);
  - no score change and no engine change, but a certificate is refused to a learner who met the stated target.
- Close to what the HOLD cautions against, though it does not call 60–69% failure.

### Alternative 3: no grade on the certificate

- Eligibility stays at the pass mark. The predikat is removed from the certificate and the verification page (their record block keeps date and number only).
- **Consequences:** the smallest code change and no scoring change, but it removes an element of the design D-080 has just closed, and it hides rather than resolves the band's meaning.

**Coordinator's lean: Alternative 1b, with the tier names aligned.**
- It keeps 60%, calls nothing failure, and keeps one definition of mastery (the assessment's own pass mark).
- It makes «Perlu Pendampingan» mean what its words say, and makes D-078 true by construction.
- It gives the certificate, the verification page and the teacher's page one story.

## 5. Other findings from the trace (separate from the decision)

| # | Finding | Kind | Suggested owner |
|---|---|---|---|
| F1 | **An Uji Cepat issues certificates.** QUICK has `certifies = true` (`20260914093000:62`), and the player requests issuance on finish, while the teacher's copy says «Satu Uji Cepat tidak menerbitkan sertifikat» (`mengajar.cepat.rv3`, `tur.pg.4.isi`). Doc 07 names only the cycle's post-test as certificate-eligible. | **Product contradiction, FOR YAZID.** Lean: only the cycle's Uji Penguasaan certifies. | Yazid, then Bob |
| F2 | `predikat_bands` is outside the scoring-policy immutability guard (`20260914091500:125-131`), so bands can be edited in place, against INV-29. | Defect | Bob |
| F3 | `verified_credentials` («Sertifikat terbit… berlaku») counts ELIGIBLE (unsigned) and SUPERSEDED rows, because both have a null `revoked_at`. | Metric defect (MC-4) | Bob |
| F4 | The 0.6 in `_intel.ts:51` is undeclared. It should come from the pass mark or a catalogue row. | Defect | Bob with Daisy |
| F5 | The readiness calculator never reads `requires_safety_gate` and never emits `belum_post_test`. | Metric defect | Bob |
| F6 | «Semua soal penting sudah dijawab dengan tepat» shows even when an assessment has **no** safety-critical items (a vacuous gate). Uploaded items never set it. | Copy defect | Daisy |
| F7 | `session_outcome` and `certificate_eligibility` disagree when there is no pass mark (`lulus` null against `passed` true). The spec says "do not unify without a ruling". | Known, needs a ruling | Bob, later |
| F8 | ADR-0007 §5 and doc 07 describe an institution-level pass threshold that does not exist. | Doc drift | Coordinator |
| F9 | Neither the 0.60 pass mark nor the band values has ever had a decision entry. | Governance | Yazid's ruling here closes it |

## 6. What Yazid decides

1. **Alternative 1 (1a or 1b), 2 or 3.** The coordinator leans to 1b.
2. **If 1, whether to align the teacher's tier names now.** The names are Daisy's under Terminology v1; the change publishes MC-4.
3. **F1:** does a single Uji Cepat ever issue a Sertifikat Penguasaan?

F2 to F8 are then placed as small tickets. Nothing is built until he rules.
