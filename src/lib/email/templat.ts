/**
 * BOB-25 (Gate 2E, D-057(a)): THE TEMPLATE-RENDERING INTERFACE.
 *
 * This is the contract between PINTAR's email templates (Daisy's frame, DAISY-19,
 * and each email's content, DAISY-20 to DAISY-24) and the one sending module
 * (`src/app/api/_email/`). It holds types only, so a template can import it from
 * anywhere without reaching a secret, and it is published before the sending
 * module so the frame can be wired against it.
 *
 * THE SHAPE. A template is a pure function: its own data and the environment's
 * context in, a finished email out.
 *
 *     const templat: Templat<{ kode: string }> = (data, konteks) => ({ subjek, html, teks });
 *
 * The frame's `bingkaiEmail()` already returns `{ subjek, html, teks }`, so it is
 * the template's last step.
 *
 * WHAT THE TEMPLATE DOES NOT DO. It never chooses FROM, Reply-To or the
 * recipient, never reads configuration and never sends. The sending module
 * sets FROM from the SMTP user («Tim PINTAR», or «Tim PINTAR (Staging)» on every
 * origin but production's), sets Reply-To to info@pintarselalu.com, and supplies
 * `konteks` (GATE-0-FACTS §2).
 *
 * WHAT A FINISHED EMAIL MUST BE. The module refuses to send an email whose
 * `subjek` is empty or carries a line break (header injection), or whose `html`
 * or `teks` is empty. It sends both parts, as multipart/alternative.
 */

/**
 * The seven emails the module sends. The first six are D-057(a)'s; each gate
 * that sends one supplies its template and data shape (DAISY-20 to DAISY-24).
 * UJI_PENGIRIMAN is Gate 2E's own deliverability proof, sent only by a
 * platform admin.
 */
export type JenisEmail =
  | "KODE_AKTIVASI"
  | "KODE_ULANG"
  | "PEMULIHAN_PASSWORD"
  | "PASSWORD_DIUBAH"
  | "KARTU_DIGITAL"
  | "PEMBERITAHUAN_KEAMANAN"
  | "UJI_PENGIRIMAN";

export const JENIS_EMAIL: readonly JenisEmail[] = [
  "KODE_AKTIVASI",
  "KODE_ULANG",
  "PEMULIHAN_PASSWORD",
  "PASSWORD_DIUBAH",
  "KARTU_DIGITAL",
  "PEMBERITAHUAN_KEAMANAN",
  "UJI_PENGIRIMAN",
];

/** What the environment tells a template. The sending module fills it; a template never reads configuration. */
export type KonteksEmail = {
  /**
   * The app's own origin, e.g. "https://staging.pintarselalu.com", with no
   * trailing slash. Absolute links and each environment's own email logo are
   * built from it (DAISY-19 ruling 2): `${konteks.asal}/brand/...`.
   */
  readonly asal: string;
  /**
   * True on every origin except production's (https://app.pintarselalu.com).
   * The template then carries the slim test line in the body (DAISY-19
   * ruling 3); the module has already set the «(Staging)» sender name.
   */
  readonly staging: boolean;
};

/** A finished email: the subject line and both bodies. Exactly what the frame's `bingkaiEmail()` returns. */
export type EmailJadi = {
  subjek: string;
  html: string;
  teks: string;
};

/** A template: its data and the environment's context in, a finished email out. Pure; never sends. */
export type Templat<D> = (data: D, konteks: KonteksEmail) => EmailJadi;
