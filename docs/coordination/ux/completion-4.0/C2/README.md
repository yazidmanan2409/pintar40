# C2 · W2.16 item 5: the PD Kelas «Lihat bukti» presentation

**Form C (composition).** Register entry C2 (DAISY-35(5), CR-57, J9.8).
**Surface:** `/mengajar/[kelas]/bukti` for a professional-learning (PD) Kelas, as built at 0b19707 (`src/app/mengajar/[kelas]/bukti/page.tsx`).
**Reader:** the facilitator, who is the class's Guru.
**Rule:**
- D-070(h): a PD Kelas keeps its ordinary «Lihat bukti» page, **empty of academic figures by design**. «Presentation only; no figure is added or computed.»
- DAISY-35(5): the professional-learning record is the page that matters (D-070(a)).
- D-069(b): that record carries each participant's individual result for this facilitator; no aggregate academic figure and no ranking anywhere.

**Decisions needed:** none. No O# or G# applies.

**Missing evidence, and its substitute:** no seeded PD class exists. The PD specimens (`pd`, `pd-kosong`, `tolak`) are a **labelled substitute drawn from the code path**: the page with `ctx.ini.jenis = "PARTICIPANT"`, the participant words (`kataAnggota`, DAISY-33) and the five class metrics it asks for. Per the register, a PD class is reproduced on a disposable stack before acceptance.

**Files:**
- `buat-c2.mts`: run it from the repository root with `npx tsx docs/coordination/ux/completion-4.0/C2/buat-c2.mts`.
- `c2.css`, which loads on top of C1's `c1.css` and `c1b.css`: the same figure and list layout.
- `render/<page>-<width>.png` and `render/laporan.txt`.
- `jalan/`.

---

## 1. The composition

**The page stays the ordinary page** (D-070(h)), top to bottom:
- the back link (the class);
- the scope line (school / class / school year);
- the head: eyebrow «Bukti · PD Guru Matematika», h1 «Apa yang sudah bisa disimpulkan», and the built intro;
- «Keadaan hari ini», as built;
- «Kesimpulan»;
- the footnote: the ordinary page's `mengajar.bukti.kaki`, **but not on a PD Kelas** (see below).

**What changes, for a PD Kelas only: «Kesimpulan».**

- **Today:** the page asks `metric_evaluate` for the five class metrics (Pemahaman, Kenaikan, Penguasaan per bagian, the recurring misunderstandings, the bands). For a PD class each returns no figure. The page draws five «not yet» statements, each saying what will make its figure appear: a promise of figures that never come.
- **Composed:** one well holding:
  - **«Kelas pengembangan profesi tidak menghasilkan angka akademik kelas. Kemajuan dan hasil setiap peserta tercatat di Catatan pengembangan profesi.»**
  - **«Buka catatan pengembangan profesi»** (secondary button), leading to `/pengembangan/[simpul]` for this place (DAISY-34). That page shows the facilitator each participant's progress and result (D-069(b); C1 part B).
- **No figure, no figure's place and no «not yet» card is drawn.**

**«Keadaan hari ini» stays as built,** and it holds no academic figure:
- per open or closed assessment, its title and the participation counts: «Mengumpulkan 4 / 9», «Jendela», «Sudah mulai, belum mengumpulkan 2 peserta», «Belum mengerjakan 3 peserta»;
- the people are «peserta» throughout (DAISY-33);
- **one word fix:** «Lihat nama murid» becomes **«Lihat nama peserta»**. Today it is the one people-word the participant switch misses: `mengajar.bukti.siapa` is not in `KATA_PESERTA`.

**The links under each assessment** (corrected after the owner's local reproduction, round 2):
- **PD Kelas:** «Lihat nama peserta», and «Minta membaca lagi» once an Uji Penguasaan is handed in. **«Lihat per soal» is not offered.** Live, it leads the facilitator to the refusal page.
- **Ordinary class:** as built: «Lihat nama murid» · «Lihat per soal» · «Minta membaca lagi».

**The footnote** (corrected, round 1):
- The ordinary footnote says integrity signals are «ditinjau Kepala departemen, bukan guru». **That is false for a PD Kelas**: PD integrity signals are not surfaced to school leadership (D-069(c)).
- The PD page gets **its own footnote, or none. The words are Dr Gladys's.** The specimen draws a labelled slot, «[Dr Gladys · catatan kaki untuk Kelas pengembangan profesi, atau tanpa catatan kaki]», never filled. If she chooses none, the slot is removed and nothing else moves.

**The intro stays:** «PINTAR hanya menyimpulkan bila bukti resminya cukup. Belum cukup bukan berarti buruk — artinya belum.» It is the ordinary page's line, and the page stays ordinary. «Kesimpulan» then says plainly that this class has no figures, so nothing waits.

**The ordinary class is unchanged** (`biasa`, drawn for contrast): its figures, or their «not yet» statements, as built.

## 2. Layouts

**Widths:** 1280, 820, 390 and 320 px (`render/`). The page does not print a report; the shell's print rules apply.

| Width | What changes |
|---|---|
| 1280 / 820 | The staff shell; the well at `measure-prose` |
| 390 / 320 | The App shell's top bar; the button wraps its words inside the well |

## 3. States

| State | Specimen |
|---|---|
| PD Kelas, an assessment open | `pd` (substitute) |
| PD Kelas, nothing open yet | `pd-kosong` (substitute): «Keadaan hari ini» shows the built empty line; «Kesimpulan» shows the same statement and pointer |
| Ordinary class, for contrast | `biasa` |
| Refusal: a class this facilitator doesn't teach | `tolak`. The built HalamanPenolakan with the educator persona, `tolak.arti`'s staff line (UX-45) and «Mengajar». |

**Loading:** the built MemuatHalaman.

## 4. Keyboard and accessibility

- **Tab order:** the skip link, the places, the back link, the scope line's links, «Lihat nama peserta», «Minta membaca lagi», «Buka catatan pengembangan profesi».
- **Tree:** «Kesimpulan» is an h2 section holding one paragraph and one link, which is named by its words.
- **Checks** (`render/laporan.txt`): axe WCAG 2.2 AA in all 16 renders; every target is at least 24 px; focus rings. For the PD specimens:
  - **no figure and no figure's place**;
  - the pointer drawn exactly once;
  - **no «murid»** outside the shared intro;
  - **no «Lihat per soal»**;
  - **not the ordinary footnote**.

## 5. Words (T table)

| Key | Indonesian | English | Kind |
|---|---|---|---|
| `mengajar.bukti.pd.arti` | Kelas pengembangan profesi tidak menghasilkan angka akademik kelas. Kemajuan dan hasil setiap peserta tercatat di Catatan pengembangan profesi. | A professional-learning class produces no class academic figures. Each participant's progress and result are kept in the professional-learning record. | NEW · presentation; pending copy approval |
| `mengajar.bukti.pd.buka` | Buka catatan pengembangan profesi | Open the professional-learning record | NEW · presentation; pending copy approval |
| `mengajar.bukti.siapa_peserta` | Lihat nama peserta | See the participants' names | NEW · the participant form of `mengajar.bukti.siapa`. It joins `KATA_PESERTA` (DAISY-33). |
| the PD footnote | **[Dr Gladys's slot]**, or no footnote | — | Dr Gladys's words (round 1; D-069(c)) |

«Catatan pengembangan profesi» is the existing name of the record (`config.peserta.catatan`). No frozen term is touched. **UX1-AJAR-KATA-01 holds:** every new key is declared in both languages and addressed formally; the learning surface renders none of them.

## 6. Components and tokens

**Components:** the staff shell, Back link, Breadcrumb, Page head, Section, key/value list (C1), Well, Button (secondary), Link, Empty state, Refusal. **Tokens only;** no new token.

## 7. Navigation and outcomes

| Action | Outcome |
|---|---|
| «Buka catatan pengembangan profesi» | `/pengembangan/[simpul]` for this place; its own gate decides (`professional_learning_record`) |
| «Lihat nama peserta» | `/mengajar/[kelas]/siapa?penugasan=…`, as built |
| The back link | the class page |

## 8. Edge cases, and engineering notes

These are not decisions.

- **The condition:** the composed «Kesimpulan» is drawn when the class's kind is PARTICIPANT, the value the page already reads (`jenisAnggota`). The page then need not ask for the five metrics. Asking and discarding would also be correct, but it is wasted work.
- **«Lihat per soal»** is not offered on a PD Kelas: the built link is withheld when the kind is PARTICIPANT, the same condition as «Kesimpulan». «Minta membaca lagi» stays, as built.
- **A facilitator without access to the record:** the record's own gate refuses, with the refusal line proposed in C1 part B.
- **A class whose kind is unread** fails safe to LEARNER (`jenisAnggota`): the ordinary page.

## 9. Acceptance checklist

- [auto] A PD Kelas «Lihat bukti» shows no figure, no figure's place and no «not yet» card (D-070(h)).
- [auto] The pointer to the professional-learning record is drawn once, under «Kesimpulan».
- [auto] A PD Kelas names its people «peserta», never «murid», outside the shared intro (DAISY-33; the new `mengajar.bukti.siapa_peserta`).
- [auto] No sideways scroll at 1280, 820, 390 or 320 px; axe WCAG 2.2 AA, 16 of 16; targets at least 24 px; focus rings.
- [auto] A PD Kelas offers no «Lihat per soal»; «Minta membaca lagi» stays once an Uji Penguasaan is handed in.
- [auto] A PD Kelas does not carry the ordinary footnote; it carries Dr Gladys's footnote, or none (D-069(c)).
- [auto] UX1-AJAR-KATA-01 holds with the three new keys (engineering's test, once the keys are in the copy table).
- [manual] A PD class reproduced on a disposable stack and compared with the substitute specimens before acceptance (register C2).
- [manual] Side-by-side review of the build at each width (brief G:14).
- [manual] DAISY-35's own acceptance (BRD:260).
- [auto] **D-172:** equivalent interactions match their canonical pattern (`../X-KONSISTENSI/`): P3, P13, P14, P15; the PD «Kesimpulan» is one statement, not P14's «not yet» (no figure ever comes).
