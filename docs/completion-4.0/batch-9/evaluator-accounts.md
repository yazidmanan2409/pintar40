# Evaluator accounts for Dr Gladys's team: preparation (7 Nov 2026)

Owner decision «EVALUATOR ACCESS», Option 1:
- each evaluator gets an individual staff account at an email address they control;
- they activate it through PINTAR's existing email verification;
- there is no new authentication system;
- every school, learner, piece of content, result and certificate is synthetic;
- role permissions are unchanged.

**Preparation is authorised. Invitations are not.** Addresses are collected only when the evaluation is ready.

**This document holds no password, authentication secret, PIN or real person's address, and never will.** The evaluators' addresses are never committed to this repository and never written to a workflow log.

## 1. The two schools (staging, `main` `002852ab`)
| | Sekolah Uji Evaluasi A | Sekolah Uji Evaluasi B |
|---|---|---|
| Structure | Bagian «Kelas Tinggi» → Tingkat «Kelas 5» → «Kelas 5A» | the same |
| Learners (all synthetic, «… Murid SEKOLAH-UJI-EVALUASI-…») | 6 active | 6 active |
| Official results / certificates | 12 / 3 | 11 / 3 |
| Chapter | «Matematika Kelas 5 · Bab 1: Pola Bilangan», published | the same |
| Staff roles held now (by the walks' own accounts) | Admin sekolah, Dekan, Kepala departemen («Kelas Tinggi»), Guru («Kelas 5A») | the same |

Every walk run is listed in `evidence/evaluation-schools.md`.

The schools are not flagged `is_synthetic`. This is deliberate, and true of every Golden School: PINTAR caps a synthetic school's evidence below OFFICIAL, so its reports, «Kenaikan» and certificates would show nothing. The content is synthetic throughout; only the flag differs.

The walks' accounts (`goldenschool+…@pintarselalu.com`) stay with the walks. Their credentials are derived from a CI secret and are not shared. **Every evaluator gets their own account.**

## 2. The route each account takes (existing screens only)
1. **«Pendataan».** The school's admin records the evaluator's name, as staff (not Murid).
2. **«Aktivasi».** On the evaluator's row: their address, then «Aktifkan dengan email». No email is sent at this step.
3. **Konfigurasi → «Peran & akses».** The evaluator's role at its place, for example:
   - Guru at «Kelas 5A»;
   - Kepala departemen at «Kelas Tinggi»;
   - Dekan at the school;
   - Admin sekolah at the school.
4. **The evaluator activates.** On «Aktifkan akun» they enter their address, receive the code at that address (the existing email verification) and choose their own password. Nobody else ever sees or sets it.

To try learner journeys, an evaluator signs in as one of the synthetic learners with a class card. The school's admin prints the cards on «Aktivasi» (one class, or several at once, H30). A class card's PIN is printed on the card only, never written down here.

**Who presses the buttons in steps 1–3.** This is to be decided when the addresses arrive:
- **(a) The owner, by hand**, signed in as a Golden School admin or the staging Platform Operator.
- **(b) A staging walk acting as the school's admin.** It would read the addresses from a GitHub secret (never the repository) and mask them in its log.

Either way, activation (step 4) is the evaluator's own act.

## 3. Account plan (fill in when the evaluation is ready; roles and places only, never an address)
| Evaluator | School | Role | Place | Activated (date) | First sign-in verified |
|---|---|---|---|---|---|
| Penguji 1 | A | | | | |
| Penguji 2 | A | | | | |
| Penguji 3 | B | | | | |
| Penguji 4 | B | | | | |

One person may hold more than one role (for example Guru and Kepala departemen) only where the scenario needs it. Permissions follow the role exactly as for a real school.

## 4. Before the first invitation
- [ ] One evaluator-style account taken through steps 1–4 on staging and signed in: a real address the owner controls, not a walk mailbox.
- [ ] H29: the staff bar below 1024 px, seen by a person (a screenshot at 820, 390 and 320 px).
- [ ] The account plan above filled in: roles and places.
- [ ] The evaluator sheet below checked by the owner.
- [ ] Addresses collected, outside this repository.
- [ ] The owner says «invite».

## 5. The evaluator sheet (Bahasa Indonesia; send with the invitation, no password or PIN in it)

> **PINTAR 4.0 — Akun Penguji**
>
> Anda mendapat akun staf PINTAR sendiri di lingkungan uji (staging): **https://staging.pintarselalu.com**.
> Sekolah, murid, materi, hasil dan sertifikat di sana seluruhnya **data uji (sintetis)**, bukan data orang sungguhan.
>
> **Mengaktifkan akun**
> 1. Buka https://staging.pintarselalu.com dan pilih **«Aktifkan akun»**.
> 2. Masukkan alamat email Anda (alamat yang kami terima dari Anda).
> 3. PINTAR mengirim **kode** ke email itu. Masukkan kodenya.
> 4. Buat **password Anda sendiri**. Tidak ada orang lain yang mengetahuinya; tim PINTAR tidak pernah menanyakannya.
>
> **Peran Anda:** _(diisi per penguji: misalnya Guru di «Kelas 5A», Sekolah Uji Evaluasi A)_.
> Yang Anda lihat dan bisa lakukan mengikuti peran itu, sama seperti di sekolah sungguhan.
>
> **Mencoba sebagai murid:** Admin sekolah dapat mencetak kartu kelas. Masuk dengan kartu itu seperti murid.
>
> **Cara menguji:** coba dulu sendiri tanpa petunjuk; gunakan langkah-langkah skenario hanya bila perlu.
> Catat apa yang Anda lakukan, apa yang terjadi, dan apa yang Anda harapkan.
>
> **Bila lupa password:** pilih «Lupa password?» di halaman masuk. Kode baru dikirim ke email Anda.
