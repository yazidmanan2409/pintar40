# Bob → coordinator: BOB-34 (a refused Uji Cepat keeps the teacher's choices)

**SHA:** `7445c1b`, its own commit. The lane head is `c0d82c3`. `main` `9e72564` (DAISY-30) came in as `de588a4`, and `ffcd7dc` (DAISY-29) came in earlier as `9bad5e5`.
- **Manifest:** BOB34-K01. The lane's manifest is v120 with 429 ids (the union with `main`'s DAISY-30-TEKS-01), as you directed at the merge.
- **CI:** CI #236 (run `36558480818`, https://github.com/yazidmanan2409/pintar40/actions/runs/36558480818) on `3862dae`. It rides the one run for the lane head, together with BOB-24, BOB-35 and BOB-36, as ruled. It has no run of its own.

## CHANGED
- **`alamatTolakUjiCepat(kode, pilihan, ref?)`** in `src/lib/ujicepat-kontrak.ts` builds the refusal address:
  - `/uji-cepat?cepat=gagal&kode=…[&ref=…]`, followed by `bab`, `soal` and `menit` exactly as the teacher sent them;
  - encoded with `URLSearchParams`, so a value containing `&`, `=`, `?` or `#` comes back whole and cannot override the code;
  - an empty choice is left out.
- **`sediakanUjiCepat`** (`src/app/mengajar/actions.ts`) builds both refusal addresses from `{ bab, soal, menit }` as sent: the named codes, and the QUICK_FAILED catch-all with its reference.
- **No stage parameter.** The page's own links show that without `tahap` the page opens its form. It already reads `q.bab`, `q.soal` and `q.menit` and validates each (`pilihBab`, `pilihSoal`, `pilihMenit`), so the form reopens with the teacher's choices. The page is unchanged; it is Daisy's.

## PROOF
- **BOB34-K01 (static, `selftest/bob34.test.ts`), new.** Red on today's action: `there is no refusal address that keeps the choices: src/lib/ujicepat-kontrak.ts has no alamatTolakUjiCepat; sediakanUjiCepat does not keep the chapter, count and time as the teacher sent them; a refusal of sediakanUjiCepat does not carry the teacher's choices back to the form`.
- **BOB32-K01 is restated for the changed requirement.** Its wiring check accepts either the old template literals or the two `alamatTolakUjiCepat(kode, pilihan[, ref])` calls. Nothing else in it changed.
- **Local, on the lane head:** suite 397/0 (31 justified skips, plus UX1-PIMPINAN-AKSES-01); plants 123/123; shared 19 gates, recheck 256/256; Supabase default privileges emulated.

## CI
- **CI #236 (run `36558480818`, https://github.com/yazidmanan2409/pintar40/actions/runs/36558480818) on `3862dae`**, `workflow_dispatch` on `claude/quirky-meitner-a04smj` at the commit carrying these hand-offs. That commit is docs only; the code is at `c0d82c3`.
- **The previous run, CI #235** (run `36551388380`, on `d4e4ce6`, code `9bad5e5`), was **green**. It is superseded by the gate's fix round for BOB-35 (`91d0cb6`) and BOB-36 (`ec0f65c`), and by the DAISY-30 merge.
- It is the one run for BOB-24's fix, BOB-34, BOB-35 and BOB-36, as directed.
- The red-case matrix carries `db-bob24-gates`, `db-bob35-gates` and `db-bob36-gates`.
- I don't poll it: you read it at the gate.

## CONTRACT
The Uji Cepat refusal address adds `bab`, `soal` and `menit`, as sent. The page reads them as before.

## MIGRATIONS
None.

## COPY
None.

## QUESTIONS
None.

## READY
Yes, in the one run with BOB-24, BOB-35 and BOB-36.

---
### Summary (ready to paste)
```
BOB-34 (7445c1b), ready for the gate, riding the lane head's run (CI #236 (run `36558480818`, https://github.com/yazidmanan2409/pintar40/actions/runs/36558480818) on `3862dae`) with BOB-24, BOB-35 and BOB-36.
A refused Uji Cepat carries bab, soal and menit exactly as the teacher sent them (encoded); the page opens its form and
validates them. BOB34-K01 red on today's action, green now; BOB32-K01 restated for the helper. No migration, no copy.
```
