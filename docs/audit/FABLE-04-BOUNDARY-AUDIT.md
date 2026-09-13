# FABLE-04 — critical-boundary audit: first certificate issuance

**Date:** 2026-09-14 · **Phase:** FABLE-04 · **Boundary:** doc 16 §6, "first certificate issuance"
**Layer:** 1 (builder verification) and 2 (automated verification). **Layer 3 has not been performed and is not claimed.**

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

## 4. Finding 2 — OPEN. The public route reports validity without recomputing the signature

**What it is.** `verify_certificate` derives `validity` from
`certificates.status` (`BERLAKU` / `DICABUT` / `DIGANTIKAN`). It does **not**
recompute the HMAC over the stored canonical payload. INV-05 and §7 say
verification recomputes and compares timing-safely, and at the public route
that does not happen.

**Why it is not simply fixed.** The recompute needs three things at once:
the key, the stored payload, and an anonymous caller.

- The key cannot be in the database — that is the design decision the whole
  signing split rests on, and it is not being reopened for this.
- The stored payload cannot be exposed to `anon` — it carries `result.score`
  and the identity snapshot hash, and D3b's whole point is that the public
  response is five non-identifying fields.
- The page cannot use the service client — F01-S03, and ADR-0012 §2 records
  why a second API endpoint is worse rather than better.

**What is NOT being done about it.** A SHA-256 payload digest recomputed inside
`verify_certificate` was considered and rejected. It would make the public
route *look* like it verifies, it would go green, and it would not be INV-05 —
it would be a second, weaker integrity mechanism standing in for the one the
invariant names. That is the substitute control the standing constraints
forbid, and an openly recorded gap is worth more than it.

**The named remedy, for whoever closes it.** A fourth database principal: a
`certificate_verifier` role whose JWT the Next.js server mints with the
project's JWT secret, holding EXECUTE on one function that returns
`(canonical_payload, signature, key_version)` and nothing else. The page then
recomputes with `verifyWithKey` and renders `validity` from the result. That is
real work — a new secret, JWT minting, a new principal in the RLS model — and
it is a decision about the authentication architecture, not a patch. It is
recorded here and in the completion report rather than improvised at the end of
a phase.

**What holds in the meantime.** The stored payload is immutable by trigger
(F04-T09 asserts payload, row and snapshot are each immutable); the signature
is verifiable end to end by F04-S04; revocation changes the public answer and
keeps the row; and the signature's primary purpose — letting a verifier check a
certificate **document** that has left the system — is unaffected, because the
document carries the signature and the crypto that checks it is proven correct.

---

## 5. What this audit is not

It is Layer 1 and Layer 2 of doc 16 §5. **Layer 3 — an independent adversarial
audit by a reviewer with no shared context with the builder — has not been
performed, and nothing here should be read as if it had.** Both findings above
were found by the builder, which is the weakest kind of finding: the classes of
defect a builder is blind to are by definition not in this document.
