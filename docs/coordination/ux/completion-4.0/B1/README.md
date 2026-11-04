# B1 · W3.6: Konfigurasi's organisation

**Form C (composition).** Register entry B1 (F-12(4), RV-24, RV-15 residue, J3.3).
**Surface:** `/konfigurasi`, as built at 0b19707 (`src/app/konfigurasi/page.tsx`, 1,578 lines). Its children `/konfigurasi/keamanan`, `/email-uji` and `/sertifikat` are already their own pages and stay as built.
**Roles:** Admin sekolah, and Admin platform in «Seluruh platform».
**Decisions needed:** none. No O# or G# applies. The words in §5 are presentation; none is a protected term.

**Missing evidence, and its substitute.** Konfigurasi as Admin platform in «Seluruh platform» was not captured on 4 Nov. The platform specimens (`indeks-platform`, `peran-platform`, `audit-platform`, `pemeliharaan-platform`) are a **labelled substitute drawn from the code path**: `BAGIAN_SEKOLAH`, `tampil()`, the `platformIni` branches. Per the register, the view is reproduced on a disposable stack before this composition is accepted.

**Files in this folder:**
- `buat-b1.mts`: the specimens and their checks. Run it from the repository root with `npx tsx docs/coordination/ux/completion-4.0/B1/buat-b1.mts`.
- `b1.css`: the layout and the A4 print rules. Tokens only.
- `render/<page>-<width>.png`, `render/<page>-a4.png` and `.pdf`, and `render/laporan.txt`.
- `jalan/<page>-<1280|320>.txt`: the Tab order and the accessibility tree.
- `<page>.html`: each specimen.

---

## 1. The composition

### Split, not index

Konfigurasi becomes **an index page and one page per section**.

Today it is one page of 13 sections, most with their own forms. At 1280 px it is 7,503 px tall, and at 390 px it is 12,374 px. An in-page index (a section menu over the same long page) would keep every form on one screen: a person setting one pass mark still scrolls past the transfers, the maintenance forms and the report templates, and a result line can land far from where they are.

The split fits what the page already does:
- each section is a separate task;
- each server action already answers one section (`?bagian=…&hasil=…`);
- each section already has its own pager.

**Why not cards:** the Panel rule says more than six objects of one kind is a list, not a grid of cards. So the index is grouped list rows.

### The index, `/konfigurasi`

Top to bottom (`render/indeks-*`):
1. **The page head:** h1 «Konfigurasi», then the context line. That is «Sekolah: SMP Cahaya Kaliandra» for Admin sekolah, or «Seluruh platform». Where an Admin sekolah administers more than one school, the built school links (`?sekolah=`) sit on this line.
   - There is **no «PINTAR» eyebrow** (RV-24): the shell carries the name.
2. **Admin platform only: two panels.**
   - «Kesehatan sistem»: the built `KartuKesehatan`, in RV-15's words.
   - «Lingkungan»: the environment in words, never the raw value.
   - **No tile is drawn for a value the reader cannot have.** RV-24's empty «Lingkungan —» came from a school administrator's page; the value is only ever read for Admin platform. The «Kelas aktif» count moves into «Persiapan sekolah», where it already appears.
3. **«Yang menunggu»** (UX-33), as built: one list row per waiting count, each opening where the work is done. Nothing is shown when nothing waits (`indeks-sekolah-tenang`).
4. **«Persiapan sekolah»** (J3.2), Admin sekolah only. Each step is a row with a badge: «Sudah» (ok, with its icon) or «Belum» (neutral). A step that remains carries its way, as built. The quiet second-admin line follows (D-101(e)).
5. **The sections, in five groups,** each group an h2 over a list of rows. Each row is the section's own title and opens the section's page.

| Group (new words) | Sections, in task order | Admin platform sees |
|---|---|---|
| Sekolah dan tahun ajaran | Struktur sekolah · Batas ketuntasan · Pergantian tahun ajaran · Sistem & Konfigurasi | Sistem & Konfigurasi |
| Murid | Pindah kelas · Perpindahan murid | Perpindahan murid (round 1: shown today; kept) |
| Staf dan akses | Peran & akses · Peserta pengembangan profesi · Jejak audit | Peran & akses · Jejak audit |
| Laporan dan templat | Laporan · Templat laporan | — |
| Dukungan | Laporan masalah · Pemeliharaan dan pengumuman | both |

**Group order:** setup first, because a new school can do nothing until it has a structure (DAISY-05). Then the people, then what is read, then support.

**Which sections each role sees** is what the page shows today: `tampil()`, plus «Perpindahan murid», whose section carries no `hidden` and so shows in «Seluruh platform» although the menu omits it. Seen live in the owner's local reproduction (round 1).
- **«Perpindahan murid» stays for Admin platform.** A transfer runs between two schools, and «Seluruh platform» is the one place that sees both ends. Removing it would change who sees what, which is a permission matter, not presentation.
- In «Seluruh platform» the page holds the transfers list with its actions, as built. The two school-shaped forms («Permintaan pindah masuk», «Ajukan perpindahan ke sekolah lain») need a school (`satuSekolah`), so they are absent there, as built.
- The index puts it in «Murid» for both roles.

Otherwise «Seluruh platform» draws no school-shaped section (L3). A group with no section left is absent.

**RV-24 «index label»:** the row for the report templates is titled by the section it opens, «Templat laporan». «Inteligensi & Laporan» retires.

### A section page, `/konfigurasi/<section>`

Each section page has:
- the back link «Konfigurasi» (`pds-back`; two levels, so no breadcrumb);
- the h1 (the section's title);
- the context line;
- the section's built explanation as the intro;
- then the section's content in one of three patterns.

| Pattern | What it is |
|---|---|
| **Records** | A list (`pds-list`), one row per record. The row carries what identifies the record, its state as a badge or words, and **its one action at the end**. The action **opens in place**: the row takes the `surface-2` ground and shows its short form in a panel, with the primary action and «Batal». One row is open at a time. The open row is carried in the address (`?ubah=<id>`), so no client state is needed and a reload keeps it. |
| **Form** | A panel with the FormLayout: one column at `measure-narrow`, two short fields sharing a row (auto-fit at 220 px), the primary action left-aligned at the end. |
| **Table** | The Table with TableRows stripes, for the audit trail only: it has columns. |

**Results:** the result line («Selesai.» / «Belum berhasil.», BarisHasil) sits at the top of the content, under the intro, because the page now holds one task (`ketuntasan`). **Pagers:** the Collection pager as built (Penomoran): «Kembali» · «Halaman n» · «Berikutnya», keyset pages, never a total.

### Every section's pattern

| Section | Pattern | Contents | Specimen |
|---|---|---|---|
| Struktur sekolah | the built `PanelStruktur` tree | Bagian › Tingkat › Kelas, with add, rename and deactivate in place, as built (DAISY-05). Only its frame changes: the page head and the context line. | (as built) |
| Batas ketuntasan | Records | The lesson, its subject · grade · «Materi PINTAR», and «Batas ketuntasan: 75%» or the badge «Batas ketuntasan belum ditetapkan». Action: «Tetapkan» opens «Nilai minimum (%)» and «Alasan». «Riwayat» is a disclosure under the row (history, not something that must be read). | `ketuntasan`, `ketuntasan-kosong` |
| Pergantian tahun ajaran | Form, one panel per school | «Dari tahun ajaran» and «Ke tahun ajaran» share a row. Then the class mapping as a list, each class with its select («— tidak dipindahkan —» as the default). «Jalankan pergantian» at the end. | — |
| Sistem & Konfigurasi | Records, read only | Each school: name, «aktif»/«nonaktif», the badge «data uji» (Admin platform), its school years in words. Paged in «Seluruh platform». | — |
| Pindah kelas | Form, then Records | Step 1: «Dari» and «Lihat» (GET). Step 2: the Kelas's students, each row with its «Ke» select and «Pindahkan». | — |
| Perpindahan murid | Records, then two Forms | The transfers, each with its status badge and its actions («Setujui», «Laksanakan», «Tolak» with its reason in place). Then «Permintaan pindah masuk», one row per request, accepted into a school year. Then «Ajukan perpindahan ke sekolah lain»: search, then choose. | — |
| Peran & akses | Records, then Form | Each assignment: the person; role · scope · «Berlaku sampai …». Action: «Cabut» (destructive) opens «Alasan» in place; the confirming button is destructive-confirm. «Jadikan admin sekolah?» and «Menunjuk admin sekolah pertama» are confirmation panels above the list, as built. «Berikan peran» is the form below. | `peran-sekolah`, `peran-platform` |
| Peserta pengembangan profesi | Form, then Records | «Orang», «Tempat» and «Daftarkan». Then «Catatan pengembangan profesi» as link rows. | — |
| Jejak audit | Table | Waktu · Tindakan · Sasaran, in words (D-138(c)). Rows striped (RV-24). **«Versi» only for Admin platform, and only when a row on the page carries a build** (RV-24's all-«—» column); a row without one leaves its cell empty, not «—». | `audit-sekolah`, `audit-platform` |
| Laporan | Records (links) | «Ringkasan sekolah», then each active class's summary. | — |
| Templat laporan | Records, then Form | The school's templates (title · kind · «Versi» n). Then the form: school, kind, title, and the metrics as a list, each with its visualisation select («Tidak dipakai» by default). | — |
| Laporan masalah | Records | Each report as an article: what happened (its heading), time · reporter · role, the status badge and «Menghentikan kelas» (attention, with its icon), the two other answers as a description list, the page and reference in mono, «Lihat tangkapan layar», and «Langkah berikutnya». Action: «Ubah status» opens the status and the next step in place. | `laporan-masalah` |
| Pemeliharaan dan pengumuman | Form in two steps, then Records, then Form | Step 1: «Untuk», start and end, «Periksa waktu ini». Step 2: the collision alert (attention, D-094(g)), then message, reason, «Terbitkan juga sebagai pengumuman», «Jadwalkan pemeliharaan». Then the windows list (actions in place). Then «Pengumuman»: its list and its form. **Admin platform only:** «Hentikan sekarang», last, set apart as its own section, with the typed phrase and a destructive-confirm button. | `pemeliharaan-sekolah`, `pemeliharaan-platform` |

## 2. Layouts

**Widths:** 1280, 820, 390 and 320 px for all 14 specimens (`render/`). **A4 print** for the index and the audit trail (`render/*-a4.png`, `.pdf`).

| Width | What changes |
|---|---|
| 1280 / 820 | The full shell. A record row: identity · state · action on one line. Two-field rows side by side. |
| 390 / 320 | The App shell's top bar. A record row stacks: identity, state, then its action left-aligned. Forms go to one column. The description list stacks. |
| A4 | The content only. The navigation, the bar, the skip link, the pager, the back link and every form stay off the paper (Batch 6: the section menu never prints). Table stripes print (TableRows). |

## 3. States and roles

| State | Specimen |
|---|---|
| Index, Admin sekolah, something waiting | `indeks-sekolah` |
| Index, nothing waiting | `indeks-sekolah-tenang` |
| Index, Admin platform | `indeks-platform` (substitute; navigation and «Perpindahan murid» corrected after round 1) |
| A record opened in place, after a save | `ketuntasan` (result line), `peran-sekolah` (revocation), `laporan-masalah` |
| Empty | `ketuntasan-kosong`: «Sekolah ini belum punya pelajaran.» Every section keeps its built empty line. |
| A two-step form at step 2 | `pemeliharaan-sekolah` |
| The platform's emergency stop | `pemeliharaan-platform` |
| Refusal | `penolakan`: a Guru opens Konfigurasi. The built HalamanPenolakan: «Halaman ini hanya untuk Admin sekolah atau Admin platform.», the staff line, «Ke halaman awal», and who is signed in. |
| Loading | `memuat`: the built MemuatHalaman in the shell; skeleton, `role="status"`, «Memuat halaman…». |
| A school-shaped section asked for in «Seluruh platform» | Not drawn. The address goes to the index (engineering note §7). No new words. |

**Roles:** what each role sees is decided as today (`tampil()`, `platformIni`, `sekolahIni`). This composition moves sections; it changes no permission. Admin platform's own additions stay theirs:
- «Seluruh platform» in maintenance scopes;
- «Hentikan sekarang»;
- «Admin platform» in the role list;
- «Versi»;
- the «data uji» badge;
- the health and environment panels.

## 4. Keyboard and accessibility

The walks are in `jalan/`.

**The index:** Tab reaches the skip link, the places, then each waiting row and each section row, in reading order. Each row is one link named by its words.

**A section page:** Tab reaches the back link, then the records' actions, then the form. A row's action carries the record in its accessible name, for example «Cabut · Citra Lestari», so a screen reader's list of buttons is unambiguous. An opened row's form is labelled the same way.

**The tree:**
- the index: h1, then h2 per block, then lists of links;
- a section page: h1, then lists; reports are articles named by what happened; the audit table has its caption.

**Checks** (`render/laporan.txt`):
- axe WCAG 2.2 AA passes in all 56 renders;
- every target is at least 24 px (inline links inside a sentence are exempt, WCAG 2.5.8);
- every focus has a ring;
- no raw copy key appears;
- the three RV-24 conditions cannot recur (empty tile, «Inteligensi», all-empty «Versi»).

**Design-system finding** (not B1's, reported for the DateTime component): a native date field's last Tab stop, the browser's calendar button, shows no focus ring (Chromium). Proposed fix in the component: `::-webkit-calendar-picker-indicator:focus-visible { outline: var(--border-focus) solid var(--focus-ring); }`. The design system is frozen, so this is recorded, not applied.

## 5. Words (T table)

All other words are the copy table at 0b19707, unchanged.

| Key | Indonesian | English | Kind |
|---|---|---|---|
| `config.kelompok.sekolah` | Sekolah dan tahun ajaran | School and school years | NEW · presentation |
| `config.kelompok.murid` | Murid | Students | NEW · presentation |
| `config.kelompok.staf` | Staf dan akses | Staff and access | NEW · presentation |
| `config.kelompok.laporan` | Laporan dan templat | Reports and templates | NEW · presentation |
| `config.kelompok.dukungan` | Dukungan | Support | NEW · presentation |
| `config.lingkungan.development` / `staging` / `production` | Internal / Pra-produksi / Produksi | Internal / Pre-production / Production | NEW · presentation (RV-15: the environment in words). **Proposed; Dr Gladys confirms.** Not «Pengembangan», which is professional learning («Pengembangan profesi guru», `/pengembangan`), and not «Pengujian», whose root «uji» names assessments («Uji Cepat», «Uji Penguasaan»). |
| `config.kesehatan.jumlah` | **pemeriksaan perlindungan data, semuanya sesuai.** (after the count) | **data-protection checks, all as expected.** | CHANGED · presentation (RV-15: was «pemeriksaan skema, semuanya sesuai nilai yang diharapkan.») |
| `config.section.intelligence` | — | — | RETIRED from the index (RV-24); the row uses `laporan.templat.judul` «Templat laporan» |
| `config.refused` (English only) | unchanged | **This page is for school administrators and platform administrators only.** | CORRECTION: the English said «system administrators only», which does not match the Indonesian |
| RV-15 seed name (data, not a key) | **Sekolah Contoh PINTAR** | — | PROPOSED (not «Uji», for the same reason as above) for the bootstrap institution, today «PINTAR Bootstrap (OFFICIAL evidence — development and CI only)» (`supabase/seed/official_bootstrap.sql:68`). The «data uji» badge already marks it. Applying it is a change to that seed file (development and CI only), not a migration. |
| `lapor.triase.arti` in «Seluruh platform» (a platform form, for example `lapor.triase.arti_platform`) | **Laporan dari staf semua sekolah, yang menghentikan kelas lebih dahulu. Sekolah menyelesaikan yang dapat diselesaikannya; tim PINTAR menindaklanjuti sisanya.** | **Reports from staff at every school, the ones stopping a class first. Each school resolves what it can; the PINTAR team follows up the rest.** | PROPOSED · presentation; **Dr Gladys confirms**. Round 1: today «Laporan dari staf sekolah Anda …» shows in «Seluruh platform», where there is no «your school». Admin sekolah keeps today's line. |

No frozen term is touched. «Murid» as a group label is the approved role word (`role.STUDENT`).

## 6. Components and tokens

**Components:** App shell; Page head with Back link; Section; List (`pds-list`, `pds-list-row`); Panel; FormLayout (`pds-field`, `pds-label`, `pds-help`); Select; TextField; Textarea; Checkbox (`pds-choice`); DateTime (the native field with its echo, `pds-gema`); Button (primary, secondary, quiet, destructive, destructive-confirm); Badge (neutral, ok, attention); Alert attention; Result line; Disclosure (history only); Table with TableRows; Pagination (Penomoran's words); Empty state; Loading skeleton; Refusal; Icons.

**Tokens only:** `--surface-1/2`, `--ink-1/2/3`, `--line`, `--line-control`, `--pintar-primary`, `--space-*`, `--radius-md`, `--measure-narrow/auth`, `--font-mono`. **No new token, no palette change.**

**The wordmark** is the provisional placeholder: a box at the slot's size, labelled «Pintar (master pending F-11)».

## 7. Navigation and outcomes

| From | To |
|---|---|
| The app navigation's «Konfigurasi» | the index |
| An index row | `/konfigurasi/<section>` |
| A waiting row | Pendataan, Aktivasi akun or Studio, as built |
| A section's back link | the index |
| A row's action | the same page with that row open (`?ubah=<id>`) |
| «Batal» | the same page with no row open |
| A save | the same section page with its result line; the opened row closes |

**Engineering notes** (not decisions):
- **Routes:**
  - `/konfigurasi/struktur`, `/ketuntasan`, `/tahun-ajaran`, `/sekolah`;
  - `/pindah-kelas`, `/perpindahan`;
  - `/peran`, `/peserta`, `/audit`;
  - `/laporan`, `/templat-laporan`;
  - `/laporan-masalah`, `/pemeliharaan`.
  
  They don't clash with `keamanan`, `email-uji` or `sertifikat`.
- **Redirects:** the actions' `?bagian=X` redirects go to X's route. The old anchors (`/konfigurasi#roles` and the like, including Persiapan's links) go to the route. Each page asks its own gate on arrival, as the page does today.
- **Walks:** the section menu (`data-menu-bagian`) disappears. The walks that used it address the routes. `data-menunggu` stays.
- **Forms:** focus moves to the opened row's first field. Nothing typed is cleared on a failed save (FormLayout).

## 8. Edge cases

- **Several schools for one Admin sekolah:** the built school links on the context line, carried to every section page.
- **One section left in a group** (Admin platform's «Sekolah dan tahun ajaran»): the group shows with its one row.
- **A section with nothing:** its built empty line (`config.empty`, `config.ketuntasan.kosong`, `lapor.triase.kosong`, and so on).
- **The health check failed:** the built `config.kesehatan.gagal` with its reference, in the health panel.
- **No environment row:** the «Lingkungan» panel is omitted, never «—».
- **A row without a build** while others on the page have one: its «Versi» cell is empty.
- **Long names** wrap (`overflow-wrap: anywhere`); nothing is truncated.
- **A record's action while another is open:** opening one closes the other; one form at a time.

## 9. Acceptance checklist

- [auto] No sideways scroll at 1280, 820, 390 or 320 px, in all 14 specimens.
- [auto] axe WCAG 2.2 AA: no violations, 56 of 56 renders.
- [auto] Every target is at least 24 × 24 px (inline links inside a sentence excepted, WCAG 2.5.8).
- [auto] Every Tab stop shows a focus ring (the DateTime calendar button reported separately).
- [auto] No raw copy key in any render.
- [auto] RV-24: no «Lingkungan —» tile; no «Inteligensi & Laporan»; no all-empty «Versi» column; no «PINTAR» eyebrow; audit rows striped.
- [auto] A4: the navigation, the bar, the skip link, the pager and the back link do not print.
- [manual] Side-by-side review of the build beside this composition at each width, recorded as match or deviation per region (brief G:14).
- [manual] Admin platform in «Seluruh platform» reproduced on a disposable stack and compared with the substitute specimens before acceptance (register B1).
- [manual] Every route meets G §2 (G:35, :81).
- [manual] Each action's redirect lands on its own section page with its result line.
- [manual] With a screen reader: each row action is heard with its record's name; an opened row's form is reached next.
- [manual] At 200 % zoom (W6.12), the 320 px layout holds.
