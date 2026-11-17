# E · the local evaluation procedure (owner's Mac)

Prepared by Bob, 17 Nov 2026, on the owner's approval in principle of option 1 (`E-PAID-RUN-REQUEST.md` §7). **This is
not authorisation for paid calls.** The owner gives it at the moment he types `RUN`, step 5 of `INSTRUCTIONS.md`.

| File | What it is |
|---|---|
| `INSTRUCTIONS.md` | The owner's numbered steps, shipped in the package |
| `jalankan-e.sh` | The one script the owner runs. Steps A–E: offline checks, hidden key prompts, the no-cost key check, the typed `RUN`, then the run, the blinding and the hand-off folders |
| `periksa-kunci.mjs` | The no-cost key check (A3): one GET of each model's record. It prints status and CONFIRMED / NOT confirmed only |
| `build-package.sh` | Builds `pintar-e-local.tar.gz` from the frozen runner at `68ebe2fd` plus the three files above, with `SHA256SUMS` |
| `rehearsal/` | The offline rehearsal (`rehearse-all.sh`, a 127.0.0.1 mock) and its result |

## The owner's requirements, and how each is met

1. **Sharon's security review** comes before the procedure is presented.
2. **Keys:**
   - Each key is read at a hidden prompt (`read -rs`) into the script's memory.
   - It is passed only through the environment of the two commands that need it: the key check and the run.
   - It is cleared straight after the run. The script ends with the key nowhere.
   - It never appears in an argument, a file, the shell history or a persistent variable. Tracing is off, core dumps
     are off and `umask` is 077.
   - The rehearsal checks every output file for the key text and finds none.
3. **Frozen things:**
   - The package is the runner commit `68ebe2fd`, unchanged, checked by `SHA256SUMS` at start.
   - The frozen material is regenerated and compared.
   - The runner's own frozen-set check (kit, score, report against `MANIFEST.json`) applies.
   - `--pack-sha ecb0d3c4…` is fixed in the script.
   - `--live` uses the pinned prices (US$2 / US$10) and refuses `--real-prices`.
   - The caps are `--cap-provider 5 --cap-total 10`.
   - The blinding runs on the owner's Mac, and the sealed map stays there. Only its SHA-256 goes to Bob.
4. **Rehearsed offline:** the exact script, in `--rehearse` mode, has exactly two substitutions:
   - the paid run becomes the offline dry run, with the same caps and pack;
   - the key check points at a 127.0.0.1 mock.

   Seven cases are covered: the happy path, the run not typed, swapped keys, an empty key, a key refused, a tampered
   package, and an existing results folder. Each stop path stops before any spend.
5. **Simple:** one command, two pastes, one typed word, three zip files, and one folder to keep.

Sharon's A1–A5 locally:
- **A1:** Sharon gets `untuk-sharon` (kunci only).
- **A2:** the order is kept, and the map's hash is committed by Bob at hand-off.
- **A3:** `periksa-kunci.mjs`; both checks must pass before `RUN` is offered.
- **A4:** the run window is recorded in milliseconds, and the ledger's first and last times are printed against it.
- **A5:** unchanged, at J3.
