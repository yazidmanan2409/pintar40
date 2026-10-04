import type { NextRequest } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { deriveCardSecret } from "@/lib/card";
import { keluarPerangkatIni } from "@/lib/keluar";
import { bacaPenjagaan, pinSahUntuk } from "@/lib/penjaga-sesi";
import { nomorKartuDariAlamat } from "@/lib/sesi";
import { jawab } from "@/app/api/aktifkan/_jawab";
import { mulaiSesi, tidakTersedia } from "../_sesi";

/**
 * BOB-29 (IDENTITY-4.0 §3, C4; T1): THE PIN ON «PINTAR TERKUNCI». Only this browser's own live, locked session can
 * be resumed, by its own person: a staff person's personal PIN, a class card's card PIN (derived with the pepper
 * and checked against the card's Auth password, as at sign-in; never stored). A match opens the session; the third
 * wrong PIN ends it (that session only, D-055); the resume counter is not the recovery counter (§3). A wrongly
 * shaped PIN is refused without counting: it could not be anybody's.
 *
 * The decision is the database's (sesi_buka, service role, for the session this request's verified token names).
 */
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const s = await mulaiSesi(request);
  if (!("supabase" in s)) return s;
  const { data, error } = await s.supabase.rpc("sesi_periksa");
  const jaga = error ? null : bacaPenjagaan(data);
  if (!jaga) return tidakTersedia("the session state could not be read", error?.code);
  if (jaga.keadaan === "BUKA" || jaga.keadaan === "TANPA") return jawab({ status: 200, body: { ok: true, keadaan: "BUKA" } });
  if (jaga.keadaan === "BERAKHIR" || !jaga.mode) {
    await keluarPerangkatIni(s.supabase);
    return jawab({ status: 401, body: { ok: false, code: "BERAKHIR" } });
  }
  if (!jaga.bisaPin) return jawab({ status: 409, body: { ok: false, code: "TANPA_PIN" } });

  const fd = await request.formData().catch(() => null);
  const pin = String(fd?.get("pin") ?? "").replace(/\s+/g, "");
  if (!pinSahUntuk(jaga.mode, pin)) return jawab({ status: 400, body: { ok: false, code: "PIN_TIDAK_SAH" } });
  let rahasia = pin;
  if (jaga.mode === "CARD") {
    const nomor = nomorKartuDariAlamat(s.user.email);
    if (!nomor) return tidakTersedia("a card session without a card address");
    rahasia = deriveCardSecret(nomor, pin);
  }

  const { data: hasil, error: gagal } = await supabaseService().rpc("sesi_buka", {
    p_sesi: s.idSesi, p_auth_user: s.user.id, p_rahasia: rahasia });
  const o = (hasil && typeof hasil === "object" ? hasil : {}) as { keadaan?: unknown; percobaan_sisa?: unknown };
  if (gagal) return tidakTersedia("the PIN could not be checked", gagal.code);
  if (o.keadaan === "BUKA") return jawab({ status: 200, body: { ok: true, keadaan: "BUKA" } });
  if (o.keadaan === "TERKUNCI" && (o.percobaan_sisa === 1 || o.percobaan_sisa === 2)) {
    return jawab({ status: 403, body: { ok: false, code: "PIN_SALAH", percobaanSisa: o.percobaan_sisa } });
  }
  // the third wrong PIN, 60 minutes locked, or no session to resume: this device signs in again
  await keluarPerangkatIni(s.supabase);
  return jawab({ status: 401, body: { ok: false, code: "BERAKHIR" } });
}
