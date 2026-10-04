import "server-only";
import nodemailer from "nodemailer";
import { supabaseService } from "@/lib/supabase/service";
import type { EmailJadi, JenisEmail, KonteksEmail } from "@/lib/email/templat";
import { bacaPengaturanEmail, type PengaturanEmail } from "./pengaturan";
import { GalatEmail, hashAlamat, normalisasiAlamat } from "@/lib/email/alamat";

export { GalatEmail, hashAlamat, normalisasiAlamat };

/**
 * The send log's two calls. In production they are the service-role RPCs; a
 * test may pass the same two SQL functions reached another way, so the rules
 * it proves are the database's own.
 */
export type CatatanKirim = {
  cadang(jenis: JenisEmail, hashPenerima: string): Promise<{ log_id: string; allowed: boolean; limit_scope: string | null }>;
  selesai(logId: string, akhir: "SENT" | "REFUSED_BY_HOST" | "FAILED", kodeSmtp: number | null): Promise<boolean>;
};

export function catatanLayanan(): CatatanKirim {
  const db = supabaseService();
  return {
    async cadang(jenis, hashPenerima) {
      const { data, error } = await db.rpc("email_send_reserve", { p_kind: jenis, p_recipient_hash: hashPenerima });
      if (error || !data?.log_id) throw new GalatEmail("the send log could not reserve this send");
      return data as { log_id: string; allowed: boolean; limit_scope: string | null };
    },
    async selesai(logId, akhir, kodeSmtp) {
      const { error } = await db.rpc("email_send_settle", { p_log_id: logId, p_outcome: akhir, p_smtp_code: kodeSmtp });
      return !error;
    },
  };
}

/**
 * BOB-25 (Gate 2E, D-057(a)): THE ONE SENDING MODULE. Every PINTAR email goes
 * through kirimEmail: the activation code, the resend, recovery, password
 * changed, the PINTAR Digital Card, security notices, and Gate 2E's proof.
 *
 * WHAT IT GUARANTEES:
 *   1. Configuration first (pengaturan.ts). A missing variable or an unsafe
 *      connection throws before anything is counted or sent.
 *   2. The finished email is checked. An empty subject or body, or a subject
 *      with a line break (header injection), throws before anything is sent.
 *   3. The limits decide before the host is reached (email_send_reserve, under
 *      one lock). A refusal is logged and sends nothing.
 *   4. A send the host refuses, for its hourly limit or any SMTP error, or
 *      one that never connects, is logged and reported as NOT SENT. Nothing is
 *      ever reported as sent unless the host accepted it.
 *   5. The log holds the recipient's SHA-256 and the SMTP reply code, never an
 *      address, a code, a PIN, a password or the message (the migration has no
 *      column for one). Nothing here writes the address, the message or the
 *      host's reply text to the console either: a reply can echo the address.
 */

export type HasilKirim =
  | { terkirim: true; rujukan: string }
  | { terkirim: false; alasan: "BATAS_ALAMAT" | "BATAS_UMUM" | "DITOLAK_SERVER" | "GAGAL_KIRIM"; rujukan: string };

export function periksaEmailJadi(email: EmailJadi): void {
  if (typeof email?.subjek !== "string" || email.subjek.trim() === "") throw new GalatEmail("the email has no subject");
  if (/[\r\n]/.test(email.subjek)) throw new GalatEmail("the subject carries a line break");
  if (typeof email.html !== "string" || email.html.trim() === "") throw new GalatEmail("the email has no HTML body");
  if (typeof email.teks !== "string" || email.teks.trim() === "") throw new GalatEmail("the email has no plain-text body");
}

/** The transport for one send. TLS from the first byte on 465, with the certificate checked; plain only to the sink. */
function pengangkut(p: PengaturanEmail) {
  return nodemailer.createTransport({
    host: p.host,
    port: p.port,
    secure: p.jalur === "TLS",
    ignoreTLS: p.jalur === "SINK",
    auth: { user: p.user, pass: p.password },
    tls: p.jalur === "TLS" ? { servername: p.host, rejectUnauthorized: true, minVersion: "TLSv1.2" } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  });
}

function kodeSmtp(nilai: unknown): number | null {
  const n = typeof nilai === "number" ? nilai : typeof nilai === "string" ? Number(nilai.slice(0, 3)) : NaN;
  return Number.isInteger(n) && n >= 200 && n <= 599 ? n : null;
}

export async function kirimEmail(
  {
    ke,
    jenis,
    susun,
  }: {
    ke: string;
    jenis: JenisEmail;
    susun: (konteks: KonteksEmail) => EmailJadi;
  },
  catatan: CatatanKirim = catatanLayanan(),
): Promise<HasilKirim> {
  const p = bacaPengaturanEmail();
  const alamat = normalisasiAlamat(ke);
  const email = susun({ asal: p.asal, staging: p.staging });
  periksaEmailJadi(email);

  const izin = await catatan.cadang(jenis, hashAlamat(alamat));
  const rujukan = String(izin.log_id);
  if (!izin.allowed) {
    return { terkirim: false, alasan: izin.limit_scope === "GLOBAL" ? "BATAS_UMUM" : "BATAS_ALAMAT", rujukan };
  }

  let hasil: HasilKirim;
  let kode: number | null = null;
  let akhir: "SENT" | "REFUSED_BY_HOST" | "FAILED";
  try {
    const info = await pengangkut(p).sendMail({
      from: p.dari,
      replyTo: p.balasKe,
      to: alamat,
      subject: email.subjek,
      text: email.teks,
      html: email.html,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    kode = kodeSmtp(info.response);
    const diterima = ((info.accepted ?? []) as Array<string | { address: string }>).map((a) =>
      String(typeof a === "string" ? a : a.address).toLowerCase());
    if (diterima.includes(alamat) && (info.rejected ?? []).length === 0) {
      akhir = "SENT";
      hasil = { terkirim: true, rujukan };
    } else {
      akhir = "REFUSED_BY_HOST";
      hasil = { terkirim: false, alasan: "DITOLAK_SERVER", rujukan };
    }
  } catch (e) {
    kode = kodeSmtp((e as { responseCode?: unknown }).responseCode);
    akhir = kode === null ? "FAILED" : "REFUSED_BY_HOST";
    hasil = { terkirim: false, alasan: kode === null ? "GAGAL_KIRIM" : "DITOLAK_SERVER", rujukan };
  }

  if (!(await catatan.selesai(rujukan, akhir, kode))) {
    // The send's own outcome stands; only its log row could not be settled.
    console.error("[email] the send log row was not settled", { rujukan, jenis, akhir });
  }
  if (!hasil.terkirim) console.error("[email] not sent", { rujukan, jenis, alasan: hasil.alasan, kode });
  return hasil;
}
