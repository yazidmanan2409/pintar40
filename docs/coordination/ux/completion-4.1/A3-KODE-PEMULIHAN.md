# A3 · D12's refusal codes and the recovery screens (Daisy, 16 Nov 2026; Sharon's half pending)

> **What holds now:**
> - **The five codes are the right set** for the learner. Each has **one screen, one sentence and one next step** (§1).
> - **No loop** (§2): nothing redirects by itself. The learner's one step is «Coba lagi» after the teacher allows, and it succeeds once.
> - **Builds on, does not replace:** `DESAIN-AWAL-4.1.md` §4 and my O-4 neutral forms (`TINJAUAN-THE-PLAN-r5.md`). The neutral form is used **whenever the app cannot tell that the device differs**.
> - **Sharon:** whether the set is complete for the mechanism. One gap I see is in §3.
> - **Read:** Bob's note (16 Nov, 22:15); `PLAN-A3-C3W-Z.md` §2 (D7, D10, D11, D-2, D-3).

## 1 · The five codes: who meets each, what it says, where it sends

`role="alert"` for the four refusals. **Not** for `SITTING_NOT_CONTROLLER`, because nothing went wrong for the learner (§4 (c)).

| Code | Who meets it | Screen (ID) | Buttons |
|---|---|---|---|
| **SITTING_NOT_CONTROLLER** | The **old** session, on its next save or screen | Neutral panel (§4 (c)), with the O-4 form when the device is unknown. Title: «Asesmen ini dilanjutkan di sesi lain.» Body: «Jawaban dari sini tidak disimpan lagi. Jawaban yang sudah «Tersimpan» sebelumnya tetap ada.» If an answer was pending: «**1 jawaban** terakhir di sini belum tersimpan.» | «Kembali ke Belajar» |
| **RECOVERY_NOT_AUTHORISED** | A **new** session (another device, or the same one after signing in again) opening an Uji Penguasaan | Title: «Asesmen ini perlu diizinkan guru Anda untuk dilanjutkan.» Body: «Karena Anda masuk lagi atau berganti perangkat, Uji Penguasaan ini hanya dapat dilanjutkan bila guru Anda mengizinkannya. Beri tahu guru Anda nama Anda dan asesmen ini: *{judul}*. Setelah guru mengizinkan, pilih Coba lagi.» | «Coba lagi» (primary) · «Kembali ke Belajar» |
| **RECOVERY_AUTHORISATION_EXPIRED** | The same learner, after more than 10 minutes | «Izin dari guru Anda sudah lewat waktunya. Minta guru mengizinkan sekali lagi, lalu pilih Coba lagi.» | the same two |
| **RECOVERY_AUTHORISATION_USED** | The learner, after the permission has already moved the sitting once, e.g. signed out again | «Izin dari guru Anda sudah dipakai sekali untuk asesmen ini. Untuk melanjutkan lagi di sini, minta guru mengizinkan sekali lagi, lalu pilih Coba lagi.» | the same two |
| **RECOVERY_NOTHING** | Anyone opening a sitting that is already final or closed | «Tidak ada yang perlu dilanjutkan: asesmen ini sudah selesai atau sudah ditutup.» | «Lihat hasil» when a result exists, otherwise «Kembali ke Belajar» |

**The teacher's side:**
- The row and action are §4 (b), with O-4: «di perangkat lain» only when the device differs, otherwise «setelah masuk lagi».
- **A teacher allowing a sitting that has meanwhile finished or closed** meets RECOVERY_NOTHING as: «Murid ini tidak sedang mengerjakan asesmen ini lagi. Tidak ada yang diizinkan.»
- **An expired permission** returns the row to «Sedang mengerjakan» with the action available again. No message: the row is the message.

**Low-stakes** (Pemetaan Awal, Uji Cepat, Latihan; D7 and D11, no teacher):
- **No refusal screen.**
- **One confirmation**, O-4's neutral form: «Lanjutkan di sini? Anda masuk lagi, jadi asesmen ini dilanjutkan di sesi baru. Jawaban yang sudah tersimpan tetap ada.» [Lanjutkan di sini] [Batal]. Use the «perangkat lain» form of §4 (a) only when the device is known to differ.
- Then the quiet line: «Anda melanjutkan di sini. Jawaban yang tersimpan sebelumnya ada di sini.»

## 2 · No loop: the rules the screens must keep

1. **Nothing retries or redirects by itself.** Each refusal stays until the learner chooses.
2. **«Coba lagi» re-checks once.**
   - It succeeds if a valid permission exists.
   - Otherwise it shows the same screen again, with the time of the check: «Diperiksa pukul {jam} {zona}.» That shows the button did something.
3. **After a recovery that a teacher allowed**, the player's quiet line warns before the next loop:
   - «Anda melanjutkan di sini. Jangan keluar dari akun sampai asesmen ini selesai: untuk melanjutkan lagi, guru perlu mengizinkan sekali lagi.»
   - This is the case D-2 creates: sign out, sign in on the same device, need permission again.
4. **The old session never shows a refusal;** it shows the neutral panel. So two sessions cannot bounce a learner between two error screens.
5. **Low-stakes:**
   - the confirmation appears once per new session;
   - «Batal» returns to Belajar and changes nothing;
   - the old session's panel offers no "take it back" button. To return, the learner opens the assessment there, which is a new confirmation, by their choice.

## 3 · For Sharon: one possible gap in the set

- **A held sitting (A2a's emergency) or a platform window refuses recovery** with `SITTING_FROZEN` or the maintenance codes (D10, A3-7). That is right, and **the existing held-sitting words already cover it** (THE PLAN §5.3 F item 3).
- **Please confirm** that no sixth learner-facing case exists: the permission was given but the sitting moved for another reason, e.g. the teacher ended it meanwhile. As I read it, that reaches RECOVERY_NOTHING.

## 4 · Anticipation

**Found before the build**, by **question 2** (the neighbouring act: signing out and in) and **question 4** (before and after a permission is used).
