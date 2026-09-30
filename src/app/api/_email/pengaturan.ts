import "server-only";
import { appUrl } from "@/lib/env";

/**
 * BOB-25 (Gate 2E, GATE-0-FACTS §2): THE ONE READER OF PINTAR's SMTP SETTINGS.
 *
 * Exactly four variables configure SMTP, and this file is the only place that
 * names them (F01-S03 pins it). There is no fifth setting and no fallback: a
 * missing variable stops the send with an error (FABLE-01).
 *
 * THE CONNECTION RULE, decided before anything connects:
 *   - port 465 is TLS from the first byte, with the certificate checked
 *     against the host's name;
 *   - a plain connection is allowed only to this machine (127.0.0.1,
 *     localhost, ::1): the Mailpit sink in CI and local runs;
 *   - anything else is refused. There is no STARTTLS switch to get wrong.
 *
 * FROM AND REPLY-TO ARE FIXED HERE, not configured. FROM is the SMTP user, so
 * the two cannot diverge; its name is «Tim PINTAR» on production's origin and
 * «Tim PINTAR (Staging)» on every other, so no other environment can look like
 * production. Reply-To is info@pintarselalu.com (M4).
 */

export const ASAL_PRODUKSI = "https://app.pintarselalu.com";
export const BALAS_KE = "info@pintarselalu.com";
export const NAMA_PENGIRIM = "Tim PINTAR";
export const NAMA_PENGIRIM_UJI = "Tim PINTAR (Staging)";
const MESIN_INI = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

export type KodeGalatPengaturan = "VARIABEL_HILANG" | "NILAI_TIDAK_SAH" | "KONEKSI_TIDAK_AMAN";

/** A configuration error. It names the variable (`variabel`, and in its message), never a value. */
export class GalatPengaturanEmail extends Error {
  readonly variabel: string;
  constructor(readonly kode: KodeGalatPengaturan, pesan: string) {
    super(pesan);
    this.name = "GalatPengaturanEmail";
    this.variabel = /^(PINTAR_SMTP_[A-Z]+|NEXT_PUBLIC_APP_URL)\b/.exec(pesan)?.[1] ?? "";
  }
}

export type PengaturanEmail = {
  host: string;
  port: number;
  user: string;
  password: string;
  /** TLS from the first byte, or the local sink's plain connection */
  jalur: "TLS" | "SINK";
  /** the app's origin, without a trailing slash */
  asal: string;
  /** every origin but production's */
  staging: boolean;
  dari: { name: string; address: string };
  balasKe: string;
};

type Lingkungan = Record<string, string | undefined>;

function wajib(env: Lingkungan, nama: string): string {
  const v = env[nama];
  if (v === undefined || v.trim() === "") {
    throw new GalatPengaturanEmail("VARIABEL_HILANG", `${nama} is not set`);
  }
  return v.trim();
}

/**
 * Reads and checks the four variables and the app's origin. `env` is for the
 * tests; the module passes nothing and reads the process's own.
 */
export function bacaPengaturanEmail(env: Lingkungan = process.env, asalApp?: string): PengaturanEmail {
  const host = wajib(env, "PINTAR_SMTP_HOST").toLowerCase();
  const portTeks = wajib(env, "PINTAR_SMTP_PORT");
  const user = wajib(env, "PINTAR_SMTP_USER");
  // The password is read, never trimmed, never echoed, never part of a message.
  const password = env.PINTAR_SMTP_PASSWORD;
  if (password === undefined || password === "") {
    throw new GalatPengaturanEmail("VARIABEL_HILANG", "PINTAR_SMTP_PASSWORD is not set");
  }

  if (!/^\d{1,5}$/.test(portTeks) || Number(portTeks) < 1 || Number(portTeks) > 65535) {
    throw new GalatPengaturanEmail("NILAI_TIDAK_SAH", "PINTAR_SMTP_PORT is not a port number");
  }
  const port = Number(portTeks);
  if (!/^[a-z0-9.-]+$/.test(host) && host !== "::1" && host !== "[::1]") {
    throw new GalatPengaturanEmail("NILAI_TIDAK_SAH", "PINTAR_SMTP_HOST is not a host name");
  }
  if (!/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(user)) {
    throw new GalatPengaturanEmail("NILAI_TIDAK_SAH", "PINTAR_SMTP_USER is not an email address");
  }

  let jalur: PengaturanEmail["jalur"];
  if (port === 465) jalur = "TLS";
  else if (MESIN_INI.has(host)) jalur = "SINK";
  else {
    throw new GalatPengaturanEmail(
      "KONEKSI_TIDAK_AMAN",
      "PINTAR_SMTP_HOST is not this machine and PINTAR_SMTP_PORT is not 465: an unencrypted connection is refused",
    );
  }

  let asal: string;
  try {
    const u = new URL(asalApp ?? appUrl());
    asal = u.origin;
    if (u.protocol !== "https:" && !MESIN_INI.has(u.hostname)) throw new Error("not https");
  } catch {
    throw new GalatPengaturanEmail("NILAI_TIDAK_SAH", "NEXT_PUBLIC_APP_URL is not an https origin");
  }
  const staging = asal !== ASAL_PRODUKSI;

  return {
    host,
    port,
    user,
    password,
    jalur,
    asal,
    staging,
    dari: { name: staging ? NAMA_PENGIRIM_UJI : NAMA_PENGIRIM, address: user },
    balasKe: BALAS_KE,
  };
}
