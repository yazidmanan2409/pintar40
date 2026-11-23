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
  - ~~Any failure writes nothing and releases the attempt.~~ *(Corrected 21 Nov, 08:45: a failure at write time writes nothing and **leaves the attempt claimed**. The route then settles it at the reported usage, or the sweep holds it UNRECONCILED. **A sent attempt is never released** (D-2 and D-3, forward only). My wording contradicted my own D-3. Second Eye and Bob caught it.)*
  - **A red case:** the role is revoked after the claim, and the write is refused with nothing written.
- **Addition 2 · `p_soal` is a closed shape, with bounded sizes.**
  - It follows `item-schema.json` with `additionalProperties: false` at every level. **No author, person, school or status field can ride in it.**
  - The stem, option and rationale lengths are bounded, so storage is bounded.
  - **A red case:** an item carrying `author_person_id` (or any extra key) is refused, and nothing is written.
- **Addition 3 · the provenance hash is of the content as stored.** The sha256 in `ai_asal_soal` is computed **after** the write, from the stored item, so a later edit is detectable against it. The C2w lineage carries revisions, as the design says.
- **Bob's four proposed red cases are accepted as stated,** including the plant: the author taken from an argument.
- **Q2 and Q3:** no addition. They stand as accepted in the design (§3; §9, answer 2; C3-1).

**Second Eye's four readings at `feafc7d6`: all confirmed.** (1) `ai_tulis_draf` takes the closed `p_penggunaan` and settles under the three locks, in order. (2) As corrected above. (3) A VALIDATED package is refused. (4) Every request names its target lesson, fixed at insert and re-checked at write. **Also noted for the hand-off:** the provenance and decision rows keep `item_id` as a plain id, because HAPUS removes drafts; `ai_draf_belum_diputuskan` returns a count only, with the person from the session and CAN_DRAFT required.

## Addendum · the hand-off build: 992b568f..eda28393, head 6ace7b2f (23 Nov 2026, 02:05 UTC)

Read: the product delta, 7 migrations (`20270122120000` to `180000`) and the route (`src/lib/ai/jalur.ts`, `src/app/api/draf-ai/route.ts`, `src/lib/ai/penyedia.ts`). Bob verified CI and the journeys on `6ace7b2f`. The pre-flight on `eda28393` is on Second Eye's figures: 1326/0, plants 175/175, red-case 11/11, 0 lock breaches. **PASS.**

**Everything I set is met:**

| Condition | Met by |
|---|---|
| **F-1** | `panjang_karakter` (1 to 20,000) is stored on the request; `ai_cadangkan` reserves `ceil(length × ai_token_per_karakter()) + batas_token_prompt` as its input bound, and refuses a request with no length (`120000`) |
| **F-2** | A lesson's text is read **once** from `c3w_bahan` as the teacher; that same text goes to `ai_minta_draf` and its R-3 check; before `ai_tandai_kirim` the route refuses `AI_TEKS_BERUBAH` unless `sha256(the built excerpt) = sidik` (`jalur.ts:126–137`) |
| **Q1, addition 1** | `ai_tulis_draf` locks the course and refuses `AI_DRAF_TIDAK_TERBUKA` or `AI_TIDAK_BOLEH_MENULIS` at write time |
| **Q1, addition 2** | `p_soal` is closed: the keys are `stem` and `options`, and per option `label`, `body`, `is_correct`, `rationale`. Lengths are bounded (stem 2,000; body 500; rationale 1,000), 2 to 5 options, distinct labels, the exact count, and `MCQ_SINGLE` only. The author is `m.pemohon` from the request |
| **Q1, addition 3** | `isi_sha256 = ai_isi_soal_sha256(item)` is computed after the insert |
| **Bob's four readings** | `p_penggunaan` is checked by `ai_penggunaan_sah`. **A sent attempt is never released:** `ai_tulis_draf` and `ai_gagal` settle only `keadaan = 'RESERVED' and dikirim_at is not null`, under the school, option and platform locks, in order. VALIDATED is refused `AI_PAKET_LOLOS_PERIKSA` before any reservation (`170000`). The lesson is required (`AI_TANPA_PELAJARAN`) |
| **D-3's constant** | `ai_batas_kirim_tanpa_akhir()` is 7 minutes; `BATAS_PANGGILAN_MS` is 120,000; the route passes it; C3W-D3 ties the two |
| **D-1 to D-5, and R3-01 to R3-07** | As accepted earlier, unchanged in substance; `ai_lepaskan`'s three locks are unchanged |
| **`ai_asal_paket`** (`180000`) | `CAN_DRAFT` or `CAN_REVIEW` in the package's school; no `anon` access; the names shown are staff attribution only (requester, decider) |
| **BOB32-K02's fix** | The parser now also stops at `end $function$;`, the end `pg_get_functiondef` writes, so it no longer reads a migration's check block as live refusals. **It reads exactly the function body: tighter, not weaker** |
| **INV-03, a rationale per option** | Output only: nothing new is sent to the provider, and the rationale is closed, bounded and stored like any authored rationale. Learner visibility follows the existing item rules. **No data-exposure risk** |

**C3-2 to C3-10** are on Second Eye's figures. I did not re-run them.

**Note, not a condition:** `ai_tersedia` says yes when the entitlement is active and the reader may draft. It does not consider whether the option is QUALIFIED or whether the date window is open. The button can therefore show while the request is refused `AI_TIDAK_TERSEDIA` or `AI_HAK_BERAKHIR`. That fails closed. Align it with `ai_minta_draf`'s checks when convenient (Daisy's screen).

## Addendum · round 2: eda28393..3ab40cd3, head bc6e50da (23 Nov 2026, 06:00 UTC)

Read: migration `20270122190000_a_draft_s_objectives_are_its_target_lesson_s.sql` (sha256 `1b0873b4…`) and the `tanamTujuan` helper. CI, the journeys and the pre-flight (1327/0, plants 175/175, red-case 11/11, A2A-L01 0 breaches) are on Bob's and Second Eye's figures. **PASS.**
- **`ai_minta_draf`:** I diffed its body against `20270122170000`'s. **The only change is the two new checks:**
  - `AI_TANPA_TUJUAN`: the target lesson has no objectives;
  - `AI_TUJUAN_LAIN`: an objective line is not one of the target lesson's statements.

  Both return, writing nothing, before R-3, before any request row and before any reservation. **Every earlier condition is untouched:** identity from the session, the lesson required, VALIDATED refused, R-3 before reservation with no hash on a refusal, and the grants. The lock order and `p_soal` are in `ai_cadangkan` and `ai_tulis_draf`, which this migration does not change.
- **`ai_tersedia` is now aligned with the request's checks:** the entitlement active, the option `QUALIFIED` with `henti_keras_terverifikasi`, inside the date window, and `draf_boleh_tulis`. **My note from 02:05 is closed.** It still answers only yes or no.
- **`tanamTujuan` is test-only.** It appears nowhere outside `selftest/`. It uses `set local session_replication_role = replica` inside its own test transaction (an owner-only setting, restored to `origin` straight after), as the other fixtures do. **No guard is changed.**
