# Ruling 79 audit · J12, operating PINTAR: findings (Daisy, 24 Nov 2026)

> **What holds now:**
> - **J12 walked** with the builder's harness (`audit/perjalanan/j12.mjs`), run locally on the audit world at 1280, 390 and 320, as Admin PINTAR Hendra Kusuma. A learner (Rizky) and a teacher (Dimas) observe each moment.
>   - **Reached:**
>     - L1, maintenance planned in 30 minutes;
>     - L2, extended;
>     - L3, «Mulai sekarang» then «Akhiri sekarang»;
>     - L4, an emergency stop (typed confirmation) and its end.
>   - **Stopped locally:** L5, the test email (no mail sink and a local origin mismatch, an environment fault). L6, the last-admin role, was not walked, as a consequence. Both come from the builder's CI run, and L-36 already covers L6's prevention.
> - **Captures:** `audit79-j12/`, at 390.
> - **4 findings: 1 Significant, 3 Improvement.**
> - **Holds:**
>   - **L2's check** names the impact before extending («Perhatian. 24 asesmen dijadwalkan berlangsung selama periode ini.»), and the confirmation says the affected see the new end time;
>   - **the maintenance page** (learner and teacher) says what is safe («Apa pun yang sudah tersimpan di PINTAR tetap aman») and when to come back;
>   - **the emergency stop** needs a typed «HENTIKAN SEKARANG» and a reason, and its page tells learners «Jawaban yang belum tampil «Tersimpan» …»;
>   - after each end, learners and teachers return to their normal pages;
>   - «Admin PINTAR» is used throughout (T-03).

## Significant

| # | Finding | Siblings (same fact) | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| **J12-1** | **The maintenance warning tells learners to sign out, which then blocks their test.** In the 60 minutes before, learners read «Selesaikan aktivitas Anda dan keluar sebelum pemeliharaan dimulai.» A learner mid-Uji Penguasaan who signs out, as told, needs their teacher's permission to continue afterwards (A3, seen in J4: «Asesmen ini perlu diizinkan guru Anda …»). Following PINTAR's own instruction blocks them. The maintenance page itself says «Asesmen yang sedang dikerjakan tetap dapat diselesaikan dan dikumpulkan» | **Disagree.** The maintenance banner says «keluar»; the player says «Jangan keluar dari akun sampai asesmen ini selesai»; the admin's description says sittings can be finished | **New cause (proposed C-11): two features' rules about the same person's session are written without each other** | B, C | The learner's banner: «Simpan jawaban Anda sebelum pemeliharaan dimulai. Jangan keluar dari akun saat sedang mengerjakan asesmen.» The teacher's and staff banner keeps «keluar» |

## Improvement

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| J12-2 | On a planned window, «Batalkan» (red, which cancels the maintenance) sits next to a plain «Batal» link that cancels the form. Two «cancel» words with different effects side by side | — | — | E, B (visual) | The form's link reads «Tutup tanpa mengubah» (as the Atur panel already says), set apart from the actions |
| J12-3 | «Mulai sekarang» moves a window announced as «dalam 30 menit» to start at once. The page doesn't say, before the press, that people already warned will be cut off now | **Disagree.** The banner promised 30 minutes; the start is immediate | C-7 | E | A confirmation that names the effect: «Orang yang sedang memakai PINTAR akan langsung masuk masa pemeliharaan, walaupun pemberitahuannya menyebut pukul {waktu}.» |
| J12-4 | **Harness, not product:** the learner observer captures (`pengamat-01…`) are covered by the welcome tour («Tur PINTAR 1/7»), so the banner the learner sees isn't in the image (the text is recorded). The visible card also shows «Selesai · target tercapai» (L-33) | — | — | — | **For the builder:** dismiss the tour in the observer before capturing |

## Left for the builder

- L5 (the test email to Mailpit);
- L6 (renewing a platform role; the last admin);
- the EN pass, the screen reader, throttled and reduced-motion passes.
