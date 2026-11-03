import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { asalSendiri } from "@/lib/kartu-masuk";
import { fotoMilik } from "@/lib/foto-profil-kontrak";

/**
 * W2.8 (Batch 4, CR-07, J8.8): THE PERSON'S OWN PHOTO IS RECORDED, OR REMOVED. Only a path in the person's own folder
 * (the one signed upload route decides the folder) that the upload actually wrote is kept: the service key's one use
 * here is to look in that folder, since no client holds a bucket policy. The update itself is the person's own, under
 * row security (persons_update_own, the photo column's own grant), with the caller's client. The previous file stays
 * in storage untouched: nothing is deleted from the private bucket here.
 *
 * Answers { ok: true } or { ok: false, kode } with BELUM_MASUK (401), JALUR_TIDAK_SAH (400), BERKAS_TIDAK_ADA (404),
 * PERMINTAAN_DITOLAK (403, another origin) or GAGAL (500).
 */
export async function POST(request: NextRequest) {
  if (!asalSendiri(request.headers, process.env.NEXT_PUBLIC_APP_URL ?? null)) return jawab(403, "PERMINTAAN_DITOLAK");
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jawab(401, "BELUM_MASUK");
  const { data: aku } = await supabase.rpc("current_person_id");
  if (!aku) return jawab(401, "BELUM_MASUK");
  const body = (await request.json().catch(() => null)) as { jalur?: unknown } | null;
  const jalur = body?.jalur === null ? null : typeof body?.jalur === "string" ? body.jalur : undefined;
  if (jalur === undefined) return jawab(400, "JALUR_TIDAK_SAH");
  if (jalur !== null) {
    if (!fotoMilik(String(aku), jalur)) return jawab(400, "JALUR_TIDAK_SAH");
    const folder = jalur.slice(0, jalur.lastIndexOf("/"));
    const berkas = jalur.slice(jalur.lastIndexOf("/") + 1);
    const { data: ada } = await supabaseService().storage.from("assets").list(folder, { search: berkas, limit: 1 });
    if (!ada?.some((o) => o.name === berkas)) return jawab(404, "BERKAS_TIDAK_ADA");
  }
  const { error } = await supabase.from("persons").update({ photo_path: jalur }).eq("id", aku);
  if (error) return jawab(500, "GAGAL");
  revalidatePath("/akun");
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

function jawab(status: number, kode: string) {
  return NextResponse.json({ ok: false, kode }, { status, headers: { "Cache-Control": "no-store" } });
}
