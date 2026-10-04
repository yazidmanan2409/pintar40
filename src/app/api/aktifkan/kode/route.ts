import { after, type NextRequest } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { asalSendiri } from "@/lib/kartu-masuk";
import { HALAMAN_AKTIVASI } from "@/lib/aktivasi-kontrak";
import { mintaKode } from "@/lib/aktivasi";
import { kirimKodeAktivasi } from "@/app/api/_email/identitas";
import { jawab, kembaliKe } from "../_jawab";

/**
 * BOB-26: ASK FOR AN ACTIVATION CODE, served at `/aktifkan/kode` (next.config.ts
 * rewrites it here; the proxy lists it as public). Under src/app/api/ because
 * the lookup and the send are service-role (F01-S03); anon executes nothing.
 *
 * The same answer for every well-formed address (C1, D2). The code is issued
 * and sent after the answer has gone, so the answer never waits on it. The
 * decision is src/lib/aktivasi.ts (mintaKode).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return kembaliKe(HALAMAN_AKTIVASI);
}

export async function POST(request: NextRequest) {
  const origin = asalSendiri(request.headers, process.env.NEXT_PUBLIC_APP_URL ?? null);
  const fd = origin ? await request.formData().catch(() => null) : null;
  const layanan = supabaseService();
  const hasil = await mintaKode(
    { origin, email: fd?.get("email"), ulang: fd?.get("ulang") },
    {
      sasaran: async (email) => {
        const { data, error } = await layanan.rpc("activation_code_target", { p_email: email });
        if (error) throw new Error(error.code ?? "no answer");
        const r = Array.isArray(data) ? data[0] : null;
        return r?.auth_user_id ? { authUserId: String(r.auth_user_id), nama: String(r.nama ?? "") } : null;
      },
      jedaKirimUlang: async () => {
        const { data, error } = await layanan.rpc("email_resend_seconds");
        if (error || typeof data !== "number") throw new Error(error?.code ?? "no answer");
        return data;
      },
      kirim: async (s, ulang) => {
        const h = await kirimKodeAktivasi(s, ulang);
        if (h && !h.terkirim) console.error(`[aktifkan/kode] ref=${h.rujukan} not sent (${h.alasan})`);
      },
      nanti: (kerja) => after(kerja),
      catatGalat: (ref, apa) => console.error(`[aktifkan/kode] ref=${ref} ${apa}`),
    },
  );
  return jawab(hasil);
}
