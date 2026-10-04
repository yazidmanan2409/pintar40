import type { NextRequest } from "next/server";
import { STATUS_USERNAME, type KodeUsername } from "@/lib/aktivasi-kontrak";
import { jawab } from "../_jawab";
import { detailPr040, mulaiWizard, tidakTersedia } from "../_wizard";

/** BOB-26: claim the caller's username, once (claim_username; C9's rules and codes, BOB-24). */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const w = await mulaiWizard(request, { tulis: true, butuhRequired: true });
  if (!("supabase" in w)) return w;
  const { data, error } = await w.supabase.rpc("claim_username", { p_name: String(w.fd?.get("username") ?? "") });
  if (!error && typeof data === "string") return jawab({ status: 200, body: { ok: true, username: data } });
  const d = detailPr040(error);
  if (d && d in STATUS_USERNAME) return jawab({ status: STATUS_USERNAME[d as KodeUsername], body: { ok: false, code: d } });
  return tidakTersedia("the username could not be claimed", error?.code);
}
