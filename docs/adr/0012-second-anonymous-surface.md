# ADR-0012 — The second anonymous surface, and a reading the prompt cannot settle

**Date:** 2026-09-14
**Phase:** FABLE-04
**Status:** Accepted, with one requirement recorded as NOT met — see §4.
**Supersedes:** nothing. **Superseded by:** nothing.
**Amends:** the FABLE-01 lint expectation `functions_executable_by_anon = 0`, openly. See §4.

---

## 1. Two sentences in the same prompt that cannot both hold

FABLE-04 §9, on the verification route:

> `anon` gets **no** table grant. The route reads through a `SECURITY DEFINER`
> projection function registered in `client_rpc_registry`, and that function is
> subject to every gate in §7 like any other.

FABLE-04 §13, the regression table:

> `functions_executable_by_anon` · `anon_table_grants` — **0**

A function registered in `client_rpc_registry` and reached by an anonymous
verifier is a function `anon` executes. The registry is the classification of
*client-executable* RPCs; §7's gates are the gates on client-executable RPCs.
Both sentences are specific, and they point in opposite directions.

## 2. What was built first, and why it did not survive

0044 implemented the §13 reading literally: `verify_certificate` exists, `anon`
executes nothing, and the canonical route reached the projection using the
server's own privilege — the same shape FABLE-01 §7 uses for storage. At the
database, that is genuinely zero anonymous exposure.

It fails a FABLE-01 gate. F01-S03 forbids importing `@/lib/supabase/service`
outside `src/app/api/`, and `/verifikasi/[token]` is a page. Three ways out
existed:

- **(a) Weaken F01-S03 for one file.** Rejected: the standing instruction for
  this work is not to weaken a FABLE-01 control, and a per-file exemption in a
  structural rule is how such rules stop meaning anything.
- **(b) Add an API endpoint under `/api/` for the page to fetch.** Rejected: it
  creates a second anonymous HTTP surface returning verification data, which is
  the shape INV-38 exists to prevent, and it has the page make an HTTP call to
  itself.
- **(c) Do what §9 describes: let `anon` execute the one projection function.**

**(c) is taken.** §9 is the section that governs this surface, it is specific,
and it pre-authorises exactly this mechanism — a registry row, a named counter,
a both-ways assertion. It is also the only option that neither weakens a
FABLE-01 control nor invents a second route.

## 3. How the exposure is declared, counted and asserted

§9's own instruction — *declare it, count it, assert it* — is followed
literally:

- **Declared.** A fourth `rpc_exposure` class, `PUBLIC`, added in 0047 and used
  in 0048. `verify_certificate` is registered under it, and the grant and the
  registry row are written in **one statement** so the exposure and the argument
  for it commit together or not at all. `public_surface_registry` gains a `RPC`
  kind alongside `VIEW` and `ROUTE`.
- **Counted.** `anon_public_surface` moves 1 → 2 as §13 requires, and it moves
  by counting **more** of reality: anon-reachable tables *and* anon-executable
  functions, where it previously counted tables only. A new counter,
  `undeclared_anon_functions`, is the one that must stay at zero.
- **Asserted.** `assert_public_surface()` asserts set equality in both
  directions on both kinds: nothing anon can reach is missing from the
  registry, and nothing in the registry has stopped being reachable. 0048
  plants a probe — a second function granted to `anon` — and requires the gate
  to go red naming it, then withdraws it and requires green. F04-T10 executes
  the assertions **as `anon`**, not as a privilege query about `anon`.

## 4. The requirement that is NOT met, stated rather than engineered away

`functions_executable_by_anon` keeps the definition it has had since migration
0013 and now reports **1**, not 0. **§13's row for that counter is not met.**

It would have been easy to make it read zero by redefining it as "functions
executable by anon that are not declared PUBLIC". That is precisely the move
§9 names as the dishonest version of this change — *"Narrowing a counter while
leaving it named 'zero' is the dishonest version"* — so it was not made.

F01-T13 is changed accordingly, and changed to be **exact rather than
relaxed**: it now asserts `functions_executable_by_anon = 1`,
`undeclared_anon_functions = 0`, `anon_public_surface = 2` and
`public_surface_ok`. A *second* anon grant still fails FABLE-01's lint test, as
it always did.

This is a reading of the prompt, not a licence. A reviewer who concludes that
§13 was meant literally and §9's "registered in `client_rpc_registry`" meant
something weaker should read this ADR as the place the choice was made, and
0044 as the implementation of the other reading — it is still in the history,
one migration back, and reversing to it costs the F01-S03 conflict described in
§2 and nothing else.

## 5. What `anon` can actually do with the grant

Call one function, with one argument, and get five non-identifying fields back
for a token it already holds:

- the argument is a ≥43-character opaque random token (ADR-0010 §1) derivable
  from nothing;
- an unknown token returns no row — no existence oracle;
- a prepared-but-unissued certificate returns no row;
- the projection reads no identity column at all, asserted structurally;
- `anon` holds no table grant, no write anywhere, and cannot execute
  `certificate_prepare`, `certificate_seal` or `certificate_eligibility`.

The page uses a dedicated `supabaseAnon()` client — the anon key with no
session cookie — rather than `supabaseServer()`, so a signed-in visitor and a
stranger get the identical answer and the route never borrows a visitor's
privileges to answer a question any stranger may ask.
