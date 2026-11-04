# Screen references and approved specifications, per item · 4 Nov 2026

**Sources:**
- **Current screens:** existing batch evidence wherever it was sufficient. Where none existed, new screenshots were taken on 4 Nov from the running application (development branch, production build) on a local, disposable stack with the synthetic seed. The capture tool is not in the repository.
- **Daisy's frozen specifications:** on her branch `origin/ux-1/daisy-experience` (**DS** = `docs/coordination/ux/sistem-desain/project/`). Card, certificate and email-frame renders are also at HEAD under `docs/coordination/ux/`.

**New screenshots:** `docs/completion-4.0/daisy-design-completion/layar/`.

**Personas** (synthetic seed):

| Persona | Account | Role |
|---|---|---|
| guru-yang-belajar | `siklus-guru` | teaches and learns |
| admin-platform | `sysadmin` | Admin platform |
| admin-sekolah | `alpha-admin` | Admin sekolah |

| Item | Route(s) and role(s) | Current screen (evidence) | Frozen Daisy spec (if any) | Approved behaviour to keep |
|---|---|---|---|---|
| **A1** W1.2 question review | `/studio/paket/[course]`: Kepala departemen, Admin sekolah, Guru | `batch-3/evidence/w65/09-buat-dan-kunci.png`; `batch-3/evidence/sisi/j1-terbitkan.png` | none; nearest: the Bank Soal single question (DS/11-validation.md:181) | every question, its key and every option's reason readable before «Setujui isi» (D-088(h)); no per-question approval (D-142) |
| **A2/A3** D1, D3 the Uji Cepat figure | `/mengajar/[kelas]/uji-cepat/hasil`: Guru | `batch-3/evidence/w65/16-uji-cepat-hasil.png` | DS/11-validation.md:194 (the figure in `t-stat` with its base; the Table below) | the class outcome primary, the learners a drill-down (D-120 Q8); the figure is the mean of official scores |
| **A4/A5** Batch 3 words and confirmations | Studio, Mengajar | `batch-3/evidence/sisi/`: `j1-kelas.png`, `j1-terbit.png`, `j1-terbitkan.png`, `j1-tersedia.png`, `j5-jendela.png`; `batch-3/evidence/sisi-penutupan/`: `f7-bank-guru.png`, `j1-beranda.png`, `j1-kelas.png`, `j1-siapkan.png`, `j5-jendela.png` (each: our render beside hers) | her renders cited per item in `batch-3/02-DAISY-QUESTIONS.md` | as built |
| **B1** W3.6 Konfigurasi | `/konfigurasi` (+ `/konfigurasi/keamanan`, `/konfigurasi/email-uji`, `/konfigurasi/sertifikat`): Admin sekolah; Admin platform in «Seluruh platform» | **`layar/konfigurasi-admin-sekolah-1280.png`, `-820.png`, `-390.png`** (new); **Admin platform: missing** (below); `batch-4/evidence/admin-ujung/09-menunggu.png`, `10-email-tertahan.png`; `batch-6/evidence/cetak/staf-konfigurasi-cetak.png` | DS/07-proposal.md:50; DS/05-navigation.md:34 | every section's function and data; «Yang menunggu» (UX-33); the paged schools (W2.10); the section menu never prints (Batch 6) |
| **B2** UX-09 «nomor induk» | `/pendataan`, `/aktivasi`: Admin sekolah | `batch-4/evidence/admin-ujung/01-kode-sekolah.png` | none (UXR:23 names DAISY-20/24) | the PINTAR ID is shown where it is the PINTAR ID (Batch 4 fix) |
| **B3/B4** the card's pairs | `/akun`, the activation welcome: staff | `batch-6/evidence/B6K/`: `contoh-tiga-pasangan.png` (B3 only, not designed), `contoh-dua-sekolah.png`, `contoh-satu-sekolah-dua-peran.png`, `akun-1280-depan.png`, `akun-1280-belakang.png`, `akun-1280-halaman.png`, `akun-1280-kartu.png`, `akun-320-depan.png`, `akun-320-belakang.png`, `akun-320-halaman.png`. **B4's platform-plus-school card: missing** (below) | the card round 2 README §K, §10 (render F-kasus-uji) at `docs/coordination/ux/kartu-pintar/ronde-2/` | D-074 order, colour and capacity; staff only; no photo |
| **C1** W3.8 reports | the ten routes, roles and variants in the brief §5 «C1: the concrete routes» (`/edukator/ringkasan`, `/dekan/ringkasan`, the seven `/pimpinan/…` routes, `/pengembangan/[simpul]`); Admin sekolah is refused `/pimpinan` by design | `batch-5/evidence/B5A/`: `ringkasan-kelas-1280.png`, `ringkasan-kelas-320.png`, `ringkasan-kelas-print.png`, `ringkasan-kelas.pdf`, `ringkasan-sekolah-1280.png`, `ringkasan-sekolah-320.png`, `ringkasan-sekolah-print.png`, `ringkasan-sekolah.pdf`, `pimpinan-1280.png`, `pimpinan-kelas-1280.png`; `batch-5/evidence/walk/run3-fresh/04-laporan-kelas.png`, `04-laporan-kelas-cetak.png` | DS/08-migration.md:160-181 (print rules; the certificate and class sheet only) | the staff shell; school, class and period named; print without navigation; the approved metric words; the metric definitions |
| **C2** PD Kelas «Lihat bukti» | `/mengajar/[kelas]/bukti` for a PD Kelas: facilitator | **missing** (below): the synthetic seed has no PD class. The nearest ordinary class page: `batch-3/evidence/w65/13-riwayat.png`, labelled as a substitute; code `src/app/mengajar/[kelas]/bukti/page.tsx:136` | `docs/coordination/design/EDUCATOR-AS-LEARNER-TICKETS.md:382, :746` | no academic figure added or computed (D-070(h)) |
| **D1** DAISY-37 emails, the card in email | six identity emails: staff | `docs/coordination/ux/email-frame/render-wiring/`: `contoh-kode-320-terang.png`, `contoh-kode-320-gelap.png`, `contoh-kode-600-terang.png`, `contoh-kode-600-gelap.png`, `contoh-kode-600-tanpa-gambar.png` (the frame as built) | `docs/coordination/ux/email-frame/README.md`; the card-in-email mock-ups `docs/coordination/ux/kartu-pintar/ronde-2/render/`: `H-email-600-terang.png`, `H-email-600-gelap.png`, `H-email-320-terang.png`, `H-email-320-gelap.png` (they predate D-161's wordmark) | D-079; the honest send status (D-160(d)); plain text |
| **D2** the download name and PDF title | `/belajar/[tugas]/sertifikat` (print): Murid | `batch-6/evidence/B6C/sertifikat-A4.pdf` (Title «Sertifikat Penguasaan · Matematika · Pecahan Senilai»), `batch-6/evidence/B6C/cetak-A4.png` (the visible heading, not reopened) | sertifikat round 2 README:392 | the certificate sheet as frozen; W3.1 |
| **D3** physical proof | the certificate and the card in print | `batch-6/evidence/B6C/cetak-A4.png`, `ukuran-cetak.json`; `batch-6/evidence/B6K/akun-cetak.pdf`, `ukuran.json` | D-074(9)(12), D-080(6)(7); round 2 §6 | the 43-character token; QR level Q (D-160(b)) |
| **D4/D5** the Design System page and brand slots | every surface | `layar/rail-rentang-mengajar-1100.png` (the shell logo); `batch-6/evidence/B6C/cetak-A4.png` (the certificate slot); `batch-6/evidence/B6K/akun-1280-depan.png` (the card slot) | **superseded:** DS/components/Wordmark/README.md (D-161(e)); the settled direction is «Pintar» `#075056` with the placeholder | the wordmark direction is settled; the master, the running-text naming and the tab icon stay open; **today's logo stays in every slot until an approved replacement exists** (D-160(a)) |
| **E1** W3.12 J3 under L3 | every staff shell at 1280, 820, 390, 320 and 1024–1279 px | **`layar/rail-rentang-mengajar-1100.png`, `layar/rail-rentang-1024-1279-1100.png`** (new: the full 248 px navigation at 1100 px, no rail) | DS/05-navigation.md:34-56; DS/components/J3MengajarBelajar/README.md; DS `render/jalan/J3MengajarBelajar*.txt` | the working context (D-132); one context's places in the shell |
| **E2** W3.16 the chooser | `/`: every multi-context staff person | **`layar/pemilih-guru-yang-belajar-1280.png`, `-820.png`, `-390.png`; `layar/pemilih-admin-platform-1280.png`, `-390.png`; `layar/pemilih-admin-sekolah-1280.png`** (new) | none («NO APPROVED COMPOSITION», G:38); D-132(c)(m) | `/` is the single deliberate chooser; the six words are Dr Gladys's |
| **E3** Batch 2 questions | shared | `batch-2/evidence/01-lewati-1280.png`, `02-menu-1280.png`, `03-dialog-1280.png`, `keyboard-walk-2026-11-02.json` | DS components per row | as built |

## Missing evidence

These states have **no screenshot**. Where a substitute is named, it is labelled as a substitute and must not be read as the real screen. Each is reproduced on a disposable local stack with synthetic data before the composition is accepted (the brief, §8 step 4).

| Item | Missing state | Why | Nearest substitute (labelled) |
|---|---|---|---|
| **B1** | Konfigurasi as **Admin platform** in «Seluruh platform» | not captured on 4 Nov (only the platform admin's chooser was) | `layar/pemilih-admin-platform-1280.png` (the chooser, not Konfigurasi); the code path `src/app/konfigurasi/page.tsx` |
| **B4** | a card with **a platform role beside a school role** | no seeded person holds both | `batch-6/evidence/B6K/contoh-dua-sekolah.png` (two schools, not platform plus school) |
| **C2** | «Lihat bukti» for a **PD Kelas** | the synthetic seed has no PD class | `batch-3/evidence/w65/13-riwayat.png` (an ordinary class) |

## Reproducible evidence



| Evidence | Where |
|---|---|
| the Batch 5 walk (revocation, integrity review, waiting list, reports, learner pages) | `audit/b5-ujung.mjs` |
| the A4 print of each surface | `audit/b6-cetak.mjs` |
| the focused checks (MODE PERAGAAN, the tour) | `audit/b5-fokus.mjs` |
| every role's screens | `audit/crawl.mjs` |

All four run in CI's journeys (`.github/workflows/audit-journeys.yml`, job A). Gladys's path runs from an empty database in job B. Every run's screenshots are uploaded as workflow artifacts.
