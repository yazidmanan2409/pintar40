# A3 · Chunk 1 of 2: the recovery screens (change note for Sharon, cc Bob and Daisy)

> **Range:** `4079a253..HEAD` on `claude/a3`, which is 10 code commits plus this note.
> **Status:** development branch only. No merge, staging or production action.
> **Chunk 2** follows: the merge into `claude/a3`, then the dry run of `20270121210000`.

## What changed

1. **Two reads.** Migration `20270121250000_a_recovery_is_shown.sql` brings the count to 288.
   - Each read is redefined in full from its live body. Each change is additive: no lock, order, authority or
     refusal changes, and nothing writes.
   - **`pengerjaan_saya`** gains three fields:
     - `di_sesi_ini`: this session controls the sitting, or no session does yet (the first writer claims it).
     - `perlu_izin`: the sitting is POST_TEST.
     - `izin_dipakai`: the current generation came by a teacher's permission.
   - **`daftar_pengerjaan`** gains three columns. Because its result type changes, it is dropped and recreated, with
     its grant restated as it was.
     - `mode_asesmen`.
     - `lanjut_diminta_pada`: shown only while the sitting is open.
     - `izin_berlaku_sampai`: the newest permission while it is unused and valid.
   - Both reads stay STABLE, and the migration's closing check asserts the fields and the grants.
   - **D-060:** the metric catalogue and the engine are unchanged.
2. **The old session's screen** (`ItemPlayer`).
   - **Defect fixed:** a save refused with `SITTING_NOT_CONTROLLER` used to be classed "pending" and retried forever. It
     is now terminal. The same happens when the 45-second check sees `di_sesi_ini` false, or when finish, pause or
     resume are refused.
   - **What the learner sees:** the question area is replaced by Daisy's neutral panel, with `role="status"` and no
     error colour. The panel has a title, the contract sentence, the count of answers left unsaved, and «Kembali ke
     Belajar».
   - Nothing is sent, replayed or polled again, and no offer to take the sitting back is shown.
3. **The new session's screen** (`LanjutkanDiSini`, chosen by `PermukaanAsesmen` from `pengerjaan_saya`).
   - **Low-stakes:** one confirmation, «Lanjutkan di sini?» with [Lanjutkan di sini] and [Batal].
   - **Uji Penguasaan:** one attempt on opening.
     - On `RECOVERY_NOT_AUTHORISED` the screen calls `minta_izin_lanjut` and shows Daisy's §6.2 waiting body.
     - «Coba lagi» re-checks once and says when it checked.
     - EXPIRED, USED and NOTHING each have their own sentence, in `BarisHasil`.
   - Nothing retries or redirects by itself.
   - **The quiet line after a recovery** (`BarisLanjut`): after a teacher-allowed recovery, the warning shows while the
     sitting lasts. After the learner's own recovery, the plain line shows once.
4. **The teacher's act** (`AturPengerjaan`, `izinkanLanjutAksi`, «Siapa yang sudah mengumpulkan»).
   - **The action:** «Izinkan lanjut setelah masuk lagi», offered only on an open Uji Penguasaan with no valid
     permission.
   - **The form:** a primary act, not the red confirmation, with Daisy's §8 question and the reason field inside it. A
     refusal comes back with the typed reason kept (BL-1).
   - **The result line:** «{nama} dapat melanjutkan sampai pukul {jam} {zona}.»
   - **The row:** shows «minta lanjut setelah masuk lagi» while the learner's request stands, on the row's meta line
     (`metaBaris`), so the state cell stays one Badge.
   - **RECOVERY_NOTHING:** said in the teacher's own sentence.
   - **O-4 throughout:** no sentence says «perangkat lain».

## Invariants

- **D2, S2:** the old session's next act gets no refusal screen and no loop. Its panel is the only thing it shows.
- **D11, Daisy §2:** one attempt on opening, then the learner's own choices only. Nothing retries by itself.
- **D7:** a low-stakes sitting never offers the teacher's act and needs no permission.
- **The screens hold no session id, device or generation:** each reads `pengerjaan_saya`'s booleans.
- **X.8:** the act's code crosses to the browser; the error's text never does.

## Tests that prove it

- **A3-L01** (db): the reads' new fields before and after the request, the permission and the recovery, from the old
  and the new session. Red first at `ce1b9431`.
- **A3-S10** (static): the old session's terminal delivery, its panel and its role; the new session's three call sites
  and no self-retry; O-4. Red against the player as it stood, naming every gap.
- **A3-J01** (app): opening a sitting another session controls.
  - The Pemetaan Awal asks «Lanjutkan di sini?», plays nothing and does not move the sitting.
  - The Uji Penguasaan plays nothing.
  - Rendering writes nothing.
- **A3-J02** (app): the teacher's journey. Red against the old teacher side.
  - The request on the row; the act only on an open Uji Penguasaan.
  - A short reason refused, with the typed reason kept.
  - A full reason writes one valid permission, and the result line uses the no-break space.
  - The act is not offered again while the permission lasts.
- **Defects the pre-flights caught, each fixed:**
  - On `92ced271`, fixed in `1edb9d10`:
    - DAISY-18: the refusals now go through `BarisHasil`.
    - UX1-S0: the two new surfaces are now on the re-set list.
  - On `0628760c`, fixed in the next commit:
    - B4-J2-K01: the request moved to the row's meta line.
    - A2A-C720: the act count, now six, is restated.

## Pre-flight

**`fde846f1`: one uninterrupted full pre-flight, GREEN.**
- 1280 tests passed, 0 failed.
- Plants 175/175; red cases 11/11.
- Lint, typecheck and build identity clean.

**The run before it, on the same head, was red on one test: DR-D02.**
- The test reinstalled both scheduled jobs exactly once, then its verify-only step exited 1.
- It passed by itself. It also passed on `0628760c`, which has the same database, because the only changes since are
  the meta line, the page and a test count.
- My guess is that the copy's five-minute job fired during verification against earlier tests' leftovers. I have not
  confirmed that, so I count it as unexplained, not a flake.
- If it recurs, it belongs to Z, with L1F4-K05.

## For Daisy

1. **English to check:** my drafts of the new learner sentences (`pengerjaan.pulih.*`), including «Diperiksa pukul
   {jam}.» (EN «Checked at {jam}.»).
2. **The row:** the list's existing badge reads «Sudah mulai, belum mengumpulkan», not «Sedang mengerjakan». The request
   shows on the row's meta line as «minta lanjut setelah masuk lagi». Keep that, or change the badge?
3. **RECOVERY_NOTHING on the learner's screen:** it offers «Kembali ke Belajar» only. The page cannot tell whether a
   result exists, so «Lihat hasil» is not shown. Is that acceptable?
4. **A request that never arrives** reuses the existing «Belum tersambung ke PINTAR. Periksa sambungan internet, lalu
   coba lagi.»

## For Bob (one line)

Chunk 1 (the screens) is pushed with this note; chunk 2 is the merge plus the dry run. One question for chunk 2: your
note says «main, pins 288», the earlier plan said «C2w's frozen head, pins 289». Which?
