# L-1 (suspended sign-in): what I will check, before the code (Daisy, 12 Nov 2026)

**Instruction:** `docs/completion-4.1/TEAM-INSTRUCTIONS.md` at `d7f9818bb8834ba29c890c331b7845601bef9ac5` («Daisy», item 1).

**Completion page:** `AUTH-SUSPENDED-SIGNIN-COMPLETION.md` at `11171e5bd3e067d2f434f96cba09cf98102b6137`. That commit is the head of `claude/system-integrity-4.0`, and it holds the page only, with no code yet.

**No verdict here.** My verdict comes on the implementation commit Sharon reviews, given as 40 characters.

## The page, read for what a person sees

**The page agrees with my minimum** (`TINJAUAN-B1-1fc719b5.md` §3):
- the five cases are indistinguishable from outside;
- B1 records `MASUK_TIDAK_COCOK`;
- a real outage still answers 503.

**I have nothing to add before code.** Two readings, to settle at review rather than now:

1. **«The same as a wrong password», in each method, means that method's own mismatch.** For example:
   - card: `CARD_NOT_MATCHED`;
   - code: `KODE_TIDAK_COCOK`;
   - PIN recovery: `PIN_TIDAK_COCOK`.

   It does not mean the password screen's code everywhere. B1's reader shows each method's own words.
2. **`PIN_DITANGGUHKAN` is not account suspension.** It is the PIN-recovery lock after too many wrong PINs («… dihentikan setelah terlalu banyak PIN tidak cocok …»). It is outside L-1 and should stay. **What PIN recovery answers for a suspended account** is part of «every method», and I will look.

## What I will check on the implementation commit

Locally, rendered:
- one account suspended, and one closed;
- the anonymised case through the B1-A04 path;
- an unknown address;
- an active account with a wrong password.

| # | Check | Pass when |
|---|---|---|
| 1 | **The password screen**, right and wrong password, for suspended, closed and unknown | The same status, code and visible sentence as a wrong password: «Email, username, atau password belum cocok.» No reference code, and no «coba lagi sebentar lagi» |
| 2 | **The other doors** (card, code, PIN recovery, link request) for a suspended account | Each answers its own mismatch, exactly as for a wrong secret |
| 3 | **The reader's row**, seen by the school admin and by the platform admin | «Tidak berhasil masuk · {cara} · Email, username, atau password belum cocok.» (or that method's own words). Nothing tells it apart from an ordinary wrong password |
| 4 | **Reinstatement** | Sign-in works again; the reader shows «Masuk · Berhasil» |
| 5 | **A real outage** (Auth stopped for one attempt, locally) | Still «PINTAR sedang tidak dapat memproses ini …» with a reference. Unchanged |
| 6 | **Nothing else changed** in the screens | A diff of `src/` limited to the lock and its routes. Any wording change is named in my verdict |
| 7 | **Accessibility** | The refusal is announced as before (same component). axe at 390 and 320 on the sign-in screen |

**The red-first check is already seen on `1fc719b5127313bf24084695fa30d7505e15b5d1`:**
- the suspended account, with a wrong password: 503 `LAYANAN_TIDAK_TERSEDIA`;
- an unknown address and an active account: 401 `MASUK_TIDAK_COCOK`.

That is `verifikasi-B1-1fc719b5/catatan-jalan.txt`.

## Later items in my section, noted only

- **F-1:** only if its page says a screen changed.
- **B2, one visit:** design input, B1-R1 to R5, B1-R4 (platform admin only, qualified, linking to health, no school named), and S-1 at 390 and 320 across the Konfigurasi pages.
