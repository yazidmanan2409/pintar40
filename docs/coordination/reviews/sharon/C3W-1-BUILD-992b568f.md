# C3w-1 build, chunks 1 and 2 (the ledger and the request entry): independent review

Sharon, 21 Nov 2026 (07:55 UTC). Read-only.

**What I reviewed:**
- `claude/c3w-1` at `992b568fab27ec6d9ee904dd9c65180b816fdb53`;
- the migrations `20270122100000` (sha256 `ae0741a2…`, 403 lines) and `20270122110000` (sha256 `5757977c…`, 326 lines), the security-critical functions read in full.

The checks below are on Bob's figures: CI `44876692877`, journeys `44876695240`, and the pre-flight on `ca19aa8d` (1311/0, plants 175/175, red-case 11/11). DR-D01/D02 are unchanged.

## What holds now

**PASS on the ledger, the request entry and `c3w_bahan`, with two findings: F-1 before C3w-1's acceptance, and F-2 for chunk 3.**

**Met:**
- **D-1:** every ledger function takes only an id (plus the closed `p_penggunaan`) and is `service_role` only. `ai_minta_draf` takes the requester from `current_person_id()` and the school from the course; neither is a parameter.
- **The closed usage** (`ai_penggunaan_sah`): exactly `token_masuk`, `token_keluar` and `biaya_mikro`, as JSON numbers matching `^[0-9]{1,15}$`, so no string, decimal or negative passes. The optional `id_penyedia` matches the strict pattern, and any other key fails.
- **D-4:** `ai_cadangkan` locks `ai_hak_sekolah`, then `ai_opsi`, then `ai_plafon_platform`, each FOR UPDATE, before reading the sums. It caps attempts at 3 per request.
- **The request order:** authority (`draf_boleh_tulis`), the package's state, bounds, the source rights, the entitlement and the option, and **then R-3, before any reservation.**
  - A refusal stores `excerpt_sha256 = null` and the match classes only.
  - Its audit carries the classes, not the text.
  - The spans go back only to the caller, for their own text.
- **R3-05:** `c3w_periksa_bahan` matches names only of persons in the educator's own institutions **and** `person_visible_to_me`. It returns classes and spans, never a name, and refuses a caller with no active role.
- **`c3w_bahan`, per (b):** `LANGUAGE sql`, `BEGIN ATOMIC`, `SECURITY INVOKER`. It reads `lessons` and `learning_objectives` only. A direct `authenticated` call returns no more than the caller's own RLS allows, so being granted beyond the route is harmless. The four plants and B4's script are as ruled; B4 has not yet run, as stated.

## Findings

**F-1 · One long excerpt can stop AI drafting for every school (an availability issue). Fix before C3w-1's acceptance.**
- The reservation's input bound is a fixed `ai_opsi.perkiraan_token_masuk`. The request allows an excerpt of up to **20,000 characters**.
- If the estimate is below a long excerpt's real input, the settled cost exceeds the reservation. That sets the **platform-wide stop**, by design (D-3, §4), so **every school is refused** until an operator clears it.
- **The fix, either of:**
  - **(a)** store the excerpt's **length** on the request (a count, not text), and reserve `ceil(length × k) + the prompt's own bound`, as E's runner does;
  - **(b)** a qualification rule that `perkiraan_token_masuk` covers the maximum excerpt plus the prompt, checked on `ai_opsi` for QUALIFIED.
- **A red case:** a 20,000-character excerpt, settled at its true size, stays within its reservation.

**F-2 · The text sent must be the text checked (for chunk 3, the route).**
- `ai_minta_draf` checks the `p_teks` the client sends, for a pasted excerpt **and** for a lesson. For a lesson source the database does not tie `p_teks` to `c3w_bahan`'s text.
- **Required in chunk 3:**
  - before `ai_tandai_kirim`, the route asserts `sha256(the excerpt it will send) = ai_permintaan.excerpt_sha256`, and sends nothing on a mismatch;
  - for a lesson, it sends exactly the text it checked, never a fresh `c3w_bahan` read;
  - a red case: a request checked on one text and sent with another is refused before any call.
- Otherwise a lesson's own text, which could hold a class list (my 13 Nov control 2), could reach the provider unchecked.

## Addendum · chunk 3, Q1: how generated drafts are written (21 Nov 2026, 08:25 UTC)

Ruled on Bob's message, which names F-1 fixed at `d5d23f09`. I review that fix in the hand-off diff. **`ai_tulis_draf(p_percobaan uuid, p_soal jsonb)` is accepted, with three additions.**
- **What holds:**
  - identity comes from the attempt's own rows (D-1);
  - it is `service_role` only;
  - it requires a claimed, unsettled attempt;
  - it writes items, provenance and the settlement in one transaction, and any failure writes nothing;
  - **"AI-generated" means an `ai_asal_soal` row**, which no client can write.

  A teacher's ordinary draft can never pass as an AI draft. F-2 sits in front of it.
- **Addition 1 · re-check authority and the package's state at the moment of writing, not only at the request.**
  - Between the request and the provider's reply, the requester's CAN_DRAFT can be revoked, or the package can be submitted or sealed.
  - The internal path keeps every check that does not depend on the caller, and `ai_tulis_draf` re-checks the requester's CAN_DRAFT on the package (`draf_boleh_tulis` for that person).
  - Any failure writes nothing and releases the attempt.
  - **A red case:** the role is revoked after the claim, and the write is refused with nothing written.
- **Addition 2 · `p_soal` is a closed shape, with bounded sizes.**
  - It follows `item-schema.json` with `additionalProperties: false` at every level. **No author, person, school or status field can ride in it.**
  - The stem, option and rationale lengths are bounded, so storage is bounded.
  - **A red case:** an item carrying `author_person_id` (or any extra key) is refused, and nothing is written.
- **Addition 3 · the provenance hash is of the content as stored.** The sha256 in `ai_asal_soal` is computed **after** the write, from the stored item, so a later edit is detectable against it. The C2w lineage carries revisions, as the design says.
- **Bob's four proposed red cases are accepted as stated,** including the plant: the author taken from an argument.
- **Q2 and Q3:** no addition. They stand as accepted in the design (§3; §9, answer 2; C3-1).
