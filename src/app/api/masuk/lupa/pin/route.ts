import { after, type NextRequest } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { alamatKlien } from "@/lib/auth-forwarding";
import { asalSendiri } from "@/lib/kartu-masuk";
import { HALAMAN_PEMULIHAN } from "@/lib/aktivasi-kontrak";
import { periksaPinPemulihan, type HasilCobaPin } from "@/lib/pemulihan";
import { kirimPemberitahuanKeamanan } from "@/app/api/_email/keamanan";
import { jawab, kembaliKe } from "@/app/api/aktifkan/_jawab";
import { hashIzin, simpanIzin, tokenIzinBaru } from "../_izin";

/**
 * BOB-28: RECOVER WITH A PINTAR ID AND THE PERSONAL PIN, served at
 * `/masuk/lupa/pin` (rewritten here; public). The same door whether the ID was
 * typed or reached from a card's QR (/id/<ID>): one ladder, one counter. The
 * caller's address is counted first; the ladder is the typed ID's
 * (recovery_by_pin). A match signs nobody in: it gives the browser Gate 4's
 * grant, and /masuk/lupa/password sets the new password. The owner and the
 * platform admin are told after the answer. The decision is src/lib/pemulihan.ts.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return kembaliKe(HALAMAN_PEMULIHAN);
}

const HASIL = new Set(["MALFORMED", "WRONG", "LOCKED", "SUSPENDED", "OK", "NOT_ELIGIBLE"]);
const PERISTIWA = new Set(["TERKUNCI", "DITANGGUHKAN", "PULIH_PIN"]);

export async function POST(request: NextRequest) {
  const origin = asalSendiri(request.headers, process.env.NEXT_PUBLIC_APP_URL ?? null);
  const fd = origin ? await request.formData().catch(() => null) : null;
  const layanan = supabaseService();
  const hasil = await periksaPinPemulihan(
    { origin, id: fd?.get("id"), pin: fd?.get("pin"), alamat: alamatKlien(request.headers) },
    {
      catat: async (kunci) => {
        const { data, error } = await layanan.rpc("identity_attempt", { p_scope: "RECOVERY_PIN", p_kunci: kunci });
        if (error || typeof data !== "number") throw new Error(error?.code ?? "no answer");
        return data;
      },
      selesaikan: async (kunci, h) => {
        const { error } = await layanan.rpc("identity_attempt_settle", { p_scope: "RECOVERY_PIN", p_kunci: kunci, p_hasil: h });
        if (error) throw new Error(error.code ?? "refused");
      },
      izinBaru: () => {
        const token = tokenIzinBaru();
        return { token, hash: hashIzin(token) };
      },
      coba: async (pintarId, pin, hash) => {
        const { data, error } = await layanan.rpc("recovery_by_pin", { p_typed_id: pintarId, p_pin: pin, p_token_hash: hash });
        const r = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : undefined;
        if (error || !r || !HASIL.has(String(r.outcome))) throw new Error(error?.code ?? "no answer");
        return {
          outcome: String(r.outcome) as HasilCobaPin["outcome"],
          tunggu: typeof r.wait_seconds === "number" ? r.wait_seconds : null,
          notice: PERISTIWA.has(String(r.notice)) ? (String(r.notice) as HasilCobaPin["notice"]) : null,
          pemilik: typeof r.owner_auth_user === "string" ? r.owner_auth_user : null,
        };
      },
      simpanIzin: (token) => simpanIzin(token, request.nextUrl.protocol === "https:"),
      kabari: (peristiwa, pintarId, pemilik) => kirimPemberitahuanKeamanan(peristiwa, pintarId, pemilik),
      nanti: (kerja) => after(kerja),
      catatGalat: (ref, apa) => console.error(`[masuk/lupa/pin] ref=${ref} ${apa}`),
    },
  );
  return jawab(hasil);
}
