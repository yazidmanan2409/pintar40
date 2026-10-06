import type { NextRequest } from "next/server";
import { STATUS_PIN_BARU, type KodePinBaru } from "@/lib/aktivasi-kontrak";
import { jawab } from "@/app/api/aktifkan/_jawab";
import { detailPr040, mulaiWizard, tidakTersedia } from "@/app/api/aktifkan/_wizard";

/**
 * BOB-28 (C5): A NEW PIN, on Akun saya. After a suspension is restored (an
 * email recovery, or the platform admin's audited reset) the old PIN matches
 * nothing and a new one is awaited; this is where the person sets it. The
 * caller's own, through set_my_pin (BOB-24's blocklist; a replaced PIN never
 * again). A finished account only: during activation the wizard sets the PIN.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const w = await mulaiWizard(request, { tulis: true, butuhRequired: false });
  if (!("supabase" in w)) return w;
  if (w.keadaan !== "COMPLETE") return jawab({ status: 403, body: { ok: false, code: "TIDAK_BERLAKU" } });
  const { error } = await w.supabase.rpc("set_my_pin", { p_pin: String(w.fd?.get("pin") ?? "") });
  if (!error) return jawab({ status: 200, body: { ok: true } });
  const d = detailPr040(error);
  if (d && d in STATUS_PIN_BARU) return jawab({ status: STATUS_PIN_BARU[d as KodePinBaru], body: { ok: false, code: d } });
  return tidakTersedia("the new PIN could not be set", error?.code);
}
