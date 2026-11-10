# Daisy: my acceptance applies to `ab4146da` (closeout input, 10 Nov 2026)

**Candidate:** `ab4146daa82f1208f78f34aa73dba6e08fc3f379` on `claude/system-integrity-4.0`.

## Hosted results on this SHA (read from the runs, 10 Nov)

| Run | Status | Conclusion |
|---|---|---|
| CI 42785180308 | completed | **success** |
| Journeys 42785184326 | **in progress** when read | none yet |

I do not report the journeys as passed. That result is for Second Eye to collect.

## My accepted coverage, and why it applies to `ab4146da`

Everything below was accepted on a rendered local build of the named commit. Each build used that commit's own `npm ci`, a reset, the report world, then `next build` and `next start`.

`ab4146da` changes only two things: the audit table's presentation, and the closed «Minta membaca lagi» page. Both I rendered and accepted on `ab4146da` itself. Nothing else I accepted is touched, so the earlier acceptances stand.

| Area | Accepted at | Record |
|---|---|---|
| The player: Enter on controls, the inline help offer, the closed-sitting notice, the chosen answer when disabled, «Perlu contoh?» once | `1fad2861`, `821d3853` | `TINJAUAN-1fad2861.md`, `TINJAUAN-821d3853.md` |
| Withdrawn and ended assignments: class page fold, teacher's learner page, Hasil Belajar, the «Hasil belajar» card | `1fad2861`, `821d3853` | same |
| Kenaikan kelas: provenance kept from review to outcome, the main group, the tie, graduating class, summary | `1fad2861` | `TINJAUAN-1fad2861.md` |
| Reissue table, certificate list, reopen form, staff confirmation | `bcecb425`, `1fad2861` | `TINJAUAN-bcecb425.md`, `TINJAUAN-1fad2861.md` |
| B2: instrument names; «Minta membaca lagi» only on a chapter still given; the closed page | `821d3853`, `ab4146da` | `TINJAUAN-821d3853.md`, `TINJAUAN-ab4146da.md` |
| Jejak audit: one entry per run, exact n, sub-pages; C1, C2 and C3 at 1280, 390 and 320 | `821d3853`, `ab4146da` | same |
| D-199: a school's dates on its own clock (four places) | `bcecb425` | `TINJAUAN-bcecb425.md` |

**Demonstrated blocker from my side:** none.

## Carry-forward: presentation, not completion conditions

### Deferred improvements and 4.1 (register)

- Kenaikan step 2's live status line still joins everything with «·».
- The summary sometimes writes the main group last.
- Struktur's «Tambah Tingkat» field still suggests «2026/2027».
- At 320 px the app's top bar breaks page titles mid-word.
- «Kursus» or «Paket» in «Cabut sertifikat» and the list column (X12).
- On a phone the audit header lands as a 15 px empty strip under the bar.
- The first Tab scrolls the audit frame to the run's summary; that is browser behaviour.
- Broader audit presentation.

### Human acceptance gates (unchanged, not mine to close)

These were not seen in any of my checks:
- the integrity count line;
- a certificate's date at a day boundary;
- «Materi tanpa judul»;
- real screen readers, Firefox and WebKit.

The educator walkthrough remains as planned.

Engineering closure does not authorize merging, migration, staging or production. Those stay separately authorized.
