# A3 · D3: the Uji Cepat class figure for a small group

**Form C (the presentation, per option).** Register entry A3.
**Gate:** the threshold touches what a teacher may infer, so **it is the owner's (O3)**. This draws the presentation **for each option the owner may choose**, and zero scored learners under every option. **It is built only after O3.** Nothing here chooses.
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
| **(a) A threshold of 5** (the catalogue's floor for class metrics) | **No class figure.** In its place (P14), still headed «Rata-rata nilai kelas»:<br>• «Belum cukup nilai untuk menampilkan rata-rata kelas.»<br>• «Sekarang 3 murid; perlu 5.» (`ketiadaan.jumlah.murid`)<br>• «Rata-rata nilai kelas muncul setelah cukup murid dinilai.»<br>• the base «3 dari 28 murid sudah dinilai» | The figure, its base, its explanation (A2) | `ambang5-kurang`, `ambang5-cukup` |
| **(b) Another threshold** (drawn with 10) | The same presentation. **The threshold is read from one place** (the catalogue's minimum, as the reports read theirs), never written into the page or its words: «perlu {needed}» carries it. | As (a) | `ambangN-kurang` |
| **(c) No threshold** (today: from one scored learner) | — | **The figure from one scored learner up, exactly as A2.** The small-group presentation is the base itself: «1 dari 28 murid sudah dinilai», at body size and directly under the figure (A2 K4), so «100%» is read as one score so far. **No figure is suppressed, and no other cut-off is drawn.** A sentence that changed at some number would be a threshold by another name. | `tanpa-ambang` |
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

**A PD class** uses «peserta» in the base (`{benda}`, DAISY-33). `ketiadaan.jumlah.murid` has no participant form; under (a) or (b) it needs one (`ketiadaan.jumlah.peserta`, NEW), or the line is left out for a PD class.

## 5. Decisions it depends on

**O3 (the owner):** (a), (b) with its number, or (c). Each acceptance below is conditional on that choice, as the register sets out.

## 6. Acceptance checklist (conditional on O3)

- **If a threshold is chosen** ((a) or (b)):
  - [auto] below it, no class figure renders; the P14 presentation says why;
  - [auto] at and above it, the figure and its base render as A2;
  - [auto] the threshold is read from one place, not repeated in the page.
- **If no threshold is chosen** ((c)):
  - [auto] the figure and its base render from one scored learner up, exactly as A2;
  - [auto] the base is at body size, directly under the figure; nothing is suppressed.
- **Under every option:**
  - [auto] zero scored learners shows the Empty state (A2 K7), never a figure or a zero;
  - [auto] the learners' rows stay in the drill-down.
- [auto] **D-172:** equivalent interactions match their canonical pattern (`../X-KONSISTENSI/`): P14 (not yet, as the reports), P13 (empty), P9 (the one pager), P12 (the Collection), P20.
