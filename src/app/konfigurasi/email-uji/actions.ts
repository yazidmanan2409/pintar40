"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { GalatEmail, hashAlamat, normalisasiAlamat } from "@/lib/email/alamat";

/**
 * J1.9 (D-098(c)): «WHAT HAPPENED TO THIS EMAIL?», for the platform admin.
 *
 * The admin types an address or a send's reference. An address is hashed here,
 * on the server, exactly as the sending module hashes it, and only the hash is
 * asked about: the send log holds no address, and nothing here writes the
 * typed address anywhere. email_send_history refuses anyone but the platform
 * admin itself (42501), so this action decides nothing about access.
 */
export type BarisRiwayat = {
  id: string;
  jenis: string;
  diminta: string;
  hasil: "PENDING" | "SENT" | "REFUSED_LIMIT" | "REFUSED_BY_HOST" | "FAILED";
  batas: "ADDRESS_KIND" | "ADDRESS" | "GLOBAL" | null;
  kodeSmtp: number | null;
};
export type HasilRiwayat =
  | { k: "isian" }
  | { k: "ditolak" }
  | { k: "gagal" }
  | { k: "kosong" }
  | { k: "ada"; baris: BarisRiwayat[] };

const RUJUKAN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HASIL = new Set(["PENDING", "SENT", "REFUSED_LIMIT", "REFUSED_BY_HOST", "FAILED"]);
const BATAS = new Set(["ADDRESS_KIND", "ADDRESS", "GLOBAL"]);

export async function cariRiwayatEmail(_: HasilRiwayat | null, fd: FormData): Promise<HasilRiwayat> {
  const isian = String(fd.get("cari") ?? "").trim();
  let arg: { p_log_id: string } | { p_recipient_hash: string };
  if (RUJUKAN.test(isian)) {
    arg = { p_log_id: isian.toLowerCase() };
  } else {
    try {
      arg = { p_recipient_hash: hashAlamat(normalisasiAlamat(isian)) };
    } catch (e) {
      if (e instanceof GalatEmail) return { k: "isian" };
      throw e;
    }
  }
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("email_send_history", arg);
  if (error) return error.code === "42501" ? { k: "ditolak" } : { k: "gagal" };
  const baris: BarisRiwayat[] = (Array.isArray(data) ? data : [])
    .filter((r) => HASIL.has(String(r.outcome)))
    .map((r) => ({
      id: String(r.id),
      jenis: String(r.kind),
      diminta: String(r.requested_at),
      hasil: String(r.outcome) as BarisRiwayat["hasil"],
      batas: BATAS.has(String(r.limit_scope)) ? (String(r.limit_scope) as BarisRiwayat["batas"]) : null,
      kodeSmtp: typeof r.smtp_code === "number" ? r.smtp_code : null,
    }));
  return baris.length ? { k: "ada", baris } : { k: "kosong" };
}
