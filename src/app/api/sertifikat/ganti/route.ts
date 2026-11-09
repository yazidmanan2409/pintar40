import { type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { asalSendiri } from "@/lib/kartu-masuk";
import { sasaranDalamKonteks } from "@/lib/konteks-server";
import { sekolahSertifikat } from "@/lib/sertifikat-sekolah";
import { assertKeyringUsable, signingKeyVersion, signPayload } from "@/lib/certificates/keyring";
import { type CanonicalPayload } from "@/lib/certificates/sign";
import { kodeGantiDariGalat, type KodeGanti } from "@/lib/sertifikat-cabut-kontrak";

/**
 * W2.22 (owner, 9 Nov): «TERBITKAN ULANG», the replacement of an erroneous issued certificate. A form posts here from
 * the certificate's panel on Konfigurasi · Sertifikat, and the answer goes back to that panel (303).
 *
 * THE SPLIT, AS AT ISSUANCE (/api/certificates/issue). The reader's own client asks sertifikat_koreksi_siapkan, which
 * decides everything: CAN_PUBLISH in the certificate's school, an ISSUED original, a reason of 10–300 characters, and
 * something that would change. It prepares the replacement, not yet public. Only then does this route sign its payload
 * with the keyring and seal it with the service client (sertifikat_koreksi_segel, service only), which supersedes the
 * original in the same transaction. Before any of it, the certificate's school must be the working context's
 * (CONTEXT_OTHER_PLACE otherwise). A failed signature leaves the original as it was; pressing again signs the same
 * replacement.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// the answer goes back to the panel by a relative address: the host the request names is never trusted to build it
function kembali(_request: NextRequest, id: string, hasil: "ok" | "gagal", kode?: KodeGanti | "CONTEXT_OTHER_PLACE"): Response {
  const q = new URLSearchParams({ pilih: id, hasil, jenis: "ganti" });
  if (kode) q.set("kode", kode);
  return new Response(null, { status: 303, headers: { Location: `/konfigurasi/sertifikat?${q.toString()}#cabut` } });
}

export async function POST(request: NextRequest) {
  const fd = await request.formData().catch(() => null);
  const id = String(fd?.get("sertifikat") ?? "");
  const alasan = String(fd?.get("alasan") ?? "").trim();
  if (!asalSendiri(request.headers, process.env.NEXT_PUBLIC_APP_URL ?? null) || !UUID.test(id)) return kembali(request, UUID.test(id) ? id : "", "gagal", "TIDAK_DITEMUKAN");
  if (!(await sasaranDalamKonteks({ sekolah: await sekolahSertifikat(id), atauPlatform: true }))) return kembali(request, id, "gagal", "CONTEXT_OTHER_PLACE");
  try {
    assertKeyringUsable();
  } catch {
    return kembali(request, id, "gagal", "LAYANAN_TIDAK_TERSEDIA");
  }
  const versi = signingKeyVersion();
  const caller = await supabaseServer();
  const { data, error } = await caller.rpc("sertifikat_koreksi_siapkan", { p_certificate: id, p_reason: alasan, p_key_version: versi });
  const baris = Array.isArray(data) ? (data[0] as { certificate_id: string; canonical_payload: CanonicalPayload } | undefined) : undefined;
  if (error || !baris) return kembali(request, id, "gagal", kodeGantiDariGalat(error));
  const { error: e2 } = await supabaseService().rpc("sertifikat_koreksi_segel", {
    p_replacement: baris.certificate_id, p_key_version: versi, p_signature: signPayload(baris.canonical_payload, versi),
  });
  if (e2) return kembali(request, id, "gagal", kodeGantiDariGalat(e2));
  return kembali(request, id, "ok");
}
