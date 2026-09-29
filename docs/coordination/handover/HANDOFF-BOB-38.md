# Bob → coordinator: BOB-38 (a successful email sign-in never shows the failed-link screen)

**SHA:** `c088f58`, its own commit, and `6f3bfda` (the test for your gate question). They sit on top of the lane head that carried BOB-24, 34, 35 and 36 (CI #236).
- **Manifest:** BOB38-K01. The lane's manifest is v122 with 432 ids.
- **CI:** the run named in the next commit. It is the first of the two runs for BOB-38 to BOB-41, carrying BOB-38 and BOB-39.
- Post-login review #1, approved for 4.0 correction (D-061).

## CHANGED
**The defect.** `TukarTautan` called `tukarKode(...).then(() => setMati(true)).catch(() => setMati(true))`, and its comment assumed success never returns. In Next 16.3.5 a server action that redirects **rejects** its caller's promise with the redirect. So every successful exchange fell into the catch and rendered S14 («Tautan ini sudah tidak berlaku … Minta tautan baru», with focus moved to it) until the role home had rendered.

**The mechanism: success is an answer, not a redirect.**
- **`tukarKode`** (`src/app/auth/callback/actions.ts`) answers `{ ok: true, tujuan }` with `tujuanMasuk(lanjut)`'s destination, which is unchanged: a carried `lanjut` still wins, else the role's home. A refused exchange still answers `{ ok: false }`.
- **`sesudahTukar`** (new, `src/lib/tukar-kontrak.ts`) is the page's decision.
  - A success leaves for its destination. The destination is narrowed once more through `tujuanInternal`, so a shape that is not a path lands on `/`, the role's home.
  - Anything else is S14.
- **`TukarTautan`** leaves with `window.location.replace(destination)`. S13 («menukar…») stays up during the departure, and the used callback is **not left in history**. A refusal, or a request that never came back, is S14.

## PROOF
**Where `location.replace` goes (your question): only a same-site path, from `tujuanMasuk` over the `lanjut` cleaned exactly as today.** The chain:
1. `page.tsx` cleans the link's `lanjut` with `tujuanInternal(sp.lanjut, "")`. That line is unchanged, and the cleaned value is what reaches `TukarTautan`.
2. `TukarTautan` passes that same `lanjut` to `tukarKode(kode, lanjut)`.
3. On the server, `tukarKode` answers `tujuan: await tujuanMasuk(lanjut)`. That is exactly what it redirected to before: `tujuanInternal` again, falling back to the role's home. A direct call of the action with any `lanjut` is cleaned there too.
4. The page's only `window.location.replace(...)` takes `sesudahTukar`'s answer, which runs `tujuanInternal(tujuan, "/")` once more.

BOB38-K01 asserts each step. It also executes `sesudahTukar` over six hostile shapes returned in the destination's place (`//host`, `https://host`, `/\host`, `javascript:`, a tab-led `//host`, `http:/x`), and each lands on `/`, the role's home.

- **BOB38-K01** (static, `selftest/bob38.test.ts`).
  - **What it checks:**
    - it executes `sesudahTukar`: a success goes to its destination, whole with query and fragment; a non-path goes to `/`; and every refusal shape is S14;
    - it reads the action: no `redirect`, and the two answers;
    - it reads the page: success calls `location.replace`, and only a refusal or a failed request sets S14.
  - **Red on today's code:** `the callback page has no way to tell a successful exchange from a refused one: src/lib/tukar-kontrak.ts has no sesudahTukar; tukarKode still redirects on success, which rejects the page's promise into S14; tukarKode does not answer success with tujuanMasuk's destination; TukarTautan still shows S14 when the exchange settles, success included; TukarTautan does not leave for the destination on success (replacing the used callback in history)`.
  - **Green now.**
- **Preserved, with tests:**
  - S14 still shows at once for a missing code or error parameters. The page is unchanged, and BOB38-K01 reads its condition.
  - An expired, used or other-browser link (audit S1b) is a refused exchange, `{ ok: false }`, so still S14.
  - «Minta tautan baru» still goes to `/masuk` with no destination (D1): BOB38-K01 and the existing D1 check.
  - A carried `lanjut` still wins, since `tujuanMasuk` is unchanged; the existing destination tests pass.
  - The class-card path is untouched: no file under `src/app/masuk/kartu` or `src/app/api/masuk/kartu` changed.
  - No copy change.
- **The behavioural check is yours,** in the audit (journey B, S1: S14's heading never appears during a successful sign-in).
- **Local, on `5eb779b`:** every database with an `en-US` ICU collation and Supabase's default privileges emulated: full suite 400 passed, 0 failed, 31 justified skips (the one unjustified skip, UX1-PIMPINAN-AKSES-01, needs network, as before); plants 124 of 124 on a copy taken straight after the seeds (db-bob39-gates among them); shared red cases, all 20 gates exited 0 with the schema digest the same and every recheck 257 of 257. After merging `main` `559b739` (content documents only) as `29c1857`, the static suite reran: 147 passed, 0 failed.

## CI
- **the run named in the next commit**, `workflow_dispatch` on `claude/quirky-meitner-a04smj` at the commit carrying these two hand-offs. That commit is docs only; the code is at `29c1857`, with `main` `559b739` merged in.
- It is the first of the two runs for BOB-38 to BOB-41, as directed, and carries BOB-38 and BOB-39.
- The red-case matrix gains `db-bob39-gates`.
- I don't poll it.

## CONTRACT
`tukarKode(kode, lanjut)` now answers `{ ok: true, tujuan } | { ok: false }` (type `HasilTukar`). It is called only by `TukarTautan`.

## MIGRATIONS
None.

## COPY
None.

## D-060
Nothing grades, assembles or computes a metric.

## QUESTIONS
None.

## READY
Yes, in the run with BOB-39.

---
### Summary (ready to paste)
```
BOB-38 (c088f58, test 6f3bfda), ready for the gate in the run named in the next commit with BOB-39.
tukarKode answers { ok: true, tujuan } instead of redirecting (a server action's redirect rejected the page's promise into
S14 on every success); TukarTautan decides through sesudahTukar and leaves with location.replace, so S14 never renders on
success and the used callback leaves history. Refusals still show S14; «Minta tautan baru» still starts clean; lanjut still wins.
Where location.replace goes: only tujuanMasuk's answer over the lanjut cleaned as today, re-narrowed; six hostile shapes land on /.
BOB38-K01 red on today's code, green now. No migration, no copy. D-060: none.
```
