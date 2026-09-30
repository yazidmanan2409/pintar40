import type { NextRequest } from "next/server";
import { appUrl } from "@/lib/env";
import { kartuDariDb } from "@/app/api/_email/identitas";
import { jawab } from "@/app/api/aktifkan/_jawab";
import { detailPr040, mulaiWizard, tidakTersedia } from "@/app/api/aktifkan/_wizard";

/**
 * BOB-26: THE CARD'S DATA, for Akun saya and the welcome screen
 * (my_identity_card): the current name, the PINTAR ID, the public ID link the
 * QR encodes, and the current role and school read now (D-059). Staff only
 * (C17); a statement, never authority.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const w = await mulaiWizard(request, { tulis: false, butuhRequired: false });
  if (!("supabase" in w)) return w;
  const { data, error } = await w.supabase.rpc("my_identity_card");
  if (error) {
    if (detailPr040(error) === "IDENTITY_NOT_ELIGIBLE") return jawab({ status: 403, body: { ok: false, code: "TIDAK_BERLAKU" } });
    return tidakTersedia("the card could not be read", error.code);
  }
  const kartu = kartuDariDb(data, appUrl());
  if (!kartu) return tidakTersedia("the card's data was not whole");
  return jawab({ status: 200, body: { ok: true, kartu } });
}
