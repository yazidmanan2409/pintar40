# E · the local evaluation procedure (owner's Mac)

Prepared by Bob, 17 Nov 2026, on the owner's approval in principle of option 1 (`E-PAID-RUN-REQUEST.md` §7). **This is
not authorisation for paid calls.** The owner gives it at the moment he types `RUN`, step 5 of `INSTRUCTIONS.md`.

| File | What it is |
|---|---|
| `INSTRUCTIONS.md` | The owner's numbered steps, shipped in the package |
| `jalankan-e.sh` | The one script the owner runs, with `zsh` (the macOS default; also bash-compatible). Steps A–E: offline checks, hidden key prompts, the no-cost key check, the typed `RUN`, then the run, the blinding and the hand-off folders |
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

   Eight cases are covered: the happy path, the run not typed, swapped keys, an empty key, a key refused, a tampered
   package, an existing results folder, and a stray `.env`. Each stop path stops before any spend.
   Sharon's command-sheet points (`2fc38130`) are applied: the package records and checks its source commit; a `.env`
   in the folder is refused; the folders to send are scanned for key-like text and for the map before they are zipped;
   the map's fingerprint goes to Bob first; and the revocation time is recorded.
5. **Simple:** one command, two pastes, one typed word, three zip files, and one folder to keep.

Sharon's A1–A5 locally:
- **A1:** Sharon gets `untuk-sharon` (kunci only).
- **A2:** the order is kept, and the map's hash is committed by Bob at hand-off.
- **A3:** `periksa-kunci.mjs`; both checks must pass before `RUN` is offered.
- **A4:** the run window is recorded in milliseconds, and the ledger's first and last times are printed against it.
- **A5:** unchanged, at J3.

## Sharon's review of `58225030` (`54a53b7a`), applied

**Required:**
- **R1:** the key check no longer uses the external `env` binary. Each key reaches node through a prefix assignment in a
  subshell only, and `E_REHEARSE` is exported in rehearse mode only. A process-list sampler runs in every rehearsal case
  (about 10,000 lines a case) and finds no key text. The R1 control proves the sampler would catch a key in a live
  process's argv.
- **R2:** live mode unsets `E_REHEARSE` and both `E_REHEARSE_*_BASE` at the start. Rehearsed: 0 variables are left.
- **R3:** before the keys are cleared, the exact key values are given to `grep -rqF -f` through a file descriptor (not
  argv), over every result file, including `run-log.txt`. Exit 0 or 2 stops the script. The R3 control proves a planted
  key is found.
- **R4:** no bash 3.2 could be obtained here (the GNU mirrors are blocked and there is no docker daemon). So the script
  is zsh-safe and run with `zsh`, the macOS default, rehearsed under zsh 5.9, which is macOS's version. The happy path
  is also rehearsed under bash 5.2.

**Recommended:**
- **R5:** the tarball's SHA-256 is sent in a separate message.
- **R6:** an `EXIT` trap clears both keys.
- **R7:** `pbcopy` clears the clipboard after the second key.
- **R8:** the sending order is untuk-bob, then untuk-sharon, then untuk-juri.
- **R9:** the residual risk is stated in the script and the instructions.

## Found while preparing the judges' guide (Bob, 17 Nov, about 13:05 UTC)

**The frozen kit's `reviewer/judgements-template.csv` does not match `score.mjs`'s input.**
- The template's columns are `item_id, judge, role, key_correct, alignment, distractors, language, notes`. It has **no
  review-burden column** and no reason column, and it carries an unclear judge/role pair.
- `score.mjs` (frozen, `c3-judge-sheets/1`) requires all five criteria, `review_burden` among them, plus a `reason`, per
  judge per item, for each provider code.
- Review burden decides Q1 ("accepted"), so judges filling in the kit's template would leave Q1 unscorable.

**Fix, with nothing frozen changed:**
- **`PANDUAN-JURI.md`:** the judges' guide in Indonesian. It is a draft, for Daisy's language check and Sharon's
  check against §4.
- **A corrected scoring sheet,** one CSV per judge: `item_id, juri, benar, keselarasan, pengecoh, bahasa,
  beban_tinjau, alasan`. It is generated from the item IDs in `untuk-sharon/items.json` (the same IDs the judges see).
- **A converter, to be written and self-tested, for Sharon's review:** from the three CSVs plus the code-level slots to
  one `c3-judge-sheets/1` file per provider code, which `score.mjs` then scores unchanged.
  - It needs the map's `slots` (code → item IDs), not its `providers` block (code → provider).
  - So **the owner extracts the slots only, on his Mac.** The provider mapping stays sealed until unblinding.
- **`nilai-juri.mjs`** (17 Nov, about 13:20 UTC) does the four steps: `lembar` (the J1 and J2 sheets), `slot` (the map's
  slots only, run on the Mac), `j3` (the routing, with both reasons and the flag note, A5) and `json` (to
  `c3-judge-sheets/1`).
  - Its self-test passes 9/0.
  - It was run end to end on the rehearsal's real outputs: 60 items, codes A and B, through the **frozen `score.mjs`
    unchanged**, and both scored. The slots file carries no provider or folder name.
  - It reads `,` or `;` CSV, since Excel in an Indonesian locale writes `;`.
- **A stale label in the frozen `score.mjs`:** its output still says Q1 and Q2 are "PROPOSED, awaiting owner approval".
  They were approved by ruling 48. The results document states the approval. The frozen code is not edited.
