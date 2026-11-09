import { type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { asalSendiri } from "@/lib/kartu-masuk";
import { kodeAkunDariGalat, type KodeAkun } from "@/lib/akun-kontrak";

/**
 * L4 (owner, 9 Nov; Sharon §16 finding 2 on 6faef690): «Hapus data pribadi», from the PINTAR Administrator's queue on
 * Konfigurasi · Keamanan, as its server action did before (no working-context check: the act is the platform's by
 * the database's rule). The reader's own client asks hapus_data_pribadi, which decides everything (an active
 * SYSTEM_ADMIN, a closed account, an open deletion request) and removes the name, the sign-in email and their copies in
 * one transaction. A database cannot delete a stored file, so only then does this route remove every file in the
 * person's photo folder (profile/<person_id>/, the one the upload route signs) with the service key, its one use here.
 * If a file could not be removed the answer says so (ACCOUNT_PHOTO_PENDING) with a press that finishes it:
 * hapus_data_pribadi answers a request it already carried out with the same person and writes nothing, and the folder
 * is read again. The answer goes back to the queue by a relative address (303).
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function kembali(hasil: "ok" | "gagal", kode?: KodeAkun, permintaan?: string): Response {
  const q = new URLSearchParams({ hasil });
  if (kode) q.set("kode", kode);
  // the request comes back with ACCOUNT_PHOTO_PENDING, so the answer can offer the press that finishes it
  if (permintaan && UUID.test(permintaan)) q.set("permintaan", permintaan);
  if (hasil === "ok") q.set("apa", "hapus");
  return new Response(null, { status: 303, headers: { Location: `/konfigurasi/keamanan?${q.toString()}#akun-platform` } });
}

/** Every file in the person's photo folder, removed; false when one could not be. */
async function hapusFolderFoto(orang: string): Promise<boolean> {
  if (!UUID.test(orang)) return false;
  const simpan = supabaseService().storage.from("assets");
  const folder = `profile/${orang}`;
  const { data, error } = await simpan.list(folder, { limit: 1000 });
  if (error) return false;
  const jalur = (data ?? []).filter((o) => o.name).map((o) => `${folder}/${o.name}`);
  if (jalur.length === 0) return true;
  const { error: e2 } = await simpan.remove(jalur);
  return !e2;
}

export async function POST(request: NextRequest) {
  const fd = await request.formData().catch(() => null);
  const permintaan = String(fd?.get("permintaan") ?? "");
  if (!asalSendiri(request.headers, process.env.NEXT_PUBLIC_APP_URL ?? null) || !UUID.test(permintaan)) return kembali("gagal", "ACCOUNT_REQUEST_INVALID");
  const caller = await supabaseServer();
  const { data, error } = await caller.rpc("hapus_data_pribadi", {
    p_request: permintaan, p_catatan: String(fd?.get("catatan") ?? "").trim() || null,
  });
  if (error) return kembali("gagal", kodeAkunDariGalat(error));
  const orang = String((data as { orang?: unknown } | null)?.orang ?? "");
  if (!(await hapusFolderFoto(orang))) {
    console.error("[hapus-data] the photo folder was not emptied");
    return kembali("gagal", "ACCOUNT_PHOTO_PENDING", permintaan);
  }
  return kembali("ok");
}
