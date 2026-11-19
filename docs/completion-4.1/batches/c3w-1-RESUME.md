# C3w-1 · Resume note (paused 19 Nov 2026, 22:50 UTC, on the owner's instruction via Bob)

> **Development branch only.** No merge, staging or production action. Resume only on Bob's "resume".

## Head

`claude/c3w-1` at **`d5d69543`** (chunk 1, WIP). This note's own commit is docs only and sits on top of it.

- **The head is red on purpose:** C3W-D1 fails until chunk 2. It is not a hand-off, and no CI or journeys were
  dispatched on it (D-025).
- **The last green hand-off** was step 1 at `83a14825`: CI 44522491936 passed, and journeys 44522496853 passed on
  attempt 2.

## Done

| Commit | What |
|---|---|
| `6c10181f` | The red cases for Bob and Sharon, as docs (`c3w-1-syarat-merah/`). Sharon passed them, with three rulings |
| `7cd283ca` | The seven red cases, registered: C3W-D1, **D1b** (Sharon's usage case), D2, D3, D4, D5, R34 (`selftest/c3w-syarat.test.ts`) |
| `4b8a3f25` | Test refinement: the fixture writes a valid SETTLED attempt; D-3's backward moves isolate the guard trigger |
| `d5d69543` | **Chunk 1, the attempt ledger.** Migration `20270122100000` (the first after the 290 on main); `src/lib/ai/` (the interface, the stub, the provider module, the selection); A2A-L01 ranks 11 to 13 |

- **Six of seven cases pass:** D1b, D2, D3, D4, D5 and R34.
- **C3W-D1 fails** on two things chunk 2 adds:
  - an AI function executable by `authenticated` that reads `current_person_id()`;
  - the tables `ai_asal_soal` and `ai_penerimaan`.
- **Sharon's three rulings are built:**
  - release takes all three locks;
  - one constant, `ai_batas_kirim_tanpa_akhir()` = 7 minutes, against `BATAS_PANGGILAN_MS` = 2 minutes;
  - a closed-shape `p_penggunaan`, checked by `ai_penggunaan_sah`.
- **The ledger fails closed:** `ai_cadangkan` refuses with `AI_BELUM_DIPERIKSA` until R-3's check sets
  `ai_permintaan.diperiksa_at`.

## Next steps, in order

1. **R3-01 to R3-07, red first.** These are Sharon's cases in `C3W-R3-DESIGN.md` (`claude/gracious-lamport-0m1qjr`),
   each with its plant. Commit them before any R-3 code.
2. **Chunk 2**, as a new migration after `20270122100000`:
   - **`ai_minta_draf`:** an authenticated definer. It takes identity from `current_person_id()` and the school from
     the package. It records D10's source-rights confirmation and an idempotency key, then runs R-3's check before
     anything is reserved.
   - **`c3w_bahan` and `c3w_periksa_bahan`:** owned by a dedicated NOLOGIN role that can read content tables only. The
     check returns no name, PINTAR ID or person id. On a match, it records `REFUSED_PERSONAL_DATA` with no hash.
   - **`ai_asal_soal`:** provenance, immutable, granted to no learner.
   - **`ai_penerimaan`:** acceptance, an append-only log in which the latest row is the current decision.
   - The registry rows: `record_class_registry`, `orang_lampiran`, `client_rpc_registry`, and the metric-source
     refusal.
3. **One full pre-flight** on that head (`preflight.sh`).
4. **Push**, then dispatch CI and journeys **once each**, then the hand-off to Bob with the SHA and both run ids.
5. **Later chunks, not started:**
   - `langkah_konten`'s `AI_BELUM_DITERIMA`;
   - the route that calls the stub;
   - the remaining tests, C3-1 to C3-11;
   - Daisy's screens.

## Local state that matters

- **Reset the local database before the next run** (`supabase db reset --local`), so it holds exactly the 291
  migrations on the head.
  - The container often loses Docker. Restart it with `dockerd`, then
    `supabase start -x studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,postgres-meta,mailpit`.
- **The scratchpad's run scripts** (`preflight.sh`, `only-suite.sh`, `only-db.sh`) live outside the repository and may
  be gone after a container change.
  - Targeted database tests: reset the database, then run `npm run selftest:local -- --only=<ids>` with
    `SUPABASE_DB_URL` set.
  - The full pre-flight is CI's job list run locally: lint, typecheck, build identity, the suite, plants and red cases.
- **The local branch `c3w-syarat-lokal`** is obsolete; its work is on `claude/c3w-1`. Nothing else exists only locally.
