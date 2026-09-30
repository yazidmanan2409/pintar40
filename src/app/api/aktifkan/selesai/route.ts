import type { NextRequest } from "next/server";
import { appUrl } from "@/lib/env";
import { URUTAN_LANGKAH, type LangkahAktivasi, type StatusKartuEmail } from "@/lib/aktivasi-kontrak";
import { tujuanMasuk } from "@/app/masuk/actions";
import { kartuDariDb, kirimKartu } from "@/app/api/_email/identitas";
import { jawab } from "../_jawab";
import { detailPr040, mulaiWizard, tidakTersedia } from "../_wizard";

/**
 * BOB-26: FINISH. complete_my_setup (the username, the PIN, the password and
 * the name's confirmation, all four); then, for staff only (C17), the PINTAR
 * Digital Card by email through BOB-25. A card the limits or the host refuse
 * is BELUM_TERKIRIM: the set-up is still complete, and the card waits in Akun
 * saya to be sent again (D-079). The person goes to their D-010 home.
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const w = await mulaiWizard(request, { tulis: true, butuhRequired: true });
  if (!("supabase" in w)) return w;
  const { error } = await w.supabase.rpc("complete_my_setup");
  if (error) {
    if (detailPr040(error) === "SETUP_INCOMPLETE") {
      const { data } = await w.supabase.rpc("my_setup_progress");
      const p = (data ?? {}) as { username?: string | null; password?: boolean; pin?: boolean; name_confirmed?: boolean };
      const ada: Record<LangkahAktivasi, boolean> = { USERNAME: !!p.username, PASSWORD: !!p.password, PIN: !!p.pin, NAMA: !!p.name_confirmed };
      return jawab({ status: 409, body: { ok: false, code: "SETUP_BELUM_LENGKAP", kurang: URUTAN_LANGKAH.filter((l) => !ada[l]) } });
    }
    return tidakTersedia("the set-up could not be completed", error.code);
  }
  let kartu: StatusKartuEmail = "TIDAK_ADA";
  const { data: dataKartu, error: galatKartu } = await w.supabase.rpc("my_identity_card");
  if (!galatKartu) {
    const asal = appUrl();
    const k = kartuDariDb(dataKartu, asal);
    kartu = "BELUM_TERKIRIM";
    if (k && w.email) {
      try {
        kartu = (await kirimKartu(w.email, k, asal)).terkirim ? "TERKIRIM" : "BELUM_TERKIRIM";
      } catch (e) {
        console.error(`[aktifkan/selesai] the card email could not be sent (${e instanceof Error ? e.name : "unknown"})`);
      }
    }
  } else if (detailPr040(galatKartu) !== "IDENTITY_NOT_ELIGIBLE") {
    kartu = "BELUM_TERKIRIM";
  }
  return jawab({ status: 200, body: { ok: true, tujuan: await tujuanMasuk(null), kartu } });
}
