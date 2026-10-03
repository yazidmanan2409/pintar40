# The teacher's readiness tiers: trace and terminology recommendations (D-082(e))

**For Yazid, 30 Sep 2026.** Asked for by D-082(e): «Siap sertifikasi» is no longer valid under D-081. This note traces what the tiers really are, then gives **terminology-only** recommendations.
- Read-only; nothing is implemented.
- **The thresholds do not change.**
- It comes from an independent code trace (migrations, `src/`, `selftest/`, docs), with the key points checked at source.

## 1. What a tier actually is

| Key (internal) | Label today (id / en) | Condition |
|---|---|---|
| `kesiapan.butuh_pendampingan` | «Butuh pendampingan ekstra» / Needs extra support | mastery < 0.60, **or a required (safety) item missed, at any score** |
| `kesiapan.perlu_review` | «Perlu review» / Needs review | 0.60 ≤ mastery < 0.80, safety gate passed |
| `kesiapan.siap_sertifikasi` | «Siap sertifikasi» / Ready for certification | mastery ≥ 0.80, safety gate passed |
| `kesiapan.belum_post_test` | «Belum mengerjakan penilaian akhir» | no Uji Penguasaan yet. **Never emitted today** (review F5) |

- **Definition.** The thresholds and keys exist once, in the metric catalogue (MC-1 `20260918100000:324-329`, copied unchanged to MC-2 and MC-3, the live version). The labels exist once, in `hle.ts:1479-1482`. No code restates 0.60 or 0.80 for tiers.
- **Evidence.** For each learner in the class, the **most recently computed OFFICIAL Uji Penguasaan result, from whichever chapter** (`calc_class_readiness_distribution`, `20260923110000:292-323`). It is not the best or the first result, and it is not per chapter.
- **The unit.** One tier per learner per class. The metric is a count per tier, withheld below 5 learners.
- **It never reads the pass mark** (`passing_rules`) or the predikat bands. It is a fixed-score band.
- **No code links a tier to a certificate.** `certificate_eligibility` reads the certifying mode, OFFICIAL evidence, the result and the pass mark, never a tier. The link exists only in the word «sertifikasi» and in the spec's column heading "certifies" (`CORE-DB-BACKEND-SPEC.md:5928`).

**So a tier describes the level of a learner's latest Uji Penguasaan result on a fixed scale. It predicts nothing and certifies nothing.**

## 2. Who sees it, where, and what it causes

- **Audience:** EDUCATOR, HEAD_OF_DEPARTMENT, DEAN, INSTITUTION_ADMIN, and SYSTEM_ADMIN. **Learners never see tiers.**
- **Where tiers appear:**
  - the teacher's evidence page `/mengajar/[kelas]/bukti` («Sebaran kesiapan»: one row per tier with its count and bar);
  - the class summary `/edukator/ringkasan`, reached from `/pimpinan` and `/konfigurasi`;
  - `/dekan/ringkasan`, only if a school's own report template includes the metric;
  - `/pimpinan`, which shows **no tier words**, only a number (T1 below).
- **Where tiers do not appear:** no export, email, notification, tour or help text.
- **What a tier causes:**
  - **One sentence only:** `tindakan.fokus`, «Fokuskan waktu tambahan pada murid di dua tingkat kesiapan terbawah.», shown whatever the counts.
  - **Nothing else:** no sorting, highlighting, notification or gating.

## 3. Why the current words fail

1. **«Siap sertifikasi»** claims a certificate relationship that no code has. Under D-081 it is also untrue in fact:
   - a school at 60% issues certificates from 0.60, yet 0.60–0.79 reads «Perlu review»;
   - a school at 85% refuses a certificate at 0.82, yet 0.82 reads «Siap sertifikasi».
2. **«Perlu review»** uses the English "review". Terminology v1 (frozen, D-068) uses «Tinjau» for human review and «Periksa» for checking.
3. **«Butuh pendampingan ekstra»** shares its noun with the predikat «Perlu Pendampingan» (below 0.70 on the certificate), at a different threshold (0.60). The review found the same collision (F-table, §2).
4. **«kesiapan»** ("readiness"), the metric's name, implies readiness *for* something. After D-081 the tiers are not readiness for any decision.
   - Terminology v1 reserves «Kesiapan · Siap · Belum siap» for readiness.
   - «Kesiapan bukti» (enough evidence to interpret) is already a separate concept on `/pimpinan`.
5. **«dua tingkat kesiapan terbawah»** does not say which tiers it means.

## 4. Terminology-only recommendations

**R1. Name what is measured, and claim nothing about outcomes.** A tier is the level of the latest Uji Penguasaan result on a fixed scale.
- No tier word may imply any of the following:
  - passing: *lulus*, *tuntas*, *memenuhi*;
  - a target;
  - readiness;
  - a certificate.
- No tier word may reuse a predikat word: Sangat Baik, Baik, Cukup, Perlu Pendampingan.

**R2. Reuse the educator band words PINTAR already sanctioned, rather than invent new ones.** The voice guide (`PINTAR-VOICE-GUIDE.md:240-241`, `:432-434`) approves **«Mantap» · «Berkembang» · «Perlu penguatan»** for exactly this purpose, with no thresholds of their own. Mapped onto the unchanged tiers:

| Tier (unchanged condition) | Recommended word |
|---|---|
| ≥ 0.80 and the safety gate passed | **«Mantap»** |
| 0.60–0.79 and the safety gate passed | **«Berkembang»** |
| < 0.60, or a required item missed | **«Perlu penguatan»** |
| no Uji Penguasaan yet | **«Belum mengerjakan Uji Penguasaan»** (already approved, Terminology v1 change A8) |

- **Why these words:**
  - they are descriptive;
  - they are already in the educator voice;
  - they avoid every predikat and pass word.
- **Why not numeric labels** («80% ke atas» …): they would be false for a learner who scores 0.95 but misses a required item, since that learner correctly lands in the lowest tier.
- **One caveat for Yazid:** with a school mark above 0.80, a learner can read «Mantap» and still be below the school's mark. That is honest only because the words are descriptive and make no pass claim, the same principle D-078's amendment applies to the predikat.

**R3. Rename the metric for what it counts, not "readiness".** Replace «Sebaran kesiapan» and «Banyaknya murid pada tiap tingkat kesiapan» with words that say this is the spread of the latest Uji Penguasaan results.
- Keep «Kesiapan» for readiness, as Terminology v1 reserves it.
- The exact words are Daisy's.

**R4. The action sentence names its tiers.** «…pada murid di dua tingkat kesiapan terbawah» should name them (with R2, «Berkembang» and «Perlu penguatan»). Its wording is Daisy's.

**R5. Text only; keep the keys.**
- The labels are `hle` text. The catalogue stores keys, not words (`20260918100000:73`, `:113`).
- Changing the text needs:
  - no catalogue version (no MC-4);
  - no migration;
  - no threshold change;
  - no engine change (D-060: no change in meaning).
- Renaming the keys would need MC-4 and moves three tests (F06-P23, UX1-BRAND-02, DAISY-25-TEKS-01). **Not recommended:** internal key names are never shown.
- DAISY-25-TEKS-01 compares through `t()`, so a text-only change keeps it green.

**Ownership.** The final words are Daisy's, under Terminology v1, in context. Yazid chooses the direction (R2 or another), and the change becomes one small Daisy ticket.

## 5. Defects found on the way (separate from the words)

| # | Finding | Owner |
|---|---|---|
| T1 | **`/pimpinan` shows «Sebaran kesiapan» as the *number of distinct tiers present*** (`nilai()` returns `Object.keys(value).length`; `pimpinan/page.tsx:296-307`, `[simpul]/page.tsx:149-160`). A leader sees "3" under the readiness label, which means nothing. | Daisy, with Bob if the shape changes |
| T2 | The tier rows render in the returned `jsonb` key order (ordered by key length), not in tier order (`bukti/page.tsx:89-92`, `:198`). | Daisy |
| T3 | The sub-line «Nama diurutkan abjad; tidak ada peringkat.» (`mengajar.murid.sub`) shows under the readiness block, which lists no names. | Daisy |
| T4 | Review F5 confirmed: `requires_safety_gate` is never read (the gate applies to every band, matching the catalogue's own comment), and `belum_post_test` is never emitted. | Bob (MC-4 when it is fixed) |
| T5 | A tier is the learner's latest Uji Penguasaan **in any chapter**. Any new wording must not suggest the current chapter. | Words (R1) |
| T6 | The spec's column heading "certifies" for `requires_safety_gate` (`CORE-DB-BACKEND-SPEC.md:5928`). | Coordinator (doc) |

## 6. 3 Oct: the owner's ruling on pass mark and readiness semantics, answered (read-only; nothing implemented)

**The trigger (GS-17, run 37090112107).** On gs-001 Bunga scored 75% against the school's sealed 70%, met the target and holds certificate PINTAR/GS-001/2026/00002. Every staff surface counts her «Perlu review». The same report reads «Siap sertifikasi» 2 beside «Sertifikat terbit» 3.

**The ruling's first question: what were the 60% / 80% bands canonically meant to represent?**
- **Their source is PINTAR 3.0's educator dashboard, not a 4.0 decision.** The 28 Aug comprehensive hand-off (§2, Educator) lists «readiness distribution (Siap Sertifikasi / Perlu Review / Butuh Pendampingan Ekstra)» inside the Class Learning Intelligence briefing, beside the «do not reteach» and «focus» topic lists and a timed lesson plan. It gives no thresholds.
- **The numbers were added during the rebuild.** The FABLE prompt cross-check (`docs/rebuild/14`, line 80) found no FABLE prompt defined them, took them from the old hand-off and the uploaded Master Context, and amended FABLE-06 to state them. FABLE-06 then froze them as catalogue values (MC-1, 18 Sep, `20260918100000:101-108`: «The frozen scope states them as …»).
- **No decision ever approved 0.60 / 0.80** (semantic review, F9). No canonical text defines the tiers against a pass mark.
- **In 4.0 a certificate never issued at 80%.** Eligibility has always been the passing rule (FABLE-04, `certificate_eligibility`), and since D-081 / D-086(b) it is the school's sealed mark, «no second definition of mastery». No code links a tier to a certificate (§1).
- **The tiers' only behaviour is teaching triage.** The one sentence they drive is «Fokuskan waktu tambahan pada murid di dua tingkat kesiapan terbawah.» (§2).
- **Answer.** The bands were meant as a teaching-triage spread of results. Their top tier carries a certification assumption brought over from PINTAR 3.0. That assumption was never backed by a 4.0 rule, and D-081 rules it out. So the bands are an **independent performance distribution** (the ruling's second branch). D-082(e) already points this way: the thresholds do not change, and «Siap sertifikasi» is no longer valid wording. Re-basing the bands on the school's target (the first branch) would build a different metric: «met the target», which is already shown per student.

**The smallest correct correction (text, plus two display fixes; no threshold, key, catalogue, migration or engine change):**
1. **Tier words that describe a level and claim no pass or certificate** (R1, R2):
   - «Mantap»: 80% and above, with the safety gate passed;
   - «Berkembang»: 60–79%;
   - «Perlu penguatan»: below 60%, or a required item missed;
   - «Belum mengerjakan Uji Penguasaan».
   «Siap sertifikasi» is retired, because no fixed band can match certificate readiness when the mark is the school's.
2. **The metric's name and meaning sentence say what it is** (R3). An example for Daisy to word: «Sebaran hasil Uji Penguasaan» / «Banyaknya murid menurut hasil Uji Penguasaan terakhir mereka, pada pita tetap PINTAR. Ini bukan batas ketuntasan sekolah dan tidak menentukan sertifikat.»
3. **The action sentence names the tiers it means** (R4).
4. **Display defects with a settled answer:**
   - **T2:** the tiers are drawn in their catalogue order, not jsonb key order. GS-17 saw «Perlu review», «Siap sertifikasi», «Butuh pendampingan ekstra» on every surface.
   - **T3:** the misplaced «Nama diurutkan abjad; tidak ada peringkat.» line under the block is removed.

**Why this is the smallest change:**
- The labels are `hle` text and the catalogue stores keys (R5), so there is no MC-4 under D-060.
- Tests compare through `t()`, so DAISY-25-TEKS-01, F06-P23 and UX1-BRAND-02 stay green.
- The only literal copy of the words is the GS-17 walk (`audit/staging/golden-school-laporan.mjs`), updated with the change.
- Learners never see tiers.

**Pass status is kept separate, where it already lives:**
- against the school's sealed mark: the learner's result page, the teacher's «Hasil resmi» per student («target 70%», «di bawah target»), the certificate and «Sertifikat terbit»;
- a fixed spread: this distribution.

**Not included, for the owner if wanted:**
- **A class figure «Memenuhi target sekolah: k dari n», from the sealed marks.** It is a new metric (MC-4, a calculator, a catalogue row), not a correction.
- **T4 / F5:** the calculator never reads `requires_safety_gate` and never emits «belum mengerjakan». That changes a calculation, so it publishes MC-4.
- **The predikat bands on the certificate** (the semantic review's Alternatives 1–3). They are a separate open question; this correction does not touch them.

**Ownership:**
- the final words: Daisy, under Terminology v1, in context;
- the build: one small ticket (text plus T2 and T3), walked again with GS-17.
