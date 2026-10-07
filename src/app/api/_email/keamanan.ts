import "server-only";
import { supabaseService } from "@/lib/supabase/service";
import { HALAMAN_PEMULIHAN } from "@/lib/aktivasi-kontrak";
import type { PeristiwaKeamanan } from "@/lib/email/identitas";
import { templatKeamanan } from "@/components/email/keamanan";
import { appUrl } from "@/lib/env";
import { kirimEmail, normalisasiAlamat } from "./kirim";
import { PENERIMA_KEAMANAN } from "./pengaturan";

/**
 * BOB-28 (C7): A SECURITY OR RECOVERY EVENT IS TOLD TO THE ACCOUNT'S OWNER AND
 * TO THE PLATFORM ADMIN, through BOB-25's one module. Each is its own send, so
 * a refusal of one never stops the other; a notice counts only under the
 * GLOBAL limit (the migration's email_send_reserve), so other email to the
 * same address can never silence it. Called only for an ID that is a
 * person's, at a threshold or a recovery, after the answer has gone.
 *
 * CR-13 (D-120 QN1): an email corrected after activation is told to both the
 * old and the new address. Auth already holds the new one (the owner's); the
 * old one, given here, is told in the owner's voice too.
 */
export async function kirimPemberitahuanKeamanan(peristiwa: PeristiwaKeamanan, pintarId: string, pemilik: string | null,
  alamatLama: string | null = null): Promise<void> {
  const waktu = new Date().toISOString();
  const tautanLupa = `${appUrl()}${HALAMAN_PEMULIHAN}`;
  const kirim = async (ke: string, untuk: "PEMILIK" | "ADMIN") => {
    const h = await kirimEmail({
      ke,
      jenis: "PEMBERITAHUAN_KEAMANAN",
      susun: (k) => templatKeamanan({ peristiwa, untuk, pintarId, waktu, tautanLupa }, k),
    });
    if (!h.terkirim) console.error(`[keamanan] ref=${h.rujukan} a security notice (${peristiwa}, ${untuk}) not sent (${h.alasan})`);
  };
  const tugas: Promise<void>[] = [kirim(PENERIMA_KEAMANAN, "ADMIN")];
  if (pemilik) {
    const { data } = await supabaseService().auth.admin.getUserById(pemilik);
    const alamat = data?.user?.email ? normalisasiAlamat(data.user.email) : null;
    if (alamat) tugas.push(kirim(alamat, "PEMILIK"));
  }
  if (alamatLama) tugas.push(Promise.resolve().then(() => kirim(normalisasiAlamat(alamatLama), "PEMILIK")));
  const hasil = await Promise.allSettled(tugas);
  for (const r of hasil) {
    if (r.status === "rejected") console.error(`[keamanan] a security notice (${peristiwa}) failed: ${r.reason instanceof Error ? r.reason.name : "unknown"}`);
  }
}
