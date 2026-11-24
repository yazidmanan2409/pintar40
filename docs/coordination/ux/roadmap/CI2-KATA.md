# CI-2 · Words for the fresh credential after reinstatement or reopening (Daisy, 24 Nov 2026)

> **What holds now:**
> - **Drafted for OD-1** (CI-2-SPEC.md §6, `a816c6bc`; Sol's ask relayed by the owner).
> - **The tension is resolvable in words. Nothing needs Sharon unless she objects to §3's general line.** The reinstated person learns before their first attempt, through the person who reinstated them, and again at any failed attempt, through one line shown to everyone. Neither channel says anything about a specific account.

## 1 · Staff reinstated or reopened (shown to the person who decides: the school admin, or the Admin PINTAR for a reopening)

On the decider's confirmation, `akun.dibuka.kredensial_staf`:
- ID: «✓ Akun {nama} dapat dipakai lagi. Password lamanya tidak berlaku lagi. Beri tahu {nama}: buat password baru lewat «Lupa password?» di halaman masuk, dengan email akun ini.»
- EN: «✓ {nama}'s account can be used again. The old password no longer works. Tell {nama}: make a new password with «Forgot your password?» on the sign-in page, using this account's email.»

**This is the "before the first attempt" channel.** The decider has just confirmed the person's identity (the reopening path already requires it), so telling the person is part of the same contact.

## 2 · A learner reinstated (shown to the school admin who lifts the suspension)

`akun.dibuka.kredensial_murid`:
- ID: «✓ {nama} dapat masuk lagi setelah mendapat PIN baru. PIN dan kartu lamanya tidak berlaku lagi. Buat PIN baru di Aktivasi akun, lalu berikan kepada {nama} sendiri.» + the link «Buat PIN baru untuk {nama}» (the reset that writes the PIN and the derived password, Sharon's (b))
- EN: «✓ {nama} can sign in again once they have a new PIN. The old PIN and card no longer work. Make a new PIN in Account activation, then give it to {nama} in person.»

## 3 · At a failed attempt: one general line for everyone (sign-in, password recovery, PIN recovery)

Under the existing refusal, never instead of it, `masuk.dibuka_kembali_baru`:
- ID: «Akun yang baru dibuka kembali memakai password atau PIN baru. Staf: buat password baru lewat «Lupa password?». Murid: minta PIN baru kepada sekolah.»
- EN: «An account that was just reopened uses a new password or PIN. Staff: make a new password with «Forgot your password?». Learners: ask the school for a new PIN.»

**Confidentiality:** shown to everyone, whatever was typed. It names no account, state or holder (ruling 98; J10's marking). It also covers J10-2 (the school-reset PIN), so one line serves both.

## 4 · F-6, the neutral line, checked on each page

«Bila akun Anda ditutup atau ditangguhkan, Anda dapat meminta dibuka kembali.»

| Page | Reads right? | Note |
|---|---|---|
| Sign-in (email or username) | **Yes** | Its link goes to «Minta akun dibuka kembali», which serves staff |
| Password recovery | **Yes** | The same audience |
| PIN recovery and the card sign-in (learners) | **No, as worded** | A learner's account is closed or suspended by the school, not reopened by an Admin PINTAR request (`ACCOUNT_LEARNER_VIA_SCHOOL`). On learner pages, «meminta dibuka kembali» sends a child to a form that isn't theirs. **Learner variant:** «Bila akun Anda ditutup atau ditangguhkan, tanyakan kepada admin sekolah Anda.» (EN: «If your account was closed or suspended, ask your school admin.») |

**Order on each page:** the refusal, then §3's line, then F-6 (or its learner variant). That is three short lines, from the most common cause to the least.

## EN confirmation before CI-2 freezes (24 Nov 18:50Z, asked by Bob)

The six EN lines are **confirmed with one required correction**:
- **Required:** the app's EN label is «Forgot your password?» (`auth.pw_lupa`), not «Forgot password?». A quoted button must match the button. The correction applies in `akun.dibuka.kredensial_staf` and `masuk.dibuka_kembali_baru`, and is made above.
- **Optional:** in `masuk.dibuka_kembali_baru`, «ask your school for a new PIN» reads more naturally than «ask the school». It is not required.
- **Checked:**
  - «Account activation» matches `nav.aktivasi`.
  - «sign-in page» is already used in the app.
  - `masuk.f6`, `masuk.f6_murid` and `akun.dibuka.kredensial_murid_tautan` («Make a new PIN for {nama}») are confirmed as written.

## 5 · The admin's PIN reset while a learner's account is locked (24 Nov 18:50Z, asked by Bob; Sharon's note)

Under CI-2, a PIN made while the account is suspended or closed is stored as a random secret and never works. The working PIN is the fresh one made at reinstatement (§2). The admin already knows the account's state, so this line reveals nothing.

**Suspended,** `aktivasi.pin_terkunci.ditangguhkan`:
- ID: «Akun {nama} sedang ditangguhkan, jadi PIN tidak dapat dibuat sekarang. PIN baru dibuat saat penangguhannya dicabut.»
- EN: «{nama}'s account is suspended, so a PIN can't be made now. A new PIN is made when the suspension is lifted.»

**Closed,** `aktivasi.pin_terkunci.ditutup`:
- ID: «Akun {nama} sudah ditutup, jadi PIN tidak dapat dibuat sekarang. PIN baru dibuat saat akunnya dibuka kembali.»
- EN: «{nama}'s account is closed, so a PIN can't be made now. A new PIN is made when the account is reopened.»

**Composition (C-7):**
- **Recommended:** the line **replaces** the reset button and the PIN card for a locked learner. A button that produces a PIN that never works hands a child a dead PIN, and the admin can't tell. The words are written for that composition («PIN tidak dapat dibuat sekarang»).
- If the button must stay, the line sits directly above it, and the result must not show or print a PIN card. Bob or Sharon decides.
- The words reuse the app's terms: «ditangguhkan» / «suspended» (`keamanan.akun.ditangguhkan`), and «ditutup» / «closed».
