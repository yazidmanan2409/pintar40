# B1 «Catatan masuk dan cetak»: final UX review (Daisy, 11 Nov 2026)

**Candidate:** `40e89308` on `claude/system-integrity-4.0`. The B1 screen is from `380b9e07`: `src/app/konfigurasi/catatan-masuk/page.tsx`, its keys `akuntabilitas.*` in `src/lib/hle.ts`, and `src/lib/akuntabilitas-kontrak.ts`.

**Compared against:** `docs/completion-4.1/batches/B1-COMPLETION.md` («Screens and states»), THE PLAN §5.1 F, and my O-1.

**Scope:** B1 only.

**How it was rendered.** Local only:
- this commit's own `npm ci`, a reset to its migrations, the report world, then `next build` and `next start`;
- events created through the **real sign-in form**: password success and failure, for two schools, an unknown identifier, and the platform admin;
- plus, through the service-level writer: one sign-out, one print (`CTK-A5AQ-ZE02`), and 52 failures (password and PINTAR ID plus PIN), to fill two pages.

That made 62 events: 58 for SD Cendekia, 2 for Alpha, 2 with no school.

**Who viewed it:**
- Bu Wulan, admin of SD Cendekia, at 1280, 390 and 320;
- Alpha's admin, and Beta's admin (no events);
- the platform admin in «Seluruh platform», at 1280, 390 and 320;
- a teacher.

All by keyboard where it matters, with axe (WCAG 2.2 AA).

**Evidence:** `verifikasi-B1-40e89308/`, with screenshots and `catatan-jalan.txt`.

## Verdict: **PASS**

There is no blocker. Three non-blocking findings are below, for the register.

## What I checked

| Requirement | Seen |
|---|---|
| **A school admin sees their own school only** | Bu Wulan: **58 rows** over two pages (50, then 8), only SD Cendekia's people (Bu Wulan, Pak Yusuf, Tono Rahayu). Searching «Admin Alpha» → «Tidak ada catatan yang cocok dengan saringan ini.» Alpha's admin: **2 rows**, Alpha's people only. Beta's admin: none. No school admin sees the unknown-identifier row or the platform admin's own sign-in |
| **The platform admin** | In «Seluruh platform»: every row (62, over two pages), including «pengenal tidak dikenal» and their own sign-in, with the **«Asal jaringan»** column. No school admin sees that column |
| **Refused (not an admin)** | A teacher gets `HalamanPenolakan`: «Catatan masuk dan cetak hanya dibaca admin sekolah untuk sekolahnya, dan Admin platform.» No data, no filter |
| **Understandable rows** | Each row reads Waktu · Siapa · Apa · Cara · Hasil. «Tidak berhasil masuk · Password · Email, username, atau password belum cocok.» «Meminta cetakan resmi · Referensi CTK-A5AQ-ZE02 · Berhasil». Outcomes are in the sign-in screen's own words, never Auth's text, and «pengenal tidak dikenal» stands for an unresolved identifier (O-1) |
| **Time** | «12 Nov 2026, 04.13 WIB», with the zone's word; the date filters use the school's clock (`TanggalDenganGema`). Every school here is WIB, so a WITA row was not seen |
| **Empty** | Beta: «Belum ada catatan. Catatan disimpan sejak 12 Nov 2026.» |
| **No match** | «Tidak ada catatan yang cocok dengan saringan ini.», with «Hapus saringan» (a future date, an unknown name) |
| **A purged or unknown print reference** | «CTK-ZZZZ-ZZZZ» → «Referensi ini tidak ditemukan. Catatan cetak disimpan 12 bulan, sejak 12 Nov 2026.», as O-1 asked |
| **Finding a print by its reference** | «CTK-A5AQ-ZE02» and «ctk a5aq ze02» each find the one print row. Filtering by «Meminta cetakan resmi» shows it |
| **Read-only** | No export, delete or print action. The introduction says so |
| **Failure state** | `role="status"`, «Catatan belum dapat dibaca sekarang. Coba lagi sebentar lagi.» Read in code; not provoked |
| **Accessibility** | axe: **0 violations** for the school admin, the platform admin, the empty state and the refusal. The table has a caption («…, yang terbaru di atas»), column headers, and the time as the row header. The filter is a named form. The pager is a named `navigation`, with «Berikutnya» `aria-disabled` on the last page |
| **Keyboard** | Tab reaches «← Jejak audit», the search, «Jenis», both dates, then «Tampilkan». Choosing a kind with the arrows and Enter on «Tampilkan» filters, and focus stays on the button |
| **390 and 320 px** | No sideways scroll. Below 640 px every row is a block, each field labelled («Siapa:», «Apa:», «Cara:», «Hasil:»). An empty «Cara» (sign-out, print) is left out, not shown blank. The reference stays whole (`B1-baris-layar-320.png`) |
| **Where it lives** | A link with its description at the **top of «Jejak audit»**: «Catatan masuk dan cetak · Siapa yang masuk, gagal masuk, keluar, atau meminta cetakan resmi.» The reader's back link returns to «Jejak audit». That is the "beside «Jejak audit»" of the page, and it is where a printed reference sends a reader (my §1) |

**On your particular question:** yes. A school admin reads only their own school's events, in plain words, and nothing of another school reaches them. That includes:
- the search: another school's name finds nothing;
- the unknown-identifier rows;
- the platform admin's row;
- the network origin.

## Non-blocking findings (register)

| # | Finding | Change |
|---|---|---|
| B1-R1 | **The refusal uses the old role name.** `akuntabilitas.ditolak`: «… dan **Admin platform**.»; EN «… and by the **platform administrator**.» 4.1 holds one name, «Admin PINTAR» (THE PLAN §8.4; my 4.0 consistency item 6). The ten older keys wait for the 4.1 consistency pass, but this is a new key | «Catatan masuk dan cetak hanya dibaca admin sekolah untuk sekolahnya, dan Admin PINTAR.» / «… and by an Admin PINTAR.» |
| B1-R2 | **«Seluruh platform» does not say which school a row belongs to.** The platform admin sees «Guru Alpha (sintetis)» beside «Pak Yusuf (uji laporan)», with nothing to tell the schools apart | In the platform view only, add the school after the name, in `pin-meta`: «Pak Yusuf (uji laporan) · SD Cendekia Nusantara». School admins are unchanged |
| B1-R3 | **The Konfigurasi index does not list the reader.** It is reached only through «Jejak audit», where it is the first thing on the page, so this is discoverability, not a defect | Optional: an entry beside «Jejak audit» in the index's «Staf dan akses» group, with the existing keys `akuntabilitas.tautan` and `akuntabilitas.tautan_arti` |

**Not B1, noted only:** the top bar names the place «Pendataan» on this page. That is the shell's `kind="pendataan"`, which every Konfigurasi sub-page uses (Sertifikat, Staf, Keamanan, Kesempatan). It is existing grammar.

## Not seen

- **A person at two schools** (Sharon's blocker 1 test).
- **The card, link, code and PIN-recovery sign-in paths through their own screens.** Rows of those methods were seen via the writer, and their words render.
- **A WITA or WIT school's row.**
- **A real network origin** (none arrives locally).
- **The English rendering** (the keys exist in both languages).
- **Real screen readers.**
