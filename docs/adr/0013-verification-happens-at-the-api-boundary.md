# ADR-0013 — The public verification route verifies

**Date:** 2026-09-14
**Phase:** FABLE-04 (closure)
**Status:** Accepted
**Supersedes:** **ADR-0012.** Its decision — let `anon` execute the projection — is withdrawn; §4 says why.
**Superseded by:** nothing.
**Raised by:** Claude 1's FABLE-04 review, finding 1, measured on the live project.

---

## 1. The defect

`verify_certificate` read `pass` and `predikat` out of `certificates.canonical_payload`
and `validity` out of `certificates.status`. **It never touched `signature`.**

So INV-05's guarantee — *altering any protected field must fail verification* —
did not hold on the one path a printed QR code points at. Alter the stored
payload and the public page reported `BERLAKU` for a forged result.

The INV-05 tamper matrix passed the entire time, because it exercised a
**different** verifier: the TypeScript `verifyWithKey`, over payloads the test
itself constructed. F04-S04 narrowed that by signing an SQL-built payload with
the real crypto and reading it back through a separate process — and still did
not close it, because the public route called neither. Two verification paths
of unequal strength, which is the shape INV-38 and INV-26 exist to prevent.

The FABLE-04 completion report disclosed the gap. Disclosure is not a fix.

## 2. The blocker I claimed, and why it was wrong

The report said closing this "needs a fourth database principal — a
`certificate_verifier` role whose JWT the server mints — an
authentication-architecture decision, not a patch."

That was not established. **F01-S03 restricts `@/lib/supabase/service` to
`src/app/api/**` — it does not forbid it there**, and `/api/assets/read-url` has
worked exactly that way since FABLE-01. The rule caught the *page* importing the
service client. The fix for that is to move the privileged read to where the
rule already allows it, not to weaken the rule and not to invent a principal.

I had considered an API route and rejected it as "a second anonymous HTTP
surface returning verification data, which is the shape INV-38 exists to
prevent". That reasoning inverts the invariant. Before this change there were
**two** implementations of "is this certificate valid" and they disagreed in
strength; after it there is **one**. INV-38 counts verifier-facing URLs, and
there is still exactly one of those. I turned a test-scoping question into an
architectural constraint, and recorded it as a gap rather than resolving it.

Verified before building: `service_role` holds `EXECUTE` on the internal
certificate functions on the live project (`{postgres=X/postgres,service_role=X/postgres}`),
so the boundary works with no grant change and no new principal.

## 3. The decision

**The authoritative verification is `GET /api/verifikasi/[token]`.**

```
QR token → /verifikasi/[token]  (page: renders)
             → /api/verifikasi/[token]  (endpoint: service client, holds the key)
                 → verify_certificate            → the five D3b fields
                 → certificate_verification_material → payload, signature, key_version
                 → decideValidity(…, verifySignature)   ← crypto.timingSafeEqual
             ← { pass, predikat, institution, date, validity }
```

- `certificate_verification_material(p_token)` returns the canonical payload,
  the signature and the key version, and **nothing else**. No client grant at
  all: the payload carries `result.score` and the identity snapshot hash.
- `decideValidity` is pure and **can only downgrade**. A signature that fails
  makes validity `TIDAK SAH` whatever the issuer said; a signature that passes
  never turns `DICABUT` into `BERLAKU`. There is no input that upgrades.
- The page holds no database client of any kind. `F04-S01` asserts that.
- The response is D3b's five fields in both the success and the refusal case,
  asserted by **set equality on the real response**, not on the SQL signature.

## 4. `anon` executes nothing again — ADR-0012 withdrawn

ADR-0012 granted `anon` EXECUTE on `verify_certificate`, following §9's
"registered in `client_rpc_registry`" mechanism, and recorded
`functions_executable_by_anon = 1` as a deviation from §13.

**That grant is revoked.** Leaving it would move the defect rather than fix it:
a projection that reports `BERLAKU` without checking a signature must not be
independently callable, or a stranger with the publishable key simply asks the
RPC instead of the page and gets the unverified answer. §9's *purpose* was a
declared, minimal, closed anonymous surface; that purpose is better served by a
surface that actually verifies.

Consequence: `functions_executable_by_anon` returns to **0**, `anon_table_grants`
stays **0**, and §13's regression table is met in full. The deviation the
completion report recorded is withdrawn, not defended. Claude 1 was right that
§9 and §13 contradicted each other; the resolution turns out not to need either
of them bent.

## 5. What this costs, and the one reading it carries

`/api/verifikasi/[token]` is anonymously reachable over HTTP. Saying otherwise
would be the dishonest version of this change, so it is **declared**:
`public_surface_registry` gains an `ENDPOINT` kind and a `parent` column, and
the endpoint is attributed to the route it serves.

**The reading, flagged for the Layer-3 auditor.** INV-38 says "exactly one
canonical public verification surface … a QR-friendly short path may exist only
as a permanent redirect". The endpoint is not a redirect. It is treated as the
*same surface at a second spelling* — same token in, identical five fields out,
no disclosure the route does not make — rather than as a second surface, and
`anon_public_surface` counts distinct surfaces (2) while
`anon_reachable_http_paths` counts spellings (2) so the pair is visible rather
than folded away. A reviewer who reads INV-38 as counting HTTP paths should
read this paragraph as the place the choice was made.

## 6. The certificate read policy, narrowed to doc 05

Claude 1's finding 6 asked whether every `CAN_ASSIGN_LEARNING` holder should
read any learner's certificate. Doc 05 §Certificates answers it outright:

| Action | STUDENT | EDUCATOR | HoD | DEAN | INST_ADMIN | SYS_ADMIN | SERVICE |
|---|---|---|---|---|---|---|---|
| Read own certificate | ✅ (own only, incl. classroom-card identity) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

Every staff role is ❌. There is no institution-wide certificate read cell in
the matrix. `certificates_select` and `snapshots_select` are narrowed to
`person_id = current_person_id()`, and F04-T12 walks it as an educator and as an
institution admin rather than reading the policy text. Revocation is unaffected:
INST_ADMIN's ✅ is on the *Revoke* row, `revoke_certificate` is SECURITY DEFINER
gated on `CAN_PUBLISH`, and it never needed table SELECT.

This was a real over-grant, shipped in 0043 and caught by review.
