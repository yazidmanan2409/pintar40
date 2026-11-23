# C3w-1 · Hand-off to Bob (23 Nov 2026)

> **Development branch only** (`claude/c3w-1`, ruling 64). No merge, staging or production action. No provider call,
> key or spend: every drafting call in this batch ran on the local stub, under the harness's own flag.

## Head and evidence

- **Head:** the commit carrying this note. Its code is `eda28393`; this note's commit adds only documents.
- **Pre-flight on `eda28393`:**
  - lint, typecheck and build identity (11/0) passed;
  - the whole suite, on a fresh reset and a fresh build: **1326 passed, 0 failed**;
  - planted defects: **175/175**;
  - red-case job: see the SHA and run ids in the hand-off message.
- **The pre-flight before it** (on `5c35a977`) was red, with 3 failures, all fixed in `eda28393`:
  - BOB07-K01: the decision action read an error's DETAIL directly; it now goes through `kodeGalat`;
  - DAISY-17-KIRIM-01: each decision form now holds its own submit;
  - C3W-C310: the sitting may present the edited draft, so the test accepts it.
- **CI and journeys:** dispatched once each, on the head. Their run ids are in the hand-off message.
- **Migrations:** 299. C3w-1's newest are `20270122160000` to `20270122180000`. The pins read 299, and A2A-L01 reports
  0 breaches.

## Done since `992b568f` (Bob's steps 1 to 5)

| Commit | What | Cases |
|---|---|---|
| `01241a31` | `ai_minta_draf` answers `sidik`, the SHA-256 of the text it checked (Sharon's F-2). `ai_gagal` settles a failed claimed sending at its usage, as PROVIDER_FAILED or INVALID_OUTPUT, under the three locks | C3W-T05 |
| `d3ac2682` | **The drafting route:** the core `src/lib/ai/jalur.ts` (`buatDrafAi`) and `src/app/api/draf-ai/route.ts`, context-bound (§2.11). A VALIDATED package is refused AI_PAKET_LOLOS_PERIKSA at the request (before anything is reserved) and at the write. The PR220 codes carry Daisy's sentences | C3W-R01, C3W-T06 |
| `fa57caa0` | **C3-2 to C3-10.** `ai_asal_paket`, the staff-only provenance read. The engine refuses provenance keys in a learner payload | C3W-C32, C34, C35, C36, C38, C310 |
| `5c35a977` | **The screens, in Daisy's words:** the drafting form, the card's provenance and decision, the held «Ajukan», and the reviewer's count. Also `ai_tersedia`. The provider contract now carries each option's rationale | C3W-L01 (the running app) |
| `eda28393` | The pre-flight fixes above | — |

## How the route runs

1. For a lesson source, it reads `c3w_bahan` once, as the teacher.
2. `ai_minta_draf` checks the text and records the request. A repeated key answers its first outcome and nothing more.
3. With no provider available, it stops here and reserves nothing.
4. `ai_cadangkan` reserves the attempt's worst case.
5. **F-2:** the text about to be sent must hash to `sidik`. If it doesn't, the attempt is released and the route
   answers AI_TEKS_BERUBAH, before the claim.
6. `ai_tandai_kirim` claims the sending.
7. The provider is called, with a timeout.
8. `ai_tulis_draf` writes the drafts and settles the attempt. If the provider fails with usage, `ai_gagal` records
   PROVIDER_FAILED and the route retries, at most 3 attempts. A timeout is left to the sweep. If the write refuses the
   output, `ai_gagal` records INVALID_OUTPUT, the route does not retry, and its answer says the call was made, so the
   screen uses Daisy's §5 line.

## Found by the screens

- **The stub's drafts were refused by the write.** Every option needs a rationale (INV-03, OPTION_REASON_MISSING), and
  the provider contract had no field for one. `SoalDraf` options now carry an optional `rationale`, and the stub
  supplies one.
- **A real adapter must also supply a rationale** for every option, or the write refuses its answer as
  AI_KELUARAN_TIDAK_SAH.

## For Sharon

**New since her build review:**
- the migrations `20270122160000`, `20270122170000` and `20270122180000`;
- `ai_asal_paket` and `ai_tersedia` (STAFF in `client_rpc_registry`, CAN_DRAFT);
- in BOB32-K02's parser, the end of a restated function body (`end $function$;`) now also stops its reading, so a
  migration's check block is no longer read as runtime refusals.

## For Daisy: where the build differs from her words

- **«Kesulitan» is not on the form.** The request builder is R-3's closed four-key record, which has no difficulty.
- **«Pelajaran lain di paket ini» is not built.** A request records its target lesson only, so the form offers the
  target's own text or a pasted text.
- **The objectives listed are the lesson on screen's,** even when another target lesson is chosen.
- **AI_TEKS_BERUBAH has no sentence of its own.** It shows AI_GAGAL's line.
- **The captures at 1280, 390 and 320 px, by keyboard (C3-11), are still to take.** C3W-L01 proves the states in the
  rendered HTML.
