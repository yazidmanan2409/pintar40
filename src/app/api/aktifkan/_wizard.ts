import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { asalSendiri } from "@/lib/kartu-masuk";
import { rujukan } from "@/lib/galat-kontrak";
import { jawab } from "./_jawab";

/**
 * BOB-26: WHAT EVERY WIZARD ROUTE CHECKS FIRST. Same origin on a POST; a
 * session; an account that has a set-up at all (a class card and a persona do
 * not, C13); and, unless the route is a read, a set-up still REQUIRED.
 *
 * Every write goes through the caller's own client, so the database decides
 * with the caller's JWT; the functions are the caller's own (BOB-24, BOB-26).
 */
export type Wizard = {
  supabase: Awaited<ReturnType<typeof supabaseServer>>;
  userId: string;
  email: string;
  keadaan: "REQUIRED" | "COMPLETE";
  fd: FormData | null;
};

export async function mulaiWizard(request: NextRequest, opsi: { tulis: boolean; butuhRequired: boolean }): Promise<Wizard | NextResponse> {
  if (opsi.tulis && !asalSendiri(request.headers, process.env.NEXT_PUBLIC_APP_URL ?? null)) {
    return jawab({ status: 403, body: { ok: false, code: "PERMINTAAN_DITOLAK" } });
  }
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jawab({ status: 401, body: { ok: false, code: "BELUM_MASUK" } });
  const { data: keadaan, error } = await supabase.rpc("my_setup_state");
  if (error || typeof keadaan !== "string") return tidakTersedia("the set-up state could not be read", error?.code);
  if (keadaan === "NOT_APPLICABLE") return jawab({ status: 403, body: { ok: false, code: "TIDAK_BERLAKU" } });
  if (opsi.butuhRequired && keadaan !== "REQUIRED") return jawab({ status: 409, body: { ok: false, code: "SETUP_SUDAH_SELESAI" } });
  const fd = opsi.tulis ? await request.formData().catch(() => null) : null;
  return { supabase, userId: user.id, email: user.email ?? "", keadaan: keadaan as Wizard["keadaan"], fd };
}

/** A refusal's stable code: PR040's DETAIL (D-011). */
export function detailPr040(e: { code?: string; details?: string } | null): string | null {
  return e?.code === "PR040" && typeof e.details === "string" ? e.details : null;
}

export function tidakTersedia(apa: string, kode?: string): NextResponse {
  const ref = rujukan();
  console.error(`[aktifkan] ref=${ref} ${apa}${kode ? ` (${kode})` : ""}`);
  return jawab({ status: 503, body: { ok: false, code: "LAYANAN_TIDAK_TERSEDIA", ref } });
}
