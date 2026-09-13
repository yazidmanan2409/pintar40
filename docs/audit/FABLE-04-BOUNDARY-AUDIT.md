# FABLE-04 — critical-boundary audit: first certificate issuance

**Date:** 2026-09-14 · **Phase:** FABLE-04 · **Boundary:** doc 16 §6, "first certificate issuance"
**Layer:** 1 (builder verification) and 2 (automated verification). **Layer 3 has not been performed and is not claimed.**
**Revised 2026-09-14** after Claude 1's review. §4 was recorded as an open gap with a justification that did not hold; it is now closed, and the faulty reasoning is kept rather than deleted.

Doc 16 §6 requires a boundary audit at every critical boundary, and names the
first certificate issuance as one. This is that audit. It covers the full doc
16 §5 named-pattern list, not only the patterns this phase touches, and it
records one finding that is **closed** and one that is **open**.

---

## 1. The doc 16 §5 named-pattern list

| # | Pattern | How it was searched | Result |
|---|---|---|---|
| 1 | Permissive RLS (`USING (true)`) | `policies_using_true` over `pg_policies`, both `qual` and `with_check` | **0** · F01-T13; red case `static-permissive-policy` proves the check bites |
| 2 | Client-side service role | import-graph scan: `@/lib/supabase/service` outside `src/app/api/`, plus the client-bundle string scan | **clean** · F01-S03. This phase moved `/verifikasi/[token]` off the service client for exactly this rule (ADR-0012 §2) |
| 3 | Answer-key leakage | every client-executable function whose source reads `is_correct`, plus the client grants on `items` / `item_options`, plus the delivered-payload allow-list | **2 functions** — `reading_map` (LEARNER) and `run_mcq_quality` (STAFF). Both read correctness to derive their output and neither returns it: `reading_map` returns `(peringkat, tingkat, kode, pernyataan, modul, pelajaran, halaman, alasan)`. `authenticated` holds SELECT/INSERT/UPDATE on the authoring tables, gated by RLS to staff with the authoring capability in their own institution; F03-T03 proves empirically that a learner reads **zero** item and zero option rows |
| 4 | Public storage | `public_buckets`, `client_storage_policies` | **0 / 0** · F01-T13, F01-T14 |
| 5 | Hardcoded credentials | regex over `src`, `supabase`, `selftest` for assigned literals matching password/secret/key/token | **none** |
| 6 | Dummy production fallbacks | every `process.env.X ?? "literal"` in `src` | **one, examined and not a finding**: `CARD_EMAIL_DOMAIN ?? "cards.pintar.internal"` (FABLE-01). It is a routing domain, not a secret; the security-relevant values (`SUPABASE_SERVICE_ROLE_KEY`, `CARD_PEPPER`, `CERT_SECRET_KEY_V*`) all throw when unset |
| 7 | Anonymous privileged uploads | storage policies naming `anon` / `authenticated` | **0** |
| 8 | Unsafe `SECURITY DEFINER` (unpinned `search_path`) | `secdef_without_search_path` **and** `functions_without_search_path` (0035 widened it to invoker functions too) | **0 / 0** |
| 9 | Duplicate engines | F03-S01 import-graph check; `overloaded_client_rpcs`; a catalogue query for any client-reachable name carrying more than one signature | **clean** · red case `static-duplicate-engine` proves the check bites |
| 10 | Legacy routes | full route inventory of `src/app` (17 files) | **clean** — one verification route shape (F04-S01, red case `static-second-verification-route`); `/api/dev/*` returns 404 in a production build (F01-R01) |
| 11 | TODO / bypass security comments | regex for TODO/FIXME/XXX/HACK/bypass/disabled-check across `src`, `supabase/migrations`, `selftest` | **none** — every hit is an assertion message saying a bypass is refused |
| 12 | Unversioned scoring | INV-29: `scoring_policy` registry, FK-bound expand-first | **closed this phase** · ADR-0007, 0039, F04-T02 |
| 13 | Provider concepts in the domain model (INV-32) | column, table and type names matching the provider vocabulary | **0** — the only hits are the assertion that searches for them |
| 14 | Privileged data in learner-assistance contexts | F03-S03: the assistance context equals the sanitized item and refuses an authoring row | **clean** |
| 15 | Raw-evidence reads in analytics paths | `assert_evidence_consumer_boundary()`; F02-S01 lint | **clean, and still VACUOUS** — no analytics consumer role exists yet, which the assertion says in its own detail string rather than reporting a bare pass. Red case `static-raw-evidence-read` proves the lint bites |
| 16 | Internal version strings on user surfaces | F04-S01 copy inventory on the verification route; the HLE internal-word guard | **clean** — no `PINTAR 4.0`, `SYNTHETIC`, `OFFICIAL`, `PREVIEW`, `evidence_class`, `engine_version`, `scoring_policy` on any user surface |

Nine standing assertions all report clean with the whole phase present
(F04-T14): telemetry write-only, evidence-consumer boundary, learner-RPC
ownership reachability, engine-takes-no-identity, public surface, audit-write
arity, mode-policy completeness, integrity-never-scores, D1 bootstrap.

---

## 2. The issuance path, walked

```
POST /api/certificates/issue
  → session_is_mine        (CALLER's client, under the caller's JWT)
  → assertKeyringUsable()  (server; 503 and the results page still renders)
  → certificate_prepare    (service client; builds the payload, mints the number and token)
  → signPayload            (server; the key never enters the database)
  → certificate_seal       (service client; stores the signature)
```

Examined and **correct**:

- **Ownership is checked with the caller's own client**, so `current_person_id()`
  decides. Passing a session id straight to the service client would be the
  FABLE-03 defect class (an internal function reachable with someone else's
  resource id) and it is not done here.
- **The key never reaches Postgres.** The payload is built in SQL, signed in
  Node, and only the resulting hex returns. A secret the database can read is a
  secret a database backup carries.
- **`certificate_seal` refuses a key-version mismatch**: if the submitted
  `p_key_version` differs from the `key_version` inside the payload it raises,
  because the signed bytes would not be the stored bytes.
- **Idempotency is structural**: a partial unique index gives one root
  certificate per session, and a second `certificate_prepare` observes the
  first rather than minting a second (F04-T09).
- **Issuance never blocks the results view** (§8): every failure path returns a
  status the page renders around, and the next load retries.

---

## 3. Finding 1 — CLOSED. The real signing loop was never exercised end to end

**What was found.** The HMAC was produced in exactly one place — the issuance
route — and verified in exactly one place — a static test over payloads that
same test had constructed. The db suite sealed with `repeat('a', 64)`, a
placeholder. So **no test anywhere proved that a payload built in SQL, signed
in Node with the real crypto and stored in Postgres still verifies when a
different process reads it back**, which is precisely the acceptance-checklist
item "issued, then verified after a full process restart".

Every individual piece was tested. The seam between them was not, and a seam
between SQL `jsonb` and JavaScript `JSON.parse` is exactly where a
canonicalisation defect lives.

**What was done.** `selftest.issue_material()` prepares a real certificate on
the D1 bootstrap tenant, and **F04-S04** drives the whole loop: SQL builds the
payload, TypeScript signs it with the keyring crypto, SQL stores the signature,
a **separate psql process** reads both back, and the signature is recomputed
over the stored bytes. It also asserts that changing one stored byte fails and
that a wrong key fails, so the pass is not vacuously true.

---

## 4. Finding 2 — CLOSED at review. The public route now recomputes the signature

**What was found, and by whom.** `verify_certificate` derived `validity` from
`certificates.status` and never touched `signature`. INV-05's guarantee did not
hold on the one path a printed QR code points at. **This audit recorded it as
open with the wrong justification**, and Claude 1's review rejected that
justification and was right to.

**What the wrong justification was.** This section said closing it needed a
fourth database principal. It did not. F01-S03 restricts
`@/lib/supabase/service` to `src/app/api/**` — it does not forbid it there, and
`/api/assets/read-url` has worked that way since FABLE-01. The privileged read
belonged in an API route from the start. The reason it was not put there was a
misreading of INV-38 as counting HTTP paths rather than verifier-facing URLs,
which turned a test-scoping question into an architectural constraint. Recorded
here because a boundary audit that reasons its way to the wrong conclusion is
itself a finding.

**What was done.** Migration 0051 and ADR-0013:

- `GET /api/verifikasi/[token]` is the authoritative verification. It holds the
  service client, reads `certificate_verification_material` (payload, signature,
  key version — no client grant at all), recomputes the HMAC with
  `crypto.timingSafeEqual`, and returns D3b's five fields with `validity`
  downgraded to `TIDAK SAH` when the signature fails.
- `decideValidity` can only downgrade: no input turns an invalid certificate
  into a valid one, and a valid signature never un-revokes.
- **`verify_certificate` lost its anon grant.** A projection that reports
  `BERLAKU` without checking a signature must not be independently callable, or
  the defect moves from the page to the RPC. `anon` executes nothing again.
- The page holds no database client; `F04-S01` asserts that, and asserts exactly
  one verifier-facing route and exactly one endpoint.
- **F04-S05** drives the exported route handler itself: a genuine certificate
  reads `BERLAKU`; a **tampered stored payload**, written with the immutability
  trigger disabled precisely to simulate the compromise the signature exists to
  detect, reads `TIDAK SAH`; the response is the five fields in both cases; and
  unknown, malformed and prepared-but-unissued tokens are indistinguishable.
- **F04-S04** exercises the same decision locally over real sealed rows, so the
  closure is not CI-only evidence.

**The threat model, stated now rather than implied.** `canonical_payload` is
refused UPDATE by `certificates_write` for every role including the table owner,
so tampering requires disabling a trigger — superuser, or a restore from a
doctored backup. Before 0051 that bought a forged `BERLAKU` on the public page.
After it, it buys nothing: the signature no longer matches and the public page
says the certificate does not match its issuer's record. The signing key is not
in the database, so a database-level compromise cannot forge a new signature
either.

## 5. What this audit is not

It is Layer 1 and Layer 2 of doc 16 §5. **Layer 3 — an independent adversarial
audit by a reviewer with no shared context with the builder — has not been
performed, and nothing here should be read as if it had.**

The revision above is the argument for that in miniature. Finding 1 was found by
the builder and closed by the builder. Finding 2 was found by the builder and
**mis-reasoned** by the builder, who recorded a design preference as an
architectural constraint and would have shipped the phase with a public
verification route that performed no verification. It took a reviewer to say so.
Claude 1 is not independent in doc 16 §5's sense either — they wrote the roadmap
this is measured against — so the case for a genuinely independent pass over the
certificate boundary is stronger after this review, not weaker.
