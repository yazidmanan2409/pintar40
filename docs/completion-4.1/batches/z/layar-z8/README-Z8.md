# Z8 item 8 (stream A) · a school keeps a usable administrator: captures for Daisy

> **Taken on the local app** of `claude/z` with migration `20270123170000` (308), `next start` against a fresh local stack
> (the seed's synthetic world), widths 390 and 1280, device scale 2, the viewport only.
> - **The world:** Sekolah Sintetis Alpha. Admin Alpha is its only Admin sekolah; Guru Alpha teaches 5A there.
> - **Keyboard only:** each field is reached by focus and Tab, chosen with the arrow keys, typed, ticked with Space and
>   sent with Enter. No clicks.
> - **`CATATAN-Z8.txt`** has, per shot: the address, the horizontal overflow (**0 px in all 8 shots**), the focused
>   element, the live-region text and the section's text, with the database's state after each step.
> - **Script:** `tangkap-z8.sh` (a fresh reset, a build, `next start`, the walk, a reset again) and `tangkap-z8.ts`.

## The recovery walk (Daisy), at 390

| Step | Shot | What it shows |
|---|---|---|
| 1. The closure refused | `z8-01-tutup-tolak-390` (and `-1280`) | Akun saya › Meninggalkan PINTAR. «Tutup akun saya» ticked and sent: `akun.tinggal.galat.account_last_school_admin` in the result line (`role="alert"`), Daisy's words, naming no school. The account is not closed, and the «Tutup akun saya» form is still offered under the line |
| 2. Appoint a second Admin sekolah | `z8-02-tunjuk-isi-390`, `z8-03-tunjuk-yakin-390`, `z8-04-tunjuk-ok-390` | Peran & akses › Berikan peran: Guru Alpha, Admin sekolah, Sekolah Sintetis Alpha, an end date. D-101's confirmation («Ya, jadikan admin sekolah»), then «Peran diberikan» with the new row listed. The school now has two usable administrators |
| 3. The closure goes through | `z8-06-tutup-ok-390` | The same request, sent again: the account is closed and the person signed out (`/keluar?akun=ditutup`) |

## The refused revocation, at 390

| Shot | What it shows |
|---|---|
| `z8-05-cabut-tolak-390` | Peran & akses: `peran.galat.role_last_school_admin` (reused unchanged, as Daisy ruled), in the result line |
| `z8-05-cabut-peran-tetap-390` | The same page further down: Admin Alpha's own role is still listed, and live |

**How it was reached.** The screen offers no «Lepaskan» on one's own role (the row's action is drawn for other people
only), so a school admin cannot ask for this refusal from the screen. The request was sent as a browser could: the
open revocation form of another row (Guru Alpha's), with its hidden `assignment` pointed at Admin Alpha's own role, the
reason typed and Enter pressed. This is b0-layar's precedent for the self-renewal. The database refuses it whatever
the form sent.

## For Daisy to judge

1. **Seen in passing, not item 8's:** Akun saya draws a third form, «Minta akun dibuka kembali», for a signed-in
   person, with «—» for its description, its confirmation and its button (`-1280` shows it at the bottom).
   `JENIS_PERMINTAAN` includes REOPEN, and MeninggalkanPintar draws every kind that has no open request; REOPEN has no
   `akun.tinggal.akibat/konfirmasi/tombol` keys. A closed account asks to be reopened signed out, from the sign-in page.
   This is in `MeninggalkanPintar.tsx` and the existing keys, so it is not mine to change.
2. The refusal after a revocation is drawn under the role list (`05-…-peran-tetap`), as every result on Peran & akses is.
