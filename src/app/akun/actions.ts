"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { fotoMilik } from "@/lib/foto-profil-kontrak";

export type HasilFoto = { ok: true } | { ok: false; kode: "BELUM_MASUK" | "JALUR_TIDAK_SAH" | "BERKAS_TIDAK_ADA" | "GAGAL" };

/**
 * W2.8 (CR-07): THE PERSON'S OWN PHOTO IS RECORDED (or removed). Only a path in the person's own folder that the
 * upload actually wrote is kept; the update is the person's own, under row security (persons_update_own), with the
 * caller's client. The previous file stays in storage untouched (nothing is deleted from the private bucket here).
 */
export async function simpanFotoAksi(jalur: string | null): Promise<HasilFoto> {
  const supabase = await supabaseServer();
  const { data: aku } = await supabase.rpc("current_person_id");
  if (!aku) return { ok: false, kode: "BELUM_MASUK" };
  if (jalur !== null) {
    if (!fotoMilik(String(aku), jalur)) return { ok: false, kode: "JALUR_TIDAK_SAH" };
    const [folder, berkas] = [jalur.slice(0, jalur.lastIndexOf("/")), jalur.slice(jalur.lastIndexOf("/") + 1)];
    const { data: ada } = await supabaseService().storage.from("assets").list(folder, { search: berkas, limit: 1 });
    if (!ada?.some((o) => o.name === berkas)) return { ok: false, kode: "BERKAS_TIDAK_ADA" };
  }
  const { error } = await supabase.from("persons").update({ photo_path: jalur }).eq("id", aku);
  if (error) return { ok: false, kode: "GAGAL" };
  revalidatePath("/akun");
  return { ok: true };
}
