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

---

## 5 · The contract sentence for SITTING_NOT_CONTROLLER (18 Nov, 02:55; for `pengerjaan-kontrak.ts`, A1-K01)

**Second Eye asked:** the line shown where a save is refused, separate from the old session's panel, which comes with A3's screens. **Put it in the contract now.** Do not hold the code out.

| | |
|---|---|
| **ID** | «Asesmen ini sedang dilanjutkan di sesi lain, jadi jawaban dari sini tidak disimpan. Jawaban yang sudah «Tersimpan» sebelumnya tetap ada.» |
| **EN** | «This assessment is being continued in another session, so answers from here are not saved. Answers already «Saved» are kept.» |

- **Neutral under O-4:** «di sesi lain», never «di perangkat lain».
- **It is true for all three causes:** another device, the same device after signing in again, and a request with no session.
- **It matches the panel's body in §1,** so when the screens arrive, the panel only adds its title and its button «Kembali ke Belajar». The words do not change.
- **Rendered in the quiet style, not as an error colour.** Nothing went wrong for the learner. `role="status"`, as the panel's rule says.
- **DAISY-25:** clean.

---

## 6 · Second Eye's recovery act proposal (`claude/a3` at `547b3707`): three points (18 Nov, 11:05)

**No conflict with §1 and §2.** Two small additions follow from point 2.

**1 · A quiet return when the controlling session calls again (D11): agreed.**
- No screen and no line.
- **Keep one thing:** the low-stakes confirmation «Lanjutkan di sini?» (§1) appears **once per new session**, never on this quiet path.

**2 · A separate "request" act after `RECOVERY_NOT_AUTHORISED`: agreed, with two additions.**
- **The learner's screen should say the request now reaches the teacher's list.** Otherwise the learner does not know it did. The body of the `RECOVERY_NOT_AUTHORISED` screen becomes:
  - ID «Karena Anda masuk lagi atau berganti perangkat, Uji Penguasaan ini hanya dapat dilanjutkan bila guru Anda mengizinkannya. Permintaan Anda tampil di daftar kelas guru Anda. Beri tahu guru Anda juga: *{judul}*. Setelah guru mengizinkan, pilih Coba lagi.»
  - EN «Because you signed in again or changed device, this Uji Penguasaan can only continue if your teacher allows it. Your request shows on your teacher's class list. Tell your teacher too: *{judul}*. Once your teacher allows it, choose Try again.»
  - «Beri tahu guru Anda juga» stays: the teacher may not be looking at the list. DAISY-25 is clean, because «Beri tahu» is an imperative to the learner, not a promise.
- **One request, not one per «Coba lagi».**
  - «Coba lagi» re-checks only (§2 rule 2) and never creates a second request.
  - The teacher's row shows one request, with the time of the latest check.
- **The teacher's row label, under O-4:**
  - ~~«Sedang mengerjakan · minta lanjut di sesi lain»~~ **(corrected 18 Nov 12:35, back to O-4's approved teacher form):** «Sedang mengerjakan · minta lanjut setelah masuk lagi»;
  - «… di perangkat lain» only when the device is known to differ.
  - This replaces DESAIN-AWAL §4 (b)'s «… di perangkat lain» for the unknown case.

**3 · No «Izinkan …» for a low-stakes sitting: agreed.**
- The row never offers it, because low-stakes recovery needs no teacher (§1).
- A direct call is refused with the existing `galat.action_not_allowed`. **No new words.**


## 7 · Sharon's ruling (`claude/a3` at `18664491`): the sixth code, and the request act (18 Nov, 12:35)

**RECOVERY_NOT_NEEDED** (teacher side only):
- ID «Asesmen ini tidak memerlukan izin: murid dapat melanjutkannya sendiri setelah masuk lagi. Tidak ada yang diubah.»
- EN «This assessment needs no permission: the learner can continue on their own after signing in again. Nothing was changed.»
- **Role:** `role="status"`, in the row's result line. It is informative, not a fault.
- **The row never offers «Izinkan …» for a low-stakes sitting** (§6.3). So this code is reached only by a stale page or a crafted call.

**`minta_izin_lanjut`, the request as its own act:**
- **The waiting screen is unchanged** from §6.2.
- **«Coba lagi»** re-checks. If the sitting is still not authorised, it calls `minta_izin_lanjut` again. That is safe because a repeat changes nothing, and it covers a first request lost to the network.
- The teacher still sees **one** request, with the latest check time.
- The screen shows no extra line for the request.
- **Refusals of the request act** (the controller's own session, an ended sitting): no learner sentence of their own.
  - The controller's own session is the quiet return of §6.1.
  - An ended sitting shows RECOVERY_NOTHING's screen (§1).
