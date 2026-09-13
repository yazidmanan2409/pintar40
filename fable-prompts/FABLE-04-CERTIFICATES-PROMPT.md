# FABLE-04 — Assessment Engine (completion), Resilience, Quick Assessment, Certificates & Verification

*Synchronized to the Architecture Baseline (docs/rebuild/01–16). Controlling
documents for this phase: 07, 08, 04 §5 and §7, 06, 03 (INV-05–10, 12,
17, 24, 26–30, 38). Two sections of the earlier prompt are superseded: the
session-assembly rule that allowed pre/post overlap "at a rate that would
not compromise psychometric validity" (now zero overlap, INV-24), and the
certificate payload `user_id|score|timestamp|number|key_version` (now the
full canonical payload of INV-05).*

Depends on Phases 1–3 (green and audit-gated).

## 1. The one engine — completed (INV-26)

Extend the Phase 3 engine module — never a second one — to cover every
**mode** with its own policy and presentation on the same assembly,
sanitizer, timing, grading, safety gate, evidence and finalization:

| Mode | Policy |
|---|---|
| `LEARNING_CYCLE_PRETEST` / `LEARNING_CYCLE_POSTTEST` | Phase 3 (pre-test diagnostic; post-test zero overlap; certificate-eligible) |
| `PRACTICE` | hints, immediate rationale, retries |
| `TEST` | randomised, attempts limited, class windows |
| `EXAM` | no hints, identity confirmation, institution passing threshold, cooling, audited |
| `QUICK_ASSESSMENT` | educator-launched (§4) |
| `PUBLIC_DEMO` | enum value + `PUBLIC_DEMO` evidence class + rate-limited PUBLIC principal; **no public UI in this phase** (FOUNDATION NOW; OD-11) |
| `PAPER` | enum value only; evidence enters via the paper channels; no workflow (FOUNDATION NOW) |

Session assembly, given an Assessment Assignment: draw items respecting
difficulty mix, safety-critical minimum, `bank_type` isolation (INV-12),
EXAM cooling, seeded deterministic shuffle (uniform correct-option position
distribution across a paper; seed never derivable by the client),
`parallel_group` exclusion within the definition window, and for the
learning-cycle post-test the **full exclusion** of every item and sibling
from the learner's pre-test (INV-24). Session state (current item, flags,
pause, `authoritative_deadline`) is server-authoritative — a refresh or
device switch can't reset a timer or reroll items. New item types are
registered, never given their own engine.

## 2. Start eligibility ≠ continue permission; interruption; extensions (doc 04 §5)

- Start: assignment OPEN, ACTIVE membership, no disallowed repeat exposure.
- Continue (every scored action): session active, before
  `authoritative_deadline` (+ governed late-sync grace for replays), no
  INV-17 event. The assignment window closing or the class ending never
  interrupts a legitimately started session (INV-27).
- `TERMINATED`: only authorization revocation, institutional/scope
  revocation, security intervention, or explicit authorized administrative
  termination (`CAN_*` per doc 05) — reason and actor recorded, audited;
  recorded work retained and finalized with the TERMINATED marker.
- Authorized deadline extension: capability-gated, within governed limits,
  audited (old/new deadline, actor, reason). No silent extension.

## 3. Resilience — no lost legitimate completed work (doc 07; INV-28)

Complete the Phase 3 minimum into the full contract:
- Durable client outbox with idempotency keys; replay on return; server
  accepts each key exactly once and records `receipt_mode` (`LIVE` /
  `REPLAYED` / `LATE_SYNC`) with both server-received and client-asserted
  times.
- Offline answering only where the definition sets `offline_tolerant`:
  already-issued items may be answered and queued; no new draw and no
  assistance offline.
- Late sync: replays arriving after the deadline but within the definition's
  governed grace window are accepted and scored as `LATE_SYNC`; beyond it
  they are retained as evidence but excluded from scoring, visibly to the
  educator. Grace is a definition parameter, not a constant.
- Timeout (`EXPIRED`) finalizes with everything recorded; nothing is
  discarded.
- Finalize is idempotent per session id (double-click, network retry).
- **Acceptance scenario (must be a test):** 17 answered online; network
  lost; 8 more answered offline (definition permits); process killed;
  learner returns → server state re-read, 8 replayed exactly once, 25
  responses, no duplicates, one finalization.

## 4. Scoring, mastery, growth, reproducibility (INV-08, INV-09, INV-10, INV-29)

- `person_id` is derived server-side from the authenticated session, never
  from the request body.
- Score/mastery/safety gate computed server-side from raw
  `response_submitted` evidence (LIVE, REPLAYED, in-grace LATE_SYNC) at
  finalize — never a client summary; recomputed independently at
  certificate issuance.
- Mastery = overall passing rule **and** 100% on safety-critical items where
  such content applies.
- Growth/delta on read, requiring both FINALIZED sessions.
- **Scoring policy registry:** every rule that can change interpretation
  (passing rules, safety-critical sets, weighting, partial credit,
  timeout/late-sync policy) lives in a versioned `scoring_policy`; every
  Result and Session records `engine_version` and `scoring_policy_version`.
  A scoring correction is a new policy version and, where results must be
  corrected, an audited recomputation writing **new** Result rows linked to
  the originals — never an edit (doc 08).

## 5. Teacher Quick Assessment — a surface over the engine (doc 07)

```
Teacher → Class → Quick Test → Subject/Topic → Question Count / Time → Launch
```
`CAN_QUICK_ASSESSMENT`; eligible class (educator's scope, ACTIVE) and
eligible bank (PRACTICE/TEST tiers the scope covers — never EXAM);
parameters bounded by governed limits; creates an Assessment Assignment in
`QUICK_ASSESSMENT` mode and opens it in one action. Target: about one
minute from intent to learners answering, with no administrator or
developer. Everything downstream is the same engine and the same evidence
contract; evidence from a Quick Assessment is `OFFICIAL` and contributes to
Question Health. No "quick quiz engine".

## 6. Integrity evidence (doc 06 category 7)

Record proportionate signals on the assessment surface: item displayed,
option selection/change, navigation, timestamps, hint events, visibility
changes, reconnect events, submission events. Never scoring input. Patterns
raise **review signals** to `CAN_REVIEW_INTEGRITY` holders (surface in
Phase 5's control center); no automatic verdict; nothing accusatory is ever
rendered to a learner. No webcam/microphone/screen capture or keylogging
exists (PARK). Cross-session analysis is a FOUNDATION NOW boundary only.

## 7. Certificates — cryptographic core (INV-05, INV-06, INV-07, INV-30)

```
canonical_payload = JSON-canonical({
  certificate_number,
  identity_snapshot_hash,          // SHA-256 of the Certificate Identity Snapshot
  result: { score, predikat, passed, safety_gate },
  issued_at,                       // exact ISO string stored and reused verbatim
  plp_release_id, release_content_sha256,
  assessment_definition_id, assessment_definition_version,
  scoring_policy_version,
  key_version
})
hash = HMAC-SHA256(canonical_payload, SECRET_KEY[key_version])
```
- Every field above is **inside** the signed payload; changing the release
  binding, the hash, the definition version or the identity snapshot makes
  verification fail. The earlier five-field payload is withdrawn.
- **Certificate Identity Snapshot** (INV-30): at issuance, copy the identity
  attributes the certificate presents (name as issued; photo storage path
  + content hash where the template includes one — presentation policy is
  **OD-10**) into an immutable snapshot row; rendering and verification read
  the snapshot only. Later profile changes never alter an issued
  certificate.
- Keyring from the first migration: `key_version SMALLINT NOT NULL`,
  secrets from versioned env vars (`CERT_SECRET_KEY_V1`, `_V2`, …), old
  keys demoted to verify-only once rotated, never deleted.
- Verification recomputes over the stored canonical payload and compares
  with a timing-safe equality check (`crypto.timingSafeEqual`), never `===`.
- Secret must be ≥32 chars; the app throws at boot in production if unset.
- Certificate lifecycle enumerated and transition-enforced: `ELIGIBLE →
  ISSUED → REVOKED` / `SUPERSEDED` (doc 04 §7); only `OFFICIAL` evidence
  can reach `ELIGIBLE`; PREVIEW/SYNTHETIC/PUBLIC_DEMO never can.

## 8. Certificate numbering & idempotency

- One numbering scheme, tied to the session id with a UNIQUE constraint, so
  concurrent finalize calls can never mint two numbers for one session.
- Only formal stages (post-test / exam) certify. Practice never scores;
  pre-test is a starting point, never an achievement.
- Issuance never blocks or fails the results view — if issuance errors, the
  results still render, and a retry path exists on next load.
- Revocation keeps the row; the public response changes; a corrected
  certificate is a new ISSUED row, chain-linked. Never patched.

## 9. Public verification — one route, not two (INV-38)

Build exactly one canonical public verification surface (e.g.
`/verifikasi/[id]`). It returns pass/predikat/institution/date/validity
state only — never score internals, personal data, internal version
strings or "PINTAR 4.0". A QR-friendly short path may exist only as a
permanent redirect to the canonical route. The certificate shows the
content release a verifier legitimately needs, never internal designations.

## 10. Storage of certificate records

Certificates and snapshots persist in Postgres from the first migration —
never an in-process store. Verify by restarting the app between issuing and
verifying in testing.

## Acceptance checklist — selftest contract (must be green before Phase 5)

- [ ] A certificate issued, then verified after a full process restart,
      still verifies correctly.
- [ ] Two concurrent finalize requests for the same session produce exactly
      one certificate row; duplicate finalize is idempotent.
- [ ] INV-05: tampering with **each** protected field in a test copy —
      `plp_release_id`, `release_content_sha256`, definition id/version,
      `scoring_policy_version`, identity snapshot hash, result, `issued_at`,
      number — makes verification fail; the code path uses a timing-safe
      compare (assert the function, not just `false`).
- [ ] INV-30: change the learner's photo and display name after issuance;
      re-render and re-verify; output identical, verification succeeds.
- [ ] INV-07: issuing under `_V1`, then rotating to `_V2`, leaves the `_V1`
      certificate verifiable.
- [ ] A classroom-card learner can fetch their own certificate via their own
      endpoint; a PREVIEW/SYNTHETIC/PUBLIC_DEMO session can never reach
      ELIGIBLE.
- [ ] INV-38: static check — exactly one verification URL shape (a second
      exists only as a redirect). Copy inventory: no internal version string
      on the certificate or verification page.
- [ ] INV-24: across the full seeded bank, every learner's pre/post pair has
      empty item-id and `parallel_group` intersections.
- [ ] INV-12: EXAM items never appear in PRACTICE/TEST/QUICK_ASSESSMENT
      sessions; cooling respected.
- [ ] INV-27 / INV-17: window closed → continuation accepted, new start
      refused; scope revoked / admin termination → next scored action
      refused, session TERMINATED with audit row and recorded work retained;
      deadline extension audited and honoured.
- [ ] INV-28 acceptance scenario (17 + 8, process killed): exactly 25
      responses, no duplicates, correct `receipt_mode`s, one finalization;
      a replay beyond the grace window is retained and excluded from scoring.
- [ ] INV-29: finalize stamps engine and policy versions; publishing a new
      scoring policy leaves old Results resolving to the old version;
      recomputation writes a new linked Result and leaves the original.
- [ ] INV-26: the code-search check still passes with all modes present.
- [ ] Quick Assessment: an educator with `CAN_QUICK_ASSESSMENT` launches for
      an eligible class in a scripted flow; an educator without the class
      in scope, and a DEAN, are refused; EXAM tier is unreachable from it.
- [ ] Integrity: signals recorded for a scripted session; no scoring
      view/function references the integrity table; no verdict field exists.
- [ ] Persona harness: PUBLIC_DEMO-mode sessions exist only in the demo
      scope and appear in no official view.

Add these to the running `selftest` manifest alongside Phases 1–3's tests.
Then: mini audit (unversioned scoring, duplicate engines, legacy routes,
certificate payload coverage, TODO/bypass security); fix; gate. This is a
critical-boundary audit (first certificate issuance — doc 16 §6).
