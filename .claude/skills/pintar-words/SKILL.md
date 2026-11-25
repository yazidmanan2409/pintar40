---
name: pintar-words
description: Rules for any user-facing PINTAR text in Indonesian or English — one name per concept, the verdict words, the translation lookup, words before code, Daisy's review. Use when adding or changing any visible string, label, refusal line, email or printed text.
---

# Words

**Authority:** Daisy's word list. The current one is `TINJAUAN-AR79-PLAN.md` §2 on `ux-1/daisy-experience`; per change, its `*-KATA.md` file. **Daisy owns every word.**

## Rules
- **Words before code:** a batch's strings are written, committed and reviewed by Daisy before the code that shows them.
- **Every visible string goes through the translation lookup, in ID and EN.** No hard-coded page text (L-135, L-136, L-140).
- **One name per concept, on every surface.** Some examples:
  - kesempatan = attempt; pengerjaan = sitting, never «session»;
  - murid, not «Peserta»;
  - tahun ajaran «2026/2027».
- **The verdict words** depend on `bersertifikasi`:
  - certifying: «Lulus» / «Belum lulus» / «Belum dapat ditentukan»;
  - otherwise: «Mencapai target» / «Belum mencapai target»;
  - staff add the figure after the word.
- **No promise a fact doesn't support** (principle 4): no response times or «akan» without a mechanism behind them.
- **A refusal names the cause that applies**, from the action's own code (C-12), except where `pintar-security-boundaries` requires a neutral line.
- **Accessibility is its own verification:** a screen that looks right isn't necessarily accessible.
