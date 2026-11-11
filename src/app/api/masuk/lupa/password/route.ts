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
import { catatAkuntabilitas } from "@/app/api/_akuntabilitas/catat";

/**
 * BOB-27: THE NEW PASSWORD, with the recovery grant, served at
 * `/masuk/lupa/password` (rewritten here; public). The grant gives the
 * one-minute RECOVERY permit (BOB-26's door, the only way a password hash is
 * written); Auth's admin write sets the password and ENDS EVERY SESSION of the
 * person (D-055(f)); the guard spends the grant; this browser then signs in
 * with the new password; the owner is told by email, after the answer. The
 * password is never logged or echoed. The decision is src/lib/pemulihan.ts.
 *
 * B1: once the answer is final, one event, method PASSWORD (src/app/api/_akuntabilitas/catat.ts): a success when this browser
 * signed in with the new password; otherwise the door's own refusal, or LAYANAN_TIDAK_TERSEDIA when the password was
 * set and the sign-in after it was not made. Nothing typed is sent: this door takes no identifier.
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
  let akun: string | null = null;
  let masukSebagai: string | null = null;
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
        akun = String(data);
        return email ? { authUserId: String(data), email } : null;
      },
      setel: async (id, password) => {
        const { error } = await layanan.auth.admin.updateUserById(id, { password });
        return { error: error ? { code: error.code, status: error.status, reasons: (error as { reasons?: string[] }).reasons } : null };
      },
      masuk: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        masukSebagai = error ? null : data.user?.id ?? null;
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
  await catatAkuntabilitas(request.headers, "masuk/lupa/password", hasil.body.ok && masukSebagai
    ? { jenis: "SIGN_IN_OK", cara: "PASSWORD", hasil: "OK", authUserId: masukSebagai }
    : { jenis: "SIGN_IN_FAILED", cara: "PASSWORD", hasil: hasil.body.ok ? "LAYANAN_TIDAK_TERSEDIA" : hasil.body.code, authUserId: akun });
  return jawab(hasil);
}
