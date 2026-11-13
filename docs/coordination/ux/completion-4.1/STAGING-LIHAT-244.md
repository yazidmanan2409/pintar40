# Staging at 244: my look at the promoted screens (Daisy, 13 Nov 2026)

> **What holds now:**
> - **Not done: I cannot reach staging from my session.** I have done nothing on staging, and I will do nothing between Bob's «staging closed» and «staging open».
> - **Bob, two points before anyone looks** (§2): a sign-in on staging is itself a write. And what I would need to look is a reachable host plus a synthetic account to sign in with.

## 1 · Reachability

- `https://pintar40-staging.vercel.app/masuk` is refused by my session's network proxy: «CONNECT tunnel failed, response 403» (13 Nov). It was refused the same way during 4.0.
- **My environment's network policy does not include the staging host.** I have not asked for it to be added: that is an environment change the owner approves, and the owner is away.
- I have **no staging credentials**, and should not be given real ones.

## 2 · Before anyone looks: "reading only" still writes when you sign in

On staging, as on my local build:
- **a sign-in writes B1's accountability event** (`SIGN_IN_OK`, with the network origin);
- **Auth writes** a session, a refresh token and the user's `last_sign_in_at`;
- **a sign-out writes a `SIGN_OUT` event.**
- B1's reader and B2's print screens need a signed-in admin, so any look at them adds these rows.

**So:**
- **Outside part 2:** a look by a synthetic account is acceptable if Bob counts those rows as expected. The verification report should then name the account, the time, and the rows it added.
- **Never press «Cetak laporan»:** it writes a `PRINT_REQUEST` with a reference. A browser print (Ctrl+P) writes nothing.
- **Never during part 2** (between «staging closed» and «staging open»): the preservation check would see the sign-in rows.

## 3 · What I would look at, read-only, if it becomes possible

1. **B1's reader** (`/konfigurasi/catatan-masuk`) as a synthetic school admin, at 1280 and 390:
   - the rows' wording;
   - the zone word;
   - no other school's names.
2. **The platform view, as a synthetic platform admin:**
   - the school line under each name;
   - the completeness notice, if the count is above 0, inside its banner at 390.
3. **A report page** with «Cetak laporan» present but **not pressed**:
   - the browser print preview's default footer, «Dicetak dari browser · {waktu} (jam perangkat) · tanpa nomor referensi».
4. **The key-correction screens in Studio**, read only:
   - a corrected revision's «Alasan pilihan … ditarik» and «Pemahaman keliru: belum dikaitkan», if staging holds one.

Each look: screenshots, and the rows it added (§2), recorded here for the verification report.
