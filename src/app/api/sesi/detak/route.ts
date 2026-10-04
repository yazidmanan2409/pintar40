import type { NextRequest } from "next/server";
import { jawab } from "@/app/api/aktifkan/_jawab";
import { mulaiSesi, tidakTersedia } from "../_sesi";

/**
 * BOB-29: ACTIVITY ON THE SCREEN (a key, a click, a scroll, a playing video), sent at most once a minute by the
 * inactivity clock (src/components/PenjagaSesi.tsx). Keeps an open session open; refused while locked (by the
 * proxy, and by the database), so activity never unlocks.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const s = await mulaiSesi(request);
  if (!("supabase" in s)) return s;
  const { error } = await s.supabase.rpc("sesi_detak");
  if (error?.code === "PT423") return jawab({ status: 423, body: { ok: false, code: "TERKUNCI" } });
  if (error) return tidakTersedia("the activity could not be recorded", error.code);
  return jawab({ status: 200, body: { ok: true } });
}
