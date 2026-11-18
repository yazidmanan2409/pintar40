# Verification 7 · «Kenaikan»: what the gain figure compares (PETE-08)

Bob, 18 Nov 2026, 21:25 UTC. Ruling 58. Read on `main` `7ba18b03`; static.

## Finding: CONFIRMED, as a meaning issue, not a calculation error

- **What it is:** for each (learner, chapter) pair in the class, the **current Uji Penguasaan result minus the earliest
  Pemetaan Awal**, averaged over pairs (`calc_class_net_gain`, `20270111100000`:917–923). The calculation matches its
  stated contract (MC-8, H31); it is withheld while any chapter has 1–4 pairs.
- **The two instruments differ.** The content packages carry **4** Pemetaan Awal questions and **8** Cek penguasaan
  questions per chapter: 80 and 160 across 20 chapters (`20261228100000`'s header). They are different questions, and
  the later one follows teaching and may be retaken.
- **What the screen says** (`metrik.kenaikan.arti`, `hle.ts`:3548): "the average difference in mastery before and after
  the lessons, counted per pair…". **It says nothing about the instruments:** not the question counts, nor that the
  two tests differ. The same holds for the school figure (`metrik.kenaikan_institusi.arti`, :3563).

## What it means

- A gain on 4 against 8 different questions is descriptive, and favours a positive number. A leader can read it as
  effectiveness. No figure is wrong; the risk is how it is read.
- **What else it touches:** the leader's page and the school figure; 4.5's comparability rules (where the rule itself
  belongs, D-12 and F03); the pilot's success criterion "can say what the result means".

## Classification

- **Z triage: minor, wording only (Daisy).** One added sentence on both `arti` strings, stating that the two tests
  differ and how many questions each has, where the counts are available. **No calculation change in 4.1.**
- **The rule** (when a gain may be compared at all) **stays in 4.5,** as ruling 55 places it.
- **For Sharon:** a static meaning finding with no permissions or integrity aspect, so no reproduction is needed.
