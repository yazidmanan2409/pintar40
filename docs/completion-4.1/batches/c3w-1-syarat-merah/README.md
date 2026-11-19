# C3w-1 · Sharon's five conditions as red cases, before any product code (for Bob, then Sharon)

> **Development branch only.** No merge, staging or production action. No provider call, key or spend.
> **Source:** `C3W-1-DESIGN.md` §9 on `claude/bob-41-master-plan` at `8831d62a`.
> **For review only.** The cases' exact source is `c3w-syarat.test.ts.txt` beside this page. It is not yet in the suite, so the branch head stays green; it becomes `selftest/c3w-syarat.test.ts`, registered and red, as the build's first commit once Bob and Sharon accept it.

## The six cases

| Case | Condition | What it proves | Its plant |
|---|---|---|---|
| **C3W-D1** | D-1, identity from the session | The six service functions take one request or attempt id and nothing else, and only `service_role` can execute them. No `ai_` or `c3w_` function takes a person or a school. Every function `authenticated` can execute is a definer with a fixed `search_path` that reads `public.current_person_id()`. `anon` and `authenticated` cannot write any of the seven AI tables. | A service function with a `p_sekolah` argument, or an `authenticated` grant |
| **C3W-D2** | D-2, the conditional claim | The first claim is true on a RESERVED, unsent attempt. A second claim is false and leaves the mark where it was. A claim on a RELEASED attempt is false. The sweep releases an unsent attempt at 11 minutes but not at 9, and a claim after that release is false. An attempt claimed before the sweep stays RESERVED. The claim's source is the single conditional update, and it reads the row count. | The claim without `dikirim_at is null`; a sweep that ignores the mark |
| **C3W-D3** | D-3, forward only | A claimed attempt a day old with no end becomes UNRECONCILED; one a minute old does not. For any writer, the guard trigger refuses SETTLED to anything, RELEASED to anything, UNRECONCILED to RESERVED, and a cleared sending mark. The five forward moves stay allowed. Every update of `keadaan` in an AI function is guarded on `keadaan`. | The guard trigger dropped. Shown caught inside the same rolled-back transaction, as A3-C05 does |
| **C3W-D4** | D-4, lock order | A2A-L01 ranks `ai_hak_sekolah` < `ai_opsi` < `ai_plafon_platform`, so A2A-L01 itself reports any other order. Reserve, settle, release and reconcile each take all three `FOR UPDATE`, in that order. | The option locked before the school |
| **C3W-D5** | D-5, stub under the harness flag | `pilihPenyedia(env)` answers `AI_TIDAK_TERSEDIA` with no flag, with `NODE_ENV=development`, with the flag set to `true`, `0` or empty, and with an adapter named while none is built. Only `PINTAR_AI_STUB_HARNESS=1` selects the stub. The selection never reads `NODE_ENV`. One module reads the flag. Only the provider module imports the stub. No env, deploy or migration file sets the flag. | A fallback to the stub when no adapter is configured (the old §5 rule) |
| **C3W-R34** | R-3, control 4 | Marking a request REFUSED_PERSONAL_DATA while it carries an `excerpt_sha256` is refused 23514 by a check constraint naming both. With no hash it is allowed. A hash that is not 64 hex characters, for example a name, is refused. Neither the request table nor the attempt table has a column for the excerpt's or the output's text. | The constraint dropped |

## Evidence

All runs were local only.

1. **Red on `6153f050` plus these cases** (fresh database, 290 migrations): **0 passed, 6 failed.** Each fails because
   what it names is missing: the functions, the tables, A2A-L01's ranks, and `src/lib/ai/pilih-penyedia.ts`.
2. **The cases can go green.** I applied a throwaway sketch to the local database: the tables, the guard trigger, the
   claim and the sweep. It was never committed, and the database was reset afterwards. **C3W-D2, D3 and R34 passed.**
3. **Each plant is caught against that sketch:**
   - the claim without `dikirim_at is null` turns **D2** red (the second claim is true, and a claimed attempt is
     released);
   - the guard trigger dropped turns **D3** red (all eight backward moves land);
   - a sweep that ignores the sending mark turns **D2** red (a claimed attempt is released);
   - the R-3 check dropped turns **R34** red.
4. Lint and typecheck are clean.

## The interface the cases assume, for review before the build

Where §3 and §9 give a name, the cases use it. The names below are **my proposals** where they don't. If Bob or Sharon
change one, I restate the case before the build, not after.

- **Service functions** (`service_role` only):
  - `ai_cadangkan(p_permintaan uuid)`
  - `ai_tandai_kirim(p_percobaan uuid) returns boolean` (the claim, D-2)
  - `ai_selesaikan(p_percobaan uuid)`, `ai_lepaskan(p_percobaan uuid)`, `ai_rekonsiliasi(p_percobaan uuid)`
  - `ai_sapu()` (the sweep, with D-3's two timings)
  - **Open:** settling and reconciling need the reported usage. D-1 allows only an id, so I propose that the usage
    reaches them from the stub's own record (keyed by the attempt), not as an argument. Is that acceptable, or may
    they take a usage `jsonb` that holds no identity?
- **Columns:**
  - `ai_percobaan`: `keadaan`, `dicadangkan`, `diselesaikan`, `dicadangkan_at`, `dikirim_at`, `berakhir_at`.
  - `ai_permintaan`: `sekolah`, `pemohon`, `course_id`, `sumber_jenis`, `excerpt_sha256`, `tujuan`, `jumlah`,
    `kunci_idempoten`, `hak_sumber_dikonfirmasi_at`, `hasil`.
  - `ai_hak_sekolah`: `sekolah` (the primary key), `opsi`, `aktif`, `jatah`, `batas_per_pendidik` (§9.1), `mulai`,
    `berakhir`.
  - `ai_plafon_platform`: a single row with `plafon` and `berhenti` (the stop).
- **The flag:** `PINTAR_AI_STUB_HARNESS=1`, read only in `src/lib/ai/pilih-penyedia.ts`. The stub is
  `src/lib/ai/stub.ts`, imported only by `src/lib/ai/penyedia.ts`. The harness and the CI jobs that run it are the only
  places that set the flag.
- **The A2A-L01 ranks:** the three tables are unrelated to ranks 1 to 10, so I propose 11, 12 and 13.

## Questions

1. **For Sharon (D-4):** must release lock all three rows? It only lowers holds. D-4 says the order applies to
   reserve, settle, release and reconcile alike, so C3W-D4 requires all three in each. I'd keep that.
2. **For Sharon (D-3):** the hard timeout's value. The cases are written so that any value under about 23 hours
   passes: a day-old mark becomes UNRECONCILED, and a minute-old one does not. Where should the value live: a
   constant in the sweep, or a column on `ai_opsi`?
3. **For Bob:** the next step is the build, starting with the migration (numbered after the 290 already on main). I will start it only after you
   and Sharon accept these cases.

Step 1's head `83a14825`: CI 44522491936 success; journeys 44522496853 success on attempt 2 (attempt 1 failed in runner setup only).
