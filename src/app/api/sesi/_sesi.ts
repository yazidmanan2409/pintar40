import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { asalSendiri } from "@/lib/kartu-masuk";
import { rujukan } from "@/lib/galat-kontrak";
import { idSesiDariToken } from "@/lib/penjaga-sesi";
import { jawab } from "@/app/api/aktifkan/_jawab";

/**
 * BOB-29 (Gate 6): WHAT EVERY SESSION ROUTE CHECKS FIRST. Same origin (each is a POST from PINTAR's own page), a
 * signed-in person, and the Auth session's id from the token Auth has just verified. The proxy has already refused
 * a locked session everywhere but the PIN (src/proxy.ts), and the database refuses one whatever reaches it.
 */
export type Sesi = { supabase: Awaited<ReturnType<typeof supabaseServer>>; user: User; idSesi: string };

export async function mulaiSesi(request: NextRequest): Promise<Sesi | NextResponse> {
  if (!asalSendiri(request.headers, process.env.NEXT_PUBLIC_APP_URL ?? null)) {
    return jawab({ status: 403, body: { ok: false, code: "PERMINTAAN_DITOLAK" } });
  }
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jawab({ status: 401, body: { ok: false, code: "BERAKHIR" } });
  const idSesi = idSesiDariToken((await supabase.auth.getSession()).data.session?.access_token);
  if (!idSesi) return tidakTersedia("the session id could not be read");
  return { supabase, user, idSesi };
}

export function tidakTersedia(apa: string, kode?: string): NextResponse {
  const ref = rujukan();
  console.error(`[sesi] ref=${ref} ${apa}${kode ? ` (${kode})` : ""}`);
  return jawab({ status: 503, body: { ok: false, code: "LAYANAN_TIDAK_TERSEDIA", ref } });
}
