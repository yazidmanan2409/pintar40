# C3w-1 · Delta hand-off to Bob, round 2 (23 Nov 2026)

> **Development branch only** (`claude/c3w-1`, ruling 64). No provider call, key or spend.
> - **Follows** `c3w-1-HANDOFF.md` (`6ace7b2f`): Sharon passed the build; Daisy passed the screens with conditions
>   (`TINJAUAN-C3W-1-LAYAR-6ace7b2f.md` at `808a2227`).
> - **Every item Bob listed** is done.

## Head and evidence

- **Head:** the commit carrying this note; its code is `3ab40cd3`.
- **Pre-flight on `3ab40cd3`:**
  - lint, typecheck and build identity (11/0) passed;
  - the whole suite, on a fresh reset and a fresh build: **1327 passed, 0 failed**;
  - planted defects: **175/175**;
  - red-case job: **11/11**.
- **CI and journeys:** dispatched once each, on the head. The run ids are in the message to Bob.
- **A new migration: yes,** for Sharon. `20270122190000_a_draft_s_objectives_are_its_target_lesson_s.sql` brings the
  count to 300 (the pins read 300). A2A-L01 reports 0 breaches.

## Done

| Commit | Item |
|---|---|
| `a9c2ff3b` | **C-1 (C3W-D4), objectives follow the target lesson.** On the screen, the «Tujuan pembelajaran» list is replaced by the chosen target's objectives, the first one ticked; a target with none shows Daisy's sentence under the legend. In the database (the migration above), `ai_minta_draf` refuses a target with no objectives (`AI_TANPA_TUJUAN`, Daisy's sentence) and any objective that is not one of the target's statements (`AI_TUJUAN_LAIN`, which shows the form's existing «not the right value» line), before anything is reserved or sent. Red first: C3W-T07 |
| `a9c2ff3b` | **Sharon's note:** `ai_tersedia` now follows the request's entitlement checks (switched on, option QUALIFIED with its hard stop verified, within its dates). Red first: C3W-C32's three probes |
| `a9c2ff3b` | **C-2:** «Hapus» carries `<span class="pin-sr"> · {posisi}</span>`; C3W-L01 asserts it in the running app |
| `a9c2ff3b` | **N-10** (the new `studio.ai.tanpa_teks`) and **N-11** (`studio.ai.sumber.lain` removed) |
| `a9c2ff3b` | On success, focus moves to the first new card. When the target is another lesson, the success line names and links it |
| `77ed5fd0` | **The C3-11 captures:** `docs/completion-4.1/batches/c3w-1-layar/` (README, `CATATAN.txt`, 34 shots) |
| `77ed5fd0` | **Found by the captures:** while working, the disabled «Buat draf» dropped the keyboard's focus to the page. It is now `aria-disabled` and busy, and a second press is still ignored |
| `3ab40cd3` | The first pre-flight's one failure (DAISY-17-KIRIM-01 could not read the «Hapus» label written inline); the label is now a constant |

## What the captures show (Daisy judges them)

- **The shot list:** every shot in Daisy's §3, at 1280, 390 and 320 px, by keyboard only.
- **At every width:**
  - no horizontal overflow (0 px);
  - focus lands on the first new card's heading on success;
  - the rights box is cleared after AI_DATA_PRIBADI.
- **The learner pages** (/belajar, /belajar/hasil, /belajar/sertifikat) contain none of «AI», «Draf dari AI» or «Disusun
  dengan».

## For Sharon

- **The delta to review:** the migration `20270122190000`:
  - `ai_minta_draf`, restated with the objectives check;
  - `ai_tersedia`, aligned;
  - `ai_tolak`, wording the two new codes.
- **In the tests:** the C1w fixture's lessons carry no objectives, so each C3w world plants one (`tanamTujuan` in
  `selftest/c3w-terima.test.ts`), past the taught-content guard.
