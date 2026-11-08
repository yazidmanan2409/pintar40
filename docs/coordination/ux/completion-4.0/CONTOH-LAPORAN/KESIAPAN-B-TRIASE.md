# Remaining B findings: walkthrough triage (Daisy, 8 Nov)

**Reads with:** `KESIAPAN-4.0.md` (`e639540b`). **Scope:** the B findings beyond A1–A3 and the six. **Owner rule:** an issue is not downgraded for being outside the six.

**The test I apply:** would a first-time admin, Guru or leader, in this walkthrough, stop, guess wrongly, or lose confidence? If yes, the finding must be fixed before the walkthrough. Otherwise it may follow, and each deferral states the usable path that already exists.

## Must fix before the walkthrough (17)

Each is copy, one class or one condition. None changes policy, permission or scope.

| # | Finding | Why it would interrupt the walkthrough | Smallest correction |
|---|---|---|---|
| M1 | Pendataan accepts only CSV (`BacaDanPetakan.tsx:100`), though the page says «spreadsheet» | An admin holding an `.xlsx` cannot pick it and is not told why | `pendataan.unggah.bentuk`: «Simpan dari spreadsheet sebagai CSV, atau tempelkan barisnya.» |
| M2 | Every Pendataan action is secondary (`.pin-go` has no style outside `.pin-act`) | The approving act «Ya, catat orang-orang ini» looks like a side action; no page in the import has a next step (P1) | `pin-go` → `pin-primary` on those five buttons |
| M3 | «Persiapan sekolah» counts PD classes and participants as academic (`persiapan-sekolah.ts:41-53`), and its «murid» step is plain text | A school with a PD Bagian never reaches «Sudah», which undermines the admin's confidence that set-up is done | Filter `member_kind !== "PARTICIPANT"`; render the step as a link to `/pendataan` |
| M4 | Peran & akses: no intro sentence, the form has no heading and sits last, «Lingkup» is not marked required, there is no hint for «Berlaku sampai», and inactive places are offered | The step B2 now sends the admin to is the step where they then guess | An intro line, a heading (`config.action.grant`), `required`, a hint, `is_active` filter, Tingkat and year in the option label |
| M5 | Enrolling a PD participant: an empty select with no sentence | Hides the prerequisite (a staff role first) | `Kosong` with a link to Peran & akses when there are no candidates |
| M6 | Aktivasi says «Semua orang … sudah bisa masuk» when nobody has been recorded | A fresh school sees that the job is done before it has begun | `Kosong` with a link to `/pendataan` when `total === 0` |
| M7 | Aktivasi has up to 22 primaries; on a learner row the primary is «Aktifkan dengan email», not the card | Points learners to the wrong method (P1) | Per row: the card is primary when allowed, otherwise email; keep one primary in the class-card section |
| M8 | Studio home «Menunggu tindakan Anda» counts colleagues' drafts and drops VALIDATED, APPROVED and FROZEN | A package stalls where neither author nor approver sees it; the reviewer in the walkthrough will not find it | The status list and author filter in `studio_home` (a query, not policy) |
| M9 | Studio list rows show «Sekarang: Setujui isi» to someone who cannot take that step | The same misreading as B1, one screen earlier | «· Oleh: ‹role›» when `bolehMengambil` is false |
| M10 | Upload: after a passed check, «Periksa buku kerja» stays primary beside «Simpan ke Studio» | The educator checks again instead of saving | Primary only while `!periksa?.ok` |
| M11 | «Periksa isi sekarang» is secondary, below the primary «Tandai lolos pemeriksaan» | The educator may mark the content as passed without having checked it | Add the check form as a secondary inside the «periksa» panel |
| M12 | The workbook's «Cek penguasaan» vs «Uji Penguasaan» elsewhere; mixed in one sentence | The educator cannot tell that the marked questions become the Uji Penguasaan | Column help text and `mengajar.sedia.kode.*` |
| M13 | «terbitkan ulang» names a step that does not exist | A wrong instruction at assignment | «unggah buku kerja perbaikan di Studio» |
| M14 | One object, four names: «Kursus» (check result), Paket, Terbitan, «Materi» (Mengajar) | The Guru looks in Mengajar for the package they published and finds «materi» | `hitung.courses` → «Paket»; «Paket» in the Mengajar keys where the Studio object is meant |
| M15 | The Lihat bukti footer says per-question detail is withheld; the page links «Lihat per soal» | The two lines contradict each other on what the teacher can see | Name only what is truly withheld (integrity signals) |
| M16 | Admin on «Laporkan masalah», «Laporan saya» and the PD record gets the focus shell, with no navigation | The admin who opens the X5 record from Konfigurasi has no way back except the browser (P19) | The staff shell, as /akun chooses |
| M17 | «penilaian» for an assessment (4 keys; one N6 had already fixed) | A frozen term broken on the Guru's class pages | «asesmen» in those 4 keys |

## May follow the walkthrough (with the existing path)

| # | Finding | Why it can wait |
|---|---|---|
| D1 | Step lists drawn three ways (K8: upload, Siapkan, Uji Cepat) | Each names its steps and marks the current one; a reader is never lost, only shown a second style. It needs a shared-component change in three places, which is better done once and calmly |
| D2 | Konfigurasi results appear under the list, not in their row; «✓ Selesai.» | The result is shown, and the page scrolls to it, so the outcome is never missed. Moving it into the row needs the actions to report the row (a contract change) |
| D3 | «Batal» drawn three ways | Always labelled, always after the act; a difference of weight only |
| D4 | Other multiple primaries (Aktivasi/orang 3, Konfigurasi row lists) | Each form's primary is its own act. D-140's "one primary per form" conflicts with P1 here, which **needs an owner ruling**, not a guess |
| D5 | Form grammar: browser-native required bubbles, four label looks, hints not linked, «Alasan» optional in some places | The browser's bubble appears in the browser's language and points at the field; the forms complete. The fix is a `BidangTeks` refactor across Konfigurasi, which is risky the day before |
| D6 | Typography outside tokens (12 × `text-xs`, Tailwind titles, h2 styled as label) | Legible and in place; consistency only |
| D7 | A PD refusal drawn as empty on the report but as a refusal page on the record | Seen only by a refused reader, and the sentence says who the record is for |
| D8 | «hubungi admin sekolah», lowercase «admin sekolah», «surel» | Recovery and email text, outside the walkthrough's journeys; copy only |
| D9 | «username» vs «nama pengguna» | Needs Dr Gladys's word (F23 is undetermined) |
| D10 | The fraction picture's name is always Indonesian | Affects an English screen-reader user only |

## Promoted from C, for Visual Intelligence

| # | Finding | Ruling |
|---|---|---|
| P1 | Dekan «Peserta 418» has no base | **Must fix if the envelope already carries the population** («dari N murid terdaftar», as in the specimen). Otherwise it may follow, because it needs a new read |

## How I will verify the candidate

For each of A1–A3, the six, and M1–M17: the full interaction, not the end state, at 1280, 390 and 320 px, with keyboard throughout, and A4 for B5/B6.

**Access I need, or my report must say «not verified on the application»:**
1. The candidate's journey evidence. The artifacts are on Azure blob hosts this session's network refuses; the `pintar40` environment created on 8 Nov allows them, so starting my next session in it unblocks screenshots and PDFs.
2. A real interaction needs:
   - the staging origin (`staging.pintarselalu.com`) and its Supabase host allowed in that environment;
   - signed-in test accounts for a `sekolah-uji-*` school (admin, Guru, Kepala departemen, Dekan), given as environment secrets, never in chat.

Without (2) I can review the journeys only through Second Eye's recorded walks, and I will label them that way.
