# Bob → coordinator: BOB-09 (pickers show only Bagian, Tingkat and Kelas, labelled by path)

**Head:** `e3232ca`, on main `f375a44` (merged first).

## CHANGED

One rule, `pilihanTempat` in `src/lib/struktur-kontrak.ts` (pure), used by both pickers.

- **Only the visible levels.** Offered: DEPARTMENT (Bagian), COHORT (Tingkat) and CLASS (Kelas). The school root, the hidden Jenjang and the hidden Reguler are never offered.
- **Labelled by path (D-006).** The label is the visible names along `jalur`, joined by " · ", with the year added for a Tingkat or Kelas: "SMA · Kelas X · X IPS 1 · 2026/2027". Two "1A" in two years are told apart.
- **Order.** Tree order: a Bagian, then each Tingkat (by name, then year) followed by its own Kelas. Names are compared numerically, so "Kelas 2" comes before "Kelas 10".
- **Deactivated places are not offered**, including anything standing under a deactivated Tingkat or Bagian. This matches BOB-08, where the database already refuses placing anyone there.

**The intake (`src/lib/pendataan.ts`, `tempatSekolahDari`).**
- "Tempat" (`node_id`) offers the places above, by label.
- "Program" (`programme_id`) offers each Bagian by its label; the value sent is that Bagian's hidden Reguler. Before, it offered every node's id, including ones that are not programmes.
- `Tempat` gains an optional `program`. The mapping screen's Program line in `src/components/pendataan/BacaDanPetakan.tsx` (Daisy's file) changed by one line to use it. Nothing else on her screen changed.
- The database still decides: `import_row_problems` checks every row as before.

**Lingkup (`src/lib/lingkup.ts`, `myScopesDari`).** The same rule and the same labels; `path` is now filled. A Kelas keeps its subject. No page renders this list today, so testers won't see this half until one does.

## PROOF

| test | red before | green after |
|---|---|---|
| BOB09-K01 | the intake offered "Sekolah Contoh", "Jenjang" and both "Reguler"; bare labels ("1A" twice, "Kelas 1" twice); no Program choices; the mapping screen did not use them; Lingkup offered the same hidden nodes | all pass |

- **Red run:** on main `f375a44` with only the test added. First line: `the intake offers a hidden node: ["Sekolah Contoh","Jenjang","Reguler","Reguler"]; t1a is labelled "Kelas 1", expected "SD · Kelas 1 · 2026/2027"; …`
- **Planted case, in the existing job:** case 7 of `static-fable06-gates`. It makes the rule treat the Reguler as a Bagian. BOB09-K01 must go red naming `["SD · Reguler","SMA · Reguler"]`. Rehearsed locally with the exact CI lines: red for that reason, then the file is restored.
- **No test weakened, skipped or restated.**

## CI

CI #200 on `e3232ca`: green (run 36314093031). CI #201 on `5acc7f8` (BOB-18 (a)-(d) on top) is also green.
- **Local, before the run:** tsc and lint clean; full run on a fresh database: 342 passed, with only the local-only F01-R07 failing; case 7 run verbatim from `ci.yml`: red for its reason, with the file restored.
- **Conservation:** one run and no new job.

## CONTRACT

- `Tempat` = `{ id, nama, program? }`. `nama` is now the path label.
- `ScopeOption.label` is the path label, and `path` is the visible names.
- No codes and no database change.

## MIGRATIONS

None.

## COPY

None. The labels are the school's own names and years; the " · " separator is the one in the board's example.

## QUESTIONS

1. **Daisy's file.** The one-line change in `BacaDanPetakan.tsx` is the Program line the ticket needs. Please confirm she's content with it.

## READY

Yes, on a green run at `e3232ca`.
