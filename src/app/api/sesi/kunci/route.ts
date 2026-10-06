import type { NextRequest } from "next/server";
import { jawab } from "@/app/api/aktifkan/_jawab";
import { mulaiSesi, tidakTersedia } from "../_sesi";

/**
 * BOB-29: THE SCREEN SAW 5 MINUTES WITHOUT ACTIVITY, across all its tabs: the session locks now, before the
 * screen shows «PINTAR terkunci», so the screen and the server never disagree about it. Locking early is always
 * safe; nothing here unlocks.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const s = await mulaiSesi(request);
  if (!("supabase" in s)) return s;
  const { error } = await s.supabase.rpc("sesi_kunci_saya");
  if (error && error.code !== "PT423") return tidakTersedia("the session could not be locked", error.code);
  return jawab({ status: 200, body: { ok: true } });
}
