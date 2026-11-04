# A2 · D1: what the Uji Cepat class figure means: its presentation

**Form K (confirmation or correction, per row).** Register entry A2 (W2.4, CR-27, J5.6).
**Surface:** `/mengajar/[kelas]/uji-cepat/hasil`, as built at 0b19707:
- `src/lib/hasil-ujicepat.ts:71-76`: the mean of the official scores of those already scored;
- `src/app/mengajar/[kelas]/uji-cepat/hasil/page.tsx:91-103`.

**Evidence:** `batch-3/evidence/w65/16-uji-cepat-hasil.png`.
**Reader:** Guru (and a PD facilitator, where the class's people are «peserta»).

**What is not mine, and is not touched:**
- **What the figure measures:** the mean of the official scores of those already scored. It stays exactly that unless the owner rules otherwise (O4). Every row below is presentation and wording of that same figure.
- **A minimum group size:** A3, the owner's O3.

**Rules it answers to:**
- D-120 Q8: «the class outcome is primary, the learners' scores a drill-down»;
- DS 11-validation:194: «the class figure in `t-stat` with its base; the learners in a Table one step below it».

---

## The rows

| # | What | Today | Verdict | The approved presentation |
|---|---|---|---|---|
| K1 | **The figure's label** | «Nilai kelas» / «Class score» (`mengajar.cepat.hasil.kelas`) | **Correct** | **«Rata-rata nilai kelas» / «Class average score».** «Nilai kelas» reads as the class's grade, or as a pass. The figure is the average of the scores there are, which is what its own explanation already says. The label now says the same thing, so a «100%» from one learner cannot be read as «the class scored 100%». The meaning is unchanged. |
| K2 | **The base** | «{n} dari {total} {benda} sudah dinilai» / «{n} of {total} {benda} scored» (`mengajar.cepat.hasil.dasar`) | **Confirm** | It reads as «scored, of the class now», which is what it counts (D1's question, answered). `{benda}` stays «murid», or «peserta» in a PD class (DAISY-33). |
| K3 | **The explanation** | «Rata-rata nilai yang sudah ada. Yang belum mengumpulkan, atau belum dinilai, tidak dihitung.» (`mengajar.cepat.hasil.arti`) | **Confirm** | It names the mean and what it leaves out, in a teacher's words. |
| K4 | **The figure's place and form** | first on the page, in the metric panel: label, figure, base, explanation | **Confirm, with one correction of weight** | The panel stays first, before anything else on the page (D-120 Q8). Inside it: **the label (14/20 `ink-2`) · the figure (`t-stat`) · the base (16/24 `ink-1`, directly under the figure, never smaller than the label) · the explanation (14/20 `ink-2`)**. The base is part of the figure (DS:194: «with its base»), so it is read with it and never as a footnote. Today it is 14 px; it becomes body size. |
| K5 | **«Lihat per soal»** | a button after the panel | **Confirm** | It stays after the class figure, before the drill-down: the class first, then where the class found it hard, then each person. On a PD Kelas it is not offered (C2, round 2). |
| K6 | **The drill-down, «one step below»** | a section on the same page: «Rincian nilai», «Diurutkan abjad. Bukan peringkat.», then the Collection | **Confirm the place (D2: a section on the same page); correct the heading's form** | The heading «Rincian nilai» is the page's h2 in `t-section`. Today it renders as an uppercase eyebrow, which reads as a label, not a section. Its line and the Collection (search, status filter, the Table, Penomoran) stay as built. |
| K7 | **No score yet** | the Empty state (`Kosong`): «Belum ada nilai. Nilai kelas muncul di sini setelah ada yang mengumpulkan.» (`mengajar.cepat.hasil.belum`) | **Correct, to follow K1** | **«Belum ada nilai. Rata-rata nilai kelas muncul di sini setelah ada yang mengumpulkan.»** / «No scores yet. The class average score appears here once someone has handed in.» The same name for the same figure. |
| K8 | **A learner handed in but not yet scored** | the cell «Belum ada nilai» (`mengajar.cepat.hasil.nilai_belum`); «—» for one who has not handed in | **Confirm** | Two different absences, said differently. Neither counts in the mean (K3 says so). |

### Observed in the evidence: an engineering note, not a row

The eyebrow reads «UJI CEPAT · UJI CEPAT — 2026-11-02 20:26».
- The assignment's stored title repeats «Uji Cepat» and carries an unformatted timestamp.
- The date belongs to the one date helper (RV-16: «2 Nov 2026, 20.26 WIB»), and the repeated word should go.
- This is the stored title's construction, not this item's wording. It is recorded here so it isn't lost.

## Words (T table)

| Key | Indonesian | English | Kind |
|---|---|---|---|
| `mengajar.cepat.hasil.kelas` | **Rata-rata nilai kelas** (was «Nilai kelas») | **Class average score** (was «Class score») | CHANGED · presentation. It is also A4's D7 row, «Nilai kelas», so A4 takes this answer. |
| `mengajar.cepat.hasil.belum` | **Belum ada nilai. Rata-rata nilai kelas muncul di sini setelah ada yang mengumpulkan.** | **No scores yet. The class average score appears here once someone has handed in.** | CHANGED · presentation, following K1 |
| `mengajar.cepat.hasil.dasar`, `.arti`, `.rincian`, `.rincian.arti`, `.nilai_belum` | unchanged | unchanged | CONFIRMED |

No frozen term is touched. «Nilai» stays the teacher's word for a score.

## Decisions it depends on

- **None, for these rows.**
- **O4** only if the owner changes what the figure measures. Then K1 and K7 follow the new meaning, and K2 and K3 are re-read.
- **A3 / O3:** the small-group rule, drawn separately.

## Acceptance checklist

- [auto] `mengajar.cepat.hasil.kelas` reads «Rata-rata nilai kelas» / «Class average score», and `mengajar.cepat.hasil.belum` names the same figure.
- [auto] `mengajar.cepat.hasil.dasar` is unchanged; `{benda}` renders «murid», or «peserta» in a PD class.
- [auto] The class panel is the first content after the page head; the base is in the same panel, directly under the figure, at body size or larger.
- [auto] «Rincian nilai» is an h2 section heading, not an eyebrow; the drill-down is on the same page.
- [auto] The figure is still the mean of the official scores of those scored (`susunHasilUjiCepat`, unchanged).
- [manual] W6.7 at Level 3: a teacher reads «100%, 1 dari 31 murid sudah dinilai» as one score so far, not as the class's result.
