# A2b · D8 batch 2 (Konfigurasi) review (Daisy, 16 Nov 2026)

> **What holds now:**
> - **BLOCKED on two points** (§1). Both can lead an admin to act on the wrong scope.
>   - A refused schedule drops the class.
>   - The list row does not name the class.
> - **Three corrections** for the same commit (§2).
> - **Holds as built:**
>   - the reason group and its keyboard path;
>   - the class step and its work-scoped hint;
>   - «Perpanjang» in two steps, its refusal and its result;
>   - «Akhiri sekarang»'s class confirmation and its result;
>   - the {zona} labels in WIB and WITA;
>   - 0 px overflow;
>   - my extend line, with DAISY-25 green.
> - **Second Eye's question** (keep the class after a refusal?) is answered by BL-1: **yes, required.**
> - **Read:** `claude/a2b` at `7a079eb2`, `docs/completion-4.1/batches/a2b-d8-batch2/` (30 shots, `CAPTURE-LOG.txt`). I opened the refusal, the WITA class step, the row, the extend step two at 320, and the WITA end confirmation.

## 1 · Blockers

**BL-1 · A refused schedule loses the class and empties the times** (`d8-5-wib-alasan-ditolak-390`):
- After «Belum berhasil. Pilih alasannya …», the form shows «Untuk: ☑ Sekolah Sintetis Siklus» with **no class list**. The 5S choice is gone.
- The **Mulai and Selesai inputs are empty** (mm/dd/yyyy), while the lines under them still show «Senin, 16 Nov 2026, 20.27 WIB» and «22.27 WIB». The screen shows times the form no longer holds.
- Step two (the reason, the message) is not redrawn.
- **The risk:** the admin chooses a reason and resubmits. The scope is now the **whole school**, not 5S. A class window becomes a school window without anyone choosing it.
- **Needed:** after any refusal, keep every entered value:
  - school, class(es), start, end, message, reason, «Lainnya» text, the announcement box;
  - reopen step two;
  - move focus to the alert.

  If the values cannot be kept, clear the echo lines too, and return the form to an honest empty state. But keeping them is the right fix.
- **Siblings to sweep:** the extend form's refusals and the announcement form. Do they keep their entries?

**BL-2 · The list row does not name the class** (`d8-6-*-baris`):
- The row reads «Berlangsung · Terencana · Sekolah Sintetis Siklus». A 5S window and a whole-school window look the same.
- Yet «Akhiri sekarang» then asks «… Pekerjaan kelas 5S …». The admin learns the scope only in the confirmation.
- **Needed:**
  - «Berlangsung · Terencana · kelas 5S · Sekolah Sintetis Siklus» (several classes: «kelas 5S, 5A»);
  - **«Dijadwalkan oleh {nama}»**, as my D8-6 list and THE PLAN §5.3 F have it. It is in no shot or log line.

## 2 · Corrections (same commit)

| # | Where | Now | Should be | Why |
|---|---|---|---|---|
| C-4 | The form's intro (`config.pemeliharaan.arti`) | «… saat pemeliharaan dimulai PINTAR tidak dapat mereka pakai, kecuali murid yang sedang mengerjakan asesmen …» | ID «Jadwalkan pemeliharaan supaya orang yang terdampak tahu lebih dulu. Mulai 60 menit sebelumnya, pita peringatan tampil; mulai 15 menit sebelumnya, asesmen baru tidak dapat dimulai. Pemeliharaan untuk sekolah atau kelas menahan perubahan pada pekerjaannya, dan bagian PINTAR yang lain tetap dapat dipakai. Pemeliharaan seluruh platform membuat PINTAR tidak dapat dipakai. Asesmen yang sedang dikerjakan tetap dapat diselesaikan dan dikumpulkan.» EN «Schedule maintenance so that those affected know in advance. From 60 minutes before, a warning banner shows; from 15 minutes before, no new assessment can be started. Maintenance for a school or a class holds changes to its work, and the rest of PINTAR can still be used. Maintenance for the whole platform makes PINTAR unavailable. Assessments in progress can still be finished and submitted.» | The admin is told the opposite of what a class window does. It is the sibling of the D8-2 line fixed in batch 1. It also drops «diberi tahu» |
| C-5 | The row's reason | «Alasan (dicatat): Pembaruan sistem» | «Alasan: Pembaruan sistem» for a coded reason. Keep «(dicatat)» only for the old free text | A D2 reason is **shown** to the affected, so «dicatat» undersells it |
| C-6 | «Akhiri sekarang» open (`d8-6-wita-akhiri-tanya`) | the reason field sits above the confirmation box, and a second «Batal» sits under the box | the reason field **inside** the box, and **one** «Batal» | The double «Batal» I noted for A2a, again. Two cancels for one act |

## 3 · Notes for the next batch (not blocking)

- **N-3:** the collision advice says «Pertimbangkan memulai pemeliharaan setelah 15 Mei 2027». The "end" it uses is the assignment's `closes_at`, the same root as V-2. The advice is literally true and useless. A 4.0 line, so for Z.
- **N-4:** the date-time inputs use the browser's own format («9:28 PM»). The echo line under each is in the school's format, which is why it exists.

## 4 · Anticipation

| # | Defect | Whose | Anticipable? | Question |
|---|---|---|---|---|
| A2B-D6 | BL-1: a refusal drops the new class field | build | **Yes** | **4** (before and after: the form after a refusal) and **1** (what else reads the class: the redraw) |
| A2B-D7 | BL-2: the row omits the class and «Dijadwalkan oleh» | build | **Yes** | **5**: where the scope renders for the admin |
| A2B-D8 | C-4: the intro states the platform-wide rule for every scope | build (a 4.0 line) | **Yes** | **1**: the sibling of D8-2's line |
| A2B-D9 | C-6: a double «Batal» | build | **Yes** | **2**: noted at A2a |
