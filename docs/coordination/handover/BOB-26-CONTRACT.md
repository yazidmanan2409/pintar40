READY FOR REVIEW: BOB-26 contract (for DAISY-20)

# BOB-26 contract: activation and password sign-in (Gate 3, server)

Published **before the build**, so DAISY-20 can start. The paths, fields, codes and data shapes below are what the server will answer. If the build has to change one, it is changed here first and the hand-off names it. **The pages, copy and email content are Daisy's.** Bob supplies the routes, the data and the send, never markup or copy (D-079(a)).

**Changed during the build (named here first):** the code check's door is `/aktifkan/periksa`, not `/aktifkan/verifikasi`. INV-38 keeps the word *verifikasi* for the one certificate verification route (F04-S01).

Sources: `auth/IDENTITY-4.0.md` (C1, C3, C9, C10, C13, C14, C17), D-054, D-057(d), D-077, D-079 and its addendum, the BOB-26 row, and BOB-24 and BOB-25 as merged (`7727c8e`).

## 0. The rules every route keeps

- **Always JSON, always `no-store`.** A failure is `{ ok: false, code, ...extra }` with the HTTP status given below. There is never a message and never a provider word. `ref` is a support reference, given only when the server failed.
- **POST only, from PINTAR's own pages.** Same origin is checked exactly as the card route checks it (`asalSendiri`: `Sec-Fetch-Site` and `Origin`). A foreign page gets `403 PERMINTAAN_DITOLAK`. Every request body is **form data** (`FormData`), like `/masuk/kartu`.
- **Nothing reveals who has an account.** Every answer to a signed-out request is the same for an address or username that exists and one that does not, in body, status and timing (C1, C3, D2).
- **Codes, PINs and passwords are never logged, echoed or returned.**
- The typed contract ships as **`src/lib/aktivasi-kontrak.ts`**: the code unions, HTTP statuses, response types and a reader for each answer, as `src/lib/kartu-kontrak.ts` does for the card. Import from there, never restate a code.

## 1. The paths

| Path | Who | What | Notes |
|---|---|---|---|
| `/aktifkan` | page (**Daisy**) | «Aktifkan akun PINTAR Anda». Signed out: email → code. Signed in with set-up REQUIRED: the wizard. | A **public path** in the proxy, because it starts signed out. The page decides by its own session read (`GET /api/aktifkan/keadaan`). |
| `POST /aktifkan/kode` | signed out | Ask for a code | Public door, rewritten to `/api/aktifkan/kode` (the card route's pattern) |
| `POST /aktifkan/periksa` | signed out | Type the code; a match signs in | Public door, rewritten to `/api/aktifkan/periksa` |
| `POST /masuk/password` | signed out | Sign in with email **or** username, and password | Public door, rewritten to `/api/masuk/password` |
| `GET /api/aktifkan/keadaan` | signed in | Where the wizard stands | |
| `POST /api/aktifkan/username` | signed in, REQUIRED | Claim the username | |
| `POST /api/aktifkan/password` | signed in, REQUIRED | Set the password | |
| `POST /api/aktifkan/pin` | signed in, REQUIRED | Set the personal PIN | |
| `POST /api/aktifkan/nama` | signed in, REQUIRED | «Sudah benar», or «Ubah nama» then «Sudah benar» (D-077) | |
| `POST /api/aktifkan/selesai` | signed in, REQUIRED | Finish; the card email goes | |
| `GET /api/akun/kartu` | signed in, staff | The card's data (Akun saya, the welcome screen) | |
| `POST /api/akun/kartu/kirim` | signed in, staff | Send the card email again | D-079: a card the limits refused waits here |

**The hold (proxy).** A signed-in email account whose set-up is REQUIRED is held to the wizard:
- every page redirects to `/aktifkan`;
- every `/api/` route but `/api/aktifkan/*` answers `403 { error: "setup_required" }`;
- `/aktifkan`, `/keluar` and the public paths stay open.

Class cards and evaluation personas are never held, since they have no set-up (C13). Once COMPLETE, the person goes to their D-010 home.

**Deploy note for the coordinator.** The hold ships with BOB-26. `/aktifkan` is DAISY-20's page. A staging with BOB-26 but not DAISY-20 would hold its staff at a page that does not exist yet. So the two should reach staging together, or DAISY-20 first.

## 2. Signed out

### 2.1 `POST /aktifkan/kode`: ask for a code

Fields:
- `email`;
- `ulang`, `"1"` when this is the resend (the email kind becomes KODE_ULANG).

| Status | Body | When |
|---|---|---|
| 200 | `{ ok: true, kirimUlangDalam: 60, berlakuMenit: 10 }` | **Every well-formed address**, whether or not it has an account, whether or not a code went |
| 400 | `EMAIL_TIDAK_SAH` | Not shaped like an address (shape only, no lookup) |
| 403 | `PERMINTAAN_DITOLAK` | Not from PINTAR's own page |
| 503 | `LAYANAN_TIDAK_TERSEDIA` + `ref` | The server could not be asked at all (not address-dependent) |

- **Who gets a code (C1):** only an existing EMAIL account whose set-up is REQUIRED and which is not an evaluation persona. Any other address gets the same 200 and nothing is sent. No Auth user is ever created (`disable_signup` and the fail-closed `handle_new_auth_user` stay).
- **Timing:** the lookup is the same for every address. The code is issued and sent **after the answer has gone** (Next's `after()`), so the answer never waits on the send.
- **`kirimUlangDalam`:** the resend countdown in seconds (C3, D-057(d)). It is the same number for every address, and it is the address-and-kind limit of BOB-25's send log (1 per 60 s), read from `email_send_limits`, not typed in. The screen shows it only on the code screen.
- **`berlakuMenit`:** how long the code is valid. It is read from the **one canonical setting** (§5), the same one that sets Auth's `mailer_otp_exp`. The screen may say «berlaku selama 10 menit» from it; never type the number.
- **When the send is refused** (a limit, or the host), the answer is still the same 200. That is the D2 fold: the answer says what the screen always says («jika alamat ini terdaftar…»). It never says "sent" for this address in particular, and it can never separate a real address from an unknown one.

### 2.2 `POST /aktifkan/periksa`: type the code

Fields: `email` and `kode`.
- The code is digits only on the server: «482 913», «482913», and «482-913» pasted, are the same.
- Its length is the canonical `mailer_otp_length` (6).

| Status | Body | When |
|---|---|---|
| 200 | `{ ok: true, tujuan: "/aktifkan" }` + session cookies | The code matches; the email account is signed in, with an email account's lifetime (D-009) |
| 400 | `KODE_TIDAK_COCOK` | Wrong, expired, already used, or no such account: **one code for all** |
| 429 | `KODE_TUNGGU` + `tunggu` (seconds) + `Retry-After` | Too many tries for this address (5 free in 15 min, then 30 s doubling to 5 min; BOB-24's counter, keyed by the address's HMAC whether or not it exists) |
| 429 | `KODE_DIBATASI` (+ `tunggu` when Auth gave one) | Auth's own limit. The attempt is taken back |
| 403 / 503 | `PERMINTAAN_DITOLAK` / `LAYANAN_TIDAK_TERSEDIA` + `ref` | As above |

`tujuan` is `/aktifkan` while set-up is REQUIRED, else the D-010 home.

### 2.3 `POST /masuk/password`: sign in

Fields:
- `identitas`: an email address or a username, trimmed and lowercased. Anything with `@` is an address; anything else is a username;
- `password`;
- `lanjut`: the destination, as `/masuk` has it.

| Status | Body | When |
|---|---|---|
| 200 | `{ ok: true, tujuan }` + session cookies | Signed in. `tujuan` is `/aktifkan` while REQUIRED, else `lanjut` narrowed (L-1) or the D-010 home |
| 401 | `MASUK_TIDAK_COCOK` | Wrong password, unknown email or username, an account with no password yet, a class card's address, or a persona: **one code for all** |
| 429 | `MASUK_TUNGGU` + `tunggu` + `Retry-After` | Per-account backoff (5 free in 15 min, then 30 s doubling to 5 min), counted under the account when the name resolves and under the typed name when it does not, so the two cannot be told apart |
| 429 | `MASUK_DIBATASI` (+ `tunggu`) | Auth's own limit. The attempt is taken back |
| 403 / 503 | `PERMINTAAN_DITOLAK` / `LAYANAN_TIDAK_TERSEDIA` + `ref` | As above |

- **Similar timing:** every failure is answered no sooner than a fixed floor, so an unknown name and a wrong password take the same time. The test measures it.
- **The username is resolved on the server only** (C9). No route answers "does this username exist". The wizard's claim answers USERNAME_TAKEN only to a signed-in person choosing their own.
- **Class cards keep `/masuk/kartu`, unchanged.**
- **The magic link** stays on `/masuk` as a fallback behind one switch, `TAUTAN_MASUK_CADANGAN` in `src/lib/aktivasi-kontrak.ts` (on). C14 turns it off in the release where activation, password sign-in, email recovery and the transition all work. When it is off, `sendMagicLink` sends nothing.

## 3. Signed in: the wizard

Every wizard POST answers these, as well as its own codes:

| Status | Body | When |
|---|---|---|
| 401 | `BELUM_MASUK` | No session |
| 403 | `TIDAK_BERLAKU` | A class card or an evaluation persona (C13) |
| 409 | `SETUP_SUDAH_SELESAI` | Set-up is already COMPLETE: the wizard is over |
| 403 / 503 | `PERMINTAAN_DITOLAK` / `LAYANAN_TIDAK_TERSEDIA` + `ref` | As above |

### 3.1 `GET /api/aktifkan/keadaan`

```ts
type KeadaanAktivasi = {
  ok: true;
  keadaan: "REQUIRED" | "COMPLETE" | "NOT_APPLICABLE";
  berikutnya: "USERNAME" | "PASSWORD" | "PIN" | "NAMA" | "SELESAI" | null;  // null once COMPLETE
  langkah: {
    username: string | null;       // claimed, canonical lowercase
    password: boolean;             // set through the wizard
    pin: boolean;
    nama: { nama: string; dikonfirmasi: boolean };
  };
  staf: boolean;                   // has an active staff role; false for a learner-only email account (C17)
  pintarId: string | null;         // "A14CD7ST", only when staf; display it 4+4
  aturanPassword: AturanPassword;  // §5, for the rules the screen shows
  berlakuMenit: number;            // §5
};
```

- **The order is the journey's** (D-054(b), D-077): username → password → PIN → name → PINTAR ID and card. `berikutnya` is the first step not yet done.
- The server does not force the order. It forces only that «selesai» needs all four.
- **C17:** a learner-only email account (`staf: false`) gets no PINTAR ID in this answer and no card. The page must not show either.

### 3.2 `POST /api/aktifkan/username`

Field: `username`.

| Status | Body |
|---|---|
| 200 | `{ ok: true, username }` (canonical) |
| 422 | one of `USERNAME_LENGTH`, `USERNAME_CHARACTERS`, `USERNAME_START`, `USERNAME_EMAIL_SHAPE`, `USERNAME_ID_SHAPE`, `USERNAME_NUMBER`, `USERNAME_RESERVED` |
| 409 | `USERNAME_TAKEN`, `USERNAME_ALREADY_SET` |

These are BOB-24's C9 rules and codes, unchanged. There is no rename afterwards.

### 3.3 `POST /api/aktifkan/password`

Field: `password`. The confirmation field is the page's; the server takes one value.

| Status | Body |
|---|---|
| 200 | `{ ok: true }` |
| 422 | `PASSWORD_LEMAH` + `alasan: ("PANJANG" \| "BOCOR" \| "KARAKTER")[]`: too short, found in a known leak (when the check is on), or missing a required character kind (none required at present) |
| 422 | `PASSWORD_TERLALU_PANJANG` (over 72 bytes, the hash's limit) |

- The rules are checked on the server against §5, then by Auth itself.
- It may be sent again while set-up is REQUIRED; the newest password wins.
- **The password is written only by this route** (and, from Gate 4 and 5, the recovery routes), through a single-use permission the database checks at the moment the hash changes. **A signed-in session alone cannot set or change a password** (the Gate 0 finding). Auth's direct password change is refused by the database, not only by a setting.

### 3.4 `POST /api/aktifkan/pin`

Field: `pin`.

| Status | Body |
|---|---|
| 200 | `{ ok: true }` |
| 422 | `PIN_FORMAT`, `PIN_REPEATED`, `PIN_SEQUENCE`, `PIN_PATTERN`, `PIN_KEYPAD`, `PIN_YEAR`, `PIN_COMMON` |
| 409 | `PIN_ALREADY_SET`, `PIN_REUSED` |

These are BOB-24's blocklist and codes, unchanged. The confirmation field is the page's.

### 3.5 `POST /api/aktifkan/nama` (D-077)

Field: `nama`, **absent** for «Sudah benar» with the name as it is; present for «Ubah nama» then «Sudah benar».

| Status | Body |
|---|---|
| 200 | `{ ok: true, nama, diubah: boolean }` |
| 422 | `NAMA_TIDAK_SAH`: empty, over 200 characters, or containing a control character. Spaces are trimmed and runs of spaces become one |
| 409 | `NAMA_SUDAH_DIKONFIRMASI`: this once is used |

- **One confirmation, once.** A correction and a confirmation are both audited: `identity.name_corrected_at_activation` records the old name, the new name, who and when; `identity.name_confirmed` records the confirmation.
- **After it, self-editing is over.** The only later path is the platform admin's audited correction (`correct_person_name`, §6).
- **Before BOB-26, any signed-in person could change their own name directly in the database.** That grant is revoked (§6).

### 3.6 `POST /api/aktifkan/selesai`

No fields.

| Status | Body |
|---|---|
| 200 | `{ ok: true, tujuan, kartu: "TERKIRIM" \| "BELUM_TERKIRIM" \| "TIDAK_ADA" }` |
| 409 | `SETUP_BELUM_LENGKAP` + `kurang: ("USERNAME" \| "PASSWORD" \| "PIN" \| "NAMA")[]` |

- Set-up becomes COMPLETE (audited), and the hold lifts at once.
- `tujuan` is the D-010 home. The page shows «Selamat datang di PINTAR» (name, PINTAR ID, QR, «Masuk ke PINTAR») from `GET /api/akun/kartu`, and «Masuk ke PINTAR» goes to `tujuan`.
- **The card email goes to staff only** (C17):
  - `TERKIRIM`: it went;
  - `BELUM_TERKIRIM`: the limits or the host refused it. The set-up is still complete, and the card waits in Akun saya, to be sent again with §4 (D-079);
  - `TIDAK_ADA`: a learner-only account, which has no card in 4.0.

## 4. Akun saya

### `GET /api/akun/kartu`

```ts
type DataKartu = {
  nama: string;                 // the CURRENT canonical name (D-077(6))
  pintarId: string;             // "A14CD7ST"; display 4+4
  tautanId: string;             // `${origin}/id/${pintarId}`: what the QR encodes (§5 of the spec; the page itself is Gate 5)
  konteks: { peran: "SYSTEM_ADMIN" | "INSTITUTION_ADMIN" | "DEAN" | "HEAD_OF_DEPARTMENT" | "EDUCATOR"; institusi: string | null }[];
};
```

- `konteks` is read at render time from current role assignments (D-059). It is a statement, never authority, and nothing is stored in the identity.
- `institusi` is null for the platform role.
- Answers `403 TIDAK_BERLAKU` for anyone who is not staff (students, cards, personas; C17).

### `POST /api/akun/kartu/kirim`

- 200 `{ ok: true, kartu: "TERKIRIM" | "BELUM_TERKIRIM" }`. `BELUM_TERKIRIM` carries `tunggu` when the limit said when.
- 403 `TIDAK_BERLAKU` for anyone who is not staff.
- It is BOB-25's send, counted under its limits like any other.

## 5. The emails and the one canonical setting

**Templates (Daisy's; D-079).** Two new data shapes in `src/lib/email/identitas.ts`, each rendered by a `Templat<D>` from `src/lib/email/templat.ts`:

```ts
type DataEmailKode = { kode: string; berlakuMenit: number; nama: string };   // KODE_AKTIVASI and KODE_ULANG
type DataEmailKartu = DataKartu & { tautanAkun: string };                    // KARTU_DIGITAL: `${origin}/akun`
```

- `kode` arrives as issued (6 digits). The template spaces it for reading («482 913»), as the frame's code block does.
- `berlakuMenit` is **the canonical value**, never a number in the template.
- **Until DAISY-20's templates exist,** the server renders these through **DAISY-19's accepted frame** (`bingkaiEmail`, copied unchanged to `src/lib/email/bingkai.ts` from `docs/coordination/ux/email-frame/bingkai.mts`), with the frame's own sample wording for the code email and the fewest words the card email needs.
  - Those words are placeholders for Daisy to replace; the hand-off lists them.
  - DAISY-20 replaces `src/lib/email/templat-identitas.ts` (the two templates) and may move the frame when she wires DAISY-19. Nothing else imports them.

**The one canonical setting (D-079 addendum): `supabase/auth-identitas.json`.** One file holds Gate 3's Auth settings: code length and validity (`mailer_otp_length` 6, `mailer_otp_exp` 600), the password policy, the leaked-password check, the direct-change safeguards, and TOTP enrolment off. From it:
- the app reads `berlakuMenit` (`mailer_otp_exp / 60`) and `aturanPassword` (`src/lib/pengaturan-auth.ts`);
- the settings workflow (`staging.yml`) writes exactly those keys to staging, then reads them back and asserts them;
- `identity-facts.yml` reads staging and **fails if the deployed value differs**. Production is compared too, and fails on drift once the release has applied them (the file says so);
- `supabase/config.toml` (the local and CI stack) carries the same values, and a static test fails if they drift.

Change the canonical value and the email's «berlaku selama N menit» changes with it. That is tested.

```ts
type AturanPassword = { panjangMin: number; karakterWajib: ("HURUF_KECIL" | "HURUF_BESAR" | "ANGKA" | "SIMBOL")[]; cekBocor: boolean; panjangMaks: 72 };
```

The Gate 3 password policy proposed here is **minimum 8 characters, no required character kinds, and the leaked-password check on** (NIST SP 800-63B's shape). **FOR YAZID:** the Gate 0 facts left the Gate 3 policy unset. This is one value in the canonical file; changing it changes the server, the screen's rules and the staging setting together.

## 6. The database (for completeness; Daisy needs none of it directly)

- **D-077(2):** `update (display_name)` on `persons` is revoked from `authenticated` (`20260912004431:307`), and F01-T17 is restated in the same change. `photo_path` is unchanged.
- **D-077(3):** `correct_person_name(p_person, p_name, p_reason)`, for the platform admin only, audited (`identity.name_corrected`: from, to, reason). Everyone else gets 42501, and a school admin cannot change a name shared across schools. There is no page for it in BOB-26; it is an RPC, as `correct_username` is.
- **D-077(4), the student import list (DAISY-20 (3)):** `import_preview` returns counts only. A new paged read, `import_preview_names(p_job, p_after, p_limit)`, returns `{ baris, nama, peran, baru }[]` for every row. It is under the same authority as `import_preview` (the job's school admin), so the complete list can be reviewed before the one confirmation. The copy must not say student names appear on a card (C17).
- `complete_my_setup` now needs the password and the name confirmation as well as the username and the PIN. F16-S01 is restated for it.

## 7. D-060

This contract changes no metric's catalogue and no engine. The build's hand-off states it again.
