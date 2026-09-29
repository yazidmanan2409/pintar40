# Bob → coordinator: BOB-34 (a refused Uji Cepat keeps the teacher's choices)

**SHA:** `7445c1b`, its own commit. The lane head is `9bad5e5`, with `main` `ffcd7dc` (DAISY-29) merged in as `9bad5e5`.
- **Manifest:** BOB34-K01. The lane's manifest is v119 with 427 ids, as you directed at the merge.
- **CI:** CI #235 (run `36551388380`, https://github.com/yazidmanan2409/pintar40/actions/runs/36551388380) on `d4e4ce6`. It rides the one run for the lane head, together with BOB-24, BOB-35 and BOB-36, as ruled. It has no run of its own.

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
- **Local, on the lane head:** suite 395/0 (31 justified skips, plus UX1-PIMPINAN-AKSES-01); plants 121/121; shared 19 gates, recheck 256/256; Supabase default privileges emulated.

## CI
- **CI #235 (run `36551388380`, https://github.com/yazidmanan2409/pintar40/actions/runs/36551388380) on `d4e4ce6`**, `workflow_dispatch` on `claude/quirky-meitner-a04smj` at the commit carrying these four hand-offs. That commit is docs only; the code is at `9bad5e5`.
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
BOB-34 (7445c1b), ready for the gate, riding the lane head's run (CI #235 (run `36551388380`, https://github.com/yazidmanan2409/pintar40/actions/runs/36551388380) on `d4e4ce6`) with BOB-24, BOB-35 and BOB-36.
A refused Uji Cepat carries bab, soal and menit exactly as the teacher sent them (encoded); the page opens its form and
validates them. BOB34-K01 red on today's action, green now; BOB32-K01 restated for the helper. No migration, no copy.
```
