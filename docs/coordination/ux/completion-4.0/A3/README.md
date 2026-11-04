# A3 · D3: the Uji Cepat class figure for a small group

**Form C (the presentation, per option).** Register entry A3.
**Status: DESIGN ACCEPTED under option (a). O3 is decided (owner, 4 Nov, D-176): a threshold of 5, and the design-policy question is closed.**
- **Five or more** participants with official scored results: the class figure (A2).
- **Fewer than five:** no class average. The approved «not yet» pattern shows the actual scored count and the required threshold, and keeps the class total and scoring status (the base).
- **Zero scored:** the approved Empty state, never a numeric zero.
- **Individual scores stay visible** to authorised educators regardless of the threshold. Authorisation is unchanged.
- **The threshold governs the class-level Uji Cepat figure only.** It hides no individual score and changes no other metric's definition.
- **One authoritative threshold**, read from one place, never written into a page's words.
- **Engineering defect E-A3-1:** the shared «how far» sentence (`kalimatJumlah`, `ketiadaan.jumlah.murid`) says «murid» on professional-learning pages. Corrected at its source, so a PD class says «peserta» (`ketiadaan.jumlah.peserta`, NEW, pending copy approval).

**Option (a) is the built state. Options (b) and (c) are NOT CHOSEN** (D-176); they stay drawn below for the record only and are not built.
**Surface:** `/mengajar/[kelas]/uji-cepat/hasil`, in **A2's accepted composition**: the class first, «Rata-rata nilai kelas» with its base at body size and its explanation, «Lihat per soal», then «Rincian nilai» one step below.
**Rules it follows:**
- the not-yet state is D-172's canonical **P14**, the same grammar as the reports' figures (C1): the statement in the figure's place, how far, and what makes it appear;
- zero scored is **P13**, the Empty state, with A2's accepted line.

**Files:**
- `buat-a3.mts`: run it from the repository root with `npx tsx docs/coordination/ux/completion-4.0/A3/buat-a3.mts`.
- `render/<state>-<width>.png` and `render/laporan.txt`.
- `jalan/`.

---

## 1. The options, drawn

| Owner's option (O3) | Below the threshold | At or above it | Specimens |
|---|---|---|---|
| **(a) A threshold of 5** (the catalogue's floor for class metrics). **BUILT (D-176).** | **No class figure.** In its place (P14), still headed «Rata-rata nilai kelas»:<br>• «Belum cukup nilai untuk menampilkan rata-rata kelas.»<br>• «Sekarang 3 murid; perlu 5.» (`ketiadaan.jumlah.murid`)<br>• «Rata-rata nilai kelas muncul setelah cukup murid dinilai.»<br>• the base «3 dari 28 murid sudah dinilai» | The figure, its base, its explanation (A2) | `ambang5-kurang`, `ambang5-cukup` |
| **(b) Another threshold** (drawn with 10). **NOT CHOSEN.** | The same presentation. **The threshold is read from one place** (the catalogue's minimum, as the reports read theirs), never written into the page or its words: «perlu {needed}» carries it. | As (a) | `ambangN-kurang` |
| **(c) No threshold** (today: from one scored learner). **NOT CHOSEN** (D-176): today's behaviour changes to (a). | — | **The figure from one scored learner up, exactly as A2.** The small-group presentation is the base itself: «1 dari 28 murid sudah dinilai», at body size and directly under the figure (A2 K4), so «100%» is read as one score so far. **No figure is suppressed, and no other cut-off is drawn.** A sentence that changed at some number would be a threshold by another name. | `tanpa-ambang` |
| **Every option: zero scored** | The Empty state (P13): «Belum ada nilai. Rata-rata nilai kelas muncul di sini setelah ada yang mengumpulkan.» (A2 K7). No figure, no zero. | — | `nol` |

**What stays the same under every option:**
- **the drill-down's rows.** Each learner's own score stays in «Rincian nilai», alphabetical, not a ranking. This teacher already sees each score, so the threshold, if chosen, governs only **the class figure**. Whether the rows should also be withheld under a threshold would be a different policy (O3's to state, not drawn here).
- «Lihat per soal» and the page order.

## 2. Layouts

**Widths:** 1280, 820, 390 and 320 px for the five states (`render/`). The not-yet panel holds the figure's place at `measure-narrow`, the same width as the figure, so the page does not move when the figure arrives.

## 3. Keyboard and accessibility

- The not-yet panel is a region named «Rata-rata nilai kelas», like the figure it stands for. Its sentences are text, read in order.
- No colour carries the state: the not-yet ink is quiet, never a warning (P14).
- **Checks** (`render/laporan.txt`), all 20 renders passing:
  - axe WCAG 2.2 AA;
  - targets at least 24 px;
  - no sideways scroll;
  - **no class figure below the threshold**;
  - **the base never smaller than body size**;
  - **the class panel first**;
  - **the drill-down's rows kept** under every option.

## 4. Words (T table)

| Key | Indonesian | English | Kind |
|---|---|---|---|
| `mengajar.cepat.hasil.belum_cukup` | Belum cukup nilai untuk menampilkan rata-rata kelas. | Not enough scores yet to show the class average. | NEW · presentation, for (a) and (b) only |
| `mengajar.cepat.hasil.muncul` | Rata-rata nilai kelas muncul setelah cukup murid dinilai. | The class average score appears once enough students are scored. | NEW · presentation, for (a) and (b) only |
| `ketiadaan.jumlah.murid` | Sekarang {have} murid; perlu {needed}. | {have} students so far; {needed} needed. | EXISTING (the reports' «how far») |
| `mengajar.cepat.hasil.kelas`, `.belum`, `.dasar`, `.arti` | as accepted in A2 | as accepted in A2 | EXISTING |
| `ketiadaan.jumlah.peserta` | Sekarang {have} peserta; perlu {needed}. | {have} participants so far; {needed} needed. | NEW · the participant form, for E-A3-1 at the shared source; pending copy approval |


**A PD class** uses «peserta» in the base (`{benda}`, DAISY-33) and, through E-A3-1's correction, in the «how far» line.

## 5. Decisions it depends on

**None left.** O3 is decided: (a), threshold 5 (D-176). The participant form of the «how far» line is engineering's fix at its source (E-A3-1). The new keys await copy approval.

## 6. Acceptance checklist (option (a), threshold 5)

- [auto] With fewer than five official scored results, no class average renders; the «not yet» pattern shows the scored count and «perlu 5», with the base (class total and scoring status).
- [auto] At five and above, the figure and its base render as A2.
- [auto] The threshold is read from one authoritative place, not repeated in any page's words.
- [auto] Zero scored shows the Empty state (A2 K7), never a figure or a zero.
- [auto] Every learner's own score stays visible in «Rincian nilai» to authorised educators, at every count.
- [auto] A PD class says «peserta» in the base and in the «how far» line (E-A3-1, at the shared source).
- [auto] No score, result, permission or other metric definition changes.
- [auto] **D-172:** equivalent interactions match their canonical pattern (`../X-KONSISTENSI/`): P14 (not yet, as the reports), P13 (empty), P9 (the one pager), P12 (the Collection), P20.
