# Z readiness: Daisy's items R-10, R-11, R-12 and X-1 (18 Nov 2026)

> **What holds now:**
> - **R-10 (X-4): still OPEN on `main` `7ba18b03`.** The fix specification is in §1, with one sibling, N-9.
> - **R-11: OPEN on `/siapa` only.** `/soal` and `/bukti` are now clean. The fix specification is in §2.
> - **R-12:** N-1, N-2, N-3 and N-5 are **open**. N-4 **closes as not a defect** (§3). N-6 and N-7 land in C3w-1.
> - **X-1's paste test: CLOSED** (16 Nov). The guide is **ready for the walkthrough:** `PANDUAN-AI-SENDIRI.md` beside this file is the final teacher text, to be placed at `docs/onboarding/PANDUAN-AI-SENDIRI.md` (§4).
> - **Method:** a local build of `main` at `7ba18b03` (db reset, the report world, `next start`), read-only walks as the synthetic school admin, the synthetic platform admin and the teacher. Evidence is in `z-siap-7ba18b03/`.

## 1 · R-10 (X-4): Konfigurasi sub-pages show a shorter navigation. Open

**Seen at 1280:**
- **On `/konfigurasi`** the navigation is «Tempat kerja Anda»: Konfigurasi · Pendataan · Aktivasi akun · Studio · **Keamanan akun · Sertifikat sekolah**. Below it is the Konfigurasi list of 14 sections.
- **On the sub-pages**, «Tempat kerja Anda» shows only the page's own extra item, and **the 14-section list is gone:**

| Sub-page | Extra items shown | Missing against the index |
|---|---|---|
| `catatan-masuk`, `kesempatan` | none | Keamanan akun, Sertifikat sekolah, the 14 sections |
| `keamanan` | Keamanan akun | Sertifikat sekolah, the 14 sections |
| `sertifikat` | Sertifikat sekolah | Keamanan akun, the 14 sections |

- **The same for the platform admin.** The platform admin also loses «Kirim email uji».

**The cause:** these pages use `CangkangPengalaman kind="pendataan"` with `halamanKini`, which adds only the current page's item, instead of the Konfigurasi shell.

**Fix specification:**
1. ~~**Every Konfigurasi sub-page renders the same navigation as `/konfigurasi`,** for the same reader. That means «Tempat kerja Anda» in full, and the Konfigurasi section list, with the current section marked `aria-current="page"`.~~ **Superseded 23 Nov (Option A, Bob's question):** «Tempat kerja Anda» in full, from one shared source, on every sub-page, with `aria-current` on the page's own item (or «Konfigurasi»). The 14-section list stays the index's body, as B1 and D-166(a) designed. Section pages keep «← Konfigurasi». The «seven» below counts the six standalone sub-pages plus the section route `/konfigurasi/[bagian]` (the control). The place word in the bar is «Konfigurasi».
2. **«Aktivasi akun» and «Pendataan»'s own pages keep their own shell.** They are places of their own.
3. **The rule:** a page's navigation is the navigation of the item it is reached from. One source, not a per-page list.
4. **Test:** for each of the seven sub-pages, as the school admin and as the platform admin:
   - the set of navigation links equals `/konfigurasi`'s;
   - `aria-current` is on the right item;
   - the result is the same at 1280 and in the 390 drawer.

**N-9 (sibling, found while walking):** `/konfigurasi/staf` without a person, or with an unknown one, refuses with **«Sertifikat sekolah hanya dapat dibuka oleh Admin sekolah.»** That is `sertifikat.kelola.ditolak`, the certificate page's sentence, shown to a school admin on a staff page.
- **Fix:** its own neutral refusal, in the revised Z-3's form: «Data staf ini tidak dapat dibuka. Mungkin sudah tidak ada, atau bukan untuk Anda.»
- **Same answer for an unknown and a forbidden person.**

## 2 · R-11: phone-width overflow. Open on `/siapa` only

| Page | 390 | 320 |
|---|---|---|
| `/mengajar/[kelas]/siapa?penugasan=…` | the table is 381 px in a 324 px frame, so it scrolls sideways and the «Keadaan» column is cut | the same (381 in 254), **plus** the mode switch («Pemetaan Awal | Uji Penguasaan») clipped at 282 in 256 px, with a scrollbar under it (`r11-siapa-320.png`) |
| `/mengajar/[kelas]/soal?penugasan=…` | clean | **clean** (`r11-soal-320.png`) |
| `/mengajar/[kelas]/bukti` | clean | **clean** (`r11-bukti-320.png`) |

**The page itself never scrolls sideways** (document width = viewport). The overflow is inside the frame, so the existing check missed it.

**Fix specification:**
1. **Below 640 px, the «Siapa» table becomes the Collection's stacked rows,** as B1's reader does:
   - each learner is one block: the name as its heading; then «Dikumpulkan {jam} {zona}» or the state; then the state chip; then «Atur»;
   - the stacked rows keep the table's semantics: each block is a list item, and each label is visible text, not only a column header.
2. **The mode switch (`pin-seg pin-seg-tautan`) wraps,** each option on its own line, below 360 px. It never scrolls. The current option keeps `aria-current`.
3. **Test:**
   - at 390 and 320, no element inside `main` has `scrollWidth > clientWidth` with `overflow-x: auto`, and none is wider than the viewport;
   - the same assertion added to the rendered-check helper, so a framed overflow is caught;
   - **sweep the siblings with the new assertion:** every page using `pin-tabel-bingkai` or `pin-seg`.

## 3 · R-12: N-1 to N-5 on `main` `7ba18b03`

| # | Note | State | Evidence | Where it goes |
|---|---|---|---|---|
| N-1 | On the player during a class window, the restriction comes before «asesmen yang sedang dikerjakan tetap dapat diselesaikan» | **Open** | `pemeliharaan.tempat.arti` unchanged | **Z:** on the player only, lead with the reassurance (`pemeliharaan.pita.asesmen`). One string choice |
| N-2 | The teacher's T−15 banner says «Asesmen baru tidak dapat dimulai …», a learner's sentence | **Open** | `PengingatPemeliharaan.tsx:131` shows it at stage 15 for every persona | **Z:** for staff, «Murid tidak dapat memulai asesmen baru sampai pemeliharaan selesai.» |
| N-3 | The collision advice «Pertimbangkan memulai … setelah 15 Mei 2027» uses `closes_at` | **Open** | `config.pemeliharaan.tabrakan.*` unchanged | **4.2.** Same root as V-2: there is no duration. Drop the "start after" advice, or base it on running sittings' deadlines |
| N-4 | The date-time inputs use the browser's own format | **Closed: not a defect** | The echo line in the school's format is the designed answer | — |
| N-5 | A «Lainnya» row reads «Alasan (dicatat): …» | **Open** | `konfigurasi/page.tsx:1544` | **4.2.** Needs `maintenance_list` to return the code |
| N-6, N-7 | Kanonik strings | Open, **land in C3w-1** | Bob, 18 Nov | — |
| N-8 | Nested disclosures about 188 px at 320 | Open | C2w | **Z or 4.2,** with R-11's sweep |

## 4 · X-1: the paste test is closed, and the guide is ready

- **The paste test ran on 16 Nov** (Second Eye, `X1-PASTE-TEST.md`). Both prompts now say one paragraph per cell (`X1-PANDUAN-AI-EKSTERNAL.md`, «What holds now»).
- **`PANDUAN-AI-SENDIRI.md`** (beside this file) is the **final teacher text:** §A to §C, without the reviewers' notes.
  - **Place it at `docs/onboarding/PANDUAN-AI-SENDIRI.md`.** Bob's `AI-EKSTERNAL-PANDUAN-DRAF.md` is superseded by it.
  - The printable PDF is built from it.
- **One item is unconfirmed by design:** the message table (§5) is confirmed at the walkthrough.

**Z-READINESS row:** "Written (Daisy), data warning reviewed (Sharon), paste test done; final text ready for placement".
