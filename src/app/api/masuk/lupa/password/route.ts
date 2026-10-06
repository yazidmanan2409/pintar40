import { after, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { alamatKlien, fetchBerpenerus } from "@/lib/auth-forwarding";
import { asalSendiri } from "@/lib/kartu-masuk";
import { HALAMAN_PEMULIHAN } from "@/lib/aktivasi-kontrak";
import { gantiPasswordPemulihan } from "@/lib/pemulihan";
import { kirimPasswordDiubah } from "@/app/api/_email/identitas";
import { tujuanMasuk } from "@/app/masuk/actions";
import { detailPr040 } from "@/app/api/aktifkan/_wizard";
import { jawab, kembaliKe } from "@/app/api/aktifkan/_jawab";
import { bacaIzin, buangIzin, hashIzin } from "../_izin";

/**
 * BOB-27: THE NEW PASSWORD, with the recovery grant, served at
 * `/masuk/lupa/password` (rewritten here; public). The grant gives the
 * one-minute RECOVERY permit (BOB-26's door, the only way a password hash is
 * written); Auth's admin write sets the password and ENDS EVERY SESSION of the
 * person (D-055(f)); the guard spends the grant; this browser then signs in
 * with the new password; the owner is told by email, after the answer. The
 * password is never logged or echoed. The decision is src/lib/pemulihan.ts.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return kembaliKe(HALAMAN_PEMULIHAN);
}

export async function POST(request: NextRequest) {
  const origin = asalSendiri(request.headers, process.env.NEXT_PUBLIC_APP_URL ?? null);
  const fd = origin ? await request.formData().catch(() => null) : null;
  const layanan = supabaseService();
  const supabase = await supabaseServer({ fetch: fetchBerpenerus(alamatKlien(request.headers)) });
  const token = await bacaIzin();
  const hasil = await gantiPasswordPemulihan(
    { origin, password: fd?.get("password") },
    {
      izin: async () => {
        if (!token) return null;
        const { data, error } = await layanan.rpc("recovery_grant_permit", { p_token_hash: hashIzin(token) });
        if (error) {
          if (detailPr040(error) === "RECOVERY_GRANT_INVALID") return null;
          throw new Error(error.code ?? "refused");
        }
        const { data: pengguna } = await layanan.auth.admin.getUserById(String(data));
        const email = pengguna?.user?.email;
        return email ? { authUserId: String(data), email } : null;
      },
      setel: async (id, password) => {
        const { error } = await layanan.auth.admin.updateUserById(id, { password });
        return { error: error ? { code: error.code, status: error.status, reasons: (error as { reasons?: string[] }).reasons } : null };
      },
      masuk: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? { status: error.status, code: error.code, name: error.name } : null };
      },
      buangIzin,
      kabari: async (id) => {
        const h = await kirimPasswordDiubah(id);
        if (h && !h.terkirim) console.error(`[masuk/lupa/password] ref=${h.rujukan} the password-changed email not sent (${h.alasan})`);
      },
      nanti: (kerja) => after(kerja),
      tujuan: () => tujuanMasuk(null),
      catatGalat: (ref, apa) => console.error(`[masuk/lupa/password] ref=${ref} ${apa}`),
    },
  );
  return jawab(hasil);
}
