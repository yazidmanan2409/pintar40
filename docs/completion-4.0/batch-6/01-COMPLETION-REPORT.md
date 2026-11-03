# Batch 6 · Certificates, Digital Card, Email and Branding: completion report (4 Nov 2026)

**Authority:**
- Owner, 4 Nov: «PINTAR 4.0 — BATCH 5 ENGINEERING ACCEPTED / BATCH 6 DEVELOPMENT GO» (D-159).
- The owner's four rulings before implementation (D-160).

**Where the work is:**
- Development branch `claude/awesome-rubin-bqxp6p`. The code head is `92aa3b2` (CI and the journeys green on it, §2a); the commits after it are documents only.
- Nothing is merged to `main`; nothing is deployed to staging. Production is untouched. Dr Gladys's demonstration records are untouched. The staging freeze holds (D-158).

**Verdict: IMPLEMENTED AND VERIFIED ON THE BRANCH, AS FAR AS ENGINEERING CAN GO. Stopped at the promotion gate.**
- **Built and verified:**
  - the certificate as Daisy designed it;
  - the Digital Card as Daisy designed it;
  - one clean A4 print of every printable surface;
  - email status that claims only what PINTAR can prove.
- **Not complete:** three parts of Batch 6 are waiting on things engineering cannot supply:
  - **F-11**, the licensed wordmark master and the physical print proofs;
  - **DAISY-37**, the final identity-email composition;
  - **W3.21**, Daisy's own republication of the Design System page.
- Under D-160(a), every surface holds today's approved logo in the wordmark's exact slot. The licensed master will be a one-file swap per surface.
- No migration in this batch: staging stays at 193.

## 1. Requirement by requirement

| Item | Done | Evidence |
|---|---|---|
| **W3.19 · CR-03, CR-04, J8.4: the certificate as designed** | • Daisy's frozen round-2 sheet, set in mm (`LembarSertifikat`, `src/lib/sertifikat-lembar.ts`). <br>• Header pair at 22 mm: «SERTIFIKAT PENGUASAAN» in the accent, and the wordmark slot (`MerekSertifikat`, today's logo per D-160(a)). <br>• The record: name 33 pt, «telah menuntaskan» 12 pt, course 16.5 pt. Predikat, Tanggal terbit and Nomor on the axis; the number in IBM Plex Mono, never broken, stepping 12 → 10.5 → 9.75 pt. <br>• The 0.75 mm gold line at 176 mm. It is the card's own gold (one token, Daisy §6). <br>• The band «Diterbitkan oleh» with the school's name as text and **no school logo** (D-160(c)). <br>• The verification group: QR at **level Q**, byte mode, 43-character token (D-160(b)); the printed link without the protocol. <br>• **No photograph,** signature, seal, border or watermark. <br>• Revocation and the data rules are unchanged: issued only; a revoked sheet shows no QR or link and keeps its banner. | B6C-SHEET-01, B6C-QR-01, B6C-FOTO-01, B6C-DATA-01 (each red on the base, green after); evidence `evidence/B6C/` (1-page A4 PDF; QR decoded to the verification URL at 300 dpi; measured mm) |
| **DAISY-36 · one clean A4 page** | • «Cetak atau simpan PDF» is the one action. <br>• `@page sertifikat` is A4 portrait with margin 0. The sheet is exactly 210 × 297 mm, never breaks, and keeps its colours; everything around it is `pin-noprint`. <br>• While printing, the title is «Sertifikat Penguasaan · <course>», which becomes the PDF's file name. | B6C-PRINT-01; journey STU17 (CI job B): the issued certificate printed is the sheet alone, 210 mm wide, one A4 page |
| **W3.20 · CR-21, J2.16: the Digital Card** | • DAISY-24's frozen front and back (`KartuPintar`): CR80 in mm, scaled on screen, and actual size in print. <br>• The line at 32 mm on both faces; the ochre 0.75 mm line; the D-074(1) family colours, taken from the first role alphabetically. <br>• The QR tile with «Pindai untuk membuka halaman masuk PINTAR.»; the wordmark slot `MerekKartu` (today's logo). <br>• Shown on «Akun saya» and the activation welcome. **Staff only**; learners' class cards are untouched. <br>• **No photograph.** The data are unchanged. | B6K-GEOMETRI-01, -WARNA-01, -URUTAN-01, -QR-01, -MEREK-01, -FOTO-01, -STAF-01, -DATA-01 (red on the base, green after); print walk P4 (each face 85.6 mm wide in print); evidence `evidence/B6K/` |
| **D-159(f), D-160(d) · email status** | • Every send shows one of four states PINTAR can prove: «Dalam antrean», «Diserahkan» (accepted by the email server, *arrival not confirmed*), «Gagal», «Tidak dikirim». <br>• A legend says PINTAR never learns of inbox delivery. <br>• The activation welcome, Akun saya and Email uji now say the card was **handed to the email server**, not «sent to your email». <br>• No «delivered» state exists. | B6E-K01, B6E-K02 (red on the base, green after); B6E-K03 (guard) |
| **W3.22 · the A4 print of each surface** | Walked in a real browser at A4 (`audit/b6-cetak.mjs`, now in CI's journeys): <br>• the staff shell (`/konfigurasi`, `/aktivasi`, `/mengajar`) and the learner shell (`/belajar`) print no shell part; <br>• the class-card sheet prints only the set, two across, no card split, one page for three cards; <br>• the Digital Card prints at CR80 actual size; <br>• the certificate prints as one page (STU17). <br>• **Found:** Konfigurasi's section menu printed. It now carries `pin-noprint`. | B6P-K01; the walk's PASS 4/4; evidence `evidence/cetak/` (the class-card sheet's own print is not kept: its cards carry PINs) |
| **W3.20 · CR-22, J2.15: identity emails final** | **Not built: AWAITING DAISY.** DAISY-37 has no composition. Its third point («PINTAR SELALU typeset as live text») also conflicts with Q16 and the Wordmark card. Nothing was invented (D-159(e)). | §3 |
| **W3.20 · OP-3, AP-1: the wordmark in the shell and emails** | **AWAITING F-11.** The licensed outlined master does not exist. The shell keeps today's logo. | — |
| **W3.21 · republish the Design System page** | **DAISY's.** This is her republication, not engineering work. | — |

## 2. Verification

| | Result |
|---|---|
| Full local suite (`selftest:local`): fresh production build, freshly reset database (193 migrations) | **773 passed, 0 failed, 0 skipped.** One justified CI-only skip (F01-R04). Record: `evidence/full-suite-local.txt` |
| Static suite after integration | all Batch 6 guards and every restated test green |
| Typecheck · lint | clean · 0 errors |
| A4 print walk (`audit/b6-cetak.mjs`) | 4/4 PASS |
| `ci` on the code head `92aa3b2` | **success** (41736195658) |
| End-to-end journeys on `92aa3b2` | **success** (41736200006) |

**§2a CI**

| Run | Head | Result |
|---|---|---|
| `ci` 41734258404 | `74b36c7` | **failure, ours.** The lint step rejected two evidence scripts the certificate stream committed (`require()` in `.cjs`). Fixed in `92aa3b2`: they are ES modules now, the pattern `audit/` uses. Kept as failed. |
| journeys 41734264618 | `74b36c7` | cancelled: superseded by the fix (not counted) |
| `ci` 41736195658 | `92aa3b2` | **success**: 18 of 18 jobs, including `selftest contract (strict, local stack)` and the required `verdict` |
| journeys 41736200006 | `92aa3b2` | **success**, both jobs. Job A: every role's screens, Studio, Batch 4 administration, the Batch 5 walk, **the A4 print of each surface (Batch 6)**, the Batch 5 focused checks. Job B: Gladys's path from an empty database, including **the issued certificate printed as one A4 page** (STU17) |

**Tests restated (none weakened; each states why):**
- **UX1-S0-TOKEN-01:** the 1123 px and 72 px exemptions are gone. The sheet is now set in mm, so the allow-list is narrower.
- **UX1-V3-TOKENS-01:** `.pin-sheet .pin-inst` is now 22 px, because the school name is 16.5 pt in the band.
- **UX1-S0-FAKTA-01:**
  - The sheet no longer uses the fact summary.
  - A stronger check is added: no phone rule reaches into the sheet.
- **UX1-BRAND-01 item 4:** PINTAR now reaches the certificate exactly once, through `MerekSertifikat`.
- **DAISY-20-LAYAR-01 §6:** the card's face is Bahasa Indonesia only (ronde-2). The test now asserts the exact Indonesian lines and `lang="id"` in both page languages.
- **B6C-SHEET-01:** after integration it also asserts that the certificate's gold is the card's own token.

## 3. Open: decisions and designs (nothing invented)

| # | What | Who |
|---|---|---|
| 1 | **F-11:** <br>• The licensed Helvetica Neue 65 Medium wordmark master. Until it exists, today's two-band logo holds each slot: «SELALU» prints on the certificate, and on the card the logo is 5.2 mm wide, under the wordmark's 15 mm minimum. <br>• The physical A4 and CR80 print proofs: the gold line freezes only after a print (Daisy §6), and the QR's 0.53–0.58 mm modules (D-160(b)) need a scan on two phones. | Owner |
| 2 | **DAISY-37:** the final identity-email composition. The card inside the email needs Daisy to specify: the composition at 600 and 320 px, light and dark; table HTML or image; whether the back and QR appear; the wordmark with images blocked; whether the rows follow the card's order and colour rule. | Daisy |
| 3 | **The certificate's sage accent** (professional learning): no read the learner may make says a certificate is professional, and UX1-AJAR-KONTEKS-01 forbids the Experience to name the context. So every sheet is plum. The certificate's sealed record would have to carry its accent: a contract decision. | Owner |
| 4 | **D-074(10):** more than two role/school pairs on the card (unresolved). Every line is drawn as is; nothing is truncated or designed. Also undrawn by Daisy: a school-less role beside a school role (set as two lines). | Daisy |
| 5 | **The PDF file name:** «Sertifikat Penguasaan · <course>». Daisy's example named the person, but W3.1 keeps names out of titles and history. | Owner or Daisy |
| 6 | **Print beyond Chromium:** Firefox, Safari and real devices are not proved. | Engineering, at the print proof |
| 7 | **`auth.link_sent`** («…tautan masuk sudah dikirim ke sana»): an approved, pinned string. It claims a little more than the evidence; it was not changed. | Dr Gladys / owner |
| 8 | **W3.21:** the Design System page | Daisy |
| 9 | **Words written by engineering**, for review: <br>• `sertifikat.berkas`, and the English of `sertifikat.diberikan` («has met the mastery standard in»); <br>• `akun.kartu.depan` and `.belakang`; <br>• the email-status words (`emailuji.r.hasil.*`, `emailuji.r.arti`, `aktifkan.w_kartu_terkirim`, `akun.terkirim`, `emailuji.terkirim`). | Dr Gladys |

**Still open from earlier batches, and still visible** (D-159(10)):
- **Dr Gladys's words:**
  - the «Peserta» / «Kenaikan» labels (RV-9, W3.9);
  - the UX-41 heading;
  - the Batch 5 engineering strings.
- **Daisy's designs:**
  - the W3.8 report body and A4 print;
  - the PD «Lihat bukti» view;
  - W3.12, W3.16, W3.6, UX-09.
- **Batch 9:** W9.12.

## 4. Boundaries kept

- **Certificate integrity:** the token, the domain, the seal and revocation are unchanged. `verify_certificate` is untouched. The sheet renders for ISSUED only.
- **No student photograph** on the certificate or the card. Guards plant a photo and check it never renders.
- **Identity boundaries:** no read was broadened, and the card's data source is unchanged.
- **Credentials:** no class-card PIN in the committed evidence.
- **Scope:** no 4.1, 4.5 or 5.0 work, and no Batch 7.

## STOP

Stopped at the Batch 6 promotion gate for owner review. Nothing has been merged or deployed.
