import type { NextRequest } from "next/server";
import { appUrl } from "@/lib/env";
import { kartuDariDb, kirimKartu } from "@/app/api/_email/identitas";
import { jawab } from "@/app/api/aktifkan/_jawab";
import { detailPr040, mulaiWizard, tidakTersedia } from "@/app/api/aktifkan/_wizard";

/**
 * BOB-26 (D-079): SEND THE CARD AGAIN, to the signed-in staff person's own
 * address, through BOB-25 and its limits like any other send. This is where a
 * card the limits refused at activation is sent later.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const w = await mulaiWizard(request, { tulis: true, butuhRequired: false });
  if (!("supabase" in w)) return w;
  const { data, error } = await w.supabase.rpc("my_identity_card");
  if (error) {
    if (detailPr040(error) === "IDENTITY_NOT_ELIGIBLE") return jawab({ status: 403, body: { ok: false, code: "TIDAK_BERLAKU" } });
    return tidakTersedia("the card could not be read", error.code);
  }
  const asal = appUrl();
  const kartu = kartuDariDb(data, asal);
  if (!kartu || !w.email) return tidakTersedia("the card's data was not whole");
  try {
    const h = await kirimKartu(w.email, kartu, asal);
    return jawab({ status: 200, body: h.terkirim ? { ok: true, kartu: "TERKIRIM" } : { ok: true, kartu: "BELUM_TERKIRIM" } });
  } catch (e) {
    return tidakTersedia(`the card email could not be sent (${e instanceof Error ? e.name : "unknown"})`);
  }
}
