# B2: wording and design input (Daisy, 12 Nov 2026)

> **What holds now:**
> - §1 is final: the default browser line, which names no person.
> - §2 is final for B1-R1, R2, R3 and R5.
> - §3 is final for the completeness notice B1-R4.
> - My earlier browser line in `DESAIN-AWAL-4.1.md` §1, with «oleh {nama}», is **superseded** and marked there.
> - **I check all of this once, on B2's candidate commit.** This is not a review visit.

**Sources:**
- `B2-ARCHITECT-NOTES.md` §3 (Sharon's items 5 and 6) on `claude/bob-41-master-plan` at `24e3830d62ff3a7852b3aa76ca1b5053baad934d`;
- B2's completion page §3 and §4 on the work branch at `b21bec621a449e8d4d90ed646f7fb09c15dfc6f9`;
- THE PLAN §5.2 F.

## 1 · The default browser print line (Sharon's item 5)

**I agree with Sharon's ruling.** A paper must not name someone who did not print it. Her line is the basis. I add one word-pair, so the time cannot pass for PINTAR's record.

| | Line |
|---|---|
| **ID** | `Dicetak dari browser · {waktu} (jam perangkat) · tanpa nomor referensi` |
| **EN** | `Printed from the browser · {waktu} (device clock) · no reference number` |
| **ID, fallback** | `Dicetak dari browser · tanpa nomor referensi` |
| **EN, fallback** | `Printed from the browser · no reference number` |

**Why «(jam perangkat)»:**
- The official line's time is the server's, and it sits in the same place on the same paper.
- A device clock can be wrong or in another zone.
- Saying whose clock it is keeps the browser line from claiming what only the official line claims. This follows Sharon's reasoning that the time is acceptable *because* it claims no record.
- It costs about 15 characters, which is well within one line at 7.5–8 pt on portrait A4.

**How it is built, so a stale value can never print:**
1. **The stylesheet's default is the fallback line,** with no time. If script never runs, or `beforeprint` never fires, the paper still says the true thing.
2. **`beforeprint` adds the time,** read from the device at that moment.
3. **The time is removed as soon as printing returns,** on `afterprint` and also when `window.print()` returns, as Sharon's item 2 asks for the official swap. A time from an earlier print is never left in place for the next one.

**The time's form:** the same formatter as the official line, «12 Nov 2026, 14.05» in Indonesian and «12 Nov 2026, 14:05» in English, followed by the device's zone:
- **WIB, WITA or WIT** when the device's zone is one of Indonesia's;
- otherwise **«UTC+h»** (or `UTC+h:mm`), never a city name.

**Unchanged:**
- **The official line:** «Dicetak oleh {nama} · {tanggal, jam, zona} · Ref. CTK-XXXX-XXXX» / «Printed by {nama} · {tanggal, jam, zona} · Ref. CTK-XXXX-XXXX». The name and instant are the server's, and the zone is the school's.
- **«Halaman n dari m»** bottom-right.
- **No reference-shaped text** on a browser print.

**THE PLAN §5.2 F and B2's page §3** should replace «Dicetak dari browser oleh {nama} · {waktu} · …» with the lines above. The page's Q2 (where the name comes from) falls away.

## 2 · The register B1-R1 to R5

| # | Change | Wording |
|---|---|---|
| **B1-R1** | `akuntabilitas.ditolak` | **ID:** «Catatan masuk dan cetak hanya dibaca admin sekolah untuk sekolahnya, dan Admin PINTAR.» **EN:** «The sign-in and print record is read by a school's administrator, for their school, and by an Admin PINTAR.» |
| **B1-R2** | **Platform view only:** each row names its school(s). **A line, not a column:** a second line under the name in «Siapa», in `pin-meta`, so the table gets no wider and the phone layout keeps one labelled field | The school's name; several joined with «, » in the order of `institution_ids`. **With no school**, the line is «tanpa sekolah» / «no school» (an unknown identifier, the platform admin's own sign-in). **A school admin's view is unchanged**, with no line, since it holds only their school. New key: `akuntabilitas.tanpa_sekolah` |
| **B1-R3** | One entry in Konfigurasi's «Staf dan akses» group, after «Jejak audit» | The existing keys: **«Catatan masuk dan cetak»** · «Siapa yang masuk, gagal masuk, keluar, atau meminta cetakan resmi.» **Shown only to those who can read it**, school admins and the platform admin, so a teacher is never offered a link that ends in a refusal |
| **B1-R5** | Drop the `aksi` of the two `Kosong` calls (no-match and purged reference) | No wording. The form's own «Hapus saringan» remains |

**On B2's new kind of row** (the Chief Architect's note in §1): a school admin may see a print by a learner who has left the school. **No label is added.**
- The reader shows no one's status, as decided for suspension; the row's meaning is complete as it is: «{nama} · Meminta cetakan resmi · Referensi CTK-… · Berhasil».
- The school already knows the learner left, so it learns nothing new from the row.
- The completion page's "what else did that change" should say it, so no admin is surprised. The screen needs nothing.

## 3 · The completeness notice B1-R4

**Who:** the platform admin only, in «Seluruh platform». **What it reads:** Sharon's new definer function only (her item 6): the count, and the last instant of unrecorded writes in the period the health check uses (7 days).

**When:** only when the count is above 0. **Where:** at the top of the reader, under the introduction and above the filter, as a `pin-banner pin-attention`, in a `role="status"` region. It is not an alert: nothing has just happened.

| | Line |
|---|---|
| **ID** | «Daftar ini mungkin tidak lengkap. Dalam 7 hari terakhir, PINTAR tidak dapat mencatat sebagian kejadian masuk atau keluar (terhitung {n}, terakhir {waktu}). Lihat [Kesehatan sistem].» |
| **EN** | «This list may be incomplete. In the last 7 days, PINTAR could not record some sign-in or sign-out events ({n} counted, the last at {waktu}). See [System health].» |

**The words, line by line:**
- **«mungkin tidak lengkap» comes first.** That is the qualification Sharon and the page ask for.
- **«terhitung {n}» / «{n} counted»** presents the number as what was counted, not as an exact number of missing rows.
- **«masuk atau keluar»:** sign-in, failed sign-in and sign-out are the fail-open writes that can leave a gap. A print whose event cannot be written does not print, so it leaves no gap. **For the engineer:** if the count also includes failed print writes, it should exclude them. If it cannot, say «sebagian kejadian» / «some events» instead.
- **No school is named.** The count holds none, and this view is the platform's.
- **«{waktu}»** uses the same formatter and zone as the platform view's rows that have no school.
- **«Kesehatan sistem»** is the existing card's own name (`config.card.health`), linked to `/konfigurasi?periksa=skema`.

**When things go wrong:**
- If the count cannot be read, the notice is **absent**. The reader never claims completeness in words, so absence claims nothing.
- The health check itself is where a failing read is seen.

**Noted only, not B2:** the health card's own line `config.kesehatan.bukan_admin` still says «Admin platform». It belongs to the 4.1 consistency pass with the other older keys.

## 4 · At B2's candidate (one visit)

These all happen in that one visit:
- the footer, official and default, printed to PDF in portrait and wide, with the time filled and with the fallback;
- the swap and its restoration with `afterprint` suppressed (Sharon's item 2);
- R1, R2 (platform view, at 1280, 390 and 320), R3 (as a school admin, as the platform admin, and absent for a teacher) and R5;
- the notice, with a count above 0 for the platform admin and absent for a school admin;
- S-1's drawer at 390 and 320 across the Konfigurasi pages;
- axe on each.
