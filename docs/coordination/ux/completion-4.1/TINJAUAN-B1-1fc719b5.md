# B1 corrected candidate: final UX and accessibility review (Daisy, 11 Nov 2026)

**Candidate:** `1fc719b5127313bf24084695fa30d7505e15b5d1` on `claude/system-integrity-4.0`, «B1 correction pass: a school reads only its own school of a sign-in record; cross-module checks; purge capacity; inventory». The SHA arrived with 38 characters; `git rev-parse` resolves it to this commit. This is the commit Sharon reviews.

**What changed since `40e89308`:**
- one migration (`…reads_only_its_own_school_of_a_sign_in_record.sql`), tests and documents;
- **no file under `src/` changed**, so the screen is the one I passed at `40e89308`.

**How it was rendered.** Locally only, with no hosted service:
- this commit's own `npm ci`, a reset to its migrations, the report world, `next build`, then `next start`;
- events created through the real sign-in form, plus a sign-out and a print (`CTK-BYXJ-YG64`) through the B1 writer.

**Who viewed it:**
- Bu Wulan (SD Cendekia admin), the platform admin in «Seluruh platform», Alpha's admin and Beta's admin, each at 1280, 390 and 320 px;
- a teacher (refused).

All were checked with axe (WCAG 2.2 AA), and by keyboard where it matters.

**Evidence:** `verifikasi-B1-1fc719b5/`, with screenshots and `catatan-jalan.txt`.

## Verdict on `1fc719b5`: **PASS for B1**

**There is no blocker in B1.**
- Both of Second Eye's observations are real, and neither is a blocker: one is a B1 register item, the other belongs to the shell.
- My review found one more defect, and it is **not B1's**. It is serious enough to be named a blocker in its own right, outside B1: **a suspended or closed account's sign-in answers with a service error.** It is in the 4.0 account lifecycle, which is **on main**. See §3.

## 1 · The five checks

| # | Check | Seen on `1fc719b5` | Result |
|---|---|---|---|
| 1 | **Two schools: the API returns only the reader's own school** | Pak Yusuf (SD Cendekia) was given an Alpha role locally, then signed in through the form. Called with each admin's own token, `akuntabilitas_baca` returns `institution_ids`: **Bu Wulan `[SD Cendekia]` only; Alpha's admin `[Alpha]` only; the platform admin both.** In the HTML, Wulan's page never names Alpha, and Alpha's never names SD Cendekia. Alpha sees his row from after the Alpha role began, not his SD history | **Corrected.** The defect of `40e89308` is gone |
| 2 | **States** | **Empty** (Beta, three widths): «Belum ada catatan. Catatan disimpan sejak 12 Nov 2026.» **No match** (a future date): «Tidak ada catatan yang cocok dengan saringan ini.» **Purged or unknown reference** (`CTK-ZZZZ-ZZZZ`): «Referensi ini tidak ditemukan. Catatan cetak disimpan 12 bulan, sejak 12 Nov 2026.» **Refused** (teacher): `HalamanPenolakan`. **Read failure**, now **provoked**: execution of the reader function was revoked from `authenticated` for one load, then restored. The page keeps its filter and shows one `role="status"` banner: «Catatan belum dapat dibaca sekarang. Coba lagi sebentar lagi.» (`B1-gagal-baca-320.png`) | Pass. The duplicate in the no-match state is §2 |
| 3 | **The school and platform views** | **Bu Wulan:** 50 + 10 rows over two pages, her school's people only. **Alpha:** 4 rows, Alpha's people only. **Beta:** empty. **Platform:** every row, with the «Asal jaringan» column; no school admin has that column | Pass. B1-R2 (the platform view does not name each row's school) is still open |
| 4 | **A deleted person, by PINTAR ID** | Tono Rahayu's account was closed, given a deletion request, and `hapus_data_pribadi` was run as the platform admin. His rows now read **«4HBAGMY0»** in «Siapa», the same as «Jejak audit». Searching «4HBAGMY0» finds the row (`B1-dihapus-1280.png`) | Pass |
| 5 | **Keyboard and accessibility at 1280, 390, 320** | **axe: 0 violations** in every view at every width: Wulan, platform, Alpha, Beta, the teacher's refusal, no match, read failure. **No sideways scroll** at any width. Below 640 px each row is a labelled block. **Keyboard:** Tab reaches «← Jejak audit», the search, «Jenis», both dates and «Tampilkan». A kind chosen with the arrows, then Enter on «Tampilkan», filters, and focus stays on the button | Pass |

**Terminology and navigation, compared with Konfigurasi:** unchanged from `40e89308` and still consistent (my `TINJAUAN-B1-KONSISTENSI.md` §2):
- the back link «← Jejak audit», then the eyebrow «Konfigurasi»;
- the same time formatter and zone word;
- the same pager and refusal component;
- the shell's «Pendataan» bar, like the other Konfigurasi sub-pages.

**Not corrected, and expected:** the register items B1-R1 (the refusal still says «Admin platform»), B1-R2 and B1-R3. B1-R4 is scheduled for B2 and was not looked for.

## 2 · Second Eye's two observations

### 2a · Two «Hapus saringan» in the no-match state: **confirmed, register B1-R5**

When a filter finds nothing, the page shows **two identical buttons** 130 px apart (`B1-tidak-cocok-390.png`):
- **the form's own** «Hapus saringan» under «Tampilkan» (`page.tsx`, the `tersaring` link);
- **the empty state's action** (`Kosong … aksi={{ label: s("akuntabilitas.saring.hapus") }}`, `page.tsx` lines 150 and 152).

The purged-reference state has the same pair.

**Why not a blocker:**
- both have the same name and destination, so neither misleads (WCAG 2.4.4 and 3.2.4 hold);
- a screen-reader user hears the control twice, and a sighted user sees a stutter.

**Correction:** remove the `aksi` from the two `Kosong` calls. The form's «Hapus saringan» remains whenever a filter is active. This matches the other Konfigurasi no-match state («pindah.cari.kosong»), which has no action of its own.

### 2b · The drawer over the heading on a phone: **the overlap is intended; the sheet's width is a shell defect, not B1**

Opened by keyboard at 390 and 320 (`B1-laci-terbuka-390.png`, `-320.png`), the drawer behaves as D-172 P4 asks:
- it becomes a modal sheet (`role="dialog"`, `aria-modal="true"`);
- **the page behind it is `inert`**;
- **initial focus is the first place, «Konfigurasi»**, and the next Tab goes to «Pendataan»;
- **Escape closes it and returns focus to «Buka menu».**

**It does cover the h1**, because it is a full-screen sheet. That is the design, not a collision.

**Closed, nothing overlaps** (`B1-laci-tutup-320.png`). The heading sits clear of the bar. At 320 the bar's own «Penda taan» break is the 4.0 register item about titles breaking mid-word.

**The real defect is the open sheet's width.** It is **8 px wider than the screen**: 398 px at 390, and 328 px at 320. As a result:
- the logo and the places sit on the left edge, with no gutter;
- **the focus ring of «Konfigurasi» is clipped** at both sides;
- «EN» and, at 390, «Keluar» are cut on the right.

It is the same on «Jejak audit», Konfigurasi and Pendataan. Neither `experience.css` nor the shell's components changed between `ab4146da` and `1fc719b5`, so this is existing shell behaviour, **not B1**.

**Register (shell, for the 4.1 consistency pass):**
- the open sheet must not be wider than the viewport;
- it keeps the 16 px gutter;
- the focus ring is whole at 320.

Look first at `.pin-staf .pin-laci { width: 100% }` inside the fixed `.pin-staf[data-laci="buka"]` (`experience.css` around lines 3133 and 3563).

## 3 · Found while verifying deletion and suspension: **a suspended or closed account's sign-in is not neutral** (not B1; on main)

**What happens:**
- `tangguhkan_akun` (and closure) sets `auth.users.banned_until = 'infinity'::timestamptz`. This is in `20270113130000_an_account_is_suspended_closed_or_anonymised_on_the_record.sql:110`, which is **on `origin/main`**.
- The local Auth (`gotrue v2.197.0`) cannot read that value. It fails with «Scan error on column index 1, name "banned_until": … storing driver.Value type string into type *time.Time».
- So the sign-in route answers **503 `LAYANAN_TIDAK_TERSEDIA`**, and shows «PINTAR sedang tidak dapat memproses ini. Coba lagi sebentar lagi. … Kode rujukan: …».

**This is independent of the password.** Same moment, same route, each from its own address:

| Identifier | Password | Answer |
|---|---|---|
| the suspended staff member (Pak Yusuf) | **wrong** | **503 `LAYANAN_TIDAK_TERSEDIA`** |
| an address that is no one's | wrong | 401 `MASUK_TIDAK_COCOK` |
| an active staff member | wrong | 401 `MASUK_TIDAK_COCOK` |

**Why it matters:**
1. **It breaks the 4.0 ruling** that a suspended or closed sign-in stays neutral: «Email, username, atau password belum cocok.»
2. **Anyone can tell a suspended or closed account apart,** with no password. They only need to try an address. This discloses an account's state, which the ruling exists to prevent.
3. **The person is misled.** They are told PINTAR is down and to try again, so they keep trying, and a reference code invites a support call about an outage that is not one.
4. **B1 spreads it, faithfully.** Each attempt, right password or wrong, is one row: «Tidak berhasil masuk · Password · PINTAR sedang tidak dapat memeriksa; diminta mencoba lagi.» (`B1-ditangguhkan-390.png`). A school admin sees only that person's rows reading this way while everyone else's read normally. So the school can infer a suspension from the list, which A1-R3 says must not happen.

**Already known to engineering:**
- `B1-COMPLETION.md` (inventory row «Suspended, closed and deleted accounts») escalates it as «Pre-existing defect outside B1».
- `B1-A04` accepts either code and notes the 503.

**I agree that B1 should not absorb it:** B1 records the route's answer truthfully.

**I correct my own earlier text.** `TINJAUAN-B1-KONSISTENSI.md` §3 said such an attempt «is recorded with the same neutral outcome». It is not, and I had not rendered it then.

**Class:**
- **A blocker for the account-lifecycle journey and the integrity standard**, outside B1.
- For **Sharon** (the disclosure) and the **owner** (scheduling, since it is on main).

**What I cannot see:**
- whether the hosted Auth version fails the same way. Proxy and policy keep me off staging and production.
- **Sharon or the release owner should try one suspended synthetic account on staging** before anything else is promoted.

**Minimum correction, design side only:**
- a suspended or closed account's attempt must answer **exactly what a wrong password answers**, in status, code and wording, whichever password is given;
- the reader's row must then read «Email, username, atau password belum cocok.», as my §3 said it would.

**Likely technical change (Sharon's to decide):** a finite far-future `banned_until` instead of `'infinity'`, or refusing in the route before Auth is asked.

**Red-first test:** `B1-A04` with `UMUM` narrowed to `["MASUK_TIDAK_COCOK"]`, plus a wrong-password attempt on the suspended account. Both fail today.

## 4 · Register after this review

| # | Class | Finding | Change |
|---|---|---|---|
| B1-R1 | register | The refusal says «Admin platform» | «… dan Admin PINTAR.» / «… and by an Admin PINTAR.» (unchanged from my `40e89308` review) |
| B1-R2 | register | «Seluruh platform» does not name each row's school | The school after the name, platform view only |
| B1-R3 | register, optional | The Konfigurasi index does not list the reader | An entry beside «Jejak audit» |
| B1-R4 | B2 (scheduled) | A failed write leaves a gap no reader shows | As in `TINJAUAN-B1-KONSISTENSI.md` §7 |
| **B1-R5** | register | **Two «Hapus saringan»** in the no-match and purged-reference states (Second Eye) | Drop the `Kosong` `aksi` (§2a) |
| S-1 | register, shell (not B1) | **The open drawer is 8 px wider than the screen**: no left gutter, a clipped focus ring, «EN» and «Keluar» cut (Second Eye) | §2b |
| **L-1** | **blocker, account lifecycle (not B1; on main)** | **A suspended or closed account's sign-in answers 503, whatever the password** | §3. Sharon and the owner |

## 5 · The owner's four questions, for this candidate

| Question | Answer |
|---|---|
| **And then what?** | A school admin finds a sign-in, failure, sign-out or print as one row, in plain words. A print reference finds its row. A read failure tells them to try again and keeps their filter |
| **What else did that change?** | The correction is in the database only. The screen, «Jejak audit» and the shell are unchanged. A deletion makes the rows read the PINTAR ID. A suspension makes them read «PINTAR sedang tidak dapat memeriksa», which is L-1 |
| **What happens when things go wrong?** | A read failure: one banner, with nothing invented. A purged reference: its own sentence. **A suspended account trying to sign in: a false outage. That is L-1** |
| **Can this action be reversed, and what survives?** | The reader is read-only, with nothing to reverse. A deletion (L4) is not reversible: the rows survive under the PINTAR ID, without origin or hash. A suspension is reversible (`aktifkan_kembali_akun`); its failed-attempt rows survive with the misleading outcome. If L-1 is fixed, those rows keep the old wording, which is a true record of what the route said at the time |

## Not seen

- **The English rendering** of the reader.
- **A WITA or WIT school's row.**
- **A real network origin.**
- **Real screen readers.**
- **The hosted Auth's behaviour for L-1.**
- **B1-RECHECK-PROMPTS.md**, which is on no branch I can read. I worked from the request's checklist.
