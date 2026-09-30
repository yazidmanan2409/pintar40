# BOB-25 contract: PINTAR's email path (Gate 2E)

Published 30 Sep, ahead of the build, so DAISY-19 can wire the frame against it. **The template interface below is fixed.** The sending module is built as described here (`48f791a`), confirmed in `HANDOFF-BOB-25.md`.

## 1. The template interface (for Daisy): `src/lib/email/templat.ts`

The file holds types only, with no secret and no `server-only`, so `src/components/email/` can import it.

```ts
export type JenisEmail =
  | "KODE_AKTIVASI" | "KODE_ULANG" | "PEMULIHAN_PASSWORD" | "PASSWORD_DIUBAH"
  | "KARTU_DIGITAL" | "PEMBERITAHUAN_KEAMANAN" | "UJI_PENGIRIMAN";

export type KonteksEmail = {
  readonly asal: string;     // the app's origin, no trailing slash, e.g. "https://staging.pintarselalu.com"
  readonly staging: boolean; // true on every origin except https://app.pintarselalu.com
};

export type EmailJadi = { subjek: string; html: string; teks: string };

export type Templat<D> = (data: D, konteks: KonteksEmail) => EmailJadi;
```

**How the frame fits.**
- `bingkaiEmail(email)` already returns `{ subjek, html, teks }`, so a template is the email's own blocks plus one call to the frame:

  ```ts
  export const templatKodeAktivasi: Templat<{ kode: string }> = (data, konteks) =>
    bingkaiEmail({ subjek: …, pratinjau: …, judul: …, isi: [ { jenis: "kode", label: …, kode: data.kode } ],
                   logo: `${konteks.asal}/brand/<your email logo>`, staging: konteks.staging });   // the frame gains `staging`
  ```
- **The logo** (ruling 2): build it from `konteks.asal`, so each environment loads its own.
- **The test line** (ruling 3): show it when `konteks.staging` is true.
- **Per-email data shapes** (`{ kode }` and so on) belong to each email's gate (DAISY-20 to DAISY-24 with BOB-26 to BOB-28). The interface does not fix them.

**What a template never does:**
- choose FROM, Reply-To or the recipient;
- read configuration or `process.env`;
- send.

**What the module refuses** (the send does not happen, and the caller gets an error):
- an empty `subjek`, or one with a line break (header injection);
- an empty `html` or `teks`.

Both parts go out as `multipart/alternative`.

**`UJI_PENGIRIMAN`** is Gate 2E's own deliverability proof: one send by a platform admin (§4). Until the frame is wired it uses a plain placeholder template in the sending module. Once the frame is in `src/components/email/`, Daisy may give it the frame too, and that is the M6 render.

## 2. The sending module (for BOB-26 to BOB-28): `src/app/api/_email/`

It is a private folder, so it is not a route. It lives under `src/app/api/` because it writes the send log with the service-role client, which F01-S03 allows only there. Every file is `server-only`.

```ts
kirimEmail({ ke, jenis, susun }: {
  ke: string;                                        // one address
  jenis: JenisEmail;
  susun: (konteks: KonteksEmail) => EmailJadi;       // usually (k) => templatX(data, k)
}, catatan?: CatatanKirim): Promise<HasilKirim>      // catatan: the send log; production omits it (the service-role RPCs), a test passes the same SQL functions another way

type HasilKirim =
  | { terkirim: true;  rujukan: string }                                   // the send log row
  | { terkirim: false; alasan: "BATAS_ALAMAT" | "BATAS_UMUM" | "DITOLAK_SERVER" | "GAGAL_KIRIM"; rujukan: string };
```

- **A send the host refuses is reported as not sent, never as sent.** That covers an SMTP error, the hourly limit, a timeout or no connection. The caller shows «not sent, try again later». The attempt counts toward the limits, and once their window passes, asking again works.
- **A configuration error throws before anything is counted or sent.** That is a missing variable, or an unencrypted connection to a host that is not local (FABLE-01: no fallbacks).
- **Code issuing** (part 5): `terbitkanKodeEmail(authUserId)` in `src/app/api/_email/kode.ts` returns `{ email, kode }`.
  - It calls admin `generate_link` for an **existing** Auth user, found by id, so it can never create one, and returns its `email_otp`.
  - Nothing logs or stores the code. `verifyOtp` checks it (Gate 3).

## 3. Configuration (GATE-0-FACTS §2)

- **The variables:** exactly `PINTAR_SMTP_HOST`, `PINTAR_SMTP_PORT`, `PINTAR_SMTP_USER` and `PINTAR_SMTP_PASSWORD`, plus the existing `NEXT_PUBLIC_APP_URL` for the origin.
  - They are read in one file, `src/app/api/_email/pengaturan.ts`, which F01-S03 pins.
  - None has a fallback.
- **The connection:**
  - Port 465 is TLS from the first byte, with the certificate checked.
  - A plain connection is allowed only to `127.0.0.1`, `localhost` or `::1`: the sink.
  - Anything else is refused before connecting.
- **The sender:**
  - FROM is `PINTAR_SMTP_USER`, as «Tim PINTAR», or «Tim PINTAR (Staging)» on every origin except `https://app.pintarselalu.com`.
  - Reply-To is `info@pintarselalu.com`.
- **The sink:** CI and local sends go to Mailpit on `127.0.0.1:54325` (SMTP), with its API on `:54324`.

## 4. The send log and the limits (migration, service role only)

- **The send log:** `email_send_log` keeps the kind, the recipient's SHA-256 (of the trimmed, lower-cased address), the outcome, the SMTP reply code and the times.
  - It never stores an address, a code, a PIN, a password or the message.
  - RLS is on with no policy, and there is no client grant.
- **The limits** are rows in `email_send_limits`, so a change is a reviewed migration. The proposed values, for the gate to confirm:
  - **per address and kind:** 1 per 60 s (the resend countdown);
  - **per address:** 6 per hour;
  - **global:** 200 per hour, for all of PINTAR's sends.
  - A refusal by the limits is logged and sends nothing.
- **The staging proof:** `POST /api/email/uji` with `{ "ke": "<inbox>" }`.
  - It needs a signed-in platform admin and a same-origin request, and it goes through the limits and the log.
  - It sends one `UJI_PENGIRIMAN` email.
  - Yazid triggers it once on staging after the merge. The hand-off gives the one-line call.
