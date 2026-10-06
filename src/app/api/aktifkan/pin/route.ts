import type { NextRequest } from "next/server";
import { STATUS_PIN, type KodePin } from "@/lib/aktivasi-kontrak";
import { jawab } from "../_jawab";
import { detailPr040, mulaiWizard, tidakTersedia } from "../_wizard";

/** BOB-26: set the caller's personal PIN (set_my_pin; BOB-24's blocklist and codes). Never echoed. */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const w = await mulaiWizard(request, { tulis: true, butuhRequired: true });
  if (!("supabase" in w)) return w;
  const pin = String(w.fd?.get("pin") ?? "");
  const { error } = await w.supabase.rpc("set_my_pin", { p_pin: pin });
  if (!error) return jawab({ status: 200, body: { ok: true } });
  const d = detailPr040(error);
  if (d && d in STATUS_PIN) return jawab({ status: STATUS_PIN[d as KodePin], body: { ok: false, code: d } });
  return tidakTersedia("the PIN could not be set", error?.code);
}
