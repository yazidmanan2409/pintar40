# A2b, R-A: the learner's sentence for each refusal code (Daisy, 16 Nov 2026)

> **What holds now:**
> - **`MAINTENANCE_NO_NEW_START`** (T−15 up to the start): **the existing sentence is right. Keep it unchanged** (§1).
> - **`MAINTENANCE_PLACE`** (window active): **new sentence below.** `galat.maintenance_active` is **not** right for it (§2).
> - **R-B:** I agree with the amendment as worded in the plan's R-B (`PLAN-A2B-C2W.md`).
> - **Owner approved R-B.** Bob's ruling for a warning already on screen when a re-read fails: it stays, without its countdown. **The line is in §4.**
> - **Read at:** `main`'s `hle.ts`, against R-A at `e15fe966`.

## 1 · `MAINTENANCE_NO_NEW_START`: keep `galat.maintenance_no_new_start`

> «Pemeliharaan segera dimulai, jadi asesmen baru tidak dapat dimulai sekarang. Mulailah setelah pemeliharaan selesai.»
> EN: «Maintenance is about to begin, so no new assessment can be started now. Start it after maintenance ends.»

- **True on both sides of R-A's table:**
  - it names no scope, so it fits a class window, a school window and a platform window alike;
  - it says «baru», so a running sitting is not implied.
- **It stays the fallback** (a stale page, «Mulai» pressed). The **disabled «Mulai» keeps D4's sentence** with the time (`A2-KATA-DESAIN.md` B2), shown in its result line, not on the pause page.

## 2 · `MAINTENANCE_PLACE`: a new key, `galat.maintenance_place`

**Why not `galat.maintenance_active`:**
- it says «PINTAR sedang dalam pemeliharaan», which is false for a work-scoped window: the learner's other class works;
- it says «belum dapat **disimpan**», which is wrong for a start.

**The one code serves every classed writer: a learner's start and a teacher's act.** So the line names the act generically, and the place by scope:

| Scope (from the window) | ID | EN |
|---|---|---|
| A class | «Pemeliharaan untuk kelas {kelas} sedang berlangsung, jadi ini belum dapat dilakukan. Tidak ada yang diubah. Coba lagi setelah pemeliharaan selesai.» | «Maintenance for class {kelas} is under way, so this cannot be done yet. Nothing was changed. Try again after maintenance ends.» |
| The school | «Pemeliharaan untuk sekolah ini sedang berlangsung, jadi ini belum dapat dilakukan. Tidak ada yang diubah. Coba lagi setelah pemeliharaan selesai.» | «Maintenance for this school is under way, so this cannot be done yet. Nothing was changed. Try again after maintenance ends.» |
| Scope not known to the caller (fallback) | «Pemeliharaan sedang berlangsung di bagian ini, jadi ini belum dapat dilakukan. Tidak ada yang diubah. Coba lagi setelah pemeliharaan selesai.» | «Maintenance is under way here, so this cannot be done yet. Nothing was changed. Try again after maintenance ends.» |

**Choices behind the line:**
- «sedang berlangsung» matches the banner's `pemeliharaan.pita.berlangsung`.
- «Tidak ada yang diubah» matches A2a's fence refusal.
- **No end time in the line.** The class's banner on the same page already shows it in the school's zone (A10), and an extension would otherwise make the line stale.

**For a learner on the start screen:**
- the disabled «Mulai» carries the banner's existing `pemeliharaan.pita.asesmen_baru`: «Asesmen baru tidak dapat dimulai sampai pemeliharaan selesai.»;
- no new key is needed.

**Neighbours checked:**
- a platform-wide planned window keeps today's redirect (R-A) and needs nothing new;
- an EMERGENCY stays A2a's pause page.

## 4 · A warning on screen whose re-read failed (Bob's ruling, 16 Nov)

**What changes on screen:**
- The countdown («Pemeliharaan dalam {n} menit») is replaced by the line below.
- Everything else in the stage stays, including its amber at T−15.
- On the next stage's successful read, the normal stage returns.
- The live region does **not** announce the swap: it is a loss of freshness, not new news.

| Scope | ID | EN |
|---|---|---|
| Platform | «Menurut pemeriksaan terakhir, pukul {jam_baca} {zona}, pemeliharaan dijadwalkan mulai pukul {jam} {zona}.» | «As of the last check, at {jam_baca} {zona}, maintenance was scheduled to start at {jam} {zona}.» |
| A class | «Menurut pemeriksaan terakhir, pukul {jam_baca} {zona}, pemeliharaan kelas {kelas} dijadwalkan mulai pukul {jam} {zona}.» | «As of the last check, at {jam_baca} {zona}, maintenance for class {kelas} was scheduled to start at {jam} {zona}.» |
| The school | «Menurut pemeriksaan terakhir, pukul {jam_baca} {zona}, pemeliharaan sekolah ini dijadwalkan mulai pukul {jam} {zona}.» | «As of the last check, at {jam_baca} {zona}, maintenance for this school was scheduled to start at {jam} {zona}.» |

**The placeholders:**
- **{jam_baca}** is the time of the last successful read, the page's own clock shown in the school's zone. **{jam}** is the window's start from that read.
- Both times are whole minutes, in the school's zone (D8).
- If the start falls on another day, add «, {tanggal}» after {jam} {zona}, as in D4.

**Why this wording:**
- «Menurut pemeriksaan terakhir» and the past tense «was scheduled» say the information may be old, **without** claiming an error the learner can do nothing about.
- **No «coba muat ulang»:** the next stage retries by itself, and a reload during a sitting is the wrong advice.

## 5 · Anticipation

**No defect.** One existing key, `maintenance_active`, would have fitted badly. It was found by question 1 (what else names this state) before the build.
