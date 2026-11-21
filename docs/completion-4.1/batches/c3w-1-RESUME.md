# C3w-1 · Resume note (paused 21 Nov 2026, about 09:50 UTC, at the owner's request)

> **Development branch only.** No merge, staging or production action. No provider call, key or spend.

## Head

`claude/c3w-1` at this note's commit. Its parent is **`41117be5`**, which is WIP.

- **Red on purpose:** C3W-R01 and C3W-T05 are failing-first cases whose code is not written yet.
- **No CI or journeys** have run since the last hand-off.
- **The last hand-off** was `992b568f`: CI and the journeys passed, and Sharon's build review passed it with two
  findings, F-1 and F-2.

## Done since the hand-off (all pushed)

| Commits | What |
|---|---|
| `db689d60`, `d5d23f09` | **F-1.** A long excerpt reserves for its length: `panjang_karakter` and `ai_token_per_karakter()` (k = 1). C3W-F1 |
| `e2d31000` … `ee6bdef6` | **Q2, the acceptance act** `ai_putuskan` (C3W-T01), and **Q3, the submit gate** in `langkah_konten` with `ai_draf_belum_diputuskan` (C3W-T02) |
| `291bd8ab`, `feafc7d6` | **Q1, writing the drafts:** `ai_tulis_draf`, with Sharon's three additions (C3W-T03) |
| `1d13a42d`, `7c9f6266` | **Bob's ruling:** every request names its target lesson; `p_sumber` added (C3W-T04) |
| `41117be5` | **Red:** C3W-R01 (the route core) and C3W-T05 (`ai_gagal`, and `sidik` in `ai_minta_draf`'s answer) |

- **Migrations:** 296. The newest are `20270122100000` through `20270122150000`, and the count pins read 296.
- **Before `41117be5`,** a targeted run passed every C3w-1 case except R01 and T05, together with R3-01 to R3-07,
  A2A-L01 (0 breaches), F06-S01, F28-J311 and DR-D01.

## Next steps, in order (Bob: run 1 to 4 without stopping)

1. **Make C3W-T05 pass.** Add a migration after `20270122150000` that does two things:
   - `ai_minta_draf` returns `sidik`, the sha-256 of the text it checked, on its ok answers and its repeated-key
     answers;
   - a new service function, `ai_gagal(p_percobaan, p_penggunaan, p_hasil)`, settles a claimed attempt at its usage,
     inline under the three locks as `ai_tulis_draf` does, and records `hasil` as PROVIDER_FAILED or INVALID_OUTPUT.
   - Add `ai_gagal` to C3W-D1's LAYANAN, to D-4's PENGUNCI and to D-1b's list. Regenerate the A2A-L01 report and move
     the pins to 297.
2. **Make C3W-R01 pass.**
   - Write `src/lib/ai/jalur.ts`, exporting `buatDrafAi({pengguna, layanan, penyedia, batasMs}, masuk)`. It is pure,
     with imports only from `@/lib/ai/*` and `node:crypto` (R3-07). Its order:
     1. for a lesson source, read `c3w_bahan` once;
     2. `ai_minta_draf`;
     3. stop if no provider is available;
     4. `ai_cadangkan`;
     5. F-2: compare `sha256(text) === sidik`, or else release with `ai_lepaskan` and return `AI_TEKS_BERUBAH`;
     6. `ai_tandai_kirim`;
     7. call the provider through `bangunPermintaan`, with a timeout;
     8. `ai_tulis_draf`, or `ai_gagal` on failure.
   - Retries: at most 3 attempts on a failure with usage, and none after a timeout with no usage.
   - Then a thin server-only wrapper, `src/lib/draf-ai-rute.ts`, which wires in `supabaseServer()` and
     `supabaseService()`. It stays outside `src/lib/ai` because of R3-07's import allow-list.
3. **C3-2 to C3-10**, failing first:
   - **C3-2:** no learner-reachable RPC reads the AI tables;
   - **C3-4:** the race at the allowance's edge, using `selftest/balapan.ts`;
   - **C3-5:** two schools, two options;
   - **C3-6:** the entitlement turned off after the drafts are written;
   - **C3-8:** network-client imports and vendor names;
   - **C3-10:** the cross-batch path.

   C3-9 is the existing suite. C3-11, the screens, waits for Daisy's words; tell Bob on reaching them.
4. **Hand-off:** one full pre-flight, then push, then CI and journeys once each, then report the SHA and run ids to
   Bob.

## Open items, all ruled or relayed

- **Sharon confirms at the hand-off:** Bob's four decisions on Q1 (the usage argument; no release after sending;
  VALIDATED refused; the target lesson), the dropped foreign keys to `items`, `ai_draf_belum_diputuskan`, and F-1's
  fix.

## Local state that matters

- **Docker keeps dying in this container.**
  - Restart it with `bash $SCRATCHPAD/naik.sh`. That starts `containerd` on Docker's own store, then `dockerd`, then
    the stack, then a reset.
  - If the database container keeps "starting" and then vanishes, the disk is at about 96%. Prune the reclaimable
    images (`docker image prune`, about 4 GB) before starting the stack again.
- **Reset the database before any run,** so it holds the head's 296 migrations.
- **The run scripts** (`naik.sh`, `preflight.sh`, `only-db.sh`, `allstatic.sh`) live in the scratchpad, which can be
  wiped.
  - Targeted run: `npm run selftest:local -- --only=<ids>`, with `SUPABASE_DB_URL` set from `supabase status -o env`.
  - The full pre-flight is CI's job list run locally.
