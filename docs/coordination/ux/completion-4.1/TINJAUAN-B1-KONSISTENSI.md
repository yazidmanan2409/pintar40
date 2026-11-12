# B1: UX acceptance under the cross-module integrity standard (Daisy, 11 Nov 2026)

> **What holds now (12 Nov 2026):** this review's verdict («BLOCKED, held for the corrected candidate») is **superseded** by `TINJAUAN-B1-1fc719b5.md`: **PASS on `1fc719b5127313bf24084695fa30d7505e15b5d1`**. B1 is closed. The register here moved there: B1-R4 to B2, B1-R5 and S-1 added. The §3 claim about suspended sign-in is corrected in place (L-1). The rest is history.

**Standard:** `docs/completion-4.1/SYSTEM-INTEGRITY-4.1.md` at `7cc5ea35` (check 4, and §5 for Daisy).

**Implementation reviewed:** `40e89308`. It is still the head of `claude/system-integrity-4.0`; **no corrected candidate has been pushed.** This extends my rendered review `TINJAUAN-B1-40e89308.md` (PASS on the screen, three register findings) with the cross-module points asked for.

## Verdict: **BLOCKED**, held for the corrected candidate commit

**No UX defect was found.** The block is the technical cross-school disclosure (Sharon's, and §4 of `B1-ARCHITECT-CHECK.md`), which stays BLOCKED until corrected. My verdict must name the same commit as Sharon's, and that commit does not exist yet.

**On the corrected commit,** I will confirm three things. Each is a short re-run of what is below:
1. the two-school check: the API returns only the admin's own school;
2. the page renders as it does here;
3. axe at the three widths.

If those hold and nothing else in the reader changed, my verdict on that commit is **PASS**.

**The cross-module inventory** (13 interfaces) is not on any branch I can read: not on `B1-COMPLETION.md` at `40e89308`, and not at `7cc5ea35`. I cannot review it yet. Please push it on the completion page with the corrected candidate. My UX reading of the interfaces is below, so the review of it is short.

## 1 · Another school through the displayed data: **none on screen; the defect is at the API**

Pak Yusuf (SD Cendekia) was given a role at Alpha, locally, then signed in through the real form. The event's snapshot holds both schools.

| Who reads | On screen and in the page's HTML | The API, called with that admin's own token |
|---|---|---|
| Bu Wulan (SD Cendekia admin) | 38 of his rows. **Neither Alpha's id nor Alpha's name appears** anywhere in the HTML sent to her | `akuntabilitas_baca` returns `institution_ids = [Alpha, SD Cendekia]` for the new row: **Alpha is disclosed** |
| Alpha's admin | **1 row**: his sign-in after the Alpha role began. None of his SD-only history, which is right. **SD Cendekia's id and name do not appear** | The same array: **SD Cendekia is disclosed** |

**The page is not the leak.**
- It renders on the server, never sends the array, and reads only element 0, for a platform row's time zone.
- For a school admin it uses the admin's own school (`lingkup`).

**So the correction Bob suggests** (`array[p_sekolah]` for anyone but the platform admin) **changes nothing a school admin sees.**

**Classification:** an authorization and boundary defect (Sharon's), not a UX defect. **Retest on the corrected commit:** the same two reads, with the API returning only the reader's own school.

## 2 · Consistency with «Jejak audit» and the other Konfigurasi screens

| Aspect | «Jejak audit» | The reader | Result |
|---|---|---|---|
| Place and wayfinding | Konfigurasi › Jejak audit | Linked at the **top** of «Jejak audit», with a description. The back link «← Jejak audit», the eyebrow «Konfigurasi», then the h1 | Consistent. The index entry is register B1-R3 |
| Time | «10 Nov 2026, 15.51 WIB» | «12 Nov 2026, 04.13 WIB». The same formatter, the school's zone, the zone's word | Consistent |
| Who | the person's name from `persons` | the same, or «pengenal tidak dikenal» | Consistent |
| Paging | Koleksi pager | the same `HalamanKoleksi`: a named `navigation`, «Berikutnya» disabled on the last page | Consistent |
| Filters | — | a named form; the search takes a name, a PINTAR ID or a print reference; the date fields echo their date in words (`TanggalDenganGema`, RV-16) | Same components as the other Konfigurasi filters |
| Phones | a table in a scrolling frame (accepted at `ab4146da`) | each row stacked, with labelled fields, below 640 px | A **deliberate difference**, as I asked in O-1, so the audit's phone lessons are not repeated. Not an inconsistency |
| Refusal | `HalamanPenolakan` | `HalamanPenolakan`, with «Konfigurasi» as the way back | Consistent. Its wording is register B1-R1 («Admin platform» → «Admin PINTAR») |
| The shell | top bar «Pendataan» on Konfigurasi sub-pages | the same (`kind="pendataan"`), like Sertifikat, Staf and Keamanan | Existing grammar. Not B1 |

## 3 · Suspended, closed, transferred and deleted people

Read in code, with the transfer case also seen in the two-school walk.

| State | What the reader shows | Judgement |
|---|---|---|
| **Suspended or closed account** | Rows as they were, with no status label. ~~A sign-in attempt by a suspended or closed account is recorded with the same neutral outcome the sign-in screen gives~~ **Corrected on `1fc719b5`:** it is not. Such an attempt answers 503 and is recorded as «PINTAR sedang tidak dapat memeriksa». See L-1 in `TINJAUAN-B1-1fc719b5.md` §3 | The row design is right: no status label, and «Jejak audit» likewise shows no status. **The outcome is not neutral (L-1, not B1)** |
| **Transferred, or a changed affiliation** | Each event belongs to the schools of the person **at that instant**. The old school keeps the history from before; the new school sees nothing earlier. The two-school walk showed it: Alpha saw one row, not the SD history | **Right.** The past is not rewritten in either direction |
| **Personal data deleted (L4)** | The name comes from `persons.display_name`, which the deletion replaces with the PINTAR ID (the 4.0 «meninggalkan PINTAR» facts). The row then reads the PINTAR ID. The deletion also clears the event's origin and identifier hash (Sharon's blocker 3) | **Right**, and the same as «Jejak audit», which reads the same name. Not rendered: I did not run a deletion in this walk |
| **Unresolved identifier** | «pengenal tidak dikenal», and only the platform admin sees it | **Right** (O-1) |

## 4 · States

All were seen on `40e89308` (`TINJAUAN-B1-40e89308.md`):

| State | Wording |
|---|---|
| Empty | «Belum ada catatan. Catatan disimpan sejak {tanggal}.» |
| No match | «Tidak ada catatan yang cocok dengan saringan ini.», with «Hapus saringan» |
| A purged or unknown print reference | «Referensi ini tidak ditemukan. Catatan cetak disimpan 12 bulan, sejak {tanggal}.» |
| Refused | `HalamanPenolakan` |
| Read failure | the `role="status"` banner «Catatan belum dapat dibaca sekarang. Coba lagi sebentar lagi.» Read in code |

Also, from that review:
- **Accessibility:** axe found 0 violations. The table has a caption, column headers and the time as each row's header. The filter works by keyboard.
- **Width:** no sideways scroll at 1280, 390 or 320.

## 5 · Defects versus what B2 delivers

| Item | Class |
|---|---|
| «Cetak laporan» recording a print, and the footer with «Ref. CTK-…» | **B2**, deferred by plan. Not a B1 defect |
| A print row and finding it by reference | **B1, works.** Seen with a print written through the B1 writer |
| A purged reference's sentence | **B1, works** |
| B1-R1: the refusal says «Admin platform» | register (a B1 string) |
| B1-R2: «Seluruh platform» does not name each row's school. With a two-school person, the platform admin also cannot tell which school's clock a row uses (element 0) | register. One line, platform view only |
| B1-R3: the Konfigurasi index does not list the reader | register, optional |

## 6 · What I need, to give the final verdict

1. **The corrected candidate's SHA**, the same one Sharon reviews.
2. **The cross-module inventory** on `B1-COMPLETION.md` at that commit.

Then I re-run sections 1 and 4 on it and return PASS or BLOCKED on that SHA.

## 7 · The owner's three questions, applied to the reader

Under `STANDING-PRINCIPLE-ONE-SYSTEM.md`, at `14d72272`, §5, the UX row.

| Question | For the B1 reader |
|---|---|
| **And then what?** (after the action) | A sign-in, a failure, a sign-out or a print appears as one row, newest first, in plain words. A print row carries its reference, which finds it again. B2's footer is the reference's next consumer |
| **What else did that change?** | «Jejak audit» is unchanged: no double record, and the same names and time format. A deletion (L4) makes the rows read the PINTAR ID, as «Jejak audit» does. A transfer or a second school changes who sees which rows, at the event's own instant (§3). The two-school API disclosure is Sharon's blocker (§1) |
| **What happens when things go wrong?** | A read failure: the status banner. A purged reference: its own sentence. A print whose event cannot be written does not print (B2). **A sign-in whose event could not be written leaves no row.** That is fail-open by Sharon's ruling, counted, and reported by the platform health check |

**One consequence, recorded:**

| # | Class | Finding | Change |
|---|---|---|---|
| B1-R4 | register | **A school admin cannot see that the record has a gap.** A failed write is counted only in the platform health check. The reader presents itself as complete for 12 months, and nothing tells the school otherwise | Keep it **within B1's approved scope**: no new screen and no new data for schools. When the platform health check reports uncounted events in the period shown, the platform admin's own view of the reader could carry one line: «{n} kejadian tidak dapat dicatat sejak {tanggal}; lihat Kesehatan sistem.» Whether schools should ever be told is the owner's, escalated by this register entry, not absorbed |

This does not change my verdict. It is held for the corrected candidate, as stated above.
