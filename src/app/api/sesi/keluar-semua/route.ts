import type { NextRequest } from "next/server";
import { keluarSemuaPerangkat } from "@/lib/keluar";
import { COOKIE_JAGA, COOKIE_PRIBADI } from "@/lib/penjaga-sesi";
import { COOKIE_HADIR, COOKIE_SELESAI, opsiTanda } from "@/lib/tanda-keluar";
import { jawab } from "@/app/api/aktifkan/_jawab";
import { mulaiSesi, tidakTersedia } from "../_sesi";

/**
 * BOB-29: «KELUAR DARI SEMUA PERANGKAT», after Akun saya asked for confirmation. Every session of this person ends,
 * this one too (src/lib/keluar.ts); each is recorded and audited. The person signs in again where they need to.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const s = await mulaiSesi(request);
  if (!("supabase" in s)) return s;
  if (!(await keluarSemuaPerangkat(s.supabase))) return tidakTersedia("the sessions could not be ended");
  const res = jawab({ status: 200, body: { ok: true } });
  res.cookies.set(COOKIE_PRIBADI, "", { path: "/", maxAge: 0 });
  res.cookies.set(COOKIE_JAGA, "", { path: "/", maxAge: 0 });
  // L3 (D-132(e)): every session's context ended with it; this browser is marked like any sign-out
  res.cookies.set(COOKIE_HADIR, "", { path: "/", maxAge: 0 });
  res.cookies.set(COOKIE_SELESAI, "1", opsiTanda(request.nextUrl.protocol === "https:"));
  return res;
}
