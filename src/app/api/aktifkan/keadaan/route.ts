import type { NextRequest } from "next/server";
import { PENGATURAN } from "@/lib/pengaturan-auth";
import { URUTAN_LANGKAH, type KeadaanAktivasi, type LangkahAktivasi } from "@/lib/aktivasi-kontrak";
import { jawab } from "../_jawab";
import { mulaiWizard, tidakTersedia } from "../_wizard";

/** BOB-26: where the caller's activation stands (my_setup_progress). The page reads it signed in. */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const w = await mulaiWizard(request, { tulis: false, butuhRequired: false });
  if (!("supabase" in w)) return w;
  const { data, error } = await w.supabase.rpc("my_setup_progress");
  if (error || !data) return tidakTersedia("the set-up progress could not be read", error?.code);
  const p = data as { state: string; username: string | null; password: boolean; pin: boolean; name: string; name_confirmed: boolean; staff: boolean; pintar_id: string | null };
  const selesai: Record<LangkahAktivasi, boolean> = { USERNAME: !!p.username, PASSWORD: !!p.password, PIN: !!p.pin, NAMA: !!p.name_confirmed };
  const body: KeadaanAktivasi = {
    ok: true,
    keadaan: w.keadaan,
    berikutnya: w.keadaan === "COMPLETE" ? null : (URUTAN_LANGKAH.find((l) => !selesai[l]) ?? "SELESAI"),
    langkah: { username: p.username, password: !!p.password, pin: !!p.pin, nama: { nama: p.name, dikonfirmasi: !!p.name_confirmed } },
    staf: !!p.staff,
    pintarId: p.staff ? p.pintar_id : null,
    aturanPassword: PENGATURAN.aturanPassword,
    berlakuMenit: PENGATURAN.berlakuMenit,
  };
  return jawab({ status: 200, body });
}
