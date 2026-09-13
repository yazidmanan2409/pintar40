# ADR-0008 — D1: the OFFICIAL evidence bootstrap tenant

**Date:** 2026-09-14
**Phase:** FABLE-04
**Status:** Accepted — decision taken by Yazid, 2026-09-13 (Option 1)
**Supersedes:** nothing. **Superseded by:** nothing.
**Amends:** nothing. **Amended by:** ADR-0020 (2026-09-13) — see §0.

---

## 0. Amendment, 2026-09-13 (ADR-0020)

**D1's count rule has changed. The rest of D1 has not.**

Was: *one* clearly named non-synthetic institution outside production, enforced
by `unique ((true)) where is_official_bootstrap`.

Now: **every institution authorized for non-production OFFICIAL evidence
declares a bounded purpose; at most one per purpose; all are refused in
production.** The purpose is
`institutions.official_evidence_purpose`, an enum with exactly two values today
(`D1_ENGINEERING_BOOTSTRAP`, `HUMAN_EVALUATION`), tied to
`is_official_bootstrap` by a CHECK in both directions, and occupied at most once
each by `unique (official_evidence_purpose) where … is not null`. A third
purpose costs a migration and an ADR — it cannot be added as a row.

**Why.** ADR-0020 needs a second such tenant: a rich Human Evaluation
institution where the genuine OFFICIAL → eligibility → certificate journey is
reachable, because a synthetic tenant caps every session at SYNTHETIC. Simply
permitting two would have turned `is_official_bootstrap` into a boolean escape
hatch that makes any non-production institution OFFICIAL with nothing recording
why. Declaring a purpose keeps the count rule as tight as it was, per reason
rather than overall.

**What did not change.** `is_official_bootstrap` is still the boolean both
existing predicates read — no predicate was rewritten. Production refusal is
unchanged and now doubled: the flag and the purpose are each refused there
independently. `derive_evidence_class` is still cap-only and now probed for a
third forbidden input: it reads neither the flag, nor `tenant_kind`, nor the
purpose. The tenant described below is unchanged in substance; it now declares
`D1_ENGINEERING_BOOTSTRAP` as its reason.

**One thing to know when reading §3 below.** The partial unique index it
describes — the mechanism that *was* this ADR's count rule — is **dropped** by
migration 0065, in the same migration that creates the per-purpose index.
Leaving it would have made the amended rule unreachable while appearing to work.

*(ADR-0020 and the Task 2 prompt both cite "ADR-0009's D1 decision". D1 is this
ADR, 0008; ADR-0009 is D2, certificates are `INSTITUTION_SCOPED`.)*

---

## 1. The problem D1 names

Only `OFFICIAL` evidence can reach certificate eligibility (INV-20). Every
seeded tenant in FABLE-01–03 is synthetic, and `derive_evidence_class` caps a
synthetic tenant's evidence at `SYNTHETIC`. So before this phase there was no
way to test the *positive* half of the certificate path at all: the suite could
prove that a synthetic session is refused, and could not prove that an official
one succeeds. A phase whose deliverable is a certificate cannot ship with its
success path untested.

## 2. The decision, as taken

**Option 1: one clearly named non-synthetic institution for development and
CI, prohibited in production.** Not a flag that forces `OFFICIAL`, not a test
hook in `derive_evidence_class`, not a `SECURITY DEFINER` bypass.

`pintar-bootstrap-official` is an ordinary institution with `is_synthetic =
false`. Its evidence derives `OFFICIAL` through the ordinary derivation, with
no special case anywhere in the engine — which is the property that makes the
positive test worth running. If the derivation breaks, this tenant stops
certifying, exactly as a real school would.

## 3. The four statements the decision requires

1. **It is declared.** `institutions.is_official_bootstrap` marks it, and a
   partial unique index permits at most one such row to exist.
2. **It is singular.** Outside production, the guard in 0042 refuses any
   *other* non-synthetic institution. F02-T17 asserts that refusal directly
   rather than working around it — the test that used to create its own
   throwaway non-synthetic tenant now runs its positive case on this one.
3. **It is prohibited in production.** The same trigger refuses
   `is_official_bootstrap = true` outright when the environment is production,
   so the flag cannot travel with a migration into a live deployment.
4. **It is counted.** `non_synthetic_institutions` and `official_bootstrap_ok`
   are lint counters, and `assert_official_evidence_bootstrap()` is a standing
   assertion in the phase gate.

## 4. Why no derivation input changed

`derive_evidence_class` already returns `OFFICIAL` for a tenant with
`is_synthetic = false`. D1 needed **no** change to it, and that is the strongest
argument for Option 1 over the alternatives: the bootstrap tenant is not a
special case in the engine, it is an ordinary input the engine had simply never
been given.

`is_official_bootstrap` is deliberately NOT read by `derive_evidence_class`.
It exists to constrain and count the tenant, never to grant it anything.

## 5. What it costs, stated plainly

A development database now contains one institution whose evidence is
`OFFICIAL`. Anything that treats "development" as a synonym for "no official
evidence" is wrong in this repository from 0042 onwards. That is a real change
of assumption, it is why F02-T17 had to be rewritten rather than patched, and
it is why the guards in (2) and (3) are triggers rather than conventions.
