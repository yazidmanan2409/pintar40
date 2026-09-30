import type { NextRequest } from "next/server";
import { jawab } from "../_jawab";
import { detailPr040, mulaiWizard, tidakTersedia } from "../_wizard";

/**
 * BOB-26 (D-077(1)): «Sudah benar», or «Ubah nama» then «Sudah benar».
 * confirm_my_name: once, audited (old and new name, who, when); refused after.
 * No `nama` field confirms the name as it is.
 */
export const dynamic = "force-dynamic";

const KODE: Record<string, [number, string]> = {
  NAME_INVALID: [422, "NAMA_TIDAK_SAH"],
  NAME_ALREADY_CONFIRMED: [409, "NAMA_SUDAH_DIKONFIRMASI"],
  SETUP_COMPLETE: [409, "SETUP_SUDAH_SELESAI"],
};

export async function POST(request: NextRequest) {
  const w = await mulaiWizard(request, { tulis: true, butuhRequired: true });
  if (!("supabase" in w)) return w;
  const { data: sebelum } = await w.supabase.rpc("my_setup_progress");
  const lama = (sebelum as { name?: string } | null)?.name ?? null;
  const diisi = w.fd?.get("nama");
  const { data, error } = await w.supabase.rpc("confirm_my_name", { p_name: typeof diisi === "string" ? diisi : null });
  if (!error && typeof data === "string") return jawab({ status: 200, body: { ok: true, nama: data, diubah: data !== lama } });
  const d = detailPr040(error);
  if (d && KODE[d]) return jawab({ status: KODE[d][0], body: { ok: false, code: KODE[d][1] } });
  return tidakTersedia("the name could not be confirmed", error?.code);
}
