import type { NextRequest } from "next/server";
import { COOKIE_PERANGKAT, COOKIE_PRIBADI, hashPerangkat, nilaiPribadi, umurSesiMode } from "@/lib/penjaga-sesi";
import { detailPr040 } from "@/app/api/aktifkan/_wizard";
import { jawab } from "@/app/api/aktifkan/_jawab";
import { mulaiSesi, tidakTersedia } from "../_sesi";

/**
 * BOB-29 (C11): «KOMPUTER SIAPA INI?», answered. For this browser (its httpOnly device value, which the proxy gave
 * it) and this staff person: SHARED, the default and safer choice, or PERSONAL. This session follows the answer at
 * once. A declaration, not proof of ownership; audited. A class card and a persona are never asked (C13, T1).
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const s = await mulaiSesi(request);
  if (!("supabase" in s)) return s;
  const fd = await request.formData().catch(() => null);
  const mode = String(fd?.get("mode") ?? "");
  if (mode !== "SHARED" && mode !== "PERSONAL") return jawab({ status: 400, body: { ok: false, code: "PILIHAN_TIDAK_SAH" } });
  const alat = hashPerangkat(request.cookies.get(COOKIE_PERANGKAT)?.value);
  if (!alat) return jawab({ status: 409, body: { ok: false, code: "PERANGKAT_TIDAK_DIKENAL" } });
  const { error } = await s.supabase.rpc("sesi_tetapkan_perangkat", { p_perangkat: alat, p_mode: mode });
  if (detailPr040(error) === "PERANGKAT_TIDAK_BERLAKU") return jawab({ status: 403, body: { ok: false, code: "TIDAK_BERLAKU" } });
  if (error) return tidakTersedia("the computer's answer could not be kept", error.code);
  const res = jawab({ status: 200, body: { ok: true, mode } });
  const tanda = mode === "PERSONAL" ? nilaiPribadi(s.idSesi) : null;
  const aman = request.nextUrl.protocol === "https:";
  if (tanda) res.cookies.set(COOKIE_PRIBADI, tanda, { path: "/", sameSite: "lax", httpOnly: true, secure: aman, maxAge: umurSesiMode("PERSONAL", s.user.email) });
  else res.cookies.set(COOKIE_PRIBADI, "", { path: "/", maxAge: 0 });
  return res;
}
