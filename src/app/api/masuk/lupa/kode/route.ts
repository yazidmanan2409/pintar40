import { after, type NextRequest } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { asalSendiri } from "@/lib/kartu-masuk";
import { HALAMAN_PEMULIHAN } from "@/lib/aktivasi-kontrak";
import { mintaKodePemulihan } from "@/lib/pemulihan";
import { kirimKodePemulihan } from "@/app/api/_email/identitas";
import { alatTunggu } from "@/app/api/_email/tunggu";
import { jawab, kembaliKe } from "@/app/api/aktifkan/_jawab";

/**
 * BOB-27: ASK FOR A PASSWORD RECOVERY CODE, served at `/masuk/lupa/kode`
 * (next.config.ts rewrites it here; the proxy lists it as public). The same
 * answer for every name; D-098(c)'s waits first; a code only to an active
 * email account, after the answer has gone. The decision is src/lib/pemulihan.ts.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return kembaliKe(HALAMAN_PEMULIHAN);
}

export async function POST(request: NextRequest) {
  const origin = asalSendiri(request.headers, process.env.NEXT_PUBLIC_APP_URL ?? null);
  const fd = origin ? await request.formData().catch(() => null) : null;
  const layanan = supabaseService();
  const hasil = await mintaKodePemulihan(
    { origin, nama: fd?.get("nama") },
    {
      ...alatTunggu(layanan),
      sasaran: async (nama) => {
        const { data, error } = await layanan.rpc("recovery_code_target", { p_identitas: nama });
        if (error) throw new Error(error.code ?? "no answer");
        const r = Array.isArray(data) ? data[0] : null;
        return r?.auth_user_id ? { authUserId: String(r.auth_user_id), nama: String(r.nama ?? "") } : null;
      },
      kirim: async (s) => {
        const h = await kirimKodePemulihan(s);
        if (h && !h.terkirim) console.error(`[masuk/lupa/kode] ref=${h.rujukan} not sent (${h.alasan})`);
      },
      nanti: (kerja) => after(kerja),
      catatGalat: (ref, apa) => console.error(`[masuk/lupa/kode] ref=${ref} ${apa}`),
    },
  );
  return jawab(hasil);
}
