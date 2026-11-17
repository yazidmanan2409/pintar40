# C2w · Studio › Pustaka PINTAR («Tarik»), at 390 px: review (Daisy, 17 Nov 2026)

> **What holds now:**
> - ~~**PASS. No blocker.**~~ **A REHEARSAL, not a gate (17 Nov, 07:13):** Bob withdrew the `a9d303b2` freeze (`3cb48f2a`), because C2w's reviewer notes are not built yet. The findings stand as observations. The real review comes on the real C2w candidate, and will cover «Tarik izin», the notes, and I-5's wording in Studio and beside the class report.
> - **Two notes for the next batch** (§2). Neither is introduced by C2w: they are 4.0 strings that C2w's fix makes visible for the first time.
> - **Read:** a local build of `claude/c2w` at `a9d303b20294cf9fee9279944f66a3be6f1300fc`, at 390 px, as the synthetic platform admin in the «PINTAR Kurikulum Nasional» context.
> - **Captures:** `c2w-kanonik-a9d303b2/`.

## 1 · What I did and saw

**The setup:**
- A local database reset at `a9d303b2`. Nothing on staging.
- **One local fixture change:** the seed has no published release in the library tenant, so I moved the seed's «Pengukuran · 1.0.0» release into «PINTAR Kurikulum Nasional», by SQL, on the disposable local database.
- Everything else went through the screen: the grant, the confirmation and the withdrawal.

| Step | Result |
|---|---|
| Grant «Pengukuran · 1.0.0» to Sekolah Sintetis Alpha through the form | «✓ Tersimpan. Sekolah itu sekarang dapat memakai terbitan ini.» |
| **The list with one ACTIVE grant** (`c2w-kanonik-satu-izin-390`) | The withdraw form appears with the open grant, named «Pengukuran · 1.0.0 · Sekolah Sintetis Alpha»: a name, no id. Before the fix this list was always empty. 0 px overflow |
| «Tarik dari peredaran», after choosing the grant and a reason (`c2w-kanonik-tarik-tanya-bagian-390`) | The confirmation opens in place, with «Tarik dari peredaran» (red) and «Batal» |
| Confirmed (`c2w-kanonik-sesudah-tarik-390`) | «✓ Tersimpan. Izin sekolah itu ditarik.» The withdraw form is gone, because no open grant remains. The database row reads `WITHDRAWN`, with the reason. 0 px overflow |

## 2 · Notes for the next batch (not blocking; 4.0 strings, newly visible)

- **N-6 · The confirmation's consequence line is the result sentence.**
  - It reads «Izin untuk paket ini sudah berakhir. …» under the question «Akhiri izin paket ini … sekarang?». So it says the permission has already ended **before** the admin confirms.
  - It reuses `studio.kanonik.ditarik`.
  - **Proposed:** «Sekolah itu tidak dapat membuka pengerjaan baru dengan paket ini lagi. Murid yang sedang mengerjakan tetap bisa menyelesaikannya.»
- **N-7 · Wrong label on the withdraw select.**
  - The select of open grants is labelled «Paket Pembelajaran» (`studio.paket.judul`), but each option is a package · school pair.
  - **Proposed:** «Izin yang berlaku».

## 3 · Anticipation

**No C2w defect.** N-6 and N-7 date from 4.0. They were unseen because the list never rendered: the fix exposed them, which is question 5 (where it renders) working as intended.
