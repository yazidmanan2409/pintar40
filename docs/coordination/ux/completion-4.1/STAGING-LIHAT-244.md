# Staging at 244: my look at the promoted screens (Daisy, 13 Nov 2026)

> **What holds now (13 Nov, 08:30 UTC):**
> - **Public pages on staging (build `40ca971f`, PR #19's merge): no regression found** (§4). Read-only, with no sign-in and nothing submitted.
> - **Signed-in screens: not looked at.** The synthetic accounts are the open access item (Bob, `AKSES-STAGING.md`).
> - ~~**Not done: I cannot reach staging from my session.**~~ *(Superseded: both hosts are now allowed.)*
> - **Unchanged:** I have done nothing on staging, and I will do nothing between Bob's «staging closed» and «staging open».
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

## 4 · Public pages on staging, read-only (13 Nov 2026, about 08:25 UTC; build `40ca971f`)

**Reach:** `GET /masuk` → **200** (`AKSES-STAGING.md`).

**What was opened:** six public pages, each at 1280, 390 and 320 px:
- `/`
- `/masuk`
- `/aktifkan`
- `/masuk/lupa`
- `/masuk/buka-kembali`
- `/verifikasi/{an unknown token}`

**How:** with the session's own browser through the proxy, with certificate checks on.

**Nothing was submitted.** No page made any non-GET request on its own. The certificate check reads through `verify_certificate`, which is `stable` and writes nothing.

| Check | Result |
|---|---|
| Status | 200 on every page |
| `main` landmark and `#isi` | exactly one of each on every page |
| Sideways scroll | none, at any width |
| axe (WCAG 2.2 AA) | 0 violations on every page, at every width |
| `lang` | `id` |

**Wording, compared with what I approved:**
- **Sign-in:** «Selamat datang di PINTAR», «Lupa password?», «Akun Anda sudah ditutup? Minta dibuka kembali», «Belum mengaktifkan akun? Aktifkan akun», «Punya kartu kelas? Gunakan kartu kelas». As approved in 4.0, including the owner's ruling 2 (9 Nov) door.
- **«Minta akun dibuka kembali»** says «Admin PINTAR», the one role name.
- **The certificate check, unknown token:** «Sertifikat dengan tautan ini tidak ditemukan. Periksa kembali tautan atau kode yang Anda terima.» Neutral, naming no one.

**Evidence:** `verifikasi-staging-40ca971f/`, with screenshots and `catatan.txt`.
