# A2a's page: early read, before code (Daisy, 13 Nov 2026)

> **What holds now:**
> - **BLOCKER, on the page only:** two things a person will see are missing (§1). Both are fixed by adding lines to the page; **the wording for both is below**, so no round trip is needed.
> - **Once the page carries §1, it is NO BLOCKER TO BUILD.**
> - **Artifacts: I cannot open them** (§3). Please put the screenshots on a branch.
> - Read: `claude/a2a` at `7b3b3d31191e5cff4a02823b591eea018cd4aa1f`, `docs/completion-4.1/batches/A2A-COMPLETION.md`, against my `A2-KATA-DESAIN.md` and THE PLAN §5.3 F.

## 1 · Blockers (page only)

**1a · The held-sitting lines are not on the page.**
- §5 carries my A1 to A5. It does not carry **THE PLAN §5.3 F items 1 to 6**, the wording already settled for exactly what a learner and a teacher see during and after the stop. That wording is adopted as exact text in THE PLAN.
- Without them, the build keeps today's `pemeliharaan.darurat.asesmen`, which ends «Bila waktunya habis selama penghentian, beri tahu guru Anda.» **Under D-1 that sentence is false:** a held sitting loses no time. A learner stopped during Uji Penguasaan would be told the opposite of what happens.

**Add to §5, one row each, "carried exactly as THE PLAN §5.3 F has them":**

| THE PLAN §5.3 F | Where it renders | Key |
|---|---|---|
| Item 1: during the stop, «Penghentian ini tidak mengumpulkan dan tidak menilai asesmen yang sedang dikerjakan. …» (replaces the false sentence) | the pause page | `pemeliharaan.darurat.asesmen` |
| Item 2: after the lift, «Asesmen yang ditahan selama penghentian dapat dibuka lagi. …» | «PINTAR dapat digunakan» | `pemeliharaan.kembali.*` |
| Item 3: on reopening, «Asesmen ini ditahan selama penghentian. Sisa waktu Anda: {n} menit.», `role="status"` | the player | new |
| Item 4: the new refusals (a teacher's act on a stopped class; ending or withdrawing an assignment; the promotion run; the activation that did not take effect) | each act's result line | new |
| Item 5: the teacher's list, «Ditahan · dilanjutkan setelah penghentian diakhiri», with no «Atur» | `/mengajar/[kelas]/siapa` | new |
| Item 6: «Admin PINTAR» in place of «Admin platform» | `pemeliharaan.darurat.arti` | existing |

**1b · The refusal when a protected act cannot get the fence has no words.**
- §3 says it "refuses with its own code in A1's domain: the act is retried, never half-done".
- A teacher pressing «Atur», «Akhiri» or «Tambah waktu», or an admin, can meet it in the moment a stop or a lift is taking effect, so it needs a line.
- **It is not the stopped-class refusal:** the class may not be stopped at all.

| | |
|---|---|
| **ID** | «PINTAR sedang memproses penghentian atau pembukaannya, jadi ini belum dapat dilakukan. Tidak ada yang diubah. Coba lagi sebentar lagi.» |
| **EN** | «PINTAR is processing a stop or its end, so this cannot be done yet. Nothing was changed. Try again in a moment.» |

- **The learner's side needs no new line.** A learner's save or submit that meets it should take the player's existing retry path: «Tersimpan» does not appear until the answer is accepted. The page should state that this path is the one used.

## 2 · Corrections (not blockers; for the same page edit)

- **§3 quotes the activation refusal without its last words.** THE PLAN's line is «Penghentian belum berlaku. Tidak ada yang dihentikan. **Coba lagi.**»
- **§7, my screens: the list should name these, not point to my file:**
  1. the emergency form with a class chosen, by keyboard, with the person-level hint and the impact sentence;
  2. the node refusal;
  3. the pause page for a **learner** of the class;
  4. the pause page for a **teacher who also teaches another class** (the other-class line);
  5. the **player on reopening** after the lift (item 3's line, with the time left);
  6. «PINTAR dapat digunakan» after the lift (item 2);
  7. the **teacher's list** during the stop (item 5);
  8. the list row and «Akhiri penghentian» with its confirmation and result line, as an Admin PINTAR;
  9. the same row as the **school's own admin** («Hanya Admin PINTAR …»), with nothing else showing;
  10. the refused lift.

  Each at 390 and 320 px, and item 3 also at 1280.

## 3 · Can I open the journeys' artifacts? **No.**

- **Tried, 13 Nov:**
  - I list a run's artifacts and get a signed download link through GitHub (run `43226758051`, artifact `13949339606`).
  - The link points at Azure blob storage (`productionresultssa11.blob.core.windows.net`), and my session's proxy refuses it: «CONNECT tunnel failed, response 403».
  - The storage host's number varies per run, so allowing one host would not hold.
- **Please put the screenshots on a branch** (for example `docs/completion-4.1/batches/a2a-layar/` on the frozen commit's branch, as B2's fix did). §7's "Where" for my row should say so.

## 4 · Anticipation

Both blockers would have been caught by **question 1**: what else renders this state. THE PLAN's own §5.3 F lines, and the person who meets the fence refusal.
